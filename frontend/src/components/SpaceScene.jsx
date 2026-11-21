import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import StarField from './three/StarField';
import { SkyNebula, NebulaCloud, Galaxy } from './three/Nebula';
import Asteroids from './three/Asteroids';
import Planet from './Planet';
import Spaceship from './Spaceship';
import { PLANET_BY_ID } from '../data/planets';

/** Closed Lissajous-style flight path across the hero view. */
function shipPath(t, out) {
  out.set(
    Math.sin(t * 0.22) * 6.2,
    1.1 + Math.sin(t * 0.37 + 1) * 1.1,
    -1.5 + Math.cos(t * 0.22) * 3.2
  );
  return out;
}

function HeroShip({ motion }) {
  const ref = useRef();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const next = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const lastX = useRef(0);
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    time.current += Math.min(delta, 0.05) * Math.max(motion, 0.2);
    const t = time.current;
    shipPath(t, pos);
    shipPath(t + 0.06, next);
    // the nose points to -Z, Object3D.lookAt aims +Z, so aim away from the direction of travel
    look.copy(pos).multiplyScalar(2).sub(next);
    ref.current.position.copy(pos);
    ref.current.lookAt(look);
    const bank = THREE.MathUtils.clamp((next.x - pos.x - lastX.current) * -260, -0.6, 0.6);
    lastX.current = next.x - pos.x;
    ref.current.rotateZ(bank);
  });

  return <Spaceship ref={ref} scale={0.42} thrust={1.1} />;
}

/** Mouse parallax so the whole scene feels deep and alive. */
function CameraRig({ enabled }) {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0.2, 0), []);
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-2.5 * Math.min(delta, 0.05));
    const px = enabled ? pointer.x * 0.9 : 0;
    const py = enabled ? pointer.y * 0.5 : 0;
    camera.position.x += (px - camera.position.x) * k;
    camera.position.y += (0.4 + py - camera.position.y) * k;
    camera.lookAt(target);
  });
  return null;
}

/**
 * Hero scene: starfield, nebulae, a distant galaxy, rotating Earth with its Moon,
 * a drifting asteroid field and the Odyssey shuttle gliding through it all.
 */
export default function SpaceScene({ quality }) {
  const { size } = useThree();
  const wide = size.width / size.height > 1.15;
  const earthPos = wide ? [5.4, -0.9, -4.5] : [0.4, -3.4, -6];
  const earthRadius = wide ? 3.7 : 3.1;
  const motion = quality.motion;

  return (
    <>
      <color attach="background" args={['#02030a']} />
      <ambientLight intensity={0.35} color="#8fa0ff" />
      <directionalLight position={[-12, 6, 10]} intensity={3.6} color="#fff4e6" />
      <directionalLight position={[10, -4, -6]} intensity={1.1} color="#8a5bff" />

      <StarField count={quality.stars} motion={motion} />
      <SkyNebula motion={motion} />
      <Galaxy position={[-70, 34, -150]} radius={46} count={quality.isMobile ? 800 : 1700} motion={motion} />
      <NebulaCloud position={[-14, 5, -30]} size={44} particles={quality.isMobile ? 160 : 380} motion={motion} />

      <Planet def={PLANET_BY_ID.earth} radius={earthRadius} position={earthPos} quality={quality.texture} motion={motion} />

      <Asteroids
        count={quality.asteroids}
        center={[0, 0.5, -9]}
        size={[44, 11, 22]}
        scale={[0.08, 0.42]}
        drift={[-0.4, 0, 0]}
        motion={motion}
      />

      <HeroShip motion={motion} />
      <CameraRig enabled={!quality.isMobile && !quality.reduced} />
    </>
  );
}
