/**
 * Schema Helper Utilities
 *
 * Shared utilities for working with JSON Schema in visual editors.
 * Provides schema navigation, format/type checking, and label formatting.
 *
 * @module utils/schema-helpers
 */

/**
 * Navigate to a nested schema property by dot-notation path
 * @param {Object} schema - Root schema object
 * @param {string} path - Dot-notation path (e.g., 'style.color.border')
 * @returns {Object|null} Schema object for property, or null if not found
 *
 * @example
 * const borderSchema = getSchemaAtPath(schema, 'style.color.border');
 */
export function getSchemaAtPath(schema, path) {
    if (!schema || !path) return null;

    const keys = path.split('.');
    let currentSchema = schema;

    for (const key of keys) {
        // Check if current schema has the property directly
        if (!currentSchema.properties || !currentSchema.properties[key]) {
            // If current schema is a oneOf, try to find an object branch that has this property
            if (Array.isArray(currentSchema.oneOf)) {
                // Look for an object branch that has properties
                const objectBranch = currentSchema.oneOf.find(
                    branch => branch.type === 'object' && branch.properties && branch.properties[key]
                );

                if (objectBranch) {
                    // Navigate into the oneOf object branch
                    currentSchema = objectBranch.properties[key];
                    continue;
                }
            }

            // Property not found
            return null;
        }

        currentSchema = currentSchema.properties[key];
    }

    return currentSchema;
}

/**
 * Check if schema property has a specific format
 * @param {Object} propertySchema - Property schema object
 * @param {string} format - Format to check (e.g., 'entity', 'color', 'action')
 * @returns {boolean}
 *
 * @example
 * if (hasFormat(schema, 'entity')) render entity picker
 */
export function hasFormat(propertySchema, format) {
    // Direct format check
    if (propertySchema?.format === format) {
        return true;
    }

    // Check oneOf array (use first option that has the format)
    if (Array.isArray(propertySchema?.oneOf)) {
        return propertySchema.oneOf.some(option => option.format === format);
    }

    return false;
}

/**
 * Check if schema property is of a specific type
 * @param {Object} propertySchema - Property schema object
 * @param {string} type - Type to check (e.g., 'string', 'number', 'boolean', 'array', 'object')
 * @returns {boolean}
 *
 * @example
 * if (isType(schema, 'boolean')) render checkbox
 */
export function isType(propertySchema, type) {
    // Direct type check
    if (propertySchema?.type === type) {
        return true;
    }

    // Check oneOf array (use first option that has the type)
    if (Array.isArray(propertySchema?.oneOf)) {
        return propertySchema.oneOf.some(option => option.type === type);
    }

    return false;
}

/**
 * Check if schema property has an enum (options list)
 * @param {Object} propertySchema - Property schema object
 * @returns {boolean}
 *
 * @example
 * if (hasEnum(schema)) render select dropdown
 */
export function hasEnum(propertySchema) {
    // Direct enum check
    if (Array.isArray(propertySchema?.enum) && propertySchema.enum.length > 0) {
        return true;
    }

    // Check oneOf array (use first option that has enum)
    if (Array.isArray(propertySchema?.oneOf)) {
        return propertySchema.oneOf.some(option =>
            Array.isArray(option.enum) && option.enum.length > 0
        );
    }

    return false;
}

/**
 * Check if schema property is a position enum (for graphical picker)
 * @param {Object} propertySchema - Property schema object
 * @returns {boolean}
 *
 * @example
 * if (isPositionEnum(schema)) render position picker
 */
export function isPositionEnum(propertySchema) {
    if (!hasEnum(propertySchema)) return false;

    const enum_values = propertySchema.enum;
    const position_values = ['top-left', 'top-center', 'top-right', 'left-center', 'center', 'right-center', 'bottom-left', 'bottom-center', 'bottom-right', 'top', 'bottom', 'left', 'right'];

    // Check if enum contains position values
    return enum_values && enum_values.some(val => position_values.includes(val));
}

/**
 * Get enum options with labels
 * @param {Object} propertySchema - Property schema object
 * @returns {Array<{value: *, label: string}>} Array of option objects
 *
 * @example
 * const options = getEnumOptions(schema);
 * // Returns: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]
 */
export function getEnumOptions(propertySchema) {
    if (!hasEnum(propertySchema)) {
        return [];
    }

    return propertySchema.enum.map(value => ({
        value,
        label: propertySchema['x-enum-labels']?.[value] || formatLabel(String(value))
    }));
}

