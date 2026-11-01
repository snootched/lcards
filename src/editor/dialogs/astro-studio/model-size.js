/**
 * The Studio's model size panel (UX1 P6c): what a model's file measures, its
 * real size in the open scope's units, and the sizes the Fit to view and File
 * size buttons set. Pure, so node tests read it.
 */
import { FILE_UNITS, modelSizeSet, modelLengthSet, realScale, kmPerUnit } from '../../../core/astrometrics/names.js';

/**
 * A number to 3 significant figures, as text: plain from 0.001 up, else in
 * powers of ten (a ship in light years).
 * @param {number} n
 */
export function shortNumber(n) {
  if (!Number.isFinite(n)) return '-';
  if (n === 0) return '0';
  const a = Math.abs(n);
  if (a < 1e-3 || a >= 1e9) return n.toExponential(2).replace(/\.?0+e/, 'e');
  return Number(n.toPrecision(3)).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

/**
 * A round length (1, 2 or 5 times a power of ten) at or below `n`.
 * @param {number} n
 */
export function roundLength(n) {
  if (!(n > 0) || !Number.isFinite(n)) return 1;
  const exp = Math.floor(Math.log10(n));
  const base = n / 10 ** exp;
  return Number(((base >= 5 ? 5 : base >= 2 ? 2 : 1) * 10 ** exp).toPrecision(1));
}

/**
 * The size Fit to view sets: about a fifth of the view's width, rounded.
 * @param {number} viewWidth - across the spot the camera looks at, in the scope's units
 */
export function fitToViewSize(viewWidth) {
  return roundLength(viewWidth / 5);
}

/**
 * What the panel says about a model.
 * @param {any} obj - the model's config
 * @param {number[] | null} extent - the file's extent, its own units (null until it has loaded)
 * @param {string} units - the open scope's units ('' when none)
 * @returns {{ file: string | null, largest: number | null, mode: 'size' | 'real' | 'default', real: string | null, realSize: number | null, note: string }}
 *   `real`: the real size as text ("289 m = 0.289 km"; from `length` when set, else what the file measures), `realSize` in
 *   scope units; `note`: how it is drawn now
 */
export function modelSizeReadout(obj, extent, units) {
  const fu = FILE_UNITS[/** @type {keyof typeof FILE_UNITS} */ (obj?.file_units)] !== undefined ? String(obj.file_units) : 'm';
  const largest = extent ? Math.max(...extent) : null;
  const file = extent ? `${extent.map(shortNumber).join(' x ')} ${fu} (largest ${shortNumber(/** @type {number} */ (largest))} ${fu})` : null;
  const scale = realScale(fu, kmPerUnit(units));
  // length: the real length in metres, whatever the file measures
  const length = modelLengthSet(obj);
  const [realLen, realUnits] = length !== null ? [length, 'm'] : [largest, fu];
  const unitScale = length !== null ? realScale('m', kmPerUnit(units)) : scale;
  const realSize = realLen !== null && unitScale !== null ? realLen * unitScale : null;
  const real = realSize === null ? null : realUnits === units ? `${shortNumber(realSize)} ${units}` : `${length !== null ? length.toLocaleString('en-US', { maximumFractionDigits: 3 }) : shortNumber(/** @type {number} */ (realLen))} ${realUnits} = ${shortNumber(realSize)} ${units}`;
  const set = modelSizeSet(obj);
  if (set !== null) return { file, largest, mode: 'size', real, realSize, note: `Drawn at size ${shortNumber(set)}${units ? ` ${units}` : ''} across.` };
  if (scale !== null && length !== null) return { file, largest, mode: 'real', real, realSize, note: `Drawn at its real length: ${real}.` };
  if (scale !== null) return { file, largest, mode: 'real', real, realSize, note: real ? `Drawn at its real size, as the file measures: ${real}. Set Length (m) if the file is not at its true scale.` : 'Drawn at its real size.' };
  return { file, largest, mode: 'default', real: null, realSize: null, note: 'Drawn at 50 across: the scene has no units, so there is no real size. Give the scene units (km, au, ly) in the Scene tab for one, or set a size.' };
}
