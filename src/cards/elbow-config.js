/**
 * Elbow card config and geometry helpers (pure: no DOM, no core), shared with the
 * node tests.
 *
 * @module cards/elbow-config
 */

/** @typedef {{ top: number, right: number, bottom: number, left: number }} Insets */

/**
 * Parse a frame length as px: a number stays, a numeric string ("24", "24px") is
 * parsed, anything else is 0. `toPx` callers measure CSS lengths before this.
 * @param {unknown} value
 * @returns {number}
 */
/**
 * Default inner radius of a segmented elbow's inner segment when both its curves
 * are left to default. Its outer arc is then concentric with the outer segment's
 * inner arc; the classic "half the outer radius" for the inner arc puts that arc
 * round a different centre, so a thin band swells at the corner. `R - bar` keeps
 * the band one even width round the corner whenever the curve is bigger than the bar;
 * otherwise (the classic thick LCARS elbow) the inner curve is half the outer.
 * @param {number} outerRadius - the inner segment's outer radius
 * @param {number} barWidth - the inner segment's vertical bar width, px
 * @param {number} barHeight - the inner segment's horizontal bar height, px
 * @returns {number}
 */
export function concentricInnerCurve(outerRadius, barWidth, barHeight) {
  const w = Number(barWidth), h = Number(barHeight);
  // Sizes not known as px yet (a CSS length still to be measured): the classic half
  if (!Number.isFinite(outerRadius) || !Number.isFinite(w) || !Number.isFinite(h)) return outerRadius / 2;
  const bar = Math.max(w, h);
  return outerRadius > bar ? outerRadius - bar : outerRadius / 2;
}

export function parseLength(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

const FRAME_SIDES = ['top', 'bottom', 'left', 'right'];
const FRAME_CORNERS = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];

/**
 * Every length a frame config can hold (outer ring and inner ring), as raw values.
 * @param {any} fc - elbow.frame
 * @returns {unknown[]}
 */
export function frameLengthValues(fc) {
    const out = [];
    const ring = (r) => {
        if (!r || typeof r !== 'object') return;
        out.push(r.bar_width, r.bar_height, r.outer_curve, r.inner_curve);
        for (const side of FRAME_SIDES) {
            const s = r[side];
            if (s) out.push(s.bar_width, s.bar_height, s.thickness);
        }
        for (const corner of FRAME_CORNERS) {
            const c = r.corners?.[corner];
            if (c) out.push(c.outer_curve, c.inner_curve);
        }
    };
    ring(fc);
    out.push(fc?.segments?.gap);
    ring(fc?.segments?.inner_frame);
    return out.filter(v => v !== undefined && v !== null);
}

/**
 * Parse `elbow.frame` into the frame geometry config: per-side thickness and
 * enabled flag, per-corner outer/inner radius, and for `style: segmented` the
 * inner ring and gap. Every length goes through `toPx` (numbers stay, CSS lengths
 * are measured by the card), so defaults derived from other lengths (outer curve
 * = half of bar_width, ...) follow the measured value.
 *
 * @param {any} fc - elbow.frame (may be undefined)
 * @param {string} style - 'simple' | 'segmented'
 * @param {(value: unknown) => number} [toPx]
 * @returns {{ sides: Record<string, { thickness: number, enabled: boolean }>, corners: Record<string, { outer: number, inner: number }>, segments?: { gap: number, inner: any } }}
 */
