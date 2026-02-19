/**
 * Alert Component (Unified Format v2)
 *
 * LCARS alert symbol component with animated bar segments and condition presets.
 * Provides visual alerts for critical status monitoring and alarm states.
 *
 * This component uses the unified component format with inline SVG, following
 * the same architecture as DPAD. All segment configurations use theme tokens
 * for consistent styling across themes.
 *
 * Architecture:
 * - 1 shape segment  (#alert-shape path — the shield outline)
 * - 1 bars segment   ([id^="bar-"] — 12 bar lines in top and bottom caps, queried all at once)
 * - 2 text overlays  (alert_text, sub_text — standard button text overlay fields, NOT SVG segments)
 * - Total: 2 SVG segments + 2 text overlay fields
 *
 * Presets:
 * - default        — neutral/grey (standby)
 * - condition_red  — red alert (emergency)
 * - condition_blue — blue alert (security/tactical)
 * - condition_yellow — yellow alert (caution)
 * - condition_green  — all clear (normal)
 * - condition_grey   — standby
 * - condition_black  — system critical (darkest)
 *
 * @module core/packs/components/alert
 */

/**
 * Alert SVG Shape (Inline) — v2 LCARS shield/capsule design
 *
 * The shape is a stylised LCARS alert shield with:
 * - A solid path making up the shield outline (fill-rule evenodd to cut the centre open)
 * - 12 horizontal bar lines: bar-1…bar-6 fill the top cap, bar-7…bar-12 fill the bottom cap.
 *   Each bar is a short vertical segment centred at x=50 with stroke-width=33.33, which
 *   renders as a wide horizontal band filling the cap (same technique as the legacy component).
 *   Bars are ordered top-to-bottom within each cap.
 * - Text labels rendered via the standard button text overlay system (alert_text, sub_text)
 *
 * ViewBox: 0 0 100 85.56
 * Top cap inner rect:    x 30.40–69.57,  y  0.00–22.50
 * Bottom cap inner rect: x 30.40–69.57,  y 51.04–73.56
 * Bar height: ~1.882 units  |  Bar gap: ~1.591 units  |  stroke-width: 33.33
 */
const alertSvg = `<svg viewBox="0 0 100 85.56" xmlns="http://www.w3.org/2000/svg">

  <!-- Shield outline (fill-rule evenodd cuts the interior open) -->
  <g id="alert-shape">
    <path fill-rule="evenodd" clip-rule="evenodd" d="
      M30.40 0 V21.00 C30.40 21.84 31.06 22.50 31.89 22.50
      H68.08 C68.91 22.50 69.57 21.84 69.57 21.00 V0
      C77.94 2.90 85.08 7.63 90.35 13.59
      L75.92 25.26 H24.08 L9.29 13.59
      C14.62 7.63 22.01 2.90 30.40 0Z
      M1.08 28.36 C0.37 31.07 0 33.84 0 36.63
      C0 39.42 0.37 42.19 1.08 44.90
      H15.10 V28.36 H1.08Z
      M9.29 60.03 C14.62 65.90 22.01 70.62 30.40 73.56
      V52.54 C30.40 51.70 31.06 51.04 31.89 51.04
      H68.08 C68.91 51.04 69.57 51.70 69.57 52.54 V73.56
      C77.94 70.62 85.08 65.90 90.35 60.03
      L75.92 48.37 H24.08 L9.29 60.03Z
      M98.67 44.90 C99.38 42.19 99.76 39.42 99.76 36.63
      C99.76 33.84 99.38 31.07 98.67 28.36
      H84.77 V44.90 H98.67Z"/>
  </g>

  <!-- Top-cap bars (bar-1 … bar-6, top to bottom)
       Short vertical segments at x=50 with wide stroke render as horizontal bars. -->
  <g id="alert-bars">
    <line id="bar-1"  x1="50" y1="0.000"  x2="50" y2="1.882"  stroke-width="33.33"/>
    <line id="bar-2"  x1="50" y1="3.473"  x2="50" y2="5.355"  stroke-width="33.33"/>
    <line id="bar-3"  x1="50" y1="6.946"  x2="50" y2="8.828"  stroke-width="33.33"/>
    <line id="bar-4"  x1="50" y1="10.420" x2="50" y2="12.301" stroke-width="33.33"/>
    <line id="bar-5"  x1="50" y1="13.884" x2="50" y2="15.765" stroke-width="33.33"/>
    <line id="bar-6"  x1="50" y1="17.357" x2="50" y2="19.239" stroke-width="33.33"/>
    <!-- Bottom-cap bars (bar-7 … bar-12, top to bottom) -->
    <line id="bar-7"  x1="50" y1="54.234" x2="50" y2="56.116" stroke-width="33.33"/>
    <line id="bar-8"  x1="50" y1="57.713" x2="50" y2="59.595" stroke-width="33.33"/>
    <line id="bar-9"  x1="50" y1="61.187" x2="50" y2="63.068" stroke-width="33.33"/>
    <line id="bar-10" x1="50" y1="64.660" x2="50" y2="66.541" stroke-width="33.33"/>
    <line id="bar-11" x1="50" y1="68.133" x2="50" y2="70.015" stroke-width="33.33"/>
    <line id="bar-12" x1="50" y1="71.608" x2="50" y2="73.489" stroke-width="33.33"/>
  </g>

</svg>`;

