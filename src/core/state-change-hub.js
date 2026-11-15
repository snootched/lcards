/**
 * One shared `state_changed` subscription per Home Assistant connection.
 *
 * Every `subscribe_events` subscription to `state_changed` receives every state
 * change in Home Assistant, with full old and new states. One per helper, per
 * data source and for the rules engine multiplied that traffic per tab, enough
 * for a burst of changes (a scene) to overflow Home Assistant's 4096
 * pending-message queue and drop every LCARdS client (#405, #408).
 *
 * Listeners register for one entity id (dispatched through a map) or for every
 * entity (`'*'`, the rules engine, which filters with its own live index). The
 * subscription opens with the first listener and closes with the last;
 * home-assistant-js-websocket re-subscribes it after a reconnect.
 */
import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * @typedef {(data: {entity_id: string, old_state: any, new_state: any}) => void} StateChangeListener
 * @typedef {{ listeners: Map<string, Set<StateChangeListener>>, unsubscribe: Promise<() => void> | null, close: (() => void) | null }} Hub
 */

/** @type {WeakMap<object, Hub>} */
const hubs = new WeakMap();

/**
 * Listen to state changes of one entity (or `'*'` for all) on a connection.
 * @param {{ subscribeEvents: Function }} connection - `hass.connection`
 * @param {string} entityId - an entity id, or `'*'` for every state change
 * @param {StateChangeListener} listener - receives the event's `data`
 * @returns {() => void} removes the listener (closes the subscription after the last)
 */
export function onStateChanged(connection, entityId, listener) {
    let hub = hubs.get(connection);
    if (!hub) {
        hub = { listeners: new Map(), unsubscribe: null, close: null };
        hubs.set(connection, hub);
    }
    const h = hub;
    if (!h.listeners.has(entityId)) h.listeners.set(entityId, new Set());
    h.listeners.get(entityId)?.add(listener);

    if (!h.unsubscribe) {
        const subscription = connection.subscribeEvents((/** @type {any} */ event) => {
            const data = event?.data;
            if (!data?.entity_id) return;
            for (const key of [data.entity_id, '*']) {
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
        }, 'state_changed');
        h.unsubscribe = subscription;
        // Kept once known, so the last listener closes the subscription at once.
        subscription.then((/** @type {() => void} */ close) => {
            if (h.unsubscribe === subscription) h.close = close;
        }, () => {});
        subscription.catch((/** @type {any} */ error) => {
            lcardsLog.error('[StateChangeHub] Failed to subscribe to state changes:', error);
            if (h.unsubscribe === subscription) h.unsubscribe = null;
        });
    }

    let removed = false;
    return () => {
        if (removed) return;
        removed = true;
        const set = h.listeners.get(entityId);
        set?.delete(listener);
        if (set && set.size === 0) h.listeners.delete(entityId);
        if (h.listeners.size === 0 && h.unsubscribe) {
            const pending = h.unsubscribe;
            const close = h.close;
            h.unsubscribe = null;
            h.close = null;
            if (close) close();
            else pending.then((unsub) => unsub()).catch(() => {});
        }
    };
}

/**
 * Open `state_changed` subscriptions on a connection (0 or 1), for tests and diagnostics.
 * @param {object} connection
 * @returns {number}
 */
export function stateChangeSubscriptionCount(connection) {
    return hubs.get(connection)?.unsubscribe ? 1 : 0;
}
