// Service worker: deixa o app abrir rápido e funcionar sem internet (somente leitura).
// Ao publicar uma nova versão do app, aumente o número abaixo.
const VERSION = "vfr-v644";
const SHELL = ["pilot-tools.js",
 "socialauth.js", "socialauth.css",
 "pilotavatar.js", "pilotavatar.css",
 "rplhelp.js",
 "opsroster.js", "opsroster.css",
 
 
  "radar3d.js", "radar3d.css",
  "./", "img/navigraph.png", "img/manufacturers/boeing.svg", "img/manufacturers/airbus.svg", "img/manufacturers/bombardier.svg", "index.html", "styles.css", "extras.css", "freelance.css", "config.js", "i18n.js", "app.js", "features.js", "networks.js", "flightinfo.js", "roster.js", "freelance.js", "fleetview.js", "manualupd.js", "manual-i18n.js", "catalogview.js", "brieflayers.js", "favairline.js", "manualreview.js", "manualupd2.js", "manualupd3.js", "vfr-ui.js", "img/regions.json", "programming.js", "pay.js", "track.js", "livemap.js", "wxdecode.js", "metarvisual.js", "tafvisual.js", "routecapture.js", "briefdispatch.js", "briefextras.js", "briefcharts.js", "chartnotams.js", "mapchartnotams.js", "vendor/pdf-lib.min.js", "vendor/pdfjs/pdf.mjs", "vendor/pdfjs/pdf.worker.mjs", "briefing.js", "brieflayout.js", "briefalternate.js", "notamtranslate.js", "adsb.js", "landing.js", "airports.json", "liveries.json", "roster-ap.json", "manifest.webmanifest",
  "aerodrome-surface.js", "adc/sbgr/catalogue.json", "adc/sbgr/chart.png", "mapdispatch.js", "img/brand/flightsim-to.png", "img/brand/x-plane-org.jpg", "simicons.js", "img/sim/msfs.png", "img/sim/xplane.svg", "img/sim/p3d.png", "reportguard.js", "maptools.js", "runways.json", "rwyends.json", "mapradar.js", "mapcharts-us.js", "mapcharts.js", "charts-br.json", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/591.supabase.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return; // dados sempre ao vivo
  if (url.hostname === "www.simbrief.com" || url.hostname === "simbrief.com") return; // despacho sempre atualizado, sem cache offline
  if (url.hostname === "geoaisweb.decea.mil.br") return; // cartas diretamente do DECEA, sem cópia offline
  if (url.hostname === "api.rainviewer.com" || url.hostname === "tilecache.rainviewer.com") return; // radar sem imagens antigas no cache offline
  if (url.hostname === "tiles.arcgis.com") return; // cartas FAA diretamente da fonte, sem cópia offline
  if (url.hostname.endsWith("er-api.com") || url.hostname.endsWith("frankfurter.dev")) return;
  if (url.hostname.endsWith("geojs.io") || url.hostname.endsWith("ipwho.is")) return; // localização aproximada: sempre ao vivo
  if (/tile\.openstreetmap\.org$|arcgisonline\.com$|opentopomap\.org$/.test(url.hostname)) return; // mapas: direto da fonte, sem guardar cópia // cotação das moedas: sempre ao vivo
  if (url.port === "2048" || url.port === "8086") return; // simulador no computador do piloto
  if (url.hostname.endsWith("planespotters.net") || url.hostname.endsWith("plnspttrs.net")) return; // fotos: sempre do Planespotters, sem guardar cópia
  if (url.hostname === 'api.mymemory.translated.net') return;
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin) {
    // Rede primeiro, para pegar atualizações; cache se estiver sem internet
    e.respondWith(fetch(req, { cache: "no-cache" }).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
  } else {
    // Bibliotecas e fontes: cache primeiro
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    })));
  }
});


