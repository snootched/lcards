/**
 * Home Assistant's layout keys (grid_options, visibility, ...) and card-mod / UIX
 * styling are accepted on every card, by every check: the runtime validator (what
 * the card editor reports), the config checker (docs, CLI) and the published
 * schemas (editors and IDEs). One list: src/cards/schemas/card-plumbing.js.
 * The alert overlay rejected grid_options at runtime (2026-11-06).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreValidationService } from '../../src/core/validation-service/index.js';
import { CARD_PLUMBING_KEYS } from '../../src/cards/schemas/card-plumbing.js';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildSchemaSet } from '../../scripts/lib/schema-publish.js';
import { unknownKeys } from '../../scripts/lib/config-validator.js';

const PLUMBING = {
    grid_options: { columns: 12, rows: 2 },
    view_layout: { 'grid-area': 'main' },
    visibility: [{ condition: 'screen', media_query: '(min-width: 768px)' }],
    layout_options: { grid_columns: 4 },
    card_mod: { style: 'ha-card { color: red; }' },
    uix: { style: 'ha-card { color: red; }' },
};

const cards = getSchemaEntries().filter((e) => e.kind === 'card');

test('the sample covers every plumbing key', () => {
    assert.deepEqual(Object.keys(PLUMBING).sort(), CARD_PLUMBING_KEYS.filter((k) => k !== 'type').sort());
});

for (const { tag, schema } of cards) {
    test(`${tag}: the runtime validator accepts every plumbing key, even where the card's own schema doesn't list it`, () => {
        // the schema as the card registers it: without the keys the published copy adds
        const own = { ...schema, properties: Object.fromEntries(Object.entries(schema.properties).filter(([k]) => k === 'type' || !(k in PLUMBING) || k === 'grid_options' && schema.properties.grid_options?.properties)) };
        const result = new CoreValidationService({ cacheResults: false }).validate({ type: `custom:${tag}`, ...PLUMBING }, own);
        const plumbing = [...result.errors, ...result.warnings].filter((e) => e.type === 'invalid_property');
        assert.deepEqual(plumbing, [], JSON.stringify(plumbing));
    });
}

test('the config checker skips them at a card root', () => {
    for (const { tag, schema } of cards) {
        assert.deepEqual(unknownKeys({ type: `custom:${tag}`, ...PLUMBING }, schema, '', [], true), [], tag);
    }
});

test('every published card schema declares them', () => {
    const { files } = buildSchemaSet(getSchemaEntries(), { version: '0.0.0-test', generatedAt: 'now' });
    for (const { tag } of cards) {
        const doc = files.get(`cards/${tag}.json`);
        for (const key of Object.keys(PLUMBING)) assert.ok(key in (doc.properties ?? {}), `${tag}: ${key}`);
    }
});

test('the YAML tab (editor and docs playground) does not call them unknown', async () => {
    const { validateTopLevel } = await import('../../src/editor/components/yaml/yaml-schema-assist.js');
    for (const { tag, schema } of cards) {
        const own = { ...schema, properties: Object.fromEntries(Object.entries(schema.properties).filter(([k]) => !(k in PLUMBING))) };
        const unknown = validateTopLevel({ type: `custom:${tag}`, ...PLUMBING }, own).filter((e) => /Unknown property/.test(e.message));
        assert.deepEqual(unknown, [], tag);
    }
    assert.equal(validateTopLevel({ type: 'x', typo_key: 1 }, { properties: { type: {} } }).length, 1, 'a real unknown key is still reported');
});
