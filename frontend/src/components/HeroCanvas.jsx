import SceneCanvas from './SceneCanvas';
import SpaceScene from './SpaceScene';
import { useQuality } from '../hooks/useQuality';

/** Lazy-loaded so the headline and buttons paint before three.js has finished downloading. */
export default function HeroCanvas() {
  const quality = useQuality();
  return (
    <SceneCanvas
      className="hero-canvas"
      camera={{ position: [0, 0.4, 9], fov: 48, near: 0.1, far: 2000 }}
      loadingLabel="Igniting the starfield…"
    >
      <SpaceScene quality={quality} />
    </SceneCanvas>
  );
}
