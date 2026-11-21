#!/usr/bin/env node
/**
 * Writes the dev board's routing lab view (demo/views/msd-routing-lab.yaml) from the
 * scenes in tests/routing/lab-scenes.js: one framed MSD per scene with a note on what
 * it should look like. tests/routing/routing-lab.test.js routes the same scenes and
 * checks the view is up to date (`--check`).
 *
 *   node scripts/make-routing-lab.mjs          # write the view
 *   node scripts/make-routing-lab.mjs --check  # exit 1 when the view is stale
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { LAB_SCENES, LAB_COLORS, LAB_LINE_WIDTH } from '../tests/routing/lab-scenes.js';

export const LAB_VIEW = fileURLToPath(new URL('../demo/views/msd-routing-lab.yaml', import.meta.url));

/** One scene as an MSD card config. */
export function sceneCard(scene) {
    const anchors = {};
    const overlays = [];
    for (const ob of scene.obstacles ?? []) {
        overlays.push({
            id: ob.id, type: 'control', position: ob.at, size: ob.size, obstacle: true,
            card: { type: 'custom:lcards-button', preset: 'panel-dark', interactive: false, text: { label: { content: ob.label ?? '' } } },
        });
    }
    for (const [id, ch] of Object.entries(scene.channels ?? {})) {
        const [x, y, w, h] = ch.bounds;
        overlays.push({ id: `band_${id}`, type: 'shape', kind: 'rect', position: [x, y], size: [w, h], z_index: 10, style: { color: 'var(--lcards-orange)', width: 1, fill: 'var(--lcards-orange)', fill_opacity: 0.2 } });
    }
    scene.lines.forEach((line, i) => {
        const { id, from, to, color, ...keys } = line;
        anchors[`${id}_a`] = from;
        anchors[`${id}_b`] = to;
        const dot = color ?? LAB_COLORS[i % LAB_COLORS.length];
        for (const [end, p] of [['a', from], ['b', to]]) {
            overlays.push({ id: `${id}_${end}_dot`, type: 'shape', kind: 'circle', position: [p[0] - 4, p[1] - 4], size: [8, 8], style: { color: dot, fill: dot } });
        }
        overlays.push({ id, type: 'line', anchor: `${id}_a`, attach_to: `${id}_b`, route: 'auto', corner_style: 'round', ...keys, style: { color: dot, width: LAB_LINE_WIDTH } });
    });
    return {
        type: 'custom:lcards-msd-card',
        id: scene.id,
        msd: {
            base_svg: { source: 'none' },
            view_box: scene.viewBox,
            ...(scene.routing ? { routing: scene.routing } : {}),
            ...(scene.channels ? { channels: scene.channels } : {}),
            anchors,
            overlays,
        },
        grid_options: { columns: 24, rows: Math.round(6 * scene.viewBox[3] / 300) },
    };
}

/** The scene's note above it: title and what it should look like. */
function note(scene) {
    return {
        type: 'custom:lcards-button',
        preset: 'text-only',
        interactive: false,
        min_height: 0,
        text: { label: { content: `${scene.title.toUpperCase()}: ${scene.expect}${scene.checks?.known ? ` KNOWN: ${scene.checks.known}.` : ''}`, show: true, position: 'center-left', font_size: 15, color: 'theme:colors.ui.primary', fit: true } },
        grid_options: { columns: 24, rows: scene.checks?.known ? 2 : 1 },
    };
}

export function labView() {
    const sections = [];
    for (let i = 0; i < LAB_SCENES.length; i += 2) {
        sections.push({ type: 'grid', column_span: 4, cards: LAB_SCENES.slice(i, i + 2).flatMap(s => [note(s), sceneCard(s)]) });
    }
    return { title: 'MSD routing lab', path: 'msd-routing-lab', type: 'sections', max_columns: 4, sections };
}

export function labYaml() {
    return `# MSD routing lab (2026-11-19): written by scripts/make-routing-lab.mjs from
# tests/routing/lab-scenes.js. Do not edit: change the scenes and run the script.
${yaml.dump(labView(), { lineWidth: 160, flowLevel: 9, noRefs: true })}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const text = labYaml();
    if (process.argv.includes('--check')) {
        const current = (() => { try { return readFileSync(LAB_VIEW, 'utf8'); } catch { return ''; } })();
        if (current !== text) { console.error('msd-routing-lab.yaml is stale: run node scripts/make-routing-lab.mjs'); process.exit(1); }
        console.log('msd-routing-lab.yaml is up to date');
    } else {
        writeFileSync(LAB_VIEW, text);
        console.log(`wrote ${LAB_VIEW}`);
    }
}
