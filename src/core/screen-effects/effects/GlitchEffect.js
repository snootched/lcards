/**
 * @fileoverview GlitchEffect — horizontal scanline glitch screen effect.
 *
 * Renders randomly shifted horizontal scanlines and chromatic-aberration
 * colour splits directly onto a `<canvas>` element.  Periodically injects
 * a full-row stutter bar for a data-corruption look.
 *
 * @module core/screen-effects/effects/GlitchEffect
 */

/**
 * Horizontal scanline glitch effect for a `<canvas>` slot element.
 *
 * Simulates video-signal corruption by drawing a sparse set of narrow
 * horizontal bands offset left or right, plus thin chroma-aberration
 * edge lines and occasional full-width stutter bars.  Uses
 * `mix-blend-mode: overlay` so the underlying content shows through.
 *
 * @param {HTMLCanvasElement} canvas - The managed canvas slot element.
 * @param {Object} params
 * @param {number} [params.intensity=0.08] - Fraction of row-bands active per frame (0–1).
 *                                           Keep low (0.05–0.15) for a subtle look.
 * @param {number} [params.maxShift=40]    - Maximum horizontal offset in px.
 * @param {number} [params.bandHeight=4]   - Height of each glitch band in px.
 * @param {number} [params.opacity=0.85]   - Overall canvas opacity (0–1).
 * @param {number} [params.fps=20]         - Target animation frame rate.
 * @returns {() => void} Cleanup function that stops the rAF loop.
 */
export function GlitchEffect(canvas, params = {}) {
    const {
        intensity  = 0.08,
        maxShift   = 40,
        bandHeight = 4,
        opacity    = 0.85,
        fps        = 20,
    } = params;

    canvas.style.opacity      = String(opacity);
    canvas.style.mixBlendMode = 'overlay';

    const frameMs = 1000 / fps;
    let lastFrame = 0;
    let rafId     = null;
    let running   = true;

    function draw(now) {
        if (!running) return;
        rafId = requestAnimationFrame(draw);

        if (now - lastFrame < frameMs) return;
        lastFrame = now;

        const pw = canvas.parentElement?.offsetWidth  || window.innerWidth;
        const ph = canvas.parentElement?.offsetHeight || window.innerHeight;
        if (canvas.width !== pw || canvas.height !== ph) {
            canvas.width  = pw;
            canvas.height = ph;
        }

        const ctx  = canvas.getContext('2d');
        const rows = Math.ceil(ph / bandHeight);
        ctx.clearRect(0, 0, pw, ph);

        for (let i = 0; i < rows; i++) {
            if (Math.random() > intensity) continue;

            const y     = i * bandHeight;
            const shift = (Math.random() - 0.5) * 2 * maxShift;

            // Main displaced band — white-ish so overlay blend shifts the
            // underlying content colour rather than flooding it.
            ctx.fillStyle = `rgba(255,255,255,0.18)`;
            ctx.fillRect(shift, y, pw, bandHeight);

            // Thin red chroma edge (+x)
            ctx.fillStyle = `rgba(255,40,80,0.45)`;
            ctx.fillRect(shift + Math.abs(shift) * 0.1, y, pw * 0.15, 1);

            // Thin cyan chroma edge (−x)
            ctx.fillStyle = `rgba(0,220,255,0.35)`;
            ctx.fillRect(-shift * 0.5, y + bandHeight - 1, pw * 0.12, 1);
        }

        // Occasional full-width stutter bar (rare).
        if (Math.random() > 0.94) {
            const y = Math.floor(Math.random() * ph);
            const h = Math.floor(Math.random() * 8) + 2;
            ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.15})`;
            ctx.fillRect(0, y, pw, h);
        }
    }

    rafId = requestAnimationFrame(draw);

    return () => {
        running = false;
        if (rafId !== null) cancelAnimationFrame(rafId);
        canvas.style.opacity      = '';
        canvas.style.mixBlendMode = '';
    };
}
