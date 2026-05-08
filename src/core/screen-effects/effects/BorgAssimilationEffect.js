/**
 * @fileoverview BorgAssimilationEffect — main-thread entry point + inline worker.
 *
 * Creates a sibling <canvas> alongside the SEM-managed slot canvas, then runs
 * the draw loop in a DedicatedWorker via an inline Blob URL.  Using a Blob
 * worker (rather than a separate chunk URL) is required because the LCARdS
 * bundle uses `inlineDynamicImports: true`, which prevents Vite from splitting
 * out a Worker chunk file.
 *
 * The worker source is imported with the `?raw` Vite suffix — a static import
 * that Vite inlines as a plain string at build time, compatible with
 * `inlineDynamicImports: true`.
 *
 * The SEM-provided canvas is never transferred so it remains usable by
 * other effects (GlitchEffect, etc.) after the Borg sequence finishes.
 *
 * @module core/screen-effects/effects/BorgAssimilationEffect
 */

// @ts-expect-error — Vite ?raw suffix is a build-time import; TypeScript cannot resolve relative ?raw paths
import workerSource from './BorgAssimilationWorker.js?raw';

/**
 * Borg assimilation intro animation for a `<canvas>` slot element.
 *
 * @param {HTMLCanvasElement} canvas - The managed canvas slot element (not transferred).
 * @param {Object} params
 * @param {number}  [params.siteCount=7]          - Number of injection sites.
 * @param {number}  [params.tendrilsPerSite=8]    - Bézier tendrils per site.
 * @param {number}  [params.tendrilLength=600]    - Maximum tendril length in px.
 * @param {number}  [params.particleCount=2]      - Nano-probe particles per tendril.
 * @param {string}  [params.color='#00cc44']      - Primary tendril / site colour.
 * @param {string}  [params.glowColor='#00ff66']  - Inner glow colour at each site.
 * @returns {() => void} Cleanup function — stops the worker and removes the sibling canvas.
 */
export function BorgAssimilationEffect(canvas, params = {}) {
    const parent = canvas.parentElement;
    const W = parent?.clientWidth  || window.innerWidth;
    const H = parent?.clientHeight || window.innerHeight;

    // Create a fresh sibling canvas that we own and can safely transfer.
    // The SEM-provided `canvas` is left untouched so other effects can reuse it.
    const ownCanvas = document.createElement('canvas');
    ownCanvas.width  = W;
    ownCanvas.height = H;
    Object.assign(ownCanvas.style, {
        position:      'absolute',
        inset:         '0',
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        mixBlendMode:  'multiply',
        // Promote to own compositor layer so mix-blend-mode compositing is GPU-accelerated.
        willChange:    'transform',
    });

    // Insert immediately after the SEM canvas so z-order is correct.
    if (canvas.nextSibling) {
        parent.insertBefore(ownCanvas, canvas.nextSibling);
    } else {
        parent.appendChild(ownCanvas);
    }

    // Build an inline Blob worker from the pre-bundled source string.
    // URL.createObjectURL is revoked in the cleanup function.
    const blobUrl = URL.createObjectURL(
        new Blob([workerSource], { type: 'application/javascript' })
    );
    const worker = new Worker(blobUrl);

    // Transfer our sibling canvas to the worker thread.
    const offscreen = ownCanvas.transferControlToOffscreen();
    worker.postMessage({ type: 'start', canvas: offscreen, params }, [offscreen]);

    // Forward resize events so the draw buffer matches the container.
    let _ro = null;
    if (parent && typeof ResizeObserver !== 'undefined') {
        _ro = new ResizeObserver(entries => {
            const rect = entries[0]?.contentRect;
            if (!rect) return;
            worker.postMessage({
                type:   'resize',
                width:  Math.round(rect.width),
                height: Math.round(rect.height),
            });
        });
        _ro.observe(parent);
    }

    return () => {
        if (_ro) { _ro.disconnect(); _ro = null; }
        worker.postMessage({ type: 'stop' });
        // Give the worker one tick to clear the canvas before terminating.
        setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(blobUrl);
            ownCanvas.remove();
        }, 100);
    };
}
