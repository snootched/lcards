/**
 * @fileoverview Alert Mode Transition Effects
 *
 * Visual transition effects played when switching alert modes.
 * Each effect wraps the color-change callback, using the visual disturbance
 * to conceal the instantaneous CSS variable swap underneath.
 *
 * All effects accept:
 *   mainView    {Element}  - home-assistant-main element to animate
 *   accentColor {string}   - accent hex for the incoming alert mode
 *   applyFn     {Function} - async function that swaps the colour palette
 *
 * @module core/themes/alertTransitions
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

// ─────────────────────────────────────────────────────────────────────────────
// Alert accent colours
// ─────────────────────────────────────────────────────────────────────────────

const ALERT_ACCENT_COLORS = {
    red_alert:    '#cc0000',
    yellow_alert: '#f0b030',
    blue_alert:   '#1e90ff',
    black_alert:  '#0d0d0d',
    gray_alert:   '#888888',
    green_alert:  '#44cc88',
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const raf   = ()   => new Promise(r => requestAnimationFrame(r));

/**
 * Create a position:fixed full-screen overlay element.
 * @param {string} color  - CSS background value
 * @param {number} opacity - initial opacity (0–1)
 */
function createOverlay(color, opacity = 0) {
    const el = document.createElement('div');
    el.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:99999',
        `background:${color}`,
        `opacity:${opacity}`,
        'pointer-events:none',
        'will-change:opacity,clip-path',
    ].join(';');
    return el;
}

// ─────────────────────────────────────────────────────────────────────────────
// Effect implementations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * blur_fade — screen blurs and dims, colours swap, then un-blurs.
 * Mirrors the previous hardcoded behaviour, now as an opt-in.
 */
async function effect_blur_fade(mainView, accent, applyFn) {
    mainView.style.transition = 'filter 0.28s ease, opacity 0.28s ease';
    await raf();
    mainView.style.filter  = 'blur(8px)';
    mainView.style.opacity = '0.6';
    await sleep(290);
    await applyFn();
    await raf();
    mainView.style.filter  = '';
    mainView.style.opacity = '';
    await sleep(310);
    mainView.style.transition = '';
}

/**
 * fade_only — crossfade: dims very low, swaps, restores. GPU-light.
 * Uses 0.05 minimum so the screen never goes fully black.
 */
async function effect_fade_only(mainView, accent, applyFn) {
    mainView.style.transition = 'opacity 0.22s ease';
    await raf();
    mainView.style.opacity = '0.05';
    await sleep(230);
    await applyFn();
    await raf();
    mainView.style.opacity = '1';
    await sleep(250);
    mainView.style.transition = '';
}

/**
 * flash — accent-coloured burst floods the screen then fades out.
 * Feels like a power surge / phaser hit.
 */
async function effect_flash(mainView, accent, applyFn) {
    const overlay = createOverlay(accent, 0);
    document.body.appendChild(overlay);

    overlay.style.transition = 'opacity 0.1s ease-in';
    await raf();
    overlay.style.opacity = '0.85';
    await sleep(120);

    await applyFn();

    await raf();
    overlay.style.transition = 'opacity 0.38s ease-out';
    overlay.style.opacity = '0';
    await sleep(400);
    overlay.remove();
}

/**
 * color_bleed — hue spins a full 360° while dimming; new palette revealed on restore.
 * Looks like the colour space tearing apart and reassembling.
 */
async function effect_color_bleed(mainView, accent, applyFn) {
    // Anchor the filter at 0deg so the transition from nothing → 360deg is unambiguous
    mainView.style.transition = 'none';
    mainView.style.filter     = 'hue-rotate(0deg) brightness(1)';
    await raf();

    mainView.style.transition = 'filter 0.45s ease-in';
    mainView.style.filter     = 'hue-rotate(360deg) brightness(0.5)';
    await sleep(470);

    await applyFn();

    // Snap hue-rotate back to 0 without a visible jump, then restore brightness
    mainView.style.transition = 'none';
    mainView.style.filter     = 'hue-rotate(0deg) brightness(0.5)';
    await raf();
    mainView.style.transition = 'filter 0.32s ease-out';
    mainView.style.filter     = '';
    await sleep(350);
    mainView.style.transition = '';
}

/**
 * flicker — rapid opacity pulses; CRT losing power then stabilising.
 */
async function effect_flicker(mainView, accent, applyFn) {
    const STEP_MS = 38;
    const steps   = [0.25, 0.95, 0.1, 0.8, 0.05, 0.7, 0.15, 0.9, 0.4, 1.0];

    mainView.style.transition = `opacity ${STEP_MS}ms linear`;
    await raf();

    for (let i = 0; i < steps.length; i++) {
        mainView.style.opacity = String(steps[i]);
        if (i === 4) await applyFn(); // deepest dark frame
        await sleep(STEP_MS);
    }

    mainView.style.opacity    = '1';
    mainView.style.transition = '';
}

/**
 * static — canvas pixel noise overlay; TV losing signal.
 * Draws scaled-up random noise on a small canvas for performance.
 */
