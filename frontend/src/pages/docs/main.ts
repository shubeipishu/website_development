import '@/styles/main.css';
import '@/styles/docs.css';
import { initTheme } from '@/shared/theme';
import { getLang, initI18n, onLangChange, t, type Lang } from '@/shared/i18n';

// 引入 marked.js 和 highlight.js (CDN)
let _markedLoaded = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hljs: any = null;

type I18nText = string | { zh?: string; en?: string };
type DocsConfig = {
  sections: Array<{
    title: I18nText;
    items: Array<{ title: I18nText; file: string }>;
  }>;
  downloads?: Array<{ name: I18nText; file: string }>;
};

const DOCS_BASE: Record<Lang, string> = {
  zh: '/docs',
  en: '/docs-en',
};

let currentDocPath: string | null = null;

const init = async () => {
  try {
    await loadDependencies();
  } catch (error) {
    console.warn('Failed to load external dependencies, continuing without them:', error);
  }
  initI18n();
  await loadDocsConfig();
  initTheme({ onThemeChange: syncHighlightTheme });
  initSearch();
  scheduleEnhancers();
  onLangChange(() => {
    if (docsConfig) {
      renderSidebar(docsConfig);
    }
    if (currentDocPath) {
      void loadDocument(currentDocPath, { force: true });
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
} else {
  void init();
}

/* ============================================================
   加载外部依赖
   ============================================================ */
async function loadDependencies() {
  // 加载 marked.js（核心渲染）
  await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
  _markedLoaded = true;

  // 配置 marked（高亮在增强模块加载后再处理）
  const win = window as Window & { marked?: any };
  if (win.marked) {
    win.marked.setOptions({
      highlight: function (code: string, lang: string) {
        if (hljs && lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return code;
      },
      breaks: true,
      gfm: true,
    });
  }
}

function scheduleEnhancers() {
  const run = () => {
    loadEnhancers().catch((err) => {
      console.warn('Enhancers failed to load:', err);
    });
  };
  const win = window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => void };
  if (win.requestIdleCallback) {
    win.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 800);
  }
}

async function loadEnhancers() {
  const win = window as Window & { hljs?: any; katex?: any; renderMathInElement?: any };

  if (!hljs) {
    await loadScript('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js');
    hljs = win.hljs;
  }

  if (!win.katex) {
    await loadCSS('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css');
    await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js');
  }

  enhanceCurrentContent();
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadCSS(href: string) {
  return new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

/* ============================================================
   同步代码高亮主题
   ============================================================ */
function syncHighlightTheme(theme: string) {
  const hljsLink = document.getElementById('hljs-theme') as HTMLLinkElement | null;
  if (!hljsLink) return;

  const base = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/';
  const file = theme === 'dark' ? 'github-dark.min.css' : 'github.min.css';
  hljsLink.href = base + file;
}

/* ============================================================
   加载文档配置
   ============================================================ */
let docsConfig: DocsConfig | null = null;
const docsCache = new Map<string, string>();

function getDocsBase(lang: Lang = getLang()) {
  return DOCS_BASE[lang] || DOCS_BASE.zh;
}

function pickText(value: I18nText, lang: Lang = getLang()) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.zh || '';
}

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
      void loadDocument(docPath);
    } else if (docsConfig.sections.length > 0 && docsConfig.sections[0].items.length > 0) {
      void loadDocument(docsConfig.sections[0].items[0].file);
    }
  } catch (error) {
    console.error('Failed to load docs config:', error);
    if (sidebar) {
      sidebar.innerHTML = `<p style="padding: 1rem; color: var(--text-secondary);">${t('docs.error.config.sidebar')}</p>`;
    }
    if (content) {
      showEmptyState(t('docs.error.config.title'), t('docs.error.config.desc'));
    }
  }
}

/* ============================================================
   渲染侧边栏
   ============================================================ */
function renderSidebar(config: DocsConfig) {
  const sidebar = document.getElementById('docs-nav');
  if (!sidebar) return;

  let html = '';
  const lang = getLang();
  const base = getDocsBase(lang);

  // 渲染文档分组
  config.sections.forEach((section) => {
    html += `
            <div class="nav-section">
                <div class="nav-section-title">${pickText(section.title, lang)}</div>
                <ul class="nav-list">
                    ${section.items
        .map(
          (item) => `
                        <li class="nav-item">
                            <a href="?doc=${encodeURIComponent(item.file)}" 
                               class="nav-link" 
                               data-file="${item.file}">
                                <span class="nav-link-icon">📄</span>
                                <span>${pickText(item.title, lang)}</span>
                            </a>
                        </li>
                    `
        )
        .join('')}
                </ul>
            </div>
        `;
  });

  // 渲染下载链接
  if (config.downloads && config.downloads.length > 0) {
    html += `
            <div class="nav-section downloads-section">
                <div class="nav-section-title">${t('docs.nav.downloads')}</div>
                <ul class="nav-list">
                    ${config.downloads
        .map(
          (item) => `
                        <li class="nav-item">
                            <a href="${base}/downloads/${item.file}" 
                               class="download-link" 
                               download>
                                <span>📎</span>
                                <span>${pickText(item.name, lang)}</span>
                            </a>
                        </li>
                    `
        )
        .join('')}
                </ul>
            </div>
        `;
  }

  sidebar.innerHTML = html;

  if (currentDocPath) {
    sidebar.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', (link as HTMLElement).dataset.file === currentDocPath);
    });
  }

  // 绑定导航点击事件（事件代理，避免链接触发整页刷新）
  if (!sidebar.dataset.bound) {
    sidebar.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest('a.nav-link') as HTMLAnchorElement | null;
      if (!link) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;

      e.preventDefault();
      const file = link.dataset.file;
      if (!file) return;
      void loadDocument(file);

      // 更新 URL
      const url = new URL(window.location.href);
      url.searchParams.set('doc', file);
      window.history.pushState({}, '', url);

      // 更新 active 状态
      sidebar.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
    });
    sidebar.dataset.bound = '1';
  }
}

