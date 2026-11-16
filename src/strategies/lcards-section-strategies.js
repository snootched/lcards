/**
 * @fileoverview LCARS section strategies: LCARdS building blocks for Home
 * Assistant's sections views (reports/strategies-plan.md S5).
 *
 * Home Assistant lists them under "Community sections" in Create section →
 * Automatic section, with a live preview from getStubConfig(). Like its own
 * Entities section, each takes a `title` and a `target` (areas, devices, floors,
 * labels or entities), finds the matching entities in the registries when it is
 * generated, and is generated again when the registries change. Each also takes a
 * `look` (classic or Picard), a `frame` in that look, `columns` and `max_items`.
 *
 * Sizes follow the sections grid: 12 columns, 56 px rows (`grid_options`).
 */

import { LitElement, html } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { LCARS_SECTION_CATALOG } from './strategy-catalog.js';
import '../editor/components/shared/lcards-form-section.js';

const ACCENT = 'theme:colors.ui.tertiary';
const STRUCTURE = 'theme:colors.ui.secondary';

/** Sensor device classes the readings table lists first, in this order. */
const READING_CLASSES = ['temperature', 'humidity', 'illuminance', 'carbon_dioxide', 'pressure', 'power', 'energy', 'battery'];
const TOGGLE_DOMAINS = ['light', 'switch', 'fan', 'input_boolean'];

/**
 * @typedef {{ entity_id?: string|string[], device_id?: string|string[], area_id?: string|string[],
 *   floor_id?: string|string[], label_id?: string|string[] }} Target
 * @typedef {{ type: string, title?: string, target?: Target, look?: 'classic'|'picard', frame?: boolean,
 *   columns?: number, max_items?: number, mode?: 'numbers'|'table', gap?: number, padding?: number,
 *   header_gap?: number, codes?: boolean, item_height?: number }} SectionConfig
 */

