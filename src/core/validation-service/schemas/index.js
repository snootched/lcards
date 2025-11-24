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

// Re-export all schemas
export {
  commonSchema,
  lineOverlaySchema
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
  // Register common schema (inherited by all)
  schemaRegistry.registerCommon(commonSchema);

  // Register type-specific schemas
  schemaRegistry.register('line', lineOverlaySchema);

  // Note: button, text, apexchart, status_grid schemas removed (v1.16.22+)
  // These overlay types are deprecated - use SimpleCards instead:
  // - button/text → custom:lcards-simple-button
  // - apexchart → custom:lcards-simple-chart
  // - status_grid → type: grid (HA card)
}
