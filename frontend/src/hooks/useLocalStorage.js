import { useStorage } from './useStorage';

/** useState-like hook persisted to localStorage. Returns [value, setValue, reset]. */
export function useLocalStorage(key, initialValue, validate) {
  return useStorage('local', key, initialValue, validate);
}

export default useLocalStorage;
