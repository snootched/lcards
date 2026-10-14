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
    description: 'Dashboard strategy that generates a full LCARS shell (header, sidebars, content panel) on a custom:lcards-layout-view. Set it as the dashboard\'s `strategy:` block. The room light list needs auto-entities (HACS).',
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
            title: 'Room Controller Entity',
            description: 'Controls the room light controller. '
                + 'input_select or select: its options become the room list (entity mode). '
                + 'input_text: room list is built from your HA area registry automatically; '
                + 'the selected area is stored in this entity (auto-areas mode). '
                + 'Leave blank to show a placeholder.',
            'x-ui-hints': { selector: { entity: { domain: ['input_select', 'select', 'input_text'] } } },
        },
        page_selector_entity: {
            type: 'string',
            title: 'Page Selector Entity',
            description: 'input_select entity used for sidebar page/section navigation',
            'x-ui-hints': { selector: { entity: { domain: ['input_select', 'select'] } } },
        },
        top_bar_entity: {
            type: 'string',
            title: 'Top Bar Toggle',
            description: 'input_boolean that shows/hides the top header bar (also bound to the first header-left button)',
            'x-ui-hints': { selector: { entity: { domain: ['input_boolean'] } } },
        },
        right_sidebar_entity: {
            type: 'string',
            title: 'Right Sidebar Toggle',
            description: 'input_boolean that shows/hides the right sidebar (also bound to the second header-left button)',
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
