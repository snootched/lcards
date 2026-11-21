/**
 * A card re-render (an alert symbol switching preset by range) rebuilds its
 * animation scope. Running animations carry over: kept when their elements
 * survived, replayed once on the new elements when they did not. stagger-flash
 * reports one handle per element, so the replay must be per animation: replaying
 * per handle multiplied it on every re-render and hung the page (D1c, 2026-11-06).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AnimationManager } from '../../src/core/animation/AnimationManager.js';

const carry = AnimationManager.prototype._carryOverInstances;

/** The manager methods _carryOverInstances uses, with a revert spy. */
function fakeManager() {
    const reverted = [];
    return {
        reverted,
        _instanceDefs: new WeakMap(),
        _carriesOver: AnimationManager.prototype._carriesOver,
        _targetsConnected: AnimationManager.prototype._targetsConnected,
        _revertInstance: (i) => { reverted.push(i); i.completed = true; return true; },
    };
}
const handle = (connected, time = 500) => ({ targets: [{ isConnected: connected }], completed: false, currentTime: time });

test('a stagger animation whose elements were replaced is replayed once, not once per element', () => {
    const am = fakeManager();
    const sweep = { id: 'bars-top-sweep', trigger: 'on_load' };
    const handles = Array.from({ length: 6 }, () => handle(false));
    handles.forEach(h => am._instanceDefs.set(h, sweep));
    const { keep, replay } = carry.call(am, { runningInstances: new Map([['on_load', handles]]) }, true);
    assert.equal(replay.length, 1);
    assert.equal(replay[0].animDef, sweep);
    assert.equal(replay[0].time, 500);
    assert.equal(keep.length, 0);
    assert.equal(am.reverted.length, 6, 'every old handle reverted');
});

test('all handles survived: they are kept; some replaced: the animation is reverted and replayed once', () => {
    const am = fakeManager();
    const kept = { id: 'kept', trigger: 'on_tap' };
    const mixed = { id: 'mixed', trigger: 'on_tap' };
    const a = [handle(true), handle(true)];
    const b = [handle(true), handle(false), handle(false)];
    a.forEach(h => am._instanceDefs.set(h, kept));
    b.forEach(h => am._instanceDefs.set(h, mixed));
    const { keep, replay } = carry.call(am, { runningInstances: new Map([['on_tap', [...a, ...b]]]) }, true);
    assert.deepEqual(keep.map(k => k.animDef.id), ['kept', 'kept']);
    assert.deepEqual(replay.map(r => r.animDef.id), ['mixed']);
    assert.equal(am.reverted.length, 3, 'the mixed animation\'s survivors are reverted too (the replay restarts them all)');
});
