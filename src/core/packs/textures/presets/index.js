/**
 * Shape Texture Preset Registry
 *
 * SVG-native texture/animation presets rendered inside button/elbow shape boundaries.
 * Each preset generates SVG <defs> markup (patterns/filters) and a fill reference string.
 *
 * Consumed directly by ShapeTextureRenderer — does NOT go through StylePresetManager.
 *
 * @module core/packs/textures/presets
 */

/**
 * Built-in shape texture presets
 * @type {Object.<string, {name: string, description: string, createDefs: Function, getFillRef: Function, defaults: Object}>}
 */
export const SHAPE_TEXTURE_PRESETS = {

    /**
     * Scrolling grid lines (horizontal + vertical, or single axis)
     */
    'grid': {
        name: 'Grid',
        description: 'Scrolling grid lines inside the shape boundary',
        defaults: {
            color: 'rgba(255,255,255,0.3)',
            line_width: 1,
            line_spacing: 40,
            scroll_speed_x: 20,
            scroll_speed_y: 0,
            pattern: 'both'
        },
        createDefs(id, cfg) {
            const spacing = cfg.line_spacing ?? 40;
            const lw = cfg.line_width ?? 1;
            const color = cfg.color ?? 'rgba(255,255,255,0.3)';
            const sx = cfg.scroll_speed_x ?? 20;
            const sy = cfg.scroll_speed_y ?? 0;
            const pattern = cfg.pattern ?? 'both';

            let lines = '';
            if (pattern === 'both' || pattern === 'vertical') {
                lines += `<line x1="${spacing}" y1="0" x2="${spacing}" y2="${spacing}" stroke="${color}" stroke-width="${lw}"/>`;
            }
            if (pattern === 'both' || pattern === 'horizontal') {
                lines += `<line x1="0" y1="${spacing}" x2="${spacing}" y2="${spacing}" stroke="${color}" stroke-width="${lw}"/>`;
            }

            let animate = '';
            if (sx !== 0 || sy !== 0) {
                const durX = sx !== 0 ? (spacing / Math.abs(sx)).toFixed(2) : null;
                const durY = sy !== 0 ? (spacing / Math.abs(sy)).toFixed(2) : null;
                const dur = durX ?? durY;
                const toX = sx !== 0 ? spacing : 0;
                const toY = sy !== 0 ? spacing : 0;
                animate = `<animateTransform attributeName="patternTransform" type="translate"
                    from="0 0" to="${toX} ${toY}"
                    dur="${dur}s" repeatCount="indefinite"/>`;
            }

            return `<pattern id="stex-pattern-${id}" x="0" y="0" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">
                ${lines}
                ${animate}
            </pattern>`;
        },
        getFillRef(id) {
            return `url(#stex-pattern-${id})`;
        }
    },

    /**
     * Scrolling diagonal hatching
     */
    'diagonal': {
        name: 'Diagonal',
        description: 'Scrolling diagonal hatch lines inside the shape boundary',
        defaults: {
            color: 'rgba(255,255,255,0.3)',
            line_width: 1,
            line_spacing: 40,
            scroll_speed_x: 20,
            scroll_speed_y: 20
        },
        createDefs(id, cfg) {
            const spacing = cfg.line_spacing ?? 40;
            const lw = cfg.line_width ?? 1;
            const color = cfg.color ?? 'rgba(255,255,255,0.3)';
            const sx = cfg.scroll_speed_x ?? 20;
            const sy = cfg.scroll_speed_y ?? 20;

            // Diagonal lines: two parallel diagonals per tile for clean tiling
            const lines = `
                <line x1="0" y1="0" x2="${spacing}" y2="${spacing}" stroke="${color}" stroke-width="${lw}"/>
                <line x1="${-spacing}" y1="0" x2="0" y2="${spacing}" stroke="${color}" stroke-width="${lw}"/>
                <line x1="${spacing}" y1="0" x2="${spacing * 2}" y2="${spacing}" stroke="${color}" stroke-width="${lw}"/>
            `;

            let animate = '';
            if (sx !== 0 || sy !== 0) {
                const toX = sx !== 0 ? spacing : 0;
                const toY = sy !== 0 ? spacing : 0;
                const dist = Math.sqrt(toX * toX + toY * toY);
                const speed = Math.sqrt(sx * sx + sy * sy) || 1;
                const dur = (dist / speed).toFixed(2);
                animate = `<animateTransform attributeName="patternTransform" type="translate"
                    from="0 0" to="${toX} ${toY}"
                    dur="${dur}s" repeatCount="indefinite"/>`;
            }

            return `<pattern id="stex-pattern-${id}" x="0" y="0" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">
                ${lines}
                ${animate}
            </pattern>`;
        },
        getFillRef(id) {
            return `url(#stex-pattern-${id})`;
        }
    },

    /**
     * Scrolling hexagonal grid
     */
    'hexagonal': {
        name: 'Hexagonal',
        description: 'Scrolling hexagonal grid inside the shape boundary',
        defaults: {
            color: 'rgba(255,255,255,0.3)',
            line_width: 1,
            hex_radius: 20,
            scroll_speed_x: 15,
            scroll_speed_y: 0
        },
        createDefs(id, cfg) {
            const r = cfg.hex_radius ?? 20;
            const lw = cfg.line_width ?? 1;
            const color = cfg.color ?? 'rgba(255,255,255,0.3)';
            const sx = cfg.scroll_speed_x ?? 15;
            const sy = cfg.scroll_speed_y ?? 0;

            // Hexagon path centered at (cx, cy) with radius r using flat-top orientation
            const hexPath = (cx, cy) => {
                const pts = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 180) * (60 * i - 30);
                    pts.push(`${(cx + r * Math.cos(angle)).toFixed(3)},${(cy + r * Math.sin(angle)).toFixed(3)}`);
                }
                return `M ${pts.join(' L ')} Z`;
            };

            // Tile dimensions for pointy-top hex grid
            const w = r * Math.sqrt(3);
            const h = r * 2;
            const tileW = w;
            const tileH = h * 0.75;

            const hexes = `
                <path d="${hexPath(tileW / 2, tileH / 2)}" fill="none" stroke="${color}" stroke-width="${lw}"/>
                <path d="${hexPath(0, tileH)}" fill="none" stroke="${color}" stroke-width="${lw}"/>
                <path d="${hexPath(tileW, tileH)}" fill="none" stroke="${color}" stroke-width="${lw}"/>
            `;

            let animate = '';
            if (sx !== 0 || sy !== 0) {
                const toX = sx !== 0 ? tileW : 0;
                const toY = sy !== 0 ? tileH : 0;
                const dist = Math.sqrt(toX * toX + toY * toY);
                const speed = Math.sqrt(sx * sx + sy * sy) || 1;
                const dur = (dist / speed).toFixed(2);
                animate = `<animateTransform attributeName="patternTransform" type="translate"
                    from="0 0" to="${toX.toFixed(3)} ${toY.toFixed(3)}"
                    dur="${dur}s" repeatCount="indefinite"/>`;
            }

            return `<pattern id="stex-pattern-${id}" x="0" y="0" width="${tileW.toFixed(3)}" height="${tileH.toFixed(3)}" patternUnits="userSpaceOnUse">
                ${hexes}
                ${animate}
            </pattern>`;
        },
        getFillRef(id) {
            return `url(#stex-pattern-${id})`;
        }
    },

    /**
     * Scrolling dot grid
     */
    'dots': {
        name: 'Dots',
        description: 'Scrolling dot grid inside the shape boundary',
        defaults: {
            color: 'rgba(255,255,255,0.4)',
            dot_radius: 2,
            spacing: 20,
            scroll_speed_x: 15,
            scroll_speed_y: 0
        },
        createDefs(id, cfg) {
            const spacing = cfg.spacing ?? 20;
            const dr = cfg.dot_radius ?? 2;
            const color = cfg.color ?? 'rgba(255,255,255,0.4)';
            const sx = cfg.scroll_speed_x ?? 15;
            const sy = cfg.scroll_speed_y ?? 0;

            const circles = `<circle cx="${spacing / 2}" cy="${spacing / 2}" r="${dr}" fill="${color}"/>`;

            let animate = '';
            if (sx !== 0 || sy !== 0) {
                const toX = sx !== 0 ? spacing : 0;
                const toY = sy !== 0 ? spacing : 0;
                const dist = Math.sqrt(toX * toX + toY * toY);
                const speed = Math.sqrt(sx * sx + sy * sy) || 1;
                const dur = (dist / speed).toFixed(2);
                animate = `<animateTransform attributeName="patternTransform" type="translate"
                    from="0 0" to="${toX} ${toY}"
                    dur="${dur}s" repeatCount="indefinite"/>`;
            }

            return `<pattern id="stex-pattern-${id}" x="0" y="0" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">
                ${circles}
                ${animate}
            </pattern>`;
        },
        getFillRef(id) {
            return `url(#stex-pattern-${id})`;
        }
    },

    /**
     * Turbulence-based organic fluid effect
     */
    'fluid': {
        name: 'Fluid',
        description: 'Organic turbulence-based fluid animation inside the shape boundary',
        defaults: {
            color: 'rgba(100,180,255,0.5)',
            base_frequency: 0.015,
            num_octaves: 3,
            speed: 0.5
        },
        createDefs(id, cfg) {
            const bf = cfg.base_frequency ?? 0.015;
            const numOctaves = cfg.num_octaves ?? 3;
            const speed = cfg.speed ?? 0.5;
            const color = cfg.color ?? 'rgba(100,180,255,0.5)';
            const dur = speed > 0 ? (10 / speed).toFixed(2) : null;

            // Parse color to RGBA components for feColorMatrix
            let r = 0.4, g = 0.7, b = 1.0, a = 0.5;
            try {
                const parsed = _parseColorComponents(color);
                if (parsed) {
                    r = parsed.r / 255;
                    g = parsed.g / 255;
                    b = parsed.b / 255;
                    a = parsed.a;
                }
            } catch (_e) {
                // Use defaults on parse failure
            }

            const bfHigh = (bf * 1.3).toFixed(4);
            const animateEl = dur ? `<animate attributeName="baseFrequency"
                values="${bf};${bfHigh};${bf}"
                dur="${dur}s"
                repeatCount="indefinite"/>` : '';

            return `<filter id="stex-filter-${id}" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
                <feTurbulence type="turbulence" baseFrequency="${bf}" numOctaves="${numOctaves}" seed="42" result="noise">
                    ${animateEl}
                </feTurbulence>
                <feColorMatrix type="matrix"
                    values="0 0 0 0 ${r.toFixed(3)}  0 0 0 0 ${g.toFixed(3)}  0 0 0 0 ${b.toFixed(3)}  0 0 0 ${a.toFixed(3)} 0"
                    result="colored"/>
                <feComposite in="colored" in2="SourceGraphic" operator="in"/>
            </filter>`;
        },
        getFillRef(id) {
            return `url(#stex-filter-${id})`;
        }
    },

    /**
     * Static solid fill — useful for state-reactive opacity with no overhead
     */
    'solid': {
        name: 'Solid',
        description: 'Static solid color fill inside the shape boundary',
        defaults: {
            color: 'rgba(255,255,255,0.15)'
        },
        createDefs(_id, _cfg) {
            // No defs needed — fill color applied directly on the element
            return '';
        },
        getFillRef(_id, cfg) {
            return cfg?.color ?? 'rgba(255,255,255,0.15)';
        }
    }
};

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Parse a CSS color string into {r, g, b, a} components.
 * Supports rgba(...), rgb(...), and #hex formats.
 * @param {string} color
 * @returns {{r: number, g: number, b: number, a: number}|null}
 * @private
 */
function _parseColorComponents(color) {
    if (!color || typeof color !== 'string') return null;

    // rgba(r, g, b, a)
    let m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (m) {
        return {
            r: parseFloat(m[1]),
            g: parseFloat(m[2]),
            b: parseFloat(m[3]),
            a: m[4] !== undefined ? parseFloat(m[4]) : 1
        };
    }

    // #rrggbb or #rgb
    m = color.match(/^#([0-9a-fA-F]{3,8})$/);
    if (m) {
        let hex = m[1];
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length === 6) hex += 'ff';
        if (hex.length === 8) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: parseInt(hex.slice(6, 8), 16) / 255
            };
        }
    }

    return null;
}
