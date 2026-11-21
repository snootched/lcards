/**
 * DS6: MsdCardCoordinator.destroy() destroyed the shared core DataSourceManager,
 * so any MSD disconnect (edit mode, a view change) stopped every data source on
 * the page and the next initializeFromConfig threw "has been destroyed".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

installJsdom();
globalThis.window.lcards = { core: {}, debug: { msd: {} } }; // normally created by src/lcards-main.js
const { MsdCardCoordinator } = await import('../../src/msd/pipeline/MsdCardCoordinator.js');

test('destroy() leaves the shared DataSourceManager running', async () => {
    let destroyed = 0;
    const listeners = new Set();
    const dsm = {
        destroy: () => { destroyed++; },
        addEntityChangeListener: (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    };
    const coordinator = /** @type {any} */ (new MsdCardCoordinator());
    coordinator.dataSourceManager = dsm;
    dsm.addEntityChangeListener(() => {}); // another card's
    await coordinator.destroy();
    assert.equal(destroyed, 0, 'the shared manager is not destroyed');
    assert.equal(listeners.size, 1, 'other listeners stay (the MSD registers none since D3c M4)');
    assert.equal(coordinator.dataSourceManager, dsm, 'the shared reference stays');
});
