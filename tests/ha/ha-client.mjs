/**
 * Minimal Home Assistant WebSocket client for the real-HA smoke tests (Layer C).
 *
 * Token: $HA_TOKEN, or the first line of .ha-token in the repo root (gitignored).
 * URL:   $HA_URL (default http://localhost:8123).
 *
 * Fixtures created here are all prefixed lcards_test / lcards-test and are created
 * only when missing, so running the suite repeatedly never touches anything else.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const HA_URL = (process.env.HA_URL ?? 'http://localhost:8123').replace(/\/$/, '');
export const TEST_DASHBOARD = 'lcards-test';

/** @returns {string|null} */
export function readToken() {
    if (process.env.HA_TOKEN) return process.env.HA_TOKEN.trim();
    const file = resolve(root, '.ha-token');
    if (existsSync(file)) return readFileSync(file, 'utf8').split('\n')[0].trim() || null;
    return null;
}

export class HAClient {
    /** @param {string} token */
    static async connect(token) {
        const client = new HAClient();
        await client._open(token);
        return client;
    }

    constructor() {
        this._id = 0;
        this._pending = new Map();
        this._subs = new Map();
    }

    async _open(token) {
        this._token = token;
        const ws = new WebSocket(`${HA_URL.replace(/^http/, 'ws')}/api/websocket`);
        this._ws = ws;
        await new Promise((resolveAuth, rejectAuth) => {
            ws.addEventListener('error', () => rejectAuth(new Error(`cannot reach ${HA_URL}`)), { once: true });
            ws.addEventListener('message', (ev) => {
                const msg = JSON.parse(ev.data);
                if (msg.type === 'auth_required') ws.send(JSON.stringify({ type: 'auth', access_token: token }));
                else if (msg.type === 'auth_ok') resolveAuth();
                else if (msg.type === 'auth_invalid') rejectAuth(new Error(`HA rejected the token: ${msg.message}`));
                else this._dispatch(msg);
            });
        });
    }

    _dispatch(msg) {
        if (msg.type === 'event') {
            this._subs.get(msg.id)?.(msg.event);
            return;
        }
        const pending = this._pending.get(msg.id);
        if (!pending) return;
        this._pending.delete(msg.id);
        if (msg.success === false) pending.reject(new Error(`${msg.error?.code}: ${msg.error?.message}`));
        else pending.resolve(msg.result);
    }

    /** Send a command and resolve with its result. */
    call(message) {
        const id = ++this._id;
        return new Promise((res, rej) => {
            this._pending.set(id, { resolve: res, reject: rej });
            this._ws.send(JSON.stringify({ id, ...message }));
        });
    }

    /** Subscribe; resolves with an unsubscribe function. */
    async subscribe(message, onEvent) {
        const id = this._id + 1;
        this._subs.set(id, onEvent);
        await this.call(message);
        return () => this.call({ type: 'unsubscribe_events', subscription: id }).finally(() => this._subs.delete(id));
    }

    callService(domain, service, serviceData = {}) {
        return this.call({ type: 'call_service', domain, service, service_data: serviceData });
    }

    async getState(entityId) {
        const states = await this.call({ type: 'get_states' });
        return states.find(s => s.entity_id === entityId) ?? null;
    }

