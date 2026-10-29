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
import { STARTERS, applyStarter, prefixFragment, parsePointParam, starterParams, hasScene } from '../../src/core/astrometrics/starters/index.js';

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
