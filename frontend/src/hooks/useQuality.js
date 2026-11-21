import { useEffect, useState } from 'react';

function compute() {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, reduced: false, motion: 1, dpr: [1, 2], stars: 2800, asteroids: 90, particles: 900, texture: 'mid' };
  }
  const w = window.innerWidth;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const isMobile = w < 768 || (coarse && w < 1024);
  const isTablet = !isMobile && w < 1100;
  return {
    isMobile,
    isTablet,
    reduced,
    motion: reduced ? 0.15 : 1, // global multiplier applied to scene animation speeds
    dpr: isMobile ? [1, 1.5] : [1, 2],
    stars: isMobile ? 1200 : isTablet ? 2000 : 2800,
    asteroids: isMobile ? 36 : isTablet ? 60 : 90,
    particles: isMobile ? 350 : 900,
    texture: isMobile ? 'low' : 'mid',
  };
}

/** Quality + accessibility profile that adapts 3D density and animation to the device. */
export function useQuality() {
  const [q, setQ] = useState(compute);

  useEffect(() => {
    const update = () => setQ(compute());
    window.addEventListener('resize', update);
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    mq?.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      mq?.removeEventListener?.('change', update);
    };
  }, []);

  return q;
}

export default useQuality;
