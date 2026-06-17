/**
 * @fileoverview LCARdS Shell Dashboard Strategy
 *
 * Registers as a community dashboard in HA's New Dashboard picker via
 * window.customStrategies. Generates the full wip-layout-next3 shell.
 *
 * configRequired = true opens a configure dialog before creation where the
 * user can pick their helper entities. Values flow into generate() as config.
 *
 * Uses LCARdS's own grid system — custom:lcards-layout-view for the shell and
 * custom:lcards-layout-card for nested panels (no lovelace-layout-card / card-mod).
 *
 * Requires: auto-entities (HACS) — only for the dynamic room light list.
 */

import { LitElement, html } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';

// ============================================================================
// STRATEGY EDITOR
// ============================================================================

const _EDITOR_SCHEMA = [
    // ── Room controller ──────────────────────────────────────────────────────
    {
        name: 'room_selector_entity',
        label: 'Room Controller Entity',
        description: 'Controls the room light controller. '
            + 'input_select or select: its options become the room list (entity mode). '
            + 'input_text: room list is built from your HA area registry automatically; '
            + 'the selected area is stored in this entity (auto-areas mode). '
            + 'Leave blank to show a placeholder.',
        selector: { entity: { domain: ['input_select', 'select', 'input_text'] } },
    },
    // ── Shell controls ───────────────────────────────────────────────────────
    {
        name: 'page_selector_entity',
        label: 'Page Selector Entity',
        description: 'input_select entity used for sidebar page/section navigation',
        selector: { entity: { domain: ['input_select', 'select'] } },
    },
    {
        name: 'top_bar_entity',
        label: 'Top Bar Toggle',
        description: 'input_boolean that shows/hides the top header bar (also bound to the first header-left button)',
        selector: { entity: { domain: ['input_boolean'] } },
    },
    {
        name: 'right_sidebar_entity',
        label: 'Right Sidebar Toggle',
        description: 'input_boolean that shows/hides the right sidebar (also bound to the second header-left button)',
        selector: { entity: { domain: ['input_boolean'] } },
    },
];

export class LCARdSShellStrategyEditor extends LitElement {
    static properties = {
        hass: { attribute: false },
        _config: { state: true },
    };

    constructor() {
        super();
        this.hass    = undefined;
        this._config = {};
    }

    setConfig(config) {
        this._config = config;
    }

    _valueChanged(ev) {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: ev.detail.value },
            bubbles: true,
            composed: true,
        }));
    }

    render() {
        if (!this.hass || !this._config) return html``;
        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${_EDITOR_SCHEMA}
                .computeLabel=${(s) => s.label}
                .computeHelper=${(s) => s.description}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
    }
}

// ============================================================================
// SHARED HELPERS
// ============================================================================

function _layoutCard(viewArea, layout, cards, extra = {}) {
    return {
        type: 'custom:lcards-layout-card',
        layout: { padding: 0, card_margin: 0, margin: 0, ...layout },
        cards,
        view_layout: { 'grid-area': viewArea },
        ...extra,
    };
}

// ============================================================================
// CONTENT PANEL CARDS
// ============================================================================

