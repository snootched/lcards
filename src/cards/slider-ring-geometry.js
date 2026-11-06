/**
 * @fileoverview Ring gauge geometry (slider `component: ring`).
 *
 * The ring is a thick arc around the centre text: the track runs from
 * `start_angle` to `end_angle`, the value arc fills it from the start. Angles are
 * in degrees, 0 = top, clockwise (like a clock face). These helpers are pure, so
 * the ring component, the slider card and the tests share them.
 *
 * @module cards/slider-ring-geometry
 */

/** Ring settings when the config sets none. */
/** Degrees to radians */
const DEG = Math.PI / 180;

export const RING_DEFAULTS = Object.freeze({
    start_angle: -135,
    end_angle: 135,
    thickness: '12%',
    cap: 'round',
});

/** Clearance between the ring's outer edge and its ticks, in px. */
export const TICK_GAP = 3;

/**
 * Sweep of the ring in degrees, in (0, 360]. An end at or before the start wraps
 * round (so -135 to 135 is 270, 90 to 0 is 270); equal angles give a full ring.
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
export function normalizeSweep(start, end) {
    const s = Number.isFinite(start) ? start : RING_DEFAULTS.start_angle;
    const e = Number.isFinite(end) ? end : RING_DEFAULTS.end_angle;
    let sweep = (e - s) % 360;
    if (sweep <= 0) sweep += 360;
    return sweep;
}

/**
 * Ring thickness in px: a number is px, `'12%'` is a percentage of the ring's
 * outer diameter, `'14px'` is px. Falls back to the default 12%.
 * @param {number|string|undefined} thickness
 * @param {number} rOuter - Outer radius in px
 * @returns {number}
 */
export function thicknessPx(thickness, rOuter) {
    const diameter = rOuter * 2;
    let px;
    if (typeof thickness === 'number' && Number.isFinite(thickness)) {
        px = thickness;
    } else if (typeof thickness === 'string' && thickness.trim().endsWith('%')) {
        px = diameter * (parseFloat(thickness) || 0) / 100;
    } else if (typeof thickness === 'string' && Number.isFinite(parseFloat(thickness))) {
        px = parseFloat(thickness);
    } else {
        px = diameter * parseFloat(RING_DEFAULTS.thickness) / 100;
    }
    return Math.max(1, Math.min(px, rOuter * 0.9));
}

/**
 * @typedef {Object} RingLayout
 * @property {number} cx - Centre x
 * @property {number} cy - Centre y
 * @property {number} rOuter - Outer edge of the ring band
 * @property {number} rInner - Inner edge of the ring band
 * @property {number} rMid - Stroke centre line
 * @property {number} stroke - Band thickness (stroke width)
 * @property {number} start - Start angle (deg)
 * @property {number} sweep - Sweep (deg, 0 < sweep <= 360)
 * @property {{x:number, y:number, width:number, height:number}} box - The arc and its centre with the room for its ticks (a square for a full ring)
 * @property {{x:number, y:number, width:number, height:number}} inner - The square inscribed in the inner edge, kept inside the box (centre text)
 */

/**
 * The box round a ring's arc and its centre, with the ring's outer radius
 * as 1 (0 = top, clockwise; y down): the arc's ends and every top, right,
 * bottom or left point it passes. The centre is in it (the value text sits
 * there), so a full ring is [-1, 1] each way and a half ring over the top
 * [-1, 1] by [-1, 0].
 * @param {number} start - degrees
 * @param {number} sweep - degrees, 0 < sweep <= 360
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
 */
export function arcExtent(start, sweep) {
    const pts = [[0, 0]];
    const at = (deg) => [Math.sin(deg * DEG), -Math.cos(deg * DEG)];
    pts.push(at(start), at(start + sweep));
    for (let k = 0; k < 4; k++) {
        // how far past the start each quarter point is, 0 to 360
        const past = (((k * 90 - start) % 360) + 360) % 360;
        if (sweep >= 360 || past <= sweep) pts.push(at(k * 90));
    }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    // rounded so a quarter point lands exactly on its side
    const r = (v) => Math.round(v * 1e9) / 1e9;
    return { minX: r(Math.min(...xs)), maxX: r(Math.max(...xs)), minY: r(Math.min(...ys)), maxY: r(Math.max(...ys)) };
}

