import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import StarField from './three/StarField';
import { SkyNebula } from './three/Nebula';
import Planet from './Planet';
import { PLANETS } from '../data/planets';

const GAP = 2.4;

/** Lay the planets out in a row, spaced by their radii. */
export function layoutPlanets() {
  let x = 0;
  return PLANETS.map((p, i) => {
    const r = p.displayRadius * (p.ring ? 1 : 1);
    if (i > 0) x += PLANETS[i - 1].displayRadius * (PLANETS[i - 1].ring ? 2.35 : 1) + r * (p.ring ? 2.35 : 1) + GAP;
    return { def: p, r, x };
  });
}

function CameraRig({ target, radius, explored }) {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-3.2 * Math.min(delta, 0.05));
    const narrow = size.width / size.height < 0.9;
    const dist = radius * (explored ? 4.2 : 6.2) * (narrow ? 1.45 : 1);
    const shift = narrow ? 0 : dist * 0.2; // planet sits left of centre, panel on the right
    const y = narrow ? -radius * 0.55 : radius * 0.1;
    camera.position.x += (target + shift - camera.position.x) * k;
    camera.position.y += (y - camera.position.y) * k;
    camera.position.z += (dist - camera.position.z) * k;
    look.set(camera.position.x, y * 0.4, 0);
    camera.lookAt(look);
  });
  return null;
}

export default function PlanetsScene({ selectedId, hoveredId, explored, onHover, onSelect, quality }) {
  const layout = useMemo(layoutPlanets, []);
  const sel = layout.find((l) => l.def.id === selectedId) || layout[0];
  const motion = quality.motion;

  return (
    <>
      <color attach="background" args={['#02030a']} />
      <ambientLight intensity={0.4} color="#8fa0ff" />
      <directionalLight position={[-14, 8, 14]} intensity={3.4} color="#fff4e6" />
      <directionalLight position={[16, -6, -10]} intensity={0.9} color="#8a5bff" />
      <StarField count={quality.stars} motion={motion} />
      <SkyNebula motion={motion} />

      {layout.map(({ def, r, x }) => (
        <group key={def.id}>
          <Planet
            def={def}
            radius={r}
            position={[x, 0, 0]}
            quality={quality.texture}
            motion={motion}
            hovered={hoveredId === def.id}
            selected={selectedId === def.id}
            orbitLines={explored && selectedId === def.id}
            onPointerOver={onHover}
            onPointerOut={() => onHover(null)}
            onClick={onSelect}
          />
          <Html position={[x, -(r * (def.ring ? 2.35 : 1) + 0.7), 0]} center style={{ pointerEvents: 'none' }}>
            <span className={`planet-label ${selectedId === def.id ? 'is-selected' : ''}`}>{def.name}</span>
          </Html>
        </group>
      ))}

      <CameraRig target={sel.x} radius={sel.r * (sel.def.ring ? 1.6 : 1)} explored={explored} />
    </>
  );
}
