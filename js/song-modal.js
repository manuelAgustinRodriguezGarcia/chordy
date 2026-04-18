var songModalBackdrop = null;
var songModalEl = null;
var songModalStep1 = null;
var songModalStep2 = null;
var songModalViewStep = null;
var songTitleInput = null;
var songArtistInput = null;
var songLyricsArea = null;
var songLinesBox = null;
var songSaveBtn = null;
var songLines = [];
var songChords = [];
var songExtraSlots = [];
var songEscFn = null;
var songModalReady = false;
var songEditIndex = null;

var pickerBackdrop = null;
var pickerEl = null;
var pickerSearchInput = null;
var pickerListEl = null;
var pickerConfirmBtn = null;
var pickerSelectedName = null;
var pickerLineIndex = -1;
var pickerSlotIndex = -1;

var previewBackdrop = null;
var previewEl = null;
var previewDiagramEl = null;
var previewActionsEl = null;
var previewLineIndex = -1;
var previewSlotIndex = -1;

var viewTitleEl = null;
var viewArtistEl = null;
var viewLinesEl = null;

var SLOT_INTERVAL = 3;

function slotCount(text, lineIndex) {
  if (!text || !text.length) return 1;
  return Math.ceil(text.length / SLOT_INTERVAL) + (songExtraSlots[lineIndex] || 0) + 1;
}

function slotToCharPos(slotIndex, textLength) {
  var pos = slotIndex * SLOT_INTERVAL;
  return pos > textLength ? textLength : pos;
}

function getChordAtSlot(lineIndex, slotIndex) {
  var chords = songChords[lineIndex];
  if (!chords) return null;
  var pos = slotToCharPos(slotIndex, songLines[lineIndex].length);
  for (var i = 0; i < chords.length; i++) {
    if (chords[i].pos === pos) return chords[i];
  }
  return null;
}

function setChordAtSlot(lineIndex, slotIndex, name) {
  if (!songChords[lineIndex]) songChords[lineIndex] = [];
  var chords = songChords[lineIndex];
  var pos = slotToCharPos(slotIndex, songLines[lineIndex].length);
  for (var i = chords.length - 1; i >= 0; i--) {
    if (chords[i].pos === pos) chords.splice(i, 1);
  }
  if (name) chords.push({ pos: pos, name: name });
}

function hasAnyChord() {
  for (var i = 0; i < songChords.length; i++) {
    if (songChords[i] && songChords[i].length > 0) return true;
  }
  return false;
}

function findChordByName(name) {
  var all = loadChords();
  for (var i = 0; i < all.length; i++) {
    if (all[i].name === name) return all[i];
  }
  return null;
}

function showSongModal() {
  songModalBackdrop.classList.add("is-open");
  songModalEl.classList.add("is-open");
  document.body.classList.add("song-modal-open");
  songEscFn = function (e) {
    if (e.key === "Escape") songModalClose();
  };
  document.addEventListener("keydown", songEscFn, true);
}

function songModalBuildDom() {
  songModalBackdrop = document.createElement("div");
  songModalBackdrop.className = "song-modal-backdrop";
  songModalBackdrop.addEventListener("click", songModalClose);

  songModalEl = document.createElement("div");
  songModalEl.className = "song-modal";

  songModalStep1 = buildStep1();
  songModalEl.appendChild(songModalStep1);

  songModalStep2 = buildStep2();
  songModalEl.appendChild(songModalStep2);

  songModalViewStep = buildViewStep();
  songModalEl.appendChild(songModalViewStep);

  document.body.appendChild(songModalBackdrop);
  document.body.appendChild(songModalEl);

  buildPickerDom();
  buildPreviewDom();
  songModalReady = true;
}

