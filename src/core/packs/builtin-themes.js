/**
 * Builtin Themes Pack
 *
 * Contains all builtin LCARS theme definitions with token-based styling.
 * Also includes chart animation presets for ApexCharts integration.
 *
 * @module core/packs/themes/builtin-themes
 */

import { lcardsDefaultTokens } from './themes/tokens/lcardsDefaultTokens.js';

/**
 * Builtin Themes Pack
 * Provides theme tokens and chart animation presets
 */
export const BUILTIN_THEMES_PACK = {
  id: 'builtin_themes',
  version: __LCARDS_VERSION__,

  // Token-based themes
  themes: {
    'lcards-default': {
      id: 'lcards-default',
      name: 'LCARdS Default',
      description: 'Default LCARdS theme with HA-LCARS integration',
      tokens: lcardsDefaultTokens
    }
  },

  // Default theme
  defaultTheme: 'lcards-default',

  /**
   * Chart Animation Presets
   *
   * Pre-configured animation profiles for ApexCharts (`chart.animations`).
   * Easing names must be ApexCharts 7 `ApexEasing` names; unknown names
   * silently fall back to easeInOutSine.
   */
  chartAnimationPresets: {
    /**
     * LCARS Standard - Smooth and professional
     * Use: Default for most charts
     */
    lcars_standard: {
      enabled: true,
      easing: 'easeInOutCubic',
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
      easing: 'easeOutCubic',
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
      easing: 'easeInCubic',
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
      easing: 'easeOutCubic',
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
  }
};