async function effect_static(mainView, accent, applyFn) {
    // Small resolution scaled up — cheap to compute, looks chunky/noisy.
    const W = 160, H = 90;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    canvas.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:99999',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'image-rendering:pixelated',
        'opacity:0.55',
        'mix-blend-mode:overlay',
    ].join(';');
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const DURATION = 460;
    const start    = performance.now();
    let applied    = false;

    // Accent colour as RGB components for tinted noise
    const hex = accent.replace('#', '');
    const ar  = parseInt(hex.slice(0, 2), 16);
    const ag  = parseInt(hex.slice(2, 4), 16);
    const ab  = parseInt(hex.slice(4, 6), 16);

    await new Promise(resolve => {
        const tick = (now) => {
            const elapsed = now - start;
            const t       = elapsed / DURATION;

            // Noise opacity ramps up then back down; tint strength builds mid-way
            const noiseAlpha = Math.round(180 + Math.sin(t * Math.PI) * 75);
            const tintMix    = Math.sin(t * Math.PI); // 0→1→0

            const img = ctx.createImageData(W, H);
            const d   = img.data;
            for (let i = 0; i < d.length; i += 4) {
                const v   = Math.random() * 255;
                d[i]   = v + (ar - v) * tintMix * 0.5;
                d[i+1] = v + (ag - v) * tintMix * 0.5;
                d[i+2] = v + (ab - v) * tintMix * 0.5;
                d[i+3] = noiseAlpha;
            }
            ctx.putImageData(img, 0, 0);

            if (!applied && t >= 0.5) {
                applied = true;
                applyFn().then(() => {
                    canvas.remove();
                    resolve();
                });
                return;
            }

            if (elapsed >= DURATION) {
                canvas.remove();
                resolve();
                return;
            }

            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}

/**
 * wipe — accent-coloured panel slides across the viewport (right→left),
 * hides the colour swap at mid-crossing, then wipes off to the left.
 * Very on-brand for LCARS panel transitions.
 */
async function effect_wipe(mainView, accent, applyFn) {
    const overlay = createOverlay(accent, 0.65);
    overlay.style.clipPath   = 'inset(0 100% 0 0)'; // starts hidden off the right edge
    overlay.style.transition = 'clip-path 0.24s cubic-bezier(0.4, 0, 0.2, 1)';
    document.body.appendChild(overlay);

    await raf();
    overlay.style.clipPath = 'inset(0 0% 0 0)'; // sweep fully across
    await sleep(260);

    // Fully covered — safe to swap colours
    await applyFn();
    await raf();

    // Sweep out to the left
    overlay.style.transition = 'clip-path 0.26s cubic-bezier(0.4, 0, 0.2, 1)';
    overlay.style.clipPath   = 'inset(0 0% 0 100%)';
    await sleep(280);
    overlay.remove();
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry & public API
// ─────────────────────────────────────────────────────────────────────────────

const TRANSITION_EFFECTS = {
    blur_fade:   effect_blur_fade,
    fade_only:   effect_fade_only,
    flash:       effect_flash,
    color_bleed: effect_color_bleed,
    flicker:     effect_flicker,
    static:      effect_static,
    wipe:        effect_wipe,
};

/** Ordered list of all valid transition style values, including 'off'. */
export const TRANSITION_STYLE_OPTIONS = ['off', ...Object.keys(TRANSITION_EFFECTS)];

/**
 * Run a named transition effect, calling `applyColorsFn` at the point during
 * the animation when the screen is most obscured.
 *
 * Passing style='off' or omitting mainView skips animation and calls applyColorsFn directly.
 *
 * @param {string}       style          - Transition key from TRANSITION_STYLE_OPTIONS
 * @param {Element|null} mainView       - home-assistant-main element
 * @param {string}       mode           - Incoming alert mode (for accent colour)
 * @param {Function}     applyColorsFn  - Async function that swaps CSS colour variables
 * @returns {Promise<void>}
 */
export async function runTransitionEffect(style, mainView, mode, applyColorsFn) {
    if (!mainView || !style || style === 'off') {
        await applyColorsFn();
        return;
    }

    const effect = TRANSITION_EFFECTS[style];
    if (!effect) {
        lcardsLog.warn(`[AlertTransitions] Unknown transition style '${style}' — applying palette directly`);
        await applyColorsFn();
        return;
    }

    const accent = ALERT_ACCENT_COLORS[mode] ?? '#888888';

    try {
        await effect(mainView, accent, applyColorsFn);
    } catch (err) {
        lcardsLog.error(`[AlertTransitions] Transition '${style}' threw — applying palette directly:`, err);
        // Restore potentially-dirty state
        const _mainViewEl = /** @type {HTMLElement} */ (mainView);
        _mainViewEl.style.filter     = '';
        _mainViewEl.style.opacity    = '';
        _mainViewEl.style.transition = '';
        _mainViewEl.style.animation  = '';
        await applyColorsFn();
    }

    lcardsLog.debug(`[AlertTransitions] '${style}' transition complete for mode: ${mode}`);
}
