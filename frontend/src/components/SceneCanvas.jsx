import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import ErrorBoundary from './ErrorBoundary';
import Loader from './Loader';
import { useQuality } from '../hooks/useQuality';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function Fallback({ onRetry, reason }) {
  return (
    <div className="scene-fallback">
      <div className="scene-fallback-card glass">
        <h3>3D view unavailable</h3>
        <p>{reason || "Your browser or device couldn't start WebGL."} The rest of COSMIC DINE still works.</p>
        {onRetry && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Shared <Canvas> wrapper:
 *  - checks for WebGL support and survives context loss
 *  - pauses rendering while off-screen or when the tab is hidden (saves battery / GPU)
 *  - adapts pixel ratio and antialiasing to the device
 */
export default function SceneCanvas({ children, camera, className = '', loadingLabel, onCreated, ...rest }) {
  const wrap = useRef(null);
  const quality = useQuality();
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [lost, setLost] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [supported] = useState(hasWebGL);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (!supported) {
    return (
      <div className={`scene-canvas ${className}`} ref={wrap}>
        <Fallback />
      </div>
    );
  }

  return (
    <div className={`scene-canvas ${className}`} ref={wrap}>
      <ErrorBoundary
        fallback={(err, reset) => (
          <Fallback
            reason="Something went wrong while drawing the scene."
            onRetry={() => {
              setLost(false);
              setReady(false);
              setAttempt((n) => n + 1);
              reset();
            }}
          />
        )}
      >
        <Canvas
          key={attempt}
          frameloop={inView && tabVisible && !lost ? 'always' : 'never'}
          dpr={quality.dpr}
          camera={camera}
          gl={{ antialias: !quality.isMobile, powerPreference: 'high-performance', alpha: false }}
          onCreated={(state) => {
            state.gl.setClearColor('#02030a');
            state.gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setLost(true);
            });
            setReady(true);
            onCreated?.(state);
          }}
          {...rest}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      </ErrorBoundary>
      {!ready && !lost && <Loader label={loadingLabel || 'Warming up the engines…'} />}
      {lost && (
        <Fallback
          reason="The graphics context was lost."
          onRetry={() => {
            setLost(false);
            setReady(false);
            setAttempt((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
