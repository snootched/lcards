/**
 * The demo boards, assembled from tracked files (no network here): demo/order.yaml
 * lists the views in demo/views/<file>.yaml by release, with each view's header text
 * and whether it is public. The header of every view and the index view are built
 * here, from LCARdS cards only, so the Home Assistant boards and the docs site's live
 * demo render the same chrome.
 *
 * Boards: `dev` (lcards-demo, every view) and `public` (lcards-demo-public, the
 * public views). scripts/demo-push.mjs pushes them, doc/.vitepress/theme/demo.data.js
 * gives the docs one release of the public board, tests/docs/demo-dashboard.test.js
 * checks it all offline.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export const DEMO_DIR = fileURLToPath(new URL('../../demo', import.meta.url));
/** The dashboard gallery (doc/gallery/dashboards/): `file: gallery/<name>` in order.yaml shows one as a demo view */
export const GALLERY_DIR = fileURLToPath(new URL('../../doc/gallery/dashboards', import.meta.url));
export const GALLERY_PREFIX = 'gallery/';
export const BOARDS = {
    dev: { urlPath: 'lcards-demo', title: 'LCARdS Demo (dev)' },
    public: { urlPath: 'lcards-demo-public', title: 'LCARdS Demo' },
};
/** The docs channel the Home Assistant boards link to (their features are documented there first). */
export const DOCS_SITE = 'https://lcards.unimatrix01.ca/dev';
const ENTRY_KEYS = new Set(['file', 'title', 'summary', 'description', 'session', 'docs', 'public', 'heavy', 'max_width']);
/** Card labels default to black, unreadable over the dark backgrounds. */
const LABEL = 'var(--lcards-blue)';

/**
 * Read demo/order.yaml and every view it lists.
 * Each view takes its topic, group and place (`rank`) from the `topics` tree.
 * @returns {{ title: string, topics: DemoTopic[], releases: Array<{ version: string, views: DemoView[] }>, unlisted: string[], missing: string[], ungrouped: string[], regrouped: string[] }}
 * @typedef {{ id: string, title: string, groups: Array<{ title: string, views: string[] }> }} DemoTopic
 * @typedef {{ file: string, topic: string, group: string, rank: number, maxWidth: number | null, summary: string, description: string, session: string, docs: string|null, public: boolean, heavy: boolean, path: string, title: string, text: string, config: any }} DemoView
 */
export function loadDemo(dir = DEMO_DIR) {
    const order = yaml.load(readFileSync(join(dir, 'order.yaml'), 'utf8'));
    // the topic tree: a topic lists its views directly (one untitled group) or in groups
    const topics = (order.topics ?? []).map(t => ({
        id: String(t.id),
        title: String(t.title ?? t.id),
        groups: (t.groups ?? [{ title: '', views: t.views ?? [] }]).map(g => ({ title: String(g.title ?? ''), views: (g.views ?? []).map(String) })),
    }));
    /** @type {Map<string, { topic: string, group: string, rank: number }>} */
    const place = new Map();
    const regrouped = [];
    for (const t of topics) {
        for (const g of t.groups) {
            for (const file of g.views) {
                if (place.has(file)) regrouped.push(file);
                else place.set(file, { topic: t.id, group: g.title, rank: place.size });
            }
        }
    }
    const files = new Set(readdirSync(join(dir, 'views')).filter(f => f.endsWith('.yaml')).map(f => f.slice(0, -5)));
    const listed = new Set();
    const missing = [];
    const releases = (order.releases ?? []).map(release => ({
        version: String(release.version),
        views: (release.views ?? []).flatMap((entry) => {
            const { file } = entry;
            listed.add(file);
            const extra = Object.keys(entry).filter(k => !ENTRY_KEYS.has(k));
            if (extra.length) throw new Error(`demo/order.yaml ${file}: unknown keys ${extra.join(', ')}`);
            // a gallery dashboard (one view, wrapped in views:): its file as the YAML, its view as the config
            const gallery = file.startsWith(GALLERY_PREFIX) ? join(GALLERY_DIR, `${file.slice(GALLERY_PREFIX.length)}.yaml`) : null;
            if (gallery ? !existsSync(gallery) : !files.has(file)) {
                missing.push(file);
                return [];
            }
            const text = readFileSync(gallery ?? join(dir, 'views', `${file}.yaml`), 'utf8');
            const loaded = /** @type {any} */ (yaml.load(text));
            const config = gallery ? { ...loaded.views[0], path: `dashboard-${file.slice(GALLERY_PREFIX.length)}` } : loaded;
            return [{
                file, topic: place.get(file)?.topic ?? '', group: place.get(file)?.group ?? '', rank: place.get(file)?.rank ?? Infinity,
                heavy: entry.heavy === true, maxWidth: entry.max_width ?? null, summary: entry.summary ?? '', description: entry.description ?? '', session: entry.session ?? '',
                docs: entry.docs ?? null, public: entry.public === true,
                path: config.path ?? file, title: entry.title ?? config.title ?? file, text, config: { path: file, ...config },
            }];
        }),
    }));
    const unlisted = [...files].filter(f => !listed.has(f)).sort();
    // listed for a release but in no topic, or in the tree but not a listed view
    const ungrouped = [...listed].filter(f => !place.has(f)).concat([...place.keys()].filter(f => !listed.has(f))).sort();
    return { title: order.title ?? 'LCARdS Demo', topics, releases, unlisted, missing, ungrouped, regrouped };
}

