/**
 * `while`-gated on_entity_change animations: when one condition clears, the
 * TriggerManager stops that animation only, not every on_entity_change animation
 * on the overlay (AnimationManager.stopAnimations takes the definition).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TriggerManager } from '../../src/core/animation/TriggerManager.js';

/** A fake AnimationManager with a scripted entity source and play/stop spies. */
function fakeManager(states) {
    const subscribers = new Map();
    const calls = [];
    return {
        calls,
        setState(entityId, state) {
            const old = states[entityId];
            states[entityId] = { state };
            subscribers.get(entityId)?.(entityId, states[entityId], old);
        },
        systemsManager: {
            subscribeToEntity(entityId, cb) { subscribers.set(entityId, cb); return () => subscribers.delete(entityId); },
            getEntityState: (entityId) => states[entityId],
        },
        playAnimation: (_overlayId, anim) => calls.push(['play', anim]),
        stopAnimations: (_overlayId, trigger, anim) => calls.push(['stop', trigger, anim]),
    };
}

describe('TriggerManager while stop', () => {
    it('stops only the animation whose condition cleared', () => {
        const am = fakeManager({ 'light.a': { state: 'on' }, 'light.b': { state: 'on' } });
        const tm = new TriggerManager('overlay', null, am);
        const a = { trigger: 'on_entity_change', entity: 'light.a', while: { state: 'on' }, preset: 'pulse' };
        const b = { trigger: 'on_entity_change', entity: 'light.b', while: { state: 'on' }, preset: 'pulse' };
        tm.register('on_entity_change', a);
        tm.register('on_entity_change', b);
        tm.finalizeRegistrations();

        // check_on_load started both
        assert.deepEqual(am.calls.map(([kind, anim]) => [kind, anim]), [['play', a], ['play', b]]);

        am.setState('light.a', 'off');
        assert.deepEqual(am.calls.at(-1), ['stop', 'on_entity_change', a]);
        assert.equal(am.calls.filter(([kind]) => kind === 'stop').length, 1);
    });
});
