/**
 * [ApexChartsAdapter] Lightweight translator between MSD DataSource and ApexCharts
 * 📊 Handles format conversion without modifying DataSource architecture
 *
 * Responsibilities:
 * - Convert RollingBuffer format to ApexCharts series format
 * - Support dot notation for enhanced DataSource paths
 * - Map MSD style config to ApexCharts options
 * - Handle multi-series aggregation
 * - Provide exact pixel dimensions for HTML overlay rendering
 * - Resolve CSS variables to computed colors (canvas compatibility)
 *
 * Integration:
 * - Works with ApexChartsOverlayRenderer for HTML div overlay approach
 * - Integrates with MSD DataSourceManager for real-time data
 * - Supports time windowing and data decimation
 * - Expects theme tokens to be pre-resolved by calling card
 *
 * Note: Theme token resolution (theme:, alpha(), darken(), etc.) is handled
 * by the calling card (lcards-chart.js) using resolveThemeTokensRecursive().
 * This adapter focuses on CSS variable resolution for canvas compatibility.
 *
 * @module ApexChartsAdapter
 * @requires lcards-logging
 * @requires deepMerge
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import { deepMerge } from '../utils/deepMerge.js';

export class ApexChartsAdapter {
  /**
   * Valid ApexCharts chart types supported by MSD
   * @constant {string[]}
   */
  static VALID_CHART_TYPES = [
    // Existing types (7)
    'line',
    'area',
    'bar',
    'pie',
    'donut',
    'radar',
    'heatmap',

    // NEW: Additional chart types (8)
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
   * Convert MSD DataSource to ApexCharts series format
   * @param {string} sourceRef - DataSource reference (supports dot notation like "temp.transformations.celsius")
   * @param {Object} dataSourceManager - MSD DataSourceManager instance
   * @param {Object} config - Configuration options
   * @returns {Array} ApexCharts series array
   */
  static convertToSeries(sourceRef, dataSourceManager, config = {}) {
    try {
      // Parse dot notation (e.g., "temp.transformations.celsius")
      const { dataSource, dataPath } = this._resolveDataSourcePath(sourceRef, dataSourceManager);

      if (!dataSource) {
        lcardsLog.warn(`[ApexChartsAdapter] DataSource not found: ${sourceRef}`);
        return [];
      }

      // Get historical data with error boundary
      let data;
      try {
        if (dataPath) {
          data = this._getEnhancedData(dataSource, dataPath, config);
        } else {
          data = this._getRawData(dataSource, config);
        }
      } catch (dataError) {
        lcardsLog.error(`[ApexChartsAdapter] Error getting data for ${sourceRef}:`, dataError);
        return [];
      }

      if (!data || data.length === 0) {
        lcardsLog.warn(`[ApexChartsAdapter] No data available for: ${sourceRef}`);
        return [];
      }

      // Convert to ApexCharts format
      const seriesName = config.name || this._extractSeriesName(sourceRef);

      // ✅ NEW: Detect if data contains multi-value arrays (from rolling_statistics)
      // Check first data point to determine if values are arrays
      const hasArrayValues = data.length > 0 && Array.isArray(data[0].value || data[0].v);

      if (hasArrayValues) {
        // ✅ NEW: Handle multi-value array data for rangeArea, candlestick, boxPlot
        const validData = data
          .filter(point => {
            const x = point.timestamp || point.t;
            const y = point.value || point.v;

            // For array values, validate x and that y is an array
            const isValid = (
              x !== undefined &&
              x !== null &&
              !isNaN(Number(x)) &&
              Array.isArray(y) &&
              y.length > 0 &&
              y.every(val => val !== null && val !== undefined && !isNaN(Number(val)) && isFinite(val))
            );

            if (!isValid && config.debug) {
              lcardsLog.debug(`[ApexChartsAdapter] Filtered invalid multi-value point:`, { x, y, point });
            }

            return isValid;
          })
          .map(point => ({
            x: point.timestamp || point.t,
            y: point.value || point.v  // Keep as array for ApexCharts
          }));

        // ✅ NEW: Log info about multi-value data processing
        if (validData.length > 0 && config.debug) {
          const sampleY = validData[0].y;
          lcardsLog.debug(`[ApexChartsAdapter] Processing multi-value data for ${seriesName}:`, {
            points: validData.length,
            valuesPerPoint: sampleY.length,
            sample: sampleY
          });
        }

        // ✅ FIXED: Log warning if data was filtered
        if (validData.length < data.length) {
          lcardsLog.warn(`[ApexChartsAdapter] Filtered ${data.length - validData.length} invalid multi-value points from ${sourceRef}`, {
            original: data.length,
            valid: validData.length
          });
        }

        // ✅ FIXED: Return empty series if no valid data
        if (validData.length === 0) {
          lcardsLog.warn(`[ApexChartsAdapter] No valid multi-value data points for series ${seriesName} (${sourceRef})`);
          return [{
            name: seriesName,
            data: []
          }];
        }

        return [{
          name: seriesName,
          data: validData
        }];
      }

      // ✅ EXISTING: Handle single-value data (original code path)
      const validData = data
        .filter(point => {
          const x = point.timestamp || point.t;
          const y = point.value || point.v;

          // Strict validation: both x and y must be valid numbers
          const isValid = (
            x !== undefined &&
            x !== null &&
            !isNaN(Number(x)) &&
            y !== undefined &&
            y !== null &&
            !isNaN(Number(y)) &&
            isFinite(y)  // Reject Infinity and -Infinity
          );

          if (!isValid && config.debug) {
            lcardsLog.debug(`[ApexChartsAdapter] Filtered invalid point:`, { x, y, point });
          }

          return isValid;
        })
        .map(point => ({
          x: point.timestamp || point.t,
          y: point.value || point.v
        }));

      // ✅ FIXED: Log warning if data was filtered
      if (validData.length < data.length) {
        lcardsLog.warn(`[ApexChartsAdapter] Filtered ${data.length - validData.length} invalid points from ${sourceRef}`, {
          original: data.length,
          valid: validData.length
        });
      }

      // ✅ FIXED: Return empty series if no valid data (prevents ApexCharts errors)
      if (validData.length === 0) {
        lcardsLog.warn(`[ApexChartsAdapter] No valid data points for series ${seriesName} (${sourceRef})`);
        return [{
          name: seriesName,
          data: []  // Empty array is safe for ApexCharts
        }];
      }

      return [{
        name: seriesName,
        data: validData
      }];

    } catch (error) {
      lcardsLog.error(`[ApexChartsAdapter] Critical error in convertToSeries for ${sourceRef}:`, error);
      return [];
    }
  }

  /**
   * Convert multiple DataSources to multi-series format
   * @param {Array<string>|string} sourceRefs - Array of DataSource references or single reference
   * @param {Object} dataSourceManager - MSD DataSourceManager instance
   * @param {Object} config - Configuration options
   * @param {Object} [config.seriesNames] - Map of sourceRef to series name
   * @returns {Array} ApexCharts multi-series array
   */
  static convertToMultiSeries(sourceRefs, dataSourceManager, config = {}) {
    if (!Array.isArray(sourceRefs)) {
      return this.convertToSeries(sourceRefs, dataSourceManager, config);
    }

    const allSeries = [];

    sourceRefs.forEach(sourceRef => {
      const series = this.convertToSeries(sourceRef, dataSourceManager, {
        ...config,
        name: config.seriesNames?.[sourceRef] || this._extractSeriesName(sourceRef)
      });

      // ✅ FIXED: Only add series with valid data
      if (series && series.length > 0) {
        // Validate each series has at least some data or is intentionally empty
        const validSeries = series.filter(s => {
          if (!s.data || !Array.isArray(s.data)) {
            lcardsLog.warn(`[ApexChartsAdapter] Series ${s.name} has invalid data structure`);
            return false;
          }
          return true;  // Keep series even if empty (ApexCharts can handle empty arrays)
        });

        allSeries.push(...validSeries);
      }
    });

    // ✅ FIXED: Ensure at least one series exists (even if empty)
    if (allSeries.length === 0) {
      lcardsLog.warn(`[ApexChartsAdapter] No valid series data from sources:`, sourceRefs);
      // Return single empty series to prevent ApexCharts initialization errors
      return [{
        name: 'No Data',
        data: []
      }];
    }

    return allSeries;
  }

  /**
   * Generate ApexCharts options from MSD style config
   *
   * ✅ MODERNIZED (2026-01): Uses standard LCARdS utilities
   * - Theme tokens resolved by calling card (lcards-chart.js line 552)
   * - Supports ALL ApexCharts color properties (series, stroke, fill, markers, etc.)
   * - Resolves CSS variables to actual colors (ApexCharts is canvas-based)
   * - Uses standard deepMerge utility from utils
   * - Maintains backward compatibility with existing configs
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
    
    // Note: Chart card already resolves theme tokens before calling this method
    // (see lcards-chart.js line 552: resolveThemeTokensRecursive)
    // We just need to handle any remaining CSS variables for canvas compatibility

    let chartType = style.chart_type || style.type || 'line';

    // Validate chart type
    if (!this.VALID_CHART_TYPES.includes(chartType)) {
      lcardsLog.warn(`[ApexChartsAdapter] Invalid chart type: ${chartType}, defaulting to 'line'`);
      chartType = 'line';
    }

    // Helper: convert null to undefined for ApexCharts compatibility
    // ApexCharts doesn't handle null gracefully for optional color arrays
    const nullToUndefined = (value) => value === null ? undefined : value;

    // ============================================================================
    // EXTRACT RESOLVED VALUES
    // ============================================================================
    // All theme tokens are already resolved by chart card, just extract values

    // Series colors (Primary data visualization)
    let colors = style.colors?.series ?? null;

    // Stroke/outline colors
    let strokeColors = style.colors?.stroke ?? null;
    const strokeWidth = style.stroke?.width ?? 2;
    const curve = style.stroke?.curve ?? 'smooth';

    // Fill colors (for area/bar charts)
    const fillColors = style.colors?.fill ?? null;
    const fillType = style.fill?.type ?? 'solid';
    const fillOpacity = style.fill?.opacity ?? 0.7;

    // Background & foreground
    const backgroundColor = style.colors?.background ?? 'transparent';
    const foregroundColor = style.colors?.foreground ?? 'var(--lcars-white, #FFFFFF)';

    // Grid colors
    const gridColor = style.colors?.grid ?? 'var(--lcars-gray, #999999)';
    const gridRowColors = style.grid?.row_colors ?? null;
    const gridColumnColors = style.grid?.column_colors ?? null;
    const showGrid = style.grid?.show ?? true;

    // Axis colors
    const unifiedAxisColor = style.colors?.axis?.x ?? style.colors?.axis?.y ?? foregroundColor;
    const xaxisColor = style.colors?.axis?.x ?? unifiedAxisColor;
    const xaxisColors = null; // Not part of nested structure
    const yaxisColor = style.colors?.axis?.y ?? unifiedAxisColor;
    const yaxisColors = null; // Not part of nested structure
    const axisBorderColor = style.colors?.axis?.border ?? gridColor;
    const axisTicksColor = style.colors?.axis?.ticks ?? gridColor;

    // Legend colors
    const legendColor = style.colors?.legend?.default ?? foregroundColor;
    const legendColors = style.colors?.legend?.items ?? null;
    const showLegend = style.legend?.show ?? false;

    // Marker colors (data points)
    const markerColors = style.colors?.marker?.fill ?? colors;
    const markerStrokeColors = style.colors?.marker?.stroke ?? foregroundColor;
    const markerStrokeWidth = style.markers?.stroke?.width ?? 2;

    // Data label colors
    const dataLabelColors = style.colors?.data_labels ?? foregroundColor;
    const showDataLabels = style.data_labels?.show ?? false;

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
        type: chartType,
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
        colors: nullToUndefined(strokeColors)
      },

      // Fill (area/bar charts)
      fill: {
        colors: nullToUndefined(fillColors),
        type: fillType,
        opacity: fillOpacity
      },

      // Grid
      grid: {
        show: showGrid,
        borderColor: gridColor,
        strokeDashArray: 4,
        opacity: 0.3,
        ...(gridRowColors && { row: { colors: gridRowColors } }),
        ...(gridColumnColors && { column: { colors: gridColumnColors } })
      },

      // X-axis
      xaxis: {
        labels: {
          style: {
            colors: nullToUndefined(xaxisColors) || xaxisColor,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily
          }
        },
        axisBorder: {
          color: axisBorderColor
        },
        axisTicks: {
          color: axisTicksColor
        }
      },

      // Y-axis
      yaxis: {
        labels: {
          style: {
            colors: nullToUndefined(yaxisColors) || yaxisColor,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily
          }
        },
        axisBorder: {
          color: axisBorderColor
        },
        axisTicks: {
          color: axisTicksColor
        }
      },

      // Legend
      legend: {
        show: showLegend,
        fontSize: `${fontSize + 2}px`,
        fontFamily: fontFamily,
        labels: {
          colors: nullToUndefined(legendColors) || legendColor
        }
      },

      // Markers (data points)
      markers: {
        colors: nullToUndefined(markerColors),
        strokeColors: nullToUndefined(markerStrokeColors),
        strokeWidth: markerStrokeWidth
      },

      // Data labels
      dataLabels: {
        enabled: showDataLabels,
        style: {
          colors: nullToUndefined(dataLabelColors),
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily
        }
      },

      // Tooltip
      tooltip: {
        enabled: showTooltip,
        theme: tooltipTheme,
        style: {
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily
        }
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
      }
    };

    // ============================================================================
    // APPLY TYPE-SPECIFIC DEFAULTS
    // ============================================================================

    const typeDefaults = this._getChartTypeDefaults(chartType, style);
    const optionsWithTypeDefaults = deepMerge(baseOptions, typeDefaults);

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
      const formatter = this._createLabelFormatter(style.formatters.xaxis_label, 'xaxis');
      if (!optionsWithTypeDefaults.xaxis) optionsWithTypeDefaults.xaxis = {};
      if (!optionsWithTypeDefaults.xaxis.labels) optionsWithTypeDefaults.xaxis.labels = {};
      optionsWithTypeDefaults.xaxis.labels.formatter = formatter;
      lcardsLog.debug('[ApexChartsAdapter] Applied xaxis_label formatter:', style.formatters.xaxis_label);
    }

    // Apply Y-Axis Label Formatter
    if (style.formatters?.yaxis_label) {
      const formatter = this._createLabelFormatter(style.formatters.yaxis_label, 'yaxis');
      if (!optionsWithTypeDefaults.yaxis) optionsWithTypeDefaults.yaxis = {};
      if (!optionsWithTypeDefaults.yaxis.labels) optionsWithTypeDefaults.yaxis.labels = {};
      optionsWithTypeDefaults.yaxis.labels.formatter = formatter;
      lcardsLog.debug('[ApexChartsAdapter] Applied yaxis_label formatter:', style.formatters.yaxis_label);
    }

    // Apply Tooltip Formatter
    if (style.formatters?.tooltip) {
      const formatter = this._createTooltipFormatter(style.formatters.tooltip);
      if (!optionsWithTypeDefaults.tooltip) optionsWithTypeDefaults.tooltip = {};
      optionsWithTypeDefaults.tooltip.custom = formatter;
      lcardsLog.debug('[ApexChartsAdapter] Applied tooltip formatter:', style.formatters.tooltip);
    }

    // ============================================================================
    // APPLY CHART_OPTIONS OVERRIDES (Highest precedence)
    // ============================================================================

    let finalOptions = optionsWithTypeDefaults;

    if (style.chart_options) {
      finalOptions = deepMerge(optionsWithTypeDefaults, style.chart_options);
      lcardsLog.debug('[ApexChartsAdapter] Applied chart_options overrides');
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
    // CRITICAL: ApexCharts is canvas-based and doesn't understand CSS variables.
    // This is adapter-specific logic that must remain because CSS variables
    // work in HTML/CSS but not in canvas rendering contexts.
    lcardsLog.debug('[ApexChartsAdapter] 🔍 Starting final CSS variable resolution pass');
    finalOptions = this._resolveAllCssVariables(finalOptions);
    lcardsLog.debug('[ApexChartsAdapter] ✅ Final CSS variable resolution complete');

    return finalOptions;
  }

  /**
   * Get animation preset from pack registry or builtin presets
   * @private
   * @param {string} presetName - Animation preset name
   * @returns {Object|null} Animation configuration or null
   */
  static _getAnimationPreset(presetName) {
    try {
      // First try: Access pack registry via CoreConfigManager singleton (works in both MSD and standalone)
      const coreConfigManager = window.lcards?.core?.configManager;
      const packRegistry = coreConfigManager?.context?.packRegistry;

      if (packRegistry) {
        // Check all packs for animation presets
        const packs = packRegistry.getAllPacks();
        for (const pack of packs) {
          if (pack.chartAnimationPresets && pack.chartAnimationPresets[presetName]) {
            lcardsLog.debug(`[ApexChartsAdapter] Found animation preset '${presetName}' in pack: ${pack.id}`);
            return pack.chartAnimationPresets[presetName];
          }
        }
      }

      // Fallback: Use builtin presets (for cases where PackRegistry not available)
      const builtinPresets = this._getBuiltinAnimationPresets();
      if (builtinPresets[presetName]) {
        lcardsLog.debug(`[ApexChartsAdapter] Using builtin animation preset: ${presetName}`);
        return builtinPresets[presetName];
      }

      lcardsLog.warn(`[ApexChartsAdapter] Animation preset not found: ${presetName}`);
      return null;

    } catch (error) {
      lcardsLog.error('[ApexChartsAdapter] Error loading animation preset:', error);
      return null;
    }
  }

  /**
   * Get builtin animation presets (for standalone cards without PackRegistry)
   * @private
   * @returns {Object} Builtin animation presets
   */
  static _getBuiltinAnimationPresets() {
    return {
      lcars_standard: {
        enabled: true,
        easing: 'easeinout',
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
      lcars_dramatic: {
        enabled: true,
        easing: 'easeout',
        speed: 1200,
        animateGradually: {
          enabled: true,
          delay: 200
        },
        dynamicAnimation: {
          enabled: true,
          speed: 500
        }
      },
      lcars_minimal: {
        enabled: true,
        easing: 'easein',
        speed: 400,
        animateGradually: {
          enabled: false
        },
        dynamicAnimation: {
          enabled: true,
          speed: 200
        }
      },
      lcars_realtime: {
        enabled: false,
        easing: 'linear',
        speed: 0,
        animateGradually: {
          enabled: false
        },
        dynamicAnimation: {
          enabled: true,
          speed: 100
        }
      },
      lcars_alert: {
        enabled: true,
        easing: 'easeout',
        speed: 600,
        animateGradually: {
          enabled: true,
          delay: 100
        },
        dynamicAnimation: {
          enabled: true,
          speed: 250
        }
      },
      none: {
        enabled: false,
        easing: 'linear',
        speed: 0,
        animateGradually: {
          enabled: false
        },
        dynamicAnimation: {
          enabled: false
        }
      }
    };
  }

  /**
   * Get LCARS-optimized defaults for specific chart type
   * @private
   * @param {string} chartType - Chart type
   * @param {Object} style - MSD style configuration
   * @returns {Object} ApexCharts options specific to chart type
   */
  static _getChartTypeDefaults(chartType, style) {
    const resolveToken = (tokenPath, fallback) => {
      try {
        return themeTokenResolver?.resolve(tokenPath) || fallback;
      } catch {
        return fallback;
      }
    };

    switch (chartType) {
      case 'radialBar':
        return {
          plotOptions: {
            radialBar: {
              hollow: {
                size: '65%',
                background: 'transparent'
              },
              track: {
                background: resolveToken('colors.ui.disabled', 'var(--lcars-gray, #999999)'),
                strokeWidth: '100%',
                opacity: 0.3
              },
              dataLabels: {
                name: {
                  show: true,
                  fontSize: resolveToken('typography.fontSize.sm', '12px'),
                  fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
                  color: resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)'),
                  offsetY: -10
                },
                value: {
                  show: true,
                  fontSize: resolveToken('typography.fontSize.2xl', '24px'),
                  fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
                  color: resolveToken('colors.accent.primary', 'var(--lcars-orange, #FF9900)'),
                  offsetY: 5,
                  formatter: (val) => {
                    return style.value_format === 'percent' ? `${Math.round(val)}%` : val;
                  }
                },
                total: {
                  show: true,
                  label: 'TOTAL',
                  fontSize: resolveToken('typography.fontSize.sm', '12px'),
                  fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
                  color: resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)'),
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
              datetimeUTC: false,
              style: {
                colors: resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)'),
                fontSize: resolveToken('typography.fontSize.xs', '10px'),
                fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif')
              }
            }
          },
          yaxis: {
            labels: {
              style: {
                colors: resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)'),
                fontSize: resolveToken('typography.fontSize.xs', '10px'),
                fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif')
              }
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
                strokeColor: resolveToken('colors.ui.border', 'var(--lcars-gray, #999999)')
              },
              spokes: {
                strokeWidth: 1,
                connectorColors: resolveToken('colors.ui.border', 'var(--lcars-gray, #999999)')
              }
            }
          },
          stroke: {
            width: 2,
            colors: [resolveToken('colors.ui.background', 'var(--lcars-black, #000000)')]
          },
          fill: {
            opacity: 0.8
          },
          legend: {
            position: style.legend?.position ?? 'bottom',
            fontSize: resolveToken('typography.fontSize.sm', '12px'),
            fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
            labels: {
              colors: resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)')
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
        return {
          stroke: {
            curve: 'straight',
            width: [0, 2, 2, 0], // Outer lines invisible, inner lines visible
            colors: [
              'transparent',
              resolveToken('colors.accent.primary', 'var(--lcars-orange, #FF9900)'),
              resolveToken('colors.accent.primary', 'var(--lcars-orange, #FF9900)'),
              'transparent'
            ]
          },
          fill: {
            type: 'solid',
            opacity: 0.2
          },
          markers: {
            size: 0
          },
          legend: {
            show: true,
            position: style.legend?.position ?? 'top',
            fontSize: resolveToken('typography.fontSize.sm', '12px'),
            fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif'),
            labels: {
              colors: resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)')
            }
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
            borderColor: resolveToken('colors.ui.border', 'var(--lcars-gray, #999999)'),
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
              colors: resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)')
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
              datetimeUTC: false,
              style: {
                colors: resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)'),
                fontSize: resolveToken('typography.fontSize.xs', '10px'),
                fontFamily: resolveToken('typography.fontFamily.primary', 'Antonio, Helvetica Neue, sans-serif')
              }
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
            colors: [resolveToken('colors.ui.foreground', 'var(--lcars-white, #FFFFFF)')]
          }
        };

      default:
        return {};
    }
  }

  /**
   * Resolve CSS variable to computed value
   *
   * ApexCharts is a CANVAS library and doesn't understand CSS variables.
   * We must resolve them to actual hex/rgb values before passing to ApexCharts.
   *
   * This is adapter-specific logic that remains necessary because CSS variables
   * work in HTML/CSS contexts but not in canvas rendering.
   *
   * @private
   * @param {string|Array} colorValue - Color value or array of color values
   * @returns {string|Array} Resolved color value(s)
   */
  static _resolveCssVariable(colorValue) {
    // Handle arrays recursively
    if (Array.isArray(colorValue)) {
      return colorValue.map(c => this._resolveCssVariable(c));
    }

    // Non-string or falsy values pass through
    if (!colorValue || typeof colorValue !== 'string') {
      return colorValue;
    }

    // Check if it's a CSS variable
    if (colorValue.startsWith('var(')) {
      try {
        // Extract variable name from var(--variable-name, fallback)
        const match = colorValue.match(/var\((--[^,)]+)(?:,\s*([^)]+))?\)/);
        if (!match) return colorValue;

        const varName = match[1];
        const fallback = match[2] ? match[2].trim() : null;

        // Get computed style from document root
        const root = document.documentElement;
        const computed = getComputedStyle(root).getPropertyValue(varName).trim();

        if (computed) {
          lcardsLog.trace(`[ApexChartsAdapter] ✅ Resolved CSS variable: ${colorValue} → ${computed}`);
          return computed;
        }

        // No computed value, try fallback
        if (fallback) {
          // Fallback might also be a CSS variable, recurse
          if (fallback.startsWith('var(')) {
            return this._resolveCssVariable(fallback);
          }
          lcardsLog.trace(`[ApexChartsAdapter] ⚠️ Using fallback: ${colorValue} → ${fallback}`);
          return fallback;
        }

        lcardsLog.warn(`[ApexChartsAdapter] ❌ Failed to resolve CSS variable: ${colorValue} (no computed value or fallback)`);
        return colorValue;  // Return original if can't resolve

      } catch (error) {
        lcardsLog.error(`[ApexChartsAdapter] ❌ Error resolving CSS variable: ${colorValue}`, error);
        return colorValue;
      }
    }

    // Not a CSS variable, return as-is
    return colorValue;
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

    // Handle strings - resolve if CSS variable
    if (typeof obj === 'string') {
      const original = obj;
      const resolved = this._resolveCssVariable(obj);
      if (original !== resolved) {
        lcardsLog.debug(`[ApexChartsAdapter] 🎨 Resolved CSS variable: ${original} → ${resolved}`);
      }
      return resolved;
    }

    // All other types pass through unchanged
    return obj;
  }

  /**
   * Resolve DataSource path with dot notation support
   * @private
   */
  static _resolveDataSourcePath(sourceRef, dataSourceManager) {
    if (!sourceRef || typeof sourceRef !== 'string') {
      return { dataSource: null, dataPath: null };
    }

    // Check for dot notation (e.g., "temp.transformations.celsius")
    if (sourceRef.includes('.')) {
      const parts = sourceRef.split('.');
      const sourceId = parts[0];
      const dataPath = parts.slice(1).join('.');

      const dataSource = dataSourceManager.getSource(sourceId);
      return { dataSource, dataPath };
    }

    // Simple source reference
    const dataSource = dataSourceManager.getSource(sourceRef);
    return { dataSource, dataPath: null };
  }

