let http = require("http");
let https = require("https");
let fs = require("fs");
let path = require("path");
let url = require("url");

let PORT = 3000;
let ROOT = __dirname;

let spotifyToken = "";
let spotifyTokenExpires = 0;

function loadEnvFile() {
  let envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  let lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line || line.charAt(0) === "#") continue;
    let eq = line.indexOf("=");
    if (eq === -1) continue;
    let key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile();

let MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon"
};

function sendJson(res, status, data) {
  let body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function httpsRequest(options, postBody) {
  return new Promise(function (resolve, reject) {
    let req = https.request(options, function (res) {
      let chunks = "";
      res.on("data", function (d) {
        chunks += d;
      });
      res.on("end", function () {
        resolve({ status: res.statusCode, body: chunks });
      });
    });
    req.on("error", reject);
    if (postBody) req.write(postBody);
    req.end();
  });
}

function getSpotifyToken() {
  let id = process.env.SPOTIFY_CLIENT_ID;
  let secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    return Promise.reject(new Error("Faltan SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET en .env"));
  }
  if (spotifyToken && Date.now() < spotifyTokenExpires - 60000) {
    return Promise.resolve(spotifyToken);
  }
  let auth = Buffer.from(id + ":" + secret).toString("base64");
  let body = "grant_type=client_credentials";
  return httpsRequest(
    {
      hostname: "accounts.spotify.com",
      path: "/api/token",
      method: "POST",
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body)
      }
    },
    body
  ).then(function (res) {
    let data = JSON.parse(res.body);
    if (!data.access_token) {
      throw new Error("No se pudo obtener token de Spotify");
    }
    spotifyToken = data.access_token;
    spotifyTokenExpires = Date.now() + data.expires_in * 1000;
    return spotifyToken;
  });
}

function searchTracks(query) {
  return getSpotifyToken().then(function (token) {
    let pathStr =
      "/v1/search?type=track&limit=5&q=" + encodeURIComponent(query);
    return httpsRequest({
      hostname: "api.spotify.com",
      path: pathStr,
      method: "GET",
      headers: { Authorization: "Bearer " + token }
    });
  }).then(function (res) {
    let data = JSON.parse(res.body);
    let items = data.tracks && data.tracks.items ? data.tracks.items : [];
    let results = [];
    for (let i = 0; i < items.length; i++) {
      let t = items[i];
      let img = "";
      if (t.album && t.album.images && t.album.images.length) {
        img = t.album.images[0].url;
      }
      let artist = "";
      if (t.artists && t.artists.length) artist = t.artists[0].name;
      results.push({
        id: t.id,
        title: t.name,
        artist: artist,
        album: t.album ? t.album.name : "",
        image: img
      });
    }
    return results;
  });
}

function serveStatic(reqPath, res) {
  if (reqPath === "/") reqPath = "/songs.html";
  let filePath = path.join(ROOT, reqPath.replace(/\//g, path.sep));
  if (filePath.indexOf(ROOT) !== 0) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    let ext = path.extname(filePath);
    let contentType = MIME[ext] || "application/octet-stream";
    if (
      contentType === "text/html" ||
      contentType === "text/css" ||
      contentType === "application/javascript" ||
      contentType === "application/json"
    ) {
      contentType += "; charset=utf-8";
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

let server = http.createServer(function (req, res) {
  let parsed = url.parse(req.url, true);

  if (req.method === "GET" && parsed.pathname === "/api/spotify/search") {
    let q = (parsed.query.q || "").trim();
    if (!q) {
      sendJson(res, 200, { results: [] });
      return;
    }
    searchTracks(q)
      .then(function (results) {
        sendJson(res, 200, { results: results });
      })
      .catch(function (err) {
        sendJson(res, 500, { error: err.message, results: [] });
      });
    return;
  }

  serveStatic(parsed.pathname, res);
});

server.listen(PORT, function () {
  console.log("Chordy en http://localhost:" + PORT);
  console.log("Abrí http://localhost:" + PORT + "/songs.html");
});