export function parseFrameConfig(fc, style, toPx = parseLength) {
    fc = fc || {};
    const ring = (r, defaultBarWidth) => {
        const defBW = toPx(r.bar_width ?? defaultBarWidth);
        const defBH = r.bar_height !== undefined ? toPx(r.bar_height) : defBW;
        const defOC = r.outer_curve !== undefined ? toPx(r.outer_curve) : Math.round(defBW / 2);
        const side = (key) => {
            const raw = r[key] || {};
            // top/bottom default to bar_height, left/right to bar_width
            const fallback = (key === 'top' || key === 'bottom') ? defBH : defBW;
            const value = raw.bar_width ?? raw.bar_height ?? raw.thickness;
            return { thickness: value !== undefined ? toPx(value) : fallback, enabled: raw.enabled !== false };
        };
        const sides = Object.fromEntries(FRAME_SIDES.map(k => [k, side(k)]));
        const corner = (key) => {
            const c = r.corners?.[key] || {};
            const [v, h] = /** @type {[string, string]} */ (key.split('_')); // top_left -> top, left
            // A corner beside an open side is a bar's end, not a turn: square unless set
            // on the corner itself (2026-11-11; it used to take the frame's curve).
            const open = !sides[v].enabled || !sides[h].enabled;
            const outer = c.outer_curve !== undefined ? toPx(c.outer_curve) : (open ? 0 : defOC);
            // Unset inner curve: concentric with the outer, so a thin bar keeps one width
            // round the corner (thick bars keep the classic half of the outer radius).
            const inner = c.inner_curve !== undefined ? toPx(c.inner_curve)
                : r.inner_curve !== undefined && !(open && c.outer_curve === undefined) ? toPx(r.inner_curve)
                : open && c.outer_curve === undefined ? 0
                : Math.round(concentricInnerCurve(outer, sides[v].thickness, sides[h].thickness));
            return { outer, inner };
        };
        return {
            sides,
            corners: Object.fromEntries(FRAME_CORNERS.map(k => [k, corner(k)])),
        };
    };

    /** @type {any} */
    const frame = ring(fc, 90);
    // No frame-level or per-side colour: the outer ring is painted with
    // elbow.segment.color, the inner ring with segments.inner_frame.color.
    if (style === 'segmented') {
        const seg = fc.segments || {};
        const inner = seg.inner_frame || {};
        frame.segments = {
            gap: toPx(seg.gap ?? 4),
            inner: { ...ring(inner, 28), color: inner.color ?? null },
        };
    }
    return frame;
}

/**
 * The space each elbow's arms take from the card edges, i.e. where its open
 * content area starts: what `background_animation.inset: auto` and the symbiont
 * container use.
 *
 * - frame: every enabled side (plus gap and the inner ring when segmented)
 * - bar types (`bar-*`): the whole card is the bar, so nothing
 * - header/footer: the horizontal bar's height on that edge
 * - left/right sides: the vertical bar's width on that side; `contained` both
 *   sides, `open` neither
 *
 * @param {any} g - elbow geometry (simple: horizontal/vertical; segmented: outer/inner/gap; frame: sides/inner/gap)
 * @param {{ type?: string, position?: string, side?: string }} layout - the elbow type and its component layout
 * @returns {Insets}
 */
export function elbowContentInsets(g, layout = {}) {
    const insets = { top: 0, right: 0, bottom: 0, left: 0 };
    if (!g) return insets;

    if (g.type === 'frame') {
        const t = (sides, k) => (sides?.[k]?.enabled ? sides[k].thickness : 0);
        for (const k of /** @type {const} */ (['top', 'right', 'bottom', 'left'])) {
            insets[k] = t(g.sides, k) + (g.inner ? (g.gap ?? 0) + t(g.inner.sides, k) : 0);
        }
        return insets;
    }

    if (String(layout.type ?? g.type ?? '').startsWith('bar-')) return insets;

    // horizontal = vertical-bar (sidebar) width, vertical = horizontal-bar height
    const sideBar = g.inner ? (g.outer.horizontal + (g.gap ?? 0) + g.inner.horizontal) : (g.horizontal ?? 0);
    const capBar = g.inner ? (g.outer.vertical + (g.gap ?? 0) + g.inner.vertical) : (g.vertical ?? 0);

    if (layout.position === 'footer') insets.bottom = capBar;
    else insets.top = capBar;

    const side = layout.side ?? 'left';
    if (side === 'left' || side === 'contained') insets.left = sideBar;
    if (side === 'right' || side === 'contained') insets.right = sideBar;
    return insets;
}

/**
 * Move an SVG path by (dx, dy). Handles the absolute commands (M L H V C S Q T A Z);
 * relative commands after the first are left as they are (they move with it).
 * @param {string} d
 * @param {number} dx
 * @param {number} dy
 * @returns {string}
 */