const list = (/** @type {any} */ v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** An entity's area: its own, else its device's. */
function entityArea(hass, entityId) {
    const entry = hass?.entities?.[entityId];
    return entry?.area_id ?? (entry?.device_id ? hass?.devices?.[entry.device_id]?.area_id : null) ?? null;
}

/**
 * The entity ids a target names: entities directly; devices, areas (an entity's own
 * area or its device's), floors (their areas) and labels (on entities, devices or
 * areas) through the registries. Hidden and entity-category entities are left out
 * unless named directly, as Home Assistant's Entities section does.
 * @param {any} hass
 * @param {Target|undefined} target
 * @returns {string[]}
 */
export function resolveTarget(hass, target) {
    if (!target) return [];
    const entities = hass?.entities ?? {};
    const devices = hass?.devices ?? {};
    const areas = hass?.areas ?? {};
    const direct = new Set(list(target.entity_id));
    const deviceIds = new Set(list(target.device_id));
    const areaIds = new Set(list(target.area_id));
    const labelIds = new Set(list(target.label_id));
    for (const floor of list(target.floor_id)) {
        for (const a of Object.values(areas)) if (a?.floor_id === floor) areaIds.add(a.area_id);
    }
    for (const a of Object.values(areas)) if (list(a?.labels).some(l => labelIds.has(l))) areaIds.add(a.area_id);
    for (const d of Object.values(devices)) if (list(d?.labels).some(l => labelIds.has(l))) deviceIds.add(d.id);
    const out = new Set([...direct].filter(id => id in (hass?.states ?? {})));
    for (const [id, entry] of Object.entries(entities)) {
        if (entry?.hidden || entry?.entity_category) continue;
        if (!(id in (hass?.states ?? {}))) continue;
        if ((entry?.device_id && deviceIds.has(entry.device_id))
            || areaIds.has(entityArea(hass, id))
            || list(entry?.labels).some(l => labelIds.has(l))) out.add(id);
    }
    return [...out];
}

/** A name without the words it shares with the area's name, in capitals. */
function shortName(hass, entityId) {
    const name = String(hass?.states?.[entityId]?.attributes?.friendly_name ?? entityId.split('.')[1].replace(/_/g, ' '));
    const area = hass?.areas?.[entityArea(hass, entityId) ?? '']?.name ?? '';
    const areaWords = new Set(area.toLowerCase().split(/\s+/).filter(Boolean));
    const kept = name.split(/\s+/).filter(w => !areaWords.has(w.toLowerCase()));
    return (kept.length ? kept.join(' ') : name).toUpperCase();
}

/**
 * Labels for a section's entities: each short name, without the leading words every
 * name shares ("TORONTO TEMPERATURE", "TORONTO HUMIDITY": "TEMPERATURE", "HUMIDITY").
 * @param {any} hass
 * @param {string[]} ids
 * @returns {Map<string, string>}
 */
export function sectionLabels(hass, ids) {
    const words = new Map(ids.map(id => [id, shortName(hass, id).split(/\s+/)]));
    let shared = 0;
    if (ids.length > 1) {
        const first = words.get(ids[0]) ?? [];
        while (shared < first.length - 1
            && ids.every(id => { const w = words.get(id) ?? []; return w.length > shared + 1 && w[shared] === first[shared]; })) shared++;
    }
    return new Map(ids.map(id => [id, (words.get(id) ?? []).slice(shared).join(' ')]));
}

/** Short forms for long words that end sensor names. */
const CAP_WORDS = /** @type {Record<string, string>} */ ({ TEMPERATURE: 'TEMP', HUMIDITY: 'HUMID', BATTERY: 'BATT', PRESSURE: 'PRESS', ILLUMINANCE: 'LUX', BRIGHTNESS: 'BRIGHT' });
/** A gauge cap: the label's last word (or its short form), at most 8 letters. */
const capLabel = (/** @type {string} */ label) => {
    const word = label.split(/\s+/).pop() ?? label;
    return (CAP_WORDS[word] ?? word).slice(0, 8);
};

const byName = (hass) => (/** @type {string} */ a, /** @type {string} */ b) => shortName(hass, a).localeCompare(shortName(hass, b));

/** The section's title: its own, else the target's one area, else the fallback. */
function sectionTitle(hass, config, fallback) {
    if (config.title) return config.title;
    const areaIds = list(config.target?.area_id);
    if (areaIds.length === 1 && hass?.areas?.[areaIds[0]]) return hass.areas[areaIds[0]].name.toUpperCase();
    return fallback;
}

function header(title) {
    return {
        // half a section row, as the bracket's and the Picard title bars; bar-label
        // sizes its label to the bar (font_size_percent 100)
        type: 'custom:lcards-button', preset: 'bar-label-left', height: 28, min_height: 0,
        text: { label: { content: title } },
        grid_options: { columns: 'full', rows: 'auto' },
    };
}

/**
 * The Picard title (Titan.DS PROPULSION): a short block, a long thin bar with a
 * hairline under it, the title at the right end in the accent, a small square cap.
 * @param {string} title
 */
function picardHeader(title) {
    const H = 28; // half a section row, as the reference title bars
    const bar = (/** @type {string} */ col, /** @type {string} */ row) => ({
        type: 'custom:lcards-button', preset: 'panel-light', min_height: 0, interactive: false, text: { label: { show: false } },
        style: { card: { color: { background: { default: ACCENT } } } }, view_layout: { 'grid-column': col, 'grid-row': row },
    });
    return {
        type: 'custom:lcards-layout-card',
        layout: {
            padding: 0, card_margin: 0, margin: 0, height: `${H}px`, 'grid-gap': '4px 6px',
            'grid-template-columns': '28px minmax(0, 1.3fr) minmax(0, 1fr) 12px',
            'grid-template-rows': 'minmax(0, 1fr) 3px',
        },
        cards: [
            // the block, the long bar over its hairline, the title, the cap: all the header's height
            bar('1', '1 / -1'),
            bar('2', '1'),
            bar('2', '2'),
            {
                type: 'custom:lcards-button', preset: 'text-only', interactive: false, min_height: 0,
                // the capitals fill the bar (LCARS fonts: capitals about the font size, as bar-label's 100%)
                text: { label: { content: title, show: true, position: 'center-right', font_size_percent: 100, cap_height_ratio: 0.86, padding: { top: 0, bottom: 0, left: 8, right: 0 }, font_weight: 100, text_transform: 'uppercase', color: ACCENT, fit: true } },
                view_layout: { 'grid-column': '3', 'grid-row': '1 / -1' },
            },
            bar('4', '1 / -1'),
        ],
        grid_options: { columns: 'full', rows: 'auto' },
    };
}

function note(text) {
    return {
        type: 'custom:lcards-button', preset: 'text-only', interactive: false,
        text: { label: { content: text, show: true, position: 'center-left', font_size: 14, color: STRUCTURE } },
        grid_options: { columns: 'full', rows: 1 },
    };
}

/** The area with the most entities passing `match` (the stub's target), as Home Assistant's Entities section does for lights. */
function busiestArea(hass, match) {
    /** @type {Map<string, number>} */
    const counts = new Map();
    for (const [id, entry] of Object.entries(hass?.entities ?? {})) {
        if (entry?.hidden || entry?.entity_category || !match(id)) continue;
        const area = entityArea(hass, id);
        if (area) counts.set(area, (counts.get(area) ?? 0) + 1);
    }
    let best = null; let n = 0;
    for (const [area, c] of counts) if (c > n) { best = area; n = c; }
    return best;
}

// ── The four sections ─────────────────────────────────────────────────────

const isReading = (hass) => (/** @type {string} */ id) => id.startsWith('sensor.')
    && (READING_CLASSES.includes(hass?.states?.[id]?.attributes?.device_class) || !!hass?.states?.[id]?.attributes?.unit_of_measurement);
const isGauge = (hass) => (/** @type {string} */ id) => {
    const a = hass?.states?.[id]?.attributes ?? {};
    if (id.startsWith('input_number.') || id.startsWith('number.')) return true;
    return id.startsWith('sensor.') && (a.unit_of_measurement === '%' || ['temperature', 'humidity', 'battery'].includes(a.device_class));
};
const isToggle = (/** @type {string} */ id) => TOGGLE_DOMAINS.includes(id.split('.')[0]);

/**
 * One section kind. `build` gives the items and their size for a look; the frame,
 * the title bar and the grid around them are shared (frameSection()).
 * @typedef {{ items: any[], columns: number, itemHeight: number, sideBar?: boolean, fixed?: boolean }} SectionBody
 * @type {Record<string, { name: string, description: string, fallbackTitle: string, domains: string[],
 *   match: (hass: any) => (id: string) => boolean, max: number,
 *   build: (hass: any, ids: string[], look: 'classic'|'picard', columns: number|undefined, mode?: string, size?: number) => SectionBody }>}
 */
export const LCARS_SECTIONS = {
    'lcars-readings': {
        ...LCARS_SECTION_CATALOG['lcars-readings'],
        fallbackTitle: 'READINGS', domains: ['sensor'], max: 12,
        match: isReading,
        build: (hass, ids, look, columns, mode, size) => {
            const order = (/** @type {string} */ id) => {
                const i = READING_CLASSES.indexOf(hass.states[id]?.attributes?.device_class);
                return i < 0 ? READING_CLASSES.length : i;
            };
            const sorted = [...ids].sort((a, b) => order(a) - order(b) || byName(hass)(a, b));
            const labels = sectionLabels(hass, sorted);
            const asTable = mode === 'table' || (mode !== 'numbers' && look === 'picard');
            if (asTable) {
                // a table's lines are its own grid rows: item_height sets a line
                const line = Math.max(16, size ?? 24);
                const tableHeight = sorted.length * line + 8;
                // the text two thirds of a line (16 on the default 24)
                const font = Math.round(line * 2 / 3);
                if (look === 'picard') {
                    // The Picard readings table: numbered rows, the first in the accent
                    return {
                        columns: 1, itemHeight: tableHeight,
                        items: [{
                            type: 'custom:lcards-data-grid', data_mode: 'data',
                            rows: sorted.map((id, i) => ({ values: [String(i + 1).padStart(2, '0'), labels.get(id), id], style: { color: i === 0 ? ACCENT : STRUCTURE } })),
                            columns: [{ style: { align: 'left' } }, { style: { align: 'left' } }, { style: { align: 'right' } }],
                            grid: { 'grid-template-columns': '24px minmax(0, 1fr) minmax(0, auto)', 'grid-template-rows': `repeat(${sorted.length}, ${line}px)`, gap: '0px 8px' },
                            style: { font_size: font, text_transform: 'uppercase' },
                        }],
                    };
                }
                // The classic table (TNG "Critical systems report"): names in the
                // accent, the values beside them in the structure colour
                return {
                    columns: 1, itemHeight: tableHeight,
                    items: [{
                        type: 'custom:lcards-data-grid', data_mode: 'data',
                        rows: sorted.map(id => ({ values: [`${labels.get(id)}:`, id] })),
                        columns: [{ style: { align: 'left', color: ACCENT } }, { style: { align: 'left', color: STRUCTURE } }],
                        grid: { 'grid-template-columns': 'minmax(0, max-content) minmax(0, 1fr)', 'grid-template-rows': `repeat(${sorted.length}, ${line}px)`, gap: '0px 16px' },
                        style: { font_size: font, text_transform: 'uppercase' },
                    }],
                };
            }
            // The number column (TNG ops panels): the value as a big number, a small
            // block, then the name in a pill (classic, rounded on the right) or a
            // filled button (Picard); tap for the more-info dialog
            // the big numbers are the row's height (their font follows item_height)
            const H = Math.max(20, size ?? 34);
            return {
                columns: columns ?? 1, itemHeight: H,
                items: sorted.map(id => ({
                    type: 'custom:lcards-layout-card',
                    layout: { padding: 0, card_margin: 0, margin: 0, 'grid-gap': '6px', 'grid-template-columns': 'minmax(0, 0.6fr) 14px minmax(0, 1fr)', 'grid-template-rows': 'minmax(0, 1fr)' },
                    cards: [
                        { type: 'custom:lcards-button', preset: 'text-only', entity: id, interactive: false, min_height: 0,
                            text: { state: { show: true, position: 'center-right', font_size: H, font_weight: 100, color: ACCENT, fit: true }, label: { show: false }, name: { show: false } } },
                        { type: 'custom:lcards-button', preset: 'panel-light', min_height: 0, interactive: false, text: { label: { show: false } },
                            style: { card: { color: { background: { default: STRUCTURE } } } } },
                        look === 'picard'
                            ? { type: 'custom:lcards-button', preset: 'filled', entity: id, min_height: 0,
                                text: { name: { content: labels.get(id), fit: true } },
                                style: { card: { color: { background: { default: STRUCTURE, active: STRUCTURE, inactive: STRUCTURE } } } },
                                tap_action: { action: 'more-info' } }
                            : { type: 'custom:lcards-button', preset: 'bullet', entity: id, min_height: 0, show_icon: false,
                                text: { label: { content: labels.get(id), show: true, position: 'bottom-left', padding: { left: 12, bottom: 2 }, fit: true }, state: { show: false }, name: { show: false } },
                                style: { card: { color: { background: { default: STRUCTURE, active: STRUCTURE, inactive: STRUCTURE } } } },
                                tap_action: { action: 'more-info' } },
                    ],
                })),
            };
        },
    },
    'lcars-gauges': {
        ...LCARS_SECTION_CATALOG['lcars-gauges'],
        fallbackTitle: 'LEVELS', domains: ['sensor', 'input_number', 'number'], max: 8,
        match: isGauge,
        build: (hass, ids, look, columns, _mode, size) => {
            const sorted = [...ids].sort(byName(hass));
            const labels = sectionLabels(hass, sorted);
            if (look === 'picard') {
                // the column gauge needs room for its caps, scale and thumb
                return {
                    columns: columns ?? 4, itemHeight: Math.max(120, size ?? 260),
                    items: sorted.map(id => ({
                        type: 'custom:lcards-slider', preset: 'picard-gauge-column', entity: id,
                        text: { name: { content: capLabel(labels.get(id) ?? ''), fit: true } },
                        hold_action: { action: 'more-info' },
                    })),
                };
            }
            // Classic: a pill bar per level, its name in the left cap; the slider sets
            // its own height, so it takes the row's
            const bar = Math.max(24, size ?? 44);
            return {
                columns: columns ?? 1, itemHeight: bar,
                items: sorted.map(id => ({
                    type: 'custom:lcards-slider', preset: 'pills-left-border', entity: id, height: bar,
                    style: { border: { left: { size: 110 } } },
                    text: { name: { content: labels.get(id), show: true, fit: true } },
                    hold_action: { action: 'more-info' },
                })),
            };
        },
    },
    'lcars-controls': {
        ...LCARS_SECTION_CATALOG['lcars-controls'],
        fallbackTitle: 'CONTROLS', domains: TOGGLE_DOMAINS, max: 24,
        match: () => isToggle,
        build: (hass, ids, look, columns, _mode, size) => {
            const sorted = [...ids].sort(byName(hass));
            const labels = sectionLabels(hass, sorted);
            if (look === 'picard') {
                // Picard filled buttons beside a thin bar, lit while on
                return {
                    columns: columns ?? 2, itemHeight: Math.max(20, size ?? 28), sideBar: true,
                    items: sorted.map(id => ({
                        // filled: the Picard-style button (panel-* presets are chrome), its name at the right
                        type: 'custom:lcards-button', preset: 'filled', entity: id, min_height: 0,
                        text: { name: { content: labels.get(id), fit: true } },
                        tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' },
                    })),
                };
            }
            return {
                columns: columns ?? 2, itemHeight: Math.max(24, size ?? 48),
                items: sorted.map(id => ({
                    type: 'custom:lcards-button', preset: 'lozenge', entity: id, min_height: 0,
                    text: { label: { content: labels.get(id), show: true, position: 'bottom-right', padding: { right: 24, bottom: 4 }, fit: true } },
                    tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' },
                })),
            };
        },
    },
};

const GAP = 6;
/** px height of a card spanning n section rows (56 px rows, 8 px gaps) → rows for px. */
const sectionRows = (/** @type {number} */ px) => Math.max(1, Math.ceil((px + 8) / 64));
/** The title bar's height: half a section row, as the bracket's top bar. */
const HEADER = 28;
/** The classic bracket's sizes, px: the side, the top bar (it holds the title) and the foot. */
export const BRACKET = { side: 72, top: 28, foot: 14 };
/** About how tall each block of the bracket's side is, px: a taller side breaks into more blocks. */
const SIDE_BLOCK = 90;

/** n item tracks with a gap track between each two. */
function itemTracks(/** @type {number} */ n, /** @type {number} */ gap, /** @type {string} */ size = 'minmax(0, 1fr)') {
    /** @type {string[]} */
    const tracks = [];
    for (let k = 0; k < n; k++) {
        tracks.push(size);
        if (k < n - 1) tracks.push(`${gap}px`);
    }
    return tracks;
}

/**
 * The section as one layout card: the title, the items and, when asked, the frame of
 * the look round them (classic, a bracket in pieces open on the right with the title cut into
 * its top bar; Picard, a display sweep open on the right). Gaps and padding are their
 * own grid tracks (grid-gap 0), so each can be set on its own.
 * @param {SectionBody} body
 * @param {{ look: 'classic'|'picard', frame: boolean, title: string, gap: number,
 *   padding: number|undefined, headerGap: number|undefined, codes: boolean }} opts
 * @returns {any} the layout card
 */
function sectionCard(body, { look, frame, title, gap, padding, headerGap, codes }) {
    const cols = Math.max(1, Math.min(body.columns, body.items.length || 1));
    const rows = Math.max(1, Math.ceil(body.items.length / cols));
    const itemsHeight = rows * body.itemHeight + (rows - 1) * gap;
    // item_height: rows of exactly that height (any spare section height stays below); else they share it
    const rowSize = body.fixed ? `${body.itemHeight}px` : 'minmax(0, 1fr)';
    const classicFrame = frame && look === 'classic';
    const pad = padding ?? (classicFrame ? 18 : frame ? 16 : body.sideBar ? gap : 0);
    const hg = headerGap ?? (classicFrame ? 18 : 8);
    const span = '1 / -1';

    /** @type {string[]} */ let colTracks;
    /** @type {string[]} */ let rowTracks;
    /** @type {any[]} */ const cards = [];
    let colStart = 1; let rowStart = 1; let fixed = 0;

    if (classicFrame) {
        // Classic bracket in pieces, as the demo board's frames and the DS9 brackets: a top
        // sweep (its bar runs the full width, the title cut into it), a bar down the left
        // beside the items with a 6 px break at each end, and a closing sweep. The breaks
        // let each sweep keep its own curves (one continuous frame cannot suit a thick top
        // bar and a thin foot). Each sweep is one elbow across the whole width (no joins
        // to show a seam): its bar plus the header gap (top) or the padding (foot), which
        // is the room its inner curve turns in beside the items.
        const { side, top, foot } = BRACKET; const BRK = 6;
        colTracks = [`${side}px`, `${pad}px`, ...itemTracks(cols, gap)];
        rowTracks = [`${top}px`, `${hg}px`, ...itemTracks(rows, gap, rowSize), `${pad}px`, `${foot}px`];
        colStart = 3; rowStart = 3; fixed = top + hg + pad + foot;
        const lastRow = rowTracks.length;
        const blocks = Math.max(1, Math.min(8, Math.floor(itemsHeight / SIDE_BLOCK)));
        const color = 'theme:colors.ui.primary';
        const sweep = (/** @type {string} */ type, /** @type {number} */ bar, /** @type {number} */ room, /** @type {string} */ row) => ({
            // min_height 0: the sweep is exactly its rows' height, not the theme's minimum
            type: 'custom:lcards-elbow', min_height: 0,
            // the outer curve rounds the sweep's whole height; the inner turns in the room beside the items
            elbow: { type, segment: { bar_width: side, bar_height: bar, outer_curve: bar + room, inner_curve: Math.max(4, Math.min(room, pad)), color } },
            view_layout: { 'grid-column': span, 'grid-row': row },
        });
        cards.push(
            {
                ...sweep('header-left', top, hg, '1 / 3'),
                text: {
                    label: {
                        // as the classic title bar (bar-label): the capitals the bar's full
                        // height, cut into its right end, a short cap after it
                        content: title, show: true, zone: 'horizontal_bar', position: 'center-right',
                        font_size_percent: 100, cap_height_ratio: 0.86, padding: { top: 0, bottom: 0, left: 8, right: 24 },
                        font_weight: 100, text_transform: 'uppercase', color: 'var(--lcards-yellow, #FFCC99)',
                        background: { default: 'black' }, background_padding: 8, background_radius: 0, fit: true,
                    },
                },
            },
            {
                // the side down the left, a break above and below it; a tall side breaks into
                // blocks about SIDE_BLOCK px tall (as the TNG panels' block columns), each with
                // a code at its bottom right when codes are on (panel-light's own random code)
                type: 'custom:lcards-layout-card',
                layout: {
                    padding: 0, card_margin: 0, margin: 0, 'grid-gap': '0px', 'grid-template-columns': 'minmax(0, 1fr)',
                    'grid-template-rows': [`${BRK}px`, ...itemTracks(blocks, BRK), `${BRK}px`].join(' '),
                },
                cards: Array.from({ length: blocks }, (_, i) => ({
                    type: 'custom:lcards-button', preset: 'panel-light', min_height: 0, interactive: false,
                    text: { label: codes ? { show: true, position: 'bottom-right', font_size: 13, padding: { right: 6, bottom: 3 } } : { show: false } },
                    style: { card: { color: { background: { default: color } } } }, view_layout: { 'grid-column': '1', 'grid-row': String(2 + 2 * i) },
                })),
                view_layout: { 'grid-column': '1', 'grid-row': `3 / ${lastRow - 1}` },
            },
            sweep('footer-left', foot, pad, `${lastRow - 1} / ${lastRow + 1}`),
        );
    } else {
        // the title card without its sections-grid size (it sits in the layout's first row)
        const { grid_options: _size, ...head } = look === 'picard' ? picardHeader(title) : header(title);
        cards.push({ ...head, view_layout: { 'grid-column': span, 'grid-row': '1' } });
        const top = [`${HEADER}px`, `${hg}px`];
        fixed = HEADER + hg;
        if (frame) {
            // Display sweep: thin bars along the top, down the left and along the bottom
            colTracks = ['12px', `${pad}px`, ...itemTracks(cols, gap)];
            rowTracks = [...top, '10px', `${pad}px`, ...itemTracks(rows, gap, rowSize), `${pad}px`, '10px'];
            colStart = 3; rowStart = 5; fixed += 20 + 2 * pad;
            cards.push({
                type: 'custom:lcards-elbow',
                elbow: { type: 'frame', segment: { color: STRUCTURE }, frame: { bar_width: 12, bar_height: 10, outer_curve: 34, right: { enabled: false } } },
                view_layout: { 'grid-column': span, 'grid-row': '3 / -1' },
            });
        } else if (body.sideBar) {
            // A thin chrome bar beside the items (panel-light is chrome, not a button)
            colTracks = ['14px', `${pad}px`, ...itemTracks(cols, gap)];
            rowTracks = [...top, ...itemTracks(rows, gap, rowSize)];
            colStart = 3; rowStart = 3;
            cards.push({
                type: 'custom:lcards-button', preset: 'panel-light', min_height: 0, interactive: false, text: { label: { show: false } },
                style: { card: { color: { background: { default: STRUCTURE } } } }, view_layout: { 'grid-column': '1', 'grid-row': '3 / -1' },
            });
        } else {
            colTracks = [`${pad}px`, ...itemTracks(cols, gap), `${pad}px`];
            rowTracks = [...top, `${pad}px`, ...itemTracks(rows, gap, rowSize), `${pad}px`];
            colStart = 2; rowStart = 4; fixed += 2 * pad;
        }
    }
    body.items.forEach((card, i) => cards.push({
        ...card,
        view_layout: { 'grid-column': String(colStart + 2 * (i % cols)), 'grid-row': String(rowStart + 2 * Math.floor(i / cols)) },
    }));
    return {
        type: 'custom:lcards-layout-card',
        layout: { padding: 0, card_margin: 0, margin: 0, 'grid-gap': '0px', 'grid-template-columns': colTracks.join(' '), 'grid-template-rows': rowTracks.join(' ') },
        cards,
        grid_options: { columns: 'full', rows: sectionRows(fixed + itemsHeight) },
    };
}

/** A non-negative px number from the config, else undefined (the look's default). */
const px = (/** @type {any} */ v, /** @type {number} */ max = 64) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Math.max(0, Math.min(max, Number(v))) : undefined);

