/**
 * Schema gaps found by the D2 batch 5 (core) docs audit: keys the runtime reads
 * that the config checker rejected or flagged as unknown.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';
import { createConfigValidator } from '../../scripts/lib/config-validator.js';

const checker = createConfigValidator({ entries: getSchemaEntries(), registries: await buildRegistries() });
const errors = (config) => checker.validateConfig(config)
  .filter((i) => i.severity === 'error')
  .map((i) => `${i.code} ${i.path}: ${i.message}`);
const button = (extra) => ({ type: 'custom:lcards-button', entity: 'light.kitchen', ...extra });

test('background_animation { fps, effects } is accepted (the renderer reads fps)', () => {
  assert.deepEqual(errors(button({ background_animation: { fps: 0, effects: [{ preset: 'grid' }] } })), []);
});

test('card animations: params take map_range, on_datasource_change takes datasource, easing is the old ease', () => {
  assert.deepEqual(errors(button({
    animations: [
      { trigger: 'on_load', preset: 'glow', params: { blur_max: { map_range: { entity: 'sensor.a', input: [0, 10], output: [4, 20] } } } },
      { trigger: 'on_datasource_change', datasource: 'power', preset: 'pulse' },
      { trigger: 'on_tap', preset: 'pulse', easing: 'linear' },
    ],
  })), []);
});

test('rule apply.animations take the card animation keys the engine passes on', () => {
  const config = button({
    rules: [{
      id: 'hot',
      when: { entity: 'sensor.a', above: 1 },
      apply: { animations: [{ tag: 'x', preset: 'pulse', alternate: true, target: '.button-bg', essential_motion: true, id: 'a1', enabled: true, ease: { type: 'spring' } }] },
    }],
  });
  assert.deepEqual(errors(config), []);
});

test('preset params: text-glitch seed, tap-ripple grid, numeric loops on text and timeline presets', () => {
  assert.deepEqual(errors(button({
    animations: [
      { trigger: 'on_tap', preset: 'text-glitch', params: { seed: 4, loop: 3 } },
      { trigger: 'on_tap', preset: 'tap-ripple', params: { grid: [4, 3] } },
      { trigger: 'on_tap', preset: 'timeline-cascade', params: { loop: 2 } },
    ],
  })), []);
});

test('button border.radius takes theme: tokens (the code reads them; the schema wanted {theme:...})', () => {
  assert.deepEqual(errors(button({ style: { border: { radius: 'theme:components.button.radius.large' } } })), []);
  assert.deepEqual(errors(button({ style: { border: { radius: 'var(--ha-border-radius-lg)' } } })), []);
});

test('assist actions take pipeline_id and start_listening (the handler reads them)', () => {
  assert.deepEqual(errors(button({ tap_action: { action: 'assist', pipeline_id: 'preferred', start_listening: false } })), []);
});

test('every enumDescriptions list matches its enum, one label per value (the action list was 5 for 11)', () => {
  const bad = [];
  const seen = new WeakSet();
  const walk = (node, path) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node.enum) && Array.isArray(node.enumDescriptions) && node.enum.length !== node.enumDescriptions.length) {
      bad.push(`${path}: ${node.enum.length} values, ${node.enumDescriptions.length} labels`);
    }
    for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`);
  };
  for (const entry of getSchemaEntries()) walk(entry.schema, entry.tag ?? entry.name ?? '?');
  assert.deepEqual(bad, []);
});

test('a sound given as a file URL is not reported as an unknown sound asset', () => {
  const issues = checker.validateConfig(button({ sounds: { card_tap: '/local/sounds/beep.mp3', card_hold: 'https://example.com/a.mp3' } }));
  assert.deepEqual(issues.filter((i) => /sound/i.test(i.message)).map((i) => i.message), []);
});
