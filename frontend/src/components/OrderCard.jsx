import { Check, RotateCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { orderStatus } from '../hooks/useOrders';
import { formatPrice } from '../data/foodItems';

const STEPS = ['Confirmed', 'Preparing', 'On its way', 'Served'];
const FULFIL = { table: 'Served at your table', pod: 'Delivered to your guest pod', earth: 'Earth drop-capsule' };

export default function OrderCard({ order, now = Date.now() }) {
  const { cart, notify, navigate, setCartOpen } = useApp();
  const status = orderStatus(order, now);

  const reorder = () => {
    order.items.forEach((i) => cart.addItem(i.id, i.qty));
    notify('Items added to your cart', 'success');
    setCartOpen(true);
  };

  return (
    <article className="order-card glass">
      <header>
        <div>
          <h3>{order.id}</h3>
          <span className="muted">
            {new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            {order.fulfilment ? ` · ${FULFIL[order.fulfilment] || order.fulfilment}` : ''}
          </span>
        </div>
        <span className={`status-pill step-${status.step}`}>{status.label}</span>
      </header>

      <ol className="tracker" aria-label={`Order status: ${status.label}`}>
        {STEPS.map((s, i) => (
          <li key={s} className={i <= status.step ? 'is-done' : ''}>
            <span>{i <= status.step ? <Check size={12} /> : null}</span>
            {s}
          </li>
        ))}
      </ol>

      <ul className="order-items">
        {order.items.map((i) => (
          <li key={i.id}>
            <span>{i.qty} × {i.name}</span>
            <span>{formatPrice(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>

      <footer>
        <strong>Total {formatPrice(Number(order.total))}</strong>
        <div className="btn-row">
          <button type="button" className="btn btn-glass btn-sm" onClick={reorder}>
            <RotateCw size={15} /> Order again
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/menu')}>Menu</button>
        </div>
      </footer>
    </article>
  );
}
