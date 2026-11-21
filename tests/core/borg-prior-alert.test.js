/**
 * D3b decision: deassimilate() restores the alert mode that was active before
 * assimilation (it always went to green_alert). No recorded mode, or a prior
 * mode that was itself a Borg alert, falls back to green_alert; a second
 * assimilate() while assimilated keeps the first recorded mode.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BorgAssimilationManager } from '../../src/core/borg/BorgAssimilationManager.js';

/** @type {string[]} */
let modes;
/** A ThemeManager stand-in: setAlertMode records and switches the current mode. */
function themeManager(current) {
    return {
        currentAlertMode: current,
        getAlertMode() { return this.currentAlertMode; },
        async setAlertMode(mode) { modes.push(mode); this.currentAlertMode = mode; },
    };
}

beforeEach(() => { modes = []; });

/** Assimilate (no effects, no font) from `prior`, run `between`, deassimilate. */
async function run(prior, between = async () => {}) {
    const tm = themeManager(prior);
    window.lcards = { core: { themeManager: tm } };
    const bam = new BorgAssimilationManager();
    await bam.assimilate({ fontSwap: false, persistentLayers: {}, sound: 'none' });
    await between(bam, tm);
    await bam.deassimilate({ withOutro: false, sound: 'none' });
    return tm.currentAlertMode;
}

test('deassimilate restores the alert mode that was active before', async () => {
    assert.equal(await run('red_alert'), 'red_alert');
    assert.deepEqual(modes, ['borg_alert', 'red_alert']);
});

test('green before stays green', async () => {
    assert.equal(await run('green_alert'), 'green_alert');
});

test('no recorded mode falls back to green_alert', async () => {
    assert.equal(await run(undefined), 'green_alert');
    assert.equal(await run(null), 'green_alert');
    assert.equal(await run(''), 'green_alert');
});

test('a Borg alert as the prior mode falls back to green_alert', async () => {
    assert.equal(await run('borg_alert'), 'green_alert');
});

test('assimilate twice keeps the first prior mode', async () => {
    const restored = await run('yellow_alert', async (bam, tm) => {
        tm.currentAlertMode = 'blue_alert';    // something changes the mode while assimilated
        await bam.assimilate({ fontSwap: false, persistentLayers: {}, sound: 'none' });
    });
    assert.equal(restored, 'yellow_alert');
});

test('the next assimilation records afresh', async () => {
    const tm = themeManager('red_alert');
    window.lcards = { core: { themeManager: tm } };
    const bam = new BorgAssimilationManager();
    const opts = { fontSwap: false, persistentLayers: {}, sound: 'none' };
    await bam.assimilate(opts);
    await bam.deassimilate({ withOutro: false, sound: 'none' });
    tm.currentAlertMode = 'blue_alert';
    await bam.assimilate(opts);
    await bam.deassimilate({ withOutro: false, sound: 'none' });
    assert.equal(tm.currentAlertMode, 'blue_alert');
});
