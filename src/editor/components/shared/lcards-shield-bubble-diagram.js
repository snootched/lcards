/**
 * @fileoverview Static illustrative diagram for the Suggest Shield Bubble
 * info guide (lcards-msd-studio-dialog.js's _renderShieldBubbleGuide): three
 * small hand-authored SVG panels showing raw trace -> simplified ->
 * roundness-blended. Fixed sample geometry, not wired to the user's actual
 * current slider values or a real traced shape - the live canvas preview
 * already exists for that (_renderShieldBubblePreview); this component's
 * only job is a one-time explainer, so no prop wiring is needed.
 *
 * @element lcards-shield-bubble-diagram
 */

import { LitElement, html, css, svg } from 'lit';

// A jagged 16-point star-ish outline (raw trace stand-in), a 6-point
// simplified version of roughly the same silhouette, and a near-ellipse
// (roundness stand-in) with a faint dashed true-ellipse overlay for
// comparison. All three share the same 100x100 viewBox/centroid so they
// read as "the same shape, three ways" rather than three unrelated shapes.
const RAW_POINTS = '50,8 62,14 58,26 74,22 68,36 88,38 76,48 90,58 72,60 78,78 60,68 54,90 46,68 28,78 34,60 16,58 30,48 18,38 38,36 32,22 48,26';
const SIMPLIFIED_POINTS = '50,8 74,22 88,38 78,78 54,90 28,78 16,58 32,22';
const ROUNDED_POINTS = '50,10 68,16 84,32 90,55 78,78 55,90 25,80 12,55 20,30';

export class LCARdSShieldBubbleDiagram extends LitElement {
    static styles = css`
        :host {
            display: block;
            padding: var(--ha-space-2) 0;
        }
        .diagram-row {
            display: flex;
            gap: var(--ha-space-4);
            justify-content: center;
            flex-wrap: wrap;
        }
        .diagram-cell {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--ha-space-1);
        }
        .diagram-cell svg {
            width: 100px;
            height: 100px;
        }
        .diagram-label {
            font-size: 11px;
            color: var(--secondary-text-color);
            text-align: center;
            line-height: 1.3;
        }
        .outline {
            fill: rgba(255, 159, 10, 0.15);
            stroke: #FF9F0A;
            stroke-width: 2;
        }
        .vertex {
            fill: #FF9F0A;
        }
        .ellipse-target {
            fill: none;
            stroke: var(--secondary-text-color);
            stroke-width: 1;
            stroke-dasharray: 3, 3;
        }
    `;

    render() {
        return html`
            <div class="diagram-row">
                <div class="diagram-cell">
                    ${this._renderShape(RAW_POINTS, false)}
                    <span class="diagram-label">Raw trace<br>(many points)</span>
                </div>
                <div class="diagram-cell">
                    ${this._renderShape(SIMPLIFIED_POINTS, false)}
                    <span class="diagram-label">Simplified<br>(tolerance ↑)</span>
                </div>
                <div class="diagram-cell">
                    ${this._renderShape(ROUNDED_POINTS, true)}
                    <span class="diagram-label">Roundness ↑<br>(toward ellipse)</span>
                </div>
            </div>
        `;
    }

    _renderShape(pointsAttr, showEllipseTarget) {
        const points = pointsAttr.split(' ').map((p) => p.split(',').map(Number));
        return svg`
            <svg viewBox="0 0 100 100">
                ${showEllipseTarget ? svg`<ellipse class="ellipse-target" cx="50" cy="50" rx="40" ry="42" />` : ''}
                <polygon class="outline" points="${pointsAttr}" />
                ${points.map(([x, y]) => svg`<circle class="vertex" cx="${x}" cy="${y}" r="2.5" />`)}
            </svg>
        `;
    }
}

if (!customElements.get('lcards-shield-bubble-diagram')) customElements.define('lcards-shield-bubble-diagram', LCARdSShieldBubbleDiagram);
