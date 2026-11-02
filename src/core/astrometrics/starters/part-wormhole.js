/** The Bajoran wormhole as the displays draw it: its mouth and the diagram of its inside */

import { centreRef } from './shared.js';
import { bajoranWormhole } from './wormhole.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'wormhole',
  kind: 'part',
  title: 'Wormhole',
  summary: 'A wormhole mouth and the diagram of its inside',
  description: 'The Bajoran wormhole as the station displays draw it. Its mouth is a swirl of gas round a warm heart in the realistic look, an entrance disc and funnel in the diagram. Past it, diagram only, the inside runs along +x: a pipeline of twisted strands, the negative CTL region, the ring singularity, the positive CTL region and the point singularity opening into the verteron membrane. With a power entity (0 to 100) the mouth opens and the regions wobble with it.',
  icon: 'mdi:vector-ellipse',
  picture: { camera: { target: [30, -9, 0], yaw: 28, tilt: 14, distance: 74 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'bajoran' },
    { key: 'centre', label: 'Mouth', type: 'point', default: [0, 0, 0], helper: 'A point id or x, y, z. The inside runs along +x from here.' },
    { key: 'size', label: 'Length', type: 'number', default: 70 },
    { key: 'power', label: 'Power entity (optional)', type: 'text', default: '', helper: 'A number from 0 to 100: the mouth opens with it.' }
  ],
  build: ({ centre, size, power }) => {
    const c = centreRef(centre);
    const w = bajoranWormhole({ prefix: 'wormhole', at: c.ref, size: Math.max(1, Number(size) || 70), power: power ? String(power) : undefined });
    return { points: [...c.points, ...w.points], objects: w.objects };
  }
});
