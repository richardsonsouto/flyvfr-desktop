/* Map planning layers. Uses the application's own fleet, RPL, weather and events.
   All planning interactions are read-only until the pilot accepts a roster. */
const MAP_WORDS={
 plan:['Map planning','Planejamento no mapa','Planificación en el mapa','Planification sur la carte','Kartenplanung','地図で計画','地图规划','지도 계획'],
 airport:['Explore airport','Consultar aeródromo','Consultar aeródromo','Consulter un aérodrome','Flugplatz ansehen','空港を確認','查看机场','공항 조회'],
 layers:['Layers','Camadas','Capas','Couches','Ebenen','レイヤー','图层','레이어'],
 roster:['My roster','Minha escala','Mi programación','Mon planning','Mein Dienstplan','自分のスケジュール','我的排班','내 스케줄'],
 favorites:['Favourite aircraft','Aeronaves favoritas','Aeronaves favoritas','Avions favoris','Lieblingsflugzeuge','お気に入りの機体','收藏飞机','즐겨찾는 항공기'],
 history:['My flight history','Meu histórico de voos','Mi historial de vuelos','Mon historique de vols','Mein Flugverlauf','飛行履歴','我的飞行历史','내 비행 기록'],
 events:['Group events','Eventos em grupo','Eventos en grupo','Événements de groupe','Gruppenveranstaltungen','グループイベント','团体活动','그룹 이벤트'],
 rpl:['RPL departures · 30–90 min','Saídas RPL · 30–90 min','Salidas RPL · 30–90 min','Départs RPL · 30–90 min','RPL-Abflüge · 30–90 Min.','RPL出発便 · 30〜90分','RPL起飞 · 30–90分钟','RPL 출발 · 30~90분'],
 weather:['Airport weather','Clima nos aeroportos','Clima en aeropuertos','Météo des aérodromes','Flugplatzwetter','空港の気象','机场天气','공항 날씨'],
 range:['Approximate range','Alcance aproximado','Alcance aproximado','Autonomie approximative','Ungefähre Reichweite','概算航続距離','估计航程','대략적인 항속거리'],
 alternates:['Nearby alternatives','Alternativos próximos','Alternativos cercanos','Déroutements proches','Nahe Ausweichplätze','近くの代替空港','附近备降机场','인근 대체 공항'],
 airspace:['Airspace · FIR (VATSIM)','Espaço aéreo · FIR (VATSIM)','Espacio aéreo · FIR (VATSIM)','Espace aérien · FIR (VATSIM)','Luftraum · FIR (VATSIM)','空域 · FIR (VATSIM)','空域 · FIR (VATSIM)','공역 · FIR (VATSIM)'],
 hazards:['SIGMET / AIRMET areas','Áreas SIGMET / AIRMET','Áreas SIGMET / AIRMET','Zones SIGMET / AIRMET','SIGMET-/AIRMET-Gebiete','SIGMET / AIRMET区域','SIGMET / AIRMET区域','SIGMET / AIRMET 구역'],
 notam:['NOTAM areas','Áreas de NOTAM','Áreas NOTAM','Zones NOTAM','NOTAM-Gebiete','NOTAM区域','NOTAM区域','NOTAM 구역'],
 runway:['Minimum runway (m)','Pista mínima (m)','Pista mínima (m)','Piste minimale (m)','Mindestpistenlänge (m)','最小滑走路長 (m)','最短跑道 (m)','최소 활주로 (m)'],
 apply:['Show on map','Mostrar no mapa','Mostrar en el mapa','Afficher sur la carte','Auf Karte zeigen','地図に表示','在地图上显示','지도에 표시'],
 noAircraft:['Select an aircraft','Selecione uma aeronave','Selecciona una aeronave','Choisir un avion','Flugzeug wählen','機体を選択','选择飞机','항공기 선택'],
 origin:['Use as departure','Usar como origem','Usar como origen','Utiliser comme départ','Als Start verwenden','出発地に設定','设为出发地','출발지로 설정'],
 destination:['Use as destination','Usar como destino','Usar como destino','Utiliser comme destination','Als Ziel verwenden','目的地に設定','设为目的地','목적지로 설정'],
 noRpl:['No eligible RPL departures in this time window.','Nenhuma saída RPL elegível nesta janela.','Sin salidas RPL elegibles en este intervalo.','Aucun départ RPL éligible dans ce créneau.','Keine geeigneten RPL-Abflüge in diesem Zeitfenster.','この時間帯に利用可能なRPL便はありません。','此时间窗口内没有符合条件的RPL航班。','이 시간대에 이용 가능한 RPL 출발편이 없습니다.'],
 choose:['Choose this flight','Escolher este voo','Elegir este vuelo','Choisir ce vol','Diesen Flug wählen','この便を選択','选择此航班','이 항공편 선택'],
 noAlternates:['No airport matches these distance and runway filters.','Nenhum aeroporto atende aos filtros de distância e pista.','Ningún aeropuerto cumple los filtros.','Aucun aérodrome ne correspond aux filtres.','Kein Flugplatz entspricht den Filtern.','条件に一致する空港はありません。','没有机场符合距离和跑道条件。','거리 및 활주로 조건에 맞는 공항이 없습니다.'],
 reference:['Simulation planning: range is approximate; alternatives are filtered by distance, runway and current weather, not a performance or operational clearance.','Planejamento para simulação: alcance estimado; alternativos filtrados por distância, pista e clima atual, sem avaliação de desempenho ou liberação operacional.','Planificación de simulación: alcance estimado; alternativos por distancia, pista y clima actual, sin evaluación de rendimiento ni autorización operacional.','Simulation : autonomie estimée ; alternatives selon distance, piste et météo actuelle, sans validation de performances ni autorisation opérationnelle.','Simulationsplanung: geschätzte Reichweite; Alternativen nach Entfernung, Piste und aktuellem Wetter, ohne Leistungsprüfung oder Betriebsfreigabe.','シミュレーション用：航続距離は概算、代替空港は距離・滑走路・現在の気象で抽出。性能や運航の承認ではありません。','模拟规划：航程为估计值，备降机场按距离、跑道和当前天气筛选，不代表性能评估或运行许可。','시뮬레이션 계획: 항속거리는 추정치이며 대체 공항은 거리·활주로·현재 날씨로 필터링됩니다. 성능 평가나 운항 승인이 아닙니다.'],
 noPosition:['No recorded position','Sem posição registrada','Sin posición registrada','Position non enregistrée','Keine erfasste Position','位置記録なし','无位置记录','기록된 위치 없음'],
 openAircraft:['View aircraft','Ver aeronave','Ver aeronave','Voir cet avion','Flugzeug ansehen','機体を見る','查看飞机','항공기 보기'],
 emptyRoster:['No accepted roster flights.','Nenhum voo de escala aceita.','No hay vuelos de programación aceptada.','Aucun vol de planning accepté.','Keine angenommenen Dienstplanflüge.','承認済みの便はありません。','无已接受的排班航班。','수락된 스케줄 항공편이 없습니다.'],
 emptyHistory:['No recorded flights yet.','Nenhum voo registrado ainda.','Aún no hay vuelos registrados.','Aucun vol enregistré.','Noch keine erfassten Flüge.','飛行記録はありません。','暂无飞行记录。','기록된 비행이 없습니다.'],
 emptyFav:['No favourite aircraft yet.','Nenhuma aeronave favorita ainda.','Aún no hay aeronaves favoritas.','Aucun avion favori.','Noch keine Lieblingsflugzeuge.','お気に入りの機体はありません。','暂无收藏飞机。','즐겨찾는 항공기가 없습니다.'],
 emptyEvents:['No upcoming events.','Nenhum evento próximo.','No hay eventos próximos.','Aucun événement à venir.','Keine kommenden Veranstaltungen.','今後のイベントはありません。','暂无即将举办的活动。','예정된 이벤트가 없습니다.'],
 pending:['Pending','Pendente','Pendiente','À venir','Ausstehend','予定','待执行','예정'],
 flying:['In progress','Em andamento','En curso','En cours','Laufend','飛行中','进行中','진행 중'],
 done:['Completed','Concluído','Completado','Terminé','Abgeschlossen','完了','已完成','완료'],
 noWeather:['No recent METAR','Sem METAR recente','Sin METAR reciente','Pas de METAR récent','Kein aktueller METAR','最新METARなし','无近期METAR','최신 METAR 없음'],
 wxScope:['Weather markers: up to 24 airports in view. Grey = no recent report.','Clima: até 24 aeroportos na área visível. Cinza = sem boletim recente.','Clima: hasta 24 aeropuertos visibles. Gris = sin informe reciente.','Météo : jusqu’à 24 aérodromes visibles. Gris = aucun bulletin récent.','Wetter: bis zu 24 sichtbare Flugplätze. Grau = kein aktueller Bericht.','気象：表示範囲内の最大24空港。灰色は最新情報なし。','天气：可见范围内最多24个机场，灰色表示无近期报告。','날씨: 화면 내 최대 24개 공항. 회색은 최신 보고 없음.'],
 unavailable:['Information unavailable; try again later.','Informação indisponível; tente novamente mais tarde.','Información no disponible; inténtalo más tarde.','Information indisponible ; réessayez plus tard.','Information nicht verfügbar; später erneut versuchen.','情報を取得できません。後で再試行してください。','信息不可用，请稍后重试。','정보를 불러올 수 없습니다. 나중에 다시 시도하세요.'],
 weatherTime:['Current observations, not a forecast for the flight time.','Observações atuais, não uma previsão para o horário do voo.','Observaciones actuales, no un pronóstico para el vuelo.','Observations actuelles, pas une prévision à l’heure du vol.','Aktuelle Beobachtungen, keine Vorhersage für die Flugzeit.','現在の観測であり、飛行時刻の予報ではありません。','当前观测，并非飞行时刻预报。','현재 관측이며 비행 시간 예보가 아닙니다.'],
 mapHelp:['Search an airport or click its marker to see RPL, weather and planning actions.','Busque um aeródromo ou clique no marcador para ver RPL, clima e opções de planejamento.','Busca un aeródromo o pulsa su marcador para ver RPL y clima.','Cherchez un aérodrome ou cliquez sur son repère pour voir RPL et météo.','Flugplatz suchen oder Marker für RPL und Wetter anklicken.','空港を検索するかマーカーを選び、RPLや気象を確認してください。','搜索机场或点击标记查看RPL、天气和规划操作。','공항을 검색하거나 마커를 눌러 RPL, 날씨와 계획 옵션을 보세요.'],
 candidates:['Destinations in approximate range','Destinos no alcance aproximado','Destinos en alcance aproximado','Destinations à portée approximative','Ziele in ungefährer Reichweite','概算航続距離内の目的地','估计航程内目的地','대략적인 항속거리 내 목적지'],
 records:['Visited airports / routes','Aeroportos visitados / rotas','Aeropuertos visitados / rutas','Aérodromes visités / routes','Besuchte Flugplätze / Routen','訪問空港 / 路線','到访机场 / 航线','방문 공항 / 노선']
};
function mapToolsMap(){return view==='briefing'?BRF.map:view==='map'?MAPV.map:null}
function mapToolsControl(){return view==='briefing'?BRF.mapControl:MAPV.control}
function mapToolsAirline(){return view==='briefing'?(BRF.mapAirline||'all'):MAPV.airline}
function mapToolsLiveDraw(m){if(view==='briefing')brfTrafficDraw();else drawLive(m)}
function mapT(k){const a=MAP_WORDS[k];return a?(a[LANGS.indexOf(lang)]||a[0]):t(k)}
const MAP_TOOLS={dep:'',arr:'',ac:'',selected:'',minRunway:1500,on:{roster:true,favorites:false,history:false,events:true,rpl:false,weather:false,range:true,alternates:true,hazards:false,notam:false,airspace:false,live:true},layers:{},wx:{},wxPending:new Map(),wxAt:0,wxBusy:false,weatherAgain:false,seq:0,rplKeys:new Map(),runways:null,runwaysError:false};
function mapToolsRestore(){const S=MAP_TOOLS,context=view==='briefing'?'briefing':'map';if(S.pilot===myId&&S.context===context)return;S.pilot=myId;S.context=context;S.briefLeg=null;S.dep='';S.arr='';S.ac='';S.selected='';S.minRunway=1500;Object.assign(S.on,{roster:true,favorites:false,history:false,events:true,rpl:false,weather:false,range:true,alternates:true,hazards:context==='briefing',notam:context==='briefing',airspace:false,live:true});
 try{const saved=JSON.parse(localStorage.getItem(context==='briefing'?'vfr-map-tools-briefing':'vfr-map-tools')||'null');if(saved?.pilot===myId){for(const k of Object.keys(S.on))if(typeof saved.on?.[k]==='boolean')S.on[k]=saved.on[k];for(const k of ['dep','arr','ac'])if(typeof saved[k]==='string')S[k]=saved[k];S.minRunway=Math.max(0,Math.min(6000,Number(saved.minRunway)||0))}}catch(e){}
}
function mapToolsSave(){try{localStorage.setItem(MAP_TOOLS.context==='briefing'?'vfr-map-tools-briefing':'vfr-map-tools',JSON.stringify({pilot:myId,dep:MAP_TOOLS.dep,arr:MAP_TOOLS.arr,ac:MAP_TOOLS.ac,minRunway:MAP_TOOLS.minRunway,on:MAP_TOOLS.on}))}catch(e){}}
function mapAircraftAllowed(id){const a=acById(id);return !!a&&(mapToolsAirline()==='all'||a.airline===mapToolsAirline())}
function mapToolsHTML(){
 mapToolsRestore();const S=MAP_TOOLS;if(view==='map'&&typeof mapDispatchPrepare==='function')mapDispatchPrepare();
 if(view==='map')return ''; // Planning runs automatically; no separate planning panel.
 if(view!=='map'){if(!S.dep)S.dep=RS.dep||'SBGR';if(!S.arr){const r=data.reservations.find(r=>r.pilotId===myId&&r.rosterId&&booked(r)&&r.end>Date.now());if(r)S.arr=r.arr}}
 const options=[...fleet].filter(a=>mapToolsAirline()==='all'||a.airline===mapToolsAirline()||a.id===S.ac).sort((a,b)=>Number(isFav(b.id))-Number(isFav(a.id))||a.registration.localeCompare(b.registration));
 if(S.ac&&!options.some(a=>a.id===S.ac))S.ac='';
 return`<details class="panel map-planner"><summary><b>${mapT('plan')}</b></summary>${view==='map'&&typeof mapDispatchHTML==='function'?mapDispatchHTML():''}<form id="map-plan-form" class="map-plan-fields">
 <label>${t('dep')}${apInput('map-plan-dep',S.dep)}</label><label>${t('arr')}${apInput('map-plan-arr',S.arr)}</label>
 <label>${t('aircraft')}<select id="map-plan-ac"><option value="">${mapT('noAircraft')}</option>${options.map(a=>`<option value="${esc(a.id)}" ${S.ac===a.id?'selected':''}>${isFav(a.id)?'★ ':''}${esc(a.registration)} · ${esc(a.type)} · ${esc(a.airline||'')}</option>`).join('')}</select></label>
 <label>${mapT('runway')}<input id="map-plan-runway" type="number" min="0" max="6000" step="100" value="${S.minRunway}"></label><button type="submit" class="btn primary">${mapT('apply')}</button>
 </form><form id="map-airport-form" class="map-airport-search"><label>${mapT('airport')}${apInput('map-explore-code',S.selected||S.dep)}</label><button type="submit" class="btn">${mapT('apply')}</button></form>
 <p class="hint">${mapT('reference')}</p><p class="hint">${mapT('wxScope')} · VFR / MVFR / IFR / LIFR</p><div id="map-plan-result" aria-live="polite"></div></details>`;
}
function briefMapToolsHTML(leg){mapToolsRestore();const S=MAP_TOOLS;if(S.briefLeg!==leg.key){S.briefLeg=leg.key;S.dep=leg.dep;S.arr=leg.arr;S.ac=leg.acId;S.selected=leg.dep}if(BRF.pin)S.on.notam=true;
 return`<div class="map-brief-company"><span class="lbl">${t('airline')}</span>${alPickHTML('brief-map',BRF.mapAirline||'all')}</div>`+mapToolsHTML()
}
async function mapLoadRunways(){if(MAP_TOOLS.runways)return MAP_TOOLS.runways;if(MAP_TOOLS.runwayP)return MAP_TOOLS.runwayP;
 MAP_TOOLS.runwayP=fetch('runways.json?v=239').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(j=>{MAP_TOOLS.runways=j;MAP_TOOLS.runwaysError=false;return j}).catch(()=>{MAP_TOOLS.runwaysError=true;return null}).finally(()=>MAP_TOOLS.runwayP=null);return MAP_TOOLS.runwayP}
