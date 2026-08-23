/**
 * Firebase Firestore Cloud Database Service
 * Provides real-time synchronization, cloud persistence, and multi-user data isolation.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

import { getFirebaseConfig, isFirebaseConfigured } from '../config/firebase';

export const isCloudDatabaseReady = () => {
  return isFirebaseConfigured();
};

// Initialize Firebase App
let app = null;
let db = null;
let auth = null;

export const getFirebaseInstance = () => {
  if (!isCloudDatabaseReady()) return { app: null, db: null, auth: null };
  try {
    const config = getFirebaseConfig();
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    return { app, db, auth };
  } catch (err) {
    console.warn("Firebase initialization failed:", err);
    return { app: null, db: null, auth: null };
  }
};

/**
 * Real Firebase Google OAuth Popup Workflow
 * Uses standard Google profile scopes for instant, clean, zero-warning sign-in
 */
export const firebaseLoginWithGoogle = async () => {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error("Firebase Auth is not ready. Please verify your .env credentials.");
  
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  const user = result.user;
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    photoURL: user.photoURL,
    provider: 'google',
    calendarConnected: true,
    emailVerified: user.emailVerified,
    accessToken: token,
    lastLogin: new Date().toISOString()
  };
};

/**
 * Connect Google Calendar with real OAuth permissions
 */
export const firebaseConnectGoogleCalendar = async () => {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error("Firebase Auth is not ready.");
  
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  provider.setCustomParameters({ prompt: 'consent' });
  
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return {
    accessToken: credential?.accessToken || null,
    user: result.user
  };
};

/**
 * Real Firebase Email/Password Sign Up with Email Verification Link
 */
export const firebaseSignupWithEmail = async (displayName, email, password) => {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error("Firebase Auth is not ready. Please verify your .env credentials.");
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  if (displayName) {
    try {
      await updateProfile(user, { displayName });
    } catch (e) {
      console.warn("Could not update profile name:", e);
    }
  }
  
  // Send email verification link to user's real email inbox
  let emailSent = false;
  try {
    await sendEmailVerification(user);
    emailSent = true;
  } catch (e) {
    console.warn("Could not send email verification:", e);
  }
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.email.split('@')[0],
    photoURL: user.photoURL,
    provider: 'email',
    calendarConnected: false,
    emailVerified: user.emailVerified,
    verificationSent: emailSent,
    lastLogin: new Date().toISOString()
  };
};

/**
 * Real Firebase Email/Password Sign In
 */
export const firebaseLoginWithEmail = async (email, password) => {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error("Firebase Auth is not ready. Please verify your .env credentials.");
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    photoURL: user.photoURL,
    provider: 'email',
    calendarConnected: false,
    emailVerified: user.emailVerified,
    lastLogin: new Date().toISOString()
  };
};

/**
 * Real Firebase Password Reset Email
 */
export const firebaseSendPasswordReset = async (email) => {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error("Firebase Auth is not ready. Please verify your .env credentials.");
  await sendPasswordResetEmail(auth, email);
};

/**
 * Verify Password Reset Code from Email Link
 */
export const firebaseVerifyPasswordResetCode = async (oobCode) => {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error("Firebase Auth is not ready.");
  return await verifyPasswordResetCode(auth, oobCode);
};

/**
 * Confirm New Password with Reset Code
 */
export const firebaseConfirmPasswordReset = async (oobCode, newPassword) => {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error("Firebase Auth is not ready.");
  await confirmPasswordReset(auth, oobCode, newPassword);
};

/**
 * Real Firebase Sign Out
 */
export const firebaseLogout = async () => {
  const { auth } = getFirebaseInstance();
  if (auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Signout error:", err);
    }
  }
};

/**
 * Cloud User Profile Sync
 * Saves user accounts in Firestore so any device can authenticate and access tasks.
 */
export const saveUserToCloud = async (user) => {
  const { db } = getFirebaseInstance();
  if (!db || !user?.email) return null;

  try {
    const cleanEmail = user.email.trim().toLowerCase();
    const docId = `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const userRef = doc(db, 'users', docId);

    const dataToSave = {
      uid: user.uid,
      email: cleanEmail,
      displayName: user.displayName || cleanEmail.split('@')[0],
      password: user.password || null,
      provider: user.provider || 'password',
      calendarConnected: Boolean(user.calendarConnected),
      lastCalendarSync: user.lastCalendarSync || null,
      reminderOffsets: user.reminderOffsets || [10, 60],
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await setDoc(userRef, dataToSave, { merge: true });

    // Also write by user.uid if available
    if (user.uid && user.uid !== docId) {
      const uidRef = doc(db, 'users', user.uid);
      await setDoc(uidRef, dataToSave, { merge: true });
    }

    return dataToSave;
  } catch (err) {
    console.warn("Firestore saveUserToCloud notice:", err);
    return null;
  }
};

/**
 * Fetch User Profile from Cloud Database by Email
 */
export const getUserFromCloud = async (email) => {
  const { db } = getFirebaseInstance();
  if (!db || !email) return null;

  try {
    const cleanEmail = email.trim().toLowerCase();
    const docId = `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const userRef = doc(db, 'users', docId);
    
    // 1. Try direct doc get by email key
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }

    // 2. Query by email field
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }

    return null;
  } catch (err) {
    console.warn("Firestore getUserFromCloud notice:", err);
    return null;
  }
};

