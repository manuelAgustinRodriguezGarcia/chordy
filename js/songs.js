function chordyIsOnline() {
  return navigator.onLine;
}

function chordySpotifySearch(query) {
  if (!chordyIsOnline()) {
    return Promise.resolve([]);
  }
  let q = (query || "").trim();
  if (!q) {
    return Promise.resolve([]);
  }
  return fetch("/api/spotify/search?q=" + encodeURIComponent(q))
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.results) return [];
      return data.results;
    })
    .catch(function () {
      return [];
    });
}


let songModalBackdrop = null;
let songModalEl = null;
let songModalStep1 = null;
let songModalStep1Title = null;
let songModalStep2 = null;
let songModalViewStep = null;
let songTitleInput = null;
let songAlbumInput = null;
let songTitleWrap = null;
let songAlbumWrap = null;
let songArtistInput = null;
let songArtistWrap = null;
let songTitleDropdown = null;
let songArtistDropdown = null;
let songTitleTrash = null;
let songAlbumTrash = null;
let songArtistTrash = null;
let songTitleSearchTimer = null;
let songFormAlbumImage = "";
let songFormManual = { title: true, album: true, artist: true };
let songLyricsArea = null;
let songLinesBox = null;
let songSaveBtn = null;
let songLines = [];
let songChords = [];
let songExtraSlots = [];
let songEscFn = null;
let songModalReady = false;
let songEditIndex = null;

let pickerBackdrop = null;
let pickerEl = null;
let pickerSearchInput = null;
let pickerListEl = null;
let pickerConfirmBtn = null;
let pickerSelectedName = null;
let pickerLineIndex = -1;
let pickerSlotIndex = -1;

let previewBackdrop = null;
let previewEl = null;
let previewDiagramEl = null;
let previewActionsEl = null;
let previewLineIndex = -1;
let previewSlotIndex = -1;

let viewTitleEl = null;
let viewAlbumEl = null;
let viewArtistEl = null;
let viewLinesEl = null;
let viewLearnedBtn = null;

let SLOT_INTERVAL = 3;

function songFormSyncTrash(field) {
  let trash =
    field === "title"
      ? songTitleTrash
      : field === "album"
        ? songAlbumTrash
        : songArtistTrash;
  let input =
    field === "title"
      ? songTitleInput
      : field === "album"
        ? songAlbumInput
        : songArtistInput;
  if (!trash || !input) return;
  trash.hidden = songFormManual[field] || !input.value.trim();
}

function songFormReset() {
  songFormManual.title = !chordyIsOnline();
  songFormManual.album = true;
  songFormManual.artist = true;
  songFormAlbumImage = "";
  songFormSyncTrash("title");
  songFormSyncTrash("album");
  songFormSyncTrash("artist");
  if (songTitleDropdown) {
    songTitleDropdown.innerHTML = "";
    songTitleDropdown.hidden = true;
  }
  if (songArtistDropdown) {
    songArtistDropdown.innerHTML = "";
    songArtistDropdown.hidden = true;
  }
}

function songFormTrashClick(field) {
  songFormManual[field] = true;
  if (field === "title") {
    songFormAlbumImage = "";
    if (songTitleDropdown) {
      songTitleDropdown.innerHTML = "";
      songTitleDropdown.hidden = true;
    }
  }
  if (field === "artist" && songArtistDropdown) {
    songArtistDropdown.hidden = true;
  }
  songFormSyncTrash(field);
}

function songFormApplyTrack(track) {
  songTitleInput.value = track.title;
  songAlbumInput.value = track.album;
  songArtistInput.value = track.artist;
  songFormAlbumImage = track.image || "";
  songFormManual.title = false;
  songFormManual.album = false;
  songFormManual.artist = false;
  songFormSyncTrash("title");
  songFormSyncTrash("album");
  songFormSyncTrash("artist");
  if (songTitleDropdown) songTitleDropdown.hidden = true;
  if (songArtistDropdown) songArtistDropdown.hidden = true;
}

function songHideTitleDropdown() {
  if (songTitleDropdown) {
    songTitleDropdown.innerHTML = "";
    songTitleDropdown.hidden = true;
  }
}

function songTitleSearchRun() {
  if (songFormManual.title || !chordyIsOnline()) {
    songHideTitleDropdown();
    return;
  }
  let query = songTitleInput.value.trim();
  if (!songTitleDropdown) return;
  songTitleDropdown.innerHTML = "";
  if (!query) {
    songTitleDropdown.hidden = true;
    return;
  }
  chordySpotifySearch(query).then(function (results) {
    if (!songTitleDropdown || songFormManual.title || !chordyIsOnline()) {
      songHideTitleDropdown();
      return;
    }
    songTitleDropdown.innerHTML = "";
    for (let i = 0; i < results.length; i++) {
      (function (track) {
        let btn = document.createElement("button");
        btn.type = "button";
        btn.className = "song-meta-dropdown__item";
        btn.textContent = track.title + " · " + track.artist;
        btn.addEventListener("mousedown", function (e) {
          e.preventDefault();
        });
        btn.addEventListener("click", function () {
          songFormApplyTrack(track);
        });
        songTitleDropdown.appendChild(btn);
      })(results[i]);
    }
    let useBtn = document.createElement("button");
    useBtn.type = "button";
    useBtn.className = "song-meta-dropdown__own";
    useBtn.textContent = '"' + query + '"';
    useBtn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    useBtn.addEventListener("click", function () {
      songFormManual.title = true;
      songFormManual.album = true;
      songFormManual.artist = true;
      songFormAlbumImage = "";
      songHideTitleDropdown();
      songFormSyncTrash("title");
      songFormSyncTrash("album");
      songFormSyncTrash("artist");
    });
    songTitleDropdown.appendChild(useBtn);
    songTitleDropdown.hidden = false;
  });
}

