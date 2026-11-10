/**
 * Pack Explorer's Animations category lists the registered animation presets
 * (core/animation/presets.js) under the core pack, grouped by category, with the
 * params from animation-preset-params-schemas.js. It used to read the removed
 * AnimationRegistry, which was always empty, so the category never showed (D3b).
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';
import { registerBuiltinAnimationPresets } from '../../src/core/packs/animations/presets/index.js';
import { listAnimationPresetInfo, getAnimationPresetInfo } from '../../src/core/animation/presets.js';
import { ANIMATION_PRESET_PARAMS_SCHEMAS } from '../../src/cards/schemas/animation-preset-params-schemas.js';

let Tab, restore;

before(async () => {
    registerBuiltinAnimationPresets();
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    ({ LCARdSPackExplorerTab: Tab } = await import('../../src/editor/components/pack-explorer/lcards-pack-explorer-tab.js'));
});
after(() => restore?.());

describe('animation preset origin', () => {
    it('every built-in preset is the core pack\'s, with its category', () => {
        const infos = listAnimationPresetInfo();
        assert.ok(infos.length > 0);
        assert.deepEqual(infos.map(i => i.name).sort(), Object.keys(ANIMATION_PRESET_PARAMS_SCHEMAS).sort());
        for (const info of infos) assert.equal(info.pack, 'core', info.name);
        const cat = (name) => getAnimationPresetInfo(name)?.category;
        assert.equal(cat('pulse'), 'basic');
        assert.equal(cat('stagger-grid'), 'stagger');
        assert.equal(cat('text-reveal'), 'text');
        assert.equal(cat('boot-sequence'), 'effect');
        assert.equal(cat('timeline-cascade'), 'timeline');
        assert.equal(getAnimationPresetInfo('no-such-preset'), null);
    });
});

describe('Pack Explorer animations', () => {
    it('the core pack lists every preset; other packs none', () => {
        const count = Tab.prototype._getAnimationCountForPack;
        const fake = { _getAnimationPresetsForPack: Tab.prototype._getAnimationPresetsForPack };
        assert.equal(count.call(fake, 'core'), Object.keys(ANIMATION_PRESET_PARAMS_SCHEMAS).length);
        assert.equal(count.call(fake, 'lcards_buttons'), 0);
    });

    it('params leave out the shared timing keys unless the preset redefines them', () => {
        const params = Tab.prototype._animationPresetParams(ANIMATION_PRESET_PARAMS_SCHEMAS.pulse);
        const keys = params.map(p => p.key);
        assert.ok(keys.includes('max_scale'));
        assert.ok(!keys.includes('duration'), 'shared timing key hidden');
        const maxScale = params.find(p => p.key === 'max_scale');
        assert.equal(maxScale?.type, 'number');
        assert.equal(maxScale?.def, 1.15);
        assert.ok(maxScale?.description);
        assert.deepEqual(Tab.prototype._animationPresetParams(undefined), []);
    });
});
