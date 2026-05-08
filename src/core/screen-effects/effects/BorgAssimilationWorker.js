/**
 * @fileoverview BorgAssimilationWorker — OffscreenCanvas draw thread for
 * the Borg assimilation effect.
 *
 * Runs entirely on a DedicatedWorker thread so the main thread stays free
 * for HA / Lit rendering.  Receives the OffscreenCanvas via postMessage
 * transfer and owns the requestAnimationFrame loop.
 *
 * Messages in:
 *   { type: 'start',  canvas: OffscreenCanvas, params: {...} }
 *   { type: 'resize', width: number, height: number }
 *   { type: 'stop' }
 *
 * @module core/screen-effects/effects/BorgAssimilationWorker
 */

// ─── Inline colour helper ─────────────────────────────────────────────────────
// Lightweight stand-in for ColorUtils.alpha that handles the concrete #hex /
// rgb strings produced by _shiftHue and the caller's params.  CSS-variable
// forms never reach this worker because SEM resolves them before enter() is
// called.

function _alpha(color, a) {
    const hex = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (hex) {
        return `rgba(${parseInt(hex[1], 16)}, ${parseInt(hex[2], 16)}, ${parseInt(hex[3], 16)}, ${a})`;
    }
    const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${a})`;
    return color; // passthrough for unexpected formats
}

// ─── Scalar cubic Bézier ──────────────────────────────────────────────────────

function _bz(t, p0, cp1, cp2, p1) {
    const q = 1 - t;
    return q*q*q*p0 + 3*q*q*t*cp1 + 3*q*t*t*cp2 + t*t*t*p1;
}

// ─── Hue shift ────────────────────────────────────────────────────────────────

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

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function _drawTendril(ctx, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey,
                      baseWidth, hueShiftedColor, hueShiftedGlow, progress) {
    const STEPS = 40;
    const steps = Math.floor(progress * STEPS);
    if (steps < 2) return;

    const tipT = steps / STEPS;
    const tipX = _bz(tipT, sx, cp1x, cp2x, ex);
    const tipY = _bz(tipT, sy, cp1y, cp2y, ey);

    if (Math.abs(tipX - sx) < 0.5 && Math.abs(tipY - sy) < 0.5) return;

    const grad = ctx.createLinearGradient(sx, sy, tipX, tipY);
    grad.addColorStop(0.00, _alpha(hueShiftedGlow,  0.9));
    grad.addColorStop(0.35, _alpha(hueShiftedColor, 0.85));
    grad.addColorStop(0.75, _alpha(hueShiftedColor, 0.4));
    grad.addColorStop(1.00, _alpha(hueShiftedColor, 0.0));

    ctx.strokeStyle = grad;
    ctx.lineCap     = 'round';

    let prevX = sx, prevY = sy;
    for (let s = 1; s <= steps; s++) {
        const p    = s / STEPS;
        const curX = _bz(p, sx, cp1x, cp2x, ex);
        const curY = _bz(p, sy, cp1y, cp2y, ey);
        ctx.lineWidth = Math.max(0.3, baseWidth * Math.pow(1 - p, 0.6));
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
        prevX = curX;
        prevY = curY;
    }
}

function _drawParticles(ctx, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey,
                        particles, progress, elapsed, hueShiftedGlow) {
    particles.forEach(pt => {
        const tParam = (pt.phase + pt.speed * elapsed / 1000) % 1;
        if (tParam > progress) return;

        const px = _bz(tParam, sx, cp1x, cp2x, ex);
        const py = _bz(tParam, sy, cp1y, cp2y, ey);

        const halo = ctx.createRadialGradient(px, py, 0, px, py, 8);
        halo.addColorStop(0, _alpha(hueShiftedGlow, 0.55));
        halo.addColorStop(1, _alpha(hueShiftedGlow, 0.0));
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = hueShiftedGlow;
        ctx.fill();
    });
}

// ─── Hex-morph ring ───────────────────────────────────────────────────────────
// Draws a ring that starts as a hexagon (t=0) and morphs to a circle (t=1).
// Uses the hex radius formula r(θ) = R·cos(π/6)/cos((θ mod π/3)−π/6) and
// lerps it toward the constant circle radius R.

function _drawHexMorphRing(ctx, cx, cy, R, t, strokeStyle, lineWidth) {
    const N      = 60;
    const sector = Math.PI / 3;      // 60° per hex face
    const offset = -Math.PI / 6;     // pointy-top, matches the spawn hex ring
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
        const theta    = (i / N) * Math.PI * 2;
        const adjusted = ((theta - offset) % sector + sector) % sector;
        const rHex     = R * Math.cos(sector / 2) / Math.cos(adjusted - sector / 2);
        const r        = rHex + t * (R - rHex);   // lerp hex → circle
        const x        = cx + r * Math.cos(theta);
        const y        = cy + r * Math.sin(theta);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth   = lineWidth;
    ctx.stroke();
}

// ─── Worker-scoped state ──────────────────────────────────────────────────────
// One effect instance runs at a time — module-level vars allow the stop
// handler to cancel the rAF and clear the canvas from outside the closure.

let _rafId   = null;
let _running = false;
let _ctx     = null;
let _canvas  = null;

// ─── Effect runner ────────────────────────────────────────────────────────────

function _runEffect(canvas, params) {
    const {
        siteCount       = 7,
        tendrilsPerSite = 8,
        tendrilLength   = 600,
        particleCount   = 2,
        color           = '#00cc44',
        glowColor       = '#00ff66',
    } = params;

    _ctx = canvas.getContext('2d');
    const ctx    = _ctx;
    const startT = performance.now();

    // Canvas dimensions are pre-set by the main thread before transfer.
    // The resize message handler updates canvas.width/height when the
    // container changes; the draw loop reads them each frame.
    const W0 = canvas.width;
    const H0 = canvas.height;

    // ── Phase 1: scan bars ────────────────────────────────────────────────────
    const scanBars = [
        { y0: -20, speed: H0 / 260 },
        { y0: -60, speed: H0 / 320 },
    ];

    // ── Bridge state ──────────────────────────────────────────────────────────
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
            const hueShift  = (Math.random() - 0.5) * 24;
            //const baseWidth = 1.5 + Math.random() * 3.5;
            const baseWidth = 3.5 + Math.random() * 5.5;

            const cp1x = sx + Math.cos(angle + 0.65) * length * 0.4;
            const cp1y = sy + Math.sin(angle + 0.65) * length * 0.4;
            const cp2x = sx + Math.cos(angle - 0.45) * length * 0.7;
            const cp2y = sy + Math.sin(angle - 0.45) * length * 0.7;
            const ex   = sx + Math.cos(angle) * length;
            const ey   = sy + Math.sin(angle) * length;

            const ft    = 0.6;
            const dt    = 0.01;
            const forkX = _bz(ft, sx, cp1x, cp2x, ex);
            const forkY = _bz(ft, sy, cp1y, cp2y, ey);
            const tangA = Math.atan2(
                _bz(ft + dt, sy, cp1y, cp2y, ey) - _bz(ft - dt, sy, cp1y, cp2y, ey),
                _bz(ft + dt, sx, cp1x, cp2x, ex) - _bz(ft - dt, sx, cp1x, cp2x, ex)
            );

            const branchCount = 2 + Math.floor(Math.random() * 2);
            const branches    = [];
            for (let b = 0; b < branchCount; b++) {
                const bAngle = tangA + (Math.random() - 0.5) * 2 * (0.45 + Math.random() * 0.45);
                const bLen   = length * (0.2 + Math.random() * 0.2);
                const bHue   = hueShift + (Math.random() - 0.5) * 10;
                branches.push({
                    sx:    forkX,
                    sy:    forkY,
                    cp1x:  forkX + Math.cos(bAngle + 0.55) * bLen * 0.4,
                    cp1y:  forkY + Math.sin(bAngle + 0.55) * bLen * 0.4,
                    cp2x:  forkX + Math.cos(bAngle - 0.35) * bLen * 0.7,
                    cp2y:  forkY + Math.sin(bAngle - 0.35) * bLen * 0.7,
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
            spawnAt:           600 + Math.random() * 4200,
            tendrils,
            pulseRings:        [],
            lastPulseAt:       0,
            nextPulseInterval: 2000 + Math.random() * 1000,
        };
    });

    const allGrownAt = Math.max(...sites.map(s => s.spawnAt)) + 300 + 3500;

    // ── Bridge builder ────────────────────────────────────────────────────────
    function _buildBridges(elapsed) {
        const endpoints = [];
        sites.forEach((site, sIdx) => {
            site.tendrils.forEach(t => {
                endpoints.push({ x: t.ex, y: t.ey, sIdx });

                if (t.branches && t.branches.length > 0) {
                    const best = t.branches.reduce((acc, br) => {
                        const dx = br.ex - br.sx, dy = br.ey - br.sy;
                        const d  = dx * dx + dy * dy;
                        return (!acc || d > acc.d) ? { br, d } : acc;
                    }, /** @type {{ br: typeof t.branches[0], d: number } | null} */ (null));
                    if (best) endpoints.push({ x: best.br.ex, y: best.br.ey, sIdx });
                }
            });
        });

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

                const mx   = (endpoints[i].x + endpoints[j].x) / 2;
                const my   = (endpoints[i].y + endpoints[j].y) / 2;
                const perp = (Math.random() - 0.5) * dist * 0.8;
                const pnx  = -dy / dist;
                const pny  =  dx / dist;
                const cpx  = mx + pnx * perp;
                const cpy  = my + pny * perp;

                const jx = 0.25 * endpoints[i].x + 0.5 * cpx + 0.25 * endpoints[j].x;
                const jy = 0.25 * endpoints[i].y + 0.5 * cpy + 0.25 * endpoints[j].y;

                bridgeCount[i]++;
                bridgeCount[j]++;
                built.push({
                    ax: endpoints[i].x, ay: endpoints[i].y,
                    bx: endpoints[j].x, by: endpoints[j].y,
                    cpx, cpy,
                    junctionX: jx, junctionY: jy,
                    flashDelay: Math.random() * 2000,
                    builtAt:   elapsed,
                });
            }
        }
        return built;
    }

    // ── Draw loop ─────────────────────────────────────────────────────────────
    function draw(now) {
        if (!_running) return;
        const elapsed = now - startT;
        // Use current buffer dimensions — updated by resize messages.
        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        // ── Phase 1: scan bar sweep + faint flicker (0–600 ms) ───────────────
        if (elapsed < 600) {
            if (Math.random() > 0.5) {
                ctx.fillStyle = _alpha(color, 0.15);
                ctx.fillRect(0, 0, W, H);
            }
            scanBars.forEach(bar => {
                const y = bar.y0 + bar.speed * elapsed;
                const g = ctx.createLinearGradient(0, y - 8, 0, y + 20);
                g.addColorStop(0.0, _alpha(glowColor, 0));
                g.addColorStop(0.4, _alpha(glowColor, 0.6));
                g.addColorStop(0.7, _alpha(color,     0.4));
                g.addColorStop(1.0, _alpha(glowColor, 0));
                ctx.fillStyle = g;
                ctx.fillRect(0, y - 8, W, 28);
            });
            _rafId = requestAnimationFrame(draw);
            return;
        }

        // ── Per-site rendering ────────────────────────────────────────────────
        sites.forEach(site => {
            if (elapsed < site.spawnAt) return;
            const siteElapsed = elapsed - site.spawnAt;

            // Dark bloom
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

            // Spawn hex ring
            if (siteElapsed < 600) {
                const hexProg = siteElapsed / 600;
                const hexR    = hexProg * 60;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a  = (i / 6) * Math.PI * 2 - Math.PI / 6;
                    const hx = site.x + Math.cos(a) * hexR;
                    const hy = site.y + Math.sin(a) * hexR;
                    i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.strokeStyle = _alpha(glowColor, 1 - hexProg);
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

            // Injection site glow circle
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

            // Pulse ring emission
            if (site.radius >= site.maxR * 0.9) {
                if (elapsed - site.lastPulseAt > site.nextPulseInterval) {
                    if (site.pulseRings.length >= 5) site.pulseRings.shift();
                    site.pulseRings.push({ startT: elapsed });
                    site.lastPulseAt       = elapsed;
                    site.nextPulseInterval = 2000 + Math.random() * 1000;
                }
            }

            site.pulseRings = site.pulseRings.filter(ring => {
                const ringProg = (elapsed - ring.startT) / 1500;
                if (ringProg >= 1) return false;
                _drawHexMorphRing(
                    ctx, site.x, site.y, ringProg * 80, ringProg,
                    _alpha(glowColor, 0.5 * (1 - ringProg)), 3
                );
                return true;
            });
        });

        // ── Build bridges once all tendrils have grown ────────────────────────
        if (!bridgesBuilt && elapsed > allGrownAt) {
            bridges      = _buildBridges(elapsed);
            bridgesBuilt = true;
        }

        // ── Draw bridges + junction nodes ─────────────────────────────────────
        if (bridgesBuilt) {
            bridges.forEach(br => {
                const age = elapsed - br.builtAt - br.flashDelay;
                if (age < 0) return;

                const flashAlpha = age < 400 ? (1 - age / 400) : 0;
                const arcAlpha   = Math.max(0.3, flashAlpha);

                ctx.beginPath();
                ctx.moveTo(br.ax, br.ay);
                ctx.quadraticCurveTo(br.cpx, br.cpy, br.bx, br.by);
                ctx.strokeStyle = _alpha(color, arcAlpha);
                ctx.lineWidth   = 0.8;
                ctx.lineCap     = 'round';
                ctx.stroke();

                if (age > 200) {
                    const nodeAlpha = Math.min(1, (age - 200) / 300) * 0.85;
                    const nodeR     = 8 + 3 * Math.sin(elapsed / 600 + br.junctionX * 0.01);
                    const nodeGrd   = ctx.createRadialGradient(
                        br.junctionX, br.junctionY, 0,
                        br.junctionX, br.junctionY, nodeR
                    );
                    nodeGrd.addColorStop(0,   _alpha(glowColor, nodeAlpha));
                    nodeGrd.addColorStop(0.4, _alpha(glowColor, nodeAlpha * 0.7));
                    nodeGrd.addColorStop(0.7, _alpha(color,     nodeAlpha * 0.4));
                    nodeGrd.addColorStop(1,   _alpha(color,     0));
                    ctx.beginPath();
                    ctx.arc(br.junctionX, br.junctionY, nodeR, 0, Math.PI * 2);
                    ctx.fillStyle = nodeGrd;
                    ctx.fill();
                }
            });
        }

        _rafId = requestAnimationFrame(draw);
    }

    _rafId = requestAnimationFrame(draw);
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = (e) => {
    const { type } = e.data;

    if (type === 'start') {
        _canvas  = e.data.canvas;
        _running = true;
        _runEffect(_canvas, e.data.params ?? {});
        return;
    }

    if (type === 'resize') {
        // Update OffscreenCanvas buffer size; the draw loop reads these each frame.
        if (_canvas) {
            _canvas.width  = e.data.width;
            _canvas.height = e.data.height;
        }
        return;
    }

    if (type === 'stop') {
        _running = false;
        if (_rafId !== null) {
            cancelAnimationFrame(_rafId);
            _rafId = null;
        }
        // Clear the last rendered frame before the worker is terminated.
        if (_ctx && _canvas) {
            _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        }
    }
};
