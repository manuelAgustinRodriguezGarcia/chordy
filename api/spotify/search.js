let https = require("https");

let spotifyToken = "";
let spotifyTokenExpires = 0;

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
    return Promise.reject(new Error("Faltan credenciales de Spotify en Vercel"));
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

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", results: [] });
    return;
  }

  let q = "";
  if (req.query && req.query.q) {
    q = String(req.query.q).trim();
  }

  if (!q) {
    res.status(200).json({ results: [] });
    return;
  }

  searchTracks(q)
    .then(function (results) {
      res.status(200).json({ results: results });
    })
    .catch(function (err) {
      res.status(500).json({ error: err.message, results: [] });
    });
};
