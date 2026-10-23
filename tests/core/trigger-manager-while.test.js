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

describe('TriggerManager from_state / to_state', () => {
    it('fire on a real transition only, not on an update that keeps the state', () => {
        const am = fakeManager({ 'input_select.alert': { state: 'green_alert' } });
        const tm = new TriggerManager('overlay', null, am);
        const up = { trigger: 'on_entity_change', entity: 'input_select.alert', to_state: 'red_alert', preset: 'custom' };
        const down = { trigger: 'on_entity_change', entity: 'input_select.alert', from_state: 'red_alert', preset: 'custom' };
        const any = { trigger: 'on_entity_change', entity: 'input_select.alert', preset: 'custom' };
        tm.register('on_entity_change', up);
        tm.register('on_entity_change', down);
        tm.register('on_entity_change', any);
        tm.finalizeRegistrations();
        am.calls.length = 0;

        am.setState('input_select.alert', 'red_alert');
        assert.deepEqual(am.calls.map(([, a]) => a), [up, any]);

        // Still red_alert (attribute / context update): the gated ones stay quiet
        am.setState('input_select.alert', 'red_alert');
        assert.deepEqual(am.calls.map(([, a]) => a), [up, any, any]);

        am.setState('input_select.alert', 'green_alert');
        assert.deepEqual(am.calls.map(([, a]) => a), [up, any, any, down, any]);
    });
});

describe('TriggerManager check_on_load (fire-and-forget)', () => {
    const setup = (rebuild) => {
        const am = fakeManager({ 'input_select.alert': { state: 'red_alert' } });
        const tm = new TriggerManager('overlay', null, am);
        tm._isRebuild = rebuild;
        const up = { trigger: 'on_entity_change', entity: 'input_select.alert', to_state: 'red_alert', preset: 'custom' };
        const down = { trigger: 'on_entity_change', entity: 'input_select.alert', from_state: 'red_alert', preset: 'custom' };
        tm.register('on_entity_change', up);
        tm.register('on_entity_change', down);
        tm.finalizeRegistrations();
        return { am, up };
    };

    it('first setup: a matching to_state fires; a from_state animation never does', () => {
        const { am, up } = setup(false);
        assert.deepEqual(am.calls.map(([, a]) => a), [up]);
    });

    it('rebuild (re-render): nothing fires again (the carry-over keeps what was running)', () => {
        const { am } = setup(true);
        assert.deepEqual(am.calls, []);
    });
});
