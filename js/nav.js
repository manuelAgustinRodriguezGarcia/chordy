function initNav() {
  var page = document.body.getAttribute("data-page");
  if (!page) {
    return;
  }
  var links = document.querySelectorAll(".bottom-nav__link");
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (link.getAttribute("data-nav") === page) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNav);
} else {
  initNav();
}
