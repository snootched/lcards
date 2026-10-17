var Ae=Object.defineProperty;var u=(o,e)=>Ae(o,"name",{value:e,configurable:true});import{T as Oe,V as De,F as Ne,A as y,a as x,i as k,b as n,W as A,l as w,X as pe,Y as Me,Z as ze,z as fe,D as me,$ as Pe,a0 as ve,h as ge,a1 as be,a2 as Be,a3 as je,x as _e,a4 as oe,P as Ke,a5 as Re,a6 as Ie}from"./lcards-main-BW4hZuuz.js";import{r as Ue}from"./directive-helpers-wss58hq2.js";import{s as ye,l as Fe,r as He,f as ne}from"./studio-dialog-styles-BC3IDpnS.js";import{m as N,e as $e}from"./lcards-message-DJxE4eZn.js";import"./lcards-form-section-Bxom3ojy.js";import{c as qe,y as We}from"./lcards-yaml-editor-B_uxS34u.js";import"./lcards-studio-yaml-tab-Lg6_-7nV.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const D=u((o,e)=>{var s;const t=o._$AN;if(t===void 0)return false;for(const a of t)(s=a._$AO)==null||s.call(a,e,false),D(a,e);return true},"s"),P=u(o=>{let e,t;do{if((e=o._$AM)===void 0)break;t=e._$AN,t.delete(o),o=e}while((t==null?void 0:t.size)===0)},"o$1"),we=u(o=>{for(let e;e=o._$AM;o=e){let t=e._$AN;if(t===void 0)e._$AN=t=new Set;else if(t.has(o))break;t.add(o),Ge(e)}},"r");function Le(o){this._$AN!==void 0?(P(this),this._$AM=o,we(this)):this._$AM=o}u(Le,"h$1");function Ye(o,e=false,t=0){const s=this._$AH,a=this._$AN;if(a!==void 0&&a.size!==0)if(e)if(Array.isArray(s))for(let r=t;r<s.length;r++)D(s[r],false),P(s[r]);else s!=null&&(D(s,false),P(s));else D(this,o)}u(Ye,"n$1");const Ge=u(o=>{o.type==De.CHILD&&(o._$AP??(o._$AP=Ye),o._$AQ??(o._$AQ=Le))},"c"),J=class J2 extends Oe{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,s){super._$AT(e,t,s),we(this),this.isConnected=e._$AU}_$AO(e,t=true){var s,a;e!==this.isConnected&&(this.isConnected=e,e?(s=this.reconnected)==null||s.call(this):(a=this.disconnected)==null||a.call(this)),t&&(D(this,e),P(this))}setValue(e){if(Ue(this._$Ct))this._$Ct._$AI(e,this);else{const t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}};u(J,"f");let I=J;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ve=u(()=>new U,"e"),Q=class Q2{};u(Q,"h");let U=Q;const B=new WeakMap,Je=Ne(class extends I{render(o){return y}update(o,[e]){var s;const t=e!==this.G;return t&&this.G!==void 0&&this.rt(void 0),(t||this.lt!==this.ct)&&(this.G=e,this.ht=(s=o.options)==null?void 0:s.host,this.rt(this.ct=o.element)),y}rt(o){if(this.isConnected||(o=void 0),typeof this.G=="function"){const e=this.ht??globalThis;let t=B.get(e);t===void 0&&(t=new WeakMap,B.set(e,t)),t.get(this.G)!==void 0&&this.G.call(this.ht,void 0),t.set(this.G,o),o!==void 0&&this.G.call(this.ht,o)}else this.G.value=o}get lt(){var o,e;return typeof this.G=="function"?(o=B.get(this.ht??globalThis))==null?void 0:o.get(this.G):(e=this.G)==null?void 0:e.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),xe=x`
  .datasources-list {
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-3);
    --lcards-section-spacing: 0;
  }

  .datasource-details {
    padding: var(--ha-space-2);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    gap: var(--ha-space-3);
    padding: 6px 0;
    border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
  }

  .info-row:last-of-type {
    border-bottom: none;
  }

  .info-row .label {
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .info-row .value {
    color: var(--primary-text-color);
    font-family: var(--code-font-family, monospace);
    text-align: right;
    overflow-wrap: anywhere;
  }

  .info-row .value.name {
    font-weight: 600;
    color: var(--primary-color);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ha-space-1);
    justify-content: flex-end;
  }

  .chip {
    padding: 2px var(--ha-space-2);
    border-radius: var(--ha-border-radius-pill);
    background: color-mix(in srgb, var(--primary-color) 18%, transparent);
    color: var(--primary-text-color);
    font-size: 12px;
    font-family: var(--code-font-family, monospace);
  }

  .chip.auto {
    background: color-mix(in srgb, var(--warning-color, #ff9800) 22%, transparent);
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ha-space-2);
    margin-top: var(--ha-space-3);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--ha-space-2);
    padding: var(--ha-space-10) var(--ha-space-6);
    text-align: center;
    color: var(--secondary-text-color);
  }

  .empty-state ha-icon {
    --mdc-icon-size: 48px;
    color: var(--disabled-text-color);
  }

  .empty-state p {
    margin: 0;
  }
