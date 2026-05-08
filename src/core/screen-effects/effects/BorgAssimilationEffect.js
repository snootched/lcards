/**
 * @fileoverview BorgAssimilationEffect — Canvas2D screen-wide assimilation animation.
 *
 * Enhanced four-phase sequence with full lattice simulation:
 *   Phase 1 (0–600 ms)    : Signal corruption — scan bar sweep + faint flicker
 *   Phase 2 (staggered)   : Glowing injection sites with hex spawn ring + dark bloom
 *   Phase 3 (per-site)    : Tapered gradient tendrils grow, then branch sprouts appear
 *   Phase 4 (post-growth) : Cross-site bridges connect nearby endpoints; nano-probe
 *                           particles traverse all paths; pulse rings emanate from sites
 *
 * The canvas uses `mixBlendMode: 'multiply'` so it composites on top of the live
 * HA UI rather than covering it — the Borg lattice literally grows over the interface.
 *
 * @module core/screen-effects/effects/BorgAssimilationEffect
 */

import { ColorUtils } from '../../themes/ColorUtils.js';

// ─── Local Utilities ──────────────────────────────────────────────────────────

/**
 * Scalar cubic Bézier evaluator.
 *
 * @param {number} t   - Parameter 0–1
 * @param {number} p0  - Start value
 * @param {number} cp1 - Control point 1
 * @param {number} cp2 - Control point 2
 * @param {number} p1  - End value
 * @returns {number}
 */
function _bz(t, p0, cp1, cp2, p1) {
    const q = 1 - t;
    return q*q*q*p0 + 3*q*q*t*cp1 + 3*q*t*t*cp2 + t*t*t*p1;
}

/**
 * Shift the hue of a materialized color string (#hex, rgb(), or rgba()) by `deg` degrees.
 *
 * SEM's `_resolveColorParams()` guarantees that `color-text` params are materialized
 * to concrete RGB/hex values before `enter()` is called — CSS variable handling is
 * not needed here.  Unrecognised formats are returned unchanged.
 *
 * @param {string} css - Materialized color string (#rrggbb, rgb(), or rgba())
 * @param {number} deg - Hue rotation in degrees
 * @returns {string}   - #rrggbb hex string with shifted hue, or original string on failure
 */
function _shiftHue(css, deg) {
    let r, g, b;
    const hex6 = css.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (hex6) {
        r = parseInt(hex6[1], 16);
        g = parseInt(hex6[2], 16);
        b = parseInt(hex6[3], 16);
    } else {
        const rgb = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (!rgb) return css;
        r = +rgb[1]; g = +rgb[2]; b = +rgb[3];
    }

    // RGB → HSL
    const rf = r / 255, gf = g / 255, bf = b / 255;
    const cmax = Math.max(rf, gf, bf), cmin = Math.min(rf, gf, bf);
    const d = cmax - cmin;
    const l = (cmax + cmin) / 2;
    let h = 0, s = 0;
    if (d > 0) {
        s = l > 0.5 ? d / (2 - cmax - cmin) : d / (cmax + cmin);
        switch (cmax) {
            case rf: h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6; break;
            case gf: h = ((bf - rf) / d + 2) / 6; break;
            default: h = ((rf - gf) / d + 4) / 6;
        }
    }

    // Shift hue
    h = ((h * 360 + deg) % 360 + 360) % 360 / 360;

    // HSL → RGB
    let r2, g2, b2;
    if (s === 0) {
        r2 = g2 = b2 = l;
    } else {
        const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p2 = 2 * l - q2;
        const hue2rgb = (t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
            if (t < 1 / 2) return q2;
            if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
            return p2;
        };
        r2 = hue2rgb(h + 1 / 3);
        g2 = hue2rgb(h);
        b2 = hue2rgb(h - 1 / 3);
    }

    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}

// ─── Shared draw helpers (module-level, no per-call allocation) ───────────────

