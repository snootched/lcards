/**
 * MSD Studio "Quick label": a label control plus its leader line in one go,
 * in one of the Labelled schematic pattern's leader styles
 * (doc/getting-started/lcars-patterns.md#labelled-schematic).
 *
 * Pure: no DOM, no dialog state. The Studio supplies the clicked part, the
 * clicked label point and how many view-box units one rendered pixel is;
 * this module returns the two overlay configs.
 *
 * Sizes follow the pattern's rules (labels 13 px, classic lines 2 px with
 * the default sweep, Picard lines 2.5 px with a 10 px bend, a bracket's
 * angled stub 64 px), held as a share of the drawing: px x view_box width /
 * the size's reference width (QUICK_LABEL_SIZES).
 *
 * @module editor/dialogs/msd-studio/msd-quick-label
 */

/** Structure tone for lines that are not a bracket (the pattern's line colour). */
const STRUCTURE_LINE_COLOR = 'var(--lcars-card-top-color, var(--lcards-gray-medium))';
const LABEL_COLOR = 'theme:colors.ui.secondary';

/**
 * The styles, in the pattern's names. `px` values are rendered pixels.
 * @type {Record<string, { label: string, description: string, px: Record<string, number> }>}
 */
export const QUICK_LABEL_STYLES = {
    classic: {
        label: 'Classic sweep',
        description: 'Out of the side, one broad round bend into the part.',
        px: { font: 13, line: 2, gap: 6 }
    },
    picard: {
        label: 'Picard tight',
        description: 'Out of the side, one small bend; a thicker line.',
        px: { font: 13, line: 2.5, gap: 6, radius: 10 }
    },
    bracket: {
        label: 'Picard bracket',
        description: 'A bar beside the label; the line leaves the top or bottom of the bar, straight or into one sharp diagonal.',
        px: { font: 13, line: 2.5, bar: 6, stub: 64 }
    },
    tag: {
        label: 'Picard tag',
        description: 'A filled block; the line leaves its side.',
        px: { font: 13, line: 2.5, radius: 10 }
    }
};

/** Bracket line kinds. */
export const BRACKET_KINDS = {
    level: { label: 'Level', description: 'Straight out: the end of the bar sits at the part\'s height.' },
    angled: { label: 'Angled', description: 'A stub along the bar, then one sharp diagonal.' }
};

/** Placeholder text for a new label. */
export const QUICK_LABEL_TEXT = 'NEW LABEL';

/**
 * Round to one decimal (view-box units stay readable in YAML).
 * @param {number} v
 */
const r1 = (v) => Math.round(v * 10) / 10;

/**
 * Estimated rendered width of upper-case LCARS text, in the font's own units
 * (Antonio-like condensed face: about 0.5 em per character).
 * @param {string} text
 * @param {number} fontSize
 */
export function estimateTextWidth(text, fontSize) {
    return String(text || '').length * fontSize * 0.5;
}

/**
 * Text inset from the box edge: the button's own 8, or about 0.6 em off a bracket bar.
 * @param {number} fontSize
 * @param {boolean} bracket
 */
export function labelTextPad(fontSize, bracket) {
    return bracket ? fontSize * 0.6 : 8;
}

/**
 * A label box's width for its text: the text, an inset each side and one em of air.
 * @param {string} text
 * @param {number} fontSize
 * @param {boolean} bracket
 */
export function labelBoxWidth(text, fontSize, bracket) {
    return r1(estimateTextWidth(text, fontSize) + labelTextPad(fontSize, bracket) * 2 + fontSize);
}

/**
 * Guess the leader style an MSD already uses, from its labelled lines, so new
 * labels match (one style per MSD). Returns null when nothing tells.
 * @param {any[]} overlays
 * @returns {{ style: string, bracketKind: string } | null}
 */
