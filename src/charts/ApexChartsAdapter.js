/**
 * [ApexChartsAdapter] Maps the chart card's nested `style` config to ApexCharts options.
 *
 * Responsibilities:
 * - Translate style.* (colours, stroke, fill, grid, axes, legend, markers, data
 *   labels, tooltip, theme, typography, animation presets) into ApexCharts options
 * - Apply LCARS defaults per chart type
 * - Build annotations (zero line, thresholds) and label/tooltip formatters
 * - Merge style.chart_options last (highest precedence)
 * - Resolve remaining CSS variables to concrete colours
 *
 * Series data is built by the chart card; this adapter only produces options.
 * Theme tokens (theme:, alpha(), darken(), ...) are resolved by the card before
 * calling generateOptions().
 *
 * @module ApexChartsAdapter
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import { deepMerge } from '../utils/deepMerge.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { haFormatNumber } from '../utils/ha-entity-display.js';
import { BUILTIN_THEMES_PACK } from '../core/packs/builtin-themes.js';
import { resolveColor } from '../core/themes/resolve-color.js';
import { isComputedColor } from '../core/themes/color-syntax.js';

/** Series colours used when a series sets its own colour and no palette is configured. */
const DEFAULT_SERIES_COLORS = [
  'var(--lcars-orange, #FF9900)',
  'var(--lcars-blue, #9999FF)',
  'var(--lcars-yellow, #FFCC66)',
  'var(--lcars-green, #33CC99)',
  'var(--lcars-red, #CC6666)',
  'var(--lcars-lilac, #CC99CC)'
];

export class ApexChartsAdapter {
  /**
   * Valid ApexCharts chart types supported by MSD
   * @constant {string[]}
   */
  static VALID_CHART_TYPES = [
    'line',
    'area',
    'bar',
    'column',       // Alias: vertical bars (maps to ApexCharts 'bar' with horizontal: false)
    'pie',
    'donut',
    'radar',
    'heatmap',
    'radialBar',    // Gauges, completion indicators
    'rangeBar',     // Timelines, schedules
    'polarArea',    // Directional data
    'treemap',      // Hierarchical data
    'rangeArea',    // Data ranges/confidence intervals
    'scatter',      // Correlation plots
    'candlestick',  // OHLC data
    'boxPlot'       // Statistical distributions
  ];

