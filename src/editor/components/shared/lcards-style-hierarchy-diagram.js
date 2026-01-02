/**
 * LCARdS Style Hierarchy Diagram Component
 * 
 * Visual SVG diagram showing style precedence for Data Grid cards
 * 
 * @element lcards-style-hierarchy-diagram
 * @property {String} mode - Display mode: 'all', 'data-table', or 'manual'
 */

import { LitElement, html, css, svg } from 'lit';

export class LCARdSStyleHierarchyDiagram extends LitElement {
    static get properties() {
        return {
            mode: { type: String } // 'all' | 'data-table' | 'manual'
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                padding: 16px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
            }

            svg {
                width: 100%;
                height: auto;
            }

            .level-box {
                fill: var(--card-background-color, white);
                stroke: var(--primary-color, #03a9f4);
                stroke-width: 2;
            }

            .level-text {
                fill: var(--primary-text-color, #000);
                font-size: 14px;
                font-weight: 500;
            }

            .level-desc {
                fill: var(--secondary-text-color, #666);
                font-size: 11px;
            }

            .arrow {
                stroke: var(--primary-color, #03a9f4);
                stroke-width: 2;
                fill: none;
                marker-end: url(#arrowhead);
            }

            .priority-text {
                fill: var(--secondary-text-color, #666);
                font-size: 10px;
                font-style: italic;
            }

            .help-text {
                margin-top: 12px;
                font-size: 12px;
                color: var(--secondary-text-color);
                line-height: 1.5;
            }
        `;
    }

    render() {
        const levels = this._getLevels();
        const boxHeight = 60;
        const boxWidth = 140;
        const spacing = 40;
        const totalHeight = (levels.length * boxHeight) + ((levels.length - 1) * spacing) + 40;

        return html`
            <svg viewBox="0 0 200 ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" 
                            refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" 
                                 fill="var(--primary-color, #03a9f4)" />
                    </marker>
                </defs>

                <!-- Priority labels -->
                <text x="10" y="15" class="priority-text">Lowest Priority</text>
                <text x="10" y="${totalHeight - 5}" class="priority-text">Highest Priority</text>

                ${levels.map((level, index) => {
                    const y = 30 + (index * (boxHeight + spacing));
                    return svg`
                        <!-- Box -->
                        <rect 
                            class="level-box"
                            x="30" 
                            y="${y}" 
                            width="${boxWidth}" 
                            height="${boxHeight}" 
                            rx="4" />

                        <!-- Level name -->
                        <text 
                            class="level-text"
                            x="100" 
                            y="${y + 25}" 
                            text-anchor="middle">
                            ${level.name}
                        </text>

                        <!-- Description -->
                        <text 
                            class="level-desc"
                            x="100" 
                            y="${y + 40}" 
                            text-anchor="middle">
                            ${level.desc}
                        </text>

                        <!-- Arrow to next level -->
                        ${index < levels.length - 1 ? svg`
                            <path 
                                class="arrow"
                                d="M 100 ${y + boxHeight} L 100 ${y + boxHeight + spacing}" />
                        ` : ''}
                    `;
                })}
            </svg>

            <div class="help-text">
                Each level can override styles from levels above it. 
                Cell-level styles have the highest priority and will override all others.
            </div>
        `;
    }

    _getLevels() {
        const base = [
            { name: 'Grid-wide', desc: 'Applies to all cells' }
        ];

        if (this.mode === 'data-table' || this.mode === 'all') {
            base.push({ name: 'Header', desc: 'Spreadsheet headers' });
            base.push({ name: 'Column', desc: 'Column-specific' });
        }

        base.push({ name: 'Row', desc: 'Row-specific' });
        base.push({ name: 'Cell', desc: 'Individual cells' });

        return base;
    }
}

customElements.define('lcards-style-hierarchy-diagram', LCARdSStyleHierarchyDiagram);