/* ============================================================
   加载并渲染文档
   ============================================================ */
async function loadDocument(filePath: string, opts: { force?: boolean } = {}) {
  const content = document.getElementById('docs-content');

  if (!content) return;
  currentDocPath = filePath;
  const lang = getLang();
  const cacheKey = `${lang}:${filePath}`;

  if (!opts.force && docsCache.has(cacheKey)) {
    renderDocumentFromCache(filePath, docsCache.get(cacheKey) || '');
    return;
  }

  // 显示加载状态
  content.innerHTML = `
        <div class="docs-loading">
            <div class="loading-spinner"></div>
            <span>${t('docs.loading')}</span>
        </div>
    `;

  try {
    const base = getDocsBase(lang);
    let response = await fetch(`${base}/${filePath}`);
    if (!response.ok && lang === 'en') {
      response = await fetch(`${getDocsBase('zh')}/${filePath}`);
    }
    if (!response.ok) throw new Error('Document not found');

    const markdown = await response.text();
    docsCache.set(cacheKey, markdown);

    renderDocumentFromCache(filePath, markdown);
  } catch (error) {
    console.error('Failed to load document:', error);
    showEmptyState(t('docs.error.notfound.title'), t('docs.error.notfound.desc', { file: filePath }));
  }
}

function renderDocumentFromCache(filePath: string, markdown: string) {
  const content = document.getElementById('docs-content');
  const titleEl = document.getElementById('docs-title');
  if (!content) return;

  // 渲染 Markdown
  const win = window as Window & { marked?: any };
  if (win.marked) {
    content.innerHTML = `<div class="markdown-body">${win.marked.parse(markdown)}</div>`;
  } else {
    content.innerHTML = `<pre>${markdown}</pre>`;
  }

  // 处理 Admonition 语法: > [!NOTE] / [!TIP] / [!WARNING] 等
  transformAdmonitions(content);

  enhanceCurrentContent();
  ensurePlatformLinks(content);

  // 更新标题
  const firstH1 = content.querySelector('h1');
  if (titleEl && firstH1) {
    titleEl.textContent = firstH1.textContent || '';
    firstH1.remove(); // 避免重复显示
  }

  // 更新 active 导航
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.toggle('active', (link as HTMLElement).dataset.file === filePath);
  });

  // 拦截 Markdown 内部链接，转换为文档系统导航
  interceptMarkdownLinks(content, filePath);
}

function enhanceCurrentContent() {
  const content = document.getElementById('docs-content');
  if (!content) return;

  const win = window as Window & { renderMathInElement?: any };

  // 渲染公式 (KaTeX)
  if (win.renderMathInElement) {
    win.renderMathInElement(content, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
    });
  }

  // 代码高亮
  if (hljs) {
    content.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }
}

function transformAdmonitions(container: HTMLElement) {
  const blocks = container.querySelectorAll('blockquote');
  blocks.forEach((block) => {
    const first = block.firstElementChild as HTMLElement | null;
    if (!first) return;

    const raw = first.textContent?.trim() || '';
    const match = raw.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
    if (!match) return;

    const type = match[1].toLowerCase();
    const titleText = match[2] || match[1].toUpperCase();

    // 清理首段的 [!TYPE] 文本
    first.textContent = first.textContent?.replace(match[0], '').trim() || '';
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
function interceptMarkdownLinks(container: HTMLElement, currentFilePath: string) {
  const links = container.querySelectorAll('a[href]');

  links.forEach((link) => {
    const href = link.getAttribute('href');

    // 只处理 .md 结尾的相对链接
    if (href && href.endsWith('.md') && !href.startsWith('http')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        // 计算目标文件的完整路径
        const targetPath = resolveRelativePath(currentFilePath, href);

        // 使用文档系统加载
        void loadDocument(targetPath);

        // 更新 URL
        const url = new URL(window.location.href);
        url.searchParams.set('doc', targetPath);
        window.history.pushState({}, '', url);
      });
    }
  });
}

function ensurePlatformLinks(container: HTMLElement) {
  container.querySelectorAll<HTMLAnchorElement>('a[href*="/apps/graph-platform"]').forEach((link) => {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}

/* ============================================================
   解析相对路径
   将相对路径转换为相对于 docs/ 根目录的路径
   ============================================================ */
function resolveRelativePath(currentPath: string, relativePath: string) {
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
function showEmptyState(title: string, desc: string) {
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
  const searchInput = document.getElementById('docs-search') as HTMLInputElement | null;
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement | null;
    const query = target?.value.toLowerCase().trim() || '';
    const navItems = document.querySelectorAll<HTMLElement>('.nav-item');

    navItems.forEach((item) => {
      const text = item.textContent?.toLowerCase() || '';
      item.style.display = query === '' || text.includes(query) ? '' : 'none';
    });

    // 显示/隐藏空的分组
    document.querySelectorAll<HTMLElement>('.nav-section').forEach((section) => {
      const hasVisible = Array.from(section.querySelectorAll<HTMLElement>('.nav-item')).some(
        (item) => item.style.display !== 'none'
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
    void loadDocument(docPath);
  }
});
