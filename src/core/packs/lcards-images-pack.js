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
    description: 'LCARdS built-in image library — named raster and SVG images for card backgrounds and shape textures',

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
    image_assets: {
        // Built-in entries will be added here as they are sourced and licensed.
        // Users add their own via the Config Panel → Image Library.
        sun: {
            url: '/lcards/images/astrographix_visuals-sun-1494070_1920.jpg',
            label: 'Sun',
            category: 'space',
            description: 'Close-up of the sun — astrographix_visuals (Pixabay #1494070)',
        },
        stars_blue_green: {
            url: '/lcards/images/geralt-stars-2643089_1920.jpg',
            label: 'Stars (blue/green)',
            category: 'space',
            description: 'Star field — geralt (Pixabay #2643089)',
        },
        starry_sky: {
            url: '/lcards/images/hans-starry-sky-1655503_1920.jpg',
            label: 'Starry Sky',
            category: 'space',
            description: 'Starry night sky — hans (Pixabay #1655503)',
        },
        ds9_station: {
            url: '/lcards/images/janson_g-space-station-2749367.png',
            label: 'DS9 Model Station',
            category: 'sci-fi',
            description: 'Space station — janson_g (Pixabay #2749367)',
        },
        borg_cube: {
            url: '/lcards/images/kifoku-borg-5108780.png',
            label: 'Borg Cube',
            category: 'sci-fi',
            description: 'Borg — kifoku (Pixabay #5108780)',
        },
        stars_blue: {
            url: '/lcards/images/pexels-stars-2179083_1920.jpg',
            label: 'Stars (blue)',
            category: 'space',
            description: 'Star field — Pexels (#2179083)',
        },
        nebula_green_orange: {
            url: '/lcards/images/wikiimages-space-11097_1920.jpg',
            label: 'Nebula (green/orange)',
            category: 'space',
            description: 'Deep space — WikiImages (Pixabay #11097)',
        },
        nebula_orange_red: {
            url: '/lcards/images/wikiimages-stars-67616_1920.jpg',
            label: 'Nebula (orange/red)',
            category: 'space',
            description: 'Star field — WikiImages (Pixabay #67616)',
        },
    }
};
