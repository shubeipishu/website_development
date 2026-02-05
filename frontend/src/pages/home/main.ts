import '@/styles/main.css';

const init = () => {
  initTheme();
  initFAQ();
  initFeedbackForm();
  loadChangelog();
  loadFAQData();
  trackVisit();
  loadVisitCount();
  loadEffectsLazy();
  initAnchorScroll();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ============================================================
   主题切换
   ============================================================ */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement | null;
  const TRANSITION_MS = 300;
  const STORAGE_KEY = 'site-theme';

  // 从 localStorage 读取，如果没有则默认 light
  const savedTheme = localStorage.getItem(STORAGE_KEY) || 'light';

  const applyTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
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

function updateThemeIcon(theme: string) {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/* ============================================================
   FAQ 折叠面板
   ============================================================ */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest<HTMLElement>('.faq-item');
      if (!item) return;

      const isActive = item.classList.contains('active');

      // 关闭其他打开的项
      document.querySelectorAll('.faq-item.active').forEach((activeItem) => {
        activeItem.classList.remove('active');
      });

      // 切换当前项
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ============================================================
   加载 FAQ 数据
   ============================================================ */
async function loadFAQData() {
  const faqList = document.getElementById('faq-list');
  if (!faqList) return;

  try {
    const response = await fetch('/data/faq.json');
    if (!response.ok) return;

    const faqData = await response.json();
    renderFAQ(faqData);
  } catch (error) {
    console.log('FAQ data not available, using static content');
  }
}

function renderFAQ(faqData: Array<{ question: string; answer: string }>) {
  const faqList = document.getElementById('faq-list');
  if (!faqList || !faqData.length) return;

  faqList.innerHTML = faqData
    .map(
      (item) => `
        <div class="faq-item">
            <button class="faq-question">
                <span>${item.question}</span>
                <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
                <div class="faq-answer-inner">${item.answer}</div>
            </div>
        </div>
    `
    )
    .join('');

  // 重新绑定事件
  initFAQ();
}

/* ============================================================
   加载更新日志
   ============================================================ */
async function loadChangelog() {
  const changelogList = document.getElementById('changelog-list');
  if (!changelogList) return;

  try {
    const response = await fetch('/data/changelog.json');
    if (!response.ok) return;

    const changelog = await response.json();
    renderChangelog(changelog);
  } catch (error) {
    console.log('Changelog data not available, using static content');
  }
}

function renderChangelog(
  changelog: Array<{ date: string; title: string; description?: string }>
) {
  const changelogList = document.getElementById('changelog-list');
  if (!changelogList || !changelog.length) return;

  changelogList.innerHTML = changelog
    .slice(0, 5)
    .map(
      (item) => `
        <div class="changelog-item">
            <span class="changelog-date">${item.date}</span>
            <div class="changelog-content">
                <div class="changelog-title">${item.title}</div>
                <div class="changelog-desc">${item.description || ''}</div>
            </div>
        </div>
    `
    )
    .join('');
}

/* ============================================================
   反馈表单
   ============================================================ */
function initFeedbackForm() {
  const form = document.getElementById('feedback-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submitBtn) return;

    const messageEl = document.getElementById('form-message');
    const originalText = submitBtn.textContent ?? '';

    // 禁用按钮，显示加载状态
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';

    try {
      const formData = new FormData(form);
      const data = {
        email: formData.get('email'),
        message: formData.get('message'),
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showFormMessage(messageEl, '感谢您的反馈！我们会尽快回复。', 'success');
        form.reset();
      } else {
        throw new Error('提交失败');
      }
    } catch (error) {
      showFormMessage(messageEl, '提交失败，请稍后重试。', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function showFormMessage(element: HTMLElement | null, message: string, type: string) {
  if (!element) return;

  element.textContent = message;
  element.className = `form-message ${type}`;

  // 5秒后隐藏
  setTimeout(() => {
    element.className = 'form-message';
  }, 5000);
}

/* ============================================================
   访问统计
   ============================================================ */
async function trackVisit() {
  try {
    await fetch('/api/stats/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: window.location.pathname,
        referrer: document.referrer || null,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // 静默失败，不影响用户体验
  }
}

/* ============================================================
   访问量显示
   ============================================================ */
async function loadVisitCount() {
  const el = document.getElementById('visit-count');
  if (!el) return;

  try {
    const response = await fetch('/api/stats/count');
    if (!response.ok) return;
    const data = await response.json();
    if (typeof data.count === 'number') {
      el.textContent = data.count.toLocaleString('zh-CN');
    }
  } catch (error) {
    // 静默失败
  }
}

/* ============================================================
   延迟加载视觉效果脚本
   ============================================================ */
function loadEffectsLazy() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const load = () => {
    if (document.getElementById('effects-script')) return;
    const script = document.createElement('script');
    script.id = 'effects-script';
    script.src = 'js/effects.js';
    script.defer = true;
    document.body.appendChild(script);
  };

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => void;
  };

  if (win.requestIdleCallback) {
    win.requestIdleCallback(load, { timeout: 1500 });
  } else {
    setTimeout(load, 600);
  }
}

/* ============================================================
   平滑滚动到锚点
   ============================================================ */
function initAnchorScroll() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href') || '');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
