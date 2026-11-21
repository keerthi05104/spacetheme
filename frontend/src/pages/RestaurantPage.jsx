import { Clock, MapPin, Shirt, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Restaurant from '../components/Restaurant';
import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import { PACKAGES, VIEWS } from '../data/dining';
import { CATEGORIES, FOOD_ITEMS } from '../data/foodItems';

const INFO = [
  { icon: MapPin, title: 'Location', text: 'Orbital Ring, 400 km above Saturn’s rings' },
  { icon: Clock, title: 'Hours', text: 'Daily 17:00 to 23:30 Station Standard Time' },
  { icon: Users, title: 'Capacity', text: '96 guests across the hall and 12 private pods' },
  { icon: Shirt, title: 'Dress code', text: 'Smart casual. Magnetic shoes provided at the dock' },
];

export default function RestaurantPage() {
  const { navigate } = useApp();
  return (
    <>
      <Restaurant />

      <section className="section container">
        <SectionHead eyebrow="Good to know" title="Restaurant information" />
        <div className="info-grid">
          {INFO.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 70}>
              <div className="info-card glass">
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <SectionHead eyebrow="Dining experiences" title="Four ways to dine" />
        <div className="package-grid">
          {PACKAGES.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <article className={`package-card glass hover-lift ${p.popular ? 'is-popular' : ''}`}>
                {p.popular && <span className="ribbon">Most booked</span>}
                <h3>{p.name}</h3>
                <p className="package-price">${p.price}<small> / guest · {p.duration}</small></p>
                <p>{p.summary}</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/reservations?package=${p.id}`)}>
                  Reserve this
                </button>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <SectionHead eyebrow="From the galley" title="Food categories" />
        <div className="category-grid">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.id} delay={i * 60}>
              <button type="button" className="category-card glass hover-lift" style={{ '--h': c.hue }} onClick={() => navigate(`/menu?cat=${c.id}`)}>
                <strong>{c.name}</strong>
                <span>{c.tagline}</span>
                <small>{FOOD_ITEMS.filter((f) => f.category === c.id).length} dishes</small>
              </button>
            </Reveal>
          ))}
        </div>
        <p className="muted center-text">Window views available: {VIEWS.map((v) => v.name).join(' · ')}</p>
      </section>
    </>
  );
}
