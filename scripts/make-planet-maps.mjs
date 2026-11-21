#!/usr/bin/env node
/**
 * make-planet-maps.mjs: builds the built-in planet maps for astrometrics
 * spheres (`builtin:moon_lroc`, ...) from public-domain NASA and USGS
 * sources, and the Saturn ring profile (`builtin:saturn_rings`) from the
 * published ring radii. Writes 2048 x 1024 WebP files (equirectangular,
 * longitude 0 in the middle) to src/assets/images/.
 *
 *   node scripts/make-planet-maps.mjs                 # every map (downloads what is not cached)
 *   node scripts/make-planet-maps.mjs moon_lroc       # one map
 *   node scripts/make-planet-maps.mjs --cache <dir>   # where the downloads are kept
 *
 * Needs the `vips` command (libvips). The sources are large GeoTIFFs (up to
 * 800 MB); they are cached in $LCARDS_MAP_CACHE or the system temp folder,
 * never in the repo. Every source here is public domain: NASA and USGS
 * imagery is not subject to copyright in the United States. Record any new
 * source and its licence here and in the image pack entry's description.
 */
import { existsSync, mkdirSync, writeFileSync, statSync, createWriteStream } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'src/assets/images');
const USGS = 'https://planetarymaps.usgs.gov/mosaic';

