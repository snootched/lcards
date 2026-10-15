/**
 * The machine-readable files the docs site publishes for LLMs and tools are
 * reachable on the built site (under the channel's base): the schema bundle,
 * the split schemas and their index, the registries, the standalone config
 * checker, and llms.txt / llms-full.txt.
 */
import { test, expect } from './support.js';

test('schemas, registries and the config checker are published', async ({ request }) => {
    const index = await request.get('/schema/index.json');
    expect(index.ok()).toBe(true);
    const idx = await index.json();
    for (const section of ['cards', 'views', 'strategies', 'shared']) {
        for (const info of Object.values(idx[section])) {
            expect((await request.get(`/schema/${info.file}`)).ok(), info.file).toBe(true);
        }
    }
    expect(idx.cards['lcards-msd-card']).toBeTruthy();
    const registries = await (await request.get(`/schema/${idx.registries.file}`)).json();
    expect(registries.button_presets).toContain('lozenge');
    const bundle = await (await request.get('/lcards-schema.json')).json();
    expect(Object.keys(bundle.cards)).toContain('lcards-msd-card');
    const tool = await request.get('/tools/lcards-validate.mjs');
    expect(tool.ok()).toBe(true);
    expect((await tool.text()).startsWith('#!/usr/bin/env node')).toBe(true);
});

test('llms.txt and llms-full.txt are published and point at this channel', async ({ request }) => {
    const { DOCS_BASE } = await import('./support.js');
    const txt = await (await request.get('/llms.txt')).text();
    expect(txt.startsWith('# LCARdS')).toBe(true);
    expect(txt).toContain(`https://lcards.unimatrix01.ca${DOCS_BASE}schema/index.json`);
    const full = await request.get('/llms-full.txt');
    expect(full.ok()).toBe(true);
    expect(await full.text()).toContain('# Button Card');
});
