/**
 * Every Live Demo view is usable: its controls are big enough to use, and no two text
 * fields of a card overlap. One page load per view checks both.
 *
 * Controls (2026-11-19, the user: a Radar scope slider was too short to drag): every
 * slider that can be dragged has at least 100 px along its track and 20 px across it
 * (12-column sliders with a 140 px label band left 56 to 143 px), and every button with
 * an action is at least 24 x 24 px.
 *
 * Text: no two text fields of a card overlap on any Live Demo view (every release's public
 * views, the dashboard gallery's dashboards among them). A preset puts each field in
 * its own place; a view that moves one onto another (state: center-right on an outline
 * button, whose name sits at right) draws the two on top of each other (2026-11-17:
 * BY RANGE in Button states, RED ALERT in Confirmation).
 *
 * Boxes are trimmed by a fifth top and bottom: an SVG text box includes the space
 * above and below the glyphs, so labels stacked by design (a ring's name over its
 * value, the alert symbol's ALERT over CONDITION) touch only in that space.
 */
import { loadDemo, boardReleases } from '../../scripts/lib/demo-dashboard.js';
import { test, expect } from './support.js';

const VIEWS = boardReleases(loadDemo(), { board: 'public' })
    .flatMap(r => r.views)
    .sort((a, b) => a.rank - b.rank);

for (const view of VIEWS) {
    // Heavy views draw WebGL: locally only (CI has no GPU, as support.js gpuTag)
    test(`usable controls, no overlapping text: ${view.path}`, view.heavy ? { tag: '@gpu' } : {}, async ({ page }) => {
        await page.goto('/getting-started/live-demo');
        await expect(page.locator('.demo-board-topic').first()).toHaveAttribute('aria-expanded', 'true');
        await page.waitForFunction(() => document.querySelector('.demo-board-poster, .demo-board-stage[data-ready]'));
        const topic = page.locator(`.demo-board-topic[data-topic="${view.topic}"]`);
        if (await topic.getAttribute('aria-expanded') !== 'true') await topic.click();
        await page.locator(`.demo-board-topic-views button[data-view="${view.path}"]`).click();
        if (view.heavy) await page.locator('.demo-board-load').click();
        await page.waitForFunction((p) => document.querySelector('.demo-board-stage')?.dataset.ready === p, view.path, { timeout: 45_000 });
        // templates and fitted text settle after the mount
        await page.waitForTimeout(2500);

        const overlaps = await page.evaluate(() => {
            const found = [];
            const shown = (el) => {
                for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
                    const cs = getComputedStyle(e);
                    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false;
                }
                return true;
            };
            const visit = (root) => {
                const boxes = [...root.querySelectorAll('text[data-field-id]')]
                    .filter(t => !t.dataset.fieldId.endsWith('-bg') && t.textContent.trim() && shown(t))
                    .map(t => {
                        const b = t.getBoundingClientRect();
                        const pad = b.height * 0.2;
                        return { name: `${t.dataset.fieldId} "${t.textContent.trim().slice(0, 30)}"`, l: b.left, r: b.right, t: b.top + pad, b: b.bottom - pad };
                    })
                    .filter(x => x.r > x.l && x.b > x.t);
                for (let i = 0; i < boxes.length; i++) {
                    for (let j = i + 1; j < boxes.length; j++) {
                        const a = boxes[i], c = boxes[j];
                        const w = Math.min(a.r, c.r) - Math.max(a.l, c.l);
                        const h = Math.min(a.b, c.b) - Math.max(a.t, c.t);
                        if (w <= 2 || h <= 2) continue;
                        const smaller = Math.min((a.r - a.l) * (a.b - a.t), (c.r - c.l) * (c.b - c.t));
                        if (w * h / smaller > 0.1) found.push(`${a.name} overlaps ${c.name}`);
                    }
                }
                for (const el of root.querySelectorAll('*')) if (el.shadowRoot) visit(el.shadowRoot);
            };
            visit(document.querySelector('.demo-board-stage'));
            return found;
        });
        expect(overlaps, `text fields drawn on top of each other in ${view.path}`).toEqual([]);

        const small = await page.evaluate(() => {
            const found = [];
            const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
            const visit = (root) => {
                for (const el of root.querySelectorAll('*')) {
                    if (el.tagName === 'LCARDS-SLIDER' && el.shadowRoot && !el._controlConfig?.locked) {
                        const track = el.shadowRoot.querySelector('.slider-input-overlay, .ring-overlay');
                        if (track && visible(track)) {
                            const r = track.getBoundingClientRect();
                            const ring = track.classList.contains('ring-overlay');
                            const along = ring ? Math.min(r.width, r.height) : Math.max(r.width, r.height);
                            const across = Math.min(r.width, r.height);
                            const name = el.config?.text?.name?.content || el.config?.entity;
                            if (along < 100 || across < 20) found.push(`slider ${name}: ${Math.round(r.width)} x ${Math.round(r.height)} px`);
                        }
                    }
                    if (el.tagName === 'LCARDS-BUTTON' && el.config && visible(el)) {
                        const acts = ['tap_action', 'hold_action', 'double_tap_action'].some(k => el.config[k] && el.config[k].action !== 'none');
                        if (acts) {
                            const r = el.getBoundingClientRect();
                            if (r.width < 24 || r.height < 24) found.push(`button ${el.config?.text?.name?.content || el.config?.entity || ''}: ${Math.round(r.width)} x ${Math.round(r.height)} px`);
                        }
                    }
                    if (el.shadowRoot) visit(el.shadowRoot);
                }
            };
            visit(document.querySelector('.demo-board-stage'));
            return found;
        });
        expect(small, `controls too small to use in ${view.path}`).toEqual([]);
    });
}
