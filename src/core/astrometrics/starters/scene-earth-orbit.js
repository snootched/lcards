/**
 * Earth orbit: the Earth turning as it really does, with the space stations,
 * Hubble, the GPS and Galileo constellations and the geostationary weather
 * satellites where they are now (orbits shipped with LCARdS, satellites.js),
 * at real heights or as a diagram (low orbits lifted, high ones brought in).
 */

/** The Earth's radius in scene units: heights are in its radii, so any size works */
const R = 20;

export default /** @type {import('./index.js').Starter} */ ({
  id: 'earth_orbit',
  kind: 'scene',
  title: 'Earth orbit: real satellites',
  summary: 'The ISS, Hubble, GPS, Galileo and the weather satellites where they are now',
  description: 'The Earth turning as it really does, with the ISS, Tiangong and Hubble, the GPS and Galileo constellations and the geostationary weather satellites where they are now, from orbits shipped with LCARdS. Diagram heights lift the low orbits clear of the surface; real heights show them to scale.',
  icon: 'mdi:satellite-variant',
  params: [
    { key: 'heights', label: 'Heights', type: 'text', default: 'diagram', options: [{ value: 'diagram', label: 'Diagram (low orbits lifted, high ones brought in)' }, { value: 'real', label: 'Real (to scale)' }] }
  ],
  build: (params) => {
    const heights = params.heights === 'real' ? 'real' : 'diagram';
    // the outermost orbit (geostationary) in Earth radii from the centre
    const reach = heights === 'real' ? 6.6 : 3.7;
    const low = (/** @type {string} */ id, /** @type {string} */ label) => ({ id, satellite: id, object: 'earth', heights, marker: 'dot', label, style: 'tiny', color: 'var(--lcars-orange)' });
    return {
      clock: { date: 'now', rate: 'live' },
      views: {
        orbits: { target: [0, 0, 0], yaw: 30, tilt: 30, distance: Math.round(R * reach * 2.6) },
        earth: { target: [0, 0, 0], yaw: 30, tilt: 15, distance: Math.round(R * (heights === 'real' ? 3.2 : 4.2)) },
        pole: { target: [0, 0, 0], tilt: 90, distance: Math.round(R * reach * 2.8) }
      },
      camera: { view: 'orbits' },
      backdrop: { stars: { count: 1500 } },
      points: [
        low('iss', 'ISS'),
        low('tiangong', 'TIANGONG'),
        low('hubble', 'HUBBLE')
      ],
      objects: [
        { type: 'sphere', id: 'earth', radius: R, body: 'earth', image: 'builtin:earth_blue_marble' },
        { type: 'ring', id: 'iss_orbit', satellite: 'iss', width: 1.5, color: 'var(--lcars-orange)' },
        { type: 'ring', id: 'tiangong_orbit', satellite: 'tiangong', width: 1, opacity: 0.6, color: 'var(--lcars-orange)' },
        { type: 'ring', id: 'hubble_orbit', satellite: 'hubble', width: 1, opacity: 0.6, color: 'var(--lcars-orange)' },
        { type: 'satellites', id: 'gps', group: 'gps', object: 'earth', heights, color: 'var(--lcars-yellow)', orbits: { width: 0.75, opacity: 0.35 } },
        { type: 'satellites', id: 'galileo', group: 'galileo', object: 'earth', heights, color: 'var(--lcars-violet)', orbits: { width: 0.75, opacity: 0.35 } },
        { type: 'satellites', id: 'weather', group: 'geostationary', object: 'earth', heights, color: 'var(--lcars-blue)', label: true, orbits: { width: 1, opacity: 0.5 } }
      ]
    };
  }
});
