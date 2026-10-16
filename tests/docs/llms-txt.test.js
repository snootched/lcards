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
    assert.ok(Buffer.byteLength(full) < 900 * 1024, 'llms-full.txt stays loadable');
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
});
