// src/services/storage.ts
export const STORAGE_OBJECTS = 'troast_demo_objects_v1';
export const STORAGE_TASKS = 'troast_demo_tasks_v1';
export const STORAGE_HISTORY = 'troast_demo_history_v1';

export function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Storage quota or error', err);
  }
}
