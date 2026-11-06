/* Flight details are observations only; no actions modify reservations or reports. */
function flightInfoText(k){const w={title:['Flight details','Informações do voo','Información del vuelo','Informations du vol','Fluginformationen','フライト詳細','航班详情','비행 정보'],click:['Click the aircraft for flight details','Clique na aeronave para ver os detalhes do voo','Haz clic en la aeronave para ver el vuelo','Cliquez sur l’avion pour les détails','Flugzeug für Details anklicken','機体をクリックして詳細を表示','点击飞机查看航班详情','항공기를 클릭하여 비행 정보 보기'],source:['Source','Fonte','Fuente','Source','Quelle','情報源','来源','출처'],position:['Position','Posição','Posición','Position','Position','位置','位置','위치'],updated:['Observation time','Horário da observação','Hora de observación','Heure d’observation','Beobachtungszeit','観測時刻','观测时间','관측 시각'],estimated:['Estimated from booking times — not simulator telemetry','Estimado pelo horário da reserva — não é telemetria do simulador','Estimado por reserva, no telemetría','Estimation selon réservation, pas télémétrie','Nach Buchungszeit geschätzt, keine Telemetrie','予約時刻からの推定でテレメトリーではありません','按预约时刻估算，非模拟器遥测','예약 시각 기준 추정이며 시뮬레이터 원격 측정 아님']};return w[k]?.[LANGS.indexOf(lang)]||w[k]?.[0]||k}
function flightInfoTraffic(p){return {source:p.net==='REAL'?'ADS-B':p.net||'—',callsign:p.cs,registration:p.reg,type:p.type,dep:p.dep,arr:p.arr,alt:p.alt,gs:p.gs,hdg:p.hdg,lat:p.lat,lon:p.lon,ground:p.ground,observed:p.observed||null}}
function flightInfoAirline(p){if(p.airline)return p.airline;const cs=String(p.callsign||'').toUpperCase().replace(/\s/g,''),icao=cs.match(/^([A-Z]{3})(?=\d)/)?.[1],iata=cs.match(/^([A-Z0-9]{2})(?=\d)/)?.[1];if(icao&&typeof AIRLINE_ICAO!=='undefined'){const name=Object.keys(AIRLINE_ICAO).find(k=>AIRLINE_ICAO[k]===icao);if(name)return name}if(iata&&typeof AIRLINE_IATA!=='undefined')return Object.keys(AIRLINE_IATA).find(k=>AIRLINE_IATA[k]===iata)||'';return ''}
function flightInfoHTML(p){const row=(label,value)=>value!==null&&value!==undefined&&value!==''?`<dt>${esc(label)}</dt><dd>${esc(String(value))}</dd>`:'',number=(n,suffix)=>Number.isFinite(n)?Math.round(n)+' '+suffix:'—',coordinates=Number.isFinite(p.lat)&&Number.isFinite(p.lon)?p.lat.toFixed(5)+', '+p.lon.toFixed(5):'—',airline=flightInfoAirline(p),logo=airline&&typeof alSym==='function'?alSym(airline):'',reg=p.registration?(airline&&typeof regTag==='function'?regTag({registration:p.registration,airline}):esc(p.registration)):'';
 const metric=(label,value,unit,description=label)=>`<div class="flight-metric" aria-label="${esc(description)}"><span>${esc(label)}</span><strong>${esc(value)}${unit?`<small> ${esc(unit)}</small>`:''}</strong></div>`;
 return `<article class="flight-map-info"><header class="flight-info-head"><div class="flight-info-eyebrow">${esc(flightInfoText('title'))}<span class="flight-info-source">${typeof netBrandText==='function'?netBrandText(p.source||'—'):esc(p.source||'—')}</span></div><div class="flight-info-identity"><span class="flight-airline-icon">${logo||'<span aria-hidden="true">✈</span>'}</span><div><h3>${esc(p.callsign||p.registration||'—')}</h3>${airline?`<span class="flight-airline-name">${esc(airline)}</span>`:''}</div></div></header><div class="flight-info-body">${flightInfoRouteHTML(p)}${p.registration||p.type?`<div class="flight-info-aircraft">${reg}<span>${esc(p.type||'')}</span></div>`:''}<div class="flight-metrics">${metric(t('map_flight_altitude'),p.ground?t('map_on_ground'):Number.isFinite(p.alt)?Math.round(p.alt).toLocaleString((typeof LOCALE!=='undefined'?LOCALE[lang]:null)||'en-US'):'—',p.ground?'':'ft')}${metric('GS',Number.isFinite(p.gs)?Math.round(p.gs):'—','kt',t('map_flight_gs'))}${metric('HDG',Number.isFinite(p.hdg)?Math.round(p.hdg):'—','°',t('map_flight_hdg'))}</div><dl>${row(t('brf_p_pilot'),p.pilot)}${row(flightInfoText('position'),coordinates)}${row(flightInfoText('updated'),Number.isFinite(p.observed)?new Date(p.observed).toISOString().replace('T',' ').slice(0,19)+' UTC':null)}</dl>${p.estimated?`<p class="flight-info-note">${esc(flightInfoText('estimated'))}</p>`:''}${p.notice?`<p class="flight-info-note">${esc(p.notice)}</p>`:''}${p.aircraftId?`<button type="button" class="btn small" data-action="open-aircraft" data-id="${esc(p.aircraftId)}">${t('aircraft')} ↗</button>`:''}</div></article>`}
