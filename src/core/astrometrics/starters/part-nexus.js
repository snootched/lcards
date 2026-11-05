/** The Nexus (Generations): a white-hot ribbon trailing pink gas, discharges crawling off it */

import { centreRef } from './shared.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'nexus',
  kind: 'part',
  title: 'The Nexus',
  summary: 'A white-hot ribbon of energy trailing a wake of pink gas',
  description: 'The Nexus as Generations drew it (nebula preset: nexus): a white-hot ribbon waving across space, its waves running along it, a wake of pink and red gas streaming out behind it, and small discharges crawling off it and lighting the gas. Set travel to orbit to send it round the centre on a wide orbit, its wake trailing behind. Every key of the preset can be set on the nebula to change it.',
  icon: 'mdi:wave',
  picture: { camera: { target: [0, -60, 0], yaw: 8, tilt: 6, distance: 1500 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'nexus' },
    { key: 'label', label: 'Label', type: 'text', default: 'NEXUS' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 0, 0], helper: 'A point id or x, y, z.' },
    { key: 'length', label: 'Length', type: 'number', default: 2000 },
    { key: 'travel', label: 'Travel', type: 'text', default: 'still', options: [{ value: 'still', label: 'Still (its waves still run)' }, { value: 'orbit', label: 'Round the centre on a wide orbit' }] }
  ],
  build: ({ label, centre, length, travel }) => {
    const c = centreRef(centre);
    const L = Number(length) || 2000;
    if (travel !== 'orbit') {
      return {
        points: [...c.points, { id: 'heart', at: c.ref, label: String(label), style: 'major' }],
        objects: [{ type: 'nebula', id: 'ribbon', at: 'heart', preset: 'nexus', size: [L, L / 4, L / 4] }]
      };
    }
    // on a wide orbit round the centre, broadside on, the wake (+y) turned to trail behind (-z)
    const R = L * 1.5;
    return {
      points: [...c.points, { id: 'heart', polar: [R, 0], object: 'track', label: String(label), style: 'major' }],
      objects: [
        { type: 'ring', id: 'track', at: c.ref, radius: R, spin: 2, width: 0.5, opacity: 0 },
        { type: 'nebula', id: 'ribbon', at: 'heart', preset: 'nexus', size: [L, L / 4, L / 4], face: 'motion', rotation: [-90, 0, 0] }
      ]
    };
  }
});
