/* landrank.js — Ranking de pousos (Diário de bordo › Ranking de pilotos › Pousos) e a conquista "Pouso manteiga".
   A razão de descida no toque vem do rastreamento do voo (landing_fpm, sempre positiva). Quanto menor, mais suave. */
(function(){
 const T={
  title:["Best landings by pilot","Melhores pousos por piloto","Mejores aterrizajes por piloto","Meilleurs atterrissages par pilote","Beste Landungen je Pilot","パイロット別ベスト着陸","飞行员最佳着陆","조종사별 최고 착륙"],
  hours:["Hours","Horas","Horas","Heures","Stunden","時間","小时","시간"],
  land:["Landings","Pousos","Aterrizajes","Atterrissages","Landungen","着陸","着陆","착륙"],
  best:["Best landing","Melhor pouso","Mejor aterrizaje","Meilleur atterrissage","Beste Landung","ベスト着陸","最佳着陆","최고 착륙"],
  avg:["Average","Média","Promedio","Moyenne","Durchschnitt","平均","平均","평균"],
  n:["Measured","Medidos","Medidos","Mesurés","Gemessen","計測数","已测","측정"],
  where:["Flight","Voo","Vuelo","Vol","Flug","便","航班","항공편"],
  hint:["Touchdown rate measured by flight tracking — the lower, the smoother.","Razão de descida no toque, medida pelo rastreamento do voo — quanto menor, mais suave.","Tasa de descenso en el toque, medida por el seguimiento del vuelo — cuanto menor, más suave.","Taux de chute au toucher mesuré par le suivi du vol — plus il est bas, plus c’est doux.","Sinkrate beim Aufsetzen aus dem Flug-Tracking — je niedriger, desto sanfter.","フライト追跡で計測した接地時の降下率。小さいほどスムーズ。","由航班跟踪测得的接地下降率——越小越平稳。","비행 추적으로 측정한 접지 시 강하율 — 낮을수록 부드럽습니다."],
  none:["No landings measured in this period yet. Landings are measured on flights with tracking on.","Nenhum pouso medido neste período. Os pousos são medidos nos voos com rastreamento ativo.","Aún no hay aterrizajes medidos en este período. Se miden en los vuelos con seguimiento activo.","Aucun atterrissage mesuré sur cette période. Ils sont mesurés sur les vols suivis.","Noch keine gemessenen Landungen in diesem Zeitraum. Gemessen wird bei Flügen mit Tracking.","この期間に計測された着陸はまだありません。追跡を有効にした便で計測されます。","此期间尚无测得的着陆。开启跟踪的航班才会测量。","이 기간에 측정된 착륙이 아직 없습니다. 추적을 켠 비행에서 측정됩니다."],
  c_butter:["Butter","Manteiga","Mantequilla","Beurre","Butterweich","バター","黄油","버터"],
  c_soft:["Smooth","Suave","Suave","Doux","Sanft","スムーズ","平稳","부드러움"],
  c_norm:["Normal","Normal","Normal","Normal","Normal","普通","正常","보통"],
  c_firm:["Firm","Firme","Firme","Ferme","Fest","やや強め","偏硬","단단함"],
  c_hard:["Hard","Duro","Duro","Dur","Hart","ハード","重着陆","거침"]};
 const lt=k=>(T[k][LANGS.indexOf(lang)]||T[k][0]);
 /* conquista nova (aparece no Diário de bordo junto com as outras) */
 if(typeof L!=="undefined"){L.bd_butter=["Butter landing","Pouso manteiga","Aterrizaje mantequilla","Atterrissage beurre","Butterweiche Landung","バター着陸","黄油着陆","버터 착륙"];
  L.bd_butter_d=["Touch down at 100 fpm or less on a tracked flight","Pouse a 100 fpm ou menos num voo rastreado","Aterriza a 100 fpm o menos en un vuelo con seguimiento","Posez-vous à 100 fpm ou moins sur un vol suivi","Landen Sie mit höchstens 100 fpm bei einem getrackten Flug","追跡フライトで100fpm以下で接地","在跟踪航班中以 100 fpm 或更低接地","추적 비행에서 100fpm 이하로 접지"]}
 const okF=f=>(typeof counts!=="function"||counts(f))&&Number.isFinite(f.landingFpm)&&f.landingFpm>0;
 if(typeof pilotStats==="function"){const o=pilotStats;pilotStats=function(pid){const s=o.apply(this,arguments);try{const v=data.flights.filter(f=>f.pilotId===pid&&okF(f)).map(f=>f.landingFpm);s.bestFpm=v.length?Math.min(...v):null}catch(e){}return s}}
 if(typeof BADGES!=="undefined"&&!BADGES.some(b=>b.k==="butter")){BADGES.push({k:"butter",ok:s=>s.bestFpm!=null&&s.bestFpm<=100});if(typeof BADGE_ICON!=="undefined")BADGE_ICON.butter="🧈"}
 const cat=v=>v<=100?["c_butter","ok","🧈"]:v<=200?["c_soft","ok",""]:v<=350?["c_norm","neutral",""]:v<=500?["c_firm","warn",""]:["c_hard","bad",""];
 const chip=v=>{const c=cat(v);return`<span class="lr-chip ${c[1]}">${c[2]?c[2]+" ":""}${esc(lt(c[0]))}</span>`};
 let KIND="hours";
 const kindSeg=()=>`<div class="seg lr-kind" role="group">${["hours","land"].map(k=>`<button data-action="lr-kind" data-v="${k}" aria-pressed="${KIND===k}">${k==="land"?"🛬 ":"⏱ "}${esc(lt(k))}</button>`).join("")}</div>`;
 function landHTML(){const from=periodStart(lbPeriod),m={};
  for(const f of data.flights){if(f.createdAt<from||!okF(f))continue;const r=m[f.pilotId]=m[f.pilotId]||{p:f.pilotId,best:Infinity,sum:0,n:0,bf:null};r.sum+=f.landingFpm;r.n++;if(f.landingFpm<r.best){r.best=f.landingFpm;r.bf=f}}
  const list=Object.values(m).sort((a,b)=>a.best-b.best||a.sum/a.n-b.sum/b.n);
  const seg=`<div class="seg">${["all","year","30d"].map(k=>`<button data-action="lb-period" data-v="${k}" aria-pressed="${lbPeriod===k}">${t("lb_p_"+k)}</button>`).join("")}</div>`;
  return`<div class="panel"><div class="sec-head">${kindSeg()}<span class="muted" style="font-size:.85rem;flex:1;min-width:200px">${esc(lt("hint"))}</span>${seg}</div>
   ${list.length?`<div class="scroll"><table class="lb-t lr-t"><thead><tr><th class="num">#</th><th>${t("lb_pilot")}</th><th class="num">${esc(lt("best"))}</th><th></th><th class="num">${esc(lt("avg"))}</th><th class="num">${esc(lt("n"))}</th><th>${esc(lt("where"))}</th></tr></thead><tbody>
   ${list.map((r,i)=>{const f=r.bf,a=f&&acById(f.aircraftId);return`<tr class="${r.p===myId?"is-me":""}"><td class="num mono">${i<3?["🥇","🥈","🥉"][i]:i+1}</td><td><button class="linkish" data-action="lb-pilot" data-p="${esc(r.p)}">${esc(names[r.p]||pilot(r.p)||"—")}</button> ${typeof rankChip==="function"?rankChip(r.p):""}</td><td class="num mono"><b>${r.best} fpm</b></td><td>${chip(r.best)}</td><td class="num mono">${Math.round(r.sum/r.n)} fpm</td><td class="num mono">${r.n}</td><td class="mono muted">${f?`${esc(f.dep)} → ${esc(f.arr)}${a?` · ${esc(a.registration)}`:""} · ${dateF(f.createdAt)}`:""}</td></tr>`}).join("")}</tbody></table></div>`
   :`<p class="muted" style="margin:0">${esc(lt("none"))}</p>`}</div>`}
 if(typeof lbRanking==="function"){const o=lbRanking;lbRanking=function(){if(KIND==="land")return landHTML();
  const h=o.apply(this,arguments);return h.replace('<div class="panel"><div class="sec-head">','<div class="panel"><div class="sec-head">'+kindSeg())}}
 if(typeof render==="function"){const lrRender=render;render=function(){const r=lrRender.apply(this,arguments);try{if(view==="logbook"&&lbTab==="ranking"&&KIND==="land"){const h=document.querySelector("#view>.sec-head h2");if(h)h.textContent=lt("title")}}catch(e){}return r}}
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action="lr-kind"]');if(!b)return;KIND=b.dataset.v;render()});
})();
