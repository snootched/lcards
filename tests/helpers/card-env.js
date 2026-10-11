/**
 * Card environment for mounting real LCARdS cards outside Home Assistant.
 *
 * Shared by the browser test harness (tests/browser/www/harness.js) and the
 * docs site's live card demos (doc/.vitepress/theme/CardDemo.vue). Browser-safe:
 * no node: imports. Sample data functions are passed in (the harness and the
 * docs import chart-demo-data.js from different URLs).
 *
 *   defineHaStubs();
 *   const env = createDemoEnv({ sample: { SAMPLE_ENTITIES, samplePoints, sampleStatistics } });
 *   const card = await env.mount(container, config);
 *   env.setState('light.demo', 'off');          // HA-style update: new snapshot + state_changed
 */
import { createFakeHass, makeStates } from './fake-hass.js';

/** Stub the HA elements cards use outside HA (they render nothing useful but must exist). */
export function defineHaStubs() {
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
}

/** HA deep-freezes lovelace card configs; do the same so in-place mutation fails outside HA too. */
export function deepFreeze(o) {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) {
        Object.freeze(o);
        Object.values(o).forEach(deepFreeze);
    }
    return o;
}

/**
 * The core injects its font stylesheets after load, so document.fonts.ready can
 * resolve before the LCARS faces even exist. Wait for the Antonio face, then load it.
 */
export async function fontsLoaded() {
    const deadline = performance.now() + 5000;
    while (![...document.fonts].some(f => /antonio/i.test(f.family)) && performance.now() < deadline) {
        await new Promise(r => setTimeout(r, 25));
    }
    await document.fonts.load('400 16px Antonio').catch(() => undefined);
    await document.fonts.ready;
}

const UNITS = [[/temp/, '°C'], [/humid|battery/, '%'], [/power/, 'W'], [/energy/, 'kWh']];
const ON_OFF_DOMAINS = new Set(['switch', 'binary_sensor', 'input_boolean', 'fan', 'automation', 'siren', 'remote']);
const ENTITY_ID = /^(light|switch|sensor|binary_sensor|input_boolean|input_number|input_select|input_text|select|number|climate|fan|cover|lock|media_player|person|device_tracker|sun|weather|automation|scene|script|button|siren|remote|vacuum|water_heater|humidifier|valve)\.[a-z0-9_]+$/;

/**
 * @param {object} opts
 * @param {{ SAMPLE_ENTITIES: string[], samplePoints: Function, sampleStatistics: Function }} opts.sample
 * @param {number} [opts.now] - pin the sample data (values follow the time of day)
 * @param {boolean} [opts.simulateServices] - toggle/turn_on/turn_off change the fake state
 * @param {Record<string, object>} [opts.extraStates]
 */
