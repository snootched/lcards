/**
 * rule-apply-schema: the rule editor's Apply YAML completes overlay IDs from the
 * page, and a patch completes against its target card's own schema.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ruleApplySchema } from '../../src/editor/components/dashboard/rule-apply-schema.js';
import { optionsAt, valueChoicesAt } from '../../src/editor/utils/yaml-schema-path.js';
import { getButtonSchema } from '../../src/cards/schemas/button-schema.js';
import { getChartSchema } from '../../src/cards/schemas/chart-schema.js';

const SCHEMAS = { button: getButtonSchema(), chart: getChartSchema() };
const schema = ruleApplySchema({
    overlays: [
        { id: 'bridge_button', type: 'button', tags: ['bridge', 'nav'] },
        { id: 'warp_chart', type: 'chart', tags: [] },
    ],
    card: { id: 'new_card', type: 'button' },
    getCardSchema: (type) => SCHEMAS[type] ?? null,
});
const keys = (path, config = {}) => optionsAt(schema, path, config).map(o => o.key);

test('top level: the apply keys', () => {
    assert.deepEqual(keys([]).sort(), ['animations', 'base_svg', 'overlays', 'profiles']);
});

test('overlays: every target on the page, the card being edited, and the selectors', () => {
    const k = keys(['overlays']);
    for (const id of ['bridge_button', 'warp_chart', 'new_card', 'all', 'exclude']) assert.ok(k.includes(id), id);
});

test("a patch completes against its card's schema, without card-level keys", () => {
    const button = keys(['overlays', 'bridge_button']);
    for (const key of ['style', 'text', 'icon']) assert.ok(button.includes(key), key);
    for (const key of ['type', 'id', 'rules', 'data_sources']) assert.ok(!button.includes(key), key);
    assert.ok(keys(['overlays', 'warp_chart']).length > 0);
    // Nested: a button's style sections
    assert.ok(keys(['overlays', 'bridge_button', 'style']).length > 0);
});

test('a patch requires nothing (it sets only what it changes)', () => {
    const walk = (node, path) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node.required)) assert.fail(`required at ${path}`);
        for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    };
    walk(schema.properties.overlays.properties.bridge_button, 'bridge_button');
});

test('selectors and unknown IDs still parse (any object)', () => {
    assert.deepEqual(keys(['overlays', 'tag:bridge']), []);
    assert.ok(schema.properties.overlays.additionalProperties);
});

test('animations offer the page IDs and tags as values', () => {
    const values = (key) => valueChoicesAt(schema, ['animations', 0], key, { animations: [{}] }).map(c => c.value);
    assert.ok(values('overlay').includes('bridge_button'));
    assert.ok(values('tag').includes('nav'));
});

test('without a card schema the patch is open', () => {
    const open = ruleApplySchema({ overlays: [{ id: 'x', type: 'mystery' }] });
    assert.equal(open.properties.overlays.properties.x.additionalProperties, true);
});
