/** An asteroid belt: dotted rings at slightly different radii and speeds */

import { centreRef } from './shared.js';
export default /** @type {import('./index.js').Starter} */ ({
  id: 'asteroid_belt',
  kind: 'part',
  title: 'Asteroid belt',
  description: 'A band of dotted rings turning at slightly different speeds round a centre, with a label on its edge.',
  icon: 'mdi:dots-circle',
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'belt' },
    { key: 'label', label: 'Label', type: 'text', default: 'ASTEROID BELT' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 0, 0], helper: 'A point id (a star) or x, y, z.' },
    { key: 'radius', label: 'Radius', type: 'number', default: 65 },
    { key: 'width', label: 'Width', type: 'number', default: 8 }
  ],
  build: ({ label, centre, radius, width }) => {
    const c = centreRef(centre);
    const r = Number(radius) || 65;
    const w = Number(width) || 8;
    const rings = [-0.5, -0.2, 0.1, 0.35, 0.5].map((f, i) => ({
      type: 'ring', id: `ring${i + 1}`, at: c.ref, radius: Math.round((r + f * w) * 10) / 10,
      spin: 3 + i * 0.7, width: 2 + (i % 2), dash: [1, 5 + i * 2], color: 'var(--lcars-tangerine)', opacity: 0.7
    }));
    return {
      points: [...c.points, { id: 'label', at: c.ref, offset: [0, 0, -(r + w)], label: String(label), style: 'tiny' }],
      objects: rings
    };
  }
});