function buildStep1() {
  var step = document.createElement("div");
  step.className = "song-modal__step";

  var title = document.createElement("h2");
  title.className = "chord-modal__title";
  title.textContent = "Agregar canción";
  step.appendChild(title);

  songTitleInput = document.createElement("input");
  songTitleInput.type = "text";
  songTitleInput.className = "chord-modal__input song-modal__field";
  songTitleInput.placeholder = "Título de la canción";
  songTitleInput.setAttribute("autocomplete", "off");
  step.appendChild(songTitleInput);

  songArtistInput = document.createElement("input");
  songArtistInput.type = "text";
  songArtistInput.className = "chord-modal__input song-modal__field";
  songArtistInput.placeholder = "Artista";
  songArtistInput.setAttribute("autocomplete", "off");
  step.appendChild(songArtistInput);

  var label = document.createElement("p");
  label.className = "song-modal__label";
  label.textContent = "Agregar la letra de la canción";
  step.appendChild(label);

  var hint = document.createElement("p");
  hint.className = "chord-modal__hint";
  hint.textContent =
    "Escribe la letra de la canción separada en versos como tú prefieras. Consejo: también puedes buscarla en Google, copiarla y pegarla aquí.";
  step.appendChild(hint);

  songLyricsArea = document.createElement("textarea");
  songLyricsArea.className = "song-modal__textarea";
  songLyricsArea.placeholder = "Escribe la letra aquí…";
  songLyricsArea.rows = 8;
  step.appendChild(songLyricsArea);

  var actions = document.createElement("div");
  actions.className = "chord-modal__actions";

  var cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "chord-modal__btn chord-modal__btn--ghost";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", songModalClose);
  actions.appendChild(cancelBtn);

  var nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "chord-modal__btn chord-modal__btn--primary";
  nextBtn.textContent = "Siguiente";
  nextBtn.addEventListener("click", songGoStep2);
  actions.appendChild(nextBtn);

  step.appendChild(actions);
  return step;
}

function buildStep2() {
  var step = document.createElement("div");
  step.className = "song-modal__step";
  step.hidden = true;

  var backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "song-modal__back";
  backBtn.textContent = "\u2190 Volver";
  backBtn.addEventListener("click", function () {
    step.hidden = true;
    songModalStep1.hidden = false;
  });
  step.appendChild(backBtn);

  var title = document.createElement("h2");
  title.className = "chord-modal__title";
  title.textContent = "Asignar acordes";
  step.appendChild(title);

  songLinesBox = document.createElement("div");
  songLinesBox.className = "song-modal__lines";
  step.appendChild(songLinesBox);

  var addVerseBtn = document.createElement("button");
  addVerseBtn.type = "button";
  addVerseBtn.className = "song-modal__add-verse";
  addVerseBtn.textContent = "+ Agregar verso";
  addVerseBtn.addEventListener("click", function () {
    songLines.push("");
    songChords.push([]);
    songExtraSlots.push(0);
    renderAllLines();
  });
  step.appendChild(addVerseBtn);

  songSaveBtn = document.createElement("button");
  songSaveBtn.type = "button";
  songSaveBtn.className = "chord-modal__btn chord-modal__btn--primary song-modal__save";
  songSaveBtn.textContent = "Guardar canción";
  songSaveBtn.disabled = true;
  songSaveBtn.addEventListener("click", songModalSave);
  step.appendChild(songSaveBtn);

  return step;
}

function buildViewStep() {
  var step = document.createElement("div");
  step.className = "song-modal__step";
  step.hidden = true;

  var header = document.createElement("div");
  header.className = "song-view__header";

  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "song-modal__back";
  closeBtn.textContent = "\u2190 Cerrar";
  closeBtn.addEventListener("click", songModalClose);
  header.appendChild(closeBtn);

  var editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "song-view__edit-btn";
  editBtn.textContent = "Editar";
  editBtn.addEventListener("click", songModalEditFromView);
  header.appendChild(editBtn);

  step.appendChild(header);

  viewTitleEl = document.createElement("h2");
  viewTitleEl.className = "song-view__title";
  step.appendChild(viewTitleEl);

  viewArtistEl = document.createElement("p");
  viewArtistEl.className = "song-view__artist";
  step.appendChild(viewArtistEl);

  viewLinesEl = document.createElement("div");
  viewLinesEl.className = "song-view";
  step.appendChild(viewLinesEl);

  return step;
}

