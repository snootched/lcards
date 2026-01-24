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
 * Files are hosted at /hacsfiles/lcards/msd/ and lazy-loaded on demand.
 */
export const BUILTIN_MSD_SVG_PACK = {
  id: 'builtin_msd_backgrounds',
  version: '1.25.06',
  description: 'Builtin MSD background graphics - external SVG files for Master Systems Displays',

  // External SVG assets (lazy-loaded)
  svg_assets: {
    'ncc-1701-a': {
      url: '/hacsfiles/lcards/msd/ncc-1701-a.svg',
      metadata: {
        ship: 'USS Enterprise',
        registry: 'NCC-1701-A',
        class: 'Constitution-class (refit)',
        era: 'TOS Films (2280s)',
        description: 'Enterprise-A primary master systems display',
        approximate_size: '180KB',
        author: 'TBD',
        source: 'TBD',
        license: 'MIT'
      }
    },

    'ncc-1701-a-blue': {
      url: '/hacsfiles/lcards/msd/ncc-1701-a-blue.svg',
      metadata: {
        ship: 'USS Enterprise',
        registry: 'NCC-1701-A',
        class: 'Constitution-class (refit)',
        era: 'TOS Films (2280s)',
        variant: 'Blue Alert Overlay',
        description: 'Enterprise-A with blue alert status overlay',
        approximate_size: '185KB',
        author: 'TBD',
        source: 'https://github.com/warp-drive-engineering/engage',
        license: 'MIT'
      }
    },

    'enterprise-d-shuttlecraft15-anomaly': {
      url: '/hacsfiles/lcards/msd/enterprise-d-shuttlecraft15-anomaly.svg',
      metadata: {
        ship: 'Shuttlecraft 15',
        registry: 'NCC-1701-D-15',
        class: 'Type-6 Shuttle',
        era: 'TNG (2360s-2370s)',
        description: 'Type-6 shuttlecraft systems display with anomaly indicators',
        approximate_size: '142KB',
        author: 'anomaly',
        source: 'Bundled with LCARdS',
        license: 'MIT'
      },
    },
    'enterprise-d-shuttlecraft15-anomaly-custom': {
      url: '/hacsfiles/lcards/msd/enterprise-d-shuttlecraft15-anomaly-custom.svg',
      metadata: {
        ship: 'Shuttlecraft 15',
        registry: 'NCC-1701-D-15',
        class: 'Type-6 Shuttle',
        era: 'TNG (2360s-2370s)',
        variant: 'Modified ViewBox Size',
        description: 'Modified size - Type-6 shuttlecraft systems display with anomaly indicators',
        approximate_size: '142KB',
        author: 'anomaly',
        source: 'Bundled with LCARdS',
        license: 'MIT'
      }
    }
  }
};