export function guessQuickLabelStyle(overlays) {
    const list = Array.isArray(overlays) ? overlays : [];
    const byId = new Map(list.filter(o => o?.id).map(o => [o.id, o]));
    for (const line of list) {
        if (line?.type !== 'line' || typeof line.anchor !== 'string') continue;
        const label = byId.get(line.anchor);
        const card = label?.type === 'control' ? label.card : null;
        if (!card || card.type !== 'custom:lcards-button') continue;
        if (card.preset === 'panel-dark' || card.preset === 'panel-light') {
            return { style: 'tag', bracketKind: 'level' };
        }
        if (card.preset !== 'text-only') continue;
        const bw = card.style?.border?.width;
        if (bw && typeof bw === 'object' && (bw.left || bw.right)) {
            return { style: 'bracket', bracketKind: line.route === 'angled' ? 'angled' : 'level' };
        }
        if (line.corner_radius !== undefined && line.corner_radius !== null) {
            return { style: 'picard', bracketKind: 'level' };
        }
        return { style: 'classic', bracketKind: 'level' };
    }
    return null;
}

/**
 * Label sizes, as a share of the drawing: an MSD scales as one picture, so a
 * label sized against the view box keeps its size relative to the ship on any
 * dashboard. `width` is the display width (px) at which the pattern's px
 * rules hold exactly (13 px text), i.e. Medium text is 13/500 of the drawing's
 * width.
 * @type {Record<string, { label: string, name: string, width: number }>}
 */
export const QUICK_LABEL_SIZES = {
    xsmall: { label: 'XS', name: 'Extra small', width: 1000 },
    small: { label: 'S', name: 'Small', width: 700 },
    medium: { label: 'M', name: 'Medium', width: 500 },
    large: { label: 'L', name: 'Large', width: 360 },
    xlarge: { label: 'XL', name: 'Extra large', width: 260 }
};

/**
 * View-box units per pattern px for a size (view_box width / reference width).
 * @param {number} viewBoxWidth
 * @param {string} [size]
 */
export function unitsPerPxForSize(viewBoxWidth, size) {
    const ref = (QUICK_LABEL_SIZES[size || ''] || QUICK_LABEL_SIZES.medium).width;
    return viewBoxWidth > 0 ? viewBoxWidth / ref : 1;
}

/**
 * The size closest to the labels already on the MSD (read back from their
 * font size), so new labels match them. Returns null when there are none.
 * @param {any[]} overlays
 * @param {number} viewBoxWidth
 * @returns {string | null}
 */
export function guessQuickLabelSize(overlays, viewBoxWidth) {
    for (const o of Array.isArray(overlays) ? overlays : []) {
        const card = o?.type === 'control' ? o.card : null;
        if (!card || card.type !== 'custom:lcards-button') continue;
        if (!['text-only', 'panel-dark', 'panel-light'].includes(card.preset)) continue;
        const fs = Number(card.text?.label?.font_size);
        if (!(fs > 0) || !(viewBoxWidth > 0)) continue;
        const shownAt = viewBoxWidth * QUICK_LABEL_STYLES.classic.px.font / fs;
        let best = 'medium';
        for (const [key, s] of Object.entries(QUICK_LABEL_SIZES)) {
            if (Math.abs(Math.log(shownAt / s.width)) < Math.abs(Math.log(shownAt / QUICK_LABEL_SIZES[best].width))) best = key;
        }
        return best;
    }
    return null;
}

/**
 * Next free id with a prefix (`lbl_1`, `lbl_2`, ...).
 * @param {any[]} overlays
 * @param {string} prefix
 * @param {Set<string>} [taken] - ids reserved in the same batch
 */
export function nextOverlayId(overlays, prefix, taken = new Set()) {
    const ids = new Set([...(overlays || []).map(o => o?.id), ...taken]);
    let n = 1;
    while (ids.has(`${prefix}_${n}`)) n++;
    return `${prefix}_${n}`;
}

/**
 * Build the label control and its leader line.
 *
 * The label point is where the line leaves the label (its edge facing the
 * part, at mid-height); the box grows away from the part, so longer text
 * keeps the line where it is (`attachment: left` or `right`).
 *
 * @param {object} opts
 * @param {string} opts.style - a QUICK_LABEL_STYLES key
 * @param {string} [opts.bracketKind] - 'level' | 'angled' (bracket only)
 * @param {[number, number]} opts.labelPoint - view-box point clicked for the label
 * @param {[number, number] | string} opts.target - the part: a view-box point, or an anchor / overlay id
 * @param {[number, number]} [opts.targetPoint] - the part's position when `target` is an id (for the side choice)
 * @param {string | null} [opts.targetSide] - the side of a control or shape the line arrives at (`attach_side`); centre when unset
 * @param {number} opts.unitsPerPx - view-box units per pattern px (unitsPerPxForSize)
 * @param {any[]} [opts.overlays] - existing overlays (for unique ids)
 * @param {string} [opts.text]
 * @returns {{ label: any, line: any, side: 'left' | 'right' }}
 */
