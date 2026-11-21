import { useEffect, useState } from 'react';
import * as THREE from 'three';

/* -------------------------------------------------------------------------- */
/*  3D value noise + fBm. Sampling on the sphere surface keeps textures seamless. */
/* -------------------------------------------------------------------------- */

function hash3(x, y, z, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483629) ^ Math.imul(s, 1013904223);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function vnoise(x, y, z, s) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d, s);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u);
  const x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u);
  const x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}

function fbm(x, y, z, octaves = 4, s = 1) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += amp * vnoise(x * freq, y * freq, z * freq, s + i * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

/* ------------------------------ colour helpers ------------------------------ */

const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function ramp(stops, t) {
  const v = clamp01(t);
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (v <= p1) return mix(c0, c1, (v - p0) / Math.max(1e-6, p1 - p0));
  }
  return stops[stops.length - 1][1];
}

/* --------------------------------- baking --------------------------------- */

function bake(w, h, fn) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let j = 0; j < h; j += 1) {
    const lat = (0.5 - (j + 0.5) / h) * Math.PI;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    for (let i = 0; i < w; i += 1) {
      const lon = ((i + 0.5) / w) * Math.PI * 2;
      const x = cl * Math.cos(lon);
      const y = sl;
      const z = cl * Math.sin(lon);
      const c = fn(x, y, z, lat, lon);
      const k = (j * w + i) * 4;
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = c[3] === undefined ? 255 : c[3];
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/* --------------------------------- painters -------------------------------- */

const PAINTERS = {
  earth: (x, y, z) => {
    const e = fbm(x * 1.8 + 3, y * 1.8, z * 1.8, 5, 11);
    const sea = 0.52;
    let col;
    if (e < sea) {
      const depth = (sea - e) / sea;
      col = mix([34, 120, 178], [6, 26, 74], Math.min(1, depth * 3.2));
    } else {
      const h = (e - sea) / (1 - sea);
      const m = fbm(x * 3.2 + 9, y * 3.2, z * 3.2, 3, 23);
      if (h < 0.34) col = mix([44, 108, 56], [92, 122, 62], clamp01(h / 0.34 + (m - 0.5) * 0.6));
      else if (h < 0.7) col = mix([112, 100, 70], [146, 124, 92], (h - 0.34) / 0.36);
      else col = mix([196, 196, 196], [250, 250, 250], (h - 0.7) / 0.3);
      const desert = smooth(0.18, 0.42, Math.abs(y)) * (1 - smooth(0.5, 0.7, Math.abs(y))) * smooth(0.45, 0.62, m);
      col = mix(col, [204, 172, 112], desert * 0.8);
    }
    const ice = smooth(0.8, 0.93, Math.abs(y) + (fbm(x * 4, y * 4, z * 4, 3, 5) - 0.5) * 0.18);
    return mix(col, [240, 246, 252], ice);
  },

  mars: (x, y, z) => {
    const n = fbm(x * 2.6, y * 2.6, z * 2.6, 5, 31);
    const patch = fbm(x * 1.2 + 4, y * 1.2, z * 1.2, 3, 7);
    let col = mix([118, 48, 24], [206, 116, 64], n);
    col = mix(col, [64, 28, 20], smooth(0.5, 0.3, patch) * 0.7);
    const crater = smooth(0.74, 0.8, fbm(x * 9, y * 9, z * 9, 2, 3));
    col = mix(col, [90, 40, 26], crater * 0.3);
    const cap = smooth(0.9, 0.97, Math.abs(y) + (n - 0.5) * 0.05);
    return mix(col, [244, 240, 236], cap);
  },

  jupiter: (x, y, z, lat, lon) => {
    const warp = (fbm(x * 2, y * 5, z * 2, 4, 5) - 0.5) * 0.22;
    const band = Math.sin((y + warp) * 15) * 0.5 + 0.5;
    const fine = fbm(x * 1.5 + 10, y * 15, z * 1.5, 3, 7);
    const t = band * 0.62 + fine * 0.38;
    let col = ramp(
      [
        [0, [238, 224, 196]],
        [0.35, [214, 170, 120]],
        [0.65, [168, 110, 76]],
        [1, [124, 78, 56]],
      ],
      t
    );
    // Great Red Spot
    let dl = lon - 4.0;
    dl = Math.atan2(Math.sin(dl), Math.cos(dl));
    const dx = (dl * Math.cos(lat)) / 0.3;
    const dy = (lat + 0.37) / 0.13;
    const spot = 1 - smooth(0.4, 1.0, Math.sqrt(dx * dx + dy * dy));
    col = mix(col, [196, 84, 62], spot * 0.9);
    return col;
  },

  saturn: (x, y, z) => {
    const warp = (fbm(x * 2, y * 5, z * 2, 3, 9) - 0.5) * 0.16;
    const band = Math.sin((y + warp) * 11) * 0.5 + 0.5;
    const fine = fbm(x * 1.2, y * 18, z * 1.2, 3, 13);
    const t = band * 0.55 + fine * 0.45;
    return ramp(
      [
        [0, [244, 232, 198]],
        [0.5, [220, 196, 146]],
        [1, [182, 150, 104]],
      ],
      t
    );
  },

  neptune: (x, y, z) => {
    const n = fbm(x * 2, y * 4, z * 2, 5, 41);
    const band = Math.sin(y * 9 + n * 2) * 0.5 + 0.5;
    let col = mix([24, 58, 190], [74, 122, 238], n * 0.6 + band * 0.4);
    const streak = smooth(0.62, 0.78, fbm(x * 1.2 + 2, y * 8, z * 1.2, 3, 3));
    col = mix(col, [222, 236, 255], streak * 0.5);
    let dark = 1 - smooth(0.0, 0.2, Math.hypot(x - 0.2, y + 0.3, z - 0.9));
    dark *= 0.6;
    return mix(col, [10, 28, 110], dark);
  },

  aetheria: (x, y, z) => {
    const q = fbm(x * 1.8, y * 1.8, z * 1.8, 4, 61);
    const r = fbm(x * 1.8 + q * 2.6, y * 1.8 + q * 2.6, z * 1.8 + q * 2.6, 4, 67);
    return ramp(
      [
        [0, [30, 8, 84]],
        [0.35, [112, 44, 196]],
        [0.62, [196, 100, 230]],
        [0.82, [96, 226, 255]],
        [1, [235, 250, 255]],
      ],
      r * 1.15 - 0.05
    );
  },

  pyros: (x, y, z) => {
    const rock = fbm(x * 3, y * 3, z * 3, 5, 71);
    const r = fbm(x * 2.2, y * 2.2, z * 2.2, 4, 73);
    const ridge = 1 - Math.abs(2 * r - 1);
    const crack = smooth(0.86, 0.985, ridge);
    let col = mix([20, 14, 14], [74, 48, 40], rock);
    col = mix(col, [255, 118, 20], crack);
    col = mix(col, [255, 220, 120], smooth(0.96, 1, ridge) * 0.8);
    return col;
  },

  cryos: (x, y, z) => {
    const n = fbm(x * 2.4, y * 2.4, z * 2.4, 5, 83);
    let col = mix([176, 218, 244], [118, 178, 230], n);
    const r = fbm(x * 3.2 + 5, y * 3.2, z * 3.2, 4, 89);
    const ridge = 1 - Math.abs(2 * r - 1);
    col = mix(col, [250, 254, 255], smooth(0.88, 0.99, ridge));
    col = mix(col, [60, 120, 170], smooth(0.5, 0.2, n) * 0.5);
    return mix(col, [246, 252, 255], smooth(0.75, 0.95, Math.abs(y)) * 0.8);
  },

  moon: (x, y, z) => {
    const n = fbm(x * 3, y * 3, z * 3, 5, 97);
    const crater = smooth(0.7, 0.78, fbm(x * 10, y * 10, z * 10, 2, 101));
    const v = lerp(86, 190, n) - crater * 34;
    return [v, v, v + 4];
  },

  clouds: (x, y, z) => {
    const c = fbm(x * 2.6, y * 3.2, z * 2.6, 5, 41);
    const a = smooth(0.52, 0.78, c);
    return [255, 255, 255, Math.round(a * 235)];
  },
};

/** Texture resolution per quality level (equirectangular 2:1). */
const SIZES = { low: [384, 192], mid: [640, 320], high: [1024, 512] };

export function paintPlanet(kind, quality = 'mid') {
  const painter = PAINTERS[kind];
  const [w, h] = SIZES[quality] || SIZES.mid;
  return bake(w, h, painter || PAINTERS.moon);
}

/* ------------------- queued async generation with caching ------------------ */

const cache = new Map();
let chain = Promise.resolve();

/**
 * Generates textures one at a time with a tiny pause between jobs, so the page stays
 * responsive: planets appear flat-coloured first and their surfaces pop in right after.
 */
export function requestTexture(key, build) {
  if (cache.has(key)) return cache.get(key);
  const job = chain.then(
    () => new Promise((resolve) => setTimeout(() => resolve(build()), 12))
  );
  chain = job.catch(() => undefined);
  cache.set(key, job);
  return job;
}

/** React hook: returns the planet surface texture (null until it is ready). */
export function usePlanetTexture(kind, quality = 'mid') {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    if (!kind) {
      setTex(null);
      return undefined;
    }
    let alive = true;
    requestTexture(`${kind}:${quality}`, () => paintPlanet(kind, quality)).then((t) => {
      if (alive) setTex(t);
    });
    return () => {
      alive = false;
    };
  }, [kind, quality]);
  return tex;
}

