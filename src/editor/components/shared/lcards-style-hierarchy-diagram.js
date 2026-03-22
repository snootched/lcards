/**
 * @fileoverview LCARdS Style Hierarchy Diagram Component
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
                padding: 24px;
            }

            .diagram-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }

            .table-diagram {
                position: relative;
                width: 400px;
                height: 300px;
                margin: 0 auto;
            }

            .grid-base {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 3px solid var(--primary-color, #03a9f4);
                border-radius: 8px;
                background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.03);
                display: flex;
                align-items: flex-start;
                justify-content: flex-start;
                padding: 8px;
            }

            .grid-label {
                font-size: 10px;
                font-weight: 600;
                color: var(--primary-text-color);
                background: var(--card-background-color);
                padding: 3px 8px;
                border-radius: 4px;
                position: absolute;
                top: 8px;
                left: 8px;
                z-index: 10;
            }

            .row-band {
                position: absolute;
                left: 80px;
                top: 80px;
                width: calc(100% - 160px);
                height: 60px;
                background: rgba(255, 152, 0, 0.15);
                border: 2px solid rgba(255, 152, 0, 0.6);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                padding-left: 8px;
                z-index: 2;
            }

            .col-band {
                position: absolute;
                left: 180px;
                top: 60px;
                width: 60px;
                height: calc(100% - 120px);
                background: rgba(76, 175, 80, 0.15);
                border: 2px solid rgba(76, 175, 80, 0.6);
                border-radius: 4px;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                padding-bottom: 8px;
                z-index: 3;
            }

            .cell-highlight {
                position: absolute;
                left: 180px;
                top: 80px;
                width: 60px;
                height: 60px;
                background: rgba(233, 30, 99, 0.2);
                border: 3px solid rgba(233, 30, 99, 0.8);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 4;
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }

            .band-label {
                font-size: 9px;
                font-weight: 600;
                color: var(--primary-text-color);
                background: var(--card-background-color);
                padding: 2px 6px;
                border-radius: 3px;
                text-align: center;
                line-height: 1.2;
            }

            .legend {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 16px;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                color: var(--secondary-text-color);
            }

            .legend-box {
                width: 16px;
                height: 16px;
                border-radius: 3px;
                border: 2px solid;
            }

            .legend-grid { background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1); border-color: var(--primary-color); }
            .legend-row { background: rgba(255, 152, 0, 0.15); border-color: rgba(255, 152, 0, 0.6); }
            .legend-col { background: rgba(76, 175, 80, 0.15); border-color: rgba(76, 175, 80, 0.6); }
            .legend-cell { background: rgba(233, 30, 99, 0.2); border-color: rgba(233, 30, 99, 0.8); }

            .help-text {
                margin-top: 16px;
                font-size: 11px;
                color: var(--secondary-text-color);
                line-height: 1.5;
                text-align: center;
                max-width: 500px;
            }
        `;
    }

    render() {
        return html`
            <div class="diagram-container">
                <div class="table-diagram">
                    <!-- Grid-wide background -->
                    <div class="grid-base">
                        <div class="grid-label">Grid-Wide Styles</div>
                    </div>

                    <!-- Row-level band (horizontal) -->
                    <div class="row-band">
                        <div class="band-label">Row<br>Styles</div>
                    </div>

                    <!-- Column-level band (vertical) -->
                    <div class="col-band">
                        <div class="band-label">Col<br>Styles</div>
                    </div>

                    <!-- Cell-level highlight (intersection) -->
                    <div class="cell-highlight">
                        <div class="band-label" style="font-size: 10px;">Cell</div>
                    </div>
                </div>

                <!-- Legend -->
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-box legend-grid"></div>
                        <span>1. Grid-Wide (lowest)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box legend-row"></div>
                        <span>2. Row Styles</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box legend-col"></div>
                        <span>3. Column Styles</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box legend-cell"></div>
                        <span>4. Cell (highest)</span>
                    </div>
                </div>

                <div class="help-text">
                    <strong>Style Precedence:</strong> Styles cascade and merge from grid-wide → row → column → cell.
                    When a cell is in both a styled row AND column, both apply. Cell-level styles override all others.
                </div>
            </div>
        `;
    }

    _getLevels() {
        // Deprecated - keeping for backward compatibility
        const base = [
            { name: 'Grid-wide', desc: 'Applies to all cells' }
        ];

        // @ts-ignore - TS2339: auto-suppressed
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
