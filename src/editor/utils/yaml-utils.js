/**
 * YAML Utilities for Editor
 * 
 * Provides YAML <-> JSON conversion utilities for the visual editor.
 */

import YAML from 'yaml';

/**
 * Convert configuration object to YAML string
 * @param {Object} config - Configuration object
 * @returns {string} YAML string
 */
export function configToYaml(config) {
    if (!config) {
        return '';
    }
    
    try {
        return YAML.stringify(config, {
            indent: 2,
            lineWidth: 0, // Disable line wrapping
            minContentWidth: 0
        });
    } catch (err) {
        console.error('[LCARdS Editor] Error converting config to YAML:', err);
        return '# Error converting config to YAML\n' + JSON.stringify(config, null, 2);
    }
}

/**
 * Convert YAML string to configuration object
 * @param {string} yamlStr - YAML string
 * @returns {Object} Configuration object
 * @throws {Error} If YAML parsing fails
 */
export function yamlToConfig(yamlStr) {
    if (!yamlStr || typeof yamlStr !== 'string') {
        return {};
    }
    
    try {
        const config = YAML.parse(yamlStr);
        return config || {};
    } catch (err) {
        throw new Error(`YAML parse error: ${err.message}`);
    }
}

/**
 * Validate YAML syntax without parsing
 * @param {string} yamlStr - YAML string
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateYaml(yamlStr) {
    try {
        YAML.parse(yamlStr);
        return { valid: true, error: null };
    } catch (err) {
        return { 
            valid: false, 
            error: err.message,
            lineNumber: err.linePos?.[0]?.line
        };
    }
}
