var u=Object.defineProperty;var d=(p,e)=>u(p,"name",{value:e,configurable:true});import{i as _,c as g,A as l,b as n}from"./lcards-main-DsZpib8R.js";import"./lcards-form-section-DzcFFL6H.js";import{L as $}from"./LCARdSBaseEditor-WMmF1vgw.js";import"./lcards-color-section-v2-CPBKD2jW.js";import"./lcards-padding-editor-CrjEg2k4.js";const m=["default","active","inactive","unavailable","zero","non_zero"],f=class f2 extends _{static get properties(){return{editor:{type:Object},config:{type:Object},basePath:{type:String},name:{type:String},inherits:{type:Boolean},zones:{type:Object},suggestedStates:{type:Array},omit:{type:Array}}}constructor(){super(),this.editor=null,this.config=null,this.basePath="",this.name="",this.inherits=false,this.zones=null,this.suggestedStates=m,this.omit=[]}static get styles(){return g`
            :host { display: block; }
        `}_has(e){var t,i,s;return(t=this.omit)!=null&&t.includes(e)?false:!!((s=(i=this.editor)==null?void 0:i._getSchemaForPath)!=null&&s.call(i,`${this.basePath}.${e}`))}_value(e){var t,i;return(i=(t=this.editor)==null?void 0:t._getConfigValue)==null?void 0:i.call(t,`${this.basePath}.${e}`)}_field(e,t){return this._has(e)?$.renderField(this.editor,`${this.basePath}.${e}`,t):l}_help(e,t,i="Inherits from defaults"){return this.inherits&&this._value(e)===void 0?i:t}_renderFit(){var r;if(!this._has("fit"))return l;const e=this._value("fit"),t=e===true||e&&typeof e=="object",i=e&&typeof e=="object"?e:{},s=(r=this.editor)==null?void 0:r.hass;return n`
            <ha-selector
                .hass=${s}
                .selector=${{boolean:{}}}
                .value=${t}
                .label=${"Fit text to its zone"}
                .helper=${this._help("fit","Shrink, then wrap, then cut text that is too long for its zone. Ignored with Stretch Width.","Inherits from defaults (off)")}
                @value-changed=${o=>this._setFit(o.detail.value?t?e:true:void 0)}>
            </ha-selector>
            ${t?n`
                <ha-selector .hass=${s} .selector=${{number:{mode:"box",min:1,unit_of_measurement:"px"}}}
                    .value=${i.min_font_size} .label=${"Smallest font size"}
                    .helper=${"Blank: 60% of the font size, not below 8"}
                    @value-changed=${o=>this._setFitOption("min_font_size",o.detail.value)}>
                </ha-selector>
                <ha-selector .hass=${s} .selector=${{number:{mode:"box",min:1,step:1}}}
                    .value=${i.max_lines} .label=${"Most lines"}
                    .helper=${"Blank: 2. 1 shrinks the text without wrapping it"}
                    @value-changed=${o=>this._setFitOption("max_lines",o.detail.value)}>
                </ha-selector>
                <ha-selector .hass=${s}
                    .selector=${{select:{mode:"dropdown",options:[{value:"ellipsis",label:"End with an ellipsis"},{value:"clip",label:"Cut it off"}]}}}
                    .value=${i.overflow??"ellipsis"} .label=${"Still too long"}
                    @value-changed=${o=>this._setFitOption("overflow",o.detail.value==="ellipsis"?void 0:o.detail.value)}>
                </ha-selector>
            `:l}
        `}_setFit(e){var t,i;(i=(t=this.editor)==null?void 0:t._setConfigValue)==null||i.call(t,`${this.basePath}.fit`,e)}_setFitOption(e,t){const i=this._value("fit"),s={...i&&typeof i=="object"?i:{}};t==null||t===""?delete s[e]:s[e]=t,this._setFit(Object.keys(s).length?s:true)}render(){var r;const e=this.basePath,t=this.name?this.name.charAt(0).toUpperCase()+this.name.slice(1):"",i=this.zones&&Object.keys(this.zones).length>1?this.zones:null,s=d(o=>o.some(a=>this._has(a)),"any");return n`
            ${this._field("show",{label:t?`Show ${t}`:"Show"})}
            ${this._field("content",{label:"Content",helper:"Text content: supports templates like {entity.state}"})}
            ${this._field("display_format",{label:"Display Format",helper:this._help("display_format","How entity state tokens are rendered: friendly, raw, parts, or unit","Inherits from defaults: friendly = translated by Home Assistant, raw = actual state, parts = value+unit, unit = unit only")})}
            ${this._field("position",{label:"Position",helper:"Where to display this text"})}

            ${i?n`
                <ha-selector
                    .hass=${(r=this.editor)==null?void 0:r.hass}
                    .selector=${{select:{mode:"dropdown",options:Object.entries(i).map(([o,a])=>({value:o,label:typeof a=="string"&&a?a:o.replace(/_/g," ").replace(/\b\w/g,h=>h.toUpperCase())}))}}}
                    .value=${this._value("zone")||Object.keys(i)[0]}
                    .label=${"Zone"}
                    .helper=${"Which named layout zone this text field is routed to"}
                    @value-changed=${o=>{var a,h;return(h=(a=this.editor)==null?void 0:a._setConfigValue)==null?void 0:h.call(a,`${e}.zone`,o.detail.value)}}>
                </ha-selector>
            `:l}

            ${s(["font_weight","font_family","font_size","letter_spacing","fit"])?n`
                <lcards-form-section header="Font" description="Set font family, weight, size and spacing" icon="mdi:format-font"
                    ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    ${this._field("font_family",{label:"Font Family",helper:this._help("font_family","")})}
                    ${this._field("font_weight",{label:"Font Weight",helper:this._help("font_weight","")})}
                    ${this._field("font_size",{label:"Font Size (px)",helper:this._has("font_size_percent")?this._help("font_size","Absolute font size in px: overrides Font Size % when set explicitly","Inherits from defaults: use this OR Font Size %, not both"):this._help("font_size","")})}
                    ${this._field("letter_spacing",{label:"Letter Spacing",helper:this._help("letter_spacing","")})}
                    ${this._renderFit()}

                    ${s(["font_size_percent","cap_height_ratio","stretch"])?n`
                        <lcards-form-section header="Fill Sizing"
                            description="Scale text to fill the card height. Use Font Size % + Cap Height Ratio instead of Font Size (px)."
                            icon="mdi:arrow-expand-vertical"
                            ?expanded=${!!(this._value("font_size_percent")||this._value("cap_height_ratio")||this._value("stretch"))}
                            ?outlined=${false} headerLevel="6" ?compact=${true}>
                            ${this._field("font_size_percent",{label:"Font Size (% of height)",helper:"Scales font so cap glyphs fill this % of the card height (when Cap Height Ratio is also set). Use instead of Font Size (px)."})}
                            ${this._field("cap_height_ratio",{label:"Cap Height Ratio",helper:"Ratio of visible cap glyph height to the font em-square. Antonio ≈ 0.86. Adjust per font until caps fill the box. Has no effect without Font Size %."})}
                            ${this._field("stretch",{label:"Stretch Width",helper:"Stretch/compress glyphs to fill a fraction of the available width. true or 1 = 100%, 0.8 = 80%"})}
                        </lcards-form-section>
                    `:l}
                </lcards-form-section>
            `:l}

            ${s(["anchor","baseline","text_transform","rotation"])?n`
                <lcards-form-section header="Alignment" description="Text transform and rotation, and anchor and baseline where the card takes them"
                    icon="mdi:format-align-left" ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    ${this._field("anchor",{label:"Anchor",helper:this._help("anchor","Text anchor (start/middle/end)")})}
                    ${this._field("baseline",{label:"Baseline",helper:this._help("baseline","Baseline alignment")})}
                    ${this._field("text_transform",{label:"Text Transform",helper:this._help("text_transform","Text transformation")})}
                    ${this._field("rotation",{label:"Rotation",helper:this._help("rotation","Rotation angle in degrees","Inherits from defaults (0°)")})}
                </lcards-form-section>
            `:l}

            ${this._has("padding")?n`
                <lcards-form-section header="Padding" description="Override default padding settings" icon="mdi:move-resize"
                    ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    <lcards-padding-editor
                        .editor=${this.editor}
                        .config=${this.config}
                        path="${e}.padding"
                        label="${t||"Field"} Padding"
                        helper="${this._help("padding","Custom padding for this field")}">
                    </lcards-padding-editor>
                </lcards-form-section>
            `:l}

            ${this._has("background")?n`
                <lcards-form-section header="Background" description="Text background rectangle (bar-break effect)" icon="mdi:rectangle"
                    ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    <lcards-color-section-v2
                        .editor=${this.editor}
                        .config=${this.config}
                        basePath="${e}.background"
                        header="Background Colour"
                        description="${this.inherits?"Override default background colour per state":"Background colour for different entity states"}"
                        .suggestedStates=${this.suggestedStates}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>
                    ${this._field("background_padding",{label:"Background Padding",helper:this._help("background_padding","")})}
                    ${this._field("background_radius",{label:"Background Corner Radius",helper:this._help("background_radius","")})}
                    ${this._field("background_width",{label:"Background Width (Fixed)",helper:"Exact px width: overrides auto-sizing. Text overflows if content is wider."})}
                    ${this._field("background_min_width",{label:"Background Min Width",helper:"Auto-sizes with text but never shrinks below this value, so safe for dynamic content."})}
                </lcards-form-section>
            `:l}

            ${this._has("color")?n`
                <lcards-color-section-v2
                    .editor=${this.editor}
                    .config=${this.config}
                    basePath="${e}.color"
                    header="Field Colours"
                    description="Override default colour settings"
                    .suggestedStates=${this.suggestedStates}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            `:l}
        `}};d(f,"LCARdSTextFieldEditor");let c=f;customElements.get("lcards-text-field-editor")||customElements.define("lcards-text-field-editor",c);
//# sourceMappingURL=lcards-text-field-editor-B4LKfFul.js.map
