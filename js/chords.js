var CHORD_DIAGRAM_MAX_START_FRET = 19;
var CHORD_DIAGRAM_MAX_ABSOLUTE_FRET = CHORD_DIAGRAM_MAX_START_FRET + 4;

function normalizeStringValue(value) {
  if (value === "none" || value === "air") return value;
  var n = parseInt(value, 10);
  if (isNaN(n)) return "air";
  if (n >= 1 && n <= CHORD_DIAGRAM_MAX_ABSOLUTE_FRET) return n;
  return "air";
}

function computeChordDisplayStartFret(strings) {
  var nums = [];
  for (var i = 0; i < strings.length; i++) {
    var v = strings[i];
    if (typeof v === "number" && v >= 1 && v <= CHORD_DIAGRAM_MAX_ABSOLUTE_FRET) {
      nums.push(v);
    }
  }
  if (nums.length === 0) return 1;
  var hi = Math.max.apply(null, nums);
  if (hi <= 5) return 1;
  return Math.max(1, Math.min(CHORD_DIAGRAM_MAX_START_FRET, hi - 4));
}

function stringCenterLeftPercent(index) {
  return ((index + 0.5) / 6) * 100 + "%";
}

function fretLineTopPercent(fretIndex) {
  return (fretIndex / 5) * 100 + "%";
}

function dotCenterTopPercent(fretNumber) {
  return ((fretNumber - 0.5) / 5) * 100 + "%";
}

function chordDiagramChevronSvg(direction) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.25");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", direction === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6");
  svg.appendChild(path);
  return svg;
}

function buildDiagramGutter(startFret, hasFretNav) {
  var gutter = document.createElement("div");
  gutter.className = "chord-diagram__gutter";

  var gutterTop = document.createElement("div");
  gutterTop.className = "chord-diagram__gutter-top";
  gutterTop.setAttribute("aria-hidden", "true");
  if (startFret > 1) gutterTop.classList.add("chord-diagram__gutter-top--no-nut");
  gutter.appendChild(gutterTop);

  if (hasFretNav && startFret > 1) {
    var navUp = document.createElement("button");
    navUp.type = "button";
    navUp.className = "chord-diagram__gutter-nav chord-diagram__gutter-nav--up";
    navUp.setAttribute("data-fret-nav", "up");
    navUp.setAttribute("aria-label", "Ver trastes más graves");
    navUp.appendChild(chordDiagramChevronSvg("up"));
    gutter.appendChild(navUp);
  }

  var gutterMid = document.createElement("div");
  gutterMid.className = "chord-diagram__gutter-mid";
  for (var f = 0; f < 5; f++) {
    var label = document.createElement("div");
    label.className = "chord-diagram__gutter-label";
    label.textContent = String(startFret + f);
    gutterMid.appendChild(label);
  }
  gutter.appendChild(gutterMid);

  if (hasFretNav) {
    var navDown = document.createElement("button");
    navDown.type = "button";
    navDown.className = "chord-diagram__gutter-nav chord-diagram__gutter-nav--down";
    navDown.setAttribute("data-fret-nav", "down");
    navDown.setAttribute("aria-label", "Ver trastes más agudos");
    if (startFret >= CHORD_DIAGRAM_MAX_START_FRET) navDown.disabled = true;
    navDown.appendChild(chordDiagramChevronSvg("down"));
    gutter.appendChild(navDown);
  }

  var gutterBottom = document.createElement("div");
  gutterBottom.className = "chord-diagram__gutter-bottom";
  gutterBottom.setAttribute("aria-hidden", "true");
  gutter.appendChild(gutterBottom);

  return gutter;
}

