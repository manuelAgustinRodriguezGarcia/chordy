function initIcons() {
  if (typeof lucide === "undefined" || !lucide.createIcons) {
    return;
  }
  lucide.createIcons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initIcons);
} else {
  initIcons();
}