/** key → source (`out` is the file name under src/assets/images/) */
export const MAPS = {
  moon_lroc: {
    out: 'nasa-lroc-moon-2048.webp',
    url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_2k.tif',
    source: 'NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC colour, poles filled)'
  },
  mars_viking: {
    out: 'usgs-viking-mars-2048.webp',
    url: `${USGS}/Mars_Viking_ClrMosaic_global_925m.tif`,
    source: 'USGS Astrogeology, Mars Viking global colour mosaic 925 m (NASA Ames colour)'
  },
  mercury_messenger: {
    out: 'usgs-messenger-mercury-2048.webp',
    url: `${USGS}/Mercury_MESSENGER_MDIS_Basemap_MD3Color_Mosaic_Global_665m.tif`,
    source: 'USGS Astrogeology, Mercury MESSENGER MDIS basemap MD3 colour global mosaic 665 m'
  },
  venus_magellan: {
    out: 'usgs-magellan-venus-2048.webp',
    url: `${USGS}/Venus_Magellan_C3-MDIR_Colorized_Global_Mosaic_4641m.tif`,
    source: 'USGS Astrogeology, Venus Magellan C3-MDIR synthetic colour global mosaic 4641 m (radar, coloured to simulate the surface)'
  },
  jupiter_cassini: {
    out: 'nasa-cassini-jupiter-2048.webp',
    url: 'https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia07/pia07782/PIA07782.tif',
    source: 'NASA/JPL/Space Science Institute, PIA07782 Cassini cylindrical map of Jupiter (December 2000)'
  },
  pluto_new_horizons: {
    out: 'usgs-new-horizons-pluto-2048.webp',
    url: `${USGS}/Pluto_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif`,
    source: 'USGS Astrogeology / NASA New Horizons LORRI and MVIC global mosaic 300 m (July 2017); the far south was never seen',
    // the unseen south (no data, 0) as a flat grey instead of a black hole
    nodata: 70
  },
  // R4a (2026-10-30): the Sun and the moons of the accurate Sol starter
  sun_sdo: {
    out: 'nasa-sdo-stereo-sun-2048.webp',
    url: 'https://svs.gsfc.nasa.gov/vis/a030000/a030300/a030362/euvi_aia304_2012_carrington.tif',
    source: 'NASA Scientific Visualization Studio 30362, Full Map of the Sun\'s Surface: STEREO EUVI and SDO AIA 304 Å, Carrington coordinates (2012)',
    // Carrington longitude 0 is the left edge: half a turn puts it in the middle
    roll: 0.5
  },
  io_galileo: {
    out: 'usgs-galileo-io-2048.webp',
    url: `${USGS}/Io_GalileoSSI-Voyager_Global_Mosaic_ClrMerge_1km.tif`,
    source: 'USGS Astrogeology, Io Galileo SSI and Voyager global colour merge mosaic 1 km'
  },
  europa_galileo: {
    out: 'usgs-galileo-europa-2048.webp',
    url: `${USGS}/Europa_Voyager_GalileoSSI_global_mosaic_500m.tif`,
    source: 'USGS Astrogeology, Europa Voyager and Galileo SSI global mosaic 500 m',
    // the unseen polar patches (no data) in a grey near the surface's own
    nodata: 165
  },
  ganymede_galileo: {
    out: 'usgs-galileo-ganymede-2048.webp',
    url: `${USGS}/Ganymede_Voyager_GalileoSSI_Global_ClrMosaic_1435m.tif`,
    source: 'USGS Astrogeology, Ganymede Voyager and Galileo SSI global colour mosaic 1.4 km',
    // the unseen polar patches (no data) in a grey near the surface's own
    nodata: 105
  },
  callisto_galileo: {
    out: 'usgs-galileo-callisto-2048.webp',
    url: `${USGS}/Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif`,
    source: 'USGS Astrogeology, Callisto Voyager and Galileo SSI global mosaic 1 km',
    // the unseen polar patches (no data) in a grey near the surface's own
    nodata: 55
  },
  titan_cassini: {
    out: 'usgs-cassini-titan-2048.webp',
    url: `${USGS}/Titan_ISS_P19658_Mosaic_Global_4km.tif`,
    source: 'USGS Astrogeology, Titan Cassini ISS global mosaic 4 km (the surface at 938 nm, under the haze)'
  },
  triton_voyager: {
    out: 'usgs-voyager-triton-2048.webp',
    url: `${USGS}/Triton_Voyager2_ClrMosaic_GlobalFill_600m.tif`,
    source: 'USGS Astrogeology, Triton Voyager 2 global colour mosaic 600 m; most of the north was never seen',
    nodata: 150
  },
  ceres_dawn: {
    out: 'usgs-dawn-ceres-2048.webp',
    url: `${USGS}/Ceres_Dawn_FC_DLR_global_20ppd_Oct2015.tif`,
    source: 'USGS Astrogeology / NASA Dawn Framing Camera global mosaic 20 pixels per degree (October 2015)',
    nodata: 100
  },
  charon_new_horizons: {
    out: 'usgs-new-horizons-charon-2048.webp',
    url: `${USGS}/Charon_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif`,
    source: 'USGS Astrogeology / NASA New Horizons LORRI and MVIC global mosaic 300 m (July 2017); the far south was never seen',
    nodata: 70
  },
  phobos_viking: {
    out: 'usgs-viking-phobos-2048.webp',
    url: `${USGS}/Phobos_Viking_Mosaic_40ppd_DLRcontrol.tif`,
    source: 'USGS Astrogeology, Phobos Viking orbiter global mosaic 40 pixels per degree'
  }
};

/**
 * Saturn's rings from the planet's centre, km (published radii): [inner,
 * outer, opacity, brightness]. The texture runs from the D ring's inner
 * edge (left) to just past the F ring (right).
 */
export const SATURN_RINGS = {
  out: 'saturn-rings-profile.webp',
  inner: 66900,
  outer: 140600,
  bands: [
    [66900, 74510, 0.05, 0.55], // D ring
    [74658, 92000, 0.28, 0.62], // C ring
    [92000, 117580, 0.92, 1.0], // B ring
    [117580, 122170, 0.12, 0.6], // Cassini Division
    [122170, 133426, 0.7, 0.86], // A ring, inner
    [133752, 136488, 0.66, 0.84], // A ring, past the Encke gap, to the Keeler gap
    [136530, 136775, 0.55, 0.8], // A ring, outer edge
    [140130, 140230, 0.6, 0.9] // F ring
  ],
  /** ring material colour, sRGB 0..255 (pale tan) */
  tint: [214, 196, 168]
};

const W = 2048;
const H = 1024;

function vips(...args) {
  execFileSync('vips', args, { stdio: ['ignore', 'ignore', 'pipe'] });
}

