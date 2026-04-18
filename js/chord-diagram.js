var CHORD_DIAGRAM_MAX_START_FRET = 19;
var CHORD_DIAGRAM_MAX_ABSOLUTE_FRET = CHORD_DIAGRAM_MAX_START_FRET + 4;

function normalizeStringValue(value) {
  if (value === "none" || value === "air") return value;
  var n = parseInt(value, 10);
  if (isNaN(n)) return "air";
  if (n >= 1 && n <= CHORD_DIAGRAM_MAX_ABSOLUTE_FRET) return n;
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
  if (nums.length === 0) return 1;
  var hi = Math.max.apply(null, nums);
  if (hi <= 5) return 1;
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

function chordDiagramChevronSvg(direction) {
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
  path.setAttribute("d", direction === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6");
  svg.appendChild(path);
  return svg;
}

function buildDiagramGutter(startFret, hasFretNav) {
  var gutter = document.createElement("div");
  gutter.className = "chord-diagram__gutter";

  var gutterTop = document.createElement("div");
  gutterTop.className = "chord-diagram__gutter-top";
  gutterTop.setAttribute("aria-hidden", "true");
  if (startFret > 1) gutterTop.classList.add("chord-diagram__gutter-top--no-nut");
  gutter.appendChild(gutterTop);

  if (hasFretNav && startFret > 1) {
    var navUp = document.createElement("button");
    navUp.type = "button";
    navUp.className = "chord-diagram__gutter-nav chord-diagram__gutter-nav--up";
    navUp.setAttribute("data-fret-nav", "up");
    navUp.setAttribute("aria-label", "Ver trastes más graves");
    navUp.appendChild(chordDiagramChevronSvg("up"));
    gutter.appendChild(navUp);
  }

  var gutterMid = document.createElement("div");
  gutterMid.className = "chord-diagram__gutter-mid";
  for (var f = 0; f < 5; f++) {
    var label = document.createElement("div");
    label.className = "chord-diagram__gutter-label";
    label.textContent = String(startFret + f);
    gutterMid.appendChild(label);
  }
  gutter.appendChild(gutterMid);

  if (hasFretNav) {
    var navDown = document.createElement("button");
    navDown.type = "button";
    navDown.className = "chord-diagram__gutter-nav chord-diagram__gutter-nav--down";
    navDown.setAttribute("data-fret-nav", "down");
    navDown.setAttribute("aria-label", "Ver trastes más agudos");
    if (startFret >= CHORD_DIAGRAM_MAX_START_FRET) navDown.disabled = true;
    navDown.appendChild(chordDiagramChevronSvg("down"));
    gutter.appendChild(navDown);
  }

  var gutterBottom = document.createElement("div");
  gutterBottom.className = "chord-diagram__gutter-bottom";
  gutterBottom.setAttribute("aria-hidden", "true");
  gutter.appendChild(gutterBottom);

  return gutter;
}

function buildDotsAndBarres(strings, startFret) {
  var layer = document.createElement("div");
  layer.className = "chord-diagram__dots-layer";

  var fretGroups = {};
  for (var s = 0; s < 6; s++) {
    if (typeof strings[s] !== "number") continue;
    var row = strings[s] - startFret + 1;
    if (row >= 1 && row <= 5) {
      if (!fretGroups[row]) fretGroups[row] = [];
      fretGroups[row].push(s);
    }
  }

  var barredPositions = {};

  for (var r in fretGroups) {
    var group = fretGroups[r];
    var span = group[group.length - 1] - group[0];
    if (group.length >= 2 && span >= 3) {
      var bar = document.createElement("span");
      bar.className = "chord-diagram__bar";
      bar.style.top = dotCenterTopPercent(parseInt(r, 10));
      bar.style.left = "calc(" + stringCenterLeftPercent(group[0]) + " - 0.46rem)";
      bar.style.width = "calc(" + (span / 6 * 100) + "% + 0.92rem)";
      layer.appendChild(bar);
      for (var b = 0; b < group.length; b++) {
        barredPositions[group[b] + "," + r] = true;
      }
    }
  }

  for (var d = 0; d < 6; d++) {
    if (typeof strings[d] !== "number") continue;
    var dotRow = strings[d] - startFret + 1;
    if (dotRow < 1 || dotRow > 5) continue;
    if (barredPositions[d + "," + dotRow]) continue;
    var dot = document.createElement("span");
    dot.className = "chord-diagram__dot";
    dot.style.left = stringCenterLeftPercent(d);
    dot.style.top = dotCenterTopPercent(dotRow);
    layer.appendChild(dot);
  }

  return layer;
}

function buildMutesRow(strings) {
  var mutes = document.createElement("div");
  mutes.className = "chord-diagram__mutes";
  for (var i = 0; i < 6; i++) {
    var cell = document.createElement("div");
    cell.className = "chord-diagram__mute";
    if (strings[i] === "none") {
      cell.textContent = "X";
      cell.classList.add("is-muted");
    }
    mutes.appendChild(cell);
  }
  return mutes;
}

function renderChordDiagram(container, chord) {
  if (!container || !chord || !chord.strings || chord.strings.length !== 6) return;
  if (!chord.nameTitleSlot && !chord.name) return;

  if (chord.nameTitleSlot && chord.nameTitleSlot.parentNode) {
    chord.nameTitleSlot.parentNode.removeChild(chord.nameTitleSlot);
  }
  container.innerHTML = "";

  var strings = [];
  for (var i = 0; i < 6; i++) {
    strings.push(normalizeStringValue(chord.strings[i]));
  }

  var startFret = typeof chord.startFret === "number"
    ? chord.startFret
    : computeChordDisplayStartFret(chord.strings);
  startFret = Math.max(1, Math.min(CHORD_DIAGRAM_MAX_START_FRET, startFret));

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

  board.appendChild(buildDiagramGutter(startFret, chord.fretNav));

  var fretArea = document.createElement("div");
  fretArea.className = "chord-diagram__fret-area";

  var nut = document.createElement("div");
  nut.className = "chord-diagram__nut";
  nut.setAttribute("aria-hidden", "true");
  if (startFret > 1) nut.classList.add("chord-diagram__nut--hidden");
  fretArea.appendChild(nut);

  if (chord.fretNav && startFret > 1) {
    var spacerUp = document.createElement("div");
    spacerUp.className = "chord-diagram__fret-nav-spacer chord-diagram__fret-nav-spacer--up";
    spacerUp.setAttribute("aria-hidden", "true");
    fretArea.appendChild(spacerUp);
  }

  var canvas = document.createElement("div");
  canvas.className = "chord-diagram__canvas";

  for (var vs = 0; vs < 6; vs++) {
    var vLine = document.createElement("div");
    vLine.className = "chord-diagram__v-line";
    vLine.setAttribute("aria-hidden", "true");
    vLine.style.left = stringCenterLeftPercent(vs);
    canvas.appendChild(vLine);
  }

  for (var hf = 1; hf <= 5; hf++) {
    var hLine = document.createElement("div");
    hLine.className = "chord-diagram__h-line";
    hLine.setAttribute("aria-hidden", "true");
    hLine.style.top = fretLineTopPercent(hf);
    canvas.appendChild(hLine);
  }

  canvas.appendChild(buildDotsAndBarres(strings, startFret));
  fretArea.appendChild(canvas);

  if (chord.fretNav) {
    var spacerDown = document.createElement("div");
    spacerDown.className = "chord-diagram__fret-nav-spacer chord-diagram__fret-nav-spacer--down";
    spacerDown.setAttribute("aria-hidden", "true");
    fretArea.appendChild(spacerDown);
  }

  fretArea.appendChild(buildMutesRow(strings));
  board.appendChild(fretArea);
  root.appendChild(board);
  container.appendChild(root);
}
