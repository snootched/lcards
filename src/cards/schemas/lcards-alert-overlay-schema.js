/**
 * Alert Overlay Card Schema
 *
 * JSON schema for lcards-alert-overlay card validation.
 * Uses shared schema components from common-schemas.js for consistency.
 */

export const alertOverlaySchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://github.com/snootched/lcards/schemas/alert-overlay-schema',
    title: 'LCARdS Alert Overlay',
    description: 'Full-screen alert overlay card that reacts to the lcards_alert_mode input_select',
    type: 'object',
    properties: {
        type: {
            type: 'string',
            const: 'custom:lcards-alert-overlay',
        },
        dismiss_mode: {
            type: 'string',
            enum: ['dismiss', 'reset'],
            description: 'dismiss = hide overlay only; reset = also set alert_mode back to green_alert',
            default: 'dismiss',
        },
        backdrop: {
            type: 'object',
            description: 'Global backdrop styling defaults (can be overridden per condition)',
            properties: {
                blur: {
                    type: 'string',
                    description: 'CSS backdrop-filter blur value',
                    default: '8px',
                    examples: ['4px', '8px', '16px'],
                },
                opacity: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    description: 'Backdrop opacity (0–1)',
                    default: 0.6,
                },
                color: {
                    type: 'string',
                    description: 'Backdrop background color (CSS color value)',
                    default: 'rgba(0,0,0,0.5)',
                    examples: ['rgba(0,0,0,0.5)', 'rgba(180,0,0,0.4)'],
                },
            },
            additionalProperties: false,
        },
        position: {
            type: 'string',
            description: 'Where to position the content card within the overlay',
            enum: [
                'top-left', 'top', 'top-center', 'top-right',
                'left', 'left-center',
                'center',
                'right', 'right-center',
                'bottom-left', 'bottom', 'bottom-center', 'bottom-right',
            ],
            default: 'center',
        },
        width: {
            type: 'string',
            description: 'Global content card width (CSS value)',
            default: 'auto',
            examples: ['auto', '400px', '50%'],
        },
        height: {
            type: 'string',
            description: 'Global content card height (CSS value)',
            default: 'auto',
            examples: ['auto', '300px', '40%'],
        },
        conditions: {
            type: 'object',
            description: 'Per-condition overrides. Keys match alert mode values (red_alert, yellow_alert, etc.)',
            additionalProperties: {
                type: 'object',
                properties: {
                    content: {
                        type: 'object',
                        description: 'HA card config to render inside the overlay for this condition',
                        properties: {
                            type: { type: 'string', description: 'Card type (e.g. custom:lcards-button)' },
                        },
                        required: ['type'],
                        additionalProperties: true,
                    },
                    backdrop: {
                        type: 'object',
                        description: 'Per-condition backdrop overrides (merged with global backdrop)',
                        properties: {
                            blur:    { type: 'string' },
                            opacity: { type: 'number', minimum: 0, maximum: 1 },
                            color:   { type: 'string' },
                        },
                        additionalProperties: false,
                    },
                    position: {
                        type: 'string',
                        description: 'Per-condition position override',
                        enum: [
                            'top-left', 'top', 'top-center', 'top-right',
                            'left', 'left-center',
                            'center',
                            'right', 'right-center',
                            'bottom-left', 'bottom', 'bottom-center', 'bottom-right',
                        ],
                    },
                    width:  { type: 'string', description: 'Per-condition content card width' },
                    height: { type: 'string', description: 'Per-condition content card height' },
                },
                additionalProperties: false,
            },
        },
    },
    required: ['type'],
    additionalProperties: false,
};

/**
 * Get the alert overlay schema object
 * @returns {Object} JSON schema
 */
export function getAlertOverlaySchema() {
    return alertOverlaySchema;
}
