import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPrice } from '../data/foodItems';
import { formatDateLong } from '../data/dining';
import FoodArt from '../components/FoodArt';
import OrderCard from '../components/OrderCard';

const FULFIL = [
  { id: 'table', label: 'At my table', hint: 'Served to your reservation table on the station' },
  { id: 'pod', label: 'Guest pod', hint: 'Delivered to a private pod' },
  { id: 'earth', label: 'Earth drop-capsule', hint: 'Re-entry delivery to an address on Earth' },
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f) {
  const e = {};
  if (!f.name || f.name.trim().length < 2) e.name = 'Please enter your name';
  if (!EMAIL_RE.test(f.email || '')) e.email = 'Enter a valid email address';
  if (f.fulfilment === 'earth' && (!f.address || f.address.trim().length < 6)) e.address = 'Enter a delivery address';
  return e;
}

export default function Checkout() {
  const { cart, ordersApi, reservationsApi, preferences, checkoutDraft, setCheckoutDraft, resetCheckoutDraft, navigate, notify } = useApp();
  const [confirmed, setConfirmed] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const form = {
    name: checkoutDraft.name ?? preferences.prefs.name,
    email: checkoutDraft.email ?? preferences.prefs.email,
    phone: checkoutDraft.phone ?? '',
    fulfilment: checkoutDraft.fulfilment || 'table',
    address: checkoutDraft.address ?? '',
    note: checkoutDraft.note ?? '',
    reservationId: checkoutDraft.reservationId ?? '',
  };
  const set = (k, v) => setCheckoutDraft((d) => ({ ...d, [k]: v }));
  const errors = validate(form);
  const show = (k) => submitted && errors[k];

  useEffect(() => {
    if (confirmed) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [confirmed]);

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      notify('Please fix the highlighted fields', 'error');
      return;
    }
    const order = ordersApi.addOrder({
      items: cart.items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })),
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
      fulfilment: form.fulfilment,
      address: form.fulfilment === 'earth' ? form.address.trim() : '',
      note: form.note.trim(),
      reservationId: form.reservationId || '',
    });
    if (!preferences.prefs.name) preferences.setPref('name', form.name.trim());
    if (!preferences.prefs.email) preferences.setPref('email', form.email.trim());
    cart.clear();
    resetCheckoutDraft();
    setConfirmed(order);
  };

  if (confirmed) {
    return (
      <section className="page-pad container narrow">
        <div className="confirm-banner glass-strong">
          <span className="confirm-check" aria-hidden="true"><CheckCircle2 size={44} /></span>
          <h1 className="page-title">Order confirmed</h1>
          <p className="muted">Thank you, {confirmed.customer?.name}. Your galley team has your order <strong>{confirmed.id}</strong>.</p>
          <p className="muted small">Demo checkout: no payment was taken.</p>
        </div>
        <OrderCard order={confirmed} />
        <div className="cta-row center-row">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard')}>View my orders</button>
          <button type="button" className="btn btn-glass" onClick={() => navigate('/menu')}>Order something else</button>
        </div>
      </section>
    );
  }

  if (cart.items.length === 0) {
    return (
      <section className="page-pad container center-col">
        <div className="empty-orb" aria-hidden="true" />
        <h1 className="page-title">Nothing to check out yet</h1>
        <p className="muted">Your cart is empty. Add some dishes first.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/menu')}>Browse the menu</button>
      </section>
    );
  }

  const upcoming = reservationsApi.reservations;

  return (
    <section className="page-pad container">
      <button type="button" className="btn btn-ghost btn-sm back-link" onClick={() => navigate('/menu')}>
        <ArrowLeft size={15} /> Back to menu
      </button>
      <h1 className="page-title">Checkout</h1>

      <div className="checkout-grid">
        <form className="form glass" onSubmit={submit} noValidate>
          <h2>Your details</h2>
          <div className="field-row">
            <label className={`field ${show('name') ? 'has-error' : ''}`}>
              <span>Full name</span>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" aria-invalid={Boolean(show('name'))} />
              {show('name') && <small className="error">{errors.name}</small>}
            </label>
            <label className={`field ${show('email') ? 'has-error' : ''}`}>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" aria-invalid={Boolean(show('email'))} />
              {show('email') && <small className="error">{errors.email}</small>}
            </label>
          </div>
          <label className="field">
            <span>Phone (optional)</span>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
          </label>

          <h2>Delivery</h2>
          <div className="option-grid">
            {FULFIL.map((o) => (
              <label key={o.id} className={`option ${form.fulfilment === o.id ? 'is-on' : ''}`}>
                <input type="radio" name="fulfilment" checked={form.fulfilment === o.id} onChange={() => set('fulfilment', o.id)} />
                <strong>{o.label}</strong>
                <small>{o.hint}</small>
              </label>
            ))}
          </div>

          {form.fulfilment === 'earth' && (
            <label className={`field ${show('address') ? 'has-error' : ''}`}>
              <span>Delivery address</span>
              <input value={form.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" aria-invalid={Boolean(show('address'))} />
              {show('address') && <small className="error">{errors.address}</small>}
            </label>
          )}

          {form.fulfilment !== 'earth' && upcoming.length > 0 && (
            <label className="field">
              <span>Link to a reservation (optional)</span>
              <select value={form.reservationId} onChange={(e) => set('reservationId', e.target.value)}>
                <option value="">No reservation</option>
                {upcoming.map((r) => (
                  <option key={r.id} value={r.id}>{formatDateLong(r.date)} at {r.time} · {r.guests} guest{r.guests > 1 ? 's' : ''}</option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Kitchen notes (optional)</span>
            <textarea rows={3} value={form.note} onChange={(e) => set('note', e.target.value)} maxLength={300} placeholder="Allergies, timing, celebrations…" />
          </label>

          <p className="secure-note"><ShieldCheck size={16} /> Demo checkout. No card or payment details are requested or stored.</p>
          <button type="submit" className="btn btn-primary btn-lg btn-block">Place order · {formatPrice(cart.total)}</button>
        </form>

        <aside className="summary glass">
          <h2>Order summary</h2>
          <ul className="summary-list">
            {cart.items.map((i) => (
              <li key={i.id}>
                <FoodArt item={{ ...i, badge: undefined }} size="sm" />
                <div><strong>{i.name}</strong><span className="muted">{i.qty} × {formatPrice(i.price)}</span></div>
                <b>{formatPrice(i.lineTotal)}</b>
              </li>
            ))}
          </ul>
          <dl className="totals">
            <div><dt>Subtotal</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
            <div><dt>Station tax (8%)</dt><dd>{formatPrice(cart.tax)}</dd></div>
            <div className="grand"><dt>Total</dt><dd>{formatPrice(cart.total)}</dd></div>
          </dl>
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => navigate('/menu')}>Edit items</button>
        </aside>
      </div>
    </section>
  );
}
