var $e=Object.defineProperty;var d=(e,t)=>$e(e,"name",{value:t,configurable:true});import{G as Ie,b as Dt,k as tt,S as Ee,A as Pe,m as He,y as qe,z as Ve,t as at,M as Et,V as G,H as Ye,c as Ge,d as it,I as Ke,F as ie,J as wt,K,X as Ze,B as Yt,a as Le,Y as yt,Z as Te,_ as Mt,$ as lt,a0 as Je,C as Xe,f as oe,a1 as Qe,a2 as tn,a3 as re}from"./three.module-DQ1AG__Q.js";import{G as en,s as nn}from"./scan-band-DqAGxl4h.js";import{l as ze,aH as sn,aG as an}from"./lcards-main-Dyh7t6jw.js";const L=Math.PI/180,on=2451545,vt=23.4397*L,Oe=d(e=>e.valueOf()/864e5+24405875e-1-on,"days"),jt=d((e,t)=>Math.atan2(Math.sin(e)*Math.cos(vt)-Math.tan(t)*Math.sin(vt),Math.cos(e)),"raOf"),Ft=d((e,t)=>Math.asin(Math.sin(t)*Math.cos(vt)+Math.cos(t)*Math.sin(vt)*Math.sin(e)),"decOf"),rn=d((e,t)=>L*(280.16+360.9856235*e)-t,"sidereal");function Be(e,t,n,s,a){const i=rn(n,-a*L)-e,r=s*L,o=Math.asin(Math.sin(r)*Math.sin(t)+Math.cos(r)*Math.cos(t)*Math.cos(i));return{azimuth:((Math.atan2(Math.sin(i),Math.cos(i)*Math.sin(r)-Math.tan(t)*Math.cos(r))/L+180)%360+360)%360,altitude:o/L}}d(Be,"horizontal");function Re(e){const t=L*(357.5291+.98560028*e),n=L*(1.9148*Math.sin(t)+.02*Math.sin(2*t)+3e-4*Math.sin(3*t));return t+n+L*102.9372+Math.PI}d(Re,"sunEcliptic");function Ue(e,t,n){const s=Oe(e),a=Re(s);return Be(jt(a,0),Ft(a,0),s,t,n)}d(Ue,"sunPosition");function Ne(e){const t=e/36525,n=L*(218.3164477+481267.88123421*t),s=L*(297.8501921+445267.1114034*t),a=L*(357.5291092+35999.0502909*t),i=L*(134.9633964+477198.8675055*t),r=L*(93.272095+483202.0175233*t),o=n+L*(6.288774*Math.sin(i)+1.274027*Math.sin(2*s-i)+.658314*Math.sin(2*s)+.213618*Math.sin(2*i)-.185116*Math.sin(a)-.114332*Math.sin(2*r)+.058793*Math.sin(2*s-2*i)+.057066*Math.sin(2*s-a-i)+.053322*Math.sin(2*s+i)+.045758*Math.sin(2*s-a)-.040923*Math.sin(a-i)-.03472*Math.sin(s)-.030383*Math.sin(a+i)),l=L*(5.128122*Math.sin(r)+.280602*Math.sin(i+r)+.277693*Math.sin(i-r)+.173237*Math.sin(2*s-r)+.055413*Math.sin(2*s-i+r)+.046271*Math.sin(2*s-i-r)),c=385000.56-20905.355*Math.cos(i)-3699.111*Math.cos(2*s-i)-2955.968*Math.cos(2*s)-569.925*Math.cos(2*i);return{l:o-L*1.396971*t,b:l,dist:c}}d(Ne,"moonEcliptic");function De(e,t,n){const s=Oe(e),a=Ne(s),i=jt(a.l,a.b),r=Ft(a.l,a.b),o=Be(i,r,s,t,n),l=o.altitude-Math.asin(6378.14/a.dist)/L*Math.cos(o.altitude*L),c=Re(s),u=jt(c,0),h=Ft(c,0),f=Math.acos(Math.sin(h)*Math.sin(r)+Math.cos(h)*Math.cos(r)*Math.cos(u-i)),m=Math.atan2(149598e3*Math.sin(f),a.dist-149598e3*Math.cos(f)),b=(1+Math.cos(m))/2,y=Math.sin(i-u)>0;return{azimuth:o.azimuth,altitude:l,distance:a.dist,fraction:b,waxing:y}}d(De,"moonPosition");function cn(e){var a,i;const t=(i=(a=e==null?void 0:e.states)==null?void 0:a["sun.sun"])==null?void 0:i.attributes,n=Number(t==null?void 0:t.azimuth),s=Number(t==null?void 0:t.elevation);return(t==null?void 0:t.azimuth)===void 0||(t==null?void 0:t.elevation)===void 0||!Number.isFinite(n)||!Number.isFinite(s)?null:{azimuth:n,altitude:s}}d(cn,"sunFromHass");function ss(e,t=Date.now(),{entity:n=true}={}){var l,c;const s=Number((l=e==null?void 0:e.config)==null?void 0:l.latitude)||0,a=Number((c=e==null?void 0:e.config)==null?void 0:c.longitude)||0,i=n?cn(e):null,r=i?{...i,source:"entity"}:{...Ue(t,s,a),source:"computed"},o=De(t,s,a);return{sun:r,moon:{...o,illumination:Math.round(o.fraction*100)},location:{latitude:s,longitude:a},time:t.valueOf()}}d(ss,"skyState");function ln(e,t){const s=t/15*36e5;return Math.floor((e.valueOf()+s)/864e5)*864e5-s}d(ln,"solarDayStart");function as(e,t,n,s=Date.now(),a=5){const i=ln(s,n),r=e==="moon"?De:Ue,o=[];for(let l=0;l<=1440;l+=a){const c=r(i+l*6e4,t,n);o.push({azimuth:c.azimuth,altitude:c.altitude})}return o}d(as,"dayPath");const P=Math.PI/180,Kt=2451545,q=1495978707e-1,ce=23.43928*P,un=81.30057,Pt=d(e=>e/864e5+24405875e-1-Kt,"daysJ2000"),nt={mercury:{el:[.38709843,.20563661,7.00559432,252.25166724,77.45771895,48.33961819],rate:[0,2123e-8,-.00590158,149472.67486623,.15940013,-.12214182]},venus:{el:[.72332102,.00676399,3.39777545,181.9797085,131.76755713,76.67261496],rate:[-26e-8,-5107e-8,43494e-8,58517.8156026,.05679648,-.27274174]},emb:{el:[1.00000018,.01673163,-54346e-8,100.46691572,102.93005885,-5.11260389],rate:[-3e-8,-3661e-8,-.01337178,35999.37306329,.3179526,-.24123856]},mars:{el:[1.52371243,.09336511,1.85181869,-4.56813164,-23.91744784,49.71320984],rate:[97e-8,9149e-8,-.00724757,19140.29934243,.45223625,-.26852431]},jupiter:{el:[5.20248019,.0485359,1.29861416,34.33479152,14.27495244,100.29282654],rate:[-2864e-8,18026e-8,-.00322699,3034.90371757,.18199196,.13024619],extra:[-12452e-8,.0606406,-.35635438,38.35125]},saturn:{el:[9.54149883,.05550825,2.49424102,50.07571329,92.86136063,113.63998702],rate:[-3065e-8,-32044e-8,.00451969,1222.11494724,.54179478,-.25015002],extra:[25899e-8,-.13434469,.87320147,38.35125]},uranus:{el:[19.18797948,.0468574,.77298127,314.20276625,172.43404441,73.96250215],rate:[-20455e-8,-155e-7,-.00180155,428.49512595,.09266985,.05739699],extra:[58331e-8,-.97731848,.17689245,7.67025]},neptune:{el:[30.06952752,.00895439,1.7700552,304.22289287,46.68158724,131.78635853],rate:[6447e-8,818e-8,224e-6,218.46515314,.01009938,-.00606302],extra:[-41348e-8,.68346318,-.10162547,7.67025]}},st={pluto:[24575885e-1,39.58862938517124,.2518378778576892,17.14771140999114,110.2923840543057,113.7090015158565,38.68366347318184,.003956838955553025],ceres:[24612005e-1,2.765552595034094,.07969229514816586,10.58802780183462,80.24862682043221,73.29421453021587,274.4193463761342,.21430445064843]},Ct={phobos:{parent:"mars",el:[9375,.015,216.3,215.16,1.1,169.2,.31891007,1.1,2.3],plane:[317.7,52.9]},deimos:{parent:"mars",el:[23457,0,0,259.395,1.8,54.3,1.26244075,0,56.2],plane:[316.6,53.5]},io:{parent:"jupiter",el:[421800,.004,49.1,19.898,0,0,1.76913833,1.333,0],plane:[268.1,64.5]},europa:{parent:"jupiter",el:[671100,.009,45,214.396,.5,184,3.55117426,1.394,30.202],plane:[268.1,64.5]},ganymede:{parent:"jupiter",el:[1070400,.001,198.3,221.566,.2,58.5,7.15454972,68.301,137.812],plane:[268.2,64.6]},callisto:{parent:"jupiter",el:[1882700,.007,43.8,80.424,.3,309.1,16.68901925,277.921,577.264],plane:[268.7,64.8]},titan:{parent:"saturn",el:[1221900,.029,78.3,14.599,.3,78.6,15.94585901,346.68,687.37],plane:[36.4,84]},triton:{parent:"neptune",el:[354800,0,0,236.137,157.3,177.7,5.87657946,675.2,688],plane:[299.36,43.46]},charon:{parent:"pluto",el:[19600,0,0,304.131,0,0,6.38722222,0,0],plane:[132.993,-6.163]}},je={sun:{ra:[286.13,0],dec:[63.87,0],w:[84.176,14.1844]},mercury:{ra:[281.0103,-.0328],dec:[61.4155,-.0049],w:[329.5988,6.1385108]},venus:{ra:[272.76,0],dec:[67.16,0],w:[160.2,-1.4813688]},earth:{ra:[0,-.641],dec:[90,-.557],w:[190.147,360.9856235]},moon:{ra:[269.9949,.0031],dec:[66.5392,.013],w:[38.3213,13.17635815]},mars:{ra:[317.68143,-.1061],dec:[52.8865,-.0609],w:[176.63,350.89198226]},phobos:{ra:[317.68,-.108],dec:[52.9,-.061],w:[35.06,1128.844585]},deimos:{ra:[316.65,-.108],dec:[53.52,-.061],w:[79.41,285.161897]},jupiter:{ra:[268.056595,-.006499],dec:[64.495303,.002413],w:[284.95,870.536]},io:{ra:[268.05,-.009],dec:[64.5,.003],w:[200.39,203.4889538]},europa:{ra:[268.08,-.009],dec:[64.51,.003],w:[36.022,101.3747235]},ganymede:{ra:[268.2,-.009],dec:[64.57,.003],w:[44.064,50.3176081]},callisto:{ra:[268.72,-.009],dec:[64.83,.003],w:[259.51,21.5710715]},saturn:{ra:[40.589,-.036],dec:[83.537,-.004],w:[38.9,810.7939024]},titan:{ra:[39.4827,0],dec:[83.4279,0],w:[186.5855,22.5769768]},uranus:{ra:[257.311,0],dec:[-15.175,0],w:[203.81,-501.1600928]},neptune:{ra:[299.36,0],dec:[43.46,0],w:[249.978,541.1397757]},triton:{ra:[299.36,0],dec:[41.17,0],w:[296.53,-61.2572637]},pluto:{ra:[132.993,0],dec:[-6.163,0],w:[302.695,56.3625225]},charon:{ra:[132.993,0],dec:[-6.163,0],w:[122.695,56.3625225]},ceres:{ra:[291.418,0],dec:[66.764,0],w:[170.65,952.1532]}},et={sun:{parent:null,radius:695700},mercury:{parent:"sun",radius:2439.7},venus:{parent:"sun",radius:6051.8},earth:{parent:"sun",radius:6371},moon:{parent:"earth",radius:1737.4},mars:{parent:"sun",radius:3389.5},phobos:{parent:"mars",radius:11.08},deimos:{parent:"mars",radius:6.27},ceres:{parent:"sun",radius:469.7},jupiter:{parent:"sun",radius:69911},io:{parent:"jupiter",radius:1821.6},europa:{parent:"jupiter",radius:1560.8},ganymede:{parent:"jupiter",radius:2634.1},callisto:{parent:"jupiter",radius:2410.3},saturn:{parent:"sun",radius:58232},titan:{parent:"saturn",radius:2574.7},uranus:{parent:"sun",radius:25362},neptune:{parent:"sun",radius:24622},triton:{parent:"neptune",radius:1353.4},pluto:{parent:"sun",radius:1188.3},charon:{parent:"pluto",radius:606}};function dn(e,t){let n=e+t*Math.sin(e);for(let s=0;s<12;s++){const a=(e-(n-t*Math.sin(n)))/(1-t*Math.cos(n));if(n+=a,Math.abs(a)<1e-12)break}return n}d(dn,"eccentricAnomaly$1");function ot(e,t,n,s,a,i){const r=((n%360+540)%360-180)*P,o=dn(r,t),l=e*(Math.cos(o)-t),c=e*Math.sqrt(1-t*t)*Math.sin(o),u=Math.cos(s*P),h=Math.sin(s*P),f=Math.cos(i*P),m=Math.sin(i*P),b=Math.cos(a*P),y=Math.sin(a*P);return[(u*f-h*m*b)*l+(-h*f-u*m*b)*c,(u*m+h*f*b)*l+(-h*m+u*f*b)*c,h*y*l+u*y*c]}d(ot,"orbitPoint");function le(e,t){const n=nt[e],s=t/36525,[a,i,r,o,l,c]=n.el.map((f,m)=>f+n.rate[m]*s);let u=o-l;if(n.extra){const[f,m,b,y]=n.extra;u+=f*s*s+m*Math.cos(y*s*P)+b*Math.sin(y*s*P)}const h=ot(a,i,u,l-c,r,c);return[h[0]*q,h[1]*q,h[2]*q]}d(le,"planetPosition");function hn(e,t){const[n,s,a,i,r,o,l,c]=st[e],u=ot(s,a,l+c*(t+Kt-n),o,i,r);return[u[0]*q,u[1]*q,u[2]*q]}d(hn,"smallBodyPosition");function gt([e,t,n]){const s=Math.cos(ce),a=Math.sin(ce);return[e,s*t+a*n,-a*t+s*n]}d(gt,"eqToEcl");function St([e,t,n],s,a){const i=Math.sin(a*P),r=Math.cos(a*P),o=i*t-r*n,l=r*t+i*n,c=Math.cos((s+90)*P),u=Math.sin((s+90)*P);return[c*e-u*o,u*e+c*o,l]}d(St,"planeToIcrf");function At(e,t){if(e==="moon"){const x=Ne(t),g=Math.cos(x.b);return[x.dist*g*Math.cos(x.l),x.dist*g*Math.sin(x.l),x.dist*Math.sin(x.b)]}const{el:n,plane:s}=Ct[e],[a,i,r,o,l,c,u,h,f]=n,m=t/365.25,b=c-(f?Math.sign(Math.cos(l*P))*(360*m)/f:0),y=r+(h?360*m/h:0);return gt(St(ot(a,i,o+360*t/u-b-y,y,l,b),s[0],s[1]))}d(At,"moonOffset");function kt(e,t){var r;const n=Pt(t);if(e==="sun")return[0,0,0];if(e==="earth"){const o=le("emb",n),l=At("moon",n),c=1/(1+un);return[o[0]-l[0]*c,o[1]-l[1]*c,o[2]-l[2]*c]}if(nt[e])return le(e,n);if(st[e])return hn(e,n);const s=(r=et[e])==null?void 0:r.parent;if(!s)return null;const a=kt(s,t);if(!a)return null;const i=At(e,n);return[a[0]+i[0],a[1]+i[1],a[2]+i[2]]}d(kt,"heliocentric");function fn(e,t,n="sun"){var i;if(((i=et[e])==null?void 0:i.parent)===n&&n!=="sun")return At(e,Pt(t));const s=kt(e,t),a=kt(n,t);return s&&a?[s[0]-a[0],s[1]-a[1],s[2]-a[2]]:null}d(fn,"position");const bt=d(([e,t,n])=>[e,n,-t],"toScene");function mn(e){const t=new Set;for(let n=0;n<e;n++)t.add(-.5+n/e);for(let n=-100;n<=100;n++)t.add(n/36e3);for(let n=-50;n<=50;n++)t.add(n/18e5);return[...t].sort((n,s)=>n-s)}d(mn,"orbitSamples");function is(e,t,n=256){var o,l;if(!((o=et[e])==null?void 0:o.parent))return null;const a=Pt(t),i=mn(n);if(nt[e]||e==="earth"){const u=nt[e==="earth"?"emb":e],h=a/36525,[f,m,b,y,x,g]=u.el.map((M,p)=>M+u.rate[p]*h);let S=y-x;if(u.extra){const[M,p,A,_]=u.extra;S+=M*h*h+p*Math.cos(_*h*P)+A*Math.sin(_*h*P)}return i.map(M=>ot(f,m,S+360*M,x-g,b,g).map(p=>p*q))}if(st[e]){const[c,u,h,f,m,b,y,x]=st[e],g=y+x*(a+Kt-c);return i.map(S=>ot(u,h,g+360*S,b,f,m).map(M=>M*q))}const r=((l=yn(e))==null?void 0:l.orbit)??1;return i.map(c=>At(e,a+r*c))}d(is,"orbitPath");function pn(e,t){const n=je[e];if(!n)return null;const s=Pt(t),a=s/36525;let i=n.ra[0]+n.ra[1]*a,r=n.dec[0]+n.dec[1]*a,o=n.w[0]+n.w[1]*s;if(e==="moon"){const u=(125.045-.0529921*s)*P;i-=3.8787*Math.sin(u),r+=1.5419*Math.cos(u),o+=3.561*Math.sin(u)}if(e==="neptune"){const u=(357.85+52.316*a)*P;i+=.7*Math.sin(u),r-=.51*Math.cos(u),o-=.48*Math.sin(u)}o=(o%360+360)%360;const l=Math.cos(o*P),c=Math.sin(o*P);return{x:gt(St([l,c,0],i,r)),y:gt(St([-c,l,0],i,r)),z:gt(St([0,0,1],i,r))}}d(pn,"orientation");function ue(e,t){const n=pn(e,t);return n?{x:bt(n.y),y:bt(n.z),z:bt(n.x)}:null}d(ue,"sphereAxes");function yn(e){const t=je[e];if(!t)return null;let n=null;return nt[e]||e==="earth"?n=36525*360/nt[e==="earth"?"emb":e].rate[3]:st[e]?n=360/st[e][7]:Ct[e]?n=Ct[e].el[6]:e==="moon"&&(n=27.321661),{day:24*360/t.w[1],orbit:n}}d(yn,"periods");const Mn={both:0,horizontal:1,vertical:2,diagonal:3,hexagonal:4,dots:5,polar:6},gn=`
attribute vec2 surf;
varying vec2 vSurf;
void main() {
  vSurf = surf;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Sn=`
