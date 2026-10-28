/** A nebula field: two clouds of gas round a bright heart */

import { centreRef } from './shared.js';
export default /** @type {import('./index.js').Starter} */ ({
  id: 'nebula_field',
  kind: 'part',
  title: 'Nebula field',
  description: 'Two overlapping, slowly drifting clouds of gas with a soft glow at their heart and a label.',
  icon: 'mdi:weather-cloudy',
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'nebula' },
    { key: 'label', label: 'Label', type: 'text', default: 'NEBULA' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 10, 0], helper: 'A point id or x, y, z.' },
    { key: 'radius', label: 'Radius', type: 'number', default: 40 }
  ],
  build: ({ label, centre, radius }) => {
    const c = centreRef(centre);
    const r = Number(radius) || 40;
    return {
      points: [...c.points, { id: 'heart', at: c.ref, label: String(label), style: 'major' }],
      objects: [
        { type: 'nebula', id: 'clouds', at: 'heart', radius: r, cloud_count: 10, seed: 7, drift: 0.5 },
        { type: 'nebula', id: 'veil', at: 'heart', radius: r * 0.6, cloud_count: 6, seed: 23, drift: 0.8, colors: ['var(--lcars-violet)', 'var(--lcars-blue)'] },
        { type: 'glow', id: 'glow', at: 'heart', size: r * 0.5, opacity: 0.7 }
      ]
    };
  }
});
