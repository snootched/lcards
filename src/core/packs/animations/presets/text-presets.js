/**
 * Text Animation Presets
 *
 * Text-based animations using character/word/line splitting.
 * Uses native anime.js v4 splitText() for HTML elements (available since v4.1.0).
 * For SVG <text> elements falls back to <tspan> children (SVG cannot contain <span>).
 *
 * Each preset's setup() stores split targets in element._animTargets.
 * lcards-anim-helpers.js dispatches these automatically — no `targets:` needed in
 * the anime config objects.
 *
 * Text presets are ideal for:
 * - Character-by-character reveals
 * - Typewriter effects
 * - Matrix-style scrambles
 * - Wave and glitch effects
 *
 * @module core/packs/animations/presets/text-presets
 */

import { lcardsLog } from '../../../../utils/lcards-logging.js';
import { resolvePresetParams, getResolvedEasing, presetRandom, withRevertHook } from '../../../../utils/lcards-anim-helpers.js';

/**
 * Detect whether an element lives in the SVG namespace.
 * SVG <text> elements cannot contain HTML <span> children; they require <tspan>.
 * @param {Element} element
 * @returns {boolean}
 * @private
 */
function _isSvgElement(element) {
  return element?.namespaceURI === 'http://www.w3.org/2000/svg';
}

/**
 * Split an SVG <text> element into <tspan> children.
 * Returns an object with the unit array and a revert() method.
 * @param {Element} element
 * @param {'chars'|'words'|'lines'} type
 * @returns {{ units: Element[], revert: function }}
 * @private
 */
function _splitTextSvg(element, type = 'chars') {
  const svgNS = 'http://www.w3.org/2000/svg';
  const originalText = element.textContent;

  let tokens;
  if (type === 'lines') {
    tokens = originalText.split('\n');
  } else if (type === 'words') {
    // Include a trailing space in every token except the last so SVG renders
    // inter-word gaps correctly. SVG <tspan> siblings produce no implicit whitespace.
    const raw = originalText.trim().split(/\s+/).filter(Boolean);
    tokens = raw.map((w, i) => i < raw.length - 1 ? w + ' ' : w);
  } else {
    tokens = Array.from(originalText); // proper Unicode char split
  }

  // Clear element and insert <tspan> children
  while (element.firstChild) element.removeChild(element.firstChild);
  const tspans = tokens.map(token => {
    const tspan = document.createElementNS(svgNS, 'tspan');
    tspan.textContent = token;
    element.appendChild(tspan);
    return tspan;
  });

  lcardsLog.debug('[_splitTextSvg] Split via <tspan>', {
    tagName: element.tagName, type, count: tspans.length
  });

  return {
    units: tspans,
    revert() {
      while (element.firstChild) element.removeChild(element.firstChild);
      element.appendChild(document.createTextNode(originalText));
    }
  };
}

/**
 * Split an HTML element using the native anime.js splitText API (v4.1.0+).
 * Returns { units: Element[], revert: function } compatible with _splitTextSvg.
 * @param {Element} element
 * @param {'chars'|'words'|'lines'} type
 * @returns {{ units: Element[], revert: function }}
 * @private
 */
function _splitTextHtml(element, type = 'chars') {
  const splitText = window.lcards?.anim?.splitText;
  if (!splitText) {
    lcardsLog.warn('[_splitTextHtml] anime.splitText not available — upgrade animejs >= 4.1.0');
    return { units: [], revert: () => {} };
  }

  const splitter = splitText(element, {
    chars: type === 'chars',
    words: type === 'words',
    lines: type === 'lines'
  });

  const units = Array.from(
    type === 'chars' ? splitter.chars : type === 'words' ? splitter.words : splitter.lines
  );

  lcardsLog.debug('[_splitTextHtml] Split via native splitText', {
    tagName: element.tagName, type, count: units.length
  });

  return { units, revert: () => splitter.revert() };
}

/**
 * Split a text element — dispatches to SVG or HTML path.
 * @param {Element} element
 * @param {'chars'|'words'|'lines'} type
 * @returns {{ units: Element[], revert: function }}
 * @private
 */
function _splitText(element, type = 'chars') {
  if (!element) {
    lcardsLog.warn('[_splitText] No element provided');
    return { units: [], revert: () => {} };
  }
  if (!_isSvgElement(element)) return _splitTextHtml(element, type);

  const tag = element.tagName.toLowerCase();
  if (tag === 'text' || tag === 'tspan') return _splitTextSvg(element, type);

  // An SVG container (a card's button group when the animation has no `target`):
  // splitting its textContent would replace its shapes with <tspan>s. Split each
  // <text> inside it instead.
  const texts = Array.from(element.querySelectorAll('text'));
  if (texts.length === 0) {
    lcardsLog.warn('[_splitText] SVG target has no <text> to animate', { tagName: element.tagName });
    return { units: [], revert: () => {} };
  }
  const splits = texts.map(text => _splitTextSvg(text, type));
  return {
    units: splits.flatMap(s => s.units),
    revert: () => splits.forEach(s => s.revert())
  };
}

