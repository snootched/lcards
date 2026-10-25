/**
 * CoreValidationService (the runtime validator) on the astrometrics schema:
 * the three design references validate with no errors, and a wrong type
 * still fails. The schema shares one colour grammar through allOf (so the
 * published schema keeps one copy of its pattern); the wrapper must carry
 * `type: 'string'`, or the runtime validator reports 'must be , got string'
 * for every colour outside a oneOf (found in the browser test, 2026-10-25).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { CoreValidationService } from '../../src/core/validation-service/index.js';
import { astrometricsSchema } from '../../src/cards/schemas/astrometrics-schema.js';

const service = () => new CoreValidationService({ cacheResults: false });
const refs = /** @type {any} */ (yaml.load(readFileSync(new URL('./fixtures/astro-references.yaml', import.meta.url), 'utf8')));

test('the three design references validate at runtime with no errors', () => {
    for (const [name, config] of Object.entries(refs)) {
        const result = service().validate({ type: 'custom:lcards-astrometrics-card', ...config }, astrometricsSchema);
        assert.deepEqual(result.errors, [], `${name}: ${JSON.stringify(result.errors)}`);
    }
});

test('a wrong value type still fails at runtime', () => {
    const result = service().validate({ type: 'custom:lcards-astrometrics-card', points: [{ id: 'a', xyz: [0, 0, 0], color: 5 }], labels: { snap: 'yes' } }, astrometricsSchema);
    assert.ok(result.errors.some((e) => e.field === 'labels.snap'), JSON.stringify(result.errors));
    assert.ok(result.errors.some((e) => e.field === 'points[0].color'), JSON.stringify(result.errors));
});