function buildDotsAndBarres(strings, startFret) {
  var layer = document.createElement("div");
  layer.className = "chord-diagram__dots-layer";

  var fretGroups = {};
  for (var s = 0; s < 6; s++) {
    if (typeof strings[s] !== "number") continue;
    var row = strings[s] - startFret + 1;
    if (row >= 1 && row <= 5) {
      if (!fretGroups[row]) fretGroups[row] = [];
      fretGroups[row].push(s);
    }
  }

  var barredPositions = {};

  for (var r in fretGroups) {
    var group = fretGroups[r];
    var span = group[group.length - 1] - group[0];
    if (group.length >= 2 && span >= 3) {
      var bar = document.createElement("span");
      bar.className = "chord-diagram__bar";
      bar.style.top = dotCenterTopPercent(parseInt(r, 10));
      bar.style.left = "calc(" + stringCenterLeftPercent(group[0]) + " - 0.46rem)";
      bar.style.width = "calc(" + (span / 6 * 100) + "% + 0.92rem)";
      layer.appendChild(bar);
      for (var b = 0; b < group.length; b++) {
        barredPositions[group[b] + "," + r] = true;
      }
    }
  }

  for (var d = 0; d < 6; d++) {
    if (typeof strings[d] !== "number") continue;
    var dotRow = strings[d] - startFret + 1;
    if (dotRow < 1 || dotRow > 5) continue;
    if (barredPositions[d + "," + dotRow]) continue;
    var dot = document.createElement("span");
    dot.className = "chord-diagram__dot";
    dot.style.left = stringCenterLeftPercent(d);
    dot.style.top = dotCenterTopPercent(dotRow);
    layer.appendChild(dot);
  }

  return layer;
}

function buildMutesRow(strings) {
  var mutes = document.createElement("div");
  mutes.className = "chord-diagram__mutes";
  for (var i = 0; i < 6; i++) {
    var cell = document.createElement("div");
    cell.className = "chord-diagram__mute";
    if (strings[i] === "none") {
      cell.textContent = "X";
      cell.classList.add("is-muted");
    }
    mutes.appendChild(cell);
  }
  return mutes;
}

function renderChordDiagram(container, chord) {
  if (!container || !chord || !chord.strings || chord.strings.length !== 6) return;
  if (!chord.nameTitleSlot && !chord.name) return;

  if (chord.nameTitleSlot && chord.nameTitleSlot.parentNode) {
    chord.nameTitleSlot.parentNode.removeChild(chord.nameTitleSlot);
  }
  container.innerHTML = "";

  var strings = [];
  for (var i = 0; i < 6; i++) {
    strings.push(normalizeStringValue(chord.strings[i]));
  }

  var startFret = typeof chord.startFret === "number"
    ? chord.startFret
    : computeChordDisplayStartFret(chord.strings);
  startFret = Math.max(1, Math.min(CHORD_DIAGRAM_MAX_START_FRET, startFret));

  var root = document.createElement("div");
  root.className = "chord-diagram";

  if (chord.nameTitleSlot) {
    chord.nameTitleSlot.classList.add("chord-diagram__name-field");
    root.appendChild(chord.nameTitleSlot);
  } else {
    var title = document.createElement("div");
    title.className = "chord-diagram__title";
    title.textContent = chord.name;
    root.appendChild(title);
  }

  var board = document.createElement("div");
  board.className = "chord-diagram__board";

  board.appendChild(buildDiagramGutter(startFret, chord.fretNav));

  var fretArea = document.createElement("div");
  fretArea.className = "chord-diagram__fret-area";

  var nut = document.createElement("div");
  nut.className = "chord-diagram__nut";
  nut.setAttribute("aria-hidden", "true");
  if (startFret > 1) nut.classList.add("chord-diagram__nut--hidden");
  fretArea.appendChild(nut);

  if (chord.fretNav && startFret > 1) {
    var spacerUp = document.createElement("div");
    spacerUp.className = "chord-diagram__fret-nav-spacer chord-diagram__fret-nav-spacer--up";
    spacerUp.setAttribute("aria-hidden", "true");
    fretArea.appendChild(spacerUp);
  }

  var canvas = document.createElement("div");
  canvas.className = "chord-diagram__canvas";

  for (var vs = 0; vs < 6; vs++) {
    var vLine = document.createElement("div");
    vLine.className = "chord-diagram__v-line";
    vLine.setAttribute("aria-hidden", "true");
    vLine.style.left = stringCenterLeftPercent(vs);
    canvas.appendChild(vLine);
  }

  for (var hf = 1; hf <= 5; hf++) {
    var hLine = document.createElement("div");
    hLine.className = "chord-diagram__h-line";
    hLine.setAttribute("aria-hidden", "true");
    hLine.style.top = fretLineTopPercent(hf);
    canvas.appendChild(hLine);
  }

  canvas.appendChild(buildDotsAndBarres(strings, startFret));
  fretArea.appendChild(canvas);

  if (chord.fretNav) {
    var spacerDown = document.createElement("div");
    spacerDown.className = "chord-diagram__fret-nav-spacer chord-diagram__fret-nav-spacer--down";
    spacerDown.setAttribute("aria-hidden", "true");
    fretArea.appendChild(spacerDown);
  }

  fretArea.appendChild(buildMutesRow(strings));
  board.appendChild(fretArea);
  root.appendChild(board);
  container.appendChild(root);
}