function songTitleInputHandler() {
  if (songTitleSearchTimer) clearTimeout(songTitleSearchTimer);
  if (songFormManual.title || !chordyIsOnline()) {
    songHideTitleDropdown();
    songFormSyncTrash("title");
    return;
  }
  songTitleSearchTimer = setTimeout(songTitleSearchRun, 400);
  songFormSyncTrash("title");
}

function songOnBrowserOffline() {
  songHideTitleDropdown();
  songFormManual.title = true;
  songFormSyncTrash("title");
  songSyncUpdateButtons();
}

function songOnBrowserOnline() {
  songSyncUpdateButtons();
}

function songCopyChords(chords) {
  let out = [];
  for (let i = 0; i < chords.length; i++) {
    out.push(chords[i] ? chords[i].slice() : []);
  }
  return out;
}

let songSyncBackdrop = null;
let songSyncEl = null;
let songSyncPreviewEl = null;
let songSyncResultsEl = null;
let songSyncHintEl = null;
let songSyncSkipBtn = null;
let songSyncIndex = null;

function songSyncBuildDom() {
  songSyncBackdrop = document.createElement("div");
  songSyncBackdrop.className = "song-sync-backdrop";
  songSyncBackdrop.addEventListener("click", songSyncClose);

  songSyncEl = document.createElement("div");
  songSyncEl.className = "song-sync-modal";
  songSyncEl.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  let title = document.createElement("h2");
  title.className = "chord-modal__title";
  title.textContent = "Sincronizar canción";
  songSyncEl.appendChild(title);

  songSyncPreviewEl = document.createElement("div");
  songSyncPreviewEl.className = "song-sync-preview";
  songSyncEl.appendChild(songSyncPreviewEl);

  songSyncHintEl = document.createElement("p");
  songSyncHintEl.className = "chord-modal__hint";
  songSyncHintEl.textContent =
    "Elegí una coincidencia de Spotify para corregir título, álbum, artista e imagen. La letra y los acordes no se modifican.";
  songSyncEl.appendChild(songSyncHintEl);

  songSyncResultsEl = document.createElement("div");
  songSyncResultsEl.className = "song-sync-results";
  songSyncEl.appendChild(songSyncResultsEl);

  let actions = document.createElement("div");
  actions.className = "chord-modal__actions song-sync-actions";

  songSyncSkipBtn = document.createElement("button");
  songSyncSkipBtn.type = "button";
  songSyncSkipBtn.className = "chord-modal__btn chord-modal__btn--ghost";
  songSyncSkipBtn.textContent = "Omitir sincronización";
  songSyncSkipBtn.addEventListener("click", function () {
    if (songSyncIndex !== null) songSyncSkip(songSyncIndex);
  });
  actions.appendChild(songSyncSkipBtn);

  let closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "chord-modal__btn chord-modal__btn--ghost";
  closeBtn.textContent = "Cerrar";
  closeBtn.addEventListener("click", songSyncClose);
  actions.appendChild(closeBtn);

  songSyncEl.appendChild(actions);
  document.body.appendChild(songSyncBackdrop);
  document.body.appendChild(songSyncEl);
}

function songSyncClose() {
  if (songSyncBackdrop) songSyncBackdrop.classList.remove("is-open");
  if (songSyncEl) songSyncEl.classList.remove("is-open");
  document.body.classList.remove("song-sync-open");
  songSyncIndex = null;
}

function songSyncRenderPreview(song) {
  if (!songSyncPreviewEl || !song) return;
  songSyncPreviewEl.innerHTML = "";
  let row = document.createElement("div");
  row.className = "song-sync-preview__row";

  if (song.albumImage) {
    let img = document.createElement("img");
    img.className = "song-sync-preview__cover";
    img.src = song.albumImage;
    img.alt = "";
    row.appendChild(img);
  } else {
    let empty = document.createElement("div");
    empty.className = "song-sync-preview__cover song-sync-preview__cover--empty";
    row.appendChild(empty);
  }

  let body = document.createElement("div");
  body.className = "song-sync-preview__body";
  let t = document.createElement("p");
  t.className = "song-sync-preview__title";
  t.textContent = song.title;
  let a = document.createElement("p");
  a.className = "song-sync-preview__meta";
  a.textContent = (song.album || "—") + " · " + (song.artist || "—");
  body.appendChild(t);
  body.appendChild(a);
  row.appendChild(body);
  songSyncPreviewEl.appendChild(row);
}

function songSyncApplyTrack(storageIndex, track) {
  let songs = loadSongs();
  let song = songs[storageIndex];
  if (!song || !track) return;
  let updated = {
    title: track.title,
    album: track.album || song.album,
    artist: track.artist || song.artist,
    albumImage: track.image || song.albumImage || "",
    lines: song.lines.slice(),
    chords: songCopyChords(song.chords),
    learned: !!song.learned
  };
  updateSongAt(storageIndex, updated);
  songSyncClose();
  buildSongLists();
}

function songSyncSkip(storageIndex) {
  let songs = loadSongs();
  let song = songs[storageIndex];
  if (!song) return;
  let updated = {
    title: song.title,
    album: song.album || "",
    artist: song.artist || "",
    albumImage: song.albumImage || "",
    lines: song.lines.slice(),
    chords: songCopyChords(song.chords),
    learned: !!song.learned
  };
  updateSongAt(storageIndex, updated);
  songSyncClose();
  buildSongLists();
}

