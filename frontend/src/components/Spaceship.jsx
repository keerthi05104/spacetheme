import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * The "Odyssey" shuttle, built from primitives (no model download).
 * The nose points toward -Z, which is the direction of travel in every scene.
 *
 * `rig` is an optional mutable object ({ thrust, hatch }) animated from outside with GSAP:
 *  - thrust: 0..2 engine flame length
 *  - hatch:  0..1 sliding boarding door
 */
const Spaceship = forwardRef(function Spaceship({ scale = 1, thrust = 1, rig, lights = true }, ref) {
  const flameA = useRef();
  const flameB = useRef();
  const coreA = useRef();
  const coreB = useRef();
  const door = useRef();
  const light = useRef();

  const wingGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.7);
    s.lineTo(2.1, -0.9);
    s.lineTo(2.1, -1.25);
    s.lineTo(0, -1.0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
    g.translate(0, 0, -0.03);
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const th = rig ? rig.thrust : thrust;
    const flick = 1 + Math.sin(t * 38) * 0.07 + Math.sin(t * 61 + 1) * 0.05;
    const len = (0.35 + th * 0.85) * flick;
    [flameA, flameB].forEach((f) => f.current && f.current.scale.set(1, len, 1));
    [coreA, coreB].forEach((f) => f.current && f.current.scale.set(1, len * 0.7, 1));
    if (light.current) light.current.intensity = 6 + th * 14;
    if (door.current) door.current.position.z = -0.45 + (rig ? rig.hatch : 0) * 0.78;
  });

  const hull = { color: '#cfd8ff', metalness: 0.55, roughness: 0.3 };
  const dark = { color: '#1a2140', metalness: 0.7, roughness: 0.4 };

  return (
    <group ref={ref} scale={scale}>
      {/* fuselage + nose */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.75]}>
        <capsuleGeometry args={[0.42, 2.0, 8, 24]} />
        <meshStandardMaterial {...hull} />
      </mesh>
      <mesh position={[0, 0, -2.07]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.75]}>
        <coneGeometry args={[0.42, 1.3, 24]} />
        <meshStandardMaterial {...hull} />
      </mesh>

      {/* canopy */}
      <mesh position={[0, 0.27, -0.85]} scale={[0.3, 0.2, 0.62]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#7fe9ff" emissive="#1aa8d8" emissiveIntensity={0.8} transparent opacity={0.88} roughness={0.05} metalness={0.3} />
      </mesh>

      {/* swept wings (right + mirrored left) */}
      {[1, -1].map((side) => (
        <group key={side} scale={[side, 1, 1]}>
          <mesh geometry={wingGeo} position={[0.35, -0.05, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial {...hull} color="#b9c4f2" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[2.45, -0.02, 1.62]}>
            <boxGeometry args={[0.07, 0.07, 0.5]} />
            <meshBasicMaterial color={side > 0 ? '#38e8ff' : '#a56bff'} toneMapped={false} />
          </mesh>
          {/* engine nacelle */}
          <mesh position={[0.58, -0.05, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.24, 1.1, 20]} />
            <meshStandardMaterial {...dark} />
          </mesh>
          <mesh position={[0.58, -0.05, 1.78]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.08, 20]} />
            <meshBasicMaterial color="#9ff4ff" toneMapped={false} />
          </mesh>
          <group position={[0.58, -0.05, 1.82]}>
            <mesh ref={side > 0 ? flameA : flameB} position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.16, 1.4, 16, 1, true]} />
              <meshBasicMaterial color="#4fd8ff" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={side > 0 ? coreA : coreB} position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.08, 1.0, 12, 1, true]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
          {/* side neon line */}
          <mesh position={[0.415, 0, 0.35]}>
            <boxGeometry args={[0.02, 0.03, 1.6]} />
            <meshBasicMaterial color="#38e8ff" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* tail fin and spine light */}
      <mesh position={[0, 0.42, 1.05]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.06, 0.7, 0.9]} />
        <meshStandardMaterial {...hull} color="#b9c4f2" />
      </mesh>
      <mesh position={[0, 0.34, -0.1]}>
        <boxGeometry args={[0.05, 0.02, 2.0]} />
        <meshBasicMaterial color="#a56bff" toneMapped={false} />
      </mesh>

      {/* boarding hatch (starboard side) */}
      <mesh position={[0.41, 0, -0.45]}>
        <boxGeometry args={[0.03, 0.38, 0.62]} />
        <meshBasicMaterial color="#bff6ff" toneMapped={false} />
      </mesh>
      <mesh ref={door} position={[0.43, 0, -0.45]}>
        <boxGeometry args={[0.045, 0.4, 0.64]} />
        <meshStandardMaterial color="#8a97c9" metalness={0.8} roughness={0.35} />
      </mesh>

      {lights && <pointLight ref={light} position={[0, 0, 2.6]} color="#5cf0ff" intensity={12} distance={12} decay={2} />}
    </group>
  );
});

export default Spaceship;