/**
 * The elements whose own text a decode rewrites: a <text>/<tspan> (or HTML element)
 * with no child elements, or every such element inside a container (a card's button
 * group when the animation has no `target`). Multi-line text keeps its <tspan>s.
 * @param {Element} element
 * @returns {Element[]}
 * @private
 */
function _textLeaves(element) {
  if (!element) return [];
  const isLeaf = (/** @type {Element} */ el) => el.children.length === 0 && (el.textContent ?? '').trim() !== '';
  if (isLeaf(element)) return [element];
  const selector = _isSvgElement(element) ? 'text, tspan' : '*';
  return Array.from(element.querySelectorAll(selector)).filter(isLeaf);
}

/**
 * anime.js writes an unknown property on an SVG element as an attribute, so
 * scrambleText() can't drive `textContent` of a <text> directly. It animates a proxy
 * object and copies its text across; this wraps that animation in the surface
 * AnimationManager tracks (see _reportPresetInstances in lcards-anim-helpers.js) and
 * puts the real text back whenever it is stopped, completed or reverted.
 * @param {any} anim - anime.js animation on the proxy
 * @param {Element} el - the text element shown
 * @param {string} original - its text before the animation
 * @private
 */
function _textAnimationHandle(anim, el, original) {
  const restore = () => { el.textContent = original; };
  return {
    targets: [el],
    get completed() { return anim.completed; },
    get iterationCount() { return anim.iterationCount; },
    get currentTime() { return anim.currentTime; },
    get speed() { return anim.speed; },
    set speed(v) { anim.speed = v; },
    seek(time) { anim.seek(time); return this; },
    pause() { anim.pause(); return this; },
    complete() { anim.complete(); restore(); return this; },
    cancel() { anim.cancel(); restore(); return this; },
    revert() { anim.revert(); restore(); return this; },
  };
}

/**
 * setup() for a decode: each text line gets its own scrambleText() animation on a
 * proxy (see _textAnimationHandle), handed to AnimationManager via _presetInstances.
 * @param {Record<string, any>} options - scrambleText params (duration may be a function of the proxy)
 * @param {{ loop: any, delay: number, seed?: number }} timing
 * @param {string} name - preset name, for logs
 * @private
 */
function _decodeSetup(options, { loop, delay, seed }, name) {
  return (element) => {
    const animejs = window.lcards?.anim?.animejs;
    if (!animejs?.scrambleText || !animejs?.animate) {
      lcardsLog.warn(`[${name}] anime.js scrambleText not available`);
      return;
    }
    element._animTargets = null; // self-managed; skip anim-helpers main call
    element._presetInstances = _textLeaves(element).map((leaf, i) => {
      const original = leaf.textContent ?? '';
      const proxy = { textContent: original };
      const anim = animejs.animate(proxy, {
        // A different seed per line, so lines don't scramble in lockstep
        textContent: animejs.scrambleText({ ...options, ...(typeof seed === 'number' ? { seed: seed + i } : {}) }),
        delay,
        loop,
        onUpdate: () => { leaf.textContent = proxy.textContent; },
        onComplete: () => { leaf.textContent = original; },
      });
      return _textAnimationHandle(anim, leaf, original);
    });
  };
}

/**
 * Text animation presets.
 *
 * Each preset's setup() stores split char/word/line targets in element._animTargets.
 * lcards-anim-helpers.js picks up element._animTargets after setup() runs and passes
 * the array directly to anime() — no `targets:` key is needed in the anime config.
 *
 * Setting element._animTargets = null in setup() signals that the preset self-managed
 * the anime call entirely (e.g. text-scramble) and anim-helpers should skip the main
 * anime() invocation for that element.
 */
