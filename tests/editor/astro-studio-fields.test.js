/**
 * The Astrometrics Studio's schema-generated forms: every key of every object
 * type (and of the camera and scene tabs) gets a field, or is a declared YAML
 * fallback. A new key or type in the schema is covered automatically; a new
 * key that would land in YAML fails here until it is added to the list below
 * (or given a shape the form knows).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { objectSchema, astrometricsSchema } from '../../src/cards/schemas/astrometrics-schema.js';
import { OBJECT_TYPES, TYPE_GUIDE } from '../../src/core/astrometrics/names.js';
import { modelSizeReadout, fitToViewSize, roundLength, shortNumber } from '../../src/editor/dialogs/astro-studio/model-size.js';
import {
  fieldKind, objectBranch, scopeOf, appliesTo, tupleLabels, helperText, labelFor, withKey, parseNumbers, freshId, objectSummary, newObject, viewScale, reshape,
  choiceOptions, choiceValue, numberSelector, unitsLabel, groupOf, sectionIcon, OBJECT_GROUPS, COMMON_GROUPS, bindingBranch, isTour, isTemplateValue
} from '../../src/editor/dialogs/astro-studio/schema-fields.js';

/** Keys shown as their own YAML editor (with completion), by where they are */
const YAML_FALLBACK = {
  // outline: a prism's [x, z] points (an outline editor is for the Studio UX session)
  objects: ['tap_action', 'hold_action', 'animation', 'points', 'objects', 'outline'],
  camera: ['views'],
  scene: ['background_animation'],
  labels: ['styles']
};

test('every object key of every type has a field or is a declared YAML fallback', () => {
  for (const type of OBJECT_TYPES) {
    const parts = objectBranch(objectSchema, type);
    assert.ok(parts, `no branch for ${type}`);
    for (const [key, s] of Object.entries({ ...parts.common, ...parts.own })) {
      const kind = fieldKind(s, key);
      if (kind === 'yaml') assert.ok(YAML_FALLBACK.objects.includes(key), `${type}.${key} falls back to YAML`);
    }
  }
});

test('camera and scene keys have fields (views and styles are YAML)', () => {
  const cam = astrometricsSchema.properties.camera.properties;
  for (const [key, s] of Object.entries(cam)) {
    if (fieldKind(s, key) === 'yaml') assert.ok(YAML_FALLBACK.camera.includes(key), `camera.${key} falls back to YAML`);
  }
  for (const key of ['clock', 'time_scale', 'backdrop', 'labels', 'background_animation']) {
    const kind = fieldKind(astrometricsSchema.properties[key], key);
    if (kind === 'yaml') assert.ok(YAML_FALLBACK.scene.includes(key), `${key} falls back to YAML`);
  }
  for (const [key, s] of Object.entries(astrometricsSchema.properties.labels.properties)) {
    if (fieldKind(s, key) === 'yaml') assert.ok(YAML_FALLBACK.labels.includes(key), `labels.${key} falls back to YAML`);
  }
  assert.equal(fieldKind(astrometricsSchema.properties.backdrop.properties.stars, 'stars'), 'boolOrObject');
  assert.equal(fieldKind(cam.buttons, 'buttons'), 'boolOrObject');
  // the clock (R4a): an object of a date and a rate (live or days per second)
  const clock = astrometricsSchema.properties.clock;
  assert.equal(fieldKind(clock, 'clock'), 'object');
  assert.equal(fieldKind(clock.properties.rate, 'rate'), 'rate');
  assert.equal(fieldKind(clock.properties.date, 'date'), 'date');
});

test('choice fields (R4a): words plus true/false or numbers, committed with their type', () => {
  const rate = astrometricsSchema.properties.clock.properties.rate;
  assert.deepEqual(choiceOptions(rate), { words: ['live'], bool: false, number: true });
  assert.equal(choiceValue('live', choiceOptions(rate)), 'live');
  assert.equal(choiceValue('30', choiceOptions(rate)), 30);
  assert.equal(choiceValue('-1', choiceOptions(rate)), -1);
  assert.equal(choiceValue('', choiceOptions(rate)), undefined);
  const time = astrometricsSchema.properties.camera.properties.buttons.anyOf.find((b) => b.properties).properties.time;
  assert.equal(fieldKind(time, 'time'), 'choice');
  assert.deepEqual(choiceOptions(time), { words: ['speed', 'date', 'both'], bool: true, number: false });
  assert.equal(choiceValue('false', choiceOptions(time)), false);
  assert.equal(choiceValue('both', choiceOptions(time)), 'both');
  assert.equal(choiceOptions({ oneOf: [{ type: 'string' }, { type: 'number' }] }), null, 'no words: not a choice');
});