/**
 * Generate one section.
 * @param {string} key - LCARS_SECTIONS key
 * @param {SectionConfig} config
 * @param {any} hass
 */
export function generateLcarsSection(key, config, hass) {
    const def = LCARS_SECTIONS[key];
    const match = def.match(hass);
    const cfg = config ?? { type: key };
    const ids = resolveTarget(hass, cfg.target).filter(match);
    const look = cfg.look === 'picard' ? 'picard' : 'classic';
    const title = sectionTitle(hass, cfg, def.fallbackTitle);
    const max = Math.max(1, Math.floor(Number(cfg.max_items) || def.max));
    const columns = Number(cfg.columns) > 0 ? Math.min(6, Math.floor(Number(cfg.columns))) : undefined;
    lcardsLog.debug(`[LCARSSection] ${key}: ${ids.length} entities`);
    if (!cfg.target || !ids.length) {
        return { type: 'grid', cards: [header(title), note(!cfg.target ? 'PICK AN AREA OR OTHER TARGET IN THE SECTION SETTINGS.' : 'NOTHING TO SHOW FOR THIS TARGET.')] };
    }
    const size = px(cfg.item_height, 400);
    const body = { ...def.build(hass, ids.slice(0, max), look, columns, cfg.mode, size), fixed: size !== undefined };
    return {
        type: 'grid',
        cards: [sectionCard(body, {
            look, frame: cfg.frame === true, title,
            gap: px(cfg.gap) ?? GAP, padding: px(cfg.padding), headerGap: px(cfg.header_gap), codes: cfg.codes === true,
        })],
    };
}

