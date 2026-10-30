/**
 * E10 Part 2, a star system inside a galaxy: named units and a system's
 * scale, flattening systems into the card's lists (ids card-wide), the frame
 * tree (conversion through the nearest common frame, picking the camera's
 * frame with hysteresis), placements in a system's units, the no-jump
 * number at a frame change (a station 26,000 ly out holds to well under a
 * pixel), the rig's re-base (keys and a running fly-to's ends), and the
 * config checker on systems.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { Vector3, PerspectiveCamera } = await import('three');
const { UNITS, systemScale, flattenSystems, usesModels } = await import('../../src/core/astrometrics/names.js');
const { Frames, ROOT, ENTER, LEAVE } = await import('../../src/core/astrometrics/frames.js');
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { CameraRig, cameraPose, lerpKeys } = await import('../../src/core/astrometrics/camera-rig.js');
const { getSchemaEntries } = await import('../../scripts/lib/card-schemas.js');
const { buildRegistries } = await import('../../scripts/lib/registries.js');
const { createConfigValidator } = await import('../../scripts/lib/config-validator.js');

const KM_PER_LY = UNITS.ly / UNITS.km;
const AU = 149597870.7;

function ctx() {
  return { color: () => [1, 1, 1, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null };
}

/** The dive's scene: Sol 26,000 ly from the core, Earth and DS9 in km */
const DIVE = {
  units: 'ly',
  points: [{ id: 'core', xyz: [0, 0, 0] }, { id: 'sol', polar: [26000, 200], alt: 60 }],
  objects: [
    { type: 'glow', id: 'core_glow', at: 'core', size: 30000 },
    {
      type: 'system', id: 'sol_system', at: 'sol', units: 'km',
      points: [
        { id: 'sun', xyz: [0, 0, 0] },
        { id: 'earth', polar: [AU, 30], max_distance: 3e9 },
        { id: 'ds9', at: 'earth', offset: [-21082, 0, 36515] }
      ],
      objects: [
        { type: 'sphere', id: 'earth_body', at: 'earth', radius: 6371 },
        { type: 'ring', id: 'earth_orbit', radius: AU },
        { type: 'path', id: 'route', from: 'ds9', to: 'earth' }
      ]
    }
  ]
};

test('a system\'s scale: its scale, else its units over the parent\'s', () => {
  assert.equal(systemScale({ units: 'km' }, 'ly'), UNITS.km / UNITS.ly);
  assert.equal(systemScale({ units: 'km', scale: 2 }, 'ly'), 2);
  assert.equal(systemScale({}, 'ly'), 1);
  assert.equal(systemScale({ units: 'km' }, undefined), null);
  assert.equal(systemScale({ units: 'furlong' }, 'ly'), null);
});

test('flattening lifts a system\'s points and objects into the card\'s lists, marked with the system', () => {
  const flat = /** @type {any} */ (flattenSystems(DIVE));
  assert.deepEqual(flat.points.map((p) => [p.id, p._system]), [['core', undefined], ['sol', undefined], ['sun', 'sol_system'], ['earth', 'sol_system'], ['ds9', 'sol_system']]);
  assert.deepEqual(flat.objects.map((o) => [o.id, o._system]), [['core_glow', undefined], ['sol_system', undefined], ['earth_body', 'sol_system'], ['earth_orbit', 'sol_system'], ['route', 'sol_system']]);
  assert.equal(flat.objects[1].points, undefined);
  // idempotent, and a config without systems comes back as it is
  assert.deepEqual(flattenSystems(flat), flat);
  const plain = { points: [], objects: [{ type: 'grid' }] };
  assert.equal(flattenSystems(plain), plain);
  // a model inside a system still loads the model chunk
  assert.equal(usesModels({ objects: [{ type: 'system', objects: [{ type: 'model', src: 'x' }] }] }), true);
});

test('frames: conversion through the nearest common frame, units per frame, groups placed from the current', () => {
  const f = new Frames();
  const sys = f.add('sys', ROOT, 1 / KM_PER_LY);
  sys.origin = [-8892.52, 60, 24432.01];
  const p = [AU, 0, 0];
  const inRoot = f.convert(p, 'sys', ROOT);
  assert.ok(Math.abs(inRoot[0] - (-8892.52 + AU / KM_PER_LY)) < 1e-9);
  assert.deepEqual(f.convert(p, 'sys', 'sys'), p);
  assert.ok(Math.abs(f.ratio(ROOT, 'sys') - KM_PER_LY) < 1);
  f.current = 'sys';
  f.place();
  // the current frame's group is identity
  assert.deepEqual(sys.node.position.toArray(), [0, 0, 0]);
  assert.equal(sys.node.scale.x, 1);
  assert.ok(Math.abs(f.get(ROOT).node.scale.x - KM_PER_LY) < 1);
  assert.equal(f.unit(ROOT), f.ratio(ROOT, 'sys'));
});

