/**
 * The config checker looks inside a background effect's `config` (and an animation's
 * `params`): the schema picks it by the sibling `preset` (`discriminatedBy`), and
 * unknownKeys() now follows that pick, so unknown keys are reported. Values are
 * checked against the preset's params schema, which also takes a template, a
 * { template, default } object or a { map_range } descriptor in place of any value.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';
import { createConfigValidator } from '../../scripts/lib/config-validator.js';

const checker = createConfigValidator({ entries: getSchemaEntries(), registries: await buildRegistries() });
const issues = (config) => checker.validateConfig(config).map((i) => `${i.severity} ${i.code} ${i.path}: ${i.message}`);
const errors = (config) => issues(config).filter((i) => i.startsWith('error'));
const button = (background_animation) => ({ type: 'custom:lcards-button', entity: 'light.kitchen', background_animation });

test('an unknown background config key is reported, in the list and the { inset, effects } form', () => {
  assert.deepEqual(errors(button([{ preset: 'grid', config: { line_spaceing: 20 } }])), [
    'error unknown-key background_animation[0].config.line_spaceing: unknown key (not in the schema) (did you mean "line_spacing"?)',
  ]);
  assert.deepEqual(errors(button({ inset: { top: 4 }, effects: [{ preset: 'starfield', config: { star_count: 50 } }] })), [
    'error unknown-key background_animation.effects[0].config.star_count: unknown key (not in the schema)',
  ]);
});

test('unknown keys inside an object-valued background key are reported', () => {
  assert.deepEqual(errors(button([{ preset: 'cascade', config: { colors: { start: 'red', nope: 'blue' } } }])), [
    'error unknown-key background_animation[0].config.colors.nope: unknown key (not in the schema)',
  ]);
});

test('a wrong background config value is reported once (not once per reactive form)', () => {
  const config = (c) => errors(button([c])).filter((i) => i.includes('].config.'));
  assert.deepEqual(config({ preset: 'grid', config: { opacity: 5, view: 'sideways', line_spacing: 'wide' } }).sort(), [
    'error schema background_animation[0].config.line_spacing: must be number',
    'error schema background_animation[0].config.opacity: must be <= 1',
    'error schema background_animation[0].config.view: must be equal to one of the allowed values',
  ]);
  assert.deepEqual(config({ preset: 'starfield', config: { colors: ['red', 5] } }), [
    'error schema background_animation[0].config.colors[1]: must be string',
  ]);
});

test('templates, { template, default } and { map_range } pass for any background config key', () => {
  assert.deepEqual(errors(button([{
    preset: 'level',
    config: {
      fill_pct: '[[[ return entity.attributes.brightness / 2.55; ]]]',
      wave_height: '{entity.state}',
      color_a: { template: '[[[ return entity.state === "on" ? "red" : "blue"; ]]]', default: 'blue' },
      opacity: { map_range: { entity: 'sensor.power', input: [0, 100], output: [0.2, 1] } },
      direction: { map_range: { attribute: 'mode', input: [0, 1], output: [0, 1] } },
    },
  }])), []);
});

test('nebula, contour-field and level take the single color the presets read', () => {
  assert.deepEqual(errors(button([
    { preset: 'nebula', config: { color: 'var(--lcards-blue)' } },
    { preset: 'contour-field', config: { color: 'var(--lcards-blue)' } },
    { preset: 'level', config: { color: 'var(--lcards-blue)' } },
  ])), []);
});

test('an unknown preset name keeps its config unchecked; the registry check names it', () => {
  const found = issues(button([{ preset: 'my-pack-effect', config: { anything: 1, at: { all: true } } }]));
  assert.equal(found.filter((i) => i.startsWith('error')).length, 0, found.join('\n'));
  assert.ok(found.some((i) => i.startsWith('warning registry background_animation[0].preset')), found.join('\n'));
});

test('animation params are checked the same way (discriminatedBy on preset)', () => {
  assert.deepEqual(errors({ ...button(undefined), animations: [{ trigger: 'on_tap', preset: 'pulse', params: { scael: 1.1 } }] })
    .filter((i) => i.includes('params')), [
    'error unknown-key animations[0].params.scael: unknown key (not in the schema) (did you mean "scale"?)',
  ]);
});
