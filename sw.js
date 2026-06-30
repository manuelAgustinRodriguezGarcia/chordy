/* Service Worker — Chordy (precache + caché dinámica) */

let PRECACHE_CACHE = "chordy-precache-14";

let BOOTSTRAP_CDN = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff2",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff",
];
let RUNTIME_CACHE = "chordy-runtime-1";

let PRECACHE_URLS = [
  "./",
  "./index.html",
  "./songs.html",
  "./chords.html",
  "./new-chord.html",
  "./css/app.css",
  "./js/icons.js",
  "./js/nav.js",
  "./js/fab.js",
  "./js/data/data.js",
  "./js/notifications.js",
  "./js/share.js",
  "./js/import.js",
  "./js/chords.js",
  "./js/songs.js",
  "./js/pwa.js",
  "./sw.js",
  "./manifest.webmanifest",
  "./logo.png",
  "./logo-192px.png",
  "./logo-512px.png"
];

function chordySameOrigin(url) {
  return url.origin === self.location.origin;
}

function chordyIsHtmlNavigation(request) {
  if (request.mode === "navigate") {
    return true;
  }
  let accept = request.headers.get("Accept");
  return accept && accept.indexOf("text/html") !== -1;
}

function chordyPutRuntime(request, response) {
  if (!response || response.status !== 200) {
    return;
  }
  let clone = response.clone();
  caches.open(RUNTIME_CACHE).then(function (cache) {
    cache.put(request, clone);
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(PRECACHE_CACHE)
      .then(function (cache) {
        return cache.addAll(PRECACHE_URLS.concat(BOOTSTRAP_CDN));
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  let allowed = [PRECACHE_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.map(function (name) {
          if (allowed.indexOf(name) === -1) {
            return caches.delete(name);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  let url;
  try {
    url = new URL(event.request.url);
  } catch (err) {
    return;
  }

  if (!chordySameOrigin(url)) {
    return;
  }

  if (chordyIsHtmlNavigation(event.request)) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) {
          return cached;
        }
        return fetch(event.request)
          .then(function (network) {
            chordyPutRuntime(event.request, network);
            return network;
          })
          .catch(function () {
            return (
              caches.match("./songs.html") ||
              caches.match("./chords.html") ||
              Response.error()
            );
          });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then(function (network) {
          chordyPutRuntime(event.request, network);
          return network;
        })
        .catch(function () {
          return Response.error();
        });
    })
  );
});

self.addEventListener("message", function (event) {
  let data = event.data;
  if (!data || data.type !== "SHOW_NOTIFICATION") return;
  self.registration.showNotification(data.title || "Chordy", {
    body: data.body || "",
    tag: data.tag || "chordy",
    icon: "./logo-192px.png",
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (let i = 0; i < list.length; i++) {
        if ("focus" in list[i]) {
          return list[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("./songs.html");
      }
    })
  );
});
