/**
 * Star Trek galaxy part (R4c2): the minor Alpha and Beta Quadrant powers
 * round Federation space, at the close-up's scale (ly from Sol), for the
 * Star Trek galaxy starter (`units: ly`, Sol at 26,000 ly toward bearing 180).
 * Ferenginar sits where its recorded distances put it (55 ly from Cardassia,
 * 60 from Bajor; Memory Alpha); the others in their recorded quadrants (Gorn
 * and Tholian space in Beta per Star Charts, Breen and Tzenkethi in Alpha),
 * at places of our own.
 */
import { nearSol, galaxyScale } from './scene-star-trek-galaxy.js';

/** [id, label, dx, dz, colour] ly from Sol */
const POWERS = /** @type {const} */ ([
  ['ferenginar', 'Ferenginar', -105.9, 28.1, 'var(--lcars-yellow)'],
  ['breen', 'Breen', -150, 95, 'var(--lcars-lilac)'],
  ['tzenkethi', 'Tzenkethi', -175, 20, 'var(--lcars-magenta)'],
  ['tholia', 'Tholia', 40, 140, 'var(--lcars-orange)'],
  ['gorn', 'Gorn Hegemony', 150, -40, 'var(--lcars-green)']
]);

export default /** @type {import('./index.js').Starter} */ ({
  id: 'st_minor_powers',
  kind: 'part',
  title: 'Star Trek: minor powers',
  summary: 'The Ferengi, Breen, Tzenkethi, Tholian and Gorn homeworlds',
  description: 'For the Star Trek galaxy: the Ferengi, Breen, Tzenkethi, Tholian and Gorn homeworlds round Federation space, each with a small territory, at the close-up\'s scale (Ferenginar at its recorded 55 ly from Cardassia and 60 from Bajor).',
  icon: 'mdi:account-group-outline',
  scene: 'star_trek_galaxy',
  picture: { camera: { target: [-60, 0, 26060], yaw: 20, tilt: 45, distance: 420 } },
  params: [{ key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: '' }],
  build: () => galaxyScale({
    units: 'ly',
    points: POWERS.map(([id, label, dx, dz, color]) => ({ id, xyz: nearSol(dx, dz), marker: 'diamond', label, style: 'minor', color, max_distance: 3000 })),
    // a small territory round each homeworld (ly; the outline is our own)
    objects: POWERS.map(([id, , , , color]) => ({
      type: 'volume', id: `${id}_space`, shape: 'prism', at: id, height: [-6, 6], color, face_opacity: 0.25, max_distance: 3000,
      outline: [[-18, -10], [-4, -20], [16, -12], [20, 8], [4, 20], [-16, 14]]
    }))
  })
});
