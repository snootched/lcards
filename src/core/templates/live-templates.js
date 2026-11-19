/**
 * Long-lived Jinja2 template subscriptions, shared per Home Assistant connection.
 *
 * History: `HATemplateEvaluator` rendered a `{{ }}` template with a one-off
 * `render_template` subscription (subscribe, first result, unsubscribe) every
 * time an entity it uses changed: three messages per template per change, and a
 * template set up and torn down on the server each time. The Bridge dashboard sent
 * about 6,800 messages a minute while a few helpers changed (Fire HD 8 kiosk
 * feedback, 2026-11-18, item 6).
 *
 * Now a card keeps one subscription open per template (and variables): Home
 * Assistant renders again when the template's entities change (or `now()` moves)
 * and sends only a changed result, as its own cards do. Evaluating a template
 * that is already open returns its latest result at once. A changed result calls
 * the owners' `onChange` (cards schedule a template pass), so a card that read the
 * previous result just before the new one arrived catches up.
 *
 * Owners: one per card (`createTemplateOwner`). An owner holds the templates it
 * evaluated (at most `OWNER_LIMIT`, least recently used dropped first) until
 * `release()` (new config, disconnect) or until a template pass (`beginPass()` /
 * `endPass()`) no longer uses one. Only the variables a template names are sent
 * (HATemplateEvaluator), so a config change keys again only templates that read it. A template nobody holds closes after
 * `CLOSE_DELAY_MS`, so a card that re-reads its config or moves keeps it open.
 * home-assistant-js-websocket re-subscribes after a reconnect; the re-sent result
 * counts as a change when it differs.
 */
import { lcardsLog } from '../../utils/lcards-logging.js';

/** A template nobody holds closes after this long. */
export const CLOSE_DELAY_MS = 10000;
/** The most templates one owner holds open. */
export const OWNER_LIMIT = 64;
/** How long the first result may take. */
export const FIRST_RESULT_TIMEOUT_MS = 5000;

/**
 * @typedef {{
 *   onChange: () => void, entries: Map<string, Entry>, release: () => void,
 *   beginPass: () => number, endPass: (pass: number) => void, seen: Set<string>, pass: number
 * }} TemplateOwner
 * @typedef {{
 *   key: string, connection: any, owners: Set<TemplateOwner>, result: string | undefined,
 *   ready: Promise<string>, close: (() => void) | null, closed: boolean,
 *   closeTimer: ReturnType<typeof setTimeout> | null
 * }} Entry
 */

/** @type {WeakMap<object, Map<string, Entry>>} */
const byConnection = new WeakMap();

/**
 * @param {() => void} onChange - called when a held template's result changes
 * @returns {TemplateOwner}
 */
export function createTemplateOwner(onChange) {
    /** @type {TemplateOwner} */
    const owner = {
        onChange,
        entries: new Map(),
        release() {
            for (const entry of owner.entries.values()) letGo(entry, owner);
            owner.entries.clear();
        },
        seen: new Set(),
        pass: 0,
        // A template pass: what it evaluates is kept, what it no longer uses is
        // let go when it ends (a template whose config variable changed, a field
        // removed). An overlapped pass (a newer one began) lets nothing go.
        beginPass() {
            owner.seen.clear();
            return ++owner.pass;
        },
        endPass(pass) {
            if (pass !== owner.pass) return;
            for (const [key, entry] of [...owner.entries]) {
                if (owner.seen.has(key)) continue;
                owner.entries.delete(key);
                letGo(entry, owner);
            }
        },
    };
    return owner;
}

/**
 * The template's current result, from its open subscription (opened on first use).
 * Rejects when Home Assistant refuses the template or the first result times out.
 * @param {any} connection - `hass.connection`
 * @param {string} template
 * @param {Record<string, any>} variables
 * @param {TemplateOwner} owner
 * @returns {Promise<string>}
 */
export function renderLive(connection, template, variables, owner) {
    let map = byConnection.get(connection);
    if (!map) {
        map = new Map();
        byConnection.set(connection, map);
    }
    const key = `${template}\u0000${JSON.stringify(variables ?? {})}`;
    let entry = map.get(key);
    if (!entry) {
        entry = open(map, connection, key, template, variables);
    }
    hold(entry, owner);
    return entry.result !== undefined ? Promise.resolve(entry.result) : entry.ready;
}

