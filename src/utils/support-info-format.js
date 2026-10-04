/**
 * @fileoverview Support info — pure evaluation & formatting (no DOM, no hass).
 *
 * Turns a collected support-info snapshot (see support-info.js) into:
 *   - a health checklist (evaluateSupportChecks)
 *   - a markdown block for issues / clipboard (formatSupportMarkdown)
 *   - a prefilled GitHub bug-form URL (buildIssueUrl)
 *
 * Kept free of browser globals and build-time defines so it is unit-tested
 * under plain node (tests/support/).
 *
 * @module utils/support-info-format
 */

/** Minimum supported Home Assistant (keep in sync with const.py MIN_HA_VERSION / hacs.json). */
export const MIN_HA_VERSION = [2026, 10];

export const DEFAULT_ISSUE_REPO = 'snootched/LCARdS';
export const ISSUE_TEMPLATE = 'bug_report.yml';
/** Field ids in .github/ISSUE_TEMPLATE/bug_report.yml prefilled by buildIssueUrl. */
export const ISSUE_FIELDS = { lcardsVersion: 'lcards_version', haVersion: 'ha_version', diagnostics: 'diagnostics' };
/** Conservative cap — GitHub/browsers reject very long URLs (~8k). */
export const MAX_ISSUE_URL_LENGTH = 7000;

/**
 * @typedef {'ok'|'warn'|'error'|'info'} CheckStatus
 * @typedef {{id: string, status: CheckStatus, title: string, detail?: string, fix?: string}} SupportCheck
 */

/**
 * Parse "2026.10.0b0" / "2026.10.1" → [2026, 10]. Returns null when unparseable.
 * @param {string|null|undefined} version
 * @returns {[number, number]|null}
 */
export function parseHaVersion(version) {
    const m = /^(\d+)\.(\d+)/.exec(String(version ?? ''));
    return m ? [Number(m[1]), Number(m[2])] : null;
}

function meetsMinimum(parsed, min = MIN_HA_VERSION) {
    return parsed[0] > min[0] || (parsed[0] === min[0] && parsed[1] >= min[1]);
}

/**
 * Evaluate a support-info snapshot into a checklist.
 * @param {object} info  snapshot from collectSupportInfo()
 * @returns {SupportCheck[]}
 */