/** Every view, in dashboard order. */
export const demoViews = (demo) => demo.releases.flatMap(r => r.views);

/** Every view file as { name, text }, for the config checker (validateTexts in scripts/lcards-validate.mjs). */
export function viewTexts(demo, dir = DEMO_DIR) {
    return demoViews(demo).map(v => ({
        name: v.file.startsWith(GALLERY_PREFIX) ? join(GALLERY_DIR, `${v.file.slice(GALLERY_PREFIX.length)}.yaml`) : join(dir, 'views', `${v.file}.yaml`),
        text: v.text,
    }));
}

/** Segment colours along a header bar, in turn (theme roles, so alert modes and themes recolour them). */
const SEGMENT_COLORS = ['theme:colors.ui.primary', 'theme:colors.ui.tertiary', 'theme:colors.ui.secondary'];
/** The frame's left column (px): the sweeps' vertical arm and the bar down each section, the touch strip to scroll by */
const FRAME_WIDTH = 90;
/** A rounder sweep than the elbow's default (outer = half the arm) */
const SWEEP_CURVES = { outer_curve: 70, inner_curve: 26 };

/**
 * An LCARS header: a sweep in the top left continued as a bar of labelled
 * segments (the DS9 bracket's top bar in doc/gallery/dashboards/), the title
 * under the bar. A segment with an action is a button (Index, Docs).
 * @param {string} title
 * @param {Array<{ label: string, weight?: number, action?: any }>} segments
 */
export function frameHeader(title, segments) {
    const names = segments.map((_, i) => `s${i}`);
    return {
        type: 'custom:lcards-layout-card',
        grid_options: { columns: 'full', rows: 2 },
        layout: {
            'grid-gap': '6px',
            'grid-template-columns': `150px ${segments.map(s => `minmax(0, ${s.weight ?? 1}fr)`).join(' ')}`,
            'grid-template-rows': '26px minmax(0, 1fr)',
            'grid-template-areas': `"sweep ${names.join(' ')}" "sweep ${names.map(() => 'title').join(' ')}"`,
        },
        cards: [
            {
                type: 'custom:lcards-elbow',
                view_layout: { 'grid-area': 'sweep' },
                elbow: { type: 'header-left', segment: { bar_width: FRAME_WIDTH, bar_height: 26, color: SEGMENT_COLORS[0], ...SWEEP_CURVES } },
            },
            ...segments.map((seg, i) => ({
                type: 'custom:lcards-button',
                preset: 'panel-light',
                min_height: 26,
                view_layout: { 'grid-area': names[i] },
                text: { label: { content: seg.label.toUpperCase(), position: 'center-right' } },
                style: { card: { color: { background: { default: SEGMENT_COLORS[(i + 1) % SEGMENT_COLORS.length] } } } },
                // only a segment with an action is a button
                ...(seg.action ? { tap_action: seg.action } : { interactive: false }),
            })),
            {
                type: 'custom:lcards-button',
                preset: 'text-only',
                interactive: false,
                min_height: 0,
                view_layout: { 'grid-area': 'title' },
                text: { label: { content: title.toUpperCase(), show: true, position: 'center-right', font_size: 30, color: 'theme:colors.ui.tertiary' } },
            },
        ],
    };
}

