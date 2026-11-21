#!/usr/bin/env node
/**
 * make-ships.mjs: builds the built-in starship models for astrometrics,
 * recreating the on-screen designs (fan art, made from code: no third-party
 * mesh or texture), and writes them as GLB to src/assets/models/.
 *
 *   node scripts/make-ships.mjs                            # every ship
 *   node scripts/make-ships.mjs galaxy_class               # one
 *   node scripts/make-ships.mjs constitution_class_refit --meshopt
 *     # also tests/fixtures/constitution-class-refit-meshopt.glb (EXT_meshopt_compression)
 *
 * Y up, metres, the bow toward +z, the origin in the middle of the bounding
 * box. Port is -x (the ship's left, seen from behind with the bow away).
 * Both ships share one part vocabulary (saucer, bridge, impulse, neck,
 * torpedo_launcher, secondary_hull, deflector, shuttle_bay, pylon_port/_starboard,
 * nacelle_port/_starboard, bussard_port/_starboard (children of the nacelles),
 * grille_port/_starboard, windows), so a config labelling `bridge` works with
 * either. One animation clip each, `bussards`: the collectors pulse.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Box3, BufferGeometry, Float32BufferAttribute, ExtrudeGeometry, Group, Scene, Shape, MeshStandardMaterial, Vector3, VectorKeyframeTrack, AnimationClip
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { lean, latheY, latheZ, loft, part, exportGlb, triangles, placed, roundedRect } from './lib/model-kit.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'src/assets/models');

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);

/** Materials (used by `material: original`; the hologram look replaces them) */
function materials({ hull, panel, bussard, bussardGlow, deflector, deflectorGlow }) {
  return {
    hull: new MeshStandardMaterial({ name: 'hull', color: hull, roughness: 0.55, metalness: 0.2 }),
    panel: new MeshStandardMaterial({ name: 'panel', color: panel, roughness: 0.6, metalness: 0.2 }),
    bussard: new MeshStandardMaterial({ name: 'bussard', color: bussard, emissive: bussardGlow, emissiveIntensity: 1.3, roughness: 0.4 }),
    deflector: new MeshStandardMaterial({ name: 'deflector', color: deflector, emissive: deflectorGlow, emissiveIntensity: 1.1, roughness: 0.35, metalness: 0.5 }),
    grille: new MeshStandardMaterial({ name: 'grille', color: 0x5a86d0, emissive: 0x2a5ad8, emissiveIntensity: 1.2, roughness: 0.5 }),
    impulse: new MeshStandardMaterial({ name: 'impulse', color: 0xb04030, emissive: 0xd02810, emissiveIntensity: 0.9, roughness: 0.5 }),
    windows: new MeshStandardMaterial({ name: 'windows', color: 0xfff0d0, emissive: 0xffe0a0, emissiveIntensity: 1.3, roughness: 0.5 })
  };
}

/**
 * A tube along z through rounded-rectangle sections: [z, halfWidth, halfHeight, yOffset?, power?] rows,
 * front to back. Nacelles, the refit's hull details.
 * @param {number[][]} rows
 * @param {number} [n]
 */
function tubeZ(rows, n = 24) {
  return loft(rows.map(([z, hw, hh, dy = 0, p = 0.6]) => roundedRect(new Vector3(0, dy, z), X, Math.max(hw, 0.05), Y, Math.max(hh, 0.05), n, p)));
}

/** A thin box strip (windows, grilles): centre, size [x, y, z] */
function strip(c, size) {
  const s = new Shape();
  s.moveTo(-size[0] / 2, -size[1] / 2);
  s.lineTo(size[0] / 2, -size[1] / 2);
  s.lineTo(size[0] / 2, size[1] / 2);
  s.lineTo(-size[0] / 2, size[1] / 2);
  s.closePath();
  const g = lean(new ExtrudeGeometry(s, { depth: size[2], bevelEnabled: false }));
  g.translate(c[0], c[1], c[2] - size[2] / 2);
  return g;
}

