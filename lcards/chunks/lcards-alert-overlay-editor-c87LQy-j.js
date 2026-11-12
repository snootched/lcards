var P=Object.defineProperty;var $=(_,e)=>P(_,"name",{value:e,configurable:true});import{b as l,J as A,l as C,m as E}from"./lcards-main-OH3P_lk4.js";import{i as L}from"./keyed-Dhbj4cCs.js";import{a as O}from"./studio-dialog-styles-CwIh7T_l.js";import{e as T}from"./editor-component-styles-CtzGOL8B.js";import{c as D,y as R}from"./lcards-yaml-editor-BhWzVC3x.js";import{r as B}from"./lcards-message-DltBJ-tU.js";import"./lcards-form-section-CBBDqzr-.js";import"./lcards-grid-layout-6SBvDoVT.js";import"./lcards-provenance-tab-BSJEQ-B3.js";const N=[{key:"red_alert",label:"Red Alert",icon:"mdi:alert-circle",iconColor:"#cc0000"},{key:"yellow_alert",label:"Yellow Alert",icon:"mdi:alert",iconColor:"#c8a000"},{key:"blue_alert",label:"Blue Alert",icon:"mdi:information",iconColor:"#1a5fb4"},{key:"black_alert",label:"Black Alert",icon:"mdi:ghost",iconColor:"#333333"},{key:"gray_alert",label:"Gray Alert",icon:"mdi:circle-off-outline",iconColor:"#888888"}],S=[{value:"top-left",label:"Top Left"},{value:"top",label:"Top Center"},{value:"top-right",label:"Top Right"},{value:"left",label:"Left"},{value:"center-left",label:"Left Center"},{value:"center",label:"Center"},{value:"right",label:"Right"},{value:"center-right",label:"Right Center"},{value:"bottom-left",label:"Bottom Left"},{value:"bottom",label:"Bottom Center"},{value:"bottom-right",label:"Bottom Right"}],k=$(_=>_&&typeof _=="object"?Object.values(_).some(k):_!==void 0&&_!==""&&_!==null,"_hasLeaf"),w=class w2 extends O{constructor(){super(),this.cardType="alert-overlay",this._cardPickerDialogRef=null,this._cardEditorDialogRef=null,this._activePickerCondition=null,this._activeEditorCondition=null,this._yamlDebounceTimers={}}setConfig(e){const o=this._stripLegacyKeys(e);super.setConfig(o)}_stripLegacyKeys(e){if(!e||typeof e!="object")return e;const o=["backdrop_effect","backdrop_params"],t={...e};for(const i of o)delete t[i];if("backdrop"in t&&(typeof t.backdrop!="object"||t.backdrop===null)&&delete t.backdrop,t.conditions&&typeof t.conditions=="object"){const i={};for(const[a,s]of Object.entries(t.conditions))if(s&&typeof s=="object"){const n={...s};for(const c of o)delete n[c];"backdrop"in n&&(typeof n.backdrop!="object"||n.backdrop===null)&&delete n.backdrop,i[a]=n}else i[a]=s;t.conditions=i}return t}connectedCallback(){var e;(e=super.connectedCallback)==null||e.call(this),this._boundHandlePickerResult=this._handleCardPickerResult.bind(this),document.addEventListener("lcards-overlay-card-picker-result",this._boundHandlePickerResult)}disconnectedCallback(){var e,o,t;(e=super.disconnectedCallback)==null||e.call(this),this._boundHandlePickerResult&&document.removeEventListener("lcards-overlay-card-picker-result",this._boundHandlePickerResult),(o=this._cardPickerDialogRef)==null||o.remove(),this._cardPickerDialogRef=null,(t=this._cardEditorDialogRef)==null||t.remove(),this._cardEditorDialogRef=null,Object.values(this._yamlDebounceTimers).forEach(clearTimeout)}static get styles(){return[super.styles,T]}_getTabDefinitions(){return[{label:"Config",content:$(()=>this._renderConfigTab(),"content")},{label:"Backdrop",content:$(()=>this._renderBackdropTab(),"content")},{label:"Conditions",content:$(()=>this._renderConditionsTab(),"content")},...this._getUtilityTabs()]}_renderConfigTab(){var n,c,m,h,u;const e=((n=this.config)==null?void 0:n.dismiss_mode)??"dismiss",o=e==="auto-dismiss"||e==="auto-reset",t=((c=this.config)==null?void 0:c.auto_dismiss_seconds)??"",i=((m=this.config)==null?void 0:m.position)??"center",a=((h=this.config)==null?void 0:h.width)??"",s=((u=this.config)==null?void 0:u.height)??"";return l`
            <div class="tab-content-container">

                <lcards-message type="info">
                    Shows a full-screen backdrop and alert card while <code>input_select.lcards_alert_mode</code>
                    is an alert (red, yellow, blue, black or gray). Add one per dashboard view.
                </lcards-message>

                <!-- Dismiss Behaviour -->
                <lcards-form-section
                    header="Dismiss Behaviour"
                    description="What happens when the user clicks the backdrop"
                    icon="mdi:close-circle-outline"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Dismiss Mode"}
                        .helper=${{dismiss:"Dismiss: hides the overlay only; the input_select is not changed",reset:"Reset: hides the overlay AND sets input_select back to green_alert","auto-dismiss":"Auto-Dismiss: overlay hides automatically after the configured timeout","auto-reset":"Auto-Reset: overlay hides automatically AND resets alert_mode after the configured timeout"}[e]??""}
                        .selector=${{select:{mode:"dropdown",options:[{value:"dismiss",label:"Dismiss (hide overlay only)"},{value:"reset",label:"Reset (hide + set alert_mode to green_alert)"},{value:"auto-dismiss",label:"Auto-Dismiss (hide after timeout)"},{value:"auto-reset",label:"Auto-Reset (hide + reset alert_mode after timeout)"}]}}}
                        .value=${e}
                        @value-changed=${d=>this._setConfigValue("dismiss_mode",d.detail.value)}>
                    </ha-selector>

                    ${o?l`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Auto-Dismiss After (seconds)"}
                            .helper=${"Overlay will dismiss automatically after this many seconds. Individual conditions can override this value in the Conditions tab."}
                            .selector=${{number:{min:1,step:1,mode:"box"}}}
                            .value=${t!==""?Number(t):void 0}
                            @value-changed=${d=>this._setConfigValue("auto_dismiss_seconds",d.detail.value?Number(d.detail.value):void 0)}>
                        </ha-selector>
                    `:""}
                </lcards-form-section>

                <!-- Global Position & Size (defaults, overridable per condition) -->
                <lcards-form-section
                    header="Default Content Position & Size"
                    description="Where the content card appears inside the overlay. Can be overridden per condition in the Conditions tab."
                    icon="mdi:move-resize"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Position"}
                        .helper=${"Anchor point for the content card within the overlay"}
                        .selector=${{select:{mode:"dropdown",options:S}}}
                        .value=${i}
                        @value-changed=${d=>this._setConfigValue("position",d.detail.value)}>
                    </ha-selector>

                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Width"}
                            .helper=${"CSS width for the content card (e.g. 400px, 50%, auto)"}
                            .selector=${{text:{}}}
                            .value=${a}
                            @value-changed=${d=>this._setConfigValue("width",d.detail.value||void 0)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Height"}
                            .helper=${"CSS height for the content card (e.g. 300px, auto)"}
                            .selector=${{text:{}}}
                            .value=${s}
                            @value-changed=${d=>this._setConfigValue("height",d.detail.value||void 0)}>
                        </ha-selector>
                    </lcards-grid-layout>
                </lcards-form-section>

            </div>
        `}_renderBackdropTab(){var t,i,a;const e=((t=this.config)==null?void 0:t.layers)??{},o=!!((i=this.config)!=null&&i.backdrop&&!((a=this.config)!=null&&a.layers));return l`
            <div class="tab-content-container">

                <lcards-message type="info">
                    <strong>Global Screen Effect Layers</strong>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                        Configure each effect layer independently. Applied to all alert
                        conditions unless overridden per-condition.
                    </p>
                </lcards-message>

                ${o?l`
                <lcards-message type="warning">
                    This card is using the legacy <code>backdrop:</code> config format. Your settings are still applied correctly.
                    Change any layer option below and save to migrate to the updated format.
                </lcards-message>
                `:""}

                ${this._renderSlotSection({slot:"backdrop",slotLabel:"Backdrop Filter",slotIcon:"mdi:blur",layerCfg:e.backdrop})}
                ${this._renderSlotSection({slot:"color",slotLabel:"Color Overlay",slotIcon:"mdi:palette",layerCfg:e.color})}
                ${this._renderSlotSection({slot:"canvas",slotLabel:"Canvas Effect",slotIcon:"mdi:image-multiple",layerCfg:e.canvas})}

            </div>
        `}_renderConditionsTab(){return l`
            <div class="tab-content-container">

                ${B({header:"How condition overrides work",body:l`
                        <p>Each section below sets what shows while that alert mode is active.</p>
                        <ul>
                            <li><strong>Alert button overrides</strong> change the default alert button's text and colours.</li>
                            <li><strong>Content card</strong> replaces the default with any HA card.</li>
                            <li>Everything else overrides the defaults on the <strong>Config</strong> and <strong>Backdrop</strong> tabs.</li>
                        </ul>
                    `})}

                ${N.map(e=>this._renderConditionSection(e))}

            </div>
        `}_renderConditionSection(e){var f,b,r,v,y;const o=((b=(f=this.config)==null?void 0:f.conditions)==null?void 0:b[e.key])??{},t=!!((r=o.content)!=null&&r.type),i=t?D(o.content):"",a=e.key,s=k(o.alert_button??{}),n=o.layers,c=o.position??"",m=o.width??"",h=o.height??"",u=((v=this.config)==null?void 0:v.dismiss_mode)??"dismiss",d=u==="auto-dismiss"||u==="auto-reset",p=o.auto_dismiss_seconds??"";return l`
            <lcards-form-section
                header="${e.label}"
                description="${t?`Custom content: ${(y=o.content)==null?void 0:y.type}`:o.alert_button?"Default button (with overrides)":"Using built-in default content"}"
                icon="${e.icon}"
                ?expanded=${false}
                ?outlined=${true}>

                <!-- ── Content Card ── -->
                <!-- Hidden when alert_button overrides are active and no custom card is set.
                     In that case a compact mode-switch hint is shown instead. -->
                ${t||!s?l`
                    <lcards-form-section
                        header="Content Card"
                        description="HA card rendered inside the overlay for this condition"
                        icon="mdi:card-multiple-outline"
                        ?expanded=${true}
                        ?outlined=${true}>

                        ${t?l`
                            <div style="display:flex; align-items:center; gap:8px; padding:4px 0 8px;">
                                <ha-icon icon="mdi:card-outline" style="color:var(--primary-color);"></ha-icon>
                                <span style="font-weight:500;">${o.content.type}</span>
                            </div>
                        `:l`
                            <lcards-message
                                type="info"
                                message="No custom card set: the built-in lcards-button default will be used for this condition.">
                            </lcards-message>
                        `}

                        <div style="display:flex; gap:8px; flex-wrap:wrap; padding-bottom:8px;">
                            <ha-button @click=${()=>this._openContentCardPicker(a)}>
                                <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                                ${t?"Change Card Type":"Select Card Type"}
                            </ha-button>
                            ${t?l`
                                <ha-button @click=${()=>this._openContentCardEditor(a)}>
                                    <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                                    Edit Card
                                </ha-button>
                                <ha-button @click=${()=>this._removeConditionContent(a)}>
                                    <ha-icon icon="mdi:close" slot="start"></ha-icon>
                                    Remove
                                </ha-button>
                            `:""}
                        </div>

                        ${t?l`
                            <lcards-message
                                type="info"
                                message="Edit the full card config as YAML below. Use 'Change Card Type' or 'Edit Card' buttons above for a guided editor.">
                            </lcards-message>
                            <ha-code-editor
                                .hass=${this.hass}
                                .value=${i}
                                mode="yaml"
                                @value-changed=${g=>this._handleConditionYamlChange(a,g.detail.value)}>
                            </ha-code-editor>
                        `:""}
                    </lcards-form-section>
                `:l`
                    <!-- Compact mode-switch hint shown when alert_button overrides are active -->
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0 8px; color:var(--secondary-text-color); font-size:0.9em;">
                        <ha-icon icon="mdi:pencil-box-outline" style="flex-shrink:0; color:var(--primary-color);"></ha-icon>
                        <span style="flex:1;">Using default button with overrides (see below). Clear overrides to use a custom card, or:</span>
                        <ha-button @click=${async()=>{this._clearAlertButton(a),await this.updateComplete,this._openContentCardPicker(a)}}>
                            <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                            Switch to Custom Card
                        </ha-button>
                    </div>
                `}

                <!-- ── Default Alert Button Overrides ── -->
                ${t?"":this._renderAlertButtonOverridesSection(a,o)}

                <!-- ── Screen Effect Overrides ── -->
                <lcards-form-section
                    header="Screen Effect Overrides"
                    description="Override individual effect layers for this condition. Unset slots inherit the global default."
                    icon="mdi:blur"
                    ?expanded=${!!n}
                    ?outlined=${true}>

                    ${this._renderSlotSection({slot:"backdrop",slotLabel:"Backdrop Filter",slotIcon:"mdi:blur",condKey:a,condLayersObj:n??null})}
                    ${this._renderSlotSection({slot:"color",slotLabel:"Color Overlay",slotIcon:"mdi:palette",condKey:a,condLayersObj:n??null})}
                    ${this._renderSlotSection({slot:"canvas",slotLabel:"Canvas Effect",slotIcon:"mdi:image-multiple",condKey:a,condLayersObj:n??null})}

                </lcards-form-section>

                <!-- ── Layout Overrides ── -->
                <lcards-form-section
                    header="Layout Overrides"
                    description="Override content position or size for this condition only. Leave blank to use global defaults."
                    icon="mdi:move-resize"
                    ?expanded=${!!(c||m||h||p)}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Position (override)"}
                        .helper=${"Content anchor point override for this condition. Leave unset to use global default"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(Use global default)"},...S]}}}
                        .value=${c}
                        @value-changed=${g=>this._setConditionProp(a,"position",g.detail.value||void 0)}>
                    </ha-selector>

                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Width (override)"}
                            .helper=${"CSS width override, e.g. 400px; blank = global default"}
                            .selector=${{text:{}}}
                            .value=${m}
                            @value-changed=${g=>this._setConditionProp(a,"width",g.detail.value||void 0)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Height (override)"}
                            .helper=${"CSS height override, e.g. 300px; blank = global default"}
                            .selector=${{text:{}}}
                            .value=${h}
                            @value-changed=${g=>this._setConditionProp(a,"height",g.detail.value||void 0)}>
                        </ha-selector>
                    </lcards-grid-layout>

                    ${d?l`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Auto-Dismiss Override (seconds)"}
                            .helper=${"Override the global auto-dismiss timeout for this condition only. Leave blank to use the global value."}
                            .selector=${{number:{min:1,step:1,mode:"box"}}}
                            .value=${p!==""?Number(p):void 0}
                            @value-changed=${g=>this._setConditionProp(a,"auto_dismiss_seconds",g.detail.value?Number(g.detail.value):void 0)}>
                        </ha-selector>
                    `:""}
                </lcards-form-section>

            </lcards-form-section>
        `}_renderAlertButtonOverridesSection(e,o){var d,p,f,b;const t=o.alert_button??{},i=((p=(d=t.text)==null?void 0:d.alert_text)==null?void 0:p.content)??"",a=((b=(f=t.text)==null?void 0:f.sub_text)==null?void 0:b.content)??"",s=/^\{\{states\('([^']+)'\)\}\}$/.test(a),n=s?a.match(/^\{\{states\('([^']+)'\)\}\}$/):null,c=n?n[1]:"",m=s?"entity":"static",h=k(t),u="input_text.lcards_alert_message";return l`
            <lcards-form-section
                header="Default Alert Button Overrides"
                description="Patch the built-in alert button text and colours without replacing the full card"
                icon="mdi:pencil-box-outline"
                ?expanded=${h}
                ?outlined=${true}>

                <lcards-message
                    type="info"
                    message="Set only what you want to change; the rest comes from the default alert button. No effect when a Content Card is set above.">
                </lcards-message>

                <!-- Alert label -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Alert Label (alert_text)"}
                    .helper=${"Override the top alert label text. Leave blank to use the built-in default (e.g. ALERT)"}
                    .selector=${{text:{}}}
                    .value=${i}
                    @value-changed=${r=>this._setAlertButtonProp(e,"text.alert_text.content",r.detail.value)}>
                </ha-selector>

                <!-- Sub-text mode toggle -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Sub-text Source"}
                    .helper=${"Choose whether the sub-text is a static string or driven by an entity state"}
                    .selector=${{select:{mode:"list",options:[{value:"static",label:"Static text"},{value:"entity",label:"Entity state"}]}}}
                    .value=${m}
                    @value-changed=${r=>{if(r.detail.value==="entity"){const y=c||u;this._setAlertButtonProp(e,"text.sub_text.content",`{{states('${y}')}}`)}else this._setAlertButtonProp(e,"text.sub_text.content","")}}>
                </ha-selector>

                ${m==="entity"?l`
                    <!-- Entity selector -->
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Sub-text Entity"}
                        .helper=${"Entity whose state is shown as the sub-text message (e.g. input_text.lcards_alert_message)"}
                        .selector=${{entity:{}}}
                        .value=${c||u}
                        @value-changed=${r=>{const v=r.detail.value;v&&this._setAlertButtonProp(e,"text.sub_text.content",`{{states('${v}')}}`)}}>
                    </ha-selector>
                `:l`
                    <!-- Static text input -->
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Sub-text Content"}
                        .helper=${"Override the sub-text message: leave blank to use the built-in default (e.g. CONDITION: RED)"}
                        .selector=${{text:{}}}
                        .value=${s?"":a}
                        @value-changed=${r=>this._setAlertButtonProp(e,"text.sub_text.content",r.detail.value)}>
                    </ha-selector>
                `}

                ${h?l`
                    <ha-button @click=${()=>this._clearAlertButton(e)}>
                        <ha-icon icon="mdi:restore" slot="start"></ha-icon>
                        Clear overrides (use built-in defaults)
                    </ha-button>
                `:""}
            </lcards-form-section>
        `}_setAlertButtonProp(e,o,t){t!==void 0&&t!==""?this._setConfigValue(`conditions.${e}.alert_button.${o}`,t):this._removeConfigPath(`conditions.${e}.alert_button.${o}`)}_clearAlertButton(e){this._removeConfigPath(`conditions.${e}.alert_button`)}_setConditionProp(e,o,t){var a;const i=JSON.parse(JSON.stringify(((a=this.config)==null?void 0:a.conditions)??{}));i[e]=i[e]??{},t==null?delete i[e][o]:i[e][o]=t,Object.keys(i[e]).length===0&&delete i[e],Object.keys(i).length===0?this._updateConfig({conditions:void 0}):this._updateConfig({conditions:i})}_getSlotPresets(e){var o,t;return(((t=(o=window.lcards)==null?void 0:o.screenEffect)==null?void 0:t.catalog())??[]).filter(i=>i.slot===e)}_renderSlotSection({slot:e,slotLabel:o,slotIcon:t,layerCfg:i=void 0,condKey:a=null,condLayersObj:s=null}){var f,b;const n=!!a,c=n&&s!=null&&e in s,m=this._getSlotPresets(e);let h,u;n?c?(f=s[e])!=null&&f.preset?(h=s[e].preset,u=s[e]):(h="__none__",u=null):(h="__inherit__",u=null):(h=(i==null?void 0:i.preset)??"__none__",u=i??null);const d=[...n?[{value:"__inherit__",label:"(Inherit global)"}]:[],{value:"__none__",label:"None (disabled)"},...m.map(r=>({value:r.name,label:r.label??r.name}))],p=m.find(r=>r.name===h);return l`
            <lcards-form-section
                header="${o}"
                icon="${t}"
                ?expanded=${!!p}
                ?outlined=${true}>

                ${L(h,l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Effect Preset"}
                    .selector=${{select:{mode:"dropdown",options:d}}}
                    .value=${h}
                    @value-changed=${r=>{n?this._setConditionLayerPreset(a,e,r.detail.value):this._setGlobalLayerPreset(e,r.detail.value)}}>
                </ha-selector>
                `)}

                ${(b=p==null?void 0:p.params_schema)!=null&&b.length?l`
                    ${p.params_schema.map(r=>{var v;return this._renderParamField({spec:r,value:u==null?void 0:u[r.key],fallback:((v=p.defaults)==null?void 0:v[r.key])??r.placeholder,onChange:$(y=>n?this._setConditionLayerParam(a,e,r.key,y):this._setGlobalLayerParam(e,r.key,y),"onChange")})})}
                `:""}
            </lcards-form-section>
        `}_renderParamField({spec:e,value:o,fallback:t,onChange:i}){if(e.type==="number"){const s=typeof o=="number"?o:typeof t=="number"?t:e.min??0;return l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${e.label}
                    .helper=${e.helper??""}
                    .selector=${{number:{min:e.min??0,max:e.max??1,step:e.step??.1,mode:"slider"}}}
                    .value=${s}
                    @value-changed=${n=>i(n.detail.value)}>
                </ha-selector>
            `}const a=o!==void 0?String(o):t!==void 0?String(t):"";return e.type==="color-text"?l`
                <div style="margin-bottom:4px;">
                    <div style="font-size:12px;font-weight:500;color:var(--secondary-text-color);margin-bottom:4px;padding:0 2px;">
                        ${e.label}
                    </div>
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${a}
                        .showPreview=${true}
                        @value-changed=${s=>i(s.detail.value||void 0)}>
                    </lcards-color-picker>
                    ${e.helper?l`
                        <div style="font-size:11px;color:var(--secondary-text-color);margin-top:2px;padding:0 2px;">
                            ${e.helper}
                        </div>`:""}
                </div>
            `:l`
            <ha-selector
                .hass=${this.hass}
                .label=${e.label}
                .helper=${e.helper??(e.placeholder?`e.g. ${e.placeholder}`:"")}
                .selector=${{text:{}}}
                .value=${a}
                @value-changed=${s=>i(s.detail.value||void 0)}>
            </ha-selector>
        `}_setGlobalLayerPreset(e,o){const t={...this._getMigratedLayers()};if(o==="__none__")t[e]=null;else{const i=t[e];t[e]=(i==null?void 0:i.preset)===o?i:{preset:o}}this._updateConfig({layers:t,backdrop_effect:void 0,backdrop_params:void 0,backdrop:void 0})}_setGlobalLayerParam(e,o,t){const i={...this._getMigratedLayers()};if(i[e]||(i[e]={}),t!==void 0&&t!=="")i[e]={...i[e],[o]:t};else{const{[o]:a,...s}=i[e];i[e]=s}this._updateConfig({layers:i})}_getMigratedLayers(){var o;if((o=this.config)!=null&&o.layers)return JSON.parse(JSON.stringify(this.config.layers));const e=this.config??{};if(e.backdrop){const t=e.backdrop,i={};if(t.blur&&(i.backdrop={preset:"blur",amount:t.blur}),t.color||t.opacity!==void 0){const a=typeof t.opacity=="number"?t.opacity:.6;i.color={preset:"color-tint",color:this._promotedColor(t.color??"rgba(0,0,0,0.5)",a)}}return i}return{backdrop:{preset:"blur",amount:"8px"}}}_setConditionLayerPreset(e,o,t){var a;const i=JSON.parse(JSON.stringify(((a=this.config)==null?void 0:a.conditions)??{}));if(i[e]=i[e]??{},delete i[e].backdrop,delete i[e].backdrop_effect,delete i[e].backdrop_params,t==="__inherit__")i[e].layers&&(delete i[e].layers[o],Object.keys(i[e].layers).length===0&&delete i[e].layers);else if(t==="__none__")i[e].layers=i[e].layers??{},i[e].layers[o]=null;else{i[e].layers=i[e].layers??{};const s=i[e].layers[o];i[e].layers[o]=(s==null?void 0:s.preset)===t?s:{preset:t}}Object.keys(i[e]).length===0&&delete i[e],this._updateConfig({conditions:Object.keys(i).length?i:void 0})}_setConditionLayerParam(e,o,t,i){var s;const a=JSON.parse(JSON.stringify(((s=this.config)==null?void 0:s.conditions)??{}));a[e]=a[e]??{},a[e].layers=a[e].layers??{},a[e].layers[o]=a[e].layers[o]??{},i!==void 0&&i!==""?a[e].layers[o][t]=i:delete a[e].layers[o][t],this._updateConfig({conditions:a})}_promotedColor(e,o){const t=A(e);return t?`rgba(${t.r},${t.g},${t.b},${Math.min(1,t.a*o).toFixed(2)})`:e}_removeConditionContent(e){this._setConditionProp(e,"content",void 0)}_handleConditionYamlChange(e,o){clearTimeout(this._yamlDebounceTimers[e]),this._yamlDebounceTimers[e]=setTimeout(()=>{try{const t=R(o);t&&typeof t=="object"&&t.type&&this._setConditionProp(e,"content",t)}catch{}},750)}async _openContentCardPicker(e){var i,a;if(!customElements.get("hui-card-picker")){C.warn('[AlertOverlayEditor] hui-card-picker not loaded yet. Click "Add Card" on the dashboard once to prime it, then try again.');try{const s=document.querySelector("home-assistant");s!=null&&s.showToast&&s.showToast({message:'Card picker loading: click "Add Card" once on any dashboard view to enable it, then try again.',duration:4e3})}catch{}return}(i=this._cardPickerDialogRef)==null||i.remove(),this._cardPickerDialogRef=null,this._activePickerCondition=e;const o=document.createElement("ha-dialog");o.headerTitle="Select Content Card Type",this._cardPickerDialogRef=o,E(o,this),o.open=true,await o.updateComplete;const t=document.createElement("hui-card-picker");t.hass=this.hass,t.lovelace=this._getContentCardLovelace(),t.style.cssText="padding:24px; display:block;",o.appendChild(t),await new Promise(s=>setTimeout(s,100)),(a=t.requestUpdate)==null||a.call(t),t.updateComplete&&await t.updateComplete,t.addEventListener("config-changed",s=>{var c;const n=(c=s.detail)==null?void 0:c.config;C.debug("[AlertOverlayEditor] Content card type selected:",n==null?void 0:n.type),document.dispatchEvent(new CustomEvent("lcards-overlay-card-picker-result",{detail:{condKey:e,config:n}})),o.open=false}),o.addEventListener("closed",()=>{o.remove(),this._cardPickerDialogRef===o&&(this._cardPickerDialogRef=null)})}_handleCardPickerResult(e){const{condKey:o,config:t}=e.detail??{};t&&(C.debug("[AlertOverlayEditor] Applying content card config from picker:",t.type),this._setConditionProp(o,"content",t))}async _openContentCardEditor(e){var h,u,d,p;const o=(d=(u=(h=this.config)==null?void 0:h.conditions)==null?void 0:u[e])==null?void 0:d.content;if(!(o!=null&&o.type))return;if(!customElements.get("hui-card-element-editor")){C.warn("[AlertOverlayEditor] hui-card-element-editor not available yet");return}(p=this._cardEditorDialogRef)==null||p.remove(),this._cardEditorDialogRef=null,this._activeEditorCondition=e;const t=document.createElement("ha-dialog");t.headerTitle=`Edit: ${o.type}`,t.setAttribute("prevent-scrim-close",""),this._cardEditorDialogRef=t;const i=document.createElement("div");i.style.cssText="padding:16px; min-height:300px; min-width:420px; box-sizing:border-box;";const a=document.createElement("hui-card-element-editor");a.hass=this.hass,a.lovelace=this._getContentCardLovelace(),a.value=JSON.parse(JSON.stringify(o));let s=JSON.parse(JSON.stringify(o));a.addEventListener("config-changed",f=>{var b,r;(r=(b=f.detail)==null?void 0:b.config)!=null&&r.type&&(s=f.detail.config)}),a.addEventListener("value-changed",f=>{var b,r;(r=(b=f.detail)==null?void 0:b.value)!=null&&r.type&&(s=f.detail.value)}),i.appendChild(a),t.appendChild(i);const n=document.createElement("div");n.slot="footer",n.style.cssText="display:flex; gap:8px;";const c=document.createElement("ha-button");c.textContent="Cancel",c.addEventListener("click",()=>{t.open=false});const m=document.createElement("ha-button");m.textContent="Save",m.addEventListener("click",()=>{s!=null&&s.type&&(this._setConditionProp(e,"content",JSON.parse(JSON.stringify(s))),C.debug("[AlertOverlayEditor] Content card saved from editor:",s.type)),t.open=false}),n.appendChild(c),n.appendChild(m),t.appendChild(n),t.addEventListener("closed",()=>{t.remove(),this._cardEditorDialogRef===t&&(this._cardEditorDialogRef=null)}),E(t,this),t.open=true}_getContentCardLovelace(){var o;let e=((o=this.lovelace)==null?void 0:o.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}};$(w,"LCARdSAlertOverlayEditor");let x=w;customElements.get("lcards-alert-overlay-editor")||customElements.define("lcards-alert-overlay-editor",x);export{x as LCARdSAlertOverlayEditor};
//# sourceMappingURL=lcards-alert-overlay-editor-c87LQy-j.js.map
