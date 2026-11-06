/* =========================================================================
   Mapa ao vivo: voos rastreados aparecem na posição real enviada pelo simulador.
   A tabela tracks (18_rastreio.sql) guarda a última posição de cada voo em andamento
   e avisa o app em tempo real; o mapa move o avião sem recarregar a tela.
   ========================================================================= */
const LIVE=new Map();          // id do rastreio → linha da tabela tracks
const LIVE_STALE=3*60e3;       // sem posição há mais de 3 min: "sem sinal"
let liveOk=true,liveChan=null,liveLayer=null,liveTrail=null,liveSel=null,liveDrawn="";
const liveTracks=()=>[...LIVE.values()].filter(k=>k.status==="live"&&k.last_lat!=null&&k.last_push&&Date.now()-new Date(k.last_push).getTime()<2*36e5);
const liveStale=k=>Date.now()-new Date(k.last_push).getTime()>LIVE_STALE;
const liveAcIds=()=>new Set(liveTracks().map(k=>k.aircraft_id));
async function loadLiveTracks(){
  if(!sb||!liveOk)return;
  const since=new Date(Date.now()-2*36e5).toISOString();
  const {data:rows,error}=await sb.from("tracks").select("id,reservation_id,pilot_id,aircraft_id,status,source,started_at,last_push,last_lat,last_lon,last_alt,last_gs,last_hdg,last_ground").eq("status","live").gte("last_push",since);
  if(error){liveOk=false;return}
  LIVE.clear();for(const r of rows||[])LIVE.set(r.id,r);
}
function liveSubscribe(){
  if(liveChan||!sb||!liveOk)return;
  liveChan=sb.channel("vfr-tracks").on("postgres_changes",{event:"*",schema:"public",table:"tracks"},p=>{
    const r=p.new&&p.new.id?p.new:null,old=p.old&&p.old.id?p.old:null;
    if(r){if(r.status==="live")LIVE.set(r.id,{...(LIVE.get(r.id)||{}),...r});else LIVE.delete(r.id)}else if(old)LIVE.delete(old.id);
    liveChanged();
  }).subscribe();
}
let liveT=0;
function liveChanged(){
  if(view!=="map")return;const now=Date.now();
  if(now-liveT<500){clearTimeout(liveChanged.t);liveChanged.t=setTimeout(liveChanged,600);return}liveT=now;
  const tracked=[...liveAcIds()].sort().join();
  if(tracked!==liveDrawn && MAPV.map?.refreshFleetMarkers){
    MAPV.map.refreshFleetMarkers();
    liveDrawn=tracked;
  }
  if(MAPV.map&&liveLayer)drawLive(MAPV.map);
  const box=$("#map-live");if(box)box.innerHTML=liveListHTML();
}
const livePlane=(hdg,color,stale)=>window.L.divIcon({className:"map-plane live"+(stale?" stale":""),
  html:`<span class="live-ring"></span><svg viewBox="0 0 24 24" width="30" height="30" style="transform:rotate(${Math.round(hdg||0)}deg)"><path fill="${color}" stroke="#fff" stroke-width=".9" d="M12 2c.8 0 1.3.7 1.3 1.6v5.6l7.7 4.6v2l-7.7-2.3v4.6l2 1.5V21l-3.3-1-3.3 1v-1.4l2-1.5v-4.6L3 15.8v-2l7.7-4.6V3.6C10.7 2.7 11.2 2 12 2z"/></svg>`,iconSize:[30,30],iconAnchor:[15,15]});
function liveInfo(k){
  const r=data.reservations.find(x=>x.id===k.reservation_id),a=acById(k.aircraft_id);
  return{r,a,reg:a?.registration||k.aircraft_id,route:r?`${r.dep} → ${r.arr}`:"",fno:r&&r.flightNo||""}}
function liveTip(k){const {a,reg,route,fno}=liveInfo(k),st=liveStale(k);
  return`<b>${esc(reg)}</b> ${esc(a?icaoType(a.type)||a.type:"")} <span class="live-tag${st?" off":""}">${st?t("map_stale",{x:liveAgo(k)}):t("map_live_chip")}</span><br>${esc(route)}${fno?" · "+esc(fno):""}<br>${esc(pilot(k.pilot_id))}<br>
   <span class="mono">${k.last_ground?t("map_on_ground"):`${Math.round(k.last_alt||0).toLocaleString(LOCALE[lang])} ft`} · ${Math.round(k.last_gs||0)} kt</span>`}
