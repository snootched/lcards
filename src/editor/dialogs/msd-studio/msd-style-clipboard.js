/**
 * MSD Studio style clipboard: copy the look of a label (with its leader line)
 * or of a line, and paste it onto other labels or lines.
 *
 * Pure: no DOM, no dialog state. A style is everything about how an overlay
 * looks, never where it is or what it is wired to: ids, positions, ends,
 * sides, waypoints, entities and actions are always the target's own.
 *
 * Labels are mirrored to the side they face: a label whose line leaves its
 * left takes a copied right-side bracket bar on its left, its text aligned
 * left, its line leaving the left end of the bar.
 *
 * @module editor/dialogs/msd-studio/msd-style-clipboard
 */

import { isLabelOverlay, labelBoxWidth } from './msd-quick-label.js';

/** The line keys that are style (copied when set, removed when the source has none). */
export const LINE_STYLE_KEYS = [
    'style', 'anchor_gap', 'attach_gap', 'route', 'route_hint', 'route_hint_last', 'clearance',
    'corner_style', 'corner_radius', 'corner_radius_mode', 'corner_room_weight', 'corner_angle',
    'stub_length', 'smoothing_mode', 'smoothing_iterations'
];

/** Card keys of a label that are style (text is handled field by field, content kept). */
const LABEL_CARD_STYLE_KEYS = ['preset', 'style', 'min_height'];

/** @param {any} v */
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

/**
 * Swap left and right in object keys and in alignment strings.
 * @param {any} v
 * @param {string} [key]
 * @returns {any}
 */
function mirror(v, key = '') {
    if (Array.isArray(v)) return v.map((x) => mirror(x));
    if (v && typeof v === 'object') {
        /** @type {Record<string, any>} */
        const out = {};
        for (const [k, x] of Object.entries(v)) out[swapLR(k)] = mirror(x, k);
        return out;
    }
    if (typeof v === 'string' && /(^|_)(position|align|text_align|anchor_side)$/.test(key)) return swapLR(v);
    return v;
}

/** @param {string} s */
function swapLR(s) {
    return s.replace(/left|right/g, (m) => (m === 'left' ? 'right' : 'left'));
}

/**
 * The lines leaving a label (its leaders).
 * @param {string} labelId
 * @param {any[]} overlays
 */
export function leaderLinesOf(labelId, overlays) {
    return (overlays || []).filter((o) => o?.type === 'line' && o.anchor === labelId);
}

/**
 * The side a label faces (its line leaves that side): from its leader's
 * anchor_side, else its attachment, else its text alignment.
 * @param {any} label
 * @param {any} [line]
 * @returns {'left' | 'right'}
 */
export function labelSide(label, line) {
    const fromLine = typeof line?.anchor_side === 'string' ? line.anchor_side.match(/left|right/)?.[0] : null;
    if (fromLine) return /** @type {'left' | 'right'} */ (fromLine);
    if (label?.attachment === 'left' || label?.attachment === 'right') return label.attachment;
    const pos = label?.card?.text?.label?.position;
    return typeof pos === 'string' && pos.includes('left') ? 'left' : 'right';
}

/**
 * Copy an overlay's style: a label (with its first leader line) or a line.
 * Returns null for anything else.
 * @param {any} overlay
 * @param {any[]} overlays
 * @returns {{ kind: 'label' | 'line', sourceId: string, side: 'left' | 'right' | null, label: any, line: any } | null}
 */
export function copyStyle(overlay, overlays) {
    if (isLabelOverlay(overlay)) {
        const leader = leaderLinesOf(overlay.id, overlays)[0] || null;
        const card = overlay.card;
        /** @type {Record<string, any>} */
        const labelStyle = {};
        for (const k of LABEL_CARD_STYLE_KEYS) if (card[k] !== undefined) labelStyle[k] = clone(card[k]);
        /** @type {Record<string, any>} */
        const text = {};
        for (const [field, value] of Object.entries(card.text || {})) {
            if (!value || typeof value !== 'object') continue;
            const { content, ...rest } = value;
            text[field] = clone(rest);
        }
        labelStyle.text = text;
        labelStyle.height = Array.isArray(overlay.size) ? overlay.size[1] : undefined;
        return {
            kind: 'label',
            sourceId: overlay.id,
            side: labelSide(overlay, leader),
            label: labelStyle,
            line: leader ? lineStyleOf(leader) : null
        };
    }
    if (overlay?.type === 'line') {
        return { kind: 'line', sourceId: overlay.id, side: null, label: null, line: lineStyleOf(overlay) };
    }
    return null;
}

/**
 * A line's style keys, plus the vertical part of its anchor_side (a bracket
 * leaves the top or bottom end of its bar).
 * @param {any} line
 */
function lineStyleOf(line) {
    /** @type {Record<string, any>} */
    const out = {};
    for (const k of LINE_STYLE_KEYS) if (line[k] !== undefined) out[k] = clone(line[k]);
    const v = typeof line.anchor_side === 'string' ? line.anchor_side.match(/^(top|bottom)-/)?.[1] : null;
    out._end = v || null;
    return out;
}

