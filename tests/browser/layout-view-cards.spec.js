/**
 * Home Assistant assigns `cards` to a view several times while it builds, often
 * with the same element instances (#409). The layout view keeps cards that are
 * already in place: no disconnect and reconnect (every LCARdS card would tear
 * down and render again), and only a changed list moves cards.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

test('assigning the same cards again reconnects none; a changed list moves only what changed', async ({ page }) => {
    await mountCase(page, 'button-lozenge'); // loads the bundle
    const log = await page.evaluate(async () => {
        const log = [];
        if (!customElements.get('count-card')) {
            customElements.define('count-card', class extends HTMLElement {
                connectedCallback() { log.push(`+${this.id}`); }
                disconnectedCallback() { log.push(`-${this.id}`); }
            });
        }
        window.__log = log;
        document.getElementById('mount').innerHTML = '';
        const config = {
            type: 'custom:lcards-layout-view',
            layout: {
                'grid-template-columns': '1fr 1fr',
                'grid-template-areas': '"a b"',
                areas: { a: { background: 'var(--lcards-gray-darkest)' } },
            },
            cards: ['a', 'b', 'a'].map((area) => ({ type: 'custom:count-card', view_layout: { 'grid-area': area } })),
        };
        const view = document.createElement('lcards-layout-view');
        view.setConfig(config);
        const cards = config.cards.map((c, i) => Object.assign(document.createElement('count-card'), { id: `c${i}`, config: c }));
        view.cards = cards;
        view.lovelace = { editMode: false, config: { views: [config] }, saveConfig: async () => {} };
        window.__view = view;
        window.__cards = cards;
        document.body.appendChild(view);
        await view.updateComplete;
        await new Promise((r) => setTimeout(r, 200));
        log.length = 0;
        view.cards = cards;
        view.cards = [...cards];
        await new Promise((r) => setTimeout(r, 50));
        return [...log];
    });
    expect(log).toEqual([]);

    const after = await page.evaluate(async () => {
        const view = window.__view;
        const [c0, , c2] = window.__cards;
        const c3 = Object.assign(document.createElement('count-card'), { id: 'c3', config: { type: 'custom:count-card', view_layout: { 'grid-area': 'b' } } });
        window.__log.length = 0;
        view.cards = [c0, c2, c3];
        await new Promise((r) => setTimeout(r, 50));
        const grid = view.shadowRoot.querySelector('#grid-root');
        return {
            log: [...window.__log].sort(),
            children: [...grid.children].map((el) => el.id || el.className),
            gridArea: c3.style.gridArea,
        };
    });
    expect(after.log).toEqual(['+c3', '-c1']);
    expect(after.children).toEqual(['area-surface', 'c0', 'c2', 'c3']);
    expect(after.gridArea).toBe('b');
});