function mapOwnLegs(){const now=Date.now(),activeIds=new Set(liveTracks().map(k=>k.reservation_id));return data.reservations.filter(r=>r.pilotId===myId&&r.rosterId&&(booked(r)||r.status==='completed')&&mapAircraftAllowed(r.aircraftId)).map(r=>({...r,state:r.status==='completed'?'done':activeIds.has(r.id)?'flying':'pending'})).sort((a,b)=>a.start-b.start)}
function mapLine(Lf,layer,a,b,options,label){const A=apLL(a),B=apLL(b);if(!A||!B)return null;return Lf.polyline(Array.from({length:41},(_,i)=>gcPoint(A,B,i/40)),options).addTo(layer).bindTooltip(label,{sticky:true})}
function mapAirportWxBind(marker,c){marker.unbindPopup();marker.on('click',()=>mapAirportWxOpen(c));return marker}
async function mapAirportWxOpen(c){
 const m=mapToolsMap(),ll=apLL(c);if(!m||!ll)return;
 const popup=window.L.popup({className:'map-airport-weather',maxWidth:420,minWidth:260,maxHeight:380,autoPanPadding:[20,20]}).setLatLng(ll);
 let state={loading:true};
 const paint=()=>popup.setContent(`<section class="map-airport-wx">${wxBody(c,state)}</section>`);
 paint();popup.openOn(m);
 const element=popup.getElement();
 if(element){window.L.DomEvent.disableClickPropagation(element);element.addEventListener('click',e=>{
  const button=e.target.closest('[data-wx-mode]');if(!button)return;
  e.preventDefault();e.stopPropagation();try{localStorage.setItem('vfr-wx-mode',button.dataset.wxMode)}catch(error){}paint();
 })}
 try{const data=await fetchWx(c);state=data?{data:{...data,name:data.name||AIRPORTS[c]?.[3]||''}}:{unsupported:true}}
 catch(error){state={error:true}}
 if(m.hasLayer(popup))paint();
}
function mapAirportMarker(Lf,layer,c,color,label,radius=6){const ll=apLL(c);if(!ll)return null;return mapAirportWxBind(Lf.circleMarker(ll,{radius,color,weight:2,fillColor:color,fillOpacity:.65}).addTo(layer).bindTooltip(`<b>${esc(c)}</b> · ${esc(label||AIRPORTS[c][3]||'')}`),c)}
async function mapToolsInit(m,Lf){
 const S=MAP_TOOLS,seq=++S.seq;S.layers={};S.rplKeys.clear();
 for(const [id,value] of [['map-plan-dep',S.dep],['map-plan-arr',S.arr],['map-explore-code',S.selected||S.dep]]){const input=document.getElementById(id);if(input)input.value=value||''}const arrival=document.getElementById('map-plan-arr');if(arrival)arrival.required=false;
 for(const k of Object.keys(S.on)){if(k==='live')continue;const operational=view==='briefing'?(k==='hazards'?BRF.operationalSig:k==='notam'?BRF.operationalNotam:null):null;const layer=operational||Lf.layerGroup();layer.options.key='tools-'+k;S.layers[k]=layer;mapToolsControl()?.addOverlay(layer,esc(mapT(k)));if(S.on[k])layer.addTo(m);else if(m.hasLayer(layer))m.removeLayer(layer)}
 if(view==='map'&&!liveLayer){liveLayer=Lf.layerGroup();liveLayer._mk={}}
 const traffic=view==='briefing'?BRF.tfc?.FLYVFR:liveLayer;if(traffic){S.layers.live=traffic;traffic.options.key='tools-live';if(view!=='briefing')mapToolsControl()?.addOverlay(traffic,'FlyVFR');if(S.on.live)traffic.addTo(m);else m.removeLayer(traffic)}
 const changed=(e,on)=>{const key=String(e.layer.options.key||'');if(!key.startsWith('tools-'))return;const k=key.slice(6);S.on[k]=on;document.querySelectorAll(`[data-map-layer="${k}"]`).forEach(box=>box.checked=on);mapToolsSave();if(k==='live'){if(view==='briefing'){if(on)brfTraffic(true)}else if(!on&&liveTrail)m.removeLayer(liveTrail);else if(on){mapToolsLiveDraw(m);if(liveTrail)liveTrail.addTo(m)}}if(on)mapRefreshSpecial(m,Lf)};
 m.on('overlayadd',e=>changed(e,true));m.on('overlayremove',e=>changed(e,false));
 S.airports=Lf.layerGroup().addTo(m);m.on('moveend',()=>{clearTimeout(S.moveTimer);S.moveTimer=setTimeout(()=>{if(['map','briefing'].includes(view)&&mapToolsMap()===m)mapRefreshSpecial(m,Lf)},350)});
 mapDrawPersonal(m,Lf);mapDrawPlan(m,Lf);mapRefreshSpecial(m,Lf);mapExploreAirport(S.selected||S.dep,false);
 await Promise.all([loadSchedule(),loadRosterAirports(),mapLoadRunways()]);if(seq!==S.seq||mapToolsMap()!==m||!m.getContainer().isConnected)return;
 mapDrawPlan(m,Lf);mapRefreshSpecial(m,Lf);mapExploreAirport(S.selected||S.dep,false);
 if(view==='map'&&typeof mapDispatchSync==='function')await mapDispatchSync(m,Lf,true);
}
function mapDrawPersonal(m,Lf){
 const S=MAP_TOOLS,l=S.layers,css=getComputedStyle(document.documentElement),accent=css.getPropertyValue('--accent').trim(),colors={pending:accent,flying:'#137ec2',done:'#278342'};
 for(const k of ['roster','favorites','history','events'])l[k].clearLayers();
 for(const r of mapOwnLegs()){const label=`${esc(r.flightNo||'')} ${esc(r.dep)} → ${esc(r.arr)} · ${mapT(r.state)} · ${fmt(r.start)}`;const line=mapLine(Lf,l.roster,r.dep,r.arr,{color:colors[r.state],weight:r.state==='flying'?4:2,dashArray:r.state==='pending'?'7 5':null},label);line?.on('click',()=>mapExploreAirport(r.arr));for(const c of [r.dep,r.arr])mapAirportMarker(Lf,l.roster,c,colors[r.state],label)}
 const fav=fleet.filter(a=>isFav(a.id)&&mapAircraftAllowed(a.id));for(const a of fav){const c=posNow(a.id);if(!apLL(c))continue;Lf.marker(apLL(c),{icon:Lf.divIcon({className:'map-fav-marker',html:'★',iconSize:[26,26],iconAnchor:[13,13]})}).addTo(l.favorites).bindTooltip(`★ ${esc(a.registration)} · ${esc(c)}`).on('click',()=>paintAircraftSheet(a.id))}
 const hist=new Map(),visited=new Set();for(const f of data.flights.filter(f=>f.pilotId===myId&&counts(f)&&mapAircraftAllowed(f.aircraftId))){if(!apLL(f.dep)||!apLL(f.arr))continue;visited.add(f.dep);visited.add(f.arr);const key=f.dep+'>'+f.arr;hist.set(key,(hist.get(key)||0)+1)}
 for(const [route,n] of hist){const [dep,arr]=route.split('>');mapLine(Lf,l.history,dep,arr,{color:'#7c64b5',weight:1+Math.min(4,Math.log2(n+1)),opacity:.65},`${esc(dep)} → ${esc(arr)} · ${n}`)}
 visited.forEach(c=>mapAirportMarker(Lf,l.history,c,'#7c64b5',AIRPORTS[c][3],4));
 for(const e of EVENTS.filter(e=>e.start>Date.now()-6*36e5)){const c=apLL(e.dep)?e.dep:e.arr;if(!apLL(c))continue;const label=`${esc(e.title)} · ${fmt(e.start)}`;mapLine(Lf,l.events,e.dep,e.arr,{color:'#cf6d21',weight:3,dashArray:'3 5'},label);const mk=mapAirportMarker(Lf,l.events,c,'#cf6d21',e.title,9);mk?.bindPopup(`<b>${esc(e.title)}</b><p>${esc(e.dep)} → ${esc(e.arr)} · ${fmt(e.start)}</p><p>${esc(e.desc||'')}</p><button class="btn small" data-action="map-event" data-id="${esc(e.id)}">${t('ev_title')}</button>`)}
 S.historyCounts={airports:visited.size,routes:hist.size};
}
function mapAlternates(){const S=MAP_TOOLS,B=apLL(S.arr),runways=S.runways?.runways;if(!B||!runways)return[];return Object.entries(runways).filter(([c,r])=>c!==S.arr&&apLL(c)&&r.m>=S.minRunway).map(([c,r])=>({c,r,nm:gcNm(B,apLL(c))})).filter(x=>x.nm<=200).sort((a,b)=>a.nm-b.nm).slice(0,8)}
function mapDrawPlan(m,Lf){
 if(view==='map'&&typeof mapActiveReservation==='function'){const active=mapActiveReservation();if(active){MAP_TOOLS.dep=active.dep;MAP_TOOLS.arr=active.arr;MAP_TOOLS.ac=active.aircraftId}}
 const S=MAP_TOOLS,l=S.layers;if(!l.range)return;for(const k of ['range','alternates'])l[k].clearLayers();
 if(S.planLayer)m.removeLayer(S.planLayer);S.planLayer=Lf.layerGroup().addTo(m);
 for(const c of [S.dep,S.arr])mapAirportMarker(Lf,S.planLayer,c,'#147fac',AIRPORTS?.[c]?.[3],7);
 const dispatch=typeof mapDispatchPoints==='function'?mapDispatchPoints():null;
 if(dispatch?.length>1)Lf.polyline(dispatch,{color:'#147fac',weight:3}).addTo(S.planLayer).bindTooltip(`${esc(S.dep)} → ${esc(S.arr)} · SimBrief`);
 else mapLine(Lf,S.planLayer,S.dep,S.arr,{color:'#147fac',weight:3,dashArray:'8 5'},`${esc(S.dep)} → ${esc(S.arr)}`);
 const a=acById(S.ac),A=apLL(S.dep);S.rangeCandidates=[];
 if(a&&A){const nm=rsProfile(a).range;Lf.circle(A,{radius:nm*1852,color:'#147fac',weight:2,fillOpacity:.035,interactive:false}).addTo(l.range);const b=m.getBounds();
  S.rangeCandidates=(RS_AP?.list||[]).filter(c=>c!==S.dep&&apLL(c)&&gcNm(A,apLL(c))<=nm);for(const c of S.rangeCandidates.filter(c=>b.contains(apLL(c))).slice(0,200))mapAirportMarker(Lf,l.range,c,'#147fac',AIRPORTS[c][3],3)}
 const alts=mapAlternates();for(const x of alts){const w=mapWeather(x.c);mapAirportMarker(Lf,l.alternates,x.c,w.color,`${Math.round(x.nm)} nm · ${x.r.m} m · ${w.cat}`,7)}
 const out=document.getElementById('map-plan-result');if(out){const range=a&&A?`<p><b>${esc(a.registration)}</b> · ${mapT('range')}: ${rsProfile(a).range} nm · ${mapT('candidates')}: ${S.rangeCandidates.length}</p>`:'';
  out.innerHTML=range+(S.arr?`<h4>${mapT('alternates')} · ${esc(S.arr)} · ≤ 200 nm</h4>${S.runwaysError?`<p>${mapT('unavailable')}</p>`:!S.runways?`<p>${t('loading')}</p>`:alts.length?`<div class="map-alt-list">${[...alts].sort((a,b)=>mapWeather(a.c).rank-mapWeather(b.c).rank||a.nm-b.nm).map(x=>`<button type="button" class="btn small" data-action="map-airport" data-code="${esc(x.c)}"><b>${esc(x.c)}</b> · ${Math.round(x.nm)} nm · ${x.r.m} m · ${esc(mapWeather(x.c).cat)}</button>`).join('')}</div><small class="muted">OurAirports · ${esc(S.runways.retrieved.slice(0,10))} · ${mapT('weatherTime')}</small>`:`<p>${mapT('noAlternates')}</p>`}`:'')}
 if(S.on.alternates)mapLoadWeather(alts.map(x=>x.c),m);
}
function mapWeather(c){const d=MAP_TOOLS.wx[c]?.data||WX_CACHE[c]?.data,at=d?.metarTime?new Date(d.metarTime).getTime():0,valid=at&&Date.now()-at<2*36e5&&Date.now()-at>=-10*6e4;
 const cat=valid&&['VFR','MVFR','IFR','LIFR'].includes(d.fltCat)?d.fltCat:'—',colors={VFR:'#278342',MVFR:'#2379bd',IFR:'#cb3838',LIFR:'#a044b3'};return{cat,color:colors[cat]||'#7b858f',rank:{VFR:0,MVFR:1,IFR:2,LIFR:3}[cat]??4,data:d,valid}}