function songModalOpen() {
  if (typeof chordyCloseFabMenu === "function") chordyCloseFabMenu();
  if (!songModalReady) return;
  songTitleInput.value = "";
  songArtistInput.value = "";
  songLyricsArea.value = "";
  songEditIndex = null;
  songLines = [];
  songChords = [];
  songExtraSlots = [];
  songModalStep1.hidden = false;
  songModalStep2.hidden = true;
  songModalViewStep.hidden = true;
  showSongModal();
  songTitleInput.focus();
}

function songModalClose() {
  pickerClose();
  previewClose();
  songModalBackdrop.classList.remove("is-open");
  songModalEl.classList.remove("is-open");
  document.body.classList.remove("song-modal-open");
  if (songEscFn) {
    document.removeEventListener("keydown", songEscFn, true);
    songEscFn = null;
  }
}

function songGoStep2() {
  var title = songTitleInput.value.trim();
  var artist = songArtistInput.value.trim();
  var lyrics = songLyricsArea.value;
  if (!title || !artist || !lyrics.trim()) return;
  songLines = lyrics.split("\n");
  songChords = [];
  songExtraSlots = [];
  for (var i = 0; i < songLines.length; i++) {
    songChords.push([]);
    songExtraSlots.push(0);
  }
  songModalStep1.hidden = true;
  songModalStep2.hidden = false;
  songSaveBtn.textContent = "Guardar canción";
  renderAllLines();
  updateSaveBtn();
}

function renderAllLines() {
  songLinesBox.innerHTML = "";
  for (var i = 0; i < songLines.length; i++) {
    songLinesBox.appendChild(renderLine(i));
  }
}

function renderLine(lineIndex) {
  var text = songLines[lineIndex];
  var wrap = document.createElement("div");
  wrap.className = "song-line";
  wrap.setAttribute("data-line", String(lineIndex));

  if (!text.trim()) {
    var placeholder = document.createElement("div");
    placeholder.className = "song-line__text song-line__text--editable song-line__text--empty";
    placeholder.textContent = "(verso vacío — toca para editar)";
    placeholder.setAttribute("data-line", String(lineIndex));
    placeholder.addEventListener("click", onLineTextClick);
    wrap.appendChild(placeholder);
    return wrap;
  }

  var slotsRow = document.createElement("div");
  slotsRow.className = "song-line__slots";
  var total = slotCount(text, lineIndex);

  for (var s = 0; s < total; s++) {
    var chord = getChordAtSlot(lineIndex, s);
    if (chord) {
      var label = document.createElement("span");
      label.className = "song-line__chord-lbl";
      label.textContent = chord.name;
      label.setAttribute("data-line", String(lineIndex));
      label.setAttribute("data-slot", String(s));
      label.addEventListener("click", onChordLabelClick);
      slotsRow.appendChild(label);
    } else if (s === total - 1) {
      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "song-line__slot song-line__slot--add";
      addBtn.textContent = "+";
      addBtn.setAttribute("data-line", String(lineIndex));
      addBtn.setAttribute("data-slot", String(s));
      addBtn.addEventListener("click", onAddSlotClick);
      slotsRow.appendChild(addBtn);
    } else {
      var slotBtn = document.createElement("button");
      slotBtn.type = "button";
      slotBtn.className = "song-line__slot";
      slotBtn.setAttribute("data-line", String(lineIndex));
      slotBtn.setAttribute("data-slot", String(s));
      slotBtn.addEventListener("click", onSlotClick);
      slotsRow.appendChild(slotBtn);
    }
  }
  wrap.appendChild(slotsRow);

  var textEl = document.createElement("div");
  textEl.className = "song-line__text song-line__text--editable";
  textEl.textContent = text;
  textEl.setAttribute("data-line", String(lineIndex));
  textEl.addEventListener("click", onLineTextClick);
  wrap.appendChild(textEl);
  return wrap;
}

function reRenderLine(lineIndex) {
  var old = songLinesBox.querySelector('[data-line="' + lineIndex + '"]');
  if (!old) return;
  old.parentNode.replaceChild(renderLine(lineIndex), old);
}

function readLineIndex(el) {
  return parseInt(el.getAttribute("data-line"), 10);
}

function readSlotIndex(el) {
  return parseInt(el.getAttribute("data-slot"), 10);
}

