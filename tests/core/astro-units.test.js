/**
 * U1, units across the astrometrics starters: a part going into a scene
 * whose units have no name is sized to fit it (its `fit` sizes scaled so its
 * radius is the starter's share of the scene's); into named units it starts
 * at its real size (`real`, km); typed values always stay. Also the
 * config-only scene extent and the unit shown beside the Studio's number fields.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STARTERS, applyStarter, starterParams, fitFactor, FIT_SHARE } from '../../src/core/astrometrics/starters/index.js';
import { sceneExtent, objectReach } from '../../src/core/astrometrics/starters/extent.js';
import { unitSuffix } from '../../src/editor/dialogs/astro-studio/schema-fields.js';
import { starterParamValues, sceneUnitsText } from '../../src/editor/dialogs/astro-studio/starter-gallery.js';

const TYPE = 'custom:lcards-astrometrics-card';
const byId = (id) => STARTERS.find((s) => s.id === id);
const scene = (id) => applyStarter({ type: TYPE }, byId(id)).config;
const SOL = scene('solar_system');
const AU_KM = 149597870.7;
const LY_KM = 9.4607304725808e12;
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol * Math.abs(b);

test('scene extent: from the config alone; aim-only points and systems\' insides do not count', () => {
  // Neptune's orbit (160) plus its planet
  assert.ok(near(sceneExtent(SOL), 163, 0.01), String(sceneExtent(SOL)));
  assert.equal(sceneExtent({}), 0);
  assert.equal(sceneExtent({ points: [{ id: 'aim', xyz: [1000, 0, 0] }], objects: [{ type: 'glow', at: [0, 0, 0], size: 10 }] }), 5, 'a point nothing uses is only aimed at');
  assert.equal(sceneExtent({ points: [{ id: 'p', xyz: [30, 40, 0], label: 'P' }] }), 50);
  assert.equal(sceneExtent({ objects: [{ type: 'system', at: [10, 0, 0], units: 'km', objects: [{ type: 'sphere', radius: 1e6 }] }] }), 10);
  assert.equal(objectReach({ type: 'volume', radius: [30, 80] }), 80);
  assert.equal(objectReach({ type: 'nebula', size: [200, 50, 50] }), 100);
  // a point on a ring sits round the ring's place
  assert.equal(sceneExtent({ points: [{ id: 'c', xyz: [0, 0, 10] }, { id: 'p', polar: [20, 0], object: 'r', label: 'P' }], objects: [{ type: 'ring', id: 'r', at: 'c', radius: 20 }] }), 30);
});

test('a part into a scene without named units fits it: its radius is its share of the scene\'s', () => {
  for (const target of [SOL, scene('federation_map'), scene('borg_encounter')]) {
    const R = sceneExtent(target);
    for (const part of STARTERS.filter((s) => s.kind === 'part' && s.params.some((p) => p.fit))) {
      const params = starterParams(part, {}, null, target);
      const r = sceneExtent(part.build(params, { units: null }));
      assert.ok(near(r, (part.fitShare ?? FIT_SHARE) * R, 0.05), `${part.id}: ${r} in a scene of ${R}`);
    }
  }
});

test('the user\'s case: the Nexus into the Solar system is no longer 2000 long', () => {
  const out = applyStarter(SOL, byId('nexus'));
  const ribbon = out.config.objects.find((o) => o.id === 'nexus_ribbon');
  assert.equal(ribbon.size[0], starterParams(byId('nexus'), {}, null, SOL).length);
  assert.ok(ribbon.size[0] < 2 * sceneExtent(SOL), String(ribbon.size[0]));
  // the Studio's form shows the same numbers it puts in
  assert.equal(starterParamValues(byId('nexus'), {}, null, SOL).length, ribbon.size[0]);
});

test('no fit: typed values, an empty card, named units, parts made for one scene, scenes', () => {
  assert.equal(starterParams(byId('nexus'), { length: 500 }, null, SOL).length, 500);
  assert.equal(starterParams(byId('nexus'), {}, null, { type: TYPE }).length, 2000);
  assert.equal(fitFactor(byId('nexus'), { type: TYPE }), null);
  assert.equal(fitFactor(byId('nexus'), SOL, 'ly'), null);
  assert.equal(fitFactor(byId('st_minor_powers'), SOL), null);
  assert.equal(fitFactor(byId('solar_system'), SOL), null);
  // the starbase and the asteroid keep their sizes (a model has model_scale; a rock is small)
  assert.equal(fitFactor(byId('starbase'), SOL), null);
  assert.equal(fitFactor(byId('asteroid'), SOL), null);
  // fitting reads the other params as typed: the Nexus on its orbit is wider
  assert.ok(starterParams(byId('nexus'), { travel: 'orbit' }, null, SOL).length < starterParams(byId('nexus'), {}, null, SOL).length);
});

test('real sizes in named units: Nexus 1 ly, Badlands 10 ly, wormhole 40 km, comet 0.6 to 35 au', () => {
  const st = scene('star_trek_galaxy');
  assert.equal(starterParams(byId('nexus'), {}, 'ly', st).length, 1);
  assert.equal(starterParams(byId('badlands'), {}, 'ly', st).width, 10);
  assert.equal(starterParams(byId('badlands_voyager'), {}, 'ly').width, 10);
  assert.equal(starterParams(byId('wormhole'), {}, 'km').size, 40);
  const comet = starterParams(byId('comet'), {}, 'au');
  assert.deepEqual([comet.near, comet.far], [0.6, 35]);
  assert.equal(starterParams(byId('comet'), {}, 'km').far, Number((35 * AU_KM).toPrecision(3)));
  assert.equal(starterParams(byId('nexus'), {}, 'km').length, Number(LY_KM.toPrecision(3)));
  // a planet into the true-scale Solar System: Earth's radius in km
  assert.equal(starterParams(byId('planet'), {}, 'km', scene('true_scale_solar_system')).radius, 6370);
  // every fitted size of a part has a real size too (parts made for one scene are in its units)
  for (const part of STARTERS.filter((s) => s.kind === 'part' && !s.scene)) {
    for (const p of part.params.filter((q) => q.fit)) assert.ok(p.real !== undefined, `${part.id}.${p.key} has no real size`);
  }
});

test('a comet in au: its far point stays beyond its near one, its nucleus, coma and tail follow its orbit', () => {
  const frag = byId('comet').build(starterParams(byId('comet'), {}, 'au'), { units: 'au' });
  const comet = frag.objects.find((o) => o.type === 'comet');
  assert.deepEqual(comet.activity.range, [0.6, 35]);
  const radius = (0.6 + 35) / 2;
  assert.ok(near(comet.tail.length, radius * 0.9, 0.01));
  assert.ok(comet.nucleus.size < comet.coma.size && comet.coma.size < comet.tail.length);
});

test('the unit beside a number field, from its description', () => {
  assert.equal(unitSuffix('Radius, scene units.', 'ly'), 'ly');
  assert.equal(unitSuffix('Radius, scene units.', ''), 'units');
  assert.equal(unitSuffix('How fast, scene units per second.', 'km'), 'km/s');
  assert.equal(unitSuffix('How fast the waves run, scene units a second.', ''), 'units/s');
  assert.equal(unitSuffix('Noise detail per scene unit: lower is larger.', 'km'), undefined);
  assert.equal(unitSuffix('Line width, px.', 'km'), 'px');
  assert.equal(unitSuffix('Move the dashes, px per second.', ''), 'px/s');
  assert.equal(unitSuffix('The real length in metres.', 'km'), 'm');
  assert.equal(unitSuffix('How many of the scene\'s units one unit inside the system is (a ratio).', ''), undefined);
  assert.equal(unitSuffix('Opacity, 0 to 1.', 'km'), undefined);
});

test('scene starters say their units', () => {
  assert.match(sceneUnitsText(byId('solar_system')), /scene units/);
  assert.match(sceneUnitsText(byId('star_trek_galaxy')), /light years/);
  assert.match(sceneUnitsText(byId('true_scale_solar_system')), /kilometres/);
});
