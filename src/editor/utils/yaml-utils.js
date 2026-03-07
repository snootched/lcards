/**
 * @fileoverview YAML utilities for the visual editor.
 *
 * Wraps js-yaml for YAML/object serialisation (`configToYaml` / `yamlToConfig`).
 */

import yaml from 'js-yaml';
import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Convert config object to YAML string
 * @param {Object} config - Configuration object
 * @returns {string} YAML string
 */
export function configToYaml(config) {
    try {
        return yaml.dump(config, {
            indent: 2,
            lineWidth: -1, // No line wrapping
            noRefs: true,  // Disable anchors/aliases for cleaner output
            sortKeys: false // Preserve property order
        });
    } catch (error) {
        lcardsLog.error('[yaml-utils] Failed to convert config to YAML:', error);
        return '';
    }
}

/**
 * Convert YAML string to config object
 * @param {string} yamlStr - YAML string
 * @returns {Object} Configuration object
 */
export function yamlToConfig(yamlStr) {
    try {
        return yaml.load(yamlStr, {
            schema: yaml.DEFAULT_SCHEMA,
            json: true // Use JSON-compatible parsing
        }) || {};
    } catch (error) {
        lcardsLog.error('[yaml-utils] Failed to parse YAML:', error);
        throw error; // Re-throw for error handling in editor
    }
}

/**
 * Validate YAML syntax without parsing to object
 * @param {string} yamlStr - YAML string to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateYaml(yamlStr) {
    try {
        yaml.load(yamlStr);
        return { valid: true, error: null };
    } catch (error) {
        return {
            valid: false,
            error: error.message,
            lineNumber: error.mark?.line
        };
    }
}
