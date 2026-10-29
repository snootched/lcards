#!/usr/bin/env node
/**
 * make-starbases.mjs: builds the built-in starbase models for astrometrics
 * (`builtin:deep_space_nine`, ...), recreating the on-screen designs (fan
 * art, made from code: no third-party mesh or texture), and writes them as
 * GLB to src/assets/models/.
 *
 *   node scripts/make-starbases.mjs                   # every starbase
 *   node scripts/make-starbases.mjs deep_space_nine   # one
 *
 * Y up, metres, the origin in the middle of each station. Named parts (node
 * origins are meaningful, `part:` points sit on them) are listed per station
 * below and in the model pack entry (src/core/packs/lcards-images-pack.js).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BoxGeometry, CylinderGeometry, Group, Scene, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { lean, latheY, ringY, loft, part, exportGlb, triangles } from './lib/model-kit.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'src/assets/models');
const DEG = Math.PI / 180;

/**
 * A mesh whose geometry is built in station space, moved so the node's
 * origin is `origin` (where `part:` points sit).
 * @param {string} name
 * @param {import('three').BufferGeometry} geo
 * @param {import('three').Material} mat
 * @param {number[]} origin
 */
function placed(name, geo, mat, origin) {
  geo.translate(-origin[0], -origin[1], -origin[2]);
  return part(name, geo, mat, origin);
}

/** The unit vectors at angle `a` (degrees from +z, toward +x): out from the axis, and across */
function frame(a) {
  const t = a * DEG;
  return { out: new Vector3(Math.sin(t), 0, Math.cos(t)), across: new Vector3(Math.cos(t), 0, -Math.sin(t)) };
}

/** A point on a cubic Bezier through four [r, y] pairs, and its direction */
function bezier(p, t) {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  const d = [-3 * u * u, 3 * u * u - 6 * u * t, 6 * u * t - 3 * t * t, 3 * t * t];
  const at = [0, 1].map((k) => w.reduce((s, wi, i) => s + wi * p[i][k], 0));
  const dir = [0, 1].map((k) => d.reduce((s, di, i) => s + di * p[i][k], 0));
  return { at, dir };
}

/**
 * A rounded-rectangle section (a superellipse), `n` points round `c`.
 * @param {Vector3} c
 * @param {Vector3} u - first axis (unit)
 * @param {number} hu - half size along u
 * @param {Vector3} v - second axis (unit)
 * @param {number} hv - half size along v
 */
function roundedRect(c, u, hu, v, hv, n = 16) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const cu = Math.cos(t), sv = Math.sin(t);
    const x = Math.sign(cu) * Math.pow(Math.abs(cu), 0.45);
    const y = Math.sign(sv) * Math.pow(Math.abs(sv), 0.45);
    pts.push(new Vector3().copy(c).addScaledVector(u, hu * x).addScaledVector(v, hv * y));
  }
  return pts;
}

// Deep Space 9 (Terok Nor) ------------------------------------------------------
//
// The Cardassian ore-processing station of Deep Space Nine (1993-1999), about
// 1450 m across and 1070 m tall. From the axis out: the central core (Ops on
// top, the Promenade at the waist, the long lower core down to the fusion
// reactor), the habitat ring, the docking ring; six crossover bridges from the
// core to the docking ring; three upper and three lower docking pylons rising
// from the docking ring, curling inward at their tips like claws.
//
// Parts: ops (the Ops module), promenade (its front window, +z), lower_core
// (its tip, the bottom of the station), habitat_ring and docking_ring (their
// front faces, +z), crossover_bridges, docking_ports, upper_pylon_1..3 and
// lower_pylon_1..3 (their tips; pylon 1 at the front, then clockwise seen from
// above, 120 degrees apart).

/** The core's outline, [radius, y], top to bottom; split into its parts below */
const DS9_CORE = {
  ops: [
    [0, 232], [2, 232], [2, 205], [9, 200], [12, 192],                    // the mast and Ops tower
    [24, 190], [48, 184], [60, 176], [62, 168], [54, 160], [36, 156], [30, 150] // the Ops module
  ],
  upper_core: [[30, 150], [32, 120], [42, 95], [58, 72], [90, 55], [150, 42]],
  promenade: [[150, 42], [166, 30], [170, 10], [170, -10], [164, -28], [146, -42]],
  lower_core: [
    [146, -42], [112, -56], [92, -80], [82, -120], [80, -170], [88, -205], [92, -235], [82, -265],
    [64, -320], [56, -390], [64, -420], [66, -445], [54, -480], [36, -530], [20, -585], [8, -625], [0, -642]
  ]
};
const DS9_HABITAT = [[330, -36], [418, -36], [446, -14], [446, 14], [418, 36], [330, 36], [316, 0]];
const DS9_DOCKING = [[612, -16], [655, -16], [668, -6], [668, 6], [655, 16], [612, 16], [604, 0]];
/** An upper pylon's centre line in its plane, [radius, y]: out from the docking ring, up, curling in */
const DS9_PYLON = [[640, 0], [705, 120], [760, 360], [610, 445]];

