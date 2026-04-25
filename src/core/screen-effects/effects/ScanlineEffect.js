/**
 * @fileoverview ScanlineEffect — CRT horizontal scanline overlay.
 *
 * Draws alternating semi-transparent horizontal bands over the full viewport
 * to simulate a CRT display.  Optionally animates a slow vertical scroll for
 * a rolling-interference look.
 *
 * @module core/screen-effects/effects/ScanlineEffect
 */

/**
 * CRT scanline overlay for a `<canvas>` slot element.
 *
 * @param {HTMLCanvasElement} canvas - The managed canvas slot element.
 * @param {Object} params
 * @param {number} [params.lineHeight=4]  - Pixel height of each scanline pair.
 * @param {number} [params.opacity=0.25]  - Opacity of dark lines (0–1).
 * @param {number} [params.scroll=0]      - Vertical scroll speed in px/s (0 = static).
 * @returns {() => void} Cleanup function that stops the rAF loop.
 */
export function ScanlineEffect(canvas, params = {}) {
    const {
        lineHeight = 4,
        opacity    = 0.25,
        scroll     = 0,
    } = params;

    canvas.style.opacity = '1'; // individual line colours carry opacity

    let rafId  = null;
    let offset = 0;
    let last   = performance.now();
    let running = true;
    let drawnOnce = false;
    let lastPw = 0;
    let lastPh = 0;

    function draw(now) {
        if (!running) return;
        rafId = requestAnimationFrame(draw);

        const dt = (now - last) / 1000;
        last     = now;

        if (scroll !== 0) offset = (offset + scroll * dt) % (lineHeight * 2);

        const pw = canvas.parentElement?.offsetWidth  || window.innerWidth;
        const ph = canvas.parentElement?.offsetHeight || window.innerHeight;

        // Skip redraw when static (scroll=0) and canvas size hasn't changed.
        if (scroll === 0 && drawnOnce && pw === lastPw && ph === lastPh) return;

        if (canvas.width !== pw || canvas.height !== ph) {
            canvas.width  = pw;
            canvas.height = ph;
        }
        lastPw = pw;
        lastPh = ph;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, pw, ph);

        // Dark scanlines
        ctx.fillStyle = `rgba(0,0,0,${opacity})`;
        const period = lineHeight * 2;
        const start  = (Math.floor(-offset) % period + period) % period - period;
        for (let y = start; y < ph; y += period) {
            ctx.fillRect(0, y, pw, lineHeight);
        }
        drawnOnce = true;
    }

    rafId = requestAnimationFrame(draw);

    return () => {
        running = false;
        if (rafId !== null) cancelAnimationFrame(rafId);
        canvas.style.opacity = '';
    };
}