async function mapWeatherFetch(c){const S=MAP_TOOLS;if(S.wx[c]&&Date.now()-S.wx[c].at<5*6e4)return;if(S.wxPending.has(c))return S.wxPending.get(c);
 const p=fetchWx(c).then(data=>S.wx[c]={at:Date.now(),data}).catch(()=>S.wx[c]={at:Date.now(),error:true}).finally(()=>S.wxPending.delete(c));S.wxPending.set(c,p);return p}
async function mapLoadWeather(codes,m){const S=MAP_TOOLS;const ids=[...new Set(codes)].filter(c=>/^[A-Z0-9]{4}$/.test(c)).filter(c=>!S.wx[c]||Date.now()-S.wx[c].at>=5*6e4);if(!ids.length)return;
 if(S.wxBusy){S.weatherAgain=true;return}S.wxBusy=true;
 try{let index=0;await Promise.all([0,1].map(async()=>{while(index<ids.length){if(mapToolsMap()!==m||!['map','briefing'].includes(view))break;await mapWeatherFetch(ids[index++])}}))}finally{S.wxBusy=false}
 if(mapToolsMap()!==m||!['map','briefing'].includes(view))return;mapDrawWeather(m,window.L);mapDrawPlan(m,window.L);mapExplorePaint();if(S.weatherAgain){S.weatherAgain=false;mapRefreshSpecial(m,window.L)}
}
function mapVisibleAirports(m,limit=24){const S=MAP_TOOLS,b=m.getBounds(),center=m.getCenter(),codes=[S.selected,S.dep,S.arr,...mapAlternates().map(x=>x.c),...(RS_AP?.list||[])];return[...new Set(codes)].filter(c=>apLL(c)&&b.contains(apLL(c))).sort((a,b)=>Number(b===S.selected)-Number(a===S.selected)||gcNm([center.lat,center.lng],apLL(a))-gcNm([center.lat,center.lng],apLL(b))).slice(0,limit)}
function mapDrawWeather(m,Lf){const S=MAP_TOOLS;if(!S.layers.weather)return;S.layers.weather.clearLayers();for(const c of mapVisibleAirports(m)){const w=mapWeather(c);mapAirportMarker(Lf,S.layers.weather,c,w.color,`${w.cat} · ${AIRPORTS[c][3]}`,8)}}
function mapDrawRpl(m,Lf){const S=MAP_TOOLS;S.layers.rpl.clearLayers();if(!SCHED?.idx)return;const codes=new Set();for(const al of Object.values(SCHED.idx))Object.keys(al).forEach(c=>codes.add(c));
 for(const c of codes){if(!apLL(c)||!m.getBounds().contains(apLL(c)))continue;const list=rsSoonFlights(c).filter(x=>mapToolsAirline()==='all'||x.al===mapToolsAirline());if(list.length)mapAirportMarker(Lf,S.layers.rpl,c,'#c59400',`${mapT('rpl')} · ${list.length}`,8)}
}
async function mapDrawHazards(m,Lf){if(view==='briefing')return;const S=MAP_TOOLS,layer=S.layers.hazards;await briefLoadSig();if(mapToolsMap()!==m||!['map','briefing'].includes(view))return;layer.clearLayers();for(const h of BRF.sig?.items||[]){if(!h.coords||h.coords.length<3||(h.to!=null&&h.to<Date.now())||(h.from!=null&&h.from>Date.now()))continue;Lf.polygon(h.coords,{color:HZ_COLOR[hzKey(h.hazard)]||'#93639c',weight:2,fillOpacity:.12}).addTo(layer).bindTooltip(`${esc(h.kind)} · ${esc(h.fir||'')} · ${esc(h.hazard||'')}`).bindPopup(`<b>${esc(h.kind)} · ${esc(h.hazard||'')}</b><pre class="map-report">${esc(h.raw||h.text||'')}</pre>`)}
 if(BRF.sig?.err)toast(mapT('unavailable'))}
