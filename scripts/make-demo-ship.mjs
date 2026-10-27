#!/usr/bin/env node
/**
 * make-demo-ship.mjs: builds the astrometrics demo model, a Constitution-class
 * starship in TOS proportions (fan art, made from code: no third-party mesh or
 * texture), and writes it as GLB to src/assets/models/constitution.glb
 * (`builtin:constitution`).
 *
 *   node scripts/make-demo-ship.mjs            # writes the GLB
 *   node scripts/make-demo-ship.mjs --meshopt  # also tests/fixtures/constitution-meshopt.glb (EXT_meshopt_compression)
 *
 * Y up, metres, the bow toward +z, the origin in the middle of the 289 m
 * length. Named parts (node origins are meaningful, `part:` points sit on
 * them): saucer, bridge, sensor_dome, impulse, neck, secondary_hull,
 * deflector, shuttle_bay, pylon_port/_starboard, nacelle_port/_starboard,
 * bussard_port/_starboard (children of the nacelles). Port is -x (the ship's
 * left, seen from behind with the bow away). One animation clip, `bussards`:
 * the collector caps turn.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BufferGeometry, Float32BufferAttribute, LatheGeometry, ExtrudeGeometry, Shape, Vector2, Vector3,
  Mesh, Group, Scene, MeshStandardMaterial, Quaternion, QuaternionKeyframeTrack, AnimationClip, Euler
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'src/assets/models/constitution.glb');
const OUT_MESHOPT = resolve(root, 'tests/fixtures/constitution-meshopt.glb');

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

// Proportions (metres) -------------------------------------------------------
const SAUCER_R = 63.5;          // 127 m across
const SAUCER_Z = 144.5 - SAUCER_R; // the bow is the saucer's front edge
const SAUCER_Y = 24;
const HULL_Y = -18;             // secondary hull axis
const NACELLE_X = 47;
const NACELLE_Y = 30;
const NACELLE_R = 6.4;
const NACELLE_FRONT = 6;        // where the bussard collector starts
const NACELLE_REAR = -144.5;

// Materials (used by `material: original`; the hologram look replaces them)
const hull = new MeshStandardMaterial({ name: 'hull', color: 0xc4c8cc, roughness: 0.55, metalness: 0.2 });
const panel = new MeshStandardMaterial({ name: 'panel', color: 0xa9adb2, roughness: 0.6, metalness: 0.2 });
const bussardMat = new MeshStandardMaterial({ name: 'bussard', color: 0xff5a2a, emissive: 0xd83a10, emissiveIntensity: 1.2, roughness: 0.4 });
const deflectorMat = new MeshStandardMaterial({ name: 'deflector', color: 0xe0a060, emissive: 0xa06020, emissiveIntensity: 0.8, roughness: 0.35, metalness: 0.6 });
const impulseMat = new MeshStandardMaterial({ name: 'impulse', color: 0xb0b4b8, emissive: 0x801808, emissiveIntensity: 0.25, roughness: 0.5 });
const grilleMat = new MeshStandardMaterial({ name: 'grille', color: 0x6a88b0, emissive: 0x203860, emissiveIntensity: 0.8, roughness: 0.5 });

// Helpers ---------------------------------------------------------------------

/** Drop what the model does not use (no textures: uv) to keep the file small */
function lean(geo) {
  geo.deleteAttribute('uv');
  return geo;
}

/**
 * A lathe round the y axis from a profile of [radius, y] pairs (top to bottom).
 * @param {number[][]} profile
 * @param {number} segments
 */
function latheY(profile, segments) {
  // three's lathe faces outward for a profile that runs bottom to top
  return lean(new LatheGeometry(profile.map(([r, y]) => new Vector2(Math.max(r, 0), y)).reverse(), segments));
}

/**
 * A lathe round the z axis (profile of [radius, z] pairs): nacelles and the
 * secondary hull. `squash` scales y (1 = round).
 * @param {number[][]} profile
 * @param {number} segments
 */
