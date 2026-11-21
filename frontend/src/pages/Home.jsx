import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Hero from '../components/Hero';
import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import FoodCard from '../components/FoodCard';
import { STAGES } from '../data/journey';
import { PLANETS } from '../data/planets';
import { FOOD_ITEMS } from '../data/foodItems';
import { PACKAGES } from '../data/dining';

const SIGNATURE = FOOD_ITEMS.filter((f) => f.badge).slice(0, 4);

export default function Home() {
  const { navigate, setSelectedPlanet } = useApp();

  return (
    <>
      <Hero />

      <section id="home-next" className="section container">
        <SectionHead eyebrow="The voyage" title="Seven moments between Earth and your table">
          This is not a menu with a space wallpaper. Fly the Odyssey yourself, from the launch pad to the orbital ring.
        </SectionHead>
        <ol className="stage-chips">
          {STAGES.map((s, i) => (
            <Reveal as="li" key={s.id} delay={i * 60}>
              <button type="button" className="stage-chip glass hover-lift" onClick={() => navigate('/journey')}>
                <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
                <strong>{s.short}</strong>
                <span>{s.title}</span>
              </button>
            </Reveal>
          ))}
        </ol>
        <div className="center-row">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/journey')}>
            Start the journey <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="section container">
        <SectionHead eyebrow="Worlds to dine beside" title="Pick the planet outside your window">
          Every table looks out on a different world. Choose one and it follows you into the reservation.
        </SectionHead>
        <div className="planet-teasers">
          {PLANETS.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <button
                type="button"
                className="planet-teaser glass hover-lift"
                style={{ '--c1': p.accent, '--c2': p.baseColor }}
                onClick={() => {
                  setSelectedPlanet(p.id);
                  navigate('/planets');
                }}
              >
                <span className={`orb ${p.ring ? 'orb-ringed' : ''}`} aria-hidden="true" />
                <strong>{p.name}</strong>
                <span>{p.tagline}</span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <SectionHead eyebrow="Signature dishes" title="Chef's picks from the galley">
          A taste of what leaves our kitchen. Add straight to your cart, or open the full menu.
        </SectionHead>
        <div className="card-grid">
          {SIGNATURE.map((item, i) => (
            <Reveal key={item.id} delay={i * 70}>
              <FoodCard item={item} />
            </Reveal>
          ))}
        </div>
        <div className="center-row">
          <button type="button" className="btn btn-glass" onClick={() => navigate('/menu')}>
            See the full menu <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="section container">
        <SectionHead eyebrow="Dining experiences" title="Choose how you want to spend the evening" />
        <div className="package-grid">
          {PACKAGES.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <article className={`package-card glass hover-lift ${p.popular ? 'is-popular' : ''}`}>
                {p.popular && <span className="ribbon">Most booked</span>}
                <h3>{p.name}</h3>
                <p className="package-price">${p.price}<small> / guest · {p.duration}</small></p>
                <p>{p.summary}</p>
                <ul className="check-list">
                  {p.includes.map((x) => <li key={x}>{x}</li>)}
                </ul>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/reservations?package=${p.id}`)}>
                  Reserve this
                </button>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal className="cta-panel glass">
          <h2>Your table is waiting above Saturn</h2>
          <p>Reserve a window seat, then fly there. The shuttle leaves whenever you are ready.</p>
          <div className="cta-row">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/reservations')}>Book your table</button>
            <button type="button" className="btn btn-glass btn-lg" onClick={() => navigate('/restaurant')}>Tour the restaurant</button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
