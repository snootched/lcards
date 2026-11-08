/**
 * Borg intro where the browser cannot draw it (D2 batch 5 audit): without
 * OffscreenCanvas or Worker the effect drew nothing, but the manager still
 * made the canvas slot clickable and waited for a click, so the invisible
 * slot swallowed the first click on the dashboard. The intro is now skipped.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BorgAssimilationManager } from '../../src/core/borg/BorgAssimilationManager.js';
import { borgIntroSupported } from '../../src/core/screen-effects/effects/BorgAssimilationEffect.js';

test('without OffscreenCanvas the intro is skipped: no click-wait, persistent layers apply', async () => {
    assert.equal(borgIntroSupported(), false, 'node has no OffscreenCanvas: the unsupported path');
    const applied = [];
    const sem = {
        apply: (p) => applied.push(['apply', p]),
        applySlot: (slot, p) => applied.push([slot, p]),
        clearSlot: () => {},
        clear: () => {},
        portal: { querySelector: () => { throw new Error('the canvas slot must not be made clickable'); } },
    };
    window.lcards = { core: { screenEffectManager: sem, soundManager: { play() {}, playSource() {} } } };
    const bam = new BorgAssimilationManager();
    // duration 0 = wait for a click: without the fix this never resolves
    const done = bam.assimilate({ fontSwap: false, duration: 0, sound: 'none' });
    const result = await Promise.race([done.then(() => 'done'), new Promise(r => setTimeout(() => r('hung'), 500))]);
    assert.equal(result, 'done');
    assert.ok(!applied.some(([k]) => k === 'apply'), 'borg-assimilation intro not started');
    assert.ok(applied.some(([slot]) => slot === 'canvas'), 'persistent layers still applied');
    await bam.deassimilate({ withOutro: false, sound: 'none' });
});

test('a real disconnect passes the "Borg font replacement" setting (fontSwap) like the Test button', async () => {
    const { ConnectionOverlayService } = await import('../../src/core/services/ConnectionOverlayService.js');
    const calls = [];
    window.lcards = { core: { borgAssimilationManager: { assimilate: (o) => calls.push(o) } } };
    const svc = new ConnectionOverlayService();
    svc._configLoaded = true;
    svc._config = { ...svc._config, enabled: true, message: { ...svc._config.message, mode: 'borg',
        borgLayers: { canvas: { siteCount: 3 }, paletteHue: 90, fontSwap: false } } };
    svc._onDisconnected();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].fontSwap, false);
    assert.equal(calls[0].paletteHue, 90);
    assert.deepEqual(calls[0].intro, { canvas: { siteCount: 3 } }, 'fontSwap is not left in the intro layers');
});
