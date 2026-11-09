/**
 * The manual YAML of every helper starts it at the panel's default (D2 batch 6:
 * the sound switches and volume had no initial, so hand-made helpers started
 * silent).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import * as registry from '../../src/core/helpers/lcards-helper-registry.js';

const defs = Object.values(registry).find((v) => v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).some((d) => d?.yaml_config));

test('input_boolean and input_number YAML carry the default as initial', () => {
    const missing = [];
    for (const [key, d] of Object.entries(defs)) {
        if (!['input_boolean', 'input_number'].includes(d.domain) || d.default_value === undefined || !d.yaml_config) continue;
        const doc = YAML.parse(d.yaml_config);
        const conf = doc?.[d.domain]?.[d.entity_id.split('.')[1]];
        if (conf?.initial === undefined) missing.push(key);
        else if (conf.initial !== d.default_value) missing.push(`${key}: initial ${conf.initial} != default ${d.default_value}`);
    }
    assert.deepEqual(missing, []);
});