export function evaluateSupportChecks(info) {
    /** @type {SupportCheck[]} */
    const checks = [];
    const lcards = info?.lcards ?? {};
    const ha = info?.ha ?? {};
    const styling = info?.styling ?? {};
    const theme = info?.theme ?? {};
    const backend = info?.backend ?? {};
    const bd = backend.status === 'ok' ? backend.data ?? {} : null;
    const minLabel = MIN_HA_VERSION.join('.');

    // ── Home Assistant version ─────────────────────────────────────────────
    const parsed = parseHaVersion(ha.version);
    if (!parsed) {
        checks.push({ id: 'ha_version', status: 'info', title: 'Home Assistant version unknown' });
    } else if (!meetsMinimum(parsed)) {
        checks.push({ id: 'ha_version', status: 'error', title: `Home Assistant ${ha.version} is too old`,
            detail: `LCARdS requires ${minLabel} or newer.`, fix: 'Update Home Assistant.' });
    } else {
        checks.push({ id: 'ha_version', status: 'ok', title: `Home Assistant ${ha.version}` });
    }

    // ── Integration / version match ────────────────────────────────────────
    if (!lcards.integrationAvailable) {
        checks.push({ id: 'integration', status: 'error', title: 'LCARdS integration not responding',
            detail: 'The frontend is loaded but the backend integration did not answer.',
            fix: 'Settings → Devices & services → add/repair the LCARdS integration, then restart.' });
    } else if (lcards.backendVersion && lcards.version && lcards.backendVersion !== lcards.version) {
        checks.push({ id: 'version_match', status: 'warn', title: 'Frontend and integration versions differ',
            detail: `Browser is running ${lcards.version}, integration is ${lcards.backendVersion}.`,
            fix: 'Hard-refresh the browser (Ctrl+Shift+R) or clear the companion app cache; restart HA if you just updated.' });
    } else {
        checks.push({ id: 'version_match', status: 'ok', title: `LCARdS ${lcards.version ?? 'unknown'} (frontend = integration)` });
    }

    // ── Safe / recovery mode ───────────────────────────────────────────────
    if (ha.safeMode || ha.recoveryMode || bd?.safe_mode || bd?.recovery_mode) {
        checks.push({ id: 'safe_mode', status: 'warn', title: 'Home Assistant is in safe/recovery mode',
            detail: 'Custom integrations and resources may not load.', fix: 'Restart Home Assistant normally.' });
    }

    // ── Styling engine: UIX vs card-mod ────────────────────────────────────
    const uix = styling.uix ?? {};
    const cardMod = styling.cardMod ?? {};
    const uixPresent = !!(uix.installed || bd?.components?.uix);
    const cardModPresent = !!(cardMod.present || bd?.resources?.card_mod || bd?.card_mod_in_extra_module_url || bd?.components?.card_mod);
    if (uixPresent && cardModPresent) {
        checks.push({ id: 'styling', status: 'error', title: 'Both UIX and card-mod are installed',
            detail: 'They patch the same Home Assistant elements and conflict.',
            fix: 'Uninstall card-mod (HACS) and remove its extra_module_url / resource entry; keep UIX.' });
    } else if (cardModPresent) {
        checks.push({ id: 'styling', status: 'warn', title: 'card-mod is installed',
            detail: 'card-mod no longer works with current Home Assistant; HA-LCARS uses UI eXtension (UIX).',
            fix: 'Uninstall card-mod, remove its extra_module_url / resource entry, and install UIX.' });
    } else if (uixPresent) {
        checks.push({ id: 'styling', status: 'ok', title: `UI eXtension (UIX) ${uix.version ?? ''}`.trim() });
    } else if (theme.haLcarsActive) {
        checks.push({ id: 'styling', status: 'warn', title: 'HA-LCARS theme active but UIX is not installed',
            detail: 'HA-LCARS injects its styling through UIX; without it much of the LCARS chrome is missing.',
            fix: 'Install UI eXtension (UIX) from HACS and add its integration.' });
    } else {
        checks.push({ id: 'styling', status: 'info', title: 'No UIX / card-mod (not required without HA-LCARS)' });
    }

    if (bd?.card_mod_in_extra_module_url) {
        checks.push({ id: 'extra_module_url', status: 'warn', title: 'card-mod is still in frontend: extra_module_url',
            detail: (bd.extra_module_urls ?? []).filter(u => /card[-_]mod/i.test(u)).join(', '),
            fix: 'Remove the card-mod line from configuration.yaml (frontend → extra_module_url) and restart.' });
    }

    // ── Lovelace resources ─────────────────────────────────────────────────
    const res = bd?.resources;
    if (res) {
        if (res.legacy_lcards) {
            checks.push({ id: 'resources', status: 'warn', title: 'Legacy LCARdS resource entry found',
                detail: (res.entries ?? []).filter(e => e.legacy).map(e => e.url).join(', '),
                fix: 'Remove it under Settings → Dashboards → ⋮ → Resources (LCARdS loads itself via the integration).' });
        } else if ((res.lcards_count ?? 0) > 1) {
            checks.push({ id: 'resources', status: 'warn', title: `${res.lcards_count} LCARdS resource entries`,
                detail: 'Only one is expected.', fix: 'Remove the duplicates under Settings → Dashboards → ⋮ → Resources.' });
        } else {
            checks.push({ id: 'resources', status: 'ok', title: 'Lovelace resources OK' });
        }
    } else if (backend.status === 'admin_required') {
        checks.push({ id: 'backend', status: 'info', title: 'Backend checks need an admin user',
            detail: 'Resource and extra_module_url checks were skipped.' });
    } else if (backend.status && backend.status !== 'ok') {
        checks.push({ id: 'backend', status: 'info', title: 'Backend checks unavailable', detail: backend.error ?? backend.status });
    }

    // ── HA-LCARS theme ─────────────────────────────────────────────────────
    checks.push(theme.haLcarsActive
        ? { id: 'ha_lcars', status: 'ok', title: `HA-LCARS theme active${theme.haTheme ? ` (${theme.haTheme})` : ''}` }
        : { id: 'ha_lcars', status: 'info', title: `HA-LCARS theme not active${theme.haTheme ? ` (theme: ${theme.haTheme})` : ''}` });

    return checks;
}

