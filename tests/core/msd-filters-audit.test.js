/**
 * MSD blueprint filter bugs found by the D2 docs audit (2026-11-08): drop-shadow
 * numbers without units (the whole CSS filter value was invalid), feDisplacementMap
 * warping the noise instead of the blueprint, the one-map filter form giving nothing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

installJsdom();
const { generateFilterString, applyBaseSvgFilters } = await import('../../src/msd/utils/BaseSvgFilters.js');

const svgGroup = () => {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  const g = document.createElementNS(NS, 'g');
  svg.appendChild(g);
  document.body.appendChild(svg);
  return g;
};

test('drop-shadow numbers are px, and the other filters in the list are kept', () => {
  const s = generateFilterString([{ type: 'drop-shadow', value: { x: 2, y: 3, blur: 4, color: '#000' } }, { type: 'opacity', value: 0.5 }]);
  assert.equal(s, 'drop-shadow(2px 3px 4px #000) opacity(0.5)');
  assert.match(generateFilterString([{ type: 'drop-shadow', value: { x: '1em', y: 0, blur: 0 } }]), /^drop-shadow\(1em 0px 0px #000\)$/);
});

test('feDisplacementMap warps the blueprint (in) by the previous primitive (in2)', () => {
  const g = svgGroup();
  applyBaseSvgFilters(g, [
    { mode: 'svg', type: 'feTurbulence', value: { baseFrequency: 0.02 } },
    { mode: 'svg', type: 'feDisplacementMap', value: { scale: 8 } }
  ]);
  const map = g.ownerSVGElement.querySelector('feDisplacementMap');
  assert.ok(map);
  assert.equal(map.getAttribute('in'), 'SourceGraphic');
  assert.notEqual(map.getAttribute('in2'), 'SourceGraphic');
  const turb = g.ownerSVGElement.querySelector('feTurbulence');
  assert.equal(map.getAttribute('in2'), turb.getAttribute('result'));
});

test('the one-map form applies its CSS filters', () => {
  const g = svgGroup();
  applyBaseSvgFilters(g, { opacity: 0.5, blur: '2px' });
  assert.match(g.style.filter, /opacity\(0\.5\)/);
  assert.match(g.style.filter, /blur\(2px\)/);
});
