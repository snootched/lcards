/**
 * The HA-LCARS and UIX snapshots the user skill and the checker read
 * (scripts/sync-ha-lcars.js, scripts/sync-uix-docs.js): the parsers on small inputs in
 * each upstream format, and the committed snapshots hang together.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePalette, parseDefaults, parseTheme, parseVarNames, parseHelpers, readmeGuide } from '../../scripts/sync-ha-lcars.js';
import { cleanUixPage, UIX_PAGES } from '../../scripts/sync-uix-docs.js';
import { loadHaLcars } from '../../scripts/lib/ha-lcars-reference.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

test('HA-LCARS palette: entries under their comment headers, trailing notes kept, cNN codes dropped', () => {
    const palette = parsePalette([
        '# header',
        '(DO NOT USE/MODIFY)=== LCARS variables: &lcars-variables',
        '  lcars-green: "#33cc99"',
        '  lcars-aqua: "#88ffff" # lcars-c44',
        '',
        '  # Shapes',
        '  lcars-vertical-border: 35px',
        '  lcars-text-dark: "#000000" # L*=0 \u2014 pure black',
        '(DO NOT USE/MODIFY)=== Base customizations: &base',
        '  lcars-not-palette: red',
    ].join('\n'));
    assert.deepEqual(palette, [
        { name: 'lcars-green', value: '#33cc99', group: 'LCARS colours' },
        { name: 'lcars-aqua', value: '#88ffff', group: 'LCARS colours' },
        { name: 'lcars-vertical-border', value: '35px', group: 'Shapes' },
        { name: 'lcars-text-dark', value: '#000000', group: 'Shapes', note: 'L*=0: pure black' },
    ]);
});

test('HA-LCARS defaults: description from the comment above, section headers, light/dark modes', () => {
    const { roles, modes } = parseDefaults([
        '# Default values applied to every theme',
        '',
        '# UI Colors',
        '# sidebar background; app header background',
        'lcars-ui-primary: var(--lcars-almond-creme)',
        '# text on the sidebar',
        'lcars-ui-primary-text: var(--lcars-text-dark)',
        '',
        '# Card colors',
        '# top bar background',
        'lcars-card-top-color: var(--lcars-bluey)',
        'lcars-settings-card-color: "#727295"',
        '',
        'modes:',
        '  light:',
        '    lcars-ui-mix-color: black',
        '  dark:',
        '    lcars-ui-mix-color: white',
    ].join('\n'));
    assert.deepEqual(roles, [
        { name: 'lcars-ui-primary', default: 'var(--lcars-almond-creme)', section: 'UI Colors', description: 'sidebar background; app header background' },
        { name: 'lcars-ui-primary-text', default: 'var(--lcars-text-dark)', section: 'UI Colors', description: 'text on the sidebar' },
        { name: 'lcars-card-top-color', default: 'var(--lcars-bluey)', section: 'Card colors', description: 'top bar background' },
        { name: 'lcars-settings-card-color', default: '#727295', section: 'Card colors' },
    ]);
    assert.deepEqual(modes, { light: { 'lcars-ui-mix-color': 'black' }, dark: { 'lcars-ui-mix-color': 'white' } });
});

test('HA-LCARS themes, variable names and helpers', () => {
    assert.deepEqual(parseTheme('default.yaml', 'name: LCARS Default\nlcars-ui-primary: var(--lcars-red)\nmodes:\n  dark:\n    lcars-card-bottom-text: var(--lcars-text-dark)\n'), {
        name: 'LCARS Default', file: 'default.yaml', vars: { 'lcars-ui-primary': 'var(--lcars-red)' },
        modes: { dark: { 'lcars-card-bottom-text': 'var(--lcars-text-dark)' } },
    });
    assert.deepEqual(parseVarNames('LCARS X:\n  lcars-red: "#d44"\n  modes:\n    dark:\n      lcars-mix: white\n  card-mod-css: |\n    :host { --lcars-sound: 1; color: var(--lcars-used-only); }\n'),
        ['lcars-mix', 'lcars-red', 'lcars-sound'], 'keys at any depth and CSS declarations; a var() use is not a definition');
    assert.deepEqual(parseHelpers([
        '#### IV. Create the helper entities',
        'Create these helper entities:',
        '- LCARS Sound (entity id should be `input_boolean.lcars_sound`)',
        '  - Toggles button and tap sounds',
        '- Optional: LCARS Header (entity id should be `sensor.lcars_header`)',
        '  - Add text to the clock area',
        '',
        '### Install the theme',
    ].join('\n')), [
        { entity_id: 'input_boolean.lcars_sound', name: 'LCARS Sound', optional: false, notes: ['Toggles button and tap sounds'] },
        { entity_id: 'sensor.lcars_header', name: 'LCARS Header', optional: true, notes: ['Add text to the clock area'] },
    ]);
});

test('HA-LCARS README guide: install to known issues, layout HTML and images gone, YAML kept', () => {
    const md = readmeGuide([
        '# Home Assistant LCARS', '## Examples', '<img src="x.png" />',
        '## Installation instructions', 'Install UIX \u2014 the successor.',
        '<a id="converting"></a>', '<details>', '<summary><b>Converting</b> (click to expand)</summary>', 'Steps', '</details>',
        '1. `header-left` - top bar', '<table>', '<tr>', '<td> YAML </td> <td> Result </td>', '</tr>', '<tr>', '<td>', '    ',
        '    ```yaml', 'type: markdown', 'uix:', '  class: header-left', '```', '', '</td>', '<td>', '<img width="350" src="y.png" />', '</td>', '</tr>', '</table>',
        'Tungsten[^1] font.',
        '## Acknowledgements', 'Thanks',
    ].join('\n'));
    assert.ok(md.startsWith('## Installation instructions\nInstall UIX: the successor.'));
    assert.ok(md.includes('**Converting**') && md.includes('```yaml\ntype: markdown\nuix:\n  class: header-left\n```'));
    assert.ok(!/<|Acknowledgements|Examples|\[\^1\]/.test(md), md);
});

test('UIX pages: admonitions and tabs become plain blocks, images and attribute lists go, links point inside or at the site', () => {
    const md = cleanUixPage([
        '---', 'description: x', '---', '', '# Styling cards',
        '!!! note inline end "Card-mod users"', '    See the [FAQ](../faq.md).', '',
        'Body \u2014 text with ![pic](../assets/a.png){ width="500" } and `{.prop=val}`.',
        '=== "YAML"', '    ```yaml', '    uix:', '      style: x', '    ```', '',
        '[Forge](../forge/index.md) [dom](../concepts/dom.md#path) [broker](/broker/)',
        '[](https://my.home-assistant.io/redirect/x)',
    ].join('\n'), 'using/cards.md');
    assert.equal(md, [
        '# Styling cards', '**Card-mod users:**', '', 'See the [FAQ](../faq.md).', '',
        'Body: text with  and `{.prop=val}`.', '**YAML**', '', '```yaml', 'uix:', '  style: x', '```', '',
        '[Forge](https://uix.lf.technology/forge/) [dom](../concepts/dom.md#path) [broker](https://uix.lf.technology/broker/)', '',
    ].join('\n'));
});

test('committed snapshots hang together: roles are real names, every UIX page present', () => {
    const { snapshot, guide } = loadHaLcars();
    const vars = new Set(snapshot.vars);
    assert.ok(snapshot.vars.length > 150 && snapshot.themes.length >= 20 && snapshot.helpers.length >= 4);
    for (const r of snapshot.roles.filter(x => x.name.startsWith('lcars-'))) assert.ok(vars.has(r.name), r.name);
    for (const p of snapshot.palette.filter(x => x.name.startsWith('lcars-'))) assert.ok(vars.has(p.name), p.name);
    assert.ok(['LCARS Default', 'LCARS Picard [LCARdS Red Accent]'].every(n => snapshot.themes.some(t => t.name === n)));
    assert.match(guide, /uix:\n\s+class: header-left/);
    for (const page of UIX_PAGES) assert.ok(existsSync(join(ROOT, 'scripts/data/uix', page)), page);
    const meta = JSON.parse(readFileSync(join(ROOT, 'scripts/data/uix/meta.json'), 'utf8'));
    assert.deepEqual(meta.pages, UIX_PAGES, 'meta.json lists the pages the sync script ships');
});
