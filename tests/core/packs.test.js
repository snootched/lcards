/**
 * Packs: builtin registry, PackManager registration, and a headless
 * lcardsCore.initialize() under jsdom (packs + default theme).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadBuiltinPacks, BUILTIN_PACK_IDS, CORE_REQUESTED_PACK_IDS } from '../../src/core/packs/loadBuiltinPacks.js';
import { PackManager } from '../../src/core/PackManager.js';
import { createFakeHass } from '../helpers/fake-hass.js';
import { installJsdom } from '../helpers/jsdom-env.js';

const ALL_BUILTIN = [
    'core', 'lcards_buttons', 'lcards_sliders', 'lcards_elbows', 'builtin_themes', 'builtin_msd_backgrounds',
    'core_fonts', 'lcards_sounds_default', 'lcards_beeps', 'lcards_alerts', 'lcards_textures', 'lcards_images', 'lcards_power',
];

test('every builtin pack loads with an id and version; unknown names are dropped', () => {
    const packs = loadBuiltinPacks(['core', 'lcars_fx']); // infrastructure packs always load
    assert.deepEqual(packs.map(p => p.id).sort(), ALL_BUILTIN.filter(id => !['lcards_buttons', 'lcards_sliders'].includes(id)).sort());
    for (const pack of packs) {
        assert.equal(typeof pack.id, 'string', JSON.stringify(Object.keys(pack)));
        assert.ok(pack.version !== undefined, `${pack.id} has no version`);
    }
    assert.ok(packs.find(p => p.id === 'core_fonts').font_assets, 'core_fonts reads core_fonts.json');
});

test('PackManager.registerPack routes each section to its manager', async () => {
    const calls = [];
    const rulesManager = { rules: [], rulesById: new Map(), buildDependencyIndex: () => calls.push('deps'), _compileRules: () => calls.push('compile'), markAllDirty: () => calls.push('dirty') };
    const core = {
        themeManager: { registerThemesFromPack: (p) => calls.push(`themes:${p.id}`) },
        stylePresetManager: { registerPresetsFromPack: (p) => calls.push(`presets:${p.id}`) },
        rulesManager,
        assetManager: { preloadFromPack: async (p) => calls.push(`assets:${p.id}`) },
        soundManager: { registerSchemes: () => calls.push('sounds') },
        componentManager: { registerComponentsFromPack: (p) => calls.push(`components:${p.id}`) },
    };
    const pm = new PackManager(core);
    await pm.registerPack({
        id: 'p', version: 2, themes: {}, style_presets: {}, rules: [{ id: 'r' }, { noid: true }],
        svg_assets: {}, sound_schemes: {}, components: {},
    });
    await pm.registerPack({ version: 1 }); // no id: ignored
    assert.deepEqual(calls, ['themes:p', 'presets:p', 'deps', 'compile', 'dirty', 'assets:p', 'sounds', 'components:p']);
    assert.deepEqual(rulesManager.rules, [{ id: 'r' }]);
    assert.deepEqual(pm.getLoadedPackIds(), ['p']);
    assert.equal(pm.getPack('p').version, 2);
});

test('a pack\'s rules are compiled and match (D2 batch 5: they were never compiled, so never matched)', async () => {
    const { RulesEngine } = await import('../../src/core/rules/RulesEngine.js');
    const rulesManager = new RulesEngine([], null);
    const pm = new PackManager({ rulesManager });
    await pm.registerPack({ id: 'rp', version: 1, rules: [{ id: 'pack_rule', when: { entity: 'light.a', state: 'on' }, apply: {} }] });
    const result = await rulesManager.evaluateRule(rulesManager.rulesById.get('pack_rule'), () => ({ state: 'on', attributes: {} }));
    assert.equal(result.matched, true);
});

test('the packs the core asks for all exist (D3a: it asked for an lcars_fx pack that was never registered)', () => {
    assert.deepEqual([...BUILTIN_PACK_IDS].sort(), [...ALL_BUILTIN].sort());
    for (const id of CORE_REQUESTED_PACK_IDS) assert.ok(BUILTIN_PACK_IDS.includes(id), `${id} is not a builtin pack`);
    assert.ok(!CORE_REQUESTED_PACK_IDS.includes('lcars_fx'));
});

test('PackManager.loadBuiltinPacks: defaults plus infrastructure packs', async () => {
    const pm = new PackManager({});
    await pm.loadBuiltinPacks();
    assert.deepEqual(pm.getLoadedPackIds().sort(), [...ALL_BUILTIN].sort());
});

// ── Headless core ──────────────────────────────────────────────────────

test('lcardsCore.initialize under jsdom: every builtin pack registered, default theme active', async () => {
    // Left installed: each test file runs in its own process, and core timers
    // may still fire after destroy().
    installJsdom();
    globalThis.lcards = { core: {} }; // normally created by src/lcards-main.js
    const { lcardsCore } = await import('../../src/core/lcards-core.js');
    // lcards-main.js attaches the core before initialize(): window.lcards.core
    // IS the core, so its services need no window.lcards.core.X copies (G4)
    globalThis.lcards.core = lcardsCore;
    await lcardsCore.initialize(createFakeHass());
    try {
        assert.deepEqual(lcardsCore.packManager.getLoadedPackIds().sort(), [...ALL_BUILTIN].sort());
        const theme = lcardsCore.themeManager.getActiveTheme();
        assert.equal(theme.id, 'lcards-default');
        assert.ok(theme.tokens.colors, 'theme has a colour token tree');
        assert.ok(globalThis.lcards.core.borgAssimilationManager, 'the Borg manager is on the core');
        assert.ok(globalThis.lcards.core.portalOverlayManager, 'the portal overlay manager is on the core');
        assert.equal(readFileSync(new URL('../../src/core/lcards-core.js', import.meta.url), 'utf8').match(/window\.lcards\.core\.\w+\s*=/g), null,
            'lcards-core.js writes no window.lcards.core.X copies of its own services');
        assert.match(lcardsCore.themeManager.resolver.resolve('colors.ui.primary'), /^var\(--lcars-ui-primary, /);

        // D3a: the card context offered helpers calling methods that do not exist
        const ctx = await lcardsCore.registerCard('pack-test-card', {}, {});
        for (const gone of ['subscribeToDataSource', 'getDataSourceState', 'addRule', 'removeRule', 'evaluateRules']) {
            assert.equal(ctx[gone], undefined, `card context still has ${gone}`);
        }
        assert.equal(typeof ctx.getEntityState, 'function');
        assert.equal(typeof lcardsCore.systemsManager.getEntityState, 'function');
        assert.equal(typeof lcardsCore.systemsManager.subscribeToEntity, 'function');
        assert.equal(typeof lcardsCore.systemsManager.unsubscribeFromEntity, 'function');
        lcardsCore.unregisterCard('pack-test-card');
    } finally {
        // tears down every service (it threw before: the core called a destroy() AnimationManager lacks)
        lcardsCore.destroy();
    }
    assert.equal(lcardsCore._globalHassTimer, null, 'the global hass poll stops');
    assert.equal(lcardsCore.animationManager, null);
    assert.equal(lcardsCore.themeManager, null);
});
