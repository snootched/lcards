var E=Object.defineProperty;var g=(k,o)=>E(k,"name",{value:o,configurable:true});import{i as A,a as N,C as m,b as t}from"./lcards-main-OH3P_lk4.js";import"./lcards-form-section-CBBDqzr-.js";const S=[{value:"normal",label:"Normal",hint:"Texture draws directly over the button fill (default)"},{value:"screen",label:"Screen",hint:"Lightens underlying colour: great for glows on dark buttons"},{value:"overlay",label:"Overlay",hint:"Increases contrast: dark areas darker, light areas lighter"},{value:"multiply",label:"Multiply",hint:"Darkens: useful for shadow or vignette effects"},{value:"hard-light",label:"Hard Light",hint:"Strong contrast boost, more vivid than Overlay"},{value:"soft-light",label:"Soft Light",hint:"Gentle contrast variation, subtle and natural"},{value:"color-dodge",label:"Color Dodge",hint:"Brightens dramatically: great for energy/shimmer effects"},{value:"color-burn",label:"Color Burn",hint:"Darkens and saturates: intense shadow effect"}],T=new Set(["grid","diagonal","hexagonal","dots","fluid","shimmer","plasma","flow","level","scanlines"]),H=new Set(["fluid","plasma","flow"]),w=class w2 extends A{static get properties(){return{hass:{type:Object},config:{type:Object},_imageSrcMode:{type:String,state:true}}}static get styles(){return N`
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
        `}constructor(){super(),this.hass=void 0,this.config=void 0,this._imageSrcMode=null}_getAvailableImages(){var c,d,u,v;const o=(d=(c=window.lcards)==null?void 0:c.core)==null?void 0:d.assetManager;if(!o)return[];const s=g((i,n)=>{var h,p;return!!((p=(h=o.getMetadata)==null?void 0:h.call(o,i,n))!=null&&p.pack)},"isPackAsset"),a=(((u=o.listAssets)==null?void 0:u.call(o,"svg"))??[]).filter(i=>s("svg",i)),l=(((v=o.listImages)==null?void 0:v.call(o))??[]).filter(i=>s("image",i));return[...new Set([...a,...l])].sort().map(i=>({value:`builtin:${i}`,label:i}))}_emit(o){this.dispatchEvent(new CustomEvent("texture-changed",{detail:{value:o},bubbles:true,composed:true}))}_update(o,s){this._emit({...this.config||{},[o]:s})}_updatePresetConfig(o,s){const a=this.config||{},l=a.config||{};this._emit({...a,config:{...l,[o]:s}})}render(){var i,n,h,p,x,P,y;const o=!!((i=this.config)!=null&&i.preset),s=((n=this.config)==null?void 0:n.preset)||"",a=m[s],l=((h=this.config)==null?void 0:h.config)||{},e=(a==null?void 0:a.defaults)||{},c=Object.entries(m).map(([r,$])=>({value:r,label:$.name,description:$.description})),d=((p=this.config)==null?void 0:p.mix_blend_mode)??"normal",u=((x=S.find(r=>r.value===d))==null?void 0:x.hint)??"",v=s?this._renderPresetSettings(s,l,e):null;return t`
            <!-- ── Enable toggle ─────────────────────────────────── -->
            <div class="row">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{boolean:{}}}
                    .value=${o}
                    .label=${"Enable Shape Texture"}
                    .helper=${"Renders an SVG pattern or animation inside the button shape boundary"}
                    @value-changed=${r=>{r.detail.value?this._emit({preset:"shimmer",opacity:.45,config:{...m.shimmer.defaults}}):this._emit(null)}}
                ></ha-selector>
            </div>

            ${o?t`

                <!-- ══ PRESET ════════════════════════════════════ -->
                <lcards-form-section header="Preset" ?expanded=${true}>
                    <div class="row">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:c,mode:"dropdown"}}}
                            .value=${s}
                            .label=${"Texture Preset"}
                            .helper=${(a==null?void 0:a.description)??""}
                            @value-changed=${r=>{var C,f;const $=r.detail.value,_=m[$];this._emit({preset:$,opacity:((C=this.config)==null?void 0:C.opacity)??.3,mix_blend_mode:((f=this.config)==null?void 0:f.mix_blend_mode)??"normal",config:{...(_==null?void 0:_.defaults)||{}}})}}
                        ></ha-selector>
                    </div>
                </lcards-form-section>

                <!-- ══ APPEARANCE ════════════════════════════════ -->
                <lcards-form-section header="Appearance" ?expanded=${true}>

                    <!-- Color (not shown for presets that manage their own colors) -->
                    ${a&&!["plasma","level","image"].includes(s)?t`
                        <div class="row">
                            <lcards-color-picker
                                .hass=${this.hass}
                                .label=${"Texture Color"}
                                .value=${l.color??e.color??"rgba(255,255,255,0.3)"}
                                @value-changed=${r=>this._updatePresetConfig("color",r.detail.value)}
                            ></lcards-color-picker>
                        </div>
                    `:""}

                    <!-- Plasma dual colors -->
                    ${s==="plasma"?t`
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Color A"}
                                .value=${l.color_a??e.color_a??"rgba(80,0,255,0.9)"}
                                @value-changed=${r=>this._updatePresetConfig("color_a",r.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Color B"}
                                .value=${l.color_b??e.color_b??"rgba(255,40,120,0.9)"}
                                @value-changed=${r=>this._updatePresetConfig("color_b",r.detail.value)}
                            ></lcards-color-picker>
                        </div>
                    `:""}

                    <!-- Level fill + gradient colors -->
                    ${s==="level"?t`
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Fill Colour"}
                                .value=${l.color_a??l.color??e.color_a??"rgba(0,200,100,0.7)"}
                                @value-changed=${r=>this._updatePresetConfig("color_a",r.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Edge Tint (optional gradient)"}
                                .value=${l.color_b??e.color_b??""}
                                @value-changed=${r=>this._updatePresetConfig("color_b",r.detail.value||null)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            <ha-selector .hass=${this.hass}
                                .selector=${{number:{min:0,max:100,step:1,mode:"slider"}}}
                                .value=${l.gradient_crossover??e.gradient_crossover??80}
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
                            .value=${((P=this.config)==null?void 0:P.opacity)??.3}
                            .label=${"Opacity"}
                            .helper=${"0 = invisible · 1 = fully opaque"}
                            @value-changed=${r=>this._update("opacity",r.detail.value)}
                        ></ha-selector>
                    </div>

                    <!-- Blend Mode -->
                    <div class="row">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:S.map(r=>({value:r.value,label:r.label})),mode:"dropdown"}}}
                            .value=${d}
                            .label=${"Blend Mode"}
                            .helper=${"Controls how the texture layer is composited over the button fill colour"}
                            @value-changed=${r=>this._update("mix_blend_mode",r.detail.value)}
                        ></ha-selector>
                        ${d!=="normal"?t`<div class="blend-hint">${u}</div>`:""}
                    </div>

                </lcards-form-section>

                <!-- ══ ANIMATION ══════════════════════════════════ -->
                ${T.has(s)?t`
                    <lcards-form-section header="Animation" ?expanded=${true}>

                        <!-- Global speed multiplier (non-turbulence animated presets) -->
                        ${H.has(s)?"":t`
                            <div class="row">
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:0,max:10,step:.1,mode:"slider"}}}
                                    .value=${((y=this.config)==null?void 0:y.speed)??1}
                                    .label=${"Speed Multiplier"}
                                    .helper=${"Scales all scroll speeds: 0 freezes, 1 = default, 2 = double"}
                                    @value-changed=${r=>this._update("speed",r.detail.value)}
                                ></ha-selector>
                            </div>
                        `}

                        ${this._renderAnimationParams(s,l,e)}

                    </lcards-form-section>
                `:""}

                <!-- ══ PRESET SETTINGS ════════════════════════════ -->
                ${v?t`
                    <lcards-form-section header="Settings" ?expanded=${true}>
                        ${v}
                    </lcards-form-section>
                `:""}

            `:t`
                <div class="disabled-hint">Enable shape texture to configure options.</div>
            `}
        `}_renderAnimationParams(o,s,a){switch(o){case"grid":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_x??a.scroll_speed_x??20}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_x",l.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_y??a.scroll_speed_y??0}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_y",l.detail.value)}
                    ></ha-selector></div>`;case"diagonal":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_x??a.scroll_speed_x??20}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_x",l.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_y??a.scroll_speed_y??20}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_y",l.detail.value)}
                    ></ha-selector></div>`;case"hexagonal":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_x??a.scroll_speed_x??15}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_x",l.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_y??a.scroll_speed_y??0}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_y",l.detail.value)}
                    ></ha-selector></div>`;case"dots":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_x??a.scroll_speed_x??15}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_x",l.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_y??a.scroll_speed_y??0}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_y",l.detail.value)}
                    ></ha-selector></div>`;case"fluid":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_x??a.scroll_speed_x??7}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_x",l.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_y??a.scroll_speed_y??10}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_y",l.detail.value)}
                    ></ha-selector></div>`;case"plasma":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_x??a.scroll_speed_x??8}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Negative = reverse direction"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_x",l.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_y??a.scroll_speed_y??5}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Negative = reverse direction"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_y",l.detail.value)}
                    ></ha-selector></div>`;case"level":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-120,max:120,step:1,mode:"slider"}}}
                        .value=${s.wave_speed??a.wave_speed??20}
                        .label=${"Wave 1 Speed (deg/s)"}
                        .helper=${"Phase rate · negative = reverse direction"}
                        @value-changed=${l=>this._updatePresetConfig("wave_speed",l.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-120,max:120,step:1,mode:"slider"}}}
                        .value=${s.wave2_speed??a.wave2_speed??-15}
                        .label=${"Wave 2 Speed (deg/s)"}
                        .helper=${"Opposite sign to Wave 1 creates interference patterns · ignored when Wave 2 Height = 0"}
                        @value-changed=${l=>this._updatePresetConfig("wave2_speed",l.detail.value)}
                    ></ha-selector></div>`;case"flow":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_x??a.scroll_speed_x??50}
                        .label=${"Flow Speed X (px/s)"}
                        .helper=${"Horizontal stream speed · negative = reverse · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_x",l.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_y??a.scroll_speed_y??0}
                        .label=${"Flow Speed Y (px/s)"}
                        .helper=${"Vertical stream speed · negative = reverse · 0 = static"}
                        @value-changed=${l=>this._updatePresetConfig("scroll_speed_y",l.detail.value)}
                    ></ha-selector></div>`;case"shimmer":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.1,max:20,step:.1,mode:"slider"}}}
                        .value=${s.speed??a.speed??2.5}
                        .label=${"Sweep Speed (px/s)"}
                        .helper=${"How fast the highlight sweeps across"}
                        @value-changed=${l=>this._updatePresetConfig("speed",l.detail.value)}
                    ></ha-selector></div>`;case"scanlines":return(s.direction??a.direction??"horizontal")==="vertical"?t`<div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_x??a.scroll_speed_x??0}
                        .label=${"Scroll Speed X (px/s)"}
                        .helper=${"Horizontal scroll speed · negative = reverse · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_x",e.detail.value)}
                    ></ha-selector></div>`:t`<div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-200,max:200,step:1,mode:"slider"}}}
                        .value=${s.scroll_speed_y??a.scroll_speed_y??0}
                        .label=${"Scroll Speed Y (px/s)"}
                        .helper=${"Vertical scroll speed · negative = reverse · 0 = static"}
                        @value-changed=${e=>this._updatePresetConfig("scroll_speed_y",e.detail.value)}
                    ></ha-selector></div>`;default:return""}}_renderPresetSettings(o,s,a){var l;switch(o){case"grid":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:1,max:10,step:.5,mode:"slider"}}}
                        .value=${s.line_width??a.line_width??1}
                        .label=${"Line Width"}
                        @value-changed=${e=>this._updatePresetConfig("line_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:200,step:1,mode:"slider"}}}
                        .value=${s.line_spacing??a.line_spacing??40}
                        .label=${"Grid Cell Size (px)"}
                        @value-changed=${e=>this._updatePresetConfig("line_spacing",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{select:{options:[{value:"both",label:"Grid (both axes)"},{value:"horizontal",label:"Horizontal lines only"},{value:"vertical",label:"Vertical lines only"}],mode:"dropdown"}}}
                        .value=${s.pattern??a.pattern??"both"}
                        .label=${"Line Pattern"}
                        @value-changed=${e=>this._updatePresetConfig("pattern",e.detail.value)}
                    ></ha-selector></div>`;case"diagonal":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:1,max:10,step:.5,mode:"slider"}}}
                        .value=${s.line_width??a.line_width??1}
                        .label=${"Line Width"}
                        @value-changed=${e=>this._updatePresetConfig("line_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:200,step:1,mode:"slider"}}}
                        .value=${s.line_spacing??a.line_spacing??40}
                        .label=${"Stripe Spacing (px)"}
                        @value-changed=${e=>this._updatePresetConfig("line_spacing",e.detail.value)}
                    ></ha-selector></div>`;case"hexagonal":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:1,max:10,step:.5,mode:"slider"}}}
                        .value=${s.line_width??a.line_width??1}
                        .label=${"Line Width"}
                        @value-changed=${e=>this._updatePresetConfig("line_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:100,step:1,mode:"slider"}}}
                        .value=${s.hex_radius??a.hex_radius??20}
                        .label=${"Hex Cell Radius (px)"}
                        @value-changed=${e=>this._updatePresetConfig("hex_radius",e.detail.value)}
                    ></ha-selector></div>`;case"dots":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.5,max:20,step:.5,mode:"slider"}}}
                        .value=${s.dot_radius??a.dot_radius??2}
                        .label=${"Dot Radius (px)"}
                        @value-changed=${e=>this._updatePresetConfig("dot_radius",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:100,step:1,mode:"slider"}}}
                        .value=${s.spacing??a.spacing??20}
                        .label=${"Dot Spacing (px)"}
                        @value-changed=${e=>this._updatePresetConfig("spacing",e.detail.value)}
                    ></ha-selector></div>`;case"fluid":case"plasma":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.004,max:.08,step:.001,mode:"slider"}}}
                        .value=${s.base_frequency??a.base_frequency??.018}
                        .label=${"Base Frequency"}
                        .helper=${"Lower = larger blobs, higher = finer noise"}
                        @value-changed=${e=>this._updatePresetConfig("base_frequency",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:1,max:8,step:1,mode:"slider"}}}
                        .value=${s.num_octaves??a.num_octaves??3}
                        .label=${"Octaves"}
                        .helper=${"More octaves = finer detail (higher GPU cost)"}
                        @value-changed=${e=>this._updatePresetConfig("num_octaves",e.detail.value)}
                    ></ha-selector></div>`;case"flow":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:2,max:24,step:1,mode:"slider"}}}
                        .value=${s.num_streaks??a.num_streaks??8}
                        .label=${"Number of Bands"}
                        .helper=${"More bands = denser parallel streaks"}
                        @value-changed=${e=>this._updatePresetConfig("num_streaks",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.1,max:2,step:.05,mode:"slider"}}}
                        .value=${s.streak_width??a.streak_width??.8}
                        .label=${"Band Width"}
                        .helper=${"Fraction of band slot filled · >1.0 = bands overlap and blend"}
                        @value-changed=${e=>this._updatePresetConfig("streak_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:0,max:20,step:.5,mode:"slider"}}}
                        .value=${s.blur??a.blur??0}
                        .label=${"Blur (px)"}
                        .helper=${"Gaussian softness on band edges · 0 = crisp"}
                        @value-changed=${e=>this._updatePresetConfig("blur",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.004,max:.08,step:.001,mode:"slider"}}}
                        .value=${s.base_frequency??a.base_frequency??.015}
                        .label=${"Turbulence Frequency"}
                        .helper=${"Lower = longer, lazier streak shapes"}
                        @value-changed=${e=>this._updatePresetConfig("base_frequency",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:5,max:80,step:1,mode:"slider"}}}
                        .value=${s.wave_scale??a.wave_scale??8}
                        .label=${"Warp Intensity"}
                        .helper=${"How much the displacement distorts the streaks"}
                        @value-changed=${e=>this._updatePresetConfig("wave_scale",e.detail.value)}
                    ></ha-selector></div>`;case"shimmer":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.05,max:.8,step:.05,mode:"slider"}}}
                        .value=${s.highlight_width??a.highlight_width??.35}
                        .label=${"Highlight Width"}
                        .helper=${"Fraction of the sweep tile covered by the bright band"}
                        @value-changed=${e=>this._updatePresetConfig("highlight_width",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:-90,max:90,step:5,mode:"slider"}}}
                        .value=${s.angle??a.angle??30}
                        .label=${"Angle (degrees)"}
                        .helper=${"0° = horizontal sweep · 30° = diagonal · 90° = vertical"}
                        @value-changed=${e=>this._updatePresetConfig("angle",e.detail.value)}
                    ></ha-selector></div>`;case"level":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:0,max:100,step:1,mode:"slider"}}}
                        .value=${s.fill_pct??a.fill_pct??50}
                        .label=${"Fill Level (%)"}
                        .helper=${"0 = empty · 100 = full · supports state-based values via rules engine"}
                        @value-changed=${e=>this._updatePresetConfig("fill_pct",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{select:{options:[{value:"up",label:"Fill upward (bottom → top)"},{value:"down",label:"Fill downward (top → bottom)"},{value:"left",label:"Fill leftward (right → left)"},{value:"right",label:"Fill rightward (left → right)"}],mode:"dropdown"}}}
                        .value=${s.direction??a.direction??"up"}
                        .label=${"Fill Direction"}
                        @value-changed=${e=>this._updatePresetConfig("direction",e.detail.value)}
                    ></ha-selector></div>

                    <lcards-form-section header="Primary Wave" ?expanded=${true} .nested=${true}>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:0,max:20,step:.5,mode:"slider"}}}
                            .value=${s.wave_height??a.wave_height??4}
                            .label=${"Height (px)"}
                            .helper=${"0 = flat fill edge"}
                            @value-changed=${e=>this._updatePresetConfig("wave_height",e.detail.value)}
                        ></ha-selector></div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:1,max:16,step:1,mode:"slider"}}}
                            .value=${s.wave_count??a.wave_count??4}
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
                            .value=${s.wave2_height??a.wave2_height??0}
                            .label=${"Height (px)"}
                            .helper=${"0 = disabled"}
                            @value-changed=${e=>this._updatePresetConfig("wave2_height",e.detail.value)}
                        ></ha-selector></div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:1,max:20,step:1,mode:"slider"}}}
                            .value=${s.wave2_count??a.wave2_count??5}
                            .label=${"Count"}
                            @value-changed=${e=>this._updatePresetConfig("wave2_count",e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>

                    <lcards-form-section header="Sloshing" ?expanded=${false} .nested=${true}>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:0,max:1,step:.05,mode:"slider"}}}
                            .value=${s.slosh_amount??a.slosh_amount??0}
                            .label=${"Amount"}
                            .helper=${"0 = disabled · fluid tilts side-to-side as if in a vessel"}
                            @value-changed=${e=>this._updatePresetConfig("slosh_amount",e.detail.value)}
                        ></ha-selector></div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:.5,max:10,step:.5,mode:"slider"}}}
                            .value=${s.slosh_period??a.slosh_period??3}
                            .label=${"Period (s)"}
                            .helper=${"Seconds per complete slosh cycle"}
                            @value-changed=${e=>this._updatePresetConfig("slosh_period",e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>

                    <lcards-form-section header="Edge Glow" ?expanded=${false} .nested=${true}>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{boolean:{}}}
                            .value=${s.edge_glow??a.edge_glow??true}
                            .label=${"Enable"}
                            @value-changed=${e=>this._updatePresetConfig("edge_glow",e.detail.value)}
                        ></ha-selector></div>
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${"Glow Colour"}
                                .value=${s.edge_glow_color??a.edge_glow_color??"rgba(255,255,255,0.7)"}
                                @value-changed=${e=>this._updatePresetConfig("edge_glow_color",e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{number:{min:1,max:24,step:.5,mode:"slider"}}}
                            .value=${s.edge_glow_width??a.edge_glow_width??6}
                            .label=${"Glow Width (px)"}
                            .helper=${"Bloom spread radius · colour alpha controls intensity"}
                            @value-changed=${e=>this._updatePresetConfig("edge_glow_width",e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>`;case"scanlines":return t`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{select:{options:[{value:"horizontal",label:"Horizontal (lines run left↔right, scroll vertically)"},{value:"vertical",label:"Vertical (lines run top↕bottom, scroll horizontally)"}],mode:"dropdown"}}}
                        .value=${s.direction??a.direction??"horizontal"}
                        .label=${"Line Direction"}
                        @value-changed=${e=>this._updatePresetConfig("direction",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:2,max:20,step:.5,mode:"slider"}}}
                        .value=${s.line_spacing??a.line_spacing??4}
                        .label=${"Line Spacing (px)"}
                        @value-changed=${e=>this._updatePresetConfig("line_spacing",e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{number:{min:.5,max:8,step:.5,mode:"slider"}}}
                        .value=${s.line_width??a.line_width??1.5}
                        .label=${"Line Width"}
                        @value-changed=${e=>this._updatePresetConfig("line_width",e.detail.value)}
                    ></ha-selector></div>`;case"image":{const e=s.source??s.url??a.source??a.url??"",c=this._imageSrcMode??(e.startsWith("builtin:")?"asset":e.startsWith("media-source://")?"media":"custom"),d=this._getAvailableImages(),u=c==="custom"&&e.startsWith("http:")&&typeof location<"u"&&location.protocol==="https:",v=e.startsWith("media-source://")?{media_content_id:e,media_content_type:""}:void 0;return t`
                    <div class="row">
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:[{value:"asset",label:"Asset Library (builtin images & SVGs)"},{value:"custom",label:"Custom URL / Template"},{value:"media",label:"Browse HA Media"}]}}}
                            .value=${c}
                            .label=${"Image Source"}
                            @value-changed=${i=>{const n=i.detail.value;if(this._imageSrcMode=n,n==="asset"&&!e.startsWith("builtin:")){const h=this._getAvailableImages();h.length>0&&this._updatePresetConfig("source",h[0].value)}}}
                        ></ha-selector>
                    </div>

                    ${c==="asset"?t`
                        <div class="row">
                            <ha-selector .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:d}}}
                                .value=${d.some(i=>i.value===e)?e:((l=d[0])==null?void 0:l.value)??""}
                                .label=${"Built-in Image"}
                                .helper=${"Images and SVGs registered in the Asset Library"}
                                @value-changed=${i=>this._updatePresetConfig("source",i.detail.value)}
                            ></ha-selector>
                        </div>
                    `:c==="media"?t`
                        <div class="row">
                            <ha-selector .hass=${this.hass}
                                .selector=${{media:{accept:["image/*"]}}}
                                .value=${v}
                                .label=${"HA Media"}
                                .helper=${"Browse or upload an image via the Home Assistant media library"}
                                @value-changed=${i=>{var n;return this._updatePresetConfig("source",((n=i.detail.value)==null?void 0:n.media_content_id)??"")}}
                            ></ha-selector>
                        </div>
                    `:t`
                        <div class="row">
                            <ha-selector .hass=${this.hass}
                                .selector=${{text:{}}}
                                .value=${e}
                                .label=${"Image URL"}
                                .helper=${"Path to image: /local/images/room.jpg · https://… · or a template: {entity.attributes.entity_picture}"}
                                @value-changed=${i=>this._updatePresetConfig("source",i.detail.value)}
                            ></ha-selector>
                        </div>
                    `}

                    ${u?t`
                        <div class="row" style="padding:6px 8px;border-radius:4px;background:rgba(255,193,7,0.15);color:#ffa000;font-size:12px;line-height:1.4;">
                            http:// URLs will be blocked as mixed content when Home Assistant is served over HTTPS.
                            Use an https:// URL or a /local/ path instead.
                        </div>
                    `:""}

                    <div class="row">
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:[{value:"cover",label:"Cover (fill, may crop)"},{value:"contain",label:"Contain (fit, may letterbox)"},{value:"fill",label:"Fill (stretch to canvas)"}]}}}
                            .value=${s.size??a.size??"cover"}
                            .label=${"Size"}
                            .helper=${"How the image is scaled to fit inside the shape"}
                            @value-changed=${i=>this._updatePresetConfig("size",i.detail.value)}
                        ></ha-selector>
                    </div>

                    <div class="row">
                        <ha-selector .hass=${this.hass}
                            .selector=${{text:{}}}
                            .value=${s.position??a.position??"center"}
                            .label=${"Position"}
                            .helper=${'CSS background-position value, e.g. "center", "top left", "50% 20%"'}
                            @value-changed=${i=>this._updatePresetConfig("position",i.detail.value)}
                        ></ha-selector>
                    </div>

                    <div class="row">
                        <ha-selector .hass=${this.hass}
                            .selector=${{boolean:{}}}
                            .value=${s.repeat??a.repeat??false}
                            .label=${"Tile / Repeat"}
                            .helper=${"Tile the image across the shape area"}
                            @value-changed=${i=>this._updatePresetConfig("repeat",i.detail.value)}
                        ></ha-selector>
                    </div>`}case"circuit":return t``;default:return null}}};g(w,"LCARdSShapeTextureEditor");let b=w;customElements.get("lcards-shape-texture-editor")||customElements.define("lcards-shape-texture-editor",b);
//# sourceMappingURL=lcards-shape-texture-editor-D_8NJomk.js.map
