// Storage helper with LocalStorage persistence and Multi-Tab sync event emitter

const STORAGE_KEY_TASKS = 'aura_tasks_v1';
const STORAGE_KEY_USER = 'aura_user_v1';
const STORAGE_KEY_THEME = 'aura_theme_v1';

export const loadStoredTasks = (fallbackTasks) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load tasks from localStorage", e);
  }
  return fallbackTasks;
};

export const saveStoredTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn("Failed to save tasks to localStorage", e);
  }
};

export const loadStoredUser = (fallbackUser) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load user info", e);
  }
  return fallbackUser;
};

export const saveStoredUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (e) {
    console.warn("Failed to save user info", e);
  }
};

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