function _roomLightControllerCard(roomEntity) {
    // A sub-grid (lcards-layout-card) placed directly in the content-panel area:
    // header elbow, selector column (room select-menu + filler panel), scrollable
    // auto-entities light list, and a footer elbow.
    return {
        type: 'custom:lcards-layout-card',
        layout: {
            'grid-template-columns': 'minmax(60px, 180px) 10px 1fr',
            'grid-template-rows': 'auto 1fr auto',
            'grid-template-areas': '"header header header" "selector . list" "footer footer footer"',
            'grid-gap': '10px',
            padding: 0,
            card_margin: 0,
            margin: 0,
            height: '100%',
        },
        cards: [
            {
                type: 'custom:lcards-elbow',
                min_height: '60px',
                elbow: { segment: { bar_width: 180, bar_height: 'theme', inner_curve: 30, outer_curve: 60 } },
                view_layout: { 'grid-area': 'header' },
            },
            // Selector column: room select-menu at natural height, filler button takes the rest
            {
                type: 'custom:lcards-layout-card',
                layout: {
                    'grid-template-columns': '1fr',
                    'grid-template-rows': 'auto 1fr',
                    'grid-gap': '5px',
                    padding: 0,
                    card_margin: 0,
                    margin: 0,
                    height: '100%',
                },
                cards: [
                    {
                        type: 'custom:lcards-select-menu',
                        entity: roomEntity,
                        preset: 'filled',
                        grid: {
                            columns: 1,
                            gap: '5px',
                            'grid-auto-rows': 'minmax(40px, 56px)',
                        },
                        button_template: {
                            min_height: '10',
                            text: { label: { show: true, position: 'center-right' } },
                        },
                    },
                    {
                        type: 'custom:lcards-button',
                        preset: 'panel-light',
                    },
                ],
                view_layout: { 'grid-area': 'selector' },
            },
            // Slider list — overflow-y: auto gives isolated scrolling within the 1fr cell
            {
                type: 'custom:auto-entities',
                filter: {
                    template: `[{% for e in
                        area_entities(states('${roomEntity}')) %}
                        {% if e.startswith('light.') %}
                            {
                            'entity': '{{ e }}',
                            'type': 'custom:lcards-slider',
                            'preset': 'pills-left-border',
                            'view_layout': {'grid-column': '1'},
                            'text': {'name': {'show': 'true'}},
                            'tap_action': {'action': 'toggle'},
                            'hold_action': {'action': 'more-info', 'entity': '{{ e }}'},
                            'style': { 'track': { 'segments': { 'gradient': { 'end': { 'active': 'match-light' }, 'start': { 'active': 'darken(match-light,0.6)' } } } } },
                            },
                        {% endif %}
                        {% endfor %}]`,
                },
                card_param: 'cards',
                card: {
                    type: 'custom:lcards-layout-card',
                    layout: {
                        'grid-template-columns': '1fr',
                        'grid-template-rows': 'minmax(45px, 56px)',
                        'grid-auto-rows': 'minmax(45px, 56px)',
                        'grid-gap': '5px',
                        padding: 0,
                        card_margin: 0,
                        margin: 0,
                        height: 'auto',
                    },
                },
                view_layout: { 'grid-area': 'list', 'overflow-y': 'auto' },
            },
            {
                type: 'custom:lcards-elbow',
                elbow: {
                    type: 'footer-left',
                    segment: { bar_width: 180, bar_height: 'theme', inner_curve: 30, outer_curve: 60 },
                },
                height: '60px',
                view_layout: { 'grid-area': 'footer' },
            },
        ],
        view_layout: { 'grid-area': 'content-panel', margin: '20' },
    };
}

function _contentPlaceholderCard(message = 'Content Area — select a Room Selector Entity in the dashboard settings to enable the room light controller.') {
    return {
        type: 'custom:lcards-button',
        preset: 'outline',
        text: {
            label: {
                show: true,
                content: message,
            },
        },
        view_layout: { 'grid-area': 'content-panel' },
    };
}

// ============================================================================
// AUTO-AREAS ROOM CONTROLLER
// ============================================================================

/**
 * Build the tap_action for one area button in auto-areas mode.
 * input_text → set_value (accepts any string, no option registration needed).
 * input_select / select → select_option (only works if area_id is a registered option).
 */
function _areaSelectAction(entityId, areaId) {
    const domain = entityId.split('.')[0];
    if (domain === 'input_text') {
        return { action: 'call-service', service: 'input_text.set_value',
                 data: { entity_id: entityId, value: areaId } };
    }
    if (domain === 'input_select' || domain === 'select') {
        return { action: 'call-service', service: `${domain}.select_option`,
                 data: { entity_id: entityId, option: areaId } };
    }
    return { action: 'none' };
}

/**
 * Room controller variant for auto-areas mode. Same chrome as _roomLightControllerCard
 * but the select-menu options come from the HA area registry (not entity options).
 *
 * @param {Array<{area_id: string, name: string, icon: string|null}>} areas
 * @param {string|null} stateEntity  Entity used to track the selected area (ideally input_text).
 *                                   When null the area buttons are rendered but tapping does nothing
 *                                   and the light list shows a setup prompt.
 */
