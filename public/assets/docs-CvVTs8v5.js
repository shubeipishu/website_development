import"./modulepreload-polyfill-B5Qt9EMX.js";import{i as S,a as j,o as D,t as l,g as v}from"./i18n-CTpBxxhn.js";let u=null;const k={zh:"/docs",en:"/docs-en"};let m=null;const $=async()=>{try{await T()}catch(t){console.warn("Failed to load external dependencies, continuing without them:",t)}S(),await O(),j({onThemeChange:M}),N(),A(),D(()=>{d&&I(d),m&&f(m,{force:!0})})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{$()}):$();async function T(){await g("https://cdn.jsdelivr.net/npm/marked/marked.min.js");const t=window;t.marked&&t.marked.setOptions({highlight:function(o,e){return u&&e&&u.getLanguage(e)?u.highlight(o,{language:e}).value:o},breaks:!0,gfm:!0})}function A(){const t=()=>{q().catch(e=>{console.warn("Enhancers failed to load:",e)})},o=window;o.requestIdleCallback?o.requestIdleCallback(t,{timeout:2e3}):setTimeout(t,800)}async function q(){const t=window;u||(await g("https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"),u=t.hljs),t.katex||(await B("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"),await g("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"),await g("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js")),b()}function g(t){return new Promise((o,e)=>{const n=document.createElement("script");n.src=t,n.onload=()=>o(),n.onerror=e,document.head.appendChild(n)})}function B(t){return new Promise((o,e)=>{const n=document.createElement("link");n.rel="stylesheet",n.href=t,n.onload=()=>o(),n.onerror=e,document.head.appendChild(n)})}function M(t){const o=document.getElementById("hljs-theme");if(!o)return;const e="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/",n=t==="dark"?"github-dark.min.css":"github.min.css";o.href=e+n}let d=null;const w=new Map;function E(t=v()){return k[t]||k.zh}function y(t,o=v()){return t?typeof t=="string"?t:t[o]||t.zh||"":""}async function O(){const t=document.getElementById("docs-nav"),o=document.getElementById("docs-content");try{const e=await fetch("/docs/config.json");if(!e.ok)throw new Error("Config not found");d=await e.json(),I(d);const a=new URLSearchParams(window.location.search).get("doc");a?f(a):d.sections.length>0&&d.sections[0].items.length>0&&f(d.sections[0].items[0].file)}catch(e){console.error("Failed to load docs config:",e),t&&(t.innerHTML=`<p style="padding: 1rem; color: var(--text-secondary);">${l("docs.error.config.sidebar")}</p>`),o&&x(l("docs.error.config.title"),l("docs.error.config.desc"))}}function I(t){const o=document.getElementById("docs-nav");if(!o)return;let e="";const n=v(),a=E(n);t.sections.forEach(s=>{e+=`
            <div class="nav-section">
                <div class="nav-section-title">${y(s.title,n)}</div>
                <ul class="nav-list">
                    ${s.items.map(i=>`
                        <li class="nav-item">
                            <a href="?doc=${encodeURIComponent(i.file)}" 
                               class="nav-link" 
                               data-file="${i.file}">
                                <span class="nav-link-icon">📄</span>
                                <span>${y(i.title,n)}</span>
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
                            <a href="${a}/downloads/${s.file}" 
                               class="download-link" 
                               download>
                                <span>📎</span>
                                <span>${y(s.name,n)}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `),o.innerHTML=e,m&&o.querySelectorAll(".nav-link").forEach(s=>{s.classList.toggle("active",s.dataset.file===m)}),o.dataset.bound||(o.addEventListener("click",s=>{const i=s.target,c=i==null?void 0:i.closest("a.nav-link");if(!c||s.metaKey||s.ctrlKey||s.shiftKey||s.button===1)return;s.preventDefault();const r=c.dataset.file;if(!r)return;f(r);const h=new URL(window.location.href);h.searchParams.set("doc",r),window.history.pushState({},"",h),o.querySelectorAll(".nav-link").forEach(p=>p.classList.remove("active")),c.classList.add("active")}),o.dataset.bound="1")}async function f(t,o={}){const e=document.getElementById("docs-content");if(!e)return;m=t;const n=v(),a=`${n}:${t}`;if(!o.force&&w.has(a)){L(t,w.get(a)||"");return}e.innerHTML=`
        <div class="docs-loading">
            <div class="loading-spinner"></div>
            <span>${l("docs.loading")}</span>
        </div>
    `;try{const s=E(n);let i=await fetch(`${s}/${t}`);if(!i.ok&&n==="en"&&(i=await fetch(`${E("zh")}/${t}`)),!i.ok)throw new Error("Document not found");const c=await i.text();w.set(a,c),L(t,c)}catch(s){console.error("Failed to load document:",s),x(l("docs.error.notfound.title"),l("docs.error.notfound.desc",{file:t}))}}function L(t,o){const e=document.getElementById("docs-content"),n=document.getElementById("docs-title");if(!e)return;const a=window;a.marked?e.innerHTML=`<div class="markdown-body">${a.marked.parse(o)}</div>`:e.innerHTML=`<pre>${o}</pre>`,P(e),b();const s=e.querySelector("h1");n&&s&&(n.textContent=s.textContent||"",s.remove()),document.querySelectorAll(".nav-link").forEach(i=>{i.classList.toggle("active",i.dataset.file===t)}),H(e,t)}function b(){const t=document.getElementById("docs-content");if(!t)return;const o=window;o.renderMathInElement&&o.renderMathInElement(t,{delimiters:[{left:"$$",right:"$$",display:!0},{left:"$",right:"$",display:!1},{left:"\\(",right:"\\)",display:!1},{left:"\\[",right:"\\]",display:!0}],throwOnError:!1}),u&&t.querySelectorAll("pre code").forEach(e=>{u.highlightElement(e)})}function P(t){t.querySelectorAll("blockquote").forEach(e=>{var p,C;const n=e.firstElementChild;if(!n)return;const s=(((p=n.textContent)==null?void 0:p.trim())||"").match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);if(!s)return;const i=s[1].toLowerCase(),c=s[2]||s[1].toUpperCase();n.textContent=((C=n.textContent)==null?void 0:C.replace(s[0],"").trim())||"",n.textContent||n.remove(),e.classList.add("admonition",`admonition-${i}`);const r=document.createElement("div");r.className="admonition-title",r.textContent=c;const h=document.createElement("div");for(h.className="admonition-content";e.firstChild;)h.appendChild(e.firstChild);e.appendChild(r),e.appendChild(h)})}function H(t,o){t.querySelectorAll("a[href]").forEach(n=>{const a=n.getAttribute("href");a&&a.endsWith(".md")&&!a.startsWith("http")&&n.addEventListener("click",s=>{s.preventDefault();const i=R(o,a);f(i);const c=new URL(window.location.href);c.searchParams.set("doc",i),window.history.pushState({},"",c)})})}function R(t,o){let n=t.substring(0,t.lastIndexOf("/")+1)+o;for(;n.includes("../");){const a=n.indexOf("../"),s=n.substring(0,a),i=s.substring(0,s.lastIndexOf("/",s.length-2)+1),c=n.substring(a+3);n=i+c}return n=n.replace(/\.\//g,""),n}function x(t,o){const e=document.getElementById("docs-content");e&&(e.innerHTML=`
        <div class="docs-empty">
            <div class="docs-empty-icon">📭</div>
            <div class="docs-empty-title">${t}</div>
            <div class="docs-empty-desc">${o}</div>
        </div>
    `)}function N(){const t=document.getElementById("docs-search");t&&t.addEventListener("input",o=>{const e=o.target,n=(e==null?void 0:e.value.toLowerCase().trim())||"";document.querySelectorAll(".nav-item").forEach(s=>{var c;const i=((c=s.textContent)==null?void 0:c.toLowerCase())||"";s.style.display=n===""||i.includes(n)?"":"none"}),document.querySelectorAll(".nav-section").forEach(s=>{const i=Array.from(s.querySelectorAll(".nav-item")).some(c=>c.style.display!=="none");s.style.display=i?"":"none"})})}window.addEventListener("popstate",()=>{const o=new URLSearchParams(window.location.search).get("doc");o&&f(o)});
