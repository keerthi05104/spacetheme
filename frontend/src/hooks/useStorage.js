import { useCallback, useEffect, useRef, useState } from 'react';

/** Returns a usable Storage object or null (private mode, blocked cookies, SSR...). */
export function getStore(type) {
  try {
    if (typeof window === 'undefined') return null;
    const store = type === 'session' ? window.sessionStorage : window.localStorage;
    const probe = '__cd_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

/**
 * Shared implementation behind useLocalStorage / useSessionStorage.
 * - Safe against missing / corrupted / invalid JSON (falls back to initialValue).
 * - Optional `validate(parsed, fallback)` can sanitise anything read from storage.
 * - Writes are wrapped in try/catch (quota errors never crash the UI).
 * - localStorage values stay in sync across browser tabs through the `storage` event.
 */
export function useStorage(type, key, initialValue, validate) {
  const initialRef = useRef(initialValue);
  const validateRef = useRef(validate);

  const read = useCallback(() => {
    const init = initialRef.current;
    const fallback = typeof init === 'function' ? init() : init;
    const store = getStore(type);
    if (!store) return fallback;
    try {
      const raw = store.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return validateRef.current ? validateRef.current(parsed, fallback) : parsed;
    } catch {
      return fallback;
    }
  }, [type, key]);

  const [value, setValue] = useState(read);

  // Persist whenever the value changes.
  useEffect(() => {
    const store = getStore(type);
    if (!store) return;
    try {
      store.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded or storage disabled: keep working in memory */
    }
  }, [type, key, value]);

  // Keep tabs in sync (the event only fires in *other* tabs).
  useEffect(() => {
    if (type !== 'local') return undefined;
    const onStorage = (e) => {
      if (e.key === key || e.key === null) setValue(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [type, key, read]);

  const reset = useCallback(() => {
    const store = getStore(type);
    try {
      store?.removeItem(key);
    } catch {
      /* ignore */
    }
    const init = initialRef.current;
    setValue(typeof init === 'function' ? init() : init);
  }, [type, key]);

  return [value, setValue, reset];
}
