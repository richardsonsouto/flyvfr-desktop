/* ops.js — "Operações": central de operações da companhia (abre na favorita do piloto).
   • Topo nas cores da companhia + seletor; números: frota, disponíveis, no ar, AOG/MEL, voos e horas da semana.
   • Mapa (Leaflet) com aeronaves por aeroporto, paradas por pane e voos no ar, em três modos:
       Agora · Replay das últimas 24 h (animação cronológica com linha do tempo, velocidade e controle deslizante)
       · Próximas 6 h (partidas RPL reais da companhia).
     VATSIM/IVAO (indicativo da companhia) aparecem no modo Agora; no replay, só o que foi visto com a tela aberta.
   • No ar agora, próximas partidas RPL, ranking da semana, manutenção e eventos. */
(function(){
 if(typeof viewFleet!=="function")return;
 const T={
  nav:["Operations","Operações","Operaciones","Opérations","Betrieb","運航","运营","운항"],
  k:["Operations center","Central de operações","Centro de operaciones","Centre des opérations","Betriebszentrale","運航センター","运营中心","운항 센터"],
  sub:["{n} aircraft in the virtual fleet · updated {t}","{n} aeronaves na frota virtual · atualizado {t}","{n} aeronaves en la flota virtual · actualizado {t}","{n} avions dans la flotte virtuelle · mis à jour {t}","{n} Flugzeuge in der virtuellen Flotte · aktualisiert {t}","仮想機材 {n} 機 · 更新 {t}","虚拟机队 {n} 架 · 更新于 {t}","가상 기단 {n}대 · {t} 업데이트"],
  fleet:["Fleet","Frota","Flota","Flotte","Flotte","機材","机队","기단"],
  avail:["Available","Disponíveis","Disponibles","Disponibles","Verfügbar","利用可能","可用","가용"],
  availS:["ready for a roster","prontas para escala","listas para programar","prêts pour une rotation","bereit für Umlauf","スケジュール可能","可排班","스케줄 가능"],
  air:["In the air","No ar agora","En el aire","En vol","In der Luft","飛行中","正在飞行","비행 중"],
  aog:["Grounded (AOG)","Paradas (AOG)","En tierra (AOG)","Immobilisés (AOG)","AOG","運航停止 (AOG)","停场 (AOG)","운항 불가 (AOG)"],
  melS:["+ {n} with MEL item","+ {n} com item MEL","+ {n} con ítem MEL","+ {n} avec item MEL","+ {n} mit MEL","+ MEL {n} 機","+ {n} 架有 MEL","+ MEL {n}대"],
  wkF:["Flights this week","Voos na semana","Vuelos en la semana","Vols cette semaine","Flüge diese Woche","今週の便数","本周航班","이번 주 비행"],
  wkH:["Hours this week","Horas na semana","Horas en la semana","Heures cette semaine","Stunden diese Woche","今週の時間","本周小时","이번 주 시간"],
  vsPrev:["{d} vs last week","{d} vs semana passada","{d} vs semana pasada","{d} vs semaine passée","{d} ggü. Vorwoche","前週比 {d}","较上周 {d}","지난주 대비 {d}"],
  pilots:["{n} active pilots","{n} pilotos ativos","{n} pilotos activos","{n} pilotes actifs","{n} aktive Piloten","アクティブ {n} 人","{n} 名活跃飞行员","활동 조종사 {n}명"],
  startHere:["Start roster here","Iniciar escala daqui","Iniciar escala aquí","Commencer ici","Dienstplan hier starten","ここから開始","从此航班开始","여기서 일정 시작"],
  outside:["Outside 30–90 min","Fora da janela de 30–90 min","Fuera de 30–90 min","Hors fenêtre 30–90 min","Außerhalb von 30–90 Min.","30～90分の範囲外","不在30–90分钟内","30–90분 범위 밖"],
  noPlane:["No eligible aircraft","Sem aeronave compatível disponível","Sin aeronave compatible disponible","Aucun avion compatible disponible","Kein passendes Flugzeug verfügbar","適合機なし","无可用匹配飞机","적합한 항공기 없음"],
  where:["Where the fleet is","Onde está a frota","Dónde está la flota","Où est la flotte","Wo die Flotte ist","機材の位置","机队位置","기단 위치"],
  mNow:["Now","Agora","Ahora","Maintenant","Jetzt","現在","现在","지금"],
  mRep:["Replay 24 h","Replay 24 h","Repetición 24 h","Replay 24 h","Replay 24 h","24 時間リプレイ","24 小时回放","24시간 리플레이"],
  mRpl:["Next 6 h (RPL)","Próximas 6 h (RPL)","Próximas 6 h (RPL)","6 h à venir (RPL)","Nächste 6 h (RPL)","今後 6 時間 (RPL)","未来 6 小时 (RPL)","향후 6시간 (RPL)"],
  feed:["Timeline","Linha do tempo","Línea de tiempo","Chronologie","Zeitachse","タイムライン","时间线","타임라인"],
  dep:["departed","decolou","despegó","a décollé","gestartet","出発","起飞","출발"],
  arr:["landed at","pousou em","aterrizó en","a atterri à","gelandet in","到着","降落于","도착"],
  noEv:["No movement in this period.","Nenhum movimento neste período.","Sin movimientos en este período.","Aucun mouvement sur cette période.","Keine Bewegungen in diesem Zeitraum.","この期間の動きはありません。","此期间没有动态。","이 기간에 움직임이 없습니다."],
  inAir:["in the air","no ar","en el aire","en vol","in der Luft","飛行中","在飞","비행 중"],
  lands:["landings","pousos","aterrizajes","atterrissages","Landungen","着陸","降落","착륙"],
  replay:["replay","replay","repetición","replay","Replay","リプレイ","回放","리플레이"],
  planned:["planned (RPL)","previsto (RPL)","previsto (RPL)","prévu (RPL)","geplant (RPL)","予定 (RPL)","计划 (RPL)","예정 (RPL)"],
  live:["live","ao vivo","en vivo","en direct","live","ライブ","实时","실시간"],
  nowMk:["now","agora","ahora","maintenant","jetzt","現在","现在","지금"],
  flightsN:["{n} flights","{n} voos","{n} vuelos","{n} vols","{n} Flüge","{n} 便","{n} 个航班","{n}편"],
  airList:["In the air now","No ar agora","En el aire ahora","En vol maintenant","Jetzt in der Luft","現在飛行中","正在飞行","지금 비행 중"],
  airNone:["Nobody flying for this airline right now.","Ninguém voando por esta companhia agora.","Nadie vuela por esta aerolínea ahora.","Personne ne vole pour cette compagnie.","Gerade fliegt niemand für diese Airline.","この航空会社で飛行中の便はありません。","该航空公司目前没有航班在飞。","이 항공사로 비행 중인 사람이 없습니다."],
  rpl:["Next RPL departures","Próximas partidas RPL","Próximas salidas RPL","Prochains départs RPL","Nächste RPL-Abflüge","次の RPL 出発","即将出发的 RPL","다음 RPL 출발"],
  rplNone:["No RPL departures for this airline in the next 30–90 minutes.","Nenhuma partida RPL desta companhia na janela de 30–90 minutos.","Sin salidas RPL de esta aerolínea entre 30 y 90 minutos desde ahora.","Aucun départ RPL de cette compagnie dans la fenêtre de 30 à 90 minutes.","Keine RPL-Abflüge dieser Airline im Zeitfenster von 30 bis 90 Minuten.","この航空会社には30～90分後に出発するRPL便がありません。","该航司在未来30至90分钟内无RPL航班起飞。","이 항공사는 지금부터 30~90분 사이에 출발하는 RPL 항공편이 없습니다."],
  free:["open","livre","libre","libre","frei","空き","空闲","가능"],
  taken:["rostered","escalado","programado","planifié","eingeplant","割当済","已排班","배정됨"],
  build:["Build roster","Montar escala","Armar programación","Créer une rotation","Umlauf erstellen","スケジュール作成","生成排班","스케줄 만들기"],
  rank:["Weekly ranking","Ranking da semana","Ranking de la semana","Classement de la semaine","Wochenranking","今週のランキング","本周排名","주간 순위"],
  rankNone:["No flights this week yet.","Nenhum voo nesta semana ainda.","Aún no hay vuelos esta semana.","Aucun vol cette semaine.","Noch keine Flüge diese Woche.","今週のフライトはまだありません。","本周还没有航班。","이번 주 비행이 아직 없습니다."],
  best:["🧈 Best landing of the week: {p} · {v} fpm","🧈 Melhor pouso da semana: {p} · {v} fpm","🧈 Mejor aterrizaje de la semana: {p} · {v} fpm","🧈 Meilleur atterrissage : {p} · {v} fpm","🧈 Beste Landung der Woche: {p} · {v} fpm","🧈 今週のベスト着陸: {p} · {v} fpm","🧈 本周最佳着陆：{p} · {v} fpm","🧈 이번 주 최고 착륙: {p} · {v} fpm"],
  mx:["Maintenance","Manutenção","Mantenimiento","Maintenance","Wartung","整備","维修","정비"],
  mxNone:["The whole fleet is airworthy.","Toda a frota está liberada.","Toda la flota está liberada.","Toute la flotte est en état de vol.","Die ganze Flotte ist lufttüchtig.","全機運航可能です。","整个机队均适航。","전 기단 운항 가능."],
  until:["release {t}","liberação {t}","liberación {t}","remise en service {t}","Freigabe {t}","解除 {t}","放行 {t}","해제 {t}"],
  ev:["Events","Eventos","Eventos","Événements","Events","イベント","活动","이벤트"],
  evNone:["No events scheduled.","Nenhum evento marcado.","No hay eventos programados.","Aucun événement prévu.","Keine Events geplant.","予定されたイベントはありません。","暂无活动。","예정된 이벤트가 없습니다."],
  see:["see","ver","ver","voir","ansehen","見る","查看","보기"],
  map:["Open map","Abrir mapa","Abrir mapa","Ouvrir la carte","Karte öffnen","地図を開く","打开地图","지도 열기"],
  gnd:["on the ground","no solo","en tierra","au sol","am Boden","地上","在地面","지상"],
  netNote:["VATSIM/IVAO appear live; in the replay only what was seen while this screen was open.","VATSIM/IVAO aparecem ao vivo; no replay, só o que foi visto com esta tela aberta.","VATSIM/IVAO aparecen en vivo; en la repetición, solo lo visto con esta pantalla abierta.","VATSIM/IVAO en direct ; dans le replay, seulement ce qui a été vu écran ouvert.","VATSIM/IVAO live; im Replay nur, was bei geöffneter Ansicht gesehen wurde.","VATSIM/IVAO はライブ表示。リプレイには画面を開いていた間の分のみ。","VATSIM/IVAO 实时显示；回放中只有此页面打开时看到的数据。","VATSIM/IVAO는 실시간이며, 리플레이에는 이 화면을 연 동안 본 것만 나옵니다."]};
 const ot=(k,p)=>{let s=(T[k][LANGS.indexOf(lang)]||T[k][0]);if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
 if(typeof L!=="undefined")L.nav_ops=T.nav;
 if(typeof NAV_ICON!=="undefined"&&typeof _ic==="function")NAV_ICON.ops=_ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 12l5-3"/><path d="M12 3.5v2M20.5 12h-2M12 20.5v-2M3.5 12h2"/><circle cx="12" cy="12" r="1.3"/>');
 const M=6e4,H=36e5,W=7*864e5;
 const O={al:null,mode:"now",t:null,play:false,speed:300,map:null,lay:null,raf:0,last:0,net:[],netAt:0,netBusy:false,hist:{},center:null,zoom:null,fit:false};
 const eobt=r=>r.start+(r.rosterId?20*M:0),eta=r=>r.end-(r.rosterId?25*M:0);
 const ll=c=>{try{const a=AIRPORTS&&AIRPORTS[c];return a?[a[0],a[1]]:null}catch(e){return null}};
 const utc=ms=>{const d=new Date(ms);return`${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}Z`};
 const hmm=m=>`${Math.floor(m/60)}:${String(Math.round(m%60)).padStart(2,"0")}`;
 const alNow=()=>{const favorite=typeof myFavAirline==="function"?myFavAirline():"";return O.al=favorite||""};
 const ofAl=al=>{const ids=new Set(fleet.filter(a=>a.airline===al).map(a=>a.id));return ids};
 const icao=al=>String((typeof AIRLINE_ICAO!=="undefined"&&AIRLINE_ICAO[al])||"").toUpperCase();
 function pal(al){const Lv=(typeof LIVERY!=="undefined"&&LIVERY[al])||["#13202E","#2C4A6B"];let [a,b]=Lv;b=b||a;if(typeof faContrast!=="function")return{a,b,ink:"#fff"};
  const w=Math.min(faContrast(a,"#ffffff"),faContrast(b,"#ffffff")),k=Math.min(faContrast(a,"#111111"),faContrast(b,"#111111")),ink=w>=k?"#ffffff":"#111111";
  const fix=c=>{let x=c,s=0;while(faContrast(x,ink)<4.5&&s<1){s+=.05;x=faMix(c,ink==="#ffffff"?"#000000":"#ffffff",s)}return x};return{a:fix(a),b:fix(b),ink}}
 /* voos de um intervalo: [{reg,dep,arr,t0,t1,src,who}] */
 function vfrLegs(al,from,to){const ids=ofAl(al),out=[];
  for(const r of data.reservations){if(!ids.has(r.aircraftId))continue;if(!(booked(r)||r.status==="completed"))continue;const a=eobt(r),b=eta(r);if(b<from||a>to||b<=a)continue;
   if(booked(r)&&a>Date.now())continue; /* reservas futuras não entram no replay */
   const flown=data.flights.find(f=>f.reservationId===r.id);if(!flown&&b<Date.now()-2*H)continue; /* reserva que não voou */
   out.push({reg:(acById(r.aircraftId)||{}).registration||r.aircraftId,ac:r.aircraftId,dep:r.dep,arr:r.arr,t0:a,t1:b,src:"vfr",who:names[r.pilotId]||""})}
  return out.sort((x,y)=>x.t0-y.t0)}
 function departureOption(code,number,dep,arr,std,candidates){
   const [earliest,latest]=rsRplWindow();
   const labels=[code,AIRLINE_IATA[alNow()]].filter(Boolean).map(prefix=>(prefix+number).toUpperCase());
   const reserved=data.reservations.some(r=>booked(r)&&r.dep===dep&&r.arr===arr&&labels.includes(String(r.flightNo||"").replace(/\s/g,"").toUpperCase())&&Math.abs(eobt(r)-std)<M);
   if(reserved)return {reason:ot("taken")};
   if(std<earliest||std>latest)return {reason:ot("outside")};
   if(rosterMenuLocked())return {reason:t("rs_locked_title")};
   const flight=candidates.find(x=>x.code===code&&String(x.f.fno)===String(number)&&x.f.arr===arr&&x.f.std===std);
   return flight?{flight}:{reason:ot("noPlane")};
 }
 document.addEventListener("click",event=>{
   const button=event.target.closest("[data-op-start]");
   if(!button||(view!=="ops"&&view!=="roster")||RS.busy)return;
   const {code,number,dep,arr,std}=button.dataset;
   const option=departureOption(code,number,dep,arr,Number(std),rsSoonFlights(dep));
   if(!option.flight){toast(option.reason);return}
   const flight=option.flight,planes=rsPfAircraft(flight);
   Object.assign(RS,{other:false,dep,depSet:true,pf:flight,start:flight.f.std,roster:null,err:"",touched:true,
     favoriteContext:null,ac:planes.find(a=>isFav(a.id))?.id||(planes.length===1?planes[0].id:"")});
   ACP.rs.al=flight.al;ACP.rs.q="";
   rsSave();view="roster";render();window.scrollTo(0,0);
 });
 function rplLegs(al,from,to){const c=icao(al);if(typeof SCHED==="undefined"||!SCHED||!SCHED.idx||!SCHED.idx[c]||typeof realDeps!=="function")return[];const out=[];
  for(const apt in SCHED.idx[c])for(const d of realDeps(c,apt,from,to))out.push({reg:d.fno,dep:d.dep,arr:d.arr,t0:d.std,t1:d.sta,src:"rpl",typ:d.typ});
  return out.sort((x,y)=>x.t0-y.t0)}
 function range(){const now=Date.now();return O.mode==="rpl"?[now,now+6*H]:O.mode==="rep"?[now-24*H,now]:[now,now]}
 function legsNow(){const al=alNow(),[a,b]=range();if(O.mode==="rpl")return rplLegs(al,a,b);if(O.mode==="rep")return vfrLegs(al,a,b);return vfrLegs(al,Date.now()-12*H,Date.now()+H).filter(l=>l.t0<=Date.now()&&l.t1>Date.now())}
 /* rede: amostras guardadas enquanto a tela está aberta (para o replay) */
 async function netFetch(force){const al=alNow(),pre=icao(al);if(!pre||!sb||O.netBusy)return;if(!force&&Date.now()-O.netAt<30e3)return;O.netBusy=true;O.netAt=Date.now();
  try{const {data:d,error}=await sb.functions.invoke("traffic",{body:{bbox:[-90,-180,90,180],nets:["VATSIM","IVAO"],prefix:pre}});
   if(!error){O.net=((d&&d.pilots)||[]).filter(p=>new RegExp("^"+pre+"\\d").test(String(p.cs||"").toUpperCase()));const now=Date.now();
    for(const p of O.net){const h=O.hist[p.cs]=O.hist[p.cs]||[];h.push({t:now,lat:p.lat,lon:p.lon,hdg:p.hdg,net:p.net,ground:p.ground});if(h.length>400)h.shift()}}}catch(e){}finally{O.netBusy=false}
  if((view==="ops"||view==="roster")){paintLists();draw()}}
 /* ---------- mapa ---------- */
 const COL={vfr:"#F5B800",VATSIM:"#5AA0FF",IVAO:"#A99BFF",rpl:"#4FD1A5"};
 const PL=`<svg viewBox="-12 -12 24 24" width="24" height="24"><path d="M0 -10 L2.2 -2 L10 2.5 L10 4.5 L2.2 2.4 L1.6 7.5 L4.4 9.6 L4.4 11 L0 9.8 L-4.4 11 L-4.4 9.6 L-1.6 7.5 L-2.2 2.4 L-10 4.5 L-10 2.5 L-2.2 -2Z" fill="COL" stroke="#0b1825" stroke-width="1"/></svg>`;
 const brg=(a,b)=>{const dx=(b[1]-a[1])*Math.cos((a[0]+b[0])/2*Math.PI/180),dy=b[0]-a[0];return Math.atan2(dx,dy)*180/Math.PI};
 function pIcon(Lf,col,ang,lab){return Lf.divIcon({className:"op-pl",html:`<div style="transform:rotate(${Math.round(ang)}deg)">${PL.replace("COL",col)}</div>${lab?`<span>${esc(lab)}</span>`:""}`,iconSize:[24,24],iconAnchor:[12,12]})}
 function counts(t){const al=alNow(),ids=ofAl(al),cnt={},aog={};
  for(const id of ids){let at=null;try{at=t>=Date.now()-60e3?(posNow(id)||locAt(id,t)):locAt(id,t)}catch(e){}if(!at)continue;
   const busy=O.mode!=="rpl"&&vfrLegs(al,t-24*H,t+H).some(l=>l.ac===id&&l.t0<=t&&l.t1>t);if(busy)continue;
   cnt[at]=(cnt[at]||0)+1;try{if(statusOf(id).key==="bad")aog[at]=(aog[at]||0)+1}catch(e){}}
  return{cnt,aog}}
 function draw(){const m=O.map,Lf=window.L;if(!m||!O.lay||!Lf)return;O.lay.clearLayers();const t=O.t||Date.now(),legs=legsNow(),z=m.getZoom(),nAir=legs.filter(l=>l.t0<=t&&l.t1>t).length,lab=z>=6||nAir<=14;
  const {cnt,aog}=O.mode==="rpl"?{cnt:{},aog:{}}:counts(t);
  for(const c in cnt){const p=ll(c);if(!p)continue;const n=cnt[c],bad=aog[c];
   Lf.circleMarker(p,{radius:4+Math.min(12,n*1.4),color:bad?"#fff":"#7FB4F0",weight:1.2,fillColor:bad?"#B42318":"#2E7DD7",fillOpacity:bad?.9:.4}).bindTooltip(`<b>${esc(c)}</b> · ${n} ${esc(ot("gnd"))}${bad?` · ${bad} AOG`:""}`,{direction:"right",permanent:z>=5,className:"op-tt"}).addTo(O.lay)}
  let air=0,src={vfr:0,VATSIM:0,IVAO:0,rpl:0},landed=0;
  for(const l of legs){const a=ll(l.dep),b=ll(l.arr);if(!a||!b)continue;
   if(l.t1<=t){landed++;const age=t-l.t1;if(age<2*H)Lf.polyline([a,b],{color:COL[l.src],weight:1.5,opacity:.45*(1-age/(2*H)),interactive:false}).addTo(O.lay);continue}
   if(l.t0>t)continue;const p=(t-l.t0)/(l.t1-l.t0),pos=[a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p];air++;src[l.src]++;
   Lf.polyline([a,pos],{color:COL[l.src],weight:2.4,opacity:.9,interactive:false}).addTo(O.lay);Lf.polyline([pos,b],{color:COL[l.src],weight:1.4,opacity:.55,dashArray:"4 6",interactive:false}).addTo(O.lay);
   Lf.marker(pos,{icon:pIcon(Lf,COL[l.src],brg(a,b),lab?l.reg:""),zIndexOffset:500}).bindTooltip(`<b>${esc(l.reg)}</b> ${esc(l.dep)} → ${esc(l.arr)}${l.who?`<br>${esc(l.who)}`:""}${l.typ?` · ${esc(l.typ)}`:""}<br>${utc(l.t0)} → ${utc(l.t1)}`).addTo(O.lay)}
  /* VATSIM/IVAO: ao vivo, ou a amostra mais próxima do instante do replay */
  if(O.mode!=="rpl"){for(const cs in O.hist){const h=O.hist[cs];let s=null;if(O.mode==="now"){const p=O.net.find(x=>x.cs===cs);if(p)s={lat:p.lat,lon:p.lon,hdg:p.hdg,net:p.net,ground:p.ground}}
    else{for(const x of h)if(Math.abs(x.t-t)<=90e3&&(!s||Math.abs(x.t-t)<Math.abs(s.t-t)))s=x}
    if(!s||s.ground)continue;air++;src[s.net]=(src[s.net]||0)+1;Lf.marker([s.lat,s.lon],{icon:pIcon(Lf,COL[s.net]||"#5AA0FF",s.hdg||0,cs)}).bindTooltip(`<b>${esc(cs)}</b> ${esc(s.net)}`).addTo(O.lay)}}
  const box=document.getElementById("op-cnt");if(box)box.innerHTML=`<span><b>${air}</b>${esc(ot("inAir"))}</span>${O.mode==="rpl"?`<span><b style="color:${COL.rpl}">${src.rpl}</b>RPL</span>`:`<span><b style="color:${COL.vfr}">${src.vfr}</b>VFR</span><span><b style="color:${COL.VATSIM}">${src.VATSIM||0}</b>VATSIM</span><span><b style="color:${COL.IVAO}">${src.IVAO||0}</b>IVAO</span>`}${O.mode!=="now"?`<span><b>${landed}</b>${esc(ot("lands"))}</span>`:""}`;
  const ck=document.getElementById("op-clock");if(ck)ck.innerHTML=`<b class="mono">${utc(t)}</b><small>${esc(O.mode==="rpl"?ot("planned"):O.mode==="rep"?ot("replay"):ot("live"))}</small>`;
 }
 async function initMap(){const el=document.getElementById("op-map");if(!el)return;
  try{await Promise.all([loadLeaflet(),loadAirports(),typeof loadSchedule==="function"?loadSchedule():null])}catch(e){el.innerHTML=`<div class="map-loading">${esc(t("map_err"))}</div>`;return}
  if(!el.isConnected)return;el.innerHTML="";if(O.map){try{O.center=O.map.getCenter();O.zoom=O.map.getZoom();O.map.remove()}catch(e){}}
  const Lf=window.L,m=Lf.map(el,{worldCopyJump:true,minZoom:2,zoomControl:true});O.map=m;
  const base=typeof brfBaseLayers==="function"?brfBaseLayers(Lf):null;let bk=null;try{bk=localStorage.getItem("vfr-map-base")}catch(e){}
  if(base)(base[bk]||Object.values(base)[0]).addTo(m);O.lay=Lf.layerGroup().addTo(m);
  if(O.center)m.setView(O.center,O.zoom);else{const pts=[];for(const id of ofAl(alNow())){const c=posNow(id);const p=c&&ll(c);if(p)pts.push(p)}for(const l of vfrLegs(alNow(),Date.now()-24*H,Date.now()+H))for(const c of [l.dep,l.arr]){const p=ll(c);if(p)pts.push(p)}
   if(pts.length>1)m.fitBounds(pts,{padding:[30,30],maxZoom:6});else m.setView(pts[0]||[-15,-50],pts.length?6:3)}
  m.on("zoomend",()=>draw());draw();paintLists();netFetch()}
 /* ---------- listas ---------- */
 function paintLists(){const al=alNow(),ids=ofAl(al),now=Date.now();
  const vfr=vfrLegs(al,now-12*H,now+H).filter(l=>l.t0<=now&&l.t1>now),net=O.net.filter(p=>!p.ground);
  const box=document.getElementById("op-air");if(box)box.innerHTML=vfr.length||net.length?[...vfr.map(l=>`<div class="op-r"><span class="op-src vfr">VFR</span><div><b class="mono">${esc(l.reg)}</b> <span class="mono">${esc(l.dep)} → ${esc(l.arr)}</span><small>${esc(l.who)}</small><div class="op-pb"><i style="width:${Math.min(100,(now-l.t0)/(l.t1-l.t0)*100).toFixed(0)}%"></i></div></div><span class="mono muted">ETA ${utc(l.t1)}</span></div>`),
   ...net.slice(0,8).map(p=>`<div class="op-r"><span class="op-src ${p.net==="IVAO"?"ivao":"vat"}">${esc(p.net)}</span><div><b class="mono">${esc(p.cs)}</b> <span class="mono">${esc(p.dep||"?")} → ${esc(p.arr||"?")}</span><small>${esc(p.type||"")} · FL${String(Math.round((p.alt||0)/100)).padStart(3,"0")} · ${Math.round(p.gs||0)} kt</small></div><span></span></div>`)].join(""):`<p class="muted">${esc(ot("airNone"))}</p>`;
  const rb=document.getElementById("op-rpl");if(rb){const c=icao(al),deps=rplLegs(al,...rsRplWindow()).slice(0,5);
   const byOrigin=new Map();
   rb.innerHTML=deps.length?deps.map(d=>{
    if(!byOrigin.has(d.dep))byOrigin.set(d.dep,rsSoonFlights(d.dep));
    const option=departureOption(c,d.reg,d.dep,d.arr,d.t0,byOrigin.get(d.dep));
    const action=option.flight?`<button type="button" class="btn small" data-op-start data-code="${esc(c)}" data-number="${esc(d.reg)}" data-dep="${esc(d.dep)}" data-arr="${esc(d.arr)}" data-std="${d.t0}">${esc(ot("startHere"))} ›</button>`:`<small class="muted">${esc(option.reason)}</small>`;
    return`<div class="op-r op-dep"><b class="mono">${utc(d.t0)}</b><div class="op-dep-flight"><b class="mono">${esc(c)} ${esc(d.reg)}</b><span class="mono op-dep-route">${esc(d.dep)} → ${esc(d.arr)}</span></div><div class="op-dep-state">${d.typ?`<small>${esc(d.typ)}</small>`:""}${option.flight?`<small>${esc(ot("free"))}</small>`:""}${action}</div></div>`}).join(""):`<p class="muted">${esc(ot("rplNone"))}</p>`}paintPanes()}
 function stats(al){const ids=ofAl(al),now=Date.now(),wk=data.flights.filter(f=>ids.has(f.aircraftId)&&counts2(f)&&f.createdAt>=now-W),pw=data.flights.filter(f=>ids.has(f.aircraftId)&&counts2(f)&&f.createdAt>=now-2*W&&f.createdAt<now-W);
  return{wk,pw,min:wk.reduce((x,f)=>x+(f.blockMin||0),0),pilots:new Set(wk.map(f=>f.pilotId)).size}}
 const counts2=f=>f.verified!==false;
 function viewOps(){const al=alNow(),ids=ofAl(al),n=ids.size,P=pal(al),now=Date.now();
  if(typeof AIRPORTS!=="undefined"&&!AIRPORTS&&typeof loadAirports==="function"&&!viewOps.ap){viewOps.ap=1;loadAirports().then(()=>{if((view==="ops"||view==="roster"))render()}).catch(()=>{})}
  let aogN=0,melN=0;for(const id of ids){const k=statusOf(id).key;if(k==="bad")aogN++;else if(k==="warn")melN++}
  const vAir=vfrLegs(al,now-12*H,now+H).filter(l=>l.t0<=now&&l.t1>now).length,netAir=O.net.filter(p=>!p.ground).length;
  const S=stats(al),d=S.wk.length-S.pw.length,types=[...new Set(fleet.filter(a=>a.airline===al).map(a=>icaoType(a.type)||a.type).filter(Boolean))].slice(0,5);
 
  /* ranking da semana */
  const rk={};for(const f of S.wk){const r=rk[f.pilotId]=rk[f.pilotId]||{p:f.pilotId,min:0,n:0,best:null};r.min+=f.blockMin||0;r.n++;if(Number.isFinite(f.landingFpm)&&f.landingFpm>0)r.best=r.best==null?f.landingFpm:Math.min(r.best,f.landingFpm)}
  const rl=Object.values(rk).sort((a,b)=>b.min-a.min).slice(0,5),bl=Object.values(rk).filter(r=>r.best!=null).sort((a,b)=>a.best-b.best)[0];
  /* manutenção */
  const mx=[...ids].map(id=>({id,s:statusOf(id)})).filter(x=>x.s.key!=="ok").sort((a,b)=>(a.s.key==="bad"?0:1)-(b.s.key==="bad"?0:1)).slice(0,5);
  const evs=(typeof EVENTS!=="undefined"?EVENTS:[]).filter(e=>e.start>now-3*H).sort((a,b)=>a.start-b.start).slice(0,3);
  return`<div class="op">
   <div class="op-hero" style="background:linear-gradient(120deg,${P.a},${P.b});color:${P.ink}"><span class="op-lg">${(AIRLINE_IATA[al]==='AF'?`<svg width="62" viewBox="0 0 108 34" aria-label="Air France" role="img"><g fill="#142c51"><path fill-rule="evenodd" d="M2 31 22 3h12l6 28H29l-1-6H16l-4 6Zm19-13h6l-2-9Z"/><path d="M44 3h32l-4 7H54l-1 5h16l-4 7H51l-2 9H38Z"/></g><path fill="#ed273e" d="M89 3h17L87 27q-3 4-8 4H65q5-1 8-5Z"/></svg>`:typeof alSym==="function"&&alSym(al)||esc(al.slice(0,2)))}</span>
    <div><span class="op-kk">${esc(ot("k"))}</span><h2>${esc(al||"—")}</h2><small>${esc(ot("sub",{n,t:utc(now)}))}</small></div>
    </div>
   <nav class="op-tabs op-top-tabs" aria-label="${esc(ot("nav"))}">${sectionButtons()}</nav>
   <div class="op-g"><section class="op-c op-map-panel"><div class="op-hd"><h3>${esc(ot("where"))}</h3>
     <span>● ${esc(ot("live"))}</span>
     <button type="button" class="linkish" data-view="map">${esc(ot("map"))} ›</button></div>
    <div class="op-mw"><div class="op-mapbox"><div id="op-map" class="op-map"><div class="map-loading">${esc(t("map_loading"))}</div></div><div class="op-cnt" id="op-cnt"></div><div class="op-clock" id="op-clock"></div></div>
    </div><p class="hint op-note">${esc(ot("netNote"))}</p></section>
    <div class="op-side"><section class="op-c op-roster" data-op-pane="scale">${view==="roster"?rosterView():""}</section><section class="op-c" data-op-pane="air"><div class="op-hd"><h3>${esc(ot("airList"))}</h3></div><div id="op-air"></div></section>
     <section class="op-c" data-op-pane="rpl"><div class="op-hd"><h3>${esc(ot("rpl"))}</h3><button type="button" class="linkish" data-view="roster">${esc(ot("build"))} ›</button></div><div id="op-rpl"></div></section>
   <section class="op-c" data-op-pane="rank"><div class="op-hd"><h3>${esc(ot("rank"))}</h3><button type="button" class="linkish" data-view="logbook">${esc(t("nav_logbook"))} ›</button></div>
     ${rl.length?rl.map((r,i)=>`<div class="op-r op-rk"><span>${i<3?["🥇","🥈","🥉"][i]:i+1}</span><span><b>${esc(names[r.p]||pilot(r.p)||"—")}</b> <small class="muted">${esc(ot("flightsN",{n:r.n}))}</small></span><b class="mono">${block(r.min)}</b></div>`).join("")+(bl?`<p class="muted op-best">${esc(ot("best",{p:names[bl.p]||pilot(bl.p)||"—",v:Math.round(bl.best)}))}</p>`:""):`<p class="muted">${esc(ot("rankNone"))}</p>`}</section>
    <section class="op-c" data-op-pane="mx"><div class="op-hd"><h3>${esc(ot("mx"))}</h3></div>
     ${mx.length?mx.map(x=>{const a=acById(x.id),d=data.defects.filter(q=>q.aircraftId===x.id&&!q.voidedAt).sort((p,q)=>q.createdAt-p.createdAt)[0],loc=posNow(x.id)||"";
      return`<div class="op-r"><span>${regTag(a,x.id)}</span><span>${esc([loc,d?defTitle(d):""].filter(Boolean).join(" · "))}${x.s.until?`<small class="muted">${esc(ot("until",{t:fmt(x.s.until)}))}</small>`:""}</span><button type="button" class="op-chip ${x.s.key==="bad"?"bad":"warn"}" data-action="open-aircraft" data-id="${esc(x.id)}">${x.s.key==="bad"?"AOG":"MEL"}</button></div>`}).join(""):`<p class="muted">${esc(ot("mxNone"))}</p>`}</section>
    <section class="op-c" data-op-pane="ev"><div class="op-hd"><h3>${esc(ot("ev"))}</h3><button type="button" class="linkish" data-view="events">${esc(ot("see"))} ›</button></div>
     ${evs.length?evs.map(e=>`<div class="op-r op-rk"><span>🤝</span><span><b>${esc(e.title)}</b><small class="muted">${esc(fmt(e.start))}${e.dep?` · ${esc(e.dep)}${e.arr?" → "+esc(e.arr):""}`:""}</small></span><button type="button" class="linkish" data-view="events">${esc(ot("see"))}</button></div>`).join(""):`<p class="muted">${esc(ot("evNone"))}</p>`}</section><footer class="op-pages"></footer></div></div></div>`}
 const compactScreen=matchMedia("(max-width:800px)");
 let deskTab="rpl",phoneTab="rpl",pageIndex=0;
 const rosterView=viewRoster;
 window.opsRosterAirline=()=>view==="roster"?alNow():"";
 const allRosterFlights=rsSoonFlights;
 rsSoonFlights=function(dep){const flights=allRosterFlights(dep),al=window.opsRosterAirline();return al?flights.filter(f=>f.al===al):flights};
 const rosterDefaults=rsDefaults;
 rsDefaults=function(){
  if(view==="roster"&&!RS.roster){
   const available=rsSoonFlights(RS.dep).length>0;
   if(RS.opsNoRpl&&available){RS.other=false;RS.opsNoRpl=false}
   if(!RS.other&&!available)RS.opsNoRpl=true;
  }
  return rosterDefaults.apply(this,arguments);
 };
 viewRoster=function(){return viewOps()};
 const tabNames={rpl:()=>rplHelpText("label"),scale:()=>t("nav_roster"),air:()=>ot("air"),rank:()=>ot("rank"),mx:()=>ot("mx"),ev:()=>ot("ev")};
 function sectionButtons(){return Object.entries(tabNames).map(([id,label])=>{
   const button=`<button type="button" class="btn small" data-op-tab="${id}">${esc(label())}</button>`;
   return id==="rpl"?`<div class="op-scheduled-tab">${button}<button class="btn small" type="button" data-rpl-help aria-label="${esc(rplHelpText('title'))}" aria-haspopup="dialog">ⓘ</button></div>`:button;
 }).join("")}
 function fitOps(){
   const root=document.querySelector(".op");if(!root)return;
   const side=document.querySelector(".side"),bounds=side?.getBoundingClientRect();
   const bottom=bounds&&getComputedStyle(side).position==="fixed"&&bounds.top>innerHeight/2?bounds.top:innerHeight;
   root.style.height=Math.max(225,bottom-root.getBoundingClientRect().top-14)+"px";
 }
 function paintPanes(){
   const root=document.querySelector(".op");if(!root)return;
   const selected=view==="roster"?"scale":deskTab;
   root.classList.toggle("op-generating",selected==="scale");
   const mapPanel=root.querySelector(".op-map-panel");
   mapPanel.hidden=selected==="scale";
   for(const button of root.querySelectorAll("[data-op-tab]")){
     button.setAttribute("aria-pressed",String(button.dataset.opTab===selected));
   }
   for(const pane of root.querySelectorAll("[data-op-pane]"))pane.hidden=pane.dataset.opPane!==selected;
   fitOps();
   const footer=root.querySelector(".op-pages");footer.replaceChildren();footer.hidden=true;
   for(const pane of root.querySelectorAll("[data-op-pane]")){
     pane.hidden=pane.dataset.opPane!==selected;if(pane.hidden)continue;
     if(selected==="scale")continue;
     const rows=[...pane.querySelectorAll(".op-r")];
     rows.forEach(row=>row.hidden=false);
     if(!rows.length)continue;
     pane.scrollTop=0;
     const footerHTML=(count)=>`<button class="btn small" aria-label="${esc(t('prev'))}" data-op-page="-1" ${!pageIndex?'disabled':''}>‹</button><span>${pageIndex+1} / ${count}</span><button class="btn small" aria-label="${esc(t('next'))}" data-op-page="1" ${pageIndex+1===count?'disabled':''}>›</button>`;
     if(pane.scrollHeight<=pane.clientHeight+1){pageIndex=0;continue}
     footer.hidden=false;footer.innerHTML=footerHTML(2);
     const first=rows[0].getBoundingClientRect(),last=rows.at(-1).getBoundingClientRect();
     const box=pane.getBoundingClientRect(),tail=pane.lastElementChild.getBoundingClientRect();
     const padding=Number.parseFloat(getComputedStyle(pane).paddingBottom)||0;
     const overhead=first.top-box.top+Math.max(0,tail.bottom-last.bottom)+padding;
     const available=Math.max(1,pane.clientHeight-overhead);
     const pages=[[]];let used=0;
     for(const row of rows){
       const height=row.getBoundingClientRect().height;
       if(used+height>available&&pages.at(-1).length){pages.push([]);used=0}
       pages.at(-1).push(row);used+=height;
     }
     pageIndex=Math.max(0,Math.min(pageIndex,pages.length-1));
     const visible=new Set(pages[pageIndex]);
     rows.forEach(row=>row.hidden=!visible.has(row));
     footer.hidden=pages.length<2;
     if(!footer.hidden)footer.innerHTML=footerHTML(pages.length);
   }
   fitOps();if(!mapPanel.hidden)O.map?.invalidateSize({pan:false});
 }
 document.addEventListener("click",e=>{
   const button=e.target.closest("[data-op-tab],[data-op-page]");if(!button)return;
   if(button.dataset.opTab==="scale"&&view!=="roster"){if(rosterMenuLocked())return showRosterLocked();view="roster";render();return}
   if(button.dataset.opTab&&button.dataset.opTab!=="scale"&&view==="roster"){deskTab=button.dataset.opTab;pageIndex=0;view="ops";render();return}
   if(button.dataset.opTab){deskTab=button.dataset.opTab;pageIndex=0}
   else pageIndex+=Number(button.dataset.opPage);
   paintPanes();
 });
 window.addEventListener("resize",()=>{if((view==="ops"||view==="roster"))paintPanes()});
 window.viewOps=viewOps;
 const vf=viewFleet;viewFleet=function(){if((view==="ops"||view==="roster"))return viewOps();return vf.apply(this,arguments)};
 if(typeof paintChrome==="function"){const pc=paintChrome;paintChrome=function(){const r=pc.apply(this,arguments);try{const tb=document.getElementById("tabs");
   
   
   tb?.querySelector('[data-view="roster"]')?.remove();
   if(tb&&session&&!recovering&&!tb.querySelector('[data-view="ops"]')){const html=`<button class="tab" data-view="ops" title="${esc(ot("nav"))}" aria-current="${(view==="ops"||view==="roster")?"page":"false"}">${NAV_ICON.ops||""}<span>${esc(ot("nav"))}</span></button>`;
    const h=tb.querySelector('[data-view="home"]');if(h)h.insertAdjacentHTML("afterend",html);else tb.insertAdjacentHTML("afterbegin",html)}
   if((view==="ops"||view==="roster")){
     tb&&tb.querySelectorAll('.tab[data-view]').forEach(b=>b.setAttribute("aria-current",b.dataset.view==="ops"?"page":"false"));const pt=document.getElementById("page-title");if(pt)pt.textContent=ot("nav")}}catch(e){}return r}}
 if(typeof render==="function"){const rr=render;render=function(){const r=rr.apply(this,arguments);try{if((view==="ops"||view==="roster")&&session){paintPanes();if(view==="roster"){if(O.map){O.center=O.map.getCenter();O.zoom=O.map.getZoom();O.map.remove();O.map=null}opsRosterPaint()}else initMap()}else if(O.map){try{O.center=O.map.getCenter();O.zoom=O.map.getZoom();O.map.remove()}catch(e){}O.map=null;O.lay=null;O.play=false}}catch(e){console.warn(e)}return r}}
 setInterval(()=>{if((view==="ops"||view==="roster")&&!document.hidden){netFetch();if(O.mode==="now")draw()}},30e3);
 const css=`.op{display:grid;gap:14px}
.op-hero{border-radius:14px;padding:16px 20px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center}
.op-lg{width:76px;height:76px;border-radius:12px;background:#fff;display:grid;place-items:center;font:700 1.1rem var(--f-mono);color:#13202E;overflow:hidden}.op-lg img,.op-lg svg{display:block;width:62px;height:62px;max-width:62px;max-height:62px;object-fit:contain;margin:0}
.op-kk{font:600 .8rem var(--f-display);letter-spacing:.16em;text-transform:uppercase;opacity:.85}.op-hero h2{margin:0;font:700 2rem/1.05 var(--f-display)}.op-hero small{opacity:.9;font-size:.8rem}
.op-airline-fixed{background:rgba(255,255,255,.15);color:inherit;border:1px solid currentColor;border-radius:8px;padding:8px 10px;font:inherit;font-weight:600;max-width:220px}.op-airline-fixed{display:block;overflow-wrap:anywhere}
.op-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.op-kpis>div{background:var(--sheet);border:1px solid var(--line);border-radius:10px;padding:10px 12px;min-width:0}.op-kpis small{display:block;font-size:.64rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.op-kpis b{font-size:1.6rem;display:block}.op-kpis span{font-size:.74rem;color:var(--muted);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.op-kpis .ok b{color:var(--ok)}.op-kpis .bad b{color:var(--bad)}.op-kpis .live b{color:var(--opc)}
.op{--opc:#0B6A93}:root[data-theme="dark"] .op{--opc:#4FB3DE}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .op{--opc:#4FB3DE}}
.op-g{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:14px;align-items:start}.op-side{display:grid;gap:14px}
.op-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.op-c{background:var(--sheet);border:1px solid var(--line);border-radius:12px;padding:14px 16px;min-width:0}
.op-hd{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}.op-hd h3{margin:0;font:700 1.2rem var(--f-display);flex:1;min-width:120px}.op-hd .linkish{font-size:.8rem;white-space:nowrap}
.op-mw{display:grid;grid-template-columns:minmax(0,1fr);gap:0}
.op-mapbox{position:relative;isolation:isolate;z-index:0}.op-map{height:440px;border-radius:10px;overflow:hidden;background:#0f2233}
.op-cnt{position:absolute;left:54px;right:132px;top:10px;z-index:500;display:flex;gap:6px;flex-wrap:wrap;pointer-events:none}.op-cnt span{background:rgba(8,16,26,.82);color:#dbe6f0;border-radius:8px;padding:5px 9px;font-size:.74rem}.op-cnt b{font:600 .95rem var(--f-mono);color:#fff;margin-right:4px}
.op-clock{position:absolute;right:10px;top:10px;z-index:500;background:rgba(8,16,26,.82);color:#fff;border-radius:8px;padding:7px 11px;text-align:right;pointer-events:none}.op-clock b{font-size:1.5rem;display:block;line-height:1}.op-clock small{font-size:.68rem;color:#9fb2c4}
.op-feedbox{background:var(--sunk);border-radius:10px;padding:10px 12px;height:440px;overflow:auto}.op-feedbox h4{margin:0 0 6px;font:700 1rem var(--f-display)}
.op-ev{display:grid;grid-template-columns:46px minmax(0,1fr);gap:6px;font-size:.76rem;padding:5px 0;border-top:1px solid var(--line)}.op-ev:first-child{border-top:0}
.op-k{font-size:.66rem;font-weight:600;border-radius:4px;padding:1px 5px;margin-right:4px}.op-k.dep{background:#DCEEF6;color:#0B4F6E}.op-k.arr{background:var(--ok-bg);color:var(--ok)}
:root[data-theme="dark"] .op-k.dep{background:#1d3b5c;color:#9fd0ff}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .op-k.dep{background:#1d3b5c;color:#9fd0ff}}
.op-tl{display:grid;grid-template-columns:auto auto minmax(0,1fr) auto;gap:12px;align-items:center;margin-top:10px}
.op-play{width:40px;height:40px;border-radius:50%;border:0;background:#F5B800;color:#13202E;font-weight:700;font-size:1rem;cursor:pointer}
.op-spd button{font-family:var(--f-mono);font-size:.74rem}
.op-trk{position:relative;padding-bottom:16px}.op-hist{display:flex;align-items:flex-end;gap:2px;height:28px}.op-hist i{flex:1;background:#2E7DD7;opacity:.4;border-radius:2px 2px 0 0;min-height:1px}.op-hist i.past{opacity:.9}
.op-trk input{width:100%;margin:2px 0 0;accent-color:var(--opc)}.op-ticks{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;font:500 .64rem var(--f-mono);color:var(--muted)}
.op-nowmk{position:absolute;top:0;font:600 .62rem var(--f-mono);color:#B88600;border-left:2px solid #F5B800;padding-left:3px;height:30px}
.op-range{font-size:.76rem;text-align:right}.op-note{margin:8px 0 0;font-size:.76rem}
.op-r{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--line);font-size:.84rem}.op-r:first-of-type{border-top:0}
.op-r small{display:block;font-size:.74rem;color:var(--muted)}#op-rpl{container-type:inline-size}.op-r.op-dep{grid-template-columns:6ch minmax(0,1fr) minmax(0,1fr);align-items:start;gap:10px;padding:9px 0}.op-dep-flight,.op-dep-state{display:grid;align-content:start;gap:3px}.op-dep-route{white-space:nowrap}.op-dep-state .btn{justify-self:start;white-space:normal}.op-dep-state small{line-height:1.35}.op-dep-state small:first-child:not(.muted){font-family:var(--f-mono)}@container(max-width:320px){.op-r.op-dep{grid-template-columns:6ch minmax(0,1fr);row-gap:4px}.op-dep-state{grid-column:2}}
.op-src{font:600 .62rem var(--f-mono);padding:2px 6px;border-radius:4px}.op-src.vfr{background:#F5B800;color:#13202E}.op-src.vat{background:#2A6FD6;color:#fff}.op-src.ivao{background:#0D2C99;color:#fff}
.op-pb{height:4px;border-radius:3px;background:var(--sunk);margin-top:4px;overflow:hidden}.op-pb i{display:block;height:100%;background:var(--opc)}
.op-chip{font:600 .68rem var(--f-mono);padding:3px 8px;border-radius:10px;border:0}.op-chip.ok{background:var(--ok-bg);color:var(--ok)}.op-chip.warn{background:var(--warn-bg);color:var(--warn)}.op-chip.bad{background:var(--bad-bg);color:var(--bad);cursor:pointer}
button.op-chip.warn{cursor:pointer}.op-rk>span:first-child{min-width:22px;text-align:center}.op-best{font-size:.78rem;margin:6px 0 0}.op-c>p.muted{margin:4px 0;font-size:.84rem}
.op-pl{background:none;border:0}.op-pl span{position:absolute;left:22px;top:-6px;font:600 10px var(--f-mono,monospace);color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap}
.op-tt{font:500 11px var(--f-mono,monospace)}
@media (max-width:1200px){.op-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.op-g{grid-template-columns:1fr}}
@media (max-width:900px){.op-g3{grid-template-columns:1fr}.op-mw{grid-template-columns:1fr}.op-feedbox{height:auto;max-height:220px}.op-map{height:360px}}
@media (max-width:640px){.op-hero{grid-template-columns:auto minmax(0,1fr)}.op-hero select{grid-column:1/-1;max-width:none}.op-hero h2{font-size:1.5rem}.op-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.op-tl{grid-template-columns:auto minmax(0,1fr)}.op-trk{grid-column:1/-1}.op-range{display:none}.op-cnt{left:50px;right:118px}.op-clock b{font-size:1.15rem}}
#view:has(>.op){padding-block:8px}.op{grid-template-rows:auto auto minmax(0,1fr);gap:8px}.op [hidden]{display:none!important}.op-hero{padding:8px 12px}.op-kpis{gap:5px}.op-kpis>div{padding:5px 8px}.op-kpis b{font-size:1.2rem}.op-g{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);align-items:stretch;min-height:0;gap:8px}.op-map-panel{display:flex;flex-direction:column}.op-map-panel .op-mw{flex:1;min-height:0}.op-mapbox,.op-mapbox .op-map{height:100%;min-height:0}.op-side{display:flex;flex-direction:column;gap:6px;min-height:0;min-width:0}.op-side>.op-c{overflow:auto;min-height:0;flex:1}.op-tabs,.op-pages{display:flex;gap:5px;flex-wrap:wrap}.op-tabs .btn{padding:4px 8px}.op-tabs [aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent)}.op-pages{align-items:center;justify-content:center}.op-c{padding:9px 12px}.op-hd{margin-bottom:5px}
@media(max-width:800px){.op-g{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}.op-side{display:contents}.op-tabs{grid-row:1}.op-map-panel,.op-side>.op-c{grid-row:2}.op-pages{grid-row:3}.op-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.op-kpis span{display:none}.op-hero{grid-template-columns:auto minmax(0,1fr);gap:8px}.op-hero select{grid-column:auto;width:100%;max-width:120px}.op-hero h2{font-size:1.25rem}.op-hero small{font-size:.7rem}.op-lg{width:48px;height:48px}.op-lg img,.op-lg svg{width:40px;height:40px}}

.op-top-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
.op-top-tabs .btn{width:100%;padding:10px 6px;font-size:.85rem;min-height:42px;white-space:normal}
.op-top-tabs [aria-pressed=true]{box-shadow:inset 0 -3px var(--accent)}
@media(max-width:800px){.op-top-tabs{grid-template-columns:repeat(3,minmax(0,1fr))}.op-top-tabs .btn{padding:6px;min-height:36px}.op-g{grid-template-rows:minmax(90px,.65fr) minmax(0,1fr)}.op-side{display:flex;grid-row:2}.op-map-panel{grid-row:1}.op-side>.op-c{grid-row:auto}.op-pages{grid-row:auto}.op-note{font-size:.65rem;margin:3px 0}.op-clock b{font-size:1rem}.op-cnt{display:none}}

.op-scheduled-tab{display:flex;min-width:0}.op-scheduled-tab>[data-op-tab]{flex:1;min-width:0;width:auto!important;border-radius:6px 0 0 6px}.op-scheduled-tab>[data-rpl-help]{flex:none;width:30px!important;padding:4px!important;border-radius:0 6px 6px 0;border-left:0}
`;
 const st=document.createElement("style");st.id="ops-css";st.textContent=css;document.head.appendChild(st);
})();
