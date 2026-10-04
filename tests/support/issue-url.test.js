/**
 * formatSupportMarkdown + buildIssueUrl — the prefilled GitHub bug form.
 * Field ids must match .github/ISSUE_TEMPLATE/bug_report.yml.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    buildIssueUrl, formatSupportMarkdown, evaluateSupportChecks,
    ISSUE_FIELDS, ISSUE_TEMPLATE, MAX_ISSUE_URL_LENGTH,
} from '../../src/utils/support-info-format.js';

const info = {
    lcards: { version: '2026.10.0', backendVersion: '2026.10.0', integrationAvailable: true, buildDate: '2026-10-04' },
    ha: { version: '2026.10.1', frontendVersion: '20260930.0' },
    browser: { summary: 'Chrome 141 on Linux', companionApp: false },
    theme: { haTheme: 'LCARS | Pipe | Test', darkMode: true, haLcarsActive: true },
    styling: { uix: { installed: true, version: '8.3.1' }, cardMod: { present: false } },
    backend: { status: 'admin_required' },
    recentLogs: [{ t: '2026-10-04T12:00:00Z', level: 'warn', message: 'something & odd #1 ?' }],
};
const checks = evaluateSupportChecks(info);
const full = formatSupportMarkdown(info, checks);
const compact = formatSupportMarkdown(info, checks, { compact: true });

test('field ids match the bug_report.yml template', () => {
    const yml = readFileSync(new URL(`../../.github/ISSUE_TEMPLATE/${ISSUE_TEMPLATE}`, import.meta.url), 'utf8');
    for (const id of Object.values(ISSUE_FIELDS)) {
        assert.match(yml, new RegExp(`\\n\\s+id: ${id}\\n`), `bug_report.yml is missing field id "${id}"`);
    }
});

test('URL targets the bug form and prefills versions + diagnostics', () => {
    const { url, truncated } = buildIssueUrl(info, full, compact);
    assert.equal(truncated, false);
    const u = new URL(url);
    assert.equal(u.origin + u.pathname, 'https://github.com/snootched/LCARdS/issues/new');
    assert.equal(u.searchParams.get('template'), ISSUE_TEMPLATE);
    assert.equal(u.searchParams.get(ISSUE_FIELDS.lcardsVersion), '2026.10.0');
    assert.equal(u.searchParams.get(ISSUE_FIELDS.haVersion), '2026.10.1');
    assert.equal(u.searchParams.get(ISSUE_FIELDS.diagnostics), full); // round-trips exactly
    assert.doesNotMatch(url, /[\n ]/, 'raw newlines/spaces must be encoded');
});

test('markdown escapes table pipes and includes the checklist', () => {
    assert.match(full, /LCARS \\\| Pipe \\\| Test/);
    assert.match(full, /\*\*Checks\*\*/);
    assert.match(full, /Recent LCARdS warnings\/errors/);
    assert.doesNotMatch(compact, /Environment details/);
});

test('oversized diagnostics fall back to the compact summary + paste note', () => {
    const huge = full + '\n' + 'x'.repeat(20000);
    const { url, truncated } = buildIssueUrl(info, huge, compact);
    assert.equal(truncated, true);
    assert.ok(url.length <= MAX_ISSUE_URL_LENGTH);
    assert.match(new URL(url).searchParams.get(ISSUE_FIELDS.diagnostics), /copied to your clipboard/);
});

test('even an oversized compact summary stays under the cap', () => {
    const { url, truncated } = buildIssueUrl(info, 'y'.repeat(20000), 'z'.repeat(20000));
    assert.equal(truncated, true);
    assert.ok(url.length <= MAX_ISSUE_URL_LENGTH);
});

test('config (entity IDs) only appears when collected', () => {
    assert.doesNotMatch(full, /sensor\./);
    const withCfg = formatSupportMarkdown({ ...info, config: { dataSources: [{ name: 'temp', entity: 'sensor.kitchen' }] } }, checks);
    assert.match(withCfg, /sensor\.kitchen/);
});
