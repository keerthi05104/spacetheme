import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, Flag, Utensils, Plus, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SceneCanvas from '../components/SceneCanvas';
import PlanetsScene from '../components/PlanetsScene';
import { PLANETS, PLANET_BY_ID } from '../data/planets';
import { VIEWS } from '../data/dining';
import { FOOD_BY_ID, formatPrice } from '../data/foodItems';
import { useQuality } from '../hooks/useQuality';

export default function Planets() {
  const { selectedPlanet, setSelectedPlanet, destination, setDestination, navigate, cart, notify } = useApp();
  const quality = useQuality();
  const [hovered, setHovered] = useState(null);
  const [explored, setExplored] = useState(false);
  const def = PLANET_BY_ID[selectedPlanet] || PLANETS[0];
  const idx = PLANETS.findIndex((p) => p.id === def.id);
  const view = VIEWS.find((v) => v.planetId === def.id);
  const pairing = FOOD_BY_ID[def.pairing];
  const isDest = destination === def.id;

  const select = (id) => {
    setSelectedPlanet(id);
    setExplored(false);
  };
  const step = (d) => select(PLANETS[(idx + d + PLANETS.length) % PLANETS.length].id);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  useEffect(() => {
    const onKey = (e) => {
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <section className="planets" aria-label="Explore planets">
      <div className="planets-stage">
        <SceneCanvas
          className="planets-canvas"
          camera={{ position: [0, 0, 14], fov: 45, near: 0.1, far: 2500 }}
          loadingLabel="Aligning the planets…"
        >
          <PlanetsScene
            selectedId={def.id}
            hoveredId={hovered}
            explored={explored}
            onHover={setHovered}
            onSelect={select}
            quality={quality}
          />
        </SceneCanvas>
      </div>

      <div className="planets-ui">
        <aside className="planet-panel glass-strong" key={def.id}>
          <span className="eyebrow">{def.kind}</span>
          <h1>{def.name}</h1>
          <p className="planet-tagline">{def.tagline}</p>
          <p>{def.description}</p>

          <dl className="stat-grid">
            {Object.entries(def.stats).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>

          <p className="fun-fact"><strong>Did you know?</strong> {def.funFact}</p>

          {pairing && (
            <div className="pairing glass">
              <div>
                <span className="eyebrow">Menu pairing</span>
                <strong>{pairing.name}</strong>
                <small>{def.pairingNote}</small>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  cart.addItem(pairing.id);
                  notify(`${pairing.name} added to your cart`, 'success');
                }}
              >
                <Plus size={15} /> {formatPrice(pairing.price)}
              </button>
            </div>
          )}

          <div className="btn-row">
            <button type="button" className={`btn btn-sm ${explored ? 'btn-glass is-on' : 'btn-primary'}`} onClick={() => setExplored((e) => !e)} aria-pressed={explored}>
              <Compass size={16} /> {explored ? 'Zoom out' : 'Explore planet'}
            </button>
            <button
              type="button"
              className="btn btn-glass btn-sm"
              onClick={() => {
                setDestination(isDest ? null : def.id);
                notify(isDest ? 'Destination cleared' : `${def.name} set as your destination`, 'success');
              }}
              aria-pressed={isDest}
            >
              {isDest ? <Check size={16} /> : <Flag size={16} />} {isDest ? 'Your destination' : 'Set as destination'}
            </button>
            {view ? (
              <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate(`/reservations?view=${view.id}`)}>
                <Utensils size={16} /> Dine with this view
              </button>
            ) : (
              <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate('/restaurant')}>
                <Utensils size={16} /> See the restaurant
              </button>
            )}
          </div>
        </aside>

        <div className="planet-rail glass-strong">
          <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous planet">
            <ChevronLeft size={19} />
          </button>
          <ul>
            {PLANETS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`rail-chip ${p.id === def.id ? 'is-current' : ''}`}
                  style={{ '--c1': p.accent, '--c2': p.baseColor }}
                  onClick={() => select(p.id)}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  aria-pressed={p.id === def.id}
                >
                  <span className="orb orb-sm" aria-hidden="true" />
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Next planet">
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    </section>
  );
}
