/**
 * @fileoverview LCARS section strategies: LCARdS building blocks for Home
 * Assistant's sections views (reports/strategies-plan.md S5).
 *
 * Home Assistant lists them under "Community sections" in Create section →
 * Automatic section, with a live preview from getStubConfig(). Like its own
 * Entities section, each takes a `title` and a `target` (areas, devices, floors,
 * labels or entities), finds the matching entities in the registries when it is
 * generated, and is generated again when the registries change.
 *
 * Sizes follow the sections grid: 12 columns, 56 px rows (`grid_options`).
 */

import { LitElement, html } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { LCARS_SECTION_CATALOG } from './strategy-catalog.js';

const ACCENT = 'theme:colors.ui.tertiary';
const STRUCTURE = 'theme:colors.ui.secondary';

/** Sensor device classes the readings table lists first, in this order. */
const READING_CLASSES = ['temperature', 'humidity', 'illuminance', 'carbon_dioxide', 'pressure', 'power', 'energy', 'battery'];
const TOGGLE_DOMAINS = ['light', 'switch', 'fan', 'input_boolean'];

/**
 * @typedef {{ entity_id?: string|string[], device_id?: string|string[], area_id?: string|string[],
 *   floor_id?: string|string[], label_id?: string|string[] }} Target
 * @typedef {{ type: string, title?: string, target?: Target }} SectionConfig
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
        type: 'custom:lcards-button', preset: 'bar-label-left',
        text: { label: { content: title, font_size: 28 } },
        grid_options: { columns: 'full', rows: 1 },
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
 * @type {Record<string, { name: string, description: string, fallbackTitle: string, domains: string[],
 *   match: (hass: any) => (id: string) => boolean, max: number, build: (hass: any, ids: string[]) => any[] }>}
 */
export const LCARS_SECTIONS = {
    'lcars-readings': {
        ...LCARS_SECTION_CATALOG['lcars-readings'],
        fallbackTitle: 'READINGS', domains: ['sensor'], max: 12,
        match: isReading,
        build: (hass, ids) => {
            const order = (/** @type {string} */ id) => {
                const i = READING_CLASSES.indexOf(hass.states[id]?.attributes?.device_class);
                return i < 0 ? READING_CLASSES.length : i;
            };
            const sorted = [...ids].sort((a, b) => order(a) - order(b) || byName(hass)(a, b));
            const labels = sectionLabels(hass, sorted);
            return [{
                type: 'custom:lcards-data-grid', data_mode: 'data',
                rows: sorted.map((id, i) => ({ values: [String(i + 1).padStart(2, '0'), labels.get(id), id], style: { color: i === 0 ? ACCENT : STRUCTURE } })),
                columns: [{ style: { align: 'left' } }, { style: { align: 'left' } }, { style: { align: 'right' } }],
                grid: { 'grid-template-columns': '24px minmax(0, 1fr) minmax(0, auto)', 'grid-template-rows': `repeat(${sorted.length}, 24px)`, gap: '0px 8px' },
                style: { font_size: 16, text_transform: 'uppercase' },
                grid_options: { columns: 'full', rows: Math.max(1, Math.ceil((sorted.length * 24 + 8) / 64)) },
            }];
        },
    },
    'lcars-gauges': {
        ...LCARS_SECTION_CATALOG['lcars-gauges'],
        fallbackTitle: 'LEVELS', domains: ['sensor', 'input_number', 'number'], max: 8,
        match: isGauge,
        build: (hass, ids) => { const labels = sectionLabels(hass, ids); return [...ids].sort(byName(hass)).map(id => ({
            type: 'custom:lcards-slider', preset: 'picard-gauge-column', entity: id,
            style: { gauge: { scale: { labels: { enabled: false } } } },
            text: { name: { content: capLabel(labels.get(id) ?? ''), fit: true } },
            hold_action: { action: 'more-info' },
            grid_options: { columns: 3, rows: 5 },
        })); },
    },
    'lcars-controls': {
        ...LCARS_SECTION_CATALOG['lcars-controls'],
        fallbackTitle: 'CONTROLS', domains: TOGGLE_DOMAINS, max: 16,
        match: () => isToggle,
        build: (hass, ids) => { const labels = sectionLabels(hass, ids); return [...ids].sort(byName(hass)).map(id => ({
            type: 'custom:lcards-button', preset: 'lozenge', entity: id,
            text: { label: { content: labels.get(id), show: true, fit: true } },
            tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' },
            grid_options: { columns: 6, rows: 1 },
        })); },
    },
    'lcars-blocks': {
        ...LCARS_SECTION_CATALOG['lcars-blocks'],
        fallbackTitle: 'SYSTEMS', domains: TOGGLE_DOMAINS, max: 24,
        match: () => isToggle,
        build: (hass, ids) => {
            const sorted = [...ids].sort(byName(hass));
            const labels = sectionLabels(hass, sorted);
            const rows = Math.ceil(sorted.length / 2);
            return [{
                type: 'custom:lcards-layout-card',
                layout: {
                    padding: 0, card_margin: 0, margin: 0, 'grid-gap': '6px',
                    'grid-template-columns': '14px repeat(2, minmax(0, 1fr))',
                    'grid-template-rows': `repeat(${rows}, minmax(0, 1fr))`,
                },
                cards: [
                    { type: 'custom:lcards-button', preset: 'panel-light', min_height: 0, text: { label: { show: false } },
                        style: { card: { color: { background: { default: STRUCTURE } } } }, view_layout: { 'grid-column': '1', 'grid-row': '1 / -1' } },
                    ...sorted.map(id => ({
                        type: 'custom:lcards-button', preset: 'panel-dark', entity: id, min_height: 0,
                        text: { label: { content: labels.get(id), position: 'center-right', font_size: 14, fit: true } },
                        tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' },
                    })),
                ],
                grid_options: { columns: 'full', rows: Math.max(1, Math.ceil((rows * 34) / 64)) },
            }];
        },
    },
};