async function mapDrawNotam(m,Lf){if(view==='briefing')return;const S=MAP_TOOLS,c=S.selected||S.dep,layer=S.layers.notam;if(!apLL(c))return;await briefLoad([c]);if(mapToolsMap()!==m||!['map','briefing'].includes(view)||c!==(S.selected||S.dep))return;layer.clearLayers();for(const n of BRF.notam[c]?.list||[]){if((n.to!=null&&n.to<Date.now())||(n.from!=null&&n.from>Date.now()))continue;let shape;
 if(n.pts?.length>=3)shape=Lf.polygon(n.pts,{color:'#ce791a',weight:2,fillOpacity:.12});else if(n.qll&&n.qr&&n.qr<999)shape=Lf.circle(n.qll,{radius:n.qr*1852,color:'#ce791a',fillOpacity:.07});else if(n.pts?.length)shape=Lf.circleMarker(n.pts[0],{radius:7,color:'#ce791a'});else if(n.qll)shape=Lf.circleMarker(n.qll,{radius:7,color:'#ce791a'});if(shape)shape.addTo(layer).bindTooltip(esc(c+' · '+n.id)).bindPopup(`<b>${esc(c)} · ${esc(n.id)}</b><pre class="map-report">${esc(n.e)}</pre>`)}mapExplorePaint()}
