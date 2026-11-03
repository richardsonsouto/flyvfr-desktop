/* Junta os arquivos de ajuste da interface (os mais recentes, carregados por último) num só arquivo: vfr-ui.js.
   Uso: node tools/build-ui.cjs <pasta do site>   (precisa de "terser": npm i terser)
   Os arquivos-fonte continuam na pasta do site para edição; depois de editar qualquer um deles, rode este script de novo.
   Só entram arquivos sem "use strict" no topo e sem declarações repetidas (verificado no teste de empacotamento). */
const fs=require('fs'),path=require('path');
const SRC=["stripcard.js","reviewsview.js","mapslim.js","rosterbreak.js","rsflip.js","cracha.js","livfilter.js","escfit.js","regionicon.js","typepick.js","remind.js","landrank.js"];
(async()=>{const dir=path.resolve(process.argv[2]||'.');const {minify}=require('terser');
 let code="";for(const f of SRC){const s=fs.readFileSync(path.join(dir,f),'utf8');if(/^\s*(\/\*[\s\S]*?\*\/\s*)?["']use strict["']/.test(s))throw new Error(f+" usa 'use strict' e não pode entrar no pacote");code+=`\n/* ===== ${f} ===== */\n`+s+"\n;\n"}
 const r=await minify(code,{ecma:2020,compress:{passes:1,keep_fnames:true,keep_classnames:true},mangle:false,format:{comments:false}});
 const head=`/* vfr-ui.js — GERADO por tools/build-ui.cjs a partir de: ${SRC.join(", ")}. Não edite aqui: edite os arquivos-fonte e gere de novo. */\n`;
 fs.writeFileSync(path.join(dir,'vfr-ui.js'),head+r.code+"\n");console.log('vfr-ui.js',(head.length+r.code.length),'bytes de',code.length,'·',SRC.length,'arquivos')})().catch(e=>{console.error(e.message);process.exit(1)});
