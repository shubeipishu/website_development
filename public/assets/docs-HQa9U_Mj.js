import"./modulepreload-polyfill-B5Qt9EMX.js";import{i as C}from"./theme-DERj3x_X.js";let r=null;const w=async()=>{try{await k()}catch(e){console.warn("Failed to load external dependencies, continuing without them:",e)}await b(),C({onThemeChange:$}),A(),L()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{w()}):w();async function k(){await m("https://cdn.jsdelivr.net/npm/marked/marked.min.js");const e=window;e.marked&&e.marked.setOptions({highlight:function(o,n){return r&&n&&r.getLanguage(n)?r.highlight(o,{language:n}).value:o},breaks:!0,gfm:!0})}function L(){const e=()=>{I().catch(n=>{console.warn("Enhancers failed to load:",n)})},o=window;o.requestIdleCallback?o.requestIdleCallback(e,{timeout:2e3}):setTimeout(e,800)}async function I(){const e=window;r||(await m("https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"),r=e.hljs),e.katex||(await x("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"),await m("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"),await m("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js")),y()}function m(e){return new Promise((o,n)=>{const t=document.createElement("script");t.src=e,t.onload=()=>o(),t.onerror=n,document.head.appendChild(t)})}function x(e){return new Promise((o,n)=>{const t=document.createElement("link");t.rel="stylesheet",t.href=e,t.onload=()=>o(),t.onerror=n,document.head.appendChild(t)})}function $(e){const o=document.getElementById("hljs-theme");if(!o)return;const n="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/",t=e==="dark"?"github-dark.min.css":"github.min.css";o.href=n+t}let l=null;const f=new Map;async function b(){const e=document.getElementById("docs-nav"),o=document.getElementById("docs-content");try{const n=await fetch("/docs/config.json");if(!n.ok)throw new Error("Config not found");l=await n.json(),j(l);const i=new URLSearchParams(window.location.search).get("doc");i?u(i):l.sections.length>0&&l.sections[0].items.length>0&&u(l.sections[0].items[0].file)}catch(n){console.error("Failed to load docs config:",n),e&&(e.innerHTML='<p style="padding: 1rem; color: var(--text-secondary);">文档配置加载失败</p>'),o&&E("配置文件加载失败","请检查 docs/config.json 是否存在")}}function j(e){const o=document.getElementById("docs-nav");if(!o)return;let n="";e.sections.forEach(t=>{n+=`
            <div class="nav-section">
                <div class="nav-section-title">${t.title}</div>
                <ul class="nav-list">
                    ${t.items.map(i=>`
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
        `}),e.downloads&&e.downloads.length>0&&(n+=`
            <div class="nav-section downloads-section">
                <div class="nav-section-title">📥 下载</div>
                <ul class="nav-list">
                    ${e.downloads.map(t=>`
                        <li class="nav-item">
                            <a href="/docs/downloads/${t.file}" 
                               class="download-link" 
                               download>
                                <span>📎</span>
                                <span>${t.name}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `),o.innerHTML=n,o.dataset.bound||(o.addEventListener("click",t=>{const i=t.target,s=i==null?void 0:i.closest("a.nav-link");if(!s||t.metaKey||t.ctrlKey||t.shiftKey||t.button===1)return;t.preventDefault();const a=s.dataset.file;if(!a)return;u(a);const c=new URL(window.location.href);c.searchParams.set("doc",a),window.history.pushState({},"",c),o.querySelectorAll(".nav-link").forEach(d=>d.classList.remove("active")),s.classList.add("active")}),o.dataset.bound="1")}async function u(e){const o=document.getElementById("docs-content");if(o){if(f.has(e)){g(e,f.get(e)||"");return}o.innerHTML=`
        <div class="docs-loading">
            <div class="loading-spinner"></div>
            <span>加载文档中...</span>
        </div>
    `;try{const n=await fetch(`/docs/${e}`);if(!n.ok)throw new Error("Document not found");const t=await n.text();f.set(e,t),g(e,t)}catch(n){console.error("Failed to load document:",n),E("文档未找到",`无法加载 ${e}`)}}}function g(e,o){const n=document.getElementById("docs-content"),t=document.getElementById("docs-title");if(!n)return;const i=window;i.marked?n.innerHTML=`<div class="markdown-body">${i.marked.parse(o)}</div>`:n.innerHTML=`<pre>${o}</pre>`,S(n),y();const s=n.querySelector("h1");t&&s&&(t.textContent=s.textContent||"",s.remove()),document.querySelectorAll(".nav-link").forEach(a=>{a.classList.toggle("active",a.dataset.file===e)}),D(n,e)}function y(){const e=document.getElementById("docs-content");if(!e)return;const o=window;o.renderMathInElement&&o.renderMathInElement(e,{delimiters:[{left:"$$",right:"$$",display:!0},{left:"$",right:"$",display:!1},{left:"\\(",right:"\\)",display:!1},{left:"\\[",right:"\\]",display:!0}],throwOnError:!1}),r&&e.querySelectorAll("pre code").forEach(n=>{r.highlightElement(n)})}function S(e){e.querySelectorAll("blockquote").forEach(n=>{var p,v;const t=n.firstElementChild;if(!t)return;const s=(((p=t.textContent)==null?void 0:p.trim())||"").match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);if(!s)return;const a=s[1].toLowerCase(),c=s[2]||s[1].toUpperCase();t.textContent=((v=t.textContent)==null?void 0:v.replace(s[0],"").trim())||"",t.textContent||t.remove(),n.classList.add("admonition",`admonition-${a}`);const d=document.createElement("div");d.className="admonition-title",d.textContent=c;const h=document.createElement("div");for(h.className="admonition-content";n.firstChild;)h.appendChild(n.firstChild);n.appendChild(d),n.appendChild(h)})}function D(e,o){e.querySelectorAll("a[href]").forEach(t=>{const i=t.getAttribute("href");i&&i.endsWith(".md")&&!i.startsWith("http")&&t.addEventListener("click",s=>{s.preventDefault();const a=T(o,i);u(a);const c=new URL(window.location.href);c.searchParams.set("doc",a),window.history.pushState({},"",c)})})}function T(e,o){let t=e.substring(0,e.lastIndexOf("/")+1)+o;for(;t.includes("../");){const i=t.indexOf("../"),s=t.substring(0,i),a=s.substring(0,s.lastIndexOf("/",s.length-2)+1),c=t.substring(i+3);t=a+c}return t=t.replace(/\.\//g,""),t}function E(e,o){const n=document.getElementById("docs-content");n&&(n.innerHTML=`
        <div class="docs-empty">
            <div class="docs-empty-icon">📭</div>
            <div class="docs-empty-title">${e}</div>
            <div class="docs-empty-desc">${o}</div>
        </div>
    `)}function A(){const e=document.getElementById("docs-search");e&&e.addEventListener("input",o=>{const n=o.target,t=(n==null?void 0:n.value.toLowerCase().trim())||"";document.querySelectorAll(".nav-item").forEach(s=>{var c;const a=((c=s.textContent)==null?void 0:c.toLowerCase())||"";s.style.display=t===""||a.includes(t)?"":"none"}),document.querySelectorAll(".nav-section").forEach(s=>{const a=Array.from(s.querySelectorAll(".nav-item")).some(c=>c.style.display!=="none");s.style.display=a?"":"none"})})}window.addEventListener("popstate",()=>{const o=new URLSearchParams(window.location.search).get("doc");o&&u(o)});
