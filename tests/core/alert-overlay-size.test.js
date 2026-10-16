/**
 * Alert overlay content size (overlayContentSize in src/cards/lcards-alert-overlay.js).
 * With no size set, the built-in alert symbol used to get `width: auto`, which
 * collapsed it to 0 px inside the portal (only the blur showed): it now gets a
 * share of the screen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlayContentSize, DEFAULT_CONTENT_WIDTH, DEFAULT_SYMBOL_HEIGHT } from '../../src/cards/lcards-alert-overlay.js';

test('no size set: the alert symbol gets a share of the screen, never auto width', () => {
    assert.deepEqual(overlayContentSize({}, 'red_alert'), { width: DEFAULT_CONTENT_WIDTH, height: DEFAULT_SYMBOL_HEIGHT });
    assert.match(DEFAULT_CONTENT_WIDTH, /%$/);
    assert.match(DEFAULT_SYMBOL_HEIGHT, /%$/);
});

test('a width alone leaves the height to the content (the symbol keeps its aspect ratio)', () => {
    assert.deepEqual(overlayContentSize({ width: '500px' }, 'red_alert'), { width: '500px', height: 'auto' });
});

test('a custom content card keeps its own height', () => {
    const config = { conditions: { red_alert: { content: { type: 'markdown', content: 'x' } } } };
    assert.deepEqual(overlayContentSize(config, 'red_alert'), { width: DEFAULT_CONTENT_WIDTH, height: 'auto' });
});

test('per-condition values win over the card values, which win over the defaults', () => {
    const config = { width: '40%', height: '30%', conditions: { yellow_alert: { width: '300px' } } };
    assert.deepEqual(overlayContentSize(config, 'yellow_alert'), { width: '300px', height: '30%' });
    assert.deepEqual(overlayContentSize(config, 'red_alert'), { width: '40%', height: '30%' });
});