/**
 * Format a string as a human-readable label
 * Converts snake_case, kebab-case, and camelCase to Title Case
 *
 * @param {string} str - String to format
 * @returns {string} Formatted label
 *
 * @example
 * formatLabel('grid_columns') // Returns: 'Grid Columns'
 * formatLabel('border-color') // Returns: 'Border Color'
 * formatLabel('backgroundColor') // Returns: 'Background Color'
 */
export function formatLabel(str) {
    if (!str) return '';

    // Handle camelCase
    let formatted = str.replace(/([A-Z])/g, ' $1');

    // Handle snake_case and kebab-case
    formatted = formatted.replace(/[-_]/g, ' ');

    // Capitalize first letter of each word
    formatted = formatted
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();

    return formatted;
}

/**
 * Get effective label for a schema property
 * Priority: explicit label param > schema title > formatted path
 *
 * @param {Object} propertySchema - Property schema object
 * @param {string} path - Dot-notation path (used as fallback)
 * @param {string} [explicitLabel] - Optional explicit label override
 * @returns {string} Effective label to display
 *
 * @example
 * getEffectiveLabel(schema, 'style.color', 'My Color') // Returns: 'My Color'
 * getEffectiveLabel(schema, 'style.color') // Returns schema.title or 'Style Color'
 */
export function getEffectiveLabel(propertySchema, path, explicitLabel) {
    if (explicitLabel) return explicitLabel;
    if (propertySchema?.title) return propertySchema.title;

    // Format path as label
    const lastKey = path.split('.').pop();
    return formatLabel(lastKey);
}

/**
 * Get effective helper text for a schema property
 * Priority: explicit helper param > schema description
 *
 * @param {Object} propertySchema - Property schema object
 * @param {string} [explicitHelper] - Optional explicit helper text override
 * @returns {string} Effective helper text
 *
 * @example
 * getEffectiveHelper(schema, 'Custom help text') // Returns: 'Custom help text'
 * getEffectiveHelper(schema) // Returns schema.description or ''
 */
export function getEffectiveHelper(propertySchema, explicitHelper) {
    return explicitHelper || propertySchema?.description || '';
}

/**
 * Check if property is required in schema
 * @param {Object} parentSchema - Parent schema object containing 'required' array
 * @param {string} propertyName - Name of the property to check
 * @returns {boolean}
 *
 * @example
 * if (isRequired(schema, 'entity')) show required indicator
 */
export function isRequired(parentSchema, propertyName) {
    return Array.isArray(parentSchema?.required) &&
           parentSchema.required.includes(propertyName);
}

/**
 * Get default value for a schema property
 * @param {Object} propertySchema - Property schema object
 * @returns {*} Default value from schema, or type-appropriate default
 *
 * @example
 * const defaultValue = getDefaultValue(schema); // Returns schema.default or type-based default
 */
export function getDefaultValue(propertySchema) {
    if (propertySchema?.default !== undefined) {
        return propertySchema.default;
    }

    // Type-based defaults
    switch (propertySchema?.type) {
        case 'boolean':
            return false;
        case 'number':
        case 'integer':
            return propertySchema.minimum !== undefined ? propertySchema.minimum : 0;
        case 'string':
            return '';
        case 'array':
            return [];
        case 'object':
            return {};
        default:
            return undefined;
    }
}

/**
 * Get validation constraints for a schema property
 * @param {Object} propertySchema - Property schema object
 * @returns {Object} Object containing validation constraints
 *
 * @example
 * const constraints = getValidationConstraints(schema);
 * // Returns: { min: 0, max: 100, step: 1, pattern: '...' }
 */
export function getValidationConstraints(propertySchema) {
    if (!propertySchema) return {};

    const constraints = {};

    // Numeric constraints
    if (propertySchema.minimum !== undefined) {
        constraints.min = propertySchema.minimum;
    }
    if (propertySchema.maximum !== undefined) {
        constraints.max = propertySchema.maximum;
    }
    if (propertySchema.multipleOf !== undefined) {
        constraints.step = propertySchema.multipleOf;
    }

    // String constraints
    if (propertySchema.minLength !== undefined) {
        constraints.minLength = propertySchema.minLength;
    }
    if (propertySchema.maxLength !== undefined) {
        constraints.maxLength = propertySchema.maxLength;
    }
    if (propertySchema.pattern !== undefined) {
        constraints.pattern = propertySchema.pattern;
    }

    // Array constraints
    if (propertySchema.minItems !== undefined) {
        constraints.minItems = propertySchema.minItems;
    }
    if (propertySchema.maxItems !== undefined) {
        constraints.maxItems = propertySchema.maxItems;
    }

    return constraints;
}
