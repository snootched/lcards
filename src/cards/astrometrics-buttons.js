/**
 * The astrometrics card's on-card camera buttons (`camera.buttons`): which
 * buttons show and their grid areas, with `hide: toggle`'s fold button.
 * Pure (no Lit), so it is tested in node.
 *
 * @module cards/astrometrics-buttons
 */
import { dpadComponents } from '../core/packs/components/dpad/index.js';

/**
 * The on-card camera pad: the LCARdS D-pad's nine segments (its paths, from
 * the `dpad` component, viewBox 0 0 80 80), each a camera command. Arms pan,
 * the centre resets, the corners zoom and fly forward and back. `grid` is
 * the segment's cell in the 3 x 3 hit grid (taps land on a third of the pad,
 * not only on the drawn shape: the arm tips are thin), `glyph` a mark drawn
 * on it (viewBox units), `kind` its D-pad theme tokens, `option` the
 * `camera.buttons` key that turns it off.
 * @type {{ seg: string, cmd: string, kind: 'directional' | 'diagonal' | 'center', area: string, label: string, glyph: string, option: string }[]}
 */
export const PAD_SEGMENTS = [
    { seg: 'up', cmd: 'pan-up', kind: 'directional', area: 'up', label: 'Pan up', glyph: 'M35 21l5-5 5 5', option: 'pan' },
    { seg: 'down', cmd: 'pan-down', kind: 'directional', area: 'down', label: 'Pan down', glyph: 'M35 59l5 5 5-5', option: 'pan' },
    { seg: 'left', cmd: 'pan-left', kind: 'directional', area: 'left', label: 'Pan left', glyph: 'M21 35l-5 5 5 5', option: 'pan' },
    { seg: 'right', cmd: 'pan-right', kind: 'directional', area: 'right', label: 'Pan right', glyph: 'M59 35l5 5-5 5', option: 'pan' },
    { seg: 'center', cmd: 'reset', kind: 'center', area: 'reset', label: 'Reset view', glyph: 'M36 40a4 4 0 1 0 8 0a4 4 0 1 0-8 0', option: 'reset' },
    { seg: 'up-left', cmd: 'zoom-in', kind: 'diagonal', area: 'zin', label: 'Zoom in', glyph: 'M14 20h12M20 14v12', option: 'zoom' },
    { seg: 'down-left', cmd: 'zoom-out', kind: 'diagonal', area: 'zout', label: 'Zoom out', glyph: 'M14 60h12', option: 'zoom' },
    { seg: 'up-right', cmd: 'fly-forward', kind: 'diagonal', area: 'fwd', label: 'Fly forward', glyph: 'M54 20l6-6 6 6M54 26l6-6 6 6', option: 'travel' },
    { seg: 'down-right', cmd: 'fly-back', kind: 'diagonal', area: 'back', label: 'Fly back', glyph: 'M54 54l6 6 6-6M54 60l6 6 6-6', option: 'travel' }
];

/** The hit grid's areas (CSS grid-template-areas) */
export const PAD_AREAS = '"zin up fwd" "left reset right" "zout down back"';

/** Default and allowed pad size, CSS px */
export const PAD_SIZE = { default: 180, min: 64, max: 320 };

/** @type {Record<string, string> | null} */
let padPaths = null;

/**
 * The D-pad component's path for each segment id (parsed once from its SVG).
 * @returns {Record<string, string>}
 */
export function dpadPaths() {
    if (padPaths) return padPaths;
    /** @type {Record<string, string>} */
    const out = {};
    for (const m of String(dpadComponents.dpad.svg).matchAll(/<path id="([a-z-]+)" d="([^"]+)"/g)) out[m[1]] = m[2];
    padPaths = out;
    return out;
}

/** The pad's states and the D-pad token state each reads (a segment that is off reads `unavailable`) */
const PAD_STATES = { rest: ['default', 'default', 'default'], hover: ['hover', 'hover', 'hover'], pressed: ['pressed', 'pressed', 'pressed'], off: ['unavailable', 'unavailable', 'unavailable'] };

/**
 * CSS variables for the pad from the D-pad theme tokens
 * (`components.dpad.segment.<kind>.<fill|stroke|stroke-width>.<state>`),
 * as `--pad-<kind>-<prop>-<state>`, plus `--pad-<kind>-glyph` (the marks,
 * `components.dpad.segment.<kind>.glyph.default`), and `--pad-track` /
 * `--pad-track-fill` for the time slider (the slider card's track tokens).
 * Token values are CSS (var() stays live, so theme changes and alert modes
 * recolour the pad without a re-render); a token that does not resolve is
 * left out and the CSS fallback applies.
 * @param {(path: string) => any} token - the card's token lookup
 * @returns {string} a style attribute value
 */