function _autoAreasRoomCard(areas, stateEntity) {
    const options = areas.map(area => ({
        value: area.area_id,
        label: area.name,
        ...(area.icon ? { icon: area.icon } : {}),
        tap_action: stateEntity ? _areaSelectAction(stateEntity, area.area_id) : { action: 'none' },
    }));

    const listCard = stateEntity ? {
        type: 'custom:auto-entities',
        filter: {
            template: `[{% for e in
                area_entities(states('${stateEntity}')) %}
                {% if e.startswith('light.') %}
                    {
                    'entity': '{{ e }}',
                    'type': 'custom:lcards-slider',
                    'preset': 'pills-left-border',
                    'view_layout': {'grid-column': '1'},
                    'text': {'name': {'show': 'true'}}
                    },
                {% endif %}
                {% endfor %}]`,
        },
        card_param: 'cards',
        card: {
            type: 'custom:lcards-layout-card',
            layout: {
                'grid-template-columns': '1fr',
                'grid-template-rows': 'minmax(45px, 56px)',
                'grid-auto-rows': 'minmax(45px, 56px)',
                'grid-gap': '5px',
                padding: 0,
                card_margin: 0,
                margin: 0,
                height: 'auto',
            },
        },
        view_layout: { 'grid-area': 'list', 'overflow-y': 'auto' },
    } : {
        type: 'custom:lcards-button',
        preset: 'outline',
        interactive: false,
        text: { label: { show: true, content: 'Tap a room to select it — add an input_text helper entity in dashboard settings to enable light filtering.' } },
        view_layout: { 'grid-area': 'list' },
    };

    return {
        type: 'custom:lcards-layout-card',
        layout: {
            'grid-template-columns': 'minmax(60px, 180px) 10px 1fr',
            'grid-template-rows': 'auto 1fr auto',
            'grid-template-areas': '"header header header" "selector . list" "footer footer footer"',
            'grid-gap': '10px',
            padding: 0,
            card_margin: 0,
            margin: 0,
            height: '100%',
        },
        cards: [
            {
                type: 'custom:lcards-elbow',
                min_height: '60px',
                elbow: { segment: { bar_width: 180, bar_height: 'theme', inner_curve: 30, outer_curve: 60 } },
                view_layout: { 'grid-area': 'header' },
            },
            {
                type: 'custom:lcards-layout-card',
                layout: {
                    'grid-template-columns': '1fr',
                    'grid-template-rows': 'auto 1fr',
                    'grid-gap': '5px',
                    padding: 0,
                    card_margin: 0,
                    margin: 0,
                    height: '100%',
                },
                cards: [
                    {
                        type: 'custom:lcards-select-menu',
                        ...(stateEntity ? { entity: stateEntity } : {}),
                        preset: 'filled',
                        grid: {
                            columns: 1,
                            gap: '5px',
                            'grid-auto-rows': 'minmax(40px, 56px)',
                        },
                        options,
                        button_template: {
                            min_height: '10',
                            text: { label: { show: true, position: 'center-right' } },
                        },
                    },
                    { type: 'custom:lcards-button', preset: 'panel-light' },
                ],
                view_layout: { 'grid-area': 'selector' },
            },
            listCard,
            {
                type: 'custom:lcards-elbow',
                elbow: {
                    type: 'footer-left',
                    segment: { bar_width: 180, bar_height: 'theme', inner_curve: 30, outer_curve: 60 },
                },
                height: '60px',
                view_layout: { 'grid-area': 'footer' },
            },
        ],
        view_layout: { 'grid-area': 'content-panel', margin: '20' },
    };
}

// ============================================================================
// SHELL VIEW (wip-layout-next3)
// ============================================================================

