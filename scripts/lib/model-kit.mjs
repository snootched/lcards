/**
 * model-kit.mjs: geometry helpers for the built-in astrometrics models made
 * in code (scripts/make-demo-ship.mjs, scripts/make-starbases.mjs): lathes,
 * lofted tubes, aerofoil sections, named parts, GLB export. Y up, metres.
 */
import {
  BufferGeometry, Float32BufferAttribute, LatheGeometry, Vector2, Vector3, Mesh
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTFExporter reads its Blob back with FileReader (a browser API)
globalThis.FileReader ??= class {
  /** @param {Blob} blob */
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); });
  }
  /** @param {Blob} blob */
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString('base64')}`; this.onloadend?.(); });
  }
};

/** Drop what the model does not use (no textures: uv) to keep the file small */
export function lean(geo) {
  geo.deleteAttribute('uv');
  return geo;
}

/**
 * A lathe round the y axis from a profile of [radius, y] pairs (top to bottom).
 * @param {number[][]} profile
 * @param {number} segments
 */
export function latheY(profile, segments) {
  // three's lathe faces outward for a profile that runs bottom to top
  return lean(new LatheGeometry(profile.map(([r, y]) => new Vector2(Math.max(r, 0), y)).reverse(), segments));
}

/**
 * A lathe round the z axis (profile of [radius, z] pairs): nacelles and the
 * secondary hull. `squash` scales y (1 = round).
 * @param {number[][]} profile
 * @param {number} segments
 */
export function latheZ(profile, segments, squash = 1) {
  // three's lathe turns round y: build it there, turn y into z
  const g = new LatheGeometry(profile.map(([r, z]) => new Vector2(Math.max(r, 0), -z)), segments);
  g.rotateX(-Math.PI / 2);
  if (squash !== 1) g.scale(1, squash, 1);
  return lean(g);
}

/**
 * A closed tube through rings of points (each ring the same count), with flat
 * caps at both ends: the neck and the pylons.
 * @param {Vector3[][]} rings
 */
export function loft(rings) {
  const n = rings[0].length;
  const pos = [];
  const index = [];
  for (const ring of rings) for (const p of ring) pos.push(p.x, p.y, p.z);
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < n; i++) {
      const a = r * n + i, b = r * n + ((i + 1) % n), c = (r + 1) * n + i, d = (r + 1) * n + ((i + 1) % n);
      index.push(a, c, b, b, c, d);
    }
  }
  // caps: a fan round each end ring's middle
  for (const [ri, flip] of [[0, true], [rings.length - 1, false]]) {
    const ring = rings[ri];
    const mid = ring.reduce((m, p) => m.add(p), new Vector3()).divideScalar(n);
    const ci = pos.length / 3;
    pos.push(mid.x, mid.y, mid.z);
    for (let i = 0; i < n; i++) {
      const a = ri * n + i, b = ri * n + ((i + 1) % n);
      if (flip) index.push(ci, b, a);
      else index.push(ci, a, b);
    }
  }
  // faces outward whichever way the rings run: a positive signed volume
  let vol = 0;
  for (let i = 0; i < index.length; i += 3) {
    const [a, b, c] = [index[i], index[i + 1], index[i + 2]].map((k) => new Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]));
    vol += a.dot(b.cross(c));
  }
  if (vol < 0) for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/**
 * An aerofoil section: chord along z (front at +z), thickness along `across`,
 * centred on `c`. Rounded nose, sharp tail.
 * @param {Vector3} c
 * @param {number} chord
 * @param {number} half - half thickness
 * @param {Vector3} across - unit
 * @param {number} [n]
 */
export function aerofoil(c, chord, half, across, n = 20) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const u = Math.cos(t); // 1 nose, -1 tail
    // thickest a third back from the nose, a thin tail
    const thick = half * Math.sin(t) * (0.55 + 0.45 * u) * 1.25;
    pts.push(new Vector3().copy(c).addScaledVector(across, thick).add(new Vector3(0, 0, (chord / 2) * u)));
  }
  return pts;
}

/**
 * @param {string} name
 * @param {BufferGeometry} geo
 * @param {import('three').Material} mat
 * @param {number[]} [at]
 */
export function part(name, geo, mat, at = [0, 0, 0]) {
  const m = new Mesh(geo, mat);
  m.name = name;
  m.position.set(at[0], at[1], at[2]);
  return m;
}

/**
 * @param {import('three').Object3D} scene
 * @param {import('three').AnimationClip[]} [animations]
 * @returns {Promise<ArrayBuffer>}
 */
export async function exportGlb(scene, animations = []) {
  return new GLTFExporter().parseAsync(scene, { binary: true, animations, onlyVisible: true });
}

/** Triangles in a scene (for the size report) */
export function triangles(scene) {
  let n = 0;
  scene.traverse((o) => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return n;
}

/**
 * A closed ring round the y axis from a cross-section loop of [radius, y]
 * pairs (any winding; it is turned to face outward): station rings.
 * @param {number[][]} section
 * @param {number} segments
 */
export function ringY(section, segments) {
  // signed area in (r, y): counter-clockwise faces outward on three's lathe
  let area = 0;
  for (let i = 0; i < section.length; i++) {
    const [r0, y0] = section[i];
    const [r1, y1] = section[(i + 1) % section.length];
    area += r0 * y1 - r1 * y0;
  }
  const loop = area > 0 ? section : [...section].reverse();
  return lean(new LatheGeometry([...loop, loop[0]].map(([r, y]) => new Vector2(r, y)), segments));
}
