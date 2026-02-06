const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/core-Ct3Qxs7w.js","assets/_commonjsHelpers-BosuxZz1.js","assets/auto-render-DnD2WXrv.js","assets/katex-G9EdgA5J.js","assets/katex-CBmFCdgC.css"])))=>i.map(i=>d[i]);
import"./modulepreload-polyfill-B5Qt9EMX.js";import{i as b,a as O,o as x,t as u,g as _,_ as c}from"./i18n-n2hhxkI7.js";const R="/assets/github-BfC0goYb.css",B="/assets/github-dark-BEHUn5zE.css",A={zh:"/docs",en:"/docs-en"};let v=null,E=null,m=null,y=null,L=null,w=null;async function q(){v||(E||(E=(async()=>{const{marked:t}=await c(async()=>{const{marked:e}=await import("./marked.esm-CuXovWCe.js");return{marked:e}},[]);t.setOptions({breaks:!0,gfm:!0}),v=t})()),await E)}async function M(){m||(L||(L=(async()=>{const[{default:t},{default:e},{default:s},{default:o},{default:a},{default:n},{default:r},{default:i},{default:l}]=await Promise.all([c(()=>import("./core-Ct3Qxs7w.js"),__vite__mapDeps([0,1])),c(()=>import("./bash-I8pq0VWm.js"),[]),c(()=>import("./css-DazXZka4.js"),[]),c(()=>import("./javascript-BKRaQes9.js"),[]),c(()=>import("./json-DIYVocXf.js"),[]),c(()=>import("./markdown-BrP960CR.js"),[]),c(()=>import("./python-kSlZHhJb.js"),[]),c(()=>import("./typescript-C2FFdlUC.js"),[]),c(()=>import("./xml-BXBhIUeX.js"),[])]);t.registerLanguage("bash",e),t.registerLanguage("css",s),t.registerLanguage("javascript",o),t.registerLanguage("js",o),t.registerLanguage("json",a),t.registerLanguage("markdown",n),t.registerLanguage("md",n),t.registerLanguage("python",r),t.registerLanguage("py",r),t.registerLanguage("typescript",i),t.registerLanguage("ts",i),t.registerLanguage("html",l),t.registerLanguage("xml",l),m=t})()),await L)}async function V(){y||(w||(w=(async()=>{const[{default:t}]=await Promise.all([c(()=>import("./auto-render-DnD2WXrv.js"),__vite__mapDeps([2,3])),c(()=>Promise.resolve({}),__vite__mapDeps([4]))]);y=t})()),await w)}let h=null;const T=async()=>{b(),await U(),O({onThemeChange:j}),W(),x(()=>{d&&k(d),h&&g(h,{force:!0})})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{T()}):T();function j(t){const e=document.getElementById("hljs-theme");e&&(e.href=t==="dark"?B:R)}let d=null;const I=new Map;function $(t=_()){return A[t]||A.zh}function C(t,e=_()){return t?typeof t=="string"?t:t[e]||t.zh||"":""}async function U(){const t=document.getElementById("docs-nav"),e=document.getElementById("docs-content");try{const s=await fetch("/docs/config.json");if(!s.ok)throw new Error("Config not found");d=await s.json(),k(d);const a=new URLSearchParams(window.location.search).get("doc");a?g(a):d.sections.length>0&&d.sections[0].items.length>0&&g(d.sections[0].items[0].file)}catch(s){console.error("Failed to load docs config:",s),t&&(t.innerHTML=`<p style="padding: 1rem; color: var(--text-secondary);">${u("docs.error.config.sidebar")}</p>`),e&&S(u("docs.error.config.title"),u("docs.error.config.desc"))}}function k(t){const e=document.getElementById("docs-nav");if(!e)return;let s="";const o=_(),a=$(o);t.sections.forEach(n=>{s+=`
            <div class="nav-section">
                <div class="nav-section-title">${C(n.title,o)}</div>
                <ul class="nav-list">
                    ${n.items.map(r=>`
                        <li class="nav-item">
                            <a href="?doc=${encodeURIComponent(r.file)}" 
                               class="nav-link" 
                               data-file="${r.file}">
                                <span class="nav-link-icon">📄</span>
                                <span>${C(r.title,o)}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `}),t.downloads&&t.downloads.length>0&&(s+=`
            <div class="nav-section downloads-section">
                <div class="nav-section-title">${u("docs.nav.downloads")}</div>
                <ul class="nav-list">
                    ${t.downloads.map(n=>`
                        <li class="nav-item">
                            <a href="${a}/downloads/${n.file}" 
                               class="download-link" 
                               download>
                                <span>📎</span>
                                <span>${C(n.name,o)}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `),e.innerHTML=s,h&&e.querySelectorAll(".nav-link").forEach(n=>{n.classList.toggle("active",n.dataset.file===h)}),e.dataset.bound||(e.addEventListener("click",n=>{const r=n.target,i=r==null?void 0:r.closest("a.nav-link");if(!i||n.metaKey||n.ctrlKey||n.shiftKey||n.button===1)return;n.preventDefault();const l=i.dataset.file;if(!l)return;g(l);const f=new URL(window.location.href);f.searchParams.set("doc",l),window.history.pushState({},"",f),e.querySelectorAll(".nav-link").forEach(p=>p.classList.remove("active")),i.classList.add("active")}),e.dataset.bound="1")}async function g(t,e={}){const s=document.getElementById("docs-content");if(!s)return;h=t;const o=_(),a=`${o}:${t}`;if(!e.force&&I.has(a)){await P(t,I.get(a)||"");return}s.innerHTML=`
        <div class="docs-loading">
            <div class="loading-spinner"></div>
            <span>${u("docs.loading")}</span>
        </div>
    `;try{const n=$(o);let r=await fetch(`${n}/${t}`);if(!r.ok&&o==="en"&&(r=await fetch(`${$("zh")}/${t}`)),!r.ok)throw new Error("Document not found");const i=await r.text();I.set(a,i),await P(t,i)}catch(n){console.error("Failed to load document:",n),S(u("docs.error.notfound.title"),u("docs.error.notfound.desc",{file:t}))}}async function P(t,e){const s=document.getElementById("docs-content"),o=document.getElementById("docs-title");if(!s||(await q(),!v))return;s.innerHTML=`<div class="markdown-body">${v.parse(e)}</div>`,N(s),await H(e),K(s);const a=s.querySelector("h1");o&&a&&(o.textContent=a.textContent||"",a.remove()),document.querySelectorAll(".nav-link").forEach(n=>{n.classList.toggle("active",n.dataset.file===t)}),z(s,t)}async function H(t){const e=document.getElementById("docs-content");if(!e)return;const s=e.querySelector("pre code")!==null,o=t.includes("$$")||t.includes("\\(")||t.includes("\\[")||/(^|[^\\])\$(?!\s)/m.test(t);if(!(!s&&!o)){if(o){if(await V(),!y)return;y(e,{delimiters:[{left:"$$",right:"$$",display:!0},{left:"$",right:"$",display:!1},{left:"\\(",right:"\\)",display:!1},{left:"\\[",right:"\\]",display:!0}],throwOnError:!1})}if(s){if(await M(),!m)return;e.querySelectorAll("pre code").forEach(a=>{m==null||m.highlightElement(a)})}}}function N(t){t.querySelectorAll("blockquote").forEach(s=>{var p,D;const o=s.firstElementChild;if(!o)return;const n=(((p=o.textContent)==null?void 0:p.trim())||"").match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);if(!n)return;const r=n[1].toLowerCase(),i=n[2]||n[1].toUpperCase();o.textContent=((D=o.textContent)==null?void 0:D.replace(n[0],"").trim())||"",o.textContent||o.remove(),s.classList.add("admonition",`admonition-${r}`);const l=document.createElement("div");l.className="admonition-title",l.textContent=i;const f=document.createElement("div");for(f.className="admonition-content";s.firstChild;)f.appendChild(s.firstChild);s.appendChild(l),s.appendChild(f)})}function z(t,e){t.querySelectorAll("a[href]").forEach(o=>{const a=o.getAttribute("href");a&&a.endsWith(".md")&&!a.startsWith("http")&&o.addEventListener("click",n=>{n.preventDefault();const r=F(e,a);g(r);const i=new URL(window.location.href);i.searchParams.set("doc",r),window.history.pushState({},"",i)})})}function K(t){t.querySelectorAll('a[href*="/apps/graph-platform"]').forEach(e=>{e.target="_blank",e.rel="noopener noreferrer"})}function F(t,e){let o=t.substring(0,t.lastIndexOf("/")+1)+e;for(;o.includes("../");){const a=o.indexOf("../"),n=o.substring(0,a),r=n.substring(0,n.lastIndexOf("/",n.length-2)+1),i=o.substring(a+3);o=r+i}return o=o.replace(/\.\//g,""),o}function S(t,e){const s=document.getElementById("docs-content");s&&(s.innerHTML=`
        <div class="docs-empty">
            <div class="docs-empty-icon">📭</div>
            <div class="docs-empty-title">${t}</div>
            <div class="docs-empty-desc">${e}</div>
        </div>
    `)}function W(){const t=document.getElementById("docs-search");t&&t.addEventListener("input",e=>{const s=e.target,o=(s==null?void 0:s.value.toLowerCase().trim())||"";document.querySelectorAll(".nav-item").forEach(n=>{var i;const r=((i=n.textContent)==null?void 0:i.toLowerCase())||"";n.style.display=o===""||r.includes(o)?"":"none"}),document.querySelectorAll(".nav-section").forEach(n=>{const r=Array.from(n.querySelectorAll(".nav-item")).some(i=>i.style.display!=="none");n.style.display=r?"":"none"})})}window.addEventListener("popstate",()=>{const e=new URLSearchParams(window.location.search).get("doc");e&&g(e)});