/* ----------------------------- small sprite helpers ---------------------------- */

const spriteCache = new Map();

function memo(key, build) {
  if (!spriteCache.has(key)) spriteCache.set(key, build());
  return spriteCache.get(key);
}

function canvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Soft round dot used for stars and particles. */
export function getDotTexture() {
  return memo('dot', () => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return canvasTexture(c);
  });
}

/** Large soft cloud sprite for nebulae. `hue` pair gives a two-tone gradient. */
export function getNebulaTexture(name, colorA, colorB) {
  return memo(`nebula:${name}`, () => {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    // layered blobs for an organic, cloudy look
    for (let i = 0; i < 26; i += 1) {
      const r = 30 + hash3(i, 1, 2, 5) * 70;
      const x = size * (0.2 + hash3(i, 2, 3, 6) * 0.6);
      const y = size * (0.2 + hash3(i, 3, 4, 7) * 0.6);
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      const col = i % 2 === 0 ? colorA : colorB;
      grad.addColorStop(0, `rgba(${col},0.22)`);
      grad.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
    }
    // fade the edges so sprites never show a hard border
    const mask = g.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size / 2);
    mask.addColorStop(0, 'rgba(0,0,0,0)');
    mask.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = mask;
    g.fillRect(0, 0, size, size);
    return canvasTexture(c);
  });
}

