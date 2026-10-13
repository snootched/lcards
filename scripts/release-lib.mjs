/**
 * release-lib.mjs - shared helpers for the docs Releases section.
 *
 * A release page is doc/releases/<tag>.md (file name = git tag) with frontmatter
 * (version, date, status, summary, breaking). The docs site reads the list from here
 * (sidebar, index, home hero), scripts/release-notes.mjs turns a page into the GitHub
 * release body, and tests/docs/releases.test.js runs checkReleases().
 *
 * Pure apart from the fs helpers at the bottom; no VitePress imports.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Overridable so tests can run the CLI against fixture pages.
export const RELEASES_DIR = process.env.LCARDS_RELEASES_DIR ?? join(ROOT, 'doc', 'releases');
export const PUBLIC_DIR = process.env.LCARDS_PUBLIC_DIR ?? join(ROOT, 'doc', 'public');
export const SITE_URL = 'https://lcards.unimatrix01.ca';
export const REPO_URL = 'https://github.com/snootched/lcards';

const STATUSES = new Set(['released', 'testing']);
const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;

// ── Versions ────────────────────────────────────────────────────────────────

/** '2026.10.0-dev.3' -> '2026.10.0' */
export function baseVersion(version) {
    return String(version).replace(/-.*$/, '');
}

/** Numeric segments of a tag's base, for sorting mixed shapes (2026.04.6.1, 2026.08.0). */
export function versionKey(version) {
    return baseVersion(version).split('.').map(n => Number.parseInt(n, 10) || 0);
}

/** Negative when a sorts before b (older first). */
export function compareVersions(a, b) {
    const ka = versionKey(a), kb = versionKey(b);
    for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
        const d = (ka[i] ?? -1) - (kb[i] ?? -1);
        if (d) return d;
    }
    return 0;
}

// ── Frontmatter ─────────────────────────────────────────────────────────────

/** Split `---\n...\n---` frontmatter from a page. Plain scalars stay strings (JSON schema). */
export function splitFrontmatter(text) {
    const src = text.replace(/\r\n/g, '\n');
    const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
    if (!m) return { data: {}, body: src };
    return { data: yaml.load(m[1], { schema: yaml.JSON_SCHEMA }) ?? {}, body: src.slice(m[0].length) };
}

/** Site link of a release page ('/releases/2026.09.0'). */
export function releaseLink(tag) {
    return `/releases/${tag}`;
}

/**
 * Sort releases for display: the in-testing page first, then released ones newest first.
 * @param {Array<{version: string, status?: string}>} list
 */
export function sortReleases(list) {
    return [...list].sort((a, b) => {
        const ta = a.status === 'testing' ? 1 : 0, tb = b.status === 'testing' ? 1 : 0;
        return (tb - ta) || compareVersions(b.version, a.version);
    });
}

// ── Code-aware text mapping ─────────────────────────────────────────────────

/**
 * Apply fn to every prose segment of markdown, skipping fenced code blocks and
 * inline code spans. fn receives the text and returns its replacement.
 * Fence opening lines are passed to onFence(line) when given (to rewrite info strings).
 */
