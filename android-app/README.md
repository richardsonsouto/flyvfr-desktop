# Virtual Flight Report — app Android nativo

App Android feito com **Capacitor**. As telas do app (a pasta `app` do projeto) vão **dentro do APK**: o app abre sem depender do site. Os dados — login, frota, reservas, voos — continuam vindo do Supabase pela internet.

## Como gerar o APK
A cada envio para a pasta `android-app/`, o GitHub Actions compila sozinho (aba **Actions → App Android**). No fim da execução, em **Artifacts**, baixe o pacote com:

- `VirtualFlightReport-teste.apk` — para instalar direto no celular (teste);
- `VirtualFlightReport-playstore.aab` — para enviar à Google Play.

Também dá para rodar manualmente: **Actions → App Android → Run workflow**.

## Assinatura para a Google Play (feito uma vez, pelo dono da conta)
Em **Settings → Secrets and variables → Actions → New repository secret**, crie:

| Segredo | Valor |
|---|---|
| `VFR_KEYSTORE_BASE64` | o arquivo `signing.keystore` em Base64 |
| `VFR_KEYSTORE_PASSWORD` | a senha do keystore (está em `signing-key-info.txt`) |
| `VFR_KEY_ALIAS` | `my-key-alias` |
| `VFR_KEY_PASSWORD` | a senha da chave (está em `signing-key-info.txt`) |

Para gerar o Base64 no Windows (PowerShell, na pasta do keystore):
`[Convert]::ToBase64String([IO.File]::ReadAllBytes("signing.keystore")) | Set-Clipboard`

O identificador do app é `dev.pages.virtual_flight_report.twa` — o mesmo do app antigo — para que a versão nativa substitua a anterior na Play Store, assinada com a mesma chave.

## Atualizar as telas
O conteúdo de `www/` é a pasta `app` do projeto, com estes ajustes para o celular:
- `native.js`: abre direto no login (sem a página de divulgação) e manda links externos para o navegador;
- bibliotecas locais em `www/vendor/` (Supabase, Leaflet, QR Code) em vez de CDN;
- sem service worker (o app já tem os arquivos).

Para publicar uma versão nova do app, atualize `www/` e envie: o Actions gera os arquivos com número de versão maior.
