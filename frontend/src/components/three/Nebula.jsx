import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getDotTexture, getNebulaTexture } from '../../utils/textures';

const SKY_CLOUDS = [
  { dir: [-0.62, 0.26, -0.74], scale: 640, a: '118,60,255', b: '56,232,255', opacity: 0.5, rot: 0.3 },
  { dir: [0.72, -0.12, -0.68], scale: 560, a: '255,80,200', b: '90,80,255', opacity: 0.36, rot: 1.2 },
  { dir: [0.08, 0.55, -0.83], scale: 520, a: '60,120,255', b: '170,80,255', opacity: 0.36, rot: 2.1 },
  { dir: [-0.3, -0.5, 0.81], scale: 560, a: '90,70,255', b: '40,200,255', opacity: 0.3, rot: 0.8 },
];

/** Big, soft nebula sprites glued to the sky (they follow the camera, like the stars). */
export function SkyNebula({ clouds = SKY_CLOUDS, distance = 760, motion = 1 }) {
  const group = useRef();
  const sprites = useMemo(
    () =>
      clouds.map((c, i) => ({
        ...c,
        pos: new THREE.Vector3(...c.dir).normalize().multiplyScalar(distance),
        tex: getNebulaTexture(`sky${i}`, c.a, c.b),
      })),
    [clouds, distance]
  );
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.position.copy(state.camera.position);
    group.current.rotation.y += delta * 0.003 * motion;
  });
  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        <sprite key={i} position={s.pos} scale={[s.scale, s.scale, 1]} renderOrder={-9}>
          <spriteMaterial
            map={s.tex}
            transparent
            opacity={s.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            rotation={s.rot}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  );
}

/** A local volumetric-looking nebula: layered sprites plus glowing dust particles. */
export function NebulaCloud({ position = [0, 0, 0], size = 60, particles = 500, motion = 1, palette = ['118,60,255', '56,232,255', '255,80,200'] }) {
  const group = useRef();
  const sprites = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return {
          pos: [Math.cos(a * 1.7) * size * 0.32, Math.sin(a * 2.3) * size * 0.18, Math.sin(a) * size * 0.3],
          scale: size * (0.8 + (i % 3) * 0.28),
          rot: i * 0.9,
          tex: getNebulaTexture(`local${i % 3}`, palette[i % palette.length], palette[(i + 1) % palette.length]),
          opacity: 0.38,
        };
      }),
    [size, palette]
  );

  const dust = useMemo(() => {
    const pos = new Float32Array(particles * 3);
    const col = new Float32Array(particles * 3);
    const c = new THREE.Color();
    const tints = ['#7a5cff', '#38e8ff', '#ff6bd6', '#ffffff'];
    for (let i = 0; i < particles; i += 1) {
      // gaussian-ish cluster
      const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      pos.set([g() * size * 0.7, g() * size * 0.32, g() * size * 0.7], i * 3);
      c.set(tints[Math.floor(Math.random() * tints.length)]);
      col.set([c.r, c.g, c.b], i * 3);
    }
    return { pos, col };
  }, [particles, size]);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.01 * motion;
  });

  return (
    <group ref={group} position={position}>
      {sprites.map((s, i) => (
        <sprite key={i} position={s.pos} scale={[s.scale, s.scale, 1]}>
          <spriteMaterial map={s.tex} transparent opacity={s.opacity} depthWrite={false} blending={THREE.AdditiveBlending} rotation={s.rot} />
        </sprite>
      ))}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={dust.pos} count={particles} itemSize={3} />
          <bufferAttribute attach="attributes-color" array={dust.col} count={particles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={1.4}
          sizeAttenuation
          vertexColors
          map={getDotTexture()}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** A distant spiral galaxy made of a few hundred points. */
export function Galaxy({ position = [0, 0, 0], radius = 40, count = 1600, arms = 3, rotation = [1.1, 0.2, 0.35], motion = 1 }) {
  const ref = useRef();
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const inner = new THREE.Color('#ffd9a8');
    const mid = new THREE.Color('#b58bff');
    const outer = new THREE.Color('#38c8ff');
    const c = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const t = Math.pow(Math.random(), 1.5);
      const r = t * radius;
      const branch = ((i % arms) / arms) * Math.PI * 2;
      const spin = r * 0.16;
      const spread = (n) => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * n * (0.15 + t * 0.6);
      pos.set(
        [Math.cos(branch + spin) * r + spread(radius * 0.18), spread(radius * 0.05), Math.sin(branch + spin) * r + spread(radius * 0.18)],
        i * 3
      );
      c.copy(inner).lerp(mid, Math.min(1, t * 1.6)).lerp(outer, Math.max(0, t - 0.55) * 1.8);
      col.set([c.r, c.g, c.b], i * 3);
    }
    return { pos, col };
  }, [count, radius, arms]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.025 * motion;
  });

  return (
    <group position={position} rotation={rotation}>
      <points ref={ref} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={data.pos} count={count} itemSize={3} />
          <bufferAttribute attach="attributes-color" array={data.col} count={count} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={radius * 0.07}
          sizeAttenuation
          vertexColors
          map={getDotTexture()}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* bright galactic core glow */}
      <sprite scale={[radius * 0.9, radius * 0.9, 1]}>
        <spriteMaterial map={getDotTexture()} color="#ffd9a8" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}
