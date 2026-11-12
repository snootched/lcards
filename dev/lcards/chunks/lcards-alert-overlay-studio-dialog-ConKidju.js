var V=Object.defineProperty;var Z=(r,e,t)=>e in r?V(r,e,{enumerable:true,configurable:true,writable:true,value:t}):r[e]=t;var p=(r,e)=>V(r,"name",{value:e,configurable:true});var M=(r,e,t)=>Z(r,typeof e!="symbol"?e+"":e,t);import{i as U,a as q,A as F,b as l,w as c,W as X,dq as J,dr as Q,ds as K,dt as Y,du as W,dv as ee,o as j,cV as te,e as ae,m as oe,dw as G,r as se,D as ie}from"./lcards-main-C148JfkA.js";import{r as D,e as re,m as le}from"./lcards-message-CF99Ox_M.js";import{s as ne}from"./lcards-studio-yaml-tab-CrleIpRd.js";import{L as u,a as de}from"./LCARdSBaseEditor-B4auBUbY.js";import{i as P}from"./keyed-yp_zPRhi.js";import"./lcards-form-section-BK3OqcgA.js";import"./lcards-grid-layout-b0hMIlJ5.js";import"./lcards-alert-preview-Bceo6KGC.js";const _=p((r,e,t,o,a=120)=>c`
  <g transform="translate(${r} 0)">
    <rect class="frame" x="0.5" y="0.5" width=${a-1} height="120" rx="6"></rect>
    ${o}
    <text class="title" x=${a/2} y="137" text-anchor="middle">${e}</text>
    <text class="caption" x=${a/2} y="152" text-anchor="middle">${t}</text>
  </g>`,"panel"),T=p((r,e,t,o)=>c`
  <rect class="line" x=${r} y=${e} width=${t} height=${o} rx="2"></rect>
  ${[0,1,2].map(a=>c`<rect class="dash-panel" x=${r+4+a*((t-8)/3)} y=${e+5} width=${(t-8)/3-3} height=${o*.35} rx="1.5"></rect>`)}`,"screen"),S=p((r,e,t)=>{const o=t*.73;return c`
    <path class="alert" d="M${r-t/2} ${e-o*.12} L${r-t*.3} ${e-o/2} H${r+t*.3} L${r+t/2} ${e-o*.12} Z"></path>
    <rect class="alert" x=${r-t/2} y=${e-o*.08} width=${t} height=${o*.16}></rect>
    <path class="alert" d="M${r-t/2} ${e+o*.12} L${r-t*.3} ${e+o/2} H${r+t*.3} L${r+t/2} ${e+o*.12} Z"></path>`},"symbol"),B=p((r,e,t,o,a,i,s=5)=>{const n=[];for(let h=r;h<=e;h+=s)Math.abs(h-a)<i/2||n.push(c`<rect class="alert" x=${h} y=${t-o/2} width="2" height=${o} rx="0.6"></rect>`);return n},"dashes"),ce={overlay:{label:"An overlay stacks the backdrop, colour and canvas layers over the dashboard, with the alert symbol on top; the symbol sits at one of nine anchors, sized by width and height as a share of the screen",body:p(()=>c`
      ${_(0,"LAYERS","back to front",c`
        ${[["dashboard",0],["backdrop (blur)",1],["colour (tint)",2],["canvas (effect)",3],["symbol or card",4]].map(([r,e])=>c`
          <rect class=${e===4?"fill-soft":"layer"} x=${14+Number(e)*6} y=${92-Number(e)*17} width="72" height="20" rx="2"></rect>
          <text class="small" x=${18+Number(e)*6} y=${105-Number(e)*17}>${r}</text>`)}`)}
      ${_(140,"POSITION","one of nine anchors",c`
        ${T(10,22,100,76)}
        <rect class="fill-soft" x="66" y="30" width="36" height="22" rx="2"></rect>
        ${[0,1,2].flatMap(r=>[0,1,2].map(e=>c`<circle class=${r===0&&e===2?"anchor-on":"anchor"} cx=${18+e*42} cy=${30+r*30} r=${r===0&&e===2?3.2:2.4}></circle>`))}
        <text class="label" x="60" y="112" text-anchor="middle">position: top-right</text>`)}
      ${_(280,"SIZE","% of the screen, or px",c`
        <rect class="line" x="10" y="22" width="100" height="76" rx="2"></rect>
        <rect class="fill-soft" x="26" y="46" width="46" height="34" rx="2"></rect>
        ${S(49,63,32)}
        <path class="arrow" d="M26 39 H72 M29 36 L26 39 L29 42 M69 36 L72 39 L69 42"></path>
        <text class="label" x="49" y="34" text-anchor="middle">width</text>
        <path class="arrow" d="M78 46 V80 M75 49 L78 46 L81 49 M75 77 L78 80 L81 77"></path>
        <text class="label" x="82" y="66">height</text>
        <text class="small" x="60" y="112" text-anchor="middle">no height: from the width</text>`)}`,"body")},band:{label:"A band is a row of dashes across the screen with the alert symbol in the middle, at the top, centre, bottom or a percentage of the height; dash width, gap, band height and grow shape the dashes; the sweep runs outward or inward",body:p(()=>c`
      ${_(0,"BAND","position: top, center, bottom, %",c`
        ${T(18,22,94,76)}
        ${B(21,109,74,6,65,26,4)}
        ${S(65,74,20)}
        <path class="arrow" d="M10 22 V74 M7 25 L10 22 L13 25 M7 71 L10 74 L13 71"></path>
        <text class="small" x="60" y="112" text-anchor="middle">70%: lower down</text>`)}
      ${_(140,"DASHES","width, gap, height, grow",c`
        <rect class="alert" x="22" y="48" width="12" height="28" rx="1"></rect>
        <rect class="alert" x="52" y="48" width="12" height="28" rx="1"></rect>
        <rect class="grow" x="82" y="36" width="12" height="52" rx="1"></rect>
        <rect class="alert" x="82" y="48" width="12" height="28" rx="1"></rect>
        <path class="arrow" d="M22 42 H34 M24 40 L22 42 L24 44 M32 40 L34 42 L32 44"></path>
        <text class="small" x="28" y="36" text-anchor="middle">width</text>
        <path class="arrow" d="M34 84 H52 M36 82 L34 84 L36 86 M50 82 L52 84 L50 86"></path>
        <text class="small" x="43" y="96" text-anchor="middle">gap</text>
        <path class="arrow" d="M12 48 V76 M10 50 L12 48 L14 50 M10 74 L12 76 L14 74"></path>
        <text class="small" x="12" y="88" text-anchor="middle">height</text>
        <text class="small" x="88" y="30" text-anchor="middle">grow</text>
        <text class="small" x="60" y="112" text-anchor="middle">symbol size: × band height</text>`)}
      ${_(280,"SWEEP","outward or inward; speed, phase",c`
        ${B(8,112,50,8,60,28,5)}
        ${S(60,50,22)}
        <path class="arrow" d="M76 70 H106 M102 66 L106 70 L102 74 M44 70 H14 M18 66 L14 70 L18 74"></path>
        <text class="small" x="60" y="84" text-anchor="middle">outward</text>
        <path class="arrow" d="M14 96 H44 M40 92 L44 96 L40 100 M106 96 H76 M80 92 L76 96 L80 100"></path>
        <text class="small" x="60" y="110" text-anchor="middle">inward</text>`)}`,"body")},conditions:{label:"A condition shows your own card, else the built-in alert symbol with the changes over it (the card level, then the condition); every value falls back from the condition to the card to the default; each condition can be an overlay or a band",body:p(()=>c`
      ${_(0,"WHAT SHOWS","your card, else the symbol",c`
        ${[["your own card","fill-soft","else"],["condition changes","layer","over"],["card changes","layer","over"],["built-in symbol","layer",""]].map(([r,e,t],o)=>c`
          <rect class=${e} x="14" y=${6+o*28} width="92" height="17" rx="2"></rect>
          <text class="small" x="60" y=${17.5+o*28} text-anchor="middle">${r}</text>
          ${t?c`<text class="small" x="60" y=${31+o*28} text-anchor="middle">${t}</text>`:F}`)}`)}
      ${_(140,"EACH VALUE","condition, then card, then default",c`
        ${[["red alert: width 30%","fill-soft"],["card: width 60%","layer"],["default: 60%","layer"]].map(([r,e],t)=>c`
          <rect class=${e} x="10" y=${20+t*30} width="100" height="22" rx="2"></rect>
          <text class="small" x="60" y=${34+t*30} text-anchor="middle">${r}</text>
          ${t<2?c`<path class="arrow" d="M60 ${43+t*30} V${49+t*30} M57 ${46+t*30} L60 ${49+t*30} L63 ${46+t*30}"></path>`:F}`)}`)}
      ${_(280,"DISPLAY","per condition",c`
        ${T(8,18,50,38)}
        <rect class="fill-soft" x="22" y="28" width="22" height="16" rx="1.5"></rect>
        ${S(33,36,14)}
        <text class="small" x="33" y="66" text-anchor="middle">red: overlay</text>
        ${T(62,18,50,38)}
        ${B(64,110,37,4,87,12,3)}
        ${S(87,37,9)}
        <text class="small" x="87" y="66" text-anchor="middle">yellow: band</text>
        <text class="small" x="60" y="92" text-anchor="middle">the band settings</text>
        <text class="small" x="60" y="103" text-anchor="middle">and the overlay size</text>
        <text class="small" x="60" y="114" text-anchor="middle">apply to their own</text>`)}`,"body")}},O=class O2 extends U{constructor(){super(),this.kind="overlay"}render(){const e=ce[this.kind];return e?l`<svg viewBox="0 -4 400 162" role="img" aria-label=${e.label}>${e.body()}</svg>`:F}};p(O,"LCARdSAlertOverlayDiagram"),M(O,"properties",{kind:{type:String}}),M(O,"styles",q`
    :host { display: block; padding: var(--ha-space-2) 0; }
    svg { display: block; width: 100%; height: auto; max-width: 520px; margin: 0 auto; overflow: visible; }
    .frame { fill: none; stroke: var(--divider-color, #888); stroke-width: 1; }
    .title { fill: var(--primary-text-color, #ddd); font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
    .caption { fill: var(--secondary-text-color, #aaa); font-size: 10px; }
    .label { fill: var(--primary-text-color, #ddd); font-size: 9px; }
    .small { fill: var(--secondary-text-color, #aaa); font-size: 8.5px; }
    .line { fill: none; stroke: var(--secondary-text-color, #aaa); stroke-width: 0.8; }
    .dash-panel { fill: color-mix(in srgb, var(--secondary-text-color, #aaa) 25%, transparent); }
    .layer { fill: color-mix(in srgb, var(--secondary-text-color, #aaa) 12%, var(--card-background-color, #111)); stroke: var(--secondary-text-color, #aaa); stroke-width: 0.8; }
    .fill-soft { fill: color-mix(in srgb, var(--primary-color, #ff9900) 18%, var(--card-background-color, #111)); stroke: var(--primary-color, #ff9900); stroke-width: 1; }
    .alert { fill: var(--lcars-alert-red, var(--error-color, #cc3333)); }
    .grow { fill: none; stroke: var(--lcars-alert-red, var(--error-color, #cc3333)); stroke-width: 0.8; stroke-dasharray: 2 1.5; }
    .anchor { fill: var(--secondary-text-color, #aaa); }
    .anchor-on { fill: var(--primary-color, #ff9900); }
    .arrow { fill: none; stroke: var(--primary-text-color, #ddd); stroke-width: 0.9; }
  `);let N=O;customElements.get("lcards-alert-overlay-diagram")||customElements.define("lcards-alert-overlay-diagram",N);const L=[{key:"red_alert",label:"Red Alert",short:"Red",icon:"mdi:alert-circle"},{key:"yellow_alert",label:"Yellow Alert",short:"Yellow",icon:"mdi:alert"},{key:"blue_alert",label:"Blue Alert",short:"Blue",icon:"mdi:information"},{key:"black_alert",label:"Black Alert",short:"Black",icon:"mdi:ghost"},{key:"gray_alert",label:"Gray Alert",short:"Gray",icon:"mdi:circle-off-outline"}],he=[{value:"top-left",label:"Top Left"},{value:"top",label:"Top Center"},{value:"top-right",label:"Top Right"},{value:"left",label:"Left"},{value:"center-left",label:"Left Center"},{value:"center",label:"Center"},{value:"right",label:"Right"},{value:"center-right",label:"Right Center"},{value:"bottom-left",label:"Bottom Left"},{value:"bottom",label:"Bottom Center"},{value:"bottom-right",label:"Bottom Right"}],E=p(r=>r&&typeof r=="object"?Object.values(r).some(E):r!==void 0&&r!==""&&r!==null,"_hasLeaf"),ue=p(r=>class extends r{_displayFor(e){return X(this.config,e)}_anyDisplay(e){return L.some(t=>this._displayFor(t.key)===e)}_renderConfigTab(){var o,a;const e=((o=this.config)==null?void 0:o.dismiss_mode)??"dismiss",t=e==="auto-dismiss"||e==="auto-reset";return l`
            <div class="tab-content-container">


                <lcards-message type="info">
                    Shows an overlay or a band while <code>input_select.lcards_alert_mode</code> is an alert
                    (red, yellow, blue, black or gray). Add one per dashboard view.
                </lcards-message>

                ${this._renderDisplaySection()}

                <!-- The alert symbol, for every condition (alert_button) -->
                <lcards-form-section
                    header="Alert symbol"
                    description="Change the alert symbol for every condition: text, colours, animations and more. A condition can change it again, or show your own card (Conditions tab)."
                    icon="mdi:alert-rhombus-outline"
                    ?expanded=${E(((a=this.config)==null?void 0:a.alert_button)??{})}
                    ?outlined=${true}>
                    ${this._renderSymbolEditor(null,"alert_button")}
                </lcards-form-section>

                <!-- Dismiss Behaviour -->
                <lcards-form-section
                    header="Dismiss Behaviour"
                    description="What a click does: on the backdrop (overlay) or on the alert symbol (band)"
                    icon="mdi:close-circle-outline"
                    ?expanded=${true}
                    ?outlined=${true}>

                    ${u.renderField(this,"dismiss_mode",{label:"Dismiss Mode",helper:{dismiss:"Dismiss: hides the overlay only; the input_select is not changed",reset:"Reset: hides the overlay AND sets input_select back to green_alert","auto-dismiss":"Auto-Dismiss: overlay hides automatically after the configured timeout","auto-reset":"Auto-Reset: overlay hides automatically AND resets alert_mode after the configured timeout"}[e]??"",selectorOverride:{select:{mode:"dropdown",options:[{value:"dismiss",label:"Dismiss (hide overlay only)"},{value:"reset",label:"Reset (hide + set alert_mode to green_alert)"},{value:"auto-dismiss",label:"Auto-Dismiss (hide after timeout)"},{value:"auto-reset",label:"Auto-Reset (hide + reset alert_mode after timeout)"}]}}})}

                    ${t?u.renderField(this,"auto_dismiss_seconds",{label:"Auto-Dismiss After (seconds)",helper:"Overlay will dismiss automatically after this many seconds. Individual conditions can override this value in the Conditions tab.",selectorOverride:{number:{min:1,step:1,mode:"box"}}}):""}
                </lcards-form-section>


            </div>
        `}_renderDisplaySection(){var a,i;const e=((a=this.config)==null?void 0:a.display)??"overlay",t=((i=this.config)==null?void 0:i.band)??{},o=p((s,n)=>this._setConfigValue(`band.${s}`,n===""||n===null?void 0:n),"set");return l`
            <lcards-form-section
                header="Display"
                description="A modal overlay, or a band of dashes across the screen that leaves the dashboard usable"
                icon="mdi:alert-rhombus-outline"
                ?expanded=${true}
                ?outlined=${true}>

                ${u.renderField(this,"display",{label:"Display",helper:e==="band"?"Band: dashes in the alert colour across the screen with the alert symbol in the middle. Clicks reach the dashboard; click the symbol to dismiss.":"Overlay: a backdrop over the dashboard with the alert symbol (or your content card) in the middle.",selectorOverride:{select:{mode:"dropdown",options:[{value:"overlay",label:"Overlay (backdrop and symbol)"},{value:"band",label:"Band (dashes across the screen)"}]}}})}

                ${this._anyDisplay("overlay")?l`
                    ${e==="band"?l`
                        <lcards-message type="info"
                            message="Some conditions show as an overlay (their Display override): this position and size apply to them.">
                        </lcards-message>`:""}
                    ${D({header:"How the overlay works",id:"guide-overlay",body:l`
                            <lcards-alert-overlay-diagram kind="overlay"></lcards-alert-overlay-diagram>
                            <p>The screen effect layers (Backdrop tab) cover the dashboard, and the alert symbol (or your content card) sits on top.</p>
                            <ul>
                                <li><strong>Position</strong> picks one of nine anchors on the screen.</li>
                                <li><strong>Width</strong> and <strong>Height</strong> are CSS sizes: a percentage is of the screen. With a width and no height, the alert symbol keeps its shape.</li>
                                <li>A click on the backdrop dismisses (see Dismiss Behaviour).</li>
                                <li>Conditions can override the position and size (Conditions tab).</li>
                            </ul>
                        `})}
                    ${u.renderField(this,"position",{label:"Overlay position",helper:"Where the alert symbol (or content card) sits on the screen"})}
                    <lcards-grid-layout>
                        ${u.renderField(this,"width",{label:"Width",helper:"CSS width, e.g. 400px or 50% (of the screen)",selectorOverride:{text:{}}})}
                        ${u.renderField(this,"height",{label:"Height",helper:"CSS height, e.g. 300px or 40%. Blank = 50% for the alert symbol (from the width when one is set)",selectorOverride:{text:{}}})}
                    </lcards-grid-layout>
                `:""}

                ${this._anyDisplay("band")?l`
                    ${e!=="band"?l`
                        <lcards-message type="info"
                            message="Some conditions show as a band (their Display override): these band settings apply to them.">
                        </lcards-message>`:""}
                    ${D({header:"How the band works",id:"guide-band",body:l`
                            <lcards-alert-overlay-diagram kind="band"></lcards-alert-overlay-diagram>
                            <p>A row of dashes in the alert colour runs across the screen with the alert symbol in the middle. The dashboard stays usable: only the symbol takes clicks, and a click on it dismisses.</p>
                            <ul>
                                <li><strong>Band position</strong>: top, center, bottom, or a percentage of the screen height.</li>
                                <li><strong>Dash width</strong>, <strong>gap</strong> and <strong>band height</strong> shape the dashes; <strong>grow</strong> makes them swell as the sweep passes.</li>
                                <li><strong>Symbol size</strong> is a multiple of the band height.</li>
                                <li><strong>Sweep direction</strong>, <strong>speed</strong> and <strong>phase</strong> time the animation against the symbol's bars.</li>
                            </ul>
                        `})}
                    <lcards-grid-layout>
                        ${u.renderField(this,"band.position",{label:"Band position",helper:"top, center, bottom, or a percentage of the screen height (e.g. 75%)",selectorOverride:{select:{mode:"dropdown",custom_value:true,options:[{value:"top",label:"Top"},{value:"center",label:"Center"},{value:"bottom",label:"Bottom"}]}}})}
                        ${u.renderField(this,"band.animation",{label:"Animation",selectorOverride:{select:{mode:"dropdown",options:[{value:"sweep",label:"Sweep (outward from the symbol)"},{value:"flash",label:"Flash (all together)"},{value:"none",label:"None"}]}}})}
                        ${u.renderField(this,"band.direction",{label:"Sweep direction",selectorOverride:{select:{mode:"dropdown",options:[{value:"outward",label:"Outward (from the symbol)"},{value:"inward",label:"Inward (from the edges)"}]}}})}
                        ${u.renderField(this,"band.speed",{label:"Speed",helper:"Multiplier: 2 = twice as fast. The symbol bars follow it",selectorOverride:{number:{min:.25,max:4,step:.25,mode:"box"}}})}
                        ${u.renderField(this,"band.phase",{label:"Phase (degrees)",helper:"Lock the band to the symbol bar sweep, this many degrees later. 180 with an outward sweep: one sweep from the symbol out to the edges. Blank = not locked",selectorOverride:{number:{min:0,max:360,step:15,mode:"box"}}})}
                        ${u.renderField(this,"band.height",{label:"Band height",helper:"CSS length, e.g. 48px or 5vh",selectorOverride:{text:{}}})}
                        ${u.renderField(this,"band.emblem_scale",{label:"Symbol size",helper:"Symbol height as a multiple of the band height",selectorOverride:{number:{min:1,max:10,step:.5,mode:"box"}}})}
                        ${u.renderField(this,"band.dash_width",{label:"Dash width (px)",selectorOverride:{number:{min:1,max:100,step:1,mode:"box"}}})}
                        ${u.renderField(this,"band.dash_gap",{label:"Dash gap (px)",selectorOverride:{number:{min:0,max:100,step:1,mode:"box"}}})}
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Dash corner radius (px)"}
                            .helper=${"Capped at half the dash width"}
                            .selector=${{number:{min:0,max:100,step:.5,mode:"box"}}}
                            .value=${typeof t.dash_radius=="number"?t.dash_radius:0}
                            .disabled=${t.dash_radius==="pill"}
                            @value-changed=${s=>o("dash_radius",Number(s.detail.value)>0?Number(s.detail.value):void 0)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Pill ends"}
                            .helper=${"Fully rounded dash ends (overrides the radius)"}
                            .selector=${{boolean:{}}}
                            .value=${t.dash_radius==="pill"}
                            @value-changed=${s=>o("dash_radius",s.detail.value?"pill":void 0)}>
                        </ha-selector>
                        ${u.renderField(this,"band.grow",{label:"Grow",helper:"Peak dash height as a multiple of the band height, with the animation. 1 = no growth",selectorOverride:{number:{min:1,max:4,step:.1,mode:"box"}}})}
                    </lcards-grid-layout>
                    ${u.renderField(this,"band.emblem",{label:"Show the alert symbol",helper:"Without it, only auto-dismiss or the alert mode changing hides the band",selectorOverride:{boolean:{}}})}
                    <div class="field-caption">Dash colour (blank = the condition colour)</div>
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${t.color??""}
                        .showPreview=${true}
                        @value-changed=${s=>o("color",s.detail.value||void 0)}>
                    </lcards-color-picker>
                `:""}
            </lcards-form-section>
        `}_renderBackdropTab(){var o,a,i;const e=((o=this.config)==null?void 0:o.layers)??{},t=!!((a=this.config)!=null&&a.backdrop&&((i=this.config)==null?void 0:i.layers)===void 0);return l`
            <div class="tab-content-container">

                <lcards-message type="info">
                    <strong>Global Screen Effect Layers</strong>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                        Configure each effect layer independently. Applied to all alert
                        conditions unless overridden per-condition.
                    </p>
                </lcards-message>

                ${this._anyDisplay("band")?l`
                <lcards-message type="info"
                    message=${this._anyDisplay("overlay")?"A band has no backdrop unless you set one here: the default blur is for overlays only.":"A band has no backdrop unless you set one here (the dashboard stays visible and usable)."}>
                </lcards-message>
                `:""}

                ${t?l`
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

                ${D({header:"How condition overrides work",body:l`
                        <lcards-alert-overlay-diagram kind="conditions"></lcards-alert-overlay-diagram>
                        <p>Each condition sets what shows while that alert mode is active.</p>
                        <ul>
                            <li><strong>Alert symbol</strong> shows the built-in symbol, with the changes for every condition (Config tab, Alert symbol).</li>
                            <li><strong>Customise the symbol</strong> changes it for this condition only, in the symbol's own button editor; only what you change is saved.</li>
                            <li><strong>Your own card</strong> replaces the symbol with any card.</li>
                            <li>Everything else overrides the defaults on the <strong>Config</strong> and <strong>Backdrop</strong> tabs.</li>
                        </ul>
                    `})}

                ${L.map(e=>this._renderConditionSection(e))}

            </div>
        `}_renderConditionSection(e){var x,b,m,w,z,R;const t=((b=(x=this.config)==null?void 0:x.conditions)==null?void 0:b[e.key])??{},o=!!((m=t.content)!=null&&m.type),a=e.key,i=t.backdrop?J(t.backdrop):null,s=i?{backdrop:i.backdrop,color:i.color,...t.layers??{}}:t.layers,n=t.position??"",h=t.width??"",g=t.height??"",d=((w=this.config)==null?void 0:w.dismiss_mode)??"dismiss",f=d==="auto-dismiss"||d==="auto-reset",C=t.auto_dismiss_seconds??"",y=this._displayFor(a)==="band",v=this._symbolMode(a);return l`
            <lcards-form-section
                header="${e.label}"
                description=${{symbol:"The alert symbol",custom:"The alert symbol, customised",card:`Your own card: ${((z=t.content)==null?void 0:z.type)??"pick one"}`}[v]}
                icon="${e.icon}"
                data-condition=${a}
                ?outlined=${true}
                @expanded-changed=${$=>{var A;$.target===$.currentTarget&&((A=$.detail)!=null&&A.expanded)&&(this._condition=a)}}>

                <!-- ── What shows: the symbol, the symbol customised, or your own card ── -->
                <div class="mode-pills">
                    <wa-button-group childSelector="ha-button">
                        ${[["symbol","Alert symbol"],["custom","Customise the symbol"],["card","Your own card"]].map(([$,A])=>l`
                            <ha-button iconTag="ha-svg-icon" variant="brand" size="s" data-mode=${$}
                                .appearance=${v===$?"accent":"filled"}
                                @click=${()=>this._setSymbolMode(a,$)}>
                                ${A}
                            </ha-button>`)}
                    </wa-button-group>
                </div>

                ${v==="symbol"?l`
                    <lcards-message type="info"
                        message=${E(((R=this.config)==null?void 0:R.alert_button)??{})?"The built-in alert symbol, with the changes for every condition (Config tab, Alert symbol).":"The built-in alert symbol. Change it for every condition on the Config tab (Alert symbol), or for this one with Customise the symbol."}>
                    </lcards-message>`:v==="custom"?this._renderSymbolEditor(a,`conditions.${a}.alert_button`):this._renderContentCardSection(a,t,o)}

                <!-- ── Screen Effect Overrides ── -->
                <lcards-form-section
                    header="Screen Effect Overrides"
                    description="Override individual effect layers for this condition. Unset slots inherit the global default."
                    icon="mdi:blur"
                    ?expanded=${!!s}
                    ?outlined=${true}>

                    ${this._renderSlotSection({slot:"backdrop",slotLabel:"Backdrop Filter",slotIcon:"mdi:blur",condKey:a,condLayersObj:s??null})}
                    ${this._renderSlotSection({slot:"color",slotLabel:"Color Overlay",slotIcon:"mdi:palette",condKey:a,condLayersObj:s??null})}
                    ${this._renderSlotSection({slot:"canvas",slotLabel:"Canvas Effect",slotIcon:"mdi:image-multiple",condKey:a,condLayersObj:s??null})}

                </lcards-form-section>

                <!-- ── Layout Overrides ── -->
                <lcards-form-section
                    header="Layout Overrides"
                    description=${y?"Display and timeout for this condition. Shown as a band: it spans the screen, so there is no position or size to set.":"Display, overlay position and size, and timeout for this condition only. Leave blank to use the card defaults."}
                    icon="mdi:move-resize"
                    ?expanded=${!!(n||h||g||C||t.display)}
                    ?outlined=${true}>

                    ${u.renderField(this,`conditions.${a}.display`,{label:"Display (override)",helper:"Overlay or band for this condition only",value:t.display??"",selectorOverride:{select:{mode:"dropdown",options:[{value:"",label:"(Use global default)"},{value:"overlay",label:"Overlay (backdrop and symbol)"},{value:"band",label:"Band (dashes across the screen)"}]}}})}

                    ${y?"":l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Position (override)"}
                        .helper=${"Content anchor point override for this condition. Leave unset to use global default"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(Use global default)"},...he]}}}
                        .value=${n}
                        @value-changed=${$=>this._setConditionProp(a,"position",$.detail.value||void 0)}>
                    </ha-selector>

                    <lcards-grid-layout>
                        ${u.renderField(this,`conditions.${a}.width`,{label:"Width (override)",helper:"CSS width override, e.g. 400px; blank = global default",selectorOverride:{text:{}}})}
                        ${u.renderField(this,`conditions.${a}.height`,{label:"Height (override)",helper:"CSS height override, e.g. 300px; blank = global default",selectorOverride:{text:{}}})}
                    </lcards-grid-layout>
                    `}

                    ${f?u.renderField(this,`conditions.${a}.auto_dismiss_seconds`,{label:"Auto-Dismiss Override (seconds)",helper:"Override the global auto-dismiss timeout for this condition only. Leave blank to use the global value.",selectorOverride:{number:{min:1,step:1,mode:"box"}}}):""}
                </lcards-form-section>

            </lcards-form-section>
        `}_renderSymbolEditor(e,t){var C,y,v,x,b;const o=this._getConfigValue(t)??{},a=((y=(C=o.text)==null?void 0:C.sub_text)==null?void 0:y.content)??"",i=/^\{\{states\('([^']+)'\)\}\}$/.exec(a),s=i?i[1]:"",n=i?"entity":"static",h="input_text.lcards_alert_message",g=p((m,w)=>this._setConfigValue(`${t}.${m}`,w),"set"),d=e??this._condition??"red_alert",f=((v=L.find(m=>m.key===d))==null?void 0:v.label)??d;return l`
            <lcards-message type="info"
                message=${e?"Set only what you want to change for this condition; the rest comes from the alert symbol (and the changes for every condition).":`Changes here apply to every condition; each keeps its own colours. Shown with the ${f} colours (pick the condition in the toolbar).`}>
            </lcards-message>

            ${u.renderField(this,`${t}.speed`,{label:"Symbol animation speed",helper:"Multiplier for the symbol bar sweep: 2 = twice as fast. Blank = normal (in band mode: the band speed)",selectorOverride:{number:{min:.25,max:4,step:.25,mode:"box"}}})}

            <ha-selector
                .hass=${this.hass}
                .label=${"Alert label"}
                .required=${false}
                .helper=${"The top label. Blank = the default (ALERT)"}
                .selector=${{text:{}}}
                .value=${((b=(x=o.text)==null?void 0:x.alert_text)==null?void 0:b.content)??""}
                @value-changed=${m=>g("text.alert_text.content",m.detail.value)}>
            </ha-selector>

            <ha-selector
                .hass=${this.hass}
                .label=${"Sub-text source"}
                .helper=${"A fixed message, or an entity state (an automation can set the message)"}
                .selector=${{select:{mode:"list",options:[{value:"static",label:"Static text"},{value:"entity",label:"Entity state"}]}}}
                .value=${n}
                @value-changed=${m=>g("text.sub_text.content",m.detail.value==="entity"?`{{states('${s||h}')}}`:"")}>
            </ha-selector>

            ${n==="entity"?l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Sub-text entity"}
                    .helper=${"Entity whose state is the sub-text (e.g. input_text.lcards_alert_message)"}
                    .selector=${{entity:{}}}
                    .value=${s||h}
                    @value-changed=${m=>{m.detail.value&&g("text.sub_text.content",`{{states('${m.detail.value}')}}`)}}>
                </ha-selector>
            `:l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Sub-text"}
                    .required=${false}
                    .helper=${"The message under the label. Blank = the default (e.g. CONDITION: RED)"}
                    .selector=${{text:{}}}
                    .value=${a}
                    @value-changed=${m=>g("text.sub_text.content",m.detail.value)}>
                </ha-selector>
            `}

            <lcards-form-section
                header="Every button setting"
                description="The symbol's own lcards-button editor: colours, text fields, segments, animations and more"
                icon="mdi:gesture-tap-button"
                outlined>
                ${customElements.get("hui-card-element-editor")?l`
                    <div class="card-editor-host">
                        ${P(`symbol:${t}:${d}`,l`
                            <hui-card-element-editor
                                .hass=${this.hass}
                                .lovelace=${this._contentLovelace()}
                                .value=${this._symbolEditorValue(e,d)}
                                @config-changed=${m=>this._onSymbolEdited(e,d,t,m)}>
                            </hui-card-element-editor>`)}
                    </div>`:l`
                    <lcards-message type="info"
                        message="Home Assistant's card editor is not loaded here: set other button keys on the YAML tab, under alert_button.">
                    </lcards-message>`}
            </lcards-form-section>
        `}_symbolBelow(e,t){var s;const o=Q(t);if(!e)return o;const{speed:a,...i}=K({alert_button:(s=this.config)==null?void 0:s.alert_button},t);return Y(o,i)}_symbolEditorValue(e,t){const o={...this._getConfigValue(e?`conditions.${e}.alert_button`:"alert_button")??{}};delete o.speed;for(const a of W)delete o[a];return Y(this._symbolBelow(e,t),o)}_onSymbolEdited(e,t,o,a){var g,d;a.stopPropagation();const i=((g=a.detail)==null?void 0:g.config)??((d=a.detail)==null?void 0:d.value);if(!(i!=null&&i.type))return;const s=ee(JSON.parse(JSON.stringify(i)),this._symbolBelow(e,t))??{};for(const f of W)delete s[f];const n=this._getConfigValue(`${o}.speed`),h=n!==void 0?{...s,speed:n}:s;e?this._setConditionProp(e,"alert_button",Object.keys(h).length?h:void 0):this._updateConfig({alert_button:Object.keys(h).length?h:void 0})}_symbolMode(e){var a,i,s,n;const t=((i=(a=this.config)==null?void 0:a.conditions)==null?void 0:i[e])??{};if((s=t.content)!=null&&s.type)return"card";const o=(n=this._pickedModes)==null?void 0:n[e];return o||(E(t.alert_button??{})?"custom":"symbol")}async _setSymbolMode(e,t){var s,n,h,g;const o=this._symbolMode(e);if(t===o)return;const a=((n=(s=this.config)==null?void 0:s.conditions)==null?void 0:n[e])??{},i=((h=L.find(d=>d.key===e))==null?void 0:h.label)??e;if(o==="card"&&t!=="card"){if(!await j({title:"Remove your card?",message:`${i} shows your ${((g=a.content)==null?void 0:g.type)??""} card. Switching removes it from this condition (Cancel the studio to get it back).`,confirmText:"Remove"}))return;this._setConditionProp(e,"content",void 0)}else if(o==="custom"&&t==="symbol"&&E(a.alert_button??{})){if(!await j({title:"Remove the changes?",message:`${i} has its own changes to the alert symbol. Switching removes them (Cancel the studio to get them back).`,confirmText:"Remove"}))return;this._setConditionProp(e,"alert_button",void 0)}this._pickedModes={...this._pickedModes,[e]:t==="symbol"?void 0:t},this.requestUpdate()}_setConditionProp(e,t,o){var i;const a=JSON.parse(JSON.stringify(((i=this.config)==null?void 0:i.conditions)??{}));a[e]=a[e]??{},o==null?delete a[e][t]:a[e][t]=o,Object.keys(a[e]).length===0&&delete a[e],Object.keys(a).length===0?this._updateConfig({conditions:void 0}):this._updateConfig({conditions:a})}_getSlotPresets(e){var t,o;return(((o=(t=window.lcards)==null?void 0:t.screenEffect)==null?void 0:o.catalog())??[]).filter(a=>a.slot===e)}_renderSlotSection({slot:e,slotLabel:t,slotIcon:o,layerCfg:a=void 0,condKey:i=null,condLayersObj:s=null}){var v,x;const n=!!i,h=n&&s!=null&&e in s,g=this._getSlotPresets(e);let d,f;n?h?(v=s[e])!=null&&v.preset?(d=s[e].preset,f=s[e]):(d="__none__",f=null):(d="__inherit__",f=null):(d=(a==null?void 0:a.preset)??"__none__",f=a??null);const C=[...n?[{value:"__inherit__",label:"(Inherit global)"}]:[],{value:"__none__",label:"None (disabled)"},...g.map(b=>({value:b.name,label:b.label??b.name}))],y=g.find(b=>b.name===d);return l`
            <lcards-form-section
                header="${t}"
                icon="${o}"
                ?expanded=${!!y}
                ?outlined=${true}>

                ${P(d,l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Effect Preset"}
                    .selector=${{select:{mode:"dropdown",options:C}}}
                    .value=${d}
                    @value-changed=${b=>{n?this._setConditionLayerPreset(i,e,b.detail.value):this._setGlobalLayerPreset(e,b.detail.value)}}>
                </ha-selector>
                `)}

                ${(x=y==null?void 0:y.params_schema)!=null&&x.length?l`
                    ${y.params_schema.map(b=>{var m;return this._renderParamField({spec:b,value:f==null?void 0:f[b.key],fallback:((m=y.defaults)==null?void 0:m[b.key])??b.placeholder,onChange:p(w=>n?this._setConditionLayerParam(i,e,b.key,w):this._setGlobalLayerParam(e,b.key,w),"onChange")})})}
                `:""}
            </lcards-form-section>
        `}_renderParamField({spec:e,value:t,fallback:o,onChange:a}){if(e.type==="number"){const s=typeof t=="number"?t:typeof o=="number"?o:e.min??0;return l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${e.label}
                    .helper=${e.helper??""}
                    .selector=${{number:{min:e.min??0,max:e.max??1,step:e.step??.1,mode:"slider"}}}
                    .value=${s}
                    @value-changed=${n=>a(n.detail.value)}>
                </ha-selector>
            `}if(e.type==="boolean")return l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${e.label}
                    .helper=${e.helper??""}
                    .selector=${{boolean:{}}}
                    .value=${typeof t=="boolean"?t:o!==false}
                    @value-changed=${s=>a(s.detail.value)}>
                </ha-selector>
            `;if(e.type==="select")return l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${e.label}
                    .helper=${e.helper??""}
                    .selector=${{select:{mode:"dropdown",options:e.options??[]}}}
                    .value=${t??o??""}
                    @value-changed=${s=>a(s.detail.value||void 0)}>
                </ha-selector>
            `;const i=t!==void 0?String(t):o!==void 0?String(o):"";return e.type==="color-text"?l`
                <div style="margin-bottom:4px;">
                    <div style="font-size:12px;font-weight:500;color:var(--secondary-text-color);margin-bottom:4px;padding:0 2px;">
                        ${e.label}
                    </div>
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${i}
                        .showPreview=${true}
                        @value-changed=${s=>a(s.detail.value||void 0)}>
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
                .value=${i}
                @value-changed=${s=>a(s.detail.value||void 0)}>
            </ha-selector>
        `}_setGlobalLayerPreset(e,t){const o={...this._getMigratedLayers()};if(t==="__none__")o[e]=null;else{const a=o[e];o[e]=(a==null?void 0:a.preset)===t?a:{preset:t}}this._updateConfig({layers:o,backdrop_effect:void 0,backdrop_params:void 0,backdrop:void 0})}_setGlobalLayerParam(e,t,o){const a={...this._getMigratedLayers()};if(a[e]||(a[e]={}),o!==void 0&&o!=="")a[e]={...a[e],[t]:o};else{const{[t]:i,...s}=a[e];a[e]=s}this._updateConfig({layers:a})}_getMigratedLayers(){var t,o;if((t=this.config)!=null&&t.layers)return JSON.parse(JSON.stringify(this.config.layers));if(((o=this.config)==null?void 0:o.layers)===null)return{};const e=this.config??{};if(e.backdrop){const a=e.backdrop,i={};if(a.blur&&(i.backdrop={preset:"blur",amount:a.blur}),a.color||a.opacity!==void 0){const s=typeof a.opacity=="number"?a.opacity:.6;i.color={preset:"color-tint",color:this._promotedColor(a.color??"rgba(0,0,0,0.5)",s)}}return i}return{backdrop:{preset:"blur",amount:"8px"}}}_setConditionLayerPreset(e,t,o){var i;const a=JSON.parse(JSON.stringify(((i=this.config)==null?void 0:i.conditions)??{}));if(a[e]=a[e]??{},this._migrateConditionBackdrop(a[e]),delete a[e].backdrop_effect,delete a[e].backdrop_params,o==="__inherit__")a[e].layers&&(delete a[e].layers[t],Object.keys(a[e].layers).length===0&&delete a[e].layers);else if(o==="__none__")a[e].layers=a[e].layers??{},a[e].layers[t]=null;else{a[e].layers=a[e].layers??{};const s=a[e].layers[t];a[e].layers[t]=(s==null?void 0:s.preset)===o?s:{preset:o}}Object.keys(a[e]).length===0&&delete a[e],this._updateConfig({conditions:Object.keys(a).length?a:void 0})}_migrateConditionBackdrop(e){if(e.backdrop){const t=J(e.backdrop);e.layers={backdrop:t.backdrop,color:t.color,...e.layers??{}}}delete e.backdrop}_setConditionLayerParam(e,t,o,a){var s;const i=JSON.parse(JSON.stringify(((s=this.config)==null?void 0:s.conditions)??{}));i[e]=i[e]??{},this._migrateConditionBackdrop(i[e]),i[e].layers=i[e].layers??{},i[e].layers[t]=i[e].layers[t]??{},a!==void 0&&a!==""?i[e].layers[t][o]=a:delete i[e].layers[t][o],this._updateConfig({conditions:i})}_promotedColor(e,t){const o=te(e);return o?`rgba(${o.r},${o.g},${o.b},${Math.min(1,o.a*t).toFixed(2)})`:e}_removeConditionContent(e){this._setConditionProp(e,"content",void 0)}_renderContentCardSection(e,t,o){return l`
            <lcards-form-section
                header="Content card"
                description=${o?`${t.content.type}: shown instead of the alert symbol, edited here`:"Any card in place of the alert symbol"}
                icon="mdi:card-multiple-outline"
                ?expanded=${true}
                outlined>
                ${o?l`
                    <div class="content-buttons">
                        <ha-button appearance="plain" @click=${()=>this._openContentCardPicker(e)}>
                            <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                            Change card type
                        </ha-button>
                        <ha-button appearance="plain" variant="danger" @click=${()=>this._removeConditionContent(e)}>
                            <ha-icon icon="mdi:close" slot="start"></ha-icon>
                            Remove
                        </ha-button>
                    </div>
                    ${customElements.get("hui-card-element-editor")?l`
                    <div class="card-editor-host">
                        ${P(`${e}:${t.content.type}`,l`
                            <hui-card-element-editor
                                .hass=${this.hass}
                                .lovelace=${this._contentLovelace()}
                                .value=${t.content}
                                @config-changed=${a=>this._onContentChanged(e,a)}>
                            </hui-card-element-editor>`)}
                    </div>`:l`
                    <lcards-message type="info"
                        message=${`Home Assistant's card editor is not loaded here: edit the ${t.content.type} card on the YAML tab.`}>
                    </lcards-message>`}
                `:l`
                    <lcards-message type="info"
                        message="Any card in place of the alert symbol, edited here with its own editor.">
                    </lcards-message>
                    <div class="content-buttons">
                        <ha-button @click=${()=>this._openContentCardPicker(e)}>
                            <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                            Pick a card
                        </ha-button>
                    </div>
                `}
            </lcards-form-section>
        `}_onContentChanged(e,t){var a,i;t.stopPropagation();const o=((a=t.detail)==null?void 0:a.config)??((i=t.detail)==null?void 0:i.value);o!=null&&o.type&&this._setConditionProp(e,"content",JSON.parse(JSON.stringify(o)))}async _ensureCardElementEditor(){var e,t,o;if(!customElements.get("hui-card-element-editor")){customElements.whenDefined("hui-card-element-editor").then(()=>this.requestUpdate());try{const a=await((e=window.loadCardHelpers)==null?void 0:e.call(window));await(a==null?void 0:a.createCardElement({type:"vertical-stack",cards:[]})),await customElements.whenDefined("hui-vertical-stack-card"),await((o=(t=customElements.get("hui-vertical-stack-card"))==null?void 0:t.getConfigElement)==null?void 0:o.call(t))}catch{}}}_contentLovelace(){return{views:[{title:"Home",path:"home",cards:[]}]}}async _openContentCardPicker(e){var a,i;if(!customElements.get("hui-card-picker")){ae({title:"Card picker not ready",message:"Home Assistant hasn’t loaded its card picker yet. On any dashboard, click “Add card” once (you can cancel it), then come back and try again."});return}(a=this._pickerDialog)==null||a.remove();const t=document.createElement("ha-dialog");t.headerTitle="Select a card",this._pickerDialog=t,oe(t,this),t.open=true,await t.updateComplete;const o=document.createElement("hui-card-picker");o.hass=this.hass,o.lovelace=this._contentLovelace(),o.style.cssText="padding:24px; display:block;",t.appendChild(o),await new Promise(s=>setTimeout(s,80)),(i=o.requestUpdate)==null||i.call(o),o.addEventListener("config-changed",s=>{var h;s.stopPropagation();const n=(h=s.detail)==null?void 0:h.config;t.open=false,n!=null&&n.type&&(this._setConditionProp(e,"alert_button",void 0),this._setConditionProp(e,"content",JSON.parse(JSON.stringify(n))))}),t.addEventListener("closed",s=>{s.stopPropagation(),t.remove(),this._pickerDialog===t&&(this._pickerDialog=null)})}},"AlertStudioForms"),be=[{id:"config",label:"Config",icon:"mdi:cog-outline"},{id:"backdrop",label:"Backdrop",icon:"mdi:blur"},{id:"conditions",label:"Conditions",icon:"mdi:alert-outline"},{id:"yaml",label:"YAML",icon:"mdi:code-braces"}],k=p(r=>JSON.parse(JSON.stringify(r??{})),"clean"),I=class I2 extends ue(U){static get properties(){return{hass:{attribute:false},_workingConfig:{state:true},_condition:{state:true},_activeTab:{state:true},_toolbarExpanded:{state:true}}}set config(e){this._handled=false,this._initialConfig=k(e),this._workingConfig=k(e)}get config(){return this._workingConfig}constructor(){super(),this.hass=void 0,this._initialConfig={},this._workingConfig={},this._handled=false,this._condition="red_alert",this._activeTab="config",this._toolbarExpanded=true,this.cardType="alert-overlay",this._pickerDialog=null,this._pickedModes={}}connectedCallback(){super.connectedCallback(),this._ensureCardElementEditor()}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._pickerDialog)==null||e.remove(),this._pickerDialog=null}_getSchema(){return G()}_getSchemaForPath(e){return de.prototype._getSchemaForPath.call(this,e)}_getConfigValue(e){let t=this._workingConfig;for(const o of e.split(".")){if(t==null)return;t=t[o]}return t}_setConfigValue(e,t){if(t==null||t===""){this._removeConfigPath(e);return}const o=k(this._workingConfig),a=e.split(".");let i=o;for(const s of a.slice(0,-1))(!i[s]||typeof i[s]!="object")&&(i[s]={}),i=i[s];i[a[a.length-1]]=t,this._workingConfig=o}_removeConfigPath(e){var i;const t=k(this._workingConfig),o=e.split("."),a=[t];for(const s of o.slice(0,-1)){const n=(i=a[a.length-1])==null?void 0:i[s];if(!n||typeof n!="object")return;a.push(n)}delete a[a.length-1][o[o.length-1]];for(let s=a.length-1;s>0&&!Object.keys(a[s]).length;s--)delete a[s-1][o[s-1]];this._workingConfig=t}_updateConfig(e){this._workingConfig=k({...this._workingConfig,...e})}_onTab(e){var o;const t=(o=e.target.activeTab)==null?void 0:o.getAttribute("value");t&&(this._activeTab=t)}render(){return l`
            <ha-dialog open flexcontent header-title="Alert Studio"
                @closed=${e=>{e.target===e.currentTarget&&(e.stopPropagation(),this._handleCancel())}}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${this._onTab}>
                                ${be.map(e=>l`
                                    <ha-tab-group-tab value=${e.id} ?active=${this._activeTab===e.id}>
                                        <ha-icon icon=${e.icon}></ha-icon>
                                        ${e.label}
                                    </ha-tab-group-tab>`)}
                            </ha-tab-group>
                            <div class="tab-content">${this._renderActiveTab()}</div>
                        </div>
                        <div class="preview-panel">
                            <div class="preview-stage">
                                <lcards-alert-preview
                                    .hass=${this.hass}
                                    .config=${this._workingConfig}
                                    .condition=${this._condition}>
                                </lcards-alert-preview>
                                ${this._renderToolbar()}
                                <div class="preview-notes">
                                    <span class="toolbar-status">Preview only: the alert mode doesn't change and nothing shows on your dashboards. Click the backdrop (overlay) or the symbol (band) to try a dismiss.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ha-dialog-footer slot="footer">
                    <div class="footer-start" slot="secondaryAction">
                        <ha-button appearance="plain" @click=${()=>window.open(se(ie.alertOverlay),"_blank","noopener")}>
                            <ha-icon icon="mdi:book-open-variant" slot="start"></ha-icon>
                            Documentation
                        </ha-button>
                    </div>
                    <ha-button slot="secondaryAction" appearance="plain" @click=${this._handleCancel}>Cancel</ha-button>
                    <ha-button slot="primaryAction" variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_renderActiveTab(){switch(this._activeTab){case"backdrop":return this._renderBackdropTab();case"conditions":return this._renderConditionsTab();case"yaml":return l`
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${this._workingConfig}
                    .schema=${G()}
                    cardType="alert-overlay"
                    @yaml-config-changed=${e=>{this._workingConfig=k(e.detail.config)}}>
                </lcards-studio-yaml-tab>`;default:return this._renderConfigTab()}}_renderToolbar(){const e=p(()=>{this._toolbarExpanded=!this._toolbarExpanded},"toggle");return this._toolbarExpanded?l`
            <div class="canvas-toolbar">
                <div class="canvas-toolbar-buttons">
                    <div class="canvas-toolbar-group">
                        <span class="canvas-toolbar-group-label">Condition</span>
                        ${L.map(t=>l`
                            <button class="canvas-toolbar-button ${this._condition===t.key?"active":""}" data-condition=${t.key}
                                title=${`Show ${t.label}`} aria-label=${`Show ${t.label}`} aria-pressed=${this._condition===t.key?"true":"false"}
                                @click=${()=>{this._condition=t.key}}>
                                <ha-icon icon=${t.icon}></ha-icon>
                            </button>`)}
                    </div>
                    <div class="canvas-toolbar-group">
                        <span class="canvas-toolbar-group-label">Preview</span>
                        <button class="canvas-toolbar-button" data-tool="replay" title="Show the alert again" aria-label="Show the alert again"
                            @click=${()=>{var t;return(t=this.renderRoot.querySelector("lcards-alert-preview"))==null?void 0:t.replay()}}>
                            <ha-icon icon="mdi:replay"></ha-icon>
                        </button>
                    </div>
                </div>
                <button class="canvas-toolbar-toggle" title="Hide the toolbar" aria-label="Hide the toolbar" @click=${e}>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                </button>
            </div>`:l`
                <div class="canvas-toolbar collapsed">
                    <button class="canvas-toolbar-toggle" title="Show the toolbar" aria-label="Show the toolbar" @click=${e}>
                        <ha-icon icon="mdi:tools"></ha-icon>
                    </button>
                </div>`}_handleSave(){this._handled||(this._handled=true,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:k(this._workingConfig)},bubbles:true,composed:true})),this._handleClose())}_handleCancel(){this._handled||(this._handled=true,this._handleClose())}_handleClose(){this.dispatchEvent(new CustomEvent("closed",{bubbles:true,composed:true}))}static get styles(){return[re,ne,le,q`
                :host { display: block; }
                .studio-layout { grid-template-columns: 40% 60%; grid-template-rows: minmax(0, 1fr); }
                ha-tab-group { flex-shrink: 0; }
                .tab-content { padding: var(--ha-space-4); }
                lcards-form-section { display: block; }
                .preview-stage { position: relative; flex: 1; min-height: 0; display: flex; padding: 72px var(--ha-space-4) 56px; }
                lcards-alert-preview { flex: 1; min-height: 0; min-width: 0; }
                .canvas-toolbar { align-items: center; }
                .preview-notes { position: absolute; left: var(--ha-space-3); bottom: var(--ha-space-3); max-width: calc(100% - 24px); pointer-events: none; }
                .mode-pills { display: flex; margin-bottom: var(--ha-space-3); }
                .mode-pills ha-button::part(base) { border-radius: 0; border-inline-end: none; }
                .mode-pills ha-button:first-child::part(base) { border-start-start-radius: var(--ha-border-radius-pill); border-end-start-radius: var(--ha-border-radius-pill); }
                .mode-pills ha-button:last-child::part(base) { border-start-end-radius: var(--ha-border-radius-pill); border-end-end-radius: var(--ha-border-radius-pill); }
                .content-buttons { display: flex; flex-wrap: wrap; gap: var(--ha-space-2); margin-bottom: var(--ha-space-2); }
                .card-editor-host { border-top: var(--ha-border-width-sm) solid var(--divider-color); padding-top: var(--ha-space-3); }
                .field-caption { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); margin: var(--ha-space-2) 0 var(--ha-space-1); padding: 0 2px; }
            `]}};p(I,"LCARdSAlertOverlayStudioDialog");let H=I;customElements.get("lcards-alert-overlay-studio-dialog")||customElements.define("lcards-alert-overlay-studio-dialog",H);export{H as LCARdSAlertOverlayStudioDialog};
//# sourceMappingURL=lcards-alert-overlay-studio-dialog-ConKidju.js.map
