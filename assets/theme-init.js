(() => {
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const stored = localStorage.getItem('artur-theme-v2');
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#f2f0eb');
  } catch {
    document.documentElement.dataset.theme = 'dark';
  }
})();
