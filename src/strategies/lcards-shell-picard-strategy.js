/**
 * @fileoverview LCARdS Shell Dashboard Strategy, Picard look (shell v2)
 *
 * `custom:lcars-shell-picard`: the same four options as the v1 shell
 * (`custom:lcars-shell`), drawn as a Picard "display with side columns" screen
 * (doc/getting-started/lcars-design.md): a code-block column, a display sweep round
 * the room light panel, a column of the room's readings and gauges, utility pills
 * in a bracket at the right edge and page tabs along the bottom. Plan:
 * reports/shell-picard-plan.md.
 *
 * Rooms, lights and sensors come from the registries at generation time (Home
 * Assistant regenerates a strategy dashboard when they change); the room picked is
 * a Visibility condition on the room selector, as in v1.
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import { roomLightsFromRegistries, areaSelectAction } from './lcards-shell-strategy.js';

/** @typedef {import('./lcards-shell-strategy.js').RoomLights} RoomLights */
/** @typedef {{ area_id: string, name: string, sensors: string[] }} RoomSensors */

// Theme roles only (lcars-design.md: colours via theme roles, never hex).
const ACCENT = 'theme:colors.ui.tertiary';
const STRUCTURE = 'theme:colors.ui.secondary';
const DARK = 'theme:colors.card.topColor';
const GAP = '6px';

/** Sensor device classes shown as room readings, in this order. */
const READING_CLASSES = ['temperature', 'humidity', 'illuminance', 'carbon_dioxide', 'pressure', 'power', 'battery'];
/** Readings that fit a 0-100 gauge, with their gauge cap codes. */
const GAUGE_CODES = /** @type {Record<string, string>} */ ({ temperature: 'TMP', humidity: 'HUM', battery: 'BAT' });
const MAX_READINGS = 7;
const MAX_GAUGES = 3;
/** Lights per room in the display's gauge bank. */
const MAX_LIGHT_GAUGES = 10;

/**
 * The sensors in each area with a device class in READING_CLASSES (the entity's own
 * area, else its device's), hidden and entity-category sensors left out, ordered by
 * class then name, at most MAX_READINGS per area.
 * @param {any} hass
 * @returns {RoomSensors[]} every area, sorted by name
 */
export function roomSensorsFromRegistries(hass) {
    const entities = hass?.entities ?? {};
    const devices = hass?.devices ?? {};
    const states = hass?.states ?? {};
    const cls = (/** @type {string} */ id) => READING_CLASSES.indexOf(states[id]?.attributes?.device_class);
    const label = (/** @type {string} */ id) => String(states[id]?.attributes?.friendly_name ?? id);
    /** @type {Record<string, string[]>} */
    const byArea = {};
    for (const [entityId, entry] of Object.entries(entities)) {
        if (!entityId.startsWith('sensor.') || entry?.hidden || entry?.entity_category) continue;
        if (cls(entityId) < 0) continue;
        const areaId = entry?.area_id ?? (entry?.device_id ? devices[entry.device_id]?.area_id : null);
        if (!areaId) continue;
        (byArea[areaId] ??= []).push(entityId);
    }
    return Object.values(hass?.areas ?? {})
        .filter(a => a?.area_id && a?.name)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(a => ({
            area_id: a.area_id,
            name: a.name,
            sensors: (byArea[a.area_id] ?? [])
                .sort((x, y) => cls(x) - cls(y) || label(x).localeCompare(label(y)))
                .slice(0, MAX_READINGS),
        }));
}

/**
 * An entity's name without the words it shares with its area's name ("Kitchen
 * Ceiling" in Kitchen: "CEILING"; "Test Lamp 2" in "Test Bridge": "LAMP 2"), in
 * capitals; the whole name when nothing is left.
 * @param {any} hass
 * @param {string} entityId
 * @param {string} areaName
 */
