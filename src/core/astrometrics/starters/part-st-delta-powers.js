/**
 * Star Trek galaxy part (R4c2): the Delta Quadrant powers Voyager met on its
 * way home, as regions along its route in the order it met them (Kazon space
 * round Ocampa, then the Vidiians, then the Hirogen), for the Star Trek
 * galaxy starter (galaxy ly, the core at 0). The outlines are our own.
 */

import { galaxyScale } from './scene-star-trek-galaxy.js';

/** [id, label, colour, outline [x, z] ly, label place] */
const POWERS = /** @type {[string, string, string, [number, number][], [number, number]][]} */ ([
  ['kazon', 'KAZON SECTS', 'var(--lcars-orange)', [[33000, -38000], [41000, -36000], [42000, -29000], [35000, -27000], [31000, -31000]], [37000, -33000]],
  ['vidiian', 'VIDIIAN SODALITY', 'var(--lcars-red)', [[30000, -29000], [35000, -26000], [33000, -20000], [27000, -21000]], [31000, -24000]],
  ['hirogen', 'HIROGEN HUNTING GROUNDS', 'var(--lcars-violet)', [[16000, -8000], [26000, -6000], [27000, 2000], [17000, 3000], [12000, -2000]], [20000, -3000]]
]);

export default /** @type {import('./index.js').Starter} */ ({
  id: 'st_delta_powers',
  kind: 'part',
  title: 'Star Trek: Delta Quadrant powers',
  description: 'For the Star Trek galaxy: Kazon, Vidiian and Hirogen space along Voyager\'s route home, in the order Voyager met them.',
  icon: 'mdi:map-marker-path',
  params: [{ key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: '' }],
  build: () => galaxyScale({
    units: 'ly',
    points: POWERS.map(([id, label, color, , [x, z]]) => ({ id: `${id}_name`, xyz: [x, 1500, z], label, style: 'minor', color })),
    objects: POWERS.map(([id, , color, outline]) => ({
      type: 'volume', id: `${id}_space`, shape: 'prism', outline, height: [-1000, 1000], color, face_opacity: 0.25, cells: { width: 2000, depth: 2000, height: 1000 }
    }))
  })
});
