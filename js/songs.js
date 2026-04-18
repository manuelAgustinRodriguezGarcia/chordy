function switchSongTab(mode) {
  var btnAz = document.getElementById("tab-az");
  var btnArtist = document.getElementById("tab-artist");
  var panelAz = document.getElementById("panel-az");
  var panelArtist = document.getElementById("panel-artist");
  if (!btnAz || !btnArtist || !panelAz || !panelArtist) return;
  var isAz = mode === "az";
  btnAz.classList.toggle("is-active", isAz);
  btnArtist.classList.toggle("is-active", !isAz);
  panelAz.hidden = !isAz;
  panelArtist.hidden = isAz;
  btnAz.setAttribute("aria-selected", isAz ? "true" : "false");
  btnArtist.setAttribute("aria-selected", isAz ? "false" : "true");
}

function initSongTabs() {
  var btnAz = document.getElementById("tab-az");
  var btnArtist = document.getElementById("tab-artist");
  if (!btnAz || !btnArtist) return;
  btnAz.addEventListener("click", function () {
    switchSongTab("az");
  });
  btnArtist.addEventListener("click", function () {
    switchSongTab("artist");
  });
}

function compareStrings(a, b) {
  var ta = String(a).toLowerCase();
  var tb = String(b).toLowerCase();
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  return 0;
}

function buildSongCard(storageIndex, title, meta) {
  return '<article class="card js-song-card" data-song-idx="' +
    storageIndex + '" style="cursor:pointer">' +
    '<p class="card__title">' + title + '</p>' +
    '<p class="card__meta">' + meta + '</p>' +
    '</article>';
}

function buildSongLists() {
  var listAz = document.getElementById("list-az");
  var listArtist = document.getElementById("list-artist");
  if (!listAz || !listArtist) return;

  var songs = loadSongs();

  if (songs.length === 0) {
    listAz.innerHTML = '<p class="empty-state">No hay canciones todavía</p>';
    listArtist.innerHTML = '<p class="empty-state">No hay canciones todavía</p>';
    return;
  }

  var indexed = [];
  for (var i = 0; i < songs.length; i++) {
    indexed.push({ idx: i, title: songs[i].title, artist: songs[i].artist });
  }

  indexed.sort(function (a, b) {
    return compareStrings(a.title, b.title);
  });

  var azHtml = "";
  for (var a = 0; a < indexed.length; a++) {
    azHtml += buildSongCard(indexed[a].idx, indexed[a].title, indexed[a].artist);
  }
  listAz.innerHTML = azHtml;

  var byArtist = {};
  for (var j = 0; j < indexed.length; j++) {
    var artist = indexed[j].artist;
    if (!byArtist[artist]) byArtist[artist] = [];
    byArtist[artist].push(indexed[j]);
  }

  var artistNames = Object.keys(byArtist);
  artistNames.sort(compareStrings);

  var artistHtml = "";
  for (var k = 0; k < artistNames.length; k++) {
    var name = artistNames[k];
    var group = byArtist[name];
    var firstIdx = group[0].idx;
    var titles = [];
    for (var t = 0; t < group.length; t++) titles.push(group[t].title);
    artistHtml += buildSongCard(firstIdx, name, titles.join(", "));
  }
  listArtist.innerHTML = artistHtml;

  var allCards = document.querySelectorAll(".js-song-card");
  for (var c = 0; c < allCards.length; c++) {
    allCards[c].addEventListener("click", onSongCardClick);
  }
}

function onSongCardClick(e) {
  var idx = parseInt(e.currentTarget.getAttribute("data-song-idx"), 10);
  if (isNaN(idx)) return;
  if (typeof songModalOpenView === "function") songModalOpenView(idx);
}

function initSongsPage() {
  initSongTabs();
  buildSongLists();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSongsPage);
} else {
  initSongsPage();
}
