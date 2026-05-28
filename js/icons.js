var CHORDY_BI_ICONS = {
  sun: "bi-sun",
  moon: "bi-moon",
  "list-music": "bi-music-note-list",
  guitar: "bi-file-music",
  plus: "bi-plus-lg",
  "chevron-down": "bi-chevron-down",
  pencil: "bi-pencil",
  "trash-2": "bi-trash",
  wifi: "bi-wifi",
  "wifi-off": "bi-wifi-off",
  "arrow-repeat": "bi-arrow-repeat",
};

function chordyIcon(name, className) {
  var bi = CHORDY_BI_ICONS[name] || "bi-circle";
  var cls = "bi " + bi + (className ? " " + className : "");
  return '<i class="' + cls + '" aria-hidden="true"></i>';
}

function chordyOnReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

window.chordyIcon = chordyIcon;
window.chordyOnReady = chordyOnReady;
