let chordyToastEl = null;
let chordyToastTimer = null;

function chordyToastEnsure() {
  if (chordyToastEl) return chordyToastEl;
  chordyToastEl = document.createElement("div");
  chordyToastEl.className = "chordy-toast";
  chordyToastEl.setAttribute("role", "status");
  chordyToastEl.setAttribute("aria-live", "polite");
  chordyToastEl.hidden = true;
  document.body.appendChild(chordyToastEl);
  return chordyToastEl;
}

function chordyShowToast(message) {
  if (!message) return;
  let el = chordyToastEnsure();
  el.innerHTML =
    chordyIcon("check", "chordy-toast__icon") +
    '<span class="chordy-toast__text">' +
    message +
    "</span>";
  el.hidden = false;
  window.requestAnimationFrame(function () {
    el.classList.add("is-visible");
  });
  if (chordyToastTimer) window.clearTimeout(chordyToastTimer);
  chordyToastTimer = window.setTimeout(function () {
    el.classList.remove("is-visible");
    window.setTimeout(function () {
      el.hidden = true;
    }, 220);
  }, 3200);
}

window.chordyShowToast = chordyShowToast;
