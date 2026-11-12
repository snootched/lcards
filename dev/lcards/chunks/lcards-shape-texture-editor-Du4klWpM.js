var E=Object.defineProperty;var f=(S,i)=>E(S,"name",{value:i,configurable:true});import{a as C,i as H,C as d,b as l}from"./lcards-main-C148JfkA.js";import"./lcards-form-section-BK3OqcgA.js";import"./lcards-background-animation-editor-8VgPdunD.js";const F=C`
    /* Icon Button Pattern (from MSD Studio) */
    ha-icon-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        border: var(--ha-border-width-md) solid transparent;
        transition: all var(--ha-animation-duration-normal, 0.2s);
        --ha-icon-button-size: 40px;
        --mdc-icon-size: 20px;
    }

    ha-icon-button:hover {
        background: color-mix(in srgb, var(--primary-text-color) 20%, transparent);
        border-color: var(--primary-color);
    }

    ha-icon-button.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }

    /* Info Card Pattern (from Data Grid Studio) */
    .info-card {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
        padding: var(--ha-space-4);
        background: var(--card-background-color);
        border: var(--ha-border-width-md) solid var(--divider-color);
        border-radius: var(--ha-border-radius-lg);
        margin-bottom: var(--ha-space-3);
    }

    .info-card-content h3 {
        margin: 0 0 var(--ha-space-2) 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-text-color);
    }

    .info-card-content p {
        margin: 0;
        font-size: var(--ha-font-size-m);
        color: var(--secondary-text-color);
        line-height: 1.5;
    }

    .info-card-actions {
        display: flex;
        gap: var(--ha-space-2);
        justify-content: flex-start;
    }

    /* Section Headers */
    .section-header-standard {
        font-size: var(--ha-font-size-l);
        font-weight: 500;
        margin-bottom: var(--ha-space-3);
        color: var(--primary-text-color);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        padding-bottom: var(--ha-space-2);
    }

    /* Grid Layouts */
    .two-column-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-3);
    }

    .three-column-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: var(--ha-space-3);
    }

    @media (max-width: 768px) {
        .two-column-grid,
        .three-column-grid {
            grid-template-columns: 1fr;
        }
    }

    /* Button Group Pattern */
    .button-group {
        display: flex;
        gap: var(--ha-space-2);
        margin-top: var(--ha-space-3);
    }

    .button-group ha-button {
        flex: 1;
    }

    /* Empty State Pattern */
    .empty-state {
        text-align: center;
        padding: var(--ha-space-8) var(--ha-space-4);
        color: var(--secondary-text-color);
    }

    .empty-state ha-icon {
        font-size: 64px; /* icon display size — no HA token at this scale */
        opacity: 0.3;
        margin-bottom: var(--ha-space-4);
        --mdc-icon-size: 64px;
    }

    .empty-state-title {
        font-size: var(--ha-font-size-l);
        font-weight: 600;
        margin-bottom: var(--ha-space-2);
    }

    .empty-state-subtitle {
        font-size: var(--ha-font-size-m);
        opacity: 0.7;
    }

    /* Toolbar Pattern */
    .toolbar {
        display: flex;
        gap: var(--ha-space-2);
        align-items: center;
        padding: var(--ha-space-2);
        background: var(--secondary-background-color);
        border-radius: var(--ha-border-radius-md);
        margin-bottom: var(--ha-space-3);
    }

    .toolbar-divider {
        width: var(--ha-border-width-sm);
        height: 24px;
        background: var(--divider-color);
        margin: 0 var(--ha-space-1);
    }

    /* Badge Pattern */
    .badge {
        display: inline-flex;
        align-items: center;
        padding: var(--ha-space-1) var(--ha-space-2);
        background: var(--primary-color);
        color: white;
        border-radius: var(--ha-border-radius-md);
        font-size: var(--ha-font-size-s);
        font-weight: 500;
    }

    .badge.secondary {
        background: var(--secondary-text-color);
    }

    .badge.success {
        background: var(--success-color);
    }

    .badge.warning {
        background: var(--warning-color);
    }

    .badge.error {
        background: var(--error-color);
    }
`,P=[{value:"normal",label:"Normal",hint:"Texture draws directly over the button fill (default)"},{value:"screen",label:"Screen",hint:"Lightens underlying colour: great for glows on dark buttons"},{value:"overlay",label:"Overlay",hint:"Increases contrast: dark areas darker, light areas lighter"},{value:"multiply",label:"Multiply",hint:"Darkens: useful for shadow or vignette effects"},{value:"hard-light",label:"Hard Light",hint:"Strong contrast boost, more vivid than Overlay"},{value:"soft-light",label:"Soft Light",hint:"Gentle contrast variation, subtle and natural"},{value:"color-dodge",label:"Color Dodge",hint:"Brightens dramatically: great for energy/shimmer effects"},{value:"color-burn",label:"Color Burn",hint:"Darkens and saturates: intense shadow effect"}],N=new Set(["grid","diagonal","hexagonal","dots","fluid","shimmer","plasma","flow","level","pulse","scanlines"]),T=new Set(["fluid","plasma","flow"]),v=class v2 extends H{static get properties(){return{hass:{type:Object},config:{type:Object}}}static get styles(){return C`
            :host { display: block; width: 100%; }

            .row { margin-bottom: 12px; }

            .blend-hint {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 4px;
                padding: 6px 10px;
                border-left: 3px solid var(--primary-color, #4c9be8);
                background: var(--secondary-background-color, rgba(255,255,255,0.04));
                border-radius: 0 4px 4px 0;
                line-height: 1.4;
            }

            .disabled-hint {
                font-size: 13px;
                color: var(--secondary-text-color);
                padding: 8px 0;
            }

            ha-selector { width: 100%; display: block; min-width: 0; }
        `}constructor(){super(),this.hass=void 0,this.config=void 0}_emit(i){this.dispatchEvent(new CustomEvent("texture-changed",{detail:{value:i},bubbles:true,composed:true}))}_update(i,a){this._emit({...this.config||{},[i]:a})}_updatePresetConfig(i,a){const s=this.config||{},e=s.config||{};this._emit({...s,config:{...e,[i]:a}})}render(){var u,$,m,g,b,_,w;const i=!!((u=this.config)!=null&&u.preset),a=(($=this.config)==null?void 0:$.preset)||"",s=d[a],e=((m=this.config)==null?void 0:m.config)||{},t=(s==null?void 0:s.defaults)||{},k=Object.entries(d).map(([r,o])=>({value:r,label:o.name,description:o.description})),n=((g=this.config)==null?void 0:g.mix_blend_mode)??"normal",z=((b=P.find(r=>r.value===n))==null?void 0:b.hint)??"",p=a?this._renderPresetSettings(a,e,t):null;return l`
            <!-- ── Enable toggle ─────────────────────────────────── -->
            <div class="row">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{boolean:{}}}
                    .value=${i}
                    .label=${"Enable Shape Texture"}
                    .helper=${"Renders an SVG pattern or animation inside the button shape boundary"}
                    @value-changed=${r=>{r.detail.value?this._emit({preset:"shimmer",opacity:.45,config:{...d.shimmer.defaults}}):this._emit(null)}}
                ></ha-selector>
            </div>

            ${i?l`

                <!-- ══ PRESET ════════════════════════════════════ -->
                <lcards-form-section header="Preset" ?expanded=${true}>
                    <div class="row">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:k,mode:"dropdown"}}}
                            .value=${a}
                            .label=${"Texture Preset"}
                            .helper=${(s==null?void 0:s.description)??""}
                            @value-changed=${r=>{var x,y;const o=r.detail.value,c=d[o];this._emit({preset:o,opacity:((x=this.config)==null?void 0:x.opacity)??.3,mix_blend_mode:((y=this.config)==null?void 0:y.mix_blend_mode)??"normal",config:{...(c==null?void 0:c.defaults)||{}}})}}
                        ></ha-selector>
                    </div>
                </lcards-form-section>

                <!-- ══ APPEARANCE ════════════════════════════════ -->
                <lcards-form-section header="Appearance" ?expanded=${true}>

                    <!-- Color (not shown for presets that manage their own colors) -->
                    ${s&&!["plasma","level","image"].includes(a)?l`
                        <div class="row">
                            <lcards-color-picker
                                .hass=${this.hass}
                                .label=${"Texture Color"}
                                .value=${e.color??t.color??"rgba(255,255,255,0.3)"}
                                @value-changed=${r=>this._updatePresetConfig("color",r.detail.value)}
                            ></lcards-color-picker>
                        </div>
                    `:""}

                    <!-- Plasma dual colors -->
                    ${a==="plasma"?l`
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Color A"}
                                .value=${e.color_a??t.color_a??"rgba(80,0,255,0.9)"}
                                @value-changed=${r=>this._updatePresetConfig("color_a",r.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Color B"}
                                .value=${e.color_b??t.color_b??"rgba(255,40,120,0.9)"}
                                @value-changed=${r=>this._updatePresetConfig("color_b",r.detail.value)}
                            ></lcards-color-picker>
                        </div>
                    `:""}

                    <!-- Level fill + gradient colors -->
                    ${a==="level"?l`
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Fill Colour"}
                                .value=${e.color_a??e.color??t.color??"rgba(0,200,100,0.7)"}
                                @value-changed=${r=>this._updatePresetConfig("color_a",r.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Edge Tint (optional gradient)"}
                                .value=${e.color_b??t.color_b??""}
                                @value-changed=${r=>this._updatePresetConfig("color_b",r.detail.value||null)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            <ha-selector .hass=${this.hass}
                                .selector=${{number:{min:0,max:100,step:1,mode:"slider"}}}
                                .value=${e.gradient_crossover??t.gradient_crossover??80}
                                .label=${"Gradient Crossover (%)"}
                                .helper=${"How far from the wave the colour blend starts · only active when Edge Tint is set"}
                                @value-changed=${r=>this._updatePresetConfig("gradient_crossover",r.detail.value)}
                            ></ha-selector>
                        </div>
                    `:""}

                    <!-- Opacity -->
                    <div class="row">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,max:1,step:.05,mode:"slider"}}}
                            .value=${((_=this.config)==null?void 0:_.opacity)??.3}
                            .label=${"Opacity"}
                            .helper=${"0 = invisible · 1 = fully opaque"}
                            @value-changed=${r=>this._update("opacity",r.detail.value)}
                        ></ha-selector>
                    </div>

                    <!-- Blend Mode -->
                    <div class="row">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:P.map(r=>({value:r.value,label:r.label})),mode:"dropdown"}}}
                            .value=${n}
                            .label=${"Blend Mode"}
                            .helper=${"Controls how the texture layer is composited over the button fill colour"}
                            @value-changed=${r=>this._update("mix_blend_mode",r.detail.value)}
                        ></ha-selector>
                        ${n!=="normal"?l`<div class="blend-hint">${z}</div>`:""}
                    </div>

                </lcards-form-section>

                <!-- ══ ANIMATION ══════════════════════════════════ -->
                ${N.has(a)?l`
                    <lcards-form-section header="Animation" ?expanded=${true}>

                        <!-- Global speed multiplier (non-turbulence animated presets) -->
                        ${T.has(a)?"":l`
                            <div class="row">
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:0,max:10,step:.1,mode:"slider"}}}
                                    .value=${((w=this.config)==null?void 0:w.speed)??1}
                                    .label=${"Speed Multiplier"}
                                    .helper=${"Scales all scroll speeds: 0 freezes, 1 = default, 2 = double"}
                                    @value-changed=${r=>this._update("speed",r.detail.value)}
                                ></ha-selector>
                            </div>
                        `}

                        ${this._renderAnimationParams(a,e,t)}

                    </lcards-form-section>
                `:""}

                <!-- ══ PRESET SETTINGS ════════════════════════════ -->
                ${p?l`
                    <lcards-form-section header="Settings" ?expanded=${true}>
                        ${p}
                    </lcards-form-section>
                `:""}

            `:l`
                <div class="disabled-hint">Enable shape texture to configure options.</div>
            `}
        `}_renderAnimationParams(i,a,s){switch(i){case"grid":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_x??s.scroll_speed_x??20}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_x",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_y??s.scroll_speed_y??0}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_y",e.detail.value)}
                    ></ha-selector></div>`;case"diagonal":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_x??s.scroll_speed_x??20}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_x",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_y??s.scroll_speed_y??20}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_y",e.detail.value)}
                    ></ha-selector></div>`;case"hexagonal":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_x??s.scroll_speed_x??15}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_x",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_y??s.scroll_speed_y??0}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_y",e.detail.value)}
                    ></ha-selector></div>`;case"dots":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_x??s.scroll_speed_x??15}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_x",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_y??s.scroll_speed_y??0}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_y",e.detail.value)}
                    ></ha-selector></div>`;case"fluid":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_x??s.scroll_speed_x??7}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_x",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_y??s.scroll_speed_y??10}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_y",e.detail.value)}
                    ></ha-selector></div>`;case"plasma":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_x??s.scroll_speed_x??8}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_x",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_y??s.scroll_speed_y??5}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_y",e.detail.value)}
                    ></ha-selector></div>`;case"level":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-120,max:120,step:1,mode:"slider"}}}
                        .value=${a.wave_speed??s.wave_speed??20}
                        .label=${"Wave 1 Speed (deg/s)"}
                        .helper=${"Phase rate · negative = reverse direction"}
                        @value-changed=${e=>this._updatePresetConfig("wave_speed",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-120,max:120,step:1,mode:"slider"}}}
                        .value=${a.wave2_speed??s.wave2_speed??-15}
                        .label=${"Wave 2 Speed (deg/s)"}
                        .helper=${"Opposite sign to Wave 1 creates interference patterns · ignored when Wave 2 Height = 0"}
                        @value-changed=${e=>this._updatePresetConfig("wave2_speed",e.detail.value)}
                    ></ha-selector></div>`;case"flow":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_x??s.scroll_speed_x??50}
                        .label=${"Flow Speed X (px/s)"}
                        .helper=${"Horizontal stream speed · negative = reverse · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_x",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_y??s.scroll_speed_y??0}
                        .label=${"Flow Speed Y (px/s)"}
                        .helper=${"Vertical stream speed · negative = reverse · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_y",e.detail.value)}
                    ></ha-selector></div>`;case"shimmer":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.1,max:20,step:.1,mode:"slider"}}}
                        .value=${a.speed??s.speed??2.5}
                        .label=${"Sweep Speed (px/s)"}
                        .helper=${"How fast the highlight sweeps across"}
                        @value-changed=${e=>this._updatePresetConfig("speed",e.detail.value)}
                    ></ha-selector></div>`;case"pulse":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.1,max:10,step:.1,mode:"slider"}}}
                        .value=${a.speed??s.speed??1.2}
                        .label=${"Pulses per second"}
                        .helper=${"How fast the glow breathes in and out"}
                        @value-changed=${e=>this._updatePresetConfig("speed",e.detail.value)}
                    ></ha-selector></div>`;case"scanlines":return(a.direction??s.direction??"horizontal")==="vertical"?l`<div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_x??s.scroll_speed_x??0}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Horizontal scroll speed · negative = reverse · 0 = static"}
                        @value-changed=${t=>this._updatePresetConfig("scroll_speed_x",t.detail.value)}
                    ></ha-selector></div>`:l`<div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${a.scroll_speed_y??s.scroll_speed_y??0}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Vertical scroll speed · negative = reverse · 0 = static"}
                        @value-changed=${t=>this._updatePresetConfig("scroll_speed_y",t.detail.value)}
                    ></ha-selector></div>`;default:return""}}_renderPresetSettings(i,a,s){switch(i){case"grid":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:1,max:10,step:.5,mode:"slider"}}}
                        .value=${a.line_width??s.line_width??1}
                        .label=${"Line Width"}
                        @value-changed=${e=>this._updatePresetConfig("line_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:200,step:1,mode:"slider"}}}
                        .value=${a.line_spacing??s.line_spacing??40}
                        .label=${"Grid Cell Size (px)"}
                        @value-changed=${e=>this._updatePresetConfig("line_spacing",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{select:{options:[{value:"both",label:"Grid (both axes)"},{value:"horizontal",label:"Horizontal lines only"},{value:"vertical",label:"Vertical lines only"}],mode:"dropdown"}}}
                        .value=${a.pattern??s.pattern??"both"}
                        .label=${"Line Pattern"}
                        @value-changed=${e=>this._updatePresetConfig("pattern",e.detail.value)}
                    ></ha-selector></div>`;case"diagonal":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:1,max:10,step:.5,mode:"slider"}}}
                        .value=${a.line_width??s.line_width??1}
                        .label=${"Line Width"}
                        @value-changed=${e=>this._updatePresetConfig("line_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:200,step:1,mode:"slider"}}}
                        .value=${a.line_spacing??s.line_spacing??40}
                        .label=${"Stripe Spacing (px)"}
                        @value-changed=${e=>this._updatePresetConfig("line_spacing",e.detail.value)}
                    ></ha-selector></div>`;case"hexagonal":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:1,max:10,step:.5,mode:"slider"}}}
                        .value=${a.line_width??s.line_width??1}
                        .label=${"Line Width"}
                        @value-changed=${e=>this._updatePresetConfig("line_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:100,step:1,mode:"slider"}}}
                        .value=${a.hex_radius??s.hex_radius??20}
                        .label=${"Hex Cell Radius (px)"}
                        @value-changed=${e=>this._updatePresetConfig("hex_radius",e.detail.value)}
                    ></ha-selector></div>`;case"dots":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.5,max:20,step:.5,mode:"slider"}}}
                        .value=${a.dot_radius??s.dot_radius??2}
                        .label=${"Dot Radius (px)"}
                        @value-changed=${e=>this._updatePresetConfig("dot_radius",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:100,step:1,mode:"slider"}}}
                        .value=${a.spacing??s.spacing??20}
                        .label=${"Dot Spacing (px)"}
                        @value-changed=${e=>this._updatePresetConfig("spacing",e.detail.value)}
                    ></ha-selector></div>`;case"fluid":case"plasma":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.004,max:.08,step:.001,mode:"slider"}}}
                        .value=${a.base_frequency??s.base_frequency??.018}
                        .label=${"Base Frequency"}
                        .helper=${"Lower = larger blobs, higher = finer noise"}
                        @value-changed=${e=>this._updatePresetConfig("base_frequency",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:1,max:8,step:1,mode:"slider"}}}
                        .value=${a.num_octaves??s.num_octaves??3}
                        .label=${"Octaves"}
                        .helper=${"More octaves = finer detail (higher GPU cost)"}
                        @value-changed=${e=>this._updatePresetConfig("num_octaves",e.detail.value)}
                    ></ha-selector></div>`;case"flow":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:2,max:24,step:1,mode:"slider"}}}
                        .value=${a.num_streaks??s.num_streaks??8}
                        .label=${"Number of Bands"}
                        .helper=${"More bands = denser parallel streaks"}
                        @value-changed=${e=>this._updatePresetConfig("num_streaks",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.1,max:2,step:.05,mode:"slider"}}}
                        .value=${a.streak_width??s.streak_width??.8}
                        .label=${"Band Width"}
                        .helper=${"Fraction of band slot filled · >1.0 = bands overlap and blend"}
                        @value-changed=${e=>this._updatePresetConfig("streak_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:0,max:20,step:.5,mode:"slider"}}}
                        .value=${a.blur??s.blur??0}
                        .label=${"Blur (px)"}
                        .helper=${"Gaussian softness on band edges · 0 = crisp"}
                        @value-changed=${e=>this._updatePresetConfig("blur",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.004,max:.08,step:.001,mode:"slider"}}}
                        .value=${a.base_frequency??s.base_frequency??.015}
                        .label=${"Turbulence Frequency"}
                        .helper=${"Lower = longer, lazier streak shapes"}
                        @value-changed=${e=>this._updatePresetConfig("base_frequency",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:80,step:1,mode:"slider"}}}
                        .value=${a.wave_scale??s.wave_scale??8}
                        .label=${"Warp Intensity"}
                        .helper=${"How much the displacement distorts the streaks"}
                        @value-changed=${e=>this._updatePresetConfig("wave_scale",e.detail.value)}
                    ></ha-selector></div>`;case"shimmer":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.05,max:.8,step:.05,mode:"slider"}}}
                        .value=${a.highlight_width??s.highlight_width??.35}
                        .label=${"Highlight Width"}
                        .helper=${"Fraction of the sweep tile covered by the bright band"}
                        @value-changed=${e=>this._updatePresetConfig("highlight_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-90,max:90,step:5,mode:"slider"}}}
                        .value=${a.angle??s.angle??30}
                        .label=${"Angle (degrees)"}
                        .helper=${"0° = horizontal sweep · 30° = diagonal · 90° = vertical"}
                        @value-changed=${e=>this._updatePresetConfig("angle",e.detail.value)}
                    ></ha-selector></div>`;case"level":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:0,max:100,step:1,mode:"slider"}}}
                        .value=${a.fill_pct??s.fill_pct??50}
                        .label=${"Fill Level (%)"}
                        .helper=${"0 = empty · 100 = full · supports state-based values via rules engine"}
                        @value-changed=${e=>this._updatePresetConfig("fill_pct",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{select:{options:[{value:"up",label:"Fill upward (bottom → top)"},{value:"down",label:"Fill downward (top → bottom)"},{value:"left",label:"Fill leftward (right → left)"},{value:"right",label:"Fill rightward (left → right)"}],mode:"dropdown"}}}
                        .value=${a.direction??s.direction??"up"}
                        .label=${"Fill Direction"}
                        @value-changed=${e=>this._updatePresetConfig("direction",e.detail.value)}
                    ></ha-selector></div>

                    <lcards-form-section header="Primary Wave" ?expanded=${true} .nested=${true}>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:0,max:20,step:.5,mode:"slider"}}}
                            .value=${a.wave_height??s.wave_height??4}
                            .label=${"Height (px)"}
                            .helper=${"0 = flat fill edge"}
                            @value-changed=${e=>this._updatePresetConfig("wave_height",e.detail.value)}
                        ></ha-selector></div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:1,max:16,step:1,mode:"slider"}}}
                            .value=${a.wave_count??s.wave_count??4}
                            .label=${"Count"}
                            .helper=${"Sine cycles across the button width"}
                            @value-changed=${e=>this._updatePresetConfig("wave_count",e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>

                    <lcards-form-section header="Secondary Wave" ?expanded=${false} .nested=${true}>
                        <div class="row" style="font-size:12px;color:var(--secondary-text-color);padding-bottom:8px;line-height:1.5">
                            Adds a second harmonic to the <em>same</em> fill surface: not a separate layer or colour.
                            Set Height to 0 to disable.
                        </div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:0,max:12,step:.5,mode:"slider"}}}
                            .value=${a.wave2_height??s.wave2_height??0}
                            .label=${"Height (px)"}
                            .helper=${"0 = disabled"}
                            @value-changed=${e=>this._updatePresetConfig("wave2_height",e.detail.value)}
                        ></ha-selector></div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:1,max:20,step:1,mode:"slider"}}}
                            .value=${a.wave2_count??s.wave2_count??5}
                            .label=${"Count"}
                            @value-changed=${e=>this._updatePresetConfig("wave2_count",e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>

                    <lcards-form-section header="Sloshing" ?expanded=${false} .nested=${true}>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:0,max:1,step:.05,mode:"slider"}}}
                            .value=${a.slosh_amount??s.slosh_amount??0}
                            .label=${"Amount"}
                            .helper=${"0 = disabled · fluid tilts side-to-side as if in a vessel"}
                            @value-changed=${e=>this._updatePresetConfig("slosh_amount",e.detail.value)}
                        ></ha-selector></div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:.5,max:10,step:.5,mode:"slider"}}}
                            .value=${a.slosh_period??s.slosh_period??3}
                            .label=${"Period (s)"}
                            .helper=${"Seconds per complete slosh cycle"}
                            @value-changed=${e=>this._updatePresetConfig("slosh_period",e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>

                    <lcards-form-section header="Edge Glow" ?expanded=${false} .nested=${true}>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{boolean:{}}}
                            .value=${a.edge_glow??s.edge_glow??true}
                            .label=${"Enable"}
                            @value-changed=${e=>this._updatePresetConfig("edge_glow",e.detail.value)}
                        ></ha-selector></div>
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Glow Colour"}
                                .value=${a.edge_glow_color??s.edge_glow_color??"rgba(255,255,255,0.7)"}
                                @value-changed=${e=>this._updatePresetConfig("edge_glow_color",e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:1,max:24,step:.5,mode:"slider"}}}
                            .value=${a.edge_glow_width??s.edge_glow_width??6}
                            .label=${"Glow Width (px)"}
                            .helper=${"Bloom spread radius · colour alpha controls intensity"}
                            @value-changed=${e=>this._updatePresetConfig("edge_glow_width",e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>`;case"pulse":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.1,max:1,step:.05,mode:"slider"}}}
                        .value=${a.radius??s.radius??.7}
                        .label=${"Radius"}
                        .helper=${"Largest glow, as a fraction of half the shape's diagonal"}
                        @value-changed=${e=>this._updatePresetConfig("radius",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:0,max:.95,step:.05,mode:"slider"}}}
                        .value=${a.min_size??s.min_size??.15}
                        .label=${"Smallest size"}
                        .helper=${"How far the glow shrinks, as a fraction of its largest size"}
                        @value-changed=${e=>this._updatePresetConfig("min_size",e.detail.value)}
                    ></ha-selector></div>`;case"scanlines":return l`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{select:{options:[{value:"horizontal",label:"Horizontal (lines run left↔right, scroll vertically)"},{value:"vertical",label:"Vertical (lines run top↕bottom, scroll horizontally)"}],mode:"dropdown"}}}
                        .value=${a.direction??s.direction??"horizontal"}
                        .label=${"Line Direction"}
                        @value-changed=${e=>this._updatePresetConfig("direction",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:2,max:20,step:.5,mode:"slider"}}}
                        .value=${a.line_spacing??s.line_spacing??4}
                        .label=${"Line Spacing (px)"}
                        @value-changed=${e=>this._updatePresetConfig("line_spacing",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.5,max:8,step:.5,mode:"slider"}}}
                        .value=${a.line_width??s.line_width??1.5}
                        .label=${"Line Width"}
                        @value-changed=${e=>this._updatePresetConfig("line_width",e.detail.value)}
                    ></ha-selector></div>`;case"image":{const e=a.source??a.url??s.source??s.url??"";return l`
                    <div class="row">
                        <lcards-asset-source-picker .hass=${this.hass} .value=${e}
                            .label=${"Image Source"} .assetLabel=${"Built-in Image"}
                            .assetHelper=${"Images and SVGs registered in the Asset Library"}
                            .customLabel=${"Image URL"}
                            .customHelper=${"Path to image: /local/images/room.jpg · https://… · or a template: {entity.attributes.entity_picture}"}
                            .mediaHelper=${"Browse or upload an image via the Home Assistant media library"}
                            @value-changed=${t=>{t.stopPropagation(),this._updatePresetConfig("source",t.detail.value)}}
                        ></lcards-asset-source-picker>
                    </div>

                    <div class="row">
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:[{value:"cover",label:"Cover (fill, may crop)"},{value:"contain",label:"Contain (fit, may letterbox)"},{value:"fill",label:"Fill (stretch to canvas)"}]}}}
                            .value=${a.size??s.size??"cover"}
                            .label=${"Size"}
                            .helper=${"How the image is scaled to fit inside the shape"}
                            @value-changed=${t=>this._updatePresetConfig("size",t.detail.value)}
                        ></ha-selector>
                    </div>

                    <div class="row">
                        <ha-selector .hass=${this.hass}
                            .selector=${{text:{}}}
                            .value=${a.position??s.position??"center"}
                            .label=${"Position"}
                            .helper=${'CSS background-position value, e.g. "center", "top left", "50% 20%"'}
                            @value-changed=${t=>this._updatePresetConfig("position",t.detail.value)}
                        ></ha-selector>
                    </div>

                    <div class="row">
                        <ha-selector .hass=${this.hass}
                            .selector=${{boolean:{}}}
                            .value=${a.repeat??s.repeat??false}
                            .label=${"Tile / Repeat"}
                            .helper=${"Tile the image across the shape area"}
                            @value-changed=${t=>this._updatePresetConfig("repeat",t.detail.value)}
                        ></ha-selector>
                    </div>`}case"circuit":return l``;default:return null}}};f(v,"LCARdSShapeTextureEditor");let h=v;customElements.get("lcards-shape-texture-editor")||customElements.define("lcards-shape-texture-editor",h);export{F as e};
//# sourceMappingURL=lcards-shape-texture-editor-Du4klWpM.js.map
