/**
 * Point labels on the text system: label-text.js (inheritance, positions,
 * shorthand, the built-in looks, CSS).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveLabel, normalizePosition, fieldCss, plainColor, selectedColor,
  BUILTIN_LABEL_STYLES, SELECTED_COLOR, LABEL_OMITTED_KEYS
} from '../../src/core/astrometrics/label-text.js';

test('label: shorthand for text.label.content; the built-in style sets size, priority and colour', () => {
  const spec = resolveLabel({ id: 'vega', label: 'Vega', style: 'major' });
  assert.equal(spec.priority, 80);
  assert.equal(spec.fields.length, 1);
  const [f] = spec.fields;
  assert.equal(f.name, 'label');
  assert.equal(f.content, 'Vega');
  assert.equal(f.style.font_size, 20);
  assert.equal(f.color, 'var(--lcards-moonlight)');
  assert.equal(f.position, 'center', 'no marker: on the point');
});

test('the four built-ins keep their E2b looks', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(BUILTIN_LABEL_STYLES).map(([k, v]) => [k, [v.font_size, v.priority]])),
    { title: [34, 100], major: [20, 80], minor: [13, 40], tiny: [10, 10] });
  assert.equal(resolveLabel({ id: 't', label: 'T', style: 'title' }).fields[0].style.letter_spacing, 1);
  assert.equal(resolveLabel({ id: 'm', label: 'M' }).fields[0].color, 'theme:colors.text.onDark', 'minor is the default');
});

test('inheritance: built-in < labels.default < labels.styles < point colour < text.default < field', () => {
  const labels = {
    default: { font_family: 'lcards_title', font_size: 15, color: 'red' },
    styles: { major: { font_size: 22 }, alert: { font_weight: 'bold', priority: 90, color: 'orange' } }
  };
  assert.equal(resolveLabel({ id: 'a', label: 'A' }, labels).fields[0].style.font_size, 15, 'labels.default over the built-in');
  assert.equal(resolveLabel({ id: 'a', label: 'A', style: 'major' }, labels).fields[0].style.font_size, 22, 'a style over labels.default');
  const alert = resolveLabel({ id: 'b', label: 'B', style: 'alert' }, labels);
  assert.equal(alert.priority, 90, 'a user style sets the priority');
  assert.equal(alert.fields[0].style.font_weight, 'bold');
  assert.equal(alert.fields[0].style.font_size, 15, 'an unknown built-in falls back to minor, under labels.default');
  assert.equal(alert.fields[0].color, 'orange');
  const pc = resolveLabel({ id: 'c', label: 'C', color: 'blue', text: { default: { font_size: 9 }, label: { font_size: 11 } } }, labels);
  assert.equal(pc.fields[0].color, 'blue', 'the point colour over the style');
  assert.equal(pc.fields[0].style.font_size, 11, 'the field wins');
  assert.equal(pc.color, 'blue');
  assert.equal(resolveLabel({ id: 'd', label: 'D', priority: 5 }, labels).priority, 5, 'point priority wins');
});

test('fields: label first, then the point\'s own; show false and empty content drop; positions stack', () => {
  const spec = resolveLabel({
    id: 's', marker: 'reticle',
    text: {
      status: { content: '{entity.state}', position: 'bottom' },
      label: { content: 'Shuttle' },
      hidden: { content: 'x', show: false },
      blank: { content: '' }
    }
  });
  assert.deepEqual(spec.fields.map((f) => [f.name, f.position]), [['label', 'center-right'], ['status', 'bottom-center']]);
  assert.equal(spec.fields[1].template, true);
});

test('label shorthand and an explicit text.label.content: the explicit one wins, its other keys stay', () => {
  const spec = resolveLabel({ id: 'x', label: 'Short', text: { label: { content: 'Long', font_size: 30 } } });
  assert.equal(spec.fields[0].content, 'Long');
  assert.equal(spec.fields[0].style.font_size, 30);
});

test('SVG-only text keys are dropped from the field style', () => {
  const spec = resolveLabel({ id: 'x', label: 'X', text: { label: { zone: 'body', stretch: true, anchor: 'end', x: 3, font_size_percent: 50 } } });
  for (const k of LABEL_OMITTED_KEYS) assert.equal(k in spec.fields[0].style, false, k);
});

test('normalizePosition: the text system aliases', () => {
  assert.equal(normalizePosition('right'), 'center-right');
  assert.equal(normalizePosition('left-center'), 'center-left');
  assert.equal(normalizePosition('top'), 'top-center');
  assert.equal(normalizePosition('top-left'), 'top-left');
  assert.equal(normalizePosition('nowhere'), null);
});

test('fieldCss: font keys, spacing, padding as margin, background box only with a background', () => {
  const [f] = resolveLabel({ id: 'x', label: 'X', text: { label: { font_weight: 700, text_transform: 'uppercase', letter_spacing: '0.1em', padding: { left: 6 }, rotation: 15, background_padding: 4 } } }).fields;
  const css = fieldCss(f);
  assert.match(css, /font-size:13px/);
  assert.match(css, /font-weight:700/);
  assert.match(css, /text-transform:uppercase/);
  assert.match(css, /letter-spacing:0\.1em/);
  assert.match(css, /margin:0px 0px 0px 6px/);
  assert.match(css, /rotate\(15deg\)/);
  assert.doesNotMatch(css, /border-radius/, 'no background, no box');
  const [g] = resolveLabel({ id: 'y', label: 'Y', text: { label: { background: { default: 'black' }, background_min_width: 80 } } }).fields;
  assert.match(fieldCss(g), /padding:1px 8px;border-radius:4px;min-width:80px/);
});

test('plainColor / selectedColor', () => {
  assert.equal(plainColor('red'), 'red');
  assert.equal(plainColor({ default: 'blue', active: 'red' }), 'blue');
  assert.equal(plainColor({ active: 'red' }), undefined);
  assert.equal(selectedColor({ default: 'x', selected: 'yellow' }), 'yellow');
  assert.equal(selectedColor('red'), SELECTED_COLOR);
});

test('the marker colour: the point\'s, else the style\'s; never a field\'s own colour', () => {
  assert.equal(resolveLabel({ id: 'a', marker: 'dot', color: 'blue', text: { label: { content: 'A', color: 'black' } } }).color, 'blue');
  const b = resolveLabel({ id: 'b', marker: 'dot', style: 'major', text: { label: { content: 'B', color: 'black' } } });
  assert.equal(b.color, 'var(--lcards-moonlight)');
  assert.equal(b.fields[0].color, 'black');
  assert.equal(resolveLabel({ id: 'c', marker: 'dot', style: 'x' }, { styles: { x: { color: 'red' } } }).color, 'red');
});

test('overlap: the point\'s, else its style\'s, else the card\'s; never a text key', () => {
  const labels = { overlap: true, styles: { quiet: { overlap: false } } };
  assert.equal(resolveLabel({ id: 'a', label: 'A' }, labels).overlap, true);
  assert.equal(resolveLabel({ id: 'b', label: 'B', style: 'quiet' }, labels).overlap, false);
  assert.equal(resolveLabel({ id: 'c', label: 'C', style: 'quiet', overlap: true }, labels).overlap, true);
  assert.equal(resolveLabel({ id: 'd', label: 'D' }).overlap, false);
  assert.equal('overlap' in resolveLabel({ id: 'e', label: 'E' }, labels).fields[0].style, false);
});
