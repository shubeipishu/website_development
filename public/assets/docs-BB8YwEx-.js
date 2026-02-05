import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css             */let r=null;const v=async()=>{try{await C()}catch(t){console.warn("Failed to load external dependencies, continuing without them:",t)}await x(),S(),q(),I()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{v()}):v();async function C(){await u("https://cdn.jsdelivr.net/npm/marked/marked.min.js");const t=window;t.marked&&t.marked.setOptions({highlight:function(o,n){return r&&n&&r.getLanguage(n)?r.highlight(o,{language:n}).value:o},breaks:!0,gfm:!0})}function I(){const t=()=>{L().catch(n=>{console.warn("Enhancers failed to load:",n)})},o=window;o.requestIdleCallback?o.requestIdleCallback(t,{timeout:2e3}):setTimeout(t,800)}async function L(){const t=window;r||(await u("https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"),r=t.hljs),t.katex||(await T("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"),await u("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"),await u("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js")),E()}function u(t){return new Promise((o,n)=>{const e=document.createElement("script");e.src=t,e.onload=()=>o(),e.onerror=n,document.head.appendChild(e)})}function T(t){return new Promise((o,n)=>{const e=document.createElement("link");e.rel="stylesheet",e.href=t,e.onload=()=>o(),e.onerror=n,document.head.appendChild(e)})}function S(){const t=document.getElementById("theme-toggle"),o=300,n="site-theme",e=localStorage.getItem(n)||"light",i=s=>{document.documentElement.setAttribute("data-theme",s),w(s),b(s)};i(e),window.addEventListener("pageshow",s=>{if(s.persisted){const a=localStorage.getItem(n)||"light";i(a)}}),window.addEventListener("storage",s=>{if(s.key===n){const a=s.newValue||"light";i(a)}}),t&&t.addEventListener("click",()=>{const a=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.classList.add("theme-transition"),document.documentElement.setAttribute("data-theme",a),w(a),localStorage.setItem(n,a),setTimeout(()=>{document.documentElement.classList.remove("theme-transition")},o)})}function w(t){const o=document.getElementById("theme-toggle");o&&(o.textContent=t==="dark"?"☀️":"🌙")}function b(t){const o=document.getElementById("hljs-theme");if(!o)return;const n="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/",e=t==="dark"?"github-dark.min.css":"github.min.css";o.href=n+e}let l=null;const f=new Map;async function x(){const t=document.getElementById("docs-nav"),o=document.getElementById("docs-content");try{const n=await fetch("/docs/config.json");if(!n.ok)throw new Error("Config not found");l=await n.json(),$(l);const i=new URLSearchParams(window.location.search).get("doc");i?m(i):l.sections.length>0&&l.sections[0].items.length>0&&m(l.sections[0].items[0].file)}catch(n){console.error("Failed to load docs config:",n),t&&(t.innerHTML='<p style="padding: 1rem; color: var(--text-secondary);">文档配置加载失败</p>'),o&&k("配置文件加载失败","请检查 docs/config.json 是否存在")}}function $(t){const o=document.getElementById("docs-nav");if(!o)return;let n="";t.sections.forEach(e=>{n+=`
            <div class="nav-section">
                <div class="nav-section-title">${e.title}</div>
                <ul class="nav-list">
                    ${e.items.map(i=>`
                        <li class="nav-item">
                            <a href="?doc=${encodeURIComponent(i.file)}" 
                               class="nav-link" 
                               data-file="${i.file}">
                                <span class="nav-link-icon">📄</span>
                                <span>${i.title}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `}),t.downloads&&t.downloads.length>0&&(n+=`
            <div class="nav-section downloads-section">
                <div class="nav-section-title">📥 下载</div>
                <ul class="nav-list">
                    ${t.downloads.map(e=>`
                        <li class="nav-item">
                            <a href="/docs/downloads/${e.file}" 
                               class="download-link" 
                               download>
                                <span>📎</span>
                                <span>${e.name}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `),o.innerHTML=n,o.dataset.bound||(o.addEventListener("click",e=>{const i=e.target,s=i==null?void 0:i.closest("a.nav-link");if(!s||e.metaKey||e.ctrlKey||e.shiftKey||e.button===1)return;e.preventDefault();const a=s.dataset.file;if(!a)return;m(a);const c=new URL(window.location.href);c.searchParams.set("doc",a),window.history.pushState({},"",c),o.querySelectorAll(".nav-link").forEach(d=>d.classList.remove("active")),s.classList.add("active")}),o.dataset.bound="1")}async function m(t){const o=document.getElementById("docs-content");if(o){if(f.has(t)){y(t,f.get(t)||"");return}o.innerHTML=`
        <div class="docs-loading">
            <div class="loading-spinner"></div>
            <span>加载文档中...</span>
        </div>
    `;try{const n=await fetch(`/docs/${t}`);if(!n.ok)throw new Error("Document not found");const e=await n.text();f.set(t,e),y(t,e)}catch(n){console.error("Failed to load document:",n),k("文档未找到",`无法加载 ${t}`)}}}function y(t,o){const n=document.getElementById("docs-content"),e=document.getElementById("docs-title");if(!n)return;const i=window;i.marked?n.innerHTML=`<div class="markdown-body">${i.marked.parse(o)}</div>`:n.innerHTML=`<pre>${o}</pre>`,j(n),E();const s=n.querySelector("h1");e&&s&&(e.textContent=s.textContent||"",s.remove()),document.querySelectorAll(".nav-link").forEach(a=>{a.classList.toggle("active",a.dataset.file===t)}),A(n,t)}function E(){const t=document.getElementById("docs-content");if(!t)return;const o=window;o.renderMathInElement&&o.renderMathInElement(t,{delimiters:[{left:"$$",right:"$$",display:!0},{left:"$",right:"$",display:!1},{left:"\\(",right:"\\)",display:!1},{left:"\\[",right:"\\]",display:!0}],throwOnError:!1}),r&&t.querySelectorAll("pre code").forEach(n=>{r.highlightElement(n)})}function j(t){t.querySelectorAll("blockquote").forEach(n=>{var p,g;const e=n.firstElementChild;if(!e)return;const s=(((p=e.textContent)==null?void 0:p.trim())||"").match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);if(!s)return;const a=s[1].toLowerCase(),c=s[2]||s[1].toUpperCase();e.textContent=((g=e.textContent)==null?void 0:g.replace(s[0],"").trim())||"",e.textContent||e.remove(),n.classList.add("admonition",`admonition-${a}`);const d=document.createElement("div");d.className="admonition-title",d.textContent=c;const h=document.createElement("div");for(h.className="admonition-content";n.firstChild;)h.appendChild(n.firstChild);n.appendChild(d),n.appendChild(h)})}function A(t,o){t.querySelectorAll("a[href]").forEach(e=>{const i=e.getAttribute("href");i&&i.endsWith(".md")&&!i.startsWith("http")&&e.addEventListener("click",s=>{s.preventDefault();const a=D(o,i);m(a);const c=new URL(window.location.href);c.searchParams.set("doc",a),window.history.pushState({},"",c)})})}function D(t,o){let e=t.substring(0,t.lastIndexOf("/")+1)+o;for(;e.includes("../");){const i=e.indexOf("../"),s=e.substring(0,i),a=s.substring(0,s.lastIndexOf("/",s.length-2)+1),c=e.substring(i+3);e=a+c}return e=e.replace(/\.\//g,""),e}function k(t,o){const n=document.getElementById("docs-content");n&&(n.innerHTML=`
        <div class="docs-empty">
            <div class="docs-empty-icon">📭</div>
            <div class="docs-empty-title">${t}</div>
            <div class="docs-empty-desc">${o}</div>
        </div>
    `)}function q(){const t=document.getElementById("docs-search");t&&t.addEventListener("input",o=>{const n=o.target,e=(n==null?void 0:n.value.toLowerCase().trim())||"";document.querySelectorAll(".nav-item").forEach(s=>{var c;const a=((c=s.textContent)==null?void 0:c.toLowerCase())||"";s.style.display=e===""||a.includes(e)?"":"none"}),document.querySelectorAll(".nav-section").forEach(s=>{const a=Array.from(s.querySelectorAll(".nav-item")).some(c=>c.style.display!=="none");s.style.display=a?"":"none"})})}window.addEventListener("popstate",()=>{const o=new URLSearchParams(window.location.search).get("doc");o&&m(o)});
