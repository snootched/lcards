var $=Object.defineProperty;var _=(b,e)=>$(b,"name",{value:e,configurable:true});import{i as v,c as x,b as l}from"./lcards-main-DsZpib8R.js";import"./lcards-form-section-DzcFFL6H.js";import"./lcards-color-section-v2-CPBKD2jW.js";const m=class m2 extends v{static get properties(){return{editor:{type:Object},path:{type:String},label:{type:String},showPreview:{type:Boolean},_widthMode:{type:String,state:true},_radiusMode:{type:String,state:true},_borderConfig:{type:Object,state:true}}}constructor(){super(),this.hass=void 0,this.editor=null,this.path="style.border",this.label="Border Configuration",this.showPreview=true,this._widthMode="unified",this._radiusMode="unified",this._borderConfig={}}static get styles(){return x`
            :host {
                display: block;
            }

            .form-row {
                margin-bottom: 12px;
            }

            .form-row label {
                display: block;
                font-weight: 500;
                color: var(--primary-text-color);
                font-size: 14px;
                margin-bottom: 8px;
                padding: 2px 8px;
            }

            .form-row .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 4px;
                padding: 0 8px;
            }

            .preview-container {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 24px;
                background: var(--primary-background-color);
                border-radius: var(--ha-card-border-radius, 12px);
                margin-bottom: 12px;
            }

            .preview-container svg {
                max-width: 200px;
                height: auto;
            }

            ha-input {
                width: 100%;
                display: block;
            }

            .per-side-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            @media (max-width: 768px) {
                .per-side-grid {
                    grid-template-columns: 1fr;
                }
            }
        `}connectedCallback(){super.connectedCallback(),this._loadBorderConfig()}_loadBorderConfig(){if(!this.editor)return;const e=this.editor._getConfigValue(this.path);this._borderConfig=e||{},typeof this._borderConfig.width=="object"?this._widthMode="per-side":this._widthMode="unified",typeof this._borderConfig.radius=="object"?this._radiusMode="per-corner":this._radiusMode="unified"}render(){return this.editor?l`
            <lcards-form-section
                header="${this.label}"
                description="Configure border styling and dimensions"
                icon="mdi:border-all"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${this.showPreview?this._renderPreview():""}

                ${this._renderWidthControls()}

                ${this._renderRadiusControls()}

                ${this._renderColorControls()}
            </lcards-form-section>
        `:l`<div>Border editor requires 'editor' property</div>`}_renderPreview(){var f;const e=this._getEffectiveWidth(),t=this._getEffectiveRadius(),n=((f=this._borderConfig.color)==null?void 0:f.default)||"#03a9f4",o=Math.max(e.top,e.right,e.bottom,e.left),r=e.left,a=e.top,d=200-e.left-e.right,i=120-e.top-e.bottom,s=Math.min(t.top_left||0,d/2,i/2),h=Math.min(t.top_right||0,d/2,i/2),u=Math.min(t.bottom_right||0,d/2,i/2),p=Math.min(t.bottom_left||0,d/2,i/2),g=`
            M ${r+s} ${a}
            L ${r+d-h} ${a}
            ${h>0?`A ${h} ${h} 0 0 1 ${r+d} ${a+h}`:""}
            L ${r+d} ${a+i-u}
            ${u>0?`A ${u} ${u} 0 0 1 ${r+d-u} ${a+i}`:""}
            L ${r+p} ${a+i}
            ${p>0?`A ${p} ${p} 0 0 1 ${r} ${a+i-p}`:""}
            L ${r} ${a+s}
            ${s>0?`A ${s} ${s} 0 0 1 ${r+s} ${a}`:""}
            Z
        `;return l`
            <div class="preview-container">
                <svg width="200" height="120" viewBox="0 0 200 120">
                    <path
                        d="${g}"
                        fill="none"
                        stroke="${n}"
                        stroke-width="${o}" />
                </svg>
            </div>
        `}_renderWidthControls(){var n;const e=this._borderConfig.width||2,t=this._widthMode==="unified";return l`
            <lcards-form-section
                header="Border Width"
                description="Configure border thickness"
                icon="mdi:border-style"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <ha-selector
                    .hass=${(n=this.editor)==null?void 0:n.hass}
                    .selector=${{boolean:{}}}
                    .value=${!t}
                    .label=${"Per-Side Width"}
                    @value-changed=${o=>{o.detail.value!==!t&&this._toggleWidthMode()}}>
                </ha-selector>

                ${t?l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Width (px)"}
                        .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${typeof e=="number"?e:2}
                        @value-changed=${o=>this._updateBorderProperty("width",o.detail.value)}>
                    </ha-selector>
                `:l`
                    <div class="per-side-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Top (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${(e==null?void 0:e.top)||2}
                            @value-changed=${o=>this._updateBorderProperty("width.top",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Right (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${(e==null?void 0:e.right)||2}
                            @value-changed=${o=>this._updateBorderProperty("width.right",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Bottom (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${(e==null?void 0:e.bottom)||2}
                            @value-changed=${o=>this._updateBorderProperty("width.bottom",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Left (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${(e==null?void 0:e.left)||2}
                            @value-changed=${o=>this._updateBorderProperty("width.left",o.detail.value)}>
                        </ha-selector>
                    </div>
                `}
            </lcards-form-section>
        `}_renderColorControls(){return l`
            <lcards-color-section-v2
                .editor=${this.editor}
                basePath="${this.path}.color"
                header="Border Colours"
                .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
                ?allowCustomStates=${true}
                ?expanded=${false}>
            </lcards-color-section-v2>
        `}_renderRadiusControls(){var n,o,r,a,d,i;const e=this._borderConfig.radius||12,t=this._radiusMode==="unified";return l`
            <lcards-form-section
                header="Border Radius"
                description="Configure corner rounding"
                icon="mdi:border-radius"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <ha-selector
                    .hass=${(n=this.editor)==null?void 0:n.hass}
                    .selector=${{boolean:{}}}
                    .value=${!t}
                    .label=${"Per-Corner Radius"}
                    @value-changed=${s=>{s.detail.value!==!t&&this._toggleRadiusMode()}}>
                </ha-selector>

                ${t?l`
                    <ha-selector
                        .hass=${(o=this.editor)==null?void 0:o.hass}
                        .label=${"Radius (px)"}
                        .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${typeof e=="number"?e:12}
                        @value-changed=${s=>this._updateBorderProperty("radius",s.detail.value)}>
                    </ha-selector>
                `:l`
                    <div class="per-side-grid">
                        <ha-selector
                            .hass=${(r=this.editor)==null?void 0:r.hass}
                            .label=${"Top-Left (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${(e==null?void 0:e.top_left)||12}
                            @value-changed=${s=>this._updateBorderProperty("radius.top_left",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${(a=this.editor)==null?void 0:a.hass}
                            .label=${"Top-Right (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${(e==null?void 0:e.top_right)||12}
                            @value-changed=${s=>this._updateBorderProperty("radius.top_right",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${(d=this.editor)==null?void 0:d.hass}
                            .label=${"Bottom-Right (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${(e==null?void 0:e.bottom_right)||12}
                            @value-changed=${s=>this._updateBorderProperty("radius.bottom_right",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${(i=this.editor)==null?void 0:i.hass}
                            .label=${"Bottom-Left (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${(e==null?void 0:e.bottom_left)||12}
                            @value-changed=${s=>this._updateBorderProperty("radius.bottom_left",s.detail.value)}>
                        </ha-selector>
                    </div>
                `}
            </lcards-form-section>
        `}_toggleWidthMode(){const e=this._borderConfig.width||2;if(this._widthMode==="unified"){const t=typeof e=="number"?e:2;this._widthMode="per-side",this._updateBorderProperty("width",{top:t,right:t,bottom:t,left:t})}else{const t=typeof e=="object"?Math.round((e.top+e.right+e.bottom+e.left)/4):2;this._widthMode="unified",this._updateBorderProperty("width",t)}}_toggleRadiusMode(){const e=this._borderConfig.radius||12;if(this._radiusMode==="unified"){const t=typeof e=="number"?e:12;this._radiusMode="per-corner",this._updateBorderProperty("radius",{top_left:t,top_right:t,bottom_right:t,bottom_left:t})}else{const t=typeof e=="object"?Math.round((e.top_left+e.top_right+e.bottom_right+e.bottom_left)/4):12;this._radiusMode="unified",this._updateBorderProperty("radius",t)}}_updateBorderProperty(e,t){const n=e.split("."),o={...this._borderConfig};let r=o;for(let d=0;d<n.length-1;d++){const i=n[d];if(i==="__proto__"||i==="constructor"||i==="prototype")return;(!r[i]||typeof r[i]!="object")&&(r[i]={}),r=r[i]}const a=n[n.length-1];a==="__proto__"||a==="constructor"||a==="prototype"||(r[a]=t,this._borderConfig=o,this.editor&&this.editor._setConfigValue(this.path,o),this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:o},bubbles:true,composed:true})),this.requestUpdate())}_getEffectiveWidth(){const e=this._borderConfig.width||2;return typeof e=="number"?{top:e,right:e,bottom:e,left:e}:{top:e.top||2,right:e.right||2,bottom:e.bottom||2,left:e.left||2}}_getEffectiveRadius(){const e=this._borderConfig.radius||12;return typeof e=="number"?{top_left:e,top_right:e,bottom_right:e,bottom_left:e}:{top_left:e.top_left||12,top_right:e.top_right||12,bottom_right:e.bottom_right||12,bottom_left:e.bottom_left||12}}};_(m,"LCARdSBorderEditor");let c=m;customElements.get("lcards-border-editor")||customElements.define("lcards-border-editor",c);
//# sourceMappingURL=lcards-border-editor-BDaILdBW.js.map
