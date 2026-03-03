/**
 * ShapeTextureRenderer
 *
 * Pure string-generator class that produces SVG texture layer markup
 * (defs + texture element) for injection inside button/elbow SVGs.
 *
 * No DOM, no lifecycle — render-time only.
 *
 * @module core/packs/textures/ShapeTextureRenderer
 */

/**
 * Generates the SVG texture layer markup for a shape texture preset.
 */
export class ShapeTextureRenderer {
    /**
     * @param {Object} preset - Preset from SHAPE_TEXTURE_PRESETS
     * @param {Object} resolvedConfig - Fully resolved config (colors resolved, tokens resolved)
     * @param {string} id - Unique ID suffix for scoping SVG def IDs
     */
    constructor(preset, resolvedConfig, id) {
        this._preset = preset;
        this._config = resolvedConfig || {};
        this._id = id;
    }

    /**
     * Generate the complete texture layer markup (defs + texture element).
     *
     * @param {string|null} shapePath - SVG path d= string for complex shapes, null for rect
     * @param {number} width - Element width in px
     * @param {number} height - Element height in px
     * @param {Object} border - Border config { topLeft, topRight, bottomLeft, bottomRight, radius }
     * @param {string} blendMode - CSS mix-blend-mode value
     * @param {number} opacity - Resolved opacity for this state
     * @returns {string} SVG markup string
     */
    render(shapePath, width, height, border, blendMode, opacity) {
        const id = this._id;
        const cfg = this._config;
        const preset = this._preset;
        const safeOpacity = Math.max(0, Math.min(1, opacity ?? 1));
        const safeBlend = blendMode || 'normal';

        // Generate preset-specific defs content
        // For 'solid' preset getFillRef accepts cfg too
        const defsContent = preset.createDefs(id, cfg);
        const fillRef = typeof preset.getFillRef === 'function'
            ? preset.getFillRef(id, cfg)
            : `url(#stex-pattern-${id})`;

        // Build clip path geometry matching the background shape
        let clipShapeMarkup;
        let textureShapeMarkup;

        if (shapePath) {
            // Complex/elbow path shape
            clipShapeMarkup = `<path d="${shapePath}"/>`;
            textureShapeMarkup = `<path d="${shapePath}"
                fill="${fillRef}"
                clip-path="url(#stex-clip-${id})"
                opacity="${safeOpacity}"
                style="pointer-events: none; mix-blend-mode: ${safeBlend};"
            />`;
        } else {
            // Rect shape — use minimum per-corner radius as conservative clip approximation
            const rx = _computeClipRadius(border);
            const ry = rx;
            clipShapeMarkup = `<rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" ry="${ry}"/>`;
            textureShapeMarkup = `<rect x="0" y="0" width="${width}" height="${height}"
                rx="${rx}" ry="${ry}"
                fill="${fillRef}"
                clip-path="url(#stex-clip-${id})"
                opacity="${safeOpacity}"
                style="pointer-events: none; mix-blend-mode: ${safeBlend};"
            />`;
        }

        // For filter-based presets (e.g. fluid), use filter= attribute instead of fill=
        const isFilterPreset = defsContent && defsContent.includes(`stex-filter-${id}`);
        if (isFilterPreset) {
            if (shapePath) {
                textureShapeMarkup = `<path d="${shapePath}"
                    fill="white"
                    filter="${fillRef}"
                    clip-path="url(#stex-clip-${id})"
                    opacity="${safeOpacity}"
                    style="pointer-events: none; mix-blend-mode: ${safeBlend};"
                />`;
            } else {
                const rx = _computeClipRadius(border);
                const ry = rx;
                textureShapeMarkup = `<rect x="0" y="0" width="${width}" height="${height}"
                    rx="${rx}" ry="${ry}"
                    fill="white"
                    filter="${fillRef}"
                    clip-path="url(#stex-clip-${id})"
                    opacity="${safeOpacity}"
                    style="pointer-events: none; mix-blend-mode: ${safeBlend};"
                />`;
            }
        }

        const defsBlock = defsContent ? `
        <defs>
            <clipPath id="stex-clip-${id}">
                ${clipShapeMarkup}
            </clipPath>
            ${defsContent}
        </defs>` : `
        <defs>
            <clipPath id="stex-clip-${id}">
                ${clipShapeMarkup}
            </clipPath>
        </defs>`;

        return `${defsBlock}
        ${textureShapeMarkup}`;
    }
}

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Compute a safe conservative clip radius from a border config object.
 *
 * When per-corner radii are present (topLeft, topRight, bottomRight, bottomLeft),
 * returns the minimum of all four corners so the clip rect never extends beyond
 * any corner of the actual rendered shape. Falls back to border.radius or 0
 * when individual corner values are absent.
 *
 * @param {Object|null|undefined} border
 * @returns {number}
 */
function _computeClipRadius(border) {
    if (!border) return 0;
    const hasCorners =
        border.topLeft !== undefined ||
        border.topRight !== undefined ||
        border.bottomRight !== undefined ||
        border.bottomLeft !== undefined;
    if (hasCorners) {
        const tl = Number(border.topLeft ?? 0);
        const tr = Number(border.topRight ?? 0);
        const br = Number(border.bottomRight ?? 0);
        const bl = Number(border.bottomLeft ?? 0);
        return Math.min(tl, tr, br, bl);
    }
    return Number(border.radius ?? 0);
}