export function createDemoEnv({ sample, now = Date.now(), simulateServices = false, extraStates = {} }) {
    const { SAMPLE_ENTITIES, samplePoints, sampleStatistics } = sample;
    const historyRows = (id, start, end) => samplePoints(id, start, end).map(p => ({ s: String(p.v), lu: p.t / 1000 }));

    const friendly = (entityId) => entityId.split('.')[1].replace(/^demo_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    function sampleState(entityId) {
        const domain = entityId.split('.')[0];
        if (domain === 'light') {
            return { state: 'on', attributes: { friendly_name: friendly(entityId), brightness: 200, rgb_color: [255, 153, 0] } };
        }
        if (ON_OFF_DOMAINS.has(domain)) return { state: 'on', attributes: { friendly_name: friendly(entityId) } };
        if (domain === 'input_select' || domain === 'select') {
            return { state: 'Auto', attributes: { friendly_name: friendly(entityId), options: ['Auto', 'Cool', 'Heat', 'Off'] } };
        }
        if (domain === 'input_number' || domain === 'number') {
            return { state: '40', attributes: { friendly_name: friendly(entityId), min: 0, max: 100, step: 1 } };
        }
        if (domain === 'climate') {
            return { state: 'heat', attributes: { friendly_name: friendly(entityId), temperature: 21, current_temperature: 20.5, hvac_action: 'heating', min_temp: 7, max_temp: 35 } };
        }
        const last = samplePoints(entityId, now - 3_600_000, now).at(-1)?.v;
        const unit = UNITS.find(([re]) => re.test(entityId))?.[1];
        return { state: String(last ?? 0), attributes: { friendly_name: entityId.split('.')[1], ...(unit ? { unit_of_measurement: unit } : {}) } };
    }

    const states = Object.fromEntries(SAMPLE_ENTITIES.map(id => [id, sampleState(id)]));
    Object.assign(states, {
        'switch.demo_switch': { state: 'off', attributes: { friendly_name: 'Demo Switch' } },
        'input_boolean.demo_toggle': { state: 'on', attributes: { friendly_name: 'Demo Toggle' } },
        'input_number.demo_level': { state: '40', attributes: { friendly_name: 'Demo Level', min: 0, max: 100, step: 1 } },
        'input_select.demo_mode': { state: 'Auto', attributes: { friendly_name: 'Demo Mode', options: ['Auto', 'Cool', 'Heat', 'Off'] } },
        'sun.sun': { state: 'above_horizon', attributes: { friendly_name: 'Sun', elevation: 30 } },
        ...extraStates,
    });

    const base = createFakeHass({
        states,
        replies: (msg) => {
            switch (msg.type) {
                case 'lcards/info': return { version: 'demo', available: true };
                case 'render_template': return { result: '' };
                case 'recorder/statistics_during_period': {
                    const start = Date.parse(msg.start_time);
                    const end = Date.parse(msg.end_time);
                    const type = msg.types?.[0] ?? 'mean';
                    return Object.fromEntries(msg.statistic_ids.map(id => [id,
                        sampleStatistics(id, { type, period: msg.period }, start, end).map(p => ({ start: p.t, [type]: p.v }))]));
                }
                case 'history/history_during_period': {
                    const end = msg.end_time ? Date.parse(msg.end_time) : now;
                    return Object.fromEntries(msg.entity_ids.map(id => [id, historyRows(id, Date.parse(msg.start_time), end)]));
                }
                default: return undefined;
            }
        },
        onSubscribe: (msg, push) => {
            if (msg.type === 'history/stream') {
                const end = msg.end_time ? Date.parse(msg.end_time) : now;
                push({ states: Object.fromEntries(msg.entity_ids.map(id => [id, historyRows(id, Date.parse(msg.start_time), end)])) });
            }
        },
    });

    const cards = new Set();
    let current = base;

    const env = {
        /** The latest hass snapshot (a new object after every setState). */
        get hass() { return current; },
        /** Every service call made by any mounted card. */
        serviceCalls: base.serviceCalls,
        cards,

        /**
         * Change an entity like HA does: an immutable new hass snapshot (old one untouched,
         * so cards can diff old vs new states) plus a state_changed event to subscribers.
         */
        setState(entityId, value) {
            const next = typeof value === 'string' ? { state: value } : value;
            const oldState = current.states[entityId] ?? null;
            const merged = { ...(oldState ?? {}), ...next, attributes: { ...(oldState?.attributes ?? {}), ...(next.attributes ?? {}) } };
            delete merged.last_changed;
            delete merged.last_updated;
            const newState = makeStates({ [entityId]: merged })[entityId];
            current = { ...current, states: { ...current.states, [entityId]: newState } };
            for (const sub of base.connection.subs) {
                const m = sub.message;
                if (sub.active && m?.type === 'subscribe_events' && (!m.event_type || m.event_type === 'state_changed')) {
                    sub.cb({ event_type: 'state_changed', data: { entity_id: entityId, old_state: oldState, new_state: newState }, time_fired: new Date().toISOString() });
                }
            }
            for (const card of cards) card.hass = current;
            return current;
        },

        /**
         * Create `lcards-<type>`, set the (frozen) config and hass, attach it and wait
         * until it has rendered with the LCARS fonts loaded.
         * @param {HTMLElement} container
         * @param {object} config - card config (deep-frozen here, like HA)
         * @param {{ connectFirst?: boolean }} [opts] - attach before setConfig (HA reconfiguring a live card)
         */
        async mount(container, config, { connectFirst = false } = {}) {
            const tag = String(config.type).replace(/^custom:/, '');
            await customElements.whenDefined(tag);
            const card = document.createElement(tag);
            cards.add(card);
            if (connectFirst) {
                card.hass = current;
                container.appendChild(card);
                await card.updateComplete;
            }
            let setConfigError = null;
            try {
                card.setConfig(deepFreeze(config));
            } catch (error) {
                setConfigError = error.message;
            }
            if (!connectFirst) {
                card.hass = current;
                container.appendChild(card);
            }
            await card.updateComplete;
            await fontsLoaded();
            // Two frames so first-render work scheduled with rAF settles.
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            card.__setConfigError = setConfigError;
            return card;
        },

        /**
         * Give every entity id mentioned in `config` a sample state if it has none,
         * so examples can use realistic ids (light.living_room) outside HA.
         */
        ensureEntities(config) {
            const missing = new Set();
            (function walk(v) {
                if (typeof v === 'string') { if (ENTITY_ID.test(v) && !current.states[v]) missing.add(v); }
                else if (Array.isArray(v)) v.forEach(walk);
                else if (v && typeof v === 'object') Object.values(v).forEach(walk);
            })(config);
            if (!missing.size) return;
            current = { ...current, states: { ...current.states, ...makeStates(Object.fromEntries([...missing].map(id => [id, sampleState(id)]))) } };
            for (const card of cards) card.hass = current;
        },

        /** Detach a card and stop pushing hass to it. */
        unmount(card) {
            cards.delete(card);
            card.remove();
        },
    };

    if (simulateServices) {
        // Docs demos: make taps visibly work. toggle / turn_on / turn_off flip the entity.
        const record = base.callService;
        const flip = (s) => (s === 'on' ? 'off' : 'on');
        // What each value-setting service changes, as HA would (sliders, number inputs, ...).
        const VALUE_SERVICES = {
            set_value: (d) => ({ state: String(d.value) }),
            set_cover_position: (d) => ({ state: d.position > 0 ? 'open' : 'closed', attributes: { current_position: d.position } }),
            set_valve_position: (d) => ({ state: d.position > 0 ? 'open' : 'closed', attributes: { current_position: d.position } }),
            set_percentage: (d) => ({ state: d.percentage > 0 ? 'on' : 'off', attributes: { percentage: d.percentage } }),
            set_temperature: (d) => ({ attributes: { temperature: d.temperature } }),
            set_humidity: (d) => ({ attributes: { humidity: d.humidity } }),
            volume_set: (d) => ({ attributes: { volume_level: d.volume_level } }),
            select_option: (d) => ({ state: String(d.option) }),
        };
        // light.turn_on attributes that a slider or colour control may send.
        const LIGHT_ATTRS = ['brightness', 'color_temp', 'color_temp_kelvin', 'rgb_color', 'hs_color'];
        const simulated = async (domain, service, data = {}, target) => {
            await record(domain, service, data, target);
            const ids = [data.entity_id ?? target?.entity_id].flat().filter(Boolean);
            for (const id of ids) {
                const state = current.states[id]?.state;
                if (service === 'toggle') env.setState(id, flip(state));
                else if (service === 'turn_off') env.setState(id, 'off');
                else if (service === 'turn_on') {
                    const attributes = Object.fromEntries(LIGHT_ATTRS.filter(k => data[k] !== undefined).map(k => [k, data[k]]));
                    if (data.brightness_pct !== undefined) attributes.brightness = Math.round(data.brightness_pct * 2.55);
                    env.setState(id, { state: 'on', attributes });
                } else if (VALUE_SERVICES[service]) env.setState(id, VALUE_SERVICES[service](data));
            }
            return { context: { id: 'demo' } };
        };
        base.callService = simulated;
        current = { ...base };
    }

    return env;
}
