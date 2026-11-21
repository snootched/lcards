/**
 * The editor round trip (used by editor-roundtrip.spec.js): open a card's editor on a
 * config, visit every tab with every section open, and "edit" each control to the value
 * it already shows, so each field's own handler runs. After each one the editor's config
 * must still hold every key of the original, unchanged: a key that vanishes or changes is
 * silent data loss (the 2026-11-20 editor audit found four editors doing it). A key the
 * edit only adds, with the value the control showed, is reported but allowed.
 *
 * Runs in the page (page.evaluate(sweepEditor, config)), against the built bundle.
 */

/**
 * @param {Record<string, any>} config - a card config (type: custom:lcards-*)
 * @returns {Promise<{ tag: string, tabs: string[], controls: number, lost: any[], changed: any[], added: any[], errors: string[] }>}
 */
export async function sweepEditor(config) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const clone = (v) => JSON.parse(JSON.stringify(v));
    const tag = String(config.type).replace(/^custom:/, '');
    await customElements.whenDefined(tag);
    const editor = /** @type {any} */ (await customElements.get(tag).getConfigElement());
    editor.hass = window.__hass;
    const errors = [];
    const onError = (e) => errors.push(String(e.message ?? e.reason ?? e));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    editor.setConfig(clone(config));
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:0;top:0;width:640px';
    document.body.appendChild(host);
    host.appendChild(editor);
    await editor.updateComplete;
    await sleep(150);

    /** Every element below a root, through shadow roots */
    const deep = (root) => [...root.querySelectorAll('*')].flatMap((e) => [e, ...(e.shadowRoot ? deep(e.shadowRoot) : [])]);
    /** Paths in `a` that are missing in `b`, or hold another value */
    const diff = (a, b, at = '', out = { lost: [], changed: [] }) => {
        if (a && typeof a === 'object' && !Array.isArray(a)) {
            for (const k of Object.keys(a)) {
                const p = at ? `${at}.${k}` : k;
                if (!b || typeof b !== 'object' || !(k in b)) out.lost.push(p);
                else diff(a[k], b[k], p, out);
            }
        } else if (Array.isArray(a)) {
            if (!Array.isArray(b)) out.changed.push({ path: at, from: a, to: b });
            else if (a.length !== b.length) out.changed.push({ path: at, from: `${a.length} items`, to: `${b.length} items` });
            else a.forEach((v, i) => diff(v, b[i], `${at}[${i}]`, out));
        } else if (JSON.stringify(a) !== JSON.stringify(b)) out.changed.push({ path: at, from: a, to: b });
        return out;
    };
    const added = (a, b, at = '', out = []) => {
        if (b && typeof b === 'object' && !Array.isArray(b)) {
            for (const k of Object.keys(b)) {
                const p = at ? `${at}.${k}` : k;
                if (!a || typeof a !== 'object' || !(k in a)) out.push(p);
                else added(a[k], b[k], p, out);
            }
        }
        return out;
    };
    const label = (el) => el.label || el.getAttribute?.('label') || el.selector && Object.keys(el.selector)[0] || el.tagName.toLowerCase();

    const original = clone(config);
    const lost = [];
    const changed = [];
    const addedPaths = new Set();
    let controls = 0;
    const tabs = (editor._getTabDefinitions?.() ?? []).map((t) => t.label);
    for (let t = 0; t < tabs.length; t++) {
        if (/yaml|engineering|provenance|templates|rules|data source/i.test(tabs[t])) continue;
        editor._selectedTab = t;
        await editor.updateComplete;
        await sleep(100);
        // only the visible tab: hidden tabs stay in the page
        const panelOf = () => [...editor.shadowRoot.querySelectorAll('.tab-panel')].find((p) => !p.hidden) ?? editor.shadowRoot;
        // open every section, twice (opening one can render more)
        for (let pass = 0; pass < 2; pass++) {
            for (const s of deep(panelOf()).filter((e) => e.tagName === 'LCARDS-FORM-SECTION' || e.tagName === 'HA-EXPANSION-PANEL')) {
                if (s.expanded === false) { s.expanded = true; await s.updateComplete; }
            }
            await sleep(80);
        }
        // Switches are left out: a real click always flips them. Home Assistant's select
        // and boolean selectors never fire for their current value (ha-selector-select.ts,
        // ha-selector-boolean.ts), so they are left out too.
        const found = deep(panelOf()).filter((e) =>
            (e.tagName === 'HA-SELECTOR' && !e.selector?.select && !('boolean' in (e.selector ?? {})))
            || e.tagName === 'LCARDS-COLOR-PICKER');
        for (let i = 0; i < found.length; i++) {
            const el = found[i];
            if (!el.isConnected) continue;
            controls++;
            el.dispatchEvent(new CustomEvent('value-changed', { detail: { value: el.value }, bubbles: true, composed: true }));
            await sleep(0);
            const now = clone(editor.config ?? {});
            const d = diff(original, now);
            const where = `${tabs[t]} › ${label(el)}`;
            for (const p of d.lost) lost.push({ path: p, by: where });
            for (const c of d.changed) changed.push({ ...c, by: where });
            for (const p of added(original, now)) addedPaths.add(p);
            if (d.lost.length || d.changed.length) {
                // put the original back, so the next control starts clean
                editor.setConfig(clone(original));
                await editor.updateComplete;
            }
        }
    }
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onError);
    host.remove();
    return { tag, tabs, controls, lost, changed, added: [...addedPaths], errors };
}

