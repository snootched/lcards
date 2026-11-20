/**
 * Live update for a slider: the entity follows the handle while it is dragged,
 * not only when it is let go (control.live_update; on for lights by default).
 *
 * The idea comes from the Hue-like light card (github.com/Gh61/lovelace-hue-like-light-card,
 * its liveUpdate option); this is LCARdS's own implementation.
 *
 * One sender per slider:
 * - push(value) while dragging: only the latest value is kept; one call at a time
 *   (the next waits for the previous one to settle) and at least `interval` ms
 *   between starts, so a slow light or a mesh network is never sent a pile of
 *   commands; a value equal to the last one sent is skipped.
 * - finish(value) on release: the final value goes out after anything in flight
 *   (the interval is not waited for), and the returned promise settles once it
 *   has been sent.
 * - holding(): true while a drag is on and for `hold` ms after the last call
 *   settled. The slider keeps showing its own value meanwhile, so a light's
 *   late state echo (the value it had two sends ago) does not snap the handle back.
 */

export const LIVE_UPDATE_INTERVAL_MS = 200;
export const LIVE_UPDATE_HOLD_MS = 1500;

/**
 * @param {object} opts
 * @param {(value: number) => Promise<unknown>|unknown} opts.send - sets the entity
 * @param {number} [opts.interval]
 * @param {number} [opts.hold]
 * @param {() => number} [opts.now]
 */
export function createLiveSender({ send, interval = LIVE_UPDATE_INTERVAL_MS, hold = LIVE_UPDATE_HOLD_MS, now = () => Date.now() }) {
    /** @type {number|undefined} the value waiting to go out */
    let waiting;
    let urgent = false;
    let busy = false;
    let dragging = false;
    let startedAt = -Infinity;
    let settledAt = -Infinity;
    /** @type {number|undefined} */
    let lastSent;
    /** @type {ReturnType<typeof setTimeout>|null} */
    let timer = null;
    /** @type {Array<() => void>} resolvers waiting for the queue to empty */
    let drained = [];

    const settleDrained = () => {
        if (busy || waiting !== undefined) return;
        const done = drained;
        drained = [];
        for (const resolve of done) resolve();
    };

    const pump = () => {
        if (busy || waiting === undefined) return settleDrained();
        if (waiting === lastSent) {
            waiting = undefined;
            urgent = false;
            return settleDrained();
        }
        const wait = urgent ? 0 : interval - (now() - startedAt);
        if (wait > 0) {
            if (!timer) timer = setTimeout(() => { timer = null; pump(); }, wait);
            return;
        }
        if (timer) { clearTimeout(timer); timer = null; }
        const value = waiting;
        waiting = undefined;
        urgent = false;
        busy = true;
        startedAt = now();
        lastSent = value;
        Promise.resolve()
            .then(() => send(value))
            .catch(() => {})
            .finally(() => {
                busy = false;
                settledAt = now();
                pump();
            });
    };

    return {
        /** @param {number} value */
        push(value) {
            dragging = true;
            waiting = value;
            pump();
        },
        /**
         * @param {number} value
         * @returns {Promise<void>}
         */
        finish(value) {
            dragging = false;
            waiting = value;
            urgent = true;
            const done = new Promise((resolve) => drained.push(() => resolve(undefined)));
            pump();
            return done;
        },
        holding() {
            return dragging || busy || waiting !== undefined || now() - settledAt < hold;
        },
        /** Forget everything (the slider's entity or config changed, or it left the page). */
        stop() {
            if (timer) clearTimeout(timer);
            timer = null;
            waiting = undefined;
            urgent = false;
            dragging = false;
            lastSent = undefined;
            settledAt = -Infinity;
            settleDrained();
        },
    };
}
