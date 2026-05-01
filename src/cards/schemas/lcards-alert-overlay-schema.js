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
            enum: ['dismiss', 'reset', 'auto-dismiss', 'auto-reset'],
            description:
                'dismiss = hide overlay only; ' +
                'reset = hide + set alert_mode back to green_alert; ' +
                'auto-dismiss = automatically hide after auto_dismiss_seconds; ' +
                'auto-reset = automatically hide and reset alert_mode after auto_dismiss_seconds',
            default: 'dismiss',
        },
        auto_dismiss_seconds: {
            type: 'number',
            minimum: 1,
            description:
                'Seconds before the overlay auto-dismisses. ' +
                'Required when dismiss_mode is auto-dismiss or auto-reset. ' +
                'Can be overridden per condition under conditions.<key>.auto_dismiss_seconds.',
            examples: [10, 30, 60],
        },
        backdrop: {
            type: 'object',
            description: '[DEPRECATED] Migrated at runtime to layers.backdrop + layers.color. Still accepted for backward compatibility.',
            properties: {
                blur:    { type: 'string',  description: 'CSS backdrop-filter blur value', default: '8px' },
                opacity: { type: 'number',  minimum: 0, maximum: 1, description: 'Backdrop opacity (0–1)', default: 0.6 },
                color:   { type: 'string',  description: 'Backdrop background colour (CSS colour value)', default: 'rgba(0,0,0,0.5)' },
            },
            additionalProperties: false,
        },
        layers: {
            oneOf: [
                { type: 'null', description: 'null — explicitly disables all screen effect layers (useful as a per-condition override).' },
                {
                    type: 'object',
                    description: 'Screen effect layers applied independently behind the overlay. Absent slot = disabled; null slot = explicitly cleared.',
                    properties: {
                        backdrop: {
                            oneOf: [
                                { type: 'null', description: 'Explicitly disable this layer for a condition override' },
                                {
                                    type: 'object',
                                    description: 'CSS backdrop-filter layer. Preset: blur | grayscale | saturate | contrast | hue-rotate',
                                    properties: { preset: { type: 'string', examples: ['blur', 'grayscale', 'saturate', 'contrast', 'hue-rotate'] } },
                                    required: ['preset'],
                                    additionalProperties: true,
                                },
                            ],
                        },
                        color: {
                            oneOf: [
                                { type: 'null', description: 'Explicitly disable this layer for a condition override' },
                                {
                                    type: 'object',
                                    description: 'Colour overlay layer. Preset: color-tint | vignette',
                                    properties: { preset: { type: 'string', examples: ['color-tint', 'vignette'] } },
                                    required: ['preset'],
                                    additionalProperties: true,
                                },
                            ],
                        },
                        canvas: {
                            oneOf: [
                                { type: 'null', description: 'Explicitly disable this layer for a condition override' },
                                {
                                    type: 'object',
                                    description: 'Canvas animation layer. Preset: static | pixelate | glitch | scanlines',
                                    properties: { preset: { type: 'string', examples: ['static', 'pixelate', 'glitch', 'scanlines'] } },
                                    required: ['preset'],
                                    additionalProperties: true,
                                },
                            ],
                        },
                    },
                    additionalProperties: false,
                },
            ],
        },
        position: {
            type: 'string',
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
                    alert_button: {
                        type: 'object',
                        description:
                            'Patch merged on top of the default lcards-button alert card for this condition. ' +
                            'Only specify fields to override — type, component, and preset are inherited from the built-in default. ' +
                            'Supports all lcards-button text and alert config keys. ' +
                            'Ignored when `content` is also specified (content takes full precedence).',
                        properties: {
                            text: {
                                type: 'object',
                                description: 'Text field overrides — e.g. text.sub_text.content or text.alert_text.content',
                                additionalProperties: true,
                            },
                            alert: {
                                type: 'object',
                                description: 'Alert component config overrides — e.g. alert.color.shape, alert.color.bars',
                                additionalProperties: true,
                            },
                        },
                        additionalProperties: true,
                    },
                    backdrop: {
                        type: 'object',
                        description: '[DEPRECATED] Migrated at runtime to layers. Still accepted for backward compatibility.',
                        properties: {
                            blur:    { type: 'string' },
                            opacity: { type: 'number', minimum: 0, maximum: 1 },
                            color:   { type: 'string' },
                        },
                        additionalProperties: false,
                    },
                    layers: {
                        type: 'object',
                        description: 'Per-condition screen effect layer overrides. Unset slots inherit from the global layers config. null = explicitly disable that slot.',
                        properties: {
                            backdrop: { oneOf: [{ type: 'null' }, { type: 'object', properties: { preset: { type: 'string' } }, required: ['preset'], additionalProperties: true }] },
                            color:    { oneOf: [{ type: 'null' }, { type: 'object', properties: { preset: { type: 'string' } }, required: ['preset'], additionalProperties: true }] },
                            canvas:   { oneOf: [{ type: 'null' }, { type: 'object', properties: { preset: { type: 'string' } }, required: ['preset'], additionalProperties: true }] },
                        },
                        additionalProperties: false,
                    },
                    position: {
                        type: 'string',
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
                    auto_dismiss_seconds: {
                        type: 'number',
                        minimum: 1,
                        description:
                            'Override auto-dismiss duration for this specific condition. ' +
                            'Only relevant when the global dismiss_mode is auto-dismiss or auto-reset.',
                        examples: [10, 30, 60],
                    },
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
