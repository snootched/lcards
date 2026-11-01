/**
 * Astrometrics starters (src/core/astrometrics/starters/): every starter, with
 * its defaults and as a prefixed part beside a scene, passes the config
 * checker with no issues; applyStarter prefixes a part's own ids and the
 * references to them (not references to the card's points), replaces or
 * merges scenes, and refuses id clashes by name.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';
import { createConfigValidator } from '../../scripts/lib/config-validator.js';
import { STARTERS, applyStarter, prefixFragment, parsePointParam, starterParams, hasScene, unitsClash, targetUnits } from '../../src/core/astrometrics/starters/index.js';

const registries = await buildRegistries();
const checker = createConfigValidator({ entries: getSchemaEntries(), registries });
const TYPE = 'custom:lcards-astrometrics-card';
const issues = (config) => checker.validateConfig(config).map((i) => `${i.severity} ${i.code} ${i.path}: ${i.message}`);
const byId = (id) => STARTERS.find((s) => s.id === id);

test('starters are well formed: unique ids, parts take a prefix', () => {
  assert.equal(new Set(STARTERS.map((s) => s.id)).size, STARTERS.length);
  for (const s of STARTERS) {
    assert.ok(s.title && s.description && s.icon, s.id);
    assert.ok(['scene', 'part'].includes(s.kind), s.id);
    if (s.kind === 'part') assert.ok(s.params.some((p) => p.key === 'prefix'), `${s.id} has no prefix param`);
  }
  assert.ok(STARTERS.filter((s) => s.kind === 'scene').length >= 6);
  assert.ok(STARTERS.filter((s) => s.kind === 'part').length >= 4);
});

test('every scene starter validates with no issues', () => {
  for (const s of STARTERS.filter((x) => x.kind === 'scene')) {
    const out = applyStarter({ type: TYPE, height: 400 }, s);
    assert.ok(out.config, `${s.id}: ${out.error}`);
    assert.deepEqual(issues(out.config), [], s.id);
  }
});

test('every part validates on its own, round a card point, and twice with two prefixes', () => {
  for (const s of STARTERS.filter((x) => x.kind === 'part')) {
    const alone = applyStarter({ type: TYPE }, s);
    assert.ok(alone.config, `${s.id}: ${alone.error}`);
    assert.deepEqual(issues(alone.config), [], `${s.id} alone`);
    const scene = /** @type {any} */ (applyStarter({ type: TYPE }, byId('solar_system'))).config;
    const params = Object.fromEntries(s.params.filter((p) => p.type === 'point').map((p) => [p.key, 'sun']));
    const one = /** @type {any} */ (applyStarter(scene, s, { ...params, prefix: 'a' })).config;
    const two = applyStarter(one, s, { ...params, prefix: 'b' });
    assert.ok(two.config, `${s.id}: ${two.error}`);
    assert.deepEqual(issues(two.config), [], `${s.id} twice round sun`);
  }
});

test('prefixing: own ids and references to them; card points stay', () => {
  const frag = prefixFragment({
    points: [{ id: 'body', polar: [40, 0], object: 'orbit', tap_action: { action: 'fly-to', view: 'close' } }],
    objects: [
      { type: 'ring', id: 'orbit', at: 'sun' },
      { type: 'sphere', at: 'body' },
      { type: 'path', points: ['body', 'sun'] }
    ],
    views: { close: { target: 'body' } }
  }, 'mars');
  assert.deepEqual(frag.points?.[0], { id: 'mars_body', polar: [40, 0], object: 'mars_orbit', tap_action: { action: 'fly-to', view: 'mars_close' } });
  assert.deepEqual(frag.objects?.map((o) => o.at ?? o.points), ['sun', 'mars_body', ['mars_body', 'sun']]);
  assert.equal(frag.objects?.[0].id, 'mars_orbit');
  assert.deepEqual(frag.views, { mars_close: { target: 'mars_body' } });
});

