/**
 * Shape Texture Preset Registry
 *
 * SVG-native texture/animation presets rendered inside button/elbow shape boundaries.
 * Each preset generates SVG <defs> markup (patterns/filters) and a fill reference string.
 *
 * Consumed directly by ShapeTextureRenderer — does NOT go through StylePresetManager.
 *
 * createDefs(id, cfg, ctx) signature:
 *   id  — unique string suffix scoping all SVG def element IDs
 *   cfg — resolved config object (tokens/state already resolved)
 *   ctx — { width, height } of the shape being textured (may be undefined for old callers)
 *
 * @module core/packs/textures/presets
 */

// ─── Shared animation helper ──────────────────────────────────────────────────
/**
 * Build a seamless patternTransform translate animation string with wall-clock phase sync.
 *
 * Uses Date.now() to pre-wind the `from` value so that when the SVG is re-injected
 * by Lit on re-render, the animation appears to continue from where it was rather
 * than snapping back to position 0.
 *
 * Returns '' when both speeds are zero.
 *
 * @param {number} sx - scroll_speed_x (px/s)
 * @param {number} sy - scroll_speed_y (px/s)
 * @param {number} tileW - pattern tile width (animation loops every tileW px in X)
 * @param {number} tileH - pattern tile height (animation loops every tileH px in Y)
 * @returns {string} SVG SMIL animateTransform element string
 */
function _scrollAnim(sx, sy, tileW, tileH) {
    const absX = Math.abs(sx);
    const absY = Math.abs(sy);
    if (absX === 0 && absY === 0) return '';

    let dur, toX, toY;
    if (absX !== 0) {
        dur = tileW / absX;
        toX = sx > 0 ? tileW : -tileW;
        toY = sy !== 0 ? sy * dur : 0;
    } else {
        dur = tileH / absY;
        toY = sy > 0 ? tileH : -tileH;
        toX = 0;
    }

    // Phase offset: pre-wind the animation to where it would be at the current wall-clock time.
    // This prevents the visible snap-back-to-zero when the SVG is re-injected on Lit re-render.
    const phase = (Date.now() / 1000) % dur;
    const fromX = -(toX * phase / dur);
    const fromY = -(toY * phase / dur);
    const endX  = fromX + toX;
    const endY  = fromY + toY;

    return `<animateTransform attributeName="patternTransform" type="translate"
            from="${fromX.toFixed(3)} ${fromY.toFixed(3)}" to="${endX.toFixed(3)} ${endY.toFixed(3)}"
            dur="${dur.toFixed(2)}s" repeatCount="indefinite"/>`;
}

/**
 * Build a seamless scrolling turbulence pattern using an inner filter on the pattern tile.
 *
 * Why this is seam-free:
 *  When a <filter> is applied to a <rect> INSIDE a <pattern>, the filter evaluates
 *  in the pattern tile's LOCAL coordinate system (0..W × 0..H) — not in absolute
 *  screen-space. Every tile produces identical output regardless of where the pattern
 *  is rendered. Animating patternTransform translate is therefore always seamless —
 *  no stitch boundary can ever be visible because all tiles look the same.
 *
 *  (The old feTile+feOffset approach failed because browsers clip feTile output to
 *  the filter region; it did not truly extend infinitely.)
 *
 * @param {string} id
 * @param {string} turbPrim   - feTurbulence element; result MUST be "turb"
 * @param {string} colorPrim  - colour/composite stages; reads from result="turb"
 * @param {number} W - tile width in px (= shape width; stitch period)
 * @param {number} H - tile height in px
 * @param {number} sx - scroll speed x (px/s); negative = reverse
 * @param {number} sy - scroll speed y (px/s)
 * @returns {string} SVG defs markup: one <filter> + one <pattern>
 */
