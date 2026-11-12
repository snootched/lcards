var Ae=Object.defineProperty;var d=(e,t)=>Ae(e,"name",{value:t,configurable:true});import{G as ue,b as jt,k as X,S as de,A as he,m as ze,y as Ee,z as Ue,t as nt,M as St,V as P,H as Pe,c as fe,d as st,I as De,F as Yt,J as Mt,K as q,X as je,B as kt,a as pe,Y as ft,Z as me,_ as pt,$ as it,a0 as Be,C as Te,f as Zt,a1 as Ce,a2 as Oe,a3 as Jt}from"./three.module-DQ1AG__Q.js";import{G as Fe,s as Le}from"./scan-band-DqAGxl4h.js";import{l as ye,aS as Ie}from"./lcards-main-C148JfkA.js";const D=Math.PI/180,Ne=2451545,vt=23.4397*D,ge=d(e=>e.valueOf()/864e5+24405875e-1-Ne,"days"),Bt=d((e,t)=>Math.atan2(Math.sin(e)*Math.cos(vt)-Math.tan(t)*Math.sin(vt),Math.cos(e)),"raOf"),Tt=d((e,t)=>Math.asin(Math.sin(t)*Math.cos(vt)+Math.cos(t)*Math.sin(vt)*Math.sin(e)),"decOf"),ke=d((e,t)=>D*(280.16+360.9856235*e)-t,"sidereal");function Me(e,t,n,s,r){const o=ke(n,-r*D)-e,i=s*D,a=Math.asin(Math.sin(i)*Math.sin(t)+Math.cos(i)*Math.cos(t)*Math.cos(o));return{azimuth:((Math.atan2(Math.sin(o),Math.cos(o)*Math.sin(i)-Math.tan(t)*Math.cos(i))/D+180)%360+360)%360,altitude:a/D}}d(Me,"horizontal");function ve(e){const t=D*(357.5291+.98560028*e),n=D*(1.9148*Math.sin(t)+.02*Math.sin(2*t)+3e-4*Math.sin(3*t));return t+n+D*102.9372+Math.PI}d(ve,"sunEcliptic");function xe(e,t,n){const s=ge(e),r=ve(s);return Me(Bt(r,0),Tt(r,0),s,t,n)}d(xe,"sunPosition");function we(e){const t=e/36525,n=D*(218.3164477+481267.88123421*t),s=D*(297.8501921+445267.1114034*t),r=D*(357.5291092+35999.0502909*t),o=D*(134.9633964+477198.8675055*t),i=D*(93.272095+483202.0175233*t),a=n+D*(6.288774*Math.sin(o)+1.274027*Math.sin(2*s-o)+.658314*Math.sin(2*s)+.213618*Math.sin(2*o)-.185116*Math.sin(r)-.114332*Math.sin(2*i)+.058793*Math.sin(2*s-2*o)+.057066*Math.sin(2*s-r-o)+.053322*Math.sin(2*s+o)+.045758*Math.sin(2*s-r)-.040923*Math.sin(r-o)-.03472*Math.sin(s)-.030383*Math.sin(r+o)),l=D*(5.128122*Math.sin(i)+.280602*Math.sin(o+i)+.277693*Math.sin(o-i)+.173237*Math.sin(2*s-i)+.055413*Math.sin(2*s-o+i)+.046271*Math.sin(2*s-o-i)),c=385000.56-20905.355*Math.cos(o)-3699.111*Math.cos(2*s-o)-2955.968*Math.cos(2*s)-569.925*Math.cos(2*o);return{l:a-D*1.396971*t,b:l,dist:c}}d(we,"moonEcliptic");function be(e,t,n){const s=ge(e),r=we(s),o=Bt(r.l,r.b),i=Tt(r.l,r.b),a=Me(o,i,s,t,n),l=a.altitude-Math.asin(6378.14/r.dist)/D*Math.cos(a.altitude*D),c=ve(s),u=Bt(c,0),h=Tt(c,0),f=Math.acos(Math.sin(h)*Math.sin(i)+Math.cos(h)*Math.cos(i)*Math.cos(u-o)),M=Math.atan2(149598e3*Math.sin(f),r.dist-149598e3*Math.cos(f)),b=(1+Math.cos(M))/2,m=Math.sin(o-u)>0;return{azimuth:a.azimuth,altitude:l,distance:r.dist,fraction:b,waxing:m}}d(be,"moonPosition");function We(e){var r,o;const t=(o=(r=e==null?void 0:e.states)==null?void 0:r["sun.sun"])==null?void 0:o.attributes,n=Number(t==null?void 0:t.azimuth),s=Number(t==null?void 0:t.elevation);return(t==null?void 0:t.azimuth)===void 0||(t==null?void 0:t.elevation)===void 0||!Number.isFinite(n)||!Number.isFinite(s)?null:{azimuth:n,altitude:s}}d(We,"sunFromHass");function En(e,t=Date.now(),{entity:n=true}={}){var l,c;const s=Number((l=e==null?void 0:e.config)==null?void 0:l.latitude)||0,r=Number((c=e==null?void 0:e.config)==null?void 0:c.longitude)||0,o=n?We(e):null,i=o?{...o,source:"entity"}:{...xe(t,s,r),source:"computed"},a=be(t,s,r);return{sun:i,moon:{...a,illumination:Math.round(a.fraction*100)},location:{latitude:s,longitude:r},time:t.valueOf()}}d(En,"skyState");function Re(e,t){const s=t/15*36e5;return Math.floor((e.valueOf()+s)/864e5)*864e5-s}d(Re,"solarDayStart");function Un(e,t,n,s=Date.now(),r=5){const o=Re(s,n),i=e==="moon"?be:xe,a=[];for(let l=0;l<=1440;l+=r){const c=i(o+l*6e4,t,n);a.push({azimuth:c.azimuth,altitude:c.altitude})}return a}d(Un,"dayPath");const U=Math.PI/180,Wt=2451545,H=1495978707e-1,Kt=23.43928*U,Ge=81.30057,_t=d(e=>e/864e5+24405875e-1-Wt,"daysJ2000"),tt={mercury:{el:[.38709843,.20563661,7.00559432,252.25166724,77.45771895,48.33961819],rate:[0,2123e-8,-.00590158,149472.67486623,.15940013,-.12214182]},venus:{el:[.72332102,.00676399,3.39777545,181.9797085,131.76755713,76.67261496],rate:[-26e-8,-5107e-8,43494e-8,58517.8156026,.05679648,-.27274174]},emb:{el:[1.00000018,.01673163,-54346e-8,100.46691572,102.93005885,-5.11260389],rate:[-3e-8,-3661e-8,-.01337178,35999.37306329,.3179526,-.24123856]},mars:{el:[1.52371243,.09336511,1.85181869,-4.56813164,-23.91744784,49.71320984],rate:[97e-8,9149e-8,-.00724757,19140.29934243,.45223625,-.26852431]},jupiter:{el:[5.20248019,.0485359,1.29861416,34.33479152,14.27495244,100.29282654],rate:[-2864e-8,18026e-8,-.00322699,3034.90371757,.18199196,.13024619],extra:[-12452e-8,.0606406,-.35635438,38.35125]},saturn:{el:[9.54149883,.05550825,2.49424102,50.07571329,92.86136063,113.63998702],rate:[-3065e-8,-32044e-8,.00451969,1222.11494724,.54179478,-.25015002],extra:[25899e-8,-.13434469,.87320147,38.35125]},uranus:{el:[19.18797948,.0468574,.77298127,314.20276625,172.43404441,73.96250215],rate:[-20455e-8,-155e-7,-.00180155,428.49512595,.09266985,.05739699],extra:[58331e-8,-.97731848,.17689245,7.67025]},neptune:{el:[30.06952752,.00895439,1.7700552,304.22289287,46.68158724,131.78635853],rate:[6447e-8,818e-8,224e-6,218.46515314,.01009938,-.00606302],extra:[-41348e-8,.68346318,-.10162547,7.67025]}},et={pluto:[24575885e-1,39.58862938517124,.2518378778576892,17.14771140999114,110.2923840543057,113.7090015158565,38.68366347318184,.003956838955553025],ceres:[24612005e-1,2.765552595034094,.07969229514816586,10.58802780183462,80.24862682043221,73.29421453021587,274.4193463761342,.21430445064843]},Ct={phobos:{parent:"mars",el:[9375,.015,216.3,215.16,1.1,169.2,.31891007,1.1,2.3],plane:[317.7,52.9]},deimos:{parent:"mars",el:[23457,0,0,259.395,1.8,54.3,1.26244075,0,56.2],plane:[316.6,53.5]},io:{parent:"jupiter",el:[421800,.004,49.1,19.898,0,0,1.76913833,1.333,0],plane:[268.1,64.5]},europa:{parent:"jupiter",el:[671100,.009,45,214.396,.5,184,3.55117426,1.394,30.202],plane:[268.1,64.5]},ganymede:{parent:"jupiter",el:[1070400,.001,198.3,221.566,.2,58.5,7.15454972,68.301,137.812],plane:[268.2,64.6]},callisto:{parent:"jupiter",el:[1882700,.007,43.8,80.424,.3,309.1,16.68901925,277.921,577.264],plane:[268.7,64.8]},titan:{parent:"saturn",el:[1221900,.029,78.3,14.599,.3,78.6,15.94585901,346.68,687.37],plane:[36.4,84]},triton:{parent:"neptune",el:[354800,0,0,236.137,157.3,177.7,5.87657946,675.2,688],plane:[299.36,43.46]},charon:{parent:"pluto",el:[19600,0,0,304.131,0,0,6.38722222,0,0],plane:[132.993,-6.163]}},Se={sun:{ra:[286.13,0],dec:[63.87,0],w:[84.176,14.1844]},mercury:{ra:[281.0103,-.0328],dec:[61.4155,-.0049],w:[329.5988,6.1385108]},venus:{ra:[272.76,0],dec:[67.16,0],w:[160.2,-1.4813688]},earth:{ra:[0,-.641],dec:[90,-.557],w:[190.147,360.9856235]},moon:{ra:[269.9949,.0031],dec:[66.5392,.013],w:[38.3213,13.17635815]},mars:{ra:[317.68143,-.1061],dec:[52.8865,-.0609],w:[176.63,350.89198226]},phobos:{ra:[317.68,-.108],dec:[52.9,-.061],w:[35.06,1128.844585]},deimos:{ra:[316.65,-.108],dec:[53.52,-.061],w:[79.41,285.161897]},jupiter:{ra:[268.056595,-.006499],dec:[64.495303,.002413],w:[284.95,870.536]},io:{ra:[268.05,-.009],dec:[64.5,.003],w:[200.39,203.4889538]},europa:{ra:[268.08,-.009],dec:[64.51,.003],w:[36.022,101.3747235]},ganymede:{ra:[268.2,-.009],dec:[64.57,.003],w:[44.064,50.3176081]},callisto:{ra:[268.72,-.009],dec:[64.83,.003],w:[259.51,21.5710715]},saturn:{ra:[40.589,-.036],dec:[83.537,-.004],w:[38.9,810.7939024]},titan:{ra:[39.4827,0],dec:[83.4279,0],w:[186.5855,22.5769768]},uranus:{ra:[257.311,0],dec:[-15.175,0],w:[203.81,-501.1600928]},neptune:{ra:[299.36,0],dec:[43.46,0],w:[249.978,541.1397757]},triton:{ra:[299.36,0],dec:[41.17,0],w:[296.53,-61.2572637]},pluto:{ra:[132.993,0],dec:[-6.163,0],w:[302.695,56.3625225]},charon:{ra:[132.993,0],dec:[-6.163,0],w:[122.695,56.3625225]},ceres:{ra:[291.418,0],dec:[66.764,0],w:[170.65,952.1532]}},Q={sun:{parent:null,radius:695700},mercury:{parent:"sun",radius:2439.7},venus:{parent:"sun",radius:6051.8},earth:{parent:"sun",radius:6371},moon:{parent:"earth",radius:1737.4},mars:{parent:"sun",radius:3389.5},phobos:{parent:"mars",radius:11.08},deimos:{parent:"mars",radius:6.27},ceres:{parent:"sun",radius:469.7},jupiter:{parent:"sun",radius:69911},io:{parent:"jupiter",radius:1821.6},europa:{parent:"jupiter",radius:1560.8},ganymede:{parent:"jupiter",radius:2634.1},callisto:{parent:"jupiter",radius:2410.3},saturn:{parent:"sun",radius:58232},titan:{parent:"saturn",radius:2574.7},uranus:{parent:"sun",radius:25362},neptune:{parent:"sun",radius:24622},triton:{parent:"neptune",radius:1353.4},pluto:{parent:"sun",radius:1188.3},charon:{parent:"pluto",radius:606}};function He(e,t){let n=e+t*Math.sin(e);for(let s=0;s<12;s++){const r=(e-(n-t*Math.sin(n)))/(1-t*Math.cos(n));if(n+=r,Math.abs(r)<1e-12)break}return n}d(He,"eccentricAnomaly");function rt(e,t,n,s,r,o){const i=((n%360+540)%360-180)*U,a=He(i,t),l=e*(Math.cos(a)-t),c=e*Math.sqrt(1-t*t)*Math.sin(a),u=Math.cos(s*U),h=Math.sin(s*U),f=Math.cos(o*U),M=Math.sin(o*U),b=Math.cos(r*U),m=Math.sin(r*U);return[(u*f-h*M*b)*l+(-h*f-u*M*b)*c,(u*M+h*f*b)*l+(-h*M+u*f*b)*c,h*m*l+u*m*c]}d(rt,"orbitPoint");function Xt(e,t){const n=tt[e],s=t/36525,[r,o,i,a,l,c]=n.el.map((f,M)=>f+n.rate[M]*s);let u=a-l;if(n.extra){const[f,M,b,m]=n.extra;u+=f*s*s+M*Math.cos(m*s*U)+b*Math.sin(m*s*U)}const h=rt(r,o,u,l-c,i,c);return[h[0]*H,h[1]*H,h[2]*H]}d(Xt,"planetPosition");function $e(e,t){const[n,s,r,o,i,a,l,c]=et[e],u=rt(s,r,l+c*(t+Wt-n),a,o,i);return[u[0]*H,u[1]*H,u[2]*H]}d($e,"smallBodyPosition");function mt([e,t,n]){const s=Math.cos(Kt),r=Math.sin(Kt);return[e,s*t+r*n,-r*t+s*n]}d(mt,"eqToEcl");function yt([e,t,n],s,r){const o=Math.sin(r*U),i=Math.cos(r*U),a=o*t-i*n,l=i*t+o*n,c=Math.cos((s+90)*U),u=Math.sin((s+90)*U);return[c*e-u*a,u*e+c*a,l]}d(yt,"planeToIcrf");function xt(e,t){if(e==="moon"){const w=we(t),g=Math.cos(w.b);return[w.dist*g*Math.cos(w.l),w.dist*g*Math.sin(w.l),w.dist*Math.sin(w.b)]}const{el:n,plane:s}=Ct[e],[r,o,i,a,l,c,u,h,f]=n,M=t/365.25,b=c-(f?Math.sign(Math.cos(l*U))*(360*M)/f:0),m=i+(h?360*M/h:0);return mt(yt(rt(r,o,a+360*t/u-b-m,m,l,b),s[0],s[1]))}d(xt,"moonOffset");function Ot(e,t){var i;const n=_t(t);if(e==="sun")return[0,0,0];if(e==="earth"){const a=Xt("emb",n),l=xt("moon",n),c=1/(1+Ge);return[a[0]-l[0]*c,a[1]-l[1]*c,a[2]-l[2]*c]}if(tt[e])return Xt(e,n);if(et[e])return $e(e,n);const s=(i=Q[e])==null?void 0:i.parent;if(!s)return null;const r=Ot(s,t);if(!r)return null;const o=xt(e,n);return[r[0]+o[0],r[1]+o[1],r[2]+o[2]]}d(Ot,"heliocentric");function Ve(e,t,n="sun"){var o;if(((o=Q[e])==null?void 0:o.parent)===n&&n!=="sun")return xt(e,_t(t));const s=Ot(e,t),r=Ot(n,t);return s&&r?[s[0]-r[0],s[1]-r[1],s[2]-r[2]]:null}d(Ve,"position");const gt=d(([e,t,n])=>[e,n,-t],"toScene");function qe(e){const t=new Set;for(let n=0;n<e;n++)t.add(-.5+n/e);for(let n=-100;n<=100;n++)t.add(n/36e3);for(let n=-50;n<=50;n++)t.add(n/18e5);return[...t].sort((n,s)=>n-s)}d(qe,"orbitSamples");function Pn(e,t,n=256){var a,l;if(!((a=Q[e])==null?void 0:a.parent))return null;const r=_t(t),o=qe(n);if(tt[e]||e==="earth"){const u=tt[e==="earth"?"emb":e],h=r/36525,[f,M,b,m,w,g]=u.el.map((y,p)=>y+u.rate[p]*h);let v=m-w;if(u.extra){const[y,p,_,A]=u.extra;v+=y*h*h+p*Math.cos(A*h*U)+_*Math.sin(A*h*U)}return o.map(y=>rt(f,M,v+360*y,w-g,b,g).map(p=>p*H))}if(et[e]){const[c,u,h,f,M,b,m,w]=et[e],g=m+w*(r+Wt-c);return o.map(v=>rt(u,h,g+360*v,b,f,M).map(y=>y*H))}const i=((l=Ze(e))==null?void 0:l.orbit)??1;return o.map(c=>xt(e,r+i*c))}d(Pn,"orbitPath");function Ye(e,t){const n=Se[e];if(!n)return null;const s=_t(t),r=s/36525;let o=n.ra[0]+n.ra[1]*r,i=n.dec[0]+n.dec[1]*r,a=n.w[0]+n.w[1]*s;if(e==="moon"){const u=(125.045-.0529921*s)*U;o-=3.8787*Math.sin(u),i+=1.5419*Math.cos(u),a+=3.561*Math.sin(u)}if(e==="neptune"){const u=(357.85+52.316*r)*U;o+=.7*Math.sin(u),i-=.51*Math.cos(u),a-=.48*Math.sin(u)}a=(a%360+360)%360;const l=Math.cos(a*U),c=Math.sin(a*U);return{x:mt(yt([l,c,0],o,i)),y:mt(yt([-c,l,0],o,i)),z:mt(yt([0,0,1],o,i))}}d(Ye,"orientation");function Qt(e,t){const n=Ye(e,t);return n?{x:gt(n.y),y:gt(n.z),z:gt(n.x)}:null}d(Qt,"sphereAxes");function Ze(e){const t=Se[e];if(!t)return null;let n=null;return tt[e]||e==="earth"?n=36525*360/tt[e==="earth"?"emb":e].rate[3]:et[e]?n=360/et[e][7]:Ct[e]?n=Ct[e].el[6]:e==="moon"&&(n=27.321661),{day:24*360/t.w[1],orbit:n}}d(Ze,"periods");const Je={both:0,horizontal:1,vertical:2,diagonal:3,hexagonal:4,dots:5,polar:6},Ke=`
attribute vec2 surf;
varying vec2 vSurf;
void main() {
  vSurf = surf;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Xe=`
