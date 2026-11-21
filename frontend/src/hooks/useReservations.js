import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { PACKAGE_BY_ID, VIEW_BY_ID } from '../data/dining';

function sanitizeReservations(parsed) {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (r) =>
      r &&
      typeof r.id === 'string' &&
      typeof r.date === 'string' &&
      typeof r.time === 'string' &&
      PACKAGE_BY_ID[r.packageId] &&
      VIEW_BY_ID[r.viewId] &&
      Number.isFinite(Number(r.guests))
  );
}

const makeId = () => `RS-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 46656)
  .toString(36)
  .toUpperCase()
  .padStart(3, '0')}`;

/** Reservations persisted in localStorage ("cd.reservations"). */
export function useReservations() {
  const [reservations, setReservations] = useLocalStorage('cd.reservations', [], sanitizeReservations);

  const addReservation = useCallback(
    (data) => {
      const reservation = { ...data, id: makeId(), createdAt: new Date().toISOString(), status: 'Confirmed' };
      setReservations((prev) => [reservation, ...prev]);
      return reservation;
    },
    [setReservations]
  );

  const cancelReservation = useCallback(
    (id) => setReservations((prev) => prev.filter((r) => r.id !== id)),
    [setReservations]
  );

  const clearReservations = useCallback(() => setReservations([]), [setReservations]);

  const isSlotTaken = useCallback(
    (date, time) => reservations.some((r) => r.date === date && r.time === time),
    [reservations]
  );

  const sorted = useMemo(
    () => [...reservations].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [reservations]
  );

  return { reservations: sorted, addReservation, cancelReservation, clearReservations, isSlotTaken };
}

export default useReservations;
