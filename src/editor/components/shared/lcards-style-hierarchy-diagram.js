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
                padding: 12px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
            }

            .box-model {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 200px;
            }

            .level {
                position: absolute;
                border: 2px solid var(--primary-color, #03a9f4);
                background: var(--card-background-color, white);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .level:hover {
                background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.05);
                transform: scale(1.02);
            }

            /* Nested box model - each level smaller and centered */
            .level-0 { width: 280px; height: 200px; top: 0; left: 0; }
            .level-1 { width: 230px; height: 160px; top: 20px; left: 25px; }
            .level-2 { width: 180px; height: 120px; top: 40px; left: 50px; }
            .level-3 { width: 130px; height: 80px; top: 60px; left: 75px; }
            .level-4 { width: 80px; height: 40px; top: 80px; left: 100px; }

            .level-label {
                position: absolute;
                top: 4px;
                left: 8px;
                font-size: 11px;
                font-weight: 600;
                color: var(--primary-text-color, #000);
                background: var(--card-background-color, white);
                padding: 2px 6px;
                border-radius: 3px;
            }

            .help-text {
                margin-top: 16px;
                font-size: 11px;
                color: var(--secondary-text-color);
                line-height: 1.4;
                text-align: center;
            }
        `;
    }

    render() {
        const levels = this._getLevels();

        return html`
            <div class="box-model">
                ${levels.map((level, index) => html`
                    <div class="level level-${index}" title="${level.desc}">
                        <div class="level-label">${level.name}</div>
                        ${index < levels.length - 1 ? html`
                            <div class="level-content">
                                <!-- Next level nested inside -->
                            </div>
                        ` : ''}
                    </div>
                `)}
            </div>

            <div class="help-text">
                <strong>Cascade Override:</strong> Inner levels override outer levels.
                ${levels[levels.length - 1].name} (innermost) has highest priority.
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
