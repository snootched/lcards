/** The Bajoran wormhole close up: its mouth and the diagram of its inside */

import { bajoranWormhole } from './wormhole.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'bajoran_wormhole',
  kind: 'scene',
  title: 'Bajoran wormhole',
  summary: 'The wormhole\'s mouth and the regions inside it',
  description: 'The Bajoran wormhole as the station displays draw it: the mouth (a whirlpool of 3D gas wound into spiral arms round a warm heart and a funnel in the realistic look, an entrance disc and funnel in the diagram) and, diagram only, its inside: the pipeline, the negative CTL region, the ring singularity, the positive CTL region, the point singularity and the verteron membrane. Switch the card\'s look to see one or the other, or leave the inside out for the mouth alone. Tap a name to fly to it. Its power (0 to 100, or an entity to follow) opens the mouth and wobbles the regions.',
  icon: 'mdi:vector-ellipse',
  params: [
    { key: 'inside', label: 'Inside', type: 'text', default: 'diagram', options: [{ value: 'diagram', label: 'The mouth and the diagram of its inside' }, { value: 'none', label: 'The mouth only' }] },
    { key: 'power', label: 'Power', type: 'setting', default: 100, helper: 'How open, 0 (closed) to 100, or an entity to follow (the link button). A light or switch opens it when on; its brightness attribute (0 to 255) opens it by steps. Low and high left empty: the entity\'s min and max, else 0 and 100.' }
  ],
  build: ({ power, inside }) => {
    const all = inside !== 'none';
    const w = bajoranWormhole({ prefix: 'wormhole', at: 'mouth', power, stars: 8000, inside: all });
    if (!all) {
      return {
        views: {
          mouth: { target: 'mouth', yaw: 20, tilt: 40, distance: 34 },
          side: { target: 'mouth', yaw: 30, tilt: 12, distance: 40 }
        },
        camera: { view: 'mouth' },
        backdrop: { stars: { count: 2500 } },
        points: [
          { id: 'mouth', xyz: [0, 0, 0] },
          { id: 'name', at: 'mouth', offset: [0, 14, 0], label: 'BAJORAN WORMHOLE', style: 'major', tap_action: { action: 'fly-to', view: 'mouth' } },
          ...w.points
        ],
        objects: w.objects
      };
    }
    return {
      views: {
        overview: { target: 'wormhole_middle', yaw: 40, tilt: 14, distance: 92 },
        mouth: { target: 'mouth', yaw: 20, tilt: 40, distance: 34 },
        inside: { target: 'wormhole_ring_singularity', yaw: 60, tilt: 10, distance: 30 },
        membrane: { target: 'wormhole_membrane_centre', yaw: 50, tilt: 15, distance: 52 }
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
