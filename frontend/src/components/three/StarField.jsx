import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PALETTE = ['#ffffff', '#cfe0ff', '#a9c4ff', '#d6c4ff', '#ffe8c9', '#bff3ff'];

const VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  uniform float uPR;
  varying vec3 vColor;
  varying float vPhase;
  void main() {
    vColor = aColor;
    vPhase = aPhase;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPR;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vColor;
  varying float vPhase;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    float tw = 0.72 + 0.28 * sin(uTime * (0.7 + fract(vPhase * 7.0) * 1.8) + vPhase * 40.0);
    gl_FragColor = vec4(vColor * tw, a * tw);
  }
`;

/**
 * Twinkling starfield on a large sphere shell that follows the camera, so stars always
 * feel infinitely far away. One draw call, per-star size / colour / twinkle phase.
 */
export default function StarField({ count = 2500, radius = 480, follow = true, motion = 1, sizeRange = [1.2, 3.4] }) {
  const group = useRef();
  const points = useRef();

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      // uniform direction on a sphere
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = radius * (0.7 + Math.random() * 0.3);
      positions.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3);
      c.set(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      colors.set([c.r, c.g, c.b], i * 3);
      const big = Math.random() > 0.94;
      sizes[i] = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]) * (big ? 1.4 : 0.55);
      phases[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, [count, radius, sizeRange]);

  useFrame((state, delta) => {
    if (follow && group.current) group.current.position.copy(state.camera.position);
    if (points.current) points.current.rotation.y += delta * 0.004 * motion;
    material.uniforms.uTime.value = state.clock.elapsedTime * (motion > 0.5 ? 1 : 0.25);
    material.uniforms.uPR.value = state.viewport.dpr;
  });

  return (
    <group ref={group}>
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
    </group>
  );
}
