/**
 * Shared by scripts/release-shots.mjs and scripts/dashboard-shots.mjs: scripted
 * steps on a Home Assistant page, and real-time screencast recording to WebM.
 *
 * Steps (in order): { click: selector } | { hover: selector } | { wait: ms }
 *   | { eval: 'js' } | { service: [domain, service, data] }
 *   | { type: [selector, text] } | { drag: [selector, from, to, ms] }
 *   | { goto: '/path' }  (dashboard-shots only cares that the page settles again)
 */
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

export async function runSteps(page, client, steps = []) {
    for (const step of steps) {
        if (step.click) await page.locator(step.click).first().dispatchEvent('click');
        else if (step.hover) await page.locator(step.hover).first().hover();
        else if (step.wait) await page.waitForTimeout(step.wait);
        else if (step.eval) await page.evaluate(step.eval);
        else if (step.service) await client.callService(...step.service);
        else if (step.type) await page.locator(step.type[0]).first().pressSequentially(step.type[1], { delay: 40 });
        else if (step.drag) {
            const [selector, from, to, ms = 1000] = step.drag;
            const box = await page.locator(selector).first().boundingBox();
            const y = box.y + box.height / 2;
            const frames = Math.max(2, Math.round(ms / 40));
            await page.mouse.move(box.x + box.width * from, y);
            await page.mouse.down();
            for (let i = 1; i <= frames; i++) {
                await page.mouse.move(box.x + box.width * (from + (to - from) * (i / frames)), y);
                await page.waitForTimeout(40);
            }
            await page.waitForTimeout(600);
            await page.mouse.up();
        }
        else if (step.goto) { await page.goto(step.goto); await page.waitForTimeout(step.settle ?? 3000); }
        else throw new Error(`unknown step ${JSON.stringify(step)}`);
    }
}


/**
 * Record the page in real time with the DevTools screencast while `during` runs.
 * Frames arrive only when the page changes; each keeps its timestamp.
 */
export async function recordScreencast(page, clip, during) {
    const cdp = await page.context().newCDPSession(page);
    const frames = [];
    cdp.on('Page.screencastFrame', (f) => {
        frames.push({ data: f.data, t: f.metadata.timestamp });
        cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
    const start = Date.now() / 1000;
    await during();
    await cdp.send('Page.stopScreencast');
    // A last frame at the end so the final state holds for its time.
    if (frames.length) frames.push({ data: frames.at(-1).data, t: Date.now() / 1000 });
    if (frames.length && frames[0].t > start) frames.unshift({ data: frames[0].data, t: start });
    return frames;
}

/** Frames (with timestamps) -> cropped VP9 WebM at their real timing. */
export function encodeFrames(frames, out, clip) {
    if (frames.length < 2) throw new Error('no screencast frames');
    const dir = join(tmpdir(), `lcards-frames-${process.pid}-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const list = [];
    frames.forEach((f, i) => {
        const file = join(dir, `${String(i).padStart(5, '0')}.png`);
        writeFileSync(file, Buffer.from(f.data, 'base64'));
        list.push(`file '${file}'`);
        if (i < frames.length - 1) list.push(`duration ${Math.max(0.001, frames[i + 1].t - f.t).toFixed(3)}`);
    });
    writeFileSync(join(dir, 'list.txt'), list.join('\n') + '\n');
    const crop = `crop=${clip.width - (clip.width % 2)}:${clip.height - (clip.height % 2)}:${clip.x}:${clip.y}`;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'),
        '-vf', `${crop},fps=30,scale='trunc(min(1600,iw)/2)*2':-2`,
        '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-pix_fmt', 'yuv420p', '-an', out]);
    rmSync(dir, { recursive: true, force: true });
}

/** A WebM's GIF twin (for GitHub, which plays GIFs but not WebM in markdown). */
export function webmToGif(webm, gif) {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', webm, '-vf',
        "fps=15,scale='min(800,iw)':-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
        gif]);
}
