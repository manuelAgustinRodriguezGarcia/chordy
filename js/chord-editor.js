var chordEditorStringLabels = ["6", "5", "4", "3", "2", "1"];

function createChordEditor(rootEl) {
  var strings = ["air", "air", "air", "air", "air", "air"];
  var onChangeCb = null;

  function syncUI() {
    if (!rootEl) {
      return;
    }
    for (var s = 0; s < 6; s++) {
      var col = rootEl.querySelector('[data-editor-col="' + s + '"]');
      if (!col) {
        continue;
      }
      var val = strings[s];
      var fretBtns = col.querySelectorAll("[data-fret]");
      for (var i = 0; i < fretBtns.length; i++) {
        var btn = fretBtns[i];
        var f = parseInt(btn.getAttribute("data-fret"), 10);
        btn.classList.toggle("is-active", val === f);
      }
      var muteBtn = col.querySelector('[data-mode="none"]');
      var airBtn = col.querySelector('[data-mode="air"]');
      if (muteBtn) {
        muteBtn.classList.toggle("is-active", val === "none");
      }
      if (airBtn) {
        airBtn.classList.toggle("is-active", val === "air");
      }
    }
  }

  function setStringValue(index, value) {
    strings[index] = value;
    syncUI();
    if (typeof onChangeCb === "function") {
      onChangeCb(strings);
    }
  }

  function onEditorGridClick(event) {
    var target = event.target;
    if (target.nodeName !== "BUTTON") {
      return;
    }
    var col = target.closest("[data-editor-col]");
    if (!col || !rootEl.contains(col)) {
      return;
    }
    var index = parseInt(col.getAttribute("data-editor-col"), 10);
    if (isNaN(index) || index < 0 || index > 5) {
      return;
    }
    if (target.hasAttribute("data-fret")) {
      setStringValue(index, parseInt(target.getAttribute("data-fret"), 10));
      return;
    }
    var mode = target.getAttribute("data-mode");
    if (mode === "none" || mode === "air") {
      setStringValue(index, mode);
    }
  }

  function build() {
    if (!rootEl) {
      return;
    }
    rootEl.innerHTML = "";
    if (!rootEl.dataset.editorBound) {
      rootEl.dataset.editorBound = "1";
      rootEl.addEventListener("click", onEditorGridClick);
    }
    for (var s = 0; s < 6; s++) {
      var col = document.createElement("div");
      col.className = "chord-editor__col";
      col.setAttribute("data-editor-col", String(s));

      var head = document.createElement("div");
      head.className = "chord-editor__head";
      head.textContent = chordEditorStringLabels[s];
      col.appendChild(head);

      for (var fret = 1; fret <= 5; fret++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chord-editor__fret-btn";
        b.setAttribute("data-fret", String(fret));
        b.textContent = String(fret);
        col.appendChild(b);
      }

      var modes = document.createElement("div");
      modes.className = "chord-editor__modes";

      var bMute = document.createElement("button");
      bMute.type = "button";
      bMute.className = "chord-editor__mode-btn";
      bMute.setAttribute("data-mode", "none");
      bMute.textContent = "X";
      modes.appendChild(bMute);

      var bAir = document.createElement("button");
      bAir.type = "button";
      bAir.className = "chord-editor__mode-btn";
      bAir.setAttribute("data-mode", "air");
      bAir.textContent = "O";
      modes.appendChild(bAir);

      col.appendChild(modes);
      rootEl.appendChild(col);
    }
    syncUI();
  }

  return {
    build: build,
    getStrings: function () {
      return strings.slice();
    },
    setString: function (index, value) {
      if (index < 0 || index > 5) {
        return;
      }
      if (value !== "none" && value !== "air" && (typeof value !== "number" || value < 1 || value > 5)) {
        return;
      }
      setStringValue(index, value);
    },
    reset: function () {
      for (var i = 0; i < 6; i++) {
        strings[i] = "air";
      }
      syncUI();
      if (typeof onChangeCb === "function") {
        onChangeCb(strings);
      }
    },
    setOnChange: function (fn) {
      onChangeCb = fn;
    }
  };
}
