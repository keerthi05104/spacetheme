import { useEffect, useState } from 'react';
import { Menu, X, ShoppingCart, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../hooks/usePreferences';

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/journey', label: 'Space Journey' },
  { to: '/planets', label: 'Planets' },
  { to: '/restaurant', label: 'Restaurant' },
  { to: '/menu', label: 'Menu' },
  { to: '/reservations', label: 'Reservations' },
  { to: '/dashboard', label: 'My Orders' },
];

const isActive = (to, path) => path === to || (to === '/dashboard' && path === '/orders');

export default function Navbar() {
  const { route, cart, cartOpen, setCartOpen, preferences } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const theme = THEMES.find((t) => t.id === preferences.prefs.theme) || THEMES[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [route.path]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`navbar ${scrolled || open ? 'is-solid' : ''}`}>
      <div className="navbar-inner">
        <a href="#/" className="brand" aria-label="COSMIC DINE home">
          <span className="brand-orb" aria-hidden="true" />
          <span className="brand-text">COSMIC<b>DINE</b></span>
        </a>

        <nav id="primary-nav" className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.to}
              href={`#${l.to}`}
              className={`nav-link ${isActive(l.to, route.path) ? 'is-active' : ''}`}
              aria-current={isActive(l.to, route.path) ? 'page' : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={preferences.cycleTheme}
            aria-label={`Theme: ${theme.name}. Click to switch theme`}
            title={`Theme: ${theme.name}`}
          >
            <Palette size={19} />
          </button>
          <button
            type="button"
            className="icon-btn cart-btn"
            onClick={() => setCartOpen(!cartOpen)}
            aria-label={`Open cart, ${cart.count} item${cart.count === 1 ? '' : 's'}`}
            aria-expanded={cartOpen}
          >
            <ShoppingCart size={19} />
            {cart.count > 0 && (
              <span key={cart.count} className="cart-badge">
                {cart.count}
              </span>
            )}
          </button>
          <button
            type="button"
            className="icon-btn nav-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="primary-nav"
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}
