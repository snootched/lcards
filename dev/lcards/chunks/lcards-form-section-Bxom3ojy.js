var Le=Object.defineProperty;var l=(a,e)=>Le(a,"name",{value:e,configurable:true});import{a7 as h,bm as Fe,bn as oe,bo as S,bp as Oe,i as Ce,a as we,Q as Be,A as b,b as c,aL as ie,M as Ve,bq as He,x as Ie,J as Re}from"./lcards-main-BW4hZuuz.js";const f=l((a,e=0,t=1)=>a>t?t:a<e?e:a,"clamp"),u=l((a,e=0,t=Math.pow(10,e))=>Math.round(t*a)/t,"round"),ze=l(a=>Ue(V(a)),"hexToHsva"),V=l(a=>(a[0]==="#"&&(a=a.substring(1)),a.length<6?{r:parseInt(a[0]+a[0],16),g:parseInt(a[1]+a[1],16),b:parseInt(a[2]+a[2],16),a:a.length===4?u(parseInt(a[3]+a[3],16)/255,2):1}:{r:parseInt(a.substring(0,2),16),g:parseInt(a.substring(2,4),16),b:parseInt(a.substring(4,6),16),a:a.length===8?u(parseInt(a.substring(6,8),16)/255,2):1}),"hexToRgba"),We=l(a=>De(qe(a)),"hsvaToHex"),ke=l(({h:a,s:e,v:t,a:r})=>{const s=(200-e)*t/100;return{h:u(a),s:u(s>0&&s<200?e*t/100/(s<=100?s:200-s)*100:0),l:u(s/2),a:u(r,2)}},"hsvaToHsla"),H=l(a=>{const{h:e,s:t,l:r}=ke(a);return`hsl(${e}, ${t}%, ${r}%)`},"hsvaToHslString"),T=l(a=>{const{h:e,s:t,l:r,a:s}=ke(a);return`hsla(${e}, ${t}%, ${r}%, ${s})`},"hsvaToHslaString"),qe=l(({h:a,s:e,v:t,a:r})=>{a=a/360*6,e=e/100,t=t/100;const s=Math.floor(a),o=t*(1-e),i=t*(1-(a-s)*e),n=t*(1-(1-a+s)*e),d=s%6;return{r:u([t,i,o,o,n,t][d]*255),g:u([n,t,t,i,o,o][d]*255),b:u([o,o,n,t,t,i][d]*255),a:u(r,2)}},"hsvaToRgba"),w=l(a=>{const e=a.toString(16);return e.length<2?"0"+e:e},"format"),De=l(({r:a,g:e,b:t,a:r})=>{const s=r<1?w(u(r*255)):"";return"#"+w(a)+w(e)+w(t)+s},"rgbaToHex"),Ue=l(({r:a,g:e,b:t,a:r})=>{const s=Math.max(a,e,t),o=s-Math.min(a,e,t),i=o?s===a?(e-t)/o:s===e?2+(t-a)/o:4+(a-e)/o:0;return{h:u(60*(i<0?i+6:i)),s:u(s?o/s*100:0),v:u(s/255*100),a:r}},"rgbaToHsva"),$e=l((a,e)=>{if(a===e)return true;for(const t in a)if(a[t]!==e[t])return false;return true},"equalColorObjects"),Ge=l((a,e)=>a.toLowerCase()===e.toLowerCase()?true:$e(V(a),V(e)),"equalHex"),le={},j=l(a=>{let e=le[a];return e||(e=document.createElement("template"),e.innerHTML=a,le[a]=e),e},"tpl"),Y=l((a,e,t)=>{a.dispatchEvent(new CustomEvent(e,{bubbles:true,detail:t}))},"fire");let v=false;const I=l(a=>"touches"in a,"isTouch"),Ne=l(a=>v&&!I(a)?false:(v||(v=I(a)),true),"isValid"),ne=l((a,e)=>{const t=I(e)?e.touches[0]:e,r=a.el.getBoundingClientRect();Y(a.el,"move",a.getMove({x:f((t.pageX-(r.left+window.pageXOffset))/r.width),y:f((t.pageY-(r.top+window.pageYOffset))/r.height)}))},"pointerMove"),je=l((a,e)=>{const t=e.keyCode;t>40||a.xy&&t<37||t<33||(e.preventDefault(),Y(a.el,"move",a.getMove({x:t===39?.01:t===37?-.01:t===34?.05:t===33?-.05:t===35?1:t===36?-1:0,y:t===40?.01:t===38?-.01:0},true)))},"keyMove"),K=class K2{constructor(e,t,r,s){const o=j(`<div role="slider" tabindex="0" part="${t}" ${r}><div part="${t}-pointer"></div></div>`);e.appendChild(o.content.cloneNode(true));const i=e.querySelector(`[part=${t}]`);i.addEventListener("mousedown",this),i.addEventListener("touchstart",this),i.addEventListener("keydown",this),this.el=i,this.xy=s,this.nodes=[i.firstChild,i]}set dragging(e){const t=e?document.addEventListener:document.removeEventListener;t(v?"touchmove":"mousemove",this),t(v?"touchend":"mouseup",this)}handleEvent(e){switch(e.type){case"mousedown":case"touchstart":if(e.preventDefault(),!Ne(e)||!v&&e.button!=0)return;this.el.focus(),ne(this,e),this.dragging=true;break;case"mousemove":case"touchmove":e.preventDefault(),ne(this,e);break;case"mouseup":case"touchend":this.dragging=false;break;case"keydown":je(this,e);break}}style(e){e.forEach((t,r)=>{for(const s in t)this.nodes[r].style.setProperty(s,t[s])})}};l(K,"Slider");let C=K;const X=class X2 extends C{constructor(e){super(e,"hue",'aria-label="Hue" aria-valuemin="0" aria-valuemax="360"',false)}update({h:e}){this.h=e,this.style([{left:`${e/360*100}%`,color:H({h:e,s:100,v:100,a:1})}]),this.el.setAttribute("aria-valuenow",`${u(e)}`)}getMove(e,t){return{h:t?f(this.h+e.x*360,0,360):360*e.x}}};l(X,"Hue");let R=X;const J=class J2 extends C{constructor(e){super(e,"saturation",'aria-label="Color"',true)}update(e){this.hsva=e,this.style([{top:`${100-e.v}%`,left:`${e.s}%`,color:H(e)},{"background-color":H({h:e.h,s:100,v:100,a:1})}]),this.el.setAttribute("aria-valuetext",`Saturation ${u(e.s)}%, Brightness ${u(e.v)}%`)}getMove(e,t){return{s:t?f(this.hsva.s+e.x*100,0,100):e.x*100,v:t?f(this.hsva.v-e.y*100,0,100):Math.round(100-e.y*100)}}};l(J,"Saturation");let z=J;const Ye=':host{display:flex;flex-direction:column;position:relative;width:200px;height:200px;user-select:none;-webkit-user-select:none;cursor:default}:host([hidden]){display:none!important}[role=slider]{position:relative;touch-action:none;user-select:none;-webkit-user-select:none;outline:0}[role=slider]:last-child{border-radius:0 0 8px 8px}[part$=pointer]{position:absolute;z-index:1;box-sizing:border-box;width:28px;height:28px;display:flex;place-content:center center;transform:translate(-50%,-50%);background-color:#fff;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.2)}[part$=pointer]::after{content:"";width:100%;height:100%;border-radius:inherit;background-color:currentColor}[role=slider]:focus [part$=pointer]{transform:translate(-50%,-50%) scale(1.1)}',Ze="[part=hue]{flex:0 0 24px;background:linear-gradient(to right,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%)}[part=hue-pointer]{top:50%;z-index:2}",Ke="[part=saturation]{flex-grow:1;border-color:transparent;border-bottom:12px solid #000;border-radius:8px 8px 0 0;background-image:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,rgba(255,255,255,0));box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}[part=saturation-pointer]{z-index:3}",k=Symbol("same"),P=Symbol("color"),ce=Symbol("hsva"),E=Symbol("update"),de=Symbol("parts"),M=Symbol("css"),A=Symbol("sliders"),Q=class Q2 extends HTMLElement{static get observedAttributes(){return["color"]}get[M](){return[Ye,Ze,Ke]}get[A](){return[z,R]}get color(){return this[P]}set color(e){if(!this[k](e)){const t=this.colorModel.toHsva(e);this[E](t),this[P]=e}}constructor(){super();const e=j(`<style>${this[M].join("")}</style>`),t=this.attachShadow({mode:"open"});t.appendChild(e.content.cloneNode(true)),t.addEventListener("move",this),this[de]=this[A].map(r=>new r(t))}connectedCallback(){if(this.hasOwnProperty("color")){const e=this.color;delete this.color,this.color=e}else this.color||(this.color=this.colorModel.defaultColor)}attributeChangedCallback(e,t,r){const s=this.colorModel.fromAttr(r);this[k](s)||(this.color=s)}handleEvent(e){const t=this[ce],r={...t,...e.detail};this[E](r);let s;!$e(r,t)&&!this[k](s=this.colorModel.fromHsva(r))&&(this[P]=s,Y(this,"color-changed",{value:s}))}[k](e){return this.color&&this.colorModel.equal(e,this.color)}[E](e){this[ce]=e,this[de].forEach(t=>t.update(e))}};l(Q,"ColorPicker");let W=Q;const ee=class ee2 extends C{constructor(e){super(e,"alpha",'aria-label="Alpha" aria-valuemin="0" aria-valuemax="1"',false)}update(e){this.hsva=e;const t=T({...e,a:0}),r=T({...e,a:1}),s=e.a*100;this.style([{left:`${s}%`,color:T(e)},{"--gradient":`linear-gradient(90deg, ${t}, ${r}`}]);const o=u(s);this.el.setAttribute("aria-valuenow",`${o}`),this.el.setAttribute("aria-valuetext",`${o}%`)}getMove(e,t){return{a:t?f(this.hsva.a+e.x):e.x}}};l(ee,"Alpha");let q=ee;const Xe=`[part=alpha]{flex:0 0 24px}[part=alpha]::after{display:block;content:"";position:absolute;top:0;left:0;right:0;bottom:0;border-radius:inherit;background-image:var(--gradient);box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}[part^=alpha]{background-color:#fff;background-image:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill-opacity=".05"><rect x="8" width="8" height="8"/><rect y="8" width="8" height="8"/></svg>')}[part=alpha-pointer]{top:50%}`,te=class te2 extends W{get[M](){return[...super[M],Xe]}get[A](){return[...super[A],q]}};l(te,"AlphaColorPicker");let D=te;const Je={defaultColor:"#0001",toHsva:ze,fromHsva:We,equal:Ge,fromAttr:l(a=>a,"fromAttr")},re=class re2 extends D{get colorModel(){return Je}};l(re,"HexAlphaBase");let U=re;const Qe=/^#?([0-9A-F]{3,8})$/i,L=l((a,e)=>{const t=Qe.exec(a),r=t?t[1].length:0;return r===3||r===6||!!e&&r===4||!!e&&r===8},"validHex"),et=j('<slot><input part="input" spellcheck="false"></slot>'),he=l((a,e)=>a.replace(/([^0-9A-F]+)/gi,"").substring(0,e?8:6),"escape"),ue=Symbol("alpha"),$=Symbol("color"),pe=Symbol("saved"),F=Symbol("input"),O=Symbol("init"),ge=Symbol("prefix"),_=Symbol("update"),ae=class ae2 extends HTMLElement{static get observedAttributes(){return["alpha","color","prefixed"]}get color(){return this[$]}set color(e){this[$]=e,this[_](e)}get alpha(){return this[ue]}set alpha(e){this[ue]=e,this.toggleAttribute("alpha",e);const t=this.color;t&&!L(t,e)&&(this.color=t.startsWith("#")?t.substring(0,t.length===5?4:7):t.substring(0,t.length===4?3:6))}get prefixed(){return this[ge]}set prefixed(e){this[ge]=e,this.toggleAttribute("prefixed",e),this[_](this.color)}constructor(){super();const e=this.attachShadow({mode:"open"});e.appendChild(et.content.cloneNode(true)),e.firstElementChild.addEventListener("slotchange",()=>this[O](e))}connectedCallback(){if(this[O](this.shadowRoot),this.hasOwnProperty("alpha")){const e=this.alpha;delete this.alpha,this.alpha=e}else this.alpha=this.hasAttribute("alpha");if(this.hasOwnProperty("prefixed")){const e=this.prefixed;delete this.prefixed,this.prefixed=e}else this.prefixed=this.hasAttribute("prefixed");if(this.hasOwnProperty("color")){const e=this.color;delete this.color,this.color=e}else this.color==null?this.color=this.getAttribute("color")||"":this[$]&&this[_](this[$])}handleEvent(e){const t=e.target,{value:r}=t;switch(e.type){case"input":const s=he(r,this.alpha);this[pe]=this.color,(L(s,this.alpha)||r==="")&&(this.color=s,this.dispatchEvent(new CustomEvent("color-changed",{bubbles:true,detail:{value:s?"#"+s:""}})));break;case"blur":r&&!L(r,this.alpha)&&(this.color=this[pe])}}attributeChangedCallback(e,t,r){e==="color"&&this.color!==r&&(this.color=r);const s=r!=null;e==="alpha"&&this.alpha!==s&&(this.alpha=s),e==="prefixed"&&this.prefixed!==s&&(this.prefixed=s)}[O](e){let t=this.querySelector("input");if(!t){let r;for(;r=this.firstChild;)r.remove();t=e.querySelector("input")}t.addEventListener("input",this),t.addEventListener("blur",this),this[F]=t,this[_](this.color)}[_](e){this[F]&&(this[F].value=e==null||e==""?"":(this.prefixed?"#":"")+he(e,this.alpha))}};l(ae,"HexInputBase");let G=ae;const x=["red","orange","yellow","green","teal","blue","purple","pink","gray"],B={red:"Red",orange:"Orange",yellow:"Yellow",green:"Green",teal:"Teal/Cyan",blue:"Blue",purple:"Purple",pink:"Pink/Magenta",gray:"Gray/B&W"},Me=22,Z=[["red",345,15],["orange",15,45],["yellow",45,70],["green",70,160],["teal",160,195],["blue",195,255],["purple",255,290],["pink",290,345]];function Ae(a){const e=(a%360+360)%360,t=Z.find(([,r,s])=>r>s?e>=r||e<s:e>=r&&e<s);return t?t[0]:"pink"}l(Ae,"bucketHue");const tt=70,rt=55;function be(a){const e=h.hslToRgb(a,tt,rt),t=parseInt(e.slice(1,3),16),r=parseInt(e.slice(3,5),16),s=parseInt(e.slice(5,7),16);return{hex:e,rgba:`rgba(${t}, ${r}, ${s}, 1)`}}l(be,"swatchColorAt");const Se=Object.fromEntries(Z.map(([a,e,t])=>{const r=be(e),s=be(t);return[a,`${e}°-${t}°
${r.hex} - ${s.hex}
${r.rgba} - ${s.rgba}`]}));Se.gray=`Low saturation (<22%)
e.g. #999999
e.g. rgba(153, 153, 153, 1)`;const Te=Object.fromEntries(Z.map(([a,e,t])=>{const r=e>t?t+360-e:t-e,s=(e+r/2)%360;return[a,`hsl(${Math.round(s)}, 70%, 55%)`]}));Te.gray="hsl(0, 0%, 60%)";function Pe(a){if(!a||typeof a!="string")return null;const e=a.includes("var(")?h.resolveCssVariable(a):a,t=h.parseColor(e);return t?h.rgbToHsl(t[0],t[1],t[2]):null}l(Pe,"toHsl");function me(a){const e=Pe(a);if(!e)return null;const[t,r]=e;return r<Me?"gray":Ae(t)}l(me,"getColorFamily");function at(a){const e=Pe(a);if(!e)return null;const[t,r,s]=e;return{family:r<Me?"gray":Ae(t),hue:t,lightness:s}}l(at,"getColorSortKey");function wt(a,e){if(!a&&!e)return 0;if(!a)return 1;if(!e)return-1;const t=x.indexOf(a.family)-x.indexOf(e.family);return t!==0?t:a.hue!==e.hue?a.hue-e.hue:a.lightness-e.lightness}l(wt,"compareColorSortKeys");function st(a){return a.startsWith("--card-mod-")?"card-mod":a.startsWith("--lcars-")?"lcars":a.startsWith("--lcards-")?"lcards":a.startsWith("--cblcars-")?"lcars":a.startsWith("--mdc-")||a.startsWith("--md-")?"material":a.startsWith("--wa-")?"wa":a.startsWith("--ha-color-")?"ha-color":a.startsWith("--ha-space-")?"ha-space":a.startsWith("--ha-border-radius-")||a.startsWith("--ha-border-width-")?"ha-shape":a.startsWith("--ha-animation-")?"ha-motion":a.startsWith("--ha-font-")||a.startsWith("--ha-line-height-")?"ha-type":a.startsWith("--ha-box-shadow-")?"ha-elevation":a.startsWith("--ha-")?"ha-system":a.startsWith("--state-")?"states":a.startsWith("--primary-")||a.startsWith("--secondary-")||a.startsWith("--accent-")||a.startsWith("--card-")||a.startsWith("--divider-")||a.startsWith("--text-")||a.startsWith("--disabled-")||a.startsWith("--sidebar-")?"ha-legacy":a.startsWith("--app-")?"app":"other"}l(st,"getCssVarCategory");const ot=["lcars-african-violet","lcars-alert-blue","lcars-alert-red","lcars-alert-uv","lcars-alert-uvc","lcars-alert-white","lcars-alert-yellow","lcars-almond","lcars-almond-creme","lcars-alt-blue","lcars-alt-dark-gray","lcars-alt-green","lcars-alt-orange","lcars-amber","lcars-antique-gold","lcars-apricot","lcars-aqua","lcars-beige","lcars-black","lcars-black-cherry","lcars-blue","lcars-bluey","lcars-brick-red","lcars-butter","lcars-butterscotch","lcars-cardassia-maroon","lcars-cardinal","lcars-cerulean","lcars-charcoal","lcars-cool","lcars-coral","lcars-cornflower","lcars-crimson","lcars-cyan","lcars-dark-blue","lcars-dark-gray","lcars-darkpumpkin","lcars-dark-red","lcars-deep-maroon","lcars-deep-navy","lcars-dunkelgrau","lcars-eggplant","lcars-emerald","lcars-error","lcars-evening","lcars-feuerrot","lcars-galaxy","lcars-ghost","lcars-ghost-gray","lcars-gold","lcars-graphite","lcars-gray","lcars-green","lcars-green-footer","lcars-green-middle","lcars-green-primary","lcars-green-secondary","lcars-green-tertiary","lcars-harvestgold","lcars-hellgrau","lcars-honey","lcars-ice","lcars-khaki","lcars-khaki-dark","lcars-khaki-light","lcars-lavender","lcars-lavender-mist","lcars-lavender-rose","lcars-lemon","lcars-light-gray","lcars-light-orange","lcars-lilac","lcars-lilac-light","lcars-lime","lcars-magenta","lcars-mahogany","lcars-mango","lcars-maroon","lcars-mars","lcars-martian","lcars-mauve","lcars-medium-dark-blue","lcars-medium-dark-gray","lcars-medium-gray","lcars-midnight","lcars-midnight-blue","lcars-mint","lcars-mittelgrau","lcars-modern-light-gray","lcars-moonbeam","lcars-moonshine","lcars-muted-coral","lcars-navy-gray","lcars-october-sunset","lcars-olive","lcars-orange","lcars-orchid","lcars-orchid-light","lcars-pale-orange","lcars-peach","lcars-peach-cream","lcars-peach-light","lcars-pearl","lcars-periwinkle","lcars-periwinkle-light","lcars-plum","lcars-plum-medium","lcars-powder-blue","lcars-primary-gray","lcars-pumpkinshade","lcars-red","lcars-roseblush","lcars-ruby","lcars-sage","lcars-sand","lcars-scarlet","lcars-seafoam","lcars-sienna","lcars-silver","lcars-sky","lcars-sky-blue","lcars-slate","lcars-slate-gray","lcars-space-white","lcars-starlight","lcars-steel-blue","lcars-sunflower","lcars-tan","lcars-tangerine","lcars-taupe","lcars-teal","lcars-text-blue","lcars-text-coal","lcars-text-dark","lcars-text-gray","lcars-text-light","lcars-text-mist","lcars-text-purple","lcars-text-smoke","lcars-text-stone","lcars-tomato","lcars-turquoise","lcars-vanilla","lcars-vermilion","lcars-violet","lcars-violet-creme","lcars-vivid-crimson","lcars-warm-gold","lcars-wheat","lcars-wheat-light","lcars-yam","lcars-yellow"],it=["orange","gray","blue","green","yellow"],lt=["darkest","dark","medium-dark","","medium","medium-light","light","lightest"],nt=["10","50","60","95"],ct=[...it.flatMap(a=>[...lt,...nt].map(e=>`lcards-${e?`${a}-${e}`:a}`)),"lcards-moonlight"],dt=["lcars-vertical-border","lcars-horizontal-border","lcars-middle-vertical-border","lcars-inner-radius","lcars-outer-radius","lcars-font","lcars-fallback-font"],ht=["msd-bright","msd-dark","msd-medium","msd-normal","msd-ra-bright","msd-ra-dark","msd-ra-medium","msd-ra-normal"],ut=["lcars-background-color","lcars-background-text","lcars-backlight-center","lcars-backlight-middle","lcars-backlight-middle-location","lcars-backlight-outer","lcars-card-top-color","lcars-card-top-text","lcars-card-mid-color","lcars-card-mid-left-color","lcars-card-mid-text","lcars-card-button-color","lcars-card-button","lcars-card-button-off","lcars-card-button-text","lcars-card-bottom-color","lcars-card-bottom-text","lcars-ripple-color","lcars-ripple-hover-opacity","lcars-ripple-pressed-opacity","lcars-settings-card-color","lcars-settings-card-text","lcars-sidebar-background","lcars-sidebar-icon-background","lcars-sidebar-icon-color","lcars-sidebar-item-color","lcars-sidebar-notification-color","lcars-sidebar-selected-color","lcars-sidebar-text","lcars-tooltip-background","lcars-tooltip-text","lcars-ui-accent-color","lcars-ui-accent-text","lcars-ui-app-header-background-color","lcars-ui-app-header-clock","lcars-ui-app-header-text-color","lcars-ui-config-button","lcars-ui-config-icon","lcars-ui-mix-color","lcars-ui-primary","lcars-ui-primary-text","lcars-ui-secondary","lcars-ui-secondary-text","lcars-ui-tertiary","lcars-ui-tertiary-text","lcars-ui-quaternary","lcars-ui-quaternary-text","lcars-ui-text-heading","lcars-font-color","lcars-alert-color"],pt=["primary","neutral","orange","red","green"],gt=pt.flatMap(a=>Fe.map(e=>`ha-color-${a}-${e}`)),bt=[...oe.flatMap(a=>S.map(e=>`ha-color-on-${a}-${e}`)),...oe.flatMap(a=>S.flatMap(e=>(a==="disabled"?["resting","hover"]:["resting","hover","active"]).map(t=>`ha-color-fill-${a}-${e}-${t}`))),...Oe.flatMap(a=>S.map(e=>`ha-color-border-${a}-${e}`)),"ha-color-surface-default","ha-color-surface-low","ha-color-surface-lower","ha-color-surface-default-inverted","ha-color-surface-low-inverted","ha-color-surface-lower-inverted","ha-color-on-surface-default","ha-color-form-background","ha-color-form-background-hover","ha-color-form-background-disabled"],mt=["primary-color","dark-primary-color","light-primary-color","accent-color","primary-text-color","secondary-text-color","text-primary-color","disabled-text-color","primary-background-color","secondary-background-color","card-background-color","clear-background-color","divider-color","error-color","warning-color","success-color","info-color","state-active-color","state-inactive-color","state-unavailable-color","state-icon-color","state-icon-error-color"];function ve(){return[{category:"lcards-palette",names:ct},{category:"lcars-semantic",names:ut},{category:"lcars-named",names:ot},{category:"lcars-structural",names:dt},{category:"msd",names:ht},{category:"ha-palette",names:gt},{category:"ha-semantic",names:bt},{category:"ha-legacy",names:mt}].flatMap(({category:e,names:t})=>t.map(r=>({name:r,category:e})))}l(ve,"getKnownVariableCatalog");const fe="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",vt="M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z",ft="M9.25,5L12.5,1.75L15.75,5H9.25M15.75,19L12.5,22.25L9.25,19H15.75M3,13H5V11H3M3,6V8H5V6M3,18H5V16H3V18M7,13H21V11H7M7,6V8H21V6M7,18H21V16H7V18Z",yt="M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2C17.5,2 22,6 22,11A6,6 0 0,1 16,17H14.2C13.9,17 13.7,17.2 13.7,17.5C13.7,17.6 13.75,17.7 13.8,17.8C14.08,18.1 14.25,18.5 14.25,19A3,3 0 0,1 11.25,22L12,22M10,7.5A1.5,1.5 0 0,0 8.5,9A1.5,1.5 0 0,0 10,10.5A1.5,1.5 0 0,0 11.5,9A1.5,1.5 0 0,0 10,7.5M14,7.5A1.5,1.5 0 0,0 12.5,9A1.5,1.5 0 0,0 14,10.5A1.5,1.5 0 0,0 15.5,9A1.5,1.5 0 0,0 14,7.5M7,12.5A1.5,1.5 0 0,0 5.5,14A1.5,1.5 0 0,0 7,15.5A1.5,1.5 0 0,0 8.5,14A1.5,1.5 0 0,0 7,12.5Z",ye=["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen","darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","green","greenyellow","grey","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightgrey","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","slategrey","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"];if(!customElements.get("hex-alpha-color-picker")){const e=class e extends U{};l(e,"HexAlphaColorPicker");let a=e;customElements.define("hex-alpha-color-picker",a)}if(!customElements.get("hex-input")){const e=class e extends G{};l(e,"HexInput");let a=e;customElements.define("hex-input",a)}const _t=new Set(["lcards-palette","lcars-semantic","lcars-named","msd","ha-palette","ha-semantic","ha-legacy"]),_e={theme:["lcars","lcars-semantic","lcards","card-mod"],"ha-lcars":["lcars-semantic"],ha:["ha-legacy","ha-color","ha-system","ha-space","ha-shape","ha-motion","ha-type","ha-elevation","states"],all:null},xe={theme:"Theme","ha-lcars":"HA-LCARS",ha:"HA",all:"All"},m=class m2 extends Ce{static get properties(){return{hass:{type:Object},value:{type:String},disabled:{type:Boolean},variablePrefixes:{type:Array},showPreview:{type:Boolean},allowMatchLight:{type:Boolean},entityId:{type:String},showBuilder:{type:Boolean},themeContext:{type:Object},_cssVariables:{type:Array,state:true},_computedColor:{type:String,state:true},_builderMode:{type:Boolean,state:true},_selectedFunction:{type:String,state:true},_baseColor:{type:String,state:true},_baseColor2:{type:String,state:true},_amount:{type:Number,state:true},_applyBrightness:{type:Boolean,state:true},_popoverOpen:{type:Boolean,state:true},_popoverMounted:{type:Boolean,state:true},_popoverMode:{type:String,state:true},_sortMode:{type:String,state:true},_searchText:{type:String,state:true},_selectedFamily:{type:String,state:true},_selectedCategoryGroup:{type:String,state:true},_builderPickingFor:{type:String,state:true},_builderPopoverOpen:{type:Boolean,state:true},_builderPopoverMounted:{type:Boolean,state:true}}}constructor(){super(),this.hass=void 0,this.value="",this.disabled=false,this.variablePrefixes=["--lcards-","--lcars-","--cblcars-"],this.showPreview=true,this.allowMatchLight=false,this.entityId="",this.showBuilder=true,this.themeContext=null,this._cssVariables=[],this._computedColor="",this._variablesCache=null,this._builderMode=false,this._selectedFunction="lighten",this._baseColor="",this._baseColor2="",this._amount=20,this._applyBrightness=false,this._popoverOpen=false,this._popoverMounted=false,this._popoverMode="",this._sortMode="name",this._searchText="",this._selectedFamily="all",this._selectedCategoryGroup="theme",this._builderPickingFor=null,this._builderPopoverOpen=false,this._builderPopoverMounted=false}static get styles(){return we`
            :host {
                display: block;
            }

            .color-picker {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
            }

            .color-inputs {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
            }

            .input-group {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
            }

            .input-label {
                font-size: var(--ha-font-size-s);
                font-weight: 500;
                color: var(--secondary-text-color, #727272);
                padding: 0 var(--ha-space-2);
            }

            .input-label-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: 24px;
            }

            .brightness-toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 var(--ha-space-2);
                min-height: 36px;
            }

            /* ── wa-popover body — zero out Web Awesome's built-in padding and fix size ── */
            wa-popover {
                --wa-space-l: 0;
            }

            wa-popover::part(body) {
                padding: 0;
                width: max(var(--body-width, 320px), 280px);
                max-width: max(var(--body-width, 320px), 280px);
                max-height: 500px;
                height: 70vh;
                overflow: hidden;
            }

            @media (max-height: 1000px) {
                wa-popover::part(body) {
                    max-height: 400px;
                }
            }

            /* Trigger field (replaces ha-select in text UI mode) */
            .color-trigger-field {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                padding: 0 var(--ha-space-3);
                height: 56px;
                border: var(--ha-border-width-sm) solid var(--outline-color, var(--divider-color, #e0e0e0));
                border-radius: var(--ha-border-radius-md);
                cursor: pointer;
                background: var(--card-background-color, #fff);
                box-sizing: border-box;
                user-select: none;
            }

            .color-trigger-field:hover {
                border-color: var(--primary-color);
            }

            .color-swatch-trigger {
                width: 20px;
                height: 20px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.15);
                flex-shrink: 0;
            }

            .color-trigger-label {
                flex: 1;
                font-size: var(--ha-font-size-m);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: var(--primary-text-color);
            }

            .color-trigger-chevron {
                color: var(--secondary-text-color);
                flex-shrink: 0;
            }

            /* ── Popover content — mirrors ha-picker-combo-box layout ── */
            .popover-content {
                display: flex;
                flex-direction: column;
                padding-top: var(--ha-space-4);
                height: 100%;
                overflow: hidden;
                box-sizing: border-box;
            }

            /* search input: left/right gutter + bottom spacing, distinct background */
            .popover-content ha-input-search {
                padding: 0 var(--ha-space-3) var(--ha-space-3);
                /* Make the search field visually distinct from the popover body by
                   mapping --card-background-color (used internally by ha-input outlined)
                   to the neutral-quiet-resting fill that HA uses for section headers etc. */
                --card-background-color: var(--ha-color-fill-neutral-quiet-resting, var(--secondary-background-color, #f5f5f5));
            }

            /* sections chip row (scope + separator + Picker, and family row) */
            .sections {
                display: flex;
                flex-wrap: nowrap;
                align-items: center;
                gap: var(--ha-space-2);
                padding: 0 var(--ha-space-3) var(--ha-space-3);
                overflow: auto;
                flex-shrink: 0;
            }

            .sort-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                padding: 0;
                margin-inline-start: auto;
                flex-shrink: 0;
                border: none;
                background: none;
                cursor: pointer;
                color: var(--secondary-text-color);
                opacity: 0.5;
                border-radius: var(--ha-border-radius-sm);
                transition: opacity var(--ha-animation-duration-fast, 0.15s);
            }

            .sort-btn:hover {
                opacity: 0.9;
            }

            .sort-btn ha-svg-icon {
                width: 16px;
                height: 16px;
                pointer-events: none;
            }

            .sort-btn.sort-gradient {
                color: var(--primary-color);
                opacity: 1;
            }

            .sections ha-filter-chip {
                flex-shrink: 0;
                --md-filter-chip-selected-container-color: var(
                    --ha-color-fill-primary-normal-hover,
                    rgba(var(--rgb-primary-color, 3, 169, 244), 0.2)
                );
                color: var(--primary-color);
            }

            /* no-leading-icon chips: HA's WebAwesome chip (2026.10+) pads both sides
               equally when no icon is rendered, so labels stay centred in both
               selected and unselected states without overrides. */

            /* vertical bar between scope chips and Picker */
            .sections .separator {
                height: var(--ha-space-8);
                width: 0;
                border: var(--ha-border-width-sm) solid var(--ha-color-border-neutral-quiet, var(--divider-color));
                flex-shrink: 0;
                align-self: center;
            }

            /* section title above the list */
            .section-title-wrapper {
                height: 0;
                position: relative;
            }

            .section-title {
                box-sizing: border-box;
                background-color: var(--ha-color-fill-neutral-quiet-resting, var(--secondary-background-color));
                padding: var(--ha-space-1) var(--ha-space-4);
                font-family: var(--ha-font-family-body, inherit);
                font-weight: var(--ha-font-weight-bold, 500);
                color: var(--secondary-text-color);
                min-height: var(--ha-space-6);
                display: flex;
                align-items: center;
                opacity: 0;
                position: absolute;
                top: 1px;
                width: calc(100% - var(--ha-space-4));
            }

            .section-title.show {
                opacity: 1;
                z-index: 1;
            }

            /* scrollable color variable list */
            .color-list {
                overflow-y: auto;
                flex: 1;
                min-height: 0;
                /* leave room for the section-title overlay */
                padding-top: var(--ha-space-6);
            }

            /* selected item highlight */
            ha-combo-box-item.current-value {
                background-color: var(--ha-color-fill-primary-quiet-resting, rgba(var(--rgb-primary-color, 3, 169, 244), 0.08));
            }

            .color-swatch-sm {
                display: block;
                width: 20px;
                height: 20px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.15);
                flex-shrink: 0;
            }

            .color-swatch-sm.unresolvable {
                border-style: dashed;
                opacity: 0.4;
            }

            .swatch-transparent {
                display: block;
                width: 20px;
                height: 20px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.15);
                background: linear-gradient(45deg, #ccc 25%, transparent 25%),
                            linear-gradient(-45deg, #ccc 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #ccc 75%),
                            linear-gradient(-45deg, transparent 75%, #ccc 75%);
                background-size: 8px 8px;
                background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
                flex-shrink: 0;
            }

            /* Native color picker (Picker chip mode) */
            .picker-mode-content {
                padding: var(--ha-space-3);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                flex: 1;
                min-height: 0;
                overflow-y: auto;
            }

            hex-alpha-color-picker {
                width: 100%;
                height: 240px;
            }

            hex-alpha-color-picker::part(saturation) {
                border-radius: var(--ha-border-radius-md) var(--ha-border-radius-md) 0 0;
            }

            hex-alpha-color-picker::part(hue) {
                border-radius: 0;
                height: 24px;
            }

            hex-alpha-color-picker::part(alpha) {
                border-radius: 0 0 var(--ha-border-radius-md) var(--ha-border-radius-md);
                height: 24px;
            }

            hex-input {
                width: 100%;
            }

            hex-input::part(input) {
                width: 100%;
                box-sizing: border-box;
                padding: var(--ha-space-2) var(--ha-space-3);
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-border-radius-md);
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color);
                font-family: monospace;
                font-size: var(--ha-font-size-m, 14px);
                outline: none;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            hex-input::part(input):focus {
                border-color: var(--primary-color);
            }

            .chip-swatch {
                display: inline-block;
                width: 9px;
                height: 9px;
                border-radius: var(--ha-border-radius-circle, 50%);
                border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.15);
            }

            ha-selector {
                width: 100%;
            }

            .color-swatch {
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 3px;
                margin-right: var(--ha-space-2);
                vertical-align: middle;
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
            }

            .color-swatch.transparent {
                background: linear-gradient(45deg, #ccc 25%, transparent 25%),
                            linear-gradient(-45deg, #ccc 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #ccc 75%),
                            linear-gradient(-45deg, transparent 75%, #ccc 75%);
                background-size: 8px 8px;
                background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
            }

            .preview {
                margin-top: var(--ha-space-2);
                padding: var(--ha-space-3);
                border-radius: 22px;
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
                transition: all var(--ha-animation-duration-normal, 0.2s) ease;
            }

            .preview-value {
                font-size: var(--ha-font-size-m);
                font-family: monospace;
            }

            .preview-computed {
                font-size: var(--ha-font-size-m);
                opacity: 0.7;
            }

            /* Builder UI Styles */
            .picker-header {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding: 0 var(--ha-space-1);
            }

            /* Unified pill-group: square the inner corners, pill the outer ones.
               ::part(base) pierces ha-button's shadow DOM to reach the <button> element. */
            .picker-header wa-button-group ha-button::part(base) {
                min-height: 28px;
                height: 28px;
                padding-block: 0;
                font-size: var(--ha-font-size-s, 12px);
            }

            .picker-header wa-button-group ha-button:first-child::part(base) {
                border-start-start-radius: var(--ha-border-radius-pill);
                border-end-start-radius: var(--ha-border-radius-pill);
                border-start-end-radius: 0;
                border-end-end-radius: 0;
                border-inline-end: none;
            }

            .picker-header wa-button-group ha-button:last-child::part(base) {
                border-start-start-radius: 0;
                border-end-start-radius: 0;
                border-start-end-radius: var(--ha-border-radius-pill);
                border-end-end-radius: var(--ha-border-radius-pill);
            }

            .builder-panel {
                background: var(--card-background-color, #fff);
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-card-border-radius, 12px);
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-4);
            }

            .builder-row {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
            }

            .builder-row label {
                font-size: var(--ha-font-size-m);
                font-weight: 500;
                color: var(--primary-text-color);
            }

            .builder-result {
                background: var(--secondary-background-color, #f5f5f5);
                padding: var(--ha-space-3);
                border-radius: var(--ha-border-radius-md);
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
            }

            .builder-result code {
                font-family: 'Courier New', monospace;
                font-size: var(--ha-font-size-m);
                color: var(--primary-text-color);
                word-break: break-all;
            }

            .result-actions {
                display: flex;
                gap: var(--ha-space-2);
                align-items: center;
                justify-content: flex-end;
                margin-top: var(--ha-space-2);
            }

            .result-actions ha-button {
                --ha-button-border-radius: var(--ha-card-border-radius, 12px);
            }

            .copy-success {
                font-size: var(--ha-font-size-s);
                color: var(--success-color, #4caf50);
                display: flex;
                align-items: center;
                gap: var(--ha-space-1);
            }

            .preview-comparison {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--ha-space-2);
                margin-top: var(--ha-space-3);
            }

            .preview-swatch {
                padding: var(--ha-space-3);
                border-radius: var(--ha-card-border-radius, 12px);
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                text-align: center;
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
            }

            .preview-swatch-label {
                font-size: var(--ha-font-size-m);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.8;
            }

            .preview-swatch-value {
                font-size: var(--ha-font-size-m);
                font-family: monospace;
                opacity: 0.7;
            }

            .validation-error {
                color: var(--error-color, #f44336);
                font-size: var(--ha-font-size-s);
                padding: 8px;
                background: var(--error-background-color, rgba(244, 67, 54, 0.1));
                border-radius: var(--ha-border-radius-sm);
                margin-top: 8px;
            }

            .custom-color-input {
                padding: 0 var(--ha-space-3) var(--ha-space-3);
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
            }

            .custom-color-input ha-selector {
                flex: 1;
                width: 100%;
            }

            .custom-color-input .color-swatch-sm {
                flex-shrink: 0;
            }
        `}connectedCallback(){super.connectedCallback(),this._loadCssVariables();const{applyBrightness:e}=this._parseIncomingValue(this.value);e&&(this._applyBrightness=true),this._updateComputedColor()}updated(e){if(super.updated(e),e.has("value")){const{applyBrightness:t}=this._parseIncomingValue(this.value);this._applyBrightness!==t&&(this._applyBrightness=t),this._updateComputedColor(),this._builderMode&&this.value&&this._tryParseValueToBuilder(this.value)}else e.has("themeContext")&&this._updateComputedColor()}_loadCssVariables(){if(m2._variablesCache){this._cssVariables=m2._variablesCache;return}const e=new Map(ve().map(i=>[`--${i.name}`,i.category])),t=l(i=>{const n=st(i);return n==="lcars"&&e.get(i)==="lcars-semantic"?"lcars-semantic":n},"categoryFor"),r=[],s=new Set,o=getComputedStyle(document.documentElement);for(let i=0;i<o.length;i++){const n=o[i];if(!n.startsWith("--"))continue;const d=o.getPropertyValue(n).trim();!d||!Be(d)||(s.add(n),r.push({name:n,value:`var(${n})`,label:this._formatVariableName(n),family:me(d),category:t(n),resolvable:true}))}for(const i of ve()){if(!_t.has(i.category))continue;const n=`--${i.name}`;s.has(n)||r.push({name:n,value:`var(${n})`,label:`${this._formatVariableName(n)} (inactive)`,family:null,category:t(n),resolvable:false})}r.sort((i,n)=>i.label.localeCompare(n.label)),m2._variablesCache=r,this._cssVariables=r}_formatVariableName(e){let t=e;return t.startsWith("--")&&(t=t.substring(2)),t}_applyThemeContextFamilies(e){if(!this.themeContext)return e;if(this._themeContextFamiliesSource===this.themeContext&&this._themeContextFamiliesCache)return this._themeContextFamiliesCache;const t=e.map(r=>{const s=r.name.startsWith("--")?r.name.slice(2):r.name;if(!Object.prototype.hasOwnProperty.call(this.themeContext,s))return r;const o=this._computeColor(`var(--${s})`),i=me(o);return i?{...r,family:i}:r});return this._themeContextFamiliesSource=this.themeContext,this._themeContextFamiliesCache=t,t}_getFilteredVariables(){let e=this._applyThemeContextFamilies(this._cssVariables);const t=_e[this._selectedCategoryGroup];if(t&&(e=e.filter(r=>t.includes(r.category))),this._selectedFamily!=="all"&&(e=e.filter(r=>r.family===this._selectedFamily)),this._searchText){const r=this._searchText.toLowerCase();e=e.filter(s=>s.label.toLowerCase().includes(r)||s.name.toLowerCase().includes(r)||s.family&&B[s.family].toLowerCase().includes(r))}if(this._sortMode==="gradient"){const r=e.map(s=>({v:s,k:at(s.value)}));r.sort((s,o)=>{const i=s.k,n=o.k;if(!i&&!n)return s.v.label.localeCompare(o.v.label);if(!i)return 1;if(!n)return-1;const d=x.indexOf(i.family)-x.indexOf(n.family);if(d!==0)return d;const p=i.lightness-n.lightness;return p!==0?p:i.hue-n.hue||s.v.label.localeCompare(o.v.label)}),e=r.map(({v:s})=>s)}else e=[...e].sort((r,s)=>r.label.localeCompare(s.label));return e}_cycleSortMode(){this._sortMode=this._sortMode==="gradient"?"name":"gradient"}_handleFilterSearchInput(e){this._searchText=e.target.value||""}_selectPickerFamily(e,t){if(this._selectedFamily===e){t==null||t.preventDefault();return}this._selectedFamily=e}_selectCategoryGroup(e){this._selectedCategoryGroup=e}_renderPopoverContent(){const e=x.filter(s=>this._cssVariables.some(o=>o.family===s)),t=this._getSectionTitle(),r=this._popoverMode==="";return c`
            <div class="popover-content">

                <!-- 1. Search — always visible, always first -->
                <ha-input-search
                    appearance="outlined"
                    style="--start-slot-width: calc(18px + var(--ha-space-1)); --input-padding-inline-start: var(--ha-space-1);"
                    .value=${this._searchText}
                    .disabled=${this.disabled}
                    @input=${this._handleFilterSearchInput}>
                </ha-input-search>

                <!-- 2. Sections row: scope chips | separator | Picker | CSS | Custom -->
                <ha-chip-set class="sections">
                    ${Object.keys(_e).map(s=>c`
                        <ha-filter-chip
                            no-leading-icon
                            .selected=${this._selectedCategoryGroup===s&&r}
                            .label=${xe[s]}
                            @click=${o=>{if(this._selectedCategoryGroup===s&&r){o.preventDefault();return}this._popoverMode="",this._selectCategoryGroup(s)}}>
                        </ha-filter-chip>
                    `)}
                    <div class="separator"></div>
                    <ha-filter-chip
                        no-leading-icon
                        .selected=${this._popoverMode==="picker"}
                        .label=${"Picker"}
                        @click=${()=>this._setPopoverMode("picker")}>
                    </ha-filter-chip>
                    <ha-filter-chip
                        no-leading-icon
                        .selected=${this._popoverMode==="named"}
                        .label=${"CSS"}
                        @click=${()=>this._setPopoverMode("named")}>
                    </ha-filter-chip>
                    <ha-filter-chip
                        no-leading-icon
                        .selected=${this._popoverMode==="custom"}
                        .label=${"Custom"}
                        @click=${()=>this._setPopoverMode("custom")}>
                    </ha-filter-chip>
                </ha-chip-set>

                <!-- 3. Color family chips (list mode only) -->
                ${r?c`
                    <ha-chip-set class="sections">
                        <ha-filter-chip
                            no-leading-icon
                            .selected=${this._selectedFamily==="all"}
                            .label=${"All"}
                            @click=${s=>this._selectPickerFamily("all",s)}>
                        </ha-filter-chip>
                        ${e.map(s=>c`
                            <ha-filter-chip
                                .selected=${this._selectedFamily===s}
                                .label=${B[s]}
                                title=${Se[s]||""}
                                @click=${o=>this._selectPickerFamily(s,o)}>
                                <span slot="icon" class="chip-swatch"
                                    style="background-color: ${Te[s]}">
                                </span>
                            </ha-filter-chip>
                        `)}
                    </ha-chip-set>

                    <!-- 4. Section title header (floats above list) with sort button -->
                    <div class="section-title-wrapper">
                        <div class="section-title show">
                            <span>${t}</span>
                            <button
                                class="sort-btn ${this._sortMode==="gradient"?"sort-gradient":""}"
                                title=${this._sortMode==="gradient"?"Sort: Colour (click for A–Z)":"Sort: A–Z (click for colour)"}
                                @click=${this._cycleSortMode}>
                                <ha-svg-icon .path=${this._sortMode==="gradient"?yt:ft}></ha-svg-icon>
                            </button>
                        </div>
                    </div>
                `:b}

                <!-- 5. Content area: list, color wheel, named colors, or custom input -->
                ${this._popoverMode==="picker"?this._renderPickerMode():this._popoverMode==="named"?this._renderNamedColorList():this._popoverMode==="custom"?this._renderCustomColorInput():this._renderColorList()}
            </div>
        `}_getSectionTitle(){const e=xe[this._selectedCategoryGroup];return this._selectedFamily==="all"?e:`${e} · ${B[this._selectedFamily]}`}_renderColorList(){const e=this._getFilteredVariables(),t=this._builderPickingFor==="color1"?this._baseColor:this._builderPickingFor==="color2"?this._baseColor2:this.value,{color:r}=this._parseIncomingValue(t);return c`
            <div class="color-list" role="listbox">
                <ha-combo-box-item type="button"
                    @click=${()=>this._selectAndClose("")}>
                    <span slot="headline">(None)</span>
                </ha-combo-box-item>
                <ha-combo-box-item type="button"
                    @click=${()=>this._selectAndClose("transparent")}>
                    <span slot="start" class="swatch-transparent"></span>
                    <span slot="headline">Transparent</span>
                </ha-combo-box-item>
                ${this.allowMatchLight?c`
                    <ha-combo-box-item type="button"
                        @click=${()=>this._selectAndClose("match-light")}>
                        <ha-svg-icon slot="start" .path=${vt}
                            style="color: ${this._resolveMatchLightForPreview("match-light")||"var(--primary-text-color)"}; width: 20px; height: 20px; flex-shrink: 0;">
                        </ha-svg-icon>
                        <span slot="headline">Match Light Colour</span>
                    </ha-combo-box-item>
                `:b}
                ${e.map(s=>c`
                    <ha-combo-box-item type="button"
                        class="${r===s.value?"current-value":""}"
                        @click=${()=>this._selectAndClose(s.value)}>
                        <span slot="start" class="color-swatch-sm ${s.resolvable===false?"unresolvable":""}"
                            style="background-color: ${this._computeColor(s.value)};"></span>
                        <span slot="headline">${s.label}</span>
                    </ha-combo-box-item>
                `)}
            </div>
        `}_renderPickerMode(){const e=this._valueToHex();return c`
            <div class="picker-mode-content">
                <hex-alpha-color-picker
                    .color=${e}
                    @color-changed=${this._handlePickerColorChange}>
                </hex-alpha-color-picker>
                <hex-input
                    prefixed
                    alpha
                    .color=${e}
                    @color-changed=${this._handlePickerColorChange}>
                </hex-input>
            </div>
        `}_getFilteredNamedColors(){if(!this._searchText)return ye;const e=this._searchText.toLowerCase();return ye.filter(t=>t.includes(e))}_renderNamedColorList(){const e=this._getFilteredNamedColors(),t=this._builderPickingFor==="color1"?this._baseColor:this._builderPickingFor==="color2"?this._baseColor2:this.value;return c`
            <div class="color-list" role="listbox">
                ${e.map(r=>c`
                    <ha-combo-box-item type="button"
                        class="${t===r?"current-value":""}"
                        @click=${()=>this._selectAndClose(r)}>
                        <span slot="start" class="color-swatch-sm"
                            style="background-color: ${r};"></span>
                        <span slot="headline">${r}</span>
                    </ha-combo-box-item>
                `)}
            </div>
        `}_renderCustomColorInput(){const e=this._builderPickingFor==="color1"?this._baseColor:this._builderPickingFor==="color2"?this._baseColor2:this.value,t=e?this._computeColor(e):"";return c`
            <div class="custom-color-input">
                <span class="color-swatch-sm" style="background-color: ${t};"></span>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{text:{}}}
                    .value=${e||""}
                    .disabled=${this.disabled}
                    @value-changed=${this._handlePopoverCustomInput}
                    placeholder="#ff9900, rgb(255,153,0), var(...), lighten(...)">
                </ha-selector>
            </div>
        `}_handlePopoverCustomInput(e){if(this.disabled)return;const t=e.detail.value;this._builderPickingFor?this._builderPickingFor==="color1"?this._baseColor=t:this._baseColor2=t:this._emitChange(t)}_updateComputedColor(){this._computedColor=this.value?this._computeColor(this.value):""}_resolveMatchLightForPreview(e){var o,i;if(!e||!e.includes("match-light")&&!e.includes("match-brightness"))return e;const t=(i=(o=this.hass)==null?void 0:o.states)==null?void 0:i[this.entityId];let r=e;if(r.includes("match-brightness"))if(t&&t.state==="on"){const d=((t.attributes.brightness??255)/255).toFixed(3);r=r.replace(/match-brightness/g,d)}else r=r.replace(/match-brightness/g,"1");if(!r.includes("match-light")||!t||t.state!=="on")return r;let s=null;if(t.attributes.rgb_color){const[n,d,p]=t.attributes.rgb_color;s=`rgb(${n}, ${d}, ${p})`}else if(t.attributes.hs_color){const[n,d]=t.attributes.hs_color;s=h.hsToRgb?(()=>{const[p,g,Ee]=h.hsToRgb(n,d,t.attributes.brightness??255);return`rgb(${p}, ${g}, ${Ee})`})():null}else if(t.attributes.color_temp){const n=t.attributes.color_temp_kelvin??Math.round(1e6/t.attributes.color_temp),[d,p,g]=h.kelvinToRgb(n);s=`rgb(${d}, ${p}, ${g})`}else{const n=t.attributes.brightness??255,d=Math.round(n/255*255);s=`rgb(${d}, ${Math.round(d*.97)}, ${Math.round(d*.85)})`}return s?r.replace(/match-light/g,s):r}_computeColor(e){if(!e)return"";if(e=this._resolveMatchLightForPreview(e),ie(e))return this._approximateComputedColor(e);if(e.includes("var(")){if(e=this._substituteThemeContextVars(e),Ve(e))return e;try{const t=document.createElement("div");t.style.color=e,document.body.appendChild(t);const r=getComputedStyle(t).color;return document.body.removeChild(t),r||e}catch{return e}}return e}_substituteThemeContextVars(e,t=0){if(!this.themeContext||t>12||typeof e!="string"||!e.includes("var(--"))return e;let r=false;const s=e.replace(/var\(--([a-zA-Z0-9-]+)\)/g,(o,i)=>Object.prototype.hasOwnProperty.call(this.themeContext,i)?(r=true,String(this.themeContext[i])):o);return r?this._substituteThemeContextVars(s,t+1):s}_calculateLuminance(e){return h.luminance(e)}_parseColor(e){return h.parseColor(e)}_rgbToHex(e){const t=h.parseColor(e);return t?h.rgbToHex(t[0],t[1],t[2]):null}_getContrastColor(e){return h.contrastColor(e)}render(){return c`
            <div class="color-picker">
                ${this.showBuilder?this._renderModeToggle():""}

                ${this._builderMode?this._renderBuilderUI():this._renderTextUI()}

                ${this.showPreview?this._renderPreview():""}
            </div>
        `}_renderModeToggle(){return c`
            <div class="picker-header">
                <wa-button-group childSelector="ha-button">
                    <ha-button iconTag="ha-svg-icon"
                        variant="brand" size="s"
                        .appearance=${this._builderMode?"filled":"accent"}
                        .disabled=${this.disabled}
                        @click=${()=>this._setMode(false)}>
                        Picker / Text
                    </ha-button>
                    <ha-button iconTag="ha-svg-icon"
                        variant="brand" size="s"
                        .appearance=${this._builderMode?"accent":"filled"}
                        .disabled=${this.disabled}
                        @click=${()=>this._setMode(true)}>
                        Builder
                    </ha-button>
                </wa-button-group>
            </div>
        `}_renderTextUI(){const e=this._getTriggerLabel(),t=this._computedColor||"transparent",r=!this.value;return c`
            <div class="color-inputs">
                <!-- CSS Variable / Preset — opens wa-popover picker -->
                <div class="input-group">
                    <div class="input-label-row">
                        <div class="input-label">CSS Variable / Preset</div>
                    </div>
                    <div id="color-trigger"
                        class="color-trigger-field"
                        role="button"
                        tabindex="0"
                        aria-haspopup="dialog"
                        aria-expanded=${this._popoverOpen?"true":"false"}
                        @click=${this._openPickerPopover}
                        @keydown=${s=>(s.key==="Enter"||s.key===" ")&&this._openPickerPopover(s)}>
                        <span class="color-swatch-trigger"
                            style="background-color: ${r?"transparent":t};
                                   ${r?"border-style: dashed;":""}">
                        </span>
                        <span class="color-trigger-label">${e}</span>
                        <ha-svg-icon class="color-trigger-chevron" .path=${fe}></ha-svg-icon>
                    </div>
                    ${this._popoverOpen||this._popoverMounted?c`
                        <wa-popover
                            .open=${this._popoverOpen}
                            style="--body-width: ${this._getPopoverWidth()}px;"
                            without-arrow
                            distance="-4"
                            for="color-trigger"
                            placement="bottom"
                            auto-size="vertical"
                            auto-size-padding="16"
                            @wa-after-show=${this._onPopoverOpened}
                            @wa-after-hide=${this._closePickerPopover}
                            trap-focus
                            role="dialog"
                            aria-modal="true"
                            aria-label="Select color">
                            ${this._popoverMounted?this._renderPopoverContent():b}
                        </wa-popover>
                    `:b}
                </div>

                ${this.allowMatchLight?c`
                <div class="brightness-toggle-row">
                    <span class="input-label">Apply light brightness to colour</span>
                    <ha-switch
                        .checked=${this._applyBrightness}
                        .disabled=${this.disabled}
                        @change=${this._handleBrightnessToggle}>
                    </ha-switch>
                </div>
                `:""}

            </div>
        `}_renderBuilderUI(){const e=this._buildExpression(),t=this._validateExpression(e);return c`
            <div class="builder-panel">
                <!-- Function Selector -->
                <div class="builder-row">
                    <label>Function:</label>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{mode:"dropdown",options:[{value:"lighten",label:"Lighten"},{value:"darken",label:"Darken"},{value:"alpha",label:"Alpha/Transparency"},{value:"saturate",label:"Saturate"},{value:"desaturate",label:"Desaturate"},{value:"mix",label:"Mix Colours"},{value:"base",label:"Alert-Immune Baseline"}]}}}
                        .value=${this._selectedFunction}
                        .disabled=${this.disabled}
                        @value-changed=${this._onFunctionChange}>
                    </ha-selector>
                </div>

                <!-- Base Color Picker -->
                <div class="builder-row">
                    <label>${this._selectedFunction==="mix"?"Color 1:":"Base Color:"}</label>
                    ${this._renderBuilderColorTrigger("color1",this._baseColor)}
                </div>

                <!-- Second Color for Mix Function -->
                ${this._selectedFunction==="mix"?c`
                    <div class="builder-row">
                        <label>Color 2:</label>
                        ${this._renderBuilderColorTrigger("color2",this._baseColor2)}
                    </div>
                `:""}

                <!-- Amount Slider (hidden for base() which takes no amount argument) -->
                ${this._selectedFunction!=="base"?c`
                <div class="builder-row">
                    <label>${this._getAmountLabel()}: ${this._amount}%</label>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:100,step:5,mode:"slider"}}}
                        .value=${this._amount}
                        .disabled=${this.disabled}
                        @value-changed=${this._onAmountChange}>
                    </ha-selector>
                </div>
                `:c`
                <div class="builder-row" style="font-size: var(--ha-font-size-s); color: var(--secondary-text-color); padding: 4px 0;">
                    Returns the colour’s pre-alert, green-alert baseline value, immune to alert-mode hue shifts.
                </div>
                `}

                <!-- Generated Expression -->
                <div class="builder-result">
                    <code>${e||"Configure options above"}</code>
                    ${e?c`
                        <div class="result-actions">
                            <ha-button
                                appearance="filled"
                                .disabled=${this.disabled||!t||e===this.value}
                                @click=${this._applyExpression}>
                                Apply
                            </ha-button>
                            <ha-button
                                appearance="filled"
                                .disabled=${this.disabled||!e}
                                @click=${this._copyExpression}>
                                Copy
                            </ha-button>
                            ${this._copySuccess?c`
                                <span class="copy-success">
                                    <ha-icon icon="mdi:check"></ha-icon>
                                    Copied!
                                </span>
                            `:""}
                        </div>
                    `:""}
                </div>

                ${!t&&e?c`
                    <div class="validation-error">
                        Invalid expression. Please check the function syntax.
                    </div>
                `:""}

                <!-- Before/After Preview -->
                ${this._renderPreviewComparison()}
            </div>
        `}_getCurrentDropdownValue(){if(!this.value)return"";const{color:e}=this._parseIncomingValue(this.value);if(e==="transparent")return"transparent";if(e==="match-light")return"match-light";const t=this._cssVariables.find(r=>r.value===e);return t?t.value:""}_renderPreview(){if(!this.value)return c``;const e=this._computedColor||this.value,t=e.includes("var(")?h.resolveCssVariable(e,e):e,r=this._getContrastColor(t),s=this._rgbToHex(t),o=h.parseColor(t),i=o?o.join(", "):this._computedColor;return c`
            <div
                class="preview"
                style="background-color: ${e}; color: ${r};">
                <div class="preview-value">${this.value}</div>
                ${this._computedColor&&this._computedColor!==this.value?c`
                    <div class="preview-computed">
                        ${s?c`Hex: ${s} • `:""}
                        RGB: ${i}
                    </div>
                `:""}
            </div>
        `}_parseIncomingValue(e){if(!e||typeof e!="string")return{color:e,applyBrightness:false};const t=e.match(/^alpha\((.+),\s*match-brightness\)$/);return t?{color:t[1].trim(),applyBrightness:true}:{color:e,applyBrightness:false}}_computeEmittedValue(e,t){return!e||!t?e:`alpha(${e}, match-brightness)`}_handleTextChange(e){if(this.disabled)return;const t=e.detail.value;this._emitChange(t)}_handleBrightnessToggle(e){if(this.disabled)return;this._applyBrightness=e.target.checked;const{color:t}=this._parseIncomingValue(this.value),r=t||this._getCurrentDropdownValue();r&&this._emitChange(this._computeEmittedValue(r,this._applyBrightness))}_emitChange(e){this.value=e,this._updateComputedColor(),this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:true,composed:true}))}_openPickerPopover(e){this.disabled||(e==null||e.stopPropagation(),this._popoverOpen=true)}_onPopoverOpened(){this._popoverMounted=true}_closePickerPopover(){this._popoverOpen=false,this._popoverMounted=false,this._popoverMode="",this._searchText="",this._selectedFamily="all"}_openBuilderColorPicker(e,t){this.disabled||(t==null||t.stopPropagation(),this._builderPickingFor=e,this._builderPopoverOpen=true)}_onBuilderPopoverOpened(){this._builderPopoverMounted=true}_closeBuilderPopover(){this._builderPopoverOpen=false,this._builderPopoverMounted=false,this._builderPickingFor=null,this._popoverMode="",this._searchText="",this._selectedFamily="all"}_getBuilderColorLabel(e){var t;return e?e==="transparent"?"Transparent":((t=this._cssVariables.find(r=>r.value===e))==null?void 0:t.label)||e:"(Select Variable)"}_renderBuilderColorTrigger(e,t){const r=`builder-${e}-trigger`,s=this._builderPopoverOpen&&this._builderPickingFor===e,o=this._builderPopoverMounted&&this._builderPickingFor===e,i=s||o,n=t?this._computeColor(t):null,d=this._getBuilderColorLabel(t),p=!t;return c`
            <div id="${r}"
                class="color-trigger-field"
                role="button"
                tabindex="0"
                aria-haspopup="dialog"
                aria-expanded=${s?"true":"false"}
                @click=${g=>this._openBuilderColorPicker(e,g)}
                @keydown=${g=>(g.key==="Enter"||g.key===" ")&&this._openBuilderColorPicker(e,g)}>
                <span class="color-swatch-trigger"
                    style="background-color: ${p?"transparent":n};
                           ${p?"border-style: dashed;":""}">
                </span>
                <span class="color-trigger-label">${d}</span>
                <ha-svg-icon class="color-trigger-chevron" .path=${fe}></ha-svg-icon>
            </div>
            ${i?c`
                <wa-popover
                    .open=${s}
                    style="--body-width: ${this._getPopoverWidth()}px;"
                    without-arrow
                    distance="-4"
                    for="${r}"
                    placement="bottom"
                    auto-size="vertical"
                    auto-size-padding="16"
                    @wa-after-show=${this._onBuilderPopoverOpened}
                    @wa-after-hide=${this._closeBuilderPopover}
                    trap-focus
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select color">
                    ${o?this._renderPopoverContent():b}
                </wa-popover>
            `:b}
        `}_selectAndClose(e){if(!this.disabled)if(this._builderPickingFor)this._builderPickingFor==="color1"?this._baseColor=e||"":this._baseColor2=e||"",this._builderPopoverOpen=false;else{const t=e?this._computeEmittedValue(e,this._applyBrightness):"";this._emitChange(t),this._popoverOpen=false}}_setPopoverMode(e){this._popoverMode=this._popoverMode===e?"":e}_handlePickerColorChange(e){const t=e.detail.value;!t||this.disabled||(this._builderPickingFor?this._builderPickingFor==="color1"?this._baseColor=t:this._baseColor2=t:this._emitChange(this._computeEmittedValue(t,this._applyBrightness)))}_getTriggerLabel(){if(!this.value)return"(None)";const{color:e}=this._parseIncomingValue(this.value);if(e==="transparent")return"Transparent";if(e==="match-light")return"Match Light Colour";const t=this._cssVariables.find(r=>r.value===e);return t?t.label:e||"(None)"}_valueToHex(){return h.toHex((this.value||"").trim(),{withAlpha:true})??h.toHex(this._computedColor,{withAlpha:true})??"#000000ff"}_getPopoverWidth(){return this.offsetWidth||320}_setMode(e){this._builderMode=e,e&&this.value&&this._tryParseValueToBuilder(this.value)}_tryParseValueToBuilder(e){if(!e||typeof e!="string")return;const t=this._parseComputedToken(e);t?(this._selectedFunction=t.function,this._baseColor=t.baseColor,this._baseColor2=t.baseColor2||"",this._amount=t.amount):(e.includes("var(")||e.startsWith("#")||e.startsWith("rgb"))&&(this._baseColor=e)}_parseComputedToken(e){if(!e)return null;const t=e.match(/^(\w+)\((.+)\)$/);if(!t)return null;const[,r,s]=t,o=this._splitArguments(s),i=r==="base"?1:2;return!o||o.length<i||!He.includes(r)?null:r==="base"?o.length!==1?null:{function:r,baseColor:o[0].trim(),amount:0}:r==="mix"?o.length!==3?null:{function:r,baseColor:o[0].trim(),baseColor2:o[1].trim(),amount:Math.round(parseFloat(o[2])*100)}:o.length!==2?null:{function:r,baseColor:o[0].trim(),amount:Math.round(parseFloat(o[1])*100)}}_splitArguments(e){const t=[];let r="",s=0;for(const o of e)o==="("?(s++,r+=o):o===")"?(s--,r+=o):o===","&&s===0?(t.push(r.trim()),r=""):r+=o;return r&&t.push(r.trim()),t}_buildExpression(){if(!this._selectedFunction||!this._baseColor)return"";const e=this._amount/100;return this._selectedFunction==="base"?`base(${this._baseColor})`:this._selectedFunction==="mix"?this._baseColor2?`${this._selectedFunction}(${this._baseColor}, ${this._baseColor2}, ${e})`:"":`${this._selectedFunction}(${this._baseColor}, ${e})`}_validateExpression(e){return!e||!ie(e)||!e.trim().endsWith(")")?false:this._parseComputedToken(e)!==null}_getAmountLabel(){switch(this._selectedFunction){case"lighten":return"Lighten Amount";case"darken":return"Darken Amount";case"alpha":return"Opacity";case"saturate":return"Saturation Increase";case"desaturate":return"Saturation Decrease";case"mix":return"Mix Ratio";case"base":return"Amount";default:return"Amount"}}_onFunctionChange(e){e.stopPropagation();const t=e.detail.value;t&&t!==this._selectedFunction&&(this._selectedFunction=t,this._selectedFunction==="alpha"?this._amount=50:this._selectedFunction==="mix"?this._amount=50:this._selectedFunction==="base"?this._amount=0:this._amount=20,this.requestUpdate())}_onAmountChange(e){e.stopPropagation();const t=e.detail.value;t!==void 0&&Number(t)!==this._amount&&(this._amount=Number(t),this.requestUpdate())}_applyExpression(){const e=this._buildExpression();e&&this._validateExpression(e)&&this._emitChange(e)}async _copyExpression(){const e=this._buildExpression();e&&await Ie(e)&&(this._copySuccess=true,this.requestUpdate(),setTimeout(()=>{this._copySuccess=false,this.requestUpdate()},2e3))}_renderPreviewComparison(){if(!this._baseColor)return c``;const e=this._computeColor(this._baseColor),t=this._buildExpression(),r=t?this._approximateComputedColor(t):"";if(!e)return c``;const s=e.includes("var(")?h.resolveCssVariable(e,e):e,o=r&&r.includes("var(")?h.resolveCssVariable(r,r):r;return c`
            <div class="preview-comparison">
                <div class="preview-swatch" style="background-color: ${e}; color: ${this._getContrastColor(s)};">
                    <div class="preview-swatch-label">Before</div>
                    <div class="preview-swatch-value">${this._rgbToHex(s)||e}</div>
                </div>
                ${r?c`
                    <div class="preview-swatch" style="background-color: ${r}; color: ${this._getContrastColor(o)};">
                        <div class="preview-swatch-label">After (Preview)</div>
                        <div class="preview-swatch-value">${this._rgbToHex(o)||r}</div>
                    </div>
                `:c`
                    <div class="preview-swatch" style="background-color: var(--disabled-color, #ccc); color: black;">
                        <div class="preview-swatch-label">After</div>
                        <div class="preview-swatch-value">Configure function</div>
                    </div>
                `}
            </div>
        `}_approximateComputedColor(e){const t=this._substituteThemeContextVars(this._resolveMatchLightForPreview(e));return Re(t,{concrete:true,element:this,fallback:""})}};l(m,"LCARdSColorPicker");let y=m;y._variablesCache=null;y.invalidateCache=function(){y._variablesCache=null};customElements.get("lcards-color-picker")||customElements.define("lcards-color-picker",y);const se=class se2 extends Ce{static get properties(){return{header:{type:String},description:{type:String},expanded:{type:Boolean},outlined:{type:Boolean},leftChevron:{type:Boolean},icon:{type:String},headerLevel:{type:Number},secondary:{type:String},noCollapse:{type:Boolean},compact:{type:Boolean},nested:{type:Boolean},variant:{type:String,reflect:true}}}constructor(){super(),this.header="",this.description="",this.expanded=false,this.outlined=true,this.leftChevron=false,this.icon="",this.headerLevel=4,this.secondary="",this.noCollapse=false,this.compact=false,this.nested=false,this.variant=""}static get styles(){return we`
            :host {
                display: block;
                margin-bottom: var(--lcards-section-spacing, 16px);
            }

            ha-expansion-panel {
                border-radius: var(--ha-card-border-radius, var(--ha-border-radius-3xl));
                --expansion-panel-summary-padding: 0 var(--ha-space-2) 0 var(--ha-space-4);
                background-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 30%,
                    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
                );
            }

            ha-expansion-panel[outlined] {
                border: var(--ha-border-width-md) solid var(--chip-background-color, #e0e0e0);
            }

            ha-expansion-panel[expanded] {
                background-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 30%,
                    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
                );
            }

            /* Override focused state background */
            ha-expansion-panel:focus-within,
            ha-expansion-panel.focused {
                background-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 65%,
                    color-mix(in srgb, var(--primary-background-color) 35%, transparent)
                );
                --input-fill-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 65%,
                    color-mix(in srgb, var(--primary-background-color) 35%, transparent)
                );
            }

            .section-content {
                padding: var(--ha-space-3);
            }

            .section-content.compact,
            .section-content.nested {
                padding: var(--ha-space-2);
            }

            /* Secondary text beside the header (a count, an entity id) */
            .header-secondary {
                margin-left: var(--ha-space-2);
                font-weight: var(--ha-font-weight-normal, 400);
                font-size: 0.9em;
                color: var(--secondary-text-color);
            }

            .section-description {
                font-size: var(--ha-font-size-m);
                color: var(--secondary-text-color, #727272);
                margin-bottom: var(--ha-space-3);
                line-height: 1.5;
            }

            ::slotted(*) {
                display: block;
            }

            /* Add spacing between ha-selector elements to prevent cramping when helper text is present */
            ::slotted(ha-selector) {
                margin-bottom: var(--ha-space-4);
            }

            /* Explainer (variant="guide"): dark, primary colour on border and header,
               staying dark when open or focused */
            :host([variant="guide"]) ha-expansion-panel,
            :host([variant="guide"]) ha-expansion-panel[expanded],
            :host([variant="guide"]) ha-expansion-panel:focus-within,
            :host([variant="guide"]) ha-expansion-panel.focused {
                background-color: var(--primary-background-color);
            }

            :host([variant="guide"]) ha-expansion-panel[outlined] {
                border-color: color-mix(in srgb, var(--primary-color) 50%, transparent);
            }

            :host([variant="guide"]) [slot="header"] {
                color: var(--primary-color);
                font-weight: 600;
            }

            /* Icon spacing in headers */
            h1 ha-icon,
            h2 ha-icon,
            h3 ha-icon,
            h4 ha-icon,
            h5 ha-icon,
            h6 ha-icon {
                margin-right: var(--ha-space-2);
                vertical-align: middle;
            }
        `}render(){const e=["section-content"];return this.compact&&e.push("compact"),this.nested&&e.push("nested"),c`
            <ha-expansion-panel
                .header=${this.header}
                ?expanded=${this.expanded}
                ?outlined=${this.outlined}
                ?leftChevron=${this.leftChevron}
                .noCollapse=${this.noCollapse}
                .secondary=${this.secondary}
                @expanded-changed=${this._handleExpandedChange}>
                ${this.icon||this.secondary?c`
                    <div slot="header">
                        ${this.icon?c`<ha-icon icon="${this.icon}"></ha-icon>`:""}
                        <span>${this.header}</span>
                        ${this.secondary?c`<span class="header-secondary">${this.secondary}</span>`:""}
                    </div>
                `:""}
                <slot name="header-icons" slot="icons"></slot>
                <div class="${e.join(" ")}"
                    @closed=${t=>t.stopPropagation()}>
                    ${this.description?c`
                        <div class="section-description">${this.description}</div>
                    `:""}
                    <slot></slot>
                </div>
            </ha-expansion-panel>
        `}_handleExpandedChange(e){e.stopPropagation(),this.expanded=e.detail.expanded,this.dispatchEvent(new CustomEvent("expanded-changed",{detail:{expanded:this.expanded},bubbles:false,composed:false}))}};l(se,"LCARdSFormSection");let N=se;customElements.get("lcards-form-section")||customElements.define("lcards-form-section",N);export{B as F,x as a,Te as b,Se as c,wt as d,st as e,ve as f,at as g};
//# sourceMappingURL=lcards-form-section-Bxom3ojy.js.map
