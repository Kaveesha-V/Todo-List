// Firebase Client Initialization & Helper
// Configurable via environment variables with resilient production fallbacks for cross-device & Vercel deployment

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCjBNLPZNwIj4rS4rhNQf4oei6Apx1KJ6o",
  authDomain: "to-dolist-e1532.firebaseapp.com",
  projectId: "to-dolist-e1532",
  storageBucket: "to-dolist-e1532.firebasestorage.app",
  messagingSenderId: "743446244385",
  appId: "1:743446244385:web:da08d5c1cb69f615774760",
  measurementId: "G-M8B4TB5YQN"
};

export const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId
});

export const isFirebaseConfigured = () => {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.apiKey.length > 5);
};
