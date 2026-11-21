#!/usr/bin/env node
/**
 * marketing-video.mjs - the showcase video: an empty LCARS view builds itself, comes
 * alive with the home's sensors, then a red alert.
 *
 *   node scripts/marketing-video.mjs [--record] [--headed]
 *
 * --record first records the raw take on the dev HA (scripts/dashboard-shots.mjs on
 * doc/gallery/showcase/showcase.yaml with its motion file, 1920x1080, H.264), into
 * tmp/marketing/showcase.mp4 plus showcase.marks.json (the motion file's caption cues)
 * and showcase.webp (the finished view). Without it the last take is reused.
 *
 * Then cuts, with LCARS title, caption and end cards rendered in Chromium (Antonio
 * from the bundle) and put together by ffmpeg:
 *   doc/public/gallery/showcase.webm + .mp4 + .webp   docs hero: the take from the first stage, no captions
 *   tmp/marketing/showcase-social.mp4                  1080p: title, captioned take, end card
 *   tmp/marketing/showcase-release.mp4                 1280 wide: the captioned take
 *
 * The take reads real sensors of the dev HA and fakes every change (see the motion
 * file); tests/docs/showcase.test.js keeps it to the sensors it lists.
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { VIDEO_COLOUR } from './lib/shot-video.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const OUT = join(ROOT, 'tmp/marketing');
const GALLERY = join(ROOT, 'doc/public/gallery');
const TAKE = join(OUT, 'showcase.mp4');
const W = 1920, H = 1080;
const args = process.argv.slice(2);

mkdirSync(OUT, { recursive: true });

if (args.includes('--record')) {
    execFileSync('node', [join(ROOT, 'scripts/dashboard-shots.mjs'), join(ROOT, 'doc/gallery/showcase/showcase.yaml'),
        '--video', '--mp4', `--max-width=${W}`, `--size=${W}x${H}`,
        `--motion=${join(ROOT, 'doc/gallery/showcase/showcase.motion.yaml')}`, `--out=${OUT}`,
        ...(args.includes('--headed') ? ['--headed'] : [])], { stdio: 'inherit' });
}
if (!existsSync(TAKE)) {
    console.error('no take yet: run with --record (needs the dev HA, see scripts/dashboard-shots.mjs)');
    process.exit(2);
}
const marks = JSON.parse(readFileSync(join(OUT, 'showcase.marks.json'), 'utf8'));
const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', TAKE]).toString());

// ── Cards (title, end, captions) ────────────────────────────────────────────
// Inline: a page made with setContent() can't load file:// fonts.
const FONT = `data:font/woff2;base64,${readFileSync(join(ROOT, 'custom_components/lcards/fonts/antonio-variablefont_wght-webfont.woff2')).toString('base64')}`;
const BASE_CSS = `
@font-face { font-family: Antonio; src: url('${FONT}') format('woff2'); font-weight: 100 700; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; font-family: Antonio, sans-serif; text-transform: uppercase; }
`;
// LCARdS palette (GREEN_ALERT_PALETTE in src/core/themes/paletteInjector.js), as in the showcase dashboard.
const C = { gray: '#6d748c', grayDark: '#52596e', grayLight: '#9ea5ba', orange: '#ff6753', orangeLight: '#ff977b', blue: '#37a6d1', blueLight: '#93e1ff', moon: '#dfe1e8' };

/**
 * An LCARS elbow as one filled path: a sidebar of width `side` running into a bar of
 * height `bar`, with an outer corner radius `ro` and an inner one `ri`. `w` is the
 * bar's length from the left edge, `h` the sidebar's from the top. Drawn for the top
 * left; `flip` mirrors it for the bottom left.
 */
function elbow(x, y, { side, bar, ro, ri, w, h, color, flip = false }) {
    const d = `M ${x} ${y + h} L ${x} ${y + ro} A ${ro} ${ro} 0 0 1 ${x + ro} ${y} L ${x + w} ${y} L ${x + w} ${y + bar}`
        + ` L ${x + side + ri} ${y + bar} A ${ri} ${ri} 0 0 0 ${x + side} ${y + bar + ri} L ${x + side} ${y + h} Z`;
    return `<path d="${d}" fill="${color}"${flip ? ` transform="translate(0 ${2 * y}) scale(1 -1)"` : ''}/>`;
}

