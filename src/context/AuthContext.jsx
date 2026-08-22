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
import { INITIAL_TASKS } from '../mockData/initialTasks';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => loadStoredCurrentUser());
  const [savedAccounts, setSavedAccounts] = useState(() => loadStoredAccounts());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Sync auth state to storage
  useEffect(() => {
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveStoredAccounts(savedAccounts);
  }, [savedAccounts]);

  // Google OAuth Login
  const loginWithGoogle = (emailOverride = null) => {
    const email = emailOverride || `user_${Math.floor(1000 + Math.random() * 9000)}@gmail.com`;
    const namePart = email.split('@')[0];
    const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    // Check if account already exists
    let existing = savedAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    let userObj;

    if (existing) {
      userObj = { ...existing, lastLogin: new Date().toISOString() };
    } else {
      const uid = `usr_g_${Date.now()}`;
      userObj = {
        uid,
        email,
        displayName: displayName || "Google User",
        photoURL: null,
        provider: 'google',
        calendarConnected: true,
        lastCalendarSync: "Just now",
        reminderOffsets: [10, 60],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      // Populate demo starter tasks if first time
      saveUserTasks(uid, INITIAL_TASKS.map(t => ({ ...t, userId: uid, id: `task_${Date.now()}_${Math.random()}` })));
      setSavedAccounts(prev => [...prev, userObj]);
    }

    setCurrentUser(userObj);
    setAuthModalOpen(false);
    return userObj;
  };

  // Email & Password Login
  const loginWithEmail = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const account = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      throw new Error("No account found with this email. Please create an account.");
    }
    if (account.password && account.password !== password) {
      throw new Error("Invalid password. Please check and try again.");
    }

    const updated = { ...account, lastLogin: new Date().toISOString() };
    setCurrentUser(updated);
    setSavedAccounts(prev => prev.map(a => a.uid === updated.uid ? updated : a));
    setAuthModalOpen(false);
    return updated;
  };

  // Sign Up with Email & Password
  const signupWithEmail = (displayName, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error("Please provide a valid email and password.");
    }

    const existing = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    const uid = `usr_e_${Date.now()}`;
    const newUser = {
      uid,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      password, // In a client demo we store credentials securely in localStorage
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
        title: "Welcome to Aura! 👋 Try adding a task with natural language",
        description: "Type 'Schedule a team meeting tomorrow at 3pm #work !high' in the bar above.",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: "medium",
        status: "todo",
        tags: ["welcome"],
        subtasks: [
          { id: `sub_1_${Date.now()}`, title: "Explore the List & Kanban views", done: true },
          { id: `sub_2_${Date.now()}`, title: "Click a task to open the detail panel", done: false },
          { id: `sub_3_${Date.now()}`, title: "Try AI task breakdown", done: false }
        ],
        googleEventId: null,
        reminderOffsetsMinutes: [60],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);

    setSavedAccounts(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setAuthModalOpen(false);
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

  // Delete Account & wipe all associated user data (Security & Privacy Hygiene)
  const deleteAccount = (uid) => {
    deleteUserTasks(uid);
    setSavedAccounts(prev => prev.filter(a => a.uid !== uid));
    if (currentUser?.uid === uid) {
      const remaining = savedAccounts.filter(a => a.uid !== uid);
      setCurrentUser(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // Update Google Calendar Connection for current user
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
        authModalOpen,
        setAuthModalOpen,
        loginWithGoogle,
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
