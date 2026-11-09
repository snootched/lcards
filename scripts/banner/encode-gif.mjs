#!/usr/bin/env node
/**
 * Encode a render.mjs --capture frame set as a looping GIF (B1 banner).
 *
 *   node scripts/banner/encode-gif.mjs <framesDir> <out.gif|out.mp4> [--fps 15] [--crossfade 1000] [--colors 256] [--start ms] [--end ms]
 *
 * An .mp4 out gets the same frames, crop and crossfade, as H.264 (yuv420p, faststart)
 * for the docs site's autoplaying <video>.
 *
 * The frames keep their real display times (ffconcat durations), are cropped to
 * the banner box and resampled to --fps. --crossfade blends the last N ms into the
 * first N ms so a scene with no natural loop point repeats without a jump. One
 * palette for the whole clip (palettegen stats_mode=diff), Bayer dithering.
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args.splice(i, 2)[1] : def; };
const fps = Number(opt('fps', '15'));
const crossfade = Number(opt('crossfade', '0'));
const colors = Number(opt('colors', '256'));
const startMs = Number(opt('start', '0'));
const endOpt = opt('end', '');
const [dir, out] = args;
if (!dir || !out) { console.error('usage: encode-gif.mjs <framesDir> <out.gif> [--fps 15] [--crossfade ms] [--colors 256] [--start ms] [--end ms]'); process.exit(1); }

const box = JSON.parse(readFileSync(join(dir, 'box.json'), 'utf8'));
const frames = readFileSync(join(dir, 'frames.txt'), 'utf8').trim().split('\n').map((l) => { const [f, t] = l.split(' '); return { f, t: Number(t) }; });
const endMs = endOpt ? Number(endOpt) : box.duration;
const kept = frames.filter((x) => x.t >= startMs && x.t <= endMs);
// ffconcat with each frame shown until the next one
let concat = 'ffconcat version 1.0\n';
kept.forEach((x, i) => {
    const next = kept[i + 1]?.t ?? endMs;
    concat += `file '${x.f}'\nduration ${Math.max(1, next - x.t) / 1000}\n`;
});
concat += `file '${kept.at(-1).f}'\n`;
writeFileSync(join(dir, 'list.ffconcat'), concat);

const crop = `crop=${Math.round(box.width)}:${Math.round(box.height)}:${Math.round(box.x)}:${Math.round(box.y)}`;
const len = (endMs - startMs) / 1000;
let filter;
if (crossfade > 0) {
    // the clip minus its last N ms, with those N ms faded in over its start
    const x = crossfade / 1000;
    filter = `[0:v]${crop},fps=${fps},split[a][b];[a]trim=0:${len - x},setpts=PTS-STARTPTS[main];[b]trim=${len - x}:${len},setpts=PTS-STARTPTS[tail];`
        + `[main]split[m1][m2];[m1]trim=0:${x},setpts=PTS-STARTPTS[head];[m2]trim=${x},setpts=PTS-STARTPTS[rest];`
        + `[tail][head]xfade=transition=fade:duration=${x}:offset=0[blend];[blend][rest]concat=n=2:v=1[v];`;
} else {
    filter = `[0:v]${crop},fps=${fps}[v];`;
}
const input = ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.ffconcat')];
if (out.endsWith('.mp4')) {
    filter += '[v]format=yuv420p[o]';
    execFileSync('ffmpeg', [...input, '-filter_complex', filter, '-map', '[o]', '-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-movflags', '+faststart', out], { stdio: 'inherit' });
} else {
    filter += `[v]split[p1][p2];[p1]palettegen=max_colors=${colors}:stats_mode=diff[pal];[p2][pal]paletteuse=dither=${process.env.GIF_DITHER ?? 'bayer:bayer_scale=4'}:diff_mode=rectangle`;
    execFileSync('ffmpeg', [...input, '-filter_complex', filter, '-loop', '0', out], { stdio: 'inherit' });
}
console.log(`${out}: ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB`);
