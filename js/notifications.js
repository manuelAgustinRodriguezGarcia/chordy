function chordyNotificationsSupported() {
  return "Notification" in window;
}

function chordyNotificationsEnabled() {
  try {
    return localStorage.getItem("chordy_notifications") === "1";
  } catch (e) {
    return false;
  }
}

function chordyNotificationIconUrl() {
  try {
    return new URL("./logo-192px.png", window.location.href).href;
  } catch (e) {
    return "./logo-192px.png";
  }
}

function chordySyncNotificationState() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted" && chordyNotificationsEnabled()) {
    try {
      localStorage.setItem("chordy_notifications", "0");
    } catch (e) {}
  }
}

function chordyUpdateNotificationsButton() {
  let btn = document.getElementById("notifications-toggle-btn");
  if (!btn) return;
  let on = chordyNotificationsEnabled() && Notification.permission === "granted";
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.classList.toggle("is-active", on);
  let iconName = on ? "bell-fill" : "bell";
  btn.innerHTML = chordyIcon(iconName, "notifications-toggle__icon");
}

function chordyShowNotificationDirect(title, body, tag) {
  let opts = {
    body: body || "",
    tag: tag || "chordy",
    icon: chordyNotificationIconUrl(),
  };
  let n = new Notification(title || "Chordy", opts);
  n.onclick = function () {
    window.focus();
    n.close();
  };
}

function chordyShowNotification(title, body, tag) {
  if (!chordyNotificationsEnabled()) return;
  if (Notification.permission !== "granted") return;

  let t = title || "Chordy";
  let b = body || "";
  let tg = tag || "chordy";

  function showDirect() {
    try {
      chordyShowNotificationDirect(t, b, tg);
    } catch (e) {
      console.warn("[Chordy] No se pudo mostrar la notificación:", e);
    }
  }

  if (!("serviceWorker" in navigator)) {
    showDirect();
    return;
  }

  navigator.serviceWorker.ready
    .then(function (reg) {
      if (reg.showNotification) {
        return reg
          .showNotification(t, {
            body: b,
            tag: tg,
            icon: chordyNotificationIconUrl(),
          })
          .catch(showDirect);
      }
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_NOTIFICATION",
          title: t,
          body: b,
          tag: tg,
        });
        return;
      }
      showDirect();
    })
    .catch(showDirect);
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
    if (Notification.permission !== "granted") return;
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

function chordyEnableNotifications() {
  try {
    localStorage.setItem("chordy_notifications", "1");
  } catch (e) {}
  chordyUpdateNotificationsButton();
  chordyShowTestNotification();
  chordyScheduleSyncReminder();
}

function chordyRequestNotifications() {
  if (!chordyNotificationsSupported()) return;

  if (chordyNotificationsEnabled() && Notification.permission === "granted") {
    try {
      localStorage.setItem("chordy_notifications", "0");
    } catch (e) {}
    chordyCancelSyncReminder();
    chordyUpdateNotificationsButton();
    return;
  }

  if (Notification.permission === "denied") {
    if (typeof chordyShowToast === "function") {
      chordyShowToast("Notificaciones bloqueadas en el navegador");
    }
    try {
      localStorage.setItem("chordy_notifications", "0");
    } catch (e) {}
    chordyUpdateNotificationsButton();
    return;
  }

  if (Notification.permission === "granted") {
    chordyEnableNotifications();
    return;
  }

  Notification.requestPermission().then(function (perm) {
    if (perm === "granted") {
      chordyEnableNotifications();
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
  chordySyncNotificationState();

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
