/**
 * Fake `hass` object for tests (node unit tests now; browser harnesses in S3/S6).
 *
 * Browser-safe on purpose: no `node:` imports, so the docs harness can import it.
 *
 *   const hass = createFakeHass({
 *       states: { 'light.desk': { state: 'on', attributes: { brightness: 200 } } },
 *       replies: (msg) => msg.type === 'lcards/info' ? { version: 'x' } : undefined,
 *   });
 *   await hass.callService('light', 'toggle', { entity_id: 'light.desk' });
 *   hass.serviceCalls;                 // [{ domain, service, data, target }]
 *   hass.connection.sent;              // every sendMessagePromise message
 *   hass.connection.push(0, payload);  // deliver a message to subscription #0
 */

/**
 * Normalise a states map: a bare string becomes `{ state }`, and entity_id,
 * attributes and timestamps are filled in.
 * @param {Record<string, string|object>} states
 */
export function makeStates(states = {}) {
    const now = new Date().toISOString();
    const out = {};
    for (const [entity_id, value] of Object.entries(states)) {
        const s = typeof value === 'string' ? { state: value } : value;
        out[entity_id] = {
            entity_id,
            attributes: {},
            last_changed: now,
            last_updated: now,
            context: { id: 'test' },
            ...s,
        };
    }
    return out;
}

/**
 * Fake HA websocket connection.
 * @param {object} [opts]
 * @param {Array|Function} [opts.replies] - sendMessagePromise replies: an array
 *   consumed in order (last one repeats; an Error rejects) or `(msg) => reply`.
 * @param {Function} [opts.onSubscribe] - `(message, push) => void`, called after each
 *   subscribeMessage so the fake can answer it (e.g. history/stream); `push(payload)`
 *   delivers to that subscription while it is active.
 */
export function createFakeConnection({ replies, onSubscribe } = {}) {
    const subs = [];
    const sent = [];
    const listeners = new Map();
    let step = 0;

    const nextReply = (msg) => {
        if (typeof replies === 'function') return replies(msg);
        if (Array.isArray(replies) && replies.length) {
            return replies[Math.min(step++, replies.length - 1)];
        }
        return undefined;
    };

    return {
        subs,
        sent,
        listeners,
        async sendMessagePromise(message) {
            sent.push(message);
            const reply = await nextReply(message);
            if (reply instanceof Error) throw reply;
            return reply;
        },
        async subscribeMessage(cb, message, options) {
            const sub = { cb, message, options, active: true };
            subs.push(sub);
            if (onSubscribe) {
                queueMicrotask(() => onSubscribe(message, (payload) => { if (sub.active) cb(payload); }));
            }
            return async () => { sub.active = false; };
        },
        async subscribeEvents(cb, eventType) {
            return this.subscribeMessage(cb, { type: 'subscribe_events', event_type: eventType });
        },
        /** Deliver `payload` to subscription `index` if still active. */
        push(index, payload) {
            const sub = subs[index];
            if (sub?.active) sub.cb(payload);
        },
        addEventListener(type, fn) { listeners.set(fn, type); },
        removeEventListener(type, fn) { listeners.delete(fn); },
        /** Fire a connection event such as 'ready' or 'disconnected'. */
        fire(type) { for (const [fn, t] of listeners) if (t === type) fn(); },
    };
}

/**
 * @param {object} [opts]
 * @param {Record<string, string|object>} [opts.states]
 * @param {Array|Function} [opts.replies] - see createFakeConnection
 * @param {Function} [opts.onSubscribe] - see createFakeConnection
 * @param {boolean} [opts.darkMode=true]
 * @param {object} [opts.user]
 */
export function createFakeHass({ states = {}, replies, onSubscribe, darkMode = true, user } = {}) {
    const connection = createFakeConnection({ replies, onSubscribe });
    const serviceCalls = [];

    const hass = {
        states: makeStates(states),
        connection,
        serviceCalls,
        language: 'en',
        locale: { language: 'en', number_format: 'language', time_format: 'language' },
        themes: { darkMode, theme: 'default', themes: {} },
        user: user ?? { id: 'test-user', name: 'Test', is_admin: true },
        config: { unit_system: { temperature: '°C', length: 'km' }, time_zone: 'UTC' },
        entities: {},
        devices: {},
        areas: {},
        async callService(domain, service, data = {}, target) {
            serviceCalls.push({ domain, service, data, target });
            return { context: { id: 'test' } };
        },
        async callWS(message) {
            return connection.sendMessagePromise(message);
        },
        // Simplified HA formatters: "<value> <unit>"; the *ToParts forms mirror
        // HA's [{ type: 'value' }, { type: 'unit' }] shape.
        formatEntityState(stateObj, state) {
            return hass.formatEntityStateToParts(stateObj, state).map(p => p.value).join(' ');
        },
        formatEntityStateToParts(stateObj, state) {
            const value = String(state ?? stateObj?.state ?? '');
            const unit = stateObj?.attributes?.unit_of_measurement;
            return unit
                ? [{ type: 'value', value }, { type: 'unit', value: unit }]
                : [{ type: 'value', value }];
        },
        formatEntityAttributeValue(stateObj, attribute) {
            return String(stateObj?.attributes?.[attribute] ?? '');
        },
        formatEntityAttributeValueToParts(stateObj, attribute) {
            return [{ type: 'value', value: String(stateObj?.attributes?.[attribute] ?? '') }];
        },
        formatEntityAttributeName(stateObj, attribute) {
            return attribute;
        },
        formatEntityName(stateObj) {
            return stateObj?.attributes?.friendly_name ?? stateObj?.entity_id ?? '';
        },
        localize: (key) => key,
    };

    /** Replace one entity's state (string or partial object); returns the new state object. */
    hass.setState = (entityId, value) => {
        hass.states = { ...hass.states, ...makeStates({ [entityId]: value }) };
        return hass.states[entityId];
    };

    return hass;
}