precision highp float;
${Fe}
varying vec2 vSurf;
uniform float uMul;
// 1: polar rings and spokes from the plane coordinates (a flat disc)
uniform bool uPlanePolar;
// 1: the scan band rings out from the polar centre (a disc's ping) instead of sweeping t
uniform bool uScanRadial;
uniform float uOpacity;
void main() {
  acc = vec4( 0.0 );
  gMul = uMul * uOpacity;
  vec2 p = vSurf;
  float kx = 1.0 / max( derivLen( p.x ), 1e-6 );
  float ky = 1.0 / max( derivLen( p.y ), 1e-6 );
  if ( uPlanePolar ) {
    vec2 q = p - uPolarC;
    float r = length( q );
    vec2 gx = dFdx( p );
    vec2 gy = dFdy( p );
    float det = gx.x * gy.y - gy.x * gx.y;
    mat2 toPx = mat2( gy.y, -gx.y, -gy.x, gx.x ) / ( abs( det ) > 1e-12 ? det : 1e-12 );
    vec2 e = r > 1e-6 ? q / r : vec2( 1.0, 0.0 );
    gPolar = vec4( r, atan( q.y, q.x ), length( toPx * e ), length( toPx * vec2( -e.y, e.x ) ) );
  }
  float scanV = p.y;
  float scanK = ky;
  if ( uScanRadial && uPlanePolar ) {
    scanV = gPolar.x;
    scanK = gPolar.z;
  }
  drawHit( p - uScroll, kx, ky, scanV, scanK );
  if ( acc.a <= 0.0 ) discard;
  gl_FragColor = acc;
}`;function Qe(e){var n;const t=e.color??[1,.6,.4,.5];return{uScroll:{value:new X},uPattern:{value:Je[e.pattern??"both"]??0},uCell:{value:new X(...e.cell??[10,10])},uCount:{value:new X(0,0)},uMajorRow:{value:Math.max(0,e.majorRow??0)},uMajorCol:{value:Math.max(0,e.majorCol??0)},uBorder:{value:true},uWidthMinor:{value:e.widthMinor??1},uWidthMajor:{value:e.widthMajor??2},uSpacing:{value:e.spacing??((n=e.cell)==null?void 0:n[0])??10},uHexR:{value:e.hexRadius??10},uDotR:{value:e.dotRadius??1},uColor:{value:t},uColorMajor:{value:e.colorMajor??t},uFill:{value:e.fill??[0,0,0,0]},uScan:{value:[0,0,0,0]},uScanZ:{value:0},uScanStrength:{value:0},uPolarC:{value:new X},uSpokes:{value:e.spokes??12},uSpokeOff:{value:0},uPlanePolar:{value:!!e.planePolar},uScanRadial:{value:false},uOpacity:{value:e.opacity??1}}}d(Qe,"gridUniforms");function tn(e,t){const n=Qe(t),s=Math.max(0,Math.min(1,t.back??.25)),r=d((a,l)=>new de({uniforms:{...n,uMul:{value:l}},vertexShader:Ke,fragmentShader:Xe,side:a,transparent:true,premultipliedAlpha:true,depthTest:true,depthWrite:false,blending:t.additive?he:ze}),"make"),o=new ue;if(s>0){const a=new jt(e,r(Ee,s));a.renderOrder=1,o.add(a)}const i=new jt(e,r(Ue,1));return i.renderOrder=2,o.add(i),o.userData.uniforms=n,o}d(tn,"gridFace");function en(e){var l;const t=e.userData.uniforms,n=(l=e.children[0])==null?void 0:l.geometry,s=n==null?void 0:n.getAttribute("surf"),r=!!(t!=null&&t.uPlanePolar.value),o=(t==null?void 0:t.uPolarC.value)??{x:0,y:0};let i=1/0,a=-1/0;for(let c=0;c<((s==null?void 0:s.count)??0);c++){const u=r?Math.hypot(s.getX(c)-o.x,s.getY(c)-o.y):s.getY(c);i=Math.min(i,u),a=Math.max(a,u)}return a>=i?r?{from:0,to:a,radial:r}:{from:a,to:i,radial:r}:{from:0,to:0,radial:r}}d(en,"scanRange");function nn(e,t,n,s){const r=e.userData.uniforms;r&&(r.uScanRadial.value=t.radial,r.uScanStrength.value=s,r.uScanZ.value=t.from+(t.to-t.from)*n)}d(nn,"setScan");const ot={grid:"theme:colors.ui.tertiary",line:"theme:colors.ui.secondary",volume:"var(--lcars-blue, var(--lcards-blue-medium))",path:"var(--lcars-orange, var(--lcards-orange-medium))",fill:"black",glow:"var(--lcards-moonlight)",nebula:"var(--lcars-violet, var(--lcards-blue-medium))",stars:"var(--lcards-moonlight)",scan:"var(--lcards-moonlight)",model:"var(--lcars-blue, var(--lcards-blue-medium))",modelRim:"var(--lcards-moonlight)",pulse:"var(--lcards-moonlight)"};function sn(e,t,n={}){const s=x(e.spin,0);return{id:String(e.id??""),type:String(e.type),config:e,node:t,spin:s,occludes:false,pickMeshes:[],points:[],lines:[],gridFaces:[],update:null,dynamic:false,tick:null,...n}}d(sn,"built");function Dn(e,t,n){var r;let s=false;for(const o of e)o.spin&&(o.node.rotation.y+=nt.degToRad(o.spin)*(t/1e3),s=true),(r=o.tick)!=null&&r.call(o,t,n)&&(s=true);return s}d(Dn,"stepObjects");function Y(e){return e&&typeof e=="object"&&!Array.isArray(e)?e:{}}d(Y,"sub");function rn(e,t){return e==null?t:e!==false}d(rn,"isOn");function on(e){return x(Y(e.major).line_width,Math.max(1.5,x(e.line_width,1)*1.5))}d(on,"majorWidth");function x(e,t){const n=Number(e);return e!=null&&e!==""&&Number.isFinite(n)?n:t}d(x,"num");function ct(e,t){return Array.isArray(e)&&e.length>=2?[x(e[0],t[0]),x(e[1],t[1])]:e!==void 0&&Number.isFinite(Number(e))?[Number(e),Number(e)]:t}d(ct,"pair");function jn(e,t){const n=Array.isArray(t.rotation)?t.rotation:null;e.rotation.order="YXZ",n&&e.rotation.set(nt.degToRad(x(n[0],0)),-nt.degToRad(x(n[1],0)),nt.degToRad(x(n[2],0)))}d(jn,"applyRotation");function Bn(e){var i;const t=(i=e.config)==null?void 0:i.body;if(t==null||t===""||!Qt(String(t),0))return;e.spin=0,e.moving=true;const n=new St,s=new P,r=new P,o=new P;e.onDate=a=>{const l=Qt(String(t),a);l&&(n.makeBasis(s.fromArray(l.x),r.fromArray(l.y),o.fromArray(l.z)),e.node.quaternion.setFromRotationMatrix(n))}}d(Bn,"bodyTurn");function Ft(e,t){return[e[0],e[1],e[2],(e[3]??1)*t]}d(Ft,"withOpacity");function Tn(e){e.traverse(t=>{var r,o,i,a,l;const n=t;(o=(r=n.geometry)==null?void 0:r.dispose)==null||o.call(r);const s=Array.isArray(n.material)?n.material:n.material?[n.material]:[];for(const c of s)(a=(i=c.map)==null?void 0:i.dispose)==null||a.call(i),(l=c.dispose)==null||l.call(c)})}d(Tn,"disposeNode");function Cn(e,t,n){const s=x(e.opacity,1),r=t.color(e.color,ot.grid),o=Y(e.major),i=o.color!==void 0?t.color(o.color,ot.grid):[r[0],r[1],r[2],Math.min(1,(r[3]??1)*1.6)];return{pattern:n.pattern??e.pattern??"both",cell:n.cell,majorRow:n.majorRow??x(o.row_interval,0),majorCol:n.majorCol??x(o.col_interval,0),widthMinor:x(e.line_width,1),widthMajor:on(e),color:r,colorMajor:i,fill:Y(e.fill).color!==void 0?t.color(Y(e.fill).color,"transparent"):void 0,spokes:x(e.spoke_count,12),spacing:n.cell[0],hexRadius:x(e.hex_radius,n.cell[0]),dotRadius:x(e.dot_radius,n.cell[0]*.08),planePolar:n.planePolar,back:x(e.back_opacity,n.back??.25),opacity:s,additive:e.blend==="add"}}d(Cn,"gridLook");function an(e,t,n){const s=Y(e.scan),r=x(s.period,0);if(!(r>0)||!n.length)return null;const o=t.color(s.color,ot.scan),i=n.map(a=>({face:a,range:en(a)}));for(const{face:a}of i)a.userData.uniforms.uScan.value=Ft(o,x(e.opacity,1));return(a,l)=>{const{pos:c,strength:u}=Le(l,r);for(const{face:h,range:f}of i)nn(h,f,c,u);return true}}d(an,"scanTicker");function On(...e){const t=e.filter(Boolean);return t.length<2?t[0]??null:(n,s)=>{let r=false;for(const o of t)o(n,s)&&(r=true);return r}}d(On,"combineTicks");function Fn(e,t,n){const s=Y(e.fill).effect;return s?t.effects?t.effects.fillMaterial(s,t,n):(ye.warn(`[Astrometrics] fill.effect on '${e.id??e.type}' skipped: the effects chunk is not loaded`),null):null}d(Fn,"fillFor");const R=Math.PI/180;function K(e,t){return[e*Math.sin(t*R),-e*Math.cos(t*R)]}d(K,"bearingXZ");function te(e,t,n,s=new P){const r=Math.cos(t*R);return s.set(n*r*Math.sin(e*R),n*Math.sin(t*R),-n*r*Math.cos(e*R))}d(te,"altazToLocal");function cn(e,t,n,s=new P){const r=Math.cos(e*R);return s.set(n*r*Math.sin(t*R),n*Math.sin(e*R),n*r*Math.cos(t*R))}d(cn,"latlonToLocal");function Ln(e){if(!/^[A-Z]+$/i.test(e))return-1;let t=0;for(const n of e.toUpperCase())t=t*26+(n.charCodeAt(0)-64);return t-1}d(Ln,"lettersToIndex");function In(e){let t=e+1,n="";for(;t>0;){const s=(t-1)%26;n=String.fromCharCode(65+s)+n,t=Math.floor((t-1)/26)}return n}d(In,"indexToLetters");function Nn(e){const t=/^([A-Z]+)(-?\d+)$/i.exec(String(e??"").trim());return t?{col:t[1].toUpperCase(),row:Number(t[2])}:null}d(Nn,"parseCell");const ln=["xyz","polar","latlon","altaz"];function ee(e){for(const t of ln){const n=e==null?void 0:e[t];if(n&&typeof n=="object"&&!Array.isArray(n))return{form:t,binding:n}}return null}d(ee,"pointBinding");const Rt=class Rt2{constructor({points:t=[],hosts:n=new Map,sky:s=d(()=>null,"sky"),frame:r=d(()=>null,"frame"),date:o=d(()=>Date.now(),"date"),units:i=d(()=>{},"units")}={}){this.defs=new Map;for(const a of t)a!=null&&a.id&&this.defs.set(String(a.id),a);this.hosts=n,this.sky=s,this.frame=r,this.date=o,this.units=i,this._cache=new Map,this._warned=new Set,this.configs=new Map(this.defs)}replaceDef(t,n){this.defs.set(t,{...n,id:t}),this.configs.set(t,{...n,id:t}),this._cache.clear()}setPosition(t,n,s){const r=this.defs.get(t);return r?(this.defs.set(t,{...r,[n]:s??void 0,_bound:true}),this._cache.clear(),true):false}has(t){return this.defs.has(t)}invalidate(){this._cache.clear()}resolve(t){return Array.isArray(t)?t.length>=3&&t.every(Number.isFinite)?new P(t[0],t[1],t[2]):null:typeof t=="string"?this.get(t):null}get(t){return this._get(t,new Set)}isDynamic(t,n=new Set){var r;if(typeof t!="string")return false;const s=this.defs.get(t);return!s||n.has(t)?false:(n.add(t),s.sky||s.body||ee(this.configs.get(t)??s)||s._bound||s.object&&((r=this.hosts.get(s.object))!=null&&r.moving)?true:s.at?this.isDynamic(s.at,n):false)}_get(t,n){if(this._cache.has(t))return this._cache.get(t);const s=this.defs.get(t);if(!s)return null;if(n.has(t))return this._warn(t,`point '${t}' refers back to itself (${[...n,t].join(" > ")})`),null;n.add(t);const r=this._place(s,n);if(r&&Array.isArray(s.offset)&&s.offset.length>=3){const o=this.frame(s._system),i=o?o.matrixWorld.getMaxScaleOnAxis():1;r.add(new P(+s.offset[0]||0,+s.offset[1]||0,+s.offset[2]||0).multiplyScalar(i))}return n.delete(t),this._cache.set(t,r),r}_place(t,n){var a,l;const s=t.object?this.hosts.get(t.object):void 0;if(t.object&&!s)return this._warn(t.id,`point '${t.id}': no object '${t.object}'`),null;if(s!=null&&s.ready&&!s.ready())return null;if(t.part!==void 0&&t.part!==null&&t.part!==""){if(!(s!=null&&s.partNode))return this._warn(t.id,`point '${t.id}': part '${t.part}' needs a model object`),null;const c=s.partNode(String(t.part));if(!c)return null;const u=Array.isArray(t.xyz)?t.xyz:[0,0,0];return new P(+u[0]||0,+u[1]||0,+u[2]||0).applyMatrix4(c.matrixWorld)}const r=s?null:this.frame(t._system),o=d(c=>s?(s.warp?s.warp(c):c).applyMatrix4(s.node.matrixWorld):r?c.applyMatrix4(r.matrixWorld):c,"world"),i=((s==null?void 0:s.radius)??1)+(Number(t.alt)||0);if(Array.isArray(t.xyz))return o(new P(+t.xyz[0]||0,+t.xyz[1]||0,+t.xyz[2]||0));if(Array.isArray(t.polar)){const[c,u]=K(+t.polar[0]||0,+t.polar[1]||0);return o(new P(c,Number(t.alt)||0,u))}if(Array.isArray(t.latlon))return o(cn(+t.latlon[0]||0,+t.latlon[1]||0,i));if(Array.isArray(t.altaz))return o(te(+t.altaz[0]||0,+t.altaz[1]||0,i));if(t.sky){const c=(a=this.sky())==null?void 0:a[t.sky];return c?o(te(c.azimuth,c.altitude,i)):null}if(t.body!==void 0){const c=this._body(t);return c?o(c):null}if(t.cell){const c=((l=s==null?void 0:s.cellPoint)==null?void 0:l.call(s,t.cell))??null;return c||this._warn(t.id,`point '${t.id}': no cell '${t.cell}'${t.object?` on '${t.object}'`:""}`),c?o(c.clone()):null}if(t.at){const c=this._get(t.at,n);return c?c.clone():null}return t._bound||ee(t)||this._warn(t.id,`point '${t.id}' has no position (xyz, polar, latlon, altaz, sky, body, at or cell)`),null}_body(t){const n=String(t.body),s=t.center!==void 0&&t.center!==null&&t.center!==""?String(t.center):"sun";if(!Q[n]||!Q[s])return this._warn(t.id,`point '${t.id}': no body '${Q[n]?s:n}'`),null;const r=Ve(n,this.date(),s);return r?new P(...gt(r)).multiplyScalar(1/this.kmPerUnit(t._system,t.id)):null}kmPerUnit(t,n=""){const s=Ie(this.units(t));return s===null?(this._warn(`units:${t??""}`,`${t?`system '${t}'`:"the scene"} has no units (km, au, ...): body point '${n}' reads it as au`),H):s}_warn(t,n){this._warned.has(t)||(this._warned.add(t),ye.warn(`[Astrometrics] ${n}`))}};d(Rt,"Placements");let ne=Rt;const at=Math.PI/180;function $(e,t,n){e=Math.max(1,Math.round(e)),t=Math.max(1,Math.round(t));const s=new Float32Array((e+1)*(t+1)*3),r=new Float32Array((e+1)*(t+1)*2);let o=0;for(let c=0;c<=t;c++)for(let u=0;u<=e;u++,o++){const[h,f,M,b,m]=n(u/e,c/t);s[o*3]=h,s[o*3+1]=f,s[o*3+2]=M,r[o*2]=b,r[o*2+1]=m}const i=new(e*t*6>65535?Uint32Array:Uint16Array)(e*t*6);let a=0;for(let c=0;c<t;c++)for(let u=0;u<e;u++){const h=c*(e+1)+u,f=h+1,M=h+e+1,b=M+1;i[a++]=h,i[a++]=M,i[a++]=f,i[a++]=f,i[a++]=M,i[a++]=b}const l=new fe;return l.setAttribute("position",new st(s,3)),l.setAttribute("surf",new st(r,2)),l.setIndex(new st(i,1)),l.computeBoundingSphere(),l}d($,"surfaceGeometry");const un=d((e=32)=>Math.max(e,32),"segs");function kn(e,t,n=1){const s=Math.max(8*n,Math.min(96,Math.round(32*Math.max(1,e/t)))),r=Math.max(8*n,Math.min(96,Math.round(32*Math.max(1,t/e))));return $(s,r,(o,i)=>{const a=(o-.5)*e,l=(i-.5)*t;return[a,0,l,a,l]})}d(kn,"planeGeometry");function dn({r0:e=0,r1:t,a0:n=0,a1:s=360,y:r=0,detail:o=1}){const i=Math.max(8,Math.ceil(Math.abs(s-n)/3.75)),a=Math.max(4,Math.min(48*o,Math.ceil((t-e)/Math.max(t,1e-6)*un()*o)));return $(i,a,(l,c)=>{const u=(s-l*(s-n))*at,h=e+c*(t-e),f=h*Math.sin(u),M=-h*Math.cos(u);return[f,r,M,f,M]})}d(dn,"discGeometry");function Wn({radius:e,lat0:t=-90,lat1:n=90,around:s=1,detail:r=1}){const o=Math.max(8,Math.ceil(Math.abs(n-t)/5.625*r));return $(64,o,(i,a)=>{const l=(1-i)*2*Math.PI,c=(t+a*(n-t))*at,u=Math.cos(c);return[e*u*Math.sin(l),e*Math.sin(c),e*u*Math.cos(l),l*e*s,c*e]})}d(Wn,"sphereGeometry");function Rn({radius:e,around:t=1,detail:n=1}){return $(96,24*n,(s,r)=>{const o=s*2*Math.PI,i=r*Math.PI/2,a=Math.cos(i);return[e*a*Math.sin(o),e*Math.sin(i),-e*a*Math.cos(o),o*e*t,i*e]})}d(Rn,"domeGeometry");function hn({radius:e,y0:t,y1:n,a0:s=0,a1:r=360,around:o=1,detail:i=1}){const a=Math.max(8,Math.ceil(Math.abs(r-s)/3.75)),l=Math.max(i>1?32:2,Math.min(48*i,Math.ceil(Math.abs(n-t)/Math.max(e,1e-6)*8*i)));return $(a,l,(c,u)=>{const h=(s+c*(r-s))*at,f=t+u*(n-t);return[e*Math.sin(h),f,-e*Math.cos(h),h*e*o,f]})}d(hn,"cylinderGeometry");function Gn({profile:e,depth:t,around:n=1,detail:s=1}){const r=e.length-1,o=e[r],i=t/r,a=[0];for(let c=1;c<=r;c++)a.push(a[c-1]+Math.hypot(i,e[c]-e[c-1]));const l=d(c=>{const u=c*r,h=Math.min(r-1,Math.floor(u)),f=u-h;return[e[h]+(e[h+1]-e[h])*f,a[h]+(a[h+1]-a[h])*f]},"at");return $(96,Math.max(8,Math.min(r,32*s)),(c,u)=>{const h=c*2*Math.PI,[f,M]=l(u);return[f*Math.sin(h),-t+u*t,-f*Math.cos(h),h*o*n,M]})}d(Gn,"wellGeometry");function fn({r0:e,r1:t,a:n,y0:s,y1:r}){const o=Math.sin(n*at),i=-Math.cos(n*at);return $(16,8,(a,l)=>{const c=e+a*(t-e),u=s+l*(r-s);return[c*o,u,c*i,c,u]})}d(fn,"radialWallGeometry");function Et(e,t,n){const s=Math.max(4,Math.min(64,Math.round(16*Math.max(1,e/Math.max(t,1e-6))))),r=Math.max(4,Math.min(64,Math.round(16*Math.max(1,t/Math.max(e,1e-6)))));return $(s,r,(o,i)=>{const a=(o-.5)*e,l=(i-.5)*t;return[...n(a,l),a,l]})}d(Et,"rectGeometry");function Hn(e,t){if(!(t>0)||!(e>0))return 1;const n=2*Math.PI*e;return Math.max(1,Math.round(n/t))*t/n}d(Hn,"aroundScale");function pn(e,t){const n=e.map(([a,l])=>new X(a,l)),s=Pe.triangulateShape(n,[]),r=new Float32Array(e.length*3),o=new Float32Array(e.length*2);e.forEach(([a,l],c)=>{r.set([a,t,l],c*3),o.set([a,l],c*2)});const i=new fe;return i.setAttribute("position",new st(r,3)),i.setAttribute("surf",new st(o,2)),i.setIndex(s.flat()),i.computeBoundingSphere(),i}d(pn,"polygonGeometry");function mn({a:e,b:t,y0:n,y1:s,s0:r=0}){const o=Math.hypot(t[0]-e[0],t[1]-e[1]);return $(Math.max(1,Math.min(64,Math.ceil(o/Math.max(1e-6,s-n||o)*4))),4,(i,a)=>[e[0]+(t[0]-e[0])*i,n+(s-n)*a,e[1]+(t[1]-e[1])*i,r+o*i,n+(s-n)*a])}d(mn,"wallGeometry");const se=new kt,lt=new P,Gt=class Gt2 extends De{constructor(){super(),this.isLineSegmentsGeometry=true,this.type="LineSegmentsGeometry";const t=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],n=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],s=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(s),this.setAttribute("position",new Yt(t,3)),this.setAttribute("uv",new Yt(n,2))}applyMatrix4(t){const n=this.attributes.instanceStart,s=this.attributes.instanceEnd;return n!==void 0&&(n.applyMatrix4(t),s.applyMatrix4(t),n.needsUpdate=true),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(t){let n;t instanceof Float32Array?n=t:Array.isArray(t)&&(n=new Float32Array(t));const s=new Mt(n,6,1);return this.setAttribute("instanceStart",new q(s,3,0)),this.setAttribute("instanceEnd",new q(s,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(t){let n;t instanceof Float32Array?n=t:Array.isArray(t)&&(n=new Float32Array(t));const s=new Mt(n,6,1);return this.setAttribute("instanceColorStart",new q(s,3,0)),this.setAttribute("instanceColorEnd",new q(s,3,3)),this}fromWireframeGeometry(t){return this.setPositions(t.attributes.position.array),this}fromEdgesGeometry(t){return this.setPositions(t.attributes.position.array),this}fromMesh(t){return this.fromWireframeGeometry(new je(t.geometry)),this}fromLineSegments(t){const n=t.geometry;return this.setPositions(n.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new kt);const t=this.attributes.instanceStart,n=this.attributes.instanceEnd;t!==void 0&&n!==void 0&&(this.boundingBox.setFromBufferAttribute(t),se.setFromBufferAttribute(n),this.boundingBox.union(se))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pe),this.boundingBox===null&&this.computeBoundingBox();const t=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(t!==void 0&&n!==void 0){const s=this.boundingSphere.center;this.boundingBox.getCenter(s);let r=0;for(let o=0,i=t.count;o<i;o++)lt.fromBufferAttribute(t,o),r=Math.max(r,s.distanceToSquared(lt)),lt.fromBufferAttribute(n,o),r=Math.max(r,s.distanceToSquared(lt));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}};d(Gt,"LineSegmentsGeometry");let wt=Gt;pt.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new X},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};ft.line={uniforms:me.merge([pt.common,pt.fog,pt.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		float trimSegmentAlpha( const in vec4 start, const in vec4 end ) {

			// compute the interpolation factor needed to trim the segment so it terminates
			// between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column

			// we need different nearEstimate formula for reversed and default depth buffer
			// a is positive with a reversed depth buffer so it can be used for controlling the code flow
			float nearEstimate = ( a > 0.0 ) ? ( - b / ( a + 1.0 ) ) : ( - 0.5 * b / a );

			return ( nearEstimate - start.z ) / ( end.z - start.z );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef USE_DASH

				float lineDistanceStart = dashScale * instanceDistanceStart;
				float lineDistanceEnd = dashScale * instanceDistanceEnd;

			#endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( start, end );
					end.xyz = mix( start.xyz, end.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceEnd = mix( lineDistanceStart, lineDistanceEnd, alpha );

					#endif

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( end, start );
					start.xyz = mix( end.xyz, start.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceStart = mix( lineDistanceEnd, lineDistanceStart, alpha );

					#endif

				}

			}

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? lineDistanceStart : lineDistanceEnd;
				vUv = uv;

			#endif

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};const Ht=class Ht2 extends de{constructor(t){super({type:"LineMaterial",uniforms:me.clone(ft.line.uniforms),vertexShader:ft.line.vertexShader,fragmentShader:ft.line.fragmentShader,clipping:true}),this.isLineMaterial=true,this.setValues(t)}get color(){return this.uniforms.diffuse.value}set color(t){this.uniforms.diffuse.value=t}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(t){t===true!==this.worldUnits&&(this.needsUpdate=true),t===true?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(t){this.uniforms.linewidth&&(this.uniforms.linewidth.value=t)}get dashed(){return"USE_DASH"in this.defines}set dashed(t){t===true!==this.dashed&&(this.needsUpdate=true),t===true?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(t){this.uniforms.dashScale.value=t}get dashSize(){return this.uniforms.dashSize.value}set dashSize(t){this.uniforms.dashSize.value=t}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(t){this.uniforms.dashOffset.value=t}get gapSize(){return this.uniforms.gapSize.value}set gapSize(t){this.uniforms.gapSize.value=t}get opacity(){return this.uniforms.opacity.value}set opacity(t){this.uniforms&&(this.uniforms.opacity.value=t)}get resolution(){return this.uniforms.resolution.value}set resolution(t){this.uniforms.resolution.value.copy(t)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(t){this.defines&&(t===true!==this.alphaToCoverage&&(this.needsUpdate=true),t===true?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}};d(Ht,"LineMaterial");let bt=Ht;const Ut=new it,re=new P,oe=new P,B=new it,T=new it,N=new it,Pt=new P,Dt=new St,C=new Be,ae=new P,ut=new kt,dt=new pe,k=new it;let W,J;function ie(e,t,n){return k.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),k.multiplyScalar(1/k.w),k.x=J/n.width,k.y=J/n.height,k.applyMatrix4(e.projectionMatrixInverse),k.multiplyScalar(1/k.w),Math.abs(Math.max(k.x,k.y))}d(ie,"getWorldSpaceHalfWidth");function yn(e,t){const n=e.matrixWorld,s=e.geometry,r=s.attributes.instanceStart,o=s.attributes.instanceEnd,i=Math.min(s.instanceCount,r.count);for(let a=0,l=i;a<l;a++){C.start.fromBufferAttribute(r,a),C.end.fromBufferAttribute(o,a),C.applyMatrix4(n);const c=new P,u=new P;W.distanceSqToSegment(C.start,C.end,u,c),u.distanceTo(c)<J*.5&&t.push({point:u,pointOnLine:c,distance:W.origin.distanceTo(u),object:e,face:null,faceIndex:a,uv:null,uv1:null})}}d(yn,"raycastWorldUnits");function gn(e,t,n){const s=t.projectionMatrix,o=e.material.resolution,i=e.matrixWorld,a=e.geometry,l=a.attributes.instanceStart,c=a.attributes.instanceEnd,u=Math.min(a.instanceCount,l.count),h=-t.near;W.at(1,N),N.w=1,N.applyMatrix4(t.matrixWorldInverse),N.applyMatrix4(s),N.multiplyScalar(1/N.w),N.x*=o.x/2,N.y*=o.y/2,N.z=0,Pt.copy(N),Dt.multiplyMatrices(t.matrixWorldInverse,i);for(let f=0,M=u;f<M;f++){if(B.fromBufferAttribute(l,f),T.fromBufferAttribute(c,f),B.w=1,T.w=1,B.applyMatrix4(Dt),T.applyMatrix4(Dt),B.z>h&&T.z>h)continue;if(B.z>h){const y=B.z-T.z,p=(B.z-h)/y;B.lerp(T,p)}else if(T.z>h){const y=T.z-B.z,p=(T.z-h)/y;T.lerp(B,p)}B.applyMatrix4(s),T.applyMatrix4(s),B.multiplyScalar(1/B.w),T.multiplyScalar(1/T.w),B.x*=o.x/2,B.y*=o.y/2,T.x*=o.x/2,T.y*=o.y/2,C.start.copy(B),C.start.z=0,C.end.copy(T),C.end.z=0;const m=C.closestPointToPointParameter(Pt,true);C.at(m,ae);const w=nt.lerp(B.z,T.z,m),g=w>=-1&&w<=1,v=Pt.distanceTo(ae)<J*.5;if(g&&v){C.start.fromBufferAttribute(l,f),C.end.fromBufferAttribute(c,f),C.start.applyMatrix4(i),C.end.applyMatrix4(i);const y=new P,p=new P;W.distanceSqToSegment(C.start,C.end,p,y),n.push({point:p,pointOnLine:y,distance:W.origin.distanceTo(p),object:e,face:null,faceIndex:f,uv:null,uv1:null})}}}d(gn,"raycastScreenSpace");const $t=class $t2 extends jt{constructor(t=new wt,n=new bt({color:Math.random()*16777215})){super(t,n),this.isLineSegments2=true,this.type="LineSegments2"}computeLineDistances(){const t=this.geometry,n=t.attributes.instanceStart,s=t.attributes.instanceEnd,r=new Float32Array(2*n.count);for(let i=0,a=0,l=n.count;i<l;i++,a+=2)re.fromBufferAttribute(n,i),oe.fromBufferAttribute(s,i),r[a]=a===0?0:r[a-1],r[a+1]=r[a]+re.distanceTo(oe);const o=new Mt(r,2,1);return t.setAttribute("instanceDistanceStart",new q(o,1,0)),t.setAttribute("instanceDistanceEnd",new q(o,1,1)),this}raycast(t,n){const s=this.material.worldUnits,r=t.camera;if(r===null&&!s&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.'),s===false&&(this.material.resolution.x===0||this.material.resolution.y===0))return;const o=t.params.Line2!==void 0&&t.params.Line2.threshold||0;W=t.ray;const i=this.matrixWorld,a=this.geometry,l=this.material;J=l.linewidth+o,a.boundingSphere===null&&a.computeBoundingSphere(),dt.copy(a.boundingSphere).applyMatrix4(i);let c;if(s)c=J*.5;else{const h=Math.max(r.near,dt.distanceToPoint(W.origin));c=ie(r,h,l.resolution)}if(dt.radius+=c,W.intersectsSphere(dt)===false)return;a.boundingBox===null&&a.computeBoundingBox(),ut.copy(a.boundingBox).applyMatrix4(i);let u;if(s)u=J*.5;else{const h=Math.max(r.near,ut.distanceToPoint(W.origin));u=ie(r,h,l.resolution)}ut.expandByScalar(u),W.intersectsBox(ut)!==false&&(s?yn(this,n):gn(this,r,n))}onBeforeRender(t){const n=this.material.uniforms;n&&n.resolution&&(t.getViewport(Ut),this.material.uniforms.resolution.value.set(Ut.z,Ut.w))}};d($t,"LineSegments2");let Lt=$t;const Vt=class Vt2 extends bt{constructor(t){super(t),this.vertexShader=this.vertexShader.replace("void main() {",`varying float vPxW;
varying float vPxD;
void main() {`).replace("gl_Position = clip;",`gl_Position = clip;
			#ifdef USE_DASH
				vPxW = clip.w;
				vPxD = vLineDistance * clip.w;
			#endif`),this.fragmentShader=this.fragmentShader.replace("void main() {",`varying float vPxW;
varying float vPxD;
void main() {`).replace("mod( vLineDistance + dashOffset","mod( vPxD / vPxW + dashOffset").replace("gl_FragColor = vec4( diffuseColor.rgb, alpha );",`#ifdef USE_TUBE
				float tx = clamp( vUv.x, -1.0, 1.0 );
				float nz = sqrt( max( 0.0, 1.0 - tx * tx ) );
				float spec = exp( -pow( ( tx + 0.3 ) / 0.16, 2.0 ) );
				diffuseColor.rgb = diffuseColor.rgb * ( 0.18 + 0.82 * nz ) + vec3( 0.55 * spec );
			#endif
			#ifdef USE_SOFT
				alpha *= exp( -3.0 * vUv.x * vUv.x );
			#endif
			gl_FragColor = vec4( diffuseColor.rgb, alpha );`).replace("#include <colorspace_fragment>",`#include <colorspace_fragment>
			#ifdef USE_LIGHTEN
				gl_FragColor = vec4( gl_FragColor.rgb * gl_FragColor.a, gl_FragColor.a );
			#endif`)}};d(Vt,"PxDashLineMaterial");let It=Vt;function Mn(e){let t=0;for(const o of e)t+=Math.max(0,o.length/3-1);const n=new Float64Array(t*6),s=new Uint8Array(t);let r=0;for(const o of e){const i=o.length/3;for(let a=0;a<i-1;a++,r++)n.set(o.slice(a*3,a*3+6),r*6),s[r]=a===0?1:0}return{positions:n,starts:s,count:t}}d(Mn,"runsToSegments");function vn(e,t,n,s,r,o,i){const a=n.elements,l=i==null?void 0:i.elements,c=!!l&&l[11]===-1,u=c?-(l[10]>0?-l[14]/(l[10]+1):-.5*l[14]/l[10]):0,h=d(m=>a[3]*e[m]+a[7]*e[m+1]+a[11]*e[m+2]+a[15],"w"),f=d((m,w,g)=>{const v=e[m]+(e[w]-e[m])*g,y=e[m+1]+(e[w+1]-e[m+1])*g,p=e[m+2]+(e[w+2]-e[m+2])*g,_=a[3]*v+a[7]*y+a[11]*p+a[15];return[(a[0]*v+a[4]*y+a[8]*p+a[12])/_*.5*s,(a[1]*v+a[5]*y+a[9]*p+a[13])/_*.5*r]},"at");let M=0;const b=t.length;for(let m=0;m<b;m++){t[m]&&(M=0);const w=m*6,g=w+3,v=h(w),y=h(g);if(v>1e-6&&y>1e-6){const[p,_]=f(w,g,0),[A,L]=f(w,g,1),O=Math.hypot(A-p,L-_);o[m*2]=M,o[m*2+1]=M+O,M+=O}else if(c&&v>0&&y<=0){const p=(v-u)/(v-y),[_,A]=f(w,g,0),[L,O]=f(w,g,p),j=Math.hypot(L-_,O-A);o[m*2]=M,o[m*2+1]=p>1e-9?M+j/p:M,M+=j}else if(c&&y>0&&v<=0){const p=(y-u)/(y-v),[_,A]=f(w,g,1),[L,O]=f(g,w,p),j=Math.hypot(_-L,A-O);o[m*2]=p>1e-9?M+j-j/p:M,o[m*2+1]=M+j,M+=j}else o[m*2]=M,o[m*2+1]=M}return o}d(vn,"screenDistances");const ce=d(e=>e.map(t=>t<=.04045?t/12.92:((t+.055)/1.055)**2.4),"toLinear"),le=new St,xn=new St,ht=new P,qt=class qt2{constructor(t,n){var o,i,a;this.style=n;const s=Array.isArray(n.dash)&&n.dash.length>=2&&n.dash[0]>0,r=n.color;this.material=new It({color:n.colorTo?16777215:new Te().setRGB(r[0],r[1],r[2],Zt).getHex(),linewidth:n.width??1.5,worldUnits:false,dashed:s,dashSize:s?Number((o=n.dash)==null?void 0:o[0]):1,gapSize:s?Math.max(0,Number(((i=n.dash)==null?void 0:i[1])??((a=n.dash)==null?void 0:a[0]))):1,transparent:true,opacity:(n.opacity??1)*(r[3]??1),vertexColors:!!n.colorTo,depthWrite:false}),n.additive&&(this.material.blending=he),n.tube&&(this.material.defines.USE_TUBE=""),n.soft&&(this.material.defines.USE_SOFT=""),n.lighten&&(this.material.defines.USE_LIGHTEN="",this.material.blending=Ce,this.material.blendEquation=Oe,this.material.blendSrc=Jt,this.material.blendDst=Jt),this.dashed=s,this.geometry=new wt,this.object=new Lt(this.geometry,this.material),this.object.renderOrder=n.renderOrder??3,this.object.frustumCulled=false,this._segs={positions:new Float64Array(0),starts:new Uint8Array(0),count:0},this._abs=new Float64Array(0),this._anchor=[0,0,0],this._moved=false,this._dist=null,this._distBuffer=null,this.setRuns(t)}setRuns(t){const n=Mn(t);if(this._abs=n.positions,this._segs={...n,positions:this._relative(n.positions)},!n.count){this.object.visible=false;return}this.object.visible=true,this.geometry.setPositions(Float32Array.from(this._segs.positions)),this.geometry._maxInstanceCount=void 0,this.style.colorTo&&this.geometry.setColors(this._colors(t)),this.dashed&&(this._dist=new Float32Array(n.count*2),this._distBuffer=new Mt(this._dist,2,1),this.geometry.setAttribute("instanceDistanceStart",new q(this._distBuffer,1,0)),this.geometry.setAttribute("instanceDistanceEnd",new q(this._distBuffer,1,1)))}segmentPositions(){return Float32Array.from(this._segs.positions)}moveSegments(t){const n=this.geometry.getAttribute("instanceStart");!n||n.data.array.length!==t.length||(this._moved=true,n.data.array.set(t),n.data.needsUpdate=true)}_relative(t){const[n,s,r]=this._anchor,o=new Float64Array(t.length);for(let i=0;i<t.length;i+=3)o[i]=t[i]-n,o[i+1]=t[i+1]-s,o[i+2]=t[i+2]-r;return o}anchorTo(t){const n=this._abs;if(this._moved||!this._segs.count||!this.object.visible||!this.object.parent)return false;ht.setFromMatrixPosition(t.matrixWorld).applyMatrix4(xn.copy(this.object.parent.matrixWorld).invert());let s=0,r=1/0;for(let u=0;u<n.length;u+=3){const h=(n[u]-ht.x)**2+(n[u+1]-ht.y)**2+(n[u+2]-ht.z)**2;h<r&&(r=h,s=u)}const[o,i,a]=this._anchor;if(Math.hypot(n[s]-o,n[s+1]-i,n[s+2]-a)*1e-6<=Math.sqrt(r))return false;this._anchor=[n[s],n[s+1],n[s+2]],this._segs={...this._segs,positions:this._relative(n)};const c=this.geometry.getAttribute("instanceStart");return c&&c.data.array.length===this._segs.positions.length?(c.data.array.set(this._segs.positions),c.data.needsUpdate=true):this.geometry.setPositions(Float32Array.from(this._segs.positions)),this.geometry.computeBoundingSphere(),this.object.position.set(this._anchor[0],this._anchor[1],this._anchor[2]),this.object.updateMatrixWorld(),true}_colors(t){const n=ce(this.style.color.slice(0,3)),s=ce((this.style.colorTo??this.style.color).slice(0,3)),r=new Float32Array(this._segs.count*6);let o=0;for(const i of t){const a=i.length/3;for(let l=0;l<a-1;l++,o++)for(let c=0;c<2;c++){const u=a>1?(l+c)/(a-1):0;for(let h=0;h<3;h++)r[o*6+c*3+h]=n[h]+(s[h]-n[h])*u}}return r}setResolution(t,n){this.material.resolution.set(t,n)}updateDashes(t,n,s){this.anchorTo(t),!(!this.dashed||!this._dist||!this._distBuffer||!this._segs.count||!this.object.visible)&&(le.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse).multiply(this.object.matrixWorld),vn(this._segs.positions,this._segs.starts,le,n,s,this._dist,t.projectionMatrix),this._distBuffer.needsUpdate=true)}setFlow(t){if(!this.dashed)return;const n=this.material.dashSize+this.material.gapSize;this.material.dashOffset=n>0?-((t%n+n)%n):0}setColor(t,n){this.style={...this.style,color:t,colorTo:n??this.style.colorTo},this.style.colorTo?this._segs.count&&this.geometry.setColors(this._colorsFromSegments()):this.material.color.setRGB(t[0],t[1],t[2],Zt),this.material.opacity=(this.style.opacity??1)*(t[3]??1)}_colorsFromSegments(){const t=[],{positions:n,starts:s,count:r}=this._segs;for(let o=0;o<r;o++)s[o]&&t.push(Array.from(n.subarray(o*6,o*6+3))),t[t.length-1].push(...n.subarray(o*6+3,o*6+6));return this._colors(t)}dispose(){this.geometry.dispose(),this.material.dispose()}};d(qt,"FatLine");let Nt=qt;const wn=Math.PI/180;function bn(e){if(!Array.isArray(e))return null;const t=e.filter(n=>Array.isArray(n)&&n.length>=2&&Number.isFinite(Number(n[0]))&&Number.isFinite(Number(n[1]))).map(n=>[Number(n[0]),Number(n[1])]);return t.length>=3?t:null}d(bn,"prismOutline");function $n(e,t){const n=new ue;n.name=`volume:${e.id??""}`;const s=sn(e,n),r=x(e.opacity,1),o=t.color(e.color,ot.volume),i=x(Y(e.faces).opacity,.45),a=Ft(o,i),l=Ft(o,Math.min(1,i*1.8)),c=x(e.back_opacity,1),u=e.cells??{},h=x(e.line_width,1),f=d((g,v={})=>({pattern:"both",cell:g,color:a,colorMajor:l,widthMinor:h,widthMajor:h,back:c,opacity:r,additive:e.blend==="add",...v}),"look"),M=[],b=d((g,v,y=false)=>{const p=tn(g,v);n.add(p),s.gridFaces.push(p),s.pickMeshes.push(...p.children),y&&M.push(p)},"face"),m=[],w=e.shape==="prism"?bn(e.outline):null;if(e.shape==="prism"&&w){const[g,v]=ct(e.height,[0,10]),y=w.map(S=>S[0]),p=w.map(S=>S[1]),_=Math.max(Math.max(...y)-Math.min(...y),Math.max(...p)-Math.min(...p)),A=x(u.width,_/8),L=x(u.depth,_/8),O=x(u.height,(v-g)/2);for(const S of[g,v])b(pn(w,S),f([A,L]));let j=0;w.forEach((S,z)=>{const E=w[(z+1)%w.length];b(mn({a:S,b:E,y0:g,y1:v,s0:j}),f([A,O]),true),j+=Math.hypot(E[0]-S[0],E[1]-S[1]);for(const I of[g,v])m.push([S[0],I,S[1],E[0],I,E[1]]);m.push([S[0],g,S[1],S[0],v,S[1]])}),s.centre=[y.reduce((S,z)=>S+z,0)/y.length,(g+v)/2,p.reduce((S,z)=>S+z,0)/p.length]}else if(e.shape==="box"){const g=Array.isArray(e.size)?e.size:[x(e.size,20),x(e.size,20),x(e.size,20)],[v,y,p]=[x(g[0],20),x(g[1],20),x(g[2],20)],_=x(u.width,v/4),A=x(u.height,y/4),L=x(u.depth,p/4);for(const z of[-y/2,y/2])b(Et(v,p,(E,I)=>[E,z,I]),f([_,L]));for(const z of[-p/2,p/2])b(Et(v,y,(E,I)=>[E,I,z]),f([_,A]),true);for(const z of[-v/2,v/2])b(Et(p,y,(E,I)=>[z,I,E]),f([L,A]),true);const O=[-v/2,v/2],j=[-y/2,y/2],S=[-p/2,p/2];for(const z of j)for(const E of S)m.push([O[0],z,E,O[1],z,E]);for(const z of O)for(const E of S)m.push([z,j[0],E,z,j[1],E]);for(const z of O)for(const E of j)m.push([z,E,S[0],z,E,S[1]])}else{const[g,v]=ct(e.radius,[50,100]),[y,p]=ct(e.angle,[0,90]),[_,A]=ct(e.height,[0,10]),L=x(u.ring,(v-g)/4),O=Math.max(.5,x(u.angle,10)),j=x(u.layer,(A-_)/2),S={pattern:"polar",planePolar:true,spokes:Math.round(360/O),majorRow:0,majorCol:0};for(const F of[_,A])b(dn({r0:g,r1:v,a0:y,a1:p,y:F}),f([L,L],S));for(const F of[g,v])F>0&&b(hn({radius:F,y0:_,y1:A,a0:y,a1:p}),f([F*O*wn,j]),true);for(const F of[y,p])b(fn({r0:g,r1:v,a:F,y0:_,y1:A}),f([L,j]),true);const z=Math.max(8,Math.ceil(Math.abs(p-y)/2)),E=d((F,G)=>{const Z=[];for(let V=0;V<=z;V++){const[At,zt]=K(F,y+V/z*(p-y));Z.push(At,G,zt)}return Z},"arc");for(const F of[_,A])for(const G of[g,v])G>0&&m.push(E(G,F));for(const F of[_,A])for(const G of[y,p]){const[Z,V]=K(g,G),[At,zt]=K(v,G);m.push([Z,F,V,At,F,zt])}for(const F of[g,v])for(const G of[y,p]){const[Z,V]=K(F,G);m.push([Z,_,V,Z,A,V])}const[I,_e]=K((g+v)/2,(y+p)/2);s.centre=[I,(_+A)/2,_e]}if(rn(e.edges,true)){const g=Y(e.edges),v=new Nt(m,{color:g.color!==void 0?t.color(g.color,ot.volume):o,width:x(g.width,1.5),opacity:r*.9,additive:e.blend==="add"});n.add(v.object),s.lines.push(v)}return s.tick=an(e,t,M),s}d($n,"buildVolume");export{H as A,Q as B,te as C,ot as D,Pn as E,Nt as F,gt as G,$n as H,Tn as I,jn as J,ln as K,Dn as L,En as M,ee as N,be as O,ne as P,xe as Q,bn as R,kn as a,sn as b,Rn as c,dn as d,Wn as e,hn as f,Cn as g,Fn as h,rn as i,On as j,an as k,tn as l,on as m,x as n,In as o,ct as p,Nn as q,Ln as r,Y as s,K as t,Hn as u,Bn as v,Gn as w,Re as x,Un as y,Ze as z};
//# sourceMappingURL=volume-DZauerbA.js.map
