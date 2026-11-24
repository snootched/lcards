var M=Object.defineProperty;var c=(n,e)=>M(n,"name",{value:e,configurable:true});import{i as F,d as V,b as l,I as y,J as H,K as w,M as I,N as L,O as P,P as W,Q as B,R as U,S as Y,T as J,U as K,V as q,l as N,o as X,m as Q}from"./lcards-main-rAEkayNG.js";import{b as Z,s as ee,n as te,a as ae,f as S,L as g}from"./LCARdSBaseEditor-C1cuuyZn.js";import{c as ie}from"./lcards-yaml-editor-BbJ28MWR.js";import{e as se,m as re}from"./lcards-message-LMGqoqAU.js";import"./lcards-form-section-d23xPOu-.js";import"./lcards-color-section-v2-CuYlwQ16.js";import"./lcards-padding-editor-CGEzWI8R.js";import"./lcards-filter-editor-DALF-qiV.js";const k=class k2 extends F{static get properties(){return{}}static get styles(){return V`
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
        `}render(){return l`
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
        `}};c(k,"LCARdSStyleHierarchyDiagram");let $=k;customElements.get("lcards-style-hierarchy-diagram")||customElements.define("lcards-style-hierarchy-diagram",$);const oe=["default","active","inactive","unavailable","zero","non_zero"],A=[{value:"digit",label:"Digit (0042, 1337)"},{value:"float",label:"Float (42.17, 3.14)"},{value:"alpha",label:"Alpha (AB, XY)"},{value:"hex",label:"Hex (A3F1, 00FF)"},{value:"mixed",label:"Mixed (various)"}],R=[{value:"none",label:"None"},{value:"uppercase",label:"UPPERCASE"},{value:"lowercase",label:"lowercase"},{value:"capitalize",label:"Capitalize"}],O=[{value:"nowrap",label:"No wrap (truncate with ellipsis)"},{value:"normal",label:"Wrap (word boundaries)"},{value:"pre-wrap",label:"Wrap (preserve line breaks)"},{value:"pre-line",label:"Wrap (collapse spaces, preserve line breaks)"}],z=[{value:"flex-start",label:"Top"},{value:"center",label:"Center"},{value:"flex-end",label:"Bottom"},{value:"baseline",label:"Baseline"}],D=[{value:"left",label:"Left"},{value:"center",label:"Center"},{value:"right",label:"Right"}],G=["stretch","start","end","center"].map(n=>({value:n,label:n[0].toUpperCase()+n.slice(1)})),j=["start","end","center","stretch","space-around","space-between","space-evenly"].map(n=>({value:n,label:n.replace("-"," ").replace(/^\w/,e=>e.toUpperCase())})),le=[{category:"Basic",items:[{label:"Entity state",template:"{{ states('sensor.temperature') }}"},{label:"Entity attribute",template:"{{ state_attr('light.kitchen', 'brightness') }}"},{label:"DataSource value",template:"{datasource:my_source:.1f}"}]},{category:"Formatted numbers",items:[{label:"Temperature",template:"{{ states('sensor.temp') | float | round(1) }}°C"},{label:"Percentage",template:"{{ states('sensor.battery') | int }}%"},{label:"Watts to kW",template:"{{ (states('sensor.power') | float / 1000) | round(2) }} kW"}]},{category:"Conditionals",items:[{label:"On/Off",template:"{{ 'ON' if is_state('light.kitchen', 'on') else 'OFF' }}"},{label:"Threshold",template:"{{ 'HOT' if states('sensor.temp') | float > 25 else 'OK' }}"}]},{category:"Time",items:[{label:"Last changed",template:"{{ relative_time(states.sensor.temperature.last_changed) }}"},{label:"Current time",template:"{{ now().strftime('%H:%M') }}"}]}],h=c(n=>!!n&&typeof n=="object"&&!Array.isArray(n),"isObject"),v=c(n=>JSON.parse(JSON.stringify(n??{})),"clone"),p=c(n=>n==null||n===""||h(n)&&Object.keys(n).length===0,"isEmptyValue"),b=c(n=>h(n)?n:{value:n??""},"toCellObject");function ne(n){const e=b(n);return e.value!==void 0&&e.value!==""?String(e.value):e.entity?e.attribute?`${e.entity} · ${e.attribute}`:e.entity:""}c(ne,"cellLabel");function f(n){if(!h(n))return;const e={};for(const[a,t]of Object.entries(n))if(!p(t))if(h(t)&&(a==="color"||a==="background")){const i=Object.fromEntries(Object.entries(t).filter(([,o])=>!p(o))),s=Object.keys(i);if(!s.length)continue;e[a]=s.length===1&&s[0]==="default"?i.default:i}else e[a]=t;return Object.keys(e).length?e:void 0}c(f,"pruneStyle");function _(n){const e=v(n),a=e.data_mode==="data";for(const t of["style","header_style"]){const i=f(e[t]);i?e[t]=i:delete e[t]}if(a)delete e.format,delete e.refresh_interval,delete e.refresh_cells,e.rows=(e.rows||[]).map(t=>{const i=(t.values||[]).map(o=>{const r={...b(o)},d=f(r.style);d?r.style=d:delete r.style;for(const m of Object.keys(r))p(r[m])&&m!=="value"&&delete r[m];r.value===""&&r.entity&&delete r.value;const u=Object.keys(r);return u.length===1&&u[0]==="value"?r.value:u.length?r:""}),s=f(t.style);return L(t)?{target:t.target,values:i,...t.sort&&t.sort!=="name"?{sort:t.sort}:{},...t.max_items?{max_items:t.max_items}:{},...s?{style:s}:{}}:!s&&!t.header?i:{values:i,...s?{style:s}:{},...t.header?{header:true}:{}}}),(!e.cell_tap_action||p(e.cell_tap_action))&&delete e.cell_tap_action;else{const t=w(e.rows).map(i=>{const s=f(i.style);return s?{style:s}:{}});for(;t.length&&!t[t.length-1].style;)t.pop();t.length?e.rows=t:delete e.rows,delete e.cell_tap_action,e.refresh_cells===1&&delete e.refresh_cells}if(Array.isArray(e.columns)){for(e.columns=e.columns.map(t=>{const i={},s=f(t==null?void 0:t.style);return s&&(i.style=s),!a&&(t!=null&&t.format)&&(i.format=t.format),i});e.columns.length&&!Object.keys(e.columns[e.columns.length-1]).length;)e.columns.pop();e.columns.length||delete e.columns}if(h(e.highlight_changes)){const t=Object.fromEntries(Object.entries(e.highlight_changes).filter(([,i])=>!p(i)));e.highlight_changes=Object.keys(t).length?t:true}else e.highlight_changes||delete e.highlight_changes;return Array.isArray(e.animations)&&!e.animations.length&&delete e.animations,Array.isArray(e.filters)&&!e.filters.length&&delete e.filters,e}c(_,"compactDataGridConfig");const T=class T2 extends F{static get properties(){return{hass:{type:Object},_workingConfig:{type:Object,state:true},_activeTab:{type:String,state:true},_stylesSubTab:{type:String,state:true},_activeCellEdit:{type:Object,state:true},_activeRowEdit:{type:Number,state:true},_activeColumnEdit:{type:Number,state:true},_showGridLines:{type:Boolean,state:true},_showAnimations:{type:Boolean,state:true}}}constructor(){super(),this.hass=null,this._initialConfig=null,this._workingConfig={},this._activeTab="mode",this._stylesSubTab="hierarchy",this._activeCellEdit=null,this._activeRowEdit=null,this._activeColumnEdit=null,this._showGridLines=true,this._showAnimations=false,this._previewRef=Z(),this._previewTimer=null,this._previewCard=null}get config(){return this._workingConfig}set config(e){this._initialConfig=e}connectedCallback(){super.connectedCallback(),this._workingConfig=this._normalize(y(v(this._initialConfig)).config),this.updateComplete.then(()=>this._updatePreviewCard())}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._previewTimer??void 0)}updated(e){super.updated(e),e.has("hass")&&this._previewCard&&(this._previewCard.hass=this.hass)}_normalize(e,{sample:a=true}={}){var i;const t=v(e);if(t.type=t.type||"custom:lcards-data-grid",t.data_mode=H(t),t.grid=h(t.grid)?t.grid:{},t.data_mode==="decorative")t.rows=w(t.rows);else if(Array.isArray(t.rows)){const s=t.rows;t.rows=I(s).map((o,r)=>({values:o.values.map(d=>v(b(d))),...o.style?{style:o.style}:{},...o.header?{header:true}:{},...L(s[r])?{target:v(s[r].target),...s[r].sort?{sort:s[r].sort}:{},...s[r].max_items?{max_items:s[r].max_items}:{}}:{}}))}return t.data_mode==="data"&&!((i=t.rows)!=null&&i.length)&&(t.rows=a?this._sampleRows():[]),t}_sampleRows(){return[{values:[{value:"SYSTEM"},{value:"VALUE"}],header:true},{values:[{value:"CPU"},{value:"sensor.cpu_usage"}]},{values:[{value:"Memory"},{value:"sensor.memory_usage"}]}]}get _isData(){return this._workingConfig.data_mode==="data"}_getConfigValue(e){let a=this._workingConfig;for(const t of e.split(".")){if(a==null)return;a=a[t]}return a}_setConfigValue(e,a){const t=e.split(".");let i=this._workingConfig;for(let o=0;o<t.length-1;o++){const r=t[o];if(r==="__proto__"||r==="constructor"||r==="prototype")return;!h(i[r])&&!Array.isArray(i[r])&&(i[r]=/^\d+$/.test(t[o+1])?[]:{}),i=i[r]}const s=t[t.length-1];s==="__proto__"||s==="constructor"||s==="prototype"||(p(a)?Array.isArray(i)?i[Number(s)]=void 0:delete i[s]:i[s]=a,this._changed())}_changed(){this._workingConfig={...this._workingConfig},clearTimeout(this._previewTimer??void 0),this._previewTimer=setTimeout(()=>this._updatePreviewCard(),300)}_trackCount(e){const a=this._workingConfig;return this._isData?e==="row"?a.rows.length:Math.max(1,P(a.rows)):W(a.grid[this._templateKey(e)])||(e==="row"?8:12)}_templateKey(e){return e==="row"?"grid-template-rows":"grid-template-columns"}_editTemplate(e,a){const t=this._templateKey(e),i=e==="row"?"auto":"1fr",s=this._workingConfig.grid[t];let o;if(s){if(o=B(s),!o)return}else{if(this._isData)return;o=Array(this._trackCount(e)).fill(i)}a(o,i),this._workingConfig.grid[t]=U(o.length?o:[i])}_emptyRow(){return{values:Array.from({length:this._trackCount("col")},()=>({value:""}))}}_setTrackCount(e,a){a=Math.max(1,Math.min(50,Math.floor(Number(a))||1));const t=this._workingConfig;if(this._isData)if(e==="row"){for(;t.rows.length<a;)t.rows.push(this._emptyRow());t.rows.length=a}else{for(const i of t.rows){for(;i.values.length<a;)i.values.push({value:""});i.values.length=a}Array.isArray(t.columns)&&(t.columns.length=Math.min(t.columns.length,a))}this._editTemplate(e,(i,s)=>{for(;i.length<a;)i.push(i[i.length-1]||s);i.length=a}),this._closeEditors(),this._changed()}_insertTrack(e,a){var i;const t=this._workingConfig;if(e==="row")t.rows.splice(a,0,this._emptyRow());else{for(const s of t.rows)(i=s.values)==null||i.splice(a,0,{value:""});Array.isArray(t.columns)&&t.columns.length>a&&t.columns.splice(a,0,{})}this._editTemplate(e,(s,o)=>s.splice(a,0,s[a]||o)),this._closeEditors(),this._changed()}_removeTrack(e,a){var i;if(this._trackCount(e)<=1)return;const t=this._workingConfig;if(e==="row")t.rows.splice(a,1);else{for(const s of t.rows)(i=s.values)==null||i.splice(a,1);Array.isArray(t.columns)&&t.columns.splice(a,1)}this._editTemplate(e,s=>s.splice(a,1)),this._closeEditors(),this._changed()}_moveTrack(e,a,t){const i=a+t;if(i<0||i>=this._trackCount(e))return;const s=c(r=>{if(!Array.isArray(r))return;const d=Math.max(r.length,a+1,i+1);for(let u=r.length;u<d;u++)r[u]=e==="col"&&r===this._workingConfig.columns?{}:{value:""};[r[a],r[i]]=[r[i],r[a]]},"swap"),o=this._workingConfig;e==="row"?(s(o.rows),this._activeRowEdit=i):(o.rows.forEach(r=>s(r.values)),s(o.columns),this._activeColumnEdit=i),this._editTemplate(e,r=>{[r[a],r[i]]=[r[i],r[a]]}),this._changed()}_closeEditors(){this._activeCellEdit=null,this._activeRowEdit=null,this._activeColumnEdit=null}static get styles(){return[se,ee,re,V`
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
        `]}render(){const e=[{id:"mode",label:"Data Mode",icon:"mdi:view-grid"},{id:"grid-structure",label:"Grid Structure",icon:"mdi:table-settings"},{id:"grid-styles",label:"Grid Styles",icon:"mdi:palette"},{id:"effects",label:"Effects",icon:"mdi:auto-fix"},{id:"advanced",label:"Advanced",icon:"mdi:cog"},{id:"yaml",label:"YAML",icon:"mdi:code-braces"}];return l`
            <ha-dialog open flexcontent @closed=${this._onDialogClosed} header-title="Data Grid Studio">
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${a=>this._onTab(a,"_activeTab")}>
                                ${e.map(a=>l`
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

                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" appearance="plain" @click=${this._close}>Cancel</ha-button>
                    <ha-button slot="primaryAction" variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_onDialogClosed(e){e.stopPropagation(),e.target===e.currentTarget&&this._close()}_onTab(e,a){var i;const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&(this[a]=t)}_renderActiveTab(){switch(this._activeTab){case"grid-structure":return this._renderGridStructureTab();case"grid-styles":return this._renderGridStylesTab();case"effects":return this._renderEffectsTab();case"advanced":return this._renderAdvancedTab();case"yaml":return l`
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${_(this._workingConfig)}
                    .schema=${Y}
                    cardType="data-grid"
                    @yaml-config-changed=${e=>this._applyYaml(e.detail.config)}>
                </lcards-studio-yaml-tab>
            `;default:return this._renderModeTab()}}_select(e,a,t,{fallback:i="",inherit:s=false}={}){const o=s?[{value:"",label:"(Inherit)"},...t]:t;return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{select:{mode:"dropdown",options:o}}}
                .label=${a}
                .value=${this._getConfigValue(e)??i}
                @value-changed=${r=>this._setConfigValue(e,r.detail.value)}
                @closed=${r=>r.stopPropagation()}>
            </ha-selector>
        `}_text(e,a,t="",i=""){return l`
            <ha-input
                label=${a}
                .value=${String(this._getConfigValue(e)??"")}
                placeholder=${i}
                hint=${t}
                @input=${s=>this._setConfigValue(e,s.target.value)}>
            </ha-input>
        `}_number(e,a,{min:t=0,max:i=1e3,step:s=1,unit:o=void 0,fallback:r=void 0}={}){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{mode:"box",min:t,max:i,step:s,unit_of_measurement:o}}}
                .label=${a}
                .value=${this._getConfigValue(e)??r}
                @value-changed=${d=>this._setConfigValue(e,d.detail.value)}>
            </ha-selector>
        `}_colors(e,a,t=""){return l`
            ${["color","background"].map(i=>l`
                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${t}
                    basePath=${`${e}.${i}`}
                    header=${`${a}: ${i==="color"?"Text":"Background"}`}
                    .suggestedStates=${t?oe:["default"]}
                    ?allowCustomStates=${!!t}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            `)}
        `}_renderStyleOverrides(e,a,t=""){const i=this._getConfigValue(e),s=h(i)&&Object.values(i).some(o=>!p(o));return l`
            <details class="overrides" ?open=${s}>
                <summary>
                    <ha-icon icon="mdi:palette"></ha-icon>
                    ${a} style overrides ${s?"(active)":""}
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
                        ${this._select(`${e}.text_transform`,"Text transform",R,{inherit:true})}
                        ${this._text(`${e}.letter_spacing`,"Letter spacing","","Inherit")}
                    </lcards-grid-layout>
                    <lcards-grid-layout>
                        ${this._select(`${e}.align`,"Horizontal align",D,{inherit:true})}
                        ${this._select(`${e}.align_items`,"Vertical align",z,{inherit:true})}
                    </lcards-grid-layout>
                    ${this._select(`${e}.white_space`,"Text wrapping",O,{inherit:true})}
                    <ha-button appearance="plain" .disabled=${!s} @click=${()=>this._setConfigValue(e,void 0)}>
                        <ha-icon icon="mdi:eraser" slot="start"></ha-icon>
                        Clear ${a.toLowerCase()} styles
                    </ha-button>
                </div>
            </details>
        `}_renderModeTab(){return l`
            <lcards-form-section header="Data Mode" description="Choose how the grid gets its data" icon="mdi:view-grid" ?expanded=${true}>
                <div class="mode-selector">
                    ${[{id:"decorative",icon:"mdi:shimmer",title:"Decorative",description:"Generated LCARS-style values"},{id:"data",icon:"mdi:table-edit",title:"Data",description:"Your text, entities and templates"}].map(a=>l`
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
        `}_applyYaml(e){this._workingConfig=this._normalize(y(e).config,{sample:false}),this._closeEditors(),this._changed()}_setMode(e){const a=this._workingConfig;if(a.data_mode=e,e==="decorative")a.rows=w(a.rows);else{const t=(a.rows||[]).map(i=>({...i,values:Array.isArray(i.values)?i.values:[]}));a.rows=t.some(i=>i.values.length)?t:this._sampleRows().map((i,s)=>{var o;return(o=t[s])!=null&&o.style?{...i,style:t[s].style}:i})}this._closeEditors(),this._changed()}_renderGridStructureTab(){const e=this._workingConfig.grid;return l`
            <lcards-form-section header="Grid Dimensions" description="Rows, columns and spacing" icon="mdi:ruler" ?expanded=${true}>
                ${this._isData?l`
                    <lcards-message type="info">
                        Rows and columns follow the data below. Reducing them removes cells.
                    </lcards-message>
                `:""}
                <lcards-grid-layout>
                    ${["row","col"].map(a=>l`
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
                    .value=${J(e.gap)??8}
                    .label=${"Gap"}
                    @value-changed=${a=>this._setConfigValue("grid.gap",`${Number(a.detail.value)||0}px`)}>
                </ha-selector>
            </lcards-form-section>

            ${this._isData?this._renderDataEditor():this._renderDecorativeConfig()}
        `}_renderDecorativeConfig(){const e=this._trackCount("col");return l`
            <lcards-form-section header="Decorative Values" description="Generated LCARS data" icon="mdi:shimmer" ?expanded=${true}>
                ${this._select("format","Format",A,{fallback:"mixed"})}
                <lcards-grid-layout>
                    ${this._number("refresh_interval","Refresh interval",{min:0,max:6e4,step:100,unit:"ms",fallback:0})}
                    ${this._number("refresh_cells","Cells changed per refresh",{min:.05,max:1,step:.05,fallback:1})}
                </lcards-grid-layout>
                <div class="hint">Refresh interval 0 keeps the values fixed. 1 changes every cell; 0.2 changes a fifth of them each time.</div>
            </lcards-form-section>

            <lcards-form-section header="Column Formats" description="Override the format per column" icon="mdi:table-column" ?expanded=${false}>
                <lcards-grid-layout>
                    ${Array.from({length:e},(a,t)=>this._select(`columns.${t}.format`,`Column ${t+1}`,A,{inherit:true}))}
                </lcards-grid-layout>
            </lcards-form-section>

            ${this._renderDecorativeRowStyles()}
        `}_renderDecorativeRowStyles(){const e=this._workingConfig.rows||[];return l`
            <lcards-form-section header="Row Styles" description="A style per row, repeating from the top" icon="mdi:table-row" ?expanded=${e.length>0}>
                <div class="hint">Two entries alternate every other row; three repeat every third. A row without a style uses the grid's own.</div>
                ${e.map((a,t)=>l`
                    <div class="row-style">
                        ${this._renderStyleOverrides(`rows.${t}.style`,`Row ${t+1}`)}
                        <ha-button variant="danger" appearance="plain" @click=${()=>this._removeDecorativeRow(t)}>
                            <ha-icon icon="mdi:delete" slot="start"></ha-icon>Remove row ${t+1}
                        </ha-button>
                    </div>
                `)}
                <div class="button-row">
                    <ha-button @click=${()=>this._addDecorativeRow()}>
                        <ha-icon icon="mdi:table-row-plus-after" slot="start"></ha-icon>Add row style
                    </ha-button>
                </div>
            </lcards-form-section>
        `}_addDecorativeRow(){this._workingConfig.rows=[...this._workingConfig.rows||[],{}],this._changed()}_removeDecorativeRow(e){this._workingConfig.rows=(this._workingConfig.rows||[]).filter((a,t)=>t!==e),this._changed()}_renderDataEditor(){const e=this._workingConfig.rows,a=this._trackCount("col"),t=this._activeCellEdit;return l`
            <lcards-form-section header="Data Editor" description="Click a cell to edit it, or a header for row/column options" icon="mdi:table-edit" ?expanded=${true}>
                <lcards-message type="info">
                    A cell can hold static text, an entity (shows its state, e.g. sensor.temperature),
                    a template ({{ states('sensor.temp') }}°C), a DataSource token ({datasource:name:.1f}) or JavaScript ([[[ ... ]]]).
                </lcards-message>

                <div class="sheet" style="grid-template-columns: auto repeat(${a}, minmax(0, 1fr));">
                    <div class="sheet-corner"></div>
                    ${Array.from({length:a},(i,s)=>l`
                        <div class="sheet-header ${this._activeColumnEdit===s?"selected":""}"
                            @click=${()=>this._openEditor("column",s)}>Col ${s+1}</div>
                    `)}
                    ${e.map((i,s)=>l`
                        <div class="sheet-header ${this._activeRowEdit===s?"selected":""}"
                            @click=${()=>this._openEditor("row",s)}>Row ${s+1}${i.header?" (H)":""}${i.target?" (each entity)":""}</div>
                        ${Array.from({length:a},(o,r)=>{const d=i.values[r],u=ne(d),m=h(d)&&(d.style||d.tap_action||d.hold_action||d.double_tap_action);return l`
                                <div class="sheet-cell ${i.header?"header-row":""} ${(t==null?void 0:t.row)===s&&(t==null?void 0:t.col)===r?"selected":""}"
                                    title=${u}
                                    @click=${()=>this._openCellEditor(s,r)}>
                                    ${u||l`<span class="sheet-empty">-</span>`}${m?l`<span class="styled">•</span>`:""}
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
        `}_openEditor(e,a){const t=e==="row"?"_activeRowEdit":"_activeColumnEdit",i=this[t];this._closeEditors(),this[t]=i===a?null:a}_openCellEditor(e,a){var s;const t=b((s=this._workingConfig.rows[e])==null?void 0:s.values[a]),i=!t.value&&!!t.entity||K.test(String(t.value??""));this._closeEditors(),this._activeCellEdit={row:e,col:a,type:i?"entity":"text",value:i?"":String(t.value??""),entity:t.entity||(i?String(t.value):""),attribute:t.attribute||""}}_cellPath(){const{row:e,col:a}=this._activeCellEdit,t=this._workingConfig.rows[e].values;return h(t[a])||(t[a]=b(t[a])),`rows.${e}.values.${a}`}_saveCellContent(){const e=this._activeCellEdit,a=this._cellPath(),t=this._getConfigValue(a);delete t.value,delete t.entity,delete t.attribute,e.type==="entity"?e.attribute?Object.assign(t,{entity:e.entity,attribute:e.attribute}):t.value=e.entity:(t.value=e.value,e.entity&&(t.entity=e.entity)),this._activeCellEdit=null,this._changed()}_renderCellEditor(){const e=this._activeCellEdit,a=this._cellPath(),t=c(i=>{this._activeCellEdit={...this._activeCellEdit,...i}},"setEdit");return l`
            <lcards-form-section header="Edit Cell (Row ${e.row+1}, Col ${e.col+1})" icon="mdi:pencil-box-outline" ?expanded=${true}>
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

                ${e.type==="entity"?l`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{entity:{}}}
                        .label=${"Entity"}
                        .value=${e.entity}
                        @value-changed=${i=>t({entity:i.detail.value||""})}>
                    </ha-selector>
                    ${e.entity?l`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{attribute:{entity_id:e.entity}}}
                            .label=${"Attribute (optional)"}
                            .value=${e.attribute}
                            @value-changed=${i=>t({attribute:i.detail.value||""})}>
                        </ha-selector>
                    `:""}
                    <div class="hint">Shows the entity state (or attribute), formatted by Home Assistant.</div>
                `:l`
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
                        ${["tap_action","hold_action","double_tap_action"].map(i=>l`
                            <span class="field-label">${i.replace(/_/g," ").replace(/^\w/,s=>s.toUpperCase())}</span>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{ui_action:{}}}
                                .value=${this._getConfigValue(`${a}.${i}`)}
                                @value-changed=${s=>this._setConfigValue(`${a}.${i}`,s.detail.value)}>
                            </ha-selector>
                        `)}
                    </div>
                </details>

                ${e.type==="text"?this._renderTemplateExamples():""}
            </lcards-form-section>
        `}_renderTemplateExamples(){return l`
            <lcards-form-section header="Template Examples" description="Insert or copy common patterns" icon="mdi:code-braces-box" ?expanded=${false}>
                ${le.map(e=>l`
                    <span class="field-label">${e.category}</span>
                    ${e.items.map(a=>l`
                        <div class="example">
                            <div>
                                <div>${a.label}</div>
                                <code>${a.template}</code>
                            </div>
                            <ha-icon-button .label=${"Insert into cell"}
                                @click=${()=>{this._activeCellEdit={...this._activeCellEdit,value:a.template}}}>
                                <ha-icon icon="mdi:arrow-left-bold"></ha-icon>
                            </ha-icon-button>
                            <ha-icon-button .label=${"Copy"} @click=${()=>q(a.template)}>
                                <ha-icon icon="mdi:content-copy"></ha-icon>
                            </ha-icon-button>
                        </div>
                    `)}
                `)}
            </lcards-form-section>
        `}_renderTrackEditor(e,a){var r,d;const t=e==="row",i=this._trackCount(e),s=t?"Row":"Column",o=t?["mdi:table-row-plus-before","mdi:table-row-plus-after","mdi:arrow-up-bold","mdi:arrow-down-bold"]:["mdi:table-column-plus-before","mdi:table-column-plus-after","mdi:arrow-left-bold","mdi:arrow-right-bold"];return l`
            <lcards-form-section header="${s} ${a+1}" description="Insert, move, delete and style" icon=${t?"mdi:table-row":"mdi:table-column"} ?expanded=${true}>
                <div class="op-grid">
                    <ha-button @click=${()=>this._insertTrack(e,a)}><ha-icon icon=${o[0]} slot="start"></ha-icon>Insert before</ha-button>
                    <ha-button @click=${()=>this._insertTrack(e,a+1)}><ha-icon icon=${o[1]} slot="start"></ha-icon>Insert after</ha-button>
                    <ha-button .disabled=${a===0} @click=${()=>this._moveTrack(e,a,-1)}><ha-icon icon=${o[2]} slot="start"></ha-icon>Move ${t?"up":"left"}</ha-button>
                    <ha-button .disabled=${a>=i-1} @click=${()=>this._moveTrack(e,a,1)}><ha-icon icon=${o[3]} slot="start"></ha-icon>Move ${t?"down":"right"}</ha-button>
                    <ha-button variant="danger" .disabled=${i<=1} @click=${()=>this._removeTrack(e,a)}><ha-icon icon="mdi:delete" slot="start"></ha-icon>Delete ${s.toLowerCase()}</ha-button>
                    <ha-button appearance="plain" @click=${()=>this._closeEditors()}><ha-icon icon="mdi:close" slot="start"></ha-icon>Close</ha-button>
                </div>
                ${t&&!((r=this._workingConfig.rows[a])!=null&&r.target)?l`
                    <ha-switch
                        .checked=${!!((d=this._workingConfig.rows[a])!=null&&d.header)}
                        @change=${u=>this._setConfigValue(`rows.${a}.header`,u.target.checked||void 0)}>
                        Header row (uses the header style)
                    </ha-switch>
                `:""}
                ${t?this._renderTargetRowEditor(a):""}
                ${this._renderStyleOverrides(t?`rows.${a}.style`:`columns.${a}.style`,s)}
            </lcards-form-section>
        `}_renderTargetRowEditor(e){const a=this._workingConfig.rows[e]??{},t=h(a.target)?a.target:null;return l`
            <lcards-form-section header="Rows from Home Assistant" icon="mdi:label-multiple" outlined
                description="Repeat this row once per entity of a label, area or device" ?expanded=${!!t}>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Entities"}
                    .helper=${"In the cells, {entity} is the state; {entity.name} and {entity.attributes.NAME} read each entity"}
                    .selector=${{target:{}}}
                    .value=${t??{}}
                    @value-changed=${i=>{const s=i.detail.value,o=h(s)&&Object.values(s).some(r=>Array.isArray(r)?r.length:r);this._setConfigValue(`rows.${e}.target`,o?s:void 0),o&&this._setConfigValue(`rows.${e}.header`,void 0)}}>
                </ha-selector>
                ${t?l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Sort"}
                        .selector=${{select:{mode:"dropdown",options:[{value:"name",label:"By name"},{value:"state",label:"By state"},{value:"none",label:"As Home Assistant lists them"}]}}}
                        .value=${a.sort||"name"}
                        @value-changed=${i=>this._setConfigValue(`rows.${e}.sort`,i.detail.value==="name"?void 0:i.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Most rows"}
                        .helper=${"Empty: every entity"}
                        .selector=${{number:{min:1,mode:"box"}}}
                        .value=${a.max_items}
                        @value-changed=${i=>this._setConfigValue(`rows.${e}.max_items`,Number(i.detail.value)>0?Number(i.detail.value):void 0)}>
                    </ha-selector>
                `:""}
            </lcards-form-section>
        `}_renderGridStylesTab(){return l`
            <ha-tab-group @wa-tab-show=${a=>this._onTab(a,"_stylesSubTab")}>
                ${[{id:"hierarchy",label:"Style Hierarchy",icon:"mdi:file-tree"},{id:"table",label:"Grid-wide",icon:"mdi:table"},{id:"header",label:"Header Rows",icon:"mdi:table-row"}].map(a=>l`
                    <ha-tab-group-tab value=${a.id} ?active=${this._stylesSubTab===a.id}>
                        <ha-icon icon=${a.icon}></ha-icon>
                        ${a.label}
                    </ha-tab-group-tab>
                `)}
            </ha-tab-group>
            ${this._stylesSubTab==="hierarchy"?l`
                <lcards-form-section header="Style Hierarchy" description="Which style wins" icon="mdi:file-tree" ?expanded=${true}>
                    <lcards-style-hierarchy-diagram></lcards-style-hierarchy-diagram>
                </lcards-form-section>
            `:""}
            ${this._stylesSubTab==="table"?this._renderGridWideStyles():""}
            ${this._stylesSubTab==="header"?l`
                <lcards-message type="info">
                    Applies to rows marked as header rows (open a row in Grid Structure and turn on Header row),
                    on top of the built-in header look: bold, uppercase, divider line.
                </lcards-message>
                ${this._renderStyleOverrides("header_style","Header")}
            `:""}
        `}_renderGridWideStyles(){var e;return l`
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
                    ${this._select("style.text_transform","Text transform",R,{fallback:"none"})}
                    ${this._text("style.letter_spacing","Letter spacing","e.g. '0.05em'","normal")}
                </lcards-grid-layout>
                ${this._text("style.line_height","Line height","e.g. '1.5'","normal")}
            </lcards-form-section>

            <lcards-form-section header="Alignment & Wrapping" description="Text wrapping and alignment" icon="mdi:format-align-center" ?expanded=${false}>
                ${this._select("style.white_space","Text wrapping",O,{fallback:"nowrap"})}
                <lcards-grid-layout>
                    ${this._select("style.align","Horizontal align",D,{fallback:"right"})}
                    ${this._select("style.align_items","Vertical align",z,{fallback:"center"})}
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
        `}_renderEffectsTab(){const e=this._workingConfig.highlight_changes,a=h(e)?e:{};return l`
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
                ${e?l`
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
        `}_setHighlight(e,a){const t=this._workingConfig.highlight_changes;this._workingConfig.highlight_changes=h(t)?t:{},this._setConfigValue(`highlight_changes.${e}`,a)}_renderAdvancedTab(){return l`
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
                    ${this._select("grid.justify-items","Justify items",G,{inherit:true})}
                    ${this._select("grid.align-items","Align items",G,{inherit:true})}
                </lcards-grid-layout>
                <lcards-grid-layout>
                    ${this._select("grid.justify-content","Justify content",j,{inherit:true})}
                    ${this._select("grid.align-content","Align content",j,{inherit:true})}
                </lcards-grid-layout>
                <lcards-grid-layout>
                    ${this._text("grid.grid-auto-columns","Auto columns","Width of implicit columns")}
                    ${this._text("grid.grid-auto-rows","Auto rows","Height of implicit rows")}
                </lcards-grid-layout>
            </lcards-form-section>
        `}_togglePreview(e){this[e]=!this[e],this._updatePreviewCard()}_updatePreviewCard(){var i;const e=this._previewRef.value;if(!e)return;e.replaceChildren();const a=_(this._workingConfig);!this._showAnimations&&Array.isArray(a.animations)&&(a.animations=a.animations.map(s=>({...s,enabled:false})));const t=document.createElement("lcards-data-grid");try{t.setConfig(a)}catch(s){N.warn("[DataGridStudio] Preview config rejected",s);return}t.hass=this.hass,e.appendChild(t),this._previewCard=t,this._showGridLines&&((i=t.updateComplete)==null||i.then(()=>{var o;const s=document.createElement("style");s.textContent=".grid-cell { outline: var(--ha-border-width-md) dashed color-mix(in srgb, var(--primary-color) 60%, transparent); outline-offset: -1px; }",(o=t.shadowRoot)==null||o.appendChild(s)}))}_handleSave(){const e=_(this._workingConfig);this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e}})),this._close()}_close(){this.dispatchEvent(new CustomEvent("closed"))}};c(T,"LCARdSDataGridStudioDialogV4");let x=T;customElements.get("lcards-data-grid-studio-dialog-v4")||customElements.define("lcards-data-grid-studio-dialog-v4",x);const E=class E2 extends ae{constructor(){super(),this.cardType="data-grid",this._openedConfigSeen=false,this._upgradeNotes=[],this._studio=null}setConfig(e){const{config:a,changed:t,notes:i}=y(e),s=!this._openedConfigSeen;this._openedConfigSeen=true,super.setConfig(a),s&&t&&(this._upgradeNotes=i,N.info("[LCARdSDataGridEditor] Upgraded legacy data grid config",i),this.updateComplete.then(()=>S(this,"config-changed",{config:this.config})))}updated(e){var a;(a=super.updated)==null||a.call(this,e),e.has("hass")&&this._studio&&(this._studio.hass=this.hass)}_getTabDefinitions(){return[{label:"Configuration",content:c(()=>this._renderConfigurationTab(),"content")},...this._getUtilityTabs()]}_renderConfigurationTab(){return l`
            ${this._upgradeNotes.length?l`
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

                ${g.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}

                ${g.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
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
                    ${g.renderField(this,"height")}

                    ${g.renderField(this,"width")}

                    ${g.renderField(this,"min_height")}

                    ${g.renderField(this,"min_width")}

                    ${g.renderField(this,"max_height")}

                    ${g.renderField(this,"max_width")}

                    ${g.renderField(this,"overflow")}

                    ${g.renderField(this,"z_index")}

                    ${g.renderField(this,"overflow_x")}

                    ${g.renderField(this,"overflow_y")}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `}async _openConfigurationStudio(){const e=document.createElement("lcards-data-grid-studio-dialog-v4");e.hass=this.hass,e.config=JSON.parse(JSON.stringify(this.config||{})),this._studio=e,e.addEventListener("config-changed",a=>{this.config=a.detail.config,this._isUpdatingYaml=true,this._yamlValue=ie(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false}),S(this,"config-changed",{config:this.config}),this.requestUpdate()}),X(e,()=>{e.remove(),this._studio===e&&(this._studio=null)}),Q(e,this)}};c(E,"LCARdSDataGridEditor");let C=E;customElements.get("lcards-data-grid-editor")||customElements.define("lcards-data-grid-editor",C);export{C as LCARdSDataGridEditor};
//# sourceMappingURL=lcards-data-grid-editor-B5Z7_ydl.js.map
