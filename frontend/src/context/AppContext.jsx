import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useReservations } from '../hooks/useReservations';
import { useOrders } from '../hooks/useOrders';
import { usePreferences } from '../hooks/usePreferences';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSessionStorage } from '../hooks/useSessionStorage';
import { PLANET_BY_ID } from '../data/planets';
import { STAGES, JOURNEY_STORAGE_DEFAULT } from '../data/journey';

const AppContext = createContext(null);

function parseHash() {
  const raw = (typeof window !== 'undefined' && window.location.hash.replace(/^#/, '')) || '/';
  const [pathPart, qs = ''] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) };
}

const validPlanet = (v, fallback) => (typeof v === 'string' && PLANET_BY_ID[v] ? v : fallback);

function sanitizeJourney(parsed) {
  if (!parsed || typeof parsed !== 'object') return { ...JOURNEY_STORAGE_DEFAULT };
  const stage = Math.floor(Number(parsed.stage));
  return {
    stage: Number.isFinite(stage) && stage >= 0 && stage < STAGES.length ? stage : 0,
    completed: Boolean(parsed.completed),
  };
}

function sanitizeCheckout(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const pick = ['name', 'email', 'phone', 'fulfilment', 'address', 'note', 'reservationId'];
  const out = {};
  pick.forEach((k) => {
    if (typeof parsed[k] === 'string') out[k] = parsed[k].slice(0, 300);
  });
  return out;
}

export function AppProvider({ children }) {
  const cart = useCart();
  const reservationsApi = useReservations();
  const ordersApi = useOrders();
  const preferences = usePreferences();

  // localStorage
  const [selectedPlanet, setSelectedPlanet] = useLocalStorage('cd.selectedPlanet', 'earth', validPlanet);
  const [destination, setDestination] = useLocalStorage('cd.destination', null, (v) =>
    typeof v === 'string' && PLANET_BY_ID[v] ? v : null
  );

  // sessionStorage (cleared when the tab is closed)
  const [journey, setJourney] = useSessionStorage('cd.journey', () => ({ ...JOURNEY_STORAGE_DEFAULT }), sanitizeJourney);
  const [checkoutDraft, setCheckoutDraft, resetCheckoutDraft] = useSessionStorage('cd.checkout', {}, sanitizeCheckout);
  const [savedNav, setSavedNav] = useSessionStorage('cd.nav', '/', (v) => (typeof v === 'string' ? v : '/'));

  // UI state
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [route, setRoute] = useState(parseHash);
  const toastId = useRef(0);

  // ---- theme (applied to <html>)
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.prefs.theme;
  }, [preferences.prefs.theme]);

  // ---- hash routing + session navigation state
  useEffect(() => {
    if (!window.location.hash && savedNav && savedNav !== '/') {
      window.location.hash = savedNav; // restore where the visitor was in this session
    }
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const full = route.path + (Object.keys(route.query).length ? `?${new URLSearchParams(route.query)}` : '');
    setSavedNav(full);
    setCartOpen(false);
  }, [route, setSavedNav]);

  const navigate = useCallback((to) => {
    const target = to.startsWith('/') ? to : `/${to}`;
    if (window.location.hash === `#${target}`) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.location.hash = target;
  }, []);

  // ---- toasts
  const notify = useCallback((message, type = 'info') => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // ---- wipe everything the demo stored
  const resetAllData = useCallback(() => {
    cart.clear();
    reservationsApi.clearReservations();
    ordersApi.clearOrders();
    preferences.resetPrefs();
    setSelectedPlanet('earth');
    setDestination(null);
    setJourney({ ...JOURNEY_STORAGE_DEFAULT });
    resetCheckoutDraft();
  }, [cart, reservationsApi, ordersApi, preferences, setSelectedPlanet, setDestination, setJourney, resetCheckoutDraft]);

  const value = useMemo(
    () => ({
      route,
      navigate,
      cart,
      reservationsApi,
      ordersApi,
      preferences,
      selectedPlanet,
      setSelectedPlanet,
      destination,
      setDestination,
      journey,
      setJourney,
      checkoutDraft,
      setCheckoutDraft,
      resetCheckoutDraft,
      cartOpen,
      setCartOpen,
      toasts,
      notify,
      dismissToast,
      resetAllData,
    }),
    [
      route, navigate, cart, reservationsApi, ordersApi, preferences, selectedPlanet, setSelectedPlanet,
      destination, setDestination, journey, setJourney, checkoutDraft, setCheckoutDraft, resetCheckoutDraft,
      cartOpen, toasts, notify, dismissToast, resetAllData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
