var CHORDY_BI_ICONS = {
  sun: "bi-sun",
  moon: "bi-moon",
  "list-music": "bi-music-note-list",
  "music-2": "bi-music-note-list",
  guitar: "bi-file-music",
  plus: "bi-plus-lg",
  "audio-waveform": "bi-file-music",
  "chevron-down": "bi-chevron-down",
  pencil: "bi-pencil",
  "trash-2": "bi-trash",
};

function chordyIcon(name, className) {
  var bi = CHORDY_BI_ICONS[name] || "bi-circle";
  var cls = "bi " + bi + (className ? " " + className : "");
  return '<i class="' + cls + '" aria-hidden="true"></i>';
}

window.chordyIcon = chordyIcon;
