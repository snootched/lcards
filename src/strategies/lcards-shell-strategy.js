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
    {
        name: 'room_selector_entity',
        label: 'Room Selector Entity',
        description: 'input_select entity used to pick the active room in the content panel (enables the room light controller)',
        selector: { entity: { domain: ['input_select', 'select'] } },
    },
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
    // header elbow, room selector, an auto-entities light list, and a footer elbow.
    return {
        type: 'custom:lcards-layout-card',
        layout: {
            'grid-template-columns': 'minmax(60px, 180px) 10px 1fr',
            'grid-template-rows': 'auto 1fr auto',
            'grid-template-areas': '"header header header" "selector . list" "footer footer footer"',
            'grid-gap': '15px',
            padding: 0,
            card_margin: 0,
            margin: 0,
            height: '100%',
        },
        cards: [
            {
                type: 'custom:lcards-elbow',
                min_height: '60px',
                elbow: { segment: { bar_width: 'theme' } },
                view_layout: { 'grid-area': 'header' },
            },
            {
                type: 'custom:lcards-select-menu',
                entity: roomEntity,
                preset: 'outline',
                grid: { columns: 1, gap: '5px' },
                view_layout: { 'grid-area': 'selector' },
            },
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
                    },
                },
                view_layout: { 'grid-area': 'list' },
            },
            {
                type: 'custom:lcards-elbow',
                elbow: {
                    type: 'footer-left',
                    segment: { bar_width: 'theme', bar_height: 'theme', outer_curve: 'auto' },
                },
                height: '60px',
                view_layout: { 'grid-area': 'footer' },
            },
        ],
        view_layout: { 'grid-area': 'content-panel', margin: '20' },
    };
}

function _contentPlaceholderCard() {
    return {
        type: 'custom:lcards-button',
        preset: 'outline',
        text: {
            label: {
                show: true,
                content: 'Content Area — select a Room Selector Entity in the dashboard settings to enable the room light controller.',
            },
        },
        view_layout: { 'grid-area': 'content-panel' },
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
            'grid-template-rows': 'minmax(0,auto) clamp(25px, 5vh, 95px) 5px 40px 1fr 40px 5px clamp(25px, 5vh, 95px) 45px',
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
                    'grid-template-rows': 'minmax(0,auto) clamp(25px, 5vh, 95px) 5px 40px 1fr 40px 5px clamp(25px, 5vh, 95px) 45px',
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
                            color: { default: 'var(--lcars-ui-quaternary)', hover: 'var(--lcards-green)' },
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

            // ── Sidebar-left (border strip + page selector + extras) ─────────
            _layoutCard('sidebar-left', {
                'grid-template-columns': '45px 1fr',
                'grid-template-rows': '1fr',
                'grid-auto-rows': '1fr',
                'grid-gap': '5px',
            }, [
                {
                    type: 'custom:lcards-button',
                    preset: 'panel-light',
                    text: { label: { show: false } },
                },
                ...(pageEntity ? [{
                    type: 'custom:lcards-select-menu',
                    entity: pageEntity,
                    preset: 'outline',
                    grid: { columns: 1, gap: '5px', 'grid-auto-rows': 'minmax(40px,1fr)' },
                    button_template: {
                        min_height: '10',
                        text: { label: { show: true, position: 'right-center' } },
                    },
                }] : [{
                    type: 'custom:lcards-button',
                    preset: 'panel-dark',
                    text: { label: { show: true, content: 'Set Page Selector Entity in dashboard settings' } },
                }]),
                {
                    type: 'custom:lcards-button',
                    preset: 'panel-light',
                    text: { label: { show: false } },
                },
                {
                    type: 'custom:lcards-button',
                    preset: 'panel-dark',
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
            // height must be a DEFINITE value (e.g. '10vh'). HA wraps every card
            // in <hui-card> whose shadow DOM has a slot wrapper with height:100%.
            // In an unsized (auto) grid row, 100% resolves to 0, so hui-card always
            // reports 0px height — collapsing the row — regardless of whether its
            // inner content has height. applyGridItemHeight forwards this value to
            // the hui-card wrapper, giving the outer row a definite size.
            _layoutCard('header-border', {
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
                ...(topBarEntity ? {
                    visibility: [{ condition: 'state', entity: topBarEntity, state: 'on' }],
                } : {}),
            }),
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
     * @param {object} config - Strategy config: { type, room_selector_entity?, page_selector_entity? }
     * @param {object} hass   - The Home Assistant object
     * @returns {Promise<{ views: Array }>}
     */
    static async generate(config, hass) {
        const roomEntity        = config?.room_selector_entity || null;
        const pageEntity        = config?.page_selector_entity || null;
        const topBarEntity      = config?.top_bar_entity || null;
        const rightSidebarEntity = config?.right_sidebar_entity || null;

        lcardsLog.debug(`[LCARdSShellStrategy] generate() roomEntity=${roomEntity} pageEntity=${pageEntity} topBarEntity=${topBarEntity} rightSidebarEntity=${rightSidebarEntity}`);

        const hasRoomSelector = roomEntity && (roomEntity in (hass?.states ?? {}));
        const contentCard = hasRoomSelector
            ? _roomLightControllerCard(roomEntity)
            : _contentPlaceholderCard();

        return { views: [_buildShellView(contentCard, { pageEntity, topBarEntity, rightSidebarEntity })] };
    }
}
