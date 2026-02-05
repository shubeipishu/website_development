import"./modulepreload-polyfill-B5Qt9EMX.js";import{i as S,a as j,o as D,t as l,g as v}from"./i18n-CTpBxxhn.js";let u=null;const k={zh:"/docs",en:"/docs-en"};let m=null;const L=async()=>{try{await A()}catch(t){console.warn("Failed to load external dependencies, continuing without them:",t)}S(),await P(),j({onThemeChange:M}),U(),T(),D(()=>{d&&I(d),m&&f(m,{force:!0})})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{L()}):L();async function A(){await g("https://cdn.jsdelivr.net/npm/marked/marked.min.js");const t=window;t.marked&&t.marked.setOptions({highlight:function(n,e){return u&&e&&u.getLanguage(e)?u.highlight(n,{language:e}).value:n},breaks:!0,gfm:!0})}function T(){const t=()=>{q().catch(e=>{console.warn("Enhancers failed to load:",e)})},n=window;n.requestIdleCallback?n.requestIdleCallback(t,{timeout:2e3}):setTimeout(t,800)}async function q(){const t=window;u||(await g("https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"),u=t.hljs),t.katex||(await B("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"),await g("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"),await g("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js")),b()}function g(t){return new Promise((n,e)=>{const o=document.createElement("script");o.src=t,o.onload=()=>n(),o.onerror=e,document.head.appendChild(o)})}function B(t){return new Promise((n,e)=>{const o=document.createElement("link");o.rel="stylesheet",o.href=t,o.onload=()=>n(),o.onerror=e,document.head.appendChild(o)})}function M(t){const n=document.getElementById("hljs-theme");if(!n)return;const e="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/",o=t==="dark"?"github-dark.min.css":"github.min.css";n.href=e+o}let d=null;const w=new Map;function E(t=v()){return k[t]||k.zh}function y(t,n=v()){return t?typeof t=="string"?t:t[n]||t.zh||"":""}async function P(){const t=document.getElementById("docs-nav"),n=document.getElementById("docs-content");try{const e=await fetch("/docs/config.json");if(!e.ok)throw new Error("Config not found");d=await e.json(),I(d);const r=new URLSearchParams(window.location.search).get("doc");r?f(r):d.sections.length>0&&d.sections[0].items.length>0&&f(d.sections[0].items[0].file)}catch(e){console.error("Failed to load docs config:",e),t&&(t.innerHTML=`<p style="padding: 1rem; color: var(--text-secondary);">${l("docs.error.config.sidebar")}</p>`),n&&x(l("docs.error.config.title"),l("docs.error.config.desc"))}}function I(t){const n=document.getElementById("docs-nav");if(!n)return;let e="";const o=v(),r=E(o);t.sections.forEach(s=>{e+=`
            <div class="nav-section">
                <div class="nav-section-title">${y(s.title,o)}</div>
                <ul class="nav-list">
                    ${s.items.map(i=>`
                        <li class="nav-item">
                            <a href="?doc=${encodeURIComponent(i.file)}" 
                               class="nav-link" 
                               data-file="${i.file}">
                                <span class="nav-link-icon">📄</span>
                                <span>${y(i.title,o)}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `}),t.downloads&&t.downloads.length>0&&(e+=`
            <div class="nav-section downloads-section">
                <div class="nav-section-title">${l("docs.nav.downloads")}</div>
                <ul class="nav-list">
                    ${t.downloads.map(s=>`
                        <li class="nav-item">
                            <a href="${r}/downloads/${s.file}" 
                               class="download-link" 
                               download>
                                <span>📎</span>
                                <span>${y(s.name,o)}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `),n.innerHTML=e,m&&n.querySelectorAll(".nav-link").forEach(s=>{s.classList.toggle("active",s.dataset.file===m)}),n.dataset.bound||(n.addEventListener("click",s=>{const i=s.target,a=i==null?void 0:i.closest("a.nav-link");if(!a||s.metaKey||s.ctrlKey||s.shiftKey||s.button===1)return;s.preventDefault();const c=a.dataset.file;if(!c)return;f(c);const h=new URL(window.location.href);h.searchParams.set("doc",c),window.history.pushState({},"",h),n.querySelectorAll(".nav-link").forEach(p=>p.classList.remove("active")),a.classList.add("active")}),n.dataset.bound="1")}async function f(t,n={}){const e=document.getElementById("docs-content");if(!e)return;m=t;const o=v(),r=`${o}:${t}`;if(!n.force&&w.has(r)){$(t,w.get(r)||"");return}e.innerHTML=`
        <div class="docs-loading">
            <div class="loading-spinner"></div>
            <span>${l("docs.loading")}</span>
        </div>
    `;try{const s=E(o);let i=await fetch(`${s}/${t}`);if(!i.ok&&o==="en"&&(i=await fetch(`${E("zh")}/${t}`)),!i.ok)throw new Error("Document not found");const a=await i.text();w.set(r,a),$(t,a)}catch(s){console.error("Failed to load document:",s),x(l("docs.error.notfound.title"),l("docs.error.notfound.desc",{file:t}))}}function $(t,n){const e=document.getElementById("docs-content"),o=document.getElementById("docs-title");if(!e)return;const r=window;r.marked?e.innerHTML=`<div class="markdown-body">${r.marked.parse(n)}</div>`:e.innerHTML=`<pre>${n}</pre>`,O(e),b(),R(e);const s=e.querySelector("h1");o&&s&&(o.textContent=s.textContent||"",s.remove()),document.querySelectorAll(".nav-link").forEach(i=>{i.classList.toggle("active",i.dataset.file===t)}),H(e,t)}function b(){const t=document.getElementById("docs-content");if(!t)return;const n=window;n.renderMathInElement&&n.renderMathInElement(t,{delimiters:[{left:"$$",right:"$$",display:!0},{left:"$",right:"$",display:!1},{left:"\\(",right:"\\)",display:!1},{left:"\\[",right:"\\]",display:!0}],throwOnError:!1}),u&&t.querySelectorAll("pre code").forEach(e=>{u.highlightElement(e)})}function O(t){t.querySelectorAll("blockquote").forEach(e=>{var p,C;const o=e.firstElementChild;if(!o)return;const s=(((p=o.textContent)==null?void 0:p.trim())||"").match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);if(!s)return;const i=s[1].toLowerCase(),a=s[2]||s[1].toUpperCase();o.textContent=((C=o.textContent)==null?void 0:C.replace(s[0],"").trim())||"",o.textContent||o.remove(),e.classList.add("admonition",`admonition-${i}`);const c=document.createElement("div");c.className="admonition-title",c.textContent=a;const h=document.createElement("div");for(h.className="admonition-content";e.firstChild;)h.appendChild(e.firstChild);e.appendChild(c),e.appendChild(h)})}function H(t,n){t.querySelectorAll("a[href]").forEach(o=>{const r=o.getAttribute("href");r&&r.endsWith(".md")&&!r.startsWith("http")&&o.addEventListener("click",s=>{s.preventDefault();const i=N(n,r);f(i);const a=new URL(window.location.href);a.searchParams.set("doc",i),window.history.pushState({},"",a)})})}function R(t){t.querySelectorAll('a[href*="/apps/graph-platform"]').forEach(n=>{n.target="_blank",n.rel="noopener noreferrer"})}function N(t,n){let o=t.substring(0,t.lastIndexOf("/")+1)+n;for(;o.includes("../");){const r=o.indexOf("../"),s=o.substring(0,r),i=s.substring(0,s.lastIndexOf("/",s.length-2)+1),a=o.substring(r+3);o=i+a}return o=o.replace(/\.\//g,""),o}function x(t,n){const e=document.getElementById("docs-content");e&&(e.innerHTML=`
        <div class="docs-empty">
            <div class="docs-empty-icon">📭</div>
            <div class="docs-empty-title">${t}</div>
            <div class="docs-empty-desc">${n}</div>
        </div>
    `)}function U(){const t=document.getElementById("docs-search");t&&t.addEventListener("input",n=>{const e=n.target,o=(e==null?void 0:e.value.toLowerCase().trim())||"";document.querySelectorAll(".nav-item").forEach(s=>{var a;const i=((a=s.textContent)==null?void 0:a.toLowerCase())||"";s.style.display=o===""||i.includes(o)?"":"none"}),document.querySelectorAll(".nav-section").forEach(s=>{const i=Array.from(s.querySelectorAll(".nav-item")).some(a=>a.style.display!=="none");s.style.display=i?"":"none"})})}window.addEventListener("popstate",()=>{const n=new URLSearchParams(window.location.search).get("doc");n&&f(n)});
