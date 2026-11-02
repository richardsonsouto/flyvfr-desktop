/* reviewsview.js — menu próprio "Análise de reportes" (sai das demais telas: Escala, Programação, Diário e Admin) */
L.nav_reviews=["Report review","Análise de reportes","Revisión de reportes","Examen des rapports","Berichtsprüfung","報告の審査","报告审核","보고 검토"];
L.rv_eyebrow=["Flights without validated tracking","Voos sem rastreio validado","Vuelos sin seguimiento validado","Vols sans suivi validé","Flüge ohne validiertes Tracking","検証済み追跡のないフライト","无经验证跟踪的航班","검증된 추적이 없는 비행"];
L.rv_intro_admin=["Pending claims from pilots. Open one to approve or reject it; you cannot decide on your own reports.","Solicitações dos pilotos aguardando análise. Abra uma para aprovar ou recusar; você não decide os seus próprios reportes.","Solicitudes de los pilotos pendientes. Abre una para aprobarla o rechazarla; no decides tus propios reportes.","Demandes des pilotes en attente. Ouvrez-en une pour l’approuver ou la refuser ; vous ne décidez pas de vos propres rapports.","Offene Anfragen der Piloten. Öffne eine, um sie zu genehmigen oder abzulehnen; über eigene Berichte entscheidest du nicht.","パイロットからの審査待ちの申請です。開いて承認または却下します。自分の報告は審査できません。","飞行员待审核的申请。打开后可批准或拒绝；不能审核自己的报告。","조종사의 검토 대기 요청입니다. 열어서 승인 또는 거절하세요. 본인 보고는 결정할 수 없습니다."];
NAV_ICON.reviews=_ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9.5 4V2.8h5V4"/><path d="M8.6 12.6l2.3 2.3 4.6-4.8"/>');
/* conteúdo da tela (a lista é preenchida por reportguard.js) */
if(typeof viewFleet==="function"){const rvFleet=viewFleet;viewFleet=function(){if(view!=="reviews")return rvFleet.apply(this,arguments);
  return`<div class="sec-head"><div><span class="eyebrow">${esc(t("rv_eyebrow"))}</span><h2>${esc(t("nav_reviews"))}</h2></div></div>
   <p class="muted rv-intro">${esc(IS_ADMIN()?t("rv_intro_admin"):reviewText("help"))}</p>`}}
/* botão no menu, logo depois do Diário de bordo */
if(typeof paintChrome==="function"){const rvChrome=paintChrome;paintChrome=function(){const r=rvChrome.apply(this,arguments);const tabs=document.getElementById("tabs");
  if(tabs&&session&&!tabs.querySelector('[data-view="reviews"]')){const after=tabs.querySelector('[data-view="logbook"]');const b=document.createElement("button");b.className="tab";b.dataset.view="reviews";b.title=t("nav_reviews");b.setAttribute("aria-current",view==="reviews"?"page":"false");b.innerHTML=`${NAV_ICON.reviews}<span>${esc(t("nav_reviews"))}</span>`;
    if(after)after.after(b);else tabs.append(b)}
  return r}}

/* Apoie: o quadro "Doe pelo Pix" (QR Code e código copia e cola) vai para o final da página */
if(typeof render==="function"){const rvRender=render;render=function(){const r=rvRender.apply(this,arguments);
  try{if(view==="support"){const qr=document.getElementById("pix-qr"),panel=qr&&qr.closest(".panel"),root=document.getElementById("view");
    if(panel&&root&&root.lastElementChild!==panel){panel.classList.add("sup-pix-end");root.append(panel)}}}catch(e){}
  return r}}
/* Rastreio em andamento: o aviso sai do corpo da página e vira um selo compacto ao lado do nome do menu */
function trkTopChip(){const top=document.querySelector(".top-in"),title=document.getElementById("page-title");if(!top||!title)return;
  top.querySelector(".trk-top")?.remove();const b=document.querySelector("#view .trk-banner");if(!b)return;
  const r=typeof trkRes==="function"?trkRes():null,btn=b.querySelector("[data-action='trk-open']");if(!r||!btn)return;
  const on=typeof TRK!=="undefined"&&TRK.status==="connected",txt=(b.querySelector("span")?.textContent||"").replace(/^✈\s*/,"");b.remove();
  const el=document.createElement("div");el.className="trk-top"+(on?" on":"");el.setAttribute("role","status");el.title=txt;
  el.innerHTML=`<span class="trk-top-dot" aria-hidden="true"></span><span class="trk-top-txt">${esc(txt)}</span><b class="trk-top-route mono">✈ ${esc(r.dep)} → ${esc(r.arr)}</b>`;
  btn.className="btn small trk-top-btn";el.append(btn);title.after(el);top.classList.add("has-trk")}
if(typeof render==="function"){const ttRender=render;render=function(){const r=ttRender.apply(this,arguments);try{trkTopChip()}catch(e){}return r}}
/* Ordem dos menus pela jornada do piloto: meu voo (planejar → voar → registrar), depois consulta, depois ajuda */
const NAV_ORDER=[["roster","bookings","briefing","logbook","reviews"],["fleet","map","events","catalog"],["manual","support","admin"]];
function navReorder(){const tabs=document.getElementById("tabs");if(!tabs)return;tabs.querySelectorAll(".tab-sep").forEach(s=>s.remove());
  const all=[...tabs.querySelectorAll(":scope>.tab[data-view]")],known=NAV_ORDER.flat(),used=new Set(),frag=document.createDocumentFragment();
  NAV_ORDER.forEach((group,gi)=>{const items=group.map(v=>all.find(b=>b.dataset.view===v)).filter(Boolean);
    if(gi===1)all.forEach(b=>{if(!known.includes(b.dataset.view))items.push(b)});
    if(!items.length)return;if(frag.childNodes.length){const s=document.createElement("span");s.className="tab-sep";s.setAttribute("aria-hidden","true");frag.append(s)}
    items.forEach(b=>{used.add(b);frag.append(b)})});
  tabs.prepend(frag)}
if(typeof paintChrome==="function"){const noPaint=paintChrome;paintChrome=function(){const r=noPaint.apply(this,arguments);try{navReorder()}catch(e){}return r}}
