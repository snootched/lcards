var y=Object.defineProperty;var u=(_,e)=>y(_,"name",{value:e,configurable:true});import{a as $,l as v,b as l,m as x}from"./lcards-main-C10Twmlb.js";import{a as w,L as h}from"./studio-dialog-styles-C5BrIaK5.js";import{r as b}from"./lcards-message-BMG6miXA.js";import"./lcards-form-section-DSoN9OMH.js";import"./lcards-color-section-v2-Gczjko6d.js";import"./lcards-datasource-editor-tab-COJ5jJtL.js";import"./lcards-template-evaluation-tab-Dva6rgtd.js";import"./lcards-provenance-tab-DK2bC-ht.js";const f=class f2 extends w{static get properties(){return{...super.properties,_expandedOption:{type:String,state:true},_dragIndex:{type:Number,state:true},_dragOverIndex:{type:Number,state:true},_confirmAction:{type:Object,state:true}}}static get styles(){return[super.styles,$`
                /* ── Options list (matches LCARS background-animation-editor style) ── */
                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .option-row {
                    background: var(--card-background-color, var(--ha-card-background, #1c1c1c));
                    border: 1px solid var(--divider-color, #333);
                    border-radius: var(--ha-card-border-radius, 12px);
                    overflow: hidden;
                    transition: transform 0.1s ease, opacity 0.1s ease;
                }
                .option-row.drag-over {
                    transform: translateY(-3px);
                    border-color: var(--primary-color, #ff9900);
                }
                .option-row.dragging { opacity: 0.4; }

                .option-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    cursor: pointer;
                    user-select: none;
                    background: var(--secondary-background-color, #2d2d2d);
                }
                .option-header:hover {
                    background: var(--primary-background-color, #383838);
                }

                .drag-handle {
                    cursor: grab;
                    color: var(--secondary-text-color, #888);
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    --mdc-icon-size: 20px;
                }
                .drag-handle:active { cursor: grabbing; }

                .option-icon {
                    color: var(--primary-color, #ff9900);
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
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .option-title {
                    font-weight: 600;
                    font-size: 18px;
                }

                .option-details {
                    font-size: 12px;
                    color: var(--secondary-text-color, #888);
                    font-family: monospace;
                }

                .option-actions {
                    display: flex;
                    gap: 4px;
                }

                .layer-badge {
                    font-size: 11px;
                    padding: 2px 8px;
                    background: var(--primary-color);
                    color: var(--text-primary-color);
                    border-radius: 12px;
                    font-weight: 600;
                }

                ha-icon-button {
                    --ha-icon-button-size: 36px;
                    --mdc-icon-size: 20px;
                }

                .expand-icon {
                    transition: transform 0.2s;
                    flex-shrink: 0;
                }

                .expand-icon.expanded {
                    transform: rotate(180deg);
                }

                .option-body {
                    padding: 16px 14px;
                    background: var(--card-background-color, #1c1c1c);
                    border-top: 1px solid var(--divider-color, #333);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                /* ── Add option row ── */
                .add-option-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    margin-top: 8px;
                }
                .add-option-row ha-input { flex: 1; }

                /* ── Entity sync strip ── */
                .entity-sync-strip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 10px;
                    background: color-mix(in srgb, var(--primary-color, #ff9900) 15%, transparent);
                    border-radius: 6px;
                    font-size: 12px;
                    margin-bottom: 8px;
                }
            `]}constructor(){super(),this.cardType="select-menu",this._expandedOption=null,this._dragIndex=-1,this._dragOverIndex=-1,this._addOptionValue="",this._confirmAction=null,this._buttonTemplateDialogRef=null,v.debug("[LCARdSSelectMenuEditor] Initialized")}_getPresetOptions(){var i,n,o;const e=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.stylePresetManager,t=((o=e==null?void 0:e.getAvailablePresets)==null?void 0:o.call(e,"button"))||[];return[{value:"",label:"(None)"},...t.map(a=>({value:a,label:a.replace(/-/g," ").replace(/\b\w/g,s=>s.toUpperCase())}))]}_getWorkingOptionsList(){var n,o,a,s;const e=(n=this.config)==null?void 0:n.options,t=(o=this.config)==null?void 0:o.entity,i=t&&this.hass?((s=(a=this.hass.states[t])==null?void 0:a.attributes)==null?void 0:s.options)||[]:[];return e?Array.isArray(e)?e.map(r=>({value:r.value,label:r.label??r.value,icon:r.icon??null,tap_action:r.tap_action??null,hold_action:r.hold_action??null,double_tap_action:r.double_tap_action??null})):i.map(r=>{const d=e[r]||{};return{value:r,label:d.label??r,icon:d.icon??null,tap_action:d.tap_action??null,hold_action:d.hold_action??null,double_tap_action:d.double_tap_action??null}}):i.map(r=>({value:r,label:r,icon:null,tap_action:null,hold_action:null,double_tap_action:null}))}_hasExplicitOptions(){var e;return!!((e=this.config)!=null&&e.options)}_hasEntityOptionMismatch(){var n,o,a;const e=(n=this.config)==null?void 0:n.entity;if(!e||!this.hass||!this._hasExplicitOptions())return false;const t=new Set(((a=(o=this.hass.states[e])==null?void 0:o.attributes)==null?void 0:a.options)||[]),i=new Set(this._getWorkingOptionsList().map(s=>s.value));return[...t].some(s=>!i.has(s))||[...i].some(s=>!t.has(s))}_syncFromEntity(){var o,a,s,r;const e=(o=this.config)==null?void 0:o.entity,t=((r=(s=(a=this.hass)==null?void 0:a.states[e])==null?void 0:s.attributes)==null?void 0:r.options)||[],i=Object.fromEntries(this._getWorkingOptionsList().map(d=>[d.value,d])),n=t.map(d=>{const p=i[d]||{},c={value:d};return p.label&&p.label!==d&&(c.label=p.label),p.icon&&(c.icon=p.icon),p.tap_action&&(c.tap_action=p.tap_action),p.hold_action&&(c.hold_action=p.hold_action),p.double_tap_action&&(c.double_tap_action=p.double_tap_action),c});this._updateConfig({options:n})}_setOptionField(e,t,i){const n=this._getWorkingOptionsList().map(a=>this._minimal(a)),o={...n[e]};i==null||i===""?delete o[t]:o[t]=i,n[e]=this._minimal(o),this._updateConfig({options:n})}_minimal(e){const t={value:e.value};return e.label&&e.label!==e.value&&(t.label=e.label),e.icon&&(t.icon=e.icon),e.tap_action&&(t.tap_action=e.tap_action),e.hold_action&&(t.hold_action=e.hold_action),e.double_tap_action&&(t.double_tap_action=e.double_tap_action),t}_moveOption(e,t){if(e===t)return;const i=this._getWorkingOptionsList().map(o=>this._minimal(o)),[n]=i.splice(e,1);i.splice(t,0,n),this._updateConfig({options:i})}_removeOption(e){const t=this._getWorkingOptionsList().map(i=>this._minimal(i));t.splice(e,1),this._updateConfig({options:t.length?t:void 0})}_addManualOption(e){if(!(e!=null&&e.trim()))return;const t=this._getWorkingOptionsList().map(i=>this._minimal(i));t.find(i=>i.value===e)||(t.push({value:e.trim()}),this._updateConfig({options:t}),this._addOptionValue="",this.requestUpdate())}_clearExplicitOptions(){const e={...this.config};delete e.options,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e}}))}_setOptionValueKey(e,t){const i=this._getWorkingOptionsList().map(n=>this._minimal(n));i[e]=this._minimal({...i[e],value:t}),this._updateConfig({options:i}),this._expandedOption=t,this.requestUpdate()}_getTabDefinitions(){return[{label:"Config",content:u(()=>this._renderConfigTab(),"content")},{label:"Grid",content:u(()=>this._renderGridTab(),"content")},{label:"Style",content:u(()=>this._renderStyleTab(),"content")},{label:"Options",content:u(()=>this._renderOptionsTab(),"content")},{label:"Actions",content:u(()=>this._renderActionsTab(),"content")},...this._getUtilityTabs()]}_renderConfigTab(){var e,t;return l`
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
                    @value-changed=${i=>this._setConfigValue("entity",i.detail.value||void 0)}>
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
                    .value=${((t=this.config)==null?void 0:t.preset)||""}
                    @value-changed=${i=>this._setConfigValue("preset",i.detail.value||void 0)}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Card Identification"
                description="ID and tags for rules engine and animation targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                ${h.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}
                ${h.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
            </lcards-form-section>

            <lcards-form-section
                header="Card Dimensions"
                description="Override height/width: most layouts size automatically"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                    ${h.renderField(this,"height")}
                    ${h.renderField(this,"width")}
                    ${h.renderField(this,"min_height")}
                    ${h.renderField(this,"min_width")}
                    ${h.renderField(this,"max_height")}
                    ${h.renderField(this,"max_width")}
                    ${h.renderField(this,"overflow")}
                    ${h.renderField(this,"z_index")}
                    ${h.renderField(this,"overflow_x")}
                    ${h.renderField(this,"overflow_y")}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `}_renderStyleTab(){var t;const e=(t=this.config)==null?void 0:t.button_template;return l`
            <lcards-form-section
                header="Button Style Template"
                description="Shared style applied to all option buttons"
                icon="mdi:palette-outline"
                ?expanded=${true}
                outlined>

                <lcards-message type=${e?"success":"info"}>
                    ${e?l`A button template is set. <strong>Edit Button Style…</strong> changes it.`:l`No template yet. <strong>Configure Button Style…</strong> opens the button editor to set the look of every option.`}
                </lcards-message>

                ${b({header:"What the template covers",body:l`
                        <ul>
                            <li><strong>style</strong>: fill, border and radius per state (<code>active</code> is the selected option, <code>inactive</code> the others, plus <code>hover</code> and <code>pressed</code>).</li>
                            <li><strong>text.default</strong>: font size, weight, transform and letter-spacing for all text.</li>
                            <li><strong>text.label</strong>: the style of each option's label (its text always comes from the option).</li>
                            <li><strong>min_height</strong> / <strong>padding</strong>: button size.</li>
                            <li><strong>animations</strong>: entrance and exit effects.</li>
                        </ul>
                        <p>The preset is on the Config tab; each option's label, icon and actions are on the Options tab, never in the template.</p>
                    `})}

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                    <ha-button @click=${()=>this._openButtonTemplateEditor()}>
                        <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                        ${e?"Edit Button Style…":"Configure Button Style…"}
                    </ha-button>
                    ${e?l`
                        <ha-button @click=${()=>this._updateConfig({button_template:void 0})}>
                            <ha-icon icon="mdi:delete-outline" slot="start"></ha-icon>
                            Clear Template
                        </ha-button>`:""}
                </div>
            </lcards-form-section>
        `}_renderGridTab(){var t;const e=((t=this.config)==null?void 0:t.grid)||{};return l`
            <lcards-form-section
                header="Layout"
                description="Columns and row height"
                icon="mdi:view-grid-outline"
                ?expanded=${true}
                outlined>

                <lcards-message type="info">
                    Defaults: 1 column, 56 px row height, matching a standard HA button card row.
                    Increase columns to show options side-by-side.
                </lcards-message>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Columns"}
                        .helper=${"Number (e.g. 3) or CSS (e.g. repeat(auto-fill, 100px))"}
                        .selector=${{text:{}}}
                        .value=${e.columns!==void 0?String(e.columns):""}
                        @value-changed=${i=>{const n=i.detail.value,o=Number(n);this._setConfigValue("grid.columns",n?isNaN(o)?n:o:void 0)}}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Row Height"}
                        .helper=${"e.g. 56px or minmax(40px,auto). Default: 56px"}
                        .selector=${{text:{}}}
                        .value=${e["grid-auto-rows"]||""}
                        @value-changed=${i=>this._setConfigValue("grid.grid-auto-rows",i.detail.value||void 0)}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Spacing"
                description="Gaps between option buttons"
                icon="mdi:arrow-expand-all"
                ?expanded=${true}
                outlined>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Gap (all)"}
                        .helper=${"e.g. 4px. Overridden by row/col gap below."}
                        .selector=${{text:{}}}
                        .value=${e.gap||""}
                        @value-changed=${i=>this._setConfigValue("grid.gap",i.detail.value||void 0)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Row Gap"}
                        .selector=${{text:{}}}
                        .value=${e["row-gap"]||""}
                        @value-changed=${i=>this._setConfigValue("grid.row-gap",i.detail.value||void 0)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Column Gap"}
                        .selector=${{text:{}}}
                        .value=${e["column-gap"]||""}
                        @value-changed=${i=>this._setConfigValue("grid.column-gap",i.detail.value||void 0)}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Advanced CSS Grid"
                description="Power-user CSS Grid overrides"
                icon="mdi:code-braces"
                ?expanded=${false}
                outlined>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"grid-template-columns (overrides Columns above)"}
                        .helper=${"Full CSS e.g. 60px 1fr 60px"}
                        .selector=${{text:{}}}
                        .value=${e["grid-template-columns"]||""}
                        @value-changed=${i=>this._setConfigValue("grid.grid-template-columns",i.detail.value||void 0)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"grid-auto-flow"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"",label:"row (default)"},{value:"column",label:"column"},{value:"row dense",label:"row dense"},{value:"column dense",label:"column dense"}]}}}
                        .value=${e["grid-auto-flow"]||""}
                        @value-changed=${i=>this._setConfigValue("grid.grid-auto-flow",i.detail.value||void 0)}>
                    </ha-selector>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"justify-items"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(default)"},{value:"start",label:"start"},{value:"end",label:"end"},{value:"center",label:"center"},{value:"stretch",label:"stretch"}]}}}
                            .value=${e["justify-items"]||""}
                            @value-changed=${i=>this._setConfigValue("grid.justify-items",i.detail.value||void 0)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"align-items"}
                            .selector=${{select:{mode:"dropdown",options:[{value:"",label:"(default)"},{value:"start",label:"start"},{value:"end",label:"end"},{value:"center",label:"center"},{value:"stretch",label:"stretch"}]}}}
                            .value=${e["align-items"]||""}
                            @value-changed=${i=>this._setConfigValue("grid.align-items",i.detail.value||void 0)}>
                        </ha-selector>
                    </div>
                </div>
            </lcards-form-section>
        `}_renderOptionsTab(){var o;const e=!!((o=this.config)!=null&&o.entity),t=this._hasExplicitOptions(),i=this._hasEntityOptionMismatch(),n=this._getWorkingOptionsList();return l`
            <lcards-form-section
                header="Options Source"
                description="Pull from entity automatically, or manage options manually"
                icon="mdi:shape-plus"
                ?expanded=${true}
                outlined>

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                    <ha-button
                            appearance=${t?"outlined":"accent"}
                            @click=${()=>t?this._requestConfirm("switch-to-entity"):null}>
                        <ha-icon icon="mdi:link-variant" slot="start"></ha-icon>
                        Entity-linked${t?"":" ✓"}
                    </ha-button>
                    <ha-button
                            appearance=${t?"accent":"outlined"}
                            @click=${()=>t?null:this._requestConfirm("switch-to-manual")}>
                        <ha-icon icon="mdi:playlist-edit" slot="start"></ha-icon>
                        Manual / Overrides${t?" ✓":""}
                    </ha-button>
                </div>

                ${t?l`
                    ${i?l`
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
                `:l`
                    <lcards-message type="info">
                        Options are read automatically from the entity attribute.<br>
                        Switch to <strong>Manual / Overrides</strong> to reorder, rename, filter,
                        or create options that aren't in the entity.
                    </lcards-message>
                    ${e?"":l`
                        <lcards-message type="warning">
                            No entity set. Configure one on the Config tab, or use Manual mode
                            to define options without an entity.
                        </lcards-message>`}
                `}
            </lcards-form-section>

            <lcards-form-section
                header="Options List"
                description="${n.length} option${n.length!==1?"s":""}"
                icon="mdi:format-list-bulleted"
                ?expanded=${true}
                outlined>

                ${n.length===0?l`
                    <lcards-message type="info">
                        No options yet.
                        ${e&&!t?"Waiting for entity to load, or switch to Manual mode.":e?'Click "Sync from entity" above to populate.':"Add options below."}
                    </lcards-message>`:""}

                <div class="options-list"
                     @dragover=${a=>a.preventDefault()}
                     @drop=${a=>{a.preventDefault(),this._onListDrop()}}>
                    ${n.map((a,s)=>this._renderOptionRow(a,s,t))}
                </div>

                ${this._renderAddRow(t)}
            </lcards-form-section>

            ${this._renderConfirmDialog()}
        `}_renderOptionRow(e,t,i){const n=this._expandedOption===e.value,o=this._dragIndex===t,a=this._dragOverIndex===t,s=e.label&&e.label!==e.value,r=s?e.label:e.value;return l`
            <div class="option-row ${o?"dragging":""} ${a?"drag-over":""}"
                 draggable="true"
                 @dragstart=${d=>this._onDragStart(d,t)}
                 @dragend=${()=>{this._dragIndex=-1,this._dragOverIndex=-1,this.requestUpdate()}}
                 @dragenter=${d=>{d.preventDefault(),this._dragOverIndex=t,this.requestUpdate()}}>

                <div class="option-header"
                     @click=${()=>{this._expandedOption=n?null:e.value,this.requestUpdate()}}>

                    <!-- Drag handle -->
                    <ha-icon
                        class="drag-handle"
                        icon="mdi:drag"
                        @click=${d=>d.stopPropagation()}>
                    </ha-icon>

                    <!-- Option icon -->
                    <ha-icon
                        class="option-icon"
                        icon=${e.icon||"mdi:circle-small"}>
                    </ha-icon>

                    <!-- Info block -->
                    <div class="option-info">
                        <div class="option-title-row">
                            <span class="option-title">${r}</span>
                            ${e.icon?l`<span class="layer-badge">ICON</span>`:""}
                            ${e.tap_action?l`<span class="layer-badge">TAP</span>`:""}
                            ${e.hold_action||e.double_tap_action?l`<span class="layer-badge">ACT</span>`:""}
                        </div>
                        ${s?l`<div class="option-details">${e.value}</div>`:""}
                    </div>

                    <!-- Action buttons -->
                    <div class="option-actions">
                        ${i?l`
                            <ha-icon-button
                                @click=${d=>{d.stopPropagation(),this._removeOption(t)}}
                                .label=${"Delete"}
                                .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
                            </ha-icon-button>`:""}
                    </div>

                    <!-- Expand chevron -->
                    <ha-icon
                        class="expand-icon ${n?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                ${n?l`
                    <div class="option-body">
                        ${this._renderOptionBody(e,t,i)}
                    </div>`:""}
            </div>
        `}_renderOptionBody(e,t,i){return l`
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                    ${i?l`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Value (entity key, case-sensitive)"}
                            .selector=${{text:{}}}
                            .value=${e.value}
                            @value-changed=${n=>{n.detail.value&&n.detail.value!==e.value&&this._setOptionValueKey(t,n.detail.value)}}>
                        </ha-selector>`:l`
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
                        @value-changed=${n=>this._setOptionField(t,"label",n.detail.value||void 0)}>
                    </ha-selector>
                </div>

                <ha-selector
                    .hass=${this.hass}
                    .label=${"Icon (optional, e.g. mdi:home)"}
                    .selector=${{icon:{}}}
                    .value=${e.icon||""}
                    @value-changed=${n=>this._setOptionField(t,"icon",n.detail.value||void 0)}>
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
                    @value-changed=${n=>{const o=n.detail.value;this._setOptionField(t,"tap_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Hold action (this option only)"}
                    .selector=${{ui_action:{}}}
                    .value=${e.hold_action||{action:"none"}}
                    @value-changed=${n=>{const o=n.detail.value;this._setOptionField(t,"hold_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Double-tap action (this option only)"}
                    .selector=${{ui_action:{}}}
                    .value=${e.double_tap_action||{action:"none"}}
                    @value-changed=${n=>{const o=n.detail.value;this._setOptionField(t,"double_tap_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
        `}_renderAddRow(e){return e?l`
            <div class="add-option-row">
                <ha-input
                    label="New option value"
                    .value=${this._addOptionValue}
                    @input=${t=>{this._addOptionValue=t.target.value}}
                    @keydown=${t=>{t.key==="Enter"&&this._addManualOption(this._addOptionValue)}}>
                </ha-input>
                <ha-icon-button
                    .label=${"Add option"}
                    .path=${"M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"}
                    @click=${()=>this._addManualOption(this._addOptionValue)}>
                </ha-icon-button>
            </div>
        `:l`
                <ha-button style="margin-top:8px;width:100%" @click=${()=>this._syncFromEntity()}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Switch to Manual mode to add / edit options
                </ha-button>`}_onDragStart(e,t){this._dragIndex=t,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",String(t)),this.requestUpdate()}_onListDrop(){this._dragIndex>=0&&this._dragOverIndex>=0&&this._dragIndex!==this._dragOverIndex&&this._moveOption(this._dragIndex,this._dragOverIndex),this._dragIndex=-1,this._dragOverIndex=-1,this.requestUpdate()}_renderActionsTab(){var e,t,i;return l`
            ${b({header:"How actions work",id:"select-menu-actions",body:l`
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
                    @value-changed=${n=>{const o=n.detail.value;this._setConfigValue("tap_action",!o||o.action==="none"?void 0:o)}}>
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
                    .value=${((t=this.config)==null?void 0:t.hold_action)||{action:"none"}}
                    @value-changed=${n=>{const o=n.detail.value;this._setConfigValue("hold_action",!o||o.action==="none"?void 0:o)}}>
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
                    .value=${((i=this.config)==null?void 0:i.double_tap_action)||{action:"none"}}
                    @value-changed=${n=>{const o=n.detail.value;this._setConfigValue("double_tap_action",!o||o.action==="none"?void 0:o)}}>
                </ha-selector>
            </lcards-form-section>
        `}_requestConfirm(e){this._confirmAction=e,this.requestUpdate()}_cancelConfirm(){this._confirmAction=null,this.requestUpdate()}_executeConfirmedAction(){const e=this._confirmAction;this._confirmAction=null,this.requestUpdate(),e==="switch-to-entity"?this._clearExplicitOptions():e==="switch-to-manual"?this._syncFromEntity():e==="sync-from-entity"&&this._syncFromEntity()}_renderConfirmDialog(){if(!this._confirmAction)return"";const e={"switch-to-entity":{title:"Switch to Entity-linked?",body:"This will remove all stored option overrides. Options will be read live from the entity. This cannot be undone."},"switch-to-manual":{title:"Switch to Manual / Overrides?",body:"This will copy the current entity options into your config so you can reorder, rename, or add options. The entity will no longer be the live source."},"sync-from-entity":{title:"Reset options from entity?",body:"This will replace your stored options with the current entity options, preserving existing labels, icons, and actions for matching values. Values not in the entity will be removed."}},{title:t,body:i}=e[this._confirmAction]||{title:"Confirm",body:"Are you sure?"};return l`
            <ha-dialog open .headerTitle=${t} @closed=${()=>this._cancelConfirm()}>
                <p style="margin:0;line-height:1.6">${i}</p>
                <div slot="footer" style="display:flex;gap:8px;justify-content:flex-end">
                    <ha-button appearance="plain" variant="neutral" @click=${()=>this._cancelConfirm()}>Cancel</ha-button>
                    <ha-button variant="danger"                     @click=${()=>this._executeConfirmedAction()}>Confirm</ha-button>
                </div>
            </ha-dialog>
        `}_openButtonTemplateEditor(){var p;if(!customElements.get("hui-card-element-editor")){v.warn("[LCARdSSelectMenuEditor] hui-card-element-editor not available");return}this._buttonTemplateDialogRef&&(this._buttonTemplateDialogRef.remove(),this._buttonTemplateDialogRef=null);const e=((p=this.config)==null?void 0:p.button_template)||{},t=JSON.parse(JSON.stringify({...e,type:"custom:lcards-button"})),i=document.createElement("ha-dialog");i.headerTitle="Button Style Template",i.setAttribute("prevent-scrim-close",""),this._buttonTemplateDialogRef=i;const n=document.createElement("div");n.style.cssText="padding:16px;min-height:300px;min-width:min(480px,90vw);box-sizing:border-box";const o=document.createElement("hui-card-element-editor");o.hass=this.hass,o.lovelace=this._getButtonTemplateLovelace(),o.value=t;let a=t;o.addEventListener("config-changed",c=>{var g;(g=c.detail)!=null&&g.config&&typeof c.detail.config=="object"&&c.detail.config.type&&(a=c.detail.config)}),o.addEventListener("value-changed",c=>{var g;(g=c.detail)!=null&&g.value&&typeof c.detail.value=="object"&&c.detail.value.type&&(a=c.detail.value)}),n.appendChild(o),i.appendChild(n);const s=document.createElement("div");s.setAttribute("slot","footer"),s.style.cssText="display:flex;gap:8px;justify-content:flex-end";const r=document.createElement("ha-button");r.setAttribute("appearance","plain"),r.setAttribute("variant","neutral"),r.textContent="Cancel",r.addEventListener("click",()=>{i.open=false});const d=document.createElement("ha-button");d.setAttribute("variant","brand"),d.textContent="Save",d.addEventListener("click",()=>{a!=null&&a.type&&this._updateConfig({button_template:this._sanitizeButtonTemplate(a)}),i.open=false}),s.appendChild(r),s.appendChild(d),i.appendChild(s),i.addEventListener("closed",()=>{i.remove(),this._buttonTemplateDialogRef===i&&(this._buttonTemplateDialogRef=null)}),x(i,this),setTimeout(()=>{i.open=true},10)}_getButtonTemplateLovelace(){var t;let e=((t=this.lovelace)==null?void 0:t.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}_sanitizeButtonTemplate(e){var n;if(!e||typeof e!="object")return e;const t=new Set(["type","entity","icon","show_icon","preset","tap_action","hold_action","double_tap_action","id","tags"]),i=Object.fromEntries(Object.entries(e).filter(([o])=>!t.has(o)));if(i.text!=null){const{content:o,...a}=((n=i.text)==null?void 0:n.label)||{},s={...i.text,...Object.keys(a).length?{label:a}:{}};Object.keys(a).length||delete s.label,Object.keys(s).length?i.text=s:delete i.text}return i}};u(f,"LCARdSSelectMenuEditor");let m=f;customElements.get("lcards-select-menu-editor")||customElements.define("lcards-select-menu-editor",m);export{m as LCARdSSelectMenuEditor};
//# sourceMappingURL=lcards-select-menu-editor-CEZgyHK1.js.map
