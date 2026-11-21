/** The Badlands as Voyager drew them: mauve layers, held pink lightning columns, strikes */

import { centreRef, sigFigs } from './shared.js';

/** A light year, km */
const LY_KM = 9.4607304725808e12;

export default /** @type {import('./index.js').Starter} */ ({
  id: 'badlands_voyager',
  kind: 'part',
  title: 'Badlands (Voyager)',
  summary: 'Mauve plasma layers with lightning columns and strikes',
  description: 'The Badlands as Voyager drew them (nebula preset: badlands_voyager): a floor and a ceiling of peach and mauve gas with a pale band between, held pink lightning columns crawling from the floor to the ceiling, and strikes that flash in the gap and light the gas round them. Fly the camera into the gap. Every key of the preset can be set on the nebula to change it.',
  icon: 'mdi:lightning-bolt',
  picture: { camera: { target: [0, 0, 0], yaw: 200, tilt: 4, distance: 160 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'badlands' },
    { key: 'label', label: 'Label', type: 'text', default: 'BADLANDS' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 0, 0], helper: 'A point id or x, y, z.' },
    { key: 'width', label: 'Width', type: 'number', default: 500, real: 10 * LY_KM, fit: true }
  ],
  build: ({ label, centre, width }) => {
    const c = centreRef(centre);
    const w = Number(width) || 500;
    return {
      points: [...c.points, { id: 'heart', at: c.ref, label: String(label), style: 'major' }],
      objects: [{ type: 'nebula', id: 'plasma', at: 'heart', preset: 'badlands_voyager', size: [w, sigFigs(w * 0.32), w] }]
    };
  }
});
