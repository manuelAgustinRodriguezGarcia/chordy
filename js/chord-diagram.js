var CHORD_DIAGRAM_MAX_START_FRET = 19;
var CHORD_DIAGRAM_MAX_ABSOLUTE_FRET = CHORD_DIAGRAM_MAX_START_FRET + 4;

function normalizeStringValue(value) {
  if (value === "none" || value === "air") {
    return value;
  }
  var n = parseInt(value, 10);
  if (isNaN(n)) {
    return "air";
  }
  if (n >= 1 && n <= CHORD_DIAGRAM_MAX_ABSOLUTE_FRET) {
    return n;
  }
  return "air";
}

function computeChordDisplayStartFret(strings) {
  var nums = [];
  for (var i = 0; i < strings.length; i++) {
    var v = strings[i];
    if (typeof v === "number" && v >= 1 && v <= CHORD_DIAGRAM_MAX_ABSOLUTE_FRET) {
      nums.push(v);
    }
  }
  if (nums.length === 0) {
    return 1;
  }
  var hi = Math.max.apply(null, nums);
  if (hi <= 5) {
    return 1;
  }
  return Math.max(1, Math.min(CHORD_DIAGRAM_MAX_START_FRET, hi - 4));
}

function stringCenterLeftPercent(index) {
  return ((index + 0.5) / 6) * 100 + "%";
}

function fretLineTopPercent(fretIndex) {
  return (fretIndex / 5) * 100 + "%";
}

function dotCenterTopPercent(fretNumber) {
  return ((fretNumber - 0.5) / 5) * 100 + "%";
}

function chordDiagramGutterChevronSvg(direction) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.25");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  if (direction === "up") {
    path.setAttribute("d", "M6 15l6-6 6 6");
  } else {
    path.setAttribute("d", "M6 9l6 6 6-6");
  }
  svg.appendChild(path);
  return svg;
}

