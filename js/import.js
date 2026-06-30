let importBackdrop = null;
let importModal = null;
let importTextarea = null;
let importPreviewEl = null;
let importHintEl = null;

function chordyImportIsOnline() {
  return navigator.onLine;
}

function chordyImportValidChord(item) {
  if (!item || typeof item.name !== "string" || !item.name.trim()) {
    return false;
  }
  if (!item.strings || item.strings.length !== 6) {
    return false;
  }
  return true;
}

function chordyImportValidSong(item) {
  if (!item || typeof item.title !== "string" || !item.title.trim()) {
    return false;
  }
  if (typeof item.artist !== "string" || !item.artist.trim()) {
    return false;
  }
  if (typeof item.album !== "string" || !item.album.trim()) {
    return false;
  }
  if (!Array.isArray(item.lines) || !Array.isArray(item.chords)) {
    return false;
  }
  return true;
}

function chordyImportNormalizeSong(raw) {
  let chords = [];
  for (let i = 0; i < raw.chords.length; i++) {
    let row = raw.chords[i] || [];
    let outRow = [];
    for (let c = 0; c < row.length; c++) {
      let slot = row[c];
      if (!slot || typeof slot.name !== "string") continue;
      outRow.push({ name: slot.name, pos: typeof slot.pos === "number" ? slot.pos : 0 });
    }
    chords.push(outRow);
  }
  let song = {
    title: raw.title.trim(),
    artist: raw.artist.trim(),
    album: raw.album.trim(),
    albumImage: raw.albumImage || "",
    lines: raw.lines.slice(),
    chords: chords,
    learned: !!raw.learned,
  };
  if (!song.albumImage && chordyImportIsOnline()) {
    song.pendingSync = true;
  }
  return song;
}

function chordyImportNormalizeChord(raw) {
  return {
    name: raw.name.trim(),
    strings: raw.strings.slice(),
  };
}

function chordyImportNormName(name) {
  return (name || "").trim().toLowerCase();
}

function chordyImportSongNameExists(title, list) {
  let n = chordyImportNormName(title);
  if (!n) return false;
  for (let i = 0; i < list.length; i++) {
    if (chordyImportNormName(list[i].title) === n) return true;
  }
  return false;
}

function chordyImportChordNameExists(name, list) {
  let n = chordyImportNormName(name);
  if (!n) return false;
  for (let i = 0; i < list.length; i++) {
    if (chordyImportNormName(list[i].name) === n) return true;
  }
  return false;
}

function chordyImportFilterNewOnly(parsed) {
  let existingSongs = loadSongs();
  let existingChords = loadChords();
  let songs = [];
  let chords = [];
  let skippedDupSongs = 0;
  let skippedDupChords = 0;

  for (let i = 0; i < parsed.songs.length; i++) {
    let s = parsed.songs[i];
    if (chordyImportSongNameExists(s.title, existingSongs) || chordyImportSongNameExists(s.title, songs)) {
      skippedDupSongs++;
      continue;
    }
    songs.push(s);
  }

  for (let i = 0; i < parsed.chords.length; i++) {
    let c = parsed.chords[i];
    if (chordyImportChordNameExists(c.name, existingChords) || chordyImportChordNameExists(c.name, chords)) {
      skippedDupChords++;
      continue;
    }
    chords.push(c);
  }

  return {
    songs: songs,
    chords: chords,
    skippedSongs: parsed.skippedSongs,
    skippedChords: parsed.skippedChords,
    skippedDupSongs: skippedDupSongs,
    skippedDupChords: skippedDupChords,
  };
}

function chordyImportMergeChords(existing, imported) {
  let out = existing.slice();
  for (let i = 0; i < imported.length; i++) {
    let c = imported[i];
    if (chordyImportChordNameExists(c.name, out)) continue;
    out.push(c);
  }
  return out;
}

