/**
 * Slider Style Presets
 *
 * Complete slider presets for LCARdS cards.
 * Provides pills (segmented) and gauge (ruler) visual styles.
 *
 * Architecture:
 * - Separate visual style (pills/gauge) from interactivity (control.locked)
 * - Pills: Segmented bar style for interactive sliders
 * - Gauge: Ruler with tick marks for displays and controls
 *
 * @module core/packs/style-presets/sliders
 */

/**
 * Slider presets object
 */
export const SLIDER_PRESETS = {
  // =====================================
  // BASE SLIDER - Foundation
  // =====================================
  base: {
    // Track configuration
    track: {
      orientation: 'horizontal',
      height: 'theme:components.slider.track.height',
      background: 'theme:components.slider.track.background',
      margin: 'theme:components.slider.track.margin',
    },
    // Border configuration (directly at root)
    border: {
      left: {
        enabled: false,
        size: 0,
        color: {
          default: 'theme:components.slider.border.color.default',
          active: 'theme:components.slider.border.color.active',
          inactive: 'theme:components.slider.border.color.inactive',
          unavailable: 'theme:components.slider.border.color.unavailable',
          hover: 'theme:components.slider.border.color.hover',
          pressed: 'theme:components.slider.border.color.pressed'
        }
      },
      top: {
        enabled: false,
        size: 0,
        color: {
          default: 'theme:components.slider.border.color.default',
          active: 'theme:components.slider.border.color.active',
          inactive: 'theme:components.slider.border.color.inactive',
          unavailable: 'theme:components.slider.border.color.unavailable',
          hover: 'theme:components.slider.border.color.hover',
          pressed: 'theme:components.slider.border.color.pressed'
        }
      },
      right: {
        enabled: false,
        size: 0,
        color: {
          default: 'theme:components.slider.border.color.default',
          active: 'theme:components.slider.border.color.active',
          inactive: 'theme:components.slider.border.color.inactive',
          unavailable: 'theme:components.slider.border.color.unavailable',
          hover: 'theme:components.slider.border.color.hover',
          pressed: 'theme:components.slider.border.color.pressed'
        }
      },
      bottom: {
        enabled: false,
        size: 0,
        color: {
          default: 'theme:components.slider.border.color.default',
          active: 'theme:components.slider.border.color.active',
          inactive: 'theme:components.slider.border.color.inactive',
          unavailable: 'theme:components.slider.border.color.unavailable',
          hover: 'theme:components.slider.border.color.hover',
          pressed: 'theme:components.slider.border.color.pressed'
        }
      }
    },

    // Text configuration (directly at root)
    text: {
      default: {
        font_family: 'theme:typography.fontFamily.primary',
        font_size: 'theme:typography.fontSize.base',
        color: {
          default: 'theme:components.button.text.color.active',
          active: 'theme:components.button.text.color.active',
          inactive: 'theme:components.button.text.color.inactive',
          unavailable: 'theme:components.button.text.color.unavailable'
        }
      }
    },

    // Gauge scale configuration (tick marks and labels)
    gauge: {
      scale: {
        tick_marks: {
          major: {
            color: {
              default: 'theme:components.slider.gauge.tick.major.color.default',
              active: 'theme:components.slider.gauge.tick.major.color.active',
              inactive: 'theme:components.slider.gauge.tick.major.color.inactive',
              unavailable: 'theme:components.slider.gauge.tick.major.color.unavailable'
            }
          },
          minor: {
            color: {
              default: 'theme:components.slider.gauge.tick.minor.color.default',
              active: 'theme:components.slider.gauge.tick.minor.color.active',
              inactive: 'theme:components.slider.gauge.tick.minor.color.inactive',
              unavailable: 'theme:components.slider.gauge.tick.minor.color.unavailable'
            }
          }
        },
        labels: {
          color: {
            default: 'theme:components.slider.gauge.label.color.default',
            active: 'theme:components.slider.gauge.label.color.active',
            inactive: 'theme:components.slider.gauge.label.color.inactive',
            unavailable: 'theme:components.slider.gauge.label.color.unavailable'
          }
        }
      }
    }
  },

  // =====================================
  // PILLS PRESET - Segmented slider
  // =====================================
  'pills-basic': {
    extends: 'slider.base',
    description: 'Segmented pill slider',

    // Track configuration overrides (directly at root)
    track: {
      type: 'pills',  // ✅ THIS determines pills mode
      margin: {
        top: 5,
        left: 5,
        right: 0,
        bottom: 0
      },
      segments: {
        enabled: true,
        gap: 'theme:components.slider.pills.gap',
        size: {
          width: 'theme:components.slider.pills.segment.width',
        },
        shape: {
          radius: 'theme:components.slider.pills.radius'
        },
        gradient: {
          interpolated: true,
          start: 'theme:components.slider.pills.gradient.start',
          end: 'theme:components.slider.pills.gradient.end'
        },
        appearance: {
          unfilled: { opacity: 0.2 },
          filled: { opacity: 1.0 }
        }
      }
    }
  },

  // =====================================
  // PILLS PRESET - Segmented slider
  // =====================================
  'pills-left-border': {
    extends: 'slider.pills-basic',
    description: 'Left border with pills slider. ',

    border: {
      top: {
        enabled: true,
        size: 10
      },
      left: {
        enabled: true,
        size: 120
      }
    }
  },


  // =====================================
  // GAUGE PRESET - Ruler style
  // =====================================
  'gauge-basic': {
    extends: 'slider.base',
    description: 'Ruler-style gauge for displays and controls',

    // Track configuration overrides (directly at root)
    track: {
      type: 'gauge',
      margin: 0  // Override base margin for seamless ruler
    }
  },

  // =====================================
  // GAUGE PRESET - Ruler style with left border
  // =====================================
  'gauge-left-border': {
    extends: 'slider.gauge-basic',
    description: 'Left border with gauge slider.',
    border: {
      top: {
        enabled: true,
        size: 10
      },
      left: {
        enabled: true,
        size: 120
      }
    },
  },

  // =====================================
  // PICARD PRESET - Picard-style vertical slider
  // =====================================
  // =====================================
  // SHAPED PRESETS — Generic clip-path fill
  // =====================================

  /**
   * lozenge-basic: Vertical pill-shaped lozenge, fill rises from bottom.
   * Use with: component: shaped  (set automatically by this preset).
   */
  'lozenge-basic': {
    extends: 'slider.base',
    description: 'Pill-shaped lozenge slider with exterior text labels. Set track.orientation to switch between vertical and horizontal.',

    component: 'shaped',

    track: {
      type:        'shaped',
      orientation: 'vertical',
      invert_fill: false,   // fill rises from bottom (vertical) / left (horizontal)
      margin:      0        // no margin — clip path handles the shape boundary
    },

    shaped: {
      type: 'lozenge',
      label: {
        top:    { size: 36 },
        bottom: { size: 28 },
        left:   { size: 60 },
        right:  { size: 60 }
      },
      track: {
        background: 'theme:components.slider.track.background'
      }
    },

    text: {
      name: {
        position: 'bottom-center',
        show: true
      },
      state: {
        position: 'top-center',
        show: true
      }
    }
  },

  // -----------------------------------------------------------------------

  'picard-gauge-vertical': {
    extends: 'slider.gauge-basic',
    description: 'Picard-style vertical slider',

    // Track configuration overrides (directly at root)
    track: {
      orientation: 'vertical',
      invert_fill: false,
    },
    gauge: {
      indicator: {
        enabled: true,
        size: {
          height: 20,
          width: 52
        },
        type: 'round',
        border: {
          enabled: true
        }
      }
    }
  }
};
