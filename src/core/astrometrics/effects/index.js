/**
 * Scene effects (a lazy chunk of their own, loaded only when a config uses
 * one, see `usesEffects()` in `../names.js`): the noise shaders and the
 * objects built on them.
 *
 * @module core/astrometrics/effects
 */
export { buildNebula, nebulaLayout } from './nebula.js';
export { buildCube, cubeSize, cubeSpots } from './cube.js';
export { fillMaterial, FILL_TYPES } from './fills.js';
