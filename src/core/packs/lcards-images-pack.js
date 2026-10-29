/**
 * @fileoverview LCARdS Built-in Images Pack
 *
 * Registers named image assets (raster and SVG) that cards can reference with the
 * `builtin:<key>` syntax in any `source` field — e.g. config.source: 'builtin:bedroom'.
 *
 * This pack uses the AssetManager `image` type, which is a URL-only registry.
 * No content is fetched by AssetManager; the browser loads the image natively via
 * ImageLoader when a card first renders.
 *
 * ## Adding curated images
 *
 * 1. Copy the image file to `hacsfiles/lcards/images/` (mirrored from `src/assets/images/`)
 * 2. Add an entry below with a stable snake_case key and a `/lcards/images/` URL.
 * 3. The key becomes the `builtin:<key>` reference users put in card config.
 *
 * ## User-defined images
 *
 * Users can add their own entries at runtime from the Config Panel (Settings →
 * Image Library).  Those entries call `assetManager.register('image', key, null, { url })`
 * directly and are persisted in HA storage alongside rules / datasources.
 *
 * @module core/packs/lcards-images-pack
 */

/**
 * LCARdS built-in raster and SVG image library.
 *
 * Intentionally empty at first ship — the pack scaffold is ready for curated
 * images to be added as they are sourced/licensed.  Third-party pack authors
 * can also provide their own `image_assets` packs following this structure.
 */
