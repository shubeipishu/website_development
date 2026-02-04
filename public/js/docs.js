/**
 * 文档中心 - 交互脚本
 * 功能：加载导航、渲染 Markdown、搜索过滤
 */

// 引入 marked.js 和 highlight.js (CDN)
let markedLoaded = false;
let hljs = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadDependencies();
    await loadDocsConfig();
    initTheme();
    initSearch();
});

/* ============================================================
   加载外部依赖
   ============================================================ */
async function loadDependencies() {
    // 加载 marked.js
    await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    markedLoaded = true;

    // 加载 highlight.js
    await loadScript('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js');
    hljs = window.hljs;

    // 加载 KaTeX (公式渲染)
    await loadCSS('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css');
    await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js');

    // 配置 marked
    if (window.marked) {
        window.marked.setOptions({
            highlight: function (code, lang) {
                if (hljs && lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return code;
            },
            breaks: true,
            gfm: true
        });
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function loadCSS(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
    });
}

/* ============================================================
   主题切换
   ============================================================ */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const TRANSITION_MS = 300;
    const STORAGE_KEY = 'site-theme';

    // 从 localStorage 读取，如果没有则默认 light
    const savedTheme = localStorage.getItem(STORAGE_KEY) || 'light';

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeIcon(theme);
        syncHighlightTheme(theme);
    };

    applyTheme(savedTheme);

    // 处理页面缓存恢复
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            const theme = localStorage.getItem(STORAGE_KEY) || 'light';
            applyTheme(theme);
        }
    });
    // 跨标签页同步主题
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            const theme = e.newValue || 'light';
            applyTheme(theme);
        }
    });

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.classList.add('theme-transition');
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(newTheme);

            // 保存到 localStorage
            localStorage.setItem(STORAGE_KEY, newTheme);

            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, TRANSITION_MS);
        });
    }
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function syncHighlightTheme(theme) {
    const hljsLink = document.getElementById('hljs-theme');
    if (!hljsLink) return;

    const base = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/';
    const file = theme === 'dark' ? 'github-dark.min.css' : 'github.min.css';
    hljsLink.href = base + file;
}

/* ============================================================
   加载文档配置
   ============================================================ */
let docsConfig = null;

async function loadDocsConfig() {
    const sidebar = document.getElementById('docs-nav');
    const content = document.getElementById('docs-content');

    try {
        const response = await fetch('/docs/config.json');
        if (!response.ok) throw new Error('Config not found');

        docsConfig = await response.json();
        renderSidebar(docsConfig);

        // 加载 URL 中指定的文档，或默认第一个
        const urlParams = new URLSearchParams(window.location.search);
        const docPath = urlParams.get('doc');

        if (docPath) {
            loadDocument(docPath);
        } else if (docsConfig.sections.length > 0 && docsConfig.sections[0].items.length > 0) {
            loadDocument(docsConfig.sections[0].items[0].file);
        }
    } catch (error) {
        console.error('Failed to load docs config:', error);
        if (sidebar) {
            sidebar.innerHTML = '<p style="padding: 1rem; color: var(--text-secondary);">文档配置加载失败</p>';
        }
        if (content) {
            showEmptyState('配置文件加载失败', '请检查 docs/config.json 是否存在');
        }
    }
}

/* ============================================================
   渲染侧边栏
   ============================================================ */
function renderSidebar(config) {
    const sidebar = document.getElementById('docs-nav');
    if (!sidebar) return;

    let html = '';

    // 渲染文档分组
    config.sections.forEach(section => {
        html += `
            <div class="nav-section">
                <div class="nav-section-title">${section.title}</div>
                <ul class="nav-list">
                    ${section.items.map(item => `
                        <li class="nav-item">
                            <a href="?doc=${encodeURIComponent(item.file)}" 
                               class="nav-link" 
                               data-file="${item.file}">
                                <span class="nav-link-icon">📄</span>
                                <span>${item.title}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });

    // 渲染下载链接
    if (config.downloads && config.downloads.length > 0) {
        html += `
            <div class="nav-section downloads-section">
                <div class="nav-section-title">📥 下载</div>
                <ul class="nav-list">
                    ${config.downloads.map(item => `
                        <li class="nav-item">
                            <a href="/docs/downloads/${item.file}" 
                               class="download-link" 
                               download>
                                <span>📎</span>
                                <span>${item.name}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    sidebar.innerHTML = html;

    // 绑定导航点击事件
    sidebar.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const file = link.dataset.file;
            loadDocument(file);

            // 更新 URL
            const url = new URL(window.location);
            url.searchParams.set('doc', file);
            window.history.pushState({}, '', url);

            // 更新 active 状态
            sidebar.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

/* ============================================================
   加载并渲染文档
   ============================================================ */
async function loadDocument(filePath) {
    const content = document.getElementById('docs-content');
    const titleEl = document.getElementById('docs-title');

    if (!content) return;

    // 显示加载状态
    content.innerHTML = `
        <div class="docs-loading">
            <div class="loading-spinner"></div>
            <span>加载文档中...</span>
        </div>
    `;

    try {
        const response = await fetch(`/docs/${filePath}`);
        if (!response.ok) throw new Error('Document not found');

        const markdown = await response.text();

        // 渲染 Markdown
        if (window.marked) {
            content.innerHTML = `<div class="markdown-body">${window.marked.parse(markdown)}</div>`;
        } else {
            content.innerHTML = `<pre>${markdown}</pre>`;
        }

        // 处理 Admonition 语法: > [!NOTE] / [!TIP] / [!WARNING] 等
        transformAdmonitions(content);

        // 渲染公式 (KaTeX)
        if (window.renderMathInElement) {
            renderMathInElement(content, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\(", right: "\\)", display: false },
                    { left: "\\[", right: "\\]", display: true }
                ],
                throwOnError: false
            });
        }

        // 代码高亮
        if (hljs) {
            content.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }

        // 更新标题
        const firstH1 = content.querySelector('h1');
        if (titleEl && firstH1) {
            titleEl.textContent = firstH1.textContent;
            firstH1.remove(); // 避免重复显示
        }

        // 更新 active 导航
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.file === filePath);
        });

        // 拦截 Markdown 内部链接，转换为文档系统导航
        interceptMarkdownLinks(content, filePath);

    } catch (error) {
        console.error('Failed to load document:', error);
        showEmptyState('文档未找到', `无法加载 ${filePath}`);
    }
}