function _buildShellView(contentCard, { pageEntity, topBarEntity, rightSidebarEntity }) {
    return {
        title: 'LCARS',
        path: 'lcars',
        type: 'custom:lcards-layout-view',
        layout: {
            height: 'calc(100dvh - var(--header-height, 56px))',
            'grid-gap': '5px',
            card_margin: 0,
            margin: 0,
            padding: 0,
            'grid-template-columns': '45px clamp(100px, 12vw, 180px) 5px 40px 1fr 40px 5px minmax(0, auto)',
            // Row 0 (header-border): minmax(0,auto) when the top bar entity is set so
            // the row can expand to the card's height (managed by _applyVisibilityRowHeights).
            // Without an entity the card is absent — use 0px (definite) so the measurement
            // pass in _applyVisibilityRowHeights cannot mistake it for free space (auto-max
            // tracks absorb remaining space when fr tracks are zeroed during measurement).
            'grid-template-rows': `${topBarEntity ? 'minmax(0,auto)' : '0px'} clamp(25px, 5vh, 95px) 5px 40px 1fr 40px 5px clamp(25px, 5vh, 95px) 45px`,
            'grid-template-areas': `
"header-border  header-border  header-border  header-border  header-border  header-border  header-border  header-border"
"border-left    header-left    .              header         header         header         header         sidebar-right"
"border-left    header-left    .              .              .              .              .              sidebar-right"
"border-left    header-left    .              content-panel  content-panel  content-panel  .              sidebar-right"
"sidebar-left   sidebar-left   .              content-panel  content-panel  content-panel  .              sidebar-right"
"footer-left    footer-left    footer-left    content-panel  content-panel  content-panel  .              sidebar-right"
"footer-left    footer-left    footer-left    .              .              .              .              sidebar-right"
"footer-left    footer-left    footer-left    .              footer         footer         footer         sidebar-right"
"footer-left    footer-left    footer-left    .              footer-border  footer-border  footer-border  sidebar-right"
`,
            mediaquery: {
                '(max-width: 1010px)': {
                    'grid-template-columns': '45px clamp(100px, 12vw, 180px) 5px 40px 1fr 40px 1px minmax(0,auto)',
                    'grid-template-rows': `${topBarEntity ? 'minmax(0,auto)' : '0px'} clamp(25px, 5vh, 95px) 5px 40px 1fr 40px 5px clamp(25px, 5vh, 95px) 45px`,
                    'grid-gap': '5px',
                },
            },
            areas: {
                'content-panel': { margin: '20px' },
            },
        },
        cards: [
            // ── Footer-left corner elbow ─────────────────────────────────────
            {
                type: 'custom:lcards-elbow',
                elbow: {
                    type: 'footer-left',
                    radius: { outer: 'auto' },
                    style: 'segmented',
                    segments: {
                        gap: 5,
                        outer_segment: {
                            bar_width: 45,
                            bar_height: 45,
                            outer_curve: 160,
                            inner_curve: 115,
                            color: { default: 'var(--lcars-ui-primary)' },
                        },
                        inner_segment: {
                            bar_width: 'clamp(100px, 12vw, 180px)',
                            bar_height: 'clamp(25px, 5vh, 95px)',
                            inner_curve: 35,
                            color: { default: 'var(--lcars-ui-quaternary)' },
                        },
                    },
                },
                width: 'calc(50px + clamp(100px, 12vw, 180px) + 50px + 5px)',
                view_layout: { 'grid-area': 'footer-left' },
            },

            // ── Alert overlay (overlaps header-left, only visible on alert) ─
            {
                type: 'custom:lcards-alert-overlay',
                dismiss_mode: 'dismiss',
                height: '33%',
                width: '50%',
                layers: {
                    backdrop: { preset: 'blur', amount: '8px' },
                    canvas: null,
                },
                position: 'center',
                view_layout: { 'grid-area': 'header-left' },
            },

            // ── Left border strip ────────────────────────────────────────────
            {
                type: 'custom:lcards-button',
                preset: 'panel-light',
                min_width: 10,
                text: { label: { show: false } },
                view_layout: { 'grid-area': 'border-left' },
            },

            // ── Header-left panel (two dark buttons bound to the bar toggles) ─
            _layoutCard('header-left', {
                'grid-template-columns': '1fr',
                'grid-gap': '5px',
                'grid-template-rows': '1fr',
                'grid-auto-rows': '1fr',
            }, [
                {
                    type: 'custom:lcards-button', preset: 'panel-dark', min_height: 10,
                    ...(topBarEntity ? { entity: topBarEntity } : {}),
                },
                {
                    type: 'custom:lcards-button', preset: 'panel-dark', min_height: 10,
                    ...(rightSidebarEntity ? { entity: rightSidebarEntity } : {}),
                },
            ]),

            // ── Footer panel (filled action buttons) ────────────────────────
            _layoutCard('footer', {
                'grid-template-columns': '1fr',
                'grid-gap': '5px',
                'grid-template-rows': '1fr',
                'grid-auto-rows': '1fr',
            }, [
                {
                    type: 'custom:lcards-button',
                    preset: 'filled',
                    tap_action: { action: 'toggle' },
                    min_height: 10,
                },
                {
                    type: 'custom:lcards-button',
                    preset: 'filled',
                    tap_action: { action: 'toggle' },
                    min_height: 10,
                    animations: [{
                        trigger: 'on_hover',
                        preset: 'pulse',
                        duration: 1000,
                        ease: 'inOutQuad',
                        loop: true,
                        alternate: true,
                        params: { max_scale: 1.15, max_brightness: 1.4 },
                    }],
                },
            ]),

            // ── Sidebar-left (border strip + page selector + filler) ─────────
            // 4-cell flat grid: 2 cols × 2 rows.
            // Col 1: panel-light strip (top) + panel-light strip (bottom).
            // Col 2: select-menu (top) + panel-dark filler (bottom).
            // Row 1 is menu-driven: grid.height:'fit' makes the select-menu set
            // a definite pixel height on its host (N buttons × 56px + gaps) —
            // intrinsic content sizing through hui-card's percentage-height
            // wrappers is unreliable, so the height must be explicit. The
            // minmax(0, max-content) row then tracks that height exactly, capped
            // by the sidebar (the 0 minimum prevents inflation past the
            // container; view_layout overflow-y scrolls the squeezed case).
            // Row 2 (minmax(40px, 1fr)) absorbs whatever is left, keeping at
            // least a 40px filler strip visible when the menu needs the rest.
            // The strips/filler need min_height: 1 — without it the button's
            // theme minimum (--lcars-button-min-height, ~56px) keeps painting
            // past a collapsed row into the areas below.
            _layoutCard('sidebar-left', {
                'grid-template-columns': '45px 1fr',
                'grid-template-rows': 'minmax(0, max-content)',
                'grid-auto-rows': 'minmax(40px, 1fr)',
                'grid-gap': '5px',
            }, [
                {
                    type: 'custom:lcards-button',
                    preset: 'panel-light',
                    min_height: 1,
                    text: { label: { show: false } },
                },
                ...(pageEntity ? [{
                    type: 'custom:lcards-select-menu',
                    entity: pageEntity,
                    preset: 'outline',
                    grid: { columns: 1, gap: '5px', 'grid-auto-rows': 'minmax(40px, 56px)', height: 'fit' },
                    view_layout: { 'overflow-y': 'auto' },
                    button_template: {
                        min_height: '10',
                        text: { label: { show: true, position: 'center-right' } },
                    },
                }] : [{
                    type: 'custom:lcards-button',
                    preset: 'panel-dark',
                    text: { label: { show: true, content: 'Set Page Selector Entity in dashboard settings' } },
                }]),
                {
                    type: 'custom:lcards-button',
                    preset: 'panel-light',
                    min_height: 1,
                    text: { label: { show: false } },
                },
                {
                    type: 'custom:lcards-button',
                    preset: 'panel-dark',
                    min_height: 1,
                    tap_action: { action: 'toggle' },
                },
            ]),

            // ── Content panel (dynamic — room controller or placeholder) ─────
            contentCard,

            // ── Header bar ──────────────────────────────────────────────────
            {
                type: 'custom:lcards-button',
                preset: 'outline',
                tap_action: { action: 'toggle' },
                min_width: 10,
                min_height: 10,
                text: { label: { show: true, content: 'header' } },
                view_layout: { 'grid-area': 'header' },
            },

            // ── Sidebar-right (toggled by the right-sidebar boolean) ────────
            {
                type: 'custom:lcards-button',
                preset: 'outline',
                tap_action: { action: 'toggle' },
                text: { label: { show: true, content: 'sidebar-right' } },
                style: { border: { color: { default: 'var(--lcards-blue)' } } },
                view_layout: { 'grid-area': 'sidebar-right' },
                width: 'clamp(100px,16vw,230px)',
                ...(rightSidebarEntity ? {
                    visibility: [{ condition: 'state', entity: rightSidebarEntity, state: 'on' }],
                } : {}),
            },

            // ── Footer border strip ──────────────────────────────────────────
            _layoutCard('footer-border', {
                'grid-template-columns': '1fr',
                'grid-gap': '5px',
                'grid-template-rows': '1fr',
                'grid-auto-rows': '1fr',
            }, [
                { type: 'custom:lcards-button', preset: 'panel-light', min_height: 1 },
            ]),

            // ── Header border (elbow + banner row) ───────────────────────────
            // Omitted entirely when topBarEntity is unset. With no card in the
            // header-border area, the minmax(0,auto) row collapses cleanly to 0.
            // When included, the visibility condition feeds _collectVisibilityRows
            // so _applyVisibilityRowHeights can write the row height explicitly
            // ('10vh' or '0px') — without that, the auto track can size to the
            // inner content's intrinsic height and steal space from the 1fr row.
            // height must be a DEFINITE value: applyGridItemHeight forwards it to
            // the hui-card wrapper so the auto row has something to resolve to.
            ...(topBarEntity ? [_layoutCard('header-border', {
                'grid-template-columns': 'auto 1fr',
                'grid-gap': '5px',
                'grid-template-rows': 'auto',
                'grid-template-areas': '"hb-elbow hb-banner"',
                height: '10vh',
            }, [
                {
                    type: 'custom:lcards-elbow',
                    elbow: {
                        type: 'header-left',
                        style: 'segmented',
                        segments: {
                            gap: 5,
                            outer_segment: {
                                bar_width: 45,
                                bar_height: 45,
                                outer_curve: 120,
                                inner_curve: 75,
                                color: { default: 'var(--lcars-ui-primary)' },
                            },
                            inner_segment: {
                                bar_width: 'calc(clamp(100px, 12vw, 180px))',
                                bar_height: 0.01,
                                inner_curve: 75,
                                color: { default: 'var(--lcars-ui-quaternary)' },
                            },
                        },
                    },
                    height: '10vh',
                    width: 'calc(45px + clamp(100px, 12vw, 180px) + 5px + 40px)',
                    view_layout: { 'grid-area': 'hb-elbow' },
                },
                {
                    type: 'custom:lcards-layout-card',
                    layout: {
                        'grid-template-columns': '1fr',
                        'grid-gap': '5px',
                        'grid-template-rows': '45px minmax(10px,50px)',
                        'grid-template-areas': '"banner-top" "banner-bottom"',
                        padding: 0,
                        card_margin: 0,
                        margin: 0,
                        height: '8vh',
                    },
                    cards: [
                        {
                            type: 'custom:lcards-button',
                            preset: 'panel-light',
                            min_height: 10,
                            view_layout: { 'grid-area': 'banner-top' },
                        },
                        {
                            type: 'custom:lcards-button',
                            preset: 'text-only',
                            tap_action: { action: 'toggle' },
                            min_height: 10,
                            interactive: false,
                            text: { label: { show: true, content: 'Banner/ticker/message area' } },
                            style: {
                                border: {
                                    color: { default: 'transparent' },
                                    width: 3,
                                },
                            },
                            animations: [{
                                trigger: 'on_hover',
                                preset: 'pulse',
                                duration: 1000,
                                ease: 'inOutQuad',
                                loop: true,
                                alternate: true,
                                params: { max_scale: 1.15, max_brightness: 1.4 },
                            }],
                            view_layout: { 'grid-area': 'banner-bottom' },
                        },
                    ],
                    view_layout: { 'grid-area': 'hb-banner' },
                },
            ], {
                visibility: [{ condition: 'state', entity: topBarEntity, state: 'on' }],
            })] : []),
        ],
    };
}

