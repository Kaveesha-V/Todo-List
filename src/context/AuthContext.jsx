import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loadStoredCurrentUser,
  saveStoredCurrentUser,
  loadStoredAccounts,
  saveStoredAccounts,
  deleteUserTasks,
  saveUserTasks,
  loadUserTasks,
  loadAuditLogs,
  saveAuditLogs,
  loadSystemBroadcast,
  saveSystemBroadcast
} from '../utils/storage';
import {
  isCloudDatabaseReady,
  firebaseLoginWithGoogle,
  firebaseConnectGoogleCalendar,
  firebaseSignupWithEmail,
  firebaseLoginWithEmail,
  firebaseSendPasswordReset,
  firebaseLogout,
  getFirebaseInstance
} from '../services/firebaseDb';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

// Default Pre-seeded System Admin Account
export const SYSTEM_ADMIN_CREDENTIALS = {
  email: 'admin@aura.workspace',
  password: 'Admin@Aura2026!',
  displayName: 'System Administrator',
  role: 'admin'
};

const INITIAL_SYSTEM_ADMIN = {
  uid: 'usr_admin_system_root',
  displayName: 'System Administrator',
  email: 'admin@aura.workspace',
  password: 'Admin@Aura2026!',
  role: 'admin',
  status: 'active',
  photoURL: null,
  provider: 'password',
  calendarConnected: true,
  lastCalendarSync: "Live Cloud",
  reminderOffsets: [10, 60],
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLogin: new Date().toISOString()
};