/**
 * Alert component registry (unified format v2)
 *
 * - svg:        Inline SVG (new shield design with 12 bar lines)
 * - segments:   2 logical segments (shape, bars)
 * - text:       2 overlay text fields (alert_text, sub_text) injected into button text overlay system
 * - animations: Component-level animations registered with the SVG container as scope
 *               so that target '[id^="bar-"]' resolves all 12 bars via querySelectorAll
 * - presets:    7 named condition presets that each override segment styles + text
 *
 * @type {Object.<string, Object>}
 */
export const alertComponents = {
    'alert': {
        svg: alertSvg,

        orientation: 'square',

        features: ['multi-segment', 'state-based-styling', 'animation-targets', 'presets', 'text-overlay'],

        // ---------------------------------------------------------------------------
        // Default segment definitions
        // Styles use theme: tokens so they adapt to the active theme automatically.
        // The bars segment selector targets all 12 bars in one go.
        // ---------------------------------------------------------------------------
        segments: {
            shape: {
                selector: '#alert-shape path',
                style: {
                    fill: 'theme:components.alert.shape.fill'
                }
            },
            bars: {
                selector: '[id^="bar-"]',
                style: {
                    stroke: 'theme:components.alert.bars.stroke'
                }
            }
        },

        // ---------------------------------------------------------------------------
        // text_areas — named map of interior cavities, in viewBox coordinate space
        // (viewBox: 0 0 100 85.56).  _buildComponentTextMarkup() uses these directly
        // to position text in viewBox units so it scales 1:1 with the shape.
        //
        // Each text field declares which area it lives in via its `text_area` key.
        // Position / x_percent / y_percent are resolved relative to that area.
        // font_size is in viewBox units; font_size_percent (% of area height) is
        // an alternative that is independent of the viewBox scale.
        //
        // 'center' cavity — between the two bar-cap sections, clear of side panels:
        //   Top wing join:    y = 25.26  (where diagonals meet the centre section)
        //   Bottom wing join: y = 48.37
        //   Left side panel:  x = 15.10  (inner edge of left slab)
        //   Right side panel: x = 84.77  (inner edge of right slab)
        //
        // Split into two named areas (one per label) so the editor can expose a
        // text_area dropdown and each label can be independently sized/positioned.
        // ---------------------------------------------------------------------------
        text_areas: {
            alert_line: {
                x:      15.10,
                y:      25.26,
                width:  69.67,
                height: 13.00   // upper portion of the cavity (~56% of 23.11)
            },
            sub_line: {
                x:      15.10,
                y:      38.26,  // 25.26 + 13.00
                width:  69.67,
                height: 10.11   // lower portion (25.26 + 23.11 − 38.26 ≈ 10.11)
            }
        },

        // ---------------------------------------------------------------------------
        // Default text field configs.
        // font_size is in viewBox units (same coordinate space as x/y).
        // Each field is centred within its own named text area.
        //   alert_line height = 13.00  →  font_size 10 ≈ 77% of area height
        //   sub_line   height = 10.11  →  font_size  7 ≈ 69% of area height
        // Use font_size_percent for a more intuitive size declaration.
        // ---------------------------------------------------------------------------
        text: {
            alert_text: {
                text_area:   'alert_line',
                content:     'ALERT',
                show:        true,
                position:    'center',
                font_size:   10,
                font_weight: '500',
                padding:     0
            },
            sub_text: {
                text_area:   'sub_line',
                content:     'CONDITION',
                show:        true,
                position:    'center',
                font_size:   7,
                font_weight: '200',
                padding:     0
            }
        },

        // ---------------------------------------------------------------------------
        // Component-level animations
        // These are registered with the SVG *container* element as the animation scope
        // (not with a single segment element), which lets querySelectorAll resolve
        // all 12 bars correctly for the stagger-grid preset.
        // ---------------------------------------------------------------------------
        animations: [
            {
                trigger: 'on_load',
                target: '[id^="bar-"]',
                preset: 'stagger-grid',
                params: {
                    // 6 rows × 1 column per cap, 2 caps = 12 bars total ordered top-to-bottom.
                    // Using a 1×12 column so stagger cascades top-to-bottom through both caps.
                    grid: [1, 12],
                    from: 'first',
                    delay: 100,
                    property: 'opacity',
                    from_value: 0.3,
                    to_value: 1,
                    duration: 2000,
                    ease: 'easeInOutSine',
                    loop: true,
                    alternate: true
                }
            }
        ],

        // ---------------------------------------------------------------------------
        // Presets
        // Each preset provides segment overrides for style and/or text.
        // Styles use theme: token paths so they are resolved through ThemeTokenResolver
        // and therefore pick up LCARS palette variables correctly.
        // ---------------------------------------------------------------------------
        presets: {
            default: {
                text: {
                    alert_text: { content: 'ALERT',     color: 'var(--lcards-gray)' },
                    sub_text:   { content: 'CONDITION', color: 'var(--lcards-gray)' }
                },
                segments: {
                    shape: { style: { fill: 'theme:colors.alert.gray' } },
                    bars:  { style: { stroke: 'theme:colors.alert.gray' } }
                }
            },

            condition_red: {
                text: {
                    alert_text: { content: 'ALERT',          color: 'var(--lcards-orange-dark)' },
                    sub_text:   { content: 'CONDITION: RED', color: 'var(--lcards-orange-dark)' }
                },
                segments: {
                    shape: { style: { fill: 'theme:colors.alert.red' } },
                    bars:  { style: { stroke: 'theme:colors.alert.red' } }
                }
            },

            condition_blue: {
                text: {
                    alert_text: { content: 'ALERT',           color: 'var(--lcards-blue-medium)' },
                    sub_text:   { content: 'CONDITION: BLUE', color: 'var(--lcards-blue-medium)' }
                },
                segments: {
                    shape: { style: { fill: 'theme:colors.alert.blue' } },
                    bars:  { style: { stroke: 'theme:colors.alert.blue' } }
                }
            },

            condition_yellow: {
                text: {
                    alert_text: { content: 'ALERT',             color: 'var(--lcards-yellow-medium)' },
                    sub_text:   { content: 'CONDITION: YELLOW', color: 'var(--lcards-yellow-medium)' }
                },
                segments: {
                    shape: { style: { fill: 'theme:colors.alert.yellow' } },
                    bars:  { style: { stroke: 'theme:colors.alert.yellow' } }
                }
            },

            condition_green: {
                text: {
                    alert_text: { content: 'ALERT',            color: 'var(--lcards-green-medium)' },
                    sub_text:   { content: 'CONDITION: GREEN', color: 'var(--lcards-green-medium)' }
                },
                segments: {
                    shape: { style: { fill: 'theme:colors.alert.green' } },
                    bars:  { style: { stroke: 'theme:colors.alert.green' } }
                }
            },

            condition_gray: {
                text: {
                    alert_text: { content: 'ALERT',           color: 'var(--lcards-gray)' },
                    sub_text:   { content: 'CONDITION: GRAY', color: 'var(--lcards-gray)' }
                },
                segments: {
                    shape: { style: { fill: 'theme:colors.alert.gray' } },
                    bars:  { style: { stroke: 'theme:colors.alert.gray' } }
                }
            },

            condition_black: {
                text: {
                    alert_text: { content: 'ALERT',             color: 'var(--lcars-ui-primary, var(--lcards-gray-medium))' },
                    sub_text:   { content: 'CONDITION: BLACK' }
                },
                segments: {
                    shape: { style: { fill: 'theme:colors.alert.black' } },
                    bars:  { style: { stroke: 'theme:colors.alert.black' } }
                }
            }
        },

        /**
         * Validate that a given preset name is defined on this component.
         * @param {string} presetName
         * @returns {boolean}
         */
        validatePreset(presetName) {
            return presetName in this.presets;
        },

        /**
         * Return the list of available preset names.
         * @returns {string[]}
         */
        getPresetNames() {
            return Object.keys(this.presets);
        },

        metadata: {
            type: 'alert',
            id: 'alert',
            name: 'Alert Symbol',
            description: 'LCARS alert symbol — shield design with animated bars and condition presets',
            version: '2.0.0'
        }
    }
};

/**
 * Get an alert component by name
 * @param {string} name - Component name
 * @returns {Object|undefined} Component object or undefined if not found
 */
export function getAlertComponent(name) {
    return alertComponents[name];
}

/**
 * Check if an alert component exists
 * @param {string} name - Component name
 * @returns {boolean} True if component exists
 */
export function hasAlertComponent(name) {
    return name in alertComponents;
}

/**
 * Get all available alert component names
 * @returns {string[]} Array of component names
 */
export function getAlertComponentNames() {
    return Object.keys(alertComponents);
}