  /**
   * Generate ApexCharts options from the chart card's style config.
   *
   * - Theme tokens are resolved by the calling card (resolveThemeTokensRecursive)
   * - Supports all ApexCharts colour properties (series, stroke, fill, markers, etc.)
   * - Resolves CSS variables to concrete colours: ApexCharts draws SVG but derives
   *   shades, gradients and opacity mixes from colour values in JS, so var()
   *   strings must be resolved first
   * - style.chart_options is deep-merged last (highest precedence)
   *
   * @param {Object} style - MSD overlay style configuration (theme tokens already resolved)
   * @param {Array} size - Chart size [width, height]
   * @param {Object} context - Additional context (hasData, config, card)
   * @returns {Object} ApexCharts options
   */
  static generateOptions(style, size, context = {}) {
    // ============================================================================
    // SETUP & THEME RESOLUTION
    // ============================================================================

    // The chart card already resolves theme tokens before calling this method;
    // only remaining CSS variables are handled here.

    let chartType = style.chart_type || style.type || 'line';

    // Validate chart type
    if (!this.VALID_CHART_TYPES.includes(chartType)) {
      lcardsLog.warn(`[ApexChartsAdapter] Invalid chart type: ${chartType}, defaulting to 'line'`);
      chartType = 'line';
    }

    // 'column' is an alias for vertical bar chart.
    // ApexCharts only has 'bar'; we use plotOptions.bar.horizontal to distinguish.
    const apexChartType = chartType === 'column' ? 'bar' : chartType;

    // Helper: convert null to undefined for ApexCharts compatibility
    // ApexCharts doesn't handle null gracefully for optional color arrays
    const nullToUndefined = (value) => value === null ? undefined : value;

    /**
     * Normalize color value to array format for ApexCharts
     *
     * ApexCharts expects color properties to be arrays. This helper normalizes:
     * - Single color strings → single-element arrays
     * - Already-array values → returned as-is
     * - null/undefined → returned as null
     *
     * @private
     * @param {string|Array|null|undefined} value - Color value (single color or array)
     * @returns {Array|null} Normalized color array or null
     *
     * @example
     * _normalizeColorArray('#FF9900') // → ['#FF9900']
     * _normalizeColorArray(['#FF9900', '#99CCFF']) // → ['#FF9900', '#99CCFF']
     * _normalizeColorArray(null) // → null
     */
    const normalizeColorArray = (value) => {
      if (value === null || value === undefined) {
        return null;
      }

      // Single string color → convert to array
      if (typeof value === 'string') {
        return [value];
      }

      // Already an array → return as-is
      if (Array.isArray(value)) {
        return value;
      }

      // Invalid type → log warning and return null
      lcardsLog.warn('[ApexChartsAdapter] Invalid color value type:', typeof value, value);
      return null;
    };

    // ============================================================================
    // EXTRACT RESOLVED VALUES
    // ============================================================================
    // All theme tokens are already resolved by chart card, just extract values
    // Color arrays are normalized to ensure ApexCharts compatibility

    // Series colors (Primary data visualization)
    // Normalize to array format for ApexCharts compatibility
    let colors = normalizeColorArray(style.colors?.series);

    // Stroke/outline colors
    let strokeColors = normalizeColorArray(style.colors?.stroke);
    const strokeWidth = style.stroke?.width ?? 2;
    const curve = style.stroke?.curve ?? 'smooth';
    const strokeDashArray = style.stroke?.dash_array ?? 0;

    // Fill colors (for area/bar charts)
    const fillColors = normalizeColorArray(style.colors?.fill);
    const fillType = style.fill?.type ?? 'solid';
    const fillOpacity = style.fill?.opacity ?? 0.7;

    // Background & foreground (these are single values, not arrays - no normalization)
    const backgroundColor = style.colors?.background ?? 'transparent';
    const foregroundColor = style.colors?.foreground ?? 'var(--lcars-text-light, #FFFFFF)';

    // Grid colors
    const gridColor = style.colors?.grid ?? 'var(--lcars-gray, #999999)';
    const gridRowColors = normalizeColorArray(style.grid?.row_colors);
    const gridColumnColors = normalizeColorArray(style.grid?.column_colors);
    const showGrid = style.grid?.show ?? true;

    // Axis colors (single values - no normalization needed)
    const unifiedAxisColor = style.colors?.axis?.x ?? style.colors?.axis?.y ?? foregroundColor;
    const xaxisColor = style.colors?.axis?.x ?? unifiedAxisColor;
    const xaxisColors = null; // Not part of nested structure
    const yaxisColor = style.colors?.axis?.y ?? unifiedAxisColor;
    const yaxisColors = null; // Not part of nested structure
    const axisBorderColor = style.colors?.axis?.border ?? gridColor;
    const axisTicksColor = style.colors?.axis?.ticks ?? gridColor;

    // Legend colors
    const legendColor = style.colors?.legend?.default ?? foregroundColor;
    const legendColors = normalizeColorArray(style.colors?.legend?.items);
    const showLegend = style.legend?.show ?? false;
    const legendPosition = (() => {
        const pos = style.legend?.position ?? 'bottom';
        return ['top', 'bottom', 'left', 'right'].includes(pos) ? pos : 'bottom';
    })();
    const legendHorizontalAlign = (() => {
        const align = style.legend?.horizontalAlign ?? 'center';
        return ['left', 'center', 'right'].includes(align) ? align : 'center';
    })();

    // Marker colors (data points)
    // Note: markerColors defaults to series colors if not specified
    const markerColors = normalizeColorArray(style.colors?.marker?.fill ?? colors);
    const markerStrokeColors = normalizeColorArray(style.colors?.marker?.stroke) ?? [foregroundColor];
    const markerStrokeWidth = style.markers?.stroke?.width ?? 2;
    const markerSize = style.markers?.size ?? 0;
    // 'rhombus' was offered by older schemas; ApexCharts calls it 'diamond'.
    const markerShape = style.markers?.shape === 'rhombus' ? 'diamond' : (style.markers?.shape ?? 'circle');

    // Data label colors
    const dataLabelColors = normalizeColorArray(style.colors?.data_labels) ?? [foregroundColor];
    const showDataLabels = style.data_labels?.show ?? false;
    const dataLabelOffsetY = style.data_labels?.offsetY ?? 0;

    // Axis visibility / geometry
    const showXAxisLabels = style.xaxis?.labels?.show ?? true;
    const rotateXAxisLabels = style.xaxis?.labels?.rotate ?? 0;
    const showXAxisBorder = style.xaxis?.border?.show ?? false;
    const showXAxisTicks = style.xaxis?.ticks?.show ?? false;
    const showYAxisLabels = style.yaxis?.labels?.show ?? true;
    const showYAxisBorder = style.yaxis?.border?.show ?? false;
    const showYAxisTicks = style.yaxis?.ticks?.show ?? false;

    // Value rounding (decimals = null means no formatter applied)
    // haFormatNumber is used here so the decimal separator and grouping respect
    // hass.locale.number_format (space_comma, decimal_comma, etc.).
    // context.hass is captured via closure — it is the same reference passed
    // into this method and is always available when valueFormatter is called.
    const valueDecimals = style.yaxis?.decimals ?? null;
    const valueFormatter = valueDecimals !== null
      ? (val) => (typeof val === 'number'
          ? haFormatNumber(context?.hass, val, {
              minimumFractionDigits: valueDecimals,
              maximumFractionDigits: valueDecimals
            })
          : val)
      : undefined;

    // Theme settings
    const themeMode = style.theme?.mode ?? 'dark';
    let themePalette = style.theme?.palette ?? null;

    // Filter out unresolved theme token paths (e.g., "colors.chart.themePalette")
    if (themePalette && typeof themePalette === 'string' && themePalette.includes('colors.')) {
      lcardsLog.trace(`[ApexChartsAdapter] Filtered unresolved themePalette token: ${themePalette}`);
      themePalette = null;
    }

    // Monochrome settings
    const monochrome = style.theme?.monochrome ?? {};
    const monochromeEnabled = monochrome.enabled ?? false;
    const monochromeColor = monochrome.color ?? colors?.[0];
    const monochromeShadeTo = monochrome.shade_to ?? 'dark';
    const monochromeIntensity = monochrome.shade_intensity ?? 0.65;

    // Typography
    const fontFamily = style.typography?.font_family ?? 'Antonio, Helvetica Neue, sans-serif';
    const fontSize = style.typography?.font_size ?? 12;

    // Display options
    const showToolbar = style.display?.toolbar ?? false;
    const showTooltip = style.display?.tooltip?.show ?? true;
    const tooltipTheme = style.display?.tooltip?.theme ?? 'dark';

    // ============================================================================
    // BUILD APEXCHARTS OPTIONS
    // ============================================================================

    const baseOptions = {
      chart: {
        type: apexChartType,
        width: size[0],
        height: size[1],
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        toolbar: {
          show: showToolbar
        },
        background: backgroundColor,
        foreColor: foregroundColor,
        fontFamily: fontFamily
      },

      // Series colors
      colors: colors,

      // Stroke (lines/borders)
      stroke: {
        width: strokeWidth,
        curve: curve,
        dashArray: strokeDashArray,
        colors: nullToUndefined(strokeColors)
      },

      // Fill (area/bar charts)
      fill: {
        colors: nullToUndefined(fillColors),
        type: fillType,
        opacity: fillOpacity,
        // Schema keys already use ApexCharts names (shade, type, shadeIntensity, opacityFrom, opacityTo)
        ...(style.fill?.gradient && { gradient: style.fill.gradient })
      },

      // Grid
      grid: {
        show: showGrid,
        borderColor: gridColor,
        strokeDashArray: style.grid?.stroke_dash_array ?? 4,
        ...(gridRowColors && { row: { colors: gridRowColors } }),
        ...(gridColumnColors && { column: { colors: gridColumnColors } })
      },

      // X-axis
      xaxis: {
        labels: {
          show: showXAxisLabels,
          rotate: rotateXAxisLabels,
          rotateAlways: rotateXAxisLabels !== 0,
          style: {
            colors: nullToUndefined(xaxisColors) || xaxisColor,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily
          }
        },
        axisBorder: {
          show: showXAxisBorder,
          color: axisBorderColor
        },
        axisTicks: {
          show: showXAxisTicks,
          color: axisTicksColor
        }
      },

      // Y-axis
      yaxis: {
        labels: {
          show: showYAxisLabels,
          style: {
            colors: nullToUndefined(yaxisColors) || yaxisColor,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily
          },
          // Without decimals, ApexCharts takes label precision from the data,
          // so averaged values print as "800.000000000000"; cap at 2 decimals.
          formatter: valueFormatter ?? ((val) => (typeof val === 'number'
            ? haFormatNumber(context?.hass, val, { maximumFractionDigits: 2 })
            : val))
        },
        axisBorder: {
          show: showYAxisBorder,
          color: axisBorderColor
        },
        axisTicks: {
          show: showYAxisTicks,
          color: axisTicksColor
        }
      },

      // Legend
      legend: {
        show: showLegend,
        showForSingleSeries: showLegend, // ApexCharts hides legend for 1 series by default
        position: legendPosition,
        horizontalAlign: legendHorizontalAlign,
        fontSize: `${style.legend?.font_size ?? fontSize + 2}px`,
        fontFamily: fontFamily,
        labels: {
          // Use explicit color array if provided, otherwise fall back to
          // foregroundColor as a string so ApexCharts always has a concrete value
          colors: legendColors?.length ? legendColors : foregroundColor
        }
      },

      // Markers (data points)
      markers: {
        size: markerSize,
        shape: markerShape,
        colors: nullToUndefined(markerColors),
        strokeColors: nullToUndefined(markerStrokeColors),
        strokeWidth: markerStrokeWidth
      },

      // Data labels
      dataLabels: {
        enabled: showDataLabels,
        offsetY: dataLabelOffsetY,
        // ApexCharts 7 animates labels on every update by default; live HA data
        // updates often, so keep labels still (pre-7 behaviour).
        animate: { enabled: false },
        style: {
          colors: nullToUndefined(dataLabelColors),
          fontSize: `${style.data_labels?.font_size ?? fontSize}px`,
          fontFamily: fontFamily
        },
        ...(valueFormatter && { formatter: valueFormatter })
      },

      // Tooltip
      tooltip: {
        enabled: showTooltip,
        theme: tooltipTheme,
        style: {
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily
        },
        ...(valueFormatter && { y: { formatter: valueFormatter } })
      },

      // Theme
      theme: {
        mode: themeMode,
        palette: themePalette,
        ...(monochromeEnabled && {
          monochrome: {
            enabled: true,
            color: monochromeColor,
            shadeTo: monochromeShadeTo,
            shadeIntensity: monochromeIntensity
          }
        })
      },

      // Annotations (threshold lines, zero line)
      // Built from style.zero_line and style.thresholds[]
      annotations: this._buildAnnotations(style, { fontFamily, fontSize })
    };

    // ============================================================================
    // APPLY TYPE-SPECIFIC DEFAULTS
    // ============================================================================

    const typeDefaults = this._getChartTypeDefaults(chartType, style, context?.hass);
    const optionsWithTypeDefaults = deepMerge(baseOptions, typeDefaults);

    // ============================================================================
    // PER-SERIES OPTIONS (sources[] display fields, multiple Y axes)
    // ============================================================================

    if (Array.isArray(context.series) && context.series.length) {
      this._applySeriesOptions(optionsWithTypeDefaults, context.series, context.yaxis, {
        valueDecimals,
        hass: context.hass,
        markerFillSet: style.colors?.marker?.fill !== undefined
      });
    }

    // ============================================================================
    // APPLY ANIMATION PRESET
    // ============================================================================

    if (style.animation?.preset) {
      const animationPreset = ApexChartsAdapter._getAnimationPreset(style.animation.preset);
      if (animationPreset) {
        optionsWithTypeDefaults.chart.animations = {
          ...optionsWithTypeDefaults.chart.animations,
          ...animationPreset
        };
        lcardsLog.debug(`[ApexChartsAdapter] Applied animation preset: ${style.animation.preset}`, animationPreset);
      }
    }

    // ============================================================================
    // LOG WHAT WE GENERATED
    // ============================================================================

    lcardsLog.debug('[ApexChartsAdapter] Generated ApexCharts options:', {
      chartType,
      seriesColors: colors?.length || 0,
      strokeColors: strokeColors?.length || 0,
      fillColors: fillColors?.length || 0,
      markerColors: markerColors?.length || 0,
      backgroundColor,
      foregroundColor,
      gridColor,
      themeMode,
      themePalette,
      monochromeEnabled,
      cssVariablesResolved: true
    });

    // ============================================================================
    // FORMATTERS (Simple Template-Based)
    // ============================================================================

    // Apply X-Axis Label Formatter
    if (style.formatters?.xaxis_label) {
      const formatter = this._createLabelFormatter(style.formatters.xaxis_label, 'xaxis', context.hass);
      if (!optionsWithTypeDefaults.xaxis) optionsWithTypeDefaults.xaxis = {};
      if (!optionsWithTypeDefaults.xaxis.labels) optionsWithTypeDefaults.xaxis.labels = {};
      optionsWithTypeDefaults.xaxis.labels.formatter = formatter;
      lcardsLog.debug('[ApexChartsAdapter] Applied xaxis_label formatter:', style.formatters.xaxis_label);
    }

    // Apply Y-Axis Label Formatter
    if (style.formatters?.yaxis_label) {
      const formatter = this._createLabelFormatter(style.formatters.yaxis_label, 'yaxis', context.hass);
      if (!optionsWithTypeDefaults.yaxis) optionsWithTypeDefaults.yaxis = {};
      if (!optionsWithTypeDefaults.yaxis.labels) optionsWithTypeDefaults.yaxis.labels = {};
      optionsWithTypeDefaults.yaxis.labels.formatter = formatter;
      lcardsLog.debug('[ApexChartsAdapter] Applied yaxis_label formatter:', style.formatters.yaxis_label);
    }

    // Apply Tooltip Formatter
    if (style.formatters?.tooltip) {
      const formatter = this._createTooltipFormatter(style.formatters.tooltip, context.hass);
      if (!optionsWithTypeDefaults.tooltip) optionsWithTypeDefaults.tooltip = {};
      optionsWithTypeDefaults.tooltip.custom = formatter;
      lcardsLog.debug('[ApexChartsAdapter] Applied tooltip formatter:', style.formatters.tooltip);
    }

    // ============================================================================
    // INJECT APEXCHARTS LOCALE
    // ApexCharts has its own locale system (chart.locales + chart.defaultLocale)
    // that drives month/day names in x-axis labels, tooltip headers, and toolbar
    // text at every zoom level. We generate the locale object dynamically from
    // Intl.DateTimeFormat using hass.locale.language — no external JSON files.
    // This fires whenever hass is available; style.chart_options can still
    // override chart.locales / chart.defaultLocale at highest precedence.
    // ============================================================================

    if (context?.hass) {
      const apexLocale = ApexChartsAdapter._buildApexLocale(context.hass);
      if (!optionsWithTypeDefaults.chart) optionsWithTypeDefaults.chart = {};
      optionsWithTypeDefaults.chart.locales = [apexLocale];
      optionsWithTypeDefaults.chart.defaultLocale = apexLocale.name;
      lcardsLog.debug('[ApexChartsAdapter] Injected ApexCharts locale:', apexLocale.name);
    }

    // ============================================================================
    // APPLY CHART_OPTIONS OVERRIDES (Highest precedence)
    // ============================================================================

    let finalOptions = optionsWithTypeDefaults;

    if (style.chart_options) {
      finalOptions = deepMerge(optionsWithTypeDefaults, style.chart_options);
      lcardsLog.debug('[ApexChartsAdapter] Applied chart_options overrides');

      // chart_options must not switch to a chart type we don't support (some
      // ApexCharts types are premium features).
      const overriddenType = finalOptions.chart?.type;
      if (overriddenType && overriddenType !== apexChartType && !this.VALID_CHART_TYPES.includes(overriddenType)) {
        lcardsLog.warn(`[ApexChartsAdapter] chart_options.chart.type '${overriddenType}' is not supported; using '${apexChartType}'`);
        finalOptions.chart.type = apexChartType;
      }
    }

    // ============================================================================
    // FINAL CSS VARIABLE RESOLUTION PASS
    // ============================================================================
    // Recursively resolve ANY remaining CSS variables in the entire options tree
    // This catches:
    // - Variables from theme defaults
    // - Variables from style.chart_options overrides
    // - Variables that slipped through earlier resolution
    //
    // ApexCharts computes shades, gradients and opacity mixes from colour values
    // in JS, so it needs concrete colours rather than var() strings.
    lcardsLog.debug('[ApexChartsAdapter] 🔍 Starting final CSS variable resolution pass');
    finalOptions = this._resolveAllCssVariables(finalOptions);
    lcardsLog.debug('[ApexChartsAdapter] ✅ Final CSS variable resolution complete');

    return finalOptions;
  }