async function download(url, file) {
  if (existsSync(file) && statSync(file).size > 0) return;
  console.log(`  downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`);
  if (/text\/html/.test(res.headers.get('content-type') ?? '')) throw new Error(`${url}: got a web page, not an image`);
  await pipeline(Readable.fromWeb(/** @type {any} */ (res.body)), createWriteStream(`${file}.part`));
  execFileSync('mv', [`${file}.part`, file]);
}

async function makeMap(key, cache) {
  const m = MAPS[key];
  const src = join(cache, `${key}.tif`);
  await download(m.url, src);
  const out = join(OUT, m.out);
  // force the exact 2:1 size (some sources are 3601 x 1801), sRGB
  if (m.roll !== undefined) {
    const small = join(cache, `${key}-small.v`);
    vips('thumbnail', src, small, String(W), '--height', String(H), '--size', 'force', '--export-profile', 'srgb');
    // 16-bit sources come down to 8
    const eight = join(cache, `${key}-8.v`);
    vips('cast', small, eight, 'uchar', '--shift');
    vips('wrap', eight, `${out}[Q=82,strip]`, '--x', String(Math.round(W * m.roll)), '--y', '0');
  } else if (m.nodata === undefined) {
    vips('thumbnail', src, `${out}[Q=82,strip]`, String(W), '--height', String(H), '--size', 'force', '--export-profile', 'srgb');
  } else {
    const small = join(cache, `${key}-small.v`);
    vips('thumbnail', src, small, String(W), '--height', String(H), '--size', 'force');
    // nearest-black pixels (the no-data area, softened by the resize) become the grey
    const mask = join(cache, `${key}-mask.v`);
    vips('relational_const', small, mask, 'less', '6');
    const grey = join(cache, `${key}-grey.v`);
    vips('linear', small, grey, '0', String(m.nodata), '--uchar');
    vips('ifthenelse', mask, grey, small, `${out}[Q=82,strip]`);
  }
  console.log(`  ${key} → src/assets/images/${m.out} (${Math.round(statSync(out).size / 1024)} KB)`);
}

function makeRings(cache) {
  const r = SATURN_RINGS;
  const w = 1024;
  const h = 4;
  const px = Buffer.alloc(w * h * 4);
  for (let x = 0; x < w; x++) {
    const km = r.inner + ((x + 0.5) / w) * (r.outer - r.inner);
    const band = r.bands.find(([a, b]) => km >= a && km < b);
    // fine ringlets: a fixed ripple so the bands are not flat
    const ripple = 0.88 + 0.12 * Math.sin(km / 137) * Math.sin(km / 911);
    const a = band ? band[2] * ripple : 0;
    const l = band ? band[3] * ripple : 0;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      px[i] = Math.round(r.tint[0] * l);
      px[i + 1] = Math.round(r.tint[1] * l);
      px[i + 2] = Math.round(r.tint[2] * l);
      px[i + 3] = Math.round(255 * Math.min(1, a));
    }
  }
  const raw = join(cache, 'saturn-rings.raw');
  writeFileSync(raw, px);
  const out = join(OUT, r.out);
  vips('rawload', raw, `${out}[Q=90,alpha_q=100,strip]`, String(w), String(h), '4');
  console.log(`  saturn_rings → src/assets/images/${r.out} (${Math.round(statSync(out).size / 1024)} KB)`);
}

async function main() {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--cache');
  const cache = ci >= 0 ? resolve(args.splice(ci, 2)[1]) : process.env.LCARDS_MAP_CACHE ?? join(tmpdir(), 'lcards-planet-maps');
  mkdirSync(cache, { recursive: true });
  const keys = args.length ? args : [...Object.keys(MAPS), 'saturn_rings'];
  for (const key of keys) {
    if (key === 'saturn_rings') makeRings(cache);
    else if (MAPS[key]) await makeMap(key, cache);
    else throw new Error(`unknown map '${key}' (${[...Object.keys(MAPS), 'saturn_rings'].join(', ')})`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
