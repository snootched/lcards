var wu=Object.defineProperty;var h=(i,t)=>wu(i,"name",{value:t,configurable:true});/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Qa="186";const $_=0,K_=1,J_=2,Q_=0,j_=1,t0=2;const e0=5;const n0=104;const i0=201;const dc="attached",Cu="detached";const r0=1e3,s0=1001,a0=1002,o0=1003,l0=1004,c0=1005,h0=1006,u0=1007,d0=1008;const f0=1014;const p0=1023;const m0=1028;const g0=2201;const _0=2300,x0=2301;const v0=0,S0=1,M0=2;const wn="",ke="srgb",Vr="srgb-linear",kr="linear",Qt="srgb";const fc="300 es";function Pu(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return true;return false}h(Pu,"arrayNeedsUint32");function Iu(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}h(Iu,"isTypedArray");function Hi(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}h(Hi,"createElementNS");function Du(){const i=Hi("canvas");return i.style.display="block",i}h(Du,"createCanvasElement");const pc={};function Hr(...i){const t="THREE."+i.shift();console.log(t,...i)}h(Hr,"log");function su(i){const t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}h(su,"enhanceLogMessage");function Tt(...i){i=su(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}h(Tt,"warn");function Pt(...i){i=su(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}h(Pt,"error");function gi(...i){const t=i.join(" ");t in pc||(pc[t]=true,Tt(...i))}h(gi,"warnOnce");function Lu(i,t,e){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}h(s,"probe"),setTimeout(s,e)})}h(Lu,"probeAsync");const Nu={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},no=class no2{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?false:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const r=n[t];if(r!==void 0){const s=r.indexOf(e);s!==-1&&r.splice(s,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,t);t.target=null}}};h(no,"EventDispatcher");let sn=no;const Ae=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let mc=1234567;const _i=Math.PI/180,Si=180/Math.PI;function Ke(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ae[i&255]+Ae[i>>8&255]+Ae[i>>16&255]+Ae[i>>24&255]+"-"+Ae[t&255]+Ae[t>>8&255]+"-"+Ae[t>>16&15|64]+Ae[t>>24&255]+"-"+Ae[e&63|128]+Ae[e>>8&255]+"-"+Ae[e>>16&255]+Ae[e>>24&255]+Ae[n&255]+Ae[n>>8&255]+Ae[n>>16&255]+Ae[n>>24&255]).toLowerCase()}h(Ke,"generateUUID");function Nt(i,t,e){return Math.max(t,Math.min(e,i))}h(Nt,"clamp");function ja(i,t){return(i%t+t)%t}h(ja,"euclideanModulo");function Uu(i,t,e,n,r){return n+(i-t)*(r-n)/(e-t)}h(Uu,"mapLinear");function Fu(i,t,e){return i!==t?(e-i)/(t-i):0}h(Fu,"inverseLerp");function Gi(i,t,e){return(1-e)*i+e*t}h(Gi,"lerp");function Bu(i,t,e,n){return Gi(i,t,1-Math.exp(-e*n))}h(Bu,"damp");function Ou(i,t=1){return t-Math.abs(ja(i,t*2)-t)}h(Ou,"pingpong");function zu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}h(zu,"smoothstep");function Gu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}h(Gu,"smootherstep");function Vu(i,t){return i+Math.floor(Math.random()*(t-i+1))}h(Vu,"randInt");function ku(i,t){return i+Math.random()*(t-i)}h(ku,"randFloat");function Hu(i){return i*(.5-Math.random())}h(Hu,"randFloatSpread");function Wu(i){i!==void 0&&(mc=i);let t=mc+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}h(Wu,"seededRandom");function Xu(i){return i*_i}h(Xu,"degToRad");function qu(i){return i*Si}h(qu,"radToDeg");function Yu(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}h(Yu,"isPowerOfTwo");function Zu(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}h(Zu,"ceilPowerOfTwo");function $u(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}h($u,"floorPowerOfTwo");function Ku(i,t,e,n,r){const s=Math.cos,a=Math.sin,o=s(e/2),c=a(e/2),l=s((t+n)/2),d=a((t+n)/2),f=s((t-n)/2),u=a((t-n)/2),m=s((n-t)/2),_=a((n-t)/2);switch(r){case"XYX":i.set(o*d,c*f,c*u,o*l);break;case"YZY":i.set(c*u,o*d,c*f,o*l);break;case"ZXZ":i.set(c*f,c*u,o*d,o*l);break;case"XZX":i.set(o*d,c*_,c*m,o*l);break;case"YXY":i.set(c*m,o*d,c*_,o*l);break;case"ZYZ":i.set(c*_,c*m,o*d,o*l);break;default:Tt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}h(Ku,"setQuaternionFromProperEuler");function $e(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}h($e,"denormalize");function jt(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}h(jt,"normalize");const y0={DEG2RAD:_i,RAD2DEG:Si,generateUUID:Ke,clamp:Nt,euclideanModulo:ja,mapLinear:Uu,inverseLerp:Fu,lerp:Gi,damp:Bu,pingpong:Ou,smoothstep:zu,smootherstep:Gu,randInt:Vu,randFloat:ku,randFloatSpread:Hu,seededRandom:Wu,degToRad:Xu,radToDeg:qu,isPowerOfTwo:Yu,ceilPowerOfTwo:Zu,floorPowerOfTwo:$u,setQuaternionFromProperEuler:Ku,normalize:jt,denormalize:$e},hs=class hs2{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6],this.y=r[1]*e+r[4]*n+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Nt(this.x,t.x,e.x),this.y=Nt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Nt(this.x,t,e),this.y=Nt(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Nt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Nt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),r=Math.sin(e),s=this.x-t.x,a=this.y-t.y;return this.x=s*n-a*r+t.x,this.y=s*r+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};h(hs,"Vector2"),hs.prototype.isVector2=true;let It=hs;const io=class io2{constructor(t=0,e=0,n=0,r=1){this.isQuaternion=true,this._x=t,this._y=e,this._z=n,this._w=r}static slerpFlat(t,e,n,r,s,a,o){let c=n[r+0],l=n[r+1],d=n[r+2],f=n[r+3],u=s[a+0],m=s[a+1],_=s[a+2],y=s[a+3];if(f!==y||c!==u||l!==m||d!==_){let g=c*u+l*m+d*_+f*y;g<0&&(u=-u,m=-m,_=-_,y=-y,g=-g);let p=1-o;if(g<.9995){const E=Math.acos(g),R=Math.sin(E);p=Math.sin(p*E)/R,o=Math.sin(o*E)/R,c=c*p+u*o,l=l*p+m*o,d=d*p+_*o,f=f*p+y*o}else{c=c*p+u*o,l=l*p+m*o,d=d*p+_*o,f=f*p+y*o;const E=1/Math.sqrt(c*c+l*l+d*d+f*f);c*=E,l*=E,d*=E,f*=E}}t[e]=c,t[e+1]=l,t[e+2]=d,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,r,s,a){const o=n[r],c=n[r+1],l=n[r+2],d=n[r+3],f=s[a],u=s[a+1],m=s[a+2],_=s[a+3];return t[e]=o*_+d*f+c*m-l*u,t[e+1]=c*_+d*u+l*f-o*m,t[e+2]=l*_+d*m+o*u-c*f,t[e+3]=d*_-o*f-c*u-l*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,r){return this._x=t,this._y=e,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=true){const n=t._x,r=t._y,s=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(n/2),d=o(r/2),f=o(s/2),u=c(n/2),m=c(r/2),_=c(s/2);switch(a){case"XYZ":this._x=u*d*f+l*m*_,this._y=l*m*f-u*d*_,this._z=l*d*_+u*m*f,this._w=l*d*f-u*m*_;break;case"YXZ":this._x=u*d*f+l*m*_,this._y=l*m*f-u*d*_,this._z=l*d*_-u*m*f,this._w=l*d*f+u*m*_;break;case"ZXY":this._x=u*d*f-l*m*_,this._y=l*m*f+u*d*_,this._z=l*d*_+u*m*f,this._w=l*d*f-u*m*_;break;case"ZYX":this._x=u*d*f-l*m*_,this._y=l*m*f+u*d*_,this._z=l*d*_-u*m*f,this._w=l*d*f+u*m*_;break;case"YZX":this._x=u*d*f+l*m*_,this._y=l*m*f+u*d*_,this._z=l*d*_-u*m*f,this._w=l*d*f-u*m*_;break;case"XZY":this._x=u*d*f-l*m*_,this._y=l*m*f-u*d*_,this._z=l*d*_+u*m*f,this._w=l*d*f+u*m*_;break;default:Tt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===true&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,r=Math.sin(n);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],r=e[4],s=e[8],a=e[1],o=e[5],c=e[9],l=e[2],d=e[6],f=e[10],u=n+o+f;if(u>0){const m=.5/Math.sqrt(u+1);this._w=.25/m,this._x=(d-c)*m,this._y=(s-l)*m,this._z=(a-r)*m}else if(n>o&&n>f){const m=2*Math.sqrt(1+n-o-f);this._w=(d-c)/m,this._x=.25*m,this._y=(r+a)/m,this._z=(s+l)/m}else if(o>f){const m=2*Math.sqrt(1+o-n-f);this._w=(s-l)/m,this._x=(r+a)/m,this._y=.25*m,this._z=(c+d)/m}else{const m=2*Math.sqrt(1+f-n-o);this._w=(a-r)/m,this._x=(s+l)/m,this._y=(c+d)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Nt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const r=Math.min(1,e/n);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,r=t._y,s=t._z,a=t._w,o=e._x,c=e._y,l=e._z,d=e._w;return this._x=n*d+a*o+r*l-s*c,this._y=r*d+a*c+s*o-n*l,this._z=s*d+a*l+n*c-r*o,this._w=a*d-n*o-r*c-s*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,r=t._y,s=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,r=-r,s=-s,a=-a,o=-o);let c=1-e;if(o<.9995){const l=Math.acos(o),d=Math.sin(l);c=Math.sin(c*l)/d,e=Math.sin(e*l)/d,this._x=this._x*c+n*e,this._y=this._y*c+r*e,this._z=this._z*c+s*e,this._w=this._w*c+a*e,this._onChangeCallback()}else this._x=this._x*c+n*e,this._y=this._y*c+r*e,this._z=this._z*c+s*e,this._w=this._w*c+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(t),r*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};h(io,"Quaternion");let He=io;const us=class us2{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(gc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(gc.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*r,this.y=s[1]*e+s[4]*n+s[7]*r,this.z=s[2]*e+s[5]*n+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=t.elements,a=1/(s[3]*e+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*e+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*e+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,r=this.z,s=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*r-o*n),d=2*(o*e-s*r),f=2*(s*n-a*e);return this.x=e+c*l+a*f-o*d,this.y=n+c*d+o*l-s*f,this.z=r+c*f+s*d-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*r,this.y=s[1]*e+s[5]*n+s[9]*r,this.z=s[2]*e+s[6]*n+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Nt(this.x,t.x,e.x),this.y=Nt(this.y,t.y,e.y),this.z=Nt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Nt(this.x,t,e),this.y=Nt(this.y,t,e),this.z=Nt(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Nt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,r=t.y,s=t.z,a=e.x,o=e.y,c=e.z;return this.x=r*c-s*o,this.y=s*a-n*c,this.z=n*o-r*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Is.copy(this).projectOnVector(t),this.sub(Is)}reflect(t){return this.sub(Is.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Nt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,r=this.z-t.z;return e*e+n*n+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const r=Math.sin(e)*t;return this.x=r*Math.sin(n),this.y=Math.cos(e)*t,this.z=r*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};h(us,"Vector3"),us.prototype.isVector3=true;let D=us;const Is=new D,gc=new He,ds=class ds2{constructor(t,e,n,r,s,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,a,o,c,l)}set(t,e,n,r,s,a,o,c,l){const d=this.elements;return d[0]=t,d[1]=r,d[2]=o,d[3]=e,d[4]=s,d[5]=c,d[6]=n,d[7]=a,d[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],d=n[4],f=n[7],u=n[2],m=n[5],_=n[8],y=r[0],g=r[3],p=r[6],E=r[1],R=r[4],S=r[7],T=r[2],b=r[5],C=r[8];return s[0]=a*y+o*E+c*T,s[3]=a*g+o*R+c*b,s[6]=a*p+o*S+c*C,s[1]=l*y+d*E+f*T,s[4]=l*g+d*R+f*b,s[7]=l*p+d*S+f*C,s[2]=u*y+m*E+_*T,s[5]=u*g+m*R+_*b,s[8]=u*p+m*S+_*C,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],c=t[6],l=t[7],d=t[8];return e*a*d-e*o*l-n*s*d+n*o*c+r*s*l-r*a*c}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],c=t[6],l=t[7],d=t[8],f=d*a-o*l,u=o*c-d*s,m=l*s-a*c,_=e*f+n*u+r*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const y=1/_;return t[0]=f*y,t[1]=(r*l-d*n)*y,t[2]=(o*n-r*a)*y,t[3]=u*y,t[4]=(d*e-r*c)*y,t[5]=(r*s-o*e)*y,t[6]=m*y,t[7]=(n*c-l*e)*y,t[8]=(a*e-n*s)*y,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,r,s,a,o){const c=Math.cos(s),l=Math.sin(s);return this.set(n*c,n*l,-n*(c*a+l*o)+a+t,-r*l,r*c,-r*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return gi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ds.makeScale(t,e)),this}rotate(t){return gi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ds.makeRotation(-t)),this}translate(t,e){return gi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ds.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<9;r++)if(e[r]!==n[r])return false;return true}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};h(ds,"Matrix3"),ds.prototype.isMatrix3=true;let Lt=ds;const Ds=new Lt,_c=new Lt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),xc=new Lt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ju(){const i={enabled:true,workingColorSpace:Vr,spaces:{},convert:h(function(r,s,a){return this.enabled===false||s===a||!s||!a||(this.spaces[s].transfer===Qt&&(r.r=gn(r.r),r.g=gn(r.g),r.b=gn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Qt&&(r.r=xi(r.r),r.g=xi(r.g),r.b=xi(r.b))),r},"convert"),workingToColorSpace:h(function(r,s){return this.convert(r,this.workingColorSpace,s)},"workingToColorSpace"),colorSpaceToWorking:h(function(r,s){return this.convert(r,s,this.workingColorSpace)},"colorSpaceToWorking"),getPrimaries:h(function(r){return this.spaces[r].primaries},"getPrimaries"),getTransfer:h(function(r){return r===wn?kr:this.spaces[r].transfer},"getTransfer"),getToneMappingMode:h(function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},"getToneMappingMode"),getLuminanceCoefficients:h(function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},"getLuminanceCoefficients"),define:h(function(r){Object.assign(this.spaces,r)},"define"),_getMatrix:h(function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},"_getMatrix"),_getDrawingBufferColorSpace:h(function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},"_getDrawingBufferColorSpace"),_getUnpackColorSpace:h(function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},"_getUnpackColorSpace"),fromWorkingColorSpace:h(function(r,s){return gi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,s)},"fromWorkingColorSpace"),toWorkingColorSpace:h(function(r,s){return gi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,s)},"toWorkingColorSpace")},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Vr]:{primaries:t,whitePoint:n,transfer:kr,toXYZ:_c,fromXYZ:xc,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:ke},outputColorSpaceConfig:{drawingBufferColorSpace:ke}},[ke]:{primaries:t,whitePoint:n,transfer:Qt,toXYZ:_c,fromXYZ:xc,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:ke}}}),i}h(Ju,"createColorManagement");const Wt=Ju();function gn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}h(gn,"SRGBToLinear");function xi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}h(xi,"LinearToSRGB");let Xn;const ro=class ro2{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Xn===void 0&&(Xn=Hi("canvas")),Xn.width=t.width,Xn.height=t.height;const r=Xn.getContext("2d");t instanceof ImageData?r.putImageData(t,0,0):r.drawImage(t,0,0,t.width,t.height),n=Xn}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Hi("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const r=n.getImageData(0,0,t.width,t.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=gn(s[a]/255)*255;return n.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(gn(e[n]/255)*255):e[n]=gn(e[n]);return{data:e,width:t.width,height:t.height}}else return Tt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}};h(ro,"ImageUtils");let ha=ro,Qu=0;const so=class so2{constructor(t=null){this.isTextureSource=true,Object.defineProperty(this,"id",{value:Qu++}),this.uuid=Ke(),this.data=t,this.dataReady=true,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===true&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Ls(r[a].image)):s.push(Ls(r[a]))}else s=Ls(r);n.url=s}return e||(t.images[this.uuid]=n),n}};h(so,"TextureSource");let Wi=so;function Ls(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ha.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Tt("Texture: Unable to serialize Texture."),{})}h(Ls,"serializeImage");let ju=0;const Ns=new D,pi=class pi2 extends sn{constructor(t=pi2.DEFAULT_IMAGE,e=pi2.DEFAULT_MAPPING,n=1001,r=1001,s=1006,a=1008,o=1023,c=1009,l=pi2.DEFAULT_ANISOTROPY,d=wn){super(),this.isTexture=true,Object.defineProperty(this,"id",{value:ju++}),this.uuid=Ke(),this.name="",this.source=new Wi(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new It(0,0),this.repeat=new It(1,1),this.center=new It(0,0),this.rotation=0,this.matrixAutoUpdate=true,this.matrix=new Lt,this.generateMipmaps=true,this.premultiplyAlpha=false,this.flipY=true,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=false,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=false}get width(){return this.source.getSize(Ns).x}get height(){return this.source.getSize(Ns).y}get depth(){return this.source.getSize(Ns).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=true,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){Tt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){Tt(`Texture.setValues(): property '${e}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==300)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case 1e3:t.x=t.x-Math.floor(t.x);break;case 1001:t.x=t.x<0?0:1;break;case 1002:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case 1e3:t.y=t.y-Math.floor(t.y);break;case 1001:t.y=t.y<0?0:1;break;case 1002:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===true&&(this.version++,this.source.needsUpdate=true)}set needsPMREMUpdate(t){t===true&&this.pmremVersion++}};h(pi,"Texture");let Le=pi;Le.DEFAULT_IMAGE=null;Le.DEFAULT_MAPPING=300;Le.DEFAULT_ANISOTROPY=1;const fs=class fs2{constructor(t=0,e=0,n=0,r=1){this.x=t,this.y=e,this.z=n,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,r){return this.x=t,this.y=e,this.z=n,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*e+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*e+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*e+a[7]*n+a[11]*r+a[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,r,s;const c=t.elements,l=c[0],d=c[4],f=c[8],u=c[1],m=c[5],_=c[9],y=c[2],g=c[6],p=c[10];if(Math.abs(d-u)<.01&&Math.abs(f-y)<.01&&Math.abs(_-g)<.01){if(Math.abs(d+u)<.1&&Math.abs(f+y)<.1&&Math.abs(_+g)<.1&&Math.abs(l+m+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const R=(l+1)/2,S=(m+1)/2,T=(p+1)/2,b=(d+u)/4,C=(f+y)/4,v=(_+g)/4;return R>S&&R>T?R<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(R),r=b/n,s=C/n):S>T?S<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(S),n=b/r,s=v/r):T<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(T),n=C/s,r=v/s),this.set(n,r,s,e),this}let E=Math.sqrt((g-_)*(g-_)+(f-y)*(f-y)+(u-d)*(u-d));return Math.abs(E)<.001&&(E=1),this.x=(g-_)/E,this.y=(f-y)/E,this.z=(u-d)/E,this.w=Math.acos((l+m+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Nt(this.x,t.x,e.x),this.y=Nt(this.y,t.y,e.y),this.z=Nt(this.z,t.z,e.z),this.w=Nt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Nt(this.x,t,e),this.y=Nt(this.y,t,e),this.z=Nt(this.z,t,e),this.w=Nt(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Nt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};h(fs,"Vector4"),fs.prototype.isVector4=true;let ee=fs;const ao=class ao2 extends sn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:false,internalFormat:null,minFilter:1006,depthBuffer:true,stencilBuffer:false,resolveColorBuffer:true,resolveDepthBuffer:true,resolveStencilBuffer:true,storeMultisampledColorBuffer:true,storeMultisampledDepthBuffer:true,storeMultisampledStencilBuffer:true,depthTexture:null,samples:0,count:1,depth:1,multiview:false,useArrayDepthTexture:false},n),this.isRenderTarget=true,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new ee(0,0,t,e),this.scissorTest=false,this.viewport=new ee(0,0,t,e),this.textures=[];const r={width:t,height:e,depth:n.depth},s=new Le(r),a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=true,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:1006,generateMipmaps:false,flipY:false,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=t,this.textures[r].image.height=e,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==true&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=true,this.textures[e].renderTarget=this;const r=Object.assign({},t.textures[e].image);this.textures[e].source=new Wi(r)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}};h(ao,"RenderTarget");let ua=ao;const oo=class oo2 extends ua{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=true}};h(oo,"WebGLRenderTarget");let Be=oo;const lo=class lo2 extends Le{constructor(t=null,e=1,n=1,r=1){super(null),this.isDataArrayTexture=true,this.image={data:t,width:e,height:n,depth:r},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=false,this.flipY=false,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};h(lo,"DataArrayTexture");let Wr=lo;const co=class co2 extends Le{constructor(t=null,e=1,n=1,r=1){super(null),this.isData3DTexture=true,this.image={data:t,width:e,height:n,depth:r},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=false,this.flipY=false,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};h(co,"Data3DTexture");let da=co;const ki=class ki2{constructor(t,e,n,r,s,a,o,c,l,d,f,u,m,_,y,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,a,o,c,l,d,f,u,m,_,y,g)}set(t,e,n,r,s,a,o,c,l,d,f,u,m,_,y,g){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=c,p[2]=l,p[6]=d,p[10]=f,p[14]=u,p[3]=m,p[7]=_,p[11]=y,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ki2().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,n=t.elements,r=1/qn.setFromMatrixColumn(t,0).length(),s=1/qn.setFromMatrixColumn(t,1).length(),a=1/qn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*r,e[1]=n[1]*r,e[2]=n[2]*r,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,r=t.y,s=t.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(r),l=Math.sin(r),d=Math.cos(s),f=Math.sin(s);if(t.order==="XYZ"){const u=a*d,m=a*f,_=o*d,y=o*f;e[0]=c*d,e[4]=-c*f,e[8]=l,e[1]=m+_*l,e[5]=u-y*l,e[9]=-o*c,e[2]=y-u*l,e[6]=_+m*l,e[10]=a*c}else if(t.order==="YXZ"){const u=c*d,m=c*f,_=l*d,y=l*f;e[0]=u+y*o,e[4]=_*o-m,e[8]=a*l,e[1]=a*f,e[5]=a*d,e[9]=-o,e[2]=m*o-_,e[6]=y+u*o,e[10]=a*c}else if(t.order==="ZXY"){const u=c*d,m=c*f,_=l*d,y=l*f;e[0]=u-y*o,e[4]=-a*f,e[8]=_+m*o,e[1]=m+_*o,e[5]=a*d,e[9]=y-u*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){const u=a*d,m=a*f,_=o*d,y=o*f;e[0]=c*d,e[4]=_*l-m,e[8]=u*l+y,e[1]=c*f,e[5]=y*l+u,e[9]=m*l-_,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){const u=a*c,m=a*l,_=o*c,y=o*l;e[0]=c*d,e[4]=y-u*f,e[8]=_*f+m,e[1]=f,e[5]=a*d,e[9]=-o*d,e[2]=-l*d,e[6]=m*f+_,e[10]=u-y*f}else if(t.order==="XZY"){const u=a*c,m=a*l,_=o*c,y=o*l;e[0]=c*d,e[4]=-f,e[8]=l*d,e[1]=u*f+y,e[5]=a*d,e[9]=m*f-_,e[2]=_*f-m,e[6]=o*d,e[10]=y*f+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(td,t,ed)}lookAt(t,e,n){const r=this.elements;return Ue.subVectors(t,e),Ue.lengthSq()===0&&(Ue.z=1),Ue.normalize(),Sn.crossVectors(n,Ue),Sn.lengthSq()===0&&(Math.abs(n.z)===1?Ue.x+=1e-4:Ue.z+=1e-4,Ue.normalize(),Sn.crossVectors(n,Ue)),Sn.normalize(),rr.crossVectors(Ue,Sn),r[0]=Sn.x,r[4]=rr.x,r[8]=Ue.x,r[1]=Sn.y,r[5]=rr.y,r[9]=Ue.y,r[2]=Sn.z,r[6]=rr.z,r[10]=Ue.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],d=n[1],f=n[5],u=n[9],m=n[13],_=n[2],y=n[6],g=n[10],p=n[14],E=n[3],R=n[7],S=n[11],T=n[15],b=r[0],C=r[4],v=r[8],A=r[12],P=r[1],F=r[5],B=r[9],k=r[13],N=r[2],H=r[6],$=r[10],K=r[14],it=r[3],q=r[7],tt=r[11],nt=r[15];return s[0]=a*b+o*P+c*N+l*it,s[4]=a*C+o*F+c*H+l*q,s[8]=a*v+o*B+c*$+l*tt,s[12]=a*A+o*k+c*K+l*nt,s[1]=d*b+f*P+u*N+m*it,s[5]=d*C+f*F+u*H+m*q,s[9]=d*v+f*B+u*$+m*tt,s[13]=d*A+f*k+u*K+m*nt,s[2]=_*b+y*P+g*N+p*it,s[6]=_*C+y*F+g*H+p*q,s[10]=_*v+y*B+g*$+p*tt,s[14]=_*A+y*k+g*K+p*nt,s[3]=E*b+R*P+S*N+T*it,s[7]=E*C+R*F+S*H+T*q,s[11]=E*v+R*B+S*$+T*tt,s[15]=E*A+R*k+S*K+T*nt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],r=t[8],s=t[12],a=t[1],o=t[5],c=t[9],l=t[13],d=t[2],f=t[6],u=t[10],m=t[14],_=t[3],y=t[7],g=t[11],p=t[15],E=c*m-l*u,R=o*m-l*f,S=o*u-c*f,T=a*m-l*d,b=a*u-c*d,C=a*f-o*d;return e*(y*E-g*R+p*S)-n*(_*E-g*T+p*b)+r*(_*R-y*T+p*C)-s*(_*S-y*b+g*C)}determinantAffine(){const t=this.elements,e=t[0],n=t[4],r=t[8],s=t[1],a=t[5],o=t[9],c=t[2],l=t[6],d=t[10];return e*(a*d-o*l)-n*(s*d-o*c)+r*(s*l-a*c)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],c=t[6],l=t[7],d=t[8],f=t[9],u=t[10],m=t[11],_=t[12],y=t[13],g=t[14],p=t[15],E=e*o-n*a,R=e*c-r*a,S=e*l-s*a,T=n*c-r*o,b=n*l-s*o,C=r*l-s*c,v=d*y-f*_,A=d*g-u*_,P=d*p-m*_,F=f*g-u*y,B=f*p-m*y,k=u*p-m*g,N=E*k-R*B+S*F+T*P-b*A+C*v;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const H=1/N;return t[0]=(o*k-c*B+l*F)*H,t[1]=(r*B-n*k-s*F)*H,t[2]=(y*C-g*b+p*T)*H,t[3]=(u*b-f*C-m*T)*H,t[4]=(c*P-a*k-l*A)*H,t[5]=(e*k-r*P+s*A)*H,t[6]=(g*S-_*C-p*R)*H,t[7]=(d*C-u*S+m*R)*H,t[8]=(a*B-o*P+l*v)*H,t[9]=(n*P-e*B-s*v)*H,t[10]=(_*b-y*S+p*E)*H,t[11]=(f*S-d*b-m*E)*H,t[12]=(o*A-a*F-c*v)*H,t[13]=(e*F-n*A+r*v)*H,t[14]=(y*R-_*T-g*E)*H,t[15]=(d*T-f*R+u*E)*H,this}scale(t){const e=this.elements,n=t.x,r=t.y,s=t.z;return e[0]*=n,e[4]*=r,e[8]*=s,e[1]*=n,e[5]*=r,e[9]*=s,e[2]*=n,e[6]*=r,e[10]*=s,e[3]*=n,e[7]*=r,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,r))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),r=Math.sin(e),s=1-n,a=t.x,o=t.y,c=t.z,l=s*a,d=s*o;return this.set(l*a+n,l*o-r*c,l*c+r*o,0,l*o+r*c,d*o+n,d*c-r*a,0,l*c-r*o,d*c+r*a,s*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,r,s,a){return this.set(1,n,s,0,t,1,a,0,e,r,1,0,0,0,0,1),this}compose(t,e,n){const r=this.elements,s=e._x,a=e._y,o=e._z,c=e._w,l=s+s,d=a+a,f=o+o,u=s*l,m=s*d,_=s*f,y=a*d,g=a*f,p=o*f,E=c*l,R=c*d,S=c*f,T=n.x,b=n.y,C=n.z;return r[0]=(1-(y+p))*T,r[1]=(m+S)*T,r[2]=(_-R)*T,r[3]=0,r[4]=(m-S)*b,r[5]=(1-(u+p))*b,r[6]=(g+E)*b,r[7]=0,r[8]=(_+R)*C,r[9]=(g-E)*C,r[10]=(1-(u+y))*C,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,n){const r=this.elements;t.x=r[12],t.y=r[13],t.z=r[14];const s=this.determinantAffine();if(s===0)return n.set(1,1,1),e.identity(),this;let a=qn.set(r[0],r[1],r[2]).length();const o=qn.set(r[4],r[5],r[6]).length(),c=qn.set(r[8],r[9],r[10]).length();s<0&&(a=-a),qe.copy(this);const l=1/a,d=1/o,f=1/c;return qe.elements[0]*=l,qe.elements[1]*=l,qe.elements[2]*=l,qe.elements[4]*=d,qe.elements[5]*=d,qe.elements[6]*=d,qe.elements[8]*=f,qe.elements[9]*=f,qe.elements[10]*=f,e.setFromRotationMatrix(qe),n.x=a,n.y=o,n.z=c,this}makePerspective(t,e,n,r,s,a,o=2e3,c=false){const l=this.elements,d=2*s/(e-t),f=2*s/(n-r),u=(e+t)/(e-t),m=(n+r)/(n-r);let _,y;if(c)_=s/(a-s),y=a*s/(a-s);else if(o===2e3)_=-(a+s)/(a-s),y=-2*a*s/(a-s);else if(o===2001)_=-a/(a-s),y=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=d,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=f,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=_,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,r,s,a,o=2e3,c=false){const l=this.elements,d=2/(e-t),f=2/(n-r),u=-(e+t)/(e-t),m=-(n+r)/(n-r);let _,y;if(c)_=1/(a-s),y=a/(a-s);else if(o===2e3)_=-2/(a-s),y=-(a+s)/(a-s);else if(o===2001)_=-1/(a-s),y=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=d,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=f,l[9]=0,l[13]=m,l[2]=0,l[6]=0,l[10]=_,l[14]=y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<16;r++)if(e[r]!==n[r])return false;return true}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};h(ki,"Matrix4"),ki.prototype.isMatrix4=true;let Gt=ki;const qn=new D,qe=new Gt,td=new D(0,0,0),ed=new D(1,1,1),Sn=new D,rr=new D,Ue=new D,vc=new Gt,Sc=new He,ps=class ps2{constructor(t=0,e=0,n=0,r=ps2.DEFAULT_ORDER){this.isEuler=true,this._x=t,this._y=e,this._z=n,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,r=this._order){return this._x=t,this._y=e,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=true){const r=t.elements,s=r[0],a=r[4],o=r[8],c=r[1],l=r[5],d=r[9],f=r[2],u=r[6],m=r[10];switch(e){case"XYZ":this._y=Math.asin(Nt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,m),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Nt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(Nt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,m),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-Nt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,m),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Nt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,l),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Nt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-d,m),this._y=0);break;default:Tt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===true&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return vc.makeRotationFromQuaternion(t),this.setFromRotationMatrix(vc,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Sc.setFromEuler(this),this.setFromQuaternion(Sc,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};h(ps,"Euler");let Cn=ps;Cn.DEFAULT_ORDER="XYZ";const ho=class ho2{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}};h(ho,"Layers");let Xi=ho,nd=0;const Mc=new D,Yn=new He,ln=new Gt,sr=new D,Ti=new D,id=new D,rd=new He,yc=new D(1,0,0),Ec=new D(0,1,0),bc=new D(0,0,1),Tc={type:"added"},sd={type:"removed"},Zn={type:"childadded",child:null},Us={type:"childremoved",child:null},mi=class mi2 extends sn{constructor(){super(),this.isObject3D=true,Object.defineProperty(this,"id",{value:nd++}),this.uuid=Ke(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=mi2.DEFAULT_UP.clone();const t=new D,e=new Cn,n=new He,r=new D(1,1,1);function s(){n.setFromEuler(e,false)}h(s,"onRotationChange");function a(){e.setFromQuaternion(n,void 0,false)}h(a,"onQuaternionChange"),e._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:true,enumerable:true,value:t},rotation:{configurable:true,enumerable:true,value:e},quaternion:{configurable:true,enumerable:true,value:n},scale:{configurable:true,enumerable:true,value:r},modelViewMatrix:{value:new Gt},normalMatrix:{value:new Lt}}),this.matrix=new Gt,this.matrixWorld=new Gt,this.matrixAutoUpdate=mi2.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=mi2.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=false,this.layers=new Xi,this.visible=true,this.castShadow=false,this.receiveShadow=false,this.frustumCulled=true,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=false,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,true)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Yn.setFromAxisAngle(t,e),this.quaternion.multiply(Yn),this}rotateOnWorldAxis(t,e){return Yn.setFromAxisAngle(t,e),this.quaternion.premultiply(Yn),this}rotateX(t){return this.rotateOnAxis(yc,t)}rotateY(t){return this.rotateOnAxis(Ec,t)}rotateZ(t){return this.rotateOnAxis(bc,t)}translateOnAxis(t,e){return Mc.copy(t).applyQuaternion(this.quaternion),this.position.add(Mc.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(yc,t)}translateY(t){return this.translateOnAxis(Ec,t)}translateZ(t){return this.translateOnAxis(bc,t)}localToWorld(t){return this.updateWorldMatrix(true,false),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(true,false),t.applyMatrix4(ln.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?sr.copy(t):sr.set(t,e,n);const r=this.parent;this.updateWorldMatrix(true,false),Ti.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ln.lookAt(Ti,sr,this.up):ln.lookAt(sr,Ti,this.up),this.quaternion.setFromRotationMatrix(ln),r&&(ln.extractRotation(r.matrixWorld),Yn.setFromRotationMatrix(ln),this.quaternion.premultiply(Yn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Pt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Tc),Zn.child=t,this.dispatchEvent(Zn),Zn.child=null):Pt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(sd),Us.child=t,this.dispatchEvent(Us),Us.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(true,false),ln.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(true,false),ln.multiply(t.parent.matrixWorld)),t.applyMatrix4(ln),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(false,true),t.dispatchEvent(Tc),Zn.child=t,this.dispatchEvent(Zn),Zn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(true,false),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(true,false),this.matrixWorld.decompose(Ti,t,id),t}getWorldScale(t){return this.updateWorldMatrix(true,false),this.matrixWorld.decompose(Ti,rd,t),t}getWorldDirection(t){this.updateWorldMatrix(true,false);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===false)return;t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,n=t.y,r=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*n-s[8]*r,s[13]+=n-s[1]*e-s[5]*n-s[9]*r,s[14]+=r-s[2]*e-s[6]*n-s[10]*r}this.matrixWorldNeedsUpdate=true}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===true&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=false,t=true);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=false){const r=this.parent;if(t===true&&r!==null&&r.updateWorldMatrix(true,false),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===true&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=false,n=true),e===true){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(false,true,n)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(t),r.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(h(s,"serialize"),this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==true&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,d=c.length;l<d;l++){const f=c[l];s(t.shapes,f)}else s(t.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(s(t.materials,this.material[c]));r.material=o}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];r.animations.push(s(t.animations,c))}}if(e){const o=a(t.geometries),c=a(t.materials),l=a(t.textures),d=a(t.images),f=a(t.shapes),u=a(t.skeletons),m=a(t.animations),_=a(t.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),d.length>0&&(n.images=d),f.length>0&&(n.shapes=f),u.length>0&&(n.skeletons=u),m.length>0&&(n.animations=m),_.length>0&&(n.nodes=_)}return n.object=r,n;function a(o){const c=[];for(const l in o){const d=o[l];delete d.metadata,c.push(d)}return c}h(a,"extractFromCache")}clone(t){return new this.constructor().copy(this,t)}copy(t,e=true){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===true)for(let n=0;n<t.children.length;n++){const r=t.children[n];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};h(mi,"Object3D");let pe=mi;pe.DEFAULT_UP=new D(0,1,0);pe.DEFAULT_MATRIX_AUTO_UPDATE=true;pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=true;const uo=class uo2 extends pe{constructor(){super(),this.isGroup=true,this.type="Group"}};h(uo,"Group");let di=uo;const ad={type:"move"},fo=class fo2{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new di,this._hand.matrixAutoUpdate=false,this._hand.visible=false,this._hand.joints={},this._hand.inputState={pinching:false}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new di,this._targetRay.matrixAutoUpdate=false,this._targetRay.visible=false,this._targetRay.hasLinearVelocity=false,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=false,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new di,this._grip.matrixAutoUpdate=false,this._grip.visible=false,this._grip.hasLinearVelocity=false,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=false,this._grip.angularVelocity=new D,this._grip.eventsEnabled=false),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=false),this._grip!==null&&(this._grip.visible=false),this._hand!==null&&(this._hand.visible=false),this}update(t,e,n){let r=null,s=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=true;for(const y of t.hand.values()){const g=e.getJointPose(y,n),p=this._getHandJoint(l,y);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=true,p.jointRadius=g.radius),p.visible=g!==null}const d=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],u=d.position.distanceTo(f.position),m=.02,_=.005;l.inputState.pinching&&u>m+_?(l.inputState.pinching=false,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&u<=m-_&&(l.inputState.pinching=true,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=true,s.linearVelocity?(c.hasLinearVelocity=true,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=false,s.angularVelocity?(c.hasAngularVelocity=true,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=false,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(r=e.getPose(t.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=true,r.linearVelocity?(o.hasLinearVelocity=true,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=false,r.angularVelocity?(o.hasAngularVelocity=true,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=false,this.dispatchEvent(ad)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new di;n.matrixAutoUpdate=false,n.visible=false,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}};h(fo,"WebXRController");let Vi=fo;const au={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Mn={h:0,s:0,l:0},ar={h:0,s:0,l:0};function Fs(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}h(Fs,"hue2rgb");const po=class po2{constructor(t,e,n){return this.isColor=true,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=ke){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Wt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,r=Wt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Wt.colorSpaceToWorking(this,r),this}setHSL(t,e,n,r=Wt.workingColorSpace){if(t=ja(t,1),e=Nt(e,0,1),n=Nt(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,a=2*n-s;this.r=Fs(a,s,t+1/3),this.g=Fs(a,s,t),this.b=Fs(a,s,t-1/3)}return Wt.colorSpaceToWorking(this,r),this}setStyle(t,e=ke){function n(s){s!==void 0&&parseFloat(s)<1&&Tt("Color: Alpha component of "+t+" will be ignored.")}h(n,"handleAlpha");let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:Tt("Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(s,16),e);Tt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=ke){const n=au[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Tt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=gn(t.r),this.g=gn(t.g),this.b=gn(t.b),this}copyLinearToSRGB(t){return this.r=xi(t.r),this.g=xi(t.g),this.b=xi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ke){return Wt.workingToColorSpace(Re.copy(this),t),Math.round(Nt(Re.r*255,0,255))*65536+Math.round(Nt(Re.g*255,0,255))*256+Math.round(Nt(Re.b*255,0,255))}getHexString(t=ke){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Wt.workingColorSpace){Wt.workingToColorSpace(Re.copy(this),e);const n=Re.r,r=Re.g,s=Re.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let c,l;const d=(o+a)/2;if(o===a)c=0,l=0;else{const f=a-o;switch(l=d<=.5?f/(a+o):f/(2-a-o),a){case n:c=(r-s)/f+(r<s?6:0);break;case r:c=(s-n)/f+2;break;case s:c=(n-r)/f+4;break}c/=6}return t.h=c,t.s=l,t.l=d,t}getRGB(t,e=Wt.workingColorSpace){return Wt.workingToColorSpace(Re.copy(this),e),t.r=Re.r,t.g=Re.g,t.b=Re.b,t}getStyle(t=ke){Wt.workingToColorSpace(Re.copy(this),t);const e=Re.r,n=Re.g,r=Re.b;return t!==ke?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(t,e,n){return this.getHSL(Mn),this.setHSL(Mn.h+t,Mn.s+e,Mn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Mn),t.getHSL(ar);const n=Gi(Mn.h,ar.h,e),r=Gi(Mn.s,ar.s,e),s=Gi(Mn.l,ar.l,e);return this.setHSL(n,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,r=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*r,this.g=s[1]*e+s[4]*n+s[7]*r,this.b=s[2]*e+s[5]*n+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}};h(po,"Color");let Ft=po;const Re=new Ft;Ft.NAMES=au;const mo=class mo2 extends pe{constructor(){super(),this.isScene=true,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Cn,this.environmentIntensity=1,this.environmentRotation=new Cn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}};h(mo,"Scene");let Ac=mo;const Ye=new D,cn=new D,Bs=new D,hn=new D,$n=new D,Kn=new D,Rc=new D,Os=new D,zs=new D,Gs=new D,Vs=new ee,ks=new ee,Hs=new ee,An=class An2{constructor(t=new D,e=new D,n=new D){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,r){r.subVectors(n,e),Ye.subVectors(t,e),r.cross(Ye);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,e,n,r,s){Ye.subVectors(r,e),cn.subVectors(n,e),Bs.subVectors(t,e);const a=Ye.dot(Ye),o=Ye.dot(cn),c=Ye.dot(Bs),l=cn.dot(cn),d=cn.dot(Bs),f=a*l-o*o;if(f===0)return s.set(0,0,0),null;const u=1/f,m=(l*c-o*d)*u,_=(a*d-o*c)*u;return s.set(1-m-_,_,m)}static containsPoint(t,e,n,r){return this.getBarycoord(t,e,n,r,hn)===null?false:hn.x>=0&&hn.y>=0&&hn.x+hn.y<=1}static getInterpolation(t,e,n,r,s,a,o,c){return this.getBarycoord(t,e,n,r,hn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,hn.x),c.addScaledVector(a,hn.y),c.addScaledVector(o,hn.z),c)}static getInterpolatedAttribute(t,e,n,r,s,a){return Vs.setScalar(0),ks.setScalar(0),Hs.setScalar(0),Vs.fromBufferAttribute(t,e),ks.fromBufferAttribute(t,n),Hs.fromBufferAttribute(t,r),a.setScalar(0),a.addScaledVector(Vs,s.x),a.addScaledVector(ks,s.y),a.addScaledVector(Hs,s.z),a}static isFrontFacing(t,e,n,r){return Ye.subVectors(n,e),cn.subVectors(t,e),Ye.cross(cn).dot(r)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,r){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,n,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ye.subVectors(this.c,this.b),cn.subVectors(this.a,this.b),Ye.cross(cn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return An2.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return An2.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,r,s){return An2.getInterpolation(t,this.a,this.b,this.c,e,n,r,s)}containsPoint(t){return An2.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return An2.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,r=this.b,s=this.c;let a,o;$n.subVectors(r,n),Kn.subVectors(s,n),Os.subVectors(t,n);const c=$n.dot(Os),l=Kn.dot(Os);if(c<=0&&l<=0)return e.copy(n);zs.subVectors(t,r);const d=$n.dot(zs),f=Kn.dot(zs);if(d>=0&&f<=d)return e.copy(r);const u=c*f-d*l;if(u<=0&&c>=0&&d<=0)return a=c/(c-d),e.copy(n).addScaledVector($n,a);Gs.subVectors(t,s);const m=$n.dot(Gs),_=Kn.dot(Gs);if(_>=0&&m<=_)return e.copy(s);const y=m*l-c*_;if(y<=0&&l>=0&&_<=0)return o=l/(l-_),e.copy(n).addScaledVector(Kn,o);const g=d*_-m*f;if(g<=0&&f-d>=0&&m-_>=0)return Rc.subVectors(s,r),o=(f-d)/(f-d+(m-_)),e.copy(r).addScaledVector(Rc,o);const p=1/(g+y+u);return a=y*p,o=u*p,e.copy(n).addScaledVector($n,a).addScaledVector(Kn,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}};h(An,"Triangle");let pn=An;const go=class go2{constructor(t=new D(1/0,1/0,1/0),e=new D(-1/0,-1/0,-1/0)){this.isBox3=true,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Ze.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Ze.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Ze.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=false){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=false){t.updateWorldMatrix(false,false);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===true&&s!==void 0&&t.isInstancedMesh!==true)for(let a=0,o=s.count;a<o;a++)t.isMesh===true?t.getVertexPosition(a,Ze):Ze.fromBufferAttribute(s,a),Ze.applyMatrix4(t.matrixWorld),this.expandByPoint(Ze);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),or.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),or.copy(n.boundingBox)),or.applyMatrix4(t.matrixWorld),this.union(or)}const r=t.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ze),Ze.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return false;this.getCenter(Ai),lr.subVectors(this.max,Ai),Jn.subVectors(t.a,Ai),Qn.subVectors(t.b,Ai),jn.subVectors(t.c,Ai),yn.subVectors(Qn,Jn),En.subVectors(jn,Qn),Ln.subVectors(Jn,jn);let e=[0,-yn.z,yn.y,0,-En.z,En.y,0,-Ln.z,Ln.y,yn.z,0,-yn.x,En.z,0,-En.x,Ln.z,0,-Ln.x,-yn.y,yn.x,0,-En.y,En.x,0,-Ln.y,Ln.x,0];return!Ws(e,Jn,Qn,jn,lr)||(e=[1,0,0,0,1,0,0,0,1],!Ws(e,Jn,Qn,jn,lr))?false:(cr.crossVectors(yn,En),e=[cr.x,cr.y,cr.z],Ws(e,Jn,Qn,jn,lr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ze).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ze).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(un[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),un[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),un[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),un[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),un[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),un[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),un[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),un[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(un),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}};h(go,"Box3");let an=go;const un=[new D,new D,new D,new D,new D,new D,new D,new D],Ze=new D,or=new an,Jn=new D,Qn=new D,jn=new D,yn=new D,En=new D,Ln=new D,Ai=new D,lr=new D,cr=new D,Nn=new D;function Ws(i,t,e,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){Nn.fromArray(i,s);const o=r.x*Math.abs(Nn.x)+r.y*Math.abs(Nn.y)+r.z*Math.abs(Nn.z),c=t.dot(Nn),l=e.dot(Nn),d=n.dot(Nn);if(Math.max(-Math.max(c,l,d),Math.min(c,l,d))>o)return false}return true}h(Ws,"satForAxes");const _e=new D,hr=new It;let od=0;const _o=class _o2 extends sn{constructor(t,e,n=false){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=true,Object.defineProperty(this,"id",{value:od++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(t){t===true&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=e.array[n+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)hr.fromBufferAttribute(this,e),hr.applyMatrix3(t),this.setXY(e,hr.x,hr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)_e.fromBufferAttribute(this,e),_e.applyMatrix3(t),this.setXYZ(e,_e.x,_e.y,_e.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)_e.fromBufferAttribute(this,e),_e.applyMatrix4(t),this.setXYZ(e,_e.x,_e.y,_e.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)_e.fromBufferAttribute(this,e),_e.applyNormalMatrix(t),this.setXYZ(e,_e.x,_e.y,_e.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)_e.fromBufferAttribute(this,e),_e.transformDirection(t),this.setXYZ(e,_e.x,_e.y,_e.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=$e(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=jt(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=$e(e,this.array)),e}setX(t,e){return this.normalized&&(e=jt(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=$e(e,this.array)),e}setY(t,e){return this.normalized&&(e=jt(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=$e(e,this.array)),e}setZ(t,e){return this.normalized&&(e=jt(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=$e(e,this.array)),e}setW(t,e){return this.normalized&&(e=jt(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=jt(e,this.array),n=jt(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,r){return t*=this.itemSize,this.normalized&&(e=jt(e,this.array),n=jt(n,this.array),r=jt(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this}setXYZW(t,e,n,r,s){return t*=this.itemSize,this.normalized&&(e=jt(e,this.array),n=jt(n,this.array),r=jt(r,this.array),s=jt(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};h(_o,"BufferAttribute");let Oe=_o;const xo=class xo2 extends Oe{constructor(t,e,n){super(new Uint16Array(t),e,n)}};h(xo,"Uint16BufferAttribute");let Xr=xo;const vo=class vo2 extends Oe{constructor(t,e,n){super(new Uint32Array(t),e,n)}};h(vo,"Uint32BufferAttribute");let qr=vo;const So=class So2 extends Oe{constructor(t,e,n){super(new Float32Array(t),e,n)}};h(So,"Float32BufferAttribute");let ie=So;const ld=new an,Ri=new D,Xs=new D,Mo=class Mo2{constructor(t=new D,e=-1){this.isSphere=true,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):ld.setFromPoints(t).getCenter(n);let r=0;for(let s=0,a=t.length;s<a;s++)r=Math.max(r,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ri.subVectors(t,this.center);const e=Ri.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),r=(n-this.radius)*.5;this.center.addScaledVector(Ri,r/n),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===true?this.radius=Math.max(this.radius,t.radius):(Xs.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ri.copy(t.center).add(Xs)),this.expandByPoint(Ri.copy(t.center).sub(Xs))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}};h(Mo,"Sphere");let Je=Mo,cd=0;const Ve=new Gt,qs=new pe,ti=new D,Fe=new an,wi=new an,Ee=new D,ms=class ms2 extends sn{constructor(){super(),this.isBufferGeometry=true,Object.defineProperty(this,"id",{value:cd++}),this.uuid=Ke(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=false,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=false}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Pu(t)?qr:Xr)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=true);const n=this.attributes.normal;if(n!==void 0){const s=new Lt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=true}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=true),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=true,this}applyQuaternion(t){return Ve.makeRotationFromQuaternion(t),this.applyMatrix4(Ve),this}rotateX(t){return Ve.makeRotationX(t),this.applyMatrix4(Ve),this}rotateY(t){return Ve.makeRotationY(t),this.applyMatrix4(Ve),this}rotateZ(t){return Ve.makeRotationZ(t),this.applyMatrix4(Ve),this}translate(t,e,n){return Ve.makeTranslation(t,e,n),this.applyMatrix4(Ve),this}scale(t,e,n){return Ve.makeScale(t,e,n),this.applyMatrix4(Ve),this}lookAt(t){return qs.lookAt(t),qs.updateMatrix(),this.applyMatrix4(qs.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ti).negate(),this.translate(ti.x,ti.y,ti.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let r=0,s=t.length;r<s;r++){const a=t[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new ie(n,3))}else{const n=Math.min(t.length,e.count);for(let r=0;r<n;r++){const s=t[r];e.setXYZ(r,s.x,s.y,s.z||0)}t.length>e.count&&Tt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=true}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new an);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Pt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,r=e.length;n<r;n++){const s=e[n];Fe.setFromBufferAttribute(s),this.morphTargetsRelative?(Ee.addVectors(this.boundingBox.min,Fe.min),this.boundingBox.expandByPoint(Ee),Ee.addVectors(this.boundingBox.max,Fe.max),this.boundingBox.expandByPoint(Ee)):(this.boundingBox.expandByPoint(Fe.min),this.boundingBox.expandByPoint(Fe.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Pt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Je);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Pt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(t){const n=this.boundingSphere.center;if(Fe.setFromBufferAttribute(t),e)for(let s=0,a=e.length;s<a;s++){const o=e[s];wi.setFromBufferAttribute(o),this.morphTargetsRelative?(Ee.addVectors(Fe.min,wi.min),Fe.expandByPoint(Ee),Ee.addVectors(Fe.max,wi.max),Fe.expandByPoint(Ee)):(Fe.expandByPoint(wi.min),Fe.expandByPoint(wi.max))}Fe.getCenter(n);let r=0;for(let s=0,a=t.count;s<a;s++)Ee.fromBufferAttribute(t,s),r=Math.max(r,n.distanceToSquared(Ee));if(e)for(let s=0,a=e.length;s<a;s++){const o=e[s],c=this.morphTargetsRelative;for(let l=0,d=o.count;l<d;l++)Ee.fromBufferAttribute(o,l),c&&(ti.fromBufferAttribute(t,l),Ee.add(ti)),r=Math.max(r,n.distanceToSquared(Ee))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Pt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Pt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,r=e.normal,s=e.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Oe(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],c=[];for(let v=0;v<n.count;v++)o[v]=new D,c[v]=new D;const l=new D,d=new D,f=new D,u=new It,m=new It,_=new It,y=new D,g=new D;function p(v,A,P){l.fromBufferAttribute(n,v),d.fromBufferAttribute(n,A),f.fromBufferAttribute(n,P),u.fromBufferAttribute(s,v),m.fromBufferAttribute(s,A),_.fromBufferAttribute(s,P),d.sub(l),f.sub(l),m.sub(u),_.sub(u);const F=1/(m.x*_.y-_.x*m.y);isFinite(F)&&(y.copy(d).multiplyScalar(_.y).addScaledVector(f,-m.y).multiplyScalar(F),g.copy(f).multiplyScalar(m.x).addScaledVector(d,-_.x).multiplyScalar(F),o[v].add(y),o[A].add(y),o[P].add(y),c[v].add(g),c[A].add(g),c[P].add(g))}h(p,"handleTriangle");let E=this.groups;E.length===0&&(E=[{start:0,count:t.count}]);for(let v=0,A=E.length;v<A;++v){const P=E[v],F=P.start,B=P.count;for(let k=F,N=F+B;k<N;k+=3)p(t.getX(k+0),t.getX(k+1),t.getX(k+2))}const R=new D,S=new D,T=new D,b=new D;function C(v){T.fromBufferAttribute(r,v),b.copy(T);const A=o[v];R.copy(A),R.sub(T.multiplyScalar(T.dot(A))).normalize(),S.crossVectors(b,A);const F=S.dot(c[v])<0?-1:1;a.setXYZW(v,R.x,R.y,R.z,F)}h(C,"handleVertex");for(let v=0,A=E.length;v<A;++v){const P=E[v],F=P.start,B=P.count;for(let k=F,N=F+B;k<N;k+=3)C(t.getX(k+0)),C(t.getX(k+1)),C(t.getX(k+2))}this._transformed=true}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new Oe(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,m=n.count;u<m;u++)n.setXYZ(u,0,0,0);const r=new D,s=new D,a=new D,o=new D,c=new D,l=new D,d=new D,f=new D;if(t)for(let u=0,m=t.count;u<m;u+=3){const _=t.getX(u+0),y=t.getX(u+1),g=t.getX(u+2);r.fromBufferAttribute(e,_),s.fromBufferAttribute(e,y),a.fromBufferAttribute(e,g),d.subVectors(a,s),f.subVectors(r,s),d.cross(f),o.fromBufferAttribute(n,_),c.fromBufferAttribute(n,y),l.fromBufferAttribute(n,g),o.add(d),c.add(d),l.add(d),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(y,c.x,c.y,c.z),n.setXYZ(g,l.x,l.y,l.z)}else for(let u=0,m=e.count;u<m;u+=3)r.fromBufferAttribute(e,u+0),s.fromBufferAttribute(e,u+1),a.fromBufferAttribute(e,u+2),d.subVectors(a,s),f.subVectors(r,s),d.cross(f),n.setXYZ(u+0,d.x,d.y,d.z),n.setXYZ(u+1,d.x,d.y,d.z),n.setXYZ(u+2,d.x,d.y,d.z);this.normalizeNormals(),n.needsUpdate=true}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ee.fromBufferAttribute(t,e),Ee.normalize(),t.setXYZ(e,Ee.x,Ee.y,Ee.z)}toNonIndexed(){function t(o,c){const l=o.array,d=o.itemSize,f=o.normalized,u=new l.constructor(c.length*d);let m=0,_=0;for(let y=0,g=c.length;y<g;y++){o.isInterleavedBufferAttribute?m=c[y]*o.data.stride+o.offset:m=c[y]*d;for(let p=0;p<d;p++)u[_++]=l[m++]}return new Oe(u,d,f)}if(h(t,"convertBufferAttribute"),this.index===null)return Tt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ms2,n=this.index.array,r=this.attributes;for(const o in r){const c=r[o],l=t(c,n);e.setAttribute(o,l)}const s=this.morphAttributes;for(const o in s){const c=[],l=s[o];for(let d=0,f=l.length;d<f;d++){const u=l[d],m=t(u,n);c.push(m)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===true?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==true){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const r={};let s=false;for(const c in this.morphAttributes){const l=this.morphAttributes[c],d=[];for(let f=0,u=l.length;f<u;f++){const m=l[f];d.push(m.toJSON(t.data))}d.length>0&&(r[c]=d,s=true)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const r=t.attributes;for(const l in r){const d=r[l];this.setAttribute(l,d.clone(e))}const s=t.morphAttributes;for(const l in s){const d=[],f=s[l];for(let u=0,m=f.length;u<m;u++)d.push(f[u].clone(e));this.morphAttributes[l]=d}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let l=0,d=a.length;l<d;l++){const f=a[l];this.addGroup(f.start,f.count,f.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};h(ms,"BufferGeometry");let ve=ms;const yo=class yo2{constructor(t,e){this.isInterleavedBuffer=true,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=Ke()}onUploadCallback(){}set needsUpdate(t){t===true&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let r=0,s=this.stride;r<s;r++)this.array[t+r]=e.array[n+r];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ke()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ke()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));const e={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return e.usage=this.usage,e}};h(yo,"InterleavedBuffer");let Yr=yo;const Ce=new D,gs=class gs2{constructor(t,e,n,r=false){this.isInterleavedBufferAttribute=true,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.applyMatrix4(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.applyNormalMatrix(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.transformDirection(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=$e(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=jt(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=jt(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=jt(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=jt(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=jt(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=$e(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=$e(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=$e(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=$e(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=jt(e,this.array),n=jt(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=jt(e,this.array),n=jt(n,this.array),r=jt(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=r,this}setXYZW(t,e,n,r,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=jt(e,this.array),n=jt(n,this.array),r=jt(r,this.array),s=jt(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=r,this.data.array[t+3]=s,this}clone(t){if(t===void 0){Hr("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const r=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[r+s])}return new Oe(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new gs2(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){Hr("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const r=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:true,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}};h(gs,"InterleavedBufferAttribute");let Zr=gs;const Ys=new D,hd=new D,ud=new Lt,Eo=class Eo2{constructor(t=new D(1,0,0),e=0){this.isPlane=true,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,r){return this.normal.set(t,e,n),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const r=Ys.subVectors(n,e).cross(hd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=true){const r=t.delta(Ys),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/s;return n===true&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(r,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||ud.getNormalMatrix(t),r=this.coplanarPoint(Ys).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}};h(Eo,"Plane");let nn=Eo,dd=0;const bo=class bo2 extends sn{constructor(){super(),this.isMaterial=true,Object.defineProperty(this,"id",{value:dd++}),this.uuid=Ke(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=false,this.opacity=1,this.transparent=false,this.alphaHash=false,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ft(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=true,this.depthWrite=true,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=false,this.clippingPlanes=null,this.clipIntersection=false,this.clipShadows=false,this.shadowSide=null,this.colorWrite=true,this.precision=null,this.polygonOffset=false,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=false,this.alphaToCoverage=false,this.premultipliedAlpha=false,this.forceSinglePass=false,this.allowOverride=true,this.visible=true,this.toneMapped=true,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){Tt(`Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){Tt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const c=s[o];delete c.metadata,a.push(c)}return a}if(h(r,"extractFromCache"),e){const s=r(t.textures),a=r(t.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Ft().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new nn().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===false&&(n=[n,n]),this.normalScale=new It().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new It().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const r=e.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===true&&this.version++}};h(bo,"Material");let on=bo;const To=class To2 extends on{constructor(t){super(),this.isSpriteMaterial=true,this.type="SpriteMaterial",this.color=new Ft(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=true,this.transparent=true,this.fog=true,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}};h(To,"SpriteMaterial");let fa=To,ei;const Ci=new D,ni=new D,ii=new D,ri=new It,Pi=new It,ou=new Gt,ur=new D,Ii=new D,dr=new D,wc=new It,Zs=new It,Cc=new It,Ao=class Ao2 extends pe{constructor(t=new fa){if(super(),this.isSprite=true,this.type="Sprite",ei===void 0){ei=new ve;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Yr(e,5);ei.setIndex([0,1,2,0,2,3]),ei.setAttribute("position",new Zr(n,3,0,false)),ei.setAttribute("uv",new Zr(n,2,3,false))}this.geometry=ei,this.material=t,this.center=new It(.5,.5),this.count=1}intersectsFrustum(t){return t.intersectsSprite(this)}raycast(t,e){t.camera===null&&Pt('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ni.setFromMatrixScale(this.matrixWorld),ou.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),ii.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===false&&ni.multiplyScalar(-ii.z);const n=this.material.rotation;let r,s;n!==0&&(s=Math.cos(n),r=Math.sin(n));const a=this.center;fr(ur.set(-.5,-.5,0),ii,a,ni,r,s),fr(Ii.set(.5,-.5,0),ii,a,ni,r,s),fr(dr.set(.5,.5,0),ii,a,ni,r,s),wc.set(0,0),Zs.set(1,0),Cc.set(1,1);let o=t.ray.intersectTriangle(ur,Ii,dr,false,Ci);if(o===null&&(fr(Ii.set(-.5,.5,0),ii,a,ni,r,s),Zs.set(0,1),o=t.ray.intersectTriangle(ur,dr,Ii,false,Ci),o===null))return;const c=t.ray.origin.distanceTo(Ci);c<t.near||c>t.far||e.push({distance:c,point:Ci.clone(),uv:pn.getInterpolation(Ci,ur,Ii,dr,wc,Zs,Cc,new It),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}};h(Ao,"Sprite");let Pc=Ao;function fr(i,t,e,n,r,s){ri.subVectors(i,e).addScalar(.5).multiply(n),r!==void 0?(Pi.x=s*ri.x-r*ri.y,Pi.y=r*ri.x+s*ri.y):Pi.copy(ri),i.copy(t),i.x+=Pi.x,i.y+=Pi.y,i.applyMatrix4(ou)}h(fr,"transformVertex");const dn=new D,$s=new D,pr=new D,mr=new D,Ro=class Ro2{constructor(t=new D,e=new D(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,dn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=dn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(dn.copy(this.origin).addScaledVector(this.direction,e),dn.distanceToSquared(t))}distanceSqToSegment(t,e,n,r){$s.copy(t).add(e).multiplyScalar(.5),pr.copy(e).sub(t).normalize(),mr.copy(this.origin).sub($s);const s=t.distanceTo(e)*.5,a=-this.direction.dot(pr),o=mr.dot(this.direction),c=-mr.dot(pr),l=mr.lengthSq(),d=Math.abs(1-a*a);let f,u,m,_;if(d>0)if(f=a*c-o,u=a*o-c,_=s*d,f>=0)if(u>=-_)if(u<=_){const y=1/d;f*=y,u*=y,m=f*(f+a*u+2*o)+u*(a*f+u+2*c)+l}else u=s,f=Math.max(0,-(a*u+o)),m=-f*f+u*(u+2*c)+l;else u=-s,f=Math.max(0,-(a*u+o)),m=-f*f+u*(u+2*c)+l;else u<=-_?(f=Math.max(0,-(-a*s+o)),u=f>0?-s:Math.min(Math.max(-s,-c),s),m=-f*f+u*(u+2*c)+l):u<=_?(f=0,u=Math.min(Math.max(-s,-c),s),m=u*(u+2*c)+l):(f=Math.max(0,-(a*s+o)),u=f>0?s:Math.min(Math.max(-s,-c),s),m=-f*f+u*(u+2*c)+l);else u=a>0?-s:s,f=Math.max(0,-(a*u+o)),m=-f*f+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy($s).addScaledVector(pr,u),m}intersectSphere(t,e){if(t.radius<0)return null;dn.subVectors(t.center,this.origin);const n=dn.dot(this.direction),r=dn.dot(dn)-n*n,s=t.radius*t.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?false:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,r,s,a,o,c;const l=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,u=this.origin;return l>=0?(n=(t.min.x-u.x)*l,r=(t.max.x-u.x)*l):(n=(t.max.x-u.x)*l,r=(t.min.x-u.x)*l),d>=0?(s=(t.min.y-u.y)*d,a=(t.max.y-u.y)*d):(s=(t.max.y-u.y)*d,a=(t.min.y-u.y)*d),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(t.min.z-u.z)*f,c=(t.max.z-u.z)*f):(o=(t.max.z-u.z)*f,c=(t.min.z-u.z)*f),n>c||o>r)||((o>n||n!==n)&&(n=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(n>=0?n:r,e)}intersectsBox(t){return this.intersectBox(t,dn)!==null}intersectTriangle(t,e,n,r,s){const a=this.origin,o=this.direction,c=o.x,l=o.y,d=o.z,f=t.x-a.x,u=t.y-a.y,m=t.z-a.z,_=e.x-a.x,y=e.y-a.y,g=e.z-a.z,p=n.x-a.x,E=n.y-a.y,R=n.z-a.z,S=Math.abs(c),T=Math.abs(l),b=Math.abs(d);let C,v,A,P,F,B,k,N,H,$,K,it;if(S>=T&&S>=b?(A=c,B=f,H=_,it=p,c>=0?(C=l,v=d,P=u,F=m,k=y,N=g,$=E,K=R):(C=d,v=l,P=m,F=u,k=g,N=y,$=R,K=E)):T>=b?(A=l,B=u,H=y,it=E,l>=0?(C=d,v=c,P=m,F=f,k=g,N=_,$=R,K=p):(C=c,v=d,P=f,F=m,k=_,N=g,$=p,K=R)):(A=d,B=m,H=g,it=R,d>=0?(C=c,v=l,P=f,F=u,k=_,N=y,$=p,K=E):(C=l,v=c,P=u,F=f,k=y,N=_,$=E,K=p)),A===0)return null;const q=C/A,tt=v/A,nt=1/A,wt=P-q*B,At=F-tt*B,re=k-q*H,Xt=N-tt*H,Zt=$-q*it,Y=K-tt*it,j=Zt*Xt-Y*re,xt=wt*Y-At*Zt,Dt=re*At-Xt*wt;if(r){if(j<0||xt<0||Dt<0)return null}else if((j<0||xt<0||Dt<0)&&(j>0||xt>0||Dt>0))return null;const gt=j+xt+Dt;if(gt===0)return null;const zt=nt*(j*B+xt*H+Dt*it);return(gt>0?zt<0:zt>0)?null:this.at(zt/gt,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};h(Ro,"Ray");let On=Ro;const wo=class wo2 extends on{constructor(t){super(),this.isMeshBasicMaterial=true,this.type="MeshBasicMaterial",this.color=new Ft(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Cn,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=false,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=true,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};h(wo,"MeshBasicMaterial");let $r=wo;const Ic=new Gt,Un=new On,gr=new Je,Dc=new D,_r=new D,xr=new D,vr=new D,Ks=new D,Sr=new D,Lc=new D,Mr=new D,Co=class Co2 extends pe{constructor(t=new ve,e=new $r){super(),this.isMesh=true,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(r,t);const o=this.morphTargetInfluences;if(s&&o){Sr.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const d=o[c],f=s[c];d!==0&&(Ks.fromBufferAttribute(f,t),a?Sr.addScaledVector(Ks,d):Sr.addScaledVector(Ks.sub(e),d))}e.add(Sr)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),gr.copy(n.boundingSphere),gr.applyMatrix4(s),Un.copy(t.ray).recast(t.near),!(gr.containsPoint(Un.origin)===false&&(Un.intersectSphere(gr,Dc)===null||Un.origin.distanceToSquared(Dc)>(t.far-t.near)**2))&&(Ic.copy(s).invert(),Un.copy(t.ray).applyMatrix4(Ic),!(n.boundingBox!==null&&Un.intersectsBox(n.boundingBox)===false)&&this._computeIntersections(t,e,Un)))}_computeIntersections(t,e,n){let r;const s=this.geometry,a=this.material,o=s.index,c=s.attributes.position,l=s.attributes.uv,d=s.attributes.uv1,f=s.attributes.normal,u=s.groups,m=s.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,y=u.length;_<y;_++){const g=u[_],p=a[g.materialIndex],E=Math.max(g.start,m.start),R=Math.min(o.count,Math.min(g.start+g.count,m.start+m.count));for(let S=E,T=R;S<T;S+=3){const b=o.getX(S),C=o.getX(S+1),v=o.getX(S+2);r=yr(this,p,t,n,l,d,f,b,C,v),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=g.materialIndex,e.push(r))}}else{const _=Math.max(0,m.start),y=Math.min(o.count,m.start+m.count);for(let g=_,p=y;g<p;g+=3){const E=o.getX(g),R=o.getX(g+1),S=o.getX(g+2);r=yr(this,a,t,n,l,d,f,E,R,S),r&&(r.faceIndex=Math.floor(g/3),e.push(r))}}else if(c!==void 0)if(Array.isArray(a))for(let _=0,y=u.length;_<y;_++){const g=u[_],p=a[g.materialIndex],E=Math.max(g.start,m.start),R=Math.min(c.count,Math.min(g.start+g.count,m.start+m.count));for(let S=E,T=R;S<T;S+=3){const b=S,C=S+1,v=S+2;r=yr(this,p,t,n,l,d,f,b,C,v),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=g.materialIndex,e.push(r))}}else{const _=Math.max(0,m.start),y=Math.min(c.count,m.start+m.count);for(let g=_,p=y;g<p;g+=3){const E=g,R=g+1,S=g+2;r=yr(this,a,t,n,l,d,f,E,R,S),r&&(r.faceIndex=Math.floor(g/3),e.push(r))}}}};h(Co,"Mesh");let Ne=Co;function fd(i,t,e,n,r,s,a,o){let c;if(t.side===1?c=n.intersectTriangle(a,s,r,true,o):c=n.intersectTriangle(r,s,a,t.side===0,o),c===null)return null;Mr.copy(o),Mr.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(Mr);return l<e.near||l>e.far?null:{distance:l,point:Mr.clone(),object:i}}h(fd,"checkIntersection$1");function yr(i,t,e,n,r,s,a,o,c,l){i.getVertexPosition(o,_r),i.getVertexPosition(c,xr),i.getVertexPosition(l,vr);const d=fd(i,t,e,n,_r,xr,vr,Lc);if(d){const f=new D;pn.getBarycoord(Lc,_r,xr,vr,f),r&&(d.uv=pn.getInterpolatedAttribute(r,o,c,l,f,new It)),s&&(d.uv1=pn.getInterpolatedAttribute(s,o,c,l,f,new It)),a&&(d.normal=pn.getInterpolatedAttribute(a,o,c,l,f,new D),d.normal.dot(n.direction)>0&&d.normal.multiplyScalar(-1));const u={a:o,b:c,c:l,normal:new D,materialIndex:0};pn.getNormal(_r,xr,vr,u.normal),d.face=u,d.barycoord=f}return d}h(yr,"checkGeometryIntersection");const Di=new ee,Nc=new ee,Uc=new ee,pd=new ee,Fc=new Gt,Er=new D,Js=new Je,Bc=new Gt,Qs=new On,Po=class Po2 extends Ne{constructor(t,e){super(t,e),this.isSkinnedMesh=true,this.type="SkinnedMesh",this.bindMode=dc,this.bindMatrix=new Gt,this.bindMatrixInverse=new Gt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new an),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Er),this.boundingBox.expandByPoint(Er)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Je),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Er),this.boundingSphere.expandByPoint(Er)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,r=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Js.copy(this.boundingSphere),Js.applyMatrix4(r),t.ray.intersectsSphere(Js)!==false&&(Bc.copy(r).invert(),Qs.copy(t.ray).applyMatrix4(Bc),!(this.boundingBox!==null&&Qs.intersectsBox(this.boundingBox)===false)&&this._computeIntersections(t,e,Qs)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(true),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new ee,e=this.geometry.attributes.skinWeight;for(let n=0,r=e.count;n<r;n++){t.fromBufferAttribute(e,n);const s=1/t.manhattanLength();s!==1/0?t.multiplyScalar(s):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===dc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Cu?this.bindMatrixInverse.copy(this.bindMatrix).invert():Tt("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,r=this.geometry;Nc.fromBufferAttribute(r.attributes.skinIndex,t),Uc.fromBufferAttribute(r.attributes.skinWeight,t),e.isVector4?(Di.copy(e),e.set(0,0,0,0)):(Di.set(...e,1),e.set(0,0,0)),Di.applyMatrix4(this.bindMatrix);for(let s=0;s<4;s++){const a=Uc.getComponent(s);if(a!==0){const o=Nc.getComponent(s);Fc.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),e.addScaledVector(pd.copy(Di).applyMatrix4(Fc),a)}}return e.isVector4&&(e.w=Di.w),e.applyMatrix4(this.bindMatrixInverse)}};h(Po,"SkinnedMesh");let Oc=Po;const Io=class Io2 extends pe{constructor(){super(),this.isBone=true,this.type="Bone"}};h(Io,"Bone");let pa=Io;const Do=class Do2 extends Le{constructor(t=null,e=1,n=1,r,s,a,o,c,l=1003,d=1003,f,u){super(null,a,o,c,l,d,r,s,f,u),this.isDataTexture=true,this.image={data:t,width:e,height:n},this.generateMipmaps=false,this.flipY=false,this.unpackAlignment=1}};h(Do,"DataTexture");let qi=Do;const zc=new Gt,md=new Gt,_s=class _s2{constructor(t=[],e=[]){this.uuid=Ke(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){Tt("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,r=this.bones.length;n<r;n++)this.boneInverses.push(new Gt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new Gt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,r=this.boneTexture;for(let s=0,a=t.length;s<a;s++){const o=t[s]?t[s].matrixWorld:md;zc.multiplyMatrices(o,e[s]),zc.toArray(n,s*16)}r!==null&&(r.needsUpdate=true)}clone(){return new _s2(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new qi(e,t,t,1023,1015);return n.needsUpdate=true,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const r=this.bones[e];if(r.name===t)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,r=t.bones.length;n<r;n++){const s=t.bones[n];let a=e[s];a===void 0&&(Tt("Skeleton: No bone found with UUID:",s),a=new pa),this.bones.push(a),this.boneInverses.push(new Gt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let r=0,s=e.length;r<s;r++){const a=e[r];t.bones.push(a.uuid);const o=n[r];t.boneInverses.push(o.toArray())}return t}};h(_s,"Skeleton");let Gc=_s;const Lo=class Lo2 extends Oe{constructor(t,e,n,r=1){super(t,e,n),this.isInstancedBufferAttribute=true,this.meshPerAttribute=r}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=true,t}};h(Lo,"InstancedBufferAttribute");let Kr=Lo;const si=new Gt,Vc=new Gt,br=[],kc=new an,gd=new Gt,Li=new Ne,Ni=new Je,No=class No2 extends Ne{constructor(t,e,n){super(t,e),this.isInstancedMesh=true,this.instanceMatrix=new Kr(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<n;r++)this.setMatrixAt(r,gd)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new an),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,si),kc.copy(t.boundingBox).applyMatrix4(si),this.boundingBox.union(kc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Je),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,si),Ni.copy(t.boundingSphere).applyMatrix4(si),this.boundingSphere.union(Ni)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,r=this.morphTexture.source.data.data,s=n.length+1,a=t*s+1;for(let o=0;o<n.length;o++)n[o]=r[a+o]}raycast(t,e){const n=this.matrixWorld,r=this.count;if(Li.geometry=this.geometry,Li.material=this.material,Li.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ni.copy(this.boundingSphere),Ni.applyMatrix4(n),t.ray.intersectsSphere(Ni)!==false))for(let s=0;s<r;s++){this.getMatrixAt(s,si),Vc.multiplyMatrices(n,si),Li.matrixWorld=Vc,Li.raycast(t,br);for(let a=0,o=br.length;a<o;a++){const c=br[a];c.instanceId=s,c.object=this,e.push(c)}br.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Kr(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){const n=e.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new qi(new Float32Array(r*this.count),r,this.count,1028,1015));const s=this.morphTexture.source.data.data;let a=0;for(let l=0;l<n.length;l++)a+=n[l];const o=this.geometry.morphTargetsRelative?1:1-a,c=r*t;return s[c]=o,s.set(n,c+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}};h(No,"InstancedMesh");let Hc=No;const Fn=new Je,_d=new It(.5,.5),Tr=new D,Uo=class Uo2{constructor(t=new nn,e=new nn,n=new nn,r=new nn,s=new nn,a=new nn){this.planes=[t,e,n,r,s,a]}set(t,e,n,r,s,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=2e3,n=false){const r=this.planes,s=t.elements,a=s[0],o=s[1],c=s[2],l=s[3],d=s[4],f=s[5],u=s[6],m=s[7],_=s[8],y=s[9],g=s[10],p=s[11],E=s[12],R=s[13],S=s[14],T=s[15];if(r[0].setComponents(l-a,m-d,p-_,T-E).normalize(),r[1].setComponents(l+a,m+d,p+_,T+E).normalize(),r[2].setComponents(l+o,m+f,p+y,T+R).normalize(),r[3].setComponents(l-o,m-f,p-y,T-R).normalize(),n)r[4].setComponents(c,u,g,S).normalize(),r[5].setComponents(l-c,m-u,p-g,T-S).normalize();else if(r[4].setComponents(l-c,m-u,p-g,T-S).normalize(),e===2e3)r[5].setComponents(l+c,m+u,p+g,T+S).normalize();else if(e===2001)r[5].setComponents(c,u,g,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Fn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Fn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Fn)}intersectsSprite(t){Fn.center.set(0,0,0);const e=_d.distanceTo(t.center);return Fn.radius=.7071067811865476+e,Fn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Fn)}intersectsSphere(t){const e=this.planes,n=t.center,r=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<r)return false;return true}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const r=e[n];if(Tr.x=r.normal.x>0?t.max.x:t.min.x,Tr.y=r.normal.y>0?t.max.y:t.min.y,Tr.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(Tr)<0)return false}return true}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return false;return true}clone(){return new this.constructor().copy(this)}};h(Uo,"Frustum");let Yi=Uo;const Fo=class Fo2 extends on{constructor(t){super(),this.isLineBasicMaterial=true,this.type="LineBasicMaterial",this.color=new Ft(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=true,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}};h(Fo,"LineBasicMaterial");let ma=Fo;const Jr=new D,Qr=new D,Wc=new Gt,Ui=new On,Ar=new Je,js=new D,Xc=new D,Bo=class Bo2 extends pe{constructor(t=new ve,e=new ma){super(),this.isLine=true,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let r=1,s=e.count;r<s;r++)Jr.fromBufferAttribute(e,r-1),Qr.fromBufferAttribute(e,r),n[r]=n[r-1],n[r]+=Jr.distanceTo(Qr);t.setAttribute("lineDistance",new ie(n,1))}else Tt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,r=this.matrixWorld,s=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ar.copy(n.boundingSphere),Ar.applyMatrix4(r),Ar.radius+=s,t.ray.intersectsSphere(Ar)===false)return;Wc.copy(r).invert(),Ui.copy(t.ray).applyMatrix4(Wc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,d=n.index,u=n.attributes.position;if(d!==null){const m=Math.max(0,a.start),_=Math.min(d.count,a.start+a.count);for(let y=m,g=_-1;y<g;y+=l){const p=d.getX(y),E=d.getX(y+1),R=Rr(this,t,Ui,c,p,E,y);R&&e.push(R)}if(this.isLineLoop){const y=d.getX(_-1),g=d.getX(m),p=Rr(this,t,Ui,c,y,g,_-1);p&&e.push(p)}}else{const m=Math.max(0,a.start),_=Math.min(u.count,a.start+a.count);for(let y=m,g=_-1;y<g;y+=l){const p=Rr(this,t,Ui,c,y,y+1,y);p&&e.push(p)}if(this.isLineLoop){const y=Rr(this,t,Ui,c,_-1,m,_-1);y&&e.push(y)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}};h(Bo,"Line");let jr=Bo;function Rr(i,t,e,n,r,s,a){const o=i.geometry.attributes.position;if(Jr.fromBufferAttribute(o,r),Qr.fromBufferAttribute(o,s),e.distanceSqToSegment(Jr,Qr,js,Xc)>n)return;js.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(js);if(!(l<t.near||l>t.far))return{distance:l,point:Xc.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}h(Rr,"checkIntersection");const qc=new D,Yc=new D,Oo=class Oo2 extends jr{constructor(t,e){super(t,e),this.isLineSegments=true,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let r=0,s=e.count;r<s;r+=2)qc.fromBufferAttribute(e,r),Yc.fromBufferAttribute(e,r+1),n[r]=r===0?0:n[r-1],n[r+1]=n[r]+qc.distanceTo(Yc);t.setAttribute("lineDistance",new ie(n,1))}else Tt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};h(Oo,"LineSegments");let Zc=Oo;const zo=class zo2 extends jr{constructor(t,e){super(t,e),this.isLineLoop=true,this.type="LineLoop"}};h(zo,"LineLoop");let $c=zo;const Go=class Go2 extends on{constructor(t){super(),this.isPointsMaterial=true,this.type="PointsMaterial",this.color=new Ft(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=true,this.fog=true,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}};h(Go,"PointsMaterial");let ga=Go;const Kc=new Gt,_a=new On,wr=new Je,Cr=new D,Vo=class Vo2 extends pe{constructor(t=new ve,e=new ga){super(),this.isPoints=true,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,r=this.matrixWorld,s=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),wr.copy(n.boundingSphere),wr.applyMatrix4(r),wr.radius+=s,t.ray.intersectsSphere(wr)===false)return;Kc.copy(r).invert(),_a.copy(t.ray).applyMatrix4(Kc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,f=n.attributes.position;if(l!==null){const u=Math.max(0,a.start),m=Math.min(l.count,a.start+a.count);for(let _=u,y=m;_<y;_++){const g=l.getX(_);Cr.fromBufferAttribute(f,g),Qc(Cr,g,c,r,t,e,this)}}else{const u=Math.max(0,a.start),m=Math.min(f.count,a.start+a.count);for(let _=u,y=m;_<y;_++)Cr.fromBufferAttribute(f,_),Qc(Cr,_,c,r,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}};h(Vo,"Points");let Jc=Vo;function Qc(i,t,e,n,r,s,a){const o=_a.distanceSqToPoint(i);if(o<e){const c=new D;_a.closestPointToPoint(i,c),c.applyMatrix4(n);const l=r.ray.origin.distanceTo(c);if(l<r.near||l>r.far)return;s.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}h(Qc,"testPoint");const ko=class ko2 extends Le{constructor(t=[],e=301,n,r,s,a,o,c,l,d){super(t,e,n,r,s,a,o,c,l,d),this.isCubeTexture=true,this.flipY=false}get images(){return this.image}set images(t){this.image=t}};h(ko,"CubeTexture");let ts=ko;const Ho=class Ho2 extends Le{constructor(t,e,n=1014,r,s,a,o=1003,c=1003,l,d=1026,f=1){if(d!==1026&&d!==1027)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:t,height:e,depth:f};super(u,r,s,a,o,c,d,n,l),this.isDepthTexture=true,this.flipY=false,this.generateMipmaps=false,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Wi(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}};h(Ho,"DepthTexture");let zn=Ho;const Wo=class Wo2 extends zn{constructor(t,e=1014,n=301,r,s,a=1003,o=1003,c,l=1026){const d={width:t,height:t,depth:1},f=[d,d,d,d,d,d];super(t,t,e,n,r,s,a,o,c,l),this.image=f,this.isCubeDepthTexture=true,this.isCubeTexture=true}get images(){return this.image}set images(t){this.image=t}};h(Wo,"CubeDepthTexture");let xa=Wo;const Xo=class Xo2 extends Le{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=true}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}};h(Xo,"ExternalTexture");let es=Xo;const xs=class xs2 extends ve{constructor(t=1,e=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const c=[],l=[],d=[],f=[];let u=0,m=0;_("z","y","x",-1,-1,n,e,t,a,s,0),_("z","y","x",1,-1,n,e,-t,a,s,1),_("x","z","y",1,1,t,n,e,r,a,2),_("x","z","y",1,-1,t,n,-e,r,a,3),_("x","y","z",1,-1,t,e,n,r,s,4),_("x","y","z",-1,-1,t,e,-n,r,s,5),this.setIndex(c),this.setAttribute("position",new ie(l,3)),this.setAttribute("normal",new ie(d,3)),this.setAttribute("uv",new ie(f,2));function _(y,g,p,E,R,S,T,b,C,v,A){const P=S/C,F=T/v,B=S/2,k=T/2,N=b/2,H=C+1,$=v+1;let K=0,it=0;const q=new D;for(let tt=0;tt<$;tt++){const nt=tt*F-k;for(let wt=0;wt<H;wt++){const At=wt*P-B;q[y]=At*E,q[g]=nt*R,q[p]=N,l.push(q.x,q.y,q.z),q[y]=0,q[g]=0,q[p]=b>0?1:-1,d.push(q.x,q.y,q.z),f.push(wt/C),f.push(1-tt/v),K+=1}}for(let tt=0;tt<v;tt++)for(let nt=0;nt<C;nt++){const wt=u+nt+H*tt,At=u+nt+H*(tt+1),re=u+(nt+1)+H*(tt+1),Xt=u+(nt+1)+H*tt;c.push(wt,At,Xt),c.push(At,re,Xt),it+=6}o.addGroup(m,it,A),m+=it,u+=K}h(_,"buildPlane")}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new xs2(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};h(xs,"BoxGeometry");let Zi=xs;const vs=class vs2 extends ve{constructor(t=1,e=32,n=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:r},e=Math.max(3,e);const s=[],a=[],o=[],c=[],l=new D,d=new It;a.push(0,0,0),o.push(0,0,1),c.push(.5,.5);for(let f=0,u=3;f<=e;f++,u+=3){const m=n+f/e*r;l.x=t*Math.cos(m),l.y=t*Math.sin(m),a.push(l.x,l.y,l.z),o.push(0,0,1),d.x=(a[u]/t+1)/2,d.y=(a[u+1]/t+1)/2,c.push(d.x,d.y)}for(let f=1;f<=e;f++)s.push(f,f+1,0);this.setIndex(s),this.setAttribute("position",new ie(a,3)),this.setAttribute("normal",new ie(o,3)),this.setAttribute("uv",new ie(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new vs2(t.radius,t.segments,t.thetaStart,t.thetaLength)}};h(vs,"CircleGeometry");let jc=vs;const Ss=class Ss2 extends ve{constructor(t=1,e=1,n=1,r=32,s=1,a=false,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:c};const l=this;r=Math.floor(r),s=Math.floor(s);const d=[],f=[],u=[],m=[];let _=0;const y=[],g=n/2;let p=0;E(),a===false&&(t>0&&R(true),e>0&&R(false)),this.setIndex(d),this.setAttribute("position",new ie(f,3)),this.setAttribute("normal",new ie(u,3)),this.setAttribute("uv",new ie(m,2));function E(){const S=new D,T=new D;let b=0;const C=(e-t)/n;for(let v=0;v<=s;v++){const A=[],P=v/s,F=P*(e-t)+t;for(let B=0;B<=r;B++){const k=B/r,N=k*c+o,H=Math.sin(N),$=Math.cos(N);T.x=F*H,T.y=-P*n+g,T.z=F*$,f.push(T.x,T.y,T.z),S.set(H,C,$).normalize(),u.push(S.x,S.y,S.z),m.push(k,1-P),A.push(_++)}y.push(A)}for(let v=0;v<r;v++)for(let A=0;A<s;A++){const P=y[A][v],F=y[A+1][v],B=y[A+1][v+1],k=y[A][v+1];(t>0||A!==0)&&(d.push(P,F,k),b+=3),(e>0||A!==s-1)&&(d.push(F,B,k),b+=3)}l.addGroup(p,b,0),p+=b}h(E,"generateTorso");function R(S){const T=_,b=new It,C=new D;let v=0;const A=S===true?t:e,P=S===true?1:-1;for(let B=1;B<=r;B++)f.push(0,g*P,0),u.push(0,P,0),m.push(.5,.5),_++;const F=_;for(let B=0;B<=r;B++){const N=B/r*c+o,H=Math.cos(N),$=Math.sin(N);C.x=A*$,C.y=g*P,C.z=A*H,f.push(C.x,C.y,C.z),u.push(0,P,0),b.x=H*.5+.5,b.y=$*.5*P+.5,m.push(b.x,b.y),_++}for(let B=0;B<r;B++){const k=T+B,N=F+B;S===true?d.push(N,N+1,k):d.push(N+1,N,k),v+=3}l.addGroup(p,v,S===true?1:2),p+=v}h(R,"generateCap")}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ss2(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};h(Ss,"CylinderGeometry");let th=Ss;const Ms=class Ms2 extends ve{constructor(t=[],e=[],n=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:r};const s=[],a=[];o(r),l(n),d(),this.setAttribute("position",new ie(s,3)),this.setAttribute("normal",new ie(s.slice(),3)),this.setAttribute("uv",new ie(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(E){const R=new D,S=new D,T=new D;for(let b=0;b<e.length;b+=3)m(e[b+0],R),m(e[b+1],S),m(e[b+2],T),c(R,S,T,E)}h(o,"subdivide");function c(E,R,S,T){const b=T+1,C=[];for(let v=0;v<=b;v++){C[v]=[];const A=E.clone().lerp(S,v/b),P=R.clone().lerp(S,v/b),F=b-v;for(let B=0;B<=F;B++)B===0&&v===b?C[v][B]=A:C[v][B]=A.clone().lerp(P,B/F)}for(let v=0;v<b;v++)for(let A=0;A<2*(b-v)-1;A++){const P=Math.floor(A/2);A%2===0?(u(C[v][P+1]),u(C[v+1][P]),u(C[v][P])):(u(C[v][P+1]),u(C[v+1][P+1]),u(C[v+1][P]))}}h(c,"subdivideFace");function l(E){const R=new D;for(let S=0;S<s.length;S+=3)R.x=s[S+0],R.y=s[S+1],R.z=s[S+2],R.normalize().multiplyScalar(E),s[S+0]=R.x,s[S+1]=R.y,s[S+2]=R.z}h(l,"applyRadius");function d(){const E=new D;for(let R=0;R<s.length;R+=3){E.x=s[R+0],E.y=s[R+1],E.z=s[R+2];const S=g(E)/2/Math.PI+.5,T=p(E)/Math.PI+.5;a.push(S,1-T)}_(),f()}h(d,"generateUVs");function f(){for(let E=0;E<a.length;E+=6){const R=a[E+0],S=a[E+2],T=a[E+4],b=Math.max(R,S,T),C=Math.min(R,S,T);b>.9&&C<.1&&(R<.2&&(a[E+0]+=1),S<.2&&(a[E+2]+=1),T<.2&&(a[E+4]+=1))}}h(f,"correctSeam");function u(E){s.push(E.x,E.y,E.z)}h(u,"pushVertex");function m(E,R){const S=E*3;R.x=t[S+0],R.y=t[S+1],R.z=t[S+2]}h(m,"getVertexByIndex");function _(){const E=new D,R=new D,S=new D,T=new D,b=new It,C=new It,v=new It;for(let A=0,P=0;A<s.length;A+=9,P+=6){E.set(s[A+0],s[A+1],s[A+2]),R.set(s[A+3],s[A+4],s[A+5]),S.set(s[A+6],s[A+7],s[A+8]),b.set(a[P+0],a[P+1]),C.set(a[P+2],a[P+3]),v.set(a[P+4],a[P+5]),T.copy(E).add(R).add(S).divideScalar(3);const F=g(T);y(b,P+0,E,F),y(C,P+2,R,F),y(v,P+4,S,F)}}h(_,"correctUVs");function y(E,R,S,T){T<0&&E.x===1&&(a[R]=E.x-1),S.x===0&&S.z===0&&(a[R]=T/2/Math.PI+.5)}h(y,"correctUV");function g(E){return Math.atan2(E.z,-E.x)}h(g,"azimuth");function p(E){return Math.atan2(-E.y,Math.sqrt(E.x*E.x+E.z*E.z))}h(p,"inclination")}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ms2(t.vertices,t.indices,t.radius,t.detail)}};h(Ms,"PolyhedronGeometry");let va=Ms;const Pr=new D,Ir=new D,ta=new D,Dr=new pn,qo=class qo2 extends ve{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){const r=Math.pow(10,4),s=Math.cos(_i*e),a=t.getIndex(),o=t.getAttribute("position"),c=a?a.count:o.count,l=[0,0,0],d=["a","b","c"],f=new Array(3),u={},m=[];for(let _=0;_<c;_+=3){a?(l[0]=a.getX(_),l[1]=a.getX(_+1),l[2]=a.getX(_+2)):(l[0]=_,l[1]=_+1,l[2]=_+2);const{a:y,b:g,c:p}=Dr;if(y.fromBufferAttribute(o,l[0]),g.fromBufferAttribute(o,l[1]),p.fromBufferAttribute(o,l[2]),Dr.getNormal(ta),f[0]=`${Math.round(y.x*r)},${Math.round(y.y*r)},${Math.round(y.z*r)}`,f[1]=`${Math.round(g.x*r)},${Math.round(g.y*r)},${Math.round(g.z*r)}`,f[2]=`${Math.round(p.x*r)},${Math.round(p.y*r)},${Math.round(p.z*r)}`,!(f[0]===f[1]||f[1]===f[2]||f[2]===f[0]))for(let E=0;E<3;E++){const R=(E+1)%3,S=f[E],T=f[R],b=Dr[d[E]],C=Dr[d[R]],v=`${S}_${T}`,A=`${T}_${S}`;A in u&&u[A]?(ta.dot(u[A].normal)<=s&&(m.push(b.x,b.y,b.z),m.push(C.x,C.y,C.z)),u[A]=null):v in u||(u[v]={index0:l[E],index1:l[R],normal:ta.clone()})}}for(const _ in u)if(u[_]){const{index0:y,index1:g}=u[_];Pr.fromBufferAttribute(o,y),Ir.fromBufferAttribute(o,g),m.push(Pr.x,Pr.y,Pr.z),m.push(Ir.x,Ir.y,Ir.z)}this.setAttribute("position",new ie(m,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}};h(qo,"EdgesGeometry");let eh=qo;function xd(i,t,e=2){const n=t&&t.length,r=n?t[0]*e:i.length;let s=lu(i,0,r,e,true);const a=[];if(!s||s.next===s.prev)return a;let o,c,l;if(n&&(s=Ed(i,t,s,e)),i.length>80*e){o=i[0],c=i[1];let d=o,f=c;for(let u=e;u<r;u+=e){const m=i[u],_=i[u+1];m<o&&(o=m),_<c&&(c=_),m>d&&(d=m),_>f&&(f=_)}l=Math.max(d-o,f-c),l=l!==0?32767/l:0}return $i(s,a,e,o,c,l,0),a}h(xd,"earcut");function lu(i,t,e,n,r){let s;if(r===Nd(i,t,e,n)>0)for(let a=t;a<e;a+=n)s=nh(a/n|0,i[a],i[a+1],s);else for(let a=e-n;a>=t;a-=n)s=nh(a/n|0,i[a],i[a+1],s);return s&&Mi(s,s.next)&&(Ji(s),s=s.next),s}h(lu,"linkedList");function Gn(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=false,!e.steiner&&(Mi(e,e.next)||de(e.prev,e,e.next)===0)){if(Ji(e),e=t=e.prev,e===e.next)break;n=true}else e=e.next;while(n||e!==t);return t}h(Gn,"filterPoints");function $i(i,t,e,n,r,s,a){if(!i)return;!a&&s&&wd(i,n,r,s);let o=i;for(;i.prev!==i.next;){const c=i.prev,l=i.next;if(s?Sd(i,n,r,s):vd(i)){t.push(c.i,i.i,l.i),Ji(i),i=l.next,o=l.next;continue}if(i=l,i===o){a?a===1?(i=Md(Gn(i),t),$i(i,t,e,n,r,s,2)):a===2&&yd(i,t,e,n,r,s):$i(Gn(i),t,e,n,r,s,1);break}}}h($i,"earcutLinked");function vd(i){const t=i.prev,e=i,n=i.next;if(de(t,e,n)>=0)return false;const r=t.x,s=e.x,a=n.x,o=t.y,c=e.y,l=n.y,d=Math.min(r,s,a),f=Math.min(o,c,l),u=Math.max(r,s,a),m=Math.max(o,c,l);let _=n.next;for(;_!==t;){if(_.x>=d&&_.x<=u&&_.y>=f&&_.y<=m&&Oi(r,o,s,c,a,l,_.x,_.y)&&de(_.prev,_,_.next)>=0)return false;_=_.next}return true}h(vd,"isEar");function Sd(i,t,e,n){const r=i.prev,s=i,a=i.next;if(de(r,s,a)>=0)return false;const o=r.x,c=s.x,l=a.x,d=r.y,f=s.y,u=a.y,m=Math.min(o,c,l),_=Math.min(d,f,u),y=Math.max(o,c,l),g=Math.max(d,f,u),p=Sa(m,_,t,e,n),E=Sa(y,g,t,e,n);let R=i.prevZ,S=i.nextZ;for(;R&&R.z>=p&&S&&S.z<=E;){if(R.x>=m&&R.x<=y&&R.y>=_&&R.y<=g&&R!==r&&R!==a&&Oi(o,d,c,f,l,u,R.x,R.y)&&de(R.prev,R,R.next)>=0||(R=R.prevZ,S.x>=m&&S.x<=y&&S.y>=_&&S.y<=g&&S!==r&&S!==a&&Oi(o,d,c,f,l,u,S.x,S.y)&&de(S.prev,S,S.next)>=0))return false;S=S.nextZ}for(;R&&R.z>=p;){if(R.x>=m&&R.x<=y&&R.y>=_&&R.y<=g&&R!==r&&R!==a&&Oi(o,d,c,f,l,u,R.x,R.y)&&de(R.prev,R,R.next)>=0)return false;R=R.prevZ}for(;S&&S.z<=E;){if(S.x>=m&&S.x<=y&&S.y>=_&&S.y<=g&&S!==r&&S!==a&&Oi(o,d,c,f,l,u,S.x,S.y)&&de(S.prev,S,S.next)>=0)return false;S=S.nextZ}return true}h(Sd,"isEarHashed");function Md(i,t){let e=i;do{const n=e.prev,r=e.next.next;!Mi(n,r)&&hu(n,e,e.next,r)&&Ki(n,r)&&Ki(r,n)&&(t.push(n.i,e.i,r.i),Ji(e),Ji(e.next),e=i=r),e=e.next}while(e!==i);return Gn(e)}h(Md,"cureLocalIntersections");function yd(i,t,e,n,r,s){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Id(a,o)){let c=uu(a,o);a=Gn(a,a.next),c=Gn(c,c.next),$i(a,t,e,n,r,s,0),$i(c,t,e,n,r,s,0);return}o=o.next}a=a.next}while(a!==i)}h(yd,"splitEarcut");function Ed(i,t,e,n){const r=[];for(let s=0,a=t.length;s<a;s++){const o=t[s]*n,c=s<a-1?t[s+1]*n:i.length,l=lu(i,o,c,n,false);l===l.next&&(l.steiner=true),r.push(Pd(l))}r.sort(bd);for(let s=0;s<r.length;s++)e=Td(r[s],e);return e}h(Ed,"eliminateHoles");function bd(i,t){let e=i.x-t.x;if(e===0&&(e=i.y-t.y,e===0)){const n=(i.next.y-i.y)/(i.next.x-i.x),r=(t.next.y-t.y)/(t.next.x-t.x);e=n-r}return e}h(bd,"compareXYSlope");function Td(i,t){const e=Ad(i,t);if(!e)return t;const n=uu(e,i);return Gn(n,n.next),Gn(e,e.next)}h(Td,"eliminateHole");function Ad(i,t){let e=t;const n=i.x,r=i.y;let s=-1/0,a;if(Mi(i,e))return e;do{if(Mi(i,e.next))return e.next;if(r<=e.y&&r>=e.next.y&&e.next.y!==e.y){const f=e.x+(r-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(f<=n&&f>s&&(s=f,a=e.x<e.next.x?e:e.next,f===n))return a}e=e.next}while(e!==t);if(!a)return null;const o=a,c=a.x,l=a.y;let d=1/0;e=a;do{if(n>=e.x&&e.x>=c&&n!==e.x&&cu(r<l?n:s,r,c,l,r<l?s:n,r,e.x,e.y)){const f=Math.abs(r-e.y)/(n-e.x);Ki(e,i)&&(f<d||f===d&&(e.x>a.x||e.x===a.x&&Rd(a,e)))&&(a=e,d=f)}e=e.next}while(e!==o);return a}h(Ad,"findHoleBridge");function Rd(i,t){return de(i.prev,i,t.prev)<0&&de(t.next,i,i.next)<0}h(Rd,"sectorContainsSector");function wd(i,t,e,n){let r=i;do r.z===0&&(r.z=Sa(r.x,r.y,t,e,n)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==i);r.prevZ.nextZ=null,r.prevZ=null,Cd(r)}h(wd,"indexCurve");function Cd(i){let t,e=1;do{let n=i,r;i=null;let s=null;for(t=0;n;){t++;let a=n,o=0;for(let l=0;l<e&&(o++,a=a.nextZ,!!a);l++);let c=e;for(;o>0||c>0&&a;)o!==0&&(c===0||!a||n.z<=a.z)?(r=n,n=n.nextZ,o--):(r=a,a=a.nextZ,c--),s?s.nextZ=r:i=r,r.prevZ=s,s=r;n=a}s.nextZ=null,e*=2}while(t>1);return i}h(Cd,"sortLinked");function Sa(i,t,e,n,r){return i=(i-e)*r|0,t=(t-n)*r|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}h(Sa,"zOrder");function Pd(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}h(Pd,"getLeftmost");function cu(i,t,e,n,r,s,a,o){return(r-a)*(t-o)>=(i-a)*(s-o)&&(i-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(s-o)>=(r-a)*(n-o)}h(cu,"pointInTriangle");function Oi(i,t,e,n,r,s,a,o){return!(i===a&&t===o)&&cu(i,t,e,n,r,s,a,o)}h(Oi,"pointInTriangleExceptFirst");function Id(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!Dd(i,t)&&(Ki(i,t)&&Ki(t,i)&&Ld(i,t)&&(de(i.prev,i,t.prev)||de(i,t.prev,t))||Mi(i,t)&&de(i.prev,i,i.next)>0&&de(t.prev,t,t.next)>0)}h(Id,"isValidDiagonal");function de(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}h(de,"area");function Mi(i,t){return i.x===t.x&&i.y===t.y}h(Mi,"equals");function hu(i,t,e,n){const r=Nr(de(i,t,e)),s=Nr(de(i,t,n)),a=Nr(de(e,n,i)),o=Nr(de(e,n,t));return!!(r!==s&&a!==o||r===0&&Lr(i,e,t)||s===0&&Lr(i,n,t)||a===0&&Lr(e,i,n)||o===0&&Lr(e,t,n))}h(hu,"intersects");function Lr(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}h(Lr,"onSegment");function Nr(i){return i>0?1:i<0?-1:0}h(Nr,"sign");function Dd(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&hu(e,e.next,i,t))return true;e=e.next}while(e!==i);return false}h(Dd,"intersectsPolygon");function Ki(i,t){return de(i.prev,i,i.next)<0?de(i,t,i.next)>=0&&de(i,i.prev,t)>=0:de(i,t,i.prev)<0||de(i,i.next,t)<0}h(Ki,"locallyInside");function Ld(i,t){let e=i,n=false;const r=(i.x+t.x)/2,s=(i.y+t.y)/2;do e.y>s!=e.next.y>s&&e.next.y!==e.y&&r<(e.next.x-e.x)*(s-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}h(Ld,"middleInside");function uu(i,t){const e=Ma(i.i,i.x,i.y),n=Ma(t.i,t.x,t.y),r=i.next,s=t.prev;return i.next=t,t.prev=i,e.next=r,r.prev=e,n.next=e,e.prev=n,s.next=n,n.prev=s,n}h(uu,"splitPolygon");function nh(i,t,e,n){const r=Ma(i,t,e);return n?(r.next=n.next,r.prev=n,n.next.prev=r,n.next=r):(r.prev=r,r.next=r),r}h(nh,"insertNode");function Ji(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}h(Ji,"removeNode");function Ma(i,t,e){return{i,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:false}}h(Ma,"createNode");function Nd(i,t,e,n){let r=0;for(let s=t,a=e-n;s<e;s+=n)r+=(i[a]-i[s])*(i[s+1]+i[a+1]),a=s;return r}h(Nd,"signedArea");const Yo=class Yo2{static triangulate(t,e,n=2){return xd(t,e,n)}};h(Yo,"Earcut");let ya=Yo;const ys=class ys2{static area(t){const e=t.length;let n=0;for(let r=e-1,s=0;s<e;r=s++)n+=t[r].x*t[s].y-t[s].x*t[r].y;return n*.5}static isClockWise(t){return ys2.area(t)<0}static triangulateShape(t,e){const n=[],r=[],s=[];rh(t),sh(n,t);let a=t.length;e.forEach(rh);for(let c=0;c<e.length;c++)r.push(a),a+=e[c].length,sh(n,e[c]);const o=ya.triangulate(n,r);for(let c=0;c<o.length;c+=3)s.push(o.slice(c,c+3));return s}};h(ys,"ShapeUtils");let ih=ys;function rh(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}h(rh,"removeDupEndPts");function sh(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}h(sh,"addContour");const Es=class Es2 extends va{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Es2(t.radius,t.detail)}};h(Es,"IcosahedronGeometry");let ah=Es;const bs=class bs2 extends ve{constructor(t=1,e=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:r};const s=t/2,a=e/2,o=Math.floor(n),c=Math.floor(r),l=o+1,d=c+1,f=t/o,u=e/c,m=[],_=[],y=[],g=[];for(let p=0;p<d;p++){const E=p*u-a;for(let R=0;R<l;R++){const S=R*f-s;_.push(S,-E,0),y.push(0,0,1),g.push(R/o),g.push(1-p/c)}}for(let p=0;p<c;p++)for(let E=0;E<o;E++){const R=E+l*p,S=E+l*(p+1),T=E+1+l*(p+1),b=E+1+l*p;m.push(R,S,b),m.push(S,T,b)}this.setIndex(m),this.setAttribute("position",new ie(_,3)),this.setAttribute("normal",new ie(y,3)),this.setAttribute("uv",new ie(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new bs2(t.width,t.height,t.widthSegments,t.heightSegments)}};h(bs,"PlaneGeometry");let ns=bs;const Ts=class Ts2 extends ve{constructor(t=1,e=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const c=Math.min(a+o,Math.PI);let l=0;const d=[],f=new D,u=new D,m=[],_=[],y=[],g=[];for(let p=0;p<=n;p++){const E=[],R=p/n,S=a+R*o,T=t*Math.cos(S),b=Math.sqrt(t*t-T*T);let C=0;p===0&&a===0?C=.5/e:p===n&&c===Math.PI&&(C=-.5/e);for(let v=0;v<=e;v++){const A=v/e,P=r+A*s;f.x=-b*Math.cos(P),f.y=T,f.z=b*Math.sin(P),_.push(f.x,f.y,f.z),u.copy(f).normalize(),y.push(u.x,u.y,u.z),g.push(A+C,1-R),E.push(l++)}d.push(E)}for(let p=0;p<n;p++)for(let E=0;E<e;E++){const R=d[p][E+1],S=d[p][E],T=d[p+1][E],b=d[p+1][E+1];(p!==0||a>0)&&m.push(R,S,b),(p!==n-1||c<Math.PI)&&m.push(S,T,b)}this.setIndex(m),this.setAttribute("position",new ie(_,3)),this.setAttribute("normal",new ie(y,3)),this.setAttribute("uv",new ie(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ts2(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};h(Ts,"SphereGeometry");let oh=Ts;const Zo=class Zo2 extends ve{constructor(t=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:t},t!==null){const e=[],n=new Set,r=new D,s=new D;if(t.index!==null){const a=t.attributes.position,o=t.index;let c=t.groups;c.length===0&&(c=[{start:0,count:o.count,materialIndex:0}]);for(let l=0,d=c.length;l<d;++l){const f=c[l],u=f.start,m=f.count;for(let _=u,y=u+m;_<y;_+=3)for(let g=0;g<3;g++){const p=o.getX(_+g),E=o.getX(_+(g+1)%3);r.fromBufferAttribute(a,p),s.fromBufferAttribute(a,E),ch(r,s,n)===true&&(e.push(r.x,r.y,r.z),e.push(s.x,s.y,s.z))}}}else{const a=t.attributes.position;for(let o=0,c=a.count/3;o<c;o++)for(let l=0;l<3;l++){const d=3*o+l,f=3*o+(l+1)%3;r.fromBufferAttribute(a,d),s.fromBufferAttribute(a,f),ch(r,s,n)===true&&(e.push(r.x,r.y,r.z),e.push(s.x,s.y,s.z))}}this.setAttribute("position",new ie(e,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}};h(Zo,"WireframeGeometry");let lh=Zo;function ch(i,t,e){const n=`${i.x},${i.y},${i.z}-${t.x},${t.y},${t.z}`,r=`${t.x},${t.y},${t.z}-${i.x},${i.y},${i.z}`;return e.has(n)===true||e.has(r)===true?false:(e.add(n),e.add(r),true)}h(ch,"isUniqueEdge");function yi(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const r=i[e][n];if(hh(r))r.isRenderTargetTexture?(Tt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=r.clone();else if(Array.isArray(r))if(hh(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();t[e][n]=s}else t[e][n]=r.slice();else t[e][n]=r}}return t}h(yi,"cloneUniforms");function Pe(i){const t={};for(let e=0;e<i.length;e++){const n=yi(i[e]);for(const r in n)t[r]=n[r]}return t}h(Pe,"mergeUniforms");function hh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}h(hh,"isThreeObject");function Ud(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}h(Ud,"cloneUniformsGroups");function du(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===true?t.texture.colorSpace:Wt.workingColorSpace}h(du,"getUnlitUniformColorSpace");const Fd={clone:yi,merge:Pe};var Bd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Od=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;const $o=class $o2 extends on{constructor(t){super(),this.isShaderMaterial=true,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Bd,this.fragmentShader=Od,this.linewidth=1,this.wireframe=false,this.wireframeLinewidth=1,this.fog=false,this.lights=false,this.clipping=false,this.forceSinglePass=true,this.extensions={clipCullDistance:false,multiDraw:false},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=false,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=yi(t.uniforms),this.uniformsGroups=Ud(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?e.uniforms[r]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[r]={type:"m4",value:a.toArray()}:e.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===true&&(n[r]=true);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const n in t.uniforms){const r=t.uniforms[n];switch(this.uniforms[n]={},r.type){case"t":this.uniforms[n].value=e[r.value]||null;break;case"c":this.uniforms[n].value=new Ft().setHex(r.value);break;case"v2":this.uniforms[n].value=new It().fromArray(r.value);break;case"v3":this.uniforms[n].value=new D().fromArray(r.value);break;case"v4":this.uniforms[n].value=new ee().fromArray(r.value);break;case"m3":this.uniforms[n].value=new Lt().fromArray(r.value);break;case"m4":this.uniforms[n].value=new Gt().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}};h($o,"ShaderMaterial");let We=$o;const Ko=class Ko2 extends We{constructor(t){super(t),this.isRawShaderMaterial=true,this.type="RawShaderMaterial"}};h(Ko,"RawShaderMaterial");let Ea=Ko;const Jo=class Jo2 extends on{constructor(t){super(),this.isMeshStandardMaterial=true,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ft(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new It(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Cn,this.envMapIntensity=1,this.wireframe=false,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=false,this.fog=true,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};h(Jo,"MeshStandardMaterial");let ba=Jo;const Qo=class Qo2 extends ba{constructor(t){super(),this.isMeshPhysicalMaterial=true,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new It(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:h(function(){return Nt(2.5*(this.ior-1)/(this.ior+1),0,1)},"get"),set:h(function(e){this.ior=(1+.4*e)/(1-.4*e)},"set")}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ft(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ft(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ft(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};h(Qo,"MeshPhysicalMaterial");let uh=Qo;const jo=class jo2 extends on{constructor(t){super(),this.isMeshDepthMaterial=true,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=false,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}};h(jo,"MeshDepthMaterial");let Ta=jo;const tl=class tl2 extends on{constructor(t){super(),this.isMeshDistanceMaterial=true,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};h(tl,"MeshDistanceMaterial");let Aa=tl;function Tn(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}h(Tn,"convertArray");function Gr(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}h(Gr,"hasTangents");function zd(i){function t(r,s){return i[r]-i[s]}h(t,"compareTime");const e=i.length,n=new Array(e);for(let r=0;r!==e;++r)n[r]=r;return n.sort(t),n}h(zd,"getKeyframeOrder");function dh(i,t,e){const n=i.length,r=new i.constructor(n);for(let s=0,a=0;a!==n;++s){const o=e[s]*t;for(let c=0;c!==t;++c)r[a++]=i[o+c]}return r}h(dh,"sortedArray");function Gd(i,t,e,n){let r=1,s=i[0];for(;s!==void 0&&s[n]===void 0;)s=i[r++];if(s===void 0)return;let a=s[n];if(a!==void 0)if(Array.isArray(a))do a=s[n],a!==void 0&&(t.push(s.time),e.push(...a)),s=i[r++];while(s!==void 0);else if(a.toArray!==void 0)do a=s[n],a!==void 0&&(t.push(s.time),a.toArray(e,e.length)),s=i[r++];while(s!==void 0);else do a=s[n],a!==void 0&&(t.push(s.time),e.push(a)),s=i[r++];while(s!==void 0)}h(Gd,"flattenJSON");const el=class el2{constructor(t,e,n,r){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){const e=this.parameterPositions;let n=this._cachedIndex,r=e[n],s=e[n-1];t:{e:{let a;n:{i:if(!(t<r)){for(let o=n+2;;){if(r===void 0){if(t<s)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(s=r,r=e[++n],t<r)break e}a=e.length;break n}if(!(t>=s)){const o=e[1];t<o&&(n=2,s=o);for(let c=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(r=s,s=e[--n-1],t>=s)break e}a=n,n=0;break n}break t}for(;n<a;){const o=n+a>>>1;t<e[o]?a=o:n=o+1}if(r=e[n],s=e[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,r)}return this.interpolate_(n,s,t,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){const e=this.resultBuffer,n=this.sampleValues,r=this.valueSize,s=t*r;for(let a=0;a!==r;++a)e[a]=n[s+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}};h(el,"Interpolant");let Vn=el;const nl=class nl2 extends Vn{constructor(t,e,n,r){super(t,e,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(t,e,n){const r=this.parameterPositions;let s=t-2,a=t+1,o=r[s],c=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case 2401:s=t,o=2*e-n;break;case 2402:s=r.length-2,o=e+r[s]-r[s+1];break;default:s=t,o=n}if(c===void 0)switch(this.getSettings_().endingEnd){case 2401:a=t,c=2*n-e;break;case 2402:a=1,c=n+r[1]-r[0];break;default:a=t-1,c=e}const l=(n-e)*.5,d=this.valueSize;this._weightPrev=l/(e-o),this._weightNext=l/(c-n),this._offsetPrev=s*d,this._offsetNext=a*d}interpolate_(t,e,n,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,d=this._offsetPrev,f=this._offsetNext,u=this._weightPrev,m=this._weightNext,_=(n-e)/(r-e),y=_*_,g=y*_,p=-u*g+2*u*y-u*_,E=(1+u)*g+(-1.5-2*u)*y+(-.5+u)*_+1,R=(-1-m)*g+(1.5+m)*y+.5*_,S=m*g-m*y;for(let T=0;T!==o;++T)s[T]=p*a[d+T]+E*a[l+T]+R*a[c+T]+S*a[f+T];return s}};h(nl,"CubicInterpolant");let Ra=nl;const il=class il2 extends Vn{constructor(t,e,n,r){super(t,e,n,r)}interpolate_(t,e,n,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,d=(n-e)/(r-e),f=1-d;for(let u=0;u!==o;++u)s[u]=a[l+u]*f+a[c+u]*d;return s}};h(il,"LinearInterpolant");let is=il;const rl=class rl2 extends Vn{constructor(t,e,n,r){super(t,e,n,r)}interpolate_(t){return this.copySampleValue_(t-1)}};h(rl,"DiscreteInterpolant");let wa=rl;const sl=class sl2 extends Vn{interpolate_(t,e,n,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,d=this.inTangents,f=this.outTangents;if(!d||!f){const _=(n-e)/(r-e),y=1-_;for(let g=0;g!==o;++g)s[g]=a[l+g]*y+a[c+g]*_;return s}const u=o*2,m=t-1;for(let _=0;_!==o;++_){const y=a[l+_],g=a[c+_],p=m*u+_*2,E=f[p],R=f[p+1],S=t*u+_*2,T=d[S],b=d[S+1],C=kd(n,e,E,T,r);s[_]=fu(C,y,R,b,g)}return s}};h(sl,"BezierInterpolant");let Ca=sl;function fu(i,t,e,n,r){const s=1-i;return s*s*s*t+3*s*s*i*e+3*s*i*i*n+i*i*i*r}h(fu,"cubicBezier");function Vd(i,t,e,n,r){const s=1-i;return 3*s*s*(e-t)+6*s*i*(n-e)+3*i*i*(r-n)}h(Vd,"cubicBezierSlope");function kd(i,t,e,n,r){let s=(i-t)/(r-t);for(let a=0;a<8;a++){const o=fu(s,t,e,n,r)-i;if(Math.abs(o)<1e-10)break;const c=Vd(s,t,e,n,r);if(Math.abs(c)<1e-10)break;s=Math.max(0,Math.min(1,s-o/c))}return s}h(kd,"solveBezierParameter");const al=class al2{constructor(t,e,n,r){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Tn(e,this.TimeBufferType),this.values=Tn(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(t){const e=t.constructor;let n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Tn(t.times,Array),values:Tn(t.values,Array)};const r=t.getInterpolation();r!==t.DefaultInterpolation&&(n.interpolation=r),Gr(t.settings)&&(n.settings={inTangents:Tn(t.settings.inTangents,Array),outTangents:Tn(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new wa(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new is(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ra(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){const e=new Ca(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case 2300:e=this.InterpolantFactoryMethodDiscrete;break;case 2301:e=this.InterpolantFactoryMethodLinear;break;case 2302:e=this.InterpolantFactoryMethodSmooth;break;case 2303:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Tt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return 2300;case this.InterpolantFactoryMethodLinear:return 2301;case this.InterpolantFactoryMethodSmooth:return 2302;case this.InterpolantFactoryMethodBezier:return 2303}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){const e=this.times;for(let n=0,r=e.length;n!==r;++n)e[n]+=t}return this}scale(t){if(t!==1){const e=this.times;for(let n=0,r=e.length;n!==r;++n)e[n]*=t;Gr(this.settings)&&(fh(this.settings.inTangents,t),fh(this.settings.outTangents,t))}return this}trim(t,e){const n=this.times,r=n.length;let s=0,a=r-1;for(;s!==r&&n[s]<t;)++s;for(;a!==-1&&n[a]>e;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);const o=this.getValueSize();this.times=n.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let t=true;const e=this.getValueSize();e-Math.floor(e)!==0&&(Pt("KeyframeTrack: Invalid value size in track.",this),t=false);const n=this.times,r=this.values,s=n.length;s===0&&(Pt("KeyframeTrack: Track is empty.",this),t=false);let a=null;for(let o=0;o!==s;o++){const c=n[o];if(typeof c=="number"&&isNaN(c)){Pt("KeyframeTrack: Time is not a valid number.",this,o,c),t=false;break}if(a!==null&&a>c){Pt("KeyframeTrack: Out of order keys.",this,o,c,a),t=false;break}a=c}if(r!==void 0&&Iu(r))for(let o=0,c=r.length;o!==c;++o){const l=r[o];if(isNaN(l)){Pt("KeyframeTrack: Value is not a valid number.",this,o,l),t=false;break}}return t}optimize(){const t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===2302,s=t.length-1;let a=1;for(let o=1;o<s;++o){let c=false;const l=t[o],d=t[o+1];if(l!==d&&(o!==1||l!==t[0]))if(r)c=true;else{const f=o*n,u=f-n,m=f+n;for(let _=0;_!==n;++_){const y=e[f+_];if(y!==e[u+_]||y!==e[m+_]){c=true;break}}}if(c){if(o!==a){t[a]=t[o];const f=o*n,u=a*n;for(let m=0;m!==n;++m)e[u+m]=e[f+m]}++a}}if(s>0){t[a]=t[s];for(let o=s*n,c=a*n,l=0;l!==n;++l)e[c+l]=e[o+l];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){const t=this.times.slice(),e=this.values.slice(),n=this.constructor,r=new n(this.name,t,e);return r.createInterpolant=this.createInterpolant,Gr(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};h(al,"KeyframeTrack");let ze=al;function fh(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]*=t}h(fh,"scaleTangentTimes");ze.prototype.ValueTypeName="";ze.prototype.TimeBufferType=Float32Array;ze.prototype.ValueBufferType=Float32Array;ze.prototype.DefaultInterpolation=2301;const ol=class ol2 extends ze{constructor(t,e,n){super(t,e,n)}};h(ol,"BooleanKeyframeTrack");let Pn=ol;Pn.prototype.ValueTypeName="bool";Pn.prototype.ValueBufferType=Array;Pn.prototype.DefaultInterpolation=2300;Pn.prototype.InterpolantFactoryMethodLinear=void 0;Pn.prototype.InterpolantFactoryMethodSmooth=void 0;const ll=class ll2 extends ze{constructor(t,e,n,r){super(t,e,n,r)}};h(ll,"ColorKeyframeTrack");let rs=ll;rs.prototype.ValueTypeName="color";const cl=class cl2 extends ze{constructor(t,e,n,r){super(t,e,n,r)}};h(cl,"NumberKeyframeTrack");let Qi=cl;Qi.prototype.ValueTypeName="number";const hl=class hl2 extends Vn{constructor(t,e,n,r){super(t,e,n,r)}interpolate_(t,e,n,r){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(n-e)/(r-e);let l=t*o;for(let d=l+o;l!==d;l+=4)He.slerpFlat(s,0,a,l-o,a,l,c);return s}};h(hl,"QuaternionLinearInterpolant");let Pa=hl;const ul=class ul2 extends ze{constructor(t,e,n,r){super(t,e,n,r)}InterpolantFactoryMethodLinear(t){return new Pa(this.times,this.values,this.getValueSize(),t)}};h(ul,"QuaternionKeyframeTrack");let ji=ul;ji.prototype.ValueTypeName="quaternion";ji.prototype.InterpolantFactoryMethodSmooth=void 0;const dl=class dl2 extends ze{constructor(t,e,n){super(t,e,n)}};h(dl,"StringKeyframeTrack");let In=dl;In.prototype.ValueTypeName="string";In.prototype.ValueBufferType=Array;In.prototype.DefaultInterpolation=2300;In.prototype.InterpolantFactoryMethodLinear=void 0;In.prototype.InterpolantFactoryMethodSmooth=void 0;const fl=class fl2 extends ze{constructor(t,e,n,r){super(t,e,n,r)}};h(fl,"VectorKeyframeTrack");let ss=fl;ss.prototype.ValueTypeName="vector";const pl=class pl2{constructor(t="",e=-1,n=[],r=2500){this.name=t,this.tracks=n,this.duration=e,this.blendMode=r,this.uuid=Ke(),this.userData={},this.duration<0&&this.resetDuration()}static parse(t){const e=[],n=t.tracks,r=1/(t.fps||1);for(let a=0,o=n.length;a!==o;++a)e.push(Wd(n[a]).scale(r));const s=new this(t.name,t.duration,e,t.blendMode);return s.uuid=t.uuid,s.userData=JSON.parse(t.userData||"{}"),s}static toJSON(t){const e=[],n=t.tracks,r={name:t.name,duration:t.duration,tracks:e,uuid:t.uuid,blendMode:t.blendMode,userData:JSON.stringify(t.userData)};for(let s=0,a=n.length;s!==a;++s)e.push(ze.toJSON(n[s]));return r}static CreateFromMorphTargetSequence(t,e,n,r){const s=e.length,a=[];for(let o=0;o<s;o++){let c=[],l=[];c.push((o+s-1)%s,o,(o+1)%s),l.push(0,1,0);const d=zd(c);c=dh(c,1,d),l=dh(l,1,d),!r&&c[0]===0&&(c.push(s),l.push(l[0])),a.push(new Qi(".morphTargetInfluences["+e[o].name+"]",c,l).scale(1/n))}return new this(t,-1,a)}static findByName(t,e){let n=t;if(!Array.isArray(t)){const r=t;n=r.geometry&&r.geometry.animations||r.animations}for(let r=0;r<n.length;r++)if(n[r].name===e)return n[r];return null}static CreateClipsFromMorphTargetSequences(t,e,n){const r={},s=/^([\w-]*?)([\d]+)$/;for(let o=0,c=t.length;o<c;o++){const l=t[o],d=l.name.match(s);if(d&&d.length>1){const f=d[1];let u=r[f];u||(r[f]=u=[]),u.push(l)}}const a=[];for(const o in r)a.push(this.CreateFromMorphTargetSequence(o,r[o],e,n));return a}resetDuration(){const t=this.tracks;let e=0;for(let n=0,r=t.length;n!==r;++n){const s=this.tracks[n];e=Math.max(e,s.times[s.times.length-1])}return this.duration=e,this}trim(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].trim(0,this.duration);return this}validate(){let t=true;for(let e=0;e<this.tracks.length;e++)t=t&&this.tracks[e].validate();return t}optimize(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].optimize();return this}clone(){const t=[];for(let n=0;n<this.tracks.length;n++)t.push(this.tracks[n].clone());const e=new this.constructor(this.name,this.duration,t,this.blendMode);return e.userData=JSON.parse(JSON.stringify(this.userData)),e}toJSON(){return this.constructor.toJSON(this)}};h(pl,"AnimationClip");let as=pl;function Hd(i){switch(i.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Qi;case"vector":case"vector2":case"vector3":case"vector4":return ss;case"color":return rs;case"quaternion":return ji;case"bool":case"boolean":return Pn;case"string":return In}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+i)}h(Hd,"getTrackTypeForValueTypeName");function Wd(i){if(i.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const t=Hd(i.type);if(i.times===void 0){const n=[],r=[];Gd(i.keys,n,r,"value"),i.times=n,i.values=r}let e;return t.parse!==void 0?e=t.parse(i):e=new t(i.name,i.times,i.values,i.interpolation),Gr(i.settings)&&(e.settings={inTangents:Tn(i.settings.inTangents,Float32Array),outTangents:Tn(i.settings.outTangents,Float32Array)}),e}h(Wd,"parseKeyframeTrack");const mn={enabled:false,files:{},add:h(function(i,t){this.enabled!==false&&(ph(i)||(this.files[i]=t))},"add"),get:h(function(i){if(this.enabled!==false&&!ph(i))return this.files[i]},"get"),remove:h(function(i){delete this.files[i]},"remove"),clear:h(function(){this.files={}},"clear")};function ph(i){try{const t=i.slice(i.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return false}}h(ph,"isBlobURL");const ml=class ml2{constructor(t,e,n){const r=this;let s=false,a=0,o=0,c;const l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(d){o++,s===false&&r.onStart!==void 0&&r.onStart(d,a,o),s=true},this.itemEnd=function(d){a++,r.onProgress!==void 0&&r.onProgress(d,a,o),a===o&&(s=false,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(d){r.onError!==void 0&&r.onError(d)},this.resolveURL=function(d){return d=d.normalize("NFC"),c?c(d):d},this.setURLModifier=function(d){return c=d,this},this.addHandler=function(d,f){return l.push(d,f),this},this.removeHandler=function(d){const f=l.indexOf(d);return f!==-1&&l.splice(f,2),this},this.getHandler=function(d){for(let f=0,u=l.length;f<u;f+=2){const m=l[f],_=l[f+1];if(m.global&&(m.lastIndex=0),m.test(d))return _}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}};h(ml,"LoadingManager");let Ia=ml;const Xd=new Ia,gl=class gl2{constructor(t){this.manager=t!==void 0?t:Xd,this.crossOrigin="anonymous",this.withCredentials=false,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){const n=this;return new Promise(function(r,s){n.load(t,r,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};h(gl,"Loader");let kn=gl;kn.DEFAULT_MATERIAL_NAME="__DEFAULT";const fn={},_l=class _l2 extends Error{constructor(t,e){super(t),this.response=e}};h(_l,"HttpError");let Da=_l;const xl=class xl2 extends kn{constructor(t){super(t),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(t,e,n,r){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=mn.get(`file:${t}`);if(s!==void 0){this.manager.itemStart(t),setTimeout(()=>{e&&e(s),this.manager.itemEnd(t)},0);return}if(fn[t]!==void 0){fn[t].push({onLoad:e,onProgress:n,onError:r});return}fn[t]=[],fn[t].push({onLoad:e,onProgress:n,onError:r});const a=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,c=this.responseType;fetch(a).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&Tt("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const d=fn[t],f=l.body.getReader(),u=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),m=u?parseInt(u):0,_=m!==0;let y=0;const g=new ReadableStream({start(p){E();function E(){f.read().then(({done:R,value:S})=>{if(R)p.close();else{y+=S.byteLength;const T=new ProgressEvent("progress",{lengthComputable:_,loaded:y,total:m});for(let b=0,C=d.length;b<C;b++){const v=d[b];v.onProgress&&v.onProgress(T)}p.enqueue(S),E()}},R=>{p.error(R)})}h(E,"readData")}});return new Response(g)}else throw new Da(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(d=>new DOMParser().parseFromString(d,o));case"json":return l.json();default:if(o==="")return l.text();{const f=/charset="?([^;"\s]*)"?/i.exec(o),u=f&&f[1]?f[1].toLowerCase():void 0,m=new TextDecoder(u);return l.arrayBuffer().then(_=>m.decode(_))}}}).then(l=>{mn.add(`file:${t}`,l);const d=fn[t];delete fn[t];for(let f=0,u=d.length;f<u;f++){const m=d[f];m.onLoad&&m.onLoad(l)}}).catch(l=>{const d=fn[t];if(d===void 0)throw this.manager.itemError(t),l;delete fn[t];for(let f=0,u=d.length;f<u;f++){const m=d[f];m.onError&&m.onError(l)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};h(xl,"FileLoader");let mh=xl;const ai=new WeakMap,vl=class vl2 extends kn{constructor(t){super(t)}load(t,e,n,r){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,a=mn.get(`image:${t}`);if(a!==void 0){if(a.complete===true)s.manager.itemStart(t),setTimeout(function(){e&&e(a),s.manager.itemEnd(t)},0);else{let f=ai.get(a);f===void 0&&(f=[],ai.set(a,f)),f.push({onLoad:e,onError:r})}return a}const o=Hi("img");function c(){d(),e&&e(this);const f=ai.get(this)||[];for(let u=0;u<f.length;u++){const m=f[u];m.onLoad&&m.onLoad(this)}ai.delete(this),s.manager.itemEnd(t)}h(c,"onImageLoad");function l(f){d(),r&&r(f),mn.remove(`image:${t}`);const u=ai.get(this)||[];for(let m=0;m<u.length;m++){const _=u[m];_.onError&&_.onError(f)}ai.delete(this),s.manager.itemError(t),s.manager.itemEnd(t)}h(l,"onImageError");function d(){o.removeEventListener("load",c,false),o.removeEventListener("error",l,false)}return h(d,"removeEventListeners"),o.addEventListener("load",c,false),o.addEventListener("error",l,false),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),mn.add(`image:${t}`,o),s.manager.itemStart(t),o.src=t,o}};h(vl,"ImageLoader");let La=vl;const Sl=class Sl2 extends kn{constructor(t){super(t)}load(t,e,n,r){const s=new Le,a=new La(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(t,function(o){s.image=o,s.needsUpdate=true,e!==void 0&&e(s)},n,r),s}};h(Sl,"TextureLoader");let gh=Sl;const Ml=class Ml2 extends pe{constructor(t,e=1){super(),this.isLight=true,this.type="Light",this.color=new Ft(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}};h(Ml,"Light");let Ei=Ml;const yl=class yl2 extends Ei{constructor(t,e,n){super(t,n),this.isHemisphereLight=true,this.type="HemisphereLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ft(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}};h(yl,"HemisphereLight");let _h=yl;const ea=new Gt,xh=new D,vh=new D,El=class El2{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new It(512,512),this.mapType=1009,this.map=null,this.mapPass=null,this.matrix=new Gt,this.autoUpdate=true,this.needsUpdate=false,this._frustum=new Yi,this._frameExtents=new It(1,1),this._viewportCount=1,this._viewports=[new ee(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera;xh.setFromMatrixPosition(t.matrixWorld),e.position.copy(xh),vh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(vh),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,r){ea.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(ea,t.coordinateSystem,t.reversedDepth);const s=this._frameExtents,a=r?r.z/s.x:1,o=r?r.w/s.y:1,c=r?r.x/s.x:0,l=r?r.y/s.y:0;t.coordinateSystem===2001||t.reversedDepth?e.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,.5,.5,0,0,0,1),e.multiply(ea)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(false).object,delete t.camera.matrix,t}};h(El,"LightShadow");let tr=El;const Ur=new D,Fr=new He,tn=new D,bl=class bl2 extends pe{constructor(){super(),this.isCamera=true,this.type="Camera",this.matrixWorldInverse=new Gt,this.projectionMatrix=new Gt,this.projectionMatrixInverse=new Gt,this.coordinateSystem=2e3,this._reversedDepth=false}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Ur,Fr,tn),tn.x===1&&tn.y===1&&tn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ur,Fr,tn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=false){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Ur,Fr,tn),tn.x===1&&tn.y===1&&tn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ur,Fr,tn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};h(bl,"Camera");let os=bl;const bn=new D,Sh=new It,Mh=new It,Tl=class Tl2 extends os{constructor(t=50,e=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=true,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Si*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(_i*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Si*2*Math.atan(Math.tan(_i*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){bn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(bn.x,bn.y).multiplyScalar(-t/bn.z),bn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(bn.x,bn.y).multiplyScalar(-t/bn.z)}getViewSize(t,e){return this.getViewBounds(t,Sh,Mh),e.subVectors(Mh,Sh)}setViewOffset(t,e,n,r,s,a){this.aspect=t/e,this.view===null&&(this.view={enabled:true,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=true,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=false),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(_i*.5*this.fov)/this.zoom,n=2*e,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;s+=a.offsetX*r/c,e-=a.offsetY*n/l,r*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};h(Tl,"PerspectiveCamera");let Ie=Tl;const Al=class Al2 extends tr{constructor(){super(new Ie(50,1,.5,500)),this.isSpotLightShadow=true,this.focus=1,this.aspect=1}updateMatrices(t){const e=this.camera,n=Si*2*t.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,s=t.distance||e.far;(n!==e.fov||r!==e.aspect||s!==e.far)&&(e.fov=n,e.aspect=r,e.far=s,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this.aspect=t.aspect,this}toJSON(){const t=super.toJSON();return t.focus=this.focus,t.aspect=this.aspect,t}};h(Al,"SpotLightShadow");let Na=Al;const Rl=class Rl2 extends Ei{constructor(t,e,n=0,r=Math.PI/3,s=0,a=2){super(t,e),this.isSpotLight=true,this.type="SpotLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.distance=n,this.angle=r,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new Na}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.map=t.map,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.angle=this.angle,e.object.decay=this.decay,e.object.penumbra=this.penumbra,e.object.target=this.target.uuid,this.map&&this.map.isTexture&&(e.object.map=this.map.toJSON(t).uuid),e.object.shadow=this.shadow.toJSON(),e}};h(Rl,"SpotLight");let yh=Rl;const wl=class wl2 extends tr{constructor(){super(new Ie(90,1,.5,500)),this.isPointLightShadow=true}};h(wl,"PointLightShadow");let Ua=wl;const Cl=class Cl2 extends Ei{constructor(t,e,n=0,r=2){super(t,e),this.isPointLight=true,this.type="PointLight",this.distance=n,this.decay=r,this.shadow=new Ua}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}};h(Cl,"PointLight");let Eh=Cl;const Pl=class Pl2 extends os{constructor(t=-1,e=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=true,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,r,s,a){this.view===null&&(this.view={enabled:true,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=true,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=false),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-t,a=n+t,o=r+e,c=r-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,a=s+l*this.view.width,o-=d*this.view.offsetY,c=o-d*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}};h(Pl,"OrthographicCamera");let er=Pl;const Il=class Il2 extends tr{constructor(){super(new er(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=true}};h(Il,"DirectionalLightShadow");let Fa=Il;const Dl=class Dl2 extends Ei{constructor(t,e){super(t,e),this.isDirectionalLight=true,this.type="DirectionalLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.shadow=new Fa}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};h(Dl,"DirectionalLight");let bh=Dl;const Ll=class Ll2{static extractUrlBase(t){const e=t.lastIndexOf("/");return e===-1?"./":t.slice(0,e+1)}static resolveURL(t,e){return typeof t!="string"||t===""?"":(/^https?:\/\//i.test(e)&&/^\//.test(t)&&(e=e.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(t)||/^data:.*,.*$/i.test(t)||/^blob:.*$/i.test(t)?t:e+t)}};h(Ll,"LoaderUtils");let Th=Ll;const Nl=class Nl2 extends ve{constructor(){super(),this.isInstancedBufferGeometry=true,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){const t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=true,t}};h(Nl,"InstancedBufferGeometry");let Ah=Nl;const na=new WeakMap,Ul=class Ul2 extends kn{constructor(t){super(t),this.isImageBitmapLoader=true,typeof createImageBitmap>"u"&&Tt("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Tt("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(t){return this.options=t,this}load(t,e,n,r){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,a=mn.get(`image-bitmap:${t}`);if(a!==void 0){if(s.manager.itemStart(t),a.then){a.then(l=>{na.has(a)===true?(r&&r(na.get(a)),s.manager.itemError(t),s.manager.itemEnd(t)):(e&&e(l),s.manager.itemEnd(t))});return}setTimeout(function(){e&&e(a),s.manager.itemEnd(t)},0);return}const o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;const c=fetch(t,o).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign({},s.options,{colorSpaceConversion:"none"}))}).then(function(l){return mn.add(`image-bitmap:${t}`,l),e&&e(l),s.manager.itemEnd(t),l}).catch(function(l){r&&r(l),na.set(c,l),mn.remove(`image-bitmap:${t}`),s.manager.itemError(t),s.manager.itemEnd(t)});mn.add(`image-bitmap:${t}`,c),s.manager.itemStart(t)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};h(Ul,"ImageBitmapLoader");let Rh=Ul;const oi=-90,li=1,Fl=class Fl2 extends pe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Ie(oi,li,t,e);r.layers=this.layers,this.add(r);const s=new Ie(oi,li,t,e);s.layers=this.layers,this.add(s);const a=new Ie(oi,li,t,e);a.layers=this.layers,this.add(a);const o=new Ie(oi,li,t,e);o.layers=this.layers,this.add(o);const c=new Ie(oi,li,t,e);c.layers=this.layers,this.add(c);const l=new Ie(oi,li,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,r,s,a,o,c]=e;for(const l of e)this.remove(l);if(t===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,c,l,d]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=false;const y=n.texture.generateMipmaps;n.texture.generateMipmaps=false;let g=false;t.isWebGLRenderer===true?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(n,0,r),g&&t.autoClear===false&&t.clearDepth(),t.render(e,s),t.setRenderTarget(n,1,r),g&&t.autoClear===false&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,r),g&&t.autoClear===false&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,r),g&&t.autoClear===false&&t.clearDepth(),t.render(e,c),t.setRenderTarget(n,4,r),g&&t.autoClear===false&&t.clearDepth(),t.render(e,l),n.texture.generateMipmaps=y,t.setRenderTarget(n,5,r),g&&t.autoClear===false&&t.clearDepth(),t.render(e,d),t.setRenderTarget(f,u,m),t.xr.enabled=_,n.texture.needsPMREMUpdate=true}};h(Fl,"CubeCamera");let Ba=Fl;const Bl=class Bl2 extends Ie{constructor(t=[]){super(),this.isArrayCamera=true,this.isMultiViewCamera=false,this.cameras=t}};h(Bl,"ArrayCamera");let Oa=Bl;const Ol=class Ol2{constructor(t,e,n){this.binding=t,this.valueSize=n;let r,s,a;switch(e){case"quaternion":r=this._slerp,s=this._slerpAdditive,a=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":r=this._select,s=this._select,a=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:r=this._lerp,s=this._lerpAdditive,a=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=r,this._mixBufferRegionAdditive=s,this._setIdentity=a,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(t,e){const n=this.buffer,r=this.valueSize,s=t*r+r;let a=this.cumulativeWeight;if(a===0){for(let o=0;o!==r;++o)n[s+o]=n[o];a=e}else{a+=e;const o=e/a;this._mixBufferRegion(n,s,0,o,r)}this.cumulativeWeight=a}accumulateAdditive(t){const e=this.buffer,n=this.valueSize,r=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(e,r,0,t,n),this.cumulativeWeightAdditive+=t}apply(t){const e=this.valueSize,n=this.buffer,r=t*e+e,s=this.cumulativeWeight,a=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,s<1){const c=e*this._origIndex;this._mixBufferRegion(n,r,c,1-s,e)}a>0&&this._mixBufferRegionAdditive(n,r,this._addIndex*e,1,e);for(let c=e,l=e+e;c!==l;++c)if(n[c]!==n[c+e]){o.setValue(n,r);break}}saveOriginalState(){const t=this.binding,e=this.buffer,n=this.valueSize,r=n*this._origIndex;t.getValue(e,r);for(let s=n,a=r;s!==a;++s)e[s]=e[r+s%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){const t=this.valueSize*3;this.binding.setValue(this.buffer,t)}_setAdditiveIdentityNumeric(){const t=this._addIndex*this.valueSize,e=t+this.valueSize;for(let n=t;n<e;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){const t=this._origIndex*this.valueSize,e=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[e+n]=this.buffer[t+n]}_select(t,e,n,r,s){if(r>=.5)for(let a=0;a!==s;++a)t[e+a]=t[n+a]}_slerp(t,e,n,r){He.slerpFlat(t,e,t,e,t,n,r)}_slerpAdditive(t,e,n,r,s){const a=this._workIndex*s;He.multiplyQuaternionsFlat(t,a,t,e,t,n),He.slerpFlat(t,e,t,e,t,a,r)}_lerp(t,e,n,r,s){const a=1-r;for(let o=0;o!==s;++o){const c=e+o;t[c]=t[c]*a+t[n+o]*r}}_lerpAdditive(t,e,n,r,s){for(let a=0;a!==s;++a){const o=e+a;t[o]=t[o]+t[n+a]*r}}};h(Ol,"PropertyMixer");let za=Ol;const to="\\[\\]\\.:\\/",qd=new RegExp("["+to+"]","g"),eo="[^"+to+"]",Yd="[^"+to.replace("\\.","")+"]",Zd=/((?:WC+[\/:])*)/.source.replace("WC",eo),$d=/(WCOD+)?/.source.replace("WCOD",Yd),Kd=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",eo),Jd=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",eo),Qd=new RegExp("^"+Zd+$d+Kd+Jd+"$"),jd=["material","materials","bones","map"],zl=class zl2{constructor(t,e,n){const r=n||ce.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,r)}getValue(t,e){this.bind();const n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(t,e)}setValue(t,e){const n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=n.length;r!==s;++r)n[r].setValue(t,e)}bind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}};h(zl,"Composite");let Ga=zl;const Rn=class Rn2{constructor(t,e,n){this.path=e,this.parsedPath=n||Rn2.parseTrackName(e),this.node=Rn2.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new Rn2.Composite(t,e,n):new Rn2(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(qd,"")}static parseTrackName(t){const e=Qd.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);const n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},r=n.nodeName&&n.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){const s=n.nodeName.substring(r+1);jd.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){const n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){const n=h(function(s){for(let a=0;a<s.length;a++){const o=s[a];if(o.name===e||o.uuid===e)return o;const c=n(o.children);if(c)return c}return null},"searchNodeSubtree"),r=n(t.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){const n=this.resolvedProperty;for(let r=0,s=n.length;r!==s;++r)t[e++]=n[r]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=true}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=true}_setValue_array(t,e){const n=this.resolvedProperty;for(let r=0,s=n.length;r!==s;++r)n[r]=t[e++]}_setValue_array_setNeedsUpdate(t,e){const n=this.resolvedProperty;for(let r=0,s=n.length;r!==s;++r)n[r]=t[e++];this.targetObject.needsUpdate=true}_setValue_array_setMatrixWorldNeedsUpdate(t,e){const n=this.resolvedProperty;for(let r=0,s=n.length;r!==s;++r)n[r]=t[e++];this.targetObject.matrixWorldNeedsUpdate=true}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=true}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=true}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=true}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=true}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node;const e=this.parsedPath,n=e.objectName,r=e.propertyName;let s=e.propertyIndex;if(t||(t=Rn2.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Tt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=e.objectIndex;switch(n){case"materials":if(!t.material){Pt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Pt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Pt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let d=0;d<t.length;d++)if(t[d].name===l){l=d;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Pt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Pt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Pt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(l!==void 0){if(t[l]===void 0){Pt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}const a=t[r];if(a===void 0){const l=e.nodeName;Pt("PropertyBinding: Trying to update property for track: "+l+"."+r+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===true?o=this.Versioning.NeedsUpdate:t.isObject3D===true&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!t.geometry){Pt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Pt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};h(Rn,"PropertyBinding");let ce=Rn;ce.Composite=Ga;ce.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ce.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ce.prototype.GetterByBindingType=[ce.prototype._getValue_direct,ce.prototype._getValue_array,ce.prototype._getValue_arrayElement,ce.prototype._getValue_toArray];ce.prototype.SetterByBindingTypeAndVersioning=[[ce.prototype._setValue_direct,ce.prototype._setValue_direct_setNeedsUpdate,ce.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_array,ce.prototype._setValue_array_setNeedsUpdate,ce.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_arrayElement,ce.prototype._setValue_arrayElement_setNeedsUpdate,ce.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_fromArray,ce.prototype._setValue_fromArray_setNeedsUpdate,ce.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];const Gl=class Gl2{constructor(t,e,n=null,r=e.blendMode){this._mixer=t,this._clip=e,this._localRoot=n,this.blendMode=r;const s=e.tracks,a=s.length,o=new Array(a),c={endingStart:2400,endingEnd:2400};for(let l=0;l!==a;++l){const d=s[l].createInterpolant(null);o[l]=d,d.settings=c}this._interpolantSettings=c,this._interpolants=o,this._propertyBindings=new Array(a),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=2201,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=false,this.enabled=true,this.clampWhenFinished=false,this.zeroSlopeAtStart=true,this.zeroSlopeAtEnd=true}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=false,this.enabled=true,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(t){return this._startTime=t,this}setLoop(t,e){return this.loop=t,this.repetitions=e,this}setEffectiveWeight(t){return this.weight=t,this._effectiveWeight=this.enabled?t:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(t){return this._scheduleFading(t,0,1)}fadeOut(t){return this._scheduleFading(t,1,0)}crossFadeFrom(t,e,n=false){if(t.fadeOut(e),this.fadeIn(e),n===true){const r=this._clip.duration,s=t._clip.duration,a=s/r,o=r/s;t._restoreTimeScale=t.timeScale,this._restoreTimeScale=this.timeScale,t.warp(1,a,e),this.warp(o,1,e)}return this}crossFadeTo(t,e,n=false){return t.crossFadeFrom(this,e,n)}stopFading(){const t=this._weightInterpolant;return t!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this}setEffectiveTimeScale(t){return this.timeScale=t,this._effectiveTimeScale=this.paused?0:t,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(t){return this.timeScale=this._clip.duration/t,this.stopWarping()}syncWith(t){return this.time=t.time,this.timeScale=t.timeScale,this.stopWarping()}halt(t){return this.warp(this._effectiveTimeScale,0,t)}warp(t,e,n){const r=this._mixer,s=r.time,a=this.timeScale;let o=this._timeScaleInterpolant;o===null&&(o=r._lendControlInterpolant(),this._timeScaleInterpolant=o);const c=o.parameterPositions,l=o.sampleValues;return c[0]=s,c[1]=s+n,l[0]=t/a,l[1]=e/a,this}stopWarping(){const t=this._timeScaleInterpolant;return t!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(t,e,n,r){if(!this.enabled){this._updateWeight(t);return}const s=this._startTime;if(s!==null){const c=(t-s)*n;c<0||n===0?e=0:(this._startTime=null,e=n*c)}e*=this._updateTimeScale(t);const a=this._updateTime(e),o=this._updateWeight(t);if(o>0){const c=this._interpolants,l=this._propertyBindings;switch(this.blendMode){case 2501:for(let d=0,f=c.length;d!==f;++d)c[d].evaluate(a),l[d].accumulateAdditive(o);break;case 2500:default:for(let d=0,f=c.length;d!==f;++d)c[d].evaluate(a),l[d].accumulate(r,o)}}}_updateWeight(t){let e=0;if(this.enabled){e=this.weight;const n=this._weightInterpolant;if(n!==null){const r=n.evaluate(t)[0];e*=r,t>n.parameterPositions[1]&&(this.stopFading(),r===0&&(this.enabled=false))}}return this._effectiveWeight=e,e}_updateTimeScale(t){let e=0;if(!this.paused){e=this.timeScale;const n=this._timeScaleInterpolant;if(n!==null){const r=n.evaluate(t)[0];e*=r,t>n.parameterPositions[1]&&(e===0?this.paused=true:(this._restoreTimeScale!==null&&(e=this._restoreTimeScale),this.timeScale=e),this.stopWarping())}}return this._effectiveTimeScale=e,e}_updateTime(t){const e=this._clip.duration,n=this.loop;let r=this.time+t,s=this._loopCount;const a=n===2202;if(t===0)return s===-1?r:a&&(s&1)===1?e-r:r;if(n===2200){s===-1&&(this._loopCount=0,this._setEndings(true,true,false));t:{if(r>=e)r=e;else if(r<0)r=0;else{this.time=r;break t}this.clampWhenFinished?this.paused=true:this.enabled=false,this.time=r,this._mixer.dispatchEvent({type:"finished",action:this,direction:t<0?-1:1})}}else{if(s===-1&&(t>=0?(s=0,this._setEndings(true,this.repetitions===0,a)):this._setEndings(this.repetitions===0,true,a)),r>=e||r<0){const o=Math.floor(r/e);r-=e*o,s+=Math.abs(o);const c=this.repetitions-s;if(c<=0)this.clampWhenFinished?this.paused=true:this.enabled=false,r=t>0?e:0,this.time=r,this._mixer.dispatchEvent({type:"finished",action:this,direction:t>0?1:-1});else{if(c===1){const l=t<0;this._setEndings(l,!l,a)}else this._setEndings(false,false,a);this._loopCount=s,this.time=r,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this._loopCount=s,this.time=r;if(a&&(s&1)===1)return e-r}return r}_setEndings(t,e,n){const r=this._interpolantSettings;n?(r.endingStart=2401,r.endingEnd=2401):(t?r.endingStart=this.zeroSlopeAtStart?2401:2400:r.endingStart=2402,e?r.endingEnd=this.zeroSlopeAtEnd?2401:2400:r.endingEnd=2402)}_scheduleFading(t,e,n){const r=this._mixer,s=r.time;let a=this._weightInterpolant;a===null&&(a=r._lendControlInterpolant(),this._weightInterpolant=a);const o=a.parameterPositions,c=a.sampleValues;return o[0]=s,c[0]=e,o[1]=s+t,c[1]=n,this}};h(Gl,"AnimationAction");let Va=Gl;const tf=new Float32Array(1),Vl=class Vl2 extends sn{constructor(t){super(),this._root=t,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}_bindAction(t,e){const n=t._localRoot||this._root,r=t._clip.tracks,s=r.length,a=t._propertyBindings,o=t._interpolants,c=n.uuid,l=this._bindingsByRootAndName;let d=l[c];d===void 0&&(d={},l[c]=d);for(let f=0;f!==s;++f){const u=r[f],m=u.name;let _=d[m];if(_!==void 0)++_.referenceCount,a[f]=_;else{if(_=a[f],_!==void 0){_._cacheIndex===null&&(++_.referenceCount,this._addInactiveBinding(_,c,m));continue}const y=e&&e._propertyBindings[f].binding.parsedPath;_=new za(ce.create(n,m,y),u.ValueTypeName,u.getValueSize()),++_.referenceCount,this._addInactiveBinding(_,c,m),a[f]=_}o[f].resultBuffer=_.buffer}}_activateAction(t){if(!this._isActiveAction(t)){if(t._cacheIndex===null){const n=(t._localRoot||this._root).uuid,r=t._clip.uuid,s=this._actionsByClip[r];this._bindAction(t,s&&s.knownActions[0]),this._addInactiveAction(t,r,n)}const e=t._propertyBindings;for(let n=0,r=e.length;n!==r;++n){const s=e[n];s.useCount++===0&&(this._lendBinding(s),s.saveOriginalState())}this._lendAction(t)}}_deactivateAction(t){if(this._isActiveAction(t)){const e=t._propertyBindings;for(let n=0,r=e.length;n!==r;++n){const s=e[n];--s.useCount===0&&(s.restoreOriginalState(),this._takeBackBinding(s))}this._takeBackAction(t)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;const t=this;this.stats={actions:{get total(){return t._actions.length},get inUse(){return t._nActiveActions}},bindings:{get total(){return t._bindings.length},get inUse(){return t._nActiveBindings}},controlInterpolants:{get total(){return t._controlInterpolants.length},get inUse(){return t._nActiveControlInterpolants}}}}_isActiveAction(t){const e=t._cacheIndex;return e!==null&&e<this._nActiveActions}_addInactiveAction(t,e,n){const r=this._actions,s=this._actionsByClip;let a=s[e];if(a===void 0)a={knownActions:[t],actionByRoot:{}},t._byClipCacheIndex=0,s[e]=a;else{const o=a.knownActions;t._byClipCacheIndex=o.length,o.push(t)}t._cacheIndex=r.length,r.push(t),a.actionByRoot[n]=t}_removeInactiveAction(t){const e=this._actions,n=e[e.length-1],r=t._cacheIndex;n._cacheIndex=r,e[r]=n,e.pop(),t._cacheIndex=null;const s=t._clip.uuid,a=this._actionsByClip,o=a[s],c=o.knownActions,l=c[c.length-1],d=t._byClipCacheIndex;l._byClipCacheIndex=d,c[d]=l,c.pop(),t._byClipCacheIndex=null;const f=o.actionByRoot,u=(t._localRoot||this._root).uuid;delete f[u],c.length===0&&delete a[s],this._removeInactiveBindingsForAction(t)}_removeInactiveBindingsForAction(t){const e=t._propertyBindings;for(let n=0,r=e.length;n!==r;++n){const s=e[n];--s.referenceCount===0&&this._removeInactiveBinding(s)}}_lendAction(t){const e=this._actions,n=t._cacheIndex,r=this._nActiveActions++,s=e[r];t._cacheIndex=r,e[r]=t,s._cacheIndex=n,e[n]=s}_takeBackAction(t){const e=this._actions,n=t._cacheIndex,r=--this._nActiveActions,s=e[r];t._cacheIndex=r,e[r]=t,s._cacheIndex=n,e[n]=s}_addInactiveBinding(t,e,n){const r=this._bindingsByRootAndName,s=this._bindings;let a=r[e];a===void 0&&(a={},r[e]=a),a[n]=t,t._cacheIndex=s.length,s.push(t)}_removeInactiveBinding(t){const e=this._bindings,n=t.binding,r=n.rootNode.uuid,s=n.path,a=this._bindingsByRootAndName,o=a[r],c=e[e.length-1],l=t._cacheIndex;c._cacheIndex=l,e[l]=c,e.pop(),delete o[s],Object.keys(o).length===0&&delete a[r]}_lendBinding(t){const e=this._bindings,n=t._cacheIndex,r=this._nActiveBindings++,s=e[r];t._cacheIndex=r,e[r]=t,s._cacheIndex=n,e[n]=s}_takeBackBinding(t){const e=this._bindings,n=t._cacheIndex,r=--this._nActiveBindings,s=e[r];t._cacheIndex=r,e[r]=t,s._cacheIndex=n,e[n]=s}_lendControlInterpolant(){const t=this._controlInterpolants,e=this._nActiveControlInterpolants++;let n=t[e];return n===void 0&&(n=new is(new Float32Array(2),new Float32Array(2),1,tf),n.__cacheIndex=e,t[e]=n),n}_takeBackControlInterpolant(t){const e=this._controlInterpolants,n=t.__cacheIndex,r=--this._nActiveControlInterpolants,s=e[r];t.__cacheIndex=r,e[r]=t,s.__cacheIndex=n,e[n]=s}clipAction(t,e,n){const r=e||this._root,s=r.uuid;let a=typeof t=="string"?as.findByName(r,t):t;const o=a!==null?a.uuid:t,c=this._actionsByClip[o];let l=null;if(n===void 0&&(a!==null?n=a.blendMode:n=2500),c!==void 0){const f=c.actionByRoot[s];if(f!==void 0&&f.blendMode===n)return f;l=c.knownActions[0],a===null&&(a=l._clip)}if(a===null)return null;const d=new Va(this,a,e,n);return this._bindAction(d,l),this._addInactiveAction(d,o,s),d}existingAction(t,e){const n=e||this._root,r=n.uuid,s=typeof t=="string"?as.findByName(n,t):t,a=s?s.uuid:t,o=this._actionsByClip[a];return o!==void 0&&o.actionByRoot[r]||null}stopAllAction(){const t=this._actions,e=this._nActiveActions;for(let n=e-1;n>=0;--n)t[n].stop();return this}update(t){t*=this.timeScale;const e=this._actions,n=this._nActiveActions,r=this.time+=t,s=Math.sign(t),a=this._accuIndex^=1;for(let l=0;l!==n;++l)e[l]._update(r,t,s,a);const o=this._bindings,c=this._nActiveBindings;for(let l=0;l!==c;++l)o[l].apply(a);return this}setTime(t){this.time=0;for(let e=0;e<this._actions.length;e++)this._actions[e].time=0;return this.update(t)}getRoot(){return this._root}uncacheClip(t){const e=this._actions,n=t.uuid,r=this._actionsByClip,s=r[n];if(s!==void 0){const a=s.knownActions;for(let o=0,c=a.length;o!==c;++o){const l=a[o];this._deactivateAction(l);const d=l._cacheIndex,f=e[e.length-1];l._cacheIndex=null,l._byClipCacheIndex=null,f._cacheIndex=d,e[d]=f,e.pop(),this._removeInactiveBindingsForAction(l)}delete r[n]}}uncacheRoot(t){const e=t.uuid,n=this._actionsByClip;for(const a in n){const o=n[a].actionByRoot,c=o[e];c!==void 0&&(this._deactivateAction(c),this._removeInactiveAction(c))}const r=this._bindingsByRootAndName,s=r[e];if(s!==void 0)for(const a in s){const o=s[a];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(t,e){const n=this.existingAction(t,e);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}};h(Vl,"AnimationMixer");let wh=Vl;const kl=class kl2 extends Yr{constructor(t,e,n=1){super(t,e),this.isInstancedInterleavedBuffer=true,this.meshPerAttribute=n}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}clone(t){const e=super.clone(t);return e.meshPerAttribute=this.meshPerAttribute,e}toJSON(t){const e=super.toJSON(t);return e.isInstancedInterleavedBuffer=true,e.meshPerAttribute=this.meshPerAttribute,e}};h(kl,"InstancedInterleavedBuffer");let Ch=kl;const Ph=new Gt,Hl=class Hl2{constructor(t,e,n=0,r=1/0){this.ray=new On(t,e),this.near=n,this.far=r,this.camera=null,this.layers=new Xi,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Pt("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Ph.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ph),this}intersectObject(t,e=true,n=[]){return ka(t,this,n,e),n.sort(Dh),n}intersectObjects(t,e=true,n=[]){for(let r=0,s=t.length;r<s;r++)ka(t[r],this,n,e);return n.sort(Dh),n}};h(Hl,"Raycaster");let Ih=Hl;function Dh(i,t){return i.distance-t.distance}h(Dh,"ascSort");function ka(i,t,e,n){let r=true;if(i.layers.test(t.layers)&&i.raycast(t,e)===false&&(r=false),r===true&&n===true){const s=i.children;for(let a=0,o=s.length;a<o;a++)ka(s[a],t,e,true)}}h(ka,"intersect");const As=class As2{constructor(t,e,n,r){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,r){const s=this.elements;return s[0]=t,s[2]=e,s[1]=n,s[3]=r,this}};h(As,"Matrix2"),As.prototype.isMatrix2=true;let Lh=As;const Nh=new D,Br=new D,ci=new D,hi=new D,ia=new D,ef=new D,nf=new D,Wl=class Wl2{constructor(t=new D,e=new D){this.start=t,this.end=e}set(t,e){return this.start.copy(t),this.end.copy(e),this}copy(t){return this.start.copy(t.start),this.end.copy(t.end),this}getCenter(t){return t.addVectors(this.start,this.end).multiplyScalar(.5)}delta(t){return t.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(t,e){return this.delta(e).multiplyScalar(t).add(this.start)}closestPointToPointParameter(t,e){Nh.subVectors(t,this.start),Br.subVectors(this.end,this.start);const n=Br.dot(Br);if(n===0)return 0;let s=Br.dot(Nh)/n;return e&&(s=Nt(s,0,1)),s}closestPointToPoint(t,e,n){const r=this.closestPointToPointParameter(t,e);return this.delta(n).multiplyScalar(r).add(this.start)}distanceSqToLine3(t,e=ef,n=nf){const r=10000000000000001e-32;let s,a;const o=this.start,c=t.start,l=this.end,d=t.end;ci.subVectors(l,o),hi.subVectors(d,c),ia.subVectors(o,c);const f=ci.dot(ci),u=hi.dot(hi),m=hi.dot(ia);if(f<=r&&u<=r)return e.copy(o),n.copy(c),e.sub(n),e.dot(e);if(f<=r)s=0,a=m/u,a=Nt(a,0,1);else{const _=ci.dot(ia);if(u<=r)a=0,s=Nt(-_/f,0,1);else{const y=ci.dot(hi),g=f*u-y*y;g!==0?s=Nt((y*m-_*u)/g,0,1):s=0,a=(y*s+m)/u,a<0?(a=0,s=Nt(-_/f,0,1)):a>1&&(a=1,s=Nt((y-_)/f,0,1))}}return e.copy(o).addScaledVector(ci,s),n.copy(c).addScaledVector(hi,a),e.distanceToSquared(n)}applyMatrix4(t){return this.start.applyMatrix4(t),this.end.applyMatrix4(t),this}equals(t){return t.start.equals(this.start)&&t.end.equals(this.end)}clone(){return new this.constructor().copy(this)}};h(Wl,"Line3");let Uh=Wl;function Fh(i,t,e,n){const r=rf(n);switch(e){case 1021:return i*t;case 1028:return i*t/r.components*r.byteLength;case 1029:return i*t/r.components*r.byteLength;case 1030:return i*t*2/r.components*r.byteLength;case 1031:return i*t*2/r.components*r.byteLength;case 1022:return i*t*3/r.components*r.byteLength;case 1023:return i*t*4/r.components*r.byteLength;case 1033:return i*t*4/r.components*r.byteLength;case 33776:case 33777:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case 33778:case 33779:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case 35841:case 35843:return Math.max(i,16)*Math.max(t,8)/4;case 35840:case 35842:return Math.max(i,8)*Math.max(t,8)/2;case 36196:case 37492:case 37488:case 37489:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case 37496:case 37490:case 37491:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case 37808:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case 37809:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case 37810:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case 37811:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case 37812:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case 37813:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case 37814:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case 37815:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case 37816:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case 37817:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case 37818:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case 37819:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case 37820:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case 37821:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(i/4)*Math.ceil(t/4)*16;case 36283:case 36284:return Math.ceil(i/4)*Math.ceil(t/4)*8;case 36285:case 36286:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}h(Fh,"getByteLength");function rf(i){switch(i){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}h(rf,"getTextureTypeByteLength");typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Qa}}));typeof window<"u"&&(window.__THREE__?Tt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Qa);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function pu(){let i=null,t=false,e=null,n=null;function r(s,a){n=i.requestAnimationFrame(r),e(s,a)}return h(r,"onAnimationFrame"),{start:h(function(){t!==true&&e!==null&&i!==null&&(n=i.requestAnimationFrame(r),t=true)},"start"),stop:h(function(){i!==null&&i.cancelAnimationFrame(n),t=false},"stop"),setAnimationLoop:h(function(s){e=s},"setAnimationLoop"),setContext:h(function(s){i=s},"setContext")}}h(pu,"WebGLAnimation");function sf(i){const t=new WeakMap;function e(o,c){const l=o.array,d=o.usage,f=l.byteLength,u=i.createBuffer();i.bindBuffer(c,u),i.bufferData(c,l,d),o.onUploadCallback();let m;if(l instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)m=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)m=i.SHORT;else if(l instanceof Uint32Array)m=i.UNSIGNED_INT;else if(l instanceof Int32Array)m=i.INT;else if(l instanceof Int8Array)m=i.BYTE;else if(l instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:m,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:f}}h(e,"createBuffer");function n(o,c,l){const d=c.array,f=c.updateRanges;if(i.bindBuffer(l,o),f.length===0)i.bufferSubData(l,0,d);else{f.sort((m,_)=>m.start-_.start);let u=0;for(let m=1;m<f.length;m++){const _=f[u],y=f[m];y.start<=_.start+_.count+1?_.count=Math.max(_.count,y.start+y.count-_.start):(++u,f[u]=y)}f.length=u+1;for(let m=0,_=f.length;m<_;m++){const y=f[m];i.bufferSubData(l,y.start*d.BYTES_PER_ELEMENT,d,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}h(n,"updateBuffer");function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}h(r,"get");function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=t.get(o);c&&(i.deleteBuffer(c.buffer),t.delete(o))}h(s,"remove");function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const d=t.get(o);(!d||d.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=t.get(o);if(l===void 0)t.set(o,e(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return h(a,"update"),{get:r,remove:s,update:a}}h(sf,"WebGLAttributes");var af=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,of=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,lf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,cf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,uf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,df=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ff=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,pf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,mf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,gf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,_f=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,xf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,vf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Sf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Mf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,yf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Ef=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,bf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Tf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Af=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Rf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,wf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Cf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Pf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,If=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Df=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Lf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Nf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Uf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ff="gl_FragColor = linearToOutputTexel( gl_FragColor );",Bf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Of=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,zf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Gf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Vf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,kf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Hf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Wf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Xf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,qf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Yf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Zf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,$f=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Kf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Jf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Qf=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,jf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,tp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ep=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,np=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ip=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,rp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,sp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,ap=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,op=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lp=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,cp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,hp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,up=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,dp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,fp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,pp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,mp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,gp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_p=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,xp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,vp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Sp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Mp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,yp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Ep=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,bp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Tp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Ap=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Rp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,wp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Cp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Pp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ip=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Dp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Lp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Np=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Up=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Fp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Bp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Op=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,zp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Gp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Vp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,kp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Hp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Wp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Xp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,qp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Yp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Zp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,$p=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Kp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Jp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Qp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,jp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,tm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,em=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,nm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,im=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,rm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,sm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const am=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,om=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,lm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,um=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,dm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,fm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,pm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,mm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,gm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,_m=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,vm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Sm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Mm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ym=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Em=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Tm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Am=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Rm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,wm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Cm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Pm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Im=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Dm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Lm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Nm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Um=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Fm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Om=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,zm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ot={alphahash_fragment:af,alphahash_pars_fragment:of,alphamap_fragment:lf,alphamap_pars_fragment:cf,alphatest_fragment:hf,alphatest_pars_fragment:uf,aomap_fragment:df,aomap_pars_fragment:ff,batching_pars_vertex:pf,batching_vertex:mf,begin_vertex:gf,beginnormal_vertex:_f,bsdfs:xf,iridescence_fragment:vf,bumpmap_pars_fragment:Sf,clipping_planes_fragment:Mf,clipping_planes_pars_fragment:yf,clipping_planes_pars_vertex:Ef,clipping_planes_vertex:bf,color_fragment:Tf,color_pars_fragment:Af,color_pars_vertex:Rf,color_vertex:wf,common:Cf,cube_uv_reflection_fragment:Pf,defaultnormal_vertex:If,displacementmap_pars_vertex:Df,displacementmap_vertex:Lf,emissivemap_fragment:Nf,emissivemap_pars_fragment:Uf,colorspace_fragment:Ff,colorspace_pars_fragment:Bf,envmap_fragment:Of,envmap_common_pars_fragment:zf,envmap_pars_fragment:Gf,envmap_pars_vertex:Vf,envmap_physical_pars_fragment:Qf,envmap_vertex:kf,fog_vertex:Hf,fog_pars_vertex:Wf,fog_fragment:Xf,fog_pars_fragment:qf,gradientmap_pars_fragment:Yf,lightmap_pars_fragment:Zf,lights_lambert_fragment:$f,lights_lambert_pars_fragment:Kf,lights_pars_begin:Jf,lights_toon_fragment:jf,lights_toon_pars_fragment:tp,lights_phong_fragment:ep,lights_phong_pars_fragment:np,lights_physical_fragment:ip,lights_physical_pars_fragment:rp,lights_fragment_begin:sp,lights_fragment_maps:ap,lights_fragment_end:op,lightprobes_pars_fragment:lp,logdepthbuf_fragment:cp,logdepthbuf_pars_fragment:hp,logdepthbuf_pars_vertex:up,logdepthbuf_vertex:dp,map_fragment:fp,map_pars_fragment:pp,map_particle_fragment:mp,map_particle_pars_fragment:gp,metalnessmap_fragment:_p,metalnessmap_pars_fragment:xp,morphinstance_vertex:vp,morphcolor_vertex:Sp,morphnormal_vertex:Mp,morphtarget_pars_vertex:yp,morphtarget_vertex:Ep,normal_fragment_begin:bp,normal_fragment_maps:Tp,normal_pars_fragment:Ap,normal_pars_vertex:Rp,normal_vertex:wp,normalmap_pars_fragment:Cp,clearcoat_normal_fragment_begin:Pp,clearcoat_normal_fragment_maps:Ip,clearcoat_pars_fragment:Dp,iridescence_pars_fragment:Lp,opaque_fragment:Np,packing:Up,premultiplied_alpha_fragment:Fp,project_vertex:Bp,dithering_fragment:Op,dithering_pars_fragment:zp,roughnessmap_fragment:Gp,roughnessmap_pars_fragment:Vp,shadowmap_pars_fragment:kp,shadowmap_pars_vertex:Hp,shadowmap_vertex:Wp,shadowmask_pars_fragment:Xp,skinbase_vertex:qp,skinning_pars_vertex:Yp,skinning_vertex:Zp,skinnormal_vertex:$p,specularmap_fragment:Kp,specularmap_pars_fragment:Jp,tonemapping_fragment:Qp,tonemapping_pars_fragment:jp,transmission_fragment:tm,transmission_pars_fragment:em,uv_pars_fragment:nm,uv_pars_vertex:im,uv_vertex:rm,worldpos_vertex:sm,background_vert:am,background_frag:om,backgroundCube_vert:lm,backgroundCube_frag:cm,cube_vert:hm,cube_frag:um,depth_vert:dm,depth_frag:fm,distance_vert:pm,distance_frag:mm,equirect_vert:gm,equirect_frag:_m,linedashed_vert:xm,linedashed_frag:vm,meshbasic_vert:Sm,meshbasic_frag:Mm,meshlambert_vert:ym,meshlambert_frag:Em,meshmatcap_vert:bm,meshmatcap_frag:Tm,meshnormal_vert:Am,meshnormal_frag:Rm,meshphong_vert:wm,meshphong_frag:Cm,meshphysical_vert:Pm,meshphysical_frag:Im,meshtoon_vert:Dm,meshtoon_frag:Lm,points_vert:Nm,points_frag:Um,shadow_vert:Fm,shadow_frag:Bm,sprite_vert:Om,sprite_frag:zm},ut={common:{diffuse:{value:new Ft(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Lt},alphaMap:{value:null},alphaMapTransform:{value:new Lt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Lt}},envmap:{envMap:{value:null},envMapRotation:{value:new Lt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Lt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Lt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Lt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Lt},normalScale:{value:new It(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Lt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Lt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Lt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Lt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ft(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new D},probesMax:{value:new D},probesResolution:{value:new D}},points:{diffuse:{value:new Ft(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Lt},alphaTest:{value:0},uvTransform:{value:new Lt}},sprite:{diffuse:{value:new Ft(16777215)},opacity:{value:1},center:{value:new It(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Lt},alphaMap:{value:null},alphaMapTransform:{value:new Lt},alphaTest:{value:0}}},rn={basic:{uniforms:Pe([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.fog]),vertexShader:Ot.meshbasic_vert,fragmentShader:Ot.meshbasic_frag},lambert:{uniforms:Pe([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Ft(0)},envMapIntensity:{value:1}}]),vertexShader:Ot.meshlambert_vert,fragmentShader:Ot.meshlambert_frag},phong:{uniforms:Pe([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Ft(0)},specular:{value:new Ft(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ot.meshphong_vert,fragmentShader:Ot.meshphong_frag},standard:{uniforms:Pe([ut.common,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.roughnessmap,ut.metalnessmap,ut.fog,ut.lights,{emissive:{value:new Ft(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag},toon:{uniforms:Pe([ut.common,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.gradientmap,ut.fog,ut.lights,{emissive:{value:new Ft(0)}}]),vertexShader:Ot.meshtoon_vert,fragmentShader:Ot.meshtoon_frag},matcap:{uniforms:Pe([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,{matcap:{value:null}}]),vertexShader:Ot.meshmatcap_vert,fragmentShader:Ot.meshmatcap_frag},points:{uniforms:Pe([ut.points,ut.fog]),vertexShader:Ot.points_vert,fragmentShader:Ot.points_frag},dashed:{uniforms:Pe([ut.common,ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ot.linedashed_vert,fragmentShader:Ot.linedashed_frag},depth:{uniforms:Pe([ut.common,ut.displacementmap]),vertexShader:Ot.depth_vert,fragmentShader:Ot.depth_frag},normal:{uniforms:Pe([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,{opacity:{value:1}}]),vertexShader:Ot.meshnormal_vert,fragmentShader:Ot.meshnormal_frag},sprite:{uniforms:Pe([ut.sprite,ut.fog]),vertexShader:Ot.sprite_vert,fragmentShader:Ot.sprite_frag},background:{uniforms:{uvTransform:{value:new Lt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ot.background_vert,fragmentShader:Ot.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Lt}},vertexShader:Ot.backgroundCube_vert,fragmentShader:Ot.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ot.cube_vert,fragmentShader:Ot.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ot.equirect_vert,fragmentShader:Ot.equirect_frag},distance:{uniforms:Pe([ut.common,ut.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ot.distance_vert,fragmentShader:Ot.distance_frag},shadow:{uniforms:Pe([ut.lights,ut.fog,{color:{value:new Ft(0)},opacity:{value:1}}]),vertexShader:Ot.shadow_vert,fragmentShader:Ot.shadow_frag}};rn.physical={uniforms:Pe([rn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Lt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Lt},clearcoatNormalScale:{value:new It(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Lt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Lt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Lt},sheen:{value:0},sheenColor:{value:new Ft(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Lt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Lt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Lt},transmissionSamplerSize:{value:new It},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Lt},attenuationDistance:{value:0},attenuationColor:{value:new Ft(0)},specularColor:{value:new Ft(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Lt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Lt},anisotropyVector:{value:new It},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Lt}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag};const Or={r:0,b:0,g:0},Gm=new Gt,mu=new Lt;mu.set(-1,0,0,0,1,0,0,0,1);function Vm(i,t,e,n,r,s){const a=new Ft(0);let o=r===true?0:1,c,l,d=null,f=0,u=null;function m(E){let R=E.isScene===true?E.background:null;if(R&&R.isTexture){const S=E.backgroundBlurriness>0;R=t.get(R,S)}return R}h(m,"getBackground");function _(E){let R=false;const S=m(E);S===null?g(a,o):S&&S.isColor&&(g(S,1),R=true);const T=i.xr.getEnvironmentBlendMode();T==="additive"?e.buffers.color.setClear(0,0,0,1,s):T==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,s),(i.autoClear||R)&&(e.buffers.depth.setTest(true),e.buffers.depth.setMask(true),e.buffers.color.setMask(true),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}h(_,"render");function y(E,R){const S=m(R);S&&(S.isCubeTexture||S.mapping===306)?(l===void 0&&(l=new Ne(new Zi(1,1,1),new We({name:"BackgroundCubeMaterial",uniforms:yi(rn.backgroundCube.uniforms),vertexShader:rn.backgroundCube.vertexShader,fragmentShader:rn.backgroundCube.fragmentShader,side:1,depthTest:false,depthWrite:false,fog:false,allowOverride:false})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(T,b,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:h(function(){return this.uniforms.envMap.value},"get")}),n.update(l)),l.material.uniforms.envMap.value=S,l.material.uniforms.backgroundBlurriness.value=R.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Gm.makeRotationFromEuler(R.backgroundRotation)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===false&&l.material.uniforms.backgroundRotation.value.premultiply(mu),l.material.toneMapped=Wt.getTransfer(S.colorSpace)!==Qt,(d!==S||f!==S.version||u!==i.toneMapping)&&(l.material.needsUpdate=true,d=S,f=S.version,u=i.toneMapping),l.layers.enableAll(),E.unshift(l,l.geometry,l.material,0,0,null)):S&&S.isTexture&&(c===void 0&&(c=new Ne(new ns(2,2),new We({name:"BackgroundMaterial",uniforms:yi(rn.background.uniforms),vertexShader:rn.background.vertexShader,fragmentShader:rn.background.fragmentShader,side:0,depthTest:false,depthWrite:false,fog:false,allowOverride:false})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:h(function(){return this.uniforms.t2D.value},"get")}),n.update(c)),c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,c.material.toneMapped=Wt.getTransfer(S.colorSpace)!==Qt,S.matrixAutoUpdate===true&&S.updateMatrix(),c.material.uniforms.uvTransform.value.copy(S.matrix),(d!==S||f!==S.version||u!==i.toneMapping)&&(c.material.needsUpdate=true,d=S,f=S.version,u=i.toneMapping),c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null))}h(y,"addToRenderList");function g(E,R){E.getRGB(Or,du(i)),e.buffers.color.setClear(Or.r,Or.g,Or.b,R,s)}h(g,"setClear");function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return h(p,"dispose"),{getClearColor:h(function(){return a},"getClearColor"),setClearColor:h(function(E,R=1){a.set(E),o=R,g(a,o)},"setClearColor"),getClearAlpha:h(function(){return o},"getClearAlpha"),setClearAlpha:h(function(E){o=E,g(a,o)},"setClearAlpha"),render:_,addToRenderList:y,dispose:p}}h(Vm,"WebGLBackground");function km(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=u(null);let s=r,a=false;function o(F,B,k,N,H){let $=false;const K=f(F,N,k,B);s!==K&&(s=K,l(s.object)),$=m(F,N,k,H),$&&_(F,N,k,H),H!==null&&t.update(H,i.ELEMENT_ARRAY_BUFFER),($||a)&&(a=false,S(F,B,k,N),H!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(H).buffer))}h(o,"setup");function c(){return i.createVertexArray()}h(c,"createVertexArrayObject");function l(F){return i.bindVertexArray(F)}h(l,"bindVertexArrayObject");function d(F){return i.deleteVertexArray(F)}h(d,"deleteVertexArrayObject");function f(F,B,k,N){const H=N.wireframe===true;let $=n[B.id];$===void 0&&($={},n[B.id]=$);const K=F.isInstancedMesh===true?F.id:0;let it=$[K];it===void 0&&(it={},$[K]=it);let q=it[k.id];q===void 0&&(q={},it[k.id]=q);let tt=q[H];return tt===void 0&&(tt=u(c()),q[H]=tt),tt}h(f,"getBindingState");function u(F){const B=[],k=[],N=[];for(let H=0;H<e;H++)B[H]=0,k[H]=0,N[H]=0;return{geometry:null,program:null,wireframe:false,newAttributes:B,enabledAttributes:k,attributeDivisors:N,object:F,attributes:{},index:null}}h(u,"createBindingState");function m(F,B,k,N){const H=s.attributes,$=B.attributes;let K=0;const it=k.getAttributes();for(const q in it)if(it[q].location>=0){const nt=H[q];let wt=$[q];if(wt===void 0&&(q==="instanceMatrix"&&F.instanceMatrix&&(wt=F.instanceMatrix),q==="instanceColor"&&F.instanceColor&&(wt=F.instanceColor)),nt===void 0||nt.attribute!==wt||wt&&nt.data!==wt.data)return true;K++}return s.attributesNum!==K||s.index!==N}h(m,"needsUpdate");function _(F,B,k,N){const H={},$=B.attributes;let K=0;const it=k.getAttributes();for(const q in it)if(it[q].location>=0){let nt=$[q];nt===void 0&&(q==="instanceMatrix"&&F.instanceMatrix&&(nt=F.instanceMatrix),q==="instanceColor"&&F.instanceColor&&(nt=F.instanceColor));const wt={};wt.attribute=nt,nt&&nt.data&&(wt.data=nt.data),H[q]=wt,K++}s.attributes=H,s.attributesNum=K,s.index=N}h(_,"saveCache");function y(){const F=s.newAttributes;for(let B=0,k=F.length;B<k;B++)F[B]=0}h(y,"initAttributes");function g(F){p(F,0)}h(g,"enableAttribute");function p(F,B){const k=s.newAttributes,N=s.enabledAttributes,H=s.attributeDivisors;k[F]=1,N[F]===0&&(i.enableVertexAttribArray(F),N[F]=1),H[F]!==B&&(i.vertexAttribDivisor(F,B),H[F]=B)}h(p,"enableAttributeAndDivisor");function E(){const F=s.newAttributes,B=s.enabledAttributes;for(let k=0,N=B.length;k<N;k++)B[k]!==F[k]&&(i.disableVertexAttribArray(k),B[k]=0)}h(E,"disableUnusedAttributes");function R(F,B,k,N,H,$,K){K===true?i.vertexAttribIPointer(F,B,k,H,$):i.vertexAttribPointer(F,B,k,N,H,$)}h(R,"vertexAttribPointer");function S(F,B,k,N){y();const H=N.attributes,$=k.getAttributes(),K=B.defaultAttributeValues;for(const it in $){const q=$[it];if(q.location>=0){let tt=H[it];if(tt===void 0&&(it==="instanceMatrix"&&F.instanceMatrix&&(tt=F.instanceMatrix),it==="instanceColor"&&F.instanceColor&&(tt=F.instanceColor)),tt!==void 0){const nt=tt.normalized,wt=tt.itemSize,At=t.get(tt);if(At===void 0)continue;const re=At.buffer,Xt=At.type,Zt=At.bytesPerElement,Y=Xt===i.INT||Xt===i.UNSIGNED_INT||tt.gpuType===1013;if(tt.isInterleavedBufferAttribute){const j=tt.data,xt=j.stride,Dt=tt.offset;if(j.isInstancedInterleavedBuffer){for(let gt=0;gt<q.locationSize;gt++)p(q.location+gt,j.meshPerAttribute);F.isInstancedMesh!==true&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let gt=0;gt<q.locationSize;gt++)g(q.location+gt);i.bindBuffer(i.ARRAY_BUFFER,re);for(let gt=0;gt<q.locationSize;gt++)R(q.location+gt,wt/q.locationSize,Xt,nt,xt*Zt,(Dt+wt/q.locationSize*gt)*Zt,Y)}else{if(tt.isInstancedBufferAttribute){for(let j=0;j<q.locationSize;j++)p(q.location+j,tt.meshPerAttribute);F.isInstancedMesh!==true&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=tt.meshPerAttribute*tt.count)}else for(let j=0;j<q.locationSize;j++)g(q.location+j);i.bindBuffer(i.ARRAY_BUFFER,re);for(let j=0;j<q.locationSize;j++)R(q.location+j,wt/q.locationSize,Xt,nt,wt*Zt,wt/q.locationSize*j*Zt,Y)}}else if(K!==void 0){const nt=K[it];if(nt!==void 0)switch(nt.length){case 2:i.vertexAttrib2fv(q.location,nt);break;case 3:i.vertexAttrib3fv(q.location,nt);break;case 4:i.vertexAttrib4fv(q.location,nt);break;default:i.vertexAttrib1fv(q.location,nt)}}}}E()}h(S,"setupVertexAttributes");function T(){A();for(const F in n){const B=n[F];for(const k in B){const N=B[k];for(const H in N){const $=N[H];for(const K in $)d($[K].object),delete $[K];delete N[H]}}delete n[F]}}h(T,"dispose");function b(F){if(n[F.id]===void 0)return;const B=n[F.id];for(const k in B){const N=B[k];for(const H in N){const $=N[H];for(const K in $)d($[K].object),delete $[K];delete N[H]}}delete n[F.id]}h(b,"releaseStatesOfGeometry");function C(F){for(const B in n){const k=n[B];for(const N in k){const H=k[N];if(H[F.id]===void 0)continue;const $=H[F.id];for(const K in $)d($[K].object),delete $[K];delete H[F.id]}}}h(C,"releaseStatesOfProgram");function v(F){for(const B in n){const k=n[B],N=F.isInstancedMesh===true?F.id:0,H=k[N];if(H!==void 0){for(const $ in H){const K=H[$];for(const it in K)d(K[it].object),delete K[it];delete H[$]}delete k[N],Object.keys(k).length===0&&delete n[B]}}}h(v,"releaseStatesOfObject");function A(){P(),a=true,s!==r&&(s=r,l(s.object))}h(A,"reset");function P(){r.geometry=null,r.program=null,r.wireframe=false}return h(P,"resetDefaultState"),{setup:o,reset:A,resetDefaultState:P,dispose:T,releaseStatesOfGeometry:b,releaseStatesOfObject:v,releaseStatesOfProgram:C,initAttributes:y,enableAttribute:g,disableUnusedAttributes:E}}h(km,"WebGLBindingStates");function Hm(i,t,e){let n;function r(c){n=c}h(r,"setMode");function s(c,l){i.drawArrays(n,c,l),e.update(l,n,1)}h(s,"render");function a(c,l,d){d!==0&&(i.drawArraysInstanced(n,c,l,d),e.update(l,n,d))}h(a,"renderInstances");function o(c,l,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,d);let u=0;for(let m=0;m<d;m++)u+=l[m];e.update(u,n,1)}h(o,"renderMultiDraw"),this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}h(Hm,"WebGLBufferRenderer");function Wm(i,t,e,n){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===true){const C=t.get("EXT_texture_filter_anisotropic");r=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}h(s,"getMaxAnisotropy");function a(C){return!(C!==1023&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}h(a,"textureFormatReadable");function o(C){const v=C===1016&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(C!==1009&&C!==1015&&!v&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}h(o,"textureTypeReadable");function c(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}h(c,"getMaxPrecision");let l=e.precision!==void 0?e.precision:"highp";const d=c(l);d!==l&&(Tt("WebGLRenderer:",l,"not supported, using",d,"instead."),l=d);const f=e.logarithmicDepthBuffer===true,u=e.reversedDepthBuffer===true&&t.has("EXT_clip_control");e.reversedDepthBuffer===true&&u===false&&Tt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),E=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),R=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),T=i.getParameter(i.MAX_SAMPLES),b=i.getParameter(i.SAMPLES);return{isWebGL2:true,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:m,maxVertexTextures:_,maxTextureSize:y,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:E,maxVaryings:R,maxFragmentUniforms:S,maxSamples:T,samples:b}}h(Wm,"WebGLCapabilities");function Xm(i){const t=this;let e=null,n=0,r=false,s=false;const a=new nn,o=new Lt,c={value:null,needsUpdate:false};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const m=f.length!==0||u||n!==0||r;return r=u,n=f.length,m},this.beginShadows=function(){s=true,d(null)},this.endShadows=function(){s=false},this.setGlobalState=function(f,u){e=d(f,u,0)},this.setState=function(f,u,m){const _=f.clippingPlanes,y=f.clipIntersection,g=f.clipShadows,p=i.get(f);if(!r||_===null||_.length===0||s&&!g)s?d(null):l();else{const E=s?0:n,R=E*4;let S=p.clippingState||null;c.value=S,S=d(_,u,R,m);for(let T=0;T!==R;++T)S[T]=e[T];p.clippingState=S,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=E}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}h(l,"resetGlobalState");function d(f,u,m,_){const y=f!==null?f.length:0;let g=null;if(y!==0){if(g=c.value,_!==true||g===null){const p=m+y*4,E=u.matrixWorldInverse;o.getNormalMatrix(E),(g===null||g.length<p)&&(g=new Float32Array(p));for(let R=0,S=m;R!==y;++R,S+=4)a.copy(f[R]).applyMatrix4(E,o),a.normal.toArray(g,S),g[S+3]=a.constant}c.value=g,c.needsUpdate=true}return t.numPlanes=y,t.numIntersection=0,g}h(d,"projectPlanes")}h(Xm,"WebGLClipping");const fi=4,qm=6,Ym=20,Zm=256,Fi=new er,Bh=new Ft;let ra=null,sa=0,aa=0,oa=false;const $m=new D,Bn=new D,Xl=class Xl2{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,r=100,s={}){const{size:a=256,position:o=$m}=s;ra=this._renderer.getRenderTarget(),sa=this._renderer.getActiveCubeFace(),aa=this._renderer.getActiveMipmapLevel(),oa=this._renderer.xr.enabled,this._renderer.xr.enabled=false,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=true,this._sceneToCubeUV(t,n,r,c,o),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Gh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=zh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(ra,sa,aa),this._renderer.xr.enabled=oa,t.scissorTest=false,ui(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===301||t.mapping===302?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),ra=this._renderer.getRenderTarget(),sa=this._renderer.getActiveCubeFace(),aa=this._renderer.getActiveMipmapLevel(),oa=this._renderer.xr.enabled,this._renderer.xr.enabled=false;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:1006,minFilter:1006,generateMipmaps:false,type:1016,format:1023,colorSpace:Vr,depthBuffer:false},r=Oh(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Oh(t,e,n);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Km(s)),this._blurMaterial=Qm(s,t,e),this._ggxMaterial=Jm(s,t,e)}return r}_compileMaterial(t){const e=new Ne(new ve,t);this._renderer.compile(e,Fi)}_sceneToCubeUV(t,e,n,r,s){const c=new Ie(90,1,e,n),l=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,m=f.toneMapping;f.getClearColor(Bh),f.toneMapping=0,f.autoClear=false,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(r),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ne(new Zi,new $r({name:"PMREM.Background",side:1,depthWrite:false,depthTest:false})));const y=this._backgroundBox,g=y.material;let p=false;const E=t.background;E?E.isColor&&(g.color.copy(E),t.background=null,p=true):(g.color.copy(Bh),p=true);for(let R=0;R<6;R++){const S=R%3;S===0?(c.up.set(0,l[R],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+d[R],s.y,s.z)):S===1?(c.up.set(0,0,l[R]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+d[R],s.z)):(c.up.set(0,l[R],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+d[R]));const T=this._cubeSize;ui(r,S*T,R>2?T:0,T,T),f.setRenderTarget(r),p&&f.render(y,c),f.render(t,c)}f.toneMapping=m,f.autoClear=u,t.background=E}_textureToCubeUV(t,e){const n=this._renderer,r=t.mapping===301||t.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Gh()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===false?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=zh());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=t;const c=this._cubeSize;ui(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(a,Fi)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=false;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(t,s-1,s);e.autoClear=n}_applyGGXFilter(t,e,n){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const c=a.uniforms,l=n/(this._lodMeshes.length-1),d=e/(this._lodMeshes.length-1),f=Math.sqrt(l*l-d*d),u=l*1.25,m=f*u,{_lodMax:_}=this,y=this._sizeLods[n],g=3*y*(n>_-fi?n-_+fi:0),p=4*(this._cubeSize-y);c.envMap.value=t.texture,c.roughness.value=m,c.mipInt.value=_-e,ui(s,g,p,3*y,2*y),r.setRenderTarget(s),r.render(o,Fi),c.envMap.value=s.texture,c.roughness.value=0,c.mipInt.value=_-n,ui(t,g,p,3*y,2*y),r.setRenderTarget(t),r.render(o,Fi)}_blur(t,e,n,r){const s=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(t,s,e,n,a),this._blurPass(s,t,n,n,a)}_blurPass(t,e,n,r,s){const a=this._renderer,o=this._blurMaterial,c=this._lodMeshes[r];c.material=o;const l=o.uniforms;l.envMap.value=t.texture,l.sigma.value=s,l.mipInt.value=this._lodMax-n;const d=this._sizeLods[r],f=3*d*(r>this._lodMax-fi?r-this._lodMax+fi:0),u=4*(this._cubeSize-d);ui(e,f,u,3*d,2*d),a.setRenderTarget(e),a.render(c,Fi)}};h(Xl,"PMREMGenerator");let ls=Xl;function Km(i){const t=[],e=[];let n=i;const r=i-fi+1+qm;for(let s=0;s<r;s++){const a=Math.pow(2,n);t.push(a);const o=1/(a-2),c=-o,l=1+o,d=[c,c,l,c,l,l,c,c,l,l,c,l],f=6,u=6,m=3,_=new Float32Array(m*u*f),y=new Float32Array(m*u*f);for(let p=0;p<f;p++){const E=p%3*2/3-1,R=p>2?0:-1,S=[E,R,0,E+2/3,R,0,E+2/3,R+1,0,E,R,0,E+2/3,R+1,0,E,R+1,0];_.set(S,m*u*p);for(let T=0;T<u;T++){const b=d[T*2]*2-1,C=d[T*2+1]*2-1;p===0?Bn.set(1,C,b):p===1?Bn.set(-b,1,-C):p===2?Bn.set(-b,C,1):p===3?Bn.set(-1,C,-b):p===4?Bn.set(-b,-1,C):Bn.set(b,C,-1),Bn.toArray(y,(p*u+T)*m)}}const g=new ve;g.setAttribute("position",new Oe(_,m)),g.setAttribute("outputDirection",new Oe(y,m)),e.push(new Ne(g,null)),n>fi&&n--}return{lodMeshes:e,sizeLods:t}}h(Km,"_createPlanes");function Oh(i,t,e){const n=new Be(i,t,e);return n.texture.mapping=306,n.texture.name="PMREM.cubeUv",n.scissorTest=true,n}h(Oh,"_createRenderTarget");function ui(i,t,e,n,r){i.viewport.set(t,e,n,r),i.scissor.set(t,e,n,r)}h(ui,"_setViewport");function Jm(i,t,e){return new We({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Zm,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Rs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:false,depthWrite:false})}h(Jm,"_getGGXShader");function Qm(i,t,e){return new We({name:"SphericalGaussianBlur",defines:{SAMPLES:Ym,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Rs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:false,depthWrite:false})}h(Qm,"_getBlurShader");function zh(){return new We({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Rs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:false,depthWrite:false})}h(zh,"_getEquirectMaterial");function Gh(){return new We({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Rs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:false,depthWrite:false})}h(Gh,"_getCubemapMaterial");function Rs(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}h(Rs,"_getCommonVertexShader");const ql=class ql2 extends Be{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=true;const n={width:t,height:t,depth:1},r=[n,n,n,n,n,n];this.texture=new ts(r),this._setTextureOptions(e),this.texture.isRenderTargetTexture=true}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Zi(5,5,5),s=new We({name:"CubemapFromEquirect",uniforms:yi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});s.uniforms.tEquirect.value=e;const a=new Ne(r,s),o=e.minFilter;return e.minFilter===1008&&(e.minFilter=1006),new Ba(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=true,n=true,r=true){const s=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,r);t.setRenderTarget(s)}};h(ql,"WebGLCubeRenderTarget");let cs=ql;function jm(i){let t=new WeakMap,e=new WeakMap,n=null;function r(u,m=false){return u==null?null:m?a(u):s(u)}h(r,"get");function s(u){if(u&&u.isTexture){const m=u.mapping;if(m===303||m===304)if(t.has(u)){const _=t.get(u).texture;return o(_,u.mapping)}else{const _=u.image;if(_&&_.height>0){const y=new cs(_.height);return y.fromEquirectangularTexture(i,u),t.set(u,y),u.addEventListener("dispose",l),o(y.texture,u.mapping)}else return null}}return u}h(s,"getCube");function a(u){if(u&&u.isTexture){const m=u.mapping,_=m===303||m===304,y=m===301||m===302;if(_||y){let g=e.get(u);const p=g!==void 0?g.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return n===null&&(n=new ls(i)),g=_?n.fromEquirectangular(u,g):n.fromCubemap(u,g),g.texture.pmremVersion=u.pmremVersion,e.set(u,g),g.texture;if(g!==void 0)return g.texture;{const E=u.image;return _&&E&&E.height>0||y&&E&&c(E)?(n===null&&(n=new ls(i)),g=_?n.fromEquirectangular(u):n.fromCubemap(u),g.texture.pmremVersion=u.pmremVersion,e.set(u,g),u.addEventListener("dispose",d),g.texture):null}}}return u}h(a,"getPMREM");function o(u,m){return m===303?u.mapping=301:m===304&&(u.mapping=302),u}h(o,"mapTextureMapping");function c(u){let m=0;const _=6;for(let y=0;y<_;y++)u[y]!==void 0&&m++;return m===_}h(c,"isCubeTextureComplete");function l(u){const m=u.target;m.removeEventListener("dispose",l);const _=t.get(m);_!==void 0&&(t.delete(m),_.dispose())}h(l,"onCubemapDispose");function d(u){const m=u.target;m.removeEventListener("dispose",d);const _=e.get(m);_!==void 0&&(e.delete(m),_.dispose())}h(d,"onPMREMDispose");function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return h(f,"dispose"),{get:r,dispose:f}}h(jm,"WebGLEnvironments");function tg(i){const t={};function e(n){if(t[n]!==void 0)return t[n];const r=i.getExtension(n);return t[n]=r,r}return h(e,"getExtension"),{has:h(function(n){return e(n)!==null},"has"),init:h(function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},"init"),get:h(function(n){const r=e(n);return r===null&&gi("WebGLRenderer: "+n+" extension not supported."),r},"get")}}h(tg,"WebGLExtensions");function eg(i,t,e,n){const r={},s=new WeakMap;function a(f){const u=f.target;u.index!==null&&t.remove(u.index);for(const _ in u.attributes)t.remove(u.attributes[_]);u.removeEventListener("dispose",a),delete r[u.id];const m=s.get(u);m&&(t.remove(m),s.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===true&&delete u._maxInstanceCount,e.memory.geometries--}h(a,"onGeometryDispose");function o(f,u){return r[u.id]===true||(u.addEventListener("dispose",a),r[u.id]=true,e.memory.geometries++),u}h(o,"get");function c(f){const u=f.attributes;for(const m in u)t.update(u[m],i.ARRAY_BUFFER)}h(c,"update");function l(f){const u=[],m=f.index,_=f.attributes.position;let y=0;if(_===void 0)return;if(m!==null){const E=m.array;y=m.version;for(let R=0,S=E.length;R<S;R+=3){const T=E[R+0],b=E[R+1],C=E[R+2];u.push(T,b,b,C,C,T)}}else{const E=_.array;y=_.version;for(let R=0,S=E.length/3-1;R<S;R+=3){const T=R+0,b=R+1,C=R+2;u.push(T,b,b,C,C,T)}}const g=new(_.count>=65535?qr:Xr)(u,1);g.version=y;const p=s.get(f);p&&t.remove(p),s.set(f,g)}h(l,"updateWireframeAttribute");function d(f){const u=s.get(f);if(u){const m=f.index;m!==null&&u.version<m.version&&l(f)}else l(f);return s.get(f)}return h(d,"getWireframeAttribute"),{get:o,update:c,getWireframeAttribute:d}}h(eg,"WebGLGeometries");function ng(i,t,e){let n;function r(f){n=f}h(r,"setMode");let s,a;function o(f){s=f.type,a=f.bytesPerElement}h(o,"setIndex");function c(f,u){i.drawElements(n,u,s,f*a),e.update(u,n,1)}h(c,"render");function l(f,u,m){m!==0&&(i.drawElementsInstanced(n,u,s,f*a,m),e.update(u,n,m))}h(l,"renderInstances");function d(f,u,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,s,f,0,m);let y=0;for(let g=0;g<m;g++)y+=u[g];e.update(y,n,1)}h(d,"renderMultiDraw"),this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=d}h(ng,"WebGLIndexedBufferRenderer");function ig(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(s/3);break;case i.LINES:e.lines+=o*(s/2);break;case i.LINE_STRIP:e.lines+=o*(s-1);break;case i.LINE_LOOP:e.lines+=o*s;break;case i.POINTS:e.points+=o*s;break;default:Pt("WebGLInfo: Unknown draw mode:",a);break}}h(n,"update");function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return h(r,"reset"),{memory:t,render:e,programs:null,autoReset:true,reset:r,update:n}}h(ig,"WebGLInfo");function rg(i,t,e){const n=new WeakMap,r=new ee;function s(a,o,c){const l=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=d!==void 0?d.length:0;let u=n.get(o);if(u===void 0||u.count!==f){let A=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",A)};h(A,"disposeTexture"),u!==void 0&&u.texture.dispose();const m=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],E=o.morphAttributes.color||[];let R=0;m===true&&(R=1),_===true&&(R=2),y===true&&(R=3);let S=o.attributes.position.count*R,T=1;S>t.maxTextureSize&&(T=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const b=new Float32Array(S*T*4*f),C=new Wr(b,S,T,f);C.type=1015,C.needsUpdate=true;const v=R*4;for(let P=0;P<f;P++){const F=g[P],B=p[P],k=E[P],N=S*T*4*P;for(let H=0;H<F.count;H++){const $=H*v;m===true&&(r.fromBufferAttribute(F,H),b[N+$+0]=r.x,b[N+$+1]=r.y,b[N+$+2]=r.z,b[N+$+3]=0),_===true&&(r.fromBufferAttribute(B,H),b[N+$+4]=r.x,b[N+$+5]=r.y,b[N+$+6]=r.z,b[N+$+7]=0),y===true&&(r.fromBufferAttribute(k,H),b[N+$+8]=r.x,b[N+$+9]=r.y,b[N+$+10]=r.z,b[N+$+11]=k.itemSize===4?r.w:1)}}u={count:f,texture:C,size:new It(S,T)},n.set(o,u),o.addEventListener("dispose",A)}if(a.isInstancedMesh===true&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let m=0;for(let y=0;y<l.length;y++)m+=l[y];const _=o.morphTargetsRelative?1:1-m;c.getUniforms().setValue(i,"morphTargetBaseInfluence",_),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return h(s,"update"),{update:s}}h(rg,"WebGLMorphtargets");function sg(i,t,e,n,r){let s=new WeakMap;function a(l){const d=r.render.frame,f=l.geometry,u=t.get(l,f);if(s.get(u)!==d&&(t.update(u),s.set(u,d)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===false&&l.addEventListener("dispose",c),s.get(l)!==d&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,d))),l.isSkinnedMesh){const m=l.skeleton;s.get(m)!==d&&(m.update(),s.set(m,d))}return u}h(a,"update");function o(){s=new WeakMap}h(o,"dispose");function c(l){const d=l.target;d.removeEventListener("dispose",c),n.releaseStatesOfObject(d),e.remove(d.instanceMatrix),d.instanceColor!==null&&e.remove(d.instanceColor)}return h(c,"onInstancedMeshDispose"),{update:a,dispose:o}}h(sg,"WebGLObjects");const ag={1:"LINEAR_TONE_MAPPING",2:"REINHARD_TONE_MAPPING",3:"CINEON_TONE_MAPPING",4:"ACES_FILMIC_TONE_MAPPING",6:"AGX_TONE_MAPPING",7:"NEUTRAL_TONE_MAPPING",5:"CUSTOM_TONE_MAPPING"};function og(i,t,e,n,r,s){const a=new Be(t,e,{type:i,depthBuffer:r,stencilBuffer:s,samples:n?4:0,storeMultisampledDepthBuffer:false,storeMultisampledStencilBuffer:false,resolveDepthBuffer:false,resolveStencilBuffer:false});let o=null,c=null;const l=new ve;l.setAttribute("position",new ie([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new ie([0,2,0,0,2,0],2));const d=new Ea({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:false,depthWrite:false}),f=new Ne(l,d),u=new er(-1,1,1,-1,0,1);let m=null,_=null,y=false,g,p=null,E=[],R=false;this.setSize=function(S,T){a.setSize(S,T),o!==null&&o.setSize(S,T),c!==null&&c.setSize(S,T);for(let b=0;b<E.length;b++){const C=E[b];C.setSize&&C.setSize(S,T)}},this.setEffects=function(S){E=S,R=E.length>0&&E[0].isRenderPass===true;const T=a.width,b=a.height;E.length>0&&o===null&&(o=new Be(T,b,{type:1016,depthBuffer:false,stencilBuffer:false}),c=new Be(T,b,{type:1016,depthBuffer:false,stencilBuffer:false}));for(let C=0;C<E.length;C++){const v=E[C];v.setSize&&v.setSize(T,b)}},this.begin=function(S,T){if(y||S.toneMapping===0&&E.length===0)return false;if(p=T,T!==null){const b=T.width,C=T.height;(a.width!==b||a.height!==C)&&this.setSize(b,C)}return R===false&&S.setRenderTarget(a),g=S.toneMapping,S.toneMapping=0,true},this.hasRenderPass=function(){return R},this.end=function(S,T){S.toneMapping=g,y=true;let b=a,C=o;for(let v=0;v<E.length;v++){const A=E[v];A.enabled!==false&&(A.render(S,C,b,T),A.needsSwap!==false&&(b=C,C=C===o?c:o))}if(m!==S.outputColorSpace||_!==S.toneMapping){m=S.outputColorSpace,_=S.toneMapping,d.defines={},Wt.getTransfer(m)===Qt&&(d.defines.SRGB_TRANSFER="");const v=ag[_];v&&(d.defines[v]=""),d.needsUpdate=true}d.uniforms.tDiffuse.value=b.texture,S.setRenderTarget(p),S.render(f,u),p=null,y=false},this.isCompositing=function(){return y},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),l.dispose(),d.dispose()}}h(og,"WebGLOutput");const gu=new Le,Ha=new zn(1,1),_u=new Wr,xu=new da,vu=new ts,Vh=[],kh=[],Hh=new Float32Array(16),Wh=new Float32Array(9),Xh=new Float32Array(4);function bi(i,t,e){const n=i[0];if(n<=0||n>0)return i;const r=t*e;let s=Vh[r];if(s===void 0&&(s=new Float32Array(r),Vh[r]=s),t!==0){n.toArray(s,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(s,o)}return s}h(bi,"flatten");function Se(i,t){if(i.length!==t.length)return false;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return false;return true}h(Se,"arraysEqual");function Me(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}h(Me,"copyArray");function ws(i,t){let e=kh[t];e===void 0&&(e=new Int32Array(t),kh[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}h(ws,"allocTexUnits");function lg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}h(lg,"setValueV1f");function cg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Se(e,t))return;i.uniform2fv(this.addr,t),Me(e,t)}}h(cg,"setValueV2f");function hg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Se(e,t))return;i.uniform3fv(this.addr,t),Me(e,t)}}h(hg,"setValueV3f");function ug(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Se(e,t))return;i.uniform4fv(this.addr,t),Me(e,t)}}h(ug,"setValueV4f");function dg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Se(e,t))return;i.uniformMatrix2fv(this.addr,false,t),Me(e,t)}else{if(Se(e,n))return;Xh.set(n),i.uniformMatrix2fv(this.addr,false,Xh),Me(e,n)}}h(dg,"setValueM2");function fg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Se(e,t))return;i.uniformMatrix3fv(this.addr,false,t),Me(e,t)}else{if(Se(e,n))return;Wh.set(n),i.uniformMatrix3fv(this.addr,false,Wh),Me(e,n)}}h(fg,"setValueM3");function pg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Se(e,t))return;i.uniformMatrix4fv(this.addr,false,t),Me(e,t)}else{if(Se(e,n))return;Hh.set(n),i.uniformMatrix4fv(this.addr,false,Hh),Me(e,n)}}h(pg,"setValueM4");function mg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}h(mg,"setValueV1i");function gg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Se(e,t))return;i.uniform2iv(this.addr,t),Me(e,t)}}h(gg,"setValueV2i");function _g(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Se(e,t))return;i.uniform3iv(this.addr,t),Me(e,t)}}h(_g,"setValueV3i");function xg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Se(e,t))return;i.uniform4iv(this.addr,t),Me(e,t)}}h(xg,"setValueV4i");function vg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}h(vg,"setValueV1ui");function Sg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Se(e,t))return;i.uniform2uiv(this.addr,t),Me(e,t)}}h(Sg,"setValueV2ui");function Mg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Se(e,t))return;i.uniform3uiv(this.addr,t),Me(e,t)}}h(Mg,"setValueV3ui");function yg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Se(e,t))return;i.uniform4uiv(this.addr,t),Me(e,t)}}h(yg,"setValueV4ui");function Eg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(Ha.compareFunction=e.isReversedDepthBuffer()?518:515,s=Ha):s=gu,e.setTexture2D(t||s,r)}h(Eg,"setValueT1");function bg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture3D(t||xu,r)}h(bg,"setValueT3D1");function Tg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTextureCube(t||vu,r)}h(Tg,"setValueT6");function Ag(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture2DArray(t||_u,r)}h(Ag,"setValueT2DArray1");function Rg(i){switch(i){case 5126:return lg;case 35664:return cg;case 35665:return hg;case 35666:return ug;case 35674:return dg;case 35675:return fg;case 35676:return pg;case 5124:case 35670:return mg;case 35667:case 35671:return gg;case 35668:case 35672:return _g;case 35669:case 35673:return xg;case 5125:return vg;case 36294:return Sg;case 36295:return Mg;case 36296:return yg;case 35678:case 36198:case 36298:case 36306:case 35682:return Eg;case 35679:case 36299:case 36307:return bg;case 35680:case 36300:case 36308:case 36293:return Tg;case 36289:case 36303:case 36311:case 36292:return Ag}}h(Rg,"getSingularSetter");function wg(i,t){i.uniform1fv(this.addr,t)}h(wg,"setValueV1fArray");function Cg(i,t){const e=bi(t,this.size,2);i.uniform2fv(this.addr,e)}h(Cg,"setValueV2fArray");function Pg(i,t){const e=bi(t,this.size,3);i.uniform3fv(this.addr,e)}h(Pg,"setValueV3fArray");function Ig(i,t){const e=bi(t,this.size,4);i.uniform4fv(this.addr,e)}h(Ig,"setValueV4fArray");function Dg(i,t){const e=bi(t,this.size,4);i.uniformMatrix2fv(this.addr,false,e)}h(Dg,"setValueM2Array");function Lg(i,t){const e=bi(t,this.size,9);i.uniformMatrix3fv(this.addr,false,e)}h(Lg,"setValueM3Array");function Ng(i,t){const e=bi(t,this.size,16);i.uniformMatrix4fv(this.addr,false,e)}h(Ng,"setValueM4Array");function Ug(i,t){i.uniform1iv(this.addr,t)}h(Ug,"setValueV1iArray");function Fg(i,t){i.uniform2iv(this.addr,t)}h(Fg,"setValueV2iArray");function Bg(i,t){i.uniform3iv(this.addr,t)}h(Bg,"setValueV3iArray");function Og(i,t){i.uniform4iv(this.addr,t)}h(Og,"setValueV4iArray");function zg(i,t){i.uniform1uiv(this.addr,t)}h(zg,"setValueV1uiArray");function Gg(i,t){i.uniform2uiv(this.addr,t)}h(Gg,"setValueV2uiArray");function Vg(i,t){i.uniform3uiv(this.addr,t)}h(Vg,"setValueV3uiArray");function kg(i,t){i.uniform4uiv(this.addr,t)}h(kg,"setValueV4uiArray");function Hg(i,t,e){const n=this.cache,r=t.length,s=ws(e,r);Se(n,s)||(i.uniform1iv(this.addr,s),Me(n,s));let a;this.type===i.SAMPLER_2D_SHADOW?a=Ha:a=gu;for(let o=0;o!==r;++o)e.setTexture2D(t[o]||a,s[o])}h(Hg,"setValueT1Array");function Wg(i,t,e){const n=this.cache,r=t.length,s=ws(e,r);Se(n,s)||(i.uniform1iv(this.addr,s),Me(n,s));for(let a=0;a!==r;++a)e.setTexture3D(t[a]||xu,s[a])}h(Wg,"setValueT3DArray");function Xg(i,t,e){const n=this.cache,r=t.length,s=ws(e,r);Se(n,s)||(i.uniform1iv(this.addr,s),Me(n,s));for(let a=0;a!==r;++a)e.setTextureCube(t[a]||vu,s[a])}h(Xg,"setValueT6Array");function qg(i,t,e){const n=this.cache,r=t.length,s=ws(e,r);Se(n,s)||(i.uniform1iv(this.addr,s),Me(n,s));for(let a=0;a!==r;++a)e.setTexture2DArray(t[a]||_u,s[a])}h(qg,"setValueT2DArrayArray");function Yg(i){switch(i){case 5126:return wg;case 35664:return Cg;case 35665:return Pg;case 35666:return Ig;case 35674:return Dg;case 35675:return Lg;case 35676:return Ng;case 5124:case 35670:return Ug;case 35667:case 35671:return Fg;case 35668:case 35672:return Bg;case 35669:case 35673:return Og;case 5125:return zg;case 36294:return Gg;case 36295:return Vg;case 36296:return kg;case 35678:case 36198:case 36298:case 36306:case 35682:return Hg;case 35679:case 36299:case 36307:return Wg;case 35680:case 36300:case 36308:case 36293:return Xg;case 36289:case 36303:case 36311:case 36292:return qg}}h(Yg,"getPureArraySetter");const Yl=class Yl2{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Rg(e.type)}};h(Yl,"SingleUniform");let Wa=Yl;const Zl=class Zl2{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Yg(e.type)}};h(Zl,"PureArrayUniform");let Xa=Zl;const $l=class $l2{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(t,e[o.id],n)}}};h($l,"StructuredUniform");let qa=$l;const la=/(\w+)(\])?(\[|\.)?/g;function qh(i,t){i.seq.push(t),i.map[t.id]=t}h(qh,"addUniform");function Zg(i,t,e){const n=i.name,r=n.length;for(la.lastIndex=0;;){const s=la.exec(n),a=la.lastIndex;let o=s[1];const c=s[2]==="]",l=s[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===r){qh(e,l===void 0?new Wa(o,i,t):new Xa(o,i,t));break}else{let f=e.map[o];f===void 0&&(f=new qa(o),qh(e,f)),e=f}}}h(Zg,"parseUniform");const Kl=class Kl2{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=t.getActiveUniform(e,a),c=t.getUniformLocation(e,o.name);Zg(o,c,this)}const r=[],s=[];for(const a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(t,e,n,r){const s=this.map[e];s!==void 0&&s.setValue(t,n,r)}setOptional(t,e,n){const r=e[n];r!==void 0&&this.setValue(t,n,r)}static upload(t,e,n,r){for(let s=0,a=e.length;s!==a;++s){const o=e[s],c=n[o.id];c.needsUpdate!==false&&o.setValue(t,c.value,r)}}static seqWithValue(t,e){const n=[];for(let r=0,s=t.length;r!==s;++r){const a=t[r];a.id in e&&n.push(a)}return n}};h(Kl,"WebGLUniforms");let vi=Kl;function Yh(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}h(Yh,"WebGLShader");const $g=37297;let Kg=0;function Jg(i,t){const e=i.split(`
`),n=[],r=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}h(Jg,"handleSource");const Zh=new Lt;function Qg(i){Wt._getMatrix(Zh,Wt.workingColorSpace,i);const t=`mat3( ${Zh.elements.map(e=>e.toFixed(4))} )`;switch(Wt.getTransfer(i)){case kr:return[t,"LinearTransferOETF"];case Qt:return[t,"sRGBTransferOETF"];default:return Tt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}h(Qg,"getEncodingComponents");function $h(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=(i.getShaderInfoLog(t)||"").trim();if(n&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return e.toUpperCase()+`

`+s+`

`+Jg(i.getShaderSource(t),o)}else return s}h($h,"getShaderErrors");function jg(i,t){const e=Qg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}h(jg,"getTexelEncodingFunction");const t_={1:"Linear",2:"Reinhard",3:"Cineon",4:"ACESFilmic",6:"AgX",7:"Neutral",5:"Custom"};function e_(i,t){const e=t_[t];return e===void 0?(Tt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}h(e_,"getToneMappingFunction");const zr=new D;function n_(){Wt.getLuminanceCoefficients(zr);const i=zr.x.toFixed(4),t=zr.y.toFixed(4),e=zr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}h(n_,"getLuminanceFunction");function i_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(zi).join(`
`)}h(i_,"generateVertexExtensions");function r_(i){const t=[];for(const e in i){const n=i[e];n!==false&&t.push("#define "+e+" "+n)}return t.join(`
`)}h(r_,"generateDefines");function s_(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(t,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),e[a]={type:s.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}h(s_,"fetchAttributeLocations");function zi(i){return i!==""}h(zi,"filterEmptyLine");function Kh(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}h(Kh,"replaceLightNums");function Jh(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}h(Jh,"replaceClippingPlaneNums");const a_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ya(i){return i.replace(a_,l_)}h(Ya,"resolveIncludes");const o_=new Map;function l_(i,t){let e=Ot[t];if(e===void 0){const n=o_.get(t);if(n!==void 0)e=Ot[n],Tt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Ya(e)}h(l_,"includeReplacer");const c_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Qh(i){return i.replace(c_,h_)}h(Qh,"unrollLoops");function h_(i,t,e,n){let r="";for(let s=parseInt(t);s<parseInt(e);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}h(h_,"loopReplacer");function jh(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}h(jh,"generatePrecision");const u_={1:"SHADOWMAP_TYPE_PCF",3:"SHADOWMAP_TYPE_VSM"};function d_(i){return u_[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}h(d_,"generateShadowMapTypeDefine");const f_={301:"ENVMAP_TYPE_CUBE",302:"ENVMAP_TYPE_CUBE",306:"ENVMAP_TYPE_CUBE_UV"};function p_(i){return i.envMap===false?"ENVMAP_TYPE_CUBE":f_[i.envMapMode]||"ENVMAP_TYPE_CUBE"}h(p_,"generateEnvMapTypeDefine");const m_={302:"ENVMAP_MODE_REFRACTION"};function g_(i){return i.envMap===false?"ENVMAP_MODE_REFLECTION":m_[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}h(g_,"generateEnvMapModeDefine");const __={0:"ENVMAP_BLENDING_MULTIPLY",1:"ENVMAP_BLENDING_MIX",2:"ENVMAP_BLENDING_ADD"};function x_(i){return i.envMap===false?"ENVMAP_BLENDING_NONE":__[i.combine]||"ENVMAP_BLENDING_NONE"}h(x_,"generateEnvMapBlendingDefine");function v_(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}h(v_,"generateCubeUVSize");function S_(i,t,e,n){const r=i.getContext(),s=e.defines;let a=e.vertexShader,o=e.fragmentShader;const c=d_(e),l=p_(e),d=g_(e),f=x_(e),u=v_(e),m=i_(e),_=r_(s),y=r.createProgram();let g,p,E=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(zi).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(zi).join(`
`),p.length>0&&(p+=`
`)):(g=[jh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+d:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===false?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===false?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(zi).join(`
`),p=[jh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+d:"",e.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===false?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==0?"#define TONE_MAPPING":"",e.toneMapping!==0?Ot.tonemapping_pars_fragment:"",e.toneMapping!==0?e_("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ot.colorspace_pars_fragment,jg("linearToOutputTexel",e.outputColorSpace),n_(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(zi).join(`
`)),a=Ya(a),a=Kh(a,e),a=Jh(a,e),o=Ya(o),o=Kh(o,e),o=Jh(o,e),a=Qh(a),o=Qh(o),e.isRawShaderMaterial!==true&&(E=`#version 300 es
`,g=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",e.glslVersion===fc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===fc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const R=E+g+a,S=E+p+o,T=Yh(r,r.VERTEX_SHADER,R),b=Yh(r,r.FRAGMENT_SHADER,S);r.attachShader(y,T),r.attachShader(y,b),e.index0AttributeName!==void 0?r.bindAttribLocation(y,0,e.index0AttributeName):e.hasPositionAttribute===true&&r.bindAttribLocation(y,0,"position"),r.linkProgram(y);function C(F){if(i.debug.checkShaderErrors){const B=r.getProgramInfoLog(y)||"",k=r.getShaderInfoLog(T)||"",N=r.getShaderInfoLog(b)||"",H=B.trim(),$=k.trim(),K=N.trim();let it=true,q=true;if(r.getProgramParameter(y,r.LINK_STATUS)===false)if(it=false,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,y,T,b);else{const tt=$h(r,T,"vertex"),nt=$h(r,b,"fragment");Pt("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(y,r.VALIDATE_STATUS)+`

Material Name: `+F.name+`
Material Type: `+F.type+`

Program Info Log: `+H+`
`+tt+`
`+nt)}else H!==""?Tt("WebGLProgram: Program Info Log:",H):($===""||K==="")&&(q=false);q&&(F.diagnostics={runnable:it,programLog:H,vertexShader:{log:$,prefix:g},fragmentShader:{log:K,prefix:p}})}r.deleteShader(T),r.deleteShader(b),v=new vi(r,y),A=s_(r,y)}h(C,"onFirstUse");let v;this.getUniforms=function(){return v===void 0&&C(this),v};let A;this.getAttributes=function(){return A===void 0&&C(this),A};let P=e.rendererExtensionParallelShaderCompile===false;return this.isReady=function(){return P===false&&(P=r.getProgramParameter(y,$g)),P},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Kg++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=T,this.fragmentShader=b,this}h(S_,"WebGLProgram");let M_=0;const Jl=class Jl2{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){const r=this._getShaderCacheForMaterial(t);return r.has(e)===false&&(r.add(e),e.usedTimes++),r.has(n)===false&&(r.add(n),n.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new $a(t),e.set(t,n)),n}};h(Jl,"WebGLShaderCache");let Za=Jl;const Ql=class Ql2{constructor(t){this.id=M_++,this.code=t,this.usedTimes=0}};h(Ql,"WebGLShaderStage");let $a=Ql;function y_(i){return i===1030||i===37490||i===36285}h(y_,"isPackedRGFormat");function E_(i,t,e,n,r,s){const a=new Xi,o=new Za,c=new Set,l=[],d=new Map,f=n.logarithmicDepthBuffer;let u=n.precision;const m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(v){return c.add(v),v===0?"uv":`uv${v}`}h(_,"getChannel");function y(v,A,P,F,B,k){const N=F.fog,H=B.geometry,$=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?F.environment:null,K=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,it=t.get(v.envMap||$,K),q=it&&it.mapping===306?it.image.height:null,tt=m[v.type];v.precision!==null&&(u=n.getMaxPrecision(v.precision),u!==v.precision&&Tt("WebGLProgram.getParameters:",v.precision,"not supported, using",u,"instead."));const nt=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,wt=nt!==void 0?nt.length:0;let At=0;H.morphAttributes.position!==void 0&&(At=1),H.morphAttributes.normal!==void 0&&(At=2),H.morphAttributes.color!==void 0&&(At=3);let re,Xt,Zt,Y;if(tt){const ae=rn[tt];re=ae.vertexShader,Xt=ae.fragmentShader}else{re=v.vertexShader,Xt=v.fragmentShader;const ae=o.getVertexShaderStage(v),$t=o.getFragmentShaderStage(v);o.update(v,ae,$t),Zt=ae.id,Y=$t.id}const j=i.getRenderTarget(),xt=i.state.buffers.depth.getReversed(),Dt=B.isInstancedMesh===true,gt=B.isBatchedMesh===true,zt=!!v.map,xe=!!v.matcap,Vt=!!it,Yt=!!v.aoMap,se=!!v.lightMap,Ht=!!v.bumpMap&&v.wireframe===false,he=!!v.normalMap,ye=!!v.displacementMap,De=!!v.emissiveMap,ue=!!v.metalnessMap,me=!!v.roughnessMap,U=v.anisotropy>0,be=v.clearcoat>0,Jt=v.dispersion>0,w=v.retroreflectivity>0,x=v.iridescence>0,O=v.sheen>0,V=v.transmission>0,X=U&&!!v.anisotropyMap,rt=be&&!!v.clearcoatMap,st=be&&!!v.clearcoatNormalMap,Z=be&&!!v.clearcoatRoughnessMap,Q=x&&!!v.iridescenceMap,at=x&&!!v.iridescenceThicknessMap,Et=O&&!!v.sheenColorMap,ht=O&&!!v.sheenRoughnessMap,ot=!!v.specularMap,bt=!!v.specularColorMap,Ct=!!v.specularIntensityMap,Ut=V&&!!v.transmissionMap,L=V&&!!v.thicknessMap,lt=!!v.gradientMap,J=!!v.alphaMap,ct=v.alphaTest>0,pt=!!v.alphaHash,et=!!v.extensions;let Rt=0;v.toneMapped&&(j===null||j.isXRRenderTarget===true)&&(Rt=i.toneMapping);const Mt={shaderID:tt,shaderType:v.type,shaderName:v.name,vertexShader:re,fragmentShader:Xt,defines:v.defines,customVertexShaderID:Zt,customFragmentShaderID:Y,isRawShaderMaterial:v.isRawShaderMaterial===true,glslVersion:v.glslVersion,precision:u,batching:gt,batchingColor:gt&&B._colorsTexture!==null,instancing:Dt,instancingColor:Dt&&B.instanceColor!==null,instancingMorph:Dt&&B.morphTexture!==null,outputColorSpace:j===null?i.outputColorSpace:j.isXRRenderTarget===true?j.texture.colorSpace:Wt.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:zt,matcap:xe,envMap:Vt,envMapMode:Vt&&it.mapping,envMapCubeUVHeight:q,aoMap:Yt,lightMap:se,bumpMap:Ht,normalMap:he,displacementMap:ye,emissiveMap:De,normalMapObjectSpace:he&&v.normalMapType===1,normalMapTangentSpace:he&&v.normalMapType===0,packedNormalMap:he&&v.normalMapType===0&&y_(v.normalMap.format),metalnessMap:ue,roughnessMap:me,anisotropy:U,anisotropyMap:X,clearcoat:be,clearcoatMap:rt,clearcoatNormalMap:st,clearcoatRoughnessMap:Z,dispersion:Jt,retroreflection:w,iridescence:x,iridescenceMap:Q,iridescenceThicknessMap:at,sheen:O,sheenColorMap:Et,sheenRoughnessMap:ht,specularMap:ot,specularColorMap:bt,specularIntensityMap:Ct,transmission:V,transmissionMap:Ut,thicknessMap:L,gradientMap:lt,opaque:v.transparent===false&&v.blending===1&&v.alphaToCoverage===false,alphaMap:J,alphaTest:ct,alphaHash:pt,combine:v.combine,mapUv:zt&&_(v.map.channel),aoMapUv:Yt&&_(v.aoMap.channel),lightMapUv:se&&_(v.lightMap.channel),bumpMapUv:Ht&&_(v.bumpMap.channel),normalMapUv:he&&_(v.normalMap.channel),displacementMapUv:ye&&_(v.displacementMap.channel),emissiveMapUv:De&&_(v.emissiveMap.channel),metalnessMapUv:ue&&_(v.metalnessMap.channel),roughnessMapUv:me&&_(v.roughnessMap.channel),anisotropyMapUv:X&&_(v.anisotropyMap.channel),clearcoatMapUv:rt&&_(v.clearcoatMap.channel),clearcoatNormalMapUv:st&&_(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Z&&_(v.clearcoatRoughnessMap.channel),iridescenceMapUv:Q&&_(v.iridescenceMap.channel),iridescenceThicknessMapUv:at&&_(v.iridescenceThicknessMap.channel),sheenColorMapUv:Et&&_(v.sheenColorMap.channel),sheenRoughnessMapUv:ht&&_(v.sheenRoughnessMap.channel),specularMapUv:ot&&_(v.specularMap.channel),specularColorMapUv:bt&&_(v.specularColorMap.channel),specularIntensityMapUv:Ct&&_(v.specularIntensityMap.channel),transmissionMapUv:Ut&&_(v.transmissionMap.channel),thicknessMapUv:L&&_(v.thicknessMap.channel),alphaMapUv:J&&_(v.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(he||U),vertexNormals:!!H.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===true&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:B.isPoints===true&&!!H.attributes.uv&&(zt||J),fog:!!N,useFog:v.fog===true,fogExp2:!!N&&N.isFogExp2,flatShading:v.wireframe===false&&(v.flatShading===true||H.attributes.normal===void 0&&he===false&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===true,logarithmicDepthBuffer:f,reversedDepthBuffer:xt,skinning:B.isSkinnedMesh===true,hasPositionAttribute:H.attributes.position!==void 0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:wt,morphTextureStride:At,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:k.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:v.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:Rt,decodeVideoTexture:zt&&v.map.isVideoTexture===true&&Wt.getTransfer(v.map.colorSpace)===Qt,decodeVideoTextureEmissive:De&&v.emissiveMap.isVideoTexture===true&&Wt.getTransfer(v.emissiveMap.colorSpace)===Qt,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===2,flipSided:v.side===1,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:et&&v.extensions.clipCullDistance===true&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(et&&v.extensions.multiDraw===true||gt)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Mt.vertexUv1s=c.has(1),Mt.vertexUv2s=c.has(2),Mt.vertexUv3s=c.has(3),c.clear(),Mt}h(y,"getParameters");function g(v){const A=[];if(v.shaderID?A.push(v.shaderID):(A.push(v.customVertexShaderID),A.push(v.customFragmentShaderID)),v.defines!==void 0)for(const P in v.defines)A.push(P),A.push(v.defines[P]);return v.isRawShaderMaterial===false&&(p(A,v),E(A,v),A.push(i.outputColorSpace)),A.push(v.customProgramCacheKey),A.join()}h(g,"getProgramCacheKey");function p(v,A){v.push(A.precision),v.push(A.outputColorSpace),v.push(A.envMapMode),v.push(A.envMapCubeUVHeight),v.push(A.mapUv),v.push(A.alphaMapUv),v.push(A.lightMapUv),v.push(A.aoMapUv),v.push(A.bumpMapUv),v.push(A.normalMapUv),v.push(A.displacementMapUv),v.push(A.emissiveMapUv),v.push(A.metalnessMapUv),v.push(A.roughnessMapUv),v.push(A.anisotropyMapUv),v.push(A.clearcoatMapUv),v.push(A.clearcoatNormalMapUv),v.push(A.clearcoatRoughnessMapUv),v.push(A.iridescenceMapUv),v.push(A.iridescenceThicknessMapUv),v.push(A.sheenColorMapUv),v.push(A.sheenRoughnessMapUv),v.push(A.specularMapUv),v.push(A.specularColorMapUv),v.push(A.specularIntensityMapUv),v.push(A.transmissionMapUv),v.push(A.thicknessMapUv),v.push(A.combine),v.push(A.fogExp2),v.push(A.sizeAttenuation),v.push(A.morphTargetsCount),v.push(A.morphAttributeCount),v.push(A.numSunLights),v.push(A.numDirLights),v.push(A.numPointLights),v.push(A.numSpotLights),v.push(A.numSpotLightMaps),v.push(A.numHemiLights),v.push(A.numRectAreaLights),v.push(A.numSunLightShadows),v.push(A.numDirLightShadows),v.push(A.numPointLightShadows),v.push(A.numSpotLightShadows),v.push(A.numSpotLightShadowsWithMaps),v.push(A.numLightProbes),v.push(A.shadowMapType),v.push(A.toneMapping),v.push(A.numClippingPlanes),v.push(A.numClipIntersection),v.push(A.depthPacking)}h(p,"getProgramCacheKeyParameters");function E(v,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),v.push(a.mask)}h(E,"getProgramCacheKeyBooleans");function R(v){const A=m[v.type];let P;if(A){const F=rn[A];P=Fd.clone(F.uniforms)}else P=v.uniforms;return P}h(R,"getUniforms");function S(v,A){let P=d.get(A);return P!==void 0?++P.usedTimes:(P=new S_(i,A,v,r),l.push(P),d.set(A,P)),P}h(S,"acquireProgram");function T(v){if(--v.usedTimes===0){const A=l.indexOf(v);l[A]=l[l.length-1],l.pop(),d.delete(v.cacheKey),v.destroy()}}h(T,"releaseProgram");function b(v){o.remove(v)}h(b,"releaseShaderCache");function C(){o.dispose()}return h(C,"dispose"),{getParameters:y,getProgramCacheKey:g,getUniforms:R,acquireProgram:S,releaseProgram:T,releaseShaderCache:b,programs:l,dispose:C}}h(E_,"WebGLPrograms");function b_(){let i=new WeakMap;function t(a){return i.has(a)}h(t,"has");function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}h(e,"get");function n(a){i.delete(a)}h(n,"remove");function r(a,o,c){i.get(a)[o]=c}h(r,"update");function s(){i=new WeakMap}return h(s,"dispose"),{has:t,get:e,remove:n,update:r,dispose:s}}h(b_,"WebGLProperties");function T_(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}h(T_,"painterSortStable");function tu(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}h(tu,"reversePainterSortStable");function eu(){const i=[];let t=0;const e=[],n=[],r=[];function s(){t=0,e.length=0,n.length=0,r.length=0}h(s,"init");function a(u){let m=0;return u.isInstancedMesh&&(m+=2),u.isSkinnedMesh&&(m+=1),m}h(a,"materialVariant");function o(u,m,_,y,g,p){let E=i[t];return E===void 0?(E={id:u.id,object:u,geometry:m,material:_,materialVariant:a(u),groupOrder:y,renderOrder:u.renderOrder,z:g,group:p},i[t]=E):(E.id=u.id,E.object=u,E.geometry=m,E.material=_,E.materialVariant=a(u),E.groupOrder=y,E.renderOrder=u.renderOrder,E.z=g,E.group=p),t++,E}h(o,"getNextRenderItem");function c(u,m,_,y,g,p,E){E.reversedDepth===true&&(g=-g);const R=o(u,m,_,y,g,p);_.transmission>0?n.push(R):_.transparent===true?r.push(R):e.push(R)}h(c,"push");function l(u,m,_,y,g,p){const E=o(u,m,_,y,g,p);_.transmission>0?n.unshift(E):_.transparent===true?r.unshift(E):e.unshift(E)}h(l,"unshift");function d(u,m){e.length>1&&e.sort(u||T_),n.length>1&&n.sort(m||tu),r.length>1&&r.sort(m||tu)}h(d,"sort");function f(){for(let u=t,m=i.length;u<m;u++){const _=i[u];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return h(f,"finish"),{opaque:e,transmissive:n,transparent:r,init:s,push:c,unshift:l,finish:f,sort:d}}h(eu,"WebGLRenderList");function A_(){let i=new WeakMap;function t(n,r){const s=i.get(n);let a;return s===void 0?(a=new eu,i.set(n,[a])):r>=s.length?(a=new eu,s.push(a)):a=s[r],a}h(t,"get");function e(){i=new WeakMap}return h(e,"dispose"),{get:t,dispose:e}}h(A_,"WebGLRenderLists");function R_(){const i={};return{get:h(function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new D,color:new Ft};break;case"SpotLight":e={position:new D,direction:new D,color:new Ft,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new D,color:new Ft,distance:0,decay:0};break;case"HemisphereLight":e={direction:new D,skyColor:new Ft,groundColor:new Ft};break;case"RectAreaLight":e={color:new Ft,position:new D,halfWidth:new D,halfHeight:new D};break}return i[t.id]=e,e},"get")}}h(R_,"UniformsCache");function w_(){const i={};return{get:h(function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new It};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new It};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new It,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e},"get")}}h(w_,"ShadowUniformsCache");let C_=0;function P_(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}h(P_,"shadowCastingAndTexturingLightsFirst");function I_(i){const t=new R_,e=w_(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new D);const r=new D,s=new Gt,a=new Gt;function o(l){let d=0,f=0,u=0;for(let B=0;B<9;B++)n.probe[B].set(0,0,0);let m=0,_=0,y=0,g=0,p=0,E=0,R=0,S=0,T=0,b=0,C=0,v=0,A=0,P=0;l.sort(P_);for(let B=0,k=l.length;B<k;B++){const N=l[B],H=N.color,$=N.intensity,K=N.distance;let it=null;if(N.shadow&&N.shadow.map&&(N.shadow.map.texture.format===1030?it=N.shadow.map.texture:it=N.shadow.map.depthTexture||N.shadow.map.texture),N.isAmbientLight)d+=H.r*$,f+=H.g*$,u+=H.b*$;else if(N.isLightProbe){for(let q=0;q<9;q++)n.probe[q].addScaledVector(N.sh.coefficients[q],$);P++}else if(N.isSunLight){const q=t.get(N);if(q.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){const tt=N.shadow,nt=e.get(N);nt.shadowIntensity=tt.intensity,nt.shadowBias=tt.bias,nt.shadowNormalBias=tt.normalBias,nt.shadowRadius=tt.radius,nt.shadowMapSize.copy(tt.mapSize).multiply(tt.getFrameExtents()),n.sunShadow[_]=nt,n.sunShadowMap[_]=it;const wt=tt.getViewportCount();for(let At=0;At<wt;At++)n.sunShadowMatrix[y+At]=tt.getMatrix(At),n.sunShadowCascade[y+At]=tt._cascadeData[At];y+=wt,_++}n.sun[m]=q,m++}else if(N.isDirectionalLight){const q=t.get(N);if(q.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){const tt=N.shadow,nt=e.get(N);nt.shadowIntensity=tt.intensity,nt.shadowBias=tt.bias,nt.shadowNormalBias=tt.normalBias,nt.shadowRadius=tt.radius,nt.shadowMapSize=tt.mapSize,n.directionalShadow[g]=nt,n.directionalShadowMap[g]=it,n.directionalShadowMatrix[g]=N.shadow.matrix,T++}n.directional[g]=q,g++}else if(N.isSpotLight){const q=t.get(N);q.position.setFromMatrixPosition(N.matrixWorld),q.color.copy(H).multiplyScalar($),q.distance=K,q.coneCos=Math.cos(N.angle),q.penumbraCos=Math.cos(N.angle*(1-N.penumbra)),q.decay=N.decay,n.spot[E]=q;const tt=N.shadow;if(N.map&&(n.spotLightMap[v]=N.map,v++,tt.updateMatrices(N),N.castShadow&&A++),n.spotLightMatrix[E]=tt.matrix,N.castShadow){const nt=e.get(N);nt.shadowIntensity=tt.intensity,nt.shadowBias=tt.bias,nt.shadowNormalBias=tt.normalBias,nt.shadowRadius=tt.radius,nt.shadowMapSize=tt.mapSize,n.spotShadow[E]=nt,n.spotShadowMap[E]=it,C++}E++}else if(N.isRectAreaLight){const q=t.get(N);q.color.copy(H).multiplyScalar($),q.halfWidth.set(N.width*.5,0,0),q.halfHeight.set(0,N.height*.5,0),n.rectArea[R]=q,R++}else if(N.isPointLight){const q=t.get(N);if(q.color.copy(N.color).multiplyScalar(N.intensity),q.distance=N.distance,q.decay=N.decay,N.castShadow){const tt=N.shadow,nt=e.get(N);nt.shadowIntensity=tt.intensity,nt.shadowBias=tt.bias,nt.shadowNormalBias=tt.normalBias,nt.shadowRadius=tt.radius,nt.shadowMapSize=tt.mapSize,nt.shadowCameraNear=tt.camera.near,nt.shadowCameraFar=tt.camera.far,n.pointShadow[p]=nt,n.pointShadowMap[p]=it,n.pointShadowMatrix[p]=N.shadow.matrix,b++}n.point[p]=q,p++}else if(N.isHemisphereLight){const q=t.get(N);q.skyColor.copy(N.color).multiplyScalar($),q.groundColor.copy(N.groundColor).multiplyScalar($),n.hemi[S]=q,S++}}R>0&&(i.has("OES_texture_float_linear")===true?(n.rectAreaLTC1=ut.LTC_FLOAT_1,n.rectAreaLTC2=ut.LTC_FLOAT_2):(n.rectAreaLTC1=ut.LTC_HALF_1,n.rectAreaLTC2=ut.LTC_HALF_2)),n.ambient[0]=d,n.ambient[1]=f,n.ambient[2]=u;const F=n.hash;(F.sunLength!==m||F.directionalLength!==g||F.pointLength!==p||F.spotLength!==E||F.rectAreaLength!==R||F.hemiLength!==S||F.numSunShadows!==_||F.numDirectionalShadows!==T||F.numPointShadows!==b||F.numSpotShadows!==C||F.numSpotMaps!==v||F.numLightProbes!==P)&&(n.sun.length=m,n.directional.length=g,n.spot.length=E,n.rectArea.length=R,n.point.length=p,n.hemi.length=S,n.sunShadow.length=_,n.sunShadowMap.length=_,n.sunShadowMatrix.length=y,n.sunShadowCascade.length=y,n.directionalShadow.length=T,n.directionalShadowMap.length=T,n.directionalShadowMatrix.length=T,n.pointShadow.length=b,n.pointShadowMap.length=b,n.pointShadowMatrix.length=b,n.spotShadow.length=C,n.spotShadowMap.length=C,n.spotLightMatrix.length=C+v-A,n.spotLightMap.length=v,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=P,F.sunLength=m,F.directionalLength=g,F.pointLength=p,F.spotLength=E,F.rectAreaLength=R,F.hemiLength=S,F.numSunShadows=_,F.numDirectionalShadows=T,F.numPointShadows=b,F.numSpotShadows=C,F.numSpotMaps=v,F.numLightProbes=P,n.version=C_++)}h(o,"setup");function c(l,d){let f=0,u=0,m=0,_=0,y=0,g=0;const p=d.matrixWorldInverse;for(let E=0,R=l.length;E<R;E++){const S=l[E];if(S.isSunLight){const T=n.sun[f];T.direction.setFromMatrixPosition(S.matrixWorld),T.direction.transformDirection(p),f++}else if(S.isDirectionalLight){const T=n.directional[u];T.direction.setFromMatrixPosition(S.matrixWorld),r.setFromMatrixPosition(S.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(p),u++}else if(S.isSpotLight){const T=n.spot[_];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(p),T.direction.setFromMatrixPosition(S.matrixWorld),r.setFromMatrixPosition(S.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(p),_++}else if(S.isRectAreaLight){const T=n.rectArea[y];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(p),a.identity(),s.copy(S.matrixWorld),s.premultiply(p),a.extractRotation(s),T.halfWidth.set(S.width*.5,0,0),T.halfHeight.set(0,S.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),y++}else if(S.isPointLight){const T=n.point[m];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(p),m++}else if(S.isHemisphereLight){const T=n.hemi[g];T.direction.setFromMatrixPosition(S.matrixWorld),T.direction.transformDirection(p),g++}}}return h(c,"setupView"),{setup:o,setupView:c,state:n}}h(I_,"WebGLLights");function nu(i){const t=new I_(i),e=[],n=[],r=[];function s(u){f.camera=u,e.length=0,n.length=0,r.length=0}h(s,"init");function a(u){e.push(u)}h(a,"pushLight");function o(u){n.push(u)}h(o,"pushShadow");function c(u){r.push(u)}h(c,"pushLightProbeGrid");function l(){t.setup(e)}h(l,"setupLights");function d(u){t.setupView(e,u)}h(d,"setupLightsView");const f={lightsArray:e,shadowsArray:n,lightProbeGridArray:r,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:l,setupLightsView:d,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}h(nu,"WebGLRenderState");function D_(i){let t=new WeakMap;function e(r,s=0){const a=t.get(r);let o;return a===void 0?(o=new nu(i),t.set(r,[o])):s>=a.length?(o=new nu(i),a.push(o)):o=a[s],o}h(e,"get");function n(){t=new WeakMap}return h(n,"dispose"),{get:e,dispose:n}}h(D_,"WebGLRenderStates");const L_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,N_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,U_=[new D(1,0,0),new D(-1,0,0),new D(0,1,0),new D(0,-1,0),new D(0,0,1),new D(0,0,-1)],F_=[new D(0,-1,0),new D(0,-1,0),new D(0,0,1),new D(0,0,-1),new D(0,-1,0),new D(0,-1,0)],iu=new Gt,Bi=new D,ca=new D;function B_(i,t,e){let n=new Yi;const r=new It,s=new It,a=new ee,o=new Ta,c=new Aa,l={},d=e.maxTextureSize,f={0:1,1:0,2:2},u=new We({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new It},radius:{value:4}},vertexShader:L_,fragmentShader:N_}),m=u.clone();m.defines.HORIZONTAL_PASS=1;const _=new ve;_.setAttribute("position",new Oe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const y=new Ne(_,u),g=this;this.enabled=false,this.autoUpdate=true,this.needsUpdate=false,this.type=1;let p=this.type;this.render=function(b,C,v){if(g.enabled===false||g.autoUpdate===false&&g.needsUpdate===false||b.length===0)return;this.type===2&&(Tt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=1);const A=i.getRenderTarget(),P=i.getActiveCubeFace(),F=i.getActiveMipmapLevel(),B=i.state;B.setBlending(0),B.buffers.depth.getReversed()===true?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(true),B.setScissorTest(false);const k=p!==this.type;k&&C.traverse(function(N){N.material&&(Array.isArray(N.material)?N.material.forEach(H=>H.needsUpdate=true):N.material.needsUpdate=true)});for(let N=0,H=b.length;N<H;N++){const $=b[N],K=$.shadow;if(K===void 0){Tt("WebGLShadowMap:",$,"has no shadow.");continue}if(K.autoUpdate===false&&K.needsUpdate===false)continue;r.copy(K.mapSize);const it=K.getFrameExtents();r.multiply(it),s.copy(K.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(s.x=Math.floor(d/it.x),r.x=s.x*it.x,K.mapSize.x=s.x),r.y>d&&(s.y=Math.floor(d/it.y),r.y=s.y*it.y,K.mapSize.y=s.y));const q=i.state.buffers.depth.getReversed();if(K.camera._reversedDepth=q,K.map===null||k===true){if(K.map!==null&&(K.map.depthTexture!==null&&(K.map.depthTexture.dispose(),K.map.depthTexture=null),K.map.dispose()),this.type===3){if($.isPointLight){Tt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}K.map=new Be(r.x,r.y,{format:1030,type:1016,minFilter:1006,magFilter:1006,generateMipmaps:false}),K.map.texture.name=$.name+".shadowMap",K.map.depthTexture=new zn(r.x,r.y,1015),K.map.depthTexture.name=$.name+".shadowMapDepth",K.map.depthTexture.format=1026,K.map.depthTexture.compareFunction=null,K.map.depthTexture.minFilter=1003,K.map.depthTexture.magFilter=1003}else $.isPointLight?(K.map=new cs(r.x),K.map.depthTexture=new xa(r.x,1014)):(K.map=new Be(r.x,r.y),K.map.depthTexture=new zn(r.x,r.y,1014)),K.map.depthTexture.name=$.name+".shadowMap",K.map.depthTexture.format=1026,this.type===1?(K.map.depthTexture.compareFunction=q?518:515,K.map.depthTexture.minFilter=1006,K.map.depthTexture.magFilter=1006):(K.map.depthTexture.compareFunction=null,K.map.depthTexture.minFilter=1003,K.map.depthTexture.magFilter=1003);K.camera.updateProjectionMatrix()}K.map.isWebGLCubeRenderTarget!==true&&(K.map.width!==r.x||K.map.height!==r.y)&&K.map.setSize(r.x,r.y);const tt=K.map.isWebGLCubeRenderTarget?6:K.getViewportCount();$.isPointLight!==true&&K.updateMatrices($,v);for(let nt=0;nt<tt;nt++){const wt=K.getCamera(nt);if($.isPointLight){const At=K.camera,re=K.matrix,Xt=$.distance||At.far;Xt!==At.far&&(At.far=Xt,At.updateProjectionMatrix()),Bi.setFromMatrixPosition($.matrixWorld),At.position.copy(Bi),ca.copy(At.position),ca.add(U_[nt]),At.up.copy(F_[nt]),At.lookAt(ca),At.updateMatrixWorld(),re.makeTranslation(-Bi.x,-Bi.y,-Bi.z),iu.multiplyMatrices(At.projectionMatrix,At.matrixWorldInverse),K._frustum.setFromProjectionMatrix(iu,At.coordinateSystem,At.reversedDepth)}if(K.map.isWebGLCubeRenderTarget)i.setRenderTarget(K.map,nt),i.clear();else{nt===0&&(i.setRenderTarget(K.map),i.clear());const At=K.getViewport(nt);a.set(s.x*At.x,s.y*At.y,s.x*At.z,s.y*At.w),B.viewport(a)}n=K.getFrustum(nt),S(C,v,wt,$,this.type)}K.isPointLightShadow!==true&&this.type===3&&E(K,v),K.needsUpdate=false}p=this.type,g.needsUpdate=false,i.setRenderTarget(A,P,F)};function E(b,C){const v=t.update(y);u.defines.VSM_SAMPLES!==b.blurSamples&&(u.defines.VSM_SAMPLES=b.blurSamples,m.defines.VSM_SAMPLES=b.blurSamples,u.needsUpdate=true,m.needsUpdate=true),b.mapPass===null?b.mapPass=new Be(r.x,r.y,{format:1030,type:1016}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),u.uniforms.shadow_pass.value=b.map.depthTexture,u.uniforms.resolution.value.set(b.map.width,b.map.height),u.uniforms.radius.value=b.radius,i.setRenderTarget(b.mapPass),i.clear(),i.renderBufferDirect(C,null,v,u,y,null),m.uniforms.shadow_pass.value=b.mapPass.texture,m.uniforms.resolution.value.set(b.map.width,b.map.height),m.uniforms.radius.value=b.radius,i.setRenderTarget(b.map),i.clear(),i.renderBufferDirect(C,null,v,m,y,null)}h(E,"VSMPass");function R(b,C,v,A){let P=null;const F=v.isPointLight===true?b.customDistanceMaterial:b.customDepthMaterial;if(F!==void 0)P=F;else if(P=v.isPointLight===true?c:o,i.localClippingEnabled&&C.clipShadows===true&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===true){const B=P.uuid,k=C.uuid;let N=l[B];N===void 0&&(N={},l[B]=N);let H=N[k];H===void 0&&(H=P.clone(),N[k]=H,C.addEventListener("dispose",T)),P=H}if(P.visible=C.visible,P.wireframe=C.wireframe,A===3?P.side=C.shadowSide!==null?C.shadowSide:C.side:P.side=C.shadowSide!==null?C.shadowSide:f[C.side],P.alphaMap=C.alphaMap,P.alphaTest=C.alphaToCoverage===true?.5:C.alphaTest,P.map=C.map,P.clipShadows=C.clipShadows,P.clippingPlanes=C.clippingPlanes,P.clipIntersection=C.clipIntersection,P.displacementMap=C.displacementMap,P.displacementScale=C.displacementScale,P.displacementBias=C.displacementBias,P.wireframeLinewidth=C.wireframeLinewidth,P.linewidth=C.linewidth,v.isPointLight===true&&P.isMeshDistanceMaterial===true){const B=i.properties.get(P);B.light=v}return P}h(R,"getDepthMaterial");function S(b,C,v,A,P){if(b.visible===false)return;if(b.layers.test(C.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&P===3)&&(!b.frustumCulled||b.intersectsFrustum(n))){b.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,b.matrixWorld);const k=t.update(b),N=b.material;if(Array.isArray(N)){const H=k.groups;for(let $=0,K=H.length;$<K;$++){const it=H[$],q=N[it.materialIndex];if(q&&q.visible){const tt=R(b,q,A,P);b.onBeforeShadow(i,b,C,v,k,tt,it),i.renderBufferDirect(v,null,k,tt,b,it),b.onAfterShadow(i,b,C,v,k,tt,it)}}}else if(N.visible){const H=R(b,N,A,P);b.onBeforeShadow(i,b,C,v,k,H,null),i.renderBufferDirect(v,null,k,H,b,null),b.onAfterShadow(i,b,C,v,k,H,null)}}const B=b.children;for(let k=0,N=B.length;k<N;k++)S(B[k],C,v,A,P)}h(S,"renderObject");function T(b){b.target.removeEventListener("dispose",T);for(const v in l){const A=l[v],P=b.target.uuid;P in A&&(A[P].dispose(),delete A[P])}}h(T,"onMaterialDispose")}h(B_,"WebGLShadowMap");function O_(i,t){function e(){let L=false;const lt=new ee;let J=null;const ct=new ee(0,0,0,0);return{setMask:h(function(pt){J!==pt&&!L&&(i.colorMask(pt,pt,pt,pt),J=pt)},"setMask"),setLocked:h(function(pt){L=pt},"setLocked"),setClear:h(function(pt,et,Rt,Mt,ae){ae===true&&(pt*=Mt,et*=Mt,Rt*=Mt),lt.set(pt,et,Rt,Mt),ct.equals(lt)===false&&(i.clearColor(pt,et,Rt,Mt),ct.copy(lt))},"setClear"),reset:h(function(){L=false,J=null,ct.set(-1,0,0,0)},"reset")}}h(e,"ColorBuffer");function n(){let L=false,lt=false,J=null,ct=null,pt=null;return{setReversed:h(function(et){if(lt!==et){const Rt=t.get("EXT_clip_control");et?Rt.clipControlEXT(Rt.LOWER_LEFT_EXT,Rt.ZERO_TO_ONE_EXT):Rt.clipControlEXT(Rt.LOWER_LEFT_EXT,Rt.NEGATIVE_ONE_TO_ONE_EXT),lt=et;const Mt=pt;pt=null,this.setClear(Mt)}},"setReversed"),getReversed:h(function(){return lt},"getReversed"),setTest:h(function(et){et?j(i.DEPTH_TEST):xt(i.DEPTH_TEST)},"setTest"),setMask:h(function(et){J!==et&&!L&&(i.depthMask(et),J=et)},"setMask"),setFunc:h(function(et){if(lt&&(et=Nu[et]),ct!==et){switch(et){case 0:i.depthFunc(i.NEVER);break;case 1:i.depthFunc(i.ALWAYS);break;case 2:i.depthFunc(i.LESS);break;case 3:i.depthFunc(i.LEQUAL);break;case 4:i.depthFunc(i.EQUAL);break;case 5:i.depthFunc(i.GEQUAL);break;case 6:i.depthFunc(i.GREATER);break;case 7:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ct=et}},"setFunc"),setLocked:h(function(et){L=et},"setLocked"),setClear:h(function(et){pt!==et&&(pt=et,lt&&(et=1-et),i.clearDepth(et))},"setClear"),reset:h(function(){L=false,J=null,ct=null,pt=null,lt=false},"reset")}}h(n,"DepthBuffer");function r(){let L=false,lt=null,J=null,ct=null,pt=null,et=null,Rt=null,Mt=null,ae=null;return{setTest:h(function($t){L||($t?j(i.STENCIL_TEST):xt(i.STENCIL_TEST))},"setTest"),setMask:h(function($t){lt!==$t&&!L&&(i.stencilMask($t),lt=$t)},"setMask"),setFunc:h(function($t,Xe,Qe){(J!==$t||ct!==Xe||pt!==Qe)&&(i.stencilFunc($t,Xe,Qe),J=$t,ct=Xe,pt=Qe)},"setFunc"),setOp:h(function($t,Xe,Qe){(et!==$t||Rt!==Xe||Mt!==Qe)&&(i.stencilOp($t,Xe,Qe),et=$t,Rt=Xe,Mt=Qe)},"setOp"),setLocked:h(function($t){L=$t},"setLocked"),setClear:h(function($t){ae!==$t&&(i.clearStencil($t),ae=$t)},"setClear"),reset:h(function(){L=false,lt=null,J=null,ct=null,pt=null,et=null,Rt=null,Mt=null,ae=null},"reset")}}h(r,"StencilBuffer");const s=new e,a=new n,o=new r,c=new WeakMap,l=new WeakMap;let d={},f={},u={},m=new WeakMap,_=[],y=null,g=false,p=null,E=null,R=null,S=null,T=null,b=null,C=null,v=new Ft(0,0,0),A=0,P=false,F=null,B=null,k=null,N=null,H=null;const $=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let K=false,it=0;const q=i.getParameter(i.VERSION);q.indexOf("WebGL")!==-1?(it=parseFloat(/^WebGL (\d)/.exec(q)[1]),K=it>=1):q.indexOf("OpenGL ES")!==-1&&(it=parseFloat(/^OpenGL ES (\d)/.exec(q)[1]),K=it>=2);let tt=null,nt={};const wt=i.getParameter(i.SCISSOR_BOX),At=i.getParameter(i.VIEWPORT),re=new ee().fromArray(wt),Xt=new ee().fromArray(At);function Zt(L,lt,J,ct){const pt=new Uint8Array(4),et=i.createTexture();i.bindTexture(L,et),i.texParameteri(L,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(L,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Rt=0;Rt<J;Rt++)L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY?i.texImage3D(lt,0,i.RGBA,1,1,ct,0,i.RGBA,i.UNSIGNED_BYTE,pt):i.texImage2D(lt+Rt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,pt);return et}h(Zt,"createTexture");const Y={};Y[i.TEXTURE_2D]=Zt(i.TEXTURE_2D,i.TEXTURE_2D,1),Y[i.TEXTURE_CUBE_MAP]=Zt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[i.TEXTURE_2D_ARRAY]=Zt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Y[i.TEXTURE_3D]=Zt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),j(i.DEPTH_TEST),a.setFunc(3),Ht(false),he(1),j(i.CULL_FACE),Yt(0);function j(L){d[L]!==true&&(i.enable(L),d[L]=true)}h(j,"enable");function xt(L){d[L]!==false&&(i.disable(L),d[L]=false)}h(xt,"disable");function Dt(L,lt){return u[L]!==lt?(i.bindFramebuffer(L,lt),u[L]=lt,L===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=lt),L===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=lt),true):false}h(Dt,"bindFramebuffer");function gt(L,lt){let J=_,ct=false;if(L){J=m.get(lt),J===void 0&&(J=[],m.set(lt,J));const pt=L.textures;if(J.length!==pt.length||J[0]!==i.COLOR_ATTACHMENT0){for(let et=0,Rt=pt.length;et<Rt;et++)J[et]=i.COLOR_ATTACHMENT0+et;J.length=pt.length,ct=true}}else J[0]!==i.BACK&&(J[0]=i.BACK,ct=true);ct&&i.drawBuffers(J)}h(gt,"drawBuffers");function zt(L){return y!==L?(i.useProgram(L),y=L,true):false}h(zt,"useProgram");const xe={100:i.FUNC_ADD,101:i.FUNC_SUBTRACT,102:i.FUNC_REVERSE_SUBTRACT};xe[103]=i.MIN,xe[104]=i.MAX;const Vt={200:i.ZERO,201:i.ONE,202:i.SRC_COLOR,204:i.SRC_ALPHA,210:i.SRC_ALPHA_SATURATE,208:i.DST_COLOR,206:i.DST_ALPHA,203:i.ONE_MINUS_SRC_COLOR,205:i.ONE_MINUS_SRC_ALPHA,209:i.ONE_MINUS_DST_COLOR,207:i.ONE_MINUS_DST_ALPHA,211:i.CONSTANT_COLOR,212:i.ONE_MINUS_CONSTANT_COLOR,213:i.CONSTANT_ALPHA,214:i.ONE_MINUS_CONSTANT_ALPHA};function Yt(L,lt,J,ct,pt,et,Rt,Mt,ae,$t){if(L===0){g===true&&(xt(i.BLEND),g=false);return}if(g===false&&(j(i.BLEND),g=true),L!==5){if(L!==p||$t!==P){if((E!==100||T!==100)&&(i.blendEquation(i.FUNC_ADD),E=100,T=100),$t)switch(L){case 1:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFunc(i.ONE,i.ONE);break;case 3:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case 4:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Pt("WebGLState: Invalid blending: ",L);break}else switch(L){case 1:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case 3:Pt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case 4:Pt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Pt("WebGLState: Invalid blending: ",L);break}R=null,S=null,b=null,C=null,v.set(0,0,0),A=0,p=L,P=$t}return}pt=pt||lt,et=et||J,Rt=Rt||ct,(lt!==E||pt!==T)&&(i.blendEquationSeparate(xe[lt],xe[pt]),E=lt,T=pt),(J!==R||ct!==S||et!==b||Rt!==C)&&(i.blendFuncSeparate(Vt[J],Vt[ct],Vt[et],Vt[Rt]),R=J,S=ct,b=et,C=Rt),(Mt.equals(v)===false||ae!==A)&&(i.blendColor(Mt.r,Mt.g,Mt.b,ae),v.copy(Mt),A=ae),p=L,P=false}h(Yt,"setBlending");function se(L,lt){L.side===2?xt(i.CULL_FACE):j(i.CULL_FACE);let J=L.side===1;lt&&(J=!J),Ht(J),L.blending===1&&L.transparent===false?Yt(0):Yt(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),a.setFunc(L.depthFunc),a.setTest(L.depthTest),a.setMask(L.depthWrite),s.setMask(L.colorWrite);const ct=L.stencilWrite;o.setTest(ct),ct&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),De(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===true?j(i.SAMPLE_ALPHA_TO_COVERAGE):xt(i.SAMPLE_ALPHA_TO_COVERAGE)}h(se,"setMaterial");function Ht(L){F!==L&&(L?i.frontFace(i.CW):i.frontFace(i.CCW),F=L)}h(Ht,"setFlipSided");function he(L){L!==0?(j(i.CULL_FACE),L!==B&&(L===1?i.cullFace(i.BACK):L===2?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):xt(i.CULL_FACE),B=L}h(he,"setCullFace");function ye(L){L!==k&&(K&&i.lineWidth(L),k=L)}h(ye,"setLineWidth");function De(L,lt,J){L?(j(i.POLYGON_OFFSET_FILL),(N!==lt||H!==J)&&(N=lt,H=J,a.getReversed()&&(lt=-lt),i.polygonOffset(lt,J))):xt(i.POLYGON_OFFSET_FILL)}h(De,"setPolygonOffset");function ue(L){L?j(i.SCISSOR_TEST):xt(i.SCISSOR_TEST)}h(ue,"setScissorTest");function me(L){L===void 0&&(L=i.TEXTURE0+$-1),tt!==L&&(i.activeTexture(L),tt=L)}h(me,"activeTexture");function U(L,lt,J){J===void 0&&(tt===null?J=i.TEXTURE0+$-1:J=tt);let ct=nt[J];ct===void 0&&(ct={type:void 0,texture:void 0},nt[J]=ct),(ct.type!==L||ct.texture!==lt)&&(tt!==J&&(i.activeTexture(J),tt=J),i.bindTexture(L,lt||Y[L]),ct.type=L,ct.texture=lt)}h(U,"bindTexture");function be(){const L=nt[tt];L!==void 0&&L.type!==void 0&&(i.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}h(be,"unbindTexture");function Jt(){try{i.compressedTexImage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(Jt,"compressedTexImage2D");function w(){try{i.compressedTexImage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(w,"compressedTexImage3D");function x(){try{i.texSubImage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(x,"texSubImage2D");function O(){try{i.texSubImage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(O,"texSubImage3D");function V(){try{i.compressedTexSubImage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(V,"compressedTexSubImage2D");function X(){try{i.compressedTexSubImage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(X,"compressedTexSubImage3D");function rt(){try{i.texStorage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(rt,"texStorage2D");function st(){try{i.texStorage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(st,"texStorage3D");function Z(){try{i.texImage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(Z,"texImage2D");function Q(){try{i.texImage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}h(Q,"texImage3D");function at(L){return f[L]!==void 0?f[L]:i.getParameter(L)}h(at,"getParameter");function Et(L,lt){f[L]!==lt&&(i.pixelStorei(L,lt),f[L]=lt)}h(Et,"pixelStorei");function ht(L){re.equals(L)===false&&(i.scissor(L.x,L.y,L.z,L.w),re.copy(L))}h(ht,"scissor");function ot(L){Xt.equals(L)===false&&(i.viewport(L.x,L.y,L.z,L.w),Xt.copy(L))}h(ot,"viewport");function bt(L,lt){let J=l.get(lt);J===void 0&&(J=new WeakMap,l.set(lt,J));let ct=J.get(L);ct===void 0&&(ct=i.getUniformBlockIndex(lt,L.name),J.set(L,ct))}h(bt,"updateUBOMapping");function Ct(L,lt){const ct=l.get(lt).get(L);c.get(lt)!==ct&&(i.uniformBlockBinding(lt,ct,L.__bindingPointIndex),c.set(lt,ct))}h(Ct,"uniformBlockBinding");function Ut(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(true,true,true,true),i.clearColor(0,0,0,0),i.depthMask(true),i.depthFunc(i.LESS),a.setReversed(false),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,false),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),d={},f={},tt=null,nt={},u={},m=new WeakMap,_=[],y=null,g=false,p=null,E=null,R=null,S=null,T=null,b=null,C=null,v=new Ft(0,0,0),A=0,P=false,F=null,B=null,k=null,N=null,H=null,re.set(0,0,i.canvas.width,i.canvas.height),Xt.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return h(Ut,"reset"),{buffers:{color:s,depth:a,stencil:o},enable:j,disable:xt,bindFramebuffer:Dt,drawBuffers:gt,useProgram:zt,setBlending:Yt,setMaterial:se,setFlipSided:Ht,setCullFace:he,setLineWidth:ye,setPolygonOffset:De,setScissorTest:ue,activeTexture:me,bindTexture:U,unbindTexture:be,compressedTexImage2D:Jt,compressedTexImage3D:w,texImage2D:Z,texImage3D:Q,pixelStorei:Et,getParameter:at,updateUBOMapping:bt,uniformBlockBinding:Ct,texStorage2D:rt,texStorage3D:st,texSubImage2D:x,texSubImage3D:O,compressedTexSubImage2D:V,compressedTexSubImage3D:X,scissor:ht,viewport:ot,reset:Ut}}h(O_,"WebGLState");function z_(i,t,e,n,r,s,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?false:/OculusBrowser/g.test(navigator.userAgent),l=new It,d=new WeakMap,f=new Set;let u;const m=new WeakMap;let _=false;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(w,x){return _?new OffscreenCanvas(w,x):Hi("canvas")}h(y,"createCanvas");function g(w,x,O){let V=1;const X=Jt(w);if((X.width>O||X.height>O)&&(V=O/Math.max(X.width,X.height)),V<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){const rt=Math.floor(V*X.width),st=Math.floor(V*X.height);u===void 0&&(u=y(rt,st));const Z=x?y(rt,st):u;return Z.width=rt,Z.height=st,Z.getContext("2d").drawImage(w,0,0,rt,st),Tt("WebGLRenderer: Texture has been resized from ("+X.width+"x"+X.height+") to ("+rt+"x"+st+")."),Z}else return"data"in w&&Tt("WebGLRenderer: Image in DataTexture is too big ("+X.width+"x"+X.height+")."),w;return w}h(g,"resizeImage");function p(w){return w.generateMipmaps}h(p,"textureNeedsGenerateMipmaps");function E(w){i.generateMipmap(w)}h(E,"generateMipmap");function R(w){return w.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:w.isWebGL3DRenderTarget?i.TEXTURE_3D:w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}h(R,"getTargetType");function S(w,x,O,V,X,rt=false){if(w!==null){if(i[w]!==void 0)return i[w];Tt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let st;V&&(st=t.get("EXT_texture_norm16"),st||Tt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Z=x;if(x===i.RED&&(O===i.FLOAT&&(Z=i.R32F),O===i.HALF_FLOAT&&(Z=i.R16F),O===i.UNSIGNED_BYTE&&(Z=i.R8),O===i.UNSIGNED_SHORT&&st&&(Z=st.R16_EXT),O===i.SHORT&&st&&(Z=st.R16_SNORM_EXT)),x===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(Z=i.R8UI),O===i.UNSIGNED_SHORT&&(Z=i.R16UI),O===i.UNSIGNED_INT&&(Z=i.R32UI),O===i.BYTE&&(Z=i.R8I),O===i.SHORT&&(Z=i.R16I),O===i.INT&&(Z=i.R32I)),x===i.RG&&(O===i.FLOAT&&(Z=i.RG32F),O===i.HALF_FLOAT&&(Z=i.RG16F),O===i.UNSIGNED_BYTE&&(Z=i.RG8),O===i.UNSIGNED_SHORT&&st&&(Z=st.RG16_EXT),O===i.SHORT&&st&&(Z=st.RG16_SNORM_EXT)),x===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(Z=i.RG8UI),O===i.UNSIGNED_SHORT&&(Z=i.RG16UI),O===i.UNSIGNED_INT&&(Z=i.RG32UI),O===i.BYTE&&(Z=i.RG8I),O===i.SHORT&&(Z=i.RG16I),O===i.INT&&(Z=i.RG32I)),x===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(Z=i.RGB8UI),O===i.UNSIGNED_SHORT&&(Z=i.RGB16UI),O===i.UNSIGNED_INT&&(Z=i.RGB32UI),O===i.BYTE&&(Z=i.RGB8I),O===i.SHORT&&(Z=i.RGB16I),O===i.INT&&(Z=i.RGB32I)),x===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(Z=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(Z=i.RGBA16UI),O===i.UNSIGNED_INT&&(Z=i.RGBA32UI),O===i.BYTE&&(Z=i.RGBA8I),O===i.SHORT&&(Z=i.RGBA16I),O===i.INT&&(Z=i.RGBA32I)),x===i.RGB&&(O===i.UNSIGNED_SHORT&&st&&(Z=st.RGB16_EXT),O===i.SHORT&&st&&(Z=st.RGB16_SNORM_EXT),O===i.UNSIGNED_INT_5_9_9_9_REV&&(Z=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&(Z=i.R11F_G11F_B10F)),x===i.RGBA){const Q=rt?kr:Wt.getTransfer(X);O===i.FLOAT&&(Z=i.RGBA32F),O===i.HALF_FLOAT&&(Z=i.RGBA16F),O===i.UNSIGNED_BYTE&&(Z=Q===Qt?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT&&st&&(Z=st.RGBA16_EXT),O===i.SHORT&&st&&(Z=st.RGBA16_SNORM_EXT),O===i.UNSIGNED_SHORT_4_4_4_4&&(Z=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(Z=i.RGB5_A1)}return(Z===i.R16F||Z===i.R32F||Z===i.RG16F||Z===i.RG32F||Z===i.RGBA16F||Z===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Z}h(S,"getInternalFormat");function T(w,x){let O;return w?x===null||x===1014||x===1020?O=i.DEPTH24_STENCIL8:x===1015?O=i.DEPTH32F_STENCIL8:x===1012&&(O=i.DEPTH24_STENCIL8,Tt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===1014||x===1020?O=i.DEPTH_COMPONENT24:x===1015?O=i.DEPTH_COMPONENT32F:x===1012&&(O=i.DEPTH_COMPONENT16),O}h(T,"getInternalDepthFormat");function b(w,x){return p(w)===true||w.isFramebufferTexture&&w.minFilter!==1003&&w.minFilter!==1006?Math.log2(Math.max(x.width,x.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?x.mipmaps.length:1}h(b,"getMipLevels");function C(w){const x=w.target;x.removeEventListener("dispose",C),A(x),x.isVideoTexture&&d.delete(x),x.isHTMLTexture&&f.delete(x)}h(C,"onTextureDispose");function v(w){const x=w.target;x.removeEventListener("dispose",v),F(x)}h(v,"onRenderTargetDispose");function A(w){const x=n.get(w);if(x.__webglInit===void 0)return;const O=w.source,V=m.get(O);if(V){const X=V[x.__cacheKey];X.usedTimes--,X.usedTimes===0&&P(w),Object.keys(V).length===0&&m.delete(O)}n.remove(w)}h(A,"deallocateTexture");function P(w){const x=n.get(w);i.deleteTexture(x.__webglTexture);const O=w.source,V=m.get(O);delete V[x.__cacheKey],a.memory.textures--}h(P,"deleteTexture");function F(w){const x=n.get(w);if(w.depthTexture&&(w.depthTexture.dispose(),n.remove(w.depthTexture)),w.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(x.__webglFramebuffer[V]))for(let X=0;X<x.__webglFramebuffer[V].length;X++)i.deleteFramebuffer(x.__webglFramebuffer[V][X]);else i.deleteFramebuffer(x.__webglFramebuffer[V]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[V])}else{if(Array.isArray(x.__webglFramebuffer))for(let V=0;V<x.__webglFramebuffer.length;V++)i.deleteFramebuffer(x.__webglFramebuffer[V]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let V=0;V<x.__webglColorRenderbuffer.length;V++)x.__webglColorRenderbuffer[V]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[V]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const O=w.textures;for(let V=0,X=O.length;V<X;V++){const rt=n.get(O[V]);rt.__webglTexture&&(i.deleteTexture(rt.__webglTexture),a.memory.textures--),n.remove(O[V])}n.remove(w)}h(F,"deallocateRenderTarget");let B=0;function k(){B=0}h(k,"resetTextureUnits");function N(){return B}h(N,"getTextureUnits");function H(w){B=w}h(H,"setTextureUnits");function $(){const w=B;return w>=r.maxTextures&&Tt("WebGLTextures: Trying to use "+(w+1)+" texture units while this GPU supports only "+r.maxTextures),B+=1,w}h($,"allocateTextureUnit");function K(w){const x=[];return x.push(w.wrapS),x.push(w.wrapT),x.push(w.wrapR||0),x.push(w.magFilter),x.push(w.minFilter),x.push(w.anisotropy),x.push(w.internalFormat),x.push(w.format),x.push(w.type),x.push(w.generateMipmaps),x.push(w.premultiplyAlpha),x.push(w.flipY),x.push(w.unpackAlignment),x.push(w.colorSpace),x.join()}h(K,"getTextureCacheKey");function it(w,x){const O=n.get(w);if(w.isVideoTexture&&U(w),w.isRenderTargetTexture===false&&w.isExternalTexture!==true&&w.version>0&&O.__version!==w.version){const V=w.image;if(V===null)Tt("WebGLRenderer: Texture marked for update but no image data found.");else if(V.complete===false)Tt("WebGLRenderer: Texture marked for update but image is incomplete");else{xt(O,w,x);return}}else w.isExternalTexture&&(O.__webglTexture=w.sourceTexture?w.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+x)}h(it,"setTexture2D");function q(w,x){const O=n.get(w);if(w.isRenderTargetTexture===false&&w.version>0&&O.__version!==w.version){xt(O,w,x);return}else w.isExternalTexture&&(O.__webglTexture=w.sourceTexture?w.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+x)}h(q,"setTexture2DArray");function tt(w,x){const O=n.get(w);if(w.isRenderTargetTexture===false&&w.version>0&&O.__version!==w.version){xt(O,w,x);return}e.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+x)}h(tt,"setTexture3D");function nt(w,x){const O=n.get(w);if(w.isCubeDepthTexture!==true&&w.version>0&&O.__version!==w.version){Dt(O,w,x);return}e.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+x)}h(nt,"setTextureCube");const wt={1e3:i.REPEAT,1001:i.CLAMP_TO_EDGE,1002:i.MIRRORED_REPEAT},At={1003:i.NEAREST,1004:i.NEAREST_MIPMAP_NEAREST,1005:i.NEAREST_MIPMAP_LINEAR,1006:i.LINEAR,1007:i.LINEAR_MIPMAP_NEAREST,1008:i.LINEAR_MIPMAP_LINEAR},re={512:i.NEVER,519:i.ALWAYS,513:i.LESS,515:i.LEQUAL,514:i.EQUAL,518:i.GEQUAL,516:i.GREATER,517:i.NOTEQUAL};function Xt(w,x){if(x.type===1015&&t.has("OES_texture_float_linear")===false&&(x.magFilter===1006||x.magFilter===1007||x.magFilter===1005||x.magFilter===1008||x.minFilter===1006||x.minFilter===1007||x.minFilter===1005||x.minFilter===1008)&&Tt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(w,i.TEXTURE_WRAP_S,wt[x.wrapS]),i.texParameteri(w,i.TEXTURE_WRAP_T,wt[x.wrapT]),(w===i.TEXTURE_3D||w===i.TEXTURE_2D_ARRAY)&&i.texParameteri(w,i.TEXTURE_WRAP_R,wt[x.wrapR]),i.texParameteri(w,i.TEXTURE_MAG_FILTER,At[x.magFilter]),i.texParameteri(w,i.TEXTURE_MIN_FILTER,At[x.minFilter]),x.compareFunction&&(i.texParameteri(w,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(w,i.TEXTURE_COMPARE_FUNC,re[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===true){if(x.magFilter===1003||x.minFilter!==1005&&x.minFilter!==1008||x.type===1015&&t.has("OES_texture_float_linear")===false)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");i.texParameterf(w,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}h(Xt,"setTextureParameters");function Zt(w,x){let O=false;w.__webglInit===void 0&&(w.__webglInit=true,x.addEventListener("dispose",C));const V=x.source;let X=m.get(V);X===void 0&&(X={},m.set(V,X));const rt=K(x);if(rt!==w.__cacheKey){X[rt]===void 0&&(X[rt]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,O=true),X[rt].usedTimes++;const st=X[w.__cacheKey];st!==void 0&&(X[w.__cacheKey].usedTimes--,st.usedTimes===0&&P(x)),w.__cacheKey=rt,w.__webglTexture=X[rt].texture}return O}h(Zt,"initTexture");function Y(w,x,O){return Math.floor(Math.floor(w/O)/x)}h(Y,"getRow");function j(w,x,O,V){const rt=w.updateRanges;if(rt.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,x.width,x.height,O,V,x.data);else{rt.sort((Et,ht)=>Et.start-ht.start);let st=0;for(let Et=1;Et<rt.length;Et++){const ht=rt[st],ot=rt[Et],bt=ht.start+ht.count,Ct=Y(ot.start,x.width,4),Ut=Y(ht.start,x.width,4);ot.start<=bt+1&&Ct===Ut&&Y(ot.start+ot.count-1,x.width,4)===Ct?ht.count=Math.max(ht.count,ot.start+ot.count-ht.start):(++st,rt[st]=ot)}rt.length=st+1;const Z=e.getParameter(i.UNPACK_ROW_LENGTH),Q=e.getParameter(i.UNPACK_SKIP_PIXELS),at=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,x.width);for(let Et=0,ht=rt.length;Et<ht;Et++){const ot=rt[Et],bt=Math.floor(ot.start/4),Ct=Math.ceil(ot.count/4),Ut=bt%x.width,L=Math.floor(bt/x.width),lt=Ct,J=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Ut),e.pixelStorei(i.UNPACK_SKIP_ROWS,L),e.texSubImage2D(i.TEXTURE_2D,0,Ut,L,lt,J,O,V,x.data)}w.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,Z),e.pixelStorei(i.UNPACK_SKIP_PIXELS,Q),e.pixelStorei(i.UNPACK_SKIP_ROWS,at)}}h(j,"updateTexture");function xt(w,x,O){let V=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(V=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(V=i.TEXTURE_3D);const X=Zt(w,x),rt=x.source;e.bindTexture(V,w.__webglTexture,i.TEXTURE0+O);const st=n.get(rt);if(rt.version!==st.__version||X===true){if(e.activeTexture(i.TEXTURE0+O),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===false){const J=Wt.getPrimaries(Wt.workingColorSpace),ct=x.colorSpace===wn?null:Wt.getPrimaries(x.colorSpace),pt=x.colorSpace===wn||J===ct?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,pt)}e.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment);let Q=g(x.image,false,r.maxTextureSize);Q=be(x,Q);const at=s.convert(x.format,x.colorSpace),Et=s.convert(x.type);let ht=S(x.internalFormat,at,Et,x.normalized,x.colorSpace,x.isVideoTexture);Xt(V,x);let ot;const bt=x.mipmaps,Ct=x.isVideoTexture!==true,Ut=st.__version===void 0||X===true,L=rt.dataReady,lt=b(x,Q);if(x.isDepthTexture)ht=T(x.format===1027,x.type),Ut&&(Ct?e.texStorage2D(i.TEXTURE_2D,1,ht,Q.width,Q.height):e.texImage2D(i.TEXTURE_2D,0,ht,Q.width,Q.height,0,at,Et,null));else if(x.isDataTexture)if(bt.length>0){Ct&&Ut&&e.texStorage2D(i.TEXTURE_2D,lt,ht,bt[0].width,bt[0].height);for(let J=0,ct=bt.length;J<ct;J++)ot=bt[J],Ct?L&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,ot.width,ot.height,at,Et,ot.data):e.texImage2D(i.TEXTURE_2D,J,ht,ot.width,ot.height,0,at,Et,ot.data);x.generateMipmaps=false}else Ct?(Ut&&e.texStorage2D(i.TEXTURE_2D,lt,ht,Q.width,Q.height),L&&j(x,Q,at,Et)):e.texImage2D(i.TEXTURE_2D,0,ht,Q.width,Q.height,0,at,Et,Q.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ct&&Ut&&e.texStorage3D(i.TEXTURE_2D_ARRAY,lt,ht,bt[0].width,bt[0].height,Q.depth);for(let J=0,ct=bt.length;J<ct;J++)if(ot=bt[J],x.format!==1023)if(at!==null)if(Ct){if(L)if(x.layerUpdates.size>0){const pt=Fh(ot.width,ot.height,x.format,x.type);for(const et of x.layerUpdates){const Rt=ot.data.subarray(et*pt/ot.data.BYTES_PER_ELEMENT,(et+1)*pt/ot.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,et,ot.width,ot.height,1,at,Rt)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,0,ot.width,ot.height,Q.depth,at,ot.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,J,ht,ot.width,ot.height,Q.depth,0,ot.data,0,0);else Tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ct?L&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,0,ot.width,ot.height,Q.depth,at,Et,ot.data):e.texImage3D(i.TEXTURE_2D_ARRAY,J,ht,ot.width,ot.height,Q.depth,0,at,Et,ot.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{Ct&&Ut&&e.texStorage2D(i.TEXTURE_2D,lt,ht,bt[0].width,bt[0].height);for(let J=0,ct=bt.length;J<ct;J++)ot=bt[J],x.format!==1023?at!==null?Ct?L&&e.compressedTexSubImage2D(i.TEXTURE_2D,J,0,0,ot.width,ot.height,at,ot.data):e.compressedTexImage2D(i.TEXTURE_2D,J,ht,ot.width,ot.height,0,ot.data):Tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ct?L&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,ot.width,ot.height,at,Et,ot.data):e.texImage2D(i.TEXTURE_2D,J,ht,ot.width,ot.height,0,at,Et,ot.data)}else if(x.isDataArrayTexture)if(Ct){if(Ut&&e.texStorage3D(i.TEXTURE_2D_ARRAY,lt,ht,Q.width,Q.height,Q.depth),L)if(x.layerUpdates.size>0){const J=Fh(Q.width,Q.height,x.format,x.type);for(const ct of x.layerUpdates){const pt=Q.data.subarray(ct*J/Q.data.BYTES_PER_ELEMENT,(ct+1)*J/Q.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,ct,Q.width,Q.height,1,at,Et,pt)}x.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,at,Et,Q.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,ht,Q.width,Q.height,Q.depth,0,at,Et,Q.data);else if(x.isData3DTexture)Ct?(Ut&&e.texStorage3D(i.TEXTURE_3D,lt,ht,Q.width,Q.height,Q.depth),L&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,at,Et,Q.data)):e.texImage3D(i.TEXTURE_3D,0,ht,Q.width,Q.height,Q.depth,0,at,Et,Q.data);else if(x.isFramebufferTexture){if(Ut)if(Ct)e.texStorage2D(i.TEXTURE_2D,lt,ht,Q.width,Q.height);else{let J=Q.width,ct=Q.height;for(let pt=0;pt<lt;pt++)e.texImage2D(i.TEXTURE_2D,pt,ht,J,ct,0,at,Et,null),J>>=1,ct>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in i){const J=i.canvas;if(J.hasAttribute("layoutsubtree")||J.setAttribute("layoutsubtree","true"),Q.parentNode!==J){J.appendChild(Q),f.add(x),J.onpaint=ct=>{const pt=ct.changedElements;for(const et of f)pt.includes(et.image)&&(et.needsUpdate=true)},J.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,Q);else{const pt=i.RGBA,et=i.RGBA,Rt=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,pt,et,Rt,Q)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(bt.length>0){if(Ct&&Ut){const J=Jt(bt[0]);e.texStorage2D(i.TEXTURE_2D,lt,ht,J.width,J.height)}for(let J=0,ct=bt.length;J<ct;J++)ot=bt[J],Ct?L&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,at,Et,ot):e.texImage2D(i.TEXTURE_2D,J,ht,at,Et,ot);x.generateMipmaps=false}else if(Ct){if(Ut){const J=Jt(Q);e.texStorage2D(i.TEXTURE_2D,lt,ht,J.width,J.height)}L&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,at,Et,Q)}else e.texImage2D(i.TEXTURE_2D,0,ht,at,Et,Q);p(x)&&E(V),st.__version=rt.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}h(xt,"uploadTexture");function Dt(w,x,O){if(x.image.length!==6)return;const V=Zt(w,x),X=x.source;e.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+O);const rt=n.get(X);if(X.version!==rt.__version||V===true){e.activeTexture(i.TEXTURE0+O);const st=Wt.getPrimaries(Wt.workingColorSpace),Z=x.colorSpace===wn?null:Wt.getPrimaries(x.colorSpace),Q=x.colorSpace===wn||st===Z?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Q);const at=x.isCompressedTexture||x.image[0].isCompressedTexture,Et=x.image[0]&&x.image[0].isDataTexture,ht=[];for(let et=0;et<6;et++)!at&&!Et?ht[et]=g(x.image[et],true,r.maxCubemapSize):ht[et]=Et?x.image[et].image:x.image[et],ht[et]=be(x,ht[et]);const ot=ht[0],bt=s.convert(x.format,x.colorSpace),Ct=s.convert(x.type),Ut=S(x.internalFormat,bt,Ct,x.normalized,x.colorSpace),L=x.isVideoTexture!==true,lt=rt.__version===void 0||V===true,J=X.dataReady;let ct=b(x,ot);Xt(i.TEXTURE_CUBE_MAP,x);let pt;if(at){L&&lt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,ct,Ut,ot.width,ot.height);for(let et=0;et<6;et++){pt=ht[et].mipmaps;for(let Rt=0;Rt<pt.length;Rt++){const Mt=pt[Rt];x.format!==1023?bt!==null?L?J&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,Rt,0,0,Mt.width,Mt.height,bt,Mt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,Rt,Ut,Mt.width,Mt.height,0,Mt.data):Tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):L?J&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,Rt,0,0,Mt.width,Mt.height,bt,Ct,Mt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,Rt,Ut,Mt.width,Mt.height,0,bt,Ct,Mt.data)}}}else{if(pt=x.mipmaps,L&&lt){pt.length>0&&ct++;const et=Jt(ht[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,ct,Ut,et.width,et.height)}for(let et=0;et<6;et++)if(Et){L?J&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,0,0,0,ht[et].width,ht[et].height,bt,Ct,ht[et].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,0,Ut,ht[et].width,ht[et].height,0,bt,Ct,ht[et].data);for(let Rt=0;Rt<pt.length;Rt++){const ae=pt[Rt].image[et].image;L?J&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,Rt+1,0,0,ae.width,ae.height,bt,Ct,ae.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,Rt+1,Ut,ae.width,ae.height,0,bt,Ct,ae.data)}}else{L?J&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,0,0,0,bt,Ct,ht[et]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,0,Ut,bt,Ct,ht[et]);for(let Rt=0;Rt<pt.length;Rt++){const Mt=pt[Rt];L?J&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,Rt+1,0,0,bt,Ct,Mt.image[et]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+et,Rt+1,Ut,bt,Ct,Mt.image[et])}}}p(x)&&E(i.TEXTURE_CUBE_MAP),rt.__version=X.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}h(Dt,"uploadCubeTexture");function gt(w,x,O,V,X,rt){const st=s.convert(O.format,O.colorSpace),Z=s.convert(O.type),Q=S(O.internalFormat,st,Z,O.normalized,O.colorSpace),at=n.get(x),Et=n.get(O);if(Et.__renderTarget=x,!at.__hasExternalTextures){const ht=Math.max(1,x.width>>rt),ot=Math.max(1,x.height>>rt);X===i.TEXTURE_3D||X===i.TEXTURE_2D_ARRAY?e.texImage3D(X,rt,Q,ht,ot,x.depth,0,st,Z,null):e.texImage2D(X,rt,Q,ht,ot,0,st,Z,null)}e.bindFramebuffer(i.FRAMEBUFFER,w),me(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,V,X,Et.__webglTexture,0,ue(x)):(X===i.TEXTURE_2D||X>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&X<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,V,X,Et.__webglTexture,rt),e.bindFramebuffer(i.FRAMEBUFFER,null)}h(gt,"setupFrameBufferTexture");function zt(w,x,O){if(i.bindRenderbuffer(i.RENDERBUFFER,w),x.depthBuffer){const V=x.depthTexture,X=V&&V.isDepthTexture?V.type:null,rt=T(x.stencilBuffer,X),st=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;me(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ue(x),rt,x.width,x.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,ue(x),rt,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,rt,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,st,i.RENDERBUFFER,w)}else{const V=x.textures;for(let X=0;X<V.length;X++){const rt=V[X],st=s.convert(rt.format,rt.colorSpace),Z=s.convert(rt.type),Q=S(rt.internalFormat,st,Z,rt.normalized,rt.colorSpace);me(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ue(x),Q,x.width,x.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,ue(x),Q,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,Q,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}h(zt,"setupRenderBufferStorage");function xe(w,x,O){const V=x.isWebGLCubeRenderTarget===true;if(e.bindFramebuffer(i.FRAMEBUFFER,w),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const X=n.get(x.depthTexture);if(X.__renderTarget=x,(!X.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=true),V){if(X.__webglInit===void 0&&(X.__webglInit=true,x.depthTexture.addEventListener("dispose",C)),X.__webglTexture===void 0){X.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),Xt(i.TEXTURE_CUBE_MAP,x.depthTexture);const at=s.convert(x.depthTexture.format),Et=s.convert(x.depthTexture.type);let ht;x.depthTexture.format===1026?ht=i.DEPTH_COMPONENT24:x.depthTexture.format===1027&&(ht=i.DEPTH24_STENCIL8);for(let ot=0;ot<6;ot++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0,ht,x.width,x.height,0,at,Et,null)}}else it(x.depthTexture,0);const rt=X.__webglTexture,st=ue(x),Z=V?i.TEXTURE_CUBE_MAP_POSITIVE_X+O:i.TEXTURE_2D,Q=x.depthTexture.format===1027?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(x.depthTexture.format===1026)me(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Q,Z,rt,0,st):i.framebufferTexture2D(i.FRAMEBUFFER,Q,Z,rt,0);else if(x.depthTexture.format===1027)me(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Q,Z,rt,0,st):i.framebufferTexture2D(i.FRAMEBUFFER,Q,Z,rt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}h(xe,"setupDepthTexture");function Vt(w){const x=n.get(w),O=w.isWebGLCubeRenderTarget===true;if(x.__boundDepthTexture!==w.depthTexture){const V=w.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),V){const X=h(()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,V.removeEventListener("dispose",X)},"disposeEvent");V.addEventListener("dispose",X),x.__depthDisposeCallback=X}x.__boundDepthTexture=V}if(w.depthTexture&&!x.__autoAllocateDepthBuffer)if(O)for(let V=0;V<6;V++)xe(x.__webglFramebuffer[V],w,V);else{const V=w.texture.mipmaps;V&&V.length>0?xe(x.__webglFramebuffer[0],w,0):xe(x.__webglFramebuffer,w,0)}else if(O){x.__webglDepthbuffer=[];for(let V=0;V<6;V++)if(e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[V]),x.__webglDepthbuffer[V]===void 0)x.__webglDepthbuffer[V]=i.createRenderbuffer(),zt(x.__webglDepthbuffer[V],w,false);else{const X=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,rt=x.__webglDepthbuffer[V];i.bindRenderbuffer(i.RENDERBUFFER,rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,X,i.RENDERBUFFER,rt)}}else{const V=w.texture.mipmaps;if(V&&V.length>0?e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),zt(x.__webglDepthbuffer,w,false);else{const X=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,rt=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,X,i.RENDERBUFFER,rt)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}h(Vt,"setupDepthRenderbuffer");function Yt(w,x,O){const V=n.get(w);x!==void 0&&gt(V.__webglFramebuffer,w,w.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&Vt(w)}h(Yt,"rebindTextures");function se(w){const x=w.texture,O=n.get(w),V=n.get(x);w.addEventListener("dispose",v);const X=w.textures,rt=w.isWebGLCubeRenderTarget===true,st=X.length>1;if(st||(V.__webglTexture===void 0&&(V.__webglTexture=i.createTexture()),V.__version=x.version,a.memory.textures++),rt){O.__webglFramebuffer=[];for(let Z=0;Z<6;Z++)if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer[Z]=[];for(let Q=0;Q<x.mipmaps.length;Q++)O.__webglFramebuffer[Z][Q]=i.createFramebuffer()}else O.__webglFramebuffer[Z]=i.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer=[];for(let Z=0;Z<x.mipmaps.length;Z++)O.__webglFramebuffer[Z]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(st)for(let Z=0,Q=X.length;Z<Q;Z++){const at=n.get(X[Z]);at.__webglTexture===void 0&&(at.__webglTexture=i.createTexture(),a.memory.textures++)}if(w.samples>0&&me(w)===false){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let Z=0;Z<X.length;Z++){const Q=X[Z];O.__webglColorRenderbuffer[Z]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[Z]);const at=s.convert(Q.format,Q.colorSpace),Et=s.convert(Q.type),ht=S(Q.internalFormat,at,Et,Q.normalized,Q.colorSpace,w.isXRRenderTarget===true),ot=ue(w);i.renderbufferStorageMultisample(i.RENDERBUFFER,ot,ht,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Z,i.RENDERBUFFER,O.__webglColorRenderbuffer[Z])}i.bindRenderbuffer(i.RENDERBUFFER,null),w.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),zt(O.__webglDepthRenderbuffer,w,true)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(rt){e.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture),Xt(i.TEXTURE_CUBE_MAP,x);for(let Z=0;Z<6;Z++)if(x.mipmaps&&x.mipmaps.length>0)for(let Q=0;Q<x.mipmaps.length;Q++)gt(O.__webglFramebuffer[Z][Q],w,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Z,Q);else gt(O.__webglFramebuffer[Z],w,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0);p(x)&&E(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(st){for(let Z=0,Q=X.length;Z<Q;Z++){const at=X[Z],Et=n.get(at);let ht=i.TEXTURE_2D;(w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(ht=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ht,Et.__webglTexture),Xt(ht,at),gt(O.__webglFramebuffer,w,at,i.COLOR_ATTACHMENT0+Z,ht,0),p(at)&&E(ht)}e.unbindTexture()}else{let Z=i.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(Z=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(Z,V.__webglTexture),Xt(Z,x),x.mipmaps&&x.mipmaps.length>0)for(let Q=0;Q<x.mipmaps.length;Q++)gt(O.__webglFramebuffer[Q],w,x,i.COLOR_ATTACHMENT0,Z,Q);else gt(O.__webglFramebuffer,w,x,i.COLOR_ATTACHMENT0,Z,0);p(x)&&E(Z),e.unbindTexture()}w.depthBuffer&&Vt(w)}h(se,"setupRenderTarget");function Ht(w){const x=w.textures;for(let O=0,V=x.length;O<V;O++){const X=x[O];if(p(X)){const rt=R(w),st=n.get(X).__webglTexture;e.bindTexture(rt,st),E(rt),e.unbindTexture()}}}h(Ht,"updateRenderTargetMipmap");const he=[],ye=[];function De(w){if(w.samples>0){if(me(w)===false){const x=w.textures,O=w.width,V=w.height;let X=i.COLOR_BUFFER_BIT;const rt=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,st=n.get(w),Z=x.length>1;if(Z)for(let at=0;at<x.length;at++)e.bindFramebuffer(i.FRAMEBUFFER,st.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,st.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,st.__webglMultisampledFramebuffer);const Q=w.texture.mipmaps;Q&&Q.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,st.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,st.__webglFramebuffer);for(let at=0;at<x.length;at++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(X|=i.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(X|=i.STENCIL_BUFFER_BIT)),Z){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,st.__webglColorRenderbuffer[at]);const Et=n.get(x[at]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Et,0)}i.blitFramebuffer(0,0,O,V,0,0,O,V,X,i.NEAREST),c===true&&(he.length=0,ye.length=0,he.push(i.COLOR_ATTACHMENT0+at),w.depthBuffer&&w.storeMultisampledDepthBuffer===false&&(he.push(rt),ye.push(rt),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,ye)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,he))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Z)for(let at=0;at<x.length;at++){e.bindFramebuffer(i.FRAMEBUFFER,st.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,st.__webglColorRenderbuffer[at]);const Et=n.get(x[at]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,st.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,Et,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,st.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.storeMultisampledDepthBuffer===false&&c){const x=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}h(De,"updateMultisampleRenderTarget");function ue(w){return Math.min(r.maxSamples,w.samples)}h(ue,"getRenderTargetSamples");function me(w){const x=n.get(w);return w.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===true&&x.__useRenderToTexture!==false}h(me,"useMultisampledRTT");function U(w){const x=a.render.frame;d.get(w)!==x&&(d.set(w,x),w.update())}h(U,"updateVideoTexture");function be(w,x){const O=w.colorSpace,V=w.format,X=w.type;return w.isCompressedTexture===true||w.isVideoTexture===true||O!==Vr&&O!==wn&&(Wt.getTransfer(O)===Qt?(V!==1023||X!==1009)&&Tt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Pt("WebGLTextures: Unsupported texture color space:",O)),x}h(be,"verifyColorSpace");function Jt(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(l.width=w.naturalWidth||w.width,l.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(l.width=w.displayWidth,l.height=w.displayHeight):(l.width=w.width,l.height=w.height),l}h(Jt,"getDimensions"),this.allocateTextureUnit=$,this.resetTextureUnits=k,this.getTextureUnits=N,this.setTextureUnits=H,this.setTexture2D=it,this.setTexture2DArray=q,this.setTexture3D=tt,this.setTextureCube=nt,this.rebindTextures=Yt,this.setupRenderTarget=se,this.updateRenderTargetMipmap=Ht,this.updateMultisampleRenderTarget=De,this.setupDepthRenderbuffer=Vt,this.setupFrameBufferTexture=gt,this.useMultisampledRTT=me,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}h(z_,"WebGLTextures");function G_(i,t){function e(n,r=wn){let s;const a=Wt.getTransfer(r);if(n===1009)return i.UNSIGNED_BYTE;if(n===1017)return i.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return i.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return i.BYTE;if(n===1011)return i.SHORT;if(n===1012)return i.UNSIGNED_SHORT;if(n===1013)return i.INT;if(n===1014)return i.UNSIGNED_INT;if(n===1015)return i.FLOAT;if(n===1016)return i.HALF_FLOAT;if(n===1021)return i.ALPHA;if(n===1022)return i.RGB;if(n===1023)return i.RGBA;if(n===1026)return i.DEPTH_COMPONENT;if(n===1027)return i.DEPTH_STENCIL;if(n===1028)return i.RED;if(n===1029)return i.RED_INTEGER;if(n===1030)return i.RG;if(n===1031)return i.RG_INTEGER;if(n===1033)return i.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779)if(a===Qt)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===33776)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===33776)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===35840||n===35841||n===35842||n===35843)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===35840)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===36196||n===37492)return a===Qt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===37496)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return s.COMPRESSED_R11_EAC;if(n===37489)return s.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return s.COMPRESSED_RG11_EAC;if(n===37491)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===37808)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===Qt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===36492||n===36494||n===36495)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===36492)return a===Qt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===36283||n===36284||n===36285||n===36286)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===36283)return s.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===1020?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return h(e,"convert"),{convert:e}}h(G_,"WebGLUtils");const V_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,k_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,jl=class jl2{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new es(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new We({vertexShader:V_,fragmentShader:k_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Ne(new ns(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}};h(jl,"WebXRDepthSensing");let Ka=jl;const tc=class tc2 extends sn{constructor(t,e){super();const n=this;let r=null,s=1,a=null,o="local-floor",c=1,l=null,d=null,f=null,u=null,m=null,_=null;const y=typeof XRWebGLBinding<"u",g=new Ka,p={},E=e.getContextAttributes();let R=null,S=null;const T=[],b=[],C=new It;let v=null,A=null;const P=new Ie;P.viewport=new ee;const F=new Ie;F.viewport=new ee;const B=[P,F],k=new Oa;let N=null,H=null;this.cameraAutoUpdate=true,this.enabled=false,this.isPresenting=false,this.getController=function(Y){let j=T[Y];return j===void 0&&(j=new Vi,T[Y]=j),j.getTargetRaySpace()},this.getControllerGrip=function(Y){let j=T[Y];return j===void 0&&(j=new Vi,T[Y]=j),j.getGripSpace()},this.getHand=function(Y){let j=T[Y];return j===void 0&&(j=new Vi,T[Y]=j),j.getHandSpace()};function $(Y){const j=b.indexOf(Y.inputSource);if(j===-1)return;const xt=T[j];xt!==void 0&&(xt.update(Y.inputSource,Y.frame,l||a),xt.dispatchEvent({type:Y.type,data:Y.inputSource}))}h($,"onSessionEvent");function K(){r.removeEventListener("select",$),r.removeEventListener("selectstart",$),r.removeEventListener("selectend",$),r.removeEventListener("squeeze",$),r.removeEventListener("squeezestart",$),r.removeEventListener("squeezeend",$),r.removeEventListener("end",K),r.removeEventListener("inputsourceschange",it);for(let Y=0;Y<T.length;Y++){const j=b[Y];j!==null&&(b[Y]=null,T[Y].disconnect(j))}N=null,H=null,g.reset();for(const Y in p)delete p[Y];if(t.setRenderTarget(R),m=null,u=null,f=null,r=null,S=null,Zt.stop(),n.isPresenting=false,t.setPixelRatio(v),t.setSize(C.width,C.height,false),A!==null){const Y=A.camera;Y.fov=A.fov,Y.zoom=A.zoom,Y.updateProjectionMatrix(),A=null}n.dispatchEvent({type:"sessionend"})}h(K,"onSessionEnd"),this.setFramebufferScaleFactor=function(Y){s=Y,n.isPresenting===true&&Tt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){o=Y,n.isPresenting===true&&Tt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(Y){l=Y},this.getBaseLayer=function(){return u!==null?u:m},this.getBinding=function(){return f===null&&y&&(f=new XRWebGLBinding(r,e)),f},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(Y){if(r=Y,r!==null){if(R=t.getRenderTarget(),r.addEventListener("select",$),r.addEventListener("selectstart",$),r.addEventListener("selectend",$),r.addEventListener("squeeze",$),r.addEventListener("squeezestart",$),r.addEventListener("squeezeend",$),r.addEventListener("end",K),r.addEventListener("inputsourceschange",it),E.xrCompatible!==true&&await e.makeXRCompatible(),v=t.getPixelRatio(),t.getSize(C),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let xt=null,Dt=null,gt=null;E.depth&&(gt=E.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,xt=E.stencil?1027:1026,Dt=E.stencil?1020:1014);const zt={colorFormat:e.RGBA8,depthFormat:gt,scaleFactor:s};f=this.getBinding(),u=f.createProjectionLayer(zt),r.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,false),S=new Be(u.textureWidth,u.textureHeight,{format:1023,type:1009,depthTexture:new zn(u.textureWidth,u.textureHeight,Dt,void 0,void 0,void 0,void 0,void 0,void 0,xt),stencilBuffer:E.stencil,colorSpace:t.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===false,resolveStencilBuffer:u.ignoreDepthValues===false,storeMultisampledDepthBuffer:u.ignoreDepthValues===false,storeMultisampledStencilBuffer:u.ignoreDepthValues===false})}else{const xt={antialias:E.antialias,alpha:true,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,e,xt),r.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,false),S=new Be(m.framebufferWidth,m.framebufferHeight,{format:1023,type:1009,colorSpace:t.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:m.ignoreDepthValues===false,resolveStencilBuffer:m.ignoreDepthValues===false,storeMultisampledDepthBuffer:m.ignoreDepthValues===false,storeMultisampledStencilBuffer:m.ignoreDepthValues===false})}S.isXRRenderTarget=true,this.setFoveation(c),l=null,a=await r.requestReferenceSpace(o),Zt.setContext(r),Zt.start(),n.isPresenting=true,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function it(Y){for(let j=0;j<Y.removed.length;j++){const xt=Y.removed[j],Dt=b.indexOf(xt);Dt>=0&&(b[Dt]=null,T[Dt].disconnect(xt))}for(let j=0;j<Y.added.length;j++){const xt=Y.added[j];let Dt=b.indexOf(xt);if(Dt===-1){for(let zt=0;zt<T.length;zt++)if(zt>=b.length){b.push(xt),Dt=zt;break}else if(b[zt]===null){b[zt]=xt,Dt=zt;break}if(Dt===-1)break}const gt=T[Dt];gt&&gt.connect(xt)}}h(it,"onInputSourcesChange");const q=new D,tt=new D;function nt(Y,j,xt){q.setFromMatrixPosition(j.matrixWorld),tt.setFromMatrixPosition(xt.matrixWorld);const Dt=q.distanceTo(tt),gt=j.projectionMatrix.elements,zt=xt.projectionMatrix.elements,xe=gt[14]/(gt[10]-1),Vt=gt[14]/(gt[10]+1),Yt=(gt[9]+1)/gt[5],se=(gt[9]-1)/gt[5],Ht=(gt[8]-1)/gt[0],he=(zt[8]+1)/zt[0],ye=xe*Ht,De=xe*he,ue=Dt/(-Ht+he),me=ue*-Ht;if(j.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(me),Y.translateZ(ue),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),gt[10]===-1)Y.projectionMatrix.copy(j.projectionMatrix),Y.projectionMatrixInverse.copy(j.projectionMatrixInverse);else{const U=xe+ue,be=Vt+ue,Jt=ye-me,w=De+(Dt-me),x=Yt*Vt/be*U,O=se*Vt/be*U;Y.projectionMatrix.makePerspective(Jt,w,x,O,U,be),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}h(nt,"setProjectionFromUnion");function wt(Y,j){j===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(j.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}h(wt,"updateCamera"),this.updateCamera=function(Y){if(r===null)return;let j=Y.near,xt=Y.far;g.texture!==null&&(g.depthNear>0&&(j=g.depthNear),g.depthFar>0&&(xt=g.depthFar)),k.near=F.near=P.near=j,k.far=F.far=P.far=xt,(N!==k.near||H!==k.far)&&(r.updateRenderState({depthNear:k.near,depthFar:k.far}),N=k.near,H=k.far),k.layers.mask=Y.layers.mask|6,P.layers.mask=k.layers.mask&-5,F.layers.mask=k.layers.mask&-3;const Dt=Y.parent,gt=k.cameras;wt(k,Dt);for(let zt=0;zt<gt.length;zt++)wt(gt[zt],Dt);gt.length===2?nt(k,P,F):k.projectionMatrix.copy(P.projectionMatrix),A===null&&Y.isPerspectiveCamera&&(A={camera:Y,fov:Y.fov,zoom:Y.zoom}),At(Y,k,Dt)};function At(Y,j,xt){xt===null?Y.matrix.copy(j.matrixWorld):(Y.matrix.copy(xt.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(j.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(true),Y.projectionMatrix.copy(j.projectionMatrix),Y.projectionMatrixInverse.copy(j.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=Si*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}h(At,"updateUserCamera"),this.getCamera=function(){return k},this.getFoveation=function(){if(!(u===null&&m===null))return c},this.setFoveation=function(Y){c=Y,u!==null&&(u.fixedFoveation=Y),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=Y)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(k)},this.getCameraTexture=function(Y){return p[Y]};let re=null;function Xt(Y,j){if(d=j.getViewerPose(l||a),_=j,d!==null){const xt=d.views;m!==null&&(t.setRenderTargetFramebuffer(S,m.framebuffer),t.setRenderTarget(S));let Dt=false;xt.length!==k.cameras.length&&(k.cameras.length=0,Dt=true);for(let Vt=0;Vt<xt.length;Vt++){const Yt=xt[Vt];let se=null;if(m!==null)se=m.getViewport(Yt);else{const he=f.getViewSubImage(u,Yt);se=he.viewport,Vt===0&&(t.setRenderTargetTextures(S,he.colorTexture,he.depthStencilTexture),t.setRenderTarget(S))}let Ht=B[Vt];Ht===void 0&&(Ht=new Ie,Ht.layers.enable(Vt),Ht.viewport=new ee,B[Vt]=Ht),Ht.matrix.fromArray(Yt.transform.matrix),Ht.matrix.decompose(Ht.position,Ht.quaternion,Ht.scale),Ht.projectionMatrix.fromArray(Yt.projectionMatrix),Ht.projectionMatrixInverse.copy(Ht.projectionMatrix).invert(),Ht.viewport.set(se.x,se.y,se.width,se.height),Vt===0&&(k.matrix.copy(Ht.matrix),k.matrix.decompose(k.position,k.quaternion,k.scale)),Dt===true&&k.cameras.push(Ht)}const gt=r.enabledFeatures;if(gt&&gt.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&y){f=n.getBinding();const Vt=f.getDepthInformation(xt[0]);Vt&&Vt.isValid&&Vt.texture&&g.init(Vt,r.renderState)}if(gt&&gt.includes("camera-access")&&y){t.state.unbindTexture(),f=n.getBinding();for(let Vt=0;Vt<xt.length;Vt++){const Yt=xt[Vt].camera;if(Yt){let se=p[Yt];se||(se=new es,p[Yt]=se);const Ht=f.getCameraImage(Yt);se.sourceTexture=Ht}}}}for(let xt=0;xt<T.length;xt++){const Dt=b[xt],gt=T[xt];Dt!==null&&gt!==void 0&&gt.update(Dt,j,l||a)}re&&re(Y,j),j.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:j}),_=null}h(Xt,"onAnimationFrame");const Zt=new pu;Zt.setAnimationLoop(Xt),this.setAnimationLoop=function(Y){re=Y},this.dispose=function(){}}};h(tc,"WebXRManager");let Ja=tc;const H_=new Gt,Su=new Lt;Su.set(-1,0,0,0,1,0,0,0,1);function W_(i,t){function e(g,p){g.matrixAutoUpdate===true&&g.updateMatrix(),p.value.copy(g.matrix)}h(e,"refreshTransformUniform");function n(g,p){p.color.getRGB(g.fogColor.value,du(i)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}h(n,"refreshFogUniforms");function r(g,p,E,R,S){p.isNodeMaterial?p.uniformsNeedUpdate=false:p.isMeshBasicMaterial?s(g,p):p.isMeshLambertMaterial?(s(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(g,p),f(g,p)):p.isMeshPhongMaterial?(s(g,p),d(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(g,p),u(g,p),p.isMeshPhysicalMaterial&&m(g,p,S)):p.isMeshMatcapMaterial?(s(g,p),_(g,p)):p.isMeshDepthMaterial?s(g,p):p.isMeshDistanceMaterial?(s(g,p),y(g,p)):p.isMeshNormalMaterial?s(g,p):p.isLineBasicMaterial?(a(g,p),p.isLineDashedMaterial&&o(g,p)):p.isPointsMaterial?c(g,p,E,R):p.isSpriteMaterial?l(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=false)}h(r,"refreshMaterialUniforms");function s(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,e(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===1&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,e(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===1&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,e(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,e(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);const E=t.get(p),R=E.envMap,S=E.envMapRotation;R&&(g.envMap.value=R,g.envMapRotation.value.setFromMatrix4(H_.makeRotationFromEuler(S)).transpose(),R.isCubeTexture&&R.isRenderTargetTexture===false&&g.envMapRotation.value.premultiply(Su),g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,g.aoMapTransform))}h(s,"refreshUniformsCommon");function a(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform))}h(a,"refreshUniformsLine");function o(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}h(o,"refreshUniformsDash");function c(g,p,E,R){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*E,g.scale.value=R*.5,p.map&&(g.map.value=p.map,e(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}h(c,"refreshUniformsPoints");function l(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}h(l,"refreshUniformsSprites");function d(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}h(d,"refreshUniformsPhong");function f(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}h(f,"refreshUniformsToon");function u(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}h(u,"refreshUniformsStandard");function m(g,p,E){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===1&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.retroreflectivity>0&&(g.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=E.texture,g.transmissionSamplerSize.value.set(E.width,E.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,g.specularIntensityMapTransform))}h(m,"refreshUniformsPhysical");function _(g,p){p.matcap&&(g.matcap.value=p.matcap)}h(_,"refreshUniformsMatcap");function y(g,p){const E=t.get(p).light;g.referencePosition.value.setFromMatrixPosition(E.matrixWorld),g.nearDistance.value=E.shadow.camera.near,g.farDistance.value=E.shadow.camera.far}return h(y,"refreshUniformsDistance"),{refreshFogUniforms:n,refreshMaterialUniforms:r}}h(W_,"WebGLMaterials");function X_(i,t,e,n){let r={},s={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(S,T){const b=T.program;n.uniformBlockBinding(S,b)}h(c,"bind");function l(S,T){let b=r[S.id];b===void 0&&(g(S),b=d(S),r[S.id]=b,S.addEventListener("dispose",E));const C=T.program;n.updateUBOMapping(S,C);const v=t.render.frame;s[S.id]!==v&&(u(S),s[S.id]=v)}h(l,"update");function d(S){const T=f();S.__bindingPointIndex=T;const b=i.createBuffer(),C=S.__size,v=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,b),i.bufferData(i.UNIFORM_BUFFER,C,v),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,T,b),b}h(d,"createBuffer");function f(){for(let S=0;S<o;S++)if(a.indexOf(S)===-1)return a.push(S),S;return Pt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}h(f,"allocateBindingPointIndex");function u(S){const T=r[S.id],b=S.uniforms,C=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let v=0,A=b.length;v<A;v++){const P=b[v];if(Array.isArray(P))for(let F=0,B=P.length;F<B;F++)m(P[F],v,F,C);else m(P,v,0,C)}i.bindBuffer(i.UNIFORM_BUFFER,null)}h(u,"updateBufferData");function m(S,T,b,C){if(y(S,T,b,C)===true){const v=S.__offset,A=S.value;if(Array.isArray(A)){let P=0;for(let F=0;F<A.length;F++){const B=A[F],k=p(B);_(B,S.__data,P),typeof B!="number"&&typeof B!="boolean"&&!B.isMatrix3&&!ArrayBuffer.isView(B)&&(P+=k.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(A,S.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,v,S.__data)}}h(m,"updateUniform");function _(S,T,b){typeof S=="number"||typeof S=="boolean"?T[0]=S:S.isMatrix3?(T[0]=S.elements[0],T[1]=S.elements[1],T[2]=S.elements[2],T[3]=0,T[4]=S.elements[3],T[5]=S.elements[4],T[6]=S.elements[5],T[7]=0,T[8]=S.elements[6],T[9]=S.elements[7],T[10]=S.elements[8],T[11]=0):ArrayBuffer.isView(S)?T.set(new S.constructor(S.buffer,S.byteOffset,T.length)):S.toArray(T,b)}h(_,"writeUniformValue");function y(S,T,b,C){const v=S.value,A=T+"_"+b;if(C[A]===void 0)return typeof v=="number"||typeof v=="boolean"?C[A]=v:ArrayBuffer.isView(v)?C[A]=v.slice():C[A]=v.clone(),true;{const P=C[A];if(typeof v=="number"||typeof v=="boolean"){if(P!==v)return C[A]=v,true}else{if(ArrayBuffer.isView(v))return true;if(P.equals(v)===false)return P.copy(v),true}}return false}h(y,"hasUniformChanged");function g(S){const T=S.uniforms;let b=0;const C=16;for(let A=0,P=T.length;A<P;A++){const F=Array.isArray(T[A])?T[A]:[T[A]];for(let B=0,k=F.length;B<k;B++){const N=F[B],H=Array.isArray(N.value)?N.value:[N.value];for(let $=0,K=H.length;$<K;$++){const it=H[$],q=p(it),tt=b%C,nt=tt%q.boundary,wt=tt+nt;b+=nt,wt!==0&&C-wt<q.storage&&(b+=C-wt),N.__data=new Float32Array(q.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=b,b+=q.storage}}}const v=b%C;return v>0&&(b+=C-v),S.__size=b,S.__cache={},this}h(g,"prepareUniformsGroup");function p(S){const T={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(T.boundary=4,T.storage=4):S.isVector2?(T.boundary=8,T.storage=8):S.isVector3||S.isColor?(T.boundary=16,T.storage=12):S.isVector4?(T.boundary=16,T.storage=16):S.isMatrix3?(T.boundary=48,T.storage=48):S.isMatrix4?(T.boundary=64,T.storage=64):S.isTexture?Tt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(S)?(T.boundary=16,T.storage=S.byteLength):Tt("WebGLRenderer: Unsupported uniform value type.",S),T}h(p,"getUniformSize");function E(S){const T=S.target;T.removeEventListener("dispose",E);const b=a.indexOf(T.__bindingPointIndex);a.splice(b,1),i.deleteBuffer(r[T.id]),delete r[T.id],delete s[T.id]}h(E,"onUniformsGroupsDispose");function R(){for(const S in r)i.deleteBuffer(r[S]);a=[],r={},s={}}return h(R,"dispose"),{bind:c,update:l,dispose:R}}h(X_,"WebGLUniformsGroups");const q_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let en=null;function Y_(){return en===null&&(en=new qi(q_,16,16,1030,1016),en.name="DFG_LUT",en.minFilter=1006,en.magFilter=1006,en.wrapS=1001,en.wrapT=1001,en.generateMipmaps=false,en.needsUpdate=true),en}h(Y_,"getDFGLUT");const ec=class ec2{constructor(t={}){const{canvas:e=Du(),context:n=null,depth:r=true,stencil:s=false,alpha:a=false,antialias:o=false,premultipliedAlpha:c=true,preserveDrawingBuffer:l=false,powerPreference:d="default",failIfMajorPerformanceCaveat:f=false,reversedDepthBuffer:u=false,outputBufferType:m=1009}=t;this.isWebGLRenderer=true;let _;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=n.getContextAttributes().alpha}else _=a;const y=m,g=new Set([1033,1031,1029]),p=new Set([1009,1014,1012,1020,1017,1018]),E=new Uint32Array(4),R=new Int32Array(4),S=new D;let T=null,b=null;const C=[],v=[];let A=null;this.domElement=e,this.debug={checkShaderErrors:true,diagnostics:{keywords:false},onShaderError:null},this.autoClear=true,this.autoClearColor=true,this.autoClearDepth=true,this.autoClearStencil=true,this.sortObjects=true,this.clippingPlanes=[],this.localClippingEnabled=false,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const P=this;let F=false,B=null,k=null,N=null,H=null;this._outputColorSpace=ke;let $=0,K=0,it=null,q=-1,tt=null;const nt=new ee,wt=new ee;let At=null;const re=new Ft(0);let Xt=0,Zt=e.width,Y=e.height,j=1,xt=null,Dt=null;const gt=new ee(0,0,Zt,Y),zt=new ee(0,0,Zt,Y);let xe=false;const Vt=new Yi;let Yt=false,se=false;const Ht=new Gt,he=new D,ye=new ee,De={background:null,fog:null,environment:null,overrideMaterial:null,isScene:true};let ue=false;function me(){return it===null?j:1}h(me,"getTargetPixelRatio");let U=n;function be(M,I){return e.getContext(M,I)}h(be,"getContext");let Jt,w,x,O,V,X,rt,st,Z,Q,at,Et,ht,ot,bt,Ct,Ut,L,lt,J,ct,pt,et;try{const M={alpha:true,depth:r,stencil:s,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Qa}`),e.addEventListener("webglcontextlost",ae,false),e.addEventListener("webglcontextrestored",$t,false),e.addEventListener("webglcontextcreationerror",Xe,false),U===null){const I="webgl2";if(U=be(I,M),U===null)throw be(I)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Rt()}catch(M){throw e.removeEventListener("webglcontextlost",ae,false),e.removeEventListener("webglcontextrestored",$t,false),e.removeEventListener("webglcontextcreationerror",Xe,false),Pt("WebGLRenderer: "+M.message),M}function Rt(){Jt=new tg(U),Jt.init(),ct=new G_(U,Jt),w=new Wm(U,Jt,t,ct),x=new O_(U,Jt),w.reversedDepthBuffer&&u&&x.buffers.depth.setReversed(true),k=U.createFramebuffer(),N=U.createFramebuffer(),H=U.createFramebuffer(),O=new ig(U),V=new b_,X=new z_(U,Jt,x,V,w,ct,O),rt=new jm(P),st=new sf(U),pt=new km(U,st),Z=new eg(U,st,O,pt),Q=new sg(U,Z,st,pt,O),L=new rg(U,w,X),bt=new Xm(V),at=new E_(P,rt,Jt,w,pt,bt),Et=new W_(P,V),ht=new A_,ot=new D_(Jt),Ut=new Vm(P,rt,x,Q,_,c),Ct=new B_(P,Q,w),et=new X_(U,O,w,x),lt=new Hm(U,Jt,O),J=new ng(U,Jt,O),O.programs=at.programs,P.capabilities=w,P.extensions=Jt,P.properties=V,P.renderLists=ht,P.shadowMap=Ct,P.state=x,P.info=O}h(Rt,"initGLContext"),y!==1009&&(A=new og(y,e.width,e.height,o,r,s));const Mt=new Ja(P,U);this.xr=Mt,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const M=Jt.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Jt.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return j},this.setPixelRatio=function(M){M!==void 0&&(j=M,this.setSize(Zt,Y,false))},this.getSize=function(M){return M.set(Zt,Y)},this.setSize=function(M,I,W=true){if(Mt.isPresenting){Tt("WebGLRenderer: Can't change size while VR device is presenting.");return}Zt=M,Y=I,e.width=Math.floor(M*j),e.height=Math.floor(I*j),W===true&&(e.style.width=M+"px",e.style.height=I+"px"),A!==null&&A.setSize(e.width,e.height),this.setViewport(0,0,M,I)},this.getDrawingBufferSize=function(M){return M.set(Zt*j,Y*j).floor()},this.setDrawingBufferSize=function(M,I,W){Zt=M,Y=I,j=W,e.width=Math.floor(M*W),e.height=Math.floor(I*W),this.setViewport(0,0,M,I)},this.setEffects=function(M){if(y===1009){Pt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let I=0;I<M.length;I++)if(M[I].isOutputPass===true){Tt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(nt)},this.getViewport=function(M){return M.copy(gt)},this.setViewport=function(M,I,W,z){M.isVector4?gt.set(M.x,M.y,M.z,M.w):gt.set(M,I,W,z),x.viewport(nt.copy(gt).multiplyScalar(j).round())},this.getScissor=function(M){return M.copy(zt)},this.setScissor=function(M,I,W,z){M.isVector4?zt.set(M.x,M.y,M.z,M.w):zt.set(M,I,W,z),x.scissor(wt.copy(zt).multiplyScalar(j).round())},this.getScissorTest=function(){return xe},this.setScissorTest=function(M){x.setScissorTest(xe=M)},this.setOpaqueSort=function(M){xt=M},this.setTransparentSort=function(M){Dt=M},this.getClearColor=function(M){return M.copy(Ut.getClearColor())},this.setClearColor=function(){Ut.setClearColor(...arguments)},this.getClearAlpha=function(){return Ut.getClearAlpha()},this.setClearAlpha=function(){Ut.setClearAlpha(...arguments)},this.clear=function(M=true,I=true,W=true){let z=0;if(M){let G=false;if(it!==null){const ft=it.texture.format;G=g.has(ft)}if(G){const ft=it.texture.type,_t=p.has(ft),dt=Ut.getClearColor(),vt=Ut.getClearAlpha(),yt=dt.r,Bt=dt.g,kt=dt.b;_t?(E[0]=yt,E[1]=Bt,E[2]=kt,E[3]=vt,U.clearBufferuiv(U.COLOR,0,E)):(R[0]=yt,R[1]=Bt,R[2]=kt,R[3]=vt,U.clearBufferiv(U.COLOR,0,R))}else z|=U.COLOR_BUFFER_BIT}I&&(z|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(true)),W&&(z|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z!==0&&U.clear(z)},this.clearColor=function(){this.clear(true,false,false)},this.clearDepth=function(){this.clear(false,true,false)},this.clearStencil=function(){this.clear(false,false,true)},this.setNodesHandler=function(M){M.setRenderer(this),B=M},this.dispose=function(){e.removeEventListener("webglcontextlost",ae,false),e.removeEventListener("webglcontextrestored",$t,false),e.removeEventListener("webglcontextcreationerror",Xe,false),Ut.dispose(),ht.dispose(),ot.dispose(),V.dispose(),rt.dispose(),Q.dispose(),pt.dispose(),et.dispose(),at.dispose(),Mt.dispose(),Mt.removeEventListener("sessionstart",ic),Mt.removeEventListener("sessionend",rc),Dn.stop()};function ae(M){M.preventDefault(),Hr("WebGLRenderer: Context Lost."),F=true}h(ae,"onContextLost");function $t(){Hr("WebGLRenderer: Context Restored."),F=false;const M=O.autoReset,I=Ct.enabled,W=Ct.autoUpdate,z=Ct.needsUpdate,G=Ct.type;Rt(),O.autoReset=M,Ct.enabled=I,Ct.autoUpdate=W,Ct.needsUpdate=z,Ct.type=G}h($t,"onContextRestore");function Xe(M){Pt("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}h(Xe,"onContextCreationError");function Qe(M){const I=M.target;I.removeEventListener("dispose",Qe),Mu(I)}h(Qe,"onMaterialDispose");function Mu(M){yu(M),V.remove(M)}h(Mu,"deallocateMaterial");function yu(M){const I=V.get(M).programs;I!==void 0&&(I.forEach(function(W){at.releaseProgram(W)}),M.isShaderMaterial&&at.releaseShaderCache(M))}h(yu,"releaseMaterialProgramReferences"),this.renderBufferDirect=function(M,I,W,z,G,ft){I===null&&(I=De);const _t=G.isMesh&&G.matrixWorld.determinantAffine()<0,dt=Tu(M,I,W,z,G);x.setMaterial(z,_t);let vt=W.index,yt=1;if(z.wireframe===true){if(vt=Z.getWireframeAttribute(W),vt===void 0)return;yt=2}const Bt=W.drawRange,kt=W.attributes.position;let St=Bt.start*yt,Kt=(Bt.start+Bt.count)*yt;ft!==null&&(St=Math.max(St,ft.start*yt),Kt=Math.min(Kt,(ft.start+ft.count)*yt)),vt!==null?(St=Math.max(St,0),Kt=Math.min(Kt,vt.count)):kt!=null&&(St=Math.max(St,0),Kt=Math.min(Kt,kt.count));const ge=Kt-St;if(ge<0||ge===1/0)return;pt.setup(G,z,dt,W,vt);let le,ne=lt;if(vt!==null&&(le=st.get(vt),ne=J,ne.setIndex(le)),G.isMesh)z.wireframe===true?(x.setLineWidth(z.wireframeLinewidth*me()),ne.setMode(U.LINES)):ne.setMode(U.TRIANGLES);else if(G.isLine){let Te=z.linewidth;Te===void 0&&(Te=1),x.setLineWidth(Te*me()),G.isLineSegments?ne.setMode(U.LINES):G.isLineLoop?ne.setMode(U.LINE_LOOP):ne.setMode(U.LINE_STRIP)}else G.isPoints?ne.setMode(U.POINTS):G.isSprite&&ne.setMode(U.TRIANGLES);if(G.isBatchedMesh)if(Jt.get("WEBGL_multi_draw"))ne.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{const Te=G._multiDrawStarts,mt=G._multiDrawCounts,we=G._multiDrawCount,qt=vt?st.get(vt).bytesPerElement:1,Ge=V.get(z).currentProgram.getUniforms();for(let je=0;je<we;je++)Ge.setValue(U,"_gl_DrawID",je),ne.render(Te[je]/qt,mt[je])}else if(G.isInstancedMesh)ne.renderInstances(St,ge,G.count);else if(W.isInstancedBufferGeometry){const Te=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,mt=Math.min(W.instanceCount,Te);ne.renderInstances(St,ge,mt)}else ne.render(St,ge)};function nc(M,I,W,z){B!==null&&M.isNodeMaterial&&B.setObject(z,M),Yt===true&&bt.setState(M,W,false),M.transparent===true&&M.side===2&&M.forceSinglePass===false?(M.side=1,M.needsUpdate=true,ir(M,I,z),M.side=0,M.needsUpdate=true,ir(M,I,z),M.side=2):ir(M,I,z)}h(nc,"prepareMaterial"),this.compile=function(M,I,W=null){W===null&&(W=M),B!==null&&B.renderStart(M,I,W),b=ot.get(W),b.init(I),v.push(b),W.traverseVisible(function(G){G.isLight&&G.layers.test(I.layers)&&(b.pushLight(G),G.castShadow&&b.pushShadow(G))}),M!==W&&M.traverseVisible(function(G){G.isLight&&G.layers.test(I.layers)&&(b.pushLight(G),G.castShadow&&b.pushShadow(G))}),b.setupLights(),B!==null&&B.updateLights(b.state.lightsArray),se=this.localClippingEnabled,Yt=bt.init(this.clippingPlanes,se),Yt===true&&bt.setGlobalState(this.clippingPlanes,I),B!==null&&Ct.render(b.state.shadowsArray,W,I);const z=new Set;return M.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;const ft=G.material;if(ft)if(Array.isArray(ft))for(let _t=0;_t<ft.length;_t++){const dt=ft[_t];nc(dt,W,I,G),z.add(dt)}else nc(ft,W,I,G),z.add(ft)}),b=v.pop(),B!==null&&B.renderEnd(),z},this.compileAsync=function(M,I,W=null){const z=this.compile(M,I,W);return new Promise(G=>{function ft(){if(z.forEach(function(_t){const vt=V.get(_t).currentProgram;(vt===void 0||vt.isReady())&&z.delete(_t)}),z.size===0){G(M);return}setTimeout(ft,10)}h(ft,"checkMaterialsReady"),Jt.get("KHR_parallel_shader_compile")!==null?ft():setTimeout(ft,10)})};let Cs=null;function Eu(M){Cs&&Cs(M)}h(Eu,"onAnimationFrame");function ic(){Dn.stop()}h(ic,"onXRSessionStart");function rc(){Dn.start()}h(rc,"onXRSessionEnd");const Dn=new pu;Dn.setAnimationLoop(Eu),typeof self<"u"&&Dn.setContext(self),this.setAnimationLoop=function(M){Cs=M,Mt.setAnimationLoop(M),M===null?Dn.stop():Dn.start()},Mt.addEventListener("sessionstart",ic),Mt.addEventListener("sessionend",rc),this.render=function(M,I){if(I!==void 0&&I.isCamera!==true){Pt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(F===true)return;B!==null&&B.renderStart(M,I);const W=Mt.enabled===true&&Mt.isPresenting===true,z=A!==null&&(it===null||W)&&A.begin(P,it);if(M.matrixWorldAutoUpdate===true&&M.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===true&&I.updateMatrixWorld(),Mt.enabled===true&&Mt.isPresenting===true&&(A===null||A.isCompositing()===false)&&(Mt.cameraAutoUpdate===true&&Mt.updateCamera(I),I=Mt.getCamera()),M.isScene===true&&M.onBeforeRender(P,M,I,it),b=ot.get(M,v.length),b.init(I),b.state.textureUnits=X.getTextureUnits(),v.push(b),Ht.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),Vt.setFromProjectionMatrix(Ht,2e3,I.reversedDepth),se=this.localClippingEnabled,Yt=bt.init(this.clippingPlanes,se),T=ht.get(M,C.length),T.init(),C.push(T),Mt.enabled===true&&Mt.isPresenting===true){const _t=P.xr.getDepthSensingMesh();_t!==null&&Ps(_t,I,-1/0,P.sortObjects)}Ps(M,I,0,P.sortObjects),T.finish(),B!==null&&B.updateLights(b.state.lightsArray),P.sortObjects===true&&T.sort(xt,Dt),ue=Mt.enabled===false||Mt.isPresenting===false||Mt.hasDepthSensing()===false,ue&&Ut.addToRenderList(T,M),this.info.render.frame++,this.info.autoReset===true&&this.info.reset(),Yt===true&&bt.beginShadows();const G=b.state.shadowsArray;if(Ct.render(G,M,I),Yt===true&&bt.endShadows(),(z&&A.hasRenderPass())===false){const _t=T.opaque,dt=T.transmissive;if(b.setupLights(),I.isArrayCamera){const vt=I.cameras;if(dt.length>0)for(let yt=0,Bt=vt.length;yt<Bt;yt++){const kt=vt[yt];ac(_t,dt,M,kt)}ue&&Ut.render(M);for(let yt=0,Bt=vt.length;yt<Bt;yt++){const kt=vt[yt];sc(T,M,kt,kt.viewport)}}else dt.length>0&&ac(_t,dt,M,I),ue&&Ut.render(M),sc(T,M,I)}it!==null&&K===0&&(X.updateMultisampleRenderTarget(it),X.updateRenderTargetMipmap(it)),z&&A.end(P),M.isScene===true&&M.onAfterRender(P,M,I),pt.resetDefaultState(),q=-1,tt=null,v.pop(),v.length>0?(b=v[v.length-1],X.setTextureUnits(b.state.textureUnits),Yt===true&&bt.setGlobalState(P.clippingPlanes,b.state.camera)):b=null,C.pop(),C.length>0?T=C[C.length-1]:T=null,B!==null&&B.renderEnd()};function Ps(M,I,W,z){if(M.visible===false)return;if(M.layers.test(I.layers)){if(M.isGroup)W=M.renderOrder;else if(M.isLOD)M.autoUpdate===true&&M.update(I);else if(M.isLightProbeGrid)b.pushLightProbeGrid(M);else if(M.isLight)b.pushLight(M),M.castShadow&&b.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||M.intersectsFrustum(Vt)){z&&ye.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Ht);const _t=Q.update(M),dt=M.material;dt.visible&&T.push(M,_t,dt,W,ye.z,null,I)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||M.intersectsFrustum(Vt))){const _t=Q.update(M),dt=M.material;if(z&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),ye.copy(M.boundingSphere.center)):(_t.boundingSphere===null&&_t.computeBoundingSphere(),ye.copy(_t.boundingSphere.center)),ye.applyMatrix4(M.matrixWorld).applyMatrix4(Ht)),Array.isArray(dt)){const vt=_t.groups;for(let yt=0,Bt=vt.length;yt<Bt;yt++){const kt=vt[yt],St=dt[kt.materialIndex];St&&St.visible&&T.push(M,_t,St,W,ye.z,kt,I)}}else dt.visible&&T.push(M,_t,dt,W,ye.z,null,I)}}const ft=M.children;for(let _t=0,dt=ft.length;_t<dt;_t++)Ps(ft[_t],I,W,z)}h(Ps,"projectObject");function sc(M,I,W,z){const{opaque:G,transmissive:ft,transparent:_t}=M;b.setupLightsView(W),Yt===true&&bt.setGlobalState(P.clippingPlanes,W),z&&x.viewport(nt.copy(z)),G.length>0&&nr(G,I,W),ft.length>0&&nr(ft,I,W),_t.length>0&&nr(_t,I,W),x.buffers.depth.setTest(true),x.buffers.depth.setMask(true),x.buffers.color.setMask(true),x.setPolygonOffset(false)}h(sc,"renderScene");function ac(M,I,W,z){if((W.isScene===true?W.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[z.id]===void 0){const St=Jt.has("EXT_color_buffer_half_float")||Jt.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[z.id]=new Be(1,1,{generateMipmaps:true,type:St?1016:1009,minFilter:1008,samples:Math.max(4,w.samples),stencilBuffer:s,resolveDepthBuffer:false,resolveStencilBuffer:false,storeMultisampledDepthBuffer:false,storeMultisampledStencilBuffer:false,colorSpace:Wt.workingColorSpace})}const ft=b.state.transmissionRenderTarget[z.id],_t=z.viewport||nt;ft.setSize(_t.z*P.transmissionResolutionScale,_t.w*P.transmissionResolutionScale);const dt=P.getRenderTarget(),vt=P.getActiveCubeFace(),yt=P.getActiveMipmapLevel();P.setRenderTarget(ft),P.getClearColor(re),Xt=P.getClearAlpha(),Xt<1&&P.setClearColor(16777215,.5),P.clear(),ue&&Ut.render(W);const Bt=P.toneMapping;P.toneMapping=0;const kt=z.viewport;if(z.viewport!==void 0&&(z.viewport=void 0),b.setupLightsView(z),Yt===true&&bt.setGlobalState(P.clippingPlanes,z),nr(M,W,z),X.updateMultisampleRenderTarget(ft),X.updateRenderTargetMipmap(ft),Jt.has("WEBGL_multisampled_render_to_texture")===false){let St=false;for(let Kt=0,ge=I.length;Kt<ge;Kt++){const le=I[Kt],{object:ne,geometry:Te,material:mt,group:we}=le;if(mt.side===2&&ne.layers.test(z.layers)){const qt=mt.side;mt.side=1,mt.needsUpdate=true,oc(ne,W,z,Te,mt,we),mt.side=qt,mt.needsUpdate=true,St=true}}St===true&&(X.updateMultisampleRenderTarget(ft),X.updateRenderTargetMipmap(ft))}P.setRenderTarget(dt,vt,yt),P.setClearColor(re,Xt),kt!==void 0&&(z.viewport=kt),P.toneMapping=Bt}h(ac,"renderTransmissionPass");function nr(M,I,W){const z=I.isScene===true?I.overrideMaterial:null;for(let G=0,ft=M.length;G<ft;G++){const _t=M[G],{object:dt,geometry:vt,group:yt}=_t;let Bt=_t.material;Bt.allowOverride===true&&z!==null&&(Bt=z),dt.layers.test(W.layers)&&oc(dt,I,W,vt,Bt,yt)}}h(nr,"renderObjects");function oc(M,I,W,z,G,ft){B!==null&&G.isNodeMaterial&&B.setObject(M,G),M.onBeforeRender(P,I,W,z,G,ft),M.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),G.onBeforeRender(P,I,W,z,M,ft),G.transparent===true&&G.side===2&&G.forceSinglePass===false?(G.side=1,G.needsUpdate=true,P.renderBufferDirect(W,I,z,G,M,ft),G.side=0,G.needsUpdate=true,P.renderBufferDirect(W,I,z,G,M,ft),G.side=2):P.renderBufferDirect(W,I,z,G,M,ft),M.onAfterRender(P,I,W,z,G,ft)}h(oc,"renderObject");function ir(M,I,W){I.isScene!==true&&(I=De);const z=V.get(M),G=b.state.lights,ft=b.state.shadowsArray,_t=G.state.version,dt=at.getParameters(M,G.state,ft,I,W,b.state.lightProbeGridArray),vt=at.getProgramCacheKey(dt);let yt=z.programs;z.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?I.environment:null,z.fog=I.fog;const Bt=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;z.envMap=rt.get(M.envMap||z.environment,Bt),z.envMapRotation=z.environment!==null&&M.envMap===null?I.environmentRotation:M.envMapRotation,yt===void 0&&(M.addEventListener("dispose",Qe),yt=new Map,z.programs=yt);let kt=yt.get(vt);if(kt!==void 0){if(z.currentProgram===kt&&z.lightsStateVersion===_t)return cc(M,dt),kt}else dt.uniforms=at.getUniforms(M),B!==null&&M.isNodeMaterial&&B.build(M,W,dt),M.onBeforeCompile(dt,P),kt=at.acquireProgram(dt,vt),yt.set(vt,kt),z.uniforms=dt.uniforms;const St=z.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===true)&&(St.clippingPlanes=bt.uniform),cc(M,dt),z.needsLights=Ru(M),z.lightsStateVersion=_t,z.needsLights&&(St.ambientLightColor.value=G.state.ambient,St.lightProbe.value=G.state.probe,St.sunLights.value=G.state.sun,St.sunLightShadows.value=G.state.sunShadow,St.directionalLights.value=G.state.directional,St.directionalLightShadows.value=G.state.directionalShadow,St.spotLights.value=G.state.spot,St.spotLightShadows.value=G.state.spotShadow,St.rectAreaLights.value=G.state.rectArea,St.ltc_1.value=G.state.rectAreaLTC1,St.ltc_2.value=G.state.rectAreaLTC2,St.pointLights.value=G.state.point,St.pointLightShadows.value=G.state.pointShadow,St.hemisphereLights.value=G.state.hemi,St.sunShadowMatrix.value=G.state.sunShadowMatrix,St.sunShadowCascade.value=G.state.sunShadowCascade,St.directionalShadowMatrix.value=G.state.directionalShadowMatrix,St.spotLightMatrix.value=G.state.spotLightMatrix,St.spotLightMap.value=G.state.spotLightMap,St.pointShadowMatrix.value=G.state.pointShadowMatrix),z.lightProbeGrid=b.state.lightProbeGridArray.length>0,z.currentProgram=kt,z.uniformsList=null,kt}h(ir,"getProgram");function lc(M){if(M.uniformsList===null){const I=M.currentProgram.getUniforms();M.uniformsList=vi.seqWithValue(I.seq,M.uniforms)}return M.uniformsList}h(lc,"getUniformList");function cc(M,I){const W=V.get(M);W.outputColorSpace=I.outputColorSpace,W.batching=I.batching,W.batchingColor=I.batchingColor,W.instancing=I.instancing,W.instancingColor=I.instancingColor,W.instancingMorph=I.instancingMorph,W.skinning=I.skinning,W.morphTargets=I.morphTargets,W.morphNormals=I.morphNormals,W.morphColors=I.morphColors,W.morphTargetsCount=I.morphTargetsCount,W.numClippingPlanes=I.numClippingPlanes,W.numIntersection=I.numClipIntersection,W.vertexAlphas=I.vertexAlphas,W.vertexTangents=I.vertexTangents,W.toneMapping=I.toneMapping}h(cc,"updateCommonMaterialProperties");function bu(M,I){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;S.setFromMatrixPosition(I.matrixWorld);for(let W=0,z=M.length;W<z;W++){const G=M[W];if(G.texture!==null&&G.boundingBox.containsPoint(S))return G}return null}h(bu,"findLightProbeGrid");function Tu(M,I,W,z,G){I.isScene!==true&&(I=De),X.resetTextureUnits();const ft=I.fog,_t=z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial?I.environment:null,dt=it===null?P.outputColorSpace:it.isXRRenderTarget===true?it.texture.colorSpace:Wt.workingColorSpace,vt=z.isMeshStandardMaterial||z.isMeshLambertMaterial&&!z.envMap||z.isMeshPhongMaterial&&!z.envMap,yt=rt.get(z.envMap||_t,vt),Bt=z.vertexColors===true&&!!W.attributes.color&&W.attributes.color.itemSize===4,kt=!!W.attributes.tangent&&(!!z.normalMap||z.anisotropy>0),St=!!W.morphAttributes.position,Kt=!!W.morphAttributes.normal,ge=!!W.morphAttributes.color;let le=0;z.toneMapped&&(it===null||it.isXRRenderTarget===true)&&(le=P.toneMapping);const ne=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Te=ne!==void 0?ne.length:0,mt=V.get(z),we=b.state.lights;if(Yt===true&&(se===true||M!==tt)){const oe=M===tt&&z.id===q;bt.setState(z,M,oe)}let qt=false;z.version===mt.__version?(mt.needsLights&&mt.lightsStateVersion!==we.state.version||mt.outputColorSpace!==dt||G.isBatchedMesh&&mt.batching===false||!G.isBatchedMesh&&mt.batching===true||G.isBatchedMesh&&mt.batchingColor===true&&G._colorsTexture===null||G.isBatchedMesh&&mt.batchingColor===false&&G._colorsTexture!==null||G.isInstancedMesh&&mt.instancing===false||!G.isInstancedMesh&&mt.instancing===true||G.isSkinnedMesh&&mt.skinning===false||!G.isSkinnedMesh&&mt.skinning===true||G.isInstancedMesh&&mt.instancingColor===true&&G.instanceColor===null||G.isInstancedMesh&&mt.instancingColor===false&&G.instanceColor!==null||G.isInstancedMesh&&mt.instancingMorph===true&&G.morphTexture===null||G.isInstancedMesh&&mt.instancingMorph===false&&G.morphTexture!==null||mt.envMap!==yt||z.fog===true&&mt.fog!==ft||mt.numClippingPlanes!==void 0&&(mt.numClippingPlanes!==bt.numPlanes||mt.numIntersection!==bt.numIntersection)||mt.vertexAlphas!==Bt||mt.vertexTangents!==kt||mt.morphTargets!==St||mt.morphNormals!==Kt||mt.morphColors!==ge||mt.toneMapping!==le||mt.morphTargetsCount!==Te||!!mt.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(qt=true):(qt=true,mt.__version=z.version);let Ge=mt.currentProgram;qt===true&&(Ge=ir(z,I,G),B&&z.isNodeMaterial&&B.onUpdateProgram(z,Ge,mt));let je=false,_n=false,Hn=false;const te=Ge.getUniforms(),fe=mt.uniforms;if(x.useProgram(Ge.program)&&(je=true,_n=true,Hn=true),z.id!==q&&(q=z.id,_n=true),mt.needsLights){const oe=bu(b.state.lightProbeGridArray,G);mt.lightProbeGrid!==oe&&(mt.lightProbeGrid=oe,_n=true)}if(je||tt!==M){x.buffers.depth.getReversed()&&M.reversedDepth!==true&&(M._reversedDepth=true,M.updateProjectionMatrix()),te.setValue(U,"projectionMatrix",M.projectionMatrix),te.setValue(U,"viewMatrix",M.matrixWorldInverse);const vn=te.map.cameraPosition;vn!==void 0&&vn.setValue(U,he.setFromMatrixPosition(M.matrixWorld)),w.logarithmicDepthBuffer&&te.setValue(U,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&te.setValue(U,"isOrthographic",M.isOrthographicCamera===true),tt!==M&&(tt=M,_n=true,Hn=true)}if(mt.needsLights&&(we.state.sunShadowMap.length>0&&te.setValue(U,"sunShadowMap",we.state.sunShadowMap,X),we.state.directionalShadowMap.length>0&&te.setValue(U,"directionalShadowMap",we.state.directionalShadowMap,X),we.state.spotShadowMap.length>0&&te.setValue(U,"spotShadowMap",we.state.spotShadowMap,X),we.state.pointShadowMap.length>0&&te.setValue(U,"pointShadowMap",we.state.pointShadowMap,X)),G.isSkinnedMesh){te.setOptional(U,G,"bindMatrix"),te.setOptional(U,G,"bindMatrixInverse");const oe=G.skeleton;oe&&(oe.boneTexture===null&&oe.computeBoneTexture(),te.setValue(U,"boneTexture",oe.boneTexture,X))}G.isBatchedMesh&&(te.setOptional(U,G,"batchingTexture"),te.setValue(U,"batchingTexture",G._matricesTexture,X),te.setOptional(U,G,"batchingIdTexture"),te.setValue(U,"batchingIdTexture",G._indirectTexture,X),te.setOptional(U,G,"batchingColorTexture"),G._colorsTexture!==null&&te.setValue(U,"batchingColorTexture",G._colorsTexture,X));const xn=W.morphAttributes;if((xn.position!==void 0||xn.normal!==void 0||xn.color!==void 0)&&L.update(G,W,Ge),(_n||mt.receiveShadow!==G.receiveShadow)&&(mt.receiveShadow=G.receiveShadow,te.setValue(U,"receiveShadow",G.receiveShadow)),(z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial)&&z.envMap===null&&I.environment!==null&&(fe.envMapIntensity.value=I.environmentIntensity),fe.dfgLUT!==void 0&&(fe.dfgLUT.value=Y_()),_n){if(te.setValue(U,"toneMappingExposure",P.toneMappingExposure),mt.needsLights&&Au(fe,Hn),ft&&z.fog===true&&Et.refreshFogUniforms(fe,ft),Et.refreshMaterialUniforms(fe,z,j,Y,b.state.transmissionRenderTarget[M.id]),mt.needsLights&&mt.lightProbeGrid){const oe=mt.lightProbeGrid;fe.probesSH.value=oe.texture,fe.probesMin.value.copy(oe.boundingBox.min),fe.probesMax.value.copy(oe.boundingBox.max),fe.probesResolution.value.copy(oe.resolution)}vi.upload(U,lc(mt),fe,X)}if(z.isShaderMaterial&&z.uniformsNeedUpdate===true&&(vi.upload(U,lc(mt),fe,X),z.uniformsNeedUpdate=false),z.isSpriteMaterial&&te.setValue(U,"center",G.center),te.setValue(U,"modelViewMatrix",G.modelViewMatrix),te.setValue(U,"normalMatrix",G.normalMatrix),te.setValue(U,"modelMatrix",G.matrixWorld),z.uniformsGroups!==void 0){const oe=z.uniformsGroups;for(let vn=0,Wn=oe.length;vn<Wn;vn++){const uc=oe[vn];et.update(uc,Ge),et.bind(uc,Ge)}}return Ge}h(Tu,"setProgram");function Au(M,I){M.ambientLightColor.needsUpdate=I,M.lightProbe.needsUpdate=I,M.sunLights.needsUpdate=I,M.sunLightShadows.needsUpdate=I,M.directionalLights.needsUpdate=I,M.directionalLightShadows.needsUpdate=I,M.pointLights.needsUpdate=I,M.pointLightShadows.needsUpdate=I,M.spotLights.needsUpdate=I,M.spotLightShadows.needsUpdate=I,M.rectAreaLights.needsUpdate=I,M.hemisphereLights.needsUpdate=I}h(Au,"markUniformsLightsNeedsUpdate");function Ru(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===true}h(Ru,"materialNeedsLights"),this.getActiveCubeFace=function(){return $},this.getActiveMipmapLevel=function(){return K},this.getRenderTarget=function(){return it},this.setRenderTargetTextures=function(M,I,W){const z=V.get(M);z.__autoAllocateDepthBuffer=M.resolveDepthBuffer===false,z.__autoAllocateDepthBuffer===false&&(z.__useRenderToTexture=false),V.get(M.texture).__webglTexture=I,V.get(M.depthTexture).__webglTexture=z.__autoAllocateDepthBuffer?void 0:W,z.__hasExternalTextures=true},this.setRenderTargetFramebuffer=function(M,I){const W=V.get(M);W.__webglFramebuffer=I,W.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(M,I=0,W=0){it=M,$=I,K=W;let z=null,G=false,ft=false;if(M){const dt=V.get(M);if(dt.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(U.FRAMEBUFFER,dt.__webglFramebuffer),nt.copy(M.viewport),wt.copy(M.scissor),At=M.scissorTest,x.viewport(nt),x.scissor(wt),x.setScissorTest(At),q=-1;return}else if(dt.__webglFramebuffer===void 0)X.setupRenderTarget(M);else if(dt.__hasExternalTextures)X.rebindTextures(M,V.get(M.texture).__webglTexture,V.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Bt=M.depthTexture;if(dt.__boundDepthTexture!==Bt){if(Bt!==null&&V.has(Bt)&&(M.width!==Bt.image.width||M.height!==Bt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");X.setupDepthRenderbuffer(M)}}const vt=M.texture;(vt.isData3DTexture||vt.isDataArrayTexture||vt.isCompressedArrayTexture)&&(ft=true);const yt=V.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(yt[I])?z=yt[I][W]:z=yt[I],G=true):M.samples>0&&X.useMultisampledRTT(M)===false?z=V.get(M).__webglMultisampledFramebuffer:Array.isArray(yt)?z=yt[W]:z=yt,nt.copy(M.viewport),wt.copy(M.scissor),At=M.scissorTest}else nt.copy(gt).multiplyScalar(j).floor(),wt.copy(zt).multiplyScalar(j).floor(),At=xe;if(W!==0&&(z=k),x.bindFramebuffer(U.FRAMEBUFFER,z)&&x.drawBuffers(M,z),x.viewport(nt),x.scissor(wt),x.setScissorTest(At),G){const dt=V.get(M.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+I,dt.__webglTexture,W)}else if(ft){const dt=I;for(let vt=0;vt<M.textures.length;vt++){const yt=V.get(M.textures[vt]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+vt,yt.__webglTexture,W,dt)}}else if(M!==null&&W!==0){const dt=V.get(M.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,dt.__webglTexture,W)}q=-1};function hc(M){const I=V.get(M);return(I.__readFormat!==M.format||I.__readType!==M.type)&&(I.__readFormat=M.format,I.__readType=M.type,I.__formatReadable=w.textureFormatReadable(M.format),I.__typeReadable=w.textureTypeReadable(M.type)),I}h(hc,"getReadableState"),this.readRenderTargetPixels=function(M,I,W,z,G,ft,_t,dt=0){if(!(M&&M.isWebGLRenderTarget)){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let vt=V.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&_t!==void 0&&(vt=vt[_t]),vt){x.bindFramebuffer(U.FRAMEBUFFER,vt);try{const yt=M.textures[dt],Bt=yt.format,kt=yt.type;M.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+dt);const St=hc(yt);if(St.__formatReadable===false){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(St.__typeReadable===false){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=M.width-z&&W>=0&&W<=M.height-G&&U.readPixels(I,W,z,G,ct.convert(Bt),ct.convert(kt),ft)}finally{const yt=it!==null?V.get(it).__webglFramebuffer:null;x.bindFramebuffer(U.FRAMEBUFFER,yt)}}},this.readRenderTargetPixelsAsync=async function(M,I,W,z,G,ft,_t,dt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let vt=V.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&_t!==void 0&&(vt=vt[_t]),vt)if(I>=0&&I<=M.width-z&&W>=0&&W<=M.height-G){x.bindFramebuffer(U.FRAMEBUFFER,vt);const yt=M.textures[dt],Bt=yt.format,kt=yt.type;M.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+dt);const St=hc(yt);if(St.__formatReadable===false)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(St.__typeReadable===false)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Kt=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Kt),U.bufferData(U.PIXEL_PACK_BUFFER,ft.byteLength,U.STREAM_READ),U.readPixels(I,W,z,G,ct.convert(Bt),ct.convert(kt),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);const ge=it!==null?V.get(it).__webglFramebuffer:null;x.bindFramebuffer(U.FRAMEBUFFER,ge);const le=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await Lu(U,le,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Kt),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,ft),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(Kt),U.deleteSync(le),ft}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,I=null,W=0){const z=Math.pow(2,-W),G=Math.floor(M.image.width*z),ft=Math.floor(M.image.height*z),_t=I!==null?I.x:0,dt=I!==null?I.y:0;X.setTexture2D(M,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,_t,dt,G,ft),x.unbindTexture()},this.copyTextureToTexture=function(M,I,W=null,z=null,G=0,ft=0){let _t,dt,vt,yt,Bt,kt,St,Kt,ge;const le=M.isCompressedTexture?M.mipmaps[ft]:M.image;if(W!==null)_t=W.max.x-W.min.x,dt=W.max.y-W.min.y,vt=W.isBox3?W.max.z-W.min.z:1,yt=W.min.x,Bt=W.min.y,kt=W.isBox3?W.min.z:0;else{const fe=Math.pow(2,-G);_t=Math.floor(le.width*fe),dt=Math.floor(le.height*fe),M.isDataArrayTexture?vt=le.depth:M.isData3DTexture?vt=Math.floor(le.depth*fe):vt=1,yt=0,Bt=0,kt=0}z!==null?(St=z.x,Kt=z.y,ge=z.z):(St=0,Kt=0,ge=0);const ne=ct.convert(I.format),Te=ct.convert(I.type);let mt;I.isData3DTexture?(X.setTexture3D(I,0),mt=U.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(X.setTexture2DArray(I,0),mt=U.TEXTURE_2D_ARRAY):(X.setTexture2D(I,0),mt=U.TEXTURE_2D),x.activeTexture(U.TEXTURE0),x.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,I.flipY),x.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),x.pixelStorei(U.UNPACK_ALIGNMENT,I.unpackAlignment);const we=x.getParameter(U.UNPACK_ROW_LENGTH),qt=x.getParameter(U.UNPACK_IMAGE_HEIGHT),Ge=x.getParameter(U.UNPACK_SKIP_PIXELS),je=x.getParameter(U.UNPACK_SKIP_ROWS),_n=x.getParameter(U.UNPACK_SKIP_IMAGES);x.pixelStorei(U.UNPACK_ROW_LENGTH,le.width),x.pixelStorei(U.UNPACK_IMAGE_HEIGHT,le.height),x.pixelStorei(U.UNPACK_SKIP_PIXELS,yt),x.pixelStorei(U.UNPACK_SKIP_ROWS,Bt),x.pixelStorei(U.UNPACK_SKIP_IMAGES,kt);const Hn=M.isDataArrayTexture||M.isData3DTexture,te=I.isDataArrayTexture||I.isData3DTexture;if(M.isDepthTexture){const fe=V.get(M),xn=V.get(I),oe=V.get(fe.__renderTarget),vn=V.get(xn.__renderTarget);x.bindFramebuffer(U.READ_FRAMEBUFFER,oe.__webglFramebuffer),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,vn.__webglFramebuffer);for(let Wn=0;Wn<vt;Wn++)Hn&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,V.get(M).__webglTexture,G,kt+Wn),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,V.get(I).__webglTexture,ft,ge+Wn)),U.blitFramebuffer(yt,Bt,_t,dt,St,Kt,_t,dt,U.DEPTH_BUFFER_BIT,U.NEAREST);x.bindFramebuffer(U.READ_FRAMEBUFFER,null),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(G!==0||M.isRenderTargetTexture||V.has(M)){const fe=V.get(M),xn=V.get(I);x.bindFramebuffer(U.READ_FRAMEBUFFER,N),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,H);for(let oe=0;oe<vt;oe++)Hn?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,fe.__webglTexture,G,kt+oe):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,fe.__webglTexture,G),te?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,xn.__webglTexture,ft,ge+oe):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,xn.__webglTexture,ft),G!==0?U.blitFramebuffer(yt,Bt,_t,dt,St,Kt,_t,dt,U.COLOR_BUFFER_BIT,U.NEAREST):te?U.copyTexSubImage3D(mt,ft,St,Kt,ge+oe,yt,Bt,_t,dt):U.copyTexSubImage2D(mt,ft,St,Kt,yt,Bt,_t,dt);x.bindFramebuffer(U.READ_FRAMEBUFFER,null),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else te?M.isDataTexture||M.isData3DTexture?U.texSubImage3D(mt,ft,St,Kt,ge,_t,dt,vt,ne,Te,le.data):I.isCompressedArrayTexture?U.compressedTexSubImage3D(mt,ft,St,Kt,ge,_t,dt,vt,ne,le.data):U.texSubImage3D(mt,ft,St,Kt,ge,_t,dt,vt,ne,Te,le):M.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,ft,St,Kt,_t,dt,ne,Te,le.data):M.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,ft,St,Kt,le.width,le.height,ne,le.data):U.texSubImage2D(U.TEXTURE_2D,ft,St,Kt,_t,dt,ne,Te,le);x.pixelStorei(U.UNPACK_ROW_LENGTH,we),x.pixelStorei(U.UNPACK_IMAGE_HEIGHT,qt),x.pixelStorei(U.UNPACK_SKIP_PIXELS,Ge),x.pixelStorei(U.UNPACK_SKIP_ROWS,je),x.pixelStorei(U.UNPACK_SKIP_IMAGES,_n),ft===0&&I.generateMipmaps&&U.generateMipmap(mt),x.unbindTexture()},this.initRenderTarget=function(M){V.get(M).__webglFramebuffer===void 0&&X.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?X.setTextureCube(M,0):M.isData3DTexture?X.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?X.setTexture2DArray(M,0):X.setTexture2D(M,0),x.unbindTexture()},this.resetState=function(){$=0,K=0,it=null,x.reset(),pt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return 2e3}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=Wt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Wt._getUnpackColorSpace()}};h(ec,"WebGLRenderer");let ru=ec;export{ee as $,t0 as A,an as B,Ft as C,J_ as D,eh as E,ie as F,di as G,ih as H,Ah as I,Ch as J,Zr as K,h0 as L,Gt as M,o0 as N,er as O,Ie as P,He as Q,p0 as R,We as S,pn as T,Xr as U,D as V,Be as W,lh as X,rn as Y,Fd as Z,ut as _,Je as a,Uh as a0,e0 as a1,n0 as a2,i0 as a3,ru as a4,th as a5,Lt as a6,pe as a7,da as a8,m0 as a9,ga as aA,on as aB,ba as aC,ce as aD,Oc as aE,jr as aF,$c as aG,Gc as aH,as as aI,pa as aJ,_0 as aK,x0 as aL,ss as aM,Qi as aN,ji as aO,Wt as aP,Vn as aQ,_h as aR,wh as aS,g0 as aT,r0 as aa,zn as ab,f0 as ac,Zi as ad,Zc as ae,ma as af,Q_ as ag,v0 as ah,M0 as ai,S0 as aj,kn as ak,Th as al,mh as am,uh as an,Vr as ao,yh as ap,Eh as aq,bh as ar,Rh as as,Yr as at,d0 as au,c0 as av,u0 as aw,l0 as ax,a0 as ay,s0 as az,Ne as b,ve as c,Oe as d,$r as e,ke as f,oh as g,jc as h,ns as i,Kr as j,It as k,fa as l,j_ as m,Pc as n,qi as o,Hc as p,Jc as q,ah as r,Cn as s,y0 as t,Ac as u,gh as v,Ih as w,Le as x,K_ as y,$_ as z};
//# sourceMappingURL=three.module-DQ1AG__Q.js.map
