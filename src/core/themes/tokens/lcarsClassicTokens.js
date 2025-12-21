/**
 * @fileoverview LCARS Classic Theme Tokens (Refactored v1.15.0+)
 *
 * Minimal, component-driven token schema with HA-LCARS integration and CB-LCARS fallbacks.
 *
 * Design principles:
 * - Only includes tokens actually used by LCARdS components
 * - Organized per component (button, elbow, slider, chart, dpad, data-grid)
 * - References shared tokens (colors, borders, typography) to avoid duplication
 * - Provides semantic bridge to HA-LCARS variables (--lcars-*) with --lcards-* fallbacks
 * - All color references are validated to exist in either HA-LCARS or injected palette
 * - Supports all typical LCARdS card states (default, active, inactive, unavailable)
 *
 * Color variable convention:
 * - Primary: var(--lcars-*, var(--lcards-*))  // HA-LCARS with CB-LCARS fallback
 * - Fallback: --lcards-* variables injected by paletteInjector.js
 *
 * Computed tokens:
 * - darken(color, amount), lighten(color, amount), alpha(color, opacity), etc.
 * - These are NOT CSS functions - they are processed at runtime by ThemeTokenResolver
 * - ThemeTokenResolver converts them to valid CSS color-mix() or rgba() expressions
 * - Example: darken(colors.card.button, 0.35) → color-mix(in srgb, <resolved-color> 65%, black 35%)
 *
 * @see ThemeTokenResolver for computed token processing
 * @module core/themes/tokens/lcarsClassicTokens
 */