function chordyImportExtractJson(text) {
  let raw = (text || "").trim();
  if (!raw) return null;

  let startMarker = "---CHORDY-LIBRARY-v1---";
  let endMarker = "---END-CHORDY---";
  let startIdx = raw.indexOf(startMarker);
  if (startIdx !== -1) {
    let jsonStart = startIdx + startMarker.length;
    let endIdx = raw.indexOf(endMarker, jsonStart);
    let jsonText = endIdx !== -1 ? raw.slice(jsonStart, endIdx) : raw.slice(jsonStart);
    raw = jsonText.trim();
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function chordyImportParse(text) {
  let data = chordyImportExtractJson(text);
  if (!data || data.version !== 1) {
    return { ok: false, error: "No se reconoció un bloque de biblioteca Chordy válido." };
  }

  let songs = [];
  let chords = [];
  let skippedSongs = 0;
  let skippedChords = 0;

  if (Array.isArray(data.songs)) {
    for (let i = 0; i < data.songs.length; i++) {
      if (chordyImportValidSong(data.songs[i])) {
        songs.push(chordyImportNormalizeSong(data.songs[i]));
      } else {
        skippedSongs++;
      }
    }
  }

  if (Array.isArray(data.chords)) {
    for (let i = 0; i < data.chords.length; i++) {
      if (chordyImportValidChord(data.chords[i])) {
        chords.push(chordyImportNormalizeChord(data.chords[i]));
      } else {
        skippedChords++;
      }
    }
  }

  if (!songs.length && !chords.length) {
    return { ok: false, error: "No se encontraron canciones ni acordes válidos en el mensaje." };
  }

  return {
    ok: true,
    songs: songs,
    chords: chords,
    skippedSongs: skippedSongs,
    skippedChords: skippedChords,
  };
}

function chordyImportRenderPreview(parsed) {
  if (!importPreviewEl) return;
  importPreviewEl.innerHTML = "";

  let summary = document.createElement("p");
  summary.className = "library-import__summary";
  summary.textContent =
    parsed.songs.length +
    " canción" +
    (parsed.songs.length === 1 ? "" : "es") +
    " reconocida" +
    (parsed.songs.length === 1 ? "" : "s") +
    ", " +
    parsed.chords.length +
    " acorde" +
    (parsed.chords.length === 1 ? "" : "s");
  importPreviewEl.appendChild(summary);

  if (parsed.skippedSongs || parsed.skippedChords || parsed.skippedDupSongs || parsed.skippedDupChords) {
    let warn = document.createElement("p");
    warn.className = "library-import__warn";
    let parts = [];
    if (parsed.skippedSongs) parts.push(parsed.skippedSongs + " canción(es) inválida(s)");
    if (parsed.skippedChords) parts.push(parsed.skippedChords + " acorde(s) inválido(s)");
    if (parsed.skippedDupSongs) parts.push(parsed.skippedDupSongs + " canción(es) ya existente(s)");
    if (parsed.skippedDupChords) parts.push(parsed.skippedDupChords + " acorde(s) ya existente(s)");
    warn.textContent = parts.join(" · ");
    importPreviewEl.appendChild(warn);
  }

  if (parsed.songs.length) {
    let list = document.createElement("ul");
    list.className = "library-import__song-list";
    for (let i = 0; i < parsed.songs.length; i++) {
      let song = parsed.songs[i];
      let li = document.createElement("li");
      li.className = "library-import__song-item";

      if (song.albumImage) {
        let img = document.createElement("img");
        img.className = "library-import__cover";
        img.src = song.albumImage;
        img.alt = "";
        img.width = 48;
        img.height = 48;
        img.decoding = "async";
        li.appendChild(img);
      } else {
        let empty = document.createElement("div");
        empty.className = "library-import__cover library-import__cover--empty";
        empty.setAttribute("aria-hidden", "true");
        li.appendChild(empty);
      }

      let body = document.createElement("div");
      body.className = "library-import__song-body";
      let title = document.createElement("div");
      title.className = "library-import__song-title";
      title.textContent = song.title;
      let meta = document.createElement("div");
      meta.className = "library-import__song-meta";
      meta.textContent = song.artist + (song.album ? " · " + song.album : "");
      body.appendChild(title);
      body.appendChild(meta);
      li.appendChild(body);
      list.appendChild(li);
    }
    importPreviewEl.appendChild(list);
  }

  if (parsed.chords.length) {
    let chordList = document.createElement("div");
    chordList.className = "library-import__chord-list";
    let label = document.createElement("div");
    label.className = "library-import__chord-label";
    label.textContent = "Acordes incluidos";
    chordList.appendChild(label);
    let names = document.createElement("div");
    names.className = "library-import__chord-names";
    let chordNames = [];
    for (let i = 0; i < parsed.chords.length; i++) {
      chordNames.push(parsed.chords[i].name);
    }
    names.textContent = chordNames.join(", ");
    chordList.appendChild(names);
    importPreviewEl.appendChild(chordList);
  }

  importPreviewEl.hidden = false;
}

function chordyImportApply(parsed, mergeChords) {
  let addedSongs = 0;
  let addedChords = 0;

  if (parsed.songs.length) {
    let songs = loadSongs();
    for (let i = 0; i < parsed.songs.length; i++) {
      if (chordyImportSongNameExists(parsed.songs[i].title, songs)) continue;
      songs.push(parsed.songs[i]);
      addedSongs++;
    }
    if (addedSongs) saveSongs(songs);
  }

  if (parsed.chords.length) {
    if (mergeChords) {
      let next = chordyImportMergeChords(loadChords(), parsed.chords);
      addedChords = next.length - loadChords().length;
      if (addedChords > 0) saveChords(next);
    } else {
      saveChords(parsed.chords);
      addedChords = parsed.chords.length;
    }
  }

  if (typeof buildSongLists === "function") {
    buildSongLists();
  }

  if (typeof chordyShowNotification === "function" && (addedSongs || addedChords)) {
    chordyShowNotification(
      "Chordy",
      "Biblioteca importada: " + addedSongs + " canción(es), " + addedChords + " acorde(s)",
      "chordy-import"
    );
  }
}

function chordyImportOpen() {
  if (!importModal || !importBackdrop) return;
  if (importTextarea) importTextarea.value = "";
  if (importPreviewEl) {
    importPreviewEl.innerHTML = "";
    importPreviewEl.hidden = true;
  }
  if (importHintEl) {
    importHintEl.textContent = "";
    importHintEl.hidden = true;
  }
  importBackdrop.classList.add("is-open");
  importModal.classList.add("is-open");
  document.body.classList.add("library-import-open");
  if (importTextarea) importTextarea.focus();
}

function chordyImportClose() {
  if (!importModal || !importBackdrop) return;
  importBackdrop.classList.remove("is-open");
  importModal.classList.remove("is-open");
  document.body.classList.remove("library-import-open");
}

function chordyImportUpdateButton() {
  let btn = document.getElementById("library-import-btn");
  if (!btn) return;
  let online = chordyImportIsOnline();
  btn.disabled = !online;
  btn.title = online ? "" : "Necesitás conexión para importar";
  btn.setAttribute("aria-disabled", online ? "false" : "true");
}

function chordyImportFinish(parsed) {
  let mergeChords = false;
  if (parsed.chords.length) {
    mergeChords = window.confirm(
      "¿Combinar la lista de acordes importada con los acordes que ya tenés?\n\nAceptar = combinar\nCancelar = reemplazar solo con los importados"
    );
  }
  chordyImportApply(parsed, mergeChords);
  chordyImportClose();
  if (typeof chordyShareStatus === "function") {
    chordyShareStatus("Biblioteca importada correctamente");
  }
}

function chordyImportOnSubmit() {
  if (!chordyImportIsOnline()) {
    if (importHintEl) {
      importHintEl.textContent = "Sin conexión: no se puede importar la biblioteca.";
      importHintEl.hidden = false;
    }
    return;
  }

  let text = importTextarea ? importTextarea.value : "";
  let parsed = chordyImportParse(text);
  if (!parsed.ok) {
    if (importPreviewEl) {
      importPreviewEl.innerHTML = "";
      importPreviewEl.hidden = true;
    }
    if (importHintEl) {
      importHintEl.textContent = parsed.error;
      importHintEl.hidden = false;
    }
    return;
  }

  let filtered = chordyImportFilterNewOnly(parsed);
  if (!filtered.songs.length && !filtered.chords.length) {
    if (importPreviewEl) {
      importPreviewEl.innerHTML = "";
      importPreviewEl.hidden = true;
    }
    if (importHintEl) {
      importHintEl.textContent = "Todo el contenido ya está en tu biblioteca.";
      importHintEl.hidden = false;
    }
    return;
  }

  if (importHintEl) importHintEl.hidden = true;
  chordyImportRenderPreview(filtered);

  window.requestAnimationFrame(function () {
    chordyImportFinish(filtered);
  });
}

function chordyImportBuildDom() {
  importBackdrop = document.createElement("div");
  importBackdrop.className = "library-import-backdrop";
  importBackdrop.addEventListener("click", chordyImportClose);

  importModal = document.createElement("div");
  importModal.className = "library-import-modal";
  importModal.setAttribute("role", "dialog");
  importModal.setAttribute("aria-modal", "true");
  importModal.setAttribute("aria-labelledby", "library-import-title");

  let title = document.createElement("h2");
  title.id = "library-import-title";
  title.className = "library-import__title";
  title.textContent = "Importar lista";

  let desc = document.createElement("p");
  desc.className = "library-import__desc";
  desc.textContent = "Pegá el mensaje copiado con Compartir biblioteca.";

  importTextarea = document.createElement("textarea");
  importTextarea.className = "library-import__textarea";
  importTextarea.rows = 8;
  importTextarea.placeholder = "Pegá aquí el bloque Chordy...";
  importTextarea.setAttribute("aria-label", "Texto de biblioteca a importar");

  importHintEl = document.createElement("p");
  importHintEl.className = "library-import__hint";
  importHintEl.hidden = true;

  importPreviewEl = document.createElement("div");
  importPreviewEl.className = "library-import__preview";
  importPreviewEl.hidden = true;

  let actions = document.createElement("div");
  actions.className = "library-import__actions";

  let cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "library-import__btn library-import__btn--ghost";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", chordyImportClose);

  let submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "library-import__btn library-import__btn--primary";
  submitBtn.textContent = "Importar lista";
  submitBtn.addEventListener("click", chordyImportOnSubmit);

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);

  importModal.appendChild(title);
  importModal.appendChild(desc);
  importModal.appendChild(importTextarea);
  importModal.appendChild(importHintEl);
  importModal.appendChild(importPreviewEl);
  importModal.appendChild(actions);

  document.body.appendChild(importBackdrop);
  document.body.appendChild(importModal);
}

chordyOnReady(function () {
  chordyImportBuildDom();
  chordyImportUpdateButton();

  let btn = document.getElementById("library-import-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      if (!chordyImportIsOnline()) {
        if (typeof chordyShareStatus === "function") {
          chordyShareStatus("Sin conexión: no se puede importar");
        }
        return;
      }
      chordyImportOpen();
    });
  }

  window.addEventListener("online", chordyImportUpdateButton);
  window.addEventListener("offline", chordyImportUpdateButton);
});
