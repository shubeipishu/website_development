/**
 * 共享主题切换模块
 * 用于统一管理网站的明暗主题切换功能
 */

/** localStorage 存储键 */
export const THEME_KEY = 'site-theme';

/** 主题过渡动画时长 (ms) */
const TRANSITION_MS = 300;

/** 主题初始化选项 */
export interface ThemeOptions {
  /**
   * 主题变化时的回调函数
   * @param theme - 新主题值 ('light' | 'dark')
   */
  onThemeChange?: (theme: string) => void;
}

/**
 * 更新主题切换按钮的图标
 * @param theme - 当前主题
 */
export function updateThemeIcon(theme: string): void {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/**
 * 初始化主题切换功能
 * - 从 localStorage 读取已保存的主题
 * - 监听页面缓存恢复事件 (pageshow)
 * - 监听跨标签页同步事件 (storage)
 * - 绑定切换按钮点击事件
 *
 * @param options - 可选配置
 */
export function initTheme(options?: ThemeOptions): void {
  const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement | null;

  // 从 localStorage 读取，如果没有则默认 light
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';

  const applyTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
    options?.onThemeChange?.(theme);
  };

  // 应用初始主题
  applyTheme(savedTheme);

  // 处理页面缓存恢复 (bfcache)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      const theme = localStorage.getItem(THEME_KEY) || 'light';
      applyTheme(theme);
    }
  });

  // 跨标签页同步主题
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY) {
      const theme = e.newValue || 'light';
      applyTheme(theme);
    }
  });

  // 绑定切换按钮
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // 添加过渡动画类
      document.documentElement.classList.add('theme-transition');
      document.documentElement.setAttribute('data-theme', newTheme);
      updateThemeIcon(newTheme);
      options?.onThemeChange?.(newTheme);

      // 保存到 localStorage
      localStorage.setItem(THEME_KEY, newTheme);

      // 移除过渡类
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, TRANSITION_MS);
    });
  }
}
