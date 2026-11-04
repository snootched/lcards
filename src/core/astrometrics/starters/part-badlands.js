/** The Badlands as Deep Space Nine drew them: two sheets of liquid fire, a bright band, fire columns */

import { centreRef } from './shared.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'badlands',
  kind: 'part',
  title: 'Badlands (Deep Space Nine)',
  summary: 'Plasma sheets, a glowing band and fire columns to fly between',
  description: 'The Badlands as Deep Space Nine drew them (nebula preset: badlands): a floor and a ceiling of liquid fire in yellow, orange and red, an orange band glowing in the gap between them and fire columns, thick and thin, standing from the floor to the ceiling. Fly the camera into the gap. Every key of the preset can be set on the nebula to change it.',
  icon: 'mdi:fire',
  picture: { camera: { target: [0, 0, 0], yaw: 30, tilt: 22, distance: 620 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'badlands' },
    { key: 'label', label: 'Label', type: 'text', default: 'BADLANDS' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 0, 0], helper: 'A point id or x, y, z.' },
    { key: 'width', label: 'Width', type: 'number', default: 500 }
  ],
  build: ({ label, centre, width }) => {
    const c = centreRef(centre);
    const w = Number(width) || 500;
    return {
      points: [...c.points, { id: 'heart', at: c.ref, label: String(label), style: 'major' }],
      objects: [{ type: 'nebula', id: 'plasma', at: 'heart', preset: 'badlands', size: [w, w * 0.28, w] }]
    };
  }
});