export function buildQuickLabel(opts) {
    const styleKey = QUICK_LABEL_STYLES[opts.style] ? opts.style : 'classic';
    const px = QUICK_LABEL_STYLES[styleKey].px;
    const bracketKind = opts.bracketKind === 'angled' ? 'angled' : 'level';
    const u = opts.unitsPerPx > 0 ? opts.unitsPerPx : 1;
    const text = opts.text || QUICK_LABEL_TEXT;

    const targetPoint = Array.isArray(opts.target) ? opts.target : (opts.targetPoint || opts.labelPoint);
    const [lx, ly0] = opts.labelPoint;
    // The side that faces the part.
    const side = targetPoint[0] >= lx ? 'right' : 'left';

    const fontSize = r1(px.font * u);
    const height = r1(fontSize * 1.45);

    // A bracket's line leaves the end of its bar facing the part: the top
    // when the part is above the label, else the bottom.
    const barEnd = targetPoint[1] < ly0 ? 'top' : 'bottom';
    // Level bracket: that end of the bar sits at the part's height, so the
    // line runs straight out along it.
    const ly = styleKey === 'bracket' && bracketKind === 'level'
        ? targetPoint[1] + (barEnd === 'top' ? height / 2 : -height / 2)
        : ly0;
    const textPad = labelTextPad(fontSize, styleKey === 'bracket');
    const width = labelBoxWidth(text, fontSize, styleKey === 'bracket');

    const overlays = opts.overlays || [];
    const labelId = nextOverlayId(overlays, 'lbl');
    const lineId = nextOverlayId(overlays, 'ln', new Set([labelId]));

    /** @type {any} */
    const textLabel = {
        content: text,
        show: true,
        position: side === 'right' ? 'center-right' : 'center-left',
        font_size: fontSize,
        color: LABEL_COLOR
    };
    /** @type {any} */
    const card = {
        type: 'custom:lcards-button',
        preset: styleKey === 'tag' ? 'panel-dark' : 'text-only',
        min_height: 0,
        text: { label: textLabel }
    };
    if (styleKey === 'bracket') {
        card.style = {
            border: {
                width: { [side]: r1(px.bar * u) },
                color: LABEL_COLOR
            }
        };
        textLabel.padding = { [side]: r1(textPad) };
    }

    const label = {
        id: labelId,
        type: 'control',
        // The edge facing the part sits on the clicked point.
        attachment: side === 'right' ? 'right' : 'left',
        position: [r1(lx), r1(ly)],
        size: [width, height],
        card
    };

    /** @type {any} */
    const line = {
        id: lineId,
        type: 'line',
        anchor: labelId,
        attach_to: Array.isArray(opts.target) ? [r1(opts.target[0]), r1(opts.target[1])] : opts.target,
        anchor_side: side,
        route: 'manhattan',
        style: {
            color: styleKey === 'bracket' ? LABEL_COLOR : STRUCTURE_LINE_COLOR,
            width: r1(px.line * u)
        }
    };
    // An id target is an overlay or anchor: arrive at its centre to keep the one bend.
    if (!Array.isArray(opts.target)) line.attach_side = opts.targetSide || 'center';

    if (styleKey === 'classic' || styleKey === 'picard') {
        line.anchor_gap = r1(px.gap * u);
    }
    if (styleKey === 'picard' || styleKey === 'tag') {
        line.corner_radius = r1(px.radius * u);
    }
    if (styleKey === 'bracket') {
        // Never the bar's middle: its top or bottom end, leaving sideways.
        line.anchor_side = `${barEnd}-${side}`;
        line.route_hint = 'xy';
        line.corner_style = 'miter';
        if (bracketKind === 'angled') {
            line.route = 'angled';
            line.stub_length = r1(px.stub * u);
        }
    }

    return { label, line, side };
}

/** Card presets a label uses (text on its own, or a tag block). */
const LABEL_PRESETS = ['text-only', 'panel-dark', 'panel-light'];

/**
 * Whether an overlay is a label: a button control with a text preset.
 * @param {any} o
 */
export function isLabelOverlay(o) {
    return o?.type === 'control' && o.card?.type === 'custom:lcards-button' && LABEL_PRESETS.includes(o.card.preset);
}

