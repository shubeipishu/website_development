import '@/styles/main.css';
import { loadChangelog } from './changelog';
import { initFAQ, loadFAQData } from './faq';
import { initTheme } from '@/shared/theme';
import { getLang, initI18n, onLangChange, t } from '@/shared/i18n';
import { initMobileNav } from '@/shared/nav';

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

    submitBtn.disabled = true;
    submitBtn.textContent = t('feedback.submitting');

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
        showFormMessage(messageEl, t('feedback.success'), 'success');
        form.reset();
      } else {
        throw new Error('提交失败');
      }
    } catch (error) {
      showFormMessage(messageEl, t('feedback.error'), 'error');
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
  } catch {
    // 静默失败
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
  } catch {
    // 静默失败
  }
}

/* ============================================================
   延迟加载视觉效果模块
   ============================================================ */
let effectsLoaded = false;
let effectsLoading = false;
let effectsModule: typeof import('./effects') | null = null;
function loadEffectsLazy() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas || effectsLoaded || effectsLoading) return;

  const load = async () => {
    if (effectsLoaded || effectsLoading) return;
    effectsLoading = true;
    try {
      const module = await import('./effects');
      effectsModule = module;
      module.initEffects(getLang());
      effectsLoaded = true;
    } catch (error) {
      console.warn('Failed to load effects module:', error);
      effectsLoading = false;
    }
  };

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => void;
  };

  if (win.requestIdleCallback) {
    win.requestIdleCallback(load, { timeout: 1500 });
    setTimeout(load, 2000);
  } else {
    setTimeout(load, 600);
  }

  window.addEventListener('load', load, { once: true });
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

const init = () => {
  initI18n();
  initTheme();
  initFAQ();
  initMobileNav();
  initFeedbackForm();
  loadChangelog(getLang());
  loadFAQData(getLang());
  trackVisit();
  loadVisitCount();
  loadEffectsLazy();
  initAnchorScroll();

  onLangChange((lang) => {
    loadChangelog(lang);
    loadFAQData(lang);
    if (effectsModule?.updateTypewriterLanguage) {
      effectsModule.updateTypewriterLanguage(lang);
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