precision highp float;
${en}
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
}`;function bn(e){var n;const t=e.color??[1,.6,.4,.5];return{uScroll:{value:new tt},uPattern:{value:Mn[e.pattern??"both"]??0},uCell:{value:new tt(...e.cell??[10,10])},uCount:{value:new tt(0,0)},uMajorRow:{value:Math.max(0,e.majorRow??0)},uMajorCol:{value:Math.max(0,e.majorCol??0)},uBorder:{value:true},uWidthMinor:{value:e.widthMinor??1},uWidthMajor:{value:e.widthMajor??2},uSpacing:{value:e.spacing??((n=e.cell)==null?void 0:n[0])??10},uHexR:{value:e.hexRadius??10},uDotR:{value:e.dotRadius??1},uColor:{value:t},uColorMajor:{value:e.colorMajor??t},uFill:{value:e.fill??[0,0,0,0]},uScan:{value:[0,0,0,0]},uScanZ:{value:0},uScanStrength:{value:0},uPolarC:{value:new tt},uSpokes:{value:e.spokes??12},uSpokeOff:{value:0},uPlanePolar:{value:!!e.planePolar},uScanRadial:{value:false},uOpacity:{value:e.opacity??1}}}d(bn,"gridUniforms");function xn(e,t){const n=bn(t),s=Math.max(0,Math.min(1,t.back??.25)),a=d((o,l)=>new Ee({uniforms:{...n,uMul:{value:l}},vertexShader:gn,fragmentShader:Sn,side:o,transparent:true,premultipliedAlpha:true,depthTest:true,depthWrite:false,blending:t.additive?Pe:He}),"make"),i=new Ie;if(s>0){const o=new Dt(e,a(qe,s));o.renderOrder=1,i.add(o)}const r=new Dt(e,a(Ve,1));return r.renderOrder=2,i.add(r),i.userData.uniforms=n,i}d(xn,"gridFace");function wn(e){var l;const t=e.userData.uniforms,n=(l=e.children[0])==null?void 0:l.geometry,s=n==null?void 0:n.getAttribute("surf"),a=!!(t!=null&&t.uPlanePolar.value),i=(t==null?void 0:t.uPolarC.value)??{x:0,y:0};let r=1/0,o=-1/0;for(let c=0;c<((s==null?void 0:s.count)??0);c++){const u=a?Math.hypot(s.getX(c)-i.x,s.getY(c)-i.y):s.getY(c);r=Math.min(r,u),o=Math.max(o,u)}return o>=r?a?{from:0,to:o,radial:a}:{from:o,to:r,radial:a}:{from:0,to:0,radial:a}}d(wn,"scanRange");function vn(e,t,n,s){const a=e.userData.uniforms;a&&(a.uScanRadial.value=t.radial,a.uScanStrength.value=s,a.uScanZ.value=t.from+(t.to-t.from)*n)}d(vn,"setScan");const rt={grid:"theme:colors.ui.tertiary",line:"theme:colors.ui.secondary",volume:"var(--lcars-blue, var(--lcards-blue-medium))",path:"var(--lcars-orange, var(--lcards-orange-medium))",fill:"black",glow:"var(--lcards-moonlight)",nebula:"var(--lcars-violet, var(--lcards-blue-medium))",stars:"var(--lcards-moonlight)",scan:"var(--lcards-moonlight)",model:"var(--lcars-blue, var(--lcards-blue-medium))",modelRim:"var(--lcards-moonlight)",pulse:"var(--lcards-moonlight)"};function An(e,t,n={}){const s=w(e.spin,0);return{id:String(e.id??""),type:String(e.type),config:e,node:t,spin:s,occludes:false,pickMeshes:[],points:[],lines:[],gridFaces:[],update:null,dynamic:false,tick:null,...n}}d(An,"built");function os(e,t,n){var a;let s=false;for(const i of e)i.spin&&(i.node.rotation.y+=at.degToRad(i.spin)*(t/1e3),s=true),(a=i.tick)!=null&&a.call(i,t,n)&&(s=true);return s}d(os,"stepObjects");function Z(e){return e&&typeof e=="object"&&!Array.isArray(e)?e:{}}d(Z,"sub");function _n(e,t){return e==null?t:e!==false}d(_n,"isOn");function In(e){return w(Z(e.major).line_width,Math.max(1.5,w(e.line_width,1)*1.5))}d(In,"majorWidth");function w(e,t){const n=Number(e);return e!=null&&e!==""&&Number.isFinite(n)?n:t}d(w,"num");function ut(e,t){return Array.isArray(e)&&e.length>=2?[w(e[0],t[0]),w(e[1],t[1])]:e!==void 0&&Number.isFinite(Number(e))?[Number(e),Number(e)]:t}d(ut,"pair");function rs(e,t){const n=Array.isArray(t.rotation)?t.rotation:null;e.rotation.order="YXZ",n&&e.rotation.set(at.degToRad(w(n[0],0)),-at.degToRad(w(n[1],0)),at.degToRad(w(n[2],0)))}d(rs,"applyRotation");function cs(e){var r;const t=(r=e.config)==null?void 0:r.body;if(t==null||t===""||!ue(String(t),0))return;e.spin=0,e.moving=true;const n=new Et,s=new G,a=new G,i=new G;e.onDate=o=>{const l=ue(String(t),o);l&&(n.makeBasis(s.fromArray(l.x),a.fromArray(l.y),i.fromArray(l.z)),e.node.quaternion.setFromRotationMatrix(n))}}d(cs,"bodyTurn");function Wt(e,t){return[e[0],e[1],e[2],(e[3]??1)*t]}d(Wt,"withOpacity");function ls(e){e.traverse(t=>{var a,i,r,o,l;const n=t;(i=(a=n.geometry)==null?void 0:a.dispose)==null||i.call(a);const s=Array.isArray(n.material)?n.material:n.material?[n.material]:[];for(const c of s)(o=(r=c.map)==null?void 0:r.dispose)==null||o.call(r),(l=c.dispose)==null||l.call(c)})}d(ls,"disposeNode");function us(e,t,n){const s=w(e.opacity,1),a=t.color(e.color,rt.grid),i=Z(e.major),r=i.color!==void 0?t.color(i.color,rt.grid):[a[0],a[1],a[2],Math.min(1,(a[3]??1)*1.6)];return{pattern:n.pattern??e.pattern??"both",cell:n.cell,majorRow:n.majorRow??w(i.row_interval,0),majorCol:n.majorCol??w(i.col_interval,0),widthMinor:w(e.line_width,1),widthMajor:In(e),color:a,colorMajor:r,fill:Z(e.fill).color!==void 0?t.color(Z(e.fill).color,"transparent"):void 0,spokes:w(e.spoke_count,12),spacing:n.cell[0],hexRadius:w(e.hex_radius,n.cell[0]),dotRadius:w(e.dot_radius,n.cell[0]*.08),planePolar:n.planePolar,back:w(e.back_opacity,n.back??.25),opacity:s,additive:e.blend==="add"}}d(us,"gridLook");function En(e,t,n){const s=Z(e.scan),a=w(s.period,0);if(!(a>0)||!n.length)return null;const i=t.color(s.color,rt.scan),r=n.map(o=>({face:o,range:wn(o)}));for(const{face:o}of r)o.userData.uniforms.uScan.value=Wt(i,w(e.opacity,1));return(o,l)=>{const{pos:c,strength:u}=nn(l,a);for(const{face:h,range:f}of r)vn(h,f,c,u);return true}}d(En,"scanTicker");function ds(...e){const t=e.filter(Boolean);return t.length<2?t[0]??null:(n,s)=>{let a=false;for(const i of t)i(n,s)&&(a=true);return a}}d(ds,"combineTicks");function hs(e,t,n){const s=Z(e.fill).effect;return s?t.effects?t.effects.fillMaterial(s,t,n):(ze.warn(`[Astrometrics] fill.effect on '${e.id??e.type}' skipped: the effects chunk is not loaded`),null):null}d(hs,"fillFor");const Pn={iss:{id:25544,label:"ISS"},tiangong:{id:48274,label:"Tiangong"},hubble:{id:20580,label:"Hubble"},goes_east:{id:60133,label:"GOES-19 (East)"},goes_west:{id:51850,label:"GOES-18 (West)"},meteosat:{id:54743,label:"Meteosat-12"},meteosat_iodc:{id:28912,label:"Meteosat-9 (Indian Ocean)"},himawari:{id:41836,label:"Himawari-9"},geo_kompsat:{id:43823,label:"GEO-KOMPSAT-2A"},insat:{id:58990,label:"INSAT-3DS"},fengyun_4a:{id:41882,label:"Fengyun-4A"}},Gn={gps:[26407,27663,28190,28474,28874,29486,29601,32260,32384,32711,35752,36585,38833,39166,39533,39741,40105,40294,40534,40730,41019,41328,43873,44506,45854,46826,48859,55268,62339,64202,67588,68791],galileo:[37846,37847,38857,40128,40129,40544,40545,40890,41174,41175,41549,41550,41859,41860,41861,41862,43055,43056,43057,43058,43564,43565,43566,43567,49809,49810,59598,59600,61182,61183,67160,67162],geostationary:[60133,51850,54743,28912,41836,43823,58990,41882],stations:[25544,48274]},Ln={20580:{name:"HST",elements:[20580,1794503477509,15.32277407,226e-6,28.4707,144.2698,12.6775,347.3878]},25544:{name:"ISS (ZARYA)",elements:[25544,1794478977431,15.49332729,7327e-7,51.6324,286.4897,17.4271,342.6968]},26407:{name:"GPS BIIR-5  (PRN 22)",elements:[26407,1794505868459,2.00559029,.0114992,54.8254,209.268,305.097,321.6909]},27663:{name:"GPS BIIR-8  (PRN 16)",elements:[27663,1794478597345,2.00552628,.0153259,54.8547,209.0852,54.4127,119.5643]},28190:{name:"GPS BIIR-11 (PRN 19)",elements:[28190,1794495277357,2.0057145,.011888,54.716,269.6763,177.9219,292.6838]},28474:{name:"GPS BIIR-13 (PRN 02)",elements:[28474,1794496992735,2.00562412,.0174692,55.0409,318.9017,320.6205,225.951]},28874:{name:"GPS BIIRM-1 (PRN 17)",elements:[28874,1794495048755,2.00555606,.012804,54.7672,267.1747,299.2721,195.9771]},28912:{name:"METEOSAT-9 (MSG-2)",elements:[28912,1794503970654,1.00274658,1096e-7,9.6967,52.6744,14.6292,290.1354]},29486:{name:"GPS BIIRM-2 (PRN 31)",elements:[29486,1794487562365,2.00563075,.0109798,54.7247,145.443,59.0284,275.2821]},29601:{name:"GPS BIIRM-3 (PRN 12)",elements:[29601,1794354142769,2.00650374,.00880213,54.911,208.1919,93.1886,267.8989]},32260:{name:"GPS BIIRM-4 (PRN 15)",elements:[32260,1794467948289,2.00573644,.0167769,54.2146,73.9682,90.5153,271.3897]},32384:{name:"GPS BIIRM-5 (PRN 29)",elements:[32384,1794474173594,2.00568151,.0035538,54.9232,268.1829,169.8406,11.3435]},32711:{name:"GPS BIIRM-6 (PRN 07)",elements:[32711,1794503508713,2.00555165,.021255,54.515,143.986,249.0217,108.7327]},35752:{name:"GPS BIIRM-8 (PRN 05)",elements:[35752,1794459663942,2.00573698,.00493416,56.291,21.6496,86.6033,281.1686]},36585:{name:"GPS BIIF-1  (PRN 25)",elements:[36585,1794466127535,2.00552896,.0117195,54.2486,202.6009,56.3242,126.1128]},37846:{name:"GSAT0101 (GALILEO-PFM)",elements:[37846,1794463578063,1.70475822,2185e-7,56.9341,337.739,310.4892,49.5335]},37847:{name:"GSAT0102 (GALILEO-FM2)",elements:[37847,1794482713236,1.70476105,416e-6,56.9347,337.7335,308.7426,232.9687]},38833:{name:"GPS BIIF-3  (PRN 24)",elements:[38833,1794432654508,2.00557815,.01884064,53.6115,137.5404,68.5809,293.4535]},38857:{name:"GSAT0103 (GALILEO-FM3)",elements:[38857,1794467138317,1.70473411,1777e-7,55.9051,97.4808,281.1023,78.8449]},39166:{name:"GPS BIIF-4  (PRN 27)",elements:[39166,1794507235443,2.00563077,.0145272,54.3988,262.9106,51.4183,309.8696]},39533:{name:"GPS BIIF-5  (PRN 30)",elements:[39533,1794507240375,2.0056949,.0083969,53.6757,143.2528,231.6843,127.599]},39741:{name:"GPS BIIF-6  (PRN 06)",elements:[39741,1794488729969,2.0055055,.0041444,56.416,325.7301,324.6875,35.0632]},40105:{name:"GPS BIIF-7  (PRN 09)",elements:[40105,1794496082488,2.00567903,.003644,55.4622,82.5557,122.1503,238.1846]},40128:{name:"GSAT0201 (GALILEO 5)",elements:[40128,1794450150145,1.85519761,.1694368,48.7192,267.3539,185.0385,173.0421]},40129:{name:"GSAT0202 (GALILEO 6)",elements:[40129,1794472182061,1.85520519,.1696052,48.7365,266.4304,185.7478,172.0584]},40294:{name:"GPS BIIF-8  (PRN 03)",elements:[40294,1794485181066,2.00560529,.0066059,57.0785,25.2546,73.7955,286.9817]},40534:{name:"GPS BIIF-9  (PRN 26)",elements:[40534,1794453442485,2.00567313,.0116159,53.1469,198.0628,42.632,318.3569]},40544:{name:"GSAT0203 (GALILEO 7)",elements:[40544,1794342967974,1.70476236,61479e-8,56.7259,337.591,267.9104,92.063]},40545:{name:"GSAT0204 (GALILEO 8)",elements:[40545,1794466466910,1.70475852,6071e-7,56.7327,337.5714,259.0916,100.8812]},40730:{name:"GPS BIIF-10 (PRN 08)",elements:[40730,1794381725047,2.0057435,.01214465,53.8784,261.0109,31.4803,329.2306]},40890:{name:"GSAT0206 (GALILEO 10)",elements:[40890,1794364155312,1.70473053,36495e-8,54.9053,217.5519,26.1545,333.9348]},41019:{name:"GPS BIIF-11 (PRN 10)",elements:[41019,1794472197380,2.00566976,.0118846,57.0486,25.1163,232.1636,126.806]},41174:{name:"GSAT0209 (GALILEO 12)",elements:[41174,1794480042192,1.70474361,2638e-7,55.927,97.1949,17.8815,342.0952]},41175:{name:"GSAT0208 (GALILEO 11)",elements:[41175,1794448407562,1.70474136,2198e-7,55.9252,97.2016,24.1515,335.8253]},41328:{name:"GPS BIIF-12 (PRN 32)",elements:[41328,1794479701941,2.00569588,.0100072,55.6283,83.5859,247.7263,111.1915]},41549:{name:"GSAT0211 (GALILEO 14)",elements:[41549,1794459104093,1.70473047,4165e-7,55.0553,217.6282,5.6578,354.4212]},41550:{name:"GSAT0210 (GALILEO 13)",elements:[41550,1794430621524,1.70473586,18972e-8,55.0549,217.6352,259.8207,100.2313]},41836:{name:"HIMAWARI-9",elements:[41836,1794484295856,1.0027052,871e-7,.0415,50.6872,201.3789,118.2587]},41859:{name:"GSAT0207 (GALILEO 15)",elements:[41859,1794353330159,1.70474229,2067e-7,55.5984,97.0243,350.3936,9.5673]},41860:{name:"GSAT0212 (GALILEO 16)",elements:[41860,1794492695615,1.70474475,2921e-7,55.5979,96.9746,46.7742,313.218]},41861:{name:"GSAT0213 (GALILEO 17)",elements:[41861,1794473714581,1.70474739,1706e-7,55.5992,96.9887,300.862,59.0886]},41862:{name:"GSAT0214 (GALILEO 18)",elements:[41862,1794486370747,1.70474549,1556e-7,55.5978,96.977,302.0561,57.8965]},41882:{name:"FENGYUN 4A",elements:[41882,1794299451874,1.00282875,8434e-7,2.688,78.4298,170.4493,52.4185]},43055:{name:"GSAT0215 (GALILEO 19)",elements:[43055,1794325938247,1.70473813,1912e-7,55.0341,217.4804,318.2403,41.814]},43056:{name:"GSAT0216 (GALILEO 20)",elements:[43056,1794452448724,1.70473926,3207e-7,55.0341,217.4402,314.5488,45.4995]},43057:{name:"GSAT0217 (GALILEO 21)",elements:[43057,1794268805646,1.7047381,3286e-7,55.0326,217.4961,334.0272,26.0213]},43058:{name:"GSAT0218 (GALILEO 22)",elements:[43058,1794389181927,1.70473888,3499e-7,55.0326,217.4556,305.3008,54.7387]},43564:{name:"GSAT0221 (GALILEO 25)",elements:[43564,1794482257669,1.70476131,6185e-7,57.1094,337.7697,280.4869,79.485]},43565:{name:"GSAT0222 (GALILEO 26)",elements:[43565,1794298530693,1.70475879,596e-6,57.1138,337.8311,258.7304,101.2482]},43566:{name:"GSAT0219 (GALILEO 23)",elements:[43566,1794469641842,1.70476102,5265e-7,57.1122,337.779,284.1352,75.8481]},43567:{name:"GSAT0220 (GALILEO 24)",elements:[43567,1794336702653,1.70476139,5499e-7,57.1126,337.8206,281.2589,78.724]},43823:{name:"GEO-KOMPSAT-2A",elements:[43823,1794515927951,1.00270666,1172e-7,.0509,93.1451,41.3584,355.4776]},43873:{name:"GPS BIII-1  (PRN 04)",elements:[43873,1794513342558,2.0056709,.0041613,55.7843,86.326,197.238,334.8116]},44506:{name:"GPS BIII-2  (PRN 18)",elements:[44506,1794481411505,2.00556365,.0067249,55.5552,325.2375,201.383,329.8654]},45854:{name:"GPS BIII-3  (PRN 23)",elements:[45854,1794475258639,2.00572462,.0070211,56.7548,23.2056,207.8243,206.9769]},46826:{name:"GPS BIII-4  (PRN 14)",elements:[46826,1794510081355,2.00564835,.0077394,53.9556,204.7574,208.3558,115.9967]},48274:{name:"CSS (TIANHE)",elements:[48274,1794508455810,15.61744965,4463e-7,41.4674,139.0588,298.4937,61.5453]},48859:{name:"GPS BIII-5  (PRN 11)",elements:[48859,1794449972833,2.00560757,.0029484,55.0936,326.5022,233.8681,133.1372]},49809:{name:"GSAT0223 (GALILEO 27)",elements:[49809,1794498168043,1.70476326,4579e-7,57.1003,337.6583,245.0083,272.8525]},49810:{name:"GSAT0224 (GALILEO 28)",elements:[49810,1794485875413,1.70476385,3846e-7,57.1012,337.6611,247.4893,295.7125]},51850:{name:"GOES 18",elements:[51850,1794498837920,1.00269672,54e-7,.0072,267.9545,.9715,244.3877]},54743:{name:"METEOSAT-12 (MTG-I1)",elements:[54743,1794508427179,1.00268248,3463e-7,.7607,23.1178,81.6015,225.437]},55268:{name:"GPS BIII-6  (PRN 28)",elements:[55268,1794466742239,2.005608,5338e-7,55.1381,142.6916,334.5058,212.4336]},58990:{name:"INSAT-3DS",elements:[58990,1794387105437,1.00272922,10952e-8,.1203,86.9658,131.3223,47.2861]},59598:{name:"GSAT0225 (GALILEO 29)",elements:[59598,1794410514182,1.70474616,1688e-7,55.2203,96.9591,179.4122,181.6455]},59600:{name:"GSAT0227 (GALILEO 30)",elements:[59600,1794476892337,1.70474684,4009e-7,55.2171,96.9361,106.975,253.0364]},60133:{name:"GOES 19",elements:[60133,1794491327470,1.00272087,663e-7,.0151,70.6981,226.2941,246.7578]},61182:{name:"GSAT0232 (GALILEO 32)",elements:[61182,1794471798652,1.70473535,3572e-7,55.146,217.2537,227.8344,311.4292]},61183:{name:"GSAT0226 (GALILEO 31)",elements:[61183,1794459493382,1.70473535,344e-7,55.1448,217.2646,232.8666,310.3195]},62339:{name:"GPS BIII-7  (PRN 01)",elements:[62339,1794498665421,2.00557046,.0021961,54.7747,328.1511,2.4741,173.1583]},64202:{name:"GPS BIII-8  (PRN 21)",elements:[64202,1794465002740,2.00565565,.0010951,55.3247,25.1846,331.0244,108.162]},67160:{name:"GSAT0233 (GALILEO 33)",elements:[67160,1794489714964,1.70474749,3516e-7,54.438,97.9041,155.7097,339.0468]},67162:{name:"GSAT0234 (GALILEO 34)",elements:[67162,1794495745417,1.70474716,75e-6,54.4397,97.9011,194.7163,162.9708]},67588:{name:"GPS BIII-9  (PRN 20)",elements:[67588,1794465027396,2.00567251,.0021537,55.1955,82.8172,268.0436,91.6896]},68791:{name:"GPS BIII-10 (PRN 13)",elements:[68791,1794510167552,2.00552852,.0023348,54.9453,201.9178,102.8881,117.633]}},Zt={names:Pn,groups:Gn,satellites:Ln},k=Math.PI/180,$=2*Math.PI,Fe=398600.8,Tt=6378.135,de=.001082616,Jt=6371,he=Zt.names,Tn=Zt.groups;function Xt(e){var f,m;const t=String(e??"").trim().toLowerCase(),n=/^\d+$/.test(t)?Number(t):(f=he[t])==null?void 0:f.id,s=n===void 0?void 0:Zt.satellites[n];if(!s)return null;const[,a,i,r,o,l,c,u]=s.elements,h=((m=Object.values(he).find(b=>b.id===n))==null?void 0:m.label)??s.name;return{id:n,name:h,elements:{epoch:a,n:i,e:r,i:o,node:l,perigee:c,M:u}}}d(Xt,"satelliteData");function zn(e){const t=e.n*$/86400,n=Math.min(Math.max(e.e,0),.99),s=e.i*k,a=Math.cos(s),i=1-n*n,r=1.5*de*Tt*Tt*(3*a*a-1)/Math.pow(i,1.5),o=Math.cbrt(Fe/(t*t)),l=r/(2*o*o),c=o*(1-l/3-l*l-134/81*l*l*l),u=r/(2*c*c),h=t/(1+u),f=c/(1-u),m=1.5*de*(Tt/(f*i))**2;return{epoch:e.epoch,a:f,e:n,i:s,node:e.node*k,perigee:e.perigee*k,M:e.M*k,nodeRate:-m*h*a,perigeeRate:.5*m*h*(5*a*a-1),meanRate:h*(1+.5*m*Math.sqrt(i)*(3*a*a-1)),period:$/h}}d(zn,"prepareOrbit");function On(e,t){let n=t<.8?e:Math.PI;for(let s=0;s<12;s++){const a=(n-t*Math.sin(n)-e)/(1-t*Math.cos(n));if(n-=a,Math.abs(a)<1e-10)break}return n}d(On,"eccentricAnomaly");function xt(e,t,n=0){const s=(t-e.epoch)/1e3,a=e.node+e.nodeRate*s,i=e.perigee+e.perigeeRate*s,r=(e.M+e.meanRate*s+n)%$,o=On(r,e.e),l=e.a*(Math.cos(o)-e.e),c=e.a*Math.sqrt(1-e.e*e.e)*Math.sin(o);return Ce(l,c,i,e.i,a)}d(xt,"positionAt");function Ce(e,t,n,s,a){const i=Math.cos(n),r=Math.sin(n),o=Math.cos(s),l=Math.sin(s),c=Math.cos(a),u=Math.sin(a),h=e*i-t*r,f=e*r+t*i;return[h*c-f*o*u,h*u+f*o*c,f*l]}d(Ce,"perifocalToInertial");function Bn(e,t,n=128){const s=(t-e.epoch)/1e3,a=e.node+e.nodeRate*s,i=e.perigee+e.perigeeRate*s,r=[];for(let o=0;o<n;o++){const l=o/n*$,c=e.a*(Math.cos(l)-e.e),u=e.a*Math.sqrt(1-e.e*e.e)*Math.sin(l);r.push(Ce(c,u,i,e.i,a))}return r}d(Bn,"orbitAt");function ke(e){const t=(e/864e5+24405875e-1-2451545)/36525;let n=-62e-7*t**3+.093104*t**2+(876600*3600+8640184812866e-6)*t+67310.54841;return n=n*k/240%$,n<0?n+$:n}d(ke,"siderealAngle");function fe([e,t,n],s){const a=ke(s),i=Math.hypot(e,t,n);let r=(Math.atan2(t,e)-a)/k;return r=((r+180)%360+360)%360-180,{lat:Math.asin(n/i)/k,lon:r,height:i-Jt}}d(fe,"toEarthFixed");function Rn(e,t,n,s){const a=t*k+ke(s),i=Math.cos(e*k);return[n*i*Math.cos(a),n*i*Math.sin(a),n*Math.sin(e*k)]}d(Rn,"fromEarthFixed");function zt(e,t="real"){return t!=="diagram"?e/Jt:.75*Math.log1p(Math.max(0,e)/1e3)}d(zt,"drawnHeight");function $t(e,t,n){const s=Math.cos(n),a=Math.sin(n),i=Math.cos(t),r=Math.sin(t),o=e[0]*s+e[1]*a,l=-e[0]*a*i+e[1]*s*i+e[2]*r;return Math.atan2(l,o)}d($t,"inPlaneAngle");function Un(e,t,n,s,{radiusFromRate:a=false}={}){const i=(s-t)/1e3;if(!(i>0))return null;const r=[e[1]*n[2]-e[2]*n[1],e[2]*n[0]-e[0]*n[2],e[0]*n[1]-e[1]*n[0]],o=Math.hypot(...r),l=Math.hypot(...e),c=Math.hypot(...n);if(o<1e-6*l*c)return null;const h=Math.atan2(o,e[0]*n[0]+e[1]*n[1]+e[2]*n[2])/i,f=Math.acos(Math.max(-1,Math.min(1,r[2]/o))),m=Math.atan2(r[0],-r[1]),b=$t(n,f,m);return{epoch:s,a:a?Math.cbrt(Fe/(h*h)):(l+c)/2,e:0,i:f,node:m,perigee:0,M:b,nodeRate:0,perigeeRate:0,meanRate:h,period:$/h}}d(Un,"orbitFromFixes");function me(e,t,n){const s=e.node+e.nodeRate*((n-e.epoch)/1e3);let a=$t(t,e.i,s)-$t(xt(e,n),e.i,s);return a=((a+Math.PI)%$+$)%$-Math.PI,a}d(me,"anomalyShiftTo");function Nn(e){const t=[],n=[],s=typeof(e==null?void 0:e.group)=="string"?Tn[e.group.toLowerCase()]:void 0;(e==null?void 0:e.group)!==void 0&&!s&&n.push(`group ${e.group}`);const a=[...s??[],...Array.isArray(e==null?void 0:e.satellites)?e.satellites:[]];for(const i of a){const r=Xt(i);r?t.includes(r.id)||t.push(r.id):n.push(String(i))}return{ids:t,unknown:n}}d(Nn,"groupMembers");function fs(e,t=()=>{}){const n=e,s=Array.isArray(n==null?void 0:n.objects)?n.objects:[];if(!s.some(o=>(o==null?void 0:o.type)==="satellites"))return e;const a=Array.isArray(n.points)?[...n.points]:[],i=[],r=sn(s);return s.forEach((o,l)=>{var S;if((o==null?void 0:o.type)!=="satellites")return;const c=r[l],{ids:u,unknown:h}=Nn(o);h.length&&t(`satellites '${c}': no shipped orbit for ${h.join(", ")}`);const f=o._system!==void 0?{_system:o._system}:{},m=o.visible===false?{visible:false}:{},b=d(M=>Object.fromEntries(M.filter(p=>o[p]!==void 0).map(p=>[p,o[p]])),"pick"),y=b(["look","fade","min_distance","max_distance","hide_in_systems"]),x=b(["opacity","tap_action","hold_action","view"]),g=o.orbits===true?{}:o.orbits&&typeof o.orbits=="object"?o.orbits:null;for(const M of u){const p=`${c}.${M}`;a.push({id:p,satellite:M,object:o.object,marker:o.marker??"dot",...o.heights!==void 0?{heights:o.heights}:{},...o.color!==void 0?{color:o.color}:{},...y,...x,...o.label===true?{label:(S=Xt(M))==null?void 0:S.name,style:"tiny"}:{},...m,...f}),g&&i.push({...g,type:"ring",id:`${p}.orbit`,satellite:p,...y,...g.color===void 0&&o.color!==void 0?{color:o.color}:{},...m,...f})}}),{...n,points:a,objects:[...s,...i]}}d(fs,"expandSatelliteGroups");const Dn=2e3,pe=400,W=Math.PI/180,Ot=d(e=>e!=null&&e!=="","isSet");function Q(e,t){return[e*Math.sin(t*W),-e*Math.cos(t*W)]}d(Q,"bearingXZ");function ye(e,t,n,s=new G){const a=Math.cos(t*W);return s.set(n*a*Math.sin(e*W),n*Math.sin(t*W),-n*a*Math.cos(e*W))}d(ye,"altazToLocal");function dt(e,t,n,s=new G){const a=Math.cos(e*W);return s.set(n*a*Math.sin(t*W),n*Math.sin(e*W),n*a*Math.cos(t*W))}d(dt,"latlonToLocal");function ms(e){if(!/^[A-Z]+$/i.test(e))return-1;let t=0;for(const n of e.toUpperCase())t=t*26+(n.charCodeAt(0)-64);return t-1}d(ms,"lettersToIndex");function ps(e){let t=e+1,n="";for(;t>0;){const s=(t-1)%26;n=String.fromCharCode(65+s)+n,t=Math.floor((t-1)/26)}return n}d(ps,"indexToLetters");function ys(e){const t=/^([A-Z]+)(-?\d+)$/i.exec(String(e??"").trim());return t?{col:t[1].toUpperCase(),row:Number(t[2])}:null}d(ys,"parseCell");const jn=["xyz","polar","latlon","altaz"];function Me(e){for(const t of jn){const n=e==null?void 0:e[t];if(n&&typeof n=="object"&&!Array.isArray(n))return{form:t,binding:n}}return null}d(Me,"pointBinding");const Qt=class Qt2{constructor({points:t=[],hosts:n=new Map,sky:s=d(()=>null,"sky"),frame:a=d(()=>null,"frame"),date:i=d(()=>Date.now(),"date"),units:r=d(()=>{},"units")}={}){this.defs=new Map;for(const o of t)o!=null&&o.id&&this.defs.set(String(o.id),o);this.hosts=n,this.sky=s,this.frame=a,this.date=i,this.units=r,this._cache=new Map,this._warned=new Set,this.configs=new Map(this.defs),this._sats=new Map}replaceDef(t,n){this.defs.set(t,{...n,id:t}),this.configs.set(t,{...n,id:t}),this._sats.delete(t),this._cache.clear()}setPosition(t,n,s){const a=this.defs.get(t);return a?n==="fix"?(s&&this._fix(a,s),true):(this.defs.set(t,{...a,[n]:s??void 0,_bound:true}),this._cache.clear(),true):false}has(t){return this.defs.has(t)}invalidate(){this._cache.clear()}resolve(t){return Array.isArray(t)?t.length>=3&&t.every(Number.isFinite)?new G(t[0],t[1],t[2]):null:typeof t=="string"?this.get(t):null}get(t){return this._get(t,new Set)}isDynamic(t,n=new Set){var a;if(typeof t!="string")return false;const s=this.defs.get(t);return!s||n.has(t)?false:(n.add(t),s.sky||s.body||Ot(s.satellite)||Me(this.configs.get(t)??s)||s._bound||s.object&&((a=this.hosts.get(s.object))!=null&&a.moving)?true:s.at?this.isDynamic(s.at,n):false)}_get(t,n){if(this._cache.has(t))return this._cache.get(t);const s=this.defs.get(t);if(!s)return null;if(n.has(t))return this._warn(t,`point '${t}' refers back to itself (${[...n,t].join(" > ")})`),null;n.add(t);const a=this._place(s,n);if(a&&Array.isArray(s.offset)&&s.offset.length>=3){const i=this.frame(s._system),r=i?i.matrixWorld.getMaxScaleOnAxis():1;a.add(new G(+s.offset[0]||0,+s.offset[1]||0,+s.offset[2]||0).multiplyScalar(r))}return n.delete(t),this._cache.set(t,a),a}_place(t,n){var o,l;const s=t.object?this.hosts.get(t.object):void 0;if(t.object&&!s)return this._warn(t.id,`point '${t.id}': no object '${t.object}'`),null;if(s!=null&&s.ready&&!s.ready())return null;if(t.part!==void 0&&t.part!==null&&t.part!==""){if(!(s!=null&&s.partNode))return this._warn(t.id,`point '${t.id}': part '${t.part}' needs a model object`),null;const c=s.partNode(String(t.part));if(!c)return null;const u=Array.isArray(t.xyz)?t.xyz:[0,0,0];return new G(+u[0]||0,+u[1]||0,+u[2]||0).applyMatrix4(c.matrixWorld)}const a=s?null:this.frame(t._system),i=d(c=>s?(s.warp?s.warp(c):c).applyMatrix4(s.node.matrixWorld):a?c.applyMatrix4(a.matrixWorld):c,"world"),r=((s==null?void 0:s.radius)??1)+(Number(t.alt)||0);if(Array.isArray(t.xyz))return i(new G(+t.xyz[0]||0,+t.xyz[1]||0,+t.xyz[2]||0));if(Array.isArray(t.polar)){const[c,u]=Q(+t.polar[0]||0,+t.polar[1]||0);return i(new G(c,Number(t.alt)||0,u))}if(Array.isArray(t.latlon))return i(dt(+t.latlon[0]||0,+t.latlon[1]||0,r));if(Array.isArray(t.altaz))return i(ye(+t.altaz[0]||0,+t.altaz[1]||0,r));if(t.sky){const c=(o=this.sky())==null?void 0:o[t.sky];return c?i(ye(c.azimuth,c.altitude,r)):null}if(t.body!==void 0){const c=this._body(t);return c?i(c):null}if(Ot(t.satellite)){if(!s)return this._warn(t.id,`point '${t.id}': a satellite needs object (an Earth sphere)`),null;const c=this._satelliteLocal(t,s);return c?i(c):null}if(t.cell){const c=((l=s==null?void 0:s.cellPoint)==null?void 0:l.call(s,t.cell))??null;return c||this._warn(t.id,`point '${t.id}': no cell '${t.cell}'${t.object?` on '${t.object}'`:""}`),c?i(c.clone()):null}if(t.at){const c=this._get(t.at,n);return c?c.clone():null}return t._bound||Me(t)||this._warn(t.id,`point '${t.id}' has no position (xyz, polar, latlon, altaz, sky, body, satellite, at or cell)`),null}_sat(t){const n=String(t.satellite);let s=this._sats.get(String(t.id));if(!s||s.key!==n){const a=Xt(n);s={key:n,base:a?zn(a.elements):null,live:null,fixes:[],shift:{from:0,to:0,wall:0},lastFix:null},this._sats.set(String(t.id),s),!a&&!(typeof t.entity=="string"&&t.entity)&&this._warn(t.id,`point '${t.id}': no shipped data for satellite '${n}' (give it an entity for live positions)`)}return s}_shiftNow(t){const n=Math.min(1,Math.max(0,(performance.now()-t.shift.wall)/Dn)),s=n*n*(3-2*n);return t.shift.from+(t.shift.to-t.shift.from)*s}_fix(t,n){const[s,a,i]=n;if(![s,a,i].every(Number.isFinite))return;const r=this._sat(t),o=r.fixes[r.fixes.length-1];if(o&&o.ms===i)return;const l=r.base??r.live,c=r.base?Math.hypot(...xt(r.base,i)):r.live?r.live.a:Jt+pe,u=Rn(s,a,c,i),h=performance.now(),f=this.date(),m=this._shiftNow(r);if(r.base){const y=((me(r.base,u,i)-m)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;r.shift={from:m,to:m+y,wall:h}}else if(o&&i-o.ms>0&&i-o.ms<40*6e4){const b=Un(o.p,o.ms,u,i,{radiusFromRate:true});if(b){const y=l?me(b,xt(l,f,m),f):0;r.live=b,r.shift={from:y,to:0,wall:h}}}r.fixes=[...o?[o]:[],{p:u,ms:i}],r.lastFix={lat:s,lon:a},this._cache.clear()}_satelliteLocal(t,n){const s=this._sat(t),a=n.radius??1,i=t.heights==="diagram"?"diagram":"real",r=s.live??s.base;if(!r)return s.lastFix?dt(s.lastFix.lat,s.lastFix.lon,a*(1+zt(pe,i))):null;const o=this.date(),l=fe(xt(r,o,this._shiftNow(s)),o);return dt(l.lat,l.lon,a*(1+zt(l.height,i)))}satelliteOrbit(t,n=128){const s=this.defs.get(t);if(!s||!Ot(s.satellite))return null;const a=s.object?this.hosts.get(s.object):void 0;if(!a||a.ready&&!a.ready())return null;const i=this._sat(s),r=i.live??i.base;if(!r)return null;const o=a.radius??1,l=s.heights==="diagram"?"diagram":"real",c=this.date();return a.node.updateWorldMatrix(true,false),Bn(r,c,n).map(u=>{const h=fe(u,c);return dt(h.lat,h.lon,o*(1+zt(h.height,l))).applyMatrix4(a.node.matrixWorld)})}_body(t){const n=String(t.body),s=t.center!==void 0&&t.center!==null&&t.center!==""?String(t.center):"sun";if(!et[n]||!et[s])return this._warn(t.id,`point '${t.id}': no body '${et[n]?s:n}'`),null;const a=fn(n,this.date(),s);return a?new G(...bt(a)).multiplyScalar(1/this.kmPerUnit(t._system,t.id)):null}kmPerUnit(t,n=""){const s=an(this.units(t));return s===null?(this._warn(`units:${t??""}`,`${t?`system '${t}'`:"the scene"} has no units (km, au, ...): body point '${n}' reads it as au`),q):s}_warn(t,n){this._warned.has(t)||(this._warned.add(t),ze.warn(`[Astrometrics] ${n}`))}};d(Qt,"Placements");let ge=Qt;const ct=Math.PI/180;function V(e,t,n){e=Math.max(1,Math.round(e)),t=Math.max(1,Math.round(t));const s=new Float32Array((e+1)*(t+1)*3),a=new Float32Array((e+1)*(t+1)*2);let i=0;for(let c=0;c<=t;c++)for(let u=0;u<=e;u++,i++){const[h,f,m,b,y]=n(u/e,c/t);s[i*3]=h,s[i*3+1]=f,s[i*3+2]=m,a[i*2]=b,a[i*2+1]=y}const r=new(e*t*6>65535?Uint32Array:Uint16Array)(e*t*6);let o=0;for(let c=0;c<t;c++)for(let u=0;u<e;u++){const h=c*(e+1)+u,f=h+1,m=h+e+1,b=m+1;r[o++]=h,r[o++]=m,r[o++]=f,r[o++]=f,r[o++]=m,r[o++]=b}const l=new Ge;return l.setAttribute("position",new it(s,3)),l.setAttribute("surf",new it(a,2)),l.setIndex(new it(r,1)),l.computeBoundingSphere(),l}d(V,"surfaceGeometry");const Fn=d((e=32)=>Math.max(e,32),"segs");function Ms(e,t,n=1){const s=Math.max(8*n,Math.min(96,Math.round(32*Math.max(1,e/t)))),a=Math.max(8*n,Math.min(96,Math.round(32*Math.max(1,t/e))));return V(s,a,(i,r)=>{const o=(i-.5)*e,l=(r-.5)*t;return[o,0,l,o,l]})}d(Ms,"planeGeometry");function Cn({r0:e=0,r1:t,a0:n=0,a1:s=360,y:a=0,detail:i=1}){const r=Math.max(8,Math.ceil(Math.abs(s-n)/3.75)),o=Math.max(4,Math.min(48*i,Math.ceil((t-e)/Math.max(t,1e-6)*Fn()*i)));return V(r,o,(l,c)=>{const u=(s-l*(s-n))*ct,h=e+c*(t-e),f=h*Math.sin(u),m=-h*Math.cos(u);return[f,a,m,f,m]})}d(Cn,"discGeometry");function gs({radius:e,lat0:t=-90,lat1:n=90,around:s=1,detail:a=1}){const i=Math.max(8,Math.ceil(Math.abs(n-t)/5.625*a));return V(64,i,(r,o)=>{const l=(1-r)*2*Math.PI,c=(t+o*(n-t))*ct,u=Math.cos(c);return[e*u*Math.sin(l),e*Math.sin(c),e*u*Math.cos(l),l*e*s,c*e]})}d(gs,"sphereGeometry");function Ss({radius:e,around:t=1,detail:n=1}){return V(96,24*n,(s,a)=>{const i=s*2*Math.PI,r=a*Math.PI/2,o=Math.cos(r);return[e*o*Math.sin(i),e*Math.sin(r),-e*o*Math.cos(i),i*e*t,r*e]})}d(Ss,"domeGeometry");function kn({radius:e,y0:t,y1:n,a0:s=0,a1:a=360,around:i=1,detail:r=1}){const o=Math.max(8,Math.ceil(Math.abs(a-s)/3.75)),l=Math.max(r>1?32:2,Math.min(48*r,Math.ceil(Math.abs(n-t)/Math.max(e,1e-6)*8*r)));return V(o,l,(c,u)=>{const h=(s+c*(a-s))*ct,f=t+u*(n-t);return[e*Math.sin(h),f,-e*Math.cos(h),h*e*i,f]})}d(kn,"cylinderGeometry");function bs({profile:e,depth:t,around:n=1,detail:s=1}){const a=e.length-1,i=e[a],r=t/a,o=[0];for(let c=1;c<=a;c++)o.push(o[c-1]+Math.hypot(r,e[c]-e[c-1]));const l=d(c=>{const u=c*a,h=Math.min(a-1,Math.floor(u)),f=u-h;return[e[h]+(e[h+1]-e[h])*f,o[h]+(o[h+1]-o[h])*f]},"at");return V(96,Math.max(8,Math.min(a,32*s)),(c,u)=>{const h=c*2*Math.PI,[f,m]=l(u);return[f*Math.sin(h),-t+u*t,-f*Math.cos(h),h*i*n,m]})}d(bs,"wellGeometry");function Wn({r0:e,r1:t,a:n,y0:s,y1:a}){const i=Math.sin(n*ct),r=-Math.cos(n*ct);return V(16,8,(o,l)=>{const c=e+o*(t-e),u=s+l*(a-s);return[c*i,u,c*r,c,u]})}d(Wn,"radialWallGeometry");function Bt(e,t,n){const s=Math.max(4,Math.min(64,Math.round(16*Math.max(1,e/Math.max(t,1e-6))))),a=Math.max(4,Math.min(64,Math.round(16*Math.max(1,t/Math.max(e,1e-6)))));return V(s,a,(i,r)=>{const o=(i-.5)*e,l=(r-.5)*t;return[...n(o,l),o,l]})}d(Bt,"rectGeometry");function xs(e,t){if(!(t>0)||!(e>0))return 1;const n=2*Math.PI*e;return Math.max(1,Math.round(n/t))*t/n}d(xs,"aroundScale");function $n(e,t){const n=e.map(([o,l])=>new tt(o,l)),s=Ye.triangulateShape(n,[]),a=new Float32Array(e.length*3),i=new Float32Array(e.length*2);e.forEach(([o,l],c)=>{a.set([o,t,l],c*3),i.set([o,l],c*2)});const r=new Ge;return r.setAttribute("position",new it(a,3)),r.setAttribute("surf",new it(i,2)),r.setIndex(s.flat()),r.computeBoundingSphere(),r}d($n,"polygonGeometry");function Hn({a:e,b:t,y0:n,y1:s,s0:a=0}){const i=Math.hypot(t[0]-e[0],t[1]-e[1]);return V(Math.max(1,Math.min(64,Math.ceil(i/Math.max(1e-6,s-n||i)*4))),4,(r,o)=>[e[0]+(t[0]-e[0])*r,n+(s-n)*o,e[1]+(t[1]-e[1])*r,a+i*r,n+(s-n)*o])}d(Hn,"wallGeometry");const Se=new Yt,ht=new G,te=class te2 extends Ke{constructor(){super(),this.isLineSegmentsGeometry=true,this.type="LineSegmentsGeometry";const t=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],n=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],s=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(s),this.setAttribute("position",new ie(t,3)),this.setAttribute("uv",new ie(n,2))}applyMatrix4(t){const n=this.attributes.instanceStart,s=this.attributes.instanceEnd;return n!==void 0&&(n.applyMatrix4(t),s.applyMatrix4(t),n.needsUpdate=true),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(t){let n;t instanceof Float32Array?n=t:Array.isArray(t)&&(n=new Float32Array(t));const s=new wt(n,6,1);return this.setAttribute("instanceStart",new K(s,3,0)),this.setAttribute("instanceEnd",new K(s,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(t){let n;t instanceof Float32Array?n=t:Array.isArray(t)&&(n=new Float32Array(t));const s=new wt(n,6,1);return this.setAttribute("instanceColorStart",new K(s,3,0)),this.setAttribute("instanceColorEnd",new K(s,3,3)),this}fromWireframeGeometry(t){return this.setPositions(t.attributes.position.array),this}fromEdgesGeometry(t){return this.setPositions(t.attributes.position.array),this}fromMesh(t){return this.fromWireframeGeometry(new Ze(t.geometry)),this}fromLineSegments(t){const n=t.geometry;return this.setPositions(n.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Yt);const t=this.attributes.instanceStart,n=this.attributes.instanceEnd;t!==void 0&&n!==void 0&&(this.boundingBox.setFromBufferAttribute(t),Se.setFromBufferAttribute(n),this.boundingBox.union(Se))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Le),this.boundingBox===null&&this.computeBoundingBox();const t=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(t!==void 0&&n!==void 0){const s=this.boundingSphere.center;this.boundingBox.getCenter(s);let a=0;for(let i=0,r=t.count;i<r;i++)ht.fromBufferAttribute(t,i),a=Math.max(a,s.distanceToSquared(ht)),ht.fromBufferAttribute(n,i),a=Math.max(a,s.distanceToSquared(ht));this.boundingSphere.radius=Math.sqrt(a),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}};d(te,"LineSegmentsGeometry");let _t=te;Mt.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new tt},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};yt.line={uniforms:Te.merge([Mt.common,Mt.fog,Mt.line]),vertexShader:`
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
		`};const ee=class ee2 extends Ee{constructor(t){super({type:"LineMaterial",uniforms:Te.clone(yt.line.uniforms),vertexShader:yt.line.vertexShader,fragmentShader:yt.line.fragmentShader,clipping:true}),this.isLineMaterial=true,this.setValues(t)}get color(){return this.uniforms.diffuse.value}set color(t){this.uniforms.diffuse.value=t}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(t){t===true!==this.worldUnits&&(this.needsUpdate=true),t===true?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(t){this.uniforms.linewidth&&(this.uniforms.linewidth.value=t)}get dashed(){return"USE_DASH"in this.defines}set dashed(t){t===true!==this.dashed&&(this.needsUpdate=true),t===true?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(t){this.uniforms.dashScale.value=t}get dashSize(){return this.uniforms.dashSize.value}set dashSize(t){this.uniforms.dashSize.value=t}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(t){this.uniforms.dashOffset.value=t}get gapSize(){return this.uniforms.gapSize.value}set gapSize(t){this.uniforms.gapSize.value=t}get opacity(){return this.uniforms.opacity.value}set opacity(t){this.uniforms&&(this.uniforms.opacity.value=t)}get resolution(){return this.uniforms.resolution.value}set resolution(t){this.uniforms.resolution.value.copy(t)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(t){this.defines&&(t===true!==this.alphaToCoverage&&(this.needsUpdate=true),t===true?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}};d(ee,"LineMaterial");let It=ee;const Rt=new lt,be=new G,xe=new G,z=new lt,O=new lt,j=new lt,Ut=new G,Nt=new Et,B=new Je,we=new G,ft=new Yt,mt=new Le,F=new lt;let C,X;function ve(e,t,n){return F.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),F.multiplyScalar(1/F.w),F.x=X/n.width,F.y=X/n.height,F.applyMatrix4(e.projectionMatrixInverse),F.multiplyScalar(1/F.w),Math.abs(Math.max(F.x,F.y))}d(ve,"getWorldSpaceHalfWidth");function qn(e,t){const n=e.matrixWorld,s=e.geometry,a=s.attributes.instanceStart,i=s.attributes.instanceEnd,r=Math.min(s.instanceCount,a.count);for(let o=0,l=r;o<l;o++){B.start.fromBufferAttribute(a,o),B.end.fromBufferAttribute(i,o),B.applyMatrix4(n);const c=new G,u=new G;C.distanceSqToSegment(B.start,B.end,u,c),u.distanceTo(c)<X*.5&&t.push({point:u,pointOnLine:c,distance:C.origin.distanceTo(u),object:e,face:null,faceIndex:o,uv:null,uv1:null})}}d(qn,"raycastWorldUnits");function Vn(e,t,n){const s=t.projectionMatrix,i=e.material.resolution,r=e.matrixWorld,o=e.geometry,l=o.attributes.instanceStart,c=o.attributes.instanceEnd,u=Math.min(o.instanceCount,l.count),h=-t.near;C.at(1,j),j.w=1,j.applyMatrix4(t.matrixWorldInverse),j.applyMatrix4(s),j.multiplyScalar(1/j.w),j.x*=i.x/2,j.y*=i.y/2,j.z=0,Ut.copy(j),Nt.multiplyMatrices(t.matrixWorldInverse,r);for(let f=0,m=u;f<m;f++){if(z.fromBufferAttribute(l,f),O.fromBufferAttribute(c,f),z.w=1,O.w=1,z.applyMatrix4(Nt),O.applyMatrix4(Nt),z.z>h&&O.z>h)continue;if(z.z>h){const M=z.z-O.z,p=(z.z-h)/M;z.lerp(O,p)}else if(O.z>h){const M=O.z-z.z,p=(O.z-h)/M;O.lerp(z,p)}z.applyMatrix4(s),O.applyMatrix4(s),z.multiplyScalar(1/z.w),O.multiplyScalar(1/O.w),z.x*=i.x/2,z.y*=i.y/2,O.x*=i.x/2,O.y*=i.y/2,B.start.copy(z),B.start.z=0,B.end.copy(O),B.end.z=0;const y=B.closestPointToPointParameter(Ut,true);B.at(y,we);const x=at.lerp(z.z,O.z,y),g=x>=-1&&x<=1,S=Ut.distanceTo(we)<X*.5;if(g&&S){B.start.fromBufferAttribute(l,f),B.end.fromBufferAttribute(c,f),B.start.applyMatrix4(r),B.end.applyMatrix4(r);const M=new G,p=new G;C.distanceSqToSegment(B.start,B.end,p,M),n.push({point:p,pointOnLine:M,distance:C.origin.distanceTo(p),object:e,face:null,faceIndex:f,uv:null,uv1:null})}}}d(Vn,"raycastScreenSpace");const ne=class ne2 extends Dt{constructor(t=new _t,n=new It({color:Math.random()*16777215})){super(t,n),this.isLineSegments2=true,this.type="LineSegments2"}computeLineDistances(){const t=this.geometry,n=t.attributes.instanceStart,s=t.attributes.instanceEnd,a=new Float32Array(2*n.count);for(let r=0,o=0,l=n.count;r<l;r++,o+=2)be.fromBufferAttribute(n,r),xe.fromBufferAttribute(s,r),a[o]=o===0?0:a[o-1],a[o+1]=a[o]+be.distanceTo(xe);const i=new wt(a,2,1);return t.setAttribute("instanceDistanceStart",new K(i,1,0)),t.setAttribute("instanceDistanceEnd",new K(i,1,1)),this}raycast(t,n){const s=this.material.worldUnits,a=t.camera;if(a===null&&!s&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.'),s===false&&(this.material.resolution.x===0||this.material.resolution.y===0))return;const i=t.params.Line2!==void 0&&t.params.Line2.threshold||0;C=t.ray;const r=this.matrixWorld,o=this.geometry,l=this.material;X=l.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),mt.copy(o.boundingSphere).applyMatrix4(r);let c;if(s)c=X*.5;else{const h=Math.max(a.near,mt.distanceToPoint(C.origin));c=ve(a,h,l.resolution)}if(mt.radius+=c,C.intersectsSphere(mt)===false)return;o.boundingBox===null&&o.computeBoundingBox(),ft.copy(o.boundingBox).applyMatrix4(r);let u;if(s)u=X*.5;else{const h=Math.max(a.near,ft.distanceToPoint(C.origin));u=ve(a,h,l.resolution)}ft.expandByScalar(u),C.intersectsBox(ft)!==false&&(s?qn(this,n):Vn(this,a,n))}onBeforeRender(t){const n=this.material.uniforms;n&&n.resolution&&(t.getViewport(Rt),this.material.uniforms.resolution.value.set(Rt.z,Rt.w))}};d(ne,"LineSegments2");let Ht=ne;const se=class se2 extends It{constructor(t){super(t),this.vertexShader=this.vertexShader.replace("void main() {",`varying float vPxW;
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
			#endif`)}};d(se,"PxDashLineMaterial");let qt=se;function Yn(e){let t=0;for(const i of e)t+=Math.max(0,i.length/3-1);const n=new Float64Array(t*6),s=new Uint8Array(t);let a=0;for(const i of e){const r=i.length/3;for(let o=0;o<r-1;o++,a++)n.set(i.slice(o*3,o*3+6),a*6),s[a]=o===0?1:0}return{positions:n,starts:s,count:t}}d(Yn,"runsToSegments");function Kn(e,t,n,s,a,i,r){const o=n.elements,l=r==null?void 0:r.elements,c=!!l&&l[11]===-1,u=c?-(l[10]>0?-l[14]/(l[10]+1):-.5*l[14]/l[10]):0,h=d(y=>o[3]*e[y]+o[7]*e[y+1]+o[11]*e[y+2]+o[15],"w"),f=d((y,x,g)=>{const S=e[y]+(e[x]-e[y])*g,M=e[y+1]+(e[x+1]-e[y+1])*g,p=e[y+2]+(e[x+2]-e[y+2])*g,A=o[3]*S+o[7]*M+o[11]*p+o[15];return[(o[0]*S+o[4]*M+o[8]*p+o[12])/A*.5*s,(o[1]*S+o[5]*M+o[9]*p+o[13])/A*.5*a]},"at");let m=0;const b=t.length;for(let y=0;y<b;y++){t[y]&&(m=0);const x=y*6,g=x+3,S=h(x),M=h(g);if(S>1e-6&&M>1e-6){const[p,A]=f(x,g,0),[_,N]=f(x,g,1),R=Math.hypot(_-p,N-A);i[y*2]=m,i[y*2+1]=m+R,m+=R}else if(c&&S>0&&M<=0){const p=(S-u)/(S-M),[A,_]=f(x,g,0),[N,R]=f(x,g,p),T=Math.hypot(N-A,R-_);i[y*2]=m,i[y*2+1]=p>1e-9?m+T/p:m,m+=T}else if(c&&M>0&&S<=0){const p=(M-u)/(M-S),[A,_]=f(x,g,1),[N,R]=f(g,x,p),T=Math.hypot(A-N,_-R);i[y*2]=p>1e-9?m+T-T/p:m,i[y*2+1]=m+T,m+=T}else i[y*2]=m,i[y*2+1]=m}return i}d(Kn,"screenDistances");const Ae=d(e=>e.map(t=>t<=.04045?t/12.92:((t+.055)/1.055)**2.4),"toLinear"),_e=new Et,Zn=new Et,pt=new G,ae=class ae2{constructor(t,n){var i,r,o;this.style=n;const s=Array.isArray(n.dash)&&n.dash.length>=2&&n.dash[0]>0,a=n.color;this.material=new qt({color:n.colorTo?16777215:new Xe().setRGB(a[0],a[1],a[2],oe).getHex(),linewidth:n.width??1.5,worldUnits:false,dashed:s,dashSize:s?Number((i=n.dash)==null?void 0:i[0]):1,gapSize:s?Math.max(0,Number(((r=n.dash)==null?void 0:r[1])??((o=n.dash)==null?void 0:o[0]))):1,transparent:true,opacity:(n.opacity??1)*(a[3]??1),vertexColors:!!n.colorTo,depthWrite:false}),n.additive&&(this.material.blending=Pe),n.tube&&(this.material.defines.USE_TUBE=""),n.soft&&(this.material.defines.USE_SOFT=""),n.lighten&&(this.material.defines.USE_LIGHTEN="",this.material.blending=Qe,this.material.blendEquation=tn,this.material.blendSrc=re,this.material.blendDst=re),this.dashed=s,this.geometry=new _t,this.object=new Ht(this.geometry,this.material),this.object.renderOrder=n.renderOrder??3,this.object.frustumCulled=false,this._segs={positions:new Float64Array(0),starts:new Uint8Array(0),count:0},this._abs=new Float64Array(0),this._anchor=[0,0,0],this._moved=false,this._dist=null,this._distBuffer=null,this.setRuns(t)}setRuns(t){const n=Yn(t);if(this._abs=n.positions,this._segs={...n,positions:this._relative(n.positions)},!n.count){this.object.visible=false;return}this.object.visible=true,this.geometry.setPositions(Float32Array.from(this._segs.positions)),this.geometry._maxInstanceCount=void 0,this.style.colorTo&&this.geometry.setColors(this._colors(t)),this.dashed&&(this._dist=new Float32Array(n.count*2),this._distBuffer=new wt(this._dist,2,1),this.geometry.setAttribute("instanceDistanceStart",new K(this._distBuffer,1,0)),this.geometry.setAttribute("instanceDistanceEnd",new K(this._distBuffer,1,1)))}segmentPositions(){return Float32Array.from(this._segs.positions)}moveSegments(t){const n=this.geometry.getAttribute("instanceStart");!n||n.data.array.length!==t.length||(this._moved=true,n.data.array.set(t),n.data.needsUpdate=true)}_relative(t){const[n,s,a]=this._anchor,i=new Float64Array(t.length);for(let r=0;r<t.length;r+=3)i[r]=t[r]-n,i[r+1]=t[r+1]-s,i[r+2]=t[r+2]-a;return i}anchorTo(t){const n=this._abs;if(this._moved||!this._segs.count||!this.object.visible||!this.object.parent)return false;pt.setFromMatrixPosition(t.matrixWorld).applyMatrix4(Zn.copy(this.object.parent.matrixWorld).invert());let s=0,a=1/0;for(let u=0;u<n.length;u+=3){const h=(n[u]-pt.x)**2+(n[u+1]-pt.y)**2+(n[u+2]-pt.z)**2;h<a&&(a=h,s=u)}const[i,r,o]=this._anchor;if(Math.hypot(n[s]-i,n[s+1]-r,n[s+2]-o)*1e-6<=Math.sqrt(a))return false;this._anchor=[n[s],n[s+1],n[s+2]],this._segs={...this._segs,positions:this._relative(n)};const c=this.geometry.getAttribute("instanceStart");return c&&c.data.array.length===this._segs.positions.length?(c.data.array.set(this._segs.positions),c.data.needsUpdate=true):this.geometry.setPositions(Float32Array.from(this._segs.positions)),this.geometry.computeBoundingSphere(),this.object.position.set(this._anchor[0],this._anchor[1],this._anchor[2]),this.object.updateMatrixWorld(),true}_colors(t){const n=Ae(this.style.color.slice(0,3)),s=Ae((this.style.colorTo??this.style.color).slice(0,3)),a=new Float32Array(this._segs.count*6);let i=0;for(const r of t){const o=r.length/3;for(let l=0;l<o-1;l++,i++)for(let c=0;c<2;c++){const u=o>1?(l+c)/(o-1):0;for(let h=0;h<3;h++)a[i*6+c*3+h]=n[h]+(s[h]-n[h])*u}}return a}setResolution(t,n){this.material.resolution.set(t,n)}updateDashes(t,n,s){this.anchorTo(t),!(!this.dashed||!this._dist||!this._distBuffer||!this._segs.count||!this.object.visible)&&(_e.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse).multiply(this.object.matrixWorld),Kn(this._segs.positions,this._segs.starts,_e,n,s,this._dist,t.projectionMatrix),this._distBuffer.needsUpdate=true)}setFlow(t){if(!this.dashed)return;const n=this.material.dashSize+this.material.gapSize;this.material.dashOffset=n>0?-((t%n+n)%n):0}setColor(t,n){this.style={...this.style,color:t,colorTo:n??this.style.colorTo},this.style.colorTo?this._segs.count&&this.geometry.setColors(this._colorsFromSegments()):this.material.color.setRGB(t[0],t[1],t[2],oe),this.material.opacity=(this.style.opacity??1)*(t[3]??1)}_colorsFromSegments(){const t=[],{positions:n,starts:s,count:a}=this._segs;for(let i=0;i<a;i++)s[i]&&t.push(Array.from(n.subarray(i*6,i*6+3))),t[t.length-1].push(...n.subarray(i*6+3,i*6+6));return this._colors(t)}dispose(){this.geometry.dispose(),this.material.dispose()}};d(ae,"FatLine");let Vt=ae;const Jn=Math.PI/180;function Xn(e){if(!Array.isArray(e))return null;const t=e.filter(n=>Array.isArray(n)&&n.length>=2&&Number.isFinite(Number(n[0]))&&Number.isFinite(Number(n[1]))).map(n=>[Number(n[0]),Number(n[1])]);return t.length>=3?t:null}d(Xn,"prismOutline");function ws(e,t){const n=new Ie;n.name=`volume:${e.id??""}`;const s=An(e,n),a=w(e.opacity,1),i=t.color(e.color,rt.volume),r=w(Z(e.faces).opacity,.45),o=Wt(i,r),l=Wt(i,Math.min(1,r*1.8)),c=w(e.back_opacity,1),u=e.cells??{},h=w(e.line_width,1),f=d((g,S={})=>({pattern:"both",cell:g,color:o,colorMajor:l,widthMinor:h,widthMajor:h,back:c,opacity:a,additive:e.blend==="add",...S}),"look"),m=[],b=d((g,S,M=false)=>{const p=xn(g,S);n.add(p),s.gridFaces.push(p),s.pickMeshes.push(...p.children),M&&m.push(p)},"face"),y=[],x=e.shape==="prism"?Xn(e.outline):null;if(e.shape==="prism"&&x){const[g,S]=ut(e.height,[0,10]),M=x.map(v=>v[0]),p=x.map(v=>v[1]),A=Math.max(Math.max(...M)-Math.min(...M),Math.max(...p)-Math.min(...p)),_=w(u.width,A/8),N=w(u.depth,A/8),R=w(u.height,(S-g)/2);for(const v of[g,S])b($n(x,v),f([_,N]));let T=0;x.forEach((v,I)=>{const E=x[(I+1)%x.length];b(Hn({a:v,b:E,y0:g,y1:S,s0:T}),f([_,R]),true),T+=Math.hypot(E[0]-v[0],E[1]-v[1]);for(const D of[g,S])y.push([v[0],D,v[1],E[0],D,E[1]]);y.push([v[0],g,v[1],v[0],S,v[1]])}),s.centre=[M.reduce((v,I)=>v+I,0)/M.length,(g+S)/2,p.reduce((v,I)=>v+I,0)/p.length]}else if(e.shape==="box"){const g=Array.isArray(e.size)?e.size:[w(e.size,20),w(e.size,20),w(e.size,20)],[S,M,p]=[w(g[0],20),w(g[1],20),w(g[2],20)],A=w(u.width,S/4),_=w(u.height,M/4),N=w(u.depth,p/4);for(const I of[-M/2,M/2])b(Bt(S,p,(E,D)=>[E,I,D]),f([A,N]));for(const I of[-p/2,p/2])b(Bt(S,M,(E,D)=>[E,D,I]),f([A,_]),true);for(const I of[-S/2,S/2])b(Bt(p,M,(E,D)=>[I,D,E]),f([N,_]),true);const R=[-S/2,S/2],T=[-M/2,M/2],v=[-p/2,p/2];for(const I of T)for(const E of v)y.push([R[0],I,E,R[1],I,E]);for(const I of R)for(const E of v)y.push([I,T[0],E,I,T[1],E]);for(const I of R)for(const E of T)y.push([I,E,v[0],I,E,v[1]])}else{const[g,S]=ut(e.radius,[50,100]),[M,p]=ut(e.angle,[0,90]),[A,_]=ut(e.height,[0,10]),N=w(u.ring,(S-g)/4),R=Math.max(.5,w(u.angle,10)),T=w(u.layer,(_-A)/2),v={pattern:"polar",planePolar:true,spokes:Math.round(360/R),majorRow:0,majorCol:0};for(const U of[A,_])b(Cn({r0:g,r1:S,a0:M,a1:p,y:U}),f([N,N],v));for(const U of[g,S])U>0&&b(kn({radius:U,y0:A,y1:_,a0:M,a1:p}),f([U*R*Jn,T]),true);for(const U of[M,p])b(Wn({r0:g,r1:S,a:U,y0:A,y1:_}),f([N,T]),true);const I=Math.max(8,Math.ceil(Math.abs(p-M)/2)),E=d((U,H)=>{const J=[];for(let Y=0;Y<=I;Y++){const[Gt,Lt]=Q(U,M+Y/I*(p-M));J.push(Gt,H,Lt)}return J},"arc");for(const U of[A,_])for(const H of[g,S])H>0&&y.push(E(H,U));for(const U of[A,_])for(const H of[M,p]){const[J,Y]=Q(g,H),[Gt,Lt]=Q(S,H);y.push([J,U,Y,Gt,U,Lt])}for(const U of[g,S])for(const H of[M,p]){const[J,Y]=Q(U,H);y.push([J,A,Y,J,_,Y])}const[D,We]=Q((g+S)/2,(M+p)/2);s.centre=[D,(A+_)/2,We]}if(_n(e.edges,true)){const g=Z(e.edges),S=new Vt(y,{color:g.color!==void 0?t.color(g.color,rt.volume):i,width:w(g.width,1.5),opacity:a*.9,additive:e.blend==="add"});n.add(S.object),s.lines.push(S)}return s.tick=En(e,t,m),s}d(ws,"buildVolume");export{q as A,et as B,ye as C,rt as D,is as E,Vt as F,bt as G,fs as H,ws as I,ls as J,rs as K,jn as L,os as M,ss as N,Me as O,ge as P,De as Q,Ue as R,Xn as S,Ms as a,An as b,Ss as c,Cn as d,gs as e,kn as f,us as g,hs as h,_n as i,ds as j,En as k,xn as l,In as m,w as n,ps as o,ut as p,ys as q,ms as r,Z as s,Q as t,xs as u,cs as v,bs as w,ln as x,as as y,yn as z};
//# sourceMappingURL=volume-DADSQIfM.js.map
