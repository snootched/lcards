/**
 * @fileoverview LCARdS Strategies — barrel export
 */

export { LCARdSShellDashboardStrategy, LCARdSShellStrategyEditor } from './lcards-shell-strategy.js';
// The Picard shell's generator loads on first use (strategy-registration.js).
export { LCARdSShellPicardDashboardStrategy, registerLcarsSections } from './strategy-registration.js';
