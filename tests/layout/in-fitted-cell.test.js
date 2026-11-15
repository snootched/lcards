// inFittedCell: an LCARdS card follows a cell of a definite height (a button then
// drops its preset's 56 px minimum). Cells are layout card / layout view grid items
// marked data-lcards-cell-fits, and Home Assistant sections grid cells with a number
// of rows (div.card.fit-rows in hui-grid-section), through hui-card and, in edit
// mode, hui-card-edit-mode.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let env;
let inFittedCell;
before(async () => {
    env = installJsdom();
    ({ inFittedCell } = await import('../../src/views/layout-render.js'));
});
after(() => env.restore());

/** Build outer > ... > card from a list of [tag, classes] and return the card. */
const nest = (/** @type {Array<[string, string?]>} */ chain) => {
    let parent = document.createElement('div');
    for (const [tag, cls] of chain) {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        parent.appendChild(el);
        parent = el;
    }
    const card = document.createElement('lcards-button');
    parent.appendChild(card);
    return card;
};

test('layout card / view cells: the mark, directly or through hui-card', () => {
    const marked = document.createElement('div');
    marked.setAttribute('data-lcards-cell-fits', '');
    const direct = document.createElement('lcards-button');
    marked.appendChild(direct);
    assert.equal(inFittedCell(direct), true);
    const viaHuiCard = nest([['div'], ['hui-card']]);
    viaHuiCard.parentElement.parentElement.setAttribute('data-lcards-cell-fits', '');
    assert.equal(inFittedCell(viaHuiCard), true);
});

test('Home Assistant sections grid: a cell with a number of rows fits, rows auto does not', () => {
    assert.equal(inFittedCell(nest([['div', 'card fit-rows'], ['hui-card']])), true);
    assert.equal(inFittedCell(nest([['div', 'card fit-rows full-width'], ['hui-card']])), true);
    assert.equal(inFittedCell(nest([['div', 'card fit-rows'], ['hui-card-edit-mode'], ['hui-card']])), true, 'edit mode');
    assert.equal(inFittedCell(nest([['div', 'card'], ['hui-card']])), false, 'rows: auto');
    // a card inside a stack in a fitted cell sizes to content
    assert.equal(inFittedCell(nest([['div', 'card fit-rows'], ['hui-card'], ['hui-vertical-stack-card'], ['hui-card']])), false);
});
