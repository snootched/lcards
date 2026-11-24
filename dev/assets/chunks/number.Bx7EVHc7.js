import{s as d,c as n,r as p,l as s}from"./target.FfaGmL8c.js";/**
 * Anime.js - utils - ESM
 * @version v4.5.0
 * @license MIT
 * @copyright 2026 - Julian Garnier
 */const c=(t,a)=>(+t).toFixed(a),l=(t,a,e)=>`${t}`.padStart(a,e),u=(t,a,e)=>`${t}`.padEnd(a,e),g=(t,a,e)=>((t-a)%(e-a)+(e-a))%(e-a)+a,b=(t,a,e,o,r)=>o+(t-a)/(e-a)*(r-o),M=t=>t*Math.PI/180,P=t=>t*180/Math.PI,S=(t,a,e,o)=>o?o===1?a:s(t,a,1-Math.exp(-o*e*.1)):t,h=Object.freeze(Object.defineProperty({__proto__:null,clamp:n,damp:S,degToRad:M,lerp:s,mapRange:b,padEnd:u,padStart:l,radToDeg:P,round:p,roundPad:c,snap:d,wrap:g},Symbol.toStringTag,{value:"Module"}));export{M as d,b as m,h as n,P as r};
