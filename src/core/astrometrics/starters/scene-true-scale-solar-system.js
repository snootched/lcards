/**
 * Solar system at true scale: the Sol system in km, real distances and
 * sizes (the faked Solar system starter exaggerates both).
 */
import { solSystem, SOL_VIEWS } from './true-scale.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'true_scale_solar_system',
  kind: 'scene',
  title: 'Solar system at true scale',
  description: 'The Sun and eight planets in km at their real distances and sizes, with the Moon and Saturn\'s rings. From the whole system the planets are dots on their orbits; tap Earth, Jupiter or Saturn to fly in to it.',
  icon: 'mdi:ruler',
  params: [],
  build: () => ({
    units: 'km',
    views: SOL_VIEWS,
    camera: { view: 'system', fly_duration: 4000 },
    backdrop: { stars: { count: 2000 } },
    ...solSystem()
  })
});
