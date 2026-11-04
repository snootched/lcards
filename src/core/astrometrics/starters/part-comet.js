/** A comet on an orbit centred off its star: it swings in, grows its tails and brightens, then fades */

import { centreRef } from './shared.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'comet',
  kind: 'part',
  title: 'Comet',
  summary: 'A comet swinging round its star, its tails away from it',
  description: 'A comet on an orbit centred off its star, so it swings in close and out far. Its tails point away from the star and it grows and brightens near it (activity.mode: distance). Tap it to fly to it.',
  icon: 'mdi:star-shooting',
  picture: { camera: { target: [0, 0, 0], yaw: 0, tilt: 55, distance: 220 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'comet' },
    { key: 'label', label: 'Label', type: 'text', default: 'COMET' },
    { key: 'centre', label: 'Star', type: 'point', default: [0, 0, 0], helper: 'A point id (a star) or x, y, z.' },
    { key: 'near', label: 'Closest to the star', type: 'number', default: 25 },
    { key: 'far', label: 'Farthest from the star', type: 'number', default: 175 },
    { key: 'period', label: 'Seconds per orbit', type: 'number', default: 36 }
  ],
  build: ({ label, centre, near, far, period }) => {
    const c = centreRef(centre);
    const n = Math.max(0, Number(near) || 25);
    const f = Math.max(n + 1, Number(far) || 175);
    // a circle through near and far on either side of the star: its centre half-way, off the star
    const radius = (n + f) / 2;
    const offset = (f - n) / 2;
    const spin = 360 / Math.max(1, Number(period) || 36);
    // the ring sits off the star; its own place relative to the star (a point id: offset from it)
    const ringAt = typeof centre === 'string' && centre ? 'ring_centre' : [...(Array.isArray(centre) ? centre.map(Number) : [0, 0, 0])].map((v, i) => (i === 0 ? v + offset : v));
    return {
      points: [
        ...c.points,
        ...(ringAt === 'ring_centre' ? [{ id: 'ring_centre', at: c.ref, offset: [offset, 0, 0] }] : []),
        // starts at its closest to the star (bearing 270, toward -x of the ring's centre), tail out
        { id: 'body', polar: [radius, 270], object: 'orbit', label: String(label), style: 'tiny', tap_action: { action: 'fly-to' } }
      ],
      objects: [
        { type: 'ring', id: 'orbit', at: ringAt, radius, spin, width: 1, color: 'theme:colors.ui.secondary', opacity: 0.4 },
        { type: 'comet', id: 'comet', at: 'body', light: c.ref, tail: { length: Math.round(radius * 0.9) }, coma: { size: Math.max(2, Math.round(radius / 12)) }, activity: { mode: 'distance', range: [n, f] } }
      ]
    };
  }
});
