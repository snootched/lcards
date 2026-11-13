/** The Bajoran wormhole as the displays draw it: its mouth and the diagram of its inside */

import { centreRef } from './shared.js';
import { bajoranWormhole } from './wormhole.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'wormhole',
  kind: 'part',
  title: 'Wormhole',
  summary: 'A wormhole mouth and the diagram of its inside',
  description: 'The Bajoran wormhole as the station displays draw it. Its mouth is a whirlpool of 3D gas wound into spiral arms round a warm heart and a funnel in the realistic look, an entrance disc and funnel in the diagram. Past it, diagram only, the inside runs along +x (leave it out for the mouth alone): a pipeline of twisted strands, the negative CTL region, the ring singularity, the positive CTL region and the point singularity opening into the verteron membrane. Its power (0 to 100, or an entity to follow) opens the mouth and wobbles the regions.',
  icon: 'mdi:vector-ellipse',
  picture: { camera: { target: [30, -9, 0], yaw: 28, tilt: 14, distance: 74 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'bajoran' },
    { key: 'centre', label: 'Mouth', type: 'point', default: [0, 0, 0], helper: 'A point id or x, y, z. The inside runs along +x from here.' },
    { key: 'size', label: 'Length', type: 'number', default: 70, real: 40, fit: true },
    { key: 'inside', label: 'Inside', type: 'text', default: 'diagram', options: [{ value: 'diagram', label: 'The mouth and the diagram of its inside' }, { value: 'none', label: 'The mouth only' }] },
    { key: 'power', label: 'Power', type: 'setting', default: 100, helper: 'How open, 0 (closed) to 100, or an entity to follow (the link button). A light or switch opens it when on; its brightness_pct opens it by steps; By state gives each state its power (playing 100, paused 40).' }
  ],
  build: ({ centre, size, power, inside }) => {
    const c = centreRef(centre);
    const w = bajoranWormhole({ prefix: 'wormhole', at: c.ref, size: Math.max(1, Number(size) || 70), power, inside: inside !== 'none' });
    return { points: [...c.points, ...w.points], objects: w.objects };
  }
});
