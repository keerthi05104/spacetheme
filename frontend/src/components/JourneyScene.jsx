import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import StarField from './three/StarField';
import { SkyNebula, NebulaCloud, Galaxy } from './three/Nebula';
import Asteroids from './three/Asteroids';
import Planet from './Planet';
import Spaceship from './Spaceship';
import Station from './Station';
import { PLANET_BY_ID } from '../data/planets';
import { STAGES } from '../data/journey';
import { getDotTexture } from '../utils/textures';

const SHIP_SCALE = 0.6;

/** Thin streaks of dust along the flight corridor: they sell the feeling of speed. */
function FlightDust({ count = 700 }) {
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 26;
      pos.set([Math.cos(a) * r, Math.sin(a) * r * 0.6, 20 - Math.random() * 380], i * 3);
    }
    return pos;
  }, [count]);
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={data} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.22} sizeAttenuation map={getDotTexture()} color="#bcd0ff" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/**
 * The whole journey lives in one continuous scene along the -Z axis.
 * GSAP tweens the ship position and the camera offsets between stages;
 * `explore` hands the camera over to OrbitControls.
 */
export default function JourneyScene({ stage, explore, quality, onTravel }) {
  const { camera } = useThree();
  const ship = useRef();
  const controls = useRef();
  const motion = quality.motion;

  const rig = useRef({ thrust: 0.6, hatch: 0 }).current;
  // camera offset + look-at offset relative to the ship, animated by GSAP
  const cam = useRef({ ox: 0, oy: 0, oz: 0, lx: 0, ly: 0, lz: 0 }).current;
  const shipPos = useRef(new THREE.Vector3(0, 0, 8)).current;
  const lookV = useMemo(() => new THREE.Vector3(), []);
  const tl = useRef(null);
  const first = useRef(true);
  const exploring = useRef(explore);
  exploring.current = explore;

  const goTo = (idx, instant) => {
    const s = STAGES[idx];
    if (!s) return;
    tl.current?.kill();
    const [sx, sy, sz] = s.ship;
    const target = {
      ox: s.cam.off[0], oy: s.cam.off[1], oz: s.cam.off[2],
      lx: s.cam.look[0], ly: s.cam.look[1], lz: s.cam.look[2],
    };

    if (instant || quality.reduced) {
      shipPos.set(sx, sy, sz);
      Object.assign(cam, target);
      rig.thrust = s.cockpit ? 1 : 0.6;
      rig.hatch = s.cockpit ? 1 : 0;
      onTravel?.(false);
      return;
    }

    const moving = Math.abs(shipPos.z - sz) > 1;
    const t = gsap.timeline({ onComplete: () => onTravel?.(false) });
    onTravel?.(true);

    if (s.cockpit) {
      // Boarding: circle to the hatch, open it, then slide into the cockpit seat
      t.to(rig, { hatch: 1, duration: 0.9, ease: 'power2.out' }, 0);
      t.to(cam, { ox: 2.7, oy: 0.5, oz: -0.1, lx: 0.4, ly: 0, lz: -0.45, duration: 1.6, ease: 'power2.inOut' }, 0);
      t.to(cam, { ...target, duration: 1.8, ease: 'power3.inOut' }, 1.5);
      t.to(rig, { thrust: 1, duration: 1.2 }, 2.2);
    } else {
      const dur = moving ? Math.min(7.5, 2.8 + Math.abs(shipPos.z - sz) / 22) : 2.2;
      t.to(rig, { hatch: 0, duration: 0.6 }, 0);
      t.to(rig, { thrust: moving ? 2 : 0.7, duration: 0.8, ease: 'power2.out' }, 0);
      t.to(shipPos, { x: sx, y: sy, z: sz, duration: dur, ease: 'power2.inOut' }, 0);
      t.to(cam, { ...target, duration: Math.max(2.2, dur * 0.85), ease: 'power2.inOut' }, moving ? 0.15 : 0);
      t.to(rig, { thrust: 0.7, duration: 1.2, ease: 'power2.in' }, Math.max(0, dur - 1));
    }
    tl.current = t;
  };

  // react to stage changes (jump instantly on first mount, e.g. restored from sessionStorage)
  useEffect(() => {
    const instant = first.current;
    first.current = false;
    goTo(stage, instant);
    return () => tl.current?.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // when leaving free-explore, glide back to the current stage framing from wherever the user is
  const wasExplore = useRef(false);
  useEffect(() => {
    if (wasExplore.current && !explore) {
      cam.ox = camera.position.x - shipPos.x;
      cam.oy = camera.position.y - shipPos.y;
      cam.oz = camera.position.z - shipPos.z;
      const tgt = controls.current?.target;
      if (tgt) {
        cam.lx = tgt.x - shipPos.x;
        cam.ly = tgt.y - shipPos.y;
        cam.lz = tgt.z - shipPos.z;
      }
      goTo(stage, false);
    }
    wasExplore.current = explore;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explore]);

  useFrame(() => {
    if (ship.current) {
      ship.current.position.copy(shipPos);
      // gentle hover/bob
      ship.current.position.y += Math.sin(performance.now() * 0.0012) * 0.04 * motion;
    }
    if (exploring.current) {
      if (controls.current) controls.current.target.lerp(shipPos, 0.08);
      return;
    }
    camera.position.set(shipPos.x + cam.ox, shipPos.y + cam.oy, shipPos.z + cam.oz);
    lookV.set(shipPos.x + cam.lx, shipPos.y + cam.ly, shipPos.z + cam.lz);
    camera.lookAt(lookV);
  });

  const mars = PLANET_BY_ID.mars;
  const jupiter = PLANET_BY_ID.jupiter;
  const saturn = PLANET_BY_ID.saturn;
  const earth = PLANET_BY_ID.earth;
  const tex = quality.texture;

  return (
    <>
      <color attach="background" args={['#02030a']} />
      <fog attach="fog" args={['#02030a', 260, 900]} />
      <ambientLight intensity={0.32} color="#8fa0ff" />
      <directionalLight position={[-30, 14, 40]} intensity={3.4} color="#fff4e6" />
      <directionalLight position={[20, -10, -30]} intensity={0.9} color="#8a5bff" />

      <StarField count={quality.stars} radius={900} motion={motion} sizeRange={[1.4, 3.8]} />
      <SkyNebula motion={motion} />
      <Galaxy position={[-160, 70, -260]} radius={80} count={quality.isMobile ? 900 : 2000} motion={motion} />
      {!quality.isMobile && <Galaxy position={[200, -50, -420]} radius={60} count={1200} arms={2} rotation={[0.6, 0.4, 1.2]} motion={motion} />}
      <FlightDust count={quality.isMobile ? 300 : 700} />

      {/* Earth: launch pad */}
      <Planet def={earth} radius={9} position={[-9, -7, -6]} quality={tex} motion={motion} />

      {/* Mars flyby */}
      <Planet def={mars} radius={3.6} position={[7, 0, -74]} quality={tex} motion={motion} orbitLines />

      {/* asteroid belt (with a clear corridor for the shuttle) */}
      <Asteroids
        count={quality.asteroids * 2}
        center={[0, 0, -135]}
        size={[46, 18, 70]}
        scale={[0.2, 1.5]}
        drift={[-0.3, 0, 0.1]}
        exclude={{ x: 0, y: 0, radius: 3.2 }}
        motion={motion}
      />

      {/* Jupiter */}
      <Planet def={jupiter} radius={9} position={[-15, -1, -214]} quality={tex} motion={motion} />

      {/* Nebula before arrival */}
      <NebulaCloud position={[0, 0, -262]} size={110} particles={quality.isMobile ? 220 : 520} motion={motion} />
      <NebulaCloud position={[-30, 14, -300]} size={70} particles={150} motion={motion} palette={['255,80,200', '90,80,255', '56,232,255']} />

      {/* Destination: orbital restaurant above Saturn */}
      <Station position={[0, 2, -350]} scale={1.6} motion={motion} />
      <Planet def={saturn} radius={24} position={[46, -8, -470]} quality={tex} motion={motion} />

      <Spaceship ref={ship} scale={SHIP_SCALE} rig={rig} />

      <OrbitControls
        ref={controls}
        makeDefault
        enabled={explore}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={140}
        rotateSpeed={0.7}
      />
    </>
  );
}