var chordModalBackdrop = null;
var chordModalDialog = null;
var chordModalNameInput = null;
var chordModalPreview = null;
var chordModalEscapeHandler = null;
var chordModalBuilt = false;
var chordModalStrings = ["air", "air", "air", "air", "air", "air"];
var chordModalStartFret = 1;
var chordModalEditIndex = null;
var chordModalTitleEl = null;

function chordModalStringLeftPercent(index) {
  return ((index + 0.5) / 6) * 100 + "%";
}

function chordModalDotTopPercent(slotFromOneToFive) {
  return ((slotFromOneToFive - 0.5) / 5) * 100 + "%";
}

function chordModalBuildPreviewTargets() {
  if (!chordModalPreview) {
    return;
  }
  var canvas = chordModalPreview.querySelector(".chord-diagram__canvas");
  if (!canvas) {
    return;
  }
  var existing = canvas.querySelector(".chord-modal__canvas-picks");
  if (existing) {
    existing.remove();
  }
  var layer = document.createElement("div");
  layer.className = "chord-modal__canvas-picks";
  for (var s = 0; s < 6; s++) {
    for (var slot = 1; slot <= 5; slot++) {
      var absFret = chordModalStartFret + slot - 1;
      var pick = document.createElement("button");
      pick.type = "button";
      pick.className = "chord-modal__pick";
      if (chordModalStrings[s] === absFret) {
        pick.classList.add("is-active");
      }
      pick.setAttribute("data-string", String(s));
      pick.setAttribute("data-fret", String(absFret));
      pick.style.left = chordModalStringLeftPercent(s);
      pick.style.top = chordModalDotTopPercent(slot);
      layer.appendChild(pick);
    }
  }
  layer.addEventListener("click", function (event) {
    var target = event.target;
    if (target.nodeName !== "BUTTON") {
      return;
    }
    var s = parseInt(target.getAttribute("data-string"), 10);
    var f = parseInt(target.getAttribute("data-fret"), 10);
    if (isNaN(s) || isNaN(f)) {
      return;
    }
    if (chordModalStrings[s] === f) {
      chordModalSetString(s, "none");
      return;
    }
    chordModalSetString(s, f);
  });
  canvas.appendChild(layer);
}

function chordModalSyncModes() {
  if (!chordModalPreview) {
    return;
  }
  var buttons = chordModalPreview.querySelectorAll(".chord-modal__mode-btn");
  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    var s = parseInt(btn.getAttribute("data-string"), 10);
    if (isNaN(s)) {
      continue;
    }
    var isNone = chordModalStrings[s] === "none";
    btn.classList.toggle("is-active", isNone);
    btn.textContent = isNone ? "X" : "O";
  }
}

function chordModalBuildInlineModes() {
  if (!chordModalPreview) {
    return;
  }
  var fretArea = chordModalPreview.querySelector(".chord-diagram__fret-area");
  if (!fretArea) {
    return;
  }
  var existing = fretArea.querySelector(".chord-modal__inline-modes");
  if (existing) {
    existing.remove();
  }
  var row = document.createElement("div");
  row.className = "chord-modal__inline-modes";
  for (var s = 0; s < 6; s++) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chord-modal__mode-btn";
    btn.setAttribute("data-string", String(s));
    btn.textContent = "O";
    row.appendChild(btn);
  }
  row.addEventListener("click", function (event) {
    var target = event.target;
    if (target.nodeName !== "BUTTON") {
      return;
    }
    var s = parseInt(target.getAttribute("data-string"), 10);
    if (isNaN(s)) {
      return;
    }
    if (chordModalStrings[s] === "none") {
      chordModalSetString(s, "air");
      return;
    }
    chordModalSetString(s, "none");
  });
  fretArea.appendChild(row);
}

function chordModalSetString(index, value) {
  if (index < 0 || index > 5) return;
  chordModalStrings[index] = value;
  chordModalUpdatePreview();
}

function chordModalResetStrings() {
  for (var i = 0; i < 6; i++) {
    chordModalStrings[i] = "air";
  }
}