/**
 * @param {Map<string, Entry>} map
 * @param {any} connection
 * @param {string} key
 * @param {string} template
 * @param {Record<string, any>} variables
 * @returns {Entry}
 */
function open(map, connection, key, template, variables) {
    /** @type {(value: string) => void} */
    let resolveReady = () => {};
    /** @type {(error: any) => void} */
    let rejectReady = () => {};
    /** @type {Entry} */
    const entry = {
        key, connection, owners: new Set(), result: undefined,
        ready: new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; }),
        close: null, closed: false, closeTimer: null,
    };
    entry.ready.catch(() => {}); // a caller may not be waiting any more
    map.set(key, entry);

    const fail = (/** @type {any} */ error) => {
        if (entry.closed) return;
        clearTimeout(timeout);
        shut(entry);
        rejectReady(error);
    };
    const timeout = setTimeout(() => fail(new Error('Template rendering timed out after 5 seconds')), FIRST_RESULT_TIMEOUT_MS);

    connection.subscribeMessage((/** @type {any} */ message) => {
        if (entry.closed) return;
        const rendered = message?.result !== undefined ? String(message.result) : String(message ?? '');
        if (entry.result === undefined) {
            clearTimeout(timeout);
            entry.result = rendered;
            resolveReady(rendered);
            return;
        }
        if (rendered === entry.result) return;
        entry.result = rendered;
        lcardsLog.trace('[LiveTemplates] Result changed', { template: template.slice(0, 60) });
        for (const owner of [...entry.owners]) {
            try {
                owner.onChange();
            } catch (error) {
                lcardsLog.error('[LiveTemplates] Owner update failed:', error);
            }
        }
    }, { type: 'render_template', template, variables }).then((/** @type {() => void} */ unsubscribe) => {
        entry.close = unsubscribe;
        if (entry.closed) Promise.resolve().then(unsubscribe).catch(() => {});
    }, fail);

    return entry;
}

/**
 * @param {Entry} entry
 * @param {TemplateOwner} owner
 */
function hold(entry, owner) {
    if (entry.closeTimer) {
        clearTimeout(entry.closeTimer);
        entry.closeTimer = null;
    }
    entry.owners.add(owner);
    owner.seen.add(entry.key);
    owner.entries.delete(entry.key); // most recently used last
    owner.entries.set(entry.key, entry);
    while (owner.entries.size > OWNER_LIMIT) {
        const [oldestKey, oldest] = owner.entries.entries().next().value ?? [];
        if (oldestKey === undefined || !oldest) break;
        owner.entries.delete(oldestKey);
        letGo(oldest, owner);
    }
}

/**
 * @param {Entry} entry
 * @param {TemplateOwner} owner
 */
function letGo(entry, owner) {
    entry.owners.delete(owner);
    if (entry.owners.size > 0 || entry.closed || entry.closeTimer) return;
    entry.closeTimer = setTimeout(() => {
        entry.closeTimer = null;
        if (entry.owners.size === 0) shut(entry);
    }, CLOSE_DELAY_MS);
}

/** @param {Entry} entry */
function shut(entry) {
    if (entry.closed) return;
    entry.closed = true;
    if (entry.closeTimer) clearTimeout(entry.closeTimer);
    entry.closeTimer = null;
    const map = byConnection.get(entry.connection);
    if (map?.get(entry.key) === entry) map.delete(entry.key);
    for (const owner of entry.owners) owner.entries.delete(entry.key);
    entry.owners.clear();
    const close = entry.close;
    entry.close = null;
    if (close) Promise.resolve().then(close).catch(() => {});
    // not subscribed yet: closed once the subscription resolves (entry.closed)
}

/**
 * Open template subscriptions on a connection, for tests and diagnostics.
 * @param {object} connection
 * @returns {number}
 */
export function liveTemplateCount(connection) {
    return byConnection.get(connection)?.size ?? 0;
}
