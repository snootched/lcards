/**
 * CoreValidationService against the real MSD schema: a view_box-only MSD (blank
 * canvas) and tagged overlays validate without warnings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreValidationService } from '../../src/core/validation-service/index.js';
import { getMsdSchema } from '../../src/cards/schemas/msd-schema.js';

const validate = (data) => new CoreValidationService({ cacheResults: false }).validate(data, getMsdSchema());

test('a view_box without base_svg gets no "missing base_svg" warning', () => {
    const result = validate({
        type: 'custom:lcards-msd-card',
        msd: { view_box: [0, 0, 400, 200], overlays: [] },
    });
    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    assert.ok(!result.warnings.some(w => /base_svg/.test(w.field ?? '')), JSON.stringify(result.warnings));
});

test('overlay tags validate; a non-array tags value is an error', () => {
    const config = (tags) => ({
        type: 'custom:lcards-msd-card',
        msd: { base_svg: { source: 'none' }, view_box: [0, 0, 10, 10], overlays: [{ id: 'a', type: 'line', tags }] },
    });
    assert.equal(validate(config(['engineering', 'deck_7'])).errors.length, 0);
    assert.ok(validate(config('engineering')).errors.length > 0);
});