/**
 * The same round trip in a card's studio (chart, data grid, MSD, astrometrics, layout,
 * alert overlay): every tab of its config panel, each control set to what it shows, then
 * Save. The working copy after each control, and the saved config, must keep every key.
 * @param {{ tag: string, config: Record<string, any> }} args - the studio's element name
 * @returns {Promise<{ tabs: string[], controls: number, lost: any[], changed: any[], added: string[], errors: string[], saved: boolean }>}
 */
export async function sweepStudio({ tag, config }) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const clone = (v) => JSON.parse(JSON.stringify(v));
    const deep = (root) => [...root.querySelectorAll('*')].flatMap((e) => [e, ...(e.shadowRoot ? deep(e.shadowRoot) : [])]);
    const diff = (a, b, at = '', out = { lost: [], changed: [] }) => {
        if (a && typeof a === 'object' && !Array.isArray(a)) {
            for (const k of Object.keys(a)) {
                const p = at ? `${at}.${k}` : k;
                if (!b || typeof b !== 'object' || !(k in b)) out.lost.push(p);
                else diff(a[k], b[k], p, out);
            }
        } else if (Array.isArray(a)) {
            if (!Array.isArray(b)) out.changed.push({ path: at, from: a, to: b });
            else if (a.length !== b.length) out.changed.push({ path: at, from: `${a.length} items`, to: `${b.length} items` });
            else a.forEach((v, i) => diff(v, b[i], `${at}[${i}]`, out));
        } else if (JSON.stringify(a) !== JSON.stringify(b)) out.changed.push({ path: at, from: a, to: b });
        return out;
    };
    const errors = [];
    const onError = (e) => errors.push(String(e.message ?? e.reason ?? e));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    await customElements.whenDefined(tag);
    const studio = /** @type {any} */ (document.createElement(tag));
    studio.hass = window.__hass;
    studio.config = clone(config);
    document.body.appendChild(studio);
    await studio.updateComplete;
    await sleep(300);
    // The astrometrics preview stops drawing off screen. Without a GPU (CI) each WebGL
    // frame is drawn in software and every control waited behind them: about 0.5 s a
    // control, 2 minutes a fixture. Hidden, it still takes each config, so errors show.
    const preview = studio.shadowRoot.querySelector('.preview-panel');
    if (preview && tag === 'lcards-astrometrics-studio-dialog') preview.style.display = 'none';
    const original = clone(config);
    // A studio normalises on open (a data grid's short rows become objects): each control
    // is checked against that working copy, and the saved config against the original.
    const baseline = clone(studio._workingConfig ?? {});
    const lost = [];
    const changed = [];
    let controls = 0;
    const tabs = [...studio.shadowRoot.querySelectorAll('ha-tab-group-tab')].map((t) => t.getAttribute('value')).filter((v) => v && !/yaml/i.test(v));
    for (const tab of tabs) {
        studio._activeTab = tab;
        await studio.updateComplete;
        await sleep(150);
        const panel = () => studio.shadowRoot.querySelector('.config-panel') ?? studio.shadowRoot;
        for (let pass = 0; pass < 2; pass++) {
            for (const s of deep(panel()).filter((e) => e.tagName === 'LCARDS-FORM-SECTION' || e.tagName === 'HA-EXPANSION-PANEL')) {
                if (s.expanded === false) { s.expanded = true; await s.updateComplete; }
            }
            await sleep(80);
        }
        const found = deep(panel()).filter((e) =>
            (e.tagName === 'HA-SELECTOR' && !e.selector?.select && !('boolean' in (e.selector ?? {})))
            || e.tagName === 'LCARDS-COLOR-PICKER');
        for (const el of found) {
            if (!el.isConnected) continue;
            controls++;
            const by = `${tab} › ${el.label || (el.selector && Object.keys(el.selector)[0]) || el.tagName.toLowerCase()}`;
            const before = errors.length;
            try {
                el.dispatchEvent(new CustomEvent('value-changed', { detail: { value: el.value }, bubbles: true, composed: true }));
                await sleep(0);
                await studio.updateComplete;
            } catch (e) {
                errors.push(String(e?.message ?? e));
            }
            for (let i = before; i < errors.length; i++) errors[i] = `${by}: ${errors[i]}`;
            const d = diff(baseline, clone(studio._workingConfig ?? {}));
            for (const p of d.lost) lost.push({ path: p, by });
            for (const c of d.changed) changed.push({ ...c, by });
            if (d.lost.length || d.changed.length || errors.length > before) {
                studio._workingConfig = clone(baseline);
                try { await studio.updateComplete; } catch { /* a broken render is already recorded */ }
            }
        }
    }
    // Save: what the card receives must keep every key too
    let savedConfig = null;
    studio.addEventListener('config-changed', (e) => { savedConfig = clone(e.detail.config); });
    (studio._handleSave ?? studio._save)?.call(studio);
    await sleep(50);
    if (savedConfig) {
        const d = diff(original, savedConfig);
        for (const p of d.lost) lost.push({ path: p, by: 'Save' });
        for (const c of d.changed) changed.push({ ...c, by: 'Save' });
    }
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onError);
    studio.remove();
    return { tabs, controls, lost, changed, added: [], errors, saved: !!savedConfig };
}
