/**
 * The Sol system both true-scale starters use, in km, from the ephemeris
 * (R4a): the Sun, the eight planets, Pluto and Ceres where they really are
 * at the scene clock's date, on their real orbits, turned and spinning as
 * they really do, with the major moons (Luna, Phobos, Deimos, the Galilean
 * moons, Titan, Triton, Charon), Saturn's rings in its equator, and the
 * main and Kuiper belts at their real distances. With `station`, Deep
 * Space 9 in Earth orbit (1.45 km across). Orbit lines carry the tag
 * `orbits` (a rule can hide them).
 */

const AU = 149597870.7;

/** [body, label, label style] for the Sun's planets, out from it */
export const PLANETS = /** @type {const} */ ([
  ['mercury', 'MERCURY', 'tiny'],
  ['venus', 'VENUS', 'tiny'],
  ['earth', 'EARTH', 'minor'],
  ['mars', 'MARS', 'minor'],
  ['ceres', 'CERES', 'tiny'],
  ['jupiter', 'JUPITER', 'minor'],
  ['saturn', 'SATURN', 'minor'],
  ['uranus', 'URANUS', 'tiny'],
  ['neptune', 'NEPTUNE', 'tiny'],
  ['pluto', 'PLUTO', 'tiny']
]);

/** [body, label, its planet, mean distance from it (km)] */
export const MOONS = /** @type {const} */ ([
  ['moon', 'LUNA', 'earth', 384400],
  ['phobos', 'PHOBOS', 'mars', 9375],
  ['deimos', 'DEIMOS', 'mars', 23457],
  ['io', 'IO', 'jupiter', 421800],
  ['europa', 'EUROPA', 'jupiter', 671100],
  ['ganymede', 'GANYMEDE', 'jupiter', 1070400],
  ['callisto', 'CALLISTO', 'jupiter', 1882700],
  ['titan', 'TITAN', 'saturn', 1221900],
  ['triton', 'TRITON', 'neptune', 354800],
  ['charon', 'CHARON', 'pluto', 19600]
]);

/** Mean radius of each body, km */
const RADIUS = /** @type {Record<string, number>} */ ({
  sun: 695700, mercury: 2439.7, venus: 6051.8, earth: 6371, moon: 1737.4, mars: 3389.5, phobos: 11.08, deimos: 6.27,
  ceres: 469.7, jupiter: 69911, io: 1821.6, europa: 1560.8, ganymede: 2634.1, callisto: 2410.3, saturn: 58232, titan: 2574.7,
  uranus: 25362, neptune: 24622, triton: 1353.4, pluto: 1188.3, charon: 606
});

/** Each body's surface: a built-in map, or a fill_effect preset where there is no public-domain map */
const LOOKS = /** @type {Record<string, Record<string, any>>} */ ({
  sun: { image: 'builtin:sun_sdo' },
  mercury: { image: 'builtin:mercury_messenger' },
  venus: { fill_effect: { preset: 'clouds' } },
  earth: { image: 'builtin:earth_blue_marble' },
  moon: { image: 'builtin:moon_lroc' },
  mars: { image: 'builtin:mars_viking' },
  phobos: { image: 'builtin:phobos_viking' },
  deimos: { fill_color: 'var(--lcards-gray-medium)', fill_opacity: 1 },
  ceres: { image: 'builtin:ceres_dawn' },
  jupiter: { image: 'builtin:jupiter_cassini' },
  io: { image: 'builtin:io_galileo' },
  europa: { image: 'builtin:europa_galileo' },
  ganymede: { image: 'builtin:ganymede_galileo' },
  callisto: { image: 'builtin:callisto_galileo' },
  saturn: { fill_effect: { preset: 'ringed_giant' } },
  titan: { image: 'builtin:titan_cassini' },
  uranus: { fill_effect: { preset: 'ice_giant' } },
  neptune: { fill_effect: { preset: 'storm_giant' } },
  triton: { image: 'builtin:triton_voyager' },
  pluto: { image: 'builtin:pluto_new_horizons' },
  charon: { image: 'builtin:charon_new_horizons' }
});

