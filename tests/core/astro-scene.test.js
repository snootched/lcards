/**
 * Astrometrics scene build, headless (no renderer): the three design
 * references (tests/core/fixtures/astro-references.yaml) build every object,
 * generated points (ring and axis labels) come before the user's, cell
 * placements land in their cells, objects placed on points follow them,
 * the sky paths split at the horizon, and dispose frees every geometry and
 * material. Also: the background grid and the mesh grid share one GLSL
 * line chunk.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { GRID_LINES_GLSL } = await import('../../src/core/packs/backgrounds/webgl/scenes/grid-lines-glsl.js');
const gridScene = await import('../../src/core/packs/backgrounds/webgl/scenes/grid.js');
const { gridFace } = await import('../../src/core/astrometrics/grid-mesh-material.js');
const { axisSpec, cellFill, cellHash } = await import('../../src/core/astrometrics/objects/grid.js');
const { planeGeometry } = await import('../../src/core/astrometrics/surface.js');

const refs = /** @type {any} */ (yaml.load(readFileSync(new URL('./fixtures/astro-references.yaml', import.meta.url), 'utf8')));

const SKY = {
  sun: { azimuth: 135, altitude: 30, source: 'computed' },
  moon: { azimuth: 250, altitude: -10, distance: 380000, fraction: 0.4, waxing: true, illumination: 40 },
  location: { latitude: 43.65, longitude: -79.38 },
  time: Date.UTC(2026, 5, 21, 16, 0)
};

/** A build context without a theme: every colour a fixed orange */
function ctx() {
  return {
    color: () => [1, 0.6, 0.4, 1],
    places: null,
    sky: () => /** @type {any} */ (SKY),
    requestFrame: () => {},
    loadTexture: () => null
  };
}

test('galaxy reference: every object builds, ring labels are generated, the planet sits on its point', () => {
  const w = buildScene(refs.galaxy, /** @type {any} */ (ctx()));
  assert.deepEqual(w.list.map((b) => b.type).sort(), ['beam', 'beam', 'glow', 'grid', 'path', 'path', 'ring', 'ring', 'ring', 'ring', 'sphere', 'volume', 'volume']);
  // the core glow sits on the core point, facing the camera
  const glow = w.list.find((b) => b.type === 'glow');
  assert.ok(glow && glow.node.getWorldPosition(new (/** @type {any} */ (w.places.get('core'))).constructor()).length() < 1e-6);
  assert.equal(/** @type {any} */ (glow.node.children[0]).isSprite, true);
  assert.ok(w.stars, 'backdrop stars');
  assert.equal(w.pointDefs.filter((p) => String(p.id).includes('.ring.')).length, 36, 'ring labels every 10 degrees');
  const labelIds = w.labels.map((l) => l.id);
  assert.ok(labelIds.includes('core') && labelIds.includes('grid#1.ring.90'));
  const core = w.labels.find((l) => l.id === 'core');
  assert.equal(core?.style, 'title');
  assert.equal(core?.priority, 100);
  assert.equal(w.labels.find((l) => l.id === 'talos')?.pickable, true);
  // the planet object is placed on the nimbus point
  const nimbus = w.places.get('nimbus');
  const planet = w.objects.get('planet');
  assert.ok(nimbus && planet);
  const pos = planet.node.getWorldPosition(new (nimbus.constructor)());
  assert.ok(pos.distanceTo(nimbus) < 1e-6);
  assert.equal(planet.occludes, true);
  // a point on the planet is a radius (plus alt) from its centre, and spins with it
  const away = w.places.get('away');
  assert.ok(away && Math.abs(away.distanceTo(nimbus) - 7.3) < 1e-6);
  assert.equal(w.places.isDynamic('away'), true);
  planet.node.rotation.y += 1;
  w.layout();
  const moved = w.places.get('away');
  assert.ok(moved && moved.distanceTo(away) > 1, 'follows the spin after a layout pass');
  // routes are filled from their points
  const route = w.list.find((b) => b.type === 'path');
  assert.ok(route?.lines[0].object.visible);
  assert.equal(route?.lines.length, 1);
  const glowing = w.list.filter((b) => b.type === 'path')[1];
  assert.equal(glowing?.lines.length, 2, 'glow adds a line under the path');
  // a ring round a point is centred on it
  const orbit = w.list.find((b) => b.type === 'ring' && b.config.at === 'nimbus');
  assert.ok(orbit && orbit.node.getWorldPosition(new (nimbus.constructor)()).distanceTo(nimbus) < 1e-6);
  // the volume is tappable (its faces are pick meshes) and has a middle
  const fed = w.objects.get('federation_space');
  assert.ok(fed && fed.pickMeshes.length >= 6 && fed.centre);
  assert.ok(w.bounds.radius > 90 && w.bounds.radius < 200);
  w.dispose();
});

