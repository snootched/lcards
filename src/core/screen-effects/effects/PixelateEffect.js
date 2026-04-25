/**
 * @fileoverview PixelateEffect — mosaic / large-pixel screen effect.
 *
 * Covers the viewport with a grid of large solid-coloured rectangles, giving
 * the impression of extreme downscaling.  Because canvas2D cannot sample
 * arbitrary DOM content (cross-origin restriction), this draws synthetic
 * colour blocks derived from the supplied `color` parameter rather than true
 * viewport pixelation.
 *
 * @module core/screen-effects/effects/PixelateEffect
 */

/**
 * Mosaic pixel-block effect for a `<canvas>` slot element.
 *
 * Draws a grid of small semi-transparent dark blocks with subtle warm/cool
 * lightness variance, simulating the look of extreme video downsampling or
 * bitrate-crushed signal degradation.  Uses `mix-blend-mode: multiply` so
 * the blocks darken and desaturate the underlying content without flooding it
 * with colour.
 *
 * @param {HTMLCanvasElement} canvas - The managed canvas slot element.
 * @param {Object} params
 * @param {number} [params.pixelSize=8]    - Block size in logical pixels.
 * @param {number} [params.opacity=0.75]   - Overall canvas opacity (0–1).
 * @param {number} [params.variance=0.35]  - Lightness jitter per block (0–1).
 *                                           0 = uniform, 1 = max contrast.
 * @param {number} [params.baseLight=80]   - Base grey lightness 0–255.
 * @returns {() => void} Cleanup function that stops the rAF loop.
 */
export function PixelateEffect(canvas, params = {}) {
    const {
        pixelSize = 8,
        opacity   = 0.75,
        variance  = 0.35,
        baseLight = 80,
    } = params;

    canvas.style.opacity      = String(opacity);
    canvas.style.mixBlendMode = 'multiply';

    let rafId   = null;
    let timerId = null;
    let running = true;

    function draw() {
        if (!running) return;

        const pw = canvas.parentElement?.offsetWidth  || window.innerWidth;
        const ph = canvas.parentElement?.offsetHeight || window.innerHeight;
        if (canvas.width !== pw || canvas.height !== ph) {
            canvas.width  = pw;
            canvas.height = ph;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, pw, ph);

        for (let y = 0; y < ph; y += pixelSize) {
            for (let x = 0; x < pw; x += pixelSize) {
                // Slight warm/cool tint: random hue ±15° around neutral gray
                const hue  = 200 + Math.floor(Math.random() * 30) - 15;
                const sat  = Math.floor(Math.random() * 8);   // near-monochrome
                const lite = Math.floor(
                    baseLight * (1 - variance * 0.5 + Math.random() * variance)
                );
                ctx.fillStyle = `hsl(${hue},${sat}%,${lite}%)`;
                ctx.fillRect(x, y, pixelSize, pixelSize);
            }
        }

        // ~8 fps — slow enough to look like quantisation noise.
        timerId = setTimeout(() => {
            rafId = requestAnimationFrame(draw);
        }, 120);
    }

    rafId = requestAnimationFrame(draw);

    return () => {
        running = false;
        clearTimeout(timerId);
        if (rafId !== null) cancelAnimationFrame(rafId);
        canvas.style.opacity      = '';
        canvas.style.mixBlendMode = '';
    };
}
