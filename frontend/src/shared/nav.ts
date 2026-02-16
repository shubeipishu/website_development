/**
 * Mobile navigation toggle for pages that contain:
 * - #menu-toggle button
 * - .nav-links list
 */
export function initMobileNav(): void {
  const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement | null;
  const navLinks = document.querySelector('.nav-links') as HTMLElement | null;

  if (!menuToggle || !navLinks) return;

  const setExpanded = (expanded: boolean) => {
    menuToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    navLinks.classList.toggle('open', expanded);
  };

  setExpanded(false);

  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    setExpanded(!expanded);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setExpanded(false));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) setExpanded(false);
  });
}