export function translatePath(d, dx, dy) {
    if (!d || (!dx && !dy)) return d || '';
    const tokens = String(d).match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
    /** @type {string[]} */
    const out = [];
    let cmd = '';
    let i = 0;
    /** pairs of x,y per argument group, by command */
    const ARGS = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };
    let first = true;
    while (i < tokens.length) {
        const tok = tokens[i];
        if (/[a-zA-Z]/.test(tok)) {
            cmd = tok;
            out.push(tok);
            i++;
            if (cmd.toUpperCase() === 'Z') continue;
            // a leading relative moveto is absolute for its first pair
            if (first && cmd === 'm') cmd = 'M*';
            first = false;
            continue;
        }
        const upper = cmd === 'M*' ? 'M' : cmd.toUpperCase();
        const n = ARGS[upper] ?? 0;
        if (!n) { out.push(tok); i++; continue; }
        const group = tokens.slice(i, i + n).map(Number);
        i += n;
        const absolute = cmd === upper || cmd === 'M*';
        if (absolute) {
            if (upper === 'H') group[0] += dx;
            else if (upper === 'V') group[0] += dy;
            else if (upper === 'A') { group[5] += dx; group[6] += dy; }
            else for (let k = 0; k < group.length; k += 2) { group[k] += dx; group[k + 1] += dy; }
        }
        // later pairs after a leading 'm' are relative linetos
        if (cmd === 'M*') cmd = 'l';
        out.push(group.join(' '));
    }
    return out.join(' ');
}

/** The keys a segment can carry its own actions under. */
export const SEGMENT_ACTION_KEYS = /** @type {const} */ (['tap_action', 'hold_action', 'double_tap_action']);

/**
 * The actions a segmented elbow's segment runs and the entity they act on: each
 * of the segment's own actions, else the card's; the segment's `entity_id`, else
 * the card's entity.
 * @param {any} segment - validated outer_segment / inner_segment
 * @param {any} card - the card config (tap_action, hold_action, double_tap_action, entity)
 * @param {any} [defaultTap] - the card's default tap action when it sets none
 * @returns {{ actions: { tap_action?: any, hold_action?: any, double_tap_action?: any }, entity: string | undefined }}
 */
export function segmentActions(segment, card, defaultTap) {
    const actions = {
        tap_action: segment?.tap_action ?? card?.tap_action ?? defaultTap,
        hold_action: segment?.hold_action ?? card?.hold_action,
        double_tap_action: segment?.double_tap_action ?? card?.double_tap_action,
    };
    return { actions, entity: segment?.entity_id || card?.entity || undefined };
}

/** Does this segment set anything that needs its own action handler? */
export function segmentOwnsInput(segment) {
    return !!segment && (!!segment.entity_id || SEGMENT_ACTION_KEYS.some(k => segment[k]));
}

/**
 * Which HA-LCARS helpers an elbow's sizes are bound to (`theme`, as normalised
 * by the card's config validation): vertical =
 * input_number.lcars_vertical (bar_width), horizontal = lcars_horizontal
 * (bar_height, which defaults to bar_width), angle = lcars_elbow_angle.
 * Looks at the simple segment, or both segments of a segmented elbow.
 * @param {any} elbowConfig - validated elbow config
 * @returns {{ vertical: boolean, horizontal: boolean, angle: boolean }}
 */
export function themeBindings(elbowConfig) {
    const segs = elbowConfig?.style === 'segmented'
        ? [elbowConfig.segments?.outer_segment, elbowConfig.segments?.inner_segment]
        : [elbowConfig?.segment];
    const isTheme = (v, entity) => v === 'theme' || v === entity;
    const out = { vertical: false, horizontal: false, angle: false };
    for (const s of segs) {
        if (!s) continue;
        if (isTheme(s.bar_width, 'input_number.lcars_vertical')) out.vertical = true;
        // bar_height defaults to bar_width, keyword and all (as in the simple style)
        if (isTheme(s.bar_height ?? s.bar_width, 'input_number.lcars_horizontal')) out.horizontal = true;
        if (isTheme(s.diagonal_angle, 'input_number.lcars_elbow_angle')) out.angle = true;
    }
    return out;
}

/**
 * Parse a segmented elbow's bar size: `theme` (or the helper's entity id) stays
 * `theme`, CSS lengths stay strings, anything else is px.
 * @param {unknown} value
 * @param {string} helper - the bound helper's entity id
 * @param {(v: unknown) => boolean} isCss
 * @returns {number | string | undefined}
 */
export function parseSegmentBar(value, helper, isCss) {
    if (value === undefined || value === null) return undefined;
    if (value === 'theme' || value === helper) return 'theme';
    if (isCss(value)) return /** @type {string} */ (value);
    return parseLength(value);
}