test('field kinds for the shapes the schema uses', () => {
  const grid = objectBranch(objectSchema, 'grid');
  const props = { ...grid.common, ...grid.own };
  assert.equal(fieldKind(props.at, 'at'), 'pointRef');
  assert.equal(fieldKind(props.rotation, 'rotation'), 'tuple');
  assert.equal(fieldKind(props.size, 'size'), 'numberOrTuple');
  assert.equal(fieldKind(props.radius, 'radius'), 'numberOrTuple');
  assert.equal(fieldKind(props.color, 'color'), 'color');
  // shapes are a picture picker (UX1 P5)
  assert.equal(fieldKind(props.shape, 'shape'), 'shape');
  for (const t of ['volume', 'image']) assert.equal(fieldKind(objectBranch(objectSchema, t).own.shape, 'shape'), 'shape', t);
  assert.equal(fieldKind(props.deform, 'deform'), 'objectList');
  assert.equal(fieldKind(props.fill_effect, 'fill_effect'), 'object');
  assert.equal(fieldKind(props.well_profile, 'well_profile'), 'numbers');
  assert.equal(fieldKind(props.tags, 'tags'), 'strings');
  assert.equal(fieldKind(props.tap_action, 'tap_action'), 'yaml');
  const path = objectBranch(objectSchema, 'path');
  assert.equal(fieldKind(path.own.points, 'points'), 'pointList');
  const ring = objectBranch(objectSchema, 'ring');
  assert.equal(fieldKind(ring.own.glow, 'glow'), 'boolOrNumber');
  assert.equal(fieldKind(ring.own.pulse, 'pulse'), 'boolOrObject');
});

test('scopes: keys for other shapes hide until set', () => {
  const grid = objectBranch(objectSchema, 'grid');
  const props = { ...grid.common, ...grid.own };
  assert.deepEqual(scopeOf(props.size.description, props), { key: 'shape', values: ['plane'] });
  // "disc: ...; dome, sphere, cylinder, well: ..." covers every segment
  assert.deepEqual(scopeOf(props.line_spacing_deg.description, props)?.values?.sort(), ['cylinder', 'disc', 'dome', 'sphere', 'well']);
  assert.deepEqual(scopeOf(props.hex_radius.description, props), { key: 'pattern', values: ['hexagonal'] });
  // plane is the default shape: size shows, radius does not
  assert.equal(appliesTo('size', props, {}), true);
  assert.equal(appliesTo('radius', props, {}), false);
  assert.equal(appliesTo('radius', props, { shape: 'disc' }), true);
  assert.equal(appliesTo('depth', props, { shape: 'disc' }), false);
  assert.equal(appliesTo('depth', props, { shape: 'disc', depth: 4 }), true, 'a set key always shows');
  // path: object, span and alt only with sky
  const path = objectBranch(objectSchema, 'path');
  const pp = { ...path.common, ...path.own };
  assert.equal(appliesTo('span', pp, {}), false);
  assert.equal(appliesTo('span', pp, { sky: 'sun' }), true);
  // a scope key with no value or default (fill_effect type) shows everything
  const fill = grid.own.fill_effect.properties;
  assert.equal(appliesTo('num_bands', fill, {}), true);
  assert.equal(appliesTo('num_bands', fill, { type: 'plasma' }), false);
  assert.equal(appliesTo('num_bands', fill, { type: 'contour' }), true);
});

