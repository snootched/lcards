/**
 * Button Component Schemas
 * 
 * Schemas for component-based button configurations.
 * Components are complex, multi-segment interactive elements like dpads, sliders, etc.
 */

/**
 * Get dpad component schema
 * @returns {Object} D-pad component schema
 */
export function getDpadComponentSchema() {
    // Define the dpad segment configuration
    const dpadSegmentSchema = {
        type: 'object',
        description: 'Configuration for a single dpad segment',
        properties: {
            entity: {
                type: 'string',
                format: 'entity',
                description: 'Override entity for this segment (inherits card entity if omitted)'
            },
            tap_action: { $ref: '#/definitions/action' },
            hold_action: { $ref: '#/definitions/action' },
            double_tap_action: { $ref: '#/definitions/action' },
            style: { $ref: '#/definitions/segmentStyle' },
            animations: {
                type: 'array',
                description: 'Segment animations triggered by user interactions or entity state changes',
                items: { $ref: '#/definitions/animation' }
            }
        }
    };

    return {
        dpad: {
            type: 'object',
            description: 'D-pad component configuration with 9 interactive segments',
            properties: {
                segments: {
                    type: 'object',
                    description: 'Configuration for each dpad segment',
                    properties: {
                        // Directional segments
                        up: dpadSegmentSchema,
                        down: dpadSegmentSchema,
                        left: dpadSegmentSchema,
                        right: dpadSegmentSchema,
                        // Diagonal segments
                        'up-left': dpadSegmentSchema,
                        'up-right': dpadSegmentSchema,
                        'down-left': dpadSegmentSchema,
                        'down-right': dpadSegmentSchema,
                        // Center segment
                        center: dpadSegmentSchema
                    }
                }
            }
        }
    };
}

/**
 * Get component property schema
 * @returns {Object} Component property schema
 */
export function getComponentPropertySchema() {
    return {
        component: {
            type: 'string',
            enum: ['dpad'],
            description: 'Component preset name (dpad for directional control)'
        }
    };
}

/**
 * Get all component schemas merged
 * @returns {Object} All component schemas
 */
export function getButtonComponentSchemas() {
    return {
        ...getComponentPropertySchema(),
        ...getDpadComponentSchema()
    };
}