export function mapProse(markdown, fn, onFence = null) {
    const out = [];
    let fence = null;
    for (const line of markdown.split('\n')) {
        const f = FENCE.exec(line);
        if (fence) {
            out.push(line);
            if (f && f[2][0] === fence[0] && f[2].length >= fence.length && !f[3].trim()) fence = null;
            continue;
        }
        if (f) {
            fence = f[2];
            out.push(onFence ? onFence(line, f[3].trim()) : line);
            continue;
        }
        out.push(line.split(/(`+[^`]*`+)/).map((part, i) => (i % 2 ? part : fn(part))).join(''));
    }
    return out.join('\n');
}

// ── Docs page -> GitHub markdown ────────────────────────────────────────────

/** Site-relative path to its published URL ('/core/actions#x' -> '.../core/actions.html#x'). */
export function absoluteSiteUrl(path) {
    const [p, hash] = path.split('#');
    let page = p.replace(/\.md$/, '');
    // Release pages end in a version ('/releases/2026.09.0'), so only real asset extensions count as files.
    if (!page.endsWith('/') && !ASSET_EXT.test(page)) page += '.html';
    return SITE_URL + page + (hash !== undefined ? `#${hash}` : '');
}

const ASSET_EXT = /\.(html|webp|png|jpe?g|gif|svg|webm|mp4|json|xml|txt|zip|pdf)$/i;

const CONTAINER_ALERT = { tip: 'TIP', info: 'NOTE', note: 'NOTE', warning: 'WARNING', danger: 'CAUTION', important: 'IMPORTANT' };

/**
 * Turn a release page into the GitHub release body.
 * @param {string} page full page text (frontmatter included)
 * @param {{ tag?: string, fileExists?: (sitePath: string) => boolean }} [opts]
 */
export function toGithubMarkdown(page, opts = {}) {
    const { data, body } = splitFrontmatter(page);
    const tag = opts.tag ?? String(data.version);
    const fileExists = opts.fileExists ?? (p => existsSync(join(PUBLIC_DIR, p)));
    const lines = body.split('\n');

    // Drop the page title (GitHub shows the release name) and leading blank lines.
    const h1 = lines.findIndex(l => /^#\s/.test(l));
    if (h1 !== -1 && lines.slice(0, h1).every(l => !l.trim())) lines.splice(0, h1 + 1);
    while (lines.length && !lines[0].trim()) lines.shift();

    // ::: containers -> GitHub alerts / <details>.
    const out = [];
    let container = null;
    let fence = null;
    for (const line of lines) {
        const f = FENCE.exec(line);
        if (!fence && f) fence = f[2];
        else if (fence && f && f[2][0] === fence[0] && !f[3].trim()) {
            out.push(container?.kind === 'alert' ? `> ${line}` : line);
            fence = null;
            continue;
        }
        if (!fence) {
            const open = /^:::\s*(\w+)\s*(.*)$/.exec(line);
            if (open && !container) {
                const type = open[1].toLowerCase();
                if (type === 'details') {
                    container = { kind: 'details' };
                    out.push('<details>', `<summary>${open[2] || 'Details'}</summary>`, '');
                } else {
                    container = { kind: 'alert' };
                    out.push(`> [!${CONTAINER_ALERT[type] ?? 'NOTE'}]`);
                    if (open[2]) out.push(`> **${open[2]}**`, '>');
                }
                continue;
            }
            if (/^:::\s*$/.test(line) && container) {
                if (container.kind === 'details') out.push('', '</details>');
                container = null;
                continue;
            }
        }
        out.push(container?.kind === 'alert' ? (line ? `> ${line}` : '>') : line);
    }
    let md = out.join('\n');

    md = mapProse(md, (text) => text
        // <video src="/releases/v/x.webm"> -> GIF twin if there is one, else a link.
        .replace(/<video\b[^>]*\bsrc="([^"]+)"[^>]*>(?:\s*<\/video>)?/g, (tag, src) => {
            const gif = src.replace(/\.(webm|mp4)$/, '.gif');
            const alt = /\btitle="([^"]*)"/.exec(tag)?.[1] ?? '';
            if (src.startsWith('/') && gif !== src && fileExists(gif)) return `<img src="${absoluteSiteUrl(gif)}" alt="${alt}" />`;
            return `[Watch the clip](${src.startsWith('/') ? absoluteSiteUrl(src) : src})`;
        })
        // Site-relative links and images -> absolute.
        .replace(/(\]\(|\b(?:src|href)=")(\/(?!\/)[^)"\s]*)/g, (_, pre, path) => pre + absoluteSiteUrl(path))
        // Linked handles and issue/PR numbers back to GitHub's own short forms.
        .replace(/\[@([\w-]+)\]\(https:\/\/github\.com\/\1\)/g, '@$1')
        .replace(/\[#(\d+)\]\(https:\/\/github\.com\/snootched\/lcards\/(?:issues|pull)\/\1\)/g, '#$1'),
    (line, info) => line.replace(info, info.split(/\s+/)[0] ?? ''));

    const parts = [];
    if (data.status === 'testing') {
        parts.push('> [!NOTE]',
            `> Dev build of the upcoming LCARdS ${baseVersion(tag)}. These notes grow with each dev build; the final notes ship with the stable release.`,
            '');
    }
    parts.push(md.trimEnd(), '', '---', '', `Read these notes on the docs site: ${absoluteSiteUrl(releaseLink(baseVersion(tag)))}`, '');
    return parts.join('\n');
}

// ── GitHub release body -> docs page (backfill import) ──────────────────────

const KNOWN_HTML = new Set(['img', 'details', 'summary', 'br', 'p', 'a', 'sub', 'sup', 'kbd', 'b', 'i', 'em', 'strong',
    'code', 'pre', 'video', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'hr', 'h1', 'h2',
    'h3', 'h4', 'blockquote', 'picture', 'source']);

