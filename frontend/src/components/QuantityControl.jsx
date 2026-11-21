import { Minus, Plus } from 'lucide-react';
import { MAX_QTY } from '../hooks/useCart';

export default function QuantityControl({ value, onInc, onDec, name = 'item', compact = false }) {
  return (
    <div className={`qty ${compact ? 'qty-compact' : ''}`} role="group" aria-label={`Quantity of ${name}`}>
      <button type="button" onClick={onDec} aria-label={value <= 1 ? `Remove ${name}` : `Decrease ${name}`}>
        <Minus size={15} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={onInc} disabled={value >= MAX_QTY} aria-label={`Increase ${name}`}>
        <Plus size={15} />
      </button>
    </div>
  );
}
