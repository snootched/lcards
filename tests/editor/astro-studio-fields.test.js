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
import {
  fieldKind, objectBranch, scopeOf, appliesTo, tupleLabels, helperText, labelFor, withKey, parseNumbers, freshId, objectSummary, newObject
} from '../../src/editor/dialogs/astro-studio/schema-fields.js';

/** Keys shown as their own YAML editor (with completion), by where they are */
const YAML_FALLBACK = {
  objects: ['tap_action', 'hold_action', 'colors', 'animation'],
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
  for (const key of ['backdrop', 'labels', 'background_animation']) {
    const kind = fieldKind(astrometricsSchema.properties[key], key);
    if (kind === 'yaml') assert.ok(YAML_FALLBACK.scene.includes(key), `${key} falls back to YAML`);
  }
  for (const [key, s] of Object.entries(astrometricsSchema.properties.labels.properties)) {
    if (fieldKind(s, key) === 'yaml') assert.ok(YAML_FALLBACK.labels.includes(key), `labels.${key} falls back to YAML`);
  }
  assert.equal(fieldKind(astrometricsSchema.properties.backdrop.properties.stars, 'stars'), 'boolOrObject');
  assert.equal(fieldKind(cam.buttons, 'buttons'), 'boolOrObject');
});

test('field kinds for the shapes the schema uses', () => {
  const grid = objectBranch(objectSchema, 'grid');
  const props = { ...grid.common, ...grid.own };
  assert.equal(fieldKind(props.at, 'at'), 'pointRef');
  assert.equal(fieldKind(props.rotation, 'rotation'), 'tuple');
  assert.equal(fieldKind(props.size, 'size'), 'numberOrTuple');
  assert.equal(fieldKind(props.radius, 'radius'), 'numberOrTuple');
  assert.equal(fieldKind(props.color, 'color'), 'color');
  assert.equal(fieldKind(props.shape, 'shape'), 'enum');
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

test('TYPE_GUIDE matches the objects page table and covers every type', () => {
  assert.deepEqual(TYPE_GUIDE.map((t) => t.type).sort(), [...OBJECT_TYPES].sort());
  const md = readFileSync(new URL('../../doc/cards/astrometrics/objects.md', import.meta.url), 'utf8');
  const rows = [...md.matchAll(/^\| (.+?) \| \[`(\w+)`\]\(#\w+\) \|$/gm)].map((m) => ({ use: m[1], type: m[2] }));
  assert.deepEqual(rows, TYPE_GUIDE.map((t) => ({ use: t.use, type: t.type })));
});
