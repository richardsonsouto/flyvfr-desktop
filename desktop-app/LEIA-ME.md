# Virtual Flight Report — app de Windows

Programa instalado (Electron) que leva as telas do app **dentro** dele — nada é carregado de flyvfr.com.br.
A internet continua sendo usada para os dados compartilhados (Supabase, ADS-B, meteorologia, mapas).

## O que ele faz além do site
- **Conexão direta ao MSFS 2020/2024 por SimConnect** no voo rastreado — não precisa do FSUIPC.
  (FSUIPC e X-Plane 12 continuam disponíveis no mesmo botão.)
- Abre como programa (atalho na Área de Trabalho e no Menu Iniciar), uma janela só, lembra o tamanho e a posição.
- Links externos abrem no navegador do Windows.
- **Atualização automática**: procura `latest.yml` em `https://github.com/richardsonsouto/flyvfr-desktop/releases/latest/download/` (GitHub Releases do repositório público richardsonsouto/flyvfr-desktop)
  (ou no endereço que estiver em `UPDATE_URL`, no main.js, e em `build.publish`, no package.json).

## Pastas
- `main.js` — janela, endereço interno `app://flyvfr/`, SimConnect, atualização.
- `preload.js` — ponte segura (`window.vfrNative`) entre as telas e o Windows.
- `sync-web.js` — monta `web/` a partir de `../android-app/www` (a cópia da pasta app com bibliotecas locais).
- `build/` — ícone e imagem lateral do instalador.

## Gerar uma nova versão
1. Atualize as telas: `python3 android-app/sync-www.py <pasta app>` (vale para o Android e o Windows).
2. Aumente `"version"` no `package.json` (ex.: 3.1.1) e envie para o GitHub.
3. O GitHub Actions (aba **Actions → App Windows**) gera `VirtualFlightReport-Desktop-Setup-X.Y.Z.exe`, o `.blockmap` e o `latest.yml` em **Artifacts**.
4. Atualização automática: ao enviar para o ramo `android-app` uma versão do `package.json` que ainda não foi publicada, o Actions cria a release vX.Y.Z com os 3 arquivos e os programas instalados se atualizam sozinhos.