function deepSpaceNine() {
  const hull = new MeshStandardMaterial({ name: 'hull', color: 0x9a9080, roughness: 0.7, metalness: 0.25 });
  const dark = new MeshStandardMaterial({ name: 'structure', color: 0x6e665a, roughness: 0.75, metalness: 0.3 });
  const windows = new MeshStandardMaterial({ name: 'windows', color: 0xffc070, emissive: 0xff9a40, emissiveIntensity: 1.4, roughness: 0.5 });

  const station = new Group();
  station.name = 'deep_space_nine';
  const c = DS9_CORE;
  station.add(
    placed('ops', latheY(c.ops, 48), hull, [0, 176, 0]),
    placed('upper_core', latheY(c.upper_core, 48), dark, [0, 95, 0]),
    placed('promenade', latheY(c.promenade, 64), hull, [0, 0, 170]),
    placed('lower_core', latheY(c.lower_core, 48), dark, [0, -642, 0]),
    placed('habitat_ring', ringY(DS9_HABITAT, 96), hull, [0, 0, 446]),
    placed('docking_ring', ringY(DS9_DOCKING, 128), hull, [0, 0, 668])
  );

  // window bands: the Promenade, the habitat ring and the Ops module
  const bands = mergeGeometries([
    ringY([[170, -6], [171.5, -6], [171.5, 6], [170, 6]], 64),
    ringY([[446, -5], [447.5, -5], [447.5, 5], [446, 5]], 96),
    ringY([[446, 9], [447.5, 9], [447.5, 11], [446, 11]], 96),
    ringY([[61.6, 170], [62.8, 170], [62.8, 174], [61.6, 174]], 48)
  ]);
  station.add(placed('windows', bands, windows, [0, 0, 0]));

  // six crossover bridges, core to docking ring, one every 60 degrees
  const bridges = [];
  for (let k = 0; k < 6; k++) {
    const g = lean(new BoxGeometry(22, 16, 612 - 150 + 8));
    g.translate(0, 0, (150 + 612) / 2);
    g.rotateY(k * 60 * DEG);
    bridges.push(g);
  }
  station.add(placed('crossover_bridges', mergeGeometries(bridges), dark, [0, 0, 0]));

  // docking ports on the docking ring's outer face, between the bridges
  const ports = [];
  for (let k = 0; k < 12; k++) {
    const g = lean(new CylinderGeometry(7, 8, 14, 12));
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, 672);
    g.rotateY((15 + k * 30) * DEG);
    ports.push(g);
  }
  station.add(placed('docking_ports', mergeGeometries(ports), dark, [0, 0, 0]));

  // the pylons: lofted along the centre line, tapering to the tip
  for (const side of [1, -1]) {
    for (let k = 0; k < 3; k++) {
      const { out, across } = frame(k * 120);
      const rings = [];
      const N = 18;
      let tip = new Vector3();
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const { at, dir } = bezier(DS9_PYLON, t);
        const centre = new Vector3().addScaledVector(out, at[0]).setY(side * at[1]);
        // in the pylon's plane, square to the centre line
        const n = new Vector3().addScaledVector(out, -dir[1]).setY(side * dir[0]).normalize();
        // thick where it leaves the ring, a claw at the tip
        const taper = 1 - 0.6 * t + 0.35 * Math.max(0, 1 - t * 6);
        rings.push(roundedRect(centre, across, 34 * taper, n, 24 * taper));
        tip = centre;
      }
      const name = `${side > 0 ? 'upper' : 'lower'}_pylon_${k + 1}`;
      station.add(placed(name, loft(rings), hull, tip.toArray()));
    }
  }
  return station;
}

