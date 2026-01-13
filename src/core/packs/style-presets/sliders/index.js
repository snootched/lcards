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

    // Border configuration (directly at root)
    border: {
      left: {
        enabled: false,
        size: 0,
        color: {
          default: 'theme:components.slider.border.color.default',
          active: 'theme:components.slider.border.color.active',
          inactive: 'theme:components.slider.border.color.inactive',
          unavailable: 'theme:components.slider.border.color.unavailable'
        }
      },
      top: {
        enabled: false,
        size: 0,
        color: {
          default: 'theme:components.slider.border.color.default',
          active: 'theme:components.slider.border.color.active',
          inactive: 'theme:components.slider.border.color.inactive',
          unavailable: 'theme:components.slider.border.color.unavailable'
        }
      },
      right: {
        enabled: false,
        size: 0,
        color: {
          default: 'theme:components.slider.border.color.default',
          active: 'theme:components.slider.border.color.active',
          inactive: 'theme:components.slider.border.color.inactive',
          unavailable: 'theme:components.slider.border.color.unavailable'
        }
      },
      bottom: {
        enabled: false,
        size: 0,
        color: {
          default: 'theme:components.slider.border.color.default',
          active: 'theme:components.slider.border.color.active',
          inactive: 'theme:components.slider.border.color.inactive',
          unavailable: 'theme:components.slider.border.color.unavailable'
        }
      }
    }
  },

  // =====================================
  // PILLS PRESET - Segmented slider
  // =====================================
  'pills-basic': {
    extends: 'slider.base',
    description: 'Segmented pill slider for interactive controls',

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
  // GAUGE PRESET - Ruler style
  // =====================================
  'gauge-basic': {
    extends: 'slider.base',
    description: 'Ruler-style gauge for displays and controls',

    // Track configuration overrides (directly at root)
    track: {
      type: 'gauge',  // ✅ THIS determines gauge mode
      margin: 0  // Override base margin for seamless ruler
    },
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
    // Gauge configuration (directly at root)
    gauge2: {
      progress_bar: {
        color: 'theme:components.slider.gauge.progress.color',
        height: 'theme:components.slider.gauge.progress.height',
        radius: 2
      },
      scale: {
        tick_marks: {
          major: {
            enabled: true,
            interval: 10,
            color: 'theme:components.slider.gauge.tick.color',
            height: 20,
            width: 2
          },
          minor: {
            enabled: true,
            interval: 2,
            color: 'theme:components.slider.gauge.tick.color',
            height: 10,
            width: 1
          }
        },
        labels: {
          enabled: true,
          unit: '',
          color: 'theme:components.slider.gauge.tick.color',
          font_size: 14,
          padding: 3
        }
      }
    }
  }
};
