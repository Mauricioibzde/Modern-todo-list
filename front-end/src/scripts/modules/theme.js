/* ======================================================
   THEME INITIALIZER
====================================================== */

export function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');

  const DEFAULT_THEME = 'dark';

  const savedTheme =
    localStorage.getItem('theme') || DEFAULT_THEME;

  applyTheme(savedTheme);

  toggleBtn?.addEventListener('click', toggleTheme);

  /* ======================================================
     ACTIONS
  ====================================================== */

  function toggleTheme() {
    const current =
      document.documentElement.getAttribute('data-theme');

    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateIcons(theme);
  }

  function updateIcons(theme) {
    const isLight = theme === 'light';

    if (iconSun) iconSun.style.display = isLight ? 'none' : 'block';
    if (iconMoon) iconMoon.style.display = isLight ? 'block' : 'none';
  }
}
