/**
 * evaluateSupportChecks — the health checklist shown in Config panel →
 * Welcome → Support & system info, and in every support bundle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSupportChecks, parseHaVersion } from '../../src/utils/support-info-format.js';

/** A healthy baseline: HA 2026.10, matching versions, UIX + HA-LCARS, admin backend OK. */
function healthy(overrides = {}) {
    const base = {
        lcards: { version: '2026.10.0', backendVersion: '2026.10.0', integrationAvailable: true },
        ha: { version: '2026.10.1', safeMode: false, recoveryMode: false },
        theme: { haTheme: 'LCARS 25th Century', haLcarsActive: true },
        styling: { uix: { installed: true, version: '8.3.1' }, cardMod: { present: false } },
        backend: { status: 'ok', data: {
            resources: { lcards_count: 1, legacy_lcards: false, card_mod: false, entries: [] },
            extra_module_urls: [], card_mod_in_extra_module_url: false,
            components: { uix: true, card_mod: false },
        } },
    };
    return structuredClone({ ...base, ...overrides });
}
const byId = (checks, id) => checks.find(c => c.id === id);

test('parseHaVersion handles release, patch and beta strings', () => {
    assert.deepEqual(parseHaVersion('2026.10.0'), [2026, 10]);
    assert.deepEqual(parseHaVersion('2026.10.0b0'), [2026, 10]);
    assert.deepEqual(parseHaVersion('2027.1.3'), [2027, 1]);
    assert.equal(parseHaVersion(null), null);
    assert.equal(parseHaVersion('dev'), null);
});

test('healthy setup has no warnings or errors', () => {
    const checks = evaluateSupportChecks(healthy());
    assert.deepEqual(checks.filter(c => c.status === 'warn' || c.status === 'error'), []);
    assert.equal(byId(checks, 'styling').status, 'ok');
    assert.equal(byId(checks, 'ha_lcars').status, 'ok');
});

test('HA below the 2026.10 minimum is an error; a 2026.10 beta and a later year are fine', () => {
    assert.equal(byId(evaluateSupportChecks(healthy({ ha: { version: '2026.9.4' } })), 'ha_version').status, 'error');
    assert.equal(byId(evaluateSupportChecks(healthy({ ha: { version: '2026.10.0b0' } })), 'ha_version').status, 'ok');
    assert.equal(byId(evaluateSupportChecks(healthy({ ha: { version: '2027.1.0' } })), 'ha_version').status, 'ok');
});

test('frontend/integration version mismatch warns about a stale cache', () => {
    const info = healthy();
    info.lcards.backendVersion = '2026.10.1';
    const c = byId(evaluateSupportChecks(info), 'version_match');
    assert.equal(c.status, 'warn');
    assert.match(c.fix, /refresh/i);
});

test('integration not responding is an error', () => {
    const info = healthy();
    info.lcards.integrationAvailable = false;
    assert.equal(byId(evaluateSupportChecks(info), 'integration').status, 'error');
});

test('safe/recovery mode warns', () => {
    const info = healthy();
    info.ha.recoveryMode = true;
    assert.equal(byId(evaluateSupportChecks(info), 'safe_mode').status, 'warn');
});

// ── UIX / card-mod / HA-LCARS matrix ─────────────────────────────────────────
for (const [uix, cardMod, lcars, expected] of [
    [true,  false, true,  'ok'],     // the recommended setup
    [true,  false, false, 'ok'],
    [true,  true,  true,  'error'],  // both installed → conflict
    [true,  true,  false, 'error'],
    [false, true,  true,  'warn'],   // card-mod no longer works
    [false, true,  false, 'warn'],
    [false, false, true,  'warn'],   // HA-LCARS without UIX
    [false, false, false, 'info'],   // neither needed
]) {
    test(`styling: uix=${uix} card-mod=${cardMod} ha-lcars=${lcars} → ${expected}`, () => {
        const info = healthy();
        info.styling = { uix: { installed: uix, version: uix ? '8.3.1' : null }, cardMod: { present: cardMod } };
        info.backend.data.components = { uix, card_mod: false };
        info.theme.haLcarsActive = lcars;
        assert.equal(byId(evaluateSupportChecks(info), 'styling').status, expected);
    });
}

test('card-mod detected only by the backend (extra_module_url) still counts as installed', () => {
    const info = healthy();
    info.styling.uix.installed = false;
    info.backend.data.components.uix = false;
    info.backend.data.card_mod_in_extra_module_url = true;
    info.backend.data.extra_module_urls = ['/hacsfiles/lovelace-card-mod/card-mod.js'];
    const checks = evaluateSupportChecks(info);
    assert.equal(byId(checks, 'styling').status, 'warn');
    const extra = byId(checks, 'extra_module_url');
    assert.equal(extra.status, 'warn');
    assert.match(extra.detail, /card-mod\.js/);
});

test('legacy or duplicate LCARdS resources warn', () => {
    const legacy = healthy();
    legacy.backend.data.resources = { lcards_count: 2, legacy_lcards: true, entries: [{ url: '/hacsfiles/lcards/lcards.js', legacy: true }] };
    const c1 = byId(evaluateSupportChecks(legacy), 'resources');
    assert.equal(c1.status, 'warn');
    assert.match(c1.detail, /hacsfiles/);

    const dup = healthy();
    dup.backend.data.resources = { lcards_count: 2, legacy_lcards: false, entries: [] };
    assert.equal(byId(evaluateSupportChecks(dup), 'resources').status, 'warn');
});

test('non-admin users get an info note instead of backend checks', () => {
    const info = healthy({ backend: { status: 'admin_required' } });
    const checks = evaluateSupportChecks(info);
    assert.equal(byId(checks, 'resources'), undefined);
    assert.equal(byId(checks, 'backend').status, 'info');
});

test('an empty snapshot does not throw', () => {
    assert.doesNotThrow(() => evaluateSupportChecks({}));
    assert.doesNotThrow(() => evaluateSupportChecks(undefined));
});

test('custom:layout-card installed: an info check pointing at the LCARdS Layout Card', () => {
    assert.equal(byId(evaluateSupportChecks(healthy()), 'layout_card'), undefined);
    const fromFrontend = healthy();
    fromFrontend.styling.layoutCard = { present: true };
    const check = byId(evaluateSupportChecks(fromFrontend), 'layout_card');
    assert.equal(check.status, 'info');
    assert.match(check.fix, /custom:lcards-layout-card/);
    const fromResources = healthy();
    fromResources.backend.data.resources.entries = [{ url: '/hacsfiles/lovelace-layout-card/layout-card.js' }];
    assert.ok(byId(evaluateSupportChecks(fromResources), 'layout_card'));
    const lcardsOnly = healthy();
    lcardsOnly.backend.data.resources.entries = [{ url: '/lcards/lcards-layout-card.js' }];
    assert.equal(byId(evaluateSupportChecks(lcardsOnly), 'layout_card'), undefined);
});
