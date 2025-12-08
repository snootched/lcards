/**
 * Schema Validation Utilities
 * 
 * JSON Schema validation helpers for the visual editor.
 */

/**
 * Validate configuration against JSON schema
 * @param {Object} config - Configuration object
 * @param {Object} schema - JSON Schema object
 * @returns {Array<Object>} Array of validation errors (empty if valid)
 */
export function validateAgainstSchema(config, schema) {
    const errors = [];
    
    if (!schema || !config) {
        return errors;
    }
    
    // Basic validation - this is a simplified validator
    // For production, consider using a library like ajv
    try {
        validateObject(config, schema, '', errors);
    } catch (err) {
        errors.push({
            path: '',
            message: `Schema validation error: ${err.message}`
        });
    }
    
    return errors;
}

/**
 * Validate an object against a schema
 * @private
 */
function validateObject(value, schema, path, errors) {
    // Check required properties
    if (schema.required && Array.isArray(schema.required)) {
        for (const requiredProp of schema.required) {
            if (!(requiredProp in value)) {
                errors.push({
                    path: path ? `${path}.${requiredProp}` : requiredProp,
                    message: `Missing required property: ${requiredProp}`
                });
            }
        }
    }
    
    // Check properties
    if (schema.properties) {
        for (const prop in value) {
            const propSchema = schema.properties[prop];
            if (propSchema) {
                const propPath = path ? `${path}.${prop}` : prop;
                validateValue(value[prop], propSchema, propPath, errors);
            }
        }
    }
}

/**
 * Validate a value against a schema
 * @private
 */
function validateValue(value, schema, path, errors) {
    // Type checking
    if (schema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        const expectedType = schema.type;
        
        if (actualType !== expectedType && value !== null && value !== undefined) {
            errors.push({
                path,
                message: `Expected type ${expectedType}, got ${actualType}`
            });
            return;
        }
    }
    
    // Enum checking
    if (schema.enum && Array.isArray(schema.enum)) {
        if (!schema.enum.includes(value)) {
            errors.push({
                path,
                message: `Value must be one of: ${schema.enum.join(', ')}`
            });
        }
    }
    
    // Object validation
    if (schema.type === 'object' && value && typeof value === 'object') {
        validateObject(value, schema, path, errors);
    }
    
    // Array validation
    if (schema.type === 'array' && Array.isArray(value)) {
        if (schema.items) {
            value.forEach((item, index) => {
                validateValue(item, schema.items, `${path}[${index}]`, errors);
            });
        }
    }
    
    // String validation
    if (schema.type === 'string' && typeof value === 'string') {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push({
                path,
                message: `String must be at least ${schema.minLength} characters`
            });
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push({
                path,
                message: `String must be at most ${schema.maxLength} characters`
            });
        }
        if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
                errors.push({
                    path,
                    message: `String must match pattern: ${schema.pattern}`
                });
            }
        }
    }
    
    // Number validation
    if (schema.type === 'number' && typeof value === 'number') {
        if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push({
                path,
                message: `Number must be at least ${schema.minimum}`
            });
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push({
                path,
                message: `Number must be at most ${schema.maximum}`
            });
        }
    }
}

/**
 * Get schema description for a property path
 * @param {Object} schema - JSON Schema
 * @param {string} path - Property path (e.g., "text.name.content")
 * @returns {string|null} Description text or null
 */
export function getSchemaDescription(schema, path) {
    if (!schema || !path) {
        return null;
    }
    
    const parts = path.split('.');
    let current = schema;
    
    for (const part of parts) {
        if (current.properties && current.properties[part]) {
            current = current.properties[part];
        } else {
            return null;
        }
    }
    
    return current.description || null;
}
