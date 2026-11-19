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
 * @param {boolean} [opts.pruneEnded] - remove a subscription from `subs` when it ends
 *   (long-lived pages: the docs and the browser harness). Tests that look subscriptions
 *   up by index leave it off; an ended one keeps its message and `active: false`.
 */
export function createFakeConnection({ replies, onSubscribe, pruneEnded = false } = {}) {
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
                // through `sub`, not `cb`: an ended subscription must not keep its card alive
                queueMicrotask(() => onSubscribe(message, (payload) => { if (sub.active) sub.cb(payload); }));
            }
            return async () => {
                sub.active = false;
                // drop the callback: it closes over the subscriber (a card and its whole tree),
                // which a page cycling through views would otherwise keep in memory
                sub.cb = () => {};
                if (pruneEnded) {
                    const i = subs.indexOf(sub);
                    if (i >= 0) subs.splice(i, 1);
                }
            };
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
 * @param {boolean} [opts.pruneEnded] - see createFakeConnection
 */
export function createFakeHass({ states = {}, replies, onSubscribe, darkMode = true, user, pruneEnded = false } = {}) {
    // subscribe_entities (the state-change hub) is answered as Home Assistant does:
    // the current states of the requested entities first (`a`), then changes
    // (pushStateChange below). `hass` is defined further down; read it lazily.
    /** @type {any} */
    let hassRef = null;
    const answer = (msg, push) => {
        if (msg?.type === 'subscribe_entities' && hassRef) {
            const states = hassRef.__currentStates?.() ?? hassRef.states;
            const ids = msg.entity_ids ?? Object.keys(states);
            push({ a: Object.fromEntries(ids.filter((id) => states[id]).map((id) => [id, compressState(states[id])])) });
        }
        if (onSubscribe) onSubscribe(msg, push);
    };
    const connection = createFakeConnection({ replies, onSubscribe: answer, pruneEnded });
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

    /**
     * Change an entity and send it to the open subscribe_entities subscriptions
     * that cover it (the state-change hub), as Home Assistant sends a change.
     * @param {string} entityId
     * @param {string|object} value - state string or { state, attributes }
     */
    hass.pushStateChange = (entityId, value) => {
        const known = !!hass.states[entityId];
        const next = hass.setState(entityId, value);
        for (const sub of connection.subs) {
            const m = sub.message;
            if (!sub.active || m?.type !== 'subscribe_entities') continue;
            if (m.entity_ids && !m.entity_ids.includes(entityId)) continue;
            sub.cb(known
                ? { c: { [entityId]: { '+': { s: next.state, a: next.attributes, lu: Date.now() / 1000 } } } }
                : { a: { [entityId]: compressState(next) } });
        }
        return next;
    };

    hassRef = hass;
    return hass;
}


/**
 * A state as subscribe_entities sends it (`s`, `a`, `c`, `lc`, `lu`).
 * @param {any} state
 */
export function compressState(state) {
    const lc = Date.parse(state.last_changed ?? '') / 1000 || Date.now() / 1000;
    const lu = Date.parse(state.last_updated ?? '') / 1000 || lc;
    return { s: state.state, a: state.attributes ?? {}, c: state.context?.id ?? 'ctx', lc, ...(lu !== lc ? { lu } : {}) };
}
