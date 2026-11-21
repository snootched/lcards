/**
 * lcards-layout-debug.js: LCARdS Layout View diagnostic tool
 *
 * A browser-console paste script, not a Node script: nothing in the build or the
 * tests runs it. It reports how an lcards-layout-view sized its grid: the host
 * and grid heights, every row and column's active track (with any matching
 * mediaquery) against its computed px size, the cards with a Visibility condition
 * and whether each is hidden (see doc/architecture/layout-view.md "Collapsing rows
 * and columns"), unexpected 0px tracks, and the LCARdS version. Use it when a
 * layout view's rows or columns collapse, overflow or ignore a visibility toggle.
 *
 * Paste the entire contents of this file into the browser console on any HA
 * dashboard that uses custom:lcards-layout-view.
 *
 * TIP: If the script reports "lcards-layout-view not found", use Chrome DevTools:
 *   1. Open the Elements panel.
 *   2. Click on the lcards-layout-view element in the tree.
 *   3. Paste the script: it will automatically use your selected element ($0).
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
    const hostH   = view.getBoundingClientRect().height;
    const gridCS  = getComputedStyle(grid);
    const rowGap  = parseFloat(gridCS.rowGap) || 0;
    const active  = view._activeTracks?.() ?? { rows: [], columns: [] };
    const cards   = view._visibilityCards ?? [];
    const areas   = active.areas ?? [];
    const px      = (list) => list.split(/\s+/).map(v => parseFloat(v) || 0);
    const rowsPx  = px(gridCS.gridTemplateRows);
    const colsPx  = px(gridCS.gridTemplateColumns);
    const rowSum  = rowsPx.reduce((t, v) => t + v, 0) + (rowsPx.length - 1) * rowGap;
    const delta   = hostH - rowSum;

    /** Indexes of the rows (axis 'r') or columns ('c') an area covers. */
    const span = (area, axis) => {
        const hits = new Set();
        areas.forEach((row, r) => row.forEach((name, c) => { if (name === area) hits.add(axis === 'r' ? r : c); }));
        return [...hits];
    };
    const hiddenTrack = (axis, i) => cards.some(c => c.conditional && c.cardEl?.hidden && span(c.area, axis).length === 1 && span(c.area, axis)[0] === i);

    // ── 3. Print report ──────────────────────────────────────────────────────
    console.group('%c[lcards layout audit]', 'font-weight:bold;color:#37a6d1');
    console.log(`Host height   : ${hostH}px   (layout.height: ${view._config?.layout?.height ?? 'default, the screen below the header'})`);
    console.log(`Grid overflow : ${gridCS.overflowY}`);
    console.log(
        `%cRows + gaps   : ${rowSum.toFixed(1)}px, ${Math.abs(delta) < 2 ? '✓ the grid fills the view' : `✗ ${delta.toFixed(1)}px off (scrolls or leaves space)`}`,
        Math.abs(delta) < 2 ? 'color:green' : 'color:red;font-weight:bold'
    );

    console.log('');
    const conditional = cards.filter(c => c.conditional);
    if (conditional.length) {
        console.log('Cards with a Visibility condition:');
        for (const c of conditional) {
            console.log(`  ${c.area.padEnd(16)} ${c.cardEl?.hidden ? '○ hidden' : '✓ shown'}   rows ${span(c.area, 'r').join(',')}  columns ${span(c.area, 'c').join(',')}${c.targetHeight ? `   height ${c.targetHeight}` : ''}`);
        }
    } else {
        console.log('No cards with a Visibility condition.');
    }

    for (const [label, axis, tracks, computed] of [['Rows', 'r', active.rows, rowsPx], ['Columns', 'c', active.columns, colsPx]]) {
        console.log('');
        console.log(`${label}:`);
        (tracks ?? []).forEach((track, i) => {
            const size = computed[i] ?? 0;
            const note = size === 0 && track !== '0px'
                ? (hiddenTrack(axis, i) ? '  ← collapsed (hidden card)' : '  ← %c0px, not by a hidden card')
                : '';
            if (note.includes('%c')) console.warn(`  [${i}] "${track}" = ${size.toFixed(1)}px${note.replace('%c', '')}`);
            else console.log(`  [${i}] "${track}" = ${size.toFixed(1)}px${note}`);
        });
    }

    // LCARdS version
    const ver = window.lcards?.version ?? '(unknown)';
    console.log(`LCARdS version : ${ver}`);

    console.groupEnd();
})();