function onAddSlotClick(e) {
  var lineIndex = readLineIndex(e.currentTarget);
  var slotIndex = readSlotIndex(e.currentTarget);
  if (slotIndex > 0 && !getChordAtSlot(lineIndex, slotIndex - 1)) return;
  if (!songExtraSlots[lineIndex]) songExtraSlots[lineIndex] = 0;
  songExtraSlots[lineIndex]++;
  reRenderLine(lineIndex);
}

function onSlotClick(e) {
  pickerLineIndex = readLineIndex(e.currentTarget);
  pickerSlotIndex = readSlotIndex(e.currentTarget);
  pickerOpen();
}

function onChordLabelClick(e) {
  var lineIndex = readLineIndex(e.currentTarget);
  var slotIndex = readSlotIndex(e.currentTarget);
  var chord = getChordAtSlot(lineIndex, slotIndex);
  if (!chord) return;
  previewLineIndex = lineIndex;
  previewSlotIndex = slotIndex;
  previewOpen(chord.name);
}

function onLineTextClick(e) {
  var el = e.currentTarget;
  var lineIndex = readLineIndex(el);
  var input = document.createElement("input");
  input.type = "text";
  input.className = "song-line__edit-input";
  input.value = songLines[lineIndex];
  input.setAttribute("data-line", String(lineIndex));
  el.parentNode.replaceChild(input, el);
  input.focus();
  input.select();
  function commitEdit() {
    songLines[lineIndex] = input.value;
    reRenderLine(lineIndex);
  }
  input.addEventListener("blur", commitEdit);
  input.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") input.blur();
  });
}

function updateSaveBtn() {
  if (songSaveBtn) songSaveBtn.disabled = !hasAnyChord();
}

function songModalSave() {
  var title = songTitleInput.value.trim();
  var artist = songArtistInput.value.trim();
  if (!title || !artist || !hasAnyChord()) return;
  var song = {
    title: title,
    artist: artist,
    lines: songLines.slice(),
    chords: []
  };
  for (var i = 0; i < songChords.length; i++) {
    song.chords.push(songChords[i] ? songChords[i].slice() : []);
  }
  if (songEditIndex !== null) {
    updateSongAt(songEditIndex, song);
  } else {
    addSong(song);
  }
  songModalClose();
  if (typeof buildSongLists === "function") buildSongLists();
}

function buildPickerDom() {
  pickerBackdrop = document.createElement("div");
  pickerBackdrop.className = "song-picker-backdrop";
  pickerBackdrop.addEventListener("click", pickerClose);

  pickerEl = document.createElement("div");
  pickerEl.className = "song-picker";

  var searchRow = document.createElement("div");
  searchRow.className = "song-picker__row";

  pickerSearchInput = document.createElement("input");
  pickerSearchInput.type = "text";
  pickerSearchInput.className = "song-picker__search";
  pickerSearchInput.placeholder = "Buscar acorde…";
  pickerSearchInput.setAttribute("autocomplete", "off");
  pickerSearchInput.addEventListener("input", pickerRefresh);
  searchRow.appendChild(pickerSearchInput);

  var newChordBtn = document.createElement("button");
  newChordBtn.type = "button";
  newChordBtn.className = "song-picker__add";
  newChordBtn.textContent = "+";
  newChordBtn.addEventListener("click", function () {
    if (typeof chordModalOpen === "function") chordModalOpen();
  });
  searchRow.appendChild(newChordBtn);
  pickerEl.appendChild(searchRow);

  pickerListEl = document.createElement("div");
  pickerListEl.className = "song-picker__list";
  pickerEl.appendChild(pickerListEl);

  pickerConfirmBtn = document.createElement("button");
  pickerConfirmBtn.type = "button";
  pickerConfirmBtn.className = "song-picker__confirm";
  pickerConfirmBtn.textContent = "Selecciona un acorde";
  pickerConfirmBtn.disabled = true;
  pickerConfirmBtn.addEventListener("click", pickerConfirm);
  pickerEl.appendChild(pickerConfirmBtn);

  document.body.appendChild(pickerBackdrop);
  document.body.appendChild(pickerEl);
}

