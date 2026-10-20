var be=Object.defineProperty;var k=(G,e)=>be(G,"name",{value:e,configurable:true});import{l as J,c as $e,m as ge,b as h,g as ve,w as B}from"./lcards-main-C10Twmlb.js";import{a as _e}from"./studio-dialog-styles-C5BrIaK5.js";import{e as xe}from"./editor-component-styles-ClbUMe1R.js";import{c as ae,y as ye}from"./lcards-yaml-editor-kz8qT51r.js";import{r as fe}from"./lcards-message-BMG6miXA.js";import"./lcards-form-section-DSoN9OMH.js";import"./lcards-grid-layout-gWVap5nj.js";import"./lcards-color-section-v2-Gczjko6d.js";import"./lcards-multi-action-editor-BFaPObUK.js";import"./lcards-rules-dashboard-BJnHLXoz.js";import"./lcards-filter-editor-gyZYI2ml.js";import"./lcards-shape-texture-editor-BL_T2bWZ.js";import"./lcards-datasource-editor-tab-COJ5jJtL.js";import"./lcards-template-evaluation-tab-Dva6rgtd.js";import"./lcards-provenance-tab-DK2bC-ht.js";const we=[["top","Top"],["bottom","Bottom"],["left","Left"],["right","Right"]];function Ce(G={}){return{body:G.type==="frame"?"Body (interior)":"Body (open area)",full:"Full (entire card)",...Se(G)}}k(Ce,"elbowEditorZones");function Se(G){const e=G.type||"header-left",t=G.style||"simple";if(e==="frame"){const r=G.frame||{},a={};for(const[o,i]of we){const d=r[o]||{},_=d.bar_width??d.bar_height??d.thickness;d.enabled===false||_===0||(a[o]=i)}return a}return t==="segmented"?{outer_vertical_bar:"Outer Vertical Bar",inner_vertical_bar:"Inner Vertical Bar",outer_horizontal_bar:"Outer Horizontal Bar",inner_horizontal_bar:"Inner Horizontal Bar"}:e.endsWith("-open")?{horizontal_bar:"Horizontal Bar"}:e.endsWith("-contained")?{left_bar:"Left Bar",right_bar:"Right Bar",horizontal_bar:"Horizontal Bar"}:{vertical_bar:"Vertical Bar",horizontal_bar:"Horizontal Bar"}}k(Se,"shapeZones");const ne=class ne2 extends _e{static get properties(){return{...super.properties,_liveOuterCurve:{type:Number,state:true},_liveInnerCurve:{type:Number,state:true},_liveSegOuterOC:{type:Number,state:true},_liveSegOuterIC:{type:Number,state:true},_liveSegInnerOC:{type:Number,state:true},_liveSegInnerIC:{type:Number,state:true},_segCurveTab:{type:String,state:true}}}constructor(){super(),this.cardType="elbow",this._cardElement=null,this._symbioCardPickerDialogRef=null,this._symbioCardEditorDialogRef=null,this._yamlDebounceTimer=null,this._cssDebounceTimer=null,this._liveOuterCurve=null,this._liveInnerCurve=null,this._liveSegOuterOC=null,this._liveSegOuterIC=null,this._liveSegInnerOC=null,this._liveSegInnerIC=null,this._segCurveTab="outer"}firstUpdated(){var e;(e=super.firstUpdated)==null||e.call(this,{}),this._tryFindCardElement()}_tryFindCardElement(){let e=0;const t=10,r=k(()=>{e++,this._findCardElement(),!this._cardElement&&e<t&&requestAnimationFrame(r)},"tryFind");requestAnimationFrame(r)}_findCardElement(){var a;const e=`lcards-${this.cardType}`;if((a=this._cardElement)!=null&&a.isConnected)return;let t=null;const r=this.closest(".wrapper");if(r){const o=r.getRootNode();if(o instanceof ShadowRoot){const i=o.host;if(i){const d=i.parentElement;if(d){const _=d.parentElement;if(_){const u=_.querySelector(".element-preview");if(u){const c=k(($,v=0)=>{if(v>5)return null;const A=$.querySelector(e);if(A)return A;const g=$.querySelectorAll("*");for(const m of g)if(m.shadowRoot){const n=c(m.shadowRoot,v+1);if(n)return n}return null},"searchInShadows");t=u.querySelector(e)||c(u)}}}}}}if(!t&&(t=document.querySelector(e),!t)){for(const o of document.querySelectorAll("*"))if(o.shadowRoot&&(t=o.shadowRoot.querySelector(e),t))break}t&&t!==this._cardElement&&(this._cardElement=t,this.requestUpdate())}connectedCallback(){var e;(e=super.connectedCallback)==null||e.call(this),this._boundHandleCardPickerResult=this._handleSymbiontCardPickerResult.bind(this),document.addEventListener("lcards-symbiont-card-picker-result",this._boundHandleCardPickerResult)}disconnectedCallback(){var e;(e=super.disconnectedCallback)==null||e.call(this),this._boundHandleCardPickerResult&&document.removeEventListener("lcards-symbiont-card-picker-result",this._boundHandleCardPickerResult),this._symbioCardPickerDialogRef&&(this._symbioCardPickerDialogRef.remove(),this._symbioCardPickerDialogRef=null),this._symbioCardEditorDialogRef&&(this._symbioCardEditorDialogRef.remove(),this._symbioCardEditorDialogRef=null),clearTimeout(this._yamlDebounceTimer??void 0),clearTimeout(this._cssDebounceTimer??void 0)}static get styles(){return[super.styles,xe]}_getTabDefinitions(){return[{label:"Config",content:k(()=>this._renderFromConfig(this._getConfigTabConfig()),"content")},{label:"Elbow Design",content:k(()=>this._renderElbowDesignTab(),"content")},{label:"Zones",content:k(()=>this._renderZonesTab(),"content")},{label:"Text",content:k(()=>this._renderTextTab(),"content")},{label:"Symbiont",content:k(()=>this._renderSymbiontTab(),"content")},{label:"Actions",content:k(()=>this._renderActionsTab(),"content")},{label:"Effects",content:k(()=>this._renderEffectsTab(),"content")},{label:"Sound",content:k(()=>this._renderSoundTab(["card_tap","card_hold","card_double_tap","card_hover","toggle_on","toggle_off"]),"content")},...this._getUtilityTabs()]}async _openSymbiontCardPicker(){var r;if(!customElements.get("hui-card-picker")){J.warn('[ElbowEditor] hui-card-picker not loaded yet. Click "Add Card" on the dashboard once to prime it, then try again.'),$e({title:"Card picker not ready",message:"Home Assistant hasn’t loaded its card picker yet. On any dashboard, click “Add card” once (you can cancel it), then come back and try again."});return}this._symbioCardPickerDialogRef&&(this._symbioCardPickerDialogRef.remove(),this._symbioCardPickerDialogRef=null);const e=document.createElement("ha-dialog");e.headerTitle="Select Symbiont Card Type",this._symbioCardPickerDialogRef=e,ge(e,this),e.open=true,await e.updateComplete;const t=document.createElement("hui-card-picker");t.hass=this.hass,t.lovelace=this._getSymbiontLovelace(),t.style.cssText="padding: 24px; display: block;",e.appendChild(t),await new Promise(a=>setTimeout(a,100)),(r=t.requestUpdate)==null||r.call(t),t.updateComplete&&await t.updateComplete,t.addEventListener("config-changed",a=>{var i;const o=(i=a.detail)==null?void 0:i.config;J.debug("[ElbowEditor] Symbiont card type selected:",o==null?void 0:o.type),document.dispatchEvent(new CustomEvent("lcards-symbiont-card-picker-result",{detail:{config:o}})),e.open=false}),e.addEventListener("closed",()=>{e.remove(),this._symbioCardPickerDialogRef===e&&(this._symbioCardPickerDialogRef=null)})}_handleSymbiontCardPickerResult(e){var r;const t=(r=e.detail)==null?void 0:r.config;t&&(J.debug("[ElbowEditor] Applying symbiont card config from picker:",t.type),this._setConfigValue("symbiont.card",t))}async _openSymbiontCardEditor(){var u,c;const e=(c=(u=this.config)==null?void 0:u.symbiont)==null?void 0:c.card;if(!(e!=null&&e.type))return;if(!customElements.get("hui-card-element-editor")){J.warn("[ElbowEditor] hui-card-element-editor not available yet");return}this._symbioCardEditorDialogRef&&(this._symbioCardEditorDialogRef.remove(),this._symbioCardEditorDialogRef=null);const t=document.createElement("ha-dialog");t.headerTitle=`Edit: ${e.type}`,t.setAttribute("prevent-scrim-close",""),this._symbioCardEditorDialogRef=t;const r=document.createElement("div");r.style.cssText="padding: 16px; min-height: 300px; min-width: 420px; box-sizing: border-box;";const a=document.createElement("hui-card-element-editor");a.hass=this.hass,a.lovelace=this._getSymbiontLovelace(),a.value=JSON.parse(JSON.stringify(e));let o=JSON.parse(JSON.stringify(e));a.addEventListener("config-changed",$=>{var v;(v=$.detail)!=null&&v.config&&typeof $.detail.config=="object"&&$.detail.config.type&&(o=$.detail.config)}),a.addEventListener("value-changed",$=>{var v;(v=$.detail)!=null&&v.value&&typeof $.detail.value=="object"&&$.detail.value.type&&(o=$.detail.value)}),r.appendChild(a),t.appendChild(r);const i=document.createElement("div");i.slot="footer",i.style.cssText="display:flex; gap:8px;";const d=document.createElement("ha-button");d.textContent="Cancel",d.addEventListener("click",()=>{t.open=false});const _=document.createElement("ha-button");_.textContent="Save",_.addEventListener("click",()=>{o!=null&&o.type&&(this._setConfigValue("symbiont.card",JSON.parse(JSON.stringify(o))),J.debug("[ElbowEditor] Symbiont card config saved from editor:",o.type)),t.open=false}),i.appendChild(d),i.appendChild(_),t.appendChild(i),t.addEventListener("closed",()=>{t.remove(),this._symbioCardEditorDialogRef===t&&(this._symbioCardEditorDialogRef=null)}),ge(t,this),setTimeout(()=>{t.open=true},10),J.debug("[ElbowEditor] Opened symbiont card editor dialog for:",e.type)}_getSymbiontLovelace(){var t;let e=((t=this.lovelace)==null?void 0:t.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}_getElbowComponent(e){var t,r,a;return(a=(r=(t=window.lcards)==null?void 0:t.core)==null?void 0:r.componentManager)==null?void 0:a.getComponent(e)}_getElbowComponentEntries(){var t,r;const e=(r=(t=window.lcards)==null?void 0:t.core)==null?void 0:r.componentManager;return e?e.getComponentsByType("elbow").map(a=>[a,e.getComponent(a)]):[]}_getConfigTabConfig(){var d;const e=((d=this.config.elbow)==null?void 0:d.type)||"header-left",t=this._getElbowStyle(),r=this._getElbowComponent(e),o=((r==null?void 0:r.features)||["simple"]).includes("segmented"),i=[{value:"simple",label:"Simple (single elbow)"}];return o&&i.push({value:"segmented",label:"Segmented (Picard-style double)"}),[...this._buildConfigTab({infoMessage:"Configure your LCARS elbow card. Elbows are positioned borders with rounded corners that create the iconic LCARS interface aesthetic.",modeSections:[{type:"section",header:"Elbow Configuration",description:"Choose elbow position and style",icon:"mdi:vector-polyline",expanded:false,outlined:true,children:[{type:"custom",render:k(()=>h`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${"Elbow Position"}
                                    .helper=${"Position of the elbow corner on the card"}
                                    .selector=${{select:{mode:"dropdown",options:this._getElbowComponentEntries().map(([_,u])=>{var c;return{value:_,label:((c=u.metadata)==null?void 0:c.name)||_}})}}}
                                    .value=${e}
                                    @value-changed=${this._handleElbowTypeChange}>
                                </ha-selector>

                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${"Elbow Style"}
                                    .helper=${o?t==="simple"?"Simple: Single elbow with one curve":"Segmented: Double concentric elbows with gap (TNG aesthetic)":"This component only supports simple style"}
                                    .selector=${{select:{mode:"dropdown",options:i}}}
                                    .value=${t}
                                    .disabled=${!o}
                                    @value-changed=${this._handleStyleChange}>
                                </ha-selector>
                            `,"render")}]},{type:"section",header:"Entity",description:"Entity to observe and attribute for state range conditions",icon:"mdi:home-automation",expanded:false,outlined:true,children:[{type:"custom",render:k(()=>{var _;return h`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${"Entity"}
                                    .helper=${"[Optional] Entity whose state drives colour and icon changes"}
                                    .selector=${{entity:{}}}
                                    .value=${((_=this.config)==null?void 0:_.entity)||""}
                                    @value-changed=${u=>{const c=u.detail.value;c?this._setConfigValue("entity",c):this._removeConfigPath("entity")}}>
                                </ha-selector>
                            `},"render")},{type:"custom",render:k(()=>this._renderRangesAttributeSelector(),"render")},{type:"custom",render:k(()=>this._renderStateAttributeSelector(),"render")},{type:"custom",render:k(()=>this._renderStateClassificationElseSelector(),"render")}]}],basicFields:[{path:"id",label:"Card ID",helper:"[Optional] Custom ID for targeting with rules and animations"},{path:"tags",label:"Tags",helper:"Select existing tags or type new ones for rule targeting"}],showBasicSection:true,basicSectionHeader:"Card Identification"}),{type:"section",header:"Sizing",description:"Override card dimensions: useful in stacks, overlays, or any auto-height container",icon:"mdi:resize",expanded:false,outlined:true,children:[{type:"grid",columns:2,children:[{type:"field",path:"height"},{type:"field",path:"width"},{type:"field",path:"min_height"},{type:"field",path:"min_width"},{type:"field",path:"max_height"},{type:"field",path:"max_width"},{type:"field",path:"overflow"},{type:"field",path:"z_index"},{type:"field",path:"overflow_x"},{type:"field",path:"overflow_y"}]},{type:"custom",render:k(()=>this._renderLayoutCardHint(),"render")}]}]}_renderElbowDesignTab(){var r;const e=((r=this.config.elbow)==null?void 0:r.type)||"header-left",t=this._getElbowStyle();return e==="frame"?this._renderFrameDesign():t==="segmented"?this._renderSegmentedDesign():this._renderSimpleDesign()}_renderFrameDesign(){var E,f,x,S,M;const e=((E=this.config.elbow)==null?void 0:E.frame)||{},r=this._getElbowStyle()==="segmented",a=e.bar_width??90,o=e.bar_height??a,i=e.outer_curve??Math.round(a/2),d=e.inner_curve??Math.round(i/2),_=k(s=>{const w=e[s]||{},R=w.bar_width??w.bar_height??w.thickness;return R!==void 0?R:s==="top"||s==="bottom"?o:a},"sideThickness"),u=k(s=>(e[s]||{}).enabled!==false,"sideEnabled"),c=((f=e.segments)==null?void 0:f.inner_frame)||{},$=c.bar_width??28,v=c.bar_height??$,A=c.outer_curve??Math.round($/2),g=c.inner_curve??Math.round(A/2),m=((x=e.segments)==null?void 0:x.gap)??4,n=k(s=>{var w,R;return((R=(w=e.corners)==null?void 0:w[s])==null?void 0:R.outer_curve)??i},"cornerOuter"),y=k(s=>{var w,R;return((R=(w=e.corners)==null?void 0:w[s])==null?void 0:R.inner_curve)??d},"cornerInner"),p=k((s,w)=>h`
            <div style="display: flex; align-items: center; gap: 12px; padding: 4px 0;">
                <ha-selector
                    style="flex: 0 0 140px;"
                    .hass=${this.hass}
                    .label=${w}
                    .selector=${{boolean:{}}}
                    .value=${u(s)}
                    @value-changed=${R=>this._setConfigValue(`elbow.frame.${s}.enabled`,R.detail.value)}>
                </ha-selector>
                ${u(s)?h`
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${"Thickness (px)"}
                        .selector=${{number:{min:1,max:500,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${_(s)}
                        @value-changed=${R=>{const H=s==="top"||s==="bottom"?"bar_height":"bar_width";this._setConfigValue(`elbow.frame.${s}.${H}`,R.detail.value)}}>
                    </ha-selector>
                `:""}
            </div>
        `,"renderSideRow"),b=k((s,w)=>{const R=s.includes("right")&&!u("right")||s.includes("left")&&!u("left")||s.includes("top")&&!u("top")||s.includes("bottom")&&!u("bottom"),H=R?"End cap outer (px)":"Outer curve (px)",X=R?"End cap inner (px)":"Inner curve (px)";return h`
                <div style="display: flex; align-items: center; gap: 8px; padding: 2px 0;">
                    <span style="flex: 0 0 130px; font-size: 13px; color: var(--secondary-text-color);">${w}</span>
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${H}
                        .selector=${{number:{min:0,max:250,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${n(s)}
                        @value-changed=${z=>this._setConfigValue(`elbow.frame.corners.${s}.outer_curve`,z.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${X}
                        .helper=${"Rounded curve on the inner corner of the bar; only applied when both adjacent sides are enabled"}
                        .selector=${{number:{min:0,max:250,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${y(s)}
                        @value-changed=${z=>this._setConfigValue(`elbow.frame.corners.${s}.inner_curve`,z.detail.value)}>
                    </ha-selector>
                </div>
            `},"renderCornerRow");return h`
            <lcards-message
                type="info"
                message="A frame draws a border around the card. Each side can be turned on and sized; open sides get rounded end-caps.">
            </lcards-message>

            <!-- Shorthand defaults -->
            <lcards-form-section
                header="Default Dimensions"
                description="Shorthand values applied to all sides/corners unless individually overridden below"
                icon="mdi:border-all"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector .hass=${this.hass}
                    .label=${"Default Side Width (left/right)"}
                    .helper=${"Applied to left and right bars unless overridden"}
                    .selector=${{number:{min:1,max:500,step:1,mode:"slider",unit_of_measurement:"px"}}}
                    .value=${a}
                    @value-changed=${s=>this._setConfigValue("elbow.frame.bar_width",s.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${"Default Side Height (top/bottom)"}
                    .helper=${"Applied to top and bottom bars unless overridden"}
                    .selector=${{number:{min:1,max:500,step:1,mode:"slider",unit_of_measurement:"px"}}}
                    .value=${o}
                    @value-changed=${s=>this._setConfigValue("elbow.frame.bar_height",s.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${"Default Outer Corner Curve"}
                    .helper=${"Outer corner/end-cap arc radius: applied to all 4 corners unless overridden"}
                    .selector=${{number:{min:0,max:250,step:1,mode:"slider",unit_of_measurement:"px"}}}
                    .value=${i}
                    @value-changed=${s=>this._setConfigValue("elbow.frame.outer_curve",s.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${"Default Inner Corner Curve"}
                    .helper=${"Default inner corner curve; only applied when both adjacent sides are enabled; open-side corners are always square"}
                    .selector=${{number:{min:0,max:250,step:1,mode:"slider",unit_of_measurement:"px"}}}
                    .value=${d}
                    @value-changed=${s=>this._setConfigValue("elbow.frame.inner_curve",s.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            <!-- Per-side control -->
            <lcards-form-section
                header="Per-Side Control"
                description="Enable or disable each side and override its thickness. Disabled sides create open ends with rounded end-caps."
                icon="mdi:border-style"
                ?expanded=${true}
                ?outlined=${true}>

                ${p("top","Top bar")}
                ${p("bottom","Bottom bar")}
                ${p("left","Left bar")}
                ${p("right","Right bar")}
            </lcards-form-section>

            <!-- Per-corner curves -->
            <lcards-form-section
                header="Per-Corner Curves"
                description="Override outer and inner arc radii per corner. When an adjacent side is disabled, these become end-cap arcs."
                icon="mdi:vector-curve"
                ?expanded=${false}
                ?outlined=${true}>

                ${b("top_left","Top-left")}
                ${b("top_right","Top-right")}
                ${b("bottom_left","Bottom-left")}
                ${b("bottom_right","Bottom-right")}
            </lcards-form-section>

            <!-- Segmented (double ring) -->
            ${r?h`
                <lcards-form-section
                    header="Inner Ring (Segmented)"
                    description="Configure the inner frame ring dimensions. The inner ring is inset from the outer ring by the gap."
                    icon="mdi:border-inside"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector .hass=${this.hass}
                        .label=${"Gap between rings (px)"}
                        .selector=${{number:{min:0,max:50,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${m}
                        @value-changed=${s=>this._setConfigValue("elbow.frame.segments.gap",s.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner ring width (left/right)"}
                        .selector=${{number:{min:1,max:500,step:1,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${$}
                        @value-changed=${s=>this._setConfigValue("elbow.frame.segments.inner_frame.bar_width",s.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner ring height (top/bottom)"}
                        .selector=${{number:{min:1,max:500,step:1,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${v}
                        @value-changed=${s=>this._setConfigValue("elbow.frame.segments.inner_frame.bar_height",s.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner ring outer curve"}
                        .selector=${{number:{min:0,max:250,step:1,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${A}
                        @value-changed=${s=>this._setConfigValue("elbow.frame.segments.inner_frame.outer_curve",s.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner ring inner curve"}
                        .helper=${"Inner ring corner curve; only applied when both adjacent sides are enabled; open-side corners are always square"}
                        .selector=${{number:{min:0,max:250,step:1,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${g}
                        @value-changed=${s=>this._setConfigValue("elbow.frame.segments.inner_frame.inner_curve",s.detail.value)}>
                    </ha-selector>
                </lcards-form-section>

                <lcards-form-section
                    header="Inner Ring Colours"
                    description="State-based colours for the inner (secondary) frame ring"
                    icon="mdi:palette-outline"
                    ?expanded=${false}
                    ?outlined=${true}>

                    <lcards-color-section-v2
                        .editor=${this}
                        .entityId=${((S=this.config)==null?void 0:S.entity)||""}
                        basePath="elbow.frame.segments.inner_frame.color"
                        header="Inner Ring Colours"
                        description="Inner ring colour per entity state"
                        .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>
                </lcards-form-section>
            `:""}

            <!-- Frame colour -->
            <lcards-form-section
                header="Frame Colours"
                description="State-based colours for the frame ring"
                icon="mdi:palette"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${((M=this.config)==null?void 0:M.entity)||""}
                    basePath="elbow.segment.color"
                    header="Frame Colours"
                    description="Frame colour per entity state"
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            ${this._renderShapeTextureSection()}
        `}_isCssExpr(e){return!(typeof e!="string"||e===""||e==="theme"||e==="auto"||["arm_width","arm_height","arm_max","arm_min","arm_fill"].includes(e)||/^\s*-?\d+(\.\d+)?\s*(px)?\s*$/.test(e))}_renderCssField(e,t,r,a){return h`
            <ha-selector
                .hass=${this.hass}
                .label=${e}
                .helper=${"CSS length: vw, vh, clamp(), calc(), etc. Switch mode dropdown to revert to slider."}
                .selector=${{text:{}}}
                .value=${t||""}
                @value-changed=${o=>{const i=(o.detail.value||"").trim();i===""?this._setConfigValue(r,a):this._setConfigValue(r,i)}}>
            </ha-selector>
        `}_renderSimpleDesign(){var M,s,w,R,H,X,z,I;const e=((M=this.config.elbow)==null?void 0:M.segment)||{},t=e.bar_width!==void 0?e.bar_width:90,r=e.bar_height!==void 0?e.bar_height:typeof t=="number"?t:90,a=e.outer_curve??"auto",o=e.inner_curve,d=["auto","arm_width","arm_height","arm_max","arm_min","arm_fill"].includes(o),_=this._isCssExpr(t),u=this._isCssExpr(r),c=this._isCssExpr(a),$=!d&&this._isCssExpr(o),v=e.outer_curve_clamp??"card",A=typeof v=="number",g=A?"manual":v,m=typeof t=="number"?t:90,n=typeof r=="number"?r:90,y=Math.min(m,n),p=Math.max(m,n),b=a==="arm_height"?n/2:a==="arm_max"?p/2:a==="arm_min"?y/2:a==="arm_fill"?p:m/2,E=typeof a=="number"?a:b,f=o==="arm_width"?m/2:o==="arm_height"?n/2:o==="arm_max"?p/2:o==="arm_min"?y/2:o==="arm_fill"?p:E/2,x=c?"css":typeof a=="number"?"manual":a,S=$?"css":typeof o=="number"?"manual":o??"auto";return h`
            <!-- Static reference diagram -->
            <lcards-form-section
                variant="guide"
                header="Elbow Geometry Reference"
                description="How the four dimensions map to the physical LCARS elbow shape"
                icon="mdi:ruler-square"
                ?expanded=${false}
                ?outlined=${true}>

                <div style="padding: 16px; text-align: center;">
                    ${this._renderElbowReferenceDiagram()}
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Bar Dimensions"
                description="Thickness of the two arms"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Bar Width Mode (Vertical)"}
                    .helper=${_?"CSS expression: edit via YAML":t==="theme"?"Dynamic: follows input_number.lcars_vertical":"Static pixel value"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_vertical)"},{value:"css",label:"CSS Expression (YAML only)"}]}}}
                    .value=${_?"css":t==="theme"?"theme":"static"}
                    @value-changed=${C=>this._handleBarWidthModeChange(C)}>
                </ha-selector>

                ${_?this._renderCssField("Bar Width (Vertical)",t,"elbow.segment.bar_width",90):t!=="theme"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Bar Width (Vertical)"}
                            .helper=${"Thickness of the vertical sidebar"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof t=="number"?t:90}
                            @value-changed=${C=>this._setConfigValue("elbow.segment.bar_width",C.detail.value)}>
                        </ha-selector>
                    `:h`
                        <lcards-message type="info" title="Theme Integration">
                            Bar width will dynamically follow <code>input_number.lcars_vertical</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </lcards-message>
                    `}

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Bar Height Mode (Horizontal)"}
                    .helper=${u?"CSS expression: edit via YAML":r==="theme"?"Dynamic: follows input_number.lcars_horizontal":"Static pixel value"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_horizontal)"},{value:"css",label:"CSS Expression (YAML only)"}]}}}
                    .value=${u?"css":r==="theme"?"theme":"static"}
                    @value-changed=${C=>this._handleBarHeightModeChange(C)}>
                </ha-selector>

                ${u?this._renderCssField("Bar Height (Horizontal)",r,"elbow.segment.bar_height",90):r!=="theme"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Bar Height (Horizontal)"}
                            .helper=${"Thickness of the horizontal bar"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof r=="number"?r:90}
                            @value-changed=${C=>this._setConfigValue("elbow.segment.bar_height",C.detail.value)}>
                        </ha-selector>
                    `:h`
                        <lcards-message type="info" title="Theme Integration">
                            Bar height will dynamically follow <code>input_number.lcars_horizontal</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </lcards-message>
                    `}
            </lcards-form-section>

            <lcards-form-section
                header="Corner Curves"
                description="Arc radii for the outer and inner corners"
                icon="mdi:vector-curve"
                ?expanded=${true}
                ?outlined=${true}>

                <!-- Live arc preview — uses live slider value during drag, config value otherwise -->
                <div style="padding: 12px 0 4px; text-align: center;">
                    ${this._renderCurveLivePreview(this._liveOuterCurve??(typeof a=="number"?a:b),this._liveInnerCurve??(typeof o=="number"?o:f),m,n,g,v,this._parseStylePx(((w=(s=this.config)==null?void 0:s.style)==null?void 0:w.height)??((R=this.config)==null?void 0:R.height)),this._parseStylePx(((X=(H=this.config)==null?void 0:H.style)==null?void 0:X.width)??((z=this.config)==null?void 0:z.width)))}
                </div>

                <!-- Outer curve -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Outer Arc Radius"}
                    .helper=${c?"CSS expression: edit via YAML":`→ ${b.toFixed(1)} px`}
                    .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto / arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2), for paired elbows"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm, full sweep)"},{value:"manual",label:"manual  (explicit px)"},...c?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                    .value=${x}
                    @value-changed=${this._handleOuterCurveModeChange}>
                </ha-selector>

                ${c?this._renderCssField("Outer Curve Radius",a,"elbow.segment.outer_curve","auto"):x==="manual"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Outer Curve Radius"}
                            .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof a=="number"?a:b}
                            @input=${C=>{var W,V,F;const L=Number((F=(V=(W=C.composedPath)==null?void 0:W.call(C))==null?void 0:V[0])==null?void 0:F.value);isNaN(L)||(this._liveOuterCurve=L)}}
                            @value-changed=${C=>{this._liveOuterCurve=null,this._setConfigValue("elbow.segment.outer_curve",C.detail.value)}}>
                        </ha-selector>
                    `:this._renderCurveModeMessage("outer",x,b,m,n)}

                <!-- Inner curve -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Inner Arc Radius"}
                    .helper=${$?"CSS expression: edit via YAML":`→ ${f.toFixed(1)} px`}
                    .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...$?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                    .value=${S}
                    @value-changed=${this._handleInnerCurveModeChange}>
                </ha-selector>

                ${$?this._renderCssField("Inner Curve Radius",o,"elbow.segment.inner_curve","auto"):S==="manual"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Inner Curve Radius"}
                            .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof o=="number"?o:f}
                            @input=${C=>{var W,V,F;const L=Number((F=(V=(W=C.composedPath)==null?void 0:W.call(C))==null?void 0:V[0])==null?void 0:F.value);isNaN(L)||(this._liveInnerCurve=L)}}
                            @value-changed=${C=>{this._liveInnerCurve=null,this._setConfigValue("elbow.segment.inner_curve",C.detail.value)}}>
                        </ha-selector>
                    `:this._renderCurveModeMessage("inner",S,f,m,n,b)}

                <!-- Curve clamp -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Curve Clamp"}
                    .helper=${"Controls how the arc radius is limited at render time"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"card",label:"card: clamp to card viewport (default)"},{value:"none",label:"none: no clamp (consistent paired elbows)"},{value:"manual",label:"manual: explicit px ceiling"}]}}}
                    .value=${g}
                    @value-changed=${this._handleClampModeChange}>
                </ha-selector>

                ${A?h`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Clamp Ceiling"}
                        .selector=${{number:{min:0,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${typeof v=="number"?v:60}
                        @value-changed=${C=>this._setConfigValue("elbow.segment.outer_curve_clamp",C.detail.value)}>
                    </ha-selector>
                `:h`
                    <lcards-message
                        type=${g==="none"?"success":"info"}
                        message=${g==="none"?"No clamping: the arc radius is exactly the computed value. The SVG clips overflow at the card edge. Use this for paired elbows in different-height cards so both render identically.":"The arc radius is clamped to min(card_width, card_height) at render time. Two elbows with the same config in differently-sized cards may render with different radii. Use none to prevent this."}>
                    </lcards-message>
                `}

                ${this._isDiagonalCapType()?h`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Diagonal Angle Mode"}
                        .helper=${e.diagonal_angle==="theme"?"Dynamic: follows input_number.lcars_elbow_angle":"Static angle value"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                        .value=${e.diagonal_angle==="theme"?"theme":"static"}
                        @value-changed=${C=>this._handleDiagonalAngleModeChange(C)}>
                    </ha-selector>

                    ${e.diagonal_angle!=="theme"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Diagonal Cut Angle"}
                            .helper=${"Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)"}
                            .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                            .value=${typeof e.diagonal_angle=="number"?e.diagonal_angle:45}
                            @value-changed=${C=>this._setConfigValue("elbow.segment.diagonal_angle",C.detail.value)}>
                        </ha-selector>
                    `:h`
                        <lcards-message type="info" title="Theme Integration">
                            Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </lcards-message>
                    `}
                `:""}
            </lcards-form-section>

            <lcards-form-section
                header="Elbow Colours"
                description="State-based colours for the elbow"
                icon="mdi:palette"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${((I=this.config)==null?void 0:I.entity)||""}
                    basePath="elbow.segment.color"
                    header="Segment Colours"
                    description="Elbow segment colour for each state - supports custom states"
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            ${this._renderShapeTextureSection()}
        `}_renderShapeTextureSection(){var e,t,r;return h`
            <lcards-form-section
                header="Shape Texture"
                description="Apply an SVG texture or animation pattern inside the elbow shape"
                icon="mdi:texture"
                ?expanded=${!!((t=(e=this.config)==null?void 0:e.shape_texture)!=null&&t.preset)}
                ?outlined=${true}>
                <lcards-shape-texture-editor
                    .hass=${this.hass}
                    .config=${((r=this.config)==null?void 0:r.shape_texture)??null}
                    @texture-changed=${a=>{a.detail.value?this._setConfigValue("shape_texture",a.detail.value):this._removeConfigPath("shape_texture")}}>
                </lcards-shape-texture-editor>
            </lcards-form-section>
        `}_renderSegmentedDesign(){var Q,oe,ee,te,se,le,de,ce,he,ue,me,pe;const e=((Q=this.config.elbow)==null?void 0:Q.segments)||{},t=e.gap??4,r=e.outer_segment||{},a=e.inner_segment||{},o=["auto","arm_width","arm_height","arm_max","arm_min","arm_fill"],i=typeof r.bar_width=="number"?r.bar_width:90,d=typeof r.bar_height=="number"?r.bar_height:i,_=Math.min(i,d),u=Math.max(i,d),c=r.outer_curve??"auto",v=!o.includes(c)&&this._isCssExpr(c),A=v?"css":typeof c=="number"?"manual":c,g=typeof c=="number"?c:c==="arm_height"?d/2:c==="arm_max"?u/2:c==="arm_min"?_/2:c==="arm_fill"?u:i/2,m=r.inner_curve,y=!o.includes(m)&&this._isCssExpr(m),p=y?"css":typeof m=="number"?"manual":m??"auto",b=typeof m=="number"?m:m==="arm_width"?i/2:m==="arm_height"?d/2:m==="arm_max"?u/2:m==="arm_min"?_/2:m==="arm_fill"?u:g/2,E=r.outer_curve_clamp??"card",f=typeof E=="number"?"manual":E,x=typeof a.bar_width=="number"?a.bar_width:60,S=typeof a.bar_height=="number"?a.bar_height:x,M=Math.min(x,S),s=Math.max(x,S),w=this._parseStylePx(((ee=(oe=this.config)==null?void 0:oe.style)==null?void 0:ee.height)??((te=this.config)==null?void 0:te.height)),H=Math.max(0,Math.min(g,f==="none"?1/0:typeof E=="number"?E:w??1/0)),X=g>0?Math.max(0,b*(H/g)):0,z=Math.max(0,X-t),I=a.outer_curve,C=o.includes(I),L=!C&&this._isCssExpr(I),W=L?"css":typeof I=="number"?"manual":I??"auto",V=typeof I=="number"?I:I==="arm_height"?S/2:I==="arm_max"?s/2:I==="arm_min"?M/2:I==="arm_fill"?s:C?x/2:z,F=a.inner_curve,O=!o.includes(F)&&this._isCssExpr(F),Z=O?"css":typeof F=="number"?"manual":F??"auto",j=typeof F=="number"?F:F==="arm_width"?x/2:F==="arm_height"?S/2:F==="arm_max"?s/2:F==="arm_min"?M/2:F==="arm_fill"?s:V/2,re=this._liveSegOuterOC??(typeof c=="number"?c:g),D=this._liveSegOuterIC??(typeof m=="number"?m:b),P=this._liveSegInnerOC??V,K=this._liveSegInnerIC??j;return h`
            <lcards-message
                type="info"
                message="Picard-style double elbow: an outer frame segment and an inner content segment separated by a gap.">
            </lcards-message>

            <!-- ── Geometry Reference ──────────────────────────────────────── -->
            <lcards-form-section
                variant="guide"
                header="Geometry Reference"
                description="Fixed-proportion diagram showing the segmented elbow structure"
                icon="mdi:help-circle-outline"
                ?expanded=${false}
                ?outlined=${true}>
                <div style="padding: 8px 0; text-align: center;">
                    ${this._renderSegmentedElbowReferenceDiagram()}
                </div>
            </lcards-form-section>

            <!-- ── Segment Spacing ─────────────────────────────────────────── -->
            <lcards-form-section
                header="Segment Spacing"
                description="Gap between outer and inner segments"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Segment Gap"}
                    .helper=${"Space between the two segments (default: 4px)"}
                    .selector=${{number:{min:0,max:50,step:1,mode:"slider",unit_of_measurement:"px"}}}
                    .value=${t}
                    @value-changed=${l=>this._setConfigValue("elbow.segments.gap",l.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            <!-- ── Outer Segment ────────────────────────────────────────────── -->
            <lcards-form-section
                header="Outer Segment (Frame)"
                description="Colour and dimensions for the outer elbow"
                icon="mdi:vector-square"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${((se=this.config)==null?void 0:se.entity)||""}
                    basePath="elbow.segments.outer_segment.color"
                    header="Colour"
                    description="Colour states for outer frame segment"
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <lcards-form-section
                    header="Bar Dimensions"
                    icon="mdi:ruler"
                    ?expanded=${true}
                    ?outlined=${false}>

                    ${this._isCssExpr(r.bar_width)?h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Width Mode"}
                            .helper=${"CSS expression active"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"css"}
                            @value-changed=${l=>this._handleDimModeChange(l.detail.value,"elbow.segments.outer_segment.bar_width",90,"clamp(60px, 8vw, 120px)")}>
                        </ha-selector>
                        ${this._renderCssField("Bar Width",r.bar_width,"elbow.segments.outer_segment.bar_width",90)}
                    `:h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Width Mode"}
                            .helper=${"Static: fixed pixel value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"static"}
                            @value-changed=${l=>this._handleDimModeChange(l.detail.value,"elbow.segments.outer_segment.bar_width",90,"clamp(60px, 8vw, 120px)")}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Bar Width"} .helper=${"Vertical bar thickness"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof r.bar_width=="number"?r.bar_width:90}
                            @value-changed=${l=>this._setConfigValue("elbow.segments.outer_segment.bar_width",l.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isCssExpr(r.bar_height)?h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Height Mode"}
                            .helper=${"CSS expression active"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"css"}
                            @value-changed=${l=>this._handleDimModeChange(l.detail.value,"elbow.segments.outer_segment.bar_height",90,"clamp(40px, 6vh, 90px)")}>
                        </ha-selector>
                        ${this._renderCssField("Bar Height",r.bar_height,"elbow.segments.outer_segment.bar_height",90)}
                    `:h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Height Mode"}
                            .helper=${"Static: fixed pixel value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"static"}
                            @value-changed=${l=>this._handleDimModeChange(l.detail.value,"elbow.segments.outer_segment.bar_height",90,"clamp(40px, 6vh, 90px)")}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Bar Height"} .helper=${"Horizontal bar thickness"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof r.bar_height=="number"?r.bar_height:i}
                            @value-changed=${l=>this._setConfigValue("elbow.segments.outer_segment.bar_height",l.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isDiagonalCapType()?h`
                        <ha-selector .hass=${this.hass}
                            .label=${"Diagonal Angle Mode"}
                            .helper=${r.diagonal_angle==="theme"?"Dynamic: follows the input_number.lcars_elbow_angle helper":"Static: fixed angle value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                            .value=${r.diagonal_angle==="theme"?"theme":"static"}
                            @value-changed=${l=>this._handleOuterDiagonalAngleModeChange(l)}>
                        </ha-selector>
                        ${r.diagonal_angle!=="theme"?h`
                            <ha-selector .hass=${this.hass} .label=${"Diagonal Cut Angle"}
                                .helper=${"Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)"}
                                .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                                .value=${typeof r.diagonal_angle=="number"?r.diagonal_angle:45}
                                @value-changed=${l=>this._setConfigValue("elbow.segments.outer_segment.diagonal_angle",l.detail.value)}>
                            </ha-selector>
                        `:h`
                            <lcards-message type="info" title="Theme Integration">
                                Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code>.
                            </lcards-message>
                        `}
                    `:""}
                </lcards-form-section>
            </lcards-form-section>

            <!-- ── Inner Segment ─────────────────────────────────────────────── -->
            <lcards-form-section
                header="Inner Segment (Content Area)"
                description="Colour and dimensions for the inner elbow"
                icon="mdi:vector-square-open"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${((le=this.config)==null?void 0:le.entity)||""}
                    basePath="elbow.segments.inner_segment.color"
                    header="Colour"
                    description="Colour states for inner content segment"
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <lcards-form-section
                    header="Bar Dimensions"
                    icon="mdi:ruler"
                    ?expanded=${true}
                    ?outlined=${false}>

                    ${this._isCssExpr(a.bar_width)?h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Width Mode"}
                            .helper=${"CSS expression active"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"css"}
                            @value-changed=${l=>this._handleDimModeChange(l.detail.value,"elbow.segments.inner_segment.bar_width",60,"clamp(40px, 5vw, 80px)")}>
                        </ha-selector>
                        ${this._renderCssField("Bar Width",a.bar_width,"elbow.segments.inner_segment.bar_width",60)}
                    `:h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Width Mode"}
                            .helper=${"Static: fixed pixel value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"static"}
                            @value-changed=${l=>this._handleDimModeChange(l.detail.value,"elbow.segments.inner_segment.bar_width",60,"clamp(40px, 5vw, 80px)")}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Bar Width"} .helper=${"Vertical bar thickness"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof a.bar_width=="number"?a.bar_width:60}
                            @value-changed=${l=>this._setConfigValue("elbow.segments.inner_segment.bar_width",l.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isCssExpr(a.bar_height)?h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Height Mode"}
                            .helper=${"CSS expression active"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"css"}
                            @value-changed=${l=>this._handleDimModeChange(l.detail.value,"elbow.segments.inner_segment.bar_height",60,"clamp(30px, 4vh, 60px)")}>
                        </ha-selector>
                        ${this._renderCssField("Bar Height",a.bar_height,"elbow.segments.inner_segment.bar_height",60)}
                    `:h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Height Mode"}
                            .helper=${"Static: fixed pixel value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"static"}
                            @value-changed=${l=>this._handleDimModeChange(l.detail.value,"elbow.segments.inner_segment.bar_height",60,"clamp(30px, 4vh, 60px)")}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Bar Height"} .helper=${"Horizontal bar thickness"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof a.bar_height=="number"?a.bar_height:x}
                            @value-changed=${l=>this._setConfigValue("elbow.segments.inner_segment.bar_height",l.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isDiagonalCapType()?h`
                        <ha-selector .hass=${this.hass}
                            .label=${"Diagonal Angle Mode"}
                            .helper=${a.diagonal_angle==="theme"?"Dynamic: follows the input_number.lcars_elbow_angle helper":"Static: fixed angle value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                            .value=${a.diagonal_angle==="theme"?"theme":"static"}
                            @value-changed=${l=>this._handleInnerDiagonalAngleModeChange(l)}>
                        </ha-selector>
                        ${a.diagonal_angle!=="theme"?h`
                            <ha-selector .hass=${this.hass} .label=${"Diagonal Cut Angle"}
                                .helper=${"Angle of diagonal cuts (defaults to outer segment angle)"}
                                .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                                .value=${typeof a.diagonal_angle=="number"?a.diagonal_angle:r.diagonal_angle??45}
                                @value-changed=${l=>this._setConfigValue("elbow.segments.inner_segment.diagonal_angle",l.detail.value)}>
                            </ha-selector>
                        `:h`
                            <lcards-message type="info" title="Theme Integration">
                                Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code>.
                            </lcards-message>
                        `}
                    `:""}
                </lcards-form-section>
            </lcards-form-section>

            <!-- ── Corner Curves ────────────────────────────────────────────── -->
            <lcards-form-section
                header="Corner Curves"
                description="Arc radii for both segments: dual preview updates live as you drag"
                icon="mdi:vector-curve"
                ?expanded=${true}
                ?outlined=${true}>

                <!-- Dual-segment live preview -->
                <div style="padding: 8px 0 4px; text-align: center;">
                    ${this._renderSegmentedLivePreview(re,D,i,d,P,K,x,S,t,f,E,this._parseStylePx(((ce=(de=this.config)==null?void 0:de.style)==null?void 0:ce.height)??((he=this.config)==null?void 0:he.height)),this._parseStylePx(((me=(ue=this.config)==null?void 0:ue.style)==null?void 0:me.width)??((pe=this.config)==null?void 0:pe.width)),I===void 0,a.inner_curve===void 0||a.inner_curve==="auto")}
                </div>

                <!-- Outer segment curves subsection -->
                <lcards-form-section
                    header="Outer Segment"
                    icon="mdi:vector-square"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <ha-selector .hass=${this.hass}
                        .label=${"Outer Arc Radius"}
                        .helper=${v?"CSS expression: edit via YAML":`→ ${g.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto / arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2), for paired elbows"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm, full sweep)"},{value:"manual",label:"manual  (explicit px)"},...v?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${A}
                        @value-changed=${l=>this._handleSegCurveModeChange("elbow.segments.outer_segment.outer_curve",l.detail.value,Math.round(g),"clamp(30px, 4vw, 60px)",true)}>
                    </ha-selector>
                    ${v?this._renderCssField("Outer Arc Radius",c,"elbow.segments.outer_segment.outer_curve",Math.round(g)):A==="manual"?h`
                            <ha-selector .hass=${this.hass} .label=${"Outer Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof c=="number"?c:g}
                                @input=${l=>{var Y,q,U;const N=Number((U=(q=(Y=l.composedPath)==null?void 0:Y.call(l))==null?void 0:q[0])==null?void 0:U.value);isNaN(N)||(this._liveSegOuterOC=N)}}
                                @value-changed=${l=>{this._liveSegOuterOC=null,this._setConfigValue("elbow.segments.outer_segment.outer_curve",l.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("outer",A,g,i,d)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner Arc Radius"}
                        .helper=${y?"CSS expression: edit via YAML":`→ ${b.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...y?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${p}
                        @value-changed=${l=>this._handleSegCurveModeChange("elbow.segments.outer_segment.inner_curve",l.detail.value,Math.round(b),"clamp(15px, 2vw, 30px)",false)}>
                    </ha-selector>
                    ${y?this._renderCssField("Inner Arc Radius",m,"elbow.segments.outer_segment.inner_curve",Math.round(b)):p==="manual"?h`
                            <ha-selector .hass=${this.hass} .label=${"Inner Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof m=="number"?m:b}
                                @input=${l=>{var Y,q,U;const N=Number((U=(q=(Y=l.composedPath)==null?void 0:Y.call(l))==null?void 0:q[0])==null?void 0:U.value);isNaN(N)||(this._liveSegOuterIC=N)}}
                                @value-changed=${l=>{this._liveSegOuterIC=null,this._setConfigValue("elbow.segments.outer_segment.inner_curve",l.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("inner",p,b,i,d,g)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Curve Clamp"}
                        .helper=${{card:"card: clamp to card dimensions (default)",none:"none: no clamp; card clips SVG overflow",manual:`manual: ceiling at ${typeof E=="number"?E:100} px`}[f]??""}
                        .selector=${{select:{mode:"dropdown",options:[{value:"card",label:"card  (clamp to card size)"},{value:"none",label:"none  (no clamp; use with arm_max for paired elbows)"},{value:"manual",label:"manual  (explicit px ceiling)"}]}}}
                        .value=${f}
                        @value-changed=${l=>this._handleSegClampModeChange("elbow.segments.outer_segment.outer_curve_clamp",l.detail.value,100)}>
                    </ha-selector>
                    ${f==="manual"?h`
                        <ha-selector .hass=${this.hass} .label=${"Clamp Ceiling"}
                            .selector=${{number:{min:0,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof E=="number"?E:100}
                            @value-changed=${l=>this._setConfigValue("elbow.segments.outer_segment.outer_curve_clamp",l.detail.value)}>
                        </ha-selector>
                    `:""}
                </lcards-form-section>

                <!-- Inner segment curves subsection -->
                <lcards-form-section
                    header="Inner Segment"
                    icon="mdi:vector-square-open"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <ha-selector .hass=${this.hass}
                        .label=${"Outer Arc Radius"}
                        .helper=${L?"CSS expression: edit via YAML":`→ ${V.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:`auto  (concentric → ${z.toFixed(1)} px)`},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...L?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${W}
                        @value-changed=${l=>this._handleSegCurveModeChange("elbow.segments.inner_segment.outer_curve",l.detail.value,Math.round(V),"clamp(20px, 3vw, 45px)",true)}>
                    </ha-selector>
                    ${L?this._renderCssField("Outer Arc Radius",I,"elbow.segments.inner_segment.outer_curve",Math.round(V)):W==="manual"?h`
                            <ha-selector .hass=${this.hass} .label=${"Outer Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof I=="number"?I:V}
                                @input=${l=>{var Y,q,U;const N=Number((U=(q=(Y=l.composedPath)==null?void 0:Y.call(l))==null?void 0:q[0])==null?void 0:U.value);isNaN(N)||(this._liveSegInnerOC=N)}}
                                @value-changed=${l=>{this._liveSegInnerOC=null,this._setConfigValue("elbow.segments.inner_segment.outer_curve",l.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("outer",W,V,x,S)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner Arc Radius"}
                        .helper=${O?"CSS expression: edit via YAML":`→ ${j.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...O?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${Z}
                        @value-changed=${l=>this._handleSegCurveModeChange("elbow.segments.inner_segment.inner_curve",l.detail.value,Math.round(j),"clamp(10px, 1.5vw, 22px)",false)}>
                    </ha-selector>
                    ${O?this._renderCssField("Inner Arc Radius",F,"elbow.segments.inner_segment.inner_curve",Math.round(j)):Z==="manual"?h`
                            <ha-selector .hass=${this.hass} .label=${"Inner Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof F=="number"?F:j}
                                @input=${l=>{var Y,q,U;const N=Number((U=(q=(Y=l.composedPath)==null?void 0:Y.call(l))==null?void 0:q[0])==null?void 0:U.value);isNaN(N)||(this._liveSegInnerIC=N)}}
                                @value-changed=${l=>{this._liveSegInnerIC=null,this._setConfigValue("elbow.segments.inner_segment.inner_curve",l.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("inner",Z,j,x,S,V)}

                </lcards-form-section>
            </lcards-form-section>
        `}_renderSymbiontTab(){var d,_,u,c,$,v,A,g,m;const e=((d=this.config)==null?void 0:d.symbiont)||{},t=e.enabled||false,r=e.imprint||{},a=r.enabled!==false,o=r.border_radius||{},i=e.card?ae(e.card):"";return h`
            <div class="tab-content-container">
                ${fe({header:"How the symbiont card works",body:h`
                        <p>Any Home Assistant card can sit inside the elbow's content area.</p>
                        <ul>
                            <li><strong>Imprint</strong> gives it the elbow's background colour, text colour and font, without UIX.</li>
                            <li>A <code>uix</code> block on the embedded card still applies, but where both set the same property, imprint wins. Turn imprint off to let UIX style the card alone.</li>
                        </ul>
                    `})}

                <!-- Master Enable -->
                <lcards-form-section
                    header="Symbiont"
                    description="Embed another HA card inside the elbow content area"
                    icon="mdi:card-multiple"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Enable Symbiont"}
                        .helper=${"Embed another HA card in the elbow content area"}
                        .selector=${{boolean:{}}}
                        .value=${t}
                        @value-changed=${n=>this._setConfigValue("symbiont.enabled",n.detail.value)}>
                    </ha-selector>
                </lcards-form-section>

                ${t?h`

                    <!-- Embedded Card Selection -->
                    <lcards-form-section
                        header="Embedded Card"
                        description="Choose the card type and configure it"
                        icon="mdi:card-multiple-outline"
                        ?expanded=${true}
                        ?outlined=${true}>

                        ${e.card?h`
                            <div style="display:flex; align-items:center; gap:8px; padding: 4px 0 8px;">
                                <ha-icon icon="mdi:card-outline" style="color: var(--primary-color);"></ha-icon>
                                <span style="font-weight:500;">${e.card.type}</span>
                            </div>
                        `:h`
                            <lcards-message type="warning" message="No card selected. Use the button below to pick a card type.">
                            </lcards-message>
                        `}

                        <div style="display:flex; gap:8px; flex-wrap:wrap; padding-bottom:8px;">
                            <ha-button @click=${()=>this._openSymbiontCardPicker()}>
                                <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                                ${e.card?"Change Card Type":"Select Card Type"}
                            </ha-button>
                            ${e.card?h`
                                <ha-button
                                    .title=${"Open the card's own graphical editor"}
                                    @click=${()=>this._openSymbiontCardEditor()}>
                                    <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                                    Edit Card
                                </ha-button>
                                <ha-button
                                    .title=${"Clear selected card"}
                                    @click=${()=>this._setConfigValue("symbiont.card",void 0)}>
                                    <ha-icon icon="mdi:close" slot="start"></ha-icon>
                                    Remove Card
                                </ha-button>
                            `:""}
                        </div>

                        ${e.card?h`
                            <lcards-message type="info" message="Edit the full card configuration as YAML below. The card type field must remain as-is or use the 'Change Card Type' button above.">
                            </lcards-message>
                            <ha-code-editor
                                .hass=${this.hass}
                                .value=${i}
                                mode="yaml"
                                @value-changed=${n=>{const y=n.detail.value;clearTimeout(this._yamlDebounceTimer??void 0),this._yamlDebounceTimer=setTimeout(()=>{try{const p=ye(y);p&&typeof p=="object"&&this._setConfigValue("symbiont.card",p)}catch{}},750)}}>
                            </ha-code-editor>
                        `:""}
                    </lcards-form-section>

                    <!-- Container Behavior -->
                    <lcards-form-section
                        header="Container"
                        description="Overflow and scrolling behavior for the symbiont content area"
                        icon="mdi:dock-window"
                        ?expanded=${false}
                        ?outlined=${true}>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Overflow"}
                            .helper=${"Sets both axes unless overridden below. Default: hidden (clips content)."}
                            .selector=${{select:{mode:"dropdown",options:[{value:"hidden",label:"Hidden: clips content (default)"},{value:"visible",label:"Visible: content paints outside"},{value:"clip",label:"Clip: hard clip, no scroll"},{value:"scroll",label:"Scroll: always shows scrollbar"},{value:"auto",label:"Auto: scrollbar only when needed"}]}}}
                            .value=${e.overflow??"hidden"}
                            @value-changed=${n=>this._setConfigValue("symbiont.overflow",n.detail.value==="hidden"?void 0:n.detail.value)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Overflow X (horizontal)"}
                            .helper=${"Overrides the Overflow setting for the horizontal axis only."}
                            .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(inherit from Overflow)"},{value:"hidden",label:"Hidden"},{value:"visible",label:"Visible"},{value:"clip",label:"Clip"},{value:"scroll",label:"Scroll"},{value:"auto",label:"Auto"}]}}}
                            .value=${e.overflow_x??""}
                            @value-changed=${n=>this._setConfigValue("symbiont.overflow_x",n.detail.value||void 0)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Overflow Y (vertical)"}
                            .helper=${"Overrides the Overflow setting for the vertical axis only."}
                            .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(inherit from Overflow)"},{value:"hidden",label:"Hidden"},{value:"visible",label:"Visible"},{value:"clip",label:"Clip"},{value:"scroll",label:"Scroll"},{value:"auto",label:"Auto"}]}}}
                            .value=${e.overflow_y??""}
                            @value-changed=${n=>this._setConfigValue("symbiont.overflow_y",n.detail.value||void 0)}>
                        </ha-selector>
                    </lcards-form-section>

                    <!-- Position / Padding -->
                    <lcards-form-section
                        header="Position"
                        description="Additional padding inside the elbow content area (px, on top of bar offsets)"
                        icon="mdi:move-resize"
                        ?expanded=${false}
                        ?outlined=${true}>

                        <lcards-padding-editor
                            .editor=${this}
                            .config=${this.config}
                            path="symbiont.position"
                            label="Content Area Padding"
                            helper="Extra inset from each edge of the elbow content area (the card already starts inside the elbow bars automatically)">
                        </lcards-padding-editor>
                    </lcards-form-section>

                    <!-- Size & Anchor -->
                    <lcards-form-section
                        header="Size & Anchor"
                        description="Constrain the symbiont to an explicit size and anchor it within the content area"
                        icon="mdi:arrow-expand-all"
                        ?expanded=${false}
                        ?outlined=${true}>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Width"}
                            .helper=${'CSS width of the symbiont container, e.g. "50%" or "200px". Leave blank to fill the available area.'}
                            .selector=${{text:{}}}
                            .value=${((_=e.size)==null?void 0:_.width)??""}
                            @value-changed=${n=>this._setConfigValue("symbiont.size.width",n.detail.value||null)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Height"}
                            .helper=${'CSS height of the symbiont container, e.g. "50%" or "150px". Leave blank to fill the available area.'}
                            .selector=${{text:{}}}
                            .value=${((u=e.size)==null?void 0:u.height)??""}
                            @value-changed=${n=>this._setConfigValue("symbiont.size.height",n.detail.value||null)}>
                        </ha-selector>

                        ${((c=e.size)==null?void 0:c.width)!=null||(($=e.size)==null?void 0:$.height)!=null?h`
                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Anchor"}
                                .helper=${"Where to place the sized container within the content area"}
                                .selector=${{select:{mode:"dropdown",options:[{value:"top-left",label:"Top Left"},{value:"top-center",label:"Top Center"},{value:"top-right",label:"Top Right"},{value:"middle-left",label:"Middle Left"},{value:"center",label:"Center"},{value:"middle-right",label:"Middle Right"},{value:"bottom-left",label:"Bottom Left"},{value:"bottom-center",label:"Bottom Center"},{value:"bottom-right",label:"Bottom Right"}]}}}
                                .value=${e.anchor??"top-left"}
                                @value-changed=${n=>this._setConfigValue("symbiont.anchor",n.detail.value)}>
                            </ha-selector>
                        `:""}

                    </lcards-form-section>

                    <!-- Imprint -->
                    <lcards-form-section
                        header="Imprint"
                        description="Inject styles directly into the embedded card&#39;s shadow root"
                        icon="mdi:palette-swatch"
                        ?expanded=${true}
                        ?outlined=${true}>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Enable Imprint"}
                            .helper=${"Inject background color, text color, and font into the embedded card (no UIX required). Applied after any uix block on the embedded card, so imprint wins where both set the same property; turn this off to let UIX style the card alone."}
                            .selector=${{boolean:{}}}
                            .value=${a}
                            @value-changed=${n=>this._setConfigValue("symbiont.imprint.enabled",n.detail.value)}>
                        </ha-selector>

                        ${a?h`

                            <!-- Background Color -->
                            <lcards-form-section
                                header="Background Colour"
                                description="Background colour injected into the embedded card (state-aware)"
                                icon="mdi:format-color-fill"
                                ?expanded=${false}
                                ?outlined=${true}>

                                <lcards-color-section-v2
                                    .editor=${this}
                                    .entityId=${((v=this.config)==null?void 0:v.entity)||""}
                                    basePath="symbiont.imprint.background"
                                    header="Background"
                                    description="Background colour for each state: null = transparent (do not imprint)"
                                    .suggestedStates=${["default","active","inactive","zero","non_zero"]}
                                    ?allowCustomStates=${true}
                                    ?expanded=${false}>
                                </lcards-color-section-v2>
                            </lcards-form-section>

                            <!-- Text -->
                            <lcards-form-section
                                header="Text"
                                description="Text colour, font size, and font family"
                                icon="mdi:format-text"
                                ?expanded=${false}
                                ?outlined=${true}>

                                <lcards-color-section-v2
                                    .editor=${this}
                                    .entityId=${((A=this.config)==null?void 0:A.entity)||""}
                                    basePath="symbiont.imprint.text.color"
                                    header="Text Colour"
                                    description="Text colour for each state: null = do not imprint"
                                    .suggestedStates=${["default","active","inactive","zero","non_zero"]}
                                    ?allowCustomStates=${true}
                                    ?expanded=${false}>
                                </lcards-color-section-v2>

                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${"Font Size"}
                                    .helper=${'Font size injected into embedded card (e.g. "14px"). Leave empty to not imprint.'}
                                    .selector=${{text:{}}}
                                    .value=${((g=r.text)==null?void 0:g.font_size)||""}
                                    @value-changed=${n=>this._setConfigValue("symbiont.imprint.text.font_size",n.detail.value||void 0)}>
                                </ha-selector>

                                <lcards-font-selector
                                    .hass=${this.hass}
                                    .value=${((m=r.text)==null?void 0:m.font_family)||""}
                                    .showPreview=${true}
                                    .label=${"Font Family"}
                                    .helper=${"Font family injected into the embedded card. Leave empty to not imprint."}
                                    @value-changed=${n=>this._setConfigValue("symbiont.imprint.text.font_family",n.detail.value||void 0)}>
                                </lcards-font-selector>
                            </lcards-form-section>

                            <!-- Border Radius -->
                            <lcards-form-section
                                header="Border Radius"
                                description="Per-corner radius injected into the embedded card"
                                icon="mdi:rounded-corner"
                                ?expanded=${false}
                                ?outlined=${true}>

                                <lcards-message type="info" message="Each corner can be: Default (don't inject), Match (use elbow inner arc radius), or Custom (explicit px value).">
                                </lcards-message>

                                ${["top_left","top_right","bottom_left","bottom_right"].map(n=>{const y=n.replace(/_/g," ").replace(/\b\w/g,f=>f.toUpperCase()),p=o[n],b=p==="match"?"match":p==null?"default":"custom",E=typeof p=="number"?p:0;return h`
                                        <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--divider-color); overflow:hidden;">
                                            <span style="flex:0 0 90px; font-size:13px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${y}</span>
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{select:{mode:"dropdown",options:[{value:"default",label:"Default (no inject)"},{value:"match",label:"Match elbow arc"},{value:"custom",label:"Custom (px)"}]}}}
                                                .value=${b}
                                                style="flex:1; min-width:0;"
                                                @value-changed=${f=>{const x=f.detail.value;x==="default"?this._setConfigValue("symbiont.imprint.border_radius."+n,void 0):x==="match"?this._setConfigValue("symbiont.imprint.border_radius."+n,"match"):this._setConfigValue("symbiont.imprint.border_radius."+n,E)}}>
                                            </ha-selector>
                                            ${b==="custom"?h`
                                                <ha-selector
                                                    .hass=${this.hass}
                                                    .selector=${{number:{min:0,max:200,step:1,mode:"box",unit_of_measurement:"px"}}}
                                                    .value=${E}
                                                    style="flex:0 0 110px;"
                                                    @value-changed=${f=>this._setConfigValue("symbiont.imprint.border_radius."+n,f.detail.value)}>
                                                </ha-selector>
                                            `:""}
                                        </div>
                                    `})}
                            </lcards-form-section>

                        `:""}
                    </lcards-form-section>

                    <!-- Advanced / Custom Style -->
                    <lcards-form-section
                        header="Advanced"
                        description="Raw CSS injected into child card shadow root after imprint styles"
                        icon="mdi:code-tags"
                        ?expanded=${false}
                        ?outlined=${true}>

                        <lcards-message type="info" message="Raw CSS for the embedded card, applied after the imprint styles and after any uix block on the embedded card. Off when imprint is off.">
                        </lcards-message>

                        <ha-code-editor
                            .hass=${this.hass}
                            .value=${e.custom_style||""}
                            @value-changed=${n=>{const y=n.detail.value;clearTimeout(this._cssDebounceTimer??void 0),this._cssDebounceTimer=setTimeout(()=>{this._setConfigValue("symbiont.custom_style",y||void 0)},750)}}>
                        </ha-code-editor>
                    </lcards-form-section>

                `:""}
            </div>
        `}_buildAvailableZones(e){return Ce(e)}_renderTextTab(){var r,a,o;const e=((r=this.config)==null?void 0:r.text)||{},t={...this._buildAvailableZones(((a=this.config)==null?void 0:a.elbow)||{})};for(const i of Object.keys(((o=this.config)==null?void 0:o.zones)||{}))t[i]||(t[i]=i.replace(/_/g," ").replace(/\b\w/g,d=>d.toUpperCase()));return h`
            <lcards-multi-text-editor-v2
                .editor=${this}
                .text=${e}
                .hass=${this.hass}
                .availableZones=${t}
                @text-changed=${i=>{this.config={...this.config,text:i.detail.value},this._updateConfig(this.config,"visual")}}>
            </lcards-multi-text-editor-v2>
        `}_renderActionsTab(){var r;const e=this.config.interactive!==false,t=[{value:"pointer",label:"Pointer (hand), default"},{value:"default",label:"Default (arrow)"},{value:"none",label:"None (hidden)"},{value:"not-allowed",label:"Not allowed"},{value:"crosshair",label:"Crosshair"},{value:"grab",label:"Grab"},{value:"zoom-in",label:"Zoom in"},{value:"help",label:"Help"},{value:"wait",label:"Wait"},{value:"progress",label:"Progress"},{value:"move",label:"Move"},{value:"copy",label:"Copy"},{value:"text",label:"Text"}];return h`
            <lcards-form-section
                header="Hover & Cursor"
                icon="mdi:cursor-default-click"
                ?expanded=${true}>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Show hover effects (colour change & hover animations)"}
                    .helper=${"When off, mouse-over does not change the elbow colour or trigger hover animations. Tap/hold actions are unaffected."}
                    .selector=${{boolean:{}}}
                    .value=${e}
                    @value-changed=${a=>{this._updateConfig({interactive:a.detail.value!==false})}}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Cursor style"}
                    .helper=${"CSS cursor shown when hovering over the elbow. Leave blank to use the default (pointer when interactive, arrow when hover effects are off)."}
                    .selector=${{select:{mode:"dropdown",custom_value:true,options:t}}}
                    .value=${((r=this.config.style)==null?void 0:r.cursor)??""}
                    @value-changed=${a=>{const o=a.detail.value;if(o)this._updateConfig({style:{cursor:o}});else{const i={...this.config.style||{}};delete i.cursor,this._updateConfig({style:i})}}}>
                </ha-selector>
            </lcards-form-section>
            <lcards-multi-action-editor
                .hass=${this.hass}
                .actions=${{tap_action:this.config.tap_action,hold_action:this.config.hold_action,double_tap_action:this.config.double_tap_action}}
                @value-changed=${this._handleActionsChange}>
            </lcards-multi-action-editor>
        `}_isDiagonalCapType(){var t;return(((t=this.config.elbow)==null?void 0:t.type)||"header-left").includes("diagonal-cap")}_getElbowStyle(){var e;return((e=this.config.elbow)==null?void 0:e.style)||"simple"}_getInnerCurveHelperText(e,t){return t!==void 0?`Current: ${t}px (default would be ${e.toFixed(1)}px using LCARS formula: outer / 2)`:`LCARS formula: outer_curve / 2 = ${e.toFixed(1)}px (default if not specified)`}_handleElbowTypeChange(e){const t=e.detail.value;this._setConfigValue("elbow.type",t);const r=this._getElbowComponent(t),a=(r==null?void 0:r.features)||["simple"];this._getElbowStyle()==="segmented"&&!a.includes("segmented")&&(this._setConfigValue("elbow.style","simple"),this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:true,composed:true,detail:{message:"Style changed to Simple - selected component does not support Segmented mode",duration:3e3}})))}_handleStyleChange(e){var i;const t=e.detail.value,r=this._getElbowStyle();if(t===r)return;const a=ve({availablePresets:[],positionEnum:[]}),o={type:((i=this.config.elbow)==null?void 0:i.type)||"header-left",style:t};if(t==="simple"){const d=a.properties.elbow.properties.segment.default||{bar_width:90,bar_height:90,outer_curve:"auto"};o.segment={...d}}else{const d=a.properties.elbow.properties.segments.default||{gap:4,outer_segment:{bar_width:90,bar_height:90},inner_segment:{bar_width:60,bar_height:60}};o.segments=JSON.parse(JSON.stringify(d))}this._setConfigValue("elbow",o),this.requestUpdate()}_handleOuterCurveModeChange(e){var r,a;const t=e.detail.value;if(t!=="css"){if(t==="manual"){const o=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_width,i=typeof o=="number"?o:90;this._setConfigValue("elbow.segment.outer_curve",i/2)}else this._setConfigValue("elbow.segment.outer_curve",t==="arm_width"?"auto":t);this.requestUpdate()}}_renderSegmentedElbowReferenceDiagram(){return h`
            <svg viewBox="0 0 380 185" style="width: 100%; max-width: 480px; height: auto;" overflow="hidden">
                <defs>
                    <marker id="sgA" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="var(--secondary-text-color,#aaa)"/>
                    </marker>
                    <marker id="sgDH" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto-start-reverse">
                        <polygon points="0 0,8 2.5,0 5" fill="var(--secondary-text-color,#aaa)"/>
                    </marker>
                    <marker id="sgC" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#00CFFF"/>
                    </marker>
                    <marker id="sgB" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#5599FF"/>
                    </marker>
                    <marker id="sgO" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#FF8C00"/>
                    </marker>
                    <marker id="sgY" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#FFAA33"/>
                    </marker>
                </defs>

                <g transform="translate(120, 28)">
                    <!-- Card outline -->
                    <rect x="0" y="0" width="${230}" height="${140}" fill="none"
                          stroke="var(--divider-color,#333)" stroke-width="1" stroke-dasharray="3,2"/>

                    <!-- Outer segment (blue) -->
                    <path d="${"M 65 0 L 230 0 L 230 18 L 73 18 A 28 28 0 0 0 45 46 L 45 140 L 0 140 L 0 65 A 65 65 0 0 1 65 0 Z"}" fill="#5599FF" opacity="0.80"/>

                    <!-- Inner segment (orange) -->
                    <path d="${"M 82 22 L 230 22 L 230 33 L 90 33 A 13 13 0 0 0 77 46 L 77 140 L 49 140 L 49 55 A 33 33 0 0 1 82 22 Z"}" fill="#FF8C00" opacity="0.85"/>

                    <!-- outer seg. outer_curve arc — cyan -->
                    <path d="M ${65} 0 A ${65} ${65} 0 0 0 0 ${65}"
                          fill="none" stroke="#00CFFF" stroke-width="2" stroke-dasharray="5,3"/>
                    <line x1="-15" y1="18" x2="14" y2="18" stroke="#00CFFF" stroke-width="1.5" marker-end="url(#sgC)"/>
                    <text x="-17" y="13" fill="#00CFFF" font-size="11" text-anchor="end" font-family="monospace">outer_curve</text>
                    <text x="-17" y="25" fill="#00CFFF" font-size="9" text-anchor="end">outer seg.</text>

                    <!-- outer seg. inner_curve arc — blue -->
                    <path d="M ${73} ${18} A ${28} ${28} 0 0 0 ${45} ${46}"
                          fill="none" stroke="#5599FF" stroke-width="2" stroke-dasharray="5,3"/>
                    <line x1="-15" y1="40" x2="${65}" y2="${38}"
                          stroke="#5599FF" stroke-width="1.5" marker-end="url(#sgB)"/>
                    <text x="-17" y="36" fill="#5599FF" font-size="11" text-anchor="end" font-family="monospace">inner_curve</text>
                    <text x="-17" y="48" fill="#5599FF" font-size="9" text-anchor="end">outer seg.</text>

                    <!-- bar_width: horizontal double-headed arrow showing width of vertical arm -->
                    <line x1="0" y1="115" x2="${45}" y2="115"
                          stroke="var(--secondary-text-color,#aaa)" stroke-width="1.5"
                          marker-start="url(#sgDH)" marker-end="url(#sgDH)"/>
                    <line x1="0" y1="111" x2="0" y2="119" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <line x1="${45}" y1="111" x2="${45}" y2="119" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <text x="-6" y="110" fill="var(--primary-text-color,#fff)" font-size="11" text-anchor="end" font-family="monospace">bar_width</text>
                    <text x="-6" y="122" fill="var(--secondary-text-color,#aaa)" font-size="9" text-anchor="end">outer seg.</text>

                    <!-- bar_height: vertical double-headed arrow showing height of horizontal arm -->
                    <line x1="${205}" y1="0" x2="${205}" y2="${18}"
                          stroke="var(--secondary-text-color,#aaa)" stroke-width="1.5"
                          marker-start="url(#sgDH)" marker-end="url(#sgDH)"/>
                    <line x1="${201}" y1="0" x2="${209}" y2="0" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <line x1="${201}" y1="${18}" x2="${209}" y2="${18}" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <text x="${205}" y="-13" fill="var(--primary-text-color,#fff)" font-size="11" text-anchor="middle" font-family="monospace">bar_height</text>
                    <text x="${205}" y="-2" fill="var(--secondary-text-color,#aaa)" font-size="9" text-anchor="middle">outer seg.</text>

                    <!-- gap annotation: dashed guide at inner left edge + measurement label -->
                    <line x1="${49}" y1="${20}" x2="${49}" y2="${138}"
                          stroke="var(--divider-color,#555)" stroke-width="1" stroke-dasharray="2,2"/>
                    <line x1="${46}" y1="${140*.62}" x2="${48}" y2="${140*.62}"
                          stroke="var(--secondary-text-color,#888)" stroke-width="1.5"/>
                    <text x="${94/2}" y="${140*.62-4}" fill="var(--secondary-text-color,#aaa)"
                          font-size="9" text-anchor="middle" font-family="monospace">gap</text>

                    <!-- inner seg. outer_curve arc — orange, leader into content area -->
                    <path d="M ${82} ${22} A ${33} ${33} 0 0 0 ${49} ${55}"
                          fill="none" stroke="#FF8C00" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.9"/>
                    <line x1="${95}" y1="${69}" x2="${73}" y2="${46}"
                          stroke="#FF8C00" stroke-width="1.5" marker-end="url(#sgO)"/>
                    <text x="${97}" y="${66}" fill="#FF8C00" font-size="9" text-anchor="start">inner seg.</text>
                    <text x="${97}" y="${78}" fill="#FF8C00" font-size="11" text-anchor="start" font-family="monospace">outer_curve</text>

                    <!-- inner seg. inner_curve arc — amber, L-shaped leader routes below orange labels then up to arc -->
                    <path d="M ${90} ${33} A ${13} ${13} 0 0 0 ${77} ${46}"
                          fill="none" stroke="#FFAA33" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.9"/>
                    <polyline points="${159},${117} ${86},${117} ${86},${44}"
                              fill="none" stroke="#FFAA33" stroke-width="1.5" marker-end="url(#sgY)"/>
                    <text x="${161}" y="${104}" fill="#FFAA33" font-size="9" text-anchor="start">inner seg.</text>
                    <text x="${161}" y="${116}" fill="#FFAA33" font-size="11" text-anchor="start" font-family="monospace">inner_curve</text>
                </g>
            </svg>
        `}_renderSegmentedLivePreview(e,t,r,a,o,i,d,_,u,c,$,v,A,g=false,m=false){if(!r||!a)return h``;const n=Math.min(90/r,50/a,110/Math.max(e||1,1),2.5),y=r*n,p=a*n,b=e*n,E=Math.min(t*n,Math.max(0,b-.5)),f=Math.max(b+28,p*2.5,70),x=Math.max(y*2,170),S=typeof v=="number"&&v>0?v*n:null,M=typeof A=="number"&&A>0?A*n:null,s=c==="manual"&&typeof $=="number"?Math.min(b,$*n,f-1,x-1):c==="card"&&(S!==null||M!==null)?Math.min(b,S??1/0,M??1/0,f-1,x-1):Math.min(b,f-1,x-1),w=b>0?Math.max(0,E*(s/b)):0,R=S!==null&&S>2&&S<f,H=M!==null&&M>2&&M<x,X=R&&s>S,z=H&&s>M,I=s<b-.5?s/n:null,C=w<E-.5?w/n:null,L=`M ${s} 0 L ${x} 0 L ${x} ${p} L ${y+w} ${p} A ${w} ${w} 0 0 0 ${y} ${p+w} L ${y} ${f} L 0 ${f} L 0 ${s} A ${s} ${s} 0 0 1 ${s} 0 Z`,W=Math.max(u*n,4),V=d*n,F=_*n,T=y+W,O=p+W,Z=x-T,j=f-O,re=g?Math.max(0,w-u*n):o*n,D=Math.max(0,Math.min(re,j-.5,Z-.5)),P=g&&m?Math.max(0,Math.min(D/2,D-.5)):Math.max(0,Math.min(i*n,D-.5)),K=V>0&&F>0&&Z>V&&j>F,Q=K?`M ${T+D} ${O} L ${x} ${O} L ${x} ${O+F} L ${T+V+P} ${O+F} A ${P} ${P} 0 0 0 ${T+V} ${O+F+P} L ${T+V} ${f} L ${T} ${f} L ${T} ${O+D} A ${D} ${D} 0 0 1 ${T+D} ${O} Z`:null,ee=f+(K?74:46),te=x+20;return h`
            <svg viewBox="0 0 ${te} ${ee}" style="width: 100%; max-width: 380px; height: auto;" overflow="hidden">
                <g transform="translate(8, 6)">
                    <!-- Card background — makes the gap between segments visible -->
                    <rect x="0" y="0" width="${x}" height="${f}"
                          fill="var(--ha-card-background-color,var(--card-background-color,#1c1c2a))"
                          stroke="var(--divider-color,#444)" stroke-width="1" stroke-dasharray="4,3" rx="2"/>

                    <!-- Outer segment arms — blue, L-path naturally excludes the content area -->
                    <path d="${L}" fill="#5599FF" opacity="0.85"/>
                    <!-- outer outer_curve arc -->
                    <path d="M ${s} 0 A ${s} ${s} 0 0 0 0 ${s}"
                          fill="none" stroke="#00CFFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    <!-- outer inner_curve arc -->
                    ${w>2?B`
                        <path d="M ${y+w} ${p} A ${w} ${w} 0 0 0 ${y} ${p+w}"
                              fill="none" stroke="#5599FF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    `:""}

                    <!-- Inner segment — orange, sits inside the gap -->
                    ${K?B`
                        <path d="${Q}" fill="#FF8C00" opacity="0.85"/>
                        <!-- inner outer_curve arc -->
                        ${D>2?B`
                            <path d="M ${T+D} ${O} A ${D} ${D} 0 0 0 ${T} ${O+D}"
                                  fill="none" stroke="#FF8C00" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.85"/>
                        `:""}
                        <!-- inner inner_curve arc -->
                        ${P>2?B`
                            <path d="M ${T+V+P} ${O+F} A ${P} ${P} 0 0 0 ${T+V} ${O+F+P}"
                                  fill="none" stroke="#FFAA33" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                        `:""}
                    `:""}

                    <!-- Card boundary lines — dashed line + faint overlay shows what the card clips -->
                    ${R?B`
                        ${X?B`
                            <rect x="0" y="${S}" width="${x}" height="${f-S}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="0" y1="${S}" x2="${x}" y2="${S}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${x-3}" y="${S-3}" fill="#FF4444" font-size="8" text-anchor="end" opacity="0.9">↕ ${v}px</text>
                    `:""}
                    ${H?B`
                        ${z?B`
                            <rect x="${M}" y="0" width="${x-M}" height="${f}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="${M}" y1="0" x2="${M}" y2="${f}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${M+3}" y="10" fill="#FF4444" font-size="8" text-anchor="start" opacity="0.9">↔ ${A}px</text>
                    `:""}

                    <!-- Clamp indicator (bottom-right) -->
                    ${c==="none"?B`
                        <text x="${x-2}" y="${f-5}" fill="#7BCF7B" font-size="9" text-anchor="end" opacity="0.8">no clamp</text>
                    `:c==="card"?B`
                        <text x="${x-2}" y="${f-5}" fill="var(--secondary-text-color,#888)" font-size="9" text-anchor="end" opacity="0.7">card clamp</text>
                    `:B`
                        <text x="${x-2}" y="${f-5}" fill="var(--warning-color,#FFA500)" font-size="9" text-anchor="end" opacity="0.8">fixed clamp</text>
                    `}

                    <!-- Legend -->
                    <circle cx="4" cy="${f+14}" r="4" fill="#00CFFF" opacity="0.9"/>
                    <text x="12" y="${f+18}" fill="#00CFFF" font-size="9" font-family="monospace">outer_curve = ${I!==null?`${e.toFixed(1)}→${I.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>
                    <circle cx="4" cy="${f+30}" r="4" fill="#5599FF" opacity="0.9"/>
                    <text x="12" y="${f+34}" fill="#5599FF" font-size="9" font-family="monospace">inner_curve = ${C!==null?`${t.toFixed(1)}→${C.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                    ${K?B`
                        <circle cx="4" cy="${f+46}" r="4" fill="#FF8C00" opacity="0.9"/>
                        <text x="12" y="${f+50}" fill="#FF8C00" font-size="9" font-family="monospace">outer_curve = ${g?`${(D/n).toFixed(1)}px`:`${o.toFixed(1)}px`}</text>
                        <circle cx="4" cy="${f+62}" r="4" fill="#FFAA33" opacity="0.9"/>
                        <text x="12" y="${f+66}" fill="#FFAA33" font-size="9" font-family="monospace">inner_curve = ${g&&m?`${(P/n).toFixed(1)}px`:`${i.toFixed(1)}px`}</text>
                    `:""}
                </g>
            </svg>
        `}_renderElbowReferenceDiagram(){return h`
            <svg viewBox="0 0 380 185" style="width: 100%; max-width: 480px; height: auto;" overflow="hidden">
                <defs>
                    <marker id="rda" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="var(--secondary-text-color,#aaa)"/>
                    </marker>
                    <marker id="rdaDH" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto-start-reverse">
                        <polygon points="0 0,8 2.5,0 5" fill="var(--secondary-text-color,#aaa)"/>
                    </marker>
                    <marker id="rdc" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#00CFFF"/>
                    </marker>
                    <marker id="rdy" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#FFAA33"/>
                    </marker>
                </defs>

                <g transform="translate(120, 28)">
                    <!-- Elbow fill -->
                    <path d="${"M 60 0 L 230 0 L 230 22 L 110 22 A 30 30 0 0 0 80 52 L 80 140 L 0 140 L 0 60 A 60 60 0 0 1 60 0 Z"}" fill="var(--primary-color,#FF9900)" opacity="0.75"/>

                    <!-- bar_width: horizontal double-headed arrow showing width (thickness) of vertical arm -->
                    <line x1="0" y1="115" x2="${80}" y2="115"
                          stroke="var(--secondary-text-color,#aaa)" stroke-width="1.5"
                          marker-start="url(#rdaDH)" marker-end="url(#rdaDH)"/>
                    <line x1="0" y1="111" x2="0" y2="119" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <line x1="${80}" y1="111" x2="${80}" y2="119" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <text x="-6" y="110" fill="var(--primary-text-color,#fff)" font-size="11" text-anchor="end" font-family="monospace">bar_width</text>
                    <text x="-6" y="122" fill="var(--secondary-text-color,#aaa)" font-size="9" text-anchor="end">vertical arm</text>

                    <!-- bar_height: vertical double-headed arrow showing height (thickness) of horizontal arm -->
                    <line x1="${205}" y1="0" x2="${205}" y2="${22}"
                          stroke="var(--secondary-text-color,#aaa)" stroke-width="1.5"
                          marker-start="url(#rdaDH)" marker-end="url(#rdaDH)"/>
                    <line x1="${201}" y1="0" x2="${209}" y2="0" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <line x1="${201}" y1="${22}" x2="${209}" y2="${22}" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <text x="${205}" y="-13" fill="var(--primary-text-color,#fff)" font-size="11" text-anchor="middle" font-family="monospace">bar_height</text>
                    <text x="${205}" y="-2" fill="var(--secondary-text-color,#aaa)" font-size="9" text-anchor="middle">horiz. arm</text>

                    <!-- outer_curve arc highlight — leader line points at arc midpoint (18,18) -->
                    <path d="M ${60} 0 A ${60} ${60} 0 0 0 0 ${60}"
                          fill="none" stroke="#00CFFF" stroke-width="2.5" stroke-dasharray="5,3"/>
                    <line x1="-15" y1="18" x2="14" y2="18" stroke="#00CFFF" stroke-width="1.5" marker-end="url(#rdc)"/>
                    <text x="-17" y="13" fill="#00CFFF" font-size="11" text-anchor="end" font-family="monospace">outer_curve</text>
                    <text x="-17" y="25" fill="#4DDDFF" font-size="9" text-anchor="end">sweep radius</text>

                    <!-- inner_curve arc highlight -->
                    <path d="M ${110} ${22} A ${30} ${30} 0 0 0 ${80} ${52}"
                          fill="none" stroke="#FFAA33" stroke-width="2.5" stroke-dasharray="5,3"/>
                    <line x1="${80}" y1="${52}" x2="${110}" y2="${82}" stroke="#FFAA33" stroke-width="1.5" marker-end="url(#rdy)"/>
                    <text x="${112}" y="${87}" fill="#FFAA33" font-size="11" text-anchor="start" font-family="monospace">inner_curve</text>
                    <text x="${112}" y="${99}" fill="#FFCC77" font-size="9" text-anchor="start">concave corner</text>
                </g>
            </svg>
        `}_renderCurveLivePreview(e,t,r,a,o,i,d,_){const u=Math.min(90/r,50/a,110/(e||1),2.5),c=r*u,$=a*u,v=e*u,A=Math.min(t*u,v-.5),g=Math.max(v+28,$*2.5,70),m=Math.max(c*2,170),n=typeof d=="number"&&d>0?d*u:null,y=typeof _=="number"&&_>0?_*u:null,p=o==="manual"&&typeof i=="number"?Math.min(v,i*u,g-1,m-1):o==="card"&&(n!==null||y!==null)?Math.min(v,n??1/0,y??1/0,g-1,m-1):Math.min(v,g-1,m-1),b=v>0?Math.max(0,A*(p/v)):0,E=n!==null&&n>2&&n<g,f=y!==null&&y>2&&y<m,x=E&&p>n,S=f&&p>y,M=p<v-.5?p/u:null,s=b<A-.5?b/u:null,w=`M ${p} 0 L ${m} 0 L ${m} ${$} L ${c+b} ${$} A ${b} ${b} 0 0 0 ${c} ${$+b} L ${c} ${g} L 0 ${g} L 0 ${p} A ${p} ${p} 0 0 1 ${p} 0 Z`,R=p>40?p/2-4:p+8,H=p>40?p/2-4:4,X=c+b/2,z=$+b+14,I=g+44,C=m+20;return h`
            <svg viewBox="0 0 ${C} ${I}" style="width: 100%; max-width: 380px; height: auto;" overflow="hidden">
                <defs>
                    <marker id="lpa" markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
                        <polygon points="0 0,7 2.5,0 5" fill="#00CFFF"/>
                    </marker>
                    <marker id="lpb" markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
                        <polygon points="0 0,7 2.5,0 5" fill="#FFAA33"/>
                    </marker>
                </defs>

                <g transform="translate(8, 6)">
                    <!-- Card outline -->
                    <rect x="0" y="0" width="${m}" height="${g}"
                          fill="none" stroke="var(--divider-color,#444)" stroke-width="1" stroke-dasharray="4,3" rx="2"/>

                    <!-- Elbow fill -->
                    <path d="${w}" fill="var(--primary-color,#FF9900)" opacity="0.8"/>

                    <!-- Outer arc annotation -->
                    <path d="M ${p} 0 A ${p} ${p} 0 0 0 0 ${p}"
                          fill="none" stroke="#00CFFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    <text x="${R}" y="${H}"
                          fill="#00CFFF" font-size="10" text-anchor="middle" font-family="monospace"
                          dominant-baseline="auto">${M!==null?`${e.toFixed(1)}→${M.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>

                    <!-- Inner arc annotation -->
                    <path d="M ${c+b} ${$} A ${b} ${b} 0 0 0 ${c} ${$+b}"
                          fill="none" stroke="#FFAA33" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    ${b>6?B`
                        <text x="${X}" y="${z}"
                              fill="#FFAA33" font-size="10" text-anchor="middle" font-family="monospace">${s!==null?`${t.toFixed(1)}→${s.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                    `:""}

                    <!-- Card boundary lines — dashed line + faint overlay shows what the card clips -->
                    ${E?B`
                        ${x?B`
                            <rect x="0" y="${n}" width="${m}" height="${g-n}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="0" y1="${n}" x2="${m}" y2="${n}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${m-3}" y="${n-3}" fill="#FF4444" font-size="8" text-anchor="end" opacity="0.9">↕ ${d}px</text>
                    `:""}
                    ${f?B`
                        ${S?B`
                            <rect x="${y}" y="0" width="${m-y}" height="${g}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="${y}" y1="0" x2="${y}" y2="${g}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${y+3}" y="10" fill="#FF4444" font-size="8" text-anchor="start" opacity="0.9">↔ ${_}px</text>
                    `:""}

                    <!-- Clamp-mode indicator (bottom-right) -->
                    ${o==="none"?B`
                        <text x="${m-2}" y="${g-5}" fill="#7BCF7B" font-size="9" text-anchor="end" opacity="0.8">no clamp</text>
                    `:o==="card"?B`
                        <text x="${m-2}" y="${g-5}" fill="var(--secondary-text-color,#888)" font-size="9" text-anchor="end" opacity="0.7">card clamp</text>
                    `:B`
                        <text x="${m-2}" y="${g-5}" fill="var(--warning-color,#FFA500)" font-size="9" text-anchor="end" opacity="0.8">fixed clamp</text>
                    `}

                    <!-- Legend row below card -->
                    <circle cx="4" cy="${g+14}" r="4" fill="#00CFFF" opacity="0.9"/>
                    <text x="12" y="${g+18}" fill="#00CFFF" font-size="10" font-family="monospace">outer_curve = ${M!==null?`${e.toFixed(1)}→${M.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>
                    <circle cx="4" cy="${g+30}" r="4" fill="#FFAA33" opacity="0.9"/>
                    <text x="12" y="${g+34}" fill="#FFAA33" font-size="10" font-family="monospace">inner_curve = ${s!==null?`${t.toFixed(1)}→${s.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                </g>
            </svg>
        `}_renderCurveModeMessage(e,t,r,a,o,i){const d=k(c=>c.toFixed(1),"f"),u=(e==="outer"?{auto:`bar_width ÷ 2 = ${d(a/2)} px. Classic LCARS sweep from the vertical arm.`,arm_height:`bar_height ÷ 2 = ${d(o/2)} px. Based on the horizontal arm: ${o<a?"smaller than auto for this config":"useful when bar_height is the dominant arm"}.`,arm_max:`max(${a}, ${o}) ÷ 2 = ${d(Math.max(a,o)/2)} px. Uses the larger arm; same as auto when bar_width ≥ bar_height. Recommended for consistent paired elbows.`,arm_min:`min(${a}, ${o}) ÷ 2 = ${d(Math.min(a,o)/2)} px. Tightest arc, based on the thinner arm. ${a!==o?"Significantly smaller than auto for asymmetric bars.":"Equal bars: same as auto."}`,arm_fill:`max(${a}, ${o}) = ${d(Math.max(a,o))} px. Maximum sweep: fills the entire dominant arm. Dramatic effect; arc may be clipped by the card edge.`}:{auto:`outer_curve ÷ 2 = ${d((i||r*2)/2)} px. LCARS concentric formula: matches the outer arc's curvature family.`,arm_max:`max(${a}, ${o}) ÷ 2 = ${d(Math.max(a,o)/2)} px. Independent of outer_curve, based on the larger arm.`,arm_width:`bar_width ÷ 2 = ${d(a/2)} px. Based on the vertical arm width.`,arm_height:`bar_height ÷ 2 = ${d(o/2)} px. Based on the horizontal arm: ${o<a?"tighter than arm_width for this config":"same as arm_width for this config"}.`,arm_min:`min(${a}, ${o}) ÷ 2 = ${d(Math.min(a,o)/2)} px. Tightest inner arc.`,arm_fill:`max(${a}, ${o}) = ${d(Math.max(a,o))} px. Very large inner arc; likely exceeds the outer. Use with care.`})[t];return u?h`
            <lcards-message type="info" message="${u}"></lcards-message>
        `:""}_handleInnerCurveModeChange(e){var r;const t=e.detail.value;if(t!=="css"){if(t==="manual"){const a=((r=this.config.elbow)==null?void 0:r.segment)||{},o=typeof a.bar_width=="number"?a.bar_width:90;this._setConfigValue("elbow.segment.inner_curve",Math.round(o/4))}else t==="auto"?this._setConfigValue("elbow.segment.inner_curve",void 0):this._setConfigValue("elbow.segment.inner_curve",t);this.requestUpdate()}}_handleClampModeChange(e){const t=e.detail.value;t==="manual"?this._setConfigValue("elbow.segment.outer_curve_clamp",60):t==="card"?this._setConfigValue("elbow.segment.outer_curve_clamp",void 0):this._setConfigValue("elbow.segment.outer_curve_clamp",t),this.requestUpdate()}_handleSegCurveModeChange(e,t,r,a,o){t==="manual"?this._setConfigValue(e,r):t==="css"?this._setConfigValue(e,a):t==="auto"?this._setConfigValue(e,void 0):this._setConfigValue(e,o&&t==="arm_width"?"auto":t),this.requestUpdate()}_handleSegClampModeChange(e,t,r){t==="manual"?this._setConfigValue(e,r):t==="card"?this._setConfigValue(e,void 0):this._setConfigValue(e,t),this.requestUpdate()}_handleDimModeChange(e,t,r,a){e==="css"?this._setConfigValue(t,a):this._setConfigValue(t,r),this.requestUpdate()}_handleBarWidthModeChange(e){var r,a;const t=e.detail.value;if(t==="css")this._setConfigValue("elbow.segment.bar_width","clamp(60px, 8vw, 120px)");else if(t==="theme")this._setConfigValue("elbow.segment.bar_width","theme");else{const o=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_width,i=typeof o=="number"?o:90;this._setConfigValue("elbow.segment.bar_width",i)}this.requestUpdate()}_handleBarHeightModeChange(e){var r,a;const t=e.detail.value;if(t==="css"){this._setConfigValue("elbow.segment.bar_height","clamp(40px, 6vh, 90px)"),this.requestUpdate();return}if(t==="theme")this._setConfigValue("elbow.segment.bar_height","theme");else{const o=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_height,i=typeof o=="number"?o:90;this._setConfigValue("elbow.segment.bar_height",i)}this.requestUpdate()}_handleInnerOuterCurveToggle(e){var r,a,o;if(e.detail.value){const i=this._calculateInnerOuterCurveAuto();this._setConfigValue("elbow.segments.inner_segment.outer_curve",i)}else{const i={...this.config};((o=(a=(r=i.elbow)==null?void 0:r.segments)==null?void 0:a.inner_segment)==null?void 0:o.outer_curve)!==void 0&&(delete i.elbow.segments.inner_segment.outer_curve,this.config=i,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true})))}this.requestUpdate()}_handleDiagonalAngleModeChange(e){var r,a;if(e.detail.value==="theme")this._setConfigValue("elbow.segment.diagonal_angle","theme");else{const o=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.diagonal_angle,i=typeof o=="number"?o:45;this._setConfigValue("elbow.segment.diagonal_angle",i)}this.requestUpdate()}_handleOuterDiagonalAngleModeChange(e){var r,a,o;if(e.detail.value==="theme")this._setConfigValue("elbow.segments.outer_segment.diagonal_angle","theme");else{const i=(o=(a=(r=this.config.elbow)==null?void 0:r.segments)==null?void 0:a.outer_segment)==null?void 0:o.diagonal_angle,d=typeof i=="number"?i:45;this._setConfigValue("elbow.segments.outer_segment.diagonal_angle",d)}this.requestUpdate()}_handleInnerDiagonalAngleModeChange(e){var r,a,o,i,d,_;if(e.detail.value==="theme")this._setConfigValue("elbow.segments.inner_segment.diagonal_angle","theme");else{const u=(o=(a=(r=this.config.elbow)==null?void 0:r.segments)==null?void 0:a.inner_segment)==null?void 0:o.diagonal_angle,c=(_=(d=(i=this.config.elbow)==null?void 0:i.segments)==null?void 0:d.outer_segment)==null?void 0:_.diagonal_angle,$=typeof u=="number"?u:typeof c=="number"?c:45;this._setConfigValue("elbow.segments.inner_segment.diagonal_angle",$)}this.requestUpdate()}_calculateInnerOuterCurveAuto(){var i,d,_,u,c,$,v;const e=((d=(i=this.config.elbow)==null?void 0:i.segments)==null?void 0:d.outer_segment)||{},t=((u=(_=this.config.elbow)==null?void 0:_.segments)==null?void 0:u.gap)??4,r=e.bar_width??90,a=((v=($=(c=this.config.elbow)==null?void 0:c.segments)==null?void 0:$.inner_segment)==null?void 0:v.bar_width)??60,o=e.outer_curve??r/2;return Math.max(0,o-t-a)}_handleActionsChange(e){const t=e.detail.value,r={};t.tap_action&&(r.tap_action=t.tap_action),t.hold_action&&(r.hold_action=t.hold_action),t.double_tap_action&&(r.double_tap_action=t.double_tap_action);const a={...this.config,...r};!t.tap_action&&this.config.tap_action&&delete a.tap_action,!t.hold_action&&this.config.hold_action&&delete a.hold_action,!t.double_tap_action&&this.config.double_tap_action&&delete a.double_tap_action,this.config=a,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true}))}_deleteConfigValue(e){const t={...this.config},r=e.split(".");let a=t;for(let o=0;o<r.length-1;o++){if(!a[r[o]])return;a=a[r[o]]}delete a[r[r.length-1]],this.config=t,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true}))}_renderEffectsTab(){return h`
            <div class="tab-content-container">
                ${fe({header:"Combining effects",icon:"mdi:lightbulb-outline",body:h`
                        <p>Animations and filters work together. A few ideas:</p>
                        <ul>
                            <li>A <strong>glow</strong> filter with a <strong>pulse</strong> animation, for a breathing light.</li>
                            <li><strong>Blur</strong> and <strong>brightness</strong> filters with <strong>hover</strong> animations, for depth.</li>
                            <li><strong>SVG filters</strong> for displacement maps, morphology and more.</li>
                        </ul>
                    `})}

                <!-- Animations Section -->
                <lcards-form-section
                    header="Animations"
                    description="Trigger visual animations on user interactions or entity state changes"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this.config.animations||[]}
                        .cardElement=${this._cardElement}
                        @animations-changed=${e=>{this._updateConfig({animations:e.detail.value})}}>
                    </lcards-animation-editor>
                </lcards-form-section>

                <!-- Filters Section -->
                <lcards-form-section
                    header="Filters"
                    description="Apply visual filters to the entire elbow (CSS and SVG filter primitives)"
                    icon="mdi:auto-fix"
                    ?expanded=${true}>

                    <lcards-filter-editor
                        .hass=${this.hass}
                        .filters=${this.config.filters||[]}
                        @filters-changed=${e=>{this._updateConfig({filters:e.detail.value})}}>
                    </lcards-filter-editor>
                </lcards-form-section>

                <!-- Background Animation Section -->
                <lcards-form-section
                    header="Background Animation"
                    description="Animated canvas backgrounds (grids, hexagons, diagonals, nebulas, starfields, etc.)"
                    icon="mdi:grid"
                    ?expanded=${true}>

                    <lcards-background-animation-editor
                        .hass=${this.hass}
                        .config=${this.config.background_animation??[]}
                        @effects-changed=${e=>{const t={...this.config};delete t.background_animation,this.config=t,this._updateConfig({background_animation:e.detail.value})}}>
                    </lcards-background-animation-editor>

                </lcards-form-section>
            </div>
        `}_parseStylePx(e){if(typeof e!="string")return null;const t=e.match(/^(\d+(?:\.\d+)?)px$/);return t?parseFloat(t[1]):null}};k(ne,"LCARdSElbowEditor");let ie=ne;customElements.get("lcards-elbow-editor")||customElements.define("lcards-elbow-editor",ie);export{ie as LCARdSElbowEditor};
//# sourceMappingURL=lcards-elbow-editor-6CD80PeL.js.map
