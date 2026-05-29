(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("./sw.js", { scope: "./" })
        .catch(function (err) {
          console.warn("[Chordy] No se pudo registrar el Service Worker:", err);
        });
    });
  }

  let deferredPrompt = null;
  let installBtn = null;

  function isInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function setInstallVisible(show) {
    if (!installBtn) return;
    installBtn.hidden = !show;
  }

  function bindInstallButton() {
    installBtn = document.getElementById("pwa-install-btn");
    if (!installBtn) return;

    if (isInstalled()) {
      setInstallVisible(false);
      return;
    }

    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        setInstallVisible(false);
      });
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    if (isInstalled()) return;
    event.preventDefault();
    deferredPrompt = event;
    setInstallVisible(true);
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    setInstallVisible(false);
  });

  chordyOnReady(bindInstallButton);
})();
