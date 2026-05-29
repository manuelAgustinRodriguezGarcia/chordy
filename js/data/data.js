let CHORDY_DB_NAME = "chordy";
let CHORDY_DB_VERSION = 1;
let CHORDY_META_STORE = "meta";

let chordyDb = null;
let chordySongsCache = [];
let chordyChordsCache = [];
let chordyArtistsCache = [];

function artistNorm(name) {
  return (name || "").trim().toUpperCase();
}

function chordyDbOpen() {
  return new Promise(function (resolve, reject) {
    if (chordyDb) {
      resolve(chordyDb);
      return;
    }
    let req = indexedDB.open(CHORDY_DB_NAME, CHORDY_DB_VERSION);
    req.onerror = function () {
      reject(req.error);
    };
    req.onsuccess = function () {
      chordyDb = req.result;
      resolve(chordyDb);
    };
    req.onupgradeneeded = function (event) {
      let database = event.target.result;
      if (!database.objectStoreNames.contains(CHORDY_META_STORE)) {
        database.createObjectStore(CHORDY_META_STORE, { keyPath: "key" });
      }
    };
  });
}

function chordyDbGet(key) {
  return chordyDbOpen().then(function (database) {
    return new Promise(function (resolve, reject) {
      let tx = database.transaction(CHORDY_META_STORE, "readonly");
      let req = tx.objectStore(CHORDY_META_STORE).get(key);
      req.onsuccess = function () {
        let row = req.result;
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
      let tx = database.transaction(CHORDY_META_STORE, "readwrite");
      let req = tx.objectStore(CHORDY_META_STORE).put({ key: key, value: value });
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
    let raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    let list = JSON.parse(raw);
    return Array.isArray(list) ? list : null;
  } catch (e) {
    return null;
  }
}

function chordyMigrateFromLocalStorage() {
  if (localStorage.getItem("chordy_migrated") === "1") {
    return Promise.resolve();
  }

  let songs = chordyReadLegacyList("chordy_songs");
  let chords = chordyReadLegacyList("chordy_chords");
  if (!chords) {
    chords = chordyReadLegacyList("acordy_chords");
  }

  let writes = [];
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
  for (let i = 0; i < chordySongsCache.length; i++) {
    if (chordySongsCache[i].artist) {
      addArtist(chordySongsCache[i].artist);
    }
  }
}

function loadArtists() {
  return chordyArtistsCache.slice();
}

function findArtistExact(query) {
  let q = artistNorm(query);
  if (!q) return null;
  for (let i = 0; i < chordyArtistsCache.length; i++) {
    if (artistNorm(chordyArtistsCache[i]) === q) {
      return chordyArtistsCache[i];
    }
  }
  return null;
}

function filterArtists(query) {
  let q = artistNorm(query);
  if (!q) return [];
  let out = [];
  for (let i = 0; i < chordyArtistsCache.length; i++) {
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

let chordyStorageReady = initChordyStorage();

function loadSongs() {
  return chordySongsCache.slice();
}

function saveSongs(list) {
  chordySongsCache = list.slice();
  chordyPersistSongs();
}

function addSong(song) {
  let list = loadSongs();
  list.push(song);
  saveSongs(list);
  if (song.artist) addArtist(song.artist);
}

function updateSongAt(index, song) {
  let list = loadSongs();
  if (index < 0 || index >= list.length) return false;
  list[index] = song;
  saveSongs(list);
  if (song.artist) addArtist(song.artist);
  return true;
}

function deleteSongAt(index) {
  let list = loadSongs();
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
  let list = chordyChordsCache;
  if (!list.length) {
    return defaultChords();
  }
  let out = [];
  for (let i = 0; i < list.length; i++) {
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
  let list = chordyChordsCache.slice();
  list.push(chord);
  saveChords(list);
}

function updateChordAt(index, chord) {
  if (!isValidChord(chord)) {
    return false;
  }
  let list = chordyChordsCache.slice();
  if (index < 0 || index >= list.length) {
    return false;
  }
  list[index] = chord;
  saveChords(list);
  return true;
}

function deleteChordAt(index) {
  let list = chordyChordsCache.slice();
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
