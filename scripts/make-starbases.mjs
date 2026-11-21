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
import { lean, latheY, ringY, loft, part, exportGlb, triangles, placed, frame, bezier, roundedRect } from './lib/model-kit.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'src/assets/models');
const DEG = Math.PI / 180;

// Deep Space 9 (Terok Nor) ------------------------------------------------------
//
// The Cardassian ore-processing station of Deep Space Nine (1993-1999), at its
// published sizes: 1452 m across the docking ring, the docking pylons 969 m
// tip to tip, the core 369 m from Ops to the fusion exhaust cone. From the
// axis out: the core (Ops, 59 m across, on its stepped upper core; the
// Promenade disc, 286 m; the lower core, 184 m, down to the fusion reactor),
// the habitat ring (579 m) with three weapon sail towers standing 192 m tall
// through it, the docking ring; three wide crossover bridges from the core
// through the habitat ring to the docking ring, flaring where they meet it, and
// three thin spokes between them, core to habitat ring; on each flare an upper
// and a lower docking pylon, rising from a broad root in gentle arcs and
// turning inward at the tips.
//
// Parts: ops (the Ops module), upper_core, promenade (its front window, +z),
// lower_core (its tip, the bottom of the core), sail_towers (the first one's
// top), spokes, habitat_ring and docking_ring (their front faces, +z),
// crossover_bridges, docking_ports, upper_pylon_1..3 and lower_pylon_1..3
// (their tips; pylon 1 at the front, then clockwise seen from above, 120
// degrees apart, over the bridges).

/** The core's outline, [radius, y], top to bottom; split into its parts below */
const DS9_CORE = {
  ops: [[0, 182], [2, 182], [2, 172], [10, 170], [22, 166], [30, 158], [30, 150], [24, 144], [18, 140]],
  upper_core: [[18, 140], [22, 128], [36, 122], [44, 108], [62, 100], [72, 86], [96, 74], [104, 60], [124, 50], [132, 38], [143, 30]],
  promenade: [[143, 30], [143, -14], [136, -26]],
  lower_core: [
    [136, -26], [100, -36], [91, -46], [91, -80], [70, -92], [66, -110], [80, -120], [92, -128], [92, -142],
    [78, -152], [56, -166], [40, -180], [24, -194], [0, -199]
  ]
};
const DS9_HABITAT = [[226, -30], [272, -30], [290, -14], [290, 14], [272, 30], [226, 30], [218, 0]];
const DS9_DOCKING = [[648, -20], [704, -20], [726, -7], [726, 7], [704, 20], [648, 20], [640, 0]];
/** An upper pylon's centre line in its plane, [radius, y]: from inside the ring, up in a gentle arc, the tip turning in */
const DS9_PYLON = [[676, -14], [745, 210], [570, 410], [390, 476]];
/** The bridges (and the pylons on them), degrees from +z */
const DS9_BRIDGES = [0, 120, 240];
/** The sail towers, between the bridges: degrees from +z, radius, half height */
const DS9_SAILS = { at: [60, 180, 300], r: 282, half: 96 };

