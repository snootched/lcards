/**
 * Effect Presets
 *
 * Multi-part effects that build their own anime.js timeline over the parts of the
 * target (boot-sequence) or over shapes they create (sensor-sweep). Each hands its
 * one instance to AnimationManager through `element._presetInstances`, so it is
 * tracked, stopped, carried over a re-render and settled under reduced motion like
 * any other animation, and cleans up after itself (withRevertHook).
 *
 * @module core/packs/animations/presets/effect-presets
 */

import { lcardsLog } from '../../../../utils/lcards-logging.js';
import { resolvePresetParams, withRevertHook } from '../../../../utils/lcards-anim-helpers.js';
import { textLeaves } from './text-presets.js';
import { resolveColor } from '../../../themes/resolve-color.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const GEOMETRY = 'path, rect, circle, ellipse, polygon, polyline, line';
/** Invisible wider copies MSD draws for clicking; never animated. */
const HIT_AREAS = '.shape-hit-area, .line-hit-area';

/** @param {string} value */
const paints = (value) => !!value && value !== 'none' && value !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(value);

/**
 * The parts of a target a boot sequence powers up: stroked geometry is drawn in,
 * filled geometry flickers on, text decodes. Hidden, clip and hit-area shapes are
 * left alone.
 * @param {Element} element
 * @returns {{ stroked: SVGGeometryElement[], filled: Element[], texts: Element[] }}
 */
export function bootParts(element) {
  const own = element.matches?.(GEOMETRY) ? [element] : [];
  const geometry = [...own, ...element.querySelectorAll(GEOMETRY)]
    .filter(el => !el.closest('defs, clipPath, mask, marker, pattern') && !el.matches(HIT_AREAS));
  /** @type {SVGGeometryElement[]} */
  const stroked = [];
  /** @type {Element[]} */
  const filled = [];
  for (const el of geometry) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (paints(style.fill)) filled.push(el);
    else if (paints(style.stroke) && parseFloat(style.strokeWidth) > 0 && typeof (/** @type {any} */ (el)).getTotalLength === 'function') {
      stroked.push(/** @type {SVGGeometryElement} */ (el));
    }
  }
  return { stroked, filled, texts: textLeaves(element) };
}

/** Panel power-up: a stutter of opacity before it holds. */
const FLICKER = [0, 0.8, 0.15, 0.65, 0.05, 1];

/** clip-path inset() at the start of a sweep, by the side it comes from. */
const SWEEP_FROM = {
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
  top: 'inset(0% 0% 100% 0%)',
  bottom: 'inset(100% 0% 0% 0%)',
};