/**
 * The sections grid of a `column_span: 4` section by panel width, as Home Assistant
 * sizes it (12 columns per section column; a column at least 320 px plus a 32 px gap,
 * a 256 px sidebar from 870 px up). Later queries win.
 */
export const GRID_STEPS = [
    [48, null],
    [36, '(max-width: 1695px)'],
    [24, '(max-width: 1343px)'],
    [12, '(max-width: 991px)'],
    [24, '(max-width: 869px)'],
    [12, '(max-width: 735px)'],
];
/** A sections grid row and gap, px */
const ROW = 56;
const GAP = 8;
/** Cards that take no room on the page (an overlay over it): left out of the frame */
const UNFRAMED = new Set(['custom:lcards-alert-overlay']);
/** Rows when a card gives none: its own default (getGridOptions), from its pixel height where it has one */
const DEFAULT_ROWS = { 'custom:lcards-astrometrics-card': 8, 'custom:lcards-msd-card': 8 };

/** A card's grid size in a grid of `total` columns: columns (full: all) and rows */
export function cardSpan(card, total) {
    const go = card.grid_options ?? {};
    const columns = go.columns === 'full' || go.columns === undefined ? total : Math.min(total, Math.max(1, Number(go.columns) || total));
    const h = Number.parseFloat(card.height);
    const rows = Number(go.rows) || (h > 0 ? Math.max(3, Math.ceil((h + GAP) / (ROW + GAP))) : DEFAULT_ROWS[card.type] ?? 1);
    return { columns, rows };
}

/**
 * Lay cards out as a sections grid does (CSS sparse auto-placement, row by row):
 * the grid-template-areas rows, one area `c<i>` per card, and the row count.
 * @param {Array<{ columns: number, rows: number }>} spans
 * @param {number} total
 */
export function packGrid(spans, total) {
    /** @type {string[][]} */
    const cells = [];
    const free = (r, c, w, h) => {
        for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (cells[y]?.[x]) return false;
        return true;
    };
    let r = 0;
    let c = 0;
    spans.forEach(({ columns: w, rows: h }, i) => {
        for (;;) {
            while (c + w <= total && !free(r, c, w, h)) c++;
            if (c + w <= total) break;
            r++;
            c = 0;
        }
        for (let y = r; y < r + h; y++) {
            cells[y] ??= Array(total).fill('');
            for (let x = c; x < c + w; x++) cells[y][x] = `c${i}`;
        }
    });
    const rows = cells.map(row => row.map(a => a || '.'));
    return { areas: rows.map(row => `"${row.join(' ')}"`).join(' '), rows: rows.length };
}

/** The grid keys of a content grid of `total` columns */
function gridLayout(cards, total) {
    const { areas, rows } = packGrid(cards.map(card => cardSpan(card, total)), total);
    return {
        'grid-template-columns': `repeat(${total}, minmax(0, 1fr))`,
        // rows grow with a card taller than its rows (a data grid's text), as in a sections grid
        'grid-template-rows': `repeat(${Math.max(1, rows)}, minmax(${ROW}px, auto))`,
        'grid-template-areas': areas,
    };
}

/** A scene: a full-width card six rows or more (a black canvas that hides where it ends) */
const isScene = (card) => {
    const { columns, rows } = cardSpan(card, GRID_STEPS[0][0]);
    return columns === GRID_STEPS[0][0] && rows >= 6;
};

/**
 * A section's cards split into frames: every scene gets a frame of its own, with the
 * smaller cards just before it (its controls); cards after the last scene share one.
 * @param {any[]} cards
 * @returns {any[][]}
 */
export function frameGroups(cards) {
    const groups = [];
    let cur = [];
    let scene = false;
    for (const card of cards) {
        if (scene) {
            groups.push(cur);
            cur = [];
            scene = false;
        }
        cur.push(card);
        scene = isScene(card);
    }
    if (cur.length) groups.push(cur);
    return groups;
}

/**
 * A view section in LCARS frames (one per scene, see frameGroups), numbered from `n`.
 * Overlay cards stay outside the frames.
 * @param {any} section
 * @param {number} n
 * @returns {{ section: any, frames: number }}
 */
export function frameSection(section, n) {
    const all = section.cards ?? [];
    const groups = frameGroups(all.filter(card => !UNFRAMED.has(card.type)));
    return {
        section: { ...section, cards: [...all.filter(card => UNFRAMED.has(card.type)), ...groups.map((cards, i) => frameCard(cards, n + i))] },
        frames: groups.length,
    };
}

