/**
 * DataSourceManager: data sources wait for a connected HASS. Core starts with a
 * stub HASS (no connection), and HA configures a card before giving it HASS, so a
 * card's data_sources can be created first (found with the S7 processor lab charts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DataSourceManager } from '../../src/core/data-sources/DataSourceManager.js';
import { createFakeHass } from '../helpers/fake-hass.js';

const STUB = { states: {}, services: {}, config: {}, user: { name: 'Loading...' }, connected: false };

test('createDataSource waits for a connected HASS, then starts on it', async () => {
    const manager = new DataSourceManager(STUB);
    let created = null;
    const pending = manager.createDataSource('temp', { entity: 'sensor.temp', history: { enabled: false } }, 'card-1')
        .then(source => { created = source; });
    await new Promise(r => setTimeout(r, 20));
    assert.equal(created, null, 'still waiting on the stub HASS');

    const hass = createFakeHass({ states: { 'sensor.temp': '21.5' } });
    manager.ingestHass(hass);
    await pending;
    assert.ok(created, 'created once HASS is connected');
    assert.equal(created.hass, hass);
    assert.ok(hass.connection.subs.some(s => s.message?.type === 'subscribe_events'), 'subscribed to state changes');
    assert.equal(created.buffer.last()?.v, 21.5);
});

test('two cards asking for the same source while waiting share one source', async () => {
    const manager = new DataSourceManager(STUB);
    const config = { entity: 'sensor.temp', history: { enabled: false } };
    const a = manager.createDataSource('temp', config, 'card-1');
    const b = manager.createDataSource('temp', config, 'card-2');
    manager.ingestHass(createFakeHass({ states: { 'sensor.temp': '20' } }));
    const [sa, sb] = await Promise.all([a, b]);
    assert.equal(sa, sb);
    assert.equal(manager.sources.size, 1);
});

test('with a connected HASS it creates right away', async () => {
    const manager = new DataSourceManager(createFakeHass({ states: { 'sensor.temp': '1' } }));
    const source = await manager.createDataSource('temp', { entity: 'sensor.temp', history: { enabled: false } });
    assert.ok(source);
});
