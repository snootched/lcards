/**
 * Text Animation Presets
 *
 * Text-based animations using character/word/line splitting.
 * These presets animate individual text elements for reveal, scramble, and motion effects.
 *
 * Since anime.js v4 doesn't have a built-in splitText() function,
 * we implement a simple text splitter that wraps characters/words/lines in spans.
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

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 * @private
 */
function _escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Simple text splitter utility
 * Splits text into characters, words, or lines and wraps each in a span
 * 
 * @param {Element} element - The text element to split
 * @param {Object} options - Split options
 * @param {string} options.type - Split type: 'chars', 'words', or 'lines'
 * @param {string} options.charsClass - CSS class for character spans
 * @returns {Object} Splitter object with revert() method
 * @private
 */
function _splitText(element, options = {}) {
  const { type = 'chars', charsClass = 'lcards-char-split' } = options;
  
  if (!element) {
    lcardsLog.warn('[_splitText] No element provided');
    return { revert: () => {} };
  }

  // Store original content for revert
  const originalHTML = element.innerHTML;
  const originalText = element.textContent;

  let wrappedHTML = '';

  if (type === 'chars') {
    // Split into characters (using Array.from for proper Unicode support)
    const chars = Array.from(originalText);
    wrappedHTML = chars
      .map(char => `<span class="${charsClass}">${_escapeHtml(char)}</span>`)
      .join('');
  } else if (type === 'words') {
    // Split into words (preserving spaces)
    const words = originalText.split(/(\s+)/);
    wrappedHTML = words
      .map(word => {
        if (word.match(/^\s+$/)) {
          // Preserve whitespace as-is
          return word;
        }
        return `<span class="${charsClass}">${_escapeHtml(word)}</span>`;
      })
      .join('');
  } else if (type === 'lines') {
    // Split into lines
    const lines = originalText.split('\n');
    wrappedHTML = lines
      .map(line => `<span class="${charsClass}">${_escapeHtml(line)}</span>`)
      .join('\n');
  }

  element.innerHTML = wrappedHTML;

  return {
    revert: () => {
      element.innerHTML = originalHTML;
    }
  };
}

/**
 * Text animation presets
 * Each preset returns animation configuration with setup/cleanup functions
 */
