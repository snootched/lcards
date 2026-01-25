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
