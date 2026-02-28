/**
 * Slider Style Presets
 *
 * Complete slider presets for LCARdS cards.
 * Provides pills (segmented), gauge (ruler), and shaped (clip-path fill) visual styles.
 *
 * PRESET STRUCTURE
 * ──────────────────────────────────────────────────────────────────────────
 * Presets are written exactly like card config YAML — same schema, same
 * field locations.  CoreConfigManager strips the registry-only metadata
 * (extends, description, compatibleComponents) and deep-merges the rest
 * directly into the card config with no further transformation.
 *
 *   style.*        → config.style.*   (visual properties)
 *   text           → config.text      (text field definitions)
 *   component      → config.component (component selector)
 *
 * @module core/packs/style-presets/sliders
 */

export const SLIDER_PRESETS = {
  // =====================================
  // BASE SLIDER - Foundation
  // =====================================
  base: {
    style: {
      track: {
        orientation: 'horizontal',
        height:      'theme:components.slider.track.height',
        background:  'theme:components.slider.track.background',
        margin:      'theme:components.slider.track.margin',
      },

      border: {
        left: {
          enabled: false,
          size: 0,
          color: {
            default:     'theme:components.slider.border.color.default',
            active:      'theme:components.slider.border.color.active',
            inactive:    'theme:components.slider.border.color.inactive',
            unavailable: 'theme:components.slider.border.color.unavailable',
            hover:       'theme:components.slider.border.color.hover',
            pressed:     'theme:components.slider.border.color.pressed'
          }
        },
        top: {
          enabled: false,
          size: 0,
          color: {
            default:     'theme:components.slider.border.color.default',
            active:      'theme:components.slider.border.color.active',
            inactive:    'theme:components.slider.border.color.inactive',
            unavailable: 'theme:components.slider.border.color.unavailable',
            hover:       'theme:components.slider.border.color.hover',
            pressed:     'theme:components.slider.border.color.pressed'
          }
        },
        right: {
          enabled: false,
          size: 0,
          color: {
            default:     'theme:components.slider.border.color.default',
            active:      'theme:components.slider.border.color.active',
            inactive:    'theme:components.slider.border.color.inactive',
            unavailable: 'theme:components.slider.border.color.unavailable',
            hover:       'theme:components.slider.border.color.hover',
            pressed:     'theme:components.slider.border.color.pressed'
          }
        },
        bottom: {
          enabled: false,
          size: 0,
          color: {
            default:     'theme:components.slider.border.color.default',
            active:      'theme:components.slider.border.color.active',
            inactive:    'theme:components.slider.border.color.inactive',
            unavailable: 'theme:components.slider.border.color.unavailable',
            hover:       'theme:components.slider.border.color.hover',
            pressed:     'theme:components.slider.border.color.pressed'
          }
        }
      },

      gauge: {
        scale: {
          tick_marks: {
            major: {
              color: {
                default:     'theme:components.slider.gauge.tick.major.color.default',
                active:      'theme:components.slider.gauge.tick.major.color.active',
                inactive:    'theme:components.slider.gauge.tick.major.color.inactive',
                unavailable: 'theme:components.slider.gauge.tick.major.color.unavailable'
              }
            },
            minor: {
              color: {
                default:     'theme:components.slider.gauge.tick.minor.color.default',
                active:      'theme:components.slider.gauge.tick.minor.color.active',
                inactive:    'theme:components.slider.gauge.tick.minor.color.inactive',
                unavailable: 'theme:components.slider.gauge.tick.minor.color.unavailable'
              }
            }
          },
          labels: {
            color: {
              default:     'theme:components.slider.gauge.label.color.default',
              active:      'theme:components.slider.gauge.label.color.active',
              inactive:    'theme:components.slider.gauge.label.color.inactive',
              unavailable: 'theme:components.slider.gauge.label.color.unavailable'
            }
          }
        }
      }
    },  // end style

    text: {
      default: {
        font_family: 'theme:typography.fontFamily.primary',
        font_size: 'theme:typography.fontSize.base',
        text_transform: 'uppercase',
        color: {
          default: 'theme:components.button.text.color.active',
          active: 'theme:components.button.text.color.active',
          inactive: 'theme:components.button.text.color.inactive',
          unavailable: 'theme:components.button.text.color.unavailable'
        }
      },
      name: {
        content: "[[[return entity ? entity.attributes.friendly_name : null]]]",
        show: false
      },
      state: {
        content: "[[[if (!entity) return null; if (entity.entity_id.split('.')[0] === 'light' && entity.attributes.brightness != null) return Math.round(entity.attributes.brightness / 2.55) + '%'; return entity.state;]]]",
        show: false
      }
    }
  },

  // =====================================
  // PILLS PRESET - Segmented slider
  // =====================================
  'pills-basic': {
    extends: 'slider.base',
    description: 'Segmented pill slider',
    compatibleComponents: ['default'],

    style: {
      track: {
        type:   'pills',
        margin: { top: 5, left: 5, right: 0, bottom: 0 },
        segments: {
          enabled: true,
          gap:  'theme:components.slider.pills.gap',
          size: { width: 'theme:components.slider.pills.segment.width' },
          shape:    { radius: 'theme:components.slider.pills.radius' },
          gradient: {
            start: 'theme:components.slider.pills.gradient.start',
            end:   'theme:components.slider.pills.gradient.end'
          },
          appearance: {
            unfilled: { opacity: 0.2 },
            filled:   { opacity: 1.0 }
          }
        }
      }
    }
  },

  // =====================================
  // PILLS PRESET - Pills with left border
  // =====================================
  'pills-left-border': {
    extends: 'slider.pills-basic',
    description: 'Left border with pills slider.',
    compatibleComponents: ['default'],

    style: {
      border: {
        top:  { enabled: true, size: 10 },
        left: { enabled: true, size: 120 }
      }
    }
  },

  // =====================================
  // GAUGE PRESET - Ruler style
  // =====================================
  'gauge-basic': {
    extends: 'slider.base',
    description: 'Ruler-style gauge for displays and controls',
    compatibleComponents: ['default'],

    style: {
      track: {
        type:   'gauge',
        margin: 0
      }
    }
  },

  // =====================================
  // GAUGE PRESET - Ruler style with left border
  // =====================================
  'gauge-left-border': {
    extends: 'slider.gauge-basic',
    description: 'Left border with gauge slider.',
    compatibleComponents: ['default'],

    style: {
      border: {
        top:  { enabled: true, size: 10 },
        left: { enabled: true, size: 120 }
      }
    }
  },

  // =====================================
  // PILLS PRESET - Pills with rounded corners (LCARS end-cap style)
  // =====================================
  'pills-left-border-rounded': {
    extends: 'slider.pills-left-border',
    description: 'Pills slider with left border and rounded free-end corners. The left (bordered) end stays flat; only the right end is rounded — classic LCARS end-cap look. Override style.border.radius for a different radius or per-corner control.',
    compatibleComponents: ['default'],

    style: {
      border: {
        radius: { top_left: 0, bottom_left: 0, top_right: 12, bottom_right: 12 }
      }
    }
  },

  // =====================================
  // GAUGE PRESET - Gauge with rounded corners (LCARS end-cap style)
  // =====================================
  'gauge-left-border-rounded': {
    extends: 'slider.gauge-left-border',
    description: 'Gauge slider with left border and rounded free-end corners. The left (bordered) end stays flat; only the right end is rounded. Override style.border.radius for a different radius or per-corner control.',
    compatibleComponents: ['default'],

    style: {
      border: {
        radius: { top_left: 0, bottom_left: 0, top_right: 12, bottom_right: 12 }
      }
    }
  },

  // =====================================
  // SHAPED PRESETS — Generic clip-path fill
  // =====================================
  //
  // Both presets default to shape type 'lozenge' but the user can override
  // style.shaped.type to any supported shape (rect, rounded, diamond, etc.).
  // component and text stay at the preset root — same as they'd appear in card YAML.

  /**
   * shaped-vertical: Vertical shaped slider.  Fill rises from the bottom.
   * Text: state value at top-center, entity name at bottom-center.
   */
  'shaped-vertical': {
    extends: 'slider.base',
    description: 'Vertical shaped slider with exterior text labels. Change style.shaped.type for different shapes (lozenge, rounded, diamond…).',
    compatibleComponents: ['shaped'],

    component: 'shaped',

    style: {
      track: {
        type:        'shaped',
        orientation: 'vertical',
        invert_fill: false,
        margin:      0
      },
      shaped: {
        type: 'lozenge',
        text_bands: {
          top:    { size: 36 },
          bottom: { size: 36 },
          left:   { size: 0 },
          right:  { size: 0 }
        },
        fill: { color: 'var(--primary-color)' },
        track: { background: 'alpha(colors.card.buttonOff,0.2)' }
      }
    },

    text: {
      name:  {
        position: 'bottom-center',
        show: true,
        font_size: 'theme:typography.fontSize.2xl',
        padding: 0,
        color: {
          default: 'theme:colors.text.onDark',
          active: 'theme:lighten(colors.text.onDark, 0.2)',
          inactive: 'theme:darken(colors.text.onDark, 0.2)',
          unavailable: 'theme:darken(colors.text.onDark, 0.3)',
        }
      },
      state: {
        position: 'top-center',
        show: true,
        font_size: 'theme:typography.fontSize.2xl',
        padding: 0,
        color: {
          default: 'theme:colors.text.onDark',
          active: 'theme:lighten(colors.text.onDark, 0.2)',
          inactive: 'theme:darken(colors.text.onDark, 0.2)',
          unavailable: 'theme:darken(colors.text.onDark, 0.3)',
        }
      }
    }
  },

  /**
   * shaped-horizontal: Horizontal shaped slider.  Fill grows from the left.
   * Text: entity name at left-center, state value at right-center.
   */
  'shaped-horizontal': {
    extends: 'slider.base',
    description: 'Horizontal shaped slider with exterior text labels. Change style.shaped.type for different shapes (lozenge, rounded, diamond…).',
    compatibleComponents: ['shaped'],

    component: 'shaped',

    style: {
      track: {
        type:        'shaped',
        orientation: 'horizontal',
        invert_fill: false,
        margin:      0
      },
      shaped: {
        type: 'lozenge',
        text_bands: {
          top:    { size: 0 },
          bottom: { size: 0 },
          left:   { size: 60 },
          right:  { size: 60 }
        },
        fill: { color: 'var(--primary-color)' },
        track: { background: 'alpha(colors.card.buttonOff,0.2)' }
      }
    },

    text: {
      name:  {
        position: 'left-center',
        show: true,
        font_size: 'theme:typography.fontSize.2xl',
        padding: 0,
        color: {
          default: 'theme:colors.text.onDark',
          active: 'theme:lighten(colors.text.onDark, 0.2)',
          inactive: 'theme:darken(colors.text.onDark, 0.2)',
          unavailable: 'theme:darken(colors.text.onDark, 0.3)',
        }
      },
      state: {
        position: 'right-center',
        show: true,
        font_size: 'theme:typography.fontSize.2xl',
        padding: 0,
        color: {
          default: 'theme:colors.text.onDark',
          active: 'theme:lighten(colors.text.onDark, 0.2)',
          inactive: 'theme:darken(colors.text.onDark, 0.2)',
          unavailable: 'theme:darken(colors.text.onDark, 0.3)',
        }
      }
    }
  },

  // =====================================
  // PICARD PRESET - Picard-style vertical slider
  // =====================================

  'picard-gauge-vertical': {
    extends: 'slider.gauge-basic',
    description: 'Picard-style vertical slider',
    compatibleComponents: ['picard'],

    style: {
      track: {
        orientation: 'vertical',
        invert_fill: false
      },
      gauge: {
        indicator: {
          enabled: true,
          size:    { height: 20, width: 52 },
          type:    'round',
          border:  { enabled: true }
        }
      }
    }
  }
};
