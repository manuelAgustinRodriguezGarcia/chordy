var CHORDY_DB_NAME = "chordy";
var CHORDY_DB_VERSION = 1;
var CHORDY_META_STORE = "meta";

var chordyDb = null;
var chordySongsCache = [];
var chordyChordsCache = [];
var chordyArtistsCache = [];

function artistNorm(name) {
  return (name || "").trim().toUpperCase();
}

function chordyDbOpen() {
  return new Promise(function (resolve, reject) {
    if (chordyDb) {
      resolve(chordyDb);
      return;
    }
    var req = indexedDB.open(CHORDY_DB_NAME, CHORDY_DB_VERSION);
    req.onerror = function () {
      reject(req.error);
    };
    req.onsuccess = function () {
      chordyDb = req.result;
      resolve(chordyDb);
    };
    req.onupgradeneeded = function (event) {
      var database = event.target.result;
      if (!database.objectStoreNames.contains(CHORDY_META_STORE)) {
        database.createObjectStore(CHORDY_META_STORE, { keyPath: "key" });
      }
    };
  });
}

function chordyDbGet(key) {
  return chordyDbOpen().then(function (database) {
    return new Promise(function (resolve, reject) {
      var tx = database.transaction(CHORDY_META_STORE, "readonly");
      var req = tx.objectStore(CHORDY_META_STORE).get(key);
      req.onsuccess = function () {
        var row = req.result;
        resolve(row ? row.value : null);
      };
      req.onerror = function () {
        reject(req.error);
      };
    });
  });
}

function chordyDbSet(key, value) {
  return chordyDbOpen().then(function (database) {
    return new Promise(function (resolve, reject) {
      var tx = database.transaction(CHORDY_META_STORE, "readwrite");
      var req = tx.objectStore(CHORDY_META_STORE).put({ key: key, value: value });
      req.onsuccess = function () {
        resolve();
      };
      req.onerror = function () {
        reject(req.error);
      };
    });
  });
}

function chordyReadLegacyList(storageKey) {
  try {
    var raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    var list = JSON.parse(raw);
    return Array.isArray(list) ? list : null;
  } catch (e) {
    return null;
  }
}

function chordyMigrateFromLocalStorage() {
  if (localStorage.getItem("chordy_migrated") === "1") {
    return Promise.resolve();
  }

  var songs = chordyReadLegacyList("chordy_songs");
  var chords = chordyReadLegacyList("chordy_chords");
  if (!chords) {
    chords = chordyReadLegacyList("acordy_chords");
  }

  var writes = [];
  if (songs && songs.length) {
    writes.push(chordyDbSet("songs", songs));
  }
  if (chords && chords.length) {
    writes.push(chordyDbSet("chords", chords));
  }

  return Promise.all(writes).then(function () {
    localStorage.setItem("chordy_migrated", "1");
  });
}

function initChordyStorage() {
  return chordyDbOpen()
    .then(function () {
      return chordyMigrateFromLocalStorage();
    })
    .then(function () {
      return chordyDbGet("songs");
    })
    .then(function (songs) {
      chordySongsCache = Array.isArray(songs) ? songs : [];
      return chordyDbGet("chords");
    })
    .then(function (chords) {
      chordyChordsCache = Array.isArray(chords) ? chords : [];
      return chordyDbGet("artists");
    })
    .then(function (artists) {
      chordyArtistsCache = Array.isArray(artists) ? artists : [];
      chordySyncArtistsFromSongs();
    });
}

function chordyPersistSongs() {
  return chordyDbSet("songs", chordySongsCache);
}

function chordyPersistChords() {
  return chordyDbSet("chords", chordyChordsCache);
}

function chordyPersistArtists() {
  return chordyDbSet("artists", chordyArtistsCache);
}

function chordySyncArtistsFromSongs() {
  for (var i = 0; i < chordySongsCache.length; i++) {
    if (chordySongsCache[i].artist) {
      addArtist(chordySongsCache[i].artist);
    }
  }
}

function loadArtists() {
  return chordyArtistsCache.slice();
}

function findArtistExact(query) {
  var q = artistNorm(query);
  if (!q) return null;
  for (var i = 0; i < chordyArtistsCache.length; i++) {
    if (artistNorm(chordyArtistsCache[i]) === q) {
      return chordyArtistsCache[i];
    }
  }
  return null;
}

function filterArtists(query) {
  var q = artistNorm(query);
  if (!q) return [];
  var out = [];
  for (var i = 0; i < chordyArtistsCache.length; i++) {
    if (artistNorm(chordyArtistsCache[i]).indexOf(q) !== -1) {
      out.push(chordyArtistsCache[i]);
    }
  }
  return out;
}

function addArtist(name) {
  name = (name || "").trim();
  if (!name || findArtistExact(name)) return;
  chordyArtistsCache.push(name);
  chordyPersistArtists();
}

var chordyStorageReady = initChordyStorage();

function loadSongs() {
  return chordySongsCache.slice();
}

function saveSongs(list) {
  chordySongsCache = list.slice();
  chordyPersistSongs();
}

function addSong(song) {
  var list = loadSongs();
  list.push(song);
  saveSongs(list);
  if (song.artist) addArtist(song.artist);
}

function updateSongAt(index, song) {
  var list = loadSongs();
  if (index < 0 || index >= list.length) return false;
  list[index] = song;
  saveSongs(list);
  if (song.artist) addArtist(song.artist);
  return true;
}

function deleteSongAt(index) {
  var list = loadSongs();
  if (index < 0 || index >= list.length) return false;
  list.splice(index, 1);
  saveSongs(list);
  return true;
}

function defaultChords() {
  return [{ name: "D", strings: ["none", "none", "air", 2, 3, 2] }];
}

function isValidChord(item) {
  if (!item || typeof item.name !== "string" || !item.name) {
    return false;
  }
  if (!item.strings || item.strings.length !== 6) {
    return false;
  }
  return true;
}

function loadChords() {
  var list = chordyChordsCache;
  if (!list.length) {
    return defaultChords();
  }
  var out = [];
  for (var i = 0; i < list.length; i++) {
    if (isValidChord(list[i])) {
      out.push(list[i]);
    }
  }
  if (!out.length) {
    return defaultChords();
  }
  return out.slice();
}

function saveChords(list) {
  chordyChordsCache = list.slice();
  chordyPersistChords();
}

function addChord(chord) {
  if (!isValidChord(chord)) {
    return;
  }
  var list = chordyChordsCache.slice();
  list.push(chord);
  saveChords(list);
}

function updateChordAt(index, chord) {
  if (!isValidChord(chord)) {
    return false;
  }
  var list = chordyChordsCache.slice();
  if (index < 0 || index >= list.length) {
    return false;
  }
  list[index] = chord;
  saveChords(list);
  return true;
}

function deleteChordAt(index) {
  var list = chordyChordsCache.slice();
  if (index < 0 || index >= list.length) {
    return false;
  }
  list.splice(index, 1);
  if (!list.length) {
    list = defaultChords();
  }
  saveChords(list);
  return true;
}