/**
 * Lit windows as single outward-facing quads in one indexed geometry (a box per
 * window costs nine times the bytes). A window: c (centre), n (out), t (along), w, h.
 * @param {{ c: Vector3, n: Vector3, t: Vector3, w: number, h: number }[]} list
 */
function windowQuads(list) {
  const pos = [], nor = [], idx = [];
  for (const { c, n, t, w, h } of list) {
    const up = new Vector3().crossVectors(n, t).normalize();
    const k = pos.length / 3;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const v = new Vector3().copy(c).addScaledVector(t, (a * w) / 2).addScaledVector(up, (b * h) / 2);
      pos.push(v.x, v.y, v.z);
      nor.push(n.x, n.y, n.z);
    }
    // wind so the face looks along n
    const front = new Vector3().crossVectors(t, up).dot(n) > 0;
    idx.push(...(front ? [k, k + 1, k + 2, k, k + 2, k + 3] : [k, k + 2, k + 1, k, k + 3, k + 2]));
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/** A ring of windows round the y axis at radius r, height y: `segments` slots, `gaps` of each unlit; z squashed for an ellipse */
function windowRing(r, y, h, segments, { gaps = 0.35, squash = 1, z = 0 } = {}) {
  const list = [];
  for (let i = 0; i < segments; i++) {
    const a = ((i + 0.5) / segments) * Math.PI * 2;
    const out = new Vector3(Math.sin(a), 0, Math.cos(a) / squash).normalize();
    list.push({
      c: new Vector3(Math.sin(a) * r, y, Math.cos(a) * r * squash + z),
      n: out,
      t: new Vector3(out.z, 0, -out.x),
      w: (r * Math.PI * 2 * (1 - gaps)) / segments,
      h
    });
  }
  return list;
}

/** A row of windows along z on one side of a hull: x (signed), y, from z0 to z1 */
function windowRow(x, y, z0, z1, h, count, gaps = 0.4) {
  const list = [];
  const step = (z1 - z0) / count;
  for (let i = 0; i < count; i++) {
    list.push({ c: new Vector3(x, y, z0 + (i + 0.5) * step), n: new Vector3(Math.sign(x), 0, 0), t: new Vector3(0, 0, 1), w: Math.abs(step) * (1 - gaps), h });
  }
  return list;
}

/** The `bussards` clip: the collectors swell and settle once every 2 s */
function bussardClip(names) {
  const times = [0, 1, 2];
  const s = [1, 1, 1, 1.06, 1.06, 1.06, 1, 1, 1];
  return new AnimationClip('bussards', 2, names.map((n) => new VectorKeyframeTrack(`${n}.scale`, times, s)));
}

/**
 * Where a part's point sits, off its surface: a point flush with a surface is
 * hidden by it (labels occlude), so these origins stand a little clear,
 * outward, in the part's own frame (metres). Port is -x.
 */
const LIFT = {
  bridge: [0, 2, 0],
  sensor_dome: [0, -1.5, 0],
  deflector: [0, 0, 3],
  shuttle_bay: [0, 0, -2],
  torpedo_launcher: [0, 0, 1.5],
  impulse: [0, 0, -1.5],
  bussard_port: [0, 0, 2],
  bussard_starboard: [0, 0, 2],
  grille_port: [1.5, 0, 0],
  grille_starboard: [-1.5, 0, 0]
};

/** Move each listed part's origin by its LIFT, leaving its geometry and children where they were */
function liftOrigins(ship) {
  ship.traverse((o) => {
    const d = LIFT[o.name];
    if (!d || !o.isMesh) return;
    const v = new Vector3(...d);
    o.position.add(v);
    o.geometry.translate(-v.x, -v.y, -v.z);
    for (const c of o.children) c.position.sub(v);
  });
  return ship;
}

/** Centre the ship's bounding box on the origin */
function centred(ship) {
  ship.updateMatrixWorld(true);
  const c = new Box3().setFromObject(ship).getCenter(new Vector3());
  ship.position.sub(c);
  return ship;
}

/**
 * A hull along z from side-view and plan-view measurements: rows of
 * [z, top, bottom, halfWidth, power?], front to back.
 * @param {number[][]} rows
 * @param {number} [n]
 */
function hullZ(rows, n = 32) {
  return tubeZ(rows.map(([z, top, bottom, hw, p = 0.6]) => [z, hw, (top - bottom) / 2, (top + bottom) / 2, p]), n);
}

/**
 * A strut through points in the xy plane (x, y, centre z), its chord along z:
 * rows of [x, y, z, chord, half thickness]. Pylons.
 * @param {number[][]} rows
 */
function strut(rows) {
  const pts = rows.map(([x, y, z]) => new Vector3(x, y, z));
  return loft(rows.map(([, , , chord, half], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const t = new Vector3(b.x - a.x, b.y - a.y, 0).normalize();
    return roundedRect(pts[i], new Vector3(0, 0, 1), chord / 2, new Vector3(-t.y, t.x, 0), half, 18, 0.5);
  }));
}

/** A saucer lathe from side-view measurements: [r, top, bottom] rows, centre to rim */
function saucerLathe(rows, segments, squash = 1) {
  const top = rows.map(([r, t]) => [r, t]);
  const bottom = rows.map(([r, , b]) => [r, b]).reverse();
  const g = latheY([...top, ...bottom], segments);
  if (squash !== 1) g.scale(1, 1, squash);
  return g;
}

// Constitution class, refit (USS Enterprise NCC-1701-A) ---------------------------
//
// The refit Constitution of the films (Star Trek: The Motion Picture to The
// Undiscovered Country): 305.1 m long, 144.5 m across the saucer. Measured
// in pixels from orthographic plates (the 1980 outboard profile for every
// height and length, 5.07 px/m on the 305.1 m length; a plan view and a
// forward elevation for widths, 9.05 px/m on the saucer): saucer 147.5 m
// stem to stern with the impulse deck, engineering hull 111 m long and 34 m
// tall, 36 m across at the deflector housing and about 24 m behind it,
// nacelles 155 m long, 13 m wide, their centres 50.3 m out, their tops 55.6 m
// over the hull's axis.
//
// Coordinates as measured (y up from the engineering hull's axis, the bow at
// z = +152.55), then centred.

const CR_SAUCER_Z = 152.55 - 72.25;
/** Saucer [r, top, bottom], centre to rim (the side-view silhouette; the bridge and lower dome are parts of their own) */
const CR_SAUCER = [
  [0, 52.6, 23.8], [5.8, 52.4, 23.7], [8.2, 51.7, 25], [10.5, 50.5, 25.6], [12.9, 49.1, 26.4], [15.3, 47.3, 28],
  [20, 46.1, 30], [24.7, 44.8, 31.8], [29.5, 43.8, 32.9], [34.2, 42.8, 33.9], [41.3, 41.6, 33.9], [50.8, 40.8, 33.9],
  [60.2, 40.2, 33.9], [69.7, 40, 34.2], [71.6, 39.9, 36.8], [72.25, 39.3, 37.6]
];
/** Engineering hull [z, top, bottom, half width]: the side profile's top and bottom, widths from the plan and forward views */
const CR_HULL = [
  [37.8, 6, -5, 7, 0.8], [36.8, 10, -8.1, 12, 0.8], [34.4, 13.5, -10, 15.5, 0.75], [31.6, 16, -11.5, 17.2, 0.7], [28, 17.4, -13.5, 17.8],
  [22, 17.8, -14.6, 16], [10, 17.8, -15.8, 13.6], [0, 17.4, -16, 12.6], [-12.5, 16, -15.2, 12.2], [-25, 15, -13.6, 12],
  [-36, 14.2, -12.2, 11.5], [-42, 13.8, -8.5, 11], [-50, 11.6, -4.9, 10], [-60, 9.2, -2.4, 9], [-68, 7, -1.5, 7.5], [-71.7, 5.4, -0.8, 6.5]
];
const CR_NACELLE_X = 50.3;
const CR_NACELLE_HW = 6.4;
/** Nacelle main body [z, top, bottom, half width]: a slanted front face, the tail tapering from below */
const CR_NACELLE = [
  [2.2, 55.2, 53.6, 5.6, 0.5], [1, 55.5, 50, 6.2, 0.5], [-1.9, 55.6, 44.2, CR_NACELLE_HW, 0.5], [-5, 55.6, 40, CR_NACELLE_HW, 0.5],
  [-8, 55.6, 39.4, CR_NACELLE_HW, 0.5], [-100, 55.2, 39.6, CR_NACELLE_HW, 0.5], [-112, 55.2, 41.6, CR_NACELLE_HW, 0.5],
  [-128, 54.6, 42, CR_NACELLE_HW, 0.5], [-141, 54, 40, 6, 0.5], [-147, 54, 44.4, 5, 0.5], [-150.2, 54, 49.3, 3.4, 0.5], [-152.5, 54.2, 53, 1.2, 0.5]
];

function constitutionRefit() {
  const m = materials({ hull: 0xd0d2d4, panel: 0xb4b8bc, bussard: 0x5aa8ff, bussardGlow: 0x2a70ff, deflector: 0x5ab0ff, deflectorGlow: 0x2a80ff });
  const ship = new Group();
  ship.name = 'constitution_class_refit';
  const SZ = CR_SAUCER_Z;

  ship.add(placed('saucer', saucerLathe(CR_SAUCER, 80).translate(0, 0, SZ), m.hull, [0, 38.5, SZ]));
  // Bridge module on the B/C deck. Origin: its top
  ship.add(part('bridge', latheY([[0, 0], [2.4, -0.3], [4.4, -1.1], [5.6, -2.2], [6.2, -3.2], [7.6, -3.6]], 36), m.panel, [0, 55.4, SZ]));
  // Lower navigational dome. Origin: its lowest point
  ship.add(part('sensor_dome', latheY([[6.4, 1.6], [5.6, 1.1], [4, 0.5], [2, 0.15], [0, 0]], 32), m.panel, [0, 22.3, SZ]));
  // Impulse deck on the saucer's back: 21 m wide, its exhausts aft. Origin: the exhaust face
  {
    const g = tubeZ([[16, 7, 2.2, 0, 0.5], [12, 10, 3, 0, 0.5], [0, 10.5, 3, 0, 0.5]], 20);
    const imp = part('impulse', g, m.panel, [0, 38.5, 6.2]);
    imp.add(part('impulse_exhaust', strip([0, 0, -0.3], [16, 2.6, 0.6]), m.impulse));
    ship.add(imp);
  }

  // Engineering hull. Origin: its axis, mid length
  ship.add(placed('secondary_hull', hullZ(CR_HULL, 36), m.hull, [0, 0, -16]));
  // Deflector dish in the housing's front, 17.6 m across. Origin: the dish's middle
  ship.add(part('deflector', latheZ([[0, 1.2], [2.6, 0.5], [5.4, -0.6], [8.2, -0.8], [9.6, 0.2], [9.9, 0.8], [9.9, -1.4]], 36), m.deflector, [0, 0.7, 37.2]));
  // Shuttle bay doors on the hull's back. Origin: the doors' middle
  ship.add(part('shuttle_bay', strip([0, 0, -1], [8, 7, 2]), m.panel, [0, 3.2, -71.2]));

  // Neck (the connecting dorsal): a swept slab, the front edge from (z 30.5, y 16) flaring forward to the saucer at
  // (z 47, y 32), the back edge from (z -12, y 16) to (z 7, y 32); 11 m thick. Origin: its base middle
  {
    const rows = [[13, 30, -16, 6], [16.2, 30.5, -12, 5.6], [20, 30.3, -6.4, 5.4], [24, 35.6, -2.3, 5.4], [28, 42.9, 2.3, 5.6], [32, 47, 6.8, 6], [35.5, 48, 8, 6]];
    const g = loft(rows.map(([y, zf, zr, hw]) => roundedRect(new Vector3(0, y, (zf + zr) / 2), new Vector3(0, 0, 1), (zf - zr) / 2, X, hw, 20, 0.55)));
    ship.add(placed('neck', g, m.hull, [0, 15, 8]));
  }
  // Torpedo launcher: the housing at the neck's front foot, 17.6 m wide. Origin: its front face
  ship.add(placed('torpedo_launcher', tubeZ([[31.5, 6.5, 2.6, 21, 0.4], [29.5, 8.8, 3.2, 21, 0.4], [20, 8.8, 3.2, 21, 0.4]], 16), m.panel, [0, 21, 31.5]));

  const nacelleMid = (CR_NACELLE[0][0] + CR_NACELLE.at(-1)[0]) / 2;
  for (const side of [-1, 1]) {
    // Pylon: straight from the hull's upper flank (z -16 to -38) out and up to the nacelle (z -49 to -82). Origin: its root
    const rootP = [side * 10, 13, -27];
    const g = strut([
      [side * 8, 11, -25.5, 22, 1.6],
      [side * 10, 13, -27, 22, 1.6],
      [side * 28, 26, -46, 27, 1.6],
      [side * 44.5, 38.5, -65.5, 33, 1.6],
      [side * 46.5, 40.5, -67, 33, 1.6]
    ]);
    ship.add(placed(side < 0 ? 'pylon_port' : 'pylon_starboard', g, m.hull, rootP));

    // Nacelle. Origin: its axis, mid length
    const ng = hullZ(CR_NACELLE, 28);
    // the lower intercooler bar, z -36 to -80
    const bar = hullZ([[-34, 40.2, 38, 2.5, 0.6], [-37, 40.2, 35.2, 3.8, 0.6], [-77, 40.2, 34.5, 3.8, 0.6], [-81, 40.2, 37, 2.5, 0.6]], 16);
    const body = mergeGeometries([ng, bar]);
    body.translate(0, -47.5, -nacelleMid);
    const n = part(side < 0 ? 'nacelle_port' : 'nacelle_starboard', body, m.hull, [side * CR_NACELLE_X, 47.5, nacelleMid]);
    // Bussard: the glowing cap on the slanted front. Origin: its front
    const bg = hullZ([[2.4, 55, 53.8, 4.6, 0.6], [1.2, 55.3, 49, 5.6, 0.6], [-1.2, 55.3, 45, 5.8, 0.6], [-2.4, 55.3, 44, 5.4, 0.6]], 20);
    bg.translate(0, -47.5, -2.4);
    n.add(part(side < 0 ? 'bussard_port' : 'bussard_starboard', bg, m.bussard, [0, 0, 2.4 - nacelleMid]));
    // Grille: the long striped band down the outboard side. Origin: its front
    n.add(part(side < 0 ? 'grille_port' : 'grille_starboard', strip([0, 0, -48], [0.6, 6.4, 96]), m.grille, [side * (CR_NACELLE_HW + 0.05), 0.6, -14 - nacelleMid]));
    ship.add(n);
  }

  // Windows: the saucer rim, the B/C deck, the engineering hull's sides. Origin: the bow window
  {
    const w = windowQuads([
      ...windowRing(72.4, 38.4, 0.8, 110, { gaps: 0.45, z: SZ }),
      ...windowRing(16, 46.6, 0.6, 30, { gaps: 0.5, z: SZ }),
      ...[-1, 1].flatMap((s) => [...windowRow(s * 12.4, 6, 8, -30, 0.8, 12), ...windowRow(s * 12.0, -6, -14, -32, 1.4, 6, 0.25)])
    ]);
    ship.add(placed('windows', w, m.windows, [0, 38.4, 153.2]));
  }

  return { ship: centred(liftOrigins(ship)), clip: bussardClip(['bussard_port', 'bussard_starboard']) };
}

// Galaxy class (USS Enterprise NCC-1701-D) ----------------------------------------
//
// The Galaxy class of The Next Generation: 642.5 m long, about 470 m across
// the saucer, about 140 m tall (the plates give 137.5). Measured in pixels
// from orthographic plates (an outboard overhead and a starboard elevation,
// 3.01 px/m on the 642.5 m length; a forward elevation for the cross
// section): the saucer an ellipse 382 m stem to stern centred 130 m behind
// the bow, 12 m thick at the rim; the engineering hull 147 m wide at its
// front, its keel flat at -75 m; nacelles 239 m long, 52 m wide and 32 m
// tall, their centres 127 m out; pylons dropping from the nacelles and
// running in level to the hull's low flanks.
//
// Coordinates as measured (y up from the plate's datum, the saucer rim
// about +28; the bow at z = +321.25), then centred.

const GX_SAUCER_Z = 130;
const GX_SAUCER_SQUASH = 191.25 / 235;
/** Saucer [r across, top, bottom], centre to rim; along z the lathe is squashed to the ellipse */
const GX_SAUCER = [
  [0, 62.4, 1.3], [17, 62.2, 3], [34, 60.6, 4.3], [51, 59.6, 5], [67, 57.4, 6.6], [84, 56.6, 8.3], [100, 55.4, 10.3],
  [117, 54, 12.6], [133, 52.4, 14.6], [150, 50.6, 18.3], [166, 47, 20.9], [183, 44.4, 22.2], [200, 41.4, 22.4],
  [216, 38.2, 22.6], [229, 35, 23], [233.6, 33, 24], [235, 30, 26.4]
];
/** Engineering hull [z, top, bottom, half width]: keel from the side view, widths from the overhead, the top from the forward view */
const GX_HULL = [
  [6, -18, -26, 22, 0.7], [0, -14, -40, 46, 0.7], [-10, -14, -52, 60, 0.7], [-25, -15, -63, 68, 0.7], [-45, -16, -70, 72, 0.7],
  [-70, -18, -75, 73.5, 0.7], [-110, -19, -76, 72, 0.7], [-148, -21, -75, 66.2, 0.7], [-162, -22, -65, 63.9, 0.7],
  [-176, -23, -59, 60.9, 0.7], [-200, -25, -57, 58, 0.7], [-240, -28, -57, 52, 0.7], [-268, -31, -56.4, 46, 0.7],
  [-281, -35, -56, 40, 0.7], [-289, -40, -54, 26, 0.7], [-293, -45, -51, 8, 0.7]
];
const GX_NACELLE_X = 127;
/** Nacelle [z, top, bottom, half width]: a flat-topped oval, narrower at the bussard, a rounded tail */
const GX_NACELLE = [
  [-80, 6, -16, 12, 0.6], [-83, 9, -19, 16.5, 0.55], [-95, 10.4, -20.8, 18.3, 0.55], [-110, 10.8, -21.4, 21, 0.55],
  [-125, 11, -21.6, 22.6, 0.55], [-200, 11.4, -21.6, 25.5, 0.55], [-300, 11, -21.6, 27, 0.55], [-310, 10, -20, 25, 0.55],
  [-317, 6, -16, 19, 0.6], [-321, -2, -8, 6, 0.7]
];

function galaxyClass() {
  const m = materials({ hull: 0xb8bcc2, panel: 0x9ea4ac, bussard: 0xff3a2a, bussardGlow: 0xe01810, deflector: 0x6aa8ff, deflectorGlow: 0x3a78ff });
  const ship = new Group();
  ship.name = 'galaxy_class';
  const SZ = GX_SAUCER_Z;
  const sq = GX_SAUCER_SQUASH;

  ship.add(placed('saucer', saucerLathe(GX_SAUCER, 112, sq).translate(0, 0, SZ), m.hull, [0, 28, SZ]));
  // Bridge module on top, 13 m behind the saucer's centre (the plates). Origin: its top
  ship.add(part('bridge', latheY([[0, 0], [5, -0.3], [9, -1.2], [11.5, -2.4], [13, -3.6], [17, -4.2]], 36), m.panel, [0, 66, SZ - 13]));

  // Engineering hull. Origin: its axis, mid length
  ship.add(placed('secondary_hull', hullZ(GX_HULL, 40), m.hull, [0, -45, -140]));
  // Neck (the connecting interhull): from the hull's top up into the saucer's back, 40 m wide at its waist,
  // its back edge sloping down from the saucer to the hull. Origin: its base middle
  {
    const rows = [
      [-30, 2, -118, 50], [-20, 9, -106, 28], [-12, 13, -100, 21], [0, 20, -97, 24], [8, 24, -95, 30],
      [20, 28, -81, 46], [30, 26, -68, 60], [38, 15, -55, 52], [41, 0, -44, 36]
    ];
    const g = loft(rows.map(([y, zf, zr, hw]) => roundedRect(new Vector3(0, y, (zf + zr) / 2), new Vector3(0, 0, 1), (zf - zr) / 2, X, hw, 24, 0.55)));
    ship.add(placed('neck', g, m.hull, [0, -30, -40]));
  }
  // Impulse engine at the back of the neck's top, facing aft. Origin: the exhaust face
  {
    const imp = part('impulse', tubeZ([[14, 20, 4, 0, 0.5], [4, 30, 6, 0, 0.5], [0, 30, 6, 0, 0.5]], 20), m.panel, [0, 30, -62]);
    imp.add(part('impulse_exhaust', strip([0, 0, -0.3], [48, 6, 0.8]), m.impulse));
    ship.add(imp);
  }
  // Main shuttle bay: doors in the saucer's back above the impulse engine. Origin: the doors' middle
  ship.add(part('shuttle_bay', strip([0, 0, -1.5], [36, 8, 3]), m.panel, [0, 40, -52]));
  // Deflector: a wide oval dish on the hull's sloping front, facing forward and down. Origin: the dish's middle
  {
    const g = latheZ([[0, 1.5], [9, 0.4], [18, -1], [24, -0.6], [25, 1.2], [25, -2.5]], 40, 0.42);
    const d = part('deflector', g, m.deflector, [0, -46, -2]);
    d.rotation.x = 0.5;
    ship.add(d);
  }
  // Torpedo launcher: at the neck's front foot. Origin: its front face
  ship.add(part('torpedo_launcher', tubeZ([[0, 9, 3.5, 0, 0.4], [-12, 12, 5, 0, 0.4], [-20, 12, 5, 0, 0.4]], 16), m.panel, [0, -19, 9]));

  const nacelleMid = (GX_NACELLE[0][0] + GX_NACELLE.at(-1)[0]) / 2;
  const NY = (11 + -21.6) / 2;
  for (const side of [-1, 1]) {
    // Pylon: down from the nacelle's underside, then level and in to the hull's low flank (z -215 to -268). Origin: its root
    const zc = -241, chord = 52;
    const g = strut([
      [side * 54, -55, zc, chord, 3.6],
      [side * 62, -56, zc, chord, 3.6],
      [side * 95, -56, zc, chord - 2, 3.6],
      [side * 110, -52, zc, chord - 4, 3.6],
      [side * 117, -42, zc, chord - 6, 3.6],
      [side * 119, -28, zc, chord - 8, 3.6],
      [side * 119, -16, zc, chord - 8, 3.6]
    ]);
    ship.add(placed(side < 0 ? 'pylon_port' : 'pylon_starboard', g, m.hull, [side * 60, -56, zc]));

    // Nacelle. Origin: its axis, mid length
    const ng = hullZ(GX_NACELLE, 32);
    ng.translate(0, -NY, -nacelleMid);
    const n = part(side < 0 ? 'nacelle_port' : 'nacelle_starboard', ng, m.hull, [side * GX_NACELLE_X, NY, nacelleMid]);
    // Bussard: the red cap over the nacelle's front. Origin: its front
    const bg = hullZ([[-79, 4, -14, 10, 0.6], [-81, 8, -18, 15, 0.55], [-86, 9.6, -19.8, 17, 0.55], [-96, 10.6, -21, 18.6, 0.55], [-99, 10.4, -20.8, 18, 0.55]], 28);
    bg.translate(0, -NY, 79);
    n.add(part(side < 0 ? 'bussard_port' : 'bussard_starboard', bg, m.bussard, [0, 0, -79 - nacelleMid]));
    // Grille: the long blue band down the outboard side, low. Origin: its front
    const outX = side * 26.4;
    n.add(part(side < 0 ? 'grille_port' : 'grille_starboard', strip([0, 0, -95], [1.2, 6, 190]), m.grille, [outX, -6, -110 - nacelleMid]));
    ship.add(n);
  }

  // Windows: two rows round the saucer rim, rings on its top, rows down the hull's flanks. Origin: the bow window
  {
    const o = { squash: sq, z: SZ };
    const w = windowQuads([
      ...windowRing(235.4, 30.6, 1.6, 190, { ...o, gaps: 0.4 }),
      ...windowRing(234.6, 26, 1.6, 190, { ...o, gaps: 0.45 }),
      ...windowRing(150.6, 50.8, 1.2, 130, { ...o, gaps: 0.55 }),
      ...windowRing(84.6, 56.9, 1.2, 80, { ...o, gaps: 0.55 }),
      ...[-1, 1].flatMap((s) => [0, 1, 2].flatMap((k) => windowRow(s * (73.8 - k * 0.6), -36 - k * 9, -50, -140, 1.4, 24)))
    ]);
    ship.add(placed('windows', w, m.windows, [0, 28, 322]));
  }

  return { ship: centred(liftOrigins(ship)), clip: bussardClip(['bussard_port', 'bussard_starboard']) };
}

// Build -------------------------------------------------------------------------

const SHIPS = {
  constitution_class_refit: { file: 'constitution-class-refit.glb', build: constitutionRefit },
  galaxy_class: { file: 'galaxy-class.glb', build: galaxyClass }
};

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
for (const [id, { file, build }] of Object.entries(SHIPS)) {
  if (only.length && !only.includes(id)) continue;
  const { ship, clip } = build();
  const scene = new Scene();
  scene.name = 'Scene';
  scene.add(ship);
  scene.updateMatrixWorld(true);
  const glb = Buffer.from(await exportGlb(scene, [clip]));
  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, file), glb);
  const size = new Box3().setFromObject(scene).getSize(new Vector3());
  console.log(`${file}: ${(glb.length / 1024).toFixed(1)} KB, ${triangles(scene)} triangles, ${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)} m`);
  if (id === 'constitution_class_refit' && process.argv.includes('--meshopt')) {
    const { meshoptCompress } = await import('./lib/glb-meshopt.mjs');
    const small = await meshoptCompress(glb);
    const out = resolve(root, 'tests/fixtures/constitution-class-refit-meshopt.glb');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, small);
    console.log(`constitution-class-refit-meshopt.glb: ${(small.length / 1024).toFixed(1)} KB`);
  }
}