function songSyncRenderResults(storageIndex, results) {
  if (!songSyncResultsEl) return;
  songSyncResultsEl.innerHTML = "";
  if (!results.length) {
    let empty = document.createElement("p");
    empty.className = "song-sync-results__empty";
    empty.textContent = "No se encontraron coincidencias en Spotify.";
    songSyncResultsEl.appendChild(empty);
    return;
  }
  for (let i = 0; i < results.length; i++) {
    (function (track) {
      let btn = document.createElement("button");
      btn.type = "button";
      btn.className = "song-sync-results__item";
      btn.textContent = track.title + " · " + track.artist;
      if (track.album) {
        btn.textContent += " — " + track.album;
      }
      btn.addEventListener("click", function () {
        songSyncApplyTrack(storageIndex, track);
      });
      songSyncResultsEl.appendChild(btn);
    })(results[i]);
  }
}

function songSyncOpen(storageIndex) {
  if (!chordyIsOnline()) return;
  let songs = loadSongs();
  let song = songs[storageIndex];
  if (!song || !song.pendingSync) return;

  songSyncIndex = storageIndex;
  songSyncRenderPreview(song);
  songSyncResultsEl.innerHTML = "";
  let loading = document.createElement("p");
  loading.className = "song-sync-results__empty";
  loading.textContent = "Buscando coincidencias…";
  songSyncResultsEl.appendChild(loading);

  songSyncBackdrop.classList.add("is-open");
  songSyncEl.classList.add("is-open");
  document.body.classList.add("song-sync-open");

  chordySpotifySearch(song.title).then(function (results) {
    if (songSyncIndex !== storageIndex) return;
    songSyncRenderResults(storageIndex, results);
  });
}

function songSyncUpdateButtons() {
  let online = chordyIsOnline();
  let btns = document.querySelectorAll(".js-song-sync");
  for (let i = 0; i < btns.length; i++) {
    btns[i].disabled = !online;
  }
}

function bindSongSyncButtons() {
  let btns = document.querySelectorAll(".js-song-sync");
  for (let i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.disabled) return;
      let idx = parseInt(this.getAttribute("data-song-idx"), 10);
      if (!isNaN(idx)) songSyncOpen(idx);
    });
  }
  songSyncUpdateButtons();
}

function songAppendMetaField(step, placeholder, field) {
  let wrap = document.createElement("div");
  wrap.className = "song-meta-field";

  let row = document.createElement("div");
  row.className = "song-meta-field__row";

  let input = document.createElement("input");
  input.type = "text";
  input.className = "chord-modal__input song-modal__field";
  input.placeholder = placeholder;
  input.setAttribute("autocomplete", "off");

  let trash = document.createElement("button");
  trash.type = "button";
  trash.className = "song-meta-field__trash";
  trash.hidden = true;
  trash.setAttribute("aria-label", "Escribir a mano");
  trash.textContent = "\u00d7";
  trash.addEventListener("click", function () {
    songFormTrashClick(field);
  });
  input.addEventListener("input", function () {
    songFormSyncTrash(field);
  });

  row.appendChild(input);
  row.appendChild(trash);
  wrap.appendChild(row);

  let dropdown = null;
  if (field === "title") {
    dropdown = document.createElement("div");
    dropdown.className = "song-meta-dropdown";
    dropdown.hidden = true;
    wrap.appendChild(dropdown);
    songTitleDropdown = dropdown;
    input.addEventListener("input", songTitleInputHandler);
    input.addEventListener("focus", songTitleInputHandler);
  }
  if (field === "artist") {
    dropdown = document.createElement("div");
    dropdown.className = "song-artist-dropdown";
    dropdown.hidden = true;
    wrap.appendChild(dropdown);
    songArtistDropdown = dropdown;
    input.addEventListener("input", songArtistDropdownRefresh);
    input.addEventListener("focus", songArtistDropdownRefresh);
  }

  wrap.addEventListener(
    "blur",
    function (e) {
      if (wrap.contains(e.relatedTarget)) return;
      setTimeout(function () {
        if (dropdown) dropdown.hidden = true;
      }, 150);
    },
    true
  );

  step.appendChild(wrap);

  if (field === "title") {
    songTitleWrap = wrap;
    songTitleInput = input;
    songTitleTrash = trash;
  }
  if (field === "album") {
    songAlbumWrap = wrap;
    songAlbumInput = input;
    songAlbumTrash = trash;
  }
  if (field === "artist") {
    songArtistWrap = wrap;
    songArtistInput = input;
    songArtistTrash = trash;
  }
}

function slotCount(text, lineIndex) {
  if (!text || !text.length) return 1;
  return Math.ceil(text.length / SLOT_INTERVAL) + (songExtraSlots[lineIndex] || 0) + 1;
}

function slotToCharPos(slotIndex, textLength) {
  let pos = slotIndex * SLOT_INTERVAL;
  return pos > textLength ? textLength : pos;
}

function getChordAtSlot(lineIndex, slotIndex) {
  let chords = songChords[lineIndex];
  if (!chords) return null;
  let pos = slotToCharPos(slotIndex, songLines[lineIndex].length);
  for (let i = 0; i < chords.length; i++) {
    if (chords[i].pos === pos) return chords[i];
  }
  return null;
}

