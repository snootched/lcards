/** Three neighbouring territories as see-through sector volumes */

import { centreRef } from './shared.js';

const SETS = [
  { id: 'a', label: 'TERRITORY A', color: 'var(--lcars-blue)', angle: [0, 60] },
  { id: 'b', label: 'TERRITORY B', color: 'var(--lcars-red)', angle: [70, 130] },
  { id: 'c', label: 'TERRITORY C', color: 'var(--lcars-green)', angle: [140, 200] }
];

export default /** @type {import('./index.js').Starter} */ ({
  id: 'sector_volumes',
  kind: 'part',
  title: 'Sector volume set',
  summary: 'Three territories as see-through volumes of cells',
  description: 'Three territories side by side round a centre, each a see-through volume of cells in its own colour with its name above it. Tap one to fly to it.',
  icon: 'mdi:cube-outline',
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'zone' },
    { key: 'centre', label: 'Centre', type: 'point', default: [0, 0, 0], helper: 'A point id or x, y, z.' },
    { key: 'inner', label: 'Inner radius', type: 'number', default: 30 },
    { key: 'outer', label: 'Outer radius', type: 'number', default: 80 }
  ],
  build: ({ centre, inner, outer }) => {
    const c = centreRef(centre);
    const r0 = Number(inner) || 30;
    const r1 = Number(outer) || 80;
    return {
      points: [...c.points, ...SETS.map((s) => ({
        id: s.id, at: c.ref, offset: polarOffset((r0 + r1) / 2, (s.angle[0] + s.angle[1]) / 2, 16), label: s.label, style: 'major', color: s.color
      }))],
      objects: SETS.map((s) => ({
        type: 'volume', id: `${s.id}_space`, at: c.ref, shape: 'sector', radius: [r0, r1], angle: s.angle, height: [-4, 10],
        cells: { ring: 10, angle: 10, layer: 7 }, color: s.color, tap_action: { action: 'fly-to' }
      }))
    };
  }
});

/**
 * [x, y, z] of a bearing (0 north, clockwise from above) and distance on the plane, lifted by y.
 * @param {number} distance
 * @param {number} bearing
 * @param {number} y
 */
function polarOffset(distance, bearing, y) {
  const a = (bearing * Math.PI) / 180;
  const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10;
  return [r1(distance * Math.sin(a)), y, r1(-distance * Math.cos(a))];
}
