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
 * - 220px × 504px viewport (matches legacy)
 * 
 * @module picard-vertical
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
