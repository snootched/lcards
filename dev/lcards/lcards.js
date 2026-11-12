let r=null,a="/lcards/";try{const t=new URL(import.meta.url);r=t.searchParams.get("log");const o=t.pathname.slice(0,t.pathname.lastIndexOf("/")+1);(t.protocol==="http:"||t.protocol==="https:")&&o.startsWith("/")&&(a=t.origin===location.origin?o:t.origin+o)}catch{}window.__LCARDS_BOOT__={log:r,base:a};import("./chunks/lcards-main-C148JfkA.js").then(t=>t.dV);
//# sourceMappingURL=lcards.js.map
