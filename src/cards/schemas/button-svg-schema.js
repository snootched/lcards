/**
 * Button SVG Schema
 * 
 * Schema for custom SVG backgrounds and interactive segments.
 * Supports inline SVG content, external sources, and segmented interaction.
 */

/**
 * Get SVG schema for button card
 * @returns {Object} SVG property schema
 */
export function getButtonSvgSchema() {
    return {
        svg: {
            type: 'object',
            description: 'Full SVG background support with optional segmented interaction',
            properties: {
                content: {
                    type: 'string',
                    description: 'Inline SVG content (without outer <svg> tag, or with it)'
                },
                src: {
                    type: 'string',
                    description: 'External SVG path ("/local/shapes/icon.svg") or data URI'
                },
                viewBox: {
                    type: 'string',
                    description: 'ViewBox for SVG (auto-detected if not specified)',
                    pattern: '^-?\\d+(\\.\\d+)?\\s+-?\\d+(\\.\\d+)?\\s+\\d+(\\.\\d+)?\\s+\\d+(\\.\\d+)?$'
                },
                preserveAspectRatio: {
                    type: 'string',
                    description: 'Aspect ratio preservation (default: xMidYMid meet)',
                    enum: [
                        'none',
                        'xMinYMin meet', 'xMidYMin meet', 'xMaxYMin meet',
                        'xMinYMid meet', 'xMidYMid meet', 'xMaxYMid meet',
                        'xMinYMax meet', 'xMidYMax meet', 'xMaxYMax meet',
                        'xMinYMin slice', 'xMidYMin slice', 'xMaxYMin slice',
                        'xMinYMid slice', 'xMidYMid slice', 'xMaxYMid slice',
                        'xMinYMax slice', 'xMidYMax slice', 'xMaxYMax slice'
                    ]
                },
                enable_tokens: {
                    type: 'boolean',
                    description: 'Enable token replacement ({{entity.state}}, theme:tokens). Default: true'
                },
                allow_scripts: {
                    type: 'boolean',
                    description: 'Allow script elements in SVG (SECURITY RISK). Default: false'
                },
                segments: {
                    type: 'array',
                    description: 'Interactive segments within the SVG. Each segment can have its own entity, actions, and state-based styling.',
                    items: { $ref: '#/definitions/segment' }
                }
            }
        }
    };
}
