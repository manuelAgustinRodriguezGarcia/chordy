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
  if (index < 0 || index > 5) {
    return;
  }
  if (
    value !== "none" &&
    value !== "air" &&
    (typeof value !== "number" || value < 1 || value > CHORD_DIAGRAM_MAX_ABSOLUTE_FRET)
  ) {
    return;
  }
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
  if (!chordModalPreview) {
    return;
  }
  var keepNameFocus =
    chordModalNameInput && document.activeElement === chordModalNameInput;
  var selA = keepNameFocus ? chordModalNameInput.selectionStart : null;
  var selB = keepNameFocus ? chordModalNameInput.selectionEnd : null;
  renderChordDiagram(chordModalPreview, {
    nameTitleSlot: chordModalNameInput,
    strings: chordModalStrings.slice(),
    startFret: chordModalStartFret,
    fretNav: true
  });
  chordModalBuildInlineModes();
  chordModalSyncModes();
  chordModalBuildPreviewTargets();
  if (keepNameFocus && chordModalNameInput) {
    chordModalNameInput.focus();
    if (
      typeof selA === "number" &&
      typeof selB === "number" &&
      !isNaN(selA) &&
      !isNaN(selB)
    ) {
      try {
        chordModalNameInput.setSelectionRange(selA, selB);
      } catch (err) {}
    }
  }
}

function chordModalSave() {
  var name = chordModalNameInput ? chordModalNameInput.value.trim() : "";
  if (!name) {
    return;
  }
  var payload = { name: name, strings: chordModalStrings.slice() };
  if (chordModalEditIndex !== null && typeof updateChordAt === "function") {
    updateChordAt(chordModalEditIndex, payload);
  } else {
    addChord(payload);
  }
  chordModalClose();
  if (typeof window.refreshChordList === "function") {
    window.refreshChordList();
  }
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

function chordModalOpen() {
  if (typeof chordyCloseFabMenu === "function") {
    chordyCloseFabMenu();
  }
  if (!chordModalBuilt) {
    return;
  }
  chordModalEditIndex = null;
  if (chordModalTitleEl) {
    chordModalTitleEl.textContent = "Agregar nuevo acorde";
  }
  chordModalResetStrings();
  chordModalStartFret = 1;
  if (chordModalNameInput) {
    chordModalNameInput.value = "";
    chordModalNameInput.focus();
  }
  chordModalUpdatePreview();
  chordModalBackdrop.classList.add("is-open");
  chordModalBackdrop.setAttribute("aria-hidden", "false");
  chordModalDialog.classList.add("is-open");
  chordModalDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("chord-modal-open");
  chordModalEscapeHandler = chordModalEscapeKey;
  document.addEventListener("keydown", chordModalEscapeHandler, true);
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
    (sessionStorage.getItem("chordyOpenChordModal") ||
      sessionStorage.getItem("acordyOpenChordModal"))
  ) {
    sessionStorage.removeItem("chordyOpenChordModal");
    sessionStorage.removeItem("acordyOpenChordModal");
    chordModalOpen();
  }
}

function chordModalOpenForEdit(storageIndex, chord) {
  if (typeof chordyCloseFabMenu === "function") {
    chordyCloseFabMenu();
  }
  if (!chordModalBuilt || !chord || !chord.strings || chord.strings.length !== 6) {
    return;
  }
  chordModalEditIndex = storageIndex;
  if (chordModalTitleEl) {
    chordModalTitleEl.textContent = "Editar acorde";
  }
  for (var i = 0; i < 6; i++) {
    chordModalStrings[i] =
      typeof normalizeStringValue === "function"
        ? normalizeStringValue(chord.strings[i])
        : chord.strings[i];
  }
  chordModalStartFret =
    typeof computeChordDisplayStartFret === "function"
      ? computeChordDisplayStartFret(chord.strings)
      : 1;
  if (chordModalStartFret < 1) {
    chordModalStartFret = 1;
  }
  if (
    typeof CHORD_DIAGRAM_MAX_START_FRET !== "undefined" &&
    chordModalStartFret > CHORD_DIAGRAM_MAX_START_FRET
  ) {
    chordModalStartFret = CHORD_DIAGRAM_MAX_START_FRET;
  }
  if (chordModalNameInput) {
    chordModalNameInput.value = chord.name || "";
    chordModalNameInput.focus();
  }
  chordModalUpdatePreview();
  chordModalBackdrop.classList.add("is-open");
  chordModalBackdrop.setAttribute("aria-hidden", "false");
  chordModalDialog.classList.add("is-open");
  chordModalDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("chord-modal-open");
  chordModalEscapeHandler = chordModalEscapeKey;
  document.addEventListener("keydown", chordModalEscapeHandler, true);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChordModal);
} else {
  initChordModal();
}