test('sector map reference: axis labels, filled cells, cell placements in their cells', () => {
  const w = buildScene(refs.sector, /** @type {any} */ (ctx()));
  const grid = w.objects.get('sectors');
  assert.ok(grid?.cellPoint);
  // 1200 x 600 at 40: 30 columns AD..BG, 15 rows 1..15
  const cols = w.pointDefs.filter((p) => String(p.id).startsWith('sectors.col.'));
  const rows = w.pointDefs.filter((p) => String(p.id).startsWith('sectors.row.'));
  assert.equal(cols.length, 30);
  assert.equal(rows.length, 15);
  assert.equal(cols[0].label, 'AD');
  assert.equal(cols[29].label, 'BG');
  assert.equal(rows[0].label, '01', 'zero-padded by default');
  assert.equal(rows[14].label, '15');
  // AG4: column 3 from AD, row 4 -> index 3: centre of that cell from the north-west corner
  const ufp = w.places.get('ufp');
  assert.ok(ufp);
  assert.equal(ufp.x, -600 + 3.5 * 40);
  assert.equal(ufp.z, -300 + 3.5 * 40);
  const sb10 = w.places.get('sb10');
  assert.ok(sb10);
  assert.equal(sb10.x, -600 + 6.5 * 40 + 8);
  assert.equal(sb10.z, -300 + 1.5 * 40 + 12);
  assert.equal(grid.cellPoint('ZZ99'), null);
  // three filled ranges, one quad per cell, shaded per cell
  const fills = /** @type {any[]} */ (grid.node.children.filter((c) => /** @type {any} */ (c).material?.isMeshBasicMaterial));
  assert.equal(fills.length, 3);
  assert.equal(fills[0].geometry.getAttribute('position').count, 3 * 4 * 4, 'AF3 to AH6: 3 x 4 cells');
  const shades = new Set();
  const colors = fills[0].geometry.getAttribute('color');
  for (let i = 0; i < colors.count; i += 4) shades.add(colors.getX(i).toFixed(4));
  assert.ok(shades.size >= 8, `cells vary in shade (${shades.size} distinct)`);
  // borders: the first and third ranges (plus the map outline)
  const borders = grid.lines.length - 1;
  assert.equal(borders, 2);
  assert.equal(w.labels.find((l) => l.id === 'qualor')?.maxDistance, 1300);
  w.dispose();
});

test('sky reference: sun and moon on the dome, tracks split at the horizon, compass points', () => {
  const w = buildScene(refs.sky, /** @type {any} */ (ctx()));
  const sun = w.places.get('sun');
  assert.ok(sun);
  // azimuth 135 (south-east), altitude 30 on radius 100
  const c = 100 * Math.cos(Math.PI / 6);
  assert.ok(Math.abs(sun.x - c * Math.sin((135 * Math.PI) / 180)) < 1e-6);
  assert.ok(Math.abs(sun.y - 50) < 1e-6);
  assert.ok(Math.abs(sun.z + c * Math.cos((135 * Math.PI) / 180)) < 1e-6);
  const n = w.places.get('north');
  assert.ok(n && Math.abs(n.z + 100) < 1e-6, 'N is north (-z), on the horizon ring');
  const tracks = w.list.filter((b) => b.type === 'path');
  assert.equal(tracks.length, 2);
  // the sun's June track at Toronto: one run above the horizon, from about NE to NW
  const segs = /** @type {any} */ (tracks[0].lines[0])._segs;
  assert.ok(segs.count > 100);
  assert.equal([...segs.starts].filter(Boolean).length, 1);
  assert.equal(tracks[0].dynamic, true);
  assert.equal(w.labels.find((l) => l.id === 'moon')?.marker, 'moon_phase');
  w.dispose();
});

test('axis labels: numbers zero-padded to the widest (at least 2), pad sets or turns it off', () => {
  const a = axisSpec({}, 30, 15);
  assert.deepEqual([a.colLabel(0), a.rowLabel(0), a.rowLabel(14)], ['A', '01', '15']);
  assert.equal(axisSpec({ row_start: 1 }, 1, 120).rowLabel(0), '001');
  assert.equal(axisSpec({ pad: 0 }, 1, 15).rowLabel(0), '1');
  assert.equal(axisSpec({ pad: 4 }, 1, 15).rowLabel(2), '0003');
  const flipped = axisSpec({ columns: 'numbers', rows: 'letters' }, 12, 5);
  assert.deepEqual([flipped.colLabel(0), flipped.rowLabel(1)], ['01', 'B']);
  // padded codes parse like plain ones
  assert.deepEqual(a.parse('C03'), a.parse('C3'));
});

