// The layout view and layout card put HA's card elements into their grid with
// placeGridChildren (#409): Home Assistant assigns the same cards several times
// while a view builds, and re-appending a card disconnects and reconnects it
// (every LCARdS card tears down and renders again; an MSD could stick on
// "Initializing MSD...").
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let env;
let placeGridChildren;
const log = [];

before(async () => {
    env = installJsdom();
    ({ placeGridChildren } = await import('../../src/views/layout-render.js'));
    customElements.define('test-card', class extends HTMLElement {
        connectedCallback() { log.push(`+${this.id}`); }
        disconnectedCallback() { log.push(`-${this.id}`); }
    });
});
after(() => env.restore());

const cards = (...ids) => ids.map((id) => Object.assign(document.createElement('test-card'), { id }));
const surface = (name) => {
    const fragment = document.createDocumentFragment();
    const el = document.createElement('div');
    el.className = 'area-surface';
    el.dataset.area = name;
    fragment.appendChild(el);
    return fragment;
};
const order = (grid) => [...grid.children].map((el) => el.id || `surface:${el.dataset.area}`);

test('the same cards again: nothing is disconnected or reconnected', () => {
    const grid = document.body.appendChild(document.createElement('div'));
    const list = cards('a', 'b', 'c');
    placeGridChildren(grid, list, surface('top'));
    assert.deepEqual(order(grid), ['surface:top', 'a', 'b', 'c']);
    log.length = 0;

    placeGridChildren(grid, list, surface('top'));
    placeGridChildren(grid, [...list], surface('top'));
    assert.deepEqual(log, [], 'no card left the DOM');
    assert.deepEqual(order(grid), ['surface:top', 'a', 'b', 'c'], 'old surfaces replaced, not piled up');
    grid.remove();
});

test('a new, a removed and a moved card: only those change', () => {
    const grid = document.body.appendChild(document.createElement('div'));
    const [a, b, c] = cards('a', 'b', 'c');
    placeGridChildren(grid, [a, b, c]);
    log.length = 0;

    const [d] = cards('d');
    log.length = 0;
    placeGridChildren(grid, [a, c, d]);
    assert.deepEqual(order(grid), ['a', 'c', 'd']);
    assert.deepEqual(log.sort(), ['+d', '-b'], 'b removed, d added, a and c untouched');

    log.length = 0;
    placeGridChildren(grid, [c, a, d]);
    assert.deepEqual(order(grid), ['c', 'a', 'd']);
    assert.equal(log.filter((e) => e.endsWith('d')).length, 0, 'd stays put');
    grid.remove();
});

test('cards wrapped by edit mode come back out into the grid', () => {
    const grid = document.body.appendChild(document.createElement('div'));
    const list = cards('a', 'b');
    for (const card of list) {
        const wrap = document.createElement('div');
        wrap.className = 'card-edit-wrap';
        wrap.appendChild(card);
        grid.appendChild(wrap);
    }
    placeGridChildren(grid, list);
    assert.deepEqual(order(grid), ['a', 'b']);
    assert.equal(grid.querySelector('.card-edit-wrap'), null);
    grid.remove();
});