/**
 * Ring layout inside a width x height box: the ring as large as its arc
 * allows (a half ring fills a wide box, not a square of it), leaving
 * `outerPad` px round it for ticks, markers and labels, the arc and its
 * centre in the middle of the box (arcExtent). A full ring is a circle on
 * the smaller side, centred.
 * @param {number} width
 * @param {number} height
 * @param {Object} [ring] - style.ring
 * @param {Object} [opts]
 * @param {number} [opts.outerPad] - Room outside the ring in px (default 0)
 * @returns {RingLayout}
 */
export function ringLayout(width, height, ring = {}, opts = {}) {
    const w = Math.max(1, width || 0);
    const h = Math.max(1, height || 0);

    const start = Number.isFinite(ring?.start_angle) ? ring.start_angle : RING_DEFAULTS.start_angle;
    const sweep = normalizeSweep(start, Number.isFinite(ring?.end_angle) ? ring.end_angle : RING_DEFAULTS.end_angle);
    const e = arcExtent(start, sweep);
    const ew = e.maxX - e.minX;
    const eh = e.maxY - e.minY;

    const size = Math.min(w, h);
    const pad = Math.max(0, Math.min(opts.outerPad ?? 0, size / 2 - 10));
    // the radius (to the ring's outer edge plus a 1px safety, so an antialiased edge never
    // touches the box) that fits the arc's box, padded, in the card
    const R = Math.max(3, Math.min((w - 2 * pad) / ew, (h - 2 * pad) / eh));
    const rOuter = Math.max(2, R - 1);
    const stroke = thicknessPx(ring?.thickness, rOuter);
    const rInner = Math.max(0, rOuter - stroke);
    const rMid = rOuter - stroke / 2;

    // the arc's box, padded, centred in the card; the ring's centre sits in it where the arc puts it
    const bw = ew * R + 2 * pad;
    const bh = eh * R + 2 * pad;
    const bx = (w - bw) / 2;
    const by = (h - bh) / 2;
    const cx = bx + pad - e.minX * R;
    const cy = by + pad - e.minY * R;

    // the centre text: the square inscribed in the inner edge, kept inside the box (a half
    // ring's text sits in its open half, above the cut)
    const innerSide = rInner * Math.SQRT2;
    const ix0 = Math.max(cx - innerSide / 2, bx), ix1 = Math.min(cx + innerSide / 2, bx + bw);
    const iy0 = Math.max(cy - innerSide / 2, by), iy1 = Math.min(cy + innerSide / 2, by + bh);
    return {
        cx, cy, rOuter, rInner, rMid, stroke, start, sweep,
        box: { x: bx, y: by, width: bw, height: bh },
        inner: { x: ix0, y: iy0, width: Math.max(0, ix1 - ix0), height: Math.max(0, iy1 - iy0) },
    };
}

/**
 * Point on a circle at an angle (0 = top, clockwise).
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} deg
 * @returns {{x:number, y:number}}
 */
