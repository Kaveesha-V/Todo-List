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
  firebaseConnectGoogleCalendar,
  firebaseSignupWithEmail,
  firebaseLoginWithEmail,
  firebaseSendPasswordReset,
  firebaseLogout,
  getFirebaseInstance,
  saveUserToCloud,
  getUserFromCloud
} from '../services/firebaseDb';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

const DEFAULT_ACCOUNTS = [
  {
    uid: 'usr_g_kaveesha_primary',
    displayName: 'Kaveesha Vimukthi',
    email: 'kaveeshavimukthi688@gmail.com',
    photoURL: null,
    provider: 'google',
    calendarConnected: true,
    lastCalendarSync: "Just now",
    reminderOffsets: [10, 60],
    createdAt: '2026-02-01T10:00:00.000Z',
    lastLogin: new Date().toISOString()
  }
];

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
      saveStoredAccounts(DEFAULT_ACCOUNTS);
      return DEFAULT_ACCOUNTS;
    }
    return clean;
  });

  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveStoredAccounts(savedAccounts);
  }, [savedAccounts]);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    if (isCloudDatabaseReady()) {
      const { auth } = getFirebaseInstance();
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            const userObj = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              photoURL: firebaseUser.photoURL,
              provider: firebaseUser.providerData[0]?.providerId || 'password',
              calendarConnected: true,
              lastCalendarSync: "Live Cloud",
              reminderOffsets: [10, 60],
              lastLogin: new Date().toISOString()
            };
            setCurrentUser(userObj);
            setSavedAccounts(prev => [userObj, ...prev.filter(a => a.uid !== userObj.uid)]);
          }
          setAuthInitialized(true);
        });
        return () => unsubscribe();
      }
    }
    setAuthInitialized(true);
  }, []);

  // Helper to generate starter tasks
  const createStarterTasks = (uid, calendarConnected = false, email = null) => {
    const existing = loadUserTasks(uid, email);
    if (!existing || existing.length === 0) {
      const welcomeTasks = [
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
          reminderOffsetsMinutes: [30],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      saveUserTasks(uid, welcomeTasks, email);
    }
  };

  // Google Sign-in Workflow
  const loginWithGoogle = async () => {
    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseLoginWithGoogle();
        createStarterTasks(user.uid, true, user.email);
        await saveUserToCloud(user);
        setCurrentUser(user);
        setSavedAccounts(prev => [user, ...prev.filter(a => a.uid !== user.uid)]);
        setGoogleModalOpen(false);
        return user;
      } catch (err) {
        console.warn("Firebase Google popup notice:", err);
        setGoogleModalOpen(true);
      }
    } else {
      setGoogleModalOpen(true);
    }
  };

  // Authenticate via Google Chooser Modal (fallback or demo mode)
  const signInWithGoogleAccount = async ({ email, displayName, calendarConnected = true }) => {
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

    if (isCloudDatabaseReady()) {
      await saveUserToCloud(userObj);
    }

    setCurrentUser(userObj);
    setGoogleModalOpen(false);
    return userObj;
  };

  // Email & Password Login (Supports Cross-Device Authentication from Cloud DB)
  const loginWithEmail = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Firebase Auth if cloud is ready
    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseLoginWithEmail(cleanEmail, password);
        await saveUserToCloud(user);
        setCurrentUser(user);
        setSavedAccounts(prev => [user, ...prev.filter(a => a.uid !== user.uid)]);
        return user;
      } catch (err) {
        console.warn("Firebase email login notice, checking cloud database & local fallback:", err);

        // Check Cloud Firestore for this user account (created on another device)
        try {
          const cloudAccount = await getUserFromCloud(cleanEmail);
          if (cloudAccount) {
            if (cloudAccount.password && cloudAccount.password !== password) {
              throw new Error("Incorrect password. Please try again.");
            }
            const updated = { ...cloudAccount, lastLogin: new Date().toISOString() };
            await saveUserToCloud(updated);
            setCurrentUser(updated);
            setSavedAccounts(prev => [updated, ...prev.filter(a => a.uid !== updated.uid)]);
            return updated;
          }
        } catch (cloudErr) {
          if (cloudErr.message === "Incorrect password. Please try again.") {
            throw cloudErr;
          }
        }

        // Check local saved accounts
        const localAccount = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);
        if (localAccount) {
          if (localAccount.password && localAccount.password !== password) {
            throw new Error("Incorrect password. Please try again.");
          }
          const updated = { ...localAccount, lastLogin: new Date().toISOString() };
          createStarterTasks(updated.uid, false, cleanEmail);
          setCurrentUser(updated);
          setSavedAccounts(prev => prev.map(a => a.uid === updated.uid ? updated : a));
          return updated;
        }

        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/user-not-found'
        ) {
          throw new Error(
            "Incorrect password or account not found. If you are new, click 'Sign Up' below or 'Continue with Google'."
          );
        } else {
          throw new Error(err.message || "Invalid email or password.");
        }
      }
    }

    // 2. Local fallback check + Cloud fallback
    let account = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!account && isCloudDatabaseReady()) {
      try {
        const cloudUser = await getUserFromCloud(cleanEmail);
        if (cloudUser) {
          account = cloudUser;
        }
      } catch (e) {}
    }

    if (!account) {
      throw new Error("No account found with this email. Please click Sign Up to register.");
    }

    if (account.password && account.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }

    const updated = {
      ...account,
      lastLogin: new Date().toISOString()
    };
    if (isCloudDatabaseReady()) {
      saveUserToCloud(updated);
    }
    setCurrentUser(updated);
    setSavedAccounts(prev => [updated, ...prev.filter(a => a.uid !== updated.uid)]);
    return updated;
  };

  // Sign Up with Email & Password (Persisted to Cloud Database & Local Storage)
  const signupWithEmail = async (displayName, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error("Please enter both email and password.");
    }

    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseSignupWithEmail(displayName, cleanEmail, password);
        const userWithPassword = { ...user, password };
        createStarterTasks(user.uid, false, user.email);
        await saveUserToCloud(userWithPassword);
        setCurrentUser(user);
        setSavedAccounts(prev => [userWithPassword, ...prev.filter(a => a.uid !== user.uid)]);
        return user;
      } catch (err) {
        console.warn("Firebase email signup notice, falling back to database registration:", err);
        if (err.code === 'auth/email-already-in-use') {
          throw new Error(
            "An account with this email already exists. Please Log In or click 'Continue with Google'."
          );
        } else if (err.code === 'auth/weak-password') {
          throw new Error("Password must be at least 6 characters long.");
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

        createStarterTasks(uid, false, cleanEmail);
        await saveUserToCloud(newUser);
        setSavedAccounts(prev => [newUser, ...prev]);
        setCurrentUser(newUser);
        return newUser;
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

    createStarterTasks(uid, false, cleanEmail);
    if (isCloudDatabaseReady()) {
      saveUserToCloud(newUser);
    }
    setSavedAccounts(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    return newUser;
  };

  // Send Password Reset
  const sendPasswordReset = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (isCloudDatabaseReady()) {
      return await firebaseSendPasswordReset(cleanEmail);
    }
    return true;
  };

  // Switch Account
  const switchAccount = (uid) => {
    const target = savedAccounts.find(a => a.uid === uid);
    if (target) {
      const updated = { ...target, lastLogin: new Date().toISOString() };
      setCurrentUser(updated);
      setSavedAccounts(prev => prev.map(a => a.uid === uid ? updated : a));
    }
  };

  // Logout
  const logout = async () => {
    if (isCloudDatabaseReady()) {
      await firebaseLogout();
    }
    setCurrentUser(null);
  };

  // Delete Account & wipe all associated user data
  const deleteAccount = (uid) => {
    const target = savedAccounts.find(a => a.uid === uid);
    deleteUserTasks(uid, target?.email);
    setSavedAccounts(prev => prev.filter(a => a.uid !== uid));
    if (currentUser?.uid === uid) {
      setCurrentUser(null);
    }
  };

  // Google Calendar Connection
  const updateCalendarConnection = (connected, accessToken = null) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      calendarConnected: connected,
      googleCalendarToken: accessToken || currentUser.googleCalendarToken,
      lastCalendarSync: connected ? "Just now" : null
    };
    setCurrentUser(updated);
    setSavedAccounts(prev => prev.map(a => a.uid === updated.uid ? updated : a));
  };

  const connectGoogleCalendar = async () => {
    if (isCloudDatabaseReady()) {
      try {
        const res = await firebaseConnectGoogleCalendar();
        updateCalendarConnection(true, res?.accessToken);
        return res;
      } catch (err) {
        console.warn("Google Calendar OAuth error:", err);
        if (err.code === 'auth/popup-closed-by-user') {
          throw new Error("Calendar connection cancelled: popup was closed.");
        }
        updateCalendarConnection(true);
        return { calendarConnected: true };
      }
    } else {
      updateCalendarConnection(true);
      return { calendarConnected: true };
    }
  };

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
        connectGoogleCalendar,
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
