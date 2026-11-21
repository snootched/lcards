/**
 * The console at the default `info` level stays quiet: info is for one line when
 * the core is ready, user actions and backend events. Anything that runs per card,
 * per render or as startup detail logs at debug (2026-11-17: flipping through the
 * Live Demo boards flooded the console with "Card registered" and MSD pipeline lines).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** Files that run per card or per render: no lcardsLog.info at all. */
const PER_CARD = [
    'src/msd/pipeline/PipelineCore.js',
    'src/msd/pipeline/MsdCardCoordinator.js',
    'src/msd/renderer/AdvancedRenderer.js',
    'src/core/packs/backgrounds/BackgroundAnimationRenderer.js',
    'src/core/packs/backgrounds/renderers/Canvas2DRenderer.js',
    'src/core/astrometrics/model/index.js',
    'src/core/assets/AssetManager.js',
    'src/core/themes/paletteInjector.js',
    'src/core/components/ComponentManager.js',
    'src/core/PackManager.js',
    'src/core/validation-service/index.js',
    'src/editor/components/editors/lcards-multi-text-editor-v2.js',
];

test('per-card and startup-detail code logs below info', () => {
    for (const file of PER_CARD) {
        const src = readFileSync(file, 'utf8');
        assert.ok(!src.includes('lcardsLog.info('), `${file} logs at info; use lcardsLog.debug`);
    }
});

test('the core logs card registration at debug, and only its ready line at info', () => {
    const src = readFileSync('src/core/lcards-core.js', 'utf8');
    const infos = src.match(/lcardsLog\.info\([^)]*/g) ?? [];
    assert.deepEqual(infos.map((s) => s.includes('Core systems initialized')), [true],
        `lcards-core.js info lines: ${infos.join(' | ')}`);
});
