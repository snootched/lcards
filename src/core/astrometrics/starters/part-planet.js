/** A planet with an orbit ring round its centre and moons orbiting it */

import { centreRef } from './shared.js';
import { FILL_PRESETS } from '../names.js';

/**
 * The globe's surface from the Surface field: a picture (builtin: or a path)
 * as its image, anything else as a fill.effect preset; empty for none.
 * @param {any} look
 */
function surface(look) {
  const v = String(look ?? '').trim();
  if (!v) return {};
  return /^(builtin:|\/|https?:)/.test(v) ? { image: v } : { fill: { effect: { preset: v } } };
}

/** Moon orbit spins, degrees per second (the first moons go round fastest) */
const MOON_SPINS = [36, 22, 14, 9];

/** Moon orbits in planet radii: close in a scene sized to be seen, Luna-like (60) and out at real sizes */
const MOON_ORBITS = { scene: [2, 3.2, 4.4, 5.6], real: [30, 60, 95, 150] };

const AU_KM = 149597870.7;

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
    { key: 'orbit', label: 'Orbit radius', type: 'number', default: 40, real: AU_KM, fit: true },
    { key: 'radius', label: 'Planet radius', type: 'number', default: 3, real: 6371, fit: true },
    { key: 'moons', label: 'Moons (0 to 4)', type: 'number', default: 2 },
    { key: 'look', label: 'Surface', type: 'text', default: 'rocky', helper: 'A planet type (gas_giant, ringed_giant, ice_giant, storm_giant, clouds, lava, ice, rocky, terran), a map (builtin:mars_viking) or your own picture (/local/planet.jpg).',
      options: FILL_PRESETS.map((value) => ({ value, label: value.replace(/_/g, ' ') })), custom: true }
  ],
  build: ({ label, centre, orbit, radius, moons, look }, { units }) => {
    const c = centreRef(centre);
    const r = Number(radius) || 3;
    const count = Math.max(0, Math.min(4, Math.round(Number(moons) || 0)));
    const ratios = MOON_ORBITS[units ? 'real' : 'scene'];
    const moonList = Array.from({ length: count }, (_, i) => ({ id: `moon${i + 1}`, orbit: sig(r * ratios[i]), spin: MOON_SPINS[i], bearing: i * 110 }));
    // moons and their labels appear as you close in on the planet
    const near = sig(Math.max(r * 40, (moonList[moonList.length - 1]?.orbit ?? 0) * 4));
    return {
      points: [
        ...c.points,
        { id: 'body', polar: [Number(orbit) || 40, 0], object: 'orbit', marker: 'dot', label: String(label), style: 'minor', tap_action: { action: 'fly-to' } },
        ...moonList.map((m) => ({ id: m.id, polar: [m.orbit, m.bearing], object: `${m.id}_orbit`, marker: 'dot', label: m.id.toUpperCase(), style: 'tiny', max_distance: near }))
      ],
      objects: [
        { type: 'ring', id: 'orbit', at: c.ref, radius: Number(orbit) || 40, spin: 5, width: 1, color: 'theme:colors.ui.secondary', opacity: 0.6 },
        { type: 'sphere', id: 'globe', at: 'body', radius: r, ...surface(look), line_spacing_deg: 30, spin: 15 },
        ...moonList.flatMap((m) => [
          { type: 'ring', id: `${m.id}_orbit`, at: 'body', radius: m.orbit, spin: m.spin, width: 1, dash: [3, 3], opacity: 0.5, max_distance: near },
          { type: 'sphere', id: `${m.id}_globe`, at: m.id, radius: units ? sig(r * 0.27) : Math.max(0.3, r * 0.25), line_spacing_deg: 45, max_distance: near }
        ])
      ]
    };
  }
});

/** @param {number} n */
const sig = (n) => Number(n.toPrecision(3));