// Earth Spacedock -------------------------------------------------------------
//
// The Federation's orbital station over Earth from Star Trek III: The Search
// for Spock (1984) onward, about 3810 m across and 5795 m tall: a domed cap
// (the space doors at its top open into the bay inside), rows of windows round
// the cap's rim, and a long stem below with a docking ring and a base.
//
// Parts: space_doors (their middle, the top of the station), cap (the front of
// its rim, +z), windows, stem (where it leaves the cap), docking_ring (its
// front, +z), docking_ports, panels, base (the bottom tip).

const SPACEDOCK = {
  cap: [
    [0, 1450], [300, 1440], [700, 1380], [1100, 1260], [1450, 1060], [1700, 800], [1850, 520],
    [1905, 300], [1905, 180], [1850, 60], [1650, -80], [1300, -200], [900, -300], [600, -380], [420, -480]
  ],
  stem: [
    [420, -480], [360, -650], [330, -1000], [330, -1400], [400, -1470]
  ],
  docking_ring: [[400, -1470], [520, -1530], [540, -1590], [520, -1650], [400, -1710]],
  base: [
    [400, -1710], [320, -1780], [300, -2300], [300, -2900], [380, -3000], [460, -3200], [460, -3500],
    [360, -3700], [200, -3950], [80, -4200], [0, -4345]
  ]
};

function spacedock() {
  const hull = new MeshStandardMaterial({ name: 'hull', color: 0xa8adb2, roughness: 0.65, metalness: 0.25 });
  const panel = new MeshStandardMaterial({ name: 'panel', color: 0x7e848b, roughness: 0.7, metalness: 0.3 });
  const windows = new MeshStandardMaterial({ name: 'windows', color: 0xfff0c8, emissive: 0xffe0a0, emissiveIntensity: 1.3, roughness: 0.5 });

  const station = new Group();
  station.name = 'earth_spacedock';
  const s = SPACEDOCK;
  station.add(
    placed('cap', latheY(s.cap, 96), hull, [0, 240, 1905]),
    placed('stem', latheY(s.stem, 64), panel, [0, -480, 0]),
    placed('docking_ring', latheY(s.docking_ring, 64), hull, [0, -1590, 540]),
    placed('base', latheY(s.base, 64), panel, [0, -4345, 0])
  );

  // the space doors: two leaves meeting across the top, a seam between them
  const leaves = [];
  for (const side of [-1, 1]) {
    const g = lean(new CylinderGeometry(440, 440, 24, 48, 1, false, side > 0 ? 0 : Math.PI, Math.PI));
    g.translate(side * 8, 1446, 0);
    leaves.push(g);
  }
  station.add(placed('space_doors', mergeGeometries(leaves), panel, [0, 1458, 0]));

  // window rows round the cap's rim and the docking ring
  const rows = [];
  for (const y of [200, 250, 300, 350]) rows.push(ringY([[1905, y - 6], [1912, y - 6], [1912, y + 6], [1905, y + 6]], 96));
  for (const y of [-1560, -1620]) rows.push(ringY([[538, y - 6], [546, y - 6], [546, y + 6], [538, y + 6]], 64));
  station.add(placed('windows', mergeGeometries(rows), windows, [0, 0, 0]));

  // raised panel bands: rings of latitude on the dome, segment joints on the stem
  const bands = [];
  for (const [r, y] of [[700, 1380], [1100, 1260], [1450, 1060], [1700, 800]]) {
    bands.push(ringY([[r - 30, y - 20], [r + 14, y - 8], [r + 10, y + 12], [r - 30, y + 20]], 96));
  }
  for (const y of [-1000, -2300, -2900]) bands.push(ringY([[290, y - 30], [350, y - 30], [350, y + 30], [290, y + 30]], 48));
  station.add(placed('panels', mergeGeometries(bands), panel, [0, 0, 0]));

  // docking ports round the docking ring
  const ports = [];
  for (let k = 0; k < 8; k++) {
    const g = lean(new CylinderGeometry(40, 48, 80, 12));
    g.rotateX(Math.PI / 2);
    g.translate(0, -1590, 560);
    g.rotateY((22.5 + k * 45) * DEG);
    ports.push(g);
  }
  station.add(placed('docking_ports', mergeGeometries(ports), panel, [0, 0, 0]));
  return station;
}

