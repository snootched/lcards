/**
 * `window.lcards.cards.astrometrics`: the astrometrics cards on the page, by
 * their `id`, so other cards (`action: fly-to` with `card`) and automations
 * (`lcards.fly_to`) can fly their cameras. Cards add themselves on connect
 * and leave on disconnect; a card shown twice (two views, a wall panel)
 * flies everywhere it is open.
 *
 * @module cards/astrometrics-registry
 */
import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * @typedef {HTMLElement & { config?: any, flyTo: (view: string | Record<string, any>, opts?: { duration?: number }) => Promise<void> }} AstrometricsCardElement
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
     * @param {{ duration?: number }} [opts]
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
        for (const card of matches) card.flyTo(to, Number.isFinite(duration) && duration >= 0 ? { duration } : {});
        return matches.length;
    }
};

if (typeof window !== 'undefined') {
    const w = /** @type {any} */ (window);
    w.lcards = w.lcards || {};
    w.lcards.cards = w.lcards.cards || {};
    w.lcards.cards.astrometrics = astrometricsRegistry;
}
