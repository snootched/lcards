/**
 * D3a: the example pack is the template pack authors copy, so it must work.
 * It used rule `conditions`/`patches` (the engine reads `when`/`apply`, so the
 * rule compiled to "always" and patched nothing) and `{theme:palette.*}` tokens
 * (no palette namespace; presets use `theme:<path>`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LCARDS_EXAMPLE_PACK } from '../../src/core/packs/example/lcards-example-pack.js';
import { compileRule } from '../../src/core/rules/compileConditions.js';
import { RulesEngine } from '../../src/core/rules/RulesEngine.js';
import { PackManager } from '../../src/core/PackManager.js';
import { lcardsDefaultTokens } from '../../src/core/packs/themes/tokens/lcardsDefaultTokens.js';
import { BUTTON_PRESETS } from '../../src/core/packs/style-presets/buttons/index.js';
import { SLIDER_PRESETS } from '../../src/core/packs/style-presets/sliders/index.js';
import { SOUND_EVENT_LABELS } from '../../src/core/sound/SoundManager.js';

const pack = LCARDS_EXAMPLE_PACK;

/** Every string leaf of an object, with its dotted path. */
function* leaves(obj, path = '') {
    for (const [k, v] of Object.entries(obj ?? {})) {
        const p = path ? `${path}.${k}` : k;
        if (v && typeof v === 'object') yield* leaves(v, p);
        else yield [p, v];
    }
}

test('the example rule uses when/apply and compiles to a real condition', () => {
    assert.ok(pack.rules.length > 0);
    for (const rule of pack.rules) {
        assert.equal(rule.conditions, undefined, `${rule.id}: the engine reads "when", not "conditions"`);
        assert.equal(rule.patches, undefined, `${rule.id}: the engine reads "apply", not "patches"`);
        assert.ok(rule.when, `${rule.id} has a when`);
        assert.ok(rule.apply?.overlays && Object.keys(rule.apply.overlays).length, `${rule.id} patches some cards`);
        const issues = [];
        const { tree, deps } = compileRule(rule, issues);
        assert.deepEqual(issues, []);
        assert.notEqual(tree.type, 'always', `${rule.id} compiled to "always"`);
        assert.notEqual(tree.type, 'invalid');
        assert.ok(deps.entities.size > 0, `${rule.id} watches an entity`);
    }
});

test('the example rule matches when its entity is on, and not when off', async () => {
    const rules = new RulesEngine([], null);
    await new PackManager({ rulesManager: rules }).registerPack({ id: 'ex', version: 1, rules: pack.rules });
    const rule = rules.rulesById.get(pack.rules[0].id);
    assert.equal((await rules.evaluateRule(rule, () => ({ state: 'on', attributes: {} }))).matched, true);
    assert.equal((await rules.evaluateRule(rule, () => ({ state: 'off', attributes: {} }))).matched, false);
});

test('every theme token in the example presets exists in the default token tree', () => {
    let count = 0;
    for (const [path, value] of leaves(pack.style_presets)) {
        assert.ok(!(typeof value === 'string' && value.includes('{theme:')), `${path}: "${value}" is not token syntax (use theme:<path>)`);
        if (typeof value !== 'string' || !value.startsWith('theme:')) continue;
        count++;
        const resolved = value.slice(6).split('.').reduce((o, k) => o?.[k], lcardsDefaultTokens);
        assert.notEqual(resolved, undefined, `${path}: token ${value} does not exist`);
    }
    assert.ok(count > 0, 'the presets show token use');
});

test('example preset keys exist on the real built-in presets', () => {
    const known = (presets) => new Set(Object.values(presets).flatMap(p => [...leaves(p)].map(([k]) => k)));
    for (const [type, real] of [['button', BUTTON_PRESETS], ['slider', SLIDER_PRESETS]]) {
        const keys = known(real);
        for (const [name, preset] of Object.entries(pack.style_presets[type] ?? {})) {
            for (const [path] of leaves(preset)) {
                assert.ok(keys.has(path), `${type} preset ${name}: ${path} is not used by any built-in ${type} preset`);
            }
        }
    }
});

test('sound scheme events are real events and their assets are registered', () => {
    for (const [scheme, mapping] of Object.entries(pack.sound_schemes)) {
        for (const [event, asset] of Object.entries(mapping)) {
            assert.ok(event in SOUND_EVENT_LABELS, `${scheme}: unknown sound event ${event}`);
            if (asset !== null) assert.ok(asset in pack.audio_assets, `${scheme}.${event}: asset ${asset} is not in audio_assets`);
        }
    }
});

test('font assets point to a CSS file (loadFont injects the url as a stylesheet link)', () => {
    const fonts = Object.entries(pack.font_assets ?? {});
    assert.ok(fonts.length > 0, 'the example shows a font asset');
    for (const [key, def] of fonts) {
        const path = new URL(def.url, 'http://ha.local').pathname;
        assert.doesNotMatch(path, /\.(woff2?|ttf|otf|eot)$/i, `${key}: ${def.url} is a font file; point url at a CSS file with the @font-face rule`);
        if (!def.external) assert.match(path, /\.css$/i, `${key}: a local font url is a .css file`);
    }
});
