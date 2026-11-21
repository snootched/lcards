/**
 * AnimationManager (D3b): on_datasource_change fires. The DataSourceManager lives
 * on window.lcards.core, not on the CoreSystemsManager the manager is built with
 * (it has none), so the listener used to bail out with "DataSourceManager not available".
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const MODULE = process.env.LCARDS_AM_MODULE || '../../src/core/animation/AnimationManager.js';
const { AnimationManager } = await import(MODULE);

/** A DataSource stand-in: subscribe() hydrates the new subscriber like the real one. */
function fakeSource(current) {
    const subscribers = new Set();
    return {
        current,
        getCurrentData() { return this.current; },
        subscribe(cb) {
            subscribers.add(cb);
            cb(this.current); // hydration (the real DataSource defers it with setTimeout)
            return () => subscribers.delete(cb);
        },
        emit(point) {
            this.current = point;
            for (const cb of subscribers) cb(point);
        },
    };
}

/** A manager built like LCARdSCore builds it: with a systems manager that has no dataSourceManager. */
function coreManager() {
    const am = new AnimationManager({ getHass: () => null });
    const played = [];
    am.playAnimation = async (overlayId, def) => { played.push({ overlayId, def }); return null; };
    return { am, played };
}

describe('on_datasource_change', () => {
    let savedCore;
    beforeEach(() => {
        window.lcards = window.lcards || {};
        savedCore = window.lcards.core;
    });
    afterEach(() => { window.lcards.core = savedCore; });

    it('subscribes through window.lcards.core.dataSourceManager and plays on a change, not on hydration', () => {
        const source = fakeSource({ t: 1, v: 20 });
        window.lcards.core = { dataSourceManager: { getSource: (name) => (name === 'temp' ? source : undefined) } };
        const { am, played } = coreManager();
        const def = { trigger: 'on_datasource_change', datasource: 'temp', preset: 'pulse' };

        am.setupDatasourceListenerForAnimation('ov1', def);
        assert.equal(am.datasourceSubscriptions.size, 1, 'subscribed');
        assert.equal(played.length, 0, 'hydration with the current point is not a change');

        source.emit({ t: 2, v: 21 });
        assert.equal(played.length, 1);
        assert.equal(played[0].overlayId, 'ov1');
        assert.equal(played[0].def, def);

        am.dispose();
    });

    it('resolveDatasourceParams reads the current value (v) from the core manager', async () => {
        const source = fakeSource({ t: 1, v: 42 });
        window.lcards.core = { dataSourceManager: { getSource: () => source } };
        const am = new AnimationManager({ getHass: () => null });
        const resolved = await am.resolveDatasourceParams({ datasource: 'temp', label: 'T {{ datasource.value }}' });
        assert.equal(resolved.label, 'T 42');
        am.dispose();
    });
});
