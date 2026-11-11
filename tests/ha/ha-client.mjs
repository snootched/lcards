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

    /**
     * Create or replace a script or an automation in the UI-managed config
     * (REST POST /api/config/<kind>/config/<id>), then reload that kind.
     * @param {'script' | 'automation'} kind
     * @param {string} id - the script's object id, or the automation's id
     * @param {Record<string, any>} config
     */
    async saveConfig(kind, id, config) {
        const res = await fetch(`${HA_URL}/api/config/${kind}/config/${id}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this._token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        if (!res.ok) throw new Error(`save ${kind} ${id}: HTTP ${res.status} ${await res.text()}`);
        return res.json();
    }

    close() {
        this._ws?.close();
    }
}

// ── Temporary non-admin user ─────────────────────────────────────────────

export const NON_ADMIN_USERNAME = 'lcards_test_nonadmin';

/**
 * Create a temporary non-admin Home Assistant user, log it in for an access
 * token, run `fn(userClient, userId)`, then delete the user and the scoped
 * storage it wrote. A user left behind by an aborted run is deleted first.
 * @param {HAClient} admin
 * @param {(user: HAClient, userId: string) => Promise<void>} fn
 * @param {string} [username] - a second name gives a second user (for nesting)
 */
export async function withNonAdminUser(admin, fn, username = NON_ADMIN_USERNAME) {
    const removeUser = async (userId) => {
        await admin.call({ type: 'lcards/storage/users/clear', user_id: userId }).catch(() => {});
        await admin.call({ type: 'config/auth/delete', user_id: userId });
    };
    for (const u of await admin.call({ type: 'config/auth/list' })) {
        if (u.name === username) await removeUser(u.id);
    }
    const password = `lcards-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    const { user } = await admin.call({ type: 'config/auth/create', name: username, group_ids: ['system-users'] });
    let userClient;
    try {
        await admin.call({ type: 'config/auth_provider/homeassistant/create', user_id: user.id, username: username, password });
        const clientId = `${HA_URL}/`;
        const post = async (path, body, form = false) => {
            const res = await fetch(`${HA_URL}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' },
                body: form ? new URLSearchParams(body).toString() : JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`);
            return res.json();
        };
        const flow = await post('/auth/login_flow', { client_id: clientId, handler: ['homeassistant', null], redirect_uri: clientId });
        const done = await post(`/auth/login_flow/${flow.flow_id}`, { client_id: clientId, username: username, password });
        if (done.type !== 'create_entry') throw new Error(`login flow did not finish: ${JSON.stringify(done)}`);
        const tokens = await post('/auth/token', { grant_type: 'authorization_code', code: done.result, client_id: clientId }, true);
        userClient = await HAClient.connect(tokens.access_token);
        await fn(userClient, user.id);
    } finally {
        userClient?.close();
        await removeUser(user.id);
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
    // A date and time: the astrometrics showcase's scene date (R4d)
    'input_datetime.lcards_test_date': { type: 'input_datetime/create', name: 'LCARdS Test Date', has_date: true, has_time: true },
    // The astrometrics showcase's warp: engaged, and its factor
    'input_boolean.lcards_test_warp': { type: 'input_boolean/create', name: 'LCARdS Test Warp' },
    // warp streaks on the flights between stops
    'input_boolean.lcards_test_warp_travel': { type: 'input_boolean/create', name: 'LCARdS Test Warp Travel', initial: true },
    'input_number.lcards_test_warp_factor': { type: 'input_number/create', name: 'LCARdS Test Warp Factor', min: 1, max: 9.9, step: 0.1, mode: 'slider' },
    // The astrometrics showcase's date rate: the time slider's stops
    'input_select.lcards_test_rate': {
        type: 'input_select/create', name: 'LCARdS Test Rate', options: ['PAUSED', 'LIVE', '1 H/S', '1 D/S', '30 D/S', '1 Y/S'], initial: '1 H/S',
    },
    'input_select.lcards_test_look': { type: 'input_select/create', name: 'LCARdS Test Look', options: ['DIAGRAM', 'REALISTIC', 'MIXED'], initial: 'MIXED' },
    // The Crystalline Entity's colour (CE1); its own select, because lcards_test_mode sets the alert mode
    'input_select.lcards_test_color': { type: 'input_select/create', name: 'LCARdS Test Color', options: ['BLUE', 'LAVENDER', 'ORANGE'], initial: 'BLUE' },
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
    // Last: the dev Home Assistant's test automation turns mode beta into yellow alert;
    // the shots (and the dev Home Assistant afterwards) want normal colours
    ['lcards', 'clear_alert', {}],
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