test('scenes replace (card keys kept) or merge; parts add; clashes are refused by name', () => {
  const card = { type: TYPE, id: 'astro', height: 300, points: [{ id: 'sun', xyz: [0, 0, 0] }], labels: { snap: true } };
  assert.equal(hasScene(card), true);
  assert.equal(hasScene({ type: TYPE }), false);
  const replaced = /** @type {any} */ (applyStarter(card, byId('sector_map'))).config;
  assert.equal(replaced.id, 'astro');
  assert.equal(replaced.height, 300);
  assert.equal(replaced.labels, undefined);
  assert.ok(!replaced.points.some((p) => p.id === 'sun'));
  assert.equal(replaced.camera.view, 'map');

  const merged = /** @type {any} */ (applyStarter({ ...card, camera: { view: 'mine', views: { mine: {} } } }, byId('sector_map'), {}, { mode: 'merge' })).config;
  assert.equal(merged.points[0].id, 'sun');
  assert.equal(merged.camera.view, 'mine', 'a merged scene keeps the card\'s camera keys');
  assert.deepEqual(Object.keys(merged.camera.views), ['mine', 'map']);

  const clash = applyStarter(card, byId('solar_system'), {}, { mode: 'merge' });
  assert.match(String(clash.error), /^Already in this card: point sun\. Replace the scene, or rename them first\.$/);
  const part = applyStarter(card, byId('planet'), { prefix: 'mars', centre: 'sun' });
  const again = applyStarter(/** @type {any} */ (part).config, byId('planet'), { prefix: 'mars' });
  assert.match(String(again.error), /^Already in this card: point mars_body, .*Choose another prefix\.$/);
});

test('true-scale scenes: units come with them, merging across units is refused, ids inside a system clash too', () => {
  const card = { type: TYPE, units: 'au', points: [{ id: 'home', xyz: [0, 0, 0] }] };
  const replaced = /** @type {any} */ (applyStarter(card, byId('true_scale_dive'))).config;
  assert.equal(replaced.units, 'ly');
  assert.equal(replaced.objects.find((o) => o.type === 'system').units, 'km');
  assert.match(String(applyStarter(card, byId('true_scale_solar_system'), {}, { mode: 'merge' }).error), /in km and the card is in au/);
  // an empty card takes the units on a merge
  assert.equal(/** @type {any} */ (applyStarter({ type: TYPE }, byId('true_scale_solar_system'), {}, { mode: 'merge' })).config.units, 'km');
  // a card point named like one inside the dive's system
  const clash = applyStarter({ type: TYPE, units: 'ly', points: [{ id: 'earth', xyz: [0, 0, 0] }] }, byId('true_scale_dive'), {}, { mode: 'merge' });
  assert.match(String(clash.error), /point earth/);
  // the faked scenes leave the card's units alone
  assert.equal(/** @type {any} */ (applyStarter(card, byId('sector_map'))).config.units, undefined);
});

test('params: defaults fill blanks; a point param is an id or three numbers', () => {
  assert.equal(starterParams(byId('planet'), { prefix: '', moons: 3 }).prefix, 'planet');
  assert.equal(starterParams(byId('planet'), { moons: 3 }).moons, 3);
  assert.deepEqual(parsePointParam('10, 0, -5'), [10, 0, -5]);
  assert.deepEqual(parsePointParam('[1 2 3]'), [1, 2, 3]);
  assert.equal(parsePointParam(' sun '), 'sun');
  const moons = /** @type {any} */ (applyStarter({ type: TYPE }, byId('planet'), { moons: 4 })).config;
  assert.deepEqual(moons.points.map((p) => p.id), ['planet_centre', 'planet_body', 'planet_moon1', 'planet_moon2', 'planet_moon3', 'planet_moon4']);
});

test('unitsClash names a starter\'s units when a scene in other units is there; a part can replace the scene', () => {
  const minor = byId('st_minor_powers');
  const card = { type: TYPE, points: [{ id: 'a', xyz: [0, 0, 0] }] };
  assert.equal(minor.scene, 'star_trek_galaxy');
  assert.equal(unitsClash(card, minor), 'ly');
  assert.equal(unitsClash({ ...card, units: 'ly' }, minor), null);
  assert.equal(unitsClash({ type: TYPE }, minor), null, 'an empty card takes any units');
  assert.equal(unitsClash(card, byId('planet')), null, 'a part without units fits any scene');
  assert.match(String(applyStarter(card, minor).error), /^This part is in ly and the card is in scene units/);
  // replace: the part on its own, in its units
  const alone = /** @type {any} */ (applyStarter(card, minor, {}, { mode: 'replace' })).config;
  assert.equal(alone.units, 'ly');
  assert.ok(!alone.points.some((p) => p.id === 'a'));
  // the scene it is made for, then the part: validates
  const host = /** @type {any} */ (applyStarter(card, byId(minor.scene))).config;
  const both = /** @type {any} */ (applyStarter(host, minor)).config;
  assert.deepEqual(issues(both), []);
  for (const s of STARTERS.filter((x) => x.scene)) assert.ok(byId(s.scene)?.kind === 'scene', `${s.id}: scene ${s.scene}`);
});

// UX1 P5: parts into an open system, at real sizes in its units
const SYS = (extra = {}) => ({
  type: TYPE,
  units: 'ly',
  points: [{ id: 'sol', xyz: [0, 0, 0] }],
  objects: [{ type: 'grid', id: 'map', shape: 'disc', radius: 50 }, { type: 'system', id: 'sys', at: 'sol', units: 'km', objects: [{ type: 'sphere', id: 'sun', radius: 696000 }], ...extra }]
});

