import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Hand, Pause, Play, RotateCcw, Rocket, Utensils, Calendar, Telescope } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SceneCanvas from '../components/SceneCanvas';
import JourneyScene from '../components/JourneyScene';
import { STAGES } from '../data/journey';
import { useQuality } from '../hooks/useQuality';

const LAST = STAGES.length - 1;

export default function Journey() {
  const { journey, setJourney, navigate } = useApp();
  const quality = useQuality();
  const stage = journey.stage;
  const current = STAGES[stage];
  const [explore, setExplore] = useState(false);
  const [traveling, setTraveling] = useState(false);
  const [auto, setAuto] = useState(false);

  const goStage = useCallback(
    (i) => {
      const n = Math.max(0, Math.min(LAST, i));
      setExplore(false);
      setJourney((j) => ({ ...j, stage: n, completed: j.completed || n === LAST }));
    },
    [setJourney]
  );

  // autopilot: advance once the ship has settled, pause between stops
  useEffect(() => {
    if (!auto) return undefined;
    if (stage >= LAST) {
      setAuto(false);
      return undefined;
    }
    if (traveling || explore) return undefined;
    const id = setTimeout(() => goStage(stage + 1), 2600);
    return () => clearTimeout(id);
  }, [auto, stage, traveling, explore, goStage]);

  // keyboard control
  useEffect(() => {
    const onKey = (e) => {
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') goStage(stage + 1);
      if (e.key === 'ArrowLeft') goStage(stage - 1);
      if (e.key === 'Escape') setExplore(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, goStage]);

  const restart = () => {
    setAuto(false);
    setJourney({ stage: 0, completed: false });
    setExplore(false);
  };

  const arrived = stage === LAST;
  const nextLabel = stage === 0 ? 'Board the Odyssey' : `Next: ${STAGES[Math.min(stage + 1, LAST)].short}`;

  return (
    <section className="journey" aria-label="Interactive space journey">
      <div className="journey-stage">
        <SceneCanvas
          className="journey-canvas"
          camera={{ position: [7.5, 2.6, 14.5], fov: 55, near: 0.1, far: 3000 }}
          loadingLabel="Fuelling the Odyssey…"
        >
          <JourneyScene stage={stage} explore={explore} quality={quality} onTravel={setTraveling} />
        </SceneCanvas>
      </div>
      <div className="journey-veil" aria-hidden="true" />

      <div className="journey-ui container">
        <div className="journey-card glass" key={current.id} aria-live="polite">
          <span className="eyebrow">
            Stage {stage + 1} of {STAGES.length}
            {traveling && <span className="status-dot" aria-label="In transit">In transit</span>}
          </span>
          <h1>{current.title}</h1>
          <p>{current.blurb}</p>
        </div>

        {arrived && !traveling && !explore && (
          <div className="arrival-card glass-strong">
            <h2>You have arrived</h2>
            <p>Welcome to the orbital ring. Choose how to begin your evening.</p>
            <div className="cta-row">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/restaurant')}>
                <Telescope size={16} /> Enter restaurant
              </button>
              <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate('/reservations')}>
                <Calendar size={16} /> Book a table
              </button>
              <button type="button" className="btn btn-glass btn-sm" onClick={() => navigate('/menu')}>
                <Utensils size={16} /> View menu
              </button>
            </div>
          </div>
        )}

        {explore && (
          <p className="explore-hint glass">
            <Hand size={15} /> Drag to orbit · scroll or pinch to zoom · press Esc to return to the flight path
          </p>
        )}

        <div className="journey-controls glass-strong">
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${(stage / LAST) * 100}%` }} />
          </div>
          <ol className="stepper" aria-label="Journey stages">
            {STAGES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`step ${i === stage ? 'is-current' : ''} ${i < stage ? 'is-done' : ''}`}
                  onClick={() => goStage(i)}
                  aria-current={i === stage ? 'step' : undefined}
                  aria-label={`Go to stage ${i + 1}: ${s.short}`}
                >
                  <span className="step-dot" />
                  <span className="step-label">{s.short}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="control-row">
            <button type="button" className="btn btn-glass btn-sm" onClick={() => goStage(stage - 1)} disabled={stage === 0}>
              <ArrowLeft size={16} /> Back
            </button>
            {!arrived ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => goStage(stage + 1)}>
                {stage === 0 && <Rocket size={16} />} {nextLabel} <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/restaurant')}>
                Enter restaurant <ArrowRight size={16} />
              </button>
            )}
            <button
              type="button"
              className={`btn btn-glass btn-sm ${auto ? 'is-on' : ''}`}
              onClick={() => {
                if (!auto && arrived) restart();
                setAuto((a) => !a);
              }}
              aria-pressed={auto}
            >
              {auto ? <Pause size={16} /> : <Play size={16} />} {auto ? 'Pause autopilot' : 'Autopilot'}
            </button>
            <button
              type="button"
              className={`btn btn-glass btn-sm ${explore ? 'is-on' : ''}`}
              onClick={() => {
                setAuto(false);
                setExplore((e) => !e);
              }}
              aria-pressed={explore}
            >
              <Hand size={16} /> {explore ? 'Back to flight' : 'Free explore'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={restart}>
              <RotateCcw size={15} /> Restart
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
