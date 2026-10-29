/**
 * The true-scale Sol system both true-scale starters use, in km: the Sun,
 * the eight planets at their mean distances with their real radii, the
 * Moon and, with `station`, Deep Space 9 in Earth orbit (1.45 km across).
 * Planets stand still on their orbits (real motion would not show).
 */

/** [id, label, mean distance from the Sun (km), radius (km), bearing, label style] */
export const PLANETS = /** @type {const} */ ([
  ['mercury', 'MERCURY', 57909050, 2439.7, 200, 'tiny'],
  ['venus', 'VENUS', 108208000, 6051.8, 120, 'tiny'],
  ['earth', 'EARTH', 149597870.7, 6371, 30, 'minor'],
  ['mars', 'MARS', 227939200, 3389.5, 320, 'tiny'],
  ['jupiter', 'JUPITER', 778570000, 69911, 75, 'minor'],
  ['saturn', 'SATURN', 1433530000, 58232, 250, 'minor'],
  ['uranus', 'URANUS', 2872460000, 25362, 160, 'tiny'],
  ['neptune', 'NEPTUNE', 4495060000, 24622, 290, 'tiny']
]);

/** Each planet's surface: a built-in map, or a fill_effect preset */
const LOOKS = /** @type {Record<string, Record<string, any>>} */ ({
  mercury: { image: 'builtin:mercury_messenger' },
  venus: { fill_effect: { preset: 'clouds' } },
  earth: { image: 'builtin:earth_blue_marble', spin: 2 },
  mars: { image: 'builtin:mars_viking' },
  jupiter: { image: 'builtin:jupiter_cassini' },
  saturn: { fill_effect: { preset: 'ringed_giant' } },
  uranus: { fill_effect: { preset: 'ice_giant' } },
  neptune: { fill_effect: { preset: 'storm_giant' } }
});

/** Views in km (a view's distance is in its target's units) */
export const SOL_VIEWS = {
  system: { target: 'sun', yaw: 40, tilt: 35, distance: 12000000000 },
  inner: { target: 'sun', yaw: 40, tilt: 35, distance: 700000000 },
  earth: { target: 'earth', yaw: 225, tilt: 12, distance: 70000 },
  jupiter: { target: 'jupiter', yaw: 200, tilt: 10, distance: 700000 },
  saturn: { target: 'saturn', yaw: 160, tilt: 20, distance: 600000 }
};

/** The station view (with `station`) */
export const STATION_VIEW = { target: 'ds9', yaw: 330, tilt: 6, distance: 4 };

/**
 * @param {{ station?: boolean }} [opts]
 * @returns {{ points: any[], objects: any[] }}
 */
export function solSystem({ station = false } = {}) {
  const tapView = /** @type {Record<string, string>} */ ({ earth: 'earth', jupiter: 'jupiter', saturn: 'saturn' });
  return {
    points: [
      { id: 'sun', xyz: [0, 0, 0], label: 'SOL', style: 'major' },
      ...PLANETS.map(([id, label, orbit, , bearing, style]) => ({
        id, polar: [orbit, bearing], marker: 'dot', label, style,
        ...(tapView[id] ? { tap_action: { action: 'fly-to', view: tapView[id] } } : {})
      })),
      { id: 'moon', at: 'earth', offset: [-360000, 20000, -140000], label: 'LUNA', style: 'tiny', max_distance: 20000000 },
      ...(station ? [{ id: 'ds9', at: 'earth', offset: [-21082, 0, 36515], label: 'DEEP SPACE 9', style: 'tiny', max_distance: 3000000, tap_action: { action: 'fly-to', view: 'station' } }] : [])
    ],
    objects: [
      { type: 'glow', at: 'sun', size: 9000000, color: 'var(--lcars-yellow)' },
      { type: 'sphere', id: 'sun_body', at: 'sun', radius: 695700, fill_color: 'var(--lcars-yellow)', color: 'var(--lcars-orange)' },
      ...PLANETS.map(([id, , orbit]) => ({ type: 'ring', id: `${id}_orbit`, radius: orbit, width: 1, opacity: id === 'earth' ? 0.7 : 0.5, ...(id === 'earth' ? { color: 'var(--lcars-blue)' } : {}) })),
      ...PLANETS.map(([id, , , radius]) => ({ type: 'sphere', id: `${id}_body`, at: id, radius, ...LOOKS[id], line_spacing_deg: 30, line_width: 0.5 })),
      // Saturn's rings, D ring to F ring, tilted as the planet is
      { type: 'ring', id: 'saturn_rings', at: 'saturn', radius: 140180, inner_radius: 66900, inclination: 27, image: 'builtin:saturn_rings' },
      { type: 'sphere', id: 'moon_body', at: 'moon', radius: 1737.4, image: 'builtin:moon_lroc', line_spacing_deg: 45, line_width: 0.5 },
      ...(station ? [{ type: 'model', id: 'station', at: 'ds9', src: 'builtin:deep_space_nine', size: 1.452, material: 'original' }] : [])
    ]
  };
}