function latheZ(profile, segments, squash = 1) {
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
function loft(rings) {
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
function aerofoil(c, chord, half, across, n = 20) {
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
function part(name, geo, mat, at = [0, 0, 0]) {
  const m = new Mesh(geo, mat);
  m.name = name;
  m.position.set(at[0], at[1], at[2]);
  return m;
}

// Parts -----------------------------------------------------------------------

/** Saucer: lathe from the B/C deck rise down to the rim, then the underside. Origin: its centre. */
function saucer() {
  const profile = [
    [0, 8.2], [6, 8.1], [10.5, 7.6], [12, 6.6], [13, 5.6],     // B/C deck rise
    [20, 4.9], [32, 3.6], [46, 2.3], [58, 1.25], [62.6, 0.75], // upper surface
    [63.5, 0.3], [63.5, -0.35],                                // rim
    [62.4, -1.1], [55, -2.4], [42, -4.4], [30, -6.4],          // underside
    [22, -8.2], [14, -9.6], [7.5, -10.2], [0, -10.4]
  ];
  return part('saucer', latheY(profile, 64), hull, [0, SAUCER_Y, SAUCER_Z]);
}

/** Bridge: the dome on top of the B/C deck. Origin: the dome's top. */
function bridge() {
  const profile = [[0, 0], [1.6, -0.15], [3, -0.6], [4.1, -1.4], [4.6, -2.4], [4.8, -3.6], [5.6, -4.2]];
  return part('bridge', latheY(profile, 32), panel, [0, SAUCER_Y + 8.2 + 4.1, SAUCER_Z]);
}

/** Lower sensor dome under the saucer. Origin: its lowest point. */
function sensorDome() {
  const profile = [[7, 2.2], [6.4, 1.4], [5, 0.7], [3.2, 0.25], [0, 0]];
  return part('sensor_dome', latheY(profile, 32), panel, [0, SAUCER_Y - 10.4 - 2.0, SAUCER_Z]);
}

/** Impulse deck: a block on the saucer's back, its exhausts facing aft. Origin: the exhaust face's middle. */
function impulse() {
  const w = 19, h = 3.2, d = 11;
  const s = new Shape();
  // the plan seen from above: wider at the back, rounded front
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2 - 1.5, d * 0.7);
  s.quadraticCurveTo(0, d * 1.15, -w / 2 + 1.5, d * 0.7);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 1, curveSegments: 6 });
  // extruded along z: stand it up (z becomes y), its front toward +z
  g.rotateX(-Math.PI / 2);
  lean(g);
  // the deck sits on the upper surface just behind the B/C deck
  const r = 16; // its back edge, from the saucer's centre
  return part('impulse', g, impulseMat, [0, SAUCER_Y + 3.2, SAUCER_Z - r - 6]);
}

/** Secondary (engineering) hull: lathe along z, a little taller than wide. Origin: its axis, mid length. */
function secondaryHull() {
  const front = 36, rear = -96;
  const profile = [
    [0, front - 2], [6.5, front - 1.6], [8, front], [10.5, front - 2.2], [12.6, front - 7], [13.8, front - 16],
    [14.2, front - 30], [13.8, front - 55], [12.6, front - 80], [10.6, front - 102], [8.6, front - 122], [7.6, rear], [0, rear]
  ];
  const g = latheZ(profile.map(([r, z]) => [r * 0.88, z]), 32, 1.08);
  const mid = (front + rear) / 2;
  g.translate(0, 0, -mid);
  return { mesh: part('secondary_hull', g, hull, [0, HULL_Y, mid]), front, rear };
}

/** Deflector dish in the hull's front ring, facing forward. Origin: the dish's middle. */
function deflector(front) {
  // a shallow dish (concave toward +z) with a centre spike
  const profile = [[0, 1.6], [0.6, 1.2], [1.2, 0.2], [3, -0.3], [5, -0.15], [6.6, 0.4], [7.4, 1.1], [7.6, 0]];
  const g = latheZ(profile, 32);
  return part('deflector', g, deflectorMat, [0, HULL_Y, front - 1.6]);
}

/** Shuttle bay doors on the hull's back. Origin: the doors' middle. */
function shuttleBay(rear) {
  const s = new Shape();
  const w = 11, h = 9;
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2 - 3);
  s.quadraticCurveTo(0, h / 2 + 2.5, -w / 2, h / 2 - 3);
  s.closePath();
  const g = lean(new ExtrudeGeometry(s, { depth: 4, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 1, curveSegments: 8 }));
  g.translate(0, 0, -4); // the door face at z = 0, the block forward into the hull
  // turn it so the door faces aft (-z)
  g.rotateY(Math.PI);
  g.translate(0, 0, 0);
  return part('shuttle_bay', g, panel, [0, HULL_Y + 1.5, rear - 0.2]);
}

/** The neck (dorsal): an aerofoil swept forward from the hull up to the saucer. Origin: its base middle. */
function neck(front) {
  const baseY = HULL_Y + 10;   // inside the hull's top
  const topY = SAUCER_Y - 4;   // inside the saucer's underside
  const across = new Vector3(1, 0, 0);
  const rings = [];
  const N = 6;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = baseY + (topY - baseY) * t;
    // chord and position: base well back on the hull, top forward under the saucer's back
    const zMid = (front - 46) + (SAUCER_Z - 46 - (front - 46)) * t;
    const chord = 40 - 10 * t;
    const half = 3.6 - 0.9 * t;
    rings.push(aerofoil(new Vector3(0, y, zMid), chord, half, across));
  }
  const g = loft(rings);
  const base = new Vector3(0, baseY, front - 46);
  g.translate(-base.x, -base.y, -base.z);
  return part('neck', g, hull, base.toArray());
}

/**
 * A pylon from the hull's back up and out to a nacelle. Origin: its root.
 * @param {number} side - -1 port, 1 starboard
 */
