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
