/**
 * Background animation editor (C3): the fields built from the params schemas
 * cover every key of the WebGL presets the editor has no hand-written
 * section for, map schema types onto the editor's field types, and give the
 * grid view keys their view-dependent defaults.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKGROUND_ANIMATION_PARAMS_SCHEMAS } from '../../src/cards/schemas/background-animation-params-schemas.js';
import { SCHEMA_SECTIONS, GRID_PRESETS, GRID_VIEW_KEYS, schemaFields, schemaField, withViewDefault } from '../../src/editor/components/background-animation-fields.js';

/** Keys edited elsewhere in the form: speed (Timing section, every preset); warp's colours (colour list) */
const ELSEWHERE = { 'warp-starfield': ['speed', 'colors', 'color'], 'holo-sphere': ['speed'] };

for (const [preset, sections] of Object.entries(SCHEMA_SECTIONS)) {
  test(`${preset}: the editor offers every schema key`, () => {
    const offered = new Set(sections.flatMap((s) => schemaFields(preset, s.keys).map((f) => f.key)));
    const keys = Object.keys(BACKGROUND_ANIMATION_PARAMS_SCHEMAS[preset].properties);
    assert.deepEqual(keys.filter((k) => !offered.has(k) && !ELSEWHERE[preset].includes(k)), []);
  });
}

test('every grid preset offers the view, camera and scan keys', () => {
  for (const preset of GRID_PRESETS) {
    assert.deepEqual(schemaFields(preset, GRID_VIEW_KEYS).map((f) => f.key), GRID_VIEW_KEYS, preset);
  }
});

test('schema types map onto editor fields', () => {
  const props = BACKGROUND_ANIMATION_PARAMS_SCHEMAS.grid.properties;
  assert.deepEqual(schemaField('view', props.view), { key: 'view', label: 'View', default: 'flat', helper: schemaField('view', props.view).helper, type: 'select', options: ['flat', 'floor'] });
  assert.equal(schemaField('scan_color', props.scan_color).type, 'color');
  const tilt = schemaField('camera_tilt', props.camera_tilt);
  assert.deepEqual([tilt.type, tilt.min, tilt.max, tilt.step, tilt.label], ['number', 1, 90, 1, 'Camera tilt']);
  assert.equal(schemaField('volumetric', BACKGROUND_ANIMATION_PARAMS_SCHEMAS.nebula.properties.volumetric).type, 'boolean');
  assert.ok(!/\. /.test(tilt.helper ?? ''), 'helper is the first sentence');
});

test('camera_tilt and scan_period defaults follow the view', () => {
  const [tilt, scan] = schemaFields('grid', ['camera_tilt', 'scan_period']);
  assert.equal(withViewDefault(tilt, {}).default, 90);
  assert.equal(withViewDefault(tilt, { view: 'floor' }).default, 10);
  assert.equal(withViewDefault(scan, {}).default, 0);
  assert.equal(withViewDefault(scan, { view: 'floor' }).default, 7);
});
