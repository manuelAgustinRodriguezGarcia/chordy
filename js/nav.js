(function () {
  let STORAGE_KEY = "chordy_theme";

  function getStoredTheme() {
    try {
      let stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") {
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
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", theme === "dark" ? "#4c1d95" : "#f5f3ff");
  }

  function refreshThemeIcon(btn, theme) {
    if (!btn) return;
    let iconName = theme === "dark" ? "moon" : "sun";
    btn.innerHTML = chordyIcon(iconName, "theme-toggle__icon");
  }

  function updateToggleButton(btn, theme) {
    if (!btn) return;
    let isDark = theme === "dark";
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    refreshThemeIcon(btn, theme);
  }

  function setTheme(theme) {
    if (theme !== "light" && theme !== "dark") return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {}
    applyTheme(theme);
    updateToggleButton(document.querySelector(".theme-toggle"), theme);
  }

  function toggleTheme() {
    let current =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  function initThemeToggle() {
    let btn = document.querySelector(".theme-toggle");
    let theme = getStoredTheme();
    applyTheme(theme);
    updateToggleButton(btn, theme);
    if (!btn) return;
    btn.addEventListener("click", toggleTheme);
  }

  function updateConnectionStatus() {
    let btn = document.querySelector(".connection-status");
    if (!btn) return;
    let online = navigator.onLine;
    btn.setAttribute("aria-label", online ? "Con conexión" : "Sin conexión");
    btn.setAttribute("title", online ? "Con conexión" : "Sin conexión");
    btn.classList.toggle("is-offline", !online);
    btn.classList.toggle("is-online", online);
    let iconName = online ? "wifi" : "wifi-off";
    btn.innerHTML = chordyIcon(iconName, "theme-toggle__icon");
  }

  function initConnectionStatus() {
    updateConnectionStatus();
    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);
  }

  function initNav() {
    let page = document.body.getAttribute("data-page");
    if (!page) return;
    let links = document.querySelectorAll(".bottom-nav__link");
    for (let i = 0; i < links.length; i++) {
      let link = links[i];
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
    initConnectionStatus();
  }

  chordyOnReady(init);
})();
