/**
 * The minimum supported Home Assistant version lives in three places:
 * const.py MIN_HA_VERSION (the integration refuses to set up below it),
 * hacs.json "homeassistant" (HACS refuses to install below it) and
 * support-info-format.js MIN_HA_VERSION (the Welcome tab health check).
 * They must agree. The manifest carries no minimum (custom integrations
 * cannot declare one there), which this test also pins.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MIN_HA_VERSION } from '../../src/utils/support-info-format.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function constPyMinimum() {
    const m = read('custom_components/lcards/const.py').match(/^MIN_HA_VERSION\s*=\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/m);
    assert.ok(m, 'const.py defines MIN_HA_VERSION = (major, minor)');
    return [Number(m[1]), Number(m[2])];
}

test('const.py, hacs.json and support-info-format.js name the same minimum Home Assistant', () => {
    const py = constPyMinimum();
    const hacs = JSON.parse(read('hacs.json')).homeassistant;
    assert.match(hacs, /^\d+\.\d+\.\d+$/, 'hacs.json "homeassistant" is a full version');
    const [major, minor, patch] = hacs.split('.').map(Number);

    assert.deepEqual(MIN_HA_VERSION, py, 'support-info-format.js MIN_HA_VERSION matches const.py');
    assert.deepEqual([major, minor], py, 'hacs.json "homeassistant" matches const.py');
    assert.equal(patch, 0, 'hacs.json minimum is the first release of that month');
});

test('manifest.json carries no Home Assistant minimum of its own', () => {
    const manifest = JSON.parse(read('custom_components/lcards/manifest.json'));
    assert.equal(manifest.homeassistant, undefined);
});