function slugify(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

/**
 * Convert a GitHub release body into a docs page body (no frontmatter).
 * Returns the markdown plus the images to download and a review list.
 * @param {string} body
 * @param {{ tag: string }} opts
 */
export function importGithubBody(body, { tag }) {
    const images = [];
    const notes = [];
    const used = new Set();
    let dashes = 0;

    const imageFor = (url, alt) => {
        const existing = images.find(i => i.url === url);
        if (existing) return existing.path;
        let base = slugify(alt);
        if (!base || base === 'image' || /^screencast|^screenshot/.test(base)) base = `image-${images.length + 1}`;
        let name = base;
        for (let n = 2; used.has(name); n++) name = `${base}-${n}`;
        used.add(name);
        const path = `/releases/${tag}/${name}.webp`;
        images.push({ url, path, alt });
        return path;
    };

    let md = body.replace(/\r\n/g, '\n');
    // GitHub's compare link is derived by the docs page, so drop it (and a dangling rule above it).
    md = md.replace(/(\n-{3,}\s*)?\n*\*\*Full Changelog\*\*:[^\n]*\n*$/, '\n');
    // A heading that only repeats the release name.
    md = md.replace(/^#{1,3}\s*(?:LCARdS\s+)?v?\d{4}\.[\d.]+\s*\n+/, '');

    md = mapProse(md, (text) => {
        let t = text;
        // Images: <img ... src="user-attachments"> and ![alt](user-attachments).
        t = t.replace(/<img\b([^>]*?)\/?>/g, (tagText, attrs) => {
            const src = /\bsrc="([^"]+)"/.exec(attrs)?.[1];
            if (!src) return tagText;
            const alt = /\balt="([^"]*)"/.exec(attrs)?.[1] ?? '';
            const path = /github\.com\/user-attachments\/assets\//.test(src) ? imageFor(src, alt) : src;
            return `<img class="release-shot" alt="${alt}" src="${path}" />`;
        });
        t = t.replace(/!\[([^\]]*)\]\((https:\/\/github\.com\/user-attachments\/assets\/[^)\s]+)\)/g,
            (_, alt, url) => `<img class="release-shot" alt="${alt}" src="${imageFor(url, alt)}" />`);
        // Own docs site: absolute -> site-relative so the anchor checker sees them.
        t = t.replace(/https?:\/\/lcards\.unimatrix01\.ca(\/[^)\s"]*)/g, (_, p) => p.replace(/\.html(?=#|$)/, ''));
        // Bare GitHub issue/PR/discussion URLs -> short links.
        t = t.replace(/(?<!\]\(|["=])https:\/\/github\.com\/snootched\/lcards\/(issues|pull|discussions)\/(\d+)\b/g,
            (_, kind, n) => `[${kind === 'discussions' ? 'discussion ' : ''}#${n}](${REPO_URL}/${kind}/${n})`);
        // Bare #123 references -> issue links (GitHub resolves issues and PRs from /issues/).
        t = t.replace(/(^|[\s(])#(\d{2,4})\b(?!\])/g, (_, pre, n) => `${pre}[#${n}](${REPO_URL}/issues/${n})`);
        // @handles -> profile links.
        t = t.replace(/(^|[\s(])@([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\b/g, (_, pre, h) => `${pre}[@${h}](https://github.com/${h})`);
        // Em dashes: the first in a line reads as a label separator (colon), later ones as commas.
        t = t.split('\n').map((line) => {
            let first = true;
            return line.replace(/\s*\u2014\s*/g, () => {
                dashes++;
                const r = first ? ': ' : ', ';
                first = false;
                return r;
            });
        }).join('\n');
        // Stray tags Vue would try to compile (e.g. <ha-button> in prose).
        t = t.replace(/<(\/?)([A-Za-z][\w-]*)/g, (m, slash, name) => (KNOWN_HTML.has(name.toLowerCase()) ? m : `&lt;${slash}${name}`));
        return t;
    }, (line, info) => (/^ya?ml\b/.test(info) && !/\bno-validate\b/.test(info) ? line.replace(info, `${info} no-validate`) : line));

    // The page title is the h1, so section headings start at h2.
    md = mapProse(md, t => t.replace(/^# /gm, '## '));
    // VitePress draws a rule above every h2, so a --- right before one doubles it.
    md = md.replace(/\n-{3,}\n+(?=## )/g, '\n');
    md = hardBreaks(md);
    if (!md.trim()) md = 'A maintenance release with no written notes; see the full list of changes on GitHub.';
    md = md.replace(/\n{3,}/g, '\n\n').trim() + '\n';

    if (dashes) notes.push(`${dashes} em dash(es) replaced by rule: reread those lines`);
    if (!md.trim()) notes.push('empty body');
    return { markdown: md, images, notes };
}

/**
 * GitHub release bodies render a single line break as a break; VitePress joins the
 * lines into one paragraph. Mark those breaks explicitly (trailing backslash).
 */
export function hardBreaks(md) {
    const lines = md.split('\n');
    const isBlock = l => !l.trim() || /^\s*([-*+]\s|\d+[.)]\s|#|>|\||<|:::|`{3}|~{3}|-{3,}\s*$|={3,}\s*$)/.test(l);
    let fence = null;
    for (let i = 0; i < lines.length - 1; i++) {
        const f = FENCE.exec(lines[i]);
        if (fence) { if (f && f[2][0] === fence[0] && !f[3].trim()) fence = null; continue; }
        if (f) { fence = f[2]; continue; }
        const line = lines[i], next = lines[i + 1];
        if (!line.trim() || /^\s*(#|\||<|:::)/.test(line) || /\\$|\s{2}$/.test(line)) continue;
        if (isBlock(next) || /^\s/.test(next)) continue;
        lines[i] = line + '\\';
    }
    return lines.join('\n');
}

// ── fs helpers ──────────────────────────────────────────────────────────────

/** Every release page under dir (index.md excluded), with frontmatter, sorted for display. */
export function listReleases(dir = RELEASES_DIR) {
    if (!existsSync(dir)) return [];
    const list = readdirSync(dir)
        .filter(f => f.endsWith('.md') && f !== 'index.md')
        .map((file) => {
            const tag = file.slice(0, -3);
            const { data } = splitFrontmatter(readFileSync(join(dir, file), 'utf8'));
            return {
                tag,
                version: String(data.version ?? tag),
                date: data.date ? String(data.date) : null,
                status: data.status ?? 'released',
                summary: data.summary ?? '',
                breaking: data.breaking === true,
                link: releaseLink(tag),
                github: `${REPO_URL}/releases/tag/${tag}`,
                file,
            };
        });
    return sortReleases(list);
}

/** Every file under dir, as site paths ('/releases/2026.09.0/x.webp'). */
function walkPublic(dir, root) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        return statSync(p).isDirectory() ? walkPublic(p, root) : ['/' + relative(root, p).split('\\').join('/')];
    });
}

/**
 * Problems with the release pages, as strings (empty = OK).
 * @param {{ dir?: string, publicDir?: string, pkgVersion?: string }} [opts]
 */
export function checkReleases({ dir = RELEASES_DIR, publicDir = join(PUBLIC_DIR, 'releases'), pkgVersion } = {}) {
    const errors = [];
    const referenced = new Set();
    const releases = listReleases(dir);
    for (const r of releases) {
        const text = readFileSync(join(dir, r.file), 'utf8');
        const { data, body } = splitFrontmatter(text);
        const where = `doc/releases/${r.file}`;
        if (String(data.version) !== r.tag) errors.push(`${where}: version "${data.version}" must equal the file name "${r.tag}"`);
        if (!STATUSES.has(r.status)) errors.push(`${where}: status must be released or testing`);
        if (r.status === 'released' && !/^\d{4}-\d{2}-\d{2}$/.test(r.date ?? '')) errors.push(`${where}: released pages need date: YYYY-MM-DD`);
        if (!r.summary || /\bTODO\b/.test(r.summary)) errors.push(`${where}: summary is missing`);
        if (typeof data.breaking !== 'boolean') errors.push(`${where}: breaking must be true or false`);
        if (!/^#\s/m.test(body)) errors.push(`${where}: needs a "# " title`);
        mapProse(body, (t) => {
            const comp = /<([A-Z][A-Za-z]+)[\s/>]/.exec(t);
            if (comp) errors.push(`${where}: <${comp[1]}> components don't export to GitHub; link to the docs page instead`);
            for (const m of t.matchAll(/(?:\]\(|\b(?:src|href|poster)=")(\/releases\/[^)"\s#]+\.\w+)/g)) referenced.add(m[1]);
            return t;
        }, (line, info) => {
            if (/\b(live|lab)\b/.test(info)) errors.push(`${where}: \`${info}\` blocks don't export to GitHub`);
            return line;
        });
    }
    const testing = releases.filter(r => r.status === 'testing');
    if (testing.length > 1) errors.push(`only one page may be status: testing (found ${testing.map(r => r.tag).join(', ')})`);
    if (pkgVersion && testing[0] && compareVersions(testing[0].version, baseVersion(pkgVersion)) < 0) {
        errors.push(`doc/releases/${testing[0].file}: in testing but package.json is already ${pkgVersion}`);
    }
    const publicRoot = dirname(publicDir);
    for (const p of referenced) {
        if (!existsSync(join(publicRoot, p))) errors.push(`missing image ${p} (expected in doc/public${p})`);
    }
    // A GIF is the GitHub twin of a referenced clip (toGithubMarkdown), so it counts as used.
    const used = p => referenced.has(p) || (p.endsWith('.gif') && ['.webm', '.mp4'].some(ext => referenced.has(p.replace(/\.gif$/, ext))));
    for (const p of walkPublic(publicDir, publicRoot)) {
        if (!used(p)) errors.push(`unused file doc/public${p}`);
    }
    return errors;
}
