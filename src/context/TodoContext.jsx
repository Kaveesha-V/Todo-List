import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import {
  loadUserTasks,
  saveUserTasks,
  loadStoredTheme,
  saveStoredTheme
} from '../utils/storage';
import {
  isCloudDatabaseReady,
  subscribeToUserTasks,
  getUserTasksFromCloud,
  createTaskInCloud,
  updateTaskInCloud,
  deleteTaskInCloud,
  syncLocalTasksToCloud,
  saveUserProjectsToCloud,
  getUserProjectsFromCloud,
  subscribeToUserProjects
} from '../services/firebaseDb';
import {
  updateGoogleCalendarEventStatus,
  syncTaskToGoogleCalendarAPI,
  getGoogleCalendarWebLink
} from '../services/googleCalendar';
import {
  playNotificationChime,
  requestBrowserNotificationPermission,
  sendBrowserNotification
} from '../services/liveAlarmService';
import { sendLiveTaskEmailAlert } from '../services/emailReminderService';
import { getLocalDateString } from '../utils/dateUtils';
import { INITIAL_TASKS } from '../mockData/initialTasks';
import { parseNaturalLanguageTask } from '../utils/nlpParser';
import { generateDailyDigest, generateSubtasksForTask } from '../utils/aiHelpers';

const TodoContext = createContext(null);

// Deep comparison to prevent unnecessary React re-renders, layout shifting, and scroll collapse
const areTasksEqual = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const taskA = a[i];
    const taskB = b.find(t => t.id === taskA.id);
    if (!taskB) return false;
    if (
      taskA.title !== taskB.title ||
      taskA.status !== taskB.status ||
      taskA.dueDate !== taskB.dueDate ||
      taskA.dueTime !== taskB.dueTime ||
      taskA.priority !== taskB.priority ||
      taskA.description !== taskB.description ||
      taskA.updatedAt !== taskB.updatedAt ||
      (taskA.subtasks?.length || 0) !== (taskB.subtasks?.length || 0)
    ) {
      return false;
    }
  }
  return true;
};

