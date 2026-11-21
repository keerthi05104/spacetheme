import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const THEMES = [
  { id: 'nebula', name: 'Nebula', swatch: ['#6c8cff', '#a56bff', '#38e8ff'] },
  { id: 'aurora', name: 'Aurora', swatch: ['#2de2c3', '#38b6ff', '#9dff6b'] },
  { id: 'nova', name: 'Nova', swatch: ['#ff6bd6', '#ffb347', '#ff6b8b'] },
];

export const SEATING = [
  { id: 'window', label: 'Window view' },
  { id: 'quiet', label: 'Quiet corner' },
  { id: 'lively', label: 'Near the action' },
];

export const DEFAULT_PREFS = {
  name: '',
  email: '',
  dietary: [],
  seating: 'window',
  theme: 'nebula',
};

function sanitizePrefs(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_PREFS };
  return {
    name: typeof parsed.name === 'string' ? parsed.name.slice(0, 80) : '',
    email: typeof parsed.email === 'string' ? parsed.email.slice(0, 120) : '',
    dietary: Array.isArray(parsed.dietary) ? parsed.dietary.filter((d) => typeof d === 'string').slice(0, 8) : [],
    seating: SEATING.some((s) => s.id === parsed.seating) ? parsed.seating : 'window',
    theme: THEMES.some((t) => t.id === parsed.theme) ? parsed.theme : 'nebula',
  };
}

/** Customer preferences + selected UI theme persisted in localStorage ("cd.prefs"). */
export function usePreferences() {
  const [prefs, setPrefs, resetPrefs] = useLocalStorage('cd.prefs', () => ({ ...DEFAULT_PREFS }), sanitizePrefs);

  const setPref = useCallback((key, value) => setPrefs((p) => ({ ...p, [key]: value })), [setPrefs]);

  const toggleDietary = useCallback(
    (tag) =>
      setPrefs((p) => ({
        ...p,
        dietary: p.dietary.includes(tag) ? p.dietary.filter((d) => d !== tag) : [...p.dietary, tag],
      })),
    [setPrefs]
  );

  const cycleTheme = useCallback(
    () =>
      setPrefs((p) => {
        const i = THEMES.findIndex((t) => t.id === p.theme);
        return { ...p, theme: THEMES[(i + 1) % THEMES.length].id };
      }),
    [setPrefs]
  );

  return { prefs, setPref, setPrefs, toggleDietary, cycleTheme, resetPrefs };
}

export default usePreferences;