function _shortName(hass, entityId, areaName) {
    const name = String(hass?.states?.[entityId]?.attributes?.friendly_name ?? entityId.split('.')[1].replace(/_/g, ' '));
    const areaWords = new Set(String(areaName ?? '').toLowerCase().split(/\s+/).filter(Boolean));
    const kept = name.split(/\s+/).filter(w => !areaWords.has(w.toLowerCase()));
    return (kept.length ? kept.join(' ') : name).toUpperCase();
}

/**
 * A small panel block: a code (or label) at the middle right; `undefined` content
 * gets a random code, `null` none.
 * @param {string|null|undefined} content
 * @param {{ color?: string|null, preset?: string, entity?: string|null, [key: string]: any }} [opts]
 */
function _block(content, { color = null, preset = 'panel-light', entity = null, ...extra } = {}) {
    return {
        type: 'custom:lcards-button',
        preset,
        min_height: 0,
        ...(entity ? { entity } : {}),
        text: { label: content === null ? { show: false } : { ...(content === undefined ? {} : { content }), position: 'center-right', font_size: 13 } },
        ...(color ? { style: { card: { color: { background: { default: color } } } } } : {}),
        ...extra,
    };
}

/**
 * A bar segment (no label).
 * @param {string} color
 * @param {Record<string, string>} view_layout
 */
function _segment(color, view_layout) {
    return _block(null, { color, view_layout });
}

function _layout(layout, cards, extra = {}) {
    return { type: 'custom:lcards-layout-card', layout: { padding: 0, card_margin: 0, margin: 0, 'grid-gap': GAP, ...layout }, cards, ...extra };
}

/** Per-room cards, each shown while the room selector names its area (id or name). */
function _perRoom(selector, rooms, build, emptyNote) {
    const states = (/** @type {{area_id: string, name: string}} */ r) => [...new Set([r.area_id, r.name])];
    const filled = rooms.map(r => ({ room: r, card: build(r) })).filter(x => x.card);
    const cards = filled.map(({ room, card }) => ({ ...card, visibility: [{ condition: 'state', entity: selector, state: states(room) }] }));
    cards.push({
        ...emptyNote,
        ...(filled.length ? { visibility: [{ condition: 'state', entity: selector, state_not: filled.flatMap(x => states(x.room)) }] } : {}),
    });
    return cards;
}

const _note = (text) => ({
    type: 'custom:lcards-button', preset: 'text-only', min_height: 0, interactive: false,
    text: { label: { content: text, show: true, position: 'top-left', font_size: 14, color: STRUCTURE } },
});

// ── Areas ────────────────────────────────────────────────────────────────

/** Header: a segmented bar over a row of code blocks and the room title. */
function _top(roomEntity, topBarEntity) {
    const title = roomEntity
        ? `{{ (area_name(states('${roomEntity}')) or states('${roomEntity}')) | upper }}`
        : 'LCARS';
    return _layout({
        'grid-template-columns': '64px 150px 96px minmax(0, 1fr) 64px',
        'grid-template-rows': '12px 48px',
    }, [
        _segment(DARK, { 'grid-column': '1 / 3', 'grid-row': '1' }),
        _segment(STRUCTURE, { 'grid-column': '3 / 5', 'grid-row': '1' }),
        _segment(ACCENT, { 'grid-column': '5', 'grid-row': '1' }),
        _block('47-2201', { preset: 'panel-dark', color: DARK, view_layout: { 'grid-column': '1', 'grid-row': '2' } }),
        _block('HOME · OPS', { view_layout: { 'grid-column': '2', 'grid-row': '2' } }),
        {
            type: 'custom:lcards-button', preset: 'text-only', min_height: 0, interactive: false,
            ...(roomEntity ? { entity: roomEntity } : {}),
            text: { label: { content: title, show: true, position: 'center-right', font_size: 40, color: ACCENT } },
            view_layout: { 'grid-column': '3 / -1', 'grid-row': '2' },
        },
    ], {
        view_layout: { 'grid-area': 'top' },
        ...(topBarEntity ? { visibility: [{ condition: 'state', entity: topBarEntity, state: 'on' }] } : {}),
    });
}

