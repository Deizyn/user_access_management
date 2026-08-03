export const STORAGE_KEY_GROUPS = 'uam_groups_v21';
export const STORAGE_KEY_USERS = 'uam_users_v21';
export const STORAGE_KEY_USER_GROUPS = 'uam_user_groups_v21';

export function safeSaveLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`localStorage save warning for ${key}:`, err);
    try {
      // Clean up older uam_ and user_access_ keys if storage quota exceeded
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('uam_') || k.startsWith('user_access_')) && k !== key) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(key, JSON.stringify(data));
    } catch (retryErr) {
      console.warn(`Failed to save ${key} to localStorage (quota exceeded):`, retryErr);
    }
  }
}

export function loadLocalStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed ?? fallback;
  } catch (err) {
    console.error(`Error loading localStorage key "${key}":`, err);
    return fallback;
  }
}

export function clearAllAppCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('uam_') || k.startsWith('user_access_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    console.log('App storage cache cleared successfully.');
  } catch (err) {
    console.warn('Error clearing app cache:', err);
  }
}
