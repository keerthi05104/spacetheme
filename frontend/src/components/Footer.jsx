import { NAV_LINKS } from './Navbar';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <a href="#/" className="brand">
            <span className="brand-orb" aria-hidden="true" />
            <span className="brand-text">COSMIC<b>DINE</b></span>
          </a>
          <p className="footer-tag">Beyond Earth. Beyond Taste. Beyond Imagination.</p>
        </div>
        <nav aria-label="Footer">
          <h4>Explore</h4>
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <a href={`#${l.to}`}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h4>Station details</h4>
          <ul className="footer-info">
            <li>Orbital Ring, above Saturn</li>
            <li>Open daily · 17:00 to 23:30 SST</li>
            <li>Shuttles depart Earth hourly</li>
          </ul>
        </div>
      </div>
      <div className="container footer-note">
        <span>© {new Date().getFullYear()} COSMIC DINE. A frontend demo: no real payments or bookings are made.</span>
        <span>Your cart, orders and reservations are stored only in this browser.</span>
      </div>
    </footer>
  );
}
