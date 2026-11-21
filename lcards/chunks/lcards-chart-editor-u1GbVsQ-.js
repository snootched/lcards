var L=Object.defineProperty;var g=(b,e)=>L(b,"name",{value:e,configurable:true});import{i as P,c as O,j as $,t as M,n as w,k as N,b as n,F as U,A as D,q as z,l as p,u as B,v as G,D as f,x as y,o as V,m as j}from"./lcards-main-DsZpib8R.js";import{f as x,b as R,s as H,L as l,n as Y,a as I}from"./LCARdSBaseEditor-WMmF1vgw.js";import{c as q}from"./lcards-yaml-editor-uR4kf-mj.js";import{e as J,m as W,r as X}from"./lcards-message-Bnp3a1RN.js";import"./lcards-form-section-DzcFFL6H.js";import"./lcards-color-picker-DuwWshRs.js";import"./lcards-color-section-v2-CPBKD2jW.js";import"./lcards-color-list-DJZsv97E.js";const E=[{value:"history",label:"Entity history"},{value:"statistics",label:"Entity long-term statistics"},{value:"datasource",label:"Data source"}],K=["mean","min","max","sum","state","change"],Z=[{value:"5minute",label:"5 minutes"},{value:"hour",label:"Hour"},{value:"day",label:"Day"},{value:"week",label:"Week"},{value:"month",label:"Month"}],Q=[{value:"",label:"(No grouping)"},{value:"avg",label:"Average"},{value:"min",label:"Minimum"},{value:"max",label:"Maximum"},{value:"first",label:"First"},{value:"last",label:"Last"},{value:"sum",label:"Sum"},{value:"median",label:"Median"},{value:"delta",label:"Delta (last minus first)"},{value:"diff",label:"Difference from previous bucket"},{value:"minmax",label:"Min/max band (range area)"},{value:"box",label:"Box plot values"},{value:"ohlc",label:"Open/high/low/close (candlestick)"}],ee=[{value:"last",label:"Repeat last value"},{value:"null",label:"Leave a gap"},{value:"zero",label:"Zero"}],te=[{value:"",label:"(Chart type)"},{value:"line",label:"Line"},{value:"area",label:"Area"},{value:"column",label:"Column"},{value:"scatter",label:"Scatter"}],ae=[{value:"",label:"(Chart default)"},{value:"smooth",label:"Smooth"},{value:"straight",label:"Straight"},{value:"stepline",label:"Step"},{value:"monotoneCubic",label:"Monotone"}],ie=["entity","attribute","statistics","datasource","buffer"],_=g(b=>b.datasource!==void 0?"datasource":b.statistics?"statistics":"history","kindOf"),re=g(b=>Object.fromEntries(Object.entries(b).filter(([,e])=>e!=null&&e!==""&&!(typeof e=="object"&&!Array.isArray(e)&&Object.keys(e).length===0))),"prune"),T=class T2 extends P{static get properties(){return{hass:{type:Object},config:{type:Object},_expanded:{type:Number,state:true}}}static get styles(){return O`
      :host {
        display: block;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--ha-space-2);
      }
      .header h3 {
        margin: 0;
      }
      .series {
        margin-bottom: var(--ha-space-2);
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-2);
      }
      .full {
        grid-column: 1 / -1;
      }
      .empty {
        padding: var(--ha-space-4);
        text-align: center;
        color: var(--secondary-text-color);
      }
      ha-alert {
        display: block;
        margin-bottom: var(--ha-space-2);
      }
    `}constructor(){super(),this.hass=null,this.config={},this._expanded=0}get _sources(){const{config:e}=$(this.config??{});return Array.isArray(e.sources)?e.sources:[]}_commit(e){x(this,"config-changed",{config:{...this.config,sources:e}})}_patch(e,t){const a=this._sources.map((r,i)=>i===e?re({...r,...t}):r);this._commit(a)}_add(){const e=[...this._sources,{entity:""}];this._expanded=e.length-1,this._commit(e)}_remove(e){this._commit(this._sources.filter((t,a)=>a!==e))}_move(e,t){const a=[...this._sources],r=e+t;r<0||r>=a.length||([a[e],a[r]]=[a[r],a[e]],this._expanded=r,this._commit(a))}_setKind(e,t){const a=this._sources[e];if(_(a)===t)return;const r=Object.fromEntries(Object.entries(a).filter(([o])=>!ie.includes(o))),i=a.entity??"",s=t==="datasource"?{datasource:"",...r}:t==="statistics"?{entity:i,statistics:{type:"mean",period:"hour"},...r}:{entity:i,...r},d=this._sources.map((o,u)=>u===e?s:o);this._commit(d)}_dataSourceNames(){var a,r,i,s,d,o;const e=Object.keys(((a=this.config)==null?void 0:a.data_sources)??{}),t=[...((o=(d=(s=(i=(r=window.lcards)==null?void 0:r.core)==null?void 0:i.dataSourceManager)==null?void 0:s.sources)==null?void 0:d.keys)==null?void 0:o.call(d))??[]];return[...new Set([...e,...t])].sort()}_bufferNames(e){var r,i,s,d,o,u,h,m,c,v;const t=(s=(i=(r=this.config)==null?void 0:r.data_sources)==null?void 0:i[e])==null?void 0:s.processing;if(t)return Object.keys(t);const a=(h=(u=(o=(d=window.lcards)==null?void 0:d.core)==null?void 0:o.dataSourceManager)==null?void 0:u.getSource)==null?void 0:h.call(u,e);return[...((v=(c=(m=a==null?void 0:a.processorManager)==null?void 0:m.processors)==null?void 0:c.keys)==null?void 0:v.call(c))??[]]}_warnings(e){var i,s,d,o,u;const t=[];if(e.entity&&_(e)==="history"){const h=(s=(i=this.hass)==null?void 0:i.states)==null?void 0:s[e.entity],m=e.attribute?(d=h==null?void 0:h.attributes)==null?void 0:d[e.attribute]:h==null?void 0:h.state;h&&m!==void 0&&M(m)===null&&!["unavailable","unknown"].includes(String(m))&&t.push(`The current value "${m}" isn't numeric, so it won't plot. Pick a numeric attribute, or use a data source with enum_mapping.`)}const[a]=w({chart_type:(o=this.config)==null?void 0:o.chart_type,sources:[e]}),r=a&&N(a,((u=this.config)==null?void 0:u.chart_type)||"line");return r&&t.push(`This chart type plots ranges: ${r}.`),t}_select(e,t,a,r,i={}){return n`
      <ha-selector
        .hass=${this.hass}
        .label=${e}
        .value=${t??""}
        .selector=${{select:{mode:"dropdown",options:a,...i}}}
        @value-changed=${s=>r(s.detail.value)}>
      </ha-selector>
    `}_text(e,t,a,r=""){return n`
      <ha-selector
        .hass=${this.hass}
        .label=${e}
        .value=${t??""}
        .selector=${{text:r?{placeholder:r}:{}}}
        @value-changed=${i=>a(i.detail.value||void 0)}>
      </ha-selector>
    `}_number(e,t,a,{min:r=0,max:i=20,step:s=1}={}){return n`
      <ha-selector
        .hass=${this.hass}
        .label=${e}
        .value=${t}
        .selector=${{number:{min:r,max:i,step:s,mode:"box"}}}
        @value-changed=${d=>a(d.detail.value===""||d.detail.value===null?void 0:Number(d.detail.value))}>
      </ha-selector>
    `}_renderSource(e,t){var r,i;const a=_(e);if(a==="datasource"){const s=this._dataSourceNames(),d=e.datasource?this._bufferNames(e.datasource):[];return n`
        ${this._select("Data source",e.datasource,s.map(o=>({value:o,label:o})),o=>this._patch(t,{datasource:o,buffer:void 0}),{custom_value:true})}
        ${this._select("Buffer",e.buffer??"",[{value:"",label:"(Raw values)"},...d.map(o=>({value:o,label:o}))],o=>this._patch(t,{buffer:o||void 0}))}
      `}return n`
      <ha-selector
        class=${a==="statistics"?"":"full"}
        .hass=${this.hass}
        .label=${"Entity"}
        .value=${e.entity??""}
        .required=${true}
        .selector=${{entity:{}}}
        @value-changed=${s=>this._patch(t,{entity:s.detail.value,attribute:void 0})}>
      </ha-selector>
      ${a==="statistics"?n`
        ${this._select("Statistic",((r=e.statistics)==null?void 0:r.type)??"mean",K.map(s=>({value:s,label:s})),s=>this._patch(t,{statistics:{...e.statistics,type:s}}))}
        ${this._select("Period",((i=e.statistics)==null?void 0:i.period)??"hour",Z,s=>this._patch(t,{statistics:{...e.statistics,period:s}}))}
      `:n`
        <ha-selector
          class="full"
          .hass=${this.hass}
          .label=${"Attribute (optional)"}
          .value=${e.attribute??""}
          .selector=${{attribute:{entity_id:e.entity}}}
          @value-changed=${s=>this._patch(t,{attribute:s.detail.value||void 0})}>
        </ha-selector>
      `}
    `}_knownStates(e){var i,s,d;if(!e)return[];const t=e.split(".")[0],a=((d=(s=(i=this.hass)==null?void 0:i.states)==null?void 0:s[e])==null?void 0:d.attributes)??{};return[...U[t]??a.options??a.hvac_modes??[]]}_renderTimelineFields(e,t){const a=this._knownStates(e.entity),r=["active","inactive","unavailable",...a].map(s=>({value:s,label:s})),i={hass:this.hass,config:{entity:e.entity},_getConfigValue:g(()=>e.color,"_getConfigValue"),_setConfigValue:g((s,d)=>this._patch(t,{color:d&&(typeof d!="object"||Object.keys(d).length)?d:void 0}),"_setConfigValue")};return n`
      <lcards-form-section header="Timeline" icon="mdi:chart-timeline" nested outlined>
        <div class="grid">
          ${this._text("Name",e.name,s=>this._patch(t,{name:s}))}
          ${this._text("Shortest state",e.min_duration,s=>this._patch(t,{min_duration:s}),"e.g. 30s")}
          <ha-selector
            class="full"
            .hass=${this.hass}
            .label=${"States to draw (default: all)"}
            .value=${e.states??[]}
            .selector=${{select:{multiple:true,custom_value:true,mode:"dropdown",options:r}}}
            @value-changed=${s=>{var d;return this._patch(t,{states:(d=s.detail.value)!=null&&d.length?s.detail.value:void 0})}}>
          </ha-selector>
          <div class="full">
            <lcards-color-section-v2
              .editor=${i}
              .entityId=${e.entity??""}
              basePath="color"
              header="Bar colours"
              description="States left out take the theme's state colours, as Home Assistant's history does"
              .suggestedStates=${["default","active","inactive","unavailable",...a]}
              ?allowCustomStates=${true}
              ?expanded=${false}>
            </lcards-color-section-v2>
          </div>
        </div>
      </lcards-form-section>
    `}_renderSeries(e,t,a){var u,h,m;const r=_(e),i=(((u=this.config)==null?void 0:u.chart_type)??"line")==="rangeBar",s=e.name||e.entity||e.datasource||`Series ${t+1}`,d=(((h=this.config)==null?void 0:h.yaxis)??[]).map(c=>c.id).filter(Boolean),o=e.group_by??{};return n`
      <lcards-form-section
        class="series"
        header=${s}
        secondary=${((m=E.find(c=>c.value===r))==null?void 0:m.label)??""}
        icon=${r==="datasource"?"mdi:database":r==="statistics"?"mdi:chart-box-outline":"mdi:chart-line"}
        ?expanded=${this._expanded===t}
        outlined>
        <ha-icon-button slot="header-icons" .label=${"Move up"} ?disabled=${t===0}
          @click=${c=>{c.stopPropagation(),this._move(t,-1)}}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Move down"} ?disabled=${t===a-1}
          @click=${c=>{c.stopPropagation(),this._move(t,1)}}>
          <ha-icon icon="mdi:arrow-down"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Remove series"}
          @click=${c=>{c.stopPropagation(),this._remove(t)}}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>

        ${this._warnings(e).map(c=>n`<lcards-message type="warning">${c}</lcards-message>`)}

        <div class="grid">
          <div class="full">
            ${this._select("Source",r,E,c=>this._setKind(t,c))}
          </div>
          ${this._renderSource(e,t)}
        </div>

        ${i?this._renderTimelineFields(e,t):n`
        <lcards-form-section header="Grouping" icon="mdi:group" nested outlined>
          <div class="grid">
            ${this._select("Group points by",o.func??"",Q,c=>this._patch(t,{group_by:c?{duration:"1h",fill:"last",...o,func:c}:void 0}))}
            ${o.func?n`
              ${this._text("Bucket length",o.duration,c=>this._patch(t,{group_by:{...o,duration:c??"1h"}}),"1h")}
              ${this._select("Empty buckets",o.fill??"last",ee,c=>this._patch(t,{group_by:{...o,fill:c}}))}
            `:D}
          </div>
        </lcards-form-section>

        <lcards-form-section header="Display" icon="mdi:palette" nested outlined>
          <div class="grid">
            ${this._text("Name",e.name,c=>this._patch(t,{name:c}))}
            ${this._text("Unit",e.unit,c=>this._patch(t,{unit:c}),"From entity")}
            ${this._select("Series type",e.type??"",te,c=>this._patch(t,{type:c||void 0}))}
            ${this._select("Line",e.curve??"",ae,c=>this._patch(t,{curve:c||void 0}))}
            ${this._number("Line width",e.stroke_width,c=>this._patch(t,{stroke_width:c}))}
            ${this._number("Dash length",e.stroke_dash,c=>this._patch(t,{stroke_dash:c}))}
            ${this._number("Decimals",e.float_precision,c=>this._patch(t,{float_precision:c}),{max:6})}
            ${this._number("Fill opacity",e.opacity,c=>this._patch(t,{opacity:c}),{max:1,step:.1})}
            ${d.length?this._select("Y axis",e.yaxis_id??"",[{value:"",label:"(First axis)"},...d.map(c=>({value:c,label:c}))],c=>this._patch(t,{yaxis_id:c||void 0})):D}
            <div class="full">
              <lcards-color-picker
                .hass=${this.hass}
                .value=${e.color??""}
                .showPreview=${true}
                @value-changed=${c=>this._patch(t,{color:c.detail.value||void 0})}>
              </lcards-color-picker>
            </div>
          </div>
        </lcards-form-section>`}
      </lcards-form-section>
    `}render(){const e=this._sources;return n`
      <div class="header">
        <h3>Series</h3>
        <ha-button @click=${this._add}>
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add series
        </ha-button>
      </div>
      ${e.length?e.map((t,a)=>this._renderSeries(t,a,e.length)):n`<div class="empty">No series yet. Add one to plot an entity or a data source.</div>`}
    `}};g(T,"LCARdSChartSeriesListEditor");let C=T;customElements.get("lcards-chart-series-list-editor")||customElements.define("lcards-chart-series-list-editor",C);const A=class A2 extends P{static get properties(){return{hass:{type:Object},_initialConfig:{type:Object},_workingConfig:{type:Object,state:true},_activeTab:{type:String,state:true},_showDataSourceEditor:{type:Boolean,state:true},_previewEmpty:{type:Boolean,state:true},_previewError:{type:String,state:true}}}constructor(){super(),this.hass=null,this._initialConfig=null,this._workingConfig={},this._activeTab="data",this._previewRef=R(),this._previewCard=null,this._previewUpdateTimer=null,this._previewEmpty=false,this._previewError=null,this._showDataSourceEditor=false,this._chartSchema=z()}get config(){return this._workingConfig}set config(e){this._initialConfig===null&&(this._initialConfig=e),this._workingConfig=JSON.parse(JSON.stringify(e||{}))}get _dataSourceHost(){const e=this;return{get hass(){return e.hass},get config(){return e._workingConfig},set config(t){e._workingConfig=JSON.parse(JSON.stringify(t||{}))},get _cardGuid(){var t;return((t=e._workingConfig)==null?void 0:t.id)??"chart-studio"},requestUpdate:g(()=>{e.requestUpdate(),e._schedulePreviewUpdate()},"requestUpdate"),dispatchEvent:g(()=>(e.requestUpdate(),e._schedulePreviewUpdate(),true),"dispatchEvent")}}connectedCallback(){super.connectedCallback(),this._workingConfig=JSON.parse(JSON.stringify(this._initialConfig||{})),this._workingConfig.type||(this._workingConfig.type="custom:lcards-chart"),this._workingConfig.chart_type||(this._workingConfig.chart_type="line"),this._migrateColorConfig(),this._workingConfig=$(this._workingConfig).config,p.debug("[ChartStudio] Opened with config:",this._workingConfig),this.updateComplete.then(()=>this._updatePreviewCard())}_migrateColorConfig(){var t;if(!((t=this._workingConfig.style)!=null&&t.colors))return;const e=this._workingConfig.style.colors;Array.isArray(e)&&(p.debug("[ChartStudio] Migrating old color format to style.colors.series"),this._workingConfig.style.colors={series:e})}_getSchemaForPath(e){return this._getSchemaByPath(e)}_getConfigValue(e){if(e==="style.legend.show")return this._legendShown();const t=e.split(".");let a=this._workingConfig;for(const r of t){if(a==null)return;a=a[r]}return a}_setConfigValue(e,t){this._updateConfig(e,t)}disconnectedCallback(){super.disconnectedCallback(),this._previewUpdateTimer&&clearTimeout(this._previewUpdateTimer)}updated(e){super.updated(e),e.has("hass")&&this._previewCard&&(this._previewCard.hass=this.hass)}static get styles(){return[J,H,W,O`
            :host {
                display: block;
            }

            /* Override studio layout for 40/60 split (more preview space for charts) */
            .studio-layout {
                grid-template-columns: 40% 60%;
                grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
                gap: 24px;
            }

            /* Config panel - scrollable */
            .config-panel {
                display: flex;
                flex-direction: column;
            }

            /* Chart preview container - dark background for charts */
            .preview-container {
                flex: 1;
                min-height: 400px;
                padding: 16px;
                overflow: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.3s ease;
                background: var(--primary-background-color);
                position: relative;
            }

            .preview-mount,
            .preview-mount > * {
                width: 100%;
                height: 100%;
            }

            /* Empty / error states sit over the preview mount */
            .preview-state {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                gap: var(--ha-space-2);
                padding: var(--ha-space-6);
                color: var(--secondary-text-color);
            }
            .preview-state ha-icon {
                --mdc-icon-size: 48px;
                opacity: 0.5;
            }
            .preview-state-title {
                font-weight: 600;
                color: var(--primary-text-color);
            }
            .preview-error ha-icon {
                color: var(--error-color);
                opacity: 1;
            }

            .time-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: var(--ha-space-2);
            }
            .axis-row {
                display: grid;
                grid-template-columns: 1.4fr 1fr 1fr 1fr;
                gap: var(--ha-space-2);
                align-items: center;
                margin-bottom: var(--ha-space-2);
            }
            .axis-toggles {
                grid-column: 1 / -1;
                display: flex;
                align-items: center;
                gap: var(--ha-space-4);
            }
            .data-actions {
                display: flex;
                justify-content: flex-end;
                margin: var(--ha-space-2) 0 var(--ha-space-4);
            }

            /* Data Sources Tab Styles */
            .level-selector {
                display: flex;
                gap: 12px;
                margin-bottom: 24px;
            }

            .level-card {
                flex: 1;
                padding: 16px;
                border: 2px solid var(--divider-color);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--card-background-color);
            }

            .level-card:hover {
                border-color: var(--primary-color);
                background: var(--secondary-background-color);
            }

            .level-card.active {
                border-color: var(--primary-color);
                border-width: 3px;
                background: var(--primary-color);
                color: white;
            }

            .level-card-title {
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 4px;
            }

            .level-card-description {
                font-size: 12px;
                opacity: 0.8;
            }

            .level-card.active .level-card-description {
                opacity: 1;
            }

            .form-field {
                margin-bottom: 12px;
            }

            .form-label {
                display: block;
                font-weight: 500;
                margin-bottom: 8px;
                font-size: 14px;
            }

            .entity-preview {
                padding: 12px;
                background: var(--secondary-background-color);
                border-radius: 8px;
                margin-top: 12px;
            }

            .entity-preview-header {
                font-weight: 600;
                margin-bottom: 8px;
            }

            .entity-preview-item {
                display: flex;
                gap: 8px;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .entity-preview-label {
                font-weight: 500;
                min-width: 120px;
            }

            .entity-preview-value {
                color: var(--secondary-text-color);
            }

            .series-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .series-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px;
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 8px;
            }

            .series-controls {
                display: flex;
                gap: 4px;
            }

            .series-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .add-button {
                margin-top: 12px;
            }

            .datasource-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .datasource-item {
                padding: 12px;
                background: var(--card-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 8px;
            }

            .datasource-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .datasource-name {
                font-weight: 600;
                font-size: 14px;
            }

            .datasource-entity {
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            ha-entity-picker {
                width: 100%;
            }

            ha-input {
                width: 100%;
            }

            /* Data sources dialog: sized to its content, not the studio's 90vh */
            ha-dialog.datasources-dialog {
                --ha-dialog-width-md: min(900px, 95vw);
                --ha-dialog-min-height: auto;
                --ha-dialog-max-height: 85vh;
            }
            `]}_updateConfig(e,t){const a=e.split("."),r=a.pop();this._workingConfig={...this._workingConfig};let i=this._workingConfig;for(const s of a)(!i[s]||typeof i[s]!="object")&&(i[s]={}),i=i[s];t==null||t===""?delete i[r]:i[r]=t,p.debug(`[ChartStudio] Updated ${e} =`,t),this.requestUpdate(),this._schedulePreviewUpdate()}_schedulePreviewUpdate(){this._previewUpdateTimer&&clearTimeout(this._previewUpdateTimer),this._previewUpdateTimer=setTimeout(()=>{this._previewUpdateTimer=null,this._updatePreviewCard()},300)}_updatePreviewCard(){const e=this._previewRef.value;if(!e)return;e.replaceChildren(),this._previewCard=null;const t=this._getPreviewConfig();if(this._previewEmpty=!t,this._previewError=null,!!t)try{const a=document.createElement("lcards-chart");a.setConfig(t),a.hass=this.hass,e.appendChild(a),this._previewCard=a}catch(a){p.error("[ChartStudio] Failed to update preview:",a),this._previewError=a.message||"Failed to render chart"}}_getPreviewConfig(){if(!this._workingConfig)return null;try{const e=JSON.parse(JSON.stringify(this._workingConfig));return e.type||(e.type="custom:lcards-chart"),e.chart_type||(e.chart_type="line"),e.height||(e.height=300),this._hasValidDataConfig(e)?e:(p.debug("[ChartStudio] Skipping preview - config incomplete (no valid data sources)"),null)}catch(e){return p.error("[ChartStudio] Error preparing preview config:",e),null}}_hasValidDataConfig(e){return w(e).length>0}_handleMainTabChange(e){var a;const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t!=null&&(this._activeTab=t,p.debug("[ChartStudio] Switched to tab:",t),this.requestUpdate())}_handleSave(){p.debug("[ChartStudio] Saving config:",this._workingConfig),this._workingConfig.data_sources&&Object.keys(this._workingConfig.data_sources).length===0&&(delete this._workingConfig.data_sources,p.debug("[ChartStudio] Removed empty data_sources object")),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._workingConfig},bubbles:true,composed:true})),this._handleClose()}_handleCancel(){if(this._configHasChanges()){this._confirmAction("Discard unsaved changes?").then(e=>{e&&(p.debug("[ChartStudio] Cancelled - changes discarded"),this._handleClose())});return}p.debug("[ChartStudio] Cancelled"),this._handleClose()}_configHasChanges(){const e=JSON.stringify(this._initialConfig),t=JSON.stringify(this._workingConfig);return e!==t}_confirmAction(e){return B({title:"Discard changes?",message:e,confirmText:"Discard"})}_onDialogClosed(e){e.stopPropagation(),e.target===e.currentTarget&&this._handleClose()}_handleClose(){this.dispatchEvent(new CustomEvent("closed",{bubbles:true,composed:true}))}_handleYamlConfig(e){const t=$(e.detail.config).config;t.type||(t.type="custom:lcards-chart"),this._workingConfig=t,this.requestUpdate(),this._schedulePreviewUpdate()}_hasScatter(){const e=this._workingConfig||{};return e.chart_type==="scatter"||Array.isArray(e.sources)&&e.sources.some(t=>(t==null?void 0:t.type)==="scatter")}_legendShown(){var e,t,a,r;return((a=(t=(e=this._workingConfig)==null?void 0:e.style)==null?void 0:t.legend)==null?void 0:a.show)??G.LEGEND_ON_BY_DEFAULT.has(((r=this._workingConfig)==null?void 0:r.chart_type)??"line")}_tabDocs(){switch(this._activeTab){case"data":return f.chartSeries;case"appearance":case"elements":case"theme":case"effects":return f.chartStyling;case"advanced":return f.chartRawOptions;default:return f.chart}}_renderTabNavigation(){const e=[{id:"data",icon:"mdi:database-arrow-right",label:"Data"},{id:"appearance",icon:"mdi:palette-advanced",label:"Appearance"},{id:"elements",icon:"mdi:widgets",label:"Elements"},{id:"theme",icon:"mdi:theme-light-dark",label:"Theme"},{id:"effects",icon:"mdi:shimmer",label:"Effects"},{id:"advanced",icon:"mdi:cog",label:"Advanced"},{id:"yaml",icon:"mdi:code-braces",label:"YAML"}];return n`
            <ha-tab-group @wa-tab-show=${this._handleMainTabChange}>
                ${e.map(t=>n`
                    <ha-tab-group-tab value="${t.id}" ?active=${this._activeTab===t.id}>
                        <ha-icon icon="${t.icon}"></ha-icon>
                        ${t.label}
                    </ha-tab-group-tab>
                `)}
            </ha-tab-group>
        `}_renderTabContent(){switch(this._activeTab){case"data":return this._renderDataTab();case"appearance":return this._renderAppearanceTab();case"elements":return this._renderElementsTab();case"theme":return this._renderThemeTab();case"effects":return this._renderEffectsTab();case"advanced":return this._renderAdvancedTab();case"yaml":return n`
                    <lcards-studio-yaml-tab
                        .hass=${this.hass}
                        .config=${this._workingConfig}
                        .schema=${this._chartSchema}
                        cardType="chart"
                        @yaml-config-changed=${this._handleYamlConfig}>
                    </lcards-studio-yaml-tab>
                `;default:return n`<p>Unknown tab: ${this._activeTab}</p>`}}_renderDataTab(){return n`
            <div class="data-tab">
                <!-- Series List Editor Component -->
                <lcards-chart-series-list-editor
                    .hass=${this.hass}
                    .config=${this._workingConfig}
                    @config-changed=${this._handleSeriesConfigChanged}>
                </lcards-chart-series-list-editor>

                <div class="data-actions">
                    <ha-button appearance="outlined" @click=${()=>{this._showDataSourceEditor=true}}>
                        <ha-icon icon="mdi:database-cog" slot="start"></ha-icon>
                        Manage data sources
                    </ha-button>
                </div>

                <!-- Chart Type Selector -->
                ${this._renderChartTypeSelector()}

                ${this._renderTimeAndAxes()}

                ${this._renderStateBands()}

                ${this._renderDataSourceHelp()}
            </div>
        `}_renderChartTypeSelector(){const e=this._workingConfig.chart_type||"line",t=this._getSeriesCount(),a="Plots the latest value of each series, not its history: add one series per item (each entity becomes one",r=[{value:"line",label:"Line",icon:"mdi:chart-line",minSeries:1,desc:"Trends over time",docs:"chartTypes",infoText:"Plots each series' history as a line. Works with any entity history, long-term statistics or data source. Best for temperature, power, or any value that changes over time."},{value:"area",label:"Area",icon:"mdi:chart-areaspline",minSeries:1,desc:"Volume visualization",docs:"chartTypes",infoText:"Like Line, but fills the area below the curve. Good for showing volume or magnitude over time."},{value:"bar",label:"Bar",icon:"mdi:chart-bar",minSeries:1,desc:"Horizontal comparisons",docs:"chartTypes",infoText:"Horizontal bars, one per data point. Use Grouping on the series (for example Average per hour) to get one bar per time bucket."},{value:"column",label:"Column",icon:"mdi:chart-bar-stacked",minSeries:1,desc:"Vertical comparisons",docs:"chartGrouping",infoText:"Vertical bars over time. Works best with Grouping on the series (for example Average per hour, or Delta per day for energy meters)."},{value:"scatter",label:"Scatter",icon:"mdi:chart-scatter-plot",minSeries:1,desc:"Correlations",docs:"chartTypes",infoText:"Plots individual readings as dots without connecting lines. Useful for spotting patterns and outliers. Tip: increase Marker Size in Appearance if the dots are too small."},{value:"heatmap",label:"Heatmap",icon:"mdi:grid",minSeries:1,desc:"Matrix / density",docs:"chartGallery",infoText:"Grid of colour-intensity cells: each series is one row and time runs across the columns. Add Grouping (for example Average per 2h) so each cell is one bucket."},{value:"pie",label:"Pie",icon:"mdi:chart-pie",minSeries:2,desc:"Proportions (2+ series)",docs:"chartGallery",infoText:`${a} slice, named by the series Name). Use two or more, for example power per room.`},{value:"donut",label:"Donut",icon:"mdi:chart-donut",minSeries:2,desc:"Proportions (2+ series)",docs:"chartGallery",infoText:`${a} slice). Like Pie with an open centre; use two or more series.`},{value:"radar",label:"Radar",icon:"mdi:radar",minSeries:1,desc:"Spider chart",docs:"chartGallery",infoText:`${a} axis of the polygon, labelled by the series Name). Use three or more series that share a unit, for example the temperature of each room.`},{value:"radialBar",label:"Radial Bar",icon:"mdi:chart-arc",minSeries:1,desc:"Circular gauges",docs:"chartTypeOptions",infoText:`${a} gauge arc). Values from 0 to 100 work best (battery %, humidity, CPU %).`},{value:"polarArea",label:"Polar",icon:"mdi:chart-donut-variant",minSeries:1,desc:"Directional data",docs:"chartGallery",infoText:`${a} equal-angle segment, sized by its value).`},{value:"treemap",label:"Treemap",icon:"mdi:view-grid",minSeries:1,desc:"Hierarchical data",docs:"chartGallery",infoText:`${a} rectangle, its area sized by the value). Good for breakdowns like power or cost by room.`},{value:"rangeBar",label:"Timeline",icon:"mdi:chart-timeline",minSeries:1,desc:"States over time",docs:"chartTimeline",needs:"entity history",infoText:"Each series is a row of bars, one bar for each stretch of time the entity held a state (on, heat, playing), coloured by state as Home Assistant's history does. Use entity series with their history (not statistics or data sources); set States to draw only some states."},{value:"rangeArea",label:"Range Area",icon:"mdi:chart-bell-curve",minSeries:1,desc:"Confidence bands",docs:"chartRangeCharts",needs:"grouping or statistics",infoText:"Shaded band between a low and a high value over time. Set each series to Grouping: Min/max band, or use long-term statistics (the band runs from each period's min to max)."},{value:"candlestick",label:"Candlestick",icon:"mdi:chart-candlestick",minSeries:1,desc:"OHLC financial data",docs:"chartRangeCharts",needs:"grouping",infoText:"Open/high/low/close bars per time bucket. Set each series to Grouping: Open/high/low/close with a bucket length (e.g. 1h)."},{value:"boxPlot",label:"Box Plot",icon:"mdi:chart-box-outline",minSeries:1,desc:"Statistical distribution",docs:"chartRangeCharts",needs:"grouping",infoText:"Distribution per time bucket (min, quartiles, median, max). Set each series to Grouping: Box plot values with a bucket length (e.g. 1d)."}];return n`
            <lcards-form-section
                header="Chart Type"
                description="Choose visualization - some types require multiple series"
                icon="mdi:chart-line-variant"
                ?expanded=${true}>

                <!-- Contextual info panel - shown ABOVE tiles so it's immediately visible -->
                ${(()=>{const i=r.find(s=>s.value===e);return i?n`
                        <div style="
                            margin-bottom: 14px;
                            padding: 12px 14px;
                            border-radius: 8px;
                            border-left: 3px solid ${i.needs?"var(--warning-color, #f59e0b)":"var(--info-color, var(--primary-color))"} ;
                            background: ${i.needs?"rgba(245,158,11,0.08)":"rgba(var(--rgb-primary-color, 33,150,243), 0.07)"};
                            display: flex;
                            gap: 10px;
                            align-items: flex-start;">
                            <ha-icon
                                icon="${i.needs?"mdi:alert-circle-outline":"mdi:information-outline"}"
                                style="
                                    --mdc-icon-size: 20px;
                                    color: ${i.needs?"var(--warning-color, #f59e0b)":"var(--primary-color)"};
                                    flex-shrink: 0;
                                    margin-top: 1px;">
                            </ha-icon>
                            <div>
                                <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
                                    ${i.label}
                                    ${i.needs?n`<span style="font-size: 11px; font-weight: 400; opacity: 0.8;"> (needs ${i.needs})</span>`:""}
                                </div>
                                <div style="font-size: 13px; line-height: 1.5; color: var(--secondary-text-color);">
                                    ${i.infoText}
                                </div>
                                <div class="info-guide-links" style="margin-top: var(--ha-space-2); font-size: 13px;">
                                    <a href=${y(f[i.docs])} target="_blank" rel="noopener noreferrer">${i.label} chart docs →</a>
                                </div>
                            </div>
                        </div>
                    `:""})()}

                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 10px;">
                    ${r.map(i=>{const s=t>=i.minSeries,d=e===i.value;return n`
                            <div
                                class="chart-type-card ${d?"selected":""} ${s?"":"disabled"}"
                                style="
                                    padding: 12px;
                                    border: 2px solid ${d?"var(--primary-color)":"var(--divider-color)"};
                                    border-radius: 8px;
                                    cursor: ${s?"pointer":"not-allowed"};
                                    transition: all 0.2s;
                                    background: ${d?"var(--primary-color)":"var(--card-background-color)"};
                                    color: ${d?"white":"var(--primary-text-color)"};
                                    text-align: center;
                                    opacity: ${s?"1":"0.4"};
                                    position: relative;
                                "
                                @click=${()=>{s&&this._setConfigValue("chart_type",i.value)}}
                                title="${s?i.desc:`Requires ${i.minSeries}+ series`}">

                                <ha-icon icon="${i.icon}" style="font-size: 28px; margin-bottom: 6px;"></ha-icon>
                                <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">
                                    ${i.label}
                                </div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
                                    ${i.desc}
                                </div>
                                ${i.minSeries>1?n`
                                    <div style="
                                        font-size: 10px;
                                        opacity: 0.8;
                                        margin-top: 4px;
                                        padding: 2px 6px;
                                        background: ${s?"rgba(0,0,0,0.2)":"rgba(255,0,0,0.2)"};
                                        border-radius: 4px;
                                        display: inline-block;">
                                        ${i.minSeries}+ series
                                    </div>
                                `:""}
                            </div>
                        `})}
                </div>

                ${t<2?n`
                    <lcards-message type="info" style="margin-top: 12px;">
                        <strong>Tip:</strong> Pie and Donut charts require 2+ series. Add more series in the Data Sources tab to unlock them.
                    </lcards-message>
                `:""}
            </lcards-form-section>
        `}_getSeriesCount(){return w(this._workingConfig).length}_renderTimeAndAxes(){var s,d;const e=this._workingConfig,t=Array.isArray(e.yaxis)?e.yaxis:[],a=[{value:"",label:"(Rolling, ends now)"},...["minute","hour","day","week","month","year"].map(o=>({value:o,label:`Start of ${o}`}))],r=g(o=>this._updateConfig("yaxis",o.length?o:void 0),"setAxes"),i=g((o,u)=>r(t.map((h,m)=>{if(m!==o)return h;const c={...h,...u};return Object.fromEntries(Object.entries(c).filter(([,v])=>v!==void 0&&v!==""&&v!==null))})),"patchAxis");return n`
            <lcards-form-section header="Time and axes" icon="mdi:clock-outline" ?expanded=${true}>
                <div class="time-grid">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Time span"}
                        .helper=${"e.g. 6h, 2d, 1w (default 24h)"}
                        .value=${e.graph_span??""}
                        .selector=${{text:{placeholder:"24h"}}}
                        @value-changed=${o=>this._updateConfig("graph_span",o.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Align window"}
                        .value=${((s=e.span)==null?void 0:s.start)??""}
                        .selector=${{select:{mode:"dropdown",options:a}}}
                        @value-changed=${o=>this._updateConfig("span.start",o.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Offset"}
                        .helper=${"e.g. -1d to show the same window yesterday"}
                        .value=${((d=e.span)==null?void 0:d.offset)??""}
                        .selector=${{text:{placeholder:"-1d"}}}
                        @value-changed=${o=>this._updateConfig("span.offset",o.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Sync group"}
                        .helper=${"Charts with the same name share a hover cursor and zoom"}
                        .value=${e.sync_group??""}
                        .selector=${{text:{placeholder:"climate"}}}
                        @value-changed=${o=>this._updateConfig("sync_group",o.detail.value||void 0)}>
                    </ha-selector>
                </div>

                <h4>Y axes</h4>
                ${t.length===0?n`
                    <p class="hint">One automatic axis. Add axes to give series different scales.</p>
                `:t.map((o,u)=>n`
                    <div class="axis-row">
                        <ha-selector .hass=${this.hass} .label=${"Id"} .value=${o.id??""}
                            .selector=${{text:{}}}
                            @value-changed=${h=>i(u,{id:h.detail.value})}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Min"} .value=${o.min}
                            .selector=${{number:{mode:"box",step:"any"}}}
                            @value-changed=${h=>i(u,{min:h.detail.value})}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Max"} .value=${o.max}
                            .selector=${{number:{mode:"box",step:"any"}}}
                            @value-changed=${h=>i(u,{max:h.detail.value})}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Decimals"} .value=${o.decimals}
                            .selector=${{number:{mode:"box",min:0,max:6,step:1}}}
                            @value-changed=${h=>i(u,{decimals:h.detail.value})}>
                        </ha-selector>
                        <div class="axis-toggles">
                            <ha-selector .hass=${this.hass} .label=${"Right side"} .value=${o.opposite??false}
                                .selector=${{boolean:{}}}
                                @value-changed=${h=>i(u,{opposite:h.detail.value||void 0})}>
                            </ha-selector>
                            <ha-selector .hass=${this.hass} .label=${"Shown"} .value=${o.show??true}
                                .selector=${{boolean:{}}}
                                @value-changed=${h=>i(u,{show:h.detail.value===false?false:void 0})}>
                            </ha-selector>
                            <ha-icon-button .label=${"Remove axis"}
                                @click=${()=>r(t.filter((h,m)=>m!==u))}>
                                <ha-icon icon="mdi:delete"></ha-icon>
                            </ha-icon-button>
                        </div>
                    </div>
                `)}
                <ha-button appearance="outlined"
                    @click=${()=>r([...t,{id:`axis_${t.length+1}`,...t.length?{opposite:true}:{}}])}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Y axis
                </ha-button>
            </lcards-form-section>
        `}_renderStateBands(){const e=Array.isArray(this._workingConfig.state_bands)?this._workingConfig.state_bands:[],t=g(r=>this._updateConfig("state_bands",r.length?r:void 0),"setBands"),a=g((r,i)=>t(e.map((s,d)=>{if(d!==r)return s;const o={...s,...i};return Object.fromEntries(Object.entries(o).filter(([,u])=>u!==void 0&&u!==""&&u!==null))})),"patch");return n`
            <lcards-form-section header="State bands" icon="mdi:texture-box"
                description="Shade the times an entity was in a state (a thermostat heating) behind the series. Time charts only."
                ?expanded=${e.length>0}>
                ${e.map((r,i)=>n`
                    <lcards-form-section header=${r.entity||`Band ${i+1}`} icon="mdi:texture-box" nested outlined ?expanded=${true}>
                        <ha-selector .hass=${this.hass} .label=${"Entity"} .value=${r.entity??""}
                            .selector=${{entity:{}}}
                            @value-changed=${s=>a(i,{entity:s.detail.value})}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Attribute"} .value=${r.attribute??""}
                            .helper=${"Shade an attribute instead of the state, e.g. hvac_action"}
                            .selector=${{attribute:{entity_id:r.entity}}}
                            @value-changed=${s=>a(i,{attribute:s.detail.value})}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"States"} .value=${r.states??["active"]}
                            .helper=${"Exact states (heat, playing) or active, inactive, unavailable. Default: active"}
                            .selector=${{select:{multiple:true,custom_value:true,options:["active","inactive","unavailable"]}}}
                            @value-changed=${s=>{const d=s.detail.value;a(i,{states:Array.isArray(d)&&d.length&&!(d.length===1&&d[0]==="active")?d:void 0})}}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Minimum duration"} .value=${r.min_duration??""}
                            .helper=${"Shorter states join the run before them, e.g. 30s, 5min"}
                            .selector=${{text:{}}}
                            @value-changed=${s=>a(i,{min_duration:s.detail.value})}>
                        </ha-selector>
                        <label class="field-label">Colour</label>
                        <div class="hint">Blank: the theme's state colours, as Home Assistant's history uses</div>
                        <lcards-color-picker .hass=${this.hass}
                            .value=${typeof r.color=="string"?r.color:""}
                            @value-changed=${s=>a(i,{color:s.detail.value})}>
                        </lcards-color-picker>
                        ${r.color&&typeof r.color=="object"?n`<div class="hint">A colour per state is set in YAML; picking one here replaces it.</div>`:""}
                        <ha-selector .hass=${this.hass} .label=${"Opacity"} .value=${r.opacity??.2}
                            .selector=${{number:{mode:"slider",min:0,max:1,step:.05}}}
                            @value-changed=${s=>a(i,{opacity:s.detail.value===.2?void 0:s.detail.value})}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${"Write the state on each band"} .value=${r.label??false}
                            .selector=${{boolean:{}}}
                            @value-changed=${s=>a(i,{label:s.detail.value||void 0})}>
                        </ha-selector>
                        <ha-button variant="danger" appearance="plain" @click=${()=>t(e.filter((s,d)=>d!==i))}>
                            <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                            Remove band
                        </ha-button>
                    </lcards-form-section>
                `)}
                <ha-button appearance="outlined" @click=${()=>t([...e,{entity:""}])}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add state band
                </ha-button>
            </lcards-form-section>
        `}_renderDataSourceHelp(){return n`
            <lcards-form-section variant="guide" header="Chart sources: help" icon="mdi:help-circle" ?expanded=${false} outlined>
                <div class="info-guide-body">
                    <h4>Entity history</h4>
                    <p>Plots an entity's recorded history for the chart's time span, then follows live changes.</p>

                    <h4>Entity long-term statistics</h4>
                    <p>Plots hourly, daily or monthly statistics (mean, min, max, sum, ...) for sensors with a state class. Best for long spans.</p>

                    <h4>Data source</h4>
                    <p>Plots a named data source, optionally one of its processor buffers (smoothing, rate, statistics, ...). Use "Manage data sources" to add one.</p>

                    <h4>Grouping</h4>
                    <p>Buckets points into fixed intervals. Range area, box plot and candlestick charts need min/max band, box plot values or open/high/low/close grouping.</p>

                    <div class="info-guide-links">
                        <a href=${y(f.chartSeries)} target="_blank" rel="noopener noreferrer">Series and time →</a>
                        <a href=${y(f.chartGrouping)} target="_blank" rel="noopener noreferrer">Grouping →</a>
                        <a href=${y(f.chartStatistics)} target="_blank" rel="noopener noreferrer">Long-term statistics →</a>
                        <a href=${y(f.datasources)} target="_blank" rel="noopener noreferrer">Data sources →</a>
                    </div>
                </div>
            </lcards-form-section>
        `}_closeDataSourceEditor(){this._showDataSourceEditor=false,this.requestUpdate(),p.debug("[ChartStudio] Closed inline DataSource editor")}_handleSeriesConfigChanged(e){var r;e.stopPropagation();const t=e.detail.config,a={...this._workingConfig};t.sources!==void 0&&(a.sources=t.sources),t.data_sources!==void 0&&(a.data_sources={...t.data_sources}),this._workingConfig=a,p.debug("[ChartStudio] Series configuration updated:",{seriesCount:((r=this._workingConfig.sources)==null?void 0:r.length)||0,dataSourceCount:Object.keys(this._workingConfig.data_sources||{}).length}),this._updatePreviewCard(),this.requestUpdate()}_getNestedValue(e){const t=e.split(".");let a=this._workingConfig;for(const r of t)if(a=a==null?void 0:a[r],a===void 0)return;return a}_setNestedValue(e,t){const a=e.split("."),r=a.pop();this._workingConfig={...this._workingConfig};let i=this._workingConfig;for(const s of a)i[s]||(i[s]={}),i=i[s];i[r]=t,e.includes("colors")&&p.debug(`[ChartStudio] Color config updated: ${e} =`,t),this.requestUpdate(),this._schedulePreviewUpdate()}_getSchemaByPath(e){const t=e.split(".");let a=this._chartSchema;for(const r of t)if(a.properties&&a.properties[r])a=a.properties[r];else return{type:"string","x-ui-hints":{selector:{text:{}}}};return a}_renderSingleColorPicker(e,t,a=""){const r=this._getNestedValue(e)||"";return n`
            <div style="margin-bottom: 12px;">
                <label class="field-label">${t}</label>
                ${a?n`<div class="hint">${a}</div>`:""}
                <lcards-color-picker
                    .hass=${this.hass}
                    .value=${r}
                    @value-changed=${i=>{this._setNestedValue(e,i.detail.value)}}>
                </lcards-color-picker>
            </div>
        `}_renderColorList(e,t,a=""){const r=this._getNestedValue(e)||[];return n`
            <lcards-color-list
                .hass=${this.hass}
                .colors=${r}
                .label=${t}
                .description=${a}
                @colors-changed=${i=>{this._setNestedValue(e,i.detail.colors)}}>
            </lcards-color-list>
        `}_renderGradientConfig(){return this._getNestedValue("style.fill.gradient.type"),this._getNestedValue("style.fill.gradient.shadeIntensity"),n`
            <div class="gradient-config" style="padding-left: 16px; border-left: 2px solid var(--divider-color); margin-top: 16px;">
                <h4 style="margin: 0 0 12px 0;">Gradient Settings</h4>

                ${l.renderField(this,"style.fill.gradient.type",{label:"Gradient Direction"})}

                ${l.renderField(this,"style.fill.gradient.shadeIntensity",{label:"Shade Intensity"})}
            </div>
        `}_renderAppearanceTab(){const e=this._getNestedValue("style.fill.type")||"solid";return n`
            <lcards-message type="info">
                Colours are CSS variables (<code>var(--lcars-blue)</code>) or hex codes; a list cycles through the series.
            </lcards-message>

            ${this._workingConfig.chart_type==="rangeBar"?n`
                <lcards-form-section
                    header="Timeline"
                    description="How the timeline's bars are laid out"
                    icon="mdi:chart-timeline"
                    ?expanded=${true}>
                    ${l.renderField(this,"style.group_rows",{label:"One row per label",helper:"Bars with the same label share a row"})}
                    ${l.renderField(this,"style.show_labels",{label:"Labels on the bars",helper:"Write each bar's state on it"})}
                </lcards-form-section>
            `:""}

            <!-- Series Colors (Primary) -->
            <lcards-form-section
                header="Series Colors"
                description="Primary colors for data series (array of colors)"
                icon="mdi:palette"
                ?expanded=${true}>

                ${this._renderColorList("style.colors.series","Series Colors","Colors for each data series - cycles through array")}
            </lcards-form-section>

            <!-- Stroke Configuration -->
            <lcards-form-section
                header="Stroke Configuration"
                description="Line and border styling"
                icon="mdi:brush"
                ?expanded=${true}>

                ${l.renderField(this,"style.stroke.width",{label:"Stroke Width",helper:"Line thickness in pixels (affects all series)"})}

                ${l.renderField(this,"style.stroke.curve",{label:"Curve Type",helper:"Choose straight lines or smooth curves between data points"})}

                ${l.renderField(this,"style.stroke.dash_array",{label:"Dash Pattern",helper:"Dashed line pattern length (0 = solid line)"})}

                ${this._renderColorList("style.colors.stroke","Stroke Colors","Outline/line colors - cycles through array")}
            </lcards-form-section>

            <!-- Fill Configuration -->
            <lcards-form-section
                header="Fill Configuration"
                description="Area and background fill styling"
                icon="mdi:format-color-fill"
                ?expanded=${true}>

                ${l.renderField(this,"style.fill.type",{label:"Fill Type"})}

                ${l.renderField(this,"style.fill.opacity",{label:"Fill Opacity"})}

                ${this._renderColorList("style.colors.fill","Fill Colors","Area fill colors - cycles through array")}

                ${e==="gradient"?this._renderGradientConfig():""}
            </lcards-form-section>

            <!-- Background & Foreground (Single Colors) -->
            <lcards-form-section
                header="Background & Foreground"
                description="Base chart colors (single values)"
                icon="mdi:format-color-fill"
                ?expanded=${false}>

                <div style="display: grid; gap: 12px;">
                    ${this._renderSingleColorPicker("style.colors.background","Background","Chart background")}
                    ${this._renderSingleColorPicker("style.colors.foreground","Foreground","Text and labels")}
                    ${this._renderSingleColorPicker("style.colors.grid","Grid Lines","Grid line color")}
                </div>
            </lcards-form-section>

            <!-- Marker Colors (Collapsed by default) -->
            <lcards-form-section
                header="Marker Colors"
                description="Data point marker styling (arrays)"
                icon="mdi:circle"
                ?expanded=${false}>

                ${this._renderColorList("style.colors.marker.fill","Marker Fill","Fill colors for markers")}
                ${this._renderColorList("style.colors.marker.stroke","Marker Stroke","Stroke colors for markers")}
            </lcards-form-section>

            <!-- Axis Colors (Collapsed) -->
            <lcards-form-section
                header="Axis Colors"
                description="X and Y axis styling (single values)"
                icon="mdi:axis-arrow"
                ?expanded=${false}>

                <div style="display: grid; gap: 12px;">
                    ${this._renderSingleColorPicker("style.colors.axis.x","X-Axis","X-axis color")}
                    ${this._renderSingleColorPicker("style.colors.axis.y","Y-Axis","Y-axis color")}
                    ${this._renderSingleColorPicker("style.colors.axis.border","Axis Border","Border around chart")}
                    ${this._renderSingleColorPicker("style.colors.axis.ticks","Axis Ticks","Tick mark color")}
                </div>
            </lcards-form-section>

            <!-- Legend Colors (Collapsed) -->
            <lcards-form-section
                header="Legend Colors"
                description="Legend text styling"
                icon="mdi:label"
                ?expanded=${false}>

                <div style="display: grid; gap: 12px;">
                    ${this._renderSingleColorPicker("style.colors.legend.default","Legend Text","Default legend text")}
                </div>
                ${this._renderColorList("style.colors.legend.items","Legend Items","Per-item legend colors (optional)")}
            </lcards-form-section>

            <!-- Data Label Colors (Collapsed) -->
            <lcards-form-section
                header="Data Label Colors"
                description="On-chart data label styling (array)"
                icon="mdi:label-variant"
                ?expanded=${false}>

                ${this._renderColorList("style.colors.data_labels","Data Label Colors","Colors for data point labels")}
            </lcards-form-section>
        `}_renderElementsTab(){var t,a;const e=this._getNestedValue("style.grid.show")??true;return n`
            <lcards-message type="info">
                <strong>Chart elements</strong><br>
                Configure markers (data points), grid lines, axes, and legends.
                Most settings are optional - use defaults for clean charts.
            </lcards-message>

            <!-- Markers Configuration -->
            <lcards-form-section
                header="Markers Configuration"
                description="Data point marker styling"
                icon="mdi:circle"
                ?expanded=${true}>

                ${l.renderField(this,"style.markers.size",{label:"Marker Size",helper:this._hasScatter()?"Size of data point circles. Scatter series need markers: 0 or blank uses 6":"Size of data point circles (0 to hide markers)",value:((a=(t=this._workingConfig.style)==null?void 0:t.markers)==null?void 0:a.size)??(this._hasScatter()?6:void 0)})}

                ${l.renderField(this,"style.markers.shape",{label:"Marker Shape"})}

                ${l.renderField(this,"style.markers.stroke.width",{label:"Marker Stroke Width",helper:"Border width around markers"})}
            </lcards-form-section>

            <!-- Grid Configuration -->
            <lcards-form-section
                header="Grid Configuration"
                description="Background grid styling"
                icon="mdi:grid"
                ?expanded=${true}>

                ${l.renderField(this,"style.grid.show",{label:"Show Grid"})}

                ${e?n`
                    ${this._renderColorList("style.grid.row_colors","Grid Row Colors","Alternating row background colors")}
                    ${this._renderColorList("style.grid.column_colors","Grid Column Colors","Alternating column background colors")}
                `:""}
            </lcards-form-section>

            <!-- X-Axis Configuration -->
            <lcards-form-section
                header="X-Axis Configuration"
                description="Horizontal axis styling and labels"
                icon="mdi:axis-x-arrow"
                ?expanded=${true}>

                ${l.renderField(this,"style.xaxis.labels.show",{label:"Show X-Axis Labels",helper:"Display labels below the chart (typically timestamps or categories)"})}

                ${l.renderField(this,"style.xaxis.labels.rotate",{label:"Label Rotation (degrees)",helper:"Rotate labels to prevent overlap (-90 for vertical)"})}

                ${l.renderField(this,"style.xaxis.border.show",{label:"Show X-Axis Border"})}

                ${l.renderField(this,"style.xaxis.ticks.show",{label:"Show X-Axis Ticks"})}
            </lcards-form-section>

            <!-- Y-Axis Configuration -->
            <lcards-form-section
                header="Y-Axis Configuration"
                description="Vertical axis styling and labels"
                icon="mdi:axis-y-arrow"
                ?expanded=${true}>

                ${l.renderField(this,"style.yaxis.labels.show",{label:"Show Y-Axis Labels",helper:"Display value labels on the left side of the chart"})}

                ${l.renderField(this,"style.yaxis.border.show",{label:"Show Y-Axis Border"})}

                ${l.renderField(this,"style.yaxis.ticks.show",{label:"Show Y-Axis Ticks"})}

                ${l.renderField(this,"style.yaxis.decimals",{label:"Value Decimal Places",helper:"Round displayed values to N decimal places (applies to axis labels, tooltips, and data labels). Leave empty for full precision."})}
            </lcards-form-section>

            <!-- Legend Configuration -->
            <lcards-form-section
                header="Legend Configuration"
                description="Chart legend positioning and styling"
                icon="mdi:label-multiple"
                ?expanded=${true}>

                ${l.renderField(this,"style.legend.show",{label:"Show Legend"})}

                ${this._legendShown()?n`
                    ${l.renderField(this,"style.legend.position",{label:"Legend Position"})}

                    ${l.renderField(this,"style.legend.horizontalAlign",{label:"Horizontal Alignment"})}
                `:""}
            </lcards-form-section>

            <!-- Data Labels Configuration -->
            <lcards-form-section
                header="Data Labels"
                description="Labels displayed on data points"
                icon="mdi:label-variant"
                ?expanded=${false}>

                ${l.renderField(this,"style.data_labels.show",{label:"Show Data Labels",helper:"Display values directly on data points (can be cluttered with many points)"})}

                ${this._getNestedValue("style.data_labels.show")?n`
                    ${l.renderField(this,"style.data_labels.offsetY",{label:"Vertical Offset"})}
                `:""}
            </lcards-form-section>

            <!-- Tooltip Configuration -->
            <lcards-form-section
                header="Tooltip Configuration"
                description="Interactive tooltip settings"
                icon="mdi:tooltip-text"
                ?expanded=${false}>

                ${l.renderField(this,"style.display.tooltip.show",{label:"Show Tooltip"})}

                ${this._getNestedValue("style.display.tooltip.show")!==false?n`
                    ${l.renderField(this,"style.display.tooltip.theme",{label:"Tooltip Theme"})}
                `:""}
            </lcards-form-section>
        `}_renderEffectsTab(){return this._renderAnimationTab()}_renderThemeTab(){const e=this._getNestedValue("style.theme.monochrome.enabled")??false;return n`
            <!-- Theme Mode -->
            <lcards-form-section
                header="Theme Mode"
                description="Light or dark theme for chart"
                icon="mdi:theme-light-dark"
                ?expanded=${true}>

                <lcards-message type="info">
                    <strong>Theme vs colours</strong><br>
                    Theme mode sets the overall look. Use Appearance tab for detailed color control.
                </lcards-message>

                ${l.renderField(this,"style.theme.mode",{label:"Theme Mode",helper:"Choose light or dark base theme"})}
            </lcards-form-section>



            <!-- Monochrome Mode -->
            <lcards-form-section
                header="Monochrome Mode"
                description="Single color with shade variations"
                icon="mdi:invert-colors"
                ?expanded=${false}>

                ${l.renderField(this,"style.theme.monochrome.enabled",{label:"Enable Monochrome"})}

                ${e?n`
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${this._getNestedValue("style.theme.monochrome.color")||"#FF9900"}
                        @value-changed=${t=>this._setNestedValue("style.theme.monochrome.color",t.detail.value)}>
                    </lcards-color-picker>

                    ${l.renderField(this,"style.theme.monochrome.shade_to",{label:"Shade Direction"})}

                    ${l.renderField(this,"style.theme.monochrome.shade_intensity",{label:"Shade Intensity"})}
                `:""}
            </lcards-form-section>
        `}_renderAnimationTab(){return n`
            <lcards-form-section
                header="Animation Configuration"
                description="Chart animation and transitions"
                icon="mdi:animation"
                ?expanded=${true}>

                ${l.renderField(this,"style.animation.preset",{label:"Animation Preset"})}

                ${X({header:"Animation presets",body:n`
                        <ul>
                            <li><strong>lcars_standard</strong>: balanced speed and smoothness.</li>
                            <li><strong>lcars_dramatic</strong>: slower, more cinematic.</li>
                            <li><strong>lcars_minimal</strong>: fast, subtle transitions.</li>
                            <li><strong>lcars_realtime</strong>: no animation, for live data.</li>
                            <li><strong>none</strong>: no animations at all.</li>
                        </ul>
                    `})}
            </lcards-form-section>
        `}_renderAdvancedTab(){return n`
            <!-- Formatters -->
            <lcards-form-section
                header="Formatters"
                description="Custom label and tooltip formatting"
                icon="mdi:code-braces"
                ?expanded=${false}>

                ${l.renderField(this,"style.formatters.xaxis_label",{label:"X-Axis Label Format",helper:"Template: 'MMM DD' or '{value}°C'"})}

                ${l.renderField(this,"style.formatters.yaxis_label",{label:"Y-Axis Label Format"})}

                ${l.renderField(this,"style.formatters.tooltip",{label:"Tooltip Format",helper:"Template: '{x|MMM DD}: {y}°C'"})}
            </lcards-form-section>

            <!-- Typography -->
            <lcards-form-section
                header="Typography"
                description="Font family and size"
                icon="mdi:format-text"
                ?expanded=${false}>

                ${l.renderField(this,"style.typography.font_family",{label:"Font Family"})}

                ${l.renderField(this,"style.typography.font_size",{label:"Font Size"})}
            </lcards-form-section>

            <!-- Display Options -->
            <lcards-form-section
                header="Display Options"
                description="Toolbar and other UI elements"
                icon="mdi:eye"
                ?expanded=${false}>

                ${l.renderField(this,"style.display.toolbar",{label:"Show Toolbar",helper:"Download, zoom, pan controls"})}
            </lcards-form-section>

            <!-- Raw chart_options Override -->
            <lcards-form-section
                header="Raw ApexCharts Options"
                description="Advanced: Direct ApexCharts configuration override"
                icon="mdi:code-json"
                ?expanded=${false}>

                <lcards-message type="warning">
                    <strong>Advanced Users Only:</strong> Direct ApexCharts options override.
                    These settings have highest precedence and may conflict with visual settings above.
                </lcards-message>

                <ha-yaml-editor
                    .hass=${this.hass}
                    .value=${this._getNestedValue("style.chart_options")||{}}
                    .label=${"chart_options (YAML)"}
                    @value-changed=${e=>this._setNestedValue("style.chart_options",e.detail.value)}>
                </ha-yaml-editor>

                <lcards-message type="info">
                    <strong>Example:</strong>
                    <pre style="background: var(--secondary-background-color); padding: 8px; border-radius: 4px; overflow-x: auto;">
xaxis:
  type: datetime
  labels:
    format: 'HH:mm'
yaxis:
  min: 0
  max: 100
                    </pre>
                </lcards-message>
            </lcards-form-section>
        `}render(){return n`
            <ha-dialog
                open
                @closed=${this._onDialogClosed}
                flexcontent
                header-title="Chart Studio">

                <div class="dialog-content">
                    <!-- Split Layout: Config (40%) | Preview (60%) -->
                    <div class="studio-layout">
                        <!-- Left Panel: Config -->
                        <div class="config-panel">
                            <!-- Tab Navigation -->
                            ${this._renderTabNavigation()}

                            <!-- Tab Content Wrapper (scrollable) -->
                            <div class="tab-content">
                                ${this._renderTabContent()}
                            </div>
                        </div>

                        <!-- Right Panel: Live Preview -->
                        <div class="preview-panel">
                            <!-- Preview Toolbar -->
                            <div class="canvas-toolbar">
                                <div class="canvas-toolbar-buttons">
                                    <ha-icon-button
                                        .label=${"Refresh preview"}
                                        @click=${()=>this._updatePreviewCard()}>
                                        <ha-icon icon="mdi:refresh"></ha-icon>
                                    </ha-icon-button>
                                </div>
                            </div>

                            <!-- Live Preview Container -->
                            <div class="preview-container">
                                <div class="preview-mount" ${Y(this._previewRef)}></div>

                                ${this._previewEmpty?n`
                                    <div class="preview-state">
                                        <ha-icon icon="mdi:chart-line-variant"></ha-icon>
                                        <div class="preview-state-title">Add a series</div>
                                        <div>Add at least one series to see the chart preview.</div>
                                    </div>
                                `:""}

                                ${this._previewError?n`
                                    <div class="preview-state preview-error">
                                        <ha-icon icon="mdi:alert-circle"></ha-icon>
                                        <div class="preview-state-title">Chart error</div>
                                        <div>${this._previewError}</div>
                                    </div>
                                `:""}
                            </div>
                        </div>
                    </div>

                    <!-- Data sources: the Main Engineering tab, in its own dialog -->
                    ${this._showDataSourceEditor?n`
                        <ha-dialog
                            open
                            class="datasources-dialog"
                            header-title="Data sources"
                            @closed=${e=>{e.stopPropagation(),e.target===e.currentTarget&&this._closeDataSourceEditor()}}>
                            <lcards-datasource-editor-tab
                                .editor=${this._dataSourceHost}
                                .hass=${this.hass}>
                            </lcards-datasource-editor-tab>
                            <ha-dialog-footer slot="footer">
                                <ha-button slot="primaryAction" data-dialog="close">Close</ha-button>
                            </ha-dialog-footer>
                        </ha-dialog>
                    `:""}
                </div>

                <!-- Dialog Actions -->
                <ha-dialog-footer slot="footer">
                    <div slot="secondaryAction" class="footer-start">
                        <ha-button appearance="plain" @click=${()=>window.open(y(this._tabDocs()),"_blank","noopener")}>
                            <ha-icon icon="mdi:book-open-variant" slot="start"></ha-icon>
                            Documentation
                        </ha-button>
                    </div>
                    <ha-button slot="secondaryAction"
                        appearance="plain"
                        @click=${this._handleCancel}>
                        Cancel
                    </ha-button>
                    <ha-button slot="primaryAction"
                        variant="brand"
                        @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}};g(A,"LCARdSChartStudioDialog");let k=A;customElements.get("lcards-chart-studio-dialog")||customElements.define("lcards-chart-studio-dialog",k);const F=class F2 extends I{constructor(){super(),this.cardType="chart",this._openedConfigSeen=false,this._upgradeNotes=[],this._studio=null}updated(e){super.updated(e),e.has("hass")&&this._studio&&(this._studio.hass=this.hass)}setConfig(e){const{config:t,changed:a,notes:r}=$(e),i=!this._openedConfigSeen;this._openedConfigSeen=true,super.setConfig(t),i&&a&&(this._upgradeNotes=r,p.info("[LCARdSChartEditor] Upgraded legacy chart config",r),this.updateComplete.then(()=>x(this,"config-changed",{config:this.config})))}_getTabDefinitions(){return[{label:"Configuration",content:g(()=>this._renderConfigurationTab(),"content")},...this._getUtilityTabs()]}_renderConfigurationTab(){return n`
            ${this._upgradeNotes.length?n`
                <lcards-message type="info" title="Chart format upgraded">
                    This card was upgraded to the current chart format. Save to keep the change.
                </lcards-message>
            `:""}

            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Chart Configuration Studio</h3>
                    <p>
                        <strong>Full-screen workspace</strong> with live preview: series, time span,
                        axes, colours, animations and more.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        @click=${this._openChartStudio}>
                        <ha-icon icon="mdi:chart-line" slot="start"></ha-icon>
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

                ${l.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}

                ${l.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
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
                    ${l.renderField(this,"height",{label:"Height"})}

                    ${l.renderField(this,"width",{label:"Width"})}

                    ${l.renderField(this,"min_height",{label:"Min Height"})}

                    ${l.renderField(this,"min_width",{label:"Min Width"})}

                    ${l.renderField(this,"max_height",{label:"Max Height"})}

                    ${l.renderField(this,"max_width",{label:"Max Width"})}

                    ${l.renderField(this,"overflow")}

                    ${l.renderField(this,"z_index")}

                    ${l.renderField(this,"overflow_x")}

                    ${l.renderField(this,"overflow_y")}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `}async _openChartStudio(){p.debug("[ChartEditor] Opening Chart Configuration Studio");const e=document.createElement("lcards-chart-studio-dialog");e.hass=this.hass,e.config=JSON.parse(JSON.stringify(this.config||{})),this._studio=e,e.addEventListener("config-changed",t=>{this.config=t.detail.config,this._isUpdatingYaml=true,this._yamlValue=q(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false}),x(this,"config-changed",{config:this.config}),this.requestUpdate()}),V(e,()=>{e.remove(),this._studio===e&&(this._studio=null)}),j(e,this)}};g(F,"LCARdSChartEditor");let S=F;customElements.get("lcards-chart-editor")||customElements.define("lcards-chart-editor",S);export{S as LCARdSChartEditor};
//# sourceMappingURL=lcards-chart-editor-u1GbVsQ-.js.map