export function padTokenStyle(token) {
    /** @type {string[]} */
    const out = [];
    for (const kind of ['directional', 'diagonal', 'center']) {
        for (const [state, [fill, stroke, width]] of Object.entries(PAD_STATES)) {
            const f = token(`components.dpad.segment.${kind}.fill.${fill}`);
            const s = token(`components.dpad.segment.${kind}.stroke.${stroke}`);
            const w = token(`components.dpad.segment.${kind}.stroke-width.${width}`);
            if (f != null) out.push(`--pad-${kind}-fill-${state}: ${f}`);
            if (s != null) out.push(`--pad-${kind}-stroke-${state}: ${s}`);
            if (w != null) out.push(`--pad-${kind}-width-${state}: ${w}`);
        }
    }
    // the time slider's track and fill, as the slider card's
    const track = token('components.slider.track.background.default');
    const fill = token('components.slider.track.background.active');
    if (track != null) out.push(`--pad-track: ${track}`);
    if (fill != null) out.push(`--pad-track-fill: ${fill}`);
    for (const kind of ['directional', 'diagonal', 'center']) {
        const g = token(`components.dpad.segment.${kind}.glyph.default`);
        if (g != null) out.push(`--pad-${kind}-glyph: ${g}`);
    }
    return out.join('; ');
}

/** `buttons.hide: toggle`: fold (shown while open) and unfold (a four-way arrow) */
const FOLD_BUTTON = {
    open: ['fold', 'fold', 'Hide camera buttons', 'M7 7l10 10M17 7L7 17'],
    folded: ['unfold', 'fold', 'Show camera buttons', 'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3']
};

/** The time slider's stops: how fast the scene's motion runs (0 holds it) */
export const TIME_STOPS = [0, 0.1, 0.25, 0.5, 1, 2, 4];

/**
 * The slider stop nearest a time scale.
 * @param {number} scale
 */
export function timeStop(scale) {
    let best = 0;
    for (let i = 1; i < TIME_STOPS.length; i++) if (Math.abs(TIME_STOPS[i] - scale) < Math.abs(TIME_STOPS[best] - scale)) best = i;
    return best;
}

/**
 * What the time slider sets (`buttons.time`): `speed` (time_scale), `date`
 * (the scene clock's rate, with the date and NOW) or `both` (a switch
 * between them). `true` or left out: both when the card has a `clock`,
 * else speed.
 * @param {any} cfg - `camera.buttons`
 * @param {boolean} [hasClock] - the card config has `clock`
 * @returns {'speed' | 'date' | 'both'}
 */
export function timeMode(cfg, hasClock = false) {
    const t = cfg && typeof cfg === 'object' ? cfg.time : undefined;
    if (t === 'speed' || t === 'date' || t === 'both') return t;
    return hasClock ? 'both' : 'speed';
}

/** `buttons.hide: idle`: the buttons fade out after this long (ms) without input on the card */
export const BUTTONS_IDLE_MS = 3000;

/**
 * The pad for `camera.buttons`: where it sits, its size, each segment (off
 * when its option is false), the time slider and, with `hide: toggle`, the
 * fold button (folded, only it shows).
 * @param {any} cfg - `camera.buttons`
 * @param {{ folded?: boolean }} [state]
 * @returns {{ position: string, size: number, hide: 'idle' | 'never' | 'toggle', segments: (typeof PAD_SEGMENTS[number] & { on: boolean })[], pad: boolean, time: boolean, fold: string[] | null } | null}
 */
export function cameraButtonLayout(cfg, { folded = false } = {}) {
    if (!cfg) return null;
    const o = cfg === true ? {} : cfg;
    const segments = PAD_SEGMENTS.map((s) => ({ ...s, on: o[s.option] !== false }));
    const pad = segments.some((s) => s.on);
    const time = o.time !== false;
    if (!pad && !time) return null;
    const hide = o.hide === 'never' || o.hide === 'toggle' ? o.hide : 'idle';
    const position = typeof o.position === 'string' ? o.position : 'bottom-right';
    const n = Number(o.size);
    const size = Number.isFinite(n) && n > 0 ? Math.min(PAD_SIZE.max, Math.max(PAD_SIZE.min, n)) : PAD_SIZE.default;
    const fold = hide === 'toggle' ? (folded ? FOLD_BUTTON.folded : FOLD_BUTTON.open) : null;
    if (fold && folded) return { position, size, hide, segments, pad: false, time: false, fold };
    return { position, size, hide, segments, pad, time, fold };
}
