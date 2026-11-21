import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DIETARY_TAGS, formatPrice } from '../data/foodItems';
import FoodArt from './FoodArt';
import QuantityControl from './QuantityControl';

const TAG_LABEL = Object.fromEntries(DIETARY_TAGS.map((t) => [t.id, t.label]));

export default function FoodCard({ item }) {
  const { cart, notify } = useApp();
  const qty = cart.qtyOf(item.id);

  const add = () => {
    cart.addItem(item.id);
    notify(`${item.name} added to your cart`, 'success');
  };
  const dec = () => {
    if (qty <= 1) notify(`${item.name} removed from your cart`, 'info');
    cart.decrement(item.id);
  };

  return (
    <article className={`food-card glass hover-lift ${qty > 0 ? 'in-cart' : ''}`}>
      <FoodArt item={item} />
      <div className="food-body">
        <div className="food-head">
          <h3>{item.name}</h3>
          <span className="price">{formatPrice(item.price)}</span>
        </div>
        <p className="food-desc">{item.description}</p>
        {item.tags?.length > 0 && (
          <ul className="tag-row">
            {item.tags.map((t) => (
              <li key={t} className={`tag tag-${t}`}>{TAG_LABEL[t] || t}</li>
            ))}
          </ul>
        )}
        <div className="food-actions">
          {qty === 0 ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={add}>
              <Plus size={16} /> Add to Cart
            </button>
          ) : (
            <>
              <QuantityControl value={qty} name={item.name} onInc={() => cart.increment(item.id)} onDec={dec} />
              <span className="line-total">{formatPrice(item.price * qty)}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