/** Code-block column: two wide, broken by a short number cascade. */
function _codeColumn() {
    const top = Array.from({ length: 16 }, (_, i) => _block(undefined, {
        preset: i % 5 === 3 ? 'panel-dark' : 'panel-light',
        ...(i === 2 ? { color: ACCENT } : i % 5 === 3 ? { color: DARK } : {}),
    }));
    const bottom = Array.from({ length: 12 }, (_, i) => _block(undefined, { preset: i % 4 === 1 ? 'panel-dark' : 'panel-light', ...(i % 4 === 1 ? { color: DARK } : {}) }));
    return _layout({
        'grid-template-columns': '64px 64px',
        'grid-template-rows': 'repeat(8, 24px) minmax(0, 1fr) repeat(6, 24px)',
    }, [
        ...top.map(c => ({ ...c, text: { label: { position: 'center-right', font_size: 13 } } })),
        {
            type: 'custom:lcards-data-grid', data_mode: 'decorative', format: 'digit',
            grid: { 'grid-template-columns': 'repeat(2, 56px)', 'grid-template-rows': 'repeat(24, 20px)', gap: 2 },
            style: { font_size: 14, color: STRUCTURE, align: 'right' },
            view_layout: { 'grid-column': '1 / -1', 'grid-row': '9', overflow: 'hidden' },
        },
        ...bottom.map((c, i) => ({ ...c, text: { label: { position: 'center-right', font_size: 13 } }, view_layout: { 'grid-column': String(1 + (i % 2)), 'grid-row': String(10 + Math.floor(i / 2)) } })),
    ], { view_layout: { 'grid-area': 'code' } });
}

/** A room's lights as a gauge bank (tap a cap or drag to dim), with ALL ON / ALL OFF for the area. */
function _lightBank(hass, room) {
    const lights = room.lights.slice(0, MAX_LIGHT_GAUGES);
    const area = (/** @type {string} */ service) => ({ action: 'perform-action', perform_action: `light.${service}`, target: { area_id: room.area_id } });
    return _layout({
        'grid-template-columns': `96px repeat(${lights.length}, 72px) 24px minmax(0, 320px)`,
        'grid-template-rows': '28px 28px minmax(0, 1fr)',
        height: '100%',
    }, [
        _block('ALL ON', { tap_action: area('turn_on'), view_layout: { 'grid-column': '1', 'grid-row': '1' } }),
        _block('ALL OFF', { preset: 'panel-dark', color: DARK, tap_action: area('turn_off'), view_layout: { 'grid-column': '1', 'grid-row': '2' } }),
        // the room's lights as a readings table beside the bank
        _block('LIGHTING', { preset: 'text-only', view_layout: { 'grid-column': String(lights.length + 3), 'grid-row': '1' },
            text: { label: { content: 'LIGHTING', show: true, position: 'center-left', font_size: 14, color: ACCENT } } }),
        {
            type: 'custom:lcards-data-grid', data_mode: 'data',
            rows: lights.map((id, i) => ({ values: [`L${i + 1}`, _shortName(hass, id, room.name), id], style: { color: i === 0 ? ACCENT : STRUCTURE } })),
            columns: [{ style: { align: 'left' } }, { style: { align: 'left' } }, { style: { align: 'right' } }],
            grid: { 'grid-template-columns': '28px minmax(0, 1fr) 60px', 'grid-template-rows': `repeat(${lights.length}, 22px)`, gap: '0px 6px' },
            style: { font_size: 14, text_transform: 'uppercase' },
            view_layout: { 'grid-column': String(lights.length + 3), 'grid-row': '2 / -1' },
        },
        ...lights.map((id, i) => ({
            type: 'custom:lcards-slider', preset: 'picard-gauge-column', entity: id,
            style: { gauge: { scale: { labels: { enabled: false } } } },
            text: { name: { content: _shortName(hass, id, room.name).slice(0, 8) } },
            hold_action: { action: 'more-info' },
            view_layout: { 'grid-column': String(i + 2), 'grid-row': '1 / -1' },
        })),
    ]);
}

