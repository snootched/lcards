#!/usr/bin/env node
/**
 * hero-video.mjs - the docs home page hero: a fast tour of the gallery's sample
 * screens (3D ship, red alert, palette shift, ship display, classic and Picard eras),
 * cut together with short left wipes that loop back into the first frame.
 *
 *   node scripts/hero-video.mjs [--record | --record-missing]
 *
 * --record first records each gallery dashboard below with its own motion file
 * (doc/gallery/motion/<name>.yaml) on the dev Home Assistant, as high-quality H.264
 * into tmp/hero/ (scripts/dashboard-shots.mjs --video --mp4; needs the dev HA, its
 * token and a current npm run build). While it records, the token user's profile theme is
 * set to the gallery's (THEME) and put back afterwards. --record-missing records only the dashboards
 * without a take yet. Without either the last takes are reused.
 *
 * Then cuts SEGMENTS from the takes and encodes once:
 *   doc/public/gallery/hero.webm   VP9 for the site
 *   doc/public/gallery/hero.mp4    H.264 for browsers without VP9 (Safari)
 *   doc/public/gallery/hero.webp   the poster (the first segment's opening frame)
 * Change the cut by editing SEGMENTS (start and length in seconds of each take).
 */
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { VIDEO_COLOUR } from './lib/shot-video.mjs';
import { HAClient, readToken } from '../tests/ha/ha-client.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const TAKES = join(ROOT, 'tmp/hero');
const GALLERY = join(ROOT, 'doc/public/gallery');
const W = 1600, H = 960, FPS = 30;
const WIPE = 0.35; // seconds
/** The theme the gallery stills were shot in; samples coloured by theme roles (sciences) follow it. */
const THEME = { theme: 'LCARS Picard [LCARdS Blue Accent]', dark: true };

/** The tour, in order: a gallery dashboard, where its take starts, and how long it shows. */
const SEGMENTS = [
    { name: 'picard-operations', start: 0.0, length: 6.0 },  // 3D Enterprise, then the tactical plot
    { name: 'sciences', start: 1.0, length: 3.5 },           // charts, radial gauges, sensor log
    { name: 'alert', start: 2.0, length: 5.0 },              // red alert drops over the screen
    { name: 'picard-split', start: 0.5, length: 3.5 },       // Picard split screen with a ship display
    { name: 'security', start: 2.0, length: 4.0 },           // palette shift and static
    { name: 'classic-data', start: 0.5, length: 3.5 },       // classic long range scan
    { name: 'engineering', start: 1.0, length: 3.5 },        // ship display, lines change colour
    { name: 'classic-console', start: 0.5, length: 3.5 },    // classic TNG console
    { name: 'picard-display', start: 0.0, length: 3.5 },     // Picard ship profile
];

const ff = (...a) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });

const recordAll = process.argv.includes('--record');
const recordMissing = process.argv.includes('--record-missing');
if (recordAll || recordMissing) {
    mkdirSync(TAKES, { recursive: true });
    const names = [...new Set(SEGMENTS.map((s) => s.name))]
        .filter((n) => recordAll || !existsSync(join(TAKES, `${n}.mp4`)));
    if (names.length) {
        // The recorder's browser uses the token user's profile theme: switch it to the
        // gallery's for the takes, and always put the user's own back
        const client = await HAClient.connect(readToken());
        const own = (await client.call({ type: 'frontend/get_user_data', key: 'theme' }))?.value ?? null;
        await client.call({ type: 'frontend/set_user_data', key: 'theme', value: THEME });
        try {
            execFileSync('node', [join(ROOT, 'scripts/dashboard-shots.mjs'),
                ...names.map((n) => join(ROOT, `doc/gallery/dashboards/${n}.yaml`)),
                '--video', '--mp4', `--max-width=${W}`, `--out=${TAKES}`], { stdio: 'inherit' });
        } finally {
            await client.call({ type: 'frontend/set_user_data', key: 'theme', value: own });
            client.close?.();
        }
    }
}
for (const s of SEGMENTS) {
    if (!existsSync(join(TAKES, `${s.name}.mp4`))) {
        console.error(`no take for ${s.name}: run with --record (needs the dev Home Assistant)`);
        process.exit(2);
    }
}

// Every segment at the same size and rate, then chained with left wipes; the last
// wipe goes into the first segment's opening frame, so the loop has no jump.
const FIT = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,fps=${FPS},setsar=1,format=yuv420p`;
const inputs = [];
const filters = [];
SEGMENTS.forEach((s, i) => {
    inputs.push('-ss', String(s.start), '-t', String(s.length), '-i', join(TAKES, `${s.name}.mp4`));
    filters.push(`[${i}:v]${FIT},setpts=PTS-STARTPTS[s${i}]`);
});
// the loop tail: the first segment's opening, for the wipe back to the start
inputs.push('-ss', String(SEGMENTS[0].start), '-t', String(WIPE + 0.1), '-i', join(TAKES, `${SEGMENTS[0].name}.mp4`));
filters.push(`[${SEGMENTS.length}:v]${FIT},setpts=PTS-STARTPTS[tail]`);

const parts = [...SEGMENTS.map((_, i) => `s${i}`), 'tail'];
const lengths = [...SEGMENTS.map((s) => s.length), WIPE + 0.1];
let prev = parts[0];
let offset = 0;
for (let i = 1; i < parts.length; i++) {
    offset += lengths[i - 1] - WIPE;
    const out = i === parts.length - 1 ? 'tour' : `x${i}`;
    filters.push(`[${prev}][${parts[i]}]xfade=transition=wipeleft:duration=${WIPE}:offset=${offset.toFixed(3)}[${out}]`);
    prev = out;
}
// end on the frame the video starts with: drop the tail's extra 0.1 s
const total = offset + WIPE;
filters.push(`[tour]trim=duration=${total.toFixed(3)},setpts=PTS-STARTPTS,scale=out_range=tv:out_color_matrix=bt709[out]`);

const graph = filters.join(';');
ff(...inputs, '-filter_complex', graph, '-map', '[out]',
    '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1', '-cpu-used', '2', '-pix_fmt', 'yuv420p', ...VIDEO_COLOUR, '-an',
    join(GALLERY, 'hero.webm'));
ff(...inputs, '-filter_complex', graph, '-map', '[out]',
    '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', ...VIDEO_COLOUR, '-movflags', '+faststart', '-an',
    join(GALLERY, 'hero.mp4'));
// the poster: the opening frame
ff('-ss', String(SEGMENTS[0].start), '-i', join(TAKES, `${SEGMENTS[0].name}.mp4`), '-frames:v', '1',
    '-vf', `scale=${W}:-2`, '-quality', '85', join(GALLERY, 'hero.webp'));

for (const f of ['hero.webm', 'hero.mp4', 'hero.webp']) {
    const size = Number(execFileSync('stat', ['-c', '%s', join(GALLERY, f)]).toString());
    console.log(`doc/public/gallery/${f}  ${(size / 1024 / 1024).toFixed(2)} MB`);
}
console.log(`${total.toFixed(1)} s, ${SEGMENTS.length} segments`);
