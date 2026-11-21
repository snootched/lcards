var s=Object.defineProperty;var r=(t,e)=>s(t,"name",{value:e,configurable:true});import{i as c,c as d,b as a}from"./lcards-main-DsZpib8R.js";const n=class n2 extends c{static get properties(){return{header:{type:String},description:{type:String},expanded:{type:Boolean},outlined:{type:Boolean},leftChevron:{type:Boolean},icon:{type:String},headerLevel:{type:Number},secondary:{type:String},noCollapse:{type:Boolean},compact:{type:Boolean},nested:{type:Boolean},variant:{type:String,reflect:true}}}constructor(){super(),this.header="",this.description="",this.expanded=false,this.outlined=true,this.leftChevron=false,this.icon="",this.headerLevel=4,this.secondary="",this.noCollapse=false,this.compact=false,this.nested=false,this.variant=""}static get styles(){return d`
            :host {
                display: block;
                margin-bottom: var(--lcards-section-spacing, 16px);
            }

            ha-expansion-panel {
                border-radius: var(--ha-card-border-radius, var(--ha-border-radius-3xl));
                --expansion-panel-summary-padding: 0 var(--ha-space-2) 0 var(--ha-space-4);
                background-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 30%,
                    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
                );
            }

            ha-expansion-panel[outlined] {
                border: var(--ha-border-width-md) solid var(--chip-background-color, #e0e0e0);
            }

            ha-expansion-panel[expanded] {
                background-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 30%,
                    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
                );
            }

            /* Override focused state background */
            ha-expansion-panel:focus-within,
            ha-expansion-panel.focused {
                background-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 65%,
                    color-mix(in srgb, var(--primary-background-color) 35%, transparent)
                );
                --input-fill-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 65%,
                    color-mix(in srgb, var(--primary-background-color) 35%, transparent)
                );
            }

            .section-content {
                padding: var(--ha-space-3);
            }

            .section-content.compact,
            .section-content.nested {
                padding: var(--ha-space-2);
            }

            /* Secondary text beside the header (a count, an entity id) */
            .header-secondary {
                margin-left: var(--ha-space-2);
                font-weight: var(--ha-font-weight-normal, 400);
                font-size: 0.9em;
                color: var(--secondary-text-color);
            }

            .section-description {
                font-size: var(--ha-font-size-m);
                color: var(--secondary-text-color, #727272);
                margin-bottom: var(--ha-space-3);
                line-height: 1.5;
            }

            ::slotted(*) {
                display: block;
            }

            /* Add spacing between ha-selector elements to prevent cramping when helper text is present */
            ::slotted(ha-selector) {
                margin-bottom: var(--ha-space-4);
            }

            /* Explainer (variant="guide"): dark, primary colour on border and header,
               staying dark when open or focused */
            :host([variant="guide"]) ha-expansion-panel,
            :host([variant="guide"]) ha-expansion-panel[expanded],
            :host([variant="guide"]) ha-expansion-panel:focus-within,
            :host([variant="guide"]) ha-expansion-panel.focused {
                background-color: var(--primary-background-color);
            }

            :host([variant="guide"]) ha-expansion-panel[outlined] {
                border-color: color-mix(in srgb, var(--primary-color) 50%, transparent);
            }

            :host([variant="guide"]) [slot="header"] {
                color: var(--primary-color);
                font-weight: 600;
            }

            /* Icon spacing in headers */
            h1 ha-icon,
            h2 ha-icon,
            h3 ha-icon,
            h4 ha-icon,
            h5 ha-icon,
            h6 ha-icon {
                margin-right: var(--ha-space-2);
                vertical-align: middle;
            }
        `}render(){const e=["section-content"];return this.compact&&e.push("compact"),this.nested&&e.push("nested"),a`
            <ha-expansion-panel
                .header=${this.header}
                ?expanded=${this.expanded}
                ?outlined=${this.outlined}
                ?leftChevron=${this.leftChevron}
                .noCollapse=${this.noCollapse}
                .secondary=${this.secondary}
                @expanded-changed=${this._handleExpandedChange}>
                ${this.icon||this.secondary?a`
                    <div slot="header">
                        ${this.icon?a`<ha-icon icon="${this.icon}"></ha-icon>`:""}
                        <span>${this.header}</span>
                        ${this.secondary?a`<span class="header-secondary">${this.secondary}</span>`:""}
                    </div>
                `:""}
                <slot name="header-icons" slot="icons"></slot>
                <div class="${e.join(" ")}"
                    @closed=${i=>i.stopPropagation()}>
                    ${this.description?a`
                        <div class="section-description">${this.description}</div>
                    `:""}
                    <slot></slot>
                </div>
            </ha-expansion-panel>
        `}_handleExpandedChange(e){e.stopPropagation(),this.expanded=e.detail.expanded,this.dispatchEvent(new CustomEvent("expanded-changed",{detail:{expanded:this.expanded},bubbles:false,composed:false}))}};r(n,"LCARdSFormSection");let o=n;customElements.get("lcards-form-section")||customElements.define("lcards-form-section",o);
//# sourceMappingURL=lcards-form-section-DzcFFL6H.js.map