function deepSpaceNine() {
  const hull = new MeshStandardMaterial({ name: 'hull', color: 0x9a9080, roughness: 0.7, metalness: 0.25 });
  const dark = new MeshStandardMaterial({ name: 'structure', color: 0x6e665a, roughness: 0.75, metalness: 0.3 });
  const windows = new MeshStandardMaterial({ name: 'windows', color: 0xffc070, emissive: 0xff9a40, emissiveIntensity: 1.4, roughness: 0.5 });

  const station = new Group();
  station.name = 'deep_space_nine';
  const c = DS9_CORE;
  station.add(
    placed('ops', latheY(c.ops, 48), hull, [0, 158, 0]),
    placed('upper_core', latheY(c.upper_core, 48), dark, [0, 86, 0]),
    placed('promenade', latheY(c.promenade, 64), hull, [0, 0, 143]),
    placed('lower_core', latheY(c.lower_core, 48), dark, [0, -199, 0]),
    placed('habitat_ring', ringY(DS9_HABITAT, 96), hull, [0, 0, 290]),
    placed('docking_ring', ringY(DS9_DOCKING, 128), hull, [0, 0, 726])
  );

  // window bands: the Promenade, the habitat ring and the Ops module
  const bands = mergeGeometries([
    ringY([[142.5, -5], [144, -5], [144, 5], [142.5, 5]], 64),
    ringY([[290, -9], [291.5, -9], [291.5, -4], [290, -4]], 96),
    ringY([[290, 4], [291.5, 4], [291.5, 9], [290, 9]], 96),
    ringY([[29.4, 151], [30.6, 151], [30.6, 155], [29.4, 155]], 48)
  ]);
  station.add(placed('windows', bands, windows, [0, 0, 0]));

  // three thin spokes from the Promenade to the habitat ring, between the
  // bridges, flaring where they meet the ring
  const spokes = [];
  for (let k = 0; k < 3; k++) {
    const { out, across } = frame(60 + k * 120);
    const rings = [];
    for (let i = 0; i <= 10; i++) {
      const r = 136 + (230 - 136) * (i / 10);
      const f = Math.max(0, (r - 185) / (230 - 185)) ** 2;
      rings.push(roundedRect(new Vector3().addScaledVector(out, r), across, 7 + 26 * f, new Vector3(0, 1, 0), 6 + 12 * f, 12));
    }
    spokes.push(loft(rings));
  }
  station.add(placed('spokes', mergeGeometries(spokes), dark, [0, 0, 0]));

  // three crossover bridges, the core through the habitat ring to the
  // docking ring, flaring wide where they meet it (the pylons stand on the flares)
  const bridges = [];
  for (const a of DS9_BRIDGES) {
    const { out, across } = frame(a);
    const rings = [];
    for (let i = 0; i <= 20; i++) {
      const r = 136 + (668 - 136) * (i / 20);
      const f = Math.max(0, (r - 420) / (668 - 420)) ** 2;
      const centre = new Vector3().addScaledVector(out, r);
      rings.push(roundedRect(centre, across, 34 + 220 * f, new Vector3(0, 1, 0), 14 + 20 * f));
    }
    bridges.push(loft(rings));
  }
  station.add(placed('crossover_bridges', mergeGeometries(bridges), dark, [0, 0, 0]));

  // docking ports: blocks on the docking ring's outer face, clear of the flares
  const ports = [];
  for (let k = 0; k < 18; k++) {
    const a = 10 + k * 20;
    if (DS9_BRIDGES.some((b) => Math.abs(((a - b + 540) % 360) - 180) < 15)) continue;
    const g = lean(new BoxGeometry(46, 24, 16));
    g.translate(0, 0, 718);
    g.rotateY(a * DEG);
    ports.push(g);
  }
  station.add(placed('docking_ports', mergeGeometries(ports), dark, [0, 0, 0]));

  // the weapon sail towers: fins standing through the habitat ring, mirrored
  // above and below it, tapering and leaning out toward their tips
  const sails = [];
  const s = DS9_SAILS;
  for (const a of s.at) {
    const { out, across } = frame(a);
    for (const side of [1, -1]) {
      const rings = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const centre = new Vector3().addScaledVector(out, s.r + 22 * t * t).setY(side * s.half * t);
        rings.push(roundedRect(centre, out, 30 * (1 - 0.85 * t), across, 7 * (1 - 0.6 * t), 8));
      }
      sails.push(loft(rings));
    }
  }
  const first = frame(s.at[0]).out.multiplyScalar(s.r + 22).setY(s.half);
  station.add(placed('sail_towers', mergeGeometries(sails), hull, first.toArray()));

  // the pylons: lofted along the centre line from inside the ring (so upper
  // and lower meet in it, flush); at the root two tapering webs, one flaring
  // inward along the bridge, one both ways along the docking ring (a lens
  // section, thinning to its edges), then a thinner arm to the tip
  for (const side of [1, -1]) {
    DS9_BRIDGES.forEach((a, k) => {
      const { out, across } = frame(a);
      const rings = [];
      const web = [];
      const N = 24;
      let tip = new Vector3();
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const { at, dir } = bezier(DS9_PYLON, t);
        // in the pylon's plane, square to the centre line, pointing in toward
        // the axis; level at the root, so the root lies flat in the ring
        const level = Math.min(1, t / 0.15);
        const n = new Vector3().addScaledVector(out, -dir[1]).setY(side * dir[0] * level).normalize();
        const root = 90 * Math.max(0, 1 - t / 0.28) ** 2;
        const line = new Vector3().addScaledVector(out, at[0]).setY(side * at[1]);
        const centre = line.clone().addScaledVector(n, 0.75 * root);
        rings.push(roundedRect(centre, across, 22 * (1 - 0.45 * t) + 0.3 * root, n, 30 * (1 - 0.5 * t) + root));
        if (t <= 0.3) web.push(roundedRect(line, across, 20 * (1 - t / 0.3) + 1.3 * root, n, 12 + 0.12 * root, 24, 1));
        tip = centre;
      }
      const name = `${side > 0 ? 'upper' : 'lower'}_pylon_${k + 1}`;
      station.add(placed(name, mergeGeometries([loft(rings), loft(web)]), hull, tip.toArray()));
    });
  }
  return station;
}

