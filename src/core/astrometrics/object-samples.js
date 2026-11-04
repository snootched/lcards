/**
 * One small scene per object type and per shape, for the pictures in the
 * Astrometrics Studio's add-object gallery and shape picker
 * (`npm run astro:pictures`, scripts/astro-pictures.mjs, writes
 * `type-<type>.webp` and `shape-<type>-<shape>.webp`). Pure data, free of
 * three.js and the Studio; tests/editor/astro-starter-pictures.test.js checks
 * every type and shape has one and that each is a valid config.
 *
 * @module core/astrometrics/object-samples
 */

import { GRID_SHAPES, VOLUME_SHAPES, IMAGE_SHAPES, NEBULA_SHAPES } from './names.js';

/**
 * @typedef {Object} ObjectSample
 * @property {any[]} [points]
 * @property {any[]} objects
 * @property {{ target: any, yaw: number, tilt: number, distance: number }} camera
 * @property {boolean} [motion] - the picture is taken after a few seconds of motion (a trail draws only as its point moves)
 */

/** A faint floor so a lone object has somewhere to stand */
const FLOOR = { type: 'grid', id: 'floor', shape: 'plane', size: 120, line_spacing: 10, opacity: 0.4 };
const VIEW = { target: [0, 0, 0], yaw: 20, tilt: 35, distance: 120 };

/** @type {Record<string, ObjectSample>} */
export const TYPE_SAMPLES = {
  grid: { objects: [{ type: 'grid', id: 'disc', shape: 'disc', radius: 50, pattern: 'polar', line_spacing: 10, spoke_count: 24 }], camera: VIEW },
  volume: { objects: [FLOOR, { type: 'volume', id: 'zone', shape: 'sector', radius: [15, 50], angle: [300, 400], height: [0, 15], color: 'var(--lcars-blue)' }], camera: VIEW },
  sphere: { objects: [{ type: 'sphere', id: 'globe', radius: 22, image: 'builtin:mars_viking', line_spacing_deg: 30 }], camera: { target: [0, 0, 0], yaw: 0, tilt: 15, distance: 80 } },
  image: { objects: [{ type: 'image', id: 'picture', src: 'builtin:nebula_orange_red', size: 100, blend: 'add' }, { ...FLOOR, opacity: 0.25 }], camera: VIEW },
  glow: { objects: [FLOOR, { type: 'glow', id: 'light', at: [0, 5, 0], size: 50 }], camera: VIEW },
  nebula: {
    objects: [
      { type: 'nebula', id: 'clouds', radius: 45, count: 10, seed: 7 },
      { type: 'nebula', id: 'veil', radius: 28, count: 8, seed: 23, colors: ['var(--lcars-violet)', 'var(--lcars-blue)'] }
    ],
    camera: { target: [0, 0, 0], yaw: 20, tilt: 30, distance: 110 }
  },
  model: { objects: [{ type: 'model', id: 'ship', src: 'builtin:constitution', size: 60, material: 'original' }], camera: { target: [0, 0, 0], yaw: 35, tilt: 20, distance: 75 } },
  ring: { objects: [FLOOR, { type: 'ring', id: 'orbit', radius: 40, inclination: 25, width: 2 }, { type: 'ring', id: 'range', radius: 25, dash: [4, 4] }], camera: VIEW },
  path: {
    points: [{ id: 'a', polar: [45, 250], marker: 'dot' }, { id: 'b', polar: [45, 70], marker: 'dot' }],
    objects: [FLOOR, { type: 'path', id: 'route', points: ['a', 'b'], arc: 20, width: 2, dash: [6, 4], color: 'var(--lcars-orange)' }],
    camera: VIEW
  },
  beam: { objects: [FLOOR, { type: 'beam', id: 'phaser', from: [-50, 5, 10], to: [50, 5, -10] }], camera: VIEW },
  belt: { objects: [{ type: 'glow', id: 'star', size: 25 }, { type: 'belt', id: 'rocks', radius: [35, 50], count: 900, size: [0.4, 1.4], seed: 3 }], camera: { target: [0, 0, 0], yaw: 20, tilt: 30, distance: 110 } },
  asteroid: { points: [{ id: 'sun', xyz: [-30, 25, 70] }], objects: [{ type: 'glow', at: 'sun', size: 12 }, { type: 'asteroid', id: 'rock', size: 16, seed: 3, light: 'sun' }], camera: { target: [0, 0, 0], yaw: 30, tilt: 15, distance: 32 } },
  comet: { points: [{ id: 'sun', xyz: [-90, 0, 30] }], objects: [{ type: 'glow', at: 'sun', size: 30, color: 'var(--lcars-yellow)' }, { type: 'comet', id: 'comet', at: [20, 0, 0], light: 'sun', tail: { length: 70 } }], camera: { target: [45, 0, 0], yaw: 0, tilt: 35, distance: 95 } },
  galaxy: { objects: [{ type: 'galaxy', id: 'milky_way', radius: 50 }], camera: { target: [0, 0, 0], yaw: 20, tilt: 45, distance: 110 } },
  trail: {
    points: [{ id: 'ship', polar: [35, 0], object: 'orbit', marker: 'dot' }],
    objects: [FLOOR, { type: 'ring', id: 'orbit', radius: 35, spin: 45, opacity: 0 }, { type: 'trail', id: 'wake', point: 'ship', length: 4, color: 'var(--lcars-orange)', width: 3 }],
    camera: VIEW,
    motion: true
  },
  cube: { objects: [{ type: 'cube', id: 'borg', size: 40 }], camera: { target: [0, 0, 0], yaw: 30, tilt: 25, distance: 100 } },
  system: {
    objects: [
      { type: 'grid', id: 'map', shape: 'disc', radius: 55, pattern: 'polar', line_spacing: 10, opacity: 0.4 },
      { type: 'system', id: 'sol', at: [0, 0, 0], scale: 0.2, objects: [
        { type: 'glow', id: 'sun', size: 60 },
        { type: 'ring', id: 'earth_orbit', radius: 120 },
        { type: 'ring', id: 'mars_orbit', radius: 190 }
      ] }
    ],
    camera: VIEW
  }
};