export const TEXT_PRESETS = {
  /**
   * Text Reveal - Character-by-character reveal
   * 
   * Splits text into characters/words and reveals them with a stagger effect.
   * Characters fade in and optionally translate from a Y offset.
   *
   * Parameters:
   * - split (default: 'chars') - Split type: 'chars', 'words', or 'lines'
   * - direction (default: 'first') - Stagger direction: 'first', 'last', 'center'
   * - stagger (default: 50) - ms delay between characters
   * - duration (default: 800) - per-character animation duration
   * - from_opacity (default: 0) - starting opacity
   * - from_y (default: 20) - starting Y offset in pixels
   * - easing (default: 'easeOutQuad')
   * - loop (default: false)
   *
   * Example:
   * {
   *   preset: 'text-reveal',
   *   targets: '.card-title',
   *   params: { split: 'chars', stagger: 30, from_y: 10 }
   * }
   */
  'text-reveal': (def) => {
    const p = def.params || def;
    const split = p.split || 'chars';
    const direction = p.direction || 'first';
    const stagger = p.stagger !== undefined ? p.stagger : 50;
    const duration = p.duration || 800;
    const fromOpacity = p.from_opacity !== undefined ? p.from_opacity : 0;
    const fromY = p.from_y !== undefined ? p.from_y : 20;
    const easing = p.easing || 'easeOutQuad';
    const loop = p.loop !== undefined ? p.loop : false;

    return {
      anime: {
        targets: '.lcards-char-split',
        opacity: [fromOpacity, 1],
        translateY: [fromY, 0],
        duration,
        easing,
        loop,
        delay: {
          _stagger: true,
          value: stagger,
          from: direction
        }
      },
      styles: {},
      setup: (element) => {
        if (!element) return;

        // Split text into characters/words/lines
        element._textSplitter = _splitText(element, {
          type: split,
          charsClass: 'lcards-char-split'
        });

        lcardsLog.debug('[text-reveal] Text split complete', {
          element: element.tagName,
          split,
          charCount: element.querySelectorAll('.lcards-char-split').length
        });
      },
      cleanup: (element) => {
        if (element && element._textSplitter) {
          element._textSplitter.revert();
          delete element._textSplitter;
        }
      }
    };
  },

  /**
   * Text Scramble - Matrix-style scramble effect
   * 
   * Scrambles characters before revealing the final text.
   * Each character cycles through random characters before settling on the correct one.
   *
   * Parameters:
   * - duration (default: 1000) - total animation duration
   * - characters (default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*') - character set for scrambling
   * - iterations (default: 8) - number of scramble cycles per character
   * - stagger (default: 30) - delay between starting each character's scramble
   * - loop (default: false)
   *
   * Example:
   * {
   *   preset: 'text-scramble',
   *   targets: '.status-text',
   *   params: { iterations: 12, stagger: 20 }
   * }
   */
  'text-scramble': (def) => {
    const p = def.params || def;
    const duration = p.duration || 1000;
    const characters = p.characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const iterations = p.iterations !== undefined ? p.iterations : 8;
    const stagger = p.stagger !== undefined ? p.stagger : 30;
    const loop = p.loop !== undefined ? p.loop : false;

    return {
      anime: {
        targets: '.lcards-char-split',
        duration,
        easing: 'linear',
        loop,
        delay: {
          _stagger: true,
          value: stagger,
          from: 'first'
        },
        // Use keyframes to cycle through random characters
        innerHTML: (el) => {
          const originalChar = el.getAttribute('data-original-char') || el.textContent;
          const keyframes = [];
          
          // Generate random character keyframes
          for (let i = 0; i < iterations; i++) {
            const randomChar = characters[Math.floor(Math.random() * characters.length)];
            keyframes.push(randomChar);
          }
          
          // Final keyframe reveals original character
          keyframes.push(originalChar);
          
          return keyframes;
        }
      },
      styles: {},
      setup: (element) => {
        if (!element) return;

        // Store original text content as array for proper Unicode indexing
        const originalChars = Array.from(element.textContent);

        // Split text into characters
        element._textSplitter = _splitText(element, {
          type: 'chars',
          charsClass: 'lcards-char-split'
        });

        // Store original character in data attribute for each span
        const chars = element.querySelectorAll('.lcards-char-split');
        chars.forEach((char, i) => {
          char.setAttribute('data-original-char', originalChars[i] || '');
        });

        lcardsLog.debug('[text-scramble] Text split complete', {
          element: element.tagName,
          charCount: chars.length,
          iterations
        });
      },
      cleanup: (element) => {
        if (element && element._textSplitter) {
          element._textSplitter.revert();
          delete element._textSplitter;
        }
      }
    };
  },

  /**
   * Text Wave - Wave motion through text
   * 
   * Animates characters in a wave pattern with vertical movement.
   * Creates a smooth sine wave effect across the text.
   *
   * Parameters:
   * - amplitude (default: 20) - wave height in pixels
   * - wavelength (default: 3) - characters per wave cycle
   * - duration (default: 2000) - animation duration
   * - stagger (default: 100) - phase shift between characters
   * - easing (default: 'easeInOutSine')
   * - loop (default: true)
   * - alternate (default: true)
   *
   * Example:
   * {
   *   preset: 'text-wave',
   *   targets: '.animated-title',
   *   params: { amplitude: 30, wavelength: 4, duration: 1500 }
   * }
   */
  'text-wave': (def) => {
    const p = def.params || def;
    const amplitude = p.amplitude !== undefined ? p.amplitude : 20;
    const wavelength = p.wavelength !== undefined ? p.wavelength : 3;
    const duration = p.duration || 2000;
    const stagger = p.stagger !== undefined ? p.stagger : 100;
    const easing = p.easing || 'easeInOutSine';
    const loop = p.loop !== undefined ? p.loop : true;
    const alternate = p.alternate !== undefined ? p.alternate : true;

    return {
      anime: {
        targets: '.lcards-char-split',
        translateY: (el, i) => {
          // Calculate sine wave based on character position
          const phase = (i / wavelength) * Math.PI * 2;
          return [0, Math.sin(phase) * amplitude];
        },
        duration,
        easing,
        loop,
        alternate,
        delay: {
          _stagger: true,
          value: stagger,
          from: 'first'
        }
      },
      styles: {
        display: 'inline-block'
      },
      setup: (element) => {
        if (!element) return;

        // Split text into characters
        element._textSplitter = _splitText(element, {
          type: 'chars',
          charsClass: 'lcards-char-split'
        });

        // Apply inline-block to each character for transform
        const chars = element.querySelectorAll('.lcards-char-split');
        chars.forEach(char => {
          char.style.display = 'inline-block';
        });

        lcardsLog.debug('[text-wave] Text split complete', {
          element: element.tagName,
          charCount: chars.length,
          amplitude,
          wavelength
        });
      },
      cleanup: (element) => {
        if (element && element._textSplitter) {
          element._textSplitter.revert();
          delete element._textSplitter;
        }
      }
    };
  },

  /**
   * Text Glitch - Per-character glitch effect
   * 
   * Creates random position and color shifts for each character,
   * simulating a glitch/distortion effect.
   *
   * Parameters:
   * - intensity (default: 5) - max pixel displacement
   * - duration (default: 300) - animation duration
   * - stagger (default: 50) - randomize start times
   * - color_shift (default: false) - enable hue-rotate filter
   * - loop (default: false)
   *
   * Example:
   * {
   *   preset: 'text-glitch',
   *   targets: '.error-message',
   *   params: { intensity: 8, color_shift: true, loop: true }
   * }
   */
  'text-glitch': (def) => {
    const p = def.params || def;
    const intensity = p.intensity !== undefined ? p.intensity : 5;
    const duration = p.duration || 300;
    const stagger = p.stagger !== undefined ? p.stagger : 50;
    const colorShift = p.color_shift || false;
    const loop = p.loop !== undefined ? p.loop : false;

    const animConfig = {
      targets: '.lcards-char-split',
      duration,
      easing: 'easeInOutQuad',
      loop,
      delay: {
        _stagger: true,
        value: stagger,
        from: 'first'
      },
      // Generate random displacement for each character
      translateX: () => {
        return [0, (Math.random() - 0.5) * intensity * 2];
      },
      translateY: () => {
        return [0, (Math.random() - 0.5) * intensity * 2];
      }
    };

    // Add color shift if enabled
    if (colorShift) {
      animConfig.filter = () => {
        const hueShift = Math.random() * 30 - 15; // Random shift between -15 and 15 degrees
        return [`hue-rotate(0deg)`, `hue-rotate(${hueShift}deg)`];
      };
    }

    return {
      anime: animConfig,
      styles: {
        display: 'inline-block'
      },
      setup: (element) => {
        if (!element) return;

        // Split text into characters
        element._textSplitter = _splitText(element, {
          type: 'chars',
          charsClass: 'lcards-char-split'
        });

        // Apply inline-block to each character for transform
        const chars = element.querySelectorAll('.lcards-char-split');
        chars.forEach(char => {
          char.style.display = 'inline-block';
        });

        lcardsLog.debug('[text-glitch] Text split complete', {
          element: element.tagName,
          charCount: chars.length,
          intensity,
          colorShift
        });
      },
      cleanup: (element) => {
        if (element && element._textSplitter) {
          element._textSplitter.revert();
          delete element._textSplitter;
        }
      }
    };
  },

  /**
   * Text Typewriter - Typewriter reveal effect
   * 
   * Reveals characters one at a time in sequence, like a typewriter.
   * Optionally displays a blinking cursor during and after typing.
   *
   * Parameters:
   * - speed (default: 100) - ms per character
   * - cursor (default: true) - show blinking cursor
   * - cursor_char (default: '|') - cursor character
   * - cursor_blink_speed (default: 530) - cursor blink speed in ms
   * - loop (default: false)
   *
   * Example:
   * {
   *   preset: 'text-typewriter',
   *   targets: '.console-output',
   *   params: { speed: 50, cursor: true, cursor_char: '_' }
   * }
   */
  'text-typewriter': (def) => {
    const p = def.params || def;
    const speed = p.speed !== undefined ? p.speed : 100;
    const cursor = p.cursor !== undefined ? p.cursor : true;
    const cursorChar = p.cursor_char || '|';
    const cursorBlinkSpeed = p.cursor_blink_speed || 530;
    const loop = p.loop !== undefined ? p.loop : false;

    return {
      anime: {
        targets: '.lcards-char-split',
        opacity: [0, 1],
        delay: (el, i) => i * speed,
        duration: 1,
        easing: 'linear',
        loop
      },
      styles: {},
      setup: (element) => {
        if (!element) return;

        // Split text into characters
        element._textSplitter = _splitText(element, {
          type: 'chars',
          charsClass: 'lcards-char-split'
        });

        // Set all characters to opacity 0 initially
        const chars = element.querySelectorAll('.lcards-char-split');
        chars.forEach(char => {
          char.style.opacity = '0';
        });

        // Add cursor if enabled
        if (cursor) {
          // Sanitize cursor character to prevent CSS injection
          const sanitizedCursor = cursorChar
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/'/g, "\\'")    // Escape single quotes
            .replace(/"/g, '\\"');   // Escape double quotes

          // Generate unique style ID for this element's cursor settings
          const elementId = element.id || `lcards-typewriter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          if (!element.id) {
            element.id = elementId;
          }
          const styleId = `lcards-typewriter-cursor-${elementId}`;
          
          // Check if this specific style already exists
          let styleEl = document.getElementById(styleId);
          
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
              #${elementId}.lcards-typewriter-cursor::after {
                content: '${sanitizedCursor}';
                animation: lcards-cursor-blink ${cursorBlinkSpeed}ms step-end infinite;
                margin-left: 2px;
              }
              @keyframes lcards-cursor-blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
              }
            `;
            document.head.appendChild(styleEl);
            
            // Store style element reference for cleanup
            element._cursorStyleEl = styleEl;
          }

          // Add cursor class to element for styling
          element.classList.add('lcards-typewriter-cursor');
        }

        lcardsLog.debug('[text-typewriter] Text split complete', {
          element: element.tagName,
          charCount: chars.length,
          speed,
          cursor
        });
      },
      cleanup: (element) => {
        if (element) {
          // Remove cursor class
          element.classList.remove('lcards-typewriter-cursor');
          
          // Remove cursor style element if it exists
          if (element._cursorStyleEl) {
            element._cursorStyleEl.remove();
            delete element._cursorStyleEl;
          }
          
          // Revert text split
          if (element._textSplitter) {
            element._textSplitter.revert();
            delete element._textSplitter;
          }
        }
      }
    };
  }
};
