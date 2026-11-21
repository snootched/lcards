/**
 * @fileoverview Processor types for the data source editor: labels, one-line
 * descriptions, the settings a new processor starts with (each type's own
 * defaults, written out so the form and the YAML show them), and unit groups for
 * convert_unit. Pure: tests check every default runs cleanly.
 *
 * @module editor/components/datasources/processor-types
 */

import { ConvertUnitProcessor } from '../../../core/data-sources/processors/ConvertUnitProcessor.js';
import { docsUrl, DOCS } from '../../../utils/docs-url.js';

/** Processor reference page; each type has a section anchor (#scale, #convert-unit, ...). */
export const PROCESSOR_DOCS = docsUrl(DOCS.processors);

/** @type {Array<{type: string, label: string, description: string, defaults: Object}>} */
export const PROCESSOR_TYPES = [
  { type: 'smooth', label: 'Smooth', description: 'Reduce noise: exponential, moving average or gaussian', defaults: { method: 'exponential', alpha: 0.3 } },
  { type: 'scale', label: 'Scale', description: 'Map an input range to an output range (optionally curved)', defaults: { input_range: [0, 100], output_range: [0, 1] } },
  { type: 'convert_unit', label: 'Convert unit', description: 'Unit conversion, e.g. °C to °F or W to kW', defaults: { from: 'c', to: 'f' } },
  { type: 'round', label: 'Round', description: 'Round to a number of decimals (round, floor or ceil)', defaults: { precision: 1 } },
  { type: 'clamp', label: 'Clamp', description: 'Keep the value within a minimum and maximum', defaults: { min: 0, max: 100 } },
  { type: 'delta', label: 'Delta', description: 'Change since the previous value', defaults: {} },
  { type: 'rate', label: 'Rate', description: 'Rate of change per second, minute or hour', defaults: { unit: 'per_hour' } },
  { type: 'statistics', label: 'Statistics', description: 'Min, max, mean and more over a time window', defaults: { window: '1h', stats: ['min', 'max', 'mean'] } },
  { type: 'trend', label: 'Trend', description: 'Increasing, decreasing or stable (a word, not charted)', defaults: { samples: 5, threshold: 0.01 } },
  { type: 'threshold', label: 'Threshold', description: 'Two outputs (1/0 by default) either side of a threshold', defaults: { threshold: 0, hysteresis: 0 } },
  { type: 'duration', label: 'Duration', description: 'Time spent while a condition holds', defaults: { condition: '> 0' } },
  { type: 'expression', label: 'Expression', description: 'A JavaScript expression of value, sources and Math', defaults: { expression: 'value' } },
];

/** @param {string} type */
export const processorType = (type) => PROCESSOR_TYPES.find(t => t.type === type);

/** Docs link for a processor type's section. */
export const processorDocsUrl = (type) => `${PROCESSOR_DOCS}#${String(type).replace(/_/g, '-')}`;

/** Units for convert_unit's pickers, grouped. Which pairs convert: unitTargets(). */
export const UNIT_GROUPS = [
  { label: 'Temperature', units: [['c', '°C'], ['f', '°F'], ['k', 'K']] },
  { label: 'Power', units: [['w', 'W'], ['kw', 'kW'], ['mw', 'MW'], ['gw', 'GW']] },
  { label: 'Energy', units: [['wh', 'Wh'], ['kwh', 'kWh'], ['mwh', 'MWh'], ['j', 'J']] },
  { label: 'Distance', units: [['mm', 'mm'], ['cm', 'cm'], ['m', 'm'], ['km', 'km'], ['in', 'in'], ['ft', 'ft'], ['yd', 'yd'], ['mi', 'mi']] },
  { label: 'Speed', units: [['ms', 'm/s'], ['kmh', 'km/h'], ['mph', 'mph'], ['knot', 'kn']] },
  { label: 'Pressure', units: [['hpa', 'hPa'], ['bar', 'bar'], ['psi', 'psi'], ['mmhg', 'mmHg'], ['inhg', 'inHg']] },
  { label: 'Data', units: [['b', 'B'], ['kb', 'kB'], ['mb', 'MB'], ['gb', 'GB'], ['tb', 'TB']] },
  { label: 'Volume', units: [['ml', 'mL'], ['l', 'L'], ['gal', 'gal']] },
  { label: 'Mass', units: [['g', 'g'], ['kg', 'kg'], ['lb', 'lb'], ['oz', 'oz']] },
  { label: 'Light', units: [['brightness', 'brightness (0-255)'], ['percent', 'percent (0-100)']] },
];

/** Select options for a unit picker ("Temperature: °C"), optionally limited to some unit codes. */
/** @param {string[]|null} [only] - limit to these unit keys */
export function unitOptions(only = null) {
  return UNIT_GROUPS.flatMap(g => g.units
    .filter(([value]) => !only || only.includes(value))
    .map(([value, label]) => ({ value, label: `${g.label}: ${label}` })));
}

/**
 * Units convert_unit can convert `from` into (asks the processor itself, so the
 * picker never offers a pair that fails).
 * @param {string} from
 * @returns {string[]}
 */
export function unitTargets(from) {
  return UNIT_GROUPS.flatMap(g => g.units.map(([u]) => u)).filter(to => {
    if (to === from) return false;
    try {
      new ConvertUnitProcessor({ key: 'check', type: 'convert_unit', from, to });
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Rename a processor in a processing map, keeping key order and updating every
 * input_source and expression sources entry that points at it.
 * @param {Object} processing - processing map
 * @param {string} from - Old key
 * @param {string} to - New key
 * @returns {Object} New processing map (unchanged when the rename isn't possible)
 */
export function renameProcessor(processing, from, to) {
  if (!processing?.[from] || !to || to === from || processing[to]) return processing;
  const out = {};
  for (const [key, proc] of Object.entries(processing)) {
    const next = { ...proc };
    if (next.input_source === from) next.input_source = to;
    if (Array.isArray(next.sources)) next.sources = next.sources.map(s => (s === from ? to : s));
    out[key === from ? to : key] = next;
  }
  return out;
}

/**
 * A free processor name based on `base` (smooth, smooth_2, ...).
 * @param {Object} processing
 * @param {string} base
 */
export function uniqueProcessorKey(processing, base) {
  const clean = String(base || 'processor').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!processing?.[clean]) return clean;
  let n = 2;
  while (processing[`${clean}_${n}`]) n++;
  return `${clean}_${n}`;
}

/** Processor names: start with a letter or underscore; letters, digits and underscores. */
export const PROCESSOR_KEY_PATTERN = /^[a-z_][a-z0-9_]*$/;