function _turbPattern(id, turbPrim, colorPrim, W, H, sx, sy) {
    // Inner filter: evaluates in tile-local coords — identical for every repeated tile
    const innerFilter = `<filter id="stex-inner-${id}" x="0" y="0" width="${W}" height="${H}"
            filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        ${turbPrim}
        ${colorPrim}
    </filter>`;

    // Pattern: tiles the filtered rect, animated by patternTransform translate
    const animEl = _scrollAnim(sx, sy, W, H);
    const pattern = `<pattern id="stex-pattern-${id}" x="0" y="0" width="${W}" height="${H}" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="${W}" height="${H}" filter="url(#stex-inner-${id})"/>
        ${animEl}
    </pattern>`;

    return `${innerFilter}\n    ${pattern}`;
}

/**
 * Built-in shape texture presets
 * @type {Object.<string, {name: string, description: string, createDefs: Function, getFillRef: Function, defaults: Object}>}
 */
export const SHAPE_TEXTURE_PRESETS = {

    // ─── Structural presets ──────────────────────────────────────────────────

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
                const durX = sx !== 0 ? spacing / Math.abs(sx) : null;
                const durY = sy !== 0 ? spacing / Math.abs(sy) : null;
                const dur = durX ?? durY;
                const toX = sx !== 0 ? spacing : 0;
                const toY = sy !== 0 ? spacing : 0;
                const phase = (Date.now() / 1000) % dur;
                const fromX = -(toX * phase / dur);
                const fromY = -(toY * phase / dur);
                const endX  = fromX + toX;
                const endY  = fromY + toY;
                animate = `<animateTransform attributeName="patternTransform" type="translate"
                    from="${fromX.toFixed(3)} ${fromY.toFixed(3)}" to="${endX.toFixed(3)} ${endY.toFixed(3)}"
                    dur="${dur.toFixed(2)}s" repeatCount="indefinite"/>`;
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
                const dur = dist / speed;
                const phase = (Date.now() / 1000) % dur;
                const fromX = -(toX * phase / dur);
                const fromY = -(toY * phase / dur);
                const endX  = fromX + toX;
                const endY  = fromY + toY;
                animate = `<animateTransform attributeName="patternTransform" type="translate"
                    from="${fromX.toFixed(3)} ${fromY.toFixed(3)}" to="${endX.toFixed(3)} ${endY.toFixed(3)}"
                    dur="${dur.toFixed(2)}s" repeatCount="indefinite"/>`;
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
                const dur = dist / speed;
                const phase = (Date.now() / 1000) % dur;
                const fromX = -(toX * phase / dur);
                const fromY = -(toY * phase / dur);
                const endX  = fromX + toX;
                const endY  = fromY + toY;
                animate = `<animateTransform attributeName="patternTransform" type="translate"
                    from="${fromX.toFixed(3)} ${fromY.toFixed(3)}" to="${endX.toFixed(3)} ${endY.toFixed(3)}"
                    dur="${dur.toFixed(2)}s" repeatCount="indefinite"/>`;
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
                const dur = dist / speed;
                const phase = (Date.now() / 1000) % dur;
                const fromX = -(toX * phase / dur);
                const fromY = -(toY * phase / dur);
                const endX  = fromX + toX;
                const endY  = fromY + toY;
                animate = `<animateTransform attributeName="patternTransform" type="translate"
                    from="${fromX.toFixed(3)} ${fromY.toFixed(3)}" to="${endX.toFixed(3)} ${endY.toFixed(3)}"
                    dur="${dur.toFixed(2)}s" repeatCount="indefinite"/>`;
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

    // ─── Turbulence / glow presets ───────────────────────────────────────────

    /**
     * Fluid — organic swirling animation: fractalNoise with animated baseFrequency
     * makes the blobs genuinely evolve over time (not just scroll a frozen tile).
     * The tile scrolls diagonally while the noise continuously morphs — true swirling.
     */
    'fluid': {
        name: 'Fluid',
        description: 'Organic swirling noise — large blobs drift diagonally with subtle living variation',
        defaults: {
            color: 'rgba(100,180,255,0.8)',
            base_frequency: 0.010,
            num_octaves: 4,
            scroll_speed_x: 7,
            scroll_speed_y: 10,
            evolution_speed: 0    // 0 = backward-compatible frozen tile
        },
        createDefs(id, cfg, ctx) {
            const W          = ctx?.width  ?? 200;
            const H          = ctx?.height ?? 60;
            const bf         = cfg.base_frequency ?? 0.010;
            const numOctaves = cfg.num_octaves    ?? 4;
            const sx         = cfg.scroll_speed_x ?? 7;
            const sy         = cfg.scroll_speed_y ?? 10;
            const color      = cfg.color          ?? 'rgba(100,180,255,0.8)';

            // evolution_speed: 0 = no evolution (default), 1.0 = fast swirl.
            // bfRange linearly interpolates between ±5% (barely perceptible) and ±25% (fast churn).
            const evo = Math.max(0, Math.min(1, cfg.evolution_speed ?? 0));
            const bfRange = bf * (0.05 + evo * 0.20);  // 5% at evo=0, 25% at evo=1
            const bfLo = (bf - bfRange).toFixed(5);
            const bfHi = (bf + bfRange).toFixed(5);
            // Duration: 25s at evo→0 (very slow), 5s at evo=1 (fast). Floor at 1s for safety.
            const evoDur = evo > 0 ? Math.max(1, 25 - evo * 20).toFixed(1) : null;

            // Only emit the <animate> when evolution is active
            const evoAnim = evoDur ? `<animate attributeName="baseFrequency"
                    values="${bf};${bfHi};${bf};${bfLo};${bf}"
                    dur="${evoDur}s" calcMode="spline"
                    keySplines="0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1"
                    repeatCount="indefinite"/>` : '';

            const turbPrim = `<feTurbulence type="fractalNoise" baseFrequency="${bf}" numOctaves="${numOctaves}"
                seed="42" stitchTiles="stitch" result="turb">${evoAnim ? '\n                ' + evoAnim + '\n            ' : ''}
            </feTurbulence>`;
            // Use feFlood so ANY color format (CSS var, hex, rgba, theme token) works natively —
            // no manual RGB extraction needed.
            const colorPrim = `<feColorMatrix in="turb" type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 2 -0.3 0" result="mask"/>
            <feFlood flood-color="${color}" flood-opacity="1" result="flood"/>
            <feComposite in="flood" in2="mask" operator="in"/>`;

            return _turbPattern(id, turbPrim, colorPrim, W, H, sx, sy);
        },
        getFillRef(id) { return `url(#stex-pattern-${id})`; }
    },

    /**
     * Plasma — dual-colour fractalNoise wash, hue-shifting energy look.
     * Uses feTile+feOffset for seamless scrolling.
     */
    'plasma': {
        name: 'Plasma',
        description: 'Dual-colour turbulence wash — energy / plasma glow',
        defaults: {
            color_a: 'rgba(80,0,255,0.9)',
            color_b: 'rgba(255,40,120,0.9)',
            base_frequency: 0.012,
            num_octaves: 2,
            scroll_speed_x: 8,
            scroll_speed_y: 5,
            evolution_speed: 0    // 0 = backward-compatible frozen tile
        },
        createDefs(id, cfg, ctx) {
            const W          = ctx?.width  ?? 200;
            const H          = ctx?.height ?? 60;
            const bf         = cfg.base_frequency ?? 0.012;
            const numOctaves = cfg.num_octaves    ?? 2;
            const sx         = cfg.scroll_speed_x ?? 8;
            const sy         = cfg.scroll_speed_y ?? 5;
            const ca         = cfg.color_a        ?? 'rgba(80,0,255,0.9)';
            const cb         = cfg.color_b        ?? 'rgba(255,40,120,0.9)';

            // evolution_speed: 0 = no evolution (default), 1.0 = fast plasma churn.
            // X and Y frequency channels evolve at slightly different rates for an independent look.
            const evo = Math.max(0, Math.min(1, cfg.evolution_speed ?? 0));
            const bfY = bf * 0.7;
            const bfRange = bf * (0.05 + evo * 0.20);  // 5% at evo=0, 25% at evo=1
            const bfLo  = (bf - bfRange).toFixed(5);
            const bfHi  = (bf + bfRange).toFixed(5);
            const bfYLo = (bfY - bfRange * 0.7).toFixed(5);
            const bfYHi = (bfY + bfRange * 0.7).toFixed(5);
            // Duration: 30s at evo→0 (slow), 8s at evo=1 (fast). Floor at 1s for safety.
            const evoDur = evo > 0 ? Math.max(1, 30 - evo * 22).toFixed(1) : null;

            // Build baseFrequency values with both X and Y components evolving
            const evoAnim = evoDur ? `<animate attributeName="baseFrequency"
                    values="${bf} ${bfY.toFixed(5)};${bfHi} ${bfYHi};${bf} ${bfY.toFixed(5)};${bfLo} ${bfYLo};${bf} ${bfY.toFixed(5)}"
                    dur="${evoDur}s" calcMode="spline"
                    keySplines="0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1"
                    repeatCount="indefinite"/>` : '';

            const turbPrim = `<feTurbulence type="fractalNoise"
                baseFrequency="${bf} ${bfY.toFixed(4)}"
                numOctaves="${numOctaves}" seed="7" stitchTiles="stitch" result="turb">${evoAnim ? '\n                ' + evoAnim + '\n            ' : ''}
            </feTurbulence>`;
            // Use feFlood+feComposite for each colour so CSS vars / theme tokens work natively.
            // The turbulence R channel drives the split: bright → color_a, dark → color_b.
            const colorPrim = `<feColorMatrix in="turb" type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.8 0 0 0 -0.4" result="maskA"/>
            <feFlood flood-color="${ca}" flood-opacity="1" result="floodA"/>
            <feComposite in="floodA" in2="maskA" operator="in" result="layerA"/>
            <feColorMatrix in="turb" type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.8 0 0 0 1.4" result="maskB"/>
            <feFlood flood-color="${cb}" flood-opacity="1" result="floodB"/>
            <feComposite in="floodB" in2="maskB" operator="in" result="layerB"/>
            <feBlend in="layerA" in2="layerB" mode="screen"/>`;

            return _turbPattern(id, turbPrim, colorPrim, W, H, sx, sy);
        },
        getFillRef(id) { return `url(#stex-pattern-${id})`; }
    },
    'shimmer': {
        name: 'Shimmer',
        description: 'Diagonal light-sweep — angle controls direction, like light catching a metallic surface',
        defaults: {
            color: 'rgba(255,255,255,0.55)',
            highlight_width: 0.35,
            speed: 2.5,
            angle: 30
        },
        createDefs(id, cfg, ctx) {
            const W   = (ctx?.width  ?? 200);
            const H   = (ctx?.height ?? 60);
            const color = cfg.color ?? 'rgba(255,255,255,0.55)';
            const hw  = cfg.highlight_width ?? 0.35;
            const spd = cfg.speed           ?? 2.5;
            const ang = cfg.angle           ?? 30;   // degrees

            const rad  = ang * Math.PI / 180;
            const cosa = Math.cos(rad);
            const sina = Math.sin(rad);

            // Tile large enough that the highlight band never wraps within one button width.
            // Use diagonal of bounding box so the tile covers elbow shapes fully in any direction.
            const tileW = W * 3;
            const tileH = Math.ceil(Math.sqrt(W * W + H * H));
            const cx    = tileW / 2;
            const cy    = tileH / 2;

            // Gradient endpoints: run along the angle direction, centered in the tile.
            // Use tileH for the Y component so gradient geometry is consistent with the taller tile.
            const gx1 = (cx - cosa * tileW / 2).toFixed(2);
            const gy1 = (cy - sina * tileH / 2).toFixed(2);
            const gx2 = (cx + cosa * tileW / 2).toFixed(2);
            const gy2 = (cy + sina * tileH / 2).toFixed(2);

            // Animation sweeps the tile in the gradient direction.
            // toY uses tileH for consistency with the updated gradient geometry.
            const toXNum = cosa * tileW;
            const toYNum = sina * tileH;
            const durNum = spd > 0 ? tileW / spd : null;

            let animEl = '';
            if (durNum) {
                const phase = (Date.now() / 1000) % durNum;
                const fromX = -(toXNum * phase / durNum);
                const fromY = -(toYNum * phase / durNum);
                const endX  = fromX + toXNum;
                const endY  = fromY + toYNum;
                animEl = `<animateTransform attributeName="patternTransform" type="translate"
                    from="${fromX.toFixed(3)} ${fromY.toFixed(3)}" to="${endX.toFixed(3)} ${endY.toFixed(3)}" dur="${durNum.toFixed(2)}s" repeatCount="indefinite"/>`;
            }

            const gid = `stex-sg-${id}`;
            const g0 = (0.0).toFixed(3);
            const g1 = (hw * 0.4).toFixed(3);
            const g2 = (hw * 0.6).toFixed(3);
            const g3 = hw.toFixed(3);

            return `<linearGradient id="${gid}"
                x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}"
                gradientUnits="userSpaceOnUse">
                <stop offset="${g0}" stop-color="${color}" stop-opacity="0"/>
                <stop offset="${g1}" stop-color="${color}" stop-opacity="1"/>
                <stop offset="${g2}" stop-color="${color}" stop-opacity="1"/>
                <stop offset="${g3}" stop-color="${color}" stop-opacity="0"/>
                <stop offset="1"    stop-color="${color}" stop-opacity="0"/>
            </linearGradient>
            <pattern id="stex-pattern-${id}" x="0" y="0" width="${tileW}" height="${tileH}" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="${tileW}" height="${tileH}" fill="url(#${gid})"/>
                ${animEl}
            </pattern>`;
        },
        getFillRef(id) { return `url(#stex-pattern-${id})`; }
    },

    /**
     * Flow — directional liquid streaming: horizontally-elongated turbulence warped by
     * a second evolving displacement layer. The warp animation creates visible undulating
     * current streaks, clearly distinct from the organic blobs of Fluid.
     */
    'flow': {
        name: 'Flow',
        description: 'Directional streaming currents — elongated streaks with evolving displacement warp',
        defaults: {
            color: 'rgba(0,200,255,0.7)',
            base_frequency: 0.012,
            wave_scale: 8,
            scroll_speed_x: 50,
            scroll_speed_y: 0,
            evolution_speed: 0    // 0 = backward-compatible static warp
        },
        createDefs(id, cfg, ctx) {
            const W     = ctx?.width  ?? 200;
            const H     = ctx?.height ?? 60;
            const bf    = cfg.base_frequency ?? 0.012;
            const scale = cfg.wave_scale     ?? 8;
            const sx    = cfg.scroll_speed_x ?? 50;
            const sy    = cfg.scroll_speed_y ?? 0;
            const color = cfg.color          ?? 'rgba(0,200,255,0.7)';

            // Extreme x-bias: bfY = bf/6 → wide horizontal streaks (streaming-current look)
            const bfX = bf.toFixed(5);
            const bfY = (bf / 6).toFixed(5);

            // Warp turbulence base frequency
            const wf = (bf * 0.5).toFixed(5);

            // evolution_speed: 0 = static warp (default), 1.0 = turbulent flow.
            // scaleMin: scale reduced by up to 60% at max evo → gentle low point in undulation.
            // scaleMax: scale increased by up to 80% at max evo → turbulent peak in undulation.
            const evo = Math.max(0, Math.min(1, cfg.evolution_speed ?? 0));
            const scaleMin = Math.max(1, scale * (1 - evo * 0.6));   // 60% reduction → gentle undulation
            const scaleMax = scale * (1 + evo * 0.8);                // 80% increase → turbulent peaks
            // Duration: 12s at evo→0 (slow), 4s at evo=1 (fast). Floor at 1s for safety.
            const evoDur = evo > 0 ? Math.max(1, 12 - evo * 8).toFixed(1) : null;

            // Animate displacement scale when evolution is active (undulating current)
            const scaleAnim = evoDur ? `<animate attributeName="scale"
                    values="${scale};${scaleMax.toFixed(1)};${scale};${scaleMin.toFixed(1)};${scale}"
                    dur="${evoDur}s" calcMode="spline"
                    keySplines="0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1"
                    repeatCount="indefinite"/>` : '';

            // Optionally evolve warp baseFrequency (longer cycle so it feels independent)
            const wfNum = parseFloat(wf);
            const warpEvoAnim = evoDur ? `<animate attributeName="baseFrequency"
                    values="${wf};${(wfNum * 1.3).toFixed(5)};${wf};${(wfNum * 0.7).toFixed(5)};${wf}"
                    dur="25s" calcMode="spline"
                    keySplines="0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1"
                    repeatCount="indefinite"/>` : '';

            // All primitives in one block; feDisplacementMap is the final output.
            // feFlood+feComposite for color so CSS vars / theme tokens work natively.
            const allPrim = `
                <feTurbulence type="turbulence" baseFrequency="${bfX} ${bfY}"
                    numOctaves="2" seed="13" stitchTiles="stitch" result="streaks"/>
                <feColorMatrix in="streaks" type="matrix"
                    values="0 0 0 0 0
                            0 0 0 0 0
                            0 0 0 0 0
                            0 1.8 0 0 -0.3" result="mask"/>
                <feFlood flood-color="${color}" flood-opacity="1" result="flood"/>
                <feComposite in="flood" in2="mask" operator="in" result="colored"/>
                <feTurbulence type="fractalNoise" baseFrequency="${wf}" numOctaves="2"
                    seed="77" stitchTiles="stitch" result="warp">${warpEvoAnim ? '\n                    ' + warpEvoAnim + '\n                ' : ''}
                </feTurbulence>
                <feDisplacementMap in="colored" in2="warp"
                    scale="${scale}" xChannelSelector="R" yChannelSelector="G">${scaleAnim ? '\n                    ' + scaleAnim + '\n                ' : ''}
                </feDisplacementMap>`;

            return _turbPattern(id, allPrim, '', W, H, sx, sy);
        },
        getFillRef(id) { return `url(#stex-pattern-${id})`; }
    },

    /**
     * Level — fill-bar that rises from bottom (or left), with optional animated wavy top edge.
     * Use state-based config.fill_pct (0–100) to set the fill level.
     * The fill_pct is resolved before createDefs is called via _resolveShapeTextureConfig.
     * wave_height > 0 enables an animated Bezier-sine wave on the leading edge.
     */
    'level': {
        name: 'Level',
        description: 'Animated level-indicator fill bar with optional wavy top edge',
        defaults: {
            color: 'rgba(0,200,100,0.7)',
            fill_pct: 50,
            direction: 'up',
            edge_glow: true,
            wave_height: 4,
            wave_speed: 20,
            wave_count: 4
        },
        createDefs(id, cfg, ctx) {
            const W          = ctx?.width  ?? 200;
            const H          = ctx?.height ?? 60;
            const color      = cfg.color        ?? 'rgba(0,200,100,0.7)';
            // Use color directly in SVG fill — supports rgba(), hex, CSS vars, theme tokens.
            const pct        = Math.max(0, Math.min(100, Number(cfg.fill_pct ?? 50)));
            const dir        = cfg.direction    ?? 'up';
            const glow       = cfg.edge_glow    !== false;
            const waveAmp    = Math.max(0, Number(cfg.wave_height ?? 4));
            const waveSpeed  = cfg.wave_speed   ?? 20;
            const waveCount  = Math.max(1, Math.round(cfg.wave_count ?? 4));

            // ── Right-fill (no wave support) ──────────────────────────────────
            if (dir === 'right') {
                const fillW = (W * pct / 100).toFixed(1);
                const glowRect = glow
                    ? `<rect x="${fillW}" y="0" width="3" height="${H}" fill="white" opacity="0.5"/>`
                    : '';
                return `<pattern id="stex-pattern-${id}" x="0" y="0" width="${W}" height="${H}" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="${fillW}" height="${H}" fill="${color}"/>
                    ${glowRect}
                </pattern>`;
            }

            // ── Upward fill ────────────────────────────────────────────────────
            const fillY = H * (1 - pct / 100);

            // Flat fill (no wave or zero amplitude)
            if (waveAmp === 0) {
                const glowLine = glow
                    ? `<rect x="0" y="${(fillY - 2).toFixed(1)}" width="${W}" height="3" fill="white" opacity="0.5"/>`
                    : '';
                return `<pattern id="stex-pattern-${id}" x="0" y="0" width="${W}" height="${H}" patternUnits="userSpaceOnUse">
                    <rect x="0" y="${fillY.toFixed(1)}" width="${W}" height="${(H - fillY).toFixed(1)}" fill="${color}"/>
                    ${glowLine}
                </pattern>`;
            }

            // Wavy fill: one pattern tile = one wavelength, scrolling horizontally.
            // Cubic Bezier approximates a full sine period (c = 0.3642 * half-wavelength).
            const wl   = W / waveCount;                      // wavelength in px
            const c    = (wl * 0.3642 * 0.5).toFixed(2);    // Bezier control offset
            const hw   = (wl / 2).toFixed(2);
            const fy   = fillY.toFixed(2);
            const fyMa = (fillY - waveAmp).toFixed(2);       // wave crest (up = smaller Y)
            const fyPa = (fillY + waveAmp).toFixed(2);       // wave trough

            const wavePath = `M 0 ${fy}
                C ${c} ${fyMa} ${(wl*0.5 - parseFloat(c)).toFixed(2)} ${fyMa} ${hw} ${fy}
                C ${(parseFloat(hw)+parseFloat(c)).toFixed(2)} ${fyPa} ${(wl - parseFloat(c)).toFixed(2)} ${fyPa} ${wl.toFixed(2)} ${fy}
                L ${wl.toFixed(2)} ${H}
                L 0 ${H}
                Z`;

            const durNum = Math.abs(waveSpeed) > 0 ? wl / Math.abs(waveSpeed) : null;
            const toXNum = waveSpeed >= 0 ? wl : -wl;
            let waveAnim = '';
            if (durNum) {
                const phase = (Date.now() / 1000) % durNum;
                const fromX = -(toXNum * phase / durNum);
                const endX  = fromX + toXNum;
                waveAnim = `<animateTransform attributeName="patternTransform" type="translate"
                        from="${fromX.toFixed(3)} 0" to="${endX.toFixed(3)} 0" dur="${durNum.toFixed(2)}s" repeatCount="indefinite"/>`;
            }

            const glowOpacity = glow ? '0.45' : '0';
            const glowPath = `M 0 ${fy}
                C ${c} ${fyMa} ${(wl*0.5 - parseFloat(c)).toFixed(2)} ${fyMa} ${hw} ${fy}
                C ${(parseFloat(hw)+parseFloat(c)).toFixed(2)} ${fyPa} ${(wl - parseFloat(c)).toFixed(2)} ${fyPa} ${wl.toFixed(2)} ${fy}
                L ${wl.toFixed(2)} ${(fillY + 3).toFixed(2)}
                C ${(wl - parseFloat(c)).toFixed(2)} ${(parseFloat(fyPa)+3).toFixed(2)} ${(parseFloat(hw)+parseFloat(c)).toFixed(2)} ${(parseFloat(fyPa)+3).toFixed(2)} ${hw} ${(fillY+3).toFixed(2)}
                C ${(wl*0.5 - parseFloat(c)).toFixed(2)} ${(parseFloat(fyMa)+3).toFixed(2)} ${c} ${(parseFloat(fyMa)+3).toFixed(2)} 0 ${(fillY+3).toFixed(2)}
                Z`;

            return `<pattern id="stex-pattern-${id}" x="0" y="0" width="${wl.toFixed(2)}" height="${H}" patternUnits="userSpaceOnUse">
                <path d="${wavePath}" fill="${color}"/>
                ${glow ? `<path d="${glowPath}" fill="white" opacity="${glowOpacity}"/>` : ''}
                ${waveAnim}
            </pattern>`;
        },
        getFillRef(id) { return `url(#stex-pattern-${id})`; }
    },

    /**
     * Pulse — radial glow that breathes in/out, good for alert indicators.
     * min_size controls the smallest the glow shrinks to (fraction of max radius).
     */
    'pulse': {
        name: 'Pulse',
        description: 'Breathing radial glow — attention / alert indicator',
        defaults: {
            color: 'rgba(255,80,0,0.8)',
            speed: 1.2,
            radius: 0.7,
            min_size: 0.15
        },
        createDefs(id, cfg, ctx) {
            const W       = ctx?.width  ?? 200;
            const H       = ctx?.height ?? 60;
            const color   = cfg.color    ?? 'rgba(255,80,0,0.8)';
            const spd     = cfg.speed    ?? 1.2;
            const rad     = Math.max(0.1, Math.min(1, cfg.radius   ?? 0.7));
            const minSize = Math.max(0.0, Math.min(0.99, cfg.min_size ?? 0.15));

            // Use color directly in SVG stop-color / fill — supports rgba(), CSS vars, tokens.
            const cx   = (W / 2).toFixed(1);
            const cy   = (H / 2).toFixed(1);
            const maxR = (Math.sqrt(W*W + H*H) / 2 * rad).toFixed(1);
            const minR = (parseFloat(maxR) * minSize).toFixed(1);
            const dur  = spd > 0 ? (1 / spd).toFixed(2) : '1';
            const gid  = `stex-pg-${id}`;

            return `<radialGradient id="${gid}" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stop-color="${color}" stop-opacity="1"/>
                <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
            </radialGradient>
            <pattern id="stex-pattern-${id}" x="0" y="0" width="${W}" height="${H}" patternUnits="userSpaceOnUse">
                <ellipse cx="${cx}" cy="${cy}" rx="${maxR}" ry="${maxR}" fill="url(#${gid})">
                    <animate attributeName="rx" values="${maxR};${minR};${maxR}"
                        dur="${dur}s" repeatCount="indefinite"/>
                    <animate attributeName="ry" values="${maxR};${minR};${maxR}"
                        dur="${dur}s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="1;0.3;1"
                        dur="${dur}s" repeatCount="indefinite"/>
                </ellipse>
            </pattern>`;
        },
        getFillRef(id) { return `url(#stex-pattern-${id})`; }
    },

    /**
     * Scanlines — classic CRT scan-line overlay.
     * direction: 'horizontal' (default) — lines run left/right, scroll vertically.
     * direction: 'vertical' — lines run top/bottom, scroll horizontally.
     * Negative scroll speeds reverse direction.
     */
    'scanlines': {
        name: 'Scanlines',
        description: 'CRT-style scan-line overlay — horizontal or vertical',
        defaults: {
            color: 'rgba(0,0,0,0.25)',
            line_spacing: 4,
            line_width: 1.5,
            direction: 'horizontal',
            scroll_speed_y: 0,
            scroll_speed_x: 0
        },
        createDefs(id, cfg) {
            const spacing = cfg.line_spacing   ?? 4;
            const lw      = cfg.line_width      ?? 1.5;
            const color   = cfg.color           ?? 'rgba(0,0,0,0.25)';
            const dir     = cfg.direction       ?? 'horizontal';
            const sy      = cfg.scroll_speed_y  ?? 0;
            const sx      = cfg.scroll_speed_x  ?? 0;

            let lineEl, animEl;
            if (dir === 'vertical') {
                // Lines run top-to-bottom, scrolling horizontally
                lineEl = `<line x1="${lw/2}" y1="0" x2="${lw/2}" y2="${spacing}"
                    stroke="${color}" stroke-width="${lw}"/>`;
                animEl = sx !== 0 ? _scrollAnim(sx, 0, spacing, spacing) : '';
            } else {
                // Default: horizontal lines scrolling vertically
                lineEl = `<line x1="0" y1="${lw/2}" x2="${spacing}" y2="${lw/2}"
                    stroke="${color}" stroke-width="${lw}"/>`;
                animEl = sy !== 0 ? _scrollAnim(0, sy, spacing, spacing) : '';
            }

            return `<pattern id="stex-pattern-${id}" x="0" y="0" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">
                ${lineEl}
                ${animEl}
            </pattern>`;
        },
        getFillRef(id) { return `url(#stex-pattern-${id})`; }
    },

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
