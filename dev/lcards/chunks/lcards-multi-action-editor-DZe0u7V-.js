var x=Object.defineProperty;var r=(g,e)=>x(g,"name",{value:e,configurable:true});import{i as f,a as m,b as o,e as b,l as s}from"./lcards-main-C148JfkA.js";import{e as v,L as n}from"./LCARdSBaseEditor-B4auBUbY.js";import"./lcards-form-section-BK3OqcgA.js";import"./lcards-color-section-v2-C5igfe56.js";import"./lcards-padding-editor-4S4gFB_Y.js";import"./lcards-text-field-editor-DKKzuEoV.js";const u=class u2 extends f{static get properties(){return{editor:{type:Object},text:{type:Object},hass:{type:Object},availableZones:{type:Object},componentTextFields:{type:Array},_expandedFields:{type:Object,state:true},_showAddDialog:{type:Boolean,state:true},_newFieldName:{type:String,state:true}}}constructor(){super(),this.editor=null,this.text={},this.hass=null,this.availableZones=null,this.componentTextFields=null,this._expandedFields={},this._showAddDialog=false,this._newFieldName=""}updated(e){super.updated(e),e.has("text")&&this.requestUpdate()}static get styles(){return[v,m`
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
            `]}render(){const e=Object.keys(this.text).filter(t=>t!=="default");return o`
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

                ${e.length===0?o`
                    <div class="empty-state">
                        <ha-icon icon="mdi:text-box-outline"></ha-icon>
                        <p>No text fields defined. Click "Add Text Field" to create one.</p>
                    </div>
                `:o`
                    <div class="editor-list">
                        ${e.map(t=>this._renderFieldItem(t))}
                    </div>
                `}
            </lcards-form-section>
        `}_renderDefaultsConfig(){return o`
            <!-- Display Format (card-wide default) -->
            ${n.renderField(this.editor,"text.default.display_format",{label:"Default Display Format",helper:"How {entity.state} tokens are rendered across all fields: friendly = translated by Home Assistant, raw = actual state, parts = value+unit, unit = unit only"})}

            <!-- Font Section -->
            <lcards-form-section
                header="Font"
                description="Default font settings for all text fields"
                icon="mdi:format-font"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                ${n.renderField(this.editor,"text.default.font_size",{label:"Font Size"})}

                ${n.renderField(this.editor,"text.default.font_weight",{label:"Font Weight"})}

                ${n.renderField(this.editor,"text.default.font_family",{label:"Font Family"})}
            </lcards-form-section>

            <!-- Alignment Section -->
            <lcards-form-section
                header="Alignment"
                description="Anchor, baseline, text transform, and rotation settings"
                icon="mdi:format-align-left"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                ${n.renderField(this.editor,"text.default.anchor",{label:"Anchor",helper:"Text anchor (start/middle/end)"})}

                ${n.renderField(this.editor,"text.default.baseline",{label:"Baseline",helper:"Baseline alignment for text"})}

                ${n.renderField(this.editor,"text.default.text_transform",{label:"Text Transform",helper:"Text transformation (uppercase/lowercase/capitalize)"})}

                ${n.renderField(this.editor,"text.default.rotation",{label:"Rotation",helper:"Default rotation angle in degrees (0 = no rotation)"})}
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

                ${n.renderField(this.editor,"text.default.background_padding",{label:"Background Padding"})}

                ${n.renderField(this.editor,"text.default.background_radius",{label:"Background Corner Radius"})}

                ${n.renderField(this.editor,"text.default.background_width",{label:"Background Width (Fixed)",helper:"Exact px width: overrides auto-sizing. Text overflows if content is wider."})}

                ${n.renderField(this.editor,"text.default.background_min_width",{label:"Background Min Width",helper:"Auto-sizes with text but never shrinks below this value, so safe for dynamic content."})}
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
        `}_renderFieldItem(e){const t=this.text[e]||{},i=this._expandedFields[e]||false,a=t.content||e,d=a.length>50?a.substring(0,50)+"...":a;return o`
            <div class="editor-item" ?expanded=${i}>
                <div class="editor-item-header" @click=${()=>this._toggleField(e)}>
                    <ha-icon class="drag-handle" icon="mdi:drag"></ha-icon>
                    <ha-icon class="editor-item-icon" icon="mdi:format-text"></ha-icon>
                    <div class="editor-item-info">
                        <div class="editor-item-title">${e}</div>
                        <div class="editor-item-subtitle">${d}</div>
                    </div>
                    <div class="editor-item-actions" @click=${l=>l.stopPropagation()}>
                        <ha-icon-button
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                            @click=${l=>this._deleteField(l,e)}>
                        </ha-icon-button>
                    </div>
                    <ha-icon
                        class="expand-icon ${i?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>
                ${i?o`
                    <div class="editor-item-content">
                        ${this._renderFieldConfig(e,t)}
                    </div>
                `:""}
            </div>
        `}_renderFieldConfig(e,t){var i;return o`
            <lcards-text-field-editor
                .editor=${this.editor}
                .config=${(i=this.editor)==null?void 0:i.config}
                basePath=${`text.${e}`}
                name=${e}
                ?inherits=${this.text.default!==void 0}
                .zones=${this.availableZones}>
            </lcards-text-field-editor>
        `}_renderAddDialog(){const e=Object.keys(this.text).filter(d=>d!=="default"),i=["name","label","state"].filter(d=>!e.includes(d)),a=this.componentTextFields?this.componentTextFields.filter(d=>!e.includes(d)):[];return o`
            <div class="add-dialog">
                <div class="add-dialog-header">Add Text Field</div>
                <div class="add-dialog-content">

                    <!-- Component preset fields (shown only in component mode) -->
                    ${a.length>0?o`
                        <div>
                            <div class="field-label" style="color: var(--accent-color); font-size: 12px; font-weight: 600; margin-bottom: 6px;">
                                Component fields
                            </div>
                            <div class="quick-add-buttons">
                                ${a.map(d=>o`
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
                    ${i.length>0?o`
                        <div>
                            <div class="field-label" style="font-size: 12px; margin-bottom: 6px;">Quick Add</div>
                            <div class="quick-add-buttons">
                                ${i.map(d=>o`
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
        `}_toggleField(e){this._expandedFields={...this._expandedFields,[e]:!this._expandedFields[e]}}_toggleAddDialog(){this._showAddDialog=!this._showAddDialog,this._showAddDialog||(this._newFieldName="")}_isValidFieldName(e){return!!e&&/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(e)}_addField(e){if(!this._isValidFieldName(e))return;if(this.text[e]){b({title:"Field already exists",message:`This card already has a "${e}" text field.`});return}let t;switch(e.toLowerCase()){case"name":t="[[[return entity.attributes.friendly_name || entity.entity_id]]]";break;case"state":t="{entity.state}";break;case"label":t=`[[[ return (((Math.floor(Math.random() * 256).toString(16).padStart(2, '0')) + "-" + (Math.floor(Math.random() * 4096).toString(16).padStart(3, '0')))) ]]]`;break;default:t=e}const i={content:t,show:true},a={...this.text,[e]:i};this._expandedFields={...this._expandedFields,[e]:true},this._showAddDialog=false,this._newFieldName="",this._emitChange(a)}_deleteField(e,t){e.stopPropagation(),e.preventDefault(),s.debug(`[MultiTextEditorV2] Deleting field: ${t}`);const i={...this.text};delete i[t],delete this._expandedFields[t],this._emitChange(i)}_updateField(e,t,i){const a={...this.text};a[e]={...a[e],[t]:i},this._emitChange(a)}_emitChange(e){s.info("[MultiTextEditorV2] _emitChange called"),s.debug("[MultiTextEditorV2] New text value:",e),s.debug("[MultiTextEditorV2] Event will bubble:",true,"composed:",true),this.text=e;const t=new CustomEvent("text-changed",{detail:{value:e},bubbles:true,composed:true});s.info("[MultiTextEditorV2] Dispatching text-changed event"),this.dispatchEvent(t),this.requestUpdate()}};r(u,"LCARdSMultiTextEditorV2");let c=u;customElements.get("lcards-multi-text-editor-v2")||customElements.define("lcards-multi-text-editor-v2",c);const p=class p2 extends f{static get properties(){return{hass:{type:Object},actions:{type:Object}}}constructor(){super(),this.hass=null,this.actions={}}static get styles(){return m`
            :host {
                display: block;
            }

            .action-section {
                margin-bottom: var(--lcards-section-spacing, 16px);
            }
        `}render(){const e=this.actions.tap_action||{action:"none"},t=this.actions.hold_action||{action:"none"},i=this.actions.double_tap_action||{action:"none"};return o`
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
        `}_handleActionChange(e,t){t.stopPropagation();const i=t.detail.value,a={...this.actions};(i==null?void 0:i.action)==="none"?delete a[e]:a[e]=i,this.actions=a,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:a},bubbles:true,composed:true}))}};r(p,"LCARdSMultiActionEditor");let h=p;customElements.get("lcards-multi-action-editor")||customElements.define("lcards-multi-action-editor",h);
//# sourceMappingURL=lcards-multi-action-editor-DZe0u7V-.js.map
