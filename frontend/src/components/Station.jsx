import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getPanelTexture, getSignTexture } from '../utils/textures';

const RING_RADIUS = 10;
const TUBE = 0.9;
const WINDOWS = 56;

/**
 * The COSMIC DINE orbital restaurant: a slowly rotating habitat ring with glowing windows,
 * a docking hub, solar wings and a neon sign. Axis of the ring is Z, so it faces approaching ships.
 */
export default function Station({ position = [0, 0, 0], scale = 1, motion = 1, sign = true }) {
  const ring = useRef();
  const windows = useRef();

  useLayoutEffect(() => {
    const mesh = windows.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(0.14, 0.7, 0.8);
    const p = new THREE.Vector3();
    const gold = new THREE.Color('#ffd9a0');
    const cyan = new THREE.Color('#7be8ff');
    const violet = new THREE.Color('#c4a0ff');
    for (let i = 0; i < WINDOWS; i += 1) {
      const a = (i / WINDOWS) * Math.PI * 2;
      p.set(Math.cos(a) * (RING_RADIUS + TUBE - 0.03), Math.sin(a) * (RING_RADIUS + TUBE - 0.03), 0);
      q.setFromEuler(new THREE.Euler(0, 0, a));
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, i % 7 === 0 ? violet : i % 3 === 0 ? cyan : gold);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += Math.min(delta, 0.05) * 0.06 * motion;
  });

  const spokes = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), []);
  const metal = { color: '#2b365f', metalness: 0.75, roughness: 0.35 };

  return (
    <group position={position} scale={scale}>
      {/* rotating habitat ring */}
      <group ref={ring}>
        <mesh>
          <torusGeometry args={[RING_RADIUS, TUBE, 20, 120]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[-0.7, 0.7].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <torusGeometry args={[RING_RADIUS + 0.62, 0.06, 8, 140]} />
            <meshBasicMaterial color="#38e8ff" toneMapped={false} />
          </mesh>
        ))}
        <instancedMesh ref={windows} args={[undefined, undefined, WINDOWS]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        {spokes.map((a) => (
          <group key={a} rotation={[0, 0, a]}>
            <mesh position={[(RING_RADIUS - TUBE + 1.9) / 2, 0, 0]}>
              <boxGeometry args={[RING_RADIUS - TUBE - 1.9, 0.42, 0.42]} />
              <meshStandardMaterial {...metal} color="#3a4775" />
            </mesh>
          </group>
        ))}
      </group>

      {/* central hub + docking collar */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.9, 2.2, 6, 28]} />
        <meshStandardMaterial {...metal} color="#46558a" />
      </mesh>
      <mesh position={[0, 0, 3.2]}>
        <torusGeometry args={[1.45, 0.2, 12, 40]} />
        <meshBasicMaterial color="#7be8ff" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -4.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.9, 2.4, 16]} />
        <meshStandardMaterial {...metal} />
      </mesh>

      {/* solar wings */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 1.3, 0, -4.2]}>
            <boxGeometry args={[1.8, 0.18, 0.18]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh position={[side * 6.2, 0, -4.2]}>
            <boxGeometry args={[8, 3.4, 0.1]} />
            <meshStandardMaterial map={getPanelTexture()} emissive="#16306e" emissiveIntensity={0.7} metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* neon sign */}
      {sign && (
        <mesh position={[0, RING_RADIUS + 4.6, 1.2]}>
          <planeGeometry args={[15, 3.75]} />
          <meshBasicMaterial map={getSignTexture('COSMIC DINE')} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      <pointLight position={[0, 0, 7]} color="#7be8ff" intensity={260} distance={80} decay={2} />
      <pointLight position={[0, 0, -3]} color="#a56bff" intensity={160} distance={60} decay={2} />
    </group>
  );
}