/** @type {Record<string, Record<string, ObjectSample>>} */
export const SHAPE_SAMPLES = {
  grid: Object.fromEntries(GRID_SHAPES.map((shape) => [shape, {
    objects: [{ type: 'grid', id: 'shape', shape, ...gridSize(shape) }],
    camera: { target: [0, shape === 'well' ? -15 : shape === 'dome' ? 15 : 0, 0], yaw: 20, tilt: 30, distance: shape === 'sphere' || shape === 'cylinder' ? 150 : 130 }
  }])),
  volume: Object.fromEntries(VOLUME_SHAPES.map((shape) => [shape, {
    objects: [FLOOR, { type: 'volume', id: 'shape', shape, color: 'var(--lcars-blue)', ...volumeSize(shape) }],
    camera: VIEW
  }])),
  image: Object.fromEntries(IMAGE_SHAPES.map((shape) => [shape, {
    objects: [{ type: 'image', id: 'shape', shape, src: 'builtin:nebula_orange_red', size: 100, blend: 'add' }],
    camera: { target: [0, 0, 0], yaw: 0, tilt: 50, distance: 150 }
  }])),
  nebula: Object.fromEntries(NEBULA_SHAPES.map((shape) => [shape, {
    objects: [{ type: 'nebula', id: 'shape', render: 'volume', shape, radius: 50, count: 8, seed: 4, ...nebulaLook(shape) }],
    // the cavity opens toward +z: look into it
    camera: { target: [0, 0, 0], yaw: shape === 'cavity' ? 0 : 20, tilt: shape === 'cavity' ? 8 : 15, distance: 150 }
  }]))
};

/** @param {string} shape */
function nebulaLook(shape) {
  // the picture page has the LCARdS palette (--lcards-*), not a theme's --lcars-* colours
  switch (shape) {
    case 'shell': return { colors: ['var(--lcards-blue-light)', 'var(--lcards-blue-medium-dark)'] };
    case 'bipolar': return { colors: ['var(--lcards-orange-medium)', 'var(--lcards-orange-dark)'], core: { color: 'var(--lcards-moonlight)' } };
    case 'filaments': return { colors: ['var(--lcards-orange-dark)', 'var(--lcards-blue-light)'], stretch: 0.5 };
    case 'cavity': return { colors: ['var(--lcards-orange-dark)', 'var(--lcards-yellow-medium)'], core: { color: 'var(--lcards-blue-lightest)' } };
    default: return { colors: ['var(--lcards-blue-medium)', 'var(--lcards-orange-medium)'] };
  }
}

/** @param {string} shape */
function gridSize(shape) {
  switch (shape) {
    case 'plane': return { size: 100, line_spacing: 10 };
    case 'disc': return { radius: 50, pattern: 'polar', line_spacing: 10, spoke_count: 24 };
    case 'cylinder': return { radius: 30, height: 50 };
    case 'well': return { radius: 50, depth: 40 };
    default: return { radius: 40 };
  }
}

/** @param {string} shape */
function volumeSize(shape) {
  switch (shape) {
    case 'box': return { size: [50, 20, 35], at: [0, 10, 0] };
    case 'prism': return { outline: [[-40, -20], [0, -40], [40, -10], [20, 30], [-30, 25]], height: [0, 15] };
    default: return { radius: [15, 50], angle: [300, 400], height: [0, 15] };
  }
}
