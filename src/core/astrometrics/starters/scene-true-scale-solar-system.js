/**
 * The Sol system at true scale with real positions (R4a): the Sun, the
 * planets, Pluto, Ceres and the major moons in km where they are at the
 * scene date, on their real orbits, turned and spinning as they really do,
 * with the main and Kuiper belts. The clock starts today at a day a second.
 */
import { solSystem, SOL_VIEWS, SOL_CLOCK } from './true-scale.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'true_scale_solar_system',
  kind: 'scene',
  title: 'Solar system (real positions)',
  summary: 'The Solar System at real scale, where the planets are today',
  description: 'The Sun, the planets, Pluto, Ceres and the major moons in km, where they really are today and moving a day a second: real orbits, sizes, tilts and spins, Saturn\'s rings, the asteroid and Kuiper belts. Tap a planet to fly to it; the time slider runs the date faster, slower or back.',
  icon: 'mdi:orbit',
  params: [],
  build: () => ({
    units: 'km',
    clock: { ...SOL_CLOCK },
    views: SOL_VIEWS,
    camera: { view: 'system', fly_duration: 4000, buttons: true },
    backdrop: { stars: { count: 2000 } },
    ...solSystem()
  })
});
