/**
 * @fileoverview The one list of LCARdS JSON Schemas that the build scripts use.
 *
 * scripts/validate-doc-examples.js, scripts/generate-llm-schema.js and
 * scripts/check-schema-descriptions.js all read from here, so a new card (or
 * view, or strategy) is added once and every consumer picks it up.
 *
 * Each entry: `kind` is card / view / strategy; `tag` is the custom element
 * (or strategy id) as it appears after `custom:` in YAML; `schema` is the
 * real factory output from src/cards/schemas/ (all of them import cleanly in
 * Node, MSD included), built with the same option lists the cards pass at
 * runtime (positions, built-in presets and components).
 */

import { getButtonSchema }       from '../../src/cards/schemas/button-schema.js';
import { getSliderSchema }       from '../../src/cards/schemas/slider-schema.js';
import { getElbowSchema }        from '../../src/cards/schemas/elbow-schema.js';
import { getChartSchema }        from '../../src/cards/schemas/chart-schema.js';
import { dataGridSchema }        from '../../src/cards/schemas/data-grid-schema.js';
import { getAlertOverlaySchema } from '../../src/cards/schemas/lcards-alert-overlay-schema.js';
import { getSelectMenuSchema }   from '../../src/cards/schemas/select-menu-schema.js';
import { layoutCardSchema, layoutViewSchema } from '../../src/cards/schemas/layout-card-schema.js';
import { getMsdSchema }          from '../../src/cards/schemas/msd-schema.js';
import { shellStrategySchema }   from '../../src/cards/schemas/shell-strategy-schema.js';
import { TEXT_POSITIONS }        from '../../src/cards/schemas/schema-options.js';
import { BUTTON_PRESETS }        from '../../src/core/packs/style-presets/buttons/index.js';
import { SLIDER_PRESETS }        from '../../src/core/packs/style-presets/sliders/index.js';
import { components }            from '../../src/core/packs/components/index.js';

// Built-in option lists, as the cards pass them at runtime (StylePresetManager.
// getAvailablePresets / ComponentManager.getComponentsByType over the built-in
// packs; 'base' presets exist only to be extended). tests/docs/schema-registry.test.js
// checks these against the real managers. User packs can add more at runtime.
const presetNames = (presets) => Object.keys(presets).filter(name => name !== 'base');
export const BUILTIN_OPTIONS = Object.freeze({
  buttonPresets:    presetNames(BUTTON_PRESETS),
  sliderPresets:    presetNames(SLIDER_PRESETS),
  sliderComponents: Object.entries(components).filter(([, c]) => c.metadata?.type === 'slider').map(([name]) => name),
  positionEnum:     [...TEXT_POSITIONS],
});

/**
 * @typedef {{ kind: 'card'|'view'|'strategy', tag: string, schema: object }} SchemaEntry
 */

/** @returns {SchemaEntry[]} fresh schema objects on every call */
export function getSchemaEntries() {
  const o = BUILTIN_OPTIONS;
  return [
    { kind: 'card',     tag: 'lcards-button',        schema: getButtonSchema({ availablePresets: o.buttonPresets, positionEnum: o.positionEnum }) },
    { kind: 'card',     tag: 'lcards-slider',        schema: getSliderSchema({ availablePresets: o.sliderPresets, availableComponents: o.sliderComponents, positionEnum: o.positionEnum }) },
    { kind: 'card',     tag: 'lcards-elbow',         schema: getElbowSchema({ availablePresets: o.buttonPresets, positionEnum: o.positionEnum }) },
    { kind: 'card',     tag: 'lcards-chart',         schema: getChartSchema() },
    { kind: 'card',     tag: 'lcards-data-grid',     schema: dataGridSchema },
    { kind: 'card',     tag: 'lcards-alert-overlay', schema: getAlertOverlaySchema() },
    { kind: 'card',     tag: 'lcards-select-menu',   schema: getSelectMenuSchema({ availablePresets: o.buttonPresets }) },
    { kind: 'card',     tag: 'lcards-layout-card',   schema: layoutCardSchema },
    { kind: 'card',     tag: 'lcards-msd-card',      schema: getMsdSchema() },
    { kind: 'view',     tag: 'lcards-layout-view',   schema: layoutViewSchema },
    { kind: 'strategy', tag: 'lcars-shell',          schema: shellStrategySchema },
  ];
}
