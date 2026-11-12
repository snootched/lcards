/**
 * ringNameFollowsFill: a ring preset's name ("in the fill colour") follows the
 * user's own style.ring.fill.color unless the user colours the name.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ringNameFollowsFill, RING_FILL_TOKEN } from '../../src/cards/slider-ring-text.js';

const merged = (fill) => ({
    component: 'ring',
    style: { ring: { fill: { color: fill } } },
    text: { name: { show: true, color: { default: RING_FILL_TOKEN, unavailable: 'theme:x' } } }
});

test('the name follows a fill colour the user sets', () => {
    const raw = { style: { ring: { fill: { color: 'var(--lcars-blue)' } } } };
    const out = ringNameFollowsFill(merged('var(--lcars-blue)'), raw);
    assert.deepEqual(out.text.name.color, { default: 'var(--lcars-blue)', unavailable: 'theme:x' });
});

test('a state map fill is copied onto the name', () => {
    const fill = { default: 'var(--a)', active: 'var(--b)' };
    const out = ringNameFollowsFill(merged(fill), { style: { ring: { fill: { color: fill } } } });
    assert.deepEqual(out.text.name.color, { default: 'var(--a)', active: 'var(--b)', unavailable: 'theme:x' });
});

test('a name colour the user sets wins', () => {
    const raw = { style: { ring: { fill: { color: 'var(--a)' } } }, text: { name: { color: 'var(--c)' } } };
    const m = merged('var(--a)');
    assert.equal(ringNameFollowsFill(m, raw), m);
});

test('no user fill, or a name not tied to the fill token: unchanged', () => {
    const m = merged(RING_FILL_TOKEN);
    assert.equal(ringNameFollowsFill(m, {}), m);
    const other = { ...m, text: { name: { color: 'var(--z)' } } };
    assert.equal(ringNameFollowsFill(other, { style: { ring: { fill: { color: 'var(--a)' } } } }), other);
});

test('the merged config is not mutated', () => {
    const m = Object.freeze(merged('var(--a)'));
    ringNameFollowsFill(m, { style: { ring: { fill: { color: 'var(--a)' } } } });
    assert.equal(m.text.name.color.default, RING_FILL_TOKEN);
});

test('a name already resolved from the token (the merged config) follows too', () => {
    const resolved = 'var(--lcards-orange, var(--lcards-orange-medium))';
    const m = { component: 'ring', text: { name: { color: { default: resolved } } } };
    const out = ringNameFollowsFill(m, { style: { ring: { fill: { color: 'var(--a)' } } } }, resolved);
    assert.equal(out.text.name.color.default, 'var(--a)');
});
