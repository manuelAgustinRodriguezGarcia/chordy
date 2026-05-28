(function () {
  var STORAGE_KEY = "chordy_theme";
  var VALID_THEMES = { light: true, dark: true };

  function getStoredTheme() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_THEMES[stored]) {
        return stored;
      }
    } catch (err) {}
    return "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    updateMetaThemeColor(theme);
  }

  function updateMetaThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", theme === "dark" ? "#4c1d95" : "#f5f3ff");
  }

  function refreshThemeIcon(btn, theme) {
    if (!btn) return;
    var iconName = theme === "dark" ? "moon" : "sun";
    btn.innerHTML =
      typeof chordyIcon === "function"
        ? chordyIcon(iconName, "theme-toggle__icon")
        : "";
  }

  function updateToggleButton(btn, theme) {
    if (!btn) return;
    var isDark = theme === "dark";
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    refreshThemeIcon(btn, theme);
  }

  function setTheme(theme) {
    if (!VALID_THEMES[theme]) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {}
    applyTheme(theme);
    updateToggleButton(document.querySelector(".theme-toggle"), theme);
  }

  function toggleTheme() {
    var current =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  function initThemeToggle() {
    var btn = document.querySelector(".theme-toggle");
    var theme = getStoredTheme();
    applyTheme(theme);
    updateToggleButton(btn, theme);
    if (!btn) return;
    btn.addEventListener("click", toggleTheme);
  }

  function initNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    var links = document.querySelectorAll(".bottom-nav__link");
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.getAttribute("data-nav") === page) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    }
  }

  function init() {
    applyTheme(getStoredTheme());
    initNav();
    initThemeToggle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