test('labels, helpers and small helpers', () => {
  assert.deepEqual(tupleLabels('sector: inner and outer radius [r0, r1], scene units. Default [50, 100].', 2), ['r0', 'r1']);
  assert.deepEqual(tupleLabels('Turn the object [x, y, z] in degrees', 3), ['x', 'y', 'z']);
  assert.deepEqual(tupleLabels('No brackets', 2), ['1', '2']);
  assert.equal(labelFor('line_width_major'), 'Line width major');
  assert.equal(helperText('Line width, px. More words here. Default 1.'), 'Line width, px. Default 1.');
  assert.equal(helperText(''), '');
  assert.deepEqual(withKey({ a: 1, b: 2 }, 'b', undefined), { a: 1 });
  assert.deepEqual(withKey({ a: 1 }, 'b', []), { a: 1 });
  assert.deepEqual(withKey({ a: 1 }, 'b', 0), { a: 1, b: 0 });
  assert.deepEqual(parseNumbers('1, 0.4  0.2,'), [1, 0.4, 0.2]);
  assert.equal(parseNumbers(''), undefined);
  assert.equal(freshId('grid', ['grid1', 'grid2']), 'grid3');
  assert.equal(objectSummary({ type: 'grid', shape: 'disc', radius: 100 }), 'disc · 100');
});

test('a new object of every type is valid for its branch (required keys present)', () => {
  for (const type of OBJECT_TYPES) {
    const obj = newObject(type, [], ['a', 'b']);
    assert.equal(obj.type, type);
    assert.equal(obj.id, `${type}1`);
    const { branch } = objectBranch(objectSchema, type);
    for (const k of branch.required ?? []) assert.ok(obj[k] !== undefined, `${type} needs ${k}`);
  }
  assert.deepEqual(newObject('path', [], ['a', 'b']).points, ['a', 'b']);
  assert.equal(newObject('grid', ['grid1'], []).id, 'grid2');
});

test('a new object is sized to the view and placed where it looks', () => {
  // a default-sized scene is framed from about 280: no sizes written
  assert.equal(viewScale(280), 1);
  assert.equal(viewScale(120), 1);
  assert.equal(viewScale(840), 1);
  assert.equal(viewScale(40), 0.1);
  assert.equal(viewScale(2000), 5);
  assert.equal(viewScale(140000), 500);
  assert.equal(viewScale(0), 1);
  assert.deepEqual(newObject('grid', [], [], { scale: 1 }), { type: 'grid', id: 'grid1' });
  // a galaxy seen from 140,000 ly: a grid 100,000 across on the galactic core's scale
  const grid = newObject('grid', [], [], { scale: 500, at: 'sol' });
  assert.deepEqual(grid, { type: 'grid', id: 'grid1', at: 'sol', size: 100000, line_spacing: 5000 });
  assert.deepEqual(newObject('belt', [], [], { scale: 500 }).radius, [40000, 50000]);
  assert.equal(newObject('ring', [], [], { scale: 500 }).radius, 25000);
  // ends round a position, not `at`
  const beam = newObject('beam', [], [], { scale: 2, at: [10, 0, 0] });
  assert.deepEqual([beam.from, beam.to, beam.at], [[-90, 0, 0], [110, 0, 0], undefined]);
  for (const type of OBJECT_TYPES) {
    const obj = newObject(type, [], ['a', 'b'], { scale: 1000, at: [1, 2, 3] });
    const { branch } = objectBranch(objectSchema, type);
    for (const k of branch.required ?? []) assert.ok(obj[k] !== undefined, `${type} needs ${k}`);
  }
});