export function polar(cx, cy, r, deg) {
    const rad = deg * Math.PI / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/** @param {number} n */
const f = (n) => Number(n.toFixed(3));

/**
 * SVG path for an arc from angle a0 to a1 (clockwise when a1 > a0, otherwise
 * anticlockwise). A full turn is drawn as two half arcs (one arc can't close).
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} a0
 * @param {number} a1
 * @returns {string}
 */
export function arcPath(cx, cy, r, a0, a1) {
    const delta = a1 - a0;
    if (Math.abs(delta) >= 360) {
        const mid = a0 + delta / 2;
        return `${arcPath(cx, cy, r, a0, mid)} ${arcPath(cx, cy, r, mid, a1).replace(/^M[^A]*/, '')}`.trim();
    }
    const p0 = polar(cx, cy, r, a0);
    const p1 = polar(cx, cy, r, a1);
    const large = Math.abs(delta) > 180 ? 1 : 0;
    const sweepFlag = delta >= 0 ? 1 : 0;
    return `M ${f(p0.x)} ${f(p0.y)} A ${f(r)} ${f(r)} 0 ${large} ${sweepFlag} ${f(p1.x)} ${f(p1.y)}`;
}

/**
 * Angle (deg) of a fraction of the sweep.
 * @param {number} fraction - 0..1
 * @param {number} start
 * @param {number} sweep
 * @returns {number}
 */
export function fractionToAngle(fraction, start, sweep) {
    return start + Math.max(0, Math.min(1, fraction)) * sweep;
}

/**
 * Pointer position to a fraction of the sweep (0 at the start angle, 1 at the
 * end). A point in the gap snaps to the nearer end. While dragging, pass the
 * previous fraction: a jump of more than half the ring (across the gap or the
 * seam of a full ring) keeps the end the drag was at, so it never wraps from
 * max to min.
 * @param {number} x
 * @param {number} y
 * @param {{cx:number, cy:number, start:number, sweep:number}} layout
 * @param {number|null} [prevFraction]
 * @returns {number}
 */
export function pointToFraction(x, y, layout, prevFraction = null) {
    const { cx, cy, start, sweep } = layout;
    const ang = Math.atan2(x - cx, -(y - cy)) * 180 / Math.PI;
    const rel = (((ang - start) % 360) + 360) % 360;

    let fraction;
    if (sweep >= 360) {
        fraction = rel / 360;
    } else if (rel <= sweep) {
        fraction = rel / sweep;
    } else {
        // In the gap: snap to the nearer end.
        fraction = rel < sweep + (360 - sweep) / 2 ? 1 : 0;
    }

    if (prevFraction !== null && prevFraction !== undefined && Math.abs(fraction - prevFraction) > 0.5) {
        fraction = prevFraction >= 0.5 ? 1 : 0;
    }
    return fraction;
}

/**
 * Whether a point lies on the ring band (with a tolerance either side), so a
 * press on the centre text or the empty corners does nothing.
 * @param {number} x
 * @param {number} y
 * @param {{cx:number, cy:number, rInner:number, rOuter:number}} layout
 * @param {number} [tolerance]
 * @returns {boolean}
 */
export function hitsRing(x, y, layout, tolerance = 8) {
    const d = Math.hypot(x - layout.cx, y - layout.cy);
    return d >= layout.rInner - tolerance && d <= layout.rOuter + tolerance;
}

/**
 * Decimal places of a step (0.5 -> 1, 0.25 -> 2), to strip float noise.
 * @param {number} step
 * @returns {number}
 */
function stepDecimals(step) {
    const s = String(step);
    const i = s.indexOf('.');
    return i < 0 ? 0 : s.length - i - 1;
}

/**
 * Round a value to the step and clamp it to [min, max].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {number} [step]
 * @returns {number}
 */
export function snapValue(value, min, max, step = 1) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    const st = step > 0 ? step : 1;
    const rounded = Math.round(value / st) * st;
    return Number(Math.max(lo, Math.min(hi, rounded)).toFixed(stepDecimals(st)));
}

/**
 * Fraction of the display range to a control value: the fraction maps over
 * the display range, the result is stepped and clamped to the control range.
 * @param {number} fraction - 0..1 along the ring
 * @param {{min:number, max:number}} display
 * @param {{min:number, max:number, step?:number}} control
 * @returns {number}
 */
export function fractionToValue(fraction, display, control) {
    const value = display.min + Math.max(0, Math.min(1, fraction)) * (display.max - display.min);
    return snapValue(value, control.min, control.max, control.step);
}

/**
 * Scale values from `min` in steps of `interval` up to `max` (inclusive, with a
 * float tolerance). `skipInterval` drops values that land on its multiples
 * (minor ticks under major ones).
 * @param {number} min
 * @param {number} max
 * @param {number} interval - Value units (> 0)
 * @param {number} [skipInterval]
 * @returns {number[]}
 */
export function scaleValues(min, max, interval, skipInterval) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    if (!(interval > 0) || !Number.isFinite(lo) || !Number.isFinite(hi)) return [];
    const count = Math.floor((hi - lo) / interval + 1e-9) + 1;
    if (count > 1000) return [];
    const decimals = Math.max(stepDecimals(interval), stepDecimals(lo));
    const out = [];
    for (let i = 0; i < count; i++) {
        const v = Number((lo + i * interval).toFixed(decimals));
        if (skipInterval && skipInterval > 0) {
            const k = (v - lo) / skipInterval;
            if (Math.abs(k - Math.round(k)) < 1e-6) continue;
        }
        out.push(v);
    }
    return out;
}