// Earth Spacedock -------------------------------------------------------------
//
// The Federation's orbital station over Earth from Star Trek III: The Search
// for Spock (1984) onward, 3800 m across and about 5480 m tall, after the
// side elevation of the Starfleet data sheet. Top to bottom: antenna spires
// on the administration section; the cap, a tall cone up from a deep rim,
// with the four large space doors in it (ships fly in through them to the
// bay inside); the underdish (the deflector grid), an inverted cone glowing
// blue under the cap; the neck (hangar bays); the hull, a mushroom-shaped
// section with energy accumulators under its flat underside; the stem in two
// steps; the base sphere; the communication towers hanging under it.
//
// Parts: antennas (their base, the top of the station), cap (the front of its
// rim, +z), space_doors (the front door, +z), underdish, neck, hull (its front
// face, +z), stem (where it leaves the hull), base (the sphere's bottom),
// towers (their tips, the bottom of the station), windows, panels.

const SPACEDOCK = {
  admin: [[0, 2321], [80, 2300], [140, 2250], [150, 2215], [489, 2210], [489, 2119]],
  cap: [[489, 2119], [1900, 1679], [1900, 1597], [1826, 1548], [1565, 1538]],
  underdish: [[1565, 1538], [1540, 1520], [522, 1141]],
  neck: [[522, 1141], [509, 1130], [509, 795], [490, 788]],
  hull: [
    [490, 788], [600, 750], [800, 690], [920, 600], [985, 470], [1000, 342], [1000, 228], [985, 150], [950, 130],
    [489, 130], [440, 40], [428, -33]
  ],
  stem: [[428, -33], [427, -60], [427, -848], [456, -860], [456, -920], [400, -935], [342, -962], [342, -1350]]
};
/** The base sphere: centre height and radius, the stem joining it at its top */
const SPACEDOCK_BASE = { y: -1744, r: 522 };
/** The cap's top cone (rim to the administration section) and the doors in it */
const SPACEDOCK_CONE = { r0: 489, y0: 2119, r1: 1900, y1: 1679 };
const SPACEDOCK_DOORS = { r: 1150, wide: 700, long: 440 };

/** A thin cone from y0 to y1: a spire */
function spire(x, z, r, y0, y1) {
  const g = lean(new CylinderGeometry(r * 0.15, r, Math.abs(y1 - y0), 8));
  if (y1 < y0) g.rotateX(Math.PI);
  g.translate(x, (y0 + y1) / 2, z);
  return g;
}

/** A box lying on the cap's top cone at radius r, turned to bearing a (degrees), raised `lift` */
function onCone(geo, r, a, lift) {
  const c = SPACEDOCK_CONE;
  const slope = (c.y0 - c.y1) / (c.r1 - c.r0);
  geo.rotateX(Math.atan(slope));
  geo.translate(0, c.y0 - slope * (r - c.r0) + lift, r);
  geo.rotateY(a * DEG);
  return geo;
}