function chordModalClose() {
  if (!chordModalBackdrop || !chordModalDialog) {
    return;
  }
  chordModalEditIndex = null;
  if (chordModalTitleEl) {
    chordModalTitleEl.textContent = "Agregar nuevo acorde";
  }
  chordModalBackdrop.classList.remove("is-open");
  chordModalBackdrop.setAttribute("aria-hidden", "true");
  chordModalDialog.classList.remove("is-open");
  chordModalDialog.setAttribute("aria-hidden", "true");
  document.body.classList.remove("chord-modal-open");
  if (chordModalEscapeHandler) {
    document.removeEventListener("keydown", chordModalEscapeHandler, true);
    chordModalEscapeHandler = null;
  }
}

function chordModalEscapeKey(event) {
  if (event.key === "Escape") {
    event.stopPropagation();
    chordModalClose();
  }
}

function chordModalUpdatePreview() {
  if (!chordModalPreview) return;
  var hasFocus = chordModalNameInput && document.activeElement === chordModalNameInput;
  var selStart = hasFocus ? chordModalNameInput.selectionStart : null;
  var selEnd = hasFocus ? chordModalNameInput.selectionEnd : null;
  renderChordDiagram(chordModalPreview, {
    nameTitleSlot: chordModalNameInput,
    strings: chordModalStrings.slice(),
    startFret: chordModalStartFret,
    fretNav: true
  });
  chordModalBuildInlineModes();
  chordModalSyncModes();
  chordModalBuildPreviewTargets();
  if (hasFocus && chordModalNameInput) {
    chordModalNameInput.focus();
    if (selStart !== null && selEnd !== null) {
      chordModalNameInput.setSelectionRange(selStart, selEnd);
    }
  }
}

function chordModalSave() {
  var name = chordModalNameInput ? chordModalNameInput.value.trim() : "";
  if (!name) {
    return;
  }
  var payload = { name: name, strings: chordModalStrings.slice() };
  if (chordModalEditIndex !== null) {
    updateChordAt(chordModalEditIndex, payload);
  } else {
    addChord(payload);
  }
  chordModalClose();
  window.refreshChordList();
  if (window.songModalRefreshPicker) {
    window.songModalRefreshPicker();
  }
}

function chordModalShow() {
  chordModalUpdatePreview();
  chordModalBackdrop.classList.add("is-open");
  chordModalBackdrop.setAttribute("aria-hidden", "false");
  chordModalDialog.classList.add("is-open");
  chordModalDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("chord-modal-open");
  chordModalEscapeHandler = chordModalEscapeKey;
  document.addEventListener("keydown", chordModalEscapeHandler, true);
  if (chordModalNameInput) chordModalNameInput.focus();
}

function chordModalOpen() {
  chordyCloseFabMenu();
  if (!chordModalBuilt) return;
  chordModalEditIndex = null;
  if (chordModalTitleEl) chordModalTitleEl.textContent = "Agregar nuevo acorde";
  chordModalResetStrings();
  chordModalStartFret = 1;
  if (chordModalNameInput) chordModalNameInput.value = "";
  chordModalShow();
}