function pickerOpen() {
  pickerSelectedName = null;
  pickerSearchInput.value = "";
  pickerConfirmBtn.textContent = "Selecciona un acorde";
  pickerConfirmBtn.disabled = true;
  pickerRefresh();
  pickerBackdrop.classList.add("is-open");
  pickerEl.classList.add("is-open");
  pickerSearchInput.focus();
}

function pickerClose() {
  pickerBackdrop.classList.remove("is-open");
  pickerEl.classList.remove("is-open");
}

function pickerRefresh() {
  var query = pickerSearchInput.value.trim().toLowerCase();
  var chords = loadChords();
  pickerListEl.innerHTML = "";
  var found = 0;
  for (var i = 0; i < chords.length; i++) {
    if (query && chords[i].name.toLowerCase().indexOf(query) === -1) continue;
    found++;
    var item = document.createElement("button");
    item.type = "button";
    item.className = "song-picker__item";
    if (pickerSelectedName === chords[i].name) item.classList.add("is-selected");
    item.textContent = chords[i].name;
    item.setAttribute("data-name", chords[i].name);
    item.addEventListener("click", pickerSelect);
    pickerListEl.appendChild(item);
  }
  if (found === 0) {
    var empty = document.createElement("p");
    empty.className = "song-picker__empty";
    empty.textContent = "No hay acordes. Crea uno con +";
    pickerListEl.appendChild(empty);
  }
}

function pickerSelect(e) {
  var name = e.currentTarget.getAttribute("data-name");
  pickerSelectedName = name;
  var items = pickerListEl.querySelectorAll(".song-picker__item");
  for (var i = 0; i < items.length; i++) {
    items[i].classList.toggle("is-selected", items[i].getAttribute("data-name") === name);
  }
  pickerConfirmBtn.textContent = "Confirmar " + name;
  pickerConfirmBtn.disabled = false;
}

function pickerConfirm() {
  if (!pickerSelectedName) return;
  setChordAtSlot(pickerLineIndex, pickerSlotIndex, pickerSelectedName);
  pickerClose();
  reRenderLine(pickerLineIndex);
  updateSaveBtn();
}

window.songModalRefreshPicker = function () {
  if (pickerEl && pickerEl.classList.contains("is-open")) {
    pickerRefresh();
  }
};

function buildPreviewDom() {
  previewBackdrop = document.createElement("div");
  previewBackdrop.className = "song-preview-backdrop";
  previewBackdrop.addEventListener("click", previewClose);

  previewEl = document.createElement("div");
  previewEl.className = "song-preview";

  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "song-preview__close";
  closeBtn.innerHTML = "&#10005;";
  closeBtn.addEventListener("click", previewClose);
  previewEl.appendChild(closeBtn);

  previewDiagramEl = document.createElement("div");
  previewDiagramEl.className = "song-preview__diagram";
  previewEl.appendChild(previewDiagramEl);

  previewActionsEl = document.createElement("div");
  previewActionsEl.className = "chord-modal__actions";
  previewActionsEl.style.marginTop = "0.75rem";

  var removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "chord-modal__btn chord-modal__btn--ghost";
  removeBtn.textContent = "Quitar";
  removeBtn.addEventListener("click", function () {
    setChordAtSlot(previewLineIndex, previewSlotIndex, null);
    previewClose();
    reRenderLine(previewLineIndex);
    updateSaveBtn();
  });
  previewActionsEl.appendChild(removeBtn);

  var replaceBtn = document.createElement("button");
  replaceBtn.type = "button";
  replaceBtn.className = "chord-modal__btn chord-modal__btn--primary";
  replaceBtn.textContent = "Reemplazar acorde";
  replaceBtn.addEventListener("click", function () {
    previewClose();
    pickerLineIndex = previewLineIndex;
    pickerSlotIndex = previewSlotIndex;
    pickerOpen();
  });
  previewActionsEl.appendChild(replaceBtn);

  previewEl.appendChild(previewActionsEl);
  document.body.appendChild(previewBackdrop);
  document.body.appendChild(previewEl);
}

