/**
 * Elbow Component Registry
 *
 * Provides SVG path generators for all elbow types.
 * Each component receives user config and dynamically generates geometry.
 *
 * This registry follows the same pattern as slider and dpad components,
 * enabling extensibility through the component registry pattern.
 *
 * @module core/packs/components/elbows
 */

/**
 * Elbow component registry
 * Maps elbow type names to their path generators and metadata
 *
 * Each component defines:
 * - orientation: Position of the elbow (header-left, header-right, etc.)
 * - features: Array of supported features
 * - pathGenerator: Function that generates SVG path from config
 * - metadata: Component information (name, description, version)
 *
 * @type {Object.<string, {orientation: string, features: string[], pathGenerator: Function, metadata: Object}>}
 */
export const elbowComponents = {
    'header-left': {
        orientation: 'header-left',
        features: ['simple', 'segmented'],

        /**
         * Generate header-left elbow path
         * Elbow in top-left corner: vertical bar on left, horizontal bar on top
         *
         * Shape description (drawing clockwise from top-left):
         * - Start at top edge where outer arc ends
         * - Right along top edge
         * - Down to horizontal bar bottom
         * - Left to inner arc start
         * - Inner arc (concave) to vertical bar
         * - Down vertical bar
         * - Left along bottom
         * - Up vertical bar left edge
         * - Outer arc (convex) back to start
         *
         * Arc geometry:
         * - Outer arc center: (outerRadius, outerRadius)
         * - Inner arc center: (horizontal, vertical)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry (position, side, horizontal, vertical, outerRadius, innerRadius)
         * @param {Object} config.container - Container dimensions (width, height)
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { position, side, horizontal, vertical, outerRadius, innerRadius } = config.geometry;
            const { width, height } = config.container;

            // For seamless joins, arcs must be tangent to straight edges
            // Outer arc: connects left edge (x=0) to top edge (y=0)
            //   Start: (0, outerRadius) - tangent is horizontal (pointing right)
            //   End: (outerRadius, 0) - tangent is vertical (pointing down)
            //   Center: (outerRadius, outerRadius)
            //
            // Inner arc: connects horizontal bar to vertical bar
            //   Start: (horizontal + innerRadius, vertical) - tangent is horizontal (pointing left)
            //   End: (horizontal, vertical + innerRadius) - tangent is vertical (pointing up)
            //   Center: (horizontal, vertical)

            const path = [
                // Start at where outer arc meets top edge (tangent is vertical)
                `M ${outerRadius} 0`,
                // Line along top edge to the right
                `L ${width} 0`,
                // Line down to bottom of horizontal bar
                `L ${width} ${vertical}`,
                // Line left along bottom of horizontal bar to inner arc start (tangent is horizontal)
                `L ${horizontal + innerRadius} ${vertical}`,
                // Inner arc: curves inward (concave)
                // From (horizontal + innerRadius, vertical) to (horizontal, vertical + innerRadius)
                // Goes counter-clockwise (sweep-flag = 0) to curve inward
                `A ${innerRadius} ${innerRadius} 0 0 0 ${horizontal} ${vertical + innerRadius}`,
                // Line down right edge of vertical bar
                `L ${horizontal} ${height}`,
                // Line left along bottom
                `L 0 ${height}`,
                // Line up left edge of vertical bar to outer arc start (tangent is horizontal)
                `L 0 ${outerRadius}`,
                // Outer arc: curves outward (convex)
                // From (0, outerRadius) to (outerRadius, 0)
                // Goes clockwise (sweep-flag = 1) to curve outward
                `A ${outerRadius} ${outerRadius} 0 0 1 ${outerRadius} 0`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Header Left Elbow',
            description: 'Top-left corner elbow (vertical bar on left, horizontal bar on top)',
            version: '1.0.0'
        }
    },

    'header-right': {
        orientation: 'header-right',
        features: ['simple', 'segmented'],

        /**
         * Generate header-right elbow path
         * Elbow in top-right corner: vertical bar on right, horizontal bar on top
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { position, side, horizontal, vertical, outerRadius, innerRadius } = config.geometry;
            const { width, height } = config.container;

            // Mirror of header-left
            // Vertical bar on right side: x = (width - horizontal) to x = width
            // Horizontal bar: x = 0 to x = (width - horizontal)

            const vBarLeft = width - horizontal; // Left edge of vertical bar

            const path = [
                // Start at top-right corner (with outer arc radius offset)
                `M ${width - outerRadius} 0`,
                // Outer arc: curves from top to right edge
                `A ${outerRadius} ${outerRadius} 0 0 1 ${width} ${outerRadius}`,
                // Line down right edge to bottom
                `L ${width} ${height}`,
                // Line left along bottom of vertical bar
                `L ${vBarLeft} ${height}`,
                // Line up right edge of content area (left edge of vertical bar)
                `L ${vBarLeft} ${vertical + innerRadius}`,
                // Inner arc: curves inward from vertical bar to horizontal bar
                // Goes counter-clockwise (sweep-flag = 0) to curve inward
                `A ${innerRadius} ${innerRadius} 0 0 0 ${vBarLeft - innerRadius} ${vertical}`,
                // Line left along bottom of horizontal bar
                `L 0 ${vertical}`,
                // Line up left edge
                `L 0 0`,
                // Line right along top to arc start
                `L ${width - outerRadius} 0`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Header Right Elbow',
            description: 'Top-right corner elbow (vertical bar on right, horizontal bar on top)',
            version: '1.0.0'
        }
    },

    'footer-left': {
        orientation: 'footer-left',
        features: ['simple', 'segmented'],

        /**
         * Generate footer-left elbow path
         * Elbow in bottom-left corner: vertical bar on left, horizontal bar on bottom
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { position, side, horizontal, vertical, outerRadius, innerRadius } = config.geometry;
            const { width, height } = config.container;

            // Vertical bar on left: x = 0 to x = horizontal
            // Horizontal bar on bottom: y = (height - vertical) to y = height

            const hBarTop = height - vertical; // Top edge of horizontal bar

            const path = [
                // Start at bottom-left corner (with outer arc radius offset)
                `M 0 ${height - outerRadius}`,
                // Outer arc: curves from left edge to bottom
                `A ${outerRadius} ${outerRadius} 0 0 0 ${outerRadius} ${height}`,
                // Line right along bottom edge
                `L ${width} ${height}`,
                // Line up right edge of horizontal bar
                `L ${width} ${hBarTop}`,
                // Line left along top of horizontal bar to inner arc start
                `L ${horizontal + innerRadius} ${hBarTop}`,
                // Inner arc: curves inward from horizontal bar to vertical bar
                // Goes clockwise (sweep-flag = 1) to curve inward
                `A ${innerRadius} ${innerRadius} 0 0 1 ${horizontal} ${hBarTop - innerRadius}`,
                // Line up left edge of vertical bar
                `L ${horizontal} 0`,
                // Line left along top
                `L 0 0`,
                // Line down left edge to arc start
                `L 0 ${height - outerRadius}`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Footer Left Elbow',
            description: 'Bottom-left corner elbow (vertical bar on left, horizontal bar on bottom)',
            version: '1.0.0'
        }
    },

    'footer-right': {
        orientation: 'footer-right',
        features: ['simple', 'segmented'],

        /**
         * Generate footer-right elbow path
         * Elbow in bottom-right corner: vertical bar on right, horizontal bar on bottom
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { position, side, horizontal, vertical, outerRadius, innerRadius } = config.geometry;
            const { width, height } = config.container;

            // Mirror of footer-left
            // Vertical bar on right: x = (width - horizontal) to x = width
            // Horizontal bar on bottom: y = (height - vertical) to y = height

            const vBarLeft = width - horizontal;
            const hBarTop = height - vertical;

            const path = [
                // Start at bottom-right corner (with outer arc radius offset)
                `M ${width} ${height - outerRadius}`,
                // Line up right edge
                `L ${width} 0`,
                // Line left along top
                `L ${vBarLeft} 0`,
                // Line down left edge of vertical bar to inner arc start
                `L ${vBarLeft} ${hBarTop - innerRadius}`,
                // Inner arc: curves inward from vertical bar to horizontal bar
                // Goes clockwise (sweep-flag = 1) to curve inward
                `A ${innerRadius} ${innerRadius} 0 0 1 ${vBarLeft - innerRadius} ${hBarTop}`,
                // Line left along top of horizontal bar
                `L 0 ${hBarTop}`,
                // Line down left edge
                `L 0 ${height}`,
                // Line right along bottom to arc start
                `L ${width - outerRadius} ${height}`,
                // Outer arc: curves from bottom to right edge
                `A ${outerRadius} ${outerRadius} 0 0 0 ${width} ${height - outerRadius}`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Footer Right Elbow',
            description: 'Bottom-right corner elbow (vertical bar on right, horizontal bar on bottom)',
            version: '1.0.0'
        }
    },

    // ============================================================================
    // CONTAINED VARIANTS - Mirrored elbows on both ends
    // ============================================================================

    'header-contained': {
        orientation: 'header-contained',
        features: ['simple', 'segmented'],

        /**
         * Generate header-contained elbow path
         * Horizontal bar with mirrored elbows on both left and right ends (top)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, outerRadius, innerRadius } = config.geometry;
            const { width, height } = config.container;

            const path = [
                // Start at left outer arc
                `M ${outerRadius} 0`,
                // Outer arc on left (top-left corner)
                `A ${outerRadius} ${outerRadius} 0 0 1 0 ${outerRadius}`,
                // Line down left edge
                `L 0 ${height}`,
                // Line right along bottom of left vertical bar
                `L ${horizontal} ${height}`,
                // Line up to inner arc start (left side)
                `L ${horizontal} ${vertical + innerRadius}`,
                // Inner arc on left (curves inward)
                `A ${innerRadius} ${innerRadius} 0 0 0 ${horizontal + innerRadius} ${vertical}`,
                // Line right along horizontal bar to right inner arc start
                `L ${width - (horizontal + innerRadius)} ${vertical}`,
                // Inner arc on right (curves inward)
                `A ${innerRadius} ${innerRadius} 0 0 0 ${width - horizontal} ${vertical + innerRadius}`,
                // Line down to bottom of right vertical bar
                `L ${width - horizontal} ${height}`,
                // Line right along bottom
                `L ${width} ${height}`,
                // Line up right edge
                `L ${width} ${outerRadius}`,
                // Outer arc on right (top-right corner)
                `A ${outerRadius} ${outerRadius} 0 0 1 ${width - outerRadius} 0`,
                // Line left along top to start
                `L ${outerRadius} 0`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Header Contained',
            description: 'Horizontal bar with mirrored elbows on both ends (top)',
            version: '1.0.0'
        }
    },

    'footer-contained': {
        orientation: 'footer-contained',
        features: ['simple', 'segmented'],

        /**
         * Generate footer-contained elbow path
         * Horizontal bar with mirrored elbows on both left and right ends (bottom)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, outerRadius, innerRadius } = config.geometry;
            const { width, height } = config.container;

            const hBarTop = height - vertical;

            const path = [
                // Start at bottom-left outer arc
                `M 0 ${height - outerRadius}`,
                // Outer arc on left (bottom-left corner)
                `A ${outerRadius} ${outerRadius} 0 0 0 ${outerRadius} ${height}`,
                // Line right along bottom
                `L ${width - outerRadius} ${height}`,
                // Outer arc on right (bottom-right corner)
                `A ${outerRadius} ${outerRadius} 0 0 0 ${width} ${height - outerRadius}`,
                // Line up right edge
                `L ${width} 0`,
                // Line left along top of right vertical bar
                `L ${width - horizontal} 0`,
                // Line down to inner arc start (right side)
                `L ${width - horizontal} ${hBarTop - innerRadius}`,
                // Inner arc on right (curves inward)
                `A ${innerRadius} ${innerRadius} 0 0 1 ${width - (horizontal + innerRadius)} ${hBarTop}`,
                // Line left along horizontal bar to left inner arc start
                `L ${horizontal + innerRadius} ${hBarTop}`,
                // Inner arc on left (curves inward)
                `A ${innerRadius} ${innerRadius} 0 0 1 ${horizontal} ${hBarTop - innerRadius}`,
                // Line up to top of left vertical bar
                `L ${horizontal} 0`,
                // Line left along top
                `L 0 0`,
                // Line down left edge to start
                `L 0 ${height - outerRadius}`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Footer Contained',
            description: 'Horizontal bar with mirrored elbows on both ends (bottom)',
            version: '1.0.0'
        }
    },

    // ============================================================================
    // OPEN VARIANTS - Horizontal bar only, no vertical arms
    // ============================================================================

    'header-open': {
        orientation: 'header-open',
        features: ['simple', 'segmented'],

        /**
         * Generate header-open elbow path
         * Simple horizontal bar at top (no vertical arms)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { vertical } = config.geometry;
            const { width } = config.container;

            const path = [
                // Simple rectangle across the top
                `M 0 0`,
                `L ${width} 0`,
                `L ${width} ${vertical}`,
                `L 0 ${vertical}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Header Open',
            description: 'Simple horizontal bar at top (no vertical arms)',
            version: '1.0.0'
        }
    },

    'footer-open': {
        orientation: 'footer-open',
        features: ['simple', 'segmented'],

        /**
         * Generate footer-open elbow path
         * Simple horizontal bar at bottom (no vertical arms)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { vertical } = config.geometry;
            const { width, height } = config.container;

            const hBarTop = height - vertical;

            const path = [
                // Simple rectangle across the bottom
                `M 0 ${hBarTop}`,
                `L ${width} ${hBarTop}`,
                `L ${width} ${height}`,
                `L 0 ${height}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Footer Open',
            description: 'Simple horizontal bar at bottom (no vertical arms)',
            version: '1.0.0'
        }
    },

    // ============================================================================
    // CALLOUT VARIANTS - Squared corners, no arcs
    // ============================================================================

    'header-callout-left': {
        orientation: 'header-callout-left',
        features: ['simple', 'segmented'],

        /**
         * Generate header-callout-left elbow path
         * Top-left corner with 90° angles (no curves)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical } = config.geometry;
            const { width, height } = config.container;

            const path = [
                // Square corners - no arcs
                `M 0 0`,
                `L ${width} 0`,
                `L ${width} ${vertical}`,
                `L ${horizontal} ${vertical}`,
                `L ${horizontal} ${height}`,
                `L 0 ${height}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Header Callout Left',
            description: 'Top-left corner with 90° angles (no curves)',
            version: '1.0.0'
        }
    },

    'header-callout-right': {
        orientation: 'header-callout-right',
        features: ['simple', 'segmented'],

        /**
         * Generate header-callout-right elbow path
         * Top-right corner with 90° angles (no curves)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical } = config.geometry;
            const { width, height } = config.container;

            const vBarLeft = width - horizontal;

            const path = [
                // Square corners - no arcs
                `M 0 0`,
                `L ${width} 0`,
                `L ${width} ${height}`,
                `L ${vBarLeft} ${height}`,
                `L ${vBarLeft} ${vertical}`,
                `L 0 ${vertical}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Header Callout Right',
            description: 'Top-right corner with 90° angles (no curves)',
            version: '1.0.0'
        }
    },

    'footer-callout-left': {
        orientation: 'footer-callout-left',
        features: ['simple', 'segmented'],

        /**
         * Generate footer-callout-left elbow path
         * Bottom-left corner with 90° angles (no curves)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical } = config.geometry;
            const { width, height } = config.container;

            const hBarTop = height - vertical;

            const path = [
                // Square corners - no arcs
                `M 0 0`,
                `L ${horizontal} 0`,
                `L ${horizontal} ${hBarTop}`,
                `L ${width} ${hBarTop}`,
                `L ${width} ${height}`,
                `L 0 ${height}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Footer Callout Left',
            description: 'Bottom-left corner with 90° angles (no curves)',
            version: '1.0.0'
        }
    },

    'footer-callout-right': {
        orientation: 'footer-callout-right',
        features: ['simple', 'segmented'],

        /**
         * Generate footer-callout-right elbow path
         * Bottom-right corner with 90° angles (no curves)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical } = config.geometry;
            const { width, height } = config.container;

            const vBarLeft = width - horizontal;
            const hBarTop = height - vertical;

            const path = [
                // Square corners - no arcs
                `M 0 ${hBarTop}`,
                `L ${vBarLeft} ${hBarTop}`,
                `L ${vBarLeft} 0`,
                `L ${width} 0`,
                `L ${width} ${height}`,
                `L 0 ${height}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Footer Callout Right',
            description: 'Bottom-right corner with 90° angles (no curves)',
            version: '1.0.0'
        }
    },

    // ============================================================================
    // CORNER-INSET VARIANTS - Recessed corners with double-line effect
    // ============================================================================

    'corner-inset-left': {
        orientation: 'corner-inset-left',
        features: ['simple', 'segmented'],

        /**
         * Generate corner-inset-left elbow path
         * Recessed top-left corner with step-in depth effect
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, innerRadius } = config.geometry;
            const { width, height } = config.container;

            // Create 30% inset for recess effect
            const insetDepth = horizontal * 0.3;

            const path = [
                `M 0 0`,
                `L ${width} 0`,
                `L ${width} ${vertical}`,
                `L ${horizontal + insetDepth} ${vertical}`,
                `L ${horizontal + insetDepth} ${vertical + insetDepth}`,
                // Inner arc for smooth transition to inset
                `A ${innerRadius} ${innerRadius} 0 0 0 ${horizontal} ${vertical + insetDepth + innerRadius}`,
                `L ${horizontal} ${height}`,
                `L 0 ${height}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Corner Inset Left',
            description: 'Recessed top-left corner with step-in depth effect',
            version: '1.0.0'
        }
    },

    'corner-inset-right': {
        orientation: 'corner-inset-right',
        features: ['simple', 'segmented'],

        /**
         * Generate corner-inset-right elbow path
         * Recessed top-right corner with step-in depth effect
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, innerRadius } = config.geometry;
            const { width, height } = config.container;

            const vBarLeft = width - horizontal;
            const insetDepth = horizontal * 0.3;

            const path = [
                `M 0 0`,
                `L ${width} 0`,
                `L ${width} ${height}`,
                `L ${vBarLeft} ${height}`,
                `L ${vBarLeft} ${vertical + insetDepth + innerRadius}`,
                // Inner arc for smooth transition to inset
                `A ${innerRadius} ${innerRadius} 0 0 0 ${vBarLeft - insetDepth} ${vertical + insetDepth}`,
                `L ${vBarLeft - insetDepth} ${vertical}`,
                `L 0 ${vertical}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Corner Inset Right',
            description: 'Recessed top-right corner with step-in depth effect',
            version: '1.0.0'
        }
    },

    // ============================================================================
    // ARC-FRAME VARIANTS - Pure curved frame, no straight vertical edge
    // ============================================================================

    'arc-frame-top': {
        orientation: 'arc-frame-top',
        features: ['simple'],  // No segmented mode (double arc doesn't make visual sense)

        /**
         * Generate arc-frame-top elbow path
         * Pure curved frame at top (rainbow arc shape)
         * 
         * Creates a curved band that arcs downward from the top corners.
         * The band has thickness defined by 'vertical' (bar_height).
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { vertical, outerRadius } = config.geometry;
            const { width, height } = config.container;

            const innerRadius = outerRadius - vertical;
            
            // Create a curved band at the top
            // The arc curves downward from top-left to top-right
            // Using the width and outerRadius to determine the curve depth
            
            // Calculate the depth of the curve based on the radius and width
            const halfWidth = width / 2;
            let curveDepth = vertical; // Default curve depth
            
            if (outerRadius >= halfWidth) {
                // For larger radii, calculate actual curve depth
                // Using circle geometry: depth = radius - sqrt(radius^2 - (width/2)^2)
                curveDepth = outerRadius - Math.sqrt(outerRadius * outerRadius - halfWidth * halfWidth);
            }
            
            const path = [
                // Start at top-left corner
                `M 0 0`,
                // Line to curve start point
                `L ${halfWidth - outerRadius} 0`,
                // Outer arc curving downward to the center and back up to top-right
                // This creates a downward curve across the top
                `A ${outerRadius} ${outerRadius} 0 0 1 ${halfWidth + outerRadius} 0`,
                // Line to top-right corner
                `L ${width} 0`,
                // Line down to inner curve height
                `L ${width} ${vertical}`,
                // Line to inner arc start
                `L ${halfWidth + innerRadius} ${vertical}`,
                // Inner arc (tighter curve) back to left
                `A ${innerRadius} ${innerRadius} 0 0 0 ${halfWidth - innerRadius} ${vertical}`,
                // Line to left edge
                `L 0 ${vertical}`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Arc Frame Top',
            description: 'Pure curved frame at top (rainbow arc shape)',
            version: '1.0.0',
            notes: 'Segmented mode not supported (no meaningful double arc)'
        }
    },

    'arc-frame-bottom': {
        orientation: 'arc-frame-bottom',
        features: ['simple'],  // No segmented mode

        /**
         * Generate arc-frame-bottom elbow path
         * Pure curved frame at bottom (inverted arc)
         * 
         * Creates a curved band that arcs upward from the bottom corners.
         * The band has thickness defined by 'vertical' (bar_height).
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { vertical, outerRadius } = config.geometry;
            const { width, height } = config.container;

            const innerRadius = outerRadius - vertical;
            
            // Create a curved band at the bottom
            // The arc curves upward from bottom-left to bottom-right
            const halfWidth = width / 2;
            let curveDepth = vertical;
            
            if (outerRadius >= halfWidth) {
                curveDepth = outerRadius - Math.sqrt(outerRadius * outerRadius - halfWidth * halfWidth);
            }
            
            const path = [
                // Start at bottom-left corner
                `M 0 ${height}`,
                // Line up to inner curve height
                `L 0 ${height - vertical}`,
                // Line to inner arc start
                `L ${halfWidth - innerRadius} ${height - vertical}`,
                // Inner arc curving upward to center and back down (tighter curve)
                `A ${innerRadius} ${innerRadius} 0 0 1 ${halfWidth + innerRadius} ${height - vertical}`,
                // Line to right edge at inner height
                `L ${width} ${height - vertical}`,
                // Line down to bottom-right corner
                `L ${width} ${height}`,
                // Line to outer arc start
                `L ${halfWidth + outerRadius} ${height}`,
                // Outer arc back to left (broader curve)
                `A ${outerRadius} ${outerRadius} 0 0 0 ${halfWidth - outerRadius} ${height}`,
                // Line to bottom-left
                `L 0 ${height}`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Arc Frame Bottom',
            description: 'Pure curved frame at bottom (inverted arc)',
            version: '1.0.0',
            notes: 'Segmented mode not supported (no meaningful double arc)'
        }
    },

    // ============================================================================
    // DIAGONAL-CAP VARIANTS - 45° angular cut
    // ============================================================================

    'diagonal-cap-left': {
        orientation: 'diagonal-cap-left',
        features: ['simple', 'segmented'],

        /**
         * Generate diagonal-cap-left elbow path
         * Top-left with 45° diagonal cut (sharp modern aesthetic)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, outerRadius } = config.geometry;
            const { width, height } = config.container;

            // Use outerRadius as the diagonal cut length
            const diagonalLength = outerRadius;

            const path = [
                // Start after diagonal cut
                `M ${diagonalLength} 0`,
                `L ${width} 0`,
                `L ${width} ${vertical}`,
                `L ${horizontal} ${vertical}`,
                `L ${horizontal} ${height}`,
                `L 0 ${height}`,
                // Up left edge to diagonal start
                `L 0 ${diagonalLength}`,
                // Diagonal cut back to top
                `L ${diagonalLength} 0`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Diagonal Cap Left',
            description: 'Top-left with 45° diagonal cut (sharp modern aesthetic)',
            version: '1.0.0'
        }
    },

    'diagonal-cap-right': {
        orientation: 'diagonal-cap-right',
        features: ['simple', 'segmented'],

        /**
         * Generate diagonal-cap-right elbow path
         * Top-right with 45° diagonal cut (sharp modern aesthetic)
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, outerRadius } = config.geometry;
            const { width, height } = config.container;

            const vBarLeft = width - horizontal;
            const diagonalLength = outerRadius;

            const path = [
                // Start at top-left
                `M 0 0`,
                // Line to diagonal start
                `L ${width - diagonalLength} 0`,
                // Diagonal cut
                `L ${width} ${diagonalLength}`,
                // Down right edge
                `L ${width} ${height}`,
                `L ${vBarLeft} ${height}`,
                `L ${vBarLeft} ${vertical}`,
                `L 0 ${vertical}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            name: 'Diagonal Cap Right',
            description: 'Top-right with 45° diagonal cut (sharp modern aesthetic)',
            version: '1.0.0'
        }
    }
};

/**
 * Get elbow component by type
 * @param {string} type - Elbow type name (e.g., 'header-left')
 * @returns {Object|undefined} Component object or undefined if not found
 */
export function getElbowComponent(type) {
    return elbowComponents[type];
}

/**
 * List all available elbow type names
 * @returns {string[]} Array of elbow type names
 */
export function getElbowTypeNames() {
    return Object.keys(elbowComponents);
}

/**
 * Check if an elbow component exists
 * @param {string} type - Elbow type name
 * @returns {boolean} True if component exists
 */
export function hasElbowComponent(type) {
    return type in elbowComponents;
}