/** Position offset of a control's box from its `attachment` point (as MsdControlsRenderer). */
const ATTACHMENT_OFFSET = {
    'top-left': [0, 0], top: [-0.5, 0], 'top-center': [-0.5, 0], 'top-right': [-1, 0],
    left: [0, -0.5], 'center-left': [0, -0.5], center: [-0.5, -0.5], right: [-1, -0.5], 'center-right': [-1, -0.5],
    'bottom-left': [0, -1], bottom: [-0.5, -1], 'bottom-center': [-0.5, -1], 'bottom-right': [-1, -1]
};

/**
 * A control's box in view-box units (top-left x/y, width, height), from its
 * position, size and attachment (controls default to `center`).
 * @param {any} control
 * @returns {{ x: number, y: number, w: number, h: number } | null}
 */
export function controlBox(control) {
    const pos = control?.position;
    const size = control?.size;
    if (!Array.isArray(pos) || !Array.isArray(size)) return null;
    const [w, h] = size.map(Number);
    const [fx, fy] = ATTACHMENT_OFFSET[control.attachment || 'center'] || ATTACHMENT_OFFSET.center;
    return { x: Number(pos[0]) + fx * w, y: Number(pos[1]) + fy * h, w, h };
}

/**
 * Snap a label point into line with the labels already on the MSD: its x to
 * another label's left or right edge (a column), its y to another label's
 * middle (a row), each within `tolerance` view-box units.
 * @param {[number, number]} point
 * @param {any[]} overlays
 * @param {number} tolerance
 * @returns {{ point: [number, number], guideX: number | null, guideY: number | null }}
 */
export function snapLabelPoint(point, overlays, tolerance) {
    let [x, y] = point;
    let guideX = null;
    let guideY = null;
    let bestX = tolerance;
    let bestY = tolerance;
    for (const o of Array.isArray(overlays) ? overlays : []) {
        if (!isLabelOverlay(o)) continue;
        const box = controlBox(o);
        if (!box) continue;
        for (const ex of [box.x, box.x + box.w]) {
            const d = Math.abs(point[0] - ex);
            if (d <= bestX) { bestX = d; x = ex; guideX = ex; }
        }
        const my = box.y + box.h / 2;
        const d = Math.abs(point[1] - my);
        if (d <= bestY) { bestY = d; y = my; guideY = my; }
    }
    return { point: [x, y], guideX, guideY };
}

/**
 * The snap target nearest a point within `tolerance`: candidates are named
 * points (anchors, control connection points, shape points).
 * @template {{ point: [number, number] }} T
 * @param {[number, number]} point
 * @param {T[]} candidates
 * @param {number} tolerance
 * @returns {T | null}
 */
export function nearestSnapTarget(point, candidates, tolerance) {
    let best = null;
    let bestD = tolerance;
    for (const c of candidates) {
        const d = Math.hypot(point[0] - c.point[0], point[1] - c.point[1]);
        if (d <= bestD) { bestD = d; best = c; }
    }
    return best;
}

/** A control's nine connection points (the sides a line's attach_side names; `center` is null). */
export function controlConnectionPoints(control) {
    const b = controlBox(control);
    if (!b) return [];
    const { x, y, w, h } = b;
    /** @type {Array<[string | null, number, number]>} */
    const pts = [
        [null, x + w / 2, y + h / 2], ['top', x + w / 2, y], ['bottom', x + w / 2, y + h],
        ['left', x, y + h / 2], ['right', x + w, y + h / 2], ['top-left', x, y],
        ['top-right', x + w, y], ['bottom-left', x, y + h], ['bottom-right', x + w, y + h]
    ];
    return pts.map(([side, px, py]) => ({ id: control.id, side, point: /** @type {[number, number]} */ ([px, py]) }));
}

/**
 * Whether a drawing's anchor has a real name, not an id a drawing tool made
 * up (`g46-3`, `path123`, `rect4-7`): the part click snaps to such a part
 * by its point, so the line does not carry a meaningless name.
 * @param {string} name
 */
export function isNamedAnchor(name) {
    return !/^(g|path|rect|circle|ellipse|polygon|polyline|line|text|tspan|use|image|layer|svg|defs|group|shape)[-_]?\d[\w-]*$/i.test(String(name));
}
