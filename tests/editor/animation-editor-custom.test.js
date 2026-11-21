/**
 * The animation editor's custom mode: timing keys live at the top level like every
 * preset (the Timing & Duration / Easing Function sections edit them), typed into the
 * custom YAML they move there, and the legacy type: custom + animejs shape converts.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let Editor, restore;

before(async () => {
    const env = installJsdom();
    restore = env.restore;
    // Lit and the editor's imports need a few more DOM classes than the shared helper sets
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    ({ LCARdSAnimationEditor: Editor } = await import('../../src/editor/components/lcards-animation-editor.js'));
});
after(() => restore?.());

/** A stand-in `this` for the editor methods under test. */
function fakeEditor(animations) {
    const fake = { _workingAnimations: animations, fired: 0, _fireChange() { this.fired++; } };
    Object.defineProperty(fake, 'animations', { get() { return this._workingAnimations; } });
    return fake;
}

describe('animation editor custom mode', () => {
    it('timing keys typed into the custom YAML move to the top level', () => {
        const fake = fakeEditor([{ id: 'a', trigger: 'on_tap', preset: 'custom', duration: 1000, params: { scale: [1, 1.1, 1] } }]);
        Editor.prototype._updateCustomConfig.call(fake, 0, { scale: [1, 1.2, 1], duration: 600, loop: true, ease: 'outQuad' });
        assert.deepEqual(fake._workingAnimations[0], {
            id: 'a', trigger: 'on_tap', preset: 'custom', duration: 600, loop: true, ease: 'outQuad',
            params: { scale: [1, 1.2, 1] },
        });
        assert.equal(fake.fired, 1);
    });

    it('editing a legacy custom animation writes preset: custom and drops type/animejs', () => {
        const fake = fakeEditor([{ trigger: 'on_tap', type: 'custom', animejs: { scale: [1, 2] } }]);
        Editor.prototype._updateCustomConfig.call(fake, 0, { scale: [1, 3] });
        assert.deepEqual(fake._workingAnimations[0], { trigger: 'on_tap', preset: 'custom', params: { scale: [1, 3] } });
    });

    it('a legacy custom animation is normalised on load, its timing promoted', () => {
        const normalized = Editor.prototype._normalizeAnimation.call({}, {
            trigger: 'on_tap', type: 'custom', animejs: { scale: [1, 2], duration: 500, loop: true },
        });
        assert.deepEqual(normalized, { trigger: 'on_tap', preset: 'custom', duration: 500, loop: true, params: { scale: [1, 2] } });
    });
});