/** @type {Record<string, (def: Record<string, any>) => any>} */
export const EFFECT_PRESETS = {
  /**
   * Boot Sequence - the target powers up (best on on_show or on_load)
   *
   * One timeline over the target's own parts: stroked shapes (borders, lines, radar
   * rings) draw in, filled shapes come on (flicker, sweep or fade), then the text
   * decodes from glyph noise. Parts a card doesn't have are skipped. Stopping, or
   * reduced motion, leaves everything as it was before.
   *
   * Parameters:
   * - duration (default: 1200) - the whole sequence, ms
   * - fill (default: 'flicker') - 'flicker', 'sweep' (wipes in from `from`) or 'fade'
   * - from (default: 'left') - sweep side: 'left', 'right', 'top', 'bottom'
   * - draw (default: true) - draw stroked shapes in
   * - decode (default: true) - decode the text
   * - chars (default: 'A-Z0-9') - decode glyphs (text-decode's chars)
   * - stagger (default: 60) - ms between one shape coming on and the next
   * - seed (optional) - Number: the same decode on every load
   * - delay (optional) - ms before it starts
   */
  'boot-sequence': (def) => {
    const p = resolvePresetParams(def);
    const total = typeof p.duration === 'number' && p.duration > 0 ? p.duration : 1200;
    const fill = ['flicker', 'sweep', 'fade'].includes(p.fill) ? p.fill : 'flicker';
    const from = SWEEP_FROM[p.from] ? p.from : 'left';
    const step = typeof p.stagger === 'number' && p.stagger >= 0 ? p.stagger : 60;

    return {
      anime: {},
      styles: {},
      setup: (/** @type {any} */ element) => {
        const animejs = window.lcards?.anim?.animejs;
        element._animTargets = null; // self-managed: one timeline, reported below
        if (!animejs?.createTimeline) {
          lcardsLog.warn('[boot-sequence preset] anime.js createTimeline not available');
          return;
        }
        const { stroked, filled, texts } = bootParts(element);
        const tl = animejs.createTimeline({ delay: typeof p.delay === 'number' ? p.delay : 0, autoplay: true });
        const drawEnd = total * 0.45;
        const fillEnd = total * 0.5;
        const textAt = (stroked.length || filled.length) ? total * 0.35 : 0;
        /** @type {Array<() => void>} */
        const restoreOnFinish = [];

        if (p.draw !== false && stroked.length) {
          // createDrawable writes pathLength and the dash attributes; a finished draw puts
          // the authored ones back (a stop does through the revert)
          const DRAW_ATTRS = ['pathLength', 'stroke-dasharray', 'stroke-dashoffset'];
          stroked.forEach(el => {
            const authored = DRAW_ATTRS.map(name => ({ name, value: el.getAttribute(name) }));
            restoreOnFinish.push(() => authored.forEach(({ name, value }) => (value === null ? el.removeAttribute(name) : el.setAttribute(name, value))));
          });
          // An inline stroke-dasharray would mask the attributes createDrawable sets (see draw)
          stroked.forEach(el => { /** @type {any} */ (el).style.removeProperty('stroke-dasharray'); /** @type {any} */ (el).style.removeProperty('stroke-dashoffset'); });
          tl.add(animejs.createDrawable(stroked), {
            draw: ['0 0', '0 1'], duration: drawEnd, ease: 'inOutSine', delay: animejs.stagger(step),
          }, 0);
        }
        if (filled.length) {
          const props = fill === 'sweep'
            ? { clipPath: [SWEEP_FROM[from], 'inset(0% 0% 0% 0%)'], ease: 'outQuad' }
            : fill === 'fade'
              ? { opacity: [0, 1], ease: 'outQuad' }
              : { opacity: FLICKER, ease: 'linear' };
          tl.add(filled, { ...props, duration: fillEnd, delay: animejs.stagger(step) }, 0);
        }
        /** @type {Array<() => void>} */
        const restore = [];
        if (texts.length) {
          // Hidden until its turn, then shown and decoded
          tl.set(texts, { opacity: 0 }, 0).set(texts, { opacity: 1 }, textAt);
          if (p.decode !== false && animejs.scrambleText) {
            texts.forEach((leaf, i) => {
              const original = leaf.textContent ?? '';
              const proxy = { textContent: original };
              restore.push(() => { leaf.textContent = original; });
              tl.add(proxy, {
                textContent: animejs.scrambleText({
                  chars: p.chars ?? 'A-Z0-9',
                  ...(typeof p.seed === 'number' ? { seed: p.seed + i } : {}),
                }),
                duration: total - textAt,
                onUpdate: () => { leaf.textContent = proxy.textContent; },
              }, textAt);
            });
          }
        }
        if (!stroked.length && !filled.length && !texts.length) {
          lcardsLog.debug('[boot-sequence preset] Nothing to power up in the target', { tag: element.tagName });
        }
        // Stopped: withRevertHook has already reverted the timeline (styles and
        // attributes as captured). Finished or settled: it ends visible, so only the
        // inline values go (a revert here would reset `completed` and look running).
        element._presetInstances = [withRevertHook(tl, () => {
          if (tl.completed) {
            animejs.utils.cleanInlineStyles(tl);
            restoreOnFinish.forEach(fn => fn());
          }
          restore.forEach(fn => fn());
        })];
      }
    };
  },

  /**
   * Sensor Sweep - a rotating scanner wedge with a ring that pings outward each turn
   *
   * Creates its own shapes (nothing in the card changes): inside the target when it
   * is an SVG group, otherwise next to it, centred on the target's box. They are
   * removed when the animation stops; under reduced motion it doesn't run (a loop).
   * For an elbow corner or a spot on an MSD, set `center` (and `radius`).
   *
   * Parameters:
   * - duration (default: 3000) - ms per revolution (and per ping)
   * - radius (optional) - SVG units; default half the shorter side of the target's box
   * - center (optional) - [x, y] in the target's SVG units; default the box centre
   * - angle (default: 40) - wedge width, degrees
   * - direction (default: 'cw') - 'cw' or 'ccw'
   * - color (default: theme:colors.ui.primary) - wedge colour
   * - ring_color (default: color) - ping ring colour
   * - opacity (default: 0.35) - wedge opacity
   * - ring (default: true) - show the ping ring
   * - ring_width (default: 2) - ring stroke width, SVG units
   * - loop (default: true)
   */
  'sensor-sweep': (def) => {
    const p = resolvePresetParams(def);
    const duration = typeof p.duration === 'number' && p.duration > 0 ? p.duration : 3000;
    const angle = Math.min(359, Math.max(1, typeof p.angle === 'number' ? p.angle : 40));
    const turn = p.direction === 'ccw' ? -360 : 360;
    const opacity = typeof p.opacity === 'number' ? p.opacity : 0.35;
    const ringWidth = typeof p.ring_width === 'number' ? p.ring_width : 2;
    const loop = p.loop !== undefined ? p.loop : true;

    return {
      anime: {},
      styles: {},
      setup: (/** @type {any} */ element) => {
        const animejs = window.lcards?.anim?.animejs;
        element._animTargets = null; // self-managed: one timeline, reported below
        if (!animejs?.createTimeline || typeof element.getBBox !== 'function') {
          lcardsLog.warn('[sensor-sweep preset] Needs an SVG target (a card shape, group or MSD overlay)', { tag: element.tagName });
          return;
        }
        const host = element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'svg' ? element : element.parentNode;
        if (!host) return;
        let box;
        try { box = element.getBBox(); } catch (_) { box = { x: 0, y: 0, width: 0, height: 0 }; }
        const [cx, cy] = Array.isArray(p.center) && p.center.length === 2
          ? p.center.map(Number)
          : [box.x + box.width / 2, box.y + box.height / 2];
        const radius = typeof p.radius === 'number' && p.radius > 0 ? p.radius : Math.min(box.width, box.height) / 2;
        if (!(radius > 0)) {
          lcardsLog.warn('[sensor-sweep preset] The target has no size; set params.radius', { tag: element.tagName });
          return;
        }
        const color = resolveColor(p.color ?? 'theme:colors.ui.primary', { concrete: true, element, fallback: 'currentColor' });
        const ringColor = resolveColor(p.ring_color ?? p.color ?? 'theme:colors.ui.primary', { concrete: true, element, fallback: color });

        // One sweep per target and animation: a restart replaces the old shapes
        const id = `__sensor-sweep-${p.id || `${element.id || element.getAttribute?.('data-overlay-id') || 'anim'}-${p.trigger || 'on_load'}`}`;
        host.querySelector?.(`:scope > [data-sensor-sweep="${CSS.escape(id)}"]`)?.remove();

        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('data-sensor-sweep', id);
        group.setAttribute('transform', `translate(${cx} ${cy})`);
        group.setAttribute('pointer-events', 'none');

        // Wedge from the centre, pointing up, `angle` wide
        const half = (angle / 2) * Math.PI / 180;
        const x = radius * Math.sin(half);
        const y = -radius * Math.cos(half);
        const wedge = document.createElementNS(SVG_NS, 'path');
        wedge.setAttribute('d', `M 0 0 L ${-x} ${y} A ${radius} ${radius} 0 0 1 ${x} ${y} Z`);
        wedge.setAttribute('fill', color);
        wedge.setAttribute('fill-opacity', String(opacity));
        Object.assign(wedge.style, { transformBox: 'view-box', transformOrigin: '0px 0px' });
        group.appendChild(wedge);

        const tl = animejs.createTimeline({ loop, delay: typeof p.delay === 'number' ? p.delay : 0 });
        tl.add(wedge, { rotate: [0, turn], duration, ease: 'linear' }, 0);
        if (p.ring !== false) {
          const ring = document.createElementNS(SVG_NS, 'circle');
          ring.setAttribute('r', '0');
          ring.setAttribute('fill', 'none');
          ring.setAttribute('stroke', ringColor);
          ring.setAttribute('stroke-width', String(ringWidth));
          group.appendChild(ring);
          tl.add(ring, { r: [0, radius], opacity: [Math.min(1, opacity * 2.5), 0], duration: duration * 0.6, ease: 'outQuad' }, 0);
        }
        host.appendChild(group);
        element._presetInstances = [withRevertHook(tl, () => group.remove())];
      }
    };
  },
};
