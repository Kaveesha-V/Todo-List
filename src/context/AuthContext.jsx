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
import {
  isCloudDatabaseReady,
  firebaseLoginWithGoogle,
  firebaseSignupWithEmail,
  firebaseLoginWithEmail,
  firebaseSendPasswordReset,
  firebaseLogout,
  getFirebaseInstance
} from '../services/firebaseDb';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const user = loadStoredCurrentUser();
    if (user && /^user_\d+@gmail\.com$/i.test(user.email)) {
      saveStoredCurrentUser(null);
      return null;
    }
    return user;
  });

  const [savedAccounts, setSavedAccounts] = useState(() => {
    const accounts = loadStoredAccounts();
    const clean = (accounts || []).filter(a => !/^user_\d+@gmail\.com$/i.test(a.email));
    if (clean.length === 0) {
      const defaultAccs = [
        {
          uid: 'usr_g_kaveesha_primary',
          displayName: 'Kaveesha Vimukthi',
          email: 'kaveeshavimukthi688@gmail.com',
          photoURL: null,
          provider: 'google',
          calendarConnected: true,
          lastCalendarSync: "Just now",
          reminderOffsets: [10, 60],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      ];
      saveStoredAccounts(defaultAccs);
      return defaultAccs;
    }
    saveStoredAccounts(clean);
    return clean;
  });

  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Sync auth state to storage
  useEffect(() => {
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveStoredAccounts(savedAccounts);
  }, [savedAccounts]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    if (isCloudDatabaseReady()) {
      const { auth } = getFirebaseInstance();
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            const mappedUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              photoURL: firebaseUser.photoURL,
              provider: firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
              calendarConnected: true,
              emailVerified: firebaseUser.emailVerified,
              lastLogin: new Date().toISOString()
            };
            setCurrentUser(mappedUser);
            setSavedAccounts(prev => [mappedUser, ...prev.filter(a => a.uid !== mappedUser.uid)]);
          }
          setAuthInitialized(true);
        });
        return () => unsubscribe();
      }
    }
    setAuthInitialized(true);
  }, []);

  // Helper to generate starter tasks
  const createStarterTasks = (uid, calendarConnected = false) => {
    const existing = loadUserTasks(uid);
    if (!existing || existing.length === 0) {
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
  };

  // Real Google Sign-in Workflow
  const loginWithGoogle = async () => {
    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseLoginWithGoogle();
        createStarterTasks(user.uid, true);
        setCurrentUser(user);
        setSavedAccounts(prev => [user, ...prev.filter(a => a.uid !== user.uid)]);
        setGoogleModalOpen(false);
        return user;
      } catch (err) {
        console.warn("Firebase Google popup error:", err);
        // If popup closed or domain not configured, rethrow to show user-friendly message
        throw err;
      }
    } else {
      setGoogleModalOpen(true);
    }
  };

  // Authenticate via Google Chooser Modal (fallback or demo mode)
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

      createStarterTasks(uid, calendarConnected);
      setSavedAccounts(prev => [userObj, ...prev.filter(a => a.uid !== uid)]);
    }

    setCurrentUser(userObj);
    setGoogleModalOpen(false);
    return userObj;
  };

  // Email & Password Login
  const loginWithEmail = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseLoginWithEmail(cleanEmail, password);
        setCurrentUser(user);
        setSavedAccounts(prev => [user, ...prev.filter(a => a.uid !== user.uid)]);
        return user;
      } catch (err) {
        console.warn("Firebase email login error:", err);
        throw new Error(err.message || "Invalid email or password.");
      }
    }

    // Local fallback
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
  const signupWithEmail = async (displayName, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error("Please enter both email and password.");
    }

    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseSignupWithEmail(displayName, cleanEmail, password);
        createStarterTasks(user.uid, false);
        setCurrentUser(user);
        setSavedAccounts(prev => [user, ...prev.filter(a => a.uid !== user.uid)]);
        return user;
      } catch (err) {
        console.warn("Firebase email signup error:", err);
        throw new Error(err.message || "Could not create account.");
      }
    }

    // Local fallback
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

    createStarterTasks(uid, false);
    setSavedAccounts(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    return newUser;
  };

  // Send Password Reset
  const sendPasswordReset = async (email) => {
    if (isCloudDatabaseReady()) {
      await firebaseSendPasswordReset(email.trim().toLowerCase());
    }
  };

  // Switch Active Account
  const switchAccount = (uid) => {
    const target = savedAccounts.find(a => a.uid === uid);
    if (target) {
      setCurrentUser(target);
    }
  };

  // Log Out
  const logout = async () => {
    if (isCloudDatabaseReady()) {
      await firebaseLogout();
    }
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
        loginWithGoogle,
        signInWithGoogleAccount,
        loginWithEmail,
        signupWithEmail,
        sendPasswordReset,
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
