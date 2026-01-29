(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function u(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(e){if(e.ep)return;e.ep=!0;const r=u(e);fetch(e.href,r)}})();document.querySelector("#app").innerHTML=`
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
`;const L=document.querySelector("#input"),m=document.querySelector("#output"),h=document.querySelector("#copy-btn"),x=document.querySelector("#clear-btn");L.addEventListener("input",()=>{M()});h.addEventListener("click",async()=>{if(m.value)try{await navigator.clipboard.writeText(m.value);const a=h.innerText;h.innerText="Copied!",setTimeout(()=>h.innerText=a,2e3)}catch(a){console.error("Failed to copy!",a)}});x.addEventListener("click",()=>{L.value="",m.value=""});function M(){const a=L.value;m.value=w(a)}function w(a){const t=a.split(`
`),u=[];for(let i=0;i<t.length;i++){const n=t[i];if(n.trim()==="---"||n.trim()==="***"||n.trim()==="___"){u.length>0&&u[u.length-1].trim()===""&&u.pop(),i+1<t.length&&t[i+1].trim()===""&&i++;continue}u.push(n)}const o=[];let e=!1,r=0;for(let i=0;i<u.length;i++){let n=u[i];const g=" ".repeat(r+1);if(n.trim().startsWith("```")){if(e)e=!1;else{e=!0;const c=n.trim().slice(3).trim();o.push(`code:${c||"snippet"}`)}continue}if(e){o.push(" "+n);continue}if(n.trim()===""){o.push("");continue}const v=n.match(/^(#+)\s+(.*)/);if(v){const c=v[1].length,s=v[2],p=d(s).replace(/[`\[\]]/g,""),l=Math.max(0,c-2),f=" ".repeat(l);r=l,o.push(`${f}[** ${p}]`),o.push(`${f} code:txt`),o.push(`${f}  ${s}`),o.push("");continue}const y=n.match(/^(\s*)[-*+]\s+(.*)/);if(y){const c=y[1],s=y[2],p=Math.floor(c.length/2),l=" ".repeat(r+1+p);o.push(`${l}${d(s)}`);continue}const $=n.match(/^(\s*)\d+\.\s+(.*)/);if($){const c=$[1],s=$[2],p=Math.floor(c.length/2),l=" ".repeat(r+1+p);o.push(`${l}${d("1. "+s)}`);continue}if(n.trim().startsWith(">")){const c=n.match(/^(\s*>+)\s*(.*)/);if(c){const s=c[1].replace(/\s/g,""),p=c[2],l=s.length,f=" ".repeat(r+1),S=">".repeat(l);o.push(`${f}${S} ${d(p)}`)}continue}if(n.trim().startsWith("|")){const c=n.split("|").filter(s=>s.trim()!=="").map(s=>d(s.trim()));o.push(g+"	"+c.join("	"));continue}const b=n.match(/^(\s+)(.*)/);if(b){const c=b[1],s=b[2],p=Math.floor(c.length/2),l=g+" ".repeat(p);o.push(`${l}${d(s)}`)}else o.push(g+d(n))}return o.join(`
`)}function d(a){let t=a;return t=t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,"[$2]"),t=t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,"[$2 $1]"),t=t.replace(/\*\*([^*]+)\*\*/g,"[* $1]"),t=t.replace(/\*([^*]+)\*/g,"[/ $1]"),t=t.replace(/~~([^~]+)~~/g,"[- $1]"),t}
