/**
 * @fileoverview BorgAssimilationEffect — main-thread entry point + inline worker.
 *
 * Creates a sibling <canvas> alongside the SEM-managed slot canvas, then runs
 * the draw loop in a DedicatedWorker via an inline Blob URL.  A Blob worker
 * (rather than a separate worker file URL) keeps the effect self-contained:
 * no extra file has to be resolved against the integration's static path.
 *
 * Two renderers:
 *   - WebGL2 (`renderer: auto`/`webgl`, the default): BorgAssimilationGLWorker.js
 *     draws the layout from borg-layout.js (assimilation front, circuitry,
 *     glowing tendrils, the Borg cube, signal corruption).
 *   - Classic Canvas2D (`renderer: canvas`): BorgAssimilationWorker.js, unchanged.
 * Without WebGL2, or when the GL worker reports a failure, the classic one runs.
 *
 * The worker sources are `?raw` strings in a lazy chunk (borg-worker-sources.js),
 * loaded when the effect starts.
 *
 * The SEM-provided canvas is never transferred so it remains usable by
 * other effects (GlitchEffect, etc.) after the Borg sequence finishes.
 *
 * @module core/screen-effects/effects/BorgAssimilationEffect
 */

import { buildBorgLayout, BORG_FRONT_MS } from './borg-layout.js';
import { parseColor } from '../../themes/color-syntax.js';
import { webglAvailable } from '../../packs/backgrounds/webgl/webgl-support.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { prefersReducedMotion, onReducedMotionChange } from '../../../utils/reduced-motion.js';

/**
 * A resolved colour as 0-1 floats for the shaders.
 * @param {unknown} value
 * @param {number[]} fallback
 * @returns {number[]}
 */
function colorFloats(value, fallback) {
    const c = parseColor(typeof value === 'string' ? value : '');
    return c ? [c.r / 255, c.g / 255, c.b / 255] : fallback;
}

/**
 * Borg assimilation intro animation for a `<canvas>` slot element.
 *
 * @param {HTMLCanvasElement} canvas - The managed canvas slot element (not transferred).
 * @param {Object} params
 * @param {number}  [params.siteCount=7]          - Number of injection sites.
 * @param {number}  [params.tendrilsPerSite=8]    - Bézier tendrils per site.
 * @param {number}  [params.tendrilLength=600]    - Maximum tendril length in px.
 * @param {number}  [params.particleCount=2]      - Nano-probe particles (WebGL: pulses) per tendril.
 * @param {string}  [params.color='#00cc44']      - Primary tendril / site colour.
 * @param {string}  [params.glowColor='#00ff66']  - Inner glow colour at each site.
 * @param {string}  [params.renderer='auto']      - 'auto' | 'webgl' | 'canvas' (the classic intro).
 * @param {boolean} [params.cube=true]            - WebGL: the Borg cube at the centre.
 * @param {string}  [params.cubeStyle='detailed'] - WebGL: 'detailed' (solid cube with machinery,
 *                                                  lattice, glow spots, halo) or 'classic' (wireframe).
 * @param {number}  [params.corruption=0.5]       - WebGL: signal corruption strength, 0 to 1.
 * @param {number}  [params.overrun=0.65]         - WebGL: darkness behind the assimilation front, 0 to 1.
 * @param {number}  [params.seed]                 - WebGL: the same layout every time.
 * @returns {() => void} Cleanup function — stops the worker and removes the sibling canvas.
 */
/** True when this browser can draw the intro (OffscreenCanvas and Worker). */
export function borgIntroSupported() {
    return typeof HTMLCanvasElement !== 'undefined'
        && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function'
        && typeof Worker !== 'undefined';
}