/** The display: a sweep open on the right round the room column and its lights. */
function _centre(hass, roomEntity, rooms) {
    const sweep = {
        type: 'custom:lcards-elbow',
        elbow: { type: 'frame', segment: { color: STRUCTURE }, frame: { bar_width: 14, bar_height: 12, outer_curve: 60, right: { enabled: false } } },
        view_layout: { 'grid-area': 'centre' },
    };
    if (!roomEntity || !(roomEntity in (hass?.states ?? {}))) {
        return [sweep, { ..._layout({ padding: '28px 16px 28px 34px', 'grid-template-columns': 'minmax(0, 1fr)', 'grid-template-rows': 'minmax(0, 1fr)' },
            [_note('PICK A ROOM SELECTOR IN THE DASHBOARD SETTINGS TO SHOW THE ROOM LIGHT PANEL.')]), view_layout: { 'grid-area': 'centre' } }];
    }
    const textMode = roomEntity.startsWith('input_text.');
    const roomMenu = {
        type: 'custom:lcards-select-menu', entity: roomEntity, preset: 'panel-dark',
        grid: { columns: 1, gap: GAP, 'grid-auto-rows': '28px', height: 'fit' },
        button_template: { min_height: 0, text: { label: { show: true, position: 'center-right', font_size: 13 } } },
        ...(textMode ? { options: rooms.map(r => ({ value: r.area_id, label: r.name.toUpperCase(), tap_action: areaSelectAction(roomEntity, r.area_id) })) } : {}),
        view_layout: { 'grid-column': '1', 'grid-row': '1', 'overflow-y': 'auto' },
    };
    const lists = _perRoom(roomEntity, rooms,
        (/** @type {RoomLights} */ r) => (r.lights.length ? _lightBank(hass, r) : null),
        _note('NO LIGHTS IN THIS ROOM'));
    return [sweep, _layout({
        padding: '28px 16px 28px 34px',
        'grid-template-columns': '150px minmax(0, 1fr)',
        'grid-template-rows': 'minmax(0, 1fr)',
    }, [
        roomMenu,
        // every room's bank in one cell; Visibility shows the picked one
        _layout({ 'grid-template-columns': 'minmax(0, 1fr)', 'grid-template-rows': 'minmax(0, 1fr)' },
            lists.map(c => ({ ...c, view_layout: { 'grid-column': '1', 'grid-row': '1' } })),
            { view_layout: { 'grid-column': '2', 'grid-row': '1' } }),
    ], { view_layout: { 'grid-area': 'centre' } })];
}

