/**
 * LCARS Shell Dashboard Strategy Schema
 *
 * JSON Schema for the `custom:lcars-shell` dashboard strategy's config (the
 * `strategy:` block of a dashboard). It is the single source for the strategy's
 * configure dialog: `shellStrategyEditorSchema()` derives the ha-form schema
 * from it, so the form and the published schema cannot drift.
 *
 * @see src/strategies/lcards-shell-strategy.js
 */

export const shellStrategySchema = {
    type: 'object',
    title: 'LCARS Shell Dashboard Strategy',
    description: 'Dashboard strategy that generates a full LCARS shell (header, sidebars, content panel) on a custom:lcards-layout-view. Set it as the dashboard\'s `strategy:` block.',
    required: ['type'],
    additionalProperties: false,
    properties: {
        type: {
            type: 'string',
            const: 'custom:lcars-shell',
            description: 'Strategy identifier.',
        },
        room_selector_entity: {
            type: 'string',
            title: 'Room selector',
            description: 'The room the light panel shows. An input_select or select lists its own options as the rooms '
                + '(name each option after an area). An input_text lists every area in Home Assistant and stores the one picked. '
                + 'Leave it empty to show a placeholder.',
            'x-ui-hints': { selector: { entity: { domain: ['input_select', 'select', 'input_text'] } } },
        },
        page_selector_entity: {
            type: 'string',
            title: 'Page selector',
            description: 'An input_select or select whose options become the page menu in the left sidebar. '
                + 'Picking a page sets the entity; use its state in Visibility conditions after you take control.',
            'x-ui-hints': { selector: { entity: { domain: ['input_select', 'select'] } } },
        },
        top_bar_entity: {
            type: 'string',
            title: 'Top bar toggle',
            description: 'An input_boolean that shows or hides the top bar. '
                + 'The first button under the top left corner toggles it.',
            'x-ui-hints': { selector: { entity: { domain: ['input_boolean'] } } },
        },
        right_sidebar_entity: {
            type: 'string',
            title: 'Right sidebar toggle',
            description: 'An input_boolean that shows or hides the right sidebar. '
                + 'The second button under the top left corner toggles it.',
            'x-ui-hints': { selector: { entity: { domain: ['input_boolean'] } } },
        },
    },
};

/**
 * ha-form schema for the strategy's configure dialog, in property order.
 * @returns {Array<{name: string, label: string, description: string, selector: object}>}
 */
export function shellStrategyEditorSchema() {
    return Object.entries(shellStrategySchema.properties)
        .filter(([name]) => name !== 'type')
        .map(([name, prop]) => ({
            name,
            label: prop.title,
            description: prop.description,
            selector: prop['x-ui-hints'].selector,
        }));
}

/**
 * The Picard shell (`custom:lcars-shell-picard`, shell v2): the same options as the
 * v1 shell, with its own type and description. One form serves both
 * (lcards-shell-strategy-editor).
 */
export const shellPicardStrategySchema = {
    ...shellStrategySchema,
    title: 'LCARS Shell Dashboard Strategy (Picard)',
    description: 'Dashboard strategy that generates a Picard-style LCARS screen (a code-block column, a display sweep round the room light panel, the room\'s readings and gauges, utility pills and page tabs) on a custom:lcards-layout-view. Set it as the dashboard\'s `strategy:` block.',
    properties: {
        ...shellStrategySchema.properties,
        type: { type: 'string', const: 'custom:lcars-shell-picard', description: 'Strategy identifier.' },
    },
};