/**
 * Rough rendered width of a label in px (condensed LCARS fonts run about half
 * an em per character), for placing labels clear of the ring.
 * @param {string} text
 * @param {number} fontSize
 * @returns {number}
 */
export function estimateTextWidth(text, fontSize) {
    return String(text ?? '').length * fontSize * 0.55;
}

/**
 * Centre of a w x h label outside the ring at an angle: pushed out from radius
 * `r0` far enough that its nearest edge clears r0 (wide labels at the sides,
 * tall ones at the top and bottom).
 * @param {number} cx
 * @param {number} cy
 * @param {number} r0 - Radius the label must clear
 * @param {number} deg
 * @param {number} w
 * @param {number} h
 * @returns {{x:number, y:number}}
 */
export function labelCentre(cx, cy, r0, deg, w, h) {
    const rad = deg * Math.PI / 180;
    const d = r0 + Math.abs(Math.sin(rad)) * w / 2 + Math.abs(Math.cos(rad)) * h / 2;
    return polar(cx, cy, d, deg);
}

/** Marker defaults per indicator type on a ring (range.indicator.*). */
export const RING_MARKER_ALIGN = Object.freeze({ line: 'start', triangle: 'end', round: 'center' });

/**
 * Default marker size on a ring: `width` across the ring, `height` along the
 * radius. A line is ~18% of the band wide and reaches 6px past the ring; a
 * triangle is 12 x 10; a dot is half the band.
 * @param {string} type - line | triangle | round
 * @param {number} stroke - Band thickness
 * @returns {{width:number, height:number}}
 */
export function ringMarkerSize(type, stroke) {
    if (type === 'triangle') return { width: 12, height: 10 };
    if (type === 'round') {
        const d = Math.max(6, Math.round(stroke * 0.5));
        return { width: d, height: d };
    }
    return { width: Math.max(2, Math.round(stroke * 0.18)), height: stroke + 6 };
}

/**
 * Radial span of a value marker on the ring: `r0` (inner end) to `r1` (outer
 * end), and `tip` (the radius a triangle points at).
 * - start: anchored at the inner edge (a line runs outward from it; a triangle
 *   or dot sits just inside it)
 * - center: centred on the band
 * - end: anchored at the outer edge (a triangle or dot sits just outside it)
 * `offset` shifts the whole marker outward (negative = inward).
 * @param {string} type - line | triangle | round
 * @param {string} align - start | center | end
 * @param {{rInner:number, rOuter:number, rMid:number}} layout
 * @param {number} height - Size along the radius (a dot uses its width)
 * @param {number} [offset]
 * @returns {{r0:number, r1:number, tip:number}}
 */
export function markerRadialSpan(type, align, layout, height, offset = 0) {
    const { rInner, rOuter, rMid } = layout;
    const len = Math.max(1, height);
    let r0;
    if (type === 'line') {
        r0 = align === 'end' ? rOuter : align === 'center' ? rMid - len / 2 : rInner;
    } else {
        r0 = align === 'start' ? rInner - len : align === 'center' ? rMid - len / 2 : rOuter;
    }
    r0 += offset;
    const r1 = r0 + len;
    // A triangle points at the band: inward unless it sits inside the ring.
    const tip = type === 'triangle' && align === 'start' ? r1 : r0;
    return { r0, r1, tip };
}

/**
 * Text zones inside the inner square: `label` (top), `value` (middle), `sublabel`
 * (bottom) and `center` (the whole square).
 * @param {{x:number, y:number, width:number, height:number}} inner
 * @returns {Object.<string, {x:number, y:number, width:number, height:number}>}
 */
export function ringTextZones(inner) {
    const { x, y, width, height } = inner;
    const labelH = height * 0.28;
    const valueH = height * 0.44;
    return {
        center: { x, y, width, height },
        label: { x, y, width, height: labelH },
        value: { x, y: y + labelH, width, height: valueH },
        sublabel: { x, y: y + labelH + valueH, width, height: height - labelH - valueH },
    };
}
