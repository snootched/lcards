/**
 * Button Style Presets
 *
 * Complete button presets for LCARdS cards and status grids.
 * All presets use nested schema structure.
 *
 * Schema: doc/architecture/button-schema-definition.md
 * Theme Tokens: src/core/packs/themes/tokens/lcarsClassicTokens.js
 *
 * @module core/packs/style-presets/buttons
 */


/**
 * Button presets object
 * Universal button presets (work for StatusGrid, ButtonOverlay, V2 Cards, etc.)
 */
export const BUTTON_PRESETS = {
  // =====================================
  // BASE BUTTON - Foundation for all buttons
  // =====================================
  base: {
    // Layout dimensions
    //height: 'theme:components.button.layout.height.standard',
    min_height: 'theme:components.button.layout.minHeight',

    // Visibility defaults
    show_icon: false,

    // Card styling (nested structure for background colors)
    card: {
      color: {
        background: {
          default: 'theme:components.button.background.active',
          active: 'theme:components.button.background.active',
          inactive: 'theme:components.button.background.inactive',
          unavailable: 'theme:components.button.background.unavailable',
          hover: 'theme:components.button.background.hover',
          pressed: 'theme:components.button.background.pressed'
        }
      }
    },

    // Text styling (nested structure) - ALL text properties go here
    text: {
      default: {
        position: 'right-center',  // Default text position (right-aligned, vertically centered)
        // Default text styling - applies to all text fields unless overridden
        font_family: 'theme:components.button.text.font_family',
        font_size: 'theme:components.button.text.font_size',
        font_weight: 'theme:components.button.text.font_weight',
        text_transform: 'theme:components.button.text.text_transform',
        // Cap-height ratio — propagated from the theme token so changing the
        // primary font family in the theme updates all font_size_percent calculations.
        cap_height_ratio: 'theme:components.button.text.cap_height_ratio',
        color: {
          default: 'theme:components.button.text.color.active',
          active: 'theme:components.button.text.color.active',
          inactive: 'theme:components.button.text.color.inactive',
          unavailable: 'theme:components.button.text.color.unavailable'
        }
      },
      name: {
        // Name-specific overrides (if any)
        position: 'bottom-right',
        content: "{entity.attributes.friendly_name}",
        show: false
      },
      state: {
        // Label-specific overrides (if any)
        position: 'top-right',
        content: "{entity.state}",
        show: false
      },
      label: {
        // State-specific overrides (if any)
        position: 'center',
        content: "LCARdS",
        show: false
       }
    },

    // Border styling (nested structure)
    border: {
      width: 0,
      color: {
        default: 'theme:components.button.border.color.default',
        active: 'theme:components.button.border.color.active',
        inactive: 'theme:components.button.border.color.inactive',
        unavailable: 'theme:components.button.border.color.unavailable',
        hover: 'theme:components.button.border.color.hover',
        pressed: 'theme:components.button.border.color.pressed'
      },
      radius: 'theme:components.button.radius.none'
    },

    // Icon styling (nested structure)
    icon_style: {
      size: 'theme:components.button.icon.size',
      layout_spacing: 'theme:components.button.icon.layout_spacing',
      position: 'center',
      color: {
        default: 'theme:components.button.icon.color.default',
        active: 'theme:components.button.icon.color.active',
        inactive: 'theme:components.button.icon.color.inactive',
        unavailable: 'theme:components.button.icon.color.unavailable'
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      divider: {
        width: 'theme:components.button.icon.divider.width',
        color: 'theme:components.button.icon.divider.color.default'
      }
    }
  },

  // =====================================
  // LOZENGE BUTTONS - Fully rounded
  // =====================================
  lozenge: {
    extends: 'button.base',
    icon_area: 'left', // Icon area on left with divider
    border: {
      width: 0,  // No border for lozenge (filled buttons)
      radius: {
        top_left: 'theme:components.button.radius.full',
        top_right: 'theme:components.button.radius.full',
        bottom_left: 'theme:components.button.radius.full',
        bottom_right: 'theme:components.button.radius.full'
      }
    },
    icon_style: {
      position: 'center',  // Icon centered within left area
      padding: {
        right: 0,
        left: 2
      }
    },
    text: {
      name: {
        padding: {
          right: 24,
          left: 0
        }
      },
      state: {
        padding: {
          right: 24,
          left: 0
        }
      }
    },
  },
  'lozenge-right': {
    extends: 'button.lozenge',
    show_icon: true,  // Enable icons by default for lozenge buttons
    icon_area: 'right',  // Icon area on right
    icon_style: {
      position: 'center',  // Icon centered within left area
      padding: {
        right: 2,
        left: 0
      }
    },
    text: {
      name: {
        position: 'bottom-left',
        padding: {
          right: 0,
          left: 24
        }
      },
      state: {
        position: 'top-left',
        padding: {
          right: 0,
          left: 24
        }
      }
    },
  },

  // =====================================
  // BULLET BUTTONS - Half rounded
  // =====================================
  bullet: {
    extends: 'button.lozenge',
    border: {
      width: 0,  // No border for bullet (filled buttons)
      radius: {
        top_left: 'theme:components.button.radius.none',
        bottom_left: 'theme:components.button.radius.none',
        top_right: 'theme:components.button.radius.full',
        bottom_right: 'theme:components.button.radius.full'
      }
    },
    icon_style: {
      position: 'center',  // Icon centered within left area
      padding: 0
    }
  },

  'bullet-right': {
    extends: 'button.lozenge-right',
    border: {
      width: 0,  // No border for bullet (filled buttons)
      radius: {
        top_left: 'theme:components.button.radius.full',
        bottom_left: 'theme:components.button.radius.full',
        top_right: 'theme:components.button.radius.none',
        bottom_right: 'theme:components.button.radius.none'
      }
    },
    icon_style: {
      position: 'center',  // Icon centered within left area
      padding: 0
    }
  },

  // =====================================
  // CAPPED BUTTONS - Single side rounded
  // =====================================
  capped: {
    extends: 'button.lozenge',
    border: {
      width: 0,  // No border for capped (filled buttons)
      radius: {
        top_left: 'theme:components.button.radius.full',
        bottom_left: 'theme:components.button.radius.full',
        top_right: 'theme:components.button.radius.none',
        bottom_right: 'theme:components.button.radius.none'
      }
    },
    text: {
      name: {
        position: 'bottom-right',
        padding: null,
      },
      state: {
        position: 'top-right',
        padding: null,
        }
    },
  },

  'capped-right': {
    extends: 'button.lozenge-right',
    border: {
      width: 0,  // No border for capped (filled buttons)
      radius: {
        top_left: 'theme:components.button.radius.none',
        bottom_left: 'theme:components.button.radius.none',
        top_right: 'theme:components.button.radius.full',
        bottom_right: 'theme:components.button.radius.full'
      }
    },
    text: {
      name: {
        position: 'bottom-left',
        padding: null,
      },
      state: {
        position: 'top-left',
        padding: null,
        }
    },
  },


  // =====================================
  // BARREL BUTTONS - Solid backgrounds
  // =====================================
  'barrel': {
    extends: 'button.base',

    // Filled buttons have no border, just background
    border: {
      width: 0,
      radius: 'theme:components.button.radius.none'
    },

  },

  'barrel-right': {
    extends: 'button.barrel',

    icon_area: 'right',
    // Swap text and icon positions
    text: {
      default: {
        position: 'left-center'  // Text on left when icon is on right
      },
      name: {
        position: 'bottom-left',
      },
      state: {
        position: 'top-left',
      }
    },
  },


  // =====================================
  // FILLED BUTTONS - Filled (larger text - Picard style)
  // =====================================
  'filled': {
    extends: 'button.base',
    icon_area: 'left',

    // Text styling - left aligned for outline style
    text: {
      name: {
        position: 'right',
        show: true,
        padding: {
          right: 12
        }
      },
      state: {
        position: 'left',
        font_size: 'theme:components.button.text.font_size',
        show: false
      }
    },

  },
  'filled-right': {
    extends: 'button.base',
    icon_area: 'right',
    text: {
      name: {
        position: 'left',
        show: true,
        padding: {
          left: 12
        }
      },
      state: {
        position: 'right',
        font_size: 'theme:components.button.text.font_size',
        show: false
      }
    },
  },

  // =====================================
  // OUTLINE BUTTONS - Border only, large text (Picard style)
  // =====================================
  'outline': {
    extends: 'button.base',

    show_icon: false,
    icon_area: 'left',

    // Outline style - transparent background with colored borders
    card: {
      color: {
        background: {
          default: 'theme:components.button.background.transparent',
          active: 'theme:components.button.background.transparent',
          inactive: 'theme:components.button.background.transparent',
          unavailable: 'theme:components.button.background.transparent'
        }
      }
    },

    // Border styled by state (active=black, inactive=gray, unavailable=darkgray)
    border: {
      width: 'theme:components.button.border.width',
      radius: 'theme:components.button.radius.none',
      color: {
        default: 'theme:components.button.border.color.active',
        active: 'theme:components.button.border.color.active',
        inactive: 'theme:components.button.border.color.inactive',
        unavailable: 'theme:components.button.border.color.unavailable'
      }
    },

    // Text styling - left aligned for outline style
    text: {
      default: {
        color: {
          default: 'theme:components.button.background.active',
          active: 'theme:components.button.background.active',
          inactive: 'theme:components.button.background.inactive',
          unavailable: 'theme:components.button.text.color.unavailable'
        }
      },
      name: {
        position: 'right',
        show: false,
        padding: {
          right: 12
        }
      },
      state: {
        position: 'left',
        show: false
      }
    },

    // Icon styled by state
    icon_style: {
      color: {
        default: 'theme:components.button.border.color.active',
        active: 'theme:components.button.border.color.active',
        inactive: 'theme:components.button.border.color.inactive',
        unavailable: 'theme:components.button.border.color.unavailable'
      }
    }
  },

  'outline-right': {
    extends: 'button.outline',

    icon_area: 'right',

    text: {
      default: {
        position: 'left-center'  // Text on left when icon is on right
      },
      name: {
        position: 'left',
        show: false,
        padding: {
          left: 12
        }
      },
      state: {
        position: 'right',
        show: false
      }
    },
  },

  // =====================================
  // ICON - Icon-only compact
  // =====================================
  'icon': {
    extends: 'button.base',

    // Square dimensions for icon button
    width: 'theme:components.button.layout.height.icon',
    height: 'theme:components.button.layout.height.icon',
    min_height: 'theme:components.button.layout.height.icon',

    // Rounded corners
    border: {
      radius: {
        top_left: 'theme:components.button.radius.large',
        top_right: 'theme:components.button.radius.large',
        bottom_left: 'theme:components.button.radius.large',
        bottom_right: 'theme:components.button.radius.large'
      }
    },

    // Icon-only layout (center everything)
    show_icon: true,

    icon_style: {
      size: 30,
      border: {
        left: {
          width: 0
        },
        right: {
          width: 0
        }
      }
    },
    text: {
      default: {
        show: false
      }
    }
  },

  // =====================================
  // TEXT-ONLY - Pure text label with no background or border
  // =====================================
  'text-only': {
    extends: 'button.base',
    description: 'Pure text label with no background or border',

    // No border
    border: {
      width: 0
    },

    // Transparent background for all states
    card: {
      color: {
        background: {
          active: 'transparent',
          inactive: 'transparent',
          unavailable: 'transparent',
          default: 'transparent'
        }
      }
    },

    // Text styling — mirrors button background state colors (active color on text, off/unavailable muted)
    text: {
      default: {
        font_size: 16,
        font_weight: 'normal',
        color: {
          active: 'theme:components.button.background.active',
          inactive: 'theme:components.button.background.inactive',
          unavailable: 'theme:components.button.background.unavailable',
          default: 'theme:components.button.background.active'
        }
      },
      label: {
        position: 'center'
      }
    },

    // No icon by default
    show_icon: false,

    // Full opacity
    opacity: 1.0
  },

  // =====================================
  // BAR LABEL PRESETS - Horizontal bars with positioned text
  // These create LCARS-style labels with opaque text backgrounds
  // that "break" colored horizontal bars.
  // =====================================

  // Base Bar Label - Foundation for all bar labels
  'bar-label-base': {
    extends: 'button.base',
    description: 'Base bar label - filled button with text overlay that creates bar "break" effect',

    // Default height = one HA grid row.  Override height in your card config to get a taller/
    // shorter bar; font size auto-scales because text.default uses font_size_percent below.
    height: 56,

    // Filled background (uses normal button state colors) - no border
    // This is essentially a filled button with special text overlay
    card: {
      color: {
        background: {
          default: 'theme:components.button.background.active',
          active: 'theme:components.button.background.active',
          inactive: 'theme:components.button.background.inactive',
          unavailable: 'theme:components.button.background.unavailable'
        }
      }
    },

    // No border for filled style
    border: {
      width: 0,
      radius: 0  // Square corners by default
    },

    // Text styling with opaque background for bar-break effect
    text: {
      default: {
        // font_size_percent: font fills 100 % of the card height (auto-scales when the user
        // overrides `height` in their card config).  Set an explicit `font_size` on a field
        // in your card's text config to override this behaviour for that field.
        font_size_percent: 100,
        font_weight: 100,  // Thin weight for LCARS aesthetic
        text_transform: 'uppercase',
        color: {
          default: 'var(--lcards-yellow, #FFCC99)',  // LCARS yellow for labels
          active: 'var(--lcards-yellow, #FFCC99)',
          inactive: 'var(--lcards-yellow, #FFCC99)',
          unavailable: 'theme:colors.status.error'
        },
        // Opaque background creates the bar "break" effect
        background: { default: 'black' },
        background_padding: 15,  // Space between text and colored bars
        background_radius: 0,    // Sharp corners for LCARS aesthetic
        // Explicit numeric value (not a token reference) so the cap-height block in
        // _processTextFields always receives a finite number regardless of token resolution.
        cap_height_ratio: 0.86,
        padding: {
          top: 0,
          bottom: 4,    // Small breathing room so cap glyphs don't touch the zone edges
          left: 15,
          right: 15
        },
        position: 'center'  // Center text within button area
      },
      label: {
        show: true,
        position: 'center',
        // Mirror key text.default values at the field level so they are available via the
        // presetFieldConfig waterfall branch in _resolveTextConfiguration, which has higher
        // priority than presetTextDefaults.  Without this, a user-supplied text.default that
        // omits padding/cap_height_ratio would silently drop the preset values.
        font_size_percent: 100,
        cap_height_ratio: 0.86,
        padding: { top: 0, bottom: 0, left: 50, right: 50 }
      },
      state: {
        show: false,
        position: 'center',
        font_size_percent: 100,
        cap_height_ratio: 0.86,
        padding: { top: 0, bottom: 0, left: 50, right: 50 }
      },
      name: {
        show: false,
        position: 'center',
        font_size_percent: 100,
        cap_height_ratio: 0.86,
        padding: { top: 0, bottom: 4, left: 50, right: 50 }
      }
    },

    // No icon by default for bar labels
    show_icon: false
  },

  // Bar Label Left - Text positioned on left side of bar
  'bar-label-left': {
    extends: 'button.bar-label-base',
    description: 'Bar label with left-aligned text',

    text: {
      default: {
        position: 'left-center'
      },
      label: {
        show: true,
        position: 'left-center'
      }
    }
  },

  // Bar Label Center - Text centered in bar
  'bar-label-center': {
    extends: 'button.bar-label-base',
    description: 'Bar label with centered text',

    text: {
      default: {
        position: 'center'
      },
      label: {
        show: true,
        position: 'center'
      }
    }
  },

  // Bar Label Right - Text positioned on right side of bar
  'bar-label-right': {
    extends: 'button.bar-label-base',
    description: 'Bar label with right-aligned text',

    text: {
      default: {
        position: 'right-center'
      },
      label: {
        show: true,
        position: 'right-center'
      }
    }
  },

  // Bar Label Square - Full-height bar with square corners
  'bar-label-square': {
    extends: 'button.bar-label-base',
    description: 'Bar label with square corners for large indicators',

    border: {
      radius: {
        top_left: 0,
        top_right: 0,
        bottom_left: 0,
        bottom_right: 0
      }
    },

    text: {
      default: {
        position: 'center'
      }
    }
  },

  // Bar Label Lozenge - Full-height bar with rounded ends (pill shape)
  'bar-label-lozenge': {
    extends: 'button.bar-label-base',
    description: 'Bar label with rounded ends (pill shape)',

    border: {
      radius: {
        top_left: 'theme:components.button.radius.full',
        top_right: 'theme:components.button.radius.full',
        bottom_left: 'theme:components.button.radius.full',
        bottom_right: 'theme:components.button.radius.full'
      }
    },

    text: {
      default: {
        position: 'center'
      },
      label: {
        show: true,
        position: 'center'
      }
    }
  },

  // Bar Label Bullet Left - Half-lozenge with rounded right, flat left
  'bar-label-bullet-left': {
    extends: 'button.bar-label-left',
    description: 'Bar label with rounded right side, flat left (right-pointing)',

    border: {
      radius: {
        top_left: 0,
        top_right: 'theme:components.button.radius.full',
        bottom_left: 0,
        bottom_right: 'theme:components.button.radius.full'
      }
    },

    text: {
      default: {
        position: 'right-center'
      },
      label: {
        show: true,
        position: 'right-center'
      }
    }
  },

  // Bar Label Bullet Right - Half-lozenge with flat right, rounded left
  'bar-label-bullet-right': {
    extends: 'button.bar-label-right',
    description: 'Bar label with flat right side, rounded left (left-pointing)',
    icon_area: 'right',
    border: {
      radius: {
        top_left: 'theme:components.button.radius.full',
        top_right: 0,
        bottom_left: 'theme:components.button.radius.full',
        bottom_right: 0
      }
    },

    text: {
      default: {
        position: 'left-center'
      },
      label: {
        show: true,
        position: 'left-center'
      }
    }
  },

  // Bar Label Capped Left - Half-lozenge with rounded left, flat right
  'bar-label-capped-left': {
    extends: 'button.bar-label-left',
    description: 'Bar label with rounded left side, flat right (left-pointing)',
    icon_area: 'right',
    border: {
      radius: {
        top_left: 'theme:components.button.radius.full',
        top_right: 0,
        bottom_left: 'theme:components.button.radius.full',
        bottom_right: 0
      }
    },

    text: {
      default: {
        position: 'left-center'
      },
      label: {
        show: true,
        position: 'left-center'
      }
    }
  },

  // Bar Label Capped Right - Half-lozenge with rounded right, flat left
  'bar-label-capped-right': {
    extends: 'button.bar-label-left',
    description: 'Bar label with rounded right side, flat left (right-pointing)',

    border: {
      radius: {
        top_left: 0,
        top_right: 'theme:components.button.radius.full',
        bottom_left: 0,
        bottom_right: 'theme:components.button.radius.full'
      }
    },

    text: {
      default: {
        position: 'right-center'
      },
      label: {
        show: true,
        position: 'right-center'
      }
    }
  },

};