function pylon(side) {
  const root = new Vector3(side * 4, HULL_Y + 5, -64);
  const tip = new Vector3(side * NACELLE_X, NACELLE_Y - NACELLE_R + 1.5, -86);
  const dir = new Vector3().subVectors(tip, root);
  const across = new Vector3(-dir.y, dir.x, 0).normalize();
  const rings = [];
  const N = 6;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = new Vector3().lerpVectors(root, tip, t);
    // a little past the tip into the nacelle, and below the root into the hull
    if (i === 0) c.addScaledVector(dir, -0.06);
    if (i === N) c.addScaledVector(dir, 0.04);
    rings.push(aerofoil(c, 26 - 6 * t, 1.6 - 0.4 * t, across));
  }
  const g = loft(rings);
  g.translate(-root.x, -root.y, -root.z);
  return part(side < 0 ? 'pylon_port' : 'pylon_starboard', g, hull, root.toArray());
}

/**
 * A warp nacelle with its bussard collector (a child that turns) and grille.
 * Origin: its axis, mid length.
 * @param {number} side
 */
function nacelle(side) {
  const R = NACELLE_R;
  const mid = (NACELLE_FRONT + NACELLE_REAR) / 2;
  const profile = [
    [0, NACELLE_FRONT - 0.4], [R * 0.86, NACELLE_FRONT - 0.4], [R, NACELLE_FRONT - 1.2],   // front ring round the collector
    [R, NACELLE_REAR + 14], [R * 0.97, NACELLE_REAR + 6],                                  // body
    [R * 0.9, NACELLE_REAR + 2.5], [R * 0.62, NACELLE_REAR + 0.6], [R * 0.25, NACELLE_REAR], [0, NACELLE_REAR] // end cap
  ];
  const g = latheZ(profile, 24);
  g.translate(0, 0, -mid);
  const n = part(side < 0 ? 'nacelle_port' : 'nacelle_starboard', g, hull, [side * NACELLE_X, NACELLE_Y, mid]);

  // Bussard collector: a faceted dome (12 sides, so a turn shows) with vanes inside
  const dome = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    dome.push([R * 0.92 * Math.cos(a), R * 1.05 * Math.sin(a)]);
  }
  dome.reverse(); // the tip first
  const bg = latheZ([...dome, [0, 0]], 12);
  const b = part(side < 0 ? 'bussard_port' : 'bussard_starboard', bg, bussardMat, [0, 0, NACELLE_FRONT - 0.6 - mid]);
  n.add(b);

  // Grille: a strip along the inboard side, high on the nacelle
  const s = new Shape();
  s.moveTo(-1, 0);
  s.lineTo(1, 0);
  s.lineTo(1, 96);
  s.lineTo(-1, 96);
  s.closePath();
  const gg = lean(new ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: false }));
  gg.rotateX(-Math.PI / 2); // the strip's length runs aft (-z), its thickness up (y)
  const a = (side > 0 ? 145 : 35) * (Math.PI / 180);
  const grille = part(side < 0 ? 'grille_port' : 'grille_starboard', gg, grilleMat, [(R - 0.5) * Math.cos(a), (R - 0.5) * Math.sin(a), NACELLE_FRONT - 14 - mid]);
  grille.rotation.set(0, 0, a - Math.PI / 2);
  n.add(grille);
  return n;
}

// Build -------------------------------------------------------------------------

function build() {
  const ship = new Group();
  ship.name = 'constitution';
  const { mesh: sh, front, rear } = secondaryHull();
  ship.add(saucer(), bridge(), sensorDome(), impulse(), sh, deflector(front), shuttleBay(rear), neck(front),
    pylon(-1), pylon(1), nacelle(-1), nacelle(1));
  const scene = new Scene();
  scene.name = 'Scene';
  scene.add(ship);
  scene.updateMatrixWorld(true);

  // bussards: one turn every 2 s, round the nacelle axis
  const times = [0, 0.5, 1, 1.5, 2];
  const qs = times.flatMap((t) => new Quaternion().setFromEuler(new Euler(0, 0, (t / 2) * Math.PI * 2)).toArray());
  const clip = new AnimationClip('bussards', 2, [
    new QuaternionKeyframeTrack('bussard_port.quaternion', times, qs),
    new QuaternionKeyframeTrack('bussard_starboard.quaternion', times, qs.map((v, i) => (i % 4 === 2 ? -v : v)))
  ]);
  return { scene, clip };
}

/** @returns {Promise<ArrayBuffer>} */
async function exportGlb(scene, clip) {
  return new GLTFExporter().parseAsync(scene, { binary: true, animations: [clip], onlyVisible: true });
}

const { scene, clip } = build();
const glb = Buffer.from(await exportGlb(scene, clip));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, glb);
let tris = 0;
scene.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
console.log(`constitution.glb: ${(glb.length / 1024).toFixed(1)} KB, ${tris} triangles`);

if (process.argv.includes('--meshopt')) {
  const { meshoptCompress } = await import('./lib/glb-meshopt.mjs');
  const small = await meshoptCompress(glb);
  mkdirSync(dirname(OUT_MESHOPT), { recursive: true });
  writeFileSync(OUT_MESHOPT, small);
  console.log(`constitution-meshopt.glb: ${(small.length / 1024).toFixed(1)} KB`);
}