function spacedock() {
  const hull = new MeshStandardMaterial({ name: 'hull', color: 0xa8adb2, roughness: 0.65, metalness: 0.25 });
  const panel = new MeshStandardMaterial({ name: 'panel', color: 0x7e848b, roughness: 0.7, metalness: 0.3 });
  const glow = new MeshStandardMaterial({ name: 'underdish', color: 0x9aa8b4, emissive: 0x3a7cb8, emissiveIntensity: 0.35, roughness: 0.6 });
  const doors = new MeshStandardMaterial({ name: 'doors', color: 0xa8dcff, emissive: 0x5aa8e0, emissiveIntensity: 0.9, roughness: 0.5 });
  const windows = new MeshStandardMaterial({ name: 'windows', color: 0xfff0c8, emissive: 0xffe0a0, emissiveIntensity: 1.3, roughness: 0.5 });

  const station = new Group();
  station.name = 'earth_spacedock';
  const s = SPACEDOCK;
  const b = SPACEDOCK_BASE;
  // the sphere from where the stem meets it round to its bottom
  const top = Math.acos((s.stem[s.stem.length - 1][1] - b.y) / b.r);
  const sphere = [];
  for (let i = 0; i <= 24; i++) {
    const a = top + (Math.PI - top) * (i / 24);
    sphere.push([b.r * Math.sin(a), b.y + b.r * Math.cos(a)]);
  }
  station.add(
    placed('cap', latheY([...s.admin, ...s.cap.slice(1)], 96), hull, [0, 1638, 1900]),
    placed('underdish', latheY(s.underdish, 96), glow, [0, 1340, 1040]),
    placed('neck', latheY(s.neck, 64), panel, [0, 960, 509]),
    placed('hull', latheY(s.hull, 96), hull, [0, 285, 1000]),
    placed('stem', latheY(s.stem, 64), panel, [0, -33, 0]),
    placed('base', latheY(sphere, 64), hull, [0, b.y - b.r, 0])
  );

  // antenna spires on the administration section; communication towers,
  // a cylinder ending in a spire, hanging under the base
  const spires = [];
  [[0, 0, 30, 2738], [150, 40, 22, 2560], [-120, 90, 20, 2480], [60, -150, 24, 2640], [-140, -80, 18, 2440],
    [300, -60, 16, 2400], [-40, 300, 16, 2420], [-320, 40, 14, 2380]].forEach(([x, z, r, y1]) => spires.push(spire(x, z, r, 2200, y1)));
  station.add(placed('antennas', mergeGeometries(spires), panel, [0, 2321, 0]));
  const towers = [];
  for (const [x, z] of [[0, 0], [150, 0], [-75, 130], [-75, -130]]) {
    const g = lean(new CylinderGeometry(36, 30, 320, 12));
    g.translate(x, b.y - b.r - 140, z);
    towers.push(g, spire(x, z, 22, b.y - b.r - 300, -2738 + (x ? 80 : 0)));
  }
  station.add(placed('towers', mergeGeometries(towers), panel, [0, -2738, 0]));

  // the space doors: four large lit openings in the cap's top cone, each in a
  // raised frame (ships fly in through them)
  const d = SPACEDOCK_DOORS;
  const leaves = [];
  const frames = [];
  for (let k = 0; k < 4; k++) {
    leaves.push(onCone(lean(new BoxGeometry(d.wide, 16, d.long)), d.r, k * 90, 8));
    for (const [w, l, x, z] of [[d.wide + 80, 40, 0, d.long / 2 + 20], [d.wide + 80, 40, 0, -d.long / 2 - 20], [40, d.long, d.wide / 2 + 20, 0], [40, d.long, -d.wide / 2 - 20, 0]]) {
      const g = lean(new BoxGeometry(w, 30, l));
      g.translate(x, 0, z);
      frames.push(onCone(g, d.r, k * 90, 12));
    }
  }
  const c = SPACEDOCK_CONE;
  const doorY = c.y0 - ((c.y0 - c.y1) / (c.r1 - c.r0)) * (d.r - c.r0) + 40;
  station.add(placed('space_doors', mergeGeometries(leaves), doors, [0, doorY, d.r]));

  // window rows round the hull's sides, the neck, the stem and the sphere
  const rows = [];
  for (const y of [260, 300, 340]) rows.push(ringY([[996, y - 7], [1006, y - 7], [1006, y + 7], [996, y + 7]], 96));
  for (const y of [900, 1000, 1080]) rows.push(ringY([[506, y - 7], [515, y - 7], [515, y + 7], [506, y + 7]], 64));
  for (const y of [-200, -400, -600, -1050, -1250]) {
    const r = y > -900 ? 427 : 342;
    rows.push(ringY([[r - 3, y - 7], [r + 6, y - 7], [r + 6, y + 7], [r - 3, y + 7]], 64));
  }
  rows.push(ringY([[b.r - 4, b.y - 14], [b.r + 6, b.y - 14], [b.r + 6, b.y + 14], [b.r - 4, b.y + 14]], 64));
  station.add(placed('windows', mergeGeometries(rows), windows, [0, 0, 0]));

  // raised panels: the door frames, rings round the cap's top cone, the
  // energy accumulators under the hull, joints on the stem
  const bands = [...frames];
  for (const r of [700, 1650]) {
    const y = c.y0 - ((c.y0 - c.y1) / (c.r1 - c.r0)) * (r - c.r0);
    bands.push(ringY([[r - 30, y - 18], [r + 30, y - 4], [r + 30, y + 12], [r - 30, y + 18]], 96));
  }
  for (let k = 0; k < 8; k++) {
    const g = lean(new CylinderGeometry(150, 100, 100, 4));
    g.rotateY(Math.PI / 4);
    g.translate(0, 80, 700);
    g.rotateY((22.5 + k * 45) * DEG);
    bands.push(g);
  }
  for (const y of [-500, -1150]) {
    const r = y > -900 ? 427 : 342;
    bands.push(ringY([[r - 10, y - 30], [r + 18, y - 30], [r + 18, y + 30], [r - 10, y + 30]], 48));
  }
  station.add(placed('panels', mergeGeometries(bands), panel, [0, 0, 0]));
  return station;
}

