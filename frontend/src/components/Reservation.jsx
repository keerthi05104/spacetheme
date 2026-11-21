import { useMemo, useState } from 'react';
import { CalendarCheck, Minus, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PACKAGES, PACKAGE_BY_ID, TIME_SLOTS, VIEWS, VIEW_BY_ID, formatDateLong, isSlotSoldOut, toISODate } from '../data/dining';
import { formatPrice } from '../data/foodItems';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nextDays(n) {
  const out = [];
  const base = new Date();
  for (let i = 1; i <= n; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    out.push({
      iso: toISODate(d),
      wd: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
      mon: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }
  return out;
}

export default function Reservation() {
  const { route, reservationsApi, preferences, notify, navigate } = useApp();
  const days = useMemo(() => nextDays(21), []);
  const q = route.query;

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [packageId, setPackageId] = useState(PACKAGE_BY_ID[q.package] ? q.package : 'orbital-classic');
  const [viewId, setViewId] = useState(VIEW_BY_ID[q.view] ? q.view : 'earthrise');
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState(preferences.prefs.name);
  const [email, setEmail] = useState(preferences.prefs.email);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [cancelId, setCancelId] = useState(null);

  const pkg = PACKAGE_BY_ID[packageId];
  const view = VIEW_BY_ID[viewId];
  const total = (pkg.price + view.surcharge) * guests;

  const errors = {};
  if (!date) errors.date = 'Choose a dining date';
  if (date && !time) errors.time = 'Choose a time';
  if (!name.trim()) errors.name = 'Enter a name for the booking';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email';

  const confirm = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      notify('Please complete the highlighted steps', 'error');
      return;
    }
    const r = reservationsApi.addReservation({
      date, time, packageId, viewId, guests, total,
      name: name.trim(), email: email.trim(), notes: notes.trim(),
    });
    if (!preferences.prefs.name) preferences.setPref('name', name.trim());
    if (!preferences.prefs.email) preferences.setPref('email', email.trim());
    setConfirmed(r);
    setSubmitted(false);
    setDate('');
    setTime('');
    setNotes('');
    notify('Reservation confirmed', 'success');
  };

  return (
    <div className="reservation-layout">
      <form className="form glass reserve-form" onSubmit={confirm} noValidate>
        <section>
          <h2><span className="step-badge">1</span> Dining date</h2>
          <div className="date-strip" role="radiogroup" aria-label="Dining date">
            {days.map((d) => (
              <button key={d.iso} type="button" role="radio" aria-checked={date === d.iso} className={`date-chip ${date === d.iso ? 'is-on' : ''}`} onClick={() => { setDate(d.iso); setTime(''); }}>
                <small>{d.wd}</small><strong>{d.day}</strong><small>{d.mon}</small>
              </button>
            ))}
          </div>
          {submitted && errors.date && <small className="error">{errors.date}</small>}
        </section>

        <section>
          <h2><span className="step-badge">2</span> Time</h2>
          <div className="slot-row" role="radiogroup" aria-label="Time">
            {TIME_SLOTS.map((t) => {
              const sold = date ? isSlotSoldOut(date, t) : false;
              const mine = date ? reservationsApi.isSlotTaken(date, t) : false;
              const off = !date || sold || mine;
              return (
                <button key={t} type="button" role="radio" aria-checked={time === t} disabled={off} className={`slot ${time === t ? 'is-on' : ''}`} onClick={() => setTime(t)}>
                  {t}
                  {sold && <small>Sold out</small>}
                  {mine && <small>Booked by you</small>}
                </button>
              );
            })}
          </div>
          {!date && <small className="muted">Pick a date to see available times.</small>}
          {submitted && errors.time && <small className="error">{errors.time}</small>}
        </section>

        <section>
          <h2><span className="step-badge">3</span> Dining package</h2>
          <div className="option-grid">
            {PACKAGES.map((p) => (
              <label key={p.id} className={`option ${packageId === p.id ? 'is-on' : ''}`}>
                <input type="radio" name="package" checked={packageId === p.id} onChange={() => setPackageId(p.id)} />
                <strong>{p.name} <em>${p.price}</em></strong>
                <small>{p.duration} · {p.summary}</small>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2><span className="step-badge">4</span> Guests</h2>
          <div className="qty qty-lg" role="group" aria-label="Number of guests">
            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} aria-label="Fewer guests"><Minus size={16} /></button>
            <output aria-live="polite">{guests} guest{guests > 1 ? 's' : ''}</output>
            <button type="button" onClick={() => setGuests((g) => Math.min(8, g + 1))} disabled={guests >= 8} aria-label="More guests"><Plus size={16} /></button>
          </div>
        </section>

        <section>
          <h2><span className="step-badge">5</span> Planet-view experience</h2>
          <div className="view-grid">
            {VIEWS.map((v) => (
              <label key={v.id} className={`view-card ${viewId === v.id ? 'is-on' : ''}`} style={{ '--c1': v.colors[1], '--c2': v.colors[0] }}>
                <input type="radio" name="view" checked={viewId === v.id} onChange={() => setViewId(v.id)} />
                <span className="orb" aria-hidden="true" />
                <strong>{v.name}</strong>
                <small>{v.blurb}</small>
                <em>{v.surcharge ? `+$${v.surcharge} / guest` : 'Included'}</em>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2><span className="step-badge">6</span> Your details</h2>
          <div className="field-row">
            <label className={`field ${submitted && errors.name ? 'has-error' : ''}`}>
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              {submitted && errors.name && <small className="error">{errors.name}</small>}
            </label>
            <label className={`field ${submitted && errors.email ? 'has-error' : ''}`}>
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              {submitted && errors.email && <small className="error">{errors.email}</small>}
            </label>
          </div>
          <label className="field">
            <span>Special requests (optional)</span>
            <textarea rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anniversary, allergies, accessibility…" />
          </label>
        </section>

        <button type="submit" className="btn btn-primary btn-lg btn-block">
          <CalendarCheck size={19} /> Confirm reservation · {formatPrice(total)}
        </button>
      </form>

      <aside className="summary glass sticky">
        <h2>Your reservation</h2>
        <dl className="summary-dl">
          <div><dt>Date</dt><dd>{date ? formatDateLong(date) : 'Not chosen'}</dd></div>
          <div><dt>Time</dt><dd>{time || 'Not chosen'}</dd></div>
          <div><dt>Package</dt><dd>{pkg.name}</dd></div>
          <div><dt>Guests</dt><dd>{guests}</dd></div>
          <div><dt>View</dt><dd>{view.name}</dd></div>
        </dl>
        <dl className="totals">
          <div><dt>{pkg.name} × {guests}</dt><dd>{formatPrice(pkg.price * guests)}</dd></div>
          {view.surcharge > 0 && <div><dt>View surcharge</dt><dd>{formatPrice(view.surcharge * guests)}</dd></div>}
          <div className="grand"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <p className="muted small">Pay at the station. Free cancellation any time in this demo.</p>
      </aside>

      {confirmed && (
        <div className="confirm-banner glass-strong span-all" role="status">
          <h2>Table reserved: {confirmed.id}</h2>
          <p>
            {formatDateLong(confirmed.date)} at {confirmed.time} · {confirmed.guests} guest{confirmed.guests > 1 ? 's' : ''} ·{' '}
            {PACKAGE_BY_ID[confirmed.packageId].name} · {VIEW_BY_ID[confirmed.viewId].name}
          </p>
          <div className="cta-row center-row">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/journey')}>Fly there now</button>
            <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate('/dashboard')}>View in dashboard</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmed(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <section className="span-all">
        <h2 className="sub-title">Your reservations</h2>
        {reservationsApi.reservations.length === 0 ? (
          <p className="muted">No reservations yet. Your confirmed tables will appear here.</p>
        ) : (
          <ul className="res-list">
            {reservationsApi.reservations.map((r) => (
              <li key={r.id} className="res-card glass">
                <div>
                  <strong>{formatDateLong(r.date)} · {r.time}</strong>
                  <span className="muted">{PACKAGE_BY_ID[r.packageId].name} · {VIEW_BY_ID[r.viewId].name} · {r.guests} guest{r.guests > 1 ? 's' : ''}</span>
                  <small className="muted">{r.id}{r.total ? ` · ${formatPrice(r.total)}` : ''}</small>
                </div>
                {cancelId === r.id ? (
                  <div className="btn-row">
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => { reservationsApi.cancelReservation(r.id); setCancelId(null); notify('Reservation cancelled', 'info'); }}>Confirm cancel</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCancelId(null)}>Keep</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCancelId(r.id)}><Trash2 size={15} /> Cancel</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
