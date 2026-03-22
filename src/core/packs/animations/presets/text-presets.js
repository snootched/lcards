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
import { resolveEasing } from '../../../../utils/lcards-anim-helpers.js';

/**
 * Helper function to resolve easing configuration
 */
function getResolvedEasing(params) {
  if (params.ease_params) {
    return resolveEasing({ type: params.ease, params: params.ease_params });
  }
  return params.ease;
}

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
  return _isSvgElement(element)
    ? _splitTextSvg(element, type)
    : _splitTextHtml(element, type);
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
    const p = def.params || def;
    const split     = p.split     || 'chars';
    const direction = p.direction || 'first';
    const stagger   = p.stagger   !== undefined ? p.stagger   : 50;
    const duration  = p.duration  || 800;
    const fromOpacity = p.from_opacity !== undefined ? p.from_opacity : 0;
    const fromY       = p.from_y      !== undefined ? p.from_y      : 20;
    const ease = getResolvedEasing(p) || 'easeOutQuad';
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
   * Text Scramble – matrix-style character scramble.
   *
   * Each character scrambles for `duration` ms, then snaps to its real value.
   * Characters start staggered by `stagger` ms so the scramble rolls across the text.
   * Total wall-clock time ≈ delay + duration + (chars - 1) × stagger.
   *
   * To slow the effect down, increase `duration` (time each char spends scrambling)
   * and/or `stagger` (gap between each character starting).
   *
   * setup() self-manages all anime calls and sets element._animTargets = null to
   * prevent anim-helpers from making an additional redundant anime() call.
   *
   * Works for both HTML <span> and SVG <tspan> targets.
   *
   * params:
   *   duration    (default 800)  – ms each character spends scrambling before settling
   *   stagger     (default 40)   – ms between each character starting
   *   delay       (default 0)    – ms to wait before the first character begins
   *   loop        (default false) – replay the scramble indefinitely
   *   settle_at   (default 0.85) – fraction [0–1] of duration spent scrambling;
   *                                 remainder is the "settled" hold before loop/end
   *   characters                 – pool of random chars to cycle through
   *
   * Note: `ease`, `alternate`, and `scramble_iterations` are not applicable and are
   *       silently ignored — the scramble is driven entirely by textContent mutation,
   *       not by an interpolated CSS/SVG property.
   */
  'text-scramble': (def) => {
    const p = def.params || def;
    const duration  = p.duration  || 800;
    const stagger   = p.stagger   !== undefined ? p.stagger    : 40;
    const delay     = p.delay     !== undefined ? p.delay      : 0;
    const loop      = p.loop      !== undefined ? p.loop       : false;
    const settleAt  = p.settle_at !== undefined ? p.settle_at  : 0.85;
    const charSet   = p.characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

    return {
      anime: {}, // empty — setup() drives the animation
      styles: {},
      setup(element) {
        if (!element) return;

        const splitter = _splitText(element, 'chars');
        element._textSplitter = splitter;
        element._animTargets = null; // self-managed; skip anim-helpers main call

        const units = splitter.units;
        const anime = window.lcards?.anim?.anime;
        if (!anime) {
          lcardsLog.warn('[text-scramble] anime.animate not available');
          return;
        }

        const settleThreshold = duration * settleAt;

        units.forEach((unit, i) => {
          const originalText = unit.textContent;
            // A tiny imperceptible delta forces a real tween so onUpdate fires every frame.
            // The scramble IS the textContent mutation — no visible opacity change.
            anime(unit, {
              opacity:  [0.9999, 1],
            duration,
            delay:    delay + i * stagger,
            ease:     'linear',
            loop,
            onUpdate(anim) {
              // Scramble random chars for settleAt fraction of duration, then hold original
              if (anim.currentTime < settleThreshold) {
                unit.textContent = charSet[Math.floor(Math.random() * charSet.length)];
              } else {
                unit.textContent = originalText;
              }
            },
            onComplete() {
              unit.textContent = originalText;
            }
          });
        });

        lcardsLog.debug('[text-scramble] self-managed animation started', {
          tag: element.tagName, count: units.length, duration, stagger, delay, loop, settleAt
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
   */
  'text-glitch': (def) => {
    const p = def.params || def;
    const intensity  = p.intensity   !== undefined ? p.intensity  : 5;
    const duration   = p.duration    || 300;
    const stagger    = p.stagger     !== undefined ? p.stagger    : 50;
    const colorShift = p.color_shift || false;
    const loop       = p.loop        !== undefined ? p.loop       : false;

    const htmlAnimConfig = {
      duration,
      ease: 'easeInOutQuad',
      loop,
      delay: { _stagger: true, value: stagger, from: 'first' },
      // Function form: called once per element, generates unique random displacement per char
      translateX: () => [0, (Math.random() - 0.5) * intensity * 2],
      translateY: () => [0, (Math.random() - 0.5) * intensity * 2]
    };
    if (colorShift) {
      htmlAnimConfig.filter = () => {
        const hue = Math.random() * 30 - 15;
        return [`hue-rotate(0deg)`, `hue-rotate(${hue}deg)`];
      };
    }

    return {
      anime: htmlAnimConfig, // used for HTML path only
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

          units.forEach((unit, i) => {
            const dxVal = (Math.random() - 0.5) * intensity * 2;
            const dyVal = (Math.random() - 0.5) * intensity * 2;
            anime(unit, {
              dx:       [0, dxVal, 0],
              dy:       [0, dyVal, 0],
              duration,
              ease:     'easeInOutQuad',
              loop,
              delay:    i * stagger
            });
          });
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
    const p = def.params || def;
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
