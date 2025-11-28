import { lcarsClassicTokens } from '../themes/tokens/lcarsClassicTokens.js';
import { lcarsDs9Tokens } from '../themes/tokens/lcarsDs9Tokens.js';
import { lcarsVoyagerTokens } from '../themes/tokens/lcarsVoyagerTokens.js';
import { lcarsHighContrastTokens } from '../themes/tokens/lcarsHighContrastTokens.js';

/**
 * Core Builtin Pack
 *
 * Contains system defaults and foundational definitions.
 * Loaded first, available to all cards and components.
 */
// Core builtin pack - Contains all system defaults
const CORE_PACK = {
  id: 'core',
  version: '1.14.18',
  animations: [],
  timelines: [],
  rules: [],
  overlays: [],
  anchors: {},
  routing: {}
};

/**
 * LCARS FX Pack
 *
 * Sample builtin animations and effects pack.
 * Provides common animation presets like pulse_soft.
 */
// New sample builtin pack (Phase A) – expand later with real defaults.
const LCARS_FX_PACK = {
  id: 'lcars_fx',
  version: '1.14.18',
  animations: [
    {
      id: 'pulse_soft',
      preset: 'pulse',
      params: { duration: 1800, loop: true, alternate: true, max_scale: 1.07 }
    }
  ],
  timelines: [],
  rules: [],
  overlays: [],
  anchors: {},
  routing: {}
};

// LCARdS Button Styles Pack (Phase 2) - Complete button presets for status grids
/**
 * LCARdS Button Styles Pack (v1.14.18+)
 *
 * Complete button presets for LCARdS cards and status grids.
 * All presets use nested CB-LCARS schema structure.
 *
 * Schema: doc/architecture/simple-button-schema-definition.md
 * Theme Tokens: src/core/themes/tokens/lcarsClassicTokens.js
 */
