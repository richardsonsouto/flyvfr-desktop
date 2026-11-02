/* fleetview.js — Página da Frota mais informativa:
   1. totais que seguem os filtros (aeronaves, disponíveis agora, em voo, reservadas em 24 h, restrição/solo);
   2. filtros numa fileira só (região, companhia, tipo, situação, ordenação, busca, favoritas);
   3. linha de uma altura só: matrícula, tipo, onde está, último voo/próximo evento, histórico e situação;
   4. agrupamento por modelo;
   5. resumo no livro técnico (onde está, quando fica livre, próxima reserva, último piloto). */
let fType="all",fSort="recent";
const FV_T={
 fv_total:["aircraft","aeronaves","aeronaves","avions","Flugzeuge","機","架飞机","대"],
 fv_avail:["available now","disponíveis agora","disponibles ahora","disponibles maintenant","jetzt verfügbar","現在利用可能","当前可用","지금 이용 가능"],
 fv_fly:["in flight now","em voo agora","en vuelo ahora","en vol maintenant","jetzt in der Luft","飛行中","正在飞行","비행 중"],
 fv_res:["booked (next 24 h)","reservadas (24 h)","reservadas (24 h)","réservés (24 h)","gebucht (24 h)","予約済み(24時間)","已预订(24 小时)","예약됨 (24시간)"],
 fv_bad:["restricted / grounded","restrição / solo","restricción / en tierra","restriction / au sol","Einschränkung / am Boden","制限 / 地上待機","受限 / 停场","제한 / 지상"],
 fv_region:["Region","Região","Región","Région","Region","地域","地区","지역"],
 fv_all_regions:["All regions","Todas as regiões","Todas las regiones","Toutes les régions","Alle Regionen","すべての地域","所有地区","모든 지역"],
 fv_all_types:["All types","Todos os tipos","Todos los tipos","Tous les types","Alle Typen","すべての機種","所有机型","모든 기종"],
 fv_sort:["Sort","Ordenar","Ordenar","Trier","Sortieren","並べ替え","排序","정렬"],
 fv_sort_recent:["Recently flown","Voadas recentemente","Voladas recientemente","Volés récemment","Zuletzt geflogen","最近飛行","最近飞行","최근 비행"],
 fv_sort_most:["Most flown","Mais voadas","Más voladas","Les plus volés","Am meisten geflogen","飛行回数順","飞行最多","가장 많이 비행"],
 fv_sort_avail:["Available first","Disponíveis primeiro","Disponibles primero","Disponibles d'abord","Verfügbare zuerst","利用可能を先に","可用优先","이용 가능 우선"],
 fv_sort_reg:["Registration","Matrícula","Matrícula","Immatriculation","Kennzeichen","登録記号","注册号","등록 번호"],
 fv_h_reg:["Registration","Matrícula","Matrícula","Immatriculation","Kennzeichen","登録記号","注册号","등록 번호"],
 fv_h_type:["Type","Tipo","Tipo","Type","Typ","機種","机型","기종"],
 fv_h_pos:["Where it is","Onde está","Dónde está","Où il est","Wo es steht","現在地","所在位置","위치"],
 fv_h_last:["Last flight / next event","Último voo / próximo evento","Último vuelo / próximo evento","Dernier vol / prochain événement","Letzter Flug / nächstes Ereignis","前回の飛行 / 次の予定","上次飞行 / 下一事件","최근 비행 / 다음 일정"],
 fv_h_hist:["History","Histórico","Historial","Historique","Verlauf","履歴","历史","이력"],
 fv_h_st:["Status","Situação","Situación","Statut","Status","状況","状态","상태"],
 fv_ago:["{x} ago","há {x}","hace {x}","il y a {x}","vor {x}","{x}前","{x}前","{x} 전"],
 fv_never:["never flown on VFR","nunca voada no VFR","nunca volada en VFR","jamais volé sur VFR","noch nie auf VFR geflogen","VFRでの飛行なし","尚未在 VFR 飞行","VFR 비행 기록 없음"],
 fv_flying:["in flight · arrives {t}","em voo · chega {t}","en vuelo · llega {t}","en vol · arrivée {t}","in der Luft · Ankunft {t}","飛行中・到着 {t}","飞行中 · {t} 到达","비행 중 · {t} 도착"],
 fv_next:["next booking {t}","próxima reserva {t}","próxima reserva {t}","prochaine réservation {t}","nächste Buchung {t}","次の予約 {t}","下次预订 {t}","다음 예약 {t}"],
 fv_st_fly:["In flight","Em voo","En vuelo","En vol","In der Luft","飛行中","飞行中","비행 중"],
 fv_st_res:["Booked {t}","Reservada {t}","Reservada {t}","Réservé {t}","Gebucht {t}","予約 {t}","已预订 {t}","예약 {t}"],
 fv_st_new:["No history","Sem histórico","Sin historial","Sans historique","Ohne Verlauf","履歴なし","无记录","기록 없음"],
 fv_st_ok:["Available","Disponível","Disponible","Disponible","Verfügbar","利用可能","可用","이용 가능"],
 fv_grp:["{n} aircraft · {k} available","{n} aeronaves · {k} disponíveis","{n} aeronaves · {k} disponibles","{n} avions · {k} disponibles","{n} Flugzeuge · {k} verfügbar","{n}機・利用可能 {k}","{n} 架 · {k} 架可用","{n}대 · 이용 가능 {k}대"],
 fv_grp1:["1 aircraft · {k} available","1 aeronave · {k} disponível","1 aeronave · {k} disponible","1 avion · {k} disponible","1 Flugzeug · {k} verfügbar","1機・利用可能 {k}","1 架 · {k} 架可用","1대 · 이용 가능 {k}대"],
 fv_hist:["{n} flights · {h} h","{n} voos · {h} h","{n} vuelos · {h} h","{n} vols · {h} h","{n} Flüge · {h} h","{n}便・{h} h","{n} 次 · {h} 小时","{n}회 · {h}시간"],
 fv_hist1:["1 flight · {h} h","1 voo · {h} h","1 vuelo · {h} h","1 vol · {h} h","1 Flug · {h} h","1便・{h} h","1 次 · {h} 小时","1회 · {h}시간"],
 fv_f_where:["Where it is","Onde está","Dónde está","Où il est","Wo es steht","現在地","所在位置","위치"],
 fv_f_free:["Available","Disponível","Disponible","Disponible","Verfügbar","利用可能","可用","이용 가능"],
 fv_f_now:["now","agora","ahora","maintenant","jetzt","今すぐ","现在","지금"],
 fv_f_from:["from {t}","a partir de {t}","desde {t}","à partir de {t}","ab {t}","{t}以降","{t} 起","{t}부터"],
 fv_f_next:["Next booking","Próxima reserva","Próxima reserva","Prochaine réservation","Nächste Buchung","次の予約","下次预订","다음 예약"],
 fv_f_pilot:["Last pilot","Último piloto","Último piloto","Dernier pilote","Letzter Pilot","前回のパイロット","上次飞行员","최근 조종사"],
 fv_none:["none","nenhuma","ninguna","aucune","keine","なし","无","없음"]
};
const fvt=(k,p)=>{const r=FV_T[k];let s=r?(r[LANGS.indexOf(lang)]||r[0]):k;if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
function fvAgo(ms){const m=Math.max(1,Math.round((Date.now()-ms)/6e4));const x=m<60?m+" min":m<24*60?Math.round(m/60)+" h":Math.round(m/1440)+" d";return fvt("fv_ago",{x})}
const fvHM=ms=>tf.format(ms),fvDay=ms=>{const d=new Date(ms),n=new Date();return d.toDateString()===n.toDateString()?tf.format(ms):dfShort(ms)+" "+tf.format(ms)};
const fvArr=r=>r.end-(r.rosterId?25*6e4:0),fvDep=r=>r.start+(r.rosterId?20*6e4:0);
/* estatísticas de voo por aeronave (uma passada por render) */
function fvStats(){const m={};for(const f of data.flights){const s=m[f.aircraftId]=m[f.aircraftId]||{n:0,min:0,last:null};s.n++;s.min+=f.blockMin||0;if(!s.last||f.createdAt>s.last.createdAt)s.last=f}return m}
/* situação "de uso" da aeronave: AOG/MEL (statusOf) > em voo > reservada em 24 h > sem histórico > disponível */
function fvState(a,st,S){const now=Date.now();
  if(st.key==="bad")return{k:"bad"};
  const fl=flyingNow(a.id);if(fl)return{k:"fly",r:fl,warn:st.key==="warn"};
  const nx=nextAfter(a.id,now);if(nx&&nx.start<now+24*36e5)return{k:"res",r:nx,warn:st.key==="warn"};
  if(st.key==="warn")return{k:"warn",nx};
  if(!(S[a.id]&&S[a.id].n)&&!posNow(a.id))return{k:"new",nx};
  return{k:"ok",nx}}
function fvPill(v,st){
  if(v.k==="bad"||v.k==="warn")return`<span class="pill ${st.key}">${stLabel(st.key)}</span>`;
  if(v.k==="fly")return`<span class="pill fv-fly">${fvt("fv_st_fly")}</span>`;
  if(v.k==="res")return`<span class="pill fv-res">${fvt("fv_st_res",{t:fvHM(fvDep(v.r))})}</span>`;
  if(v.k==="new")return`<span class="pill fv-new">${fvt("fv_st_new")}</span>`;
  return`<span class="fv-ok">${fvt("fv_st_ok")}</span>`}
function fvLine(a,st,v,S){
  if(st.key==="bad"||st.key==="warn")return acRowLine(a,st);
  if(v.k==="fly")return`${esc(fvt("fv_flying",{t:fvHM(fvArr(v.r))}))} · ${esc(pilot(v.r.pilotId))}`;
  const l=S[a.id]&&S[a.id].last;
  const last=l?`<span class="mono">${esc(l.dep)} → ${esc(l.arr)}</span> · ${esc(fvAgo(l.createdAt))}`:`<span class="muted">${esc(fvt("fv_never"))}</span>`;
  if(v.k==="res")return`${last} <span class="muted">· ${esc(pilot(v.r.pilotId))}</span>`;
  return v.nx?`${last} <span class="muted">· ${esc(fvt("fv_next",{t:fvDay(fvDep(v.nx))}))}</span>`:last}
const fvHist=(a,S)=>{const s=S[a.id];return s&&s.n?fvt(s.n===1?"fv_hist1":"fv_hist",{n:s.n,h:Math.round(s.min/60)}):fvt("fv_hist",{n:0,h:0}).replace(/ · .*$/,"")};

viewFleet=function(){
  if(!db||!loaded.fleets||!loaded.aircraft)return offline();
  const add=`<button class="btn primary" data-action="new-aircraft" ${canWrite===false?"disabled":""}>${t("add_aircraft")}</button>`;
  if(!fleet.length)return`<div class="empty"><span class="eyebrow">${t("empty_eyebrow")}</span><h2>${t("empty_title")}</h2><p>${t("empty_body")}</p>${add}</div>`;
  if(!LIVERIES)loadLiveries();
  const S=fvStats(),st={},V={};fleet.forEach(a=>{st[a.id]=statusOf(a.id);V[a.id]=fvState(a,st[a.id],S)});
  const q=fQuery.trim().toUpperCase(),al=airlines();
  const geo=a=>(fRegion==="all"||regionOf(a.airline)===fRegion)&&(fAirline==="all"||a.airline===fAirline);
  const base=fleet.filter(a=>(!fFav||isFav(a.id))&&geo(a)&&(fType==="all"||a.type===fType)&&(!q||a.registration.includes(q)||a.type.toUpperCase().includes(q)||(q.length>=3&&posNow(a.id)===q)));
  const list=base.filter(a=>fStatus==="all"||st[a.id].key===fStatus);
  const last=a=>(S[a.id]&&S[a.id].last?S[a.id].last.createdAt:0),avail={ok:0,new:1,res:2,fly:3,warn:4,bad:5};
  const cmp={recent:(a,b)=>last(b)-last(a),most:(a,b)=>((S[b.id]||{}).min||0)-((S[a.id]||{}).min||0),avail:(a,b)=>avail[V[a.id].k]-avail[V[b.id].k],reg:()=>0}[fSort]||(()=>0);
  list.sort((a,b)=>(isFav(b.id)-isFav(a.id))||cmp(a,b)||a.registration.localeCompare(b.registration));
  const nFav=fleet.filter(a=>isFav(a.id)).length,shown=list.slice(0,fLimit);
  /* 1. totais da seleção */
  const kOk=base.filter(a=>V[a.id].k==="ok"||V[a.id].k==="new").length,kFly=base.filter(a=>V[a.id].k==="fly").length,kRes=base.filter(a=>V[a.id].k==="res").length,kBad=base.filter(a=>st[a.id].key!=="ok").length;
  const scope=fAirline!=="all"?fAirline:fRegion!=="all"?t("reg_"+fRegion):fvt("fv_total");
  const kpi=(n,l,c)=>`<div class="fv-kpi ${c}"><b>${n}</b><span>${esc(l)}</span></div>`;
  /* 2. filtros */
  const regions=["all",...regionsSorted().filter(r=>al.some(x=>regionOf(x)===r))];
  const als=al.filter(x=>fRegion==="all"||regionOf(x)===fRegion);
  const types=[...new Set(fleet.filter(geo).map(a=>a.type))].sort();if(fType!=="all"&&!types.includes(fType))fType="all";
  const opt=(v,l,cur)=>`<option value="${esc(v)}" ${cur===v?"selected":""}>${esc(l)}</option>`;
  return`<div class="sec-head"><div><span class="eyebrow">${t("fleet_eyebrow")}</span><h2>${t("fleet_title")}</h2></div>${add}</div>
   <div class="fv-kpis">${kpi(base.length,scope,"")}${kpi(kOk,fvt("fv_avail"),"ok")}${kpi(kFly,fvt("fv_fly"),"fly")}${kpi(kRes,fvt("fv_res"),"res")}${kpi(kBad,fvt("fv_bad"),"bad")}</div>
   <div class="filters fv-filters">
     <select id="fv-region" aria-label="${esc(fvt("fv_region"))}">${regions.map(r=>opt(r,(r==="all"?fvt("fv_all_regions"):t("reg_"+r))+" ("+(r==="all"?fleet.length:fleet.filter(a=>regionOf(a.airline)===r).length)+")",fRegion)).join("")}</select>
     <span class="fv-al">${fAirline!=="all"?alSym(fAirline):""}<select id="fv-airline" aria-label="${esc(t("airline"))}">${opt("all",t("all_airlines"),fAirline)}${als.map(x=>opt(x,x+" ("+fleet.filter(a=>a.airline===x).length+")",fAirline)).join("")}</select></span>
     <select id="fv-type" aria-label="${esc(fvt("fv_h_type"))}">${opt("all",fvt("fv_all_types"),fType)}${types.map(x=>opt(x,x,fType)).join("")}</select>
     <select id="f-status" aria-label="Status">${opt("all",t("status_all"),fStatus)}${["ok","warn","bad"].map(k=>opt(k,stLabel(k),fStatus)).join("")}</select>
     <select id="fv-sort" aria-label="${esc(fvt("fv_sort"))}">${["recent","most","avail","reg"].map(k=>opt(k,fvt("fv_sort")+": "+fvt("fv_sort_"+k),fSort)).join("")}</select>
     <input id="f-q" type="search" placeholder="${t("search_ph")}" value="${esc(fQuery)}" autocomplete="off">
     <button class="btn small fav-filter" data-action="f-fav" aria-pressed="${fFav}">${STAR} ${t("fav_filter",{n:nFav})}</button>
   </div>
   ${fFav?`<div class="notice fav-note"><span>${STAR} ${t("fav_showing",{n:nFav})}</span><button class="btn small" data-action="f-fav">${t("fav_show_all")}</button></div>`:""}
   ${splitFleet()?fleetSplit(list,shown):`${list.length?`<div class="fleet">${shown.map(acCard).join("")}</div>`:`<p class="muted">${t("no_match")}</p>`}
   ${list.length>shown.length?`<button class="btn more" data-action="more">${t("show_more",{n:Math.min(60,list.length-shown.length)})} · ${t("showing",{a:shown.length,b:list.length})}</button>`:""}`}`;
};

/* cidade do aeródromo onde a aeronave está parada (abaixo do código) */
function fvCity(id){if(flyingNow(id)||movingNow(id))return"";const p=posNow(id),A=p&&typeof AIRPORTS!=="undefined"&&AIRPORTS?AIRPORTS[p]:null;return A&&A[4]?`<small class="fv-city">${esc(A[4])}</small>`:""}
fleetSplit=function(list,shown){
  if(!list.length)return`<p class="muted">${t("no_match")}</p>`;
  if(!selAc||!list.some(a=>a.id===selAc))selAc=list[0].id;
  const S=fvStats(),showAl=fAirline==="all";
  const row=a=>{const s=statusOf(a.id),v=fvState(a,s,S);
    return`<div class="frow fvrow s-${s.key}${a.id===selAc?" sel":""}" role="button" tabindex="0" data-action="open-aircraft" data-id="${esc(a.id)}" aria-pressed="${a.id===selAc}">
      ${favBtn(a.id)}<span class="fr-reg"><span class="sym-slot">${showAl?alSym(a.airline):""}</span><span class="plate al-plate${plLen(a.registration)}"${plateStyle(a.airline)}>${esc(a.registration)}</span></span>
      <span class="fr-type"><b>${esc(a.type)}</b>${showAl?`<span class="muted">${esc(a.airline||"")}</span>`:""}</span>
      <span class="mono fr-pos">${posChip(a.id)}${fvCity(a.id)}</span>
      <span class="fr-last">${fvLine(a,s,v,S)}</span>
      <span class="mono fr-hist">${esc(fvHist(a,S))}</span>
      <span class="fr-st">${fvPill(v,s)}</span></div>`};
  /* 4. agrupado por modelo (na ordem em que aparecem na lista ordenada) */
  const groups=new Map();for(const a of shown){if(!groups.has(a.type))groups.set(a.type,[]);groups.get(a.type).push(a)}
  const grouped=groups.size>1||fType!=="all"||fAirline!=="all";
  const body=grouped?[...groups].map(([ty,arr])=>{const all=list.filter(a=>a.type===ty),k=all.filter(a=>{const v=fvState(a,statusOf(a.id),S).k;return v==="ok"||v==="new"}).length;
    return`<div class="fv-grp" role="presentation"><b>${esc(ty)}</b><span class="muted">${esc(fvt(all.length===1?"fv_grp1":"fv_grp",{n:all.length,k}))}</span></div>${arr.map(row).join("")}`}).join(""):shown.map(row).join("");
  const headRow=`<div class="fv-head" aria-hidden="true"><span></span><span>${fvt("fv_h_reg")}</span><span>${fvt("fv_h_type")}</span><span>${fvt("fv_h_pos")}</span><span>${fvt("fv_h_last")}</span><span>${fvt("fv_h_hist")}</span><span>${fvt("fv_h_st")}</span></div>`;
  return`<div class="fleet-split">
    <div class="ftable panel" role="list">${headRow}${body}
      ${list.length>shown.length?`<button class="btn more" data-action="more">${t("show_more",{n:Math.min(60,list.length-shown.length)})} · ${t("showing",{a:shown.length,b:list.length})}</button>`:""}</div>
    <aside class="detail panel" aria-label="${t("techlog")}">${fvDetail(selAc)}</aside></div>`;
};

/* 5. resumo no livro técnico */
function fvFacts(id){const a=acById(id);if(!a)return"";const S=fvStats(),s=statusOf(id),v=fvState(a,s,S),now=Date.now();
  const here=posNow(id)||locAt(id,now),pos=flyingNow(id)?`✈ ${esc(flyingNow(id).dep)} → ${esc(flyingNow(id).arr)}`:here?`📍 ${esc(here)}`:"—";
  let free;if(s.key==="bad")free=fvt("fv_f_from",{t:fmt(s.until)});else if(v.k==="fly")free=fvt("fv_f_from",{t:fmt(v.r.end)});else free=fvt("fv_f_now");
  const nx=nextAfter(id,now),l=S[id]&&S[id].last;
  const cell=(k,val,cls)=>`<div><span>${fvt(k)}</span><b class="${cls||""}">${val}</b></div>`;
  return`<div class="fv-facts">${cell("fv_f_where",pos)}${cell("fv_f_free",esc(free),s.key==="bad"||v.k==="fly"?"":"fv-good")}${cell("fv_f_next",nx?esc(fmt(fvDep(nx))):esc(fvt("fv_none")))}${cell("fv_f_pilot",l?esc(pilot(l.pilotId)):"—")}</div>`}
function fvDetail(id){const h=acDetailHTML(id,true);const a=h.indexOf('<div class="ac-type">'),i=a<0?-1:h.indexOf('</span></div>',a);return i<0?h:h.slice(0,i+13)+fvFacts(id)+h.slice(i+13)}

document.addEventListener("change",e=>{const id=e.target.id;if(!["fv-region","fv-airline","fv-type","fv-sort"].includes(id))return;
  const v=e.target.value;if(id==="fv-region"){fleetGeoVersion++;fRegion=v;fAirline="all";fType="all"}else if(id==="fv-airline"){fleetGeoVersion++;fAirline=v;fType="all"}else if(id==="fv-type")fType=v;else fSort=v;
  fLimit=60;render()});
