export type Lang = 'zh' | 'en';

const STORAGE_KEY = 'home-lang';

const DICT: Record<Lang, Record<string, string>> = {
  zh: {
    'nav.projects': '项目',
    'nav.docs': '文档',
    'nav.faq': 'FAQ',
    'nav.feedback': '反馈',
    'nav.brand': '树皮斑马',
    'nav.lang.aria': '切换语言',
    'nav.menu': '菜单',
    'nav.menu.aria': '切换导航菜单',

    'hero.greeting': '你好，我是',
    'hero.subtitle':
      '欢迎来到我的个人主页。我是一名技术爱好者，热衷于探索 Web 开发和数学可视化。这里展示了我的项目和技术文档。',
    'hero.cta.projects': '浏览项目',
    'hero.cta.docs': '查看文档',

    'section.changelog': '最近更新',
    'section.projects': '我的项目',
    'section.faq': '常见问题',
    'section.feedback': '反馈与建议',

    'project.graph.title': '图论科研平台 Pro',
    'project.graph.desc':
      '基于 Web 的高性能图论可视化与计算工具。内置多种经典图生成器、力导向布局与交互式编辑，并提供图指标计算与高亮展示。',
    'project.graph.cta': '立即体验',

    'project.placeholder.title': '待开发项目',
    'project.placeholder.desc':
      '这是我的下一个创意位置。无论是博客系统还是个人工具，未来将在这里展示。',
    'project.placeholder.tag': '即将到来',
    'project.placeholder.cta': '敬请期待',

    'feedback.title': '反馈与建议',
    'feedback.email.label': '邮箱（可选）',
    'feedback.email.placeholder': 'your@email.com',
    'feedback.message.label': '您的反馈 *',
    'feedback.message.placeholder': '请描述您的问题或建议...',
    'feedback.submit': '提交反馈',
    'feedback.submitting': '提交中...',
    'feedback.success': '感谢您的反馈！我们会尽快回复。',
    'feedback.error': '提交失败，请稍后重试。',

    'footer.docs': '文档中心',
    'footer.contact': '联系我',
    'footer.rights': '© 2026 树皮斑马. 保留所有权利。',
    'footer.visits': '本站访问量:',

    'docs.page.title': '文档中心 - 树皮斑马',
    'docs.meta.desc': '文档中心 - 项目使用指南与技术文档',
    'docs.title': '文档中心',
    'docs.search.placeholder': '搜索文档...',
    'docs.header.placeholder': '选择一篇文档',
    'docs.empty.title': '欢迎来到文档中心',
    'docs.empty.desc': '请从左侧导航选择一篇文档开始阅读',
    'docs.loading': '加载文档中...',
    'docs.nav.downloads': '下载',
    'docs.error.config.sidebar': '文档配置加载失败',
    'docs.error.config.title': '配置文件加载失败',
    'docs.error.config.desc': '请检查 docs/config.json 是否存在',
    'docs.error.notfound.title': '文档未找到',
    'docs.error.notfound.desc': '无法加载 {file}',

    'lang.toggle': 'EN',
  },
  en: {
    'nav.projects': 'Projects',
    'nav.docs': 'Docs',
    'nav.faq': 'FAQ',
    'nav.feedback': 'Feedback',
    'nav.brand': 'BarkZebra',
    'nav.lang.aria': 'Switch language',
    'nav.menu': 'Menu',
    'nav.menu.aria': 'Toggle navigation menu',

    'hero.greeting': "Hi, I'm",
    'hero.subtitle':
      "Welcome to my personal site. I'm a tech enthusiast focused on web development and mathematical visualization. Here you'll find my projects and documentation.",
    'hero.cta.projects': 'View Projects',
    'hero.cta.docs': 'Read Docs',

    'section.changelog': 'Recent Updates',
    'section.projects': 'My Projects',
    'section.faq': 'FAQ',
    'section.feedback': 'Feedback',

    'project.graph.title': 'Graph Platform Pro',
    'project.graph.desc':
      'A high-performance web-based graph visualization and computation tool. Includes classic graph generators, force-directed layout, interactive editing, and metric highlights.',
    'project.graph.cta': 'Try it now',

    'project.placeholder.title': 'Upcoming Project',
    'project.placeholder.desc':
      'This spot is reserved for my next idea. Whether it is a blog system or a personal tool, it will appear here.',
    'project.placeholder.tag': 'Coming Soon',
    'project.placeholder.cta': 'Coming soon',

    'feedback.title': 'Feedback',
    'feedback.email.label': 'Email (optional)',
    'feedback.email.placeholder': 'you@example.com',
    'feedback.message.label': 'Your feedback *',
    'feedback.message.placeholder': 'Describe your issue or suggestion...',
    'feedback.submit': 'Submit',
    'feedback.submitting': 'Submitting...',
    'feedback.success': "Thanks for your feedback! We'll get back to you soon.",
    'feedback.error': 'Submission failed. Please try again.',

    'footer.docs': 'Docs',
    'footer.contact': 'Contact',
    'footer.rights': '© 2026 BarkZebra. All Rights Reserved.',
    'footer.visits': 'Visits:',

    'docs.page.title': 'Docs Center - BarkZebra',
    'docs.meta.desc': 'Documentation center - guides and technical docs',
    'docs.title': 'Docs Center',
    'docs.search.placeholder': 'Search docs...',
    'docs.header.placeholder': 'Select a document',
    'docs.empty.title': 'Welcome to the documentation',
    'docs.empty.desc': 'Choose a document from the left navigation to start reading',
    'docs.loading': 'Loading document...',
    'docs.nav.downloads': 'Downloads',
    'docs.error.config.sidebar': 'Failed to load docs config',
    'docs.error.config.title': 'Failed to load config',
    'docs.error.config.desc': 'Please check that docs/config.json exists',
    'docs.error.notfound.title': 'Document not found',
    'docs.error.notfound.desc': 'Unable to load {file}',

    'lang.toggle': '中',
  },
};

let currentLang: Lang = detectLang();
const listeners: Array<(lang: Lang) => void> = [];

function detectLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'zh' || stored === 'en') {
    return stored;
  }

  const browserLang =
    (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  return browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  if (lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  applyI18n();
  listeners.forEach((cb) => cb(lang));
}

export function onLangChange(cb: (lang: Lang) => void): void {
  listeners.push(cb);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const value = DICT[currentLang][key] || DICT.zh[key] || key;
  if (!vars) return value;
  return Object.keys(vars).reduce(
    (acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k])),
    value
  );
}

export function applyI18n(root: Document | HTMLElement = document): void {
  const doc = root instanceof Document ? root : root.ownerDocument || document;
  doc.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    el.textContent = t(key);
  });

  root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (!key) return;
    el.innerHTML = t(key);
  });

  root.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    const spec = el.dataset.i18nAttr;
    if (!spec) return;
    spec.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((p) => p.trim());
      if (!attr || !key) return;
      el.setAttribute(attr, t(key));
    });
  });

  updateLangToggle();
}

export function initI18n(): void {
  applyI18n();

  const btn = document.getElementById('lang-toggle');
  if (btn && !btn.dataset.bound) {
    btn.addEventListener('click', () => {
      setLang(currentLang === 'zh' ? 'en' : 'zh');
    });
    btn.dataset.bound = '1';
  }
}

function updateLangToggle(): void {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.textContent = t('lang.toggle');
  btn.setAttribute('aria-label', t('nav.lang.aria'));
}
