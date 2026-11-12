var c=Object.defineProperty;var s=(p,e)=>c(p,"name",{value:e,configurable:true});import{i as u,a as g,b as o}from"./lcards-main-C148JfkA.js";const n=class n2 extends u{static get properties(){return{editor:{type:Object},path:{type:String},label:{type:String},helper:{type:String},disabled:{type:Boolean}}}constructor(){super(),this.hass=void 0,this.editor=null,this.path="",this.label="Padding",this.helper="",this.disabled=false}static get styles(){return g`
            :host {
                display: block;
            }

            .padding-editor {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 8px;
            }

            .label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                padding: 2px 8px;
            }

            .padding-grid {
                display: grid;
                grid-template-columns: 80px 80px 80px;
                grid-template-rows: 60px 60px 60px;
                gap: 8px;
                justify-content: center;
                align-items: center;
                padding: 16px 16px 24px 16px;
                background: var(--primary-background-color, #fff);
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-card-border-radius, 12px);
            }

            .padding-cell {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }

            .padding-cell.top {
                grid-column: 2;
                grid-row: 1;
            }

            .padding-cell.left {
                grid-column: 1;
                grid-row: 2;
            }

            .padding-cell.center {
                grid-column: 2;
                grid-row: 2;
                background: var(--primary-color, #f5f5f5);
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: 12px;
                font-size: 12px;
                color: var(--text-primary-color, #757575);
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .padding-cell.right {
                grid-column: 3;
                grid-row: 2;
            }

            .padding-cell.bottom {
                grid-column: 2;
                grid-row: 3;
            }

            .padding-label {
                font-size: 11px;
                font-weight: 700;
                color: var(--secondary-text-color, #757575);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 2px;
            }

            input[type="number"] {
                width: 70px;
                height: 36px;
                padding: 8px;
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                font-weight: 500;
                text-align: center;
                font-family: inherit;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            input[type="number"]:focus {
                outline: none;
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 1px var(--primary-color, #03a9f4);
            }

            input[type="number"]:hover:not(:disabled) {
                border-color: var(--primary-color, #03a9f4);
            }

            input[type="number"]:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: var(--disabled-color, #f0f0f0);
            }

            .helper {
                font-size: 12px;
                color: var(--secondary-text-color, #757575);
                padding: 0 8px;
                font-style: italic;
            }
        `}_getValue(){var e;return(e=this.editor)==null?void 0:e._getConfigValue(this.path)}_getSideValue(e){const r=this._getValue();return r==null?"":typeof r=="number"?r:typeof r=="object"&&r[e]||""}_isUniform(){const e=this._getValue();return typeof e=="number"||e===null||e===void 0}_handleSelectorChange(e,r){if(this.disabled)return;const d=r.detail.value,t=this._getValue();if(typeof t=="number"||t===null||t===void 0){const i=t||0,l={top:i,right:i,bottom:i,left:i};l[e]=d===""?0:Number(d),this.editor._setConfigValue(this.path,l)}else{const i={...t};i[e]=d===""?0:Number(d),this.editor._setConfigValue(this.path,i)}this.requestUpdate()}_renderSideInput(e,r){const d=this._getSideValue(e);return o`
            <div class="padding-cell ${e}">
                <div class="padding-label">${r}</div>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:0,step:1,mode:"box"}}}
                    .value=${d}
                    .disabled=${this.disabled}
                    @value-changed=${t=>this._handleSelectorChange(e,t)}>
                </ha-selector>
            </div>
        `}render(){return o`
            <div class="padding-editor">
                ${this.label?o`<div class="label">${this.label}</div>`:""}

                <div class="padding-grid">
                    ${this._renderSideInput("top","TOP")}
                    ${this._renderSideInput("left","LEFT")}

                    <div class="padding-cell center">
                        Content
                    </div>

                    ${this._renderSideInput("right","RIGHT")}
                    ${this._renderSideInput("bottom","BOTTOM")}
                </div>

                ${this.helper?o`<div class="helper">${this.helper}</div>`:""}
            </div>
        `}};s(n,"LCARdSPaddingEditor");let a=n;customElements.get("lcards-padding-editor")||customElements.define("lcards-padding-editor",a);
//# sourceMappingURL=lcards-padding-editor-4S4gFB_Y.js.map
