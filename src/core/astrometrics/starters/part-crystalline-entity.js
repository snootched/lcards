/** The Crystalline Entity (TNG), with a ship beside it for scale and its beam */

import { centreRef, sigFigs } from './shared.js';

/** The Galaxy-class ship's length as a share of the entity's 3 km */
const SHIP_SHARE = 0.6425 / 3;

export default /** @type {import('./index.js').Starter} */ ({
  id: 'crystalline-entity',
  kind: 'part',
  title: 'Crystalline Entity',
  summary: 'The Crystalline Entity, with a ship beside it for scale',
  description: 'The Crystalline Entity ("Datalore", "Silicon Avatar"): a crystalline object 3 km tall, turning slowly about its glowing spine, its core pulsing. With a ship, a Galaxy-class starship (the Enterprise of both episodes) stands off its side at the same scale (642.5 m against 3 km), and with the beam the entity\'s core fires on it. Change the crystal colour on the object (var(--lcars-african-violet) for the lavender of the show).',
  icon: 'mdi:snowflake',
  picture: { camera: { target: [-800, 0, 0], yaw: 0, tilt: 5, distance: 5000 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'entity' },
    { key: 'label', label: 'Label', type: 'text', default: 'CRYSTALLINE ENTITY' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 0, 0], helper: 'A point id or x, y, z.' },
    { key: 'size', label: 'Height', type: 'number', default: 3000, real: 3, fit: true },
    { key: 'ship', label: 'Ship for scale', type: 'text', default: 'beam', options: [{ value: 'beam', label: 'A ship, and the entity\'s beam on it' }, { value: 'ship', label: 'A ship' }, { value: 'none', label: 'No ship' }] }
  ],
  build: ({ label, centre, size, ship }) => {
    const c = centreRef(centre);
    const H = Number(size) || 3000;
    /** @type {any[]} */
    const points = [...c.points, { id: 'core', at: c.ref }, { id: 'tag', at: 'core', offset: [0, sigFigs(H * 0.56), 0], label: String(label), style: 'major' }];
    /** @type {any[]} */
    const objects = [{ type: 'crystalline', id: 'crystal', at: 'core', size: H, spin: 2 }];
    if (ship === 'ship' || ship === 'beam') {
      points.push({ id: 'ship_at', at: 'core', offset: [sigFigs(-H * 0.7), sigFigs(-H * 0.03), sigFigs(H * 0.1)], label: 'USS ENTERPRISE', style: 'minor' });
      objects.push({ type: 'model', id: 'ship', src: 'builtin:galaxy_class', at: 'ship_at', size: sigFigs(H * SHIP_SHARE) });
      if (ship === 'beam') objects.push({ type: 'beam', id: 'beam', from: 'core', to: 'ship_at', width: 10, color: 'var(--lcards-moonlight)', pulse: true });
    }
    return { points, objects };
  }
});