/** The side column: the picked room's readings and up to three gauges. */
function _side(hass, roomEntity, sensorRooms, rightSidebarEntity) {
    const room = (/** @type {RoomSensors} */ r) => {
        if (!r.sensors.length) return null;
        const gauges = r.sensors.filter(id => GAUGE_CODES[hass.states[id]?.attributes?.device_class]).slice(0, MAX_GAUGES);
        return _layout({
            'grid-template-columns': 'minmax(0, 1fr)',
            'grid-template-rows': `${r.sensors.length * 22 + 4}px minmax(0, 1fr)`,
            height: '100%',
        }, [
            {
                type: 'custom:lcards-data-grid', data_mode: 'data',
                rows: r.sensors.map((id, i) => ({ values: [String(i + 1).padStart(2, '0'), _shortName(hass, id, r.name), id], style: { color: i === 0 ? ACCENT : STRUCTURE } })),
                columns: [{ style: { align: 'left' } }, { style: { align: 'left' } }, { style: { align: 'right' } }],
                grid: { 'grid-template-columns': '22px minmax(0, 1fr) 70px', 'grid-template-rows': `repeat(${r.sensors.length}, 22px)`, gap: '0px 6px' },
                style: { font_size: 14, text_transform: 'uppercase' },
            },
            ...(gauges.length ? [_layout({
                'grid-template-columns': `repeat(${gauges.length}, 56px)`, 'grid-template-rows': 'minmax(0, 1fr)', 'justify-content': 'end',
            }, gauges.map(id => ({
                type: 'custom:lcards-slider', preset: 'picard-gauge-column', entity: id,
                style: { gauge: { scale: { labels: { enabled: false } } } },
                text: { name: { content: GAUGE_CODES[hass.states[id].attributes.device_class] } },
            })))] : []),
        ]);
    };
    const body = roomEntity && roomEntity in (hass?.states ?? {})
        ? _perRoom(roomEntity, sensorRooms, room, _note('NO SENSORS IN THIS ROOM'))
        : [_note('NO ROOM SELECTED')];
    return _layout({
        'grid-template-columns': 'minmax(0, 1fr)',
        'grid-template-rows': '12px 24px minmax(0, 1fr) 12px',
    }, [
        _segment(STRUCTURE, { 'grid-row': '1' }),
        _block('ENVIRONMENT', { preset: 'text-only', view_layout: { 'grid-row': '2' }, text: { label: { content: 'ENVIRONMENT', show: true, position: 'center-left', font_size: 14, color: ACCENT } } }),
        _layout({ 'grid-template-columns': 'minmax(0, 1fr)', 'grid-template-rows': 'minmax(0, 1fr)' },
            body.map(c => ({ ...c, view_layout: { 'grid-column': '1', 'grid-row': '1' } })), { view_layout: { 'grid-row': '3' } }),
        _segment(DARK, { 'grid-row': '4' }),
    ], {
        view_layout: { 'grid-area': 'side' },
        ...(rightSidebarEntity ? { visibility: [{ condition: 'state', entity: rightSidebarEntity, state: 'on' }] } : {}),
    });
}

/** Utility pills in a bracket open on the right edge; red alert at the bottom. */
function _pills(topBarEntity, rightSidebarEntity) {
    const pill = (label, entity) => ({
        type: 'custom:lcards-button', preset: 'lozenge', min_height: 0,
        ...(entity ? { entity, tap_action: { action: 'toggle' } } : { interactive: false }),
        text: { label: { content: label, show: true, position: 'center', font_size: 13, color: entity ? DARK : STRUCTURE } },
        ...(entity ? {} : { style: { card: { color: { background: { default: DARK } } } } }),
    });
    return [
        {
            type: 'custom:lcards-elbow',
            elbow: { type: 'frame', segment: { color: STRUCTURE }, frame: { bar_width: 14, bar_height: 36, outer_curve: 36, right: { enabled: false } } },
            view_layout: { 'grid-area': 'pills' },
        },
        _layout({
            padding: '46px 4px 46px 22px',
            'grid-template-columns': 'minmax(0, 1fr)',
            'grid-template-rows': '26px 26px 26px minmax(0, 1fr) repeat(3, 24px) 26px',
        }, [
            pill('TOP BAR', topBarEntity),
            pill('SIDEBAR', rightSidebarEntity),
            pill('DIMMER', null),
            { type: 'custom:lcards-button', preset: 'text-only', min_height: 0, interactive: false, text: { label: { show: false } } },
            _block(undefined, {}), _block(undefined, { preset: 'panel-dark', color: DARK }), _block(undefined, { color: ACCENT }),
            {
                type: 'custom:lcards-button', preset: 'lozenge', min_height: 0,
                text: { label: { content: 'RED ALERT', show: true, position: 'center', font_size: 13 } },
                style: { card: { color: { background: { default: 'var(--lcars-alert-color, var(--lcards-orange-dark))' } } } },
                tap_action: { action: 'perform-action', perform_action: 'lcards.red_alert' },
            },
        ], { view_layout: { 'grid-area': 'pills' } }),
    ];
}

/**
 * Page tabs over a segmented bar. One row whatever the number of pages: the strip is
 * one row tall, so a capped column count wrapped the ninth page onto a hidden row.
 */
