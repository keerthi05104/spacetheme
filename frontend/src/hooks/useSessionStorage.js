import { useStorage } from './useStorage';

/** useState-like hook persisted to sessionStorage (cleared when the tab closes). */
export function useSessionStorage(key, initialValue, validate) {
  return useStorage('session', key, initialValue, validate);
}

export default useSessionStorage;
