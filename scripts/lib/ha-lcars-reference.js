/**
 * @fileoverview The HA-LCARS reference pages of the user skill (scripts/build-user-skill.js),
 * rendered from the committed snapshot (scripts/sync-ha-lcars.js):
 *
 *   variables.md   role variables (what each one colours, its default), light/dark
 *                  defaults, the palette by group, every other --lcars-* name
 *   themes.md      every theme with its resolved role colours, how to select one, the helpers
 *   guide.md       the HA-LCARS README: install (UIX, fonts, lcars.js), classes, tips
 */

import { readFileSync } from 'node:fs';

const DATA = new URL('../data/ha-lcars/', import.meta.url);

/** @returns {{ snapshot: any, guide: string }} */
export function loadHaLcars() {
  return {
    snapshot: JSON.parse(readFileSync(new URL('snapshot.json', DATA), 'utf8')),
    guide: readFileSync(new URL('guide.md', DATA), 'utf8'),
  };
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

function header(title, snapshot, what) {
  const { repo, commit, date, license } = snapshot.source;
  return `# ${title}\n\n` +
    `From [HA-LCARS](${repo}) at commit \`${commit.slice(0, 7)}\` (${date}), ${license}. ${what}\n\n`;
}

/** `var(--lcars-x)` chains resolved through the palette, roles and theme to a literal, when there is one. */
function resolver(snapshot, themeVars = {}) {
  const table = new Map();
  for (const p of snapshot.palette) table.set(p.name, p.value);
  for (const r of snapshot.roles) table.set(r.name, r.default);
  for (const [k, v] of Object.entries(snapshot.mode_defaults.dark ?? {})) table.set(k, v);
  for (const [k, v] of Object.entries(themeVars)) table.set(k, v);
  return (value) => {
    let v = value;
    for (let i = 0; i < 8; i++) {
      const m = /^var\(--([a-z0-9-]+)\)$/.exec(String(v).trim());
      if (!m || !table.has(m[1])) break;
      v = table.get(m[1]);
    }
    return v === value ? null : v;
  };
}

export function renderVariables(snapshot) {
  const resolve = resolver(snapshot);
  let md = header('HA-LCARS variables', snapshot,
    'Every `--lcars-*` CSS variable the theme sets. Use them in LCARdS colours as `var(--lcars-...)`; names outside this list only exist in a user\'s own theme.');
  md += '## Role variables\n\n' +
    'What a theme changes when you switch it. Prefer these in LCARdS cards (`var(--lcars-card-button-color)`, `var(--lcars-ui-tertiary)`): ' +
    'the card then follows the theme. The `-text` partner of each colour is the readable text colour on it.\n\n';
  const sections = [...new Set(snapshot.roles.map(r => r.section))];
  for (const section of sections) {
    md += `### ${section || 'Other'}\n\n| Variable | Default | Colours |\n|---|---|---|\n`;
    for (const r of snapshot.roles.filter(x => x.section === section)) {
      const lit = resolve(r.default);
      md += `| \`--${r.name}\` | \`${cell(r.default)}\`${lit ? ` (${cell(lit)})` : ''} | ${cell(r.description)} |\n`;
    }
    md += '\n';
  }
  md += '### Light and dark mode defaults\n\nSet per mode (HA profile: theme mode light/dark/auto).\n\n| Variable | Light | Dark |\n|---|---|---|\n';
  const modeKeys = [...new Set(Object.values(snapshot.mode_defaults).flatMap(Object.keys))];
  for (const k of modeKeys) md += `| \`--${k}\` | \`${cell(snapshot.mode_defaults.light?.[k])}\` | \`${cell(snapshot.mode_defaults.dark?.[k])}\` |\n`;

  md += '\n## Palette\n\nFixed colours, the same in every theme. Use them for a colour that must not follow the theme.\n\n';
  for (const group of [...new Set(snapshot.palette.map(p => p.group))]) {
    md += `### ${group}\n\n`;
    md += snapshot.palette.filter(p => p.group === group)
      .map(p => `- \`--${p.name}\`: \`${p.value}\`${p.note ? ` (${p.note})` : ''}`).join('\n') + '\n\n';
  }

  const listed = new Set([...snapshot.palette.map(p => p.name), ...snapshot.roles.map(r => r.name),
    ...Object.values(snapshot.mode_defaults).flatMap(Object.keys)]);
  const rest = snapshot.vars.filter(v => !listed.has(v));
  if (rest.length) {
    md += '## Other names\n\nSet by individual themes or by the HA-LCARS CSS itself (some from the helper entities, e.g. `--lcars-sound`, `--lcars-vertical-border`). Valid to read, rarely needed.\n\n' +
      rest.map(v => `\`--${v}\``).join(', ') + '\n';
  }
  return md;
}

const THEME_COLUMNS = ['lcars-ui-primary', 'lcars-ui-secondary', 'lcars-ui-tertiary', 'lcars-ui-quaternary',
  'lcars-card-top-color', 'lcars-card-mid-color', 'lcars-card-button-color', 'lcars-card-bottom-color'];

export function renderThemes(snapshot) {
  let md = header('HA-LCARS themes', snapshot,
    'The themes HA-LCARS installs and the colour each puts behind the main role variables.');
  md += '## Selecting a theme\n\n' +
    'A user picks one in **Profile > Themes**, or an automation sets it for everyone: `action: frontend.set_theme` with `data: { name: "LCARS Default" }` (the name exactly as below; `mode: dark` or `light` optional). ' +
    'The `(Red Alert)`, `(Yellow Alert)` and `(Blue Alert)` themes are separate themes to switch to. LCARdS alert mode (`lcards.red_alert`, `references/docs/core/alert-mode.md`) is different: it shifts the colours of the current theme in place, plays the alert sound and drives alert overlays, without changing the selected theme. ' +
    'The two `[LCARdS ...]` themes map HA-LCARS and Home Assistant colours onto the LCARdS palette (`references/docs/configuration/ha-lcars-theme-profiles.md`); recommend them to LCARdS users who have no theme preference.\n\n';
  md += '## Role colours by theme\n\nResolved through the palette where the value is a palette variable (dark mode).\n\n';
  md += `| Theme | ${THEME_COLUMNS.map(c => c.replace('lcars-', '')).join(' | ')} |\n|${'---|'.repeat(THEME_COLUMNS.length + 1)}\n`;
  for (const t of snapshot.themes) {
    const resolve = resolver(snapshot, { ...t.vars, ...(t.modes?.dark ?? {}) });
    const value = (k) => {
      const raw = t.modes?.dark?.[k] ?? t.vars[k] ?? snapshot.roles.find(r => r.name === k)?.default ?? '';
      const short = String(raw).replace(/^var\(--(.*)\)$/, '$1');
      const lit = resolve(raw);
      return cell(lit && lit !== raw && !/^var\(/.test(lit) ? `${short} ${lit}` : short);
    };
    md += `| ${cell(t.name)} | ${THEME_COLUMNS.map(value).join(' | ')} |\n`;
  }
  md += '\n## Helper entities\n\nHA-LCARS reads these helpers (the user creates them). They are ordinary entities: an LCARdS button or slider can control them.\n\n';
  for (const h of snapshot.helpers) {
    md += `- \`${h.entity_id}\` (${h.name}${h.optional ? ', optional' : ''}): ${h.notes.join('; ')}\n`;
  }
  return md;
}

export function renderGuide(snapshot, guide) {
  return header('HA-LCARS guide', snapshot,
    'The HA-LCARS README from installation to known issues: UIX, fonts, `lcars.js`, the clock, helpers, the `uix: class:` classes for stock cards and layout tips. Classes style stock HA cards (markdown, heading, button, entities); LCARdS cards draw their own LCARS shapes and take colours from their own options.\n\n') +
    guide.replace(/^#/gm, '##');
}
