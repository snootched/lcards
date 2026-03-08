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
 * - features: Array of supported styles ('simple', 'segmented')
 * - layout: Positioning metadata for text/content area calculation
 *   - position: 'header', 'footer' (vertical position of main bar)
 *   - side: 'left', 'right', 'contained', 'open' (horizontal positioning)
 * - pathGenerator: Function that generates SVG path from config
 * - metadata: Component information (name, description, version)
 *
 * @type {Object.<string, {orientation: string, features: string[], layout: Object, pathGenerator: Function, metadata: Object}>}
 */
export const elbowComponents = {
    'header-left': {
        orientation: 'header-left',
        features: ['simple', 'segmented'],
        layout: {
            position: 'header',
            side: 'left'
        },

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
            type: 'elbow',
            pack: 'core',
            name: 'Header Left Elbow',
            description: 'Top-left corner elbow (vertical bar on left, horizontal bar on top)',
            version: '1.0.0'
        }
    },

    'header-right': {
        orientation: 'header-right',
        features: ['simple', 'segmented'],
        layout: {
            position: 'header',
            side: 'right'
        },

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
            type: 'elbow',
            pack: 'core',
            name: 'Header Right Elbow',
            description: 'Top-right corner elbow (vertical bar on right, horizontal bar on top)',
            version: '1.0.0'
        }
    },

    'footer-left': {
        orientation: 'footer-left',
        features: ['simple', 'segmented'],
        layout: {
            position: 'footer',
            side: 'left'
        },

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
            type: 'elbow',
            pack: 'core',
            name: 'Footer Left Elbow',
            description: 'Bottom-left corner elbow (vertical bar on left, horizontal bar on bottom)',
            version: '1.0.0'
        }
    },

    'footer-right': {
        orientation: 'footer-right',
        features: ['simple', 'segmented'],
        layout: {
            position: 'footer',
            side: 'right'
        },

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
            type: 'elbow',
            pack: 'core',
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
        features: ['simple'],
        layout: {
            position: 'header',
            side: 'contained'
        },

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
                `A ${outerRadius} ${outerRadius} 0 0 0 0 ${outerRadius}`,
                // Line down left edge
                `L 0 ${height}`,
                // Line right along bottom of left vertical bar
                `L ${horizontal} ${height}`,
                // Line up to inner arc start (left side)
                `L ${horizontal} ${vertical + innerRadius}`,
                // Inner arc on left (curves outward to match outer arc)
                `A ${innerRadius} ${innerRadius} 0 0 1 ${horizontal + innerRadius} ${vertical}`,
                // Line right along horizontal bar to right inner arc start
                `L ${width - (horizontal + innerRadius)} ${vertical}`,
                // Inner arc on right (curves outward to match outer arc)
                `A ${innerRadius} ${innerRadius} 0 0 1 ${width - horizontal} ${vertical + innerRadius}`,
                // Line down to bottom of right vertical bar
                `L ${width - horizontal} ${height}`,
                // Line right along bottom
                `L ${width} ${height}`,
                // Line up right edge
                `L ${width} ${outerRadius}`,
                // Outer arc on right (top-right corner)
                `A ${outerRadius} ${outerRadius} 0 0 0 ${width - outerRadius} 0`,
                // Line left along top to start
                `L ${outerRadius} 0`,
                // Close path
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            type: 'elbow',
            pack: 'core',
            name: 'Header Contained',
            description: 'Horizontal bar with mirrored elbows on both ends (top)',
            version: '1.0.0'
        }
    },

    'footer-contained': {
        orientation: 'footer-contained',
        features: ['simple'],
        layout: {
            position: 'footer',
            side: 'contained'
        },

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
            type: 'elbow',
            pack: 'core',
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
        features: ['simple'],
        layout: {
            position: 'header',
            side: 'open'
        },

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
            type: 'elbow',
            pack: 'core',
            name: 'Header Open',
            description: 'Simple horizontal bar at top (no vertical arms)',
            version: '1.0.0'
        }
    },

    'footer-open': {
        orientation: 'footer-open',
        features: ['simple'],
        layout: {
            position: 'footer',
            side: 'open'
        },

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
            type: 'elbow',
            pack: 'core',
            name: 'Footer Open',
            description: 'Simple horizontal bar at bottom (no vertical arms)',
            version: '1.0.0'
        }
    },

    // ============================================================================
    // DIAGONAL-CAP VARIANTS - Configurable angular cuts
    // ============================================================================

    'diagonal-cap-left': {
        orientation: 'diagonal-cap-left',
        features: ['simple', 'segmented'],
        layout: {
            position: 'header',
            side: 'left'
        },

        /**
         * Generate diagonal-cap-left elbow path
         * Top-left with configurable diagonal cuts on both corners
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry (includes diagonalAngle)
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, outerRadius, innerRadius, diagonalAngle = 45 } = config.geometry;
            const { width, height } = config.container;

            // Calculate diagonal offsets based on angle (0° = horizontal, 90° = vertical)
            const angleRad = (diagonalAngle * Math.PI) / 180;
            const outerCutH = outerRadius * Math.cos(angleRad);  // Horizontal component
            const outerCutV = outerRadius * Math.sin(angleRad);  // Vertical component

            // Inner corner cut (scaled by innerRadius)
            const innerCutH = innerRadius * Math.cos(angleRad);
            const innerCutV = innerRadius * Math.sin(angleRad);

            const path = [
                // Start after outer diagonal cut
                `M ${outerCutH} 0`,
                `L ${width} 0`,
                `L ${width} ${vertical}`,
                // Approach inner corner from right
                `L ${horizontal + innerCutH} ${vertical}`,
                // Inner diagonal cut
                `L ${horizontal} ${vertical + innerCutV}`,
                // Down to bottom
                `L ${horizontal} ${height}`,
                `L 0 ${height}`,
                // Up left edge to outer diagonal start
                `L 0 ${outerCutV}`,
                // Outer diagonal cut back to start
                `L ${outerCutH} 0`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            type: 'elbow',
            pack: 'core',
            name: 'Diagonal Cap Left',
            description: 'Top-left with configurable diagonal cut (0° = square, 45° = diagonal)',
            version: '1.0.0'
        }
    },

    'diagonal-cap-right': {
        orientation: 'diagonal-cap-right',
        features: ['simple', 'segmented'],
        layout: {
            position: 'header',
            side: 'right'
        },

        /**
         * Generate diagonal-cap-right elbow path
         * Top-right with configurable diagonal cuts on both corners
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry (includes diagonalAngle)
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, outerRadius, innerRadius, diagonalAngle = 45 } = config.geometry;
            const { width, height } = config.container;

            const vBarLeft = width - horizontal;

            // Calculate diagonal offsets based on angle
            const angleRad = (diagonalAngle * Math.PI) / 180;
            const outerCutH = outerRadius * Math.cos(angleRad);
            const outerCutV = outerRadius * Math.sin(angleRad);

            // Inner corner cut
            const innerCutH = innerRadius * Math.cos(angleRad);
            const innerCutV = innerRadius * Math.sin(angleRad);

            const path = [
                // Start at top-left
                `M 0 0`,
                // Line to outer diagonal start
                `L ${width - outerCutH} 0`,
                // Outer diagonal cut down to right edge
                `L ${width} ${outerCutV}`,
                // Down right edge
                `L ${width} ${height}`,
                `L ${vBarLeft} ${height}`,
                // Up to inner corner
                `L ${vBarLeft} ${vertical + innerCutV}`,
                // Inner diagonal cut
                `L ${vBarLeft - innerCutH} ${vertical}`,
                // Back to left
                `L 0 ${vertical}`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            type: 'elbow',
            pack: 'core',
            name: 'Diagonal Cap Right',
            description: 'Top-right with configurable diagonal cut (0° = square, 45° = diagonal)',
            version: '1.0.0'
        }
    },

    'diagonal-cap-footer-left': {
        orientation: 'diagonal-cap-footer-left',
        features: ['simple', 'segmented'],
        layout: {
            position: 'footer',
            side: 'left'
        },

        /**
         * Generate diagonal-cap-footer-left elbow path
         * Bottom-left with configurable diagonal cuts on both corners
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry (includes diagonalAngle)
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, outerRadius, innerRadius, diagonalAngle = 45 } = config.geometry;
            const { width, height } = config.container;

            // Calculate diagonal offsets based on angle
            const angleRad = (diagonalAngle * Math.PI) / 180;
            const outerCutH = outerRadius * Math.cos(angleRad);
            const outerCutV = outerRadius * Math.sin(angleRad);

            const innerCutH = innerRadius * Math.cos(angleRad);
            const innerCutV = innerRadius * Math.sin(angleRad);

            const path = [
                // Start at top-left
                `M 0 0`,
                `L ${horizontal} 0`,
                // Down left edge to inner corner
                `L ${horizontal} ${height - vertical - innerCutV}`,
                // Inner diagonal cut
                `L ${horizontal + innerCutH} ${height - vertical}`,
                // Across to right edge
                `L ${width} ${height - vertical}`,
                `L ${width} ${height}`,
                // Along bottom edge
                `L ${outerCutH} ${height}`,
                // Outer diagonal cut
                `L 0 ${height - outerCutV}`,
                // Up left edge
                `L 0 0`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            type: 'elbow',
            pack: 'core',
            name: 'Diagonal Cap Footer Left',
            description: 'Bottom-left with configurable diagonal cut (0° = square, 45° = diagonal)',
            version: '1.0.0'
        }
    },

    'diagonal-cap-footer-right': {
        orientation: 'diagonal-cap-footer-right',
        features: ['simple', 'segmented'],
        layout: {
            position: 'footer',
            side: 'right'
        },

        /**
         * Generate diagonal-cap-footer-right elbow path
         * Bottom-right with configurable diagonal cuts on both corners
         *
         * @param {Object} config - Path generator configuration
         * @param {Object} config.geometry - Elbow geometry (includes diagonalAngle)
         * @param {Object} config.container - Container dimensions
         * @returns {string} SVG path string
         */
        pathGenerator: (config) => {
            const { horizontal, vertical, outerRadius, innerRadius, diagonalAngle = 45 } = config.geometry;
            const { width, height } = config.container;

            const vBarLeft = width - horizontal;

            // Calculate diagonal offsets based on angle
            const angleRad = (diagonalAngle * Math.PI) / 180;
            const outerCutH = outerRadius * Math.cos(angleRad);
            const outerCutV = outerRadius * Math.sin(angleRad);

            const innerCutH = innerRadius * Math.cos(angleRad);
            const innerCutV = innerRadius * Math.sin(angleRad);

            const path = [
                // Start at top-left
                `M 0 0`,
                `L ${width} 0`,
                `L ${width} ${height - outerCutV}`,
                // Outer diagonal cut
                `L ${width - outerCutH} ${height}`,
                // Along bottom edge
                `L 0 ${height}`,
                `L 0 ${height - vertical}`,
                // Approach inner corner
                `L ${vBarLeft - innerCutH} ${height - vertical}`,
                // Inner diagonal cut
                `L ${vBarLeft} ${height - vertical - innerCutV}`,
                // Up right edge
                `L ${vBarLeft} 0`,
                `Z`
            ];

            return path.join(' ');
        },

        metadata: {
            type: 'elbow',
            pack: 'core',
            name: 'Diagonal Cap Footer Right',
            description: 'Bottom-right with configurable diagonal cut (0° = square, 45° = diagonal)',
            version: '1.0.0'
        }
    },

    // ============================================================================
    // FRAME VARIANTS - Full border around content area
    // ============================================================================

    /**
     * The 'frame' type draws a rectangular ring (2–4 sided border) around the card.
     * Per-side widths, per-corner outer/inner curves, optional open sides, and
     * segmented (double-ring) support are all handled in LCARdSElbow._generateFrameSVG().
     * This component entry supplies registry metadata and layout hints only —
     * actual path generation is NOT delegated to pathGenerator here.
     */
    'frame': {
        orientation: 'frame',
        features: ['simple', 'segmented'],
        layout: {
            position: 'frame',
            side: 'frame'
        },

        /**
         * Frame paths are generated entirely inside LCARdSElbow._generateFrameSVG().
         * This stub exists so the component registry can return valid feature/layout
         * metadata for type 'frame'.
         */
        pathGenerator: (_config) => '',

        metadata: {
            type: 'elbow',
            pack: 'core',
            name: 'Frame',
            description: 'Full rectangular frame (2–4 sided border with per-side widths and per-corner curves)',
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
