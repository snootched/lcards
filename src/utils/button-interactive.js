import { SPECIAL_TOGGLE_ACTIONS } from '../base/LCARdSActionHandler.js';

/**
 * Domains the default tap (toggle) acts on: Home Assistant's DOMAINS_TOGGLE
 * (frontend src/common/const.ts) plus the domains whose toggle is another service
 * (SPECIAL_TOGGLE_ACTIONS).
 */
export const TOGGLE_DOMAINS = new Set([
    'fan', 'input_boolean', 'light', 'switch', 'group', 'automation', 'humidifier', 'valve',
    ...Object.keys(SPECIAL_TOGGLE_ACTIONS),
]);

/**
 * Whether a button (or elbow) is interactive: hover and pressed colours, the hand
 * cursor and hover animations. Actions are not affected.
 *
 * `interactive: true | false` wins. Left out, a button is interactive when it does
 * something: an action (tap, hold or double tap; `action: none` is no action), a component or SVG whose segments
 * carry their own actions, or an entity its default tap (toggle) can switch. A button
 * with none of these is a decorative label, title, readout or filler: no hover colour,
 * the arrow cursor (2026-11-12; before, every button hovered unless it said
 * `interactive: false`, and a readout's tap tried a toggle the entity doesn't have).
 * @param {any} config - the card config
 * @returns {boolean}
 */
export function isInteractive(config) {
    const c = config ?? {};
    if (typeof c.interactive === 'boolean') return c.interactive;
    const acts = (/** @type {any} */ a) => Boolean(a) && a.action !== 'none';
    if (acts(c.hold_action) || acts(c.double_tap_action) || c.component || c.svg?.segments) return true;
    // A tap action set on the card replaces the default toggle
    if (c.tap_action) return acts(c.tap_action);
    const entity = typeof c.entity === 'string' ? c.entity : '';
    return TOGGLE_DOMAINS.has(entity.split('.')[0]);
}