/**
 * Draw one tendril or branch using the tapered-width, linear-gradient technique.
 * Each Bézier step is a separate stroke so lineWidth can taper per-segment.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} sx              Origin X
 * @param {number} sy              Origin Y
 * @param {number} cp1x
 * @param {number} cp1y
 * @param {number} cp2x
 * @param {number} cp2y
 * @param {number} ex              Final endpoint X
 * @param {number} ey              Final endpoint Y
 * @param {number} baseWidth       Root line width — tapers to near-zero at the tip
 * @param {string} hueShiftedColor Hue-shifted primary colour (hex)
 * @param {string} hueShiftedGlow  Hue-shifted glow colour (hex)
 * @param {number} progress        Growth progress 0–1
 */
function _drawTendril(ctx, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey,
                      baseWidth, hueShiftedColor, hueShiftedGlow, progress) {
    const STEPS = 40;
    const steps = Math.floor(progress * STEPS);
    if (steps < 2) return;

    // Current growth frontier
    const tipT = steps / STEPS;
    const tipX = _bz(tipT, sx, cp1x, cp2x, ex);
    const tipY = _bz(tipT, sy, cp1y, cp2y, ey);

    // Skip degenerate gradient (tip coincident with origin)
    if (Math.abs(tipX - sx) < 0.5 && Math.abs(tipY - sy) < 0.5) return;

    // Gradient from bright root → hue-shifted mid → transparent tip.
    // The tip is always transparent whether growing or fully grown.
    const grad = ctx.createLinearGradient(sx, sy, tipX, tipY);
    grad.addColorStop(0.00, ColorUtils.alpha(hueShiftedGlow,  0.9));
    grad.addColorStop(0.35, ColorUtils.alpha(hueShiftedColor, 0.85));
    grad.addColorStop(0.75, ColorUtils.alpha(hueShiftedColor, 0.4));
    grad.addColorStop(1.00, ColorUtils.alpha(hueShiftedColor, 0.0));

    ctx.strokeStyle = grad;
    ctx.lineCap     = 'round';

    let prevX = sx, prevY = sy;
    for (let s = 1; s <= steps; s++) {
        const p    = s / STEPS;
        const curX = _bz(p, sx, cp1x, cp2x, ex);
        const curY = _bz(p, sy, cp1y, cp2y, ey);

        // Power-curve taper: thick at root, near-zero at tip
        ctx.lineWidth = Math.max(0.3, baseWidth * Math.pow(1 - p, 0.6));
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        prevX = curX;
        prevY = curY;
    }
}

/**
 * Draw nano-probe particles travelling a Bézier path.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} sx   Path origin X
 * @param {number} sy   Path origin Y
 * @param {number} cp1x
 * @param {number} cp1y
 * @param {number} cp2x
 * @param {number} cp2y
 * @param {number} ex
 * @param {number} ey
 * @param {Array<{phase:number, speed:number}>} particles
 * @param {number} progress  Current growth progress 0–1
 * @param {number} elapsed   Elapsed time in ms
 * @param {string} hueShiftedGlow
 */
function _drawParticles(ctx, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey,
                        particles, progress, elapsed, hueShiftedGlow) {
    particles.forEach(pt => {
        const tParam = (pt.phase + pt.speed * elapsed / 1000) % 1;
        if (tParam > progress) return;

        const px = _bz(tParam, sx, cp1x, cp2x, ex);
        const py = _bz(tParam, sy, cp1y, cp2y, ey);

        // Radial halo
        const halo = ctx.createRadialGradient(px, py, 0, px, py, 8);
        halo.addColorStop(0, ColorUtils.alpha(hueShiftedGlow, 0.55));
        halo.addColorStop(1, ColorUtils.alpha(hueShiftedGlow, 0.0));
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // Bright core dot
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = hueShiftedGlow;
        ctx.fill();
    });
}

// ─── BorgAssimilationEffect ───────────────────────────────────────────────────

