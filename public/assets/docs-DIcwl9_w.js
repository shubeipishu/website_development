const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/core-Ct3Qxs7w.js","assets/_commonjsHelpers-BosuxZz1.js","assets/auto-render-DnD2WXrv.js","assets/katex-G9EdgA5J.js","assets/katex-CBmFCdgC.css"])))=>i.map(i=>d[i]);
import"./modulepreload-polyfill-B5Qt9EMX.js";import{i as S,a as b,o as O,t as f,g as _,_ as c}from"./i18n-n2hhxkI7.js";const x="/assets/github-BfC0goYb.css",R="/assets/github-dark-BEHUn5zE.css",D={zh:"/docs",en:"/docs-en"};let v=null,E=null,m=null,y=null,L=null;async function B(){v||(E||(E=(async()=>{const{marked:t}=await c(async()=>{const{marked:e}=await import("./marked.esm-CuXovWCe.js");return{marked:e}},[]);t.setOptions({breaks:!0,gfm:!0}),v=t})()),await E)}async function q(){m&&y||(L||(L=(async()=>{const[{default:t},{default:e},{default:s},{default:o},{default:a},{default:n},{default:r},{default:i},{default:d},{default:l}]=await Promise.all([c(()=>import("./core-Ct3Qxs7w.js"),__vite__mapDeps([0,1])),c(()=>import("./bash-I8pq0VWm.js"),[]),c(()=>import("./css-DazXZka4.js"),[]),c(()=>import("./javascript-BKRaQes9.js"),[]),c(()=>import("./json-DIYVocXf.js"),[]),c(()=>import("./markdown-BrP960CR.js"),[]),c(()=>import("./python-kSlZHhJb.js"),[]),c(()=>import("./typescript-C2FFdlUC.js"),[]),c(()=>import("./xml-BXBhIUeX.js"),[]),c(()=>import("./auto-render-DnD2WXrv.js"),__vite__mapDeps([2,3])),c(()=>Promise.resolve({}),__vite__mapDeps([4]))]);t.registerLanguage("bash",e),t.registerLanguage("css",s),t.registerLanguage("javascript",o),t.registerLanguage("js",o),t.registerLanguage("json",a),t.registerLanguage("markdown",n),t.registerLanguage("md",n),t.registerLanguage("python",r),t.registerLanguage("py",r),t.registerLanguage("typescript",i),t.registerLanguage("ts",i),t.registerLanguage("html",d),t.registerLanguage("xml",d),m=t,y=l})()),await L)}let h=null;const A=async()=>{S(),await V(),b({onThemeChange:M}),K(),O(()=>{u&&P(u),h&&g(h,{force:!0})})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{A()}):A();function M(t){const e=document.getElementById("hljs-theme");e&&(e.href=t==="dark"?R:x)}let u=null;const w=new Map;function C(t=_()){return D[t]||D.zh}function I(t,e=_()){return t?typeof t=="string"?t:t[e]||t.zh||"":""}async function V(){const t=document.getElementById("docs-nav"),e=document.getElementById("docs-content");try{const s=await fetch("/docs/config.json");if(!s.ok)throw new Error("Config not found");u=await s.json(),P(u);const a=new URLSearchParams(window.location.search).get("doc");a?g(a):u.sections.length>0&&u.sections[0].items.length>0&&g(u.sections[0].items[0].file)}catch(s){console.error("Failed to load docs config:",s),t&&(t.innerHTML=`<p style="padding: 1rem; color: var(--text-secondary);">${f("docs.error.config.sidebar")}</p>`),e&&k(f("docs.error.config.title"),f("docs.error.config.desc"))}}function P(t){const e=document.getElementById("docs-nav");if(!e)return;let s="";const o=_(),a=C(o);t.sections.forEach(n=>{s+=`
            <div class="nav-section">
                <div class="nav-section-title">${I(n.title,o)}</div>
                <ul class="nav-list">
                    ${n.items.map(r=>`
                        <li class="nav-item">
                            <a href="?doc=${encodeURIComponent(r.file)}" 
                               class="nav-link" 
                               data-file="${r.file}">
                                <span class="nav-link-icon">📄</span>
                                <span>${I(r.title,o)}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `}),t.downloads&&t.downloads.length>0&&(s+=`
            <div class="nav-section downloads-section">
                <div class="nav-section-title">${f("docs.nav.downloads")}</div>
                <ul class="nav-list">
                    ${t.downloads.map(n=>`
                        <li class="nav-item">
                            <a href="${a}/downloads/${n.file}" 
                               class="download-link" 
                               download>
                                <span>📎</span>
                                <span>${I(n.name,o)}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `),e.innerHTML=s,h&&e.querySelectorAll(".nav-link").forEach(n=>{n.classList.toggle("active",n.dataset.file===h)}),e.dataset.bound||(e.addEventListener("click",n=>{const r=n.target,i=r==null?void 0:r.closest("a.nav-link");if(!i||n.metaKey||n.ctrlKey||n.shiftKey||n.button===1)return;n.preventDefault();const d=i.dataset.file;if(!d)return;g(d);const l=new URL(window.location.href);l.searchParams.set("doc",d),window.history.pushState({},"",l),e.querySelectorAll(".nav-link").forEach(p=>p.classList.remove("active")),i.classList.add("active")}),e.dataset.bound="1")}async function g(t,e={}){const s=document.getElementById("docs-content");if(!s)return;h=t;const o=_(),a=`${o}:${t}`;if(!e.force&&w.has(a)){await T(t,w.get(a)||"");return}s.innerHTML=`
        <div class="docs-loading">
            <div class="loading-spinner"></div>
            <span>${f("docs.loading")}</span>
        </div>
    `;try{const n=C(o);let r=await fetch(`${n}/${t}`);if(!r.ok&&o==="en"&&(r=await fetch(`${C("zh")}/${t}`)),!r.ok)throw new Error("Document not found");const i=await r.text();w.set(a,i),await T(t,i)}catch(n){console.error("Failed to load document:",n),k(f("docs.error.notfound.title"),f("docs.error.notfound.desc",{file:t}))}}async function T(t,e){const s=document.getElementById("docs-content"),o=document.getElementById("docs-title");if(!s||(await B(),!v))return;s.innerHTML=`<div class="markdown-body">${v.parse(e)}</div>`,U(s),await j(e),N(s);const a=s.querySelector("h1");o&&a&&(o.textContent=a.textContent||"",a.remove()),document.querySelectorAll(".nav-link").forEach(n=>{n.classList.toggle("active",n.dataset.file===t)}),H(s,t)}async function j(t){const e=document.getElementById("docs-content");if(!e)return;const s=e.querySelector("pre code")!==null,o=t.includes("$$")||t.includes("\\(")||t.includes("\\[")||/(^|[^\\])\$(?!\s)/m.test(t);!s&&!o||(await q(),!(!m||!y)&&(o&&y(e,{delimiters:[{left:"$$",right:"$$",display:!0},{left:"$",right:"$",display:!1},{left:"\\(",right:"\\)",display:!1},{left:"\\[",right:"\\]",display:!0}],throwOnError:!1}),s&&e.querySelectorAll("pre code").forEach(a=>{m==null||m.highlightElement(a)})))}function U(t){t.querySelectorAll("blockquote").forEach(s=>{var p,$;const o=s.firstElementChild;if(!o)return;const n=(((p=o.textContent)==null?void 0:p.trim())||"").match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);if(!n)return;const r=n[1].toLowerCase(),i=n[2]||n[1].toUpperCase();o.textContent=(($=o.textContent)==null?void 0:$.replace(n[0],"").trim())||"",o.textContent||o.remove(),s.classList.add("admonition",`admonition-${r}`);const d=document.createElement("div");d.className="admonition-title",d.textContent=i;const l=document.createElement("div");for(l.className="admonition-content";s.firstChild;)l.appendChild(s.firstChild);s.appendChild(d),s.appendChild(l)})}function H(t,e){t.querySelectorAll("a[href]").forEach(o=>{const a=o.getAttribute("href");a&&a.endsWith(".md")&&!a.startsWith("http")&&o.addEventListener("click",n=>{n.preventDefault();const r=z(e,a);g(r);const i=new URL(window.location.href);i.searchParams.set("doc",r),window.history.pushState({},"",i)})})}function N(t){t.querySelectorAll('a[href*="/apps/graph-platform"]').forEach(e=>{e.target="_blank",e.rel="noopener noreferrer"})}function z(t,e){let o=t.substring(0,t.lastIndexOf("/")+1)+e;for(;o.includes("../");){const a=o.indexOf("../"),n=o.substring(0,a),r=n.substring(0,n.lastIndexOf("/",n.length-2)+1),i=o.substring(a+3);o=r+i}return o=o.replace(/\.\//g,""),o}function k(t,e){const s=document.getElementById("docs-content");s&&(s.innerHTML=`
        <div class="docs-empty">
            <div class="docs-empty-icon">📭</div>
            <div class="docs-empty-title">${t}</div>
            <div class="docs-empty-desc">${e}</div>
        </div>
    `)}function K(){const t=document.getElementById("docs-search");t&&t.addEventListener("input",e=>{const s=e.target,o=(s==null?void 0:s.value.toLowerCase().trim())||"";document.querySelectorAll(".nav-item").forEach(n=>{var i;const r=((i=n.textContent)==null?void 0:i.toLowerCase())||"";n.style.display=o===""||r.includes(o)?"":"none"}),document.querySelectorAll(".nav-section").forEach(n=>{const r=Array.from(n.querySelectorAll(".nav-item")).some(i=>i.style.display!=="none");n.style.display=r?"":"none"})})}window.addEventListener("popstate",()=>{const e=new URLSearchParams(window.location.search).get("doc");e&&g(e)});
