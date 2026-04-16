var CHORDY_CHORDS_KEY = "chordy_chords";
var CHORDY_CHORDS_LEGACY_KEY = "acordy_chords";

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
  try {
    var raw = localStorage.getItem(CHORDY_CHORDS_KEY);
    if (!raw) {
      var legacy = localStorage.getItem(CHORDY_CHORDS_LEGACY_KEY);
      if (legacy) {
        localStorage.setItem(CHORDY_CHORDS_KEY, legacy);
        raw = legacy;
      }
    }
    if (!raw) {
      return defaultChords();
    }
    var list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) {
      return defaultChords();
    }
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (isValidChord(list[i])) {
        out.push(list[i]);
      }
    }
    if (out.length === 0) {
      return defaultChords();
    }
    return out;
  } catch (err) {
    return defaultChords();
  }
}

function saveChords(list) {
  localStorage.setItem(CHORDY_CHORDS_KEY, JSON.stringify(list));
}

function addChord(chord) {
  if (!isValidChord(chord)) {
    return;
  }
  var list = loadChords();
  list.push(chord);
  saveChords(list);
}

function updateChordAt(index, chord) {
  if (!isValidChord(chord)) {
    return false;
  }
  var list = loadChords();
  if (index < 0 || index >= list.length) {
    return false;
  }
  list[index] = chord;
  saveChords(list);
  return true;
}

function deleteChordAt(index) {
  var list = loadChords();
  if (index < 0 || index >= list.length) {
    return false;
  }
  list.splice(index, 1);
  if (list.length === 0) {
    list = defaultChords();
  }
  saveChords(list);
  return true;
}
