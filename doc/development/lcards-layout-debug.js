/**
 * lcards-layout-debug.js — LCARdS Layout View diagnostic tool
 *
 * Paste the entire contents of this file into the browser console on any HA
 * dashboard that uses custom:lcards-layout-view.
 *
 * TIP: If the script reports "lcards-layout-view not found", use Chrome DevTools:
 *   1. Open the Elements panel.
 *   2. Click on the lcards-layout-view element in the tree.
 *   3. Paste the script — it will automatically use your selected element ($0).
 *
 * Run it in multiple states to verify correct behaviour:
 *   - Visibility boolean ON  (e.g. top bar visible)
 *   - Visibility boolean OFF (e.g. top bar hidden)
 *   - After resizing the browser window
 *   - After toggling the HA sidebar
 */
(function lcardsDiag() {
    // ── 1. Find the view element, piercing all shadow roots ─────────────────
    function deepQuery(root, selector) {
        const hit = root.querySelector(selector);
        if (hit) return hit;
        for (const el of root.querySelectorAll('*')) {
            if (el.shadowRoot) {
                const found = deepQuery(el.shadowRoot, selector);
                if (found) return found;
            }
        }
        return null;
    }

    // Prefer a selected element in DevTools (works when the view is buried in shadow roots).
    let view = (typeof $0 !== 'undefined' && $0?.tagName?.toLowerCase() === 'lcards-layout-view')
        ? $0
        : deepQuery(document, 'lcards-layout-view');

    if (!view) {
        console.error(
            '[lcards-diag] lcards-layout-view not found.\n' +
            'In Chrome DevTools Elements panel: click the lcards-layout-view element, then re-run.'
        );
        return;
    }

    const grid = view.shadowRoot?.querySelector('#grid-root');
    if (!grid) { console.error('[lcards-diag] #grid-root not found in shadow DOM.'); return; }

    // ── 2. Gather data ───────────────────────────────────────────────────────
    const hostH    = view.getBoundingClientRect().height;
    const gridCS   = getComputedStyle(grid);
    const gap      = parseFloat(gridCS.rowGap) || 0;
    const baseRows = view._baseRows ?? [];
    const visRows  = view._visibilityRows ?? [];
    const hass     = view._hass;

    const computedRows = gridCS.gridTemplateRows.split(/\s+/).map(v => parseFloat(v) || 0);
    const rowSum       = computedRows.reduce((s, v) => s + v, 0);
    const gapTotal     = (computedRows.length - 1) * gap;
    const delta        = hostH - rowSum - gapTotal;
    const deltaOk      = Math.abs(delta) < 2;

    // ── 3. Print report ──────────────────────────────────────────────────────
    console.group('%c[lcards layout audit]', 'font-weight:bold;color:#37a6d1');

    // Overall size check
    console.log(`Host height   : ${hostH}px`);
    console.log(`Host inline h : ${view.style.height || '(none)'}`);
    console.log(`Grid inline h : ${grid.style.height || '(none)'}`);
    console.log(`Grid overflow : ${gridCS.overflowY}`);
    console.log(`Row count     : ${computedRows.length}   gap: ${gap}px   gap-total: ${gapTotal}px`);
    console.log(`Row sum       : ${rowSum.toFixed(2)}px`);
    console.log(`Gap-adj sum   : ${(rowSum + gapTotal).toFixed(2)}px`);
    console.log(
        `%cDelta (≈0 = ✓): ${delta.toFixed(2)}px  ${deltaOk ? '✓ PASS' : '✗ OVERFLOW/UNDERFLOW'}`,
        deltaOk ? 'color:green' : 'color:red;font-weight:bold'
    );

    // Visibility rows
    if (visRows.length) {
        console.log('');
        console.log('Visibility-controlled rows:');
        for (const { rowIndex, entity, expectedState, targetHeight } of visRows) {
            const state  = hass?.states?.[entity]?.state ?? '(unknown)';
            const active = state === expectedState;
            console.log(
                `  %c[row ${rowIndex}]%c ${entity} = "${state}"  (want "${expectedState}") → ${active ? targetHeight : '0px'}  ${active ? '✓ ON' : '○ OFF'}`,
                active ? 'color:green' : 'color:orange',
                'color:inherit'
            );
        }
    } else {
        console.log('');
        console.log('No visibility-controlled rows detected.');
        if (baseRows.length === 0) console.warn('  _baseRows is empty — has setConfig() run?');
    }

    // Per-row breakdown
    console.log('');
    console.log('Row breakdown:');
    (baseRows.length ? baseRows : computedRows.map(() => '?')).forEach((base, i) => {
        const px     = computedRows[i] ?? '?';
        const isFR   = /^[0-9.]+fr$/.test(String(base));
        const visHit = visRows.find(v => v.rowIndex === i);
        let note = '';
        if (visHit) {
            const state  = hass?.states?.[visHit.entity]?.state ?? '?';
            const active = state === visHit.expectedState;
            note = `  ← vis ${active ? '✓' : '○'}  ${visHit.entity}="${state}"`;
        } else if (isFR) {
            const expected = hostH - (rowSum - px) - gapTotal;
            const match = Math.abs(px - expected) < 2;
            note = `  ← fr  computed=${px.toFixed(1)}px  expected=${expected.toFixed(0)}px  ${match ? '✓' : '✗'}`;
        }
        console.log(`  [${i}]  base="${base}"   computed=${typeof px === 'number' ? px.toFixed(2) : px}px${note}`);
    });

    // Unexpected 0px rows
    console.log('');
    const unexpected = baseRows
        .map((b, i) => ({ i, b, px: computedRows[i] }))
        .filter(({ b, i, px }) => px === 0 && b !== '0px' && !visRows.find(v => v.rowIndex === i));
    if (unexpected.length) {
        console.warn('%cUnexpected 0px rows (not visibility-controlled):', 'color:red');
        unexpected.forEach(({ i, b }) => console.warn(`  [${i}] base="${b}"`));
    } else {
        console.log('No unexpected 0px rows ✓');
    }

    // ResizeObserver wired?
    console.log('');
    const hasRO = !!view._hostResizeObserver;
    console.log(`ResizeObserver : ${hasRO ? '✓ connected' : '✗ NOT present — resize will not update rows'}`);

    // LCARdS version
    const ver = window.lcards?.version ?? '(unknown)';
    console.log(`LCARdS version : ${ver}`);

    console.groupEnd();
})();
