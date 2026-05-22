(function () {
  var deferredPrompt = null;
  var installBtn = null;

  function isStandaloneDisplay() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function setInstallVisible(show) {
    if (!installBtn) {
      return;
    }
    installBtn.hidden = !show;
  }

  function bindInstallButton() {
    installBtn = document.getElementById("pwa-install-btn");
    if (!installBtn) {
      return;
    }

    if (isStandaloneDisplay()) {
      setInstallVisible(false);
      return;
    }

    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) {
        return;
      }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        setInstallVisible(false);
      });
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    if (!isStandaloneDisplay()) {
      setInstallVisible(true);
    }
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    setInstallVisible(false);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindInstallButton);
  } else {
    bindInstallButton();
  }
})();
