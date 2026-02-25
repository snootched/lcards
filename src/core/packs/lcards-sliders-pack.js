/**
 * @fileoverview LCARdS Sliders Pack
 *
 * Provides style presets for slider overlay types.
 * Two visual styles: pills (segmented bar) and gauge (ruler with ticks).
 *
 * Pack key:  lcards_sliders
 * Registry:  StylePresetManager → style_presets.slider.*
 *
 * Architecture note: Visual style (pills/gauge) is separate from
 * interactivity (control.locked). The component chosen determines
 * the SVG shell; the style preset determines appearance.
 *
 * Pack system guide: doc/architecture/pack-system.md
 */

import { SLIDER_PRESETS } from './style-presets/sliders/index.js';

/**
 * LCARdS Sliders Pack
 *
 * Registered by PackManager → StylePresetManager.
 * Cards access presets via:
 *   window.lcards.core.stylePresetManager.getPreset('slider', 'pills')
 */
export const LCARDS_SLIDERS_PACK = {
  id:          'lcards_sliders',
  name:        'LCARdS Sliders',
  version:     '1.23.0',
  description: 'Slider style presets — pills (segmented), gauge (ruler), and lozenge (pill-shaped) visual styles',

  style_presets: {
    slider: SLIDER_PRESETS
  }
};
