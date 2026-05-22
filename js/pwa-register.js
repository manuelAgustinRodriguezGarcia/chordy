(function () {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .catch(function (err) {
        console.warn("[Chordy] No se pudo registrar el Service Worker:", err);
      });
  });
})();