function renderChordDiagram(container, chord) {
  if (!container || !chord || !chord.strings || chord.strings.length !== 6) {
    return;
  }
  if (!chord.nameTitleSlot && (chord.name === undefined || chord.name === null || chord.name === "")) {
    return;
  }
  if (chord.nameTitleSlot && chord.nameTitleSlot.parentNode) {
    chord.nameTitleSlot.parentNode.removeChild(chord.nameTitleSlot);
  }
  container.innerHTML = "";
  var strings = [];
  for (var i = 0; i < 6; i++) {
    strings.push(normalizeStringValue(chord.strings[i]));
  }

  var startFret =
    typeof chord.startFret === "number"
      ? chord.startFret
      : computeChordDisplayStartFret(chord.strings);
  if (startFret < 1) {
    startFret = 1;
  }
  if (startFret > CHORD_DIAGRAM_MAX_START_FRET) {
    startFret = CHORD_DIAGRAM_MAX_START_FRET;
  }

  var root = document.createElement("div");
  root.className = "chord-diagram";

  if (chord.nameTitleSlot) {
    chord.nameTitleSlot.classList.add("chord-diagram__name-field");
    root.appendChild(chord.nameTitleSlot);
  } else {
    var title = document.createElement("div");
    title.className = "chord-diagram__title";
    title.textContent = chord.name;
    root.appendChild(title);
  }

  var board = document.createElement("div");
  board.className = "chord-diagram__board";

  var gutter = document.createElement("div");
  gutter.className = "chord-diagram__gutter";
  var gutterTop = document.createElement("div");
  gutterTop.className = "chord-diagram__gutter-top";
  gutterTop.setAttribute("aria-hidden", "true");
  if (startFret > 1) {
    gutterTop.classList.add("chord-diagram__gutter-top--no-nut");
  }
  gutter.appendChild(gutterTop);
  if (chord.fretNav && startFret > 1) {
    var navUp = document.createElement("button");
    navUp.type = "button";
    navUp.className = "chord-diagram__gutter-nav chord-diagram__gutter-nav--up";
    navUp.setAttribute("data-fret-nav", "up");
    navUp.setAttribute("aria-label", "Ver trastes más graves");
    navUp.appendChild(chordDiagramGutterChevronSvg("up"));
    gutter.appendChild(navUp);
  }
  var gutterMid = document.createElement("div");
  gutterMid.className = "chord-diagram__gutter-mid";
  for (var gf = 0; gf < 5; gf++) {
    var gl = document.createElement("div");
    gl.className = "chord-diagram__gutter-label";
    gl.textContent = String(startFret + gf);
    gutterMid.appendChild(gl);
  }
  gutter.appendChild(gutterMid);
  if (chord.fretNav) {
    var navDown = document.createElement("button");
    navDown.type = "button";
    navDown.className = "chord-diagram__gutter-nav chord-diagram__gutter-nav--down";
    navDown.setAttribute("data-fret-nav", "down");
    navDown.setAttribute("aria-label", "Ver trastes más agudos");
    if (startFret >= CHORD_DIAGRAM_MAX_START_FRET) {
      navDown.disabled = true;
    }
    navDown.appendChild(chordDiagramGutterChevronSvg("down"));
    gutter.appendChild(navDown);
  }
  var gutterBottom = document.createElement("div");
  gutterBottom.className = "chord-diagram__gutter-bottom";
  gutterBottom.setAttribute("aria-hidden", "true");
  gutter.appendChild(gutterBottom);
  board.appendChild(gutter);

  var fretArea = document.createElement("div");
  fretArea.className = "chord-diagram__fret-area";

  var nut = document.createElement("div");
  nut.className = "chord-diagram__nut";
  nut.setAttribute("aria-hidden", "true");
  if (startFret > 1) {
    nut.classList.add("chord-diagram__nut--hidden");
  }
  fretArea.appendChild(nut);

  if (chord.fretNav && startFret > 1) {
    var fretSpacerUp = document.createElement("div");
    fretSpacerUp.className = "chord-diagram__fret-nav-spacer chord-diagram__fret-nav-spacer--up";
    fretSpacerUp.setAttribute("aria-hidden", "true");
    fretArea.appendChild(fretSpacerUp);
  }

  var canvas = document.createElement("div");
  canvas.className = "chord-diagram__canvas";

  for (var vs = 0; vs < 6; vs++) {
    var vl = document.createElement("div");
    vl.className = "chord-diagram__v-line";
    vl.setAttribute("aria-hidden", "true");
    vl.style.left = stringCenterLeftPercent(vs);
    canvas.appendChild(vl);
  }

  for (var vf = 1; vf <= 5; vf++) {
    var hr = document.createElement("div");
    hr.className = "chord-diagram__h-line";
    hr.setAttribute("aria-hidden", "true");
    hr.style.top = fretLineTopPercent(vf);
    canvas.appendChild(hr);
  }

  var dotsLayer = document.createElement("div");
  dotsLayer.className = "chord-diagram__dots-layer";

  var fretGroups = {};
  for (var s = 0; s < 6; s++) {
    var val = strings[s];
    if (typeof val === "number") {
      var row = val - startFret + 1;
      if (row >= 1 && row <= 5) {
        if (!fretGroups[row]) {
          fretGroups[row] = [];
        }
        fretGroups[row].push(s);
      }
    }
  }

  var barredKeys = {};
  for (var r in fretGroups) {
    var group = fretGroups[r];
    if (group.length >= 2 && group[group.length - 1] - group[0] >= 3) {
      var bar = document.createElement("span");
      bar.className = "chord-diagram__bar";
      bar.style.top = dotCenterTopPercent(parseInt(r, 10));
      var fi = group[0];
      var li = group[group.length - 1];
      bar.style.left = "calc(" + stringCenterLeftPercent(fi) + " - 0.46rem)";
      bar.style.width = "calc(" + ((li - fi) / 6 * 100) + "% + 0.92rem)";
      dotsLayer.appendChild(bar);
      for (var bi = 0; bi < group.length; bi++) {
        barredKeys[group[bi] + "," + r] = true;
      }
    }
  }

  for (var s = 0; s < 6; s++) {
    var val = strings[s];
    if (typeof val === "number") {
      var row = val - startFret + 1;
      if (row < 1 || row > 5) {
        continue;
      }
      if (barredKeys[s + "," + row]) {
        continue;
      }
      var dot = document.createElement("span");
      dot.className = "chord-diagram__dot";
      dot.style.left = stringCenterLeftPercent(s);
      dot.style.top = dotCenterTopPercent(row);
      dotsLayer.appendChild(dot);
    }
  }
  canvas.appendChild(dotsLayer);
  fretArea.appendChild(canvas);

  if (chord.fretNav) {
    var fretSpacerDown = document.createElement("div");
    fretSpacerDown.className = "chord-diagram__fret-nav-spacer chord-diagram__fret-nav-spacer--down";
    fretSpacerDown.setAttribute("aria-hidden", "true");
    fretArea.appendChild(fretSpacerDown);
  }

  var mutes = document.createElement("div");
  mutes.className = "chord-diagram__mutes";
  for (var s2 = 0; s2 < 6; s2++) {
    var m = document.createElement("div");
    m.className = "chord-diagram__mute";
    if (strings[s2] === "none") {
      m.textContent = "X";
      m.classList.add("is-muted");
    }
    mutes.appendChild(m);
  }
  fretArea.appendChild(mutes);

  board.appendChild(fretArea);
  root.appendChild(board);
  container.appendChild(root);
}
