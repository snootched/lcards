var X=Object.defineProperty;var f=(i,t)=>X(i,"name",{value:t,configurable:true});import{i as O,a as M,b as h,z as Q,D as G,N as K,U as F,l as T,P as W,A as k,x as H,Q as Z}from"./lcards-main-BW4hZuuz.js";import{m as B}from"./lcards-message-DJxE4eZn.js";import{s as q,l as tt,r as et}from"./studio-dialog-styles-BC3IDpnS.js";import{p as st,w as N,t as L,u as Y,a as at,b as it,c as nt,d as rt}from"./lcards-provenance-tab-D1UONR46.js";import{M as ot,D as lt,V as ct,E as S,a as dt,v as ht,h as pt,p as ut,b as mt,k as ft,d as vt,e as gt,f as yt,s as V,c as bt,o as _t}from"./lcards-yaml-editor-B_uxS34u.js";import"./lcards-form-section-Bxom3ojy.js";const C={"entity-state":{name:"The card's entity state",template:"{entity.state}",description:"The state, as Home Assistant shows it"},"entity-attribute":{name:"An attribute",template:"Brightness: {entity.attributes.brightness}",description:"Any attribute of the entity",test:{entity:{state:"on",attributes:{brightness:200}}}},"other-entity":{name:"Another entity's state",template:"Outside: {states.sensor.outdoor_temperature.state}",description:"Any entity, by its full ID",test:{states:{"sensor.outdoor_temperature":{state:"12.5",attributes:{unit_of_measurement:"°C"}}}}},datasource:{name:"A data source, formatted",template:"Core temperature: {ds:core_temp:.1f} °C",description:"A data source value with a number format",test:{ds:{core_temp:87.468}}},variables:{name:"A card variable",template:"Deck {variables.deck}: {variables.section}",description:"Values from the card's variables",test:{variables:{deck:7,section:"Sickbay"}}},"theme-token":{name:"A theme token",template:"{theme:colors.text.onDark}",description:"A value from the active LCARdS theme"},user:{name:"The current user",template:"Welcome aboard, {hass.user.name}",description:"Who is looking at the dashboard"},"js-conditional":{name:"JavaScript: a condition",template:"[[[ return entity.state === 'on' ? 'ACTIVE' : 'STANDBY' ]]]",description:"JavaScript with entity, states, variables, config, hass, theme and user",test:{entity:{state:"on",attributes:{}}}},"js-calculation":{name:"JavaScript: a calculation",template:"[[[ return Math.round(parseFloat(entity.state) * 1.8 + 32) + ' °F' ]]]",description:"Convert a Celsius reading to Fahrenheit",test:{entity:{state:"21",attributes:{unit_of_measurement:"°C"}}}},"jinja-state":{name:"Jinja2: a state",template:"{{ states('sun.sun') }}",description:"Home Assistant's own template engine (runs in Home Assistant)"},"jinja-conditional":{name:"Jinja2: a condition",template:"{% if is_state('sun.sun', 'above_horizon') %}Day watch{% else %}Night watch{% endif %}",description:"Jinja2 if / else"},mixed:{name:"Mixed: tokens, a data source and JavaScript",template:"{entity.state} · {ds:core_temp:.0f}° · [[[ return new Date().getHours() < 12 ? 'AM' : 'PM' ]]]",description:"All four kinds can share one string; they run in order JavaScript, tokens, data sources, Jinja2",test:{entity:{state:"on",attributes:{}},ds:{core_temp:87.4}}}};function xt(){return Object.keys(C)}f(xt,"getExampleIds");const wt=[{label:"entity.",detail:"the card's entity",type:"namespace"},{label:"states.",detail:"another entity",type:"namespace"},{label:"ds:",detail:"data source value",type:"namespace"},{label:"theme:",detail:"theme token",type:"namespace"},{label:"variables.",detail:"the card's variables",type:"namespace"},{label:"config.",detail:"card config",type:"namespace"},{label:"hass.user.name",apply:"hass.user.name}",detail:"current user",type:"property"}];function I(i){if(i==null)return"";if(typeof i=="object")return Array.isArray(i)?`list (${i.length})`:"object";const t=String(i);return t.length>28?`${t.slice(0,27)}…`:t}f(I,"preview");function $(i,t="}"){return!i||typeof i!="object"?[]:Object.entries(i).map(([e,s])=>s&&typeof s=="object"&&!Array.isArray(s)?{label:e,apply:`${e}.`,detail:"object",type:"namespace"}:{label:e,apply:`${e}${t}`,detail:I(s),type:"property"})}f($,"keyOptions");function E(i,t){return Object.entries(i||{}).map(([e,s])=>{var a;return{label:e,apply:`${e}${t}`,detail:I(((a=s==null?void 0:s.attributes)==null?void 0:a.friendly_name)??(s==null?void 0:s.state)),type:"variable"}})}f(E,"entityOptions");const R=f(i=>[{label:"state",apply:"state}",detail:I(i==null?void 0:i.state),type:"property"},{label:"attributes.",detail:"attributes",type:"namespace"}],"stateParts");function $t(i,t){var n,d;if(!/[.:]/.test(i))return{offset:0,options:wt};for(const c of["ds:","datasource:"])if(i.startsWith(c))return{offset:c.length,options:(t.datasources||[]).map(l=>({label:l,apply:`${l}}`,detail:"data source",type:"variable"}))};if(i.startsWith("theme:")){const c=i.slice(6).split(".");c.pop();let l=t.themeTokens;for(const p of c)l=l==null?void 0:l[p];return{offset:i.lastIndexOf(".")>=6?i.lastIndexOf(".")+1:6,options:$(l)}}if(i.startsWith("states.")){const c=i.slice(7),l=/^([a-z_]+\.[a-z0-9_]+)\.(.*)$/i.exec(c);if(!l)return{offset:7,options:E(t.states,".")};const p=(n=t.states)==null?void 0:n[l[1]],g=l[2].split("."),y=7+l[1].length+1;return g.length===1?{offset:y,options:R(p)}:g[0]==="attributes"&&g.length===2?{offset:y+11,options:$(p==null?void 0:p.attributes)}:null}const e=i.split("."),s=i.length-e[e.length-1].length,a=e.slice(0,-1),[r,...o]=a;if(r==="entity")return o.length===0?{offset:s,options:R(t.entity)}:o.length===1&&o[0]==="attributes"?{offset:s,options:$((d=t.entity)==null?void 0:d.attributes)}:null;if(r==="variables"||r==="config"){let c=r==="variables"?t.variables:t.config;for(const l of o)c=c==null?void 0:c[l];return{offset:s,options:$(c)}}if(r==="hass"){if(o.length===0)return{offset:s,options:[{label:"user.",detail:"current user",type:"namespace"}]};if(o.length===1&&o[0]==="user")return{offset:s,options:[{label:"name",apply:"name}",detail:"user name",type:"property"}]}}return null}f($t,"tokenOptions");function kt(i,t={}){var o;const e=/\b(?:states|is_state|state_attr|has_value)\(\s*['"]([\w.]*)$/.exec(i);if(e)return{from:i.length-e[1].length,options:E(t.states,"")};const s=i.lastIndexOf("[[[");if(s>=0&&i.indexOf("]]]",s)<0){const n=/(?:\b(entity\.attributes|variables)\.|states\[\s*['"])([\w.]*)$/.exec(i);if(!n)return null;const d=n[2],c=n[1]==="entity.attributes"?$((o=t.entity)==null?void 0:o.attributes,""):n[1]==="variables"?$(t.variables,""):E(t.states,"");return{from:i.length-d.length,options:c}}const a=/\{([^{}\s]*)$/.exec(i);if(!a||i[a.index-1]==="{"||a[1].startsWith("%"))return null;const r=$t(a[1],t);return r?{from:a.index+1+r.offset,options:r.options}:null}f(kt,"templateCompletions");const U=new ot({regexp:/\[\[\[|\]\]\]|\{\{[^\n]*?\}\}|\{%[^\n]*?%\}|\{(?:theme|ds|datasource):[^{}\n]*\}|\{[a-z_][\w.]*\}/gi,decoration:f(i=>lt.mark({class:i[0].startsWith("[[[")||i[0].startsWith("]]]")?"tpl-js":i[0].startsWith("{{")||i[0].startsWith("{%")?"tpl-jinja":"tpl-token"}),"decoration")}),St=ct.fromClass(class{constructor(i){this.decorations=U.createDeco(i)}update(i){this.decorations=U.updateDeco(i,this.decorations)}},{decorations:f(i=>i.decorations,"decorations")}),z=class z2 extends O{static get properties(){return{value:{type:String},placeholder:{type:String},getCompletionData:{attribute:false}}}constructor(){super(),this.value="",this.placeholder="Type a template. Ctrl+Space lists what can go next.",this.getCompletionData=()=>({}),this._view=null,this._timer=null,this._updating=false}static get styles(){return M`
            :host {
                display: block;
            }
            .mount {
                border-radius: var(--ha-border-radius-md);
                overflow: hidden;
                border: var(--ha-border-width-sm) solid var(--divider-color);
            }
            .mount:focus-within {
                border-color: var(--primary-color);
            }
            .cm-editor {
                min-height: 140px;
                max-height: 40vh;
                font-size: 14px;
            }
            .cm-editor.cm-focused {
                outline: none;
            }
            .cm-scroller {
                font-family: var(--code-font-family, monospace);
                line-height: 1.6;
            }
            .tpl-token {
                color: #4ec9b0;
            }
            .tpl-jinja {
                color: #c586c0;
            }
            .tpl-js {
                color: #dcdcaa;
                font-weight: 600;
            }
        `}render(){return h`<div class="mount" @keydown=${this._keepKeys}></div>`}_keepKeys(t){t.key.length===1&&!t.ctrlKey&&!t.altKey&&!t.metaKey&&t.stopPropagation(),t.key==="Escape"&&t.defaultPrevented&&t.stopPropagation()}firstUpdated(){const t=f(e=>{var n;const s=e.state.doc.lineAt(e.pos),a=e.state.sliceDoc(Math.max(0,e.pos-400),e.pos),r=kt(a,((n=this.getCompletionData)==null?void 0:n.call(this))??{});if(!r)return null;const o=e.pos-(a.length-r.from);return o<s.from&&!e.explicit?null:{from:o,options:r.options,validFor:/^[\w.]*$/}},"source");this._view=new S({parent:this.renderRoot.querySelector(".mount")??void 0,state:dt.create({doc:this.value??"",extensions:[pt(),S.lineWrapping,ut(this.placeholder),mt({override:[t],activateOnTyping:true,maxRenderedOptions:40}),ft.of([...vt,...gt,...yt]),ht,St,S.updateListener.of(e=>{if(e.docChanged&&!this._updating&&this._schedule(),e.docChanged&&e.transactions.some(s=>s.isUserEvent("input.type"))){let s="";e.changes.iterChanges((a,r,o,n,d)=>{s=d.toString()}),/[.:{'"[]$/.test(s)&&queueMicrotask(()=>this._view&&V(this._view))}})]})})}updated(t){t.has("value")&&this._view&&this.value!==this._view.state.doc.toString()&&(this._updating=true,this._view.dispatch({changes:{from:0,to:this._view.state.doc.length,insert:this.value??""}}),this._updating=false)}disconnectedCallback(){var t;super.disconnectedCallback(),clearTimeout(this._timer??void 0),(t=this._view)==null||t.destroy(),this._view=null}_schedule(){clearTimeout(this._timer??void 0),this._timer=setTimeout(()=>this._emit(),300)}_emit(){var e;this._timer=null;const t=((e=this._view)==null?void 0:e.state.doc.toString())??this.value;this.value=t,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:true,composed:true}))}flush(){this._timer&&(clearTimeout(this._timer??void 0),this._emit())}insert(t,e=0){const s=this._view;if(!s)return;const{from:a,to:r}=s.state.selection.main;s.dispatch({changes:{from:a,to:r,insert:t},selection:{anchor:a+t.length+e}}),s.focus(),/[.:{]$/.test(t)&&e===0&&V(s)}focus(){var t;(t=this._view)==null||t.focus()}};f(z,"LCARdSTemplateEditor");let j=z;customElements.get("lcards-template-editor")||customElements.define("lcards-template-editor",j);const Tt=Q(G.templates),Ct=[{label:"Entity",text:"{entity."},{label:"Other entity",text:"{states."},{label:"Data source",text:"{ds:"},{label:"Theme",text:"{theme:"},{label:"Variable",text:"{variables."},{label:"JavaScript",text:"[[[ return  ]]]",caret:-4},{label:"Jinja2",text:"{{  }}",caret:-3}],Et=[["{entity.state}","The card's entity (also entity.attributes.NAME)"],["{states.light.desk.state}","Any entity by its ID"],["{ds:name:.1f}","A data source value, with an optional number format"],["{theme:colors.text.onDark}","A theme token"],["{variables.NAME}","One of the card's variables"],["[[[ return ... ]]]","JavaScript: entity, states, variables, config, hass, theme, user"],["{{ states('sun.sun') }}","Jinja2, run by Home Assistant (test values don't apply)"]],jt={ok:{icon:"mdi:check-circle",text:"Resolved"},partial:{icon:"mdi:alert",text:"Resolved with gaps"},failed:{icon:"mdi:close-circle",text:"Didn't resolve"},empty:{icon:"mdi:circle-outline",text:"Empty result"}},P=class P2 extends O{static get properties(){return{hass:{type:Object},config:{type:Object},open:{type:Boolean},initialData:{type:Object},_template:{type:String,state:true},_path:{type:String,state:true},_entityId:{type:String,state:true},_testText:{type:String,state:true},_result:{type:Object,state:true},_evaluating:{type:Boolean,state:true}}}constructor(){super(),this.hass=void 0,this.config=void 0,this.open=false,this.initialData=null,this._template="",this._path="",this._entityId="",this._testText="",this._result=null,this._evaluating=false,this._run=0,this._subscriptions=new Map,this._seenStates=new Map}static get styles(){return[q,B,M`
            .studio-layout {
                grid-template-columns: minmax(320px, 1fr) minmax(300px, 1fr);
                grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
            }

            .tab-content {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .preview-panel {
                overflow-y: auto;
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .editor-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--ha-space-2);
                flex-wrap: wrap;
            }

            .editor-head h3 {
                margin: 0;
                font-size: 15px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .kinds {
                display: flex;
                gap: var(--ha-space-1);
                flex-wrap: wrap;
            }

            .kind {
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                font-size: 12px;
                font-weight: 600;
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
            }

            .inserts {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-1);
                align-items: center;
            }

            .inserts .hint {
                margin-right: var(--ha-space-1);
            }

            .inserts ha-button {
                --ha-button-height: 28px;
            }

            .examples ha-selector {
                display: block;
            }

            .entity-live {
                margin: var(--ha-space-1) 0 0;
            }

            /* Result: the black inset */
            .result {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .status {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                font-weight: 600;
                font-size: 13px;
            }

            .status ha-icon {
                --mdc-icon-size: 18px;
            }

            .status.ok { color: var(--success-color); }
            .status.partial, .status.empty { color: var(--warning-color); }
            .status.failed { color: var(--error-color); }

            .status .time {
                margin-left: auto;
                font-weight: 400;
                color: var(--secondary-text-color);
            }

            .value {
                font-family: var(--code-font-family, monospace);
                font-size: 20px;
                line-height: 1.4;
                color: var(--primary-text-color);
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                min-height: 1.4em;
            }

            .value.placeholder {
                font-size: 14px;
                color: var(--secondary-text-color);
                font-family: inherit;
            }

            .gaps {
                margin: 0;
                padding-left: var(--ha-space-5);
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            .gaps code {
                font-family: var(--code-font-family, monospace);
                color: var(--warning-color);
            }

            /* What it used */
            .used {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }

            .used td {
                padding: 6px var(--ha-space-2);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                vertical-align: middle;
            }

            .used tr:last-child td {
                border-bottom: none;
            }

            .used .name {
                font-family: var(--code-font-family, monospace);
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .used .val {
                font-family: var(--code-font-family, monospace);
                color: var(--secondary-text-color);
                overflow-wrap: anywhere;
            }

            .used ha-icon {
                --mdc-icon-size: 16px;
                color: var(--secondary-text-color);
            }

            .swatch {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                vertical-align: middle;
                margin-right: var(--ha-space-1);
            }

            .src {
                font-size: 12px;
                padding: 1px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                white-space: nowrap;
            }

            .src.live { background: color-mix(in srgb, var(--success-color) 20%, transparent); }
            .src.test { background: color-mix(in srgb, var(--info-color, #03a9f4) 22%, transparent); }
            .src.missing { background: color-mix(in srgb, var(--error-color) 22%, transparent); }

            /* Syntax reference */
            .syntax {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
            }

            .syntax button {
                all: unset;
                cursor: pointer;
                display: grid;
                grid-template-columns: minmax(160px, auto) 1fr;
                gap: var(--ha-space-3);
                padding: var(--ha-space-1) var(--ha-space-2);
                border-radius: var(--ha-border-radius-sm);
                font-size: 12px;
            }

            .syntax button:hover,
            .syntax button:focus-visible {
                background: color-mix(in srgb, var(--primary-color) 14%, transparent);
            }

            .syntax code {
                font-family: var(--code-font-family, monospace);
                color: var(--primary-color);
            }

            .syntax span {
                color: var(--secondary-text-color);
            }

            .docs {
                margin: var(--ha-space-2) 0 0;
                font-size: 12px;
            }

            .docs a {
                color: var(--primary-color);
            }

            .test-error {
                margin-top: var(--ha-space-1);
            }
        `]}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeAll()}willUpdate(t){t.has("open")&&this.open&&this._reset()}updated(t){t.has("open")&&!this.open&&this._unsubscribeAll(),t.has("hass")&&this.open&&this._result&&this._usedStatesChanged()&&this._evaluate()}_reset(){var e;const t=this.initialData||{};this._template=t.template??"",this._path=t.path??"",this._entityId=t.entity??((e=this.config)==null?void 0:e.entity)??"",this._testText="",this._result=null,this._evaluate()}get _test(){return st(this._testText)}_dataSourceManager(t){var s,a;const e=(a=(s=window.lcards)==null?void 0:s.core)==null?void 0:a.dataSourceManager;return{sources:(e==null?void 0:e.sources)??new Map,getSource:f(r=>{var o;if(t[r]!==void 0){const n=t[r];return{id:r,_isTest:true,getCurrentData:f(()=>({v:n,value:n,t:Date.now(),metadata:{}}),"getCurrentData"),subscribe:f(()=>()=>{},"subscribe"),unsubscribe(){}}}return((o=e==null?void 0:e.getSource)==null?void 0:o.call(e,r))??null},"getSource")}}async _evaluate(){var y,_,u,w;const t=this._template,e=++this._run;if(!t.trim()){this._result=null,this._syncSubscriptions([]);return}const{value:s}=this._test,a=N({hass:this.hass,entityId:this._entityId,test:s}),r=K(t,{entityId:this._entityId});this._syncSubscriptions(r.datasources),this._evaluating=true;const o=performance.now();let n="",d="";try{const b=new F({hass:a.hass,context:L({hass:a.hass,config:this.config??{},entity:a.entity,variables:a.variables,theme:(w=(u=(_=(y=window.lcards)==null?void 0:y.core)==null?void 0:_.themeManager)==null?void 0:u.getActiveTheme)==null?void 0:w.call(u)}),dataSourceManager:this._dataSourceManager(a.ds)});n=String(await b.evaluateAsync(t)??"")}catch(b){d=(b==null?void 0:b.message)??String(b),T.debug("[TemplateSandbox] Evaluation failed",{error:d})}if(e!==this._run)return;const c=this._used(r,a),l=Y(n),p=c.filter(b=>b.source==="missing"),g=d||l.length&&n.trim()===t.trim()?"failed":l.length||p.length?"partial":n.trim()?"ok":"empty";this._result={value:n,error:d,gaps:l,used:c,status:g,ms:Math.round(performance.now()-o)},this._rememberStates(r.entities),this._evaluating=false}_used(t,e){var d,c,l,p,g,y,_,u,w,b;const s=[],a=((d=e.hass)==null?void 0:d.states)??{};for(const m of t.entities){const v=a[m];s.push({kind:"entity",icon:"mdi:home-outline",name:m,value:v?W(e.hass,v):"",source:v?e.testEntities.includes(m)?"test":"live":"missing"})}const r=(l=(c=window.lcards)==null?void 0:c.core)==null?void 0:l.dataSourceManager;for(const m of t.datasources){const v=e.ds[m]!==void 0,x=v?{v:e.ds[m]}:(y=(g=(p=r==null?void 0:r.getSource)==null?void 0:p.call(r,m))==null?void 0:g.getCurrentData)==null?void 0:y.call(g);s.push({kind:"ds",icon:"mdi:database",name:m,value:x&&x.v!==void 0&&x.v!==null?String(x.v):"",source:v?"test":x?"live":"missing"})}const o=((_=this.config)==null?void 0:_.variables)??{};for(const m of t.variables){const v=e.variables[m]!==void 0,x=v?e.variables[m]:o[m];s.push({kind:"variable",icon:"mdi:variable",name:m,value:x===void 0?"":typeof x=="object"?JSON.stringify(x):String(x),source:v?"test":x!==void 0?"card":"missing"})}const n=(w=(u=window.lcards)==null?void 0:u.core)==null?void 0:w.themeManager;for(const m of t.themeTokens){const v=(b=n==null?void 0:n.getToken)==null?void 0:b.call(n,m);s.push({kind:"theme",icon:"mdi:palette",name:m,value:v==null?"":typeof v=="object"?JSON.stringify(v):String(v),source:v==null?"missing":"theme"})}return s}_rememberStates(t){this._seenStates=new Map(t.map(e=>{var s,a;return[e,(a=(s=this.hass)==null?void 0:s.states)==null?void 0:a[e]]}))}_usedStatesChanged(){var t,e;for(const[s,a]of this._seenStates)if(((e=(t=this.hass)==null?void 0:t.states)==null?void 0:e[s])!==a)return true;return false}_syncSubscriptions(t){var s,a,r;const e=(a=(s=window.lcards)==null?void 0:s.core)==null?void 0:a.dataSourceManager;for(const[o,n]of this._subscriptions)t.includes(o)||(n==null||n(),this._subscriptions.delete(o));for(const o of t){if(this._subscriptions.has(o))continue;const n=(r=e==null?void 0:e.getSource)==null?void 0:r.call(e,o);typeof(n==null?void 0:n.subscribe)=="function"&&this._subscriptions.set(o,n.subscribe(()=>this._scheduleEvaluate()))}}_unsubscribeAll(){for(const t of this._subscriptions.values())t==null||t();this._subscriptions.clear(),clearTimeout(this._evalTimer)}_scheduleEvaluate(){clearTimeout(this._evalTimer),this._evalTimer=setTimeout(()=>this._evaluate(),250)}_completionData(){var a,r,o,n,d,c,l,p,g,y,_;const{value:t}=this._test,e=N({hass:this.hass,entityId:this._entityId,test:t}),s=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.dataSourceManager;return{entity:e.entity,states:((o=e.hass)==null?void 0:o.states)??{},datasources:[...new Set([...((d=(n=s==null?void 0:s.sources)==null?void 0:n.keys)==null?void 0:d.call(n))??[],...Object.keys(e.ds)])],themeTokens:((y=(g=(p=(l=(c=window.lcards)==null?void 0:c.core)==null?void 0:l.themeManager)==null?void 0:p.getActiveTheme)==null?void 0:g.call(p))==null?void 0:y.tokens)??{},variables:{...((_=this.config)==null?void 0:_.variables)??{},...e.variables},config:this.config??{}}}get _editor(){return this.renderRoot.querySelector("lcards-template-editor")}_onTemplate(t){t.stopPropagation(),this._template=t.detail.value,this._evaluate()}_insert(t,e=0){const s=this._editor;s==null||s.insert(t,e)}_loadExample(t){const e=C[t];e&&(this._template=e.template,this._testText=e.test?bt(e.test):"",this._evaluate())}_onEntity(t){t.stopPropagation(),this._entityId=t.detail.value??"",this._evaluate()}_onTestValues(t){t.stopPropagation(),this._testText=t.detail.value??"",this._scheduleEvaluate()}_close(){this.open=false,this.dispatchEvent(new CustomEvent("sandbox-closed",{bubbles:true,composed:true}))}_save(){var t;(t=this._editor)==null||t.flush(),this.dispatchEvent(new CustomEvent("template-save",{detail:{path:this._path,value:this._template},bubbles:true,composed:true})),this._close()}render(){return this.open?h`
            <ha-dialog
                open
                flexcontent
                ?prevent-scrim-close=${!!this._path}
                header-title=${this._path?`Template: ${this._path}`:"Template Sandbox"}
                @closed=${t=>{t.stopPropagation(),t.target===t.currentTarget&&this._close()}}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <div class="tab-content">
                                ${this._renderEditor()}
                                ${this._renderContext()}
                            </div>
                        </div>
                        <div class="preview-panel">
                            ${this._renderResult()}
                            ${this._renderUsed()}
                            ${this._renderSyntax()}
                        </div>
                    </div>
                </div>
                <div slot="footer">
                    <ha-button appearance="plain" @click=${()=>{var t;return H(((t=this._editor)==null?void 0:t.value)??this._template)}}>
                        <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                        Copy template
                    </ha-button>
                    ${this._path?h`
                        <ha-button appearance="plain" data-dialog="close">Cancel</ha-button>
                        <ha-button variant="brand" @click=${this._save}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Save to ${this._path}
                        </ha-button>
                    `:h`<ha-button appearance="plain" data-dialog="close">Close</ha-button>`}
                </div>
            </ha-dialog>
        `:k}_renderEditor(){const t=at(this._template);return h`
            <div class="editor-head">
                <h3>Template</h3>
                <div class="kinds">${t.map(e=>h`<span class="kind">${e}</span>`)}</div>
            </div>
            <lcards-template-editor
                .value=${this._template}
                .getCompletionData=${()=>this._completionData()}
                @value-changed=${this._onTemplate}>
            </lcards-template-editor>
            <div class="inserts">
                <span class="hint">Insert</span>
                ${Ct.map(e=>h`
                    <ha-button size="s" appearance="outlined" variant="brand" @click=${()=>this._insert(e.text,e.caret??0)}>${e.label}</ha-button>
                `)}
            </div>
            <div class="examples">
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Load an example"}
                    .required=${false}
                    .selector=${{select:{mode:"dropdown",options:xt().map(e=>({value:e,label:C[e].name}))}}}
                    .value=${""}
                    @value-changed=${e=>{e.stopPropagation(),e.detail.value&&this._loadExample(e.detail.value)}}>
                </ha-selector>
            </div>
        `}_renderContext(){var s,a;const t=this._entityId?(a=(s=this.hass)==null?void 0:s.states)==null?void 0:a[this._entityId]:null,{error:e}=this._test;return h`
            <lcards-form-section
                header="Context"
                description="What entity means, and test values to try the template with"
                icon="mdi:tune"
                ?expanded=${true}>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Entity"}
                    .required=${false}
                    .selector=${{entity:{}}}
                    .value=${this._entityId}
                    @value-changed=${this._onEntity}>
                </ha-selector>
                <p class="hint entity-live">
                    ${this._entityId?t?`Live: ${W(this.hass,t)} · ${Object.keys(t.attributes??{}).length} attributes`:`${this._entityId} isn't in Home Assistant: give it test values below.`:"No entity: {entity.…} has nothing to read."}
                </p>
                <p class="hint">
                    Test values (YAML) replace live ones: <code>entity:</code> state and attributes,
                    <code>states:</code> other entities by ID, <code>ds:</code> data sources, <code>variables:</code>.
                </p>
                <ha-code-editor
                    mode="yaml"
                    class="test-values"
                    .hass=${this.hass}
                    .value=${this._testText}
                    @value-changed=${this._onTestValues}>
                </ha-code-editor>
                ${e?h`<div class="banner error test-error">${e}</div>`:k}
            </lcards-form-section>
        `}_renderResult(){const t=this._result;if(!t)return h`
                <div class="result">
                    <div class="value placeholder">The result shows here as you type.</div>
                </div>
            `;const e=jt[t.status];return h`
            <div class="result">
                <div class="status ${t.status}">
                    <ha-icon icon=${e.icon}></ha-icon>
                    ${e.text}
                    <span class="time">${this._evaluating?"Running…":`${t.ms} ms`}</span>
                </div>
                <div class="value">${t.error||t.value||" "}</div>
                ${t.gaps.length?h`
                    <ul class="gaps">${t.gaps.map(s=>h`<li>Not resolved: <code>${s}</code></li>`)}</ul>
                `:k}
            </div>
        `}_renderUsed(){var e;const t=((e=this._result)==null?void 0:e.used)??[];return t.length?h`
            <lcards-form-section header="What it used" icon="mdi:link-variant" ?expanded=${true}>
                <table class="used">
                    ${t.map(s=>h`
                        <tr>
                            <td><ha-icon icon=${s.icon}></ha-icon></td>
                            <td class="name">${s.name}</td>
                            <td class="val">
                                ${s.kind==="theme"&&Z(s.value)?h`<span class="swatch" style=${_t({background:s.value})}></span>`:k}
                                ${s.value||"-"}
                            </td>
                            <td><span class="src ${s.source==="card"||s.source==="theme"?"live":s.source}">${s.source}</span></td>
                        </tr>
                    `)}
                </table>
            </lcards-form-section>
        `:k}_renderSyntax(){return h`
            <lcards-form-section header="Syntax" icon="mdi:code-braces" ?expanded=${!this._template}>
                <div class="syntax">
                    ${Et.map(([t,e])=>h`
                        <button @click=${()=>this._insert(t)} title="Insert">
                            <code>${t}</code><span>${e}</span>
                        </button>
                    `)}
                </div>
                <p class="docs"><a href=${Tt} target="_blank" rel="noopener">Templates guide</a></p>
            </lcards-form-section>
        `}};f(P,"LCARdSTemplateSandbox");let A=P;customElements.get("lcards-template-sandbox")||customElements.define("lcards-template-sandbox",A);const J=class J2 extends O{static get properties(){return{editor:{type:Object},config:{type:Object},hass:{type:Object},_rows:{type:Array,state:true},_sandboxOpen:{type:Boolean,state:true},_sandboxInitialData:{type:Object,state:true}}}constructor(){super(),this.editor=void 0,this.config=void 0,this.hass=void 0,this._rows=[],this._sandboxOpen=false,this._sandboxInitialData=null,this._run=0,this._seenStates=new Map}static get styles(){return[B,tt,M`
            :host {
                display: block;
            }

            .fields {
                display: flex;
                flex-direction: column;
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-1) var(--ha-space-4);
            }

            .field {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
                padding: var(--ha-space-3) 0;
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .field:last-child {
                border-bottom: none;
            }

            .field-head {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
            }

            .path {
                flex: 1;
                min-width: 0;
                font-family: var(--code-font-family, monospace);
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .kind {
                padding: 1px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                font-size: 12px;
                font-weight: 600;
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
                white-space: nowrap;
            }

            .actions {
                display: flex;
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--primary-color);
            }

            .template {
                font-family: var(--code-font-family, monospace);
                font-size: 12px;
                color: var(--secondary-text-color);
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                max-height: 6.5em;
                overflow-y: auto;
            }

            .result {
                display: flex;
                align-items: flex-start;
                gap: var(--ha-space-2);
                font-size: 13px;
                color: var(--primary-text-color);
            }

            .result ha-icon {
                --mdc-icon-size: 16px;
                flex: none;
                margin-top: 1px;
            }

            .result.ok ha-icon { color: var(--success-color); }
            .result.partial ha-icon { color: var(--warning-color); }
            .result.failed ha-icon { color: var(--error-color); }

            .result .value {
                font-family: var(--code-font-family, monospace);
                overflow-wrap: anywhere;
                white-space: pre-wrap;
            }

            .result.pending {
                color: var(--secondary-text-color);
            }

            .mistake {
                font-size: 12px;
                color: var(--warning-color);
            }

            .mistake code {
                font-family: var(--code-font-family, monospace);
            }

            .empty {
                margin: 0;
            }
        `]}updated(t){t.has("config")?this._discover():t.has("hass")&&this._statesChanged()&&this._evaluate()}_discover(){this._rows=it(this.config??{}).map(t=>({...t,status:"pending",result:""})),this._evaluate()}async _evaluate(){var o,n;const t=++this._run,e=this.config??{},s=e.entity?((n=(o=this.hass)==null?void 0:o.states)==null?void 0:n[e.entity])??null:null,a=new Set,r=await Promise.all(this._rows.map(async d=>{var c,l,p,g,y,_;K(d.value,{entityId:e.entity}).entities.forEach(u=>a.add(u));try{const u=new F({hass:this.hass,context:L({hass:this.hass,config:e,entity:s,theme:(g=(p=(l=(c=window.lcards)==null?void 0:c.core)==null?void 0:l.themeManager)==null?void 0:p.getActiveTheme)==null?void 0:g.call(p)}),dataSourceManager:(_=(y=window.lcards)==null?void 0:y.core)==null?void 0:_.dataSourceManager}),w=String(await u.evaluateAsync(d.value)??""),b=Y(w),m=b.length&&w.trim()===d.value.trim()?"failed":b.length?"partial":"ok";return{...d,result:w,status:m}}catch(u){return T.debug("[TemplateEvaluationTab] Evaluation failed",{path:d.path,error:u==null?void 0:u.message}),{...d,result:(u==null?void 0:u.message)??String(u),status:"failed"}}}));t===this._run&&(this._seenStates=new Map([...a].map(d=>{var c,l;return[d,(l=(c=this.hass)==null?void 0:c.states)==null?void 0:l[d]]})),this._rows=r)}_statesChanged(){var t,e;for(const[s,a]of this._seenStates)if(((e=(t=this.hass)==null?void 0:t.states)==null?void 0:e[s])!==a)return true;return false}render(){const t=new Set(this._rows.flatMap(s=>s.kinds)),e=this._rows.filter(s=>s.status==="failed"||s.status==="partial"||s.mistakes.length).length;return h`
            ${et({icon:"mdi:code-braces-box",title:"Templates",description:"Every template in this card's config, evaluated live. Test one, or try new ones, in the sandbox.",stats:[{value:this._rows.length,label:this._rows.length===1?"field with a template":"fields with templates"},{value:t.size,label:t.size===1?"kind":"kinds"},...e?[{value:e,label:e===1?"needs a look":"need a look"}]:[]],actions:[{label:"Open sandbox",icon:"mdi:flask-outline",onClick:f(()=>this._openSandbox(),"onClick")}]})}
            ${this._rows.length?h`
                <div class="fields">${this._rows.map(s=>this._renderRow(s))}</div>
            `:h`<p class="hint empty">No templates in this card's config yet. Try one in the sandbox.</p>`}
            <lcards-template-sandbox
                .hass=${this.hass}
                .config=${this.config}
                .open=${this._sandboxOpen}
                .initialData=${this._sandboxInitialData}
                @sandbox-closed=${this._handleSandboxClosed}
                @template-save=${this._handleSave}>
            </lcards-template-sandbox>
        `}_renderRow(t){const e={ok:"mdi:check-circle",partial:"mdi:alert",failed:"mdi:close-circle",pending:"mdi:timer-sand"}[t.status];return h`
            <div class="field">
                <div class="field-head">
                    <span class="path">${t.path}</span>
                    ${t.kinds.map(s=>h`<span class="kind">${s}</span>`)}
                    <div class="actions">
                        <ha-icon-button .label=${"Copy template"} title="Copy template" @click=${()=>H(t.value)}>
                            <ha-icon icon="mdi:content-copy"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button .label=${"Open in sandbox"} title="Open in sandbox" @click=${()=>this._openSandbox({template:t.value,path:t.path})}>
                            <ha-icon icon="mdi:flask-outline"></ha-icon>
                        </ha-icon-button>
                    </div>
                </div>
                <div class="template">${t.value}</div>
                <div class="result ${t.status}">
                    <ha-icon icon=${e}></ha-icon>
                    <span class="value">${t.status==="pending"?"Evaluating…":t.result||"(empty)"}</span>
                </div>
                ${t.mistakes.map(s=>h`<div class="mistake"><code>${s.match}</code>: ${s.message}</div>`)}
            </div>
        `}_openSandbox(t={}){var e;this._sandboxInitialData={entity:(e=this.config)==null?void 0:e.entity,...t},this._sandboxOpen=true}_handleSandboxClosed(){this._sandboxOpen=false,this._sandboxInitialData=null}_handleSave(t){var o;const{path:e,value:s}=t.detail??{};if(!e||!((o=this.editor)!=null&&o._updateConfig))return;const a=nt(e)[0],r=rt(this.editor.config??this.config??{},e,s);this.editor._updateConfig({[a]:r[a]}),T.debug("[TemplateEvaluationTab] Saved template to",e)}};f(J,"LCARdSTemplateEvaluationTab");let D=J;customElements.get("lcards-template-evaluation-tab")||customElements.define("lcards-template-evaluation-tab",D);
//# sourceMappingURL=lcards-template-evaluation-tab-B1klA_pj.js.map