  /**
   * Build an ApexCharts locale object dynamically from hass.locale.language.
   * Generates month and day names via Intl.DateTimeFormat so ApexCharts uses
   * the correct language for x-axis labels, tooltip headers, and toolbar text
   * at every zoom level — no external JSON locale files needed.
   *
   * @param {Object} hass - Home Assistant instance
   * @returns {Object} ApexCharts locale configuration object
   * @private
   */
  static _buildApexLocale(hass) {
    const lang = hass?.locale?.language ?? 'en';

    const months = [];
    const shortMonths = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(2021, m, 1);
      months.push(new Intl.DateTimeFormat(lang, { month: 'long' }).format(d));
      shortMonths.push(new Intl.DateTimeFormat(lang, { month: 'short' }).format(d));
    }

    // Jan 3 2021 is a Sunday — use it as day-0 anchor
    const days = [];
    const shortDays = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(2021, 0, 3 + d);
      days.push(new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(date));
      shortDays.push(new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(date));
    }

    return {
      name: lang,
      options: {
        months,
        shortMonths,
        days,
        shortDays,
        toolbar: {
          exportToSVG: 'Download SVG',
          exportToPNG: 'Download PNG',
          menu: 'Menu',
          selection: 'Selection',
          selectionZoom: 'Selection Zoom',
          zoomIn: 'Zoom In',
          zoomOut: 'Zoom Out',
          pan: 'Panning',
          reset: 'Reset Zoom'
        }
      }
    };
  }

  /**
   * Look up a chart animation preset (`style.animation.preset`).
   * @private
   * @param {string} presetName - Animation preset name
   * @returns {Object|null} ApexCharts `chart.animations` config, or null
   */
  static _getAnimationPreset(presetName) {
    const preset = BUILTIN_THEMES_PACK.chartAnimationPresets?.[presetName];
    if (!preset) {
      lcardsLog.warn(`[ApexChartsAdapter] Animation preset not found: ${presetName}`);
      return null;
    }
    return preset;
  }

  /**
   * Get LCARS-optimized defaults for specific chart type
   * @private
   * @param {string} chartType - Chart type
   * @param {Object} style - Chart style configuration
   * @param {Object} [hass] - For locale-aware number formatting
   * @returns {Object} ApexCharts options specific to chart type
   */
  static _getChartTypeDefaults(chartType, style, hass = null) {
    // Use themeManager resolver if available; otherwise fall back to CSS variable strings
    // (which are resolved in the final _resolveAllCssVariables pass)
    const resolveToken = (tokenPath, fallback) => {
      try {
        const resolver = window.lcards?.core?.themeManager?.resolver;
        return resolver ? (resolver.resolve(tokenPath, fallback) || fallback) : fallback;
      } catch {
        return fallback;
      }
    };

    switch (chartType) {
      // 'column' = vertical bar: apply horizontal: false to distinguish from 'bar' (horizontal)
      case 'column':
        return { plotOptions: { bar: { horizontal: false } } };

      // 'bar' = horizontal bar chart
      case 'bar':
        return { plotOptions: { bar: { horizontal: true } } };
      case 'radialBar':
        return {
          // Several gauges only show values on hover, so the legend carries
          // them (shown unless style.legend.show is false).
          legend: {
            show: style.legend?.show ?? true,
            showForSingleSeries: style.legend?.show ?? true,
            formatter: (seriesName, opts) => {
              const value = opts?.w?.globals?.series?.[opts.seriesIndex];
              if (typeof value !== 'number') return seriesName;
              const text = style.value_format === 'percent' ? `${Math.round(value)}%` : haFormatNumber(hass, value, { maximumFractionDigits: 1 });
              return `${seriesName}: ${text}`;
            }
          },
          plotOptions: {
            radialBar: {
              hollow: {
                size: '65%',
                background: 'transparent'
              },
              track: {
                background: resolveToken('colors.chart.grid', 'var(--lcars-gray, #999999)'),
                strokeWidth: '100%',
                opacity: 0.3
              },
              dataLabels: {
                name: {
                  show: true,
                  fontSize: resolveToken('typography.fontSize.sm', '12px'),
                  fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
                  color: resolveToken('colors.chart.axis', 'var(--lcars-text-gray, var(--lcards-moonlight))'),
                  offsetY: -10
                },
                value: {
                  show: true,
                  fontSize: resolveToken('typography.fontSize.3xl', '24px'),
                  fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
                  color: resolveToken('colors.accent.primary', 'var(--lcars-orange, #FF9900)'),
                  offsetY: 5,
                  formatter: (val) => {
                    return style.value_format === 'percent' ? `${Math.round(val)}%` : val;
                  }
                },
                // A sum of unrelated gauges (battery + humidity) means nothing,
                // so the total is opt-in (style.gauge_total).
                total: {
                  show: style.gauge_total === true,
                  label: 'TOTAL',
                  fontSize: resolveToken('typography.fontSize.sm', '12px'),
                  fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
                  color: resolveToken('colors.chart.axis', 'var(--lcars-text-gray, var(--lcards-moonlight))'),
                  formatter: (w) => {
                    const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    return style.value_format === 'percent' ? `${Math.round(total)}%` : total;
                  }
                }
              },
              startAngle: style.gauge_start_angle || -90,
              endAngle: style.gauge_end_angle || 90
            }
          }
        };

      case 'rangeBar':
        return {
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: '70%',
              rangeBarOverlap: false,
              rangeBarGroupRows: style.group_rows !== false
            }
          },
          xaxis: {
            type: 'datetime',
            labels: {
              // Axis label colours/fonts come from style (base options), not per type
              datetimeUTC: false
            }
          },
          dataLabels: {
            enabled: style.show_labels !== false,
            style: {
              fontSize: resolveToken('typography.fontSize.xs', '10px'),
              fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif')
            }
          }
        };

      case 'polarArea':
        return {
          plotOptions: {
            polarArea: {
              rings: {
                strokeWidth: 1,
                strokeColor: resolveToken('colors.chart.grid', 'var(--lcars-gray, #999999)')
              },
              spokes: {
                strokeWidth: 1,
                connectorColors: resolveToken('colors.chart.grid', 'var(--lcars-gray, #999999)')
              }
            }
          },
          stroke: {
            width: 2,
            colors: [resolveToken('colors.chart.background', '#000000')]
          },
          fill: {
            opacity: 0.8
          },
          legend: {
            position: style.legend?.position ?? 'bottom',
            fontSize: resolveToken('typography.fontSize.sm', '12px'),
            fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
            labels: {
              colors: resolveToken('colors.chart.axis', 'var(--lcars-text-gray, var(--lcards-moonlight))')
            }
          }
        };

      case 'treemap':
        return {
          plotOptions: {
            treemap: {
              enableShades: true,
              shadeIntensity: 0.5,
              distributed: true,
              colorScale: {
                ranges: [
                  {
                    from: 0,
                    to: 25,
                    color: resolveToken('colors.chart.series1', 'var(--lcars-blue, #9999FF)')
                  },
                  {
                    from: 25,
                    to: 50,
                    color: resolveToken('colors.status.success', 'var(--lcars-green, #99CC99)')
                  },
                  {
                    from: 50,
                    to: 75,
                    color: resolveToken('colors.status.warning', 'var(--lcars-orange, #FF9900)')
                  },
                  {
                    from: 75,
                    to: 100,
                    color: resolveToken('colors.status.error', 'var(--lcars-red, #CC6666)')
                  }
                ]
              }
            }
          },
          dataLabels: {
            enabled: true,
            style: {
              fontSize: resolveToken('typography.fontSize.sm', '12px'),
              fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
              fontWeight: 'bold'
            },
            offsetY: -4
          }
        };

      case 'rangeArea':
        // Type defaults are merged over the base options, so fall back to the
        // user's style rather than overriding it.
        return {
          stroke: {
            curve: style.stroke?.curve ?? 'straight',
            width: style.stroke?.width ?? 1
          },
          fill: {
            type: style.fill?.type ?? 'solid',
            opacity: style.fill?.opacity ?? 0.35
          },
          markers: {
            size: style.markers?.size ?? 0
          }
        };

      case 'scatter':
        return {
          markers: {
            size: style.markers?.size ?? 6,
            strokeWidth: 0,
            hover: {
              sizeOffset: 3
            }
          },
          grid: {
            borderColor: resolveToken('colors.chart.grid', 'var(--lcars-gray, #999999)'),
            strokeDashArray: 4,
            xaxis: {
              lines: { show: style.grid?.show !== false }
            },
            yaxis: {
              lines: { show: style.grid?.show !== false }
            }
          },
          dataLabels: {
            enabled: false // Usually too cluttered for scatter
          },
          legend: {
            position: style.legend?.position ?? 'top',
            fontSize: resolveToken('typography.fontSize.sm', '12px'),
            fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
            labels: {
              colors: resolveToken('colors.chart.axis', 'var(--lcars-text-gray, var(--lcards-moonlight))')
            }
          }
        };

      case 'candlestick':
        return {
          plotOptions: {
            candlestick: {
              colors: {
                upward: resolveToken('colors.status.success', 'var(--lcars-green, #99CC99)'),
                downward: resolveToken('colors.status.error', 'var(--lcars-red, #CC6666)')
              },
              wick: {
                useFillColor: true
              }
            }
          },
          xaxis: {
            type: 'datetime',
            labels: {
              // Axis label colours/fonts come from style (base options), not per type
              datetimeUTC: false
            }
          }
        };

      case 'boxPlot':
        return {
          plotOptions: {
            boxPlot: {
              colors: {
                upper: style.color || resolveToken('colors.accent.primary', 'var(--lcars-blue, #9999FF)'),
                lower: style.color || resolveToken('colors.accent.primary', 'var(--lcars-blue, #9999FF)')
              }
            }
          },
          stroke: {
            width: 2,
            colors: [resolveToken('colors.chart.axis', 'var(--lcars-text-gray, var(--lcards-moonlight))')]
          }
        };

      default:
        return {};
    }
  }

  /**
   * Recursively resolve ALL CSS variables in an object tree
   * This is the FINAL pass that ensures ApexCharts never receives CSS variables
   *
   * @private
   * @param {any} obj - Object to process (can be object, array, string, etc.)
   * @returns {any} Object with all CSS variables resolved
   */
  static _resolveAllCssVariables(obj) {
    // Handle null/undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays - recursively process each element
    if (Array.isArray(obj)) {
      return obj.map(item => this._resolveAllCssVariables(item));
    }

    // Handle objects - recursively process each property
    if (typeof obj === 'object') {
      const resolved = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this._resolveAllCssVariables(value);
      }
      return resolved;
    }

    // Strings: colour expressions (theme: tokens, computed functions, CSS
    // variables) become concrete colours ApexCharts can shade; other strings
    // (series names, labels, font stacks) only get their var() materialised.
    if (typeof obj === 'string') {
      if (!(obj.startsWith('theme:') || isComputedColor(obj) || obj.includes('var('))) return obj;
      const color = resolveColor(obj, { concrete: true, fallback: null });
      const resolved = color ?? (obj.includes('var(') ? ColorUtils.resolveCssVariable(obj) : obj);
      if (resolved !== obj) {
        lcardsLog.debug(`[ApexChartsAdapter] 🎨 Resolved colour: ${obj} → ${resolved}`);
      }
      return resolved;
    }

    // All other types pass through unchanged
    return obj;
  }

  /**
   * Apply per-series display fields from sources[] and the card's yaxis[].
   *
   * Series fields (color, stroke_width, curve, stroke_dash, opacity) override
   * the matching style.* value for that series only. Card yaxis[] entries
   * become ApexCharts axes; each series joins the axis named by its yaxis_id
   * (or the first axis). Units and float_precision drive tooltip values.
   *
   * @private
   * @param {Object} options - ApexCharts options (mutated)
   * @param {Array<Object>} series - Normalised series with resolved `name`/`unit`
   * @param {Array<Object>|undefined} yaxisConfig - Card yaxis[]
   * @param {{valueDecimals: number|null, hass?: Object, markerFillSet?: boolean}} format
   *   markerFillSet: style.colors.marker.fill was given, so markers keep it
   */
  static _applySeriesOptions(options, series, yaxisConfig, { valueDecimals, hass, markerFillSet = false }) {
    const perSeries = (field, fallback) => (series.some(s => s[field] !== undefined)
      ? series.map((s, i) => s[field] ?? (Array.isArray(fallback) ? fallback[i % fallback.length] : fallback))
      : null);

    const baseColors = Array.isArray(options.colors) && options.colors.length ? options.colors : DEFAULT_SERIES_COLORS;
    const colors = perSeries('color', baseColors);
    if (colors) {
      options.colors = colors;
      // Markers (incl. the hover dot) follow the series colours unless styled explicitly
      if (!markerFillSet && options.markers) options.markers.colors = colors;
    }

    const width = perSeries('stroke_width', options.stroke?.width);
    if (width) options.stroke.width = width;
    const curve = perSeries('curve', options.stroke?.curve);
    if (curve) options.stroke.curve = curve;
    const dash = perSeries('stroke_dash', options.stroke?.dashArray ?? 0);
    if (dash) options.stroke.dashArray = dash;
    const opacity = perSeries('opacity', options.fill?.opacity);
    if (opacity) options.fill.opacity = opacity;

    const format = (value, decimals, unit) => {
      if (typeof value !== 'number') return value;
      const text = decimals !== null && decimals !== undefined
        ? haFormatNumber(hass, value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : haFormatNumber(hass, value, { maximumFractionDigits: 2 });
      return unit ? `${text} ${unit}` : text;
    };

    // Tooltip: per-series unit and precision
    if (series.some(s => s.unit || s.float_precision !== undefined)) {
      options.tooltip = {
        ...options.tooltip,
        y: {
          ...options.tooltip?.y,
          formatter: (value, /** @type {{seriesIndex?: number}} */ opts = {}) => {
            const s = series[opts.seriesIndex ?? -1] ?? {};
            return format(value, s.float_precision ?? valueDecimals, s.unit);
          }
        }
      };
    }

    // Multiple Y axes
    if (Array.isArray(yaxisConfig) && yaxisConfig.length) {
      const base = Array.isArray(options.yaxis) ? options.yaxis[0] : (options.yaxis ?? {});
      const firstId = yaxisConfig[0].id;
      options.yaxis = yaxisConfig.map(axis => {
        const members = series.filter(s => (s.yaxis_id ?? firstId) === axis.id);
        const decimals = axis.decimals ?? valueDecimals;
        const unit = members.length && members.every(m => m.unit === members[0].unit) ? members[0].unit : undefined;
        return {
          ...base,
          seriesName: members.map(m => m.name),
          show: axis.show ?? true,
          opposite: axis.opposite ?? false,
          ...(axis.min !== undefined && { min: axis.min }),
          ...(axis.max !== undefined && { max: axis.max }),
          labels: {
            ...base.labels,
            formatter: (value) => format(value, decimals, unit)
          }
        };
      });
    }
  }

  /**
   * Build annotations (zero line, threshold lines) from style config
   * @private
   * @param {Object} style - Chart style configuration
   * @param {{fontFamily?: string, fontSize?: number}} [font] - Chart typography for labels
   * @returns {Object} ApexCharts annotations object
   */
  static _buildAnnotations(style, { fontFamily, fontSize } = /** @type {{fontFamily?: string, fontSize?: number}} */ ({})) {
    const labelText = 'var(--lcars-text-dark, #000000)';
    const labelFont = {
      fontSize: `${Math.max(8, (fontSize ?? 12) - 2)}px`,
      fontFamily: fontFamily ?? 'Antonio, Helvetica Neue, sans-serif'
    };

    const annotations = {
      yaxis: [],
      xaxis: [],
      points: []
    };

    // Zero line
    if (style.zero_line) {
      annotations.yaxis.push({
        y: 0,
        borderColor: style.zero_line_color || 'var(--lcars-gray, var(--lcards-gray-medium, #666688))',
        strokeDashArray: 2,
        opacity: 0.5,
        label: {
          text: 'Zero',
          style: {
            color: labelText,
            background: style.zero_line_color || 'var(--lcars-gray, var(--lcards-gray-medium, #666688))',
            ...labelFont
          }
        }
      });
    }

    // Threshold lines
    if (style.thresholds && Array.isArray(style.thresholds)) {
      style.thresholds.forEach(threshold => {
        annotations.yaxis.push({
          y: threshold.value,
          borderColor: threshold.color || 'var(--lcars-red, var(--lcards-orange-dark, #dd4444))',
          strokeDashArray: threshold.dash ? 4 : 0,
          opacity: threshold.opacity || 0.7,
          borderWidth: threshold.width || 2,
          label: threshold.label ? {
            text: threshold.label,
            style: {
              color: labelText,
              background: threshold.color || 'var(--lcars-red, var(--lcards-orange-dark, #dd4444))',
              ...labelFont
            },
            position: 'right',
            offsetX: 0,
            offsetY: -5
          } : undefined
        });
      });
    }

    return annotations;
  }

  /**
   * Create label formatter from template string
   * @private
   * @param {string} format - Format template (e.g., "MMM DD", "{value}°C")
   * @param {string} axis - Axis type ('xaxis' or 'yaxis')
   * @param {Object} [hass] - Home Assistant instance for locale-aware formatting
   * @returns {Function} ApexCharts formatter function
   */
  static _createLabelFormatter(format, axis, hass = null) {
    // Check if it's a date format (no braces) or value template
    if (!format.includes('{')) {
      // Assume date format for x-axis
      return function(val) {
        if (axis === 'xaxis' && typeof val === 'number') {
          return ApexChartsAdapter._formatDate(val, format, hass);
        }
        return val;
      };
    }

    // Value template (e.g., "{value}°C")
    return function(val) {
      const formatted = typeof val === 'number' ? haFormatNumber(hass, val, { maximumFractionDigits: 1 }) : val;
      return format.replace('{value}', formatted);
    };
  }

  /**
   * Create a custom tooltip renderer from a template string.
   *
   * ApexCharts places the returned HTML inside its own `.apexcharts-tooltip`
   * element, so only the inner content is returned (a nested
   * `.apexcharts-tooltip` would stay at opacity 0).
   *
   * @private
   * @param {string} format - Format template (e.g., "{x|MMM DD}: {y}°C")
   * @param {Object} [hass] - Home Assistant instance for locale-aware formatting
   * @returns {Function} ApexCharts tooltip.custom function
   */
  static _createTooltipFormatter(format, hass = null) {
    return function({ series, seriesIndex, dataPointIndex, w }) {
      const x = w.globals.seriesX[seriesIndex][dataPointIndex];
      const y = series[seriesIndex][dataPointIndex];

      let output = format;

      // {x|format} formats the x value as a date; plain {x} uses a default format
      const xMatch = output.match(/\{x\|([^}]+)\}/);
      if (xMatch) {
        output = output.replace(xMatch[0], ApexChartsAdapter._formatDate(x, xMatch[1], hass));
      } else if (output.includes('{x}')) {
        const formattedX = typeof x === 'number' ? ApexChartsAdapter._formatDate(x, 'MMM DD HH:mm', hass) : x;
        output = output.replace('{x}', formattedX);
      }

      if (output.includes('{y}')) {
        const formattedY = typeof y === 'number' ? haFormatNumber(hass, y, { maximumFractionDigits: 1 }) : y;
        output = output.replace('{y}', formattedY);
      }

      if (output.includes('{seriesName}')) {
        output = output.replace('{seriesName}', w.globals.seriesNames?.[seriesIndex] ?? '');
      }

      return `<div class="apexcharts-tooltip-text lcards-chart-tooltip">${output}</div>`;
    };
  }

  /**
   * Format a date with moment-style tokens in a single pass, so text inserted
   * for one token (e.g. the month name "May") is never re-read as another
   * token. Wrap literal text in square brackets: "[at] HH:mm".
   *
   * Tokens: YYYY YY MMMM MMM MM M dddd ddd DD D HH H hh h mm m ss s A a
   *
   * @private
   * @param {number|Date} timestamp - Timestamp (ms) or Date
   * @param {string} format - Format string (e.g., "MMM DD", "HH:mm", "YYYY-MM-DD HH:mm")
   * @param {Object} [hass] - Home Assistant instance (locale for month/day names)
   * @returns {string} Formatted date string
   */
  static _formatDate(timestamp, format, hass = null) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) {
      return String(timestamp);
    }

    const locale = hass?.locale?.language ?? 'en';
    const name = (options) => new Intl.DateTimeFormat(locale, options).format(date);
    const pad = (n) => String(n).padStart(2, '0');
    const hours = date.getHours();
    const hours12 = hours % 12 || 12;

    const tokens = {
      YYYY: () => String(date.getFullYear()),
      YY: () => String(date.getFullYear()).slice(-2),
      MMMM: () => name({ month: 'long' }),
      MMM: () => name({ month: 'short' }),
      MM: () => pad(date.getMonth() + 1),
      M: () => String(date.getMonth() + 1),
      dddd: () => name({ weekday: 'long' }),
      ddd: () => name({ weekday: 'short' }),
      DD: () => pad(date.getDate()),
      D: () => String(date.getDate()),
      HH: () => pad(hours),
      H: () => String(hours),
      hh: () => pad(hours12),
      h: () => String(hours12),
      mm: () => pad(date.getMinutes()),
      m: () => String(date.getMinutes()),
      ss: () => pad(date.getSeconds()),
      s: () => String(date.getSeconds()),
      A: () => (hours >= 12 ? 'PM' : 'AM'),
      a: () => (hours >= 12 ? 'pm' : 'am')
    };

    return format.replace(
      /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g,
      (match, literal) => (literal !== undefined ? literal : tokens[match]())
    );
  }
}
