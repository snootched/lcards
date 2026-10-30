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
            description: 'The Cardassian station of Deep Space Nine (1452 m across, the docking pylons 969 m tip to tip, the core 369 m tall; Y up, metres, the origin at the Promenade): fan art made in code by scripts/make-starbases.mjs, no third-party mesh. Parts: the central core (ops, promenade, lower_core), the weapon sail towers through the habitat ring, the rings, the three crossover bridges (core to docking ring) and three spokes between them, and six docking pylons (part origins at their tips).',
            parts: ['ops', 'upper_core', 'promenade', 'lower_core', 'habitat_ring', 'docking_ring', 'windows', 'spokes', 'crossover_bridges', 'docking_ports', 'sail_towers', 'upper_pylon_1', 'upper_pylon_2', 'upper_pylon_3', 'lower_pylon_1', 'lower_pylon_2', 'lower_pylon_3']
        },
        earth_spacedock: {
            url: '/lcards/models/earth-spacedock.glb',
            label: 'Earth Spacedock',
            description: 'The Federation orbital station over Earth from Star Trek III (3800 m across and about 5480 m tall, Y up, metres): fan art made in code by scripts/make-starbases.mjs, no third-party mesh. Parts: the antennas at the top, the cap with the space_doors in its top, the underdish, the neck, the hull, the stem, the base (the sphere) and the towers under it (their tips).',
            parts: ['antennas', 'cap', 'space_doors', 'underdish', 'neck', 'hull', 'stem', 'base', 'towers', 'windows', 'panels']
        },
        utopia_planitia_drydock: {
            url: '/lcards/models/utopia-planitia-drydock.glb',
            label: 'Utopia Planitia drydock',
            description: 'A drydock of the Utopia Planitia Fleet Yards over Mars (about 760 m long, the bow end toward +z, Y up, metres), a deck slab over an open frame of hooped ribs with work-light panels, sized for a Galaxy-class ship: fan art made in code by scripts/make-starbases.mjs, no third-party mesh. Parts: frame, deck, keel, lights, berth (where a ship sits), bow and stern.',
            parts: ['frame', 'deck', 'keel', 'lights', 'berth', 'bow', 'stern']
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
        sun_sdo: {
            url: '/lcards/images/nasa-sdo-stereo-sun-2048.webp',
            label: 'Sun (SDO and STEREO)',
            category: 'planets',
            description: 'The Sun, an equirectangular map for globes (2048 x 1024, Carrington longitude 0 in the middle) in extreme ultraviolet (304 Å, the chromosphere): NASA Scientific Visualization Studio 30362, Full Map of the Sun\'s Surface, from STEREO EUVI and SDO AIA (2012). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        io_galileo: {
            url: '/lcards/images/usgs-galileo-io-2048.webp',
            label: 'Io (Galileo)',
            category: 'planets',
            description: 'Io, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Galileo SSI and Voyager global colour merge mosaic (1 km). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        europa_galileo: {
            url: '/lcards/images/usgs-galileo-europa-2048.webp',
            label: 'Europa (Galileo)',
            category: 'planets',
            description: 'Europa, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Voyager and Galileo SSI global mosaic (500 m); unseen patches near the poles are grey. Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        ganymede_galileo: {
            url: '/lcards/images/usgs-galileo-ganymede-2048.webp',
            label: 'Ganymede (Galileo)',
            category: 'planets',
            description: 'Ganymede, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Voyager and Galileo SSI global colour mosaic (1.4 km); unseen patches near the poles are grey. Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        callisto_galileo: {
            url: '/lcards/images/usgs-galileo-callisto-2048.webp',
            label: 'Callisto (Galileo)',
            category: 'planets',
            description: 'Callisto, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Voyager and Galileo SSI global mosaic (1 km); unseen patches near the poles are grey. Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        titan_cassini: {
            url: '/lcards/images/usgs-cassini-titan-2048.webp',
            label: 'Titan surface (Cassini)',
            category: 'planets',
            description: 'Titan under its haze, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Cassini ISS global mosaic (4 km, near infrared 938 nm). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        triton_voyager: {
            url: '/lcards/images/usgs-voyager-triton-2048.webp',
            label: 'Triton (Voyager 2)',
            category: 'planets',
            description: 'Triton, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Voyager 2 global colour mosaic (600 m); most of the north was never seen and is grey. Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        ceres_dawn: {
            url: '/lcards/images/usgs-dawn-ceres-2048.webp',
            label: 'Ceres (Dawn)',
            category: 'planets',
            description: 'Ceres, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Dawn Framing Camera global mosaic (October 2015). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        charon_new_horizons: {
            url: '/lcards/images/usgs-new-horizons-charon-2048.webp',
            label: 'Charon (New Horizons)',
            category: 'planets',
            description: 'Charon, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, New Horizons LORRI and MVIC global mosaic (July 2017); the far south was never seen and is grey. Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
        },
        phobos_viking: {
            url: '/lcards/images/usgs-viking-phobos-2048.webp',
            label: 'Phobos (Viking)',
            category: 'planets',
            description: 'Phobos, an equirectangular map for globes (2048 x 1024, longitude 0 in the middle): USGS Astrogeology, Viking orbiter global mosaic (40 pixels per degree). Public domain (NASA and USGS imagery is not subject to copyright in the United States).',
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
