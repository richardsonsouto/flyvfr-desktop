/* regionicon.js — Frota: ao lado do filtro de região, um globo com a região selecionada destacada na cor da companhia.
   Os globos (img/regions.json) foram gerados do Natural Earth 110m (projeção ortográfica, uma vista por região). */
(function(){
 const RG={svg:null,p:null};
 function load(){if(RG.svg||RG.p)return;RG.p=fetch("img/regions.json?v=577").then(r=>r.ok?r.json():null).then(j=>{RG.svg=j||{};paint()}).catch(()=>{RG.svg={}})}
 function paint(){const sel=document.getElementById("fv-region");if(!sel)return;if(!RG.svg){load();return}
  const k=sel.value&&RG.svg[sel.value]?sel.value:(sel.value==="all"?"all":"other");const svg=RG.svg[k];if(!svg)return;
  let w=sel.closest(".fv-rg");if(!w){w=document.createElement("span");w.className="fv-rg";sel.before(w);w.append(sel)}
  let ic=w.querySelector(".fv-globe");if(!ic){ic=document.createElement("span");ic.className="fv-globe";w.prepend(ic)}
  if(ic.dataset.k!==k){ic.dataset.k=k;ic.innerHTML=svg;ic.title=sel.options[sel.selectedIndex]?.text||""}}
 if(typeof render==="function"){const rgRender=render;render=function(){const r=rgRender.apply(this,arguments);try{if(typeof view!=="undefined"&&view==="fleet")paint()}catch(e){}return r}}
 document.addEventListener("change",e=>{if(e.target&&e.target.id==="fv-region")setTimeout(paint,0)});
})();
