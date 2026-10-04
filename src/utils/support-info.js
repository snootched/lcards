/**
 * @fileoverview Support info — collection from the live environment.
 *
 * Gathers everything needed to triage a user issue (LCARdS frontend/backend
 * versions, Home Assistant, browser, theme, UIX vs card-mod, Lovelace resource
 * problems, recent LCARdS warnings/errors) into one snapshot. Evaluation and
 * formatting live in support-info-format.js (pure, unit-tested).
 *
 * Privacy: environment facts only by default. Data-source names/entity IDs are
 * included only with `includeConfig: true`. Nothing is sent anywhere — callers
 * copy to the clipboard or open a prefilled GitHub form the user reviews.
 *
 * Exposed as window.lcards.support (see src/lcards.js) and used by the config
 * panel's Welcome tab.
 *
 * @module utils/support-info
 */

import { LCARdS_VERSION } from '../lcards-vars.js';
import { lcardsLog, lcardsGetGlobalLogLevel, getRecentLogEntries } from './lcards-logging.js';
import { copyTextToClipboard } from './clipboard-utils.js';
import { evaluateSupportChecks, formatSupportMarkdown, buildIssueUrl } from './support-info-format.js';

/** Longest we wait for IntegrationService's probe (incl. retries) before reporting. */
const INTEGRATION_READY_TIMEOUT_MS = 15000;

/** A variable HA-LCARS themes define and LCARdS itself never injects. */
const HA_LCARS_PROBE_VARS = ['--lcars-card-top-color', '--lcars-ui-primary', '--lcars-green'];

function firstPatchVersion(state) {
    if (!state || typeof state !== 'object') return null;
    return Object.values(state).find(v => v?.version)?.version ?? null;
}

/** UIX vs genuine card-mod. UIX registers <uix-node> and window.uix_patch_state; card-mod registers <card-mod> and window.card_mod_patch_state. */
function detectStyling(hass) {
    const w = /** @type {any} */ (window);
    const uixInstalled = !!customElements.get('uix-node') || !!hass?.config?.components?.includes('uix');
    const cardModPresent = !!customElements.get('card-mod') || !!w.card_mod_patch_state;
    return {
        uix: { installed: uixInstalled, version: firstPatchVersion(w.uix_patch_state) },
        cardMod: { present: cardModPresent, version: firstPatchVersion(w.card_mod_patch_state) },
    };
}

function detectTheme(hass) {
    const rootStyle = getComputedStyle(document.documentElement);
    return {
        // What this browser actually renders: the user's own pick, else the global theme.
        haTheme: hass?.selectedTheme?.theme || hass?.themes?.theme || null,
        defaultTheme: hass?.themes?.default_theme ?? null,
        darkMode: hass?.themes?.darkMode ?? null,
        haLcarsActive: HA_LCARS_PROBE_VARS.some(v => rootStyle.getPropertyValue(v).trim() !== ''),
    };
}

function detectBrowser() {
    const nav = /** @type {any} */ (navigator);
    const ua = nav.userAgent ?? '';
    const brands = nav.userAgentData?.brands
        ?.filter(b => !/not.?a.?brand/i.test(b.brand))
        .map(b => `${b.brand} ${b.version}`) ?? [];
    const companionApp = /Home Assistant\//.test(ua);
    const platform = nav.userAgentData?.platform || nav.platform || '';
    const summary = brands.length
        ? `${brands.join(', ')} on ${platform || 'unknown OS'}`
        : ua.slice(0, 160);
    return {
        summary,
        userAgent: ua,
        platform,
        companionApp,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        secureContext: window.isSecureContext,
        reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    };
}

async function fetchBackend(hass, integrationAvailable) {
    if (!integrationAvailable) return { status: 'unavailable' };
    if (hass?.user && !hass.user.is_admin) return { status: 'admin_required' };
    try {
        const data = await hass.connection.sendMessagePromise({ type: 'lcards/diagnostics' });
        return { status: 'ok', data };
    } catch (err) {
        const code = /** @type {any} */ (err)?.code;
        if (code === 'unauthorized') return { status: 'admin_required' };
        return { status: 'error', error: /** @type {any} */ (err)?.message ?? String(code ?? err) };
    }
}

function collectDataSources(core) {
    const sources = core?.dataSourceManager?.sources;
    if (!(sources instanceof Map)) return [];
    return [...sources].map(([name, ds]) => ({
        name,
        entity: ds?.cfg?.entity ?? null,
        attribute: ds?.cfg?.attribute ?? null,
    }));
}

/**
 * Collect a support snapshot.
 * @param {{hass?: any, includeConfig?: boolean}} [opts]
 *   hass — defaults to LCARdS core's current hass
 *   includeConfig — also include data-source names/entity IDs (opt-in)
 * @returns {Promise<object>}
 */