const liveAgo=k=>{const m=Math.max(1,Math.round((Date.now()-new Date(k.last_push).getTime())/6e4));return m<60?`${m} min`:`${Math.floor(m/60)} h`};
function drawLive(m,fit){
  const Lf=window.L;if(!Lf||!m)return;
  if(typeof MAP_TOOLS!=="undefined"&&MAP_TOOLS.on.live===false)return;
  if(!liveLayer||!m.hasLayer(liveLayer)){liveLayer=Lf.layerGroup().addTo(m);liveLayer._mk={}}
  const css=getComputedStyle(document.documentElement),col=css.getPropertyValue("--ok").trim()||"#1C7448",mut=css.getPropertyValue("--muted").trim()||"#888";
  const al=MAPV.airline,seen=new Set();
  for(const k of liveTracks()){const {a}=liveInfo(k);if(al!=="all"&&(!a||a.airline!==al))continue;seen.add(k.id);
    const st=liveStale(k),ll=[k.last_lat,k.last_lon];let mk=liveLayer._mk[k.id];
    if(!mk){mk=Lf.marker(ll,{icon:livePlane(k.last_hdg,st?mut:col,st),zIndexOffset:1000}).addTo(liveLayer);mk._st=st;mk._hdg=k.last_hdg;
      mk.on("click",()=>liveFocus(k.id));liveLayer._mk[k.id]=mk}
    else{mk.setLatLng(ll);if(mk._st!==st||mk._hdg!==k.last_hdg){mk.setIcon(livePlane(k.last_hdg,st?mut:col,st));mk._st=st;mk._hdg=k.last_hdg}}
    mk.unbindTooltip();mk.bindTooltip(liveTip(k),{direction:"top",offset:[0,-12]});
    if(typeof flightInfoBind==='function')flightInfoBind(mk,()=>{const current=LIVE.get(k.id)||k,{r,a,reg,fno}=liveInfo(current);return {source:'FlyVFR · '+t('map_live_chip'),callsign:fno,registration:reg,type:a?.type,pilot:pilot(current.pilot_id),dep:r?.dep,arr:r?.arr,aircraftId:a?.id,lat:current.last_lat,lon:current.last_lon,alt:current.last_alt,gs:current.last_gs,hdg:current.last_hdg,ground:current.last_ground,observed:Date.parse(current.last_push),notice:liveStale(current)?t('map_stale',{x:liveAgo(current)}):''}});
  }
  for(const id of Object.keys(liveLayer._mk))if(!seen.has(id)){liveLayer.removeLayer(liveLayer._mk[id]);delete liveLayer._mk[id]}
  if(liveSel&&LIVE.has(liveSel))liveTrailExtend(m);
}
/* toque no avião: trilha já voada (linha cheia) e o que falta até o destino (tracejado) */
async function liveFocus(id){
  const k=LIVE.get(id),m=MAPV.map;if(!k||!m)return;liveSel=id;
  m.setView([k.last_lat,k.last_lon],Math.max(m.getZoom(),6));
  if(liveTrail){m.removeLayer(liveTrail);liveTrail=null}
  const Lf=window.L,css=getComputedStyle(document.documentElement),col=css.getPropertyValue("--ok").trim()||"#1C7448";
  liveTrail=Lf.layerGroup().addTo(m);liveTrail._id=id;
  const {data:pts}=await sb.from("track_points").select("t,lat,lon").eq("track_id",id).order("t");
  if(liveSel!==id||!liveTrail)return;
  const path=(pts||[]).map(p=>[p.lat,p.lon]);path.push([k.last_lat,k.last_lon]);
  liveTrail._line=Lf.polyline(path,{color:col,weight:3,opacity:.9}).addTo(liveTrail);
  const {r}=liveInfo(k),b=r&&apLL(r.arr);
  if(b){const a=[k.last_lat,k.last_lon];liveTrail._rest=Lf.polyline(Array.from({length:31},(_,i)=>gcPoint(a,b,i/30)),{color:col,weight:2,dashArray:"5 6",opacity:.7}).addTo(liveTrail)}
  const mk=liveLayer&&liveLayer._mk[id];if(mk)mk.openTooltip();
}
function liveTrailExtend(m){const k=LIVE.get(liveSel);if(!k||!liveTrail||!liveTrail._line)return;
  const ll=window.L.latLng(k.last_lat,k.last_lon),line=liveTrail._line,p=line.getLatLngs();if(!p.length||!p[p.length-1].equals(ll))line.addLatLng(ll);
  const {r}=liveInfo(k),b=r&&apLL(r.arr);if(b&&liveTrail._rest){const a=[k.last_lat,k.last_lon];liveTrail._rest.setLatLngs(Array.from({length:31},(_,i)=>gcPoint(a,b,i/30)))}}
function liveListHTML(){
  const al=MAPV.airline,list=liveTracks().filter(k=>{const a=acById(k.aircraft_id);return al==="all"||(a&&a.airline===al)}).sort((x,y)=>new Date(y.last_push)-new Date(x.last_push));
  if(!list.length)return`<p class="muted" style="margin:0">${t("map_live_none")}</p>`;
  return`<div class="map-fly">${list.map(k=>{const {reg,route}=liveInfo(k),st=liveStale(k);
    return`<button type="button" class="map-fly-i live${st?" stale":""}" data-action="live-go" data-k="${esc(k.id)}">${regStack(acById(k.aircraft_id),reg)}<span>${esc(route)} <em class="live-tag${st?" off":""}">${st?t("map_stale",{x:liveAgo(k)}):t("map_live_chip")}</em><small>${esc(pilot(k.pilot_id))} · ${k.last_ground?t("map_on_ground"):`${Math.round(k.last_alt||0).toLocaleString(LOCALE[lang])} ft · ${Math.round(k.last_gs||0)} kt`}</small></span></button>`}).join("")}</div>`}
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="live-go"]');if(b)liveFocus(b.dataset.k)});
/* reserva: sem tempo real no servidor, confere a cada 30 s enquanto o mapa estiver aberto */
setInterval(async()=>{if(view==="map"&&session){await loadLiveTracks();liveChanged()}},30e3);
