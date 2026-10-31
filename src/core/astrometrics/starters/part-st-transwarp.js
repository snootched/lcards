/**
 * Star Trek galaxy part (R4c2): the Borg transwarp network: a hub in the
 * Delta Quadrant (VOY "Endgame") with flowing conduits to the Unicomplex,
 * across Borg space, and to the aperture less than a light year from Earth
 * (Memory Alpha, "Sol system"), for the Star Trek galaxy starter (galaxy
 * ly, the core at 0). The hub's and exits' places are our own.
 */
import { nearSol, galaxyScale } from './scene-star-trek-galaxy.js';

/** [id, label, x, z] galaxy ly */
const EXITS = /** @type {const} */ ([
  ['tw_unicomplex', 'Unicomplex', 26000, -26000],
  ['tw_exit_1', 'Conduit exit', 36000, -14000],
  ['tw_exit_2', 'Conduit exit', 18000, -38000],
  ['tw_exit_3', 'Conduit exit', 8000, -12000]
]);

export default /** @type {import('./index.js').Starter} */ ({
  id: 'st_transwarp',
  kind: 'part',
  title: 'Star Trek: Borg transwarp network',
  summary: 'A Borg transwarp hub with conduits across the galaxy',
  description: 'For the Star Trek galaxy: a Borg transwarp hub in the Delta Quadrant with flowing conduits across Borg space and one to the aperture near Earth.',
  icon: 'mdi:hub-outline',
  scene: 'star_trek_galaxy',
  picture: { camera: { target: [14000, 0, -2000], yaw: 20, tilt: 55, distance: 75000 } },
  params: [{ key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: '' }],
  build: () => galaxyScale({
    units: 'ly',
    points: [
      { id: 'tw_hub', xyz: [22000, 0, -18000], marker: 'diamond', label: 'TRANSWARP HUB', style: 'minor', color: 'var(--lcars-green)' },
      ...EXITS.map(([id, label, x, z]) => ({ id, xyz: [x, 0, z], marker: 'dot', label, style: 'tiny', color: 'var(--lcars-green)', max_distance: 60000 })),
      // the aperture less than a light year from Earth (VOY "Endgame")
      { id: 'tw_earth', xyz: nearSol(0.6, -0.5, 0.2), label: 'Transwarp aperture', style: 'tiny', color: 'var(--lcars-green)', max_distance: 30 }
    ],
    objects: [...EXITS.map(([id]) => id), 'tw_earth'].map((to) => ({
      type: 'path', id: `conduit_${to}`, points: ['tw_hub', to], arc: to === 'tw_earth' ? 6000 : 1500, dash: [4, 6], flow_speed: 60,
      color: 'var(--lcars-green)', width: 1.5, glow: true
    }))
  })
});
