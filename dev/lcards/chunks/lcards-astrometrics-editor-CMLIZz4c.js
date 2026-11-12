var Ct=Object.defineProperty;var ta=(i,e,t)=>e in i?Ct(i,e,{enumerable:true,configurable:true,writable:true,value:t}):i[e]=t;var c=(i,e)=>Ct(i,"name",{value:e,configurable:true});var Nt=(i,e,t)=>ta(i,typeof e!="symbol"?e+"":e,t);import{b8 as It,b9 as ia,aS as U,aQ as Ci,X as aa,ba as Mt,bb as sa,bc as Lt,bd as na,be as ra,b6 as vt,i as me,a as ae,A as w,b as p,w as A,r as $t,bf as oa,bg as la,bh as Ni,bi as ca,bj as Ii,bk as da,bl as Rt,e as ha,m as Mi,bm as ua,aV as pa,bn as Li,l as Dt,D as Ri,o as Bt,bo as Ut,bp as ma}from"./lcards-main-C148JfkA.js";import{f as at,L as C,a as fa}from"./LCARdSBaseEditor-B4auBUbY.js";import{A as P,c as Di,y as ya}from"./yaml-docs-links-UEyTsmzQ.js";import"./lcards-form-section-BK3OqcgA.js";import{e as ba,n as ga}from"./ref-Bs6vAyng.js";import{r as fe,e as _a,m as wa}from"./lcards-message-CF99Ox_M.js";import{s as va}from"./lcards-studio-yaml-tab-CrleIpRd.js";import{astrometricsSchema as Z,objectSchema as $a}from"./astrometrics-schema-BoIn7y5K.js";import{R as Vt}from"./volume-DZauerbA.js";import"./lcards-color-list-UVQhJ4eh.js";import"./lcards-text-field-editor-DKKzuEoV.js";import"./lcards-background-animation-editor-8VgPdunD.js";import"./lcards-yaml-editor-iu3_W6QT.js";import{B as G}from"./label-text-E3PzdDyx.js";const L=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$a"),Le=c(i=>!!i&&(i===It||Array.isArray(i.allOf)&&i.allOf.includes(It)),"isPlainColor"),st=c(i=>Le(i)||Array.isArray(i==null?void 0:i.anyOf)&&i.anyOf.some(Le)&&i.anyOf.every(e=>Le(e)||W(e)),"isColor"),Ft=c(i=>x(i,"array")&&st(i.items),"isColorArray"),ze=c(i=>L(i==null?void 0:i["x-ui-hints"])?i["x-ui-hints"]:{},"uiHints"),x=c((i,e)=>(i==null?void 0:i.type)===e||Array.isArray(i==null?void 0:i.type)&&i.type.includes(e),"hasType"),K=c(i=>x(i,"number")||x(i,"integer"),"isNumberSchema"),Bi=c(i=>x(i,"array")&&(K(i.items)||!!ye(i.items)),"isNumberArray"),he=c(i=>Bi(i)&&i.minItems!==void 0&&i.minItems===i.maxItems&&i.minItems>=2&&i.minItems<=4,"isTuple"),ka=c(i=>{if(!x(i,"array")||i.minItems!==2||i.maxItems!==2)return false;const e=ye(i.items)??i.items;return K(e)&&Number.isFinite(e.minimum)&&Number.isFinite(e.maximum)},"isRange"),xa=c(i=>ye(i==null?void 0:i.items)??(i==null?void 0:i.items)??{},"rangeItem"),Ht=c(i=>Array.isArray(i==null?void 0:i.oneOf)&&i.oneOf.length===2&&i.oneOf.some(e=>x(e,"string")&&!e.enum)&&i.oneOf.some(e=>he(e)&&e.minItems===3),"isPointRef"),W=c(i=>{var e;return x(i,"object")&&!!((e=i==null?void 0:i.properties)!=null&&e.entity)&&Array.isArray(i==null?void 0:i.required)&&i.required.includes("entity")},"isBindingSchema"),Ce=c(i=>x(i,"string")&&!i.enum&&typeof i.pattern=="string","isTemplateSchema");function ye(i){const e=i==null?void 0:i.anyOf;if(!Array.isArray(e)||!e.some(W))return null;const t=e.filter(a=>!W(a)&&!Ce(a));return t.length===1&&K(t[0])?t[0]:null}c(ye,"settingNumber");const H=c(i=>L(i)&&typeof i.entity=="string","isBoundValue"),X=c(i=>((i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf)??[]).find(W)??null,"bindingBranch");function Sa(i){const e=((i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf)??[]).find(t=>(t==null?void 0:t.type)==="array");return e!=null&&e.items&&X(e.items)?e.items:null}c(Sa,"pairItemSchema");const Aa=c(i=>((i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf)??[]).some(Ce),"takesTemplate"),V=c(i=>typeof i=="string"&&/\[\[\[|\{\{|\{[A-Za-z_]/.test(i),"isTemplateValue"),Re=c(i=>{var e,t;return!!((t=(e=X(i))==null?void 0:e.properties)!=null&&t.views)},"isTour"),ce=c(i=>x(i,"object")&&L(i.properties)&&!i.additionalProperties,"isWalkable"),Oa=new Set(["tap_action","hold_action"]);function re(i,e){var s;if(!L(i)||e&&Oa.has(e))return"yaml";if(st(i))return"color";const t=ze(i).widget;if(t==="font"||i.format==="font-family")return"font";if(t==="rate")return"rate";if(t==="date")return"date";if(t==="shape"&&Array.isArray(i.enum))return"shape";if(t==="textDefault")return"textDefault";if(ka(i))return"range";if(Ft(i))return"colorList";if(Ht(i))return"pointRef";if(ye(i))return"number";const a=i.oneOf??i.anyOf;if(Array.isArray(a)){if(a.length===2&&a.some(r=>x(r,"string")&&!r.enum)&&a.some(W))return"text";const n=a.filter(r=>!W(r)&&!Ce(r));if(n.length===1&&x(n[0],"boolean"))return"boolean";if(n.length===2){if(n.some(st)&&n.some(Ft))return"colorList";if(n.some(K)&&n.some(he))return"numberOrTuple";if(n.some(r=>x(r,"boolean"))&&n.some(ce))return"boolOrObject";if(n.some(r=>x(r,"boolean"))&&n.some(K))return"boolOrNumber";if(n.some(r=>x(r,"boolean"))&&n.some(r=>x(r,"array")&&x(r.items,"string")))return"boolOrList";if(n.some(ce)&&n.some(r=>!ce(r)&&!x(r,"boolean")))return"valueOrObject"}return Ui(i)?"choice":"yaml"}return i.const!==void 0?"yaml":Array.isArray(i.enum)&&i.enum.every(n=>typeof n=="string")?"enum":x(i,"boolean")&&!Array.isArray(i.type)?"boolean":K(i)&&!Array.isArray(i.type)?"number":x(i,"string")&&(i.assetSource==="model"||i.assetSource==="image")?"asset":x(i,"string")&&!Array.isArray(i.type)||Array.isArray(i.type)&&i.type.every(n=>["string","number","integer"].includes(n))?"text":x(i,"array")?he(i)?"tuple":Bi(i)?"numbers":x(i.items,"string")&&!i.items.enum?"strings":Ht(i.items)?"pointList":L((s=i.items)==null?void 0:s.properties)?"objectList":"yaml":ce(i)?"object":"yaml"}c(re,"fieldKind");function Ui(i){const e=(i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf);if(!Array.isArray(e))return null;const t=e.filter(r=>!W(r)&&!Ce(r)),a=t.filter(r=>x(r,"string")&&Array.isArray(r.enum)),s=t.some(r=>x(r,"boolean")),n=t.some(K);return!a.length||a.length+(s?1:0)+(n?1:0)!==t.length?null:{words:a.flatMap(r=>r.enum),bool:s,number:n}}c(Ui,"choiceOptions");function ja(i,{bool:e,number:t}){if(i===""||i===void 0||i===null)return;if(e&&(i==="true"||i===true))return true;if(e&&(i==="false"||i===false))return false;const a=Number(i);return t&&String(i).trim()!==""&&Number.isFinite(a)?a:String(i)}c(ja,"choiceValue");function Ta(i){const e=ze(i).selector;if(e!=null&&e.number)return e;const t=ye(i)??i,a=x(t,"integer"),{minimum:s,maximum:n}=t??{};return Number.isFinite(s)&&Number.isFinite(n)?{number:{mode:"slider",min:s,max:n,step:a?1:"any"}}:{number:{mode:"box",min:s,max:n,step:a?1:"any"}}}c(Ta,"numberSelector");function Ea(i,e){const t=String(i??""),a=t.match(/(per )?scene units?(\s*\/\s*s\b| a second| per second)?/);if(a&&!a[1])return`${e||"units"}${a[2]?"/s":""}`;if(/\bpx (per|a) second\b/.test(t))return"px/s";if(/\bpx\b|\bpixels\b/.test(t))return"px";if(/\bmetres\b/.test(t))return"m"}c(Ea,"unitSuffix");function Pa(i,e,t){return t&&/scene units/.test(String(e??""))?`${i} (${t})`:i}c(Pa,"unitsLabel");const za=[{id:"main",header:"",icon:""},{id:"appearance",header:"Appearance",icon:"mdi:palette-outline"},{id:"position",header:"Position and motion",icon:"mdi:axis-arrow"},{id:"visibility",header:"Visibility and distance",icon:"mdi:map-marker-distance"},{id:"actions",header:"Actions and tags",icon:"mdi:gesture-tap"},{id:"advanced",header:"Advanced",icon:"mdi:tune-variant"}],Ca={appearance:["opacity"],position:["at","rotation","face","spin"],visibility:["visible","min_distance","max_distance","fade","hide_in_systems","look"],actions:["tags","tap_action","hold_action","view"]},Na=/(^|_)(colou?rs?|opacity|glow|dash|blend|material|scanlines|edges)$|^(colou?r_|line_width|width|image|scan|fill$|style|falloff|pulse$)/,Ia=new Set(["occlude"]);function Ma(i,e){const t=ze(e).group;if(typeof t=="string")return t;for(const[a,s]of Object.entries(Ca))if(s.includes(i))return a;return Ia.has(i)?"advanced":Na.test(i)?"appearance":"main"}c(Ma,"groupOf");const La={backdrop:"mdi:weather-night",stars:"mdi:star-four-points-outline",dust:"mdi:blur",labels:"mdi:label-outline",clock:"mdi:clock-outline",buttons:"mdi:gesture-tap-button",limits:"mdi:arrow-expand-all",target:"mdi:crosshairs",fill:"mdi:texture-box",effect:"mdi:texture-box",deform:"mdi:waves",cells:"mdi:grid",ring_labels:"mdi:label-multiple-outline",axis_labels:"mdi:label-multiple-outline",pulse:"mdi:pulse",clouds:"mdi:weather-cloudy",text:"mdi:format-text",default:"mdi:format-text",styles:"mdi:format-list-text",outline:"mdi:vector-polygon",animation:"mdi:animation-play",sky:"mdi:weather-sunset",body:"mdi:earth",orbit:"mdi:orbit",well:"mdi:chart-bell-curve",edges:"mdi:vector-square",major:"mdi:grid-large",scan:"mdi:radar",band:"mdi:ring",faces:"mdi:cube-outline",rim:"mdi:circle-outline",core:"mdi:circle-slice-8",nucleus:"mdi:circle-small",coma:"mdi:blur-radial",tail:"mdi:arrow-right-thin",ion_tail:"mdi:arrow-right-thin",dust_tail:"mdi:weather-windy",activity:"mdi:sun-thermometer-outline",arms:"mdi:rotate-orbit",bar:"mdi:minus",spectrum:"mdi:looks",glow:"mdi:brightness-7"};function q(i,e){const t=La[i];return t||(e==="objectList"?"mdi:format-list-bulleted":e==="item"?"mdi:circle-medium":e==="yaml"?"mdi:code-braces":"mdi:tune-variant")}c(q,"sectionIcon");const nt=c(i=>((i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf)??[]).find(ce)??null,"objectAlternative");function Ra(i){const e=nt(i);if(!e)return null;const t=(i.oneOf??i.anyOf).find(s=>s!==e),a=Object.keys(e.properties);return a.find(s=>e.properties[s]===t)??a[0]??null}c(Ra,"shorthandKey");function Kt(i,e){for(const t of String(i??"").matchAll(/\[([^\]]+)\]/g)){const a=t[1].split(",").map(s=>s.trim());if(a.length===e&&a.every(s=>s&&s.length<=16&&!/^-?\d/.test(s)))return a}return Array.from({length:e},(t,a)=>String(a+1))}c(Kt,"tupleLabels");const Da=c(i=>{var e,t;return he(i)?i.minItems:((t=(e=(i==null?void 0:i.oneOf)??(i==null?void 0:i.anyOf))==null?void 0:e.find(he))==null?void 0:t.minItems)??0},"tupleSize");function ve(i){const e=String(i).replace(/_/g," ");return e.charAt(0).toUpperCase()+e.slice(1)}c(ve,"labelFor");function De(i){const e=String(i??"").trim();if(!e)return"";const t=e.split(new RegExp("(?<=[.!?])\\s+")).map(n=>n.trim()).filter(Boolean),a=t[0],s=t.slice(1).find(n=>/^Default\b/.test(n));return s?`${a} ${s}`:a}c(De,"helperText");function Ba(i,e){const t=String(i??"").split(/;\s+/).map(n=>Ua(n,e)),a=t[0];if(!a||a.values===null)return a;const s=new Set(a.values);for(const n of t.slice(1))n&&n.key===a.key&&n.values&&n.values.forEach(r=>s.add(r));return{key:a.key,values:[...s]}}c(Ba,"scopeOf");function Ua(i,e){var r;const t=/^([a-z_]+(?: [a-z_]+)?(?:(?:, | or | and )[a-z_]+)*)(?: \([^)]*\))?:\s/.exec(i);if(!t)return null;const a=t[1],s=/^([a-z_]+) ([a-z_]+)$/.exec(a);if(s&&Array.isArray((r=e[s[1]])==null?void 0:r.enum)&&e[s[1]].enum.includes(s[2]))return{key:s[1],values:[s[2]]};const n=a.split(/, | or | and /).map(l=>l.trim());if(n.some(l=>l.includes(" ")))return null;for(const[l,o]of Object.entries(e)){const d=Array.isArray(o==null?void 0:o.enum)?o.enum:null;if(d&&n.every(u=>d.includes(u)))return{key:l,values:n}}return n.length===1&&e[n[0]]!==void 0?{key:n[0],values:null}:null}c(Ua,"scopeOfSegment");function Va(i,e,t){var n,r;if((t==null?void 0:t[i])!==void 0)return true;const a=Ba((n=e[i])==null?void 0:n.description,e);if(!a||a.key===i)return true;const s=(t==null?void 0:t[a.key])??((r=e[a.key])==null?void 0:r.default);return a.values===null?s!==void 0:s===void 0?true:a.values.includes(s)}c(Va,"appliesTo");function Fa(i,e){const t=((i==null?void 0:i.oneOf)??[]).find(n=>{var r,l;return((l=(r=n==null?void 0:n.properties)==null?void 0:r.type)==null?void 0:l.const)===e});if(!t)return null;const a={};for(const n of t.allOf??[])Object.assign(a,(n==null?void 0:n.properties)??{});const s={...t.properties};delete s.type;for(const n of Object.keys(s))delete a[n];return{branch:t,own:s,common:a}}c(Fa,"objectBranch");const Se=c(i=>i==null||i===""||typeof i=="number"&&Number.isNaN(i)||Array.isArray(i)&&i.length===0||L(i)&&Object.keys(i).length===0,"isUnset");function Be(i,e,t){const a={...i??{}};return Se(t)?delete a[e]:a[e]=t,a}c(Be,"withKey");function Ha(i){const e=String(i??"").split(/[\s,]+/).filter(Boolean).map(Number).filter(t=>Number.isFinite(t));return e.length?e:void 0}c(Ha,"parseNumbers");function Ka(i){if(!L(i))return"";const e=[i.shape??i.material??i.sky].filter(Boolean).map(String),t=i.radius??i.size;(typeof t=="number"||Array.isArray(t))&&e.push(Array.isArray(t)?t.map(s=>H(s)?"entity":V(s)?"template":s).join(" x "):String(t)),i.type==="system"&&i.units&&e.push(`in ${i.units}`),typeof i.at=="string"&&e.push(`at ${i.at}`),!e.length&&typeof i.from=="string"&&typeof i.to=="string"&&e.push(`${i.from} to ${i.to}`),!e.length&&i.type==="path"&&Array.isArray(i.points)&&e.push(`${i.points.length} points`),!e.length&&typeof i.point=="string"&&e.push(`behind ${i.point}`),i.visible===false&&e.push("hidden");const a=ee(i);return a.length&&e.push(`follows ${a.join(", ")}`),e.join(" · ")}c(Ka,"objectSummary");const Wa=new Set(["label","text","tap_action","hold_action","card"]);function ee(i){const e=new Set,t=c(a=>{if(H(a)){e.add(a.entity?String(a.entity):"an entity");return}if(typeof a=="string"){/\[\[\[|\{\{|\{[A-Za-z_]/.test(a)&&e.add("a template");return}if(Array.isArray(a)){a.forEach(t);return}if(L(a))for(const[s,n]of Object.entries(a))Wa.has(s)||t(n)},"walk");return t(i),[...e]}c(ee,"boundIn");const Ya=c((i,e)=>e.some(t=>ee(i==null?void 0:i[t]).length>0),"keysBound");function rt(i,e){const t=new Set([...e].map(String));let a=1;for(;t.has(`${i}${a}`);)a++;return`${i}${a}`}c(rt,"freshId");const Wt={grid:c(i=>({size:200*i,line_spacing:10*i}),"grid"),volume:c(i=>({radius:[50*i,100*i],height:[0,10*i]}),"volume"),sphere:c(i=>({radius:10*i}),"sphere"),image:c(i=>({size:200*i}),"image"),glow:c(i=>({size:60*i}),"glow"),nebula:c(i=>({radius:100*i}),"nebula"),model:c(i=>({size:50*i}),"model"),belt:c(i=>({radius:[80*i,100*i],size:[.4*i,1.6*i]}),"belt"),asteroid:c(i=>({size:4*i}),"asteroid"),comet:c(i=>({nucleus:{size:2*i},coma:{size:10*i},tail:{length:60*i}}),"comet"),cube:c(i=>({size:20*i}),"cube")},Ga=new Set(["path","beam","trail"]);function qa(i){if(!(i>0)||!Number.isFinite(i))return 1;const e=i/280;if(e>=1/3&&e<=3)return 1;const t=Math.floor(Math.log10(e)),a=e/10**t,s=a<1.5?1:a<3.5?2:a<7.5?5:10;return Number((s*10**t).toPrecision(1))}c(qa,"viewScale");function Ja(i,e,t,a={}){const s={type:i,id:rt(i,e)},n=a.scale??1,r=a.at,l=Array.isArray(r)?r:[0,0,0],o=c(y=>[l[0]+y*n,l[1],l[2]].map(N),"end");r!==void 0&&!Ga.has(i)&&(s.at=r);const[d,u]=t;switch(i){case"model":s.src="builtin:constitution_class_refit";break;case"ring":s.radius=N(50*n);break;case"path":d&&u?s.points=[d,u]:s.points=[o(-50),o(50)];break;case"beam":s.from=d??o(-50),s.to=u??o(50);break;case"trail":d&&(s.point=d);break;case"galaxy":s.radius=N(100*n);break}if(n!==1&&Wt[i]&&!(i==="model"&&a.real)){const y=c(h=>Array.isArray(h)?h.map(N):L(h)?Object.fromEntries(Object.entries(h).map(([m,f])=>[m,y(f)])):N(h),"scaled");for(const[h,m]of Object.entries(Wt[i](n)))s[h]=y(m)}return s}c(Ja,"newObject");function Qa(i,e){if(!i||e.shape===i.shape)return e;const t={...e},a=c(n=>Array.isArray(n)?Number(n[1]??n[0]):Number(n),"outer"),s=c(n=>Array.isArray(n)?Math.max(...n.map(Number)):Number(n),"widest");if(i.type==="grid"){const n=(e.shape??"plane")==="plane";n&&t.size===void 0&&i.radius!==void 0&&(t.size=N(a(i.radius)*2)),!n&&t.radius===void 0&&i.size!==void 0&&(t.radius=N(s(i.size)/2))}else if(i.type==="volume"&&(e.shape==="box"&&t.size===void 0&&i.radius!==void 0&&(t.size=N(a(i.radius))),(e.shape??"sector")==="sector"&&t.radius===void 0&&i.size!==void 0)){const n=s(i.size);t.radius=[N(n/2),N(n)]}return t}c(Qa,"reshape");function N(i){return Number.isFinite(i)&&i!==0?Number(i.toPrecision(3)):i}c(N,"round");const Za=40,Xa=.1,ie=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$9");function I(i){return ie(i)&&ie(i.views)?i.views:{}}c(I,"viewsOf");function es(i){const e=I(i),t=i==null?void 0:i.view;return t!==void 0&&e[t]?String(t):Object.keys(e)[0]}c(es,"startViewName");function ts(i,e){let t=null,a=Xa;for(const[s,n]of Object.entries(e)){const r=Math.hypot(n[0]-i[0],n[1]-i[1],n[2]-i[2]);r<=a&&(t=s,a=r)}return t}c(ts,"pointAt");function is(i,e,t={}){const{fov:a,projection:s,...n}=ie(t)?t:{},r={...n,target:ts(i.target,e)??i.target,yaw:i.yaw,tilt:i.tilt,distance:i.distance};return i.projection==="orthographic"?r.projection="orthographic":(i.fov!==Za||(t==null?void 0:t.fov)!==void 0)&&(r.fov=i.fov),r}c(is,"captureView");function as(i){let e=1;for(;`view${e}`in i;)e++;return`view${e}`}c(as,"freshViewName");function ue(i,e){const t={...ie(i)?i:{}};return Object.keys(e).length?t.views=e:delete t.views,t.view!==void 0&&!(t.view in e)&&delete t.view,Object.keys(t).length?t:void 0}c(ue,"withViews");function Yt(i,e,t){return ue(i,{...I(i),[e]:t})}c(Yt,"setView");function ss(i,e){const{[e]:t,...a}=I(i);return ue(i,a)}c(ss,"deleteView");function Gt(i,e,t){const a=Object.entries(I(i)),s=a.findIndex(([r])=>r===e),n=s+t;return s<0||n<0||n>=a.length?ue(i,I(i)):([a[s],a[n]]=[a[n],a[s]],ue(i,Object.fromEntries(a)))}c(Gt,"moveView");function ns(i,e,t){return e.trim()?e!==t&&e in i?`There is already a view named ${e}.`:null:"A view needs a name."}c(ns,"viewNameProblem");function rs(i,e,t){if(e===t)return i;const a=i.camera,s=Object.fromEntries(Object.entries(I(a)).map(([r,l])=>[r===e?t:r,l])),n=ot({...i},e,t);return n.camera={...ue(a,s),...(a==null?void 0:a.view)===e?{view:t}:{}},n}c(rs,"renameView");function ot(i,e,t){if(Array.isArray(i))return i.map(s=>ot(s,e,t));if(!ie(i))return i;const a={};for(const[s,n]of Object.entries(i))a[s]=s==="camera"?n:ot(n,e,t);return a.action==="fly-to"&&a.view===e&&a.card===void 0&&(a.view=t),a}c(ot,"renameFlyTo");function os(i){if(!ie(i))return"";const e=c(a=>typeof a=="number"?Math.round(a*10)/10:a,"r"),t=Array.isArray(i.target)?i.target.map(e).join(", "):i.target;return[t!==void 0?`at ${t}`:null,i.yaw!==void 0?`yaw ${e(i.yaw)}`:null,i.tilt!==void 0?`tilt ${e(i.tilt)}`:null,i.distance!==void 0?`distance ${e(i.distance)}`:null,i.projection==="orthographic"?"flat":null].filter(Boolean).join(" · ")}c(os,"viewSummary");const ls={id:"galaxy",kind:"scene",title:"Galaxy with territories",summary:"A galaxy disc with Federation and Borg space and a route",description:"A galaxy disc with its core, Federation and Borg space as see-through volumes, crossing beams, a planet with an away team (it appears as you fly in) and a route between two stars.",icon:"mdi:star-four-points-outline",params:[],build:c(()=>({views:{galaxy:{target:"core",yaw:20,tilt:35,distance:280},map:{target:"core",tilt:90,distance:300},planet:{target:"nimbus",yaw:60,tilt:20,distance:40}},camera:{view:"galaxy"},backdrop:{stars:{count:2500}},points:[{id:"core",xyz:[0,0,0],label:"GALACTIC CORE",style:"title"},{id:"sagittarius",polar:[45,300],label:"Sagittarius Arm",style:"major"},{id:"federation",polar:[75,135],alt:22,label:"FEDERATION",style:"major",color:"var(--lcars-blue)"},{id:"borg",polar:[30,345],alt:44,label:"BORG SPACE",style:"major",color:"var(--lcars-green)"},{id:"talos",polar:[52,310],marker:"dot",label:"Talos IV",style:"tiny",max_distance:200},{id:"vega",polar:[64,160],marker:"triangle",label:"Vega",style:"minor"},{id:"nimbus",polar:[72,236],alt:12,marker:"reticle",label:"NIMBUS III",tap_action:{action:"fly-to",view:"planet"}},{id:"away",latlon:[10,40],object:"planet",alt:.3,marker:"dot",label:"AWAY TEAM",style:"tiny",color:"var(--lcars-orange)",max_distance:100}],objects:[{type:"grid",shape:"disc",radius:100,pattern:"polar",line_spacing:10,spoke_count:36,major:{row_interval:3},ring_labels:{step:10,radius:106}},{type:"ring",radius:100,width:3,color:"theme:colors.ui.secondary"},{type:"volume",id:"federation_space",shape:"sector",radius:[55,95],angle:[100,170],height:[-6,18],cells:{ring:10,angle:10,layer:8},color:"var(--lcars-blue)",tap_action:{action:"fly-to"}},{type:"volume",shape:"sector",radius:[18,42],angle:[330,360],height:[0,40],color:"var(--lcars-green)"},{type:"glow",at:"core",size:70},{type:"beam",from:[-180,0,0],to:[180,0,0]},{type:"beam",from:[0,0,-180],to:[0,0,180]},{type:"sphere",id:"planet",at:"nimbus",radius:6,spin:8,max_distance:100},{type:"ring",at:"nimbus",radius:10,inclination:20,width:1.5,max_distance:100},{type:"path",points:["talos","vega"],arc:12,dash:[6,4],color:"var(--lcars-orange)"}]}),"build")},cs={id:"sector_map",kind:"scene",title:"Sector map",summary:"A flat lettered grid, seen from above, filled cell by cell",description:"A flat lettered grid seen from straight above, territories filled cell by cell; the tilt is locked, so a drag pans the map.",icon:"mdi:grid",params:[],build:c(()=>({views:{map:{target:[0,0,0],tilt:90,distance:1250,projection:"orthographic"}},camera:{view:"map",limits:{tilt:[90,90]}},objects:[{type:"grid",id:"sectors",shape:"plane",size:[1200,600],line_spacing:40,axis_labels:{columns:"letters",rows:"numbers",column_start:"AD"},cells:[{from:"AF3",to:"AH6",color:"var(--lcars-blue)",opacity:.3,shade:.4,edges:true},{from:"AL2",to:"AO5",color:"var(--lcars-green)",opacity:.25,shade:.4},{from:"AL9",to:"AP12",color:"var(--lcars-red)",opacity:.3,shade:.4}]}],points:[{id:"ufp",cell:"AG4",object:"sectors",label:"UNITED FEDERATION OF PLANETS",style:"major"},{id:"sb10",cell:"AJ2",object:"sectors",offset:[8,0,12],marker:"triangle",label:"Starbase 10"},{id:"achernar",cell:"AN3",object:"sectors",marker:"diamond",label:"Achernar"},{id:"qualor",cell:"AL6",object:"sectors",marker:"dot",label:"Qualor",style:"tiny",max_distance:1300}]}),"build")},ds={id:"sky_dome",kind:"scene",title:"Sky dome: the sun and moon",summary:"The sun and moon over your home, where they are now",description:"A dome over your home with the sun and moon where they are now and today's tracks across the sky, from your Home Assistant location.",icon:"mdi:weather-sunset",params:[],build:c(()=>({views:{horizon:{target:[0,15,0],yaw:180,tilt:28,distance:260},zenith:{target:[0,0,0],tilt:90,distance:260}},camera:{view:"horizon"},objects:[{type:"grid",id:"sky",shape:"dome",radius:100,pattern:"both",line_spacing_deg:15},{type:"ring",radius:100,width:3,color:"theme:colors.ui.primary"},{type:"path",sky:"sun",object:"sky",dash:[6,4],color:"var(--lcars-yellow)"},{type:"path",sky:"moon",object:"sky",dash:[6,4],color:"var(--lcars-blue)"}],points:[{id:"sun",sky:"sun",object:"sky",marker:"reticle",label:"SOL"},{id:"moon",sky:"moon",object:"sky",marker:"moon_phase",label:"LUNA"},{id:"north",altaz:[0,0],object:"sky",label:"N",style:"major",overlap:true},{id:"east",altaz:[90,0],object:"sky",label:"E",style:"major",overlap:true},{id:"south",altaz:[180,0],object:"sky",label:"S",style:"major",overlap:true},{id:"west",altaz:[270,0],object:"sky",label:"W",style:"major",overlap:true}]}),"build")},qt=[["mercury","MERCURY",20,1.2,24,40,7,48.3],["venus","VENUS",30,2,16,150,3.39,76.7],["earth","EARTH",42,2.4,10,250,0,0],["mars","MARS",56,1.6,6,320,1.85,49.6],["jupiter","JUPITER",82,5,2.5,100,1.3,100.5],["saturn","SATURN",112,4.2,1.6,200,2.49,113.7],["uranus","URANUS",138,3,1.1,20,.77,74],["neptune","NEPTUNE",160,3,.8,280,1.77,131.8],["pluto","PLUTO",184,.9,.55,160,17.16,110.3]],hs={mercury:{image:"builtin:mercury_messenger"},venus:{fill:{effect:{preset:"clouds"}}},earth:{image:"builtin:earth_blue_marble"},mars:{image:"builtin:mars_viking"},jupiter:{image:"builtin:jupiter_cassini"},saturn:{fill:{effect:{preset:"ringed_giant"}}},uranus:{fill:{effect:{preset:"ice_giant"}}},neptune:{fill:{effect:{preset:"storm_giant"}}},pluto:{image:"builtin:pluto_new_horizons"}},us={id:"solar_system",kind:"scene",title:"Solar system",summary:"The Sun, eight planets and Pluto on their tilted orbits, with maps",description:"The Sun, eight planets and Pluto, each orbit tilted as the real one is and each planet with its map or planet type, Saturn with its rings and the Moon going round the Earth. Tap a planet to fly to it.",icon:"mdi:orbit",params:[],build:c(()=>({views:{system:{target:"sun",yaw:20,tilt:40,distance:440},top:{target:"sun",tilt:90,distance:460},earth:{target:"earth",yaw:30,tilt:20,distance:22}},camera:{view:"system"},backdrop:{stars:{count:2e3}},points:[{id:"sun",xyz:[0,0,0],label:"SOL",style:"major"},...qt.map(([i,e,t,,,a])=>({id:i,polar:[t,a],object:`${i}_orbit`,marker:"dot",label:e,style:"minor",tap_action:{action:"fly-to"}})),{id:"moon",polar:[5,0],object:"moon_orbit",marker:"dot",label:"LUNA",style:"tiny",max_distance:80}],objects:[{type:"glow",at:"sun",size:40,color:"var(--lcars-yellow)"},{type:"sphere",id:"sun_body",at:"sun",radius:5,fill:{color:"var(--lcars-yellow)"},color:"var(--lcars-orange)",line_spacing_deg:30},...qt.flatMap(([i,,e,t,a,,s,n])=>[{type:"ring",id:`${i}_orbit`,radius:e,spin:a,width:1,color:"theme:colors.ui.secondary",opacity:.6,...s?{rotation:[s,n,0]}:{}},{type:"sphere",id:`${i}_body`,at:i,radius:t,...hs[i],line_spacing_deg:30,line_width:.5,spin:i==="earth"?20:15}]),{type:"ring",id:"saturn_rings",at:"saturn",radius:9.8,inclination:27,band:{image:"builtin:saturn_rings",inner_radius:4.66}},{type:"ring",id:"moon_orbit",at:"earth",radius:5,spin:40,width:1,dash:[3,3],opacity:.6,max_distance:80},{type:"sphere",id:"moon_body",at:"moon",radius:.6,image:"builtin:moon_lroc",line_spacing_deg:45,line_width:.5,max_distance:80}]}),"build")},ps={id:"federation_map",kind:"scene",title:"Federation map",summary:"The Alpha and Beta Quadrant powers as territories on a disc",description:"The Alpha and Beta Quadrant powers as territories on a disc, their capitals, the Romulan Neutral Zone and a route from Earth to Qo'noS.",icon:"mdi:map-legend",params:[],build:c(()=>({views:{overview:{target:[0,0,-10],yaw:200,tilt:50,distance:350},top:{target:[0,0,0],tilt:90,distance:300,projection:"orthographic"},sol:{target:"earth",yaw:220,tilt:35,distance:80}},camera:{view:"overview"},backdrop:{stars:{count:1500}},points:[{id:"federation",polar:[60,165],alt:14,label:"UNITED FEDERATION OF PLANETS",style:"major",color:"var(--lcars-blue)"},{id:"klingon",polar:[80,45],alt:14,label:"KLINGON EMPIRE",style:"major",color:"var(--lcars-red)"},{id:"romulan",polar:[90,320],alt:14,label:"ROMULAN STAR EMPIRE",style:"major",color:"var(--lcars-green)"},{id:"cardassian",polar:[85,235],alt:14,label:"CARDASSIAN UNION",style:"major",color:"var(--lcars-orange)"},{id:"earth",polar:[45,170],marker:"reticle",label:"Earth",tap_action:{action:"fly-to",view:"sol"}},{id:"vulcan",polar:[52,150],marker:"dot",label:"Vulcan",style:"tiny"},{id:"qonos",polar:[80,40],marker:"diamond",label:"Qo'noS"},{id:"romulus",polar:[95,325],marker:"diamond",label:"Romulus"},{id:"cardassia",polar:[90,230],marker:"diamond",label:"Cardassia Prime"},{id:"neutral_zone",polar:[60,330],label:"NEUTRAL ZONE",style:"tiny",color:"var(--lcars-green)"}],objects:[{type:"grid",shape:"disc",radius:130,pattern:"polar",line_spacing:10,spoke_count:36,major:{row_interval:3},opacity:.6},{type:"ring",radius:130,width:2,color:"theme:colors.ui.secondary"},{type:"volume",id:"federation_space",shape:"sector",radius:[25,75],angle:[130,200],height:[-4,6],color:"var(--lcars-blue)",tap_action:{action:"fly-to"}},{type:"volume",id:"klingon_space",shape:"sector",radius:[50,110],angle:[15,75],height:[-4,6],color:"var(--lcars-red)",tap_action:{action:"fly-to"}},{type:"volume",id:"romulan_space",shape:"sector",radius:[65,120],angle:[295,350],height:[-4,6],color:"var(--lcars-green)",tap_action:{action:"fly-to"}},{type:"volume",id:"cardassian_space",shape:"sector",radius:[60,115],angle:[210,255],height:[-4,6],color:"var(--lcars-orange)",tap_action:{action:"fly-to"}},{type:"ring",radius:62,arc:[295,350],width:2,dash:[6,4],color:"var(--lcars-green)"},{type:"path",points:["earth","qonos"],arc:10,dash:{pattern:[6,4],speed:20},color:"var(--lcars-orange)"},{type:"glow",at:[0,0,0],size:40,opacity:.6}]}),"build")},ms={id:"starbase_approach",kind:"scene",title:"Starbase approach",summary:"A starship flying into Earth Spacedock, to scale",description:"The built-in refit Constitution-class starship on its way into Earth Spacedock through the space doors, with its bridge and nacelles marked and the approach lane drawn. To scale: the ship is 305 m long, Spacedock about 5.5 km tall and its doors 700 m wide.",icon:"mdi:space-station",params:[],build:c(()=>({views:{approach:{target:[0,90,15],yaw:125,tilt:20,distance:300},starbase:{target:"dock",yaw:200,tilt:30,distance:420},ship:{target:"ship_centre",yaw:140,tilt:25,distance:50}},camera:{view:"approach"},backdrop:{stars:{count:2e3}},points:[{id:"ship_centre",xyz:[0,129,41]},{id:"ship_name",at:"ship_centre",offset:[0,12,0],label:"USS ENTERPRISE",style:"major",tap_action:{action:"fly-to",view:"ship"}},{id:"bridge",object:"ship",part:"bridge",marker:"dot",label:"BRIDGE",style:"tiny"},{id:"port",object:"ship",part:"nacelle_port",marker:"dot",label:"PORT NACELLE",style:"tiny"},{id:"starboard",object:"ship",part:"nacelle_starboard",marker:"dot",label:"STARBOARD NACELLE",style:"tiny"},{id:"doors",xyz:[0,62,-9],marker:"dot",label:"SPACE DOORS",style:"minor"},{id:"dock",at:"doors",offset:[0,50,0],label:"SPACEDOCK",style:"major",tap_action:{action:"fly-to",view:"starbase"}}],objects:[{type:"model",id:"ship",src:"builtin:constitution_class_refit",at:"ship_centre",size:26.7,rotation:[0,180,0],scan:{period:6},animation:"all"},{type:"model",id:"spacedock",src:"builtin:earth_spacedock",at:[0,-110,-110],size:480,material:"original"},{type:"path",points:["ship_centre","doors"],dash:{pattern:[4,6],speed:-30},color:"var(--lcars-orange)"}]}),"build")},fs={id:"deep_space_nine",kind:"scene",title:"Deep Space 9",summary:"Deep Space 9 with its parts marked, the wormhole and Bajor",description:"The built-in Deep Space 9 station with Ops, the Promenade and its docking pylons marked, the Bajoran wormhole off its bow and Bajor below. Tap a name to fly to it.",icon:"mdi:space-station",params:[],build:c(()=>({views:{station:{target:"ds9_centre",yaw:30,tilt:10,distance:190},ops:{target:"ops",yaw:50,tilt:25,distance:70},wormhole:{target:"wormhole",yaw:150,tilt:8,distance:120},sector:{target:[0,-40,120],yaw:60,tilt:20,distance:520}},camera:{view:"station"},backdrop:{stars:{count:2500}},points:[{id:"ds9_centre",xyz:[0,0,0]},{id:"ds9_name",at:"ds9_centre",offset:[0,70,0],label:"DEEP SPACE 9",style:"major",tap_action:{action:"fly-to",view:"station"}},{id:"ops",object:"ds9",part:"ops",marker:"dot",label:"OPS",style:"minor",tap_action:{action:"fly-to",view:"ops"}},{id:"promenade",object:"ds9",part:"promenade",marker:"dot",label:"PROMENADE",style:"tiny"},{id:"habitat",object:"ds9",part:"habitat_ring",marker:"dot",label:"HABITAT RING",style:"tiny"},{id:"pylon1",object:"ds9",part:"upper_pylon_1",marker:"dot",label:"UPPER PYLON 1",style:"tiny"},{id:"pylon2",object:"ds9",part:"upper_pylon_2",marker:"dot",label:"UPPER PYLON 2",style:"tiny"},{id:"pylon3",object:"ds9",part:"upper_pylon_3",marker:"dot",label:"UPPER PYLON 3",style:"tiny"},{id:"wormhole",xyz:[0,10,300],label:"BAJORAN WORMHOLE",style:"minor",tap_action:{action:"fly-to",view:"wormhole"}},{id:"bajor",xyz:[-160,-260,-40]},{id:"bajor_name",at:"bajor",offset:[0,30,125],label:"BAJOR",style:"minor"}],objects:[{type:"model",id:"ds9",src:"builtin:deep_space_nine",at:"ds9_centre",size:100,material:"original"},{type:"glow",at:"wormhole",size:90,color:"var(--lcars-blue)"},{type:"glow",at:"wormhole",size:40,color:"var(--lcards-moonlight)"},{type:"ring",at:"wormhole",radius:26,rotation:[90,0,0],spin:40,dash:[2,4],width:1.5,color:"var(--lcars-blue)"},{type:"sphere",at:"bajor",radius:120,fill:{effect:{preset:"terran"}},line_spacing_deg:30,line_width:.5,opacity:.3,spin:3}]}),"build")},lt=[0,0,26e3],de=c((i,e,t=0)=>[i,t,lt[2]+e],"nearSol"),ys=[[-.0548755604,-.8734370902,-.4838350155],[.4941094279,-.44482963,.7469822445],[-.867666149,-.1980763734,.4559837762]];function bs(i,e,t){const a=i*15*Math.PI/180,s=e*Math.PI/180,n=[Math.cos(s)*Math.cos(a),Math.cos(s)*Math.sin(a),Math.sin(s)],r=ys.map(o=>o[0]*n[0]+o[1]*n[1]+o[2]*n[2]),l=c(o=>Math.round(o*100)/100,"r");return[l(-r[1]*t),l(r[2]*t),l(-r[0]*t)]}c(bs,"starOffset");const gs=[["vulcan","Vulcan (40 Eridani)",4.2545,-7.6529,16.26,"dot","var(--lcars-blue)"],["andoria","Andoria (Procyon)",7.655,5.225,11.46,"dot","var(--lcars-blue)"],["tellar","Tellar (61 Cygni)",21.115,38.7494,11.4,"dot","var(--lcars-blue)"],["alpha_centauri","Alpha Centauri",14.66,-60.834,4.37,"dot","var(--lcards-moonlight)"],["wolf_359","Wolf 359",10.9414,7.0147,7.86,"dot","var(--lcards-moonlight)"],["vega","Vega",18.6156,38.7837,25.04,"dot","var(--lcards-moonlight)"],["altair","Altair",19.8464,8.8683,16.73,"dot","var(--lcards-moonlight)"]],_s=[["qonos","Qo'noS",64,-90,"diamond","var(--lcars-red)"],["romulus","Romulus",112,26,"diamond","var(--lcars-green)"],["remus","Remus",113,27.5,"dot","var(--lcars-green)"],["bajor","Bajor",-46,24,"diamond","var(--lcars-yellow)"],["cardassia","Cardassia Prime",-50.9,26,"diamond","var(--lcars-orange)"]],Jt=[["federation","UNITED FEDERATION OF PLANETS","var(--lcars-blue)",[[-4800,23200],[-1200,21800],[2200,23e3],[2600,27200],[800,3e4],[-3200,30400],[-5200,27600]],[-1200,26e3],true],["klingon","KLINGON EMPIRE","var(--lcars-red)",[[2400,22600],[6200,21400],[8400,24200],[7400,27600],[3e3,27e3]],[5600,24400],true],["romulan","ROMULAN STAR EMPIRE","var(--lcars-green)",[[2800,27400],[7200,28e3],[7800,31800],[3600,32600],[1200,30400]],[4800,30200],true],["cardassian","CARDASSIAN UNION","var(--lcars-orange)",[[-5400,27800],[-8800,26600],[-10400,29600],[-8200,32200],[-4600,31e3]],[-7600,29400],true],["dominion","THE DOMINION","var(--lcars-violet)",[[-3e4,-27e3],[-41e3,-22e3],[-46e3,-32e3],[-4e4,-41e3],[-29e3,-37e3]],[-41e3,-25500],false],["borg","BORG COLLECTIVE","var(--lcars-green)",[[14e3,-14e3],[3e4,-1e4],[4e4,-24e3],[32e3,-4e4],[16e3,-34e3],[1e4,-22e3]],[24e3,-24e3],false]],Qt=[["ocampa","OCAMPA",37e3,-33e3],["nekrit","Nekrit Expanse",31e3,-22e3],["northwest_passage","Northwest Passage",22e3,-9e3],["endgame","Transwarp conduit",9e3,8e3]],Vi=4e3,Zt=Math.round(Math.PI*Vi),kt=Object.freeze({color:"var(--lcars-blue)",width:8,line_look:"tube",glow:3,pulse:true,dash:{speed:30}}),ws=Object.freeze(["var(--lcards-moonlight)","var(--lcards-orange-lightest)","var(--lcars-violet)","var(--lcards-blue-medium)","var(--lcars-violet)","var(--lcards-blue-medium-dark)","var(--lcards-blue-medium)","var(--lcards-blue-dark)"]),vs=Object.freeze({swirl:ws,diagram:"var(--lcars-blue)",arms:"var(--lcards-blue-light)",heart:"var(--lcards-orange-lightest)",wisps:["var(--lcars-violet)","var(--lcards-blue-medium)"],haze:["var(--lcards-orange-lightest)","var(--lcards-blue-light)"]}),Xt=Array.from({length:16},(i,e)=>{const t=e/15;return[.15+5*t,.7+1.8*t,.65*(1-t)**1.5+.04]}),oe=c(i=>Math.round(i*1e3)/1e3,"r3");function Fi({prefix:i,at:e,aim:t,radius:a,depth:s,power:n,extra:r={},stars:l=4e3,glow:o=5,palette:d={},turn:u=1}){const y={...vs,...d},h=c(($,S,k)=>n?{entity:n,output:[oe($),oe(S)],...k?{smooth:k}:{}}:oe(S),"opens"),m=`${i}_mouth`,f={shape:"well",well:{shape:"trumpet",throat:.1},at:e,face:t,radius:h(.15*a,a,1500),depth:s},g={type:"wobble",lobes:0,waves:2,period:3,amplitude:n?`[[[ return Number(states['${n}']?.state ?? 0) / 1000 ]]]`:.06},_=1.5*a;return{points:[{id:`${i}_throat`,object:m,xyz:[0,-s,0]},{id:`${i}_out`,object:m,xyz:[0,6*a,0]},{id:`${i}_haze`,object:m,xyz:[0,1.6*a,0]},...Xt.map(([$],S)=>({id:`${i}_shaft_${S+1}`,object:m,xyz:[0,oe($*a),0]}))],objects:[{type:"grid",id:m,...f,line_spacing_deg:20,color:y.diagram,scan:{period:4},look:"diagram",deform:[{type:"twist",angle:60*u,anchor:"top"},g],...r},{type:"ring",id:`${i}_ring`,at:e,face:t,radius:1.75*a,dash:{pattern:[6,10],speed:40},width:2,spin:h(0,90*u),look:"diagram",...d.diagram?{color:y.diagram}:{},...r},{type:"glow",id:`${i}_glow`,at:e,color:y.diagram,size:h(.5*a,o*a),look:"diagram",...r},{type:"grid",id:`${i}_funnel`,...f,well:{...f.well,throat:.07},radius:h(.15*_,_,1500),line_width:0,edges:false,look:"realistic",fill:{effect:{type:"swirl",colors:[...y.swirl],speed:.2*_*u,turbulence:.8,num_octaves:5}},deform:[{type:"twist",angle:80*u,anchor:"top",period:6},g],...r},{type:"galaxy",id:`${i}_vortex`,at:e,face:t,look:"realistic",radius:h(.15*_,_,1500),arms:{count:4,pitch:20,color:y.arms},bar:{length:0},thickness:.02,stars:{count:l},seed:4,glow:0,dust:{amount:0},core:{color:"var(--lcards-moonlight)"},spin:h(5*u,25*u),...r},{type:"glow",id:`${i}_heart`,at:e,color:y.heart,size:h(.2*a,.8*a),look:"realistic",...r},...Xt.map(([$,S,k],T)=>({type:"glow",id:`${i}_light_${T+1}`,at:`${i}_shaft_${T+1}`,size:oe(S*a),color:y.heart,opacity:h(.15*k,k),look:"realistic",...r})),{type:"nebula",id:`${i}_wisps`,at:e,radius:1.2*_,count:6,seed:7,drift:.6,brightness:[.15,.35],colors:[...y.wisps],opacity:h(.1,1),look:"realistic",...r},{type:"nebula",id:`${i}_wisps_out`,at:`${i}_haze`,radius:.45*_,count:3,seed:3,drift:1,brightness:[.1,.25],colors:[...y.haze],opacity:h(0,1),look:"realistic",...r},{type:"path",id:`${i}_throat_tube`,points:[e,`${i}_throat`],...kt,...r}]}}c(Fi,"wormholeMouth");const $s=new Set(["milky_way","voyager_route","wormhole_link"]);function Ne(i){const e=c(t=>$s.has(t.id)?t:{...t,hide_in_systems:true},"mark");return{...i,points:(i.points??[]).map(e),objects:(i.objects??[]).map(e)}}c(Ne,"galaxyScale");const ks={id:"star_trek_galaxy",kind:"scene",title:"Star Trek galaxy",summary:"The Milky Way in four quadrants with the great powers",description:"The Milky Way in light years cut into the four quadrants (the Alpha/Beta line runs from Sol to the core), with the Federation, the Klingon, Romulan and Cardassian empires, the Dominion and the Borg, the Bajoran wormhole to the Gamma Quadrant, Voyager's route home from Ocampa and the Great Barrier. Fly in to Sol for Federation space: Vulcan, Andoria and Tellar at their real stars (40 Eridani, Procyon, 61 Cygni), the Klingon, Romulan and Cardassian capitals at the distances the reference charts give. The galaxy view sizes the empires to be seen, so the two scales do not overlay exactly.",icon:"mdi:star-david",params:[],build:c(()=>{const i=c((a,s)=>Fi({prefix:`wormhole_${a}`,at:`wormhole_${a}`,aim:`wormhole_aim_${s}`,radius:.6,depth:1.6,extra:{max_distance:200}}),"mouth"),e=[i("alpha","gamma"),i("gamma","alpha")],t=c((a,s,n)=>({id:a,polar:[4e4,n],alt:6e3,label:s,style:"title",min_distance:7e4}),"quadrant");return Ne({units:"ly",views:{galaxy:{target:"core",yaw:20,tilt:40,distance:13e4},quadrants:{target:"core",tilt:90,distance:15e4},federation:{target:"sol",yaw:200,tilt:45,distance:380},neighbours:{target:"sol",yaw:200,tilt:35,distance:50},bajor:{target:"bajor",yaw:160,tilt:20,distance:12},gamma:{target:"idran",yaw:30,tilt:30,distance:9e3},delta:{target:"ocampa",yaw:330,tilt:40,distance:45e3},barrier:{target:"core",yaw:40,tilt:25,distance:3e4}},camera:{view:"galaxy",fly_duration:4500,buttons:true},backdrop:{stars:{count:1500}},points:[{id:"core",xyz:[0,0,0],label:"GALACTIC CORE",style:"major",tap_action:{action:"fly-to",view:"barrier"}},t("alpha","ALPHA QUADRANT",225),t("beta","BETA QUADRANT",135),t("gamma_q","GAMMA QUADRANT",315),t("delta_q","DELTA QUADRANT",45),...Jt.map(([a,s,n,,[r,l],o],d)=>({id:`${a}_name`,xyz:o?[-9e3,1500+3500*d,lt[2]]:[r,1500,l],label:s,style:o?"minor":"major",color:n,...o?{min_distance:2500}:{}})),{id:"sol",xyz:[...lt],marker:"reticle",label:"SOL",style:"major",overlap:true,tap_action:{action:"fly-to",view:"neighbours"}},...gs.map(([a,s,n,r,l,o,d])=>{const[u,y,h]=bs(n,r,l),m=["vulcan","andoria","tellar"].includes(a);return{id:a,xyz:de(u,h,y),marker:o,label:s,style:m?"minor":"tiny",...m?{priority:90}:{},color:d,max_distance:150}}),..._s.map(([a,s,n,r,l,o])=>({id:a,xyz:de(n,r),marker:l,label:s,style:"minor",color:o,max_distance:3e3,...a==="bajor"?{priority:85,tap_action:{action:"fly-to",view:"bajor"}}:{}})),{id:"wormhole_alpha",xyz:de(-45,21.5,1),label:"BAJORAN WORMHOLE",style:"tiny",max_distance:60},{id:"idran",xyz:[-38e3,0,-32e3],marker:"diamond",label:"IDRAN",style:"minor",tap_action:{action:"fly-to",view:"gamma"}},{id:"wormhole_gamma",xyz:[-37997,1,-31996.5],label:"WORMHOLE (GAMMA END)",style:"tiny",max_distance:60},{id:"wormhole_aim_gamma",at:"wormhole_gamma",offset:[0,Zt,0]},{id:"wormhole_aim_alpha",at:"wormhole_alpha",offset:[0,Zt,0]},...e.flatMap(a=>a.points),{id:"founders",xyz:[-39500,0,-31200],marker:"dot",label:"Founders' homeworld",style:"tiny",max_distance:2e4},{id:"unicomplex",xyz:[26e3,0,-26e3],marker:"diamond",label:"Unicomplex",style:"minor",max_distance:6e4},...Qt.map(([a,s,n,r])=>({id:a,xyz:[n,0,r],marker:"dot",label:s,style:a==="ocampa"?"minor":"tiny",color:"var(--lcars-orange)",...a==="ocampa"?{tap_action:{action:"fly-to",view:"delta"}}:{}}))],objects:[{type:"galaxy",id:"milky_way",glow:.5},{type:"beam",id:"alpha_beta_line",from:[0,0,-52e3],to:[0,0,52e3],width:1.5,color:"theme:colors.ui.secondary",min_distance:2e3},{type:"beam",id:"gamma_delta_line",from:[-52e3,0,0],to:[52e3,0,0],width:1.5,color:"theme:colors.ui.secondary",min_distance:2e3},{type:"grid",id:"great_barrier",shape:"sphere",radius:7500,line_spacing_deg:20,color:"var(--lcars-yellow)",opacity:.4,scan:{period:6}},{type:"glow",at:"core",size:7e3,color:"var(--lcars-yellow)",opacity:.5},...Jt.map(([a,,s,n,,r])=>({type:"volume",id:`${a}_space`,shape:"prism",outline:n,height:[-1200,1200],color:s,faces:{opacity:.25},cells:{width:2e3,depth:2e3,height:1200},...r?{min_distance:6e3}:{}})),{type:"grid",id:"sectors",shape:"plane",at:"sol",size:[400,400],line_spacing:20,major:{row_interval:5},opacity:.5,max_distance:3e3},{type:"volume",id:"romulan_neutral_zone",shape:"prism",at:"sol",outline:[[70,-40],[78,-40],[80,60],[72,60]],height:[-4,4],color:"var(--lcars-green)",faces:{opacity:.35},max_distance:3e3},{type:"volume",id:"cardassian_dmz",shape:"prism",at:"sol",outline:[[-38,12],[-42,8],[-48,34],[-44,38]],height:[-4,4],color:"var(--lcars-orange)",faces:{opacity:.35},max_distance:3e3},{type:"path",id:"wormhole_link",points:["wormhole_alpha_throat","wormhole_gamma_throat"],arc:Vi,...kt},...e.flatMap(a=>a.objects),{type:"path",id:"voyager_route",points:[...Qt.map(([a])=>a),"sol"],dash:{pattern:[10,6],speed:40},color:"var(--lcars-orange)",width:2}]})},"build")},Ue="var(--lcars-blue)",$e="var(--lcards-moonlight)",ei=[.1,.7,.98,1,.85,.45,.1],ti=[.1,.85,1,.95,.6,.1],ii=[.3,.85,1,.9,.55,.25],ai=[[57,11],[62,14],[68,17]];function xs(i,e){const t=[];for(let r=0;r<40;r++)t.push([0,-7-10*(r/39),0]);for(let r=1;r<30;r++){const l=Math.PI*r/29;t.push([3-3*Math.cos(l),-17-1.8*Math.sin(l),0])}for(let r=1;r<60;r++){const l=r/59;t.push([6+14*l,-17+8*l+2.2*Math.sin(l*3*Math.PI)*(1-l),0])}const a=t.length,s=.9,n=c(r=>Math.round(r*1e3)/1e3,"round");return t.map(([r,l,o],d)=>{const u=i+d/a*4*Math.PI;return[n(r*e),n((l+.5*s*Math.cos(u))*e),n((o+s*Math.sin(u))*e)]})}c(xs,"pipelineStrand");function Hi({prefix:i,at:e,size:t=70,power:a,extra:s={},stars:n=6e3,labels:r=true}){const l=t/70,o=c(b=>`${i}_${b}`,"id"),d=c((b,g,_={})=>({id:o(b),at:e,offset:g.map($=>Math.round($*l*1e3)/1e3),..._}),"pt"),u=c((b,g,_)=>d(b,g,{label:_,style:"minor",look:"diagram",tap_action:{action:"fly-to"}}),"label"),h=[{type:"wobble",lobes:0,waves:2,period:4,amplitude:a?`[[[ return Number(states['${a}']?.state ?? 0) / 2000 ]]]`:.03}],m=c((b,g,_,$,S,k)=>({type:"grid",id:o(b),shape:"well",well:{profile:_},at:g,face:o("east"),radius:$*l,depth:S*l,pattern:"polar",spoke_count:16,line_spacing:2.4*l,color:Ue,opacity:k,look:"diagram",deform:h,...s}),"lobe"),f=Fi({prefix:i,at:e,aim:o("down"),radius:9*l,depth:7*l,power:a,extra:s,stars:n,glow:2});return{points:[...f.points,d("down",[0,-1e3,0]),d("east",[1e3,-9,0]),d("west",[-1e3,-9,0]),d("negative",[20,-9,0]),d("negative_cone",[21,-9,0]),d("ring_singularity",[33,-9,0]),d("positive",[33.5,-9,0]),d("point_singularity",[52,-9,0]),d("membrane",[52,-9,0]),d("membrane_centre",[58,-9,0]),d("middle",[34,-9,0]),...ai.map(([b],g)=>d(`far_mouth_${g+1}`,[b,-9,0])),...r?[u("label_pipeline",[-4,-15,0],"PIPELINE"),u("label_negative",[26,-18,0],"NEGATIVE CTL REGION"),u("label_ring",[33,1,0],"RING SINGULARITY"),u("label_positive",[40,-19,0],"POSITIVE CTL REGION"),u("label_point",[50,-17,0],"POINT SINGULARITY"),u("label_membrane",[60,2,0],"VERTERON MEMBRANE")]:[]],objects:[...f.objects.map(b=>b.id===o("throat_tube")?{...b,look:"diagram"}:b),{type:"grid",id:o("entrance"),shape:"disc",at:e,radius:9*l,pattern:"polar",line_spacing_deg:20,color:Ue,opacity:.8,look:"diagram",...s},...[0,2.1,4.2].map((b,g)=>({type:"path",id:o(`strand_${g+1}`),at:e,points:xs(b,l),...kt,width:4,glow:2,look:"diagram",...s})),m("negative_outer",o("negative"),ei,7,13,1),m("negative_inner",o("negative"),ei,4.8,13,.6),{type:"grid",id:o("negative_cone_grid"),shape:"well",well:{shape:"cone",throat:.05},at:o("negative_cone"),face:o("east"),radius:2.5*l,depth:11*l,line_spacing_deg:30,color:$e,opacity:.8,look:"diagram",...s},{type:"ring",id:o("ring_singularity_ring"),at:o("ring_singularity"),face:o("east"),radius:1.6*l,width:3,glow:2,color:$e,look:"diagram",...s},m("positive_outer",o("positive"),ti,7.5,18.5,1),m("positive_inner",o("positive"),ti,5,18.5,.6),{type:"grid",id:o("point_singularity_cone"),shape:"well",well:{shape:"cone",throat:.04},at:o("point_singularity"),face:o("west"),radius:3*l,depth:9*l,line_spacing_deg:24,color:$e,look:"diagram",...s},{type:"glow",id:o("point_glow"),at:o("point_singularity"),size:5*l,color:$e,look:"diagram",...s},m("membrane_outer",o("membrane"),ii,8,13,1),m("membrane_inner",o("membrane"),ii,5.5,13,.6),...ai.map(([,b],g)=>({type:"ring",id:o(`far_mouth_ring_${g+1}`),at:o(`far_mouth_${g+1}`),face:o("east"),radius:b*l,width:2,color:Ue,opacity:.8,look:"diagram",...s}))]}}c(Hi,"bajoranWormhole$1");const Ss={id:"bajoran_wormhole",kind:"scene",title:"Bajoran wormhole",summary:"The wormhole's mouth and the regions inside it",description:"The Bajoran wormhole as the station displays draw it: the mouth (a swirl of gas round a warm heart in the realistic look, an entrance disc and funnel in the diagram) and, diagram only, its inside: the pipeline, the negative CTL region, the ring singularity, the positive CTL region, the point singularity and the verteron membrane. Switch the card's look to see one or the other. Tap a name to fly to it. With a power entity (0 to 100) the mouth opens and the regions wobble with it.",icon:"mdi:vector-ellipse",params:[{key:"power",label:"Power entity (optional)",type:"text",default:"",helper:"A number from 0 to 100: the mouth opens with it."}],build:c(({power:i})=>{const e=Hi({prefix:"wormhole",at:"mouth",power:i?String(i):void 0,stars:8e3});return{views:{overview:{target:"wormhole_middle",yaw:40,tilt:14,distance:92},mouth:{target:"mouth",yaw:20,tilt:40,distance:34},inside:{target:"wormhole_ring_singularity",yaw:60,tilt:10,distance:30},membrane:{target:"wormhole_membrane_centre",yaw:50,tilt:15,distance:52}},camera:{view:"overview"},backdrop:{stars:{count:2500}},points:[{id:"mouth",xyz:[0,0,0]},{id:"name",at:"mouth",offset:[0,14,0],label:"BAJORAN WORMHOLE",style:"major",tap_action:{action:"fly-to",view:"mouth"}},...e.points],objects:e.objects}},"build")},Ve=[["dock1","DRYDOCK 1",[-70,30,20],true],["dock2","DRYDOCK 2",[0,38,0],false],["dock3","DRYDOCK 3",[70,30,-20],false]],As={id:"utopia_planitia",kind:"scene",title:"Utopia Planitia yards",summary:"Three drydocks in orbit over Mars, a starship in the first",description:"Three drydocks of the Utopia Planitia Fleet Yards in orbit over Mars (its USGS Viking map), a Galaxy-class starship in the first. Tap a drydock to fly to it.",icon:"mdi:factory",params:[],build:c(()=>({views:{yards:{target:[0,20,0],yaw:20,tilt:22,distance:260},...Object.fromEntries(Ve.map(([i])=>[i,{target:i,yaw:35,tilt:20,distance:80}]))},camera:{view:"yards"},backdrop:{stars:{count:2e3}},points:[{id:"mars",xyz:[0,-200,0]},{id:"mars_name",at:"mars",offset:[0,40,200],label:"MARS",style:"major"},...Ve.flatMap(([i,e,t])=>[{id:i,xyz:[...t]},{id:`${i}_name`,at:i,offset:[0,14,0],marker:"reticle",label:e,style:"minor",tap_action:{action:"fly-to",view:i}}])],objects:[{type:"sphere",id:"mars_body",at:"mars",radius:190,image:"builtin:mars_viking",line_spacing_deg:30,line_width:.5,opacity:.3,spin:2},...Ve.flatMap(([i,,,e])=>[{type:"model",id:`${i}_frame`,src:"builtin:utopia_planitia_drydock",at:i,size:40,material:"original"},...e?[{type:"model",id:`${i}_ship`,src:"builtin:galaxy_class",at:i,size:33.8,scan:{period:6}}]:[]])]}),"build")},Os={id:"borg_encounter",kind:"scene",title:"Borg encounter",summary:"A Borg cube bearing down on a starship, tractor beam locked on",description:"A Borg cube with its green halo bearing down on the built-in Galaxy-class starship, its tractor beam locked on. Tap a name to fly to it.",icon:"mdi:cube",params:[],build:c(()=>({views:{encounter:{target:[0,0,20],yaw:120,tilt:15,distance:170},cube:{target:"cube",yaw:30,tilt:20,distance:90},ship:{target:"ship",yaw:150,tilt:20,distance:45}},camera:{view:"encounter"},backdrop:{stars:{count:2500}},points:[{id:"cube",xyz:[0,0,-20]},{id:"cube_name",at:"cube",offset:[0,32,0],label:"BORG CUBE",style:"major",tap_action:{action:"fly-to",view:"cube"}},{id:"ship",xyz:[0,4,70]},{id:"ship_name",at:"ship",offset:[0,10,0],label:"USS ENTERPRISE",style:"minor",tap_action:{action:"fly-to",view:"ship"}},{id:"emitter",xyz:[0,2,0]}],objects:[{type:"glow",at:"cube",size:110,color:"var(--lcards-green-medium)",opacity:.45},{type:"cube",id:"borg",at:"cube",size:40,spin:3,rotation:[8,25,0]},{type:"model",id:"hull",src:"builtin:galaxy_class",at:"ship",size:22,rotation:[0,160,0],scan:{period:5}},{type:"beam",from:"emitter",to:"ship",width:10,color:"var(--lcards-green-medium)",pulse:true}]}),"build")},J=1495978707e-1,Fe=[["mercury","MERCURY","tiny"],["venus","VENUS","tiny"],["earth","EARTH","minor"],["mars","MARS","minor"],["ceres","CERES","tiny"],["jupiter","JUPITER","minor"],["saturn","SATURN","minor"],["uranus","URANUS","tiny"],["neptune","NEPTUNE","tiny"],["pluto","PLUTO","tiny"]],He=[["moon","LUNA","earth",384400],["phobos","PHOBOS","mars",9375],["deimos","DEIMOS","mars",23457],["io","IO","jupiter",421800],["europa","EUROPA","jupiter",671100],["ganymede","GANYMEDE","jupiter",1070400],["callisto","CALLISTO","jupiter",1882700],["titan","TITAN","saturn",1221900],["triton","TRITON","neptune",354800],["charon","CHARON","pluto",19600]],si={sun:695700,mercury:2439.7,venus:6051.8,earth:6371,moon:1737.4,mars:3389.5,phobos:11.08,deimos:6.27,ceres:469.7,jupiter:69911,io:1821.6,europa:1560.8,ganymede:2634.1,callisto:2410.3,saturn:58232,titan:2574.7,uranus:25362,neptune:24622,triton:1353.4,pluto:1188.3,charon:606},ni={sun:{image:"builtin:sun_sdo"},mercury:{image:"builtin:mercury_messenger"},venus:{fill:{effect:{preset:"clouds"}}},earth:{image:"builtin:earth_blue_marble"},moon:{image:"builtin:moon_lroc"},mars:{image:"builtin:mars_viking"},phobos:{image:"builtin:phobos_viking"},deimos:{fill:{color:"var(--lcards-gray-medium)",opacity:1}},ceres:{image:"builtin:ceres_dawn"},jupiter:{image:"builtin:jupiter_cassini"},io:{image:"builtin:io_galileo"},europa:{image:"builtin:europa_galileo"},ganymede:{image:"builtin:ganymede_galileo"},callisto:{image:"builtin:callisto_galileo"},saturn:{fill:{effect:{preset:"ringed_giant"}}},titan:{image:"builtin:titan_cassini"},uranus:{fill:{effect:{preset:"ice_giant"}}},neptune:{fill:{effect:{preset:"storm_giant"}}},triton:{image:"builtin:triton_voyager"},pluto:{image:"builtin:pluto_new_horizons"},charon:{image:"builtin:charon_new_horizons"}},xt={system:{target:"sun",yaw:40,tilt:35,distance:16e9},inner:{target:"sun",yaw:40,tilt:35,distance:9e8},earth:{target:"earth",yaw:225,tilt:12,distance:7e4},mars:{target:"mars",yaw:200,tilt:15,distance:6e4},jupiter:{target:"jupiter",yaw:200,tilt:10,distance:45e5},saturn:{target:"saturn",yaw:160,tilt:20,distance:35e5},neptune:{target:"neptune",yaw:160,tilt:20,distance:1e6},pluto:{target:"pluto",yaw:120,tilt:20,distance:8e4}},js={target:"ds9",yaw:330,tilt:6,distance:4},Ki={date:"now",rate:"1 h/s"};function Wi({station:i=false}={}){const e=xt;return{points:[{id:"sun",xyz:[0,0,0],label:"SOL",style:"major"},...Fe.map(([t,a,s])=>({id:t,body:t,marker:"dot",label:a,style:s,...e[t]?{tap_action:{action:"fly-to",view:t}}:{}})),...He.map(([t,a,,s])=>({id:t,body:t,label:a,style:"tiny",max_distance:s*50})),...i?[{id:"ds9",at:"earth",offset:[-21082,0,36515],label:"DEEP SPACE 9",style:"tiny",max_distance:3e6,tap_action:{action:"fly-to",view:"station"}}]:[]],objects:[{type:"glow",at:"sun",size:9e6,color:"var(--lcars-yellow)"},{type:"sphere",id:"sun_body",at:"sun",radius:si.sun,body:"sun",...ni.sun,line_spacing_deg:30,line_width:.5},...Fe.map(([t])=>({type:"ring",id:`${t}_orbit`,orbit:t,width:1,opacity:t==="earth"?.7:.5,tags:["orbits"],...t==="earth"?{color:"var(--lcars-blue)"}:{}})),...He.map(([t,,a,s])=>({type:"ring",id:`${t}_orbit`,at:a,orbit:t,width:1,opacity:.4,tags:["orbits"],max_distance:s*50})),...[...Fe.map(([t])=>t),...He.map(([t])=>t)].map(t=>({type:"sphere",id:`${t}_body`,at:t,radius:si[t],body:t,...ni[t],line_spacing_deg:30,line_width:.5})),{type:"ring",id:"saturn_rings",at:"saturn",radius:140180,body:"saturn",band:{image:"builtin:saturn_rings",inner_radius:66900}},{type:"belt",id:"main_belt",at:"sun",radius:[2.1*J,3.3*J],thickness:.15*J,count:1500,size:[5,300],tumble:0,seed:4},{type:"belt",id:"kuiper_belt",at:"sun",radius:[30*J,50*J],thickness:3*J,count:2e3,size:[50,1200],tumble:0,seed:9,color:"var(--lcars-blue)"},...i?[{type:"model",id:"station",at:"ds9",src:"builtin:deep_space_nine",material:"original"}]:[]]}}c(Wi,"solSystem");const Ts={id:"true_scale_solar_system",kind:"scene",title:"Solar system (real positions)",summary:"The Solar System at real scale, where the planets are today",description:"The Sun, the planets, Pluto, Ceres and the major moons in km, where they really are today and moving a day a second: real orbits, sizes, tilts and spins, Saturn's rings, the asteroid and Kuiper belts. Tap a planet to fly to it; the time slider runs the date faster, slower or back.",icon:"mdi:orbit",params:[],build:c(()=>({units:"km",clock:{...Ki},views:xt,camera:{view:"system",fly_duration:4e3,buttons:true},backdrop:{stars:{count:2e3}},...Wi()}),"build")},Es={id:"true_scale_dive",kind:"scene",title:"Galaxy to station at true scale",summary:"Dive from the galaxy to Earth and Deep Space 9 at real scale",description:"A galaxy in light years with the Sol system in km inside it, 26,000 light years from the core: tap SOL and dive from the galaxy to the planets, Earth and Deep Space 9, all at their real sizes and distances, with the planets where they are today.",icon:"mdi:magnify-plus-outline",params:[],build:c(()=>({units:"ly",clock:{...Ki},views:{galaxy:{target:"core",yaw:20,tilt:35,distance:14e4},...xt,station:js},camera:{view:"galaxy",fly_duration:5e3},backdrop:{stars:{count:2e3}},points:[{id:"core",xyz:[0,0,0],label:"GALACTIC CORE",style:"title"},{id:"sol",polar:[26e3,200],alt:60,marker:"dot",label:"SOL",style:"major",tap_action:{action:"fly-to",view:"inner"}}],objects:[{type:"grid",shape:"disc",radius:5e4,pattern:"polar",line_spacing:5e3,spoke_count:36,min_distance:20},{type:"glow",at:"core",size:3e4},{type:"system",id:"sol_system",at:"sol",units:"km",...Wi({station:true})}]}),"build")},ri=[["ferenginar","Ferenginar",-105.9,28.1,"var(--lcars-yellow)"],["breen","Breen",-150,95,"var(--lcars-lilac)"],["tzenkethi","Tzenkethi",-175,20,"var(--lcars-magenta)"],["tholia","Tholia",40,140,"var(--lcars-orange)"],["gorn","Gorn Hegemony",150,-40,"var(--lcars-green)"]],Ps={id:"st_minor_powers",kind:"part",title:"Star Trek: minor powers",summary:"The Ferengi, Breen, Tzenkethi, Tholian and Gorn homeworlds",description:"For the Star Trek galaxy: the Ferengi, Breen, Tzenkethi, Tholian and Gorn homeworlds round Federation space, each with a small territory, at the close-up's scale (Ferenginar at its recorded 55 ly from Cardassia and 60 from Bajor).",icon:"mdi:account-group-outline",scene:"star_trek_galaxy",picture:{camera:{target:[-60,0,26060],yaw:20,tilt:45,distance:420}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:""}],build:c(()=>Ne({units:"ly",points:ri.map(([i,e,t,a,s])=>({id:i,xyz:de(t,a),marker:"diamond",label:e,style:"minor",color:s,max_distance:3e3})),objects:ri.map(([i,,,,e])=>({type:"volume",id:`${i}_space`,shape:"prism",at:i,height:[-6,6],color:e,faces:{opacity:.25},max_distance:3e3,outline:[[-18,-10],[-4,-20],[16,-12],[20,8],[4,20],[-16,14]]}))}),"build")},oi=[["kazon","KAZON SECTS","var(--lcars-orange)",[[33e3,-38e3],[41e3,-36e3],[42e3,-29e3],[35e3,-27e3],[31e3,-31e3]],[37e3,-33e3]],["vidiian","VIDIIAN SODALITY","var(--lcars-red)",[[3e4,-29e3],[35e3,-26e3],[33e3,-2e4],[27e3,-21e3]],[31e3,-24e3]],["hirogen","HIROGEN HUNTING GROUNDS","var(--lcars-violet)",[[16e3,-8e3],[26e3,-6e3],[27e3,2e3],[17e3,3e3],[12e3,-2e3]],[2e4,-3e3]]],zs={id:"st_delta_powers",kind:"part",title:"Star Trek: Delta Quadrant powers",summary:"Kazon, Vidiian and Hirogen space along Voyager's route",description:"For the Star Trek galaxy: Kazon, Vidiian and Hirogen space along Voyager's route home, in the order Voyager met them.",icon:"mdi:map-marker-path",scene:"star_trek_galaxy",picture:{camera:{target:[3e4,0,-22e3],yaw:20,tilt:50,distance:42e3}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:""}],build:c(()=>Ne({units:"ly",points:oi.map(([i,e,t,,[a,s]])=>({id:`${i}_name`,xyz:[a,1500,s],label:e,style:"minor",color:t})),objects:oi.map(([i,,e,t])=>({type:"volume",id:`${i}_space`,shape:"prism",outline:t,height:[-1e3,1e3],color:e,faces:{opacity:.25},cells:{width:2e3,depth:2e3,height:1e3}}))}),"build")},li=[["tw_unicomplex","Unicomplex",26e3,-26e3],["tw_exit_1","Conduit exit",36e3,-14e3],["tw_exit_2","Conduit exit",18e3,-38e3],["tw_exit_3","Conduit exit",8e3,-12e3]],Cs={id:"st_transwarp",kind:"part",title:"Star Trek: Borg transwarp network",summary:"A Borg transwarp hub with conduits across the galaxy",description:"For the Star Trek galaxy: a Borg transwarp hub in the Delta Quadrant with flowing conduits across Borg space and one to the aperture near Earth.",icon:"mdi:hub-outline",scene:"star_trek_galaxy",picture:{camera:{target:[14e3,0,-2e3],yaw:20,tilt:55,distance:75e3}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:""}],build:c(()=>Ne({units:"ly",points:[{id:"tw_hub",xyz:[22e3,0,-18e3],marker:"diamond",label:"TRANSWARP HUB",style:"minor",color:"var(--lcars-green)"},...li.map(([i,e,t,a])=>({id:i,xyz:[t,0,a],marker:"dot",label:e,style:"tiny",color:"var(--lcars-green)",max_distance:6e4})),{id:"tw_earth",xyz:de(.6,-.5,.2),label:"Transwarp aperture",style:"tiny",color:"var(--lcars-green)",max_distance:30}],objects:[...li.map(([i])=>i),"tw_earth"].map(i=>({type:"path",id:`conduit_${i}`,points:["tw_hub",i],arc:i==="tw_earth"?6e3:1500,dash:{pattern:[4,6],speed:60},color:"var(--lcars-green)",width:1.5,glow:true}))}),"build")},ci=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$8"),B=c(i=>Number.isFinite(Number(i))?Math.abs(Number(i)):0,"num$1"),Ke=c(i=>Math.hypot(...i.slice(0,3).map(B)),"len");function di(i){const e=Array.isArray(i.size)?Math.max(0,...i.size.map(B)):B(i.size),t=Array.isArray(i.radius)?Math.max(0,...i.radius.map(B)):B(i.radius);return Math.max(t,e/2,B(i.length)/2)}c(di,"objectReach");function hi(i){const e=Array.isArray(i==null?void 0:i.points)?i.points.filter(ci):[],t=Array.isArray(i==null?void 0:i.objects)?i.objects.filter(ci):[],a=new Map(e.filter(h=>h.id!==void 0).map(h=>[String(h.id),h])),s=new Map(t.filter(h=>h.id!==void 0).map(h=>[String(h.id),h])),n=new Map,r=new Set,l=c(h=>{if(n.has(h))return n.get(h);if(r.has(h))return 0;r.add(h);let m=0;const f=typeof h.object=="string"?s.get(h.object):void 0,b=f?o(f):0;return Array.isArray(h.xyz)?m=b+Ke(h.xyz):Array.isArray(h.polar)?m=b+B(h.polar[0]):f&&(m=b+di(f)),m+=B(h.alt)+(Array.isArray(h.offset)?Ke(h.offset):0),r.delete(h),n.set(h,m),m},"pointDist"),o=c(h=>{if(n.has(h))return n.get(h);if(r.has(h))return 0;r.add(h);let m=0;return Array.isArray(h.at)?m=Ke(h.at):typeof h.at=="string"&&a.has(h.at)&&(m=l(a.get(h.at))),r.delete(h),n.set(h,m),m},"placeDist"),d=new Set([...t,...e].map(h=>h.at).filter(h=>typeof h=="string")),u=c(h=>h.id===void 0||h.label!==void 0||h.marker!==void 0||d.has(String(h.id)),"shown");let y=0;for(const h of e)u(h)&&(y=Math.max(y,l(h)));for(const h of t)y=Math.max(y,o(h)+(h.type==="system"?0:di(h)));return y}c(hi,"sceneExtent");function z(i){return typeof i=="string"&&i?{ref:i,points:[]}:{ref:"centre",points:[{id:"centre",xyz:Array.isArray(i)&&i.length===3?i.map(Number):[0,0,0]}]}}c(z,"centreRef");function j(i){return Number.isFinite(i)&&i!==0?Number(i.toPrecision(3)):i}c(j,"sigFigs");function Ns(i){const e=String(i??"").trim();return e?/^(builtin:|\/|https?:)/.test(e)?{image:e}:{fill:{effect:{preset:e}}}:{}}c(Ns,"surface");const Is=[36,22,14,9],Ms={scene:[2,3.2,4.4,5.6],real:[30,60,95,150]},Ls=1495978707e-1,Rs={id:"planet",kind:"part",title:"Planet with moons",summary:"A planet on its orbit ring with up to four moons",description:"A planet orbiting a centre point on its own ring, with up to four moons going round it. Tap the planet to fly to it.",icon:"mdi:earth",picture:{camera:{target:"planet_body",yaw:30,tilt:25,distance:34}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"planet"},{key:"label",label:"Label",type:"text",default:"PLANET"},{key:"centre",label:"Orbits round",type:"point",default:[0,0,0],helper:"A point id (a star) or x, y, z."},{key:"orbit",label:"Orbit radius",type:"number",default:40,real:Ls,fit:true},{key:"radius",label:"Planet radius",type:"number",default:3,real:6371,fit:true},{key:"moons",label:"Moons (0 to 4)",type:"number",default:2},{key:"look",label:"Surface",type:"text",default:"rocky",helper:"A planet type (gas_giant, ringed_giant, ice_giant, storm_giant, clouds, lava, ice, rocky, terran), a map (builtin:mars_viking) or your own picture (/local/planet.jpg).",options:ia.map(i=>({value:i,label:i.replace(/_/g," ")})),custom:true}],build:c(({label:i,centre:e,orbit:t,radius:a,moons:s,look:n},{units:r})=>{var m;const l=z(e),o=Number(a)||3,d=Math.max(0,Math.min(4,Math.round(Number(s)||0))),u=Ms[r?"real":"scene"],y=Array.from({length:d},(f,b)=>({id:`moon${b+1}`,orbit:We(o*u[b]),spin:Is[b],bearing:b*110})),h=We(Math.max(o*40,(((m=y[y.length-1])==null?void 0:m.orbit)??0)*4));return{points:[...l.points,{id:"body",polar:[Number(t)||40,0],object:"orbit",marker:"dot",label:String(i),style:"minor",tap_action:{action:"fly-to"}},...y.map(f=>({id:f.id,polar:[f.orbit,f.bearing],object:`${f.id}_orbit`,marker:"dot",label:f.id.toUpperCase(),style:"tiny",max_distance:h}))],objects:[{type:"ring",id:"orbit",at:l.ref,radius:Number(t)||40,spin:5,width:1,color:"theme:colors.ui.secondary",opacity:.6},{type:"sphere",id:"globe",at:"body",radius:o,...Ns(n),line_spacing_deg:30,spin:15},...y.flatMap(f=>[{type:"ring",id:`${f.id}_orbit`,at:"body",radius:f.orbit,spin:f.spin,width:1,dash:[3,3],opacity:.5,max_distance:h},{type:"sphere",id:`${f.id}_globe`,at:f.id,radius:r?We(o*.27):Math.max(.3,o*.25),line_spacing_deg:45,max_distance:h}])]}},"build")},We=c(i=>Number(i.toPrecision(3)),"sig$1"),ui=1495978707e-1,Ds={id:"asteroid_belt",kind:"part",fitShare:.45,title:"Asteroid belt",summary:"A band of rocks going round a centre, lit by its star",description:"A band of rocks going round a centre, the inner ones faster, lit from the centre as by its star, with a label on its edge.",icon:"mdi:dots-circle",params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"belt"},{key:"label",label:"Label",type:"text",default:"ASTEROID BELT"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id (a star) or x, y, z."},{key:"radius",label:"Radius",type:"number",default:65,real:2.7*ui,fit:true},{key:"width",label:"Width",type:"number",default:8,real:ui,fit:true}],build:c(({label:i,centre:e,radius:t,width:a},{units:s})=>{const n=z(e),r=Number(t)||65,l=Number(a)||8,o=U(s),d=c(y=>o?Number(y.toPrecision(3)):Math.round(y*10)/10,"round"),u=o?[d(5/o),d(300/o)]:[.2,d(Math.max(.6,l/6))];return{points:[...n.points,{id:"label",at:n.ref,offset:[0,0,-(r+l)],label:String(i),style:"tiny"}],objects:[{type:"belt",id:"rocks",at:n.ref,radius:[d(r-l/2),d(r+l/2)],count:900,size:u,period:60,colors:["var(--lcards-gray-light)","var(--lcards-gray-medium)","var(--lcards-yellow-dark)"]}]}},"build")},Bs={id:"asteroid",kind:"part",title:"Asteroid",summary:"One tumbling rock, lit from its star",description:"One asteroid with lumps and craters, tumbling, lit from its star, with a label above it. Tap it to fly to it.",icon:"mdi:meteor",picture:{camera:{target:[30,0,0],yaw:270,tilt:15,distance:26}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"asteroid"},{key:"label",label:"Label",type:"text",default:"ASTEROID"},{key:"at",label:"Where",type:"point",default:[30,0,0],helper:"A point id or x, y, z."},{key:"light",label:"Lit from",type:"point",default:[0,0,0],helper:"A point id (its star) or x, y, z."},{key:"size",label:"Size",type:"number",default:8,real:30},{key:"seed",label:"Shape (any whole number)",type:"number",default:4}],build:c(({label:i,at:e,light:t,size:a,seed:s})=>{const n=z(e),r=Number(a)||8,l=typeof t=="string"&&t?{light:t}:{light:Array.isArray(t)&&t.length===3?t.map(Number):[0,0,0]};return{points:[...n.points,{id:"body",at:n.ref,label:String(i),style:"minor",offset:[0,r*.8,0],tap_action:{action:"fly-to"}}],objects:[{type:"asteroid",id:"rock",at:n.ref,size:r,seed:Math.round(Number(s)||1),...l}]}},"build")},pi=1495978707e-1,Us={id:"comet",kind:"part",title:"Comet",summary:"A comet swinging round its star, its tails away from it",description:"A comet on an orbit centred off its star, so it swings in close and out far. Its tails point away from the star and it grows and brightens near it (activity.mode: distance). Tap it to fly to it.",icon:"mdi:star-shooting",picture:{camera:{target:[0,0,0],yaw:0,tilt:55,distance:220}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"comet"},{key:"label",label:"Label",type:"text",default:"COMET"},{key:"centre",label:"Star",type:"point",default:[0,0,0],helper:"A point id (a star) or x, y, z."},{key:"near",label:"Closest to the star",type:"number",default:25,real:.6*pi,fit:true},{key:"far",label:"Farthest from the star",type:"number",default:175,real:35*pi,fit:true},{key:"period",label:"Seconds per orbit",type:"number",default:36}],build:c(({label:i,centre:e,near:t,far:a,period:s})=>{const n=z(e),r=Math.max(0,Number(t)||25),l=Number(a)||175,o=l>r?l:r*2||1,d=(r+o)/2,u=(o-r)/2,y=360/Math.max(1,Number(s)||36),h=typeof e=="string"&&e?"ring_centre":[...Array.isArray(e)?e.map(Number):[0,0,0]].map((m,f)=>f===0?m+u:m);return{points:[...n.points,...h==="ring_centre"?[{id:"ring_centre",at:n.ref,offset:[u,0,0]}]:[],{id:"body",polar:[d,270],object:"orbit",label:String(i),style:"tiny",tap_action:{action:"fly-to"}}],objects:[{type:"ring",id:"orbit",at:h,radius:d,spin:y,width:1,color:"theme:colors.ui.secondary",opacity:.4},{type:"comet",id:"comet",at:"body",light:n.ref,nucleus:{size:j(d/50)},tail:{length:j(d*.9)},coma:{size:j(d/12)},activity:{mode:"distance",range:[r,o]}}]}},"build")},Vs=94607304725808e-1,Fs={id:"nebula_field",kind:"part",title:"Nebula field",summary:"Drifting gas you can fly into, with a glow at its heart",description:"A slowly drifting body of gas (render: volume, so the camera can fly into it) with drawn-out clouds, a pale core and a dust lane, a veil of lighter puffs, a soft glow at the heart and a label.",icon:"mdi:weather-cloudy",params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"nebula"},{key:"label",label:"Label",type:"text",default:"NEBULA"},{key:"centre",label:"Centre",type:"point",default:[0,10,0],helper:"A point id or x, y, z."},{key:"radius",label:"Radius",type:"number",default:40,real:2*Vs,fit:true}],build:c(({label:i,centre:e,radius:t})=>{const a=z(e),s=Number(t)||40;return{points:[...a.points,{id:"heart",at:a.ref,label:String(i),style:"major"}],objects:[{type:"nebula",id:"clouds",at:"heart",render:"volume",radius:s,count:8,seed:7,drift:.5,stretch:.4,dust:{count:1},core:{color:"var(--lcars-ice)"}},{type:"nebula",id:"veil",at:"heart",radius:s*.6,count:6,seed:23,drift:.8,colors:["var(--lcars-violet)","var(--lcars-blue)"]},{type:"glow",id:"glow",at:"heart",size:s*.5,opacity:.7}]}},"build")},Hs={id:"wormhole",kind:"part",title:"Wormhole",summary:"A wormhole mouth and the diagram of its inside",description:"The Bajoran wormhole as the station displays draw it. Its mouth is a swirl of gas round a warm heart in the realistic look, an entrance disc and funnel in the diagram. Past it, diagram only, the inside runs along +x: a pipeline of twisted strands, the negative CTL region, the ring singularity, the positive CTL region and the point singularity opening into the verteron membrane. With a power entity (0 to 100) the mouth opens and the regions wobble with it.",icon:"mdi:vector-ellipse",picture:{camera:{target:[30,-9,0],yaw:28,tilt:14,distance:74}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"bajoran"},{key:"centre",label:"Mouth",type:"point",default:[0,0,0],helper:"A point id or x, y, z. The inside runs along +x from here."},{key:"size",label:"Length",type:"number",default:70,real:40,fit:true},{key:"power",label:"Power entity (optional)",type:"text",default:"",helper:"A number from 0 to 100: the mouth opens with it."}],build:c(({centre:i,size:e,power:t})=>{const a=z(i),s=Hi({prefix:"wormhole",at:a.ref,size:Math.max(1,Number(e)||70),power:t?String(t):void 0});return{points:[...a.points,...s.points],objects:s.objects}},"build")},mi=94607304725808e-1,fi=[{id:"a",label:"TERRITORY A",color:"var(--lcars-blue)",angle:[0,60]},{id:"b",label:"TERRITORY B",color:"var(--lcars-red)",angle:[70,130]},{id:"c",label:"TERRITORY C",color:"var(--lcars-green)",angle:[140,200]}],Ks={id:"sector_volumes",kind:"part",title:"Sector volume set",summary:"Three territories as see-through volumes of cells",description:"Three territories side by side round a centre, each a see-through volume of cells in its own colour with its name above it. Tap one to fly to it.",icon:"mdi:cube-outline",params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"zone"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"inner",label:"Inner radius",type:"number",default:30,real:5*mi,fit:true},{key:"outer",label:"Outer radius",type:"number",default:80,real:20*mi,fit:true}],build:c(({centre:i,inner:e,outer:t})=>{const a=z(i),s=Number(e)||30,n=Number(t)||80,r=Math.abs(n-s)/50||1,l=c(o=>Number(o.toPrecision(3)),"sig");return{points:[...a.points,...fi.map(o=>({id:o.id,at:a.ref,offset:Ws((s+n)/2,(o.angle[0]+o.angle[1])/2,l(16*r)),label:o.label,style:"major",color:o.color}))],objects:fi.map(o=>({type:"volume",id:`${o.id}_space`,at:a.ref,shape:"sector",radius:[s,n],angle:o.angle,height:[l(-4*r),l(10*r)],cells:{ring:10,angle:10,layer:7},color:o.color,tap_action:{action:"fly-to"}}))}},"build")};function Ws(i,e,t){const a=e*Math.PI/180,s=c(n=>Math.round(n*10)/10,"r1");return[s(i*Math.sin(a)),t,s(-i*Math.cos(a))]}c(Ws,"polarOffset");const yi={deep_space_nine:[["ops","OPS"],["promenade","PROMENADE"],["docking_ring","DOCKING RING"]],earth_spacedock:[["space_doors","SPACE DOORS"],["hull","HULL"]],utopia_planitia_drydock:[["bow","BOW"],["berth","BERTH"]]},Ye={deep_space_nine:1.452,earth_spacedock:5.48,utopia_planitia_drydock:.76},Ys={id:"starbase",kind:"part",title:"Starbase",summary:"A built-in starbase model with its parts labelled",description:"A built-in starbase model (Deep Space 9, Earth Spacedock or a Utopia Planitia drydock) at a point, with its name and main parts labelled; far away a starbase marker stands in for it. Tap the name to fly to it.",icon:"mdi:space-station",params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"starbase"},{key:"label",label:"Label",type:"text",default:"DEEP SPACE 9"},{key:"model",label:"Model",type:"text",default:"deep_space_nine",helper:"deep_space_nine, earth_spacedock or utopia_planitia_drydock.",options:[{value:"deep_space_nine",label:"Deep Space 9"},{value:"earth_spacedock",label:"Earth Spacedock"},{value:"utopia_planitia_drydock",label:"Utopia Planitia drydock"}]},{key:"centre",label:"At",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"size",label:"Size (its largest extent)",type:"number",default:60,real:c(({model:i})=>Ye[String(i)]??Ye.deep_space_nine,"real")}],build:c(({label:i,model:e,centre:t,size:a},{units:s})=>{const n=z(t),r=yi[String(e)]?String(e):"deep_space_nine",l=Number(a)||60,o=U(s),d=o!==null&&Number((Ye[r]/o).toPrecision(3))===l;return{points:[...n.points,{id:"name",at:n.ref,offset:[0,l*.7,0],label:String(i),style:"minor",tap_action:{action:"fly-to",view:"view"}},...yi[r].map(([u,y])=>({id:u,object:"station",part:u,marker:"dot",label:y,style:"tiny",max_distance:l*6})),{id:"far",at:n.ref,marker:"starbase",min_distance:l*12,tap_action:{action:"fly-to",view:"view"}}],objects:[{type:"model",id:"station",src:`builtin:${r}`,at:n.ref,...d?{}:{size:l},material:"original",max_distance:l*12}],views:{view:{target:n.ref,yaw:30,tilt:15,distance:l*2}}}},"build")},Gs=94607304725808e-1,qs={id:"badlands",kind:"part",title:"Badlands (Deep Space Nine)",summary:"Plasma sheets, a glowing band and fire columns to fly between",description:"The Badlands as Deep Space Nine drew them (nebula preset: badlands): a floor and a ceiling of liquid fire in yellow, orange and red, an orange band glowing in the gap between them and fire columns, thick and thin, standing from the floor to the ceiling. Fly the camera into the gap. Every key of the preset can be set on the nebula to change it.",icon:"mdi:fire",picture:{camera:{target:[0,0,0],yaw:30,tilt:22,distance:620}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"badlands"},{key:"label",label:"Label",type:"text",default:"BADLANDS"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"width",label:"Width",type:"number",default:500,real:10*Gs,fit:true}],build:c(({label:i,centre:e,width:t})=>{const a=z(e),s=Number(t)||500;return{points:[...a.points,{id:"heart",at:a.ref,label:String(i),style:"major"}],objects:[{type:"nebula",id:"plasma",at:"heart",preset:"badlands",size:[s,j(s*.28),s]}]}},"build")},Js=94607304725808e-1,Qs={id:"badlands_voyager",kind:"part",title:"Badlands (Voyager)",summary:"Mauve plasma layers with lightning columns and strikes",description:"The Badlands as Voyager drew them (nebula preset: badlands_voyager): a floor and a ceiling of peach and mauve gas with a pale band between, held pink lightning columns crawling from the floor to the ceiling, and strikes that flash in the gap and light the gas round them. Fly the camera into the gap. Every key of the preset can be set on the nebula to change it.",icon:"mdi:lightning-bolt",picture:{camera:{target:[0,0,0],yaw:200,tilt:4,distance:160}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"badlands"},{key:"label",label:"Label",type:"text",default:"BADLANDS"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"width",label:"Width",type:"number",default:500,real:10*Js,fit:true}],build:c(({label:i,centre:e,width:t})=>{const a=z(e),s=Number(t)||500;return{points:[...a.points,{id:"heart",at:a.ref,label:String(i),style:"major"}],objects:[{type:"nebula",id:"plasma",at:"heart",preset:"badlands_voyager",size:[s,j(s*.32),s]}]}},"build")},Zs=94607304725808e-1,Xs={id:"nexus",kind:"part",title:"The Nexus",summary:"A white-hot ribbon of energy trailing a wake of pink gas",description:"The Nexus as Generations drew it (nebula preset: nexus): a white-hot ribbon waving across space, its waves running along it, a wake of pink and red gas streaming out behind it, and small discharges crawling off it and lighting the gas. Set travel to orbit to send it round the centre on a wide orbit, its wake trailing behind. Every key of the preset can be set on the nebula to change it.",icon:"mdi:wave",picture:{camera:{target:[0,-60,0],yaw:8,tilt:6,distance:1500}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"nexus"},{key:"label",label:"Label",type:"text",default:"NEXUS"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"length",label:"Length",type:"number",default:2e3,real:Zs,fit:true},{key:"travel",label:"Travel",type:"text",default:"still",options:[{value:"still",label:"Still (its waves still run)"},{value:"orbit",label:"Round the centre on a wide orbit"}]}],build:c(({label:i,centre:e,length:t,travel:a})=>{const s=z(e),n=Number(t)||2e3;if(a!=="orbit")return{points:[...s.points,{id:"heart",at:s.ref,label:String(i),style:"major"}],objects:[{type:"nebula",id:"ribbon",at:"heart",preset:"nexus",size:[n,j(n/4),j(n/4)]}]};const r=n*1.5;return{points:[...s.points,{id:"heart",polar:[r,0],object:"track",label:String(i),style:"major"}],objects:[{type:"ring",id:"track",at:s.ref,radius:r,spin:2,width:.5,opacity:0},{type:"nebula",id:"ribbon",at:"heart",preset:"nexus",size:[n,j(n/4),j(n/4)],face:"motion",rotation:[-90,0,0]}]}},"build")},en=.6425/3,tn={id:"crystalline-entity",kind:"part",title:"Crystalline Entity",summary:"The Crystalline Entity, with a ship beside it for scale",description:`The Crystalline Entity ("Datalore", "Silicon Avatar"): a crystalline object 3 km tall, turning slowly about its glowing spine, its core pulsing. With a ship, a Galaxy-class starship (the Enterprise of both episodes) stands off its side at the same scale (642.5 m against 3 km), and with the beam the entity's core fires on it. Change the crystal colour on the object (var(--lcars-african-violet) for the lavender of the show).`,icon:"mdi:snowflake",picture:{camera:{target:[-800,0,0],yaw:0,tilt:5,distance:5e3}},params:[{key:"prefix",label:"Name (prefix for its ids)",type:"text",default:"entity"},{key:"label",label:"Label",type:"text",default:"CRYSTALLINE ENTITY"},{key:"centre",label:"Centre",type:"point",default:[0,0,0],helper:"A point id or x, y, z."},{key:"size",label:"Height",type:"number",default:3e3,real:3,fit:true},{key:"ship",label:"Ship for scale",type:"text",default:"beam",options:[{value:"beam",label:"A ship, and the entity's beam on it"},{value:"ship",label:"A ship"},{value:"none",label:"No ship"}]}],build:c(({label:i,centre:e,size:t,ship:a})=>{const s=z(e),n=Number(t)||3e3,r=[...s.points,{id:"core",at:s.ref},{id:"tag",at:"core",offset:[0,j(n*.56),0],label:String(i),style:"major"}],l=[{type:"crystalline",id:"crystal",at:"core",size:n,spin:2}];return(a==="ship"||a==="beam")&&(r.push({id:"ship_at",at:"core",offset:[j(-n*.7),j(-n*.03),j(n*.1)],label:"USS ENTERPRISE",style:"minor"}),l.push({type:"model",id:"ship",src:"builtin:galaxy_class",at:"ship_at",size:j(n*en)}),a==="beam"&&l.push({type:"beam",id:"beam",from:"core",to:"ship_at",width:10,color:"var(--lcards-moonlight)",pulse:true})),{points:r,objects:l}},"build")},Q=[ls,cs,ds,us,ps,ms,fs,Ss,As,Os,Ts,Es,ks,Rs,Ds,Bs,Us,Fs,qs,Qs,Xs,tn,Hs,Ks,Ys,Ps,zs,Cs],an=new Set(["id","at","object","target","from","to","points","view","light","face","point"]),Te=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$7"),sn=.25,nn=c((i,e)=>{const t=i[e.key];return t===void 0||t===""||t===null?void 0:t},"typedValue");function Yi(i,e,t=null,a={}){if(i.kind!=="part"||i.scene||U(t)!==null||!e)return null;const s=i.params.filter(o=>o.fit);if(!s.length||!ge(e))return null;const n=hi(e),r=Object.fromEntries(Object.entries(a).filter(([o])=>!s.some(d=>d.key===o))),l=hi(i.build(be(i,r),{units:null}));return!(n>0)||!(l>0)?null:(i.fitShare??sn)*n/l}c(Yi,"fitFactor");function be(i,e={},t=null,a=null){const s={},n=U(t),r=c(o=>nn(e,o),"typed");for(const o of i.params)(o.real===void 0||n===null)&&(s[o.key]=bi(o,r(o)??o.default));for(const o of i.params){if(o.real===void 0||n===null)continue;const d=typeof o.real=="function"?o.real(s):o.real;s[o.key]=bi(o,r(o)??j(d/n))}const l=a?Yi(i,a,t,e):null;if(l!==null)for(const o of i.params)o.fit&&r(o)===void 0&&(s[o.key]=j(Number(o.default)*l));return s}c(be,"starterParams");const bi=c((i,e)=>i.type==="point"?on(e):i.type==="number"?Number(e):e,"convert");function St(i,e){if(e===void 0||e<0)return i.units??null;const t=Array.isArray(i.objects)?i.objects[e]:void 0;return(t==null?void 0:t.units)!==void 0?t.units:(t==null?void 0:t.scale)===void 0?i.units??null:null}c(St,"targetUnits");const rn=c((i,e,t,a=null)=>i.build(be(i,e,t,a),{units:U(t)===null?null:t}),"buildStarter");function on(i){if(Array.isArray(i))return i.map(Number);const e=String(i??"").trim(),t=e.replace(/^\[|\]$/g,"").split(/[\s,]+/).filter(Boolean).map(Number);return t.length===3&&t.every(Number.isFinite)?t:e}c(on,"parsePointParam");function Gi(i){return i=Ci(i),{points:(i.points??[]).map(e=>e==null?void 0:e.id).filter(e=>e!==void 0).map(String),objects:(i.objects??[]).map(e=>e==null?void 0:e.id).filter(e=>e!==void 0).map(String),views:Object.keys(i.views??{})}}c(Gi,"fragmentIds");function ln(i,e){if(!e)return i;const t=Gi(i),a=new Set([...t.points,...t.objects,...t.views]),s=c(l=>`${e}_${l}`,"name"),n=c((l,o)=>typeof l=="string"?o&&an.has(o)&&a.has(l)?s(l):l:Array.isArray(l)?l.map(d=>n(d,o==="points"?o:null)):Te(l)?Object.fromEntries(Object.entries(l).map(([d,u])=>[d,n(u,d)])):l,"walk"),r={...i};return i.points&&(r.points=n(i.points,null)),i.objects&&(r.objects=n(i.objects,null)),i.views&&(r.views=Object.fromEntries(Object.entries(i.views).map(([l,o])=>[s(l),n(o,null)]))),r}c(ln,"prefixFragment");function qi(i){var a;i=Ci(i);const e=Array.isArray(i.points)?i.points:[],t=Array.isArray(i.objects)?i.objects:[];return{points:new Set(e.map(s=>s==null?void 0:s.id).filter(s=>s!==void 0).map(String)),objects:new Set(t.map(s=>s==null?void 0:s.id).filter(s=>s!==void 0).map(String)),views:new Set(Object.keys(Te((a=i.camera)==null?void 0:a.views)?i.camera.views:{}))}}c(qi,"configIds");function ge(i){const e=qi(i);return e.points.size>0||Array.isArray(i.objects)&&i.objects.length>0||e.views.size>0}c(ge,"hasScene");const cn=["points","objects","camera","backdrop","labels","background_animation","units","clock"];function dn(i,e,t={},a){const s=St(i,a),n=rn(e,t,s,pe(i,a));return n.units!==void 0&&s!==n.units&&ge(pe(i,a))?n.units:null}c(dn,"unitsClash");const pe=c((i,e)=>{var t;return e===void 0||e<0?i:((t=i.objects)==null?void 0:t[e])??{}},"targetOf");function Ae(i,e,t={},{mode:a,system:s}={}){var g,_,$,S,k,T;const n=(a??(e.kind==="scene"?"replace":"merge"))==="replace",r=s!==void 0&&s>=0?s:void 0;if(r!==void 0){if(e.kind!=="part"||n)return{error:"Only a part can go into a system, added next to what is there."};if(((_=(g=i.objects)==null?void 0:g[r])==null?void 0:_.type)!=="system")return{error:`Object ${r} is not a system.`}}const l={...i};if(n)for(const v of cn)delete l[v];const o=St(l,r),d=be(e,t,o,pe(l,r));let u=e.build(d,{units:U(o)===null?null:o});e.kind==="part"&&(u=ln(u,String(d.prefix??"").trim()));const y=pe(l,r);if(u.units!==void 0&&!n&&o!==u.units&&ge(y)){const v=r===void 0?"the card":"this system",Y=r===void 0?"replace the scene instead":"add it to the scene instead";return{error:`This ${e.kind} is in ${u.units} and ${v} is in ${o??"scene units"}: ${Y}.`}}const h=qi(l),m=Gi(u),f=[...m.points.filter(v=>h.points.has(v)).map(v=>`point ${v}`),...m.objects.filter(v=>h.objects.has(v)).map(v=>`object ${v}`),...m.views.filter(v=>h.views.has(v)).map(v=>`view ${v}`)];if(f.length){const v=e.kind==="part"?" Choose another prefix.":" Replace the scene, or rename them first.";return{error:`Already in this card: ${f.join(", ")}.${v}`}}const b=l;if(r!==void 0){const v={...l.objects[r]};($=u.points)!=null&&$.length&&(v.points=[...Array.isArray(v.points)?v.points:[],...u.points]),(S=u.objects)!=null&&S.length&&(v.objects=[...Array.isArray(v.objects)?v.objects:[],...u.objects]),u.units!==void 0&&o!==u.units&&(v.units=u.units,delete v.scale),b.objects=l.objects.map((Y,Me)=>Me===r?v:Y)}else(k=u.points)!=null&&k.length&&(b.points=[...Array.isArray(l.points)?l.points:[],...u.points]),(T=u.objects)!=null&&T.length&&(b.objects=[...Array.isArray(l.objects)?l.objects:[],...u.objects]);if(u.views||u.camera){const v={...Te(l.camera)?l.camera:{}};if(u.camera)for(const[Y,Me]of Object.entries(u.camera))(n||v[Y]===void 0)&&(v[Y]=Me);u.views&&(v.views={...Te(v.views)?v.views:{},...u.views}),b.camera=v}return u.backdrop&&(n||b.backdrop===void 0)&&(b.backdrop=u.backdrop),u.units!==void 0&&r===void 0&&(b.units=u.units),u.clock&&(n||b.clock===void 0)&&(b.clock=u.clock),{config:b,added:u}}c(Ae,"applyStarter");const gi=130,Oe=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$6");function Ee(i){return Array.isArray(i)?`[${i.map(Ee).join(", ")}]`:Oe(i)?Object.keys(i).length===0?"{}":`{ ${Object.entries(i).map(([e,t])=>`${ct(e)}: ${Ee(t)}`).join(", ")} }`:ct(i)}c(Ee,"flow");function ct(i){const e=aa.dump(i,{lineWidth:-1}).trim();return typeof i=="string"&&!/^['"]/.test(e)&&/[,[\]{}]/.test(i)?JSON.stringify(i):e}c(ct,"scalar");function dt(i,e){const t=[];if(Array.isArray(i)){for(const a of i){const s=`${e}- ${Ee(a)}`;if(!Oe(a)&&!Array.isArray(a)||s.length<=gi){t.push(s);continue}const n=dt(a,`${e}  `);t.push(`${e}- ${n[0].trimStart()}`,...n.slice(1))}return t}for(const[a,s]of Object.entries(i)){const n=`${e}${ct(a)}:`,r=`${n} ${Ee(s)}`;!Oe(s)&&!Array.isArray(s)||r.length<=gi||Array.isArray(s)&&!s.some(l=>Oe(l)||Array.isArray(l))?t.push(r):t.push(n,...dt(s,`${e}  `))}return t}c(dt,"block");function hn(i){return`${dt(i,"").join(`
`)}
`}c(hn,"starterYaml");const O=-1,_e=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$5"),ht=c(i=>i==null||i==="","blank"),se=c(i=>Array.isArray(i==null?void 0:i.objects)?i.objects:[],"rootObjects");function ne(i,e){const t=e>=0?se(i)[e]:void 0;return _e(t)&&t.type==="system"?t:null}c(ne,"scopeSystem");function un(i,e){return ne(i,e)?e:O}c(un,"validScope");function ut(i,e,t){const a=ne(i,e)??i;return Array.isArray(a==null?void 0:a[t])?a[t]:[]}c(ut,"scopedList");function _i(i,e,t,a){const s=c((r,l)=>{const o={...r};return!a||!a.length&&!l?delete o[t]:o[t]=a,o},"put"),n=ne(i,e);return n?{...i,objects:se(i).map((r,l)=>l===e?s(n,false):r)}:s(i,t==="points")}c(_i,"setScopedList");function Ie(i){const e={};let t=0;const a=c(r=>{if((r==null?void 0:r.type)==="system")return t++,ht(r.id)?`system#${t}`:String(r.id);const l=String(r==null?void 0:r.type);return e[l]=(e[l]??0)+1,ht(r==null?void 0:r.id)?`${l}#${e[l]}`:String(r.id)},"name"),s=[],n=new Map;return se(i).forEach((r,l)=>{s.push(a(r)),_e(r)&&r.type==="system"&&n.set(l,(Array.isArray(r.objects)?r.objects:[]).map(a))}),{scene:s,systems:n}}c(Ie,"sceneObjectIds");function pn(i,e){const t=Ie(i);return ne(i,e)?t.systems.get(e)??[]:t.scene}c(pn,"scopedObjectIds");function Ge(i,e){const t=c(s=>Array.isArray(s)&&s.some(n=>n&&String(n.id)===e),"has");if(t(i==null?void 0:i.points))return O;const a=se(i).findIndex(s=>_e(s)&&s.type==="system"&&t(s.points));return a>=0?a:null}c(Ge,"pointScope");function mn(i,e){const t=Ie(i),a=t.scene.indexOf(e);if(a>=0)return{scope:O,index:a};for(const[s,n]of t.systems){const r=n.indexOf(e);if(r>=0)return{scope:s,index:r}}return null}c(mn,"objectScope");function fn(i){return[i==null?void 0:i.points,...se(i).filter(t=>_e(t)&&t.type==="system").map(t=>t.points)].flatMap(t=>Array.isArray(t)?t:[]).map(t=>t==null?void 0:t.id).filter(t=>!ht(t)).map(String)}c(fn,"allPointIds");function yn(i,e){if(!ne(i,e))return i;const t=se(i).flatMap(a=>_e(a)&&a.type==="system"?[a,...Array.isArray(a.objects)?a.objects:[]]:[a]);return{...i,points:ut(i,e,"points"),objects:t}}c(yn,"pointsEditorConfig");function wi(i){const e=Ie(i);return[...e.scene,...[...e.systems.values()].flat()]}c(wi,"allObjectIds");const vi=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$4"),bn=800;function pt(i,e,t="",a=[]){if(i===e)return a;if(Array.isArray(i)&&Array.isArray(e)&&i.length===e.length)i.forEach((s,n)=>pt(s,e[n],t?`${t}.${n}`:String(n),a));else if(vi(i)&&vi(e))for(const s of new Set([...Object.keys(i),...Object.keys(e)]))pt(i[s],e[s],t?`${t}.${s}`:s,a);else JSON.stringify(i)!==JSON.stringify(e)&&a.push(t);return a}c(pt,"changedPaths");function gn({limit:i=100,now:e=c(()=>Date.now(),"now")}={}){let t=[],a=[],s=null;return{push(n,r,{step:l=false}={}){const o=pt(n,r);if(!o.length)return;const d=o.join("|"),u=e();if(a=[],!l&&s&&s.key===d&&u-s.at<bn&&t.length){s.at=u;return}t.push(n),t.length>i&&(t=t.slice(t.length-i)),s=l?null:{key:d,at:u}},undo(n){return t.length?(s=null,a.push(n),t.pop()):null},redo(n){return a.length?(s=null,t.push(n),a.pop()):null},get canUndo(){return t.length>0},get canRedo(){return a.length>0},clear(){t=[],a=[],s=null}}}c(gn,"createHistory");const je=[{name:"top",label:"Top",yaw:0,tilt:90},{name:"front",label:"Front",yaw:0,tilt:0},{name:"side",label:"Side",yaw:90,tilt:0}];function _n(i,e){const t=je[i];return{target:e.target,distance:e.distance,fov:e.fov,yaw:t.yaw,tilt:t.tilt,projection:"orthographic"}}c(_n,"quickViewKeys");const qe=[null,"diagram","realistic","mixed"];function $i(i){const e=qe.indexOf(i);return qe[(e+1)%qe.length]}c($i,"nextLook");const Je=c(i=>{const e=Math.abs(i);if(e>=1e6){for(const[t,a]of[[1e12,"trillion"],[1e9,"billion"],[1e6,"million"]])if(e>=t)return`${Number((i/t).toPrecision(3)).toLocaleString("en-US")} ${a}`}return Number(i.toPrecision(3)).toLocaleString("en-US")},"sig"),ke=["m","km","au","ly","pc"];function wn(i,e,t){const a=Math.hypot(e[0]-i[0],e[1]-i[1],e[2]-i[2]),s=ke.indexOf(t);if(s<0)return`${Je(a)} ${t||"scene units"}`;const n=a*Mt[ke[s]],r=[ke[s-1],ke[s+1]].filter(l=>l!==void 0&&l!=="m").map(l=>[l,n/Mt[l]]).find(([,l])=>l>=.01&&l<1e9);return`${Je(a)} ${t}${r?` (${Je(r[1])} ${r[0]})`:""}`}c(wn,"measureText");function vn(i,e){const t=Array.isArray(i==null?void 0:i.objects)?i.objects:[],a=Ie(i),s=c(l=>l&&typeof l=="object"?{...l,visible:false}:l,"hide");let n=false;const r=t.map((l,o)=>{if(a.scene[o]===e)return n=true,l;const d=a.systems.get(o);if(d){const u=d.indexOf(e);u>=0&&(n=true);const y=Array.isArray(l.objects)?l.objects.map((h,m)=>m===u?h:s(h)):l.objects;return{...l,objects:y,...u>=0?{}:{visible:false}}}return s(l)});return n?{...i,objects:r}:i}c(vn,"isolateConfig");function D(i){if(!Number.isFinite(i))return"-";if(i===0)return"0";const e=Math.abs(i);return e<.001||e>=1e9?i.toExponential(2).replace(/\.?0+e/,"e"):Number(i.toPrecision(3)).toLocaleString("en-US",{maximumFractionDigits:6})}c(D,"shortNumber");function mt(i){if(!(i>0)||!Number.isFinite(i))return 1;const e=Math.floor(Math.log10(i)),t=i/10**e;return Number(((t>=5?5:t>=2?2:1)*10**e).toPrecision(1))}c(mt,"roundLength");function $n(i){return mt(i/5)}c($n,"fitToViewSize");function kn(i,e,t){const a=sa[i==null?void 0:i.file_units]!==void 0?String(i.file_units):"m",s=e?Math.max(...e):null,n=e?`${e.map(D).join(" x ")} ${a} (largest ${D(s)} ${a})`:null,r=Lt(a,U(t)),l=na(i),[o,d]=l!==null?[l,"m"]:[s,a],u=l!==null?Lt("m",U(t)):r,y=o!==null&&u!==null?o*u:null,h=y===null?null:d===t?`${D(y)} ${t}`:`${l!==null?l.toLocaleString("en-US",{maximumFractionDigits:3}):D(o)} ${d} = ${D(y)} ${t}`,m=ra(i);return m!==null?{file:n,largest:s,mode:"size",real:h,realSize:y,note:`Drawn at size ${D(m)}${t?` ${t}`:""} across.`}:r!==null&&l!==null?{file:n,largest:s,mode:"real",real:h,realSize:y,note:`Drawn at its real length: ${h}.`}:r!==null?{file:n,largest:s,mode:"real",real:h,realSize:y,note:h?`Drawn at its real size, as the file measures: ${h}. Set Length (m) if the file is not at its true scale.`:"Drawn at its real size."}:{file:n,largest:s,mode:"default",real:null,realSize:null,note:"Drawn at 50 across: the scene has no units, so there is no real size. Give the scene units (km, au, ly) in the Scene tab for one, or set a size."}}c(kn,"modelSizeReadout");const At="/lcards/images/astro-studio/";function ki(i){return vt(`${At}starter-${i}.webp`)}c(ki,"starterPicture");function xn(i){return vt(`${At}type-${i}.webp`)}c(xn,"typePicture");function Sn(i,e){return vt(`${At}shape-${i}-${e}.webp`)}c(Sn,"shapePicture");const An=[{id:"maps",header:"Maps and grids",icon:"mdi:grid",types:["grid","volume","image"]},{id:"bodies",header:"Bodies",icon:"mdi:earth",types:["sphere","belt","asteroid","comet"]},{id:"routes",header:"Routes and motion",icon:"mdi:vector-polyline",types:["ring","path","beam","trail"]},{id:"light",header:"Light and clouds",icon:"mdi:white-balance-sunny",types:["glow","nebula","galaxy","lightning"]},{id:"models",header:"Ships and models",icon:"mdi:rocket",types:["model","cube","crystalline"]},{id:"systems",header:"Systems",icon:"mdi:folder-outline",types:["system"]}],On={oneOf:[{type:"string"},{type:"array",items:{type:"number"},minItems:3,maxItems:3}]};function jn(i){var t;const e={};for(const a of i.params){const s={"x-ui-hints":{label:a.label}},n=a.real!==void 0?`In scene units; in named units (km, au, ly) it starts at a real size${a.fit?", in a scene without named units at a size that fits it":""}.`:a.fit?"In scene units; it starts at a size that fits the scene.":void 0,r=[a.helper,n].filter(Boolean).join(" ")||void 0;a.type==="number"?e[a.key]={type:"number",description:r,...s}:a.type==="point"?e[a.key]={...On,description:r,...s}:(t=a.options)!=null&&t.length&&!a.custom?e[a.key]={type:"string",enum:a.options.map(l=>l.value),default:a.default,description:r,...s,enumDescriptions:Object.fromEntries(a.options.map(l=>[l.value,l.label]))}:e[a.key]={type:"string",description:r,...s}}return e}c(jn,"starterParamSchema");function Tn(i){return Object.fromEntries(i.params.filter(e=>{var t;return((t=e.options)==null?void 0:t.length)&&e.custom}).map(e=>[e.key,(e.options??[]).map(t=>t.value)]))}c(Tn,"starterParamChoices");function En(i,e={},t=null,a=null){const s=be(i,e,t,a);return{...Object.fromEntries(i.params.map(n=>[n.key,n.real!==void 0||n.fit?s[n.key]:n.default])),...e}}c(En,"starterParamValues");function Ji(i){var t,a;const e=c((s,n)=>s?`${s} ${n}${s===1?"":"s"}`:null,"n");return[e(((t=i.points)==null?void 0:t.length)??0,"point"),e(((a=i.objects)==null?void 0:a.length)??0,"object"),e(Object.keys(i.views??{}).length,"view")].filter(Boolean).join(", ")}c(Ji,"fragmentCounts");function Pn(i,e={}){const t=Ae({},i,e);return t.added?Ji(t.added):String(t.error)}c(Pn,"starterAdds");const zn={m:"metres",km:"kilometres",au:"astronomical units",ly:"light years",pc:"parsecs"};function Cn(i){const e=i.build(be(i),{units:null}).units;return e?`In ${zn[e]??e}: sizes and distances are real, and parts you add start at their real size.`:"In scene units, sized to be seen: parts you add are sized to fit it."}c(Cn,"sceneUnitsText");const xi=c(i=>Array.from({length:28},(e,t)=>{const a=t/27,s=i+a*4.6,n=5+a*46;return`${(60+Math.cos(s)*n).toFixed(1)},${(60+Math.sin(s)*n*.55).toFixed(1)}`}).join(" "),"ARM"),M=c((i,e,t,a,s=120)=>A`
  <g transform="translate(${i} 0)">
    <rect class="frame" x="0.5" y="0.5" width=${s-1} height="120" rx="6"></rect>
    ${a}
    <text class="title" x=${s/2} y="137" text-anchor="middle">${e}</text>
    <text class="caption" x=${s/2} y="152" text-anchor="middle">${t}</text>
  </g>`,"panel"),Nn={scale:{label:"A scene in light years holds a star system in kilometres at one of its points; a planet in that system has points on its surface",body:c(()=>A`
      ${M(0,"SCENE","light years",A`
        <polyline class="arm" points=${xi(0)}></polyline><polyline class="arm" points=${xi(Math.PI)}></polyline>
        <ellipse class="fill" cx="60" cy="60" rx="5" ry="3"></ellipse>
        <circle class="point" cx="88" cy="76" r="2.4"></circle>
        <text class="label" x="84" y="92">SOL</text>`)}
      <line class="zoom" x1="90" y1="76" x2="140" y2="0.5"></line>
      <line class="zoom" x1="90" y1="76" x2="140" y2="120.5"></line>
      ${M(140,"SYSTEM","km or au, at a point",A`
        <ellipse class="line" cx="60" cy="60" rx="22" ry="12"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="44" ry="24"></ellipse>
        <circle class="star" cx="60" cy="60" r="6"></circle>
        <circle class="body" cx="98" cy="72" r="4"></circle>
        <text class="label" x="84" y="90">EARTH</text>`)}
      <line class="zoom" x1="240" y1="72" x2="280" y2="0.5"></line>
      <line class="zoom" x1="240" y1="72" x2="280" y2="120.5"></line>
      ${M(280,"OBJECT + POINTS","points stand on it",A`
        <circle class="body" cx="60" cy="60" r="38"></circle>
        <ellipse class="line" cx="60" cy="60" rx="38" ry="12"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="14" ry="38"></ellipse>
        <circle class="point" cx="44" cy="48" r="2.4"></circle>
        <text class="label" x="48" y="45">BASE</text>
        <circle class="point" cx="72" cy="70" r="2.4"></circle>
        <text class="label" x="76" y="67">PORT</text>`)}`,"body")},starters:{label:"A scene starter replaces the card's scene or merges into it; a part adds one thing with ids that start with its name",body:c(()=>A`
      ${M(0,"SCENE","replace or merge",A`
        <rect class="line" x="12" y="30" width="38" height="44" rx="3"></rect>
        <circle class="point" cx="24" cy="44" r="2.4"></circle><circle class="point" cx="38" cy="60" r="2.4"></circle>
        <text class="small" x="31" y="88" text-anchor="middle">yours</text>
        <path class="arrow" d="M54 52 H66 M62 48 L66 52 L62 56"></path>
        <rect class="fill-soft" x="70" y="30" width="38" height="44" rx="3"></rect>
        <polyline class="arm" points="80,60 86,48 96,46 100,54"></polyline>
        <text class="small" x="89" y="88" text-anchor="middle">starter</text>`,120)}
      ${M(140,"PART","adds one thing",A`
        <rect class="line" x="12" y="30" width="60" height="50" rx="3"></rect>
        <circle class="point" cx="26" cy="46" r="2.4"></circle><circle class="point" cx="44" cy="64" r="2.4"></circle>
        <text class="small" x="42" y="94" text-anchor="middle">your scene</text>
        <text class="label big" x="82" y="58" text-anchor="middle">+</text>
        <circle class="body" cx="102" cy="54" r="9"></circle>
        <ellipse class="line" cx="102" cy="54" rx="15" ry="5"></ellipse>
        <text class="small" x="102" y="78" text-anchor="middle">mars_body</text>
        <text class="small" x="102" y="88" text-anchor="middle">mars_orbit</text>`,130)}
      ${M(290,"COPIED","yours to change",A`
        <rect class="fill-soft" x="15" y="25" width="80" height="60" rx="3"></rect>
        <text class="small" x="24" y="42">points:</text>
        <text class="small" x="24" y="56">objects:</text>
        <text class="small" x="24" y="70">camera:</text>`,110)}`,"body")},placement:{label:"A point stands on the ground plane by coordinates or bearing and range, on a sphere by latitude and longitude, or in a sector map cell",body:c(()=>A`
      ${M(0,"XYZ · POLAR","the ground plane",A`
        <polygon class="line" points="10,90 40,40 110,40 80,90"></polygon>
        <circle class="star" cx="60" cy="65" r="2.4"></circle>
        <line class="zoom" x1="60" y1="65" x2="88" y2="52"></line>
        <path class="line" d="M74 65 A 14 6 0 0 0 72 59"></path>
        <circle class="point" cx="88" cy="52" r="2.6"></circle>
        <text class="label" x="60" y="28" text-anchor="middle">[distance, bearing]</text>`)}
      ${M(140,"LATLON","on a sphere",A`
        <circle class="body" cx="60" cy="60" r="38"></circle>
        <ellipse class="line" cx="60" cy="60" rx="38" ry="11"></ellipse>
        <ellipse class="line" cx="60" cy="60" rx="15" ry="38"></ellipse>
        <circle class="point" cx="73" cy="44" r="2.6"></circle>
        <text class="label" x="78" y="40">[lat, lon]</text>`)}
      ${M(280,"CELL","on a sector map",A`
        ${[0,1,2,3].map(i=>A`<line class="line" x1=${20+i*27} y1="30" x2=${20+i*27} y2="111"></line><line class="line" x1="20" y1=${30+i*27} x2="101" y2=${30+i*27}></line>`)}
        ${["A","B","C"].map((i,e)=>A`<text class="small" x=${33+e*27} y="24" text-anchor="middle">${i}</text>`)}
        ${[1,2,3].map((i,e)=>A`<text class="small" x="12" y=${47+e*27} text-anchor="middle">${i}</text>`)}
        <rect class="fill-soft" x="47" y="57" width="27" height="27"></rect>
        <circle class="point" cx="60.5" cy="70.5" r="2.6"></circle>
        <text class="label" x="60.5" y="80" text-anchor="middle">B2</text>`)}`,"body")},camera:{label:"A camera view: the target it looks at, the yaw it is turned round the target, the tilt it looks down at, and its distance",body:c(()=>A`
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
      </g>`,"body")},distance:{label:"An object shows while the camera is between its min_distance and max_distance, fading in and out at the edges",body:c(()=>A`
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
      </g>`,"body")}},Pe=class Pe2 extends me{static get properties(){return{kind:{type:String}}}constructor(){super(),this.kind="scale"}render(){const e=Nn[this.kind];return e?p`<svg viewBox="0 -4 400 162" role="img" aria-label=${e.label}>${e.body()}</svg>`:w}};c(Pe,"LCARdSAstroDiagram"),Nt(Pe,"styles",ae`
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
  `);let ft=Pe;customElements.get("lcards-astro-diagram")||customElements.define("lcards-astro-diagram",ft);const we=c(i=>p`
  <div class="info-guide-links">
    ${i.map(([e,t])=>p`<a href=${$t(t)} target="_blank" rel="noopener">${e}</a>`)}
  </div>`,"links");function In({open:i=false}={}){return fe({id:"astro-overview",header:"How an Astrometrics scene works",icon:"mdi:telescope",open:i,body:p`
      <lcards-astro-diagram kind="scale"></lcards-astro-diagram>
      <ul>
        <li><b>Objects</b> are what is drawn: grids and sector maps, planets, rings and orbits, routes, nebulae, galaxies, ships and stations.</li>
        <li><b>Points</b> are named places. They carry labels and markers, and objects, routes and camera views name them by id. A point can stand on an object: a city on a planet, a cell of a sector map, a part of a ship.</li>
        <li><b>Units</b> are yours to pick (Scene tab, Units). Positions, sizes and distances are all in scene units; name them (light years, au, km) when you use real numbers. Each length field shows its unit, and a part you add is sized to fit the scene, or at its real size when the units are named.</li>
        <li><b>Systems</b> hold their own points and objects in units of their own at a point of the scene: a galaxy in light years with a solar system in km inside it. Open one from its row in the Objects tab. The camera works in a system's units while it is near.</li>
        <li><b>Camera views</b> are named places to look from. Tap actions fly to them, and one is where the card starts.</li>
      </ul>
      <div class="info-guide-tip">Build in tab order: pick a starter, set the scene, add objects, put points on them, then capture views.</div>
      ${we([["The Astrometrics card",P.card],["Scale and units",P.scale],["Star systems",P.systems],["The Studio",P.studio]])}
    `})}c(In,"overviewGuide");function Mn(){return fe({id:"astro-starters",header:"About starters",icon:"mdi:rocket-launch-outline",body:p`
      <lcards-astro-diagram kind="starters"></lcards-astro-diagram>
      <ul>
        <li><b>Scenes</b> are whole cards: points, objects, views, backdrop and labels. Use one to start over, or merge it into what is here.</li>
        <li><b>Parts</b> add one thing next to your scene, such as a planet with moons or an asteroid belt. Their ids start with the name you give, so the same part can go in twice.</li>
        <li><b>Try in the preview</b> shows a starter on the card without changing anything; <b>Keep</b> puts it in, <b>Discard</b> goes back. Its settings can still change while you try it.</li>
        <li>A starter is copied into your config: change anything afterwards, nothing refers back to it. <b>Undo</b> (Ctrl+Z, or the preview's toolbar) takes it out again, and Cancel leaves the card as it was.</li>
      </ul>
      ${we([["Every starter",P.starters]])}
    `})}c(Mn,"startersGuide");function Ln(){return fe({id:"astro-objects",header:"How objects work",icon:"mdi:shape-outline",body:p`
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
      ${we([["Which type for what",P.objectTypes],["Distance",P.distance],["Star systems",P.systems]])}
    `})}c(Ln,"objectsGuide");function Rn(){return fe({id:"astro-points",header:"How points work",icon:"mdi:map-marker-multiple",body:p`
      <lcards-astro-diagram kind="placement"></lcards-astro-diagram>
      <ul>
        <li>A point is placed once, in one form: coordinates (<code>xyz</code>), a distance and bearing on the plane (<code>polar</code>), latitude and longitude on a sphere, altitude and azimuth on a dome, a sector map cell, another point (<code>at</code>), the sun or moon, a real planet, or an entity's attributes.</li>
        <li><b>On the scene:</b> tap a point to open it, drag it to move it, or use <b>Place a point</b> in the toolbar to add one where you tap.</li>
        <li>A <b>label</b> and a <b>marker</b> make it show; a <b>style</b> picks the label size (title, major, minor, tiny or your own).</li>
        <li>An <b>entity</b> colours the label by state and can move the point.</li>
      </ul>
      ${we([["Placement forms",P.placement],["Labels and styles",P.labels],["Points",P.points]])}
    `})}c(Rn,"pointsGuide");function Dn(){return fe({id:"astro-camera",header:"How the camera works",icon:"mdi:video-3d",body:p`
      <lcards-astro-diagram kind="camera"></lcards-astro-diagram>
      <ul>
        <li>A <b>view</b> is where the camera looks (a target point or coordinates) and from where (yaw, tilt, distance). Move the preview, then <b>Capture view</b>.</li>
        <li>The <b>start view</b> (the star) is where the card opens. Without views it frames the whole scene.</li>
        <li>A tap action with <code>action: fly-to</code> and a <code>view</code> flies there; a tour steps through views by an entity's state.</li>
        <li>Below the views: how people can move the camera (drag, zoom, buttons), its limits, auto-rotate and the fly-to speed.</li>
      </ul>
      ${we([["Camera and views",P.camera]])}
    `})}c(Dn,"cameraGuide");const Qi=[["s","second"],["min","minute"],["h","hour"],["d","day"],["w","week"],["mo","month"],["y","year"]],Qe="custom";function Bn(i,e){var s;const t=((s=Qi.find(([n])=>n===e))==null?void 0:s[1])??e,a=Math.abs(i);return`${a} ${t}${a===1?"":"s"} a second${i<0?", backward":""}`}c(Bn,"rateWords");const Un=c(i=>{const e=/^(-?\d+(?:\.\d+)?)\s*([a-z]+)\/s$/.exec(i);return e?{amount:Number(e[1]),unit:e[2]}:null},"stopParts"),Zi=oa.map(i=>{if(i.rate===la)return{value:"live",label:"Live (real time)",rate:i.rate};if(i.rate===0)return{value:"0",label:"Paused",rate:0};const e=Un(i.label);return{value:i.label,label:e?Bn(e.amount,e.unit):i.label,rate:i.rate}});function Vn(i){const e=Ni(i);if(e===null)return{preset:"live"};const t=Zi.find(a=>Math.abs(a.rate-e)<=Math.abs(e)*1e-9);if(t)return{preset:t.value};if(typeof i=="string"&&new RegExp(ca).test(i.trim().toLowerCase())){const a=/^(-?\d+(?:\.\d+)?)\s*([a-z]+)/.exec(i.trim().toLowerCase());if(a)return{amount:Number(a[1]),unit:a[2]}}return{amount:e,unit:"d"}}c(Vn,"rateField");function Si(i){if(i==null||i===""||i==="live")return{amount:1,unit:"s"};if(typeof i=="string"){const t=/^\s*(-?\d+(?:\.\d+)?)\s*([a-z]+)/.exec(i.toLowerCase());if(t&&t[2]in Ii)return{amount:Number(t[1]),unit:t[2]}}return{amount:Ni(i)??1,unit:"d"}}c(Si,"customParts");function Fn(i){if(i!=="live")return i==="0"?0:i}c(Fn,"presetValue");function Ze(i,e){return`${Number.isFinite(i)?Number(i):1} ${e in Ii?e:"d"}/s`}c(Ze,"customRateValue");const Xi=c(i=>i==null||i===""||i==="now","isNowDate");function Hn(i){if(Xi(i)||typeof i!="string")return;const e=/^(\d{4}-\d\d-\d\d)(?:[T ](\d\d:\d\d(?::\d\d)?))?/.exec(i.trim());if(!e)return;const t=e[2]?e[2].length===5?`${e[2]}:00`:e[2]:"00:00:00";return`${e[1]} ${t}`}c(Hn,"dateSelectorValue");function Kn(i=new Date){const e=c(t=>String(t).padStart(2,"0"),"p");return`${i.getFullYear()}-${e(i.getMonth()+1)}-${e(i.getDate())} 00:00:00`}c(Kn,"todayValue");const te=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$3"),Wn=c(i=>i==null||i===""||te(i)&&Object.keys(i).length===0,"empty");function ea(i,e,t){const[a,...s]=e,n={...te(i)?i:{}},r=s.length?ea(n[a],s,t):t;return Wn(r)?delete n[a]:n[a]=r,n}c(ea,"setPath");function Yn(i,e){let t=i;for(const a of String(e).split(".")){if(!te(t))return null;if(te(t.properties)&&t.properties[a])t=t.properties[a];else if(te(t.additionalProperties))t=t.additionalProperties;else return null}return t??null}c(Yn,"schemaAt");function Ot({hass:i,schema:e,value:t,onChange:a}){const s={hass:i,config:te(t)?t:{},_getSchemaForPath:c(n=>Yn(e,n),"_getSchemaForPath"),_getConfigValue:c(n=>String(n).split(".").reduce((r,l)=>r==null?void 0:r[l],s.config),"_getConfigValue"),_setConfigValue:c((n,r)=>{s.config=ea(s.config,String(n).split("."),r),a(s.config)},"_setConfigValue"),requestUpdate:c(()=>{},"requestUpdate")};return s}c(Ot,"valueEditor");const E=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$2"),Gn=new Set(["boolean","enum","choice","number","text","strings","numbers","font"]),Xe="coords",Ai=["default","active","inactive","unavailable"],qn={default:"Default (no other match)",active:"Active (on)",inactive:"Inactive (off)",unavailable:"Unavailable"},Jn=c(i=>(i==null?void 0:i.type)==="array","hasArrayType"),R=c(i=>i===""||i===null||i===void 0||Number.isNaN(Number(i))?void 0:Number(i),"num"),jt=class jt2 extends me{static get properties(){return{hass:{attribute:false},schema:{attribute:false},value:{attribute:false},keys:{attribute:false},pointIds:{attribute:false},choices:{attribute:false},units:{type:String},systemIds:{attribute:false},_open:{state:true},_customRates:{state:true}}}constructor(){super(),this.hass=null,this.schema={},this.value={},this.keys=null,this.pointIds=[],this.choices={},this.units="",this.systemIds=[],this._open=new Set,this._customRates=new Set}static get styles(){return ae`
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
    `}_emit(e){this.dispatchEvent(new CustomEvent("form-changed",{detail:{value:e}}))}_set(e,t){this._emit(Be(this.value??{},e,t))}_get(e){var t;return(t=this.value)==null?void 0:t[e]}render(){const e=this.schema??{},t=(this.keys??Object.keys(e)).filter(l=>e[l]&&Va(l,e,this.value??{})),a=["object","objectList","boolOrObject","valueOrObject","textDefault"],s=t.filter(l=>![...a,"yaml"].includes(re(e[l],l))),n=t.filter(l=>a.includes(re(e[l],l))),r=t.filter(l=>re(e[l],l)==="yaml");return p`
      <div class="wrap">
        <div class="fields">${s.map(l=>this._field(l,e[l]))}</div>
        ${n.map(l=>this._nested(l,e[l]))}
        ${r.map(l=>this._yaml(l,e[l]))}
      </div>
    `}_field(e,t){var u,y;const a=re(t,e),s=ze(t),n=a==="number"?Ea(t.description,this.units):void 0,r=n?s.label??ve(e):Pa(s.label??ve(e),t.description,this.units),l=De(t.description),o=this._get(e),d=Gn.has(a)?"":"full";if(H(o)&&X(t))return Re(t)?this._tour(e,o,r,l):this._binding(e,t,a,o,r,l);if(V(o)&&Aa(t))return this._templateField(e,o,r);switch(a){case"boolean":return Array.isArray(o)||E(o)?this._yaml(e,t):this._bindable(e,t,d,this._selector(e,{boolean:{}},o??t.default??false,r,l,"",h=>h));case"boolOrList":return this._boolOrList(e,o,r,l);case"enum":{const h=t.enumDescriptions??{},m=t.enum.map(f=>({value:f,label:h[f]?`${f}: ${h[f]}`:f}));return t.default===void 0&&m.unshift({value:"",label:s.empty??"(Not set)"}),this._selector(e,{select:{mode:"dropdown",options:m}},o??t.default??"",r,l,d,f=>!f||f===t.default?void 0:f)}case"number":{const h=Ta(t),m=n?{number:{...h.number,unit_of_measurement:n}}:h,f=m.number.mode==="slider",b=t.default!==void 0&&!/Default/.test(l)?`${l} Default ${t.default}.`.trim():l,g=o===void 0&&f?t.default:o;return this._bindable(e,t,f?"full":d,this._selector(e,m,g,r,b,"",R))}case"text":{if((u=this.choices)!=null&&u[e]||Array.isArray(t.pointWords)){const h=((y=this.choices)==null?void 0:y[e])??[...t.pointWords,...this.pointIds],m=[{value:"",label:"(Not set)"},...h.map(b=>({value:b,label:b}))],f=this._selector(e,{select:{mode:"dropdown",options:m,custom_value:true}},o??"",r,l,"",b=>b||void 0);return Re(t)?p`
              <div class="bindable ${d}">
                ${f}
                <ha-icon-button data-key=${`${e}-tour`} .label=${"Make it a guided tour"} title="Make it a guided tour"
                  @click=${()=>this._set(e,{entity:"",views:o?[o]:[]})}>
                  <ha-icon icon="mdi:map-marker-path"></ha-icon>
                </ha-icon-button>
              </div>`:p`<div class=${d}>${f}</div>`}return E(o)?this._yaml(e,t):this._bindable(e,t,d,this._selector(e,{text:{}},o===void 0?"":String(o),r,l,"",h=>h||void 0))}case"range":return this._range(e,t,o,r,l);case"shape":return this._shape(e,t,o,r,l);case"rate":return this._bindable(e,t,"full",this._rate(e,o,r,l,h=>this._set(e,h)));case"date":return V(o)?this._templateField(e,o,r):this._bindable(e,t,"full",this._date(e,o,r,l,h=>this._set(e,h)));case"font":return p`
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
          ${l?p`<div class="hint full">${l}</div>`:w}`}case"strings":return this._selector(e,{text:{}},Array.isArray(o)?o.join(", "):"",r,`${l} Separate with commas.`,d,h=>String(h??"").split(",").map(m=>m.trim()).filter(Boolean));case"numbers":return this._selector(e,{text:{}},Array.isArray(o)?o.join(", "):"",r,`${l} Numbers separated by commas.`,d,Ha);case"color":return V(o)?this._templateField(e,o,r,void 0,"Back to a colour"):this._bindable(e,t,"full",this._color(e,o,r,l));case"colorList":{if((Array.isArray(o)?o:[o]).some(f=>E(f)||V(f)))return this._yaml(e,t);const h=!Jn(t),m=Array.isArray(o)?o:typeof o=="string"&&o?[o]:[];return p`
          <lcards-color-list class="full" data-key=${e} .hass=${this.hass} .colors=${m} .label=${r} .description=${l}
            @colors-changed=${f=>{f.stopPropagation();const b=(f.detail.colors??[]).filter(Boolean);this._set(e,h&&b.length===1?b[0]:b)}}>
          </lcards-color-list>`}case"tuple":return this._tuple(e,t,o,r,l,"tuple");case"numberOrTuple":return this._bindable(e,t,"full",this._tuple(e,t,o,r,l,"numberOrTuple"));case"pointRef":return this._pointRef(r,l,o,h=>this._set(e,h));case"pointList":return this._pointList(e,r,l,o);case"choice":{if(E(o))return this._yaml(e,t);const h=Ui(t),m=Object.assign({},...(t.oneOf??t.anyOf).map(b=>b.enumDescriptions??{}));if(s.widget==="pills")return this._pills(e,t,h.words,m,o,r,l);const f=[{value:"",label:"(Not set)"},...h.bool?[{value:"true",label:"true"},{value:"false",label:"false"}]:[],...h.words.map(b=>({value:b,label:m[b]?`${b}: ${m[b]}`:b}))];return this._bindable(e,t,d,this._selector(e,{select:{mode:"dropdown",options:f,custom_value:h.number}},o===void 0?"":String(o),r,h.number?`${l?`${l} `:""}(or type a number)`:l,"",b=>ja(b,h)))}case"boolOrNumber":return p`
          <div class="full row">
            ${this._selector(`${e}-on`,{boolean:{}},o!==void 0&&o!==false,r,l,"",h=>this._set(e,h?true:void 0))}
            ${o!==void 0&&o!==false?this._selector(`${e}-n`,{number:{mode:"box",step:"any"}},typeof o=="number"?o:void 0,"Factor","(Blank: the default)","",h=>this._set(e,R(h)??true)):w}
          </div>`;default:return w}}_color(e,t,a,s,n=r=>this._set(e,r)){return p`
      <div data-key=${e}>
        <span class="field-label">${a}</span>
        <lcards-color-picker .hass=${this.hass} .value=${t??""}
          @value-changed=${r=>{r.stopPropagation(),n(r.detail.value||void 0)}}>
        </lcards-color-picker>
        ${s?p`<div class="hint">${s}</div>`:w}
      </div>`}_bindable(e,t,a,s){return!X(t)||Re(t)?p`<div class=${a}>${s}</div>`:p`
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
      </lcards-form-section>`}_binding(e,t,a,s,n,r,l=o=>this._set(e,o)){var b;const o=((b=X(t))==null?void 0:b.properties)??{},d=a!=="text"&&a!=="boolean",u=c(g=>{const _={...s,...g};for(const $ of Object.keys(_))_[$]===void 0&&delete _[$];l(_)},"set"),y=c((g,_,$)=>p`
      <div class="row">
        ${[0,1].map(S=>this._selector(`${e}~${g}${S}`,{number:{mode:"box",step:"any"}},Array.isArray(s[g])?s[g][S]:void 0,_[S],$[S],"",k=>{const T=Array.isArray(s[g])?[...s[g]]:[void 0,void 0];T[S]=R(k),u({[g]:T.every(v=>v===void 0)?void 0:T.map(v=>v??0)})}))}
      </div>`,"pair"),h=a==="color",m=h?"Back to a colour":a==="choice"||a==="boolean"?"Back to a fixed value":"Back to a number",f=h?Object.keys(s).filter(g=>!["entity","attribute",...Ai].includes(g)):[];return this._subPanel(e,"mdi:link-variant",`${n}: follows an entity`,m,p`
      ${this._selector(`${e}~entity`,{entity:{}},s.entity||void 0,"Entity",h?"":r,"",g=>u({entity:g||"",attribute:void 0}))}
      ${o.attribute?this._attribute(e,s,u):w}
      ${h?p`
        ${Ai.map(g=>this._color(`${e}~${g}`,s[g],qn[g],"",_=>u({[g]:_})))}
        <div class="hint full">${f.length?`Also by state in YAML: ${f.join(", ")}.`:`Other states ("heat", "above:80", "between:20:80") go in YAML, each with its colour. No key matching: the entity's own colour (attribute: rgb_color on a light).`}</div>`:w}
      ${d&&o.input?y("input",["Entity low","Entity high"],["Default: its min (else 0)","Default: its max (else 100)"]):w}
      ${d&&o.output?y("output",[`${n} at entity low`,`${n} at entity high`],["Both empty: the entity's own number","Held at the ends outside the entity range"]):w}
      ${d&&o.clamp?this._selector(`${e}~clamp`,{boolean:{}},s.clamp!==false,"Clamp","Off: values past the entity range carry on past the ends.","",g=>u({clamp:g?void 0:false})):w}
      ${d&&o.smooth?this._selector(`${e}~smooth`,{number:{mode:"box",min:0,step:50}},s.smooth,"Smooth (ms)","opacity, radius, size and spin ease over this; default 600, 0 steps.","",g=>u({smooth:R(g)})):w}`,l)}_templateField(e,t,a,s=r=>this._set(e,r),n="Back to a number"){return this._subPanel(e,"mdi:code-braces",`${a}: a template`,n,this._selector(`${e}~template`,{text:{multiline:true}},t,"","JavaScript [[[ ]]], Jinja2 {{ }} or a {entity.state} token.","",r=>s(r||void 0)),s)}_tour(e,t,a,s){var h;const n=Array.isArray(t.views)?t.views:[],r=((h=this.choices)==null?void 0:h[e])??[],l=c(m=>{const f={...t,...m};for(const b of Object.keys(f))f[b]===void 0&&delete f[b];this._set(e,f)},"set"),o=c(m=>l({views:m.length?m:void 0}),"setStops"),d=c((m,f)=>o(n.map((b,g)=>g===m?f:b)),"setStop"),u=c(m=>typeof m=="string"?m:String((m==null?void 0:m.view)??""),"viewOf"),y=r.map(m=>({value:m,label:m}));return p`
      <lcards-form-section class="full binding" data-key=${e} header=${`${a}: a guided tour`} icon="mdi:map-marker-path" nested outlined ?expanded=${true}>
        <ha-icon-button slot="header-icons" data-key=${`${e}-unbind`} .label=${"Back to one view"} title="Back to one view"
          @click=${m=>{m.stopPropagation(),this._set(e,u(n[0])||void 0)}}>
          <ha-icon icon="mdi:link-variant-off"></ha-icon>
        </ha-icon-button>
        <div class="sub-body">
        ${this._selector(`${e}~entity`,{entity:{}},t.entity||void 0,"Entity","An input_number picks the nth stop (from 0); an input_select names the view. "+s,"",m=>l({entity:m||"",attribute:void 0}))}
        ${this._attribute(e,t,l)}
        <span class="field-label">Stops</span>
        ${n.length?w:p`<div class="hint">No stops: the entity's state names the view (an input_select of view names).</div>`}
        ${n.map((m,f)=>{const b=E(m);return p`
            <div class="stop" data-key=${`${e}~stop${f}`}>
              <div>
                ${this._selector(`${e}~view${f}`,{select:{mode:"dropdown",options:y,custom_value:true}},u(m),`${f}`,"","",g=>d(f,b?{...m,view:g||""}:g||""))}
                ${b?p`
                  ${this._date(`${e}~date${f}`,m.date,"Date there","",g=>d(f,Be(m,"date",g)))}
                  ${this._rate(`${e}~rate${f}`,m.rate,"Rate there","",g=>d(f,Be(m,"rate",g)))}`:w}
              </div>
              <ha-icon-button .label=${b?"Leave the clock as it is":"Set the clock here"} title=${b?"Leave the clock as it is":"Set the clock here"}
                @click=${()=>d(f,b?u(m):{view:u(m)})}>
                <ha-icon icon=${b?"mdi:clock-remove-outline":"mdi:clock-outline"}></ha-icon>
              </ha-icon-button>
              <ha-icon-button .label=${"Move up"} ?disabled=${f===0}
                @click=${()=>{const g=[...n];[g[f-1],g[f]]=[g[f],g[f-1]],o(g)}}>
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </ha-icon-button>
              <ha-icon-button .label=${"Remove"} @click=${()=>o(n.filter((g,_)=>_!==f))}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
            </div>`})}
        <div class="list-actions">
          <ha-button appearance="plain" size="s" data-key=${`${e}~add`} @click=${()=>o([...n,r[n.length]??r[0]??""])}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add stop
          </ha-button>
        </div>
        </div>
      </lcards-form-section>`}_attribute(e,t,a){return t.entity?this._selector(`${e}~attribute`,{attribute:{entity_id:t.entity}},t.attribute??"","Attribute (optional)","Leave empty to read the state.","",s=>a({attribute:s||void 0})):w}_range(e,t,a,s,n){const r=xa(t),l=Kt(t.description,2),o=Array.isArray(t.default)?t.default:[r.minimum,r.maximum],d=Array.isArray(a)?a:o,u=c((y,h)=>{const m=[0,1].map(f=>f===y?R(h)??o[f]:typeof d[f]=="number"?d[f]:o[f]);this._set(e,m[0]===o[0]&&m[1]===o[1]?void 0:m)},"change");return p`
      <div class="full" data-key=${e}>
        <span class="field-label">${s}</span>
        <div class="row">
          ${l.map((y,h)=>p`
            <ha-selector data-key=${`${e}~${h}`} .hass=${this.hass} .selector=${{number:{mode:"slider",min:r.minimum,max:r.maximum,step:"any"}}}
              .value=${typeof d[h]=="number"?d[h]:o[h]} .label=${y.charAt(0).toUpperCase()+y.slice(1)} .required=${false}
              @value-changed=${m=>{m.stopPropagation(),u(h,m.detail.value)}}>
            </ha-selector>`)}
        </div>
        ${n?p`<div class="hint">${n}</div>`:w}
      </div>`}_shape(e,t,a,s,n){var d;const r=String(((d=this.value)==null?void 0:d.type)??""),l=t.enumDescriptions??{},o=a??t.default;return p`
      <div class="full" data-key=${e}>
        <span class="field-label" id="shape-${e}">${s}</span>
        <div class="shape-picker" role="radiogroup" aria-labelledby="shape-${e}">
          ${t.enum.map(u=>p`
            <button type="button" class="shape-tile" role="radio" data-shape=${u} aria-checked=${u===o?"true":"false"}
              title=${l[u]??u} @click=${()=>this._set(e,u===t.default?void 0:u)}>
              <span class="shape-picture"><img src=${Sn(r,u)} alt="" loading="lazy"
                @error=${y=>{y.target.hidden=true}}></span>
              <span>${u}</span>
            </button>`)}
        </div>
        ${n?p`<div class="hint">${n}</div>`:w}
      </div>`}_rate(e,t,a,s,n){const r=Vn(t),l=!("preset"in r)||this._customRates.has(e),o=l?Si(t):{amount:0,unit:"d"},d=[...Zi.map(u=>({value:u.value,label:u.label})),{value:Qe,label:"Custom"}];return p`
      <div class="stack" data-key=${e}>
        <ha-selector data-key=${`${e}~preset`} .hass=${this.hass} .selector=${{select:{mode:"dropdown",options:d}}}
          .value=${l||!("preset"in r)?Qe:r.preset} .label=${a} .required=${false}
          @value-changed=${u=>{u.stopPropagation();const y=u.detail.value,h=new Set(this._customRates);if(y===Qe){h.add(e),this._customRates=h;const m=Si(t);n(Ze(m.amount,m.unit))}else h.delete(e),this._customRates=h,n(Fn(y??"live"))}}>
        </ha-selector>
        ${l?p`
          <div class="row">
            ${this._selector(`${e}~amount`,{number:{mode:"box",step:"any"}},o.amount,"Amount","Negative runs backward.","",u=>n(Ze(R(u),o.unit)))}
            ${this._selector(`${e}~unit`,{select:{mode:"dropdown",options:Qi.map(([u,y])=>({value:u,label:`${y}s a second`}))}},o.unit,"Unit","","",u=>n(Ze(o.amount,u||"d")))}
          </div>`:w}
        <div class="hint">The scene's date moves on by this much each real second. Live keeps it on the real date and time; Paused holds it.</div>
      </div>`}_date(e,t,a,s,n){const r=Xi(t);return p`
      <div class="stack" data-key=${e}>
        <span class="field-label">${a}</span>
        <div class="pills">
          <wa-button-group childSelector="ha-button">
            <ha-button size="s" variant="brand" data-value="now" .appearance=${r?"accent":"filled"} @click=${()=>n(void 0)}>Now</ha-button>
            <ha-button size="s" variant="brand" data-value="date" .appearance=${r?"filled":"accent"}
              @click=${()=>{r&&n(Kn())}}>Date and time</ha-button>
          </wa-button-group>
        </div>
        ${r?w:this._selector(`${e}~datetime`,{datetime:{}},Hn(t),"","","",l=>n(l||void 0))}
        ${s?p`<div class="hint">${s}</div>`:w}
      </div>`}_boolOrList(e,t,a,s){const n=t===true||Array.isArray(t),r=Array.isArray(t)?t.map(String):[],l=[...new Set([...this.systemIds,...r])];return p`
      <div class="full">
        ${this._selector(`${e}-on`,{boolean:{}},n,a,s,"",o=>this._set(e,o?r.length?r:true:void 0))}
        ${n&&l.length?this._selector(`${e}~list`,{select:{multiple:true,options:l.map(o=>({value:o,label:o}))}},r,"Only in these systems","None picked: every system.","",o=>this._set(e,Array.isArray(o)&&o.length?o:true)):w}
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
          ${X(t)?p`
            <ha-icon-button class="bind" data-key=${`${e}-bind`} .label=${"Follow an entity"} title="Follow an entity"
              @click=${()=>this._set(e,{entity:""})}>
              <ha-icon icon="mdi:link-variant"></ha-icon>
            </ha-icon-button>`:w}
        </div>
        ${l?p`<div class="hint">${l}</div>`:w}
      </div>`}_selector(e,t,a,s,n,r,l){return p`
      <ha-selector class=${r} data-key=${e} .hass=${this.hass} .selector=${t} .value=${a} .label=${s}
        .helper=${n} .required=${false}
        @value-changed=${o=>{o.stopPropagation();const d=l(o.detail.value);!e.includes("~")&&!e.endsWith("-on")&&!e.endsWith("-n")&&this._set(e,d)}}>
      </ha-selector>`}_tuple(e,t,a,s,n,r){var f,b;const l=Da(t),o=Kt(t.description??((b=(f=t.oneOf)==null?void 0:f.find(g=>g.description))==null?void 0:b.description),l),d=Array.isArray(a)?a:typeof a=="number"?[a]:[],u=Sa(t),y=c(g=>H(g)||V(g)?g:R(g),"keep"),h=c((g,_)=>{const $=Array.from({length:l},(k,T)=>y(T===g?_:d[T]));if($.every(k=>k===void 0))return this._set(e,void 0);if(r==="numberOrTuple"&&$.slice(1).every(k=>k===void 0)&&typeof $[0]=="number")return this._set(e,$[0]);const S=$.find(k=>typeof k=="number")??0;this._set(e,$.map(k=>k===void 0?r==="numberOrTuple"?S:0:k))},"change"),m=o.map((g,_)=>H(d[_])||V(d[_]));return p`
      <div class="full" data-key=${e}>
        <span class="field-label">${s}</span>
        <div class="row">
          ${o.map((g,_)=>m[_]?p`
            <div class="side-bound" data-side=${_}>${g}: ${H(d[_])?"follows an entity":"a template"}</div>`:p`
            <div class=${u?"bindable":""}>
              <ha-selector .hass=${this.hass} .selector=${{number:{mode:"box",step:"any"}}} .value=${d[_]} .label=${g} .required=${false}
                @value-changed=${$=>{$.stopPropagation(),h(_,$.detail.value)}}>
              </ha-selector>
              ${u?p`
                <ha-icon-button class="bind" data-key=${`${e}-${_}-bind`} .label=${`${g}: follow an entity`} title=${`${g}: follow an entity`}
                  @click=${()=>h(_,{entity:""})}>
                  <ha-icon icon="mdi:link-variant"></ha-icon>
                </ha-icon-button>`:w}
            </div>`)}
        </div>
        ${n?p`<div class="hint">${n}${r==="numberOrTuple"?" Fill only the first box for one number.":""}${u?" Each side can follow an entity of its own (its link button).":""}</div>`:w}
        ${u?o.map((g,_)=>{if(!m[_])return w;const $=c(S=>{var k,T;return h(_,S===void 0?Number((T=(k=d[_])==null?void 0:k.output)==null?void 0:T[0])||0:S)},"put");return H(d[_])?this._binding(`${e}~${_}`,u,"number",d[_],`${s} ${g}`,"",$):this._templateField(`${e}~${_}`,d[_],`${s} ${g}`,$)}):w}
      </div>`}_pointRef(e,t,a,s){const n=Array.isArray(a),r=[{value:"",label:"(None)"},...this.pointIds.map(l=>({value:l,label:l})),{value:Xe,label:"Coordinates [x, y, z]"}];return p`
      <div class="full">
        <ha-selector .hass=${this.hass} .selector=${{select:{mode:"dropdown",options:r,custom_value:true}}}
          .value=${n?Xe:a??""} .label=${e} .helper=${t} .required=${false}
          @value-changed=${l=>{l.stopPropagation();const o=l.detail.value;s(o===Xe?n?a:[0,0,0]:o||void 0)}}>
        </ha-selector>
        ${n?p`
          <div class="row">
            ${["x","y","z"].map((l,o)=>p`
              <ha-selector .hass=${this.hass} .selector=${{number:{mode:"box",step:"any"}}} .value=${a[o]} .label=${l} .required=${false}
                @value-changed=${d=>{d.stopPropagation();const u=[...a];u[o]=R(d.detail.value)??0,s(u)}}>
              </ha-selector>`)}
          </div>`:w}
      </div>`}_pointList(e,t,a,s){const n=Array.isArray(s)?s:[],r=c(l=>this._set(e,l),"set");return p`
      <div class="full" data-key=${e}>
        <span class="field-label">${t}</span>
        ${n.map((l,o)=>p`
          <div class="list-item">
            ${this._pointRef(`${o+1}`,"",l,d=>r(n.map((u,y)=>y===o?d:u).filter(u=>!Se(u))))}
            <ha-icon-button .label=${"Remove"} @click=${()=>r(n.filter((d,u)=>u!==o))}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
          </div>`)}
        <div class="list-actions">
          <ha-button appearance="plain" size="s" @click=${()=>r([...n,this.pointIds[0]??[0,0,0]])}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon> Add point
          </ha-button>
        </div>
        ${a?p`<div class="hint">${a}</div>`:w}
      </div>`}_nested(e,t){var y,h;const a=re(t,e),s=this._get(e),n=ve(e),r=De(t.description);if(a==="object")return p`
        <lcards-form-section data-key=${e} header=${n} description=${r} secondary=${ee(s).length?"follows an entity":""}
          icon=${q(e,a)} nested outlined ?expanded=${ee(s).length>0}>
          ${this._sub(t.properties,E(s)?s:{},m=>this._set(e,m))}
        </lcards-form-section>`;if(a==="textDefault"){const m=Ot({hass:this.hass,schema:t,value:E(s)?s:{},onChange:c(f=>this._set(e,f),"onChange")});return p`
        <lcards-form-section data-key=${e} header=${n} description=${r} icon=${q(e,a)} nested outlined
          ?expanded=${E(s)&&Object.keys(s).length>0}>
          <lcards-text-field-editor .editor=${m} .config=${m.config} basePath="default"></lcards-text-field-editor>
        </lcards-form-section>`}if(a==="boolOrObject"){const m=nt(t),f=s===true||E(s);return p`
        <lcards-form-section data-key=${e} header=${n} description=${r} secondary=${f?"":"off"} icon=${q(e,a)} nested outlined ?expanded=${f}>
          <ha-switch slot="header-icons" data-key=${`${e}-on`} .checked=${f} title=${f?`Turn ${n.toLowerCase()} off`:`Turn ${n.toLowerCase()} on`}
            @click=${b=>b.stopPropagation()}
            @change=${b=>this._set(e,b.target.checked?true:void 0)}>
          </ha-switch>
          ${f?this._sub(m.properties,E(s)?s:{},b=>this._set(e,Se(b)?true:b)):p`<div class="hint">Off. Turn it on with the switch to set it up.</div>`}
        </lcards-form-section>`}if(a==="valueOrObject"){const m=nt(t),f=Ra(t),b=E(s)?s:s===void 0?{}:{[f]:s},g=c(_=>this._set(e,Se(_)?void 0:E(_)&&Object.keys(_).length===1&&_[f]!==void 0?_[f]:_),"set");return p`
        <lcards-form-section data-key=${e} header=${n} description=${r} icon=${q(e,a)} nested outlined ?expanded=${s!==void 0}>
          ${this._sub(m.properties,b,g)}
        </lcards-form-section>`}const l=Array.isArray(s)?s:[],o=t.items,d=Array.isArray(o.required)&&o.required.includes("type")&&Array.isArray((h=(y=o.properties)==null?void 0:y.type)==null?void 0:h.enum)?"type":null,u=c(m=>this._set(e,m),"set");return p`
      <lcards-form-section data-key=${e} header=${n} description=${r} secondary=${l.length?`${l.length}`:""} icon=${q(e,a)} nested outlined ?expanded=${l.length>0}>
        ${l.map((m,f)=>p`
          <lcards-form-section header=${`${f+1}${d&&(m!=null&&m[d])?` · ${m[d]}`:""}`}
            secondary=${ee(m).length?"follows an entity":""} icon=${q(e,"item")} nested outlined ?expanded=${ee(m).length>0}>
            <ha-icon-button slot="header-icons" .label=${"Move up"} ?disabled=${f===0}
              @click=${b=>{b.stopPropagation();const g=[...l];[g[f-1],g[f]]=[g[f],g[f-1]],u(g)}}>
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button slot="header-icons" .label=${"Remove"}
              @click=${b=>{b.stopPropagation(),u(l.filter((g,_)=>_!==f))}}>
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
            ${this._sub(o.properties,E(m)?m:{},b=>u(l.map((g,_)=>_===f?b:g)))}
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
      <lcards-form-section data-key=${e} header=${ve(e)} description=${De(t.description)}
        secondary=${a===void 0?"":"set"} icon="mdi:code-braces" nested outlined ?expanded=${s}
        @expanded-changed=${n=>{const r=new Set(this._open);n.detail.expanded?r.add(e):r.delete(e),this._open=r}}>
        ${s?p`
          <lcards-yaml-editor .hass=${this.hass} .schema=${t} .value=${a===void 0?"":Di(a)}
            @value-changed=${n=>{n.stopPropagation();const r=String(n.detail.value??"").trim();if(!r)return this._set(e,void 0);try{this._set(e,ya(r))}catch{}}}>
          </lcards-yaml-editor>`:w}
      </lcards-form-section>`}};c(jt,"LCARdSAstroSchemaForm");let yt=jt;customElements.get("lcards-astro-schema-form")||customElements.define("lcards-astro-schema-form",yt);const F={xyz:{label:"x, y, z",inputs:["x","y","z"],pick:true,value:[0,0,0]},polar:{label:"Distance and bearing",inputs:["Distance","Bearing (°)"],pick:true,value:[0,0]},latlon:{label:"Latitude and longitude (a sphere)",inputs:["Latitude (°)","Longitude (°)"],host:"sphere",pick:true,value:[0,0]},altaz:{label:"Azimuth and altitude (a dome)",inputs:["Azimuth (°)","Altitude (°)"],host:"dome",pick:true,value:[0,30]},sky:{label:"Sun or moon (a dome)",host:"dome",value:"sun"},body:{label:"A real Solar System body (scene date)",value:"earth"},at:{label:"At another point",value:""},cell:{label:"Sector map cell (a plane grid)",host:"plane",pick:true,value:""},part:{label:"A part of a model",host:"model",value:""}},Qn=[{value:"tap",label:"On tap (opens with a tap on the point)"},{value:"always",label:"Always"}],Oi=c(i=>i==="moon"?"Moon (Luna)":i.charAt(0).toUpperCase()+i.slice(1),"bodyLabel"),Zn=["polar","latlon","altaz","sky"],et=c(i=>Object.fromEntries(Object.entries(i).filter(([,e])=>e!=null&&e!==""&&!(typeof e=="object"&&!Array.isArray(e)&&Object.keys(e).length===0))),"prune"),tt=c(i=>(i==null?void 0:i.part)!==void 0?"part":Li.find(e=>(i==null?void 0:i[e])!==void 0)??null,"formOf"),Xn=c(i=>{if((i==null?void 0:i.type)==="sphere")return"sphere";if((i==null?void 0:i.type)==="model")return"model";if((i==null?void 0:i.type)!=="grid")return null;const e=i.shape??"plane";return["dome","sphere","plane"].includes(e)?e:null},"hostKind"),ji=c((i,e)=>{var a;const t={...i};for(const s of Li)delete t[s];return delete t.part,delete t.center,t[e]=structuredClone(((a=F[e])==null?void 0:a.value)??null),t},"withForm"),er=c(i=>{var t,a,s,n,r,l,o,d;const e=typeof(i==null?void 0:i.src)=="string"?i.src:"";if(!e.startsWith("builtin:"))return null;try{const u=(d=(o=(l=(r=(n=(s=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.assetManager)==null?void 0:s.getRegistry)==null?void 0:n.call(s,"model"))==null?void 0:r.assets)==null?void 0:l.get(e.slice(8)))==null?void 0:o.metadata)==null?void 0:d.parts;return Array.isArray(u)?u:null}catch{return null}},"builtinParts");let tr=0;const Tt=class Tt2 extends me{static get properties(){return{hass:{type:Object},config:{type:Object},preview:{attribute:false},takenIds:{attribute:false},selected:{type:String},_expanded:{type:Number,state:true},_picking:{type:String,state:true},_parts:{type:Object,state:true}}}static get styles(){return ae`
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
    `}constructor(){super(),this.hass=null,this.config={},this._expanded=-1,this.preview=null,this.takenIds=void 0,this.selected=null,this._picking="",this._pickSeq=0,this._parts={},this._partsAsked=new Set,this._partsTimers=[],this._pickerDialog=null}willUpdate(e){if(e.has("selected")&&this.selected){const t=this._points.findIndex(a=>String(a==null?void 0:a.id)===this.selected);t>=0&&t!==this._expanded&&(this._expanded=t,this.updateComplete.then(()=>{var a;return(a=this.renderRoot.querySelector(`[data-index="${t}"]`))==null?void 0:a.scrollIntoView({block:"nearest",behavior:"smooth"})}))}}_toggle(e){var a;this._expanded=this._expanded===e?-1:e;const t=this._expanded>=0?String(((a=this._points[this._expanded])==null?void 0:a.id)??""):null;at(this,"point-selected",{id:t})}disconnectedCallback(){var e;this._partsTimers.forEach(clearTimeout),this._partsTimers=[],(e=this._pickerDialog)==null||e.remove(),this._cancelPick(),super.disconnectedCallback()}get _points(){var e;return Array.isArray((e=this.config)==null?void 0:e.points)?this.config.points:[]}_commit(e){at(this,"points-changed",{value:e})}_patch(e,t){this._commit(this._points.map((a,s)=>s===e?et({...a,...t}):a))}_replace(e,t){this._commit(this._points.map((a,s)=>s===e?et(t):a))}_freshId(e="point"){const t=new Set([...this._points.map(s=>String(s==null?void 0:s.id)),...this.takenIds??[]]);let a=1;for(;t.has(`${e}${a}`);)a++;return`${e}${a}`}_add(){const e=[...this._points,{id:this._freshId(),xyz:[0,0,0],marker:"dot",label:"NEW POINT"}];this._expanded=e.length-1,this._commit(e)}_duplicate(e){const t=this._points[e],a={...structuredClone(t),id:this._freshId(`${(t==null?void 0:t.id)??"point"}_`)},s=[...this._points.slice(0,e+1),a,...this._points.slice(e+1)];this._expanded=e+1,this._commit(s)}_remove(e){this._commit(this._points.filter((t,a)=>a!==e))}_move(e,t){const a=[...this._points],s=e+t;s<0||s>=a.length||([a[e],a[s]]=[a[s],a[e]],this._expanded=s,this._commit(a))}async _pick(e){var o,d,u;const t=tt(e),a=t?e[t]:void 0;if(!this.preview||!t||!((o=F[t])!=null&&o.pick)||a&&typeof a=="object"&&!Array.isArray(a))return;this._cancelPick();const s=String(e.id),n=++tr;this._pickSeq=n,this._picking=s;const r=await this.preview.pickPosition({pointId:s,form:t,object:e.object,label:e.label??((u=(d=e.text)==null?void 0:d.label)==null?void 0:u.content)??s});if(this._pickSeq!==n||(this._picking="",r==null))return;const l=this._points.findIndex(y=>String(y==null?void 0:y.id)===s);l<0||this._replace(l,{...ji(this._points[l],t),[t]:r})}_cancelPick(){var e;this._picking&&(this._pickSeq=0,this._picking="",(e=this.preview)==null||e.cancelPick())}_partsFor(e){var s;const t=(Array.isArray((s=this.config)==null?void 0:s.objects)?this.config.objects:[]).find(n=>(n==null?void 0:n.id)===e);if((t==null?void 0:t.type)!=="model")return null;const a=er(t)??this._parts[e];return a||(this._partsAsked.has(e)||(this._partsAsked.add(e),this._askParts(e,0)),null)}_askParts(e,t){var s,n;const a=(n=(s=this.preview)==null?void 0:s.partNames)==null?void 0:n.call(s,e);if(Array.isArray(a)){this._parts={...this._parts,[e]:a};return}t>=8||this._partsTimers.push(setTimeout(()=>{this.isConnected&&!this._parts[e]&&this._askParts(e,t+1)},1500))}_modelIds(){var e;return(Array.isArray((e=this.config)==null?void 0:e.objects)?this.config.objects:[]).filter(t=>(t==null?void 0:t.type)==="model"&&typeof t.id=="string").map(t=>t.id)}_setForm(e,t,a){var n;const s=ji(t,a);if(a==="part"){const r=this._modelIds(),l=r.includes(t.object)?t.object:r[0];s.object=l,s.part=l&&((n=this._partsFor(l))==null?void 0:n[0])||"part"}this._replace(e,s)}_select(e,t,a,s,n={}){return p`
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
    `}_objectOptions(e){var a;return(Array.isArray((a=this.config)==null?void 0:a.objects)?this.config.objects:[]).filter(s=>s&&typeof s.id=="string"&&(!e||Xn(s)===e)).map(s=>({value:s.id,label:`${s.id} (${s.type}${s.shape?` ${s.shape}`:""})`}))}_renderPlacement(e,t){const a=tt(e),s=a?F[a]:null,n=a?e[a]:void 0,r=n&&typeof n=="object"&&!Array.isArray(n),l=this._objectOptions((s==null?void 0:s.host)??null),o=this._picking===String(e.id);return p`
      <div class="grid">
        <div class="full">
          ${this._select("Placed by",a??"",Object.entries(F).filter(([d])=>d!=="part"||a==="part"||this._modelIds().length).map(([d,u])=>({value:d,label:u.label})),d=>d&&d!==a&&this._setForm(t,e,d))}
        </div>
        ${r?p`<div class="full hint">Position from ${n.entity??"the point's entity"} (edit the binding in YAML).</div>`:w}
        ${!r&&(s!=null&&s.inputs)?p`
          <div class="full ${s.inputs.length===3?"grid3":"grid"}">
            ${s.inputs.map((d,u)=>this._number(d,Array.isArray(n)?n[u]:void 0,y=>{const h=Array.isArray(n)?[...n]:[...F[a].value];h[u]=y??0,this._patch(t,{[a]:h})}))}
          </div>`:w}
        ${a==="sky"?this._select("Body",n,da.map(d=>({value:d,label:d})),d=>this._patch(t,{sky:d})):w}
        ${a==="body"?p`
          ${this._select("Body",n,Rt.map(d=>({value:d,label:Oi(d)})),d=>this._patch(t,{body:d}))}
          ${this._select("Measured from",e.center??"",[{value:"",label:"(The Sun)"},...Rt.filter(d=>d!=="sun").map(d=>({value:d,label:Oi(d)}))],d=>this._patch(t,{center:d||void 0}))}
          <div class="full hint">Where it is at the scene date (the card's clock), in the scene's or system's units (set units: km or au).</div>`:w}
        ${a==="at"?this._select("Point",n,this._points.filter(d=>d!==e&&(d==null?void 0:d.id)!==void 0).map(d=>({value:String(d.id),label:String(d.id)})),d=>this._patch(t,{at:d})):w}
        ${a==="cell"?this._text("Cell",n,d=>this._patch(t,{cell:d}),"Such as AF3"):w}
        ${a==="part"?this._renderPart(e,t):w}
        ${a!=="at"&&a!=="body"?this._select(s!=null&&s.host?"On object":"On object (optional)",e.object??"",[{value:"",label:"(None)"},...l],d=>this._patch(t,{object:d||void 0}),{custom_value:true}):w}
        ${a&&Zn.includes(a)?this._number("Height above (alt)",e.alt,d=>this._patch(t,{alt:d})):w}
        ${s!=null&&s.pick&&!r?p`
          <div class="pick-row">
            <ha-button appearance=${o?"filled":"outlined"} @click=${()=>o?this._cancelPick():this._pick(e)}>
              <ha-icon icon=${o?"mdi:close":"mdi:crosshairs-gps"} slot="start"></ha-icon>
              ${o?"Cancel pick":"Pick on preview"}
            </ha-button>
            <span class="hint">${o?"Tap the preview where the point goes.":"Then tap the preview where the point goes."}</span>
          </div>`:w}
      </div>
    `}_renderPart(e,t){const a=e.object?this._partsFor(e.object):null,s=Array.isArray(e.xyz)?e.xyz:void 0;return p`
      <div class="full">
        ${a?this._select("Part",e.part,a.map(n=>({value:n,label:n})),n=>n&&this._patch(t,{part:n}),{custom_value:true}):this._text("Part",e.part,n=>n&&this._patch(t,{part:n}),"The name of a node in the model file (the list fills in when the preview has loaded it)")}
      </div>
      <div class="full grid3">
        ${["Offset x","Offset y","Offset z"].map((n,r)=>this._number(n,s==null?void 0:s[r],l=>{const o=s?[...s]:[0,0,0];o[r]=l??0,this._patch(t,{xyz:o.every(d=>d===0)?void 0:o})}))}
      </div>
      <div class="full hint">The offset is in the part's own coordinates (the model file's units).</div>
    `}_childLovelace(){return{views:[{title:"Home",path:"home",cards:[]}]}}async _openCardPicker(e){var s,n;if(!customElements.get("hui-card-picker")){ha({title:"Card picker not ready",message:'Home Assistant has not loaded its card picker yet. On any dashboard, select "Add card" once (you can cancel it), then come back and try again.'});return}(s=this._pickerDialog)==null||s.remove();const t=document.createElement("ha-dialog");t.headerTitle="Select a card",this._pickerDialog=t,Mi(t,this),t.open=true,await t.updateComplete;const a=document.createElement("hui-card-picker");a.hass=this.hass,a.lovelace=this._childLovelace(),a.style.cssText="padding: var(--ha-space-6); display: block;",t.appendChild(a),await new Promise(r=>setTimeout(r,80)),(n=a.requestUpdate)==null||n.call(a),a.addEventListener("config-changed",r=>{var o;r.stopPropagation();const l=(o=r.detail)==null?void 0:o.config;t.open=false,l&&e(JSON.parse(JSON.stringify(l)))}),t.addEventListener("closed",r=>{r.stopPropagation(),r.target===r.currentTarget&&(t.remove(),this._pickerDialog===t&&(this._pickerDialog=null))})}_chooseCard(e){this._openCardPicker(t=>{const a=this._points[e];a&&this._patch(e,{card:{...a.card??{},card:t}})})}_onCardConfigChanged(e,t){var n,r;t.stopPropagation();const a=((n=t.detail)==null?void 0:n.config)??((r=t.detail)==null?void 0:r.value),s=this._points[e];!(a!=null&&a.type)||!(s!=null&&s.card)||this._patch(e,{card:{...s.card,card:a}})}_renderCard(e,t){const a=e.card&&typeof e.card=="object"?e.card:null,s=c(r=>this._patch(t,{card:et({...a,...r})}),"patchPin");if(!(a!=null&&a.card))return p`
        <div class="pick-row">
          <ha-button appearance="outlined" @click=${()=>this._chooseCard(t)}>
            <ha-icon icon="mdi:card-plus-outline" slot="start"></ha-icon>
            Add card
          </ha-button>
          <span class="hint">Any Lovelace card, shown beside the point.</span>
        </div>
      `;const n=String(a.card.type??"card").replace("custom:","");return p`
      <div class="grid">
        ${this._select("Show",a.show??"tap",Qn,r=>s({show:r==="tap"?void 0:r}))}
        <lcards-position-picker .value=${a.position??"center-right"} .label=${"Position"} .helper=${"Where the card sits round the point"}
          @value-changed=${r=>{r.stopPropagation(),s({position:r.detail.value==="center-right"?void 0:r.detail.value})}}>
        </lcards-position-picker>
        ${this._number("Width (px)",a.width,r=>s({width:r}),{min:80,max:1200})}
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
              @config-changed=${r=>this._onCardConfigChanged(t,r)}>
            </hui-card-element-editor>
          </div>`:p`<lcards-message type="info">Edit the ${n} card in YAML (Home Assistant's card editor is not loaded here).</lcards-message>`}
    `}_renderLabel(e,t){var r,l;const a=Object.keys(((l=(r=this.config)==null?void 0:r.labels)==null?void 0:l.styles)??{}),s=Ot({hass:this.hass,schema:Z.properties.points.items,value:e,onChange:c(o=>this._patch(t,{text:o.text}),"onChange")}),n=e.color;return p`
      <div class="grid">
        <div class="full">${this._text("Label",e.label,o=>this._patch(t,{label:o}),"Templates work here; leave empty for a marker only")}</div>
        ${this._select("Style",e.style??"",[{value:"",label:"(Default: minor)"},...[...ua,...a].map(o=>({value:o,label:o}))],o=>this._patch(t,{style:o||void 0}))}
        ${this._select("Marker",e.marker??"",[{value:"",label:"(None)"},...pa.filter(o=>o!=="none").map(o=>({value:o,label:o}))],o=>this._patch(t,{marker:o||void 0}))}
        <ha-selector class="full" .hass=${this.hass} .required=${false} .label=${"Entity"} .value=${e.entity??""}
          .helper=${"Label templates read it; state colours and more-info follow it"}
          .selector=${{entity:{}}}
          @value-changed=${o=>this._patch(t,{entity:o.detail.value||void 0})}>
        </ha-selector>
        <div class="full">
          ${n&&typeof n=="object"?p`<div class="hint">Colour by state: edit the map in YAML.</div>`:p`<lcards-color-picker .hass=${this.hass} .value=${n??""} .showPreview=${true}
                @value-changed=${o=>this._patch(t,{color:o.detail.value||void 0})}>
              </lcards-color-picker>`}
        </div>
      </div>
      <lcards-form-section header="Label text" description="Position round the point, font, size, colours and background (over its style)" icon="mdi:format-text" nested outlined>
        <lcards-text-field-editor .editor=${s} .config=${s.config} basePath="text.label" .omit=${["content"]}
          .suggestedStates=${["default","active","inactive","unavailable","selected"]}>
        </lcards-text-field-editor>
      </lcards-form-section>
    `}_renderPoint(e,t,a){var o,d;const s=tt(e),n=String((e==null?void 0:e.id)??`Point ${t+1}`),r=s?e[s]:void 0,l=!!(s&&((o=F[s])!=null&&o.pick)&&!(r&&typeof r=="object"&&!Array.isArray(r)));return p`
      <lcards-form-section class="point" header=${n} data-index=${t}
        secondary=${[e.label,s?(d=F[s])==null?void 0:d.label:"no position"].filter(Boolean).join(" · ")}
        icon="mdi:map-marker"
        ?expanded=${this._expanded===t}
        @expanded-changed=${u=>{u.detail.expanded!==(this._expanded===t)&&this._toggle(t)}}
        outlined>
        ${l?p`
          <ha-icon-button slot="header-icons" .label=${"Pick on preview"}
            @click=${u=>{u.stopPropagation(),this._pick(e)}}>
            <ha-icon icon="mdi:crosshairs-gps"></ha-icon>
          </ha-icon-button>`:w}
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

        ${s?w:p`<lcards-message type="warning">This point has no position: choose how it is placed.</lcards-message>`}
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
    `}};c(Tt,"LCARdSAstroPointsEditor");let bt=Tt;customElements.get("lcards-astro-points-editor")||customElements.define("lcards-astro-points-editor",bt);const Ti=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj$1"),Ei=["default","active","inactive","unavailable","selected"];function Pi(i,e){const t=[];return i.font_size!==void 0&&t.push(typeof i.font_size=="number"?`${i.font_size} px`:String(i.font_size)),i.priority!==void 0&&t.push(`priority ${i.priority}`),e&&t.push("changed"),t.join(" · ")}c(Pi,"styleSummary");const Et=class Et2 extends me{static get properties(){return{hass:{attribute:false},value:{attribute:false},_newName:{state:true}}}constructor(){super(),this.hass=null,this.value={},this._newName=""}static get styles(){return ae`
      :host { display: block; font-family: var(--ha-font-family-body); }
      .group-title { font-weight: var(--ha-font-weight-medium); margin: var(--ha-space-4) 0 var(--ha-space-1); }
      .hint { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin-bottom: var(--ha-space-2); }
      .switches { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-4); margin-top: var(--ha-space-4); }
      .add { display: flex; gap: var(--ha-space-2); align-items: center; margin-top: var(--ha-space-2); }
      .add ha-input { flex: 1; }
      lcards-form-section { display: block; margin-bottom: var(--ha-space-2); }
    `}_emit(e){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e}}))}render(){const e=Ti(this.value)?this.value:{},t=Ot({hass:this.hass,schema:Z.properties.labels,value:e,onChange:c(r=>this._emit(r),"onChange")}),a=Ti(e.styles)?e.styles:{},s=Object.keys(G),n=Object.keys(a).filter(r=>!s.includes(r));return p`
      <lcards-form-section data-key="default" header="Every label" icon="mdi:format-text" outlined nested
        description="Text settings every label on the card starts from (a font, letter spacing, a colour), under the styles.">
        <lcards-text-field-editor .editor=${t} .config=${t.config} basePath="default" .suggestedStates=${Ei}>
        </lcards-text-field-editor>
      </lcards-form-section>

      <div class="group-title">Label styles</div>
      <div class="hint">A point picks a style (its style key); a style sets the size, colour and priority. Change a built-in one here, or add your own.</div>
      ${s.map(r=>this._style(t,r,{...G[r],...a[r]??{}},a[r]!==void 0,true))}
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
        ${C.renderField(t,"overlap",{label:"Labels may overlap"})}
        ${C.renderField(t,"snap",{label:"Pixel snap"})}
      </div>
    `}_style(e,t,a,s,n){return p`
      <lcards-form-section data-style=${t} header=${t} secondary=${Pi(a,s)}
        icon=${n?"mdi:format-size":"mdi:format-letter-case"} outlined nested>
        ${n&&s?p`
          <ha-icon-button slot="header-icons" .label=${"Back to the built-in style"} title="Back to the built-in style" data-key=${`reset-${t}`}
            @click=${r=>{r.stopPropagation(),e._setConfigValue(`styles.${t}`,void 0)}}>
            <ha-icon icon="mdi:restore"></ha-icon>
          </ha-icon-button>`:w}
        ${n?w:p`
          <ha-icon-button slot="header-icons" .label=${"Delete style"} title="Delete style" data-key=${`delete-${t}`}
            @click=${r=>{r.stopPropagation(),e._setConfigValue(`styles.${t}`,void 0)}}>
            <ha-icon icon="mdi:delete"></ha-icon>
          </ha-icon-button>`}
        ${n?p`<div class="hint">Built in: ${Pi(G[t],false)}. What you set here wins.</div>`:w}
        ${C.renderField(e,`styles.${t}.priority`,{label:"Priority",helper:"Which label wins when two overlap (higher wins)."})}
        ${C.renderField(e,`styles.${t}.overlap`,{label:"Never hidden by another label"})}
        <lcards-text-field-editor .editor=${e} .config=${e.config} basePath=${`styles.${t}`} .suggestedStates=${Ei}>
        </lcards-text-field-editor>
      </lcards-form-section>`}_validName(e,t){const a=String(e??"").trim();return/^[a-z][a-z0-9_]*$/.test(a)&&!(a in G)&&!(a in t)}_addStyle(e,t){const a=this._newName.trim();this._validName(a,t)&&(this._newName="",e._setConfigValue(`styles.${a}`,{font_size:G.minor.font_size,priority:G.minor.priority}))}};c(Et,"LCARdSAstroLabelsEditor");let gt=Et;customElements.get("lcards-astro-labels-editor")||customElements.define("lcards-astro-labels-editor",gt);const le=c(i=>JSON.parse(JSON.stringify(i??{})),"clone"),xe=c(i=>!!i&&typeof i=="object"&&!Array.isArray(i),"isObj"),ir=["points","objects","camera","backdrop"];function ar(i){var t,a;if(!ge(i))return true;const e=(a=(t=customElements.get("lcards-astrometrics-card"))==null?void 0:t.getStubConfig)==null?void 0:a.call(t);return!!e&&ir.every(s=>JSON.stringify(i[s])===JSON.stringify(e[s]))}c(ar,"isStarterCard");const zi=150,sr={"":"mdi:eye-outline",diagram:"mdi:vector-polyline",realistic:"mdi:earth",mixed:"mdi:layers-triple-outline"},nr=5*60*1e3,rr=[{id:"units",header:"Units",icon:"mdi:ruler",hint:"Scene units are your own: every position, size and distance is in them. Name them (km, au, ly) for real data: parts and models then start at their real size, and bodies sit at real distances. In scene units, a part is sized to fit what is already there. Naming the units does not rescale the scene.",parts:[{path:"",keys:["units"]}]},{id:"look",header:"Look",icon:"mdi:eye-outline",hint:"Which objects and points show: the diagram ones, the realistic ones, or both. Each object and point can pick its look. Model scale: models at their real size, or drawn larger when they would be too small to see.",parts:[{path:"",keys:["look","model_scale"]}]},{id:"time",header:"Time",icon:"mdi:clock-outline",hint:"The scene date moves bodies and orbits; the time scale speeds up or slows the decorative motion.",parts:[{path:"clock",keys:["date","rate"]},{path:"",keys:["time_scale"]}]},{id:"warp",header:"Warp",icon:"mdi:rocket-launch-outline",hint:"Stars and dust stream past while the scene is at warp.",parts:[{path:"",keys:["warp","warp_factor"]}]},{id:"space",header:"Space",icon:"mdi:star-four-points-outline",hint:"Part of the 3D scene: stars at infinity turn with the camera; depth dust fills the space round the camera and shows depth on every move.",parts:[{path:"backdrop",keys:["stars","dust"]}]}],or=[{id:"controls",header:"Controls",icon:"mdi:gesture-swipe",hint:"How dragging, the wheel, pinching and double-taps move the camera.",keys:["controls","drag","pan","zoom_to","wheel","double_tap","zoom_step"]},{id:"buttons",header:"On-card buttons",icon:"mdi:gesture-tap-button",hint:"Pan, zoom, reset and time buttons on the card.",keys:["buttons"]},{id:"flying",header:"Flying",icon:"mdi:airplane",hint:"How the camera flies to a view, point or object.",keys:["fly_duration","ease","follow","warp"]},{id:"turning",header:"Turning",icon:"mdi:rotate-3d-variant",hint:"Turn round the target on its own.",keys:["auto_rotate"]},{id:"limits",header:"Limits",icon:"mdi:arrow-expand-all",hint:"How far the camera may tilt, zoom and wander.",keys:["limits"]}];function it(i){const e=c((t,a)=>{const s=Array.isArray(t)?t.length:0;return`${s} ${a}${s===1?"":"s"}`},"n");return`${e(i==null?void 0:i.points,"point")}, ${e(i==null?void 0:i.objects,"object")}`}c(it,"systemCounts");const Pt=class Pt2 extends me{static get properties(){return{hass:{attribute:false},_workingConfig:{state:true},_activeTab:{state:true},_expandedObject:{state:true},_scope:{state:true},_selectedPoint:{state:true},_addingObject:{state:true},_placing:{state:true},_measuring:{state:true},_quickView:{state:true},_previewLook:{state:true},_held:{state:true},_isolated:{state:true},_status:{state:true},_scaleBar:{state:true},_expandedView:{state:true},_openStarter:{state:true},_starterParams:{state:true},_starterMessage:{state:true},_trying:{state:true},_toolbarExpanded:{state:true},_modelScale:{state:true},_outlineEdit:{state:true},_hasRealModels:{state:true},_historyVersion:{state:true},_viewError:{state:true},_modelExtents:{state:true}}}constructor(){super(),this.hass=null,this._initialConfig={},this._workingConfig={},this._activeTab="objects",this._expandedObject=-1,this._scope=O,this._selectedPoint=null,this._addingObject=false,this._placing=false,this._measuring=false,this._measureA=null,this._measureB=null,this._quickView=-1,this._previewLook=null,this._held=false,this._isolated=null,this._status="",this._scaleBar=null,this._expandedView=null,this._viewError="",this._modelExtents={},this._extentPending=new Set,this._openStarter=null,this._starterParams={},this._starterMessage=null,this._trying=null,this._toolbarExpanded=true,this._history=gn(),this._historyVersion=0,this._tryTimer=void 0,this._onKey=this._onKey.bind(this),this._previewRef=ba(),this._onPlaceKey=this._onPlaceKey.bind(this),this._previewCard=null,this._outlineEdit=null,this._modelScale="real",this._hasRealModels=false,this._previewTimer=void 0}set config(e){this._initialConfig=e??{}}get config(){return this._workingConfig}connectedCallback(){var e;super.connectedCallback(),this._workingConfig=le(this._initialConfig),(e=this._workingConfig).type||(e.type="custom:lcards-astrometrics-card"),this._activeTab=ar(this._workingConfig)?"starters":"objects",window.addEventListener("keydown",this._onKey)}disconnectedCallback(){var e,t;super.disconnectedCallback(),clearTimeout(this._previewTimer),clearTimeout(this._tryTimer),window.removeEventListener("keydown",this._onKey),window.removeEventListener("keydown",this._onPlaceKey,true),(t=(e=this._previewCard)==null?void 0:e.attachStudio)==null||t.call(e,null),this._outlineEdit=null}firstUpdated(){this._mountPreview()}updated(e){if(e.has("hass")&&this._previewCard&&(this._previewCard.hass=this.hass),(e.has("_scope")||e.has("_trying")||e.has("_workingConfig"))&&this._updateScaleBar(),this._outlineEdit&&(e.has("_workingConfig")||e.has("_expandedObject")||e.has("_scope")||e.has("_activeTab"))){const t=this._objects[this._expandedObject];this._activeTab!=="objects"||!t||String(t.id)!==this._outlineEdit.id||t.shape!=="prism"?this._endOutline():this._outlineEdit.draw||this._outlineSync(t)}}get _points(){return ut(this._workingConfig,this._scope,"points")}get _objects(){return ut(this._workingConfig,this._scope,"objects")}get _pointIds(){return fn(this._workingConfig)}get _system(){return ne(this._workingConfig,this._scope)}get _units(){const e=this._system;return e?e.units??(e.scale!==void 0?"":this._workingConfig.units??""):this._workingConfig.units??""}get _systemIds(){return(Array.isArray(this._workingConfig.objects)?this._workingConfig.objects:[]).filter(t=>xe(t)&&t.type==="system"&&t.id!==void 0).map(t=>String(t.id))}_commit(e,{now:t=false,step:a=false}={}){this._history.push(this._workingConfig,e,{step:a}),this._historyVersion++,this._show(e,{now:t})}_show(e,{now:t=false}={}){this._workingConfig=e;const a=un(e,this._scope);a!==this._scope&&this._openScope(a),clearTimeout(this._previewTimer),t?this._updatePreview():this._previewTimer=setTimeout(()=>this._updatePreview(),zi)}_undo(){const e=this._trying?null:this._history.undo(this._workingConfig);e&&(this._historyVersion++,this._show(e,{now:true}))}_redo(){const e=this._trying?null:this._history.redo(this._workingConfig);e&&(this._historyVersion++,this._show(e,{now:true}))}_onKey(e){const t=e.key.toLowerCase(),a=t==="f"&&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)&&!e.defaultPrevented&&!e.repeat;if(!a&&(!(e.ctrlKey||e.metaKey)||e.altKey||t!=="z"&&t!=="y"))return;const s=e.composedPath(),n=document.activeElement;if(!(!s.includes(this)&&n&&n!==document.body||s.some(l=>l instanceof HTMLElement&&l.matches('input, textarea, [contenteditable=""], [contenteditable="true"], ha-code-editor, .cm-editor')))){if(e.preventDefault(),a){this._frameSelected();return}e.stopPropagation(),t==="y"||e.shiftKey?this._redo():this._undo()}}_setTop(e,t){const a={...this._workingConfig};t===void 0||Array.isArray(t)&&!t.length&&e!=="points"?delete a[e]:a[e]=t,this._commit(a)}_setList(e,t,a={}){this._commit(_i(this._workingConfig,this._scope,e,t),a)}_setObjects(e){this._setList("objects",e.length?e:void 0)}_openScope(e,{fly:t=false}={}){e!==this._scope&&(this._trying&&this._discardTry(),this._scope=e,this._expandedObject=-1,this._addingObject=false,this._selectedPoint=null,t&&this._flyToScope())}async _updateScaleBar(){var h,m,f,b,g;const e=await((m=(h=this._previewCard)==null?void 0:h.studioScene)==null?void 0:m.call(h));if(!(e!=null&&e.viewIn))return;const t=!this._trying&&this._system?this._objectIdIn(O,this._scope):void 0,{width:a,px:s}=e.viewIn(t);if(!(a>0)||!(s>0)||!Number.isFinite(a)){this._scaleBar=null;return}const n=a/5,r=Math.floor(Math.log10(n)),l=n/10**r,o=(l>=5?5:l>=2?2:1)*10**r,d=t?this._units:(((f=this._trying)==null?void 0:f.config)??this._workingConfig).units,u=`${o.toLocaleString(void 0,{maximumSignificantDigits:1})} ${d||"units"}`,y=Math.round(o/a*s);(((b=this._scaleBar)==null?void 0:b.px)!==y||((g=this._scaleBar)==null?void 0:g.label)!==u)&&(this._scaleBar={px:y,label:u})}async _flyToScope(){var a,s;const e=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a));if(!e)return;const t=this._system?this._objectIdIn(O,this._scope):void 0;t!==void 0?e.frameObject(t):e.home()}_previewConfig(){var t;let e=le(((t=this._trying)==null?void 0:t.config)??this._workingConfig);return this._previewLook&&(e.look=this._previewLook),this._isolated&&!this._trying&&(e=vn(e,this._isolated)),{...e,height:"100%"}}_mountPreview(){var a;const e=this._previewRef.value;if(!e)return;const t=document.createElement("lcards-astrometrics-card");try{t.setConfig(this._previewConfig())}catch(s){Dt.warn("[AstrometricsStudio] Preview config rejected",s)}t.hass=this.hass,e.replaceChildren(t),this._previewCard=t,this._held=false,this._measuring=false,this._quickView=-1,t.addEventListener("astro-model-scale",s=>{this._modelScale=s.detail.mode,this._hasRealModels=s.detail.hasRealModels}),(a=t.attachStudio)==null||a.call(t,{onView:c(()=>this._updateScaleBar(),"onView"),onSelect:c(s=>this._onSceneSelect(s),"onSelect"),onDrag:c((s,n,r,l,o)=>this._onPointDrag(s,n,r,l,o),"onDrag")})}_updatePreview(){const e=this._previewCard;if(e)try{e.setConfig(this._previewConfig())}catch(t){Dt.warn("[AstrometricsStudio] Preview config rejected",t)}}_onSceneSelect(e){if(!e){this._selectPoint(null),this._activeTab==="objects"&&(this._expandedObject=-1);return}if(e.kind==="point"){const s=Ge(this._workingConfig,e.id);s!==null&&this._openScope(s),this._activeTab="points",this._selectPoint(e.id);return}const t=mn(this._workingConfig,e.id);if(!t)return;this._openScope(t.scope);const a=t.index;this._activeTab="objects",this._selectObject(a),this.updateComplete.then(()=>{var s;return(s=this.renderRoot.querySelector(`[data-object="${a}"]`))==null?void 0:s.scrollIntoView({block:"nearest",behavior:"smooth"})})}async _selectPoint(e){var a,s;this._selectedPoint=e;const t=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a));t==null||t.highlight(e)}async _selectObject(e){var s,n;this._expandedObject=e,this._selectedPoint=null;const t=this._objects[e],a=await((n=(s=this._previewCard)==null?void 0:s.studioScene)==null?void 0:n.call(s));a==null||a.highlight(t?this._objectId(t,e):null,"object")}_onPointDrag(e,t,a,s,n){const r=Array.isArray(a)?a.join(", "):a;if(!s){this._status=n?`Moving point ${e} (${n} stands at it): ${t} ${r}`:`${e}: ${t} ${r}`;return}this._status="";const l=Ge(this._workingConfig,e);l!==null&&this._openScope(l);const o=this._points.map(d=>d&&String(d.id)===e?{...d,[t]:a}:d);this._setList("points",o,{now:true}),n===void 0&&(this._activeTab="points",this._selectPoint(e))}async _frameSelected(){var t,a,s;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t).catch(()=>null));await((s=e==null?void 0:e.frameSelected)==null?void 0:s.call(e))}async _setPlacing(e){var s,n;const t=this._previewCard,a=await((s=t==null?void 0:t.studioScene)==null?void 0:s.call(t));if(a)if(e){this._measuring&&await this._setMeasuring(false),(n=t.cancelPick)==null||n.call(t),this._placing=true;const r=this._system?this._objectIdIn(O,this._scope):void 0;this._status=r?`Tap the scene to place a new point in ${r}. Escape cancels.`:"Tap the scene to place a new point. Escape cancels.",window.addEventListener("keydown",this._onPlaceKey,true),a.setPickHandler((l,o)=>{const d=a.placementAt(l,o,r);if(!d){this._status="Nothing to stand on there: tap an object or the ground plane.";return}this._setPlacing(false),this._addPlacedPoint(d)})}else this._placing&&(this._placing=false,this._status="",window.removeEventListener("keydown",this._onPlaceKey,true),a.setPickHandler(null))}_onPlaceKey(e){e.key!=="Escape"||!(this._placing||this._measuring)||(e.stopPropagation(),e.preventDefault(),this._measuring?this._setMeasuring(false):this._setPlacing(false))}async _setMeasuring(e){var s,n;const t=this._previewCard,a=await((s=t==null?void 0:t.studioScene)==null?void 0:s.call(t));if(a)if(e){this._placing&&await this._setPlacing(false),(n=t.cancelPick)==null||n.call(t),this._measuring=true,this._measureA=this._measureB=null;const r=this._system?this._objectIdIn(O,this._scope):void 0;this._status="Tap where to measure from: a point, an object or the ground. Escape stops.",window.addEventListener("keydown",this._onPlaceKey,true);const l=c(o=>o.point??`[${o.at.map(d=>D(d)).join(", ")}]`,"where");a.setPickHandler((o,d)=>{const u=a.measureAt(o,d,r);if(!u){this._status="Nothing there to measure to: tap a point, an object or the ground.";return}if(!this._measureA||this._measureB){this._measureA=u,this._measureB=null,a.showMeasure(null),this._status=`From ${l(u)}: tap where to measure to.`;return}this._measureB=u,a.showMeasure(this._measureA.at,u.at,r),this._status=`${l(this._measureA)} to ${l(u)}: ${wn(this._measureA.at,u.at,this._units||void 0)}. Tap again to measure anew.`})}else this._measuring&&(this._measuring=false,this._measureA=this._measureB=null,this._status="",window.removeEventListener("keydown",this._onPlaceKey,true),a.setPickHandler(null),a.showMeasure(null))}async _toggleHold(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t));e&&(this._held=!this._held,e.setHold(this._held))}async _nextQuickView(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t));e&&(this._quickView=(this._quickView+1)%je.length,e.flyTo(_n(this._quickView,e.cameraKeys()),{duration:600}))}_nextLook(){this._previewLook=$i(this._previewLook),this._updatePreview()}_toggleIsolate(){const e=this._objects[this._expandedObject];this._isolated=this._isolated||!e?null:this._objectId(e,this._expandedObject),this._updatePreview()}_addPlacedPoint({form:e,value:t,object:a}){const s=rt("point",this._pointIds),n={id:s,...a?{object:a}:{},[e]:t,marker:"dot",label:"NEW POINT"};this._setList("points",[...this._points,n]),this._activeTab="points",this._selectPoint(s)}_objectId(e,t){return this._objectIdIn(this._scope,t)??((e==null?void 0:e.id)!==void 0?String(e.id):`${e==null?void 0:e.type}#${t+1}`)}_objectIdIn(e,t){return pn(this._workingConfig,e)[t]}static get styles(){return[_a,va,wa,ae`
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
                <div class="preview-host" ${ga(this._previewRef)}></div>
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
            <ha-button appearance="plain" @click=${()=>window.open($t(Ri.astrometricsStudio),"_blank","noopener")}>
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
        aria-pressed=${r.active===void 0?w:r.active?"true":"false"} ?disabled=${!!r.disabled} @click=${r.action}>
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
            ${a({id:"quick-view",icon:"mdi:axis-arrow",active:this._quickView>=0,title:`${je[(this._quickView+1)%je.length].label} view, flat (orthographic); press again for the next, Home goes back`,action:c(()=>this._nextQuickView(),"action")})}
            ${s({id:"fly-forward",icon:"mdi:arrow-up-bold-outline",title:"Fly forward (W, Page Up); hold to keep going"})}
            ${s({id:"fly-back",icon:"mdi:arrow-down-bold-outline",title:"Fly back (S, Page Down); hold to keep going"})}
          </div>
          <div class="canvas-toolbar-group">
            <span class="canvas-toolbar-group-label">Preview</span>
            ${a({id:"model-scale",icon:"mdi:magnify-plus-outline",active:this._modelScale==="visible",disabled:!this._hasRealModels,title:this._hasRealModels?"Draw small models larger, to see them (V); not saved":"Draw small models larger: no model is at its real size",action:c(()=>{var r,l;return(l=(r=this._previewCard)==null?void 0:r.setModelScale)==null?void 0:l.call(r,"toggle")},"action")})}
            ${a({id:"look",icon:sr[this._previewLook??""],active:this._previewLook!==null,title:`Look: ${this._previewLook??"the card's"}; press for ${$i(this._previewLook)??"the card's"} (not saved)`,action:c(()=>this._nextLook(),"action")})}
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
        </div>`}_renderUnitsChip(){var r;const e=((r=this._trying)==null?void 0:r.config)??this._workingConfig,t=this._trying?null:this._system,a=t?this._objectIdIn(O,this._scope):"",s=t?this._units:e.units,n=`${t?`System ${a}`:"Scene"}: ${s||"scene units"}`;return p`
      <div class="units-chip" data-units=${s||""} title="Positions, sizes and distances are in these units">
        <ha-assist-chip filled label=${n}><ha-icon slot="icon" icon="mdi:arrow-expand-horizontal"></ha-icon></ha-assist-chip>
        ${this._scaleBar?p`
          <div class="scale-bar" title="This length on the preview, where the camera looks">
            <span class="scale-line" style=${`width: ${this._scaleBar.px}px`}></span>
            <span class="scale-label">${this._scaleBar.label}</span>
          </div>`:w}
      </div>`}_renderActiveTab(){switch(this._activeTab){case"scene":return this._renderSceneTab();case"points":return this._renderPointsTab();case"camera":return this._renderCameraTab();case"starters":return this._renderStartersTab();case"yaml":return p`
        <lcards-studio-yaml-tab
          .hass=${this.hass}
          .config=${this._workingConfig}
          .schema=${Z}
          cardType="astrometrics"
          @yaml-config-changed=${e=>this._commit(le(e.detail.config))}>
        </lcards-studio-yaml-tab>`;default:return this._renderObjectsTab()}}_renderSceneTab(){const e=this._workingConfig,t=Z.properties,a=c(n=>n?t[n].properties:t,"schemaAt"),s=c(n=>n?xe(e[n])?e[n]:{}:e,"valueAt");return p`
      ${In()}
      ${rr.map(n=>p`
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
        <lcards-astro-labels-editor .hass=${this.hass} .value=${xe(e.labels)?e.labels:{}}
          @value-changed=${n=>{n.stopPropagation(),this._setTop("labels",Object.keys(n.detail.value??{}).length?n.detail.value:void 0)}}>
        </lcards-astro-labels-editor>
      </lcards-form-section>
    `}_renderPointsTab(){return p`
      ${Rn()}
      ${this._renderScopeBar("points")}
      <lcards-astro-points-editor
        .hass=${this.hass}
        .config=${yn(this._workingConfig,this._scope)}
        .preview=${this._previewCard}
        .takenIds=${this._pointIds}
        .selected=${this._selectedPoint}
        @point-selected=${e=>{e.stopPropagation(),this._selectPoint(e.detail.id)}}
        @points-changed=${e=>{e.stopPropagation(),this._setList("points",e.detail.value)}}>
      </lcards-astro-points-editor>
    `}_renderCameraTab(){const e=Z.properties.camera.properties,t=xe(this._workingConfig.camera)?this._workingConfig.camera:{},a=c(s=>p`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${e} .keys=${s} .value=${t} .pointIds=${this._pointIds}
        .units=${this._workingConfig.units??""} .choices=${{view:Object.keys(I(t))}}
        @form-changed=${n=>this._setTop("camera",Object.keys(n.detail.value).length?n.detail.value:void 0)}>
      </lcards-astro-schema-form>`,"form");return p`
      ${Dn()}
      ${this._renderViews(t,a(["view"]))}
      ${or.map(s=>p`
        <lcards-form-section data-group=${s.id} header=${s.header} icon=${s.icon} description=${s.hint} outlined>
          ${a(s.keys.filter(n=>e[n]))}
        </lcards-form-section>`)}
    `}_renderViews(e,t){const a=I(e),s=Object.keys(a),n=es(e);return p`
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
        secondary=${[n?"start view":null,os(t)].filter(Boolean).join(" · ")}
        icon=${n?"mdi:star":"mdi:video-outline"} outlined ?expanded=${r}
        @expanded-changed=${d=>{d.detail.expanded?this._expandedView=e:this._expandedView===e&&(this._expandedView=null),this._viewError=""}}>
        <ha-icon-button slot="header-icons" .label=${"Fly to"}
          @click=${d=>{d.stopPropagation(),this._flyToView(t)}}>
          <ha-icon icon="mdi:airplane"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Move up"} ?disabled=${a===0}
          @click=${d=>{d.stopPropagation(),this._setCamera(Gt(this._workingConfig.camera,e,-1))}}>
          <ha-icon icon="mdi:arrow-up"></ha-icon>
        </ha-icon-button>
        <ha-icon-button slot="header-icons" .label=${"Move down"} ?disabled=${a===s-1}
          @click=${d=>{d.stopPropagation(),this._setCamera(Gt(this._workingConfig.camera,e,1))}}>
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
          ${this._viewError?p`<lcards-message type="error">${this._viewError}</lcards-message>`:w}
          <lcards-astro-schema-form .hass=${this.hass} .schema=${l} .keys=${Object.keys(l)} .value=${t} .pointIds=${this._pointIds}
            .units=${this._workingConfig.units??""}
            @form-changed=${d=>{d.stopPropagation(),this._setCamera(Yt(this._workingConfig.camera,e,d.detail.value))}}>
          </lcards-astro-schema-form>`:w}
      </lcards-form-section>
    `}_setCamera(e,{now:t=false}={}){const a={...this._workingConfig};e?a.camera=e:delete a.camera,this._commit(a,{now:t})}async _captureView(e){var r,l,o;const t=await((l=(r=this._previewCard)==null?void 0:r.studioScene)==null?void 0:l.call(r));if(!t)return;const a=this._workingConfig.camera,s=I(a),n=e??as(s);this._setCamera(Yt(a,n,is(((o=t.viewNow)==null?void 0:o.call(t))??t.cameraKeys(),t.pointPositions(),s[n])),{now:true}),this._expandedView=n,this._viewError=""}async _flyToView(e){var a,s;const t=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a));t==null||t.flyTo(e)}_renameView(e,t){const a=String(t??"").trim(),s=ns(I(this._workingConfig.camera),a,e);this._viewError=s??"",!(s||a===e)&&(this._expandedView=a,this._commit(rs(this._workingConfig,e,a)))}async _deleteView(e){await Bt({title:"Delete view",message:`Delete the view ${e}? Actions that fly to it stop working.`})&&(this._expandedView===e&&(this._expandedView=null),this._setCamera(ss(this._workingConfig.camera,e)))}_renderStartersTab(){const e=Q.find(s=>s.id===this._openStarter);if(e)return p`${this._renderScopeBar("starters")}${this._renderStarterDetail(e)}`;const t=!!this._system,a=c((s,n,r,l)=>p`
      <lcards-form-section class="starter-group" data-group=${s} header=${n} icon=${r} description=${l} outlined expanded>
        <div class="starter-grid">${Q.filter(o=>o.kind===s).map(o=>this._renderStarterTile(o))}</div>
      </lcards-form-section>`,"group");return p`
      ${Mn()}
      ${this._renderScopeBar("starters")}
      ${a("scene","Scenes","mdi:image-filter-hdr-outline",t?"A whole scene: it acts on the whole card, not only this system.":"A whole scene: use it in place of yours, or merge it into yours.")}
      ${a("part","Parts","mdi:puzzle-outline",t?"One thing to add to this system, sized in its units, such as a planet with moons.":"One thing to add next to your scene, such as a planet with moons.")}
    `}_picture(e,t){return p`
      <div class="starter-picture">
        <ha-icon icon=${t}></ha-icon>
        <img src=${e} alt="" loading="lazy"
          @error=${a=>{a.target.hidden=true}}>
      </div>`}get _starterSystem(){return this._system?this._scope:void 0}get _starterUnits(){return St(this._workingConfig,this._starterSystem)??""}_starterClash(e,t){return dn(this._workingConfig,e,t,e.kind==="part"?this._starterSystem:void 0)}_renderStarterTile(e){const t=e.kind==="part"?this._starterClash(e):null;return p`
      <button class="starter-tile ${t?"clash":""}" data-starter=${e.id} @click=${()=>{this._openStarter=e.id}}>
        ${this._picture(ki(e.id),e.icon)}
        <span class="starter-title">${e.title}</span>
        <span class="starter-summary">${e.summary}</span>
        ${t?p`<span class="starter-note"><ha-icon icon="mdi:arrow-expand-horizontal"></ha-icon>In ${t}; this ${this._system?"system":"scene"} is in ${this._starterUnits||"scene units"}</span>`:w}
      </button>`}_starterMode(e){return e.kind==="scene"?"replace":this._system||!this._starterClash(e,this._starterParams[e.id])?"merge":e.scene?"scene":"replace"}_renderStarterDetail(e){var b,g;const t=this._starterParams[e.id]??{},a=((b=this._trying)==null?void 0:b.id)===e.id,s=e.kind==="scene",n=this._starterClash(e,t),r=this._starterMode(e),l=e.scene?Q.find(_=>_.id===e.scene):void 0,o=this._workingConfig.units??"scene units",d=!s&&this._system?this._objectIdIn(O,this._scope):null,u=!!(d&&n),y=s?this._workingConfig.units??"":this._starterUnits,h=s||r!=="merge"?null:pe(this._workingConfig,this._starterSystem),m=En(e,t,y||null,h),f=h&&Yi(e,h,y||null,t)!==null;return p`
      <div class="starter-detail" data-starter-detail=${e.id}>
        <div class="tab-header">
          <ha-button appearance="plain" size="s" ?disabled=${!!this._trying} @click=${()=>{this._openStarter=null,this._starterMessage=null}}>
            <ha-icon icon="mdi:arrow-left" slot="start"></ha-icon>
            All starters
          </ha-button>
        </div>
        ${this._picture(ki(e.id),e.icon)}
        <h3 class="starter-detail-title"><ha-icon icon=${e.icon}></ha-icon>${e.title}</h3>
        <p class="starter-description">${e.description}</p>
        ${s?p`<p class="hint starter-units"><ha-icon icon="mdi:ruler"></ha-icon>${Cn(e)}</p>`:w}
        <p class="hint starter-adds">${r==="scene"?`Replaces the scene with ${l==null?void 0:l.title}, then adds`:s||r==="replace"?"Replaces the scene with":"Adds"} ${Pn(e,t)}${d&&!u?` to system ${d}`:""}.</p>
        ${u?p`
          <lcards-message type="info" class="starter-clash">
            This part is in ${n} and system ${d} is in ${y||"its parent's units"}, so it cannot go into it. Go back to the scene to add it there.
          </lcards-message>`:n&&!s?p`
          <lcards-message type="info" class="starter-clash">
            This part is in ${n} and your scene is in ${o}, so it cannot go next to it.
            ${l?p`It is made for ${l.title}: start with that scene and add this part to it.`:"It can replace the scene instead."}
            Undo brings your scene back.
          </lcards-message>`:w}
        ${e.params.length?p`
          <lcards-form-section header="Settings" icon="mdi:tune-variant" outlined expanded>
            ${f?p`<p class="hint starter-fit">Sized to fit this ${this._system?"system":"scene"} (its units have no name). Change the sizes as you like.</p>`:w}
            <lcards-astro-schema-form .hass=${this.hass} .schema=${jn(e)} .value=${m}
              .pointIds=${this._pointIds} .choices=${Tn(e)} .units=${y}
              @form-changed=${_=>{_.stopPropagation(),this._setStarterParams(e,_.detail.value)}}>
            </lcards-astro-schema-form>
          </lcards-form-section>`:w}
        <lcards-form-section header="YAML" icon="mdi:code-braces" description="What it puts into the card" outlined>
          <pre class="starter-yaml">${this._starterYaml(e,m,y)}</pre>
        </lcards-form-section>
        ${((g=this._starterMessage)==null?void 0:g.starter)===e.id?p`<lcards-message type=${this._starterMessage.type}>${this._starterMessage.text}</lcards-message>`:w}
        <div class="starter-actions">
          ${u?p`
            <ha-button data-action="to-scene" @click=${()=>this._openScope(O,{fly:true})}>
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
              <ha-button appearance="plain" ?disabled=${!ge(this._workingConfig)||!!n}
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
    `}_setStarterParams(e,t){var s;if(this._starterParams={...this._starterParams,[e.id]:t},((s=this._trying)==null?void 0:s.id)!==e.id)return;const a=this._trying.mode;clearTimeout(this._tryTimer),this._tryTimer=setTimeout(()=>this._tryStarter(e,a),zi)}_starterYaml(e,t,a=""){const s=Ae(a?{units:a}:{},e,t);if(!s.config)return s.error;const{type:n,...r}=s.config;return s.added.units===void 0&&delete r.units,hn(r)}_withStarter(e,t){let a=this._workingConfig;const s=t==="scene"?Q.find(l=>l.id===e.scene):void 0;s&&(a=Ae(a,s,this._starterParams[s.id]??{},{mode:"replace"}).config??a);const n=e.kind==="part"&&t==="merge"?this._starterSystem:void 0,r=Ae(a,e,this._starterParams[e.id]??{},{mode:t==="scene"?"merge":t,system:n});return!r.config||!r.added?(this._starterMessage={starter:e.id,type:"error",text:String(r.error)},null):{config:r.config,added:r.added}}async _tryStarter(e,t){const a=this._withStarter(e,t);if(!a){this._trying&&this._discardTry();return}await this._setPlacing(false),this._starterMessage=null,this._trying={id:e.id,mode:t,title:e.title,config:a.config},this._updatePreview()}_keepTry(){const e=this._trying;if(!e)return;clearTimeout(this._tryTimer);const t=Q.find(a=>a.id===e.id);this._trying=null,t&&this._insertStarter(t,e.mode)}_discardTry(){clearTimeout(this._tryTimer),this._trying=null,this._updatePreview()}_insertStarter(e,t){const a=this._withStarter(e,t);if(!a)return;const s=t==="scene"?Q.find(r=>r.id===e.scene):void 0,n=`${s?`${s.title}, then `:""}${e.title}: added ${Ji(a.added)}.`;this._starterMessage={starter:e.id,type:"success",text:`${n} Undo takes it out again.`},this._expandedObject=-1,this._selectedPoint=null,this._commit(a.config,{now:true,step:true})}_renderObjectsTab(){const e=this._objects;return p`
      ${Ln()}
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
      ${this._addingObject?this._renderTypePicker():w}
      ${e.length?e.map((t,a)=>this._renderObject(t,a,e.length)):p`<div class="empty">${this._system?"No objects in this system yet. Add a sphere for its star or a planet, or another type.":"No objects yet. Add a grid, a sphere or another type to draw something."}</div>`}
    `}_renderScopeBar(e){const t=this._system;if(!t)return w;const a=this._objectIdIn(O,this._scope),s=t.units?`in ${t.units}`:t.scale!==void 0?`scale ${t.scale}`:`in ${this._workingConfig.units??"scene units"}`;return p`
      <div class="scope-bar">
        <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
        <span>${e==="starters"?"Parts go into system":e==="points"?"Points of system":"Objects of system"} <b>${a}</b> (${s})</span>
        <ha-button appearance="plain" @click=${()=>this._openScope(O,{fly:true})}>
          <ha-icon icon="mdi:arrow-left" slot="start"></ha-icon>
          Back to the scene
        </ha-button>
      </div>`}_renderTypePicker(){const e=Ut.filter(t=>!(this._system&&t.type==="system"));return p`
      <lcards-form-section class="type-picker" header="Add an object" icon="mdi:shape-plus-outline" outlined ?expanded=${true}>
        ${An.map(t=>{const a=e.filter(s=>t.types.includes(s.type));return a.length?p`
            <lcards-form-section class="starter-group" data-type-group=${t.id} header=${t.header} icon=${t.icon} nested outlined expanded>
              <div class="starter-grid">${a.map(s=>p`
                <button class="starter-tile" data-type=${s.type} @click=${()=>this._addObject(s.type)}>
                  ${this._picture(xn(s.type),s.icon)}
                  <span class="starter-title">${s.type}</span>
                  <span class="starter-summary">${s.use}</span>
                </button>`)}
              </div>
            </lcards-form-section>`:w})}
        <div class="type-picker-actions">
          <ha-button appearance="plain" @click=${()=>{this._addingObject=false}}>Cancel</ha-button>
        </div>
      </lcards-form-section>
    `}async _addObject(e){var o,d,u;const t=wi(this._workingConfig);this._addingObject=false;const a=await((d=(o=this._previewCard)==null?void 0:o.studioScene)==null?void 0:d.call(o).catch(()=>null)),s=this._system?this._objectIdIn(O,this._scope):void 0,n={real:!!this._units};if(a!=null&&a.viewIn){const y=a.viewIn(s);n.scale=qa(y.distance);const h=(u=a.viewNow)==null?void 0:u.call(a).target;if(typeof h=="string"&&Ge(this._workingConfig,h)===this._scope)n.at=h;else{const m=10**Math.floor(Math.log10(y.distance*.001)),f=y.target.map(b=>Number((Math.round(b/m)*m).toPrecision(12)));f.some(b=>b!==0)&&(n.at=f)}}const r=this._objects;this._expandedObject=r.length;const l=Ja(e,t,this._pointIds,n);this._setObjects([...r,l]),e==="model"&&this._showModelWhenLoaded(String(l.id),String(l.src))}_renderObject(e,t,a){const s=Fa($a,e==null?void 0:e.type),n=Ut.find(d=>d.type===(e==null?void 0:e.type)),r=this._objectId(e,t),l=c(d=>{this._setObjects(this._objects.map((u,y)=>y===t?Qa(u,d):u)),(e==null?void 0:e.type)==="model"&&d.src&&d.src!==e.src&&d.id!==void 0&&this._showModelWhenLoaded(String(d.id),String(d.src))},"set"),o=this._expandedObject===t;return p`
      <lcards-form-section class="object" data-object=${t} header=${r}
        secondary=${[e==null?void 0:e.type,Ka(e)].filter(Boolean).join(" · ")}
        icon=${(n==null?void 0:n.icon)??"mdi:shape-outline"} outlined ?expanded=${o}
        @expanded-changed=${d=>{d.detail.expanded?this._selectObject(t):this._expandedObject===t&&this._selectObject(-1)}}>
        ${(e==null?void 0:e.type)==="system"&&!this._system?p`
          <ha-button slot="header-icons" size="s" class="open-system" data-action="open-system"
            title=${`Open the system: its ${it(e)}`}
            @click=${d=>{d.stopPropagation(),this._openScope(t,{fly:true})}}>
            <ha-icon icon="mdi:folder-open-outline" slot="start"></ha-icon>
            Open
          </ha-button>`:w}
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
          <lcards-message type="warning">Unknown type ${String(e==null?void 0:e.type)}: edit this object in the YAML tab.</lcards-message>`:w}
      </lcards-form-section>
    `}_renderObjectForm(e,t,a){const s={...t.common,...t.own},n=["id",...Object.keys(t.own),...Object.keys(t.common).filter(o=>o!=="id"&&!t.own[o])].filter(o=>s[o]&&!((e==null?void 0:e.type)==="system"&&(o==="points"||o==="objects"))),r=c(o=>o==="id"||(e==null?void 0:e.type)==="system"?"main":Ma(o,s[o]),"groupFor"),l=c(o=>p`
      <lcards-astro-schema-form .hass=${this.hass} .schema=${s} .keys=${o} .value=${e} .pointIds=${this._pointIds}
        .units=${this._units} .systemIds=${this._systemIds}
        @form-changed=${d=>{d.stopPropagation(),a({type:e.type,...d.detail.value})}}>
      </lcards-astro-schema-form>`,"form");return p`
      ${t.branch.description?p`<div class="hint">${t.branch.description}</div>`:w}
      ${za.map(o=>{const d=n.filter(y=>r(y)===o.id);if(!d.length)return w;if(o.id==="main"){if((e==null?void 0:e.type)==="volume"&&e.shape==="prism")return p`${l(d.filter(h=>h!=="outline"))}${this._renderOutline(e)}`;const y=(e==null?void 0:e.type)==="model"?Math.max(d.indexOf("size"),d.indexOf("file_units"))+1:0;return y>0?p`${l(d.slice(0,y))}${this._renderModelSize(e,a)}${d.length>y?l(d.slice(y)):w}`:p`${l(d)}${(e==null?void 0:e.type)==="system"?p`
            <div class="hint system-open">Holds ${it(e)}.</div>`:w}`}const u=Ya(e,d);return p`<lcards-form-section data-group=${o.id} header=${o.header} icon=${o.icon} secondary=${u?"follows an entity":""}
          nested outlined ?expanded=${u||o.id==="appearance"}>${l(d)}</lcards-form-section>`})}
    `}_renderOutline(e){var u,y;const t=Array.isArray(e.outline)?e.outline.map(h=>Array.isArray(h)?[Number(h[0])||0,Number(h[1])||0]:[0,0]):[],a=e.id===void 0?null:String(e.id),s=!!a&&((u=this._outlineEdit)==null?void 0:u.id)===a,n=s&&!!((y=this._outlineEdit)!=null&&y.draw),r=this._units?` (${this._units})`:"",l=c(h=>this._commitOutline(a,h,e),"put"),o=c((h,m,f)=>{const b=Number(f);Number.isFinite(b)&&l(t.map((g,_)=>_===h?m===0?[b,g[1]]:[g[0],b]:g))},"setAt"),d=c((h,m)=>{const f=[...t];[f[h],f[h+m]]=[f[h+m],f[h]],l(f)},"swap");return p`
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
        ${s?p`<div class="hint" data-outline-hint>${n?"Tap the ground for each corner in order, then tap the first corner (or Close outline) to finish. Shift: no snapping. Esc stops.":p`Drag a corner to move it (it snaps to ${D(this._outlineSnapValue(e,t))}${r}; Shift: no snapping). Tap a + to add a corner there; select a corner and press Delete to remove it. Esc or Done to finish.`}</div>`:w}
      </div>`}_outlineSnapValue(e,t,a){const s=this._objects.find(n=>(n==null?void 0:n.type)==="grid"&&Number(n.line_spacing)>0);if(s)return Number(s.line_spacing);if(t.length>=3){const n=t.map(l=>l[0]),r=t.map(l=>l[1]);return mt(Math.max(Math.max(...n)-Math.min(...n),Math.max(...r)-Math.min(...r))/20)}return mt((a??100)/50)}_commitOutline(e,t,a){const s=this._objects.map(n=>(e!==null?String(n==null?void 0:n.id)===e:n===a)?{...n,outline:t}:n);this._commit(_i(this._workingConfig,this._scope,"objects",s),{step:true})}async _startOutline(e,t){var o,d,u,y;const a=await((d=(o=this._previewCard)==null?void 0:o.studioScene)==null?void 0:d.call(o).catch(()=>null));if(!(a!=null&&a.editOutline)||e.id===void 0)return;const s=String(e.id),n=Vt(e.outline)??[],r=this._system?this._objectIdIn(O,this._scope):void 0,l=this._outlineSnapValue(e,t?[]:n,(y=(u=a.viewIn)==null?void 0:u.call(a,r))==null?void 0:y.width);this._outlineEdit={id:s,draw:t},a.editOutline(s,{snap:l,draw:t,outline:n,onChange:c((h,m)=>{var f;m&&(this._commitOutline(s,h),(f=this._outlineEdit)!=null&&f.draw&&(this._outlineEdit={id:s,draw:false}))},"onChange"),onExit:c(()=>this._endOutline(),"onExit")})}async _finishDraw(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t).catch(()=>null));e!=null&&e.finishOutline&&!e.finishOutline()&&(this._status="An outline needs at least 3 corners.")}async _outlineSync(e){var r,l,o,d;const t=this._outlineEdit,a=await((l=(r=this._previewCard)==null?void 0:r.studioScene)==null?void 0:l.call(r).catch(()=>null));if(!(a!=null&&a.editOutline)||!t||t.draw)return;const s=Vt(e.outline)??[],n=this._system?this._objectIdIn(O,this._scope):void 0;a.editOutline(t.id,{snap:this._outlineSnapValue(e,s,(d=(o=a.viewIn)==null?void 0:o.call(a,n))==null?void 0:d.width),draw:false,outline:s,onChange:c((u,y)=>{y&&this._commitOutline(t.id,u)},"onChange"),onExit:c(()=>this._endOutline(),"onExit")})}async _endOutline(){var t,a,s;this._outlineEdit=null;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t).catch(()=>null));(s=e==null?void 0:e.editOutline)==null||s.call(e,null)}_renderModelSize(e,t){const a=String(e.src??""),s=this._modelExtents[a]??null;!s&&a&&e.id!==void 0&&this._readModelExtent(String(e.id),a);const n=this._units,r=kn(e,s,n),{size:l,...o}=e;return p`
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
      </div>`}async _showObject(e){var a,s;const t=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a).catch(()=>null));await(t==null?void 0:t.frameObject(e))}async _showModelWhenLoaded(e,t){await this._whenModelLoaded(e,t)&&await this._showObject(e)}async _whenModelLoaded(e,t){var s,n,r,l;const a=Date.now()+nr;for(;this.isConnected&&Date.now()<a;){const o=await((n=(s=this._previewCard)==null?void 0:s.studioScene)==null?void 0:n.call(s).catch(()=>null)),d=(r=o==null?void 0:o.modelState)==null?void 0:r.call(o,e);if((d==null?void 0:d.src)===t&&d.state==="failed")return null;const u=(d==null?void 0:d.src)===t&&d.state==="ready"?(l=o==null?void 0:o.modelInfo)==null?void 0:l.call(o,e):null;if(u)return u;await new Promise(y=>setTimeout(y,250))}return null}async _readModelExtent(e,t){if(!this._extentPending.has(t)){this._extentPending.add(t);try{const a=await this._whenModelLoaded(e,t);a&&(this._modelExtents={...this._modelExtents,[t]:a.extent})}finally{this._extentPending.delete(t)}}}async _fitModelToView(e,t){var n,r;const a=await((r=(n=this._previewCard)==null?void 0:n.studioScene)==null?void 0:r.call(n).catch(()=>null));if(!(a!=null&&a.viewIn))return;const s=this._system?this._objectIdIn(O,this._scope):void 0;t({...e,size:$n(a.viewIn(s).width)})}_moveObject(e,t){const a=[...this._objects],s=e+t;s<0||s>=a.length||([a[e],a[s]]=[a[s],a[e]],this._expandedObject=s,this._setObjects(a))}_duplicateObject(e){const t=this._objects,a=t[e],s=wi(this._workingConfig),n={...le(a),id:rt(`${(a==null?void 0:a.id)??(a==null?void 0:a.type)}_`,s)};this._expandedObject=e+1,this._setObjects([...t.slice(0,e+1),n,...t.slice(e+1)])}async _deleteObject(e){const t=this._objects[e];await Bt({title:"Delete object",message:(t==null?void 0:t.type)==="system"?`Delete ${this._objectId(t,e)} with its ${it(t)}?`:`Delete ${this._objectId(t,e)}? Points standing on it lose their surface.`})&&(this._expandedObject===e&&(this._expandedObject=-1),this._setObjects(this._objects.filter((s,n)=>n!==e)))}async _home(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t));this._quickView=-1,e==null||e.home()}async _press(e){var a,s;const t=await((s=(a=this._previewCard)==null?void 0:a.studioScene)==null?void 0:s.call(a));t==null||t.press(e)}async _release(){var t,a;const e=await((a=(t=this._previewCard)==null?void 0:t.studioScene)==null?void 0:a.call(t));e==null||e.release()}_onTab(e){var a;const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t&&(this._activeTab=t)}_onDialogClosed(e){e.stopPropagation(),e.target===e.currentTarget&&this._close()}_save(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:le(this._workingConfig)}})),this._close()}_close(){this.dispatchEvent(new CustomEvent("closed"))}};c(Pt,"LCARdSAstrometricsStudioDialog");let _t=Pt;customElements.get("lcards-astrometrics-studio-dialog")||customElements.define("lcards-astrometrics-studio-dialog",_t);const zt=class zt2 extends fa{constructor(){super(),this.cardType="astrometrics",this._studio=null,ma().then(()=>this.requestUpdate())}updated(e){super.updated(e),e.has("hass")&&this._studio&&(this._studio.hass=this.hass)}_getTabDefinitions(){return[{label:"Configuration",content:c(()=>this._renderConfigurationTab(),"content")},...this._getUtilityTabs()]}_renderConfigurationTab(){var n;const e=this.config??{},t=Array.isArray(e.points)?e.points.length:0,a=Array.isArray(e.objects)?e.objects.length:0,s=Object.keys(((n=e.camera)==null?void 0:n.views)??{});return p`
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
                    <ha-button appearance="plain" @click=${()=>window.open($t(Ri.astrometricsStudio),"_blank","noopener")}>
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
                ${C.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}
                ${C.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
            </lcards-form-section>

            <lcards-form-section
                header="Sizing"
                description="The scene fills the card"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">
                <div class="astro-pair">
                    ${C.renderField(this,"height",{label:"Height"})}
                    ${C.renderField(this,"width",{label:"Width"})}
                    ${C.renderField(this,"min_height")}
                    ${C.renderField(this,"max_height")}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `}_openStudio(){const e=document.createElement("lcards-astrometrics-studio-dialog");e.hass=this.hass,e.config=JSON.parse(JSON.stringify(this.config||{})),this._studio=e,e.addEventListener("config-changed",t=>{this.config=t.detail.config,this._isUpdatingYaml=true,this._yamlValue=Di(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false}),at(this,"config-changed",{config:this.config}),this.requestUpdate()}),e.addEventListener("closed",()=>{e.remove(),this._studio===e&&(this._studio=null)}),Mi(e,this)}static get styles(){return[...super.styles,ae`
                .astro-stats { display: flex; gap: var(--ha-space-4); margin: var(--ha-space-2) 0 var(--ha-space-1); font-size: 13px; color: var(--primary-text-color); }
                .astro-stats b { color: var(--lcars-ui-primary, var(--primary-color)); }
                .astro-pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-2); }
            `]}};c(zt,"LCARdSAstrometricsEditor");let wt=zt;customElements.get("lcards-astrometrics-editor")||customElements.define("lcards-astrometrics-editor",wt);export{wt as LCARdSAstrometricsEditor};
//# sourceMappingURL=lcards-astrometrics-editor-CMLIZz4c.js.map
