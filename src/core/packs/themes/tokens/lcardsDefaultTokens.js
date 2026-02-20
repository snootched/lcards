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
 * @module core/packs/themes/tokens/lcardsDefaultTokens
 */

export const lcardsDefaultTokens = {
  // ==========================================================================
  // TYPOGRAPHY
  // ==========================================================================
  typography: {
    fontFamily: {
      primary: "var(--lcars-font), var(--lcars-fallback-font), 'Antonio', 'Segoe UI Variable Static Text', 'Segoe UI', sans-serif"
    },
    fontSize: {
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 24
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
      onDark: 'var(--lcards-gray-medium, var(--lcards-moonlight))',
      disabled: 'var(--lcards-gray-medium-dark)'
    },

    // UI semantic colors (from HA-LCARS theme or fallback)
    ui: {
      primary: 'var(--lcars-ui-primary, var(--lcards-gray-medium))',
      secondary: 'var(--lcars-ui-secondary, var(--lcards-gray-medium-light))',
      tertiary: 'var(--lcars-ui-tertiary, var(--lcards-orange-medium-dark))',
      quaternary: 'var(--lcars-ui-quaternary, var(--lcards-gray-dark))'
    },

    // Card-specific colors (HA-LCARS variables with CB-LCARS fallbacks)
    // Note: HA-LCARS 25C themes + Picard provide button-off/unavailable explicitly
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
    },

    // Alert colors (LCARS alert symbol component)
    alert: {
      red: 'var(--lcars-alert-red)',         // Critical/Emergency
      blue: 'var(--lcars-alert-blue)',       // Security/Tactical
      green: 'var(--lcars-green-medium)',    // Normal/All Clear
      yellow: 'var(--lcars-alert-yellow)', // Caution/Warning
      gray: 'var(--lcards-gray)',       // Standby/Inactive
      black: 'var(--lcards-blue-lightest)'        // System Critical
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
        active: 'lighten(colors.card.button, 0.1)',
        inactive: 'colors.card.buttonOff',
        unavailable: 'colors.card.buttonUnavailable',
        hover: 'lighten(colors.card.button, 0.15)',
        pressed: 'darken(colors.card.button, 0.1)',
        transparent: 'transparent'
      },
      border: {
        width: 'borders.width.thick',
        radius: 'borders.radius.lg',
        color: {
          default: 'colors.card.button',
          active: 'lighten(colors.card.button, 0.1)',
          inactive: 'darken(colors.card.button, 0.25)',
          unavailable: 'darken(colors.card.button, 0.45)',
          hover: 'lighten(colors.card.button, 0.15)',
          pressed: 'darken(colors.card.button, 0.1)'
        }
      },
      text: {
        color: {
          default: 'colors.text.onLight',
          active: 'colors.text.onLight',
          inactive: 'colors.text.onLight',
          unavailable: 'colors.status.error'
        },
        font_size: 'typography.fontSize.lg',
        font_weight: 'typography.fontWeight.normal',
        font_family: 'typography.fontFamily.primary',
        text_transform: 'typography.textTransform.uppercase'
      },
      icon: {
        size: 24,
        layout_spacing: 4,
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
      },
      layout: {
        height: {
          standard: 45,
          icon: 45
        },
        minHeight: 38
      },
      radius: {
        none: 'borders.radius.none',
        large: 'borders.radius.lg',
        full: 'borders.radius.full'
      }
    },

    // ------------------------------------------------------------------------
    // ELBOW COMPONENT
    // ------------------------------------------------------------------------
    elbow: {
      header: {
        background: {
          default: 'colors.card.topColor',
          active: 'lighten(colors.card.topColor, 0.1)',
          inactive: 'darken(colors.card.topColor, 0.2)',
          unavailable: 'darken(colors.card.topColor, 0.4)',
          hover: 'lighten(colors.card.topColor, 0.15)',
          pressed: 'darken(colors.card.topColor, 0.1)'
        }
      },
      footer: {
        background: {
          default: 'colors.card.bottomColor',
          active: 'lighten(colors.card.bottomColor, 0.1)',
          inactive: 'darken(colors.card.bottomColor, 0.2)',
          unavailable: 'darken(colors.card.bottomColor, 0.4)',
          hover: 'lighten(colors.card.bottomColor, 0.15)',
          pressed: 'darken(colors.card.bottomColor, 0.1)'
        }
      },
      stroke: {
        width: 'borders.width.thick',
        color: {
          default: 'colors.card.button',
          active: 'colors.card.button',
          inactive: 'colors.card.buttonOff',
          unavailable: 'colors.card.buttonUnavailable',
          hover: 'lighten(colors.card.button, 0.15)',
          pressed: 'darken(colors.card.button, 0.1)'
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
        margin: 0
      },
      border: {
        width: 'borders.width.thick',
        radius: 'borders.radius.lg',
        color: {
          default: 'colors.card.button',
          active: 'lighten(colors.card.button, 0.1)',
          inactive: 'colors.card.buttonOff',
          unavailable: 'colors.card.buttonUnavailable',
          hover: 'lighten(colors.card.button, 0.15)',
          pressed: 'darken(colors.card.button, 0.1)'
        }
      },
      pills: {
        gap: 4,
        radius: 0,
        segment: {
          width: 10
        },
        gradient: {
          start: 'colors.status.success',
          end: 'colors.status.error'
        }
      },
      gauge: {
        progress: {
          color: 'colors.lcars.orange',
          height: 4
        },
        tick: {
          major: {
            color: {
              default: 'colors.card.button',
              active: 'lighten(colors.card.button, 0.1)',
              inactive: 'colors.card.buttonOff',
              unavailable: 'colors.card.buttonUnavailable'
            }
          },
          minor: {
            color: {
              default: 'colors.card.button',
              active: 'lighten(colors.card.button, 0.1)',
              inactive: 'colors.card.buttonOff',
              unavailable: 'colors.card.buttonUnavailable'
            }
          }
        },
        label: {
          color: {
            default: 'colors.card.button',
            active: 'lighten(colors.card.button, 0.1)',
            inactive: 'colors.card.buttonOff',
            unavailable: 'colors.card.buttonUnavailable'
          }
        }
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
    // ALERT COMPONENT
    // Flat structure (v2): shape fill, bars stroke, text fills.
    // Color-keyed overrides come from the preset system (condition_red, etc.)
    // — these are the theme defaults (gray/standby state).
    // ------------------------------------------------------------------------
    alert: {
      shape: {
        fill: {
          default: 'colors.ui.primary',
          active: 'lighten(colors.ui.primary, 0.1)',
          inactive: 'darken(colors.ui.primary, 0.25)',
          unavailable: 'darken(colors.ui.primary, 0.45)',
          hover: 'lighten(colors.ui.primary, 0.15)',
          pressed: 'darken(colors.ui.primary, 0.1)'
        }
      },
      bars: {
        stroke: { default: 'colors.ui.primary' }
      },
      text: {
        alert_text: {
          fill: { default: 'colors.status.error' }
        },
        sub_text: {
          fill: { default: 'colors.text.onDark' }
        }
      }
    },

    // ------------------------------------------------------------------------
    // DPAD COMPONENT
    // ------------------------------------------------------------------------
    dpad: {
      segment: {
        directional: {
          fill: {
            default: 'var(--lcars-green, var(--lcards-green-medium))',
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
    },

    // ------------------------------------------------------------------------
    // BACKGROUND ANIMATION COMPONENT
    // ------------------------------------------------------------------------
    backgroundAnimation: {
      grid: {
        line: {
          color: 'alpha(colors.ui.primary, 0.3)',
          colorMajor: 'alpha(colors.ui.primary, 0.6)',
          width: 1,
          widthMajor: 2
        },
        fill: {
          color: 'alpha(colors.ui.primary, 0.05)'
        },
        spacing: {
          default: 40,
          diagonal: 30,
          hexRadius: 40,
          filled: 50
        },
        scroll: {
          speedX: 20,
          speedY: 20,
          speedDiagonal: 15,
          speedFilled: 25
        },
        intervals: {
          majorRow: 3,
          majorCol: 3
        }
      },
      starfield: {
        star: {
          count: 150,
          minRadius: 0.5,
          maxRadius: 2,
          minOpacity: 0.3,
          maxOpacity: 1.0,
          color: 'var(--lcars-white, var(--lcards-moonlight))'
        },
        scroll: {
          speedX: 30,
          speedY: 0
        },
        parallax: {
          layers: 3,
          depthFactor: 0.5
        }
      },
      nebula: {
        cloud: {
          count: 4,
          minRadius: 0.15,
          maxRadius: 0.4,
          minOpacity: 0.3,
          maxOpacity: 0.8,
          colors: [
            'var(--lcards-blue-medium)',
            'var(--lcards-orange)',
            'var(--lcards-blue-light)'
          ]
        },
        turbulence: {
          intensity: 0.5,
          noiseScale: 0.003
        },
        scroll: {
          speedX: 5,
          speedY: 5
        }
      }
    }
  }
};
