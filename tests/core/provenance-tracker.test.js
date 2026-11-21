/**
 * ProvenanceTracker: token chains with every field that uses them, templates by
 * field, rule patches that clear, runtime layers, and change events.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProvenanceTracker } from '../../src/utils/provenance-tracker.js';

const tick = () => new Promise(r => setTimeout(r, 30));

test('theme tokens: the chain is kept and used_by_fields accumulates', () => {
    const t = new ProvenanceTracker('g');
    const chain = [{ step: 'lookup', path: 'colors.ui.primary', value: 'var(--x)' }, { step: 'css-var', variable: '--x', value: 'var(--x)' }];
    t.trackThemeToken('colors.ui.primary', 'theme:colors.ui.primary', 'var(--x)', chain, ['style.a']);
    t.trackThemeToken('colors.ui.primary', 'theme:colors.ui.primary', 'var(--x)', chain, ['style.b', 'style.a']);
    const tok = t.getProvenance().theme_tokens['colors.ui.primary'];
    assert.deepEqual(tok.used_by_fields, ['style.a', 'style.b']);
    assert.deepEqual(tok.resolution_chain.map(s => s.step), ['lookup', 'css-var']);
});

test('templates: by field; re-tracking a field replaces it', () => {
    const t = new ProvenanceTracker('g');
    t.trackTemplate('text.label.content', '{entity.state}', 'on', ['light.a'], 'token');
    t.trackTemplate('text.label.content', '{entity.state}!', 'on!', ['light.a'], 'token');
    assert.deepEqual(Object.keys(t.getProvenance().templates), ['text.label.content']);
    assert.equal(t.getProvenance().templates['text.label.content'].processed, 'on!');
});

test('rule patches clear when the rules stop matching', () => {
    const t = new ProvenanceTracker('g');
    t.trackRulePatch('style.opacity', 1, 0.5, 'dim', 'entity off');
    assert.equal(Object.keys(t.getProvenance().rule_patches).length, 1);
    t.clearRulePatches();
    assert.deepEqual(t.getProvenance().rule_patches, {});
});

test('runtime layers: per field, replaced by layer, cleared by layer', () => {
    const t = new ProvenanceTracker('g');
    t.trackRuntime('style.card.color.background', 'state', 'var(--on)', { state: 'active' });
    t.trackRuntime('style.card.color.background', 'match-light', '#ff0000');
    t.trackRuntime('style.card.color.background', 'state', 'var(--off)', { state: 'inactive' });
    const layers = t.getProvenance().runtime['style.card.color.background'];
    assert.deepEqual(layers.map(l => [l.layer, l.value]), [['state', 'var(--off)'], ['match-light', '#ff0000']]);
    t.clearRuntime('match-light');
    assert.deepEqual(t.getProvenance().runtime['style.card.color.background'].map(l => l.layer), ['state']);
    t.clearRuntime();
    assert.deepEqual(t.getProvenance().runtime, {});
});

test('change events: one notification per burst of changes; unsubscribe stops them', async () => {
    const t = new ProvenanceTracker('g');
    let calls = 0;
    const off = t.subscribe(() => calls++);
    t.trackRulePatch('a', 1, 2, 'r', 'c');
    t.trackRuntime('b', 'state', 1);
    t.trackTemplate('c', '{x}', 'y');
    await tick();
    assert.equal(calls, 1);
    off();
    t.clearRulePatches();
    await tick();
    assert.equal(calls, 1);
});

test('config tree: fields only a rule or a runtime layer sets are in the tree, with that source', () => {
    const t = new ProvenanceTracker('g');
    t.trackConfig({ merge_order: ['user_config'], field_sources: { entity: { layers: { user_config: 'light.a' }, final: 'user_config' } } });
    t.trackRulePatch('height', undefined, 120, 'size-rule', 'brightness');
    t.trackRuntime('style.card.color.background.inactive', 'built-in', '#333');
    t.trackRulePatch('entity', 'light.a', 'light.b', 'r', 'c'); // a config field keeps its config source
    const tree = t.getConfigTree();
    assert.equal(tree.height.__source, 'rules');
    assert.equal(tree.style.card.color.background.inactive.__source, 'built-in');
    assert.equal(tree.entity.__source, 'user_config');
});
