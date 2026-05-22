/* Service Worker — Chordy (precache + caché dinámica) */

var PRECACHE_CACHE = "chordy-precache-1";
var RUNTIME_CACHE = "chordy-runtime-1";

var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./songs.html",
  "./chords.html",
  "./new-chord.html",
  "./css/app.css",
  "./js/vendor/lucide.min.js",
  "./js/icons.js",
  "./js/nav.js",
  "./js/fab.js",
  "./js/chords-storage.js",
  "./js/chord-diagram.js",
  "./js/chord-modal.js",
  "./js/chords.js",
  "./js/songs-storage.js",
  "./js/song-modal.js",
  "./js/songs.js",
  "./js/pwa-install.js",
  "./js/pwa-register.js",
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
  var accept = request.headers.get("Accept");
  return accept && accept.indexOf("text/html") !== -1;
}

function chordyPutRuntime(request, response) {
  if (!response || response.status !== 200) {
    return;
  }
  var clone = response.clone();
  caches.open(RUNTIME_CACHE).then(function (cache) {
    cache.put(request, clone);
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(PRECACHE_CACHE)
      .then(function (cache) {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  var allowed = [PRECACHE_CACHE, RUNTIME_CACHE];
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

  var url;
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
