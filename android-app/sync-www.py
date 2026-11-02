#!/usr/bin/env python3
"""Atualiza android-app/www com os arquivos da pasta app (raiz), aplicando os ajustes do app nativo:
- sem service worker e sem arquivos do site (_redirects, .well-known, assetlinks);
- supabase-js, Leaflet e QR Code locais (www/vendor) em vez de CDN;
- native.js depois do app.js e marca window.vfrNative no <head>.
Uso: python3 sync-www.py /caminho/da/pasta/app"""
import os, re, shutil, sys
SRC = sys.argv[1]; DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "www")
SKIP = {"sw.js", "assetlinks.json", "_redirects", "LEIA-ME.md", "desktop.ini"}
n = 0
for f in os.listdir(SRC):
    p = os.path.join(SRC, f)
    if os.path.isfile(p) and f not in SKIP and not f.startswith("."):
        shutil.copy2(p, os.path.join(DST, f)); n += 1
def sub(path, a, b, count=1):
    s = open(path, encoding="utf-8", newline="").read()
    s2 = re.sub(a, b, s, count=count)
    if s2 == s and not re.search(re.escape(b) if not b.startswith("\\") else "x^", s): raise SystemExit(f"padrão não encontrado em {os.path.basename(path)}: {a}")
    open(path, "w", encoding="utf-8", newline="").write(s2)
idx = os.path.join(DST, "index.html")
sub(idx, r'<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@[^"]+"></script>', '<script src="vendor/supabase/supabase.js"></script>')
sub(idx, r'<head>', '<head>\n<script>window.vfrNative={platform:"android",app:true};</script>')
sub(idx, r'(<link rel="stylesheet" href="extras\.css[^"]*">)', r'\1\n<style>[data-action="lp-home"],#pc-install{display:none!important}</style>')
sub(idx, r'(<script src="app\.js[^"]*"></script>)', r'\1\n<script src="native.js"></script>')
sub(os.path.join(DST, "app.js"), r'https://cdnjs\.cloudflare\.com/ajax/libs/qrcodejs/1\.0\.0/qrcode\.min\.js', 'vendor/qrcode.min.js')
f = os.path.join(DST, "features.js")
sub(f, r'https://cdnjs\.cloudflare\.com/ajax/libs/leaflet/1\.9\.4/leaflet\.min\.css', 'vendor/leaflet/leaflet.css')
sub(f, r'https://cdnjs\.cloudflare\.com/ajax/libs/leaflet/1\.9\.4/leaflet\.min\.js', 'vendor/leaflet/leaflet.js')
print(f"www atualizado: {n} arquivos copiados")