/**
 * Cards in an LCARS frame: a sweep and top bar, a bar down the left (a strip to touch
 * and scroll by, beside cards that take every drag), the cards laid out as the sections
 * grid would (re-packed at each width Home Assistant would use), and a closing sweep
 * along the bottom.
 * @param {any[]} cards
 * @param {number} n - the frame's number on the view (shown on the bar; 0 shows none)
 * @param {{ head?: any }} [opts] - head: a card in place of the top sweep (a view's
 *   frameHeader, two section rows tall), so the header frames the description
 */
export function frameCard(cards, n, { head } = {}) {
    const color = SEGMENT_COLORS[n % SEGMENT_COLORS.length];
    const elbow = (type, area) => ({
        type: 'custom:lcards-elbow',
        view_layout: { 'grid-area': area },
        elbow: { type, segment: { bar_width: FRAME_WIDTH, bar_height: 12, color, ...SWEEP_CURVES } },
    });
    const [base, ...steps] = GRID_STEPS;
    return {
        type: 'custom:lcards-layout-card',
        grid_options: { columns: 'full' },
        layout: {
            height: 'auto',
            'grid-gap': '6px',
            'grid-template-columns': `${FRAME_WIDTH}px minmax(0, 1fr)`,
            'grid-template-rows': `${head ? 2 * ROW + GAP : 40}px auto 40px`,
            'grid-template-areas': '"top top" "bar content" "foot foot"',
        },
        cards: [
            head ? { ...head, view_layout: { 'grid-area': 'top' } } : elbow('header-left', 'top'),
            {
                type: 'custom:lcards-button',
                preset: 'panel-light',
                interactive: false,
                view_layout: { 'grid-area': 'bar' },
                ...(n ? { text: { label: { content: String(n).padStart(2, '0'), position: 'bottom-right' } } } : {}),
                style: { card: { color: { background: { default: color } } } },
            },
            {
                type: 'custom:lcards-layout-card',
                view_layout: { 'grid-area': 'content' },
                layout: {
                    height: 'auto',
                    'grid-gap': `${GAP}px`,
                    ...gridLayout(cards, base[0]),
                    mediaquery: Object.fromEntries(steps.map(([total, query]) => [query, gridLayout(cards, total)])),
                },
                cards: cards.map((card, i) => ({ ...card, view_layout: { 'grid-area': `c${i}` } })),
            },
            elbow('footer-left', 'foot'),
        ],
    };
}

/** "1 view", "6 views" */
const views = (n) => `${n} view${n === 1 ? '' : 's'}`;

/** One wrapping text cell (a data grid in data mode). */
function textBlock(text) {
    return {
        type: 'custom:lcards-data-grid',
        data_mode: 'data',
        rows: [[text]],
        grid: { 'grid-template-columns': '1fr' },
        style: { font_size: 18, align: 'left', white_space: 'normal', line_height: 1.4, color: 'var(--lcards-moonlight)' },
        // about 150 characters a line across a wide view; a narrow screen scrolls the cell
        grid_options: { columns: 'full', rows: text.length > 150 ? 2 : 1 },
    };
}

/** A lozenge button. */
function lozenge(content, tapAction, columns = 8) {
    return {
        type: 'custom:lcards-button',
        preset: 'lozenge',
        text: { name: { content: content.toUpperCase(), show: true } },
        tap_action: tapAction,
        grid_options: { columns, rows: 1 },
    };
}

/** The note in a view's header bar: the release, and on the dev board the session. */
export function headerNote(view, { board = 'dev', release = '' } = {}) {
    return [release, board === 'dev' ? view.session : ''].filter(Boolean).join(' · ');
}

/**
 * The header section of a view: the LCARS header (Index, the release and session, Docs
 * in its bar) heading a frame round the description. `index: false` (the docs site, which has its own
 * picker) leaves the Index link out.
 */
/**
 * A view's header bar segments: Index (or LCARdS), the release note, Docs, the path.
 * @param {any} view
 * @param {{ board?: string, release?: string, docsBase?: string, index?: boolean }} [opts]
 */
