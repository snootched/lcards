#!/usr/bin/env node
/**
 * release-notes.mjs - docs release pages <-> GitHub releases.
 *
 *   node scripts/release-notes.mjs export <version> [--out file]
 *       GitHub release body from doc/releases/<base version>.md (stdout or --out).
 *       Exit 2: no page. Exit 3: a stable version whose page is still status: testing.
 *   node scripts/release-notes.mjs check
 *       Validate every release page (frontmatter, images, no demo components).
 *   node scripts/release-notes.mjs import [--from <tag>] [--only <tag>] [--force]
 *       Backfill pages from the published GitHub releases (stable only). Downloads
 *       the attached images to doc/public/releases/<tag>/ as WebP (needs `magick`).
 *       Existing pages are skipped unless --force.
 *
 * See .github/instructions/releases.instructions.md.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import {
    ROOT, RELEASES_DIR, PUBLIC_DIR, REPO_URL, baseVersion, compareVersions,
    toGithubMarkdown, importGithubBody, checkReleases, splitFrontmatter,
} from './release-lib.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => {
    const i = rest.indexOf(`--${name}`);
    return i === -1 ? null : (rest[i + 1] ?? true);
};
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

function cmdExport() {
    const version = rest.find(a => !a.startsWith('--')) ?? pkg.version;
    const base = baseVersion(version);
    const file = join(RELEASES_DIR, `${base}.md`);
    if (!existsSync(file)) {
        console.error(`No release page doc/releases/${base}.md`);
        process.exit(2);
    }
    const page = readFileSync(file, 'utf8');
    const { data } = splitFrontmatter(page);
    if (version === base && data.status === 'testing') {
        console.error(`doc/releases/${base}.md is still status: testing; set status: released and date: before a stable release`);
        process.exit(3);
    }
    const md = toGithubMarkdown(page, { tag: base });
    const out = flag('out');
    if (typeof out === 'string') {
        writeFileSync(out, md);
        console.error(`Wrote ${out} from doc/releases/${base}.md`);
    } else {
        process.stdout.write(md);
    }
}

function cmdCheck() {
    const errors = checkReleases({ pkgVersion: pkg.version });
    if (errors.length) {
        console.error(`${errors.length} release page problem(s):\n`);
        for (const e of errors) console.error(`  ${e}`);
        process.exit(1);
    }
    console.log('Release pages OK.');
}

/**
 * Download one image. Stills become WebP (at most 1600px wide); animations become a
 * looping WebM (about a tenth of the GIF's size). Returns the site path written.
 */
function fetchImage(url, sitePath) {
    const tmp = join(tmpdir(), `lcards-release-${process.pid}-${Date.now()}`);
    execFileSync('curl', ['-sSfL', '-o', tmp, url]);
    try {
        const frames = execFileSync('magick', ['identify', tmp], { encoding: 'utf8' }).trim().split('\n').length;
        if (frames > 1) {
            const clip = sitePath.replace(/\.webp$/, '.webm');
            execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', tmp, '-vf', "scale='trunc(min(1600,iw)/2)*2':-2",
                '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-pix_fmt', 'yuv420p', '-an', join(PUBLIC_DIR, clip)]);
            return clip;
        }
        execFileSync('magick', [tmp, '-resize', '1600x>', '-quality', '82', join(PUBLIC_DIR, sitePath)]);
        return sitePath;
    } finally {
        rmSync(tmp, { force: true });
    }
}

async function cmdImport() {
    const from = flag('from');
    const only = flag('only');
    const force = !!flag('force');
    const res = await fetch(`https://api.github.com/repos/snootched/lcards/releases?per_page=100`, {
        headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const releases = (await res.json())
        .filter(r => !r.prerelease && !r.draft)
        .filter(r => typeof from !== 'string' || compareVersions(r.tag_name, from) >= 0)
        .filter(r => typeof only !== 'string' || r.tag_name === only)
        .sort((a, b) => compareVersions(a.tag_name, b.tag_name));

    mkdirSync(RELEASES_DIR, { recursive: true });
    for (let i = 0; i < releases.length; i++) {
        const r = releases[i];
        const tag = r.tag_name;
        const page = join(RELEASES_DIR, `${tag}.md`);
        if (existsSync(page) && !force) {
            console.log(`${tag}: page exists, skipped`);
            continue;
        }
        const { markdown, images, notes } = importGithubBody(r.body ?? '', { tag });
        const breaking = /breaking/i.test(r.body ?? '');
        const prev = releases[i - 1]?.tag_name;
        const front = [
            '---',
            `version: "${tag}"`,
            `date: ${r.published_at.slice(0, 10)}`,
            'status: released',
            'summary: "TODO"',
            `breaking: ${breaking}`,
            '---',
            '',
            `# LCARdS ${tag}`,
            '',
            '',
        ].join('\n');
        const tail = prev ? `\n---\n\nAll changes: [${prev}...${tag}](${REPO_URL}/compare/${prev}...${tag})\n` : '';
        let text = markdown;
        for (const img of images) {
            mkdirSync(join(PUBLIC_DIR, img.path, '..'), { recursive: true });
            const written = fetchImage(img.url, img.path);
            if (written !== img.path) {
                // An animation: a looping muted video instead of the <img>.
                text = text.replace(new RegExp(`<img class="release-shot" alt="([^"]*)" src="${img.path.replace(/[.]/g, '\\.')}" />`, 'g'),
                    (_, alt) => `<video class="release-shot" src="${written}" title="${alt}" autoplay loop muted playsinline></video>`);
            }
        }
        writeFileSync(page, front + text + tail);
        console.log(`${tag}: ${images.length} image(s)${breaking ? ', breaking?' : ''}${notes.length ? `; ${notes.join('; ')}` : ''}`);
    }
}

switch (cmd) {
    case 'export': cmdExport(); break;
    case 'check': cmdCheck(); break;
    case 'import': await cmdImport(); break;
    default:
        console.error('usage: release-notes.mjs export <version> [--out file] | check | import [--from tag] [--only tag] [--force]');
        process.exit(1);
}
