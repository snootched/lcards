/** A planet with an orbit ring round its centre and moons orbiting it */

import { centreRef } from './shared.js';
import { FILL_PRESETS } from '../names.js';

/**
 * The globe's surface from the Surface field: a picture (builtin: or a path)
 * as its image, anything else as a fill_effect preset; empty for none.
 * @param {any} look
 */
function surface(look) {
  const v = String(look ?? '').trim();
  if (!v) return {};
  return /^(builtin:|\/|https?:)/.test(v) ? { image: v } : { fill_effect: { preset: v } };
}

/** Moon orbit spins, degrees per second (the first moons go round fastest) */
const MOON_SPINS = [36, 22, 14, 9];

export default /** @type {import('./index.js').Starter} */ ({
  id: 'planet',
  kind: 'part',
  title: 'Planet with moons',
  summary: 'A planet on its orbit ring with up to four moons',
  description: 'A planet orbiting a centre point on its own ring, with up to four moons going round it. Tap the planet to fly to it.',
  icon: 'mdi:earth',
  picture: { camera: { target: 'planet_body', yaw: 30, tilt: 25, distance: 34 } },
  params: [
    { key: 'prefix', label: 'Name (prefix for its ids)', type: 'text', default: 'planet' },
    { key: 'label', label: 'Label', type: 'text', default: 'PLANET' },
    { key: 'centre', label: 'Orbits round', type: 'point', default: [0, 0, 0], helper: 'A point id (a star) or x, y, z.' },
    { key: 'orbit', label: 'Orbit radius', type: 'number', default: 40 },
    { key: 'radius', label: 'Planet radius', type: 'number', default: 3 },
    { key: 'moons', label: 'Moons (0 to 4)', type: 'number', default: 2 },
    { key: 'look', label: 'Surface', type: 'text', default: 'rocky', helper: 'A planet type (gas_giant, ringed_giant, ice_giant, storm_giant, clouds, lava, ice, rocky, terran), a map (builtin:mars_viking) or your own picture (/local/planet.jpg).',
      options: FILL_PRESETS.map((value) => ({ value, label: value.replace(/_/g, ' ') })), custom: true }
  ],
  build: ({ label, centre, orbit, radius, moons, look }) => {
    const c = centreRef(centre);
    const r = Number(radius) || 3;
    const count = Math.max(0, Math.min(4, Math.round(Number(moons) || 0)));
    const moonList = Array.from({ length: count }, (_, i) => ({ id: `moon${i + 1}`, orbit: Math.round(r * (2 + i * 1.2) * 10) / 10, spin: MOON_SPINS[i], bearing: i * 110 }));
    return {
      points: [
        ...c.points,
        { id: 'body', polar: [Number(orbit) || 40, 0], object: 'orbit', marker: 'dot', label: String(label), style: 'minor', tap_action: { action: 'fly-to' } },
        ...moonList.map((m) => ({ id: m.id, polar: [m.orbit, m.bearing], object: `${m.id}_orbit`, marker: 'dot', label: m.id.toUpperCase(), style: 'tiny', max_distance: r * 40 }))
      ],
      objects: [
        { type: 'ring', id: 'orbit', at: c.ref, radius: Number(orbit) || 40, spin: 5, width: 1, color: 'theme:colors.ui.secondary', opacity: 0.6 },
        { type: 'sphere', id: 'globe', at: 'body', radius: r, ...surface(look), line_spacing_deg: 30, spin: 15 },
        ...moonList.flatMap((m) => [
          // moons appear as you close in on the planet, with their labels
          { type: 'ring', id: `${m.id}_orbit`, at: 'body', radius: m.orbit, spin: m.spin, width: 1, dash: [3, 3], opacity: 0.5, max_distance: r * 40 },
          { type: 'sphere', id: `${m.id}_globe`, at: m.id, radius: Math.max(0.3, r * 0.25), line_spacing_deg: 45, max_distance: r * 40 }
        ])
      ]
    };
  }
});
