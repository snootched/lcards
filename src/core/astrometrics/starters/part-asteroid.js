/** One asteroid up close: a tumbling rock lit from its star, with a label */

import { centreRef } from './shared.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'asteroid',
  kind: 'part',
  title: 'Asteroid',
  summary: 'One tumbling rock, lit from its star',
  description: 'One asteroid with lumps and craters, tumbling, lit from its star, with a label above it. Tap it to fly to it.',
  icon: 'mdi:meteor',
  picture: { camera: { target: [30, 0, 0], yaw: 270, tilt: 15, distance: 26 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'asteroid' },
    { key: 'label', label: 'Label', type: 'text', default: 'ASTEROID' },
    { key: 'at', label: 'Where', type: 'point', default: [30, 0, 0], helper: 'A point id or x, y, z.' },
    { key: 'light', label: 'Lit from', type: 'point', default: [0, 0, 0], helper: 'A point id (its star) or x, y, z.' },
    { key: 'size', label: 'Size', type: 'number', default: 8, real: 30 },
    { key: 'seed', label: 'Shape (any whole number)', type: 'number', default: 4 }
  ],
  build: ({ label, at, light, size, seed }) => {
    const where = centreRef(at);
    const s = Number(size) || 8;
    const lit = typeof light === 'string' && light ? { light } : { light: Array.isArray(light) && light.length === 3 ? light.map(Number) : [0, 0, 0] };
    return {
      points: [
        ...where.points,
        { id: 'body', at: where.ref, label: String(label), style: 'minor', offset: [0, s * 0.8, 0], tap_action: { action: 'fly-to' } }
      ],
      objects: [{ type: 'asteroid', id: 'rock', at: where.ref, size: s, seed: Math.round(Number(seed) || 1), ...lit }]
    };
  }
});
