var P=Object.defineProperty;var y=($,e)=>P($,"name",{value:e,configurable:true});import{b as r,N as A,l as C,c as D,m as S}from"./lcards-main-C10Twmlb.js";import{i as O}from"./keyed-DhpG-QYX.js";import{a as L}from"./studio-dialog-styles-C5BrIaK5.js";import{e as T}from"./editor-component-styles-ClbUMe1R.js";import{c as B,y as N}from"./lcards-yaml-editor-kz8qT51r.js";import{r as R}from"./lcards-message-BMG6miXA.js";import"./lcards-form-section-DSoN9OMH.js";import"./lcards-grid-layout-gWVap5nj.js";import"./lcards-provenance-tab-DK2bC-ht.js";const I=[{key:"red_alert",label:"Red Alert",icon:"mdi:alert-circle",iconColor:"#cc0000"},{key:"yellow_alert",label:"Yellow Alert",icon:"mdi:alert",iconColor:"#c8a000"},{key:"blue_alert",label:"Blue Alert",icon:"mdi:information",iconColor:"#1a5fb4"},{key:"black_alert",label:"Black Alert",icon:"mdi:ghost",iconColor:"#333333"},{key:"gray_alert",label:"Gray Alert",icon:"mdi:circle-off-outline",iconColor:"#888888"}],E=[{value:"top-left",label:"Top Left"},{value:"top",label:"Top Center"},{value:"top-right",label:"Top Right"},{value:"left",label:"Left"},{value:"center-left",label:"Left Center"},{value:"center",label:"Center"},{value:"right",label:"Right"},{value:"center-right",label:"Right Center"},{value:"bottom-left",label:"Bottom Left"},{value:"bottom",label:"Bottom Center"},{value:"bottom-right",label:"Bottom Right"}],x=y($=>$&&typeof $=="object"?Object.values($).some(x):$!==void 0&&$!==""&&$!==null,"_hasLeaf"),w=class w2 extends L{constructor(){super(),this.cardType="alert-overlay",this._cardPickerDialogRef=null,this._cardEditorDialogRef=null,this._activePickerCondition=null,this._activeEditorCondition=null,this._yamlDebounceTimers={}}setConfig(e){const a=this._stripLegacyKeys(e);super.setConfig(a)}_stripLegacyKeys(e){if(!e||typeof e!="object")return e;const a=["backdrop_effect","backdrop_params"],t={...e};for(const s of a)delete t[s];if("backdrop"in t&&(typeof t.backdrop!="object"||t.backdrop===null)&&delete t.backdrop,t.conditions&&typeof t.conditions=="object"){const s={};for(const[i,o]of Object.entries(t.conditions))if(o&&typeof o=="object"){const l={...o};for(const c of a)delete l[c];"backdrop"in l&&(typeof l.backdrop!="object"||l.backdrop===null)&&delete l.backdrop,s[i]=l}else s[i]=o;t.conditions=s}return t}connectedCallback(){var e;(e=super.connectedCallback)==null||e.call(this),this._boundHandlePickerResult=this._handleCardPickerResult.bind(this),document.addEventListener("lcards-overlay-card-picker-result",this._boundHandlePickerResult)}disconnectedCallback(){var e,a,t;(e=super.disconnectedCallback)==null||e.call(this),this._boundHandlePickerResult&&document.removeEventListener("lcards-overlay-card-picker-result",this._boundHandlePickerResult),(a=this._cardPickerDialogRef)==null||a.remove(),this._cardPickerDialogRef=null,(t=this._cardEditorDialogRef)==null||t.remove(),this._cardEditorDialogRef=null,Object.values(this._yamlDebounceTimers).forEach(clearTimeout)}static get styles(){return[super.styles,T]}_getTabDefinitions(){return[{label:"Config",content:y(()=>this._renderConfigTab(),"content")},{label:"Backdrop",content:y(()=>this._renderBackdropTab(),"content")},{label:"Conditions",content:y(()=>this._renderConditionsTab(),"content")},...this._getUtilityTabs()]}_renderConfigTab(){var l,c,m,h,u;const e=((l=this.config)==null?void 0:l.dismiss_mode)??"dismiss",a=e==="auto-dismiss"||e==="auto-reset",t=((c=this.config)==null?void 0:c.auto_dismiss_seconds)??"",s=((m=this.config)==null?void 0:m.position)??"center",i=((h=this.config)==null?void 0:h.width)??"",o=((u=this.config)==null?void 0:u.height)??"";return r`
            <div class="tab-content-container">

                <lcards-message type="info">
                    Shows an overlay or a band while <code>input_select.lcards_alert_mode</code> is an alert
                    (red, yellow, blue, black or gray). Add one per dashboard view.
                </lcards-message>

                ${this._renderDisplaySection()}

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

                    ${a?r`
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
                        .selector=${{select:{mode:"dropdown",options:E}}}
                        .value=${s}
                        @value-changed=${d=>this._setConfigValue("position",d.detail.value)}>
                    </ha-selector>

                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Width"}
                            .helper=${"CSS width for the content card, e.g. 400px or 50% (of the screen). Blank = 60%"}
                            .selector=${{text:{}}}
                            .value=${i}
                            @value-changed=${d=>this._setConfigValue("width",d.detail.value||void 0)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Height"}
                            .helper=${"CSS height for the content card, e.g. 300px or 40%. Blank = 50% for the alert symbol (auto when a width is set)"}
                            .selector=${{text:{}}}
                            .value=${o}
                            @value-changed=${d=>this._setConfigValue("height",d.detail.value||void 0)}>
                        </ha-selector>
                    </lcards-grid-layout>
                </lcards-form-section>

            </div>
        `}_renderDisplaySection(){var s,i;const e=((s=this.config)==null?void 0:s.display)??"overlay",a=((i=this.config)==null?void 0:i.band)??{},t=y((o,l)=>this._setConfigValue(`band.${o}`,l===""||l===null?void 0:l),"set");return r`
            <lcards-form-section
                header="Display"
                description="A modal overlay, or a band of dashes across the screen that leaves the dashboard usable"
                icon="mdi:alert-rhombus-outline"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Display"}
                    .helper=${e==="band"?"Band: dashes in the alert colour across the screen with the alert symbol in the middle. Clicks reach the dashboard; click the symbol to dismiss.":"Overlay: a backdrop over the dashboard with the alert symbol (or your content card) in the middle."}
                    .selector=${{select:{mode:"dropdown",options:[{value:"overlay",label:"Overlay (backdrop and symbol)"},{value:"band",label:"Band (dashes across the screen)"}]}}}
                    .value=${e}
                    @value-changed=${o=>this._setConfigValue("display",o.detail.value==="overlay"?void 0:o.detail.value)}>
                </ha-selector>

                ${e==="band"?r`
                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Band position"}
                            .helper=${"top, center, bottom, or a percentage of the screen height (e.g. 75%)"}
                            .selector=${{select:{mode:"dropdown",custom_value:true,options:[{value:"top",label:"Top"},{value:"center",label:"Center"},{value:"bottom",label:"Bottom"}]}}}
                            .value=${a.position??"center"}
                            @value-changed=${o=>t("position",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Animation"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"sweep",label:"Sweep (outward from the symbol)"},{value:"flash",label:"Flash (all together)"},{value:"none",label:"None"}]}}}
                            .value=${a.animation??"sweep"}
                            @value-changed=${o=>t("animation",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Sweep direction"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"outward",label:"Outward (from the symbol)"},{value:"inward",label:"Inward (from the edges)"}]}}}
                            .value=${a.direction??"outward"}
                            @value-changed=${o=>t("direction",o.detail.value==="outward"?void 0:o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Speed"}
                            .helper=${"Multiplier: 2 = twice as fast. The symbol bars follow it"}
                            .selector=${{number:{min:.25,max:4,step:.25,mode:"box"}}}
                            .value=${a.speed??1}
                            @value-changed=${o=>t("speed",Number(o.detail.value)&&Number(o.detail.value)!==1?Number(o.detail.value):void 0)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Phase (degrees)"}
                            .helper=${"Lock the band to the symbol bar sweep, this many degrees later. 180 with an outward sweep: one sweep from the symbol out to the edges. Blank = not locked"}
                            .selector=${{number:{min:0,max:360,step:15,mode:"box"}}}
                            .value=${a.phase}
                            @value-changed=${o=>t("phase",o.detail.value===""||o.detail.value===null||o.detail.value===void 0?void 0:Number(o.detail.value))}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Band height"}
                            .helper=${"CSS length, e.g. 48px or 5vh. Blank = 4% of the screen height"}
                            .selector=${{text:{}}}
                            .value=${a.height??""}
                            @value-changed=${o=>t("height",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Symbol size"}
                            .helper=${"Symbol height as a multiple of the band height"}
                            .selector=${{number:{min:1,max:10,step:.5,mode:"box"}}}
                            .value=${a.emblem_scale??4}
                            @value-changed=${o=>t("emblem_scale",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Dash width (px)"}
                            .selector=${{number:{min:1,max:100,step:1,mode:"box"}}}
                            .value=${a.dash_width??8}
                            @value-changed=${o=>t("dash_width",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Dash gap (px)"}
                            .selector=${{number:{min:0,max:100,step:1,mode:"box"}}}
                            .value=${a.dash_gap??12}
                            @value-changed=${o=>t("dash_gap",o.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Dash corner radius (px)"}
                            .helper=${"Capped at half the dash width"}
                            .selector=${{number:{min:0,max:100,step:.5,mode:"box"}}}
                            .value=${typeof a.dash_radius=="number"?a.dash_radius:0}
                            .disabled=${a.dash_radius==="pill"}
                            @value-changed=${o=>t("dash_radius",Number(o.detail.value)>0?Number(o.detail.value):void 0)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Pill ends"}
                            .helper=${"Fully rounded dash ends (overrides the radius)"}
                            .selector=${{boolean:{}}}
                            .value=${a.dash_radius==="pill"}
                            @value-changed=${o=>t("dash_radius",o.detail.value?"pill":void 0)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Grow"}
                            .helper=${"Peak dash height as a multiple of the band height, with the animation. 1 = no growth"}
                            .selector=${{number:{min:1,max:4,step:.1,mode:"box"}}}
                            .value=${a.grow??1}
                            @value-changed=${o=>t("grow",Number(o.detail.value)>1?Number(o.detail.value):void 0)}>
                        </ha-selector>
                    </lcards-grid-layout>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Show the alert symbol"}
                        .helper=${"Without it, only auto-dismiss or the alert mode changing hides the band"}
                        .selector=${{boolean:{}}}
                        .value=${a.emblem??true}
                        @value-changed=${o=>t("emblem",o.detail.value===true?void 0:false)}>
                    </ha-selector>
                    <div style="font-size:12px;font-weight:500;color:var(--secondary-text-color);margin:8px 0 4px;padding:0 2px;">Dash colour (blank = the condition colour)</div>
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${a.color??""}
                        .showPreview=${true}
                        @value-changed=${o=>t("color",o.detail.value||void 0)}>
                    </lcards-color-picker>
                `:""}
            </lcards-form-section>
        `}_renderBackdropTab(){var t,s,i;const e=((t=this.config)==null?void 0:t.layers)??{},a=!!((s=this.config)!=null&&s.backdrop&&!((i=this.config)!=null&&i.layers));return r`
            <div class="tab-content-container">

                <lcards-message type="info">
                    <strong>Global Screen Effect Layers</strong>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                        Configure each effect layer independently. Applied to all alert
                        conditions unless overridden per-condition.
                    </p>
                </lcards-message>

                ${a?r`
                <lcards-message type="warning">
                    This card is using the legacy <code>backdrop:</code> config format. Your settings are still applied correctly.
                    Change any layer option below and save to migrate to the updated format.
                </lcards-message>
                `:""}

                ${this._renderSlotSection({slot:"backdrop",slotLabel:"Backdrop Filter",slotIcon:"mdi:blur",layerCfg:e.backdrop})}
                ${this._renderSlotSection({slot:"color",slotLabel:"Color Overlay",slotIcon:"mdi:palette",layerCfg:e.color})}
                ${this._renderSlotSection({slot:"canvas",slotLabel:"Canvas Effect",slotIcon:"mdi:image-multiple",layerCfg:e.canvas})}

            </div>
        `}_renderConditionsTab(){return r`
            <div class="tab-content-container">

                ${R({header:"How condition overrides work",body:r`
                        <p>Each section below sets what shows while that alert mode is active.</p>
                        <ul>
                            <li><strong>Alert button overrides</strong> change the default alert button's text and colours.</li>
                            <li><strong>Content card</strong> replaces the default with any HA card.</li>
                            <li>Everything else overrides the defaults on the <strong>Config</strong> and <strong>Backdrop</strong> tabs.</li>
                        </ul>
                    `})}

                ${I.map(e=>this._renderConditionSection(e))}

            </div>
        `}_renderConditionSection(e){var b,f,n,g,_;const a=((f=(b=this.config)==null?void 0:b.conditions)==null?void 0:f[e.key])??{},t=!!((n=a.content)!=null&&n.type),s=t?B(a.content):"",i=e.key,o=x(a.alert_button??{}),l=a.layers,c=a.position??"",m=a.width??"",h=a.height??"",u=((g=this.config)==null?void 0:g.dismiss_mode)??"dismiss",d=u==="auto-dismiss"||u==="auto-reset",p=a.auto_dismiss_seconds??"";return r`
            <lcards-form-section
                header="${e.label}"
                description="${t?`Custom content: ${(_=a.content)==null?void 0:_.type}`:a.alert_button?"Default button (with overrides)":"Using built-in default content"}"
                icon="${e.icon}"
                ?expanded=${false}
                ?outlined=${true}>

                <!-- ── Content Card ── -->
                <!-- Hidden when alert_button overrides are active and no custom card is set.
                     In that case a compact mode-switch hint is shown instead. -->
                ${t||!o?r`
                    <lcards-form-section
                        header="Content Card"
                        description="HA card rendered inside the overlay for this condition"
                        icon="mdi:card-multiple-outline"
                        ?expanded=${true}
                        ?outlined=${true}>

                        ${t?r`
                            <div style="display:flex; align-items:center; gap:8px; padding:4px 0 8px;">
                                <ha-icon icon="mdi:card-outline" style="color:var(--primary-color);"></ha-icon>
                                <span style="font-weight:500;">${a.content.type}</span>
                            </div>
                        `:r`
                            <lcards-message
                                type="info"
                                message="No custom card set: the built-in lcards-button default will be used for this condition.">
                            </lcards-message>
                        `}

                        <div style="display:flex; gap:8px; flex-wrap:wrap; padding-bottom:8px;">
                            <ha-button @click=${()=>this._openContentCardPicker(i)}>
                                <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                                ${t?"Change Card Type":"Select Card Type"}
                            </ha-button>
                            ${t?r`
                                <ha-button @click=${()=>this._openContentCardEditor(i)}>
                                    <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                                    Edit Card
                                </ha-button>
                                <ha-button @click=${()=>this._removeConditionContent(i)}>
                                    <ha-icon icon="mdi:close" slot="start"></ha-icon>
                                    Remove
                                </ha-button>
                            `:""}
                        </div>

                        ${t?r`
                            <lcards-message
                                type="info"
                                message="Edit the full card config as YAML below. Use 'Change Card Type' or 'Edit Card' buttons above for a guided editor.">
                            </lcards-message>
                            <ha-code-editor
                                .hass=${this.hass}
                                .value=${s}
                                mode="yaml"
                                @value-changed=${v=>this._handleConditionYamlChange(i,v.detail.value)}>
                            </ha-code-editor>
                        `:""}
                    </lcards-form-section>
                `:r`
                    <!-- Compact mode-switch hint shown when alert_button overrides are active -->
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0 8px; color:var(--secondary-text-color); font-size:0.9em;">
                        <ha-icon icon="mdi:pencil-box-outline" style="flex-shrink:0; color:var(--primary-color);"></ha-icon>
                        <span style="flex:1;">Using default button with overrides (see below). Clear overrides to use a custom card, or:</span>
                        <ha-button @click=${async()=>{this._clearAlertButton(i),await this.updateComplete,this._openContentCardPicker(i)}}>
                            <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                            Switch to Custom Card
                        </ha-button>
                    </div>
                `}

                <!-- ── Default Alert Button Overrides ── -->
                ${t?"":this._renderAlertButtonOverridesSection(i,a)}

                <!-- ── Screen Effect Overrides ── -->
                <lcards-form-section
                    header="Screen Effect Overrides"
                    description="Override individual effect layers for this condition. Unset slots inherit the global default."
                    icon="mdi:blur"
                    ?expanded=${!!l}
                    ?outlined=${true}>

                    ${this._renderSlotSection({slot:"backdrop",slotLabel:"Backdrop Filter",slotIcon:"mdi:blur",condKey:i,condLayersObj:l??null})}
                    ${this._renderSlotSection({slot:"color",slotLabel:"Color Overlay",slotIcon:"mdi:palette",condKey:i,condLayersObj:l??null})}
                    ${this._renderSlotSection({slot:"canvas",slotLabel:"Canvas Effect",slotIcon:"mdi:image-multiple",condKey:i,condLayersObj:l??null})}

                </lcards-form-section>

                <!-- ── Layout Overrides ── -->
                <lcards-form-section
                    header="Layout Overrides"
                    description="Override content position or size for this condition only. Leave blank to use global defaults."
                    icon="mdi:move-resize"
                    ?expanded=${!!(c||m||h||p||a.display)}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Display (override)"}
                        .helper=${"Overlay or band for this condition only"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(Use global default)"},{value:"overlay",label:"Overlay (backdrop and symbol)"},{value:"band",label:"Band (dashes across the screen)"}]}}}
                        .value=${a.display??""}
                        @value-changed=${v=>this._setConditionProp(i,"display",v.detail.value||void 0)}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Position (override)"}
                        .helper=${"Content anchor point override for this condition. Leave unset to use global default"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(Use global default)"},...E]}}}
                        .value=${c}
                        @value-changed=${v=>this._setConditionProp(i,"position",v.detail.value||void 0)}>
                    </ha-selector>

                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Width (override)"}
                            .helper=${"CSS width override, e.g. 400px; blank = global default"}
                            .selector=${{text:{}}}
                            .value=${m}
                            @value-changed=${v=>this._setConditionProp(i,"width",v.detail.value||void 0)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Height (override)"}
                            .helper=${"CSS height override, e.g. 300px; blank = global default"}
                            .selector=${{text:{}}}
                            .value=${h}
                            @value-changed=${v=>this._setConditionProp(i,"height",v.detail.value||void 0)}>
                        </ha-selector>
                    </lcards-grid-layout>

                    ${d?r`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Auto-Dismiss Override (seconds)"}
                            .helper=${"Override the global auto-dismiss timeout for this condition only. Leave blank to use the global value."}
                            .selector=${{number:{min:1,step:1,mode:"box"}}}
                            .value=${p!==""?Number(p):void 0}
                            @value-changed=${v=>this._setConditionProp(i,"auto_dismiss_seconds",v.detail.value?Number(v.detail.value):void 0)}>
                        </ha-selector>
                    `:""}
                </lcards-form-section>

            </lcards-form-section>
        `}_renderAlertButtonOverridesSection(e,a){var d,p,b,f;const t=a.alert_button??{},s=((p=(d=t.text)==null?void 0:d.alert_text)==null?void 0:p.content)??"",i=((f=(b=t.text)==null?void 0:b.sub_text)==null?void 0:f.content)??"",o=/^\{\{states\('([^']+)'\)\}\}$/.test(i),l=o?i.match(/^\{\{states\('([^']+)'\)\}\}$/):null,c=l?l[1]:"",m=o?"entity":"static",h=x(t),u="input_text.lcards_alert_message";return r`
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

                <!-- Bar sweep speed -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Symbol animation speed"}
                    .helper=${"Multiplier for the symbol bar sweep: 2 = twice as fast. Blank = normal (in band mode: the band speed)"}
                    .selector=${{number:{min:.25,max:4,step:.25,mode:"box"}}}
                    .value=${t.speed}
                    @value-changed=${n=>this._setAlertButtonProp(e,"speed",Number(n.detail.value)||void 0)}>
                </ha-selector>

                <!-- Alert label -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Alert Label (alert_text)"}
                    .helper=${"Override the top alert label text. Leave blank to use the built-in default (e.g. ALERT)"}
                    .selector=${{text:{}}}
                    .value=${s}
                    @value-changed=${n=>this._setAlertButtonProp(e,"text.alert_text.content",n.detail.value)}>
                </ha-selector>

                <!-- Sub-text mode toggle -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Sub-text Source"}
                    .helper=${"Choose whether the sub-text is a static string or driven by an entity state"}
                    .selector=${{select:{mode:"list",options:[{value:"static",label:"Static text"},{value:"entity",label:"Entity state"}]}}}
                    .value=${m}
                    @value-changed=${n=>{if(n.detail.value==="entity"){const _=c||u;this._setAlertButtonProp(e,"text.sub_text.content",`{{states('${_}')}}`)}else this._setAlertButtonProp(e,"text.sub_text.content","")}}>
                </ha-selector>

                ${m==="entity"?r`
                    <!-- Entity selector -->
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Sub-text Entity"}
                        .helper=${"Entity whose state is shown as the sub-text message (e.g. input_text.lcards_alert_message)"}
                        .selector=${{entity:{}}}
                        .value=${c||u}
                        @value-changed=${n=>{const g=n.detail.value;g&&this._setAlertButtonProp(e,"text.sub_text.content",`{{states('${g}')}}`)}}>
                    </ha-selector>
                `:r`
                    <!-- Static text input -->
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Sub-text Content"}
                        .helper=${"Override the sub-text message: leave blank to use the built-in default (e.g. CONDITION: RED)"}
                        .selector=${{text:{}}}
                        .value=${o?"":i}
                        @value-changed=${n=>this._setAlertButtonProp(e,"text.sub_text.content",n.detail.value)}>
                    </ha-selector>
                `}

                ${h?r`
                    <ha-button @click=${()=>this._clearAlertButton(e)}>
                        <ha-icon icon="mdi:restore" slot="start"></ha-icon>
                        Clear overrides (use built-in defaults)
                    </ha-button>
                `:""}
            </lcards-form-section>
        `}_setAlertButtonProp(e,a,t){t!==void 0&&t!==""?this._setConfigValue(`conditions.${e}.alert_button.${a}`,t):this._removeConfigPath(`conditions.${e}.alert_button.${a}`)}_clearAlertButton(e){this._removeConfigPath(`conditions.${e}.alert_button`)}_setConditionProp(e,a,t){var i;const s=JSON.parse(JSON.stringify(((i=this.config)==null?void 0:i.conditions)??{}));s[e]=s[e]??{},t==null?delete s[e][a]:s[e][a]=t,Object.keys(s[e]).length===0&&delete s[e],Object.keys(s).length===0?this._updateConfig({conditions:void 0}):this._updateConfig({conditions:s})}_getSlotPresets(e){var a,t;return(((t=(a=window.lcards)==null?void 0:a.screenEffect)==null?void 0:t.catalog())??[]).filter(s=>s.slot===e)}_renderSlotSection({slot:e,slotLabel:a,slotIcon:t,layerCfg:s=void 0,condKey:i=null,condLayersObj:o=null}){var b,f;const l=!!i,c=l&&o!=null&&e in o,m=this._getSlotPresets(e);let h,u;l?c?(b=o[e])!=null&&b.preset?(h=o[e].preset,u=o[e]):(h="__none__",u=null):(h="__inherit__",u=null):(h=(s==null?void 0:s.preset)??"__none__",u=s??null);const d=[...l?[{value:"__inherit__",label:"(Inherit global)"}]:[],{value:"__none__",label:"None (disabled)"},...m.map(n=>({value:n.name,label:n.label??n.name}))],p=m.find(n=>n.name===h);return r`
            <lcards-form-section
                header="${a}"
                icon="${t}"
                ?expanded=${!!p}
                ?outlined=${true}>

                ${O(h,r`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Effect Preset"}
                    .selector=${{select:{mode:"dropdown",options:d}}}
                    .value=${h}
                    @value-changed=${n=>{l?this._setConditionLayerPreset(i,e,n.detail.value):this._setGlobalLayerPreset(e,n.detail.value)}}>
                </ha-selector>
                `)}

                ${(f=p==null?void 0:p.params_schema)!=null&&f.length?r`
                    ${p.params_schema.map(n=>{var g;return this._renderParamField({spec:n,value:u==null?void 0:u[n.key],fallback:((g=p.defaults)==null?void 0:g[n.key])??n.placeholder,onChange:y(_=>l?this._setConditionLayerParam(i,e,n.key,_):this._setGlobalLayerParam(e,n.key,_),"onChange")})})}
                `:""}
            </lcards-form-section>
        `}_renderParamField({spec:e,value:a,fallback:t,onChange:s}){if(e.type==="number"){const o=typeof a=="number"?a:typeof t=="number"?t:e.min??0;return r`
                <ha-selector
                    .hass=${this.hass}
                    .label=${e.label}
                    .helper=${e.helper??""}
                    .selector=${{number:{min:e.min??0,max:e.max??1,step:e.step??.1,mode:"slider"}}}
                    .value=${o}
                    @value-changed=${l=>s(l.detail.value)}>
                </ha-selector>
            `}const i=a!==void 0?String(a):t!==void 0?String(t):"";return e.type==="color-text"?r`
                <div style="margin-bottom:4px;">
                    <div style="font-size:12px;font-weight:500;color:var(--secondary-text-color);margin-bottom:4px;padding:0 2px;">
                        ${e.label}
                    </div>
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${i}
                        .showPreview=${true}
                        @value-changed=${o=>s(o.detail.value||void 0)}>
                    </lcards-color-picker>
                    ${e.helper?r`
                        <div style="font-size:11px;color:var(--secondary-text-color);margin-top:2px;padding:0 2px;">
                            ${e.helper}
                        </div>`:""}
                </div>
            `:r`
            <ha-selector
                .hass=${this.hass}
                .label=${e.label}
                .helper=${e.helper??(e.placeholder?`e.g. ${e.placeholder}`:"")}
                .selector=${{text:{}}}
                .value=${i}
                @value-changed=${o=>s(o.detail.value||void 0)}>
            </ha-selector>
        `}_setGlobalLayerPreset(e,a){const t={...this._getMigratedLayers()};if(a==="__none__")t[e]=null;else{const s=t[e];t[e]=(s==null?void 0:s.preset)===a?s:{preset:a}}this._updateConfig({layers:t,backdrop_effect:void 0,backdrop_params:void 0,backdrop:void 0})}_setGlobalLayerParam(e,a,t){const s={...this._getMigratedLayers()};if(s[e]||(s[e]={}),t!==void 0&&t!=="")s[e]={...s[e],[a]:t};else{const{[a]:i,...o}=s[e];s[e]=o}this._updateConfig({layers:s})}_getMigratedLayers(){var a;if((a=this.config)!=null&&a.layers)return JSON.parse(JSON.stringify(this.config.layers));const e=this.config??{};if(e.backdrop){const t=e.backdrop,s={};if(t.blur&&(s.backdrop={preset:"blur",amount:t.blur}),t.color||t.opacity!==void 0){const i=typeof t.opacity=="number"?t.opacity:.6;s.color={preset:"color-tint",color:this._promotedColor(t.color??"rgba(0,0,0,0.5)",i)}}return s}return{backdrop:{preset:"blur",amount:"8px"}}}_setConditionLayerPreset(e,a,t){var i;const s=JSON.parse(JSON.stringify(((i=this.config)==null?void 0:i.conditions)??{}));if(s[e]=s[e]??{},delete s[e].backdrop,delete s[e].backdrop_effect,delete s[e].backdrop_params,t==="__inherit__")s[e].layers&&(delete s[e].layers[a],Object.keys(s[e].layers).length===0&&delete s[e].layers);else if(t==="__none__")s[e].layers=s[e].layers??{},s[e].layers[a]=null;else{s[e].layers=s[e].layers??{};const o=s[e].layers[a];s[e].layers[a]=(o==null?void 0:o.preset)===t?o:{preset:t}}Object.keys(s[e]).length===0&&delete s[e],this._updateConfig({conditions:Object.keys(s).length?s:void 0})}_setConditionLayerParam(e,a,t,s){var o;const i=JSON.parse(JSON.stringify(((o=this.config)==null?void 0:o.conditions)??{}));i[e]=i[e]??{},i[e].layers=i[e].layers??{},i[e].layers[a]=i[e].layers[a]??{},s!==void 0&&s!==""?i[e].layers[a][t]=s:delete i[e].layers[a][t],this._updateConfig({conditions:i})}_promotedColor(e,a){const t=A(e);return t?`rgba(${t.r},${t.g},${t.b},${Math.min(1,t.a*a).toFixed(2)})`:e}_removeConditionContent(e){this._setConditionProp(e,"content",void 0)}_handleConditionYamlChange(e,a){clearTimeout(this._yamlDebounceTimers[e]),this._yamlDebounceTimers[e]=setTimeout(()=>{try{const t=N(a);t&&typeof t=="object"&&t.type&&this._setConditionProp(e,"content",t)}catch{}},750)}async _openContentCardPicker(e){var s,i;if(!customElements.get("hui-card-picker")){C.warn('[AlertOverlayEditor] hui-card-picker not loaded yet. Click "Add Card" on the dashboard once to prime it, then try again.'),D({title:"Card picker not ready",message:"Home Assistant hasn’t loaded its card picker yet. On any dashboard, click “Add card” once (you can cancel it), then come back and try again."});return}(s=this._cardPickerDialogRef)==null||s.remove(),this._cardPickerDialogRef=null,this._activePickerCondition=e;const a=document.createElement("ha-dialog");a.headerTitle="Select Content Card Type",this._cardPickerDialogRef=a,S(a,this),a.open=true,await a.updateComplete;const t=document.createElement("hui-card-picker");t.hass=this.hass,t.lovelace=this._getContentCardLovelace(),t.style.cssText="padding:24px; display:block;",a.appendChild(t),await new Promise(o=>setTimeout(o,100)),(i=t.requestUpdate)==null||i.call(t),t.updateComplete&&await t.updateComplete,t.addEventListener("config-changed",o=>{var c;const l=(c=o.detail)==null?void 0:c.config;C.debug("[AlertOverlayEditor] Content card type selected:",l==null?void 0:l.type),document.dispatchEvent(new CustomEvent("lcards-overlay-card-picker-result",{detail:{condKey:e,config:l}})),a.open=false}),a.addEventListener("closed",()=>{a.remove(),this._cardPickerDialogRef===a&&(this._cardPickerDialogRef=null)})}_handleCardPickerResult(e){const{condKey:a,config:t}=e.detail??{};t&&(C.debug("[AlertOverlayEditor] Applying content card config from picker:",t.type),this._setConditionProp(a,"content",t))}async _openContentCardEditor(e){var h,u,d,p;const a=(d=(u=(h=this.config)==null?void 0:h.conditions)==null?void 0:u[e])==null?void 0:d.content;if(!(a!=null&&a.type))return;if(!customElements.get("hui-card-element-editor")){C.warn("[AlertOverlayEditor] hui-card-element-editor not available yet");return}(p=this._cardEditorDialogRef)==null||p.remove(),this._cardEditorDialogRef=null,this._activeEditorCondition=e;const t=document.createElement("ha-dialog");t.headerTitle=`Edit: ${a.type}`,t.setAttribute("prevent-scrim-close",""),this._cardEditorDialogRef=t;const s=document.createElement("div");s.style.cssText="padding:16px; min-height:300px; min-width:420px; box-sizing:border-box;";const i=document.createElement("hui-card-element-editor");i.hass=this.hass,i.lovelace=this._getContentCardLovelace(),i.value=JSON.parse(JSON.stringify(a));let o=JSON.parse(JSON.stringify(a));i.addEventListener("config-changed",b=>{var f,n;(n=(f=b.detail)==null?void 0:f.config)!=null&&n.type&&(o=b.detail.config)}),i.addEventListener("value-changed",b=>{var f,n;(n=(f=b.detail)==null?void 0:f.value)!=null&&n.type&&(o=b.detail.value)}),s.appendChild(i),t.appendChild(s);const l=document.createElement("div");l.slot="footer",l.style.cssText="display:flex; gap:8px;";const c=document.createElement("ha-button");c.textContent="Cancel",c.addEventListener("click",()=>{t.open=false});const m=document.createElement("ha-button");m.textContent="Save",m.addEventListener("click",()=>{o!=null&&o.type&&(this._setConditionProp(e,"content",JSON.parse(JSON.stringify(o))),C.debug("[AlertOverlayEditor] Content card saved from editor:",o.type)),t.open=false}),l.appendChild(c),l.appendChild(m),t.appendChild(l),t.addEventListener("closed",()=>{t.remove(),this._cardEditorDialogRef===t&&(this._cardEditorDialogRef=null)}),S(t,this),t.open=true}_getContentCardLovelace(){var a;let e=((a=this.lovelace)==null?void 0:a.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}};y(w,"LCARdSAlertOverlayEditor");let k=w;customElements.get("lcards-alert-overlay-editor")||customElements.define("lcards-alert-overlay-editor",k);export{k as LCARdSAlertOverlayEditor};
//# sourceMappingURL=lcards-alert-overlay-editor-fk13l7wE.js.map