test('UX1 P6c: a new model where the scope has units is drawn at its real size (no size); the size panel reads the file', () => {
  assert.deepEqual(newObject('model', [], [], { scale: 500, real: true }), { type: 'model', id: 'model1', src: 'builtin:constitution' });
  assert.equal(newObject('model', [], [], { scale: 500 }).size, 25000);
  const ship = [127, 67.9, 289];
  const real = modelSizeReadout({ type: 'model', src: 'builtin:constitution' }, ship, 'km');
  assert.equal(real.mode, 'real');
  assert.equal(real.file, '127 x 67.9 x 289 m (largest 289 m)');
  assert.equal(real.real, '289 m = 0.289 km');
  assert.ok(Math.abs(/** @type {number} */ (real.realSize) - 0.289) < 1e-9);
  assert.equal(modelSizeReadout({ src: 'x' }, ship, 'm').real, '289 m');
  assert.equal(modelSizeReadout({ src: 'x', file_units: 'ft' }, [10, 5, 100], 'm').real, '100 ft = 30.5 m');
  assert.equal(modelSizeReadout({ src: 'x' }, ship, 'ly').real, '289 m = 3.05e-14 ly');
  const sized = modelSizeReadout({ src: 'x', size: 60 }, ship, 'km');
  assert.equal(sized.mode, 'size');
  assert.equal(sized.note, 'Drawn at size 60 km across.');
  const none = modelSizeReadout({ src: 'x' }, ship, '');
  assert.equal(none.mode, 'default');
  assert.equal(none.real, null);
  assert.match(none.note, /no units/);
  assert.equal(modelSizeReadout({ src: 'x' }, null, 'km').file, null);
  // length: the real length, whatever the file measures (an Odyssey download at 53.3 units)
  const odyssey = modelSizeReadout({ src: 'x', length: 1061, file_units: 'cm' }, [18.7, 7.43, 53.3], 'km');
  assert.equal(odyssey.mode, 'real');
  assert.equal(odyssey.file, '18.7 x 7.43 x 53.3 cm (largest 53.3 cm)');
  assert.equal(odyssey.real, '1,061 m = 1.06 km');
  assert.equal(odyssey.note, 'Drawn at its real length: 1,061 m = 1.06 km.');
  assert.ok(Math.abs(/** @type {number} */ (odyssey.realSize) - 1.061) < 1e-9);
  assert.equal(modelSizeReadout({ src: 'x', length: 1061 }, null, 'km').real, '1,061 m = 1.06 km', 'known before the file is in');
  assert.equal(modelSizeReadout({ src: 'x', length: 1061, size: 2 }, null, 'km').mode, 'size');
  assert.match(real.note, /Set Length \(m\)/);
  assert.equal(fitToViewSize(1000), 200);
  assert.equal(fitToViewSize(3.4), 0.5);
  assert.equal(roundLength(0.0072), 0.005);
  assert.equal(shortNumber(1234567), '1,230,000');
});

test('a new shape keeps the size: plane size to disc radius, sector radius to box size', () => {
  const plane = { type: 'grid', id: 'g', size: 100000, line_spacing: 5000 };
  assert.equal(reshape(plane, { ...plane, shape: 'disc' }).radius, 50000);
  const disc = { type: 'grid', id: 'g', shape: 'disc', radius: 50000 };
  const { shape, ...back } = disc;
  assert.equal(reshape(disc, back).size, 100000);
  const sector = { type: 'volume', id: 'v', radius: [25000, 50000] };
  assert.equal(reshape(sector, { ...sector, shape: 'box' }).size, 50000);
  // a size already set stays; the same shape is left alone
  assert.equal(reshape(plane, { ...plane, shape: 'disc', radius: 7 }).radius, 7);
  assert.equal(reshape(plane, plane), plane);
});

