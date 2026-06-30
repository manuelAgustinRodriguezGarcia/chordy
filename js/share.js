let CHORDY_EXPORT_MARKER_START = "---CHORDY-LIBRARY-v1---";
let CHORDY_EXPORT_MARKER_END = "---END-CHORDY---";

function chordyShareStatus(text) {
  let el = document.getElementById("library-tools-status");
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
  window.setTimeout(function () {
    el.hidden = true;
  }, 3000);
}

function chordyShareCopyText(text, doneMessage) {
  let msg = doneMessage || "Contenido copiado para compartir";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () {
      chordyShareStatus(msg);
      if (typeof chordyShowNotification === "function") {
        chordyShowNotification("Chordy", msg, "chordy-share-copy");
      }
    });
  }
  chordyShareStatus(msg);
  return Promise.resolve();
}

function chordyShareDeliver(text, title) {
  if (navigator.share) {
    return navigator
      .share({ title: title || "Chordy", text: text })
      .catch(function () {
        return chordyShareCopyText(text, "Biblioteca copiada para compartir");
      });
  }
  return chordyShareCopyText(text, "Biblioteca copiada para compartir");
}

function chordyExportSong(song) {
  let lines = Array.isArray(song.lines) ? song.lines.slice() : [];
  let chords = [];
  if (Array.isArray(song.chords)) {
    for (let i = 0; i < song.chords.length; i++) {
      let row = song.chords[i] || [];
      let outRow = [];
      for (let c = 0; c < row.length; c++) {
        outRow.push({ name: row[c].name, pos: row[c].pos });
      }
      chords.push(outRow);
    }
  }
  return {
    title: song.title || "",
    artist: song.artist || "",
    album: song.album || "",
    albumImage: song.albumImage || "",
    lines: lines,
    chords: chords,
    learned: !!song.learned,
  };
}

function chordyExportChord(chord) {
  return {
    name: chord.name,
    strings: chord.strings ? chord.strings.slice() : [],
  };
}

function chordyBuildLibraryExportPayload(songs, chords) {
  let songOut = [];
  for (let i = 0; i < songs.length; i++) {
    songOut.push(chordyExportSong(songs[i]));
  }
  let chordOut = [];
  for (let i = 0; i < chords.length; i++) {
    chordOut.push(chordyExportChord(chords[i]));
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    songs: songOut,
    chords: chordOut,
  };
}

function chordyBuildLibraryShareText(songs, chords) {
  let payload = chordyBuildLibraryExportPayload(songs, chords);
  let json = JSON.stringify(payload);
  let lines = [
    "Chordy - Biblioteca",
    songs.length + " canción" + (songs.length === 1 ? "" : "es") + ", " + chords.length + " acorde" + (chords.length === 1 ? "" : "s"),
    "Pegá el bloque siguiente en Importar lista de otra instalación de Chordy.",
    "",
    CHORDY_EXPORT_MARKER_START,
    json,
    CHORDY_EXPORT_MARKER_END,
  ];
  return lines.join("\n");
}

function chordyShareLibrary() {
  if (chordyHasPendingSyncSongs()) {
    chordyShareSyncWarnOpen();
    return;
  }
  chordyShareLibraryProceed();
}

function chordyShareLibraryProceed() {
  let songs = loadSongs();
  let chords = loadChords();
  if (!songs.length && !chords.length) {
    chordyShareStatus("No hay contenido para compartir");
    if (typeof chordyShowNotification === "function") {
      chordyShowNotification("Chordy", "No hay contenido para compartir", "chordy-share-empty");
    }
    return;
  }
  let text = chordyBuildLibraryShareText(songs, chords);
  chordyShareDeliver(text, "Chordy - Biblioteca");
}

window.chordyShareLibrary = chordyShareLibrary;
window.chordyShareStatus = chordyShareStatus;
window.CHORDY_EXPORT_MARKER_START = CHORDY_EXPORT_MARKER_START;
window.CHORDY_EXPORT_MARKER_END = CHORDY_EXPORT_MARKER_END;
window.chordyBuildLibraryExportPayload = chordyBuildLibraryExportPayload;

let shareSyncWarnBackdrop = null;
let shareSyncWarnModal = null;

function chordyHasPendingSyncSongs() {
  let songs = loadSongs();
  for (let i = 0; i < songs.length; i++) {
    if (songs[i].pendingSync) return true;
  }
  return false;
}

function chordyShareSyncWarnOpen() {
  if (!shareSyncWarnModal || !shareSyncWarnBackdrop) return;
  shareSyncWarnBackdrop.classList.add("is-open");
  shareSyncWarnModal.classList.add("is-open");
  shareSyncWarnBackdrop.setAttribute("aria-hidden", "false");
  shareSyncWarnModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("library-import-open");
}

function chordyShareSyncWarnClose() {
  if (!shareSyncWarnModal || !shareSyncWarnBackdrop) return;
  shareSyncWarnBackdrop.classList.remove("is-open");
  shareSyncWarnModal.classList.remove("is-open");
  shareSyncWarnBackdrop.setAttribute("aria-hidden", "true");
  shareSyncWarnModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("library-import-open");
}

function chordyShareSyncWarnBuildDom() {
  shareSyncWarnBackdrop = document.createElement("div");
  shareSyncWarnBackdrop.className = "chord-delete-modal-backdrop";
  shareSyncWarnBackdrop.setAttribute("aria-hidden", "true");
  shareSyncWarnBackdrop.addEventListener("click", chordyShareSyncWarnClose);

  shareSyncWarnModal = document.createElement("div");
  shareSyncWarnModal.className = "chord-delete-modal";
  shareSyncWarnModal.setAttribute("role", "alertdialog");
  shareSyncWarnModal.setAttribute("aria-modal", "true");
  shareSyncWarnModal.setAttribute("aria-labelledby", "share-sync-warn-text");
  shareSyncWarnModal.setAttribute("aria-hidden", "true");

  let text = document.createElement("p");
  text.id = "share-sync-warn-text";
  text.className = "chord-delete-modal__text";
  text.textContent = "Antes de compartir la lista sincronice todas las canciones de la lista.";

  let actions = document.createElement("div");
  actions.className = "chord-delete-modal__actions";

  let closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "chord-delete-modal__btn chord-delete-modal__btn--ghost";
  closeBtn.textContent = "Cerrar";
  closeBtn.addEventListener("click", chordyShareSyncWarnClose);
  actions.appendChild(closeBtn);

  shareSyncWarnModal.appendChild(text);
  shareSyncWarnModal.appendChild(actions);
  document.body.appendChild(shareSyncWarnBackdrop);
  document.body.appendChild(shareSyncWarnModal);
}

chordyOnReady(function () {
  chordyShareSyncWarnBuildDom();
  let shareBtn = document.getElementById("library-share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", chordyShareLibrary);
  }
});