function previewRenderDiagram(chordName) {
  var chordData = findChordByName(chordName);
  previewDiagramEl.innerHTML = "";
  if (chordData) {
    renderChordDiagram(previewDiagramEl, {
      name: chordData.name,
      strings: chordData.strings,
      startFret: computeChordDisplayStartFret(chordData.strings)
    });
  } else {
    var fallback = document.createElement("p");
    fallback.style.textAlign = "center";
    fallback.style.fontSize = "1.5rem";
    fallback.style.fontWeight = "700";
    fallback.textContent = chordName;
    previewDiagramEl.appendChild(fallback);
  }
  previewBackdrop.classList.add("is-open");
  previewEl.classList.add("is-open");
}

function previewOpen(chordName) {
  previewActionsEl.hidden = false;
  previewRenderDiagram(chordName);
}

function previewOpenReadonly(chordName) {
  previewActionsEl.hidden = true;
  previewRenderDiagram(chordName);
}

function previewClose() {
  previewBackdrop.classList.remove("is-open");
  previewEl.classList.remove("is-open");
}

function songModalEditFromView() {
  var songs = loadSongs();
  if (songEditIndex === null || songEditIndex < 0 || songEditIndex >= songs.length) return;
  var song = songs[songEditIndex];
  songTitleInput.value = song.title;
  songArtistInput.value = song.artist;
  songLines = song.lines.slice();
  songChords = [];
  songExtraSlots = [];
  for (var i = 0; i < song.lines.length; i++) {
    songChords.push(song.chords[i] ? song.chords[i].slice() : []);
    songExtraSlots.push(0);
  }
  songModalViewStep.hidden = true;
  songModalStep1.hidden = true;
  songModalStep2.hidden = false;
  songSaveBtn.textContent = "Guardar cambios";
  renderAllLines();
  updateSaveBtn();
}

function songModalOpenView(index) {
  var songs = loadSongs();
  if (index < 0 || index >= songs.length) return;
  if (!songModalReady) return;
  if (typeof chordyCloseFabMenu === "function") chordyCloseFabMenu();

  var song = songs[index];
  songEditIndex = index;

  songModalStep1.hidden = true;
  songModalStep2.hidden = true;
  songModalViewStep.hidden = false;

  viewTitleEl.textContent = song.title;
  viewArtistEl.textContent = song.artist;
  viewLinesEl.innerHTML = "";

  for (var i = 0; i < song.lines.length; i++) {
    var lineText = song.lines[i];
    var lineChords = song.chords[i] || [];
    var lineDiv = document.createElement("div");
    lineDiv.className = "song-view__line";

    if (lineChords.length > 0) {
      lineDiv.appendChild(buildChordElements(lineText, lineChords));
    }

    var textDiv = document.createElement("div");
    textDiv.className = "song-view__text";
    textDiv.textContent = lineText;
    lineDiv.appendChild(textDiv);
    viewLinesEl.appendChild(lineDiv);
  }

  showSongModal();
}

function buildChordElements(text, chords) {
  var row = document.createElement("div");
  row.className = "song-view__chords";
  var sorted = chords.slice().sort(function (a, b) {
    return a.pos - b.pos;
  });
  var cursor = 0;
  for (var i = 0; i < sorted.length; i++) {
    var gap = sorted[i].pos - cursor;
    if (gap < 1 && i > 0) gap = 1;
    var span = document.createElement("span");
    span.className = "song-view__chord-name";
    span.textContent = sorted[i].name;
    span.style.cursor = "pointer";
    span.setAttribute("data-chord", sorted[i].name);
    span.addEventListener("click", function (e) {
      previewOpenReadonly(e.currentTarget.getAttribute("data-chord"));
    });
    if (gap > 0) span.style.marginLeft = gap + "ch";
    row.appendChild(span);
    cursor = sorted[i].pos + sorted[i].name.length;
  }
  return row;
}

function initSongModal() {
  songModalBuildDom();
  var btns = document.querySelectorAll(".js-fab-open-song-modal");
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function (e) {
      e.preventDefault();
      songModalOpen();
    });
  }
  if (sessionStorage.getItem("chordyOpenSongModal")) {
    sessionStorage.removeItem("chordyOpenSongModal");
    songModalOpen();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSongModal);
} else {
  initSongModal();
}
