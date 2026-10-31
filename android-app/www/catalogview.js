/* catalogview.js — Catálogo padrão de falhas com um menu de botões por capítulo ATA. */
let catAta="all";
const CV_T={cv_all:["All chapters","Todos os capítulos","Todos los capítulos","Tous les chapitres","Alle Kapitel","すべての章","全部章节","모든 장"],
 cv_menu:["ATA chapter","Capítulo ATA","Capítulo ATA","Chapitre ATA","ATA-Kapitel","ATA 章","ATA 章节","ATA 장"]};
const cvt=k=>{const r=CV_T[k];return r?(r[LANGS.indexOf(lang)]||r[0]):k};
viewCatalog=function(){
  const shown=new Set(searchCatalog(catQuery,true).map(c=>c.id)),all={},g={};
  CATALOG.forEach(c=>(all[c.ata]=all[c.ata]||[]).push(c));
  CATALOG.filter(c=>shown.has(c.id)).forEach(c=>(g[c.ata]=g[c.ata]||[]).push(c));
  const atas=Object.keys(all).map(Number).sort((a,b)=>a-b);
  if(catAta!=="all"&&!all[catAta])catAta="all";
  const sel=Object.keys(g).map(Number).filter(a=>catAta==="all"||a===catAta).sort((a,b)=>a-b);
  const n=sel.reduce((s,a)=>s+g[a].length,0);
  const btn=(v,label,cnt,dis)=>`<button type="button" class="cv-ata" data-action="cat-ata" data-v="${v}" aria-pressed="${String(catAta)===String(v)}" ${dis?"disabled":""}>${label}<span class="cv-n">${cnt}</span></button>`;
  const menu=`<nav class="cv-menu" aria-label="${esc(cvt("cv_menu"))}">${btn("all",`<b>${esc(cvt("cv_all"))}</b>`,shown.size)}${atas.map(a=>btn(a,`<b class="mono">${String(a).padStart(2,"0")}</b><span class="cv-name">${esc(ataName(a))}</span>`,(g[a]||[]).length,!(g[a]||[]).length)).join("")}</nav>`;
  const rows=sel.map(ata=>g[ata].map((c,i)=>`<tr>
     <td class="ata">${i===0?`${String(ata).padStart(2,"0")}<br><span style="font-family:var(--f-body)">${esc(ataName(ata))}</span>`:""}</td>
     <td><strong>${esc(tr(c.t))}</strong></td><td><span class="chip ${OUT_KIND[c.outcome]}">${outLabel(c.outcome)}</span></td>
     <td class="mono">${c.repairH?c.repairH+" h":"—"}</td><td>${c.deferDays?esc(melLabel(c.deferDays)):"—"}</td><td class="proc">${esc(c.p?tr(c.p):"—")}</td></tr>`).join("")).join("");
  return`<div class="sec-head cv-head"><div><span class="eyebrow">${t("cat_eyebrow")}</span><h2>${t("cat_title")}</h2></div>
   <div class="filters cv-search"><input id="cat-q" type="search" placeholder="${t("cat_filter_ph")}" value="${esc(catQuery)}" autocomplete="off"><span class="muted" style="font-size:.85rem">${t("cat_count",{n})}</span></div></div>
   <div class="cv-intro"><p class="muted">${t("cat_body")}</p><p class="hint">${t("cat_source")}</p></div>
   ${menu}
   <div class="panel scroll"><table><thead><tr><th>${t("th_ata")}</th><th>${t("th_defect")}</th><th>${t("th_default")}</th><th>${t("th_ground")}</th><th>${t("th_mel")}</th><th>${t("th_proc")}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
};
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="cat-ata"]');if(!b)return;catAta=b.dataset.v==="all"?"all":Number(b.dataset.v);render()});
