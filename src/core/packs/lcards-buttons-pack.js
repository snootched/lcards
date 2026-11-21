/**
 * @fileoverview LCARdS Buttons Pack
 *
 * Provides style presets for all button overlay types.
 * Presets use the nested schema structure with theme token references.
 *
 * Pack key:  lcards_buttons
 * Registry:  StylePresetManager → style_presets.button.*
 *
 * Schema reference:   src/cards/schemas/button-schema.js (doc/cards/button/index.md)
 * Pack system guide:  doc/architecture/subsystems/pack-system.md
 */

import { BUTTON_PRESETS } from './style-presets/buttons/index.js';

/**
 * LCARdS Buttons Pack
 *
 * Registered by PackManager → StylePresetManager.
 * Cards access presets via:
 *   window.lcards.core.stylePresetManager.getPreset('button', 'lozenge')
 */
export const LCARDS_BUTTONS_PACK = {
  id:          'lcards_buttons',
  name:        'LCARdS Buttons',
  version:     __LCARDS_VERSION__,
  description: 'Button style presets: all overlay shapes and variants',

  style_presets: {
    button: BUTTON_PRESETS
  }
};
