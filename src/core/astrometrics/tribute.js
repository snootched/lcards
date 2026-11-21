/**
 * A tribute to Sir Patrick Stewart (1940–2026), hidden in every astrometrics
 * card: four quick taps on the camera's reset button ("there are four
 * lights"). The ship goes to warp, drops out, and the streaking stars settle
 * into a portrait of Captain Picard raising his hand to give the order; it
 * shimmers, a dedication fades in, and at "ENGAGE" the stars stretch back
 * into warp and the scene returns. A tap ends it early.
 *
 * The portrait is a few thousand stars (tribute-portrait.js, made by
 * tools/tribute-portrait/make_portrait.py): a stipple whose density follows
 * the light and the edges of the pose, coloured by what each star is: the
 * face and hand, the red and the black of the uniform, the gold of the four
 * rank pips and the combadge. Drawn on a 2D canvas over the scene, in a few
 * batched paths a frame; the warp is the card's (warp-drive.js). Under
 * reduced motion it fades in and out, no warp.
 *
 * Loaded on the first trigger (a lazy chunk), so it costs nothing until then.
 *
 * @module core/astrometrics/tribute
 */
import { resolveColor } from '../themes/resolve-color.js';
import { prefersReducedMotion } from '../../utils/reduced-motion.js';
import { loadFont } from '../../utils/lcards-theme.js';
import { PORTRAIT } from './tribute-portrait.js';

/** The dedication */
export const DEDICATION = 'TO BOLDLY GO · SIR PATRICK STEWART · 1940–2026';

/** The TNG lettering of the text */
export const FONT = 'lcards_crillee';

/** The raised fingertip, px in the portrait's frame (it flares at "ENGAGE") */
export const FINGERTIP = [115, 132];

/** What a star is (tribute-portrait.js) */
export const KINDS = /** @type {const} */ (['face', 'red', 'black', 'gold']);

/** The portrait's frame (px) and the part of it the portrait fills */
const FRAME = { x0: 0, y0: 40, x1: 580, y1: 480 };

/** Twinkle phases and brightness steps the stars are batched by */
const PHASES = 4;
const LEVELS = 4;

/** The sequence, ms from the start */
export const TIMELINE = Object.freeze({
  warpIn: 0, // to warp
  dropOut: 2600, // out of warp: the stars stream in and settle
  settled: 5000,
  dedication: 5400,
  engage: 12500, // the fingertip flares, ENGAGE
  warpOut: 14000, // the stars stretch away into warp
  gone: 15600, // out of warp, the scene back
  end: 16600
});

/**
 * The portrait's stars, each with its batch (kind, size, brightness step, twinkle phase).
 * @returns {{ x: number, y: number, kind: number, size: number, level: number, phase: number }[]}
 */
export function portraitStars() {
  const out = [];
  for (let i = 0, n = 0; i + 4 < PORTRAIT.length; i += 5, n++) {
    const [x, y, kind, size, bright] = PORTRAIT.slice(i, i + 5);
    out.push({ x, y, kind, size, level: Math.min(LEVELS - 1, Math.floor((bright / 256) * LEVELS)), phase: (n * 7) % PHASES });
  }
  return out;
}

/**
 * Where the portrait sits on a canvas w x h (CSS px): centred, as large as fits with a margin.
 * @param {number} w
 * @param {number} h
 */
export function portraitFit(w, h) {
  const fw = FRAME.x1 - FRAME.x0;
  const fh = FRAME.y1 - FRAME.y0;
  const scale = Math.min((w * 0.86) / fw, (h * 0.8) / fh);
  return { scale, ox: (w - fw * scale) / 2 - FRAME.x0 * scale, oy: (h - fh * scale) / 2 - FRAME.y0 * scale - h * 0.03 };
}

/** @param {number} t */
const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
/** @param {number} t */
const easeIn = (t) => Math.pow(Math.min(1, Math.max(0, t)), 3);
/** @param {number} t @param {number} a @param {number} b */
const span = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

