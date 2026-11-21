/**
 * Astrometrics schema bugs found by the D2 docs audit (batch 3, 2026-11-08):
 * the schema must describe what the code does.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { astrometricsSchema } from '../../src/cards/schemas/astrometrics-schema.js';
import { installJsdom } from '../helpers/jsdom-env.js';

installJsdom();
const { clampKeys, DEFAULT_LIMITS } = await import('../../src/core/astrometrics/camera-rig.js');

test('a view fov range in the schema is the range the camera clamps to', () => {
  const fov = astrometricsSchema.properties.camera.properties.views.additionalProperties.properties.fov;
  const lo = clampKeys({ tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 0, distance: 10, fov: -1 }, DEFAULT_LIMITS).fov;
  const hi = clampKeys({ tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 0, distance: 10, fov: 999 }, DEFAULT_LIMITS).fov;
  assert.equal(fov.minimum, lo);
  assert.equal(fov.maximum, hi);
});

test('units description names body: points, not a planet: key that does not exist', () => {
  const d = astrometricsSchema.properties.units.description;
  assert.doesNotMatch(d, /\(planet:\)/);
  assert.match(d, /body/);
});

test('schema descriptions name the binding key output, not to', () => {
  assert.doesNotMatch(JSON.stringify(astrometricsSchema), /\{ entity, to \}/);
});

test('nebula clouds: the schema allows as many as the code draws (10 gas and 4 dust)', async () => {
  const { MAX_CLOUDS, MAX_DUST } = await import('../../src/core/astrometrics/effects/nebula.js');
  const json = JSON.stringify(astrometricsSchema);
  assert.ok(json.includes(`"maxItems":${MAX_CLOUDS + MAX_DUST},"description":"Clouds placed by hand`), 'clouds maxItems');
});
