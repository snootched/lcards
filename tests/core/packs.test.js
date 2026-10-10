/**
 * Packs: builtin registry, PackManager registration, and a headless
 * lcardsCore.initialize() under jsdom (packs + default theme).
 *
 * mergePacks.js is not covered: nothing calls it (CoreConfigManager imports it
 * unused) and it depends on perfTime/perfTimeAsync globals that no longer exist.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBuiltinPacks } from '../../src/core/packs/loadBuiltinPacks.js';
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
    const rulesManager = { rules: [], rulesById: new Map(), buildDependencyIndex: () => calls.push('deps'), markAllDirty: () => calls.push('dirty') };
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
    assert.deepEqual(calls, ['themes:p', 'presets:p', 'deps', 'dirty', 'assets:p', 'sounds', 'components:p']);
    assert.deepEqual(rulesManager.rules, [{ id: 'r' }]);
    assert.deepEqual(pm.getLoadedPackIds(), ['p']);
    assert.equal(pm.getPack('p').version, 2);
});

test('PackManager.loadBuiltinPacks: defaults plus infrastructure packs; unknown lcars_fx skipped', async () => {
    const pm = new PackManager({});
    await pm.loadBuiltinPacks();
    assert.deepEqual(pm.getLoadedPackIds().sort(), [...ALL_BUILTIN].sort());
});

// ── Headless core ──────────────────────────────────────────────────────

test('lcardsCore.initialize under jsdom: every builtin pack registered, default theme active', async () => {
    // Left installed: each test file runs in its own process, and core timers
    // may still fire after destroy().
    installJsdom();
    globalThis.lcards = { core: {} }; // normally created by src/lcards.js
    const { lcardsCore } = await import('../../src/core/lcards-core.js');
    await lcardsCore.initialize(createFakeHass());
    try {
        assert.deepEqual(lcardsCore.packManager.getLoadedPackIds().sort(), [...ALL_BUILTIN].sort());
        const theme = lcardsCore.themeManager.getActiveTheme();
        assert.equal(theme.id, 'lcards-default');
        assert.ok(theme.tokens.colors, 'theme has a colour token tree');
        assert.equal(globalThis.lcards.core.borgAssimilationManager, lcardsCore.borgAssimilationManager);
        assert.match(lcardsCore.themeManager.resolver.resolve('colors.ui.primary'), /^var\(--lcars-ui-primary, /);
    } finally {
        // lcardsCore.destroy() throws (AnimationManager has no destroy()), and
        // nothing in the product calls it; stop the global hass poll directly.
        clearInterval(lcardsCore._globalHassTimer);
    }
});
