/**
 * @fileoverview Alert band geometry and config (alert overlay `display: band`).
 *
 * The band is a row of short vertical dashes across the screen with the alert
 * emblem in the middle (the Titan.DS red alert look). These helpers are pure, so
 * the band element (lcards-alert-band.js) and the tests share them.
 *
 * @module cards/alert-band-layout
 */

/** Band settings when the config sets none. */
export const BAND_DEFAULTS = Object.freeze({
    position: 'center',
    height: 'clamp(24px, 4vh, 64px)',
    dash_width: 8,
    dash_gap: 12,
    emblem: true,
    emblem_scale: 4,
    animation: 'sweep',
    grow: 1,
    dash_radius: 0,
    direction: 'outward',
    speed: 1,
    phase: null,
});

/** The alert symbol's own bar sweep at speed 1 (alert component, bars-*-sweep). */
export const EMBLEM_SWEEP_MS = 2000;

/**
 * One band animation cycle at speed 1, in ms; dashes light up within its first
 * 60%. The same period as the symbol's bar sweep, so `phase` stays put.
 */
export const BAND_CYCLE_MS = EMBLEM_SWEEP_MS;

/** Where the band's peak sits in its keyframes (band-sweep 8%, band-flash 0%). */
export const PEAK_OFFSET = { sweep: 0.08, flash: 0 };

/**
 * Start time for the band's animations so its sweep runs `phase` degrees after
 * the symbol's: the symbol's bars light one by one, D/12 apart, from the outer
 * bars (0 degrees) to the innermost (150); at 180 the band's first dash lights
 * one step later, so the sweep looks like it carries on out of the symbol.
 * @param {number} emblemStart - startTime of the symbol's first bar animation (document timeline ms)
 * @param {number} phase - Degrees
 * @param {number} cycleMs
 * @param {'sweep'|'flash'} animation
 * @returns {number}
 */
export function phasedStartTime(emblemStart, phase, cycleMs, animation) {
    const turns = (((Number(phase) || 0) % 360) + 360) % 360 / 360;
    return emblemStart + turns * cycleMs - (PEAK_OFFSET[animation] ?? 0) * cycleMs;
}

/** Speed multiplier from config, kept to a sane range (0.25 to 4). */
export function bandSpeed(speed) {
    const n = Number(speed);
    return Number.isFinite(n) && n > 0 ? Math.min(4, Math.max(0.25, n)) : 1;
}

/**
 * Animation delay of a dash in a sweep: outward starts next to the symbol,
 * inward at the screen edges.
 * @param {number} step - Dash step from the centre (0 = next to the symbol)
 * @param {number} maxStep - Largest step on screen
 * @param {'outward'|'inward'} direction
 * @param {number} cycleMs - Cycle length (after speed)
 * @returns {number} ms
 */
export function sweepDelay(step, maxStep, direction, cycleMs) {
    const span = Math.max(1, maxStep);
    const position = direction === 'inward' ? span - step : step;
    return Math.round((position / span) * cycleMs * 0.6);
}

/**
 * Corner radius in px for a dash: a number, or `pill` for fully rounded ends.
 * @param {number|string|undefined} radius
 * @param {number} dashWidth
 * @param {number} dashHeight
 * @returns {number}
 */
export function dashRadius(radius, dashWidth, dashHeight) {
    const max = Math.min(dashWidth, dashHeight) / 2;
    if (radius === 'pill') return max;
    const r = Number(radius);
    return Number.isFinite(r) && r > 0 ? Math.min(r, max) : 0;
}

/** Width over height of the alert emblem (the alert component's viewBox, 100 x 73.49). */
export const EMBLEM_ASPECT = 100 / 73.49;

/**
 * Band settings for a condition: defaults, then the card's `band`, then the
 * condition's `band`.
 * @param {Object} config - Alert overlay config
 * @param {string} condition - Active condition, e.g. 'red_alert'
 * @returns {typeof BAND_DEFAULTS & {color?: string}}
 */
export function resolveBandConfig(config, condition) {
    return {
        ...BAND_DEFAULTS,
        ...(config?.band ?? {}),
        ...(config?.conditions?.[condition]?.band ?? {}),
    };
}

/**
 * Vertical centre of the band in px. `top` and `bottom` keep the emblem on screen.
 * @param {string} position - top | center | bottom | '<n>%'
 * @param {number} screenHeight
 * @param {number} reach - Half the tallest part (the emblem, or the band without one)
 * @returns {number}
 */
export function bandCentreY(position, screenHeight, reach) {
    const margin = 16;
    if (position === 'top') return reach + margin;
    if (position === 'bottom') return screenHeight - reach - margin;
    const percent = typeof position === 'string' && /^-?\d+(\.\d+)?%$/.test(position.trim())
        ? parseFloat(position) : 50;
    return Math.min(screenHeight - reach, Math.max(reach, (screenHeight * percent) / 100));
}

/**
 * Dash positions across a band. Dashes run outward from the centre on both sides
 * of the emblem gap; `step` counts from the centre (0 is next to the emblem), so a
 * sweep animation can delay each dash by its step.
 * @param {number} width - Band width in px
 * @param {Object} opts
 * @param {number} opts.dashWidth
 * @param {number} opts.dashGap
 * @param {number} [opts.centreGap=0] - Width kept clear in the middle (emblem plus air)
 * @returns {{x: number, step: number}[]} sorted left to right
 */
export function bandDashes(width, { dashWidth, dashGap, centreGap = 0 }) {
    if (!(width > 0) || !(dashWidth > 0) || dashGap < 0) return [];
    const pitch = dashWidth + dashGap;
    const centre = width / 2;
    const half = centreGap > 0 ? centreGap / 2 : dashGap / 2;
    const dashes = [];
    for (let step = 0; ; step++) {
        const right = centre + half + step * pitch;
        const left = centre - half - step * pitch - dashWidth;
        if (right >= width && left + dashWidth <= 0) break;
        if (right < width) dashes.push({ x: right, step });
        if (left + dashWidth > 0) dashes.push({ x: left, step });
    }
    return dashes.sort((a, b) => a.x - b.x);
}
