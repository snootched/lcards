/**
 * CoreValidationService: `deprecated: true` warnings and oneOf/anyOf reporting.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window ??= globalThis;
globalThis.__LCARDS_VERSION__ ??= 'test';
const { CoreValidationService } = await import('../../src/core/validation-service/index.js');

const validate = (data, schema) => new CoreValidationService({ cacheResults: false }).validate(data, schema);

test('a present deprecated property warns (with its replacement) but does not error', () => {
    const schema = {
        type: 'object',
        properties: {
            old_key: { type: 'number', deprecated: true, 'x-replacement': 'new_key' },
            new_key: { type: 'number' }
        }
    };
    const result = validate({ old_key: 1 }, schema);
    assert.equal(result.errors.length, 0);
    const warning = result.warnings.find(w => w.type === 'deprecated_property');
    assert.equal(warning?.field, 'old_key');
    assert.match(warning.message, /use new_key/);

    assert.equal(validate({ new_key: 1 }, schema).warnings.length, 0);
});

test('deprecated keys inside a matched oneOf branch still warn', () => {
    const schema = {
        type: 'object',
        properties: {
            items: {
                type: 'array',
                items: {
                    oneOf: [
                        { type: 'string' },
                        { type: 'object', properties: { ref: { type: 'string' }, legacy: { type: 'number', deprecated: true } } }
                    ]
                }
            }
        }
    };
    const result = validate({ items: [{ ref: 'a', legacy: 1 }] }, schema);
    assert.equal(result.errors.length, 0);
    assert.ok(result.warnings.some(w => w.type === 'deprecated_property'));
});

test('oneOf with the right type but no matching option warns with the closest problems', () => {
    const schema = {
        type: 'object',
        properties: {
            v: {
                oneOf: [
                    { type: 'object', properties: { entity: { type: 'string' } }, additionalProperties: false },
                    { type: 'object', properties: { datasource: { type: 'string' } }, additionalProperties: false }
                ]
            }
        }
    };
    // Previously nothing at all was reported. Warnings (not errors) because some
    // schemas are stricter than the cards (calc()/clamp()/templates must keep working).
    const result = validate({ v: { entity: 5 } }, schema);
    assert.equal(result.errors.length, 0);
    assert.ok(result.warnings.length > 0);
});
