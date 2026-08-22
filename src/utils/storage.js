// Storage helper with per-user data isolation and authentication persistence

const STORAGE_KEY_AUTH_USER = 'aura_auth_current_user_v2';
const STORAGE_KEY_SAVED_ACCOUNTS = 'aura_saved_accounts_v2';
const STORAGE_KEY_THEME = 'aura_theme_v1';

// Per-User Task Storage
export const loadUserTasks = (userId) => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`aura_tasks_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load user tasks from localStorage", e);
  }
  return [];
};

export const saveUserTasks = (userId, tasks) => {
  if (!userId) return;
  try {
    localStorage.setItem(`aura_tasks_${userId}`, JSON.stringify(tasks));
  } catch (e) {
    console.warn("Failed to save user tasks to localStorage", e);
  }
};

export const deleteUserTasks = (userId) => {
  if (!userId) return;
  try {
    localStorage.removeItem(`aura_tasks_${userId}`);
  } catch (e) {
    console.warn("Failed to delete user tasks", e);
  }
};

// Auth Storage
export const loadStoredCurrentUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load current user", e);
  }
  return null;
};

export const saveStoredCurrentUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  } catch (e) {
    console.warn("Failed to save current user", e);
  }
};

export const loadStoredAccounts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load saved accounts", e);
  }
  return [];
};

export const saveStoredAccounts = (accounts) => {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.warn("Failed to save accounts list", e);
  }
};

// Theme Storage
export const loadStoredTheme = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const saveStoredTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch (e) {
    console.warn("Failed to save theme", e);
  }
};
