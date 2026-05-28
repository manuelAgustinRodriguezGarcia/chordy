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

  var deferredPrompt = null;
  var installBtn = null;
  var INSTALLED_KEY = "chordy_pwa_installed";

  function isStandaloneDisplay() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      window.navigator.standalone === true
    );
  }

  function isAppInstalledSync() {
    if (isStandaloneDisplay()) return true;
    try {
      return localStorage.getItem(INSTALLED_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function markAppInstalled() {
    try {
      localStorage.setItem(INSTALLED_KEY, "1");
    } catch (err) {}
    deferredPrompt = null;
    setInstallVisible(false);
  }

  function setInstallVisible(show) {
    if (!installBtn) return;
    installBtn.hidden = !show;
  }

  function refreshInstallButton() {
    if (isAppInstalledSync()) {
      setInstallVisible(false);
      return;
    }
    setInstallVisible(!!deferredPrompt);
  }

  function checkInstalledRelatedApps() {
    if (!navigator.getInstalledRelatedApps) {
      return Promise.resolve(false);
    }
    return navigator.getInstalledRelatedApps()
      .then(function (apps) {
        return !!(apps && apps.length);
      })
      .catch(function () {
        return false;
      });
  }

  function bindInstallButton() {
    installBtn = document.getElementById("pwa-install-btn");
    if (!installBtn) return;

    if (isAppInstalledSync()) {
      setInstallVisible(false);
      return;
    }

    checkInstalledRelatedApps().then(function (installed) {
      if (installed) {
        markAppInstalled();
      } else {
        refreshInstallButton();
      }
    });

    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice
        .then(function (choice) {
          if (choice.outcome === "accepted") {
            markAppInstalled();
          }
        })
        .finally(function () {
          deferredPrompt = null;
          refreshInstallButton();
        });
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    if (isAppInstalledSync()) return;
    event.preventDefault();
    deferredPrompt = event;
    refreshInstallButton();
  });

  window.addEventListener("appinstalled", markAppInstalled);

  var standaloneMq = window.matchMedia("(display-mode: standalone)");
  function onDisplayModeChange() {
    if (standaloneMq.matches) {
      markAppInstalled();
    }
  }
  if (standaloneMq.addEventListener) {
    standaloneMq.addEventListener("change", onDisplayModeChange);
  } else if (standaloneMq.addListener) {
    standaloneMq.addListener(onDisplayModeChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindInstallButton);
  } else {
    bindInstallButton();
  }
})();
