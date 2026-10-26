/**
 * Astrometrics scene runtime: the lazy entry the astrometrics card imports
 * (`import('../core/astrometrics/index.js')`); it brings three.js with it,
 * so nothing here reaches the main chunk.
 *
 * Design: reports/astrometrics-design.md. Modules: `scene-runtime.js` (the
 * API), `scene-builder.js` (objects, placements, labels from config),
 * `camera-rig.js`, `placements.js`, `label-layer.js`, `markers.js`,
 * `sky.js`, `lines.js` (px-dashed fat lines), `grid-mesh-material.js` +
 * `surface.js`, and one builder per object type in `objects/`.
 *
 * @module core/astrometrics
 */
export { createAstroScene } from './scene-runtime.js';
export { buildScene, OBJECT_TYPES } from './scene-builder.js';
export { MARKERS } from './markers.js';
export { LABEL_STYLES } from './label-layer.js';
export { resolveLabel, plainColor, selectedColor } from './label-text.js';
export { labelSources, fieldNeedsUpdate, bindingValue, bindingEntity } from './point-data.js';
export { GRID_SHAPES } from './objects/grid.js';
export { skyState, sunPosition, moonPosition } from './sky.js';
