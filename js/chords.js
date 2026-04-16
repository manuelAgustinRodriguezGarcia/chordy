function chordSearchNormalize(s) {
  return (s || "").toLowerCase().trim();
}

function chordListPrepareDecorated() {
  var raw = loadChords();
  var decorated = [];
  for (var i = 0; i < raw.length; i++) {
    decorated.push({ chord: raw[i], storageIndex: i });
  }
  decorated.sort(function (a, b) {
    return a.chord.name.localeCompare(b.chord.name, "es", { sensitivity: "base" });
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
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons();
    }
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
    btnEdit.innerHTML = '<i data-lucide="pencil"></i>';
    btnEdit.setAttribute("data-idx", String(storageIndex));
    btnEdit.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var idx = parseInt(ev.currentTarget.getAttribute("data-idx"), 10);
      var ch = loadChords()[idx];
      if (ch && typeof chordModalOpenForEdit === "function") {
        chordModalOpenForEdit(idx, ch);
      }
    });

    var btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "chord-card__action chord-card__action--delete";
    btnDel.setAttribute("aria-label", "Eliminar " + c.name);
    btnDel.innerHTML = '<i data-lucide="trash-2"></i>';
    btnDel.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var idx = parseInt(ev.currentTarget.getAttribute("data-idx"), 10);
      var nm = ev.currentTarget.getAttribute("data-name") || "";
      chordDeleteModalOpen(nm, idx);
    });
    btnDel.setAttribute("data-idx", String(storageIndex));
    btnDel.setAttribute("data-name", c.name);

    toolbar.appendChild(btnEdit);
    toolbar.appendChild(btnDel);
    article.appendChild(toolbar);

    var diagramHost = document.createElement("div");
    diagramHost.className = "chord-card__diagram";
    renderChordDiagram(diagramHost, c);

    article.appendChild(diagramHost);
    root.appendChild(article);
  }
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    buildChordCards();
    chordSearchInit();
  });
} else {
  buildChordCards();
  chordSearchInit();
}