test('TYPE_GUIDE matches the objects page table and covers every type', () => {
  assert.deepEqual(TYPE_GUIDE.map((t) => t.type).sort(), [...OBJECT_TYPES].sort());
  const md = readFileSync(new URL('../../doc/cards/astrometrics/objects.md', import.meta.url), 'utf8');
  const rows = [...md.matchAll(/^\| (.+?) \| \[`(\w+)`\]\(#\w+\) \|$/gm)].map((m) => ({ use: m[1], type: m[2] }));
  assert.deepEqual(rows, TYPE_GUIDE.map((t) => ({ use: t.use, type: t.type })));
});

test('files are pickers: model src (models) and textures (images), from the schema annotation', () => {
  const props = (/** @type {string} */ type) => {
    const parts = objectBranch(objectSchema, type);
    return { ...parts?.common, ...parts?.own };
  };
  assert.equal(fieldKind(props('model').src, 'src'), 'asset');
  assert.equal(props('model').src.assetSource, 'model');
  for (const [type, key] of [['image', 'src'], ['sphere', 'image'], ['ring', 'image']]) {
    assert.equal(fieldKind(props(type)[key], key), 'asset', `${type}.${key}`);
    assert.equal(props(type)[key].assetSource, 'image', `${type}.${key}`);
  }
  // no other string key is a file
  for (const type of OBJECT_TYPES) {
    for (const [key, s] of Object.entries(props(type))) {
      if (fieldKind(s, key) === 'asset') assert.ok(['model.src', 'image.src', 'sphere.image', 'ring.image'].includes(`${type}.${key}`), `${type}.${key}`);
    }
  }
});

test('R4b: what an object follows, for its row and its sections (text and actions are not settings)', async () => {
  const { boundIn, keysBound } = await import('../../src/editor/dialogs/astro-studio/schema-fields.js');
  const wormhole = {
    type: 'grid', id: 'wormhole', shape: 'well', at: 'mouth', label: '{entity.state}',
    radius: { entity: 'input_number.lcards_test_power', to: [10, 50] },
    deform: [{ type: 'wobble', amplitude: "[[[ return 1 ]]]" }],
    tap_action: { action: 'more-info', entity: 'light.x' }
  };
  assert.deepEqual(boundIn(wormhole), ['input_number.lcards_test_power', 'a template']);
  assert.equal(keysBound({ opacity: { entity: 'input_number.x' } }, ['at', 'opacity']), true);
  assert.equal(keysBound({ spin: '[[[ return 2 ]]]' }, ['spin']), true);
  assert.equal(keysBound({ at: 'mouth', spin: 3 }, ['at', 'spin']), false);
  assert.match(objectSummary(wormhole), /follows input_number\.lcards_test_power, a template/);
  assert.doesNotMatch(objectSummary(wormhole), /object Object/);
});

test('UX1 P2: colour lists, fonts and the systems list get their own fields', () => {
  const nebula = objectBranch(objectSchema, 'nebula');
  assert.equal(fieldKind(nebula.own.colors, 'colors'), 'colorList');
  const stars = astrometricsSchema.properties.backdrop.properties.stars.oneOf.find((b) => b.properties);
  assert.equal(fieldKind(stars.properties.colors, 'colors'), 'colorList');
  const labels = astrometricsSchema.properties.labels.properties.default.properties;
  assert.equal(fieldKind(labels.font_family, 'font_family'), 'font');
  assert.equal(fieldKind({ type: 'string', 'x-ui-hints': { widget: 'font' } }, 'f'), 'font');
  const grid = objectBranch(objectSchema, 'grid');
  assert.equal(fieldKind(grid.common.hide_in_systems, 'hide_in_systems'), 'boolOrList');
});

test('UX1 P2: bounded numbers are sliders, others boxes; a hint wins', () => {
  const grid = objectBranch(objectSchema, 'grid');
  assert.deepEqual(numberSelector(grid.common.opacity), { number: { mode: 'slider', min: 0, max: 1, step: 'any' } });
  const galaxy = objectBranch(objectSchema, 'galaxy');
  assert.deepEqual(numberSelector(galaxy.own.arms), { number: { mode: 'slider', min: 1, max: 8, step: 1 } });
  assert.equal(numberSelector(grid.own.line_spacing).number.mode, 'box');
  const hinted = { type: 'number', minimum: 0, maximum: 1, 'x-ui-hints': { selector: { number: { mode: 'box', step: 0.1 } } } };
  assert.deepEqual(numberSelector(hinted), { number: { mode: 'box', step: 0.1 } });
});

test('UX1 P2: labels of keys in scene units name the units', () => {
  assert.equal(unitsLabel('Radius', 'Ring radius, scene units.', 'ly'), 'Radius (ly)');
  assert.equal(unitsLabel('Radius', 'Ring radius, scene units.', ''), 'Radius');
  assert.equal(unitsLabel('Opacity', 'Opacity, 0 to 1.', 'ly'), 'Opacity');
});

test('UX1 P2: object keys group by what they do; every group is known', () => {
  const ids = OBJECT_GROUPS.map((g) => g.id);
  assert.equal(groupOf('opacity'), 'appearance');
  assert.equal(groupOf('spin'), 'position');
  assert.equal(groupOf('hide_in_systems'), 'visibility');
  assert.equal(groupOf('tap_action'), 'actions');
  assert.equal(groupOf('color_major'), 'appearance');
  assert.equal(groupOf('line_width'), 'appearance');
  assert.equal(groupOf('pulse'), 'appearance');
  assert.equal(groupOf('occlude'), 'advanced');
  assert.equal(groupOf('radius'), 'main');
  assert.equal(groupOf('shape'), 'main');
  // a hint wins: a galaxy's dust is the opacity of its dust lanes
  const galaxy = objectBranch(objectSchema, 'galaxy');
  assert.equal(groupOf('dust', galaxy.own.dust), 'appearance');
  for (const type of OBJECT_TYPES) {
    const parts = objectBranch(objectSchema, type);
    for (const [k, s] of Object.entries({ ...parts.common, ...parts.own })) assert.ok(ids.includes(groupOf(k, s)), `${type}.${k}`);
  }
  for (const keys of Object.values(COMMON_GROUPS)) for (const k of keys) assert.ok(objectBranch(objectSchema, 'grid').common[k], k);
});

test('UX1 P2: what can follow an entity: numbers, the look, warp, the clock; a tour is its own', () => {
  const p = astrometricsSchema.properties;
  assert.ok(bindingBranch(p.look) && bindingBranch(p.warp) && bindingBranch(p.clock.properties.rate) && bindingBranch(p.clock.properties.date));
  assert.equal(bindingBranch(p.camera.properties.drag), null);
  assert.ok(isTour(p.camera.properties.view));
  assert.ok(!isTour(p.look));
  assert.equal(fieldKind(p.look, 'look'), 'choice');
  assert.ok(isTemplateValue('[[[ return 1 ]]]') && isTemplateValue('{{ states("x") }}') && !isTemplateValue('now'));
});

test('UX1 P2 round 2: brightness ranges are two sliders; clock fields; time scale 0 to 4; icons on every section', () => {
  const stars = astrometricsSchema.properties.backdrop.properties.stars.oneOf.find((b) => b.properties);
  assert.equal(fieldKind(stars.properties.brightness, 'brightness'), 'range');
  assert.equal(stars.properties.min_opacity, undefined);
  const nebula = objectBranch(objectSchema, 'nebula');
  assert.equal(fieldKind(nebula.own.brightness, 'brightness'), 'range');
  assert.deepEqual(tupleLabels(stars.properties.brightness.description, 2), ['faintest', 'brightest']);
  const clock = astrometricsSchema.properties.clock.properties;
  assert.equal(fieldKind(clock.rate, 'rate'), 'rate');
  assert.equal(fieldKind(clock.date, 'date'), 'date');
  assert.deepEqual(numberSelector(astrometricsSchema.properties.time_scale), { number: { mode: 'slider', min: 0, max: 4, step: 0.05 } });
  assert.equal(sectionIcon('stars', 'boolOrObject'), 'mdi:star-four-points-outline');
  assert.equal(sectionIcon('anything', 'objectList'), 'mdi:format-list-bulleted');
  assert.equal(sectionIcon('anything', 'object'), 'mdi:tune-variant');
});

test('UX1 P2 round 2: label styles take how labels look, not what they say', () => {
  const labels = astrometricsSchema.properties.labels.properties;
  const style = labels.styles.additionalProperties.properties;
  for (const k of ['content', 'show', 'template', 'display_format']) {
    assert.equal(labels.default.properties[k], undefined, `labels.default.${k}`);
    assert.equal(style[k], undefined, `labels.styles.*.${k}`);
  }
  assert.ok(labels.default.properties.font_family && style.font_size && style.priority);
  // generated labels (ring and axis labels) use the text controls, and take no content either
  const grid = objectBranch(objectSchema, 'grid');
  for (const k of ['ring_labels', 'axis_labels']) {
    const text = grid.own[k].properties.text;
    assert.equal(fieldKind(text, 'text'), 'textDefault', k);
    assert.equal(text.properties.default.properties.content, undefined, k);
  }
  // a point's own label still says what it says
  const point = astrometricsSchema.properties.points.items;
  assert.ok(point.properties.text.additionalProperties.properties.content);
});

test('UX1 P5: an object row says one key value, a route only when nothing else does', () => {
  assert.equal(objectSummary({ type: 'beam', from: 'a', to: 'b' }), 'a to b');
  assert.equal(objectSummary({ type: 'path', points: ['a', 'b', 'c'] }), '3 points');
  assert.equal(objectSummary({ type: 'path', points: ['a', 'b'], width: 2, visible: false }), '2 points · hidden');
  assert.equal(objectSummary({ type: 'trail', point: 'ship' }), 'behind ship');
  assert.equal(objectSummary({ type: 'system', at: 'sol', units: 'km', points: [{ id: 'x' }] }), 'in km · at sol');
  assert.equal(objectSummary({ type: 'ring', radius: 40, at: 'sun', from: 'a', to: 'b' }), '40 · at sun');
});
