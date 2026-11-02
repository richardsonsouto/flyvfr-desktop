// Monta web/ (as telas dentro do programa) a partir de ../android-app/www, que já é a cópia da pasta app
// com bibliotecas locais (Supabase, Leaflet, QR Code). Ajustes para o Windows:
// - tira a marca window.vfrNative do Android (no Windows ela vem do preload.js, com SimConnect e versão);
// - mantém native.js (abre direto no login, links externos no navegador) e esconde "Instale em seu PC".
const fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "..", "android-app", "www"), DST = path.join(__dirname, "web");
fs.rmSync(DST, { recursive: true, force: true });
fs.cpSync(SRC, DST, { recursive: true });
const idx = path.join(DST, "index.html");
let html = fs.readFileSync(idx, "utf8");
html = html.replace(/<script>window\.vfrNative=\{platform:"android",app:true\};<\/script>\r?\n?/, "");
fs.writeFileSync(idx, html);
if (/platform:"android"/.test(html)) throw new Error("marca do Android ainda presente");
console.log("web/ pronto:", fs.readdirSync(DST).length, "itens");