function headerSegments(view, { board = 'dev', release = '', docsBase = DOCS_SITE, index = true } = {}) {
    const note = headerNote(view, { board, release });
    return [
        ...(index ? [{ label: 'Index', weight: 1, action: { action: 'navigate', navigation_path: `/${BOARDS[board].urlPath}/index` } }] : [{ label: 'LCARdS', weight: 1 }]),
        { label: note || '-', weight: 2 },
        ...(view.docs ? [{ label: 'Docs', weight: 1, action: { action: 'url', url_path: `${docsBase}${view.docs}` } }] : []),
        { label: view.path, weight: 3 },
    ];
}

export function headerSection(view, opts = {}) {
    const segments = headerSegments(view, opts);
    return {
        type: 'grid',
        column_span: 4,
        // no description: the header bar alone; with one, a frame round it like the sections'
        cards: [view.description ? frameCard([textBlock(view.description)], 0, { head: frameHeader(view.title, segments) }) : frameHeader(view.title, segments)],
    };
}

/**
 * The board's views by topic (demo/order.yaml `topics`, in the tree's order); each
 * view with its release.
 */
export function topicGroups(releases, topics) {
    const all = releases.flatMap(r => r.views.map(v => ({ ...v, release: r.version })));
    return topics
        .map(t => ({ ...t, views: all.filter(v => v.topic === t.id).sort((a, b) => a.rank - b.rank) }))
        .filter(t => t.views.length);
}

/** The index view: per topic, a frame with its title, a button per view and a table of summaries. */
export function indexView(releases, { board = 'dev', topics = [] } = {}) {
    const { urlPath, title } = BOARDS[board];
    const navigate = (v) => ({ action: 'navigate', navigation_path: `/${urlPath}/${v.path}` });
    const intro = board === 'dev'
        ? 'Every feature since the last release, one view each, plus checks and benchmarks. The views live in demo/views/ in the LCARdS repo; npm run demo:push rebuilds this board and the public one.'
        : 'What is new in LCARdS, one view per feature, with the cards running live. Open a view, change things, and follow the Docs button for the config.';
    const count = releases.reduce((n, r) => n + r.views.length, 0);
    return {
        title: 'Index', path: 'index', type: 'sections', max_columns: 4,
        sections: [
            {
                type: 'grid',
                column_span: 4,
                cards: [frameHeader(title, [{ label: 'Index', weight: 1 }, { label: releases.map(r => r.version).join(' · '), weight: 3 }, { label: views(count), weight: 1 }]), textBlock(intro)],
            },
            // each topic in an LCARS frame like a view's sections: its title, a button per view, the table
            ...topicGroups(releases, topics).map((topic, i) => ({
                type: 'grid',
                column_span: 4,
                cards: [frameCard([
                    {
                        type: 'custom:lcards-button',
                        preset: 'text-only',
                        interactive: false,
                        min_height: 0,
                        text: { label: { content: `${topic.title} · ${views(topic.views.length)}`.toUpperCase(), show: true, position: 'center-left', font_size: 30, color: 'theme:colors.ui.tertiary' } },
                        grid_options: { columns: 'full', rows: 1 },
                    },
                    ...topic.views.map(v => lozenge(v.title, navigate(v), 12)),
                    {
                        type: 'custom:lcards-data-grid',
                        data_mode: 'data',
                        rows: topic.views.map(v => [{ value: v.title, tap_action: navigate(v) }, v.summary, [v.group, v.release].filter(Boolean).join(' · ')]),
                        grid: { 'grid-template-columns': 'minmax(0, 1fr) minmax(0, 2fr) 220px', 'grid-template-rows': `repeat(${topic.views.length}, min-content)` },
                        style: { font_size: 16, align: 'left', white_space: 'normal', color: 'var(--lcards-moonlight)' },
                        columns: [{ style: { color: LABEL, text_transform: 'uppercase' } }, {}, { style: { color: LABEL } }],
                        // about 42 px a line (measured on the board), in section rows of 56 px plus an 8 px gap
                        grid_options: { columns: 'full', rows: Math.max(1, Math.ceil((topic.views.length * 42) / 64)) },
                    },
                ], i + 1)],
            })),
        ],
    };
}

/** A view with its generated header on top. */
export function viewWithHeader(view, opts = {}) {
    const { config } = view;
    // a layout view is its own LCARS frame: the demo header goes in its `head` area
    if (config.type === 'custom:lcards-layout-view') {
        return {
            ...config,
            cards: (config.cards ?? []).map((c) => (c?.view_layout?.['grid-area'] === 'head'
                ? { ...frameHeader(view.title, headerSegments(view, opts)), view_layout: c.view_layout }
                : c)),
        };
    }
    let n = 1;
    const sections = (config.sections ?? []).map((s) => {
        const { section, frames } = frameSection(s, n);
        n += frames;
        return section;
    });
    return { ...config, sections: [headerSection(view, opts), ...sections] };
}

