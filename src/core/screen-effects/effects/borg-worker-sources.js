/**
 * @fileoverview The Borg intro's worker sources as strings, in their own lazy
 * chunk: BorgAssimilationEffect imports this when the effect starts, so neither
 * worker weighs on the main chunk.
 *
 * @module core/screen-effects/effects/borg-worker-sources
 */

// @ts-expect-error — Vite ?raw suffix is a build-time import; TypeScript cannot resolve relative ?raw paths
import classicSource from './BorgAssimilationWorker.js?raw';
// @ts-expect-error — Vite ?raw suffix is a build-time import; TypeScript cannot resolve relative ?raw paths
import glSource from './BorgAssimilationGLWorker.js?raw';

/** @type {string} */
export const classicWorkerSource = classicSource;
/** @type {string} */
export const glWorkerSource = glSource;
