/**
 * Slider config cleanup the editor applies when it opens a card.
 *
 * @module editor/utils/slider-config-cleanup
 */

/**
 * Drop range `label` values that aren't objects. Older versions of the slider
 * editor added `label: ''` to every new band range, which fails validation
 * (`label` is an object: text, colour, font size, offset).
 * @param {any} config - Slider card config (not mutated)
 * @returns {{config: any, changed: boolean}}
 */
export function dropStrayRangeLabels(config) {
    const ranges = config?.style?.ranges;
    /** @param {any} r */
    const stray = (r) => r && typeof r === 'object' && 'label' in r && (r.label === null || typeof r.label !== 'object');
    if (!Array.isArray(ranges) || !ranges.some(stray)) return { config, changed: false };
    const cleaned = ranges.map(r => {
        if (!stray(r)) return r;
        const { label: _label, ...rest } = r;
        return rest;
    });
    return { config: { ...config, style: { ...config.style, ranges: cleaned } }, changed: true };
}