function chordModalBuildDom() {
  chordModalBackdrop = document.createElement("div");
  chordModalBackdrop.id = "chord-modal-backdrop";
  chordModalBackdrop.className = "chord-modal-backdrop";
  chordModalBackdrop.setAttribute("aria-hidden", "true");

  chordModalDialog = document.createElement("div");
  chordModalDialog.id = "chord-modal";
  chordModalDialog.className = "chord-modal";
  chordModalDialog.setAttribute("role", "dialog");
  chordModalDialog.setAttribute("aria-modal", "true");
  chordModalDialog.setAttribute("aria-labelledby", "chord-modal-title");
  chordModalDialog.setAttribute("aria-hidden", "true");

  var title = document.createElement("h2");
  title.id = "chord-modal-title";
  title.className = "chord-modal__title";
  title.textContent = "Agregar nuevo acorde";
  chordModalTitleEl = title;
  chordModalDialog.appendChild(title);

  chordModalNameInput = document.createElement("input");
  chordModalNameInput.type = "text";
  chordModalNameInput.className = "chord-modal__input";
  chordModalNameInput.id = "modal-chord-name";
  chordModalNameInput.setAttribute("autocomplete", "off");
  chordModalNameInput.setAttribute("maxlength", "24");
  chordModalNameInput.setAttribute("placeholder", "Em");

  chordModalPreview = document.createElement("div");
  chordModalPreview.id = "modal-chord-preview";
  chordModalPreview.className = "chord-modal__preview";
  chordModalDialog.appendChild(chordModalPreview);

  var legend = document.createElement("p");
  legend.className = "chord-modal__legend";
  legend.innerHTML =
    '<span class="chord-modal__legend-mark">O</span>: "cuerda al aire", suena pero sin presionar ningún traste<br>' +
    '<span class="chord-modal__legend-mark">X</span>: "cuerda muteada", no debe ser tocada esta cuerda.';
  chordModalDialog.appendChild(legend);

  var actions = document.createElement("div");
  actions.className = "chord-modal__actions";

  var btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "chord-modal__btn chord-modal__btn--ghost";
  btnCancel.textContent = "Cancelar";
  btnCancel.addEventListener("click", chordModalClose);
  actions.appendChild(btnCancel);

  var btnSave = document.createElement("button");
  btnSave.type = "button";
  btnSave.className = "chord-modal__btn chord-modal__btn--primary";
  btnSave.textContent = "Guardar";
  btnSave.addEventListener("click", chordModalSave);
  actions.appendChild(btnSave);

  chordModalDialog.appendChild(actions);

  chordModalBackdrop.addEventListener("click", chordModalClose);

  document.body.appendChild(chordModalBackdrop);
  document.body.appendChild(chordModalDialog);

  chordModalNameInput.addEventListener("input", chordModalUpdatePreview);

  chordModalPreview.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-fret-nav]");
    if (!btn || !chordModalPreview.contains(btn)) {
      return;
    }
    if (btn.disabled) {
      return;
    }
    var dir = btn.getAttribute("data-fret-nav");
    if (dir === "up") {
      chordModalStartFret -= 1;
    } else if (dir === "down") {
      chordModalStartFret += 1;
    }
    if (chordModalStartFret < 1) {
      chordModalStartFret = 1;
    }
    if (chordModalStartFret > CHORD_DIAGRAM_MAX_START_FRET) {
      chordModalStartFret = CHORD_DIAGRAM_MAX_START_FRET;
    }
    chordModalResetStrings();
    chordModalUpdatePreview();
  });

  chordModalBuilt = true;
}

function chordModalOnFabOpenClick(event) {
  event.preventDefault();
  chordModalOpen();
}

function initChordModal() {
  chordModalBuildDom();
  var openButtons = document.querySelectorAll(".js-fab-open-chord-modal");
  for (var i = 0; i < openButtons.length; i++) {
    openButtons[i].addEventListener("click", chordModalOnFabOpenClick);
  }
  if (
    document.body.getAttribute("data-page") === "chords" &&
    sessionStorage.getItem("chordyOpenChordModal")
  ) {
    sessionStorage.removeItem("chordyOpenChordModal");
    chordModalOpen();
  }
}

chordyOnReady(initChordModal);

function chordModalOpenForEdit(storageIndex, chord) {
  chordyCloseFabMenu();
  if (!chordModalBuilt || !chord || !chord.strings || chord.strings.length !== 6) return;
  chordModalEditIndex = storageIndex;
  if (chordModalTitleEl) chordModalTitleEl.textContent = "Editar acorde";
  for (var i = 0; i < 6; i++) {
    chordModalStrings[i] = normalizeStringValue(chord.strings[i]);
  }
  chordModalStartFret = computeChordDisplayStartFret(chord.strings);
  if (chordModalStartFret < 1) chordModalStartFret = 1;
  if (chordModalStartFret > CHORD_DIAGRAM_MAX_START_FRET) {
    chordModalStartFret = CHORD_DIAGRAM_MAX_START_FRET;
  }
  if (chordModalNameInput) chordModalNameInput.value = chord.name || "";
  chordModalShow();
}

function chordSearchNormalize(s) {
  return (s || "").toLowerCase().trim();
}

function chordCompareNames(a, b) {
  var ta = String(a).toLowerCase();
  var tb = String(b).toLowerCase();
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  return 0;
}

function chordListPrepareDecorated() {
  var raw = loadChords();
  var decorated = [];
  for (var i = 0; i < raw.length; i++) {
    decorated.push({ chord: raw[i], storageIndex: i });
  }
  decorated.sort(function (a, b) {
    return chordCompareNames(a.chord.name, b.chord.name);
  });
  return decorated;
}

function chordListFilterDecorated(decorated, queryNorm) {
  if (!queryNorm) {
    return decorated;
  }
  var out = [];
  for (var i = 0; i < decorated.length; i++) {
    var item = decorated[i];
    if (chordSearchNormalize(item.chord.name).indexOf(queryNorm) !== -1) {
      out.push(item);
    }
  }
  return out;
}

var chordDeletePendingIndex = null;

