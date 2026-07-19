/**
 * Builtin MSD Background SVGs Pack
 *
 * Large external SVG files for Master Systems Displays.
 * These are lazy-loaded on demand to avoid bundle bloat.
 *
 * Each SVG is registered as a placeholder with metadata and URL.
 * AssetManager fetches content on first access via loadSvg().
 *
 * @module core/packs/svg-assets/builtin-msd
 */

/**
 * Builtin MSD Background SVGs Pack
 *
 * External SVG files shipped with LCARdS for Master Systems Display cards.
 * Files are hosted at /lcards/msd/ and lazy-loaded on demand.
 */
export const BUILTIN_MSD_SVG_PACK = {
  id: 'builtin_msd_backgrounds',
  version: __LCARDS_VERSION__,
  description: 'Builtin MSD background graphics - external SVG files for Master Systems Displays',

  // External SVG assets (lazy-loaded)
  svg_assets: {
    'ncc-1701-a': {
      url: '/lcards/msd/ncc-1701-a.svg',
      metadata: {
        ship: 'USS Enterprise',
        registry: 'NCC-1701-A',
        class: 'Constitution-class (refit)',
        era: 'TOS Films (2280s)',
        description: 'Enterprise-A primary master systems display',
        author: 'TBD',
        source: 'TBD',
        license: 'MIT'
      }
    },

    'ncc-1701-a-blue': {
      url: '/lcards/msd/ncc-1701-a-blue.svg',
      metadata: {
        ship: 'USS Enterprise',
        registry: 'NCC-1701-A',
        class: 'Constitution-class (refit)',
        era: 'TOS Films (2280s)',
        variant: 'Blue Alert Overlay',
        description: 'Enterprise-A with blue alert status overlay',
        author: 'TBD',
        source: 'https://github.com/warp-drive-engineering/engage',
        license: 'MIT'
      }
    },

    'enterprise-d-shuttlecraft15-anomaly': {
      url: '/lcards/msd/enterprise-d-shuttlecraft15-anomaly.svg',
      metadata: {
        ship: 'Shuttlecraft 15',
        registry: 'NCC-1701-D-15',
        class: 'Type-6 Shuttle',
        era: 'TNG (2360s-2370s)',
        description: 'Type-6 shuttlecraft systems display with anomaly indicators',
        author: 'anomaly',
        license: 'CC-BY-SA-4.0',
      },
    },

    'ncc-1701-kelvin': {
      url: '/lcards/msd/ncc-1701-kelvin.svg',
      metadata: {
        ship: 'USS Enterprise',
        registry: 'NCC-1701',
        class: 'Constitution-class',
        era: 'Kelvin Timeline Films (2009-2016)',
        description: 'Kelvin-timeline Enterprise master systems display',
        author: 'charner1963',
        source: 'https://freesvg.org/new-spaceship-enterprise-vector-drawing',
        license: 'Public Domain'
      }
    }
  }
};
