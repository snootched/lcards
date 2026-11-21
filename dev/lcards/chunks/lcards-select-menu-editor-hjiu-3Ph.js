var _=Object.defineProperty;var u=(b,e)=>_(b,"name",{value:e,configurable:true});import{c as y,l as f,b as r,d as $,o as x,m as w}from"./lcards-main-Dyh7t6jw.js";import{a as O,L as c}from"./LCARdSBaseEditor-DKqLTaC3.js";import{r as v}from"./lcards-message-DwgRzp3Y.js";import"./lcards-form-section--YQsY5gW.js";import"./lcards-color-section-v2-C_JrvWUu.js";const m=class m2 extends O{static get properties(){return{...super.properties,_expandedOption:{type:String,state:true},_dragIndex:{type:Number,state:true},_dragOverIndex:{type:Number,state:true},_confirmAction:{type:Object,state:true}}}static get styles(){return[super.styles,y`
                /* ── Options list (matches LCARS background-animation-editor style) ── */
                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--ha-space-4);
                }

                .option-row {
                    background: var(--card-background-color, var(--ha-card-background));
                    border: var(--ha-border-width-sm) solid var(--divider-color);
                    border-radius: var(--ha-card-border-radius, 12px);
                    overflow: hidden;
                    transition: transform var(--ha-animation-duration-fast, 0.1s) ease, opacity var(--ha-animation-duration-fast, 0.1s) ease;
                }
                .option-row.drag-over {
                    transform: translateY(-3px);
                    border-color: var(--primary-color);
                }
                .option-row.dragging { opacity: 0.4; }

                .option-header {
                    display: flex;
                    align-items: center;
                    gap: var(--ha-space-3);
                    padding: var(--ha-space-3);
                    cursor: pointer;
                    user-select: none;
                    background: var(--secondary-background-color);
                }
                .option-header:hover {
                    background: var(--primary-background-color);
                }

                .drag-handle {
                    cursor: grab;
                    color: var(--secondary-text-color);
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    --mdc-icon-size: 20px;
                }
                .drag-handle:active { cursor: grabbing; }

                .option-icon {
                    color: var(--primary-color);
                    --mdc-icon-size: 24px;
                    flex-shrink: 0;
                }

                .option-info {
                    flex: 1;
                    min-width: 0;
                }

                .option-title-row {
                    display: flex;
                    align-items: center;
                    gap: var(--ha-space-2);
                    margin-bottom: var(--ha-space-1);
                }

                .option-title {
                    font-weight: 600;
                    font-size: 18px;
                }

                .option-details {
                    font-size: 12px;
                    color: var(--secondary-text-color);
                    font-family: monospace;
                }

                .option-actions {
                    display: flex;
                    gap: var(--ha-space-1);
                }

                .layer-badge {
                    font-size: 11px;
                    padding: 2px var(--ha-space-2);
                    background: var(--primary-color);
                    color: var(--text-primary-color);
                    border-radius: var(--ha-border-radius-lg);
                    font-weight: 600;
                }

                ha-icon-button {
                    --ha-icon-button-size: 36px;
                    --mdc-icon-size: 20px;
                }

                .expand-icon {
                    transition: transform var(--ha-animation-duration-normal, 0.2s);
                    flex-shrink: 0;
                }

                .expand-icon.expanded {
                    transform: rotate(180deg);
                }

                .option-body {
                    padding: var(--ha-space-4) 14px;
                    background: var(--card-background-color);
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                /* ── Add option row ── */
                .add-option-row {
                    display: flex;
                    gap: var(--ha-space-2);
                    align-items: center;
                    margin-top: var(--ha-space-2);
                }
                .add-option-row ha-input { flex: 1; }

                /* ── Entity sync strip ── */
                .entity-sync-strip {
                    display: flex;
                    align-items: center;
                    gap: var(--ha-space-2);
                    padding: var(--ha-space-2) 10px;
                    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
                    border-radius: 6px;
                    font-size: 12px;
                    margin-bottom: var(--ha-space-2);
                }
            `]}constructor(){super(),this.cardType="select-menu",this._expandedOption=null,this._dragIndex=-1,this._dragOverIndex=-1,this._addOptionValue="",this._confirmAction=null,this._buttonTemplateDialogRef=null,f.debug("[LCARdSSelectMenuEditor] Initialized")}_getPresetOptions(){var t,a,o;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.stylePresetManager,i=((o=e==null?void 0:e.getAvailablePresets)==null?void 0:o.call(e,"button"))||[];return[{value:"",label:"(None)"},...i.map(n=>({value:n,label:n.replace(/-/g," ").replace(/\b\w/g,l=>l.toUpperCase())}))]}_getWorkingOptionsList(){var a,o,n,l;const e=(a=this.config)==null?void 0:a.options,i=(o=this.config)==null?void 0:o.entity,t=i&&this.hass?((l=(n=this.hass.states[i])==null?void 0:n.attributes)==null?void 0:l.options)||[]:[];return e?Array.isArray(e)?e.map(d=>({...d,value:d.value,label:d.label??d.value,icon:d.icon??null,tap_action:d.tap_action??null,hold_action:d.hold_action??null,double_tap_action:d.double_tap_action??null})):t.map(d=>{const s=e[d]||{};return{...s,value:d,label:s.label??d,icon:s.icon??null,tap_action:s.tap_action??null,hold_action:s.hold_action??null,double_tap_action:s.double_tap_action??null}}):t.map(d=>({value:d,label:d,icon:null,tap_action:null,hold_action:null,double_tap_action:null}))}_hasExplicitOptions(){var e;return!!((e=this.config)!=null&&e.options)}_hasEntityOptionMismatch(){var a,o,n;const e=(a=this.config)==null?void 0:a.entity;if(!e||!this.hass||!this._hasExplicitOptions())return false;const i=new Set(((n=(o=this.hass.states[e])==null?void 0:o.attributes)==null?void 0:n.options)||[]),t=new Set(this._getWorkingOptionsList().map(l=>l.value));return[...i].some(l=>!t.has(l))||[...t].some(l=>!i.has(l))}_syncFromEntity(){var o,n,l,d;const e=(o=this.config)==null?void 0:o.entity,i=((d=(l=(n=this.hass)==null?void 0:n.states[e])==null?void 0:l.attributes)==null?void 0:d.options)||[],t=Object.fromEntries(this._getWorkingOptionsList().map(s=>[s.value,s])),a=i.map(s=>this._minimal({...t[s]||{},value:s}));this._updateConfig({options:a})}_setOptionField(e,i,t){const a=this._getWorkingOptionsList().map(n=>this._minimal(n)),o={...a[e]};t==null||t===""?delete o[i]:o[i]=t,a[e]=this._minimal(o),this._updateConfig({options:a})}_minimal(e){const{value:i,label:t,icon:a,tap_action:o,hold_action:n,double_tap_action:l,...d}=e,s={value:i};for(const[h,p]of Object.entries(d))p!=null&&(s[h]=p);return e.label&&e.label!==e.value&&(s.label=e.label),e.icon&&(s.icon=e.icon),e.tap_action&&(s.tap_action=e.tap_action),e.hold_action&&(s.hold_action=e.hold_action),e.double_tap_action&&(s.double_tap_action=e.double_tap_action),s}_moveOption(e,i){if(e===i)return;const t=this._getWorkingOptionsList().map(o=>this._minimal(o)),[a]=t.splice(e,1);t.splice(i,0,a),this._updateConfig({options:t})}_removeOption(e){const i=this._getWorkingOptionsList().map(t=>this._minimal(t));i.splice(e,1),this._updateConfig({options:i.length?i:void 0})}_addManualOption(e){if(!(e!=null&&e.trim()))return;const i=this._getWorkingOptionsList().map(t=>this._minimal(t));i.find(t=>t.value===e)||(i.push({value:e.trim()}),this._updateConfig({options:i}),this._addOptionValue="",this.requestUpdate())}_clearExplicitOptions(){const e={...this.config};delete e.options,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e}}))}_setOptionValueKey(e,i){const t=this._getWorkingOptionsList().map(a=>this._minimal(a));t[e]=this._minimal({...t[e],value:i}),this._updateConfig({options:t}),this._expandedOption=i,this.requestUpdate()}_getTabDefinitions(){return[{label:"Config",content:u(()=>this._renderConfigTab(),"content")},{label:"Grid",content:u(()=>this._renderGridTab(),"content")},{label:"Style",content:u(()=>this._renderStyleTab(),"content")},{label:"Options",content:u(()=>this._renderOptionsTab(),"content")},{label:"Actions",content:u(()=>this._renderActionsTab(),"content")},...this._getUtilityTabs()]}_renderConfigTab(){var e,i;return r`
            <lcards-form-section
                header="Entity"
                description="The input_select or select entity whose options become buttons"
                icon="mdi:list-box-outline"
                ?expanded=${true}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Entity"}
                    .helper=${"Only input_select and select domains are shown"}
                    .selector=${{entity:{filter:[{domain:"input_select"},{domain:"select"}]}}}
                    .value=${((e=this.config)==null?void 0:e.entity)||""}
                    @value-changed=${t=>this._setConfigValue("entity",t.detail.value||void 0)}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Style Preset"
                description="Button look applied to all options: lozenge, filled, outline, pill…"
                icon="mdi:palette-outline"
                ?expanded=${true}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Button Preset"}
                    .helper=${"Named style from StylePresetManager. Overridable per-option via style: config."}
                    .selector=${{select:{mode:"dropdown",options:this._getPresetOptions()}}}
                    .value=${((i=this.config)==null?void 0:i.preset)||""}
                    @value-changed=${t=>this._setConfigValue("preset",t.detail.value||void 0)}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Card Identification"
                description="ID and tags for rules engine and animation targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                ${c.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}
                ${c.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
            </lcards-form-section>

            <lcards-form-section
                header="Card Dimensions"
                description="Override height/width: most layouts size automatically"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--ha-space-2)">
                    ${c.renderField(this,"height")}
                    ${c.renderField(this,"width")}
                    ${c.renderField(this,"min_height")}
                    ${c.renderField(this,"min_width")}
                    ${c.renderField(this,"max_height")}
                    ${c.renderField(this,"max_width")}
                    ${c.renderField(this,"overflow")}
                    ${c.renderField(this,"z_index")}
                    ${c.renderField(this,"overflow_x")}
                    ${c.renderField(this,"overflow_y")}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `}_renderStyleTab(){var i;const e=(i=this.config)==null?void 0:i.button_template;return r`
            <lcards-form-section
                header="Button Style Template"
                description="Shared style applied to all option buttons"
                icon="mdi:palette-outline"
                ?expanded=${true}
                outlined>

                <lcards-message type=${e?"success":"info"}>
                    ${e?r`A button template is set. <strong>Edit Button Style…</strong> changes it.`:r`No template yet. <strong>Configure Button Style…</strong> opens the button editor to set the look of every option.`}
                </lcards-message>

                ${v({header:"What the template covers",body:r`
                        <ul>
                            <li><strong>style</strong>: fill, border and radius per state (<code>active</code> is the selected option, <code>inactive</code> the others, plus <code>hover</code> and <code>pressed</code>).</li>
                            <li><strong>text.default</strong>: font size, weight, transform and letter-spacing for all text.</li>
                            <li><strong>text.label</strong>: the style of each option's label (its text always comes from the option).</li>
                            <li><strong>min_height</strong> / <strong>padding</strong>: button size.</li>
                            <li><strong>animations</strong>: entrance and exit effects.</li>
                        </ul>
                        <p>The preset is on the Config tab; each option's label, icon and actions are on the Options tab, never in the template.</p>
                    `})}

                <div style="display:flex;gap:var(--ha-space-2);flex-wrap:wrap;margin-top:var(--ha-space-2)">
                    <ha-button @click=${()=>this._openButtonTemplateEditor()}>
                        <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                        ${e?"Edit Button Style…":"Configure Button Style…"}
                    </ha-button>
                    ${e?r`
                        <ha-button @click=${()=>this._updateConfig({button_template:void 0})}>
                            <ha-icon icon="mdi:delete-outline" slot="start"></ha-icon>
                            Clear Template
                        </ha-button>`:""}
                </div>
            </lcards-form-section>
        `}_renderGridTab(){var i;const e=((i=this.config)==null?void 0:i.grid)||{};return r`
            <lcards-form-section
                header="Layout"
                description="Columns and row height"
                icon="mdi:view-grid-outline"
                ?expanded=${true}
                outlined>

                <lcards-message type="info">
                    Defaults: 1 column, 56 px row height, matching a standard Home Assistant button card row.
                    Increase columns to show options side-by-side.
                </lcards-message>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--ha-space-2);margin-top:var(--ha-space-2)">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Columns"}
                        .helper=${"Number (e.g. 3) or CSS (e.g. repeat(auto-fill, 100px))"}
                        .selector=${{text:{}}}
                        .value=${e.columns!==void 0?String(e.columns):""}
                        @value-changed=${t=>{const a=t.detail.value,o=Number(a);this._setConfigValue("grid.columns",a?isNaN(o)?a:o:void 0)}}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Row Height"}
                        .helper=${"e.g. 56px or minmax(40px,auto). Default: 56px"}
                        .selector=${{text:{}}}
                        .value=${e["grid-auto-rows"]||""}
                        @value-changed=${t=>this._setConfigValue("grid.grid-auto-rows",t.detail.value||void 0)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Rows"}
                        .helper=${"Number of rows (e.g. 2) or CSS grid-template-rows. Blank: as many as the options need"}
                        .selector=${{text:{}}}
                        .value=${e.rows!==void 0?String(e.rows):""}
                        @value-changed=${t=>{const a=t.detail.value,o=Number(a);this._setConfigValue("grid.rows",a?isNaN(o)?a:o:void 0)}}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Spacing"
                description="Gaps between option buttons"
                icon="mdi:arrow-expand-all"
                ?expanded=${true}
                outlined>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--ha-space-2)">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Gap (all)"}
                        .helper=${"e.g. 4px. Overridden by row/col gap below."}
                        .selector=${{text:{}}}
                        .value=${e.gap||""}
                        @value-changed=${t=>this._setConfigValue("grid.gap",t.detail.value||void 0)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Row Gap"}
                        .selector=${{text:{}}}
                        .value=${e["row-gap"]||""}
                        @value-changed=${t=>this._setConfigValue("grid.row-gap",t.detail.value||void 0)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Column Gap"}
                        .selector=${{text:{}}}
                        .value=${e["column-gap"]||""}
                        @value-changed=${t=>this._setConfigValue("grid.column-gap",t.detail.value||void 0)}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Advanced CSS Grid"
                description="Power-user CSS Grid overrides"
                icon="mdi:code-braces"
                ?expanded=${false}
                outlined>
                <div style="display:flex;flex-direction:column;gap:var(--ha-space-2)">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"grid-template-columns (overrides Columns above)"}
                        .helper=${"Full CSS e.g. 60px 1fr 60px"}
                        .selector=${{text:{}}}
                        .value=${e["grid-template-columns"]||""}
                        @value-changed=${t=>this._setConfigValue("grid.grid-template-columns",t.detail.value||void 0)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"grid-auto-flow"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"",label:"row (default)"},{value:"column",label:"column"},{value:"dense",label:"dense"},{value:"row dense",label:"row dense"},{value:"column dense",label:"column dense"}]}}}
                        .value=${e["grid-auto-flow"]||""}
                        @value-changed=${t=>this._setConfigValue("grid.grid-auto-flow",t.detail.value||void 0)}>
                    </ha-selector>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--ha-space-2)">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"justify-items"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(default)"},{value:"start",label:"start"},{value:"end",label:"end"},{value:"center",label:"center"},{value:"stretch",label:"stretch"}]}}}
                            .value=${e["justify-items"]||""}
                            @value-changed=${t=>this._setConfigValue("grid.justify-items",t.detail.value||void 0)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"align-items"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(default)"},{value:"start",label:"start"},{value:"end",label:"end"},{value:"center",label:"center"},{value:"stretch",label:"stretch"}]}}}
                            .value=${e["align-items"]||""}
                            @value-changed=${t=>this._setConfigValue("grid.align-items",t.detail.value||void 0)}>
                        </ha-selector>
                    </div>
                </div>
            </lcards-form-section>
        `}_renderOptionsTab(){var o;const e=!!((o=this.config)!=null&&o.entity),i=this._hasExplicitOptions(),t=this._hasEntityOptionMismatch(),a=this._getWorkingOptionsList();return r`
            <lcards-form-section
                header="Options Source"
                description="Pull from entity automatically, or manage options manually"
                icon="mdi:shape-plus"
                ?expanded=${true}
                outlined>

                <div style="display:flex;gap:var(--ha-space-2);flex-wrap:wrap;margin-bottom:var(--ha-space-1)">
                    <ha-button
                            appearance=${i?"outlined":"accent"}
                            @click=${()=>i?this._requestConfirm("switch-to-entity"):null}>
                        <ha-icon icon="mdi:link-variant" slot="start"></ha-icon>
                        Entity-linked${i?"":" ✓"}
                    </ha-button>
                    <ha-button
                            appearance=${i?"accent":"outlined"}
                            @click=${()=>i?null:this._requestConfirm("switch-to-manual")}>
                        <ha-icon icon="mdi:playlist-edit" slot="start"></ha-icon>
                        Manual / Overrides${i?" ✓":""}
                    </ha-button>
                </div>

                ${i?r`
                    ${t?r`
                        <div class="entity-sync-strip">
                            <ha-icon icon="mdi:sync-alert"></ha-icon>
                            <span style="flex:1">Entity options have changed since last sync.</span>
                            <ha-button dense @click=${()=>this._requestConfirm("sync-from-entity")}>
                                Reset from entity…
                            </ha-button>
                        </div>`:""}
                    <lcards-message type="info">
                        Options below are stored in your card config.<br>
                        <strong>Drag</strong> to reorder &nbsp;\u2022&nbsp;
                        <strong>click a row</strong> to edit &nbsp;\u2022&nbsp;
                        <strong>trash icon</strong> to remove.<br>
                        Entity: ${e?this.config.entity:"<em>none (manual-only)</em>"}
                    </lcards-message>
                `:r`
                    <lcards-message type="info">
                        Options are read automatically from the entity attribute.<br>
                        Switch to <strong>Manual / Overrides</strong> to reorder, rename, filter,
                        or create options that aren't in the entity.
                    </lcards-message>
                    ${e?"":r`
                        <lcards-message type="warning">
                            No entity set. Configure one on the Config tab, or use Manual mode
                            to define options without an entity.
                        </lcards-message>`}
                `}
            </lcards-form-section>

            <lcards-form-section
                header="Options List"
                description="${a.length} option${a.length!==1?"s":""}"
                icon="mdi:format-list-bulleted"
                ?expanded=${true}
                outlined>

                ${a.length===0?r`
                    <lcards-message type="info">
                        No options yet.
                        ${e&&!i?"Waiting for entity to load, or switch to Manual mode.":e?'Click "Sync from entity" above to populate.':"Add options below."}
                    </lcards-message>`:""}

                <div class="options-list"
                     @dragover=${n=>n.preventDefault()}
                     @drop=${n=>{n.preventDefault(),this._onListDrop()}}>
                    ${a.map((n,l)=>this._renderOptionRow(n,l,i))}
                </div>

                ${this._renderAddRow(i)}
            </lcards-form-section>

            ${this._renderConfirmDialog()}
        `}_renderOptionRow(e,i,t){const a=this._expandedOption===e.value,o=this._dragIndex===i,n=this._dragOverIndex===i,l=e.label&&e.label!==e.value,d=l?e.label:e.value;return r`
            <div class="option-row ${o?"dragging":""} ${n?"drag-over":""}"
                 draggable="true"
                 @dragstart=${s=>this._onDragStart(s,i)}
                 @dragend=${()=>{this._dragIndex=-1,this._dragOverIndex=-1,this.requestUpdate()}}
                 @dragenter=${s=>{s.preventDefault(),this._dragOverIndex=i,this.requestUpdate()}}>

                <div class="option-header"
                     @click=${()=>{this._expandedOption=a?null:e.value,this.requestUpdate()}}>

                    <!-- Drag handle -->
                    <ha-icon
                        class="drag-handle"
                        icon="mdi:drag"
                        @click=${s=>s.stopPropagation()}>
                    </ha-icon>

                    <!-- Option icon -->
                    <ha-icon
                        class="option-icon"
                        icon=${e.icon||"mdi:circle-small"}>
                    </ha-icon>

                    <!-- Info block -->
                    <div class="option-info">
                        <div class="option-title-row">
                            <span class="option-title">${d}</span>
                            ${e.icon?r`<span class="layer-badge">ICON</span>`:""}
                            ${e.tap_action?r`<span class="layer-badge">TAP</span>`:""}
                            ${e.hold_action||e.double_tap_action?r`<span class="layer-badge">ACT</span>`:""}
                        </div>
                        ${l?r`<div class="option-details">${e.value}</div>`:""}
                    </div>

                    <!-- Action buttons -->
                    <div class="option-actions">
                        ${t?r`
                            <ha-icon-button
                                @click=${s=>{s.stopPropagation(),this._removeOption(i)}}
                                .label=${"Delete"}
                                .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
                            </ha-icon-button>`:""}
                    </div>

                    <!-- Expand chevron -->
                    <ha-icon
                        class="expand-icon ${a?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                ${a?r`
                    <div class="option-body">
                        ${this._renderOptionBody(e,i,t)}
                    </div>`:""}
            </div>
        `}_renderOptionBody(e,i,t){return r`
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--ha-space-2)">
                    ${t?r`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Value (entity key, case-sensitive)"}
                            .selector=${{text:{}}}
                            .value=${e.value}
                            @value-changed=${a=>{a.detail.value&&a.detail.value!==e.value&&this._setOptionValueKey(i,a.detail.value)}}>
                        </ha-selector>`:r`
                        <div>
                            <div style="font-size:11px;color:var(--secondary-text-color);padding-bottom:2px">Entity value (read-only)</div>
                            <div style="font-size:13px;font-family:var(--lcars-font,'Antonio',sans-serif);letter-spacing:0.04em;color:var(--primary-color,#ff9900)">${e.value}</div>
                        </div>`}

                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Display Label"}
                        .helper=${"Override the visible name (leave blank to use value)"}
                        .selector=${{text:{}}}
                        .value=${e.label!==e.value&&e.label||""}
                        @value-changed=${a=>this._setOptionField(i,"label",a.detail.value||void 0)}>
                    </ha-selector>
                </div>

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Icon (optional, e.g. mdi:home)"}
                    .selector=${{icon:{}}}
                    .value=${e.icon||""}
                    @value-changed=${a=>this._setOptionField(i,"icon",a.detail.value||void 0)}>
                </ha-selector>

                <div style="font-size:12px;color:var(--secondary-text-color);margin-top:2px">
                    <strong>Per-option actions</strong>: override card-level actions for this option only.
                    Leave as “None” to fall back to the card-level setting.
                </div>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Tap action (this option only)"}
                    .selector=${{ui_action:{}}}
                    .value=${e.tap_action||{action:"none"}}
                    @value-changed=${a=>{const o=a.detail.value;this._setOptionField(i,"tap_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Hold action (this option only)"}
                    .selector=${{ui_action:{}}}
                    .value=${e.hold_action||{action:"none"}}
                    @value-changed=${a=>{const o=a.detail.value;this._setOptionField(i,"hold_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Double-tap action (this option only)"}
                    .selector=${{ui_action:{}}}
                    .value=${e.double_tap_action||{action:"none"}}
                    @value-changed=${a=>{const o=a.detail.value;this._setOptionField(i,"double_tap_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
        `}_renderAddRow(e){return e?r`
            <div class="add-option-row">
                <ha-input
                    label="New option value"
                    .value=${this._addOptionValue}
                    @input=${i=>{this._addOptionValue=i.target.value}}
                    @keydown=${i=>{i.key==="Enter"&&this._addManualOption(this._addOptionValue)}}>
                </ha-input>
                <ha-icon-button
                    .label=${"Add option"}
                    .path=${"M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"}
                    @click=${()=>this._addManualOption(this._addOptionValue)}>
                </ha-icon-button>
            </div>
        `:r`
                <ha-button style="margin-top:var(--ha-space-2);width:100%" @click=${()=>this._syncFromEntity()}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Switch to Manual mode to add / edit options
                </ha-button>`}_onDragStart(e,i){this._dragIndex=i,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",String(i)),this.requestUpdate()}_onListDrop(){this._dragIndex>=0&&this._dragOverIndex>=0&&this._dragIndex!==this._dragOverIndex&&this._moveOption(this._dragIndex,this._dragOverIndex),this._dragIndex=-1,this._dragOverIndex=-1,this.requestUpdate()}_renderActionsTab(){var e,i,t;return r`
            ${v({header:"How actions work",id:"select-menu-actions",body:r`
                    <p>A tap uses the option's own action first, then the Tap Action below, then selects the option.</p>
                    <ol>
                        <li><strong>Per-option tap action</strong> (Options tab) wins, for that option only.</li>
                        <li><strong>Tap Action</strong> (below) applies to every option without its own.</li>
                        <li>Otherwise the tap selects the option (<code>select_option</code> / <code>input_select.select_option</code>).</li>
                    </ol>
                    <lcards-message type="info">
                        <strong>Hold</strong> and <strong>Double-Tap</strong> do nothing unless set here (for all options)
                        or per option; they don't fall back to the tap action.
                    </lcards-message>
                `})}

            <lcards-form-section
                header="Tap Action"
                description="Override the built-in select_option call for ALL options. Per-option tap actions (Options tab) take priority."
                icon="mdi:gesture-tap"
                ?expanded=${false}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Tap action (all options)"}
                    .helper=${"Overrides the default select_option call. Leave blank for default behavior."}
                    .selector=${{ui_action:{}}}
                    .value=${((e=this.config)==null?void 0:e.tap_action)||{action:"none"}}
                    @value-changed=${a=>{const o=a.detail.value;this._setConfigValue("tap_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Hold Action"
                description="Long-press on any option button. Per-option (Options tab) overrides this."
                icon="mdi:gesture-tap-button"
                ?expanded=${false}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Hold action"}
                    .selector=${{ui_action:{}}}
                    .value=${((i=this.config)==null?void 0:i.hold_action)||{action:"none"}}
                    @value-changed=${a=>{const o=a.detail.value;this._setConfigValue("hold_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Double-Tap Action"
                description="Double-tap on any option button. Per-option (Options tab) overrides this."
                icon="mdi:gesture-double-tap"
                ?expanded=${false}
                outlined>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Double-tap action"}
                    .selector=${{ui_action:{}}}
                    .value=${((t=this.config)==null?void 0:t.double_tap_action)||{action:"none"}}
                    @value-changed=${a=>{const o=a.detail.value;this._setConfigValue("double_tap_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
            </lcards-form-section>
        `}_requestConfirm(e){this._confirmAction=e,this.requestUpdate()}_cancelConfirm(){this._confirmAction=null,this.requestUpdate()}_executeConfirmedAction(){const e=this._confirmAction;this._confirmAction=null,this.requestUpdate(),e==="switch-to-entity"?this._clearExplicitOptions():e==="switch-to-manual"?this._syncFromEntity():e==="sync-from-entity"&&this._syncFromEntity()}_renderConfirmDialog(){if(!this._confirmAction)return"";const e={"switch-to-entity":{title:"Switch to Entity-linked?",body:"This will remove all stored option overrides. Options will be read live from the entity. This cannot be undone."},"switch-to-manual":{title:"Switch to Manual / Overrides?",body:"This will copy the current entity options into your config so you can reorder, rename, or add options. The entity will no longer be the live source."},"sync-from-entity":{title:"Reset options from entity?",body:"This will replace your stored options with the current entity options, preserving existing labels, icons, and actions for matching values. Values not in the entity will be removed."}},{title:i,body:t}=e[this._confirmAction]||{title:"Confirm",body:"Are you sure?"};return r`
            <ha-dialog open .headerTitle=${i} @closed=${a=>{a.stopPropagation(),a.target===a.currentTarget&&this._cancelConfirm()}}>
                <p style="margin:0;line-height:1.6">${t}</p>
                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" appearance="plain" variant="neutral" autofocus @click=${()=>this._cancelConfirm()}>Cancel</ha-button>
                    <ha-button slot="primaryAction" variant="danger" @click=${()=>this._executeConfirmedAction()}>Confirm</ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_openButtonTemplateEditor(){var s;if(!customElements.get("hui-card-element-editor")){f.warn("[LCARdSSelectMenuEditor] hui-card-element-editor not available");return}this._buttonTemplateDialogRef&&(this._buttonTemplateDialogRef.remove(),this._buttonTemplateDialogRef=null);const e=((s=this.config)==null?void 0:s.button_template)||{},i=JSON.parse(JSON.stringify({...e,type:"custom:lcards-button"})),t=document.createElement("ha-dialog");t.headerTitle="Button Style Template",t.setAttribute("prevent-scrim-close",""),this._buttonTemplateDialogRef=t;const a=document.createElement("div");a.style.cssText="padding:var(--ha-space-4);min-height:300px;min-width:min(480px,90vw);box-sizing:border-box";const o=document.createElement("hui-card-element-editor");o.hass=this.hass,o.lovelace=this._getButtonTemplateLovelace(),o.value=i;let n=i;o.addEventListener("config-changed",h=>{var p;(p=h.detail)!=null&&p.config&&typeof h.detail.config=="object"&&h.detail.config.type&&(n=h.detail.config)}),o.addEventListener("value-changed",h=>{var p;(p=h.detail)!=null&&p.value&&typeof h.detail.value=="object"&&h.detail.value.type&&(n=h.detail.value)}),a.appendChild(o),t.appendChild(a);const l=document.createElement("ha-button");l.setAttribute("appearance","plain"),l.setAttribute("variant","neutral"),l.textContent="Cancel",l.addEventListener("click",()=>{t.open=false});const d=document.createElement("ha-button");d.setAttribute("variant","brand"),d.textContent="Save",d.addEventListener("click",()=>{n!=null&&n.type&&this._updateConfig({button_template:this._sanitizeButtonTemplate(n)}),t.open=false}),t.appendChild($({secondary:[l],primary:[d]})),x(t,()=>{t.remove(),this._buttonTemplateDialogRef===t&&(this._buttonTemplateDialogRef=null)}),w(t,this),setTimeout(()=>{t.open=true},10)}_getButtonTemplateLovelace(){var i;let e=((i=this.lovelace)==null?void 0:i.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}_sanitizeButtonTemplate(e){var a;if(!e||typeof e!="object")return e;const i=new Set(["type","entity","icon","show_icon","preset","tap_action","hold_action","double_tap_action","id","tags"]),t=Object.fromEntries(Object.entries(e).filter(([o])=>!i.has(o)));if(t.text!=null){const{content:o,...n}=((a=t.text)==null?void 0:a.label)||{},l={...t.text,...Object.keys(n).length?{label:n}:{}};Object.keys(n).length||delete l.label,Object.keys(l).length?t.text=l:delete t.text}return t}};u(m,"LCARdSSelectMenuEditor");let g=m;customElements.get("lcards-select-menu-editor")||customElements.define("lcards-select-menu-editor",g);export{g as LCARdSSelectMenuEditor};
//# sourceMappingURL=lcards-select-menu-editor-hjiu-3Ph.js.map
