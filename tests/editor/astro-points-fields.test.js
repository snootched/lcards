/**
 * Astrometrics points editor (2026-11-20 audit, group B): a point's colour by
 * state saves `{ default: x }` alone as plain `x`, and the pinned card's offset
 * drops out when both axes are 0. Every key of the new point sections exists
 * in the point schema.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let mod, schema, restore;

before(async () => {
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    mod = await import('../../src/editor/components/editors/lcards-astro-points-editor.js');
    ({ astrometricsSchema: schema } = await import('../../src/cards/schemas/astrometrics-schema.js'));
});
after(() => restore?.());

test('colour by state: default alone is a plain colour, an empty map nothing', () => {
    assert.equal(mod.colorOf({ default: 'var(--lcars-blue)' }), 'var(--lcars-blue)');
    assert.deepEqual(mod.colorOf({ default: 'var(--lcars-blue)', active: 'var(--lcars-orange)' }), { default: 'var(--lcars-blue)', active: 'var(--lcars-orange)' });
    assert.equal(mod.colorOf({ default: '' }), undefined);
});

test('card offset: one axis set keeps the other at 0; both 0 drops it', () => {
    assert.deepEqual(mod.offsetOf(undefined, 0, 12), [12, 0]);
    assert.deepEqual(mod.offsetOf([12, 0], 1, -4), [12, -4]);
    assert.equal(mod.offsetOf([12, 0], 0, undefined), undefined);
});

test('the point sections only name keys the point schema has', async () => {
    const src = (await import('node:fs')).readFileSync(new URL('../../src/editor/components/editors/lcards-astro-points-editor.js', import.meta.url), 'utf8');
    const block = src.slice(src.indexOf('const POINT_GROUPS'), src.indexOf('];', src.indexOf('const POINT_GROUPS')));
    const keys = [...block.matchAll(/keys: \[([^\]]+)\]/g)].flatMap(m => [...m[1].matchAll(/'([a-z_]+)'/g)].map(k => k[1]));
    assert.ok(keys.length >= 10);
    const props = schema.properties.points.items.properties;
    assert.deepEqual(keys.filter(k => !props[k]), []);
    for (const k of ['height', 'offset', 'leader']) assert.ok(props.card.properties[k], `card.${k}`);
});