// ── Strategy classes, settings form, registration ─────────────────────────

/** The settings form (the section dialog's Strategy tab): a title and a target. */
export class LCARdSSectionStrategyEditor extends LitElement {
    static properties = { hass: { attribute: false }, _config: { state: true } };

    constructor() {
        super();
        this.hass = undefined;
        /** @type {SectionConfig} */
        this._config = { type: '' };
    }

    /** @param {SectionConfig} config */
    setConfig(config) {
        this._config = config;
    }

    /**
     * The form in groups, each an outlined LCARdS section as in the card editors and
     * studios: what the section shows, its look, its items and its spacing.
     * @returns {Array<{ header: string, icon: string, description: string, schema: any[] }>}
     */
    _groups() {
        const key = String(this._config?.type ?? '').replace(/^custom:/, '');
        const domains = LCARS_SECTIONS[key]?.domains;
        const px = { number: { min: 0, max: 64, mode: 'box', unit_of_measurement: 'px' } };
        return [
            { header: 'Target', icon: 'mdi:target', description: 'What the section shows and its title.', schema: [
                { name: 'target', selector: { target: domains ? { entity: { domain: domains } } : {} } },
                { name: 'title', selector: { text: {} } },
            ] },
            { header: 'Look', icon: 'mdi:palette-outline', description: 'The LCARS era and the frame round the items.', schema: [
                { name: 'look', selector: { select: { mode: 'box', options: [
                    { value: 'classic', label: 'Classic' },
                    { value: 'picard', label: 'Picard' },
                ] } } },
                ...(key === 'lcars-readings' ? [{ name: 'mode', selector: { select: { mode: 'box', options: [
                    { value: 'numbers', label: 'Number column' },
                    { value: 'table', label: 'Table' },
                ] } } }] : []),
                { name: 'frame', selector: { boolean: {} } },
                { name: 'codes', selector: { boolean: {} } },
            ] },
            { header: 'Items', icon: 'mdi:view-grid-outline', description: 'How many items, how many side by side and how tall. Empty: what suits the section and look.', schema: [
                { type: 'grid', name: '', schema: [
                    { name: 'columns', selector: { number: { min: 1, max: 6, mode: 'box' } } },
                    { name: 'max_items', selector: { number: { min: 1, max: 48, mode: 'box' } } },
                    { name: 'item_height', selector: { number: { min: 16, max: 400, mode: 'box', unit_of_measurement: 'px' } } },
                ] },
            ] },
            { header: 'Spacing', icon: 'mdi:arrow-expand-all', description: 'In px. Empty: what suits the look (6 between items; 18 round and under a classic bracket).', schema: [
                { type: 'grid', name: '', schema: [
                    { name: 'gap', selector: px },
                    { name: 'padding', selector: px },
                    { name: 'header_gap', selector: px },
                ] },
            ] },
        ];
    }

