function buildTopDownloads() {
  var container = document.getElementById("top-downloads");
  if (!container) {
    return;
  }
  var items = [
    { title: "Wonderwall", artist: "Oasis", rank: 1 },
    { title: "Hotel California", artist: "Eagles", rank: 2 },
    { title: "Blackbird", artist: "The Beatles", rank: 3 },
    { title: "Fast Car", artist: "Tracy Chapman", rank: 4 },
    { title: "Hallelujah", artist: "Leonard Cohen", rank: 5 }
  ];
  var html = "";
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    html +=
      '<article class="card">' +
      '<p class="card__title">#' +
      item.rank +
      " · " +
      item.title +
      "</p>" +
      '<p class="card__meta">' +
      item.artist +
      "</p>" +
      "</article>";
  }
  container.innerHTML = html;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildTopDownloads);
} else {
  buildTopDownloads();
}
