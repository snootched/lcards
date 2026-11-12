var me=Object.defineProperty;var d=(i,e)=>me(i,"name",{value:e,configurable:true});import{X as fe,Y as ie,i as z,a as E,b as l,r as ve,D as ge,Z as ne,$ as re,l as C,a0 as X,A as m,J as j,a1 as oe,a2 as T}from"./lcards-main-C148JfkA.js";import{m as W}from"./lcards-message-CF99Ox_M.js";import{l as le,r as ce}from"./LCARdSBaseEditor-B4auBUbY.js";import{s as de}from"./lcards-studio-yaml-tab-CrleIpRd.js";import{c as be}from"./yaml-docs-links-UEyTsmzQ.js";import"./lcards-form-section-BK3OqcgA.js";import{M as ye,D as _e,V as we,E as D,a as xe,v as $e,h as ke,p as Se,b as Te,k as Ce,c as je,d as Oe,e as Ae,s as G}from"./lcards-yaml-editor-iu3_W6QT.js";function he({hass:i,config:e={},entity:t=null,variables:a={},theme:s}={}){return{entity:t,config:e,hass:i,states:i==null?void 0:i.states,variables:{...(e==null?void 0:e.variables)||{},...a},theme:s,displayFormat:"friendly"}}d(he,"templateContext");function ze(i){if(typeof i!="string"||!i)return false;const e=ie.detectTemplateTypes(i);return e.hasJavaScript||e.hasTokens||e.hasDatasources||e.hasJinja2}d(ze,"hasTemplate");function pe(i){if(typeof i!="string")return[];const e=ie.detectTemplateTypes(i),t=[];return e.hasJavaScript&&t.push("JavaScript"),/\{theme:/.test(i)&&t.push("Theme"),/\{(?:datasource|ds):/.test(i)&&t.push("Data source"),/\{(?!theme:|datasource:|ds:|\{|%)[a-z_][\w.]*\}/i.test(i)&&t.push("Token"),e.hasJinja2&&t.push("Jinja2"),t}d(pe,"templateKinds");const Ee=[[/\{\{\s*theme:[^}]*\}\}/g,"Theme tokens use single braces: {theme:colors.text.onDark}"],[/\{(?:datasource|ds)\.[^}]*\}/g,"Data sources use a colon: {ds:name}"],[/\{(?:colors|typography|components|palette)\.[^}]*\}/g,"Missing the theme: prefix: {theme:colors.text.onDark}"]];function De(i){if(typeof i!="string")return[];const e=[];for(const[t,a]of Ee)for(const s of i.matchAll(t))e.push({match:s[0],message:a});return e}d(De,"templateMistakes");function Me(i){const e=[],t=new Set(["type","rules","data_sources","grid_options","view_layout","visibility"]),a=d((s,n)=>{if(typeof s=="string"){const r=De(s);(ze(s)||r.length)&&e.push({path:n,value:s,kinds:pe(s),mistakes:r});return}if(Array.isArray(s)){s.forEach((r,o)=>a(r,`${n}[${o}]`));return}if(s&&typeof s=="object")for(const[r,o]of Object.entries(s))!n&&t.has(r)||a(o,n?`${n}.${r}`:r)},"walk");return a(i??{},""),e}d(Me,"templateFields");function V(i){const e=[];for(const t of String(i).split(".")){const a=/^([^[\]]*)((?:\[\d+\])*)$/.exec(t);if(!a){e.push(t);continue}a[1]&&e.push(a[1]);for(const s of a[2].matchAll(/\[(\d+)\]/g))e.push(Number(s[1]))}return e}d(V,"pathSegments");function Ie(i,e,t){const a=V(e),s=d((n,r)=>{if(r===a.length)return t;const o=a[r],c=Array.isArray(n)?[...n]:{...n??{}};return c[o]=s(n==null?void 0:n[o],r+1),c},"set");return s(i,0)}d(Ie,"withValueAt");function Pe(i){if(!String(i??"").trim())return{value:{},error:""};try{const e=fe.load(i);return e==null?{value:{},error:""}:typeof e!="object"||Array.isArray(e)?{value:{},error:"Write name: value lines (a YAML mapping)."}:{value:e,error:""}}catch(e){return{value:{},error:`YAML error: ${String(e.message).split(`
`)[0]}`}}}d(Pe,"parseTestValues");function ue(i){const e=String(i??""),t=[...e.matchAll(/\[\[\[[\s\S]*?\]\]\]/g),...e.matchAll(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g),...e.matchAll(/\{(?:theme|datasource|ds):[^}]*\}/g),...e.matchAll(/\{(?:entity|states|config|variables|hass)\.[^}]*\}/g),...e.matchAll(/\{(?:entity|states|config|variables|hass)\.[^{}]*$|\{(?:theme|datasource|ds):[^{}]*$/g)].map(a=>a[0]);return[...new Set(t)]}d(ue,"unresolvedParts");function Z(i,e,t){const a=new Date().toISOString();return{entity_id:i,last_changed:a,last_updated:a,context:{id:"lcards-test",parent_id:null,user_id:null},...e??{},state:String((t==null?void 0:t.state)??(e==null?void 0:e.state)??""),attributes:{...(e==null?void 0:e.attributes)??{},...(t==null?void 0:t.attributes)??{}}}}d(Z,"testState");function Q({hass:i,entityId:e,test:t={}}){var p,u;const a=t&&typeof t=="object"?t:{},s=d(f=>f&&typeof f=="object"&&!Array.isArray(f),"isObj"),n=e?((p=i==null?void 0:i.states)==null?void 0:p[e])??null:null,r=s(a.entity)?Z(e||"test.entity",n,a.entity):n,o={};if(s(a.states))for(const[f,g]of Object.entries(a.states))o[f]=Z(f,(u=i==null?void 0:i.states)==null?void 0:u[f],s(g)?g:{state:g});s(a.entity)&&e&&(o[e]=r);const c=Object.keys(o);return{hass:c.length?{...i,states:{...(i==null?void 0:i.states)??{},...o}}:i,entity:r,variables:s(a.variables)?a.variables:{},ds:s(a.ds)?a.ds:{},testEntities:c}}d(Q,"withTestValues");const P={"entity-state":{name:"The card's entity state",template:"{entity.state}",description:"The state, as Home Assistant shows it"},"entity-attribute":{name:"An attribute",template:"Brightness: {entity.attributes.brightness}",description:"Any attribute of the entity",test:{entity:{state:"on",attributes:{brightness:200}}}},"other-entity":{name:"Another entity's state",template:"Outside: {states.sensor.outdoor_temperature.state}",description:"Any entity, by its full ID",test:{states:{"sensor.outdoor_temperature":{state:"12.5",attributes:{unit_of_measurement:"°C"}}}}},datasource:{name:"A data source, formatted",template:"Core temperature: {ds:core_temp:.1f} °C",description:"A data source value with a number format",test:{ds:{core_temp:87.468}}},variables:{name:"A card variable",template:"Deck {variables.deck}: {variables.section}",description:"Values from the card's variables",test:{variables:{deck:7,section:"Sickbay"}}},"theme-token":{name:"A theme token",template:"{theme:colors.text.onDark}",description:"A value from the active LCARdS theme"},user:{name:"The current user",template:"Welcome aboard, {hass.user.name}",description:"Who is looking at the dashboard"},"js-conditional":{name:"JavaScript: a condition",template:"[[[ return entity.state === 'on' ? 'ACTIVE' : 'STANDBY' ]]]",description:"JavaScript with entity, states, variables, config, hass, theme and user",test:{entity:{state:"on",attributes:{}}}},"js-calculation":{name:"JavaScript: a calculation",template:"[[[ return Math.round(parseFloat(entity.state) * 1.8 + 32) + ' °F' ]]]",description:"Convert a Celsius reading to Fahrenheit",test:{entity:{state:"21",attributes:{unit_of_measurement:"°C"}}}},"jinja-state":{name:"Jinja2: a state",template:"{{ states('sun.sun') }}",description:"Home Assistant's own template engine (runs in Home Assistant)"},"jinja-conditional":{name:"Jinja2: a condition",template:"{% if is_state('sun.sun', 'above_horizon') %}Day watch{% else %}Night watch{% endif %}",description:"Jinja2 if / else"},mixed:{name:"Mixed: tokens, a data source and JavaScript",template:"{entity.state} · {ds:core_temp:.0f}° · [[[ return new Date().getHours() < 12 ? 'AM' : 'PM' ]]]",description:"All four kinds can share one string; they run in order JavaScript, tokens, data sources, Jinja2",test:{entity:{state:"on",attributes:{}},ds:{core_temp:87.4}}}};function Le(){return Object.keys(P)}d(Le,"getExampleIds");const Je=[{label:"entity.",detail:"the card's entity",type:"namespace"},{label:"states.",detail:"another entity",type:"namespace"},{label:"ds:",detail:"data source value",type:"namespace"},{label:"theme:",detail:"theme token",type:"namespace"},{label:"variables.",detail:"the card's variables",type:"namespace"},{label:"config.",detail:"card config",type:"namespace"},{label:"hass.user.name",apply:"hass.user.name}",detail:"current user",type:"property"}];function H(i){if(i==null)return"";if(typeof i=="object")return Array.isArray(i)?`list (${i.length})`:"object";const e=String(i);return e.length>28?`${e.slice(0,27)}…`:e}d(H,"preview");function S(i,e="}"){return!i||typeof i!="object"?[]:Object.entries(i).map(([t,a])=>a&&typeof a=="object"&&!Array.isArray(a)?{label:t,apply:`${t}.`,detail:"object",type:"namespace"}:{label:t,apply:`${t}${e}`,detail:H(a),type:"property"})}d(S,"keyOptions");function L(i,e){return Object.entries(i||{}).map(([t,a])=>{var s;return{label:t,apply:`${t}${e}`,detail:H(((s=a==null?void 0:a.attributes)==null?void 0:s.friendly_name)??(a==null?void 0:a.state)),type:"variable"}})}d(L,"entityOptions");const q=d(i=>[{label:"state",apply:"state}",detail:H(i==null?void 0:i.state),type:"property"},{label:"attributes.",detail:"attributes",type:"namespace"}],"stateParts");function Fe(i,e){var o,c;if(!/[.:]/.test(i))return{offset:0,options:Je};for(const h of["ds:","datasource:"])if(i.startsWith(h))return{offset:h.length,options:(e.datasources||[]).map(p=>({label:p,apply:`${p}}`,detail:"data source",type:"variable"}))};if(i.startsWith("theme:")){const h=i.slice(6).split(".");h.pop();let p=e.themeTokens;for(const u of h)p=p==null?void 0:p[u];return{offset:i.lastIndexOf(".")>=6?i.lastIndexOf(".")+1:6,options:S(p)}}if(i.startsWith("states.")){const h=i.slice(7),p=/^([a-z_]+\.[a-z0-9_]+)\.(.*)$/i.exec(h);if(!p)return{offset:7,options:L(e.states,".")};const u=(o=e.states)==null?void 0:o[p[1]],f=p[2].split("."),g=7+p[1].length+1;return f.length===1?{offset:g,options:q(u)}:f[0]==="attributes"&&f.length===2?{offset:g+11,options:S(u==null?void 0:u.attributes)}:null}const t=i.split("."),a=i.length-t[t.length-1].length,s=t.slice(0,-1),[n,...r]=s;if(n==="entity")return r.length===0?{offset:a,options:q(e.entity)}:r.length===1&&r[0]==="attributes"?{offset:a,options:S((c=e.entity)==null?void 0:c.attributes)}:null;if(n==="variables"||n==="config"){let h=n==="variables"?e.variables:e.config;for(const p of r)h=h==null?void 0:h[p];return{offset:a,options:S(h)}}if(n==="hass"){if(r.length===0)return{offset:a,options:[{label:"user.",detail:"current user",type:"namespace"}]};if(r.length===1&&r[0]==="user")return{offset:a,options:[{label:"name",apply:"name}",detail:"user name",type:"property"}]}}return null}d(Fe,"tokenOptions");function Ne(i,e={}){var r;const t=/\b(?:states|is_state|state_attr|has_value)\(\s*['"]([\w.]*)$/.exec(i);if(t)return{from:i.length-t[1].length,options:L(e.states,"")};const a=i.lastIndexOf("[[[");if(a>=0&&i.indexOf("]]]",a)<0){const o=/(?:\b(entity\.attributes|variables)\.|states\[\s*['"])([\w.]*)$/.exec(i);if(!o)return null;const c=o[2],h=o[1]==="entity.attributes"?S((r=e.entity)==null?void 0:r.attributes,""):o[1]==="variables"?S(e.variables,""):L(e.states,"");return{from:i.length-c.length,options:h}}const s=/\{([^{}\s]*)$/.exec(i);if(!s||i[s.index-1]==="{"||s[1].startsWith("%"))return null;const n=Fe(s[1],e);return n?{from:s.index+1+n.offset,options:n.options}:null}d(Ne,"templateCompletions");const ee=new ye({regexp:/\[\[\[|\]\]\]|\{\{[^\n]*?\}\}|\{%[^\n]*?%\}|\{(?:theme|ds|datasource):[^{}\n]*\}|\{[a-z_][\w.]*\}/gi,decoration:d(i=>_e.mark({class:i[0].startsWith("[[[")||i[0].startsWith("]]]")?"tpl-js":i[0].startsWith("{{")||i[0].startsWith("{%")?"tpl-jinja":"tpl-token"}),"decoration")}),Re=we.fromClass(class{constructor(i){this.decorations=ee.createDeco(i)}update(i){this.decorations=ee.updateDeco(i,this.decorations)}},{decorations:d(i=>i.decorations,"decorations")}),U=class U2 extends z{static get properties(){return{value:{type:String},placeholder:{type:String},getCompletionData:{attribute:false}}}constructor(){super(),this.value="",this.placeholder="Type a template. Ctrl+Space lists what can go next.",this.getCompletionData=()=>({}),this._view=null,this._timer=null,this._updating=false}static get styles(){return E`
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
        `}render(){return l`<div class="mount" @keydown=${this._keepKeys}></div>`}_keepKeys(e){e.key.length===1&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.stopPropagation(),e.key==="Escape"&&e.defaultPrevented&&e.stopPropagation()}firstUpdated(){const e=d(t=>{var o;const a=t.state.doc.lineAt(t.pos),s=t.state.sliceDoc(Math.max(0,t.pos-400),t.pos),n=Ne(s,((o=this.getCompletionData)==null?void 0:o.call(this))??{});if(!n)return null;const r=t.pos-(s.length-n.from);return r<a.from&&!t.explicit?null:{from:r,options:n.options,validFor:/^[\w.]*$/}},"source");this._view=new D({parent:this.renderRoot.querySelector(".mount")??void 0,state:xe.create({doc:this.value??"",extensions:[ke(),D.lineWrapping,Se(this.placeholder),Te({override:[e],activateOnTyping:true,maxRenderedOptions:40}),Ce.of([...je,...Oe,...Ae]),$e,Re,D.updateListener.of(t=>{if(t.docChanged&&!this._updating&&this._schedule(),t.docChanged&&t.transactions.some(a=>a.isUserEvent("input.type"))){let a="";t.changes.iterChanges((s,n,r,o,c)=>{a=c.toString()}),/[.:{'"[]$/.test(a)&&queueMicrotask(()=>this._view&&G(this._view))}})]})})}updated(e){e.has("value")&&this._view&&this.value!==this._view.state.doc.toString()&&(this._updating=true,this._view.dispatch({changes:{from:0,to:this._view.state.doc.length,insert:this.value??""}}),this._updating=false)}disconnectedCallback(){var e;super.disconnectedCallback(),clearTimeout(this._timer??void 0),(e=this._view)==null||e.destroy(),this._view=null}_schedule(){clearTimeout(this._timer??void 0),this._timer=setTimeout(()=>this._emit(),300)}_emit(){var t;this._timer=null;const e=((t=this._view)==null?void 0:t.state.doc.toString())??this.value;this.value=e,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:true,composed:true}))}flush(){this._timer&&(clearTimeout(this._timer??void 0),this._emit())}insert(e,t=0){const a=this._view;if(!a)return;const{from:s,to:n}=a.state.selection.main;a.dispatch({changes:{from:s,to:n,insert:e},selection:{anchor:s+e.length+t}}),a.focus(),/[.:{]$/.test(e)&&t===0&&G(a)}focus(){var e;(e=this._view)==null||e.focus()}};d(U,"LCARdSTemplateEditor");let J=U;customElements.get("lcards-template-editor")||customElements.define("lcards-template-editor",J);const We=ve(ge.templates),Ve=[{label:"Entity",text:"{entity."},{label:"Other entity",text:"{states."},{label:"Data source",text:"{ds:"},{label:"Theme",text:"{theme:"},{label:"Variable",text:"{variables."},{label:"JavaScript",text:"[[[ return  ]]]",caret:-4},{label:"Jinja2",text:"{{  }}",caret:-3}],He=[["{entity.state}","The card's entity (also entity.attributes.NAME)"],["{states.light.desk.state}","Any entity by its ID"],["{ds:name:.1f}","A data source value, with an optional number format"],["{theme:colors.text.onDark}","A theme token"],["{variables.NAME}","One of the card's variables"],["[[[ return ... ]]]","JavaScript: entity, states, variables, config, hass, theme, user"],["{{ states('sun.sun') }}","Jinja2, run by Home Assistant (test values don't apply)"]],Ue={ok:{icon:"mdi:check-circle",text:"Resolved"},partial:{icon:"mdi:alert",text:"Resolved with gaps"},failed:{icon:"mdi:close-circle",text:"Didn't resolve"},empty:{icon:"mdi:circle-outline",text:"Empty result"}},B=class B2 extends z{static get properties(){return{hass:{type:Object},config:{type:Object},open:{type:Boolean},initialData:{type:Object},_template:{type:String,state:true},_path:{type:String,state:true},_entityId:{type:String,state:true},_testText:{type:String,state:true},_result:{type:Object,state:true},_evaluating:{type:Boolean,state:true}}}constructor(){super(),this.hass=void 0,this.config=void 0,this.open=false,this.initialData=null,this._template="",this._path="",this._entityId="",this._testText="",this._result=null,this._evaluating=false,this._run=0,this._subscriptions=new Map,this._seenStates=new Map}static get styles(){return[de,W,E`
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .used .val {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
        `]}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeAll()}willUpdate(e){e.has("open")&&this.open&&this._reset()}updated(e){e.has("open")&&!this.open&&this._unsubscribeAll(),e.has("hass")&&this.open&&this._result&&this._usedStatesChanged()&&this._evaluate()}_reset(){var t;const e=this.initialData||{};this._template=e.template??"",this._path=e.path??"",this._entityId=e.entity??((t=this.config)==null?void 0:t.entity)??"",this._testText="",this._result=null,this._evaluate()}get _test(){return Pe(this._testText)}_dataSourceManager(e){var a,s;const t=(s=(a=window.lcards)==null?void 0:a.core)==null?void 0:s.dataSourceManager;return{sources:(t==null?void 0:t.sources)??new Map,getSource:d(n=>{var r;if(e[n]!==void 0){const o=e[n];return{id:n,_isTest:true,getCurrentData:d(()=>({v:o,value:o,t:Date.now(),metadata:{}}),"getCurrentData"),subscribe:d(()=>()=>{},"subscribe"),unsubscribe(){}}}return((r=t==null?void 0:t.getSource)==null?void 0:r.call(t,n))??null},"getSource")}}async _evaluate(){var g,w,v,k;const e=this._template,t=++this._run;if(!e.trim()){this._result=null,this._syncSubscriptions([]);return}const{value:a}=this._test,s=Q({hass:this.hass,entityId:this._entityId,test:a}),n=ne(e,{entityId:this._entityId});this._syncSubscriptions(n.datasources),this._evaluating=true;const r=performance.now();let o="",c="";try{const _=new re({hass:s.hass,context:he({hass:s.hass,config:this.config??{},entity:s.entity,variables:s.variables,theme:(k=(v=(w=(g=window.lcards)==null?void 0:g.core)==null?void 0:w.themeManager)==null?void 0:v.getActiveTheme)==null?void 0:k.call(v)}),dataSourceManager:this._dataSourceManager(s.ds)});o=String(await _.evaluateAsync(e)??"")}catch(_){c=(_==null?void 0:_.message)??String(_),C.debug("[TemplateSandbox] Evaluation failed",{error:c})}if(t!==this._run)return;const h=this._used(n,s),p=ue(o),u=h.filter(_=>_.source==="missing"),f=c||p.length&&o.trim()===e.trim()?"failed":p.length||u.length?"partial":o.trim()?"ok":"empty";this._result={value:o,error:c,gaps:p,used:h,status:f,ms:Math.round(performance.now()-r)},this._rememberStates(n.entities),this._evaluating=false}_used(e,t){var c,h,p,u,f,g,w,v,k,_;const a=[],s=((c=t.hass)==null?void 0:c.states)??{};for(const b of e.entities){const y=s[b];a.push({kind:"entity",icon:"mdi:home-outline",name:b,value:y?X(t.hass,y):"",source:y?t.testEntities.includes(b)?"test":"live":"missing"})}const n=(p=(h=window.lcards)==null?void 0:h.core)==null?void 0:p.dataSourceManager;for(const b of e.datasources){const y=t.ds[b]!==void 0,x=y?{v:t.ds[b]}:(g=(f=(u=n==null?void 0:n.getSource)==null?void 0:u.call(n,b))==null?void 0:f.getCurrentData)==null?void 0:g.call(f);a.push({kind:"ds",icon:"mdi:database",name:b,value:x&&x.v!==void 0&&x.v!==null?String(x.v):"",source:y?"test":x?"live":"missing"})}const r=((w=this.config)==null?void 0:w.variables)??{};for(const b of e.variables){const y=t.variables[b]!==void 0,x=y?t.variables[b]:r[b];a.push({kind:"variable",icon:"mdi:variable",name:b,value:x===void 0?"":typeof x=="object"?JSON.stringify(x):String(x),source:y?"test":x!==void 0?"card":"missing"})}const o=(k=(v=window.lcards)==null?void 0:v.core)==null?void 0:k.themeManager;for(const b of e.themeTokens){const y=(_=o==null?void 0:o.getToken)==null?void 0:_.call(o,b);a.push({kind:"theme",icon:"mdi:palette",name:b,value:y==null?"":typeof y=="object"?JSON.stringify(y):String(y),source:y==null?"missing":"theme"})}return a}_rememberStates(e){this._seenStates=new Map(e.map(t=>{var a,s;return[t,(s=(a=this.hass)==null?void 0:a.states)==null?void 0:s[t]]}))}_usedStatesChanged(){var e,t;for(const[a,s]of this._seenStates)if(((t=(e=this.hass)==null?void 0:e.states)==null?void 0:t[a])!==s)return true;return false}_syncSubscriptions(e){var a,s,n;const t=(s=(a=window.lcards)==null?void 0:a.core)==null?void 0:s.dataSourceManager;for(const[r,o]of this._subscriptions)e.includes(r)||(o==null||o(),this._subscriptions.delete(r));for(const r of e){if(this._subscriptions.has(r))continue;const o=(n=t==null?void 0:t.getSource)==null?void 0:n.call(t,r);typeof(o==null?void 0:o.subscribe)=="function"&&this._subscriptions.set(r,o.subscribe(()=>this._scheduleEvaluate()))}}_unsubscribeAll(){for(const e of this._subscriptions.values())e==null||e();this._subscriptions.clear(),clearTimeout(this._evalTimer)}_scheduleEvaluate(){clearTimeout(this._evalTimer),this._evalTimer=setTimeout(()=>this._evaluate(),250)}_completionData(){var s,n,r,o,c,h,p,u,f,g,w;const{value:e}=this._test,t=Q({hass:this.hass,entityId:this._entityId,test:e}),a=(n=(s=window.lcards)==null?void 0:s.core)==null?void 0:n.dataSourceManager;return{entity:t.entity,states:((r=t.hass)==null?void 0:r.states)??{},datasources:[...new Set([...((c=(o=a==null?void 0:a.sources)==null?void 0:o.keys)==null?void 0:c.call(o))??[],...Object.keys(t.ds)])],themeTokens:((g=(f=(u=(p=(h=window.lcards)==null?void 0:h.core)==null?void 0:p.themeManager)==null?void 0:u.getActiveTheme)==null?void 0:f.call(u))==null?void 0:g.tokens)??{},variables:{...((w=this.config)==null?void 0:w.variables)??{},...t.variables},config:this.config??{}}}get _editor(){return this.renderRoot.querySelector("lcards-template-editor")}_onTemplate(e){e.stopPropagation(),this._template=e.detail.value,this._evaluate()}_insert(e,t=0){const a=this._editor;a==null||a.insert(e,t)}_loadExample(e){const t=P[e];t&&(this._template=t.template,this._testText=t.test?be(t.test):"",this._evaluate())}_onEntity(e){e.stopPropagation(),this._entityId=e.detail.value??"",this._evaluate()}_onTestValues(e){e.stopPropagation(),this._testText=e.detail.value??"",this._scheduleEvaluate()}_close(){this.open=false,this.dispatchEvent(new CustomEvent("sandbox-closed",{bubbles:true,composed:true}))}_save(){var e;(e=this._editor)==null||e.flush(),this.dispatchEvent(new CustomEvent("template-save",{detail:{path:this._path,value:this._template},bubbles:true,composed:true})),this._close()}render(){return this.open?l`
            <ha-dialog
                open
                flexcontent
                ?prevent-scrim-close=${!!this._path}
                header-title=${this._path?`Template: ${this._path}`:"Template Sandbox"}
                @closed=${e=>{e.stopPropagation(),e.target===e.currentTarget&&this._close()}}>
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
                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" appearance="plain" @click=${()=>{var e;return j(((e=this._editor)==null?void 0:e.value)??this._template)}}>
                        <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                        Copy template
                    </ha-button>
                    ${this._path?l`
                        <ha-button slot="secondaryAction" appearance="plain" data-dialog="close">Cancel</ha-button>
                        <ha-button slot="primaryAction" variant="brand" @click=${this._save}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Save to ${this._path}
                        </ha-button>
                    `:l`<ha-button slot="primaryAction" data-dialog="close">Close</ha-button>`}
                </ha-dialog-footer>
            </ha-dialog>
        `:m}_renderEditor(){const e=pe(this._template);return l`
            <div class="editor-head">
                <h3>Template</h3>
                <div class="kinds">${e.map(t=>l`<span class="kind">${t}</span>`)}</div>
            </div>
            <lcards-template-editor
                .value=${this._template}
                .getCompletionData=${()=>this._completionData()}
                @value-changed=${this._onTemplate}>
            </lcards-template-editor>
            <div class="inserts">
                <span class="hint">Insert</span>
                ${Ve.map(t=>l`
                    <ha-button size="s" appearance="outlined" variant="brand" @click=${()=>this._insert(t.text,t.caret??0)}>${t.label}</ha-button>
                `)}
            </div>
            <div class="examples">
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Load an example"}
                    .required=${false}
                    .selector=${{select:{mode:"dropdown",options:Le().map(t=>({value:t,label:P[t].name}))}}}
                    .value=${""}
                    @value-changed=${t=>{t.stopPropagation(),t.detail.value&&this._loadExample(t.detail.value)}}>
                </ha-selector>
            </div>
        `}_renderContext(){var a,s;const e=this._entityId?(s=(a=this.hass)==null?void 0:a.states)==null?void 0:s[this._entityId]:null,{error:t}=this._test;return l`
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
                    ${this._entityId?e?`Live: ${X(this.hass,e)} · ${Object.keys(e.attributes??{}).length} attributes`:`${this._entityId} isn't in Home Assistant: give it test values below.`:"No entity: {entity.…} has nothing to read."}
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
                ${t?l`<div class="banner error test-error">${t}</div>`:m}
            </lcards-form-section>
        `}_renderResult(){const e=this._result;if(!e)return l`
                <div class="result">
                    <div class="value placeholder">The result shows here as you type.</div>
                </div>
            `;const t=Ue[e.status];return l`
            <div class="result">
                <div class="status ${e.status}">
                    <ha-icon icon=${t.icon}></ha-icon>
                    ${t.text}
                    <span class="time">${this._evaluating?"Running…":`${e.ms} ms`}</span>
                </div>
                <div class="value">${e.error||e.value||" "}</div>
                ${e.gaps.length?l`
                    <ul class="gaps">${e.gaps.map(a=>l`<li>Not resolved: <code>${a}</code></li>`)}</ul>
                `:m}
            </div>
        `}_renderUsed(){var t;const e=((t=this._result)==null?void 0:t.used)??[];return e.length?l`
            <lcards-form-section header="What it used" icon="mdi:link-variant" ?expanded=${true}>
                <table class="used">
                    ${e.map(a=>l`
                        <tr>
                            <td><ha-icon icon=${a.icon}></ha-icon></td>
                            <td class="name">${a.name}</td>
                            <td class="val">
                                ${a.kind==="theme"&&oe(a.value)?l`<span class="swatch" style=${T({background:a.value})}></span>`:m}
                                ${a.value||"-"}
                            </td>
                            <td><span class="src ${a.source==="card"||a.source==="theme"?"live":a.source}">${a.source}</span></td>
                        </tr>
                    `)}
                </table>
            </lcards-form-section>
        `:m}_renderSyntax(){return l`
            <lcards-form-section header="Syntax" icon="mdi:code-braces" ?expanded=${!this._template}>
                <div class="syntax">
                    ${He.map(([e,t])=>l`
                        <button @click=${()=>this._insert(e)} title="Insert">
                            <code>${e}</code><span>${t}</span>
                        </button>
                    `)}
                </div>
                <p class="docs"><a href=${We} target="_blank" rel="noopener">Templates guide</a></p>
            </lcards-form-section>
        `}};d(B,"LCARdSTemplateSandbox");let F=B;customElements.get("lcards-template-sandbox")||customElements.define("lcards-template-sandbox",F);const K=class K2 extends z{static get properties(){return{editor:{type:Object},config:{type:Object},hass:{type:Object},_rows:{type:Array,state:true},_sandboxOpen:{type:Boolean,state:true},_sandboxInitialData:{type:Object,state:true}}}constructor(){super(),this.editor=void 0,this.config=void 0,this.hass=void 0,this._rows=[],this._sandboxOpen=false,this._sandboxInitialData=null,this._run=0,this._seenStates=new Map}static get styles(){return[W,le,E`
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
            }

            .empty {
                margin: 0;
            }
        `]}updated(e){e.has("config")?this._discover():e.has("hass")&&this._statesChanged()&&this._evaluate()}_discover(){this._rows=Me(this.config??{}).map(e=>({...e,status:"pending",result:""})),this._evaluate()}async _evaluate(){var r,o;const e=++this._run,t=this.config??{},a=t.entity?((o=(r=this.hass)==null?void 0:r.states)==null?void 0:o[t.entity])??null:null,s=new Set,n=await Promise.all(this._rows.map(async c=>{var h,p,u,f,g,w;ne(c.value,{entityId:t.entity}).entities.forEach(v=>s.add(v));try{const v=new re({hass:this.hass,context:he({hass:this.hass,config:t,entity:a,theme:(f=(u=(p=(h=window.lcards)==null?void 0:h.core)==null?void 0:p.themeManager)==null?void 0:u.getActiveTheme)==null?void 0:f.call(u)}),dataSourceManager:(w=(g=window.lcards)==null?void 0:g.core)==null?void 0:w.dataSourceManager}),k=String(await v.evaluateAsync(c.value)??""),_=ue(k),b=_.length&&k.trim()===c.value.trim()?"failed":_.length?"partial":"ok";return{...c,result:k,status:b}}catch(v){return C.debug("[TemplateEvaluationTab] Evaluation failed",{path:c.path,error:v==null?void 0:v.message}),{...c,result:(v==null?void 0:v.message)??String(v),status:"failed"}}}));e===this._run&&(this._seenStates=new Map([...s].map(c=>{var h,p;return[c,(p=(h=this.hass)==null?void 0:h.states)==null?void 0:p[c]]})),this._rows=n)}_statesChanged(){var e,t;for(const[a,s]of this._seenStates)if(((t=(e=this.hass)==null?void 0:e.states)==null?void 0:t[a])!==s)return true;return false}render(){const e=new Set(this._rows.flatMap(a=>a.kinds)),t=this._rows.filter(a=>a.status==="failed"||a.status==="partial"||a.mistakes.length).length;return l`
            ${ce({icon:"mdi:code-braces-box",title:"Templates",description:"Every template in this card's config, evaluated live. Test one, or try new ones, in the sandbox.",stats:[{value:this._rows.length,label:this._rows.length===1?"field with a template":"fields with templates"},{value:e.size,label:e.size===1?"kind":"kinds"},...t?[{value:t,label:t===1?"needs a look":"need a look"}]:[]],actions:[{label:"Open sandbox",icon:"mdi:flask-outline",onClick:d(()=>this._openSandbox(),"onClick")}]})}
            ${this._rows.length?l`
                <div class="fields">${this._rows.map(a=>this._renderRow(a))}</div>
            `:l`<p class="hint empty">No templates in this card's config yet. Try one in the sandbox.</p>`}
            <lcards-template-sandbox
                .hass=${this.hass}
                .config=${this.config}
                .open=${this._sandboxOpen}
                .initialData=${this._sandboxInitialData}
                @sandbox-closed=${this._handleSandboxClosed}
                @template-save=${this._handleSave}>
            </lcards-template-sandbox>
        `}_renderRow(e){const t={ok:"mdi:check-circle",partial:"mdi:alert",failed:"mdi:close-circle",pending:"mdi:timer-sand"}[e.status];return l`
            <div class="field">
                <div class="field-head">
                    <span class="path">${e.path}</span>
                    ${e.kinds.map(a=>l`<span class="kind">${a}</span>`)}
                    <div class="actions">
                        <ha-icon-button .label=${"Copy template"} title="Copy template" @click=${()=>j(e.value)}>
                            <ha-icon icon="mdi:content-copy"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button .label=${"Open in sandbox"} title="Open in sandbox" @click=${()=>this._openSandbox({template:e.value,path:e.path})}>
                            <ha-icon icon="mdi:flask-outline"></ha-icon>
                        </ha-icon-button>
                    </div>
                </div>
                <div class="template">${e.value}</div>
                <div class="result ${e.status}">
                    <ha-icon icon=${t}></ha-icon>
                    <span class="value">${e.status==="pending"?"Evaluating…":e.result||"(empty)"}</span>
                </div>
                ${e.mistakes.map(a=>l`<div class="mistake"><code>${a.match}</code>: ${a.message}</div>`)}
            </div>
        `}_openSandbox(e={}){var t;this._sandboxInitialData={entity:(t=this.config)==null?void 0:t.entity,...e},this._sandboxOpen=true}_handleSandboxClosed(){this._sandboxOpen=false,this._sandboxInitialData=null}_handleSave(e){var r;const{path:t,value:a}=e.detail??{};if(!t||!((r=this.editor)!=null&&r._updateConfig))return;const s=V(t)[0],n=Ie(this.editor.config??this.config??{},t,a);this.editor._updateConfig({[s]:n[s]}),C.debug("[TemplateEvaluationTab] Saved template to",t)}};d(K,"LCARdSTemplateEvaluationTab");let N=K;customElements.get("lcards-template-evaluation-tab")||customElements.define("lcards-template-evaluation-tab",N);const O={card_defaults:{label:"Card defaults",icon:"mdi:cog"},theme_defaults:{label:"Theme defaults",icon:"mdi:palette"},user_config:{label:"Your config",icon:"mdi:account"}},A={"built-in":{label:"Built-in default",icon:"mdi:cog-outline"},component:{label:"Component",icon:"mdi:puzzle"},"component-preset":{label:"Component preset",icon:"mdi:puzzle-star"},range:{label:"Range",icon:"mdi:arrow-expand-horizontal"},"preset-default":{label:"Preset default",icon:"mdi:package-variant"},state:{label:"State branch",icon:"mdi:toggle-switch"}},M={override:{label:"Override",icon:"mdi:account-edit"},lookup:{label:"Theme token",icon:"mdi:palette"},reference:{label:"Refers to",icon:"mdi:arrow-right"},computed:{label:"Computed",icon:"mdi:function-variant"},"css-var":{label:"CSS variable",icon:"mdi:variable"},value:{label:"Value on this card",icon:"mdi:eyedropper"},missing:{label:"Not in the theme",icon:"mdi:alert"},circular:{label:"Circular reference",icon:"mdi:alert"}},Be=[{value:"all",label:"All fields"},{value:"changed",label:"Changed from defaults"},{value:"rules",label:"Set by rules now"},{value:"templates",label:"Templates"},{value:"tokens",label:"Theme tokens"},{value:"runtime",label:"Set by the card"}];function I(i){if(O[i])return O[i].label;if(A[i])return A[i].label;if(i==="rules")return"Rule";const e=/^(preset|component)_(.+)$/.exec(i??"");return e?`${e[1]==="preset"?"Preset":"Component"}: ${e[2]}`:i??""}d(I,"layerLabel");function te(i){return O[i]?O[i].icon:A[i]?A[i].icon:i==="rules"?"mdi:format-list-checks":/^preset_/.test(i??"")?"mdi:package-variant-closed":/^component_/.test(i??"")?"mdi:puzzle":"mdi:circle-small"}d(te,"layerIcon");function Ke(i){return i==="user_config"?"user":i==="rules"?"rule":/^preset|^component/.test(i??"")?"preset":i==="theme_defaults"?"theme":"card"}d(Ke,"badgeClass");function $(i){if(i===void 0)return"(not set)";if(i===null)return"null";if(typeof i=="object")try{return JSON.stringify(i)}catch{return String(i)}return String(i)}d($,"show");const ae=oe,se=d(i=>/^[\w[\].-]+$/.test(i),"isFieldPath");function Ye(i,e){let t=i;for(const a of V(e)){if(t==null)return;t=t[a]}return t}d(Ye,"valueAt");const Y=class Y2 extends z{static get properties(){return{editor:{type:Object},config:{type:Object},hass:{type:Object},_provenance:{type:Object,state:true},_cardConfig:{type:Object,state:true},_open:{type:Boolean,state:true},_view:{type:String,state:true},_search:{type:String,state:true},_show:{type:String,state:true},_selected:{type:String,state:true},_selectedToken:{type:String,state:true},_live:{type:Boolean,state:true},_stale:{type:Boolean,state:true},_collapsed:{type:Object,state:true}}}constructor(){super(),this.editor=void 0,this.config=void 0,this.hass=void 0,this._provenance=null,this._provenanceTracker=null,this._card=void 0,this._cardConfig=null,this._open=false,this._view="fields",this._search="",this._show="all",this._selected="",this._selectedToken="",this._live=true,this._stale=false,this._collapsed=new Set,this._unsubscribe=null}static get styles(){return[de,W,le,E`
            :host {
                display: block;
            }

            .studio-layout {
                grid-template-columns: minmax(280px, 38%) 1fr;
                grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
            }

            .left-head {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
                padding: var(--ha-space-3) var(--ha-space-4) var(--ha-space-2);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .left-head ha-input,
            .left-head ha-selector {
                display: block;
                width: 100%;
            }

            .list {
                flex: 1;
                overflow-y: auto;
                padding: var(--ha-space-2);
                min-height: 0;
            }

            .row {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                padding: 5px var(--ha-space-2);
                padding-left: calc(var(--ha-space-2) + var(--depth, 0) * var(--ha-space-4));
                border-radius: var(--ha-border-radius-sm);
                cursor: pointer;
                color: var(--primary-text-color);
                font-size: 14px;
                user-select: none;
            }

            .row:hover {
                background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
            }

            .row.selected {
                background: color-mix(in srgb, var(--primary-color) 28%, transparent);
            }

            .row .name {
                flex: 1;
                min-width: 0;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .row .twisty {
                --mdc-icon-size: 16px;
                width: 16px;
                flex: none;
                color: var(--secondary-text-color);
            }

            .row .marks {
                display: flex;
                gap: 2px;
                --mdc-icon-size: 14px;
                color: var(--secondary-text-color);
            }

            .badge {
                flex: none;
                font-size: 12px;
                font-weight: 600;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                white-space: nowrap;
                color: var(--primary-text-color);
                background: color-mix(in srgb, var(--secondary-text-color) 22%, transparent);
            }

            .badge.user { background: color-mix(in srgb, var(--success-color) 30%, transparent); }
            .badge.preset { background: color-mix(in srgb, var(--warning-color) 30%, transparent); }
            .badge.theme { background: color-mix(in srgb, var(--info-color, #03a9f4) 30%, transparent); }
            .badge.rule { background: color-mix(in srgb, var(--error-color) 32%, transparent); }

            .empty {
                padding: var(--ha-space-6) var(--ha-space-4);
                text-align: center;
            }

            /* Detail pane */
            .preview-panel {
                overflow-y: auto;
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .head-row {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                flex-wrap: wrap;
            }

            .head-row .live {
                display: flex;
                align-items: center;
                gap: var(--ha-space-1);
                margin-left: auto;
            }

            .chip {
                font-size: 12px;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
                color: var(--secondary-text-color);
            }

            .chip.alert {
                background: color-mix(in srgb, var(--error-color) 30%, transparent);
                color: var(--primary-text-color);
            }

            .detail-title {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
            }

            .detail-title h3 {
                margin: 0;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 16px;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .detail-title ha-icon-button,
            .head-row ha-icon-button {
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--secondary-text-color);
            }

            .now {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-3) var(--ha-space-4);
            }

            .now .label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--secondary-text-color);
            }

            .now .value {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                margin-top: var(--ha-space-1);
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 18px;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .now .hint {
                margin: var(--ha-space-1) 0 0;
            }

            .swatch {
                flex: none;
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .trail-title {
                margin: var(--ha-space-2) 0 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .trail {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-3);
            }

            .step {
                display: grid;
                grid-template-columns: 24px 1fr;
                gap: var(--ha-space-2);
                align-items: start;
                padding: var(--ha-space-2);
                border-radius: var(--ha-border-radius-md);
                background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
            }

            .step.wins {
                box-shadow: inset var(--ha-border-width-lg) 0 0 var(--primary-color);
                background: color-mix(in srgb, var(--primary-color) 12%, transparent);
            }

            .step.overridden {
                opacity: 0.6;
            }

            .step > ha-icon {
                --mdc-icon-size: 18px;
                color: var(--secondary-text-color);
                margin-top: 1px;
            }

            .step .what {
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .step .what .tag {
                font-weight: 400;
                color: var(--secondary-text-color);
                margin-left: var(--ha-space-1);
            }

            .step .val {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                margin-top: 2px;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 13px;
                color: var(--secondary-text-color);
                overflow-wrap: anywhere;
            }

            .step .swatch {
                width: 12px;
                height: 12px;
            }

            .step .sub {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 2px;
                overflow-wrap: anywhere;
            }

            .chain {
                display: flex;
                flex-direction: column;
                gap: 2px;
                margin-top: var(--ha-space-1);
            }

            .uses {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-1);
            }

            .uses button,
            .link {
                all: unset;
                cursor: pointer;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 13px;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
            }

            .uses button:focus-visible,
            .uses button:hover,
            .link:focus-visible,
            .link:hover {
                background: color-mix(in srgb, var(--primary-color) 32%, transparent);
            }

            .placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: var(--ha-space-2);
                flex: 1;
                color: var(--secondary-text-color);
                text-align: center;
            }

            .placeholder ha-icon {
                --mdc-icon-size: 40px;
                opacity: 0.6;
            }
        `]}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._unsubscribe)==null||e.call(this),this._unsubscribe=null,this._card=void 0}updated(e){e.has("config")&&this.config&&this._loadProvenance()}async _loadProvenance(){var e,t;try{const a=this.config?(t=(e=window.lcards)==null?void 0:e.findCardByConfig)==null?void 0:t.call(e,this.config):null;this._setCard(a&&typeof a.getProvenance=="function"?a:null)}catch(a){C.error("[ProvenanceTab] Failed to load provenance:",a),this._setCard(null)}}_setCard(e){var t,a;e!==this._card&&((t=this._unsubscribe)==null||t.call(this),this._unsubscribe=((a=e==null?void 0:e.subscribeProvenance)==null?void 0:a.call(e,()=>{this._live?this._read():this._stale=true}))??null,this._card=e),this._read()}_read(){const e=this._card;this._provenance=e?e.getProvenance():null,this._provenanceTracker=(e==null?void 0:e._provenanceTracker)??null,this._cardConfig=(e==null?void 0:e.config)??null,this._stale=false}_fields(){var s;const e=this._provenance;if(!e)return[];const t=new Map,a=d(n=>(t.has(n)||t.set(n,{path:n,layers:null,final:null,runtime:[],rule:null,template:null,tokens:[]}),t.get(n)),"get");for(const[n,r]of Object.entries(((s=e.config)==null?void 0:s.field_sources)??{})){const o=a(n);o.layers=typeof r=="string"?{[r]:void 0}:r.layers,o.final=typeof r=="string"?r:r.final}for(const[n,r]of Object.entries(e.runtime??{}))a(n).runtime=r;for(const[n,r]of Object.entries(e.rule_patches??{}))a(n).rule=r;for(const[n,r]of Object.entries(e.templates??{}))n.startsWith("template:")||(a(n).template=r);for(const[n,r]of Object.entries(e.theme_tokens??{}))for(const o of r.used_by_fields??[])se(o)&&a(o).tokens.push(n);for(const n of t.values())n.source=n.rule?"rules":n.final??(n.runtime.length?n.runtime[n.runtime.length-1].layer:null);return[...t.values()].sort((n,r)=>n.path.localeCompare(r.path))}_filtered(){const e=this._search.trim().toLowerCase(),t={all:d(()=>true,"all"),changed:d(a=>a.final==="user_config"||!!a.rule||!!a.template,"changed"),rules:d(a=>!!a.rule,"rules"),templates:d(a=>!!a.template,"templates"),tokens:d(a=>a.tokens.length>0,"tokens"),runtime:d(a=>a.runtime.length>0,"runtime")}[this._show]??(()=>true);return this._fields().filter(a=>t(a)&&(!e||a.path.toLowerCase().includes(e)))}_rows(e){const t={children:new Map};for(const r of e){const o=r.path.split(".");let c=t;o.forEach((h,p)=>{const u=o.slice(0,p+1).join(".");c.children.has(h)||c.children.set(h,{seg:h,path:u,children:new Map,field:null}),c=c.children.get(h)}),c.field=r}const a=[],s=!!this._search.trim()||this._show!=="all",n=d((r,o)=>{for(const c of[...r.children.values()].sort((h,p)=>h.seg.localeCompare(p.seg))){const h=c.children.size>0,p=s||!this._collapsed.has(c.path);a.push({...c,depth:o,folder:h,open:p}),h&&p&&n(c,o+1)}},"walk");return n(t,0),a}_tokens(){var t;const e=this._search.trim().toLowerCase();return Object.entries(((t=this._provenance)==null?void 0:t.theme_tokens)??{}).map(([a,s])=>({path:a,...s})).filter(a=>!e||a.path.toLowerCase().includes(e)||(a.used_by_fields??[]).some(s=>s.toLowerCase().includes(e))).sort((a,s)=>a.path.localeCompare(s.path))}_concrete(e){const a=[...(e==null?void 0:e.resolution_chain)??[]].reverse().find(s=>s.step==="value");return(a==null?void 0:a.value)??(e==null?void 0:e.resolved_value)}_openInspector(){this._loadProvenance(),this._open=true}_close(){this._open=false}_toggleLive(e){this._live=e.target.checked,this._live&&this._read()}_toggleFolder(e){const t=new Set(this._collapsed);t.has(e)?t.delete(e):t.add(e),this._collapsed=t}_selectField(e){this._view="fields",this._selected=e}_selectToken(e){this._view="tokens",this._selectedToken=e}render(){const e=this._provenance,t=this._fields();return l`
            ${ce({icon:"mdi:layers-search",title:"Provenance",description:"Where each of this card's values comes from: its config and preset, the theme, rules, templates and the card itself.",stats:e?[{value:t.length,label:"fields"},{value:Object.keys(e.theme_tokens??{}).length,label:"theme tokens"},{value:new Set(Object.values(e.rule_patches??{}).map(a=>a.rule_id)).size,label:"rules applying now"},{value:t.filter(a=>a.template).length,label:"templates"}]:[],actions:[{label:"Open inspector",icon:"mdi:file-tree",onClick:d(()=>this._openInspector(),"onClick")}]})}
            ${!e&&this._card===null?l`<p class="hint">No rendered card for this config yet: provenance comes from the card editor's preview. Layout cards and the alert overlay don't record provenance.</p>`:m}
            ${this._open?this._renderInspector():m}
        `}_renderInspector(){const e=this._provenance,t=(e==null?void 0:e.context)??{};return l`
            <ha-dialog
                open
                flexcontent
                header-title=${`Provenance: ${t.card_id||t.card_type||"card"}`}
                @closed=${a=>{a.stopPropagation(),a.target===a.currentTarget&&this._close()}}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${a=>{var n,r;a.stopPropagation();const s=(r=(n=a.target.activeTab)==null?void 0:n.getAttribute)==null?void 0:r.call(n,"value");s&&(this._view=s)}}>
                                <ha-tab-group-tab value="fields" ?active=${this._view==="fields"}>
                                    <ha-icon icon="mdi:file-tree"></ha-icon>
                                    Fields
                                </ha-tab-group-tab>
                                <ha-tab-group-tab value="tokens" ?active=${this._view==="tokens"}>
                                    <ha-icon icon="mdi:palette"></ha-icon>
                                    Tokens
                                </ha-tab-group-tab>
                            </ha-tab-group>
                            ${this._renderLeft()}
                        </div>
                        <div class="preview-panel">
                            ${this._renderHeadRow(t)}
                            ${e?this._view==="tokens"?this._renderTokenDetail():this._renderFieldDetail():l`<div class="placeholder"><ha-icon icon="mdi:card-search-outline"></ha-icon><p>No rendered card for this config.</p></div>`}
                        </div>
                    </div>
                </div>
                <ha-dialog-footer slot="footer">
                    <ha-button slot="primaryAction" data-dialog="close">Close</ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_renderHeadRow(e){return l`
            <div class="head-row">
                ${e.theme?l`<span class="chip">Theme: ${e.theme}</span>`:m}
                ${e.alert_mode&&e.alert_mode!=="green_alert"?l`<span class="chip alert">Alert mode: ${e.alert_mode}</span>`:m}
                ${e.token_overrides?l`<span class="chip">${e.token_overrides} token overrides</span>`:m}
                ${e.entity?l`<span class="chip">${e.entity}: ${e.entity_state??"-"}</span>`:m}
                <span class="live">
                    ${this._live?m:l`
                        <ha-icon-button class="refresh" .label=${"Refresh"} title="Refresh" @click=${()=>this._read()}>
                            <ha-icon icon=${this._stale?"mdi:refresh-circle":"mdi:refresh"}></ha-icon>
                        </ha-icon-button>
                    `}
                    <ha-switch class="live-switch" .checked=${this._live} @change=${this._toggleLive}>${this._live?"Live":this._stale?"Paused (changed)":"Paused"}</ha-switch>
                </span>
            </div>
        `}_renderLeft(){return l`
            <div class="left-head">
                <ha-input
                    class="search"
                    .value=${this._search}
                    .label=${this._view==="tokens"?"Search tokens or fields":"Search fields"}
                    @input=${e=>{this._search=e.target.value??""}}>
                </ha-input>
                ${this._view==="fields"?l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Show"}
                        .required=${false}
                        .selector=${{select:{mode:"dropdown",options:Be}}}
                        .value=${this._show}
                        @value-changed=${e=>{e.stopPropagation(),this._show=e.detail.value||"all"}}>
                    </ha-selector>
                `:m}
            </div>
            <div class="list">
                ${this._view==="tokens"?this._renderTokenList():this._renderFieldList()}
            </div>
        `}_renderFieldList(){const e=this._filtered();return e.length?this._rows(e).map(t=>l`
            <div class="row field-row ${t.field&&t.path===this._selected?"selected":""}"
                data-path=${t.path}
                style=${T({"--depth":String(t.depth)})}
                @click=${()=>t.folder&&!t.field?this._toggleFolder(t.path):this._selectField(t.path)}>
                ${t.folder?l`<ha-icon class="twisty" icon=${t.open?"mdi:chevron-down":"mdi:chevron-right"}
                        @click=${a=>{a.stopPropagation(),this._toggleFolder(t.path)}}></ha-icon>`:l`<span class="twisty"></span>`}
                <span class="name">${t.seg}</span>
                ${t.field?l`
                    <span class="marks">
                        ${t.field.template?l`<ha-icon icon="mdi:code-braces" title="Template"></ha-icon>`:m}
                        ${t.field.tokens.length?l`<ha-icon icon="mdi:palette" title="Theme token"></ha-icon>`:m}
                    </span>
                    <span class="badge ${Ke(t.field.source)}">${I(t.field.source)}</span>
                `:m}
            </div>
        `):l`<p class="hint empty">No fields match.</p>`}_renderTokenList(){const e=this._tokens();return e.length?e.map(t=>{const a=this._concrete(t);return l`
                <div class="row token-row ${t.path===this._selectedToken?"selected":""}" data-path=${t.path} @click=${()=>this._selectToken(t.path)}>
                    ${ae(a)?l`<span class="swatch" style=${T({background:a})}></span>`:l`<ha-icon class="twisty" icon="mdi:palette"></ha-icon>`}
                    <span class="name">${t.path}</span>
                    <span class="badge" title="Fields using it">${(t.used_by_fields??[]).length}</span>
                </div>
            `}):l`<p class="hint empty">No theme tokens recorded for this card.</p>`}_renderFieldDetail(){var r,o;const e=this._fields().find(c=>c.path===this._selected);if(!e)return l`<div class="placeholder"><ha-icon icon="mdi:cursor-default-click-outline"></ha-icon>
                <p>Select a field to see its value and how it got there.</p></div>`;const t=e.runtime.find(c=>c.layer==="state"),a=Ye(this._cardConfig,e.path),s=t?t.value:a!==void 0?a:((r=e.rule)==null?void 0:r.patched_value)??((o=e.runtime[e.runtime.length-1])==null?void 0:o.value),n=e.tokens.length?this._concrete(this._provenance.theme_tokens[e.tokens[0]]):void 0;return l`
            <div class="detail-title">
                <h3>${e.path}</h3>
                <ha-icon-button .label=${"Copy field path"} title="Copy field path" @click=${()=>j(e.path)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
            <div class="now">
                <div class="label">Value now</div>
                <div class="value">${this._swatch(n??s)}${$(s)}</div>
                ${n!==void 0&&n!==s?l`<p class="hint">On this card: ${$(n)}</p>`:m}
            </div>
            <p class="trail-title">How it got here</p>
            <div class="trail">
                ${this._configSteps(e)}
                ${e.runtime.map(c=>this._runtimeStep(c))}
                ${e.tokens.map(c=>this._tokenStep(c))}
                ${e.template?this._templateStep(e.template):m}
                ${e.rule?this._ruleStep(e.rule):m}
            </div>
        `}_configSteps(e){var a;return e.layers?(((a=this._provenance.config)==null?void 0:a.merge_order)??Object.keys(e.layers)).filter(s=>s in e.layers).map(s=>{const n=s===e.final&&!e.rule;return l`
                <div class="step config-step ${n?"wins":"overridden"}">
                    <ha-icon icon=${te(s)}></ha-icon>
                    <div>
                        <div class="what">${I(s)}<span class="tag">${n?"sets it":"replaced below"}</span></div>
                        <div class="val">${this._swatch(e.layers[s])}${$(e.layers[s])}</div>
                    </div>
                </div>
            `}):m}_runtimeStep(e){const t=e.detail??{},a=[e.layer==="state"&&`branch "${t.state??"none"}" for state ${t.entityState??"-"}${t.classified?` (${t.classified})`:""}`,t.matchLight!==void 0&&`light colour ${t.matchLight}`,t.component&&`component ${t.component}`,t.preset&&`preset ${t.preset}`,t.token&&`from theme:${t.token}${t.fallback?" (not in the theme: the card's fallback)":""}`,t.from].filter(Boolean);return l`
            <div class="step runtime-step" data-layer=${e.layer}>
                <ha-icon icon=${te(e.layer)}></ha-icon>
                <div>
                    <div class="what">${I(e.layer)}<span class="tag">applied by the card</span></div>
                    <div class="val">${this._swatch(e.value)}${$(e.value)}</div>
                    ${a.length?l`<div class="sub">${a.join(" · ")}</div>`:m}
                </div>
            </div>
        `}_tokenStep(e){const t=this._provenance.theme_tokens[e];return t?l`
            <div class="step token-step">
                <ha-icon icon="mdi:palette"></ha-icon>
                <div>
                    <div class="what">Theme token<span class="tag">${t.original_ref}</span></div>
                    <div class="chain">${(t.resolution_chain??[]).map(a=>this._chainLine(a))}</div>
                    <div class="sub"><button class="link" @click=${()=>this._selectToken(e)}>Open token</button></div>
                </div>
            </div>
        `:m}_templateStep(e){var t;return l`
            <div class="step template-step">
                <ha-icon icon="mdi:code-braces"></ha-icon>
                <div>
                    <div class="what">Template<span class="tag">${e.processor}</span></div>
                    <div class="val">${e.original}</div>
                    <div class="sub">Result: ${$(e.processed)}</div>
                    ${(t=e.dependencies)!=null&&t.length?l`<div class="sub">Uses: ${e.dependencies.join(", ")}</div>`:m}
                </div>
            </div>
        `}_ruleStep(e){return l`
            <div class="step rule-step wins">
                <ha-icon icon="mdi:format-list-checks"></ha-icon>
                <div>
                    <div class="what">Rule ${e.rule_id}<span class="tag">applying now</span></div>
                    <div class="val">${this._swatch(e.patched_value)}${$(e.patched_value)}</div>
                    <div class="sub">Was ${$(e.original_value)} · when ${e.rule_condition}</div>
                </div>
            </div>
        `}_chainLine(e){var s;const t=((s=M[e.step])==null?void 0:s.label)??e.step,a=e.path??e.variable??e.expression;return l`
            <div class="val">
                ${this._swatch(e.value)}
                <span>${t}${e.scope?` (${e.scope})`:""}: ${a??""}${a&&e.value!==void 0?" → ":""}${e.value!==void 0?$(e.value):""}</span>
            </div>
        `}_swatch(e){return ae(e)?l`<span class="swatch" style=${T({background:e})}></span>`:m}_renderTokenDetail(){var a;const e=(a=this._provenance.theme_tokens)==null?void 0:a[this._selectedToken];if(!e)return l`<div class="placeholder"><ha-icon icon="mdi:palette-outline"></ha-icon>
                <p>Select a theme token to see how it resolves and where this card uses it.</p></div>`;const t=this._concrete(e);return l`
            <div class="detail-title">
                <h3>theme:${this._selectedToken}</h3>
                <ha-icon-button .label=${"Copy token"} title="Copy token" @click=${()=>j(`theme:${this._selectedToken}`)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
            <div class="now">
                <div class="label">Value on this card</div>
                <div class="value">${this._swatch(t)}${$(t)}</div>
            </div>
            <p class="trail-title">How it resolves</p>
            <div class="trail">
                ${(e.resolution_chain??[]).map(s=>{var n,r;return l`
                    <div class="step chain-step ${s.step==="value"||s.step==="override"?"wins":""}" data-step=${s.step}>
                        <ha-icon icon=${((n=M[s.step])==null?void 0:n.icon)??"mdi:circle-small"}></ha-icon>
                        <div>
                            <div class="what">${((r=M[s.step])==null?void 0:r.label)??s.step}${s.scope?l`<span class="tag">${s.scope} scope</span>`:m}</div>
                            <div class="val">${this._swatch(s.value)}${s.path??s.variable??s.expression??$(s.value)}${(s.path||s.variable||s.expression)&&s.value!==void 0?` → ${$(s.value)}`:""}</div>
                        </div>
                    </div>
                `})}
            </div>
            <p class="trail-title">Used by</p>
            <div class="uses">
                ${(e.used_by_fields??[]).map(s=>se(s)?l`<button @click=${()=>this._selectField(s)}>${s}</button>`:l`<span class="chip">${s}</span>`)}
            </div>
        `}};d(Y,"LCARdSProvenanceTab");let R=Y;customElements.get("lcards-provenance-tab")||customElements.define("lcards-provenance-tab",R);
//# sourceMappingURL=lcards-provenance-tab-K9EwZdp4.js.map
