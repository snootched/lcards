/**
 * Browser test harness: mounts one LCARdS card from tests/browser/fixtures/<case>.yaml
 * against a fake hass, using the built bundle served at /lcards/lcards.js.
 *
 * URL: /harness.html?case=<fixture>[&freeze=1][&width=480][&height=300][&now=<ms>][&seed=<n>][&connectFirst=1]
 *
 * Exposes for Playwright:
 *   window.__ready      true once the card rendered and fonts loaded (or 'error')
 *   window.__errors     console.error / uncaught error messages
 *   window.__card       the mounted card element
 *   window.__hass       the fake hass (hass.serviceCalls records service calls)
 *   window.__events     hass-more-info / show-dialog / location-changed events seen
 *   window.__setState(id, state | {state, attributes})  push a new state to the card
 *   window.__reconfigure(config)  setConfig on the live card with a frozen config
 */
import yaml from '/vendor/js-yaml/dist/js-yaml.mjs';
import { createFakeHass, makeStates } from '/helpers/fake-hass.js';
import { SAMPLE_ENTITIES, samplePoints, sampleStatistics } from '/demo-data.js';

const params = new URLSearchParams(location.search);
const caseName = params.get('case');
window.__ready = false;
window.__errors = [];
window.__events = [];

const origError = console.error.bind(console);
console.error = (...args) => {
    window.__errors.push(args.map(a => (a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    origError(...args);
};
window.addEventListener('error', (e) => window.__errors.push(`uncaught: ${e.message}`));
window.addEventListener('unhandledrejection', (e) => window.__errors.push(`unhandled: ${e.reason?.message ?? e.reason}`));

if (params.get('freeze')) document.documentElement.classList.add('freeze');
const mountEl = document.getElementById('mount');
if (params.get('width')) mountEl.style.width = `${params.get('width')}px`;
// A definite height, like an HA sections grid cell (cards that size to 100% need it).
if (params.get('height')) mountEl.style.height = `${params.get('height')}px`;

// ── HA element stubs (outside HA these are never defined) ──────────────
class StubIcon extends HTMLElement {
    static get observedAttributes() { return ['icon']; }
    connectedCallback() { this.style.display = 'inline-block'; this.style.width ||= '24px'; this.style.height ||= '24px'; }
}
for (const tag of ['ha-icon', 'ha-svg-icon', 'ha-state-icon']) {
    if (!customElements.get(tag)) customElements.define(tag, class extends StubIcon {});
}
if (!customElements.get('ha-spinner')) customElements.define('ha-spinner', class extends HTMLElement {});
if (!customElements.get('ha-card')) {
    customElements.define('ha-card', class extends HTMLElement {
        connectedCallback() { this.style.display = 'block'; }
    });
}

// ── Fake hass with sample entities and history ────────────────────────
// ?now=<ms> pins the sample data (values follow a daily curve) for visual baselines.
const NOW = Number(params.get('now')) || Date.now();
function sampleState(entityId) {
    const points = samplePoints(entityId, NOW - 3_600_000, NOW);
    const last = points.at(-1)?.v;
    if (entityId.startsWith('light.')) return { state: 'on', attributes: { friendly_name: 'Demo Light', brightness: 200, rgb_color: [255, 153, 0] } };
    const unit = /temp/.test(entityId) ? '°C' : /humid|battery/.test(entityId) ? '%' : /power/.test(entityId) ? 'W' : /energy/.test(entityId) ? 'kWh' : undefined;
    return { state: String(last ?? 0), attributes: { friendly_name: entityId.split('.')[1], ...(unit ? { unit_of_measurement: unit } : {}) } };
}

const states = Object.fromEntries(SAMPLE_ENTITIES.map(id => [id, sampleState(id)]));
Object.assign(states, {
    'switch.demo_switch': { state: 'off', attributes: { friendly_name: 'Demo Switch' } },
    'input_boolean.demo_toggle': { state: 'on', attributes: { friendly_name: 'Demo Toggle' } },
    'input_number.demo_level': { state: '40', attributes: { friendly_name: 'Demo Level', min: 0, max: 100, step: 1 } },
    'sun.sun': { state: 'above_horizon', attributes: { friendly_name: 'Sun', elevation: 30 } },
});

const hass = createFakeHass({
    states,
    replies: (msg) => {
        switch (msg.type) {
            case 'lcards/info': return { version: 'test', available: true };
            case 'render_template': return { result: '' };
            case 'recorder/statistics_during_period': {
                const start = Date.parse(msg.start_time);
                const end = Date.parse(msg.end_time);
                const out = {};
                for (const id of msg.statistic_ids) {
                    const type = msg.types?.[0] ?? 'mean';
                    out[id] = sampleStatistics(id, { type, period: msg.period }, start, end)
                        .map(p => ({ start: p.t, [type]: p.v }));
                }
                return out;
            }
            case 'history/history_during_period': {
                const start = Date.parse(msg.start_time);
                const end = msg.end_time ? Date.parse(msg.end_time) : NOW;
                return Object.fromEntries(msg.entity_ids.map(id => [id, samplePoints(id, start, end).map(p => ({ s: String(p.v), lu: p.t / 1000 }))]));
            }
            default: return undefined;
        }
    },
    onSubscribe: (msg, push) => {
        if (msg.type === 'history/stream') {
            const start = Date.parse(msg.start_time);
            const end = msg.end_time ? Date.parse(msg.end_time) : NOW;
            push({ states: Object.fromEntries(msg.entity_ids.map(id => [id, samplePoints(id, start, end).map(p => ({ s: String(p.v), lu: p.t / 1000 }))])) });
        }
    },
});
window.__hass = hass;

for (const type of ['hass-more-info', 'show-dialog', 'location-changed', 'hass-action']) {
    window.addEventListener(type, (e) => window.__events.push({ type, detail: e.detail }));
    document.addEventListener(type, (e) => window.__events.push({ type, detail: e.detail }));
}

window.__setState = (entityId, value) => {
    const prevHass = window.__hass;
    const next = typeof value === 'string' ? { state: value } : value;
    const oldState = prevHass.states[entityId] ?? null;
    const merged = { ...(oldState ?? {}), ...next, attributes: { ...(oldState?.attributes ?? {}), ...(next.attributes ?? {}) } };
    delete merged.last_changed;
    delete merged.last_updated;
    const newState = makeStates({ [entityId]: merged })[entityId];
    // Like HA: an immutable new hass snapshot (old one untouched, so cards can diff
    // old vs new states) plus a state_changed event to every subscriber.
    const nextHass = { ...prevHass, states: { ...prevHass.states, [entityId]: newState } };
    window.__hass = nextHass;
    for (const sub of hass.connection.subs) {
        const m = sub.message;
        if (sub.active && m?.type === 'subscribe_events' && (!m.event_type || m.event_type === 'state_changed')) {
            sub.cb({ event_type: 'state_changed', data: { entity_id: entityId, old_state: oldState, new_state: newState }, time_fired: new Date().toISOString() });
        }
    }
    if (window.__card) window.__card.hass = nextHass;
};

// ── Mount ──────────────────────────────────────────────────────────────

/**
 * The core injects its font stylesheets after load, so document.fonts.ready can
 * resolve before the LCARS faces even exist. Wait for the Antonio face, then load it.
 */
async function fontsLoaded() {
    const deadline = performance.now() + 5000;
    while (![...document.fonts].some(f => /antonio/i.test(f.family)) && performance.now() < deadline) {
        await new Promise(r => setTimeout(r, 25));
    }
    await document.fonts.load('400 16px Antonio').catch(() => undefined);
    await document.fonts.ready;
}
async function mount() {
    await import('/lcards/lcards.js');
    await customElements.whenDefined('lcards-button');
    if (!caseName) { window.__ready = true; return; }

    const res = await fetch(`/fixtures/${caseName}.yaml`);
    if (!res.ok) throw new Error(`fixture ${caseName} not found`);
    // HA deep-freezes lovelace card configs; do the same so in-place mutation fails here too.
    const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
    const config = deepFreeze(yaml.load(await res.text()));
    const tag = String(config.type).replace(/^custom:/, '');
    await customElements.whenDefined(tag);

    // ?seed=<n>: seeded Math.random from here on, so generated values (decorative
    // grids) depend only on the card, not on how much randomness core startup used.
    if (params.get('seed')) {
        let seed = Number(params.get('seed')) >>> 0;
        Math.random = () => {
            seed = (seed + 0x6d2b79f5) >>> 0;
            let t = seed;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const card = document.createElement(tag);
    window.__card = card;
    // ?connectFirst=1: attach and give hass before setConfig, the order HA uses when
    // it reconfigures a live card (core services are then ready during setConfig).
    const connectFirst = !!params.get('connectFirst');
    if (connectFirst) {
        card.hass = hass;
        mountEl.appendChild(card);
        await card.updateComplete;
    }
    try {
        card.setConfig(config);
    } catch (error) {
        // HA would render an error card here; record it so tests can assert on it.
        window.__setConfigError = error.message;
    }
    if (!connectFirst) {
        card.hass = hass;
        mountEl.appendChild(card);
    }

    await card.updateComplete;
    await fontsLoaded();
    // Two frames so first-render work scheduled with rAF settles.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.__ready = true;
}

/** Give the live card a new config, deep-frozen like HA does (editor changes, refreshes). */
window.__reconfigure = (config) => {
    const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
    window.__card.setConfig(deepFreeze(structuredClone(config)));
};

mount().catch((error) => {
    window.__errors.push(`harness: ${error.message}`);
    window.__ready = 'error';
});
