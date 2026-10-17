var D=Object.defineProperty;var g=(U,e)=>D(U,"name",{value:e,configurable:true});import{i as E,a as A,b as n,l as _,m as N,s as H}from"./lcards-main-BW4hZuuz.js";import{i as G}from"./keyed-BvYUrTJA.js";import{e as W,L as S,a as Z}from"./studio-dialog-styles-BC3IDpnS.js";import"./lcards-message-DJxE4eZn.js";import"./lcards-form-section-Bxom3ojy.js";import{e as J}from"./editor-component-styles-COG_vo1_.js";import{c as j}from"./lcards-yaml-editor-B_uxS34u.js";import{getComponentsForCard as K,getComponentNames as Q}from"./index-B7Ol1799.js";import"./lcards-grid-layout-BN-SjNXG.js";import"./lcards-color-section-v2-C3CZPhjM.js";import"./lcards-multi-action-editor-R4BTdmPL.js";import"./lcards-rules-dashboard-kqpSJ0Jb.js";import"./lcards-border-editor-Cz3FzyJk.js";import"./lcards-filter-editor-Da5JBbfk.js";import"./lcards-background-animation-editor-BRRbXPdx.js";import"./lcards-shape-texture-editor-DjZMqSdi.js";import"./lcards-datasource-editor-tab-BLZdadgQ.js";import"./lcards-template-evaluation-tab-B1klA_pj.js";import"./lcards-provenance-tab-D1UONR46.js";const M=class M2 extends E{static get properties(){return{value:{type:String},label:{type:String},helper:{type:String},disabled:{type:Boolean}}}constructor(){super(),this.value="left",this.label="",this.helper="",this.disabled=false}static get styles(){return A`
            :host {
                display: block;
            }

            .icon-area-picker {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                padding: 2px 8px;
            }

            .grid-container {
                display: flex;
                gap: 12px;
                align-items: center;
                padding: 8px;
            }

            .icon-area-grid {
                display: grid;
                grid-template-columns: repeat(3, 50px);
                grid-template-rows: repeat(3, 50px);
                gap: 6px;
                background: var(--primary-background-color, #fff);
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 12px;
            }

            .area-cell {
                width: 50px;
                height: 50px;
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                font-size: 20px;
            }

            .area-cell.clickable {
                background: var(--disabled-text-color, #9e9e9e);
            }

            .area-cell.clickable:hover:not(.disabled) {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                transform: scale(1.05);
            }

            .area-cell.selected {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 2px var(--primary-color, #03a9f4);
            }

            .area-cell.selected::after {
                content: '✓';
                color: white;
                font-size: 24px;
                font-weight: bold;
            }

            .area-cell.center {
                background: var(--primary-background-color, #f5f5f5);
                border-color: var(--secondary-text-color, #757575);
                cursor: default;
                pointer-events: none;
            }

            .area-cell.center::before {
                content: 'Text';
                color: var(--secondary-text-color, #757575);
                font-size: 11px;
                font-weight: 500;
            }

            .area-cell.none-option {
                grid-column: 1 / -1;
                width: auto;
                background: var(--disabled-text-color, #9e9e9e);
                cursor: pointer;
                margin-top: 6px;
            }

            .area-cell.none-option:hover:not(.disabled) {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
            }

            .area-cell.none-option.selected {
                background: var(--primary-color, #03a9f4);
            }

            .area-cell.none-option::before {
                content: 'None (No Divider)';
                color: white;
                font-size: 13px;
                font-weight: 500;
            }

            .area-cell.none-option.selected::before {
                content: '';
            }

            .area-cell.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .selected-label {
                font-size: 14px;
                color: var(--primary-text-color, #212121);
                font-weight: 500;
                padding: 4px 8px;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 4px;
                min-width: 120px;
                text-align: center;
            }

            .helper {
                font-size: 12px;
                color: var(--secondary-text-color, #757575);
                padding: 0 8px;
            }

            /* Corner cells - not clickable, visual only */
            .area-cell.corner {
                background: transparent;
                border: none;
                pointer-events: none;
            }
        `}_getAreaValue(e,t){return{"0,1":"top","1,0":"left","1,2":"right","2,1":"bottom"}[`${e},${t}`]||null}_getGridCoordinates(e){return{top:{row:0,col:1},left:{row:1,col:0},right:{row:1,col:2},bottom:{row:2,col:1}}[e]||null}_handleCellClick(e,t){if(this.disabled)return;const o=this._getAreaValue(e,t);o&&(this.value=o,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:o},bubbles:true,composed:true})))}_handleNoneClick(){this.disabled||(this.value="none",this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:"none"},bubbles:true,composed:true})))}_getDisplayLabel(){return{top:"Top",bottom:"Bottom",left:"Left",right:"Right",none:"None (No Divider)"}[this.value]||"Left"}render(){const e=this._getGridCoordinates(this.value);return n`
            <div class="icon-area-picker">
                ${this.label?n`<div class="label">${this.label}</div>`:""}

                <div class="grid-container">
                    <div class="icon-area-grid">
                        ${[0,1,2].map(t=>[0,1,2].map(o=>{if(this._getAreaValue(t,o),t===1&&o===1)return n`
                                    <div class="area-cell center"></div>
                                `;if(t===0&&o===0||t===0&&o===2||t===2&&o===0||t===2&&o===2)return n`
                                    <div class="area-cell corner"></div>
                                `;const i=e&&e.row===t&&e.col===o&&this.value!=="none";return n`
                                <div
                                    class="area-cell clickable ${i?"selected":""} ${this.disabled?"disabled":""}"
                                    @click=${()=>this._handleCellClick(t,o)}>
                                </div>
                            `}))}

                        <!-- None option -->
                        <div
                            class="area-cell none-option ${this.value==="none"?"selected":""} ${this.disabled?"disabled":""}"
                            @click=${this._handleNoneClick}>
                        </div>
                    </div>

                    <div class="selected-label">
                        ${this._getDisplayLabel()}
                    </div>
                </div>

                ${this.helper?n`<div class="helper">${this.helper}</div>`:""}
            </div>
        `}};g(M,"LCARdSIconAreaPicker");let z=M;customElements.get("lcards-icon-area-picker")||customElements.define("lcards-icon-area-picker",z);const T=class T2 extends E{static get properties(){return{editor:{type:Object},basePath:{type:String},header:{type:String},description:{type:String},expanded:{type:Boolean},suggestedStates:{type:Array},allowCustomStates:{type:Boolean},_expandedStates:{attribute:false,state:true},_customStateInput:{type:String,state:true},_rangeOperator:{type:String,state:true},_rangeMin:{type:String,state:true},_rangeMax:{type:String,state:true},_guideExpanded:{type:Boolean,state:true}}}constructor(){super(),this.editor=null,this.basePath="",this.header="Per-state Icons",this.description="",this.expanded=false,this.suggestedStates=["default","active","inactive","unavailable","zero","non_zero"],this.allowCustomStates=true,this._expandedStates=new Set,this._customStateInput="",this._rangeOperator="above",this._rangeMin="",this._rangeMax="",this._guideExpanded=false}static get styles(){return[W,A`
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

                /* Action buttons */
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

                /* Icon preview in header */
                .icon-preview {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--secondary-text-color);
                    font-size: 13px;
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

                /* Icon picker wrapper */
                .editor-item-content {
                    position: relative;
                    padding: 8px 12px 12px;
                }

                .editor-item-content ha-selector {
                    display: block;
                    width: 100%;
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
            `]}render(){if(!this.editor)return n`
                <ha-alert alert-type="error">
                    Icon section requires 'editor' property
                </ha-alert>
            `;const e=this._getCurrentStates(),t=Object.keys(e).length;return n`
            <lcards-form-section
                header="${this.header}"
                description="${this.description}"
                ?expanded=${this.expanded}
                icon="mdi:swap-horizontal"
                outlined>

                <!-- Existing States (List) -->
                ${t===0?this._renderEmptyState():n`
                    <div class="editor-list">
                        ${Object.entries(e).map(([o,i])=>this._renderIconStateItem(o,i))}
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
                    ${this._guideExpanded?n`
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
                    </div>
                    `:""}
                </div>

                <!-- Add State Controls -->
                ${this._renderAddStateControls()}
            </lcards-form-section>
        `}_renderEmptyState(){return n`
            <div class="empty-state">
                <ha-icon icon="mdi:shape"></ha-icon>
                <div style="font-weight: 500; margin-bottom: 8px;">No per-state icons configured</div>
                <div style="font-size: 13px;">
                    Add a suggested state or create a custom state below.<br>
                    Falls back to the top-level <code>icon</code> field when no state matches.
                </div>
            </div>
        `}_renderIconStateItem(e,t){const o=this._expandedStates.has(e);return n`
            <div class="editor-item">
                <!-- Header (Clickable to Expand) -->
                <div class="editor-item-header" @click=${()=>this._toggleState(e)}>
                    <!-- State Info -->
                    <div class="editor-item-info">
                        <div class="editor-item-title">${this._formatStateLabel(e)}</div>
                        <div class="editor-item-subtitle icon-preview">
                            ${t?n`<ha-icon .icon=${t}></ha-icon> ${t}`:n`<span style="font-style:italic">Not set</span>`}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="editor-item-actions">
                        <ha-icon-button
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                            @click=${i=>this._deleteState(i,e)}>
                        </ha-icon-button>
                    </div>

                    <!-- Expand Icon -->
                    <ha-icon
                        class="expand-icon ${o?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                <!-- Content (Icon Picker) -->
                ${o?n`
                    <div class="editor-item-content">
                        <ha-selector
                            .hass=${this.editor.hass}
                            .label=${this._formatStateLabel(e)+" icon"}
                            .value=${t||""}
                            .selector=${{icon:{}}}
                            @value-changed=${i=>this._handleIconChange(e,i)}>
                        </ha-selector>
                    </div>
                `:""}
            </div>
        `}_renderAddStateControls(){const e=this._getCurrentStates(),t=Object.keys(e),o=this.suggestedStates.filter(i=>!t.includes(i));return n`
            <div class="add-state-controls">
                <!-- Quick Add Buttons for Suggested States -->
                ${o.length>0?n`
                    <div class="quick-add-section">
                        <div class="field-label">Quick Add States</div>
                        <div class="quick-add-buttons">
                            ${o.map(i=>n`
                                <ha-button
                                    @click=${()=>this._addState(i)}
                                    outlined>
                                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                    ${this._formatStateLabel(i)}
                                </ha-button>
                            `)}
                        </div>
                    </div>
                `:n`
                    <div class="no-suggested-states">
                        All suggested states have been added
                    </div>
                `}

                <!-- Custom State Input (if enabled) -->
                ${this.allowCustomStates?n`
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
                        ${this._isBetweenOperator()?n`
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
        `}_getCurrentStates(){const e=this.editor._getConfigValue(this.basePath);return typeof e=="string"&&e?{default:e}:typeof e=="object"&&e!==null?e:{}}_toggleState(e){this._expandedStates.has(e)?this._expandedStates.delete(e):this._expandedStates.add(e),this.requestUpdate()}_handleIconChange(e,t){const o=this._getCurrentStates();o[e]=t.detail.value,this.editor._setConfigValue(this.basePath,o),_.debug("[IconSection] Icon changed",{state:e,value:t.detail.value})}_handleCustomStateInput(e){this._customStateInput=e.detail.value??""}_handleCustomStateKeydown(e){e.key==="Enter"&&(e.preventDefault(),this._addCustomState())}_addCustomState(){const e=(this._customStateInput||"").trim().toLowerCase();if(!e){this._showError("Please enter a state name");return}if(!/^[a-z0-9_-]+$/.test(e)){this._showError("State name must be alphanumeric with optional underscores/hyphens");return}if(this._hasState(e)){this._showError(`State "${e}" already exists`);return}this._addState(e),this._customStateInput="",_.info("[IconSection] Added custom state",{state:e})}_handleRangeOperatorChange(e){this._rangeOperator=e.detail.value}_handleRangeMinChange(e){var o;const t=(o=e.detail)==null?void 0:o.value;this._rangeMin=t!=null?String(t):""}_handleRangeMaxChange(e){var o;const t=(o=e.detail)==null?void 0:o.value;this._rangeMax=t!=null?String(t):""}_isBetweenOperator(){return this._rangeOperator==="between"||this._rangeOperator==="between_exclusive"}_isValidRangeForm(){const e=parseFloat(this._rangeMin);if(isNaN(e))return false;if(this._isBetweenOperator()){const t=parseFloat(this._rangeMax);if(isNaN(t)||e>=t)return false}return true}_buildRangeKey(){return this._isBetweenOperator()?`${this._rangeOperator}:${this._rangeMin}:${this._rangeMax}`:`${this._rangeOperator}:${this._rangeMin}`}_addRangeCondition(){if(!this._isValidRangeForm())return;const e=this._buildRangeKey();if(this._hasState(e)){this._showError(`Range condition "${e}" already exists`);return}this._addState(e),this._rangeMin="",this._rangeMax="",_.info("[IconSection] Added range condition",{key:e})}_addState(e){const t=this._getCurrentStates();if(t[e]!==void 0){_.debug("[IconSection] State already exists:",e);return}const o={...t,[e]:""};this.editor._setConfigValue(this.basePath,o),this._expandedStates.add(e),this.requestUpdate(),_.info("[IconSection] Added state",{state:e})}async _deleteState(e,t){if(e.stopPropagation(),!await this._showConfirmDialog("Delete State",`Delete "${t}" icon state?`))return;const i=this._getCurrentStates();delete i[t],this.editor._setConfigValue(this.basePath,i),this._expandedStates.delete(t),this.requestUpdate(),_.info("[IconSection] Deleted state",{state:t})}_formatStateLabel(e){if(e.startsWith("above:"))return`Above ${e.slice(6)}`;if(e.startsWith("at_least:"))return`At Least ${e.slice(9)}`;if(e.startsWith("below:"))return`Below ${e.slice(6)}`;if(e.startsWith("at_most:"))return`At Most ${e.slice(8)}`;const t=e.match(/^between_exclusive:(-?[\d.]+):(-?[\d.]+)$/);if(t)return`Between ${t[1]}–${t[2]} (exclusive)`;const o=e.match(/^between:(-?[\d.]+):(-?[\d.]+)$/);return o?`Between ${o[1]}–${o[2]}`:e.split(/[-_]/).map(i=>i.charAt(0).toUpperCase()+i.slice(1)).join(" ")}_hasState(e){return this._getCurrentStates()[e]!==void 0}async _showError(e){await this._showDialog("Error",e,"error"),_.warn("[IconSection] Error",{message:e})}async _showDialog(e,t,o="info"){return new Promise(i=>{const s=document.createElement("ha-dialog");s.headerTitle=e,s.open=true;const a=document.createElement("div");a.innerHTML=t,a.style.padding="16px",s.appendChild(a);const r=document.createElement("ha-button");r.slot="footer",r.textContent="OK",r.addEventListener("click",()=>{s.open=false,i(void 0)}),s.appendChild(r),s.addEventListener("closed",()=>s.remove()),N(s,this)})}async _showConfirmDialog(e,t){return new Promise(o=>{const i=document.createElement("ha-dialog");i.headerTitle=e,i.open=true;const s=document.createElement("div");s.innerHTML=t,s.style.padding="16px",s.style.lineHeight="1.5",i.appendChild(s);const a=document.createElement("ha-button");a.textContent="Cancel",a.setAttribute("appearance","plain"),a.addEventListener("click",()=>{i.open=false,o(false)});const r=document.createElement("ha-button");r.textContent="Delete",r.setAttribute("variant","danger"),r.addEventListener("click",()=>{i.open=false,o(true)});const l=document.createElement("div");l.slot="footer",l.appendChild(a),l.appendChild(r),i.appendChild(l),i.addEventListener("closed",()=>i.remove()),N(i,this)})}};g(T,"LCARdSIconSection");let V=T;customElements.get("lcards-icon-section")||customElements.define("lcards-icon-section",V);const F=class F2 extends E{static get properties(){return{editor:{type:Object},hass:{type:Object},config:{type:Object}}}constructor(){super(),this.editor=null,this.hass=null,this.config=null}static get styles(){return A`
            :host {
                display: block;
            }
        `}render(){var t,o;if(!this.editor)return n`<div>Icon editor requires 'editor' property</div>`;const e=(t=this.config)==null?void 0:t.show_icon;return n`
            <!-- Basic Icon Settings -->
            <lcards-form-section
                header="Icon Configuration"
                description="Enable and select icon"
                icon="mdi:shape"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${S.renderField(this.editor,"show_icon",{label:"Show Icon"})}

                ${e?n`
                    ${S.renderField(this.editor,"icon",{label:"Icon"})}
                `:""}
            </lcards-form-section>

            ${e?n`
                <!-- Icon Area Section -->
                <lcards-form-section
                    header="Icon Area"
                    description="Reserved space for icon on button"
                    icon="mdi:page-layout-sidebar-left"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="4">

                    <lcards-icon-area-picker
                        .value=${((o=this.config)==null?void 0:o.icon_area)||"left"}
                        label="Icon Area"
                        helper="Where icon's reserved space is ('none' = no divider, absolute positioning)"
                        @value-changed=${i=>this.editor._setConfigValue("icon_area",i.detail.value)}>
                    </lcards-icon-area-picker>

                    ${S.renderField(this.editor,"icon_area_size",{label:"Area Size",helper:"Override calculated area size (width for left/right, height for top/bottom)"})}

                    <lcards-color-section-v2
                        .editor=${this.editor}
                        .config=${this.editor.config}
                        basePath="icon_area_background"
                        header="Area Background"
                        description="Background colour for entire icon area (matches legacy cards)"
                        .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>

                    <!-- Divider Configuration -->
                    <lcards-form-section
                        header="Divider"
                        description="Line between icon area and text area"
                        icon="mdi:format-line-weight"
                        ?expanded=${false}
                        ?outlined=${true}
                        headerLevel="5">

                        ${S.renderField(this.editor,"divider.width",{label:"Width",helper:"Divider line width (default: 6)"})}

                        <lcards-color-picker
                            .hass=${this.hass}
                            .value=${this.editor._getConfigValue("divider.color")||""}
                            @value-changed=${i=>this.editor._setConfigValue("divider.color",i.detail.value)}>
                        </lcards-color-picker>
                    </lcards-form-section>
                </lcards-form-section>

                <!-- Icon Style Section -->
                <lcards-form-section
                    header="Icon Style"
                    description="Icon appearance and positioning"
                    icon="mdi:format-size"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="4">

                    ${S.renderField(this.editor,"icon_style.position",{label:"Position",helper:"Where to display the icon within its area"})}

                    ${S.renderField(this.editor,"icon_style.size",{label:"Size"})}

                    ${S.renderField(this.editor,"icon_style.rotation",{label:"Rotation (degrees)"})}

                    <!-- Padding Configuration -->
                    <lcards-form-section
                        header="Padding"
                        description="Space around icon"
                        icon="mdi:arrow-expand-all"
                        ?expanded=${false}
                        ?outlined=${true}
                        headerLevel="5">

                        <lcards-padding-editor
                            .editor=${this.editor}
                            path="icon_style.padding"
                            label="Icon Padding"
                            helper="Spacing around the icon">
                        </lcards-padding-editor>
                    </lcards-form-section>

                    <!-- Icon Colors -->
                    <lcards-color-section-v2
                        .editor=${this.editor}
                        .config=${this.editor.config}
                        basePath="icon_style.color"
                        header="Icon Colour"
                        description="Foreground icon colour"
                        .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>

                    <!-- Per-state Icons -->
                    <lcards-icon-section
                        .editor=${this.editor}
                        basePath="icon_style.icon"
                        header="Per-state Icons"
                        description="Override icon based on entity state"
                        .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-icon-section>
                </lcards-form-section>
            `:""}
        `}};g(F,"LCARdSIconEditor");let O=F;customElements.get("lcards-icon-editor")||customElements.define("lcards-icon-editor",O);const L=class L2 extends E{static get properties(){return{editor:{type:Object},mode:{type:String},componentType:{type:String},segments:{type:Object},predefinedSegmentIds:{type:Array},discoveredSegmentIds:{type:Array},showDefaults:{type:Boolean},hass:{type:Object},_expandedSegments:{type:Set,state:true}}}constructor(){super(),this.editor=void 0,this.hass=void 0,this.mode="custom",this.componentType=null,this.segments={},this.predefinedSegmentIds=[],this.discoveredSegmentIds=[],this.showDefaults=false,this._expandedSegments=new Set}_getBasePrefix(){return this.componentType?this.componentType:this.mode==="dpad"?"dpad":"svg"}static get styles(){return A`
            :host {
                display: block;
            }

            .segments-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .add-button {
                margin-top: 16px;
            }

            .section-label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                margin-bottom: 8px;
            }

            .section-description {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                margin-bottom: 12px;
            }

            .form-row {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }

            .form-row label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
            }

            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                margin-top: 4px;
            }

            .delete-button {
                margin-top: 16px;
            }
        `}_getSegmentIdList(){if(this.mode==="dpad")return this.predefinedSegmentIds;{const e=Object.keys(this.segments||{}).filter(o=>o!=="default"),t=new Set([...this.discoveredSegmentIds,...e]);return Array.from(t)}}_getSegmentIcon(e){return this.mode==="dpad"?{center:"mdi:gamepad-round",up:"mdi:gamepad-up",down:"mdi:gamepad-down",left:"mdi:gamepad-left",right:"mdi:gamepad-right","up-left":"mdi:numeric-1-circle","up-right":"mdi:numeric-2-circle","down-left":"mdi:numeric-3-circle","down-right":"mdi:numeric-4-circle"}[e]||"mdi:gamepad":"mdi:vector-square"}_formatSegmentLabel(e){return e?e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" "):"Segment"}_getBasePath(e){return`${this._getBasePrefix()}.segments.${e}`}_deleteSegment(e){const t={...this.segments};delete t[e],this.editor._setConfigValue(`${this._getBasePrefix()}.segments`,t)}async _handleAddSegment(){const e=await H({title:"Add segment",message:"The segment ID must match an element id in your SVG.",label:"Segment ID",confirmText:"Add"});if(e){const t=`svg.segments.${e.trim()}`;this.editor._setConfigValue(`${t}.tap_action`,{action:"none"})}}render(){const e=this._getSegmentIdList();return n`
            ${this.showDefaults?this._renderDefaultSection():""}

            <div class="segments-list">
                ${e.map(t=>this._renderSegment(t))}
            </div>

            ${this.mode==="custom"?n`
                <ha-button
                    class="add-button"
                    appearance="filled"
                    variant="brand"
                    @click=${this._handleAddSegment}>
                    <ha-icon slot="start" icon="mdi:plus"></ha-icon>
                    Add Segment
                </ha-button>
            `:""}
        `}_renderDefaultSection(){var o;const e=`${this._getBasePrefix()}.segments.default`,t=((o=this.segments)==null?void 0:o.default)||{};return n`
            <lcards-form-section
                header="Default Configuration"
                description="Applied to all segments unless overridden"
                icon="mdi:cog-outline"
                ?expanded=${true}
                ?outlined=${true}>

                <!-- Default Actions -->
                <div class="section-label">Default Actions</div>
                <div class="section-description">
                    Applied to all segments unless overridden (${e})
                </div>
                <lcards-multi-action-editor
                    .hass=${this.hass}
                    .actions=${this._getDefaultActions()}
                    @value-changed=${this._handleDefaultActionsChange}>
                </lcards-multi-action-editor>

                <!-- Default Style -->
                <lcards-form-section
                    header="Default SVG Style"
                    description="Default SVG styling properties"
                    icon="mdi:palette-outline"
                    ?expanded=${false}>

                    <lcards-color-section-v2
                        .editor=${this.editor}
                        .config=${this.editor.config}
                        basePath="${e}.style.fill"
                        header="Fill"
                        description="SVG fill colour states - supports custom states like 'heat', 'cool', 'playing', etc."
                        .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>

                    <lcards-color-section-v2
                        .editor=${this.editor}
                        .config=${this.editor.config}
                        basePath="${e}.style.stroke"
                        header="Stroke"
                        description="SVG stroke colour states - supports custom states like 'heat', 'cool', 'playing', etc."
                        .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Stroke Width"}
                        .helper=${"SVG stroke width (number or string)"}
                        .selector=${{text:{}}}
                        .value=${this.editor._getConfigValue(`${e}.style.stroke-width`)||""}
                        @value-changed=${i=>this.editor._setConfigValue(`${e}.style.stroke-width`,i.detail.value)}>
                    </ha-selector>
                </lcards-form-section>

                <!-- Default Animations -->
                <lcards-form-section
                    header="Default Segment Animations"
                    description="Default animations for all segments"
                    icon="mdi:animation"
                    ?expanded=${false}>

                    <lcards-message type="info">
                        <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                            These animations apply to <strong>all segments</strong> unless overridden. For card-wide animations, use the Effects tab.
                        </p>
                    </lcards-message>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${t.animations||[]}
                        .cardElement=${this.editor._cardElement}
                        @animations-changed=${i=>{this.editor._setConfigValue(`${e}.animations`,i.detail.value)}}>
                    </lcards-animation-editor>
                </lcards-form-section>
            </lcards-form-section>
        `}_getDefaultActions(){var t;const e=((t=this.segments)==null?void 0:t.default)||{};return{tap_action:e.tap_action||{action:"none"},hold_action:e.hold_action||{action:"none"},double_tap_action:e.double_tap_action||{action:"none"}}}_handleDefaultActionsChange(e){const t=e.detail.value,o=`${this._getBasePrefix()}.segments.default`;["tap_action","hold_action","double_tap_action"].forEach(i=>{var s;if(((s=t[i])==null?void 0:s.action)!=="none")this.editor._setConfigValue(`${o}.${i}`,t[i]);else{const r={...this.editor._getConfigValue(o)||{}};delete r[i],this.editor._setConfigValue(o,r)}})}_renderSegment(e){var r;(r=this.segments)!=null&&r[e];const t=this._getSegmentIcon(e),o=this._formatSegmentLabel(e),i=this._expandedSegments.has(e),s=this.mode==="dpad"||!!this.componentType,a=this.discoveredSegmentIds.includes(e);return n`
            <lcards-form-section
                header="${o}"
                secondary="${e}"
                icon="${t}"
                ?expanded=${i}
                ?outlined=${true}
                headerLevel="4"
                @expanded-changed=${l=>this._handleSegmentToggle(e,l)}>

                ${i?n`
                    <!-- Show manual selector field for custom mode if not auto-discovered -->
                    ${!s&&!a?n`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"CSS Selector"}
                            .helper=${"Element selector (e.g., #id, .class, [data-segment='name'])"}
                            .selector=${{text:{}}}
                            .value=${this.editor._getConfigValue(`${this._getBasePath(e)}.selector`)||""}
                            @value-changed=${l=>this.editor._setConfigValue(`${this._getBasePath(e)}.selector`,l.detail.value)}>
                        </ha-selector>
                    `:""}

                    <!-- Entity Override -->
                    <div class="form-row">
                        <label>Entity Override</label>
                        <ha-entity-picker
                            .hass=${this.hass}
                            .value=${this.editor._getConfigValue(`${this._getBasePath(e)}.entity`)||""}
                            @value-changed=${l=>this.editor._setConfigValue(`${this._getBasePath(e)}.entity`,l.detail.value)}
                            allow-custom-entity>
                        </ha-entity-picker>
                        <div class="helper-text">Optional entity for this segment (overrides card entity)</div>
                    </div>

                    <!-- Actions -->
                    <div class="section-label">Actions</div>
                    <div class="section-description">
                        Override default actions for this segment
                    </div>
                    <lcards-multi-action-editor
                        .hass=${this.hass}
                        .actions=${this._getSegmentActions(e)}
                        @value-changed=${l=>this._handleSegmentActionsChange(e,l)}>
                    </lcards-multi-action-editor>

                    <!-- Animations -->
                    ${this._renderSegmentAnimations(e)}

                    <!-- SVG Style -->
                    ${this._renderSegmentStyle(e)}

                    <!-- Delete Button (custom mode only) -->
                    ${s?"":n`
                        <ha-button
                            class="delete-button"
                            appearance="filled"
                            variant="danger"
                            @click=${()=>this._deleteSegment(e)}>
                            <ha-icon slot="start" icon="mdi:delete"></ha-icon>
                            Delete Segment
                        </ha-button>
                    `}
                `:""}
            </lcards-form-section>
        `}_handleSegmentToggle(e,t){t.detail.expanded?this._expandedSegments.add(e):this._expandedSegments.delete(e),this.requestUpdate()}_getSegmentActions(e){var o;const t=((o=this.segments)==null?void 0:o[e])||{};return{tap_action:t.tap_action||{action:"none"},hold_action:t.hold_action||{action:"none"},double_tap_action:t.double_tap_action||{action:"none"}}}_handleSegmentActionsChange(e,t){const o=t.detail.value,i=this._getBasePath(e);["tap_action","hold_action","double_tap_action"].forEach(s=>{var a;if(((a=o[s])==null?void 0:a.action)!=="none")this.editor._setConfigValue(`${i}.${s}`,o[s]);else{const l={...this.editor._getConfigValue(i)||{}};delete l[s],this.editor._setConfigValue(i,l)}})}_renderSegmentAnimations(e){var a,r,l;const t=this._getBasePath(e),i=(((a=this.segments)==null?void 0:a[e])||{}).animations||[],s=(((l=(r=this.editor._cardElement)==null?void 0:r._componentAnimations)==null?void 0:l.length)??0)>0;return n`
            <lcards-form-section
                header="Segment Animations"
                description="Animations triggered only when this specific segment is interacted with"
                icon="mdi:animation"
                ?expanded=${false}>

                ${s?n`
                    <lcards-message type="warning">
                        This component has card-level animations (Effects tab). Segment animations run alongside them,
                        so don't repeat a preset here.
                    </lcards-message>
                `:n`
                    <lcards-message type="info">
                        <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                            These animations trigger <strong>only for this segment</strong>. For card-wide animations, use the Effects tab.
                        </p>
                    </lcards-message>
                `}

                <lcards-animation-editor
                    .hass=${this.hass}
                    .animations=${i}
                    .cardElement=${this.editor._cardElement}
                    @animations-changed=${c=>{this.editor._setConfigValue(`${t}.animations`,c.detail.value)}}>
                </lcards-animation-editor>
            </lcards-form-section>
        `}_renderSegmentStyle(e){const t=this._getBasePath(e);return n`
            <lcards-form-section
                header="SVG Style Override"
                description="Override default SVG styling"
                icon="mdi:palette-outline"
                ?expanded=${false}>

                <lcards-color-section-v2
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="${t}.style.fill"
                    header="Fill"
                    description="SVG fill colour states - supports custom states like 'heat', 'cool', 'playing', etc."
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <lcards-color-section-v2
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="${t}.style.stroke"
                    header="Stroke"
                    description="SVG stroke colour states - supports custom states like 'heat', 'cool', 'playing', etc."
                    .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Stroke Width"}
                    .helper=${"SVG stroke width (overrides default)"}
                    .selector=${{text:{}}}
                    .value=${this.editor._getConfigValue(`${t}.style.stroke-width`)||""}
                    @value-changed=${o=>this.editor._setConfigValue(`${t}.style.stroke-width`,o.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Opacity"}
                    .helper=${"SVG opacity (0.0 = transparent, 1.0 = opaque)"}
                    .selector=${{number:{min:0,max:1,step:.1,mode:"box"}}}
                    .value=${this.editor._getConfigValue(`${t}.style.opacity`)||""}
                    @value-changed=${o=>this.editor._setConfigValue(`${t}.style.opacity`,o.detail.value)}>
                </ha-selector>
            </lcards-form-section>
        `}};g(L,"LCARdSUnifiedSegmentEditor");let I=L;customElements.get("lcards-unified-segment-editor")||customElements.define("lcards-unified-segment-editor",I);const R=class R2 extends Z{constructor(){super(),this.editor=void 0,this.cardType="button",this._cardElement=null}_getButtonPresetOptions(){var t,o;const e=(o=(t=window.lcards)==null?void 0:t.core)==null?void 0:o.stylePresetManager;return e?e.getAvailablePresets("button").map(i=>({value:i,label:i.replace(/-/g," ").replace(/\b\w/g,s=>s.toUpperCase())})):[]}static get styles(){return[super.styles,J]}firstUpdated(){var e;(e=super.firstUpdated)==null||e.call(this,{}),this._tryFindCardElement()}_tryFindCardElement(){let e=0;const t=10,o=g(()=>{e++,this._findCardElement(),!this._cardElement&&e<t&&requestAnimationFrame(o)},"tryFind");requestAnimationFrame(o)}_findCardElement(){var i;const e=`lcards-${this.cardType}`;if((i=this._cardElement)!=null&&i.isConnected)return;let t=null;const o=this.closest(".wrapper");if(o){const s=o.getRootNode();if(s instanceof ShadowRoot){const a=s.host;if(a){const r=a.parentElement;if(r){const l=r.parentElement;if(l){const c=l.querySelector(".element-preview");if(c){const h=g((p,d=0)=>{if(d>5)return null;const u=p.querySelector(e);if(u)return u;const m=p.querySelectorAll("*");for(const f of m)if(f.shadowRoot){const b=h(f.shadowRoot,d+1);if(b)return b}return null},"searchInShadows");t=c.querySelector(e),t||(t=h(c)),t||_.warn("[ButtonEditor] Card preview not found in .element-preview")}else _.warn("[ButtonEditor] .element-preview not found in editor dialog")}}}}}if(!t&&(t=document.querySelector(e),!t)){const s=document.querySelectorAll("*");for(const a of s)if(a.shadowRoot&&(t=a.shadowRoot.querySelector(e),t))break}t&&t!==this._cardElement&&(this._cardElement=t,this.requestUpdate())}get _effectiveAnimations(){var s;const e=((s=this._cardElement)==null?void 0:s._componentAnimations)||[],t=this.config.animations||[],o=new Set(e.map(a=>a.id).filter(Boolean)),i=e.map(a=>{const r=t.find(c=>c.id===a.id);if(!r)return{...a};const l={...a};return r.enabled===false?l.enabled=false:delete l.enabled,r.trigger!==void 0&&(l.trigger=r.trigger),r.params&&(l.params={...a.params,...r.params}),l});for(const a of t)(!a.id||!o.has(a.id))&&i.push({...a});return i}_getAttributeOptions(){var i,s,a;const e=(i=this.config)==null?void 0:i.entity;if(!e||!((a=(s=this.hass)==null?void 0:s.states)!=null&&a[e]))return[];const t=this.hass.states[e];return Object.keys(t.attributes||{}).sort()}_renderAttributeSelector(){var a,r,l,c,h,p,d,u;const e=((r=(a=this.config)==null?void 0:a.control)==null?void 0:r.attribute)||"",t=(l=this.config)==null?void 0:l.entity,o=e&&t&&((h=(c=this.hass)==null?void 0:c.states)==null?void 0:h[t])&&!((p=this.hass.states[t].attributes)!=null&&p.hasOwnProperty(e)),i=t&&((u=(d=this.hass)==null?void 0:d.states)!=null&&u[t])?Object.keys(this.hass.states[t].attributes||{}).sort().map(m=>({value:m,label:m})):[],s=[{value:"__none__",label:"(Control entity state)"},...i];return n`
            <ha-selector
                .hass=${this.hass}
                .label=${"Attribute"}
                .helper=${'Entity attribute to control. Select "(Control entity state)" to clear.'}
                .disabled=${!t}
                .selector=${{select:{mode:"dropdown",options:s,custom_value:true}}}
                .value=${e||"__none__"}
                @value-changed=${this._handleAttributeChange}>
            </ha-selector>
            ${o?n`
                <lcards-message
                    type="warning"
                    message="The specified attribute '${e}' does not exist on this entity. The button will control entity state instead.">
                </lcards-message>
            `:""}
        `}_handleAttributeChange(e){const t=(e.detail.value??"").trim();t&&t!=="__none__"?this._setConfigValue("control.attribute",t):this._removeConfigPath("control.attribute")}_renderComponentPresetSelector(){var l,c,h,p,d,u,m,f,b,y;const e=(l=this.config)==null?void 0:l.component;if(!e)return n``;const t=(u=(d=(p=(h=(c=window.lcards)==null?void 0:c.core)==null?void 0:h.getComponentManager)==null?void 0:p.call(h))==null?void 0:d.getComponent)==null?void 0:u.call(d,e),o=((m=t==null?void 0:t.getPresetNames)==null?void 0:m.call(t))||[],i=Object.keys(((b=(f=this.config)==null?void 0:f[e])==null?void 0:b.custom_presets)||{}),s=[...o];for(const x of i)s.includes(x)||s.push(x);if(s.length===0)return n``;const a=s.map(x=>({value:x,label:x.replace(/_/g," ").replace(/\b\w/g,v=>v.toUpperCase())})),r=((y=this.config)==null?void 0:y.preset)||"default";return n`
            <ha-selector
                .hass=${this.hass}
                .label=${"Component Preset"}
                .helper=${`Choose the condition/state preset for this ${e} component`}
                .selector=${{select:{mode:"dropdown",options:a}}}
                .value=${r}
                @value-changed=${x=>this._setConfigValue("preset",x.detail.value)}>
            </ha-selector>
        `}_getMode(){return this.config.component?"component":this.config.svg!==void 0?"svg":"preset"}_getTabDefinitions(){const e=this._getMode(),t=[{label:"Config",content:g(()=>this._renderFromConfig(this._getConfigTabConfig()),"content")}];return e==="preset"&&t.push({label:"Card & Border",content:g(()=>this._renderFromConfig(this._getCardBorderTabConfig()),"content")},{label:"Zones",content:g(()=>this._renderZonesTab(),"content")},{label:"Text",content:g(()=>this._renderTextTab(),"content")},{label:"Icon",content:g(()=>this._renderIconTab(),"content")}),(e==="component"||e==="svg")&&t.push({label:"Segments",content:g(()=>this._renderSegmentsTab(),"content")}),e==="component"&&t.push({label:"Zones",content:g(()=>this._renderZonesTab(),"content")},{label:"Text",content:g(()=>this._renderTextTab(),"content")}),e==="preset"&&t.push({label:"Actions",content:g(()=>this._renderActionsTab(),"content")}),t.push({label:"Effects",content:g(()=>this._renderEffectsTab(),"content")}),t.push({label:"Sound",content:g(()=>this._renderSoundTab(["card_tap","card_hold","card_double_tap","card_hover","toggle_on","toggle_off"]),"content")}),[...t,...this._getUtilityTabs()]}_getConfigTabConfig(){const e=this._getMode(),t=this._buildConfigTab({infoMessage:"Configure the basic settings for your LCARdS button card. Select an entity to control or leave blank for a static button.",showBasicSection:false,modeSections:[{type:"section",header:"Button Configuration",description:"Choose between preset buttons, custom SVG, or interactive components",icon:"mdi:cog",expanded:true,outlined:true,children:[{type:"custom",render:g(()=>n`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${"Mode"}
                                    .helper=${e==="preset"?"Preset mode: Use shape presets with text, icons, and styling":e==="svg"?"Custom SVG mode: Use your own SVG with interactive segments":"Component mode: Use complex interactive components like dpads"}
                                    .selector=${{select:{mode:"dropdown",options:[{value:"preset",label:"Buttons (preset: lozenge, bullet, etc.)"},{value:"component",label:"SVG Components (component: dpad, etc.)"},{value:"svg",label:"Custom SVG with Segments (svg: )"}]}}}
                                    .value=${e}
                                    @value-changed=${this._handleModeChange}>
                                </ha-selector>
                            `,"render")},...e==="preset"?[{type:"custom",render:g(()=>G(e,n`
                                    <ha-selector
                                        .hass=${this.hass}
                                        .selector=${{select:{mode:"dropdown",options:this._getButtonPresetOptions()}}}
                                        .value=${this.config.preset||"lozenge"}
                                        .label=${"Preset Style"}
                                        @value-changed=${o=>this._setConfigValue("preset",o.detail.value)}>
                                    </ha-selector>
                                `),"render")}]:[],...e==="component"?[{type:"custom",render:g(()=>G(e,n`
                                    <ha-selector
                                        .hass=${this.hass}
                                        .selector=${{select:{mode:"dropdown",options:K("button").map(o=>({value:o,label:o.charAt(0).toUpperCase()+o.slice(1)}))}}}
                                        .value=${this.config.component||"dpad"}
                                        .label=${"Component Type"}
                                        @value-changed=${o=>this._handleComponentTypeChange(o.detail.value)}>
                                    </ha-selector>
                                `),"render")},{type:"custom",render:g(()=>this._renderComponentPresetSelector(),"render")},{type:"custom",render:g(()=>n`
                                    <lcards-message
                                        type="info"
                                        message="Use the Segments tab to colour the component segments. Use the Text tab to override label content.">
                                    </lcards-message>
                                `,"render")}]:[],...e==="svg"?[{type:"custom",render:g(()=>n`
                                    <lcards-message
                                        type="info"
                                        message="Use the Segments tab to configure your custom SVG content and segment interactions.">
                                    </lcards-message>
                                `,"render")}]:[]]}]});return t.splice(2,0,{type:"section",header:"Entity Configuration",description:"Entity to control and attributes",icon:"mdi:home-automation",expanded:false,outlined:true,children:[{type:"custom",render:g(()=>{var o;return n`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Entity"}
                            .value=${((o=this.config)==null?void 0:o.entity)||""}
                            .selector=${{entity:{}}}
                            @value-changed=${i=>{const s=i.detail.value;s?this._setConfigValue("entity",s):this._removeConfigPath("entity")}}>
                        </ha-selector>
                    `},"render")},{type:"custom",render:g(()=>this._renderAttributeSelector(),"render")},{type:"custom",render:g(()=>this._renderRangesAttributeSelector(),"render")},{type:"custom",render:g(()=>this._renderStateAttributeSelector(),"render")},{type:"custom",render:g(()=>this._renderStateClassificationElseSelector(),"render")}]}),t.push({type:"section",header:"Card Identification",description:"Identification for rules engine targeting",icon:"mdi:tag",expanded:false,outlined:true,children:[{type:"field",path:"id",label:"Card ID",helper:"[Optional] Custom ID for targeting with rules and animations"},{type:"field",path:"tags",label:"Tags",helper:"Select existing tags or type new ones for rule targeting"}]}),t.push({type:"section",header:"Sizing",description:"Override card dimensions: useful in stacks, overlays, or any auto-height container",icon:"mdi:resize",expanded:false,outlined:true,children:[{type:"grid",columns:2,children:[{type:"field",path:"height",label:"Height",helper:"Fixed height (e.g. 56px). Overrides grid row height."},{type:"field",path:"width",label:"Width",helper:"Fixed width (e.g. 200px). Overrides grid column width."},{type:"field",path:"min_height",label:"Min Height",helper:"Floor height. Bare integer = px, or CSS units (e.g. 40px, 10vh)."},{type:"field",path:"min_width",label:"Min Width",helper:"Floor width. Bare integer = px, or CSS units (e.g. 80px, 10vw)."},{type:"field",path:"max_height",label:"Max Height",helper:"Ceiling height. Bare integer = px, or CSS units (e.g. 400px, 80vh)."},{type:"field",path:"max_width",label:"Max Width",helper:"Ceiling width. Bare integer = px, or CSS units (e.g. 600px, 80vw)."},{type:"field",path:"overflow",label:"Overflow",helper:"Sets both axes. Use overflow_x / overflow_y to override per axis."},{type:"field",path:"z_index",label:"Z-Index",helper:"Stacking order. Higher = in front within the same stacking context."},{type:"field",path:"overflow_x",label:"Overflow X",helper:"Horizontal axis: overrides the Overflow setting."},{type:"field",path:"overflow_y",label:"Overflow Y",helper:"Vertical axis: overrides the Overflow setting."}]},{type:"custom",render:g(()=>this._renderLayoutCardHint(),"render")}]}),t}_getCardBorderTabConfig(){return[{type:"section",header:"Card Background",description:"Background colours by state",icon:"mdi:format-color-fill",expanded:false,outlined:true,children:[{type:"custom",render:g(()=>n`
                            <lcards-color-section-v2
                                .editor=${this}
                                basePath="style.card.color.background"
                                header="Background Colours"
                                description="Card background colour for each state - supports custom states like 'idle', 'buffering', etc."
                                .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero","hover","pressed"]}
                                ?allowCustomStates=${true}
                                ?expanded=${false}>
                            </lcards-color-section-v2>
                        `,"render")}]},{type:"custom",render:g(()=>this._renderShapeTextureSection(),"render")},{type:"custom",render:g(()=>n`
                    <lcards-border-editor
                        .editor=${this}
                        path="style.border"
                        label="Borders & Corners"
                        ?showPreview=${true}>
                    </lcards-border-editor>
                `,"render")}]}_renderShapeTextureSection(){var e,t,o;return n`
            <lcards-form-section
                header="Shape Texture"
                description="Apply an SVG texture or animation pattern inside the button shape"
                icon="mdi:texture"
                ?expanded=${!!((t=(e=this.config)==null?void 0:e.shape_texture)!=null&&t.preset)}
                ?outlined=${true}>
                <lcards-shape-texture-editor
                    .hass=${this.hass}
                    .config=${((o=this.config)==null?void 0:o.shape_texture)??null}
                    @texture-changed=${i=>{i.detail.value?this._setConfigValue("shape_texture",i.detail.value):this._removeConfigPath("shape_texture")}}>
                </lcards-shape-texture-editor>
            </lcards-form-section>
        `}_renderTextTab(){var i,s,a,r,l,c,h,p,d,u,m;const e=((i=this.config)==null?void 0:i.text)||{};let t={},o=[];if((s=this.config)!=null&&s.component){const f=(h=(c=(l=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.getComponentManager)==null?void 0:l.call(r))==null?void 0:c.getComponent)==null?void 0:h.call(c,this.config.component);t={...(f==null?void 0:f.zones)||{}};const b=Object.keys((f==null?void 0:f.text)||{}).filter(y=>y!=="default");o=b.length>0?b:[]}else t={body:"Body",full:"Full",...(((p=this.config)==null?void 0:p.show_icon)||((d=this.config)==null?void 0:d.icon_only))&&(((u=this.config)==null?void 0:u.icon_area)||"left")!=="none"?{icon:"Icon"}:{}};for(const f of Object.keys(((m=this.config)==null?void 0:m.zones)||{}))t[f]||(t[f]=f.replace(/_/g," ").replace(/\b\w/g,b=>b.toUpperCase()));return n`
            <lcards-multi-text-editor-v2
                .editor=${this}
                .text=${e}
                .hass=${this.hass}
                .availableZones=${t}
                .componentTextFields=${o}
                @text-changed=${f=>{this.config={...this.config,text:f.detail.value},this._updateConfig(this.config,"visual")}}>
            </lcards-multi-text-editor-v2>
        `}_renderIconTab(){return n`
            <lcards-icon-editor
                .editor=${this}
                .hass=${this.hass}
                .config=${this.config}>
            </lcards-icon-editor>
        `}_renderActionsTab(){var o;const e=this.config.interactive!==false,t=[{value:"pointer",label:"Pointer (hand), default"},{value:"default",label:"Default (arrow)"},{value:"none",label:"None (hidden)"},{value:"not-allowed",label:"Not allowed"},{value:"crosshair",label:"Crosshair"},{value:"grab",label:"Grab"},{value:"zoom-in",label:"Zoom in"},{value:"help",label:"Help"},{value:"wait",label:"Wait"},{value:"progress",label:"Progress"},{value:"move",label:"Move"},{value:"copy",label:"Copy"},{value:"text",label:"Text"}];return n`
            <lcards-form-section
                header="Hover &amp; Cursor"
                icon="mdi:cursor-default-click"
                ?expanded=${true}>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Show hover effects (colour change & hover animations)"}
                    .helper=${"When off, mouse-over does not change the button colour or trigger hover animations. Tap/hold actions are unaffected."}
                    .selector=${{boolean:{}}}
                    .value=${e}
                    @value-changed=${i=>{this._updateConfig({interactive:i.detail.value!==false})}}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Cursor style"}
                    .helper=${"CSS cursor shown when hovering over the button. Leave blank to use the default (pointer when interactive, arrow when hover effects are off)."}
                    .selector=${{select:{mode:"dropdown",custom_value:true,options:t}}}
                    .value=${((o=this.config.style)==null?void 0:o.cursor)??""}
                    @value-changed=${i=>{const s=i.detail.value;if(s)this._updateConfig({style:{cursor:s}});else{const a={...this.config.style||{}};delete a.cursor,this._updateConfig({style:a})}}}>
                </ha-selector>
            </lcards-form-section>
            <lcards-multi-action-editor
                .hass=${this.hass}
                .actions=${{tap_action:this.config.tap_action,hold_action:this.config.hold_action,double_tap_action:this.config.double_tap_action}}
                @value-changed=${this._handleActionsChange}>
            </lcards-multi-action-editor>
        `}_renderSegmentsTab(){var t,o,i,s,a,r,l,c,h,p;const e=this._getMode();if(e==="component"){const d=this.config.component||"dpad";if(d==="dpad"){const f=["center","up","down","left","right","up-left","up-right","down-left","down-right"];return n`
                    <lcards-message
                        type="info"
                        message="Configure your D-pad remote control. Use 'Default' to set common properties for all segments, then override per-segment as needed.">
                    </lcards-message>
                    <lcards-unified-segment-editor
                        .editor=${this}
                        mode="dpad"
                        .segments=${((t=this.config.dpad)==null?void 0:t.segments)||{}}
                        .predefinedSegmentIds=${f}
                        ?showDefaults=${true}
                        .hass=${this.hass}>
                    </lcards-unified-segment-editor>
                    ${this._renderRangesConfig()}
                `}if(d==="alert")return n`
                    <lcards-message
                        type="info"
                        message="Override the default segment colours for the alert shape and bars. Text labels are configured in the Text tab.">
                    </lcards-message>
                    ${this._renderAlertColorSection()}
                    <lcards-unified-segment-editor
                        .editor=${this}
                        mode="dpad"
                        componentType="alert"
                        .segments=${((o=this.config.alert)==null?void 0:o.segments)||{}}
                        .predefinedSegmentIds=${["shape","bars"]}
                        ?showDefaults=${false}
                        .hass=${this.hass}>
                    </lcards-unified-segment-editor>
                    ${this._renderCustomPresetsSection()}
                    ${this._renderRangesConfig()}
                `;const u=(l=(r=(a=(s=(i=window.lcards)==null?void 0:i.core)==null?void 0:s.getComponentManager)==null?void 0:a.call(s))==null?void 0:r.getComponent)==null?void 0:l.call(r,d),m=u?Object.keys(u.segments||{}):[];return m.length>0?n`
                    <lcards-unified-segment-editor
                        .editor=${this}
                        mode="dpad"
                        componentType=${d}
                        .segments=${((c=this.config[d])==null?void 0:c.segments)||{}}
                        .predefinedSegmentIds=${m}
                        ?showDefaults=${false}
                        .hass=${this.hass}>
                    </lcards-unified-segment-editor>
                    ${this._renderRangesConfig()}
                `:n`
                <lcards-message
                    type="info"
                    message="Segment editor for '${d}' is not yet available.">
                </lcards-message>
                ${this._renderRangesConfig()}
            `}else if(e==="svg"){const d=this._getDiscoveredSegmentIds(),u=this._getSvgParseError();return n`
                <lcards-message
                    type="info"
                    message="Paste your SVG markup below. Elements with 'id' attributes become interactive segments.">
                </lcards-message>

                <!-- SVG Content Field -->
                <lcards-form-section
                    header="SVG Content"
                    description="Paste or edit your SVG markup here"
                    icon="mdi:xml"
                    ?expanded=${true}
                    ?outlined=${true}>
                    <div class="form-row">
                        <ha-code-editor
                            mode="yaml"
                            linewrap
                            .value=${((h=this.config.svg)==null?void 0:h.content)||""}
                            placeholder="<svg viewBox='0 0 100 100'>...</svg>"
                            @value-changed=${m=>{m.stopPropagation(),this.editor._setConfigValue("svg.content",m.detail.value)}}>
                        </ha-code-editor>
                        <div class="helper-text">
                            ${d.length>0?`Found ${d.length} segment(s): ${d.join(", ")}`:"No segments found. Add id attributes to your SVG elements."}
                        </div>
                    </div>
                </lcards-form-section>

                ${u?n`
                    <lcards-message
                        type="error"
                        message="SVG Parse Error: ${u}">
                    </lcards-message>
                `:""}

                <!-- Segment Configuration -->
                <lcards-message
                    type="info"
                    message="Configure segment interactions below. Use 'Default' to set common properties for all segments.">
                </lcards-message>

                <lcards-unified-segment-editor
                    .editor=${this}
                    mode="custom"
                    .segments=${((p=this.config.svg)==null?void 0:p.segments)||{}}
                    .discoveredSegmentIds=${d}
                    ?showDefaults=${true}
                    .hass=${this.hass}>
                </lcards-unified-segment-editor>
            `}return n`
            <lcards-message
                type="warning"
                message="Segments tab is only available in SVG or Component mode.">
            </lcards-message>
        `}_getDiscoveredSegmentIds(){var t;const e=(t=this.config.svg)==null?void 0:t.content;if(!e)return this._svgParseError=null,[];try{const i=new DOMParser().parseFromString(e,"image/svg+xml"),s=i.querySelector("parsererror");if(s)return this._svgParseError=s.textContent||"Invalid SVG markup",_.error("❌ [LCARdS Button Editor] SVG parse error:",this._svgParseError),[];this._svgParseError=null;const a=i.querySelectorAll("[id]"),r=Array.from(a).map(l=>l.id);return this._svgParseError=null,r}catch(o){return this._svgParseError=o.message||"Failed to parse SVG",_.error("❌ [LCARdS Button Editor] SVG parse exception:",o),[]}}_getSvgParseError(){return this._svgParseError||null}_handleComponentTypeChange(e){if(!e||e===this.config.component)return;const t=this.config.component,o={...this.config};t&&delete o[t];for(const s of Q())s!==e&&delete o[s];delete o.text,delete o.preset,delete o.animations,o.component=e,o[e]={segments:{}};const i=this.config;this.config=o,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true})),this.requestUpdate("config",i),_.debug(`[LCARdSButtonEditor] Component type changed: ${t} → ${e}`)}_handleModeChange(e){var r;const t=e.detail.value,o=this._getMode();if(t===o)return;let i=[],s={};if(t==="preset")i=["preset","text","icon","show_icon","icon_area","icon_style","icon_area_background"],s.preset="lozenge";else if(t==="component")i=["component","dpad","alert","preset","text","entity"],s.component="dpad",s.dpad={segments:{}};else if(t==="svg"){i=["svg"];const l=`<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Example interactive segments -->
  <rect id="segment-1" x="10" y="10" width="80" height="80" fill="#ff9800" rx="8"/>
  <text x="50" y="55" text-anchor="middle" fill="white" font-size="14">Segment 1</text>

  <circle id="segment-2" cx="150" cy="50" r="40" fill="#2196f3"/>
  <text x="150" y="55" text-anchor="middle" fill="white" font-size="14">Segment 2</text>

  <rect id="segment-3" x="210" y="10" width="80" height="80" fill="#4caf50" rx="8"/>
  <text x="250" y="55" text-anchor="middle" fill="white" font-size="14">Segment 3</text>

  <path id="segment-4" d="M 10 120 L 140 120 L 75 180 Z" fill="#9c27b0"/>
  <text x="75" y="150" text-anchor="middle" fill="white" font-size="14">Segment 4</text>

  <ellipse id="segment-5" cx="220" cy="150" rx="70" ry="40" fill="#f44336"/>
  <text x="220" y="155" text-anchor="middle" fill="white" font-size="14">Segment 5</text>
</svg>`;s.svg={content:((r=this.config.svg)==null?void 0:r.content)||l,segments:{}}}const a=this._cleanConfigForMode(this.config,t,i);Object.assign(a,s),this.config=a,this._yamlValue=j(this.config),this._validateConfig(),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true})),this.requestUpdate()}_handleActionsChange(e){const t=e.detail.value,o={};t.tap_action&&(o.tap_action=t.tap_action),t.hold_action&&(o.hold_action=t.hold_action),t.double_tap_action&&(o.double_tap_action=t.double_tap_action);const i={...this.config,...o};!t.tap_action&&this.config.tap_action&&delete i.tap_action,!t.hold_action&&this.config.hold_action&&delete i.hold_action,!t.double_tap_action&&this.config.double_tap_action&&delete i.double_tap_action,this.config=i,this._validateConfig(),this._yamlValue=j(this.config),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true}))}_renderRangesConfig(){var p,d,u,m,f,b,y,x,v,k,P;const e=(p=this.config)==null?void 0:p.component,t=!!((d=this.config)!=null&&d.entity),o=(y=(b=(f=(m=(u=window.lcards)==null?void 0:u.core)==null?void 0:m.getComponentManager)==null?void 0:f.call(m))==null?void 0:b.getComponent)==null?void 0:y.call(b,e),i=((x=o==null?void 0:o.getPresetNames)==null?void 0:x.call(o))||[],s=Object.keys(((k=(v=this.config)==null?void 0:v[e])==null?void 0:k.custom_presets)||{}),a=[...i];for(const w of s)a.includes(w)||a.push(w);const r=a.map(w=>({value:w,label:w.replace(/_/g," ").replace(/\b\w/g,C=>C.toUpperCase())})),l=((P=this.config)==null?void 0:P.ranges)||[];return n`
            <lcards-form-section
                header="State-Driven Presets (Ranges)"
                description="Auto-switch the component preset based on entity state value"
                icon="mdi:tune-variant"
                ?expanded=${l.length>0}
                ?outlined=${true}>

                ${t?n`
                    <lcards-message type="info">
                        Ranges run top to bottom; the first match sets the preset. The value compared is the
                        <strong>Range Attribute</strong> above.
                    </lcards-message>

                    <div style="${"display: flex; flex-direction: column; gap: 8px; margin: 12px 0 4px;"}">
                        ${l.length===0?n`
                            <div style="${"text-align: center; padding: 24px 16px; color: var(--secondary-text-color);"}">
                                <div style="font-weight: 600; margin-bottom: 4px;">No ranges defined</div>
                                <div style="font-size: 12px;">Add a range to switch presets based on entity state</div>
                            </div>
                        `:l.map((w,C)=>this._renderRangeRow(w,C,r))}
                    </div>

                    <ha-button @click=${()=>this._addPresetRange()}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Range
                    </ha-button>
                `:n`
                    <lcards-message type="info"
                        message="Select an entity above to enable state-driven preset switching.">
                    </lcards-message>
                `}
            </lcards-form-section>
        `}_renderRangeRow(e,t,o){var h,p,d,u,m,f,b,y,x;const i=e.equals!==void 0?"equals":e.above!==void 0&&e.below!==void 0?"between":e.above!==void 0?"above":e.at_least!==void 0?"at_least":e.below!==void 0?"below":e.at_most!==void 0?"at_most":"above",s=[{value:"above",label:"> Above"},{value:"at_least",label:"≥ At Least"},{value:"below",label:"< Below"},{value:"at_most",label:"≤ At Most"},{value:"between",label:"↔ Between"},{value:"equals",label:"= Equals (string)"}],a=["display: flex; flex-direction: column; gap: 10px;","padding: 12px;","background: var(--secondary-background-color);","border-radius: 8px;","border: 1px solid var(--divider-color);"].join(" ");return n`
            <div style="${a}">

                <!-- Row 1: Preset + Delete -->
                <div style="${"display: flex; align-items: flex-end; gap: 8px;"}">
                    <div style="flex: 1;">
                        ${o.length>0?n`
                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Preset"}
                                .selector=${{select:{mode:"dropdown",options:o}}}
                                .value=${e.preset||""}
                                @value-changed=${v=>this._updateRangeField(t,"preset",v.detail.value)}>
                            </ha-selector>
                        `:n`
                            <ha-input
                                style="width: 100%;"
                                .label=${"Preset name"}
                                .value=${e.preset||""}
                                @change=${v=>this._updateRangeField(t,"preset",v.target.value)}>
                            </ha-input>
                        `}
                    </div>
                    <ha-icon-button
                        .label=${"Remove range"}
                        .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                        @click=${()=>this._deletePresetRange(t)}>
                    </ha-icon-button>
                </div>

                <!-- Row 2: Condition + Value(s) -->
                <div style="${i==="between"?"display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; align-items: end;":"display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: end;"}">

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"When"}
                        .selector=${{select:{mode:"dropdown",options:s}}}
                        .value=${i}
                        @value-changed=${v=>this._updateRangeCondition(t,v.detail.value,e)}>
                    </ha-selector>

                    ${i==="between"?n`
                        <ha-input
                            .label=${"From (>)"}
                            type="number"
                            .value=${String(e.above??"")}
                            @change=${v=>this._updateRangeField(t,"above",parseFloat(v.target.value))}>
                        </ha-input>
                        <ha-input
                            .label=${"To (<)"}
                            type="number"
                            .value=${String(e.below??"")}
                            @change=${v=>this._updateRangeField(t,"below",parseFloat(v.target.value))}>
                        </ha-input>
                    `:i==="equals"?n`
                        <ha-input
                            .label=${"Value"}
                            .value=${String(e.equals??"")}
                            @change=${v=>this._updateRangeField(t,"equals",v.target.value)}>
                        </ha-input>
                    `:n`
                        <ha-input
                            .label=${i==="above"?"Min (>)":i==="at_least"?"Min (≥)":i==="at_most"?"Max (≤)":"Max (<)"}
                            type="number"
                            .value=${String(e[i]??"")}
                            @change=${v=>this._updateRangeField(t,i,parseFloat(v.target.value))}>
                        </ha-input>
                    `}
                </div>

                ${((h=this.config)==null?void 0:h.component)==="alert"?n`
                    <!-- Row 3: Per-range color overrides (alert component only) -->
                    <details style="margin-top: 4px;" ?open=${!!((p=e.color)!=null&&p.shape||(d=e.color)!=null&&d.bars)}>
                        <summary style="cursor: pointer; font-size: 12px; color: var(--secondary-text-color); user-select: none; padding: 4px 0; list-style: none; display: flex; align-items: center; gap: 6px;">
                            <ha-icon icon="mdi:palette" style="--mdc-icon-size: 14px; opacity: 0.7;"></ha-icon>
                            Color override
                            ${(u=e.color)!=null&&u.shape||(m=e.color)!=null&&m.bars?n`<span style="color: var(--primary-color); font-size: 11px; font-weight: 600;">(active)</span>`:""}
                        </summary>
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
                            <!-- Shape picker card -->
                            <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                                <div style="display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: var(--secondary-background-color);">
                                    <ha-icon icon="mdi:shield-outline" style="color: var(--primary-color); --mdc-icon-size: 15px; flex-shrink: 0;"></ha-icon>
                                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Shape fill</div>
                                </div>
                                <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                    <lcards-color-picker
                                        .hass=${this.hass}
                                        .value=${((f=e.color)==null?void 0:f.shape)||""}
                                        ?showPreview=${true}
                                        ?allowMatchLight=${this._isLightEntity}
                                        .entityId=${((b=this.config)==null?void 0:b.entity)||""}
                                        @value-changed=${v=>this._updateRangeColor(t,"shape",v.detail.value)}>
                                    </lcards-color-picker>
                                </div>
                            </div>
                            <!-- Bars picker card -->
                            <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                                <div style="display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: var(--secondary-background-color);">
                                    <ha-icon icon="mdi:view-sequential" style="color: var(--primary-color); --mdc-icon-size: 15px; flex-shrink: 0;"></ha-icon>
                                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Bars stroke</div>
                                </div>
                                <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                    <lcards-color-picker
                                        .hass=${this.hass}
                                        .value=${((y=e.color)==null?void 0:y.bars)||""}
                                        ?showPreview=${true}
                                        ?allowMatchLight=${this._isLightEntity}
                                        .entityId=${((x=this.config)==null?void 0:x.entity)||""}
                                        @value-changed=${v=>this._updateRangeColor(t,"bars",v.detail.value)}>
                                    </lcards-color-picker>
                                </div>
                            </div>
                        </div>
                    </details>
                `:""}
            </div>
        `}_renderAlertColorSection(){var i,s,a,r,l,c,h,p;const e=((a=(s=(i=this.config)==null?void 0:i.alert)==null?void 0:s.color)==null?void 0:a.shape)||"",t=((c=(l=(r=this.config)==null?void 0:r.alert)==null?void 0:l.color)==null?void 0:c.bars)||"";return n`
            <lcards-form-section
                header="Alert Colours"
                description="Override preset colours for the shield shape and animated bars."
                icon="mdi:palette"
                ?expanded=${!!(e||t)}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message type="info"
                    message="These colors take highest priority: they override both the active preset and the segments settings below. Leave blank to inherit from the active preset.">
                </lcards-message>

                <div style="display: flex; flex-direction: column; gap: 8px; padding: 8px 0;">
                    <!-- Shape picker card -->
                    <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--secondary-background-color);">
                            <ha-icon icon="mdi:shield-outline" style="color: var(--primary-color); --mdc-icon-size: 18px; flex-shrink: 0;"></ha-icon>
                            <div>
                                <div style="font-size: 13px; font-weight: 600; color: var(--primary-text-color);">Shape fill</div>
                                <div style="font-size: 11px; color: var(--secondary-text-color);">Shield outline fill color</div>
                            </div>
                        </div>
                        <div style="padding: 12px 16px; background: var(--primary-background-color);">
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${e}
                                ?showPreview=${true}
                                ?allowMatchLight=${this._isLightEntity}
                                .entityId=${((h=this.config)==null?void 0:h.entity)||""}
                                @value-changed=${d=>{d.detail.value?this._setConfigValue("alert.color.shape",d.detail.value):this._removeConfigPath("alert.color.shape")}}>
                            </lcards-color-picker>
                        </div>
                    </div>
                    <!-- Bars picker card -->
                    <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--secondary-background-color);">
                            <ha-icon icon="mdi:view-sequential" style="color: var(--primary-color); --mdc-icon-size: 18px; flex-shrink: 0;"></ha-icon>
                            <div>
                                <div style="font-size: 13px; font-weight: 600; color: var(--primary-text-color);">Bars stroke</div>
                                <div style="font-size: 11px; color: var(--secondary-text-color);">Animated bar line color</div>
                            </div>
                        </div>
                        <div style="padding: 12px 16px; background: var(--primary-background-color);">
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${t}
                                ?showPreview=${true}
                                ?allowMatchLight=${this._isLightEntity}
                                .entityId=${((p=this.config)==null?void 0:p.entity)||""}
                                @value-changed=${d=>{d.detail.value?this._setConfigValue("alert.color.bars",d.detail.value):this._removeConfigPath("alert.color.bars")}}>
                            </lcards-color-picker>
                        </div>
                    </div>
                </div>
            </lcards-form-section>
        `}_renderCustomPresetsSection(){var s,a,r,l,c,h,p,d;const e=(c=(l=(r=(a=(s=window.lcards)==null?void 0:s.core)==null?void 0:a.getComponentManager)==null?void 0:r.call(a))==null?void 0:l.getComponent)==null?void 0:c.call(l,"alert"),t=((h=e==null?void 0:e.getPresetNames)==null?void 0:h.call(e))??[],o=((d=(p=this.config)==null?void 0:p.alert)==null?void 0:d.custom_presets)??{},i=Object.keys(o);return n`
            <lcards-form-section
                header="Custom Presets"
                description="Define new alert presets or override built-in preset colours."
                icon="mdi:palette-swatch"
                ?expanded=${i.length>0}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message type="info"
                    message="Use the same name as a built-in preset (e.g. condition_red) to override its colors, or use a new name to define your own preset.">
                </lcards-message>

                <div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0;">
                    ${i.map(u=>this._renderCustomPresetRow(u,o[u],t))}
                </div>

                <ha-button @click=${()=>this._addCustomPreset()}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Custom Preset
                </ha-button>
            </lcards-form-section>
        `}_renderCustomPresetRow(e,t,o){var h,p,d,u,m,f,b,y,x,v,k,P,w,C,q;const i=o.includes(e),s=((h=this._expandedCustomPresets)==null?void 0:h[e])??false,a=((u=(d=(p=t==null?void 0:t.segments)==null?void 0:p.shape)==null?void 0:d.style)==null?void 0:u.fill)??"",r=((b=(f=(m=t==null?void 0:t.segments)==null?void 0:m.bars)==null?void 0:f.style)==null?void 0:b.stroke)??"",l=((x=(y=t==null?void 0:t.text)==null?void 0:y.alert_text)==null?void 0:x.color)??"",c=((k=(v=t==null?void 0:t.text)==null?void 0:v.sub_text)==null?void 0:k.color)??"";return n`
            <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; transition: border-color 0.2s;">
                <!-- Row header -->
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; user-select: none; background: var(--secondary-background-color); transition: background 0.2s;"
                     @click=${()=>this._toggleCustomPresetExpanded(e)}>
                    <ha-icon
                        icon=${i?"mdi:palette-advanced":"mdi:palette-swatch-outline"}
                        style="color: var(--primary-color); --mdc-icon-size: 18px; flex-shrink: 0;">
                    </ha-icon>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${e}</div>
                        <div style="font-size: 11px; color: var(--secondary-text-color);">
                            ${i?"Overrides built-in preset":"Custom preset"}
                        </div>
                    </div>
                    <ha-icon-button
                        title="Delete"
                        style="--ha-icon-button-size: 36px; --mdc-icon-size: 18px;"
                        @click=${$=>{$.stopPropagation(),this._deleteCustomPreset(e)}}>
                        <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </ha-icon-button>
                    <ha-icon
                        icon="mdi:chevron-down"
                        style="flex-shrink: 0; transition: transform 0.2s; ${s?"transform: rotate(180deg);":""}">
                    </ha-icon>
                </div>

                <!-- Expanded content -->
                ${s?n`
                    <div style="padding: 12px 16px; background: var(--primary-background-color); border-top: 1px solid var(--divider-color); display: flex; flex-direction: column; gap: 10px;">
                        <!-- Rename field -->
                        <div>
                            <div style="font-size: 12px; font-weight: 500; margin-bottom: 6px; color: var(--primary-text-color);">Preset name</div>
                            <ha-input
                                style="width: 100%;"
                                .value=${e}
                                placeholder="e.g. condition_red or my_preset"
                                @change=${$=>this._renameCustomPreset(e,$.target.value.trim())}>
                            </ha-input>
                            ${i?n`
                                <div style="font-size: 11px; color: var(--warning-color, orange); margin-top: 4px;">
                                    Overrides built-in preset <strong>${e}</strong>
                                </div>
                            `:""}
                        </div>
                        <!-- Shape picker card -->
                        <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--secondary-background-color);">
                                <ha-icon icon="mdi:shield-outline" style="color: var(--primary-color); --mdc-icon-size: 16px; flex-shrink: 0;"></ha-icon>
                                <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Shape fill</div>
                            </div>
                            <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${a}
                                    ?showPreview=${true}
                                    ?allowMatchLight=${this._isLightEntity}
                                    .entityId=${((P=this.config)==null?void 0:P.entity)||""}
                                    @value-changed=${$=>this._setCustomPresetColor(e,"shape",$.detail.value)}>
                                </lcards-color-picker>
                            </div>
                        </div>
                        <!-- Bars picker card -->
                        <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--secondary-background-color);">
                                <ha-icon icon="mdi:view-sequential" style="color: var(--primary-color); --mdc-icon-size: 16px; flex-shrink: 0;"></ha-icon>
                                <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Bars stroke</div>
                            </div>
                            <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${r}
                                    ?showPreview=${true}
                                    ?allowMatchLight=${this._isLightEntity}
                                    .entityId=${((w=this.config)==null?void 0:w.entity)||""}
                                    @value-changed=${$=>this._setCustomPresetColor(e,"bars",$.detail.value)}>
                                </lcards-color-picker>
                            </div>
                        </div>
                        <!-- Alert text color picker -->
                        <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--secondary-background-color);">
                                <ha-icon icon="mdi:format-color-text" style="color: var(--primary-color); --mdc-icon-size: 16px; flex-shrink: 0;"></ha-icon>
                                <div>
                                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Label color</div>
                                    <div style="font-size: 11px; color: var(--secondary-text-color);">Main alert label (alert_text)</div>
                                </div>
                            </div>
                            <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${l}
                                    ?showPreview=${true}
                                    ?allowMatchLight=${this._isLightEntity}
                                    .entityId=${((C=this.config)==null?void 0:C.entity)||""}
                                    @value-changed=${$=>this._setCustomPresetTextColor(e,"alert_text",$.detail.value)}>
                                </lcards-color-picker>
                            </div>
                        </div>
                        <!-- Sub text color picker -->
                        <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--secondary-background-color);">
                                <ha-icon icon="mdi:format-letter-case" style="color: var(--primary-color); --mdc-icon-size: 16px; flex-shrink: 0;"></ha-icon>
                                <div>
                                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Sub-label color</div>
                                    <div style="font-size: 11px; color: var(--secondary-text-color);">Secondary label (sub_text)</div>
                                </div>
                            </div>
                            <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${c}
                                    ?showPreview=${true}
                                    ?allowMatchLight=${this._isLightEntity}
                                    .entityId=${((q=this.config)==null?void 0:q.entity)||""}
                                    @value-changed=${$=>this._setCustomPresetTextColor(e,"sub_text",$.detail.value)}>
                                </lcards-color-picker>
                            </div>
                        </div>
                    </div>
                `:""}
            </div>
        `}_toggleCustomPresetExpanded(e){var t;this._expandedCustomPresets={...this._expandedCustomPresets??{},[e]:!((t=this._expandedCustomPresets)!=null&&t[e])},this.requestUpdate()}_addCustomPreset(){const e=`custom_preset_${Date.now()}`;this._setConfigValue(`alert.custom_presets.${e}`,{segments:{shape:{style:{}},bars:{style:{}}}}),this._expandedCustomPresets={...this._expandedCustomPresets??{},[e]:true},this.requestUpdate()}_deleteCustomPreset(e){var o,i;const t={...((i=(o=this.config)==null?void 0:o.alert)==null?void 0:i.custom_presets)??{}};delete t[e],Object.keys(t).length===0?this._removeConfigPath("alert.custom_presets"):this._setConfigValue("alert.custom_presets",t)}_setCustomPresetColor(e,t,o){const i=t==="shape"?`alert.custom_presets.${e}.segments.shape.style.fill`:`alert.custom_presets.${e}.segments.bars.style.stroke`;o?this._setConfigValue(i,o):this._removeConfigPath(i)}_setCustomPresetTextColor(e,t,o){var r,l,c;const i=JSON.parse(JSON.stringify(this.config??{})),s=(l=(r=i==null?void 0:i.alert)==null?void 0:r.custom_presets)==null?void 0:l[e];if(!s)return;o?(s.text=s.text??{},s.text[t]={...s.text[t]??{},color:o}):((c=s.text)!=null&&c[t]&&(delete s.text[t].color,Object.keys(s.text[t]).length||delete s.text[t]),s.text&&!Object.keys(s.text).length&&delete s.text);const a=this.config;this.config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true})),this.requestUpdate("config",a)}_renameCustomPreset(e,t){var l,c;if(!t||t===e)return;const o=((c=(l=this.config)==null?void 0:l.alert)==null?void 0:c.custom_presets)??{};if(t in o)return;const i=Object.fromEntries(Object.entries(o).map(([h,p])=>[h===e?t:h,p])),s=JSON.parse(JSON.stringify(this.config??{}));s.alert||(s.alert={}),s.alert.custom_presets=i;const a=this.config;this.config=s,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this.config},bubbles:true,composed:true})),this.requestUpdate("config",a);const r={...this._expandedCustomPresets??{}};r[t]=r[e]??true,delete r[e],this._expandedCustomPresets=r,this.requestUpdate()}_updateRangeColor(e,t,o){var a;const i=[...((a=this.config)==null?void 0:a.ranges)??[]],s={...i[e]};if(o)s.color={...s.color??{},[t]:o};else if(s.color){const r={...s.color};delete r[t],Object.keys(r).length===0?delete s.color:s.color=r}i[e]=s,this._setConfigValue("ranges",i)}_addPresetRange(){var t;const e=((t=this.config)==null?void 0:t.ranges)||[];this._setConfigValue("ranges",[...e,{preset:"",above:0}])}_deletePresetRange(e){var o;const t=(((o=this.config)==null?void 0:o.ranges)||[]).filter((i,s)=>s!==e);t.length===0?this._removeConfigPath("ranges"):this._setConfigValue("ranges",t)}_updateRangeField(e,t,o){var s;const i=[...((s=this.config)==null?void 0:s.ranges)||[]];i[e]={...i[e],[t]:o},this._setConfigValue("ranges",i)}_updateRangeCondition(e,t,o){var r;const i=[...((r=this.config)==null?void 0:r.ranges)||[]],{preset:s}=o;let a={preset:s};t==="above"&&(a.above=o.above??0),t==="at_least"&&(a.at_least=o.at_least??0),t==="below"&&(a.below=o.below??100),t==="at_most"&&(a.at_most=o.at_most??100),t==="between"&&(a.above=o.above??0,a.below=o.below??100),t==="equals"&&(a.equals=o.equals??""),i[e]=a,this._setConfigValue("ranges",i)}_renderEffectsTab(){var e;return n`
            <div class="tab-content-container">
                <lcards-message type="info">
                    Effects for the whole card: animations, filters and background animations.
                    Animations for one segment are on the <strong>Segments</strong> tab.
                </lcards-message>

                <!-- Animations Section -->
                <lcards-form-section
                    header="Animations"
                    description="Trigger visual animations on user interactions or entity state changes"
                    icon="mdi:animation"
                    ?expanded=${false}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._effectiveAnimations}
                        .cardElement=${this._cardElement}
                        .systemAnimationIds=${(((e=this._cardElement)==null?void 0:e._componentAnimations)||[]).map(t=>t.id).filter(Boolean)}
                        @animations-changed=${t=>{var r;const o=t.detail.value||[],i=((r=this._cardElement)==null?void 0:r._componentAnimations)||[],s=new Set(i.map(l=>l.id).filter(Boolean)),a=o.map(l=>{var d;if(!l.id||!s.has(l.id))return l;const c=i.find(u=>u.id===l.id),h={id:l.id};l.enabled===false&&(h.enabled=false),l.trigger!==((c==null?void 0:c.trigger)||"on_load")&&(h.trigger=l.trigger);const p={};for(const[u,m]of Object.entries(l.params||{}))JSON.stringify(m)!==JSON.stringify((d=c==null?void 0:c.params)==null?void 0:d[u])&&(p[u]=m);return Object.keys(p).length>0&&(h.params=p),Object.keys(h).length>1?h:null}).filter(Boolean);this._updateConfig({animations:a.length>0?a:void 0})}}>
                    </lcards-animation-editor>
                </lcards-form-section>

                <!-- Filters Section -->
                <lcards-form-section
                    header="Filters"
                    description="Apply visual filters to the entire button (CSS and SVG filter primitives)"
                    icon="mdi:auto-fix"
                    ?expanded=${false}>

                    <lcards-filter-editor
                        .hass=${this.hass}
                        .filters=${this.config.filters||[]}
                        @filters-changed=${t=>{this._updateConfig({filters:t.detail.value})}}>
                    </lcards-filter-editor>
                </lcards-form-section>

                <!-- Background Animation Section -->
                <lcards-form-section
                    header="Background Animation"
                    description="Animated canvas backgrounds (grids, hexagons, diagonals, etc.)"
                    icon="mdi:grid"
                    ?expanded=${false}>

                    <lcards-background-animation-editor
                        .hass=${this.hass}
                        .config=${this.config.background_animation??[]}
                        @effects-changed=${t=>{const o={...this.config};delete o.background_animation,this.config=o,this._updateConfig({background_animation:t.detail.value})}}>
                    </lcards-background-animation-editor>
                </lcards-form-section>

            </div>
        `}};g(R,"LCARdSButtonEditor");let B=R;customElements.get("lcards-button-editor")||customElements.define("lcards-button-editor",B);export{B as LCARdSButtonEditor};
//# sourceMappingURL=lcards-button-editor-Dl8PqusM.js.map
