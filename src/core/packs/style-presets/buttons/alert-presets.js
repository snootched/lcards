/**
 * Alert Button Presets
 *
 * Complete button presets for alert component with theme token integration.
 * Provides 6 builtin alert color presets (red, blue, green, yellow, grey, black).
 *
 * All presets use theme token references (theme:colors.alert.*) to ensure:
 * - Automatic theme compatibility
 * - No hardcoded colors
 * - Preset merge system works correctly
 * - Provenance tracking works automatically
 *
 * @module core/packs/style-presets/buttons/alert-presets
 */

/**
 * Alert button presets object
 * Button presets specifically designed for alert component
 */
export const ALERT_PRESETS = {
  // =====================================
  // RED ALERT - Critical/Emergency
  // =====================================
  'alert-red': {
    component: 'alert',
    height: 'theme:components.button.layout.height.standard',
    
    // Component-specific configuration
    alert: {
      segments: {
        // Main alert shape (octagon + exclamation)
        shape: {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'theme:colors.alert.red',
            'stroke-width': 3
          }
        },
        
        // Top bar segments (all use same color)
        'bar-top-1': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-top-2': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-top-3': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-top-4': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-top-5': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-top-6': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        
        // Bottom bar segments
        'bar-bottom-1': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-bottom-2': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-bottom-3': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-bottom-4': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-bottom-5': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
        'bar-bottom-6': {
          style: {
            fill: 'theme:colors.alert.red',
            stroke: 'none',
            'stroke-width': 0
          }
        },
      }
    },
    
    // Text configuration
    text: {
      default: {
        font_family: 'theme:components.button.text.font_family',
        font_size: 'theme:components.button.text.font_size',
        font_weight: 'theme:components.button.text.font_weight',
        text_transform: 'theme:components.button.text.text_transform',
        color: {
          default: 'theme:colors.alert.red',
          active: 'theme:colors.alert.red',
          inactive: 'theme:colors.alert.red'
        }
      },
      name: {
        content: 'RED ALERT',
        position: 'center',
        show: true
      }
    },
    
    // Card background (transparent to show component)
    card: {
      color: {
        background: {
          default: 'transparent',
          active: 'transparent',
          inactive: 'transparent'
        }
      }
    }
  },

  // =====================================
  // BLUE ALERT - Security/Tactical
  // =====================================
  'alert-blue': {
    component: 'alert',
    height: 'theme:components.button.layout.height.standard',
    
    alert: {
      segments: {
        shape: {
          style: {
            fill: 'theme:colors.alert.blue',
            stroke: 'theme:colors.alert.blue',
            'stroke-width': 3
          }
        },
        'bar-top-1': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-2': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-3': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-4': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-5': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-6': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-1': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-2': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-3': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-4': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-5': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-6': { style: { fill: 'theme:colors.alert.blue', stroke: 'none', 'stroke-width': 0 } },
      }
    },
    
    text: {
      default: {
        font_family: 'theme:components.button.text.font_family',
        font_size: 'theme:components.button.text.font_size',
        font_weight: 'theme:components.button.text.font_weight',
        text_transform: 'theme:components.button.text.text_transform',
        color: {
          default: 'theme:colors.alert.blue',
          active: 'theme:colors.alert.blue',
          inactive: 'theme:colors.alert.blue'
        }
      },
      name: {
        content: 'BLUE ALERT',
        position: 'center',
        show: true
      }
    },
    
    card: {
      color: {
        background: {
          default: 'transparent',
          active: 'transparent',
          inactive: 'transparent'
        }
      }
    }
  },

  // =====================================
  // GREEN ALERT - Normal/All Clear
  // =====================================
  'alert-green': {
    component: 'alert',
    height: 'theme:components.button.layout.height.standard',
    
    alert: {
      segments: {
        shape: {
          style: {
            fill: 'theme:colors.alert.green',
            stroke: 'theme:colors.alert.green',
            'stroke-width': 3
          }
        },
        'bar-top-1': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-2': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-3': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-4': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-5': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-6': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-1': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-2': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-3': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-4': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-5': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-6': { style: { fill: 'theme:colors.alert.green', stroke: 'none', 'stroke-width': 0 } },
      }
    },
    
    text: {
      default: {
        font_family: 'theme:components.button.text.font_family',
        font_size: 'theme:components.button.text.font_size',
        font_weight: 'theme:components.button.text.font_weight',
        text_transform: 'theme:components.button.text.text_transform',
        color: {
          default: 'theme:colors.alert.green',
          active: 'theme:colors.alert.green',
          inactive: 'theme:colors.alert.green'
        }
      },
      name: {
        content: 'GREEN ALERT',
        position: 'center',
        show: true
      }
    },
    
    card: {
      color: {
        background: {
          default: 'transparent',
          active: 'transparent',
          inactive: 'transparent'
        }
      }
    }
  },

  // =====================================
  // YELLOW ALERT - Caution/Warning
  // =====================================
  'alert-yellow': {
    component: 'alert',
    height: 'theme:components.button.layout.height.standard',
    
    alert: {
      segments: {
        shape: {
          style: {
            fill: 'theme:colors.alert.yellow',
            stroke: 'theme:colors.alert.yellow',
            'stroke-width': 3
          }
        },
        'bar-top-1': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-2': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-3': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-4': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-5': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-6': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-1': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-2': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-3': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-4': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-5': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-6': { style: { fill: 'theme:colors.alert.yellow', stroke: 'none', 'stroke-width': 0 } },
      }
    },
    
    text: {
      default: {
        font_family: 'theme:components.button.text.font_family',
        font_size: 'theme:components.button.text.font_size',
        font_weight: 'theme:components.button.text.font_weight',
        text_transform: 'theme:components.button.text.text_transform',
        color: {
          default: 'theme:colors.alert.yellow',
          active: 'theme:colors.alert.yellow',
          inactive: 'theme:colors.alert.yellow'
        }
      },
      name: {
        content: 'YELLOW ALERT',
        position: 'center',
        show: true
      }
    },
    
    card: {
      color: {
        background: {
          default: 'transparent',
          active: 'transparent',
          inactive: 'transparent'
        }
      }
    }
  },

  // =====================================
  // GREY ALERT - Standby/Inactive
  // =====================================
  'alert-grey': {
    component: 'alert',
    height: 'theme:components.button.layout.height.standard',
    
    alert: {
      segments: {
        shape: {
          style: {
            fill: 'theme:colors.alert.grey',
            stroke: 'theme:colors.alert.grey',
            'stroke-width': 3
          }
        },
        'bar-top-1': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-2': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-3': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-4': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-5': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-6': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-1': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-2': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-3': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-4': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-5': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-6': { style: { fill: 'theme:colors.alert.grey', stroke: 'none', 'stroke-width': 0 } },
      }
    },
    
    text: {
      default: {
        font_family: 'theme:components.button.text.font_family',
        font_size: 'theme:components.button.text.font_size',
        font_weight: 'theme:components.button.text.font_weight',
        text_transform: 'theme:components.button.text.text_transform',
        color: {
          default: 'theme:colors.alert.grey',
          active: 'theme:colors.alert.grey',
          inactive: 'theme:colors.alert.grey'
        }
      },
      name: {
        content: 'STANDBY',
        position: 'center',
        show: true
      }
    },
    
    card: {
      color: {
        background: {
          default: 'transparent',
          active: 'transparent',
          inactive: 'transparent'
        }
      }
    }
  },

  // =====================================
  // BLACK ALERT - System Critical
  // =====================================
  'alert-black': {
    component: 'alert',
    height: 'theme:components.button.layout.height.standard',
    
    alert: {
      segments: {
        shape: {
          style: {
            fill: 'theme:colors.alert.black',
            stroke: 'theme:colors.alert.black',
            'stroke-width': 3
          }
        },
        'bar-top-1': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-2': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-3': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-4': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-5': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-top-6': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-1': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-2': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-3': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-4': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-5': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
        'bar-bottom-6': { style: { fill: 'theme:colors.alert.black', stroke: 'none', 'stroke-width': 0 } },
      }
    },
    
    text: {
      default: {
        font_family: 'theme:components.button.text.font_family',
        font_size: 'theme:components.button.text.font_size',
        font_weight: 'theme:components.button.text.font_weight',
        text_transform: 'theme:components.button.text.text_transform',
        color: {
          default: 'theme:colors.alert.black',
          active: 'theme:colors.alert.black',
          inactive: 'theme:colors.alert.black'
        }
      },
      name: {
        content: 'BLACK ALERT',
        position: 'center',
        show: true
      }
    },
    
    card: {
      color: {
        background: {
          default: 'transparent',
          active: 'transparent',
          inactive: 'transparent'
        }
      }
    }
  }
};
