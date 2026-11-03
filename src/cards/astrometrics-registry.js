/**
 * `window.lcards.cards.astrometrics`: the astrometrics cards on the page, by
 * their `id`, so other cards (`action: fly-to` / `set-clock` with `card`) and
 * automations (`lcards.fly_to`, `lcards.set_clock`) can fly their cameras and
 * set their scene dates. Cards add themselves on connect
 * and leave on disconnect; a card shown twice (two views, a wall panel)
 * flies everywhere it is open.
 *
 * @module cards/astrometrics-registry
 */
import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * @typedef {HTMLElement & { config?: any, flyTo: (view: string | Record<string, any>, opts?: { duration?: number }) => Promise<void>, setClock: (opts: { date?: any, rate?: any }) => boolean, setModelScale: (mode: 'real' | 'visible' | 'toggle') => boolean }} AstrometricsCardElement
 */

/** @type {Set<AstrometricsCardElement>} */
const cards = new Set();

/** @param {AstrometricsCardElement} card */
export function registerAstrometricsCard(card) {
    cards.add(card);
}

/** @param {AstrometricsCardElement} card */
export function unregisterAstrometricsCard(card) {
    cards.delete(card);
}

/**
 * What to fly to: `{ point }` wins over `view`; a bare string is a view
 * name or a point id (the card decides).
 * @param {any} target
 * @returns {string | Record<string, any> | null}
 */
function flyTarget(target) {
    if (typeof target === 'string' && target) return target;
    if (target && typeof target === 'object') {
        if (typeof target.point === 'string' && target.point) return { point: target.point };
        if (typeof target.view === 'string' && target.view) return target.view;
    }
    return null;
}

export const astrometricsRegistry = {
    /** @returns {AstrometricsCardElement[]} every connected astrometrics card */
    getAll() {
        return [...cards];
    },

    /**
     * The first connected card with this `id`.
     * @param {string} id
     */
    get(id) {
        return [...cards].find((c) => c.config?.id === id) ?? null;
    },

    /**
     * Fly every connected card with this `id`.
     * @param {string} id
     * @param {string | { view?: string, point?: string }} target - a view name or point id, or `{ view }` / `{ point }`
     * @param {{ duration?: number, warp?: boolean }} [opts] - warp: true or false overrides the view's and the card's
     * @returns {number} how many cards flew
     */
    flyTo(id, target, opts = {}) {
        const to = flyTarget(target);
        const matches = [...cards].filter((c) => c.config?.id === id);
        if (!to) {
            lcardsLog.warn(`[Astrometrics] fly-to for '${id}' needs a view or a point`);
            return 0;
        }
        if (!matches.length) {
            lcardsLog.debug(`[Astrometrics] fly-to: no astrometrics card with id '${id}' is open here`);
            return 0;
        }
        const duration = Number(opts.duration);
        /** @type {{ duration?: number, warp?: boolean }} */
        const flight = {};
        if (Number.isFinite(duration) && duration >= 0) flight.duration = duration;
        if (typeof opts.warp === 'boolean') flight.warp = opts.warp;
        for (const card of matches) card.flyTo(to, flight);
        return matches.length;
    },

    /**
     * Set the scene date and or rate of every connected card with this `id`.
     * @param {string} id
     * @param {{ date?: any, rate?: any }} opts - date: now or ISO; rate: live or days per second
     * @returns {number} how many cards took it
     */
    setClock(id, opts = {}) {
        const clock = {
            ...(opts.date !== undefined && opts.date !== null && opts.date !== '' ? { date: opts.date } : {}),
            ...(opts.rate !== undefined && opts.rate !== null && opts.rate !== '' ? { rate: opts.rate } : {})
        };
        if (!Object.keys(clock).length) {
            lcardsLog.warn(`[Astrometrics] set-clock for '${id}' needs a date or a rate`);
            return 0;
        }
        const matches = [...cards].filter((c) => c.config?.id === id);
        if (!matches.length) {
            lcardsLog.debug(`[Astrometrics] set-clock: no astrometrics card with id '${id}' is open here`);
            return 0;
        }
        for (const card of matches) card.setClock(clock);
        return matches.length;
    },

    /**
     * Draw the models of every connected card with this `id` at their real
     * size, or larger to stay visible (not saved).
     * @param {string} id
     * @param {'real' | 'visible' | 'toggle'} mode
     * @returns {number} how many cards took it
     */
    setModelScale(id, mode = 'toggle') {
        const matches = [...cards].filter((c) => c.config?.id === id);
        if (!matches.length) {
            lcardsLog.debug(`[Astrometrics] set-model-scale: no astrometrics card with id '${id}' is open here`);
            return 0;
        }
        let n = 0;
        for (const card of matches) if (card.setModelScale(mode)) n++;
        if (!n) lcardsLog.warn(`[Astrometrics] set-model-scale for '${id}': model_scale is real, visible or toggle`);
        return n;
    }
};

if (typeof window !== 'undefined') {
    const w = /** @type {any} */ (window);
    w.lcards = w.lcards || {};
    w.lcards.cards = w.lcards.cards || {};
    w.lcards.cards.astrometrics = astrometricsRegistry;
}
