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
  signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