export async function collectSupportInfo({ hass, includeConfig = false } = {}) {
    const core = /** @type {any} */ (window).lcards?.core;
    hass = hass ?? core?._currentHass ?? null;
    const integration = core?.integrationService;
    // On a fresh load the lcards/info probe may still be in flight (or retrying):
    // wait for it rather than reporting "integration not responding".
    if (integration && !integration.isReady) {
        await Promise.race([
            integration.onReady(),
            new Promise(resolve => setTimeout(resolve, INTEGRATION_READY_TIMEOUT_MS)),
        ]);
    }
    const integrationAvailable = !!integration?.available;

    const info = {
        generatedAt: new Date().toISOString(),
        lcards: {
            version: LCARdS_VERSION,
            buildDate: __LCARDS_BUILD_DATE__,
            backendVersion: integration?.version ?? null,
            integrationAvailable,
            capabilities: integration ? [...(integration.capabilities ?? [])] : [],
            options: integration?.options ?? null,
            logLevel: lcardsGetGlobalLogLevel(),
            coreInitialized: !!core?._coreInitialized,
            cardInstances: core?._cardInstances?.size ?? null,
            registeredCards: (/** @type {any} */ (window).customCards ?? [])
                .map(c => c.type).filter(t => typeof t === 'string' && t.startsWith('lcards-')),
            dataSourceCount: core?.dataSourceManager?.sources?.size ?? null,
            alertMode: core?.themeManager?.getAlertMode?.() ?? null,
            lcardsTheme: core?.themeManager?.getActiveTheme?.()?.id ?? null,
        },
        ha: {
            version: hass?.config?.version ?? null,
            frontendVersion: /** @type {any} */ (window).frontendVersion ?? null,
            safeMode: !!hass?.config?.safe_mode,
            recoveryMode: !!hass?.config?.recovery_mode,
            language: hass?.language ?? null,
            isAdmin: hass?.user?.is_admin ?? null,
        },
        browser: detectBrowser(),
        theme: detectTheme(hass),
        styling: detectStyling(hass),
        backend: await fetchBackend(hass, integrationAvailable),
        recentLogs: getRecentLogEntries(),
    };
    if (includeConfig) {
        info.config = { dataSources: collectDataSources(core) };
    }
    return info;
}

/**
 * Collect, evaluate and format in one go.
 * @param {{hass?: any, includeConfig?: boolean}} [opts]
 * @returns {Promise<{info: object, checks: import('./support-info-format.js').SupportCheck[], markdown: string, compactMarkdown: string}>}
 */
export async function buildSupportReport(opts = {}) {
    const info = await collectSupportInfo(opts);
    const checks = evaluateSupportChecks(info);
    return {
        info,
        checks,
        markdown: formatSupportMarkdown(info, checks),
        compactMarkdown: formatSupportMarkdown(info, checks, { compact: true }),
    };
}

/**
 * Copy a report's full markdown and open the prefilled GitHub bug form in a
 * new tab. The user reviews and submits it themselves — nothing is
 * auto-submitted.
 *
 * Call this synchronously from a click handler with an already-built report:
 * browsers only allow window.open / clipboard writes while the user's click is
 * still "fresh", and an awaited websocket round-trip first can get the popup
 * blocked (Safari/Firefox). The clipboard write is started before the new tab
 * takes focus.
 *
 * @param {{info: object, markdown: string, compactMarkdown: string}} report  from buildSupportReport()
 * @returns {{url: string, truncated: boolean, copied: Promise<boolean>}}
 */
export function openIssueForReport(report) {
    const copied = copyTextToClipboard(report.markdown);
    const result = buildIssueUrl(report.info, report.markdown, report.compactMarkdown);
    window.open(result.url, '_blank', 'noopener');
    return { ...result, copied };
}

/**
 * Console helper: collect and copy the full support markdown.
 * @param {{hass?: any, includeConfig?: boolean}} [opts]
 * @returns {Promise<string>} the markdown (also printed if the copy failed)
 */
export async function copySupportInfo(opts = {}) {
    const { markdown } = await buildSupportReport(opts);
    if (await copyTextToClipboard(markdown)) {
        lcardsLog.info('[Support] Support info copied to clipboard');
    } else {
        lcardsLog.warn('[Support] Clipboard unavailable — copy the support info printed below');
        console.log(markdown);
    }
    return markdown;
}

/**
 * Console helper: collect, then copy + open the prefilled bug form.
 * From the console this may trip the popup blocker — the URL is returned.
 * @param {{hass?: any, includeConfig?: boolean}} [opts]
 * @returns {Promise<{url: string, truncated: boolean}>}
 */
export async function reportIssue(opts = {}) {
    const { url, truncated, copied } = openIssueForReport(await buildSupportReport(opts));
    await copied;
    return { url, truncated };
}