export const LCARDS_IMAGES_PACK = {
    id: 'lcards_images',
    version: __LCARDS_VERSION__,
    description: 'LCARdS built-in image library: named raster and SVG images for card backgrounds and shape textures, and 3D models for astrometrics scenes',

    /**
     * Image asset definitions.
     *
     * Each entry maps a string key → { url, label, category, description }.
     * Only `url` is required; all other fields are optional metadata surfaced in the editor.
     *
     * Example entry (uncomment and adapt when adding real assets):
     *
     * ```js
     * 'bedroom': {
     *   url: '/lcards/images/bedroom.jpg',
     *   label: 'Bedroom',
     *   category: 'rooms',
     *   description: 'Generic bedroom area photo'
     * },
     * ```
     */
    /**
     * 3D models (glTF / GLB) for the astrometrics card's `model` objects
     * (`src: builtin:<key>`). `parts` lists the named nodes points can sit on.
     */
    model_assets: {
        constitution: {
            url: '/lcards/models/constitution.glb',
            label: 'Constitution-class starship',
            description: 'A Constitution-class starship in TOS proportions (289 m long, the bow toward +z, Y up, metres): fan art made in code by scripts/make-demo-ship.mjs, no third-party mesh. One animation clip, bussards.',
            parts: ['saucer', 'bridge', 'sensor_dome', 'impulse', 'neck', 'secondary_hull', 'deflector', 'shuttle_bay', 'pylon_port', 'pylon_starboard', 'nacelle_port', 'nacelle_starboard', 'bussard_port', 'bussard_starboard', 'grille_port', 'grille_starboard']
        },
        deep_space_nine: {
            url: '/lcards/models/deep-space-nine.glb',
            label: 'Deep Space 9 (Terok Nor)',
            description: 'The Cardassian station of Deep Space Nine (about 1450 m across and 1070 m tall, Y up, metres, the origin at the Promenade): fan art made in code by scripts/make-starbases.mjs, no third-party mesh. Parts: the central core (ops, promenade, lower_core), the rings, the crossover bridges, and six docking pylons (part origins at their tips).',
            parts: ['ops', 'upper_core', 'promenade', 'lower_core', 'habitat_ring', 'docking_ring', 'windows', 'crossover_bridges', 'docking_ports', 'upper_pylon_1', 'upper_pylon_2', 'upper_pylon_3', 'lower_pylon_1', 'lower_pylon_2', 'lower_pylon_3']
        },
        earth_spacedock: {
            url: '/lcards/models/earth-spacedock.glb',
            label: 'Earth Spacedock',
            description: 'The Federation orbital station over Earth from Star Trek III (about 3810 m across and 5795 m tall, Y up, metres): fan art made in code by scripts/make-starbases.mjs, no third-party mesh. Parts: the space_doors at the top, the cap, the stem, the docking_ring and the base (its bottom tip).',
            parts: ['cap', 'stem', 'docking_ring', 'base', 'space_doors', 'windows', 'panels', 'docking_ports']
        },
        utopia_planitia_drydock: {
            url: '/lcards/models/utopia-planitia-drydock.glb',
            label: 'Utopia Planitia drydock',
            description: 'A drydock of the Utopia Planitia Fleet Yards over Mars (about 760 m long, the bow end toward +z, Y up, metres), an open frame of ribs and spars with work lights, sized for a Galaxy-class ship: fan art made in code by scripts/make-starbases.mjs, no third-party mesh. Parts: frame, lights, berth (where a ship sits), bow and stern.',
            parts: ['frame', 'lights', 'berth', 'bow', 'stern']
        }
    },

    image_assets: {
        // Built-in entries will be added here as they are sourced and licensed.
        // Users add their own via the Config Panel → Image Library.
        earth_blue_marble: {
            url: '/lcards/images/nasa-blue-marble-earth-2048.webp',
            label: 'Earth (Blue Marble)',
            category: 'planets',
            description: 'Earth, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): NASA Earth Observatory, Blue Marble: Next Generation (July 2004). NASA texture maps are not subject to copyright in the United States.',
        },
        moon_lroc: {
            url: '/lcards/images/nasa-lroc-moon-2048.webp',
            label: 'Moon (LRO)',
            category: 'planets',
            description: 'The Moon, an equirectangular map for globes (2048 x 1024, longitude 0, the near side, in the middle): NASA Scientific Visualization Studio, CGI Moon Kit (Lunar Reconnaissance Orbiter LROC colour, poles filled). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        mars_viking: {
            url: '/lcards/images/usgs-viking-mars-2048.webp',
            label: 'Mars (Viking)',
            category: 'planets',
            description: 'Mars, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Viking global colour mosaic (925 m, colour by NASA Ames). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        mercury_messenger: {
            url: '/lcards/images/usgs-messenger-mercury-2048.webp',
            label: 'Mercury (MESSENGER)',
            category: 'planets',
            description: 'Mercury, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, MESSENGER MDIS basemap MD3 colour global mosaic (665 m). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        venus_magellan: {
            url: '/lcards/images/usgs-magellan-venus-2048.webp',
            label: 'Venus surface (Magellan)',
            category: 'planets',
            description: 'Venus under its clouds, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Magellan C3-MDIR synthetic colour global mosaic (radar, coloured to simulate the surface). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        jupiter_cassini: {
            url: '/lcards/images/nasa-cassini-jupiter-2048.webp',
            label: 'Jupiter (Cassini)',
            category: 'planets',
            description: 'Jupiter, an equirectangular map for globes (2048 x 1024): NASA/JPL/Space Science Institute, PIA07782, Cassini cylindrical map (December 2000). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        pluto_new_horizons: {
            url: '/lcards/images/usgs-new-horizons-pluto-2048.webp',
            label: 'Pluto (New Horizons)',
            category: 'planets',
            description: 'Pluto, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, New Horizons LORRI and MVIC global mosaic (July 2017); the far south was never seen and is blank. Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        saturn_rings: {
            url: '/lcards/images/saturn-rings-profile.webp',
            label: 'Saturn rings (profile)',
            category: 'planets',
            description: 'Saturn\'s rings across their width for a ring band (image on a ring; 1024 x 4, the D ring\'s inner edge on the left, just past the F ring on the right): drawn by scripts/make-planet-maps.mjs from the published ring radii (D, C, B rings, Cassini Division, A ring with the Encke and Keeler gaps, F ring). No third-party image.',
        },
        sun: {
            url: '/lcards/images/astrographix_visuals-sun-1494070_1920.jpg',
            label: 'Sun',
            category: 'space',
            description: 'Close-up of the sun: astrographix_visuals (Pixabay #1494070)',
        },
        stars_blue_green: {
            url: '/lcards/images/geralt-stars-2643089_1920.jpg',
            label: 'Stars (blue/green)',
            category: 'space',
            description: 'Star field: geralt (Pixabay #2643089)',
        },
        starry_sky: {
            url: '/lcards/images/hans-starry-sky-1655503_1920.jpg',
            label: 'Starry Sky',
            category: 'space',
            description: 'Starry night sky: hans (Pixabay #1655503)',
        },
        ds9_station: {
            url: '/lcards/images/janson_g-space-station-2749367.png',
            label: 'DS9 Model Station',
            category: 'sci-fi',
            description: 'Space station: janson_g (Pixabay #2749367)',
        },
        borg_cube: {
            url: '/lcards/images/kifoku-borg-5108780.png',
            label: 'Borg Cube',
            category: 'sci-fi',
            description: 'Borg: kifoku (Pixabay #5108780)',
        },
        stars_blue: {
            url: '/lcards/images/pexels-stars-2179083_1920.jpg',
            label: 'Stars (blue)',
            category: 'space',
            description: 'Star field: Pexels (#2179083)',
        },
        nebula_green_orange: {
            url: '/lcards/images/wikiimages-space-11097_1920.jpg',
            label: 'Nebula (green/orange)',
            category: 'space',
            description: 'Deep space: WikiImages (Pixabay #11097)',
        },
        nebula_orange_red: {
            url: '/lcards/images/wikiimages-stars-67616_1920.jpg',
            label: 'Nebula (orange/red)',
            category: 'space',
            description: 'Star field: WikiImages (Pixabay #67616)',
        },
    }
};
