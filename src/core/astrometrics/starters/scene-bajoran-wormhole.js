/** The Bajoran wormhole close up: its mouth and the diagram of its inside */

import { bajoranWormhole } from './wormhole.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'bajoran_wormhole',
  kind: 'scene',
  title: 'Bajoran wormhole',
  summary: 'The wormhole\'s mouth and the regions inside it',
  description: 'The Bajoran wormhole as the station displays draw it: the mouth (a swirl of gas round a warm heart in the realistic look, an entrance disc and funnel in the diagram) and, diagram only, its inside: the pipeline, the negative CTL region, the ring singularity, the positive CTL region, the point singularity and the verteron membrane. Switch the card\'s look to see one or the other. Tap a name to fly to it. With a power entity (0 to 100) the mouth opens and the regions wobble with it.',
  icon: 'mdi:vector-ellipse',
  params: [
    { key: 'power', label: 'Power entity (optional)', type: 'text', default: '', helper: 'A number from 0 to 100: the mouth opens with it.' }
  ],
  build: ({ power }) => {
    const w = bajoranWormhole({ prefix: 'wormhole', at: 'mouth', power: power ? String(power) : undefined, stars: 8000 });
    return {
      views: {
        overview: { target: 'wormhole_middle', yaw: 28, tilt: 14, distance: 88 },
        mouth: { target: 'mouth', yaw: 20, tilt: 40, distance: 34 },
        inside: { target: 'wormhole_ring_singularity', yaw: 60, tilt: 10, distance: 30 },
        membrane: { target: 'wormhole_membrane_centre', yaw: 20, tilt: 20, distance: 34 }
      },
      camera: { view: 'overview' },
      backdrop: { stars: { count: 2500 } },
      points: [
        { id: 'mouth', xyz: [0, 0, 0] },
        { id: 'name', at: 'mouth', offset: [0, 14, 0], label: 'BAJORAN WORMHOLE', style: 'major', tap_action: { action: 'fly-to', view: 'mouth' } },
        ...w.points
      ],
      objects: w.objects
    };
  }
});
