/**
 * Picard Vertical Component
 * 
 * Vertical gauge with Picard-style elbow cutouts, inset range borders,
 * and animation zone placeholder.
 * 
 * Features:
 * - Complex SVG shape with NE/SE/SW elbow cutouts
 * - Inset range backgrounds with configurable black borders
 * - Animation zone (top-left) with placeholder circles
 * - State-dependent top/bottom border caps
 * - Render function architecture for dynamic sizing and state-dependent colors
 * - Reference dimensions: 220px × 504px
 * 
 * @module picard-vertical
 */

import { resolveStateColor } from '../../../../utils/state-color-resolver.js';

/**
 * Render function: Generate SVG shell with state-dependent colors at container dimensions
 * @param {Object} params - Render parameters
 * @param {number} params.width - Container width in pixels
 * @param {number} params.height - Container height in pixels
 * @param {Object} params.colors - Resolved state-dependent colors
 * @param {string} params.colors.borderTop - Top border color
 * @param {string} params.colors.borderBottom - Bottom border color
 * @returns {string} Complete SVG markup
 */
function render({ width, height, colors }) {
  // Calculate scale factors from reference dimensions
  const scaleX = width / 220;
  const scaleY = height / 504;

  // Scale all coordinates proportionally
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Clipping path for main content area (excludes elbows) -->
    <clipPath id="picard-clip">
      <path d="M 0 0 
               L ${110 * scaleX} 0 
               L ${110 * scaleX} ${31 * scaleY}
               L ${220 * scaleX} ${31 * scaleY}
               L ${220 * scaleX} ${454 * scaleY}
               L ${110 * scaleX} ${454 * scaleY}
               L ${110 * scaleX} ${484 * scaleY}
               L ${91 * scaleX} ${484 * scaleY}
               L ${91 * scaleX} ${504 * scaleY}
               L 0 ${504 * scaleY}
               Z" />
    </clipPath>
  </defs>

  <!-- Background (black, clipped to shape) -->
  <rect width="${width}" height="${height}" fill="black" clip-path="url(#picard-clip)" />

  <!-- ================================================================ -->
  <!-- BORDER ZONE: Top/Bottom Caps (State-Dependent Color) -->
  <!-- ================================================================ -->
  <g id="border-zone" data-zone="border" data-bounds="0,0,${width},${height}">
    <!-- Top cap (40px scaled) -->
    <rect id="border-top" x="0" y="0" width="${width}" height="${40 * scaleY}" 
          fill="${colors.borderTop}" />
    
    <!-- Bottom cap (50px scaled) -->
    <rect id="border-bottom" x="0" y="${454 * scaleY}" width="${width}" height="${50 * scaleY}" 
          fill="${colors.borderBottom}" />
  </g>

  <!-- ================================================================ -->
  <!-- ANIMATION ZONE: Geo-Array Placeholder (Top-Left) -->
  <!-- ================================================================ -->
  <g id="animation-zone" data-zone="animation" 
     data-bounds="0,0,${110 * scaleX},${31 * scaleY}" transform="translate(0, 0)">
    <!-- Placeholder: 3 circles (full animation in future phase) -->
    <circle cx="${10 * scaleX}" cy="${15.5 * scaleY}" r="${6 * Math.min(scaleX, scaleY)}" fill="var(--picard-blue)" opacity="0.5" />
    <circle cx="${30 * scaleX}" cy="${15.5 * scaleY}" r="${6 * Math.min(scaleX, scaleY)}" fill="var(--picard-blue)" opacity="0.5" />
    <circle cx="${50 * scaleX}" cy="${15.5 * scaleY}" r="${6 * Math.min(scaleX, scaleY)}" fill="var(--picard-blue)" opacity="0.5" />
  </g>

  <!-- ================================================================ -->
  <!-- RANGE ZONE: Inset Range Backgrounds (Left Side) -->
  <!-- ================================================================ -->
  <g id="range-zone" data-zone="range" 
     data-bounds="${5 * scaleX},${45 * scaleY},${19 * scaleX},${404 * scaleY}" 
     transform="translate(${5 * scaleX}, ${45 * scaleY})">
    <!-- Gray background bar (full height) -->
    <rect x="0" y="0" width="${19 * scaleX}" height="${404 * scaleY}" 
          fill="var(--lcars-alert-blue)" />
    
    <!-- Dynamically injected range rects with inset borders go here -->
    <!-- Injected by _injectRanges() method -->
  </g>

  <!-- ================================================================ -->
  <!-- TRACK ZONE: Pills/Gauge Ruler (Right Side) -->
  <!-- ================================================================ -->
  <g id="track-zone" data-zone="track" 
     data-bounds="${29 * scaleX},${45 * scaleY},${88 * scaleX},${404 * scaleY}" 
     transform="translate(${29 * scaleX}, ${45 * scaleY})">
    <!-- Dynamically injected gauge ticks/labels or pills go here -->
    <!-- Injected by _injectContentIntoZones() method -->
  </g>

  <!-- ================================================================ -->
  <!-- TEXT ZONE: Labels (Overlay) -->
  <!-- ================================================================ -->
  <g id="text-zone" data-zone="text" 
     data-bounds="${40 * scaleX},${50 * scaleY},${170 * scaleX},${404 * scaleY}" 
     transform="translate(${40 * scaleX}, ${50 * scaleY})">
    <!-- Dynamically injected text fields go here -->
    <!-- Injected by _injectTextFields() method -->
  </g>

  <!-- ================================================================ -->
  <!-- CONTROL ZONE: Slider Input Overlay (Left Side) -->
  <!-- ================================================================ -->
  <rect id="control-zone" data-zone="control" 
        x="${5 * scaleX}" y="${45 * scaleY}" 
        width="${24 * scaleX}" height="${404 * scaleY}" 
        fill="none" pointer-events="all" 
        data-bounds="${5 * scaleX},${45 * scaleY},${24 * scaleX},${404 * scaleY}" />

  <!-- ================================================================ -->
  <!-- ELBOW MASKS (Black Overlays for Shape) -->
  <!-- ================================================================ -->
  <g id="elbow-masks">
    <!-- NE Elbow (top-right) -->
    <rect x="${110 * scaleX}" y="0" width="${110 * scaleX}" height="${31 * scaleY}" fill="black" />
    
    <!-- SE Elbow (bottom-right) -->
    <rect x="${110 * scaleX}" y="${454 * scaleY}" width="${110 * scaleX}" height="${50 * scaleY}" fill="black" />
    
    <!-- SW Elbow (bottom-left) -->
    <rect x="0" y="${484 * scaleY}" width="${91 * scaleX}" height="${20 * scaleY}" fill="black" />
  </g>
</svg>`;
}

/**
 * Calculate zone bounds at container dimensions
 * Returns zone bounds in container coordinate space (scaled from reference)
 * @param {number} width - Container width in pixels
 * @param {number} height - Container height in pixels
 * @returns {Object} Zone bounds keyed by zone name
 */
function calculateZones(width, height) {
  const scaleX = width / 220;
  const scaleY = height / 504;

  return {
    border: {
      x: 0,
      y: 0,
      width: width,
      height: height
    },
    animation: {
      x: 0,
      y: 0,
      width: 110 * scaleX,
      height: 31 * scaleY
    },
    range: {
      x: 5 * scaleX,
      y: 45 * scaleY,
      width: 19 * scaleX,
      height: 404 * scaleY
    },
    track: {
      x: 29 * scaleX,
      y: 45 * scaleY,
      width: 88 * scaleX,
      height: 404 * scaleY
    },
    text: {
      x: 40 * scaleX,
      y: 50 * scaleY,
      width: 170 * scaleX,
      height: 404 * scaleY
    },
    control: {
      x: 5 * scaleX,
      y: 45 * scaleY,
      width: 24 * scaleX,
      height: 404 * scaleY
    }
  };
}

/**
 * Resolve state-dependent border colors
 * @param {string|null} actualState - Entity state (e.g., 'on', 'off')
 * @param {string} classifiedState - Classified state ('active', 'inactive', 'unavailable')
 * @param {Object} config - Card configuration
 * @returns {Object} Resolved colors { borderTop, borderBottom }
 */
function resolveColors(actualState, classifiedState, config) {
  // Get border color configuration from style or use defaults
  const borderColorConfig = config?.style?.border?.color || {
    active: 'var(--lcars-orange-medium)',
    inactive: 'var(--lcars-blue-medium)',
    unavailable: 'var(--lcars-gray-dark)',
    default: 'var(--lcars-orange-medium)'
  };

  // Resolve using state color resolver
  const borderColor = resolveStateColor({
    actualState,
    classifiedState,
    colorConfig: borderColorConfig,
    fallback: 'var(--lcars-orange-medium)'
  });

  return {
    borderTop: borderColor,
    borderBottom: borderColor
  };
}

/**
 * Legacy static SVG for backward compatibility
 * Used when card doesn't support render functions
 */
const picardVerticalSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 504">
  <defs>
    <!-- Clipping path for main content area (excludes elbows) -->
    <clipPath id="picard-clip">
      <path d="M 0 0 
               L 110 0 
               L 110 31 
               L 220 31 
               L 220 454 
               L 110 454 
               L 110 484 
               L 91 484 
               L 91 504 
               L 0 504 
               Z" />
    </clipPath>
  </defs>

  <!-- Background (black, clipped to shape) -->
  <rect width="220" height="504" fill="black" clip-path="url(#picard-clip)" />

  <!-- ================================================================ -->
  <!-- BORDER ZONE: Top/Bottom Caps (State-Dependent Color) -->
  <!-- ================================================================ -->
  <g id="border-zone" data-zone="border" data-bounds="0,0,220,504">
    <!-- Top cap (40px) -->
    <rect id="border-top" x="0" y="0" width="220" height="40" 
          fill="{{BORDER_COLOR}}" />
    
    <!-- Bottom cap (50px) -->
    <rect id="border-bottom" x="0" y="454" width="220" height="50" 
          fill="{{BORDER_COLOR}}" />
  </g>

  <!-- ================================================================ -->
  <!-- ANIMATION ZONE: Geo-Array Placeholder (Top-Left) -->
  <!-- ================================================================ -->
  <g id="animation-zone" data-zone="animation" 
     data-bounds="0,0,110,31" transform="translate(0, 0)">
    <!-- Placeholder: 3 circles (full animation in future phase) -->
    <circle cx="10" cy="15.5" r="6" fill="var(--picard-blue)" opacity="0.5" />
    <circle cx="30" cy="15.5" r="6" fill="var(--picard-blue)" opacity="0.5" />
    <circle cx="50" cy="15.5" r="6" fill="var(--picard-blue)" opacity="0.5" />
  </g>

  <!-- ================================================================ -->
  <!-- RANGE ZONE: Inset Range Backgrounds (Left Side) -->
  <!-- ================================================================ -->
  <g id="range-zone" data-zone="range" 
     data-bounds="5,45,19,404" transform="translate(5, 45)">
    <!-- Gray background bar (full height) -->
    <rect x="0" y="0" width="19" height="404" 
          fill="var(--lcars-alert-blue)" />
    
    <!-- Dynamically injected range rects with inset borders go here -->
    <!-- Injected by _injectRanges() method -->
  </g>

  <!-- ================================================================ -->
  <!-- TRACK ZONE: Pills/Gauge Ruler (Right Side) -->
  <!-- ================================================================ -->
  <g id="track-zone" data-zone="track" 
     data-bounds="29,45,88,404" transform="translate(29, 45)">
    <!-- Dynamically injected gauge ticks/labels or pills go here -->
    <!-- Injected by _injectContentIntoZones() method -->
  </g>

  <!-- ================================================================ -->
  <!-- TEXT ZONE: Labels (Overlay) -->
  <!-- ================================================================ -->
  <g id="text-zone" data-zone="text" 
     data-bounds="40,50,170,404" transform="translate(40, 50)">
    <!-- Dynamically injected text fields go here -->
    <!-- Injected by _injectTextFields() method -->
  </g>

  <!-- ================================================================ -->
  <!-- CONTROL ZONE: Slider Input Overlay (Left Side) -->
  <!-- ================================================================ -->
  <rect id="control-zone" data-zone="control" 
        x="5" y="45" width="24" height="404" 
        fill="none" pointer-events="all" 
        data-bounds="5,45,24,404" />

  <!-- ================================================================ -->
  <!-- ELBOW MASKS (Black Overlays for Shape) -->
  <!-- ================================================================ -->
  <g id="elbow-masks">
    <!-- NE Elbow (top-right) -->
    <rect x="110" y="0" width="110" height="31" fill="black" />
    
    <!-- SE Elbow (bottom-right) -->
    <rect x="110" y="454" width="110" height="50" fill="black" />
    
    <!-- SW Elbow (bottom-left) -->
    <rect x="0" y="484" width="91" height="20" fill="black" />
  </g>
</svg>`;

export const picardVertical = {
  id: 'picard-vertical',
  name: 'Picard Vertical Gauge',
  description: 'Vertical gauge with Picard-style elbows, inset ranges, and animation zone',
  orientation: 'vertical',
  features: ['ranges', 'animation', 'complex-borders', 'inset-ranges'],
  
  // NEW: Render function architecture
  render,
  calculateZones,
  resolveColors,
  
  // Legacy static SVG (backward compatibility)
  svg: picardVerticalSVG,
  
  metadata: {
    dimensions: {
      width: 220,
      height: 504,
      viewBox: '0 0 220 504'
    },
    zones: {
      border: {
        bounds: [0, 0, 220, 504],
        description: 'Top/bottom caps with state-dependent color'
      },
      animation: {
        bounds: [0, 0, 110, 31],
        type: 'geo-array',
        description: 'Animated geometric array (top-left corner)'
      },
      range: {
        bounds: [5, 45, 19, 404],
        inset: true,
        description: 'Inset range backgrounds with black borders (left side)'
      },
      track: {
        bounds: [29, 45, 88, 404],
        description: 'Gauge ruler or pills (right side)'
      },
      text: {
        bounds: [40, 50, 170, 404],
        description: 'Text overlay zone (centered)'
      },
      control: {
        bounds: [5, 45, 24, 404],
        description: 'Slider input control area (left overlay)'
      }
    },
    defaultRanges: [
      { min: 0, max: 100, color: 'var(--picard-medium-light-gray)' }
    ],
    insetBorder: {
      size: 4,
      color: 'black',
      gap: 5
    },
    elbowCutouts: [
      { id: 'ne', x: 110, y: 0, width: 110, height: 31, description: 'Top-right corner' },
      { id: 'se', x: 110, y: 454, width: 110, height: 50, description: 'Bottom-right corner' },
      { id: 'sw', x: 0, y: 484, width: 91, height: 20, description: 'Bottom-left corner' }
    ]
  }
};
