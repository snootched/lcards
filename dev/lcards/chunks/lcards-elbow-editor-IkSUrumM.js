var $e=Object.defineProperty;var S=(G,e)=>$e(G,"name",{value:e,configurable:true});import{l as J,e as _e,m as fe,c as ve,b as h,p as xe,g as ye,w as B,f as oe}from"./lcards-main-C148JfkA.js";import{a as we,L as Ce}from"./LCARdSBaseEditor-B4auBUbY.js";import{e as Se}from"./lcards-shape-texture-editor-Du4klWpM.js";import{c as ae,y as Fe}from"./yaml-docs-links-UEyTsmzQ.js";import{r as be}from"./lcards-message-CF99Ox_M.js";import"./lcards-yaml-editor-iu3_W6QT.js";import"./lcards-form-section-BK3OqcgA.js";import"./lcards-grid-layout-b0hMIlJ5.js";import"./lcards-color-section-v2-C5igfe56.js";import"./lcards-multi-action-editor-DZe0u7V-.js";import"./lcards-padding-editor-4S4gFB_Y.js";import"./lcards-filter-editor-DfBGkiTg.js";import"./lcards-background-animation-editor-8VgPdunD.js";import"./lcards-rules-dashboard-fM5MTKXY.js";import"./lcards-datasource-editor-tab-Ci4owBRi.js";import"./lcards-provenance-tab-K9EwZdp4.js";const ke=[["top","Top"],["bottom","Bottom"],["left","Left"],["right","Right"]];function Ae(G={}){return{body:G.type==="frame"?"Body (interior)":"Body (open area)",full:"Full (entire card)",...Me(G)}}S(Ae,"elbowEditorZones");function Me(G){const e=G.type||"header-left",t=G.style||"simple";if(e==="frame"){const r=G.frame||{},a={};for(const[i,o]of ke){const c=r[i]||{},$=c.bar_width??c.bar_height??c.thickness;c.enabled===false||$===0||(a[i]=o)}return a}return t==="segmented"?{outer_vertical_bar:"Outer Vertical Bar",inner_vertical_bar:"Inner Vertical Bar",outer_horizontal_bar:"Outer Horizontal Bar",inner_horizontal_bar:"Inner Horizontal Bar"}:e.endsWith("-open")?{horizontal_bar:"Horizontal Bar"}:e.endsWith("-contained")?{left_bar:"Left Bar",right_bar:"Right Bar",horizontal_bar:"Horizontal Bar"}:{vertical_bar:"Vertical Bar",horizontal_bar:"Horizontal Bar"}}S(Me,"shapeZones");const se=class se2 extends we{static get properties(){return{...super.properties,_liveOuterCurve:{type:Number,state:true},_liveInnerCurve:{type:Number,state:true},_liveSegOuterOC:{type:Number,state:true},_liveSegOuterIC:{type:Number,state:true},_liveSegInnerOC:{type:Number,state:true},_liveSegInnerIC:{type:Number,state:true},_segCurveTab:{type:String,state:true}}}constructor(){super(),this.cardType="elbow",this._cardElement=null,this._symbioCardPickerDialogRef=null,this._symbioCardEditorDialogRef=null,this._yamlDebounceTimer=null,this._cssDebounceTimer=null,this._liveOuterCurve=null,this._liveInnerCurve=null,this._liveSegOuterOC=null,this._liveSegOuterIC=null,this._liveSegInnerOC=null,this._liveSegInnerIC=null,this._segCurveTab="outer"}firstUpdated(){var e;(e=super.firstUpdated)==null||e.call(this,{}),this._tryFindCardElement()}_tryFindCardElement(){let e=0;const t=10,r=S(()=>{e++,this._findCardElement(),!this._cardElement&&e<t&&requestAnimationFrame(r)},"tryFind");requestAnimationFrame(r)}_findCardElement(){var a;const e=`lcards-${this.cardType}`;if((a=this._cardElement)!=null&&a.isConnected)return;let t=null;const r=this.closest(".wrapper");if(r){const i=r.getRootNode();if(i instanceof ShadowRoot){const o=i.host;if(o){const c=o.parentElement;if(c){const $=c.parentElement;if($){const m=$.querySelector(".element-preview");if(m){const l=S((v,x=0)=>{if(x>5)return null;const I=v.querySelector(e);if(I)return I;const g=v.querySelectorAll("*");for(const u of g)if(u.shadowRoot){const n=l(u.shadowRoot,x+1);if(n)return n}return null},"searchInShadows");t=m.querySelector(e)||l(m)}}}}}}if(!t&&(t=document.querySelector(e),!t)){for(const i of document.querySelectorAll("*"))if(i.shadowRoot&&(t=i.shadowRoot.querySelector(e),t))break}t&&t!==this._cardElement&&(this._cardElement=t,this.requestUpdate())}connectedCallback(){var e;(e=super.connectedCallback)==null||e.call(this),this._boundHandleCardPickerResult=this._handleSymbiontCardPickerResult.bind(this),document.addEventListener("lcards-symbiont-card-picker-result",this._boundHandleCardPickerResult)}disconnectedCallback(){var e;(e=super.disconnectedCallback)==null||e.call(this),this._boundHandleCardPickerResult&&document.removeEventListener("lcards-symbiont-card-picker-result",this._boundHandleCardPickerResult),this._symbioCardPickerDialogRef&&(this._symbioCardPickerDialogRef.remove(),this._symbioCardPickerDialogRef=null),this._symbioCardEditorDialogRef&&(this._symbioCardEditorDialogRef.remove(),this._symbioCardEditorDialogRef=null),clearTimeout(this._yamlDebounceTimer??void 0),clearTimeout(this._cssDebounceTimer??void 0)}static get styles(){return[super.styles,Se]}_getTabDefinitions(){return[{label:"Config",content:S(()=>this._renderFromConfig(this._getConfigTabConfig()),"content")},{label:"Elbow Design",content:S(()=>this._renderElbowDesignTab(),"content")},{label:"Zones",content:S(()=>this._renderZonesTab(),"content")},{label:"Text",content:S(()=>this._renderTextTab(),"content")},{label:"Symbiont",content:S(()=>this._renderSymbiontTab(),"content")},{label:"Actions",content:S(()=>this._renderActionsTab(),"content")},{label:"Effects",content:S(()=>this._renderEffectsTab(),"content")},{label:"Sound",content:S(()=>this._renderSoundTab(["card_tap","card_hold","card_double_tap","card_hover","toggle_on","toggle_off"]),"content")},...this._getUtilityTabs()]}async _openSymbiontCardPicker(){var r;if(!customElements.get("hui-card-picker")){J.warn('[ElbowEditor] hui-card-picker not loaded yet. Click "Add Card" on the dashboard once to prime it, then try again.'),_e({title:"Card picker not ready",message:"Home Assistant hasn’t loaded its card picker yet. On any dashboard, click “Add card” once (you can cancel it), then come back and try again."});return}this._symbioCardPickerDialogRef&&(this._symbioCardPickerDialogRef.remove(),this._symbioCardPickerDialogRef=null);const e=document.createElement("ha-dialog");e.headerTitle="Select Symbiont Card Type",this._symbioCardPickerDialogRef=e,fe(e,this),e.open=true,await e.updateComplete;const t=document.createElement("hui-card-picker");t.hass=this.hass,t.lovelace=this._getSymbiontLovelace(),t.style.cssText="padding: 24px; display: block;",e.appendChild(t),await new Promise(a=>setTimeout(a,100)),(r=t.requestUpdate)==null||r.call(t),t.updateComplete&&await t.updateComplete,t.addEventListener("config-changed",a=>{var o;const i=(o=a.detail)==null?void 0:o.config;J.debug("[ElbowEditor] Symbiont card type selected:",i==null?void 0:i.type),document.dispatchEvent(new CustomEvent("lcards-symbiont-card-picker-result",{detail:{config:i}})),e.open=false}),e.addEventListener("closed",()=>{e.remove(),this._symbioCardPickerDialogRef===e&&(this._symbioCardPickerDialogRef=null)})}_handleSymbiontCardPickerResult(e){var r;const t=(r=e.detail)==null?void 0:r.config;t&&(J.debug("[ElbowEditor] Applying symbiont card config from picker:",t.type),this._setConfigValue("symbiont.card",t))}async _openSymbiontCardEditor(){var $,m;const e=(m=($=this.config)==null?void 0:$.symbiont)==null?void 0:m.card;if(!(e!=null&&e.type))return;if(!customElements.get("hui-card-element-editor")){J.warn("[ElbowEditor] hui-card-element-editor not available yet");return}this._symbioCardEditorDialogRef&&(this._symbioCardEditorDialogRef.remove(),this._symbioCardEditorDialogRef=null);const t=document.createElement("ha-dialog");t.headerTitle=`Edit: ${e.type}`,t.setAttribute("prevent-scrim-close",""),this._symbioCardEditorDialogRef=t;const r=document.createElement("div");r.style.cssText="padding: 16px; min-height: 300px; min-width: 420px; box-sizing: border-box;";const a=document.createElement("hui-card-element-editor");a.hass=this.hass,a.lovelace=this._getSymbiontLovelace(),a.value=JSON.parse(JSON.stringify(e));let i=JSON.parse(JSON.stringify(e));a.addEventListener("config-changed",l=>{var v;(v=l.detail)!=null&&v.config&&typeof l.detail.config=="object"&&l.detail.config.type&&(i=l.detail.config)}),a.addEventListener("value-changed",l=>{var v;(v=l.detail)!=null&&v.value&&typeof l.detail.value=="object"&&l.detail.value.type&&(i=l.detail.value)}),r.appendChild(a),t.appendChild(r);const o=document.createElement("ha-button");o.textContent="Cancel",o.setAttribute("appearance","plain"),o.addEventListener("click",()=>{t.open=false});const c=document.createElement("ha-button");c.textContent="Save",c.setAttribute("variant","brand"),c.addEventListener("click",()=>{i!=null&&i.type&&(this._setConfigValue("symbiont.card",JSON.parse(JSON.stringify(i))),J.debug("[ElbowEditor] Symbiont card config saved from editor:",i.type)),t.open=false}),t.appendChild(ve({secondary:[o],primary:[c]})),t.addEventListener("closed",()=>{t.remove(),this._symbioCardEditorDialogRef===t&&(this._symbioCardEditorDialogRef=null)}),fe(t,this),setTimeout(()=>{t.open=true},10),J.debug("[ElbowEditor] Opened symbiont card editor dialog for:",e.type)}_getSymbiontLovelace(){var t;let e=((t=this.lovelace)==null?void 0:t.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}_getElbowComponent(e){var t,r,a;return(a=(r=(t=window.lcards)==null?void 0:t.core)==null?void 0:r.componentManager)==null?void 0:a.getComponent(e)}_getElbowComponentEntries(){var t,r;const e=(r=(t=window.lcards)==null?void 0:t.core)==null?void 0:r.componentManager;return e?e.getComponentsByType("elbow").map(a=>[a,e.getComponent(a)]):[]}_getConfigTabConfig(){var c;const e=((c=this.config.elbow)==null?void 0:c.type)||"header-left",t=this._getElbowStyle(),r=this._getElbowComponent(e),i=((r==null?void 0:r.features)||["simple"]).includes("segmented"),o=[{value:"simple",label:"Simple (single elbow)"}];return i&&o.push({value:"segmented",label:"Segmented (Picard-style double)"}),[...this._buildConfigTab({infoMessage:"Configure your LCARS elbow card. Elbows are positioned borders with rounded corners that create the iconic LCARS interface aesthetic.",modeSections:[{type:"section",header:"Elbow Configuration",description:"Choose elbow position and style",icon:"mdi:vector-polyline",expanded:false,outlined:true,children:[{type:"custom",render:S(()=>h`
                                ${this._renderFieldWithHandler("elbow.type",{label:"Elbow Position",helper:"Position of the elbow corner on the card",value:e,selectorOverride:{select:{mode:"dropdown",options:this._getElbowComponentEntries().map(([$,m])=>{var l;return{value:$,label:((l=m.metadata)==null?void 0:l.name)||$}})}}},$=>this._handleElbowTypeChange($))}

                                ${this._renderFieldWithHandler("elbow.style",{label:"Elbow Style",helper:i?t==="simple"?"Simple: Single elbow with one curve":"Segmented: Double concentric elbows with gap (TNG aesthetic)":"This component only supports simple style",value:t,disabled:!i,selectorOverride:{select:{mode:"dropdown",options:o}}},$=>this._handleStyleChange($))}
                            `,"render")}]},{type:"section",header:"Entity",description:"Entity to observe and attribute for state range conditions",icon:"mdi:home-automation",expanded:false,outlined:true,children:[{type:"custom",render:S(()=>{var $;return h`
                                ${this._renderFieldWithHandler("entity",{label:"Entity",helper:"[Optional] Entity whose state drives colour and icon changes",value:(($=this.config)==null?void 0:$.entity)||"",selectorOverride:{entity:{}}},m=>{m?this._setConfigValue("entity",m):this._removeConfigPath("entity")})}
                            `},"render")},{type:"custom",render:S(()=>this._renderRangesAttributeSelector(),"render")},{type:"custom",render:S(()=>this._renderStateAttributeSelector(),"render")},{type:"custom",render:S(()=>this._renderStateClassificationElseSelector(),"render")}]}],basicFields:[{path:"id",label:"Card ID",helper:"[Optional] Custom ID for targeting with rules and animations"},{path:"tags",label:"Tags",helper:"Select existing tags or type new ones for rule targeting"}],showBasicSection:true,basicSectionHeader:"Card Identification"}),{type:"section",header:"Sizing",description:"Override card dimensions: useful in stacks, overlays, or any auto-height container",icon:"mdi:resize",expanded:false,outlined:true,children:[{type:"grid",columns:2,children:[{type:"field",path:"height"},{type:"field",path:"width"},{type:"field",path:"min_height"},{type:"field",path:"min_width"},{type:"field",path:"max_height"},{type:"field",path:"max_width"},{type:"field",path:"overflow"},{type:"field",path:"z_index"},{type:"field",path:"overflow_x"},{type:"field",path:"overflow_y"}]},{type:"custom",render:S(()=>this._renderLayoutCardHint(),"render")}]}]}_renderElbowDesignTab(){var r;const e=((r=this.config.elbow)==null?void 0:r.type)||"header-left",t=this._getElbowStyle();return e==="frame"?this._renderFrameDesign():t==="segmented"?this._renderSegmentedDesign():this._renderSimpleDesign()}_renderFrameDesign(){var f,_,F,E,C;const e=((f=this.config.elbow)==null?void 0:f.frame)||{},t=this._getElbowStyle(),r=t==="segmented",a=e.bar_width??90,i=e.bar_height??a,o=e.outer_curve??Math.round(a/2),c=e.inner_curve??Math.round(o/2),$=S(d=>{const O=e[d]||{},R=O.bar_width??O.bar_height??O.thickness;return R!==void 0?R:d==="top"||d==="bottom"?i:a},"sideThickness"),m=S(d=>(e[d]||{}).enabled!==false,"sideEnabled"),l=((_=e.segments)==null?void 0:_.inner_frame)||{},v=l.bar_width??28,x=l.bar_height??v,I=l.outer_curve??Math.round(v/2),g=l.inner_curve??Math.round(I/2),u=((F=e.segments)==null?void 0:F.gap)??4,n=xe(e,t).corners,y=S(d=>{var O,R,D;return((R=(O=e.corners)==null?void 0:O[d])==null?void 0:R.outer_curve)??((D=n[d])==null?void 0:D.outer)??o},"cornerOuter"),p=S(d=>{var O,R,D;return((R=(O=e.corners)==null?void 0:O[d])==null?void 0:R.inner_curve)??((D=n[d])==null?void 0:D.inner)??c},"cornerInner"),b=S((d,O)=>h`
            <div style="display: flex; align-items: center; gap: 12px; padding: 4px 0;">
                <ha-selector
                    style="flex: 0 0 140px;"
                    .hass=${this.hass}
                    .label=${O}
                    .selector=${{boolean:{}}}
                    .value=${m(d)}
                    @value-changed=${R=>this._setConfigValue(`elbow.frame.${d}.enabled`,R.detail.value)}>
                </ha-selector>
                ${m(d)?h`
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${"Thickness (px)"}
                        .selector=${{number:{min:1,max:500,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${$(d)}
                        @value-changed=${R=>{const D=d==="top"||d==="bottom"?"bar_height":"bar_width";this._setConfigValue(`elbow.frame.${d}.${D}`,R.detail.value)}}>
                    </ha-selector>
                `:""}
            </div>
        `,"renderSideRow"),M=S((d,O)=>{const R=d.includes("right")&&!m("right")||d.includes("left")&&!m("left")||d.includes("top")&&!m("top")||d.includes("bottom")&&!m("bottom"),D=R?"End cap outer (px)":"Outer curve (px)",N=R?"End cap inner (px)":"Inner curve (px)";return h`
                <div style="display: flex; align-items: center; gap: 8px; padding: 2px 0;">
                    <span style="flex: 0 0 130px; font-size: 13px; color: var(--secondary-text-color);">${O}</span>
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${D}
                        .selector=${{number:{min:0,max:250,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${y(d)}
                        @value-changed=${A=>this._setConfigValue(`elbow.frame.corners.${d}.outer_curve`,A.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${N}
                        .helper=${"Rounded curve on the inner corner of the bar; only applied when both adjacent sides are enabled"}
                        .selector=${{number:{min:0,max:250,step:1,mode:"box",unit_of_measurement:"px"}}}
                        .value=${p(d)}
                        @value-changed=${A=>this._setConfigValue(`elbow.frame.corners.${d}.inner_curve`,A.detail.value)}>
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
                    @value-changed=${d=>this._setConfigValue("elbow.frame.bar_width",d.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${"Default Side Height (top/bottom)"}
                    .helper=${"Applied to top and bottom bars unless overridden"}
                    .selector=${{number:{min:1,max:500,step:1,mode:"slider",unit_of_measurement:"px"}}}
                    .value=${i}
                    @value-changed=${d=>this._setConfigValue("elbow.frame.bar_height",d.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${"Default Outer Corner Curve"}
                    .helper=${"Outer corner/end-cap arc radius: applied to all 4 corners unless overridden"}
                    .selector=${{number:{min:0,max:250,step:1,mode:"slider",unit_of_measurement:"px"}}}
                    .value=${o}
                    @value-changed=${d=>this._setConfigValue("elbow.frame.outer_curve",d.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${"Default Inner Corner Curve"}
                    .helper=${"Default inner corner curve; only applied when both adjacent sides are enabled; open-side corners are always square"}
                    .selector=${{number:{min:0,max:250,step:1,mode:"slider",unit_of_measurement:"px"}}}
                    .value=${c}
                    @value-changed=${d=>this._setConfigValue("elbow.frame.inner_curve",d.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            <!-- Per-side control -->
            <lcards-form-section
                header="Per-Side Control"
                description="Enable or disable each side and override its thickness. Disabled sides create open ends with rounded end-caps."
                icon="mdi:border-style"
                ?expanded=${true}
                ?outlined=${true}>

                ${b("top","Top bar")}
                ${b("bottom","Bottom bar")}
                ${b("left","Left bar")}
                ${b("right","Right bar")}
            </lcards-form-section>

            <!-- Per-corner curves -->
            <lcards-form-section
                header="Per-Corner Curves"
                description="Override outer and inner arc radii per corner. When an adjacent side is disabled, these become end-cap arcs."
                icon="mdi:vector-curve"
                ?expanded=${false}
                ?outlined=${true}>

                ${M("top_left","Top-left")}
                ${M("top_right","Top-right")}
                ${M("bottom_left","Bottom-left")}
                ${M("bottom_right","Bottom-right")}
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
                        .value=${u}
                        @value-changed=${d=>this._setConfigValue("elbow.frame.segments.gap",d.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner ring width (left/right)"}
                        .selector=${{number:{min:1,max:500,step:1,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${v}
                        @value-changed=${d=>this._setConfigValue("elbow.frame.segments.inner_frame.bar_width",d.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner ring height (top/bottom)"}
                        .selector=${{number:{min:1,max:500,step:1,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${x}
                        @value-changed=${d=>this._setConfigValue("elbow.frame.segments.inner_frame.bar_height",d.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner ring outer curve"}
                        .selector=${{number:{min:0,max:250,step:1,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${I}
                        @value-changed=${d=>this._setConfigValue("elbow.frame.segments.inner_frame.outer_curve",d.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner ring inner curve"}
                        .helper=${"Inner ring corner curve; only applied when both adjacent sides are enabled; open-side corners are always square"}
                        .selector=${{number:{min:0,max:250,step:1,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${g}
                        @value-changed=${d=>this._setConfigValue("elbow.frame.segments.inner_frame.inner_curve",d.detail.value)}>
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
                        .entityId=${((E=this.config)==null?void 0:E.entity)||""}
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
                    .entityId=${((C=this.config)==null?void 0:C.entity)||""}
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
                @value-changed=${i=>{const o=(i.detail.value||"").trim();o===""?this._setConfigValue(r,a):this._setConfigValue(r,o)}}>
            </ha-selector>
        `}_renderSimpleDesign(){var E,C,d,O,R,D,N,A;const e=((E=this.config.elbow)==null?void 0:E.segment)||{},t=e.bar_width!==void 0?e.bar_width:90,r=e.bar_height!==void 0?e.bar_height:typeof t=="number"?t:90,a=e.outer_curve??"auto",i=e.inner_curve,c=["auto","arm_width","arm_height","arm_max","arm_min","arm_fill"].includes(i),$=this._isCssExpr(t),m=this._isCssExpr(r),l=this._isCssExpr(a),v=!c&&this._isCssExpr(i),x=e.outer_curve_clamp??"card",I=typeof x=="number",g=I?"manual":x,u=typeof t=="number"?t:90,n=typeof r=="number"?r:90,y=Math.min(u,n),p=Math.max(u,n),b=a==="arm_height"?n/2:a==="arm_max"?p/2:a==="arm_min"?y/2:a==="arm_fill"?p:u/2,M=typeof a=="number"?a:b,f=i==="arm_width"?u/2:i==="arm_height"?n/2:i==="arm_max"?p/2:i==="arm_min"?y/2:i==="arm_fill"?p:i===void 0?oe(M,u,n):M/2,_=l?"css":typeof a=="number"?"manual":a,F=v?"css":typeof i=="number"?"manual":i??"auto";return h`
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
                    .helper=${$?"CSS expression: edit via YAML":t==="theme"?"Dynamic: follows input_number.lcars_vertical":"Static pixel value"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_vertical)"},{value:"css",label:"CSS Expression (YAML only)"}]}}}
                    .value=${$?"css":t==="theme"?"theme":"static"}
                    @value-changed=${w=>this._handleBarWidthModeChange(w)}>
                </ha-selector>

                ${$?this._renderCssField("Bar Width (Vertical)",t,"elbow.segment.bar_width",90):t!=="theme"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Bar Width (Vertical)"}
                            .helper=${"Thickness of the vertical sidebar"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof t=="number"?t:90}
                            @value-changed=${w=>this._setConfigValue("elbow.segment.bar_width",w.detail.value)}>
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
                    .helper=${m?"CSS expression: edit via YAML":r==="theme"?"Dynamic: follows input_number.lcars_horizontal":"Static pixel value"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_horizontal)"},{value:"css",label:"CSS Expression (YAML only)"}]}}}
                    .value=${m?"css":r==="theme"?"theme":"static"}
                    @value-changed=${w=>this._handleBarHeightModeChange(w)}>
                </ha-selector>

                ${m?this._renderCssField("Bar Height (Horizontal)",r,"elbow.segment.bar_height",90):r!=="theme"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Bar Height (Horizontal)"}
                            .helper=${"Thickness of the horizontal bar"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof r=="number"?r:90}
                            @value-changed=${w=>this._setConfigValue("elbow.segment.bar_height",w.detail.value)}>
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
                    ${this._renderCurveLivePreview(this._liveOuterCurve??(typeof a=="number"?a:b),this._liveInnerCurve??(typeof i=="number"?i:f),u,n,g,x,this._parseStylePx(((d=(C=this.config)==null?void 0:C.style)==null?void 0:d.height)??((O=this.config)==null?void 0:O.height)),this._parseStylePx(((D=(R=this.config)==null?void 0:R.style)==null?void 0:D.width)??((N=this.config)==null?void 0:N.width)))}
                </div>

                <!-- Outer curve -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Outer Arc Radius"}
                    .helper=${l?"CSS expression: edit via YAML":`→ ${b.toFixed(1)} px`}
                    .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto / arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2), for paired elbows"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm, full sweep)"},{value:"manual",label:"manual  (explicit px)"},...l?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                    .value=${_}
                    @value-changed=${this._handleOuterCurveModeChange}>
                </ha-selector>

                ${l?this._renderCssField("Outer Curve Radius",a,"elbow.segment.outer_curve","auto"):_==="manual"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Outer Curve Radius"}
                            .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof a=="number"?a:b}
                            @input=${w=>{var W,V,k;const L=Number((k=(V=(W=w.composedPath)==null?void 0:W.call(w))==null?void 0:V[0])==null?void 0:k.value);isNaN(L)||(this._liveOuterCurve=L)}}
                            @value-changed=${w=>{this._liveOuterCurve=null,this._setConfigValue("elbow.segment.outer_curve",w.detail.value)}}>
                        </ha-selector>
                    `:this._renderCurveModeMessage("outer",_,b,u,n)}

                <!-- Inner curve -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Inner Arc Radius"}
                    .helper=${v?"CSS expression: edit via YAML":`→ ${f.toFixed(1)} px`}
                    .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...v?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                    .value=${F}
                    @value-changed=${this._handleInnerCurveModeChange}>
                </ha-selector>

                ${v?this._renderCssField("Inner Curve Radius",i,"elbow.segment.inner_curve","auto"):F==="manual"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Inner Curve Radius"}
                            .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof i=="number"?i:f}
                            @input=${w=>{var W,V,k;const L=Number((k=(V=(W=w.composedPath)==null?void 0:W.call(w))==null?void 0:V[0])==null?void 0:k.value);isNaN(L)||(this._liveInnerCurve=L)}}
                            @value-changed=${w=>{this._liveInnerCurve=null,this._setConfigValue("elbow.segment.inner_curve",w.detail.value)}}>
                        </ha-selector>
                    `:this._renderCurveModeMessage("inner",F,f,u,n,b)}

                <!-- Curve clamp -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Curve Clamp"}
                    .helper=${"Controls how the arc radius is limited at render time"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"card",label:"card: clamp to card viewport (default)"},{value:"none",label:"none: no clamp (consistent paired elbows)"},{value:"manual",label:"manual: explicit px ceiling"}]}}}
                    .value=${g}
                    @value-changed=${this._handleClampModeChange}>
                </ha-selector>

                ${I?h`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Clamp Ceiling"}
                        .selector=${{number:{min:0,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${typeof x=="number"?x:60}
                        @value-changed=${w=>this._setConfigValue("elbow.segment.outer_curve_clamp",w.detail.value)}>
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
                        @value-changed=${w=>this._handleDiagonalAngleModeChange(w)}>
                    </ha-selector>

                    ${e.diagonal_angle!=="theme"?h`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Diagonal Cut Angle"}
                            .helper=${"Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)"}
                            .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                            .value=${typeof e.diagonal_angle=="number"?e.diagonal_angle:45}
                            @value-changed=${w=>this._setConfigValue("elbow.segment.diagonal_angle",w.detail.value)}>
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
                    .entityId=${((A=this.config)==null?void 0:A.entity)||""}
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
        `}_renderSegmentedDesign(){var Q,ie,ee,te,le,de,ce,he,ue,me,ge,pe;const e=((Q=this.config.elbow)==null?void 0:Q.segments)||{},t=e.gap??4,r=e.outer_segment||{},a=e.inner_segment||{},i=["auto","arm_width","arm_height","arm_max","arm_min","arm_fill"],o=typeof r.bar_width=="number"?r.bar_width:90,c=typeof r.bar_height=="number"?r.bar_height:o,$=Math.min(o,c),m=Math.max(o,c),l=r.outer_curve??"auto",x=!i.includes(l)&&this._isCssExpr(l),I=x?"css":typeof l=="number"?"manual":l,g=typeof l=="number"?l:l==="arm_height"?c/2:l==="arm_max"?m/2:l==="arm_min"?$/2:l==="arm_fill"?m:o/2,u=r.inner_curve,y=!i.includes(u)&&this._isCssExpr(u),p=y?"css":typeof u=="number"?"manual":u??"auto",b=typeof u=="number"?u:u==="arm_width"?o/2:u==="arm_height"?c/2:u==="arm_max"?m/2:u==="arm_min"?$/2:u==="arm_fill"?m:u===void 0?oe(g,o,c):g/2,M=r.outer_curve_clamp??"card",f=typeof M=="number"?"manual":M,_=typeof a.bar_width=="number"?a.bar_width:60,F=typeof a.bar_height=="number"?a.bar_height:_,E=Math.min(_,F),C=Math.max(_,F),d=this._parseStylePx(((ee=(ie=this.config)==null?void 0:ie.style)==null?void 0:ee.height)??((te=this.config)==null?void 0:te.height)),R=Math.max(0,Math.min(g,f==="none"?1/0:typeof M=="number"?M:d??1/0)),D=g>0?Math.max(0,b*(R/g)):0,N=Math.max(0,D-t),A=a.outer_curve,w=i.includes(A),L=!w&&this._isCssExpr(A),W=L?"css":typeof A=="number"?"manual":A??"auto",V=typeof A=="number"?A:A==="arm_height"?F/2:A==="arm_max"?C/2:A==="arm_min"?E/2:A==="arm_fill"?C:w?_/2:N,k=a.inner_curve,H=!i.includes(k)&&this._isCssExpr(k),Z=H?"css":typeof k=="number"?"manual":k??"auto",j=typeof k=="number"?k:k==="arm_width"?_/2:k==="arm_height"?F/2:k==="arm_max"?C/2:k==="arm_min"?E/2:k==="arm_fill"?C:k===void 0&&A===void 0?oe(V,_,F):V/2,re=this._liveSegOuterOC??(typeof l=="number"?l:g),z=this._liveSegOuterIC??(typeof u=="number"?u:b),P=this._liveSegInnerOC??V,K=this._liveSegInnerIC??j;return h`
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
                    @value-changed=${s=>this._setConfigValue("elbow.segments.gap",s.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            <!-- ── Outer Segment ────────────────────────────────────────────── -->
            <lcards-form-section
                header="Outer Segment (Frame)"
                description="Colour and dimensions for the outer elbow"
                icon="mdi:vector-square"
                ?expanded=${true}
                ?outlined=${true}>

                ${this._renderSegmentEntityAndActions("outer_segment",r)}

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${r.entity_id||((le=this.config)==null?void 0:le.entity)||""}
                    basePath="elbow.segments.outer_segment.color"
                    header="Colour"
                    description="Colour states for outer frame segment (matched against its entity)"
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
                            @value-changed=${s=>this._handleDimModeChange(s.detail.value,"elbow.segments.outer_segment.bar_width",90,"clamp(60px, 8vw, 120px)")}>
                        </ha-selector>
                        ${this._renderCssField("Bar Width",r.bar_width,"elbow.segments.outer_segment.bar_width",90)}
                    `:h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Width Mode"}
                            .helper=${"Static: fixed pixel value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"static"}
                            @value-changed=${s=>this._handleDimModeChange(s.detail.value,"elbow.segments.outer_segment.bar_width",90,"clamp(60px, 8vw, 120px)")}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Bar Width"} .helper=${"Vertical bar thickness"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof r.bar_width=="number"?r.bar_width:90}
                            @value-changed=${s=>this._setConfigValue("elbow.segments.outer_segment.bar_width",s.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isCssExpr(r.bar_height)?h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Height Mode"}
                            .helper=${"CSS expression active"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"css"}
                            @value-changed=${s=>this._handleDimModeChange(s.detail.value,"elbow.segments.outer_segment.bar_height",90,"clamp(40px, 6vh, 90px)")}>
                        </ha-selector>
                        ${this._renderCssField("Bar Height",r.bar_height,"elbow.segments.outer_segment.bar_height",90)}
                    `:h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Height Mode"}
                            .helper=${"Static: fixed pixel value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"static"}
                            @value-changed=${s=>this._handleDimModeChange(s.detail.value,"elbow.segments.outer_segment.bar_height",90,"clamp(40px, 6vh, 90px)")}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Bar Height"} .helper=${"Horizontal bar thickness"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof r.bar_height=="number"?r.bar_height:o}
                            @value-changed=${s=>this._setConfigValue("elbow.segments.outer_segment.bar_height",s.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isDiagonalCapType()?h`
                        <ha-selector .hass=${this.hass}
                            .label=${"Diagonal Angle Mode"}
                            .helper=${r.diagonal_angle==="theme"?"Dynamic: follows the input_number.lcars_elbow_angle helper":"Static: fixed angle value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                            .value=${r.diagonal_angle==="theme"?"theme":"static"}
                            @value-changed=${s=>this._handleOuterDiagonalAngleModeChange(s)}>
                        </ha-selector>
                        ${r.diagonal_angle!=="theme"?h`
                            <ha-selector .hass=${this.hass} .label=${"Diagonal Cut Angle"}
                                .helper=${"Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)"}
                                .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                                .value=${typeof r.diagonal_angle=="number"?r.diagonal_angle:45}
                                @value-changed=${s=>this._setConfigValue("elbow.segments.outer_segment.diagonal_angle",s.detail.value)}>
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

                ${this._renderSegmentEntityAndActions("inner_segment",a)}

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${a.entity_id||((de=this.config)==null?void 0:de.entity)||""}
                    basePath="elbow.segments.inner_segment.color"
                    header="Colour"
                    description="Colour states for inner content segment (matched against its entity)"
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
                            @value-changed=${s=>this._handleDimModeChange(s.detail.value,"elbow.segments.inner_segment.bar_width",60,"clamp(40px, 5vw, 80px)")}>
                        </ha-selector>
                        ${this._renderCssField("Bar Width",a.bar_width,"elbow.segments.inner_segment.bar_width",60)}
                    `:h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Width Mode"}
                            .helper=${"Static: fixed pixel value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"static"}
                            @value-changed=${s=>this._handleDimModeChange(s.detail.value,"elbow.segments.inner_segment.bar_width",60,"clamp(40px, 5vw, 80px)")}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Bar Width"} .helper=${"Vertical bar thickness"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof a.bar_width=="number"?a.bar_width:60}
                            @value-changed=${s=>this._setConfigValue("elbow.segments.inner_segment.bar_width",s.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isCssExpr(a.bar_height)?h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Height Mode"}
                            .helper=${"CSS expression active"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"css"}
                            @value-changed=${s=>this._handleDimModeChange(s.detail.value,"elbow.segments.inner_segment.bar_height",60,"clamp(30px, 4vh, 60px)")}>
                        </ha-selector>
                        ${this._renderCssField("Bar Height",a.bar_height,"elbow.segments.inner_segment.bar_height",60)}
                    `:h`
                        <ha-selector .hass=${this.hass} .label=${"Bar Height Mode"}
                            .helper=${"Static: fixed pixel value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                            .value=${"static"}
                            @value-changed=${s=>this._handleDimModeChange(s.detail.value,"elbow.segments.inner_segment.bar_height",60,"clamp(30px, 4vh, 60px)")}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Bar Height"} .helper=${"Horizontal bar thickness"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof a.bar_height=="number"?a.bar_height:_}
                            @value-changed=${s=>this._setConfigValue("elbow.segments.inner_segment.bar_height",s.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isDiagonalCapType()?h`
                        <ha-selector .hass=${this.hass}
                            .label=${"Diagonal Angle Mode"}
                            .helper=${a.diagonal_angle==="theme"?"Dynamic: follows the input_number.lcars_elbow_angle helper":"Static: fixed angle value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                            .value=${a.diagonal_angle==="theme"?"theme":"static"}
                            @value-changed=${s=>this._handleInnerDiagonalAngleModeChange(s)}>
                        </ha-selector>
                        ${a.diagonal_angle!=="theme"?h`
                            <ha-selector .hass=${this.hass} .label=${"Diagonal Cut Angle"}
                                .helper=${"Angle of diagonal cuts (defaults to outer segment angle)"}
                                .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                                .value=${typeof a.diagonal_angle=="number"?a.diagonal_angle:r.diagonal_angle??45}
                                @value-changed=${s=>this._setConfigValue("elbow.segments.inner_segment.diagonal_angle",s.detail.value)}>
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
                    ${this._renderSegmentedLivePreview(re,z,o,c,P,K,_,F,t,f,M,this._parseStylePx(((he=(ce=this.config)==null?void 0:ce.style)==null?void 0:he.height)??((ue=this.config)==null?void 0:ue.height)),this._parseStylePx(((ge=(me=this.config)==null?void 0:me.style)==null?void 0:ge.width)??((pe=this.config)==null?void 0:pe.width)),A===void 0,a.inner_curve===void 0||a.inner_curve==="auto")}
                </div>

                <!-- Outer segment curves subsection -->
                <lcards-form-section
                    header="Outer Segment"
                    icon="mdi:vector-square"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <ha-selector .hass=${this.hass}
                        .label=${"Outer Arc Radius"}
                        .helper=${x?"CSS expression: edit via YAML":`→ ${g.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto / arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2), for paired elbows"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm, full sweep)"},{value:"manual",label:"manual  (explicit px)"},...x?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${I}
                        @value-changed=${s=>this._handleSegCurveModeChange("elbow.segments.outer_segment.outer_curve",s.detail.value,Math.round(g),"clamp(30px, 4vw, 60px)",true)}>
                    </ha-selector>
                    ${x?this._renderCssField("Outer Arc Radius",l,"elbow.segments.outer_segment.outer_curve",Math.round(g)):I==="manual"?h`
                            <ha-selector .hass=${this.hass} .label=${"Outer Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof l=="number"?l:g}
                                @input=${s=>{var q,U,X;const Y=Number((X=(U=(q=s.composedPath)==null?void 0:q.call(s))==null?void 0:U[0])==null?void 0:X.value);isNaN(Y)||(this._liveSegOuterOC=Y)}}
                                @value-changed=${s=>{this._liveSegOuterOC=null,this._setConfigValue("elbow.segments.outer_segment.outer_curve",s.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("outer",I,g,o,c)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner Arc Radius"}
                        .helper=${y?"CSS expression: edit via YAML":`→ ${b.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...y?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${p}
                        @value-changed=${s=>this._handleSegCurveModeChange("elbow.segments.outer_segment.inner_curve",s.detail.value,Math.round(b),"clamp(15px, 2vw, 30px)",false)}>
                    </ha-selector>
                    ${y?this._renderCssField("Inner Arc Radius",u,"elbow.segments.outer_segment.inner_curve",Math.round(b)):p==="manual"?h`
                            <ha-selector .hass=${this.hass} .label=${"Inner Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof u=="number"?u:b}
                                @input=${s=>{var q,U,X;const Y=Number((X=(U=(q=s.composedPath)==null?void 0:q.call(s))==null?void 0:U[0])==null?void 0:X.value);isNaN(Y)||(this._liveSegOuterIC=Y)}}
                                @value-changed=${s=>{this._liveSegOuterIC=null,this._setConfigValue("elbow.segments.outer_segment.inner_curve",s.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("inner",p,b,o,c,g)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Curve Clamp"}
                        .helper=${{card:"card: clamp to card dimensions (default)",none:"none: no clamp; card clips SVG overflow",manual:`manual: ceiling at ${typeof M=="number"?M:100} px`}[f]??""}
                        .selector=${{select:{mode:"dropdown",options:[{value:"card",label:"card  (clamp to card size)"},{value:"none",label:"none  (no clamp; use with arm_max for paired elbows)"},{value:"manual",label:"manual  (explicit px ceiling)"}]}}}
                        .value=${f}
                        @value-changed=${s=>this._handleSegClampModeChange("elbow.segments.outer_segment.outer_curve_clamp",s.detail.value,100)}>
                    </ha-selector>
                    ${f==="manual"?h`
                        <ha-selector .hass=${this.hass} .label=${"Clamp Ceiling"}
                            .selector=${{number:{min:0,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof M=="number"?M:100}
                            @value-changed=${s=>this._setConfigValue("elbow.segments.outer_segment.outer_curve_clamp",s.detail.value)}>
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
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:`auto  (concentric → ${N.toFixed(1)} px)`},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...L?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${W}
                        @value-changed=${s=>this._handleSegCurveModeChange("elbow.segments.inner_segment.outer_curve",s.detail.value,Math.round(V),"clamp(20px, 3vw, 45px)",true)}>
                    </ha-selector>
                    ${L?this._renderCssField("Outer Arc Radius",A,"elbow.segments.inner_segment.outer_curve",Math.round(V)):W==="manual"?h`
                            <ha-selector .hass=${this.hass} .label=${"Outer Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof A=="number"?A:V}
                                @input=${s=>{var q,U,X;const Y=Number((X=(U=(q=s.composedPath)==null?void 0:q.call(s))==null?void 0:U[0])==null?void 0:X.value);isNaN(Y)||(this._liveSegInnerOC=Y)}}
                                @value-changed=${s=>{this._liveSegInnerOC=null,this._setConfigValue("elbow.segments.inner_segment.outer_curve",s.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("outer",W,V,_,F)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner Arc Radius"}
                        .helper=${H?"CSS expression: edit via YAML":`→ ${j.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...H?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${Z}
                        @value-changed=${s=>this._handleSegCurveModeChange("elbow.segments.inner_segment.inner_curve",s.detail.value,Math.round(j),"clamp(10px, 1.5vw, 22px)",false)}>
                    </ha-selector>
                    ${H?this._renderCssField("Inner Arc Radius",k,"elbow.segments.inner_segment.inner_curve",Math.round(j)):Z==="manual"?h`
                            <ha-selector .hass=${this.hass} .label=${"Inner Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof k=="number"?k:j}
                                @input=${s=>{var q,U,X;const Y=Number((X=(U=(q=s.composedPath)==null?void 0:q.call(s))==null?void 0:U[0])==null?void 0:X.value);isNaN(Y)||(this._liveSegInnerIC=Y)}}
                                @value-changed=${s=>{this._liveSegInnerIC=null,this._setConfigValue("elbow.segments.inner_segment.inner_curve",s.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("inner",Z,j,_,F,V)}

                </lcards-form-section>
            </lcards-form-section>
        `}_renderSymbiontTab(){var c,$,m,l,v,x,I,g,u;const e=((c=this.config)==null?void 0:c.symbiont)||{},t=e.enabled||false,r=e.imprint||{},a=r.enabled!==false,i=r.border_radius||{},o=e.card?ae(e.card):"";return h`
            <div class="tab-content-container">
                ${be({header:"How the symbiont card works",body:h`
                        <p>Any Home Assistant card can sit inside the elbow's content area.</p>
                        <ul>
                            <li><strong>Imprint</strong> gives it the elbow's background colour, text colour and font, without UIX.</li>
                            <li>A <code>uix</code> block on the embedded card still applies, but where both set the same property, imprint wins. Turn imprint off to let UIX style the card alone.</li>
                        </ul>
                    `})}

                <!-- Master Enable -->
                <lcards-form-section
                    header="Symbiont"
                    description="Embed another Home Assistant card inside the elbow content area"
                    icon="mdi:card-multiple"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Enable Symbiont"}
                        .helper=${"Embed another Home Assistant card in the elbow content area"}
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
                                .value=${o}
                                mode="yaml"
                                @value-changed=${n=>{const y=n.detail.value;clearTimeout(this._yamlDebounceTimer??void 0),this._yamlDebounceTimer=setTimeout(()=>{try{const p=Fe(y);p&&typeof p=="object"&&this._setConfigValue("symbiont.card",p)}catch{}},750)}}>
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
                            .value=${(($=e.size)==null?void 0:$.width)??""}
                            @value-changed=${n=>this._setConfigValue("symbiont.size.width",n.detail.value||null)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Height"}
                            .helper=${'CSS height of the symbiont container, e.g. "50%" or "150px". Leave blank to fill the available area.'}
                            .selector=${{text:{}}}
                            .value=${((m=e.size)==null?void 0:m.height)??""}
                            @value-changed=${n=>this._setConfigValue("symbiont.size.height",n.detail.value||null)}>
                        </ha-selector>

                        ${((l=e.size)==null?void 0:l.width)!=null||((v=e.size)==null?void 0:v.height)!=null?h`
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
                                    .entityId=${((x=this.config)==null?void 0:x.entity)||""}
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
                                    .entityId=${((I=this.config)==null?void 0:I.entity)||""}
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
                                    .value=${((u=r.text)==null?void 0:u.font_family)||""}
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

                                ${["top_left","top_right","bottom_left","bottom_right"].map(n=>{const y=n.replace(/_/g," ").replace(/\b\w/g,f=>f.toUpperCase()),p=i[n],b=p==="match"?"match":p==null?"default":"custom",M=typeof p=="number"?p:0;return h`
                                        <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--divider-color); overflow:hidden;">
                                            <span style="flex:0 0 90px; font-size:13px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${y}</span>
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{select:{mode:"dropdown",options:[{value:"default",label:"Default (no inject)"},{value:"match",label:"Match elbow arc"},{value:"custom",label:"Custom (px)"}]}}}
                                                .value=${b}
                                                style="flex:1; min-width:0;"
                                                @value-changed=${f=>{const _=f.detail.value;_==="default"?this._setConfigValue("symbiont.imprint.border_radius."+n,void 0):_==="match"?this._setConfigValue("symbiont.imprint.border_radius."+n,"match"):this._setConfigValue("symbiont.imprint.border_radius."+n,M)}}>
                                            </ha-selector>
                                            ${b==="custom"?h`
                                                <ha-selector
                                                    .hass=${this.hass}
                                                    .selector=${{number:{min:0,max:200,step:1,mode:"box",unit_of_measurement:"px"}}}
                                                    .value=${M}
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
        `}_buildAvailableZones(e){return Ae(e)}_renderTextTab(){var r,a,i;const e=((r=this.config)==null?void 0:r.text)||{},t={...this._buildAvailableZones(((a=this.config)==null?void 0:a.elbow)||{})};for(const o of Object.keys(((i=this.config)==null?void 0:i.zones)||{}))t[o]||(t[o]=o.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()));return h`
            <lcards-multi-text-editor-v2
                .editor=${this}
                .text=${e}
                .hass=${this.hass}
                .availableZones=${t}
                @text-changed=${o=>{this.config={...this.config,text:o.detail.value},this._updateConfig(this.config,"visual")}}>
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
                    @value-changed=${a=>{const i=a.detail.value;if(i)this._updateConfig({style:{cursor:i}});else{const o={...this.config.style||{}};delete o.cursor,this._updateConfig({style:o})}}}>
                </ha-selector>
            </lcards-form-section>
            <lcards-multi-action-editor
                .hass=${this.hass}
                .actions=${{tap_action:this.config.tap_action,hold_action:this.config.hold_action,double_tap_action:this.config.double_tap_action}}
                @value-changed=${this._handleActionsChange}>
            </lcards-multi-action-editor>
        `}_isDiagonalCapType(){var t;return(((t=this.config.elbow)==null?void 0:t.type)||"header-left").includes("diagonal-cap")}_getElbowStyle(){var e;return((e=this.config.elbow)==null?void 0:e.style)||"simple"}_getInnerCurveHelperText(e,t){return t!==void 0?`Current: ${t}px (default would be ${e.toFixed(1)}px using LCARS formula: outer / 2)`:`LCARS formula: outer_curve / 2 = ${e.toFixed(1)}px (default if not specified)`}_renderFieldWithHandler(e,t,r){const a={hass:this.hass,_getSchemaForPath:S(i=>this._getSchemaForPath(i),"_getSchemaForPath"),_getConfigValue:S(i=>this._getConfigValue(i),"_getConfigValue"),_setConfigValue:S((i,o)=>r(o),"_setConfigValue")};return Ce.renderField(a,e,t)}_handleElbowTypeChange(e){this._setConfigValue("elbow.type",e);const t=this._getElbowComponent(e),r=(t==null?void 0:t.features)||["simple"];this._getElbowStyle()==="segmented"&&!r.includes("segmented")&&(this._setConfigValue("elbow.style","simple"),this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:true,composed:true,detail:{message:"Style changed to Simple - selected component does not support Segmented mode",duration:3e3}})))}_handleStyleChange(e){var i;const t=this._getElbowStyle();if(e===t)return;const r=ye({availablePresets:[],positionEnum:[]}),a={type:((i=this.config.elbow)==null?void 0:i.type)||"header-left",style:e};if(e==="simple"){const o=r.properties.elbow.properties.segment.default||{bar_width:90,bar_height:90,outer_curve:"auto"};a.segment={...o}}else{const o=r.properties.elbow.properties.segments.default||{gap:4,outer_segment:{bar_width:90,bar_height:90},inner_segment:{bar_width:60,bar_height:60}};a.segments=JSON.parse(JSON.stringify(o))}this._setConfigValue("elbow",a),this.requestUpdate()}_handleOuterCurveModeChange(e){var r,a;const t=e.detail.value;if(t!=="css"){if(t==="manual"){const i=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_width,o=typeof i=="number"?i:90;this._setConfigValue("elbow.segment.outer_curve",o/2)}else this._setConfigValue("elbow.segment.outer_curve",t==="arm_width"?"auto":t);this.requestUpdate()}}_renderSegmentedElbowReferenceDiagram(){return h`
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
        `}_renderSegmentedLivePreview(e,t,r,a,i,o,c,$,m,l,v,x,I,g=false,u=false){if(!r||!a)return h``;const n=Math.min(90/r,50/a,110/Math.max(e||1,1),2.5),y=r*n,p=a*n,b=e*n,M=Math.min(t*n,Math.max(0,b-.5)),f=Math.max(b+28,p*2.5,70),_=Math.max(y*2,170),F=typeof x=="number"&&x>0?x*n:null,E=typeof I=="number"&&I>0?I*n:null,C=l==="manual"&&typeof v=="number"?Math.min(b,v*n,f-1,_-1):l==="card"&&(F!==null||E!==null)?Math.min(b,F??1/0,E??1/0,f-1,_-1):Math.min(b,f-1,_-1),d=b>0?Math.max(0,M*(C/b)):0,O=F!==null&&F>2&&F<f,R=E!==null&&E>2&&E<_,D=O&&C>F,N=R&&C>E,A=C<b-.5?C/n:null,w=d<M-.5?d/n:null,L=`M ${C} 0 L ${_} 0 L ${_} ${p} L ${y+d} ${p} A ${d} ${d} 0 0 0 ${y} ${p+d} L ${y} ${f} L 0 ${f} L 0 ${C} A ${C} ${C} 0 0 1 ${C} 0 Z`,W=Math.max(m*n,4),V=c*n,k=$*n,T=y+W,H=p+W,Z=_-T,j=f-H,re=g?Math.max(0,d-m*n):i*n,z=Math.max(0,Math.min(re,j-.5,Z-.5)),P=g&&u?Math.max(0,Math.min(z/2,z-.5)):Math.max(0,Math.min(o*n,z-.5)),K=V>0&&k>0&&Z>V&&j>k,Q=K?`M ${T+z} ${H} L ${_} ${H} L ${_} ${H+k} L ${T+V+P} ${H+k} A ${P} ${P} 0 0 0 ${T+V} ${H+k+P} L ${T+V} ${f} L ${T} ${f} L ${T} ${H+z} A ${z} ${z} 0 0 1 ${T+z} ${H} Z`:null,ee=f+(K?74:46),te=_+20;return h`
            <svg viewBox="0 0 ${te} ${ee}" style="width: 100%; max-width: 380px; height: auto;" overflow="hidden">
                <g transform="translate(8, 6)">
                    <!-- Card background — makes the gap between segments visible -->
                    <rect x="0" y="0" width="${_}" height="${f}"
                          fill="var(--ha-card-background,var(--card-background-color,#1c1c2a))"
                          stroke="var(--divider-color,#444)" stroke-width="1" stroke-dasharray="4,3" rx="2"/>

                    <!-- Outer segment arms — blue, L-path naturally excludes the content area -->
                    <path d="${L}" fill="#5599FF" opacity="0.85"/>
                    <!-- outer outer_curve arc -->
                    <path d="M ${C} 0 A ${C} ${C} 0 0 0 0 ${C}"
                          fill="none" stroke="#00CFFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    <!-- outer inner_curve arc -->
                    ${d>2?B`
                        <path d="M ${y+d} ${p} A ${d} ${d} 0 0 0 ${y} ${p+d}"
                              fill="none" stroke="#5599FF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    `:""}

                    <!-- Inner segment — orange, sits inside the gap -->
                    ${K?B`
                        <path d="${Q}" fill="#FF8C00" opacity="0.85"/>
                        <!-- inner outer_curve arc -->
                        ${z>2?B`
                            <path d="M ${T+z} ${H} A ${z} ${z} 0 0 0 ${T} ${H+z}"
                                  fill="none" stroke="#FF8C00" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.85"/>
                        `:""}
                        <!-- inner inner_curve arc -->
                        ${P>2?B`
                            <path d="M ${T+V+P} ${H+k} A ${P} ${P} 0 0 0 ${T+V} ${H+k+P}"
                                  fill="none" stroke="#FFAA33" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                        `:""}
                    `:""}

                    <!-- Card boundary lines — dashed line + faint overlay shows what the card clips -->
                    ${O?B`
                        ${D?B`
                            <rect x="0" y="${F}" width="${_}" height="${f-F}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="0" y1="${F}" x2="${_}" y2="${F}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${_-3}" y="${F-3}" fill="#FF4444" font-size="8" text-anchor="end" opacity="0.9">↕ ${x}px</text>
                    `:""}
                    ${R?B`
                        ${N?B`
                            <rect x="${E}" y="0" width="${_-E}" height="${f}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="${E}" y1="0" x2="${E}" y2="${f}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${E+3}" y="10" fill="#FF4444" font-size="8" text-anchor="start" opacity="0.9">↔ ${I}px</text>
                    `:""}

                    <!-- Clamp indicator (bottom-right) -->
                    ${l==="none"?B`
                        <text x="${_-2}" y="${f-5}" fill="#7BCF7B" font-size="9" text-anchor="end" opacity="0.8">no clamp</text>
                    `:l==="card"?B`
                        <text x="${_-2}" y="${f-5}" fill="var(--secondary-text-color,#888)" font-size="9" text-anchor="end" opacity="0.7">card clamp</text>
                    `:B`
                        <text x="${_-2}" y="${f-5}" fill="var(--warning-color,#FFA500)" font-size="9" text-anchor="end" opacity="0.8">fixed clamp</text>
                    `}

                    <!-- Legend -->
                    <circle cx="4" cy="${f+14}" r="4" fill="#00CFFF" opacity="0.9"/>
                    <text x="12" y="${f+18}" fill="#00CFFF" font-size="9" font-family="monospace">outer_curve = ${A!==null?`${e.toFixed(1)}→${A.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>
                    <circle cx="4" cy="${f+30}" r="4" fill="#5599FF" opacity="0.9"/>
                    <text x="12" y="${f+34}" fill="#5599FF" font-size="9" font-family="monospace">inner_curve = ${w!==null?`${t.toFixed(1)}→${w.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                    ${K?B`
                        <circle cx="4" cy="${f+46}" r="4" fill="#FF8C00" opacity="0.9"/>
                        <text x="12" y="${f+50}" fill="#FF8C00" font-size="9" font-family="monospace">outer_curve = ${g?`${(z/n).toFixed(1)}px`:`${i.toFixed(1)}px`}</text>
                        <circle cx="4" cy="${f+62}" r="4" fill="#FFAA33" opacity="0.9"/>
                        <text x="12" y="${f+66}" fill="#FFAA33" font-size="9" font-family="monospace">inner_curve = ${g&&u?`${(P/n).toFixed(1)}px`:`${o.toFixed(1)}px`}</text>
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
        `}_renderCurveLivePreview(e,t,r,a,i,o,c,$){const m=Math.min(90/r,50/a,110/(e||1),2.5),l=r*m,v=a*m,x=e*m,I=Math.min(t*m,x-.5),g=Math.max(x+28,v*2.5,70),u=Math.max(l*2,170),n=typeof c=="number"&&c>0?c*m:null,y=typeof $=="number"&&$>0?$*m:null,p=i==="manual"&&typeof o=="number"?Math.min(x,o*m,g-1,u-1):i==="card"&&(n!==null||y!==null)?Math.min(x,n??1/0,y??1/0,g-1,u-1):Math.min(x,g-1,u-1),b=x>0?Math.max(0,I*(p/x)):0,M=n!==null&&n>2&&n<g,f=y!==null&&y>2&&y<u,_=M&&p>n,F=f&&p>y,E=p<x-.5?p/m:null,C=b<I-.5?b/m:null,d=`M ${p} 0 L ${u} 0 L ${u} ${v} L ${l+b} ${v} A ${b} ${b} 0 0 0 ${l} ${v+b} L ${l} ${g} L 0 ${g} L 0 ${p} A ${p} ${p} 0 0 1 ${p} 0 Z`,O=p>40?p/2-4:p+8,R=p>40?p/2-4:4,D=l+b/2,N=v+b+14,A=g+44,w=u+20;return h`
            <svg viewBox="0 0 ${w} ${A}" style="width: 100%; max-width: 380px; height: auto;" overflow="hidden">
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
                    <rect x="0" y="0" width="${u}" height="${g}"
                          fill="none" stroke="var(--divider-color,#444)" stroke-width="1" stroke-dasharray="4,3" rx="2"/>

                    <!-- Elbow fill -->
                    <path d="${d}" fill="var(--primary-color,#FF9900)" opacity="0.8"/>

                    <!-- Outer arc annotation -->
                    <path d="M ${p} 0 A ${p} ${p} 0 0 0 0 ${p}"
                          fill="none" stroke="#00CFFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    <text x="${O}" y="${R}"
                          fill="#00CFFF" font-size="10" text-anchor="middle" font-family="monospace"
                          dominant-baseline="auto">${E!==null?`${e.toFixed(1)}→${E.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>

                    <!-- Inner arc annotation -->
                    <path d="M ${l+b} ${v} A ${b} ${b} 0 0 0 ${l} ${v+b}"
                          fill="none" stroke="#FFAA33" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    ${b>6?B`
                        <text x="${D}" y="${N}"
                              fill="#FFAA33" font-size="10" text-anchor="middle" font-family="monospace">${C!==null?`${t.toFixed(1)}→${C.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                    `:""}

                    <!-- Card boundary lines — dashed line + faint overlay shows what the card clips -->
                    ${M?B`
                        ${_?B`
                            <rect x="0" y="${n}" width="${u}" height="${g-n}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="0" y1="${n}" x2="${u}" y2="${n}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${u-3}" y="${n-3}" fill="#FF4444" font-size="8" text-anchor="end" opacity="0.9">↕ ${c}px</text>
                    `:""}
                    ${f?B`
                        ${F?B`
                            <rect x="${y}" y="0" width="${u-y}" height="${g}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="${y}" y1="0" x2="${y}" y2="${g}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${y+3}" y="10" fill="#FF4444" font-size="8" text-anchor="start" opacity="0.9">↔ ${$}px</text>
                    `:""}

                    <!-- Clamp-mode indicator (bottom-right) -->
                    ${i==="none"?B`
                        <text x="${u-2}" y="${g-5}" fill="#7BCF7B" font-size="9" text-anchor="end" opacity="0.8">no clamp</text>
                    `:i==="card"?B`
                        <text x="${u-2}" y="${g-5}" fill="var(--secondary-text-color,#888)" font-size="9" text-anchor="end" opacity="0.7">card clamp</text>
                    `:B`
                        <text x="${u-2}" y="${g-5}" fill="var(--warning-color,#FFA500)" font-size="9" text-anchor="end" opacity="0.8">fixed clamp</text>
                    `}

                    <!-- Legend row below card -->
                    <circle cx="4" cy="${g+14}" r="4" fill="#00CFFF" opacity="0.9"/>
                    <text x="12" y="${g+18}" fill="#00CFFF" font-size="10" font-family="monospace">outer_curve = ${E!==null?`${e.toFixed(1)}→${E.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>
                    <circle cx="4" cy="${g+30}" r="4" fill="#FFAA33" opacity="0.9"/>
                    <text x="12" y="${g+34}" fill="#FFAA33" font-size="10" font-family="monospace">inner_curve = ${C!==null?`${t.toFixed(1)}→${C.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                </g>
            </svg>
        `}_renderCurveModeMessage(e,t,r,a,i,o){const c=S(l=>l.toFixed(1),"f"),m=(e==="outer"?{auto:`bar_width ÷ 2 = ${c(a/2)} px. Classic LCARS sweep from the vertical arm.`,arm_height:`bar_height ÷ 2 = ${c(i/2)} px. Based on the horizontal arm: ${i<a?"smaller than auto for this config":"useful when bar_height is the dominant arm"}.`,arm_max:`max(${a}, ${i}) ÷ 2 = ${c(Math.max(a,i)/2)} px. Uses the larger arm; same as auto when bar_width ≥ bar_height. Recommended for consistent paired elbows.`,arm_min:`min(${a}, ${i}) ÷ 2 = ${c(Math.min(a,i)/2)} px. Tightest arc, based on the thinner arm. ${a!==i?"Significantly smaller than auto for asymmetric bars.":"Equal bars: same as auto."}`,arm_fill:`max(${a}, ${i}) = ${c(Math.max(a,i))} px. Maximum sweep: fills the entire dominant arm. Dramatic effect; arc may be clipped by the card edge.`}:{auto:`outer_curve ÷ 2 = ${c((o||r*2)/2)} px. LCARS concentric formula: matches the outer arc's curvature family.`,arm_max:`max(${a}, ${i}) ÷ 2 = ${c(Math.max(a,i)/2)} px. Independent of outer_curve, based on the larger arm.`,arm_width:`bar_width ÷ 2 = ${c(a/2)} px. Based on the vertical arm width.`,arm_height:`bar_height ÷ 2 = ${c(i/2)} px. Based on the horizontal arm: ${i<a?"tighter than arm_width for this config":"same as arm_width for this config"}.`,arm_min:`min(${a}, ${i}) ÷ 2 = ${c(Math.min(a,i)/2)} px. Tightest inner arc.`,arm_fill:`max(${a}, ${i}) = ${c(Math.max(a,i))} px. Very large inner arc; likely exceeds the outer. Use with care.`})[t];return m?h`
            <lcards-message type="info" message="${m}"></lcards-message>
        `:""}_handleInnerCurveModeChange(e){var r;const t=e.detail.value;if(t!=="css"){if(t==="manual"){const a=((r=this.config.elbow)==null?void 0:r.segment)||{},i=typeof a.bar_width=="number"?a.bar_width:90;this._setConfigValue("elbow.segment.inner_curve",Math.round(i/4))}else t==="auto"?this._setConfigValue("elbow.segment.inner_curve",void 0):this._setConfigValue("elbow.segment.inner_curve",t);this.requestUpdate()}}_handleClampModeChange(e){const t=e.detail.value;t==="manual"?this._setConfigValue("elbow.segment.outer_curve_clamp",60):t==="card"?this._setConfigValue("elbow.segment.outer_curve_clamp",void 0):this._setConfigValue("elbow.segment.outer_curve_clamp",t),this.requestUpdate()}_handleSegCurveModeChange(e,t,r,a,i){t==="manual"?this._setConfigValue(e,r):t==="css"?this._setConfigValue(e,a):t==="auto"?this._setConfigValue(e,void 0):this._setConfigValue(e,i&&t==="arm_width"?"auto":t),this.requestUpdate()}_handleSegClampModeChange(e,t,r){t==="manual"?this._setConfigValue(e,r):t==="card"?this._setConfigValue(e,void 0):this._setConfigValue(e,t),this.requestUpdate()}_handleDimModeChange(e,t,r,a){e==="css"?this._setConfigValue(t,a):this._setConfigValue(t,r),this.requestUpdate()}_handleBarWidthModeChange(e){var r,a;const t=e.detail.value;if(t==="css")this._setConfigValue("elbow.segment.bar_width","clamp(60px, 8vw, 120px)");else if(t==="theme")this._setConfigValue("elbow.segment.bar_width","theme");else{const i=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_width,o=typeof i=="number"?i:90;this._setConfigValue("elbow.segment.bar_width",o)}this.requestUpdate()}_handleBarHeightModeChange(e){var r,a;const t=e.detail.value;if(t==="css"){this._setConfigValue("elbow.segment.bar_height","clamp(40px, 6vh, 90px)"),this.requestUpdate();return}if(t==="theme")this._setConfigValue("elbow.segment.bar_height","theme");else{const i=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_height,o=typeof i=="number"?i:90;this._setConfigValue("elbow.segment.bar_height",o)}this.requestUpdate()}_handleInnerOuterCurveToggle(e){var r,a,i;if(e.detail.value){const o=this._calculateInnerOuterCurveAuto();this._setConfigValue("elbow.segments.inner_segment.outer_curve",o)}else{const o={...this.config};((i=(a=(r=o.elbow)==null?void 0:r.segments)==null?void 0:a.inner_segment)==null?void 0:i.outer_curve)!==void 0&&(delete o.elbow.segments.inner_segment.outer_curve,this.config=o,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true})))}this.requestUpdate()}_handleDiagonalAngleModeChange(e){var r,a;if(e.detail.value==="theme")this._setConfigValue("elbow.segment.diagonal_angle","theme");else{const i=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.diagonal_angle,o=typeof i=="number"?i:45;this._setConfigValue("elbow.segment.diagonal_angle",o)}this.requestUpdate()}_handleOuterDiagonalAngleModeChange(e){var r,a,i;if(e.detail.value==="theme")this._setConfigValue("elbow.segments.outer_segment.diagonal_angle","theme");else{const o=(i=(a=(r=this.config.elbow)==null?void 0:r.segments)==null?void 0:a.outer_segment)==null?void 0:i.diagonal_angle,c=typeof o=="number"?o:45;this._setConfigValue("elbow.segments.outer_segment.diagonal_angle",c)}this.requestUpdate()}_handleInnerDiagonalAngleModeChange(e){var r,a,i,o,c,$;if(e.detail.value==="theme")this._setConfigValue("elbow.segments.inner_segment.diagonal_angle","theme");else{const m=(i=(a=(r=this.config.elbow)==null?void 0:r.segments)==null?void 0:a.inner_segment)==null?void 0:i.diagonal_angle,l=($=(c=(o=this.config.elbow)==null?void 0:o.segments)==null?void 0:c.outer_segment)==null?void 0:$.diagonal_angle,v=typeof m=="number"?m:typeof l=="number"?l:45;this._setConfigValue("elbow.segments.inner_segment.diagonal_angle",v)}this.requestUpdate()}_calculateInnerOuterCurveAuto(){var o,c,$,m,l,v,x;const e=((c=(o=this.config.elbow)==null?void 0:o.segments)==null?void 0:c.outer_segment)||{},t=((m=($=this.config.elbow)==null?void 0:$.segments)==null?void 0:m.gap)??4,r=e.bar_width??90,a=((x=(v=(l=this.config.elbow)==null?void 0:l.segments)==null?void 0:v.inner_segment)==null?void 0:x.bar_width)??60,i=e.outer_curve??r/2;return Math.max(0,i-t-a)}_renderSegmentEntityAndActions(e,t){const r=`elbow.segments.${e}`;return h`
            <lcards-form-section
                header="Entity and actions"
                description="This segment's own entity and tap actions (default: the card's)"
                icon="mdi:gesture-tap"
                ?expanded=${false}
                ?outlined=${false}>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Entity"}
                    .helper=${"Its colour state map and actions follow this entity (default: the card's entity)"}
                    .selector=${{entity:{}}}
                    .value=${t.entity_id||""}
                    @value-changed=${a=>a.detail.value?this._setConfigValue(`${r}.entity_id`,a.detail.value):this._removeConfigPath(`${r}.entity_id`)}>
                </ha-selector>
                <lcards-multi-action-editor
                    .hass=${this.hass}
                    .actions=${{tap_action:t.tap_action,hold_action:t.hold_action,double_tap_action:t.double_tap_action}}
                    @value-changed=${a=>this._handleSegmentActionsChange(r,a)}>
                </lcards-multi-action-editor>
            </lcards-form-section>
        `}_handleSegmentActionsChange(e,t){t.stopPropagation();const r=t.detail.value||{},a=e.split(".").reduce((i,o)=>i==null?void 0:i[o],this.config)||{};for(const i of["tap_action","hold_action","double_tap_action"])r[i]?this._setConfigValue(`${e}.${i}`,r[i]):a[i]&&this._removeConfigPath(`${e}.${i}`)}_handleActionsChange(e){const t=e.detail.value,r={};t.tap_action&&(r.tap_action=t.tap_action),t.hold_action&&(r.hold_action=t.hold_action),t.double_tap_action&&(r.double_tap_action=t.double_tap_action);const a={...this.config,...r};!t.tap_action&&this.config.tap_action&&delete a.tap_action,!t.hold_action&&this.config.hold_action&&delete a.hold_action,!t.double_tap_action&&this.config.double_tap_action&&delete a.double_tap_action,this.config=a,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true}))}_deleteConfigValue(e){const t={...this.config},r=e.split(".");let a=t;for(let i=0;i<r.length-1;i++){if(!a[r[i]])return;a=a[r[i]]}delete a[r[r.length-1]],this.config=t,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true}))}_renderEffectsTab(){return h`
            <div class="tab-content-container">
                ${be({header:"Combining effects",icon:"mdi:lightbulb-outline",body:h`
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
        `}_parseStylePx(e){if(typeof e!="string")return null;const t=e.match(/^(\d+(?:\.\d+)?)px$/);return t?parseFloat(t[1]):null}};S(se,"LCARdSElbowEditor");let ne=se;customElements.get("lcards-elbow-editor")||customElements.define("lcards-elbow-editor",ne);export{ne as LCARdSElbowEditor};
//# sourceMappingURL=lcards-elbow-editor-IkSUrumM.js.map
