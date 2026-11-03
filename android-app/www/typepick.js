/* typepick.js — Frota: os filtros "Todos os tipos", "Qualquer situação" e "Ordenar" viram listas com ícone ao lado de cada opção
   (tipo: logo do fabricante; situação: disponível, com restrição, AOG). O <select> original continua na página
   (escondido) e guarda o valor; ao escolher, ele recebe o valor e dispara "change", então o filtro funciona como antes.
   Teclado: setas, Enter e Esc. */
(function(){
 const TP={open:false};
 const STI={
  all:`<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="6" cy="7" r="3.6" fill="var(--ok)"/><circle cx="14" cy="7" r="3.6" fill="var(--warn)"/><circle cx="10" cy="14" r="3.6" fill="var(--bad)"/></svg>`,
  ok:`<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="var(--ok)"/><path d="M5.8 10.3l2.8 2.8 5.6-6" fill="none" stroke="var(--sheet)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warn:`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l8.6 15.2H1.4z" fill="var(--warn)" stroke="var(--warn)" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 7.2v4.6" stroke="var(--sheet)" stroke-width="2.2" stroke-linecap="round"/><circle cx="10" cy="14.6" r="1.25" fill="var(--sheet)"/></svg>`,
  bad:`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.4 1.5h7.2l4.9 4.9v7.2l-4.9 4.9H6.4l-4.9-4.9V6.4z" fill="var(--bad)"/><path d="M5.6 10h8.8" stroke="var(--sheet)" stroke-width="2.4" stroke-linecap="round"/></svg>`};
 const SOI={
  recent:`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.2 10a6.8 6.8 0 1 0 2-4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M2.6 2.8v3.6h3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 6.2V10l2.8 1.8" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  most:`<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="11" width="3.6" height="6.5" rx="1" fill="currentColor" opacity=".45"/><rect x="8.2" y="7" width="3.6" height="10.5" rx="1" fill="currentColor" opacity=".7"/><rect x="13.9" y="2.5" width="3.6" height="15" rx="1" fill="var(--accent)"/></svg>`,
  avail:`<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="5.2" cy="5" r="3.4" fill="var(--ok)"/><path d="M3.6 5.1l1.2 1.2 2.1-2.4" fill="none" stroke="var(--sheet)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 5h7M3 11h15M3 16h15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".7"/></svg>`,
  reg:`<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="1.5" y="4.5" width="17" height="11" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><text x="10" y="13.1" text-anchor="middle" font-size="7.2" font-weight="800" font-family="ui-monospace,Menlo,monospace" fill="currentColor">A-Z</text></svg>`};
 const PICKS={
  "fv-type":{cls:"tp-type",icon:v=>v!=="all"&&typeof aircraftManufacturerIcon==="function"?aircraftManufacturerIcon(v):"",fallback:'<span class="fv-tp-all" aria-hidden="true">✈</span>'},
  "f-status":{cls:"tp-status",icon:v=>STI[v]?`<span class="fv-tp-st st-${v}">${STI[v]}</span>`:"",fallback:""},
  "fv-sort":{cls:"tp-sort",icon:v=>SOI[v]?`<span class="fv-tp-st so-${v}">${SOI[v]}</span>`:"",fallback:""}};
 function close(){TP.open=false;document.querySelectorAll(".fv-tp").forEach(w=>{w.classList.remove("open");const b=w.querySelector(".fv-tp-btn");b&&b.setAttribute("aria-expanded","false");const p=w.querySelector(".fv-tp-pop");p&&(p.hidden=true)})}
 function build(id){const sel=document.getElementById(id),P=PICKS[id];if(!sel||!P)return;let w=sel.closest(".fv-tp");
  const cur=sel.value,txt=sel.options[sel.selectedIndex]?.text||"";
  const key=cur+"|"+[...sel.options].map(o=>o.value+":"+o.text).join(",");
  if(!w){w=document.createElement("span");w.className="fv-tp "+P.cls;w.dataset.sel=id;sel.before(w);w.append(sel);sel.classList.add("fv-tp-native");sel.tabIndex=-1;sel.setAttribute("aria-hidden","true");
   w.insertAdjacentHTML("afterbegin",`<button type="button" class="fv-tp-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(sel.getAttribute("aria-label")||"")}"></button><div class="fv-tp-pop" role="listbox" hidden></div>`)}
  if(w.dataset.k===key)return;w.dataset.k=key;
  w.querySelector(".fv-tp-btn").innerHTML=`${P.icon(cur)}<span class="fv-tp-tx">${esc(txt)}</span><span class="fv-tp-caret" aria-hidden="true">▾</span>`;
  w.querySelector(".fv-tp-pop").innerHTML=[...sel.options].map(o=>`<button type="button" class="fv-tp-i${o.value===cur?" sel":""}" role="option" aria-selected="${o.value===cur}" data-v="${esc(o.value)}">${P.icon(o.value)||P.fallback}<span>${esc(o.text)}</span></button>`).join("")}
 function open(w){close();TP.open=true;w.classList.add("open");w.querySelector(".fv-tp-btn").setAttribute("aria-expanded","true");const p=w.querySelector(".fv-tp-pop");p.hidden=false;
  const r=w.getBoundingClientRect(),below=innerHeight-r.bottom-16,above=r.top-16;p.classList.toggle("up",below<240&&above>below);p.style.maxHeight=Math.max(160,Math.min(420,p.classList.contains("up")?above:below))+"px";
  p.style.left="";p.style.right="";const pr=p.getBoundingClientRect();if(pr.right>innerWidth-8){p.style.left="auto";p.style.right="0";const q=p.getBoundingClientRect();if(q.left<8){p.style.right=(q.left-8)+"px"}}
  const s=p.querySelector(".sel")||p.querySelector(".fv-tp-i");if(s){s.focus();s.scrollIntoView({block:"nearest"})}}
 function pick(w,v){const sel=document.getElementById(w.dataset.sel);close();if(!sel||sel.value===v)return;sel.value=v;sel.dispatchEvent(new Event("change",{bubbles:true}))}
 if(typeof render==="function"){const tpRender=render;render=function(){const r=tpRender.apply(this,arguments);try{if(typeof view!=="undefined"&&view==="fleet")Object.keys(PICKS).forEach(build)}catch(e){console.warn(e)}return r}}
 document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;const it=t.closest(".fv-tp-i");if(it){pick(it.closest(".fv-tp"),it.dataset.v);return}
  const b=t.closest(".fv-tp-btn");if(b){const w=b.closest(".fv-tp");w.classList.contains("open")?close():open(w);return}
  if(TP.open&&!t.closest(".fv-tp"))close()});
 document.addEventListener("keydown",e=>{const w=e.target.closest&&e.target.closest(".fv-tp");if(!w)return;
  if(e.key==="Escape"&&TP.open){e.preventDefault();close();w.querySelector(".fv-tp-btn").focus();return}
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!TP.open){open(w);return}const its=[...w.querySelectorAll(".fv-tp-i")];let i=its.indexOf(document.activeElement);i=e.key==="ArrowDown"?Math.min(its.length-1,i+1):Math.max(0,i-1);its[i]&&its[i].focus()}});
})();