const STATUS_ICON = { ok: '✅', warn: '⚠️', error: '❌', info: 'ℹ️' };

function cell(v) {
    if (v === null || v === undefined || v === '') return '—';
    return String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Format a snapshot + checklist as markdown for an issue body / clipboard.
 * @param {object} info
 * @param {SupportCheck[]} checks
 * @param {{compact?: boolean}} [opts]  compact = versions + checklist only
 * @returns {string}
 */
export function formatSupportMarkdown(info, checks, { compact = false } = {}) {
    const l = info?.lcards ?? {};
    const ha = info?.ha ?? {};
    const b = info?.browser ?? {};
    const t = info?.theme ?? {};
    const s = info?.styling ?? {};
    const lines = [];

    lines.push('| Component | Version / value |', '|---|---|');
    lines.push(`| LCARdS (browser) | ${cell(l.version)} (${cell(l.buildDate)}) |`);
    lines.push(`| LCARdS (integration) | ${cell(l.backendVersion)} |`);
    lines.push(`| Home Assistant | ${cell(ha.version)} |`);
    lines.push(`| HA frontend | ${cell(ha.frontendVersion)} |`);
    lines.push(`| Browser | ${cell(b.summary)}${b.companionApp ? ' (companion app)' : ''} |`);
    lines.push(`| HA theme | ${cell(t.haTheme)}${t.darkMode === true ? ' (dark)' : t.darkMode === false ? ' (light)' : ''} |`);
    lines.push(`| UIX | ${s.uix?.installed ? cell(s.uix.version ?? 'installed') : 'not installed'} |`);
    lines.push(`| card-mod | ${s.cardMod?.present ? cell(s.cardMod.version ?? 'present') : 'not present'} |`);
    lines.push('');
    lines.push('**Checks**');
    for (const c of checks ?? []) {
        lines.push(`- ${STATUS_ICON[c.status] ?? '•'} ${c.title}${c.detail ? ` — ${c.detail}` : ''}`);
    }
    if (compact) return lines.join('\n');

    lines.push('');
    lines.push('<details><summary>Environment details</summary>', '', '```json',
        JSON.stringify(stripForDetails(info), null, 2), '```', '', '</details>');

    const logs = info?.recentLogs ?? [];
    if (logs.length) {
        lines.push('', '<details><summary>Recent LCARdS warnings/errors</summary>', '', '```');
        for (const e of logs) lines.push(`${e.t} ${e.level.toUpperCase()} ${e.message}`);
        lines.push('```', '', '</details>');
    }
    return lines.join('\n');
}

/** Environment JSON for the details block — drops the parts already shown above. */
function stripForDetails(info) {
    const { recentLogs, ...rest } = info ?? {};
    return rest;
}

/**
 * Build a prefilled GitHub bug-form URL. The full markdown is used when it
 * fits; otherwise a compact summary plus a "paste the copied info" note.
 * @param {object} info
 * @param {string} fullMarkdown
 * @param {string} compactMarkdown
 * @param {{repo?: string}} [opts]
 * @returns {{url: string, truncated: boolean}}
 */
export function buildIssueUrl(info, fullMarkdown, compactMarkdown, { repo = DEFAULT_ISSUE_REPO } = {}) {
    const base = `https://github.com/${repo}/issues/new`;
    const make = (diag) => {
        const params = new URLSearchParams({ template: ISSUE_TEMPLATE });
        if (info?.lcards?.version) params.set(ISSUE_FIELDS.lcardsVersion, info.lcards.version);
        if (info?.ha?.version) params.set(ISSUE_FIELDS.haVersion, info.ha.version);
        params.set(ISSUE_FIELDS.diagnostics, diag);
        return `${base}?${params.toString()}`;
    };
    const note = '\n\n> Full support info was copied to your clipboard — paste it here to replace this summary.';
    let url = make(fullMarkdown);
    if (url.length <= MAX_ISSUE_URL_LENGTH) return { url, truncated: false };
    url = make(compactMarkdown + note);
    if (url.length <= MAX_ISSUE_URL_LENGTH) return { url, truncated: true };
    return { url: make('Support info was copied to your clipboard — paste it here.'), truncated: true };
}
