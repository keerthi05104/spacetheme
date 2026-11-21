import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import StarField from './three/StarField';
import Asteroids from './three/Asteroids';
import Planet from './Planet';
import Spaceship from './Spaceship';
import { makeHoloTexture } from '../utils/textures';
import { FOOD_ITEMS, formatPrice, CATEGORY_BY_ID } from '../data/foodItems';

const R = 15; // window arc radius
const H = 8; // window height
const PANES = 14;
const SPAN = Math.PI * 0.95;
const TARGET = [0, 1.6, -4];
const REST = [0, 1.8, 8.5];

const polar = (a, r) => [Math.sin(a) * r, Math.cos(a) * -r];

function WindowWall() {
  const panes = useMemo(() => {
    const d = SPAN / PANES;
    const w = 2 * R * Math.sin(d / 2);
    return Array.from({ length: PANES }, (_, i) => {
      const a = -SPAN / 2 + d * (i + 0.5);
      const [x, z] = polar(a, R);
      return { a, x, z, w, edge: -SPAN / 2 + d * i };
    });
  }, []);
  return (
    <group>
      {panes.map((p, i) => (
        <group key={i}>
          <mesh position={[p.x, H / 2, p.z]} rotation={[0, -p.a, 0]}>
            <planeGeometry args={[p.w, H]} />
            <meshBasicMaterial color="#7fa8ff" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[p.x, H, p.z]} rotation={[0, -p.a, 0]}>
            <boxGeometry args={[p.w, 0.28, 0.5]} />
            <meshStandardMaterial color="#1a2347" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh position={[p.x, 0.12, p.z]} rotation={[0, -p.a, 0]}>
            <boxGeometry args={[p.w, 0.14, 0.2]} />
            <meshBasicMaterial color={i % 2 ? '#38e8ff' : '#a56bff'} toneMapped={false} />
          </mesh>
          {(() => {
            const [px, pz] = polar(p.edge, R);
            return (
              <mesh position={[px, H / 2, pz]}>
                <boxGeometry args={[0.22, H, 0.22]} />
                <meshStandardMaterial color="#232e5c" metalness={0.85} roughness={0.3} />
              </mesh>
            );
          })()}
        </group>
      ))}
    </group>
  );
}

function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R + 1, 72]} />
        <meshStandardMaterial color="#080d26" metalness={0.85} roughness={0.22} />
      </mesh>
      {[4, 8, 12].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[r - 0.04, r + 0.04, 96]} />
          <meshBasicMaterial color={i === 1 ? '#a56bff' : '#38e8ff'} transparent opacity={0.35} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Chair({ angle }) {
  return (
    <group rotation={[0, angle, 0]}>
      <group position={[1.35, 0, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#2b365f" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.09, 20]} />
          <meshStandardMaterial color="#4b2fb5" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0.3, 0.85, 0]}>
          <boxGeometry args={[0.08, 0.7, 0.55]} />
          <meshStandardMaterial color="#3a2a8f" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Table({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.13, 0.2, 0.8, 14]} />
        <meshStandardMaterial color="#2b365f" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.06, 36]} />
        <meshStandardMaterial color="#10183d" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.86, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.022, 8, 48]} />
        <meshBasicMaterial color="#38e8ff" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <Chair key={k} angle={(k * Math.PI) / 2 + Math.PI / 4} />
      ))}
    </group>
  );
}

const TABLE_SPOTS = [
  [-0.95, 9.5], [-0.5, 6.4], [0, 9.8], [0.5, 6.4], [0.95, 9.5], [-0.3, 3.2], [0.3, 3.2],
];

/** A floating holographic menu: gently bobs, grows on hover, opens the menu on click. */
function HoloMenu({ category, angle, onOpen, onHover }) {
  const ref = useRef();
  const [hover, setHover] = useState(false);
  const cat = CATEGORY_BY_ID[category];
  const tex = useMemo(() => {
    const lines = FOOD_ITEMS.filter((f) => f.category === category)
      .slice(0, 4)
      .map((f) => ({ name: f.name.length > 22 ? `${f.name.slice(0, 21)}…` : f.name, price: formatPrice(f.price) }));
    return makeHoloTexture(cat.name, lines, `hsl(${cat.hue} 95% 70%)`);
  }, [category, cat]);
  useEffect(() => () => tex.dispose(), [tex]);
  const [x, z] = polar(angle, 10.5);
  const phase = angle * 3;

  useFrame((s, delta) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = 3.6 + Math.sin(s.clock.elapsedTime * 0.9 + phase) * 0.14;
    const t = hover ? 1.08 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, t, 8, Math.min(delta, 0.05)));
  });

  return (
    <group ref={ref} position={[x, 3.6, z]} rotation={[0, -angle, 0]}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); onHover(true); }}
        onPointerOut={() => { setHover(false); onHover(false); }}
        onClick={(e) => { e.stopPropagation(); onOpen(category); }}
      >
        <planeGeometry args={[2.6, 3.25]} />
        <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh raycast={() => null}>
        <planeGeometry args={[2.68, 3.33]} />
        <meshBasicMaterial color={`hsl(${cat.hue} 95% 70%)`} wireframe transparent opacity={hover ? 0.7 : 0.25} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A small shuttle that sweeps past the windows now and then. */