function setChordAtSlot(lineIndex, slotIndex, name) {
  if (!songChords[lineIndex]) songChords[lineIndex] = [];
  let chords = songChords[lineIndex];
  let pos = slotToCharPos(slotIndex, songLines[lineIndex].length);
  for (let i = chords.length - 1; i >= 0; i--) {
    if (chords[i].pos === pos) chords.splice(i, 1);
  }
  if (name) chords.push({ pos: pos, name: name });
}

function hasAnyChord() {
  for (let i = 0; i < songChords.length; i++) {
    if (songChords[i] && songChords[i].length > 0) return true;
  }
  return false;
}

function findChordByName(name) {
  let all = loadChords();
  for (let i = 0; i < all.length; i++) {
    if (all[i].name === name) return all[i];
  }
  return null;
}

function showSongModal() {
  songModalBackdrop.classList.add("is-open");
  songModalEl.classList.add("is-open");
  document.body.classList.add("song-modal-open");
  songEscFn = function (e) {
    if (e.key !== "Escape") return;
    let delDlg = document.getElementById("song-delete-modal");
    if (delDlg && delDlg.classList.contains("is-open")) {
      songDeleteModalClose();
      return;
    }
    songModalClose();
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
  songSyncBuildDom();
  songModalReady = true;
}

function buildStep1() {
  let step = document.createElement("div");
  step.className = "song-modal__step";

  songModalStep1Title = document.createElement("h2");
  songModalStep1Title.className = "chord-modal__title";
  songModalStep1Title.textContent = "Agregar canción";
  step.appendChild(songModalStep1Title);

  songAppendMetaField(step, "Título de la canción", "title");
  songAppendMetaField(step, "Álbum", "album");
  songAppendMetaField(step, "Artista", "artist");

  let label = document.createElement("p");
  label.className = "song-modal__label";
  label.textContent = "Agregar la letra de la canción";
  step.appendChild(label);

  let hint = document.createElement("p");
  hint.className = "chord-modal__hint";
  hint.textContent =
    "Escribe la letra de la canción separada en versos como tú prefieras. Consejo: también puedes buscarla en Google, copiarla y pegarla aquí.";
  step.appendChild(hint);

  songLyricsArea = document.createElement("textarea");
  songLyricsArea.className = "song-modal__textarea";
  songLyricsArea.placeholder = "Escribe la letra aquí…";
  songLyricsArea.rows = 8;
  step.appendChild(songLyricsArea);

  let actions = document.createElement("div");
  actions.className = "chord-modal__actions";

  let cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "chord-modal__btn chord-modal__btn--ghost";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", songModalClose);
  actions.appendChild(cancelBtn);

  let nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "chord-modal__btn chord-modal__btn--primary";
  nextBtn.textContent = "Siguiente";
  nextBtn.addEventListener("click", songGoStep2);
  actions.appendChild(nextBtn);

  step.appendChild(actions);
  return step;
}

function buildStep2() {
  let step = document.createElement("div");
  step.className = "song-modal__step";
  step.hidden = true;

  let backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "song-modal__back";
  backBtn.textContent = "\u2190 Volver";
  backBtn.addEventListener("click", function () {
    step.hidden = true;
    songModalStep1.hidden = false;
  });
  step.appendChild(backBtn);

  let title = document.createElement("h2");
  title.className = "chord-modal__title";
  title.textContent = "Asignar acordes";
  step.appendChild(title);

  songLinesBox = document.createElement("div");
  songLinesBox.className = "song-modal__lines";
  step.appendChild(songLinesBox);

  let addVerseBtn = document.createElement("button");
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
  let step = document.createElement("div");
  step.className = "song-modal__step";
  step.hidden = true;

  let header = document.createElement("div");
  header.className = "song-view__header";

  let closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "song-modal__back";
  closeBtn.textContent = "\u2190 Cerrar";
  closeBtn.addEventListener("click", songModalClose);
  header.appendChild(closeBtn);

  let actions = document.createElement("div");
  actions.className = "song-view__actions";

  let editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "song-view__edit-btn";
  editBtn.textContent = "Editar";
  editBtn.addEventListener("click", songModalEditFromView);
  actions.appendChild(editBtn);

  let deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "song-view__delete-btn";
  deleteBtn.textContent = "Eliminar";
  deleteBtn.addEventListener("click", songDeleteFromView);
  actions.appendChild(deleteBtn);

  header.appendChild(actions);

  step.appendChild(header);

  viewTitleEl = document.createElement("h2");
  viewTitleEl.className = "song-view__title";
  step.appendChild(viewTitleEl);

  viewAlbumEl = document.createElement("p");
  viewAlbumEl.className = "song-view__album";
  step.appendChild(viewAlbumEl);

  viewArtistEl = document.createElement("p");
  viewArtistEl.className = "song-view__artist";
  step.appendChild(viewArtistEl);

  viewLinesEl = document.createElement("div");
  viewLinesEl.className = "song-view";
  step.appendChild(viewLinesEl);

  viewLearnedBtn = document.createElement("button");
  viewLearnedBtn.type = "button";
  viewLearnedBtn.className = "song-view__learned-btn";
  viewLearnedBtn.textContent = "Marcar como aprendida";
  viewLearnedBtn.setAttribute("aria-pressed", "false");
  viewLearnedBtn.addEventListener("click", songToggleLearnedFromView);
  step.appendChild(viewLearnedBtn);

  return step;
}

function songArtistDropdownRefresh() {
  if (!songFormManual.artist && chordyIsOnline()) {
    songArtistDropdown.hidden = true;
    return;
  }
  let query = songArtistInput.value.trim();
  songArtistDropdown.innerHTML = "";
  if (!query) {
    songArtistDropdown.hidden = true;
    return;
  }

  let matches = filterArtists(query);
  let exact = findArtistExact(query);

  for (let i = 0; i < matches.length; i++) {
    let item = document.createElement("button");
    item.type = "button";
    item.className = "song-artist-dropdown__item";
    item.textContent = matches[i];
    item.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    item.addEventListener("click", function (e) {
      songArtistInput.value = e.currentTarget.textContent;
      songArtistDropdown.hidden = true;
    });
    songArtistDropdown.appendChild(item);
  }

  if (!exact) {
    let addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "song-artist-dropdown__add";
    addBtn.textContent = "Agregar artista";
    addBtn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    addBtn.addEventListener("click", function () {
      let name = songArtistInput.value.trim();
      addArtist(name);
      songArtistInput.value = name;
      songArtistDropdownRefresh();
    });
    songArtistDropdown.appendChild(addBtn);
  }

  songArtistDropdown.hidden = false;
}

function songModalOpen() {
  chordyCloseFabMenu();
  if (!songModalReady) return;
  songTitleInput.value = "";
  songAlbumInput.value = "";
  songArtistInput.value = "";
  songFormReset();
  songLyricsArea.value = "";
  songEditIndex = null;
  songLines = [];
  songChords = [];
  songExtraSlots = [];
  if (songModalStep1Title) songModalStep1Title.textContent = "Agregar canción";
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
  let title = songTitleInput.value.trim();
  let album = songAlbumInput.value.trim();
  let artist = songArtistInput.value.trim();
  let lyrics = songLyricsArea.value;
  if (!title || !album || !artist || !lyrics.trim()) return;
  addArtist(artist);
  let oldSong =
    songEditIndex !== null ? loadSongs()[songEditIndex] : null;
  songLines = lyrics.split("\n");
  songChords = [];
  songExtraSlots = [];
  for (let i = 0; i < songLines.length; i++) {
    if (
      oldSong &&
      oldSong.lines[i] === songLines[i] &&
      oldSong.chords[i]
    ) {
      songChords.push(oldSong.chords[i].slice());
    } else {
      songChords.push([]);
    }
    songExtraSlots.push(0);
  }
  songModalStep1.hidden = true;
  songModalStep2.hidden = false;
  songSaveBtn.textContent =
    songEditIndex !== null ? "Guardar cambios" : "Guardar canción";
  renderAllLines();
  updateSaveBtn();
}

function renderAllLines() {
  songLinesBox.innerHTML = "";
  for (let i = 0; i < songLines.length; i++) {
    songLinesBox.appendChild(renderLine(i));
  }
}

function renderLine(lineIndex) {
  let text = songLines[lineIndex];
  let wrap = document.createElement("div");
  wrap.className = "song-line";
  wrap.setAttribute("data-line", String(lineIndex));

  if (!text.trim()) {
    let placeholder = document.createElement("div");
    placeholder.className = "song-line__text song-line__text--editable song-line__text--empty";
    placeholder.textContent = "(verso vacío — toca para editar)";
    placeholder.setAttribute("data-line", String(lineIndex));
    placeholder.addEventListener("click", onLineTextClick);
    wrap.appendChild(placeholder);
    return wrap;
  }

  let slotsRow = document.createElement("div");
  slotsRow.className = "song-line__slots";
  let total = slotCount(text, lineIndex);

  for (let s = 0; s < total; s++) {
    let chord = getChordAtSlot(lineIndex, s);
    if (chord) {
      let label = document.createElement("span");
      label.className = "song-line__chord-lbl";
      label.textContent = chord.name;
      label.setAttribute("data-line", String(lineIndex));
      label.setAttribute("data-slot", String(s));
      label.addEventListener("click", onChordLabelClick);
      slotsRow.appendChild(label);
    } else if (s === total - 1) {
      let addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "song-line__slot song-line__slot--add";
      addBtn.textContent = "+";
      addBtn.setAttribute("data-line", String(lineIndex));
      addBtn.setAttribute("data-slot", String(s));
      addBtn.addEventListener("click", onAddSlotClick);
      slotsRow.appendChild(addBtn);
    } else {
      let slotBtn = document.createElement("button");
      slotBtn.type = "button";
      slotBtn.className = "song-line__slot";
      slotBtn.setAttribute("data-line", String(lineIndex));
      slotBtn.setAttribute("data-slot", String(s));
      slotBtn.addEventListener("click", onSlotClick);
      slotsRow.appendChild(slotBtn);
    }
  }
  wrap.appendChild(slotsRow);

  let textEl = document.createElement("div");
  textEl.className = "song-line__text song-line__text--editable";
  textEl.textContent = text;
  textEl.setAttribute("data-line", String(lineIndex));
  textEl.addEventListener("click", onLineTextClick);
  wrap.appendChild(textEl);
  return wrap;
}

function reRenderLine(lineIndex) {
  let old = songLinesBox.querySelector('[data-line="' + lineIndex + '"]');
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
  let lineIndex = readLineIndex(e.currentTarget);
  let slotIndex = readSlotIndex(e.currentTarget);
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
  let lineIndex = readLineIndex(e.currentTarget);
  let slotIndex = readSlotIndex(e.currentTarget);
  let chord = getChordAtSlot(lineIndex, slotIndex);
  if (!chord) return;
  previewLineIndex = lineIndex;
  previewSlotIndex = slotIndex;
  previewOpen(chord.name);
}

function onLineTextClick(e) {
  let el = e.currentTarget;
  let lineIndex = readLineIndex(el);
  let input = document.createElement("input");
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
  let title = songTitleInput.value.trim();
  let album = songAlbumInput.value.trim();
  let artist = songArtistInput.value.trim();
  if (!title || !album || !artist || !hasAnyChord()) return;
  let song = {
    title: title,
    album: album,
    artist: artist,
    albumImage: songFormAlbumImage || "",
    lines: songLines.slice(),
    chords: []
  };
  for (let i = 0; i < songChords.length; i++) {
    song.chords.push(songChords[i] ? songChords[i].slice() : []);
  }
  if (songEditIndex !== null) {
    let prev = loadSongs()[songEditIndex];
    if (prev && prev.pendingSync) {
      song.pendingSync = true;
    }
    if (prev && prev.learned) {
      song.learned = true;
    }
  } else if (!chordyIsOnline()) {
    song.pendingSync = true;
  }
  let wasEdit = songEditIndex !== null;
  if (songEditIndex !== null) {
    updateSongAt(songEditIndex, song);
  } else {
    addSong(song);
  }
  songModalClose();
  buildSongLists();
  if (typeof chordyShowNotification === "function") {
    if (wasEdit) {
      chordyShowNotification("Chordy", "Canción actualizada correctamente", "chordy-song");
    } else {
      chordyShowNotification("Chordy", "Canción guardada correctamente", "chordy-song");
    }
  }
}

function buildPickerDom() {
  pickerBackdrop = document.createElement("div");
  pickerBackdrop.className = "song-picker-backdrop";
  pickerBackdrop.addEventListener("click", pickerClose);

  pickerEl = document.createElement("div");
  pickerEl.className = "song-picker";

  let searchRow = document.createElement("div");
  searchRow.className = "song-picker__row";

  pickerSearchInput = document.createElement("input");
  pickerSearchInput.type = "text";
  pickerSearchInput.className = "song-picker__search";
  pickerSearchInput.placeholder = "Buscar acorde…";
  pickerSearchInput.setAttribute("autocomplete", "off");
  pickerSearchInput.addEventListener("input", pickerRefresh);
  searchRow.appendChild(pickerSearchInput);

  let newChordBtn = document.createElement("button");
  newChordBtn.type = "button";
  newChordBtn.className = "song-picker__add";
  newChordBtn.textContent = "+";
  newChordBtn.addEventListener("click", function () {
    chordModalOpen();
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
  let query = pickerSearchInput.value.trim().toLowerCase();
  let chords = loadChords();
  pickerListEl.innerHTML = "";
  let found = 0;
  for (let i = 0; i < chords.length; i++) {
    if (query && chords[i].name.toLowerCase().indexOf(query) === -1) continue;
    found++;
    let item = document.createElement("button");
    item.type = "button";
    item.className = "song-picker__item";
    if (pickerSelectedName === chords[i].name) item.classList.add("is-selected");
    item.textContent = chords[i].name;
    item.setAttribute("data-name", chords[i].name);
    item.addEventListener("click", pickerSelect);
    pickerListEl.appendChild(item);
  }
  if (found === 0) {
    let empty = document.createElement("p");
    empty.className = "song-picker__empty";
    empty.textContent = "No hay acordes. Crea uno con +";
    pickerListEl.appendChild(empty);
  }
}

function pickerSelect(e) {
  let name = e.currentTarget.getAttribute("data-name");
  pickerSelectedName = name;
  let items = pickerListEl.querySelectorAll(".song-picker__item");
  for (let i = 0; i < items.length; i++) {
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

  let closeBtn = document.createElement("button");
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

  let removeBtn = document.createElement("button");
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

  let replaceBtn = document.createElement("button");
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
  let chordData = findChordByName(chordName);
  previewDiagramEl.innerHTML = "";
  if (chordData) {
    renderChordDiagram(previewDiagramEl, {
      name: chordData.name,
      strings: chordData.strings,
      startFret: computeChordDisplayStartFret(chordData.strings)
    });
  } else {
    let fallback = document.createElement("p");
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

function songDeleteFromView() {
  let songs = loadSongs();
  if (songEditIndex === null || songEditIndex < 0 || songEditIndex >= songs.length) return;
  songDeleteModalOpen(songs[songEditIndex].title, songEditIndex);
}

let songDeletePendingIndex = null;

function songDeleteModalOpen(title, storageIndex) {
  songDeletePendingIndex = storageIndex;
  let backdrop = document.getElementById("song-delete-modal-backdrop");
  let dialog = document.getElementById("song-delete-modal");
  let text = document.getElementById("song-delete-modal-text");
  if (!backdrop || !dialog || !text) return;
  text.textContent = "¿Seguro que quieres eliminar " + title + "?";
  backdrop.classList.add("is-open");
  backdrop.setAttribute("aria-hidden", "false");
  dialog.classList.add("is-open");
  dialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("song-delete-modal-open");
}

function songDeleteModalClose() {
  songDeletePendingIndex = null;
  let backdrop = document.getElementById("song-delete-modal-backdrop");
  let dialog = document.getElementById("song-delete-modal");
  if (!backdrop || !dialog) return;
  backdrop.classList.remove("is-open");
  backdrop.setAttribute("aria-hidden", "true");
  dialog.classList.remove("is-open");
  dialog.setAttribute("aria-hidden", "true");
  document.body.classList.remove("song-delete-modal-open");
}

function songDeleteModalConfirm() {
  if (songDeletePendingIndex !== null) {
    deleteSongAt(songDeletePendingIndex);
    buildSongLists();
    if (typeof chordyShowNotification === "function") {
      chordyShowNotification("Chordy", "Canción eliminada", "chordy-song");
    }
  }
  songDeleteModalClose();
  songModalClose();
}

function songDeleteModalInit() {
  let delBackdrop = document.getElementById("song-delete-modal-backdrop");
  let btnCancel = document.getElementById("song-delete-cancel");
  let btnConfirm = document.getElementById("song-delete-confirm");

  if (btnCancel) {
    btnCancel.addEventListener("click", songDeleteModalClose);
  }
  if (btnConfirm) {
    btnConfirm.addEventListener("click", songDeleteModalConfirm);
  }
  if (delBackdrop) {
    delBackdrop.addEventListener("click", songDeleteModalClose);
  }
}

function songModalEditFromView() {
  let songs = loadSongs();
  if (songEditIndex === null || songEditIndex < 0 || songEditIndex >= songs.length) return;
  let song = songs[songEditIndex];
  songTitleInput.value = song.title;
  songAlbumInput.value = song.album || "";
  songArtistInput.value = song.artist;
  songFormAlbumImage = song.albumImage || "";
  songLyricsArea.value = song.lines.join("\n");
  songFormManual.title = true;
  songFormManual.album = true;
  songFormManual.artist = true;
  songFormSyncTrash("title");
  songFormSyncTrash("album");
  songFormSyncTrash("artist");
  if (songTitleDropdown) {
    songTitleDropdown.innerHTML = "";
    songTitleDropdown.hidden = true;
  }
  if (songArtistDropdown) {
    songArtistDropdown.innerHTML = "";
    songArtistDropdown.hidden = true;
  }
  if (songModalStep1Title) songModalStep1Title.textContent = "Editar canción";
  songModalViewStep.hidden = true;
  songModalStep2.hidden = true;
  songModalStep1.hidden = false;
  songTitleInput.focus();
}

function songRefreshLearnedBtn(learned) {
  if (!viewLearnedBtn) return;
  viewLearnedBtn.textContent = learned
    ? "Me olvidé esta canción"
    : "Marcar como aprendida";
  viewLearnedBtn.setAttribute("aria-pressed", learned ? "true" : "false");
}

function songToggleLearnedFromView() {
  if (songEditIndex === null) return;
  let songs = loadSongs();
  if (songEditIndex < 0 || songEditIndex >= songs.length) return;
  let song = songs[songEditIndex];
  let learned = !song.learned;
  let updated = {
    title: song.title,
    album: song.album || "",
    artist: song.artist || "",
    albumImage: song.albumImage || "",
    lines: song.lines.slice(),
    chords: songCopyChords(song.chords),
    learned: learned
  };
  if (song.pendingSync) {
    updated.pendingSync = true;
  }
  updateSongAt(songEditIndex, updated);
  buildSongLists();
  songModalClose();
}

function songModalOpenView(index) {
  let songs = loadSongs();
  if (index < 0 || index >= songs.length) return;
  if (!songModalReady) return;
  chordyCloseFabMenu();

  let song = songs[index];
  songEditIndex = index;

  songModalStep1.hidden = true;
  songModalStep2.hidden = true;
  songModalViewStep.hidden = false;

  viewTitleEl.textContent = song.title;
  viewAlbumEl.textContent = song.album || "";
  viewArtistEl.textContent = song.artist;
  viewLinesEl.innerHTML = "";

  for (let i = 0; i < song.lines.length; i++) {
    let lineText = song.lines[i];
    let lineChords = song.chords[i] || [];
    let lineDiv = document.createElement("div");
    lineDiv.className = "song-view__line";

    if (lineChords.length > 0) {
      lineDiv.appendChild(buildChordElements(lineText, lineChords));
    }

    let textDiv = document.createElement("div");
    textDiv.className = "song-view__text";
    textDiv.textContent = lineText;
    lineDiv.appendChild(textDiv);
    viewLinesEl.appendChild(lineDiv);
  }

  songRefreshLearnedBtn(!!song.learned);
  showSongModal();
}

function buildChordElements(text, chords) {
  let row = document.createElement("div");
  row.className = "song-view__chords";
  let sorted = chords.slice().sort(function (a, b) {
    return a.pos - b.pos;
  });
  let cursor = 0;
  for (let i = 0; i < sorted.length; i++) {
    let gap = sorted[i].pos - cursor;
    if (gap < 1 && i > 0) gap = 1;
    let span = document.createElement("span");
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
  songDeleteModalInit();
  window.addEventListener("offline", songOnBrowserOffline);
  window.addEventListener("online", songOnBrowserOnline);
  let btns = document.querySelectorAll(".js-fab-open-song-modal");
  for (let i = 0; i < btns.length; i++) {
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

chordyOnReady(initSongModal);


let currentSortMode = "az";

let SORT_LABELS = {
  az: "A · Z",
  za: "Z · A",
  "artist-az": "Por artista (A-Z)",
  "artist-za": "Por artista (Z-A)",
};

function initSongSort() {
  let dropdown = document.getElementById("song-sort");
  if (!dropdown) return;

  let trigger = document.getElementById("song-sort-trigger");
  let menu = document.getElementById("song-sort-list");
  let label = document.getElementById("song-sort-label");
  let options = menu ? menu.querySelectorAll(".sort-dropdown__option") : [];
  if (!trigger || !menu || !label || !options.length) return;

  function setOpen(isOpen) {
    dropdown.classList.toggle("is-open", isOpen);
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menu.hidden = !isOpen;
  }

  function selectValue(value) {
    if (!SORT_LABELS[value]) return;
    currentSortMode = value;
    label.textContent = SORT_LABELS[value];
    for (let i = 0; i < options.length; i++) {
      let selected = options[i].getAttribute("data-value") === value;
      options[i].classList.toggle("is-selected", selected);
      options[i].setAttribute("aria-selected", selected ? "true" : "false");
    }
    setOpen(false);
    buildSongLists();
  }

  trigger.addEventListener("click", function () {
    setOpen(!dropdown.classList.contains("is-open"));
  });

  for (let o = 0; o < options.length; o++) {
    options[o].addEventListener("click", function (e) {
      selectValue(e.currentTarget.getAttribute("data-value"));
    });
  }

  document.addEventListener("click", function (e) {
    if (!dropdown.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (!dropdown.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      setOpen(false);
      trigger.focus();
    }
  });
}

function compareStrings(a, b) {
  let ta = String(a).toLowerCase();
  let tb = String(b).toLowerCase();
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  return 0;
}

function songCardEscape(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSongCard(storageIndex, song) {
  let cover = "";
  if (song.albumImage) {
    cover =
      '<img class="card__cover" src="' +
      songCardEscape(song.albumImage) +
      '" alt="">';
  } else {
    cover =
      '<div class="card__cover card__cover--empty" aria-hidden="true">' +
      '<img class="card__cover-logo" src="logo.png" alt="" width="52" height="52" decoding="async">' +
      "</div>";
  }
  let album = song.album || "";
  let line1 =
    songCardEscape(song.title) +
    ' <span class="card__sep">|</span> ' +
    songCardEscape(album);
  let line2 = songCardEscape(song.artist || "");
  let syncBtn = "";
  if (song.pendingSync) {
    let syncIcon = chordyIcon("arrow-repeat", "card__sync-btn__icon");
    syncBtn =
      '<button type="button" class="card__sync-btn js-song-sync" data-song-idx="' +
      storageIndex +
      '">' +
      syncIcon +
      "<span>Sincronizar</span></button>";
  }
  let learnedClass = song.learned ? " card--song-learned" : "";
  return (
    '<article class="card card--song js-song-card' +
    learnedClass +
    '" data-song-idx="' +
    storageIndex +
    '">' +
    '<div class="card__row">' +
    cover +
    '<div class="card__body">' +
    '<p class="card__title">' +
    line1 +
    "</p>" +
    '<p class="card__meta">' +
    line2 +
    "</p>" +
    "</div></div>" +
    syncBtn +
    "</article>"
  );
}

function bindSongCards() {
  let allCards = document.querySelectorAll(".js-song-card");
  for (let c = 0; c < allCards.length; c++) {
    allCards[c].addEventListener("click", onSongCardClick);
  }
  bindSongSyncButtons();
}

function compareStringsReverse(a, b) {
  return compareStrings(b, a);
}

function buildSongArtistGroupHtml(artistName, entries, songs) {
  let sortedEntries = entries.slice().sort(function (a, b) {
    return compareStrings(a.title, b.title);
  });
  let html = '<section class="song-list-group">';
  html +=
    '<h2 class="song-list-group__label">' +
    songCardEscape(artistName || "Sin artista") +
    "</h2>";
  html += '<div class="song-list-group__items">';
  for (let t = 0; t < sortedEntries.length; t++) {
    html += buildSongCard(sortedEntries[t].idx, songs[sortedEntries[t].idx]);
  }
  html += "</div></section>";
  return html;
}

function buildSongLists() {
  let listEl = document.getElementById("list-songs");
  if (!listEl) return;

  let songs = loadSongs();

  if (songs.length === 0) {
    listEl.innerHTML = '<p class="empty-state">No hay canciones todavía</p>';
    return;
  }

  let indexed = [];
  for (let i = 0; i < songs.length; i++) {
    indexed.push({ idx: i, title: songs[i].title, artist: songs[i].artist || "" });
  }

  if (currentSortMode === "artist-az" || currentSortMode === "artist-za") {
    let byArtist = {};
    for (let j = 0; j < indexed.length; j++) {
      let artistKey = indexed[j].artist || "Sin artista";
      if (!byArtist[artistKey]) byArtist[artistKey] = [];
      byArtist[artistKey].push(indexed[j]);
    }

    let artistNames = Object.keys(byArtist);
    artistNames.sort(
      currentSortMode === "artist-za" ? compareStringsReverse : compareStrings
    );

    let artistHtml = "";
    for (let k = 0; k < artistNames.length; k++) {
      artistHtml += buildSongArtistGroupHtml(
        artistNames[k],
        byArtist[artistNames[k]],
        songs
      );
    }
    listEl.innerHTML = artistHtml;
    bindSongCards();
    return;
  }

  indexed.sort(function (a, b) {
    let cmp = compareStrings(a.title, b.title);
    return currentSortMode === "za" ? -cmp : cmp;
  });

  let html = "";
  for (let a = 0; a < indexed.length; a++) {
    html += buildSongCard(indexed[a].idx, songs[indexed[a].idx]);
  }
  listEl.innerHTML = html;
  bindSongCards();
}

function onSongCardClick(e) {
  if (e.target.closest(".js-song-sync")) return;
  let idx = parseInt(e.currentTarget.getAttribute("data-song-idx"), 10);
  if (isNaN(idx)) return;
  songModalOpenView(idx);
}

function initSongsPage() {
  initSongSort();
  buildSongLists();
}

function startSongsPage() {
  chordyStorageReady.then(initSongsPage);
}

chordyOnReady(startSongsPage);
