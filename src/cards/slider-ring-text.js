/**
 * Ring slider text helpers (pure, no DOM).
 */

/** The theme token ring presets use for both the fill and the name ("the name in the fill colour"). */
export const RING_FILL_TOKEN = 'theme:components.slider.ring.fill.color';

/**
 * A ring preset colours the name with the theme's ring fill token, meaning "the
 * name in the fill colour". When the user sets their own `style.ring.fill.color`
 * and leaves the name's colour alone, the name follows the user's fill instead
 * of keeping the theme token. Returns the merged config unchanged otherwise.
 *
 * @param {any} merged - the merged config (preset + user), not mutated
 * @param {any} raw - the user's own config
 * @param {string} [tokenValue] - what the fill token resolves to: the merged
 *   config has theme tokens already resolved
 * @returns {any}
 */
export function ringNameFollowsFill(merged, raw, tokenValue) {
    const userFill = raw?.style?.ring?.fill?.color;
    if (userFill === undefined || userFill === null || userFill === '') return merged;
    if (raw?.text?.name?.color !== undefined) return merged;
    const nameColor = merged?.text?.name?.color;
    const isToken = (/** @type {any} */ v) => v === RING_FILL_TOKEN || (!!tokenValue && v === tokenValue);
    const follows = isToken(nameColor)
        || (nameColor && typeof nameColor === 'object' && isToken(nameColor.default));
    if (!follows) return merged;

    const fill = typeof userFill === 'object' ? userFill : { default: userFill };
    const color = typeof nameColor === 'object' ? { ...nameColor, ...fill } : fill;
    return {
        ...merged,
        text: { ...merged.text, name: { ...merged.text.name, color } }
    };
}