function PassingShip({ motion }) {
  const ref = useRef();
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += Math.min(delta, 0.05) * Math.max(motion, 0.2);
    const phase = (t.current * 0.045) % 1;
    if (ref.current) {
      ref.current.position.set(-46 + phase * 92, 11 + Math.sin(phase * 6) * 1.5, -34);
      ref.current.rotation.y = -Math.PI / 2; // nose (-Z) points toward +X
    }
  });
  return <Spaceship ref={ref} scale={0.9} lights={false} thrust={1.2} />;
}

function OutsidePlanet({ def, quality, motion }) {
  const g = useRef();
  useLayoutEffect(() => {
    if (!g.current) return undefined;
    const tw = gsap.fromTo(g.current.scale, { x: 0.55, y: 0.55, z: 0.55 }, { x: 1, y: 1, z: 1, duration: 1.4, ease: 'power3.out' });
    return () => tw.kill();
  }, [def.id]);
  const r = def.ring ? 11 : def.id === 'jupiter' ? 15 : 14;
  return (
    <group ref={g}>
      <Planet def={def} radius={r} position={[18, 10, -62]} quality={quality} motion={motion} />
    </group>
  );
}

/**
 * Orbital dining hall. On mount the camera swoops down from above the deck (GSAP);
 * afterwards OrbitControls lets the visitor look around within comfortable limits.
 */
export default function RestaurantScene({ planetDef, quality, onOpenMenu, onHover, onArrived }) {
  const { camera } = useThree();
  const [ready, setReady] = useState(false);
  const motion = quality.motion;

  useLayoutEffect(() => {
    if (quality.reduced) {
      camera.position.set(...REST);
      setReady(true);
      onArrived?.();
      return undefined;
    }
    camera.position.set(0, 16, 36);
    const tw = gsap.to(camera.position, {
      x: REST[0], y: REST[1], z: REST[2], duration: 4.2, ease: 'power3.inOut',
      onComplete: () => { setReady(true); onArrived?.(); },
    });
    return () => tw.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <color attach="background" args={['#02030a']} />
      <ambientLight intensity={0.55} color="#8f9dff" />
      <directionalLight position={[-10, 10, 14]} intensity={2.6} color="#fff4e6" />
      <pointLight position={[-7, 6, -4]} color="#38e8ff" intensity={90} distance={30} decay={2} />
      <pointLight position={[7, 6, -4]} color="#a56bff" intensity={90} distance={30} decay={2} />
      <pointLight position={[0, 4, 2]} color="#ffd9a0" intensity={50} distance={24} decay={2} />

      <StarField count={quality.stars} motion={motion} />
      <OutsidePlanet def={planetDef} quality={quality.texture} motion={motion} />
      <Asteroids count={quality.isMobile ? 14 : 26} center={[0, 5, -40]} size={[80, 18, 16]} scale={[0.3, 1.3]} drift={[0.5, 0, 0]} motion={motion} />
      <PassingShip motion={motion} />

      <Floor />
      <WindowWall />
      {TABLE_SPOTS.map(([a, r]) => {
        const [x, z] = polar(a, r);
        return <Table key={`${a}-${r}`} position={[x, 0, z]} />;
      })}
      {[['starters', -0.6], ['mains', 0], ['desserts', 0.6]].map(([c, a]) => (
        <HoloMenu key={c} category={c} angle={a} onOpen={onOpenMenu} onHover={onHover} />
      ))}

      <OrbitControls
        makeDefault
        target={TARGET}
        enabled={ready}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.5}
        minPolarAngle={ready ? 1.25 : 0}
        maxPolarAngle={ready ? 1.8 : Math.PI}
        minAzimuthAngle={ready ? -0.9 : -Infinity}
        maxAzimuthAngle={ready ? 0.9 : Infinity}
      />
    </>
  );
}
