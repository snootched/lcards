/**
 * What the alert overlay shows per condition (src/cards/alert-overlay-config.js),
 * shared by the card and the Alert Studio's mock screen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    displayFor, buildContentConfig, resolveLayers, bandLayers, overlayPosition, ALERT_CONDITION_KEYS, CONDITION_DEFAULTS,
} from '../../src/cards/alert-overlay-config.js';

test('every condition has a built-in default', () => {
    assert.deepEqual(Object.keys(CONDITION_DEFAULTS), [...ALERT_CONDITION_KEYS]);
});

test('display: the condition, then the card, then overlay', () => {
    assert.equal(displayFor({}, 'red_alert'), 'overlay');
    assert.equal(displayFor({ display: 'band' }, 'red_alert'), 'band');
    assert.equal(displayFor({ display: 'band', conditions: { red_alert: { display: 'overlay' } } }, 'red_alert'), 'overlay');
    assert.equal(displayFor({ display: 'band', conditions: { red_alert: { display: 'overlay' } } }, 'yellow_alert'), 'band');
});

test('content: a custom card wins; else the symbol with the alert_button overrides; else the built-in symbol', () => {
    const custom = { type: 'markdown', content: 'hi' };
    assert.equal(buildContentConfig({ conditions: { red_alert: { content: custom } } }, 'red_alert'), custom);
    const plain = buildContentConfig({}, 'yellow_alert');
    assert.equal(plain.preset, 'condition_yellow');
    assert.equal(plain.text.sub_text.content, 'CONDITION: YELLOW');
    const patched = buildContentConfig({ conditions: { red_alert: { alert_button: { text: { sub_text: { content: 'SHIELDS' }, extra: { content: 'x' } }, speed: 2 } } } }, 'red_alert');
    assert.equal(patched.text.sub_text.content, 'SHIELDS');
    assert.equal(patched.text.alert_text.content, 'ALERT');
    assert.deepEqual(patched.text.extra, { content: 'x' });
    assert.deepEqual(patched.animations.map((a) => a.params.duration), [1000, 1000]);
    assert.equal(buildContentConfig({}, 'green_alert'), null);
});

test('a band symbol follows the band speed unless alert_button.speed is set', () => {
    assert.deepEqual(buildContentConfig({ display: 'band', band: { speed: 2 } }, 'red_alert').animations.map((a) => a.params.duration), [1000, 1000]);
    assert.equal(buildContentConfig({ band: { speed: 2 } }, 'red_alert').animations, undefined, 'an overlay ignores the band speed');
});

test('layers: condition slots over card slots over the default blur; a band only shows layers the config sets', () => {
    assert.deepEqual(resolveLayers({}, 'red_alert'), { backdrop: { preset: 'blur', amount: '8px' }, color: null, canvas: null });
    const cfg = { layers: { backdrop: { preset: 'blur', amount: '4px' }, color: { preset: 'color-tint', color: 'red' } }, conditions: { red_alert: { layers: { color: null } } } };
    assert.deepEqual(resolveLayers(cfg, 'red_alert'), { backdrop: { preset: 'blur', amount: '4px' }, color: null, canvas: null });
    assert.equal(resolveLayers(cfg, 'yellow_alert').color.color, 'red');
    assert.equal(bandLayers({}, 'red_alert'), null);
    assert.ok(bandLayers(cfg, 'red_alert'));
    assert.equal(resolveLayers({ backdrop: { color: 'rgba(0,0,0,0.5)', opacity: 0.5 } }, 'red_alert').color.color, 'rgba(0,0,0,0.25)', 'legacy backdrop folds opacity into alpha');
});

// ── layers: null and the per-condition legacy backdrop (2026-11-07) ──
// Before, `layers: null` fell through to the default 8px blur (the schema says it
// turns every layer off), and conditions.<key>.backdrop was ignored.
test('layers: null turns every layer off, on the overlay and the band', () => {
    const off = { backdrop: null, color: null, canvas: null };
    assert.deepEqual(resolveLayers({ layers: null }, 'red_alert'), off);
    assert.deepEqual(resolveLayers({ layers: null, backdrop: { blur: '20px' } }, 'red_alert'), off, 'layers wins over the legacy backdrop');
    const band = bandLayers({ layers: null, display: 'band' }, 'red_alert');
    assert.ok(band === null || JSON.stringify(band) === JSON.stringify(off));
    // A condition can still turn a slot back on.
    assert.deepEqual(resolveLayers({ layers: null, conditions: { red_alert: { layers: { canvas: { preset: 'static' } } } } }, 'red_alert'),
        { backdrop: null, color: null, canvas: { preset: 'static' } });
});

test('a per-condition legacy backdrop migrates to that condition\'s backdrop and color slots', () => {
    const cfg = { layers: { canvas: { preset: 'scanlines' } }, conditions: { red_alert: { backdrop: { blur: '20px' } } } };
    assert.deepEqual(resolveLayers(cfg, 'red_alert'), { backdrop: { preset: 'blur', amount: '20px' }, color: null, canvas: { preset: 'scanlines' } });
    assert.deepEqual(resolveLayers(cfg, 'yellow_alert'), { backdrop: null, color: null, canvas: { preset: 'scanlines' } }, 'other conditions keep the card layers');
    assert.equal(resolveLayers({ conditions: { red_alert: { backdrop: { color: 'rgba(0,0,0,0.5)', opacity: 0.5 } } } }, 'red_alert').color.color, 'rgba(0,0,0,0.25)');
    assert.ok(bandLayers({ conditions: { red_alert: { backdrop: { blur: '20px' } } } }, 'red_alert'), 'a band shows a per-condition backdrop');
    // The condition's layers win over its own legacy backdrop, slot by slot.
    const both = { conditions: { red_alert: { backdrop: { blur: '20px' }, layers: { color: { preset: 'vignette' } } } } };
    assert.deepEqual(resolveLayers(both, 'red_alert'), { backdrop: { preset: 'blur', amount: '20px' }, color: { preset: 'vignette' }, canvas: null });
});

test('position: the condition, then the card, then centre', () => {
    assert.equal(overlayPosition({}, 'red_alert'), 'center');
    assert.equal(overlayPosition({ position: 'top', conditions: { red_alert: { position: 'bottom' } } }, 'red_alert'), 'bottom');
});

// ── alert_button: a deep-merged patch, card level then condition (2026-11-06) ──
// Before, only text content, alert and speed were applied: any other key the docs
// and schema promised (text colours and fonts, style, animations, ...) was dropped.

import { builtInSymbol, symbolPatch, mergePatch, patchDiff } from '../../src/cards/alert-overlay-config.js';

test('alert_button honours every lcards-button key: whole text fields, style, sounds', () => {
    const card = buildContentConfig({ conditions: { red_alert: { alert_button: {
        text: { sub_text: { color: 'white', font_size: 30 } },
        style: { card: { color: { background: { default: 'black' } } } },
        sounds: { tap: 'none' },
    } } } }, 'red_alert');
    assert.deepEqual(card.text.sub_text, { content: 'CONDITION: RED', color: 'white', font_size: 30 }, 'the default text stays, the field settings apply');
    assert.equal(card.style.card.color.background.default, 'black');
    assert.deepEqual(card.sounds, { tap: 'none' });
});

test('the card-level alert_button applies to every condition; a condition patches over it', () => {
    const config = {
        alert_button: { text: { sub_text: { content: 'ALL HANDS' }, alert_text: { font_size: 40 } } },
        conditions: { yellow_alert: { alert_button: { text: { sub_text: { content: 'SHIELDS' } } } } },
    };
    const red = buildContentConfig(config, 'red_alert');
    const yellow = buildContentConfig(config, 'yellow_alert');
    assert.equal(red.text.sub_text.content, 'ALL HANDS');
    assert.equal(yellow.text.sub_text.content, 'SHIELDS');
    assert.equal(yellow.text.alert_text.font_size, 40, 'the card level reaches a condition with its own patch');
    assert.deepEqual([red.preset, yellow.preset], ['condition_red', 'condition_yellow'], 'each condition keeps its preset (its colours)');
});

test('type, component and preset in alert_button are not applied', () => {
    const card = buildContentConfig({ alert_button: { type: 'custom:x', component: 'other', preset: 'lozenge' } }, 'blue_alert');
    assert.deepEqual([card.type, card.component, card.preset], ['custom:lcards-button', 'alert', 'condition_blue']);
});

test('speed: condition over card; an animation of the same id set in the patch wins', () => {
    assert.deepEqual(buildContentConfig({ alert_button: { speed: 2 } }, 'red_alert').animations.map((a) => a.params.duration), [1000, 1000]);
    assert.deepEqual(buildContentConfig({ alert_button: { speed: 2 }, conditions: { red_alert: { alert_button: { speed: 4 } } } }, 'red_alert').animations.map((a) => a.params.duration), [500, 500]);
    const own = buildContentConfig({ alert_button: { speed: 2, animations: [{ id: 'bars-top-sweep', params: { duration: 300 } }] } }, 'red_alert').animations;
    assert.deepEqual(own.map((a) => [a.id, a.params.duration]), [['bars-top-sweep', 300], ['bars-bottom-sweep', 1000]]);
});

test('existing configs: the documented keys give what they gave before', () => {
    const card = buildContentConfig({ conditions: { blue_alert: { alert_button: {
        text: { sub_text: { content: 'SECURITY LOCKDOWN IN PROGRESS' } }, alert: { color: { shape: 'red' } },
    } } } }, 'blue_alert');
    assert.deepEqual(card, {
        type: 'custom:lcards-button', component: 'alert', preset: 'condition_blue',
        text: { alert_text: { content: 'ALERT' }, sub_text: { content: 'SECURITY LOCKDOWN IN PROGRESS' } },
        alert: { color: { shape: 'red' } },
    });
});

test('patchDiff gives back what an edit changed; mergePatch of it restores the edit', () => {
    const base = mergePatch(builtInSymbol('red_alert'), symbolPatch({ alert_button: { text: { sub_text: { content: 'ALL' } } } }, 'red_alert'));
    const edited = mergePatch(base, { text: { sub_text: { color: 'white' } }, style: { x: 1 } });
    const diff = patchDiff(edited, base);
    assert.deepEqual(diff, { text: { sub_text: { color: 'white' } }, style: { x: 1 } });
    assert.deepEqual(mergePatch(base, diff), edited);
    assert.equal(patchDiff(base, base), undefined);
});
