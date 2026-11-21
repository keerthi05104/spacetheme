import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import OrderCard from '../components/OrderCard';
import FoodArt from '../components/FoodArt';
import { PLANET_BY_ID } from '../data/planets';
import { STAGES } from '../data/journey';
import { DIETARY_TAGS, formatPrice } from '../data/foodItems';
import { PACKAGE_BY_ID, VIEW_BY_ID, formatDateLong } from '../data/dining';
import { SEATING, THEMES } from '../hooks/usePreferences';

const TABS = [
  ['overview', 'Overview'],
  ['orders', 'Orders'],
  ['reservations', 'Reservations'],
  ['profile', 'Preferences'],
];

export default function Dashboard() {
  const { ordersApi, reservationsApi, cart, destination, journey, preferences, navigate, setCartOpen, resetAllData, notify, selectedPlanet } = useApp();
  const [tab, setTab] = useState('overview');
  const [now, setNow] = useState(Date.now());
  const [confirmReset, setConfirmReset] = useState(false);
  const { prefs } = preferences;
  const dest = destination ? PLANET_BY_ID[destination] : null;
  const lastPlanet = PLANET_BY_ID[selectedPlanet];

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  const orders = ordersApi.orders;
  const reservations = reservationsApi.reservations;

  return (
    <section className="page-pad container">
      <header className="page-head">
        <span className="eyebrow">Customer dashboard</span>
        <h1 className="page-title">{prefs.name ? `Welcome back, ${prefs.name.split(' ')[0]}` : 'Your mission control'}</h1>
      </header>

      <div className="tab-row glass" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'is-on' : ''}`} onClick={() => setTab(id)}>
            {label}
            {id === 'orders' && orders.length > 0 && <span className="pill">{orders.length}</span>}
            {id === 'reservations' && reservations.length > 0 && <span className="pill">{reservations.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="dash-grid">
          <div className="dash-card glass">
            <span className="eyebrow">Selected destination</span>
            {dest ? (
              <div className="dest" style={{ '--c1': dest.accent, '--c2': dest.baseColor }}>
                <span className={`orb ${dest.ring ? 'orb-ringed' : ''}`} aria-hidden="true" />
                <div><h3>{dest.name}</h3><p className="muted">{dest.tagline}</p></div>
              </div>
            ) : (
              <p className="muted">No destination chosen yet. Last viewed: {lastPlanet?.name}.</p>
            )}
            <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate('/planets')}>{dest ? 'Change destination' : 'Choose a planet'}</button>
          </div>

          <div className="dash-card glass">
            <span className="eyebrow">Journey progress</span>
            <h3>{journey.completed ? 'Arrived at the station' : STAGES[journey.stage].title}</h3>
            <div className="progress-track"><span style={{ width: `${(journey.stage / (STAGES.length - 1)) * 100}%` }} /></div>
            <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate('/journey')}>{journey.stage > 0 ? 'Continue journey' : 'Start journey'}</button>
          </div>

          <div className="dash-card glass">
            <span className="eyebrow">Cart</span>
            {cart.items.length === 0 ? (
              <p className="muted">Your cart is empty.</p>
            ) : (
              <ul className="mini-list">
                {cart.items.map((i) => (
                  <li key={i.id}><FoodArt item={{ ...i, badge: undefined }} size="sm" /><span>{i.qty} × {i.name}</span><b>{formatPrice(i.lineTotal)}</b></li>
                ))}
              </ul>
            )}
            <div className="btn-row">
              {cart.items.length > 0 && <button type="button" className="btn btn-primary btn-sm" onClick={() => setCartOpen(true)}>Open cart · {formatPrice(cart.total)}</button>}
              <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate('/menu')}>Menu</button>
            </div>
          </div>

          <div className="dash-card glass">
            <span className="eyebrow">Next reservation</span>
            {reservations[0] ? (
              <>
                <h3>{formatDateLong(reservations[0].date)} · {reservations[0].time}</h3>
                <p className="muted">{PACKAGE_BY_ID[reservations[0].packageId].name} · {VIEW_BY_ID[reservations[0].viewId].name} · {reservations[0].guests} guests</p>
              </>
            ) : (
              <p className="muted">No table booked yet.</p>
            )}
            <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate('/reservations')}>{reservations[0] ? 'Manage' : 'Book a table'}</button>
          </div>

          <div className="dash-card glass span-2">
            <span className="eyebrow">Latest order</span>
            {orders[0] ? <OrderCard order={orders[0]} now={now} /> : <p className="muted">No orders yet. Your first order will show up here.</p>}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="stack">
          {orders.length === 0 ? (
            <div className="empty-state glass"><h3>No previous orders</h3><p className="muted">Orders you place will be kept here, in this browser.</p><button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/menu')}>Browse the menu</button></div>
          ) : orders.map((o) => <OrderCard key={o.id} order={o} now={now} />)}
        </div>
      )}

      {tab === 'reservations' && (
        <div className="stack">
          {reservations.length === 0 ? (
            <div className="empty-state glass"><h3>No reservations</h3><button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/reservations')}>Book a table</button></div>
          ) : reservations.map((r) => (
            <div key={r.id} className="res-card glass">
              <div>
                <strong>{formatDateLong(r.date)} · {r.time}</strong>
                <span className="muted">{PACKAGE_BY_ID[r.packageId].name} · {VIEW_BY_ID[r.viewId].name} · {r.guests} guests</span>
                <small className="muted">{r.id} · {r.status}</small>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { reservationsApi.cancelReservation(r.id); notify('Reservation cancelled', 'info'); }}>Cancel</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'profile' && (
        <div className="form glass">
          <h2>Your details</h2>
          <div className="field-row">
            <label className="field"><span>Name</span><input value={prefs.name} onChange={(e) => preferences.setPref('name', e.target.value)} /></label>
            <label className="field"><span>Email</span><input type="email" value={prefs.email} onChange={(e) => preferences.setPref('email', e.target.value)} /></label>
          </div>

          <h2>Dietary preferences</h2>
          <div className="chip-row">
            {DIETARY_TAGS.map((t) => (
              <button key={t.id} type="button" className={`chip ${prefs.dietary.includes(t.id) ? 'is-on' : ''}`} onClick={() => preferences.toggleDietary(t.id)} aria-pressed={prefs.dietary.includes(t.id)}>{t.label}</button>
            ))}
          </div>

          <h2>Preferred seating</h2>
          <div className="chip-row">
            {SEATING.map((s) => (
              <button key={s.id} type="button" className={`chip ${prefs.seating === s.id ? 'is-on' : ''}`} onClick={() => preferences.setPref('seating', s.id)} aria-pressed={prefs.seating === s.id}>{s.label}</button>
            ))}
          </div>

          <h2>Theme</h2>
          <div className="theme-row">
            {THEMES.map((t) => (
              <button key={t.id} type="button" className={`theme-swatch ${prefs.theme === t.id ? 'is-on' : ''}`} onClick={() => preferences.setPref('theme', t.id)} aria-pressed={prefs.theme === t.id}>
                <span style={{ background: `linear-gradient(120deg, ${t.swatch.join(', ')})` }} />
                {t.name}
              </button>
            ))}
          </div>

          <p className="muted small">Saved automatically in this browser.</p>
          <div className="danger-zone">
            {confirmReset ? (
              <div className="btn-row">
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { resetAllData(); setConfirmReset(false); notify('All saved data cleared', 'info'); }}>Yes, erase everything</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>Keep my data</button>
              </div>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(true)}>Reset all saved data</button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
