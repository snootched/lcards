var _=Object.defineProperty;var u=(F,e)=>_(F,"name",{value:e,configurable:true});import{i as $,a as v,b as n,c as w,l}from"./lcards-main-C10Twmlb.js";import{e as y,L as o}from"./studio-dialog-styles-C5BrIaK5.js";import"./lcards-form-section-DSoN9OMH.js";import"./lcards-color-section-v2-Gczjko6d.js";import"./lcards-rules-dashboard-BJnHLXoz.js";const g=class g2 extends ${static get properties(){return{editor:{type:Object},text:{type:Object},hass:{type:Object},availableZones:{type:Object},componentTextFields:{type:Array},_expandedFields:{type:Object,state:true},_showAddDialog:{type:Boolean,state:true},_newFieldName:{type:String,state:true}}}constructor(){super(),this.editor=null,this.text={},this.hass=null,this.availableZones=null,this.componentTextFields=null,this._expandedFields={},this._showAddDialog=false,this._newFieldName=""}updated(e){super.updated(e),e.has("text")&&this.requestUpdate()}static get styles(){return[y,v`
                :host {
                    display: block;
                }

                /* Add Dialog */
                .add-dialog {
                    background: var(--card-background-color);
                    border: var(--ha-border-width-md) solid var(--divider-color);
                    border-radius: var(--ha-card-border-radius, 12px);
                    padding: 16px;
                    margin-top: 12px;
                }

                .add-dialog-header {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--primary-text-color);
                    margin-bottom: 12px;
                }

                .add-dialog-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .quick-add-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .quick-add-buttons ha-button {
                    flex: 1;
                    min-width: 100px;
                }

                .custom-field-input {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    padding-top: 8px;
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                }

                .custom-field-input ha-input {
                    flex: 1;
                }

                .empty-state {
                    text-align: center;
                    padding: 32px 16px;
                    color: var(--secondary-text-color);
                }

                .empty-state ha-icon {
                    font-size: 48px;
                    opacity: 0.3;
                    margin-bottom: 12px;
                    display: block;
                }

                .inherited-hint {
                    font-size: 11px;
                    color: var(--secondary-text-color);
                    font-style: italic;
                    margin-top: 4px;
                    padding: 0 8px;
                }

                /* Action buttons - ensure visibility */
                .editor-item-actions ha-icon-button {
                    --ha-icon-button-size: 40px;
                    --mdc-icon-size: 20px;
                    color: var(--primary-text-color);
                }

                .editor-item-actions ha-icon-button:hover {
                    color: var(--error-color);
                }
            `]}render(){const e=Object.keys(this.text).filter(t=>t!=="default");return n`
            <!-- Text Defaults Section -->
            <lcards-form-section
                header="Text Defaults"
                description="Default styling inherited by all text fields"
                icon="mdi:format-text"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                ${this._renderDefaultsConfig()}
            </lcards-form-section>

            <!-- Text Fields List -->
            <lcards-form-section
                header="Text Fields"
                description="Individual text fields (inherit from defaults)"
                icon="mdi:format-list-text"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <!-- Add Button -->
                <ha-button class="add-button" @click=${this._toggleAddDialog}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Text Field
                </ha-button>

                <!-- Add Dialog -->
                ${this._showAddDialog?this._renderAddDialog():""}

                ${e.length===0?n`
                    <div class="empty-state">
                        <ha-icon icon="mdi:text-box-outline"></ha-icon>
                        <p>No text fields defined. Click "Add Text Field" to create one.</p>
                    </div>
                `:n`
                    <div class="editor-list">
                        ${e.map(t=>this._renderFieldItem(t))}
                    </div>
                `}
            </lcards-form-section>
        `}_renderDefaultsConfig(){return n`
            <!-- Display Format (card-wide default) -->
            ${o.renderField(this.editor,"text.default.display_format",{label:"Default Display Format",helper:"How {entity.state} tokens are rendered across all fields: friendly = HA-translated, raw = actual state, parts = value+unit, unit = unit only"})}

            <!-- Font Section -->
            <lcards-form-section
                header="Font"
                description="Default font settings for all text fields"
                icon="mdi:format-font"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                ${o.renderField(this.editor,"text.default.font_size",{label:"Font Size"})}

                ${o.renderField(this.editor,"text.default.font_weight",{label:"Font Weight"})}

                ${o.renderField(this.editor,"text.default.font_family",{label:"Font Family"})}
            </lcards-form-section>

            <!-- Alignment Section -->
            <lcards-form-section
                header="Alignment"
                description="Anchor, baseline, text transform, and rotation settings"
                icon="mdi:format-align-left"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                ${o.renderField(this.editor,"text.default.anchor",{label:"Anchor",helper:"Text anchor (start/middle/end)"})}

                ${o.renderField(this.editor,"text.default.baseline",{label:"Baseline",helper:"Baseline alignment for text"})}

                ${o.renderField(this.editor,"text.default.text_transform",{label:"Text Transform",helper:"Text transformation (uppercase/lowercase/capitalize)"})}

                ${o.renderField(this.editor,"text.default.rotation",{label:"Rotation",helper:"Default rotation angle in degrees (0 = no rotation)"})}
            </lcards-form-section>

            <!-- Padding Section -->
            <lcards-form-section
                header="Padding"
                description="Padding around text content"
                icon="mdi:move-resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-padding-editor
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.default.padding"
                    label="Default Text Padding"
                    helper="Spacing around text fields">
                </lcards-padding-editor>
            </lcards-form-section>

            <!-- Background Section (defaults) -->
            <lcards-form-section
                header="Background"
                description="Default text background (bar-break effect)"
                icon="mdi:rectangle"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-color-section-v2
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="text.default.background"
                    header="Background Colour"
                    description="Background colour for different entity states"
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                ${o.renderField(this.editor,"text.default.background_padding",{label:"Background Padding"})}

                ${o.renderField(this.editor,"text.default.background_radius",{label:"Background Corner Radius"})}

                ${o.renderField(this.editor,"text.default.background_width",{label:"Background Width (Fixed)",helper:"Exact px width: overrides auto-sizing. Text overflows if content is wider."})}

                ${o.renderField(this.editor,"text.default.background_min_width",{label:"Background Min Width",helper:"Auto-sizes with text but never shrinks below this value, so safe for dynamic content."})}
            </lcards-form-section>

            <!-- Text Colors -->
            <lcards-color-section-v2
                .editor=${this.editor}
                .config=${this.editor.config}
                basePath="text.default.color"
                header="Text Colours"
                description="Default text colours for different states"
                .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
                ?allowCustomStates=${true}
                ?expanded=${false}>
            </lcards-color-section-v2>
        `}_renderFieldItem(e){const t=this.text[e]||{},i=this._expandedFields[e]||false,a=t.content||e,d=a.length>50?a.substring(0,50)+"...":a;return n`
            <div class="editor-item" ?expanded=${i}>
                <div class="editor-item-header" @click=${()=>this._toggleField(e)}>
                    <ha-icon class="drag-handle" icon="mdi:drag"></ha-icon>
                    <ha-icon class="editor-item-icon" icon="mdi:format-text"></ha-icon>
                    <div class="editor-item-info">
                        <div class="editor-item-title">${e}</div>
                        <div class="editor-item-subtitle">${d}</div>
                    </div>
                    <div class="editor-item-actions" @click=${s=>s.stopPropagation()}>
                        <ha-icon-button
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                            @click=${s=>this._deleteField(s,e)}>
                        </ha-icon-button>
                    </div>
                    <ha-icon
                        class="expand-icon ${i?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>
                ${i?n`
                    <div class="editor-item-content">
                        ${this._renderFieldConfig(e,t)}
                    </div>
                `:""}
            </div>
        `}_renderFieldConfig(e,t){var a,d,s,m,b;const i=this.text.default!==void 0;return n`
            <!-- Show Toggle -->
            ${o.renderField(this.editor,`text.${e}.show`,{label:`Show ${e.charAt(0).toUpperCase()+e.slice(1)}`})}

            <!-- Content -->
            ${o.renderField(this.editor,`text.${e}.content`,{label:"Content",helper:"Text content - supports templates like {entity.state}"})}

            <!-- Display Format -->
            ${o.renderField(this.editor,`text.${e}.display_format`,{label:"Display Format",helper:i&&!t.display_format?"Inherits from defaults: friendly = HA-translated, raw = actual state, parts = value+unit, unit = unit only":"How entity state tokens are rendered: friendly, raw, parts, or unit"})}

            <!-- Position -->
            ${o.renderField(this.editor,`text.${e}.position`,{label:"Position",helper:"Where to display this text on the card"})}

            <!-- Zone selector (only shown when >1 named zone is available) -->
            ${this.availableZones&&Object.keys(this.availableZones).length>1?n`
                <ha-selector
                    .hass=${(a=this.editor)==null?void 0:a.hass}
                    .selector=${{select:{mode:"dropdown",options:Object.entries(this.availableZones).map(([c,r])=>({value:c,label:typeof r=="string"&&r?r:c.replace(/_/g," ").replace(/\b\w/g,h=>h.toUpperCase())}))}}}
                    .value=${((b=(m=(s=(d=this.editor)==null?void 0:d.config)==null?void 0:s.text)==null?void 0:m[e])==null?void 0:b.zone)||Object.keys(this.availableZones)[0]}
                    .label=${"Zone"}
                    .helper=${"Which named layout zone this text field is routed to"}
                    @value-changed=${c=>{var r,h;return(h=(r=this.editor)==null?void 0:r._setConfigValue)==null?void 0:h.call(r,`text.${e}.zone`,c.detail.value)}}>
                </ha-selector>
            `:""}

            <!-- Font Section -->
            <lcards-form-section
                header="Font"
                description="Set font family, weight, and sizing"
                icon="mdi:format-font"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                ${o.renderField(this.editor,`text.${e}.font_weight`,{label:"Font Weight",helper:i&&!t.font_weight?"Inherits from defaults":""})}

                ${o.renderField(this.editor,`text.${e}.font_family`,{label:"Font Family",helper:i&&!t.font_family?"Inherits from defaults":""})}

                <!-- Fixed size -->
                ${o.renderField(this.editor,`text.${e}.font_size`,{label:"Font Size (px)",helper:i&&!t.font_size?"Inherits from defaults: use this OR Font Size %, not both":"Absolute font size in px: overrides Font Size % when set explicitly"})}

                <!-- Fill-sizing group -->
                <lcards-form-section
                    header="Fill Sizing"
                    description="Scale text to fill the card height. Use Font Size % + Cap Height Ratio instead of Font Size (px)."
                    icon="mdi:arrow-expand-vertical"
                    ?expanded=${!!(t.font_size_percent||t.cap_height_ratio||t.stretch)}
                    ?outlined=${false}
                    headerLevel="6"
                    ?compact=${true}>

                    ${o.renderField(this.editor,`text.${e}.font_size_percent`,{label:"Font Size (% of height)",helper:"Scales font so cap glyphs fill this % of the card height (when Cap Height Ratio is also set). Use instead of Font Size (px)."})}

                    ${o.renderField(this.editor,`text.${e}.cap_height_ratio`,{label:"Cap Height Ratio",helper:"Ratio of visible cap glyph height to the font em-square. Antonio ≈ 0.86. Adjust per font until caps fill the box. Has no effect without Font Size %."})}

                    ${o.renderField(this.editor,`text.${e}.stretch`,{label:"Stretch Width",helper:"Stretch/compress glyphs to fill a fraction of the available width. true or 1 = 100%, 0.8 = 80%"})}

                </lcards-form-section>

            </lcards-form-section>

            <!-- Alignment Section -->
            <lcards-form-section
                header="Alignment"
                description="Override anchor/baseline, text transform, and rotation"
                icon="mdi:format-align-left"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                ${o.renderField(this.editor,`text.${e}.anchor`,{label:"Anchor",helper:i&&!t.anchor?"Inherits from defaults":"Text anchor (start/middle/end)"})}

                ${o.renderField(this.editor,`text.${e}.baseline`,{label:"Baseline",helper:i&&!t.baseline?"Inherits from defaults":"Baseline alignment"})}

                ${o.renderField(this.editor,`text.${e}.text_transform`,{label:"Text Transform",helper:i&&!t.text_transform?"Inherits from defaults":"Text transformation"})}

                ${o.renderField(this.editor,`text.${e}.rotation`,{label:"Rotation",helper:i&&!t.rotation?"Inherits from defaults (0°)":"Rotation angle in degrees"})}
            </lcards-form-section>

            <!-- Padding Section -->
            <lcards-form-section
                header="Padding"
                description="Override default padding settings"
                icon="mdi:move-resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                <lcards-padding-editor
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    path="text.${e}.padding"
                    label="${e} Padding"
                    helper="${i&&!t.padding?"Inherits from defaults":"Custom padding for this field"}">
                </lcards-padding-editor>
            </lcards-form-section>

            <!-- Background Section -->
            <lcards-form-section
                header="Background"
                description="Text background rectangle (bar-break effect)"
                icon="mdi:rectangle"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="6"
                ?compact=${true}>

                <lcards-color-section-v2
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="text.${e}.background"
                    header="Background Colour"
                    description="${i?"Override default background colour per state":"Background colour for different entity states"}"
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                ${o.renderField(this.editor,`text.${e}.background_padding`,{label:"Background Padding",helper:i&&t.background_padding===void 0?"Inherits from defaults":""})}

                ${o.renderField(this.editor,`text.${e}.background_radius`,{label:"Background Corner Radius",helper:i&&t.background_radius===void 0?"Inherits from defaults":""})}

                ${o.renderField(this.editor,`text.${e}.background_width`,{label:"Background Width (Fixed)",helper:"Exact px width: overrides auto-sizing. Text overflows if content is wider."})}

                ${o.renderField(this.editor,`text.${e}.background_min_width`,{label:"Background Min Width",helper:"Auto-sizes with text but never shrinks below this value, so safe for dynamic content."})}
            </lcards-form-section>

            <!-- Field Colors -->
            <lcards-color-section-v2
                .editor=${this.editor}
                .config=${this.editor.config}
                basePath="text.${e}.color"
                header="Field Colours"
                description="Override default colour settings"
                .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
                ?allowCustomStates=${true}
                ?expanded=${false}>
            </lcards-color-section-v2>
        `}_renderAddDialog(){const e=Object.keys(this.text).filter(d=>d!=="default"),i=["name","label","state"].filter(d=>!e.includes(d)),a=this.componentTextFields?this.componentTextFields.filter(d=>!e.includes(d)):[];return n`
            <div class="add-dialog">
                <div class="add-dialog-header">Add Text Field</div>
                <div class="add-dialog-content">

                    <!-- Component preset fields (shown only in component mode) -->
                    ${a.length>0?n`
                        <div>
                            <div class="field-label" style="color: var(--accent-color); font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                                Component fields
                            </div>
                            <div class="quick-add-buttons">
                                ${a.map(d=>n`
                                    <ha-button
                                        @click=${()=>this._addField(d)}>
                                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                        ${d}
                                    </ha-button>
                                `)}
                            </div>
                        </div>
                    `:""}

                    <!-- Generic quick-add fields -->
                    ${i.length>0?n`
                        <div>
                            <div class="field-label" style="font-size: 12px; margin-bottom: 6px;">Quick Add</div>
                            <div class="quick-add-buttons">
                                ${i.map(d=>n`
                                    <ha-button @click=${()=>this._addField(d)}>
                                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                        ${d}
                                    </ha-button>
                                `)}
                            </div>
                        </div>
                    `:""}

                    <div class="custom-field-input">
                        <ha-input
                            .label=${"Custom Field Name"}
                            .hint=${"Alphanumeric and underscore only"}
                            .value=${this._newFieldName}
                            @input=${d=>this._newFieldName=d.target.value}
                            @keydown=${d=>{d.key==="Enter"&&this._isValidFieldName(this._newFieldName)&&this._addField(this._newFieldName)}}>
                        </ha-input>
                        <ha-button
                            variant="brand"
                            @click=${()=>this._addField(this._newFieldName)}
                            ?disabled=${!this._isValidFieldName(this._newFieldName)}>
                            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                            Add
                        </ha-button>
                    </div>

                    <ha-button appearance="plain" @click=${this._toggleAddDialog}>
                        Cancel
                    </ha-button>
                </div>
            </div>
        `}_toggleField(e){this._expandedFields={...this._expandedFields,[e]:!this._expandedFields[e]}}_toggleAddDialog(){this._showAddDialog=!this._showAddDialog,this._showAddDialog||(this._newFieldName="")}_isValidFieldName(e){return!!e&&/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(e)}_addField(e){if(!this._isValidFieldName(e))return;if(this.text[e]){w({title:"Field already exists",message:`This card already has a "${e}" text field.`});return}let t;switch(e.toLowerCase()){case"name":t="[[[return entity.attributes.friendly_name || entity.entity_id]]]";break;case"state":t="{entity.state}";break;case"label":t=`[[[ return (((Math.floor(Math.random() * 256).toString(16).padStart(2, '0')) + "-" + (Math.floor(Math.random() * 4096).toString(16).padStart(3, '0')))) ]]]`;break;default:t=e}const i={content:t,show:true},a={...this.text,[e]:i};this._expandedFields={...this._expandedFields,[e]:true},this._showAddDialog=false,this._newFieldName="",this._emitChange(a)}_deleteField(e,t){e.stopPropagation(),e.preventDefault(),l.debug(`[MultiTextEditorV2] Deleting field: ${t}`);const i={...this.text};delete i[t],delete this._expandedFields[t],this._emitChange(i)}_updateField(e,t,i){const a={...this.text};a[e]={...a[e],[t]:i},this._emitChange(a)}_emitChange(e){l.info("[MultiTextEditorV2] _emitChange called"),l.debug("[MultiTextEditorV2] New text value:",e),l.debug("[MultiTextEditorV2] Event will bubble:",true,"composed:",true),this.text=e;const t=new CustomEvent("text-changed",{detail:{value:e},bubbles:true,composed:true});l.info("[MultiTextEditorV2] Dispatching text-changed event"),this.dispatchEvent(t),this.requestUpdate()}};u(g,"LCARdSMultiTextEditorV2");let p=g;customElements.get("lcards-multi-text-editor-v2")||customElements.define("lcards-multi-text-editor-v2",p);const x=class x2 extends ${static get properties(){return{hass:{type:Object},actions:{type:Object}}}constructor(){super(),this.hass=null,this.actions={}}static get styles(){return v`
            :host {
                display: block;
            }

            .action-section {
                margin-bottom: var(--lcards-section-spacing, 16px);
            }
        `}render(){const e=this.actions.tap_action||{action:"none"},t=this.actions.hold_action||{action:"none"},i=this.actions.double_tap_action||{action:"none"};return n`
            <div class="action-section">
                <lcards-form-section
                    header="Tap Action"
                    icon="mdi:gesture-tap"
                    description="Action to perform when tapped (default: none)"
                    ?expanded=${true}
                    ?outlined=${true}
                    headerLevel="5">

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ui_action:{}}}
                        .value=${e}
                        @value-changed=${a=>this._handleActionChange("tap_action",a)}>
                    </ha-selector>
                </lcards-form-section>
            </div>

            <div class="action-section">
                <lcards-form-section
                    header="Hold Action"
                    icon="mdi:gesture-tap-hold"
                    description="Action to perform when held (default: none)"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="5">

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ui_action:{}}}
                        .value=${t}
                        @value-changed=${a=>this._handleActionChange("hold_action",a)}>
                    </ha-selector>
                </lcards-form-section>
            </div>

            <div class="action-section">
                <lcards-form-section
                    header="Double-Tap Action"
                    icon="mdi:gesture-double-tap"
                    description="Action to perform when double-tapped (default: none)"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="5">

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ui_action:{}}}
                        .value=${i}
                        @value-changed=${a=>this._handleActionChange("double_tap_action",a)}>
                    </ha-selector>
                </lcards-form-section>
            </div>
        `}_handleActionChange(e,t){t.stopPropagation();const i=t.detail.value,a={...this.actions};(i==null?void 0:i.action)==="none"?delete a[e]:a[e]=i,this.actions=a,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:a},bubbles:true,composed:true}))}};u(x,"LCARdSMultiActionEditor");let f=x;customElements.get("lcards-multi-action-editor")||customElements.define("lcards-multi-action-editor",f);
//# sourceMappingURL=lcards-multi-action-editor-BFaPObUK.js.map