const LCARDS_BUTTONS_PACK = {
  id: 'lcards_buttons',
  version: '1.14.18',
  description: 'LCARdS button styles - v1.14.18 nested schema',
  animations: [],
  timelines: [],
  rules: [],
  // OVERLAYS: Complete overlay definitions (not style templates)
  overlays: [],
  // STYLE PRESETS: Named style bundles that can be applied to any overlay type
  style_presets: {
    // Universal button presets (work for StatusGrid, ButtonOverlay, V2 Cards, etc.)
    button: {
      // =====================================
      // BASE BUTTON - Foundation for all buttons
      // =====================================
      base: {
        // Layout dimensions
        height: 'theme:components.button.base.layout.height.standard',
        min_height: 'theme:components.button.base.layout.minHeight',

        // Visibility defaults
        show_icon: false,

        // Card styling (nested structure for background colors)
        card: {
          color: {
            background: {
              default: 'theme:components.button.base.background.active',
              active: 'theme:components.button.base.background.active',
              inactive: 'theme:components.button.base.background.inactive',
              unavailable: 'theme:components.button.base.background.unavailable'
            }
          }
        },

        // Text styling (nested structure) - ALL text properties go here
        text: {
          default: {
            position: 'right-center',  // Default text position (right-aligned, vertically centered)
            // Default text styling - applies to all text fields unless overridden
            font_family: 'theme:components.button.base.text.default.font_family',
            font_size: 'theme:components.button.base.text.default.font_size',
            font_weight: 'theme:components.button.base.text.default.font_weight',
            text_transform: 'theme:components.button.base.text.default.text_transform',
            color: {
              default: 'theme:components.button.base.text.default.color.active',
              active: 'theme:components.button.base.text.default.color.active',
              inactive: 'theme:components.button.base.text.default.color.inactive',
              unavailable: 'theme:components.button.base.text.default.color.unavailable'
            }
          },
          name: {
            // Name-specific overrides (if any)
            position: 'bottom-right',
            content: "{entity.attributes.friendly_name}",
            show: true
          },
          state: {
            // Label-specific overrides (if any)
            position: 'top-right',
            content: "{entity.state}",
            show: false
          }
        },

        // Border styling (nested structure)
        border: {
          width: 0,
          color: {
            default: 'theme:components.button.base.border.color.default',
            active: 'theme:components.button.base.border.color.active',
            inactive: 'theme:components.button.base.border.color.inactive',
            unavailable: 'theme:components.button.base.border.color.unavailable'
          },
          radius: 'theme:components.button.base.radius.none'
        },

        // Icon styling (nested structure)
        icon: {
          size: 'theme:components.button.base.icon.size',
          layout_spacing: 'theme:components.button.base.icon.layout_spacing',
          position: 'center',
          color: {
            default: 'theme:components.button.base.icon.color.default',
            active: 'theme:components.button.base.icon.color.active',
            inactive: 'theme:components.button.base.icon.color.inactive',
            unavailable: 'theme:components.button.base.icon.color.unavailable'
          },
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          },
          divider: {
            width: 'theme:components.button.base.icon.divider.width',
            color: 'theme:components.button.base.icon.divider.color.default'
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
            top_left: 'theme:components.button.base.radius.full',
            top_right: 'theme:components.button.base.radius.full',
            bottom_left: 'theme:components.button.base.radius.full',
            bottom_right: 'theme:components.button.base.radius.full'
          }
        },
        icon: {
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
        text: {
          default: {
            position: 'left-center'  // Text on left when icon is on right
          }
        },
        icon: {
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
            top_left: 'theme:components.button.base.radius.none',
            bottom_left: 'theme:components.button.base.radius.none',
            top_right: 'theme:components.button.base.radius.full',
            bottom_right: 'theme:components.button.base.radius.full'
          }
        },
        icon: {
          position: 'center',  // Icon centered within left area
          padding: 0
        }
      },

      'bullet-right': {
        extends: 'button.lozenge-right',
        border: {
          width: 0,  // No border for bullet (filled buttons)
          radius: {
            top_left: 'theme:components.button.base.radius.full',
            bottom_left: 'theme:components.button.base.radius.full',
            top_right: 'theme:components.button.base.radius.none',
            bottom_right: 'theme:components.button.base.radius.none'
          }
        },
        icon: {
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
            top_left: 'theme:components.button.base.radius.full',
            bottom_left: 'theme:components.button.base.radius.full',
            top_right: 'theme:components.button.base.radius.none',
            bottom_right: 'theme:components.button.base.radius.none'
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
            top_left: 'theme:components.button.base.radius.none',
            bottom_left: 'theme:components.button.base.radius.none',
            top_right: 'theme:components.button.base.radius.full',
            bottom_right: 'theme:components.button.base.radius.full'
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
          radius: 'theme:components.button.base.radius.none'
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
            //font_size: 'theme.components.button.base.text.default.font_size',
            font_size: 'theme:typography.fontSize.2xl',
            show: true,
            padding: {
              right: 12
            }
          },
          state: {
            position: 'left',
            font_size: 'theme.components.button.base.text.default.font_size',
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
            //font_size: 'theme.components.button.base.text.default.font_size',
            font_size: 'theme:typography.fontSize.2xl',
            show: true,
            padding: {
              left: 12
            }
          },
          state: {
            position: 'right',
            font_size: 'theme.components.button.base.text.default.font_size',
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
              default: 'theme:components.button.base.background.transparent',
              active: 'theme:components.button.base.background.transparent',
              inactive: 'theme:components.button.base.background.transparent',
              unavailable: 'theme:components.button.base.background.transparent'
            }
          }
        },

        // Border styled by state (active=black, inactive=gray, unavailable=darkgray)
        border: {
          width: 'theme:components.button.base.border.width',
          radius: 'theme:components.button.base.radius.none',
          color: {
            default: 'theme:components.button.base.border.color.active',
            active: 'theme:components.button.base.border.color.active',
            inactive: 'theme:components.button.base.border.color.inactive',
            unavailable: 'theme:components.button.base.border.color.unavailable'
          }
        },

        // Text styling - left aligned for outline style
        text: {

          default: {
            color: {
              default: 'theme:components.button.base.background.active',
              active: 'theme:components.button.base.background.active',
              inactive: 'theme:components.button.base.background.inactive',
              unavailable: 'theme:components.button.base.text.default.color.unavailable'
            }
          },
          name: {
            position: 'right',
            //font_size: 'theme.components.button.base.text.default.font_size',
            font_size: 'theme:typography.fontSize.2xl',
            show: true,
            padding: {
              right: 12
            }
          },
          state: {
            position: 'left',
            font_size: 'theme.components.button.base.text.default.font_size',
            show: false
          }
        },

        // Icon styled by state
        icon: {
          color: {
            default: 'theme:components.button.base.border.color.active',
            active: 'theme:components.button.base.border.color.active',
            inactive: 'theme:components.button.base.border.color.inactive',
            unavailable: 'theme:components.button.base.border.color.unavailable'
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
            //font_size: 'theme.components.button.base.text.default.font_size',
            font_size: 'theme:typography.fontSize.2xl',
            show: true,
            padding: {
              left: 12
            }
          },
          state: {
            position: 'right',
            font_size: 'theme.components.button.base.text.default.font_size',
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
        width: 'theme:components.button.base.layout.height.icon',
        height: 'theme:components.button.base.layout.height.icon',
        min_height: 'theme:components.button.base.layout.height.icon',

        // Rounded corners
        border: {
          radius: {
            top_left: 'theme:components.button.base.radius.large',
            top_right: 'theme:components.button.base.radius.large',
            bottom_left: 'theme:components.button.base.radius.large',
            bottom_right: 'theme:components.button.base.radius.large'
          }
        },

        // Icon-only layout (center everything)
        show_icon: true,

        icon: {
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
          width: 0,
          color: 'transparent'
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

        // Text styling with theme token references
        text: {
          default: {
            font_size: 16,
            font_weight: 'normal',
            color: {
              active: 'theme:colors.ui.foreground',
              inactive: 'theme:colors.ui.disabled',
              unavailable: 'theme:colors.ui.disabled',
              default: 'theme:colors.ui.foreground'
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
    },

  },

  anchors: {},
  routing: {}
};

// ✅ ADD: Builtin pack with themes (this is what was missing!)
const BUILTIN_THEMES_PACK = {
  id: 'builtin_themes',
  version: '1.0.0',

  // Token-based themes
  themes: {
    'lcars-classic': {
      id: 'lcars-classic',
      name: 'LCARS Classic',
      description: 'Classic TNG-era LCARS styling',
      tokens: lcarsClassicTokens
      // cssFile: 'apexcharts-lcars-classic.css' // TODO: Create ApexCharts CSS overrides
    },

    'lcars-ds9': {
      id: 'lcars-ds9',
      name: 'LCARS DS9',
      description: 'Deep Space Nine LCARS variant',
      tokens: lcarsDs9Tokens
      // cssFile: 'apexcharts-lcars-ds9.css' // TODO: Create ApexCharts CSS overrides
    },

    'lcars-voyager': {
      id: 'lcars-voyager',
      name: 'LCARS Voyager',
      description: 'Voyager LCARS styling',
      tokens: lcarsVoyagerTokens
      // cssFile: 'apexcharts-lcars-voyager.css' // TODO: Create ApexCharts CSS overrides
    },

    'lcars-high-contrast': {
      id: 'lcars-high-contrast',
      name: 'LCARS High Contrast',
      description: 'Accessibility-focused high contrast theme',
      tokens: lcarsHighContrastTokens
      // cssFile: 'apexcharts-lcars-high-contrast.css' // TODO: Create ApexCharts CSS overrides
    }
  },

  // Default theme
  defaultTheme: 'lcars-classic',

  /**
   * Chart Animation Presets
   *
   * Pre-configured animation profiles for ApexCharts.
   * Uses native ApexCharts animation system (no Anime.js integration yet).
   */
  chartAnimationPresets: {
    /**
     * LCARS Standard - Smooth and professional
     * Use: Default for most charts
     */
    lcars_standard: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    },

    /**
     * LCARS Dramatic - Cinematic entrance
     * Use: Important reveals, status changes, alerts
     */
    lcars_dramatic: {
      enabled: true,
      easing: 'easeout',
      speed: 1200,
      animateGradually: {
        enabled: true,
        delay: 200
      },
      dynamicAnimation: {
        enabled: true,
        speed: 500
      }
    },

    /**
     * LCARS Minimal - Quick and responsive
     * Use: Secondary displays, less critical data
     */
    lcars_minimal: {
      enabled: true,
      easing: 'easein',
      speed: 400,
      animateGradually: {
        enabled: false
      },
      dynamicAnimation: {
        enabled: true,
        speed: 200
      }
    },

    /**
     * LCARS Realtime - Optimized for high-frequency updates
     * Use: Live sensor feeds, network traffic, system monitors
     */
    lcars_realtime: {
      enabled: false,  // No entrance animation
      easing: 'linear',
      speed: 0,
      animateGradually: {
        enabled: false
      },
      dynamicAnimation: {
        enabled: true,
        speed: 100  // Very fast data updates
      }
    },

    /**
     * LCARS Alert - Attention-grabbing
     * Use: Critical alerts, warnings, emergency displays
     */
    lcars_alert: {
      enabled: true,
      easing: 'easeout',
      speed: 600,
      animateGradually: {
        enabled: true,
        delay: 100
      },
      dynamicAnimation: {
        enabled: true,
        speed: 250
      }
    },

    /**
     * None - Disable all animations
     * Use: Performance-critical situations, accessibility needs
     */
    none: {
      enabled: false,
      easing: 'linear',
      speed: 0,
      animateGradually: {
        enabled: false
      },
      dynamicAnimation: {
        enabled: false
      }
    }
  },
};

const BUILTIN_REGISTRY = {
  core: CORE_PACK,
  lcars_fx: LCARS_FX_PACK,
  lcards_buttons: LCARDS_BUTTONS_PACK,
  builtin_themes: BUILTIN_THEMES_PACK  // ✅ ADD: Register the themes pack
};

// Remove getBuiltinPack() function entirely - it's not needed anymore
// All packs are now in BUILTIN_REGISTRY

export function loadBuiltinPacks(requested = ['core', 'lcards_buttons']) {
  // ✅ CRITICAL FIX: Always load builtin_themes pack for theme system
  const packsToLoad = [...new Set([...requested, 'builtin_themes'])];

  return packsToLoad.map(id => BUILTIN_REGISTRY[id]).filter(Boolean);
}

// Make loadBuiltinPacks globally accessible for preset loading
if (typeof window !== 'undefined') {
  window.loadBuiltinPacksModule = { loadBuiltinPacks };
}