export function BorgAssimilationEffect(canvas, params = {}) {
    const parent = canvas.parentElement;
    if (!parent) return () => {}; // effect canvas not mounted: nothing to attach a sibling to
    if (!borgIntroSupported()) {
        lcardsLog.debug('[BorgAssimilationEffect] OffscreenCanvas or Worker not available: effect skipped');
        return () => {};
    }

    /** @type {{ worker: Worker, blobUrl: string, canvas: HTMLCanvasElement } | null} */
    let current = null;
    /** @type {{ classicWorkerSource: string, glWorkerSource: string } | null} */
    let sources = null;
    let stopped = false;
    const size = () => ({ w: parent.clientWidth || window.innerWidth, h: parent.clientHeight || window.innerHeight });

    /**
     * Start one worker on a fresh sibling canvas.
     * @param {'webgl'|'canvas'} kind
     */
    const launch = (kind) => {
        if (!sources) return;
        const { w: W, h: H } = size();
        // Create a fresh sibling canvas that we own and can safely transfer.
        // The SEM-provided `canvas` is left untouched so other effects can reuse it.
        const ownCanvas = document.createElement('canvas');
        ownCanvas.width  = W;
        ownCanvas.height = H;
        ownCanvas.dataset.lcardsRenderer = kind;
        Object.assign(ownCanvas.style, {
            position:      'absolute',
            inset:         '0',
            width:         '100%',
            height:        '100%',
            pointerEvents: 'none',
            // The classic draws dark-on-light through multiply; the WebGL picture
            // carries its own alpha (the overrun behind the front)
            mixBlendMode:  kind === 'canvas' ? 'multiply' : 'normal',
            // Promote to own compositor layer so compositing is GPU-accelerated.
            willChange:    'transform',
        });

        // Insert immediately after the SEM canvas so z-order is correct.
        parent.insertBefore(ownCanvas, canvas.nextSibling);

        // Build an inline Blob worker from the pre-bundled source string.
        // URL.createObjectURL is revoked in the cleanup function.
        const blobUrl = URL.createObjectURL(
            new Blob([kind === 'webgl' ? sources.glWorkerSource : sources.classicWorkerSource], { type: 'application/javascript' })
        );
        const worker = new Worker(blobUrl);
        current = { worker, blobUrl, canvas: ownCanvas };

        // Transfer our sibling canvas to the worker thread.
        const offscreen = ownCanvas.transferControlToOffscreen();
        // The worker has no matchMedia: it gets the reduced-motion setting here and on change
        const reducedMotion = prefersReducedMotion();
        if (kind === 'canvas') {
            worker.postMessage({ type: 'start', canvas: offscreen, params, reducedMotion }, [offscreen]);
            return;
        }

        worker.onmessage = (e) => {
            const msg = e.data ?? {};
            if (msg.type === 'fallback') {
                lcardsLog.info(`[BorgAssimilationEffect] WebGL intro unavailable (${msg.reason}): playing the classic intro`);
                if (stopped || current?.worker !== worker) return;
                dispose(current);
                launch('canvas');
            } else if (msg.type === 'stats') {
                ownCanvas.dataset.lcardsFps = String(msg.fps);
                lcardsLog.debug(`[BorgAssimilationEffect] WebGL intro: ${msg.fps} fps`);
            } else if (msg.type === 'ready') {
                ownCanvas.dataset.lcardsReady = 'true';
            }
        };
        worker.postMessage({
            type: 'start',
            canvas: offscreen,
            layout: buildBorgLayout(W, H, params),
            colors: {
                color: colorFloats(params.color, [0, 0.8, 0.27]),
                glow: colorFloats(params.glowColor, [0, 1, 0.4]),
            },
            options: {
                cube: params.cube !== false,
                cubeStyle: params.cubeStyle === 'classic' ? 'classic' : 'detailed',
                corruption: Number.isFinite(Number(params.corruption)) ? Number(params.corruption) : 0.5,
                overrun: Number.isFinite(Number(params.overrun)) ? Number(params.overrun) : 0.65,
                particleCount: Number.isFinite(Number(params.particleCount)) ? Number(params.particleCount) : 2,
                frontMs: BORG_FRONT_MS,
            },
            reducedMotion,
        }, [offscreen]);
    };

    /** @param {{ worker: Worker, blobUrl: string, canvas: HTMLCanvasElement } | null} run */
    const dispose = (run) => {
        if (!run) return;
        run.worker.terminate();
        URL.revokeObjectURL(run.blobUrl);
        run.canvas.remove();
        if (current === run) current = null;
    };

    const renderer = params.renderer === 'canvas' ? 'canvas' : 'webgl';
    import('./borg-worker-sources.js').then((mod) => {
        if (stopped) return;
        sources = mod;
        launch(renderer === 'webgl' && webglAvailable() ? 'webgl' : 'canvas');
    }).catch((err) => lcardsLog.warn('[BorgAssimilationEffect] Could not load the intro:', err));

    const unsubscribeMotion = onReducedMotionChange((reduced) => current?.worker.postMessage({ type: 'motion', reduced }));

    // Forward resize events so the draw buffer matches the container.
    let _ro = null;
    if (typeof ResizeObserver !== 'undefined') {
        _ro = new ResizeObserver(entries => {
            const rect = entries[0]?.contentRect;
            if (!rect) return;
            current?.worker.postMessage({
                type:   'resize',
                width:  Math.round(rect.width),
                height: Math.round(rect.height),
            });
        });
        _ro.observe(parent);
    }

    return () => {
        stopped = true;
        if (_ro) { _ro.disconnect(); _ro = null; }
        unsubscribeMotion?.();
        const run = current;
        if (!run) return;
        run.worker.postMessage({ type: 'stop' });
        // Give the worker one tick to clear the canvas before terminating.
        setTimeout(() => dispose(run), 100);
    };
}