/** Views in km (a view's distance is in its target's units); the planets move, the views follow them */
export const SOL_VIEWS = {
  system: { target: 'sun', yaw: 40, tilt: 35, distance: 16000000000 },
  inner: { target: 'sun', yaw: 40, tilt: 35, distance: 900000000 },
  earth: { target: 'earth', yaw: 225, tilt: 12, distance: 70000 },
  mars: { target: 'mars', yaw: 200, tilt: 15, distance: 60000 },
  jupiter: { target: 'jupiter', yaw: 200, tilt: 10, distance: 4500000 },
  saturn: { target: 'saturn', yaw: 160, tilt: 20, distance: 3500000 },
  neptune: { target: 'neptune', yaw: 160, tilt: 20, distance: 1000000 },
  pluto: { target: 'pluto', yaw: 120, tilt: 20, distance: 80000 }
};

/** The station view (with `station`) */
export const STATION_VIEW = { target: 'ds9', yaw: 330, tilt: 6, distance: 4 };

/** The scene clock: today, an hour a second (the time slider changes it) */
export const SOL_CLOCK = { date: 'now', rate: '1 h/s' };

/**
 * @param {{ station?: boolean }} [opts]
 * @returns {{ points: any[], objects: any[] }}
 */
export function solSystem({ station = false } = {}) {
  const views = /** @type {Record<string, any>} */ (SOL_VIEWS);
  return {
    points: [
      { id: 'sun', xyz: [0, 0, 0], label: 'SOL', style: 'major' },
      ...PLANETS.map(([id, label, style]) => ({
        id, body: id, marker: 'dot', label, style,
        ...(views[id] ? { tap_action: { action: 'fly-to', view: id } } : {})
      })),
      // moon labels show from about 50 times their orbit (nearer than that they crowd their planet)
      ...MOONS.map(([id, label, , a]) => ({ id, body: id, label, style: 'tiny', max_distance: a * 50 })),
      ...(station ? [{ id: 'ds9', at: 'earth', offset: [-21082, 0, 36515], label: 'DEEP SPACE 9', style: 'tiny', max_distance: 3000000, tap_action: { action: 'fly-to', view: 'station' } }] : [])
    ],
    objects: [
      { type: 'glow', at: 'sun', size: 9000000, color: 'var(--lcars-yellow)' },
      { type: 'sphere', id: 'sun_body', at: 'sun', radius: RADIUS.sun, body: 'sun', ...LOOKS.sun, line_spacing_deg: 30, line_width: 0.5 },
      ...PLANETS.map(([id]) => ({
        type: 'ring', id: `${id}_orbit`, orbit: id, width: 1, opacity: id === 'earth' ? 0.7 : 0.5, tags: ['orbits'],
        ...(id === 'earth' ? { color: 'var(--lcars-blue)' } : {})
      })),
      ...MOONS.map(([id, , planet, a]) => ({ type: 'ring', id: `${id}_orbit`, at: planet, orbit: id, width: 1, opacity: 0.4, tags: ['orbits'], max_distance: a * 50 })),
      ...[...PLANETS.map(([id]) => id), ...MOONS.map(([id]) => id)].map((id) => ({
        type: 'sphere', id: `${id}_body`, at: id, radius: RADIUS[id], body: id, ...LOOKS[id], line_spacing_deg: 30, line_width: 0.5
      })),
      // Saturn's rings, D ring to F ring, in Saturn's equator
      { type: 'ring', id: 'saturn_rings', at: 'saturn', radius: 140180, inner_radius: 66900, body: 'saturn', image: 'builtin:saturn_rings' },
      // the main belt (2.1 to 3.3 au) and the Kuiper belt (30 to 50 au): dots from afar
      { type: 'belt', id: 'main_belt', at: 'sun', radius: [2.1 * AU, 3.3 * AU], thickness: 0.15 * AU, count: 1500, size: [5, 300], tumble: 0, seed: 4 },
      { type: 'belt', id: 'kuiper_belt', at: 'sun', radius: [30 * AU, 50 * AU], thickness: 3 * AU, count: 2000, size: [50, 1200], tumble: 0, seed: 9, color: 'var(--lcars-blue)' },
      ...(station ? [{ type: 'model', id: 'station', at: 'ds9', src: 'builtin:deep_space_nine', material: 'original' }] : [])
    ]
  };
}