// Utopia Planitia drydock -------------------------------------------------------
//
// A drydock of the Utopia Planitia Fleet Yards over Mars, where the
// Enterprise-D (Galaxy class, 642 m) was built: a dark deck slab along the
// top, thirteen thin ribs hanging from it as rounded hoops round the berth,
// rails tying them end to end, a keel slab below, and the big work-light
// panels on the inside of the ribs, facing the ship. About 760 m long, 570 m
// wide and 330 m tall (deck to keel); the bow end toward +z. The yards are
// many drydocks: place several.
//
// Parts: frame (the ribs and rails), deck, keel, lights, berth (its middle,
// where a ship sits), bow (the front end's middle, +z), stern (the back
// end's middle).

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

/** A rib's hoop in x, y: a rounded rectangle (centre, half sizes, corner radius) */
const DRYDOCK_HOOP = { y: -10, w: 280, h: 135, r: 90 };
const DRYDOCK_RIBS = Array.from({ length: 13 }, (_, k) => -360 + k * 60);

/** Points round the hoop, counter-clockwise from the right side's middle */
function hoopPath(n = 64) {
  const { y, w, h, r } = DRYDOCK_HOOP;
  const corners = [[w - r, h - r, 0], [-(w - r), h - r, 90], [-(w - r), -(h - r), 180], [w - r, -(h - r), 270]];
  const pts = [];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= n / 4; i++) {
      const a = (a0 + 90 * (i / (n / 4))) * DEG;
      pts.push([cx + r * Math.cos(a), y + cy + r * Math.sin(a)]);
    }
  }
  return pts;
}

