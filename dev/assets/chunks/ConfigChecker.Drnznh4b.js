const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chunks/config-checker-core._caJArOr.js","assets/chunks/js-yaml.DZMzVv2G.js","assets/chunks/theme.90cI75yW.js","assets/chunks/framework.DIp0zHSV.js","assets/app.CG7JUn2_.js","assets/chunks/template-string.D_XUSOOq.js","assets/chunks/chart-config-migration.Dw7isKf4.js","assets/chunks/data-grid-config-migration.K4Wc_XKH.js","assets/chunks/card-plumbing.dMbN4Pvq.js","assets/chunks/names.DfH8Z1bZ.js","assets/chunks/card-schemas.DMbsgf7z.js","assets/chunks/button-schema.C1Jdv1SV.js","assets/chunks/slider-schema.B4pWFF5d.js","assets/chunks/elbow-schema.mg6VMNS3.js","assets/chunks/chart-schema.DQq4w-ZG.js","assets/chunks/data-grid-schema.DtTUx5D_.js","assets/chunks/lcards-alert-overlay-schema.BUwByZNP.js","assets/chunks/select-menu-schema.j9cI-Dbz.js","assets/chunks/schema-options.MJIS-y85.js","assets/chunks/reduced-motion.CR8xNM6Y.js"])))=>i.map(i=>d[i]);
import{_ as I,q as M,v as N,V as T,g as x,o,c as n,j as s,k as d,E as O,F as h,B as C,t as r,e as u,a as m,n as V,p as v,h as A}from"./framework.DIp0zHSV.js";import{R as j}from"./theme.90cI75yW.js";const f=`type: custom:lcards-button
entity: light.kitchen
preset: lozenge-rigth
text:
  label:
    content: Kitchen Lights
    colour: white
style:
  card:
    color:
      background:
        active: colors.alert.red
        inactive: theme:colors.status.sucess
animations:
  - trigger: on_tap
    preset: pulsee
tap_action:
  action: toggle
`,k=`type: custom:lcards-button
entity: light.kitchen
preset: lozenge-right
text:
  label:
    content: Kitchen Lights
    color: white
style:
  card:
    color:
      background:
        active: theme:colors.alert.red
        inactive: theme:colors.status.success
animations:
  - trigger: on_tap
    preset: pulse
tap_action:
  action: toggle
`,F=[{path:"preset",fix:"A typo in the preset name."},{path:"text.label.colour",fix:"Option names use American spelling: color."},{path:"style.card.color.background.active",fix:"Theme colours need the theme: prefix."},{path:"style.card.color.background.inactive",fix:"A typo in the theme colour name."},{path:"animations[0].preset",fix:"A typo in the animation name."}],D={class:"cc"},z={class:"cc-toolbar"},K=["disabled"],W=["disabled"],X=["open"],Y={class:"cc-results","aria-live":"polite","data-testid":"checker-results"},q={key:0,class:"cc-summary cc-bad"},U={key:1,class:"cc-summary"},G={key:2,class:"cc-summary"},H={key:0,class:"cc-summary cc-bad"},J={key:1,class:"cc-summary cc-bad"},Q={class:"cc-card-head"},Z={key:0,class:"cc-dim"},ee={key:1,class:"cc-dim"},te=["href"],se={class:"cc-issues"},ae={class:"cc-where"},oe={key:0,class:"cc-dim"},ne={class:"cc-msg"},le=["href"],ce={key:0,class:"cc-note"},re={__name:"ConfigChecker",setup(ue){const i=v(""),y=v(null),b=v([]),w=v(""),c=v(null),$=A(()=>i.value===f),B=A(()=>{var t,l;const a=(t=/^type:\s*["']?custom:([\w-]+)/m.exec(i.value))==null?void 0:t[1];return(i.value.match(/^\s*-?\s*type:\s*["']?custom:/gm)??[]).length===1?((l=b.value.find(p=>p.tag===a))==null?void 0:l.schema)??null:null}),P=(()=>{const a=f.split(`
`),e=k.split(`
`);return a.map((l,p)=>{var g;return{before:l.trim(),after:(g=e[p])==null?void 0:g.trim()}}).filter(l=>l.before!==l.after).map((l,p)=>{var g;return{...l,why:((g=F[p])==null?void 0:g.fix)??""}})})(),_=(a,e)=>`${a} ${e}${a===1?"":"s"}`,R=A(()=>{const a=c.value,e=[a.errors&&_(a.errors,"error"),a.warnings&&_(a.warnings,"warning")].filter(Boolean),t=a.cards.filter(l=>l.issues.length).length;return`${e.join(" and ")} in ${_(t,"card")}${a.cards.length>t?` (${a.cards.length-t} more look fine)`:""}.`});function E(a){i.value=a}let S=null;function L(){y.value&&(c.value=i.value.trim()?y.value.check(i.value):null)}return M(i,()=>{clearTimeout(S),S=setTimeout(L,300)}),N(async()=>{globalThis.__LCARDS_VERSION__??(globalThis.__LCARDS_VERSION__="docs");try{const[a,e,t]=await Promise.all([T(()=>import("./config-checker-core._caJArOr.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9])),T(()=>import("./card-schemas.DMbsgf7z.js"),__vite__mapDeps([10,11,2,3,12,13,14,15,16,17,9,18,8,19])),fetch(x("/schema/registries.json")).then(l=>l.ok?l.json():null).catch(()=>null)]);b.value=e.getSchemaEntries(),y.value=a.createChecker({entries:b.value,registries:t}),L()}catch(a){w.value=(a==null?void 0:a.message)??String(a)}}),(a,e)=>(o(),n("div",D,[s("div",z,[s("button",{type:"button",class:"cc-btn cc-btn-brand",onClick:e[0]||(e[0]=t=>E(d(f)))},"Try a broken example"),s("button",{type:"button",class:"cc-btn",disabled:!$.value,onClick:e[1]||(e[1]=t=>E(d(k)))},"Fix it",8,K),s("button",{type:"button",class:"cc-btn",disabled:!i.value,onClick:e[2]||(e[2]=t=>E(""))},"Clear",8,W)]),O(j,{modelValue:i.value,"onUpdate:modelValue":e[3]||(e[3]=t=>i.value=t),schema:B.value},null,8,["modelValue","schema"]),i.value===d(f)||i.value===d(k)?(o(),n("details",{key:0,class:"cc-pair",open:i.value===d(k)},[e[5]||(e[5]=s("summary",null,"What was wrong with the example",-1)),s("table",null,[e[4]||(e[4]=s("thead",null,[s("tr",null,[s("th",null,"Before"),s("th",null,"After"),s("th",null,"Why")])],-1)),s("tbody",null,[(o(!0),n(h,null,C(d(P),t=>(o(),n("tr",{key:t.before},[s("td",null,[s("code",null,r(t.before),1)]),s("td",null,[s("code",null,r(t.after),1)]),s("td",null,r(t.why),1)]))),128))])])],8,X)):u("",!0),s("div",Y,[w.value?(o(),n("p",q,"The checker could not load: "+r(w.value),1)):y.value?i.value.trim()?c.value?(o(),n(h,{key:3},[c.value.parseError?(o(),n("p",H,[e[6]||(e[6]=s("span",{class:"cc-badge cc-error"},"YAML",-1)),e[7]||(e[7]=m(" This isn't valid YAML",-1)),c.value.parseError.line?(o(),n(h,{key:0},[m(" (line "+r(c.value.parseError.line)+")",1)],64)):u("",!0),m(": "+r(c.value.parseError.message)+". Check the indentation (spaces, not tabs) and that every ",1),e[8]||(e[8]=s("code",null,"key:",-1)),e[9]||(e[9]=m(" has a space after the colon. ",-1))])):c.value.cards.length?(o(),n(h,{key:2},[s("p",{class:V(["cc-summary",c.value.errors?"cc-bad":c.value.warnings?"cc-warn":"cc-good"]),"data-testid":"checker-summary"},[!c.value.errors&&!c.value.warnings?(o(),n(h,{key:0},[m("All clear: no problems found in "+r(_(c.value.cards.length,"LCARdS card"))+".",1)],64)):(o(),n(h,{key:1},[m(r(R.value),1)],64))],2),(o(!0),n(h,null,C(c.value.cards.filter(t=>t.issues.length),t=>(o(),n("div",{key:t.path,class:"cc-card"},[s("div",Q,[s("code",null,r(t.tag),1),t.path!=="(root)"?(o(),n("span",Z,"at "+r(t.path),1)):u("",!0),t.line?(o(),n("span",ee,"line "+r(t.line),1)):u("",!0),t.docs?(o(),n("a",{key:2,href:d(x)(t.docs),class:"cc-docs"},"card docs",8,te)):u("",!0)]),s("ul",se,[(o(!0),n(h,null,C(t.issues,(l,p)=>(o(),n("li",{key:p,class:"cc-issue"},[s("span",{class:V(["cc-badge",l.severity==="error"?"cc-error":"cc-warning"])},r(l.severity),3),s("span",ae,[s("code",null,r(l.path),1),l.line?(o(),n("span",oe," line "+r(l.line),1)):u("",!0)]),s("span",ne,r(l.message),1),l.docs?(o(),n("a",{key:0,href:d(x)(l.docs),class:"cc-docs"},"docs",8,le)):u("",!0)]))),128))])]))),128)),c.value.warnings?(o(),n("p",ce," Warnings are names LCARdS doesn't know, almost always a typo: use the suggested name. ")):u("",!0)],64)):(o(),n("p",J,[...e[10]||(e[10]=[m(" No LCARdS cards found. Each card needs a ",-1),s("code",null,"type: custom:lcards-...",-1),m(" line. ",-1)])]))],64)):u("",!0):(o(),n("p",G,"Paste a card, a view or a whole dashboard above. It is checked as you type.")):(o(),n("p",U,"Loading the checker..."))])]))}},ie=I(re,[["__scopeId","data-v-f41f961f"]]),me=Object.freeze(Object.defineProperty({__proto__:null,default:ie},Symbol.toStringTag,{value:"Module"}));export{f as B,me as C,k as F,F as S};
