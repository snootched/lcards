const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chunks/config-checker-core.BgfpHgXZ.js","assets/chunks/js-yaml.DZMzVv2G.js","assets/chunks/theme.oNUGKkaO.js","assets/chunks/framework.CcG9dYYo.js","assets/app.BgpsMDMv.js","assets/chunks/template-string.D_XUSOOq.js","assets/chunks/chart-config-migration.Dw7isKf4.js","assets/chunks/data-grid-config-migration.K4Wc_XKH.js","assets/chunks/card-plumbing.dMbN4Pvq.js","assets/chunks/names.lcgKhyvX.js","assets/chunks/config-checker-samples.CQbFuegs.js","assets/chunks/card-schemas.CL1xsrXy.js","assets/chunks/button-schema.BuRNT2pj.js","assets/chunks/slider-schema.DEi-30x-.js","assets/chunks/elbow-schema.Rfw7RxT-.js","assets/chunks/chart-schema.DrHa_L7g.js","assets/chunks/data-grid-schema.B5SXcv-P.js","assets/chunks/lcards-alert-overlay-schema.BUwByZNP.js","assets/chunks/select-menu-schema.BU3Ti2Eh.js","assets/chunks/schema-options.MJIS-y85.js","assets/chunks/reduced-motion.CR8xNM6Y.js"])))=>i.map(i=>d[i]);
import{_ as z,q as V,P as H,v as Y,V as $,g as R,x as G,o as p,c as h,j as m,t as g,k as B,E as F,e as y,n as I,a as N,F as j,B as q,p as f,G as W}from"./framework.CcG9dYYo.js";import X from"./js-yaml.DZMzVv2G.js";import{P as J,S as K,T as Q}from"./theme.oNUGKkaO.js";const A="yaml=";function Z(a){let t="";for(let n=0;n<a.length;n+=32768)t+=String.fromCharCode(...a.subarray(n,n+32768));return btoa(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function ee(a){const t=a.replace(/-/g,"+").replace(/_/g,"/"),n=atob(t+"=".repeat((4-t.length%4)%4));return Uint8Array.from(n,l=>l.charCodeAt(0))}async function D(a,t){const n=new Response(new Blob([a]).stream().pipeThrough(t));return new Uint8Array(await n.arrayBuffer())}async function te(a){const t=await D(new TextEncoder().encode(a),new CompressionStream("deflate-raw"));return A+Z(t)}async function ae(a){const t=String(a??"").replace(/^#/,"");if(!t.startsWith(A))return null;const n=ee(decodeURIComponent(t.slice(A.length)));return new TextDecoder().decode(await D(n,new DecompressionStream("deflate-raw")))}function re(a){const t=s=>s&&typeof s=="object"&&typeof s.type=="string",n=s=>({type:"sections",sections:[{cards:s}]});if(Array.isArray(a)){const s=a.filter(t);return s.length?{views:[{title:"Cards",config:n(s)}]}:{views:[]}}if(!a||typeof a!="object")return{views:[]};if(a.strategy&&!a.views)return{views:[],note:"A dashboard strategy (such as the LCARS shell) builds its views inside Home Assistant, so it can't be shown here. Paste the views instead."};if(Array.isArray(a.views)){const s=a.views.filter(u=>u&&typeof u=="object"&&!u.strategy).map((u,o)=>({title:String(u.title??u.path??`View ${o+1}`),config:u})),c=a.views.length-s.length;return{views:s,...c?{note:`${c} view${c===1?" uses a strategy":"s use strategies"} and can't be shown here.`}:{}}}const l=String(a.type??""),d=l==="custom:lcards-layout-view"||["sections","masonry","panel","sidebar"].includes(l);return t(a)&&!d?{views:[{title:"Card",config:n([a])}]}:d||a.sections||a.cards?{views:[{title:String(a.title??"View"),config:a}]}:{views:[]}}const ne=`type: custom:lcards-layout-view
layout:
  grid-template-columns: 160px minmax(0, 1fr)
  grid-template-rows: 60px 56px 56px 56px
  grid-template-areas: |
    "corner title"
    "lights main"
    "fan main"
    "door main"
  grid-gap: 8px
  height: 260px
cards:
  - type: custom:lcards-elbow
    elbow:
      type: header-left
    view_layout:
      grid-area: corner
  - type: custom:lcards-button
    preset: bar-label-left
    text:
      label:
        content: ENGINEERING
    view_layout:
      grid-area: title
  - type: custom:lcards-button
    preset: lozenge
    entity: light.engineering
    text:
      name:
        content: LIGHTS
        show: true
    view_layout:
      grid-area: lights
  - type: custom:lcards-button
    preset: lozenge
    entity: fan.warp_core_vent
    text:
      name:
        content: VENT
        show: true
    view_layout:
      grid-area: fan
  - type: custom:lcards-button
    preset: lozenge
    entity: binary_sensor.main_door
    tap_action:
      action: none
    text:
      name:
        content: DOOR
        show: true
    view_layout:
      grid-area: door
  - type: custom:lcards-slider
    preset: gauge-basic
    entity: sensor.warp_core_temperature
    view_layout:
      grid-area: main
`,se={class:"pv"},oe={class:"pv-toolbar"},ie=["disabled"],le=["disabled"],ue=["open"],ce={key:0,class:"pv-note pv-bad","data-testid":"preview-problem"},de={key:1,class:"pv-note"},ve=["href"],pe={key:3,class:"pv-tabs",role:"tablist","aria-label":"Views"},he=["aria-selected","onClick"],me={key:0,class:"pv-empty"},fe={__name:"PreviewBoard",setup(a){const t=f(""),n=f(!1),l=W([]),d=f(0),s=f(""),c=f(""),u=f(""),o=f(null),w=f(null);let b=null,k=null,x=[],_=0;const C=(e,r)=>`${e} ${r}${e===1?"":"s"}`;function E(){var e;for(const r of x)b==null||b.unmount(r);x=[],(e=w.value)==null||e.querySelectorAll(".demo-board-layout-frame, .demo-board-section, .demo-board-column").forEach(r=>r.remove()),w.value&&delete w.value.dataset.ready}function U(){if(c.value="",s.value="",!t.value.trim()){l.value=[],o.value=null;return}let e;try{e=X.load(t.value)}catch(i){c.value=`This isn't valid YAML${i.mark?` (line ${i.mark.line+1})`:""}: ${i.reason??i.message}.`,l.value=[],o.value=null;return}const r=re(e);s.value=r.note??"",!r.views.length&&!r.note&&(c.value="No cards found: each card needs a type: line, such as type: custom:lcards-button."),l.value=r.views,d.value>=r.views.length&&(d.value=0),T()}function T(){if(!k||!t.value.trim()){o.value=null;return}try{const e=k.check(t.value);if(e.parseError||!e.cards.length){o.value=null;return}const r=[e.errors&&C(e.errors,"error"),e.warnings&&C(e.warnings,"warning")].filter(Boolean);o.value={errors:e.errors,warnings:e.warnings,text:r.length?`The checker found ${r.join(" and ")}; the preview may differ from Home Assistant until they're fixed.`:`The checker found no problems in ${C(e.cards.length,"LCARdS card")}.`}}catch{o.value=null}}async function M(){const e=++_;E();const r=l.value[d.value];if(!(!r||!w.value))try{if(b??(b=await K()),e!==_)return;const i=Q(w.value,r.config,b,{stale:()=>e!==_,onCard:v=>x.push(v)});await Promise.race([Promise.allSettled(i),new Promise(v=>setTimeout(v,3e4))]),e===_&&(w.value.dataset.ready=String(d.value))}catch(i){c.value=`The cards could not load: ${i.message}`}}async function O(){const e=await te(t.value);history.replaceState(null,"",`#${e}`);try{await navigator.clipboard.writeText(location.href),u.value="Link copied"}catch{u.value="Link is in the address bar"}location.href.length>6e4&&(u.value+=" (long: some chat apps cut links this size)"),setTimeout(()=>{u.value=""},4e3)}async function S(){try{const e=await ae(location.hash);return e===null?!1:(t.value=e,n.value=!0,!0)}catch{return c.value="This preview link could not be read: it was cut off or copied wrong. Ask for the preview file or the link again, or paste the YAML above.",n.value=!1,!1}}let L=null;V(t,()=>{clearTimeout(L),L=setTimeout(U,500)}),V([l,d],async()=>{await H(),M()});const P=()=>{S()};return Y(async()=>{window.addEventListener("hashchange",P),await S(),globalThis.__LCARDS_VERSION__??(globalThis.__LCARDS_VERSION__="docs");try{const[e,r,i]=await Promise.all([$(()=>import("./config-checker-core.BgfpHgXZ.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10])),$(()=>import("./card-schemas.CL1xsrXy.js"),__vite__mapDeps([11,12,2,3,13,14,15,16,17,18,9,19,8,20])),fetch(R("/schema/registries.json")).then(v=>v.ok?v.json():null).catch(()=>null)]);k=e.createChecker({entries:r.getSchemaEntries(),registries:i}),T()}catch{}}),G(()=>{window.removeEventListener("hashchange",P),_++,E()}),(e,r)=>(p(),h("div",se,[m("div",oe,[m("button",{type:"button",class:"pv-btn pv-btn-brand",disabled:!t.value.trim(),"data-testid":"preview-copy",onClick:O},g(u.value||"Copy link to this preview"),9,ie),m("button",{type:"button",class:"pv-btn",onClick:r[0]||(r[0]=i=>t.value=B(ne))},"Try an example"),m("button",{type:"button",class:"pv-btn",disabled:!t.value,onClick:r[1]||(r[1]=i=>t.value="")},"Clear",8,le)]),m("details",{class:"pv-source",open:!n.value},[m("summary",null,"YAML ("+g(n.value?"from the link":"paste a card, a view or a whole dashboard")+")",1),F(J,{modelValue:t.value,"onUpdate:modelValue":r[2]||(r[2]=i=>t.value=i)},null,8,["modelValue"])],8,ue),c.value?(p(),h("p",ce,g(c.value),1)):s.value?(p(),h("p",de,g(s.value),1)):y("",!0),o.value?(p(),h("p",{key:2,class:I(["pv-note",o.value.errors?"pv-bad":o.value.warnings?"pv-warn":"pv-good"]),"data-testid":"preview-check"},[N(g(o.value.text)+" ",1),o.value.errors||o.value.warnings?(p(),h("a",{key:0,href:B(R)("/getting-started/config-checker")},"Check Your Config",8,ve)):y("",!0),o.value.errors||o.value.warnings?(p(),h(j,{key:1},[N(" lists each one.")],64)):y("",!0)],2)):y("",!0),l.value.length>1?(p(),h("div",pe,[(p(!0),h(j,null,q(l.value,(i,v)=>(p(),h("button",{key:v,type:"button",role:"tab","aria-selected":v===d.value,class:I({active:v===d.value}),onClick:we=>d.value=v},g(i.title),11,he))),128))])):y("",!0),m("div",{ref_key:"stage",ref:w,class:"pv-stage","data-testid":"preview-stage"},[!l.value.length&&!c.value?(p(),h("p",me,"Paste YAML above, or open a preview link, to see it here.")):y("",!0)],512),r[3]||(r[3]=m("p",{class:"pv-caption"}," Real cards from this version's LCARdS bundle. Entities you name get sample states by their domain (a light is on or off, a sensor has a number), so values and colours are examples, not your home. ",-1))]))}},_e=z(fe,[["__scopeId","data-v-7ca2c52b"]]);export{_e as default};