/**
 * Apply a copied line style to a line: style keys replaced (keys the source
 * did not set are removed); ends, sides and waypoints kept. For a label's
 * leader, `leader` gives the label's side and whether the part is above it,
 * so the line leaves the matching side (and bar end).
 * @param {any} line
 * @param {Record<string, any>} lineStyle
 * @param {{ side: 'left' | 'right', partAbove: boolean | null } | null} [leader]
 */
export function applyLineStyle(line, lineStyle, leader = null) {
    const out = { ...line };
    for (const k of LINE_STYLE_KEYS) delete out[k];
    for (const k of LINE_STYLE_KEYS) if (lineStyle[k] !== undefined) out[k] = clone(lineStyle[k]);
    if (leader) {
        const end = lineStyle._end
            ? (leader.partAbove === null ? lineStyle._end : (leader.partAbove ? 'top' : 'bottom'))
            : null;
        out.anchor_side = end ? `${end}-${leader.side}` : leader.side;
    }
    return out;
}

/**
 * Apply a copied label style to a label, mirrored to its side; its text,
 * position and actions stay. The box is resized to its text when the font
 * size changes.
 * @param {any} label
 * @param {Record<string, any>} labelStyle
 * @param {'left' | 'right' | null} fromSide - the source label's side
 * @param {'left' | 'right'} toSide
 */
export function applyLabelStyle(label, labelStyle, fromSide, toSide) {
    const flip = fromSide && fromSide !== toSide;
    const src = flip ? mirror(labelStyle) : clone(labelStyle);
    const card = { ...label.card };
    for (const k of LABEL_CARD_STYLE_KEYS) {
        if (src[k] !== undefined) card[k] = src[k];
        else delete card[k];
    }
    /** @type {Record<string, any>} */
    const text = { ...(label.card?.text || {}) };
    for (const [field, value] of Object.entries(src.text || {})) {
        const content = label.card?.text?.[field]?.content;
        text[field] = content !== undefined ? { ...value, content } : value;
    }
    card.text = text;

    const out = { ...label, card };
    const fs = Number(text.label?.font_size);
    const oldFs = Number(label.card?.text?.label?.font_size);
    if (Array.isArray(label.size) && (src.height || (fs > 0 && fs !== oldFs))) {
        const bw = card.style?.border?.width;
        const bracket = !!(bw && typeof bw === 'object' && (bw.left || bw.right));
        const width = fs > 0 && fs !== oldFs ? labelBoxWidth(String(text.label?.content ?? ''), fs, bracket) : label.size[0];
        out.size = [width, src.height || label.size[1]];
    }
    return out;
}

/**
 * Paste a copied style onto overlays by id. A label clip restyles labels
 * (and each label's own leaders) and lines; a line clip restyles lines and
 * the leaders of labels. Returns a new overlays array.
 * @param {any[]} overlays
 * @param {string[]} targetIds
 * @param {NonNullable<ReturnType<typeof copyStyle>>} clip
 * @param {(target: any) => [number, number] | null} [pointOf] - where a line's attach_to is (for a bracket's bar end)
 */
export function pasteStyle(overlays, targetIds, clip, pointOf = () => null) {
    const list = [...(overlays || [])];
    const byId = new Map(list.map((o, i) => [o?.id, i]));
    const ids = new Set(targetIds);

    for (const id of ids) {
        const i = byId.get(id);
        if (i === undefined) continue;
        const o = list[i];
        if (isLabelOverlay(o)) {
            const leaders = leaderLinesOf(o.id, list);
            const side = labelSide(o, leaders[0]);
            if (clip.kind === 'label' && clip.label) {
                list[i] = applyLabelStyle(o, clip.label, clip.side, side);
            }
            if (clip.line) {
                for (const ln of leaders) {
                    if (ids.has(ln.id)) continue; // restyled on its own below
                    const j = /** @type {number} */ (byId.get(ln.id));
                    list[j] = applyLineStyle(list[j], clip.line, { side, partAbove: partAbove(list[i], ln, pointOf) });
                }
            }
        } else if (o?.type === 'line' && clip.line) {
            const label = list[byId.get(o.anchor) ?? -1];
            const leader = isLabelOverlay(label)
                ? { side: labelSide(label, o), partAbove: partAbove(label, o, pointOf) }
                : null;
            list[i] = applyLineStyle(o, clip.line, leader);
        }
    }
    return list;
}

/**
 * Whether a leader's part is above its label's middle (null when unknown).
 * @param {any} label
 * @param {any} line
 * @param {(target: any) => [number, number] | null} pointOf
 */
function partAbove(label, line, pointOf) {
    const p = Array.isArray(line.attach_to) ? line.attach_to : pointOf(line.attach_to);
    const ly = Array.isArray(label.position) ? Number(label.position[1]) : null;
    if (!p || ly === null) return null;
    // A level bracket's end sits on the part's height: the box below it is still "part above".
    return Number(p[1]) <= ly;
}
