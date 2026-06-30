function chordyNotificationsSupported() {
  return "Notification" in window && "serviceWorker" in navigator;
}

function chordyNotificationsEnabled() {
  try {
    return localStorage.getItem("chordy_notifications") === "1";
  } catch (e) {
    return false;
  }
}

function chordyUpdateNotificationsButton() {
  let btn = document.getElementById("notifications-toggle-btn");
  if (!btn) return;
  let on = chordyNotificationsEnabled();
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.classList.toggle("is-active", on);
  let iconName = on ? "bell-fill" : "bell";
  btn.innerHTML = chordyIcon(iconName, "notifications-toggle__icon");
}

function chordyShowNotification(title, body, tag) {
  if (!chordyNotificationsEnabled()) return;
  if (Notification.permission !== "granted") return;

  navigator.serviceWorker.ready.then(function (reg) {
    let opts = {
      body: body || "",
      tag: tag || "chordy",
      icon: "./logo-192px.png",
    };
    if (reg.showNotification) {
      reg.showNotification(title || "Chordy", opts);
      return;
    }
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title: title || "Chordy",
        body: body || "",
        tag: tag || "chordy",
      });
    }
  });
}

let chordySyncReminderTimer = null;

function chordyCountPendingSyncSongs() {
  let songs = loadSongs();
  let count = 0;
  for (let i = 0; i < songs.length; i++) {
    if (songs[i].pendingSync) count++;
  }
  return count;
}

function chordyCancelSyncReminder() {
  if (chordySyncReminderTimer) {
    window.clearTimeout(chordySyncReminderTimer);
    chordySyncReminderTimer = null;
  }
}

function chordyScheduleSyncReminder() {
  chordyCancelSyncReminder();
  if (!chordyNotificationsEnabled()) return;
  if (Notification.permission !== "granted") return;
  if (chordyCountPendingSyncSongs() === 0) return;

  chordySyncReminderTimer = window.setTimeout(function () {
    chordySyncReminderTimer = null;
    if (!chordyNotificationsEnabled()) return;
    let count = chordyCountPendingSyncSongs();
    if (count === 0) return;
    let body =
      count === 1
        ? "Tenés 1 canción pendiente de sincronizar con Spotify."
        : "Tenés " + count + " canciones pendientes de sincronizar con Spotify.";
    chordyShowNotification("Chordy", body, "chordy-sync-pending");
  }, 10000);
}

function chordyShowTestNotification() {
  chordyShowNotification("Chordy", "Las notificaciones están activas.", "chordy-test");
}

function chordyRequestNotifications() {
  if (!chordyNotificationsSupported()) return;

  if (chordyNotificationsEnabled()) {
    try {
      localStorage.setItem("chordy_notifications", "0");
    } catch (e) {}
    chordyCancelSyncReminder();
    chordyUpdateNotificationsButton();
    return;
  }

  Notification.requestPermission().then(function (perm) {
    if (perm === "granted") {
      try {
        localStorage.setItem("chordy_notifications", "1");
      } catch (e) {}
      chordyUpdateNotificationsButton();
      chordyShowTestNotification();
      chordyScheduleSyncReminder();
    }
  });
}

window.chordyNotificationsSupported = chordyNotificationsSupported;
window.chordyNotificationsEnabled = chordyNotificationsEnabled;
window.chordyRequestNotifications = chordyRequestNotifications;
window.chordyShowNotification = chordyShowNotification;
window.chordyShowTestNotification = chordyShowTestNotification;
window.chordyScheduleSyncReminder = chordyScheduleSyncReminder;
window.chordyCancelSyncReminder = chordyCancelSyncReminder;

chordyOnReady(function () {
  let btn = document.getElementById("notifications-toggle-btn");
  if (btn) {
    btn.addEventListener("click", chordyRequestNotifications);
  }
  chordyUpdateNotificationsButton();
  let ready = window.chordyStorageReady || Promise.resolve();
  ready.then(function () {
    chordyScheduleSyncReminder();
  });
});
