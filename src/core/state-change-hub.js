/**
 * One shared state subscription per Home Assistant connection, filtered on the
 * server to the entities LCARdS listens to.
 *
 * History:
 * - One `state_changed` subscription per helper, per data source and for the
 *   rules engine multiplied the event traffic per tab, enough for a burst of
 *   changes to overflow Home Assistant's 4096 pending-message queue (#405, #408):
 *   since 2026-11-15 one subscription per page.
 * - That one subscription still received every state change in Home Assistant,
 *   uncompressed (full old and new states with attributes and context): about
 *   10x the frontend's own copy of each change, for a few of the house's
 *   entities. After a Home Assistant restart a Fire HD 8 kiosk was still dropped
 *   with "Reached 4096 pending messages" (HA-LCARS feedback, 2026-11-18).
 *
 * Now the hub subscribes with `subscribe_entities` and `entity_ids` (the
 * listeners' entities), as the frontend subscribes to all of them: Home Assistant
 * filters on the server and sends compressed diffs. The hub decodes them as
 * home-assistant-js-websocket does (`a`: whole states, `c`: changes with `+` and
 * `-`, `r`: removed) and keeps each entity's last state, so listeners still get
 * `{ entity_id, old_state, new_state }`.
 *
 * When the set of entities changes the hub subscribes again (once per microtask
 * batch). The new subscription's first message holds the current states; an
 * entity whose state differs from the hub's copy is delivered as a change, so a
 * change between the two subscriptions, or while the connection was down (the
 * library re-subscribes after a reconnect and Home Assistant sends `a` again), is
 * delivered once. Messages of a replaced subscription are ignored. A `'*'`
 * listener subscribes to every entity (still compressed).
 *
 * A listener can pass the state its owner already knows (`knownState`, from its
 * hass): the hub starts from it, so a change between that hass and the first
 * message of the subscription is delivered too. Without it the first sight of an
 * entity is not a change, and an alert raised just after a page load (before the
 * subscription was open) never reached the helper manager (#410 check, 2026-11-18).
 */
import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * @typedef {(data: {entity_id: string, old_state: any, new_state: any}) => void} StateChangeListener
 * @typedef {{ close: (() => void) | null, unsubscribe: Promise<() => void> | null, primed: boolean }} Subscription
 * @typedef {{ listeners: Map<string, Set<StateChangeListener>>, sub: Subscription | null, key: string | null, scheduled: boolean, states: Map<string, any> }} Hub
 */

/** @type {WeakMap<object, Hub>} */
const hubs = new WeakMap();

/**
 * Listen to state changes of one entity (or `'*'` for all) on a connection.
 * @param {{ subscribeMessage: Function }} connection - `hass.connection`
 * @param {string} entityId - an entity id, or `'*'` for every state change
 * @param {StateChangeListener} listener - receives `{ entity_id, old_state, new_state }`
 * @param {any} [knownState] - the entity's state as the caller knows it (its hass)
 * @returns {() => void} removes the listener (closes the subscription after the last)
 */
export function onStateChanged(connection, entityId, listener, knownState) {
    let hub = hubs.get(connection);
    if (!hub) {
        hub = { listeners: new Map(), sub: null, key: null, scheduled: false, states: new Map() };
        hubs.set(connection, hub);
    }
    const h = hub;
    if (!h.listeners.has(entityId)) h.listeners.set(entityId, new Set());
    h.listeners.get(entityId)?.add(listener);
    if (knownState && entityId !== '*' && !h.states.has(entityId)) h.states.set(entityId, knownState);
    schedule(h, connection);

    let removed = false;
    return () => {
        if (removed) return;
        removed = true;
        const set = h.listeners.get(entityId);
        set?.delete(listener);
        if (set && set.size === 0) h.listeners.delete(entityId);
        schedule(h, connection);
    };
}

/**
 * Subscribe again for the current listeners, once per microtask batch.
 * @param {Hub} h
 * @param {{ subscribeMessage: Function }} connection
 */
function schedule(h, connection) {
    if (h.scheduled) return;
    h.scheduled = true;
    queueMicrotask(() => {
        h.scheduled = false;
        resubscribe(h, connection);
    });
}

/**
 * @param {Hub} h
 * @param {{ subscribeMessage: Function }} connection
 */