/** Bar segments from x0 to x1 at y (height hgt), split by gaps, the last with a round end cap. */
function bar(x0, x1, y, hgt, segs) {
    const gap = 10, fixed = segs.reduce((a, s) => a + (s.w ?? 0), 0), flex = segs.filter(s => !s.w).length;
    const free = x1 - x0 - fixed - gap * (segs.length - 1);
    let x = x0, out = '';
    segs.forEach((s, i) => {
        const w = s.w ?? free / flex;
        const last = i === segs.length - 1;
        out += last
            ? `<path d="M ${x} ${y} L ${x + w - hgt / 2} ${y} A ${hgt / 2} ${hgt / 2} 0 0 1 ${x + w - hgt / 2} ${y + hgt} L ${x} ${y + hgt} Z" fill="${s.c}"/>`
            : `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" fill="${s.c}"/>`;
        x += w + gap;
    });
    return out;
}

/** A full LCARS frame around a title: elbows top and bottom, a sidebar of labelled blocks. */
const frameCard = (title, sub, foot) => {
    const m = 44, side = 210, ri = 40, top = 34, bottom = 20;
    const topH = 190, botH = 150;                       // elbow lengths down / up the sidebar
    const elbowW = side + ri + 200;                     // elbow's bar length
    const sideTop = m + topH + 10, sideBot = H - m - botH - 10;
    const blocks = [{ h: 0.45, c: C.orange, t: '03-1701' }, { h: 1.7, c: C.gray, t: 'LCARDS' }, { h: 0.22, c: C.blueLight, t: '' }, { h: 0.9, c: C.grayLight, t: '47-B' }];
    const unit = (sideBot - sideTop - 10 * (blocks.length - 1)) / blocks.reduce((a, b) => a + b.h, 0);
    let y = sideTop, side_svg = '';
    for (const b of blocks) {
        const hgt = b.h * unit;
        side_svg += `<rect x="${m}" y="${y}" width="${side}" height="${hgt}" fill="${b.c}"/>`;
        if (b.t) side_svg += `<text x="${m + side - 14}" y="${y + hgt - 14}" text-anchor="end" class="lbl">${b.t}</text>`;
        y += hgt + 10;
    }
    const barX = m + elbowW + 10, barEnd = W - m;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${elbow(m, m, { side, bar: top, ro: 100, ri, w: elbowW, h: topH, color: C.gray })}
      ${bar(barX, barEnd, m, top, [{ w: 120, c: C.orange }, { w: 460, c: C.grayLight }, { w: 70, c: C.blueLight }, { c: C.gray }])}
      ${side_svg}
      ${elbow(m, H - m, { side, bar: bottom, ro: 80, ri: 28, w: elbowW, h: botH, color: C.gray, flip: true })}
      ${bar(barX, barEnd, H - m - bottom, bottom, [{ w: 260, c: C.grayLight }, { w: 90, c: C.orange }, { c: C.gray }])}
    </svg>`;
    return `<style>${BASE_CSS}
body { background: #000; position: relative; }
svg { position: absolute; inset: 0; }
.lbl { font-family: Antonio; font-size: 20px; fill: #000; letter-spacing: 1px; }
.text { position: absolute; left: ${m + side + ri + 90}px; right: 90px; top: 50%; transform: translateY(-50%); }
h1 { font-size: 220px; line-height: 0.95; color: ${C.orange}; letter-spacing: 4px; text-transform: none; font-weight: 500; }
h2 { font-size: 66px; color: ${C.moon}; margin-top: 18px; letter-spacing: 3px; font-weight: 400; }
p { font-size: 40px; color: ${C.blueLight}; margin-top: 34px; letter-spacing: 2px; text-transform: none; font-weight: 400; }
</style>${svg}<div class="text"><h1>${title}</h1><h2>${sub}</h2>${foot ? `<p>${foot}</p>` : ''}</div>`;
};
/** A caption: an LCARS pill label (end caps, amber bar) on a transparent background. */
const captionCard = (text) => `<style>${BASE_CSS}
body { background: transparent; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 130px; }
.cap { display: flex; align-items: stretch; gap: 8px; height: 76px; filter: drop-shadow(0 0 18px #000); }
.cap .end { width: 40px; background: #ff9966; }
.cap .end.l { border-radius: 38px 0 0 38px; } .cap .end.r { border-radius: 0 38px 38px 0; }
.cap .t { background: #000; color: #ffcc66; font-size: 52px; line-height: 76px; padding: 0 30px; letter-spacing: 3px; }
</style>
<div class="cap"><div class="end l"></div><div class="t">${text}</div><div class="end r"></div></div>`;

const browser = await chromium.launch({
    headless: !args.includes('--headed'),
    executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
async function shot(html, file, transparent = false) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: file, omitBackground: transparent });
    return file;
}
const work = join(OUT, 'cards');
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
const titlePng = await shot(frameCard('LCARdS', 'LCARS Card System for Home Assistant'), join(work, 'title.png'));
const endPng = await shot(frameCard('LCARdS', 'Get it from the Home Assistant Marketplace', 'lcards.unimatrix01.ca'), join(work, 'end.png'));
const captions = [];
for (const [i, m] of marks.entries()) {
    const start = m.t / 1000;
    const end = (marks[i + 1]?.t ?? duration * 1000) / 1000 - 0.15;
    if (end - start < 0.6) continue;
    captions.push({ file: await shot(captionCard(m.label), join(work, `cap-${i}.png`), true), start, end });
}
await browser.close();

// ── Cuts ────────────────────────────────────────────────────────────────────
const ff = (...a) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
const H264 = ['-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', ...VIDEO_COLOUR, '-movflags', '+faststart', '-an'];
/** Scale to a width in standard range (a take recorded before the range fix is full range). */
const TV = (w) => `scale=${w}:-2:out_range=tv:out_color_matrix=bt709,format=yuv420p`;
const FIT = `scale=${W}:${H}:force_original_aspect_ratio=decrease:out_range=tv:out_color_matrix=bt709,format=yuv420p,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,fps=30,setsar=1`;

/** The take at 1920x1080 with the captions faded in and out at their cues. */
function captioned(out) {
    const inputs = ['-i', TAKE];
    const chain = [`[0:v]${FIT}[v0]`];
    captions.forEach((c, i) => {
        inputs.push('-loop', '1', '-t', String(c.end - c.start), '-i', c.file);
        chain.push(`[${i + 1}:v]format=rgba,fade=in:st=0:d=0.3:alpha=1,fade=out:st=${Math.max(0, c.end - c.start - 0.3)}:d=0.3:alpha=1,setpts=PTS+${c.start}/TB[c${i}]`);
        chain.push(`[v${i}][c${i}]overlay=0:0:eof_action=pass[v${i + 1}]`);
    });
    ff(...inputs, '-filter_complex', chain.join(';'), '-map', `[v${captions.length}]`, ...H264, out);
}

const captionedTake = join(OUT, 'showcase-captioned.mp4');
captioned(captionedTake);

// Social: title (3 s), the captioned take, end card (4 s), crossfaded.
const still = (png, seconds, out) => ff('-loop', '1', '-t', String(seconds), '-i', png, '-vf', `${FIT},format=yuv420p`, ...H264, out);
const titleMp4 = join(work, 'title.mp4');
const endMp4 = join(work, 'end.mp4');
still(titlePng, 3, titleMp4);
still(endPng, 4, endMp4);
const fade = 0.5;
ff('-i', titleMp4, '-i', captionedTake, '-i', endMp4, '-filter_complex',
    `[0:v][1:v]xfade=transition=fade:duration=${fade}:offset=${3 - fade}[a];` +
    `[a][2:v]xfade=transition=fade:duration=${fade}:offset=${3 + duration - 2 * fade}[v]`,
    '-map', '[v]', ...H264, join(OUT, 'showcase-social.mp4'));

// Release notes: the captioned take, 1280 wide.
ff('-i', captionedTake, '-vf', TV(1280), ...H264.map(a => (a === '18' ? '22' : a)), join(OUT, 'showcase-release.mp4'));

// Docs hero: the take without captions (VP9 for the site, H.264 for everything else),
// from just before the frame slides in (the empty view is only worth its caption).
const heroStart = Math.max(0, (marks[1]?.t ?? 0) / 1000 - 0.3).toFixed(2);
ff('-ss', heroStart, '-i', TAKE, '-vf', TV(1600), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-pix_fmt', 'yuv420p', ...VIDEO_COLOUR, '-an', join(GALLERY, 'showcase.webm'));
ff('-ss', heroStart, '-i', TAKE, '-vf', TV(1600), ...H264.map(a => (a === '18' ? '24' : a)), join(GALLERY, 'showcase.mp4'));
execFileSync('magick', [join(OUT, 'showcase.webp'), '-resize', '1600x>', '-quality', '85', join(GALLERY, 'showcase.webp')]);

for (const f of ['tmp/marketing/showcase-social.mp4', 'tmp/marketing/showcase-release.mp4', 'doc/public/gallery/showcase.webm', 'doc/public/gallery/showcase.mp4', 'doc/public/gallery/showcase.webp']) {
    const size = Number(execFileSync('stat', ['-c', '%s', join(ROOT, f)]).toString());
    console.log(`${f}  ${(size / 1024 / 1024).toFixed(1)} MB`);
}
rmSync(captionedTake, { force: true });