/**
 * Real-Time Firestore Tasks Listener
 * Listens to live task updates across all devices/tabs for the authenticated user by BOTH userEmail and userId.
 */
export const subscribeToUserTasks = (userId, userEmail, onUpdate, onError) => {
  const { db } = getFirebaseInstance();
  if (!db || (!userId && !userEmail)) return () => {};

  try {
    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : null;
    const taskMap = new Map();

    const dispatchUpdates = () => {
      const allTasks = Array.from(taskMap.values()).sort((a, b) => {
        return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
      });
      onUpdate(allTasks);
    };

    let unsubEmail = null;
    let unsubId = null;

    if (cleanEmail) {
      const qEmail = query(collection(db, 'tasks'), where('userEmail', '==', cleanEmail));
      unsubEmail = onSnapshot(
        qEmail,
        (snapshot) => {
          snapshot.docs.forEach(doc => {
            taskMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
          dispatchUpdates();
        },
        (err) => {
          console.warn("Firestore email tasks snapshot error:", err);
          if (onError) onError(err);
        }
      );
    }

    if (userId) {
      const qId = query(collection(db, 'tasks'), where('userId', '==', userId));
      unsubId = onSnapshot(
        qId,
        (snapshot) => {
          snapshot.docs.forEach(doc => {
            taskMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
          dispatchUpdates();
        },
        (err) => {
          console.warn("Firestore userId tasks snapshot error:", err);
          if (onError) onError(err);
        }
      );
    }

    return () => {
      if (unsubEmail) unsubEmail();
      if (unsubId) unsubId();
    };
  } catch (err) {
    console.warn("Could not attach Firestore listener:", err);
    return () => {};
  }
};

/**
 * Fetch All Tasks from Cloud Database for User (Dual Query by Email & UID)
 */
export const getUserTasksFromCloud = async (userId, userEmail) => {
  const { db } = getFirebaseInstance();
  if (!db || (!userId && !userEmail)) return [];

  try {
    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : null;
    const taskMap = new Map();

    if (cleanEmail) {
      try {
        const qEmail = query(collection(db, 'tasks'), where('userEmail', '==', cleanEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.docs.forEach(doc => {
          taskMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      } catch (errEmail) {
        console.warn("Could not fetch tasks by email:", errEmail);
      }
    }

    if (userId) {
      try {
        const qId = query(collection(db, 'tasks'), where('userId', '==', userId));
        const snapId = await getDocs(qId);
        snapId.docs.forEach(doc => {
          taskMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      } catch (errId) {
        console.warn("Could not fetch tasks by userId:", errId);
      }
    }

    const allTasks = Array.from(taskMap.values()).sort((a, b) => {
      return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
    });

    return allTasks;
  } catch (err) {
    console.warn("Failed to fetch cloud tasks:", err);
    return [];
  }
};

/**
 * Create Task in Cloud Database
 */
export const createTaskInCloud = async (task, userEmail = null) => {
  const { db } = getFirebaseInstance();
  if (!db || !task?.id) return null;

  try {
    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : (task.userEmail || '').toLowerCase();
    const taskData = {
      ...task,
      userEmail: cleanEmail || task.userEmail || null,
      updatedAt: new Date().toISOString()
    };

    const taskRef = doc(db, 'tasks', task.id);
    await setDoc(taskRef, taskData, { merge: true });
    return taskData;
  } catch (err) {
    console.error("Failed to create task in Firestore:", err);
    throw err;
  }
};

/**
 * Update Task in Cloud Database
 */
export const updateTaskInCloud = async (taskId, updates) => {
  const { db } = getFirebaseInstance();
  if (!db || !taskId) return null;

  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error("Failed to update task in Firestore:", err);
    throw err;
  }
};

/**
 * Delete Task in Cloud Database
 */
export const deleteTaskInCloud = async (taskId) => {
  const { db } = getFirebaseInstance();
  if (!db || !taskId) return false;

  try {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
    return true;
  } catch (err) {
    console.error("Failed to delete task from Firestore:", err);
    throw err;
  }
};

/**
 * Sync Local Tasks to Cloud Database
 */
export const syncLocalTasksToCloud = async (userId, userEmail, localTasks) => {
  const { db } = getFirebaseInstance();
  if (!db || !Array.isArray(localTasks) || localTasks.length === 0) return;

  try {
    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : null;

    for (const task of localTasks) {
      if (!task?.id) continue;
      const taskRef = doc(db, 'tasks', task.id);
      await setDoc(
        taskRef,
        {
          ...task,
          userId: userId || task.userId,
          userEmail: cleanEmail || task.userEmail || null,
          updatedAt: task.updatedAt || new Date().toISOString()
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("Failed to sync initial local tasks to Firestore:", err);
  }
};

