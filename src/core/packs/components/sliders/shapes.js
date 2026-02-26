/**
 * Slider Shape Helpers
 *
 * Builds SVG `<clipPath>` elements for the `shaped` slider component.
 * Each shape type produces a different clip geometry; all other rendering
 * (fill, ranges, zones, label bands) is handled by the component and card.
 *
 * Adding a new shape: add a case to `SHAPE_BUILDERS` and export its name
 * in `SUPPORTED_SHAPES`. No other files need changing.
 *
 * @module core/packs/components/sliders/shapes
 */

/**
 * All supported shape type identifiers.
 * @type {string[]}
 */
export const SUPPORTED_SHAPES = [
    'lozenge',   // Fully rounded rect — rx = min(w, h) / 2
    'rect',      // Plain rectangle — no rounding
    'rounded',   // Rect with configurable corner radius
    'diamond',   // 4-point diamond polygon
    'hexagon',   // 6-point hexagon (flat-top, oriented to track)
    'polygon',   // N-point user-defined polygon (points as % of w/h)
    'path'       // Raw SVG path d-attribute (fully custom)
];

/**
 * Shape builder functions.
 * Each receives `(x, y, w, h, options)` and returns the inner SVG element
 * string (without the wrapping `<clipPath>` — that is added by `buildClipPath`).
 *
 * @type {Object.<string, function(number, number, number, number, Object): string>}
 */
const SHAPE_BUILDERS = {
    /**
     * Fully-rounded rectangle (pill / lozenge).
     * rx = ry = Math.floor(min(w, h) / 2) unless overridden by options.radius.
     */
    lozenge(x, y, w, h, options = {}) {
        const rx = options.radius != null
            ? Number(options.radius)
            : Math.floor(Math.min(w, h) / 2);
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}" />`;
    },

    /**
     * Plain rectangle — sharp corners.
     */
    rect(x, y, w, h) {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" />`;
    },

    /**
     * Rectangle with configurable corner radius.
     * options.radius (px) defaults to 8.
     */
    rounded(x, y, w, h, options = {}) {
        const rx = options.radius != null ? Number(options.radius) : 8;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}" />`;
    },

    /**
     * Diamond — polygon connecting the four edge midpoints.
     *   top-center → right-center → bottom-center → left-center
     */
    diamond(x, y, w, h) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const points = [
            `${cx},${y}`,          // top
            `${x + w},${cy}`,      // right
            `${cx},${y + h}`,      // bottom
            `${x},${cy}`           // left
        ].join(' ');
        return `<polygon points="${points}" />`;
    },

    /**
     * Flat-top hexagon.
     * When width ≥ height the long axis is horizontal; otherwise vertical.
     * options.orientation overrides auto-detection ('horizontal' | 'vertical').
     */
    hexagon(x, y, w, h, options = {}) {
        const orientation = options.orientation
            ?? (w >= h ? 'horizontal' : 'vertical');

        let points;
        if (orientation === 'horizontal') {
            // Flat top/bottom hexagon — notch on left and right
            const inset = w * 0.15;
            points = [
                `${x + inset},${y}`,
                `${x + w - inset},${y}`,
                `${x + w},${y + h / 2}`,
                `${x + w - inset},${y + h}`,
                `${x + inset},${y + h}`,
                `${x},${y + h / 2}`
            ].join(' ');
        } else {
            // Pointy top/bottom hexagon — notch on top and bottom
            const inset = h * 0.15;
            points = [
                `${x + w / 2},${y}`,
                `${x + w},${y + inset}`,
                `${x + w},${y + h - inset}`,
                `${x + w / 2},${y + h}`,
                `${x},${y + h - inset}`,
                `${x},${y + inset}`
            ].join(' ');
        }
        return `<polygon points="${points}" />`;
    },

    /**
     * User-defined polygon.
     * options.points: array of [xPct, yPct] pairs (0–1 relative to w/h).
     * Defaults to a safe rectangle if points are missing.
     */
    polygon(x, y, w, h, options = {}) {
        const pts = options.points;
        if (!Array.isArray(pts) || pts.length < 3) {
            // Fallback to rectangle
            return SHAPE_BUILDERS.rect(x, y, w, h);
        }
        const points = pts
            .map(([px, py]) => `${x + px * w},${y + py * h}`)
            .join(' ');
        return `<polygon points="${points}" />`;
    },

    /**
     * Raw SVG path.
     * options.d: SVG path d-attribute string (in absolute coordinates relative to
     * the lozenge body origin — i.e., the caller is responsible for translating
     * by x/y if needed, or pass a path that already accounts for x/y offsets).
     * options.translate: if true, prepend a transform translate(x, y) wrapper.
     */
    path(x, y, w, h, options = {}) {
        const d = options.d || `M${x},${y} H${x + w} V${y + h} H${x} Z`;
        if (options.translate) {
            return `<g transform="translate(${x}, ${y})"><path d="${d}" /></g>`;
        }
        return `<path d="${d}" />`;
    }
};

/**
 * Build a complete SVG `<clipPath>` element for the requested shape.
 *
 * @param {string} id         - Unique clipPath ID (no leading `#`)
 * @param {string} shapeType  - One of SUPPORTED_SHAPES
 * @param {number} x          - Left edge of the shape bounding box (px)
 * @param {number} y          - Top edge of the shape bounding box (px)
 * @param {number} w          - Shape width (px)
 * @param {number} h          - Shape height (px)
 * @param {Object} [options]  - Shape-specific options (radius, points, d, …)
 * @returns {string} SVG `<clipPath>…</clipPath>` element string
 */
export function buildClipPath(id, shapeType, x, y, w, h, options = {}) {
    const builder = SHAPE_BUILDERS[shapeType] ?? SHAPE_BUILDERS.lozenge;
    const inner = builder(x, y, w, h, options);
    return `<clipPath id="${id}">\n    ${inner}\n  </clipPath>`;
}

/**
 * Check whether a given shape type is supported.
 * @param {string} shapeType
 * @returns {boolean}
 */
export function isSupportedShape(shapeType) {
    return shapeType in SHAPE_BUILDERS;
}