test('a part goes into a system: its lists, ids card-wide, views on the card', () => {
  const out = applyStarter(SYS(), byId('starbase'), {}, { system: 1 });
  assert.ok(out.config, out.error);
  const sys = out.config.objects[1];
  assert.equal(out.config.objects.length, 2, 'nothing added to the scene');
  assert.ok(sys.objects.some((o) => o.id === 'starbase_station'));
  // at its real size in km: no size, the file's own metres set it (UX1 P6c)
  assert.equal(sys.objects.find((o) => o.id === 'starbase_station').size, undefined);
  assert.ok(sys.points.some((p) => p.id === 'starbase_name'));
  assert.ok(out.config.camera.views.starbase_view);
  assert.equal(out.config.units, 'ly');
  assert.deepEqual(issues(out.config), []);
  // ids are card-wide: the same part again clashes, in the scene too
  const again = applyStarter(out.config, byId('starbase'), {}, {});
  assert.match(String(again.error), /starbase_station/);
});

test('a part in a system is sized in its units (real sizes); a unit-less scene keeps its numbers', () => {
  const km = applyStarter(SYS(), byId('planet'), {}, { system: 1 });
  assert.ok(km.config, km.error);
  const ring = km.config.objects[1].objects.find((o) => o.id === 'planet_orbit');
  const globe = km.config.objects[1].objects.find((o) => o.id === 'planet_globe');
  assert.equal(ring.radius, 1.5e8);
  assert.equal(globe.radius, 6370);
  // a typed size that is not the real one stays
  const big = applyStarter(SYS(), byId('starbase'), { size: 20 }, { system: 1 });
  assert.equal(big.config.objects[1].objects.find((o) => o.id === 'starbase_station').size, 20);
  assert.equal(applyStarter({ type: TYPE }, byId('starbase')).config.objects.find((o) => o.id === 'starbase_station').size, 60);
  const plain = applyStarter({ type: TYPE }, byId('planet'));
  assert.equal(plain.config.objects.find((o) => o.id === 'planet_orbit').radius, 40);
  assert.equal(plain.config.objects.find((o) => o.id === 'planet_globe').radius, 3);
  // a typed size wins
  const typed = applyStarter(SYS(), byId('planet'), { radius: 3390 }, { system: 1 });
  assert.equal(typed.config.objects[1].objects.find((o) => o.id === 'planet_globe').radius, 3390);
  // a model's real size, and the scene's own named units
  const ds = starterParams(byId('starbase'), { model: 'earth_spacedock' }, 'km');
  assert.equal(ds.size, 5.48);
  assert.equal(starterParams(byId('starbase'), {}, 'km').size, 1.45);
  assert.equal(starterParams(byId('planet'), {}, 'au').orbit, 1);
  assert.equal(targetUnits(SYS(), 1), 'km');
  assert.equal(targetUnits(SYS({ units: undefined }), 1), 'ly');
  assert.equal(targetUnits(SYS({ units: undefined, scale: 0.01 }), 1), null);
  // every unit-less part validates in a km system and an au one
  for (const id of ['planet', 'asteroid_belt', 'nebula_field', 'sector_volumes', 'starbase']) {
    for (const units of ['km', 'au']) {
      const out = applyStarter(SYS({ units }), byId(id), {}, { system: 1 });
      assert.ok(out.config, `${id} in ${units}: ${out.error}`);
      assert.deepEqual(issues(out.config), [], `${id} in ${units}`);
    }
  }
});

test('units clash with the system, not the scene; an empty system takes the part\'s units', () => {
  const ly = byId('st_minor_powers');
  assert.equal(unitsClash(SYS(), ly, {}, 1), 'ly', 'a km system');
  assert.equal(unitsClash(SYS(), ly), null, 'the ly scene');
  assert.match(String(applyStarter(SYS(), ly, {}, { system: 1 }).error), /this system is in km/);
  const empty = SYS({ objects: undefined, units: undefined, scale: 0.5 });
  const out = applyStarter(empty, byId('st_transwarp'), {}, { system: 1 });
  assert.ok(out.config, out.error);
  assert.equal(out.config.objects[1].units, 'ly');
  assert.equal(out.config.objects[1].scale, undefined);
  // only parts go into a system, and only added
  assert.match(String(applyStarter(SYS(), byId('galaxy'), {}, { system: 1 }).error), /Only a part/);
  assert.match(String(applyStarter(SYS(), byId('planet'), {}, { system: 1, mode: 'replace' }).error), /Only a part/);
  assert.match(String(applyStarter(SYS(), byId('planet'), {}, { system: 0 }).error), /not a system/);
});
