import { Suspense, lazy, useLayoutEffect, useRef } from 'react';
import { ChevronDown, Compass, Rocket } from 'lucide-react';
import gsap from 'gsap';
import { useApp } from '../context/AppContext';
import ErrorBoundary from './ErrorBoundary';

const HeroCanvas = lazy(() => import('./HeroCanvas'));

export default function Hero() {
  const { navigate } = useApp();
  const root = useRef(null);

  // cinematic title reveal (skipped for visitors who prefer reduced motion)
  useLayoutEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.hero-anim', { y: 38, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14, delay: 0.2 });
      gsap.from('.hero-title span', { letterSpacing: '0.7em', duration: 1.8, ease: 'power3.out', delay: 0.1 });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={root} aria-labelledby="hero-title">
      <div className="hero-stage" aria-hidden="true">
        <ErrorBoundary fallback={() => <div className="hero-fallback" />}>
          <Suspense fallback={<div className="hero-fallback" />}>
            <HeroCanvas />
          </Suspense>
        </ErrorBoundary>
      </div>
      <div className="hero-veil" aria-hidden="true" />

      <div className="container hero-content">
        <p className="eyebrow hero-anim">Orbital fine dining · Saturn Ring Station</p>
        <h1 id="hero-title" className="hero-title hero-anim">
          <span>COSMIC</span> <em>DINE</em>
        </h1>
        <p className="hero-tag hero-anim">Beyond Earth. Beyond Taste. Beyond Imagination.</p>
        <p className="hero-sub hero-anim">
          Board the Odyssey shuttle, drift past Mars and Jupiter, and arrive at a glass-walled restaurant floating
          among the planets.
        </p>
        <div className="hero-cta hero-anim">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/journey')}>
            <Compass size={19} /> Explore the Galaxy
          </button>
          <button type="button" className="btn btn-glass btn-lg" onClick={() => navigate('/reservations')}>
            <Rocket size={19} /> Book Your Space Journey
          </button>
        </div>
        <ul className="hero-stats hero-anim">
          <li><strong>7</strong><span>worlds in view</span></li>
          <li><strong>5</strong><span>galactic menus</span></li>
          <li><strong>1</strong><span>table among the stars</span></li>
        </ul>
      </div>

      <button
        type="button"
        className="scroll-cue"
        onClick={() => document.getElementById('home-next')?.scrollIntoView({ behavior: 'smooth' })}
        aria-label="Scroll to explore"
      >
        <ChevronDown size={22} />
      </button>
    </section>
  );
}