    /** The choices' defaults, shown picked in the form but not written to the config until changed. */
    _shown() {
        const look = this._config?.look ?? 'classic';
        return { ...this._config, look, mode: this._config?.mode ?? (look === 'picard' ? 'table' : 'numbers') };
    }

    _valueChanged(ev) {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // a default the form only showed stays out of the config
        if (this._config?.look === undefined && config.look === 'classic') delete config.look;
        if (this._config?.mode === undefined && config.mode === this._shown().mode) delete config.mode;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
    }

    render() {
        if (!this.hass) return html``;
        const labels = /** @type {Record<string, string>} */ ({
            title: 'Title', target: 'Area, device, label or entities', look: 'Look',
            frame: 'Frame', codes: 'Codes', columns: 'Per row', max_items: 'At most', item_height: 'Item height', mode: 'Readings as',
            gap: 'Gap', padding: 'Padding', header_gap: 'Header gap',
        });
        const helpers = /** @type {Record<string, string>} */ ({
            title: 'Leave empty to use the area\'s name.',
            target: 'The section shows the matching entities of everything you pick, and updates when they change.',
            look: 'Classic: TNG-era pills and bars. Picard: column gauges, filled buttons and a readings table.',
            frame: 'Classic: a bracket in pieces, the title in its top bar. Picard: a sweep along the top, left and bottom.',
            codes: 'Classic frame: random code numbers on the blocks of the bracket\'s side, which breaks into blocks as the section grows.',
            columns: 'Side by side.',
            max_items: 'Items in all.',
            item_height: 'Each row, or a table line.',
            mode: 'Number column: big values beside their names. Table: names and values in rows.',
            gap: 'Between items.',
            padding: 'Round the items.',
            header_gap: 'Under the title.',
        });
        // each group's form gets the whole config, so each value-changed carries all of it
        return html`${this._groups().map((g) => html`
            <lcards-form-section header=${g.header} icon=${g.icon} description=${g.description} outlined expanded>
                <ha-form
                    .hass=${this.hass}
                    .data=${this._shown()}
                    .schema=${g.schema}
                    .computeLabel=${(/** @type {any} */ s) => labels[s.name] ?? s.name}
                    .computeHelper=${(/** @type {any} */ s) => helpers[s.name]}
                    @value-changed=${this._valueChanged}
                ></ha-form>
            </lcards-form-section>
        `)}`;
    }
}

/**
 * The new section's start config, and the preview in the chooser: the area with the
 * most matching entities, as Home Assistant's Entities section does for lights.
 * @param {string} key
 * @param {any} hass
 */
export function sectionStubConfig(key, hass) {
    const area = busiestArea(hass, LCARS_SECTIONS[key].match(hass)) ?? Object.keys(hass?.areas ?? {})[0];
    return { type: `custom:${key}`, ...(area ? { target: { area_id: area } } : {}) };
}

/** Define the settings form element (getConfigElement() calls it first). */
export function defineSectionEditor() {
    if (!customElements.get('lcards-section-strategy-editor')) {
        customElements.define('lcards-section-strategy-editor', LCARdSSectionStrategyEditor);
    }
}