test('cell shade: the same cell always gets the same shade; shade 0 is flat', () => {
  assert.equal(cellHash(3, 4), cellHash(3, 4));
  assert.notEqual(cellHash(3, 4), cellHash(4, 3));
  assert.notEqual(cellHash(3, 4, 1), cellHash(3, 4, 0));
  const flat = cellFill(0, 2, 0, 2, { s: 10, x0: 0, z0: 0, color: [0.5, 0.5, 0.5, 1], shade: 0, seed: 0 });
  const c = flat.geometry.getAttribute('color');
  for (let i = 1; i < c.count; i++) assert.equal(c.getX(i), c.getX(0));
  flat.geometry.dispose();
});

test('dispose frees every geometry and material', () => {
  const w = buildScene(refs.galaxy, /** @type {any} */ (ctx()));
  let geometries = 0;
  let freed = 0;
  w.scene.traverse((o) => {
    const g = /** @type {any} */ (o).geometry;
    if (!g) return;
    geometries++;
    g.addEventListener('dispose', () => freed++);
  });
  assert.ok(geometries > 20);
  w.dispose();
  assert.ok(freed >= geometries, `${freed} of ${geometries}`);
  assert.equal(w.scene.children.length, 0);
});

test('unknown types and bad configs are skipped, not thrown', () => {
  const w = buildScene({ objects: [{ type: 'nebula' }, null, { type: 'grid', shape: 'teapot' }, { type: 'path', points: ['nope', 'nada'] }], points: [{ id: 'a', at: 'a', label: 'A' }] }, /** @type {any} */ (ctx()));
  assert.deepEqual(w.list.map((b) => b.type), ['grid', 'path']);
  assert.equal(w.list[1].lines[0].object.visible, false);
  assert.equal(w.places.get('a'), null);
  w.dispose();
});

test('one GLSL line chunk: the background grid and the mesh grid both include it', () => {
  assert.match(GRID_LINES_GLSL, /void drawHit\(/);
  assert.match(GRID_LINES_GLSL, /float derivLen\(/);
  const bg = gridScene.createScene({ params: {}, colors: {} });
  assert.ok(bg.material.fragmentShader.includes(GRID_LINES_GLSL));
  assert.ok(bg.material.fragmentShader.includes('struct Hit'));
  const face = gridFace(planeGeometry(10, 10), { cell: [1, 1] });
  const mat = /** @type {any} */ (face.children[0]).material;
  assert.ok(mat.fragmentShader.includes(GRID_LINES_GLSL));
  // both draws share one set of uniforms (recolour in place)
  assert.equal(/** @type {any} */ (face.children[1]).material.uniforms.uColor, mat.uniforms.uColor);
  bg.dispose();
});

test('backdrop stars take the starfield preset key names: sizes, opacity range, colour list', () => {
  const colours = /** @type {Record<string, number[]>} */ ({ red: [1, 0, 0, 1], blue: [0, 0, 1, 1] });
  const c = { ...ctx(), color: (/** @type {string} */ v) => colours[v] ?? [1, 1, 1, 1] };
  const w = buildScene({ backdrop: { stars: { count: 400, min_radius: 0.5, max_radius: 2.5, min_opacity: 0.2, max_opacity: 0.6, colors: ['red', 'blue'] } } }, /** @type {any} */ (c));
  const mesh = /** @type {any} */ (w.stars?.node.children[0]);
  assert.equal(mesh.geometry.instanceCount, 400, 'one quad per star');
  const sizes = mesh.geometry.getAttribute('iSize');
  const col = mesh.geometry.getAttribute('iColor');
  assert.equal(col.itemSize, 4);
  let red = 0;
  for (let i = 0; i < 400; i++) {
    const d = sizes.getX(i);
    assert.ok(d >= 1 - 1e-6 && d <= 5 + 1e-6, `diameter ${d} within 2 x the radius range`);
    const a = col.getW(i);
    assert.ok(a >= 0.2 - 1e-6 && a <= 0.6 + 1e-6, `alpha ${a} in range`);
    if (col.getX(i) > 0.5) red++;
  }
  assert.ok(red > 120 && red < 280, `both colours used (${red} red of 400)`);
  assert.equal(typeof w.stars?.field?.setTail, 'function');
  w.dispose();
});
