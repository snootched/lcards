/**
 * The helper registry's `yaml_config` (the YAML users paste into
 * configuration.yaml, also from helperManager.generateYAML()) must read in Home
 * Assistant, which loads YAML 1.1: there an unquoted `off` is the boolean false,
 * so the transition-style helper's option became "False" and `initial: off`
 * never matched an option (2026-11-07).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import { HELPER_REGISTRY, generateHelpersYAML } from '../../src/core/helpers/lcards-helper-registry.js';
import { yaml11Differences } from '../../scripts/lib/yaml-11.js';

const read11 = (/** @type {string} */ text) => YAML.parse(text, { version: '1.1', logLevel: 'silent' });

test('every helper yaml_config reads the same in YAML 1.1 as in YAML 1.2', () => {
    for (const [key, helper] of Object.entries(HELPER_REGISTRY)) {
        if (!helper.yaml_config) continue;
        assert.deepEqual(yaml11Differences(helper.yaml_config), [], `${key}: yaml_config differs under YAML 1.1`);
    }
    assert.deepEqual(yaml11Differences(generateHelpersYAML()), []);
});

test('input_select yaml_config: the options and initial value Home Assistant reads match the helper', () => {
    for (const [key, helper] of Object.entries(HELPER_REGISTRY)) {
        if (helper.domain !== 'input_select' || !helper.yaml_config) continue;
        const [, entry] = Object.entries(read11(helper.yaml_config).input_select)[0];
        assert.deepEqual(entry.options, helper.ws_create_params.options, `${key}: options`);
        if (entry.initial !== undefined) {
            assert.equal(typeof entry.initial, 'string', `${key}: initial is a string`);
            assert.ok(entry.options.includes(entry.initial), `${key}: initial is one of the options`);
        }
    }
});
