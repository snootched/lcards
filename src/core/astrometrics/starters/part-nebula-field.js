/** A nebula field: a body of gas you can fly into, a veil of puffs and a bright heart */

import { centreRef } from './shared.js';

const LY_KM = 9.4607304725808e12;
export default /** @type {import('./index.js').Starter} */ ({
  id: 'nebula_field',
  kind: 'part',
  title: 'Nebula field',
  summary: 'Drifting gas you can fly into, with a glow at its heart',
  description: 'A slowly drifting body of gas (render: volume, so the camera can fly into it) with drawn-out clouds, a pale core and a dust lane, a veil of lighter puffs, a soft glow at the heart and a label.',
  icon: 'mdi:weather-cloudy',
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'nebula' },
    { key: 'label', label: 'Label', type: 'text', default: 'NEBULA' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 10, 0], helper: 'A point id or x, y, z.' },
    { key: 'radius', label: 'Radius', type: 'number', default: 40, real: 2 * LY_KM, fit: true }
  ],
  build: ({ label, centre, radius }) => {
    const c = centreRef(centre);
    const r = Number(radius) || 40;
    return {
      points: [...c.points, { id: 'heart', at: c.ref, label: String(label), style: 'major' }],
      objects: [
        { type: 'nebula', id: 'clouds', at: 'heart', render: 'volume', radius: r, count: 8, seed: 7, drift: 0.5, stretch: 0.4, dust: { count: 1 }, core: { color: 'var(--lcars-ice)' } },
        { type: 'nebula', id: 'veil', at: 'heart', radius: r * 0.6, count: 6, seed: 23, drift: 0.8, colors: ['var(--lcars-violet)', 'var(--lcars-blue)'] },
        { type: 'glow', id: 'glow', at: 'heart', size: r * 0.5, opacity: 0.7 }
      ]
    };
  }
});