function transformAdmonitions(container) {
    const blocks = container.querySelectorAll('blockquote');
    blocks.forEach(block => {
        const first = block.firstElementChild;
        if (!first) return;

        const raw = first.textContent.trim();
        const match = raw.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
        if (!match) return;

        const type = match[1].toLowerCase();
        const titleText = match[2] || match[1].toUpperCase();

        // 清理首段的 [!TYPE] 文本
        first.textContent = first.textContent.replace(match[0], '').trim();
        if (!first.textContent) {
            first.remove();
        }

        block.classList.add('admonition', `admonition-${type}`);

        const title = document.createElement('div');
        title.className = 'admonition-title';
        title.textContent = titleText;

        const content = document.createElement('div');
        content.className = 'admonition-content';
        while (block.firstChild) {
            content.appendChild(block.firstChild);
        }

        block.appendChild(title);
        block.appendChild(content);
    });
}

/* ============================================================
   拦截 Markdown 内部链接
   将 .md 文件的相对链接转换为文档系统的内部导航
   ============================================================ */
function interceptMarkdownLinks(container, currentFilePath) {
    const links = container.querySelectorAll('a[href]');

    links.forEach(link => {
        const href = link.getAttribute('href');

        // 只处理 .md 结尾的相对链接
        if (href && href.endsWith('.md') && !href.startsWith('http')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // 计算目标文件的完整路径
                const targetPath = resolveRelativePath(currentFilePath, href);

                // 使用文档系统加载
                loadDocument(targetPath);

                // 更新 URL
                const url = new URL(window.location);
                url.searchParams.set('doc', targetPath);
                window.history.pushState({}, '', url);
            });
        }
    });
}

/* ============================================================
   解析相对路径
   将相对路径转换为相对于 docs/ 根目录的路径
   ============================================================ */
function resolveRelativePath(currentPath, relativePath) {
    // 获取当前文件所在目录
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);

    // 合并路径
    let targetPath = currentDir + relativePath;

    // 处理 ../ (上级目录)
    while (targetPath.includes('../')) {
        // 找到 ../ 的位置
        const dotDotIndex = targetPath.indexOf('../');
        // 找到 ../ 之前的目录
        const beforeDotDot = targetPath.substring(0, dotDotIndex);
        // 移除最后一个目录
        const parentDir = beforeDotDot.substring(0, beforeDotDot.lastIndexOf('/', beforeDotDot.length - 2) + 1);
        // 拼接剩余路径
        const afterDotDot = targetPath.substring(dotDotIndex + 3);
        targetPath = parentDir + afterDotDot;
    }

    // 处理 ./ (当前目录)
    targetPath = targetPath.replace(/\.\//g, '');

    return targetPath;
}



/* ============================================================
   空状态显示
   ============================================================ */
function showEmptyState(title, desc) {
    const content = document.getElementById('docs-content');
    if (!content) return;

    content.innerHTML = `
        <div class="docs-empty">
            <div class="docs-empty-icon">📭</div>
            <div class="docs-empty-title">${title}</div>
            <div class="docs-empty-desc">${desc}</div>
        </div>
    `;
}

/* ============================================================
   搜索过滤
   ============================================================ */
function initSearch() {
    const searchInput = document.getElementById('docs-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = query === '' || text.includes(query) ? '' : 'none';
        });

        // 显示/隐藏空的分组
        document.querySelectorAll('.nav-section').forEach(section => {
            const visibleItems = section.querySelectorAll('.nav-item[style=""]').length +
                section.querySelectorAll('.nav-item:not([style])').length;
            const hasVisible = Array.from(section.querySelectorAll('.nav-item')).some(
                item => item.style.display !== 'none'
            );
            section.style.display = hasVisible ? '' : 'none';
        });
    });
}

/* ============================================================
   浏览器历史导航
   ============================================================ */
window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const docPath = urlParams.get('doc');
    if (docPath) {
        loadDocument(docPath);
    }
});
