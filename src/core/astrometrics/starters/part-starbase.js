/** A built-in starbase model at a point, with its name and main parts marked */

import { centreRef } from './shared.js';

/** Each built-in starbase's labelled parts: [part, label] */
const MARKS = /** @type {Record<string, [string, string][]>} */ ({
  deep_space_nine: [['ops', 'OPS'], ['promenade', 'PROMENADE'], ['docking_ring', 'DOCKING RING']],
  earth_spacedock: [['space_doors', 'SPACE DOORS'], ['hull', 'HULL']],
  utopia_planitia_drydock: [['bow', 'BOW'], ['berth', 'BERTH']]
});

/** Each built-in starbase's largest extent, km (the model pack's sizes) */
const REAL_KM = /** @type {Record<string, number>} */ ({ deep_space_nine: 1.452, earth_spacedock: 5.48, utopia_planitia_drydock: 0.76 });

export default /** @type {import('./index.js').Starter} */ ({
  id: 'starbase',
  kind: 'part',
  title: 'Starbase',
  summary: 'A built-in starbase model with its parts labelled',
  description: 'A built-in starbase model (Deep Space 9, Earth Spacedock or a Utopia Planitia drydock) at a point, with its name and main parts labelled; far away a starbase marker stands in for it. Tap the name to fly to it.',
  icon: 'mdi:space-station',
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'starbase' },
    { key: 'label', label: 'Label', type: 'text', default: 'DEEP SPACE 9' },
    { key: 'model', label: 'Model', type: 'text', default: 'deep_space_nine', helper: 'deep_space_nine, earth_spacedock or utopia_planitia_drydock.',
      options: [{ value: 'deep_space_nine', label: 'Deep Space 9' }, { value: 'earth_spacedock', label: 'Earth Spacedock' }, { value: 'utopia_planitia_drydock', label: 'Utopia Planitia drydock' }] },
    { key: 'centre', label: 'At', type: 'point', default: [0, 0, 0], helper: 'A point id or x, y, z.' },
    { key: 'size', label: 'Size (its largest extent)', type: 'number', default: 60, real: ({ model }) => REAL_KM[String(model)] ?? REAL_KM.deep_space_nine }
  ],
  build: ({ label, model, centre, size }) => {
    const c = centreRef(centre);
    const key = MARKS[String(model)] ? String(model) : 'deep_space_nine';
    const s = Number(size) || 60;
    return {
      points: [
        ...c.points,
        { id: 'name', at: c.ref, offset: [0, s * 0.7, 0], label: String(label), style: 'minor', tap_action: { action: 'fly-to', view: 'view' } },
        ...MARKS[key].map(([part, text]) => ({ id: part, object: 'station', part, marker: 'dot', label: text, style: 'tiny', max_distance: s * 6 })),
        // far away the marker stands in for the model (the ranges meet, so they cross-fade)
        { id: 'far', at: c.ref, marker: 'starbase', min_distance: s * 12, tap_action: { action: 'fly-to', view: 'view' } }
      ],
      objects: [{ type: 'model', id: 'station', src: `builtin:${key}`, at: c.ref, size: s, material: 'original', max_distance: s * 12 }],
      views: { view: { target: c.ref, yaw: 30, tilt: 15, distance: s * 2 } }
    };
  }
});
