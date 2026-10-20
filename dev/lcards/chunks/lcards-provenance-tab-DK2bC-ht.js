var A=Object.defineProperty;var l=(i,e)=>A(i,"name",{value:e,configurable:true});import{a4 as P,a9 as z,i as F,a as D,l as N,A as p,b as o,z as S,T as E}from"./lcards-main-C10Twmlb.js";import{o as y}from"./lcards-yaml-editor-kz8qT51r.js";import{s as R,l as M,r as H}from"./studio-dialog-styles-C5BrIaK5.js";import{m as J}from"./lcards-message-BMG6miXA.js";function ee({hass:i,config:e={},entity:t=null,variables:a={},theme:s}={}){return{entity:t,config:e,hass:i,states:i==null?void 0:i.states,variables:{...(e==null?void 0:e.variables)||{},...a},theme:s,displayFormat:"friendly"}}l(ee,"templateContext");function B(i){if(typeof i!="string"||!i)return false;const e=z.detectTemplateTypes(i);return e.hasJavaScript||e.hasTokens||e.hasDatasources||e.hasJinja2}l(B,"hasTemplate");function I(i){if(typeof i!="string")return[];const e=z.detectTemplateTypes(i),t=[];return e.hasJavaScript&&t.push("JavaScript"),/\{theme:/.test(i)&&t.push("Theme"),/\{(?:datasource|ds):/.test(i)&&t.push("Data source"),/\{(?!theme:|datasource:|ds:|\{|%)[a-z_][\w.]*\}/i.test(i)&&t.push("Token"),e.hasJinja2&&t.push("Jinja2"),t}l(I,"templateKinds");const V=[[/\{\{\s*theme:[^}]*\}\}/g,"Theme tokens use single braces: {theme:colors.text.onDark}"],[/\{(?:datasource|ds)\.[^}]*\}/g,"Data sources use a colon: {ds:name}"],[/\{(?:colors|typography|components|palette)\.[^}]*\}/g,"Missing the theme: prefix: {theme:colors.text.onDark}"]];function W(i){if(typeof i!="string")return[];const e=[];for(const[t,a]of V)for(const s of i.matchAll(t))e.push({match:s[0],message:a});return e}l(W,"templateMistakes");function te(i){const e=[],t=new Set(["type","rules","data_sources","grid_options","view_layout","visibility"]),a=l((s,r)=>{if(typeof s=="string"){const n=W(s);(B(s)||n.length)&&e.push({path:r,value:s,kinds:I(s),mistakes:n});return}if(Array.isArray(s)){s.forEach((n,c)=>a(n,`${r}[${c}]`));return}if(s&&typeof s=="object")for(const[n,c]of Object.entries(s))!r&&t.has(n)||a(c,r?`${r}.${n}`:n)},"walk");return a(i??{},""),e}l(te,"templateFields");function L(i){const e=[];for(const t of String(i).split(".")){const a=/^([^[\]]*)((?:\[\d+\])*)$/.exec(t);if(!a){e.push(t);continue}a[1]&&e.push(a[1]);for(const s of a[2].matchAll(/\[(\d+)\]/g))e.push(Number(s[1]))}return e}l(L,"pathSegments");function ae(i,e,t){const a=L(e),s=l((r,n)=>{if(n===a.length)return t;const c=a[n],d=Array.isArray(r)?[...r]:{...r??{}};return d[c]=s(r==null?void 0:r[c],n+1),d},"set");return s(i,0)}l(ae,"withValueAt");function se(i){if(!String(i??"").trim())return{value:{},error:""};try{const e=P.load(i);return e==null?{value:{},error:""}:typeof e!="object"||Array.isArray(e)?{value:{},error:"Write name: value lines (a YAML mapping)."}:{value:e,error:""}}catch(e){return{value:{},error:`YAML error: ${String(e.message).split(`
`)[0]}`}}}l(se,"parseTestValues");function ie(i){const e=String(i??""),t=[...e.matchAll(/\[\[\[[\s\S]*?\]\]\]/g),...e.matchAll(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g),...e.matchAll(/\{(?:theme|datasource|ds):[^}]*\}/g),...e.matchAll(/\{(?:entity|states|config|variables|hass)\.[^}]*\}/g),...e.matchAll(/\{(?:entity|states|config|variables|hass)\.[^{}]*$|\{(?:theme|datasource|ds):[^{}]*$/g)].map(a=>a[0]);return[...new Set(t)]}l(ie,"unresolvedParts");function T(i,e,t){const a=new Date().toISOString();return{entity_id:i,last_changed:a,last_updated:a,context:{id:"lcards-test",parent_id:null,user_id:null},...e??{},state:String((t==null?void 0:t.state)??(e==null?void 0:e.state)??""),attributes:{...(e==null?void 0:e.attributes)??{},...(t==null?void 0:t.attributes)??{}}}}l(T,"testState");function re({hass:i,entityId:e,test:t={}}){var f,m;const a=t&&typeof t=="object"?t:{},s=l(v=>v&&typeof v=="object"&&!Array.isArray(v),"isObj"),r=e?((f=i==null?void 0:i.states)==null?void 0:f[e])??null:null,n=s(a.entity)?T(e||"test.entity",r,a.entity):r,c={};if(s(a.states))for(const[v,_]of Object.entries(a.states))c[v]=T(v,(m=i==null?void 0:i.states)==null?void 0:m[v],s(_)?_:{state:_});s(a.entity)&&e&&(c[e]=n);const d=Object.keys(c);return{hass:d.length?{...i,states:{...(i==null?void 0:i.states)??{},...c}}:i,entity:n,variables:s(a.variables)?a.variables:{},ds:s(a.ds)?a.ds:{},testEntities:d}}l(re,"withTestValues");const g={card_defaults:{label:"Card defaults",icon:"mdi:cog"},theme_defaults:{label:"Theme defaults",icon:"mdi:palette"},user_config:{label:"Your config",icon:"mdi:account"}},b={"built-in":{label:"Built-in default",icon:"mdi:cog-outline"},component:{label:"Component",icon:"mdi:puzzle"},"component-preset":{label:"Component preset",icon:"mdi:puzzle-star"},range:{label:"Range",icon:"mdi:arrow-expand-horizontal"},"preset-default":{label:"Preset default",icon:"mdi:package-variant"},state:{label:"State branch",icon:"mdi:toggle-switch"}},w={override:{label:"Override",icon:"mdi:account-edit"},lookup:{label:"Theme token",icon:"mdi:palette"},reference:{label:"Refers to",icon:"mdi:arrow-right"},computed:{label:"Computed",icon:"mdi:function-variant"},"css-var":{label:"CSS variable",icon:"mdi:variable"},value:{label:"Value on this card",icon:"mdi:eyedropper"},missing:{label:"Not in the theme",icon:"mdi:alert"},circular:{label:"Circular reference",icon:"mdi:alert"}},Y=[{value:"all",label:"All fields"},{value:"changed",label:"Changed from defaults"},{value:"rules",label:"Set by rules now"},{value:"templates",label:"Templates"},{value:"tokens",label:"Theme tokens"},{value:"runtime",label:"Set by the card"}];function $(i){if(g[i])return g[i].label;if(b[i])return b[i].label;if(i==="rules")return"Rule";const e=/^(preset|component)_(.+)$/.exec(i??"");return e?`${e[1]==="preset"?"Preset":"Component"}: ${e[2]}`:i??""}l($,"layerLabel");function C(i){return g[i]?g[i].icon:b[i]?b[i].icon:i==="rules"?"mdi:format-list-checks":/^preset_/.test(i??"")?"mdi:package-variant-closed":/^component_/.test(i??"")?"mdi:puzzle":"mdi:circle-small"}l(C,"layerIcon");function q(i){return i==="user_config"?"user":i==="rules"?"rule":/^preset|^component/.test(i??"")?"preset":i==="theme_defaults"?"theme":"card"}l(q,"badgeClass");function h(i){if(i===void 0)return"(not set)";if(i===null)return"null";if(typeof i=="object")try{return JSON.stringify(i)}catch{return String(i)}return String(i)}l(h,"show");const j=E,O=l(i=>/^[\w[\].-]+$/.test(i),"isFieldPath");function U(i,e){let t=i;for(const a of L(e)){if(t==null)return;t=t[a]}return t}l(U,"valueAt");const x=class x2 extends F{static get properties(){return{editor:{type:Object},config:{type:Object},hass:{type:Object},_provenance:{type:Object,state:true},_cardConfig:{type:Object,state:true},_open:{type:Boolean,state:true},_view:{type:String,state:true},_search:{type:String,state:true},_show:{type:String,state:true},_selected:{type:String,state:true},_selectedToken:{type:String,state:true},_live:{type:Boolean,state:true},_stale:{type:Boolean,state:true},_collapsed:{type:Object,state:true}}}constructor(){super(),this.editor=void 0,this.config=void 0,this.hass=void 0,this._provenance=null,this._provenanceTracker=null,this._card=void 0,this._cardConfig=null,this._open=false,this._view="fields",this._search="",this._show="all",this._selected="",this._selectedToken="",this._live=true,this._stale=false,this._collapsed=new Set,this._unsubscribe=null}static get styles(){return[R,J,M,D`
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
                font-family: var(--code-font-family, monospace);
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
                font-family: var(--code-font-family, monospace);
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
                font-family: var(--code-font-family, monospace);
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
                font-family: var(--code-font-family, monospace);
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
                font-family: var(--code-font-family, monospace);
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
        `]}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._unsubscribe)==null||e.call(this),this._unsubscribe=null,this._card=void 0}updated(e){e.has("config")&&this.config&&this._loadProvenance()}async _loadProvenance(){var e,t;try{const a=this.config?(t=(e=window.lcards)==null?void 0:e.findCardByConfig)==null?void 0:t.call(e,this.config):null;this._setCard(a&&typeof a.getProvenance=="function"?a:null)}catch(a){N.error("[ProvenanceTab] Failed to load provenance:",a),this._setCard(null)}}_setCard(e){var t,a;e!==this._card&&((t=this._unsubscribe)==null||t.call(this),this._unsubscribe=((a=e==null?void 0:e.subscribeProvenance)==null?void 0:a.call(e,()=>{this._live?this._read():this._stale=true}))??null,this._card=e),this._read()}_read(){const e=this._card;this._provenance=e?e.getProvenance():null,this._provenanceTracker=(e==null?void 0:e._provenanceTracker)??null,this._cardConfig=(e==null?void 0:e.config)??null,this._stale=false}_fields(){var s;const e=this._provenance;if(!e)return[];const t=new Map,a=l(r=>(t.has(r)||t.set(r,{path:r,layers:null,final:null,runtime:[],rule:null,template:null,tokens:[]}),t.get(r)),"get");for(const[r,n]of Object.entries(((s=e.config)==null?void 0:s.field_sources)??{})){const c=a(r);c.layers=typeof n=="string"?{[n]:void 0}:n.layers,c.final=typeof n=="string"?n:n.final}for(const[r,n]of Object.entries(e.runtime??{}))a(r).runtime=n;for(const[r,n]of Object.entries(e.rule_patches??{}))a(r).rule=n;for(const[r,n]of Object.entries(e.templates??{}))r.startsWith("template:")||(a(r).template=n);for(const[r,n]of Object.entries(e.theme_tokens??{}))for(const c of n.used_by_fields??[])O(c)&&a(c).tokens.push(r);for(const r of t.values())r.source=r.rule?"rules":r.final??(r.runtime.length?r.runtime[r.runtime.length-1].layer:null);return[...t.values()].sort((r,n)=>r.path.localeCompare(n.path))}_filtered(){const e=this._search.trim().toLowerCase(),t={all:l(()=>true,"all"),changed:l(a=>a.final==="user_config"||!!a.rule||!!a.template,"changed"),rules:l(a=>!!a.rule,"rules"),templates:l(a=>!!a.template,"templates"),tokens:l(a=>a.tokens.length>0,"tokens"),runtime:l(a=>a.runtime.length>0,"runtime")}[this._show]??(()=>true);return this._fields().filter(a=>t(a)&&(!e||a.path.toLowerCase().includes(e)))}_rows(e){const t={children:new Map};for(const n of e){const c=n.path.split(".");let d=t;c.forEach((u,f)=>{const m=c.slice(0,f+1).join(".");d.children.has(u)||d.children.set(u,{seg:u,path:m,children:new Map,field:null}),d=d.children.get(u)}),d.field=n}const a=[],s=!!this._search.trim()||this._show!=="all",r=l((n,c)=>{for(const d of[...n.children.values()].sort((u,f)=>u.seg.localeCompare(f.seg))){const u=d.children.size>0,f=s||!this._collapsed.has(d.path);a.push({...d,depth:c,folder:u,open:f}),u&&f&&r(d,c+1)}},"walk");return r(t,0),a}_tokens(){var t;const e=this._search.trim().toLowerCase();return Object.entries(((t=this._provenance)==null?void 0:t.theme_tokens)??{}).map(([a,s])=>({path:a,...s})).filter(a=>!e||a.path.toLowerCase().includes(e)||(a.used_by_fields??[]).some(s=>s.toLowerCase().includes(e))).sort((a,s)=>a.path.localeCompare(s.path))}_concrete(e){const a=[...(e==null?void 0:e.resolution_chain)??[]].reverse().find(s=>s.step==="value");return(a==null?void 0:a.value)??(e==null?void 0:e.resolved_value)}_openInspector(){this._loadProvenance(),this._open=true}_close(){this._open=false}_toggleLive(e){this._live=e.target.checked,this._live&&this._read()}_toggleFolder(e){const t=new Set(this._collapsed);t.has(e)?t.delete(e):t.add(e),this._collapsed=t}_selectField(e){this._view="fields",this._selected=e}_selectToken(e){this._view="tokens",this._selectedToken=e}render(){const e=this._provenance,t=this._fields();return o`
            ${H({icon:"mdi:layers-search",title:"Provenance",description:"Where each of this card's values comes from: its config and preset, the theme, rules, templates and the card itself.",stats:e?[{value:t.length,label:"fields"},{value:Object.keys(e.theme_tokens??{}).length,label:"theme tokens"},{value:new Set(Object.values(e.rule_patches??{}).map(a=>a.rule_id)).size,label:"rules applying now"},{value:t.filter(a=>a.template).length,label:"templates"}]:[],actions:[{label:"Open inspector",icon:"mdi:file-tree",onClick:l(()=>this._openInspector(),"onClick")}]})}
            ${!e&&this._card===null?o`<p class="hint">No rendered card for this config yet: provenance comes from the card editor's preview. Layout cards and the alert overlay don't record provenance.</p>`:p}
            ${this._open?this._renderInspector():p}
        `}_renderInspector(){const e=this._provenance,t=(e==null?void 0:e.context)??{};return o`
            <ha-dialog
                open
                flexcontent
                header-title=${`Provenance: ${t.card_id||t.card_type||"card"}`}
                @closed=${a=>{a.stopPropagation(),a.target===a.currentTarget&&this._close()}}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${a=>{var r,n;a.stopPropagation();const s=(n=(r=a.target.activeTab)==null?void 0:r.getAttribute)==null?void 0:n.call(r,"value");s&&(this._view=s)}}>
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
                            ${e?this._view==="tokens"?this._renderTokenDetail():this._renderFieldDetail():o`<div class="placeholder"><ha-icon icon="mdi:card-search-outline"></ha-icon><p>No rendered card for this config.</p></div>`}
                        </div>
                    </div>
                </div>
                <div slot="footer">
                    <ha-button appearance="plain" data-dialog="close">Close</ha-button>
                </div>
            </ha-dialog>
        `}_renderHeadRow(e){return o`
            <div class="head-row">
                ${e.theme?o`<span class="chip">Theme: ${e.theme}</span>`:p}
                ${e.alert_mode&&e.alert_mode!=="green_alert"?o`<span class="chip alert">Alert mode: ${e.alert_mode}</span>`:p}
                ${e.token_overrides?o`<span class="chip">${e.token_overrides} token overrides</span>`:p}
                ${e.entity?o`<span class="chip">${e.entity}: ${e.entity_state??"-"}</span>`:p}
                <span class="live">
                    ${this._live?p:o`
                        <ha-icon-button class="refresh" .label=${"Refresh"} title="Refresh" @click=${()=>this._read()}>
                            <ha-icon icon=${this._stale?"mdi:refresh-circle":"mdi:refresh"}></ha-icon>
                        </ha-icon-button>
                    `}
                    <ha-switch class="live-switch" .checked=${this._live} @change=${this._toggleLive}>${this._live?"Live":this._stale?"Paused (changed)":"Paused"}</ha-switch>
                </span>
            </div>
        `}_renderLeft(){return o`
            <div class="left-head">
                <ha-input
                    class="search"
                    .value=${this._search}
                    .label=${this._view==="tokens"?"Search tokens or fields":"Search fields"}
                    @input=${e=>{this._search=e.target.value??""}}>
                </ha-input>
                ${this._view==="fields"?o`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Show"}
                        .required=${false}
                        .selector=${{select:{mode:"dropdown",options:Y}}}
                        .value=${this._show}
                        @value-changed=${e=>{e.stopPropagation(),this._show=e.detail.value||"all"}}>
                    </ha-selector>
                `:p}
            </div>
            <div class="list">
                ${this._view==="tokens"?this._renderTokenList():this._renderFieldList()}
            </div>
        `}_renderFieldList(){const e=this._filtered();return e.length?this._rows(e).map(t=>o`
            <div class="row field-row ${t.field&&t.path===this._selected?"selected":""}"
                data-path=${t.path}
                style=${y({"--depth":String(t.depth)})}
                @click=${()=>t.folder&&!t.field?this._toggleFolder(t.path):this._selectField(t.path)}>
                ${t.folder?o`<ha-icon class="twisty" icon=${t.open?"mdi:chevron-down":"mdi:chevron-right"}
                        @click=${a=>{a.stopPropagation(),this._toggleFolder(t.path)}}></ha-icon>`:o`<span class="twisty"></span>`}
                <span class="name">${t.seg}</span>
                ${t.field?o`
                    <span class="marks">
                        ${t.field.template?o`<ha-icon icon="mdi:code-braces" title="Template"></ha-icon>`:p}
                        ${t.field.tokens.length?o`<ha-icon icon="mdi:palette" title="Theme token"></ha-icon>`:p}
                    </span>
                    <span class="badge ${q(t.field.source)}">${$(t.field.source)}</span>
                `:p}
            </div>
        `):o`<p class="hint empty">No fields match.</p>`}_renderTokenList(){const e=this._tokens();return e.length?e.map(t=>{const a=this._concrete(t);return o`
                <div class="row token-row ${t.path===this._selectedToken?"selected":""}" data-path=${t.path} @click=${()=>this._selectToken(t.path)}>
                    ${j(a)?o`<span class="swatch" style=${y({background:a})}></span>`:o`<ha-icon class="twisty" icon="mdi:palette"></ha-icon>`}
                    <span class="name">${t.path}</span>
                    <span class="badge" title="Fields using it">${(t.used_by_fields??[]).length}</span>
                </div>
            `}):o`<p class="hint empty">No theme tokens recorded for this card.</p>`}_renderFieldDetail(){var n,c;const e=this._fields().find(d=>d.path===this._selected);if(!e)return o`<div class="placeholder"><ha-icon icon="mdi:cursor-default-click-outline"></ha-icon>
                <p>Select a field to see its value and how it got there.</p></div>`;const t=e.runtime.find(d=>d.layer==="state"),a=U(this._cardConfig,e.path),s=t?t.value:a!==void 0?a:((n=e.rule)==null?void 0:n.patched_value)??((c=e.runtime[e.runtime.length-1])==null?void 0:c.value),r=e.tokens.length?this._concrete(this._provenance.theme_tokens[e.tokens[0]]):void 0;return o`
            <div class="detail-title">
                <h3>${e.path}</h3>
                <ha-icon-button .label=${"Copy field path"} title="Copy field path" @click=${()=>S(e.path)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
            <div class="now">
                <div class="label">Value now</div>
                <div class="value">${this._swatch(r??s)}${h(s)}</div>
                ${r!==void 0&&r!==s?o`<p class="hint">On this card: ${h(r)}</p>`:p}
            </div>
            <p class="trail-title">How it got here</p>
            <div class="trail">
                ${this._configSteps(e)}
                ${e.runtime.map(d=>this._runtimeStep(d))}
                ${e.tokens.map(d=>this._tokenStep(d))}
                ${e.template?this._templateStep(e.template):p}
                ${e.rule?this._ruleStep(e.rule):p}
            </div>
        `}_configSteps(e){var a;return e.layers?(((a=this._provenance.config)==null?void 0:a.merge_order)??Object.keys(e.layers)).filter(s=>s in e.layers).map(s=>{const r=s===e.final&&!e.rule;return o`
                <div class="step config-step ${r?"wins":"overridden"}">
                    <ha-icon icon=${C(s)}></ha-icon>
                    <div>
                        <div class="what">${$(s)}<span class="tag">${r?"sets it":"replaced below"}</span></div>
                        <div class="val">${this._swatch(e.layers[s])}${h(e.layers[s])}</div>
                    </div>
                </div>
            `}):p}_runtimeStep(e){const t=e.detail??{},a=[e.layer==="state"&&`branch "${t.state??"none"}" for state ${t.entityState??"-"}${t.classified?` (${t.classified})`:""}`,t.matchLight!==void 0&&`light colour ${t.matchLight}`,t.component&&`component ${t.component}`,t.preset&&`preset ${t.preset}`,t.token&&`from theme:${t.token}${t.fallback?" (not in the theme: the card's fallback)":""}`,t.from].filter(Boolean);return o`
            <div class="step runtime-step" data-layer=${e.layer}>
                <ha-icon icon=${C(e.layer)}></ha-icon>
                <div>
                    <div class="what">${$(e.layer)}<span class="tag">applied by the card</span></div>
                    <div class="val">${this._swatch(e.value)}${h(e.value)}</div>
                    ${a.length?o`<div class="sub">${a.join(" · ")}</div>`:p}
                </div>
            </div>
        `}_tokenStep(e){const t=this._provenance.theme_tokens[e];return t?o`
            <div class="step token-step">
                <ha-icon icon="mdi:palette"></ha-icon>
                <div>
                    <div class="what">Theme token<span class="tag">${t.original_ref}</span></div>
                    <div class="chain">${(t.resolution_chain??[]).map(a=>this._chainLine(a))}</div>
                    <div class="sub"><button class="link" @click=${()=>this._selectToken(e)}>Open token</button></div>
                </div>
            </div>
        `:p}_templateStep(e){var t;return o`
            <div class="step template-step">
                <ha-icon icon="mdi:code-braces"></ha-icon>
                <div>
                    <div class="what">Template<span class="tag">${e.processor}</span></div>
                    <div class="val">${e.original}</div>
                    <div class="sub">Result: ${h(e.processed)}</div>
                    ${(t=e.dependencies)!=null&&t.length?o`<div class="sub">Uses: ${e.dependencies.join(", ")}</div>`:p}
                </div>
            </div>
        `}_ruleStep(e){return o`
            <div class="step rule-step wins">
                <ha-icon icon="mdi:format-list-checks"></ha-icon>
                <div>
                    <div class="what">Rule ${e.rule_id}<span class="tag">applying now</span></div>
                    <div class="val">${this._swatch(e.patched_value)}${h(e.patched_value)}</div>
                    <div class="sub">Was ${h(e.original_value)} · when ${e.rule_condition}</div>
                </div>
            </div>
        `}_chainLine(e){var s;const t=((s=w[e.step])==null?void 0:s.label)??e.step,a=e.path??e.variable??e.expression;return o`
            <div class="val">
                ${this._swatch(e.value)}
                <span>${t}${e.scope?` (${e.scope})`:""}: ${a??""}${a&&e.value!==void 0?" → ":""}${e.value!==void 0?h(e.value):""}</span>
            </div>
        `}_swatch(e){return j(e)?o`<span class="swatch" style=${y({background:e})}></span>`:p}_renderTokenDetail(){var a;const e=(a=this._provenance.theme_tokens)==null?void 0:a[this._selectedToken];if(!e)return o`<div class="placeholder"><ha-icon icon="mdi:palette-outline"></ha-icon>
                <p>Select a theme token to see how it resolves and where this card uses it.</p></div>`;const t=this._concrete(e);return o`
            <div class="detail-title">
                <h3>theme:${this._selectedToken}</h3>
                <ha-icon-button .label=${"Copy token"} title="Copy token" @click=${()=>S(`theme:${this._selectedToken}`)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
            <div class="now">
                <div class="label">Value on this card</div>
                <div class="value">${this._swatch(t)}${h(t)}</div>
            </div>
            <p class="trail-title">How it resolves</p>
            <div class="trail">
                ${(e.resolution_chain??[]).map(s=>{var r,n;return o`
                    <div class="step chain-step ${s.step==="value"||s.step==="override"?"wins":""}" data-step=${s.step}>
                        <ha-icon icon=${((r=w[s.step])==null?void 0:r.icon)??"mdi:circle-small"}></ha-icon>
                        <div>
                            <div class="what">${((n=w[s.step])==null?void 0:n.label)??s.step}${s.scope?o`<span class="tag">${s.scope} scope</span>`:p}</div>
                            <div class="val">${this._swatch(s.value)}${s.path??s.variable??s.expression??h(s.value)}${(s.path||s.variable||s.expression)&&s.value!==void 0?` → ${h(s.value)}`:""}</div>
                        </div>
                    </div>
                `})}
            </div>
            <p class="trail-title">Used by</p>
            <div class="uses">
                ${(e.used_by_fields??[]).map(s=>O(s)?o`<button @click=${()=>this._selectField(s)}>${s}</button>`:o`<span class="chip">${s}</span>`)}
            </div>
        `}};l(x,"LCARdSProvenanceTab");let k=x;customElements.get("lcards-provenance-tab")||customElements.define("lcards-provenance-tab",k);export{I as a,te as b,L as c,ae as d,se as p,ee as t,ie as u,re as w};
//# sourceMappingURL=lcards-provenance-tab-DK2bC-ht.js.map