test('the camera\'s frame: inside ENTER times a system\'s radius, out past LEAVE', () => {
  const f = new Frames();
  const sys = f.add('sys', ROOT, 0.001);
  sys.origin = [1000, 0, 0];
  sys.radius = 100; // own units: 0.1 scene units
  assert.equal(f.pick([1000 + 0.1 * ENTER * 1.1, 0, 0]), ROOT);
  assert.equal(f.pick([1000 + 0.1 * ENTER * 0.9, 0, 0]), 'sys');
  f.current = 'sys';
  // now in the system's units: stays until past LEAVE
  assert.equal(f.pick([100 * (ENTER + LEAVE) / 2, 0, 0]), 'sys');
  assert.equal(f.pick([100 * LEAVE * 1.1, 0, 0]), ROOT);
});

test('a system builds in its units: points exact in its frame, objects in its group, its radius from its contents', () => {
  const w = buildScene(DIVE, /** @type {any} */ (ctx()));
  const f = w.frames;
  assert.equal(f.current, ROOT);
  const sys = f.get('sol_system');
  // Sol at its galaxy point; the system's radius reaches past Earth's orbit
  const sol = /** @type {Vector3} */ (w.places.get('sol'));
  assert.ok(sol.distanceTo(new Vector3(...sys.origin)) < 1e-9);
  assert.ok(sys.radius >= AU && sys.radius < AU * 1.01, `${sys.radius}`);
  // the system's objects sit in its group
  const earth = /** @type {any} */ (w.objects.get('earth_body'));
  assert.equal(w.outer.get(earth)?.parent, sys.node);
  // in the system's frame, DS9 is exact in km (offset in km too)
  f.current = 'sol_system';
  f.place();
  w.scene.updateMatrixWorld(true);
  w.rebased();
  const e = /** @type {Vector3} */ (w.places.get('earth'));
  const ds9 = /** @type {Vector3} */ (w.places.get('ds9'));
  assert.ok(Math.abs(ds9.x - e.x - -21082) < 1e-6 && Math.abs(ds9.z - e.z - 36515) < 1e-6, `${ds9.x - e.x}, ${ds9.z - e.z}`);
  assert.ok(Math.abs(Math.hypot(e.x, e.z) - AU) < 1e-6);
  // the sphere follows Earth in the system's units
  const g = /** @type {any} */ (w.outer.get(earth));
  assert.ok(g.position.distanceTo(e) < 1e-6);
  // the path is drawn relative to its first point (DS9), local to its group
  const route = /** @type {any} */ (w.objects.get('route'));
  assert.ok(route.node.position.distanceTo(ds9) < 1e-6);
  w.dispose();
});

test('no jump at a frame change: Earth on screen from the system\'s edge in both frames, under a hundredth of a pixel apart', () => {
  const w = buildScene(DIVE, /** @type {any} */ (ctx()));
  const f = w.frames;
  const R = f.get('sol_system').radius;
  /** Earth's screen position (px of an 800 x 600 view), the camera where the frame changes, looking at the Sun */
  const screen = () => {
    f.place();
    w.scene.updateMatrixWorld(true);
    w.layout();
    const sun = /** @type {Vector3} */ (w.places.get('sun'));
    const earth = /** @type {Vector3} */ (w.places.get('earth'));
    const keys = { tx: sun.x, ty: sun.y, tz: sun.z, yaw: 40, tilt: 20, distance: R * ENTER * f.unit('sol_system'), fov: 40 };
    const pose = cameraPose(keys);
    const cam = new PerspectiveCamera(40, 800 / 600, keys.distance / 1000, keys.distance * 100);
    cam.rotation.order = 'YXZ';
    cam.position.set(...pose.position);
    cam.rotation.set(pose.rotation.x, pose.rotation.y, 0);
    cam.updateMatrixWorld();
    const p = earth.clone().project(cam);
    return [(p.x + 1) * 400, (1 - p.y) * 300];
  };
  const inGalaxy = screen();
  f.current = 'sol_system';
  const inSystem = screen();
  assert.ok(inSystem.every(Number.isFinite));
  assert.ok(Math.hypot(inSystem[0] - inGalaxy[0], inSystem[1] - inGalaxy[1]) < 0.01, `${inSystem} vs ${inGalaxy}`);
  w.dispose();
});