/**
 * Play the tribute over a card's scene.
 * @param {{ root: HTMLElement, element: HTMLElement, warp: (on: boolean, factor?: number, strength?: number) => void, dim: (a: number) => void }} host -
 *   `root` the card's frame (the overlay goes in it), `element` for colours, `warp` the card's warp (its factor and
 *   strength ease), `dim` the scene's opacity
 * @returns {{ stop: () => void, done: Promise<void>, seek: (ms: number) => void }}
 */
export function playTribute({ root, element, warp, dim }) {
  const reduced = prefersReducedMotion();
  // a concrete colour for the canvas (a theme without the variable: the fallback)
  const color = (/** @type {string} */ v, /** @type {string} */ fb) => {
    const c = resolveColor(v, { concrete: true, element, fallback: fb });
    return typeof c === 'string' && /^(#|rgb|hsl)/i.test(c.trim()) ? c : fb;
  };
  // the face and hand warm white, the uniform's red and black, the gold of the pips and combadge
  const colors = [
    color('var(--lcards-moonlight)', '#fff0dc'),
    color('var(--lcars-red)', '#d8505a'),
    color('var(--lcars-blue)', '#6f86c0'),
    color('var(--lcars-yellow)', '#ffcc66')
  ];
  const goldColor = colors[3];

  loadFont(FONT);
  const overlay = document.createElement('div');
  overlay.className = 'astro-tribute';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:2;cursor:pointer;';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  const lettering = `font-family:'${FONT}', var(--lcars-font, sans-serif);text-transform:uppercase;`;
  const text = document.createElement('div');
  text.style.cssText = `position:absolute;left:0;right:0;bottom:5%;text-align:center;font-size:clamp(14px,2.3vw,26px);letter-spacing:0.06em;opacity:0;transition:opacity 1.2s ease;color:var(--lcars-blue, #99ccff);${lettering}`;
  text.textContent = DEDICATION;
  const engage = document.createElement('div');
  engage.style.cssText = `position:absolute;font-size:clamp(18px,3vw,34px);letter-spacing:0.1em;opacity:0;transition:opacity 0.4s ease;color:var(--lcars-orange, #ff9966);${lettering}`;
  engage.textContent = 'ENGAGE';
  overlay.append(canvas, text, engage);
  root.append(overlay);
  const ctx = canvas.getContext('2d');

  const stars = portraitStars();
  /** @type {Map<string, typeof stars>} batches: kind, brightness step, twinkle phase */
  const batches = new Map();
  for (const s of stars) {
    const key = `${s.kind}|${s.level}|${s.phase}`;
    const list = batches.get(key);
    if (list) list.push(s);
    else batches.set(key, [s]);
  }
  let start = performance.now();
  let raf = 0;
  let stopping = 0;
  /** @type {() => void} */
  let resolveDone = () => {};
  const done = /** @type {Promise<void>} */ (new Promise((r) => { resolveDone = r; }));

  /**
   * The warp by phase: full warp in and out; behind the portrait a slow, faded stream (the ship still at
   * warp, the stars thinned so the portrait reads); none under reduced motion
   * @param {number} t
   * @returns {[boolean, number, number]} on, factor, strength
   */
  const warpAt = (t) => {
    const T = TIMELINE;
    if (reduced || stopping || t >= T.gone) return [false, 1, 1];
    if (t < T.dropOut || t >= T.warpOut) return [true, 7, 1];
    return [true, 1.6, 0.22];
  };
  /** The warp asked for last (set once per change) */
  let warpNow = '';
  dim(0.08);

  const finish = () => {
    cancelAnimationFrame(raf);
    overlay.remove();
    warp(false);
    dim(1);
    resolveDone();
  };

  /** @param {number} now */
  const frame = (now) => {
    raf = 0;
    const T = TIMELINE;
    const t = now - start;
    if (t >= T.end || (stopping && now - stopping > 500)) { finish(); return; }
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const w = overlay.clientWidth || 1;
    const h = overlay.clientHeight || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const { scale, ox, oy } = portraitFit(w, h);
    const cx = w / 2;
    const cy = h / 2;
    const fade = stopping ? 1 - Math.min(1, (now - stopping) / 500) : 1;

    // the warp by phase (whatever the frame rate or a seek)
    const [on, factor, strength] = warpAt(t);
    const key = `${on}|${factor}|${strength}`;
    if (key !== warpNow) {
      warpNow = key;
      warp(on, factor, strength);
    }
    if (t >= T.gone) dim(1);

    // How far out from the vanishing point the stars are (1: home) at time t: they decelerate smoothly into the
    // portrait and accelerate away from it, so their speed (and their streaks) fade to nothing and grow from it
    /** @param {number} at */
    const reach = (at) => {
      if (reduced) return 1;
      if (at < T.warpOut) return 0.04 + 0.96 * easeOut(span(at, T.dropOut, T.settled));
      return 1 + 2.5 * easeIn(span(at, T.warpOut, T.gone));
    };
    const shown = reduced
      ? Math.min(span(t, T.dropOut, T.settled), 1 - span(t, T.warpOut, T.gone))
      : span(t, T.dropOut, T.dropOut + 250) * (1 - span(t, T.warpOut + 600, T.gone));
    const alpha = shown * fade;
    if (alpha > 0) {
      const k = reach(t);
      // a streak is where the star was a moment ago: as long as it is fast
      const kTail = reach(t - 110);
      const streaking = Math.abs(k - kTail) > 0.004;
      // the twinkle comes in as they settle, not all at once
      const calm = reduced ? 1 : span(t, T.settled - 400, T.settled + 600) * (1 - span(t, T.warpOut, T.warpOut + 300));
      const px = Math.max(0.55, scale * 0.75);
      for (const [key, list] of batches) {
        const [kind, level, phase] = key.split('|').map(Number);
        const twinkle = 1 - calm * 0.28 * (0.5 + 0.5 * Math.sin(now / 480 + (phase * Math.PI * 2) / PHASES));
        ctx.globalAlpha = alpha * twinkle * (0.35 + (0.65 * (level + 1)) / LEVELS);
        ctx.fillStyle = colors[kind];
        ctx.strokeStyle = colors[kind];
        if (streaking) {
          // streaks from where they were toward where they are, all of a batch in one path
          ctx.lineWidth = px * 1.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (const s of list) {
            const hx = ox + s.x * scale;
            const hy = oy + s.y * scale;
            ctx.moveTo(cx + (hx - cx) * kTail, cy + (hy - cy) * kTail);
            ctx.lineTo(cx + (hx - cx) * k, cy + (hy - cy) * k);
          }
          ctx.stroke();
        }
        // and the star itself, always (where it is now)
        ctx.beginPath();
        for (const s of list) {
          const x = cx + (ox + s.x * scale - cx) * k;
          const y = cy + (oy + s.y * scale - cy) * k;
          const r = s.size * px;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      // ENGAGE: the raised fingertip flares
      const flare = span(t, T.engage, T.engage + 500) * (1 - span(t, T.warpOut, T.warpOut + 400));
      if (flare > 0) {
        const x = cx + (ox + FINGERTIP[0] * scale - cx) * k;
        const y = cy + (oy + FINGERTIP[1] * scale - cy) * k;
        const radius = 30 * Math.max(0.8, scale) * (1 + 0.25 * Math.sin(now / 120));
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, goldColor);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = alpha * flare;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        engage.style.left = `${Math.max(8, x - 30)}px`;
        engage.style.top = `${Math.max(8, y - 70 * Math.max(0.8, scale))}px`;
      }
      engage.style.opacity = String(flare > 0.5 && fade === 1 ? 1 : 0);
    }
    ctx.globalAlpha = 1;
    text.style.opacity = String(t >= T.dedication && t < T.warpOut && fade === 1 ? 1 : 0);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const stop = () => {
    if (stopping) return;
    stopping = performance.now();
    text.style.opacity = '0';
    engage.style.opacity = '0';
    warp(false);
    dim(1);
  };
  overlay.addEventListener('pointerdown', (e) => { e.stopPropagation(); stop(); });
  // a test or a demo can start it at a point in the sequence
  return { stop, done, seek: (/** @type {number} */ ms) => { start = performance.now() - ms; } };
}
