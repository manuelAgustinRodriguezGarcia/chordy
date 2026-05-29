window.chordyCloseFabMenu = function () {};

function initFab() {
  let fab = document.getElementById("fab-main");
  let panel = document.getElementById("fab-panel");
  let backdrop = document.getElementById("fab-backdrop");
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
    let next = !fab.classList.contains("is-open");
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
  let page = document.body.getAttribute("data-page");
  if (page === "songs") return;
  let btns = document.querySelectorAll(".js-fab-open-song-modal");
  for (let i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function () {
      sessionStorage.setItem("chordyOpenSongModal", "1");
      window.location.href = "songs.html";
    });
  }
}

chordyOnReady(function () {
  initFab();
  initSongFabNav();
});
