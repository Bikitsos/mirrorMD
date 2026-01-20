// Theme Toggle Functionality
(function() {
  const THEME_KEY = 'mirrormd-theme';
  const DARK_CLASS = 'solarized-dark';
  const LIGHT_CLASS = 'solarized-light';

  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle?.querySelector('.theme-icon');
  const themeText = themeToggle?.querySelector('.theme-text');

  // Get saved theme or default to dark
  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || DARK_CLASS;
  }

  // Save theme preference
  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  // Check if current theme is dark
  function isDarkTheme() {
    return body.classList.contains(DARK_CLASS);
  }

  // Update toggle button appearance
  function updateToggleButton() {
    if (isDarkTheme()) {
      if (themeIcon) themeIcon.textContent = '☀️';
      if (themeText) themeText.textContent = 'Light';
    } else {
      if (themeIcon) themeIcon.textContent = '🌙';
      if (themeText) themeText.textContent = 'Dark';
    }
  }

  // Apply theme
  function applyTheme(theme) {
    body.classList.remove(DARK_CLASS, LIGHT_CLASS);
    body.classList.add(theme);
    saveTheme(theme);
    updateToggleButton();
  }

  // Toggle between themes
  function toggleTheme() {
    const newTheme = isDarkTheme() ? LIGHT_CLASS : DARK_CLASS;
    applyTheme(newTheme);
  }

  // Initialize theme on page load
  function initTheme() {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
  }

  // Event Listeners
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Initialize
  initTheme();

  // Expose toggle function globally (for debugging)
  window.toggleTheme = toggleTheme;
})();
