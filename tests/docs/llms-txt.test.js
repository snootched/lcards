/**
 * llms.txt / llms-full.txt (scripts/generate-llms-txt.js) and the services an agent
 * can call (doc/configuration/ha-actions.md must cover every service in services.yaml).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLlmsTxt, buildLlmsFull, pageUrl, pageInfo, cleanMarkdown, SECTIONS, isRedirectStub } from '../../scripts/generate-llms-txt.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

test('llms.txt follows the llmstxt.org shape: title, summary, sections of links', () => {
    const txt = buildLlmsTxt({ base: '/', version: '2026.10.0' });
    const lines = txt.split('\n');
    assert.equal(lines[0], '# LCARdS');
    assert.ok(lines[2].startsWith('> '));
    for (const h of ['## Machine-readable', '## Getting started', '## Cards', '## Core features', '## Optional']) assert.ok(lines.includes(h), h);
    for (const link of txt.matchAll(/^- \[[^\]]+\]\((https:\/\/[^)]+)\)/gm)) assert.match(link[1], /^https:\/\/lcards\.unimatrix01\.ca\//);
    assert.ok(!txt.includes('/releases/2026'), 'release notes are left out');
    assert.ok(!/—/.test(txt));
});

test('every docs page in a listed section appears once, with a summary of real text', () => {
    // The per-section listings (the AI help page is also linked under Machine-readable on purpose).
    const full = buildLlmsTxt({ base: '/', version: 'x' });
    const txt = full.slice(full.indexOf('## Getting started'));
    const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : []);
    for (const [folder] of SECTIONS) {
        for (const file of walk(join(ROOT, 'doc', folder))) {
            const url = pageUrl(file.slice(join(ROOT, 'doc').length + 1));
            const hits = txt.split('\n').filter(l => l.includes(`](${url})`));
            // A moved page's stub (frontmatter `redirect:`) is left out.
            const expected = isRedirectStub(readFileSync(file, 'utf8')) ? 0 : 1;
            assert.equal(hits.length, expected, `${url} listed ${hits.length} times`);
        }
    }
    const thin = txt.split('\n').filter(l => /^- \[/.test(l) && !/\): .{20,}/.test(l));
    assert.ok(thin.length <= 5, `pages without a useful summary:\n${thin.join('\n')}`);
});

test('URLs carry the channel base; llms-full has the user docs only, cleaned', () => {
    assert.equal(pageUrl('cards/button/index.md', '/dev/'), 'https://lcards.unimatrix01.ca/dev/cards/button/');
    assert.equal(pageUrl('core/presets.md', '/v/2026.10.0/'), 'https://lcards.unimatrix01.ca/v/2026.10.0/core/presets.html');
    assert.ok(buildLlmsTxt({ base: '/dev/', version: 'x' }).includes('https://lcards.unimatrix01.ca/dev/schema/index.json'));
    const full = buildLlmsFull({ base: '/', version: 'x' });
    assert.ok(full.includes('# Button Card'));
    assert.ok(!full.includes('<CardGallery'), 'Vue components removed');
    assert.ok(!/^---\ndescription:/m.test(full), 'frontmatter removed');
    assert.ok(!full.includes('<!-- https://lcards.unimatrix01.ca/architecture/'), 'architecture is optional, not in the full file');
    // 900 KB until 2026-10-24 (C3's WebGL background docs took it to 900.7 KB);
    // 950 KB until 2026-10-25 (the astrometrics Live data page and labels took it to 952 KB);
    // 1000 KB until 2026-10-28 (the astrometrics Studio and starters pages took it to 1010 KB);
    // 1050 KB until 2026-10-29 (the astrometrics Scale page and face: motion took it to 1050.3 KB);
    // 1100 KB until 2026-10-30 (R4: the real Solar System, settings from entities, the galaxy object and the
    // Star Trek galaxy starter with its parts took it to 1104 KB; the starters' full YAML is most of the growth)
    // 1200 KB until 2026-11-02 (AC1 asteroid and comet, W1 Bajoran wormhole took it to 1206.6 KB; the starters
    // page alone is 137 KB, the dashboard gallery 124 KB)
    // 1250 KB until 2026-11-07 (D2: block-style YAML and full key tables on the slider and objects pages
    // took it to 1303 KB)
    // 1350 KB until 2026-11-07 (D2 batch 1: button, elbow, select menu, alert overlay in the
    // new format took it to 1362 KB); size policy for the rest of the rollout is open
    // 1450 KB until 2026-11-08 (D2 batch 3: the astrometrics pages, camera and scene topic pages
    // took it to 1454 KB); the user, 2026-11-07: let it grow until the rollout ends, then revisit
    // 1550 KB until 2026-11-08 (D2 batch 5: the core pages, now with live examples and key tables,
    // took it to 1631 KB); still growing until the rollout ends (the user, 2026-11-07)
    // 1750 KB until 2026-11-11 (design review: scale and density rules, display sweep, readings
    // table and the classic data screen in lcars-design/lcars-patterns took it to 1774 KB)
    // 1850 KB until 2026-11-11 (the reworked gallery samples, 1000+ lines each, were inlined
    // and took it to 2406 KB; they are now a pointer to references/gallery/, 1573 KB)
    assert.ok(Buffer.byteLength(full) < 1650 * 1024, 'llms-full.txt stays loadable');
    assert.ok(!full.includes('BRIDGE OPERATIONS'), 'gallery dashboards are pointed to, not inlined');
    assert.ok(full.includes('references/gallery/bridge.yaml'), 'the gallery page points to the skill copies');
});

test('page summaries: frontmatter description wins, callouts and bare type names are skipped', () => {
    assert.equal(pageInfo('---\ndescription: "Short."\n---\n# T\n\nBody text that is long enough to be a summary.').summary, 'Short.');
    assert.equal(pageInfo('# Card\n\n`custom:lcards-x`\n\n::: tip\nAn aside that is long enough to count as text.\n:::\n\nThe real first paragraph of the page, with a [link](x).').summary,
        'The real first paragraph of the page, with a link.');
    assert.equal(cleanMarkdown('## Title {#anchor}\n\n<CardGallery set="x" />\n\ntext'), '## Title\n\ntext');
});

test('HA Actions page documents every service in services.yaml (what an agent can call)', () => {
    const services = [...readFileSync(join(ROOT, 'custom_components/lcards/services.yaml'), 'utf8').matchAll(/^([a-z_]+):\s*$/gm)].map(m => m[1]);
    assert.ok(services.length >= 16);
    const page = readFileSync(join(ROOT, 'doc/configuration/ha-actions.md'), 'utf8');
    const missing = services.filter(s => !page.includes(`lcards.${s}`));
    assert.deepEqual(missing, [], 'add a section for each new service to doc/configuration/ha-actions.md');
    // services.py registers exactly the services services.yaml describes
    const py = readFileSync(join(ROOT, 'custom_components/lcards/services.py'), 'utf8');
    const registered = [...py.matchAll(/^SERVICE_[A-Z_]+\s*=\s*"([a-z_]+)"/gm)].map(m => m[1]);
    assert.deepEqual([...registered].sort(), [...services].sort(), 'services.py SERVICE_* and services.yaml disagree');
});