/**
 * Generate one section.
 * @param {string} key - LCARS_SECTIONS key
 * @param {SectionConfig} config
 * @param {any} hass
 */
export function generateLcarsSection(key, config, hass) {
    const def = LCARS_SECTIONS[key];
    const match = def.match(hass);
    const ids = resolveTarget(hass, config?.target).filter(match);
    const cards = [header(sectionTitle(hass, config ?? {}, def.fallbackTitle))];
    if (!config?.target) cards.push(note('PICK AN AREA OR OTHER TARGET IN THE SECTION SETTINGS.'));
    else if (!ids.length) cards.push(note('NOTHING TO SHOW FOR THIS TARGET.'));
    else cards.push(...def.build(hass, ids.slice(0, def.max)));
    lcardsLog.debug(`[LCARSSection] ${key}: ${ids.length} entities`);
    return { type: 'grid', cards };
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

    _schema() {
        const key = String(this._config?.type ?? '').replace(/^custom:/, '');
        const domains = LCARS_SECTIONS[key]?.domains;
        return [
            { name: 'title', selector: { text: {} } },
            { name: 'target', selector: { target: domains ? { entity: { domain: domains } } : {} } },
        ];
    }

    _valueChanged(ev) {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: ev.detail.value }, bubbles: true, composed: true }));
    }

    render() {
        if (!this.hass) return html``;
        const labels = /** @type {Record<string, string>} */ ({ title: 'Title', target: 'Area, device, label or entities' });
        const helpers = /** @type {Record<string, string>} */ ({
            title: 'Leave empty to use the area\'s name.',
            target: 'The section shows the matching entities of everything you pick, and updates when they change.',
        });
        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${this._schema()}
                .computeLabel=${(/** @type {any} */ s) => labels[s.name] ?? s.name}
                .computeHelper=${(/** @type {any} */ s) => helpers[s.name]}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
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