function mapRefreshSpecial(m,Lf){if(mapToolsMap()!==m||!['map','briefing'].includes(view))return;const S=MAP_TOOLS;S.airports.clearLayers();if(m.getZoom()>=6)for(const c of mapVisibleAirports(m,60))mapAirportMarker(Lf,S.airports,c,'#7b858f',AIRPORTS[c][3],3);
 if(S.on.rpl)mapDrawRpl(m,Lf);if(S.on.weather){mapDrawWeather(m,Lf);mapLoadWeather(mapVisibleAirports(m),m)}if(S.on.hazards)mapDrawHazards(m,Lf);if(S.on.notam)mapDrawNotam(m,Lf);if(S.on.airspace)mapDrawAirspace(m,Lf);mapDrawPlan(m,Lf)}
async function mapDrawAirspace(m,Lf){const S=MAP_TOOLS,layer=S.layers.airspace;if(layer._drawn)return;
 if(!S.airspaceP)S.airspaceP=fetch('https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/Boundaries.geojson').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).catch(()=>{S.airspaceP=null;return null});
 const geo=await S.airspaceP;if(mapToolsMap()!==m||!['map','briefing'].includes(view)||layer._drawn)return;if(!geo){toast(mapT('unavailable'));return}layer._drawn=true;
 Lf.geoJSON(geo,{style:{color:'#777eaa',weight:1,fillOpacity:.025},onEachFeature:(f,l)=>{const p=f.properties||{};l.bindPopup(`<b>${esc(p.name||p.icao||p.id||'FIR')}</b><p>VAT-Spy / ${netBrandText("VATSIM")} · <a href="https://github.com/vatsimnetwork/vatspy-data-project" target="_blank" rel="noopener">CC BY-SA 4.0</a></p>`)}}).addTo(layer)
}
function mapExplorePaint(){const S=MAP_TOOLS,c=S.selected,el=document.getElementById('map-explore');if(!el||!apLL(c))return;const w=mapWeather(c),flights=rsSoonFlights(c).filter(x=>mapToolsAirline()==='all'||x.al===mapToolsAirline());S.rplKeys.clear();flights.forEach(x=>S.rplKeys.set(pfKey(x),x));
 const fav=fleet.filter(a=>isFav(a.id)&&mapAircraftAllowed(a.id)),legs=mapOwnLegs(),events=EVENTS.filter(e=>e.start>Date.now()-6*36e5),runway=S.runways?.runways?.[c];
 el.innerHTML=`<section class="map-airport-detail"><h3>${esc(c)}</h3><p>${esc(AIRPORTS[c][3])}</p>${runway?`<p>${esc(runway.ident)} · ${runway.m} m · ${esc(runway.surface)}</p>`:''}<div class="row"><button type="button" class="btn small" data-action="map-origin" data-code="${esc(c)}">${mapT('origin')}</button><button type="button" class="btn small" data-action="map-destination" data-code="${esc(c)}">${mapT('destination')}</button></div>
 <details open><summary>${mapT('rpl')}</summary>${flights.length?flights.map(x=>`<button class="map-rpl-choice" type="button" data-action="map-rpl" data-key="${esc(pfKey(x))}">${alSym(x.al)}<b>${esc((AIRLINE_IATA[x.al]||x.code)+' '+x.f.fno)}</b> → ${esc(x.f.arr)} · ${tf.format(x.f.std)} · ${esc(x.f.typ)}<small>${mapT('choose')}</small></button>`).join(''):`<p class="muted">${SCHED?mapT('noRpl'):t('loading')}</p>`}</details>
 <details><summary>${mapT('weather')} · ${esc(w.cat)}</summary><p class="hint">${mapT('weatherTime')}</p>${w.data?`<p>${w.valid?esc(w.cat):mapT('noWeather')}</p><pre class="map-report">${esc(w.data.metar||mapT('noWeather'))}</pre><pre class="map-report">${esc(w.data.taf||t('wx_none'))}</pre>${w.data.metarTime?`<small>${esc(w.data.metarTime)} · NOAA</small>`:''}`:`<p>${S.wx[c]?.error?mapT('unavailable'):t('wx_loading')}</p>`}</details>
 <details><summary>NOTAM · ${esc(c)}</summary>${S.on.notam?(BRF.err[c]?`<p>${mapT('unavailable')}</p>`:BRF.notam[c]?BRF.notam[c].list.filter(n=>(n.to==null||n.to>=Date.now())&&(n.from==null||n.from<=Date.now())).map(n=>`<p><b>${esc(n.id)}</b></p><pre class="map-report">${esc(n.e)}</pre>`).join('')||`<p>${t('brf_n_none')}</p>`:`<p>${t('loading')}</p>`):`<label><input type="checkbox" data-map-layer="notam">${mapT('notam')}</label>`}</details>
 </section><details><summary>${mapT('roster')} · ${legs.length}</summary>${legs.length?legs.map(r=>`<button type="button" class="map-list-link" data-action="map-airport" data-code="${esc(r.arr)}">${esc(r.dep)} → ${esc(r.arr)} · ${mapT(r.state)}<small>${fmt(r.start)}</small></button>`).join(''):`<p>${mapT('emptyRoster')}</p>`}</details>
 <details><summary>★ ${mapT('favorites')} · ${fav.length}</summary>${fav.length?fav.map(a=>`<button type="button" class="map-list-link" data-action="map-favorite" data-id="${esc(a.id)}">${regTag(a,a.id)}<small>${esc(posNow(a.id)||mapT('noPosition'))}</small></button>`).join(''):`<p>${mapT('emptyFav')}</p>`}</details>
 <details><summary>${mapT('history')}</summary><p>${S.historyCounts?.airports||0} / ${S.historyCounts?.routes||0} · ${mapT('records')}</p>${!S.historyCounts?.routes?`<p>${mapT('emptyHistory')}</p>`:''}</details>
 <details><summary>${mapT('events')} · ${events.length}</summary>${events.length?events.map(e=>`<button type="button" class="map-list-link" data-action="map-event" data-id="${esc(e.id)}">${esc(e.title)}<small>${esc(e.dep)} → ${esc(e.arr)} · ${fmt(e.start)}</small></button>`).join(''):`<p>${mapT('emptyEvents')}</p>`}</details>`}