/**
 * Get raw DataSource buffer data with strict validation
 * @private
 */
static _getRawData(dataSource, config) {
  const currentData = dataSource.getCurrentData();
  if (!currentData?.buffer) return [];

  const bufferData = currentData.buffer.getAll();
  if (!Array.isArray(bufferData) || bufferData.length === 0) return [];

  // Apply time window filter if specified
  let filteredData = bufferData;
  if (config.time_window) {
    const timeWindowMs = this._parseTimeWindow(config.time_window);
    const cutoffTime = Date.now() - timeWindowMs;
    filteredData = bufferData.filter(point => {
      const timestamp = point?.t;
      return timestamp && timestamp >= cutoffTime;
    });
  }

  // Apply max points limit if specified (data decimation)
  if (config.max_points && filteredData.length > config.max_points) {
    const step = Math.floor(filteredData.length / config.max_points);
    const decimated = [];
    for (let i = 0; i < filteredData.length; i += step) {
      decimated.push(filteredData[i]);
    }
    // Always include last point
    if (decimated[decimated.length - 1] !== filteredData[filteredData.length - 1]) {
      decimated.push(filteredData[filteredData.length - 1]);
    }
    filteredData = decimated;
  }

  // ✅ CRITICAL: Filter out invalid points BEFORE conversion
  return filteredData
    .filter(point => {
      if (!point) return false;
      const t = point.t;
      const v = point.v;
      return (
        t !== undefined &&
        t !== null &&
        !isNaN(Number(t)) &&
        v !== undefined &&
        v !== null &&
        !isNaN(Number(v)) &&
        isFinite(v)
      );
    })
    .map(point => ({
      timestamp: point.t,
      value: point.v
    }));
}

  /**
   * Get enhanced DataSource data (transformation/aggregation)
   * @private
   */
  static _getEnhancedData(dataSource, dataPath, config) {
    // For transformations, get transformed history buffer
    if (dataPath.startsWith('transformations.')) {
      const transformKey = dataPath.replace('transformations.', '');

      try {
        const history = dataSource.getTransformedHistory(transformKey, config.max_points || 500);

        if (!history || history.length === 0) {
          lcardsLog.warn(`[ApexChartsAdapter] No transformed history for ${dataPath}`);
          return [];
        }

        // Apply time window filter if specified
        let filteredHistory = history;
        if (config.time_window) {
          const timeWindowMs = this._parseTimeWindow(config.time_window);
          const cutoffTime = Date.now() - timeWindowMs;
          filteredHistory = history.filter(point => {
            const ts = point.timestamp || point.t;
            return ts >= cutoffTime;
          });
        }

        return filteredHistory.map(point => ({
          timestamp: point.timestamp || point.t,
          value: point.value || point.v
        }));
      } catch (error) {
        lcardsLog.error(`[ApexChartsAdapter] Error getting transformed history:`, error);
        return [];
      }
    }

    // For aggregations, create synthetic time series from current values
    if (dataPath.startsWith('aggregations.')) {
      const currentData = dataSource.getCurrentData();
      const aggParts = dataPath.replace('aggregations.', '').split('.');

      let value = currentData.aggregations;
      for (const part of aggParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = null;
          break;
        }
      }

      if (value === null || value === undefined) {
        return [];
      }

      // ✅ NEW: Handle array values from rolling_statistics aggregations
      // rolling_statistics can output arrays like [min, max] or [open, high, low, close]
      if (Array.isArray(value)) {
        return [{
          timestamp: Date.now(),
          value: value  // Keep as array for multi-value charts
        }];
      }

      // ✅ EXISTING: Handle single numeric values
      return [{
        timestamp: Date.now(),
        value: typeof value === 'number' ? value : 0
      }];
    }

    return [];
  }

  /**
   * Map MSD smoothing mode to ApexCharts curve type
   * @private
   * @param {string} smoothingMode - MSD smoothing mode
   * @returns {string} ApexCharts curve type
   */
  static _mapSmoothingMode(smoothingMode) {
    const mapping = {
      'none': 'straight',
      'linear': 'straight',
      'constrained': 'smooth',
      'bezier': 'smooth',
      'spline': 'smooth',
      'chaikin': 'smooth',
      'stepped': 'stepline'
    };

    return mapping[smoothingMode] || 'straight';
  }

  /**
   * Map MSD gradient config to ApexCharts gradient format
   * @private
   * @param {Object} gradient - MSD gradient configuration
   * @returns {Object} ApexCharts gradient object
   */
  static _mapGradient(gradient) {
    if (!gradient) return undefined;

    return {
      shade: 'dark',
      type: gradient.type === 'radial' ? 'vertical' : 'vertical',
      shadeIntensity: 0.5,
      gradientToColors: gradient.stops ?
        gradient.stops.map(stop => stop.color) :
        undefined,
      inverseColors: false,
      opacityFrom: gradient.stops?.[0]?.opacity || 0.8,
      opacityTo: gradient.stops?.[gradient.stops.length - 1]?.opacity || 0.1,
      stops: gradient.stops ?
        gradient.stops.map(stop => parseInt(stop.offset)) :
        [0, 100]
    };
  }

  /**
   * Build annotations (threshold lines) from style config
   * @private
   * @param {Object} style - MSD style configuration
   * @returns {Object} ApexCharts annotations object
   */
  static _buildAnnotations(style) {
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
            color: '#fff',
            background: style.zero_line_color || 'var(--lcars-gray, var(--lcards-gray-medium, #666688))'
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
              color: '#fff',
              background: threshold.color || 'var(--lcars-red, var(--lcards-orange-dark, #dd4444))',
              fontSize: '10px',
              fontFamily: 'var(--lcars-font-family, Antonio)'
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
   * Parse time window string to milliseconds
   * @private
   * @param {string|number} timeWindow - Time window specification (e.g., "12h", "24h", "30m")
   * @returns {number} Time window in milliseconds
   */
  static _parseTimeWindow(timeWindow) {
    if (typeof timeWindow === 'number') return timeWindow;
    if (!timeWindow || typeof timeWindow !== 'string') return 0;

    const match = timeWindow.match(/^(\d+(?:\.\d+)?)\s*([smhd])$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[match[2].toLowerCase()] || 0);
  }

  /**
   * Format value for display
   * @private
   * @param {number} value - Numeric value
   * @param {string|Function} format - Format specification
   * @returns {string} Formatted value
   */
  static _formatValue(value, format) {
    if (typeof format === 'function') {
      return format(value);
    }

    if (typeof format === 'string') {
      // Simple template replacement
      return format.replace('{value}', value.toFixed(1));
    }

    return value.toFixed(1);
  }

  /**
   * Create label formatter from template string
   * @private
   * @param {string} format - Format template (e.g., "MMM DD", "{value}°C")
   * @param {string} axis - Axis type ('xaxis' or 'yaxis')
   * @returns {Function} ApexCharts formatter function
   */
  static _createLabelFormatter(format, axis) {
    // Check if it's a date format (no braces) or value template
    if (!format.includes('{')) {
      // Assume date format for x-axis
      return function(val) {
        if (axis === 'xaxis' && typeof val === 'number') {
          return ApexChartsAdapter._formatDate(val, format);
        }
        return val;
      };
    }

    // Value template (e.g., "{value}°C")
    return function(val) {
      const formatted = typeof val === 'number' ? val.toFixed(1) : val;
      return format.replace('{value}', formatted);
    };
  }

  /**
   * Create tooltip formatter from template string
   *
   * ✅ FIX: Returns complete custom tooltip HTML structure to prevent ApexCharts
   * from re-processing formatted content. ApexCharts' internal formatter can
   * misinterpret characters in formatted dates (e.g., "Jan" → "Jamn" when it
   * treats the second 'M' as a minute format token).
   *
   * By returning the outer <div class="apexcharts-tooltip"> wrapper, we signal
   * to ApexCharts that this is a fully custom tooltip and content should not
   * be re-formatted.
   *
   * @private
   * @param {string} format - Format template (e.g., "{x|MMM DD}: {y}°C")
   * @returns {Function} ApexCharts tooltip formatter
   */
  static _createTooltipFormatter(format) {
    return function({ series, seriesIndex, dataPointIndex, w }) {
      const x = w.globals.seriesX[seriesIndex][dataPointIndex];
      const y = series[seriesIndex][dataPointIndex];

      let output = format;

      // Handle {x|format} syntax for date formatting
      const xMatch = output. match(/\{x\|([^}]+)\}/);
      if (xMatch) {
        const dateFormat = xMatch[1];
        const formattedX = ApexChartsAdapter._formatDate(x, dateFormat);
        output = output.replace(xMatch[0], formattedX);
      } else if (output.includes('{x}')) {
        const formattedX = typeof x === 'number' ? ApexChartsAdapter._formatDate(x, 'MMM DD HH: mm') : x;
        output = output.replace('{x}', formattedX);
      }

      // Handle {y} syntax for value
      if (output.includes('{y}')) {
        const formattedY = typeof y === 'number' ? y.toFixed(1) : y;
        output = output.replace('{y}', formattedY);
      }

      // ✅ FIX: Return complete custom tooltip structure WITHOUT hardcoded styles
      // The outer wrapper signals to ApexCharts: "Don't re-format this content"
      // ApexCharts will apply its own tooltip styling from the configured options
      return `
        <div class="apexcharts-tooltip">
          <div class="apexcharts-tooltip-text">
            ${output}
          </div>
        </div>
      `;
    };
  }

  /**
   * Format date using simple format string
   * @private
   * @param {number|Date} timestamp - Timestamp or Date object
   * @param {string} format - Format string (e.g., "MMM DD", "HH:mm", "YYYY-MM-DD HH:mm")
   * @returns {string} Formatted date string
   */
  static _formatDate(timestamp, format) {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;

    if (!date || isNaN(date.getTime())) {
      return String(timestamp);
    }

    // Simple format string replacement (common patterns)
    let formatted = format;

    // Year
    formatted = formatted.replace('YYYY', date.getFullYear());
    formatted = formatted.replace('YY', String(date.getFullYear()).slice(-2));

    // Month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    formatted = formatted.replace('MMMM', monthsFull[date.getMonth()]);
    formatted = formatted.replace('MMM', months[date.getMonth()]);
    formatted = formatted.replace('MM', String(date.getMonth() + 1).padStart(2, '0'));
    formatted = formatted.replace('M', String(date.getMonth() + 1));

    // Day
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    formatted = formatted.replace('dddd', daysFull[date.getDay()]);
    formatted = formatted.replace('ddd', days[date.getDay()]);
    formatted = formatted.replace('DD', String(date.getDate()).padStart(2, '0'));
    formatted = formatted.replace('D', String(date.getDate()));

    // Hours
    formatted = formatted.replace('HH', String(date.getHours()).padStart(2, '0'));
    formatted = formatted.replace('H', String(date.getHours()));
    const hours12 = date.getHours() % 12 || 12;
    formatted = formatted.replace('hh', String(hours12).padStart(2, '0'));
    formatted = formatted.replace('h', String(hours12));

    // Minutes
    formatted = formatted.replace('mm', String(date.getMinutes()).padStart(2, '0'));
    formatted = formatted.replace('m', String(date.getMinutes()));

    // Seconds
    formatted = formatted.replace('ss', String(date.getSeconds()).padStart(2, '0'));
    formatted = formatted.replace('s', String(date.getSeconds()));

    // AM/PM
    formatted = formatted.replace('A', date.getHours() >= 12 ? 'PM' : 'AM');
    formatted = formatted.replace('a', date.getHours() >= 12 ? 'pm' : 'am');

    return formatted;
  }

  /**
   * Extract series name from source reference
   * @private
   * @param {string} sourceRef - DataSource reference
   * @returns {string} Human-readable series name
   */
  static _extractSeriesName(sourceRef) {
    if (!sourceRef) return 'Series';

    // For dot notation, use the last part as name
    if (sourceRef.includes('.')) {
      const parts = sourceRef.split('.');
      return parts[parts.length - 1]
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    return sourceRef
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}