// Utopia Planitia drydock -------------------------------------------------------
//
// A drydock of the Utopia Planitia Fleet Yards over Mars, where the
// Enterprise-D (Galaxy class, 642 m) was built: an open frame of ribs round a
// berth, joined by long spars and cross braces, with work lights at the
// joints. About 760 m long, 560 m wide and 240 m tall; the bow end toward +z.
// The yards are many drydocks: place several.
//
// Parts: frame (the ribs, spars and braces), lights, berth (its middle, where
// a ship sits), bow (the front end's middle, +z), stern (the back end's
// middle).

/** A square beam from a to b */
function beam(a, b, w) {
  const dir = new Vector3().subVectors(b, a);
  const g = lean(new BoxGeometry(w, w, dir.length() + w));
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), dir.normalize());
  g.applyQuaternion(q);
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

/** A rib's corners in x, y: an octagon, flat on top and bottom */
const DRYDOCK_RIB = [[-280, -40], [-230, -120], [230, -120], [280, -40], [280, 40], [230, 120], [-230, 120], [-280, 40]];
const DRYDOCK_RIBS = [-380, -253, -127, 0, 127, 253, 380];

function utopiaPlanitiaDrydock() {
  const frameMat = new MeshStandardMaterial({ name: 'frame', color: 0xb4b8bc, roughness: 0.6, metalness: 0.4 });
  const lightMat = new MeshStandardMaterial({ name: 'lights', color: 0xffffff, emissive: 0xfff4d8, emissiveIntensity: 2, roughness: 0.4 });
  const dock = new Group();
  dock.name = 'utopia_planitia_drydock';
  const at = (c, z) => new Vector3(c[0], c[1], z);
  const beams = [];
  const lights = [];
  const n = DRYDOCK_RIB.length;
  for (const z of DRYDOCK_RIBS) {
    for (let i = 0; i < n; i++) beams.push(beam(at(DRYDOCK_RIB[i], z), at(DRYDOCK_RIB[(i + 1) % n], z), 9));
    for (const c of DRYDOCK_RIB) {
      const g = lean(new BoxGeometry(7, 7, 7));
      g.translate(c[0] * 1.03, c[1] * 1.06, z);
      lights.push(g);
    }
  }
  // spars along the corners, end to end
  const ends = [DRYDOCK_RIBS[0], DRYDOCK_RIBS[DRYDOCK_RIBS.length - 1]];
  for (const c of DRYDOCK_RIB) beams.push(beam(at(c, ends[0]), at(c, ends[1]), 6));
  // cross braces on the sides and the top, between neighbouring ribs
  for (let k = 0; k < DRYDOCK_RIBS.length - 1; k++) {
    const [z0, z1] = [DRYDOCK_RIBS[k], DRYDOCK_RIBS[k + 1]];
    for (const [i, j] of [[3, 4], [7, 0], [5, 6]]) {
      beams.push(beam(at(DRYDOCK_RIB[i], z0), at(DRYDOCK_RIB[j], z1), 4));
      beams.push(beam(at(DRYDOCK_RIB[j], z0), at(DRYDOCK_RIB[i], z1), 4));
    }
  }
  dock.add(placed('frame', mergeGeometries(beams), frameMat, [0, 0, 0]));
  dock.add(placed('lights', mergeGeometries(lights), lightMat, [0, 0, 0]));
  for (const [name, z] of [['berth', 0], ['bow', ends[1]], ['stern', ends[0]]]) {
    const o = new Group();
    o.name = name;
    o.position.set(0, 0, z);
    dock.add(o);
  }
  return dock;
}

// Build -----------------------------------------------------------------------

export const STARBASES = {
  deep_space_nine: { out: 'deep-space-nine.glb', build: deepSpaceNine },
  earth_spacedock: { out: 'earth-spacedock.glb', build: spacedock },
  utopia_planitia_drydock: { out: 'utopia-planitia-drydock.glb', build: utopiaPlanitiaDrydock }
};

async function main() {
  const keys = process.argv.slice(2);
  for (const key of keys.length ? keys : Object.keys(STARBASES)) {
    const s = STARBASES[key];
    if (!s) throw new Error(`unknown starbase '${key}' (${Object.keys(STARBASES).join(', ')})`);
    const scene = new Scene();
    scene.name = 'Scene';
    scene.add(s.build());
    scene.updateMatrixWorld(true);
    const glb = Buffer.from(await exportGlb(scene));
    mkdirSync(OUT, { recursive: true });
    writeFileSync(resolve(OUT, s.out), glb);
    console.log(`${s.out}: ${(glb.length / 1024).toFixed(1)} KB, ${triangles(scene)} triangles`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
