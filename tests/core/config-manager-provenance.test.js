/**
 * CoreConfigManager provenance: every theme: value resolved during the merge is
 * recorded with its field path, the reference written, and the token path the
 * component-scoped resolver actually used.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreConfigManager } from '../../src/core/config-manager/index.js';
import { ThemeTokenResolver } from '../../src/core/themes/ThemeTokenResolver.js';

async function manager() {
    const resolver = new ThemeTokenResolver({
        colors: { ui: { primary: 'var(--lcards-orange)' } },
        components: { button: { radius: 12 } },
    });
    const cm = new CoreConfigManager();
    await cm.initialize({
        validationService: { validate: () => ({ valid: true, errors: [], warnings: [] }) },
        themeManager: { initialized: true, resolver, getDefault: () => null },
        stylePresetManager: null,
    });
    return cm;
}

test('theme: values resolved in the merge are recorded with field paths', async () => {
    const cm = await manager();
    const result = await cm.processConfig({
        type: 'custom:lcards-button',
        style: { card: { color: { background: { active: 'theme:colors.ui.primary' } } }, border: { radius: 'theme:radius' } },
    }, 'button', {});
    assert.equal(result.mergedConfig.style.card.color.background.active, 'var(--lcards-orange)');
    assert.deepEqual(result.provenance.theme_refs, [
        { field: 'style.card.color.background.active', ref: 'theme:colors.ui.primary', path: 'colors.ui.primary', value: 'var(--lcards-orange)' },
        { field: 'style.border.radius', ref: 'theme:radius', path: 'components.button.radius', value: 12 },
    ]);
});

test('theme: values inside lists are recorded (not resolved: the card resolves those)', async () => {
    const cm = await manager();
    const result = await cm.processConfig({
        type: 'custom:lcards-slider',
        style: { ranges: [{ min: 0, color: 'theme:colors.ui.primary', label: { color: 'theme:colors.ui.primary' } }], series: ['theme:colors.ui.primary'] },
    }, 'slider', {});
    assert.equal(result.mergedConfig.style.ranges[0].color, 'theme:colors.ui.primary');
    assert.deepEqual(result.provenance.theme_refs.map(r => [r.field, r.deferred]), [
        ['style.ranges[0].color', true],
        ['style.ranges[0].label.color', true],
        ['style.series[0]', true],
    ]);
});