/**
 * Borg assimilation intro animation for a `<canvas>` slot element.
 *
 * @param {HTMLCanvasElement} canvas - The managed canvas slot element.
 * @param {Object} params
 * @param {number}  [params.siteCount=7]          - Number of injection sites.
 * @param {number}  [params.tendrilsPerSite=8]    - Bézier tendrils per site.
 * @param {number}  [params.tendrilLength=600]    - Maximum tendril length in px.
 * @param {number}  [params.particleCount=2]      - Nano-probe particles per tendril.
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
        tendrilLength   = 600,
        particleCount   = 2,
        color           = '#00cc44',
        glowColor       = '#00ff66',
    } = params;

    // Composite over the live UI rather than covering it.
    canvas.style.mixBlendMode = 'multiply';

    const ctx    = canvas.getContext('2d');
    let rafId    = null;
    let running  = true;
    const startT = performance.now();

    // ── Canvas dimensions ─────────────────────────────────────────────────────
    // The canvas element is sized by SEM; parentElement dimensions are reliable.
    function _w() { return canvas.parentElement?.clientWidth  || window.innerWidth; }
    function _h() { return canvas.parentElement?.clientHeight || window.innerHeight; }

    const W0 = _w();
    const H0 = _h();

    // ── Phase 1: scan bars (two bars sweep top→bottom within 600 ms) ─────────
    const scanBars = [
        { y0: -20, speed: H0 / 260 },
        { y0: -60, speed: H0 / 320 },
    ];

    // ── Bridge state — built once after all tendrils finish growing ───────────
    let bridges      = [];
    let bridgesBuilt = false;

    // ── Build injection sites ─────────────────────────────────────────────────
    const sites = Array.from({ length: siteCount }, () => {
        const sx = Math.random() * W0;
        const sy = Math.random() * H0;
        const tendrils = [];

        for (let i = 0; i < tendrilsPerSite; i++) {
            const angle     = (i / tendrilsPerSite) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
            const length    = tendrilLength * 0.2 + Math.random() * tendrilLength * 0.8;
            const hueShift  = (Math.random() - 0.5) * 24; // ±12° per tendril
            const baseWidth = 1.5 + Math.random() * 3.5;

            const cp1x = sx + Math.cos(angle + 0.3) * length * 0.4;
            const cp1y = sy + Math.sin(angle + 0.3) * length * 0.4;
            const cp2x = sx + Math.cos(angle - 0.2) * length * 0.7;
            const cp2y = sy + Math.sin(angle - 0.2) * length * 0.7;
            const ex   = sx + Math.cos(angle) * length;
            const ey   = sy + Math.sin(angle) * length;

            // Fork point at t=0.6 on parent Bézier; tangent for branch direction.
            const ft    = 0.6;
            const dt    = 0.01;
            const forkX = _bz(ft, sx, cp1x, cp2x, ex);
            const forkY = _bz(ft, sy, cp1y, cp2y, ey);
            const tangA = Math.atan2(
                _bz(ft + dt, sy, cp1y, cp2y, ey) - _bz(ft - dt, sy, cp1y, cp2y, ey),
                _bz(ft + dt, sx, cp1x, cp2x, ex) - _bz(ft - dt, sx, cp1x, cp2x, ex)
            );

            // 2–3 daughter branches diverging from the fork point
            const branchCount = 2 + Math.floor(Math.random() * 2);
            const branches    = [];
            for (let b = 0; b < branchCount; b++) {
                const bAngle = tangA + (Math.random() - 0.5) * 2 * (0.45 + Math.random() * 0.45);
                const bLen   = length * (0.2 + Math.random() * 0.2);
                const bHue   = hueShift + (Math.random() - 0.5) * 10;
                branches.push({
                    sx:    forkX,
                    sy:    forkY,
                    cp1x:  forkX + Math.cos(bAngle + 0.25) * bLen * 0.4,
                    cp1y:  forkY + Math.sin(bAngle + 0.25) * bLen * 0.4,
                    cp2x:  forkX + Math.cos(bAngle - 0.15) * bLen * 0.7,
                    cp2y:  forkY + Math.sin(bAngle - 0.15) * bLen * 0.7,
                    ex:    forkX + Math.cos(bAngle) * bLen,
                    ey:    forkY + Math.sin(bAngle) * bLen,
                    baseWidth:       baseWidth * 0.45,
                    hueShiftedColor: _shiftHue(color,     bHue),
                    hueShiftedGlow:  _shiftHue(glowColor, bHue),
                    particles: Array.from({ length: particleCount }, () => ({
                        phase: Math.random(),
                        speed: 0.06 + Math.random() * 0.08,
                    })),
                });
            }

            tendrils.push({
                cp1x, cp1y, cp2x, cp2y, ex, ey,
                baseWidth,
                hueShiftedColor: _shiftHue(color,     hueShift),
                hueShiftedGlow:  _shiftHue(glowColor, hueShift),
                particles: Array.from({ length: particleCount }, () => ({
                    phase: Math.random(),
                    speed: 0.06 + Math.random() * 0.08,
                })),
                branches,
            });
        }

        return {
            x:                 sx,
            y:                 sy,
            radius:            0,
            maxR:              20 + Math.random() * 30,
            spawnAt:           500 + Math.random() * 3000,
            tendrils,
            pulseRings:        [],
            lastPulseAt:       0,
            nextPulseInterval: 2000 + Math.random() * 1000,
        };
    });

    // Trigger bridge building once every site has definitely finished growing.
    const allGrownAt = Math.max(...sites.map(s => s.spawnAt)) + 300 + 3500;

    // ── Bridge builder — one-time call post-growth ────────────────────────────
    function _buildBridges(elapsed) {
        // Use primary tendril endpoints plus up to 1 branch tip per tendril
        // (the longest branch, measured by Euclidean distance from origin).
        // This restores visual complexity compared to tendril-only while keeping
        // the endpoint count ~2× rather than the 3-4× of all-branches-included.
        const endpoints = [];
        sites.forEach((site, sIdx) => {
            site.tendrils.forEach(t => {
                endpoints.push({ x: t.ex, y: t.ey, sIdx });

                // Pick the longest branch (if any) as an additional candidate.
                if (t.branches && t.branches.length > 0) {
                    let best = null, bestLen = 0;
                    t.branches.forEach(br => {
                        const dx = br.ex - br.sx; // branch start → tip
                        const dy = br.ey - br.sy;
                        const d  = dx * dx + dy * dy;
                        if (d > bestLen) { bestLen = d; best = br; }
                    });
                    if (best) endpoints.push({ x: best.ex, y: best.ey, sIdx });
                }
            });
        });

        // Cap each endpoint at 3 bridges — enough for visual richness without
        // every close pair getting connected.
        const bridgeCount = new Array(endpoints.length).fill(0);
        const MAX_PER_EP  = 3;

        const built = [];
        for (let i = 0; i < endpoints.length; i++) {
            for (let j = i + 1; j < endpoints.length; j++) {
                if (endpoints[i].sIdx === endpoints[j].sIdx) continue;
                if (bridgeCount[i] >= MAX_PER_EP || bridgeCount[j] >= MAX_PER_EP) continue;
                const dx   = endpoints[j].x - endpoints[i].x;
                const dy   = endpoints[j].y - endpoints[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 200) continue;

                // Quadratic Bézier control point: midpoint ± random perpendicular offset
                const mx   = (endpoints[i].x + endpoints[j].x) / 2;
                const my   = (endpoints[i].y + endpoints[j].y) / 2;
                const perp = (Math.random() - 0.5) * dist * 0.8;
                const pnx  = -dy / dist; // unit perpendicular
                const pny  =  dx / dist;
                const cpx  = mx + pnx * perp;
                const cpy  = my + pny * perp;

                // Junction node at quadratic Bézier midpoint (t=0.5)
                const jx = 0.25 * endpoints[i].x + 0.5 * cpx + 0.25 * endpoints[j].x;
                const jy = 0.25 * endpoints[i].y + 0.5 * cpy + 0.25 * endpoints[j].y;

                bridgeCount[i]++;
                bridgeCount[j]++;
                built.push({
                    ax: endpoints[i].x, ay: endpoints[i].y,
                    bx: endpoints[j].x, by: endpoints[j].y,
                    cpx, cpy,
                    junctionX: jx, junctionY: jy,
                    flashDelay: Math.random() * 2000, // stagger connection flashes
                    builtAt:   elapsed,
                });
            }
        }
        return built;
    }

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

        // ── Phase 1: scan bar sweep + faint flicker (0–600 ms) ───────────────
        if (elapsed < 600) {
            // Reduced-opacity background flicker
            if (Math.random() > 0.5) {
                ctx.fillStyle = `rgba(0, ${Math.floor(Math.random() * 60)}, 0, 0.15)`;
                ctx.fillRect(0, 0, W, H);
            }
            // Two scan bars sweep downward across the full screen
            scanBars.forEach(bar => {
                const y = bar.y0 + bar.speed * elapsed;
                const g = ctx.createLinearGradient(0, y - 8, 0, y + 20);
                g.addColorStop(0.0, 'rgba(0,255,80,0)');
                g.addColorStop(0.4, 'rgba(0,255,80,0.6)');
                g.addColorStop(0.7, 'rgba(0,200,60,0.4)');
                g.addColorStop(1.0, 'rgba(0,255,80,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, y - 8, W, 28);
            });
            rafId = requestAnimationFrame(draw);
            return;
        }

        // ── Per-site rendering ────────────────────────────────────────────────
        sites.forEach(site => {
            if (elapsed < site.spawnAt) return;
            const siteElapsed = elapsed - site.spawnAt;

            // Dark bloom: slow dark-green radial wash expanding to ~180 px over 5 s
            const bloomProgress = Math.min(1, siteElapsed / 5000);
            if (bloomProgress > 0) {
                const bloomR = 180 * bloomProgress;
                const bloom  = ctx.createRadialGradient(site.x, site.y, 0, site.x, site.y, bloomR);
                bloom.addColorStop(0, `rgba(0, 40, 0, ${0.25 * bloomProgress})`);
                bloom.addColorStop(1, 'rgba(0, 20, 0, 0)');
                ctx.beginPath();
                ctx.arc(site.x, site.y, bloomR, 0, Math.PI * 2);
                ctx.fillStyle = bloom;
                ctx.fill();
            }

            // Spawn hex ring: expanding hexagon for the first 600 ms after site appears
            if (siteElapsed < 600) {
                const hexProg  = siteElapsed / 600;
                const hexR     = hexProg * 60;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a  = (i / 6) * Math.PI * 2 - Math.PI / 6;
                    const hx = site.x + Math.cos(a) * hexR;
                    const hy = site.y + Math.sin(a) * hexR;
                    i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.strokeStyle = ColorUtils.alpha(glowColor, 1 - hexProg);
                ctx.lineWidth   = 1.5;
                ctx.stroke();
            }

            // Tendrils + branches + particles
            if (siteElapsed > 300) {
                const tendrilProgress = Math.min(1, (siteElapsed - 300) / 3500);
                const branchProgress  = tendrilProgress > 0.5
                    ? Math.min(1, (tendrilProgress - 0.5) / 0.5)
                    : 0;

                site.tendrils.forEach(t => {
                    _drawTendril(
                        ctx,
                        site.x, site.y, t.cp1x, t.cp1y, t.cp2x, t.cp2y, t.ex, t.ey,
                        t.baseWidth, t.hueShiftedColor, t.hueShiftedGlow,
                        tendrilProgress
                    );
                    _drawParticles(
                        ctx,
                        site.x, site.y, t.cp1x, t.cp1y, t.cp2x, t.cp2y, t.ex, t.ey,
                        t.particles, tendrilProgress, elapsed, t.hueShiftedGlow
                    );

                    // Branches start growing once parent is past 50%
                    if (branchProgress > 0) {
                        t.branches.forEach(br => {
                            _drawTendril(
                                ctx,
                                br.sx, br.sy, br.cp1x, br.cp1y, br.cp2x, br.cp2y, br.ex, br.ey,
                                br.baseWidth, br.hueShiftedColor, br.hueShiftedGlow,
                                branchProgress
                            );
                            _drawParticles(
                                ctx,
                                br.sx, br.sy, br.cp1x, br.cp1y, br.cp2x, br.cp2y, br.ex, br.ey,
                                br.particles, branchProgress, elapsed, br.hueShiftedGlow
                            );
                        });
                    }
                });
            }

            // Injection site glow circle — drawn on top of tendrils
            site.radius = Math.min(site.maxR, site.maxR * (siteElapsed / 400));
            const pulse         = 1 + 0.12 * Math.sin(elapsed / 700 + site.x * 0.01);
            const displayRadius = site.radius * pulse;
            const grd = ctx.createRadialGradient(site.x, site.y, 0, site.x, site.y, displayRadius);
            grd.addColorStop(0,   glowColor);
            grd.addColorStop(0.6, color);
            grd.addColorStop(1,   'transparent');
            ctx.beginPath();
            ctx.arc(site.x, site.y, displayRadius, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            // Pulse ring emission — sonar-style pings once the site is fully grown
            if (site.radius >= site.maxR * 0.9) {
                if (elapsed - site.lastPulseAt > site.nextPulseInterval) {
                    if (site.pulseRings.length >= 5) site.pulseRings.shift();
                    site.pulseRings.push({ startT: elapsed });
                    site.lastPulseAt       = elapsed;
                    site.nextPulseInterval = 2000 + Math.random() * 1000;
                }
            }

            // Draw + prune pulse rings
            site.pulseRings = site.pulseRings.filter(ring => {
                const ringProg = (elapsed - ring.startT) / 1500;
                if (ringProg >= 1) return false;
                ctx.beginPath();
                ctx.arc(site.x, site.y, ringProg * 80, 0, Math.PI * 2);
                ctx.strokeStyle = ColorUtils.alpha(glowColor, 0.5 * (1 - ringProg));
                ctx.lineWidth   = 1;
                ctx.stroke();
                return true;
            });
        });

        // ── Build bridges once all tendrils have finished growing ─────────────
        if (!bridgesBuilt && elapsed > allGrownAt) {
            bridges      = _buildBridges(elapsed);
            bridgesBuilt = true;
        }

        // ── Draw bridges + junction micro-nodes ───────────────────────────────
        if (bridgesBuilt) {
            bridges.forEach(br => {
                const age = elapsed - br.builtAt - br.flashDelay;
                if (age < 0) return; // flash delay not yet elapsed

                // Flash window: bright 0–400 ms after activation, then dim steady
                const flashAlpha = age < 400 ? (1 - age / 400) : 0;
                const arcAlpha   = Math.max(0.3, flashAlpha);

                ctx.beginPath();
                ctx.moveTo(br.ax, br.ay);
                ctx.quadraticCurveTo(br.cpx, br.cpy, br.bx, br.by);
                ctx.strokeStyle = ColorUtils.alpha(color, arcAlpha);
                ctx.lineWidth   = 0.8;
                ctx.lineCap     = 'round';
                ctx.stroke();

                // Junction node — fades in once the flash has settled, larger
                // so the network vertices are clearly visible.
                if (age > 200) {
                    const nodeAlpha = Math.min(1, (age - 200) / 300) * 0.85;
                    const nodeR     = 8 + 3 * Math.sin(elapsed / 600 + br.junctionX * 0.01);
                    const nodeGrd   = ctx.createRadialGradient(
                        br.junctionX, br.junctionY, 0,
                        br.junctionX, br.junctionY, nodeR
                    );
                    nodeGrd.addColorStop(0,   ColorUtils.alpha(glowColor, nodeAlpha));
                    nodeGrd.addColorStop(0.4, ColorUtils.alpha(glowColor, nodeAlpha * 0.7));
                    nodeGrd.addColorStop(0.7, ColorUtils.alpha(color,     nodeAlpha * 0.4));
                    nodeGrd.addColorStop(1,   ColorUtils.alpha(color,     0));
                    ctx.beginPath();
                    ctx.arc(br.junctionX, br.junctionY, nodeR, 0, Math.PI * 2);
                    ctx.fillStyle = nodeGrd;
                    ctx.fill();
                }
            });
        }

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