`,X=class X2 extends k{static get properties(){return{editor:{type:Object},config:{type:Object},hass:{type:Object},_expandedSources:{state:true}}}constructor(){super(),this.config,this._expandedSources=new Set}static get styles(){return[N,xe,x`
      :host {
        display: block;
      }
    `]}render(){var s;const e=((s=this.config)==null?void 0:s.data_sources)||{},t=Object.keys(e);return t.length===0?n`
        <div class="empty-state">
          <ha-icon icon="mdi:database-off-outline"></ha-icon>
          <p>This card has no data sources.</p>
          <p class="hint">Add one, or write them on the YAML tab.</p>
        </div>
      `:n`
      <div class="datasources-list">
        ${t.map(a=>this._renderDataSource(a,e[a]))}
      </div>
    `}_renderDataSource(e,t){const s=this._expandedSources.has(e);return n`
      <lcards-form-section
        header="${e}"
        secondary="${t.entity||"No entity"}"
        icon="mdi:database"
        ?expanded=${s}
        ?outlined=${true}
        headerLevel="4"
        @expanded-changed=${a=>this._toggleExpanded(e,a)}>

        ${s?n`
          <div class="datasource-details">
            <div class="info-row">
              <span class="label">Name</span>
              <span class="value name">${e}</span>
            </div>

            <!-- Basic Info -->
            <div class="info-row">
              <span class="label">Entity</span>
              <span class="value">${t.entity||"N/A"}</span>
            </div>

            ${t.attribute?n`
              <div class="info-row">
                <span class="label">Attribute</span>
                <span class="value">${t.attribute}</span>
              </div>
            `:""}

            <div class="info-row">
              <span class="label">Window</span>
              <span class="value">${t.window_seconds??t.windowSeconds??60}s</span>
            </div>

            <!-- Processors -->
            ${t.processing?n`
              <div class="info-row">
                <span class="label">Processors</span>
                <span class="value">${Object.keys(t.processing).length}</span>
              </div>
            `:""}

            <!-- History preload (on by default) -->
            <div class="info-row">
              <span class="label">History</span>
              <span class="value">${A(t).enabled?`last ${A(t).hours} h preloaded`:"not preloaded"}</span>
            </div>

            <!-- Edit and Remove Actions -->
            <div class="action-buttons">
              <ha-button
                @click=${()=>this._handleInspect(e)}>
                <ha-icon icon="mdi:magnify" slot="start"></ha-icon>
                Inspect
              </ha-button>
              <ha-button
                @click=${()=>this._handleEdit(e,t)}>
                <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                Edit
              </ha-button>
              <ha-button
                appearance="filled"
                variant="danger"
                @click=${()=>this._handleDelete(e)}>
                <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                Remove
              </ha-button>
            </div>
          </div>
        `:""}
      </lcards-form-section>
    `}_toggleExpanded(e,t){t.detail.expanded?this._expandedSources.add(e):this._expandedSources.delete(e),this.requestUpdate()}_handleInspect(e){this.dispatchEvent(new CustomEvent("inspect-source",{detail:{sourceName:e},bubbles:true,composed:true}))}_handleEdit(e,t){this.dispatchEvent(new CustomEvent("edit-datasource",{detail:{name:e,config:t},bubbles:true,composed:true}))}_handleDelete(e){this.dispatchEvent(new CustomEvent("delete-datasource",{detail:{name:e},bubbles:true,composed:true}))}};u(X,"LCARdSCardDataSourcesList");let F=X;customElements.get("lcards-card-datasources-list")||customElements.define("lcards-card-datasources-list",F);const Z=class Z2 extends k{static get properties(){return{hass:{type:Object},_stats:{type:Object,state:true}}}constructor(){super(),this._stats=null,this._refreshInterval=null}static get styles(){return[N,xe,x`
      :host {
        display: block;
      }

      .intro {
        margin: var(--ha-space-3) 0;
      }
    `]}connectedCallback(){super.connectedCallback(),this._refreshStats(),this._refreshInterval=setInterval(()=>this._refreshStats(),5e3)}disconnectedCallback(){this._refreshInterval&&clearInterval(this._refreshInterval),super.disconnectedCallback()}_refreshStats(){var t,s;const e=(s=(t=window.lcards)==null?void 0:t.core)==null?void 0:s.dataSourceManager;if(!e){this._stats=null;return}try{this._stats=e.getStats(),this.requestUpdate()}catch(a){w.error("❌ [GlobalDataSourcesPanel] Error fetching stats:",a)}}render(){if(!this._stats)return n`
        <lcards-message type="warning"
          message="The data source manager isn't running yet: it starts with the first LCARdS card on the page.">
        </lcards-message>
      `;const e=Object.entries(this._stats.sources||{});return e.length===0?n`
        <div class="empty-state">
          <ha-icon icon="mdi:database-off-outline"></ha-icon>
          <p>No data sources are running on this page.</p>
          <p class="hint">They appear here when cards create them.</p>
        </div>
      `:n`
      <p class="hint intro">Every data source running on this page, shared by all its cards. Read-only; updates every few seconds.</p>
      <div class="datasources-list">
        ${e.map(([t,s])=>this._renderGlobalSource(t,s))}
      </div>
    `}_renderGlobalSource(e,t){var l,c,d,h,f;const s=t.autoCreated||false,a=t.usedByCards||[],r=((l=t.buffer)==null?void 0:l.size)||0,i=((c=t.processors)==null?void 0:c.size)||0;return n`
      <lcards-form-section
        header=${e}
        secondary=${((d=t.config)==null?void 0:d.entity)||"-"}
        icon=${s?"mdi:auto-fix":"mdi:database"}
        ?outlined=${true}
        headerLevel="4">
        <div class="datasource-details">
          <div class="info-row">
            <span class="label">Created</span>
            <span class="chips"><span class="chip ${s?"auto":""}">${s?"automatically (from a template or chart)":"from a card config"}</span></span>
          </div>
          <div class="info-row">
            <span class="label">Entity</span>
            <span class="value">${((h=t.config)==null?void 0:h.entity)||"-"}</span>
          </div>
          <div class="info-row">
            <span class="label">Window</span>
            <span class="value">${((f=t.config)==null?void 0:f.windowSeconds)||60}s</span>
          </div>
          ${i>0?n`
            <div class="info-row">
              <span class="label">Processors</span>
              <span class="value">${i}</span>
            </div>
          `:""}
          <div class="info-row">
            <span class="label">Buffer</span>
            <span class="value">${r} points</span>
          </div>
          <div class="info-row">
            <span class="label">Used by</span>
            ${a.length?n`<span class="chips">${a.map(g=>n`<span class="chip">${g}</span>`)}</span>`:n`<span class="value">no cards</span>`}
          </div>
          ${t.sourceCard?n`
            <div class="info-row">
              <span class="label">Defined in</span>
              <span class="value">${t.sourceCard}</span>
            </div>
          `:""}
          ${t.lastUpdate?n`
            <div class="info-row">
              <span class="label">Last update</span>
              <span class="value">${this._formatTimestamp(t.lastUpdate)}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>
    `}_formatTimestamp(e){const t=Math.floor((Date.now()-e)/1e3);if(t<60)return`${t}s ago`;const s=Math.floor(t/60);return s<60?`${s}m ago`:`${Math.floor(s/60)}h ago`}};u(Z,"LCARdSGlobalDataSourcesPanel");let H=Z;customElements.get("lcards-global-datasources-panel")||customElements.define("lcards-global-datasources-panel",H);const Qe=new Set(["oldest","newest","window","t","duration_human","in_condition"]),le=5;function Xe(o,e){if(typeof e=="number")return Number.isFinite(e)?[[o,e]]:[];const t=Array.isArray(e)?e[e.length-1]:e;return!t||typeof t!="object"?[]:"duration_ms"in t?[[`${o} (min)`,t.duration_ms/6e4]]:Object.entries(t).filter(([s,a])=>!Qe.has(s)&&typeof a=="number"&&Number.isFinite(a)).map(([s,a])=>[`${o}.${s}`,a])}u(Xe,"numericFields");function Ze(o){const e=u(s=>Number.isInteger(s)?String(s):Number(s.toPrecision(6)).toString(),"num");if(o==null)return"-";if(typeof o=="number")return Number.isFinite(o)?e(o):String(o);const t=Array.isArray(o)?o[o.length-1]:o;return t&&typeof t=="object"?Object.entries(t).filter(([s])=>!["oldest","newest","t"].includes(s)).map(([s,a])=>`${s}: ${typeof a=="number"?e(a):a}`).join(" · "):String(t)}u(Ze,"formatResult");const ce=u(o=>o.reduce((e,t)=>Math.max(e,Math.abs(t.v)),0),"magnitude");function Ce(o,e,{entityState:t=null}={}){const s=[],a=o==null?void 0:o.processing,r=(e??[]).filter(m=>Number.isFinite(m==null?void 0:m.v)&&Number.isFinite(m==null?void 0:m.t)),l={order:[],series:[{name:"raw",points:r,axis:0,raw:true}],latest:[],errors:s};if(a!==void 0&&(a===null||typeof a!="object"||Array.isArray(a)))return s.push("processing must be a map of processor names to processors."),l;for(const[m,b]of Object.entries(a??{}))!b||typeof b!="object"?s.push(`${m}: a processor needs a type, e.g. type: smooth.`):b.from!==void 0&&b.type!=="convert_unit"&&s.push(`${m}: "from" is not a chaining key (it is convert_unit's unit). Use input_source: <processor>.`);if(s.length)return l;const{capacity:c}=pe(o),d=new Me(c),h={cfg:{entity:o==null?void 0:o.entity},hass:{states:o!=null&&o.entity&&t?{[o.entity]:t}:{}}},f=new ze(h,a??{});try{f.initialize(a??{},d)}catch(m){return s.push(m.message),l}const g=f._executionOrder??[],_=new Set,v=new Map,p=[{name:"raw",points:r,axis:0,raw:true}];for(const m of r){d.push(m.t,m.v);const b=f.process(m.v,m.t,d);for(const S of g){b[S]!==null&&b[S]!==void 0&&_.add(S);for(const[O,M]of Xe(S,b[S])){let E=v.get(O);E||(E={name:O,points:[],axis:0},v.set(O,E),p.push(E)),E.points.push({t:m.t,v:M})}}}const $=ce(r);for(const m of p.slice(1)){const b=ce(m.points);$>0&&b>0&&(b/$>le||$/b>le)&&(m.axis=1)}const C=f.getStats().processorStats;for(const{key:m,stats:b}of C)b!=null&&b.errors&&s.push(`${m}: ${b.errors} of ${b.executions+b.errors} samples failed (see the browser console).`);if(r.length)for(const m of g)_.has(m)||s.push(`${m}: produced no values (check its settings).`);const T=g.map(m=>{var M;const b=f.getProcessor(m),S=(b==null?void 0:b.getDependency())??null,O=(((M=b==null?void 0:b.getDependencies)==null?void 0:M.call(b))??[]).filter(E=>E!==S);return{key:m,type:(b==null?void 0:b.type)??"",input:[S??"raw",...O].join(" + "),value:Ze(f.processorResults.get(m))}});return{order:g,series:p,latest:T,errors:s}}u(Ce,"runProcessorPreview");const et=fe(me.processors),Se=[{type:"smooth",label:"Smooth",description:"Reduce noise: exponential, moving average or gaussian",defaults:{method:"exponential",alpha:.3}},{type:"scale",label:"Scale",description:"Map an input range to an output range (optionally curved)",defaults:{input_range:[0,100],output_range:[0,1]}},{type:"convert_unit",label:"Convert unit",description:"Unit conversion, e.g. °C to °F or W to kW",defaults:{from:"c",to:"f"}},{type:"round",label:"Round",description:"Round to a number of decimals (round, floor or ceil)",defaults:{precision:1}},{type:"clamp",label:"Clamp",description:"Keep the value within a minimum and maximum",defaults:{min:0,max:100}},{type:"delta",label:"Delta",description:"Change since the previous value",defaults:{}},{type:"rate",label:"Rate",description:"Rate of change per second, minute or hour",defaults:{unit:"per_hour"}},{type:"statistics",label:"Statistics",description:"Min, max, mean and more over a time window",defaults:{window:"1h",stats:["min","max","mean"]}},{type:"trend",label:"Trend",description:"Increasing, decreasing or stable (a word, not charted)",defaults:{samples:5,threshold:.01}},{type:"threshold",label:"Threshold",description:"Two outputs (1/0 by default) either side of a threshold",defaults:{threshold:0,hysteresis:0}},{type:"duration",label:"Duration",description:"Time spent while a condition holds",defaults:{condition:"> 0"}},{type:"expression",label:"Expression",description:"A JavaScript expression of value, sources and Math",defaults:{expression:"value"}}],z=u(o=>Se.find(e=>e.type===o),"processorType"),tt=u(o=>`${et}#${String(o).replace(/_/g,"-")}`,"processorDocsUrl"),ke=[{label:"Temperature",units:[["c","°C"],["f","°F"],["k","K"]]},{label:"Power",units:[["w","W"],["kw","kW"],["mw","MW"],["gw","GW"]]},{label:"Energy",units:[["wh","Wh"],["kwh","kWh"],["mwh","MWh"],["j","J"]]},{label:"Distance",units:[["mm","mm"],["cm","cm"],["m","m"],["km","km"],["in","in"],["ft","ft"],["yd","yd"],["mi","mi"]]},{label:"Speed",units:[["ms","m/s"],["kmh","km/h"],["mph","mph"],["knot","kn"]]},{label:"Pressure",units:[["hpa","hPa"],["bar","bar"],["psi","psi"],["mmhg","mmHg"],["inhg","inHg"]]},{label:"Data",units:[["b","B"],["kb","kB"],["mb","MB"],["gb","GB"],["tb","TB"]]},{label:"Volume",units:[["ml","mL"],["l","L"],["gal","gal"]]},{label:"Mass",units:[["g","g"],["kg","kg"],["lb","lb"],["oz","oz"]]},{label:"Light",units:[["brightness","brightness (0-255)"],["percent","percent (0-100)"]]}];function de(o=null){return ke.flatMap(e=>e.units.filter(([t])=>!o||o.includes(t)).map(([t,s])=>({value:t,label:`${e.label}: ${s}`})))}u(de,"unitOptions");function he(o){return ke.flatMap(e=>e.units.map(([t])=>t)).filter(e=>{if(e===o)return false;try{return new Pe({key:"check",type:"convert_unit",from:o,to:e}),true}catch{return false}})}u(he,"unitTargets");function st(o,e,t){if(!(o!=null&&o[e])||!t||t===e||o[t])return o;const s={};for(const[a,r]of Object.entries(o)){const i={...r};i.input_source===e&&(i.input_source=t),Array.isArray(i.sources)&&(i.sources=i.sources.map(l=>l===e?t:l)),s[a===e?t:a]=i}return s}u(st,"renameProcessor");function ue(o,e){const t=String(e||"processor").toLowerCase().replace(/[^a-z0-9_]/g,"_");if(!(o!=null&&o[t]))return t;let s=2;for(;o[`${t}_${s}`];)s++;return`${t}_${s}`}u(ue,"uniqueProcessorKey");const Ee=/^[a-z_][a-z0-9_]*$/,at=ve.additionalProperties.properties.processing.additionalProperties,j="__raw__",rt=[["min","Minimum"],["max","Maximum"],["mean","Mean"],["median","Median"],["std_dev","Standard deviation"],["q1","Q1 (25th percentile)"],["q3","Q3 (75th percentile)"],["range","Range (max - min)"],["count","Count"],["sum","Sum"]],ee=class ee2 extends k{static get properties(){return{hass:{attribute:false},processorKey:{type:String},config:{attribute:false},processorKeys:{attribute:false},latestValue:{type:String},_yaml:{state:true},_yamlError:{state:true},_nameError:{state:true}}}constructor(){super(),this.hass=void 0,this.processorKey="",this.config={},this.processorKeys=[],this.latestValue="",this._yaml=null,this._yamlError="",this._nameError=""}static get styles(){return x`
      :host {
        display: block;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-3);
      }
      .type {
        padding: 2px var(--ha-space-2);
        border-radius: var(--ha-border-radius-pill);
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-size: 12px;
        font-weight: 600;
      }
      .description {
        flex: 1 1 200px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .description a {
        color: var(--primary-color);
      }
      .fields {
        display: grid;
        gap: var(--ha-space-3);
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-3);
      }
      @media (max-width: 600px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
      ha-selector {
        display: block;
      }
      .help {
        margin-top: calc(var(--ha-space-2) * -1);
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .help code {
        font-family: var(--code-font-family, monospace);
      }
      .latest {
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .latest strong {
        color: var(--primary-text-color);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        margin-top: var(--ha-space-4);
      }
      .error {
        color: var(--error-color);
        font-size: 12px;
      }
    `}willUpdate(e){e.has("processorKey")&&e.get("processorKey")!==void 0&&(this._yaml=null,this._yamlError="",this._nameError="")}render(){var s;const e=(s=this.config)==null?void 0:s.type,t=z(e);return n`
      <div class="head">
        <span class="type">${(t==null?void 0:t.label)??e}</span>
        <span class="description">
          ${(t==null?void 0:t.description)??""}
          <a href=${tt(e)} target="_blank" rel="noreferrer">Docs</a>
        </span>
      </div>

      <div class="fields">
        <ha-selector
          .hass=${this.hass}
          .selector=${{text:{}}}
          .label=${"Name"}
          .value=${this.processorKey}
          .helper=${"Used in templates as {source.name} and by other processors as their input"}
          @value-changed=${this._rename}>
        </ha-selector>
        ${this._nameError?n`<div class="error">${this._nameError}</div>`:y}

        ${this._renderInput()}

        ${this._yaml===null?this._renderTypeFields(e):this._renderYaml()}

        ${this.latestValue?n`<div class="latest">Latest value in the preview: <strong>${this.latestValue}</strong></div>`:y}
      </div>

      <div class="actions">
        <ha-button appearance="plain" @click=${this._toggleYaml}>
          <ha-icon icon=${this._yaml===null?"mdi:code-braces":"mdi:form-select"} slot="start"></ha-icon>
          ${this._yaml===null?"Edit as YAML":"Back to the form"}
        </ha-button>
        <ha-button appearance="plain" @click=${()=>this._fire("processor-duplicate",{key:this.processorKey})}>
          <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
          Duplicate
        </ha-button>
        <ha-button appearance="plain" variant="danger" @click=${()=>this._fire("processor-delete",{key:this.processorKey})}>
          <ha-icon icon="mdi:delete" slot="start"></ha-icon>
          Delete
        </ha-button>
      </div>
    `}_renderInput(){var t;const e=this.processorKeys.filter(s=>s!==this.processorKey);return n`
      <ha-selector
        .hass=${this.hass}
        .selector=${{select:{mode:"dropdown",options:[{value:j,label:"(Raw entity value)"},...e.map(s=>({value:s,label:s}))]}}}
        .label=${"Input"}
        .required=${false}
        .value=${((t=this.config)==null?void 0:t.input_source)??j}
        .helper=${"What this processor works on: the raw value, or another processor's output (input_source)"}
        @value-changed=${s=>this._set("input_source",s.detail.value===j?"":s.detail.value)}>
      </ha-selector>
    `}_num(e,t,s,a={}){var r;return n`
      <ha-selector
        .hass=${this.hass}
        .selector=${{number:{mode:a.mode??"box",step:a.step??"any",...a.min!==void 0&&{min:a.min},...a.max!==void 0&&{max:a.max}}}}
        .label=${t}
        .value=${((r=this.config)==null?void 0:r[e])??s}
        @value-changed=${i=>this._set(e,i.detail.value)}>
      </ha-selector>
    `}_select(e,t,s,a,r={}){var i;return n`
      <ha-selector
        .hass=${this.hass}
        .selector=${{select:{mode:"dropdown",options:s,...r}}}
        .label=${t}
        .required=${false}
        .value=${((i=this.config)==null?void 0:i[e])??a}
        @value-changed=${l=>this._set(e,l.detail.value)}>
      </ha-selector>
    `}_text(e,t,s="",a=""){var r;return n`
      <ha-selector
        .hass=${this.hass}
        .selector=${{text:{}}}
        .label=${t}
        .helper=${a}
        .value=${((r=this.config)==null?void 0:r[e])??s}
        @value-changed=${i=>this._set(e,i.detail.value)}>
      </ha-selector>
    `}_renderTypeFields(e){const t=this.config??{};switch(e){case"smooth":{const s=t.method??"exponential";return n`
          ${this._select("method","Method",[{value:"exponential",label:"Exponential (weights recent values)"},{value:"moving_average",label:"Moving average (last N samples)"},{value:"gaussian",label:"Gaussian (bell-weighted last N samples)"}],"exponential")}
          ${s==="exponential"?n`${this._num("alpha","Alpha",.3,{mode:"slider",min:.01,max:1,step:.01})}
                <div class="help">Lower is smoother but lags more; higher follows the value closely.</div>`:n`${this._num("window","Window (samples)",10,{min:2,step:1})}`}
        `}case"scale":return n`
          <div class="row">${this._range("input_range","Input",[0,100])}</div>
          <div class="row">${this._range("output_range","Output",[0,1])}</div>
          ${this._select("curve","Curve",["linear","exponential","logarithmic","sigmoid"].map(s=>({value:s,label:s})),"linear")}
        `;case"convert_unit":{const s=t.from??"c";return n`
          <div class="row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{mode:"dropdown",options:de()}}}
              .label=${"From"}
              .value=${s}
              @value-changed=${a=>this._setUnits(a.detail.value)}>
            </ha-selector>
            ${this._select("to","To",de(he(s)),"")}
          </div>
          <div class="help">To lists the units this conversion supports from the chosen unit.</div>
        `}case"round":return n`
          <div class="row">
            ${this._num("precision","Decimal places",0,{min:0,max:10,step:1})}
            ${this._select("method","Method",[{value:"round",label:"Round (nearest)"},{value:"floor",label:"Floor (down)"},{value:"ceil",label:"Ceil (up)"}],"round")}
          </div>
        `;case"clamp":return n`
          <div class="row">${this._num("min","Minimum","")}${this._num("max","Maximum","")}</div>
          <div class="help">Leave one empty for no limit on that side.</div>
        `;case"delta":return n`
          <ha-selector .hass=${this.hass} .selector=${{boolean:{}}} .label=${"Absolute (always positive)"}
            .value=${t.absolute??false} @value-changed=${s=>this._set("absolute",s.detail.value)}></ha-selector>
          <div class="help">The change since the previous value.</div>
        `;case"rate":return n`
          <div class="row">
            ${this._select("unit","Per",[{value:"per_second",label:"Second"},{value:"per_minute",label:"Minute"},{value:"per_hour",label:"Hour"}],"per_second")}
            <ha-selector .hass=${this.hass} .selector=${{boolean:{}}} .label=${"Smooth the rate"}
              .value=${t.smoothing??false} @value-changed=${s=>this._set("smoothing",s.detail.value)}></ha-selector>
          </div>
          <div class="help">(Change in value) / (time between values). A kWh meter per hour gives kW.</div>
        `;case"statistics":return n`
          ${this._select("window","Window",[{value:"session",label:"Session (since the dashboard loaded)"},...["15m","1h","6h","12h","24h"].map(s=>({value:s,label:`Last ${s}`}))],"session",{custom_value:true})}
          <ha-selector .hass=${this.hass}
            .selector=${{select:{multiple:true,mode:"list",options:rt.map(([s,a])=>({value:s,label:a}))}}}
            .label=${"Statistics"} .value=${t.stats??["min","max","mean"]}
            @value-changed=${s=>this._set("stats",s.detail.value)}></ha-selector>
          <div class="help">A time window covers this processor's recent inputs, up to the data source's buffer (see the Timing tab). Output is an object: use <code>{source.name.mean}</code> in templates.</div>
        `;case"trend":return n`
          <div class="row">${this._num("samples","Samples",5,{min:2,step:1})}${this._num("threshold","Stable below (slope per sample)",.01,{min:0})}</div>
          <div class="help">Outputs a word (increasing, decreasing or stable), so it shows in templates, not on charts.</div>
        `;case"threshold":return n`
          ${this._num("threshold","Threshold",0)}
          <div class="row">${this._num("above","Output when above",1)}${this._num("below","Output when below",0)}</div>
          ${this._num("hysteresis","Hysteresis",0,{min:0})}
          <div class="help">A dead band of this width centred on the threshold: it switches up at threshold + hysteresis / 2 and down at threshold - hysteresis / 2.</div>
        `;case"duration":return n`
          ${this._text("condition","Condition","> 0","A comparison with a number: >, >=, <, <=, == or !=, e.g. > 20. On/off entities are 1/0.")}
          ${this._text("reset_on","Reset when (optional)","","Same form, e.g. < 15")}
          <div class="help">Outputs { duration_ms, duration_human, in_condition }; the chart shows minutes.</div>
        `;case"expression":{const s=this.processorKeys.filter(a=>a!==this.processorKey);return n`
          <ha-selector .hass=${this.hass} .selector=${{text:{multiline:true}}} .label=${"Expression"}
            .value=${t.expression??""} @value-changed=${a=>this._set("expression",a.detail.value)}></ha-selector>
          ${s.length?n`
            <ha-selector .hass=${this.hass}
              .selector=${{select:{multiple:true,mode:"list",options:s.map(a=>({value:a,label:a}))}}}
              .label=${"Sources (sources[0], sources[1], ...)"} .value=${t.sources??[]}
              @value-changed=${a=>this._set("sources",a.detail.value)}></ha-selector>
          `:y}
          <div class="help">
            One JavaScript expression (no statements). Available: <code>value</code> (<code>v</code>), <code>sources[n]</code>,
            <code>timestamp</code> (<code>t</code>), <code>entity</code>, <code>Math</code>, <code>abs</code>, <code>min</code>,
            <code>max</code>, <code>round</code>. E.g. <code>value * 1.8 + 32</code> or <code>value &gt; 20 ? 1 : 0</code>.
          </div>
        `}default:return n`<lcards-message type="warning" .message=${`Unknown processor type "${e}": edit it as YAML.`}></lcards-message>`}}_range(e,t,s){var i;const a=Array.isArray((i=this.config)==null?void 0:i[e])?this.config[e]:s,r=u((l,c)=>{const d=[...a];d[l]=c,this._set(e,d)},"set");return n`
      <ha-selector .hass=${this.hass} .selector=${{number:{mode:"box",step:"any"}}} .label=${`${t} min`}
        .value=${a[0]} @value-changed=${l=>r(0,l.detail.value)}></ha-selector>
      <ha-selector .hass=${this.hass} .selector=${{number:{mode:"box",step:"any"}}} .label=${`${t} max`}
        .value=${a[1]} @value-changed=${l=>r(1,l.detail.value)}></ha-selector>
    `}_renderYaml(){return n`
      <lcards-yaml-editor
        .hass=${this.hass}
        .value=${this._yaml}
        .schema=${at}
        cardType="processor-lab"
        @value-changed=${e=>{e.stopPropagation(),this._applyYaml(e.detail.value)}}>
      </lcards-yaml-editor>
      ${this._yamlError?n`<div class="error">${this._yamlError}</div>`:n`<div class="help">Applies a moment after you stop typing.</div>`}
    `}_toggleYaml(){this._yamlError="",this._yaml=this._yaml===null?qe(this.config??{}):null}_applyYaml(e){this._yaml=e;let t;try{t=We(e)}catch(s){this._yamlError=`YAML: ${s.message}`;return}if(!t||typeof t!="object"||!t.type){this._yamlError="A processor needs a type, e.g. type: smooth";return}this._yamlError="",this._fire("processor-change",{config:t})}_set(e,t){const s={...this.config??{}};t===""||t===null||t===void 0||Array.isArray(t)&&t.length===0&&e==="sources"?delete s[e]:s[e]=t,this._fire("processor-change",{config:s})}_setUnits(e){var a;const t=he(e),s=t.includes((a=this.config)==null?void 0:a.to)?this.config.to:t[0];this._fire("processor-change",{config:{...this.config??{},from:e,...s&&{to:s}}})}_rename(e){const t=String(e.detail.value??"").trim();if(t===this.processorKey){this._nameError="";return}if(!Ee.test(t)){this._nameError="Use lowercase letters, digits and underscores, starting with a letter or underscore.";return}if(this.processorKeys.includes(t)){this._nameError=`"${t}" is already used by another processor.`;return}this._nameError="",this._fire("processor-rename",{from:this.processorKey,to:t})}_fire(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:true,composed:true}))}};u(ee,"LCARdSProcessorForm");let q=ee;customElements.get("lcards-processor-form")||customElements.define("lcards-processor-form",q);const te=class te2 extends k{static get properties(){return{hass:{attribute:false},value:{attribute:false},previewResult:{attribute:false},label:{type:String},_selectedKey:{state:true},_adding:{state:true},_newType:{state:true},_newName:{state:true}}}constructor(){super(),this.hass=void 0,this.value={},this.previewResult=null,this.label="Processors",this._selectedKey="",this._adding=false,this._newType="smooth",this._newName=""}static get styles(){return x`
      :host {
        display: block;
        container-type: inline-size;
      }
      .errors {
        display: grid;
        gap: var(--ha-space-1);
        margin-bottom: var(--ha-space-3);
      }
      .split {
        display: grid;
        grid-template-columns: minmax(200px, 32%) 1fr;
        gap: var(--ha-space-4);
        min-height: 280px;
      }
      /* Tree above the form when the pane is narrow */
      @container (max-width: 560px) {
        .split {
          grid-template-columns: 1fr;
        }
      }
      .tree {
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        padding: var(--ha-space-2);
        align-self: start;
      }
      .tree-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ha-space-2);
        padding: var(--ha-space-1) var(--ha-space-1) var(--ha-space-2);
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .node {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        width: 100%;
        box-sizing: border-box;
        padding: var(--ha-space-2);
        padding-left: calc(var(--ha-space-2) + var(--depth, 0) * var(--ha-space-4));
        border: none;
        border-radius: var(--ha-border-radius-sm);
        background: none;
        color: var(--primary-text-color);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .node:hover {
        background: var(--secondary-background-color);
      }
      .node.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }
      .order {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: var(--ha-border-radius-circle);
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        font-size: 11px;
        font-weight: 600;
      }
      .node.selected .order {
        background: color-mix(in srgb, var(--text-primary-color) 25%, transparent);
      }
      .name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
      }
      .node-type {
        flex: none;
        font-size: 12px;
        opacity: 0.8;
      }
      .empty {
        padding: var(--ha-space-4) var(--ha-space-2);
        color: var(--secondary-text-color);
        font-size: 13px;
        text-align: center;
      }
      .add {
        display: grid;
        gap: var(--ha-space-2);
        padding: var(--ha-space-2);
        margin-bottom: var(--ha-space-2);
        border-radius: var(--ha-border-radius-sm);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 50%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }
      .add-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--ha-space-2);
      }
      .add-help {
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .detail-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        color: var(--secondary-text-color);
        text-align: center;
      }
    `}get _structure(){return Ce({processing:this.value??{}},[])}willUpdate(e){if(e.has("value")){const t=Object.keys(this.value??{});t.includes(this._selectedKey)||(this._selectedKey=t[0]??"")}}updated(e){e.has("_selectedKey")&&this.dispatchEvent(new CustomEvent("processor-selected",{detail:{key:this._selectedKey},bubbles:true,composed:true}))}render(){var l,c;const e=this.value??{},t=Object.keys(e),s=this._structure,a=(((l=this.previewResult)==null?void 0:l.errors)??[]).filter(d=>!s.errors.includes(d)),r=[...s.errors,...a],i=Object.fromEntries((((c=this.previewResult)==null?void 0:c.latest)??[]).map(d=>[d.key,d.value]));return n`
      ${r.length?n`
        <div class="errors">
          ${r.map(d=>n`<lcards-message type="error" .message=${d}></lcards-message>`)}
        </div>
      `:y}

      <div class="split">
        <div class="tree">
          <div class="tree-head">
            <span>${this.label} (${t.length})</span>
            ${this._adding?y:n`
              <ha-button appearance="filled" variant="brand" size="s" @click=${this._startAdd}>
                <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                Add
              </ha-button>
            `}
          </div>
          ${this._adding?this._renderAdd(e):y}
          ${t.length?this._renderTree(e,s.order):this._adding?y:n`
            <div class="empty">No processors yet. Add one to smooth, convert, scale or analyse the values.</div>
          `}
        </div>

        <div class="detail">
          ${this._selectedKey&&e[this._selectedKey]?n`
            <lcards-processor-form
              .hass=${this.hass}
              .processorKey=${this._selectedKey}
              .config=${e[this._selectedKey]}
              .processorKeys=${t}
              .latestValue=${i[this._selectedKey]??""}
              @processor-change=${this._onChange}
              @processor-rename=${this._onRename}
              @processor-duplicate=${this._onDuplicate}
              @processor-delete=${this._onDelete}>
            </lcards-processor-form>
          `:n`<div class="detail-empty">${t.length?"Select a processor to edit it.":"Its settings will appear here."}</div>`}
        </div>
      </div>
    `}_renderTree(e,t){var d;const s=Object.keys(e),a=new Map(s.map(h=>[h,[]])),r=[];for(const h of s){const f=(d=e[h])==null?void 0:d.input_source,g=f&&f!==h?a.get(f):void 0;g?g.push(h):r.push(h)}const i=new Set,l=[],c=u((h,f)=>{if(!i.has(h)){i.add(h),l.push({key:h,depth:f});for(const g of a.get(h)??[])c(g,f+1)}},"walk");return r.forEach(h=>c(h,0)),s.filter(h=>!i.has(h)).forEach(h=>c(h,0)),l.map(({key:h,depth:f})=>{var v,p;const g=t.indexOf(h),_=(v=e[h])==null?void 0:v.type;return n`
        <button type="button" class="node ${h===this._selectedKey?"selected":""}" style="--depth: ${f}"
          @click=${()=>{this._selectedKey=h}}>
          <span class="order">${g>=0?g+1:"!"}</span>
          <span class="name">${h}</span>
          <span class="node-type">${((p=z(_))==null?void 0:p.label)??_}</span>
        </button>
      `})}_renderAdd(e){var a;const t=this._newName||ue(e,this._newType),s=Ee.test(t)?e[t]?`"${t}" is already used.`:"":"Lowercase letters, digits and underscores, starting with a letter or underscore.";return n`
      <div class="add">
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:Se.map(r=>({value:r.type,label:r.label}))}}}
          .label=${"Type"}
          .required=${false}
          .value=${this._newType}
          @value-changed=${r=>{this._newType=r.detail.value||"smooth",this._newName=""}}>
        </ha-selector>
        <div class="add-help">${((a=z(this._newType))==null?void 0:a.description)??""}</div>
        <ha-selector
          .hass=${this.hass}
          .selector=${{text:{}}}
          .label=${"Name"}
          .value=${t}
          @value-changed=${r=>{this._newName=String(r.detail.value??"").trim()}}>
        </ha-selector>
        ${s?n`<div class="add-help" style="color: var(--error-color)">${s}</div>`:n`<div class="add-help">It starts on the raw entity value; pick another processor as its Input to chain them.</div>`}
        <div class="add-actions">
          <ha-button appearance="plain" size="s" @click=${()=>{this._adding=false}}>Cancel</ha-button>
          <ha-button variant="brand" size="s" .disabled=${!!s} @click=${()=>this._add(t)}>Create</ha-button>
        </div>
      </div>
    `}_startAdd(){this._adding=true,this._newType="smooth",this._newName=""}_add(e){const t=z(this._newType);this._emit({...this.value??{},[e]:{type:this._newType,...structuredClone((t==null?void 0:t.defaults)??{})}}),this._adding=false,this._selectedKey=e}_onChange(e){e.stopPropagation(),this._emit({...this.value??{},[this._selectedKey]:e.detail.config})}_onRename(e){e.stopPropagation();const{from:t,to:s}=e.detail,a=st(this.value??{},t,s);a!==this.value&&(this._selectedKey=s,this._emit(a))}_onDuplicate(e){e.stopPropagation();const t=e.detail.key,s=ue(this.value,t);this._emit({...this.value??{},[s]:structuredClone(this.value[t])}),this._selectedKey=s}async _onDelete(e){e.stopPropagation();const t=e.detail.key,s=Object.entries(this.value??{}).filter(([r,i])=>r!==t&&(i.input_source===t||Array.isArray(i.sources)&&i.sources.includes(t))).map(([r])=>r);if(s.length&&!await ge({title:`Delete ${t}?`,message:`${s.join(", ")} ${s.length>1?"use":"uses"} it as input. ${s.length>1?"They switch":"It switches"} to the raw value.`}))return;const a={};for(const[r,i]of Object.entries(this.value??{})){if(r===t)continue;const l={...i};l.input_source===t&&delete l.input_source,Array.isArray(l.sources)&&(l.sources=l.sources.filter(c=>c!==t)),a[r]=l}this._emit(a)}_emit(e){this.dispatchEvent(new CustomEvent("change",{detail:{value:e},bubbles:true,composed:true}))}};u(te,"LCARdSProcessorTreeEditor");let W=te;customElements.get("lcards-processor-tree-editor")||customElements.define("lcards-processor-tree-editor",W);const Te=["#ff9966","#99ccff","#ffcc66","#cc99ff","#66cc99","#ff6666","#9999ff","#ffaacc"];function it(o){if(!Number.isFinite(o))return"";const e=Math.abs(o);return e>=100?o.toFixed(0):e>=1?o.toFixed(1):e===0?"0":o.toPrecision(2)}u(it,"formatAxisValue");function ot(o){return String(o).replace(/ \(min\)$/,"").replace(/\.[a-z_]+$/,"")}u(ot,"seriesProcessorKey");function nt(o,{colors:e=Te,rawColor:t="#8a8a99",textColor:s="#cfcfd8",gridColor:a="#333",selected:r=null,height:i=260,mode:l="dark"}={}){var _;const d=(o.length?o:[{name:"raw",points:[],axis:0,raw:true}]).map((v,p)=>({...v,color:v.raw?t:e[(p-1)%e.length]})),h=(_=d.find(v=>v.axis===1))==null?void 0:_.name,f=u(v=>!v.raw&&r&&ot(v.name)===r,"isSelected"),g=u(v=>v.raw?1.5:f(v)?3.5:r?1.5:2.5,"width");return{chart:{type:"line",height:i,background:"transparent",foreColor:s,animations:{enabled:false},toolbar:{show:false},zoom:{enabled:false}},theme:{mode:l},series:d.map(v=>({name:v.name,data:v.points.map(p=>[p.t,p.v])})),colors:d.map(v=>v.color),stroke:{width:d.map(g),curve:"straight",dashArray:d.map(v=>v.raw?3:0)},xaxis:{type:"datetime",labels:{datetimeUTC:false}},yaxis:d.map((v,p)=>({seriesName:v.axis===1?h:"raw",opposite:v.axis===1,show:p===0||v.name===h,labels:{formatter:it}})),legend:{show:true,position:"top",horizontalAlign:"left"},grid:{borderColor:a},tooltip:{theme:l,x:{format:"HH:mm"}}}}u(nt,"processorPreviewChartOptions");const K=new Map,lt=5*6e4,ct={statistics:"hourly long-term statistics",history:"state history",rest:"state history",none:"no history"},R=[[1,"1 h"],[6,"6 h"],[12,"12 h"],[24,"24 h"],[48,"48 h"],[168,"7 days"]],dt=["--lcars-orange","--lcars-blue","--lcars-yellow","--lcars-violet","--lcars-green","--lcars-red","--lcars-lilac","--lcars-african-violet"],se=class se2 extends k{static get properties(){return{hass:{attribute:false},entry:{attribute:false},selectedKey:{type:String},showErrors:{type:Boolean},_span:{state:true},_status:{state:true},_result:{state:true},_history:{state:true}}}constructor(){super(),this.hass=void 0,this.entry={},this.selectedKey="",this.showErrors=true,this._span=null,this._status="empty",this._result=null,this._history=null,this._chart=null,this._timer=null,this._historyKey="",this._run=0}static get styles(){return x`
      :host {
        display: block;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-1);
      }
      .title {
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .meta {
        flex: 1;
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .span {
        width: 170px;
      }
      .panel {
        position: relative;
        min-height: 200px;
        padding: var(--ha-space-2);
        border-radius: var(--ha-border-radius-md);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 50%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }
      .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-2);
        color: var(--secondary-text-color);
        font-size: 13px;
      }
      .messages {
        display: grid;
        gap: var(--ha-space-1);
        margin-top: var(--ha-space-2);
      }
      .caveat {
        margin-top: var(--ha-space-1);
        font-size: 12px;
        color: var(--secondary-text-color);
      }
    `}render(){var a,r;const e=this._history,t=(a=this.entry)==null?void 0:a.entity,s=this.showErrors||this._status==="error"?((r=this._result)==null?void 0:r.errors)??[]:[];return n`
      <div class="head">
        <span class="title">Preview</span>
        <span class="meta">${e&&t?`${t} · ${e.points.length} points from ${ct[e.method]??e.method}`:""}</span>
        <ha-selector
          class="span"
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:this._spans().map(([i,l])=>({value:String(i),label:`Last ${l}`}))}}}
          .label=${"Preview span"}
          .required=${false}
          .value=${String(this._hours())}
          @value-changed=${i=>{i.detail.value&&(this._span=Number(i.detail.value),this._schedule())}}>
        </ha-selector>
      </div>
      <div class="panel">
        <div class="chart"></div>
        ${this._status==="empty"?n`<div class="overlay">Choose an entity on the Source tab to preview its history.</div>`:y}
        ${this._status==="loading"?n`<div class="overlay"><ha-spinner size="small"></ha-spinner>Loading history...</div>`:y}
        ${this._status==="ready"&&!(e!=null&&e.points.length)?n`<div class="overlay">${this._noPointsText()}</div>`:y}
      </div>
      ${s.length||e!=null&&e.previewOnly?n`
        <div class="messages">
          ${s.map(i=>n`<lcards-message type="error" .message=${i}></lcards-message>`)}
          ${e!=null&&e.previewOnly?n`<lcards-message type="info"
            .message=${"History preload is off for this data source, so on a dashboard it starts empty and fills as values arrive. The preview still loads history to show the processors."}></lcards-message>`:y}
        </div>
      `:y}
      <div class="caveat">
        The real processors, run over this history in order. A data source keeps its last
        ${this._capacityText()} points; between state changes, live-only behaviour (such as a duration's ticking) isn't shown.
      </div>
    `}_hours(){return this._span??A(this.entry??{}).hours}_noPointsText(){var s,a,r,i,l,c,d;const e=(s=this.entry)==null?void 0:s.entity,t=(i=(r=(a=this.hass)==null?void 0:a.states)==null?void 0:r[e])==null?void 0:i.state;return t!==void 0&&!Number.isFinite(parseFloat(t))&&!((l=this.entry)!=null&&l.enum_mapping)&&!((c=this.entry)!=null&&c.attribute)?`No numeric history for ${e} (state "${t}"). Map text states to numbers with enum_mapping on the YAML tab.`:`No history recorded for ${e} in the last ${((d=this._history)==null?void 0:d.hours)??be} hours.`}_spans(){const e=A(this.entry??{}).hours;return R.some(([s])=>s===e)?R:[...R,[e,`${e} h`]].sort((s,a)=>s[0]-a[0])}_capacityText(){var t;const e=Number((t=this.entry)==null?void 0:t.window_seconds);return String(Math.min(1e3,Math.max(60,Math.floor((Number.isFinite(e)&&e>0?e:60)*10))))}updated(e){(e.has("entry")||e.has("selectedKey")||e.has("hass")&&!this._history)&&this._schedule()}disconnectedCallback(){var e;super.disconnectedCallback(),clearTimeout(this._timer??void 0),(e=this._chart)==null||e.destroy(),this._chart=null}_schedule(){clearTimeout(this._timer??void 0),this._timer=setTimeout(()=>this._refresh(),300)}async _refresh(){var l;const e=this.entry??{};if(!e.entity||!this.hass){this._status="empty",this._result=null;return}const t=++this._run,s=A(e),a=this._hours(),r=JSON.stringify([e.entity,e.attribute??"",e.attribute_path??"",e.enum_mapping??null,a]);if(r!==this._historyKey||!this._history){this._status="loading";try{const{points:c,method:d}=await this._fetchHistory(r,e,a);if(t!==this._run)return;this._historyKey=r,this._history={points:c,method:d,hours:a,previewOnly:!s.enabled}}catch(c){if(w.warn("[ProcessorPreview] History fetch failed:",c),t!==this._run)return;this._status="error",this._result={errors:[`Could not load history: ${c.message}`]};return}}else this._history={...this._history,previewOnly:!s.enabled};if(!this.isConnected)return;const i=Ce(e,this._history.points,{entityState:((l=this.hass.states)==null?void 0:l[e.entity])??null});this._result=i,this._status="ready",this.dispatchEvent(new CustomEvent("preview-result",{detail:{...i,hours:this._history.hours},bubbles:true,composed:true})),await this.updateComplete,await this._draw(i.series)}_fetchHistory(e,t,s){const a=K.get(e);if(a&&Date.now()-a.at<lt)return a.promise;const r=Be(this.hass,t,{hours:s});return K.set(e,{at:Date.now(),promise:r}),r.catch(()=>K.delete(e)),r}_themeColors(){var s,a;const e=getComputedStyle(this),t=u((r,i)=>e.getPropertyValue(r).trim()||i,"read");return{colors:dt.map((r,i)=>t(r,Te[i])),rawColor:t("--primary-text-color","#cfcfd8"),textColor:t("--primary-text-color","#cfcfd8"),gridColor:t("--divider-color","#333"),mode:((a=(s=this.hass)==null?void 0:s.themes)==null?void 0:a.darkMode)===false?"light":"dark"}}async _draw(e){var a;const t=this.renderRoot.querySelector(".chart");if(!t)return;const s=nt(e,{...this._themeColors(),selected:this.selectedKey||null,height:240});try{const r=(await import("./apexcharts.esm-Dl8NxLZF.js")).default;if(!this.isConnected||!t.isConnected)return;(a=this._chart)==null||a.destroy(),this._chart=new r(t,s),await this._chart.render()}catch(r){this.isConnected&&w.error("[ProcessorPreview] Chart failed:",r)}}};u(se,"LCARdSProcessorPreview");let L=se;customElements.get("lcards-processor-preview")||customElements.define("lcards-processor-preview",L);function ht(o,e){return o||String(e??"").split(".").pop().replace(/[^a-z0-9_]/gi,"_")||"source"}u(ht,"sourceName");function ut(o,e,{name:t,hours:s}={}){var f,g,_,v;if(!(o!=null&&o.entity)||!(e!=null&&e.length))return null;const a=ht(t,o.entity),r=s??((f=o.history)==null?void 0:f.hours)??24,i={...o.processing??{}},l=[],c=e.some(p=>p.axis===1),d=[];for(const p of e){const $=p.raw?{datasource:a,name:"Raw",stroke_dash:4}:{datasource:a};if(!p.raw){const C=/^(.+)\.([a-z_]+)$/.exec(p.name),T=/^(.+) \(min\)$/.exec(p.name);let m=p.name;C&&((g=i[C[1]])==null?void 0:g.type)==="statistics"?(m=`${C[1]}_${C[2]}`,i[m]={type:"expression",sources:[C[1]],expression:`sources[0] ? sources[0].${C[2]} : null`},l.push(m)):T&&((_=i[T[1]])==null?void 0:_.type)==="duration"&&(m=`${T[1]}_minutes`,i[m]={type:"expression",sources:[T[1]],expression:"sources[0] ? sources[0].duration_ms / 60000 : null"},l.push(m)),$.buffer=m,$.name=p.name}c&&p.axis===1&&($.yaxis_id="second"),d.push($)}const h={type:"custom:lcards-chart",graph_span:`${r}h`,data_sources:{[a]:{entity:o.entity,history:((v=o.history)==null?void 0:v.enabled)===false?o.history:{...o.history??{},hours:r},...Object.fromEntries(Object.entries(o).filter(([p])=>!["entity","history","processing"].includes(p))),processing:i}},sources:d};return c&&(h.yaxis=[{id:"main"},{id:"second",opposite:true}]),{chart:h,helpers:l}}u(ut,"processorChartConfig");function pt(o,e,t={}){const s=ut(o,e,t);return s?(s.helpers.length?`# Added for the chart (a series plots numbers): ${s.helpers.join(", ")}
`:"")+je.dump(s.chart,{lineWidth:120,noRefs:true,flowLevel:-1}):""}u(pt,"processorChartYaml");const ft=[{id:"basic",icon:"mdi:database",label:"Source"},{id:"timing",icon:"mdi:history",label:"History & Timing"},{id:"transform",icon:"mdi:function-variant",label:"Processing"},{id:"advanced",icon:"mdi:cog",label:"Advanced"},{id:"yaml",icon:"mdi:code-braces",label:"YAML"}],ae=class ae2 extends k{static get properties(){return{hass:{type:Object},mode:{type:String},sourceName:{type:String},sourceConfig:{type:Object},cardConfig:{type:Object},open:{type:Boolean},_activeTab:{type:String,state:true},_name:{type:String,state:true},_workingConfig:{type:Object,state:true},_validationErrors:{type:Array,state:true},_showErrors:{type:Boolean,state:true},_selectedProcessor:{type:String,state:true},_preview:{state:true},_copied:{type:Boolean,state:true}}}constructor(){super(),this.hass=null,this.mode="add",this.sourceName="",this.sourceConfig=null,this.cardConfig=null,this.open=false,this._activeTab="basic",this._name="",this._workingConfig={},this._validationErrors=[],this._showErrors=false,this._selectedProcessor="",this._preview=null,this._copied=false}static get styles(){return[$e,ye,N,x`
                :host {
                    display: block;
                }

                /* Config | preview, as in the chart studio */
                .studio-layout {
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
                }

                .validation-errors {
                    display: grid;
                    gap: var(--ha-space-1);
                    padding: var(--ha-space-3) var(--ha-space-4) 0;
                }

                .tab-content lcards-form-section {
                    display: block;
                    margin-bottom: var(--ha-space-4);
                }

                .grid-2col {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--ha-space-3);
                }

                @media (max-width: 600px) {
                    .grid-2col {
                        grid-template-columns: 1fr;
                    }
                }

                ha-selector {
                    display: block;
                    margin-bottom: var(--ha-space-3);
                }

                .tab-hint {
                    margin: 0 0 var(--ha-space-3);
                }

                .tab-hint a,
                .hint a {
                    color: var(--primary-color);
                }

                /* Preview pane */
                .preview-panel {
                    overflow-y: auto;
                    padding: var(--ha-space-4);
                    gap: var(--ha-space-4);
                }

                .chart-yaml summary {
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--primary-text-color);
                }

                .chart-yaml-body {
                    display: grid;
                    gap: var(--ha-space-2);
                    margin-top: var(--ha-space-2);
                }

                .chart-yaml-actions {
                    display: flex;
                    align-items: center;
                    gap: var(--ha-space-2);
                }

                ha-code-editor.chart-yaml-code {
                    display: block;
                    border: var(--ha-border-width-sm) solid var(--divider-color);
                    border-radius: var(--ha-border-radius-md);
                    overflow: hidden;
                    max-height: 320px;
                    overflow-y: auto;
                }
            `]}willUpdate(e){e.has("open")&&this.open&&this._resetForm()}render(){if(!this.open)return n``;const e=this._showErrors?this._validationErrors:[];return n`
            <ha-dialog
                open
                flexcontent
                @closed=${this._handleDialogClosed}
                header-title=${this.mode==="add"?"Add Data Source":`Edit Data Source: ${this.sourceName}`}>

                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                                ${ft.map(t=>n`
                                    <ha-tab-group-tab value=${t.id} ?active=${this._activeTab===t.id}>
                                        <ha-icon icon=${t.icon}></ha-icon>
                                        ${t.label}
                                    </ha-tab-group-tab>
                                `)}
                            </ha-tab-group>

                            ${e.length?n`
                                <div class="validation-errors">
                                    ${e.map(t=>n`<lcards-message type="error" .message=${t}></lcards-message>`)}
                                </div>
                            `:y}

                            <div class="tab-content" @click=${this._handleContentClick}>
                                ${this._renderTab()}
                            </div>
                        </div>

                        <div class="preview-panel">
                            ${this._renderPreview()}
                        </div>
                    </div>
                </div>

                <div slot="footer">
                    <ha-button appearance="plain" @click=${this._handleCancel}>Cancel</ha-button>
                    <ha-button variant="brand" @click=${this._handleSave} .disabled=${!this._isValid()}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        ${this.mode==="add"?"Create":"Save"}
                    </ha-button>
                </div>
            </ha-dialog>
        `}_renderTab(){switch(this._activeTab){case"timing":return this._renderTimingTab();case"transform":return this._renderTransformTab();case"advanced":return this._renderAdvancedTab();case"yaml":return n`
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${this._workingConfig}
                    .schema=${ve.additionalProperties}
                    cardType="datasource"
                    note="This data source as YAML (its name is on the Source tab)."
                    @yaml-config-changed=${e=>{this._workingConfig=e.detail.config,this._validate()}}>
                </lcards-studio-yaml-tab>
            `;default:return this._renderBasicTab()}}_renderPreview(){var t,s,a;const e=(s=(t=this._preview)==null?void 0:t.series)!=null&&s.length&&!((a=this._preview.errors)!=null&&a.length)?pt(this._workingConfig,this._preview.series,{name:this._name||void 0,hours:this._preview.hours}):"";return n`
            <lcards-processor-preview
                .hass=${this.hass}
                .entry=${this._workingConfig}
                .selectedKey=${this._activeTab==="transform"?this._selectedProcessor:""}
                .showErrors=${this._activeTab!=="transform"}
                @preview-result=${r=>{r.stopPropagation(),this._preview=r.detail}}>
            </lcards-processor-preview>

            ${e?n`
                <details class="chart-yaml">
                    <summary>Use in a chart</summary>
                    <div class="chart-yaml-body">
                        <div class="hint">An lcards-chart card that plots this data source the way the preview does.</div>
                        <div class="chart-yaml-actions">
                            <ha-button size="s" @click=${()=>this._copyChart(e)}>
                                <ha-icon icon=${this._copied?"mdi:check":"mdi:content-copy"} slot="start"></ha-icon>
                                ${this._copied?"Copied":"Copy chart YAML"}
                            </ha-button>
                        </div>
                        <ha-code-editor class="chart-yaml-code" mode="yaml" read-only .value=${e}></ha-code-editor>
                    </div>
                </details>
            `:y}
        `}async _copyChart(e){await _e(e),this._copied=true,setTimeout(()=>{this._copied=false},1500)}_renderBasicTab(){return n`
            <lcards-form-section header="Source" icon="mdi:database" ?expanded=${true} noCollapse
                description="What to track. The name is how cards and templates refer to it, e.g. {ds:name}.">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{text:{}}}
                    .value=${this._name}
                    .label=${"Name"}
                    .helper=${"Lowercase letters, digits and underscores, e.g. living_room_temp"}
                    .disabled=${this.mode==="edit"}
                    .required=${true}
                    @value-changed=${e=>{this._name=e.detail.value,this._showErrors=true,this._validate()}}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{entity:{}}}
                    .value=${this._workingConfig.entity||""}
                    .label=${"Entity"}
                    .required=${true}
                    @value-changed=${e=>this._updateConfig("entity",e.detail.value)}>
                </ha-selector>

                ${this._workingConfig.entity?n`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{mode:"dropdown",options:this._getAttributeOptions(this._workingConfig.entity)}}}
                        .value=${this._workingConfig.attribute||"__state__"}
                        .label=${"Attribute"}
                        .helper=${"Track the state, or one of its attributes"}
                        .required=${false}
                        @value-changed=${e=>this._setAttribute(e.detail.value)}>
                    </ha-selector>
                `:y}
            </lcards-form-section>
        `}_renderTimingTab(){const e=A(this._workingConfig);return n`
            <lcards-form-section header="History" icon="mdi:history" ?expanded=${true} noCollapse
                description="Recent history loaded from Home Assistant when the data source starts, so charts aren't empty.">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{boolean:{}}}
                    .value=${e.enabled}
                    .label=${"Preload history"}
                    @value-changed=${t=>this._setHistory({enabled:t.detail.value})}>
                </ha-selector>
                ${e.enabled?n`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:1,max:168,mode:"box",unit_of_measurement:"h"}}}
                        .value=${e.hours}
                        .label=${"Hours to load"}
                        .helper=${`1 to 168 (default ${be}). Every recorded change; hourly statistics fill in when none are recorded.`}
                        @value-changed=${t=>this._setHistory({hours:t.detail.value})}>
                    </ha-selector>
                `:y}
            </lcards-form-section>

            <lcards-form-section header="Buffer and updates" icon="mdi:timer-outline" ?expanded=${true} noCollapse
                description="How many points the data source keeps, and how often it updates cards.">
                <div class="grid-2col">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:1,max:3600,mode:"box",unit_of_measurement:"s"}}}
                        .value=${this._workingConfig.window_seconds||60}
                        .label=${"Window"}
                        .helper=${`Keeps about 10 points per second of window (now ${pe(this._workingConfig).capacity}). Charts and window-based processors see only these.`}
                        @value-changed=${t=>this._updateConfig("window_seconds",t.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:10,max:5e3,mode:"box",unit_of_measurement:"ms"}}}
                        .value=${this._workingConfig.min_emit_ms||100}
                        .label=${"Update rate"}
                        .helper=${"Minimum time between card updates"}
                        @value-changed=${t=>this._updateConfig("min_emit_ms",t.detail.value)}>
                    </ha-selector>
                </div>
            </lcards-form-section>
        `}_renderTransformTab(){return n`
            <p class="hint tab-hint">
                Smooth, convert or analyse the values. Chain processors by picking another one as a processor's Input.
                <a href=${fe(me.processors)} target="_blank" rel="noreferrer">Processor reference</a>
            </p>
            <lcards-processor-tree-editor
                .value=${this._workingConfig.processing||{}}
                .hass=${this.hass}
                .previewResult=${this._preview}
                @change=${this._handleProcessingChange}
                @processor-selected=${e=>{this._selectedProcessor=e.detail.key}}
                label="Processors">
            </lcards-processor-tree-editor>
        `}_renderAdvancedTab(){return n`
            <lcards-form-section header="Rate control" icon="mdi:timer-sand" ?expanded=${true} noCollapse
                description="Merge rapid changes into fewer updates. The defaults suit most sensors.">
                <div class="grid-2col">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:1e3,mode:"box",unit_of_measurement:"ms"}}}
                        .value=${this._workingConfig.coalesce_ms||0}
                        .label=${"Coalesce"}
                        .helper=${"Merge changes within this time (0: off)"}
                        @value-changed=${e=>this._updateConfig("coalesce_ms",e.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:1e4,mode:"box",unit_of_measurement:"ms"}}}
                        .value=${this._workingConfig.max_delay_ms||0}
                        .label=${"Max delay"}
                        .helper=${"Longest a merged update may wait (0: no limit)"}
                        @value-changed=${e=>this._updateConfig("max_delay_ms",e.detail.value)}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section header="Behaviour" icon="mdi:cog" ?expanded=${true} noCollapse>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{boolean:{}}}
                    .value=${this._workingConfig.emit_on_same_value??true}
                    .label=${"Update when the value is unchanged"}
                    @value-changed=${e=>this._updateConfig("emit_on_same_value",e.detail.value)}>
                </ha-selector>
            </lcards-form-section>
        `}_handleTabChange(e){var s;e.stopPropagation();const t=(s=e.target.activeTab)==null?void 0:s.getAttribute("value");t&&(this._activeTab=t)}_handleContentClick(e){e.type==="closed"&&e.stopPropagation()}_handleDialogClosed(e){e.stopPropagation(),e.target.tagName==="HA-DIALOG"&&(this.open=false,this.dispatchEvent(new CustomEvent("cancel",{bubbles:true,composed:true})))}_resetForm(){this._activeTab="basic",this._name=this.sourceName||"",this._validationErrors=[],this._showErrors=false,this.sourceConfig?this._workingConfig=JSON.parse(JSON.stringify(this.sourceConfig)):this._workingConfig={entity:"",window_seconds:60,min_emit_ms:100,emit_on_same_value:true,coalesce_ms:0,max_delay_ms:0},w.debug("[DataSourceStudio] Form reset:",{mode:this.mode,name:this._name,config:this._workingConfig})}_updateConfig(e,t){const s=e.split("."),a=JSON.parse(JSON.stringify(this._workingConfig));let r=a;for(let i=0;i<s.length-1;i++){const l=s[i];r[l]||(r[l]={}),r=r[l]}r[s[s.length-1]]=t,this._workingConfig=a,this._showErrors=true,this._validate(),w.debug("[DataSourceStudio] Config updated:",{path:e,value:t})}_setAttribute(e){const t={...this._workingConfig};!e||e==="__state__"?delete t.attribute:t.attribute=e,this._workingConfig=t,this._showErrors=true,this._validate()}_setHistory(e){this._workingConfig=oe(this._workingConfig,e),this._showErrors=true,this._validate()}_handleProcessingChange(e){const t=e.detail.value,s=JSON.parse(JSON.stringify(this._workingConfig));Object.keys(t).length===0?delete s.processing:s.processing=t,this._workingConfig=s}_validate(){return this._validationErrors=this._errors(),this._validationErrors.length===0}_errors(){const e=[];return!this._name||this._name.trim()===""?e.push("DataSource name is required"):/^[a-z_][a-z0-9_]*$/.test(this._name)?this.mode==="add"&&this._isNameAlreadyDefined(this._name)&&e.push(`DataSource "${this._name}" already exists. Choose a different name.`):e.push("Name must start with lowercase letter or underscore, and contain only lowercase letters, numbers, and underscores"),(!this._workingConfig.entity||this._workingConfig.entity.trim()==="")&&e.push("Entity is required"),e}_isNameAlreadyDefined(e){var s,a,r,i;if((s=this.cardConfig)!=null&&s.data_sources&&this.cardConfig.data_sources[e])return true;const t=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.dataSourceManager;return!!((i=t==null?void 0:t.sources)!=null&&i.has(e))}_isValid(){return this._errors().length===0}_handleSave(){if(this._showErrors=true,!this._validate()){w.warn("[DataSourceStudio] Validation failed:",this._validationErrors);return}const e=JSON.parse(JSON.stringify(this._workingConfig));(!e.attribute||e.attribute==="__state__")&&delete e.attribute;const{history:t}=oe(e,{});t?e.history=t:delete e.history,e.coalesce_ms===0&&delete e.coalesce_ms,e.max_delay_ms===0&&delete e.max_delay_ms,e.processing&&Object.keys(e.processing).length===0&&delete e.processing,w.info("[DataSourceStudio] Saving DataSource:",{name:this._name,config:e}),this.dispatchEvent(new CustomEvent("save",{detail:{name:this._name,config:e},bubbles:true,composed:true})),this.open=false}_handleCancel(){this.open=false,this.dispatchEvent(new CustomEvent("cancel",{bubbles:true,composed:true}))}_getAttributeOptions(e){if(!e||!this.hass)return[{value:"__state__",label:"State"}];const t=this.hass.states[e];if(!t)return[{value:"__state__",label:"State"}];const s=[{value:"__state__",label:"State"}];return t.attributes&&Object.keys(t.attributes).forEach(a=>{s.push({value:a,label:a.replace(/_/g," ").replace(/\b\w/g,r=>r.toUpperCase())})}),s}};u(ae,"LCARdSDataSourceStudioDialog");let Y=ae;customElements.get("lcards-datasource-studio-dialog")||customElements.define("lcards-datasource-studio-dialog",Y);const re=class re2 extends k{static get properties(){return{hass:{type:Object},cardConfig:{type:Object},open:{type:Boolean},_selectedNode:{type:Object,state:true},_expandedNodes:{state:true,attribute:false},_treeData:{type:Array,state:true},_subscriptions:{state:true,attribute:false}}}constructor(){super(),this.hass,this.cardConfig,this.open=false,this._selectedNode=null,this._expandedNodes=new Set,this._treeData=[],this._subscriptions=new Map}updated(e){super.updated(e),e.has("open")&&this.open&&(this._buildTreeData(),this._subscribeToDataSources()),e.has("open")&&!this.open&&this._unsubscribeAll()}selectDataSource(e){const t=this._treeData.find(s=>s.label===e);t?(this._selectedNode=t,this._expandedNodes.add(t.id),this.requestUpdate()):w.warn(`[DataSourceBrowser] DataSource "${e}" not found in tree`)}_handleClose(){this._unsubscribeAll(),this.dispatchEvent(new CustomEvent("close"))}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeAll()}_buildTreeData(){var a,r;const e=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.dataSourceManager;if(!e){w.warn("[DataSourceBrowser] DataSourceManager not available"),this._treeData=[];return}const t=[];(e.sources||new Map).forEach((i,l)=>{var h;const c={id:`ds_${l}`,type:"datasource",label:l,icon:"mdi:database",data:i,children:[]};if((h=i.cfg)!=null&&h.entity&&c.children.push({id:`${c.id}_entity`,type:"entity",label:i.cfg.entity,icon:"mdi:home-assistant",data:{entityId:i.cfg.entity},children:[]}),i.processorManager&&i.processorManager.processors.size>0){const f={id:`${c.id}_processors`,type:"processors",label:`Processors (${i.processorManager.processors.size})`,icon:"mdi:cog-outline",data:Array.from(i.processorManager.processors.entries()),children:[]};let g=0;i.processorManager.processors.forEach((_,v)=>{f.children.push({id:`${c.id}_processor_${g}`,type:"processor",label:`${v} (${_.config.type})`,icon:"mdi:function-variant",data:{key:v,processor:_,type:_.config.type},children:[]}),g++}),c.children.push(f)}const d={id:`${c.id}_buffers`,type:"buffers",label:"Buffers",icon:"mdi:database-outline",data:{},children:[]};i.buffer&&d.children.push({id:`${c.id}_buffer_main`,type:"buffer",label:`Main Buffer (${i.buffer.size()} values)`,icon:"mdi:database-outline",data:{buffer:i.buffer,bufferType:"main"},children:[]}),i.processorManager&&i.processorManager.processorBuffers.size>0&&i.processorManager.processorBuffers.forEach((f,g)=>{d.children.push({id:`${c.id}_buffer_${g}`,type:"buffer",label:`${g} Buffer (${f.size()} values)`,icon:"mdi:database-outline",data:{buffer:f,bufferType:g},children:[]})}),d.children.length>0&&c.children.push(d),t.push(c)}),this._treeData=t,w.debug("[DataSourceBrowser] Tree data built",{nodeCount:t.length})}_subscribeToDataSources(){var s,a;const e=(a=(s=window.lcards)==null?void 0:s.core)==null?void 0:a.dataSourceManager;if(!e)return;(e.sources||new Map).forEach((r,i)=>{if(r.subscribe){const l=r.subscribe(()=>{this.requestUpdate()});this._subscriptions.set(i,l)}}),w.debug("[DataSourceBrowser] Subscribed to datasources",{count:this._subscriptions.size})}_unsubscribeAll(){this._subscriptions.forEach(e=>{typeof e=="function"&&e()}),this._subscriptions.clear()}_toggleNode(e){this._expandedNodes.has(e)?this._expandedNodes.delete(e):this._expandedNodes.add(e),this.requestUpdate()}_selectNode(e){this._selectedNode=e,this.requestUpdate()}_renderTreeNodes(e,t=0){return e.map(s=>{var a;return n`
      <div class="tree-node" style="--node-level: ${t}">
        <div
          class="tree-node-content ${((a=this._selectedNode)==null?void 0:a.id)===s.id?"selected":""}"
          @click=${()=>this._selectNode(s)}>
          <span
            class="tree-expander ${s.children.length===0?"leaf":""} ${this._expandedNodes.has(s.id)?"expanded":""}"
            @click=${r=>{r.stopPropagation(),s.children.length>0&&this._toggleNode(s.id)}}>
            ${s.children.length>0?this._expandedNodes.has(s.id)?"▼":"▶":""}
          </span>
          <ha-icon icon="${s.icon}"></ha-icon>
          <span class="node-label">${s.label}</span>
        </div>
        ${this._expandedNodes.has(s.id)&&s.children.length>0?n`<div class="tree-node-children">${this._renderTreeNodes(s.children,t+1)}</div>`:""}
      </div>
    `})}_renderNodeDetail(){if(!this._selectedNode)return n`
        <div class="detail-panel-empty">
          <ha-icon icon="mdi:cursor-pointer"></ha-icon>
          <p>Select a data source, entity, processor or buffer on the left.</p>
        </div>
      `;const{type:e,label:t,data:s}=this._selectedNode;return n`
      <div class="detail-panel">
        <div class="detail-header">
          <ha-icon icon="${this._selectedNode.icon}"></ha-icon>
          <h3>${t}</h3>
          <span class="type-chip">${e}</span>
        </div>

        ${this._renderActionButtons()}

        <div class="detail-content">
          ${this._renderDetailContent(e,s,t)}
        </div>
      </div>
    `}_renderActionButtons(){if(!this._selectedNode)return n``;const{type:e,label:t}=this._selectedNode;if(e!=="datasource")return n``;const s=this._isCardLocalSource(t);return n`
      <div class="action-buttons">
        ${s?n`
          <ha-button
            appearance="filled"
            variant="neutral"
            @click=${()=>this._handleEditSource(t)}>
            <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
            Edit source
          </ha-button>
        `:""}
        <ha-button
          appearance="filled"
          variant="neutral"
          @click=${()=>this._handleCopyConfig(t)}>
          <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
          Copy config
        </ha-button>
      </div>
    `}_isCardLocalSource(e){var s;const t=((s=this.cardConfig)==null?void 0:s.data_sources)||{};return e in t}_handleEditSource(e){this.dispatchEvent(new CustomEvent("edit-source",{detail:{sourceName:e},bubbles:true,composed:true}))}async _handleCopyConfig(e){var l,c,d;const t=(c=(l=window.lcards)==null?void 0:l.core)==null?void 0:c.dataSourceManager;if(!t)return;const s=(d=t.sources)==null?void 0:d.get(e);if(!s)return;const a={...s.cfg};delete a.hass;const r=JSON.stringify(a,null,2),i=await _e(r);this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:i?`Config for "${e}" copied to clipboard`:"Failed to copy config to clipboard"},bubbles:true,composed:true}))}_renderDetailContent(e,t,s){switch(e){case"datasource":return this._renderDataSourceDetail(t);case"entity":return this._renderEntityDetail(t);case"processors":return this._renderProcessorsOverview(t);case"processor":return this._renderProcessorDetail(t);case"buffers":return this._renderBuffersOverview(t);case"buffer":return this._renderBufferDetail(t);default:return n`<p>No detail view for ${e}</p>`}}_renderDataSourceDetail(e){var t,s,a,r,i,l,c;return n`
      <div class="detail-section">
        <h4>Configuration</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Entity ID:</span>
            <span class="detail-value">${((t=e.cfg)==null?void 0:t.entity)||"N/A"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Attribute:</span>
            <span class="detail-value">${((s=e.cfg)==null?void 0:s.attribute)||"State"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Window:</span>
            <span class="detail-value">${e.windowSeconds||60}s</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Min Emit:</span>
            <span class="detail-value">${e.minEmitMs||0}ms</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Buffer Size:</span>
            <span class="detail-value">${((a=e.buffer)==null?void 0:a.size())||0} / ${((r=e.buffer)==null?void 0:r.capacity)||0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Subscribers:</span>
            <span class="detail-value">${((i=e.subscribers)==null?void 0:i.size)||0}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Current Value</h4>
        <div class="current-value">
          ${e.buffer&&e.buffer.size()>0?n`
              <div class="value-display">
                <div><strong>Value:</strong> ${((l=e.buffer.last())==null?void 0:l.v)??"N/A"}</div>
                <div><strong>Timestamp:</strong> ${(c=e.buffer.last())!=null&&c.t?new Date(e.buffer.last().t).toLocaleString():"N/A"}</div>
              </div>
            `:n`<em>No data</em>`}
        </div>
      </div>
    `}_renderEntityDetail(e){var s,a;const t=(a=(s=this.hass)==null?void 0:s.states)==null?void 0:a[e.entityId];return t?n`
      <div class="detail-section">
        <h4>Entity State</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">State:</span>
            <span class="detail-value">${Ke(this.hass,t)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Last Changed:</span>
            <span class="detail-value">${new Date(t.last_changed).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Attributes</h4>
        <div class="attributes-table">
          ${Object.entries(t.attributes).map(([r,i])=>n`
            <div class="attribute-row">
              <span class="attribute-key">${Re(this.hass,t,r)}:</span>
              <span class="attribute-value">${Ie(this.hass,t,r)}</span>
            </div>
          `)}
        </div>
      </div>
    `:n`<p>Entity not found: ${e.entityId}</p>`}_renderProcessorDetail(e){var d;const{key:t,processor:s,type:a}=e,r=s.buffer?s.buffer.size():0,i=s.buffer?s.buffer.capacity:0,l=(d=s.config)!=null&&d.from?[s.config.from]:[],c=this._sanitizeForDisplay(s.config);return n`
      <div class="detail-section">
        <h4>Processor: ${t}</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${a}</span>
          </div>
          ${l.length>0?n`
            <div class="detail-item">
              <span class="detail-label">Dependencies:</span>
              <span class="detail-value">${l.join(", ")}</span>
            </div>
          `:""}
          <div class="detail-item">
            <span class="detail-label">Buffer:</span>
            <span class="detail-value">${r} / ${i} points</span>
          </div>
          ${s.lastValue!==void 0?n`
            <div class="detail-item">
              <span class="detail-label">Current Value:</span>
              <span class="detail-value">${s.lastValue}</span>
            </div>
          `:""}
        </div>
      </div>

      <div class="detail-section">
        <h4>Configuration</h4>
        <pre class="config-block">${JSON.stringify(c,null,2)}</pre>
      </div>
    `}_sanitizeForDisplay(e,t=0,s=new WeakSet){if(t>10)return"[Max Depth]";if(e==null||typeof e!="object"&&typeof e!="function")return e;if(typeof e=="function")return"[Function]";if(s.has(e))return"[Circular]";if(s.add(e),Array.isArray(e))return e.map(r=>this._sanitizeForDisplay(r,t+1,s));const a={};for(const[r,i]of Object.entries(e)){if(r==="hass"||r==="_hass"||r==="hassInstance"){a[r]="[HASS Object - Hidden]";continue}typeof i!="function"&&(a[r]=this._sanitizeForDisplay(i,t+1,s))}return a}_renderBufferDetail(e){const{buffer:t,bufferType:s}=e;if(!t||!t.size||t.size()===0)return n`
        <div class="detail-section">
          <h4>${s} Buffer</h4>
          <p><em>No data in buffer</em></p>
        </div>
      `;const a=t.size(),i=t.getAll().slice(-10).reverse();return n`
      <div class="detail-section">
        <h4>${s} Buffer (${a} / ${t.capacity} values)</h4>
        <div class="buffer-table">
          ${i.map((l,c)=>n`
            <div class="buffer-row">
              <span class="buffer-index">#${a-c}</span>
              <span class="buffer-time">${new Date(l.t).toLocaleTimeString()}</span>
              <span class="buffer-value">${l.v}</span>
            </div>
          `)}
        </div>
        ${a>10?n`<p class="buffer-note">Showing last 10 of ${a} values</p>`:""}
      </div>
    `}_renderProcessorsOverview(e){if(!e||e.length===0)return n`<p><em>No processors configured</em></p>`;const t={},s=new Map;return e.forEach(([a,r])=>{var l,c;const i=((l=r.config)==null?void 0:l.type)||"unknown";t[i]=(t[i]||0)+1,(c=r.config)!=null&&c.from&&s.set(a,r.config.from)}),n`
      <div class="detail-section">
        <h4>Processing Pipeline Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Total Processors:</span>
            <span class="detail-value">${e.length}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Dependencies:</span>
            <span class="detail-value">${s.size} processors with dependencies</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>By Type</h4>
        <div class="detail-grid">
          ${Object.entries(t).sort((a,r)=>r[1]-a[1]).map(([a,r])=>n`
            <div class="detail-item">
              <span class="detail-label">${a}:</span>
              <span class="detail-value">${r}</span>
            </div>
          `)}
        </div>
      </div>

      <div class="detail-section">
        <h4>All Processors</h4>
        <div class="detail-grid">
          ${e.map(([a,r])=>{var h,f;const i=((h=r.config)==null?void 0:h.type)||"unknown",l=(f=r.config)==null?void 0:f.from,c=l?` ← ${l}`:"",d=r.buffer?r.buffer.size():0;return n`
              <div class="detail-item">
                <span class="detail-label">${a}:</span>
                <span class="detail-value">${i}${c} (${d} points)</span>
              </div>
            `})}
        </div>
      </div>

      ${s.size>0?n`
        <div class="detail-section">
          <h4>Dependency Graph</h4>
          <div class="dependency-tree">
            ${e.map(([a,r])=>{var l;const i=(l=r.config)==null?void 0:l.from;return i?n`
                <div class="dependency-item">
                  <span class="dep-source">${i}</span>
                  <span class="dep-arrow">→</span>
                  <span class="dep-target">${a}</span>
                </div>
              `:""})}
          </div>
        </div>
      `:""}
    `}_renderBuffersOverview(e){var h,f,g,_,v;const t=(f=(h=this._selectedNode)==null?void 0:h.id)==null?void 0:f.split("_");if(!t||t.length<3||t[0]!=="ds")return n`<p><em>Could not determine datasource from node ID</em></p>`;const s=t.slice(1,-1).join("_"),a=(_=(g=window.lcards)==null?void 0:g.core)==null?void 0:_.dataSourceManager,r=a==null?void 0:a.getSource(s);if(!r)return n`<p><em>DataSource "${s}" not found</em></p>`;const i=[];r.buffer&&i.push({name:"Main",buffer:r.buffer,size:r.buffer.size(),capacity:r.buffer.capacity}),(v=r.processorManager)!=null&&v.processorBuffers&&r.processorManager.processorBuffers.size>0&&r.processorManager.processorBuffers.forEach((p,$)=>{i.push({name:`Processor: ${$}`,buffer:p,size:p.size(),capacity:p.capacity})});const l=i.reduce((p,$)=>p+$.size,0),c=i.reduce((p,$)=>p+$.capacity,0),d=l*16;return n`
      <div class="detail-section">
        <h4>Buffers Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Total Buffers:</span>
            <span class="detail-value">${i.length}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total Entries:</span>
            <span class="detail-value">${l} / ${c}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Est. Memory:</span>
            <span class="detail-value">${d<1024?`${d} B`:`${(d/1024).toFixed(1)} KB`}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>All Buffers</h4>
        <div class="detail-grid">
          ${i.map(p=>n`
            <div class="detail-item">
              <span class="detail-label">${p.name}:</span>
              <span class="detail-value">${p.size} / ${p.capacity} (${Math.round(p.size/p.capacity*100)}%)</span>
            </div>
          `)}
        </div>
      </div>
    `}static get styles(){return[ye,N,x`
      :host {
        display: block;
      }

      /* Tree | detail, as a studio's config | preview */
      .studio-layout {
        grid-template-columns: minmax(240px, 32%) 1fr;
        grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
      }

      .tree-head {
        padding: var(--ha-space-3) var(--ha-space-4);
        font-weight: 600;
        color: var(--primary-text-color);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: var(--ha-space-2);
        min-height: 0;
      }

      .tree-empty {
        padding: var(--ha-space-6);
        text-align: center;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: var(--ha-space-2);
        padding-left: calc(var(--ha-space-2) + var(--node-level, 0) * var(--ha-space-4));
        border-radius: var(--ha-border-radius-sm);
        color: var(--primary-text-color);
        cursor: pointer;
        user-select: none;
      }

      .tree-node-content:hover {
        background: var(--secondary-background-color);
      }

      .tree-node-content.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .tree-expander {
        width: 16px;
        flex: none;
        text-align: center;
        font-size: 12px;
      }

      .tree-expander.leaf {
        visibility: hidden;
      }

      .tree-node-content ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }

      .node-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Detail pane */
      .preview-panel {
        overflow-y: auto;
        padding: var(--ha-space-4);
      }

      .detail-panel-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-3);
        height: 100%;
        color: var(--secondary-text-color);
      }

      .detail-panel-empty ha-icon {
        --mdc-icon-size: 48px;
        opacity: 0.5;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
        margin-bottom: var(--ha-space-3);
      }

      .detail-header h3 {
        flex: 1;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .type-chip {
        padding: 2px var(--ha-space-2);
        border-radius: var(--ha-border-radius-pill);
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-4);
      }

      /* Each block reads like an lcards-form-section card */
      .detail-section {
        margin-bottom: var(--ha-space-3);
        padding: var(--ha-space-3);
        border-radius: var(--ha-border-radius-lg);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 30%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }

      .detail-section h4 {
        margin: 0 0 var(--ha-space-3);
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .detail-grid,
      .attributes-table {
        display: grid;
        gap: var(--ha-space-1);
      }

      .detail-item,
      .attribute-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--ha-space-3);
        padding: 6px 0;
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .detail-item:last-child,
      .attribute-row:last-child {
        border-bottom: none;
      }

      .detail-label,
      .attribute-key {
        font-weight: 500;
        color: var(--secondary-text-color);
      }

      .detail-value,
      .attribute-value {
        font-family: var(--code-font-family, monospace);
        color: var(--primary-text-color);
        text-align: right;
        overflow-wrap: anywhere;
      }

      /* Code-like blocks */
      .current-value,
      .config-block,
      .value-display,
      .dependency-tree,
      .buffer-table {
        padding: var(--ha-space-3);
        border-radius: var(--ha-border-radius-md);
        background: var(--primary-background-color);
        font-family: var(--code-font-family, monospace);
        font-size: 13px;
        color: var(--primary-text-color);
        overflow-x: auto;
      }

      .value-display div {
        margin: var(--ha-space-1) 0;
      }

      .dependency-tree,
      .buffer-table {
        display: grid;
        gap: var(--ha-space-1);
      }

      .buffer-table {
        max-height: 400px;
        overflow-y: auto;
      }

      .dependency-item,
      .buffer-row {
        display: grid;
        align-items: center;
        gap: var(--ha-space-3);
        padding: 6px var(--ha-space-2);
        border-radius: var(--ha-border-radius-sm);
        background: color-mix(in srgb, var(--secondary-background-color) 50%, transparent);
      }

      .dependency-item {
        display: flex;
      }

      .buffer-row {
        grid-template-columns: 48px 120px 1fr;
      }

      .dep-source,
      .buffer-value {
        color: var(--primary-color);
        overflow-wrap: anywhere;
      }

      .dep-arrow,
      .buffer-index,
      .buffer-time {
        color: var(--secondary-text-color);
      }

      .dep-target {
        color: var(--accent-color, var(--primary-color));
      }

      .buffer-note {
        margin-top: var(--ha-space-2);
      }
    `]}render(){return this.open?n`
      <ha-dialog
        open
        flexcontent
        @closed=${e=>{e.stopPropagation(),this._handleClose()}}
        header-title="Data Source Browser">
        <div class="dialog-content">
          <div class="studio-layout">
            <div class="config-panel">
              <div class="tree-head">Data sources on this page (${this._treeData.length})</div>
              <div class="tree-container">
                ${this._treeData.length>0?this._renderTreeNodes(this._treeData):n`<p class="hint tree-empty">No data sources are running on this page.</p>`}
              </div>
            </div>
            <div class="preview-panel">
              ${this._renderNodeDetail()}
            </div>
          </div>
        </div>

        <div slot="footer">
          <ha-button appearance="plain" @click=${this._handleClose} data-dialog="close">Close</ha-button>
        </div>
      </ha-dialog>
    `:n``}};u(re,"LCARdSDataSourceBrowser");let G=re;customElements.get("lcards-datasource-browser")||customElements.define("lcards-datasource-browser",G);const ie=class ie2 extends k{static get properties(){return{editor:{type:Object},hass:{type:Object},_activeSubTab:{type:String,state:true},_dialogOpen:{type:Boolean,state:true},_dialogMode:{type:String,state:true},_editingSource:{type:Object,state:true},_browserOpen:{type:Boolean,state:true}}}constructor(){super(),this.editor=void 0,this.hass=void 0,this._activeSubTab="card",this._dialogOpen=false,this._dialogMode="add",this._editingSource=null,this._browserOpen=false,this._browserRef=Ve()}static get styles(){return[$e,N,Fe,x`
        :host {
          display: block;
        }

        ha-tab-group {
          display: block;
          margin-top: var(--ha-space-4);
        }

        ha-tab-group-tab ha-icon {
          --mdc-icon-size: 18px;
          margin-right: var(--ha-space-2);
        }

        .card-sources-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--ha-space-3);
          margin: var(--ha-space-3) 0;
        }
      `]}render(){var r,i,l,c,d,h,f,g,_;const e=((i=(r=this.editor)==null?void 0:r.config)==null?void 0:i.data_sources)||{},t=Object.keys(e).length,s=(c=(l=window.lcards)==null?void 0:l.core)==null?void 0:c.dataSourceManager,a=((d=s==null?void 0:s.sources)==null?void 0:d.size)||0;return n`
      ${He({icon:"mdi:database-search",title:"Data sources",description:"Live state of every data source on this page: values, buffers and processors.",stats:[{value:t,label:t===1?"card source":"card sources"},{value:a,label:"running on this page"}],actions:[{label:"Browse sources",icon:"mdi:database-search",onClick:u(()=>this._openBrowser(),"onClick")}]})}

      <ha-tab-group @wa-tab-show=${this._handleTabChange}>
        <ha-tab-group-tab value="card" ?active=${this._activeSubTab==="card"}>
          <ha-icon icon="mdi:card-outline"></ha-icon>
          This card
        </ha-tab-group-tab>
        <ha-tab-group-tab value="global" ?active=${this._activeSubTab==="global"}>
          <ha-icon icon="mdi:earth"></ha-icon>
          All on this page
        </ha-tab-group-tab>

        <div class="tab-panel">
          ${this._activeSubTab==="global"?this._renderGlobalSources():this._renderCardSources()}
        </div>
      </ha-tab-group>

      <lcards-datasource-studio-dialog
        .hass=${this.hass}
        .mode=${this._dialogMode}
        .sourceName=${(h=this._editingSource)==null?void 0:h.name}
        .sourceConfig=${(f=this._editingSource)==null?void 0:f.config}
        .cardConfig=${(g=this.editor)==null?void 0:g.config}
        .open=${this._dialogOpen}
        @save=${this._handleDialogSave}
        @cancel=${()=>this._dialogOpen=false}>
      </lcards-datasource-studio-dialog>

      <lcards-datasource-browser
        ${Je(this._browserRef)}
        .hass=${this.hass}
        .cardConfig=${(_=this.editor)==null?void 0:_.config}
        .open=${this._browserOpen}
        @close=${()=>this._browserOpen=false}
        @edit-source=${this._handleBrowserEditSource}>
      </lcards-datasource-browser>
    `}_renderCardSources(){return n`
      <div class="card-sources-header">
        <span class="hint">Data sources defined in this card's config.</span>
        <ha-button variant="brand" appearance="accent" @click=${this._handleAddSource}>
          <ha-icon slot="start" icon="mdi:plus"></ha-icon>
          Add source
        </ha-button>
      </div>

      <lcards-card-datasources-list
        .editor=${this.editor}
        .config=${this.editor.config}
        .hass=${this.hass}
        @edit-datasource=${this._handleEditRequest}
        @delete-datasource=${this._handleDeleteRequest}
        @inspect-source=${this._handleInspectSource}>
      </lcards-card-datasources-list>
    `}_renderGlobalSources(){return n`
      <lcards-global-datasources-panel
        .hass=${this.hass}>
      </lcards-global-datasources-panel>
    `}_handleTabChange(e){var s;e.stopPropagation();const t=(s=e.target.activeTab)==null?void 0:s.getAttribute("value");t&&this._setActiveTab(t)}_setActiveTab(e){this._activeSubTab=e}_openBrowser(){this._browserOpen=true}_handleInspectSource(e){const{sourceName:t}=e.detail;this._browserOpen=true,requestAnimationFrame(()=>{this._browserRef.value&&this._browserRef.value.selectDataSource(t)})}_handleBrowserEditSource(e){var r,i;const{sourceName:t}=e.detail;this._browserOpen=false,this._activeSubTab="card";const a=(((i=(r=this.editor)==null?void 0:r.config)==null?void 0:i.data_sources)||{})[t];if(!a){w.warn(`⚠️ [DataSourceEditorTab] Source "${t}" not found in card config`);return}this._dialogMode="edit",this._editingSource={name:t,config:a},this._dialogOpen=true}_handleAddSource(){this._dialogMode="add",this._editingSource=null,this._dialogOpen=true}_handleEditRequest(e){this._dialogMode="edit",this._editingSource=e.detail,this._dialogOpen=true}async _handleDeleteRequest(e){var i,l;const{name:t}=e.detail,s=(l=(i=window.lcards)==null?void 0:i.core)==null?void 0:l.dataSourceManager;if(!s){w.warn("⚠️ [LCARdS] DataSourceManager not available");return}const a=s.getSourceDependents(t);if(a.length>0&&!await this._showDependencyWarningDialog(t,a))return;const r={...this.editor.config.data_sources||{}};if(delete r[t],this.editor.config.data_sources=r,ne(this.editor,"config-changed",{config:this.editor.config}),this.editor._yamlValue!==void 0){this.editor._isUpdatingYaml=true;const{configToYaml:c}=await import("./lcards-yaml-editor-B_uxS34u.js").then(d=>d.j);this.editor._yamlValue=c(this.editor.config),requestAnimationFrame(()=>{this.editor._isUpdatingYaml=false})}s.removeCardFromSource(t,this.editor.config.id||this.editor._cardGuid),this.editor.requestUpdate(),this.requestUpdate()}_handleDialogSave(e){var r,i;const{name:t,config:s}=e.detail,a={...this.editor.config.data_sources||{}};if(a[t]=s,this.editor.config={...this.editor.config,data_sources:a},ne(this.editor,"config-changed",{config:this.editor.config}),this._dialogMode==="add"){const l=(i=(r=window.lcards)==null?void 0:r.core)==null?void 0:i.dataSourceManager;l&&l.createDataSource(t,s,this.editor.config.id||this.editor._cardGuid,false)}this._dialogOpen=false,this._activeSubTab="card",this.requestUpdate()}_showDependencyWarningDialog(e,t){return ge({title:`Delete ${e}?`,message:`Other cards use it: ${t.join(", ")}. They show errors until their configs stop referring to it. This can't be undone.`,confirmText:"Delete anyway"})}};u(ie,"LCARdSDataSourceEditorTab");let V=ie;customElements.get("lcards-datasource-editor-tab")||customElements.define("lcards-datasource-editor-tab",V);export{Ve as e,Je as n};
//# sourceMappingURL=lcards-datasource-editor-tab-BLZdadgQ.js.map