function chordDeleteModalOpen(name, storageIndex) {
  chordDeletePendingIndex = storageIndex;
  var backdrop = document.getElementById("chord-delete-modal-backdrop");
  var dialog = document.getElementById("chord-delete-modal");
  var text = document.getElementById("chord-delete-modal-text");
  if (!backdrop || !dialog || !text) {
    return;
  }
  text.textContent = "¿Seguro que quieres eliminar el acorde " + name + "?";
  backdrop.classList.add("is-open");
  backdrop.setAttribute("aria-hidden", "false");
  dialog.classList.add("is-open");
  dialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("chord-delete-modal-open");
}

function chordDeleteModalClose() {
  chordDeletePendingIndex = null;
  var backdrop = document.getElementById("chord-delete-modal-backdrop");
  var dialog = document.getElementById("chord-delete-modal");
  if (!backdrop || !dialog) {
    return;
  }
  backdrop.classList.remove("is-open");
  backdrop.setAttribute("aria-hidden", "true");
  dialog.classList.remove("is-open");
  dialog.setAttribute("aria-hidden", "true");
  document.body.classList.remove("chord-delete-modal-open");
}

function chordDeleteModalConfirm() {
  if (chordDeletePendingIndex !== null) {
    deleteChordAt(chordDeletePendingIndex);
    buildChordCards();
  }
  chordDeleteModalClose();
}

function buildChordCards() {
  var root = document.getElementById("chord-list");
  if (!root) {
    return;
  }
  root.innerHTML = "";
  var searchEl = document.getElementById("chord-search");
  var q = chordSearchNormalize(searchEl ? searchEl.value : "");
  var decorated = chordListPrepareDecorated();
  var filtered = chordListFilterDecorated(decorated, q);
  for (var i = 0; i < filtered.length; i++) {
    var entry = filtered[i];
    var c = entry.chord;
    var storageIndex = entry.storageIndex;

    var article = document.createElement("article");
    article.className = "chord-card";
    article.setAttribute("data-storage-index", String(storageIndex));

    var toolbar = document.createElement("div");
    toolbar.className = "chord-card__toolbar";

    var btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "chord-card__action chord-card__action--edit";
    btnEdit.setAttribute("aria-label", "Editar " + c.name);
    btnEdit.innerHTML = chordyIcon("pencil");
    btnEdit.addEventListener("click", (function (idx, chord) {
      return function (ev) {
        ev.stopPropagation();
        chordModalOpenForEdit(idx, chord);
      };
    })(storageIndex, c));

    var btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "chord-card__action chord-card__action--delete";
    btnDel.setAttribute("aria-label", "Eliminar " + c.name);
    btnDel.innerHTML = chordyIcon("trash-2");
    btnDel.addEventListener("click", (function (idx, name) {
      return function (ev) {
        ev.stopPropagation();
        chordDeleteModalOpen(name, idx);
      };
    })(storageIndex, c.name));

    toolbar.appendChild(btnEdit);
    toolbar.appendChild(btnDel);
    article.appendChild(toolbar);

    var diagramHost = document.createElement("div");
    diagramHost.className = "chord-card__diagram";
    renderChordDiagram(diagramHost, c);

    article.appendChild(diagramHost);
    root.appendChild(article);
  }
}

window.refreshChordList = buildChordCards;

function chordSearchInit() {
  var searchEl = document.getElementById("chord-search");
  if (!searchEl) {
    return;
  }
  searchEl.addEventListener("input", function () {
    buildChordCards();
  });

  var delBackdrop = document.getElementById("chord-delete-modal-backdrop");
  var delDialog = document.getElementById("chord-delete-modal");
  var btnCancel = document.getElementById("chord-delete-cancel");
  var btnConfirm = document.getElementById("chord-delete-confirm");

  if (btnCancel) {
    btnCancel.addEventListener("click", chordDeleteModalClose);
  }
  if (btnConfirm) {
    btnConfirm.addEventListener("click", chordDeleteModalConfirm);
  }
  if (delBackdrop) {
    delBackdrop.addEventListener("click", chordDeleteModalClose);
  }
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") {
      return;
    }
    var dlg = document.getElementById("chord-delete-modal");
    if (dlg && dlg.classList.contains("is-open")) {
      chordDeleteModalClose();
    }
  });
}

function startChordsPage() {
  chordyStorageReady.then(function () {
    buildChordCards();
    chordSearchInit();
  });
}

chordyOnReady(startChordsPage);
