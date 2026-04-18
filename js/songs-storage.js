var CHORDY_SONGS_KEY = "chordy_songs";

function loadSongs() {
  try {
    var raw = localStorage.getItem(CHORDY_SONGS_KEY);
    if (!raw) return [];
    var list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch (e) {
    return [];
  }
}

function saveSongs(list) {
  localStorage.setItem(CHORDY_SONGS_KEY, JSON.stringify(list));
}

function addSong(song) {
  var list = loadSongs();
  list.push(song);
  saveSongs(list);
}

function updateSongAt(index, song) {
  var list = loadSongs();
  if (index < 0 || index >= list.length) return false;
  list[index] = song;
  saveSongs(list);
  return true;
}

function deleteSongAt(index) {
  var list = loadSongs();
  if (index < 0 || index >= list.length) return false;
  list.splice(index, 1);
  saveSongs(list);
  return true;
}
