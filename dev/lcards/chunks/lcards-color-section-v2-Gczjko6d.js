var _=Object.defineProperty;var b=(f,e)=>_(f,"name",{value:e,configurable:true});import{i as y,l,a as w,b as s,a8 as S,K as $,m as v}from"./lcards-main-C10Twmlb.js";import{e as C}from"./studio-dialog-styles-C5BrIaK5.js";import"./lcards-form-section-DSoN9OMH.js";const m=class m2 extends y{static get properties(){return{editor:{type:Object},basePath:{type:String},header:{type:String},description:{type:String},expanded:{type:Boolean},allowMatchLight:{type:Boolean},entityId:{type:String},suggestedStates:{type:Array},allowCustomStates:{type:Boolean},showPreview:{type:Boolean},variablePrefixes:{type:Array},_expandedStates:{attribute:false,state:true},_customStateInput:{type:String,state:true},_rangeOperator:{type:String,state:true},_rangeMin:{type:String,state:true},_rangeMax:{type:String,state:true},_guideExpanded:{type:Boolean,state:true}}}constructor(){super(),this.editor=null,this.basePath="",this.header="Colours",this.description="",this.expanded=false,this.allowMatchLight=false,this.entityId="",this.suggestedStates=["default","active","inactive","unavailable","zero","non_zero","hover","pressed"],this.allowCustomStates=true,this.showPreview=true,this.variablePrefixes=["--lcards-","--lcars-","--cblcars-"],this._expandedStates=new Set,this._customStateInput="",this._rangeOperator="above",this._rangeMin="",this._rangeMax="",this._guideExpanded=false,l.debug("[ColorSectionV2] Initialized",{basePath:this.basePath,suggestedStates:this.suggestedStates})}static get styles(){return[C,w`
                :host {
                    display: block;
                }

                /* State mapping info box */
                .state-mapping-info {
                    background: var(--primary-background-color);
                    border: var(--ha-border-width-sm) solid var(--divider-color);
                    border-radius: var(--ha-card-border-radius, 12px);
                    margin-bottom: 12px;
                    margin-top: 12px;
                    font-size: 13px;
                    overflow: hidden;
                }

                .state-mapping-info-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    cursor: pointer;
                    user-select: none;
                    color: var(--primary-color);
                    font-weight: 500;
                }

                .state-mapping-info-header:hover {
                    background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.06);
                }

                .state-mapping-info-header ha-icon {
                    flex-shrink: 0;
                }

                .state-mapping-info-header .guide-chevron {
                    margin-left: auto;
                    transition: transform 0.2s;
                }

                .state-mapping-info-header .guide-chevron.expanded {
                    transform: rotate(180deg);
                }

                .state-mapping-info-body {
                    padding: 0 12px 12px 12px;
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                }

                .state-mapping-info strong {
                    color: var(--primary-color);
                }

                .state-mapping-info code {
                    background: rgba(0, 0, 0, 0.1);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                    font-size: 12px;
                }

                /* Color preview bar */
                .color-preview-bar {
                    height: 6px;
                    width: 100%;
                    border-radius: 3px;
                    margin-top: 6px;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
                    transition: height 0.2s;
                }

                .editor-item-header:hover .color-preview-bar {
                    height: 8px;
                }

                /* Add state controls */
                .add-state-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 12px;
                    padding: 12px;
                    background: var(--secondary-background-color);
                    border-radius: var(--ha-card-border-radius, 12px);
                }

                /* Quick Add Section */
                .quick-add-section {
                    margin-bottom: 12px;
                }

                .field-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--primary-text-color);
                    margin-bottom: 8px;
                }

                .quick-add-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .quick-add-buttons ha-button {
                    flex: 0 1 auto;
                }

                .no-suggested-states {
                    font-size: 13px;
                    color: var(--secondary-text-color);
                    font-style: italic;
                    padding: 12px;
                    text-align: center;
                    background: var(--secondary-background-color);
                    border-radius: 8px;
                    margin-bottom: 12px;
                }

                .custom-state-input {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    padding-top: 12px;
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                }

                /* Action buttons - ensure visibility */
                .editor-item-actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                    margin-left: 8px;
                }

                /* ha-icon-button (WebAwesome) draws its icon in currentColor */
                .editor-item-actions ha-icon-button {
                    --ha-icon-button-size: 40px;
                    --mdc-icon-size: 20px;
                    color: var(--primary-text-color);
                }

                .editor-item-actions ha-icon-button:hover {
                    color: var(--error-color);
                }

                /* Expand icon spacing */
                .expand-icon {
                    margin-left: 4px;
                    flex-shrink: 0;
                }

                /* Empty state */
                .empty-state {
                    text-align: center;
                    padding: 24px;
                    color: var(--secondary-text-color);
                }

                .empty-state ha-icon {
                    --mdc-icon-size: 48px;
                    color: var(--disabled-text-color);
                    margin-bottom: 12px;
                }

                /* Fix dropdown clipping from overflow:hidden */
                .editor-item-content {
                    position: relative;
                }

                .editor-item-content lcards-color-picker {
                    position: relative;
                }

                /* Range condition form */
                .range-condition-input {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-top: 12px;
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                }

                .range-condition-row {
                    display: flex;
                    gap: 8px;
                    align-items: flex-start;
                    flex-wrap: wrap;
                }
            `]}render(){if(!this.editor)return s`
                <ha-alert alert-type="error">
                    Color section v2 requires 'editor' property
                </ha-alert>
            `;const e=this._getCurrentStates(),t=Object.keys(e).length;return s`
            <lcards-form-section
                header="${this.header}"
                description="${this.description}"
                ?expanded=${this.expanded}
                icon="mdi:palette"
                outlined>

                <!-- Existing States (List) -->
                ${t===0?this._renderEmptyState():s`
                    <div class="editor-list">
                        ${Object.entries(e).map(([i,a])=>this._renderColorStateItem(i,a))}
                    </div>
                `}

                <!-- State Mapping Info (collapsible) -->
                <div class="state-mapping-info">
                    <div class="state-mapping-info-header"
                         @click=${()=>{this._guideExpanded=!this._guideExpanded}}>
                        <ha-icon icon="mdi:information-outline"></ha-icon>
                        <span>State Mapping Guide</span>
                        <ha-icon
                            class="guide-chevron ${this._guideExpanded?"expanded":""}"
                            icon="mdi:chevron-down">
                        </ha-icon>
                    </div>
                    ${this._guideExpanded?s`
                    <div class="state-mapping-info-body">
                        <br>
                        Use custom state names (e.g., <code>heat</code>, <code>cool</code>, <code>playing</code>) for exact entity states, or use mapped states:<br>
                        • <strong>active</strong> → on, locked, open, home, playing, heating, cooling, etc.<br>
                        • <strong>inactive</strong> → off, paused, idle, stopped, unlocked, closed, etc.<br>
                        • <strong>unavailable</strong> → unavailable, unknown<br>
                        • <strong>default</strong> → fallback for all other states
                        <br><br>
                        Numeric states (e.g. counts, sensor values):<br>
                        • <strong>zero</strong> → entity state is exactly 0, higher priority than ranges<br>
                        • <strong>above:N</strong> → value &gt; N, e.g. <code>above:50</code><br>
                        • <strong>at_least:N</strong> → value ≥ N, e.g. <code>at_least:50</code><br>
                        • <strong>below:N</strong> → value &lt; N, e.g. <code>below:20</code><br>
                        • <strong>at_most:N</strong> → value ≤ N, e.g. <code>at_most:20</code><br>
                        • <strong>between:N:M</strong> → N ≤ value ≤ M, e.g. <code>between:20:80</code><br>
                        • <strong>between_exclusive:N:M</strong> → N &lt; value &lt; M, e.g. <code>between_exclusive:20:80</code><br>
                        When multiple ranges match, the most specific one wins (narrowest / highest above/at_least / lowest below/at_most).<br>
                        • <strong>non_zero</strong> → any non-zero number, catch-all when no range matched<br>
                        <br>
                        Interactive element states (if supported by card):<br>
                        • <strong>hover</strong> · <strong>pressed</strong>
                    </div>
                    `:""}
                </div>

                <!-- Add State Controls -->
                ${this._renderAddStateControls()}
            </lcards-form-section>
        `}_renderEmptyState(){return s`
            <div class="empty-state">
                <ha-icon icon="mdi:palette"></ha-icon>
                <div style="font-weight: 500; margin-bottom: 8px;">No color states configured</div>
                <div style="font-size: 13px;">
                    Add a suggested state or create a custom state below
                </div>
            </div>
        `}_renderColorStateItem(e,t){var a,r,n;const i=this._expandedStates.has(e);return s`
            <div class="editor-item">
                <!-- Header (Clickable to Expand) -->
                <div class="editor-item-header" @click=${()=>this._toggleState(e)}>
                    <!-- State Info -->
                    <div class="editor-item-info">
                        <div class="editor-item-title">${this._formatStateLabel(e)}</div>
                        <div class="editor-item-subtitle">${t||"Not set"}</div>

                        <!-- Color Preview Bar -->
                        ${t&&this.showPreview?s`
                            <div class="color-preview-bar"
                                style="background: ${this._resolveColorForPreview(t)}">
                            </div>
                        `:""}
                    </div>

                    <!-- Actions -->
                    <div class="editor-item-actions">
                        <ha-icon-button
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                            @click=${o=>this._deleteState(o,e)}>
                        </ha-icon-button>
                    </div>

                    <!-- Expand Icon -->
                    <ha-icon
                        class="expand-icon ${i?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                <!-- Content (Color Picker) -->
                ${i?s`
                    <div class="editor-item-content">
                        <lcards-color-picker
                            .hass=${this.editor.hass}
                            .value=${t||""}
                            .variablePrefixes=${this.variablePrefixes}
                            ?showPreview=${true}
                            ?allowMatchLight=${this.entityId?this.entityId.startsWith("light."):this.allowMatchLight||(((a=this.editor)==null?void 0:a._isLightEntity)??false)}
                            .entityId=${this.entityId||((n=(r=this.editor)==null?void 0:r.config)==null?void 0:n.entity)||""}
                            @value-changed=${o=>this._handleColorChange(e,o)}>
                        </lcards-color-picker>
                    </div>
                `:""}
            </div>
        `}_renderAddStateControls(){const e=this._getCurrentStates(),t=Object.keys(e),i=this.suggestedStates.filter(a=>!t.includes(a));return s`
            <div class="add-state-controls">
                <!-- Quick Add Buttons for Suggested States -->
                ${i.length>0?s`
                    <div class="quick-add-section">
                        <div class="field-label">Quick Add States</div>
                        <div class="quick-add-buttons">
                            ${i.map(a=>s`
                                <ha-button
                                    @click=${()=>this._addState(a)}
                                    outlined>
                                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                    ${this._formatStateLabel(a)}
                                </ha-button>
                            `)}
                        </div>
                    </div>
                `:s`
                    <div class="no-suggested-states">
                        All suggested states have been added
                    </div>
                `}

                <!-- Custom State Input (if enabled) -->
                ${this.allowCustomStates?s`
                    <div class="custom-state-input">
                        <ha-selector
                            style="flex:1;"
                            .hass=${this.editor.hass}
                            .label=${"Custom State Name"}
                            .selector=${{text:{}}}
                            .value=${this._customStateInput}
                            @value-changed=${this._handleCustomStateInput}
                            @keydown=${this._handleCustomStateKeydown}>
                        </ha-selector>
                        <ha-button
                            variant="brand"
                            @click=${this._addCustomState}
                            ?disabled=${!this._customStateInput.trim()}>
                            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                            Add Custom
                        </ha-button>
                    </div>
                `:""}

                <!-- Range Condition Input -->
                <div class="range-condition-input">
                    <div class="field-label">Add Range Condition</div>
                    <div class="range-condition-row">
                        <ha-selector
                            style="width:140px; flex-shrink:0;"
                            .hass=${this.editor.hass}
                            .label=${"Operator"}
                            .value=${this._rangeOperator}
                            .selector=${{select:{mode:"dropdown",options:[{value:"above",label:"Above (>)"},{value:"at_least",label:"At Least (≥)"},{value:"below",label:"Below (<)"},{value:"at_most",label:"At Most (≤)"},{value:"between",label:"Between (inclusive)"},{value:"between_exclusive",label:"Between (exclusive)"}]}}}
                            @value-changed=${this._handleRangeOperatorChange}>
                        </ha-selector>
                        <ha-selector
                            style="flex:1; min-width:80px;"
                            .hass=${this.editor.hass}
                            .label=${this._isBetweenOperator()?"From":"Threshold"}
                            .selector=${{number:{mode:"box",step:.01}}}
                            .value=${this._rangeMin===""?null:parseFloat(this._rangeMin)}
                            @value-changed=${this._handleRangeMinChange}>
                        </ha-selector>
                        ${this._isBetweenOperator()?s`
                            <ha-selector
                                style="flex:1; min-width:80px;"
                                .hass=${this.editor.hass}
                                .label=${"To"}
                                .selector=${{number:{mode:"box",step:.01}}}
                                .value=${this._rangeMax===""?null:parseFloat(this._rangeMax)}
                                @value-changed=${this._handleRangeMaxChange}>
                            </ha-selector>
                        `:""}
                        <ha-button
                            style="align-self: center;"
                            variant="brand"
                            @click=${this._addRangeCondition}
                            ?disabled=${!this._isValidRangeForm()}>
                            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                            Add
                        </ha-button>
                    </div>
                </div>
            </div>
        `}_getCurrentStates(){const e=this.editor._getConfigValue(this.basePath);return typeof e=="string"?{default:e}:typeof e=="object"&&e!==null?{...e}:{}}_toggleState(e){this._expandedStates.has(e)?this._expandedStates.delete(e):this._expandedStates.add(e),this.requestUpdate()}_handleColorChange(e,t){const i=this._getCurrentStates();i[e]=t.detail.value,this.editor._setConfigValue(this.basePath,i),l.debug("[ColorSectionV2] Color changed",{state:e,value:t.detail.value})}_handleCustomStateInput(e){this._customStateInput=e.detail.value??""}_handleCustomStateKeydown(e){e.key==="Enter"&&(e.preventDefault(),this._addCustomState())}_addCustomState(){const e=(this._customStateInput||"").trim().toLowerCase();if(!e){this._showError("Please enter a state name");return}if(!/^[a-z0-9_-]+$/.test(e)){this._showError("State name must be alphanumeric with optional underscores/hyphens");return}if(this._hasState(e)){this._showError(`State "${e}" already exists`);return}this._addState(e),this._customStateInput="",l.info("[ColorSectionV2] Added custom state",{state:e})}_handleRangeOperatorChange(e){this._rangeOperator=e.detail.value}_handleRangeMinChange(e){var i;const t=(i=e.detail)==null?void 0:i.value;this._rangeMin=t!=null?String(t):""}_handleRangeMaxChange(e){var i;const t=(i=e.detail)==null?void 0:i.value;this._rangeMax=t!=null?String(t):""}_isBetweenOperator(){return this._rangeOperator==="between"||this._rangeOperator==="between_exclusive"}_isValidRangeForm(){const e=parseFloat(this._rangeMin);if(isNaN(e))return false;if(this._isBetweenOperator()){const t=parseFloat(this._rangeMax);if(isNaN(t)||e>=t)return false}return true}_buildRangeKey(){return this._isBetweenOperator()?`${this._rangeOperator}:${this._rangeMin}:${this._rangeMax}`:`${this._rangeOperator}:${this._rangeMin}`}_addRangeCondition(){if(!this._isValidRangeForm())return;const e=this._buildRangeKey();if(this._hasState(e)){this._showError(`Range condition "${e}" already exists`);return}this._addState(e),this._rangeMin="",this._rangeMax="",l.info("[ColorSectionV2] Added range condition",{key:e})}_addState(e){const t=this._getCurrentStates();if(t[e]!==void 0){l.debug("[ColorSectionV2] State already exists:",e);return}const i={...t,[e]:""};this.editor._setConfigValue(this.basePath,i),this._expandedStates.add(e),this.requestUpdate(),l.info("[ColorSectionV2] Added state",{state:e})}async _deleteState(e,t){if(e.stopPropagation(),!await this._showConfirmDialog("Delete State",`Delete "${t}" state?`))return;const a=this._getCurrentStates();delete a[t],this.editor._setConfigValue(this.basePath,a),this._expandedStates.delete(t),this.requestUpdate(),l.info("[ColorSectionV2] Deleted state",{state:t})}_resolveMatchLightColor(){var r,n,o,d,c;const e=this.entityId||((n=(r=this.editor)==null?void 0:r.config)==null?void 0:n.entity)||"",t=e?(c=(d=(o=this.editor)==null?void 0:o.hass)==null?void 0:d.states)==null?void 0:c[e]:null;if(!t||t.state!=="on")return"transparent";if(t.attributes.rgb_color){const[h,u,p]=t.attributes.rgb_color;return`rgb(${h}, ${u}, ${p})`}if(t.attributes.color_temp){const h=t.attributes.color_temp_kelvin??Math.round(1e6/t.attributes.color_temp),[u,p,x]=S.kelvinToRgb(h);return`rgb(${u}, ${p}, ${x})`}const i=t.attributes.brightness??255,a=Math.round(i/255*255);return`rgb(${a}, ${Math.round(a*.97)}, ${Math.round(a*.85)})`}_resolveColorForPreview(e){var t,i,a,r,n;if(!e)return"transparent";if(e==="match-light")return this._resolveMatchLightColor();if(e.includes("match-brightness")){const o=this.entityId||((i=(t=this.editor)==null?void 0:t.config)==null?void 0:i.entity)||"",d=o?(n=(r=(a=this.editor)==null?void 0:a.hass)==null?void 0:r.states)==null?void 0:n[o]:null,c=(d==null?void 0:d.state)==="on"?((d.attributes.brightness??255)/255).toFixed(3):"1";e=e.replace(/match-brightness/g,c)}return e.includes("match-light")&&(e=e.replace(/match-light/g,this._resolveMatchLightColor())),$(e,{concrete:true,element:this,fallback:e})}_formatStateLabel(e){if(e.startsWith("above:"))return`Above ${e.slice(6)}`;if(e.startsWith("at_least:"))return`At Least ${e.slice(9)}`;if(e.startsWith("below:"))return`Below ${e.slice(6)}`;if(e.startsWith("at_most:"))return`At Most ${e.slice(8)}`;const t=e.match(/^between_exclusive:(-?[\d.]+):(-?[\d.]+)$/);if(t)return`Between ${t[1]}–${t[2]} (exclusive)`;const i=e.match(/^between:(-?[\d.]+):(-?[\d.]+)$/);return i?`Between ${i[1]}–${i[2]}`:e.split(/[-_]/).map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join(" ")}_hasState(e){return this._getCurrentStates()[e]!==void 0}async _showError(e){await this._showDialog("Error",e,"error"),l.warn("[ColorSectionV2] Error",{message:e})}async _showDialog(e,t,i="info"){return new Promise(a=>{const r=document.createElement("ha-dialog");r.headerTitle=e,r.open=true;const n=document.createElement("div");n.innerHTML=t,n.style.padding="16px",r.appendChild(n);const o=document.createElement("ha-button");o.slot="footer",o.textContent="OK",o.addEventListener("click",()=>{r.open=false,a(void 0)}),r.appendChild(o),r.addEventListener("closed",()=>{r.remove()}),v(r,this)})}async _showConfirmDialog(e,t){return new Promise(i=>{const a=document.createElement("ha-dialog");a.headerTitle=e,a.open=true;const r=document.createElement("div");r.innerHTML=t,r.style.padding="16px",r.style.lineHeight="1.5",a.appendChild(r);const n=document.createElement("ha-button");n.textContent="Cancel",n.setAttribute("appearance","plain"),n.addEventListener("click",()=>{a.open=false,i(false)});const o=document.createElement("ha-button");o.textContent="Delete",o.setAttribute("variant","danger"),o.addEventListener("click",()=>{a.open=false,i(true)});const d=document.createElement("div");d.slot="footer",d.appendChild(n),d.appendChild(o),a.appendChild(d),a.addEventListener("closed",()=>{a.remove()}),v(a,this)})}};b(m,"LCARdSColorSectionV2");let g=m;customElements.get("lcards-color-section-v2")||customElements.define("lcards-color-section-v2",g);
//# sourceMappingURL=lcards-color-section-v2-Gczjko6d.js.map