/** A round tube along a closed path in the x-y plane at z */
function hoop(path, z, radius, sides = 8) {
  const rings = [];
  const m = path.length;
  for (let i = 0; i <= m; i++) {
    const p = path[i % m];
    const q = path[(i + 1) % m];
    const o = path[(i - 1 + m) % m];
    const t = new Vector3(q[0] - o[0], q[1] - o[1], 0).normalize();
    const nrm = new Vector3(t.y, -t.x, 0);
    const ring = [];
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2;
      ring.push(new Vector3(p[0], p[1], z).addScaledVector(nrm, radius * Math.cos(a)).add(new Vector3(0, 0, radius * Math.sin(a))));
    }
    rings.push(ring);
  }
  return loft(rings);
}

/** A flat light panel: centre, size along the hoop, across (z), turned `tilt` degrees about z */
function panelAt(x, y, z, along, across, tilt) {
  const g = lean(new BoxGeometry(3, along, across));
  g.rotateZ(tilt * DEG);
  g.translate(x, y, z);
  return g;
}

function utopiaPlanitiaDrydock() {
  const frameMat = new MeshStandardMaterial({ name: 'frame', color: 0x9a9ea4, roughness: 0.6, metalness: 0.45 });
  const deckMat = new MeshStandardMaterial({ name: 'deck', color: 0x4c5056, roughness: 0.75, metalness: 0.35 });
  const lightMat = new MeshStandardMaterial({ name: 'lights', color: 0xffffff, emissive: 0xf4f0e8, emissiveIntensity: 2, roughness: 0.4 });
  const dock = new Group();
  dock.name = 'utopia_planitia_drydock';
  const { y: hy, w, h } = DRYDOCK_HOOP;
  const ends = [DRYDOCK_RIBS[0], DRYDOCK_RIBS[DRYDOCK_RIBS.length - 1]];
  const length = ends[1] - ends[0] + 40;

  // ribs, and rails along the hoop's straight sides, end to end
  const path = hoopPath();
  const beams = DRYDOCK_RIBS.map((z) => hoop(path, z, 5));
  for (const [x, y] of [[w, hy + 70], [w, hy - 70], [-w, hy + 70], [-w, hy - 70], [150, hy - h], [-150, hy - h]]) {
    beams.push(beam(new Vector3(x, y, ends[0]), new Vector3(x, y, ends[1]), 5));
  }
  dock.add(placed('frame', mergeGeometries(beams), frameMat, [0, 0, 0]));

  // the deck slab along the top, with blocks on it; the keel slab below
  const deck = [lean(new BoxGeometry(2 * w - 120, 34, length))];
  deck[0].translate(0, hy + h + 10, 0);
  for (const z of [-250, -90, 90, 250]) {
    const g = lean(new BoxGeometry(150, 16, 110));
    g.translate(0, hy + h + 35, z);
    deck.push(g);
  }
  dock.add(placed('deck', mergeGeometries(deck), deckMat, [0, hy + h + 27, 0]));
  const keel = lean(new BoxGeometry(170, 18, length - 60));
  keel.translate(0, hy - h - 12, 0);
  dock.add(placed('keel', keel, deckMat, [0, hy - h - 21, 0]));

  // work lights between neighbouring ribs, on the inside, facing the berth:
  // the sides (upper and lower), the bottom corners, and under the deck
  const lights = [];
  for (let k = 0; k < DRYDOCK_RIBS.length - 1; k++) {
    const z = (DRYDOCK_RIBS[k] + DRYDOCK_RIBS[k + 1]) / 2;
    for (const sx of [1, -1]) {
      lights.push(panelAt(sx * (w - 9), hy + 62, z, 80, 30, 0));
      lights.push(panelAt(sx * (w - 9), hy - 50, z, 70, 30, 0));
      lights.push(panelAt(sx * (w - 48), hy - h + 32, z, 60, 30, sx * 45));
      lights.push(panelAt(sx * 120, hy + h - 9, z, 80, 30, 90));
    }
  }
  dock.add(placed('lights', mergeGeometries(lights), lightMat, [0, 0, 0]));
  for (const [name, z] of [['berth', 0], ['bow', ends[1]], ['stern', ends[0]]]) {
    const o = new Group();
    o.name = name;
    o.position.set(0, hy, z);
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