    /**
     * Write an entity's state in HA's state machine (REST POST /api/states), keeping its
     * attributes unless given. Nothing reaches the device or integration behind the
     * entity: its next real update replaces the value. The recorder does store it.
     */
    async setState(entityId, state, attributes) {
        const current = attributes ? null : await this.getState(entityId);
        const res = await fetch(`${HA_URL}/api/states/${entityId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this._token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: String(state), attributes: attributes ?? current?.attributes ?? {} }),
        });
        if (!res.ok) throw new Error(`setState ${entityId}: HTTP ${res.status}`);
        return res.json();
    }

    close() {
        this._ws?.close();
    }
}

// ── Fixtures ─────────────────────────────────────────────────────────────

/** Helpers the test dashboard uses (entity id -> create command). */
export const TEST_HELPERS = {
    'input_boolean.lcards_test_toggle': { type: 'input_boolean/create', name: 'LCARdS Test Toggle' },
    'input_boolean.lcards_test_visible': { type: 'input_boolean/create', name: 'LCARdS Test Visible' },
    'input_number.lcards_test_value': {
        type: 'input_number/create', name: 'LCARdS Test Value', min: 0, max: 100, step: 1, mode: 'slider',
    },
    'input_select.lcards_test_mode': {
        type: 'input_select/create', name: 'LCARdS Test Mode', options: ['alpha', 'beta', 'gamma'],
    },
};

/**
 * Extra lcards_test_* helpers the dashboard gallery (doc/gallery/) uses, so its
 * examples have something to show without touching the dev HA's real entities.
 */
export const GALLERY_HELPERS = {
    'input_number.lcards_test_power': { type: 'input_number/create', name: 'LCARdS Test Power', min: 0, max: 100, step: 1, mode: 'slider', unit_of_measurement: '%' },
    'input_number.lcards_test_shields': { type: 'input_number/create', name: 'LCARdS Test Shields', min: 0, max: 100, step: 1, mode: 'slider', unit_of_measurement: '%' },
    'input_number.lcards_test_temperature': { type: 'input_number/create', name: 'LCARdS Test Temperature', min: 10, max: 35, step: 0.5, mode: 'slider', unit_of_measurement: '°C' },
    'input_number.lcards_test_humidity': { type: 'input_number/create', name: 'LCARdS Test Humidity', min: 0, max: 100, step: 1, mode: 'slider', unit_of_measurement: '%' },
    'input_boolean.lcards_test_lights': { type: 'input_boolean/create', name: 'LCARdS Test Lights' },
    'input_boolean.lcards_test_doors': { type: 'input_boolean/create', name: 'LCARdS Test Doors' },
    // Staged reveals: cards with a visibility condition on it appear as it counts up.
    'input_number.lcards_test_stage': { type: 'input_number/create', name: 'LCARdS Test Stage', min: 0, max: 20, step: 1, mode: 'box' },
};

/** Sample states the gallery shots are taken with: [domain, service, data]. */
export const GALLERY_STATES = [
    ['input_number', 'set_value', { entity_id: 'input_number.lcards_test_power', value: 82 }],
    ['input_number', 'set_value', { entity_id: 'input_number.lcards_test_shields', value: 64 }],
    ['input_number', 'set_value', { entity_id: 'input_number.lcards_test_temperature', value: 21.5 }],
    ['input_number', 'set_value', { entity_id: 'input_number.lcards_test_humidity', value: 46 }],
    ['input_number', 'set_value', { entity_id: 'input_number.lcards_test_value', value: 40 }],
    ['input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_lights' }],
    ['input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_doors' }],
    ['input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' }],
    ['input_select', 'select_option', { entity_id: 'input_select.lcards_test_mode', option: 'beta' }],
    ['input_number', 'set_value', { entity_id: 'input_number.lcards_test_stage', value: 20 }],
];

/** Create any missing lcards_test_* helpers. Returns the ids it created. */
export async function ensureHelpers(client, helpers = TEST_HELPERS) {
    const existing = new Set((await client.call({ type: 'get_states' })).map(s => s.entity_id));
    const created = [];
    for (const [entityId, command] of Object.entries(helpers)) {
        if (existing.has(entityId)) continue;
        await client.call(command);
        created.push(entityId);
    }
    return created;
}

/** Create the lcards-test dashboard if missing and (re)write its config from dashboard.yaml. */
export async function ensureDashboard(client) {
    const dashboards = await client.call({ type: 'lovelace/dashboards/list' });
    if (!dashboards.some(d => d.url_path === TEST_DASHBOARD)) {
        await client.call({
            type: 'lovelace/dashboards/create',
            url_path: TEST_DASHBOARD,
            title: 'LCARdS Test',
            mode: 'storage',
            require_admin: false,
            show_in_sidebar: false,
        });
    }
    const config = yaml.load(readFileSync(resolve(root, 'tests/ha/dashboard.yaml'), 'utf8'));
    await client.call({ type: 'lovelace/config/save', url_path: TEST_DASHBOARD, config });
    return config;
}

/**
 * Change an lcards_test input_number's `max` attribute (drives the entity_attr rule test).
 * Uses the helper collection API, so the attribute change is a real state change.
 */
export async function setInputNumberMax(client, objectId, max) {
    const items = await client.call({ type: 'input_number/list' });
    const item = items.find(i => i.id === objectId || i.name?.toLowerCase().replace(/\s+/g, '_') === objectId);
    if (!item) throw new Error(`input_number ${objectId} not found`);
    await client.call({
        type: 'input_number/update', input_number_id: item.id,
        name: item.name, min: item.min, max, step: item.step, mode: item.mode,
    });
}
