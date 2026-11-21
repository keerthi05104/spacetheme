import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRingTexture, usePlanetTexture } from '../utils/textures';

const ATMO_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float d = dot(vN, vV);
    float f = pow(max(0.72 - d, 0.0), 4.0);
    float soft = 1.0 - smoothstep(-0.28, 0.0, d);
    gl_FragColor = vec4(uColor, clamp(f * uIntensity * 0.28, 0.0, 1.0) * soft);
  }
`;

/** Fresnel-style atmospheric glow rendered on the back faces of a slightly larger sphere. */
export function Atmosphere({ radius, color = '#5db8ff', intensity = 1, scale = 1.17 }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity } },
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    material.uniforms.uColor.value.set(color);
    material.uniforms.uIntensity.value = intensity;
  }, [material, color, intensity]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh scale={scale} raycast={() => null}>
      <sphereGeometry args={[radius, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function PlanetRing({ inner, outer }) {
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(inner, outer, 128, 1);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [inner, outer]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
      <meshStandardMaterial
        map={getRingTexture()}
        transparent
        side={THREE.DoubleSide}
        roughness={0.9}
        metalness={0}
        depthWrite={false}
      />
    </mesh>
  );
}

function Moon({ moon, planetRadius, index, motion, orbitLine }) {
  const pivot = useRef();
  const tex = usePlanetTexture('moon', 'low');
  const dist = moon.distance * planetRadius;
  const size = moon.size * planetRadius;
  useFrame((_, delta) => {
    if (pivot.current) pivot.current.rotation.y += delta * moon.speed * motion;
  });
  return (
    <group>
      {orbitLine && (
        <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[dist - 0.008 * planetRadius, dist + 0.008 * planetRadius, 128]} />
          <meshBasicMaterial color="#9fb4ff" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      <group ref={pivot} rotation={[0, index * 2.1 + 0.7, 0]}>
        <mesh position={[dist, 0, 0]}>
          <sphereGeometry args={[size, 28, 28]} />
          <meshStandardMaterial key={tex ? 'tex' : 'flat'} map={tex} color={moon.color} roughness={1} metalness={0} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * A planet with a procedural surface, axial tilt, spin, optional cloud layer, atmosphere glow,
 * rings and orbiting moons. Everything is generated in code (no downloaded textures).
 */
function Planet({
  def,
  radius,
  position = [0, 0, 0],
  quality = 'mid',
  hovered = false,
  selected = false,
  onPointerOver,
  onPointerOut,
  onClick,
  motion = 1,
  showMoons = true,
  orbitLines = false,
  segments = 64,
}) {
  const r = radius ?? def.displayRadius;
  const tex = usePlanetTexture(def.texture, quality);
  const cloudTex = usePlanetTexture(def.clouds ? 'clouds' : null, quality);
  const group = useRef();
  const body = useRef();
  const clouds = useRef();
  const lava = def.texture === 'pyros';

  useFrame((_, delta) => {
    if (body.current) body.current.rotation.y += delta * def.rotationSpeed * motion;
    if (clouds.current) clouds.current.rotation.y += delta * def.rotationSpeed * 1.35 * motion;
    if (group.current) {
      const target = hovered ? 1.07 : 1;
      const s = THREE.MathUtils.damp(group.current.scale.x, target, 7, Math.min(delta, 0.05));
      group.current.scale.setScalar(s);
    }
  });

  return (
    <group position={position}>
      <group ref={group}>
        <group rotation={[0, 0, def.tilt]}>
          <mesh
            ref={body}
            onPointerOver={onPointerOver ? (e) => { e.stopPropagation(); onPointerOver(def.id); } : undefined}
            onPointerOut={onPointerOut ? (e) => { e.stopPropagation(); onPointerOut(def.id); } : undefined}
            onClick={onClick ? (e) => { e.stopPropagation(); onClick(def.id); } : undefined}
          >
            <sphereGeometry args={[r, segments, segments]} />
            <meshStandardMaterial
              key={tex ? 'tex' : 'flat'}
              map={tex}
              color={tex ? '#ffffff' : def.baseColor}
              roughness={def.texture === 'cryos' ? 0.35 : 0.88}
              metalness={0}
              emissive={lava ? '#ff6a1a' : '#000000'}
              emissiveMap={lava ? tex : null}
              emissiveIntensity={lava ? 0.9 : 0}
            />
          </mesh>

          {def.clouds && cloudTex && (
            <mesh ref={clouds} raycast={() => null}>
              <sphereGeometry args={[r * 1.012, segments, segments]} />
              <meshStandardMaterial map={cloudTex} transparent depthWrite={false} roughness={1} />
            </mesh>
          )}

          <Atmosphere radius={r} color={def.atmosphere} intensity={hovered || selected ? 1.5 : 1} />

          {def.ring && <PlanetRing inner={def.ring.inner * r} outer={def.ring.outer * r} />}

          {showMoons &&
            def.moons.map((m, i) => (
              <Moon key={m.name} moon={m} planetRadius={r} index={i} motion={motion} orbitLine={orbitLines} />
            ))}
        </group>
      </group>
    </group>
  );
}

export default memo(Planet);