/** Radial ring texture (1D strip) for Saturn-like rings. */
export function getRingTexture() {
  return memo('ring', () => {
    const w = 1024;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = 4;
    const g = c.getContext('2d');
    for (let x = 0; x < w; x += 1) {
      const t = x / w;
      const n = vnoise(x * 0.06, 0.5, 0.5, 3) * 0.6 + vnoise(x * 0.4, 1.5, 0.5, 9) * 0.4;
      const gap = smooth(0.58, 0.6, t) * (1 - smooth(0.66, 0.68, t)); // Cassini-like division
      const edge = smooth(0, 0.05, t) * (1 - smooth(0.93, 1, t));
      const alpha = clamp01((0.25 + n * 0.85) * (1 - gap * 0.92)) * edge;
      const tone = lerp(170, 236, n);
      g.fillStyle = `rgba(${tone},${tone * 0.93},${tone * 0.78},${alpha})`;
      g.fillRect(x, 0, 1, 4);
    }
    return canvasTexture(c);
  });
}

/** A simple glowing grid used on solar panels. */
export function getPanelTexture() {
  return memo('panel', () => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#0a1a46';
    g.fillRect(0, 0, 256, 128);
    g.strokeStyle = 'rgba(90,170,255,0.55)';
    g.lineWidth = 2;
    for (let x = 0; x <= 256; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 128);
      g.stroke();
    }
    for (let y = 0; y <= 128; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
    return canvasTexture(c);
  });
}

/** Neon sign texture drawn with the system font (no network request needed). */
export function getSignTexture(text) {
  return memo(`sign:${text}`, () => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const g = c.getContext('2d');
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '800 120px Unbounded, "Segoe UI", system-ui, sans-serif';
    g.shadowColor = '#38e8ff';
    g.shadowBlur = 38;
    g.fillStyle = '#d9f7ff';
    g.fillText(text, 512, 128);
    g.shadowBlur = 14;
    g.fillStyle = '#ffffff';
    g.fillText(text, 512, 128);
    return canvasTexture(c);
  });
}

/** Holographic menu panel texture for the restaurant interior. */
export function makeHoloTexture(title, lines, accent = '#38e8ff') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 640;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 640);
  grad.addColorStop(0, 'rgba(20,40,90,0.78)');
  grad.addColorStop(1, 'rgba(40,10,90,0.6)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 640);
  // scanlines
  g.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 0; y < 640; y += 6) g.fillRect(0, y, 512, 2);
  g.textAlign = 'center';
  g.fillStyle = accent;
  g.font = '700 22px "Segoe UI", system-ui, sans-serif';
  g.fillText('COSMIC DINE', 256, 58);
  g.fillStyle = '#ffffff';
  g.font = '800 36px Unbounded, "Segoe UI", system-ui, sans-serif';
  const words = title.split(' ');
  const mid = Math.ceil(words.length / 2);
  g.fillText(words.slice(0, mid).join(' '), 256, 130);
  g.fillText(words.slice(mid).join(' '), 256, 178);
  g.fillStyle = accent;
  g.fillRect(96, 210, 320, 3);
  g.textAlign = 'left';
  lines.slice(0, 4).forEach((l, i) => {
    const y = 270 + i * 74;
    g.fillStyle = '#e8eeff';
    g.font = '600 25px "Segoe UI", system-ui, sans-serif';
    g.fillText(l.name, 48, y);
    g.fillStyle = accent;
    g.font = '700 25px "Segoe UI", system-ui, sans-serif';
    g.textAlign = 'right';
    g.fillText(l.price, 464, y);
    g.textAlign = 'left';
  });
  g.textAlign = 'center';
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.font = '600 20px "Segoe UI", system-ui, sans-serif';
  g.fillText('Tap to open this menu', 256, 600);
  return canvasTexture(c);
}
