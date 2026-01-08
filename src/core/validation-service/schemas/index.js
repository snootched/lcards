/**
 * @fileoverview Schema Export Index
 *
 * Central export point for all validation schemas.
 * Imports and registers all schemas with SchemaRegistry.
 *
 * Migrated from MSD validation to core singleton architecture.
 *
 * @module core/validation-service/schemas
 */

import { commonSchema } from './common.js';
import { lineOverlaySchema } from './lineOverlay.js';
import { controlOverlaySchema } from './controlOverlay.js';

// Re-export all schemas
export {
  commonSchema,
  lineOverlaySchema,
  controlOverlaySchema
};

/**
 * Register all schemas with SchemaRegistry
 *
 * @param {SchemaRegistry} schemaRegistry - Schema registry instance
 *
 * @example
 * import { registerAllSchemas } from './schemas/index.js';
 *
 * const schemaRegistry = new SchemaRegistry();
 * registerAllSchemas(schemaRegistry);
 */
export function registerAllSchemas(schemaRegistry) {
  // Register common schema (inherited by all overlays)
  schemaRegistry.registerCommon(commonSchema);

  // Register overlay type schemas
  schemaRegistry.register('line', lineOverlaySchema);
  schemaRegistry.register('control', controlOverlaySchema);

  // Card schemas self-register via static registerSchema() methods
  // Called by lcards.js after core init:
  // - LCARdSButton.registerSchema()
  // - LCARdSChart.registerSchema()
  // - LCARdSDataGrid.registerSchema()
  // - LCARdSSlider.registerSchema()
  // - LCARdSElbow.registerSchema()
  // - LCARdSMSDCard.registerSchema() ← MSD now self-registers

  // Note: button, text, apexchart, status_grid overlay schemas removed (v1.16.22+)
  // These overlay types are deprecated - use LCARdS cards instead:
  // - button/text → custom:lcards-button
  // - apexchart → custom:lcards-chart
  // - status_grid → type: grid (HA card)
}
