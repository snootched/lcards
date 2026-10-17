var N=Object.defineProperty;var c=(n,e)=>N(n,"name",{value:e,configurable:true});import{i as F,a as L,b as o,j as y,k as V,o as M,p as H,q as I,r as P,u as W,v as U,E as B,x as Y,l as D,m as J}from"./lcards-main-BW4hZuuz.js";import{s as q,a as K,f as E,L as h}from"./studio-dialog-styles-BC3IDpnS.js";import{c as X}from"./lcards-yaml-editor-B_uxS34u.js";import{e as Q,m as Z}from"./lcards-message-DJxE4eZn.js";import"./lcards-form-section-Bxom3ojy.js";import"./lcards-rules-dashboard-kqpSJ0Jb.js";import{e as ee,n as te}from"./lcards-datasource-editor-tab-BLZdadgQ.js";import"./lcards-template-evaluation-tab-B1klA_pj.js";import"./lcards-provenance-tab-D1UONR46.js";import"./lcards-color-section-v2-C3CZPhjM.js";import"./lcards-grid-layout-BN-SjNXG.js";import"./lcards-filter-editor-Da5JBbfk.js";import"./lcards-studio-yaml-tab-Lg6_-7nV.js";const C=class C2 extends F{static get properties(){return{}}static get styles(){return L`
            :host {
                display: block;
                padding: 24px;
            }

            .diagram-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }

            .table-diagram {
                position: relative;
                width: 400px;
                height: 300px;
                margin: 0 auto;
            }

            .grid-base {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 3px solid var(--primary-color, #03a9f4);
                border-radius: 8px;
                background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.03);
                display: flex;
                align-items: flex-start;
                justify-content: flex-start;
                padding: 8px;
            }

            .grid-label {
                font-size: 10px;
                font-weight: 600;
                color: var(--primary-text-color);
                background: var(--card-background-color);
                padding: 3px 8px;
                border-radius: 4px;
                position: absolute;
                top: 8px;
                left: 8px;
                z-index: 10;
            }

            .row-band {
                position: absolute;
                left: 80px;
                top: 80px;
                width: calc(100% - 160px);
                height: 60px;
                background: rgba(255, 152, 0, 0.15);
                border: var(--ha-border-width-md) solid rgba(255, 152, 0, 0.6);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                padding-left: 8px;
                z-index: 2;
            }

            .col-band {
                position: absolute;
                left: 180px;
                top: 60px;
                width: 60px;
                height: calc(100% - 120px);
                background: rgba(76, 175, 80, 0.15);
                border: var(--ha-border-width-md) solid rgba(76, 175, 80, 0.6);
                border-radius: 4px;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                padding-bottom: 8px;
                z-index: 3;
            }

            .cell-highlight {
                position: absolute;
                left: 180px;
                top: 80px;
                width: 60px;
                height: 60px;
                background: rgba(233, 30, 99, 0.2);
                border: 3px solid rgba(233, 30, 99, 0.8);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 4;
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }

            .band-label {
                font-size: 9px;
                font-weight: 600;
                color: var(--primary-text-color);
                background: var(--card-background-color);
                padding: 2px 6px;
                border-radius: 3px;
                text-align: center;
                line-height: 1.2;
            }

            .legend {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 16px;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                color: var(--secondary-text-color);
            }

            .legend-box {
                width: 16px;
                height: 16px;
                border-radius: 3px;
                border: var(--ha-border-width-md) solid;
            }

            .legend-grid { background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1); border-color: var(--primary-color); }
            .legend-row { background: rgba(255, 152, 0, 0.15); border-color: rgba(255, 152, 0, 0.6); }
            .legend-col { background: rgba(76, 175, 80, 0.15); border-color: rgba(76, 175, 80, 0.6); }
            .legend-cell { background: rgba(233, 30, 99, 0.2); border-color: rgba(233, 30, 99, 0.8); }

            .help-text {
                margin-top: 16px;
                font-size: 11px;
                color: var(--secondary-text-color);
                line-height: 1.5;
                text-align: center;
                max-width: 500px;
            }
        `}render(){return o`
            <div class="diagram-container">
                <div class="table-diagram">
                    <!-- Grid-wide background -->
                    <div class="grid-base">
                        <div class="grid-label">Grid-Wide Styles</div>
                    </div>

                    <!-- Row-level band (horizontal) -->
                    <div class="row-band">
                        <div class="band-label">Row<br>Styles</div>
                    </div>

                    <!-- Column-level band (vertical) -->
                    <div class="col-band">
                        <div class="band-label">Col<br>Styles</div>
                    </div>

                    <!-- Cell-level highlight (intersection) -->
                    <div class="cell-highlight">
                        <div class="band-label" style="font-size: 10px;">Cell</div>
                    </div>
                </div>

                <!-- Legend -->
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-box legend-grid"></div>
                        <span>1. Grid-Wide (lowest)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box legend-col"></div>
                        <span>2. Column Styles (and header rows)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box legend-row"></div>
                        <span>3. Row Styles</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box legend-cell"></div>
                        <span>4. Cell (highest)</span>
                    </div>
                </div>

                <div class="help-text">
                    <strong>Style Precedence:</strong> Styles merge in order: grid-wide, header (header rows only),
                    column, row, cell. When a cell is in both a styled row and column, the row wins where they overlap.
                    Cell styles override all others.
                </div>
            </div>
        `}};c(C,"LCARdSStyleHierarchyDiagram");let w=C;customElements.get("lcards-style-hierarchy-diagram")||customElements.define("lcards-style-hierarchy-diagram",w);const ae=["default","active","inactive","unavailable","zero","non_zero"],S=[{value:"digit",label:"Digit (0042, 1337)"},{value:"float",label:"Float (42.17, 3.14)"},{value:"alpha",label:"Alpha (AB, XY)"},{value:"hex",label:"Hex (A3F1, 00FF)"},{value:"mixed",label:"Mixed (various)"}],A=[{value:"none",label:"None"},{value:"uppercase",label:"UPPERCASE"},{value:"lowercase",label:"lowercase"},{value:"capitalize",label:"Capitalize"}],O=[{value:"nowrap",label:"No wrap (truncate with ellipsis)"},{value:"normal",label:"Wrap (word boundaries)"},{value:"pre-wrap",label:"Wrap (preserve line breaks)"},{value:"pre-line",label:"Wrap (collapse spaces, preserve line breaks)"}],R=[{value:"flex-start",label:"Top"},{value:"center",label:"Center"},{value:"flex-end",label:"Bottom"},{value:"baseline",label:"Baseline"}],z=[{value:"left",label:"Left"},{value:"center",label:"Center"},{value:"right",label:"Right"}],j=["stretch","start","end","center"].map(n=>({value:n,label:n[0].toUpperCase()+n.slice(1)})),G=["start","end","center","stretch","space-around","space-between","space-evenly"].map(n=>({value:n,label:n.replace("-"," ").replace(/^\w/,e=>e.toUpperCase())})),ie=[{category:"Basic",items:[{label:"Entity state",template:"{{ states('sensor.temperature') }}"},{label:"Entity attribute",template:"{{ state_attr('light.kitchen', 'brightness') }}"},{label:"DataSource value",template:"{datasource:my_source:.1f}"}]},{category:"Formatted numbers",items:[{label:"Temperature",template:"{{ states('sensor.temp') | float | round(1) }}°C"},{label:"Percentage",template:"{{ states('sensor.battery') | int }}%"},{label:"Watts to kW",template:"{{ (states('sensor.power') | float / 1000) | round(2) }} kW"}]},{category:"Conditionals",items:[{label:"On/Off",template:"{{ 'ON' if is_state('light.kitchen', 'on') else 'OFF' }}"},{label:"Threshold",template:"{{ 'HOT' if states('sensor.temp') | float > 25 else 'OK' }}"}]},{category:"Time",items:[{label:"Last changed",template:"{{ relative_time(states.sensor.temperature.last_changed) }}"},{label:"Current time",template:"{{ now().strftime('%H:%M') }}"}]}],u=c(n=>!!n&&typeof n=="object"&&!Array.isArray(n),"isObject"),b=c(n=>JSON.parse(JSON.stringify(n??{})),"clone"),p=c(n=>n==null||n===""||u(n)&&Object.keys(n).length===0,"isEmptyValue"),f=c(n=>u(n)?n:{value:n??""},"toCellObject");function re(n){const e=f(n);return e.value!==void 0&&e.value!==""?String(e.value):e.entity?e.attribute?`${e.entity} · ${e.attribute}`:e.entity:""}c(re,"cellLabel");function v(n){if(!u(n))return;const e={};for(const[a,t]of Object.entries(n))if(!p(t))if(u(t)&&(a==="color"||a==="background")){const i=Object.fromEntries(Object.entries(t).filter(([,l])=>!p(l))),r=Object.keys(i);if(!r.length)continue;e[a]=r.length===1&&r[0]==="default"?i.default:i}else e[a]=t;return Object.keys(e).length?e:void 0}c(v,"pruneStyle");function _(n){const e=b(n),a=e.data_mode==="data";for(const t of["style","header_style"]){const i=v(e[t]);i?e[t]=i:delete e[t]}if(a?(delete e.format,delete e.refresh_interval,delete e.refresh_cells,e.rows=(e.rows||[]).map(t=>{const i=(t.values||[]).map(l=>{const s={...f(l)},d=v(s.style);d?s.style=d:delete s.style;for(const m of Object.keys(s))p(s[m])&&m!=="value"&&delete s[m];s.value===""&&s.entity&&delete s.value;const g=Object.keys(s);return g.length===1&&g[0]==="value"?s.value:g.length?s:""}),r=v(t.style);return!r&&!t.header?i:{values:i,...r?{style:r}:{},...t.header?{header:true}:{}}}),(!e.cell_tap_action||p(e.cell_tap_action))&&delete e.cell_tap_action):(delete e.rows,delete e.cell_tap_action,e.refresh_cells===1&&delete e.refresh_cells),Array.isArray(e.columns)){for(e.columns=e.columns.map(t=>{const i={},r=v(t==null?void 0:t.style);return r&&(i.style=r),!a&&(t!=null&&t.format)&&(i.format=t.format),i});e.columns.length&&!Object.keys(e.columns[e.columns.length-1]).length;)e.columns.pop();e.columns.length||delete e.columns}if(u(e.highlight_changes)){const t=Object.fromEntries(Object.entries(e.highlight_changes).filter(([,i])=>!p(i)));e.highlight_changes=Object.keys(t).length?t:true}else e.highlight_changes||delete e.highlight_changes;return Array.isArray(e.animations)&&!e.animations.length&&delete e.animations,Array.isArray(e.filters)&&!e.filters.length&&delete e.filters,e}c(_,"compactDataGridConfig");const k=class k2 extends F{static get properties(){return{hass:{type:Object},_workingConfig:{type:Object,state:true},_activeTab:{type:String,state:true},_stylesSubTab:{type:String,state:true},_activeCellEdit:{type:Object,state:true},_activeRowEdit:{type:Number,state:true},_activeColumnEdit:{type:Number,state:true},_showGridLines:{type:Boolean,state:true},_showAnimations:{type:Boolean,state:true}}}constructor(){super(),this.hass=null,this._initialConfig=null,this._workingConfig={},this._activeTab="mode",this._stylesSubTab="hierarchy",this._activeCellEdit=null,this._activeRowEdit=null,this._activeColumnEdit=null,this._showGridLines=true,this._showAnimations=false,this._previewRef=ee(),this._previewTimer=null,this._previewCard=null}get config(){return this._workingConfig}set config(e){this._initialConfig=e}connectedCallback(){super.connectedCallback(),this._workingConfig=this._normalize(y(b(this._initialConfig)).config),this.updateComplete.then(()=>this._updatePreviewCard())}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._previewTimer??void 0)}updated(e){super.updated(e),e.has("hass")&&this._previewCard&&(this._previewCard.hass=this.hass)}_normalize(e,{sample:a=true}={}){var i;const t=b(e);return t.type=t.type||"custom:lcards-data-grid",t.data_mode=t.data_mode||(Array.isArray(t.rows)&&t.rows.length?"data":"decorative"),t.grid=u(t.grid)?t.grid:{},Array.isArray(t.rows)&&(t.rows=V(t.rows).map(r=>({values:r.values.map(l=>b(f(l))),...r.style?{style:r.style}:{},...r.header?{header:true}:{}}))),t.data_mode==="data"&&!((i=t.rows)!=null&&i.length)&&(t.rows=a?this._sampleRows():[]),t}_sampleRows(){return[{values:[{value:"SYSTEM"},{value:"VALUE"}],header:true},{values:[{value:"CPU"},{value:"sensor.cpu_usage"}]},{values:[{value:"Memory"},{value:"sensor.memory_usage"}]}]}get _isData(){return this._workingConfig.data_mode==="data"}_getConfigValue(e){let a=this._workingConfig;for(const t of e.split(".")){if(a==null)return;a=a[t]}return a}_setConfigValue(e,a){const t=e.split(".");let i=this._workingConfig;for(let l=0;l<t.length-1;l++){const s=t[l];!u(i[s])&&!Array.isArray(i[s])&&(i[s]=/^\d+$/.test(t[l+1])?[]:{}),i=i[s]}const r=t[t.length-1];p(a)?Array.isArray(i)?i[Number(r)]=void 0:delete i[r]:i[r]=a,this._changed()}_changed(){this._workingConfig={...this._workingConfig},clearTimeout(this._previewTimer??void 0),this._previewTimer=setTimeout(()=>this._updatePreviewCard(),300)}_trackCount(e){const a=this._workingConfig;return this._isData?e==="row"?a.rows.length:Math.max(1,M(a.rows)):H(a.grid[this._templateKey(e)])||(e==="row"?8:12)}_templateKey(e){return e==="row"?"grid-template-rows":"grid-template-columns"}_editTemplate(e,a){const t=this._templateKey(e),i=e==="row"?"auto":"1fr",r=this._workingConfig.grid[t];let l;if(r){if(l=I(r),!l)return}else{if(this._isData)return;l=Array(this._trackCount(e)).fill(i)}a(l,i),this._workingConfig.grid[t]=P(l.length?l:[i])}_emptyRow(){return{values:Array.from({length:this._trackCount("col")},()=>({value:""}))}}_setTrackCount(e,a){a=Math.max(1,Math.min(50,Math.floor(Number(a))||1));const t=this._workingConfig;if(this._isData)if(e==="row"){for(;t.rows.length<a;)t.rows.push(this._emptyRow());t.rows.length=a}else{for(const i of t.rows){for(;i.values.length<a;)i.values.push({value:""});i.values.length=a}Array.isArray(t.columns)&&(t.columns.length=Math.min(t.columns.length,a))}this._editTemplate(e,(i,r)=>{for(;i.length<a;)i.push(i[i.length-1]||r);i.length=a}),this._closeEditors(),this._changed()}_insertTrack(e,a){const t=this._workingConfig;if(e==="row")t.rows.splice(a,0,this._emptyRow());else{for(const i of t.rows)i.values.splice(a,0,{value:""});Array.isArray(t.columns)&&t.columns.length>a&&t.columns.splice(a,0,{})}this._editTemplate(e,(i,r)=>i.splice(a,0,i[a]||r)),this._closeEditors(),this._changed()}_removeTrack(e,a){if(this._trackCount(e)<=1)return;const t=this._workingConfig;if(e==="row")t.rows.splice(a,1);else{for(const i of t.rows)i.values.splice(a,1);Array.isArray(t.columns)&&t.columns.splice(a,1)}this._editTemplate(e,i=>i.splice(a,1)),this._closeEditors(),this._changed()}_moveTrack(e,a,t){const i=a+t;if(i<0||i>=this._trackCount(e))return;const r=c(s=>{if(!Array.isArray(s))return;const d=Math.max(s.length,a+1,i+1);for(let g=s.length;g<d;g++)s[g]=e==="col"&&s===this._workingConfig.columns?{}:{value:""};[s[a],s[i]]=[s[i],s[a]]},"swap"),l=this._workingConfig;e==="row"?(r(l.rows),this._activeRowEdit=i):(l.rows.forEach(s=>r(s.values)),r(l.columns),this._activeColumnEdit=i),this._editTemplate(e,s=>{[s[a],s[i]]=[s[i],s[a]]}),this._changed()}_closeEditors(){this._activeCellEdit=null,this._activeRowEdit=null,this._activeColumnEdit=null}static get styles(){return[Q,q,Z,L`
            :host {
                display: block;
            }

            .tab-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: var(--ha-space-4);
                min-height: 0;
            }

            ha-tab-group {
                flex-shrink: 0;
            }

            ha-tab-group-tab {
                flex-shrink: 0;
                min-width: 120px;
                white-space: nowrap;
            }

            .canvas-toolbar-button:not(.active) {
                opacity: 0.5;
            }

            .preview-container {
                flex: 1;
                padding: var(--ha-space-6);
                background: var(--primary-background-color);
            }

            .preview-container lcards-data-grid {
                display: block;
                width: 100%;
                min-height: 300px;
            }

            lcards-form-section {
                display: block;
                margin-bottom: var(--ha-space-5);
            }

            lcards-form-section:last-child {
                margin-bottom: 0;
            }

            /* Mode selector cards */
            .mode-selector {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: var(--ha-space-3);
                margin-bottom: var(--ha-space-6);
            }

            .mode-card {
                padding: var(--ha-space-5);
                border: var(--ha-border-width-md) solid var(--divider-color);
                border-radius: var(--ha-border-radius-md);
                cursor: pointer;
                transition: border-color var(--ha-animation-duration-normal, 0.2s) ease;
                text-align: center;
                background: var(--card-background-color);
            }

            .mode-card:hover {
                border-color: var(--secondary-text-color);
            }

            .mode-card.active {
                border-color: var(--primary-color);
                background: color-mix(in srgb, var(--primary-color) 10%, var(--card-background-color));
            }

            .mode-icon {
                --mdc-icon-size: 48px;
                margin-bottom: var(--ha-space-3);
                color: var(--secondary-text-color);
            }

            .mode-card.active .mode-icon {
                color: var(--primary-color);
            }

            .mode-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 6px;
                color: var(--primary-text-color);
            }

            .mode-description {
                font-size: 12px;
                color: var(--secondary-text-color);
                line-height: 1.4;
            }

            /* Spreadsheet */
            .sheet {
                display: grid;
                gap: 2px;
                margin-top: var(--ha-space-4);
                background: var(--divider-color);
                padding: 2px;
                border-radius: var(--ha-border-radius-sm);
            }

            .sheet-corner,
            .sheet-cell {
                background: var(--card-background-color);
                padding: var(--ha-space-2);
            }

            .sheet-header {
                background: var(--primary-color);
                color: var(--text-primary-color);
                padding: var(--ha-space-2);
                text-align: center;
                font-weight: 600;
                font-size: 11px;
                cursor: pointer;
            }

            .sheet-header.selected {
                outline: var(--ha-border-width-md) solid var(--primary-text-color);
                outline-offset: -2px;
            }

            .sheet-cell {
                min-height: 36px;
                cursor: pointer;
                border: var(--ha-border-width-sm) solid transparent;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 13px;
            }

            .sheet-cell:hover,
            .sheet-cell.selected {
                border-color: var(--primary-color);
            }

            .sheet-cell.header-row {
                font-weight: 700;
                text-transform: uppercase;
            }

            .sheet-cell .styled {
                color: var(--primary-color);
                margin-left: var(--ha-space-1);
            }

            .sheet-empty {
                opacity: 0.3;
            }

            .button-row {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-2);
                margin-top: var(--ha-space-3);
            }

            .op-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: var(--ha-space-2);
            }

            .cell-type-toggle {
                display: flex;
                gap: var(--ha-space-2);
                margin-bottom: var(--ha-space-4);
            }

            .cell-type-toggle ha-button {
                flex: 1;
            }

            .field-label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                margin: var(--ha-space-3) 0 var(--ha-space-2);
                color: var(--primary-text-color);
            }

            details.overrides {
                margin-top: var(--ha-space-4);
            }

            details.overrides > summary {
                cursor: pointer;
                font-weight: 600;
                padding: var(--ha-space-2) 0;
                user-select: none;
            }

            .overrides-body {
                margin-top: var(--ha-space-3);
                padding-left: var(--ha-space-3);
                border-left: var(--ha-border-width-lg) solid var(--primary-color);
            }

            .example {
                display: grid;
                grid-template-columns: 1fr auto auto;
                gap: var(--ha-space-2);
                align-items: center;
                padding: var(--ha-space-2);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                border-radius: var(--ha-border-radius-sm);
                margin-bottom: var(--ha-space-2);
            }

            .example code {
                font-size: 11px;
                color: var(--secondary-text-color);
                word-break: break-all;
            }

            @media (max-width: 768px) {
                .mode-selector {
                    grid-template-columns: 1fr;
                }
            }
        `]}render(){const e=[{id:"mode",label:"Data Mode",icon:"mdi:view-grid"},{id:"grid-structure",label:"Grid Structure",icon:"mdi:table-settings"},{id:"grid-styles",label:"Grid Styles",icon:"mdi:palette"},{id:"effects",label:"Effects",icon:"mdi:auto-fix"},{id:"advanced",label:"Advanced",icon:"mdi:cog"},{id:"yaml",label:"YAML",icon:"mdi:code-braces"}];return o`
            <ha-dialog open flexcontent @closed=${this._onDialogClosed} header-title="Data Grid Studio">
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${a=>this._onTab(a,"_activeTab")}>
                                ${e.map(a=>o`
                                    <ha-tab-group-tab value=${a.id} ?active=${this._activeTab===a.id}>
                                        <ha-icon icon=${a.icon}></ha-icon>
                                        ${a.label}
                                    </ha-tab-group-tab>
                                `)}
                            </ha-tab-group>
                            <div class="tab-content">${this._renderActiveTab()}</div>
                        </div>

                        <div class="preview-panel">
                            <div class="canvas-toolbar">
                                <div class="canvas-toolbar-buttons">
                                    <button
                                        class="canvas-toolbar-button ${this._showGridLines?"active":""}"
                                        @click=${()=>this._togglePreview("_showGridLines")}
                                        title="Toggle grid lines">
                                        <ha-icon icon="mdi:grid"></ha-icon>
                                    </button>
                                    <button
                                        class="canvas-toolbar-button ${this._showAnimations?"active":""}"
                                        @click=${()=>this._togglePreview("_showAnimations")}
                                        title="Toggle animations">
                                        <ha-icon icon="mdi:animation-play"></ha-icon>
                                    </button>
                                </div>
                            </div>
                            <div class="preview-container">
                                <div ${te(this._previewRef)}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div slot="footer">
                    <ha-button appearance="plain" @click=${this._close}>Cancel</ha-button>
                    <ha-button variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `}_onDialogClosed(e){e.stopPropagation(),e.target===e.currentTarget&&this._close()}_onTab(e,a){var i;const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&(this[a]=t)}_renderActiveTab(){switch(this._activeTab){case"grid-structure":return this._renderGridStructureTab();case"grid-styles":return this._renderGridStylesTab();case"effects":return this._renderEffectsTab();case"advanced":return this._renderAdvancedTab();case"yaml":return o`
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${_(this._workingConfig)}
                    .schema=${W}
                    cardType="data-grid"
                    @yaml-config-changed=${e=>this._applyYaml(e.detail.config)}>
                </lcards-studio-yaml-tab>
            `;default:return this._renderModeTab()}}_select(e,a,t,{fallback:i="",inherit:r=false}={}){const l=r?[{value:"",label:"(Inherit)"},...t]:t;return o`
            <ha-selector
                .hass=${this.hass}
                .selector=${{select:{mode:"dropdown",options:l}}}
                .label=${a}
                .value=${this._getConfigValue(e)??i}
                @value-changed=${s=>this._setConfigValue(e,s.detail.value)}
                @closed=${s=>s.stopPropagation()}>
            </ha-selector>
        `}_text(e,a,t="",i=""){return o`
            <ha-input
                label=${a}
                .value=${String(this._getConfigValue(e)??"")}
                placeholder=${i}
                hint=${t}
                @input=${r=>this._setConfigValue(e,r.target.value)}>
            </ha-input>
        `}_number(e,a,{min:t=0,max:i=1e3,step:r=1,unit:l=void 0,fallback:s=void 0}={}){return o`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{mode:"box",min:t,max:i,step:r,unit_of_measurement:l}}}
                .label=${a}
                .value=${this._getConfigValue(e)??s}
                @value-changed=${d=>this._setConfigValue(e,d.detail.value)}>
            </ha-selector>
        `}_colors(e,a,t=""){return o`
            ${["color","background"].map(i=>o`
                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${t}
                    basePath=${`${e}.${i}`}
                    header=${`${a}: ${i==="color"?"Text":"Background"}`}
                    .suggestedStates=${t?ae:["default"]}
                    ?allowCustomStates=${!!t}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            `)}
        `}_renderStyleOverrides(e,a,t=""){const i=this._getConfigValue(e),r=u(i)&&Object.values(i).some(l=>!p(l));return o`
            <details class="overrides" ?open=${r}>
                <summary>
                    <ha-icon icon="mdi:palette"></ha-icon>
                    ${a} style overrides ${r?"(active)":""}
                </summary>
                <div class="overrides-body">
                    <lcards-message type="info">
                        Empty fields inherit. Order (later wins): grid, header, column, row, cell.
                        ${t?" Colours can change with the entity state (e.g. above:80).":""}
                    </lcards-message>
                    ${this._colors(e,a,t)}
                    <lcards-grid-layout>
                        ${this._text(`${e}.font_size`,"Font size","px number or CSS length","Inherit")}
                        ${this._number(`${e}.font_weight`,"Font weight",{min:100,max:900,step:100})}
                    </lcards-grid-layout>
                    <lcards-grid-layout>
                        ${this._select(`${e}.text_transform`,"Text transform",A,{inherit:true})}
                        ${this._text(`${e}.letter_spacing`,"Letter spacing","","Inherit")}
                    </lcards-grid-layout>
                    <lcards-grid-layout>
                        ${this._select(`${e}.align`,"Horizontal align",z,{inherit:true})}
                        ${this._select(`${e}.align_items`,"Vertical align",R,{inherit:true})}
                    </lcards-grid-layout>
                    ${this._select(`${e}.white_space`,"Text wrapping",O,{inherit:true})}
                    <ha-button appearance="plain" .disabled=${!r} @click=${()=>this._setConfigValue(e,void 0)}>
                        <ha-icon icon="mdi:eraser" slot="start"></ha-icon>
                        Clear ${a.toLowerCase()} styles
                    </ha-button>
                </div>
            </details>
        `}_renderModeTab(){return o`
            <lcards-form-section header="Data Mode" description="Choose how the grid gets its data" icon="mdi:view-grid" ?expanded=${true}>
                <div class="mode-selector">
                    ${[{id:"decorative",icon:"mdi:shimmer",title:"Decorative",description:"Generated LCARS-style values"},{id:"data",icon:"mdi:table-edit",title:"Data",description:"Your text, entities and templates"}].map(a=>o`
                        <div class="mode-card ${this._workingConfig.data_mode===a.id?"active":""}"
                            @click=${()=>this._setMode(a.id)}>
                            <ha-icon class="mode-icon" icon=${a.icon}></ha-icon>
                            <div class="mode-title">${a.title}</div>
                            <div class="mode-description">${a.description}</div>
                        </div>
                    `)}
                </div>
                <lcards-message type="info">
                    Switching modes keeps the other mode's settings until you save; only the active mode's keys are saved.
                </lcards-message>
            </lcards-form-section>
        `}_applyYaml(e){this._workingConfig=this._normalize(y(e).config,{sample:false}),this._closeEditors(),this._changed()}_setMode(e){var a;this._workingConfig.data_mode=e,e==="data"&&!((a=this._workingConfig.rows)!=null&&a.length)&&(this._workingConfig.rows=this._sampleRows()),this._closeEditors(),this._changed()}_renderGridStructureTab(){const e=this._workingConfig.grid;return o`
            <lcards-form-section header="Grid Dimensions" description="Rows, columns and spacing" icon="mdi:ruler" ?expanded=${true}>
                ${this._isData?o`
                    <lcards-message type="info">
                        Rows and columns follow the data below. Reducing them removes cells.
                    </lcards-message>
                `:""}
                <lcards-grid-layout>
                    ${["row","col"].map(a=>o`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:1,max:50,mode:"box"}}}
                            .value=${this._trackCount(a)}
                            .label=${a==="row"?"Rows":"Columns"}
                            @value-changed=${t=>this._setTrackCount(a,t.detail.value)}>
                        </ha-selector>
                    `)}
                </lcards-grid-layout>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:0,max:50,mode:"box",unit_of_measurement:"px"}}}
                    .value=${U(e.gap)??8}
                    .label=${"Gap"}
                    @value-changed=${a=>this._setConfigValue("grid.gap",`${Number(a.detail.value)||0}px`)}>
                </ha-selector>
            </lcards-form-section>

            ${this._isData?this._renderDataEditor():this._renderDecorativeConfig()}
        `}_renderDecorativeConfig(){const e=this._trackCount("col");return o`
            <lcards-form-section header="Decorative Values" description="Generated LCARS data" icon="mdi:shimmer" ?expanded=${true}>
                ${this._select("format","Format",S,{fallback:"mixed"})}
                <lcards-grid-layout>
                    ${this._number("refresh_interval","Refresh interval",{min:0,max:6e4,step:100,unit:"ms",fallback:0})}
                    ${this._number("refresh_cells","Cells changed per refresh",{min:.05,max:1,step:.05,fallback:1})}
                </lcards-grid-layout>
                <div class="hint">Refresh interval 0 keeps the values fixed. 1 changes every cell; 0.2 changes a fifth of them each time.</div>
            </lcards-form-section>

            <lcards-form-section header="Column Formats" description="Override the format per column" icon="mdi:table-column" ?expanded=${false}>
                <lcards-grid-layout>
                    ${Array.from({length:e},(a,t)=>this._select(`columns.${t}.format`,`Column ${t+1}`,S,{inherit:true}))}
                </lcards-grid-layout>
            </lcards-form-section>
        `}_renderDataEditor(){const e=this._workingConfig.rows,a=this._trackCount("col"),t=this._activeCellEdit;return o`
            <lcards-form-section header="Data Editor" description="Click a cell to edit it, or a header for row/column options" icon="mdi:table-edit" ?expanded=${true}>
                <lcards-message type="info">
                    A cell can hold static text, an entity (shows its state, e.g. sensor.temperature),
                    a template ({{ states('sensor.temp') }}°C), a DataSource token ({datasource:name:.1f}) or JavaScript ([[[ ... ]]]).
                </lcards-message>

                <div class="sheet" style="grid-template-columns: auto repeat(${a}, minmax(0, 1fr));">
                    <div class="sheet-corner"></div>
                    ${Array.from({length:a},(i,r)=>o`
                        <div class="sheet-header ${this._activeColumnEdit===r?"selected":""}"
                            @click=${()=>this._openEditor("column",r)}>Col ${r+1}</div>
                    `)}
                    ${e.map((i,r)=>o`
                        <div class="sheet-header ${this._activeRowEdit===r?"selected":""}"
                            @click=${()=>this._openEditor("row",r)}>Row ${r+1}${i.header?" (H)":""}</div>
                        ${Array.from({length:a},(l,s)=>{const d=i.values[s],g=re(d),m=u(d)&&(d.style||d.tap_action||d.hold_action||d.double_tap_action);return o`
                                <div class="sheet-cell ${i.header?"header-row":""} ${(t==null?void 0:t.row)===r&&(t==null?void 0:t.col)===s?"selected":""}"
                                    title=${g}
                                    @click=${()=>this._openCellEditor(r,s)}>
                                    ${g||o`<span class="sheet-empty">-</span>`}${m?o`<span class="styled">•</span>`:""}
                                </div>
                            `})}
                    `)}
                </div>

                <div class="button-row">
                    <ha-button @click=${()=>this._insertTrack("row",e.length)}>
                        <ha-icon icon="mdi:table-row-plus-after" slot="start"></ha-icon>
                        Add Row
                    </ha-button>
                    <ha-button @click=${()=>this._insertTrack("col",a)}>
                        <ha-icon icon="mdi:table-column-plus-after" slot="start"></ha-icon>
                        Add Column
                    </ha-button>
                </div>

                ${t?this._renderCellEditor():""}
                ${this._activeRowEdit!==null?this._renderTrackEditor("row",this._activeRowEdit):""}
                ${this._activeColumnEdit!==null?this._renderTrackEditor("col",this._activeColumnEdit):""}
            </lcards-form-section>

            <lcards-form-section header="Cell Actions" description="What tapping a cell does" icon="mdi:gesture-tap" ?expanded=${false}>
                <span class="field-label">Default tap action for entity cells</span>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ui_action:{}}}
                    .value=${this._workingConfig.cell_tap_action}
                    @value-changed=${i=>this._setConfigValue("cell_tap_action",i.detail.value)}>
                </ha-selector>
                <div class="hint">Leave empty to keep cells inert. Cells with their own tap action (cell editor) use that instead.</div>
            </lcards-form-section>
        `}_openEditor(e,a){const t=e==="row"?"_activeRowEdit":"_activeColumnEdit",i=this[t];this._closeEditors(),this[t]=i===a?null:a}_openCellEditor(e,a){var r;const t=f((r=this._workingConfig.rows[e])==null?void 0:r.values[a]),i=!t.value&&!!t.entity||B.test(String(t.value??""));this._closeEditors(),this._activeCellEdit={row:e,col:a,type:i?"entity":"text",value:i?"":String(t.value??""),entity:t.entity||(i?String(t.value):""),attribute:t.attribute||""}}_cellPath(){const{row:e,col:a}=this._activeCellEdit,t=this._workingConfig.rows[e].values;return u(t[a])||(t[a]=f(t[a])),`rows.${e}.values.${a}`}_saveCellContent(){const e=this._activeCellEdit,a=this._cellPath(),t=this._getConfigValue(a);delete t.value,delete t.entity,delete t.attribute,e.type==="entity"?e.attribute?Object.assign(t,{entity:e.entity,attribute:e.attribute}):t.value=e.entity:(t.value=e.value,e.entity&&(t.entity=e.entity)),this._activeCellEdit=null,this._changed()}_renderCellEditor(){const e=this._activeCellEdit,a=this._cellPath(),t=c(i=>{this._activeCellEdit={...this._activeCellEdit,...i}},"setEdit");return o`
            <lcards-form-section header="Edit Cell (Row ${e.row+1}, Col ${e.col+1})" ?expanded=${true}>
                <div class="cell-type-toggle">
                    <ha-button appearance=${e.type==="entity"?"accent":"plain"} @click=${()=>t({type:"entity"})}>
                        <ha-icon icon="mdi:home-assistant" slot="start"></ha-icon>
                        Entity
                    </ha-button>
                    <ha-button appearance=${e.type==="text"?"accent":"plain"} @click=${()=>t({type:"text"})}>
                        <ha-icon icon="mdi:text" slot="start"></ha-icon>
                        Text or template
                    </ha-button>
                </div>

                ${e.type==="entity"?o`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{entity:{}}}
                        .label=${"Entity"}
                        .value=${e.entity}
                        @value-changed=${i=>t({entity:i.detail.value||""})}>
                    </ha-selector>
                    ${e.entity?o`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{attribute:{entity_id:e.entity}}}
                            .label=${"Attribute (optional)"}
                            .value=${e.attribute}
                            @value-changed=${i=>t({attribute:i.detail.value||""})}>
                        </ha-selector>
                    `:""}
                    <div class="hint">Shows the entity state (or attribute), formatted by Home Assistant.</div>
                `:o`
                    <span class="field-label">Cell content</span>
                    <ha-code-editor
                        mode="jinja2"
                        .value=${e.value}
                        @value-changed=${i=>t({value:i.detail.value})}
                        dir="ltr"
                        autofocus>
                    </ha-code-editor>
                    <div class="hint">Static text, an entity id, a template ({{ ... }}), a DataSource token or JavaScript ([[[ ... ]]]).</div>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{entity:{}}}
                        .label=${"Entity for colours and actions (optional)"}
                        .value=${e.entity}
                        @value-changed=${i=>t({entity:i.detail.value||""})}>
                    </ha-selector>
                `}

                <div class="button-row">
                    <ha-button @click=${this._saveCellContent}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Apply
                    </ha-button>
                    <ha-button appearance="plain" @click=${()=>{this._activeCellEdit=null}}>
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Close
                    </ha-button>
                </div>

                ${this._renderStyleOverrides(`${a}.style`,"Cell",e.entity)}

                <details class="overrides" ?open=${!!this._getConfigValue(`${a}.tap_action`)}>
                    <summary><ha-icon icon="mdi:gesture-tap"></ha-icon> Cell actions</summary>
                    <div class="overrides-body">
                        ${["tap_action","hold_action","double_tap_action"].map(i=>o`
                            <span class="field-label">${i.replace(/_/g," ").replace(/^\w/,r=>r.toUpperCase())}</span>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ui_action:{}}}
                                .value=${this._getConfigValue(`${a}.${i}`)}
                                @value-changed=${r=>this._setConfigValue(`${a}.${i}`,r.detail.value)}>
                            </ha-selector>
                        `)}
                    </div>
                </details>

                ${e.type==="text"?this._renderTemplateExamples():""}
            </lcards-form-section>
        `}_renderTemplateExamples(){return o`
            <lcards-form-section header="Template Examples" description="Insert or copy common patterns" ?expanded=${false}>
                ${ie.map(e=>o`
                    <span class="field-label">${e.category}</span>
                    ${e.items.map(a=>o`
                        <div class="example">
                            <div>
                                <div>${a.label}</div>
                                <code>${a.template}</code>
                            </div>
                            <ha-icon-button .label=${"Insert into cell"}
                                @click=${()=>{this._activeCellEdit={...this._activeCellEdit,value:a.template}}}>
                                <ha-icon icon="mdi:arrow-left-bold"></ha-icon>
                            </ha-icon-button>
                            <ha-icon-button .label=${"Copy"} @click=${()=>Y(a.template)}>
                                <ha-icon icon="mdi:content-copy"></ha-icon>
                            </ha-icon-button>
                        </div>
                    `)}
                `)}
            </lcards-form-section>
        `}_renderTrackEditor(e,a){var s;const t=e==="row",i=this._trackCount(e),r=t?"Row":"Column",l=t?["mdi:table-row-plus-before","mdi:table-row-plus-after","mdi:arrow-up-bold","mdi:arrow-down-bold"]:["mdi:table-column-plus-before","mdi:table-column-plus-after","mdi:arrow-left-bold","mdi:arrow-right-bold"];return o`
            <lcards-form-section header="${r} ${a+1}" description="Insert, move, delete and style" ?expanded=${true}>
                <div class="op-grid">
                    <ha-button @click=${()=>this._insertTrack(e,a)}><ha-icon icon=${l[0]} slot="start"></ha-icon>Insert before</ha-button>
                    <ha-button @click=${()=>this._insertTrack(e,a+1)}><ha-icon icon=${l[1]} slot="start"></ha-icon>Insert after</ha-button>
                    <ha-button .disabled=${a===0} @click=${()=>this._moveTrack(e,a,-1)}><ha-icon icon=${l[2]} slot="start"></ha-icon>Move ${t?"up":"left"}</ha-button>
                    <ha-button .disabled=${a>=i-1} @click=${()=>this._moveTrack(e,a,1)}><ha-icon icon=${l[3]} slot="start"></ha-icon>Move ${t?"down":"right"}</ha-button>
                    <ha-button variant="danger" .disabled=${i<=1} @click=${()=>this._removeTrack(e,a)}><ha-icon icon="mdi:delete" slot="start"></ha-icon>Delete ${r.toLowerCase()}</ha-button>
                    <ha-button appearance="plain" @click=${()=>this._closeEditors()}><ha-icon icon="mdi:close" slot="start"></ha-icon>Close</ha-button>
                </div>
                ${t?o`
                    <ha-switch
                        .checked=${!!((s=this._workingConfig.rows[a])!=null&&s.header)}
                        @change=${d=>this._setConfigValue(`rows.${a}.header`,d.target.checked||void 0)}>
                        Header row (uses the header style)
                    </ha-switch>
                `:""}
                ${this._renderStyleOverrides(t?`rows.${a}.style`:`columns.${a}.style`,r)}
            </lcards-form-section>
        `}_renderGridStylesTab(){return o`
            <ha-tab-group @wa-tab-show=${a=>this._onTab(a,"_stylesSubTab")}>
                ${[{id:"hierarchy",label:"Style Hierarchy",icon:"mdi:file-tree"},{id:"table",label:"Grid-wide",icon:"mdi:table"},{id:"header",label:"Header Rows",icon:"mdi:table-row"}].map(a=>o`
                    <ha-tab-group-tab value=${a.id} ?active=${this._stylesSubTab===a.id}>
                        <ha-icon icon=${a.icon}></ha-icon>
                        ${a.label}
                    </ha-tab-group-tab>
                `)}
            </ha-tab-group>
            ${this._stylesSubTab==="hierarchy"?o`
                <lcards-form-section header="Style Hierarchy" description="Which style wins" icon="mdi:file-tree" ?expanded=${true}>
                    <lcards-style-hierarchy-diagram></lcards-style-hierarchy-diagram>
                </lcards-form-section>
            `:""}
            ${this._stylesSubTab==="table"?this._renderGridWideStyles():""}
            ${this._stylesSubTab==="header"?o`
                <lcards-message type="info">
                    Applies to rows marked as header rows (open a row in Grid Structure and turn on Header row),
                    on top of the built-in header look: bold, uppercase, divider line.
                </lcards-message>
                ${this._renderStyleOverrides("header_style","Header")}
            `:""}
        `}_renderGridWideStyles(){var e;return o`
            <lcards-message type="info">
                Defaults for every cell. Override per row, column or cell in the Grid Structure tab.
            </lcards-message>

            <lcards-form-section header="Typography" description="Font settings for all cells" icon="mdi:format-font" ?expanded=${false}>
                <lcards-font-selector
                    .hass=${this.hass}
                    .value=${((e=this._workingConfig.style)==null?void 0:e.font_family)||""}
                    .showPreview=${true}
                    .label=${"Font family"}
                    @value-changed=${a=>this._setConfigValue("style.font_family",a.detail.value)}>
                </lcards-font-selector>
                <lcards-grid-layout>
                    ${this._text("style.font_size","Font size","px number or CSS length (default 24)","24")}
                    ${this._number("style.font_weight","Font weight",{min:100,max:900,step:100,fallback:400})}
                </lcards-grid-layout>
                <lcards-grid-layout>
                    ${this._select("style.text_transform","Text transform",A,{fallback:"none"})}
                    ${this._text("style.letter_spacing","Letter spacing","e.g. '0.05em'","normal")}
                </lcards-grid-layout>
                ${this._text("style.line_height","Line height","e.g. '1.5'","normal")}
            </lcards-form-section>

            <lcards-form-section header="Alignment & Wrapping" description="Text wrapping and alignment" icon="mdi:format-align-center" ?expanded=${false}>
                ${this._select("style.white_space","Text wrapping",O,{fallback:"nowrap"})}
                <lcards-grid-layout>
                    ${this._select("style.align","Horizontal align",z,{fallback:"right"})}
                    ${this._select("style.align_items","Vertical align",R,{fallback:"center"})}
                </lcards-grid-layout>
            </lcards-form-section>

            <lcards-form-section header="Padding" description="Space inside each cell" icon="mdi:move-resize" ?expanded=${false}>
                <lcards-padding-editor
                    .editor=${this}
                    .config=${this._workingConfig}
                    path="style.padding"
                    label="Cell padding">
                </lcards-padding-editor>
            </lcards-form-section>

            ${this._colors("style","Cells")}

            <lcards-form-section header="Borders" description="Cell borders" icon="mdi:border-all" ?expanded=${false}>
                <lcards-grid-layout>
                    ${this._number("style.border_width","Border width",{min:0,max:20,unit:"px"})}
                    ${this._text("style.border_color","Border colour","Any CSS colour or var(--...)")}
                </lcards-grid-layout>
                ${this._select("style.border_style","Border style",["solid","dashed","dotted","double","groove","ridge","inset","outset","none"].map(a=>({value:a,label:a[0].toUpperCase()+a.slice(1)})),{fallback:"solid"})}
            </lcards-form-section>
        `}_renderEffectsTab(){const e=this._workingConfig.highlight_changes,a=u(e)?e:{};return o`
            <lcards-form-section header="Animations" description="Add the cascade-color preset for the classic LCARS colour waterfall" icon="mdi:animation" ?expanded=${true}>
                <lcards-animation-editor
                    .hass=${this.hass}
                    .animations=${this._workingConfig.animations||[]}
                    @animations-changed=${t=>this._setConfigValue("animations",t.detail.value)}>
                </lcards-animation-editor>
                <div class="hint">
                    cascade-color params for the grid: pattern (default, niagara, fast, custom), speed_multiplier, duration,
                    timing (pattern: custom) and colors { start, text, end }.
                </div>
            </lcards-form-section>

            <lcards-form-section header="Highlight Changes" description="Animate cells when their value changes" icon="mdi:flash" ?expanded=${!!e}>
                <ha-switch
                    .checked=${!!e}
                    @change=${t=>this._setConfigValue("highlight_changes",t.target.checked?{preset:"pulse"}:void 0)}>
                    Highlight changed cells
                </ha-switch>
                ${e?o`
                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:[{value:"pulse",label:"Pulse"},{value:"glow",label:"Glow"}]}}}
                            .label=${"Preset"}
                            .value=${a.preset||"pulse"}
                            @value-changed=${t=>this._setHighlight("preset",t.detail.value)}
                            @closed=${t=>t.stopPropagation()}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{mode:"box",min:50,max:5e3,step:50,unit_of_measurement:"ms"}}}
                            .label=${"Duration"}
                            .value=${a.duration??500}
                            @value-changed=${t=>this._setHighlight("duration",t.detail.value)}>
                        </ha-selector>
                    </lcards-grid-layout>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{mode:"box",min:1,max:500}}}
                        .label=${"Most cells animated at once"}
                        .value=${a.max_cells}
                        @value-changed=${t=>this._setHighlight("max_cells",t.detail.value)}>
                    </ha-selector>
                `:""}
            </lcards-form-section>

            <lcards-form-section header="Filters" description="CSS filters on the whole grid (blur, brightness, ...)" icon="mdi:auto-fix" ?expanded=${false}>
                <lcards-filter-editor
                    .hass=${this.hass}
                    .filters=${this._workingConfig.filters||[]}
                    @filters-changed=${t=>this._setConfigValue("filters",t.detail.value)}>
                </lcards-filter-editor>
            </lcards-form-section>
        `}_setHighlight(e,a){const t=this._workingConfig.highlight_changes;this._workingConfig.highlight_changes=u(t)?t:{},this._setConfigValue(`highlight_changes.${e}`,a)}_renderAdvancedTab(){return o`
            <lcards-message type="info">
                CSS Grid properties of the grid container. In decorative mode the templates also set the grid size.
            </lcards-message>

            <lcards-form-section header="Grid Template" description="Row and column sizing" icon="mdi:table-cog" ?expanded=${true}>
                ${this._text("grid.grid-template-rows","Grid template rows","e.g. 'repeat(8, auto)', '40px 1fr'","auto")}
                ${this._text("grid.grid-template-columns","Grid template columns","e.g. 'repeat(12, 1fr)', '100px 1fr 80px'","repeat(N, 1fr)")}
                <lcards-grid-layout>
                    ${this._text("grid.gap","Gap","e.g. '8px'","8px")}
                    ${this._text("grid.row-gap","Row gap")}
                </lcards-grid-layout>
                ${this._text("grid.column-gap","Column gap")}
            </lcards-form-section>

            <lcards-form-section header="Flow & Alignment" description="Item placement and alignment" icon="mdi:arrow-decision" ?expanded=${false}>
                ${this._select("grid.grid-auto-flow","Auto flow",["row","column","row dense","column dense"].map(e=>({value:e,label:e})),{inherit:true})}
                <lcards-grid-layout>
                    ${this._select("grid.justify-items","Justify items",j,{inherit:true})}
                    ${this._select("grid.align-items","Align items",j,{inherit:true})}
                </lcards-grid-layout>
                <lcards-grid-layout>
                    ${this._select("grid.justify-content","Justify content",G,{inherit:true})}
                    ${this._select("grid.align-content","Align content",G,{inherit:true})}
                </lcards-grid-layout>
                <lcards-grid-layout>
                    ${this._text("grid.grid-auto-columns","Auto columns","Width of implicit columns")}
                    ${this._text("grid.grid-auto-rows","Auto rows","Height of implicit rows")}
                </lcards-grid-layout>
            </lcards-form-section>
        `}_togglePreview(e){this[e]=!this[e],this._updatePreviewCard()}_updatePreviewCard(){var i;const e=this._previewRef.value;if(!e)return;e.replaceChildren();const a=_(this._workingConfig);!this._showAnimations&&Array.isArray(a.animations)&&(a.animations=a.animations.map(r=>({...r,enabled:false})));const t=document.createElement("lcards-data-grid");try{t.setConfig(a)}catch(r){D.warn("[DataGridStudio] Preview config rejected",r);return}t.hass=this.hass,e.appendChild(t),this._previewCard=t,this._showGridLines&&((i=t.updateComplete)==null||i.then(()=>{var l;const r=document.createElement("style");r.textContent=".grid-cell { outline: var(--ha-border-width-md) dashed color-mix(in srgb, var(--primary-color) 60%, transparent); outline-offset: -1px; }",(l=t.shadowRoot)==null||l.appendChild(r)}))}_handleSave(){const e=_(this._workingConfig);this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e}})),this._close()}_close(){this.dispatchEvent(new CustomEvent("closed"))}};c(k,"LCARdSDataGridStudioDialogV4");let $=k;customElements.get("lcards-data-grid-studio-dialog-v4")||customElements.define("lcards-data-grid-studio-dialog-v4",$);const T=class T2 extends K{constructor(){super(),this.cardType="data-grid",this._openedConfigSeen=false,this._upgradeNotes=[],this._studio=null}setConfig(e){const{config:a,changed:t,notes:i}=y(e),r=!this._openedConfigSeen;this._openedConfigSeen=true,super.setConfig(a),r&&t&&(this._upgradeNotes=i,D.info("[LCARdSDataGridEditor] Upgraded legacy data grid config",i),this.updateComplete.then(()=>E(this,"config-changed",{config:this.config})))}updated(e){var a;(a=super.updated)==null||a.call(this,e),e.has("hass")&&this._studio&&(this._studio.hass=this.hass)}_getTabDefinitions(){return[{label:"Configuration",content:c(()=>this._renderConfigurationTab(),"content")},...this._getUtilityTabs()]}_renderConfigurationTab(){return o`
            ${this._upgradeNotes.length?o`
                <lcards-message type="info" title="Data grid format upgraded">
                    This card was upgraded to the current data grid format
                    (${this._upgradeNotes.join("; ")}). Save to keep the change.
                </lcards-message>
            `:""}

            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Data Grid Configuration Studio</h3>
                    <p>
                        <strong>Full-screen workspace</strong> with live preview: grid layout,
                        cells, styles, animations and more.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        @click=${this._openConfigurationStudio}>
                        <ha-icon icon="mdi:pencil-ruler" slot="start"></ha-icon>
                        Open Configuration Studio
                    </ha-button>
                </div>
            </div>

            <!-- Card Identification -->
            <lcards-form-section
                header="Card Identification"
                description="Identification for rules engine targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${h.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}

                ${h.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
            </lcards-form-section>

            <!-- Sizing -->
            <lcards-form-section
                header="Sizing"
                description="Override card dimensions: useful in stacks, overlays, or any auto-height container"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-2);">
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
        `}async _openConfigurationStudio(){const e=document.createElement("lcards-data-grid-studio-dialog-v4");e.hass=this.hass,e.config=JSON.parse(JSON.stringify(this.config||{})),this._studio=e,e.addEventListener("config-changed",a=>{this.config=a.detail.config,this._isUpdatingYaml=true,this._yamlValue=X(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false}),E(this,"config-changed",{config:this.config}),this.requestUpdate()}),e.addEventListener("closed",()=>{e.remove(),this._studio===e&&(this._studio=null)}),J(e,this)}};c(T,"LCARdSDataGridEditor");let x=T;customElements.get("lcards-data-grid-editor")||customElements.define("lcards-data-grid-editor",x);export{x as LCARdSDataGridEditor};
//# sourceMappingURL=lcards-data-grid-editor-kNYVL6vu.js.map
