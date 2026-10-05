/**
 * @fileoverview LCARdS Elbows Pack
 *
 * Provides structural component definitions for all elbow overlay types.
 * Each component includes SVG path generators, orientation metadata,
 * layout hints, and segment feature flags.
 *
 * Pack key:  lcards_elbows
 * Registry:  ComponentManager → components of type 'elbow'
 *
 * Components registered by this pack:
 *   header-left, header-right, footer-left, footer-right,
 *   contained-header-left, contained-header-right,
 *   contained-footer-left, contained-footer-right
 *   (and any others exported from elbows/index.js)
 *
 * Pack system guide: doc/architecture/pack-system.md
 */

import { elbowComponents } from './components/elbows/index.js';

/**
 * LCARdS Elbows Pack
 *
 * Registered by PackManager → ComponentManager.
 * Cards access components via:
 *   window.lcards.core.componentManager.getComponent('header-left')
 *   window.lcards.core.componentManager.getComponentsByType('elbow')
 */
export const LCARDS_ELBOWS_PACK = {
  id:          'lcards_elbows',
  name:        'LCARdS Elbows',
  version:     __LCARDS_VERSION__,
  description: 'Elbow component definitions: path generators and layout metadata for all elbow orientations',

  components: elbowComponents
};
