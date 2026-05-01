/**
 * @fileoverview BorgAssimilationEffect — Canvas2D screen-wide assimilation animation.
 *
 * Four-phase intro sequence:
 *   Phase 1 (0–600 ms)   : Signal corruption flicker
 *   Phase 2 (staggered)  : Glowing injection sites appear at random positions
 *   Phase 3 (per-site)   : Bézier tendrils grow outward from each injection site
 *   Phase 4 (at duration): rAF loop stops; cleanup fn is returned for SEM lifecycle
 *
 * The canvas uses `mixBlendMode: 'multiply'` so it composites on top of the live
 * HA UI rather than covering it — the Borg lattice literally grows over the interface.
 *
 * @module core/screen-effects/effects/BorgAssimilationEffect
 */

/**
 * Borg assimilation intro animation for a `<canvas>` slot element.
 *
 * @param {HTMLCanvasElement} canvas - The managed canvas slot element.
 * @param {Object} params
 * @param {number}  [params.siteCount=7]          - Number of injection sites.
 * @param {number}  [params.tendrilsPerSite=8]    - Bézier tendrils per site.
 * @param {string}  [params.color='#00cc44']      - Primary tendril / site colour.
 * @param {string}  [params.glowColor='#00ff66']  - Inner glow colour at each site.
 * @returns {() => void} Cleanup function that cancels the rAF loop and resets styles.
 *   The effect runs indefinitely until this cleanup is called — the caller is
 *   responsible for dismissal (e.g. user click or timeout in BorgAssimilationManager).
 */
export function BorgAssimilationEffect(canvas, params = {}) {
    const {
        siteCount       = 7,
        tendrilsPerSite = 8,
        color           = '#00cc44',
        glowColor       = '#00ff66',
    } = params;

    // Composite over the live UI rather than covering it.
    canvas.style.mixBlendMode = 'multiply';

    const ctx    = canvas.getContext('2d');
    let rafId    = null;
    let running  = true;
    const startT = performance.now();

    // ── Resolve canvas dimensions ─────────────────────────────────────────────
    // The canvas element is sized by SEM; parentElement dimensions are reliable.
    function _w() { return canvas.parentElement?.clientWidth  || window.innerWidth; }
    function _h() { return canvas.parentElement?.clientHeight || window.innerHeight; }

    // ── Build injection sites ─────────────────────────────────────────────────
    const W0 = _w();
    const H0 = _h();

    const sites = Array.from({ length: siteCount }, () => {
        const sx = Math.random() * W0;
        const sy = Math.random() * H0;
        const tendrils = [];
        for (let i = 0; i < tendrilsPerSite; i++) {
            const angle  = (i / tendrilsPerSite) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
            const length = 80 + Math.random() * 250;
            tendrils.push({
                cp1x: sx + Math.cos(angle + 0.3) * length * 0.4,
                cp1y: sy + Math.sin(angle + 0.3) * length * 0.4,
                cp2x: sx + Math.cos(angle - 0.2) * length * 0.7,
                cp2y: sy + Math.sin(angle - 0.2) * length * 0.7,
                ex:   sx + Math.cos(angle) * length,
                ey:   sy + Math.sin(angle) * length,
                width: 0.5 + Math.random() * 2,
            });
        }
        return {
            x:       sx,
            y:       sy,
            radius:  0,
            maxR:    20 + Math.random() * 30,
            spawnAt: 500 + Math.random() * 3000,
            tendrils,
        };
    });

    // ── Draw loop ─────────────────────────────────────────────────────────────
    function draw(now) {
        if (!running) return;
        const elapsed = now - startT;
        const W = _w();
        const H = _h();

        // Keep canvas buffer in sync with slot size.
        if (canvas.width !== W || canvas.height !== H) {
            canvas.width  = W;
            canvas.height = H;
        }

        ctx.clearRect(0, 0, W, H);

        // ── Phase 1: signal corruption flicker (0–600 ms) ───────────────────
        if (elapsed < 600) {
            if (Math.random() > 0.4) {
                ctx.fillStyle = `rgba(0, ${Math.floor(Math.random() * 80)}, 0, 0.35)`;
                ctx.fillRect(0, 0, W, H);
            }
            rafId = requestAnimationFrame(draw);
            return;
        }

        // ── Phase 2 & 3: injection sites + tendrils ──────────────────────────
        sites.forEach(site => {
            if (elapsed < site.spawnAt) return;
            const siteElapsed = elapsed - site.spawnAt;

            // Grow glow circle
            site.radius = Math.min(site.maxR, site.maxR * (siteElapsed / 400));

            // Gentle pulse after reaching full size — keeps the injection sites alive.
            const pulse = 1 + 0.12 * Math.sin(elapsed / 700 + site.x * 0.01);
            const displayRadius = site.radius * pulse;

            // Injection site radial glow
            const grd = ctx.createRadialGradient(site.x, site.y, 0, site.x, site.y, displayRadius);
            grd.addColorStop(0,   glowColor);
            grd.addColorStop(0.6, color);
            grd.addColorStop(1,   'transparent');
            ctx.beginPath();
            ctx.arc(site.x, site.y, displayRadius, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            // Tendrils begin growing 300 ms after site spawns
            if (siteElapsed > 300) {
                const tendrilProgress = Math.min(1, (siteElapsed - 300) / 3500);

                site.tendrils.forEach(t => {
                    const steps = Math.floor(tendrilProgress * 40);
                    if (steps < 2) return;

                    ctx.beginPath();
                    ctx.moveTo(site.x, site.y);

                    // Walk the cubic Bézier up to `tendrilProgress`
                    for (let s = 1; s <= steps; s++) {
                        const p  = s / 40;
                        const q  = 1 - p;
                        const bx = q*q*q*site.x + 3*q*q*p*t.cp1x + 3*q*p*p*t.cp2x + p*p*p*t.ex;
                        const by = q*q*q*site.y + 3*q*q*p*t.cp1y + 3*q*p*p*t.cp2y + p*p*p*t.ey;
                        ctx.lineTo(bx, by);
                    }

                    ctx.strokeStyle = color;
                    ctx.lineWidth   = t.width;
                    ctx.globalAlpha = 0.7 * tendrilProgress;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                });
            }
        });

        // Loop runs indefinitely — BorgAssimilationManager handles dismissal
        // (click-to-dismiss or optional timeout).  Cleanup fn stops the rAF.
        rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
        running = false;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.mixBlendMode = '';
    };
}
