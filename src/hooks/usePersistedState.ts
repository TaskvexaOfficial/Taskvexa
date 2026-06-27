import { useState, useEffect } from 'react';

/**
 * A custom hook that operates like useState but persists the state in sessionStorage
 * under a unique key, allowing view/page state restoration.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const persisted = sessionStorage.getItem(key);
      if (persisted !== null) {
        return JSON.parse(persisted);
      }
    } catch (e) {
      console.warn(`[usePersistedState] Error reading key "${key}" from sessionStorage:`, e);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`[usePersistedState] Error writing key "${key}" to sessionStorage:`, e);
    }
  }, [key, state]);

  return [state, setState];
}