function _strip(hass, pageEntity) {
    const options = hass?.states?.[pageEntity]?.attributes?.options;
    const tabs = pageEntity && pageEntity in (hass?.states ?? {})
        ? {
            type: 'custom:lcards-select-menu', entity: pageEntity, preset: 'toggle-tab',
            grid: { columns: Math.max(1, Array.isArray(options) ? options.length : 4), gap: GAP, 'grid-auto-rows': '30px' },
        }
        : _note('PICK A PAGE SELECTOR IN THE DASHBOARD SETTINGS FOR THE PAGE TABS.');
    return _layout({
        'grid-template-columns': '150px minmax(0, 1fr) 96px 64px',
        'grid-template-rows': '30px 12px',
        'align-content': 'end',
    }, [
        _block('PAGES', { preset: 'panel-dark', color: DARK, view_layout: { 'grid-column': '1', 'grid-row': '1' } }),
        { ...tabs, view_layout: { 'grid-column': '2 / -1', 'grid-row': '1' } },
        _segment(STRUCTURE, { 'grid-column': '1 / 3', 'grid-row': '2' }),
        _segment(ACCENT, { 'grid-column': '3', 'grid-row': '2' }),
        _segment(DARK, { 'grid-column': '4', 'grid-row': '2' }),
    ], { view_layout: { 'grid-area': 'strip' } });
}

/**
 * The Picard shell view.
 * @param {any} hass
 * @param {{ roomEntity: string|null, pageEntity: string|null, topBarEntity: string|null, rightSidebarEntity: string|null }} entities
 */
export function buildPicardShellView(hass, { roomEntity, pageEntity, topBarEntity, rightSidebarEntity }) {
    const rooms = roomLightsFromRegistries(hass);
    const sensorRooms = roomSensorsFromRegistries(hass);
    return {
        title: 'LCARS',
        path: 'lcars',
        type: 'custom:lcards-layout-view',
        layout: {
            height: 'calc(100dvh - var(--header-height, 56px))',
            padding: '8px',
            margin: 0,
            card_margin: 0,
            'grid-gap': GAP,
            // Fixed side columns; only the display grows. The top row and the side
            // column collapse when their toggles hide them.
            'grid-template-columns': '134px minmax(0, 1fr) 220px 116px',
            'grid-template-rows': 'auto minmax(0, 1fr) 48px',
            'grid-template-areas': `
"code  top    top   pills"
"code  centre side  pills"
"strip strip  strip pills"`,
            mediaquery: {
                '(max-width: 1010px)': {
                    'grid-template-columns': '0px minmax(0, 1fr) 190px 96px',
                },
            },
        },
        cards: [
            _top(roomEntity, topBarEntity),
            _codeColumn(),
            ..._centre(hass, roomEntity, rooms),
            _side(hass, roomEntity, sensorRooms, rightSidebarEntity),
            ..._pills(topBarEntity, rightSidebarEntity),
            _strip(hass, pageEntity),
            {
                type: 'custom:lcards-alert-overlay',
                dismiss_mode: 'dismiss',
                height: '33%',
                width: '50%',
                layers: { backdrop: { preset: 'blur', amount: '8px' }, canvas: null },
                position: 'center',
                view_layout: { 'grid-area': 'centre' },
            },
        ],
    };
}

export class LCARdSShellPicardDashboardStrategy extends HTMLElement {
    static configRequired = true;

    static getCreateSuggestions(_hass) {
        return { title: 'LCARS', icon: 'mdi:view-dashboard-variant' };
    }

    static getConfigElement() {
        return document.createElement('lcards-shell-strategy-editor');
    }

    /**
     * @param {object} config - strategy config (from the settings form)
     * @param {object} hass
     * @returns {Promise<{ views: Array }>}
     */
    static async generate(config, hass) {
        const entities = {
            roomEntity: config?.room_selector_entity || null,
            pageEntity: config?.page_selector_entity || null,
            topBarEntity: config?.top_bar_entity || null,
            rightSidebarEntity: config?.right_sidebar_entity || null,
        };
        lcardsLog.debug('[LCARdSShellPicardStrategy] generate()', entities);
        return { views: [buildPicardShellView(hass, entities)] };
    }
}
