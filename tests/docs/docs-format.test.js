/**
 * The user-facing docs formula (reports/d2-pilot-compare.md, "The formula"):
 * block-style YAML in examples, one key-table shape, and the example before
 * the table in every section. Pages join FORMATTED as they are reworked.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = path.resolve(import.meta.dirname, '../..');

/** Pages written to the formula */
const FORMATTED = [
  'doc/cards/layout-view/index.md',
  'doc/cards/common.md',
  'doc/cards/slider-card/index.md',
  'doc/cards/slider-card/styles.md',
  'doc/cards/slider-card/components.md',
  'doc/cards/slider-card/ranges.md',
  'doc/cards/slider-card/control.md',
  'doc/cards/astrometrics/start.md',
  'doc/cards/astrometrics/objects.md',
  'doc/cards/astrometrics/objects/surfaces.md',
  'doc/cards/astrometrics/objects/lines.md',
  'doc/cards/astrometrics/objects/space.md',
  'doc/cards/astrometrics/objects/ships.md',
  'doc/cards/astrometrics/points.md',
  'doc/cards/astrometrics/data.md',
  'doc/cards/astrometrics/effects.md',
  'doc/cards/button/index.md',
  'doc/cards/button/styles.md',
  'doc/cards/button/icons.md',
  'doc/cards/button/textures.md',
  'doc/cards/button/components.md',
  'doc/cards/button/custom-svg.md',
  'doc/cards/elbow/index.md',
  'doc/cards/elbow/bars.md',
  'doc/cards/elbow/frame.md',
  'doc/cards/elbow/appearance.md',
  'doc/cards/elbow/symbiont.md',
  'doc/cards/select-menu/index.md',
  'doc/cards/select-menu/options.md',
  'doc/cards/select-menu/layout.md',
  'doc/cards/select-menu/styles.md',
  'doc/cards/alert-overlay/index.md',
  'doc/cards/alert-overlay/overlay.md',
  'doc/cards/alert-overlay/band.md',
  'doc/cards/alert-overlay/symbol.md',
  'doc/cards/alert-overlay/conditions.md',
  'doc/cards/alert-overlay/raising.md',
  'doc/cards/data-grid/index.md',
  'doc/cards/data-grid/data.md',
  'doc/cards/data-grid/styling.md',
  'doc/cards/data-grid/upgrading.md',
  'doc/cards/chart/index.md',
  'doc/cards/chart/series.md',
  'doc/cards/chart/types.md',
  'doc/cards/chart/styling.md',
  'doc/cards/chart/labels.md',
  'doc/cards/chart/examples.md',
  'doc/cards/chart/upgrading.md',
  'doc/cards/astrometrics/index.md',
  'doc/cards/astrometrics/camera.md',
  'doc/cards/astrometrics/scene.md',
  'doc/cards/astrometrics/models.md',
  'doc/cards/astrometrics/scale.md',
  'doc/cards/msd/control-overlay.md',
  'doc/cards/msd/line-overlay.md',
  'doc/cards/msd/shape-overlay.md',
  'doc/cards/msd/routing.md',
  'doc/cards/msd/manual-routing.md',
  'doc/cards/msd/index.md',
  'doc/cards/msd/quick-start.md',
  'doc/cards/msd/background.md',
  'doc/cards/msd/animations.md',
  'doc/cards/msd/base-svg-filters.md',
  'doc/core/animations.md',
  'doc/core/animations/entity-change-triggers.md',
  'doc/core/animations/rule-based-animations.md',
  'doc/core/animations/preset-reference.md',
  'doc/core/alert-mode.md',
  'doc/core/borg.md',
  'doc/core/effects/filters.md',
  'doc/core/effects/screen-effects.md',
  'doc/core/effects/background-animations.md',
  'doc/core/effects/background-animations/preset-reference.md',
  'doc/core/animations/triggers.md',
  'doc/core/animations/timing-and-easing.md',
  'doc/core/borg-actions.md',
  'doc/core/effects/background-animations/stacking-and-zoom.md',
  'doc/core/effects/background-animations/binding-and-animation.md',
  'doc/core/colours.md',
  'doc/core/colours/values.md',
  'doc/core/colours/state-maps.md',
  'doc/core/colours/attributes.md',
  'doc/core/text-fields.md',
  'doc/core/text-fields-placement.md',
  'doc/core/text-fields-zones.md',
  'doc/core/text-fields-style.md',
  'doc/core/text-fields-content.md',
  'doc/core/styles.md',
  'doc/core/presets.md',
  'doc/core/actions.md',
  'doc/core/sounds.md',
  'doc/core/themes/index.md',
  'doc/core/templates/index.md',
  'doc/core/datasources/index.md',
  'doc/core/rules/index.md',
  'doc/core/rules/conditions.md',
  'doc/core/rules/changes.md',
  'doc/core/rules/priority.md',
  'doc/core/rules/examples.md',
  'doc/configuration/index.md',
  'doc/configuration/ha-actions.md',
  'doc/configuration/persistent-helpers.md',
  'doc/configuration/users-devices.md',
  'doc/configuration/ha-lcars-theme-profiles.md',
  'doc/configuration/ha-lcars-theme-lab.md',
  'doc/configuration/alert-mode-lab.md',
  'doc/configuration/sounds.md',
  'doc/configuration/browser-mod.md',
  'doc/configuration/connectivity.md',
  'doc/getting-started/building-dashboards.md',
  'doc/getting-started/lcars-design.md',
  'doc/getting-started/lcars-patterns.md'
];

const KEY_TABLE = '| Key | Type | Default | Description |';

/** @param {string} md */
const yamlBlocks = (md) => [...md.matchAll(/^```yaml[^\n]*\n([\s\S]*?)^```$/gm)].map((m) => ({ body: m[1], at: m.index ?? 0 }));

/** Sections split at H2/H3 headings, fenced code skipped @param {string} md */
function sections(md) {
  /** @type {{ heading: string, text: string }[]} */
  const out = [{ heading: '(top)', text: '' }];
  let fenced = false;
  for (const line of md.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    if (!fenced && /^#{2,3} /.test(line)) out.push({ heading: line, text: '' });
    else out[out.length - 1].text += line + '\n';
  }
  return out;
}

for (const file of FORMATTED) {
  const md = fs.readFileSync(path.join(ROOT, file), 'utf8');

  test(`${file}: examples use block-style YAML (no { } maps)`, () => {
    const bad = [];
    for (const { body } of yamlBlocks(md)) {
      const doc = YAML.parseDocument(body);
      YAML.visit(doc, {
        Map(_, node) { if (node.flow) bad.push(String(node).slice(0, 60)); },
        Seq(_, node) { if (node.flow && node.items.some((i) => !YAML.isScalar(i))) bad.push(String(node).slice(0, 60)); }
      });
    }
    assert.deepEqual(bad, [], 'write these out in block style');
  });

  test(`${file}: key tables are ${KEY_TABLE}`, () => {
    const heads = md.split('\n').filter((l) => /^\|\s*`?(Key|Field)\b/.test(l));
    assert.deepEqual(heads.filter((l) => l.trim() !== KEY_TABLE), []);
  });

  test(`${file}: a section with a key table shows an example before it`, () => {
    const missing = sections(md)
      .filter((s) => s.text.includes(KEY_TABLE))
      .filter((s) => {
        const ex = s.text.search(/^```yaml/m);
        return ex < 0 || ex > s.text.indexOf(KEY_TABLE);
      })
      .map((s) => s.heading);
    assert.deepEqual(missing, []);
  });
}
