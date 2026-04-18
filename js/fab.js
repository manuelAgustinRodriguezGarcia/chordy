window.chordyCloseFabMenu = function () {};

function initFab() {
  var fab = document.getElementById("fab-main");
  var panel = document.getElementById("fab-panel");
  var backdrop = document.getElementById("fab-backdrop");
  if (!fab || !panel || !backdrop) {
    return;
  }

  function setOpen(isOpen) {
    fab.classList.toggle("is-open", isOpen);
    fab.setAttribute("aria-expanded", isOpen ? "true" : "false");
    panel.classList.toggle("is-open", isOpen);
    backdrop.classList.toggle("is-open", isOpen);
    backdrop.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  window.chordyCloseFabMenu = function () {
    setOpen(false);
  };

  fab.addEventListener("click", function () {
    var next = !fab.classList.contains("is-open");
    setOpen(next);
  });

  backdrop.addEventListener("click", function () {
    setOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
}

function initSongFabNav() {
  var page = document.body.getAttribute("data-page");
  if (page === "songs") return;
  var btns = document.querySelectorAll(".js-fab-open-song-modal");
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function () {
      sessionStorage.setItem("chordyOpenSongModal", "1");
      window.location.href = "songs.html";
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    initFab();
    initSongFabNav();
  });
} else {
  initFab();
  initSongFabNav();
}