test('the rig re-bases its keys and a running fly-to\'s ends; the landing target can be read again', () => {
  const rig = new CameraRig();
  rig.limits = { tilt: [-90, 90], distance: [1e-20, 1e30], yaw: null, target: null };
  rig.set({ tx: 10, ty: 0, tz: 0, distance: 100 });
  rig.flyTo({ tx: 20, distance: 1 }, { duration: 1000 });
  rig.step(0);
  rig.step(500);
  const mid = { ...rig.keys };
  // to a frame 1000 times smaller, moved by 5
  rig.rebase((p) => [(p[0] - 5) * 1000, p[1] * 1000, p[2] * 1000], 1000, { tx: 15000.5, ty: 0, tz: 0 });
  assert.ok(Math.abs(rig.keys.tx - (mid.tx - 5) * 1000) < 1e-6);
  assert.ok(Math.abs(rig.keys.distance - mid.distance * 1000) < 1e-6);
  const fly = /** @type {any} */ (rig.fly);
  assert.ok(Math.abs(fly.from.tx - 5000) < 1e-9);
  assert.equal(fly.to.tx, 15000.5);
  assert.equal(fly.to.distance, 1000);
  rig.step(1000);
  assert.equal(rig.keys.tx, 15000.5);
  assert.equal(rig.keys.distance, 1000);
  assert.equal(rig.fly, null);
  // the short fly-to's keys: linear, exact at the end
  const a = { tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 0, distance: 10, fov: 40 };
  const b = { tx: 0.1, ty: 0.2, tz: 0.3, yaw: 10, tilt: 20, distance: 12, fov: 30 };
  assert.deepEqual(lerpKeys(a, b, 1), b);
  assert.equal(lerpKeys(a, b, 0.5).distance, 11);
});

test('the config checker: system units need the card\'s, no system in a system, references inside systems', async () => {
  const registries = await buildRegistries();
  const checker = createConfigValidator({ entries: getSchemaEntries(), registries });
  const issues = (/** @type {any} */ config) => checker.validateConfig({ type: 'custom:lcards-astrometrics-card', ...config }).map((i) => `${i.severity} ${i.code} ${i.path}: ${i.message}`);
  assert.deepEqual(issues(DIVE), []);
  const { units: _u, ...noUnits } = DIVE;
  assert.deepEqual(issues(noUnits), ['error reference objects[1].units: units: km needs the card\'s own units (units: ly at the top of the card), or give the system a scale']);
  const out = issues({ units: 'ly', objects: [{ type: 'system', id: 'a', units: 'km', points: [{ id: 'p', at: 'nowhere' }], objects: [{ type: 'system', id: 'b' }] }] });
  assert.ok(out.includes('error reference objects[0].points[0].at: no point "nowhere"'), out.join('\n'));
  assert.ok(out.includes('error reference objects[0].objects[0]: a system cannot hold another system (one level: "a" holds "b")'), out.join('\n'));
  // views and paths at the card level name points inside a system
  assert.deepEqual(issues({ ...DIVE, camera: { views: { s: { target: 'ds9', distance: 4 } } } }), []);
});

test('a path from one far system to another: exact at the end the camera is at, its arch in its own units', () => {
  const w = buildScene({
    units: 'ly',
    points: [{ id: 'a_sys', xyz: [-46, 0, 26024] }, { id: 'b_sys', xyz: [-37997, 1, -31996.5] }],
    objects: [
      { type: 'system', id: 'a', at: 'a_sys', units: 'km', points: [{ id: 'a_end', xyz: [32.3, 10.7, 49.4] }] },
      { type: 'system', id: 'b', at: 'b_sys', units: 'km', points: [{ id: 'b_end', xyz: [-17.1, -4.2, 33.9] }] },
      { type: 'path', id: 'link', points: ['a_end', 'b_end'], arc: 4000 }
    ]
  }, /** @type {any} */ (ctx()));
  const f = w.frames;
  const line = /** @type {any} */ (w.objects.get('link')).lines[0];
  /** the line's vertices in world space (current frame) */
  const verts = () => {
    w.scene.updateMatrixWorld(true);
    const abs = line._abs;
    const out = [];
    for (let i = 0; i + 2 < abs.length; i += 3) out.push(new Vector3(abs[i], abs[i + 1], abs[i + 2]).applyMatrix4(line.object.matrixWorld));
    return out;
  };
  for (const [frame, end, other] of [['b', 'b_end', 'a_end'], ['a', 'a_end', 'b_end']]) {
    f.current = frame;
    f.place();
    w.scene.updateMatrixWorld(true);
    w.rebased();
    const v = verts();
    const p = /** @type {Vector3} */ (w.places.get(end));
    const near = v.reduce((m, q) => (q.distanceTo(p) < m.distanceTo(p) ? q : m));
    // within a metre at a km scale, 38,000 ly from the galaxy's origin (a single number in ly holds only ~70 km there)
    assert.ok(near.distanceTo(p) < 1e-3, `${frame}: ${near.distanceTo(p)} km off`);
    // the arch is 4000 ly high in km, not 4000 km
    const q = /** @type {Vector3} */ (w.places.get(other));
    const mid = v[Math.floor(v.length / 2)];
    const chordMid = p.clone().add(q).multiplyScalar(0.5);
    assert.ok(Math.abs((mid.y - chordMid.y) / KM_PER_LY - 4000) < 50, `${frame}: arch ${(mid.y - chordMid.y) / KM_PER_LY} ly`);
  }
  w.dispose();
});
