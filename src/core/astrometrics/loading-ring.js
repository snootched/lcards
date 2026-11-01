/**
 * Astrometrics loading ring: a ring over the scene while model files load,
 * filling with the download (bytes of every file loading, when the server
 * says their sizes) and turning while a file is parsed or its size is not
 * known. Shown only once a load has taken a moment, so a small built-in
 * model does not flash it.
 *
 * @module core/astrometrics/loading-ring
 */

/** A load shorter than this shows no ring, ms */
export const RING_DELAY_MS = 300;

const R = 20;
const CIRCUMFERENCE = 2 * Math.PI * R;

export const LOADING_RING_CSS = `
.astro-scene .astro-loading { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); pointer-events: none;
  display: flex; flex-direction: column; align-items: center; gap: var(--ha-space-2);
  font-family: var(--lcars-font, 'Antonio'), 'Antonio', sans-serif; color: var(--lcards-moonlight); text-transform: uppercase; letter-spacing: 0.05em; }
.astro-scene .astro-loading[hidden] { display: none; }
.astro-scene .astro-loading svg { width: 56px; height: 56px; transform: rotate(-90deg); }
.astro-scene .astro-loading circle { fill: none; stroke-width: 4; }
.astro-scene .astro-loading .track { stroke: var(--lcards-moonlight); opacity: 0.2; }
.astro-scene .astro-loading .arc { stroke: var(--lcards-moonlight); stroke-linecap: round;
  transition: stroke-dashoffset var(--ha-animation-duration-fast, 0.15s) linear; }
.astro-scene .astro-loading.turning svg { animation: astro-loading-turn 1.2s linear infinite; }
@keyframes astro-loading-turn { from { transform: rotate(-90deg); } to { transform: rotate(270deg); } }
@media (prefers-reduced-motion: reduce) { .astro-scene .astro-loading.turning svg { animation: none; } }
`;

/**
 * What the ring says for the files loading now.
 * @param {{ loaded: number, total: number }[]} files - loaded -1: being parsed; total 0: size not known
 * @returns {{ fraction: number | null, text: string }} fraction 0 to 1, null when it can not be known (the ring turns)
 */
export function ringState(files) {
  const n = files.length;
  const what = n > 1 ? `${n} models` : 'model';
  if (files.every((f) => f.loaded < 0)) return { fraction: null, text: `Preparing ${what}` };
  const downloading = files.filter((f) => f.loaded >= 0);
  const total = downloading.reduce((s, f) => s + f.total, 0);
  const loaded = downloading.reduce((s, f) => s + f.loaded, 0);
  // a size per file, and no more bytes than it said (a compressed response counts the bytes unpacked)
  if (downloading.every((f) => f.total > 0) && loaded <= total) {
    const fraction = loaded / total;
    return { fraction, text: `Loading ${what} ${Math.floor(fraction * 100)}%` };
  }
  if (loaded === 0) return { fraction: null, text: `Loading ${what}` };
  return { fraction: null, text: `Loading ${what} ${(loaded / 1048576).toFixed(loaded < 10 * 1048576 ? 1 : 0)} MB` };
}

/**
 * The ring for one scene.
 * @param {HTMLElement} wrap - the scene's element
 */
export function createLoadingRing(wrap) {
  /** @type {Map<string, { loaded: number, total: number }>} */
  const files = new Map();
  /** @type {HTMLElement | null} */
  let el = null;
  /** @type {SVGCircleElement | null} */
  let arc = null;
  /** @type {HTMLElement | null} */
  let label = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;
  let shown = false;
  let lastText = '';

  const build = () => {
    el = document.createElement('div');
    el.className = 'astro-loading';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('aria-hidden', 'true');
    for (const cls of ['track', 'arc']) {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('class', cls);
      c.setAttribute('cx', '24');
      c.setAttribute('cy', '24');
      c.setAttribute('r', String(R));
      svg.append(c);
      if (cls === 'arc') arc = c;
    }
    label = document.createElement('span');
    el.append(svg, label);
    wrap.append(el);
  };

  const render = () => {
    if (!shown) return;
    if (!files.size) {
      if (el) el.hidden = true;
      return;
    }
    if (!el) build();
    const { fraction, text } = ringState([...files.values()]);
    const e = /** @type {HTMLElement} */ (el);
    e.hidden = false;
    e.classList.toggle('turning', fraction === null);
    // a turning ring is a quarter arc
    const shownFraction = fraction === null ? 0.25 : fraction;
    arc?.setAttribute('stroke-dasharray', String(CIRCUMFERENCE));
    arc?.setAttribute('stroke-dashoffset', String(CIRCUMFERENCE * (1 - shownFraction)));
    if (text !== lastText && label) label.textContent = lastText = text;
  };

  return {
    /**
     * A file's progress (from the model loader's onProgress).
     * @param {string} key @param {number} loaded @param {number} total
     */
    progress(key, loaded, total) {
      const first = !files.size;
      files.set(key, { loaded, total });
      if (first && !shown && !timer) {
        timer = setTimeout(() => {
          timer = null;
          shown = files.size > 0;
          render();
        }, RING_DELAY_MS);
      }
      render();
    },
    /** @param {string} key - its file is in, or failed */
    done(key) {
      files.delete(key);
      if (!files.size) {
        shown = false;
        if (timer) clearTimeout(timer);
        timer = null;
      }
      render();
      if (!files.size && el) el.hidden = true;
    },
    /** @returns {{ visible: boolean, text: string }} for tests */
    state: () => ({ visible: !!el && !el.hidden, text: label?.textContent ?? '' }),
    dispose() {
      if (timer) clearTimeout(timer);
      el?.remove();
    }
  };
}