// ============================================================================
// STRATEGY CLASS
// ============================================================================

export class LCARdSShellDashboardStrategy extends HTMLElement {

    static configRequired = true;

    static getCreateSuggestions(_hass) {
        return { title: 'LCARS', icon: 'mdi:view-dashboard-variant' };
    }

    static getConfigElement() {
        return document.createElement('lcards-shell-strategy-editor');
    }

    /**
     * @param {object} config - Strategy config (from the editor form)
     * @param {object} hass   - The Home Assistant frontend object
     * @returns {Promise<{ views: Array }>}
     */
    static async generate(config, hass) {
        const roomEntity         = config?.room_selector_entity || null;
        const roomEntityDomain   = roomEntity?.split('.')[0] ?? null;
        const pageEntity         = config?.page_selector_entity || null;
        const topBarEntity       = config?.top_bar_entity || null;
        const rightSidebarEntity = config?.right_sidebar_entity || null;

        lcardsLog.debug(`[LCARdSShellStrategy] generate() roomEntity=${roomEntity} domain=${roomEntityDomain} pageEntity=${pageEntity} topBarEntity=${topBarEntity} rightSidebarEntity=${rightSidebarEntity}`);

        let contentCard;
        if (roomEntity && roomEntity in (hass?.states ?? {})) {
            if (roomEntityDomain === 'input_text') {
                // Auto-areas mode: build room list from HA area registry, store selection in input_text.
                const areas = Object.values(hass?.areas ?? {})
                    .filter(a => a?.area_id && a?.name)
                    .sort((a, b) => a.name.localeCompare(b.name));
                contentCard = areas.length > 0
                    ? _autoAreasRoomCard(areas, roomEntity)
                    : _contentPlaceholderCard('No areas found — add rooms in Settings → Areas & Zones, then reload.');
            } else {
                // Entity mode: input_select / select options drive the room list.
                contentCard = _roomLightControllerCard(roomEntity);
            }
        } else {
            contentCard = _contentPlaceholderCard();
        }

        return { views: [_buildShellView(contentCard, { pageEntity, topBarEntity, rightSidebarEntity })] };
    }
}