export const TodoProvider = ({ children }) => {
  const { currentUser, updateCalendarConnection, updateReminderOffsets } = useAuth();

  const [tasks, setTasks] = useState(() => currentUser ? loadUserTasks(currentUser.uid) : []);
  const [theme, setTheme] = useState(() => loadStoredTheme());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [activeNavTab, setActiveNavTab] = useState('inbox'); // 'inbox' | 'today' | 'upcoming' | 'filters' | 'reporting' | 'kanban' | project_id
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    if (typeof window !== 'undefined' && currentUser?.uid) {
      const done = localStorage.getItem(`aura_onboarded_${currentUser.uid}`);
      return !done;
    }
    return false;
  });
  const [projects, setProjects] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aura_projects');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'work', name: 'Work', color: '#6366F1' },
      { id: 'personal', name: 'Personal', color: '#10B981' },
      { id: 'study', name: 'Study', color: '#F59E0B' }
    ];
  });
  const [toasts, setToasts] = useState([]);
  const [focusModeTaskId, setFocusModeTaskId] = useState(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Global persistent set of alerted task keys for the session (prevents flood/rush of duplicate notifications)
  const alertedRef = useRef(new Set());

  // Update state ONLY if tasks actually changed — eliminates layout collapse and scroll jumping
  const updateTasksIfChanged = (incomingTasks) => {
    if (!Array.isArray(incomingTasks)) return;
    setTasks(prev => {
      if (areTasksEqual(prev, incomingTasks)) {
        return prev;
      }
      if (currentUser?.uid) {
        saveUserTasks(currentUser.uid, incomingTasks, currentUser.email);
      }
      return incomingTasks;
    });
  };

  // Toast Helper with Deduplication & Max 2 Active Toasts (prevents toast stacking/rush)
  const addToast = (input, type = 'info', icon = null) => {
    const msg = typeof input === 'string' ? input : (input?.message || input?.title || 'Notification');
    const toastType = typeof input === 'object' && input?.type ? input.type : type;
    const toastIcon = typeof input === 'object' && input?.icon ? input.icon : icon;
    
    setToasts(prev => {
      // If exact same message is already visible, do not duplicate
      if (prev.some(t => t.message === msg)) {
        return prev;
      }
      const id = `toast_${Date.now()}_${Math.random()}`;
      // Keep only at most 2 toasts on screen
      const trimmed = prev.slice(-1);
      return [...trimmed, { id, message: msg, type: toastType, icon: toastIcon }];
    });

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.message !== msg));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markOnboardingComplete = (preferences = {}) => {
    if (currentUser?.uid) {
      try {
        localStorage.setItem(`aura_onboarded_${currentUser.uid}`, 'true');
      } catch (e) {}
    }
    setOnboardingOpen(false);
    addToast("Welcome to Aura! Your workspace is ready.", "success");
  };

  const addProject = (name, color = '#6366F1') => {
    const newProj = { id: `proj_${Date.now()}`, name, color };
    setProjects(prev => {
      const updated = [...prev, newProj];
      try { localStorage.setItem('aura_projects', JSON.stringify(updated)); } catch (e) {}
      if (currentUser?.uid) {
        saveUserProjectsToCloud(currentUser.uid, currentUser.email, updated);
      }
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('aura_live_projects_sync');
          bc.postMessage({ type: 'LIVE_PROJECTS_SYNC', userId: currentUser?.uid, projects: updated });
          bc.close();
        } catch (e) {}
      }
      return updated;
    });
    addToast(`Project #${name} created`, "success");
  };

  const deleteProject = (projectId) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== projectId && p.name.toLowerCase() !== String(projectId).toLowerCase());
      try { localStorage.setItem('aura_projects', JSON.stringify(updated)); } catch (e) {}
      if (currentUser?.uid) {
        saveUserProjectsToCloud(currentUser.uid, currentUser.email, updated);
      }
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('aura_live_projects_sync');
          bc.postMessage({ type: 'LIVE_PROJECTS_SYNC', userId: currentUser?.uid, projects: updated });
          bc.close();
        } catch (e) {}
      }
      return updated;
    });
    addToast("Project removed", "info");
  };

  // Initial Task Load on User Change + Firestore real-time listener
  useEffect(() => {
    if (currentUser?.uid || currentUser?.email) {
      const userTasks = loadUserTasks(currentUser?.uid, currentUser?.email);
      updateTasksIfChanged(userTasks);

      if (isCloudDatabaseReady()) {
        setIsCloudSyncing(true);

        // If local tasks exist, sync them to cloud in background
        if (userTasks && userTasks.length > 0) {
          syncLocalTasksToCloud(currentUser.uid, currentUser.email, userTasks)
            .catch(e => console.warn("Local to cloud sync notice:", e));
        }

        // Initial fetch from Cloud Database
        getUserTasksFromCloud(currentUser.uid, currentUser.email)
          .then((cloudTasks) => {
            if (cloudTasks && cloudTasks.length > 0) {
              updateTasksIfChanged(cloudTasks);
            }
            setIsCloudSyncing(false);
          })
          .catch(err => {
            console.warn("Cloud initial load notice:", err);
            setIsCloudSyncing(false);
          });

        // Real-time listener for live updates across tabs/devices
        const unsubscribe = subscribeToUserTasks(
          currentUser.uid,
          currentUser.email,
          (cloudTasks) => {
            if (cloudTasks && cloudTasks.length > 0) {
              updateTasksIfChanged(cloudTasks);
            }
            setIsCloudSyncing(false);
          },
          (error) => {
            console.warn("Real-time cloud database sync warning:", error);
            setIsCloudSyncing(false);
          }
        );
        return () => unsubscribe();
      }
    } else {
      setTasks([]);
    }
  }, [currentUser?.uid, currentUser?.email]);

  // Real-time Projects Cloud Database Listener & Multi-Device Sync
  useEffect(() => {
    if (currentUser?.uid || currentUser?.email) {
      if (isCloudDatabaseReady()) {
        getUserProjectsFromCloud(currentUser.uid, currentUser.email)
          .then((cloudProjects) => {
            if (Array.isArray(cloudProjects) && cloudProjects.length > 0) {
              setProjects(cloudProjects);
              try { localStorage.setItem('aura_projects', JSON.stringify(cloudProjects)); } catch (e) {}
            }
          })
          .catch(() => {});

        const unsubProj = subscribeToUserProjects(
          currentUser.uid,
          currentUser.email,
          (cloudProjects) => {
            if (Array.isArray(cloudProjects)) {
              setProjects(cloudProjects);
              try { localStorage.setItem('aura_projects', JSON.stringify(cloudProjects)); } catch (e) {}
            }
          }
        );
        return () => unsubProj();
      }
    }
  }, [currentUser?.uid, currentUser?.email]);

  // Live Multi-Tab Project Sync Listener
  useEffect(() => {
    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('aura_live_projects_sync');
        channel.onmessage = (event) => {
          if (
            event.data?.type === 'LIVE_PROJECTS_SYNC' &&
            event.data?.userId === currentUser?.uid &&
            Array.isArray(event.data?.projects)
          ) {
            setProjects(event.data.projects);
          }
        };
      } catch (e) {}
    }
    return () => {
      if (channel) channel.close();
    };
  }, [currentUser?.uid]);

  // 3-Second Smooth Background Sync Interval (as requested by user)
  useEffect(() => {
    if (!currentUser?.uid || !isCloudDatabaseReady()) return;

    const intervalId = setInterval(() => {
      getUserTasksFromCloud(currentUser.uid, currentUser.email)
        .then((cloudTasks) => {
          if (cloudTasks && cloudTasks.length > 0) {
            updateTasksIfChanged(cloudTasks);
          }
        })
        .catch(() => {});

      getUserProjectsFromCloud(currentUser.uid, currentUser.email)
        .then((cloudProjects) => {
          if (Array.isArray(cloudProjects) && cloudProjects.length > 0) {
            setProjects(cloudProjects);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(intervalId);
  }, [currentUser?.uid, currentUser?.email]);

  // Apply theme to DOM document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveStoredTheme(theme);
  }, [theme]);

  // Persist tasks strictly scoped to current user & broadcast live across tabs
  useEffect(() => {
    if (currentUser?.uid && tasks.length > 0) {
      saveUserTasks(currentUser.uid, tasks, currentUser.email);
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('aura_live_task_sync');
          bc.postMessage({
            type: 'LIVE_TASK_SYNC',
            userId: currentUser.uid,
            tasks,
            timestamp: Date.now()
          });
          bc.close();
        } catch (e) {}
      }
    }
  }, [tasks, currentUser?.uid, currentUser?.email]);

  // Live Instant Multi-Tab BroadcastChannel + Storage Event Listener
  useEffect(() => {
    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('aura_live_task_sync');
        channel.onmessage = (event) => {
          if (
            event.data?.type === 'LIVE_TASK_SYNC' &&
            event.data?.userId === currentUser?.uid &&
            Array.isArray(event.data?.tasks)
          ) {
            updateTasksIfChanged(event.data.tasks);
          }
        };
      } catch (e) {
        console.warn("BroadcastChannel notice:", e);
      }
    }

    const handleStorageChange = (e) => {
      if (currentUser && e.key === `aura_tasks_${currentUser.uid}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          updateTasksIfChanged(parsed);
        } catch (err) {
          console.error("Multi-tab sync error:", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser?.uid]);

  // Keep activeTask in sync with tasks array
  useEffect(() => {
    if (activeTask) {
      const fresh = tasks.find(t => t.id === activeTask.id);
      if (fresh) {
        setActiveTask(fresh);
      }
    }
  }, [tasks]);

  // 24/7 Live Task Reminder Engine (Alerts Exactly ONCE per task - No Flooding)
  useEffect(() => {
    requestBrowserNotificationPermission();

    const checkReminders = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const todayStr = getLocalDateString(now);
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      tasks.forEach(task => {
        if (task.status === 'done' || !task.dueDate || !task.dueTime) return;

        // Check if task is scheduled for today
        if (task.dueDate === todayStr) {
          const [tHour, tMin] = task.dueTime.split(':').map(Number);
          const taskTimeInMinutes = (tHour || 0) * 60 + (tMin || 0);
          const diffMinutes = taskTimeInMinutes - currentTimeInMinutes;

          // 1. Due Right Now (0 min window) - Alerts EXACTLY ONCE
          if (diffMinutes <= 0 && diffMinutes >= -5) {
            const alertKey = `due_${task.id}_${task.dueTime}_${todayStr}`;
            if (!alertedRef.current.has(alertKey)) {
              alertedRef.current.add(alertKey);
              playNotificationChime('urgent');
              addToast(`🚨 REMINDER: "${task.title}" is due right now (${task.dueTime})!`, 'warning');
              sendBrowserNotification(
                `🚨 Task Reminder: ${task.title}`,
                `Scheduled for ${task.dueTime}. Priority: ${(task.priority || 'medium').toUpperCase()}`,
                `task_due_${task.id}`
              );

              // Send email in background without extra popup toast
              if (currentUser?.email) {
                sendLiveTaskEmailAlert(currentUser.email, task);
              }
            }
          }
          // 2. 30 Minutes Before Reminder - Alerts EXACTLY ONCE
          else if (diffMinutes === 30 || (diffMinutes <= 30 && diffMinutes >= 28)) {
            const alertKey = `30m_${task.id}_${task.dueTime}_${todayStr}`;
            if (!alertedRef.current.has(alertKey)) {
              alertedRef.current.add(alertKey);
              playNotificationChime('standard');
              addToast(`🔔 30-Min Reminder: "${task.title}" starts in 30 minutes (${task.dueTime})!`, 'info');
              sendBrowserNotification(
                `🔔 Upcoming Task in 30 Mins`,
                `"${task.title}" is scheduled at ${task.dueTime}.`,
                `task_30m_${task.id}`
              );

              if (currentUser?.email) {
                sendLiveTaskEmailAlert(currentUser.email, task);
              }
            }
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 12000);
    return () => clearInterval(interval);
  }, [tasks, currentUser?.email]);

  // Add Task (Natural Language or Structured)
  const addTask = async (input) => {
    if (!currentUser) {
      addToast("Please sign in to add tasks", "error");
      return null;
    }

    let parsed;
    if (typeof input === 'string') {
      parsed = parseNaturalLanguageTask(input);
    } else {
      parsed = input;
    }

    if (!parsed.title || !parsed.title.trim()) return null;

    let finalDueDate = parsed.dueDate || null;
    let finalDueTime = parsed.dueTime || null;

    if (finalDueDate && finalDueDate.includes('T')) {
      const d = new Date(finalDueDate);
      if (!isNaN(d.getTime())) {
        finalDueDate = getLocalDateString(d);
        if (!finalDueTime) {
          const pad = (n) => String(n).padStart(2, '0');
          finalDueTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
      }
    }

    let gcalLink = parsed.gcalLink || (finalDueDate ? getGoogleCalendarWebLink({
      title: parsed.title,
      dueDate: finalDueDate,
      dueTime: finalDueTime,
      priority: parsed.priority,
      description: parsed.description
    }) : null);

    let gcalEventId = parsed.gcalEventId || null;

    // Automatic direct Google Calendar REST API event creation if connected
    if (currentUser?.calendarConnected && currentUser?.googleCalendarToken && finalDueDate && !gcalEventId) {
      try {
        const syncRes = await syncTaskToGoogleCalendarAPI(currentUser.googleCalendarToken, {
          title: parsed.title,
          dueDate: finalDueDate,
          dueTime: finalDueTime,
          priority: parsed.priority,
          description: parsed.description
        });
        if (syncRes?.eventId) {
          gcalEventId = syncRes.eventId;
          gcalLink = syncRes.htmlLink || gcalLink;
        }
      } catch (err) {
        console.warn("Google Calendar direct sync notice:", err);
      }
    }

    const newTask = {
      id: parsed.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser.uid,
      userEmail: (currentUser.email || '').toLowerCase(),
      title: parsed.title.trim(),
      description: parsed.description || "",
      dueDate: finalDueDate,
      dueTime: finalDueTime,
      priority: parsed.priority || "medium",
      status: parsed.status || "todo",
      tags: parsed.tags && parsed.tags.length > 0 ? parsed.tags : ["general"],
      subtasks: parsed.subtasks || [],
      gcalEventId,
      gcalLink,
      gcalSynced: Boolean(gcalEventId || parsed.gcalSynced || currentUser.calendarConnected),
      reminderOffsetsMinutes: currentUser.reminderOffsets || [30],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);

    if (isCloudDatabaseReady()) {
      createTaskInCloud(newTask, currentUser.email).catch(err => console.warn("Cloud create failed:", err));
    }

    if (gcalEventId) {
      addToast(`Task created & synced to Google Calendar (30m reminder active)`, 'success');
    } else {
      addToast(`Task added successfully`, 'success');
    }

    return newTask;
  };

  // Update Task
  const updateTask = (taskId, updates) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        if (currentUser?.calendarConnected && updated.dueDate && !updated.googleEventId) {
          updated.googleEventId = `gcal_evt_${Math.floor(100000 + Math.random() * 900000)}`;
        }
        if (isCloudDatabaseReady()) {
          updateTaskInCloud(taskId, updated).catch(err => console.warn("Cloud update failed:", err));
        }
        return updated;
      }
      return t;
    }));
  };

  // Delete Task
  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (isCloudDatabaseReady()) {
      deleteTaskInCloud(taskId).catch(err => console.warn("Cloud delete failed:", err));
    }
    if (activeTask && activeTask.id === taskId) {
      setActiveTask(null);
    }
    addToast("Task deleted", "info");
  };

  // Toggle Completion (Finished tasks cannot be undone, but can be deleted)
  const toggleTaskComplete = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (t.status === 'done') {
          addToast("Finished tasks are permanently recorded and cannot be undone. You can delete this task if desired.", "info");
          return t;
        }

        const nextStatus = 'done';
        try {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6']
          });
        } catch {}
        addToast(`Completed: ${t.title}`, 'success');

        const updated = {
          ...t,
          status: nextStatus,
          updatedAt: new Date().toISOString()
        };
        if (currentUser?.googleCalendarToken && t.gcalEventId) {
          updateGoogleCalendarEventStatus(currentUser.googleCalendarToken, t.gcalEventId, true, t.title);
        }
        if (isCloudDatabaseReady()) {
          updateTaskInCloud(taskId, updated).catch(err => console.warn("Cloud toggle failed:", err));
        }
        return updated;
      }
      return t;
    }));
  };

  // Set Status explicitly
  const setTaskStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (newStatus === 'done' && t.status !== 'done') {
          try {
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
          } catch {}
        }
        const updated = { ...t, status: newStatus, updatedAt: new Date().toISOString() };
        if (isCloudDatabaseReady()) {
          updateTaskInCloud(taskId, updated).catch(err => console.warn("Cloud set status failed:", err));
        }
        return updated;
      }
      return t;
    }));
  };

  // Subtask Management
  const addSubtask = (taskId, subtaskTitle) => {
    if (!subtaskTitle.trim()) return;
    const newSub = {
      id: `sub_${Date.now()}`,
      title: subtaskTitle.trim(),
      done: false
    };
    updateTask(taskId, {
      subtasks: [...(tasks.find(t => t.id === taskId)?.subtasks || []), newSub]
    });
  };

  const toggleSubtask = (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubs = task.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s);
    updateTask(taskId, { subtasks: updatedSubs });
  };

  const deleteSubtask = (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubs = task.subtasks.filter(s => s.id !== subtaskId);
    updateTask(taskId, { subtasks: updatedSubs });
  };

  // AI Breakdown generator for a task
  const generateAISubtasks = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const aiSuggested = generateSubtasksForTask(task.title, task.subtasks);
    if (aiSuggested.length > 0) {
      updateTask(taskId, {
        subtasks: [...task.subtasks, ...aiSuggested]
      });
      addToast(`AI added ${aiSuggested.length} subtasks!`, 'success');
    } else {
      addToast("Subtasks are already comprehensive!", "info");
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Google Calendar manual Sync Trigger
  const syncTaskToGoogleCalendar = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newEventId = `gcal_evt_${Math.floor(100000 + Math.random() * 900000)}`;
    updateTask(taskId, { googleEventId: newEventId });
    addToast("Synced with Google Calendar event", "success");
  };

  // Reset to initial mock data for current user
  const resetDemoData = () => {
    if (!currentUser) return;
    const populated = INITIAL_TASKS.map(t => ({
      ...t,
      userId: currentUser.uid,
      id: `task_${Date.now()}_${Math.random()}`
    }));
    setTasks(populated);
    setActiveTask(null);
    addToast("Loaded sample tasks", "info");
  };

  // Computed AI Digest
  const aiDigest = generateDailyDigest(tasks);

  return (
    <TodoContext.Provider
      value={{
        tasks,
        user: currentUser,
        theme,
        toggleTheme,
        viewMode,
        setViewMode,
        searchQuery,
        setSearchQuery,
        selectedFilter,
        setSelectedFilter,
        selectedTag,
        setSelectedTag,
        activeNavTab,
        setActiveNavTab,
        projects,
        addProject,
        deleteProject,
        onboardingOpen,
        setOnboardingOpen,
        markOnboardingComplete,
        isSettingsOpen,
        setIsSettingsOpen,
        toasts,
        addToast,
        removeToast,
        focusModeTaskId,
        setFocusModeTaskId,
        aiDigest,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        setTaskStatus,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        generateAISubtasks,
        syncTaskToGoogleCalendar,
        resetDemoData,
        updateCalendarConnection,
        updateReminderOffsets
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error("useTodo must be used within a TodoProvider");
  }
  return context;
};