export const TEXT_PRESETS = {
  /**
   * Text Reveal – character-by-character or word/line reveal with stagger.
   *
   * params: split ('chars'|'words'|'lines'), direction, stagger, duration,
   *         from_opacity, from_y, ease, loop
   */
  'text-reveal': (def) => {
    const p = resolvePresetParams(def);
    const split     = p.split     || 'chars';
    const direction = p.direction || 'first';
    const stagger   = p.stagger   !== undefined ? p.stagger   : 50;
    const duration  = p.duration  || 800;
    const fromOpacity = p.from_opacity !== undefined ? p.from_opacity : 0;
    const fromY       = p.from_y      !== undefined ? p.from_y      : 20;
    const ease = getResolvedEasing(p) || 'outQuad'; // v4 easing name (was 'easeOutQuad')
    const loop = p.loop !== undefined ? p.loop : false;

    return {
      anime: {
        // targets come from element._animTargets (set by setup); no targets: key here
        opacity:    [fromOpacity, 1],
        translateY: [fromY, 0],
        duration,
        ease,
        loop,
        delay: { _stagger: true, value: stagger, from: direction }
      },
      batch: false, // staggers each element's own split characters
      styles: {},
      setup(element) {
        if (!element) return;
        const splitter = _splitText(element, split);
        element._textSplitter = splitter;
        element._animTargets  = splitter.units;
        lcardsLog.debug('[text-reveal] split complete', {
          tag: element.tagName, split, count: splitter.units.length
        });
      },
      cleanup(element) {
        if (element?._textSplitter) {
          element._textSplitter.revert();
          delete element._textSplitter;
        }
      }
    };
  },

  /**
   * Text Scramble - the shipped name for the decode (see text-decode), with its
   * original params mapped across so existing configs keep their timing:
   * a line takes `duration` + (characters - 1) x `stagger` ms, as before.
   *
   * params:
   *   duration    (default 800)  - ms each character spends scrambling
   *   stagger     (default 40)   - ms between characters starting
   *   delay       (default 0)    - ms before it starts
   *   loop        (default false)
   *   characters  - scramble glyphs (default: A-Z, 0-9 and !@#$%^&*); chars works too
   *   settle_at   - deprecated, no longer used (the decode settles each character itself)
   *   Any text-decode param (from, cursor, perturbation, seed, ...) works here too.
   */
  'text-scramble': (def) => {
    const p = resolvePresetParams(def);
    const perChar = p.duration || 800;
    const stagger = p.stagger !== undefined ? p.stagger : 40;
    const options = {
      chars: p.characters ?? p.chars ?? 'A-Z0-9!@#$%^&*',
      from: p.from ?? 'left',
      // Per line: the original preset's wall-clock time
      duration: (/** @type {any} */ proxy) => perChar + Math.max(0, String(proxy?.textContent ?? '').length - 1) * stagger,
      ...(p.reversed === true ? { reversed: true } : {}),
      ...(p.cursor !== undefined ? { cursor: p.cursor } : {}),
      ...(p.perturbation !== undefined ? { perturbation: p.perturbation } : {}),
      ...(p.reveal_rate !== undefined ? { revealRate: p.reveal_rate } : {}),
    };
    return {
      anime: {},
      styles: {},
      setup: _decodeSetup(options, {
        loop: p.loop !== undefined ? p.loop : false,
        delay: typeof p.delay === 'number' ? p.delay : 0,
        seed: typeof p.seed === 'number' ? p.seed : undefined,
      }, 'text-scramble'),
    };
  },

  /**
   * Text Decode - LCARS readout decode, on anime.js 4.5's scrambleText().
   *
   * The text starts as scrambled glyphs and resolves character by character from
   * `from`, with an optional cursor at the leading edge. Each text line is decoded on
   * its own; the visible text is restored on stop.
   *
   * params:
   *   duration      (default 1000) - ms for the whole decode
   *   chars         (default 'A-Z0-9') - scramble glyphs: a named set (uppercase,
   *                 lowercase, numbers, symbols, blocks, shades, braille) or ranges
   *   from          (default 'left') - 'left', 'right', 'center', 'random'
   *   reversed      - reveal in the opposite order ('center' then reveals edges first)
   *   cursor        - true for '_', or the cursor characters
   *   perturbation  - 0 to 1: random timing per character, for a less even reveal
   *   reveal_rate   - characters per second entering the reveal (anime.js default 60)
   *   seed          - a number: the same scramble on every load
   *   loop          (default false)
   */
  'text-decode': (def) => {
    const p = resolvePresetParams(def);
    const options = {
      chars: p.chars ?? 'A-Z0-9',
      from: p.from ?? 'left',
      duration: p.duration || 1000,
      ...(p.reversed === true ? { reversed: true } : {}),
      ...(p.cursor !== undefined ? { cursor: p.cursor } : {}),
      ...(p.perturbation !== undefined ? { perturbation: p.perturbation } : {}),
      ...(p.reveal_rate !== undefined ? { revealRate: p.reveal_rate } : {}),
    };
    return {
      anime: {}, // setup() drives it
      styles: {},
      setup: _decodeSetup(options, {
        loop: p.loop !== undefined ? p.loop : false,
        delay: typeof p.delay === 'number' ? p.delay : 0,
        seed: typeof p.seed === 'number' ? p.seed : undefined,
      }, 'text-decode'),
    };
  },

  /**
   * Text Glitch – random per-character jitter displacement.
   *
   * HTML path: animates CSS translateX/translateY on inline-block <span> elements.
   *            Optional color_shift applies a hue-rotate filter.
   * SVG path:  animates the SVG `dx`/`dy` presentation attributes on <tspan> elements.
   *            color_shift is not supported on SVG tspan.
   *
   * params:
   *   intensity    (default 5)    – max displacement in px / SVG units
   *   duration     (default 300)  – ms per glitch cycle
   *   stagger      (default 50)   – ms offset between characters
   *   color_shift  (default false) – hue rotate on each character (HTML only)
   *   loop         (default false) – repeat
   *   seed         – a number: the same jitter on every load
   */
  'text-glitch': (def) => {
    const p = resolvePresetParams(def);
    const intensity  = p.intensity   !== undefined ? p.intensity  : 5;
    const duration   = p.duration    || 300;
    const stagger    = p.stagger     !== undefined ? p.stagger    : 50;
    const colorShift = p.color_shift || false;
    const loop       = p.loop        !== undefined ? p.loop       : false;
    const random     = presetRandom(p.seed);

    const htmlAnimConfig = {
      duration,
      ease: 'inOutQuad', // v4 easing name (was 'easeInOutQuad')
      loop,
      delay: { _stagger: true, value: stagger, from: 'first' },
      // Function form: called once per element, generates unique random displacement per char
      translateX: () => [0, (random() - 0.5) * intensity * 2],
      translateY: () => [0, (random() - 0.5) * intensity * 2]
    };
    if (colorShift) {
      htmlAnimConfig.filter = () => {
        const hue = random() * 30 - 15;
        return [`hue-rotate(0deg)`, `hue-rotate(${hue}deg)`];
      };
    }

    return {
      anime: htmlAnimConfig, // used for HTML path only
      batch: false, // staggers each element's own split characters
      styles: {},
      setup(element) {
        if (!element) return;
        const splitter = _splitText(element, 'chars');
        element._textSplitter = splitter;
        const units = splitter.units;

        if (_isSvgElement(element)) {
          // SVG path: self-manage using dx/dy attributes
          element._animTargets = null;
          const anime = window.lcards?.anim?.anime;
          if (!anime) { lcardsLog.warn('[text-glitch] anime.animate not available'); return; }

          // One animation over all characters, handed to AnimationManager (tracked,
          // stoppable, gated); stopping it also puts the unsplit text back
          if (units.length) {
            const anim = anime(units, {
              dx:       () => [0, (random() - 0.5) * intensity * 2, 0],
              dy:       () => [0, (random() - 0.5) * intensity * 2, 0],
              duration,
              ease:     'inOutQuad', // v4 easing name (was 'easeInOutQuad')
              loop,
              delay:    (/** @type {any} */ _el, /** @type {number} */ i) => i * stagger
            });
            element._presetInstances = [withRevertHook(anim, () => {
              if (element._textSplitter) { element._textSplitter.revert(); delete element._textSplitter; }
            })];
          }
        } else {
          // HTML path: hand targets to anim-helpers with CSS transform config
          units.forEach(u => { /** @type {HTMLElement} */ (u).style.display = 'inline-block'; });
          element._animTargets = units;
        }

        lcardsLog.debug('[text-glitch] split complete', {
          tag: element.tagName, isSvg: _isSvgElement(element), count: units.length
        });
      },
      cleanup(element) {
        if (element?._textSplitter) {
          element._textSplitter.revert();
          delete element._textSplitter;
        }
      }
    };
  },

  /**
   * Text Typewriter – reveals characters one at a time.
   *
   * params: speed, loop
   */
  'text-typewriter': (def) => {
    const p = resolvePresetParams(def);
    const speed = p.speed !== undefined ? p.speed : 100;
    const loop  = p.loop  !== undefined ? p.loop  : false;

    return {
      anime: {
        opacity: [0, 1],
        delay:   (_el, i) => i * speed,
        duration: 1,
        ease:    'linear',
        loop
      },
      styles: {},
      setup(element) {
        if (!element) return;

        const splitter = _splitText(element, 'chars');
        element._textSplitter = splitter;
        element._animTargets  = splitter.units;

        // All chars start hidden; anime will fade each in
        splitter.units.forEach(u => { /** @type {HTMLElement} */ (u).style.opacity = '0'; });

        lcardsLog.debug('[text-typewriter] split complete', {
          tag: element.tagName, count: splitter.units.length, speed
        });
      },
      cleanup(element) {
        if (!element) return;
        if (element._textSplitter) {
          element._textSplitter.revert();
          delete element._textSplitter;
        }
      }
    };
  }
};
