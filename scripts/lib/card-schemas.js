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
 * Node, MSD included).
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

/**
 * @typedef {{ kind: 'card'|'view'|'strategy', tag: string, schema: object }} SchemaEntry
 */

/** @returns {SchemaEntry[]} fresh schema objects on every call */
export function getSchemaEntries() {
  return [
    { kind: 'card',     tag: 'lcards-button',        schema: getButtonSchema({}) },
    { kind: 'card',     tag: 'lcards-slider',        schema: getSliderSchema({}) },
    { kind: 'card',     tag: 'lcards-elbow',         schema: getElbowSchema({}) },
    { kind: 'card',     tag: 'lcards-chart',         schema: getChartSchema({}) },
    { kind: 'card',     tag: 'lcards-data-grid',     schema: dataGridSchema },
    { kind: 'card',     tag: 'lcards-alert-overlay', schema: getAlertOverlaySchema() },
    { kind: 'card',     tag: 'lcards-select-menu',   schema: getSelectMenuSchema({}) },
    { kind: 'card',     tag: 'lcards-layout-card',   schema: layoutCardSchema },
    { kind: 'card',     tag: 'lcards-msd-card',      schema: getMsdSchema() },
    { kind: 'view',     tag: 'lcards-layout-view',   schema: layoutViewSchema },
    { kind: 'strategy', tag: 'lcars-shell',          schema: shellStrategySchema },
  ];
}