const DEFAULT_ACCOUNTS = [
  INITIAL_SYSTEM_ADMIN,
  {
    uid: 'usr_g_kaveesha_primary',
    displayName: 'Kaveesha Vimukthi',
    email: 'kaveeshavimukthi688@gmail.com',
    role: 'user',
    status: 'active',
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
    
    // Ensure the predefined System Admin always exists
    const hasAdmin = clean.some(a => a.email.toLowerCase() === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase());
    let merged = clean;
    if (!hasAdmin) {
      merged = [INITIAL_SYSTEM_ADMIN, ...clean];
    }
    if (merged.length === 0) {
      merged = DEFAULT_ACCOUNTS;
    }
    saveStoredAccounts(merged);
    return merged;
  });

  const [loginLogs, setLoginLogs] = useState(() => {
    const logs = loadAuditLogs();
    if (!logs || logs.length === 0) {
      const initialSeedLogs = [
        {
          id: `log_init_1`,
          email: 'admin@aura.workspace',
          displayName: 'System Administrator',
          action: 'System Boot & Admin Initialized',
          status: 'success',
          method: 'System Kernel',
          device: 'System Server',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: 'Core security protocols & RBAC established'
        }
      ];
      saveAuditLogs(initialSeedLogs);
      return initialSeedLogs;
    }
    return logs;
  });

  const [systemBroadcast, setSystemBroadcast] = useState(() => loadSystemBroadcast());
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Sync auth state to storage
  useEffect(() => {
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveStoredAccounts(savedAccounts);
  }, [savedAccounts]);

  useEffect(() => {
    saveAuditLogs(loginLogs);
  }, [loginLogs]);

  useEffect(() => {
    saveSystemBroadcast(systemBroadcast);
  }, [systemBroadcast]);

  // Helper to record login oversight audit events
  const recordAuditLog = (userEmail, userName, action, status = 'success', method = 'Email/Password', details = '') => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: userEmail || 'anonymous',
      displayName: userName || 'User',
      action,
      status,
      method,
      device: isMobile ? 'Mobile Browser' : 'Desktop Browser',
      timestamp: new Date().toISOString(),
      details
    };
    setLoginLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 150);
      saveAuditLogs(updated);
      return updated;
    });
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    if (isCloudDatabaseReady()) {
      const { auth } = getFirebaseInstance();
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            const isAdmin = firebaseUser.email?.toLowerCase() === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase();
            const mappedUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              photoURL: firebaseUser.photoURL,
              provider: firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
              role: isAdmin ? 'admin' : 'user',
              status: 'active',
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

  // Real Google Sign-in Workflow
  const loginWithGoogle = async () => {
    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseLoginWithGoogle();
        const isAdmin = user.email?.toLowerCase() === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase();
        user.role = isAdmin ? 'admin' : 'user';
        user.status = 'active';
        createStarterTasks(user.uid, true, user.email);
        setCurrentUser(user);
        setSavedAccounts(prev => [user, ...prev.filter(a => a.uid !== user.uid)]);
        setGoogleModalOpen(false);
        recordAuditLog(user.email, user.displayName, 'Member Login', 'success', 'Google OAuth', 'Authenticated via Firebase Google Sign-In');
        return user;
      } catch (err) {
        console.warn("Firebase Google popup error:", err);
        recordAuditLog('Unknown', 'Google Attempt', 'Login Attempt', 'failed', 'Google OAuth', err.message);
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

    if (existing && existing.status === 'suspended') {
      recordAuditLog(cleanEmail, displayName || existing.displayName, 'Login Blocked', 'blocked', 'Google Chooser', 'Account is suspended');
      throw new Error("This account is currently suspended. Please contact your system administrator.");
    }

    const isAdmin = cleanEmail === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase() || (existing && existing.role === 'admin');

    let userObj;
    if (existing) {
      userObj = {
        ...existing,
        displayName: displayName || existing.displayName,
        role: isAdmin ? 'admin' : existing.role || 'user',
        status: existing.status || 'active',
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
        role: isAdmin ? 'admin' : 'user',
        status: 'active',
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
    recordAuditLog(userObj.email, userObj.displayName, 'Member Login', 'success', 'Google Chooser', `Logged in as ${userObj.role}`);
    return userObj;
  };

  // Email & Password Login
  const loginWithEmail = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check predefined Admin credentials directly
    if (
      cleanEmail === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === SYSTEM_ADMIN_CREDENTIALS.password
    ) {
      const existingAdmin = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);
      const adminUser = existingAdmin ? {
        ...existingAdmin,
        role: 'admin',
        status: 'active',
        lastLogin: new Date().toISOString()
      } : {
        ...INITIAL_SYSTEM_ADMIN,
        lastLogin: new Date().toISOString()
      };

      setCurrentUser(adminUser);
      setSavedAccounts(prev => [adminUser, ...prev.filter(a => a.uid !== adminUser.uid)]);
      recordAuditLog(cleanEmail, 'System Administrator', 'Admin Login', 'success', 'System Master Key', 'Admin Dashboard Access Granted');
      return adminUser;
    }

    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseLoginWithEmail(cleanEmail, password);
        const isAdmin = cleanEmail === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase();
        user.role = isAdmin ? 'admin' : 'user';
        user.status = 'active';
        setCurrentUser(user);
        setSavedAccounts(prev => [user, ...prev.filter(a => a.uid !== user.uid)]);
        recordAuditLog(user.email, user.displayName, 'Member Login', 'success', 'Firebase Email', `Authenticated (${user.role})`);
        return user;
      } catch (err) {
        console.warn("Firebase email login error:", err);
        recordAuditLog(cleanEmail, 'Guest', 'Login Failed', 'failed', 'Firebase Email', err.message);
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/user-not-found'
        ) {
          throw new Error(
            "Incorrect password or user not found. If you previously signed in with Google, please click 'Continue with Google', or click 'Forgot your password?' to set a new password."
          );
        } else if (err.code === 'auth/user-disabled') {
          throw new Error("This user account has been disabled by an administrator.");
        } else {
          throw new Error(err.message || "Invalid email or password.");
        }
      }
    }

    // Local fallback check
    const account = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!account) {
      recordAuditLog(cleanEmail, 'Unregistered', 'Login Failed', 'failed', 'Email/Password', 'Account not found');
      throw new Error("No account found with this email. Please click Sign Up to register.");
    }

    if (account.status === 'suspended') {
      recordAuditLog(cleanEmail, account.displayName, 'Login Blocked', 'blocked', 'Email/Password', 'Account suspended by Admin');
      throw new Error("This account is currently suspended. Please contact your system administrator.");
    }

    if (account.password && account.password !== password) {
      recordAuditLog(cleanEmail, account.displayName, 'Login Failed', 'failed', 'Email/Password', 'Wrong password attempt');
      throw new Error("Incorrect password. Please try again.");
    }

    const updated = {
      ...account,
      role: account.role || (cleanEmail === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase() ? 'admin' : 'user'),
      lastLogin: new Date().toISOString()
    };
    setCurrentUser(updated);
    setSavedAccounts(prev => prev.map(a => a.uid === updated.uid ? updated : a));
    recordAuditLog(updated.email, updated.displayName, 'Member Login', 'success', 'Email/Password', `Logged in as ${updated.role}`);
    return updated;
  };

  // Sign Up with Email & Password
  const signupWithEmail = async (displayName, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error("Please enter both email and password.");
    }

    const isAdmin = cleanEmail === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase();

    if (isCloudDatabaseReady()) {
      try {
        const user = await firebaseSignupWithEmail(displayName, cleanEmail, password);
        user.role = isAdmin ? 'admin' : 'user';
        user.status = 'active';
        createStarterTasks(user.uid, false);
        setCurrentUser(user);
        setSavedAccounts(prev => [user, ...prev.filter(a => a.uid !== user.uid)]);
        recordAuditLog(user.email, user.displayName, 'User Registered', 'success', 'Firebase Signup', `Registered new ${user.role} account`);
        return user;
      } catch (err) {
        console.warn("Firebase email signup error:", err);
        recordAuditLog(cleanEmail, displayName, 'Registration Failed', 'failed', 'Firebase Signup', err.message);
        if (err.code === 'auth/email-already-in-use') {
          throw new Error(
            "An account with this email already exists. Please Log In or click 'Continue with Google'."
          );
        } else if (err.code === 'auth/weak-password') {
          throw new Error("Password must be at least 6 characters long.");
        } else {
          throw new Error(err.message || "Could not create account.");
        }
      }
    }

    // Local fallback
    const existing = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      recordAuditLog(cleanEmail, displayName, 'Registration Conflict', 'failed', 'Email Signup', 'Email already exists');
      throw new Error("An account with this email already exists. Please Sign In.");
    }

    const uid = `usr_e_${Date.now()}`;
    const newUser = {
      uid,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      password,
      role: isAdmin ? 'admin' : 'user',
      status: 'active',
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
    recordAuditLog(newUser.email, newUser.displayName, 'User Registered', 'success', 'Local Email Signup', `Registered new account (${newUser.role})`);
    return newUser;
  };

  // Password Reset
  const sendPasswordReset = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    recordAuditLog(cleanEmail, 'User', 'Password Reset Requested', 'success', 'Reset Dispatcher', 'Reset instructions sent');
    if (isCloudDatabaseReady()) {
      return await firebaseSendPasswordReset(cleanEmail);
    }
    return true;
  };

  // Switch Account
  const switchAccount = (uid) => {
    const target = savedAccounts.find(a => a.uid === uid);
    if (target) {
      if (target.status === 'suspended') {
        throw new Error("Cannot switch to this account: it has been suspended by an administrator.");
      }
      const updated = { ...target, lastLogin: new Date().toISOString() };
      setCurrentUser(updated);
      setSavedAccounts(prev => prev.map(a => a.uid === uid ? updated : a));
      recordAuditLog(updated.email, updated.displayName, 'Account Switched', 'success', 'Account Chooser', `Switched active session to ${updated.email}`);
    }
  };

  // Logout
  const logout = async () => {
    if (currentUser) {
      recordAuditLog(currentUser.email, currentUser.displayName, 'Member Logout', 'success', 'User Action', 'Session ended');
    }
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
    if (target) {
      recordAuditLog(target.email, target.displayName, 'Account Deleted', 'success', 'User Self-Delete', 'User self-deleted their account and data');
    }
  };

  // =========================================================================
  // ADMIN PORTAL PRIVILEGED ACTIONS (Admin Role Only)
  // =========================================================================

  // 1. Admin Create User
  const adminCreateUser = ({ displayName, email, password, role = 'user' }) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Email is required.");
    if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");

    const existing = savedAccounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) throw new Error("An account with this email address already exists.");

    const uid = `usr_created_${Date.now()}`;
    const newUser = {
      uid,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      password,
      role: role === 'admin' ? 'admin' : 'user',
      status: 'active',
      provider: 'password',
      calendarConnected: false,
      lastCalendarSync: null,
      reminderOffsets: [10, 60],
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    createStarterTasks(uid, false, cleanEmail);
    setSavedAccounts(prev => [newUser, ...prev]);
    recordAuditLog(cleanEmail, newUser.displayName, 'Admin Created User', 'success', 'Admin Portal', `Created ${role} account by ${currentUser.email}`);
    return newUser;
  };

  // 2. Admin Delete User
  const adminDeleteUser = (uid, email) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    const target = savedAccounts.find(a => a.uid === uid);
    if (!target) throw new Error("User not found.");

    if (target.email.toLowerCase() === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase()) {
      throw new Error("Security Protection: Root System Administrator cannot be deleted.");
    }

    deleteUserTasks(uid, email || target.email);
    setSavedAccounts(prev => prev.filter(a => a.uid !== uid));

    // If admin deleted their own active secondary account, log out
    if (currentUser?.uid === uid) {
      setCurrentUser(null);
    }

    recordAuditLog(target.email, target.displayName, 'Admin Deleted User', 'success', 'Admin Portal', `User and associated task data removed by ${currentUser.email}`);
    return true;
  };

  // 3. Admin Toggle User Status (Active <-> Suspended)
  const adminToggleUserStatus = (uid) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    const target = savedAccounts.find(a => a.uid === uid);
    if (!target) throw new Error("User not found.");

    if (target.email.toLowerCase() === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase()) {
      throw new Error("Security Protection: Root System Administrator cannot be suspended.");
    }

    const newStatus = target.status === 'suspended' ? 'active' : 'suspended';
    const updated = { ...target, status: newStatus };

    setSavedAccounts(prev => prev.map(a => a.uid === uid ? updated : a));

    if (currentUser?.uid === uid && newStatus === 'suspended') {
      setCurrentUser(null);
    }

    recordAuditLog(target.email, target.displayName, `Admin ${newStatus === 'suspended' ? 'Suspended' : 'Activated'} User`, 'success', 'Admin Portal', `Status changed to ${newStatus} by ${currentUser.email}`);
    return updated;
  };

  // 4. Admin Reset Password
  const adminResetPassword = (uid, newPassword) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }

    const target = savedAccounts.find(a => a.uid === uid);
    if (!target) throw new Error("User not found.");

    const updated = { ...target, password: newPassword };
    setSavedAccounts(prev => prev.map(a => a.uid === uid ? updated : a));
    recordAuditLog(target.email, target.displayName, 'Admin Password Reset', 'success', 'Admin Portal', `Password updated by ${currentUser.email}`);
    return updated;
  };

  // 5. Admin Update User Role
  const adminUpdateUserRole = (uid, newRole) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    const target = savedAccounts.find(a => a.uid === uid);
    if (!target) throw new Error("User not found.");

    if (target.email.toLowerCase() === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase() && newRole !== 'admin') {
      throw new Error("Security Protection: Root System Administrator role cannot be changed.");
    }

    const updated = { ...target, role: newRole };
    setSavedAccounts(prev => prev.map(a => a.uid === uid ? updated : a));
    if (currentUser?.uid === uid) {
      setCurrentUser(updated);
    }

    recordAuditLog(target.email, target.displayName, 'Admin Role Updated', 'success', 'Admin Portal', `Role changed to ${newRole} by ${currentUser.email}`);
    return updated;
  };

  // 6. Admin System Broadcast Announcement
  const adminPostBroadcast = (message, level = 'info') => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    if (!message || !message.trim()) {
      setSystemBroadcast(null);
      return null;
    }

    const broadcast = {
      id: `bc_${Date.now()}`,
      message: message.trim(),
      level, // 'info' | 'warning' | 'critical'
      author: currentUser.displayName || currentUser.email,
      createdAt: new Date().toISOString()
    };

    setSystemBroadcast(broadcast);
    recordAuditLog(currentUser.email, currentUser.displayName, 'Broadcast Posted', 'success', 'Admin Portal', `Broadcast: "${message.slice(0, 40)}..."`);
    return broadcast;
  };

  const adminClearBroadcast = () => {
    setSystemBroadcast(null);
  };

  const adminClearLogs = () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setLoginLogs([]);
    saveAuditLogs([]);
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

  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'admin' ||
      currentUser.email?.toLowerCase() === SYSTEM_ADMIN_CREDENTIALS.email.toLowerCase()
    )
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        savedAccounts,
        isAdmin,
        loginLogs,
        systemBroadcast,
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
        updateReminderOffsets,
        // Admin Portal APIs
        adminCreateUser,
        adminDeleteUser,
        adminToggleUserStatus,
        adminResetPassword,
        adminUpdateUserRole,
        adminPostBroadcast,
        adminClearBroadcast,
        adminClearLogs
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