/**
 * A board's releases: `public` keeps only the public views (and the releases that have
 * any); `release` keeps one release (the docs site shows its own version only).
 */
export function boardReleases(demo, { board = 'dev', release = null } = {}) {
    return demo.releases
        .filter(r => !release || r.version === release)
        .map(r => ({ ...r, views: r.views.filter(v => board === 'dev' || v.public) }))
        .filter(r => r.views.length);
}

/**
 * A whole board's dashboard config: the index, then every view with its header.
 * `index: false` leaves the headers' Index link out (the docs site).
 */
export function buildDashboard(demo, { board = 'dev', release = null, docsBase = DOCS_SITE, index = true } = {}) {
    const releases = boardReleases(demo, { board, release });
    return {
        title: BOARDS[board].title,
        views: [
            indexView(releases, { board, topics: demo.topics }),
            // in the topic tree's order, like the index
            ...releases.flatMap(r => r.views.map(v => ({ v, release: r.version })))
                .sort((a, b) => a.v.rank - b.v.rank)
                .map(({ v, release: version }) => viewWithHeader(v, { board, release: version, docsBase, index })),
        ],
    };
}

/** Keys of a helper's create command that are not configuration.yaml keys */
const HELPER_COMMAND_KEYS = new Set(['type']);

/**
 * The scripts and automations demo views use (demo/package.yaml): `script`
 * by object id, `automation` a list with ids.
 * @param {string} [dir]
 * @returns {{ script: Record<string, any>, automation: any[] }}
 */
export function loadPackage(dir = DEMO_DIR) {
    const file = join(dir, 'package.yaml');
    const pkg = existsSync(file) ? /** @type {any} */ (yaml.load(readFileSync(file, 'utf8'))) ?? {} : {};
    return { script: pkg.script ?? {}, automation: Array.isArray(pkg.automation) ? pkg.automation : [] };
}

/**
 * The lcards_test_* helpers some views use, as a Home Assistant YAML package
 * (configuration.yaml or a packages/ file), so a view copied from the live demo
 * works in a user's own Home Assistant unchanged; with the scripts and
 * automations (demo/package.yaml) a view names (`script.<id>`, `automation.<id>`,
 * in its YAML or a "# uses:" comment).
 * @param {Array<{ text: string }>} views
 * @param {Record<string, { type: string } & Record<string, any>>} definitions - entity id -> its create command (tests/ha/ha-client.mjs)
 * @param {{ script: Record<string, any>, automation: any[] }} [extras] - loadPackage()
 * @returns {{ yaml: string, ids: string[], missing: string[] }} missing: ids a view uses with no definition
 */
export function helpersPackage(views, definitions, extras = { script: {}, automation: [] }) {
    const used = new Set(views.flatMap(v => v.text.match(/\binput_[a-z]+\.lcards_test_[a-z0-9_]+/g) ?? []));
    const named = new Set(views.flatMap(v => v.text.match(/\b(?:script|automation)\.lcards_test_[a-z0-9_]+/g) ?? []));
    const ids = [...used].sort();
    const missing = ids.filter(id => !definitions[id]);
    /** @type {Record<string, any>} */
    const pkg = {};
    for (const id of ids.filter(i => definitions[i])) {
        const [domain, object] = id.split('.');
        const keys = Object.fromEntries(Object.entries(definitions[id]).filter(([k]) => !HELPER_COMMAND_KEYS.has(k)));
        (pkg[domain] ??= {})[object] = keys;
    }
    for (const [id, cfg] of Object.entries(extras.script)) {
        if (named.has(`script.${id}`)) (pkg.script ??= {})[id] = cfg;
    }
    for (const cfg of extras.automation) {
        if (named.has(`automation.${cfg.id}`)) (pkg.automation ??= []).push(cfg);
    }
    for (const n of named) {
        const [kind, id] = n.split('.');
        const known = kind === 'script' ? id in extras.script : extras.automation.some(a => a.id === id);
        if (!known) missing.push(n);
    }
    return { yaml: yaml.dump(pkg, { lineWidth: -1, flowLevel: 3 }), ids, missing };
}