export const lcarsClassicTokens = {
  // ==========================================================================
  // TYPOGRAPHY
  // ==========================================================================
  typography: {
    fontFamily: {
      primary: 'var(--lcars-font, Antonio, Segoe UI Variable Static Text, Segoe UI, sans-serif)'
    },
    fontSize: {
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18
    },
    fontWeight: {
      normal: 'normal',
      bold: 'bold'
    },
    textTransform: {
      none: 'none',
      uppercase: 'uppercase'
    }
  },

  // ==========================================================================
  // BORDERS
  // ==========================================================================
  borders: {
    width: {
      none: 0,
      thin: 1,
      base: 2,
      thick: 4
    },
    radius: {
      none: 0,
      sm: 2,
      base: 4,
      lg: 8,
      xl: 12,
      full: 9999
    }
  },

  // ==========================================================================
  // COLORS (Shared palette with HA-LCARS integration)
  // ==========================================================================
  colors: {
    // Text colors
    text: {
      onLight: 'black',
      onDark: 'var(--lcars-text-gray, var(--lcards-moonlight))',
      disabled: 'var(--lcards-gray-medium-dark)'
    },

    // UI semantic colors (from HA-LCARS theme or fallback)
    ui: {
      primary: 'var(--lcars-ui-primary, var(--lcards-gray-medium))',
      secondary: 'var(--lcars-ui-secondary, var(--lcards-gray-medium-light))',
      tertiary: 'var(--lcars-ui-tertiary, var(--lcards-orange-medium-dark))',
      quaternary: 'var(--lcars-ui-quaternary, var(--lcards-gray-dark))'
    },

    // Card-specific colors (button states, etc)
    card: {
      button: 'var(--lcars-card-button, var(--lcards-gray-medium-light))',
      buttonOff: 'var(--lcars-card-button-off, var(--lcards-gray-medium))',
      buttonUnavailable: 'var(--lcars-card-button-unavailable, var(--lcards-gray-dark))',
      topColor: 'var(--lcars-card-top-color, var(--lcards-gray-dark))',
      bottomColor: 'var(--lcars-card-bottom-color, var(--lcards-gray-dark))'
    },

    // Status colors
    status: {
      success: 'var(--lcards-green-medium)',
      warning: 'var(--lcards-orange-medium)',
      error: 'var(--lcards-orange-dark)',
      unknown: 'var(--lcards-gray-medium)'
    },

    // Chart colors
    chart: {
      series: [
        'var(--lcars-orange, var(--lcards-orange-medium))',
        'var(--lcars-blue, var(--lcards-blue-medium))',
        'var(--lcards-yellow-medium)',
        'var(--lcards-green-medium)',
        'var(--lcards-orange-light)',
        'var(--lcards-blue-light)'
      ],
      grid: 'var(--lcars-gray, var(--lcards-gray-medium))',
      axis: 'var(--lcars-text-gray, var(--lcards-moonlight))',
      stroke: 'var(--lcards-moonlight)'
    }
  },

  // ==========================================================================
  // COMPONENT TOKENS
  // ==========================================================================
  components: {
    // ------------------------------------------------------------------------
    // BUTTON COMPONENT
    // ------------------------------------------------------------------------
    button: {
      background: {
        default: 'colors.card.button',
        active: 'colors.card.button',
        inactive: 'colors.card.buttonOff',
        unavailable: 'colors.card.buttonUnavailable'
      },
      border: {
        width: 'borders.width.thick',
        radius: 'borders.radius.lg',
        color: {
          default: 'colors.card.button',
          active: 'colors.card.button',
          inactive: 'colors.card.buttonOff',
          unavailable: 'colors.card.buttonUnavailable'
        }
      },
      text: {
        color: {
          default: 'colors.text.onLight',
          active: 'colors.text.onLight',
          inactive: 'colors.text.onLight',
          unavailable: 'colors.status.error'
        },
        font_size: 'typography.fontSize.base',
        font_weight: 'typography.fontWeight.bold',
        font_family: 'typography.fontFamily.primary',
        text_transform: 'typography.textTransform.uppercase'
      },
      icon: {
        size: 24,
        color: {
          default: 'colors.text.onLight',
          active: 'colors.text.onLight',
          inactive: 'colors.text.onLight',
          unavailable: 'colors.text.onLight'
        },
        divider: {
          width: 5,
          color: {
            default: 'colors.text.onLight',
            active: 'colors.text.onLight',
            inactive: 'colors.text.onLight',
            unavailable: 'colors.text.onLight'
          }
        }
      }
    },

    // ------------------------------------------------------------------------
    // ELBOW COMPONENT
    // ------------------------------------------------------------------------
    elbow: {
      stroke: {
        width: 'borders.width.thick',
        color: {
          default: 'colors.card.button',
          active: 'colors.card.button',
          inactive: 'colors.card.buttonOff',
          unavailable: 'colors.card.buttonUnavailable'
        }
      },
      text: 'components.button.text'
    },

    // ------------------------------------------------------------------------
    // SLIDER COMPONENT
    // ------------------------------------------------------------------------
    slider: {
      track: {
        height: 40,
        background: {
          default: 'colors.card.buttonOff',
          active: 'colors.card.button'
        },
        border: 'components.button.border'
      },
      text: 'components.button.text'
    },

    // ------------------------------------------------------------------------
    // CHART COMPONENT
    // ------------------------------------------------------------------------
    chart: {
      colors: 'colors.chart.series',
      strokeWidth: 2,
      gridColor: 'colors.chart.grid',
      axisColor: 'colors.chart.axis',
      fontFamily: 'typography.fontFamily.primary',
      fontSize: 'typography.fontSize.sm'
    },

    // ------------------------------------------------------------------------
    // DPAD COMPONENT
    // ------------------------------------------------------------------------
    dpad: {
      segment: {
        directional: {
          fill: {
            active: 'var(--lcars-orange, var(--lcards-orange-medium))',
            inactive: 'darken(colors.card.button, 0.35)',
            hover: 'var(--lcars-yellow, var(--lcards-yellow-medium))',
            pressed: 'darken(colors.card.button, 0.15)',
            unavailable: 'var(--lcards-gray-medium)',
            unknown: 'var(--lcards-gray-medium)'
          },
          stroke: {
            active: 'var(--lcars-white, var(--lcards-moonlight))',
            inactive: 'var(--lcars-orange, var(--lcards-orange-medium))',
            hover: 'var(--lcars-white, var(--lcards-moonlight))',
            pressed: 'var(--lcars-white, var(--lcards-moonlight))',
            unavailable: 'var(--lcards-gray-medium)',
            unknown: 'var(--lcards-gray-medium)'
          },
          'stroke-width': {
            active: 0.5,
            inactive: 0.5,
            hover: 0.75,
            pressed: 1,
            unavailable: 0.25,
            unknown: 0.25
          }
        },
        diagonal: {
          fill: {
            active: 'var(--lcars-blue, var(--lcards-blue-medium))',
            inactive: 'darken(colors.card.buttonOff, 0.35)',
            hover: 'lighten(colors.card.button, 0.15)',
            pressed: 'darken(colors.card.buttonOff, 0.15)',
            unavailable: 'var(--lcards-gray-medium)',
            unknown: 'var(--lcards-gray-medium)'
          },
          stroke: {
            active: 'var(--lcars-white, var(--lcards-moonlight))',
            inactive: 'var(--lcars-blue, var(--lcards-blue-medium))',
            hover: 'var(--lcars-white, var(--lcards-moonlight))',
            pressed: 'var(--lcars-white, var(--lcards-moonlight))',
            unavailable: 'var(--lcards-gray-medium)',
            unknown: 'var(--lcards-gray-medium)'
          },
          'stroke-width': {
            active: 0.5,
            inactive: 0.5,
            hover: 0.75,
            pressed: 1,
            unavailable: 0.25,
            unknown: 0.25
          }
        },
        center: {
          fill: {
            active: 'var(--lcards-blue-medium-light)',
            inactive: 'darken(colors.card.button, 0.35)',
            hover: 'lighten(colors.card.button, 0.15)',
            pressed: 'darken(colors.card.button, 0.15)',
            unavailable: 'var(--lcards-gray-medium)',
            unknown: 'var(--lcards-gray-medium)'
          },
          stroke: {
            active: 'var(--lcars-white, var(--lcards-moonlight))',
            inactive: 'var(--lcards-blue-medium-light)',
            hover: 'var(--lcars-white, var(--lcards-moonlight))',
            pressed: 'var(--lcars-white, var(--lcards-moonlight))',
            unavailable: 'var(--lcards-gray-medium)',
            unknown: 'var(--lcards-gray-medium)'
          },
          'stroke-width': {
            active: 0.75,
            inactive: 0.75,
            hover: 1,
            pressed: 1.5,
            unavailable: 0.25,
            unknown: 0.25
          }
        }
      }
    }
  }
};
