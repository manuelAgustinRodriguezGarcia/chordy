function switchSongTab(mode) {
  var btnAz = document.getElementById("tab-az");
  var btnArtist = document.getElementById("tab-artist");
  var panelAz = document.getElementById("panel-az");
  var panelArtist = document.getElementById("panel-artist");
  if (!btnAz || !btnArtist || !panelAz || !panelArtist) {
    return;
  }
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
  if (!btnAz || !btnArtist) {
    return;
  }
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
  if (ta < tb) {
    return -1;
  }
  if (ta > tb) {
    return 1;
  }
  return 0;
}

function buildSongLists() {
  var listAz = document.getElementById("list-az");
  var listArtist = document.getElementById("list-artist");
  if (!listAz || !listArtist) {
    return;
  }
  var songs = [
    { title: "Blackbird", artist: "The Beatles" },
    { title: "Fast Car", artist: "Tracy Chapman" },
    { title: "Hotel California", artist: "Eagles" },
    { title: "Hallelujah", artist: "Leonard Cohen" },
    { title: "Wonderwall", artist: "Oasis" }
  ];
  songs.sort(function (a, b) {
    return compareStrings(a.title, b.title);
  });
  var azHtml = "";
  for (var i = 0; i < songs.length; i++) {
    var s = songs[i];
    azHtml +=
      '<article class="card">' +
      '<p class="card__title">' +
      s.title +
      "</p>" +
      '<p class="card__meta">' +
      s.artist +
      "</p>" +
      "</article>";
  }
  listAz.innerHTML = azHtml;

  var byArtist = {};
  for (var j = 0; j < songs.length; j++) {
    var song = songs[j];
    if (!byArtist[song.artist]) {
      byArtist[song.artist] = [];
    }
    byArtist[song.artist].push(song.title);
  }
  var artistNames = Object.keys(byArtist);
  artistNames.sort(compareStrings);
  var artistHtml = "";
  for (var k = 0; k < artistNames.length; k++) {
    var name = artistNames[k];
    var titles = byArtist[name].slice();
    titles.sort(compareStrings);
    var titlesJoined = titles.join(", ");
    artistHtml +=
      '<article class="card">' +
      '<p class="card__title">' +
      name +
      "</p>" +
      '<p class="card__meta">' +
      titlesJoined +
      "</p>" +
      "</article>";
  }
  listArtist.innerHTML = artistHtml;
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
