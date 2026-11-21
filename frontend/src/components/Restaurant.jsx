import { useEffect, useState } from 'react';
import { MousePointerClick, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SceneCanvas from './SceneCanvas';
import RestaurantScene from './RestaurantScene';
import { VIEWS } from '../data/dining';
import { PLANET_BY_ID } from '../data/planets';
import { useQuality } from '../hooks/useQuality';

/** The 3D dining hall with a window-view switcher. */
export default function Restaurant() {
  const { navigate } = useApp();
  const quality = useQuality();
  const [viewId, setViewId] = useState('earthrise');
  const [arrived, setArrived] = useState(false);
  const [replay, setReplay] = useState(0);
  const [hover, setHover] = useState(false);
  const view = VIEWS.find((v) => v.id === viewId) || VIEWS[0];

  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hover]);

  return (
    <section className="restaurant-hero" aria-label="The orbital restaurant">
      <div className="restaurant-stage">
        <SceneCanvas
          key={replay}
          className="restaurant-canvas"
          camera={{ position: [0, 16, 36], fov: 55, near: 0.1, far: 2500 }}
          loadingLabel="Docking with the station…"
        >
          <RestaurantScene
            planetDef={PLANET_BY_ID[view.planetId]}
            quality={quality}
            onOpenMenu={(cat) => navigate(`/menu?cat=${cat}`)}
            onHover={setHover}
            onArrived={() => setArrived(true)}
          />
        </SceneCanvas>
      </div>
      <div className="restaurant-veil" aria-hidden="true" />

      <div className="restaurant-ui container">
        <div className="restaurant-title">
          <span className="eyebrow">The orbital restaurant</span>
          <h1>Dinner with the universe as your window</h1>
          <p>{arrived ? view.blurb : 'Descending to the dining deck…'}</p>
        </div>

        <div className="restaurant-controls glass-strong">
          <span className="controls-label">Window view</span>
          <div className="chip-row" role="group" aria-label="Choose the planet outside the window">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`chip ${v.id === viewId ? 'is-on' : ''}`}
                onClick={() => setViewId(v.id)}
                aria-pressed={v.id === viewId}
              >
                {v.name}
              </button>
            ))}
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/reservations?view=${view.id}`)}>
              Reserve this view
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setArrived(false);
                setReplay((n) => n + 1);
              }}
            >
              <RotateCcw size={15} /> Replay arrival
            </button>
          </div>
          <p className="hint">
            <MousePointerClick size={14} /> Drag to look around · click a hologram to open its menu
          </p>
        </div>
      </div>
    </section>
  );
}
