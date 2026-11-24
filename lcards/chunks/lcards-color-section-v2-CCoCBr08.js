var w=Object.defineProperty;var b=(_,t)=>w(_,"name",{value:t,configurable:true});import{i as S,l as d,c as $,b as o,bm as C,aR as k,d as v,o as f,m as x}from"./lcards-main-C0gg-u3X.js";import{e as M}from"./LCARdSBaseEditor-y7tpngOf.js";import"./lcards-form-section-DUjEMfgF.js";import"./lcards-color-picker-BESuDzyB.js";const m=class m2 extends S{static get properties(){return{editor:{type:Object},basePath:{type:String},header:{type:String},description:{type:String},expanded:{type:Boolean},allowMatchLight:{type:Boolean},entityId:{type:String},suggestedStates:{type:Array},allowCustomStates:{type:Boolean},showPreview:{type:Boolean},valueKind:{type:String},variablePrefixes:{type:Array},_expandedStates:{attribute:false,state:true},_customStateInput:{type:String,state:true},_rangeOperator:{type:String,state:true},_rangeMin:{type:String,state:true},_rangeMax:{type:String,state:true},_guideExpanded:{type:Boolean,state:true}}}constructor(){super(),this.editor=null,this.basePath="",this.header="Colours",this.description="",this.expanded=false,this.allowMatchLight=false,this.entityId="",this.suggestedStates=["default","active","inactive","unavailable","zero","non_zero","hover","pressed"],this.allowCustomStates=true,this.showPreview=true,this.valueKind="color",this.variablePrefixes=["--lcards-","--lcars-","--cblcars-"],this._expandedStates=new Set,this._customStateInput="",this._rangeOperator="above",this._rangeMin="",this._rangeMax="",this._guideExpanded=false,d.debug("[ColorSectionV2] Initialized",{basePath:this.basePath,suggestedStates:this.suggestedStates})}static get styles(){return[M,$`
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
                    flex-wrap: wrap;
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
            `]}render(){if(!this.editor)return o`
                <ha-alert alert-type="error">
                    Color section v2 requires 'editor' property
                </ha-alert>
            `;const t=this._getCurrentStates(),e=Object.keys(t).length;return o`
            <lcards-form-section
                header="${this.header}"
                description="${this.description}"
                ?expanded=${this.expanded}
                icon=${this.valueKind==="number"?"mdi:numeric":"mdi:palette"}
                outlined>

                <!-- Existing States (List) -->
                ${e===0?this._renderEmptyState():o`
                    <div class="editor-list">
                        ${Object.entries(t).map(([i,a])=>this._renderColorStateItem(i,a))}
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
                    ${this._guideExpanded?o`
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
                        ${this.valueKind==="number"?"":o`<br>
                        Interactive element states (if supported by card):<br>
                        • <strong>hover</strong> · <strong>pressed</strong>`}
                    </div>
                    `:""}
                </div>

                <!-- Add State Controls -->
                ${this._renderAddStateControls()}
            </lcards-form-section>
        `}_renderEmptyState(){return o`
            <div class="empty-state">
                <ha-icon icon=${this.valueKind==="number"?"mdi:numeric":"mdi:palette"}></ha-icon>
                <div style="font-weight: 500; margin-bottom: 8px;">${this.valueKind==="number"?"No states yet":"No color states configured"}</div>
                <div style="font-size: 13px;">
                    Add a suggested state or create a custom state below
                </div>
            </div>
        `}_renderColorStateItem(t,e){var a,r,s;const i=this._expandedStates.has(t);return o`
            <div class="editor-item">
                <!-- Header (Clickable to Expand) -->
                <div class="editor-item-header" @click=${()=>this._toggleState(t)}>
                    <!-- State Info -->
                    <div class="editor-item-info">
                        <div class="editor-item-title">${this._formatStateLabel(t)}</div>
                        <div class="editor-item-subtitle">${e===""||e===void 0||e===null?"Not set":String(e)}</div>

                        <!-- Color Preview Bar -->
                        ${e&&this.showPreview&&this.valueKind!=="number"?o`
                            <div class="color-preview-bar"
                                style="background: ${this._resolveColorForPreview(e)}">
                            </div>
                        `:""}
                    </div>

                    <!-- Actions -->
                    <div class="editor-item-actions">
                        <ha-icon-button
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                            @click=${n=>this._deleteState(n,t)}>
                        </ha-icon-button>
                    </div>

                    <!-- Expand Icon -->
                    <ha-icon
                        class="expand-icon ${i?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                <!-- Content (a number box, or the Color Picker) -->
                ${i&&this.valueKind==="number"?o`
                    <div class="editor-item-content">
                        <ha-selector
                            .hass=${this.editor.hass}
                            .label=${"Value"}
                            .selector=${{number:{mode:"box",step:"any"}}}
                            .value=${typeof e=="number"?e:null}
                            @value-changed=${n=>this._handleColorChange(t,n)}>
                        </ha-selector>
                    </div>
                `:i?o`
                    <div class="editor-item-content">
                        <lcards-color-picker
                            .hass=${this.editor.hass}
                            .value=${e||""}
                            .variablePrefixes=${this.variablePrefixes}
                            ?showPreview=${true}
                            ?allowMatchLight=${this.entityId?this.entityId.startsWith("light."):this.allowMatchLight||(((a=this.editor)==null?void 0:a._isLightEntity)??false)}
                            .entityId=${this.entityId||((s=(r=this.editor)==null?void 0:r.config)==null?void 0:s.entity)||""}
                            @value-changed=${n=>this._handleColorChange(t,n)}>
                        </lcards-color-picker>
                    </div>
                `:""}
            </div>
        `}_renderAddStateControls(){const t=this._getCurrentStates(),e=Object.keys(t),i=this.suggestedStates.filter(a=>!e.includes(a));return o`
            <div class="add-state-controls">
                <!-- Quick Add Buttons for Suggested States -->
                ${i.length>0?o`
                    <div class="quick-add-section">
                        <div class="field-label">Quick Add States</div>
                        <div class="quick-add-buttons">
                            ${i.map(a=>o`
                                <ha-button
                                    @click=${()=>this._addState(a)}
                                    outlined>
                                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                    ${this._formatStateLabel(a)}
                                </ha-button>
                            `)}
                        </div>
                    </div>
                `:o`
                    <div class="no-suggested-states">
                        All suggested states have been added
                    </div>
                `}

                <!-- Custom State Input (if enabled) -->
                ${this.allowCustomStates?o`
                    <div class="custom-state-input">
                        <ha-selector
                            style="flex:1; min-width:160px;"
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
                        ${this._isBetweenOperator()?o`
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
        `}_getCurrentStates(){const t=this.editor._getConfigValue(this.basePath);return typeof t=="string"?{default:t}:typeof t=="object"&&t!==null?{...t}:{}}_toggleState(t){this._expandedStates.has(t)?this._expandedStates.delete(t):this._expandedStates.add(t),this.requestUpdate()}_handleColorChange(t,e){var r;(r=e==null?void 0:e.stopPropagation)==null||r.call(e);const i=this._getCurrentStates(),a=e.detail.value;i[t]=this.valueKind==="number"?a===""||a===null||a===void 0||!Number.isFinite(Number(a))?0:Number(a):a,this.editor._setConfigValue(this.basePath,i),d.debug("[ColorSectionV2] Color changed",{state:t,value:e.detail.value})}_handleCustomStateInput(t){var e;(e=t==null?void 0:t.stopPropagation)==null||e.call(t),this._customStateInput=t.detail.value??""}_handleCustomStateKeydown(t){t.key==="Enter"&&(t.preventDefault(),this._addCustomState())}_addCustomState(){const t=(this._customStateInput||"").trim().toLowerCase();if(!t){this._showError("Please enter a state name");return}if(!/^[a-z0-9_-]+$/.test(t)){this._showError("State name must be alphanumeric with optional underscores/hyphens");return}if(this._hasState(t)){this._showError(`State "${t}" already exists`);return}this._addState(t),this._customStateInput="",d.debug("[ColorSectionV2] Added custom state",{state:t})}_handleRangeOperatorChange(t){var e;(e=t==null?void 0:t.stopPropagation)==null||e.call(t),this._rangeOperator=t.detail.value}_handleRangeMinChange(t){var i,a;(i=t==null?void 0:t.stopPropagation)==null||i.call(t);const e=(a=t.detail)==null?void 0:a.value;this._rangeMin=e!=null?String(e):""}_handleRangeMaxChange(t){var i,a;(i=t==null?void 0:t.stopPropagation)==null||i.call(t);const e=(a=t.detail)==null?void 0:a.value;this._rangeMax=e!=null?String(e):""}_isBetweenOperator(){return this._rangeOperator==="between"||this._rangeOperator==="between_exclusive"}_isValidRangeForm(){const t=parseFloat(this._rangeMin);if(isNaN(t))return false;if(this._isBetweenOperator()){const e=parseFloat(this._rangeMax);if(isNaN(e)||t>=e)return false}return true}_buildRangeKey(){return this._isBetweenOperator()?`${this._rangeOperator}:${this._rangeMin}:${this._rangeMax}`:`${this._rangeOperator}:${this._rangeMin}`}_addRangeCondition(){if(!this._isValidRangeForm())return;const t=this._buildRangeKey();if(this._hasState(t)){this._showError(`Range condition "${t}" already exists`);return}this._addState(t),this._rangeMin="",this._rangeMax="",d.debug("[ColorSectionV2] Added range condition",{key:t})}_addState(t){const e=this._getCurrentStates();if(e[t]!==void 0){d.debug("[ColorSectionV2] State already exists:",t);return}const i={...e,[t]:this.valueKind==="number"?0:""};this.editor._setConfigValue(this.basePath,i),this._expandedStates.add(t),this.requestUpdate(),d.debug("[ColorSectionV2] Added state",{state:t})}async _deleteState(t,e){var r;if((r=t==null?void 0:t.stopPropagation)==null||r.call(t),!await this._showConfirmDialog("Delete State",`Delete "${e}" state?`))return;const a=this._getCurrentStates();delete a[e],this.editor._setConfigValue(this.basePath,a),this._expandedStates.delete(e),this.requestUpdate(),d.debug("[ColorSectionV2] Deleted state",{state:e})}_resolveMatchLightColor(){var r,s,n,l,c;const t=this.entityId||((s=(r=this.editor)==null?void 0:r.config)==null?void 0:s.entity)||"",e=t?(c=(l=(n=this.editor)==null?void 0:n.hass)==null?void 0:l.states)==null?void 0:c[t]:null;if(!e||e.state!=="on")return"transparent";if(e.attributes.rgb_color){const[h,u,p]=e.attributes.rgb_color;return`rgb(${h}, ${u}, ${p})`}if(e.attributes.color_temp){const h=e.attributes.color_temp_kelvin??Math.round(1e6/e.attributes.color_temp),[u,p,y]=C.kelvinToRgb(h);return`rgb(${u}, ${p}, ${y})`}const i=e.attributes.brightness??255,a=Math.round(i/255*255);return`rgb(${a}, ${Math.round(a*.97)}, ${Math.round(a*.85)})`}_resolveColorForPreview(t){var e,i,a,r,s;if(!t)return"transparent";if(t==="match-light")return this._resolveMatchLightColor();if(t.includes("match-brightness")){const n=this.entityId||((i=(e=this.editor)==null?void 0:e.config)==null?void 0:i.entity)||"",l=n?(s=(r=(a=this.editor)==null?void 0:a.hass)==null?void 0:r.states)==null?void 0:s[n]:null,c=(l==null?void 0:l.state)==="on"?((l.attributes.brightness??255)/255).toFixed(3):"1";t=t.replace(/match-brightness/g,c)}return t.includes("match-light")&&(t=t.replace(/match-light/g,this._resolveMatchLightColor())),k(t,{concrete:true,element:this,fallback:t})}_formatStateLabel(t){if(t.startsWith("above:"))return`Above ${t.slice(6)}`;if(t.startsWith("at_least:"))return`At Least ${t.slice(9)}`;if(t.startsWith("below:"))return`Below ${t.slice(6)}`;if(t.startsWith("at_most:"))return`At Most ${t.slice(8)}`;const e=t.match(/^between_exclusive:(-?[\d.]+):(-?[\d.]+)$/);if(e)return`Between ${e[1]}–${e[2]} (exclusive)`;const i=t.match(/^between:(-?[\d.]+):(-?[\d.]+)$/);return i?`Between ${i[1]}–${i[2]}`:t.split(/[-_]/).map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join(" ")}_hasState(t){return this._getCurrentStates()[t]!==void 0}async _showError(t){await this._showDialog("Error",t,"error"),d.warn("[ColorSectionV2] Error",{message:t})}async _showDialog(t,e,i="info"){return new Promise(a=>{const r=document.createElement("ha-dialog");r.headerTitle=t,r.open=true;const s=document.createElement("div");s.innerHTML=e,s.style.padding="16px",r.appendChild(s);const n=document.createElement("ha-button");n.textContent="OK",n.autofocus=true,n.addEventListener("click",()=>{r.open=false,a(void 0)}),r.appendChild(v({primary:[n]})),f(r,()=>{r.remove()}),x(r,this)})}async _showConfirmDialog(t,e){return new Promise(i=>{const a=document.createElement("ha-dialog");a.headerTitle=t,a.open=true;const r=document.createElement("div");r.innerHTML=e,r.style.padding="16px",r.style.lineHeight="1.5",a.appendChild(r);const s=document.createElement("ha-button");s.textContent="Cancel",s.setAttribute("appearance","plain"),s.autofocus=true,s.addEventListener("click",()=>{a.open=false,i(false)});const n=document.createElement("ha-button");n.textContent="Delete",n.setAttribute("variant","danger"),n.addEventListener("click",()=>{a.open=false,i(true)}),a.appendChild(v({secondary:[s],primary:[n]})),f(a,()=>{a.remove()}),x(a,this)})}};b(m,"LCARdSColorSectionV2");let g=m;customElements.get("lcards-color-section-v2")||customElements.define("lcards-color-section-v2",g);
//# sourceMappingURL=lcards-color-section-v2-CCoCBr08.js.map
