import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { FOOD_BY_ID } from '../data/foodItems';

export const TAX_RATE = 0.08;
export const MAX_QTY = 20;
const round2 = (n) => Math.round(n * 100) / 100;

/** Accepts anything read from storage and returns a clean [{id, qty}] list. */
export function sanitizeCart(parsed) {
  if (!Array.isArray(parsed)) return [];
  const merged = new Map();
  parsed.forEach((line) => {
    if (!line || typeof line.id !== 'string' || !FOOD_BY_ID[line.id]) return;
    const qty = Math.floor(Number(line.qty));
    if (!Number.isFinite(qty) || qty < 1) return;
    merged.set(line.id, Math.min(MAX_QTY, (merged.get(line.id) || 0) + qty));
  });
  return [...merged].map(([id, qty]) => ({ id, qty }));
}

/**
 * Shopping cart persisted in localStorage ("cd.cart").
 * Only item ids and quantities are stored; prices are always re-read from the menu data.
 */
export function useCart() {
  const [lines, setLines, , ] = useLocalStorage('cd.cart', [], sanitizeCart);

  const addItem = useCallback(
    (id, qty = 1) => {
      if (!FOOD_BY_ID[id]) return;
      setLines((prev) => {
        const exists = prev.find((l) => l.id === id);
        if (exists) {
          return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
        }
        return [...prev, { id, qty: Math.min(MAX_QTY, qty) }];
      });
    },
    [setLines]
  );

  const setQuantity = useCallback(
    (id, qty) => {
      const q = Math.floor(Number(qty));
      setLines((prev) => {
        if (!Number.isFinite(q) || q < 1) return prev.filter((l) => l.id !== id);
        return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, q) } : l));
      });
    },
    [setLines]
  );

  const increment = useCallback((id) => addItem(id, 1), [addItem]);

  const decrement = useCallback(
    (id) => {
      setLines((prev) =>
        prev.flatMap((l) => {
          if (l.id !== id) return [l];
          return l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : [];
        })
      );
    },
    [setLines]
  );

  const removeItem = useCallback((id) => setLines((prev) => prev.filter((l) => l.id !== id)), [setLines]);
  const clear = useCallback(() => setLines([]), [setLines]);

  const replaceAll = useCallback((next) => setLines(sanitizeCart(next)), [setLines]);

  const quantities = useMemo(() => Object.fromEntries(lines.map((l) => [l.id, l.qty])), [lines]);

  const items = useMemo(
    () =>
      lines.map((l) => {
        const food = FOOD_BY_ID[l.id];
        return { ...food, qty: l.qty, lineTotal: round2(food.price * l.qty) };
      }),
    [lines]
  );

  const totals = useMemo(() => {
    const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));
    const tax = round2(subtotal * TAX_RATE);
    return { subtotal, tax, total: round2(subtotal + tax) };
  }, [items]);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);

  return {
    items,
    count,
    ...totals,
    quantities,
    qtyOf: (id) => quantities[id] || 0,
    addItem,
    increment,
    decrement,
    setQuantity,
    removeItem,
    clear,
    replaceAll,
  };
}

export default useCart;
