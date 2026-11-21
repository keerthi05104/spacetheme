import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ROCK_COLORS = ['#7d7468', '#6a6258', '#8a7f72', '#5c5650', '#928573'];

function makeRockGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 1) {
    v.fromBufferAttribute(p, i);
    // position-based displacement keeps shared vertices consistent (no cracks)
    const d =
      1 +
      0.22 * Math.sin(v.x * 3.1 + 1.7) * Math.sin(v.y * 2.7 + 0.3) +
      0.18 * Math.sin(v.z * 4.1 + v.x * 2.3) +
      0.1 * Math.sin((v.x + v.y + v.z) * 6.3);
    v.multiplyScalar(d);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Instanced, tumbling, drifting asteroid field (a single draw call).
 * `exclude` keeps a clear corridor around the ship path (axis through [x, y]).
 */
export default function Asteroids({
  count = 80,
  center = [0, 0, 0],
  size = [30, 10, 40],
  scale = [0.25, 0.9],
  drift = [0.25, 0, 0],
  exclude = null,
  motion = 1,
}) {
  const mesh = useRef();
  const geometry = useMemo(makeRockGeometry, []);

  const rocks = useMemo(() => {
    const list = [];
    const [sx, sy, sz] = size;
    let guard = 0;
    while (list.length < count && guard < count * 20) {
      guard += 1;
      const x = (Math.random() - 0.5) * sx;
      const y = (Math.random() - 0.5) * sy;
      const z = (Math.random() - 0.5) * sz;
      if (exclude && Math.hypot(x + center[0] - exclude.x, y + center[1] - exclude.y) < exclude.radius) continue;
      list.push({
        p: new THREE.Vector3(x, y, z),
        s: scale[0] + Math.pow(Math.random(), 2.2) * (scale[1] - scale[0]),
        r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        spin: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8),
        squash: 0.7 + Math.random() * 0.6,
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, size[0], size[1], size[2], scale[0], scale[1], exclude?.radius]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const c = new THREE.Color();
    rocks.forEach((rock, i) => {
      c.set(ROCK_COLORS[i % ROCK_COLORS.length]).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
      mesh.current.setColorAt(i, c);
    });
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [rocks]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const hx = size[0] / 2;
    const hy = size[1] / 2;
    const hz = size[2] / 2;
    const dt = Math.min(delta, 0.05) * motion;
    rocks.forEach((rock, i) => {
      rock.p.x += drift[0] * dt;
      rock.p.y += drift[1] * dt;
      rock.p.z += drift[2] * dt;
      if (rock.p.x > hx) rock.p.x -= size[0];
      else if (rock.p.x < -hx) rock.p.x += size[0];
      if (rock.p.y > hy) rock.p.y -= size[1];
      else if (rock.p.y < -hy) rock.p.y += size[1];
      if (rock.p.z > hz) rock.p.z -= size[2];
      else if (rock.p.z < -hz) rock.p.z += size[2];
      rock.r.x += rock.spin.x * dt;
      rock.r.y += rock.spin.y * dt;
      rock.r.z += rock.spin.z * dt;
      dummy.position.set(center[0] + rock.p.x, center[1] + rock.p.y, center[2] + rock.p.z);
      dummy.rotation.copy(rock.r);
      dummy.scale.set(rock.s, rock.s * rock.squash, rock.s * 0.9);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, rocks.length]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.95} metalness={0.05} flatShading />
    </instancedMesh>
  );
}
