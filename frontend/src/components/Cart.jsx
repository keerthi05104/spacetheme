import { useEffect, useRef } from 'react';
import { ShoppingCart, Trash2, X, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPrice } from '../data/foodItems';
import FoodArt from './FoodArt';
import QuantityControl from './QuantityControl';

/** Slide-in cart drawer: live quantities, totals, clear and a route to checkout. */
export default function Cart() {
  const { cart, cartOpen, setCartOpen, navigate, notify } = useApp();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!cartOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setCartOpen(false);
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [cartOpen, setCartOpen]);

  const checkout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className={`drawer-root ${cartOpen ? 'is-open' : ''}`} aria-hidden={!cartOpen}>
      <div className="drawer-scrim" onClick={() => setCartOpen(false)} />
      <aside className="drawer glass-strong" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <header className="drawer-head">
          <h2>
            <ShoppingCart size={20} /> Your cart
            {cart.count > 0 && <span className="pill">{cart.count}</span>}
          </h2>
          <button ref={closeRef} type="button" className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close cart">
            <X size={19} />
          </button>
        </header>

        {cart.items.length === 0 ? (
          <div className="drawer-empty">
            <div className="empty-orb" aria-hidden="true" />
            <h3>Your cart is floating empty</h3>
            <p>Add a few dishes from the menu and they will appear here.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCartOpen(false);
                navigate('/menu');
              }}
            >
              Browse the menu
            </button>
          </div>
        ) : (
          <>
            <ul className="drawer-list">
              {cart.items.map((it) => (
                <li key={it.id} className="cart-line">
                  <FoodArt item={{ ...it, badge: undefined }} size="sm" />
                  <div className="cart-line-main">
                    <div className="cart-line-top">
                      <strong>{it.name}</strong>
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm"
                        onClick={() => {
                          cart.removeItem(it.id);
                          notify(`${it.name} removed`, 'info');
                        }}
                        aria-label={`Remove ${it.name} from cart`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <span className="muted">{formatPrice(it.price)} each</span>
                    <div className="cart-line-bottom">
                      <QuantityControl
                        compact
                        value={it.qty}
                        name={it.name}
                        onInc={() => cart.increment(it.id)}
                        onDec={() => cart.decrement(it.id)}
                      />
                      <span className="line-total">{formatPrice(it.lineTotal)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="drawer-foot">
              <dl className="totals">
                <div><dt>Subtotal</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
                <div><dt>Station tax (8%)</dt><dd>{formatPrice(cart.tax)}</dd></div>
                <div className="grand"><dt>Total</dt><dd>{formatPrice(cart.total)}</dd></div>
              </dl>
              <button type="button" className="btn btn-primary btn-block" onClick={checkout}>
                Checkout <ArrowRight size={17} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block btn-sm"
                onClick={() => {
                  cart.clear();
                  notify('Cart cleared', 'info');
                }}
              >
                Clear cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
