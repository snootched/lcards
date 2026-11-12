var u=Object.defineProperty;var h=(p,e)=>u(p,"name",{value:e,configurable:true});import{i as g,a as _,A as a,b as o}from"./lcards-main-C148JfkA.js";import"./lcards-form-section-BK3OqcgA.js";import{L as m}from"./LCARdSBaseEditor-B4auBUbY.js";import"./lcards-color-section-v2-C5igfe56.js";import"./lcards-padding-editor-4S4gFB_Y.js";const $=["default","active","inactive","unavailable","zero","non_zero"],c=class c2 extends g{static get properties(){return{editor:{type:Object},config:{type:Object},basePath:{type:String},name:{type:String},inherits:{type:Boolean},zones:{type:Object},suggestedStates:{type:Array},omit:{type:Array}}}constructor(){super(),this.editor=null,this.config=null,this.basePath="",this.name="",this.inherits=false,this.zones=null,this.suggestedStates=$,this.omit=[]}static get styles(){return _`
            :host { display: block; }
        `}_has(e){var t,i,r;return(t=this.omit)!=null&&t.includes(e)?false:!!((r=(i=this.editor)==null?void 0:i._getSchemaForPath)!=null&&r.call(i,`${this.basePath}.${e}`))}_value(e){var t,i;return(i=(t=this.editor)==null?void 0:t._getConfigValue)==null?void 0:i.call(t,`${this.basePath}.${e}`)}_field(e,t){return this._has(e)?m.renderField(this.editor,`${this.basePath}.${e}`,t):a}_help(e,t,i="Inherits from defaults"){return this.inherits&&this._value(e)===void 0?i:t}render(){var f;const e=this.basePath,t=this.name?this.name.charAt(0).toUpperCase()+this.name.slice(1):"",i=this.zones&&Object.keys(this.zones).length>1?this.zones:null,r=h(n=>n.some(s=>this._has(s)),"any");return o`
            ${this._field("show",{label:t?`Show ${t}`:"Show"})}
            ${this._field("content",{label:"Content",helper:"Text content: supports templates like {entity.state}"})}
            ${this._field("display_format",{label:"Display Format",helper:this._help("display_format","How entity state tokens are rendered: friendly, raw, parts, or unit","Inherits from defaults: friendly = translated by Home Assistant, raw = actual state, parts = value+unit, unit = unit only")})}
            ${this._field("position",{label:"Position",helper:"Where to display this text"})}

            ${i?o`
                <ha-selector
                    .hass=${(f=this.editor)==null?void 0:f.hass}
                    .selector=${{select:{mode:"dropdown",options:Object.entries(i).map(([n,s])=>({value:n,label:typeof s=="string"&&s?s:n.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}))}}}
                    .value=${this._value("zone")||Object.keys(i)[0]}
                    .label=${"Zone"}
                    .helper=${"Which named layout zone this text field is routed to"}
                    @value-changed=${n=>{var s,l;return(l=(s=this.editor)==null?void 0:s._setConfigValue)==null?void 0:l.call(s,`${e}.zone`,n.detail.value)}}>
                </ha-selector>
            `:a}

            ${r(["font_weight","font_family","font_size","letter_spacing"])?o`
                <lcards-form-section header="Font" description="Set font family, weight, size and spacing" icon="mdi:format-font"
                    ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    ${this._field("font_family",{label:"Font Family",helper:this._help("font_family","")})}
                    ${this._field("font_weight",{label:"Font Weight",helper:this._help("font_weight","")})}
                    ${this._field("font_size",{label:"Font Size (px)",helper:this._has("font_size_percent")?this._help("font_size","Absolute font size in px: overrides Font Size % when set explicitly","Inherits from defaults: use this OR Font Size %, not both"):this._help("font_size","")})}
                    ${this._field("letter_spacing",{label:"Letter Spacing",helper:this._help("letter_spacing","")})}

                    ${r(["font_size_percent","cap_height_ratio","stretch"])?o`
                        <lcards-form-section header="Fill Sizing"
                            description="Scale text to fill the card height. Use Font Size % + Cap Height Ratio instead of Font Size (px)."
                            icon="mdi:arrow-expand-vertical"
                            ?expanded=${!!(this._value("font_size_percent")||this._value("cap_height_ratio")||this._value("stretch"))}
                            ?outlined=${false} headerLevel="6" ?compact=${true}>
                            ${this._field("font_size_percent",{label:"Font Size (% of height)",helper:"Scales font so cap glyphs fill this % of the card height (when Cap Height Ratio is also set). Use instead of Font Size (px)."})}
                            ${this._field("cap_height_ratio",{label:"Cap Height Ratio",helper:"Ratio of visible cap glyph height to the font em-square. Antonio ≈ 0.86. Adjust per font until caps fill the box. Has no effect without Font Size %."})}
                            ${this._field("stretch",{label:"Stretch Width",helper:"Stretch/compress glyphs to fill a fraction of the available width. true or 1 = 100%, 0.8 = 80%"})}
                        </lcards-form-section>
                    `:a}
                </lcards-form-section>
            `:a}

            ${r(["anchor","baseline","text_transform","rotation"])?o`
                <lcards-form-section header="Alignment" description="Text transform and rotation, and anchor and baseline where the card takes them"
                    icon="mdi:format-align-left" ?expanded=${false} ?outlined=${true} headerLevel="6" ?compact=${true}>
                    ${this._field("anchor",{label:"Anchor",helper:this._help("anchor","Text anchor (start/middle/end)")})}
                    ${this._field("baseline",{label:"Baseline",helper:this._help("baseline","Baseline alignment")})}
                    ${this._field("text_transform",{label:"Text Transform",helper:this._help("text_transform","Text transformation")})}
                    ${this._field("rotation",{label:"Rotation",helper:this._help("rotation","Rotation angle in degrees","Inherits from defaults (0°)")})}
                </lcards-form-section>
            `:a}

            ${this._has("padding")?o`
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
            `:a}

            ${this._has("background")?o`
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
            `:a}

            ${this._has("color")?o`
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
            `:a}
        `}};h(c,"LCARdSTextFieldEditor");let d=c;customElements.get("lcards-text-field-editor")||customElements.define("lcards-text-field-editor",d);
//# sourceMappingURL=lcards-text-field-editor-DKKzuEoV.js.map
