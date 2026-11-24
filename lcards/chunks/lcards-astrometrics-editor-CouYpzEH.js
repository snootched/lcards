var Bt=Object.defineProperty;var ua=(i,e,t)=>e in i?Bt(i,e,{enumerable:true,configurable:true,writable:true,value:t}):i[e]=t;var c=(i,e)=>Bt(i,"name",{value:e,configurable:true});var Ut=(i,e,t)=>ua(i,typeof e!="symbol"?e+"":e,t);import{a$ as Ft,aP as Ui,b0 as pa,aG as Y,aE as Fi,b1 as ma,b2 as Vt,b3 as fa,b4 as Ht,b5 as ya,b6 as ba,aZ as Ot,i as _e,c as ce,A as _,b as p,w as E,x as jt,b7 as ga,b8 as _a,b9 as Vi,ba as wa,bb as Hi,bc as va,bd as Kt,be as $a,bf as ka,f as xa,m as Ki,o as Gi,bg as Sa,aJ as Aa,bh as Tt,l as Gt,D as Wi,u as Wt,bi as Yt,bj as Oa}from"./lcards-main-C0gg-u3X.js";import{f as dt,L as M,b as ja,s as Ta,n as Ea,a as Pa}from"./LCARdSBaseEditor-y7tpngOf.js";import{A as L,c as Yi,y as Na}from"./lcards-yaml-editor-BX_dIaLA.js";import"./lcards-form-section-DUjEMfgF.js";import{r as we,e as za,m as Ca}from"./lcards-message-B-qjq_R5.js";import{astrometricsSchema as Z,objectSchema as Ia}from"./astrometrics-schema-ad0NfsID.js";import{c as Ma}from"./studio-history-CaTDxvJI.js";import{S as qt}from"./volume-B-aS6WEj.js";import"./lcards-color-picker-BESuDzyB.js";import"./lcards-color-list-w6NJx2QW.js";import"./lcards-text-field-editor-B_O1gtiO.js";import"./lcards-color-section-v2-CCoCBr08.js";import"./lcards-background-animation-editor-5lPLMCnp.js";import{B as te}from"./label-text-E3PzdDyx.js";const H=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$9"),He=c(i=>!!i&&(i===Ft||Array.isArray(i.allOf)&&i.allOf.includes(Ft)),"isPlainColor"),ht=c(i=>He(i)||Array.isArray(i==null?void 0:i.anyOf)&&i.anyOf.some(He)&&i.anyOf.every(e=>He(e)||ee(e)),"isColor"),Jt=c(i=>S(i,"array")&&ht(i.items),"isColorArray"),Re=c(i=>H(i==null?void 0:i["x-ui-hints"])?i["x-ui-hints"]:{},"uiHints"),S=c((i,e)=>(i==null?void 0:i.type)===e||Array.isArray(i==null?void 0:i.type)&&i.type.includes(e),"hasType"),X=c(i=>S(i,"number")||S(i,"integer"),"isNumberSchema"),qi=c(i=>S(i,"array")&&(X(i.items)||!!ve(i.items)),"isNumberArray"),ye=c(i=>qi(i)&&i.minItems!==void 0&&i.minItems===i.maxItems&&i.minItems>=2&&i.minItems<=4,"isTuple"),La=c(i=>{if(!S(i,"array")||i.minItems!==2||i.maxItems!==2)return false;const e=ve(i.items)??i.items;return X(e)&&Number.isFinite(e.minimum)&&Number.isFinite(e.maximum)},"isRange"),Ra=c(i=>ve(i==null?void 0:i.items)??(i==null?void 0:i.items)??{},"rangeItem"),Qt=c(i=>Array.isArray(i==null?void 0:i.oneOf)&&i.oneOf.length===2&&i.oneOf.some(e=>S(e,"string")&&!e.enum)&&i.oneOf.some(e=>ye(e)&&e.minItems===3),"isPointRef"),ee=c(i=>{var e;return S(i,"object")&&!!((e=i==null?void 0:i.properties)!=null&&e.entity)&&Array.isArray(i==null?void 0:i.required)&&i.required.includes("entity")},"isBindingSchema"),De=c(i=>S(i,"string")&&!i.enum&&typeof i.pattern=="string","isTemplateSchema");function ve(i){const e=i==null?void 0:i.anyOf;if(!Array.isArray(e)||!e.some(ee))return null;const t=e.filter(a=>!ee(a)&&!De(a));return t.length===1&&X(t[0])?t[0]:null}c(ve,"settingNumber");const Q=c(i=>H(i)&&typeof i.entity=="string","isBoundValue"),ne=c(i=>((i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf)??[]).find(ee)??null,"bindingBranch");function Da(i){const e=((i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf)??[]).find(t=>(t==null?void 0:t.type)==="array");return e!=null&&e.items&&ne(e.items)?e.items:null}c(Da,"pairItemSchema");const Ba=c(i=>((i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf)??[]).some(De),"takesTemplate"),q=c(i=>typeof i=="string"&&/\[\[\[|\{\{|\{[A-Za-z_]/.test(i),"isTemplateValue"),Ke=c(i=>{var e,t;return!!((t=(e=ne(i))==null?void 0:e.properties)!=null&&t.views)},"isTour"),me=c(i=>S(i,"object")&&H(i.properties)&&!i.additionalProperties,"isWalkable"),Ua=new Set(["tap_action","hold_action"]);function ue(i,e){var s;if(!H(i)||e&&Ua.has(e))return"yaml";if(ht(i))return"color";const t=Re(i).widget;if(t==="font"||i.format==="font-family")return"font";if(t==="rate")return"rate";if(t==="date")return"date";if(t==="shape"&&Array.isArray(i.enum))return"shape";if(t==="textDefault")return"textDefault";if(La(i))return"range";if(Jt(i))return"colorList";if(Qt(i))return"pointRef";if(ve(i))return"number";const a=i.oneOf??i.anyOf;if(Array.isArray(a)){if(a.length===2&&a.some(r=>S(r,"string")&&!r.enum)&&a.some(ee))return"text";const n=a.filter(r=>!ee(r)&&!De(r));if(n.length===1&&S(n[0],"boolean"))return"boolean";if(n.length===2){if(n.some(ht)&&n.some(Jt))return"colorList";if(n.some(X)&&n.some(ye))return"numberOrTuple";if(n.some(r=>S(r,"boolean"))&&n.some(me))return"boolOrObject";if(n.some(r=>S(r,"boolean"))&&n.some(X))return"boolOrNumber";if(n.some(r=>S(r,"boolean"))&&n.some(r=>S(r,"array")&&S(r.items,"string")))return"boolOrList";if(n.some(me)&&n.some(r=>!me(r)&&!S(r,"boolean")))return"valueOrObject"}return Ji(i)?"choice":"yaml"}return i.const!==void 0?"yaml":Array.isArray(i.enum)&&i.enum.every(n=>typeof n=="string")?"enum":S(i,"boolean")&&!Array.isArray(i.type)?"boolean":X(i)&&!Array.isArray(i.type)?"number":S(i,"string")&&(i.assetSource==="model"||i.assetSource==="image")?"asset":S(i,"string")&&!Array.isArray(i.type)||Array.isArray(i.type)&&i.type.every(n=>["string","number","integer"].includes(n))?"text":S(i,"array")?ye(i)?"tuple":qi(i)&&!S(i.items,"string")?"numbers":S(i.items,"string")&&!i.items.enum?"strings":Qt(i.items)?"pointList":H((s=i.items)==null?void 0:s.properties)?"objectList":"yaml":me(i)?"object":"yaml"}c(ue,"fieldKind");function Ji(i){const e=(i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf);if(!Array.isArray(e))return null;const t=e.filter(r=>!ee(r)&&!De(r)),a=t.filter(r=>S(r,"string")&&Array.isArray(r.enum)),s=t.some(r=>S(r,"boolean")),n=t.some(X);return!a.length||a.length+(s?1:0)+(n?1:0)!==t.length?null:{words:a.flatMap(r=>r.enum),bool:s,number:n}}c(Ji,"choiceOptions");function Fa(i,{bool:e,number:t}){if(i===""||i===void 0||i===null)return;if(e&&(i==="true"||i===true))return true;if(e&&(i==="false"||i===false))return false;const a=Number(i);return t&&String(i).trim()!==""&&Number.isFinite(a)?a:String(i)}c(Fa,"choiceValue");function Va(i){const e=Re(i).selector;if(e!=null&&e.number)return e;const t=ve(i)??i,a=S(t,"integer"),{minimum:s,maximum:n}=t??{};return Number.isFinite(s)&&Number.isFinite(n)?{number:{mode:"slider",min:s,max:n,step:a?1:"any"}}:{number:{mode:"box",min:s,max:n,step:a?1:"any"}}}c(Va,"numberSelector");function Ha(i,e){const t=String(i??""),a=t.match(/(per )?scene units?(\s*\/\s*s\b| a second| per second)?/);if(a&&!a[1])return`${e||"units"}${a[2]?"/s":""}`;if(/\bpx (per|a) second\b/.test(t))return"px/s";if(/\bpx\b|\bpixels\b/.test(t))return"px";if(/\bmetres\b/.test(t))return"m"}c(Ha,"unitSuffix");function Ka(i,e,t){return t&&/scene units/.test(String(e??""))?`${i} (${t})`:i}c(Ka,"unitsLabel");const Ga=[{id:"main",header:"",icon:""},{id:"appearance",header:"Appearance",icon:"mdi:palette-outline"},{id:"position",header:"Position and motion",icon:"mdi:axis-arrow"},{id:"visibility",header:"Visibility and distance",icon:"mdi:map-marker-distance"},{id:"actions",header:"Actions and tags",icon:"mdi:gesture-tap"},{id:"advanced",header:"Advanced",icon:"mdi:tune-variant"}],Wa={appearance:["opacity"],position:["at","rotation","face","spin"],visibility:["visible","min_distance","max_distance","fade","hide_in_systems","look"],actions:["tags","tap_action","hold_action","view"]},Ya=/(^|_)(colou?rs?|opacity|glow|dash|blend|material|scanlines|edges)$|^(colou?r_|line_width|width|image|scan|fill$|style|falloff|pulse$)/,qa=new Set(["occlude"]);function Ja(i,e){const t=Re(e).group;if(typeof t=="string")return t;for(const[a,s]of Object.entries(Wa))if(s.includes(i))return a;return qa.has(i)?"advanced":Ya.test(i)?"appearance":"main"}c(Ja,"groupOf");const Qa={backdrop:"mdi:weather-night",stars:"mdi:star-four-points-outline",dust:"mdi:blur",labels:"mdi:label-outline",clock:"mdi:clock-outline",buttons:"mdi:gesture-tap-button",limits:"mdi:arrow-expand-all",target:"mdi:crosshairs",fill:"mdi:texture-box",effect:"mdi:texture-box",deform:"mdi:waves",cells:"mdi:grid",ring_labels:"mdi:label-multiple-outline",axis_labels:"mdi:label-multiple-outline",pulse:"mdi:pulse",clouds:"mdi:weather-cloudy",text:"mdi:format-text",default:"mdi:format-text",styles:"mdi:format-list-text",outline:"mdi:vector-polygon",animation:"mdi:animation-play",sky:"mdi:weather-sunset",body:"mdi:earth",orbit:"mdi:orbit",well:"mdi:chart-bell-curve",edges:"mdi:vector-square",major:"mdi:grid-large",scan:"mdi:radar",band:"mdi:ring",faces:"mdi:cube-outline",rim:"mdi:circle-outline",core:"mdi:circle-slice-8",nucleus:"mdi:circle-small",coma:"mdi:blur-radial",tail:"mdi:arrow-right-thin",ion_tail:"mdi:arrow-right-thin",dust_tail:"mdi:weather-windy",activity:"mdi:sun-thermometer-outline",arms:"mdi:rotate-orbit",bar:"mdi:minus",spectrum:"mdi:looks",glow:"mdi:brightness-7"};function ie(i,e){const t=Qa[i];return t||(e==="objectList"?"mdi:format-list-bulleted":e==="item"?"mdi:circle-medium":e==="yaml"?"mdi:code-braces":"mdi:tune-variant")}c(ie,"sectionIcon");const ut=c(i=>((i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf)??[]).find(me)??null,"objectAlternative");function Za(i){const e=ut(i);if(!e)return null;const t=(i.oneOf??i.anyOf).find(s=>s!==e),a=Object.keys(e.properties);return a.find(s=>e.properties[s]===t)??a[0]??null}c(Za,"shorthandKey");function Zt(i,e){for(const t of String(i??"").matchAll(/\[([^\]]+)\]/g)){const a=t[1].split(",").map(s=>s.trim());if(a.length===e&&a.every(s=>s&&s.length<=16&&!/^-?\d/.test(s)))return a}return Array.from({length:e},(t,a)=>String(a+1))}c(Zt,"tupleLabels");const Xa=c(i=>{var e,t;return ye(i)?i.minItems:((t=(e=(i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf))==null?void 0:e.find(ye))==null?void 0:t.minItems)??0},"tupleSize");function Ae(i){const e=String(i).replace(/_/g," ");return e.charAt(0).toUpperCase()+e.slice(1)}c(Ae,"labelFor");function Ge(i){const e=String(i??"").trim();if(!e)return"";const t=e.split(new RegExp("(?<=[.!?])\\s+")).map(n=>n.trim()).filter(Boolean),a=t[0],s=t.slice(1).find(n=>/^Default\b/.test(n));return s?`${a} ${s}`:a}c(Ge,"helperText");function es(i,e){const t=String(i??"").split(/;\s+/).map(n=>ts(n,e)),a=t[0];if(!a||a.values===null)return a;const s=new Set(a.values);for(const n of t.slice(1))n&&n.key===a.key&&n.values&&n.values.forEach(r=>s.add(r));return{key:a.key,values:[...s]}}c(es,"scopeOf");function ts(i,e){var r;const t=/^([a-z_]+(?: [a-z_]+)?(?:(?:, | or | and )[a-z_]+)*)(?: \([^)]*\))?:\s/.exec(i);if(!t)return null;const a=t[1],s=/^([a-z_]+) ([a-z_]+)$/.exec(a);if(s&&Array.isArray((r=e[s[1]])==null?void 0:r.enum)&&e[s[1]].enum.includes(s[2]))return{key:s[1],values:[s[2]]};const n=a.split(/, | or | and /).map(l=>l.trim());if(n.some(l=>l.includes(" ")))return null;for(const[l,o]of Object.entries(e)){const d=Array.isArray(o==null?void 0:o.enum)?o.enum:null;if(d&&n.every(u=>d.includes(u)))return{key:l,values:n}}return n.length===1&&e[n[0]]!==void 0?{key:n[0],values:null}:null}c(ts,"scopeOfSegment");function is(i,e,t){var n,r;if((t==null?void 0:t[i])!==void 0)return true;const a=es((n=e[i])==null?void 0:n.description,e);if(!a||a.key===i)return true;const s=(t==null?void 0:t[a.key])??((r=e[a.key])==null?void 0:r.default);return a.values===null?s!==void 0:s===void 0?true:a.values.includes(s)}c(is,"appliesTo");function as(i,e){const t=((i==null?void 0:i.oneOf)??[]).find(n=>{var r,l;return((l=(r=n==null?void 0:n.properties)==null?void 0:r.type)==null?void 0:l.const)===e});if(!t)return null;const a={};for(const n of t.allOf??[])Object.assign(a,(n==null?void 0:n.properties)??{});const s={...t.properties};delete s.type;for(const n of Object.keys(s))delete a[n];return{branch:t,own:s,common:a}}c(as,"objectBranch");const Pe=c(i=>i==null||i===""||typeof i=="number"&&Number.isNaN(i)||Array.isArray(i)&&i.length===0||H(i)&&Object.keys(i).length===0,"isUnset");function We(i,e,t){const a={...i??{}};return Pe(t)?delete a[e]:a[e]=t,a}c(We,"withKey");function ss(i){const e=String(i??"").split(/[\s,]+/).filter(Boolean).map(Number).filter(t=>Number.isFinite(t));return e.length?e:void 0}c(ss,"parseNumbers");function ns(i){if(!H(i))return"";const e=[i.shape??i.material??i.sky].filter(Boolean).map(String),t=i.radius??i.size;(typeof t=="number"||Array.isArray(t))&&e.push(Array.isArray(t)?t.map(s=>Q(s)?"entity":q(s)?"template":s).join(" x "):String(t)),i.type==="system"&&i.units&&e.push(`in ${i.units}`),typeof i.at=="string"&&e.push(`at ${i.at}`),!e.length&&typeof i.from=="string"&&typeof i.to=="string"&&e.push(`${i.from} to ${i.to}`),!e.length&&i.type==="path"&&Array.isArray(i.points)&&e.push(`${i.points.length} points`),!e.length&&typeof i.point=="string"&&e.push(`behind ${i.point}`),i.visible===false&&e.push("hidden");const a=re(i);return a.length&&e.push(`follows ${a.join(", ")}`),e.join(" · ")}c(ns,"objectSummary");const rs=new Set(["label","text","tap_action","hold_action","card"]);function re(i){const e=new Set,t=c(a=>{if(Q(a)){e.add(a.entity?String(a.entity):"an entity");return}if(typeof a=="string"){/\[\[\[|\{\{|\{[A-Za-z_]/.test(a)&&e.add("a template");return}if(Array.isArray(a)){a.forEach(t);return}if(H(a))for(const[s,n]of Object.entries(a))rs.has(s)||t(n)},"walk");return t(i),[...e]}c(re,"boundIn");const os=c((i,e)=>e.some(t=>re(i==null?void 0:i[t]).length>0),"keysBound");function pt(i,e){const t=new Set([...e].map(String));let a=1;for(;t.has(`${i}${a}`);)a++;return`${i}${a}`}c(pt,"freshId");const Xt={grid:c(i=>({size:200*i,line_spacing:10*i}),"grid"),volume:c(i=>({radius:[50*i,100*i],height:[0,10*i]}),"volume"),sphere:c(i=>({radius:10*i}),"sphere"),image:c(i=>({size:200*i}),"image"),glow:c(i=>({size:60*i}),"glow"),nebula:c(i=>({radius:100*i}),"nebula"),model:c(i=>({size:50*i}),"model"),belt:c(i=>({radius:[80*i,100*i],size:[.4*i,1.6*i]}),"belt"),asteroid:c(i=>({size:4*i}),"asteroid"),comet:c(i=>({nucleus:{size:2*i},coma:{size:10*i},tail:{length:60*i}}),"comet"),cube:c(i=>({size:20*i}),"cube")},ls=new Set(["path","beam","trail","satellites"]);function cs(i){if(!(i>0)||!Number.isFinite(i))return 1;const e=i/280;if(e>=1/3&&e<=3)return 1;const t=Math.floor(Math.log10(e)),a=e/10**t,s=a<1.5?1:a<3.5?2:a<7.5?5:10;return Number((s*10**t).toPrecision(1))}c(cs,"viewScale");function ds(i,e,t,a={}){const s={type:i,id:pt(i,e)},n=a.scale??1,r=a.at,l=Array.isArray(r)?r:[0,0,0],o=c(y=>[l[0]+y*n,l[1],l[2]].map(D),"end");r!==void 0&&!ls.has(i)&&(s.at=r);const[d,u]=t;switch(i){case"model":s.src="builtin:constitution_class_refit";break;case"ring":s.radius=D(50*n);break;case"path":d&&u?s.points=[d,u]:s.points=[o(-50),o(50)];break;case"beam":s.from=d??o(-50),s.to=u??o(50);break;case"trail":d&&(s.point=d);break;case"galaxy":s.radius=D(100*n);break;case"satellites":s.object=a.sphere??"earth",s.group="gps",s.heights="diagram",s.orbits=true;break}if(n!==1&&Xt[i]&&!(i==="model"&&a.real)){const y=c(h=>Array.isArray(h)?h.map(D):H(h)?Object.fromEntries(Object.entries(h).map(([m,f])=>[m,y(f)])):D(h),"scaled");for(const[h,m]of Object.entries(Xt[i](n)))s[h]=y(m)}return s}c(ds,"newObject");function hs(i,e){if(!i||e.shape===i.shape)return e;const t={...e},a=c(n=>Array.isArray(n)?Number(n[1]??n[0]):Number(n),"outer"),s=c(n=>Array.isArray(n)?Math.max(...n.map(Number)):Number(n),"widest");if(i.type==="grid"){const n=(e.shape??"plane")==="plane";n&&t.size===void 0&&i.radius!==void 0&&(t.size=D(a(i.radius)*2)),!n&&t.radius===void 0&&i.size!==void 0&&(t.radius=D(s(i.size)/2))}else if(i.type==="volume"&&(e.shape==="box"&&t.size===void 0&&i.radius!==void 0&&(t.size=D(a(i.radius))),(e.shape??"sector")==="sector"&&t.radius===void 0&&i.size!==void 0)){const n=s(i.size);t.radius=[D(n/2),D(n)]}return t}c(hs,"reshape");function D(i){return Number.isFinite(i)&&i!==0?Number(i.toPrecision(3)):i}c(D,"round");const us=40,ps=.1,le=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$8");function B(i){return le(i)&&le(i.views)?i.views:{}}c(B,"viewsOf");function ms(i){const e=B(i),t=i==null?void 0:i.view;return t!==void 0&&e[t]?String(t):Object.keys(e)[0]}c(ms,"startViewName");function fs(i,e){let t=null,a=ps;for(const[s,n]of Object.entries(e)){const r=Math.hypot(n[0]-i[0],n[1]-i[1],n[2]-i[2]);r<=a&&(t=s,a=r)}return t}c(fs,"pointAt");function ys(i,e,t={}){const{fov:a,projection:s,...n}=le(t)?t:{},r={...n,target:fs(i.target,e)??i.target,yaw:i.yaw,tilt:i.tilt,distance:i.distance};return i.projection==="orthographic"?r.projection="orthographic":(i.fov!==us||(t==null?void 0:t.fov)!==void 0)&&(r.fov=i.fov),r}c(ys,"captureView");function bs(i){let e=1;for(;`view${e}`in i;)e++;return`view${e}`}c(bs,"freshViewName");function be(i,e){const t={...le(i)?i:{}};return Object.keys(e).length?t.views=e:delete t.views,t.view!==void 0&&!(t.view in e)&&delete t.view,Object.keys(t).length?t:void 0}c(be,"withViews");function ei(i,e,t){return be(i,{...B(i),[e]:t})}c(ei,"setView");function gs(i,e){const{[e]:t,...a}=B(i);return be(i,a)}c(gs,"deleteView");function ti(i,e,t){const a=Object.entries(B(i)),s=a.findIndex(([r])=>r===e),n=s+t;return s<0||n<0||n>=a.length?be(i,B(i)):([a[s],a[n]]=[a[n],a[s]],be(i,Object.fromEntries(a)))}c(ti,"moveView");function _s(i,e,t){return e.trim()?e!==t&&e in i?`There is already a view named ${e}.`:null:"A view needs a name."}c(_s,"viewNameProblem");function ws(i,e,t){if(e===t)return i;const a=i.camera,s=Object.fromEntries(Object.entries(B(a)).map(([r,l])=>[r===e?t:r,l])),n=mt({...i},e,t);return n.camera={...be(a,s),...(a==null?void 0:a.view)===e?{view:t}:{}},n}c(ws,"renameView");function mt(i,e,t){if(Array.isArray(i))return i.map(s=>mt(s,e,t));if(!le(i))return i;const a={};for(const[s,n]of Object.entries(i))a[s]=s==="camera"?n:mt(n,e,t);return a.action==="fly-to"&&a.view===e&&a.card===void 0&&(a.view=t),a}c(mt,"renameFlyTo");function vs(i){if(!le(i))return"";const e=c(a=>typeof a=="number"?Math.round(a*10)/10:a,"r"),t=Array.isArray(i.target)?i.target.map(e).join(", "):i.target;return[t!==void 0?`at ${t}`:null,i.yaw!==void 0?`yaw ${e(i.yaw)}`:null,i.tilt!==void 0?`tilt ${e(i.tilt)}`:null,i.distance!==void 0?`distance ${e(i.distance)}`:null,i.projection==="orthographic"?"flat":null].filter(Boolean).join(" · ")}c(vs,"viewSummary");const $s={id:"galaxy",kind:"scene",title:"Galaxy with territories",summary:"A galaxy disc with Federation and Borg space and a route",description:"A galaxy disc with its core, Federation and Borg space as see-through volumes, crossing beams, a planet with an away team (it appears as you fly in) and a route between two stars.",icon:"mdi:star-four-points-outline",params:[],build:c(()=>({views:{galaxy:{target:"core",yaw:20,tilt:35,distance:280},map:{target:"core",tilt:90,distance:300},planet:{target:"nimbus",yaw:60,tilt:20,distance:40}},camera:{view:"galaxy"},backdrop:{stars:{count:2500}},points:[{id:"core",xyz:[0,0,0],label:"GALACTIC CORE",style:"title"},{id:"sagittarius",polar:[45,300],label:"Sagittarius Arm",style:"major"},{id:"federation",polar:[75,135],alt:22,label:"FEDERATION",style:"major",color:"var(--lcars-blue)"},{id:"borg",polar:[30,345],alt:44,label:"BORG SPACE",style:"major",color:"var(--lcars-green)"},{id:"talos",polar:[52,310],marker:"dot",label:"Talos IV",style:"tiny",max_distance:200},{id:"vega",polar:[64,160],marker:"triangle",label:"Vega",style:"minor"},{id:"nimbus",polar:[72,236],alt:12,marker:"reticle",label:"NIMBUS III",tap_action:{action:"fly-to",view:"planet"}},{id:"away",latlon:[10,40],object:"planet",alt:.3,marker:"dot",label:"AWAY TEAM",style:"tiny",color:"var(--lcars-orange)",max_distance:100}],objects:[{type:"grid",shape:"disc",radius:100,pattern:"polar",line_spacing:10,spoke_count:36,major:{row_interval:3},ring_labels:{step:10,radius:106}},{type:"ring",radius:100,width:3,color:"theme:colors.ui.secondary"},{type:"volume",id:"federation_space",shape:"sector",radius:[55,95],angle:[100,170],height:[-6,18],cells:{ring:10,angle:10,layer:8},color:"var(--lcars-blue)",tap_action:{action:"fly-to"}},{type:"volume",shape:"sector",radius:[18,42],angle:[330,360],height:[0,40],color:"var(--lcars-green)"},{type:"glow",at:"core",size:70},{type:"beam",from:[-180,0,0],to:[180,0,0]},{type:"beam",from:[0,0,-180],to:[0,0,180]},{type:"sphere",id:"planet",at:"nimbus",radius:6,spin:8,max_distance:100},{type:"ring",at:"nimbus",radius:10,inclination:20,width:1.5,max_distance:100},{type:"path",points:["talos","vega"],arc:12,dash:[6,4],color:"var(--lcars-orange)"}]}),"build")},ks={id:"sector_map",kind:"scene",title:"Sector map",summary:"A flat lettered grid, seen from above, filled cell by cell",description:"A flat lettered grid seen from straight above, territories filled cell by cell; the tilt is locked, so a drag pans the map.",icon:"mdi:grid",params:[],build:c(()=>({views:{map:{target:[0,0,0],tilt:90,distance:1250,projection:"orthographic"}},camera:{view:"map",limits:{tilt:[90,90]}},objects:[{type:"grid",id:"sectors",shape:"plane",size:[1200,600],line_spacing:40,axis_labels:{columns:"letters",rows:"numbers",column_start:"AD"},cells:[{from:"AF3",to:"AH6",color:"var(--lcars-blue)",opacity:.3,shade:.4,edges:true},{from:"AL2",to:"AO5",color:"var(--lcars-green)",opacity:.25,shade:.4},{from:"AL9",to:"AP12",color:"var(--lcars-red)",opacity:.3,shade:.4}]}],points:[{id:"ufp",cell:"AG4",object:"sectors",label:"UNITED FEDERATION OF PLANETS",style:"major"},{id:"sb10",cell:"AJ2",object:"sectors",offset:[8,0,12],marker:"triangle",label:"Starbase 10"},{id:"achernar",cell:"AN3",object:"sectors",marker:"diamond",label:"Achernar"},{id:"qualor",cell:"AL6",object:"sectors",marker:"dot",label:"Qualor",style:"tiny",max_distance:1300}]}),"build")},xs={id:"sky_dome",kind:"scene",title:"Sky dome: the sun and moon",summary:"The sun and moon over your home, where they are now",description:"A dome over your home with the sun and moon where they are now and today's tracks across the sky, from your Home Assistant location.",icon:"mdi:weather-sunset",params:[],build:c(()=>({views:{horizon:{target:[0,15,0],yaw:180,tilt:28,distance:260},zenith:{target:[0,0,0],tilt:90,distance:260}},camera:{view:"horizon"},objects:[{type:"grid",id:"sky",shape:"dome",radius:100,pattern:"both",line_spacing_deg:15},{type:"ring",radius:100,width:3,color:"theme:colors.ui.primary"},{type:"path",sky:"sun",object:"sky",dash:[6,4],color:"var(--lcars-yellow)"},{type:"path",sky:"moon",object:"sky",dash:[6,4],color:"var(--lcars-blue)"}],points:[{id:"sun",sky:"sun",object:"sky",marker:"reticle",label:"SOL"},{id:"moon",sky:"moon",object:"sky",marker:"moon_phase",label:"LUNA"},{id:"north",altaz:[0,0],object:"sky",label:"N",style:"major",overlap:true},{id:"east",altaz:[90,0],object:"sky",label:"E",style:"major",overlap:true},{id:"south",altaz:[180,0],object:"sky",label:"S",style:"major",overlap:true},{id:"west",altaz:[270,0],object:"sky",label:"W",style:"major",overlap:true}]}),"build")},ii=[["mercury","MERCURY",20,1.2,24,40,7,48.3],["venus","VENUS",30,2,16,150,3.39,76.7],["earth","EARTH",42,2.4,10,250,0,0],["mars","MARS",56,1.6,6,320,1.85,49.6],["jupiter","JUPITER",82,5,2.5,100,1.3,100.5],["saturn","SATURN",112,4.2,1.6,200,2.49,113.7],["uranus","URANUS",138,3,1.1,20,.77,74],["neptune","NEPTUNE",160,3,.8,280,1.77,131.8],["pluto","PLUTO",184,.9,.55,160,17.16,110.3]],Ss={mercury:{image:"builtin:mercury_messenger"},venus:{fill:{effect:{preset:"clouds"}}},earth:{image:"builtin:earth_blue_marble"},mars:{image:"builtin:mars_viking"},jupiter:{image:"builtin:jupiter_cassini"},saturn:{fill:{effect:{preset:"ringed_giant"}}},uranus:{fill:{effect:{preset:"ice_giant"}}},neptune:{fill:{effect:{preset:"storm_giant"}}},pluto:{image:"builtin:pluto_new_horizons"}},As={id:"solar_system",kind:"scene",title:"Solar system",summary:"The Sun, eight planets and Pluto on their tilted orbits, with maps",description:"The Sun, eight planets and Pluto, each orbit tilted as the real one is and each planet with its map or planet type, Saturn with its rings and the Moon going round the Earth. Tap a planet to fly to it.",icon:"mdi:orbit",params:[],build:c(()=>({views:{system:{target:"sun",yaw:20,tilt:40,distance:440},top:{target:"sun",tilt:90,distance:460},earth:{target:"earth",yaw:30,tilt:20,distance:22}},camera:{view:"system"},backdrop:{stars:{count:2e3}},points:[{id:"sun",xyz:[0,0,0],label:"SOL",style:"major"},...ii.map(([i,e,t,,,a])=>({id:i,polar:[t,a],object:`${i}_orbit`,marker:"dot",label:e,style:"minor",tap_action:{action:"fly-to"}})),{id:"moon",polar:[5,0],object:"moon_orbit",marker:"dot",label:"LUNA",style:"tiny",max_distance:80}],objects:[{type:"glow",at:"sun",size:40,color:"var(--lcars-yellow)"},{type:"sphere",id:"sun_body",at:"sun",radius:5,fill:{color:"var(--lcars-yellow)"},color:"var(--lcars-orange)",line_spacing_deg:30},...ii.flatMap(([i,,e,t,a,,s,n])=>[{type:"ring",id:`${i}_orbit`,radius:e,spin:a,width:1,color:"theme:colors.ui.secondary",opacity:.6,...s?{rotation:[s,n,0]}:{}},{type:"sphere",id:`${i}_body`,at:i,radius:t,...Ss[i],line_spacing_deg:30,line_width:.5,spin:i==="earth"?20:15}]),{type:"ring",id:"saturn_rings",at:"saturn",radius:9.8,inclination:27,band:{image:"builtin:saturn_rings",inner_radius:4.66}},{type:"ring",id:"moon_orbit",at:"earth",radius:5,spin:40,width:1,dash:[3,3],opacity:.6,max_distance:80},{type:"sphere",id:"moon_body",at:"moon",radius:.6,image:"builtin:moon_lroc",line_spacing_deg:45,line_width:.5,max_distance:80}]}),"build")},Os={id:"federation_map",kind:"scene",title:"Federation map",summary:"The Alpha and Beta Quadrant powers as territories on a disc",description:"The Alpha and Beta Quadrant powers as territories on a disc, their capitals, the Romulan Neutral Zone and a route from Earth to Qo'noS.",icon:"mdi:map-legend",params:[],build:c(()=>({views:{overview:{target:[0,0,-10],yaw:200,tilt:50,distance:350},top:{target:[0,0,0],tilt:90,distance:300,projection:"orthographic"},sol:{target:"earth",yaw:220,tilt:35,distance:80}},camera:{view:"overview"},backdrop:{stars:{count:1500}},points:[{id:"federation",polar:[60,165],alt:14,label:"UNITED FEDERATION OF PLANETS",style:"major",color:"var(--lcars-blue)"},{id:"klingon",polar:[80,45],alt:14,label:"KLINGON EMPIRE",style:"major",color:"var(--lcars-red)"},{id:"romulan",polar:[90,320],alt:14,label:"ROMULAN STAR EMPIRE",style:"major",color:"var(--lcars-green)"},{id:"cardassian",polar:[85,235],alt:14,label:"CARDASSIAN UNION",style:"major",color:"var(--lcars-orange)"},{id:"earth",polar:[45,170],marker:"reticle",label:"Earth",tap_action:{action:"fly-to",view:"sol"}},{id:"vulcan",polar:[52,150],marker:"dot",label:"Vulcan",style:"tiny"},{id:"qonos",polar:[80,40],marker:"diamond",label:"Qo'noS"},{id:"romulus",polar:[95,325],marker:"diamond",label:"Romulus"},{id:"cardassia",polar:[90,230],marker:"diamond",label:"Cardassia Prime"},{id:"neutral_zone",polar:[60,330],label:"NEUTRAL ZONE",style:"tiny",color:"var(--lcars-green)"}],objects:[{type:"grid",shape:"disc",radius:130,pattern:"polar",line_spacing:10,spoke_count:36,major:{row_interval:3},opacity:.6},{type:"ring",radius:130,width:2,color:"theme:colors.ui.secondary"},{type:"volume",id:"federation_space",shape:"sector",radius:[25,75],angle:[130,200],height:[-4,6],color:"var(--lcars-blue)",tap_action:{action:"fly-to"}},{type:"volume",id:"klingon_space",shape:"sector",radius:[50,110],angle:[15,75],height:[-4,6],color:"var(--lcars-red)",tap_action:{action:"fly-to"}},{type:"volume",id:"romulan_space",shape:"sector",radius:[65,120],angle:[295,350],height:[-4,6],color:"var(--lcars-green)",tap_action:{action:"fly-to"}},{type:"volume",id:"cardassian_space",shape:"sector",radius:[60,115],angle:[210,255],height:[-4,6],color:"var(--lcars-orange)",tap_action:{action:"fly-to"}},{type:"ring",radius:62,arc:[295,350],width:2,dash:[6,4],color:"var(--lcars-green)"},{type:"path",points:["earth","qonos"],arc:10,dash:{pattern:[6,4],speed:20},color:"var(--lcars-orange)"},{type:"glow",at:[0,0,0],size:40,opacity:.6}]}),"build")},js={id:"starbase_approach",kind:"scene",title:"Starbase approach",summary:"A starship flying into Earth Spacedock, to scale",description:"The built-in refit Constitution-class starship on its way into Earth Spacedock through the space doors, with its bridge and nacelles marked and the approach lane drawn. To scale: the ship is 305 m long, Spacedock about 5.5 km tall and its doors 700 m wide.",icon:"mdi:space-station",params:[],build:c(()=>({views:{approach:{target:[0,90,15],yaw:125,tilt:20,distance:300},starbase:{target:"dock",yaw:200,tilt:30,distance:420},ship:{target:"ship_centre",yaw:140,tilt:25,distance:50}},camera:{view:"approach"},backdrop:{stars:{count:2e3}},points:[{id:"ship_centre",xyz:[0,129,41]},{id:"ship_name",at:"ship_centre",offset:[0,12,0],label:"USS ENTERPRISE",style:"major",tap_action:{action:"fly-to",view:"ship"}},{id:"bridge",object:"ship",part:"bridge",marker:"dot",label:"BRIDGE",style:"tiny"},{id:"port",object:"ship",part:"nacelle_port",marker:"dot",label:"PORT NACELLE",style:"tiny"},{id:"starboard",object:"ship",part:"nacelle_starboard",marker:"dot",label:"STARBOARD NACELLE",style:"tiny"},{id:"doors",xyz:[0,62,-9],marker:"dot",label:"SPACE DOORS",style:"minor"},{id:"dock",at:"doors",offset:[0,50,0],label:"SPACEDOCK",style:"major",tap_action:{action:"fly-to",view:"starbase"}}],objects:[{type:"model",id:"ship",src:"builtin:constitution_class_refit",at:"ship_centre",size:26.7,rotation:[0,180,0],scan:{period:6},animation:"all"},{type:"model",id:"spacedock",src:"builtin:earth_spacedock",at:[0,-110,-110],size:480,material:"original"},{type:"path",points:["ship_centre","doors"],dash:{pattern:[4,6],speed:-30},color:"var(--lcars-orange)"}]}),"build")},Ts={id:"deep_space_nine",kind:"scene",title:"Deep Space 9",summary:"Deep Space 9 with its parts marked, the wormhole and Bajor",description:"The built-in Deep Space 9 station with Ops, the Promenade and its docking pylons marked, the Bajoran wormhole off its bow and Bajor below. Tap a name to fly to it.",icon:"mdi:space-station",params:[],build:c(()=>({views:{station:{target:"ds9_centre",yaw:30,tilt:10,distance:190},ops:{target:"ops",yaw:50,tilt:25,distance:70},wormhole:{target:"wormhole",yaw:150,tilt:8,distance:120},sector:{target:[0,-40,120],yaw:60,tilt:20,distance:520}},camera:{view:"station"},backdrop:{stars:{count:2500}},points:[{id:"ds9_centre",xyz:[0,0,0]},{id:"ds9_name",at:"ds9_centre",offset:[0,70,0],label:"DEEP SPACE 9",style:"major",tap_action:{action:"fly-to",view:"station"}},{id:"ops",object:"ds9",part:"ops",marker:"dot",label:"OPS",style:"minor",tap_action:{action:"fly-to",view:"ops"}},{id:"promenade",object:"ds9",part:"promenade",marker:"dot",label:"PROMENADE",style:"tiny"},{id:"habitat",object:"ds9",part:"habitat_ring",marker:"dot",label:"HABITAT RING",style:"tiny"},{id:"pylon1",object:"ds9",part:"upper_pylon_1",marker:"dot",label:"UPPER PYLON 1",style:"tiny"},{id:"pylon2",object:"ds9",part:"upper_pylon_2",marker:"dot",label:"UPPER PYLON 2",style:"tiny"},{id:"pylon3",object:"ds9",part:"upper_pylon_3",marker:"dot",label:"UPPER PYLON 3",style:"tiny"},{id:"wormhole",xyz:[0,10,300],label:"BAJORAN WORMHOLE",style:"minor",tap_action:{action:"fly-to",view:"wormhole"}},{id:"bajor",xyz:[-160,-260,-40]},{id:"bajor_name",at:"bajor",offset:[0,30,125],label:"BAJOR",style:"minor"}],objects:[{type:"model",id:"ds9",src:"builtin:deep_space_nine",at:"ds9_centre",size:100,material:"original"},{type:"glow",at:"wormhole",size:90,color:"var(--lcars-blue)"},{type:"glow",at:"wormhole",size:40,color:"var(--lcards-moonlight)"},{type:"ring",at:"wormhole",radius:26,rotation:[90,0,0],spin:40,dash:[2,4],width:1.5,color:"var(--lcars-blue)"},{type:"sphere",at:"bajor",radius:120,fill:{effect:{preset:"terran"}},line_spacing_deg:30,line_width:.5,opacity:.3,spin:3}]}),"build")},ft=[0,0,26e3],fe=c((i,e,t=0)=>[i,t,ft[2]+e],"nearSol"),Es=[[-.0548755604,-.8734370902,-.4838350155],[.4941094279,-.44482963,.7469822445],[-.867666149,-.1980763734,.4559837762]];function Ps(i,e,t){const a=i*15*Math.PI/180,s=e*Math.PI/180,n=[Math.cos(s)*Math.cos(a),Math.cos(s)*Math.sin(a),Math.sin(s)],r=Es.map(o=>o[0]*n[0]+o[1]*n[1]+o[2]*n[2]),l=c(o=>Math.round(o*100)/100,"r");return[l(-r[1]*t),l(r[2]*t),l(-r[0]*t)]}c(Ps,"starOffset");const Ns=[["vulcan","Vulcan (40 Eridani)",4.2545,-7.6529,16.26,"dot","var(--lcars-blue)"],["andoria","Andoria (Procyon)",7.655,5.225,11.46,"dot","var(--lcars-blue)"],["tellar","Tellar (61 Cygni)",21.115,38.7494,11.4,"dot","var(--lcars-blue)"],["alpha_centauri","Alpha Centauri",14.66,-60.834,4.37,"dot","var(--lcards-moonlight)"],["wolf_359","Wolf 359",10.9414,7.0147,7.86,"dot","var(--lcards-moonlight)"],["vega","Vega",18.6156,38.7837,25.04,"dot","var(--lcards-moonlight)"],["altair","Altair",19.8464,8.8683,16.73,"dot","var(--lcards-moonlight)"]],zs=[["qonos","Qo'noS",64,-90,"diamond","var(--lcars-red)"],["romulus","Romulus",112,26,"diamond","var(--lcars-green)"],["remus","Remus",113,27.5,"dot","var(--lcars-green)"],["bajor","Bajor",-46,24,"diamond","var(--lcars-yellow)"],["cardassia","Cardassia Prime",-50.9,26,"diamond","var(--lcars-orange)"]],ai=[["federation","UNITED FEDERATION OF PLANETS","var(--lcars-blue)",[[-4800,23200],[-1200,21800],[2200,23e3],[2600,27200],[800,3e4],[-3200,30400],[-5200,27600]],[-1200,26e3],true],["klingon","KLINGON EMPIRE","var(--lcars-red)",[[2400,22600],[6200,21400],[8400,24200],[7400,27600],[3e3,27e3]],[5600,24400],true],["romulan","ROMULAN STAR EMPIRE","var(--lcars-green)",[[2800,27400],[7200,28e3],[7800,31800],[3600,32600],[1200,30400]],[4800,30200],true],["cardassian","CARDASSIAN UNION","var(--lcars-orange)",[[-5400,27800],[-8800,26600],[-10400,29600],[-8200,32200],[-4600,31e3]],[-7600,29400],true],["dominion","THE DOMINION","var(--lcars-violet)",[[-3e4,-27e3],[-41e3,-22e3],[-46e3,-32e3],[-4e4,-41e3],[-29e3,-37e3]],[-41e3,-25500],false],["borg","BORG COLLECTIVE","var(--lcars-green)",[[14e3,-14e3],[3e4,-1e4],[4e4,-24e3],[32e3,-4e4],[16e3,-34e3],[1e4,-22e3]],[24e3,-24e3],false]],si=[["ocampa","OCAMPA",37e3,-33e3],["nekrit","Nekrit Expanse",31e3,-22e3],["northwest_passage","Northwest Passage",22e3,-9e3],["endgame","Transwarp conduit",9e3,8e3]],Qi=4e3,ni=Math.round(Math.PI*Qi),Et=Object.freeze({color:"var(--lcars-blue)",width:8,line_look:"tube",glow:3,pulse:true,dash:{speed:30}}),Cs=Object.freeze(["var(--lcards-moonlight)","var(--lcards-orange-lightest)","var(--lcars-violet)","var(--lcards-blue-medium)","var(--lcars-violet)","var(--lcards-blue-medium-dark)","var(--lcards-blue-medium)","var(--lcards-blue-dark)"]),Is=Object.freeze({swirl:Cs,diagram:"var(--lcars-blue)",arms:"var(--lcards-blue-light)",heart:"var(--lcards-orange-lightest)",wisps:["var(--lcars-violet)","var(--lcards-blue-medium)"],haze:["var(--lcards-orange-lightest)","var(--lcards-blue-light)"]}),ri=Array.from({length:16},(i,e)=>{const t=e/15;return[.15+5*t,.7+1.8*t,.65*(1-t)**1.5+.04]}),W=c(i=>Math.round(i*1e3)/1e3,"r3");function Zi(i){let e=null;const t={};let a;if(typeof i=="string"&&i.trim())e={entity:i.trim()};else if(i&&typeof i=="object"&&typeof i.entity=="string"&&i.entity.trim()){e={entity:i.entity.trim()},typeof i.attribute=="string"&&i.attribute.trim()&&(e.attribute=i.attribute.trim()),Array.isArray(i.input)&&i.input.length===2&&i.input.every(Number.isFinite)&&(e.input=[...i.input]),i.clamp===false&&(e.clamp=false);for(const[l,o]of Object.entries(i))l==="default"?typeof o=="number"&&Number.isFinite(o)&&(a=o):!Ui.includes(l)&&typeof o=="number"&&Number.isFinite(o)&&(t[l]=o)}const s=typeof i=="number"?i:Number.NaN,n=e||!Number.isFinite(s)?null:Math.min(100,Math.max(0,s));return{bind:e,fixed:n,follow:c((l,o,{smooth:d,closed:u}={})=>{const y=c(h=>W(l+(o-l)*Math.min(1,Math.max(0,h/100)))||0,"at");return{...e,output:[W(l)||0,W(o)],...Object.fromEntries(Object.entries(t).map(([h,m])=>[h,y(m)])),default:a!==void 0?y(a):W(u??l)||0,...d?{smooth:d}:{}}},"follow")}}c(Zi,"wormholePower");function Xi({prefix:i,at:e,aim:t,radius:a,depth:s,power:n,extra:r={},stars:l=4e3,glow:o=5,palette:d={},turn:u=1}){const y={...Is,...d},{bind:h,fixed:m,follow:f}=Zi(n),b=m===null?1:m/100,g=c((v,x,C)=>h?f(v,x,{smooth:C}):W(v+(x-v)*b),"opens"),w=!!h||b<1,A=c((v,x)=>h?f(-v*x/(1-x),v,{smooth:1500,closed:0}):W(Math.max(0,v*(b-x)/(1-x))),"shaftOpacity"),j=`${i}_mouth`,k={shape:"well",well:{shape:"trumpet",throat:.1},at:e,face:t,radius:g(.15*a,a,1500),depth:s},$={type:"wobble",lobes:0,waves:2,period:3,amplitude:h?f(0,.1):W(.06*b)},T=1.5*a;return{points:[{id:`${i}_throat`,object:j,xyz:[0,-s,0]},{id:`${i}_out`,object:j,xyz:[0,6*a,0]},{id:`${i}_haze`,object:j,xyz:[0,1.6*a,0]},...ri.map(([v],x)=>({id:`${i}_shaft_${x+1}`,object:j,xyz:[0,W(v*a),0]}))],objects:[{type:"grid",id:j,...k,line_spacing_deg:20,color:y.diagram,scan:{period:4},look:"diagram",deform:[{type:"twist",angle:60*u,anchor:"top"},$],...r},{type:"ring",id:`${i}_ring`,at:e,face:t,radius:1.75*a,dash:{pattern:[6,10],speed:40},width:2,spin:g(0,90*u),look:"diagram",...d.diagram?{color:y.diagram}:{},...r},{type:"glow",id:`${i}_glow`,at:e,color:y.diagram,size:g(.5*a,o*a),look:"diagram",...r},{type:"grid",id:`${i}_funnel`,...k,radius:T,line_width:0,edges:false,look:"realistic",well:{...k.well,throat:.07,...w?{to:{profile:[.02,.02]},morph:g(1,0,1200)}:{}},depth:g(.02*s,s,700),fill:{effect:{type:"swirl",colors:[...y.swirl],speed:.2*T*u,turbulence:.8,num_octaves:5}},deform:[{type:"twist",angle:80*u,anchor:"top",period:6},$],...r},{type:"nebula",id:`${i}_gas`,render:"volume",shape:"whirlpool",at:e,face:t,look:"realistic",radius:g(.15*1.05*T,1.05*T,1500),opacity:g(0,1),arms:{count:3,pitch:18},thickness:.1,turbulence:.6,seed:4,colors:[...y.gas??[y.swirl[0],y.swirl[2],y.swirl[3],y.swirl[y.swirl.length-1]]],core:{color:y.heart},spin:g(4*u,15*u),...r},{type:"galaxy",id:`${i}_vortex`,at:e,face:t,look:"realistic",radius:g(.02*T,T,1500),opacity:g(0,.45,1500),arms:{count:4,pitch:20,color:y.arms},bar:{length:0},thickness:.02,stars:{count:l},seed:4,glow:0,dust:{amount:0},core:{color:"var(--lcards-moonlight)"},spin:g(5*u,25*u),...r},{type:"glow",id:`${i}_heart`,at:e,color:y.heart,size:g(.2*a,.8*a),look:"realistic",...r},...ri.map(([v,x,C],U)=>({type:"glow",id:`${i}_light_${U+1}`,at:`${i}_shaft_${U+1}`,size:g(.02*x*a,x*a,1500),color:y.heart,opacity:A(C,.6*U/15),look:"realistic",...r})),{type:"nebula",id:`${i}_wisps`,at:e,radius:1.2*T,count:6,seed:7,drift:.6,brightness:[.15,.35],colors:[...y.wisps],opacity:g(.1,1),look:"realistic",...r},{type:"nebula",id:`${i}_wisps_out`,at:`${i}_haze`,radius:.45*T,count:3,seed:3,drift:1,brightness:[.1,.25],colors:[...y.haze],opacity:g(0,1),look:"realistic",...r},{type:"path",id:`${i}_throat_tube`,points:[e,`${i}_throat`],...Et,...r}]}}c(Xi,"wormholeMouth");const Ms=new Set(["milky_way","voyager_route","wormhole_link"]);function Be(i){const e=c(t=>Ms.has(t.id)?t:{...t,hide_in_systems:true},"mark");return{...i,points:(i.points??[]).map(e),objects:(i.objects??[]).map(e)}}c(Be,"galaxyScale");const Ls={id:"star_trek_galaxy",kind:"scene",title:"Star Trek galaxy",summary:"The Milky Way in four quadrants with the great powers",description:"The Milky Way in light years cut into the four quadrants (the Alpha/Beta line runs from Sol to the core), with the Federation, the Klingon, Romulan and Cardassian empires, the Dominion and the Borg, the Bajoran wormhole to the Gamma Quadrant, Voyager's route home from Ocampa and the Great Barrier. Fly in to Sol for Federation space: Vulcan, Andoria and Tellar at their real stars (40 Eridani, Procyon, 61 Cygni), the Klingon, Romulan and Cardassian capitals at the distances the reference charts give. The galaxy view sizes the empires to be seen, so the two scales do not overlay exactly.",icon:"mdi:star-david",params:[],build:c(()=>{const i=c((a,s)=>Xi({prefix:`wormhole_${a}`,at:`wormhole_${a}`,aim:`wormhole_aim_${s}`,radius:.6,depth:1.6,extra:{max_distance:200}}),"mouth"),e=[i("alpha","gamma"),i("gamma","alpha")],t=c((a,s,n)=>({id:a,polar:[4e4,n],alt:6e3,label:s,style:"title",min_distance:7e4}),"quadrant");return Be({units:"ly",views:{galaxy:{target:"core",yaw:20,tilt:40,distance:13e4},quadrants:{target:"core",tilt:90,distance:15e4},federation:{target:"sol",yaw:200,tilt:45,distance:380},neighbours:{target:"sol",yaw:200,tilt:35,distance:50},bajor:{target:"bajor",yaw:160,tilt:20,distance:12},gamma:{target:"idran",yaw:30,tilt:30,distance:9e3},delta:{target:"ocampa",yaw:330,tilt:40,distance:45e3},barrier:{target:"core",yaw:40,tilt:25,distance:3e4}},camera:{view:"galaxy",fly_duration:4500,buttons:true},backdrop:{stars:{count:1500}},points:[{id:"core",xyz:[0,0,0],label:"GALACTIC CORE",style:"major",tap_action:{action:"fly-to",view:"barrier"}},t("alpha","ALPHA QUADRANT",225),t("beta","BETA QUADRANT",135),t("gamma_q","GAMMA QUADRANT",315),t("delta_q","DELTA QUADRANT",45),...ai.map(([a,s,n,,[r,l],o],d)=>({id:`${a}_name`,xyz:o?[-9e3,1500+3500*d,ft[2]]:[r,1500,l],label:s,style:o?"minor":"major",color:n,...o?{min_distance:2500}:{}})),{id:"sol",xyz:[...ft],marker:"reticle",label:"SOL",style:"major",overlap:true,tap_action:{action:"fly-to",view:"neighbours"}},...Ns.map(([a,s,n,r,l,o,d])=>{const[u,y,h]=Ps(n,r,l),m=["vulcan","andoria","tellar"].includes(a);return{id:a,xyz:fe(u,h,y),marker:o,label:s,style:m?"minor":"tiny",...m?{priority:90}:{},color:d,max_distance:150}}),...zs.map(([a,s,n,r,l,o])=>({id:a,xyz:fe(n,r),marker:l,label:s,style:"minor",color:o,max_distance:3e3,...a==="bajor"?{priority:85,tap_action:{action:"fly-to",view:"bajor"}}:{}})),{id:"wormhole_alpha",xyz:fe(-45,21.5,1),label:"BAJORAN WORMHOLE",style:"tiny",max_distance:60},{id:"idran",xyz:[-38e3,0,-32e3],marker:"diamond",label:"IDRAN",style:"minor",tap_action:{action:"fly-to",view:"gamma"}},{id:"wormhole_gamma",xyz:[-37997,1,-31996.5],label:"WORMHOLE (GAMMA END)",style:"tiny",max_distance:60},{id:"wormhole_aim_gamma",at:"wormhole_gamma",offset:[0,ni,0]},{id:"wormhole_aim_alpha",at:"wormhole_alpha",offset:[0,ni,0]},...e.flatMap(a=>a.points),{id:"founders",xyz:[-39500,0,-31200],marker:"dot",label:"Founders' homeworld",style:"tiny",max_distance:2e4},{id:"unicomplex",xyz:[26e3,0,-26e3],marker:"diamond",label:"Unicomplex",style:"minor",max_distance:6e4},...si.map(([a,s,n,r])=>({id:a,xyz:[n,0,r],marker:"dot",label:s,style:a==="ocampa"?"minor":"tiny",color:"var(--lcars-orange)",...a==="ocampa"?{tap_action:{action:"fly-to",view:"delta"}}:{}}))],objects:[{type:"galaxy",id:"milky_way",glow:.5},{type:"beam",id:"alpha_beta_line",from:[0,0,-52e3],to:[0,0,52e3],width:1.5,color:"theme:colors.ui.secondary",min_distance:2e3},{type:"beam",id:"gamma_delta_line",from:[-52e3,0,0],to:[52e3,0,0],width:1.5,color:"theme:colors.ui.secondary",min_distance:2e3},{type:"grid",id:"great_barrier",shape:"sphere",radius:7500,line_spacing_deg:20,color:"var(--lcars-yellow)",opacity:.4,scan:{period:6}},{type:"glow",at:"core",size:7e3,color:"var(--lcars-yellow)",opacity:.5},...ai.map(([a,,s,n,,r])=>({type:"volume",id:`${a}_space`,shape:"prism",outline:n,height:[-1200,1200],color:s,faces:{opacity:.25},cells:{width:2e3,depth:2e3,height:1200},...r?{min_distance:6e3}:{}})),{type:"grid",id:"sectors",shape:"plane",at:"sol",size:[400,400],line_spacing:20,major:{row_interval:5},opacity:.5,max_distance:3e3},{type:"volume",id:"romulan_neutral_zone",shape:"prism",at:"sol",outline:[[70,-40],[78,-40],[80,60],[72,60]],height:[-4,4],color:"var(--lcars-green)",faces:{opacity:.35},max_distance:3e3},{type:"volume",id:"cardassian_dmz",shape:"prism",at:"sol",outline:[[-38,12],[-42,8],[-48,34],[-44,38]],height:[-4,4],color:"var(--lcars-orange)",faces:{opacity:.35},max_distance:3e3},{type:"path",id:"wormhole_link",points:["wormhole_alpha_throat","wormhole_gamma_throat"],arc:Qi,...Et},...e.flatMap(a=>a.objects),{type:"path",id:"voyager_route",points:[...si.map(([a])=>a),"sol"],dash:{pattern:[10,6],speed:40},color:"var(--lcars-orange)",width:2}]})},"build")},Ye="var(--lcars-blue)",Oe="var(--lcards-moonlight)",oi=[.1,.7,.98,1,.85,.45,.1],li=[.1,.85,1,.95,.6,.1],ci=[.3,.85,1,.9,.55,.25],di=[[57,11],[62,14],[68,17]];function Rs(i,e){const t=[];for(let r=0;r<40;r++)t.push([0,-7-10*(r/39),0]);for(let r=1;r<30;r++){const l=Math.PI*r/29;t.push([3-3*Math.cos(l),-17-1.8*Math.sin(l),0])}for(let r=1;r<60;r++){const l=r/59;t.push([6+14*l,-17+8*l+2.2*Math.sin(l*3*Math.PI)*(1-l),0])}const a=t.length,s=.9,n=c(r=>Math.round(r*1e3)/1e3,"round");return t.map(([r,l,o],d)=>{const u=i+d/a*4*Math.PI;return[n(r*e),n((l+.5*s*Math.cos(u))*e),n((o+s*Math.sin(u))*e)]})}c(Rs,"pipelineStrand");function ea({prefix:i,at:e,size:t=70,power:a,extra:s={},stars:n=6e3,labels:r=true,inside:l=true}){const o=t/70,d=c(k=>`${i}_${k}`,"id"),u=c((k,O,$={})=>({id:d(k),at:e,offset:O.map(T=>Math.round(T*o*1e3)/1e3),...$}),"pt"),y=c((k,O,$)=>u(k,O,{label:$,style:"minor",look:"diagram",tap_action:{action:"fly-to"}}),"label"),{bind:h,fixed:m,follow:f}=Zi(a),g=[{type:"wobble",lobes:0,waves:2,period:4,amplitude:h?f(0,.05):Math.round(30*(m===null?1:m/100))/1e3}],w=c((k,O,$,T,v,x)=>({type:"grid",id:d(k),shape:"well",well:{profile:$},at:O,face:d("east"),radius:T*o,depth:v*o,pattern:"polar",spoke_count:16,line_spacing:2.4*o,color:Ye,opacity:x,look:"diagram",deform:g,...s}),"lobe"),A=Xi({prefix:i,at:e,aim:d("down"),radius:9*o,depth:7*o,power:a,extra:s,stars:n,glow:2}),j={type:"grid",id:d("entrance"),shape:"disc",at:e,radius:9*o,pattern:"polar",line_spacing_deg:20,color:Ye,opacity:.8,look:"diagram",...s};return l?{points:[...A.points,u("down",[0,-1e3,0]),u("east",[1e3,-9,0]),u("west",[-1e3,-9,0]),u("negative",[20,-9,0]),u("negative_cone",[21,-9,0]),u("ring_singularity",[33,-9,0]),u("positive",[33.5,-9,0]),u("point_singularity",[52,-9,0]),u("membrane",[52,-9,0]),u("membrane_centre",[58,-9,0]),u("middle",[34,-9,0]),...di.map(([k],O)=>u(`far_mouth_${O+1}`,[k,-9,0])),...r?[y("label_pipeline",[-4,-15,0],"PIPELINE"),y("label_negative",[26,-18,0],"NEGATIVE CTL REGION"),y("label_ring",[33,1,0],"RING SINGULARITY"),y("label_positive",[40,-19,0],"POSITIVE CTL REGION"),y("label_point",[50,-17,0],"POINT SINGULARITY"),y("label_membrane",[60,2,0],"VERTERON MEMBRANE")]:[]],objects:[...A.objects.map(k=>k.id===d("throat_tube")?{...k,look:"diagram"}:k),j,...[0,2.1,4.2].map((k,O)=>({type:"path",id:d(`strand_${O+1}`),at:e,points:Rs(k,o),...Et,width:4,glow:2,look:"diagram",...s})),w("negative_outer",d("negative"),oi,7,13,1),w("negative_inner",d("negative"),oi,4.8,13,.6),{type:"grid",id:d("negative_cone_grid"),shape:"well",well:{shape:"cone",throat:.05},at:d("negative_cone"),face:d("east"),radius:2.5*o,depth:11*o,line_spacing_deg:30,color:Oe,opacity:.8,look:"diagram",...s},{type:"ring",id:d("ring_singularity_ring"),at:d("ring_singularity"),face:d("east"),radius:1.6*o,width:3,glow:2,color:Oe,look:"diagram",...s},w("positive_outer",d("positive"),li,7.5,18.5,1),w("positive_inner",d("positive"),li,5,18.5,.6),{type:"grid",id:d("point_singularity_cone"),shape:"well",well:{shape:"cone",throat:.04},at:d("point_singularity"),face:d("west"),radius:3*o,depth:9*o,line_spacing_deg:24,color:Oe,look:"diagram",...s},{type:"glow",id:d("point_glow"),at:d("point_singularity"),size:5*o,color:Oe,look:"diagram",...s},w("membrane_outer",d("membrane"),ci,8,13,1),w("membrane_inner",d("membrane"),ci,5.5,13,.6),...di.map(([,k],O)=>({type:"ring",id:d(`far_mouth_ring_${O+1}`),at:d(`far_mouth_${O+1}`),face:d("east"),radius:k*o,width:2,color:Ye,opacity:.8,look:"diagram",...s}))]}:{points:[...A.points,u("down",[0,-1e3,0])],objects:[...A.objects.filter(k=>k.id!==d("throat_tube")),j]}}c(ea,"bajoranWormhole$1");const Ds={id:"bajoran_wormhole",kind:"scene",title:"Bajoran wormhole",summary:"The wormhole's mouth and the regions inside it",description:"The Bajoran wormhole as the station displays draw it: the mouth (a whirlpool of 3D gas wound into spiral arms round a warm heart and a funnel in the realistic look, an entrance disc and funnel in the diagram) and, diagram only, its inside: the pipeline, the negative CTL region, the ring singularity, the positive CTL region, the point singularity and the verteron membrane. Switch the card's look to see one or the other, or leave the inside out for the mouth alone. Tap a name to fly to it. Its power (0 to 100, or an entity to follow) opens the mouth and wobbles the regions.",icon:"mdi:vector-ellipse",params:[{key:"inside",label:"Inside",type:"text",default:"diagram",options:[{value:"diagram",label:"The mouth and the diagram of its inside"},{value:"none",label:"The mouth only"}]},{key:"power",label:"Power",type:"setting",default:100,helper:"How open, 0 (closed) to 100, or an entity to follow (the link button). A light or switch opens it when on; its brightness_pct opens it by steps; By state gives each state its power (playing 100, paused 40)."}],build:c(({power:i,inside:e})=>{const t=e!=="none",a=ea({prefix:"wormhole",at:"mouth",power:i,stars:8e3,inside:t});return t?{views:{overview:{target:"wormhole_middle",yaw:40,tilt:14,distance:92},mouth:{target:"mouth",yaw:20,tilt:40,distance:34},inside:{target:"wormhole_ring_singularity",yaw:60,tilt:10,distance:30},membrane:{target:"wormhole_membrane_centre",yaw:50,tilt:15,distance:52}},camera:{view:"overview"},backdrop:{stars:{count:2500}},points:[{id:"mouth",xyz:[0,0,0]},{id:"name",at:"mouth",offset:[0,14,0],label:"BAJORAN WORMHOLE",style:"major",tap_action:{action:"fly-to",view:"mouth"}},...a.points],objects:a.objects}:{views:{mouth:{target:"mouth",yaw:20,tilt:40,distance:34},side:{target:"mouth",yaw:30,tilt:12,distance:40}},camera:{view:"mouth"},backdrop:{stars:{count:2500}},points:[{id:"mouth",xyz:[0,0,0]},{id:"name",at:"mouth",offset:[0,14,0],label:"BAJORAN WORMHOLE",style:"major",tap_action:{action:"fly-to",view:"mouth"}},...a.points],objects:a.objects}},"build")},qe=[["dock1","DRYDOCK 1",[-70,30,20],true],["dock2","DRYDOCK 2",[0,38,0],false],["dock3","DRYDOCK 3",[70,30,-20],false]],Bs={id:"utopia_planitia",kind:"scene",title:"Utopia Planitia yards",summary:"Three drydocks in orbit over Mars, a starship in the first",description:"Three drydocks of the Utopia Planitia Fleet Yards in orbit over Mars (its USGS Viking map), a Galaxy-class starship in the first. Tap a drydock to fly to it.",icon:"mdi:factory",params:[],build:c(()=>({views:{yards:{target:[0,20,0],yaw:20,tilt:22,distance:260},...Object.fromEntries(qe.map(([i])=>[i,{target:i,yaw:35,tilt:20,distance:80}]))},camera:{view:"yards"},backdrop:{stars:{count:2e3}},points:[{id:"mars",xyz:[0,-200,0]},{id:"mars_name",at:"mars",offset:[0,40,200],label:"MARS",style:"major"},...qe.flatMap(([i,e,t])=>[{id:i,xyz:[...t]},{id:`${i}_name`,at:i,offset:[0,14,0],marker:"reticle",label:e,style:"minor",tap_action:{action:"fly-to",view:i}}])],objects:[{type:"sphere",id:"mars_body",at:"mars",radius:190,image:"builtin:mars_viking",line_spacing_deg:30,line_width:.5,opacity:.3,spin:2},...qe.flatMap(([i,,,e])=>[{type:"model",id:`${i}_frame`,src:"builtin:utopia_planitia_drydock",at:i,size:40,material:"original"},...e?[{type:"model",id:`${i}_ship`,src:"builtin:galaxy_class",at:i,size:33.8,scan:{period:6}}]:[]])]}),"build")},Us={id:"borg_encounter",kind:"scene",title:"Borg encounter",summary:"A Borg cube bearing down on a starship, tractor beam locked on",description:"A Borg cube with its green halo bearing down on the built-in Galaxy-class starship, its tractor beam locked on. Tap a name to fly to it.",icon:"mdi:cube",params:[],build:c(()=>({views:{encounter:{target:[0,0,20],yaw:120,tilt:15,distance:170},cube:{target:"cube",yaw:30,tilt:20,distance:90},ship:{target:"ship",yaw:150,tilt:20,distance:45}},camera:{view:"encounter"},backdrop:{stars:{count:2500}},points:[{id:"cube",xyz:[0,0,-20]},{id:"cube_name",at:"cube",offset:[0,32,0],label:"BORG CUBE",style:"major",tap_action:{action:"fly-to",view:"cube"}},{id:"ship",xyz:[0,4,70]},{id:"ship_name",at:"ship",offset:[0,10,0],label:"USS ENTERPRISE",style:"minor",tap_action:{action:"fly-to",view:"ship"}},{id:"emitter",xyz:[0,2,0]}],objects:[{type:"glow",at:"cube",size:110,color:"var(--lcards-green-medium)",opacity:.45},{type:"cube",id:"borg",at:"cube",size:40,spin:3,rotation:[8,25,0]},{type:"model",id:"hull",src:"builtin:galaxy_class",at:"ship",size:22,rotation:[0,160,0],scan:{period:5}},{type:"beam",from:"emitter",to:"ship",width:10,color:"var(--lcards-green-medium)",pulse:true}]}),"build")},ae=1495978707e-1,Je=[["mercury","MERCURY","tiny"],["venus","VENUS","tiny"],["earth","EARTH","minor"],["mars","MARS","minor"],["ceres","CERES","tiny"],["jupiter","JUPITER","minor"],["saturn","SATURN","minor"],["uranus","URANUS","tiny"],["neptune","NEPTUNE","tiny"],["pluto","PLUTO","tiny"]],Qe=[["moon","LUNA","earth",384400],["phobos","PHOBOS","mars",9375],["deimos","DEIMOS","mars",23457],["io","IO","jupiter",421800],["europa","EUROPA","jupiter",671100],["ganymede","GANYMEDE","jupiter",1070400],["callisto","CALLISTO","jupiter",1882700],["titan","TITAN","saturn",1221900],["triton","TRITON","neptune",354800],["charon","CHARON","pluto",19600]],hi={sun:695700,mercury:2439.7,venus:6051.8,earth:6371,moon:1737.4,mars:3389.5,phobos:11.08,deimos:6.27,ceres:469.7,jupiter:69911,io:1821.6,europa:1560.8,ganymede:2634.1,callisto:2410.3,saturn:58232,titan:2574.7,uranus:25362,neptune:24622,triton:1353.4,pluto:1188.3,charon:606},ui={sun:{image:"builtin:sun_sdo"},mercury:{image:"builtin:mercury_messenger"},venus:{fill:{effect:{preset:"clouds"}}},earth:{image:"builtin:earth_blue_marble"},moon:{image:"builtin:moon_lroc"},mars:{image:"builtin:mars_viking"},phobos:{image:"builtin:phobos_viking"},deimos:{fill:{color:"var(--lcards-gray-medium)",opacity:1}},ceres:{image:"builtin:ceres_dawn"},jupiter:{image:"builtin:jupiter_cassini"},io:{image:"builtin:io_galileo"},europa:{image:"builtin:europa_galileo"},ganymede:{image:"builtin:ganymede_galileo"},callisto:{image:"builtin:callisto_galileo"},saturn:{fill:{effect:{preset:"ringed_giant"}}},titan:{image:"builtin:titan_cassini"},uranus:{fill:{effect:{preset:"ice_giant"}}},neptune:{fill:{effect:{preset:"storm_giant"}}},triton:{image:"builtin:triton_voyager"},pluto:{image:"builtin:pluto_new_horizons"},charon:{image:"builtin:charon_new_horizons"}},Pt={system:{target:"sun",yaw:40,tilt:35,distance:16e9},inner:{target:"sun",yaw:40,tilt:35,distance:9e8},earth:{target:"earth",yaw:225,tilt:12,distance:7e4},mars:{target:"mars",yaw:200,tilt:15,distance:6e4},jupiter:{target:"jupiter",yaw:200,tilt:10,distance:45e5},saturn:{target:"saturn",yaw:160,tilt:20,distance:35e5},neptune:{target:"neptune",yaw:160,tilt:20,distance:1e6},pluto:{target:"pluto",yaw:120,tilt:20,distance:8e4}},Fs={target:"ds9",yaw:330,tilt:6,distance:4},ta={date:"now",rate:"1 h/s"};function ia({station:i=false}={}){const e=Pt;return{points:[{id:"sun",xyz:[0,0,0],label:"SOL",style:"major"},...Je.map(([t,a,s])=>({id:t,body:t,marker:"dot",label:a,style:s,...e[t]?{tap_action:{action:"fly-to",view:t}}:{}})),...Qe.map(([t,a,,s])=>({id:t,body:t,label:a,style:"tiny",max_distance:s*50})),...i?[{id:"ds9",at:"earth",offset:[-21082,0,36515],label:"DEEP SPACE 9",style:"tiny",max_distance:3e6,tap_action:{action:"fly-to",view:"station"}}]:[]],objects:[{type:"glow",at:"sun",size:9e6,color:"var(--lcars-yellow)"},{type:"sphere",id:"sun_body",at:"sun",radius:hi.sun,body:"sun",...ui.sun,line_spacing_deg:30,line_width:.5},...Je.map(([t])=>({type:"ring",id:`${t}_orbit`,orbit:t,width:1,opacity:t==="earth"?.7:.5,tags:["orbits"],...t==="earth"?{color:"var(--lcars-blue)"}:{}})),...Qe.map(([t,,a,s])=>({type:"ring",id:`${t}_orbit`,at:a,orbit:t,width:1,opacity:.4,tags:["orbits"],max_distance:s*50})),...[...Je.map(([t])=>t),...Qe.map(([t])=>t)].map(t=>({type:"sphere",id:`${t}_body`,at:t,radius:hi[t],body:t,...ui[t],line_spacing_deg:30,line_width:.5})),{type:"ring",id:"saturn_rings",at:"saturn",radius:140180,body:"saturn",band:{image:"builtin:saturn_rings",inner_radius:66900}},{type:"belt",id:"main_belt",at:"sun",radius:[2.1*ae,3.3*ae],thickness:.15*ae,count:1500,size:[5,300],tumble:0,seed:4},{type:"belt",id:"kuiper_belt",at:"sun",radius:[30*ae,50*ae],thickness:3*ae,count:2e3,size:[50,1200],tumble:0,seed:9,color:"var(--lcars-blue)"},...i?[{type:"model",id:"station",at:"ds9",src:"builtin:deep_space_nine",material:"original"}]:[]]}}c(ia,"solSystem");const Vs={id:"true_scale_solar_system",kind:"scene",title:"Solar system (real positions)",summary:"The Solar System at real scale, where the planets are today",description:"The Sun, the planets, Pluto, Ceres and the major moons in km, where they really are today and moving a day a second: real orbits, sizes, tilts and spins, Saturn's rings, the asteroid and Kuiper belts. Tap a planet to fly to it; the time slider runs the date faster, slower or back.",icon:"mdi:orbit",params:[],build:c(()=>({units:"km",clock:{...ta},views:Pt,camera:{view:"system",fly_duration:4e3,buttons:true},backdrop:{stars:{count:2e3}},...ia()}),"build")},Hs={id:"true_scale_dive",kind:"scene",title:"Galaxy to station at true scale",summary:"Dive from the galaxy to Earth and Deep Space 9 at real scale",description:"A galaxy in light years with the Sol system in km inside it, 26,000 light years from the core: tap SOL and dive from the galaxy to the planets, Earth and Deep Space 9, all at their real sizes and distances, with the planets where they are today.",icon:"mdi:magnify-plus-outline",params:[],build:c(()=>({units:"ly",clock:{...ta},views:{galaxy:{target:"core",yaw:20,tilt:35,distance:14e4},...Pt,station:Fs},camera:{view:"galaxy",fly_duration:5e3},backdrop:{stars:{count:2e3}},points:[{id:"core",xyz:[0,0,0],label:"GALACTIC CORE",style:"title"},{id:"sol",polar:[26e3,200],alt:60,marker:"dot",label:"SOL",style:"major",tap_action:{action:"fly-to",view:"inner"}}],objects:[{type:"grid",shape:"disc",radius:5e4,pattern:"polar",line_spacing:5e3,spoke_count:36,min_distance:20},{type:"glow",at:"core",size:3e4},{type:"system",id:"sol_system",at:"sol",units:"km",...ia({station:true})}]}),"build")},je=20,Ks={id:"earth_orbit",kind:"scene",title:"Earth orbit: real satellites",summary:"The ISS, Hubble, GPS, Galileo and the weather satellites where they are now",description:"The Earth turning as it really does, with the ISS, Tiangong and Hubble, the GPS and Galileo constellations and the geostationary weather satellites where they are now, from orbits shipped with LCARdS. Diagram heights lift the low orbits clear of the surface; real heights show them to scale.",icon:"mdi:satellite-variant",params:[{key:"heights",label:"Heights",type:"text",default:"diagram",options:[{value:"diagram",label:"Diagram (low orbits lifted, high ones brought in)"},{value:"real",label:"Real (to scale)"}]}],build:c(i=>{const e=i.heights==="real"?"real":"diagram",t=e==="real"?6.6:3.7,a=c((s,n)=>({id:s,satellite:s,object:"earth",heights:e,marker:"dot",label:n,style:"tiny",color:"var(--lcars-orange)"}),"low");return{clock:{date:"now",rate:"live"},views:{orbits:{target:[0,0,0],yaw:30,tilt:30,distance:Math.round(je*t*2.6)},earth:{target:[0,0,0],yaw:30,tilt:15,distance:Math.round(je*(e==="real"?3.2:4.2))},pole:{target:[0,0,0],tilt:90,distance:Math.round(je*t*2.8)}},camera:{view:"orbits"},backdrop:{stars:{count:1500}},points:[a("iss","ISS"),a("tiangong","TIANGONG"),a("hubble","HUBBLE")],objects:[{type:"sphere",id:"earth",radius:je,body:"earth",image:"builtin:earth_blue_marble"},{type:"ring",id:"iss_orbit",satellite:"iss",width:1.5,color:"var(--lcars-orange)"},{type:"ring",id:"tiangong_orbit",satellite:"tiangong",width:1,opacity:.6,color:"var(--lcars-orange)"},{type:"ring",id:"hubble_orbit",satellite:"hubble",width:1,opacity:.6,color:"var(--lcars-orange)"},{type:"satellites",id:"gps",group:"gps",object:"earth",heights:e,color:"var(--lcars-yellow)",orbits:{width:.75,opacity:.35}},{type:"satellites",id:"galileo",group:"galileo",object:"earth",heights:e,color:"var(--lcars-violet)",orbits:{width:.75,opacity:.35}},{type:"satellites",id:"weather",group:"geostationary",object:"earth",heights:e,color:"var(--lcars-blue)",label:true,orbits:{width:1,opacity:.5}}]}},"build")},z=100,pi=Array.from({length:10},(i,e)=>[e*3,Math.round(100*.9*(1-e/10)**1.6)/100]),Gs={id:"radar_scope",kind:"scene",title:"Radar scope",summary:"A sensor scope with range rings, a turning sweep and contacts",description:"A round sensor scope: range rings with their distances, cross hairs, a sweep turning round with a fading afterglow, and contacts placed by distance and bearing. Give a contact polar: { entity } to place it from an entity's distance and bearing attributes, and tilt the camera to see the scope in perspective.",icon:"mdi:radar",params:[{key:"speed",label:"Sweep speed (degrees a second)",type:"number",default:60}],build:c(({speed:i})=>{const e=Number.isFinite(Number(i))?Number(i):60,t=c((a,s,n,r,l)=>({id:a,polar:[n,r],marker:"dot",label:s,style:"tiny",color:l}),"contact");return{views:{scope:{target:[0,0,0],tilt:90,distance:330},tilted:{target:[0,0,0],yaw:0,tilt:35,distance:300}},camera:{view:"scope"},points:[{id:"centre",xyz:[0,0,0]},...pi.map(([a],s)=>({id:`sweep_${s+1}`,polar:[z,-a],object:"sweep_ring"})),...[1,2,3,4].map(a=>({id:`range_${a}`,polar:[a*z/4,135],label:String(a*z/4),style:"tiny",overlap:true})),{id:"north",polar:[z+12,0],label:"000",style:"minor",overlap:true},{id:"east",polar:[z+12,90],label:"090",style:"minor",overlap:true},{id:"south",polar:[z+12,180],label:"180",style:"minor",overlap:true},{id:"west",polar:[z+12,270],label:"270",style:"minor",overlap:true},t("contact_1","CONTACT 1",62,40,"var(--lcars-orange)"),t("contact_2","CONTACT 2",35,215,"var(--lcars-orange)"),t("contact_3","UNKNOWN",85,300,"var(--lcars-red)")],objects:[{type:"grid",id:"scope",shape:"disc",radius:z,pattern:"polar",line_spacing:z/4,spoke_count:12,opacity:.6},{type:"ring",id:"rim",radius:z,width:3,color:"theme:colors.ui.primary"},{type:"beam",id:"cross_ns",from:[0,0,-z],to:[0,0,z],width:1,color:"theme:colors.ui.secondary"},{type:"beam",id:"cross_ew",from:[-z,0,0],to:[z,0,0],width:1,color:"theme:colors.ui.secondary"},{type:"ring",id:"sweep_ring",radius:z,spin:-e,opacity:0},...pi.map(([,a],s)=>({type:"beam",id:`sweep_line_${s+1}`,from:"centre",to:`sweep_${s+1}`,width:s===0?3:2,opacity:a,color:"var(--lcars-green)"})),{type:"glow",at:"contact_1",size:10,color:"var(--lcars-orange)"},{type:"glow",at:"contact_2",size:10,color:"var(--lcars-orange)"},{type:"glow",at:"contact_3",size:10,color:"var(--lcars-red)"}]}},"build")},mi=[["ferenginar","Ferenginar",-105.9,28.1,"var(--lcars-yellow)"],["breen","Breen",-150,95,"var(--lcars-lilac)"],["tzenkethi","Tzenkethi",-175,20,"var(--lcars-magenta)"],["tholia","Tholia",40,140,"var(--lcars-orange)"],["gorn","Gorn Hegemony",150,-40,"var(--lcars-green)"]],Ws={id:"st_minor_powers",kind:"part",title:"Star Trek: minor powers",summary:"The Ferengi, Breen, Tzenkethi, Tholian and Gorn homeworlds",description:"For the Star Trek galaxy: the Ferengi, Breen, Tzenkethi, Tholian and Gorn homeworlds round Federation space, each with a small territory, at the close-up's scale (Ferenginar at its recorded 55 ly from Cardassia and 60 from Bajor).",icon:"mdi:account-group-outline",scene:"star_trek_galaxy",picture:{camera:{target:[-60,0,26060],yaw:20,tilt:45,distance:420}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:""}],build:c(()=>Be({units:"ly",points:mi.map(([i,e,t,a,s])=>({id:i,xyz:fe(t,a),marker:"diamond",label:e,style:"minor",color:s,max_distance:3e3})),objects:mi.map(([i,,,,e])=>({type:"volume",id:`${i}_space`,shape:"prism",at:i,height:[-6,6],color:e,faces:{opacity:.25},max_distance:3e3,outline:[[-18,-10],[-4,-20],[16,-12],[20,8],[4,20],[-16,14]]}))}),"build")},fi=[["kazon","KAZON SECTS","var(--lcars-orange)",[[33e3,-38e3],[41e3,-36e3],[42e3,-29e3],[35e3,-27e3],[31e3,-31e3]],[37e3,-33e3]],["vidiian","VIDIIAN SODALITY","var(--lcars-red)",[[3e4,-29e3],[35e3,-26e3],[33e3,-2e4],[27e3,-21e3]],[31e3,-24e3]],["hirogen","HIROGEN HUNTING GROUNDS","var(--lcars-violet)",[[16e3,-8e3],[26e3,-6e3],[27e3,2e3],[17e3,3e3],[12e3,-2e3]],[2e4,-3e3]]],Ys={id:"st_delta_powers",kind:"part",title:"Star Trek: Delta Quadrant powers",summary:"Kazon, Vidiian and Hirogen space along Voyager's route",description:"For the Star Trek galaxy: Kazon, Vidiian and Hirogen space along Voyager's route home, in the order Voyager met them.",icon:"mdi:map-marker-path",scene:"star_trek_galaxy",picture:{camera:{target:[3e4,0,-22e3],yaw:20,tilt:50,distance:42e3}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:""}],build:c(()=>Be({units:"ly",points:fi.map(([i,e,t,,[a,s]])=>({id:`${i}_name`,xyz:[a,1500,s],label:e,style:"minor",color:t})),objects:fi.map(([i,,e,t])=>({type:"volume",id:`${i}_space`,shape:"prism",outline:t,height:[-1e3,1e3],color:e,faces:{opacity:.25},cells:{width:2e3,depth:2e3,height:1e3}}))}),"build")},yi=[["tw_unicomplex","Unicomplex",26e3,-26e3],["tw_exit_1","Conduit exit",36e3,-14e3],["tw_exit_2","Conduit exit",18e3,-38e3],["tw_exit_3","Conduit exit",8e3,-12e3]],qs={id:"st_transwarp",kind:"part",title:"Star Trek: Borg transwarp network",summary:"A Borg transwarp hub with conduits across the galaxy",description:"For the Star Trek galaxy: a Borg transwarp hub in the Delta Quadrant with flowing conduits across Borg space and one to the aperture near Earth.",icon:"mdi:hub-outline",scene:"star_trek_galaxy",picture:{camera:{target:[14e3,0,-2e3],yaw:20,tilt:55,distance:75e3}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:""}],build:c(()=>Be({units:"ly",points:[{id:"tw_hub",xyz:[22e3,0,-18e3],marker:"diamond",label:"TRANSWARP HUB",style:"minor",color:"var(--lcars-green)"},...yi.map(([i,e,t,a])=>({id:i,xyz:[t,0,a],marker:"dot",label:e,style:"tiny",color:"var(--lcars-green)",max_distance:6e4})),{id:"tw_earth",xyz:fe(.6,-.5,.2),label:"Transwarp aperture",style:"tiny",color:"var(--lcars-green)",max_distance:30}],objects:[...yi.map(([i])=>i),"tw_earth"].map(i=>({type:"path",id:`conduit_${i}`,points:["tw_hub",i],arc:i==="tw_earth"?6e3:1500,dash:{pattern:[4,6],speed:60},color:"var(--lcars-green)",width:1.5,glow:true}))}),"build")},bi=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$7"),G=c(i=>Number.isFinite(Number(i))?Math.abs(Number(i)):0,"num$1"),Ze=c(i=>Math.hypot(...i.slice(0,3).map(G)),"len");function gi(i){const e=Array.isArray(i.size)?Math.max(0,...i.size.map(G)):G(i.size),t=Array.isArray(i.radius)?Math.max(0,...i.radius.map(G)):G(i.radius);return Math.max(t,e/2,G(i.length)/2)}c(gi,"objectReach");function _i(i){const e=Array.isArray(i==null?void 0:i.points)?i.points.filter(bi):[],t=Array.isArray(i==null?void 0:i.objects)?i.objects.filter(bi):[],a=new Map(e.filter(h=>h.id!==void 0).map(h=>[String(h.id),h])),s=new Map(t.filter(h=>h.id!==void 0).map(h=>[String(h.id),h])),n=new Map,r=new Set,l=c(h=>{if(n.has(h))return n.get(h);if(r.has(h))return 0;r.add(h);let m=0;const f=typeof h.object=="string"?s.get(h.object):void 0,b=f?o(f):0;return Array.isArray(h.xyz)?m=b+Ze(h.xyz):Array.isArray(h.polar)?m=b+G(h.polar[0]):f&&(m=b+gi(f)),m+=G(h.alt)+(Array.isArray(h.offset)?Ze(h.offset):0),r.delete(h),n.set(h,m),m},"pointDist"),o=c(h=>{if(n.has(h))return n.get(h);if(r.has(h))return 0;r.add(h);let m=0;return Array.isArray(h.at)?m=Ze(h.at):typeof h.at=="string"&&a.has(h.at)&&(m=l(a.get(h.at))),r.delete(h),n.set(h,m),m},"placeDist"),d=new Set([...t,...e].map(h=>h.at).filter(h=>typeof h=="string")),u=c(h=>h.id===void 0||h.label!==void 0||h.marker!==void 0||d.has(String(h.id)),"shown");let y=0;for(const h of e)u(h)&&(y=Math.max(y,l(h)));for(const h of t)y=Math.max(y,o(h)+(h.type==="system"?0:gi(h)));return y}c(_i,"sceneExtent");function R(i){return typeof i=="string"&&i?{ref:i,points:[]}:{ref:"centre",points:[{id:"centre",xyz:Array.isArray(i)&&i.length===3?i.map(Number):[0,0,0]}]}}c(R,"centreRef");function N(i){return Number.isFinite(i)&&i!==0?Number(i.toPrecision(3)):i}c(N,"sigFigs");function Js(i){const e=String(i??"").trim();return e?/^(builtin:|\/|https?:)/.test(e)?{image:e}:{fill:{effect:{preset:e}}}:{}}c(Js,"surface");const Qs=[36,22,14,9],Zs={scene:[2,3.2,4.4,5.6],real:[30,60,95,150]},Xs=1495978707e-1,en={id:"planet",kind:"part",title:"Planet with moons",summary:"A planet on its orbit ring with up to four moons",description:"A planet orbiting a centre point on its own ring, with up to four moons going round it. Tap the planet to fly to it.",icon:"mdi:earth",picture:{camera:{target:"planet_body",yaw:30,tilt:25,distance:34}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"planet"},{key:"label",label:"Label",type:"text",default:"PLANET"},{key:"centre",label:"Orbits round",type:"point",default:[0,0,0],helper:"A point id (a star) or x, y, z."},{key:"orbit",label:"Orbit radius",type:"number",default:40,real:Xs,fit:true},{key:"radius",label:"Planet radius",type:"number",default:3,real:6371,fit:true},{key:"moons",label:"Moons (0 to 4)",type:"number",default:2},{key:"look",label:"Surface",type:"text",default:"rocky",helper:"A planet type (gas_giant, ringed_giant, ice_giant, storm_giant, clouds, lava, ice, rocky, terran), a map (builtin:mars_viking) or your own picture (/local/planet.jpg).",options:pa.map(i=>({value:i,label:i.replace(/_/g," ")})),custom:true}],build:c(({label:i,centre:e,orbit:t,radius:a,moons:s,look:n},{units:r})=>{var m;const l=R(e),o=Number(a)||3,d=Math.max(0,Math.min(4,Math.round(Number(s)||0))),u=Zs[r?"real":"scene"],y=Array.from({length:d},(f,b)=>({id:`moon${b+1}`,orbit:Xe(o*u[b]),spin:Qs[b],bearing:b*110})),h=Xe(Math.max(o*40,(((m=y[y.length-1])==null?void 0:m.orbit)??0)*4));return{points:[...l.points,{id:"body",polar:[Number(t)||40,0],object:"orbit",marker:"dot",label:String(i),style:"minor",tap_action:{action:"fly-to"}},...y.map(f=>({id:f.id,polar:[f.orbit,f.bearing],object:`${f.id}_orbit`,marker:"dot",label:f.id.toUpperCase(),style:"tiny",max_distance:h}))],objects:[{type:"ring",id:"orbit",at:l.ref,radius:Number(t)||40,spin:5,width:1,color:"theme:colors.ui.secondary",opacity:.6},{type:"sphere",id:"globe",at:"body",radius:o,...Js(n),line_spacing_deg:30,spin:15},...y.flatMap(f=>[{type:"ring",id:`${f.id}_orbit`,at:"body",radius:f.orbit,spin:f.spin,width:1,dash:[3,3],opacity:.5,max_distance:h},{type:"sphere",id:`${f.id}_globe`,at:f.id,radius:r?Xe(o*.27):Math.max(.3,o*.25),line_spacing_deg:45,max_distance:h}])]}},"build")},Xe=c(i=>Number(i.toPrecision(3)),"sig$1"),wi=1495978707e-1,tn={id:"asteroid_belt",kind:"part",fitShare:.45,title:"Asteroid belt",summary:"A band of rocks going round a centre, lit by its star",description:"A band of rocks going round a centre, the inner ones faster, lit from the centre as by its star, with a label on its edge.",icon:"mdi:dots-circle",params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"belt"},{key:"label",label:"Label",type:"text",default:"ASTEROID BELT"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id (a star) or x, y, z."},{key:"radius",label:"Radius",type:"number",default:65,real:2.7*wi,fit:true},{key:"width",label:"Width",type:"number",default:8,real:wi,fit:true}],build:c(({label:i,centre:e,radius:t,width:a},{units:s})=>{const n=R(e),r=Number(t)||65,l=Number(a)||8,o=Y(s),d=c(y=>o?Number(y.toPrecision(3)):Math.round(y*10)/10,"round"),u=o?[d(5/o),d(300/o)]:[.2,d(Math.max(.6,l/6))];return{points:[...n.points,{id:"label",at:n.ref,offset:[0,0,-(r+l)],label:String(i),style:"tiny"}],objects:[{type:"belt",id:"rocks",at:n.ref,radius:[d(r-l/2),d(r+l/2)],count:900,size:u,period:60,colors:["var(--lcards-gray-light)","var(--lcards-gray-medium)","var(--lcards-yellow-dark)"]}]}},"build")},an={id:"asteroid",kind:"part",title:"Asteroid",summary:"One tumbling rock, lit from its star",description:"One asteroid with lumps and craters, tumbling, lit from its star, with a label above it. Tap it to fly to it.",icon:"mdi:meteor",picture:{camera:{target:[30,0,0],yaw:270,tilt:15,distance:26}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"asteroid"},{key:"label",label:"Label",type:"text",default:"ASTEROID"},{key:"at",label:"Where",type:"point",default:[30,0,0],helper:"A point id or x, y, z."},{key:"light",label:"Lit from",type:"point",default:[0,0,0],helper:"A point id (its star) or x, y, z."},{key:"size",label:"Size",type:"number",default:8,real:30},{key:"seed",label:"Shape (any whole number)",type:"number",default:4}],build:c(({label:i,at:e,light:t,size:a,seed:s})=>{const n=R(e),r=Number(a)||8,l=typeof t=="string"&&t?{light:t}:{light:Array.isArray(t)&&t.length===3?t.map(Number):[0,0,0]};return{points:[...n.points,{id:"body",at:n.ref,label:String(i),style:"minor",offset:[0,r*.8,0],tap_action:{action:"fly-to"}}],objects:[{type:"asteroid",id:"rock",at:n.ref,size:r,seed:Math.round(Number(s)||1),...l}]}},"build")},vi=1495978707e-1,sn={id:"comet",kind:"part",title:"Comet",summary:"A comet swinging round its star, its tails away from it",description:"A comet on an orbit centred off its star, so it swings in close and out far. Its tails point away from the star and it grows and brightens near it (activity.mode: distance). Tap it to fly to it.",icon:"mdi:star-shooting",picture:{camera:{target:[0,0,0],yaw:0,tilt:55,distance:220}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"comet"},{key:"label",label:"Label",type:"text",default:"COMET"},{key:"centre",label:"Star",type:"point",default:[0,0,0],helper:"A point id (a star) or x, y, z."},{key:"near",label:"Closest to the star",type:"number",default:25,real:.6*vi,fit:true},{key:"far",label:"Farthest from the star",type:"number",default:175,real:35*vi,fit:true},{key:"period",label:"Seconds per orbit",type:"number",default:36}],build:c(({label:i,centre:e,near:t,far:a,period:s})=>{const n=R(e),r=Math.max(0,Number(t)||25),l=Number(a)||175,o=l>r?l:r*2||1,d=(r+o)/2,u=(o-r)/2,y=360/Math.max(1,Number(s)||36),h=typeof e=="string"&&e?"ring_centre":[...Array.isArray(e)?e.map(Number):[0,0,0]].map((m,f)=>f===0?m+u:m);return{points:[...n.points,...h==="ring_centre"?[{id:"ring_centre",at:n.ref,offset:[u,0,0]}]:[],{id:"body",polar:[d,270],object:"orbit",label:String(i),style:"tiny",tap_action:{action:"fly-to"}}],objects:[{type:"ring",id:"orbit",at:h,radius:d,spin:y,width:1,color:"theme:colors.ui.secondary",opacity:.4},{type:"comet",id:"comet",at:"body",light:n.ref,nucleus:{size:N(d/50)},tail:{length:N(d*.9)},coma:{size:N(d/12)},activity:{mode:"distance",range:[r,o]}}]}},"build")},nn=94607304725808e-1,rn={id:"nebula_field",kind:"part",title:"Nebula field",summary:"Drifting gas you can fly into, with a glow at its heart",description:"A slowly drifting body of gas (render: volume, so the camera can fly into it) with drawn-out clouds, a pale core and a dust lane, a veil of lighter puffs, a soft glow at the heart and a label.",icon:"mdi:weather-cloudy",params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"nebula"},{key:"label",label:"Label",type:"text",default:"NEBULA"},{key:"centre",label:"Centre",type:"point",default:[0,10,0],helper:"A point id or x, y, z."},{key:"radius",label:"Radius",type:"number",default:40,real:2*nn,fit:true}],build:c(({label:i,centre:e,radius:t})=>{const a=R(e),s=Number(t)||40;return{points:[...a.points,{id:"heart",at:a.ref,label:String(i),style:"major"}],objects:[{type:"nebula",id:"clouds",at:"heart",render:"volume",radius:s,count:8,seed:7,drift:.5,stretch:.4,dust:{count:1},core:{color:"var(--lcars-ice)"}},{type:"nebula",id:"veil",at:"heart",radius:s*.6,count:6,seed:23,drift:.8,colors:["var(--lcars-violet)","var(--lcars-blue)"]},{type:"glow",id:"glow",at:"heart",size:s*.5,opacity:.7}]}},"build")},on={id:"wormhole",kind:"part",title:"Wormhole",summary:"A wormhole mouth and the diagram of its inside",description:"The Bajoran wormhole as the station displays draw it. Its mouth is a whirlpool of 3D gas wound into spiral arms round a warm heart and a funnel in the realistic look, an entrance disc and funnel in the diagram. Past it, diagram only, the inside runs along +x (leave it out for the mouth alone): a pipeline of twisted strands, the negative CTL region, the ring singularity, the positive CTL region and the point singularity opening into the verteron membrane. Its power (0 to 100, or an entity to follow) opens the mouth and wobbles the regions.",icon:"mdi:vector-ellipse",picture:{camera:{target:[30,-9,0],yaw:28,tilt:14,distance:74}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"bajoran"},{key:"centre",label:"Mouth",type:"point",default:[0,0,0],helper:"A point id or x, y, z. The inside runs along +x from here."},{key:"size",label:"Length",type:"number",default:70,real:40,fit:true},{key:"inside",label:"Inside",type:"text",default:"diagram",options:[{value:"diagram",label:"The mouth and the diagram of its inside"},{value:"none",label:"The mouth only"}]},{key:"power",label:"Power",type:"setting",default:100,helper:"How open, 0 (closed) to 100, or an entity to follow (the link button). A light or switch opens it when on; its brightness_pct opens it by steps; By state gives each state its power (playing 100, paused 40)."}],build:c(({centre:i,size:e,power:t,inside:a})=>{const s=R(i),n=ea({prefix:"wormhole",at:s.ref,size:Math.max(1,Number(e)||70),power:t,inside:a!=="none"});return{points:[...s.points,...n.points],objects:n.objects}},"build")},$i=94607304725808e-1,ki=[{id:"a",label:"TERRITORY A",color:"var(--lcars-blue)",angle:[0,60]},{id:"b",label:"TERRITORY B",color:"var(--lcars-red)",angle:[70,130]},{id:"c",label:"TERRITORY C",color:"var(--lcars-green)",angle:[140,200]}],ln={id:"sector_volumes",kind:"part",title:"Sector volume set",summary:"Three territories as see-through volumes of cells",description:"Three territories side by side round a centre, each a see-through volume of cells in its own colour with its name above it. Tap one to fly to it.",icon:"mdi:cube-outline",params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"zone"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"inner",label:"Inner radius",type:"number",default:30,real:5*$i,fit:true},{key:"outer",label:"Outer radius",type:"number",default:80,real:20*$i,fit:true}],build:c(({centre:i,inner:e,outer:t})=>{const a=R(i),s=Number(e)||30,n=Number(t)||80,r=Math.abs(n-s)/50||1,l=c(o=>Number(o.toPrecision(3)),"sig");return{points:[...a.points,...ki.map(o=>({id:o.id,at:a.ref,offset:cn((s+n)/2,(o.angle[0]+o.angle[1])/2,l(16*r)),label:o.label,style:"major",color:o.color}))],objects:ki.map(o=>({type:"volume",id:`${o.id}_space`,at:a.ref,shape:"sector",radius:[s,n],angle:o.angle,height:[l(-4*r),l(10*r)],cells:{ring:10,angle:10,layer:7},color:o.color,tap_action:{action:"fly-to"}}))}},"build")};function cn(i,e,t){const a=e*Math.PI/180,s=c(n=>Math.round(n*10)/10,"r1");return[s(i*Math.sin(a)),t,s(-i*Math.cos(a))]}c(cn,"polarOffset");const xi={deep_space_nine:[["ops","OPS"],["promenade","PROMENADE"],["docking_ring","DOCKING RING"]],earth_spacedock:[["space_doors","SPACE DOORS"],["hull","HULL"]],utopia_planitia_drydock:[["bow","BOW"],["berth","BERTH"]]},et={deep_space_nine:1.452,earth_spacedock:5.48,utopia_planitia_drydock:.76},dn={id:"starbase",kind:"part",title:"Starbase",summary:"A built-in starbase model with its parts labelled",description:"A built-in starbase model (Deep Space 9, Earth Spacedock or a Utopia Planitia drydock) at a point, with its name and main parts labelled; far away a starbase marker stands in for it. Tap the name to fly to it.",icon:"mdi:space-station",params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"starbase"},{key:"label",label:"Label",type:"text",default:"DEEP SPACE 9"},{key:"model",label:"Model",type:"text",default:"deep_space_nine",helper:"deep_space_nine, earth_spacedock or utopia_planitia_drydock.",options:[{value:"deep_space_nine",label:"Deep Space 9"},{value:"earth_spacedock",label:"Earth Spacedock"},{value:"utopia_planitia_drydock",label:"Utopia Planitia drydock"}]},{key:"centre",label:"At",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"size",label:"Size (its largest extent)",type:"number",default:60,real:c(({model:i})=>et[String(i)]??et.deep_space_nine,"real")}],build:c(({label:i,model:e,centre:t,size:a},{units:s})=>{const n=R(t),r=xi[String(e)]?String(e):"deep_space_nine",l=Number(a)||60,o=Y(s),d=o!==null&&Number((et[r]/o).toPrecision(3))===l;return{points:[...n.points,{id:"name",at:n.ref,offset:[0,l*.7,0],label:String(i),style:"minor",tap_action:{action:"fly-to",view:"view"}},...xi[r].map(([u,y])=>({id:u,object:"station",part:u,marker:"dot",label:y,style:"tiny",max_distance:l*6})),{id:"far",at:n.ref,marker:"starbase",min_distance:l*12,tap_action:{action:"fly-to",view:"view"}}],objects:[{type:"model",id:"station",src:`builtin:${r}`,at:n.ref,...d?{}:{size:l},material:"original",max_distance:l*12}],views:{view:{target:n.ref,yaw:30,tilt:15,distance:l*2}}}},"build")},hn=94607304725808e-1,un={id:"badlands",kind:"part",title:"Badlands (Deep Space Nine)",summary:"Plasma sheets, a glowing band and fire columns to fly between",description:"The Badlands as Deep Space Nine drew them (nebula preset: badlands): a floor and a ceiling of liquid fire in yellow, orange and red, an orange band glowing in the gap between them and fire columns, thick and thin, standing from the floor to the ceiling. Fly the camera into the gap. Every key of the preset can be set on the nebula to change it.",icon:"mdi:fire",picture:{camera:{target:[0,0,0],yaw:30,tilt:22,distance:620}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"badlands"},{key:"label",label:"Label",type:"text",default:"BADLANDS"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"width",label:"Width",type:"number",default:500,real:10*hn,fit:true}],build:c(({label:i,centre:e,width:t})=>{const a=R(e),s=Number(t)||500;return{points:[...a.points,{id:"heart",at:a.ref,label:String(i),style:"major"}],objects:[{type:"nebula",id:"plasma",at:"heart",preset:"badlands",size:[s,N(s*.28),s]}]}},"build")},pn=94607304725808e-1,mn={id:"badlands_voyager",kind:"part",title:"Badlands (Voyager)",summary:"Mauve plasma layers with lightning columns and strikes",description:"The Badlands as Voyager drew them (nebula preset: badlands_voyager): a floor and a ceiling of peach and mauve gas with a pale band between, held pink lightning columns crawling from the floor to the ceiling, and strikes that flash in the gap and light the gas round them. Fly the camera into the gap. Every key of the preset can be set on the nebula to change it.",icon:"mdi:lightning-bolt",picture:{camera:{target:[0,0,0],yaw:200,tilt:4,distance:160}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"badlands"},{key:"label",label:"Label",type:"text",default:"BADLANDS"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"width",label:"Width",type:"number",default:500,real:10*pn,fit:true}],build:c(({label:i,centre:e,width:t})=>{const a=R(e),s=Number(t)||500;return{points:[...a.points,{id:"heart",at:a.ref,label:String(i),style:"major"}],objects:[{type:"nebula",id:"plasma",at:"heart",preset:"badlands_voyager",size:[s,N(s*.32),s]}]}},"build")},fn=94607304725808e-1,yn={id:"nexus",kind:"part",title:"The Nexus",summary:"A white-hot ribbon of energy trailing a wake of pink gas",description:"The Nexus as Generations drew it (nebula preset: nexus): a white-hot ribbon waving across space, its waves running along it, a wake of pink and red gas streaming out behind it, and small discharges crawling off it and lighting the gas. Set travel to orbit to send it round the centre on a wide orbit, its wake trailing behind. Every key of the preset can be set on the nebula to change it.",icon:"mdi:wave",picture:{camera:{target:[0,-60,0],yaw:8,tilt:6,distance:1500}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"nexus"},{key:"label",label:"Label",type:"text",default:"NEXUS"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"length",label:"Length",type:"number",default:2e3,real:fn,fit:true},{key:"travel",label:"Travel",type:"text",default:"still",options:[{value:"still",label:"Still (its waves still run)"},{value:"orbit",label:"Round the centre on a wide orbit"}]}],build:c(({label:i,centre:e,length:t,travel:a})=>{const s=R(e),n=Number(t)||2e3;if(a!=="orbit")return{points:[...s.points,{id:"heart",at:s.ref,label:String(i),style:"major"}],objects:[{type:"nebula",id:"ribbon",at:"heart",preset:"nexus",size:[n,N(n/4),N(n/4)]}]};const r=n*1.5;return{points:[...s.points,{id:"heart",polar:[r,0],object:"track",label:String(i),style:"major"}],objects:[{type:"ring",id:"track",at:s.ref,radius:r,spin:2,width:.5,opacity:0},{type:"nebula",id:"ribbon",at:"heart",preset:"nexus",size:[n,N(n/4),N(n/4)],face:"motion",rotation:[-90,0,0]}]}},"build")},bn=.6425/3,gn={id:"crystalline-entity",kind:"part",title:"Crystalline Entity",summary:"The Crystalline Entity, with a ship beside it for scale",description:`The Crystalline Entity ("Datalore", "Silicon Avatar"): a crystalline object 3 km tall, turning slowly about its glowing spine, its core pulsing. With a ship, a Galaxy-class starship (the Enterprise of both episodes) stands off its side at the same scale (642.5 m against 3 km), and with the beam the entity's core fires on it. Change the crystal colour on the object (var(--lcars-african-violet) for the lavender of the show).`,icon:"mdi:snowflake",picture:{camera:{target:[-800,0,0],yaw:0,tilt:5,distance:5e3}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"entity"},{key:"label",label:"Label",type:"text",default:"CRYSTALLINE ENTITY"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"size",label:"Height",type:"number",default:3e3,real:3,fit:true},{key:"ship",label:"Ship for scale",type:"text",default:"beam",options:[{value:"beam",label:"A ship, and the entity's beam on it"},{value:"ship",label:"A ship"},{value:"none",label:"No ship"}]}],build:c(({label:i,centre:e,size:t,ship:a})=>{const s=R(e),n=Number(t)||3e3,r=[...s.points,{id:"core",at:s.ref},{id:"tag",at:"core",offset:[0,N(n*.56),0],label:String(i),style:"major"}],l=[{type:"crystalline",id:"crystal",at:"core",size:n,spin:2}];return(a==="ship"||a==="beam")&&(r.push({id:"ship_at",at:"core",offset:[N(-n*.7),N(-n*.03),N(n*.1)],label:"USS ENTERPRISE",style:"minor"}),l.push({type:"model",id:"ship",src:"builtin:galaxy_class",at:"ship_at",size:N(n*bn)}),a==="beam"&&l.push({type:"beam",id:"beam",from:"core",to:"ship_at",width:10,color:"var(--lcards-moonlight)",pulse:true})),{points:r,objects:l}},"build")},se=[$s,ks,xs,As,Os,js,Ts,Ds,Bs,Us,Vs,Hs,Ks,Gs,Ls,en,tn,an,sn,rn,un,mn,yn,gn,on,ln,dn,Ws,Ys,qs],_n=new Set(["id","at","object","target","from","to","points","view","light","face","point"]),Ie=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$6"),wn=.25,vn=c((i,e)=>{const t=i[e.key];return t===void 0||t===""||t===null?void 0:t},"typedValue");function aa(i,e,t=null,a={}){if(i.kind!=="part"||i.scene||Y(t)!==null||!e)return null;const s=i.params.filter(o=>o.fit);if(!s.length||!ke(e))return null;const n=_i(e),r=Object.fromEntries(Object.entries(a).filter(([o])=>!s.some(d=>d.key===o))),l=_i(i.build($e(i,r),{units:null}));return!(n>0)||!(l>0)?null:(i.fitShare??wn)*n/l}c(aa,"fitFactor");function $e(i,e={},t=null,a=null){const s={},n=Y(t),r=c(o=>vn(e,o),"typed");for(const o of i.params)(o.real===void 0||n===null)&&(s[o.key]=Si(o,r(o)??o.default));for(const o of i.params){if(o.real===void 0||n===null)continue;const d=typeof o.real=="function"?o.real(s):o.real;s[o.key]=Si(o,r(o)??N(d/n))}const l=a?aa(i,a,t,e):null;if(l!==null)for(const o of i.params)o.fit&&r(o)===void 0&&(s[o.key]=N(Number(o.default)*l));return s}c($e,"starterParams");const Si=c((i,e)=>i.type==="point"?kn(e):i.type==="number"?Number(e):e,"convert");function Nt(i,e){if(e===void 0||e<0)return i.units??null;const t=Array.isArray(i.objects)?i.objects[e]:void 0;return(t==null?void 0:t.units)!==void 0?t.units:(t==null?void 0:t.scale)===void 0?i.units??null:null}c(Nt,"targetUnits");const $n=c((i,e,t,a=null)=>i.build($e(i,e,t,a),{units:Y(t)===null?null:t}),"buildStarter");function kn(i){if(Array.isArray(i))return i.map(Number);const e=String(i??"").trim(),t=e.replace(/^\[|\]$/g,"").split(/[\s,]+/).filter(Boolean).map(Number);return t.length===3&&t.every(Number.isFinite)?t:e}c(kn,"parsePointParam");function sa(i){return i=Fi(i),{points:(i.points??[]).map(e=>e==null?void 0:e.id).filter(e=>e!==void 0).map(String),objects:(i.objects??[]).map(e=>e==null?void 0:e.id).filter(e=>e!==void 0).map(String),views:Object.keys(i.views??{})}}c(sa,"fragmentIds");function xn(i,e){if(!e)return i;const t=sa(i),a=new Set([...t.points,...t.objects,...t.views]),s=c(l=>`${e}_${l}`,"name"),n=c((l,o)=>typeof l=="string"?o&&_n.has(o)&&a.has(l)?s(l):l:Array.isArray(l)?l.map(d=>n(d,o==="points"?o:null)):Ie(l)?Object.fromEntries(Object.entries(l).map(([d,u])=>[d,n(u,d)])):l,"walk"),r={...i};return i.points&&(r.points=n(i.points,null)),i.objects&&(r.objects=n(i.objects,null)),i.views&&(r.views=Object.fromEntries(Object.entries(i.views).map(([l,o])=>[s(l),n(o,null)]))),r}c(xn,"prefixFragment");function na(i){var a;i=Fi(i);const e=Array.isArray(i.points)?i.points:[],t=Array.isArray(i.objects)?i.objects:[];return{points:new Set(e.map(s=>s==null?void 0:s.id).filter(s=>s!==void 0).map(String)),objects:new Set(t.map(s=>s==null?void 0:s.id).filter(s=>s!==void 0).map(String)),views:new Set(Object.keys(Ie((a=i.camera)==null?void 0:a.views)?i.camera.views:{}))}}c(na,"configIds");function ke(i){const e=na(i);return e.points.size>0||Array.isArray(i.objects)&&i.objects.length>0||e.views.size>0}c(ke,"hasScene");const Sn=["points","objects","camera","backdrop","labels","background_animation","units","clock"];function An(i,e,t={},a){const s=Nt(i,a),n=$n(e,t,s,ge(i,a));return n.units!==void 0&&s!==n.units&&ke(ge(i,a))?n.units:null}c(An,"unitsClash");const ge=c((i,e)=>{var t;return e===void 0||e<0?i:((t=i.objects)==null?void 0:t[e])??{}},"targetOf");function Ne(i,e,t={},{mode:a,system:s}={}){var g,w,A,j,k,O;const n=(a??(e.kind==="scene"?"replace":"merge"))==="replace",r=s!==void 0&&s>=0?s:void 0;if(r!==void 0){if(e.kind!=="part"||n)return{error:"Only a part can go into a system, added next to what is there."};if(((w=(g=i.objects)==null?void 0:g[r])==null?void 0:w.type)!=="system")return{error:`Object ${r} is not a system.`}}const l={...i};if(n)for(const $ of Sn)delete l[$];const o=Nt(l,r),d=$e(e,t,o,ge(l,r));let u=e.build(d,{units:Y(o)===null?null:o});e.kind==="part"&&(u=xn(u,String(d.prefix??"").trim()));const y=ge(l,r);if(u.units!==void 0&&!n&&o!==u.units&&ke(y)){const $=r===void 0?"the card":"this system",T=r===void 0?"replace the scene instead":"add it to the scene instead";return{error:`This ${e.kind} is in ${u.units} and ${$} is in ${o??"scene units"}: ${T}.`}}const h=na(l),m=sa(u),f=[...m.points.filter($=>h.points.has($)).map($=>`point ${$}`),...m.objects.filter($=>h.objects.has($)).map($=>`object ${$}`),...m.views.filter($=>h.views.has($)).map($=>`view ${$}`)];if(f.length){const $=e.kind==="part"?" Choose another prefix.":" Replace the scene, or rename them first.";return{error:`Already in this card: ${f.join(", ")}.${$}`}}const b=l;if(r!==void 0){const $={...l.objects[r]};(A=u.points)!=null&&A.length&&($.points=[...Array.isArray($.points)?$.points:[],...u.points]),(j=u.objects)!=null&&j.length&&($.objects=[...Array.isArray($.objects)?$.objects:[],...u.objects]),u.units!==void 0&&o!==u.units&&($.units=u.units,delete $.scale),b.objects=l.objects.map((T,v)=>v===r?$:T)}else(k=u.points)!=null&&k.length&&(b.points=[...Array.isArray(l.points)?l.points:[],...u.points]),(O=u.objects)!=null&&O.length&&(b.objects=[...Array.isArray(l.objects)?l.objects:[],...u.objects]);if(u.views||u.camera){const $={...Ie(l.camera)?l.camera:{}};if(u.camera)for(const[T,v]of Object.entries(u.camera))(n||$[T]===void 0)&&($[T]=v);u.views&&($.views={...Ie($.views)?$.views:{},...u.views}),b.camera=$}return u.backdrop&&(n||b.backdrop===void 0)&&(b.backdrop=u.backdrop),u.units!==void 0&&r===void 0&&(b.units=u.units),u.clock&&(n||b.clock===void 0)&&(b.clock=u.clock),{config:b,added:u}}c(Ne,"applyStarter");const Ai=130,ze=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$5");function Me(i){return Array.isArray(i)?`[${i.map(Me).join(", ")}]`:ze(i)?Object.keys(i).length===0?"{}":`{ ${Object.entries(i).map(([e,t])=>`${yt(e)}: ${Me(t)}`).join(", ")} }`:yt(i)}c(Me,"flow");function yt(i){const e=ma.dump(i,{lineWidth:-1}).trim();return typeof i=="string"&&!/^['"]/.test(e)&&/[,[\]{}]/.test(i)?JSON.stringify(i):e}c(yt,"scalar");function bt(i,e){const t=[];if(Array.isArray(i)){for(const a of i){const s=`${e}- ${Me(a)}`;if(!ze(a)&&!Array.isArray(a)||s.length<=Ai){t.push(s);continue}const n=bt(a,`${e}  `);t.push(`${e}- ${n[0].trimStart()}`,...n.slice(1))}return t}for(const[a,s]of Object.entries(i)){const n=`${e}${yt(a)}:`,r=`${n} ${Me(s)}`;!ze(s)&&!Array.isArray(s)||r.length<=Ai||Array.isArray(s)&&!s.some(l=>ze(l)||Array.isArray(l))?t.push(r):t.push(n,...bt(s,`${e}  `))}return t}c(bt,"block");function On(i){return`${bt(i,"").join(`
`)}
`}c(On,"starterYaml");const P=-1,xe=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$4"),gt=c(i=>i==null||i==="","blank"),de=c(i=>Array.isArray(i==null?void 0:i.objects)?i.objects:[],"rootObjects");function he(i,e){const t=e>=0?de(i)[e]:void 0;return xe(t)&&t.type==="system"?t:null}c(he,"scopeSystem");function jn(i,e){return he(i,e)?e:P}c(jn,"validScope");function _t(i,e,t){const a=he(i,e)??i;return Array.isArray(a==null?void 0:a[t])?a[t]:[]}c(_t,"scopedList");function Oi(i,e,t,a){const s=c((r,l)=>{const o={...r};return!a||!a.length&&!l?delete o[t]:o[t]=a,o},"put"),n=he(i,e);return n?{...i,objects:de(i).map((r,l)=>l===e?s(n,false):r)}:s(i,t==="points")}c(Oi,"setScopedList");function Ue(i){const e={};let t=0;const a=c(r=>{if((r==null?void 0:r.type)==="system")return t++,gt(r.id)?`system#${t}`:String(r.id);const l=String(r==null?void 0:r.type);return e[l]=(e[l]??0)+1,gt(r==null?void 0:r.id)?`${l}#${e[l]}`:String(r.id)},"name"),s=[],n=new Map;return de(i).forEach((r,l)=>{s.push(a(r)),xe(r)&&r.type==="system"&&n.set(l,(Array.isArray(r.objects)?r.objects:[]).map(a))}),{scene:s,systems:n}}c(Ue,"sceneObjectIds");function Tn(i,e){const t=Ue(i);return he(i,e)?t.systems.get(e)??[]:t.scene}c(Tn,"scopedObjectIds");function tt(i,e){const t=c(s=>Array.isArray(s)&&s.some(n=>n&&String(n.id)===e),"has");if(t(i==null?void 0:i.points))return P;const a=de(i).findIndex(s=>xe(s)&&s.type==="system"&&t(s.points));return a>=0?a:null}c(tt,"pointScope");function En(i,e){const t=Ue(i),a=t.scene.indexOf(e);if(a>=0)return{scope:P,index:a};for(const[s,n]of t.systems){const r=n.indexOf(e);if(r>=0)return{scope:s,index:r}}return null}c(En,"objectScope");function Pn(i){return[i==null?void 0:i.points,...de(i).filter(t=>xe(t)&&t.type==="system").map(t=>t.points)].flatMap(t=>Array.isArray(t)?t:[]).map(t=>t==null?void 0:t.id).filter(t=>!gt(t)).map(String)}c(Pn,"allPointIds");function Nn(i,e){if(!he(i,e))return i;const t=de(i).flatMap(a=>xe(a)&&a.type==="system"?[a,...Array.isArray(a.objects)?a.objects:[]]:[a]);return{...i,points:_t(i,e,"points"),objects:t}}c(Nn,"pointsEditorConfig");function ji(i){const e=Ue(i);return[...e.scene,...[...e.systems.values()].flat()]}c(ji,"allObjectIds");const Ce=[{name:"top",label:"Top",yaw:0,tilt:90},{name:"front",label:"Front",yaw:0,tilt:0},{name:"side",label:"Side",yaw:90,tilt:0}];function zn(i,e){const t=Ce[i];return{target:e.target,distance:e.distance,fov:e.fov,yaw:t.yaw,tilt:t.tilt,projection:"orthographic"}}c(zn,"quickViewKeys");const it=[null,"diagram","realistic","mixed"];function Ti(i){const e=it.indexOf(i);return it[(e+1)%it.length]}c(Ti,"nextLook");const at=c(i=>{const e=Math.abs(i);if(e>=1e6){for(const[t,a]of[[1e12,"trillion"],[1e9,"billion"],[1e6,"million"]])if(e>=t)return`${Number((i/t).toPrecision(3)).toLocaleString("en-US")} ${a}`}return Number(i.toPrecision(3)).toLocaleString("en-US")},"sig"),Te=["m","km","au","ly","pc"];function Cn(i,e,t){const a=Math.hypot(e[0]-i[0],e[1]-i[1],e[2]-i[2]),s=Te.indexOf(t);if(s<0)return`${at(a)} ${t||"scene units"}`;const n=a*Vt[Te[s]],r=[Te[s-1],Te[s+1]].filter(l=>l!==void 0&&l!=="m").map(l=>[l,n/Vt[l]]).find(([,l])=>l>=.01&&l<1e9);return`${at(a)} ${t}${r?` (${at(r[1])} ${r[0]})`:""}`}c(Cn,"measureText");function In(i,e){const t=Array.isArray(i==null?void 0:i.objects)?i.objects:[],a=Ue(i),s=c(l=>l&&typeof l=="object"?{...l,visible:false}:l,"hide");let n=false;const r=t.map((l,o)=>{if(a.scene[o]===e)return n=true,l;const d=a.systems.get(o);if(d){const u=d.indexOf(e);u>=0&&(n=true);const y=Array.isArray(l.objects)?l.objects.map((h,m)=>m===u?h:s(h)):l.objects;return{...l,objects:y,...u>=0?{}:{visible:false}}}return s(l)});return n?{...i,objects:r}:i}c(In,"isolateConfig");function K(i){if(!Number.isFinite(i))return"-";if(i===0)return"0";const e=Math.abs(i);return e<.001||e>=1e9?i.toExponential(2).replace(/\.?0+e/,"e"):Number(i.toPrecision(3)).toLocaleString("en-US",{maximumFractionDigits:6})}c(K,"shortNumber");function wt(i){if(!(i>0)||!Number.isFinite(i))return 1;const e=Math.floor(Math.log10(i)),t=i/10**e;return Number(((t>=5?5:t>=2?2:1)*10**e).toPrecision(1))}c(wt,"roundLength");function Mn(i){return wt(i/5)}c(Mn,"fitToViewSize");function Ln(i,e,t){const a=fa[i==null?void 0:i.file_units]!==void 0?String(i.file_units):"m",s=e?Math.max(...e):null,n=e?`${e.map(K).join(" x ")} ${a} (largest ${K(s)} ${a})`:null,r=Ht(a,Y(t)),l=ya(i),[o,d]=l!==null?[l,"m"]:[s,a],u=l!==null?Ht("m",Y(t)):r,y=o!==null&&u!==null?o*u:null,h=y===null?null:d===t?`${K(y)} ${t}`:`${l!==null?l.toLocaleString("en-US",{maximumFractionDigits:3}):K(o)} ${d} = ${K(y)} ${t}`,m=ba(i);return m!==null?{file:n,largest:s,mode:"size",real:h,realSize:y,note:`Drawn at size ${K(m)}${t?` ${t}`:""} across.`}:r!==null&&l!==null?{file:n,largest:s,mode:"real",real:h,realSize:y,note:`Drawn at its real length: ${h}.`}:r!==null?{file:n,largest:s,mode:"real",real:h,realSize:y,note:h?`Drawn at its real size, as the file measures: ${h}. Set Length (m) if the file is not at its true scale.`:"Drawn at its real size."}:{file:n,largest:s,mode:"default",real:null,realSize:null,note:"Drawn at 50 across: the scene has no units, so there is no real size. Give the scene units (km, au, ly) in the Scene tab for one, or set a size."}}c(Ln,"modelSizeReadout");const zt="/lcards/images/astro-studio/";function Ei(i){return Ot(`${zt}starter-${i}.webp`)}c(Ei,"starterPicture");function Rn(i){return Ot(`${zt}type-${i}.webp`)}c(Rn,"typePicture");function Dn(i,e){return Ot(`${zt}shape-${i}-${e}.webp`)}c(Dn,"shapePicture");const Bn=[{id:"maps",header:"Maps and grids",icon:"mdi:grid",types:["grid","volume","image"]},{id:"bodies",header:"Bodies",icon:"mdi:earth",types:["sphere","satellites","belt","asteroid","comet"]},{id:"routes",header:"Routes and motion",icon:"mdi:vector-polyline",types:["ring","path","beam","trail"]},{id:"light",header:"Light and clouds",icon:"mdi:white-balance-sunny",types:["glow","nebula","galaxy","lightning"]},{id:"models",header:"Ships and models",icon:"mdi:rocket",types:["model","cube","crystalline"]},{id:"systems",header:"Systems",icon:"mdi:folder-outline",types:["system"]}],Un={type:"object",required:["entity"],properties:{entity:{type:"string"},attribute:{type:"string"},input:{type:"array",items:{type:"number"},minItems:2,maxItems:2},default:{type:"number"},active:{type:"number"},inactive:{type:"number"},unavailable:{type:"number"},zero:{type:"number"},non_zero:{type:"number"}},additionalProperties:{type:"number"}},Fn={oneOf:[{type:"string"},{type:"array",items:{type:"number"},minItems:3,maxItems:3}]};function Vn(i){var t;const e={};for(const a of i.params){const s={"x-ui-hints":{label:a.label}},n=a.real!==void 0?`In scene units; in named units (km, au, ly) it starts at a real size${a.fit?", in a scene without named units at a size that fits it":""}.`:a.fit?"In scene units; it starts at a size that fits the scene.":void 0,r=[a.helper,n].filter(Boolean).join(" ")||void 0;a.type==="number"?e[a.key]={type:"number",description:r,...s}:a.type==="setting"?e[a.key]={anyOf:[{type:"number"},Un],description:r,...s}:a.type==="point"?e[a.key]={...Fn,description:r,...s}:(t=a.options)!=null&&t.length&&!a.custom?e[a.key]={type:"string",enum:a.options.map(l=>l.value),default:a.default,description:r,...s,enumDescriptions:Object.fromEntries(a.options.map(l=>[l.value,l.label]))}:e[a.key]={type:"string",description:r,...s}}return e}c(Vn,"starterParamSchema");function Hn(i){return Object.fromEntries(i.params.filter(e=>{var t;return((t=e.options)==null?void 0:t.length)&&e.custom}).map(e=>[e.key,(e.options??[]).map(t=>t.value)]))}c(Hn,"starterParamChoices");function Kn(i,e={},t=null,a=null){const s=$e(i,e,t,a);return{...Object.fromEntries(i.params.map(n=>[n.key,n.real!==void 0||n.fit?s[n.key]:n.default])),...e}}c(Kn,"starterParamValues");function ra(i){var t,a;const e=c((s,n)=>s?`${s} ${n}${s===1?"":"s"}`:null,"n");return[e(((t=i.points)==null?void 0:t.length)??0,"point"),e(((a=i.objects)==null?void 0:a.length)??0,"object"),e(Object.keys(i.views??{}).length,"view")].filter(Boolean).join(", ")}c(ra,"fragmentCounts");function Gn(i,e={}){const t=Ne({},i,e);return t.added?ra(t.added):String(t.error)}c(Gn,"starterAdds");const Wn={m:"metres",km:"kilometres",au:"astronomical units",ly:"light years",pc:"parsecs"};function Yn(i){const e=i.build($e(i),{units:null}).units;return e?`In ${Wn[e]??e}: sizes and distances are real, and parts you add start at their real size.`:"In scene units, sized to be seen: parts you add are sized to fit it."}c(Yn,"sceneUnitsText");const Pi=c(i=>Array.from({length:28},(e,t)=>{const a=t/27,s=i+a*4.6,n=5+a*46;return`${(60+Math.cos(s)*n).toFixed(1)},${(60+Math.sin(s)*n*.55).toFixed(1)}`}).join(" "),"ARM"),F=c((i,e,t,a,s=120)=>E`
  <g transform="translate(${i} 0)">
    <rect class="frame" x="0.5" y="0.5" width=${s-1} height="120" rx="6"></rect>
    ${a}
    <text class="title" x=${s/2} y="137" text-anchor="middle">${e}</text>
    <text class="caption" x=${s/2} y="152" text-anchor="middle">${t}</text>
  </g>`,"panel"),qn={scale:{label:"A scene in light years holds a star system in kilometres at one of its points; a planet in that system has points on its surface",body:c(()=>E`
      ${F(0,"SCENE","light years",E`
        <polyline class="arm" points=${Pi(0)}></polyline><polyline class="arm" points=${Pi(Math.PI)}></polyline>
        <ellipse class="fill" cx="60" cy="60" rx="5" ry="3"></ellipse>
        <circle class="point" cx="88" cy="76" r="2.4"></circle>
        <text class="label" x="84" y="92">SOL</text>`)}
      <line class="zoom" x1="90" y1="76" x2="140" y2="0.5"></line>
      <line class="zoom" x1="90" y1="76" x2="140" y2="120.5"></line>
      ${F(140,"SYSTEM","km or au, at a point",E`
        <ellipse class="line" cx="60" cy="60" rx="22" ry="12"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="44" ry="24"></ellipse>
        <circle class="star" cx="60" cy="60" r="6"></circle>
        <circle class="body" cx="98" cy="72" r="4"></circle>
        <text class="label" x="84" y="90">EARTH</text>`)}
      <line class="zoom" x1="240" y1="72" x2="280" y2="0.5"></line>
      <line class="zoom" x1="240" y1="72" x2="280" y2="120.5"></line>
      ${F(280,"OBJECT + POINTS","points stand on it",E`
        <circle class="body" cx="60" cy="60" r="38"></circle>
        <ellipse class="line" cx="60" cy="60" rx="38" ry="12"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="14" ry="38"></ellipse>
        <circle class="point" cx="44" cy="48" r="2.4"></circle>
        <text class="label" x="48" y="45">BASE</text>
        <circle class="point" cx="72" cy="70" r="2.4"></circle>
        <text class="label" x="76" y="67">PORT</text>`)}`,"body")},starters:{label:"A scene starter replaces the card's scene or merges into it; a part adds one thing with ids that start with its name",body:c(()=>E`
      ${F(0,"SCENE","replace or merge",E`
        <rect class="line" x="12" y="30" width="38" height="44" rx="3"></rect>
        <circle class="point" cx="24" cy="44" r="2.4"></circle><circle class="point" cx="38" cy="60" r="2.4"></circle>
        <text class="small" x="31" y="88" text-anchor="middle">yours</text>
        <path class="arrow" d="M54 52 H66 M62 48 L66 52 L62 56"></path>
        <rect class="fill-soft" x="70" y="30" width="38" height="44" rx="3"></rect>
        <polyline class="arm" points="80,60 86,48 96,46 100,54"></polyline>
        <text class="small" x="89" y="88" text-anchor="middle">starter</text>`,120)}
      ${F(140,"PART","adds one thing",E`
        <rect class="line" x="12" y="30" width="60" height="50" rx="3"></rect>
        <circle class="point" cx="26" cy="46" r="2.4"></circle><circle class="point" cx="44" cy="64" r="2.4"></circle>
        <text class="small" x="42" y="94" text-anchor="middle">your scene</text>
        <text class="label big" x="82" y="58" text-anchor="middle">+</text>
        <circle class="body" cx="102" cy="54" r="9"></circle>
        <ellipse class="line" cx="102" cy="54" rx="15" ry="5"></ellipse>
        <text class="small" x="102" y="78" text-anchor="middle">mars_body</text>
        <text class="small" x="102" y="88" text-anchor="middle">mars_orbit</text>`,130)}
      ${F(290,"COPIED","yours to change",E`
        <rect class="fill-soft" x="15" y="25" width="80" height="60" rx="3"></rect>
        <text class="small" x="24" y="42">points:</text>
        <text class="small" x="24" y="56">objects:</text>
        <text class="small" x="24" y="70">camera:</text>`,110)}`,"body")},placement:{label:"A point stands on the ground plane by coordinates or bearing and range, on a sphere by latitude and longitude, or in a sector map cell",body:c(()=>E`
      ${F(0,"XYZ · POLAR","the ground plane",E`
        <polygon class="line" points="10,90 40,40 110,40 80,90"></polygon>
        <circle class="star" cx="60" cy="65" r="2.4"></circle>
        <line class="zoom" x1="60" y1="65" x2="88" y2="52"></line>
        <path class="line" d="M74 65 A 14 6 0 0 0 72 59"></path>
        <circle class="point" cx="88" cy="52" r="2.6"></circle>
        <text class="label" x="60" y="28" text-anchor="middle">[distance, bearing]</text>`)}
      ${F(140,"LATLON","on a sphere",E`
        <circle class="body" cx="60" cy="60" r="38"></circle>
        <ellipse class="line" cx="60" cy="60" rx="38" ry="11"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="15" ry="38"></ellipse>
        <circle class="point" cx="73" cy="44" r="2.6"></circle>
        <text class="label" x="78" y="40">[lat, lon]</text>`)}
      ${F(280,"CELL","on a sector map",E`
        ${[0,1,2,3].map(i=>E`<line class="line" x1=${20+i*27} y1="30" x2=${20+i*27} y2="111"></line><line class="line" x1="20" y1=${30+i*27} x2="101" y2=${30+i*27}></line>`)}
        ${["A","B","C"].map((i,e)=>E`<text class="small" x=${33+e*27} y="24" text-anchor="middle">${i}</text>`)}
        ${[1,2,3].map((i,e)=>E`<text class="small" x="12" y=${47+e*27} text-anchor="middle">${i}</text>`)}
        <rect class="fill-soft" x="47" y="57" width="27" height="27"></rect>
        <circle class="point" cx="60.5" cy="70.5" r="2.6"></circle>
        <text class="label" x="60.5" y="80" text-anchor="middle">B2</text>`)}`,"body")},camera:{label:"A camera view: the target it looks at, the yaw it is turned round the target, the tilt it looks down at, and its distance",body:c(()=>E`
      <g>
        <rect class="frame" x="0.5" y="0.5" width="399" height="120" rx="6"></rect>
        <ellipse class="line" cx="170" cy="84" rx="140" ry="18"></ellipse>
        <circle class="point" cx="170" cy="84" r="3"></circle>
        <text class="label" x="150" y="80" text-anchor="end">target</text>
        <line class="zoom" x1="170" y1="84" x2="300" y2="30"></line>
        <text class="label" x="236" y="48">distance</text>
        <line class="zoom" x1="300" y1="30" x2="296" y2="90"></line>
        <line class="zoom" x1="170" y1="84" x2="296" y2="90"></line>
        <path class="arrow" d="M150 101 A 50 9 0 0 0 214 95"></path>
        <text class="label" x="182" y="114">yaw</text>
        <path class="arrow" d="M216 86 A 46 46 0 0 0 212.5 66.3"></path>
        <text class="label" x="222" y="76">tilt</text>
        <g transform="translate(300 30) rotate(25)">
          <rect class="fill" x="-10" y="-7" width="20" height="14" rx="2"></rect>
          <polygon class="fill" points="-10,-4 -18,-8 -18,8 -10,4"></polygon>
        </g>
        <text class="label" x="318" y="28">camera</text>
        <text class="title" x="200" y="137" text-anchor="middle">A VIEW</text>
        <text class="caption" x="200" y="152" text-anchor="middle">looks at a target, from yaw, tilt and distance</text>
      </g>`,"body")},distance:{label:"An object shows while the camera is between its min_distance and max_distance, fading in and out at the edges",body:c(()=>E`
      <g>
        <rect class="frame" x="0.5" y="0.5" width="399" height="120" rx="6"></rect>
        <line class="line" x1="20" y1="96" x2="384" y2="96"></line>
        <path class="arrow" d="M378 92 L384 96 L378 100"></path>
        <text class="small" x="384" y="112" text-anchor="end">camera distance</text>
        <polyline class="curve" points="20,90 100,90 124,40 270,40 296,90 380,90"></polyline>
        <line class="zoom" x1="112" y1="30" x2="112" y2="96"></line>
        <line class="zoom" x1="283" y1="30" x2="283" y2="96"></line>
        <text class="label" x="112" y="24" text-anchor="middle">min_distance</text>
        <text class="label" x="283" y="24" text-anchor="middle">max_distance</text>
        <text class="small" x="60" y="80" text-anchor="middle">too close: hidden</text>
        <text class="small" x="197" y="60" text-anchor="middle">shown</text>
        <text class="small" x="336" y="80" text-anchor="middle">too far: hidden</text>
        <text class="title" x="200" y="137" text-anchor="middle">DISTANCE</text>
        <text class="caption" x="200" y="152" text-anchor="middle">shown between the two, fading in and out at the edges</text>
      </g>`,"body")}},Le=class Le2 extends _e{static get properties(){return{kind:{type:String}}}constructor(){super(),this.kind="scale"}render(){const e=qn[this.kind];return e?p`<svg viewBox="0 -4 400 162" role="img" aria-label=${e.label}>${e.body()}</svg>`:_}};c(Le,"LCARdSAstroDiagram"),Ut(Le,"styles",ce`
    :host { display: block; padding: var(--ha-space-2) 0; }
    svg { display: block; width: 100%; height: auto; max-width: 520px; margin: 0 auto; overflow: visible; }
    .frame { fill: none; stroke: var(--divider-color, #888); stroke-width: 1; }
    .title { fill: var(--primary-text-color, #ddd); font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
    .caption { fill: var(--secondary-text-color, #aaa); font-size: 10px; }
    .label { fill: var(--primary-text-color, #ddd); font-size: 9px; }
    .label.big { font-size: 18px; }
    .small { fill: var(--secondary-text-color, #aaa); font-size: 8.5px; }
    .arm, .curve { fill: none; stroke: var(--primary-color, #ff9900); stroke-width: 1.6; }
    .arm { opacity: 0.7; }
    .fill { fill: var(--primary-color, #ff9900); }
    .fill-soft { fill: color-mix(in srgb, var(--primary-color, #ff9900) 18%, transparent); stroke: var(--primary-color, #ff9900); stroke-width: 1; }
    .line { fill: none; stroke: var(--secondary-text-color, #aaa); stroke-width: 0.8; }
    .star { fill: var(--accent-color, #ffcc66); }
    .body { fill: color-mix(in srgb, var(--primary-color, #ff9900) 15%, transparent); stroke: var(--primary-color, #ff9900); stroke-width: 1; }
    .point { fill: var(--primary-text-color, #ddd); }
    .zoom { fill: none; stroke: var(--secondary-text-color, #aaa); stroke-width: 0.8; stroke-dasharray: 3 2; }
    .arrow { fill: none; stroke: var(--primary-text-color, #ddd); stroke-width: 1; }
  `);let vt=Le;customElements.get("lcards-astro-diagram")||customElements.define("lcards-astro-diagram",vt);const Se=c(i=>p`
  <div class="info-guide-links">
    ${i.map(([e,t])=>p`<a href=${jt(t)} target="_blank" rel="noopener">${e}</a>`)}
  </div>`,"links");function Jn({open:i=false}={}){return we({id:"astro-overview",header:"How an Astrometrics scene works",icon:"mdi:telescope",open:i,body:p`
      <lcards-astro-diagram kind="scale"></lcards-astro-diagram>
      <ul>
        <li><b>Objects</b> are what is drawn: grids and sector maps, planets, rings and orbits, routes, nebulae, galaxies, ships and stations.</li>
        <li><b>Points</b> are named places. They carry labels and markers, and objects, routes and camera views name them by id. A point can stand on an object: a city on a planet, a cell of a sector map, a part of a ship.</li>
        <li><b>Units</b> are yours to pick (Scene tab, Units). Positions, sizes and distances are all in scene units; name them (light years, au, km) when you use real numbers. Each length field shows its unit, and a part you add is sized to fit the scene, or at its real size when the units are named.</li>
        <li><b>Systems</b> hold their own points and objects in units of their own at a point of the scene: a galaxy in light years with a solar system in km inside it. Open one from its row in the Objects tab. The camera works in a system's units while it is near.</li>
        <li><b>Camera views</b> are named places to look from. Tap actions fly to them, and one is where the card starts.</li>
      </ul>
      <div class="info-guide-tip">Build in tab order: pick a starter, set the scene, add objects, put points on them, then capture views.</div>
      ${Se([["The Astrometrics card",L.card],["Scale and units",L.scale],["Star systems",L.systems],["The Studio",L.studio]])}
    `})}c(Jn,"overviewGuide");function Qn(){return we({id:"astro-starters",header:"About starters",icon:"mdi:rocket-launch-outline",body:p`
      <lcards-astro-diagram kind="starters"></lcards-astro-diagram>
      <ul>
        <li><b>Scenes</b> are whole cards: points, objects, views, backdrop and labels. Use one to start over, or merge it into what is here.</li>
        <li><b>Parts</b> add one thing next to your scene, such as a planet with moons or an asteroid belt. Their ids start with the name you give, so the same part can go in twice.</li>
        <li><b>Try in the preview</b> shows a starter on the card without changing anything; <b>Keep</b> puts it in, <b>Discard</b> goes back. Its settings can still change while you try it.</li>
        <li>A starter is copied into your config: change anything afterwards, nothing refers back to it. <b>Undo</b> (Ctrl+Z, or the preview's toolbar) takes it out again, and Cancel leaves the card as it was.</li>
      </ul>
      ${Se([["Every starter",L.starters]])}
    `})}c(Qn,"startersGuide");function Zn(){return we({id:"astro-objects",header:"How objects work",icon:"mdi:shape-outline",body:p`
      <lcards-astro-diagram kind="distance"></lcards-astro-diagram>
      <ul>
        <li><b>Add object</b> lists every type by what it is for. A new object gets an id and the keys its type needs.</li>
        <li>Every object takes a place (<code>at</code>: coordinates or a point), rotation, spin, opacity and visibility; the rest is its type's own.</li>
        <li><b>On the scene:</b> an object standing at a point moves with it: select the object and drag it, and its point moves. The toolbar's <b>Preview</b> group can show it alone or hold the motion while you work (not saved).</li>
        <li><b>Distance</b> keys pick what shows from how far away (above), so a busy scene stays readable as you zoom.</li>
        <li>Some types come in shapes or patterns (a grid is a plane, disc, dome, sphere, cylinder or well). A form shows only the keys for the object's own shape.</li>
        <li>An object's form starts with its shape and size, then <b>Appearance</b> (colours, opacity, lines), <b>Position and motion</b>, <b>Visibility and distance</b> and <b>Actions and tags</b>.</li>
        <li>Points stand on objects by the object's <b>id</b>: give a planet or a grid an id to place points on it.</li>
        <li>A <b>system</b> holds its own points and objects in its own units. Open it from its row; the Points and Objects tabs then edit its lists.</li>
      </ul>
      ${Se([["Which type for what",L.objectTypes],["Distance",L.distance],["Star systems",L.systems]])}
    `})}c(Zn,"objectsGuide");function Xn(){return we({id:"astro-points",header:"How points work",icon:"mdi:map-marker-multiple",body:p`
      <lcards-astro-diagram kind="placement"></lcards-astro-diagram>
      <ul>
        <li>A point is placed once, in one form: coordinates (<code>xyz</code>), a distance and bearing on the plane (<code>polar</code>), latitude and longitude on a sphere, altitude and azimuth on a dome, a sector map cell, another point (<code>at</code>), the sun or moon, a real planet, or an entity's attributes.</li>
        <li><b>On the scene:</b> tap a point to open it, drag it to move it, or use <b>Place a point</b> in the toolbar to add one where you tap.</li>
        <li>A <b>label</b> and a <b>marker</b> make it show; a <b>style</b> picks the label size (title, major, minor, tiny or your own).</li>
        <li>An <b>entity</b> colours the label by state and can move the point.</li>
      </ul>
      ${Se([["Placement forms",L.placement],["Labels and styles",L.labels],["Points",L.points]])}
    `})}c(Xn,"pointsGuide");function er(){return we({id:"astro-camera",header:"How the camera works",icon:"mdi:video-3d",body:p`
      <lcards-astro-diagram kind="camera"></lcards-astro-diagram>
      <ul>
        <li>A <b>view</b> is where the camera looks (a target point or coordinates) and from where (yaw, tilt, distance). Move the preview, then <b>Capture view</b>.</li>
        <li>The <b>start view</b> (the star) is where the card opens. Without views it frames the whole scene.</li>
        <li>A tap action with <code>action: fly-to</code> and a <code>view</code> flies there; a tour steps through views by an entity's state.</li>
        <li>Below the views: how people can move the camera (drag, zoom, buttons), its limits, auto-rotate and the fly-to speed.</li>
      </ul>
      ${Se([["Camera and views",L.camera]])}
    `})}c(er,"cameraGuide");const oa=[["s","second"],["min","minute"],["h","hour"],["d","day"],["w","week"],["mo","month"],["y","year"]],st="custom";function tr(i,e){var s;const t=((s=oa.find(([n])=>n===e))==null?void 0:s[1])??e,a=Math.abs(i);return`${a} ${t}${a===1?"":"s"} a second${i<0?", backward":""}`}c(tr,"rateWords");const ir=c(i=>{const e=/^(-?\d+(?:\.\d+)?)\s*([a-z]+)\/s$/.exec(i);return e?{amount:Number(e[1]),unit:e[2]}:null},"stopParts"),la=ga.map(i=>{if(i.rate===_a)return{value:"live",label:"Live (real time)",rate:i.rate};if(i.rate===0)return{value:"0",label:"Paused",rate:0};const e=ir(i.label);return{value:i.label,label:e?tr(e.amount,e.unit):i.label,rate:i.rate}});function ar(i){const e=Vi(i);if(e===null)return{preset:"live"};const t=la.find(a=>Math.abs(a.rate-e)<=Math.abs(e)*1e-9);if(t)return{preset:t.value};if(typeof i=="string"&&new RegExp(wa).test(i.trim().toLowerCase())){const a=/^(-?\d+(?:\.\d+)?)\s*([a-z]+)/.exec(i.trim().toLowerCase());if(a)return{amount:Number(a[1]),unit:a[2]}}return{amount:e,unit:"d"}}c(ar,"rateField");function Ni(i){if(i==null||i===""||i==="live")return{amount:1,unit:"s"};if(typeof i=="string"){const t=/^\s*(-?\d+(?:\.\d+)?)\s*([a-z]+)/.exec(i.toLowerCase());if(t&&t[2]in Hi)return{amount:Number(t[1]),unit:t[2]}}return{amount:Vi(i)??1,unit:"d"}}c(Ni,"customParts");function sr(i){if(i!=="live")return i==="0"?0:i}c(sr,"presetValue");function nt(i,e){return`${Number.isFinite(i)?Number(i):1} ${e in Hi?e:"d"}/s`}c(nt,"customRateValue");const ca=c(i=>i==null||i===""||i==="now","isNowDate");function zi(i){if(ca(i)||typeof i!="string")return;if(/T\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:?\d\d)$/i.test(i.trim())){const a=new Date(i.trim());if(!Number.isNaN(a.getTime())){const s=c(n=>String(n).padStart(2,"0"),"p");return`${a.getFullYear()}-${s(a.getMonth()+1)}-${s(a.getDate())} ${s(a.getHours())}:${s(a.getMinutes())}:${s(a.getSeconds())}`}}const e=/^(\d{4}-\d\d-\d\d)(?:[T ](\d\d:\d\d(?::\d\d)?))?/.exec(i.trim());if(!e)return;const t=e[2]?e[2].length===5?`${e[2]}:00`:e[2]:"00:00:00";return`${e[1]} ${t}`}c(zi,"dateSelectorValue");function nr(i=new Date){const e=c(t=>String(t).padStart(2,"0"),"p");return`${i.getFullYear()}-${e(i.getMonth()+1)}-${e(i.getDate())} 00:00:00`}c(nr,"todayValue");const oe=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$3"),rr=c(i=>i==null||i===""||oe(i)&&Object.keys(i).length===0,"empty");function da(i,e,t){const[a,...s]=e,n={...oe(i)?i:{}},r=s.length?da(n[a],s,t):t;return rr(r)?delete n[a]:n[a]=r,n}c(da,"setPath");function or(i,e){let t=i;for(const a of String(e).split(".")){if(!oe(t))return null;if(oe(t.properties)&&t.properties[a])t=t.properties[a];else if(oe(t.additionalProperties))t=t.additionalProperties;else return null}return t??null}c(or,"schemaAt");function Ct({hass:i,schema:e,value:t,onChange:a}){const s={hass:i,config:oe(t)?t:{},_getSchemaForPath:c(n=>or(e,n),"_getSchemaForPath"),_getConfigValue:c(n=>String(n).split(".").reduce((r,l)=>r==null?void 0:r[l],s.config),"_getConfigValue"),_setConfigValue:c((n,r)=>{s.config=da(s.config,String(n).split("."),r),a(s.config)},"_setConfigValue"),requestUpdate:c(()=>{},"requestUpdate")};return s}c(Ct,"valueEditor");const I=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$2"),lr=new Set(["boolean","enum","choice","number","text","strings","numbers","font"]),rt="coords",cr=c(i=>(i==null?void 0:i.type)==="array","hasArrayType"),V=c(i=>i===""||i===null||i===void 0||Number.isNaN(Number(i))?void 0:Number(i),"num"),It=class It2 extends _e{static get properties(){return{hass:{attribute:false},schema:{attribute:false},value:{attribute:false},keys:{attribute:false},pointIds:{attribute:false},choices:{attribute:false},units:{type:String},systemIds:{attribute:false},_open:{state:true},_customRates:{state:true}}}constructor(){super(),this._bindModes=new Map,this.hass=null,this.schema={},this.value={},this.keys=null,this.pointIds=[],this.choices={},this.units="",this.systemIds=[],this._open=new Set,this._customRates=new Set}static get styles(){return ce`
      :host { display: block; font-family: var(--ha-font-family-body); }
      .wrap { container-type: inline-size; }
      /* minmax(0, ...): a field never widens its column (sliders and their boxes would push past the panel) */
      .fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--ha-space-4); align-items: start; margin-bottom: var(--ha-space-4); }
      .fields > *, .row > * { min-width: 0; }
      .full { grid-column: 1 / -1; }
      .row { display: grid; gap: var(--ha-space-2); grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
      .field-label { display: block; font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-bottom: var(--ha-space-1); }
      .hint { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-top: var(--ha-space-1); }
      .list-item { display: flex; gap: var(--ha-space-1); align-items: flex-start; }
      .list-item > :first-child { flex: 1; min-width: 0; }
      .list-actions { display: flex; justify-content: flex-end; }
      lcards-form-section { display: block; }
      .bindable { display: flex; align-items: flex-start; gap: var(--ha-space-1); }
      .bindable > ha-selector, .bindable > div, .bindable > lcards-font-selector { flex: 1; min-width: 0; }
      /* a side of a pair that follows an entity: its panel is under the row */
      .side-bound { display: flex; align-items: center; min-height: 56px; padding: 0 var(--ha-space-3); font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color); border: var(--ha-border-width-sm) dashed var(--divider-color); border-radius: var(--ha-border-radius-sm); }
      /* what a key holds besides its plain value: a nested section under the key's name */
      .sub-body { display: grid; gap: var(--ha-space-3); }
      .stack { display: grid; gap: var(--ha-space-2); }
      .stack > .field-label, .stack > .hint { margin: 0; }
      .stop { display: flex; gap: var(--ha-space-1); align-items: flex-start; }
      .stop > div { flex: 1; min-width: 0; display: grid; gap: var(--ha-space-2); }
      .pills { display: flex; align-items: center; gap: var(--ha-space-2); }
      .shape-picker { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: var(--ha-space-2); }
      .shape-tile { display: flex; flex-direction: column; gap: var(--ha-space-1); padding: 0 0 var(--ha-space-1); cursor: pointer; overflow: hidden;
        font: inherit; color: var(--primary-text-color); background: none; text-align: center;
        border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: var(--ha-border-radius-md); }
      .shape-tile:hover, .shape-tile:focus-visible { border-color: var(--primary-color); outline: none; }
      .shape-tile[aria-checked='true'] { border: var(--ha-border-width-md) solid var(--primary-color); }
      .shape-picture { position: relative; aspect-ratio: 16 / 9; background: black; }
      .shape-picture img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .pills wa-button-group ha-button::part(base) { border-radius: 0; }
      .pills wa-button-group ha-button:first-child::part(base) {
        border-start-start-radius: var(--ha-border-radius-pill); border-end-start-radius: var(--ha-border-radius-pill);
      }
      .pills wa-button-group ha-button:last-child::part(base) {
        border-start-end-radius: var(--ha-border-radius-pill); border-end-end-radius: var(--ha-border-radius-pill);
      }
      /* one column in a narrow panel (the Studio's third), two when there is room; last, so it wins */
      @container (max-width: 600px) { .fields { grid-template-columns: 1fr; } }
    `}_emit(e){this.dispatchEvent(new CustomEvent("form-changed",{detail:{value:e}}))}_set(e,t){this._emit(We(this.value??{},e,t))}_get(e){var t;return(t=this.value)==null?void 0:t[e]}render(){const e=this.schema??{},t=(this.keys??Object.keys(e)).filter(l=>e[l]&&is(l,e,this.value??{})),a=["object","objectList","boolOrObject","valueOrObject","textDefault"],s=t.filter(l=>![...a,"yaml"].includes(ue(e[l],l))),n=t.filter(l=>a.includes(ue(e[l],l))),r=t.filter(l=>ue(e[l],l)==="yaml");return p`
      <div class="wrap">
        <div class="fields">${s.map(l=>this._field(l,e[l]))}</div>
        ${n.map(l=>this._nested(l,e[l]))}
        ${r.map(l=>this._yaml(l,e[l]))}
      </div>
    `}_field(e,t){var u,y;const a=ue(t,e),s=Re(t),n=a==="number"?Ha(t.description,this.units):void 0,r=n?s.label??Ae(e):Ka(s.label??Ae(e),t.description,this.units),l=Ge(t.description),o=this._get(e),d=lr.has(a)?"":"full";if(Q(o)&&ne(t))return Ke(t)?this._tour(e,o,r,l):this._binding(e,t,a,o,r,l);if(q(o)&&Ba(t))return this._templateField(e,o,r);switch(a){case"boolean":return Array.isArray(o)||I(o)?this._yaml(e,t):this._bindable(e,t,d,this._selector(e,{boolean:{}},o??t.default??false,r,l,"",h=>h));case"boolOrList":return this._boolOrList(e,o,r,l);case"enum":{const h=t.enumDescriptions??{},m=t.enum.map(f=>({value:f,label:h[f]?`${f}: ${h[f]}`:f}));return t.default===void 0&&m.unshift({value:"",label:s.empty??"(Not set)"}),this._selector(e,{select:{mode:"dropdown",options:m}},o??t.default??"",r,l,d,f=>!f||f===t.default?void 0:f)}case"number":{const h=Va(t),m=n?{number:{...h.number,unit_of_measurement:n}}:h,f=m.number.mode==="slider",b=t.default!==void 0&&!/Default/.test(l)?`${l} Default ${t.default}.`.trim():l,g=o===void 0&&f?t.default:o;return this._bindable(e,t,f?"full":d,this._selector(e,m,g,r,b,"",V))}case"text":{if((u=this.choices)!=null&&u[e]||Array.isArray(t.pointWords)){const h=((y=this.choices)==null?void 0:y[e])??[...t.pointWords,...this.pointIds],m=[{value:"",label:"(Not set)"},...h.map(b=>({value:b,label:b}))],f=this._selector(e,{select:{mode:"dropdown",options:m,custom_value:true}},o??"",r,l,"",b=>b||void 0);return Ke(t)?p`
              <div class="bindable ${d}">
                ${f}
                <ha-icon-button data-key=${`${e}-tour`} .label=${"Make it a guided tour"} title="Make it a guided tour"
                  @click=${()=>this._set(e,{entity:"",views:o?[o]:[]})}>
                  <ha-icon icon="mdi:map-marker-path"></ha-icon>
                </ha-icon-button>
              </div>`:p`<div class=${d}>${f}</div>`}return I(o)?this._yaml(e,t):this._bindable(e,t,d,this._selector(e,{text:{}},o===void 0?"":String(o),r,l,"",h=>h||void 0))}case"range":return this._range(e,t,o,r,l);case"shape":return this._shape(e,t,o,r,l);case"rate":return this._bindable(e,t,"full",this._rate(e,o,r,l,h=>this._set(e,h)));case"date":return q(o)?this._templateField(e,o,r):this._bindable(e,t,"full",this._date(e,o,r,l,h=>this._set(e,h)));case"font":return p`
          <lcards-font-selector class=${d} data-key=${e} .hass=${this.hass} .value=${o??""} .label=${r} .helper=${l}
            @value-changed=${h=>{h.stopPropagation(),this._set(e,h.detail.value||void 0)}}>
          </lcards-font-selector>`;case"asset":{const h=t.assetSource==="model";return p`
          <lcards-asset-source-picker class="full" data-key=${e} .hass=${this.hass} .value=${o===void 0?"":String(o)}
            .label=${r} .assetTypes=${h?["model"]:["image"]} .accept=${h?["model/*"]:["image/*"]}
            .assetLabel=${h?"Built-in model":"Built-in image"}
            .customHelper=${h?"A .glb or .gltf file: /local/... (in /config/www) or an https:// URL.":"An image: /local/... (in /config/www) or an https:// URL."}
            .mediaHelper=${h?"Your own models: put .glb files in /config/www/lcards/models, then find them under LCARdS, My models.":"Browse or upload an image in the Home Assistant media library."}
            @value-changed=${m=>{m.stopPropagation(),this._set(e,m.detail.value||void 0)}}>
          </lcards-asset-source-picker>
          ${l?p`<div class="hint full">${l}</div>`:_}`}case"strings":return this._selector(e,{text:{}},Array.isArray(o)?o.join(", "):"",r,`${l} Separate with commas.`,d,h=>String(h??"").split(",").map(m=>m.trim()).filter(Boolean));case"numbers":return this._selector(e,{text:{}},Array.isArray(o)?o.join(", "):"",r,`${l} Numbers separated by commas.`,d,ss);case"color":return q(o)?this._templateField(e,o,r,void 0,"Back to a colour"):this._bindable(e,t,"full",this._color(e,o,r,l));case"colorList":{if((Array.isArray(o)?o:[o]).some(f=>I(f)||q(f)))return this._yaml(e,t);const h=!cr(t),m=Array.isArray(o)?o:typeof o=="string"&&o?[o]:[];return p`
          <lcards-color-list class="full" data-key=${e} .hass=${this.hass} .colors=${m} .label=${r} .description=${l}
            @colors-changed=${f=>{f.stopPropagation();const b=(f.detail.colors??[]).filter(Boolean);this._set(e,h&&b.length===1?b[0]:b)}}>
          </lcards-color-list>`}case"tuple":return this._tuple(e,t,o,r,l,"tuple");case"numberOrTuple":return this._bindable(e,t,"full",this._tuple(e,t,o,r,l,"numberOrTuple"));case"pointRef":return this._pointRef(r,l,o,h=>this._set(e,h));case"pointList":return this._pointList(e,r,l,o);case"choice":{if(I(o))return this._yaml(e,t);const h=Ji(t),m=Object.assign({},...(t.oneOf??t.anyOf).map(b=>b.enumDescriptions??{}));if(s.widget==="pills")return this._pills(e,t,h.words,m,o,r,l);const f=[{value:"",label:"(Not set)"},...h.bool?[{value:"true",label:"true"},{value:"false",label:"false"}]:[],...h.words.map(b=>({value:b,label:m[b]?`${b}: ${m[b]}`:b}))];return this._bindable(e,t,d,this._selector(e,{select:{mode:"dropdown",options:f,custom_value:h.number}},o===void 0?"":String(o),r,h.number?`${l?`${l} `:""}(or type a number)`:l,"",b=>Fa(b,h)))}case"boolOrNumber":return p`
          <div class="full row">
            ${this._selector(`${e}-on`,{boolean:{}},o!==void 0&&o!==false,r,l,"",h=>this._set(e,h?true:void 0))}
            ${o!==void 0&&o!==false?this._selector(`${e}-n`,{number:{mode:"box",step:"any"}},typeof o=="number"?o:void 0,"Factor","(Blank: the default)","",h=>this._set(e,V(h)??true)):_}
          </div>`;default:return _}}_color(e,t,a,s,n=r=>this._set(e,r)){return p`
      <div data-key=${e}>
        <span class="field-label">${a}</span>
        <lcards-color-picker .hass=${this.hass} .value=${t??""}
          @value-changed=${r=>{r.stopPropagation(),n(r.detail.value||void 0)}}>
        </lcards-color-picker>
        ${s?p`<div class="hint">${s}</div>`:_}
      </div>`}_bindable(e,t,a,s){return!ne(t)||Ke(t)?p`<div class=${a}>${s}</div>`:p`
      <div class="bindable ${a}">
        ${s}
        <ha-icon-button class="bind" data-key=${`${e}-bind`} .label=${"Follow an entity"} title="Follow an entity"
          @click=${()=>this._set(e,{entity:""})}>
          <ha-icon icon="mdi:link-variant"></ha-icon>
        </ha-icon-button>
      </div>`}_subPanel(e,t,a,s,n,r=l=>this._set(e,l)){return p`
      <lcards-form-section class="full binding" data-key=${e} header=${a} icon=${t} nested outlined ?expanded=${true}>
        <ha-icon-button slot="header-icons" data-key=${`${e}-unbind`} .label=${s} title=${s}
          @click=${l=>{l.stopPropagation(),r(void 0)}}>
          <ha-icon icon="mdi:link-variant-off"></ha-icon>
        </ha-icon-button>
        <div class="sub-body">${n}</div>
      </lcards-form-section>`}_binding(e,t,a,s,n,r,l=o=>this._set(e,o)){var T;const o=((T=ne(t))==null?void 0:T.properties)??{},d=a!=="text"&&a!=="boolean",u=c(v=>{const x={...s,...v};for(const C of Object.keys(x))x[C]===void 0&&delete x[C];l(x)},"set"),y=c((v,x,C)=>p`
      <div class="row">
        ${[0,1].map(U=>this._selector(`${e}~${v}${U}`,{number:{mode:"box",step:"any"}},Array.isArray(s[v])?s[v][U]:void 0,x[U],C[U],"",ha=>{const Fe=Array.isArray(s[v])?[...s[v]]:[void 0,void 0];Fe[U]=V(ha),u({[v]:Fe.every(Ve=>Ve===void 0)?void 0:Fe.map(Ve=>Ve??0)})}))}
      </div>`,"pair"),h=a==="color",m=h?"Back to a colour":a==="choice"||a==="boolean"?"Back to a fixed value":"Back to a number",f=h||d&&!!o.active,b=c(v=>h?v!=="entity"&&v!=="attribute":v==="default"||!Ui.includes(v),"isState"),g=!h&&Object.keys(s).some(v=>v!=="default"&&b(v)),w=["input","output","clamp"],A=w.some(v=>s[v]!==void 0),j=!f||h?"range":g?"state":this._bindModes.get(e)??"range",k=c(v=>{if(v===j)return;this._bindModes.set(e,v);const x=Object.fromEntries(Object.entries(s).filter(([C])=>v==="state"?!w.includes(C):!b(C)||C==="default"));JSON.stringify(x)===JSON.stringify(s)?this.requestUpdate():l(x)},"setMode"),O=!h&&f?p`
      <div class="pills full" data-key=${`${e}~mode`}>
        <wa-button-group childSelector="ha-button">
          <ha-button size="s" variant="brand" data-value="range" .appearance=${j==="range"?"accent":"filled"} @click=${()=>k("range")}>Range</ha-button>
          <ha-button size="s" variant="brand" data-value="state" .appearance=${j==="state"?"accent":"filled"} @click=${()=>k("state")}>By state</ha-button>
        </wa-button-group>
      </div>`:_,$=f?p`
      <lcards-color-section-v2 class="full" data-key=${`${e}~states`}
        .editor=${{hass:this.hass,config:{entity:s.entity},_getConfigValue:c(()=>Object.fromEntries(Object.entries(s).filter(([v])=>b(v))),"_getConfigValue"),_setConfigValue:c((v,x)=>l({...Object.fromEntries(Object.entries(s).filter(([C])=>!b(C))),...x}),"_setConfigValue")}}
        basePath="states" .entityId=${s.entity||""} .valueKind=${h?"color":"number"}
        header=${h?"Colour by state":`${n} by state`}
        description=${h?"The first state that matches gives the colour; none: the entity's own colour (attribute: rgb_color on a light), else Default.":`The first state that matches gives the ${n.toLowerCase()}; Default when none does.${A?" The range in YAML (input, output) applies when no state matches.":""}`}
        .suggestedStates=${["default","active","inactive","unavailable","zero","non_zero"]}
        ?allowCustomStates=${true} ?expanded=${true}>
      </lcards-color-section-v2>`:_;return this._subPanel(e,"mdi:link-variant",`${n}: follows an entity`,m,p`
      ${this._selector(`${e}~entity`,{entity:{}},s.entity||void 0,"Entity",h?"":r,"",v=>u({entity:v||"",attribute:void 0}))}
      ${o.attribute?this._attribute(e,s,u):_}
      ${h?$:_}
      ${O}
      ${d&&!h&&j==="range"?p`
        ${o.input?y("input",["Entity low","Entity high"],["Default: its min (else 0)","Default: its max (else 100)"]):_}
        ${o.output?y("output",[`${n} at entity low`,`${n} at entity high`],["Both empty: the entity's own number","Held at the ends outside the entity range"]):_}
        ${o.clamp?this._selector(`${e}~clamp`,{boolean:{}},s.clamp!==false,"Clamp","Off: values past the entity range carry on past the ends.","",v=>u({clamp:v?void 0:false})):_}
        ${o.default?this._selector(`${e}~default`,{number:{mode:"box",step:"any"}},s.default,`${n} with no value`,"While the entity has no number (unavailable). Read by its state alone, on, playing or home is the entity high and off the entity low.","",v=>u({default:V(v)})):_}`:_}
      ${!h&&f&&j==="state"?$:_}
      ${d&&o.smooth?this._selector(`${e}~smooth`,{number:{mode:"box",min:0,step:50}},s.smooth,"Smooth (ms)","opacity, radius, size and spin ease over this; default 600, 0 steps.","",v=>u({smooth:V(v)})):_}`,l)}_templateField(e,t,a,s=r=>this._set(e,r),n="Back to a number"){return this._subPanel(e,"mdi:code-braces",`${a}: a template`,n,this._selector(`${e}~template`,{text:{multiline:true}},t,"","JavaScript [[[ ]]], Jinja2 {{ }} or a {entity.state} token.","",r=>s(r||void 0)),s)}_tour(e,t,a,s){var h;const n=Array.isArray(t.views)?t.views:[],r=((h=this.choices)==null?void 0:h[e])??[],l=c(m=>{const f={...t,...m};for(const b of Object.keys(f))f[b]===void 0&&delete f[b];this._set(e,f)},"set"),o=c(m=>l({views:m.length?m:void 0}),"setStops"),d=c((m,f)=>o(n.map((b,g)=>g===m?f:b)),"setStop"),u=c(m=>typeof m=="string"?m:String((m==null?void 0:m.view)??""),"viewOf"),y=r.map(m=>({value:m,label:m}));return p`
      <lcards-form-section class="full binding" data-key=${e} header=${`${a}: a guided tour`} icon="mdi:map-marker-path" nested outlined ?expanded=${true}>
        <ha-icon-button slot="header-icons" data-key=${`${e}-unbind`} .label=${"Back to one view"} title="Back to one view"
          @click=${m=>{m.stopPropagation(),this._set(e,u(n[0])||void 0)}}>
          <ha-icon icon="mdi:link-variant-off"></ha-icon>
        </ha-icon-button>
        <div class="sub-body">
        ${this._selector(`${e}~entity`,{entity:{}},t.entity||void 0,"Entity","An input_number picks the nth stop (from 0); an input_select names the view. "+s,"",m=>l({entity:m||"",attribute:void 0}))}
        ${this._attribute(e,t,l)}
        <span class="field-label">Stops</span>
        ${n.length?_:p`<div class="hint">No stops: the entity's state names the view (an input_select of view names).</div>`}
        ${n.map((m,f)=>{const b=I(m);return p`
            <div class="stop" data-key=${`${e}~stop${f}`}>
              <div>
                ${this._selector(`${e}~view${f}`,{select:{mode:"dropdown",options:y,custom_value:true}},u(m),`${f}`,"","",g=>d(f,b?{...m,view:g||""}:g||""))}
                ${b?p`
                  ${this._date(`${e}~date${f}`,m.date,"Date there","",g=>d(f,We(m,"date",g)))}
                  ${this._rate(`${e}~rate${f}`,m.rate,"Rate there","",g=>d(f,We(m,"rate",g)))}`:_}
              </div>
              <ha-icon-button .label=${b?"Leave the clock as it is":"Set the clock here"} title=${b?"Leave the clock as it is":"Set the clock here"}
                @click=${()=>d(f,b?u(m):{view:u(m)})}>
                <ha-icon icon=${b?"mdi:clock-remove-outline":"mdi:clock-outline"}></ha-icon>
              </ha-icon-button>
              <ha-icon-button .label=${"Move up"} ?disabled=${f===0}
                @click=${()=>{const g=[...n];[g[f-1],g[f]]=[g[f],g[f-1]],o(g)}}>
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </ha-icon-button>
              <ha-icon-button .label=${"Remove"} @click=${()=>o(n.filter((g,w)=>w!==f))}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
            </div>`})}
        <div class="list-actions">
          <ha-button appearance="plain" size="s" data-key=${`${e}~add`} @click=${()=>o([...n,r[n.length]??r[0]??""])}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add stop
          </ha-button>
        </div>
        </div>
      </lcards-form-section>`}_attribute(e,t,a){var s,n,r;if(!t.entity)return _;if(String(t.entity).startsWith("light.")){const l=Object.keys(((r=(n=(s=this.hass)==null?void 0:s.states)==null?void 0:n[t.entity])==null?void 0:r.attributes)??{}).sort();l.includes("brightness")||l.push("brightness");const o=[{value:"",label:"(Use entity state)"}];for(const d of l)o.push({value:d,label:d==="brightness"?"brightness (0 to 255)":d}),d==="brightness"&&o.push({value:"brightness_pct",label:"brightness_pct (0 to 100 %, 0 while off)"});return this._selector(`${e}~attribute`,{select:{mode:"dropdown",options:o,custom_value:true}},t.attribute??"","Attribute (optional)","Leave empty to read the state (on and off). brightness_pct reads the brightness as 0 to 100 %.","",d=>a({attribute:d||void 0}))}return this._selector(`${e}~attribute`,{attribute:{entity_id:t.entity}},t.attribute??"","Attribute (optional)","Leave empty to read the state.","",l=>a({attribute:l||void 0}))}_range(e,t,a,s,n){const r=Ra(t),l=Zt(t.description,2),o=Array.isArray(t.default)?t.default:[r.minimum,r.maximum],d=Array.isArray(a)?a:o,u=c((y,h)=>{const m=[0,1].map(f=>f===y?V(h)??o[f]:typeof d[f]=="number"?d[f]:o[f]);this._set(e,m[0]===o[0]&&m[1]===o[1]?void 0:m)},"change");return p`
      <div class="full" data-key=${e}>
        <span class="field-label">${s}</span>
        <div class="row">
          ${l.map((y,h)=>p`
            <ha-selector data-key=${`${e}~${h}`} .hass=${this.hass} .selector=${{number:{mode:"slider",min:r.minimum,max:r.maximum,step:"any"}}}
              .value=${typeof d[h]=="number"?d[h]:o[h]} .label=${y.charAt(0).toUpperCase()+y.slice(1)} .required=${false}
              @value-changed=${m=>{m.stopPropagation(),u(h,m.detail.value)}}>
            </ha-selector>`)}
        </div>
        ${n?p`<div class="hint">${n}</div>`:_}
      </div>`}_shape(e,t,a,s,n){var d;const r=String(((d=this.value)==null?void 0:d.type)??""),l=t.enumDescriptions??{},o=a??t.default;return p`
      <div class="full" data-key=${e}>
        <span class="field-label" id="shape-${e}">${s}</span>
        <div class="shape-picker" role="radiogroup" aria-labelledby="shape-${e}">
          ${t.enum.map(u=>p`
            <button type="button" class="shape-tile" role="radio" data-shape=${u} aria-checked=${u===o?"true":"false"}
              title=${l[u]??u} @click=${()=>this._set(e,u===t.default?void 0:u)}>
              <span class="shape-picture"><img src=${Dn(r,u)} alt="" loading="lazy"
                @error=${y=>{y.target.hidden=true}}></span>
              <span>${u}</span>
            </button>`)}
        </div>
        ${n?p`<div class="hint">${n}</div>`:_}
      </div>`}_rate(e,t,a,s,n){const r=ar(t),l=!("preset"in r)||this._customRates.has(e),o=l?Ni(t):{amount:0,unit:"d"},d=[...la.map(u=>({value:u.value,label:u.label})),{value:st,label:"Custom"}];return p`
      <div class="stack" data-key=${e}>
        <ha-selector data-key=${`${e}~preset`} .hass=${this.hass} .selector=${{select:{mode:"dropdown",options:d}}}
          .value=${l||!("preset"in r)?st:r.preset} .label=${a} .required=${false}
          @value-changed=${u=>{u.stopPropagation();const y=u.detail.value,h=new Set(this._customRates);if(y===st){h.add(e),this._customRates=h;const m=Ni(t);n(nt(m.amount,m.unit))}else h.delete(e),this._customRates=h,n(sr(y??"live"))}}>
        </ha-selector>
        ${l?p`
          <div class="row">
            ${this._selector(`${e}~amount`,{number:{mode:"box",step:"any"}},o.amount,"Amount","Negative runs backward.","",u=>n(nt(V(u),o.unit)))}
            ${this._selector(`${e}~unit`,{select:{mode:"dropdown",options:oa.map(([u,y])=>({value:u,label:`${y}s a second`}))}},o.unit,"Unit","","",u=>n(nt(o.amount,u||"d")))}
          </div>`:_}
        <div class="hint">The scene's date moves on by this much each real second. Live keeps it on the real date and time; Paused holds it.</div>
      </div>`}_date(e,t,a,s,n){const r=ca(t);return p`
      <div class="stack" data-key=${e}>
        <span class="field-label">${a}</span>
        <div class="pills">
          <wa-button-group childSelector="ha-button">
            <ha-button size="s" variant="brand" data-value="now" .appearance=${r?"accent":"filled"} @click=${()=>n(void 0)}>Now</ha-button>
            <ha-button size="s" variant="brand" data-value="date" .appearance=${r?"filled":"accent"}
              @click=${()=>{r&&n(nr())}}>Date and time</ha-button>
          </wa-button-group>
        </div>
        ${r?_:this._selector(`${e}~datetime`,{datetime:{}},zi(t),"","","",l=>n(l&&l===zi(t)?t:l||void 0))}
        ${s?p`<div class="hint">${s}</div>`:_}
      </div>`}_boolOrList(e,t,a,s){const n=t===true||Array.isArray(t),r=Array.isArray(t)?t.map(String):[],l=[...new Set([...this.systemIds,...r])];return p`
      <div class="full">
        ${this._selector(`${e}-on`,{boolean:{}},n,a,s,"",o=>this._set(e,o?r.length?r:true:void 0))}
        ${n&&l.length?this._selector(`${e}~list`,{select:{multiple:true,options:l.map(o=>({value:o,label:o}))}},r,"Only in these systems","None picked: every system.","",o=>this._set(e,Array.isArray(o)&&o.length?o:true)):_}
      </div>`}_pills(e,t,a,s,n,r,l){const o=n??t.default;return p`
      <div class="full" data-key=${e}>
        <span class="field-label">${r}</span>
        <div class="pills">
          <wa-button-group childSelector="ha-button">
            ${a.map(d=>p`
              <ha-button size="s" variant="brand" data-value=${d} .appearance=${o===d?"accent":"filled"} title=${s[d]??d}
                @click=${()=>this._set(e,d===t.default?void 0:d)}>
                ${d.charAt(0).toUpperCase()+d.slice(1)}
              </ha-button>`)}
          </wa-button-group>
          ${ne(t)?p`
            <ha-icon-button class="bind" data-key=${`${e}-bind`} .label=${"Follow an entity"} title="Follow an entity"
              @click=${()=>this._set(e,{entity:""})}>
              <ha-icon icon="mdi:link-variant"></ha-icon>
            </ha-icon-button>`:_}
        </div>
        ${l?p`<div class="hint">${l}</div>`:_}
      </div>`}_selector(e,t,a,s,n,r,l){return p`
      <ha-selector class=${r} data-key=${e} .hass=${this.hass} .selector=${t} .value=${a} .label=${s}
        .helper=${n} .required=${false}
        @value-changed=${o=>{o.stopPropagation();const d=l(o.detail.value);!e.includes("~")&&!e.endsWith("-on")&&!e.endsWith("-n")&&this._set(e,d)}}>
      </ha-selector>`}_tuple(e,t,a,s,n,r){var f,b;const l=Xa(t),o=Zt(t.description??((b=(f=t.oneOf)==null?void 0:f.find(g=>g.description))==null?void 0:b.description),l),d=Array.isArray(a)?a:typeof a=="number"?[a]:[],u=Da(t),y=c(g=>Q(g)||q(g)?g:V(g),"keep"),h=c((g,w)=>{const A=Array.from({length:l},(k,O)=>y(O===g?w:d[O]));if(A.every(k=>k===void 0))return this._set(e,void 0);if(r==="numberOrTuple"&&A.slice(1).every(k=>k===void 0)&&typeof A[0]=="number")return this._set(e,A[0]);const j=A.find(k=>typeof k=="number")??0;this._set(e,A.map(k=>k===void 0?r==="numberOrTuple"?j:0:k))},"change"),m=o.map((g,w)=>Q(d[w])||q(d[w]));return p`
      <div class="full" data-key=${e}>
        <span class="field-label">${s}</span>
        <div class="row">
          ${o.map((g,w)=>m[w]?p`
            <div class="side-bound" data-side=${w}>${g}: ${Q(d[w])?"follows an entity":"a template"}</div>`:p`
            <div class=${u?"bindable":""}>
              <ha-selector .hass=${this.hass} .selector=${{number:{mode:"box",step:"any"}}} .value=${d[w]} .label=${g} .required=${false}
                @value-changed=${A=>{A.stopPropagation(),h(w,A.detail.value)}}>
              </ha-selector>
              ${u?p`
                <ha-icon-button class="bind" data-key=${`${e}-${w}-bind`} .label=${`${g}: follow an entity`} title=${`${g}: follow an entity`}
                  @click=${()=>h(w,{entity:""})}>
                  <ha-icon icon="mdi:link-variant"></ha-icon>
                </ha-icon-button>`:_}
            </div>`)}
        </div>
        ${n?p`<div class="hint">${n}${r==="numberOrTuple"?" Fill only the first box for one number.":""}${u?" Each side can follow an entity of its own (its link button).":""}</div>`:_}
        ${u?o.map((g,w)=>{if(!m[w])return _;const A=c(j=>{var k,O;return h(w,j===void 0?Number((O=(k=d[w])==null?void 0:k.output)==null?void 0:O[0])||0:j)},"put");return Q(d[w])?this._binding(`${e}~${w}`,u,"number",d[w],`${s} ${g}`,"",A):this._templateField(`${e}~${w}`,d[w],`${s} ${g}`,A)}):_}
      </div>`}_pointRef(e,t,a,s){const n=Array.isArray(a),r=[{value:"",label:"(None)"},...this.pointIds.map(l=>({value:l,label:l})),{value:rt,label:"Coordinates [x, y, z]"}];return p`
      <div class="full">
        <ha-selector .hass=${this.hass} .selector=${{select:{mode:"dropdown",options:r,custom_value:true}}}
          .value=${n?rt:a??""} .label=${e} .helper=${t} .required=${false}
          @value-changed=${l=>{l.stopPropagation();const o=l.detail.value;s(o===rt?n?a:[0,0,0]:o||void 0)}}>
        </ha-selector>
        ${n?p`
          <div class="row">
            ${["x","y","z"].map((l,o)=>p`
              <ha-selector .hass=${this.hass} .selector=${{number:{mode:"box",step:"any"}}} .value=${a[o]} .label=${l} .required=${false}
                @value-changed=${d=>{d.stopPropagation();const u=[...a];u[o]=V(d.detail.value)??0,s(u)}}>
              </ha-selector>`)}
          </div>`:_}
      </div>`}_pointList(e,t,a,s){const n=Array.isArray(s)?s:[],r=c(l=>this._set(e,l),"set");return p`
      <div class="full" data-key=${e}>
        <span class="field-label">${t}</span>
        ${n.map((l,o)=>p`
          <div class="list-item">
            ${this._pointRef(`${o+1}`,"",l,d=>r(n.map((u,y)=>y===o?d:u).filter(u=>!Pe(u))))}
            <ha-icon-button .label=${"Remove"} @click=${()=>r(n.filter((d,u)=>u!==o))}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
          </div>`)}
        <div class="list-actions">
          <ha-button appearance="plain" size="s" @click=${()=>r([...n,this.pointIds[0]??[0,0,0]])}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add point
          </ha-button>
        </div>
        ${a?p`<div class="hint">${a}</div>`:_}
      </div>`}_nested(e,t){var y,h;const a=ue(t,e),s=this._get(e),n=Ae(e),r=Ge(t.description);if(a==="object")return p`
        <lcards-form-section data-key=${e} header=${n} description=${r} secondary=${re(s).length?"follows an entity":""}
          icon=${ie(e,a)} nested outlined ?expanded=${re(s).length>0}>
          ${this._sub(t.properties,I(s)?s:{},m=>this._set(e,m))}
        </lcards-form-section>`;if(a==="textDefault"){const m=Ct({hass:this.hass,schema:t,value:I(s)?s:{},onChange:c(f=>this._set(e,f),"onChange")});return p`
        <lcards-form-section data-key=${e} header=${n} description=${r} icon=${ie(e,a)} nested outlined
          ?expanded=${I(s)&&Object.keys(s).length>0}>
          <lcards-text-field-editor .editor=${m} .config=${m.config} basePath="default"></lcards-text-field-editor>
        </lcards-form-section>`}if(a==="boolOrObject"){const m=ut(t),f=s===true||I(s);return p`
        <lcards-form-section data-key=${e} header=${n} description=${r} secondary=${f?"":"off"} icon=${ie(e,a)} nested outlined ?expanded=${f}>
          <ha-switch slot="header-icons" data-key=${`${e}-on`} .checked=${f} title=${f?`Turn ${n.toLowerCase()} off`:`Turn ${n.toLowerCase()} on`}
            @click=${b=>b.stopPropagation()}
            @change=${b=>this._set(e,b.target.checked?true:void 0)}>
          </ha-switch>
          ${f?this._sub(m.properties,I(s)?s:{},b=>this._set(e,Pe(b)?true:b)):p`<div class="hint">Off. Turn it on with the switch to set it up.</div>`}
        </lcards-form-section>`}if(a==="valueOrObject"){const m=ut(t),f=Za(t),b=I(s)?s:s===void 0?{}:{[f]:s},g=c(w=>this._set(e,Pe(w)?void 0:I(w)&&Object.keys(w).length===1&&w[f]!==void 0?w[f]:w),"set");return p`
        <lcards-form-section data-key=${e} header=${n} description=${r} icon=${ie(e,a)} nested outlined ?expanded=${s!==void 0}>
          ${this._sub(m.properties,b,g)}
        </lcards-form-section>`}const l=Array.isArray(s)?s:[],o=t.items,d=Array.isArray(o.required)&&o.required.includes("type")&&Array.isArray((h=(y=o.properties)==null?void 0:y.type)==null?void 0:h.enum)?"type":null,u=c(m=>this._set(e,m),"set");return p`
      <lcards-form-section data-key=${e} header=${n} description=${r} secondary=${l.length?`${l.length}`:""} icon=${ie(e,a)} nested outlined ?expanded=${l.length>0}>
        ${l.map((m,f)=>p`
          <lcards-form-section header=${`${f+1}${d&&(m!=null&&m[d])?` · ${m[d]}`:""}`}
            secondary=${re(m).length?"follows an entity":""} icon=${ie(e,"item")} nested outlined ?expanded=${re(m).length>0}>
            <ha-icon-button slot="header-icons" .label=${"Move up"} ?disabled=${f===0}
              @click=${b=>{b.stopPropagation();const g=[...l];[g[f-1],g[f]]=[g[f],g[f-1]],u(g)}}>
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button slot="header-icons" .label=${"Remove"}
              @click=${b=>{b.stopPropagation(),u(l.filter((g,w)=>w!==f))}}>
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
            ${this._sub(o.properties,I(m)?m:{},b=>u(l.map((g,w)=>w===f?b:g)))}
          </lcards-form-section>`)}
        <div class="list-actions">
          <ha-button appearance="plain" size="s"
            @click=${()=>u([...l,d?{[d]:o.properties.type.enum[0]}:{}])}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add
          </ha-button>
        </div>
      </lcards-form-section>`}_sub(e,t,a){return p`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${e} .value=${t} .pointIds=${this.pointIds}
        .units=${this.units} .systemIds=${this.systemIds}
        @form-changed=${s=>{s.stopPropagation(),a(s.detail.value)}}>
      </lcards-astro-schema-form>`}_yaml(e,t){const a=this._get(e),s=this._open.has(e)||false;return p`
      <lcards-form-section data-key=${e} header=${Ae(e)} description=${Ge(t.description)}
        secondary=${a===void 0?"":"set"} icon="mdi:code-braces" nested outlined ?expanded=${s}
        @expanded-changed=${n=>{const r=new Set(this._open);n.detail.expanded?r.add(e):r.delete(e),this._open=r}}>
        ${s?p`
          <lcards-yaml-editor .hass=${this.hass} .schema=${t} .value=${a===void 0?"":Yi(a)}
            @value-changed=${n=>{n.stopPropagation();const r=String(n.detail.value??"").trim();if(!r)return this._set(e,void 0);try{this._set(e,Na(r))}catch{}}}>
          </lcards-yaml-editor>`:_}
      </lcards-form-section>`}};c(It,"LCARdSAstroSchemaForm");let $t=It;customElements.get("lcards-astro-schema-form")||customElements.define("lcards-astro-schema-form",$t);const J={xyz:{label:"x, y, z",inputs:["x","y","z"],pick:true,value:[0,0,0]},polar:{label:"Distance and bearing",inputs:["Distance","Bearing (°)"],pick:true,value:[0,0]},latlon:{label:"Latitude and longitude (a sphere)",inputs:["Latitude (°)","Longitude (°)"],host:"sphere",pick:true,value:[0,0]},altaz:{label:"Azimuth and altitude (a dome)",inputs:["Azimuth (°)","Altitude (°)"],host:"dome",pick:true,value:[0,30]},sky:{label:"Sun or moon (a dome)",host:"dome",value:"sun"},body:{label:"A real Solar System body (scene date)",value:"earth"},satellite:{label:"A real Earth satellite (an Earth sphere)",host:"sphere",value:"iss"},at:{label:"At another point",value:""},cell:{label:"Sector map cell (a plane grid)",host:"plane",pick:true,value:""},part:{label:"A part of a model",host:"model",value:""}},dr=[{value:"tap",label:"On tap (opens with a tap on the point)"},{value:"always",label:"Always"}],Ci=c(i=>i==="moon"?"Moon (Luna)":i.charAt(0).toUpperCase()+i.slice(1),"bodyLabel"),hr=["polar","latlon","altaz","sky"],ot=c(i=>Object.fromEntries(Object.entries(i).filter(([e,t])=>t!=null&&t!==""&&(!(typeof t=="object"&&!Array.isArray(t)&&Object.keys(t).length===0)||Tt.includes(e)))),"prune"),lt=c(i=>(i==null?void 0:i.part)!==void 0?"part":Tt.find(e=>(i==null?void 0:i[e])!==void 0)??null,"formOf"),ur=c(i=>{if((i==null?void 0:i.type)==="sphere")return"sphere";if((i==null?void 0:i.type)==="model")return"model";if((i==null?void 0:i.type)!=="grid")return null;const e=i.shape??"plane";return["dome","sphere","plane"].includes(e)?e:null},"hostKind"),Ii=c((i,e)=>{var a;const t={...i};for(const s of Tt)delete t[s];return delete t.part,delete t.center,delete t.heights,t[e]=structuredClone(((a=J[e])==null?void 0:a.value)??null),t},"withForm"),pr=c(i=>{var t,a,s,n,r,l,o,d;const e=typeof(i==null?void 0:i.src)=="string"?i.src:"";if(!e.startsWith("builtin:"))return null;try{const u=(d=(o=(l=(r=(n=(s=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.assetManager)==null?void 0:s.getRegistry)==null?void 0:n.call(s,"model"))==null?void 0:r.assets)==null?void 0:l.get(e.slice(8)))==null?void 0:o.metadata)==null?void 0:d.parts;return Array.isArray(u)?u:null}catch{return null}},"builtinParts");let mr=0;const fr=Z.properties.points.items.properties,yr=[{header:"Visibility and distance",icon:"mdi:map-marker-distance",description:"When the label and marker show",keys:["visible","opacity","fade","min_distance","max_distance","hide_in_systems","look","below_horizon"]},{header:"Label placement",icon:"mdi:layers-outline",description:"Which label wins when two overlap, and standing off a model at the point",keys:["priority","overlap","leader"]},{header:"Actions and tags",icon:"mdi:gesture-tap",description:"Tap and hold, the view a fly-to lands on, and tags for rules",keys:["tap_action","hold_action","view","tags"]}];function br(i){if(!i||typeof i!="object")return i||void 0;const e=Object.fromEntries(Object.entries(i).filter(([,a])=>a!=null&&a!=="")),t=Object.keys(e);if(t.length)return t.length===1&&t[0]==="default"?e.default:e}c(br,"colorOf");function Mi(i,e,t){const a=Array.isArray(i)?[...i]:[0,0];return a[e]=t??0,a[0]||a[1]?a.map(s=>s??0):void 0}c(Mi,"offsetOf");const Mt=class Mt2 extends _e{static get properties(){return{hass:{type:Object},config:{type:Object},preview:{attribute:false},takenIds:{attribute:false},selected:{type:String},_expanded:{type:Number,state:true},_picking:{type:String,state:true},_parts:{type:Object,state:true}}}static get styles(){return ce`
      :host { display: block; }
      .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--ha-space-2); }
      .header h3 { margin: 0; }
      .point { margin-bottom: var(--ha-space-2); }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-2); }
      .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--ha-space-2); }
      .full { grid-column: 1 / -1; }
      .pick-row { display: flex; align-items: center; gap: var(--ha-space-2); grid-column: 1 / -1; }
      .hint { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); }
      .empty { padding: var(--ha-space-4); text-align: center; color: var(--secondary-text-color); }
      .card-actions { display: flex; justify-content: flex-end; }
      .card-editor-host { margin-top: var(--ha-space-2); }
    `}constructor(){super(),this.hass=null,this.config={},this._expanded=-1,this.preview=null,this.takenIds=void 0,this.selected=null,this._picking="",this._pickSeq=0,this._parts={},this._partsAsked=new Set,this._partsTimers=[],this._pickerDialog=null}willUpdate(e){if(e.has("selected")&&this.selected){const t=this._points.findIndex(a=>String(a==null?void 0:a.id)===this.selected);t>=0&&t!==this._expanded&&(this._expanded=t,this.updateComplete.then(()=>{var a;return(a=this.renderRoot.querySelector(`[data-index="${t}"]`))==null?void 0:a.scrollIntoView({block:"nearest",behavior:"smooth"})}))}}_toggle(e){var a;this._expanded=this._expanded===e?-1:e;const t=this._expanded>=0?String(((a=this._points[this._expanded])==null?void 0:a.id)??""):null;dt(this,"point-selected",{id:t})}disconnectedCallback(){var e;this._partsTimers.forEach(clearTimeout),this._partsTimers=[],(e=this._pickerDialog)==null||e.remove(),this._cancelPick(),super.disconnectedCallback()}get _points(){var e;return Array.isArray((e=this.config)==null?void 0:e.points)?this.config.points:[]}_commit(e){dt(this,"points-changed",{value:e})}_patch(e,t){this._commit(this._points.map((a,s)=>s===e?ot({...a,...t}):a))}_replace(e,t){this._commit(this._points.map((a,s)=>s===e?ot(t):a))}_freshId(e="point"){const t=new Set([...this._points.map(s=>String(s==null?void 0:s.id)),...this.takenIds??[]]);let a=1;for(;t.has(`${e}${a}`);)a++;return`${e}${a}`}_add(){const e=[...this._points,{id:this._freshId(),xyz:[0,0,0],marker:"dot",label:"NEW POINT"}];this._expanded=e.length-1,this._commit(e)}_duplicate(e){const t=this._points[e],a={...structuredClone(t),id:this._freshId(`${(t==null?void 0:t.id)??"point"}_`)},s=[...this._points.slice(0,e+1),a,...this._points.slice(e+1)];this._expanded=e+1,this._commit(s)}_remove(e){this._commit(this._points.filter((t,a)=>a!==e))}_move(e,t){const a=[...this._points],s=e+t;s<0||s>=a.length||([a[e],a[s]]=[a[s],a[e]],this._expanded=s,this._commit(a))}async _pick(e){var o,d,u;const t=lt(e),a=t?e[t]:void 0;if(!this.preview||!t||!((o=J[t])!=null&&o.pick)||a&&typeof a=="object"&&!Array.isArray(a))return;this._cancelPick();const s=String(e.id),n=++mr;this._pickSeq=n,this._picking=s;const r=await this.preview.pickPosition({pointId:s,form:t,object:e.object,label:e.label??((u=(d=e.text)==null?void 0:d.label)==null?void 0:u.content)??s});if(this._pickSeq!==n||(this._picking="",r==null))return;const l=this._points.findIndex(y=>String(y==null?void 0:y.id)===s);l<0||this._replace(l,{...Ii(this._points[l],t),[t]:r})}_cancelPick(){var e;this._picking&&(this._pickSeq=0,this._picking="",(e=this.preview)==null||e.cancelPick())}_partsFor(e){var s;const t=(Array.isArray((s=this.config)==null?void 0:s.objects)?this.config.objects:[]).find(n=>(n==null?void 0:n.id)===e);if((t==null?void 0:t.type)!=="model")return null;const a=pr(t)??this._parts[e];return a||(this._partsAsked.has(e)||(this._partsAsked.add(e),this._askParts(e,0)),null)}_askParts(e,t){var s,n;const a=(n=(s=this.preview)==null?void 0:s.partNames)==null?void 0:n.call(s,e);if(Array.isArray(a)){this._parts={...this._parts,[e]:a};return}t>=8||this._partsTimers.push(setTimeout(()=>{this.isConnected&&!this._parts[e]&&this._askParts(e,t+1)},1500))}_modelIds(){var e;return(Array.isArray((e=this.config)==null?void 0:e.objects)?this.config.objects:[]).filter(t=>(t==null?void 0:t.type)==="model"&&typeof t.id=="string").map(t=>t.id)}_setForm(e,t,a){var n;const s=Ii(t,a);if(a==="part"){const r=this._modelIds(),l=r.includes(t.object)?t.object:r[0];s.object=l,s.part=l&&((n=this._partsFor(l))==null?void 0:n[0])||"part"}this._replace(e,s)}_select(e,t,a,s,n={}){return p`
      <ha-selector .hass=${this.hass} .required=${false} .label=${e} .value=${t??""}
        .selector=${{select:{mode:"dropdown",options:a,...n}}}
        @value-changed=${r=>s(r.detail.value)}>
      </ha-selector>
    `}_text(e,t,a,s=""){return p`
      <ha-selector .hass=${this.hass} .required=${false} .label=${e} .value=${t??""} .helper=${s}
        .selector=${{text:{}}}
        @value-changed=${n=>a(n.detail.value===""?void 0:n.detail.value)}>
      </ha-selector>
    `}_number(e,t,a,s={}){return p`
      <ha-selector .hass=${this.hass} .required=${false} .label=${e} .value=${t??""}
        .selector=${{number:{mode:"box",step:"any",...s}}}
        @value-changed=${n=>{const r=n.detail.value;a(r===""||r===null||r===void 0||!Number.isFinite(Number(r))?void 0:Number(r))}}>
      </ha-selector>
    `}_objectOptions(e){var a;return(Array.isArray((a=this.config)==null?void 0:a.objects)?this.config.objects:[]).filter(s=>s&&typeof s.id=="string"&&(!e||ur(s)===e)).map(s=>({value:s.id,label:`${s.id} (${s.type}${s.shape?` ${s.shape}`:""})`}))}_renderPlacement(e,t){const a=lt(e),s=a?J[a]:null,n=a?e[a]:void 0,r=n&&typeof n=="object"&&!Array.isArray(n),l=this._objectOptions((s==null?void 0:s.host)??null),o=this._picking===String(e.id);return p`
      <div class="grid">
        <div class="full">
          ${this._select("Placed by",a??"",Object.entries(J).filter(([d])=>d!=="part"||a==="part"||this._modelIds().length).map(([d,u])=>({value:d,label:u.label})),d=>d&&d!==a&&this._setForm(t,e,d))}
        </div>
        ${r?p`<div class="full hint">Position from ${n.entity??"the point's entity"} (edit the binding in YAML).</div>`:_}
        ${!r&&(s!=null&&s.inputs)?p`
          <div class="full ${s.inputs.length===3?"grid3":"grid"}">
            ${s.inputs.map((d,u)=>this._number(d,Array.isArray(n)?n[u]:void 0,y=>{const h=Array.isArray(n)?[...n]:[...J[a].value];h[u]=y??0,this._patch(t,{[a]:h})}))}
          </div>`:_}
        ${a==="sky"?this._select("Body",n,va.map(d=>({value:d,label:d})),d=>this._patch(t,{sky:d})):_}
        ${a==="body"?p`
          ${this._select("Body",n,Kt.map(d=>({value:d,label:Ci(d)})),d=>this._patch(t,{body:d}))}
          ${this._select("Measured from",e.center??"",[{value:"",label:"(The Sun)"},...Kt.filter(d=>d!=="sun").map(d=>({value:d,label:Ci(d)}))],d=>this._patch(t,{center:d||void 0}))}
          <div class="full hint">Where it is at the scene date (the card's clock), in the scene's or system's units (set units: km or au).</div>`:_}
        ${a==="satellite"?p`
          ${this._select("Satellite",String(n??""),$a.map(d=>({value:d,label:d})),d=>d&&this._patch(t,{satellite:/^\d+$/.test(d)?Number(d):d}),{custom_value:true})}
          ${this._select("Heights",e.heights??"real",ka.map(d=>({value:d,label:d==="real"?"Real (to scale)":"Diagram (low orbits lifted)"})),d=>this._patch(t,{heights:d==="real"?void 0:d}))}
          <div class="full hint">Where it is at the scene date, round an Earth sphere (body: earth turns it as Earth turns). A built-in name or a NORAD number; give the point an entity with latitude and longitude for live fixes.</div>`:_}
        ${a==="at"?this._select("Point",n,this._points.filter(d=>d!==e&&(d==null?void 0:d.id)!==void 0).map(d=>({value:String(d.id),label:String(d.id)})),d=>this._patch(t,{at:d})):_}
        ${a==="cell"?this._text("Cell",n,d=>this._patch(t,{cell:d}),"Such as AF3"):_}
        ${a==="part"?this._renderPart(e,t):_}
        ${a!=="at"&&a!=="body"?this._select(s!=null&&s.host?"On object":"On object (optional)",e.object??"",[{value:"",label:"(None)"},...l],d=>this._patch(t,{object:d||void 0}),{custom_value:true}):_}
        ${a&&hr.includes(a)?this._number("Height above (alt)",e.alt,d=>this._patch(t,{alt:d})):_}
        ${s!=null&&s.pick&&!r?p`
          <div class="pick-row">
            <ha-button appearance=${o?"filled":"outlined"} @click=${()=>o?this._cancelPick():this._pick(e)}>
              <ha-icon icon=${o?"mdi:close":"mdi:crosshairs-gps"} slot="start"></ha-icon>
              ${o?"Cancel pick":"Pick on preview"}
            </ha-button>
            <span class="hint">${o?"Tap the preview where the point goes.":"Then tap the preview where the point goes."}</span>
          </div>`:_}
      </div>
    `}_renderPart(e,t){const a=e.object?this._partsFor(e.object):null,s=Array.isArray(e.xyz)?e.xyz:void 0;return p`
      <div class="full">
        ${a?this._select("Part",e.part,a.map(n=>({value:n,label:n})),n=>n&&this._patch(t,{part:n}),{custom_value:true}):this._text("Part",e.part,n=>n&&this._patch(t,{part:n}),"The name of a node in the model file (the list fills in when the preview has loaded it)")}
      </div>
      <div class="full grid3">
        ${["Offset x","Offset y","Offset z"].map((n,r)=>this._number(n,s==null?void 0:s[r],l=>{const o=s?[...s]:[0,0,0];o[r]=l??0,this._patch(t,{xyz:o.every(d=>d===0)?void 0:o})}))}
      </div>
      <div class="full hint">The offset is in the part's own coordinates (the model file's units).</div>
    `}_childLovelace(){return{views:[{title:"Home",path:"home",cards:[]}]}}async _openCardPicker(e){var s,n;if(!customElements.get("hui-card-picker")){xa({title:"Card picker not ready",message:'Home Assistant has not loaded its card picker yet. On any dashboard, select "Add card" once (you can cancel it), then come back and try again.'});return}(s=this._pickerDialog)==null||s.remove();const t=document.createElement("ha-dialog");t.headerTitle="Select a card",this._pickerDialog=t,Ki(t,this),t.open=true,await t.updateComplete;const a=document.createElement("hui-card-picker");a.hass=this.hass,a.lovelace=this._childLovelace(),a.style.cssText="padding: var(--ha-space-6); display: block;",t.appendChild(a),await new Promise(r=>setTimeout(r,80)),(n=a.requestUpdate)==null||n.call(a),a.addEventListener("config-changed",r=>{var o;r.stopPropagation();const l=(o=r.detail)==null?void 0:o.config;t.open=false,l&&e(JSON.parse(JSON.stringify(l)))}),Gi(t,r=>{r.stopPropagation(),t.remove(),this._pickerDialog===t&&(this._pickerDialog=null)})}_chooseCard(e){this._openCardPicker(t=>{const a=this._points[e];a&&this._patch(e,{card:{...a.card??{},card:t}})})}_onCardConfigChanged(e,t){var n,r;t.stopPropagation();const a=((n=t.detail)==null?void 0:n.config)??((r=t.detail)==null?void 0:r.value),s=this._points[e];!(a!=null&&a.type)||!(s!=null&&s.card)||this._patch(e,{card:{...s.card,card:a}})}_renderCard(e,t){var r,l;const a=e.card&&typeof e.card=="object"?e.card:null,s=c(o=>this._patch(t,{card:ot({...a,...o})}),"patchPin");if(!(a!=null&&a.card))return p`
        <div class="pick-row">
          <ha-button appearance="outlined" @click=${()=>this._chooseCard(t)}>
            <ha-icon icon="mdi:card-plus-outline" slot="start"></ha-icon>
            Add card
          </ha-button>
          <span class="hint">Any Lovelace card, shown beside the point.</span>
        </div>
      `;const n=String(a.card.type??"card").replace("custom:","");return p`
      <div class="grid">
        ${this._select("Show",a.show??"tap",dr,o=>s({show:o==="tap"?void 0:o}))}
        <lcards-position-picker .value=${a.position??"center-right"} .label=${"Position"} .helper=${"Where the card sits round the point"}
          @value-changed=${o=>{o.stopPropagation(),s({position:o.detail.value==="center-right"?void 0:o.detail.value})}}>
        </lcards-position-picker>
        ${this._number("Width (px)",a.width,o=>s({width:o}),{min:80,max:1200})}
        ${this._number("Height (px)",a.height,o=>s({height:o}),{min:40})}
        ${this._number("Offset x (px)",(r=a.offset)==null?void 0:r[0],o=>s({offset:Mi(a.offset,0,o)}))}
        ${this._number("Offset y (px)",(l=a.offset)==null?void 0:l[1],o=>s({offset:Mi(a.offset,1,o)}))}
        <ha-selector .hass=${this.hass} .label=${"Leader line"} .value=${a.leader===true}
          .helper=${"A thin line from the point to the card, in the point's colour"}
          .selector=${{boolean:{}}}
          @value-changed=${o=>s({leader:o.detail.value||void 0})}>
        </ha-selector>
        <div class="card-actions">
          <ha-button appearance="plain" @click=${()=>this._chooseCard(t)}>
            <ha-icon icon="mdi:swap-horizontal" slot="start"></ha-icon>Change card
          </ha-button>
          <ha-button variant="danger" appearance="plain" @click=${()=>this._patch(t,{card:void 0})}>
            <ha-icon icon="mdi:delete-outline" slot="start"></ha-icon>Remove card
          </ha-button>
        </div>
      </div>
      ${customElements.get("hui-card-element-editor")?p`
          <div class="card-editor-host">
            <hui-card-element-editor
              .hass=${this.hass}
              .lovelace=${this._childLovelace()}
              .value=${a.card}
              @config-changed=${o=>this._onCardConfigChanged(t,o)}>
            </hui-card-element-editor>
          </div>`:p`<lcards-message type="info">Edit the ${n} card in YAML (Home Assistant's card editor is not loaded here).</lcards-message>`}
    `}_renderLabel(e,t){var r,l;const a=Object.keys(((l=(r=this.config)==null?void 0:r.labels)==null?void 0:l.styles)??{}),s=Ct({hass:this.hass,schema:Z.properties.points.items,value:e,onChange:c(o=>this._patch(t,{text:o.text}),"onChange")}),n=e.color;return p`
      <div class="grid">
        <div class="full">${this._text("Label",e.label,o=>this._patch(t,{label:o}),"Templates work here; leave empty for a marker only")}</div>
        ${this._select("Style",e.style??"",[{value:"",label:"(Default: minor)"},...[...Sa,...a].map(o=>({value:o,label:o}))],o=>this._patch(t,{style:o||void 0}))}
        ${this._select("Marker",e.marker??"",[{value:"",label:"(None)"},...Aa.filter(o=>o!=="none").map(o=>({value:o,label:o}))],o=>this._patch(t,{marker:o||void 0}))}
        <ha-selector class="full" .hass=${this.hass} .required=${false} .label=${"Entity"} .value=${e.entity??""}
          .helper=${"Label templates read it; state colours and more-info follow it"}
          .selector=${{entity:{}}}
          @value-changed=${o=>this._patch(t,{entity:o.detail.value||void 0})}>
        </ha-selector>
        <div class="full">
          ${n&&typeof n=="object"||e.entity?p`<lcards-color-section-v2
                .editor=${{hass:this.hass,config:{entity:e.entity},_getConfigValue:c(()=>n&&typeof n=="object"?n:n?{default:n}:{},"_getConfigValue"),_setConfigValue:c((o,d)=>this._patch(t,{color:br(d)}),"_setConfigValue")}}
                basePath="color" .entityId=${e.entity||""}
                header="Colour" description="The marker, and the default for the label text. By the point's entity state, else Default."
                .suggestedStates=${["default","active","inactive","unavailable"]}
                ?allowCustomStates=${true} ?expanded=${true}>
              </lcards-color-section-v2>`:p`<lcards-color-picker .hass=${this.hass} .value=${n??""} .showPreview=${true}
                @value-changed=${o=>this._patch(t,{color:o.detail.value||void 0})}>
              </lcards-color-picker>`}
        </div>
      </div>
      <lcards-form-section header="Label text" description="Position round the point, font, size, colours and background (over its style)" icon="mdi:format-text" nested outlined>
        <lcards-text-field-editor .editor=${s} .config=${s.config} basePath="text.label" .omit=${["content"]}
          .suggestedStates=${["default","active","inactive","unavailable","selected"]}>
        </lcards-text-field-editor>
      </lcards-form-section>
    `}_renderPoint(e,t,a){var o,d;const s=lt(e),n=String((e==null?void 0:e.id)??`Point ${t+1}`),r=s?e[s]:void 0,l=!!(s&&((o=J[s])!=null&&o.pick)&&!(r&&typeof r=="object"&&!Array.isArray(r)));return p`
      <lcards-form-section class="point" header=${n} data-index=${t}
        secondary=${[e.label,s?(d=J[s])==null?void 0:d.label:"no position"].filter(Boolean).join(" · ")}
        icon="mdi:map-marker"
        ?expanded=${this._expanded===t}
        @expanded-changed=${u=>{u.detail.expanded!==(this._expanded===t)&&this._toggle(t)}}
        outlined>
        ${l?p`
          <ha-icon-button slot="header-icons" .label=${"Pick on preview"}
            @click=${u=>{u.stopPropagation(),this._pick(e)}}>
            <ha-icon icon="mdi:crosshairs-gps"></ha-icon>
          </ha-icon-button>`:_}
        <ha-icon-button slot="header-icons" .label=${"Move up"} ?disabled=${t===0}
          @click=${u=>{u.stopPropagation(),this._move(t,-1)}}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Move down"} ?disabled=${t===a-1}
          @click=${u=>{u.stopPropagation(),this._move(t,1)}}>
          <ha-icon icon="mdi:arrow-down"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Duplicate"}
          @click=${u=>{u.stopPropagation(),this._duplicate(t)}}>
          <ha-icon icon="mdi:content-copy"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Remove point"}
          @click=${u=>{u.stopPropagation(),this._remove(t)}}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>

        ${s?_:p`<lcards-message type="warning">This point has no position: choose how it is placed.</lcards-message>`}
        <div class="grid">
          <div class="full">${this._text("Id",e.id,u=>u&&this._patch(t,{id:u}),"Paths, views and rules refer to it by this name")}</div>
        </div>
        <lcards-form-section header="Position" icon="mdi:axis-arrow" nested outlined ?expanded=${true}>
          ${this._renderPlacement(e,t)}
        </lcards-form-section>
        <lcards-form-section header="Label and marker" icon="mdi:label-outline" nested outlined ?expanded=${true}>
          ${this._renderLabel(e,t)}
        </lcards-form-section>
        <lcards-form-section header="Card" description="A Lovelace card pinned to the point" icon="mdi:card-text-outline" nested outlined
          ?expanded=${!!e.card}>
          ${this._renderCard(e,t)}
        </lcards-form-section>
        ${yr.map(u=>{var y;return p`
          <lcards-form-section header=${u.header} description=${u.description} icon=${u.icon} nested outlined
            ?expanded=${u.keys.some(h=>e[h]!==void 0)}>
            <lcards-astro-schema-form .hass=${this.hass} .schema=${fr} .keys=${u.keys} .value=${e}
              .pointIds=${this._points.map(h=>h==null?void 0:h.id).filter(Boolean)} .units=${((y=this.config)==null?void 0:y.units)??""}
              @form-changed=${h=>{h.stopPropagation(),this._replace(t,h.detail.value)}}>
            </lcards-astro-schema-form>
          </lcards-form-section>`})}
      </lcards-form-section>
    `}render(){const e=this._points;return p`
      <div class="header">
        <h3>Points</h3>
        <ha-button @click=${this._add}>
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add point
        </ha-button>
      </div>
      ${e.length?e.map((t,a)=>this._renderPoint(t,a,e.length)):p`<div class="empty">No points yet. Add one to label a place on the scene.</div>`}
    `}};c(Mt,"LCARdSAstroPointsEditor");let kt=Mt;customElements.get("lcards-astro-points-editor")||customElements.define("lcards-astro-points-editor",kt);const Li=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$1"),Ri=["default","active","inactive","unavailable","selected"];function Di(i,e){const t=[];return i.font_size!==void 0&&t.push(typeof i.font_size=="number"?`${i.font_size} px`:String(i.font_size)),i.priority!==void 0&&t.push(`priority ${i.priority}`),e&&t.push("changed"),t.join(" · ")}c(Di,"styleSummary");const Lt=class Lt2 extends _e{static get properties(){return{hass:{attribute:false},value:{attribute:false},_newName:{state:true}}}constructor(){super(),this.hass=null,this.value={},this._newName=""}static get styles(){return ce`
      :host { display: block; font-family: var(--ha-font-family-body); }
      .group-title { font-weight: var(--ha-font-weight-medium); margin: var(--ha-space-4) 0 var(--ha-space-1); }
      .hint { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-bottom: var(--ha-space-2); }
      .switches { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-4); margin-top: var(--ha-space-4); }
      .add { display: flex; gap: var(--ha-space-2); align-items: center; margin-top: var(--ha-space-2); }
      .add ha-input { flex: 1; }
      lcards-form-section { display: block; margin-bottom: var(--ha-space-2); }
    `}_emit(e){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e}}))}render(){const e=Li(this.value)?this.value:{},t=Ct({hass:this.hass,schema:Z.properties.labels,value:e,onChange:c(r=>this._emit(r),"onChange")}),a=Li(e.styles)?e.styles:{},s=Object.keys(te),n=Object.keys(a).filter(r=>!s.includes(r));return p`
      <lcards-form-section data-key="default" header="Every label" icon="mdi:format-text" outlined nested
        description="Text settings every label on the card starts from (a font, letter spacing, a colour), under the styles.">
        <lcards-text-field-editor .editor=${t} .config=${t.config} basePath="default" .suggestedStates=${Ri}>
        </lcards-text-field-editor>
      </lcards-form-section>

      <div class="group-title">Label styles</div>
      <div class="hint">A point picks a style (its style key); a style sets the size, colour and priority. Change a built-in one here, or add your own.</div>
      ${s.map(r=>this._style(t,r,{...te[r],...a[r]??{}},a[r]!==void 0,true))}
      ${n.map(r=>this._style(t,r,a[r],false,false))}
      <div class="add">
        <ha-input .label=${"New style name"} .value=${this._newName}
          @input=${r=>{this._newName=r.target.value}}></ha-input>
        <ha-button appearance="plain" data-key="add-style" ?disabled=${!this._validName(this._newName,a)}
          @click=${()=>this._addStyle(t,a)}>
          <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add style
        </ha-button>
      </div>

      <div class="switches">
        ${M.renderField(t,"overlap",{label:"Labels may overlap"})}
        ${M.renderField(t,"snap",{label:"Pixel snap"})}
      </div>
    `}_style(e,t,a,s,n){return p`
      <lcards-form-section data-style=${t} header=${t} secondary=${Di(a,s)}
        icon=${n?"mdi:format-size":"mdi:format-letter-case"} outlined nested>
        ${n&&s?p`
          <ha-icon-button slot="header-icons" .label=${"Back to the built-in style"} title="Back to the built-in style" data-key=${`reset-${t}`}
            @click=${r=>{r.stopPropagation(),e._setConfigValue(`styles.${t}`,void 0)}}>
            <ha-icon icon="mdi:restore"></ha-icon>
          </ha-icon-button>`:_}
        ${n?_:p`
          <ha-icon-button slot="header-icons" .label=${"Delete style"} title="Delete style" data-key=${`delete-${t}`}
            @click=${r=>{r.stopPropagation(),e._setConfigValue(`styles.${t}`,void 0)}}>
            <ha-icon icon="mdi:delete"></ha-icon>
          </ha-icon-button>`}
        ${n?p`<div class="hint">Built in: ${Di(te[t],false)}. What you set here wins.</div>`:_}
        ${M.renderField(e,`styles.${t}.priority`,{label:"Priority",helper:"Which label wins when two overlap (higher wins)."})}
        ${M.renderField(e,`styles.${t}.overlap`,{label:"Never hidden by another label"})}
        <lcards-text-field-editor .editor=${e} .config=${e.config} basePath=${`styles.${t}`} .suggestedStates=${Ri}>
        </lcards-text-field-editor>
      </lcards-form-section>`}_validName(e,t){const a=String(e??"").trim();return/^[a-z][a-z0-9_]*$/.test(a)&&!(a in te)&&!(a in t)}_addStyle(e,t){const a=this._newName.trim();this._validName(a,t)&&(this._newName="",e._setConfigValue(`styles.${a}`,{font_size:te.minor.font_size,priority:te.minor.priority}))}};c(Lt,"LCARdSAstroLabelsEditor");let xt=Lt;customElements.get("lcards-astro-labels-editor")||customElements.define("lcards-astro-labels-editor",xt);const pe=c(i=>JSON.parse(JSON.stringify(i??{})),"clone"),Ee=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj"),gr=["points","objects","camera","backdrop"];function _r(i){var t,a;if(!ke(i))return true;const e=(a=(t=customElements.get("lcards-astrometrics-card"))==null?void 0:t.getStubConfig)==null?void 0:a.call(t);return!!e&&gr.every(s=>JSON.stringify(i[s])===JSON.stringify(e[s]))}c(_r,"isStarterCard");const Bi=150,wr={"":"mdi:eye-outline",diagram:"mdi:vector-polyline",realistic:"mdi:earth",mixed:"mdi:layers-triple-outline"},vr=5*60*1e3,$r=[{id:"units",header:"Units",icon:"mdi:ruler",hint:"Scene units are your own: every position, size and distance is in them. Name them (km, au, ly) for real data: parts and models then start at their real size, and bodies sit at real distances. In scene units, a part is sized to fit what is already there. Naming the units does not rescale the scene.",parts:[{path:"",keys:["units"]}]},{id:"look",header:"Look",icon:"mdi:eye-outline",hint:"Which objects and points show: the diagram ones, the realistic ones, or both. Each object and point can pick its look. Model scale: models at their real size, or drawn larger when they would be too small to see.",parts:[{path:"",keys:["look","model_scale"]}]},{id:"time",header:"Time",icon:"mdi:clock-outline",hint:"The scene date moves bodies and orbits; the time scale speeds up or slows the decorative motion.",parts:[{path:"clock",keys:["date","rate"]},{path:"",keys:["time_scale"]}]},{id:"warp",header:"Warp",icon:"mdi:rocket-launch-outline",hint:"Stars and dust stream past while the scene is at warp.",parts:[{path:"",keys:["warp","warp_factor"]}]},{id:"space",header:"Space",icon:"mdi:star-four-points-outline",hint:"Part of the 3D scene: stars at infinity turn with the camera; depth dust fills the space round the camera and shows depth on every move.",parts:[{path:"backdrop",keys:["stars","dust"]}]}],kr=[{id:"controls",header:"Controls",icon:"mdi:gesture-swipe",hint:"How dragging, the wheel, pinching and double-taps move the camera.",keys:["controls","drag","pan","zoom_to","wheel","double_tap","zoom_step"]},{id:"buttons",header:"On-card buttons",icon:"mdi:gesture-tap-button",hint:"Pan, zoom, reset and time buttons on the card.",keys:["buttons"]},{id:"flying",header:"Flying",icon:"mdi:airplane",hint:"How the camera flies to a view, point or object.",keys:["fly_duration","ease","follow","warp"]},{id:"turning",header:"Turning",icon:"mdi:rotate-3d-variant",hint:"Turn round the target on its own.",keys:["auto_rotate"]},{id:"limits",header:"Limits",icon:"mdi:arrow-expand-all",hint:"How far the camera may tilt, zoom and wander.",keys:["limits"]}];function ct(i){const e=c((t,a)=>{const s=Array.isArray(t)?t.length:0;return`${s} ${a}${s===1?"":"s"}`},"n");return`${e(i==null?void 0:i.points,"point")}, ${e(i==null?void 0:i.objects,"object")}`}c(ct,"systemCounts");const Rt=class Rt2 extends _e{static get properties(){return{hass:{attribute:false},_workingConfig:{state:true},_activeTab:{state:true},_expandedObject:{state:true},_scope:{state:true},_selectedPoint:{state:true},_addingObject:{state:true},_placing:{state:true},_measuring:{state:true},_quickView:{state:true},_previewLook:{state:true},_held:{state:true},_isolated:{state:true},_status:{state:true},_scaleBar:{state:true},_expandedView:{state:true},_openStarter:{state:true},_starterParams:{state:true},_starterMessage:{state:true},_trying:{state:true},_toolbarExpanded:{state:true},_modelScale:{state:true},_outlineEdit:{state:true},_hasRealModels:{state:true},_historyVersion:{state:true},_viewError:{state:true},_modelExtents:{state:true}}}constructor(){super(),this.hass=null,this._initialConfig={},this._workingConfig={},this._activeTab="objects",this._expandedObject=-1,this._scope=P,this._selectedPoint=null,this._addingObject=false,this._placing=false,this._measuring=false,this._measureA=null,this._measureB=null,this._quickView=-1,this._previewLook=null,this._held=false,this._isolated=null,this._status="",this._scaleBar=null,this._expandedView=null,this._viewError="",this._modelExtents={},this._extentPending=new Set,this._openStarter=null,this._starterParams={},this._starterMessage=null,this._trying=null,this._toolbarExpanded=true,this._history=Ma(),this._historyVersion=0,this._tryTimer=void 0,this._onKey=this._onKey.bind(this),this._previewRef=ja(),this._onPlaceKey=this._onPlaceKey.bind(this),this._previewCard=null,this._outlineEdit=null,this._modelScale="real",this._hasRealModels=false,this._previewTimer=void 0}set config(e){this._initialConfig=e??{}}get config(){return this._workingConfig}connectedCallback(){var e;super.connectedCallback(),this._workingConfig=pe(this._initialConfig),(e=this._workingConfig).type||(e.type="custom:lcards-astrometrics-card"),this._activeTab=_r(this._workingConfig)?"starters":"objects",window.addEventListener("keydown",this._onKey)}disconnectedCallback(){var e,t;super.disconnectedCallback(),clearTimeout(this._previewTimer),clearTimeout(this._tryTimer),window.removeEventListener("keydown",this._onKey),window.removeEventListener("keydown",this._onPlaceKey,true),(t=(e=this._previewCard)==null?void 0:e.attachStudio)==null||t.call(e,null),this._outlineEdit=null}firstUpdated(){this._mountPreview()}updated(e){if(e.has("hass")&&this._previewCard&&(this._previewCard.hass=this.hass),(e.has("_scope")||e.has("_trying")||e.has("_workingConfig"))&&this._updateScaleBar(),this._outlineEdit&&(e.has("_workingConfig")||e.has("_expandedObject")||e.has("_scope")||e.has("_activeTab"))){const t=this._objects[this._expandedObject];this._activeTab!=="objects"||!t||String(t.id)!==this._outlineEdit.id||t.shape!=="prism"?this._endOutline():this._outlineEdit.draw||this._outlineSync(t)}}get _points(){return _t(this._workingConfig,this._scope,"points")}get _objects(){return _t(this._workingConfig,this._scope,"objects")}get _pointIds(){return Pn(this._workingConfig)}get _system(){return he(this._workingConfig,this._scope)}get _units(){const e=this._system;return e?e.units??(e.scale!==void 0?"":this._workingConfig.units??""):this._workingConfig.units??""}get _systemIds(){return(Array.isArray(this._workingConfig.objects)?this._workingConfig.objects:[]).filter(t=>Ee(t)&&t.type==="system"&&t.id!==void 0).map(t=>String(t.id))}_commit(e,{now:t=false,step:a=false}={}){this._history.push(this._workingConfig,e,{step:a}),this._historyVersion++,this._show(e,{now:t})}_show(e,{now:t=false}={}){this._workingConfig=e;const a=jn(e,this._scope);a!==this._scope&&this._openScope(a),clearTimeout(this._previewTimer),t?this._updatePreview():this._previewTimer=setTimeout(()=>this._updatePreview(),Bi)}_undo(){const e=this._trying?null:this._history.undo(this._workingConfig);e&&(this._historyVersion++,this._show(e,{now:true}))}_redo(){const e=this._trying?null:this._history.redo(this._workingConfig);e&&(this._historyVersion++,this._show(e,{now:true}))}_onKey(e){const t=e.key.toLowerCase(),a=t==="f"&&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)&&!e.defaultPrevented&&!e.repeat;if(!a&&(!(e.ctrlKey||e.metaKey)||e.altKey||t!=="z"&&t!=="y"))return;const s=e.composedPath(),n=document.activeElement;if(!(!s.includes(this)&&n&&n!==document.body||s.some(l=>l instanceof HTMLElement&&l.matches('input, textarea, [contenteditable=""], [contenteditable="true"], ha-code-editor, .cm-editor')))){if(e.preventDefault(),a){this._frameSelected();return}e.stopPropagation(),t==="y"||e.shiftKey?this._redo():this._undo()}}_setTop(e,t){const a={...this._workingConfig};t===void 0||Array.isArray(t)&&!t.length&&e!=="points"?delete a[e]:a[e]=t,this._commit(a)}_setList(e,t,a={}){this._commit(Oi(this._workingConfig,this._scope,e,t),a)}_setObjects(e){this._setList("objects",e.length?e:void 0)}_openScope(e,{fly:t=false}={}){e!==this._scope&&(this._trying&&this._discardTry(),this._scope=e,this._expandedObject=-1,this._addingObject=false,this._selectedPoint=null,t&&this._flyToScope())}async _updateScaleBar(){var h,m,f,b,g;const e=await((m=(h=this._previewCard)==null?void 0:h.studioScene)==null?void 0:m.call(h));if(!(e!=null&&e.viewIn))return;const t=!this._trying&&this._system?this._objectIdIn(P,this._scope):void 0,{width:a,px:s}=e.viewIn(t);if(!(a>0)||!(s>0)||!Number.isFinite(a)){this._scaleBar=null;return}const n=a/5,r=Math.floor(Math.log10(n)),l=n/10**r,o=(l>=5?5:l>=2?2:1)*10**r,d=t?this._units:(((f=this._trying)==null?void 0:f.config)??this._workingConfig).units,u=`${o.toLocaleString(void 0,{maximumSignificantDigits:1})} ${d||"units"}`,y=Math.round(o/a*s);(((b=this._scaleBar)==null?void 0:b.px)!==y||((g=this._scaleBar)==null?void 0:g.label)!==u)&&(this._scaleBar={px:y,label:u})}async _flyToScope(){var a,s;const e=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a));if(!e)return;const t=this._system?this._objectIdIn(P,this._scope):void 0;t!==void 0?e.frameObject(t):e.home()}_previewConfig(){var t;let e=pe(((t=this._trying)==null?void 0:t.config)??this._workingConfig);return this._previewLook&&(e.look=this._previewLook),this._isolated&&!this._trying&&(e=In(e,this._isolated)),{...e,height:"100%"}}_mountPreview(){var a;const e=this._previewRef.value;if(!e)return;const t=document.createElement("lcards-astrometrics-card");try{t.setConfig(this._previewConfig())}catch(s){Gt.warn("[AstrometricsStudio] Preview config rejected",s)}t.hass=this.hass,e.replaceChildren(t),this._previewCard=t,this._held=false,this._measuring=false,this._quickView=-1,t.addEventListener("astro-model-scale",s=>{this._modelScale=s.detail.mode,this._hasRealModels=s.detail.hasRealModels}),(a=t.attachStudio)==null||a.call(t,{onView:c(()=>this._updateScaleBar(),"onView"),onSelect:c(s=>this._onSceneSelect(s),"onSelect"),onDrag:c((s,n,r,l,o)=>this._onPointDrag(s,n,r,l,o),"onDrag")})}_updatePreview(){const e=this._previewCard;if(e)try{e.setConfig(this._previewConfig())}catch(t){Gt.warn("[AstrometricsStudio] Preview config rejected",t)}}_onSceneSelect(e){if(!e){this._selectPoint(null),this._activeTab==="objects"&&(this._expandedObject=-1);return}if(e.kind==="point"){const s=tt(this._workingConfig,e.id);s!==null&&this._openScope(s),this._activeTab="points",this._selectPoint(e.id);return}const t=En(this._workingConfig,e.id);if(!t)return;this._openScope(t.scope);const a=t.index;this._activeTab="objects",this._selectObject(a),this.updateComplete.then(()=>{var s;return(s=this.renderRoot.querySelector(`[data-object="${a}"]`))==null?void 0:s.scrollIntoView({block:"nearest",behavior:"smooth"})})}async _selectPoint(e){var a,s;this._selectedPoint=e;const t=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a));t==null||t.highlight(e)}async _selectObject(e){var s,n;this._expandedObject=e,this._selectedPoint=null;const t=this._objects[e],a=await((n=(s=this._previewCard)==null?void 0:s.studioScene)==null?void 0:n.call(s));a==null||a.highlight(t?this._objectId(t,e):null,"object")}_onPointDrag(e,t,a,s,n){const r=Array.isArray(a)?a.join(", "):a;if(!s){this._status=n?`Moving point ${e} (${n} stands at it): ${t} ${r}`:`${e}: ${t} ${r}`;return}this._status="";const l=tt(this._workingConfig,e);l!==null&&this._openScope(l);const o=this._points.map(d=>d&&String(d.id)===e?{...d,[t]:a}:d);this._setList("points",o,{now:true}),n===void 0&&(this._activeTab="points",this._selectPoint(e))}async _frameSelected(){var t,a,s;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t).catch(()=>null));await((s=e==null?void 0:e.frameSelected)==null?void 0:s.call(e))}async _setPlacing(e){var s,n;const t=this._previewCard,a=await((s=t==null?void 0:t.studioScene)==null?void 0:s.call(t));if(a)if(e){this._measuring&&await this._setMeasuring(false),(n=t.cancelPick)==null||n.call(t),this._placing=true;const r=this._system?this._objectIdIn(P,this._scope):void 0;this._status=r?`Tap the scene to place a new point in ${r}. Escape cancels.`:"Tap the scene to place a new point. Escape cancels.",window.addEventListener("keydown",this._onPlaceKey,true),a.setPickHandler((l,o)=>{const d=a.placementAt(l,o,r);if(!d){this._status="Nothing to stand on there: tap an object or the ground plane.";return}this._setPlacing(false),this._addPlacedPoint(d)})}else this._placing&&(this._placing=false,this._status="",window.removeEventListener("keydown",this._onPlaceKey,true),a.setPickHandler(null))}_onPlaceKey(e){e.key!=="Escape"||!(this._placing||this._measuring)||(e.stopPropagation(),e.preventDefault(),this._measuring?this._setMeasuring(false):this._setPlacing(false))}async _setMeasuring(e){var s,n;const t=this._previewCard,a=await((s=t==null?void 0:t.studioScene)==null?void 0:s.call(t));if(a)if(e){this._placing&&await this._setPlacing(false),(n=t.cancelPick)==null||n.call(t),this._measuring=true,this._measureA=this._measureB=null;const r=this._system?this._objectIdIn(P,this._scope):void 0;this._status="Tap where to measure from: a point, an object or the ground. Escape stops.",window.addEventListener("keydown",this._onPlaceKey,true);const l=c(o=>o.point??`[${o.at.map(d=>K(d)).join(", ")}]`,"where");a.setPickHandler((o,d)=>{const u=a.measureAt(o,d,r);if(!u){this._status="Nothing there to measure to: tap a point, an object or the ground.";return}if(!this._measureA||this._measureB){this._measureA=u,this._measureB=null,a.showMeasure(null),this._status=`From ${l(u)}: tap where to measure to.`;return}this._measureB=u,a.showMeasure(this._measureA.at,u.at,r),this._status=`${l(this._measureA)} to ${l(u)}: ${Cn(this._measureA.at,u.at,this._units||void 0)}. Tap again to measure anew.`})}else this._measuring&&(this._measuring=false,this._measureA=this._measureB=null,this._status="",window.removeEventListener("keydown",this._onPlaceKey,true),a.setPickHandler(null),a.showMeasure(null))}async _toggleHold(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t));e&&(this._held=!this._held,e.setHold(this._held))}async _nextQuickView(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t));e&&(this._quickView=(this._quickView+1)%Ce.length,e.flyTo(zn(this._quickView,e.cameraKeys()),{duration:600}))}_nextLook(){this._previewLook=Ti(this._previewLook),this._updatePreview()}_toggleIsolate(){const e=this._objects[this._expandedObject];this._isolated=this._isolated||!e?null:this._objectId(e,this._expandedObject),this._updatePreview()}_addPlacedPoint({form:e,value:t,object:a}){const s=pt("point",this._pointIds),n={id:s,...a?{object:a}:{},[e]:t,marker:"dot",label:"NEW POINT"};this._setList("points",[...this._points,n]),this._activeTab="points",this._selectPoint(s)}_objectId(e,t){return this._objectIdIn(this._scope,t)??((e==null?void 0:e.id)!==void 0?String(e.id):`${e==null?void 0:e.type}#${t+1}`)}_objectIdIn(e,t){return Tn(this._workingConfig,e)[t]}static get styles(){return[za,Ta,Ca,ce`
        :host { display: block; }
        /* The MSD studio's split: a third for the forms, two thirds for the scene.
           Rows too, or the shared sheet's narrow-screen rule leaves an empty row. */
        .studio-layout { grid-template-columns: 33.3% 66.6%; grid-template-rows: minmax(0, 1fr); }
        .tab-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: var(--ha-space-4); min-height: 0; }
        ha-tab-group { flex-shrink: 0; }
        .preview-stage { position: relative; flex: 1; min-height: 0; }
        .preview-host { position: absolute; inset: 0; }
        .tab-header { display: flex; align-items: center; justify-content: space-between; gap: var(--ha-space-2); margin-bottom: var(--ha-space-2); }
        .tab-header h3 { margin: 0; }
        .info-guide { display: block; margin-bottom: var(--ha-space-3); }
        .object { margin-bottom: var(--ha-space-2); display: block; }
        .empty { padding: var(--ha-space-4); text-align: center; color: var(--secondary-text-color); }
        .type-picker { margin-bottom: var(--ha-space-3); }
        .scope-bar { display: flex; align-items: center; gap: var(--ha-space-2); margin-bottom: var(--ha-space-3); padding: var(--ha-space-2) var(--ha-space-3); border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: var(--ha-border-radius-md); }
        .scope-bar span { flex: 1; }
        .system-open { margin: var(--ha-space-2) 0; }
        .type-picker-actions { display: flex; justify-content: flex-end; gap: var(--ha-space-2); margin-top: var(--ha-space-2); }
        lcards-form-section { display: block; }
        .canvas-toolbar { align-items: center; }
        .canvas-toolbar-button:disabled { opacity: 0.4; cursor: default; pointer-events: none; }
        .preview-notes { position: absolute; left: var(--ha-space-3); bottom: var(--ha-space-3); max-width: calc(100% - 24px); pointer-events: none; }
        .preview-notes > * { pointer-events: auto; }
        .try-bar { display: flex; align-items: center; gap: var(--ha-space-2); padding: var(--ha-space-1) var(--ha-space-1) var(--ha-space-1) var(--ha-space-4);
          border-radius: var(--ha-border-radius-pill); background: rgba(0, 0, 0, 0.75); color: white; box-shadow: var(--ha-box-shadow-m); }
        .try-bar span { font-weight: var(--ha-font-weight-medium); }
        .view-actions { display: flex; flex-wrap: wrap; gap: var(--ha-space-2); margin-bottom: var(--ha-space-3); }
        .outline-panel { display: flex; flex-direction: column; gap: var(--ha-space-2); margin-bottom: var(--ha-space-3); }
        .outline-row { display: grid; grid-template-columns: 24px 1fr 1fr repeat(3, 40px); align-items: center; gap: var(--ha-space-2); }
        .outline-n { text-align: right; opacity: 0.7; }
        .view-name { display: block; margin-bottom: var(--ha-space-3); }
        .views-section { display: block; margin-bottom: var(--ha-space-4); }
        .views-actions { display: flex; justify-content: flex-end; margin-bottom: var(--ha-space-2); }
        .start-view { margin-top: var(--ha-space-3); }
        .start-view .field-label { display: block; font-weight: var(--ha-font-weight-medium); }
        .views-section > .hint { margin-bottom: var(--ha-space-2); }
        .starter-group { margin-bottom: var(--ha-space-3); }
        .starter-tile.clash .starter-picture { opacity: 0.4; }
        .starter-note { display: flex; align-items: flex-start; gap: var(--ha-space-1); margin-top: var(--ha-space-1); padding: 0 var(--ha-space-2);
          font-size: var(--ha-font-size-m, 14px); font-weight: var(--ha-font-weight-medium); color: var(--primary-text-color); }
        .starter-note ha-icon { --mdc-icon-size: 18px; flex-shrink: 0; }
        .starter-clash { display: block; margin-bottom: var(--ha-space-3); }
        /* bottom right, as a map's scale: the toolbar has the top */
        .units-chip { position: absolute; bottom: var(--ha-space-3); right: var(--ha-space-3); display: flex; flex-direction: column; align-items: flex-end; }
        .units-chip ha-assist-chip { --ha-assist-chip-filled-container-color: var(--primary-color); --ha-assist-chip-label-text-color: white;
          --ha-chip-label-size: var(--ha-font-size-l, 16px); }
        .units-chip ha-icon { --mdc-icon-size: 18px; color: white; }
        .scale-bar { display: flex; align-items: center; gap: var(--ha-space-2); margin-top: var(--ha-space-2);
          color: var(--lcards-moonlight); font-size: var(--ha-font-size-s, 12px); pointer-events: none; }
        .scale-line { height: 6px; box-sizing: border-box; border: var(--ha-border-width-md) solid currentColor; border-top: none; }
        .starter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--ha-space-3); }
        .starter-tile { display: flex; flex-direction: column; gap: var(--ha-space-1); padding: 0 0 var(--ha-space-2); text-align: start; cursor: pointer;
          font: inherit; color: inherit; background: none; overflow: hidden;
          border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: var(--ha-border-radius-lg); }
        .starter-tile:hover, .starter-tile:focus-visible { border-color: var(--primary-color); outline: none; }
        .starter-tile .starter-title, .starter-tile .starter-summary { padding: 0 var(--ha-space-2); }
        .starter-title { font-weight: var(--ha-font-weight-medium); }
        .starter-summary { font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color); }
        .starter-picture { position: relative; aspect-ratio: 16 / 9; display: flex; align-items: center; justify-content: center; background: black; }
        .starter-picture ha-icon { --mdc-icon-size: 32px; color: var(--secondary-text-color); }
        .starter-picture img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .starter-detail > .starter-picture { border-radius: var(--ha-border-radius-lg); overflow: hidden; margin-bottom: var(--ha-space-3); }
        .starter-detail-title { display: flex; align-items: center; gap: var(--ha-space-2); margin: 0 0 var(--ha-space-2); }
        .starter-description { margin: 0 0 var(--ha-space-2); }
        .starter-adds { margin: 0 0 var(--ha-space-3); }
        .starter-units { display: flex; align-items: center; gap: var(--ha-space-1); margin: 0 0 var(--ha-space-2); }
        .starter-units ha-icon { --mdc-icon-size: 18px; flex-shrink: 0; }
        .starter-fit { margin: 0 0 var(--ha-space-2); }
        .starter-detail lcards-form-section { margin-bottom: var(--ha-space-3); }
        .starter-yaml { max-height: 320px; overflow: auto; margin: 0; padding: var(--ha-space-2) var(--ha-space-3);
          font-family: var(--ha-font-family-code, monospace); font-size: var(--ha-font-size-s, 12px); white-space: pre;
          border-radius: var(--ha-border-radius-md); background-color: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent)); }
        .starter-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--ha-space-2); }
        .toolbar-status { display: inline-block; color: white; font-size: var(--ha-font-size-m, 14px); padding: var(--ha-space-1) var(--ha-space-3);
          border-radius: var(--ha-border-radius-pill); background: rgba(0, 0, 0, 0.6); max-width: 48ch; }
      `]}render(){const e=[{id:"starters",label:"Starters",icon:"mdi:rocket-launch-outline"},{id:"scene",label:"Scene",icon:"mdi:star-four-points-outline"},{id:"objects",label:"Objects",icon:"mdi:shape-outline"},{id:"points",label:"Points",icon:"mdi:map-marker-multiple"},{id:"camera",label:"Camera",icon:"mdi:video-3d"},{id:"yaml",label:"YAML",icon:"mdi:code-braces"}];return p`
      <ha-dialog open flexcontent @closed=${this._onDialogClosed} header-title="Astrometrics Studio">
        <div class="dialog-content">
          <div class="studio-layout">
            <div class="config-panel">
              <ha-tab-group @wa-tab-show=${this._onTab}>
                ${e.map(t=>p`
                  <ha-tab-group-tab value=${t.id} ?active=${this._activeTab===t.id} ?disabled=${!!this._trying&&t.id!=="starters"}>
                    <ha-icon icon=${t.icon}></ha-icon>
                    ${t.label}
                  </ha-tab-group-tab>`)}
              </ha-tab-group>
              <div class="tab-content">${this._renderActiveTab()}</div>
            </div>
            <div class="preview-panel">
              <div class="preview-stage">
                <div class="preview-host" ${Ea(this._previewRef)}></div>
                ${this._renderToolbar()}
                ${this._renderUnitsChip()}
                <div class="preview-notes">
                  ${this._trying?p`
                    <div class="try-bar" role="status">
                      <span>Trying: ${this._trying.title}</span>
                      <ha-button size="s" appearance="plain" data-try="discard" @click=${this._discardTry}>Discard</ha-button>
                      <ha-button size="s" variant="brand" data-try="keep" @click=${this._keepTry}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Keep
                      </ha-button>
                    </div>`:p`
                    <span class="toolbar-status">${this._status||"Tap a point or object to edit it; drag a point, or an object standing at one, to move it. F flies to the selection."}</span>`}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ha-dialog-footer slot="footer">
          <div class="footer-start" slot="secondaryAction">
            <ha-button appearance="plain" @click=${()=>window.open(jt(Wi.astrometricsStudio),"_blank","noopener")}>
              <ha-icon icon="mdi:book-open-variant" slot="start"></ha-icon>
              Documentation
            </ha-button>
          </div>
          <ha-button slot="secondaryAction" appearance="plain" @click=${this._close}>Cancel</ha-button>
          <ha-button slot="primaryAction" variant="brand" @click=${this._save}>
            <ha-icon icon="mdi:check" slot="start"></ha-icon>
            Save
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}_renderToolbar(){this._historyVersion;const e=!!this._trying,t=!!this._objects[this._expandedObject],a=c(r=>p`
      <button class="canvas-toolbar-button ${r.active?"active":""}" data-tool=${r.id} title=${r.title} aria-label=${r.title}
        aria-pressed=${r.active===void 0?_:r.active?"true":"false"} ?disabled=${!!r.disabled} @click=${r.action}>
        <ha-icon icon=${r.icon}></ha-icon>
      </button>`,"button"),s=c(r=>p`
      <button class="canvas-toolbar-button" data-tool=${r.id} title=${r.title} aria-label=${r.title}
        @pointerdown=${l=>{l.button===0&&this._press(r.id)}}
        @pointerup=${()=>this._release()} @pointerleave=${()=>this._release()} @pointercancel=${()=>this._release()}>
        <ha-icon icon=${r.icon}></ha-icon>
      </button>`,"hold"),n=c(()=>{this._toolbarExpanded=!this._toolbarExpanded},"toggle");return this._toolbarExpanded?p`
      <div class="canvas-toolbar">
        <div class="canvas-toolbar-buttons">
          <div class="canvas-toolbar-group">
            <span class="canvas-toolbar-group-label">Tools</span>
            ${a({id:"place",icon:"mdi:map-marker-plus-outline",title:"Place a point",active:this._placing,disabled:e,action:c(()=>this._setPlacing(!this._placing),"action")})}
            ${a({id:"measure",icon:"mdi:ruler",title:"Measure: tap two places (Escape stops)",active:this._measuring,action:c(()=>this._setMeasuring(!this._measuring),"action")})}
          </div>
          <div class="canvas-toolbar-group">
            <span class="canvas-toolbar-group-label">View</span>
            ${a({id:"home",icon:"mdi:home-outline",title:"Back to the start view",action:c(()=>this._home(),"action")})}
            ${a({id:"frame-selected",icon:"mdi:image-filter-center-focus",disabled:e||this._selectedPoint===null&&!t,title:"Fly to what is selected (F)",action:c(()=>this._frameSelected(),"action")})}
            ${a({id:"quick-view",icon:"mdi:axis-arrow",active:this._quickView>=0,title:`${Ce[(this._quickView+1)%Ce.length].label} view, flat (orthographic); press again for the next, Home goes back`,action:c(()=>this._nextQuickView(),"action")})}
            ${s({id:"fly-forward",icon:"mdi:arrow-up-bold-outline",title:"Fly forward (W, Page Up); hold to keep going"})}
            ${s({id:"fly-back",icon:"mdi:arrow-down-bold-outline",title:"Fly back (S, Page Down); hold to keep going"})}
          </div>
          <div class="canvas-toolbar-group">
            <span class="canvas-toolbar-group-label">Preview</span>
            ${a({id:"model-scale",icon:"mdi:magnify-plus-outline",active:this._modelScale==="visible",disabled:!this._hasRealModels,title:this._hasRealModels?"Draw small models larger, to see them (V); not saved":"Draw small models larger: no model is at its real size",action:c(()=>{var r,l;return(l=(r=this._previewCard)==null?void 0:r.setModelScale)==null?void 0:l.call(r,"toggle")},"action")})}
            ${a({id:"look",icon:wr[this._previewLook??""],active:this._previewLook!==null,title:`Look: ${this._previewLook??"the card's"}; press for ${Ti(this._previewLook)??"the card's"} (not saved)`,action:c(()=>this._nextLook(),"action")})}
            ${a({id:"hold",icon:this._held?"mdi:play":"mdi:pause",active:this._held,title:this._held?"Run the motion and the clock again":"Hold all motion and the scene clock, to work on moving things (not saved)",action:c(()=>this._toggleHold(),"action")})}
            ${a({id:"isolate",icon:"mdi:eye-off-outline",active:!!this._isolated,disabled:!this._isolated&&(e||!t),title:this._isolated?`Show everything again (${this._isolated} is shown alone)`:"Show the selected object alone (not saved)",action:c(()=>this._toggleIsolate(),"action")})}
          </div>
          <div class="canvas-toolbar-group">
            <span class="canvas-toolbar-group-label">Edit</span>
            ${a({id:"undo",icon:"mdi:undo",title:"Undo (Ctrl+Z)",disabled:e||!this._history.canUndo,action:c(()=>this._undo(),"action")})}
            ${a({id:"redo",icon:"mdi:redo",title:"Redo (Ctrl+Shift+Z)",disabled:e||!this._history.canRedo,action:c(()=>this._redo(),"action")})}
          </div>
        </div>
        <button class="canvas-toolbar-toggle" data-tool="toggle" title="Hide the toolbar" aria-label="Hide the toolbar" @click=${n}>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
      </div>`:p`
        <div class="canvas-toolbar collapsed">
          <button class="canvas-toolbar-toggle" data-tool="toggle" title="Show the toolbar" aria-label="Show the toolbar" @click=${n}>
            <ha-icon icon="mdi:tools"></ha-icon>
          </button>
        </div>`}_renderUnitsChip(){var r;const e=((r=this._trying)==null?void 0:r.config)??this._workingConfig,t=this._trying?null:this._system,a=t?this._objectIdIn(P,this._scope):"",s=t?this._units:e.units,n=`${t?`System ${a}`:"Scene"}: ${s||"scene units"}`;return p`
      <div class="units-chip" data-units=${s||""} title="Positions, sizes and distances are in these units">
        <ha-assist-chip filled label=${n}><ha-icon slot="icon" icon="mdi:arrow-expand-horizontal"></ha-icon></ha-assist-chip>
        ${this._scaleBar?p`
          <div class="scale-bar" title="This length on the preview, where the camera looks">
            <span class="scale-line" style=${`width: ${this._scaleBar.px}px`}></span>
            <span class="scale-label">${this._scaleBar.label}</span>
          </div>`:_}
      </div>`}_renderActiveTab(){switch(this._activeTab){case"scene":return this._renderSceneTab();case"points":return this._renderPointsTab();case"camera":return this._renderCameraTab();case"starters":return this._renderStartersTab();case"yaml":return p`
        <lcards-studio-yaml-tab
          .hass=${this.hass}
          .config=${this._workingConfig}
          .schema=${Z}
          cardType="astrometrics"
          @yaml-config-changed=${e=>this._commit(pe(e.detail.config))}>
        </lcards-studio-yaml-tab>`;default:return this._renderObjectsTab()}}_renderSceneTab(){const e=this._workingConfig,t=Z.properties,a=c(n=>n?t[n].properties:t,"schemaAt"),s=c(n=>n?Ee(e[n])?e[n]:{}:e,"valueAt");return p`
      ${Jn()}
      ${$r.map(n=>p`
        <lcards-form-section data-group=${n.id} header=${n.header} icon=${n.icon} description=${n.hint} outlined ?expanded=${n.id==="look"||n.id==="time"||n.id==="units"}>
          ${n.parts.map(r=>p`
            <lcards-astro-schema-form .hass=${this.hass} .schema=${a(r.path)} .keys=${r.keys} .value=${s(r.path)}
              .pointIds=${this._pointIds} .units=${e.units??""}
              @form-changed=${l=>r.path?this._setTop(r.path,Object.keys(l.detail.value).length?l.detail.value:void 0):this._commit(l.detail.value)}>
            </lcards-astro-schema-form>`)}
        </lcards-form-section>`)}
      <lcards-form-section data-group="background" header="Background" icon="mdi:image-filter-hdr" outlined
        description="A flat animation behind the scene, as on other LCARdS cards. It does not turn with the camera: for a sky that turns, use Space, Stars.">
        <lcards-background-animation-editor .hass=${this.hass} .config=${e.background_animation??[]}
          @effects-changed=${n=>{n.stopPropagation();const r=n.detail.value;this._setTop("background_animation",Array.isArray(r)&&!r.length?void 0:r)}}>
        </lcards-background-animation-editor>
      </lcards-form-section>
      <lcards-form-section data-group="labels" header="Labels" icon="mdi:label-outline" outlined
        description="How every label looks, and the styles points pick (title, major, minor, tiny, and your own).">
        <lcards-astro-labels-editor .hass=${this.hass} .value=${Ee(e.labels)?e.labels:{}}
          @value-changed=${n=>{n.stopPropagation(),n.composedPath()[0]===n.currentTarget&&this._setTop("labels",Object.keys(n.detail.value??{}).length?n.detail.value:void 0)}}>
        </lcards-astro-labels-editor>
      </lcards-form-section>
    `}_renderPointsTab(){return p`
      ${Xn()}
      ${this._renderScopeBar("points")}
      <lcards-astro-points-editor
        .hass=${this.hass}
        .config=${Nn(this._workingConfig,this._scope)}
        .preview=${this._previewCard}
        .takenIds=${this._pointIds}
        .selected=${this._selectedPoint}
        @point-selected=${e=>{e.stopPropagation(),this._selectPoint(e.detail.id)}}
        @points-changed=${e=>{e.stopPropagation(),this._setList("points",e.detail.value)}}>
      </lcards-astro-points-editor>
    `}_renderCameraTab(){const e=Z.properties.camera.properties,t=Ee(this._workingConfig.camera)?this._workingConfig.camera:{},a=c(s=>p`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${e} .keys=${s} .value=${t} .pointIds=${this._pointIds}
        .units=${this._workingConfig.units??""} .choices=${{view:Object.keys(B(t))}}
        @form-changed=${n=>this._setTop("camera",Object.keys(n.detail.value).length?n.detail.value:void 0)}>
      </lcards-astro-schema-form>`,"form");return p`
      ${er()}
      ${this._renderViews(t,a(["view"]))}
      ${kr.map(s=>p`
        <lcards-form-section data-group=${s.id} header=${s.header} icon=${s.icon} description=${s.hint} outlined>
          ${a(s.keys.filter(n=>e[n]))}
        </lcards-form-section>`)}
    `}_renderViews(e,t){const a=B(e),s=Object.keys(a),n=ms(e);return p`
      <lcards-form-section class="views-section" data-group="views" header="Views" icon="mdi:video-outline" outlined ?expanded=${true}
        description="Named camera views: capture one from the preview, fly between them, and pick the one the card starts with.">
        <div class="views-actions">
          <ha-button @click=${()=>this._captureView(null)}>
            <ha-icon icon="mdi:camera-plus-outline" slot="start"></ha-icon>
            Capture view
          </ha-button>
        </div>
        <div class="hint">Move the preview's camera, then capture it as a named view. A tap_action with action: fly-to and view: its name flies there.</div>
        ${s.length?s.map((r,l)=>this._renderView(r,a[r],l,s.length,r===n)):p`<div class="empty">No views yet: the card frames the whole scene.</div>`}
        <div class="start-view">
          <span class="field-label">Start with</span>
          <div class="hint">The view the card opens on (the star in the list), or a guided tour that follows an entity through views.</div>
          ${t}
        </div>
      </lcards-form-section>
    `}_renderView(e,t,a,s,n){var o;const r=this._expandedView===e,l=Z.properties.camera.properties.views.additionalProperties.properties;return p`
      <lcards-form-section class="object" data-view=${e} header=${e}
        secondary=${[n?"start view":null,vs(t)].filter(Boolean).join(" · ")}
        icon=${n?"mdi:star":"mdi:video-outline"} outlined ?expanded=${r}
        @expanded-changed=${d=>{d.detail.expanded?this._expandedView=e:this._expandedView===e&&(this._expandedView=null),this._viewError=""}}>
        <ha-icon-button slot="header-icons" .label=${"Fly to"}
          @click=${d=>{d.stopPropagation(),this._flyToView(t)}}>
          <ha-icon icon="mdi:airplane"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Move up"} ?disabled=${a===0}
          @click=${d=>{d.stopPropagation(),this._setCamera(ti(this._workingConfig.camera,e,-1))}}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Move down"} ?disabled=${a===s-1}
          @click=${d=>{d.stopPropagation(),this._setCamera(ti(this._workingConfig.camera,e,1))}}>
          <ha-icon icon="mdi:arrow-down"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Delete view"}
          @click=${d=>{d.stopPropagation(),this._deleteView(e)}}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>
        ${r?p`
          <div class="view-actions">
            <ha-button appearance="plain" @click=${()=>this._captureView(e)}>
              <ha-icon icon="mdi:camera-outline" slot="start"></ha-icon>
              Capture over this view
            </ha-button>
            <ha-button appearance="plain" ?disabled=${n&&((o=this._workingConfig.camera)==null?void 0:o.view)===e}
              @click=${()=>this._setCamera({...this._workingConfig.camera,view:e})}>
              <ha-icon icon="mdi:star-outline" slot="start"></ha-icon>
              Start here
            </ha-button>
          </div>
          <ha-input class="view-name" .label=${"Name"} .value=${e}
            @change=${d=>this._renameView(e,d.target.value)}></ha-input>
          ${this._viewError?p`<lcards-message type="error">${this._viewError}</lcards-message>`:_}
          <lcards-astro-schema-form .hass=${this.hass} .schema=${l} .keys=${Object.keys(l)} .value=${t} .pointIds=${this._pointIds}
            .units=${this._workingConfig.units??""}
            @form-changed=${d=>{d.stopPropagation(),this._setCamera(ei(this._workingConfig.camera,e,d.detail.value))}}>
          </lcards-astro-schema-form>`:_}
      </lcards-form-section>
    `}_setCamera(e,{now:t=false}={}){const a={...this._workingConfig};e?a.camera=e:delete a.camera,this._commit(a,{now:t})}async _captureView(e){var r,l,o;const t=await((l=(r=this._previewCard)==null?void 0:r.studioScene)==null?void 0:l.call(r));if(!t)return;const a=this._workingConfig.camera,s=B(a),n=e??bs(s);this._setCamera(ei(a,n,ys(((o=t.viewNow)==null?void 0:o.call(t))??t.cameraKeys(),t.pointPositions(),s[n])),{now:true}),this._expandedView=n,this._viewError=""}async _flyToView(e){var a,s;const t=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a));t==null||t.flyTo(e)}_renameView(e,t){const a=String(t??"").trim(),s=_s(B(this._workingConfig.camera),a,e);this._viewError=s??"",!(s||a===e)&&(this._expandedView=a,this._commit(ws(this._workingConfig,e,a)))}async _deleteView(e){await Wt({title:"Delete view",message:`Delete the view ${e}? Actions that fly to it stop working.`})&&(this._expandedView===e&&(this._expandedView=null),this._setCamera(gs(this._workingConfig.camera,e)))}_renderStartersTab(){const e=se.find(s=>s.id===this._openStarter);if(e)return p`${this._renderScopeBar("starters")}${this._renderStarterDetail(e)}`;const t=!!this._system,a=c((s,n,r,l)=>p`
      <lcards-form-section class="starter-group" data-group=${s} header=${n} icon=${r} description=${l} outlined expanded>
        <div class="starter-grid">${se.filter(o=>o.kind===s).map(o=>this._renderStarterTile(o))}</div>
      </lcards-form-section>`,"group");return p`
      ${Qn()}
      ${this._renderScopeBar("starters")}
      ${a("scene","Scenes","mdi:image-filter-hdr-outline",t?"A whole scene: it acts on the whole card, not only this system.":"A whole scene: use it in place of yours, or merge it into yours.")}
      ${a("part","Parts","mdi:puzzle-outline",t?"One thing to add to this system, sized in its units, such as a planet with moons.":"One thing to add next to your scene, such as a planet with moons.")}
    `}_picture(e,t){return p`
      <div class="starter-picture">
        <ha-icon icon=${t}></ha-icon>
        <img src=${e} alt="" loading="lazy"
          @error=${a=>{a.target.hidden=true}}>
      </div>`}get _starterSystem(){return this._system?this._scope:void 0}get _starterUnits(){return Nt(this._workingConfig,this._starterSystem)??""}_starterClash(e,t){return An(this._workingConfig,e,t,e.kind==="part"?this._starterSystem:void 0)}_renderStarterTile(e){const t=e.kind==="part"?this._starterClash(e):null;return p`
      <button class="starter-tile ${t?"clash":""}" data-starter=${e.id} @click=${()=>{this._openStarter=e.id}}>
        ${this._picture(Ei(e.id),e.icon)}
        <span class="starter-title">${e.title}</span>
        <span class="starter-summary">${e.summary}</span>
        ${t?p`<span class="starter-note"><ha-icon icon="mdi:arrow-expand-horizontal"></ha-icon>In ${t}; this ${this._system?"system":"scene"} is in ${this._starterUnits||"scene units"}</span>`:_}
      </button>`}_starterMode(e){return e.kind==="scene"?"replace":this._system||!this._starterClash(e,this._starterParams[e.id])?"merge":e.scene?"scene":"replace"}_renderStarterDetail(e){var b,g;const t=this._starterParams[e.id]??{},a=((b=this._trying)==null?void 0:b.id)===e.id,s=e.kind==="scene",n=this._starterClash(e,t),r=this._starterMode(e),l=e.scene?se.find(w=>w.id===e.scene):void 0,o=this._workingConfig.units??"scene units",d=!s&&this._system?this._objectIdIn(P,this._scope):null,u=!!(d&&n),y=s?this._workingConfig.units??"":this._starterUnits,h=s||r!=="merge"?null:ge(this._workingConfig,this._starterSystem),m=Kn(e,t,y||null,h),f=h&&aa(e,h,y||null,t)!==null;return p`
      <div class="starter-detail" data-starter-detail=${e.id}>
        <div class="tab-header">
          <ha-button appearance="plain" size="s" ?disabled=${!!this._trying} @click=${()=>{this._openStarter=null,this._starterMessage=null}}>
            <ha-icon icon="mdi:arrow-left" slot="start"></ha-icon>
            All starters
          </ha-button>
        </div>
        ${this._picture(Ei(e.id),e.icon)}
        <h3 class="starter-detail-title"><ha-icon icon=${e.icon}></ha-icon>${e.title}</h3>
        <p class="starter-description">${e.description}</p>
        ${s?p`<p class="hint starter-units"><ha-icon icon="mdi:ruler"></ha-icon>${Yn(e)}</p>`:_}
        <p class="hint starter-adds">${r==="scene"?`Replaces the scene with ${l==null?void 0:l.title}, then adds`:s||r==="replace"?"Replaces the scene with":"Adds"} ${Gn(e,t)}${d&&!u?` to system ${d}`:""}.</p>
        ${u?p`
          <lcards-message type="info" class="starter-clash">
            This part is in ${n} and system ${d} is in ${y||"its parent's units"}, so it cannot go into it. Go back to the scene to add it there.
          </lcards-message>`:n&&!s?p`
          <lcards-message type="info" class="starter-clash">
            This part is in ${n} and your scene is in ${o}, so it cannot go next to it.
            ${l?p`It is made for ${l.title}: start with that scene and add this part to it.`:"It can replace the scene instead."}
            Undo brings your scene back.
          </lcards-message>`:_}
        ${e.params.length?p`
          <lcards-form-section header="Settings" icon="mdi:tune-variant" outlined expanded>
            ${f?p`<p class="hint starter-fit">Sized to fit this ${this._system?"system":"scene"} (its units have no name). Change the sizes as you like.</p>`:_}
            <lcards-astro-schema-form .hass=${this.hass} .schema=${Vn(e)} .value=${m}
              .pointIds=${this._pointIds} .choices=${Hn(e)} .units=${y}
              @form-changed=${w=>{w.stopPropagation(),this._setStarterParams(e,w.detail.value)}}>
            </lcards-astro-schema-form>
          </lcards-form-section>`:_}
        <lcards-form-section header="YAML" icon="mdi:code-braces" description="What it puts into the card" outlined>
          <pre class="starter-yaml">${this._starterYaml(e,m,y)}</pre>
        </lcards-form-section>
        ${((g=this._starterMessage)==null?void 0:g.starter)===e.id?p`<lcards-message type=${this._starterMessage.type}>${this._starterMessage.text}</lcards-message>`:_}
        <div class="starter-actions">
          ${u?p`
            <ha-button data-action="to-scene" @click=${()=>this._openScope(P,{fly:true})}>
              <ha-icon icon="mdi:arrow-left" slot="start"></ha-icon>
              Back to the scene to add it
            </ha-button>`:a?p`
            <ha-button appearance="plain" @click=${this._discardTry}>Discard</ha-button>
            <ha-button variant="brand" @click=${this._keepTry}>
              <ha-icon icon="mdi:check" slot="start"></ha-icon>
              Keep
            </ha-button>`:p`
            <ha-button appearance="plain" data-action="try" @click=${()=>this._tryStarter(e,r)}>
              <ha-icon icon="mdi:eye-outline" slot="start"></ha-icon>
              Try in the preview
            </ha-button>
            ${s?p`
              <ha-button appearance="plain" ?disabled=${!ke(this._workingConfig)||!!n}
                title=${n?`This scene is in ${n} and yours is in ${o}: only replacing works`:""}
                @click=${()=>this._insertStarter(e,"merge")}>
                <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                Merge into the scene
              </ha-button>
              <ha-button @click=${()=>this._insertStarter(e,"replace")}>
                <ha-icon icon="mdi:swap-horizontal" slot="start"></ha-icon>
                Use this scene
              </ha-button>`:p`
              <ha-button data-action="insert" @click=${()=>this._insertStarter(e,r)}>
                <ha-icon icon=${r==="merge"?"mdi:plus":"mdi:swap-horizontal"} slot="start"></ha-icon>
                ${r==="merge"?d?`Add to system ${d}`:"Add to the scene":r==="scene"?`Start with ${l==null?void 0:l.title} and add it`:"Replace the scene with it"}
              </ha-button>`}`}
        </div>
      </div>
    `}_setStarterParams(e,t){var s;if(this._starterParams={...this._starterParams,[e.id]:t},((s=this._trying)==null?void 0:s.id)!==e.id)return;const a=this._trying.mode;clearTimeout(this._tryTimer),this._tryTimer=setTimeout(()=>this._tryStarter(e,a),Bi)}_starterYaml(e,t,a=""){const s=Ne(a?{units:a}:{},e,t);if(!s.config)return s.error;const{type:n,...r}=s.config;return s.added.units===void 0&&delete r.units,On(r)}_withStarter(e,t){let a=this._workingConfig;const s=t==="scene"?se.find(l=>l.id===e.scene):void 0;s&&(a=Ne(a,s,this._starterParams[s.id]??{},{mode:"replace"}).config??a);const n=e.kind==="part"&&t==="merge"?this._starterSystem:void 0,r=Ne(a,e,this._starterParams[e.id]??{},{mode:t==="scene"?"merge":t,system:n});return!r.config||!r.added?(this._starterMessage={starter:e.id,type:"error",text:String(r.error)},null):{config:r.config,added:r.added}}async _tryStarter(e,t){const a=this._withStarter(e,t);if(!a){this._trying&&this._discardTry();return}await this._setPlacing(false),this._starterMessage=null,this._trying={id:e.id,mode:t,title:e.title,config:a.config},this._updatePreview()}_keepTry(){const e=this._trying;if(!e)return;clearTimeout(this._tryTimer);const t=se.find(a=>a.id===e.id);this._trying=null,t&&this._insertStarter(t,e.mode)}_discardTry(){clearTimeout(this._tryTimer),this._trying=null,this._updatePreview()}_insertStarter(e,t){const a=this._withStarter(e,t);if(!a)return;const s=t==="scene"?se.find(r=>r.id===e.scene):void 0,n=`${s?`${s.title}, then `:""}${e.title}: added ${ra(a.added)}.`;this._starterMessage={starter:e.id,type:"success",text:`${n} Undo takes it out again.`},this._expandedObject=-1,this._selectedPoint=null,this._commit(a.config,{now:true,step:true})}_renderObjectsTab(){const e=this._objects;return p`
      ${Zn()}
      ${this._renderScopeBar("objects")}
      <div class="tab-header">
        <h3>Objects</h3>
        <div>
          <ha-button @click=${()=>{this._addingObject=!this._addingObject}}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add object
          </ha-button>
        </div>
      </div>
      ${this._addingObject?this._renderTypePicker():_}
      ${e.length?e.map((t,a)=>this._renderObject(t,a,e.length)):p`<div class="empty">${this._system?"No objects in this system yet. Add a sphere for its star or a planet, or another type.":"No objects yet. Add a grid, a sphere or another type to draw something."}</div>`}
    `}_renderScopeBar(e){const t=this._system;if(!t)return _;const a=this._objectIdIn(P,this._scope),s=t.units?`in ${t.units}`:t.scale!==void 0?`scale ${t.scale}`:`in ${this._workingConfig.units??"scene units"}`;return p`
      <div class="scope-bar">
        <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
        <span>${e==="starters"?"Parts go into system":e==="points"?"Points of system":"Objects of system"} <b>${a}</b> (${s})</span>
        <ha-button appearance="plain" @click=${()=>this._openScope(P,{fly:true})}>
          <ha-icon icon="mdi:arrow-left" slot="start"></ha-icon>
          Back to the scene
        </ha-button>
      </div>`}_renderTypePicker(){const e=Yt.filter(t=>!(this._system&&t.type==="system"));return p`
      <lcards-form-section class="type-picker" header="Add an object" icon="mdi:shape-plus-outline" outlined ?expanded=${true}>
        ${Bn.map(t=>{const a=e.filter(s=>t.types.includes(s.type));return a.length?p`
            <lcards-form-section class="starter-group" data-type-group=${t.id} header=${t.header} icon=${t.icon} nested outlined expanded>
              <div class="starter-grid">${a.map(s=>p`
                <button class="starter-tile" data-type=${s.type} @click=${()=>this._addObject(s.type)}>
                  ${this._picture(Rn(s.type),s.icon)}
                  <span class="starter-title">${s.type}</span>
                  <span class="starter-summary">${s.use}</span>
                </button>`)}
              </div>
            </lcards-form-section>`:_})}
        <div class="type-picker-actions">
          <ha-button appearance="plain" @click=${()=>{this._addingObject=false}}>Cancel</ha-button>
        </div>
      </lcards-form-section>
    `}async _addObject(e){var d,u,y;const t=ji(this._workingConfig);this._addingObject=false;const a=await((u=(d=this._previewCard)==null?void 0:d.studioScene)==null?void 0:u.call(d).catch(()=>null)),s=this._system?this._objectIdIn(P,this._scope):void 0,n={real:!!this._units},r=this._objects.find(h=>(h==null?void 0:h.type)==="sphere"&&typeof h.id=="string");if(r&&(n.sphere=r.id),a!=null&&a.viewIn){const h=a.viewIn(s);n.scale=cs(h.distance);const m=(y=a.viewNow)==null?void 0:y.call(a).target;if(typeof m=="string"&&tt(this._workingConfig,m)===this._scope)n.at=m;else{const f=10**Math.floor(Math.log10(h.distance*.001)),b=h.target.map(g=>Number((Math.round(g/f)*f).toPrecision(12)));b.some(g=>g!==0)&&(n.at=b)}}const l=this._objects;this._expandedObject=l.length;const o=ds(e,t,this._pointIds,n);this._setObjects([...l,o]),e==="model"&&this._showModelWhenLoaded(String(o.id),String(o.src))}_renderObject(e,t,a){const s=as(Ia,e==null?void 0:e.type),n=Yt.find(d=>d.type===(e==null?void 0:e.type)),r=this._objectId(e,t),l=c(d=>{this._setObjects(this._objects.map((u,y)=>y===t?hs(u,d):u)),(e==null?void 0:e.type)==="model"&&d.src&&d.src!==e.src&&d.id!==void 0&&this._showModelWhenLoaded(String(d.id),String(d.src))},"set"),o=this._expandedObject===t;return p`
      <lcards-form-section class="object" data-object=${t} header=${r}
        secondary=${[e==null?void 0:e.type,ns(e)].filter(Boolean).join(" · ")}
        icon=${(n==null?void 0:n.icon)??"mdi:shape-outline"} outlined ?expanded=${o}
        @expanded-changed=${d=>{d.detail.expanded?this._selectObject(t):this._expandedObject===t&&this._selectObject(-1)}}>
        ${(e==null?void 0:e.type)==="system"&&!this._system?p`
          <ha-button slot="header-icons" size="s" class="open-system" data-action="open-system"
            title=${`Open the system: its ${ct(e)}`}
            @click=${d=>{d.stopPropagation(),this._openScope(t,{fly:true})}}>
            <ha-icon icon="mdi:folder-open-outline" slot="start"></ha-icon>
            Open
          </ha-button>`:_}
        <ha-icon-button slot="header-icons" .label=${"Move up"} ?disabled=${t===0}
          @click=${d=>{d.stopPropagation(),this._moveObject(t,-1)}}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Move down"} ?disabled=${t===a-1}
          @click=${d=>{d.stopPropagation(),this._moveObject(t,1)}}>
          <ha-icon icon="mdi:arrow-down"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Duplicate"}
          @click=${d=>{d.stopPropagation(),this._duplicateObject(t)}}>
          <ha-icon icon="mdi:content-copy"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Delete object"}
          @click=${d=>{d.stopPropagation(),this._deleteObject(t)}}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>
        ${o?s?this._renderObjectForm(e,s,l):p`
          <lcards-message type="warning">Unknown type ${String(e==null?void 0:e.type)}: edit this object in the YAML tab.</lcards-message>`:_}
      </lcards-form-section>
    `}_renderObjectForm(e,t,a){const s={...t.common,...t.own},n=["id",...Object.keys(t.own),...Object.keys(t.common).filter(o=>o!=="id"&&!t.own[o])].filter(o=>s[o]&&!((e==null?void 0:e.type)==="system"&&(o==="points"||o==="objects"))),r=c(o=>o==="id"||(e==null?void 0:e.type)==="system"?"main":Ja(o,s[o]),"groupFor"),l=c(o=>p`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${s} .keys=${o} .value=${e} .pointIds=${this._pointIds}
        .units=${this._units} .systemIds=${this._systemIds}
        @form-changed=${d=>{d.stopPropagation(),a({type:e.type,...d.detail.value})}}>
      </lcards-astro-schema-form>`,"form");return p`
      ${t.branch.description?p`<div class="hint">${t.branch.description}</div>`:_}
      ${Ga.map(o=>{const d=n.filter(y=>r(y)===o.id);if(!d.length)return _;if(o.id==="main"){if((e==null?void 0:e.type)==="volume"&&e.shape==="prism")return p`${l(d.filter(h=>h!=="outline"))}${this._renderOutline(e)}`;const y=(e==null?void 0:e.type)==="model"?Math.max(d.indexOf("size"),d.indexOf("file_units"))+1:0;return y>0?p`${l(d.slice(0,y))}${this._renderModelSize(e,a)}${d.length>y?l(d.slice(y)):_}`:p`${l(d)}${(e==null?void 0:e.type)==="system"?p`
            <div class="hint system-open">Holds ${ct(e)}.</div>`:_}`}const u=os(e,d);return p`<lcards-form-section data-group=${o.id} header=${o.header} icon=${o.icon} secondary=${u?"follows an entity":""}
          nested outlined ?expanded=${u||o.id==="appearance"}>${l(d)}</lcards-form-section>`})}
    `}_renderOutline(e){var u,y;const t=Array.isArray(e.outline)?e.outline.map(h=>Array.isArray(h)?[Number(h[0])||0,Number(h[1])||0]:[0,0]):[],a=e.id===void 0?null:String(e.id),s=!!a&&((u=this._outlineEdit)==null?void 0:u.id)===a,n=s&&!!((y=this._outlineEdit)!=null&&y.draw),r=this._units?` (${this._units})`:"",l=c(h=>this._commitOutline(a,h,e),"put"),o=c((h,m,f)=>{const b=Number(f);Number.isFinite(b)&&l(t.map((g,w)=>w===h?m===0?[b,g[1]]:[g[0],b]:g))},"setAt"),d=c((h,m)=>{const f=[...t];[f[h],f[h+m]]=[f[h+m],f[h]],l(f)},"swap");return p`
      <div class="outline-panel" data-outline>
        <div class="hint">Outline: ${t.length} corners, x and z${r} from the object's position (-z is north). At least 3.</div>
        ${t.map((h,m)=>p`
          <div class="outline-row" data-corner=${m}>
            <span class="outline-n">${m+1}</span>
            <ha-input type="number" .label=${"x"} .value=${String(h[0])} @change=${f=>o(m,0,f.target.value)}></ha-input>
            <ha-input type="number" .label=${"z"} .value=${String(h[1])} @change=${f=>o(m,1,f.target.value)}></ha-input>
            <ha-icon-button .label=${"Move up"} ?disabled=${m===0} @click=${()=>d(m,-1)}><ha-icon icon="mdi:arrow-up"></ha-icon></ha-icon-button>
            <ha-icon-button .label=${"Move down"} ?disabled=${m===t.length-1} @click=${()=>d(m,1)}><ha-icon icon="mdi:arrow-down"></ha-icon></ha-icon-button>
            <ha-icon-button .label=${"Remove corner"} ?disabled=${t.length<=3} @click=${()=>l(t.filter((f,b)=>b!==m))}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
          </div>`)}
        <div class="view-actions">
          <ha-button appearance="plain" size="s" data-action="outline-add" ?disabled=${t.length<2}
            @click=${()=>l(t.length>=2?[...t,[Number(((t[0][0]+t[t.length-1][0])/2).toPrecision(6)),Number(((t[0][1]+t[t.length-1][1])/2).toPrecision(6))]]:t)}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>Add corner
          </ha-button>
          <ha-button appearance=${s&&!n?"filled":"plain"} size="s" data-action="outline-edit" ?disabled=${!a||t.length<3}
            @click=${()=>s&&!n?this._endOutline():this._startOutline(e,false)}>
            <ha-icon icon=${s&&!n?"mdi:check":"mdi:vector-polygon"} slot="start"></ha-icon>${s&&!n?"Done":"Edit on preview"}
          </ha-button>
          <ha-button appearance=${n?"filled":"plain"} size="s" data-action="outline-draw" ?disabled=${!a}
            @click=${()=>n?this._finishDraw():this._startOutline(e,true)}>
            <ha-icon icon=${n?"mdi:check":"mdi:draw"} slot="start"></ha-icon>${n?"Close outline":"Draw new outline"}
          </ha-button>
        </div>
        ${s?p`<div class="hint" data-outline-hint>${n?"Tap the ground for each corner in order, then tap the first corner (or Close outline) to finish. Shift: no snapping. Esc stops.":p`Drag a corner to move it (it snaps to ${K(this._outlineSnapValue(e,t))}${r}; Shift: no snapping). Tap a + to add a corner there; select a corner and press Delete to remove it. Esc or Done to finish.`}</div>`:_}
      </div>`}_outlineSnapValue(e,t,a){const s=this._objects.find(n=>(n==null?void 0:n.type)==="grid"&&Number(n.line_spacing)>0);if(s)return Number(s.line_spacing);if(t.length>=3){const n=t.map(l=>l[0]),r=t.map(l=>l[1]);return wt(Math.max(Math.max(...n)-Math.min(...n),Math.max(...r)-Math.min(...r))/20)}return wt((a??100)/50)}_commitOutline(e,t,a){const s=this._objects.map(n=>(e!==null?String(n==null?void 0:n.id)===e:n===a)?{...n,outline:t}:n);this._commit(Oi(this._workingConfig,this._scope,"objects",s),{step:true})}async _startOutline(e,t){var o,d,u,y;const a=await((d=(o=this._previewCard)==null?void 0:o.studioScene)==null?void 0:d.call(o).catch(()=>null));if(!(a!=null&&a.editOutline)||e.id===void 0)return;const s=String(e.id),n=qt(e.outline)??[],r=this._system?this._objectIdIn(P,this._scope):void 0,l=this._outlineSnapValue(e,t?[]:n,(y=(u=a.viewIn)==null?void 0:u.call(a,r))==null?void 0:y.width);this._outlineEdit={id:s,draw:t},a.editOutline(s,{snap:l,draw:t,outline:n,onChange:c((h,m)=>{var f;m&&(this._commitOutline(s,h),(f=this._outlineEdit)!=null&&f.draw&&(this._outlineEdit={id:s,draw:false}))},"onChange"),onExit:c(()=>this._endOutline(),"onExit")})}async _finishDraw(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t).catch(()=>null));e!=null&&e.finishOutline&&!e.finishOutline()&&(this._status="An outline needs at least 3 corners.")}async _outlineSync(e){var r,l,o,d;const t=this._outlineEdit,a=await((l=(r=this._previewCard)==null?void 0:r.studioScene)==null?void 0:l.call(r).catch(()=>null));if(!(a!=null&&a.editOutline)||!t||t.draw)return;const s=qt(e.outline)??[],n=this._system?this._objectIdIn(P,this._scope):void 0;a.editOutline(t.id,{snap:this._outlineSnapValue(e,s,(d=(o=a.viewIn)==null?void 0:o.call(a,n))==null?void 0:d.width),draw:false,outline:s,onChange:c((u,y)=>{y&&this._commitOutline(t.id,u)},"onChange"),onExit:c(()=>this._endOutline(),"onExit")})}async _endOutline(){var t,a,s;this._outlineEdit=null;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t).catch(()=>null));(s=e==null?void 0:e.editOutline)==null||s.call(e,null)}_renderModelSize(e,t){const a=String(e.src??""),s=this._modelExtents[a]??null;!s&&a&&e.id!==void 0&&this._readModelExtent(String(e.id),a);const n=this._units,r=Ln(e,s,n),{size:l,...o}=e;return p`
      <div class="model-size" data-mode=${r.mode}>
        <div class="hint">${r.file?p`File: ${r.file}.`:"File: measured once the preview has loaded it."} ${r.note}</div>
        <div class="view-actions">
          <ha-button appearance="plain" size="s" data-action="show-model" ?disabled=${e.id===void 0}
            @click=${()=>this._showObject(String(e.id))}>
            <ha-icon icon="mdi:crosshairs-gps" slot="start"></ha-icon>Show
          </ha-button>
          <ha-button appearance="plain" size="s" data-action="fit-view" @click=${()=>this._fitModelToView(e,t)}>
            <ha-icon icon="mdi:fit-to-screen-outline" slot="start"></ha-icon>Fit to view
          </ha-button>
          <ha-button appearance="plain" size="s" data-action="file-size" ?disabled=${r.largest===null}
            @click=${()=>{r.largest!==null&&t({...e,size:Number(r.largest.toPrecision(4))})}}>
            <ha-icon icon="mdi:file-outline" slot="start"></ha-icon>File size
          </ha-button>
          <ha-button appearance="plain" size="s" data-action="real-size" ?disabled=${!n||r.mode==="real"}
            @click=${()=>t(o)}>
            <ha-icon icon="mdi:ruler" slot="start"></ha-icon>Real size
          </ha-button>
        </div>
      </div>`}async _showObject(e){var a,s;const t=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a).catch(()=>null));await(t==null?void 0:t.frameObject(e))}async _showModelWhenLoaded(e,t){await this._whenModelLoaded(e,t)&&await this._showObject(e)}async _whenModelLoaded(e,t){var s,n,r,l;const a=Date.now()+vr;for(;this.isConnected&&Date.now()<a;){const o=await((n=(s=this._previewCard)==null?void 0:s.studioScene)==null?void 0:n.call(s).catch(()=>null)),d=(r=o==null?void 0:o.modelState)==null?void 0:r.call(o,e);if((d==null?void 0:d.src)===t&&d.state==="failed")return null;const u=(d==null?void 0:d.src)===t&&d.state==="ready"?(l=o==null?void 0:o.modelInfo)==null?void 0:l.call(o,e):null;if(u)return u;await new Promise(y=>setTimeout(y,250))}return null}async _readModelExtent(e,t){if(!this._extentPending.has(t)){this._extentPending.add(t);try{const a=await this._whenModelLoaded(e,t);a&&(this._modelExtents={...this._modelExtents,[t]:a.extent})}finally{this._extentPending.delete(t)}}}async _fitModelToView(e,t){var n,r;const a=await((r=(n=this._previewCard)==null?void 0:n.studioScene)==null?void 0:r.call(n).catch(()=>null));if(!(a!=null&&a.viewIn))return;const s=this._system?this._objectIdIn(P,this._scope):void 0;t({...e,size:Mn(a.viewIn(s).width)})}_moveObject(e,t){const a=[...this._objects],s=e+t;s<0||s>=a.length||([a[e],a[s]]=[a[s],a[e]],this._expandedObject=s,this._setObjects(a))}_duplicateObject(e){const t=this._objects,a=t[e],s=ji(this._workingConfig),n={...pe(a),id:pt(`${(a==null?void 0:a.id)??(a==null?void 0:a.type)}_`,s)};this._expandedObject=e+1,this._setObjects([...t.slice(0,e+1),n,...t.slice(e+1)])}async _deleteObject(e){const t=this._objects[e];await Wt({title:"Delete object",message:(t==null?void 0:t.type)==="system"?`Delete ${this._objectId(t,e)} with its ${ct(t)}?`:`Delete ${this._objectId(t,e)}? Points standing on it lose their surface.`})&&(this._expandedObject===e&&(this._expandedObject=-1),this._setObjects(this._objects.filter((s,n)=>n!==e)))}async _home(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t));this._quickView=-1,e==null||e.home()}async _press(e){var a,s;const t=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a));t==null||t.press(e)}async _release(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t));e==null||e.release()}_onTab(e){var a;const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t&&(this._activeTab=t)}_onDialogClosed(e){e.stopPropagation(),e.target===e.currentTarget&&this._close()}_save(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:pe(this._workingConfig)}})),this._close()}_close(){this.dispatchEvent(new CustomEvent("closed"))}};c(Rt,"LCARdSAstrometricsStudioDialog");let St=Rt;customElements.get("lcards-astrometrics-studio-dialog")||customElements.define("lcards-astrometrics-studio-dialog",St);const Dt=class Dt2 extends Pa{constructor(){super(),this.cardType="astrometrics",this._studio=null,Oa().then(()=>this.requestUpdate())}updated(e){super.updated(e),e.has("hass")&&this._studio&&(this._studio.hass=this.hass)}_getTabDefinitions(){return[{label:"Configuration",content:c(()=>this._renderConfigurationTab(),"content")},...this._getUtilityTabs()]}_renderConfigurationTab(){var n;const e=this.config??{},t=Array.isArray(e.points)?e.points.length:0,a=Array.isArray(e.objects)?e.objects.length:0,s=Object.keys(((n=e.camera)==null?void 0:n.views)??{});return p`
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Astrometrics Studio</h3>
                    <p>
                        <strong>Full-screen workspace</strong> with the live scene: points and objects
                        (tap one on the scene to edit it), camera views and scene settings.
                    </p>
                    <div class="astro-stats">
                        <span><b>${t}</b> point${t===1?"":"s"}</span>
                        <span><b>${a}</b> object${a===1?"":"s"}</span>
                        <span><b>${s.length}</b> view${s.length===1?"":"s"}</span>
                    </div>
                </div>
                <div class="info-card-actions">
                    <ha-button @click=${this._openStudio}>
                        <ha-icon icon="mdi:pencil-ruler" slot="start"></ha-icon>
                        Open Astrometrics Studio
                    </ha-button>
                    <ha-button appearance="plain" @click=${()=>window.open(jt(Wi.astrometricsStudio),"_blank","noopener")}>
                        Docs
                        <ha-icon icon="mdi:open-in-new" slot="end"></ha-icon>
                    </ha-button>
                </div>
            </div>

            <lcards-form-section
                header="Card Identification"
                description="Identification for rules engine targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                ${M.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}
                ${M.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
            </lcards-form-section>

            <lcards-form-section
                header="Sizing"
                description="The scene fills the card"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                <div class="astro-pair">
                    ${M.renderField(this,"height",{label:"Height"})}
                    ${M.renderField(this,"width",{label:"Width"})}
                    ${M.renderField(this,"min_height")}
                    ${M.renderField(this,"max_height")}
                    ${M.renderField(this,"min_width")}
                    ${M.renderField(this,"max_width")}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `}_openStudio(){const e=document.createElement("lcards-astrometrics-studio-dialog");e.hass=this.hass,e.config=JSON.parse(JSON.stringify(this.config||{})),this._studio=e,e.addEventListener("config-changed",t=>{this.config=t.detail.config,this._isUpdatingYaml=true,this._yamlValue=Yi(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false}),dt(this,"config-changed",{config:this.config}),this.requestUpdate()}),Gi(e,()=>{e.remove(),this._studio===e&&(this._studio=null)}),Ki(e,this)}static get styles(){return[...super.styles,ce`
                .astro-stats { display: flex; gap: var(--ha-space-4); margin: var(--ha-space-2) 0 var(--ha-space-1); font-size: 13px; color: var(--primary-text-color); }
                .astro-stats b { color: var(--lcars-ui-primary, var(--primary-color)); }
                .astro-pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-2); }
            `]}};c(Dt,"LCARdSAstrometricsEditor");let At=Dt;customElements.get("lcards-astrometrics-editor")||customElements.define("lcards-astrometrics-editor",At);export{At as LCARdSAstrometricsEditor};
//# sourceMappingURL=lcards-astrometrics-editor-CouYpzEH.js.map
