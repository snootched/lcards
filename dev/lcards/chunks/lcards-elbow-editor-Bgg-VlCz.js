var ye=Object.defineProperty;var C=(Y,e)=>ye(Y,"name",{value:e,configurable:true});import{l as J,f as we,m as be,o as $e,d as Ce,b as c,p as Se,A as _e,g as Fe,w as z,h as ie}from"./lcards-main-Dyh7t6jw.js";import{a as ke,L as oe}from"./LCARdSBaseEditor-DKqLTaC3.js";import{e as Ae}from"./lcards-shape-texture-editor-5GFrb0S-.js";import{c as ae,y as Me}from"./lcards-yaml-editor-BVTHq2uG.js";import{r as ve}from"./lcards-message-DwgRzp3Y.js";import"./lcards-form-section--YQsY5gW.js";import"./lcards-color-picker-MJVPREQD.js";import"./lcards-color-section-v2-C_JrvWUu.js";import"./lcards-multi-action-editor-CL0fqmtf.js";import"./lcards-padding-editor-DSH2-blf.js";import"./lcards-filter-editor-QuI4zSYF.js";import"./lcards-background-animation-editor-Zsdqq-O8.js";const Re=[["top","Top"],["bottom","Bottom"],["left","Left"],["right","Right"]];function Ee(Y={}){return{body:Y.type==="frame"?"Body (interior)":xe(Y.type)?"Body (the bar)":"Body (open area)",full:"Full (entire card)",...Ie(Y)}}C(Ee,"elbowEditorZones");function xe(Y){return String(Y||"").startsWith("bar-")}C(xe,"isBarType");function Ie(Y){const e=Y.type||"header-left",t=Y.style||"simple";if(xe(e))return{};if(e==="frame"){const r=Y.frame||{},a={};for(const[n,i]of Re){const l=r[n]||{},p=l.bar_width??l.bar_height??l.thickness;l.enabled===false||p===0||(a[n]=i)}return a}return t==="segmented"?{outer_vertical_bar:"Outer Vertical Bar",inner_vertical_bar:"Inner Vertical Bar",outer_horizontal_bar:"Outer Horizontal Bar",inner_horizontal_bar:"Inner Horizontal Bar"}:e.endsWith("-open")?{horizontal_bar:"Horizontal Bar"}:e.endsWith("-contained")?{left_bar:"Left Bar",right_bar:"Right Bar",horizontal_bar:"Horizontal Bar"}:{vertical_bar:"Vertical Bar",horizontal_bar:"Horizontal Bar"}}C(Ie,"shapeZones");const le=class le2 extends ke{static get properties(){return{...super.properties,_liveOuterCurve:{type:Number,state:true},_liveInnerCurve:{type:Number,state:true},_liveSegOuterOC:{type:Number,state:true},_liveSegOuterIC:{type:Number,state:true},_liveSegInnerOC:{type:Number,state:true},_liveSegInnerIC:{type:Number,state:true},_segCurveTab:{type:String,state:true}}}constructor(){super(),this.cardType="elbow",this._cardElement=null,this._symbioCardPickerDialogRef=null,this._symbioCardEditorDialogRef=null,this._yamlDebounceTimer=null,this._cssDebounceTimer=null,this._liveOuterCurve=null,this._liveInnerCurve=null,this._liveSegOuterOC=null,this._liveSegOuterIC=null,this._liveSegInnerOC=null,this._liveSegInnerIC=null,this._segCurveTab="outer"}firstUpdated(){var e;(e=super.firstUpdated)==null||e.call(this,{}),this._tryFindCardElement()}_tryFindCardElement(){let e=0;const t=10,r=C(()=>{e++,this._findCardElement(),!this._cardElement&&e<t&&requestAnimationFrame(r)},"tryFind");requestAnimationFrame(r)}_findCardElement(){var a;const e=`lcards-${this.cardType}`;if((a=this._cardElement)!=null&&a.isConnected)return;let t=null;const r=this.closest(".wrapper");if(r){const n=r.getRootNode();if(n instanceof ShadowRoot){const i=n.host;if(i){const l=i.parentElement;if(l){const p=l.parentElement;if(p){const d=p.querySelector(".element-preview");if(d){const s=C((b,x=0)=>{if(x>5)return null;const O=b.querySelector(e);if(O)return O;const g=b.querySelectorAll("*");for(const h of g)if(h.shadowRoot){const o=s(h.shadowRoot,x+1);if(o)return o}return null},"searchInShadows");t=d.querySelector(e)||s(d)}}}}}}if(!t&&(t=document.querySelector(e),!t)){for(const n of document.querySelectorAll("*"))if(n.shadowRoot&&(t=n.shadowRoot.querySelector(e),t))break}t&&t!==this._cardElement&&(this._cardElement=t,this.requestUpdate())}connectedCallback(){var e;(e=super.connectedCallback)==null||e.call(this),this._boundHandleCardPickerResult=this._handleSymbiontCardPickerResult.bind(this),document.addEventListener("lcards-symbiont-card-picker-result",this._boundHandleCardPickerResult)}disconnectedCallback(){var e;(e=super.disconnectedCallback)==null||e.call(this),this._boundHandleCardPickerResult&&document.removeEventListener("lcards-symbiont-card-picker-result",this._boundHandleCardPickerResult),this._symbioCardPickerDialogRef&&(this._symbioCardPickerDialogRef.remove(),this._symbioCardPickerDialogRef=null),this._symbioCardEditorDialogRef&&(this._symbioCardEditorDialogRef.remove(),this._symbioCardEditorDialogRef=null),clearTimeout(this._yamlDebounceTimer??void 0),clearTimeout(this._cssDebounceTimer??void 0)}static get styles(){return[super.styles,Ae]}_getTabDefinitions(){return[{label:"Config",content:C(()=>this._renderFromConfig(this._getConfigTabConfig()),"content")},{label:"Elbow Design",content:C(()=>this._renderElbowDesignTab(),"content")},{label:"Zones",content:C(()=>this._renderZonesTab(),"content")},{label:"Text",content:C(()=>this._renderTextTab(),"content")},{label:"Symbiont",content:C(()=>this._renderSymbiontTab(),"content")},{label:"Actions",content:C(()=>this._renderActionsTab(),"content")},{label:"Effects",content:C(()=>this._renderEffectsTab(),"content")},{label:"Sound",content:C(()=>this._renderSoundTab(["card_tap","card_hold","card_double_tap","card_hover","toggle_on","toggle_off"]),"content")},...this._getUtilityTabs()]}async _openSymbiontCardPicker(){var r;if(!customElements.get("hui-card-picker")){J.warn('[ElbowEditor] hui-card-picker not loaded yet. Click "Add Card" on the dashboard once to prime it, then try again.'),we({title:"Card picker not ready",message:"Home Assistant hasn’t loaded its card picker yet. On any dashboard, click “Add card” once (you can cancel it), then come back and try again."});return}this._symbioCardPickerDialogRef&&(this._symbioCardPickerDialogRef.remove(),this._symbioCardPickerDialogRef=null);const e=document.createElement("ha-dialog");e.headerTitle="Select Symbiont Card Type",this._symbioCardPickerDialogRef=e,be(e,this),e.open=true,await e.updateComplete;const t=document.createElement("hui-card-picker");t.hass=this.hass,t.lovelace=this._getSymbiontLovelace(),t.style.cssText="padding: 24px; display: block;",e.appendChild(t),await new Promise(a=>setTimeout(a,100)),(r=t.requestUpdate)==null||r.call(t),t.updateComplete&&await t.updateComplete,t.addEventListener("config-changed",a=>{var i;const n=(i=a.detail)==null?void 0:i.config;J.debug("[ElbowEditor] Symbiont card type selected:",n==null?void 0:n.type),document.dispatchEvent(new CustomEvent("lcards-symbiont-card-picker-result",{detail:{config:n}})),e.open=false}),$e(e,()=>{e.remove(),this._symbioCardPickerDialogRef===e&&(this._symbioCardPickerDialogRef=null)})}_handleSymbiontCardPickerResult(e){var r;const t=(r=e.detail)==null?void 0:r.config;t&&(J.debug("[ElbowEditor] Applying symbiont card config from picker:",t.type),this._setConfigValue("symbiont.card",t))}async _openSymbiontCardEditor(){var p,d;const e=(d=(p=this.config)==null?void 0:p.symbiont)==null?void 0:d.card;if(!(e!=null&&e.type))return;if(!customElements.get("hui-card-element-editor")){J.warn("[ElbowEditor] hui-card-element-editor not available yet");return}this._symbioCardEditorDialogRef&&(this._symbioCardEditorDialogRef.remove(),this._symbioCardEditorDialogRef=null);const t=document.createElement("ha-dialog");t.headerTitle=`Edit: ${e.type}`,t.setAttribute("prevent-scrim-close",""),this._symbioCardEditorDialogRef=t;const r=document.createElement("div");r.style.cssText="padding: 16px; min-height: 300px; min-width: 420px; box-sizing: border-box;";const a=document.createElement("hui-card-element-editor");a.hass=this.hass,a.lovelace=this._getSymbiontLovelace(),a.value=JSON.parse(JSON.stringify(e));let n=JSON.parse(JSON.stringify(e));a.addEventListener("config-changed",s=>{var b;(b=s.detail)!=null&&b.config&&typeof s.detail.config=="object"&&s.detail.config.type&&(n=s.detail.config)}),a.addEventListener("value-changed",s=>{var b;(b=s.detail)!=null&&b.value&&typeof s.detail.value=="object"&&s.detail.value.type&&(n=s.detail.value)}),r.appendChild(a),t.appendChild(r);const i=document.createElement("ha-button");i.textContent="Cancel",i.setAttribute("appearance","plain"),i.addEventListener("click",()=>{t.open=false});const l=document.createElement("ha-button");l.textContent="Save",l.setAttribute("variant","brand"),l.addEventListener("click",()=>{n!=null&&n.type&&(this._setConfigValue("symbiont.card",JSON.parse(JSON.stringify(n))),J.debug("[ElbowEditor] Symbiont card config saved from editor:",n.type)),t.open=false}),t.appendChild(Ce({secondary:[i],primary:[l]})),$e(t,()=>{t.remove(),this._symbioCardEditorDialogRef===t&&(this._symbioCardEditorDialogRef=null)}),be(t,this),setTimeout(()=>{t.open=true},10),J.debug("[ElbowEditor] Opened symbiont card editor dialog for:",e.type)}_getSymbiontLovelace(){var t;let e=((t=this.lovelace)==null?void 0:t.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}_getElbowComponent(e){var t,r,a;return(a=(r=(t=window.lcards)==null?void 0:t.core)==null?void 0:r.componentManager)==null?void 0:a.getComponent(e)}_getElbowComponentEntries(){var t,r;const e=(r=(t=window.lcards)==null?void 0:t.core)==null?void 0:r.componentManager;return e?e.getComponentsByType("elbow").map(a=>[a,e.getComponent(a)]):[]}_getConfigTabConfig(){var l;const e=((l=this.config.elbow)==null?void 0:l.type)||"header-left",t=this._getElbowStyle(),r=this._getElbowComponent(e),n=((r==null?void 0:r.features)||["simple"]).includes("segmented"),i=[{value:"simple",label:"Simple (single elbow)"}];return n&&i.push({value:"segmented",label:"Segmented (Picard-style double)"}),[...this._buildConfigTab({infoMessage:"Configure your LCARS elbow card. Elbows are positioned borders with rounded corners that create the iconic LCARS interface aesthetic.",modeSections:[{type:"section",header:"Elbow Configuration",description:"Choose elbow position and style",icon:"mdi:vector-polyline",expanded:false,outlined:true,children:[{type:"custom",render:C(()=>c`
                                ${this._renderFieldWithHandler("elbow.type",{label:"Elbow Position",helper:"Position of the elbow corner on the card",value:e,selectorOverride:{select:{mode:"dropdown",options:this._getElbowComponentEntries().map(([p,d])=>{var s;return{value:p,label:((s=d.metadata)==null?void 0:s.name)||p}})}}},p=>this._handleElbowTypeChange(p))}

                                ${this._renderFieldWithHandler("elbow.style",{label:"Elbow Style",helper:n?t==="simple"?"Simple: Single elbow with one curve":"Segmented: Double concentric elbows with gap (TNG aesthetic)":"This component only supports simple style",value:t,disabled:!n,selectorOverride:{select:{mode:"dropdown",options:i}}},p=>this._handleStyleChange(p))}
                            `,"render")}]},{type:"section",header:"Entity",description:"Entity to observe and attribute for state range conditions",icon:"mdi:home-automation",expanded:false,outlined:true,children:[{type:"custom",render:C(()=>{var p;return c`
                                ${this._renderFieldWithHandler("entity",{label:"Entity",helper:"[Optional] Entity whose state drives colour and icon changes",value:((p=this.config)==null?void 0:p.entity)||"",selectorOverride:{entity:{}}},d=>{d?this._setConfigValue("entity",d):this._removeConfigPath("entity")})}
                            `},"render")},{type:"custom",render:C(()=>this._renderRangesAttributeSelector(),"render")},{type:"custom",render:C(()=>this._renderStateAttributeSelector(),"render")},{type:"custom",render:C(()=>this._renderStateClassificationElseSelector(),"render")}]}],basicFields:[{path:"id",label:"Card ID",helper:"[Optional] Custom ID for targeting with rules and animations"},{path:"tags",label:"Tags",helper:"Select existing tags or type new ones for rule targeting"}],showBasicSection:true,basicSectionHeader:"Card Identification"}),{type:"section",header:"Sizing",description:"Override card dimensions: useful in stacks, overlays, or any auto-height container",icon:"mdi:resize",expanded:false,outlined:true,children:[{type:"grid",columns:2,children:[{type:"field",path:"height"},{type:"field",path:"width"},{type:"field",path:"min_height"},{type:"field",path:"min_width"},{type:"field",path:"max_height"},{type:"field",path:"max_width"},{type:"field",path:"overflow"},{type:"field",path:"z_index"},{type:"field",path:"overflow_x"},{type:"field",path:"overflow_y"}]},{type:"custom",render:C(()=>this._renderLayoutCardHint(),"render")}]}]}_renderElbowDesignTab(){var r;const e=((r=this.config.elbow)==null?void 0:r.type)||"header-left",t=this._getElbowStyle();return e==="frame"?this._renderFrameDesign():t==="segmented"?this._renderSegmentedDesign():this._renderSimpleDesign()}_renderFrameDesign(){var _,k,I,F,V;const e=((_=this.config.elbow)==null?void 0:_.frame)||{},t=this._getElbowStyle(),r=t==="segmented",a=e.bar_width??90,n=e.bar_height??a,i=e.outer_curve??Math.round(a/2),l=e.inner_curve??Math.round(i/2),p=C(v=>{const R=e[v]||{},B=R.bar_width??R.bar_height??R.thickness;return B!==void 0?B:v==="top"||v==="bottom"?n:a},"sideThickness"),d=C(v=>(e[v]||{}).enabled!==false,"sideEnabled"),s=((k=e.segments)==null?void 0:k.inner_frame)||{},b=s.bar_width??28,x=s.bar_height??b,O=s.outer_curve??Math.round(b/2),g=s.inner_curve??Math.round(O/2),h=((I=e.segments)==null?void 0:I.gap)??4,o=Se(e,t).corners,y=C(v=>{var R,B,D;return((B=(R=e.corners)==null?void 0:R[v])==null?void 0:B.outer_curve)??((D=o[v])==null?void 0:D.outer)??i},"cornerOuter"),f=C(v=>{var R,B,D;return((B=(R=e.corners)==null?void 0:R[v])==null?void 0:B.inner_curve)??((D=o[v])==null?void 0:D.inner)??l},"cornerInner"),u=C((v,R,B,{min:D=0,max:A=250,mode:w="slider",helper:W=void 0,style:L=""}={})=>{const E=this._getConfigValue(v),S=this._isCssExpr(E)?this._renderCssField(R,E,v,typeof B=="number"?B:void 0):oe.renderField(this,v,{label:R,helper:W,value:B,selectorOverride:{number:{min:D,max:A,step:1,mode:w,unit_of_measurement:"px"}}});return L?c`<div style=${L}>${S}</div>`:S},"lengthField"),M=C((v,R)=>c`
            <div style="display: flex; align-items: center; gap: 12px; padding: 4px 0;">
                <div style="flex: 0 0 140px;">
                    ${oe.renderField(this,`elbow.frame.${v}.enabled`,{label:R,value:d(v)})}
                </div>
                ${d(v)?u(`elbow.frame.${v}.${v==="top"||v==="bottom"?"bar_height":"bar_width"}`,"Thickness (px)",p(v),{min:1,max:500,mode:"box",style:"flex: 1;"}):""}
            </div>
        `,"renderSideRow"),m=C((v,R)=>{const B=v.includes("right")&&!d("right")||v.includes("left")&&!d("left")||v.includes("top")&&!d("top")||v.includes("bottom")&&!d("bottom"),D=B?"End cap outer (px)":"Outer curve (px)",A=B?"End cap inner (px)":"Inner curve (px)";return c`
                <div style="display: flex; align-items: center; gap: 8px; padding: 2px 0;">
                    <span style="flex: 0 0 130px; font-size: 13px; color: var(--secondary-text-color);">${R}</span>
                    ${u(`elbow.frame.corners.${v}.outer_curve`,D,y(v),{mode:"box",style:"flex: 1;"})}
                    ${u(`elbow.frame.corners.${v}.inner_curve`,A,f(v),{mode:"box",style:"flex: 1;",helper:"Rounded curve on the inner corner of the bar; only applied when both adjacent sides are enabled"})}
                </div>
            `},"renderCornerRow");return c`
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

                ${u("elbow.frame.bar_width","Default Side Width (left/right)",a,{min:1,max:500,mode:"slider",helper:"Applied to left and right bars unless overridden"})}

                ${u("elbow.frame.bar_height","Default Side Height (top/bottom)",n,{min:1,max:500,mode:"slider",helper:"Applied to top and bottom bars unless overridden"})}

                ${u("elbow.frame.outer_curve","Default Outer Corner Curve",i,{min:0,max:250,mode:"slider",helper:"Outer corner/end-cap arc radius: applied to all 4 corners unless overridden"})}

                ${u("elbow.frame.inner_curve","Default Inner Corner Curve",l,{min:0,max:250,mode:"slider",helper:"Default inner corner curve; only applied when both adjacent sides are enabled; open-side corners are always square"})}
            </lcards-form-section>

            <!-- Per-side control -->
            <lcards-form-section
                header="Per-Side Control"
                description="Enable or disable each side and override its thickness. Disabled sides create open ends with rounded end-caps."
                icon="mdi:border-style"
                ?expanded=${true}
                ?outlined=${true}>

                ${M("top","Top bar")}
                ${M("bottom","Bottom bar")}
                ${M("left","Left bar")}
                ${M("right","Right bar")}
            </lcards-form-section>

            <!-- Per-corner curves -->
            <lcards-form-section
                header="Per-Corner Curves"
                description="Override outer and inner arc radii per corner. When an adjacent side is disabled, these become end-cap arcs."
                icon="mdi:vector-curve"
                ?expanded=${false}
                ?outlined=${true}>

                ${m("top_left","Top-left")}
                ${m("top_right","Top-right")}
                ${m("bottom_left","Bottom-left")}
                ${m("bottom_right","Bottom-right")}
            </lcards-form-section>

            <!-- Segmented (double ring) -->
            ${r?c`
                <lcards-form-section
                    header="Inner Ring (Segmented)"
                    description="Configure the inner frame ring dimensions. The inner ring is inset from the outer ring by the gap."
                    icon="mdi:border-inside"
                    ?expanded=${true}
                    ?outlined=${true}>

                    ${u("elbow.frame.segments.gap","Gap between rings (px)",h,{min:0,max:50,mode:"box"})}

                    ${u("elbow.frame.segments.inner_frame.bar_width","Inner ring width (left/right)",b,{min:1,max:500,mode:"slider"})}

                    ${u("elbow.frame.segments.inner_frame.bar_height","Inner ring height (top/bottom)",x,{min:1,max:500,mode:"slider"})}

                    ${u("elbow.frame.segments.inner_frame.outer_curve","Inner ring outer curve",O,{min:0,max:250,mode:"slider"})}

                    ${u("elbow.frame.segments.inner_frame.inner_curve","Inner ring inner curve",g,{min:0,max:250,mode:"slider",helper:"Inner ring corner curve; only applied when both adjacent sides are enabled; open-side corners are always square"})}
                </lcards-form-section>

                <lcards-form-section
                    header="Inner Ring Colours"
                    description="State-based colours for the inner (secondary) frame ring"
                    icon="mdi:palette-outline"
                    ?expanded=${false}
                    ?outlined=${true}>

                    <lcards-color-section-v2
                        .editor=${this}
                        .entityId=${((F=this.config)==null?void 0:F.entity)||""}
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
                    .entityId=${((V=this.config)==null?void 0:V.entity)||""}
                    basePath="elbow.segment.color"
                    header="Frame Colours"
                    description="Frame colour per entity state"
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            ${this._renderShapeTextureSection()}
        `}_isCssExpr(e){return!(typeof e!="string"||e===""||e==="theme"||e==="auto"||["arm_width","arm_height","arm_max","arm_min","arm_fill"].includes(e)||/^\s*-?\d+(\.\d+)?\s*(px)?\s*$/.test(e))}_renderCssField(e,t,r,a){return this._renderFieldWithHandler(r,{label:e,helper:"CSS length: vw, vh, clamp(), calc(), etc. Switch mode dropdown to revert to slider.",value:t||"",selectorOverride:{text:{}}},n=>{const i=String(n??"").trim();this._setConfigValue(r,i===""?a:i)})}_renderSimpleDesign(){var I,F,V,v,R,B,D,A;const e=((I=this.config.elbow)==null?void 0:I.segment)||{},t=e.bar_width!==void 0?e.bar_width:90,r=e.bar_height!==void 0?e.bar_height:typeof t=="number"?t:90,a=e.outer_curve??"auto",n=e.inner_curve,l=["auto","arm_width","arm_height","arm_max","arm_min","arm_fill"].includes(n),p=this._isCssExpr(t),d=this._isCssExpr(r),s=this._isCssExpr(a),b=!l&&this._isCssExpr(n),x=e.outer_curve_clamp??"card",O=typeof x=="number",g=O?"manual":x,h=typeof t=="number"?t:90,o=typeof r=="number"?r:90,y=Math.min(h,o),f=Math.max(h,o),u=a==="arm_height"?o/2:a==="arm_max"?f/2:a==="arm_min"?y/2:a==="arm_fill"?f:h/2,M=typeof a=="number"?a:u,m=n==="arm_width"?h/2:n==="arm_height"?o/2:n==="arm_max"?f/2:n==="arm_min"?y/2:n==="arm_fill"?f:n===void 0?ie(M,h,o):M/2,_=s?"css":typeof a=="number"?"manual":a,k=b?"css":typeof n=="number"?"manual":n??"auto";return c`
            ${this._isBarType()?this._renderBarSlant(e):c`
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
                    .helper=${p?"CSS expression: edit via YAML":t==="theme"?"Dynamic: follows input_number.lcars_vertical":"Static pixel value"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_vertical)"},{value:"css",label:"CSS Expression (YAML only)"}]}}}
                    .value=${p?"css":t==="theme"?"theme":"static"}
                    @value-changed=${w=>this._handleBarWidthModeChange(w)}>
                </ha-selector>

                ${p?this._renderCssField("Bar Width (Vertical)",t,"elbow.segment.bar_width",90):t!=="theme"?c`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Bar Width (Vertical)"}
                            .helper=${"Thickness of the vertical sidebar"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof t=="number"?t:90}
                            @value-changed=${w=>this._setConfigValue("elbow.segment.bar_width",w.detail.value)}>
                        </ha-selector>
                    `:c`
                        <lcards-message type="info" title="Theme Integration">
                            Bar width will dynamically follow <code>input_number.lcars_vertical</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </lcards-message>
                    `}

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Bar Height Mode (Horizontal)"}
                    .helper=${d?"CSS expression: edit via YAML":r==="theme"?"Dynamic: follows input_number.lcars_horizontal":"Static pixel value"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_horizontal)"},{value:"css",label:"CSS Expression (YAML only)"}]}}}
                    .value=${d?"css":r==="theme"?"theme":"static"}
                    @value-changed=${w=>this._handleBarHeightModeChange(w)}>
                </ha-selector>

                ${d?this._renderCssField("Bar Height (Horizontal)",r,"elbow.segment.bar_height",90):r!=="theme"?c`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Bar Height (Horizontal)"}
                            .helper=${"Thickness of the horizontal bar"}
                            .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof r=="number"?r:90}
                            @value-changed=${w=>this._setConfigValue("elbow.segment.bar_height",w.detail.value)}>
                        </ha-selector>
                    `:c`
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
                    ${this._renderCurveLivePreview(this._liveOuterCurve??(typeof a=="number"?a:u),this._liveInnerCurve??(typeof n=="number"?n:m),h,o,g,x,this._parseStylePx(((V=(F=this.config)==null?void 0:F.style)==null?void 0:V.height)??((v=this.config)==null?void 0:v.height)),this._parseStylePx(((B=(R=this.config)==null?void 0:R.style)==null?void 0:B.width)??((D=this.config)==null?void 0:D.width)))}
                </div>

                <!-- Outer curve -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Outer Arc Radius"}
                    .helper=${s?"CSS expression: edit via YAML":`→ ${u.toFixed(1)} px`}
                    .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto / arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2), for paired elbows"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm, full sweep)"},{value:"manual",label:"manual  (explicit px)"},...s?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                    .value=${_}
                    @value-changed=${this._handleOuterCurveModeChange}>
                </ha-selector>

                ${s?this._renderCssField("Outer Curve Radius",a,"elbow.segment.outer_curve","auto"):_==="manual"?c`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Outer Curve Radius"}
                            .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof a=="number"?a:u}
                            @input=${w=>{var L,E,S;const W=Number((S=(E=(L=w.composedPath)==null?void 0:L.call(w))==null?void 0:E[0])==null?void 0:S.value);isNaN(W)||(this._liveOuterCurve=W)}}
                            @value-changed=${w=>{this._liveOuterCurve=null,this._setConfigValue("elbow.segment.outer_curve",w.detail.value)}}>
                        </ha-selector>
                    `:this._renderCurveModeMessage("outer",_,u,h,o)}

                <!-- Inner curve -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Inner Arc Radius"}
                    .helper=${b?"CSS expression: edit via YAML":`→ ${m.toFixed(1)} px`}
                    .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...b?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                    .value=${k}
                    @value-changed=${this._handleInnerCurveModeChange}>
                </ha-selector>

                ${b?this._renderCssField("Inner Curve Radius",n,"elbow.segment.inner_curve","auto"):k==="manual"?c`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Inner Curve Radius"}
                            .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof n=="number"?n:m}
                            @input=${w=>{var L,E,S;const W=Number((S=(E=(L=w.composedPath)==null?void 0:L.call(w))==null?void 0:E[0])==null?void 0:S.value);isNaN(W)||(this._liveInnerCurve=W)}}
                            @value-changed=${w=>{this._liveInnerCurve=null,this._setConfigValue("elbow.segment.inner_curve",w.detail.value)}}>
                        </ha-selector>
                    `:this._renderCurveModeMessage("inner",k,m,h,o,u)}

                <!-- Curve clamp -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Curve Clamp"}
                    .helper=${"Controls how the arc radius is limited at render time"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"card",label:"card: clamp to card viewport (default)"},{value:"none",label:"none: no clamp (consistent paired elbows)"},{value:"manual",label:"manual: explicit px ceiling"}]}}}
                    .value=${g}
                    @value-changed=${this._handleClampModeChange}>
                </ha-selector>

                ${O?c`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Clamp Ceiling"}
                        .selector=${{number:{min:0,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${typeof x=="number"?x:60}
                        @value-changed=${w=>this._setConfigValue("elbow.segment.outer_curve_clamp",w.detail.value)}>
                    </ha-selector>
                `:c`
                    <lcards-message
                        type=${g==="none"?"success":"info"}
                        message=${g==="none"?"No clamping: the arc radius is exactly the computed value. The SVG clips overflow at the card edge. Use this for paired elbows in different-height cards so both render identically.":"The arc radius is clamped to min(card_width, card_height) at render time. Two elbows with the same config in differently-sized cards may render with different radii. Use none to prevent this."}>
                    </lcards-message>
                `}

                ${this._isDiagonalCapType()?c`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Diagonal Angle Mode"}
                        .helper=${e.diagonal_angle==="theme"?"Dynamic: follows input_number.lcars_elbow_angle":"Static angle value"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                        .value=${e.diagonal_angle==="theme"?"theme":"static"}
                        @value-changed=${w=>this._handleDiagonalAngleModeChange(w)}>
                    </ha-selector>

                    ${e.diagonal_angle!=="theme"?c`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Diagonal Cut Angle"}
                            .helper=${"Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)"}
                            .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                            .value=${typeof e.diagonal_angle=="number"?e.diagonal_angle:45}
                            @value-changed=${w=>this._setConfigValue("elbow.segment.diagonal_angle",w.detail.value)}>
                        </ha-selector>
                    `:c`
                        <lcards-message type="info" title="Theme Integration">
                            Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </lcards-message>
                    `}
                `:""}
            </lcards-form-section>
            `}

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
        `}_renderShapeTextureSection(){var e,t,r;return c`
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
        `}_renderSegmentedDesign(){var Q,ne,ee,te,de,ce,he,ue,me,ge,fe,pe;const e=((Q=this.config.elbow)==null?void 0:Q.segments)||{},t=e.gap??4,r=e.outer_segment||{},a=e.inner_segment||{},n=["auto","arm_width","arm_height","arm_max","arm_min","arm_fill"],i=typeof r.bar_width=="number"?r.bar_width:90,l=typeof r.bar_height=="number"?r.bar_height:i,p=Math.min(i,l),d=Math.max(i,l),s=r.outer_curve??"auto",x=!n.includes(s)&&this._isCssExpr(s),O=x?"css":typeof s=="number"?"manual":s,g=typeof s=="number"?s:s==="arm_height"?l/2:s==="arm_max"?d/2:s==="arm_min"?p/2:s==="arm_fill"?d:i/2,h=r.inner_curve,y=!n.includes(h)&&this._isCssExpr(h),f=y?"css":typeof h=="number"?"manual":h??"auto",u=typeof h=="number"?h:h==="arm_width"?i/2:h==="arm_height"?l/2:h==="arm_max"?d/2:h==="arm_min"?p/2:h==="arm_fill"?d:h===void 0?ie(g,i,l):g/2,M=r.outer_curve_clamp??"card",m=typeof M=="number"?"manual":M,_=typeof a.bar_width=="number"?a.bar_width:60,k=typeof a.bar_height=="number"?a.bar_height:_,I=Math.min(_,k),F=Math.max(_,k),V=this._parseStylePx(((ee=(ne=this.config)==null?void 0:ne.style)==null?void 0:ee.height)??((te=this.config)==null?void 0:te.height)),R=Math.max(0,Math.min(g,m==="none"?1/0:typeof M=="number"?M:V??1/0)),B=g>0?Math.max(0,u*(R/g)):0,D=Math.max(0,B-t),A=a.outer_curve,w=n.includes(A),W=!w&&this._isCssExpr(A),L=W?"css":typeof A=="number"?"manual":A??"auto",E=typeof A=="number"?A:A==="arm_height"?k/2:A==="arm_max"?F/2:A==="arm_min"?I/2:A==="arm_fill"?F:w?_/2:D,S=a.inner_curve,H=!n.includes(S)&&this._isCssExpr(S),Z=H?"css":typeof S=="number"?"manual":S??"auto",G=typeof S=="number"?S:S==="arm_width"?_/2:S==="arm_height"?k/2:S==="arm_max"?F/2:S==="arm_min"?I/2:S==="arm_fill"?F:S===void 0&&A===void 0?ie(E,_,k):E/2,re=this._liveSegOuterOC??(typeof s=="number"?s:g),T=this._liveSegOuterIC??(typeof h=="number"?h:u),N=this._liveSegInnerOC??E,K=this._liveSegInnerIC??G;return c`
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
                    @value-changed=${$=>this._setConfigValue("elbow.segments.gap",$.detail.value)}>
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
                    .entityId=${r.entity_id||((de=this.config)==null?void 0:de.entity)||""}
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

                    ${this._renderSegmentBar(r.bar_width,"elbow.segments.outer_segment.bar_width",{label:"Bar Width",helper:"Vertical bar thickness",shown:90,fallback:90,css:"clamp(60px, 8vw, 120px)",theme:"input_number.lcars_vertical"})}

                    ${this._renderSegmentBar(r.bar_height,"elbow.segments.outer_segment.bar_height",{label:"Bar Height",helper:"Horizontal bar thickness",shown:i,fallback:90,css:"clamp(40px, 6vh, 90px)",theme:"input_number.lcars_horizontal"})}

                    ${this._isDiagonalCapType()?c`
                        <ha-selector .hass=${this.hass}
                            .label=${"Diagonal Angle Mode"}
                            .helper=${r.diagonal_angle==="theme"?"Dynamic: follows the input_number.lcars_elbow_angle helper":"Static: fixed angle value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                            .value=${r.diagonal_angle==="theme"?"theme":"static"}
                            @value-changed=${$=>this._handleOuterDiagonalAngleModeChange($)}>
                        </ha-selector>
                        ${r.diagonal_angle!=="theme"?c`
                            <ha-selector .hass=${this.hass} .label=${"Diagonal Cut Angle"}
                                .helper=${"Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)"}
                                .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                                .value=${typeof r.diagonal_angle=="number"?r.diagonal_angle:45}
                                @value-changed=${$=>this._setConfigValue("elbow.segments.outer_segment.diagonal_angle",$.detail.value)}>
                            </ha-selector>
                        `:c`
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
                    .entityId=${a.entity_id||((ce=this.config)==null?void 0:ce.entity)||""}
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

                    ${this._renderSegmentBar(a.bar_width,"elbow.segments.inner_segment.bar_width",{label:"Bar Width",helper:"Vertical bar thickness",shown:60,fallback:60,css:"clamp(40px, 5vw, 80px)",theme:"input_number.lcars_vertical"})}

                    ${this._renderSegmentBar(a.bar_height,"elbow.segments.inner_segment.bar_height",{label:"Bar Height",helper:"Horizontal bar thickness",shown:_,fallback:60,css:"clamp(30px, 4vh, 60px)",theme:"input_number.lcars_horizontal"})}

                    ${this._isDiagonalCapType()?c`
                        <ha-selector .hass=${this.hass}
                            .label=${"Diagonal Angle Mode"}
                            .helper=${a.diagonal_angle==="theme"?"Dynamic: follows the input_number.lcars_elbow_angle helper":"Static: fixed angle value"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                            .value=${a.diagonal_angle==="theme"?"theme":"static"}
                            @value-changed=${$=>this._handleInnerDiagonalAngleModeChange($)}>
                        </ha-selector>
                        ${a.diagonal_angle!=="theme"?c`
                            <ha-selector .hass=${this.hass} .label=${"Diagonal Cut Angle"}
                                .helper=${"Angle of diagonal cuts (defaults to outer segment angle)"}
                                .selector=${{number:{min:0,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                                .value=${typeof a.diagonal_angle=="number"?a.diagonal_angle:r.diagonal_angle??45}
                                @value-changed=${$=>this._setConfigValue("elbow.segments.inner_segment.diagonal_angle",$.detail.value)}>
                            </ha-selector>
                        `:c`
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
                    ${this._renderSegmentedLivePreview(re,T,i,l,N,K,_,k,t,m,M,this._parseStylePx(((ue=(he=this.config)==null?void 0:he.style)==null?void 0:ue.height)??((me=this.config)==null?void 0:me.height)),this._parseStylePx(((fe=(ge=this.config)==null?void 0:ge.style)==null?void 0:fe.width)??((pe=this.config)==null?void 0:pe.width)),A===void 0,a.inner_curve===void 0||a.inner_curve==="auto")}
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
                        .value=${O}
                        @value-changed=${$=>this._handleSegCurveModeChange("elbow.segments.outer_segment.outer_curve",$.detail.value,Math.round(g),"clamp(30px, 4vw, 60px)",true)}>
                    </ha-selector>
                    ${x?this._renderCssField("Outer Arc Radius",s,"elbow.segments.outer_segment.outer_curve",Math.round(g)):O==="manual"?c`
                            <ha-selector .hass=${this.hass} .label=${"Outer Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof s=="number"?s:g}
                                @input=${$=>{var U,X,j;const q=Number((j=(X=(U=$.composedPath)==null?void 0:U.call($))==null?void 0:X[0])==null?void 0:j.value);isNaN(q)||(this._liveSegOuterOC=q)}}
                                @value-changed=${$=>{this._liveSegOuterOC=null,this._setConfigValue("elbow.segments.outer_segment.outer_curve",$.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("outer",O,g,i,l)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner Arc Radius"}
                        .helper=${y?"CSS expression: edit via YAML":`→ ${u.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...y?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${f}
                        @value-changed=${$=>this._handleSegCurveModeChange("elbow.segments.outer_segment.inner_curve",$.detail.value,Math.round(u),"clamp(15px, 2vw, 30px)",false)}>
                    </ha-selector>
                    ${y?this._renderCssField("Inner Arc Radius",h,"elbow.segments.outer_segment.inner_curve",Math.round(u)):f==="manual"?c`
                            <ha-selector .hass=${this.hass} .label=${"Inner Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof h=="number"?h:u}
                                @input=${$=>{var U,X,j;const q=Number((j=(X=(U=$.composedPath)==null?void 0:U.call($))==null?void 0:X[0])==null?void 0:j.value);isNaN(q)||(this._liveSegOuterIC=q)}}
                                @value-changed=${$=>{this._liveSegOuterIC=null,this._setConfigValue("elbow.segments.outer_segment.inner_curve",$.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("inner",f,u,i,l,g)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Curve Clamp"}
                        .helper=${{card:"card: clamp to card dimensions (default)",none:"none: no clamp; card clips SVG overflow",manual:`manual: ceiling at ${typeof M=="number"?M:100} px`}[m]??""}
                        .selector=${{select:{mode:"dropdown",options:[{value:"card",label:"card  (clamp to card size)"},{value:"none",label:"none  (no clamp; use with arm_max for paired elbows)"},{value:"manual",label:"manual  (explicit px ceiling)"}]}}}
                        .value=${m}
                        @value-changed=${$=>this._handleSegClampModeChange("elbow.segments.outer_segment.outer_curve_clamp",$.detail.value,100)}>
                    </ha-selector>
                    ${m==="manual"?c`
                        <ha-selector .hass=${this.hass} .label=${"Clamp Ceiling"}
                            .selector=${{number:{min:0,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                            .value=${typeof M=="number"?M:100}
                            @value-changed=${$=>this._setConfigValue("elbow.segments.outer_segment.outer_curve_clamp",$.detail.value)}>
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
                        .helper=${W?"CSS expression: edit via YAML":`→ ${E.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:`auto  (concentric → ${D.toFixed(1)} px)`},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...W?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${L}
                        @value-changed=${$=>this._handleSegCurveModeChange("elbow.segments.inner_segment.outer_curve",$.detail.value,Math.round(E),"clamp(20px, 3vw, 45px)",true)}>
                    </ha-selector>
                    ${W?this._renderCssField("Outer Arc Radius",A,"elbow.segments.inner_segment.outer_curve",Math.round(E)):L==="manual"?c`
                            <ha-selector .hass=${this.hass} .label=${"Outer Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof A=="number"?A:E}
                                @input=${$=>{var U,X,j;const q=Number((j=(X=(U=$.composedPath)==null?void 0:U.call($))==null?void 0:X[0])==null?void 0:j.value);isNaN(q)||(this._liveSegInnerOC=q)}}
                                @value-changed=${$=>{this._liveSegInnerOC=null,this._setConfigValue("elbow.segments.inner_segment.outer_curve",$.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("outer",L,E,_,k)}

                    <ha-selector .hass=${this.hass}
                        .label=${"Inner Arc Radius"}
                        .helper=${H?"CSS expression: edit via YAML":`→ ${G.toFixed(1)} px`}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"auto  (outer ÷ 2, LCARS formula)"},{value:"arm_max",label:"arm_max  (max arm ÷ 2)"},{value:"arm_width",label:"arm_width  (bar_width ÷ 2)"},{value:"arm_height",label:"arm_height  (bar_height ÷ 2)"},{value:"arm_min",label:"arm_min  (min arm ÷ 2)"},{value:"arm_fill",label:"arm_fill  (max arm)"},{value:"manual",label:"manual  (explicit px)"},...H?[{value:"css",label:"CSS expression (YAML only)"}]:[]]}}}
                        .value=${Z}
                        @value-changed=${$=>this._handleSegCurveModeChange("elbow.segments.inner_segment.inner_curve",$.detail.value,Math.round(G),"clamp(10px, 1.5vw, 22px)",false)}>
                    </ha-selector>
                    ${H?this._renderCssField("Inner Arc Radius",S,"elbow.segments.inner_segment.inner_curve",Math.round(G)):Z==="manual"?c`
                            <ha-selector .hass=${this.hass} .label=${"Inner Arc Radius"}
                                .selector=${{number:{min:0,max:250,step:5,mode:"slider",unit_of_measurement:"px"}}}
                                .value=${typeof S=="number"?S:G}
                                @input=${$=>{var U,X,j;const q=Number((j=(X=(U=$.composedPath)==null?void 0:U.call($))==null?void 0:X[0])==null?void 0:j.value);isNaN(q)||(this._liveSegInnerIC=q)}}
                                @value-changed=${$=>{this._liveSegInnerIC=null,this._setConfigValue("elbow.segments.inner_segment.inner_curve",$.detail.value)}}>
                            </ha-selector>
                        `:this._renderCurveModeMessage("inner",Z,G,_,k,E)}

                </lcards-form-section>
            </lcards-form-section>
        `}_renderSymbiontTab(){var l,p,d,s,b,x,O,g,h;const e=((l=this.config)==null?void 0:l.symbiont)||{},t=e.enabled||false,r=e.imprint||{},a=r.enabled!==false,n=r.border_radius||{},i=e.card?ae(e.card):"";return c`
            <div class="tab-content-container">
                ${ve({header:"How the symbiont card works",body:c`
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
                        @value-changed=${o=>this._setConfigValue("symbiont.enabled",o.detail.value)}>
                    </ha-selector>
                </lcards-form-section>

                ${t?c`

                    <!-- Embedded Card Selection -->
                    <lcards-form-section
                        header="Embedded Card"
                        description="Choose the card type and configure it"
                        icon="mdi:card-multiple-outline"
                        ?expanded=${true}
                        ?outlined=${true}>

                        ${e.card?c`
                            <div style="display:flex; align-items:center; gap:8px; padding: 4px 0 8px;">
                                <ha-icon icon="mdi:card-outline" style="color: var(--primary-color);"></ha-icon>
                                <span style="font-weight:500;">${e.card.type}</span>
                            </div>
                        `:c`
                            <lcards-message type="warning" message="No card selected. Use the button below to pick a card type.">
                            </lcards-message>
                        `}

                        <div style="display:flex; gap:8px; flex-wrap:wrap; padding-bottom:8px;">
                            <ha-button @click=${()=>this._openSymbiontCardPicker()}>
                                <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                                ${e.card?"Change Card Type":"Select Card Type"}
                            </ha-button>
                            ${e.card?c`
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

                        ${e.card?c`
                            <lcards-message type="info" message="Edit the full card configuration as YAML below. The card type field must remain as-is or use the 'Change Card Type' button above.">
                            </lcards-message>
                            <ha-code-editor
                                .hass=${this.hass}
                                .value=${i}
                                mode="yaml"
                                @value-changed=${o=>{const y=o.detail.value;clearTimeout(this._yamlDebounceTimer??void 0),this._yamlDebounceTimer=setTimeout(()=>{try{const f=Me(y);f&&typeof f=="object"&&this._setConfigValue("symbiont.card",f)}catch{}},750)}}>
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
                            @value-changed=${o=>this._setConfigValue("symbiont.overflow",o.detail.value==="hidden"?void 0:o.detail.value)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Overflow X (horizontal)"}
                            .helper=${"Overrides the Overflow setting for the horizontal axis only."}
                            .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(inherit from Overflow)"},{value:"hidden",label:"Hidden"},{value:"visible",label:"Visible"},{value:"clip",label:"Clip"},{value:"scroll",label:"Scroll"},{value:"auto",label:"Auto"}]}}}
                            .value=${e.overflow_x??""}
                            @value-changed=${o=>this._setConfigValue("symbiont.overflow_x",o.detail.value||void 0)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Overflow Y (vertical)"}
                            .helper=${"Overrides the Overflow setting for the vertical axis only."}
                            .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(inherit from Overflow)"},{value:"hidden",label:"Hidden"},{value:"visible",label:"Visible"},{value:"clip",label:"Clip"},{value:"scroll",label:"Scroll"},{value:"auto",label:"Auto"}]}}}
                            .value=${e.overflow_y??""}
                            @value-changed=${o=>this._setConfigValue("symbiont.overflow_y",o.detail.value||void 0)}>
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
                            .value=${((p=e.size)==null?void 0:p.width)??""}
                            @value-changed=${o=>this._setConfigValue("symbiont.size.width",o.detail.value||null)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Height"}
                            .helper=${'CSS height of the symbiont container, e.g. "50%" or "150px". Leave blank to fill the available area.'}
                            .selector=${{text:{}}}
                            .value=${((d=e.size)==null?void 0:d.height)??""}
                            @value-changed=${o=>this._setConfigValue("symbiont.size.height",o.detail.value||null)}>
                        </ha-selector>

                        ${((s=e.size)==null?void 0:s.width)!=null||((b=e.size)==null?void 0:b.height)!=null?c`
                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Anchor"}
                                .helper=${"Where to place the sized container within the content area"}
                                .selector=${{select:{mode:"dropdown",options:[{value:"top-left",label:"Top Left"},{value:"top-center",label:"Top Center"},{value:"top-right",label:"Top Right"},{value:"middle-left",label:"Middle Left"},{value:"center",label:"Center"},{value:"middle-right",label:"Middle Right"},{value:"bottom-left",label:"Bottom Left"},{value:"bottom-center",label:"Bottom Center"},{value:"bottom-right",label:"Bottom Right"}]}}}
                                .value=${e.anchor??"top-left"}
                                @value-changed=${o=>this._setConfigValue("symbiont.anchor",o.detail.value)}>
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
                            @value-changed=${o=>this._setConfigValue("symbiont.imprint.enabled",o.detail.value)}>
                        </ha-selector>

                        ${a?c`

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
                                    .entityId=${((O=this.config)==null?void 0:O.entity)||""}
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
                                    @value-changed=${o=>this._setConfigValue("symbiont.imprint.text.font_size",o.detail.value||void 0)}>
                                </ha-selector>

                                <lcards-font-selector
                                    .hass=${this.hass}
                                    .value=${((h=r.text)==null?void 0:h.font_family)||""}
                                    .showPreview=${true}
                                    .label=${"Font Family"}
                                    .helper=${"Font family injected into the embedded card. Leave empty to not imprint."}
                                    @value-changed=${o=>this._setConfigValue("symbiont.imprint.text.font_family",o.detail.value||void 0)}>
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

                                ${["top_left","top_right","bottom_left","bottom_right"].map(o=>{const y=o.replace(/_/g," ").replace(/\b\w/g,m=>m.toUpperCase()),f=n[o],u=f==="match"?"match":f==null?"default":"custom",M=typeof f=="number"?f:0;return c`
                                        <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--divider-color); overflow:hidden;">
                                            <span style="flex:0 0 90px; font-size:13px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${y}</span>
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{select:{mode:"dropdown",options:[{value:"default",label:"Default (no inject)"},{value:"match",label:"Match elbow arc"},{value:"custom",label:"Custom (px)"}]}}}
                                                .value=${u}
                                                style="flex:1; min-width:0;"
                                                @value-changed=${m=>{const _=m.detail.value;_==="default"?this._setConfigValue("symbiont.imprint.border_radius."+o,void 0):_==="match"?this._setConfigValue("symbiont.imprint.border_radius."+o,"match"):this._setConfigValue("symbiont.imprint.border_radius."+o,M)}}>
                                            </ha-selector>
                                            ${u==="custom"?c`
                                                <ha-selector
                                                    .hass=${this.hass}
                                                    .selector=${{number:{min:0,max:200,step:1,mode:"box",unit_of_measurement:"px"}}}
                                                    .value=${M}
                                                    style="flex:0 0 110px;"
                                                    @value-changed=${m=>this._setConfigValue("symbiont.imprint.border_radius."+o,m.detail.value)}>
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
                            @value-changed=${o=>{const y=o.detail.value;clearTimeout(this._cssDebounceTimer??void 0),this._cssDebounceTimer=setTimeout(()=>{this._setConfigValue("symbiont.custom_style",y||void 0)},750)}}>
                        </ha-code-editor>
                    </lcards-form-section>

                `:""}
            </div>
        `}_buildAvailableZones(e){return Ee(e)}_renderTextTab(){var r,a,n;const e=((r=this.config)==null?void 0:r.text)||{},t={...this._buildAvailableZones(((a=this.config)==null?void 0:a.elbow)||{})};for(const i of Object.keys(((n=this.config)==null?void 0:n.zones)||{}))t[i]||(t[i]=i.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()));return c`
            <lcards-multi-text-editor-v2
                .editor=${this}
                .text=${e}
                .hass=${this.hass}
                .availableZones=${t}
                @text-changed=${i=>{this.config={...this.config,text:i.detail.value},this._updateConfig(this.config,"visual")}}>
            </lcards-multi-text-editor-v2>
        `}_renderActionsTab(){var r;const e=this.config.interactive!==false,t=[{value:"pointer",label:"Pointer (hand), default"},{value:"default",label:"Default (arrow)"},{value:"none",label:"None (hidden)"},{value:"not-allowed",label:"Not allowed"},{value:"crosshair",label:"Crosshair"},{value:"grab",label:"Grab"},{value:"zoom-in",label:"Zoom in"},{value:"help",label:"Help"},{value:"wait",label:"Wait"},{value:"progress",label:"Progress"},{value:"move",label:"Move"},{value:"copy",label:"Copy"},{value:"text",label:"Text"}];return c`
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
                    @value-changed=${a=>{const n=a.detail.value;if(n)this._updateConfig({style:{cursor:n}});else{const i={...this.config.style||{}};delete i.cursor,this._updateConfig({style:i})}}}>
                </ha-selector>
            </lcards-form-section>
            <lcards-multi-action-editor
                .hass=${this.hass}
                .actions=${{tap_action:this.config.tap_action,hold_action:this.config.hold_action,double_tap_action:this.config.double_tap_action}}
                @value-changed=${this._handleActionsChange}>
            </lcards-multi-action-editor>
        `}_isDiagonalCapType(){var t;return(((t=this.config.elbow)==null?void 0:t.type)||"header-left").includes("diagonal-cap")}_isBarType(){var e;return String(((e=this.config.elbow)==null?void 0:e.type)||"").startsWith("bar-")}_renderBarSlant(e){const t=e.diagonal_angle;return c`
            <lcards-form-section
                header="Slant"
                description="The bar fills the card; its height is the bar's thickness"
                icon="mdi:angle-acute"
                ?expanded=${true}
                ?outlined=${true}>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Slant Angle Mode"}
                    .helper=${t==="theme"?"Dynamic: follows input_number.lcars_elbow_angle":"Static angle value"}
                    .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:"Theme Binding (input_number.lcars_elbow_angle)"}]}}}
                    .value=${t==="theme"?"theme":"static"}
                    @value-changed=${r=>this._handleDiagonalAngleModeChange(r)}>
                </ha-selector>
                ${t!=="theme"?c`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Slant Angle"}
                        .helper=${"90° = a square end; 45° = a cut as long as the bar is thick; lower is a longer slant"}
                        .selector=${{number:{min:10,max:90,step:5,mode:"slider",unit_of_measurement:"°"}}}
                        .value=${typeof t=="number"?t:45}
                        @value-changed=${r=>this._setConfigValue("elbow.segment.diagonal_angle",r.detail.value)}>
                    </ha-selector>
                `:_e}
            </lcards-form-section>
        `}_getElbowStyle(){var e;return((e=this.config.elbow)==null?void 0:e.style)||"simple"}_getInnerCurveHelperText(e,t){return t!==void 0?`Current: ${t}px (default would be ${e.toFixed(1)}px using LCARS formula: outer / 2)`:`LCARS formula: outer_curve / 2 = ${e.toFixed(1)}px (default if not specified)`}_renderFieldWithHandler(e,t,r){const a={hass:this.hass,_getSchemaForPath:C(n=>this._getSchemaForPath(n),"_getSchemaForPath"),_getConfigValue:C(n=>this._getConfigValue(n),"_getConfigValue"),_setConfigValue:C((n,i)=>r(i),"_setConfigValue")};return oe.renderField(a,e,t)}_handleElbowTypeChange(e){this._setConfigValue("elbow.type",e);const t=this._getElbowComponent(e),r=(t==null?void 0:t.features)||["simple"];this._getElbowStyle()==="segmented"&&!r.includes("segmented")&&(this._setConfigValue("elbow.style","simple"),this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:true,composed:true,detail:{message:"Style changed to Simple - selected component does not support Segmented mode",duration:3e3}})))}_handleStyleChange(e){var n;const t=this._getElbowStyle();if(e===t)return;const r=Fe({availablePresets:[],positionEnum:[]}),a={type:((n=this.config.elbow)==null?void 0:n.type)||"header-left",style:e};if(e==="simple"){const i=r.properties.elbow.properties.segment.default||{bar_width:90,bar_height:90,outer_curve:"auto"};a.segment={...i}}else{const i=r.properties.elbow.properties.segments.default||{gap:4,outer_segment:{bar_width:90,bar_height:90},inner_segment:{bar_width:60,bar_height:60}};a.segments=JSON.parse(JSON.stringify(i))}this._setConfigValue("elbow",a),this.requestUpdate()}_handleOuterCurveModeChange(e){var r,a;const t=e.detail.value;if(t!=="css"){if(t==="manual"){const n=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_width,i=typeof n=="number"?n:90;this._setConfigValue("elbow.segment.outer_curve",i/2)}else this._setConfigValue("elbow.segment.outer_curve",t==="arm_width"?"auto":t);this.requestUpdate()}}_renderSegmentedElbowReferenceDiagram(){return c`
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
        `}_renderSegmentedLivePreview(e,t,r,a,n,i,l,p,d,s,b,x,O,g=false,h=false){if(!r||!a)return c``;const o=Math.min(90/r,50/a,110/Math.max(e||1,1),2.5),y=r*o,f=a*o,u=e*o,M=Math.min(t*o,Math.max(0,u-.5)),m=Math.max(u+28,f*2.5,70),_=Math.max(y*2,170),k=typeof x=="number"&&x>0?x*o:null,I=typeof O=="number"&&O>0?O*o:null,F=s==="manual"&&typeof b=="number"?Math.min(u,b*o,m-1,_-1):s==="card"&&(k!==null||I!==null)?Math.min(u,k??1/0,I??1/0,m-1,_-1):Math.min(u,m-1,_-1),V=u>0?Math.max(0,M*(F/u)):0,v=k!==null&&k>2&&k<m,R=I!==null&&I>2&&I<_,B=v&&F>k,D=R&&F>I,A=F<u-.5?F/o:null,w=V<M-.5?V/o:null,W=`M ${F} 0 L ${_} 0 L ${_} ${f} L ${y+V} ${f} A ${V} ${V} 0 0 0 ${y} ${f+V} L ${y} ${m} L 0 ${m} L 0 ${F} A ${F} ${F} 0 0 1 ${F} 0 Z`,L=Math.max(d*o,4),E=l*o,S=p*o,P=y+L,H=f+L,Z=_-P,G=m-H,re=g?Math.max(0,V-d*o):n*o,T=Math.max(0,Math.min(re,G-.5,Z-.5)),N=g&&h?Math.max(0,Math.min(T/2,T-.5)):Math.max(0,Math.min(i*o,T-.5)),K=E>0&&S>0&&Z>E&&G>S,Q=K?`M ${P+T} ${H} L ${_} ${H} L ${_} ${H+S} L ${P+E+N} ${H+S} A ${N} ${N} 0 0 0 ${P+E} ${H+S+N} L ${P+E} ${m} L ${P} ${m} L ${P} ${H+T} A ${T} ${T} 0 0 1 ${P+T} ${H} Z`:null,ee=m+(K?74:46),te=_+20;return c`
            <svg viewBox="0 0 ${te} ${ee}" style="width: 100%; max-width: 380px; height: auto;" overflow="hidden">
                <g transform="translate(8, 6)">
                    <!-- Card background — makes the gap between segments visible -->
                    <rect x="0" y="0" width="${_}" height="${m}"
                          fill="var(--ha-card-background,var(--card-background-color,#1c1c2a))"
                          stroke="var(--divider-color,#444)" stroke-width="1" stroke-dasharray="4,3" rx="2"/>

                    <!-- Outer segment arms — blue, L-path naturally excludes the content area -->
                    <path d="${W}" fill="#5599FF" opacity="0.85"/>
                    <!-- outer outer_curve arc -->
                    <path d="M ${F} 0 A ${F} ${F} 0 0 0 0 ${F}"
                          fill="none" stroke="#00CFFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    <!-- outer inner_curve arc -->
                    ${V>2?z`
                        <path d="M ${y+V} ${f} A ${V} ${V} 0 0 0 ${y} ${f+V}"
                              fill="none" stroke="#5599FF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    `:""}

                    <!-- Inner segment — orange, sits inside the gap -->
                    ${K?z`
                        <path d="${Q}" fill="#FF8C00" opacity="0.85"/>
                        <!-- inner outer_curve arc -->
                        ${T>2?z`
                            <path d="M ${P+T} ${H} A ${T} ${T} 0 0 0 ${P} ${H+T}"
                                  fill="none" stroke="#FF8C00" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.85"/>
                        `:""}
                        <!-- inner inner_curve arc -->
                        ${N>2?z`
                            <path d="M ${P+E+N} ${H+S} A ${N} ${N} 0 0 0 ${P+E} ${H+S+N}"
                                  fill="none" stroke="#FFAA33" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                        `:""}
                    `:""}

                    <!-- Card boundary lines — dashed line + faint overlay shows what the card clips -->
                    ${v?z`
                        ${B?z`
                            <rect x="0" y="${k}" width="${_}" height="${m-k}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="0" y1="${k}" x2="${_}" y2="${k}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${_-3}" y="${k-3}" fill="#FF4444" font-size="8" text-anchor="end" opacity="0.9">↕ ${x}px</text>
                    `:""}
                    ${R?z`
                        ${D?z`
                            <rect x="${I}" y="0" width="${_-I}" height="${m}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="${I}" y1="0" x2="${I}" y2="${m}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${I+3}" y="10" fill="#FF4444" font-size="8" text-anchor="start" opacity="0.9">↔ ${O}px</text>
                    `:""}

                    <!-- Clamp indicator (bottom-right) -->
                    ${s==="none"?z`
                        <text x="${_-2}" y="${m-5}" fill="#7BCF7B" font-size="9" text-anchor="end" opacity="0.8">no clamp</text>
                    `:s==="card"?z`
                        <text x="${_-2}" y="${m-5}" fill="var(--secondary-text-color,#888)" font-size="9" text-anchor="end" opacity="0.7">card clamp</text>
                    `:z`
                        <text x="${_-2}" y="${m-5}" fill="var(--warning-color,#FFA500)" font-size="9" text-anchor="end" opacity="0.8">fixed clamp</text>
                    `}

                    <!-- Legend -->
                    <circle cx="4" cy="${m+14}" r="4" fill="#00CFFF" opacity="0.9"/>
                    <text x="12" y="${m+18}" fill="#00CFFF" font-size="9" font-family="monospace">outer_curve = ${A!==null?`${e.toFixed(1)}→${A.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>
                    <circle cx="4" cy="${m+30}" r="4" fill="#5599FF" opacity="0.9"/>
                    <text x="12" y="${m+34}" fill="#5599FF" font-size="9" font-family="monospace">inner_curve = ${w!==null?`${t.toFixed(1)}→${w.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                    ${K?z`
                        <circle cx="4" cy="${m+46}" r="4" fill="#FF8C00" opacity="0.9"/>
                        <text x="12" y="${m+50}" fill="#FF8C00" font-size="9" font-family="monospace">outer_curve = ${g?`${(T/o).toFixed(1)}px`:`${n.toFixed(1)}px`}</text>
                        <circle cx="4" cy="${m+62}" r="4" fill="#FFAA33" opacity="0.9"/>
                        <text x="12" y="${m+66}" fill="#FFAA33" font-size="9" font-family="monospace">inner_curve = ${g&&h?`${(N/o).toFixed(1)}px`:`${i.toFixed(1)}px`}</text>
                    `:""}
                </g>
            </svg>
        `}_renderElbowReferenceDiagram(){return c`
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
        `}_renderCurveLivePreview(e,t,r,a,n,i,l,p){const d=Math.min(90/r,50/a,110/(e||1),2.5),s=r*d,b=a*d,x=e*d,O=Math.min(t*d,x-.5),g=Math.max(x+28,b*2.5,70),h=Math.max(s*2,170),o=typeof l=="number"&&l>0?l*d:null,y=typeof p=="number"&&p>0?p*d:null,f=n==="manual"&&typeof i=="number"?Math.min(x,i*d,g-1,h-1):n==="card"&&(o!==null||y!==null)?Math.min(x,o??1/0,y??1/0,g-1,h-1):Math.min(x,g-1,h-1),u=x>0?Math.max(0,O*(f/x)):0,M=o!==null&&o>2&&o<g,m=y!==null&&y>2&&y<h,_=M&&f>o,k=m&&f>y,I=f<x-.5?f/d:null,F=u<O-.5?u/d:null,V=`M ${f} 0 L ${h} 0 L ${h} ${b} L ${s+u} ${b} A ${u} ${u} 0 0 0 ${s} ${b+u} L ${s} ${g} L 0 ${g} L 0 ${f} A ${f} ${f} 0 0 1 ${f} 0 Z`,v=f>40?f/2-4:f+8,R=f>40?f/2-4:4,B=s+u/2,D=b+u+14,A=g+44,w=h+20;return c`
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
                    <rect x="0" y="0" width="${h}" height="${g}"
                          fill="none" stroke="var(--divider-color,#444)" stroke-width="1" stroke-dasharray="4,3" rx="2"/>

                    <!-- Elbow fill -->
                    <path d="${V}" fill="var(--primary-color,#FF9900)" opacity="0.8"/>

                    <!-- Outer arc annotation -->
                    <path d="M ${f} 0 A ${f} ${f} 0 0 0 0 ${f}"
                          fill="none" stroke="#00CFFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    <text x="${v}" y="${R}"
                          fill="#00CFFF" font-size="10" text-anchor="middle" font-family="monospace"
                          dominant-baseline="auto">${I!==null?`${e.toFixed(1)}→${I.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>

                    <!-- Inner arc annotation -->
                    <path d="M ${s+u} ${b} A ${u} ${u} 0 0 0 ${s} ${b+u}"
                          fill="none" stroke="#FFAA33" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    ${u>6?z`
                        <text x="${B}" y="${D}"
                              fill="#FFAA33" font-size="10" text-anchor="middle" font-family="monospace">${F!==null?`${t.toFixed(1)}→${F.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                    `:""}

                    <!-- Card boundary lines — dashed line + faint overlay shows what the card clips -->
                    ${M?z`
                        ${_?z`
                            <rect x="0" y="${o}" width="${h}" height="${g-o}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="0" y1="${o}" x2="${h}" y2="${o}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${h-3}" y="${o-3}" fill="#FF4444" font-size="8" text-anchor="end" opacity="0.9">↕ ${l}px</text>
                    `:""}
                    ${m?z`
                        ${k?z`
                            <rect x="${y}" y="0" width="${h-y}" height="${g}"
                                  fill="#FF4444" opacity="0.10"/>
                        `:""}
                        <line x1="${y}" y1="0" x2="${y}" y2="${g}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${y+3}" y="10" fill="#FF4444" font-size="8" text-anchor="start" opacity="0.9">↔ ${p}px</text>
                    `:""}

                    <!-- Clamp-mode indicator (bottom-right) -->
                    ${n==="none"?z`
                        <text x="${h-2}" y="${g-5}" fill="#7BCF7B" font-size="9" text-anchor="end" opacity="0.8">no clamp</text>
                    `:n==="card"?z`
                        <text x="${h-2}" y="${g-5}" fill="var(--secondary-text-color,#888)" font-size="9" text-anchor="end" opacity="0.7">card clamp</text>
                    `:z`
                        <text x="${h-2}" y="${g-5}" fill="var(--warning-color,#FFA500)" font-size="9" text-anchor="end" opacity="0.8">fixed clamp</text>
                    `}

                    <!-- Legend row below card -->
                    <circle cx="4" cy="${g+14}" r="4" fill="#00CFFF" opacity="0.9"/>
                    <text x="12" y="${g+18}" fill="#00CFFF" font-size="10" font-family="monospace">outer_curve = ${I!==null?`${e.toFixed(1)}→${I.toFixed(1)}px`:`${e.toFixed(1)}px`}</text>
                    <circle cx="4" cy="${g+30}" r="4" fill="#FFAA33" opacity="0.9"/>
                    <text x="12" y="${g+34}" fill="#FFAA33" font-size="10" font-family="monospace">inner_curve = ${F!==null?`${t.toFixed(1)}→${F.toFixed(1)}px`:`${t.toFixed(1)}px`}</text>
                </g>
            </svg>
        `}_renderCurveModeMessage(e,t,r,a,n,i){const l=C(s=>s.toFixed(1),"f"),d=(e==="outer"?{auto:`bar_width ÷ 2 = ${l(a/2)} px. Classic LCARS sweep from the vertical arm.`,arm_height:`bar_height ÷ 2 = ${l(n/2)} px. Based on the horizontal arm: ${n<a?"smaller than auto for this config":"useful when bar_height is the dominant arm"}.`,arm_max:`max(${a}, ${n}) ÷ 2 = ${l(Math.max(a,n)/2)} px. Uses the larger arm; same as auto when bar_width ≥ bar_height. Recommended for consistent paired elbows.`,arm_min:`min(${a}, ${n}) ÷ 2 = ${l(Math.min(a,n)/2)} px. Tightest arc, based on the thinner arm. ${a!==n?"Significantly smaller than auto for asymmetric bars.":"Equal bars: same as auto."}`,arm_fill:`max(${a}, ${n}) = ${l(Math.max(a,n))} px. Maximum sweep: fills the entire dominant arm. Dramatic effect; arc may be clipped by the card edge.`}:{auto:`outer_curve ÷ 2 = ${l((i||r*2)/2)} px. LCARS concentric formula: matches the outer arc's curvature family.`,arm_max:`max(${a}, ${n}) ÷ 2 = ${l(Math.max(a,n)/2)} px. Independent of outer_curve, based on the larger arm.`,arm_width:`bar_width ÷ 2 = ${l(a/2)} px. Based on the vertical arm width.`,arm_height:`bar_height ÷ 2 = ${l(n/2)} px. Based on the horizontal arm: ${n<a?"tighter than arm_width for this config":"same as arm_width for this config"}.`,arm_min:`min(${a}, ${n}) ÷ 2 = ${l(Math.min(a,n)/2)} px. Tightest inner arc.`,arm_fill:`max(${a}, ${n}) = ${l(Math.max(a,n))} px. Very large inner arc; likely exceeds the outer. Use with care.`})[t];return d?c`
            <lcards-message type="info" message="${d}"></lcards-message>
        `:""}_handleInnerCurveModeChange(e){var r;const t=e.detail.value;if(t!=="css"){if(t==="manual"){const a=((r=this.config.elbow)==null?void 0:r.segment)||{},n=typeof a.bar_width=="number"?a.bar_width:90;this._setConfigValue("elbow.segment.inner_curve",Math.round(n/4))}else t==="auto"?this._setConfigValue("elbow.segment.inner_curve",void 0):this._setConfigValue("elbow.segment.inner_curve",t);this.requestUpdate()}}_handleClampModeChange(e){const t=e.detail.value;t==="manual"?this._setConfigValue("elbow.segment.outer_curve_clamp",60):t==="card"?this._setConfigValue("elbow.segment.outer_curve_clamp",void 0):this._setConfigValue("elbow.segment.outer_curve_clamp",t),this.requestUpdate()}_handleSegCurveModeChange(e,t,r,a,n){t==="manual"?this._setConfigValue(e,r):t==="css"?this._setConfigValue(e,a):t==="auto"?this._setConfigValue(e,void 0):this._setConfigValue(e,n&&t==="arm_width"?"auto":t),this.requestUpdate()}_handleSegClampModeChange(e,t,r){t==="manual"?this._setConfigValue(e,r):t==="card"?this._setConfigValue(e,void 0):this._setConfigValue(e,t),this.requestUpdate()}_renderSegmentBar(e,t,{label:r,helper:a,shown:n,fallback:i,css:l,theme:p}){const d=this._isCssExpr(e)?"css":e==="theme"?"theme":"static",s=C(b=>{b!==d&&(this._setConfigValue(t,b==="css"?l:b==="theme"?"theme":i),this.requestUpdate())},"setMode");return c`
            <ha-selector .hass=${this.hass} .label=${`${r} Mode`}
                .helper=${d==="css"?"CSS expression active":d==="theme"?`Follows ${p}`:"Static: fixed pixel value"}
                .selector=${{select:{mode:"dropdown",options:[{value:"static",label:"Static Value"},{value:"theme",label:`Theme Binding (${p})`},{value:"css",label:"CSS Expression (vw/vh/clamp/calc)"}]}}}
                .value=${d}
                @value-changed=${b=>s(b.detail.value)}>
            </ha-selector>
            ${d==="css"?this._renderCssField(r,e,t,i):d==="static"?c`
                    <ha-selector .hass=${this.hass} .label=${r} .helper=${a}
                        .selector=${{number:{min:10,max:500,step:5,mode:"slider",unit_of_measurement:"px"}}}
                        .value=${typeof e=="number"?e:n}
                        @value-changed=${b=>this._setConfigValue(t,b.detail.value)}>
                    </ha-selector>`:_e}
        `}_handleBarWidthModeChange(e){var r,a;const t=e.detail.value;if(t==="css")this._setConfigValue("elbow.segment.bar_width","clamp(60px, 8vw, 120px)");else if(t==="theme")this._setConfigValue("elbow.segment.bar_width","theme");else{const n=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_width,i=typeof n=="number"?n:90;this._setConfigValue("elbow.segment.bar_width",i)}this.requestUpdate()}_handleBarHeightModeChange(e){var r,a;const t=e.detail.value;if(t==="css"){this._setConfigValue("elbow.segment.bar_height","clamp(40px, 6vh, 90px)"),this.requestUpdate();return}if(t==="theme")this._setConfigValue("elbow.segment.bar_height","theme");else{const n=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.bar_height,i=typeof n=="number"?n:90;this._setConfigValue("elbow.segment.bar_height",i)}this.requestUpdate()}_handleInnerOuterCurveToggle(e){var r,a,n;if(e.detail.value){const i=this._calculateInnerOuterCurveAuto();this._setConfigValue("elbow.segments.inner_segment.outer_curve",i)}else{const i={...this.config};((n=(a=(r=i.elbow)==null?void 0:r.segments)==null?void 0:a.inner_segment)==null?void 0:n.outer_curve)!==void 0&&(delete i.elbow.segments.inner_segment.outer_curve,this.config=i,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true})))}this.requestUpdate()}_handleDiagonalAngleModeChange(e){var r,a;if(e.detail.value==="theme")this._setConfigValue("elbow.segment.diagonal_angle","theme");else{const n=(a=(r=this.config.elbow)==null?void 0:r.segment)==null?void 0:a.diagonal_angle,i=typeof n=="number"?n:45;this._setConfigValue("elbow.segment.diagonal_angle",i)}this.requestUpdate()}_handleOuterDiagonalAngleModeChange(e){var r,a,n;if(e.detail.value==="theme")this._setConfigValue("elbow.segments.outer_segment.diagonal_angle","theme");else{const i=(n=(a=(r=this.config.elbow)==null?void 0:r.segments)==null?void 0:a.outer_segment)==null?void 0:n.diagonal_angle,l=typeof i=="number"?i:45;this._setConfigValue("elbow.segments.outer_segment.diagonal_angle",l)}this.requestUpdate()}_handleInnerDiagonalAngleModeChange(e){var r,a,n,i,l,p;if(e.detail.value==="theme")this._setConfigValue("elbow.segments.inner_segment.diagonal_angle","theme");else{const d=(n=(a=(r=this.config.elbow)==null?void 0:r.segments)==null?void 0:a.inner_segment)==null?void 0:n.diagonal_angle,s=(p=(l=(i=this.config.elbow)==null?void 0:i.segments)==null?void 0:l.outer_segment)==null?void 0:p.diagonal_angle,b=typeof d=="number"?d:typeof s=="number"?s:45;this._setConfigValue("elbow.segments.inner_segment.diagonal_angle",b)}this.requestUpdate()}_calculateInnerOuterCurveAuto(){var i,l,p,d,s,b,x;const e=((l=(i=this.config.elbow)==null?void 0:i.segments)==null?void 0:l.outer_segment)||{},t=((d=(p=this.config.elbow)==null?void 0:p.segments)==null?void 0:d.gap)??4,r=e.bar_width??90,a=((x=(b=(s=this.config.elbow)==null?void 0:s.segments)==null?void 0:b.inner_segment)==null?void 0:x.bar_width)??60,n=e.outer_curve??r/2;return Math.max(0,n-t-a)}_renderSegmentEntityAndActions(e,t){const r=`elbow.segments.${e}`;return c`
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
        `}_handleSegmentActionsChange(e,t){t.stopPropagation();const r=t.detail.value||{},a=e.split(".").reduce((n,i)=>n==null?void 0:n[i],this.config)||{};for(const n of["tap_action","hold_action","double_tap_action"])r[n]?this._setConfigValue(`${e}.${n}`,r[n]):a[n]&&this._removeConfigPath(`${e}.${n}`)}_handleActionsChange(e){const t=e.detail.value,r={};t.tap_action&&(r.tap_action=t.tap_action),t.hold_action&&(r.hold_action=t.hold_action),t.double_tap_action&&(r.double_tap_action=t.double_tap_action);const a={...this.config,...r};!t.tap_action&&this.config.tap_action&&delete a.tap_action,!t.hold_action&&this.config.hold_action&&delete a.hold_action,!t.double_tap_action&&this.config.double_tap_action&&delete a.double_tap_action,this.config=a,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true}))}_deleteConfigValue(e){const t={...this.config},r=e.split(".");let a=t;for(let n=0;n<r.length-1;n++){if(!a[r[n]])return;a=a[r[n]]}delete a[r[r.length-1]],this.config=t,this._validateConfig(),this._yamlValue=ae(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true}))}_renderEffectsTab(){return c`
            <div class="tab-content-container">
                ${ve({header:"Combining effects",icon:"mdi:lightbulb-outline",body:c`
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
        `}_parseStylePx(e){if(typeof e!="string")return null;const t=e.match(/^(\d+(?:\.\d+)?)px$/);return t?parseFloat(t[1]):null}};C(le,"LCARdSElbowEditor");let se=le;customElements.get("lcards-elbow-editor")||customElements.define("lcards-elbow-editor",se);export{se as LCARdSElbowEditor};
//# sourceMappingURL=lcards-elbow-editor-Bgg-VlCz.js.map
