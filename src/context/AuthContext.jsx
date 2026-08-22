import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loadStoredCurrentUser,
  saveStoredCurrentUser,
  loadStoredAccounts,
  saveStoredAccounts,
  deleteUserTasks,
  saveUserTasks,
  loadUserTasks
} from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Purge any old dummy accounts (like user_5423, user_2011) from previous runs
  const [currentUser, setCurrentUser] = useState(() => {
    const user = loadStoredCurrentUser();
    if (user && /^user_\d+@gmail\.com$/i.test(user.email)) {
      // Clear dummy user
      saveStoredCurrentUser(null);
      return null;
    }
    return user;
  });

  const [savedAccounts, setSavedAccounts] = useState(() => {
    const accounts = loadStoredAccounts();
    // Filter out dummy generated emails
    const clean = accounts.filter(a => !/^user_\d+@gmail\.com$/i.test(a.email));
    saveStoredAccounts(clean);
    return clean;
  });

  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  // Sync auth state to storage
  useEffect(() => {
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveStoredAccounts(savedAccounts);
  }, [savedAccounts]);

  // Authenticate via Google OAuth
  const signInWithGoogleAccount = ({ email, displayName, calendarConnected = true }) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);

    let userObj;
    if (existing) {
      userObj = {
        ...existing,
        displayName: displayName || existing.displayName,
        calendarConnected,
        lastLogin: new Date().toISOString()
      };
      setSavedAccounts(prev => prev.map(a => a.uid === userObj.uid ? userObj : a));
    } else {
      const uid = `usr_g_${Date.now()}`;
      userObj = {
        uid,
        email: cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
        photoURL: null,
        provider: 'google',
        calendarConnected,
        lastCalendarSync: calendarConnected ? "Just now" : null,
        reminderOffsets: [10, 60],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Create starter task for new Google user if no tasks exist
      const existingTasks = loadUserTasks(uid);
      if (!existingTasks || existingTasks.length === 0) {
        saveUserTasks(uid, [
          {
            id: `task_welcome_${Date.now()}`,
            userId: uid,
            title: "Welcome to Aura! Type a task above to get started",
            description: "Try saying 'Schedule team sync tomorrow at 3pm #work !high' to experience AI natural language parsing.",
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            priority: "high",
            status: "todo",
            tags: ["welcome"],
            subtasks: [
              { id: `sub_1_${Date.now()}`, title: "Try List view and Kanban board view", done: false },
              { id: `sub_2_${Date.now()}`, title: "Check Task Detail panel and Google Calendar sync", done: false }
            ],
            googleEventId: calendarConnected ? `gcal_evt_${Math.floor(100000 + Math.random() * 900000)}` : null,
            reminderOffsetsMinutes: [60],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }

      setSavedAccounts(prev => [userObj, ...prev.filter(a => a.uid !== uid)]);
    }

    setCurrentUser(userObj);
    setGoogleModalOpen(false);
    return userObj;
  };

  // Email & Password Login
  const loginWithEmail = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const account = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      throw new Error("No account found with this email. Please click Sign Up to register.");
    }
    if (account.password && account.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }

    const updated = { ...account, lastLogin: new Date().toISOString() };
    setCurrentUser(updated);
    setSavedAccounts(prev => prev.map(a => a.uid === updated.uid ? updated : a));
    return updated;
  };

  // Sign Up with Email & Password
  const signupWithEmail = (displayName, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error("Please enter both email and password.");
    }

    const existing = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error("An account with this email already exists. Please Sign In.");
    }

    const uid = `usr_e_${Date.now()}`;
    const newUser = {
      uid,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      password,
      provider: 'password',
      calendarConnected: false,
      lastCalendarSync: null,
      reminderOffsets: [10, 60],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Save empty task list for new user
    saveUserTasks(uid, [
      {
        id: `task_welcome_${Date.now()}`,
        userId: uid,
        title: "Welcome to Aura! Add your first task above",
        description: "Use the natural language input bar to quickly create tasks with due dates and tags.",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: "medium",
        status: "todo",
        tags: ["welcome"],
        subtasks: [
          { id: `sub_1_${Date.now()}`, title: "Create my first personal task", done: false },
          { id: `sub_2_${Date.now()}`, title: "Explore Kanban view", done: false }
        ],
        googleEventId: null,
        reminderOffsetsMinutes: [60],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);

    setSavedAccounts(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    return newUser;
  };

  // Switch Active Account
  const switchAccount = (uid) => {
    const target = savedAccounts.find(a => a.uid === uid);
    if (target) {
      setCurrentUser(target);
    }
  };

  // Log Out
  const logout = () => {
    setCurrentUser(null);
  };

  // Delete Account & wipe all associated user data
  const deleteAccount = (uid) => {
    deleteUserTasks(uid);
    setSavedAccounts(prev => prev.filter(a => a.uid !== uid));
    if (currentUser?.uid === uid) {
      setCurrentUser(null);
    }
  };

  // Update Google Calendar Connection
  const updateCalendarConnection = (connected) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      calendarConnected: connected,
      lastCalendarSync: connected ? "Just now" : null
    };
    setCurrentUser(updated);
    setSavedAccounts(prev => prev.map(a => a.uid === updated.uid ? updated : a));
  };

  // Update Reminder Offsets
  const updateReminderOffsets = (offsets) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      reminderOffsets: offsets
    };
    setCurrentUser(updated);
    setSavedAccounts(prev => prev.map(a => a.uid === updated.uid ? updated : a));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        savedAccounts,
        googleModalOpen,
        setGoogleModalOpen,
        signInWithGoogleAccount,
        loginWithEmail,
        signupWithEmail,
        switchAccount,
        logout,
        deleteAccount,
        updateCalendarConnection,
        updateReminderOffsets
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
