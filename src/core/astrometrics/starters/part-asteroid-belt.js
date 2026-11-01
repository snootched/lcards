/** An asteroid belt: a band of rocks round a centre, the inner ones going round faster */

import { centreRef } from './shared.js';
import { kmPerUnit } from '../names.js';

const AU_KM = 149597870.7;
export default /** @type {import('./index.js').Starter} */ ({
  id: 'asteroid_belt',
  kind: 'part',
  title: 'Asteroid belt',
  summary: 'A band of rocks going round a centre, lit by its star',
  description: 'A band of rocks going round a centre, the inner ones faster, lit from the centre as by its star, with a label on its edge.',
  icon: 'mdi:dots-circle',
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'belt' },
    { key: 'label', label: 'Label', type: 'text', default: 'ASTEROID BELT' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 0, 0], helper: 'A point id (a star) or x, y, z.' },
    { key: 'radius', label: 'Radius', type: 'number', default: 65, real: 2.7 * AU_KM },
    { key: 'width', label: 'Width', type: 'number', default: 8, real: AU_KM }
  ],
  build: ({ label, centre, radius, width }, { units }) => {
    const c = centreRef(centre);
    const r = Number(radius) || 65;
    const w = Number(width) || 8;
    // at real sizes the rocks are real too (5 to 300 km): dots from afar
    const km = kmPerUnit(units);
    const round = (/** @type {number} */ v) => (km ? Number(v.toPrecision(3)) : Math.round(v * 10) / 10);
    const size = km ? [round(5 / km), round(300 / km)] : [0.2, round(Math.max(0.6, w / 6))];
    return {
      points: [...c.points, { id: 'label', at: c.ref, offset: [0, 0, -(r + w)], label: String(label), style: 'tiny' }],
      objects: [
        { type: 'belt', id: 'rocks', at: c.ref, radius: [round(r - w / 2), round(r + w / 2)], count: 900, size, period: 60 }
      ]
    };
  }
});
