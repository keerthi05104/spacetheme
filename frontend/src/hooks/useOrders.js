import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

function sanitizeOrders(parsed) {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (o) =>
      o &&
      typeof o.id === 'string' &&
      Array.isArray(o.items) &&
      o.items.length > 0 &&
      Number.isFinite(Number(o.total)) &&
      typeof o.createdAt === 'string'
  );
}

const makeOrderId = () =>
  `CD-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, '0')}`;

/** Order history persisted in localStorage ("cd.orders"). No payment data is ever stored. */
export function useOrders() {
  const [orders, setOrders] = useLocalStorage('cd.orders', [], sanitizeOrders);

  const addOrder = useCallback(
    (order) => {
      const created = { ...order, id: makeOrderId(), createdAt: new Date().toISOString() };
      setOrders((prev) => [created, ...prev]);
      return created;
    },
    [setOrders]
  );

  const clearOrders = useCallback(() => setOrders([]), [setOrders]);

  return { orders, addOrder, clearOrders };
}

/** Simulated order progress derived from elapsed time, so it needs no timers or backend. */
export function orderStatus(order, now = Date.now()) {
  const minutes = (now - new Date(order.createdAt).getTime()) / 60000;
  if (minutes < 1) return { label: 'Confirmed', step: 0 };
  if (minutes < 3) return { label: 'Preparing', step: 1 };
  if (minutes < 6) return { label: 'On its way', step: 2 };
  return { label: 'Served', step: 3 };
}

export default useOrders;