async function mapExploreAirport(c,zoom=true){if(!apLL(c))return;const S=MAP_TOOLS;S.selected=c;mapToolsSave();mapExplorePaint();const m=mapToolsMap();if(!m)return;if(zoom)m.setView(apLL(c),Math.max(7,m.getZoom()));await mapWeatherFetch(c);if(mapToolsMap()!==m||S.selected!==c||!['map','briefing'].includes(view))return;mapExplorePaint();if(S.on.notam)mapDrawNotam(m,window.L)}
document.addEventListener('change',e=>{const k=e.target.dataset?.mapLayer;if(!k||!Object.prototype.hasOwnProperty.call(MAP_TOOLS.on,k))return;const S=MAP_TOOLS,m=mapToolsMap();S.on[k]=e.target.checked;mapToolsSave();if(!m)return;if(k==='live'&&!S.layers.live&&S.on.live){drawLive(m);S.layers.live=liveLayer;if(liveLayer){liveLayer.options.key='tools-live';mapToolsControl()?.addOverlay(liveLayer,'FlyVFR')}}const layer=S.layers[k];if(layer){if(S.on[k])layer.addTo(m);else m.removeLayer(layer)}mapRefreshSpecial(m,window.L)});
document.addEventListener('submit',e=>{if(!['map-plan-form','map-airport-form'].includes(e.target.id))return;e.preventDefault();const S=MAP_TOOLS;
 if(e.target.id==='map-airport-form'){const c=apResolve(document.getElementById('map-explore-code').value);if(!apLL(c))return toast(t('err_icao'));mapExploreAirport(c);return}
 const dep=apResolve(document.getElementById('map-plan-dep').value),raw=document.getElementById('map-plan-arr').value,arr=raw.trim()?apResolve(raw):'';if(!apLL(dep)||(raw.trim()&&!apLL(arr)))return toast(t('err_icao'));
 S.dep=dep;S.arr=arr;S.ac=document.getElementById('map-plan-ac').value;S.minRunway=Math.min(6000,Math.max(0,Number(document.getElementById('map-plan-runway').value)||0));mapToolsSave();const m=mapToolsMap();if(m){mapDrawPlan(m,window.L);const pts=[apLL(dep),apLL(arr)].filter(Boolean);pts.length>1?m.fitBounds(pts,{padding:[35,35],maxZoom:7}):m.setView(pts[0],7);mapExploreAirport(dep,false)}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-action^="map-"]');if(!b)return;const S=MAP_TOOLS,a=b.dataset.action,c=b.dataset.code;
 if(a==='map-airport')return mapExploreAirport(c);
 if(a==='map-origin'||a==='map-destination'){S[a==='map-origin'?'dep':'arr']=c;const input=document.getElementById(a==='map-origin'?'map-plan-dep':'map-plan-arr');if(input)input.value=c;mapToolsSave();if(mapToolsMap())mapDrawPlan(mapToolsMap(),window.L);return}
 if(a==='map-favorite'){const ac=acById(b.dataset.id);if(ac){const at=posNow(ac.id);if(apLL(at))mapExploreAirport(at);paintAircraftSheet(ac.id)}return}
 if(a==='map-event'){const event=EVENTS.find(x=>x.id===b.dataset.id);if(!event)return;view='events';render();setTimeout(()=>document.querySelector(`[data-map-event-id="${CSS.escape(event.id)}"]`)?.scrollIntoView({block:'start',behavior:'smooth'}),40);return}
 if(a==='map-rpl'){const old=S.rplKeys.get(b.dataset.key);if(!old)return;const flight=rsSoonFlights(old.f.dep).find(x=>pfKey(x)===b.dataset.key);if(!flight)return toast(t('pf_window'));
 RS.other=false;RS.dep=flight.f.dep;RS.depSet=true;RS.pf=flight;RS.start=flight.f.std;RS.roster=null;RS.err='';RS.touched=true;ACP.rs.al=flight.al;const available=rsPfAircraft(flight).sort((a,b)=>Number(isFav(b.id))-Number(isFav(a.id)));RS.ac=available.length===1?available[0].id:'';rsSave();view='roster';render()}
});
setInterval(()=>{if(['map','briefing'].includes(view)&&mapToolsMap()&&!document.hidden)mapRefreshSpecial(mapToolsMap(),window.L)},60e3);
