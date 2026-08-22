import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import {
  loadUserTasks,
  saveUserTasks,
  loadStoredTheme,
  saveStoredTheme
} from '../utils/storage';
import { INITIAL_TASKS } from '../mockData/initialTasks';
import { parseNaturalLanguageTask } from '../utils/nlpParser';
import { generateDailyDigest, generateSubtasksForTask } from '../utils/aiHelpers';

const TodoContext = createContext(null);

export const TodoProvider = ({ children }) => {
  const { currentUser, updateCalendarConnection, updateReminderOffsets } = useAuth();

  const [tasks, setTasks] = useState(() => currentUser ? loadUserTasks(currentUser.uid) : []);
  const [theme, setTheme] = useState(() => loadStoredTheme());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [focusModeTaskId, setFocusModeTaskId] = useState(null);

  // Reload tasks whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      const userTasks = loadUserTasks(currentUser.uid);
      setTasks(userTasks);
    } else {
      setTasks([]);
    }
    setActiveTask(null);
  }, [currentUser?.uid]);

  // Apply theme to DOM document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveStoredTheme(theme);
  }, [theme]);

  // Persist tasks strictly scoped to current user
  useEffect(() => {
    if (currentUser) {
      saveUserTasks(currentUser.uid, tasks);
    }
  }, [tasks, currentUser?.uid]);

  // Multi-tab storage listener for real-time synchronization simulation
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (currentUser && e.key === `aura_tasks_${currentUser.uid}` && e.newValue) {
        try {
          setTasks(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Multi-tab sync error:", err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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

  // Toast Helper
  const addToast = (message, type = 'info', icon = null) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Add Task (Natural Language or Structured)
  const addTask = (input) => {
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

    const newTask = {
      id: `task_${Date.now()}`,
      userId: currentUser.uid,
      title: parsed.title.trim(),
      description: parsed.description || "",
      dueDate: parsed.dueDate || null,
      priority: parsed.priority || "medium",
      status: "todo",
      tags: parsed.tags && parsed.tags.length > 0 ? parsed.tags : ["general"],
      subtasks: parsed.subtasks || [],
      googleEventId: (currentUser.calendarConnected && parsed.dueDate) ? `gcal_evt_${Math.floor(100000 + Math.random() * 900000)}` : null,
      reminderOffsetsMinutes: currentUser.reminderOffsets || [60],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);

    if (newTask.googleEventId) {
      addToast(`Task created & synced to Google Calendar`, 'success');
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
        return updated;
      }
      return t;
    }));
  };

  // Delete Task
  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (activeTask && activeTask.id === taskId) {
      setActiveTask(null);
    }
    addToast("Task deleted", "info");
  };

  // Toggle Completion
  const toggleTaskComplete = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'done' ? 'todo' : 'done';
        if (nextStatus === 'done') {
          try {
            confetti({
              particleCount: 45,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6']
            });
          } catch {}
          addToast(`Completed: ${t.title}`, 'success');
        }
        return {
          ...t,
          status: nextStatus,
          updatedAt: new Date().toISOString()
        };
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
        return { ...t, status: newStatus, updatedAt: new Date().toISOString() };
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
        activeTask,
        setActiveTask,
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
