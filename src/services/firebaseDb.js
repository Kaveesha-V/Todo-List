/**
 * Firebase Firestore Cloud Database Service
 * Provides real-time synchronization, cloud persistence, and multi-user data isolation.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
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
  updateProfile,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID
};

export const isCloudDatabaseReady = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey.length > 5
  );
};

// Initialize Firebase App
let app = null;
let db = null;
let auth = null;

export const getFirebaseInstance = () => {
  if (!isCloudDatabaseReady()) return { app: null, db: null, auth: null };
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
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
 * Connect Google Calendar with explicit permission
 */
export const firebaseConnectGoogleCalendar = async () => {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error("Firebase Auth is not ready.");
  
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.setCustomParameters({ prompt: 'consent' });
  
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return credential?.accessToken;
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
 * Real-Time Firestore Tasks Listener
 * Listens to live task updates across all devices/tabs for the authenticated user.
 */
export const subscribeToUserTasks = (userId, onUpdate, onError) => {
  const { db } = getFirebaseInstance();
  if (!db || !userId) return () => {};

  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const cloudTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        onUpdate(cloudTasks);
      },
      (error) => {
        console.error("Firestore real-time sync error:", error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Could not attach Firestore listener:", err);
    return () => {};
  }
};

/**
 * Create Task in Cloud Database
 */
export const createTaskInCloud = async (task) => {
  const { db } = getFirebaseInstance();
  if (!db || !task?.userId) return null;

  try {
    const taskRef = doc(db, 'tasks', task.id);
    await setDoc(taskRef, task);
    return task;
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
 * Sync Local Tasks to Cloud Database on First Connect
 */
export const syncLocalTasksToCloud = async (userId, localTasks) => {
  const { db } = getFirebaseInstance();
  if (!db || !userId || !Array.isArray(localTasks)) return;

  try {
    for (const task of localTasks) {
      const taskRef = doc(db, 'tasks', task.id);
      await setDoc(taskRef, { ...task, userId }, { merge: true });
    }
  } catch (err) {
    console.error("Failed to sync initial local tasks to Firestore:", err);
  }
};
