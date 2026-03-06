(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function u(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(e){if(e.ep)return;e.ep=!0;const r=u(e);fetch(e.href,r)}})();function w(s){const t=s.split(`
`),u=[];for(let l=0;l<t.length;l++){const n=t[l];if(n.trim()==="---"||n.trim()==="***"||n.trim()==="___"){u.length>0&&u[u.length-1].trim()===""&&u.pop(),l+1<t.length&&t[l+1].trim()===""&&l++;continue}u.push(n)}const o=[];let e=!1,r=!1,a=-1;for(let l=0;l<u.length;l++){const n=u[l],h=a>=0?" ".repeat(a+1):"";if(n.trim().startsWith("```")){if(e)e=!1;else{e=!0;const c=n.trim().slice(3).trim();o.push(`code:${c||"snippet"}`)}continue}if(e){o.push(" "+n);continue}if(n.trim()===""){r=!1;continue}n.trim().startsWith("|")||(r=!1);const x=n.match(/^(#+)\s+(.*)/);if(x){const c=x[2],i=f(c).replace(/[`\[\]]/g,"");a=0,o.push(`[** ${i}]`),o.push(" code:txt"),o.push(`  ${c}`),o.push(" -");continue}const v=n.match(/^(\s*)[-*+]\s+(.*)/);if(v){const c=v[1],i=v[2],p=Math.floor(c.length/2),d=Math.max(0,a+1)+p;o.push(`${" ".repeat(d)}${f(i)}`);continue}const $=n.match(/^(\s*)\d+\.\s+(.*)/);if($){const c=$[1],i=$[2],p=Math.floor(c.length/2),d=Math.max(0,a+1)+p;o.push(`${" ".repeat(d)}${f("1. "+i)}`);continue}if(n.trim().startsWith(">")){const c=n.match(/^(\s*>+)\s*(.*)/);if(c){const i=c[1].replace(/\s/g,""),p=c[2],d=i.length,L=Math.max(0,a+1),M=">".repeat(d);o.push(`${" ".repeat(L)}${M} ${f(p)}`)}continue}if(n.trim().startsWith("|")){r||(r=!0,o.push(`${h}table:x`));const c=n.split("|").filter(i=>i.trim()!=="").map(i=>S(i.trim()));o.push(`${h}	${c.join("	")}`);continue}const y=n.match(/^(\s+)(.*)/);if(y){const c=y[1],i=y[2],p=Math.floor(c.length/2),d=h+" ".repeat(p);o.push(`${d}${f(i)}`)}else o.push(`${h}${f(n)}`)}return o.join(`
`)}function f(s){let t=s;return t=t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,"[$2]"),t=t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,"[$2 $1]"),t=t.replace(/\*\*([^*]+)\*\*/g,"[* $1]"),t=t.replace(new RegExp("(?<!\\[)\\*([^*]+)\\*","g"),"[/ $1]"),t=t.replace(/~~([^~]+)~~/g,"[- $1]"),t}function S(s){let t=s;return t=t.replace(/\*\*([^*]+)\*\*/g,"$1"),t=t.replace(/\*([^*]+)\*/g,"$1"),t=t.replace(/~~([^~]+)~~/g,"$1"),t}document.querySelector("#app").innerHTML=`
  <div>
    <h1>md2sb</h1>
    <p class="description">Markdown to Scrapbox Converter</p>
    <div class="container">
      <div class="panel">
        <div class="label">
            Markdown Input
            <button id="clear-btn" class="action-btn">Clear</button>
        </div>
        <textarea id="input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Paste your Markdown text here..."></textarea>
      </div>
      <div class="panel">
        <div class="label">
            Scrapbox Output
            <button id="copy-btn" class="action-btn">Copy</button>
        </div>
        <textarea id="output" readonly autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Result will appear here..."></textarea>
      </div>
    </div>
  </div>
`;const b=document.querySelector("#input"),g=document.querySelector("#output"),m=document.querySelector("#copy-btn"),I=document.querySelector("#clear-btn");b.addEventListener("input",()=>{q()});m.addEventListener("click",async()=>{if(g.value)try{await navigator.clipboard.writeText(g.value);const s=m.innerText;m.innerText="Copied!",setTimeout(()=>m.innerText=s,2e3)}catch(s){console.error("Failed to copy!",s)}});I.addEventListener("click",()=>{b.value="",g.value=""});function q(){const s=b.value;g.value=w(s)}