function flightRouteEnds(info){
 return [[t('brf_dep'),info.dep],[t('brf_arr'),info.arr]].map(([label,value])=>{
   const code=String(value||'').trim().toUpperCase();
   return {label,code:/^[A-Z0-9]{3,4}$/.test(code)&&!['ZZZZ','NONE','N/A'].includes(code)?code:''};
 });
}
function flightInfoRouteHTML(info){
 const fields=flightRouteEnds(info).map(({label,code})=>`<div><small>${esc(label)}</small><br><b>${esc(code||t('metar_not_reported'))}</b></div>`);
 return '<div class="flight-info-route">'+fields.join('<span aria-hidden="true"> → </span>')+'</div>';
}
function flightRouteOverlay(marker,info){
 const map=marker._map;
 if(!map)return null;
 const layer=L.layerGroup().addTo(map), position=marker.getLatLng();
 const ends=flightRouteEnds(info).map(end=>({...end,ll:end.code&&apLL(end.code)}));
 const path=[ends[0].ll,position,ends[1].ll].filter(Boolean);
 if(path.length>1)L.polyline(path,{color:'#167a9c',weight:3,dashArray:'6 6',interactive:false}).addTo(layer);
 for(const [i,end] of ends.entries()){
   if(!end.ll)continue;
   L.circleMarker(end.ll,{radius:5,color:'#116987',fillColor:'#fff',fillOpacity:1,interactive:false})
     .addTo(layer).bindTooltip(esc(end.code+' · '+end.label),{permanent:true,direction:i?'right':'left',opacity:1});
 }
 return layer;
}
function flightInfoIdentifier(p){return (flightInfoAirline(p)&&p.callsign?p.callsign:p.registration||p.callsign)||'—'}
function flightInfoBind(marker,info){
 marker._flightInfo=info;
 const current=()=>typeof marker._flightInfo==='function'?marker._flightInfo():marker._flightInfo;
 marker.bindPopup(()=>flightInfoHTML(current()),{className:'flight-detail-popup',maxWidth:250,minWidth:220,maxHeight:360,autoPanPadding:[20,20]});
 marker.unbindTooltip();
 marker.bindTooltip(()=>esc(flightInfoIdentifier(current())),{direction:'top',offset:[0,-12],className:'flight-identifier-tooltip',permanent:false});
 if(!marker._flightHoverBound){
  let routeLayer;
  const clearRoute=()=>{routeLayer?.remove();routeLayer=null};
  const showRoute=()=>{clearRoute();routeLayer=flightRouteOverlay(marker,current())};
  marker.on('popupopen',showRoute);
  marker.on('move',()=>{if(routeLayer)showRoute()});
  marker.on('popupclose',clearRoute);
  marker.on('remove',clearRoute);
  marker.on('mouseover',()=>marker.getElement()?.classList.add('flight-aircraft-hover'));
  marker.on('mouseout',()=>marker.getElement()?.classList.remove('flight-aircraft-hover'));
  marker._flightHoverBound=true;
 }
 return marker
}
