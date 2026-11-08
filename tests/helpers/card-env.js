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
import { ALERT_SERVICES } from './demo-states.js';

/** 'mdi:lightbulb-outline' -> 'mdiLightbulbOutline' (the @mdi/js export name) */
export const mdiExportName = (icon) => /^mdi:/.test(String(icon ?? ''))
    ? 'mdi' + String(icon).slice(4).split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
    : null;

/**
 * Stub the HA elements cards use outside HA (they render nothing useful but must exist).
 * `loadIcons` (the docs site passes `() => import('@mdi/js')`) lets ha-icon draw mdi:*
 * icons as Home Assistant would; without it (the browser test harness) icons stay empty boxes.
 * @param {{ loadIcons?: () => Promise<Record<string, string>> }} [options]
 */
export function defineHaStubs({ loadIcons } = {}) {
    let icons = null;
    class StubIcon extends HTMLElement {
        static get observedAttributes() { return ['icon']; }
        connectedCallback() {
            this.style.display = 'inline-block'; this.style.width ||= '24px'; this.style.height ||= '24px';
            this._draw();
        }
        attributeChangedCallback() { this._draw(); }
        set icon(v) { this.setAttribute('icon', v ?? ''); }
        get icon() { return this.getAttribute('icon'); }
        async _draw() {
            const name = mdiExportName(this.getAttribute('icon'));
            if (!loadIcons || !name) { this.replaceChildren(); return; }
            icons ??= loadIcons();
            const d = (await icons)[name];
            if (mdiExportName(this.getAttribute('icon')) !== name) return; // changed meanwhile
            if (!d) { this.replaceChildren(); return; }
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('style', 'width:100%;height:100%;display:block');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'currentColor');
            svg.append(path);
            this.replaceChildren(svg);
        }
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
 * @param {boolean} [opts.simulateServices] - toggle/turn_on/turn_off change the fake state; lcards.*_alert set the alert mode
 * @param {Record<string, object>} [opts.extraStates]
 * @param {Record<string, number>} [opts.historyDelay] - entity id -> ms before its history/stream answer
 * @param {((template: string, variables: any, states: Record<string, any>) => string) | null} [opts.renderTemplate] - answers render_template subscriptions (Jinja2; the docs pass tests/helpers/ha-jinja.js); without it they get no answer
 */
/** Domains whose history is their current value (nothing changes them but the reader) */
const HELPER_DOMAINS = new Set(['input_number', 'input_boolean', 'input_select', 'number']);
/** Domains Home Assistant gives no toggle, turn_on or turn_off service: a tap's default toggle does nothing there */
const NO_ONOFF_DOMAINS = new Set(['input_number', 'number', 'input_select', 'select', 'input_text', 'text', 'sensor', 'binary_sensor', 'input_datetime']);

export function createDemoEnv({ sample, now = Date.now(), simulateServices = false, extraStates = {}, historyDelay = {}, renderTemplate = null }) {
    const { SAMPLE_ENTITIES, samplePoints, sampleStatistics } = sample;
    // A helper (a slider, a toggle) holds the value it has until someone changes it:
    // its history is that value (sample sensor curves by name would put a 0 to 100
    // slider at 290 W). Other entities get the sample curves.
    const historyRows = (id, start, end) => (HELPER_DOMAINS.has(id.split('.')[0]) && current?.states[id]
        ? [{ s: String(current.states[id].state), lu: start / 1000 }]
        : samplePoints(id, start, end).map(p => ({ s: String(p.v), lu: p.t / 1000 })));

    const friendly = (entityId) => entityId.split('.')[1].replace(/^demo_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    function sampleState(entityId) {
        const domain = entityId.split('.')[0];
        if (domain === 'light') {
            return { state: 'on', attributes: { friendly_name: friendly(entityId), brightness: 200, rgb_color: [255, 153, 0], color_temp_kelvin: 3500, min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6500 } };
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
            if (msg.type === 'render_template' && renderTemplate) {
                let result;
                try {
                    result = renderTemplate(msg.template, msg.variables ?? {}, current.states);
                } catch (error) {
                    result = `(template: ${error.message})`;
                }
                push({ result, listeners: { all: false, entities: [], domains: [], time: false } });
                return;
            }
            if (msg.type === 'history/stream') {
                const end = msg.end_time ? Date.parse(msg.end_time) : now;
                const answer = () => push({ states: Object.fromEntries(msg.entity_ids.map(id => [id, historyRows(id, Date.parse(msg.start_time), end)])) });
                const delay = Math.max(0, ...msg.entity_ids.map(id => historyDelay[id] ?? 0));
                if (delay) setTimeout(answer, delay); else answer();
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
                // A live history stream (no end_time) gets the change too, as from Home Assistant: charts follow a slider
                if (sub.active && m?.type === 'history/stream' && !m.end_time && m.entity_ids?.includes(entityId)) {
                    sub.cb({ states: { [entityId]: [{ s: String(newState.state), lu: Date.now() / 1000 }] } });
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
            set_cover_tilt_position: (d) => ({ attributes: { current_tilt_position: d.tilt_position } }),
            set_temperature: (d) => ({ attributes: Object.fromEntries(['temperature', 'target_temp_low', 'target_temp_high'].filter((k) => d[k] !== undefined).map((k) => [k, d[k]])) }),
            set_humidity: (d) => ({ attributes: { humidity: d.humidity } }),
            volume_set: (d) => ({ attributes: { volume_level: d.volume_level } }),
            select_option: (d) => ({ state: String(d.option) }),
        };
        // light.turn_on attributes that a slider or colour control may send.
        const LIGHT_ATTRS = ['brightness', 'color_temp', 'color_temp_kelvin', 'rgb_color', 'hs_color'];
        // Scripts (demo/package.yaml, added with env.addScripts): action, delay and repeat steps,
        // mode restart; the script is "on" while it runs. A run stops at its next step once replaced.
        /** @type {Map<string, any>} */
        const scripts = new Map();
        /** @type {Map<string, { stopped: boolean }>} */
        const runs = new Map();
        const stopScript = (id) => {
            const run = runs.get(id);
            if (run) run.stopped = true;
            runs.delete(id);
            if (current.states[id]) env.setState(id, 'off');
        };
        const runScript = async (id) => {
            const def = scripts.get(id);
            if (!def) return;
            stopScript(id);
            const run = { stopped: false };
            runs.set(id, run);
            env.setState(id, { state: 'on', attributes: { friendly_name: def.alias ?? id } });
            const delayMs = (d) => typeof d === 'object' ? ((d.hours ?? 0) * 3600 + (d.minutes ?? 0) * 60 + (d.seconds ?? 0)) * 1000 + (d.milliseconds ?? 0) : Number(d) * 1000;
            const steps = async (list) => {
                for (const step of list ?? []) {
                    if (run.stopped) return;
                    if (step.delay !== undefined) await new Promise(r => setTimeout(r, delayMs(step.delay)));
                    else if (step.repeat) {
                        for (let i = 0; i < (step.repeat.count ?? 0) && !run.stopped; i++) await steps(step.repeat.sequence);
                    } else if (step.action) {
                        const [d, srv] = String(step.action).split('.');
                        await simulated(d, srv, step.data ?? {}, step.target);
                    }
                }
            };
            await steps(def.sequence);
            if (runs.get(id) === run) stopScript(id);
        };
        // Automations as small functions (the docs cannot run their Jinja): { entity, run(newState, call) }
        /** @type {{ entity: string, run: (state: any, call: Function) => any }[]} */
        const automations = [];
        const setStateBase = env.setState.bind(env);
        env.setState = (entityId, value) => {
            const before = current.states[entityId]?.state;
            setStateBase(entityId, value);
            const after = current.states[entityId];
            if (after && after.state !== before) {
                for (const a of automations) if (a.entity === entityId) a.run(after, simulated);
            }
        };
        /** Add demo/package.yaml's scripts (their entities appear off). */
        env.addScripts = (defs = {}) => {
            for (const [key, def] of Object.entries(defs)) {
                const id = `script.${key}`;
                scripts.set(id, def);
                if (!current.states[id]) setStateBase(id, { state: 'off', attributes: { friendly_name: def.alias ?? key } });
            }
        };
        /** Add automations as functions (tests/helpers/demo-states.js DEMO_AUTOMATIONS). */
        env.addAutomations = (list = []) => { automations.push(...list); };
        const simulated = async (domain, service, data = {}, target) => {
            await record(domain, service, data, target);
            // lcards.red_alert ... clear_alert, set_alert_mode: the alert helper's state, and
            // the alert mode itself in this tab (no LCARdS integration here to do it)
            const alert = domain === 'lcards' ? (service === 'set_alert_mode' ? data.mode : ALERT_SERVICES[service]) : null;
            if (alert) {
                if (current.states['input_select.lcards_alert_mode']) env.setState('input_select.lcards_alert_mode', alert);
                await globalThis.window?.lcards?.setAlertMode?.(alert, { skipHelperSync: true });
                return { context: { id: 'demo' } };
            }
            // lcards.borg_assimilate / borg_deassimilate: run the sequence in this tab, as
            // IntegrationService does for the integration's event (the fields the demos use)
            const bam = domain === 'lcards' && service.startsWith('borg_') ? globalThis.window?.lcards?.core?.borgAssimilationManager : null;
            if (bam) {
                const opts = {};
                if (data.sound) opts.sound = data.sound;
                if (service === 'borg_assimilate') {
                    if (data.intro_duration) opts.duration = data.intro_duration;
                    if (data.cube) opts.intro = { canvas: data.cube === 'none' ? { cube: false } : { cube: true, cubeStyle: data.cube } };
                    bam.assimilate(opts);
                } else if (service === 'borg_deassimilate') bam.deassimilate(opts);
                return { context: { id: 'demo' } };
            }
            // lcards.fly_to / set_clock: the astrometrics cards of this tab, as IntegrationService does
            const astro = domain === 'lcards' && (service === 'fly_to' || service === 'set_clock') ? globalThis.window?.lcards?.cards?.astrometrics : null;
            if (astro) {
                if (service === 'fly_to') astro.flyTo(data.card_id, data.point ? { point: data.point } : { view: data.view }, { duration: data.duration, warp: data.warp });
                else astro.setClock(data.card_id, { date: data.date, rate: data.rate });
                return { context: { id: 'demo' } };
            }
            // a script: script.<id>, or script.turn_on with its entity
            if (domain === 'script') {
                const byEntity = ['turn_on', 'turn_off', 'toggle'].includes(service);
                const which = byEntity ? [data.entity_id ?? target?.entity_id].flat().filter(Boolean) : [`script.${service}`];
                for (const id of which) {
                    if (service === 'turn_off' || (service === 'toggle' && runs.has(id))) stopScript(id);
                    else runScript(id);
                }
                return { context: { id: 'demo' } };
            }
            const ids = [data.entity_id ?? target?.entity_id].flat().filter(Boolean);
            for (const id of ids) {
                const state = current.states[id]?.state;
                if (service === 'increment' || service === 'decrement') {
                    // input_number / number / counter: one step, held inside min and max
                    const a = current.states[id]?.attributes ?? {};
                    const step = Number(a.step) || 1;
                    let v = Number(state) + (service === 'increment' ? step : -step);
                    if (Number.isFinite(Number(a.max))) v = Math.min(Number(a.max), v);
                    if (Number.isFinite(Number(a.min))) v = Math.max(Number(a.min), v);
                    if (Number.isFinite(v)) env.setState(id, String(Number(v.toFixed(6))));
                    continue;
                }
                // number, select and text helpers have no on/off services in Home Assistant
                if (['toggle', 'turn_on', 'turn_off'].includes(service) && NO_ONOFF_DOMAINS.has(id.split('.')[0])) continue;
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