function resubscribe(h, connection) {
    const all = h.listeners.has('*');
    const ids = [...h.listeners.keys()].filter((id) => id !== '*').sort();
    const key = h.listeners.size === 0 ? null : all ? '*' : ids.join(',');
    if (key === h.key) return;

    const old = h.sub;
    h.key = key;
    h.sub = null;
    if (old) close(old);
    if (key === null) {
        h.states.clear();
        return;
    }
    // forget entities nobody listens to any more
    if (!all) for (const id of [...h.states.keys()]) if (!h.listeners.has(id)) h.states.delete(id);

    /** @type {Subscription} */
    const sub = { close: null, unsubscribe: null, primed: false };
    h.sub = sub;
    const message = all ? { type: 'subscribe_entities' } : { type: 'subscribe_entities', entity_ids: ids };
    /** @type {Promise<() => void>} */
    const subscribing = connection.subscribeMessage((/** @type {any} */ update) => {
        if (h.sub !== sub) return; // a replaced subscription
        apply(h, update, sub.primed);
        sub.primed = true;
    }, message);
    sub.unsubscribe = subscribing;
    subscribing.then((unsubscribe) => {
        sub.close = unsubscribe;
        if (h.sub !== sub) unsubscribe();
    }, (/** @type {any} */ error) => {
        lcardsLog.error('[StateChangeHub] Failed to subscribe to state changes:', error);
        if (h.sub === sub) {
            h.sub = null;
            h.key = null; // the next listener change tries again
        }
    });
}

/** @param {Subscription} sub */
function close(sub) {
    if (sub.close) sub.close();
    // not subscribed yet: the then() above closes it once it is (h.sub moved on)
}

/**
 * Apply one `subscribe_entities` message: decode, keep, deliver changes.
 * @param {Hub} h
 * @param {any} update
 * @param {boolean} primed - the subscription's first message (its snapshot) came already
 */
function apply(h, update, primed) {
    if (update?.a) {
        for (const id of Object.keys(update.a)) {
            const next = fullState(id, update.a[id]);
            const prev = h.states.get(id);
            h.states.set(id, next);
            // In the snapshot (a subscription's first message) an entity seen for the
            // first time is not a change; a differing copy is (a change between
            // subscriptions, or while the connection was down). Later, an `a` for an
            // unknown entity is one that was just created: delivered with old_state null.
            if (prev ? (prev.state !== next.state || prev.last_updated !== next.last_updated) : primed) deliver(h, id, prev ?? null, next);
        }
    }
    if (update?.c) {
        for (const id of Object.keys(update.c)) {
            const prev = h.states.get(id);
            if (!prev) continue; // a diff for a state we never had
            const next = applyDiff(prev, update.c[id]);
            h.states.set(id, next);
            deliver(h, id, prev, next);
        }
    }
    if (Array.isArray(update?.r)) {
        for (const id of update.r) {
            const prev = h.states.get(id);
            h.states.delete(id);
            if (prev) deliver(h, id, prev, null);
        }
    }
}

/**
 * @param {Hub} h
 * @param {string} id
 * @param {any} oldState
 * @param {any} newState
 */
function deliver(h, id, oldState, newState) {
    const data = { entity_id: id, old_state: oldState, new_state: newState };
    for (const key of [id, '*']) {
        const set = h.listeners.get(key);
        if (!set) continue;
        for (const fn of [...set]) {
            try {
                fn(data);
            } catch (error) {
                lcardsLog.error('[StateChangeHub] Listener error:', error);
            }
        }
    }
}

/** @param {number} seconds */
const iso = (seconds) => new Date(seconds * 1000).toISOString();

/**
 * A whole compressed state (`s` state, `a` attributes, `c` context, `lc` last
 * changed, `lu` last updated when it differs), as home-assistant-js-websocket
 * decodes it.
 * @param {string} id
 * @param {any} s
 */
function fullState(id, s) {
    const lastChanged = iso(s.lc);
    return {
        entity_id: id,
        state: s.s,
        attributes: s.a ?? {},
        context: typeof s.c === 'string' ? { id: s.c, parent_id: null, user_id: null } : s.c,
        last_changed: lastChanged,
        last_updated: s.lu ? iso(s.lu) : lastChanged,
    };
}

/**
 * A compressed change (`+`: new values, `-`: removed attribute names) applied to
 * a copy of the previous state, as home-assistant-js-websocket applies it.
 * @param {any} prev
 * @param {{ '+'?: any, '-'?: any }} diff
 */
function applyDiff(prev, diff) {
    const next = { ...prev };
    const add = diff?.['+'];
    const remove = diff?.['-'];
    const attributesChanged = add?.a || remove?.a;
    const attributes = attributesChanged ? { ...prev.attributes } : prev.attributes;
    if (add) {
        if (add.s !== undefined) next.state = add.s;
        if (add.c) next.context = typeof add.c === 'string' ? { ...prev.context, id: add.c } : { ...prev.context, ...add.c };
        if (add.lc) next.last_updated = next.last_changed = iso(add.lc);
        else if (add.lu) next.last_updated = iso(add.lu);
        if (add.a) Object.assign(attributes, add.a);
    }
    if (remove?.a) for (const name of remove.a) delete attributes[name];
    if (attributesChanged) next.attributes = attributes;
    return next;
}

/**
 * Open state subscriptions on a connection (0 or 1), for tests and diagnostics.
 * @param {object} connection
 * @returns {number}
 */
export function stateChangeSubscriptionCount(connection) {
    return hubs.get(connection)?.sub ? 1 : 0;
}
