/**
 * RQ1 (D3c): Home Assistant's hui-card sets `.preview` after setConfig() and
 * before inserting the card, so the detection in setConfig() never saw it. The
 * base detects preview mode again on connect.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
for (const key of Object.getOwnPropertyNames(env.dom.window)) {
    if (/^[A-Z]/.test(key) && !(key in globalThis)) /** @type {any} */ (globalThis)[key] = /** @type {any} */ (env.dom.window)[key];
}
after(() => env.restore());

const { LCARdSCard } = await import('../../src/base/LCARdSCard.js');

class PreviewProbeCard extends LCARdSCard {
    static CARD_TYPE = 'preview-probe';
}
customElements.define('lcards-preview-probe', PreviewProbeCard);

test('RQ1: .preview set after setConfig is picked up when the card connects', async () => {
    const card = /** @type {any} */ (document.createElement('lcards-preview-probe'));
    card.setConfig({ type: 'custom:lcards-preview-probe' });
    assert.equal(card.isPreviewMode(), false, 'not known at setConfig');
    card.preview = true; // what hui-card does next
    document.body.appendChild(card);
    try {
        assert.equal(card.isPreviewMode(), true);
    } finally {
        card.remove();
    }
});

test('RQ1: a card on a plain page stays out of preview mode', async () => {
    const card = /** @type {any} */ (document.createElement('lcards-preview-probe'));
    card.setConfig({ type: 'custom:lcards-preview-probe' });
    document.body.appendChild(card);
    try {
        assert.equal(card.isPreviewMode(), false);
    } finally {
        card.remove();
    }
});
