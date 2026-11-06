/* Virtual Flight Report — app instalável (PWA) com Supabase */
"use strict";

/* ---------- State ---------- */
const CFG=window.VFR_CONFIG||{};
const configured=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey&&!/COLE_AQUI/.test(CFG.supabaseUrl+CFG.supabaseAnonKey)&&window.supabase);
/* link de "esqueci minha senha": o Supabase volta com type=recovery no endereço */
let recovering=/type=recovery/.test(location.hash);
const sb=configured?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}}):null;
let session=null,db=null,user=null,myId=null,canWrite=null,authMode=recovering?"newpw":"landing",authMsg=null;
/* link de convite (?cadastro): abre direto a tela de criar conta */
try{if(!recovering&&/[?&](cadastro|signup)(=|&|$)/.test(location.search))authMode="signup"}catch(e){}
const data={fleets:[],aircraft:[],reservations:[],flights:[],defects:[],support:[]};
const loaded={fleets:true,aircraft:false};
let fleet=[],fleetById={};
let booting=true,view="fleet",sheet=null,names={},renderToken=0,storeError=null;
let catQuery="";
let fAirline="all",fStatus="all",fQuery="",fLimit=60,fFav=false,fRegion="all";
let fleetGeoVersion=0;
const FLEET_COUNTRY_REGIONS={
 na:'US CA MX GL BM PM',
 sa:'BR AR BO CL CO EC FK GF GY PE PY SR UY VE BZ CR GT HN NI PA SV AG AI AW BB BL BQ BS CU CW DM DO GD GP HT JM KN KY LC MF MQ MS PR SX TC TT VC VG VI',
 eu:'AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA',
 af:'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW IO KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TF TG TN TZ UG YT ZA ZM ZW',
 as:'AE AF AM AZ BD BH BN BT CC CN CX GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
 oc:'AS AU CK FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF WS'
};
function fleetRegionForCountry(country){return Object.keys(FLEET_COUNTRY_REGIONS).find(k=>FLEET_COUNTRY_REGIONS[k].split(' ').includes(country))||'other'}
function fleetPreferredFavorite(country){return fleet.filter(a=>isFav(a.id)&&a.airline).sort((a,b)=>{
  const local=a=>!!country&&typeof alCountry==="function"&&alCountry(a.airline)===country;
  return Number(local(b))-Number(local(a))||a.airline.localeCompare(b.airline)||a.registration.localeCompare(b.registration)
})[0]||null}
async function fleetOpenHomeRegion(){const version=++fleetGeoVersion;
  let country='';
  try{await loadAirports();let code=typeof RS_HOME!=="undefined"?RS_HOME.dep:"";
    if(!code||!AIRPORTS[code]){const pos=typeof lpGeoPos==="function"?await lpGeoPos():null;let distance=500;code='';
      if(pos)for(const [c,a] of Object.entries(AIRPORTS)){const d=gcNm([pos.lat,pos.lon],[a[0],a[1]]);if(d<distance&&a[5]){distance=d;code=c}}}
    country=AIRPORTS?.[code]?.[5]||'';
  }catch(e){}
  if(view!=="fleet"||version!==fleetGeoVersion)return;
  const favorite=fleetPreferredFavorite(country);if(!favorite&&!country)return;
  fRegion=favorite?regionOf(favorite.airline):fleetRegionForCountry(country);fAirline=favorite?favorite.airline:"all";
  fStatus="all";fQuery="";fLimit=60;fFav=false;if(favorite)selAc=favorite.id;render();
}
/* ---------- Regiões das companhias (filtro da frota) ---------- */
const REGION_OF={"GOL":"sa","LATAM Brasil":"sa","LATAM":"sa","Azul":"sa",
  "TAP Air Portugal":"eu","Lufthansa":"eu","Air France":"eu","KLM":"eu","British Airways":"eu","Iberia":"eu","Ryanair":"eu","easyJet":"eu",
  "American Airlines":"na","Delta Air Lines":"na","United Airlines":"na","Southwest Airlines":"na","Alaska Airlines":"na","JetBlue":"na","Air Canada":"na","WestJet":"na","Aeroméxico":"na",
  "Singapore Airlines":"as","Cathay Pacific":"as","ANA":"as","Japan Airlines":"as","Korean Air":"as","Thai Airways":"as","Emirates":"as","Qatar Airways":"as",
  "LATAM Chile":"sa","LATAM Ecuador":"sa","Avianca":"sa","Copa Airlines":"sa","Aerolíneas Argentinas":"sa","JetSMART":"sa","Sky Airline":"sa",
  "Qantas":"oc","Jetstar":"oc","Virgin Australia":"oc","Air New Zealand":"oc","Fiji Airways":"oc","Jetstar Japan":"as",
  "Ethiopian Airlines":"af","EgyptAir":"af","Royal Air Maroc":"af","South African Airways":"af","Airlink":"af","FlySafair":"af","Kenya Airways":"af","RwandAir":"af","Air Algérie":"af","Tunisair":"af","TAAG Angola":"af","Air Mauritius":"af","Air Peace":"af","Air Tanzania":"af","Air Côte d'Ivoire":"af","Uganda Airlines":"af"};
const REGION_KEYS=["sa","eu","na","as","oc","af"];
/* regiões em ordem alfabética no idioma escolhido; "Outras" sempre por último */
const regionsSorted=()=>[...REGION_KEYS].sort((a,b)=>t("reg_"+a).localeCompare(t("reg_"+b),LOCALE[lang]||undefined)).concat("other");
const regionOf=al=>REGION_OF[al]||"other";
let installPrompt=null;

/* ---------- Data layer ---------- */
const ms=v=>v?new Date(v).getTime():null;
const MAP={
  aircraft:r=>({id:r.registration,registration:r.registration,type:r.type,airline:r.airline||"",base:r.base||"",fleet:r.fleet||"airline",owner:r.owner_id||null}),
  reservations:r=>({id:r.id,aircraftId:r.aircraft_id,pilotId:r.pilot_id,dep:r.dep,arr:r.arr,route:r.route||"",flightNo:r.flight_no||"",ferry:!!r.ferry,eventId:r.event_id||null,rosterId:r.roster_id||null,start:ms(r.start_at),end:ms(r.end_at),status:r.status,ackAt:ms(r.ack_at),flightId:r.flight_id,cancelReason:r.cancel_reason||null,dlaAt:ms(r.dla_at),eobtOrig:ms(r.eobt_orig)}),
  flights:r=>({id:r.id,aircraftId:r.aircraft_id,reservationId:r.reservation_id,pilotId:r.pilot_id,dep:r.dep,arr:r.arr,simulator:r.simulator,blockMin:r.block_min,remarks:r.remarks,createdAt:ms(r.created_at),verified:r.verified!==false,trackId:r.track_id||null,landingFpm:r.landing_fpm??null}),
  defects:r=>({id:r.id,aircraftId:r.aircraft_id,flightId:r.flight_id,reservationId:r.reservation_id,reporterId:r.reporter_id,catalogId:r.catalog_id,ata:r.ata,title:r.title,description:r.description,
    phase:r.phase,simulator:r.simulator,outcome:r.outcome,repairH:r.repair_h,deferDays:r.defer_days,deferredUntil:ms(r.deferred_until),opsProcedure:r.ops_procedure,createdAt:ms(r.created_at),voidedAt:ms(r.voided_at)}),
};
async function fetchAll(table){
  const out=[];const page=1000;
  for(let from=0;;from+=page){
    const {data:rows,error}=await sb.from(table).select("*").order(table==="aircraft"?"registration":"id").range(from,from+page-1);
    if(error)throw error; out.push(...rows); if(rows.length<page)break;
  }
  return out;
}
async function load(table){
  try{
    if(table==="profiles"){const rows=await fetchAll("profiles");rows.forEach(p=>names[p.id]=p.display_name||"");isAdmin=!!(rows.find(p=>p.id===myId)||{}).is_admin;if(typeof flOnProfiles==="function")flOnProfiles(rows);}
    else{data[table]=(await fetchAll(table)).map(MAP[table]);if(table==="aircraft"){loaded.aircraft=true;rebuildFleet()}}
    storeError=null; saveCache();
  }catch(e){console.error(table,e);if(navigator.onLine)storeError=true}
}
function rosterMenuLocked(pilotId=myId,now=Date.now()){return data.reservations.some(r=>r.pilotId===pilotId&&booked(r)&&r.end>now)}
function showRosterLocked(){openSheet('roster-locked',`${head('',t('rs_locked_title'))}<p>${t('rs_locked_body')}</p><button class="btn primary" data-view="bookings">${t('nav_bookings')}</button>`)}
let favStart=false;
async function loadEverything(){
  /* escalas cujo prazo de liberação do último voo já passou: cancela os voos não realizados (21_escala_sem_cancelamento.sql) */
  if(sb&&session){try{await Promise.race([Promise.resolve(sb.rpc("expire_rosters")),new Promise(r=>setTimeout(r,4000))])}catch(e){}}
  await Promise.all([...["aircraft","reservations","flights","defects","profiles"].map(load),typeof loadMoves==="function"?loadMoves():null,loadSupport(),loadFavs(),loadEvents(),loadBlocked(),typeof loadLiveTracks==="function"?loadLiveTracks():null]);
  if(typeof liveSubscribe==="function")liveSubscribe();
  /* ao abrir o app (uma vez por login), quem tem favoritas começa vendo só elas na Frota */
  /* ao abrir o app (uma vez por login): quem tem favoritas vê só elas na Frota */
  if(!favStart&&session){favStart=true;if(favs.size){fFav=true;fRegion="all";fAirline="all";fStatus="all";fQuery=""}
    /* quem tem escala ativa (voos reservados ainda por vir ou em andamento) começa em Reservas;
       os demais, na Escala (já com a cidade/país do piloto) */
    const now=Date.now(),hasRoster=data.reservations.some(r=>r.pilotId===myId&&r.rosterId&&r.status==="booked"&&r.end>now);
    view=hasRoster?"bookings":"roster";if(typeof rsHomeInit==="function")rsHomeInit()}
  render()}
/* ---------- Favoritas: tabela favorites no Supabase (03_favorites.sql); sem a tabela, ficam só neste aparelho ---------- */
let favs=new Set(),favLocal=false;
const isFav=id=>favs.has(id);
const favKey=()=>"vfr-favs-"+(myId||"");
function favSaveLocal(){try{localStorage.setItem(favKey(),JSON.stringify([...favs]))}catch(e){}}
function favLoadLocal(){try{favs=new Set(JSON.parse(localStorage.getItem(favKey())||"[]"))}catch(e){favs=new Set()}}
async function loadFavs(){
  if(!sb||!myId)return;
  const {data:rows,error}=await sb.from("favorites").select("aircraft_id");
  if(error){favLocal=true;favLoadLocal();return}
  favLocal=false;favs=new Set(rows.map(r=>r.aircraft_id));
}
async function toggleFav(id){
  const on=!favs.has(id);on?favs.add(id):favs.delete(id);render();if(sheet&&sheet.type==="aircraft"&&sheet.id===id)paintAircraftSheet(id);
  if(favLocal){favSaveLocal();return}
  const r=on?await sb.from("favorites").insert({pilot_id:myId,aircraft_id:id}):await sb.from("favorites").delete().eq("pilot_id",myId).eq("aircraft_id",id);
  if(r.error&&!(on&&r.error.code==="23505")){on?favs.delete(id):favs.add(id);render();toast(t("fav_err"))}
}
const STAR='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const favBtn=(id,big)=>{const on=isFav(id),l=t(on?"fav_remove":"fav_add");return`<button type="button" class="fav${on?" on":""}${big?" big":""}" data-action="fav" data-id="${esc(id)}" aria-pressed="${on}" title="${l}" aria-label="${l}">${STAR}${big?`<span>${t(on?"fav_on":"fav_add")}</span>`:""}</button>`};
const reloadTimers={};
function refreshBackgroundView(){
  if(view==="map" && MAPV.map?.getContainer().isConnected && MAPV.map.refreshFleetMarkers){
    MAPV.map.refreshFleetMarkers();
    return;
  }
  render();
}
function scheduleReload(table){clearTimeout(reloadTimers[table]);reloadTimers[table]=setTimeout(async()=>{await load(table);refreshBackgroundView()},350)}
let channel=null;
function subscribe(){
  if(channel)return;
  channel=sb.channel("vfr-live");
  for(const tb of ["aircraft","reservations","flights","defects","profiles"])
    channel.on("postgres_changes",{event:"*",schema:"public",table:tb},()=>scheduleReload(tb));
  channel.on("postgres_changes",{event:"*",schema:"public",table:"events"},()=>{clearTimeout(reloadTimers.ev);reloadTimers.ev=setTimeout(async()=>{await loadEvents();refreshBackgroundView()},350)});
  channel.on("postgres_changes",{event:"*",schema:"public",table:"blocked_users"},()=>{clearTimeout(reloadTimers.bl);reloadTimers.bl=setTimeout(async()=>{await loadBlocked();render()},350)});
  for(const tb of ["support_settings","support_months"])
    channel.on("postgres_changes",{event:"*",schema:"public",table:tb},()=>{clearTimeout(reloadTimers.sup);reloadTimers.sup=setTimeout(async()=>{await loadSupport();refreshBackgroundView()},350)});
  channel.subscribe();
}
/* Último estado conhecido, para abrir sem internet */
function saveCache(){try{localStorage.setItem("vfr-cache",JSON.stringify({data,names,at:Date.now()}))}catch(e){}}
function restoreCache(){try{const c=JSON.parse(localStorage.getItem("vfr-cache")||"null");if(!c)return;
  for(const k of ["aircraft","reservations","flights","defects"])data[k]=c.data[k]||[];Object.assign(names,c.names||{});loaded.aircraft=true;rebuildFleet()}catch(e){}}

/* ---------- Helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const p2=n=>String(n).padStart(2,"0");
/* horário duplo: local (o do relógio do piloto) e UTC (referência da aviação) */
function utcPart(ms){const d=new Date(ms),l=new Date(ms);const t=`${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}\u00a0UTC`;
  return d.getUTCDate()!==l.getDate()?`${t} (${p2(d.getUTCDate())}/${p2(d.getUTCMonth()+1)})`:t}
const fmt=ms=>`${dtf.format(ms)}\u00a0${t("t_local")} · ${utcPart(ms)}`;
const utcHM=ms=>{const d=new Date(ms);return`${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`};
/* só a hora (mesmo dia já informado): 04:25 local · 07:25 UTC */
const fmtT=ms=>`${tf.format(ms)}\u00a0${t("t_local")} · ${utcHM(ms)}\u00a0UTC`;
/* intervalo: qui., 15 de out., 19:37–21:37 local · 22:37–00:37 UTC */
const fmtRange=(s,e)=>`${dtf.format(s)}\u2060–\u2060${tf.format(e)}\u00a0${t("t_local")} · ${utcHM(s)}\u2060–\u2060${utcHM(e)}\u00a0UTC`;
function utcHint(id){const i=document.getElementById(id),h=document.getElementById(id+"-utc");if(!i||!h)return;const ms=new Date(i.value).getTime();
  h.textContent=isNaN(ms)?"":t("utc_eq",{u:utcPart(ms)})}
document.addEventListener("input",e=>{if(e.target.id==="bk-start"||e.target.id==="ev-start")utcHint(e.target.id)});
try{new MutationObserver(()=>{for(const id of ["bk-start","ev-start"]){const h=document.getElementById(id+"-utc");if(h&&!h.textContent)utcHint(id)}}).observe(document.body,{childList:true,subtree:true})}catch(e){}
function rel(ms){let mins=Math.ceil(Math.max(0,ms-Date.now())/6e4);const days=Math.floor(mins/1440);mins-=days*1440;const h=Math.floor(mins/60),m=mins%60;
  if(days)return`${days}d ${h}h`;if(h)return`${h}h ${String(m).padStart(2,"0")}m`;return`${m} min`}
const block=min=>`${Math.floor(min/60)}:${String(min%60).padStart(2,"0")}`;
const toLocalInput=ms=>{const d=new Date(ms);return new Date(ms-d.getTimezoneOffset()*6e4).toISOString().slice(0,16)};
const pilot=id=>id&&id===myId?t("you"):(names[id]||t("a_pilot"));
const acById=id=>fleetById[id];
function toast(msg){const el=$("#toast");el.textContent=msg;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,3600)}
function rebuildFleet(){
  const m={};
  for(const f of data.fleets) for(const a of (f.aircraft||[])) m[a.reg]={id:a.reg,registration:a.reg,type:a.type,airline:f.airline,base:a.base||"",fleet:"airline",owner:null};
  for(const a of data.aircraft) m[a.id]={id:a.id,registration:a.registration,type:a.type,airline:a.airline||"",base:a.base||"",fleet:a.fleet||"airline",owner:a.owner||null};
  fleetById=m;fleet=Object.values(m).sort((a,b)=>a.registration.localeCompare(b.registration));
}
/* companhias agrupadas por região (em ordem alfabética, "Outras" no fim) e depois em ordem alfabética */
const airlines=()=>{const R=regionsSorted();return[...new Set(fleet.map(a=>a.airline).filter(Boolean))].sort((x,y)=>R.indexOf(regionOf(x))-R.indexOf(regionOf(y))||x.localeCompare(y))};

/* ---------- Maintenance windows (status always derived from time) ---------- */
function windowsFor(acId,defects=data.defects){
  const w=[];
  for(const d of defects){if(d.aircraftId!==acId||d.voidedAt)continue;
    if(d.outcome==="grounded")w.push({kind:"aog",s:d.createdAt,e:d.createdAt+d.repairH*H,d});
    if(d.outcome==="deferred"){w.push({kind:"mel",s:d.createdAt,e:d.deferredUntil,d});w.push({kind:"aog",s:d.deferredUntil,e:d.deferredUntil+(d.repairH||2)*H,d,expiry:true})}}
  return w;
}
function releaseAt(acId,at=Date.now(),defects){
  const aog=windowsFor(acId,defects).filter(w=>w.kind==="aog");let end=at,moved=true;
  while(moved){moved=false;for(const w of aog){if(w.s<=end&&w.e>end){end=w.e;moved=true}}}
  return end>at?end:null;
}
const NO_STATUS={key:"ok",items:[]};
function statusOf(acId){
  if(!data.defects.some(d=>d.aircraftId===acId&&!d.voidedAt)) return NO_STATUS;
  const now=Date.now(),r=releaseAt(acId,now),ws=windowsFor(acId);
  if(r)return{key:"bad",until:r,items:ws.filter(w=>w.kind==="aog"&&w.s<=now&&w.e>now)};
  const mel=ws.filter(w=>w.kind==="mel"&&w.s<=now&&w.e>now);
  return mel.length?{key:"warn",items:mel}:NO_STATUS;
}
const stLabel=k=>t("st_"+k);
function aogOverlap(acId,s,e,defects){return windowsFor(acId,defects).filter(w=>w.kind==="aog"&&w.s<e&&w.e>s).sort((a,b)=>b.e-a.e)[0]||null}
const booked=r=>r.status==="booked";
/* fim da escala = horário previsto de liberação da aeronave no último voo (fim da última reserva) */
/* botões de cancelar: o piloto cancela reservas avulsas; o administrador cancela também voos e escalas inteiras de qualquer piloto */
const admCancelBtns=r=>`<button class="btn small danger" data-action="cancel-booking" data-id="${r.id}">${t("cancel")}</button>${isAdmin&&r.rosterId?`<button class="btn small danger" data-action="cancel-roster" data-id="${esc(r.rosterId)}">${t("rs_cancel_all")}</button>`:""}`;
const rosterEnd=rid=>Math.max(...data.reservations.filter(x=>x.rosterId===rid&&(x.status==="booked"||x.status==="completed")).map(x=>x.end),0);


/* ---------- Tema claro/escuro ---------- */
function getTheme(){try{const v=localStorage.getItem("vfr-theme");return v==="light"||v==="dark"?v:"auto"}catch(e){return "auto"}}
function applyTheme(v){const r=document.documentElement;
  if(v==="light"||v==="dark")r.setAttribute("data-theme",v);else r.removeAttribute("data-theme");
  const dark=v==="dark"||(v==="auto"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=dark?"#0E161E":"#13202E";}
const ICON_SUN='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>';
const ICON_MOON='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 1 1 10 4.6a6.4 6.4 0 0 0 9.5 9.9z"/><path d="M16.5 3.5v3M15 5h3M20.2 7.6v1.8M19.3 8.5h1.8"/></svg>';
function isDark(){const v=getTheme();return v==="dark"||(v==="auto"&&!!window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)}
function paintThemeBtn(){const d=isDark(),lbl=t(d?"theme_light":"theme_dark");
  document.querySelectorAll("#theme,[data-theme-btn]").forEach(b=>{
    b.classList.toggle("night",d);b.setAttribute("aria-pressed",d?"true":"false");
    b.innerHTML=`<span class="tg-knob">${d?ICON_MOON:ICON_SUN}</span>`;
    b.title=lbl;b.setAttribute("aria-label",lbl)});
  if(typeof lpThemeImgs==="function")lpThemeImgs()}
applyTheme(getTheme());
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(getTheme()==="auto"){applyTheme("auto");paintThemeBtn()}})}catch(e){}
document.addEventListener("click",e=>{if(!e.target.closest||!e.target.closest("#theme,[data-theme-btn]"))return;
  const v=isDark()?"light":"dark";try{localStorage.setItem("vfr-theme",v)}catch(x){}applyTheme(v);paintThemeBtn()});

/* ---------- Rendering ---------- */
/* Idioma: botões com bandeiras (desenhadas aqui para aparecerem também no Windows) */
const FLAG_SVG={
 en:'<rect width="60" height="40" fill="#012169"/><path d="M0,0 60,40M60,0 0,40" stroke="#fff" stroke-width="8"/><path d="M0,0 60,40M60,0 0,40" stroke="#C8102E" stroke-width="3"/><path d="M30,0V40M0,20H60" stroke="#fff" stroke-width="12"/><path d="M30,0V40M0,20H60" stroke="#C8102E" stroke-width="7"/>',
 pt:'<rect width="60" height="40" fill="#009C3B"/><path d="M30,5 55,20 30,35 5,20Z" fill="#FFDF00"/><circle cx="30" cy="20" r="8.5" fill="#002776"/><path d="M21.8,18.2 Q30,16 38.4,21.6" stroke="#fff" stroke-width="1.6" fill="none"/>',
 es:'<rect width="60" height="40" fill="#AA151B"/><rect y="10" width="60" height="20" fill="#F1BF00"/>',
 fr:'<rect width="60" height="40" fill="#fff"/><rect width="20" height="40" fill="#002654"/><rect x="40" width="20" height="40" fill="#CE1126"/>',
 de:'<rect width="60" height="40" fill="#000"/><rect y="13.33" width="60" height="13.34" fill="#DD0000"/><rect y="26.67" width="60" height="13.33" fill="#FFCE00"/>',
 ja:'<rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="12" fill="#BC002D"/>',
 zh:'<rect width="60" height="40" fill="#EE1C25"/><path d="M10.00,4.00 11.35,8.15 15.71,8.15 12.18,10.71 13.53,14.85 10.00,12.29 6.47,14.85 7.82,10.71 4.29,8.15 8.65,8.15Z" fill="#FFDE00"/><path d="M20.78,2.16 20.65,3.61 21.99,4.17 20.58,4.50 20.45,5.95 19.70,4.70 18.29,5.03 19.24,3.93 18.49,2.69 19.83,3.26Z" fill="#FFDE00"/><path d="M25.44,6.61 24.76,7.89 25.77,8.94 24.33,8.69 23.65,9.97 23.45,8.53 22.02,8.28 23.33,7.64 23.12,6.20 24.13,7.25Z" fill="#FFDE00"/><path d="M25.88,13.32 24.73,14.21 25.23,15.58 24.03,14.76 22.88,15.66 23.28,14.26 22.08,13.45 23.53,13.40 23.93,12.00 24.43,13.37Z" fill="#FFDE00"/><path d="M20.72,16.13 20.64,17.58 22.00,18.10 20.59,18.48 20.52,19.93 19.73,18.71 18.32,19.09 19.24,17.96 18.45,16.74 19.80,17.26Z" fill="#FFDE00"/>',
 ko:'<rect width="60" height="40" fill="#fff"/><g transform="rotate(33.7 30 20)"><path d="M20,20 A10,10 0 0 1 40,20 A5,5 0 0 1 30,20 A5,5 0 0 0 20,20Z" fill="#CD2E3A"/><path d="M20,20 A10,10 0 0 0 40,20 A5,5 0 0 0 30,20 A5,5 0 0 1 20,20Z" fill="#0047A0"/></g><g transform="translate(13 8.7) rotate(-56.3)" fill="#000"><rect x="-4" y="-4" width="8" height="2"/><rect x="-4" y="-1" width="8" height="2"/><rect x="-4" y="2" width="8" height="2"/></g><g transform="translate(47 31.3) rotate(-56.3)" fill="#000"><rect x="-4" y="-4" width="3.5" height="2"/><rect x="0.5" y="-4" width="3.5" height="2"/><rect x="-4" y="-1" width="3.5" height="2"/><rect x="0.5" y="-1" width="3.5" height="2"/><rect x="-4" y="2" width="3.5" height="2"/><rect x="0.5" y="2" width="3.5" height="2"/></g><g transform="translate(47 8.7) rotate(56.3)" fill="#000"><rect x="-4" y="-4" width="8" height="2"/><rect x="-4" y="-1" width="3.5" height="2"/><rect x="0.5" y="-1" width="3.5" height="2"/><rect x="-4" y="2" width="8" height="2"/></g><g transform="translate(13 31.3) rotate(56.3)" fill="#000"><rect x="-4" y="-4" width="3.5" height="2"/><rect x="0.5" y="-4" width="3.5" height="2"/><rect x="-4" y="-1" width="8" height="2"/><rect x="-4" y="2" width="3.5" height="2"/><rect x="0.5" y="2" width="3.5" height="2"/></g>'};
const LANG_NAME={en:"English",pt:"Português",es:"Español",fr:"Français",de:"Deutsch",ja:"日本語",zh:"中文（简体）",ko:"한국어"};
function paintFlags(){const el=$("#flags");if(!el)return;
  el.setAttribute("aria-label",t("lang_label"));
  el.innerHTML=`<span class="flags-l">${t("lang_label")}</span><div class="flags-row">${LANGS.map(k=>`<button type="button" class="flag${k===lang?" on":""}" data-lang="${k}" title="${LANG_NAME[k]}" aria-label="${LANG_NAME[k]}" aria-pressed="${k===lang}"><svg viewBox="0 0 60 40" aria-hidden="true">${FLAG_SVG[k]}</svg><span>${k.toUpperCase()}</span></button>`).join("")}</div>`}
document.addEventListener("click",e=>{const b=e.target.closest(".flag[data-lang]");if(!b||b.dataset.lang===lang)return;const s=$("#lang");s.value=b.dataset.lang;s.dispatchEvent(new Event("change",{bubbles:true}))});
function paintChrome(){
  document.documentElement.lang=lang; $("#lang").value=lang; $("#tag").textContent=t("tag"); paintFlags();
  paintThemeBtn();
  $("#tabs").innerHTML=["roster","briefing","bookings","logbook","fleet","map","catalog","events","manual","support",...(IS_ADMIN()?["admin"]:[])].map(v=>{const lockedRoster=v==='roster'&&rosterMenuLocked(),off=lockedRoster||(v==='briefing'&&!(typeof briefingEnabled==='function'&&briefingEnabled()));return`<button class="tab${off?' tab-off':''}" data-view="${v}" ${lockedRoster?'aria-disabled="true"':''} title="${esc(lockedRoster?'🔒 '+t('rs_locked_title'):off?'🔒 '+t('brf_locked'):t('nav_'+v))}" aria-current="${v===view?'page':'false'}">${NAV_ICON[v]}<span>${t('nav_'+v)}</span></button>`}).join("");
  const pt=$("#page-title");if(pt)pt.textContent=session&&!recovering?t("nav_"+view):"";
  paintClock();if(typeof paintBell==="function")paintBell();
  const pl=$("#palette");if(pl){const cur=getPalette(),nm=k=>t("pal_"+k).replace(/^[^:：]+[:：]\s*/,"");pl.setAttribute("aria-label",t("pal_title"));
    pl.innerHTML=`<span class="lay-l">${t("pal_title")} · <b>${esc(nm(cur))}</b></span><div class="pal-row">${PALETTES.map(k=>{const [sd,ac,bg]=PAL_SW[k];return`<button type="button" class="pal-btn${k===cur?" on":""}" data-pal="${k}" title="${esc(nm(k))}" aria-label="${esc(nm(k))}" aria-pressed="${k===cur}"><svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true"><rect width="30" height="20" rx="3" fill="${bg}"/><rect width="9" height="20" rx="3" fill="${sd}"/><rect x="7" width="2" height="20" fill="${sd}"/><circle cx="4.5" cy="5" r="2" fill="${ac}"/><rect x="12" y="5" width="14" height="3" rx="1.5" fill="${ac}"/><rect x="12" y="11" width="10" height="2" rx="1" fill="${sd}" opacity=".35"/><rect x="12" y="15" width="12" height="2" rx="1" fill="${sd}" opacity=".35"/></svg></button>`}).join("")}</div>`}
  const fb=$("#foot-btn");if(fb){fb.title=t("menu_more");fb.setAttribute("aria-label",t("menu_more"));fb.querySelector("span").textContent=t("menu_more")}
  const pi=$("#pc-install");if(pi){const lab=t(WIDE_NAV.matches?"install_pc":"install_app");pi.hidden=isStandalone();pi.querySelector("span").textContent=lab;pi.title=lab;pi.setAttribute("aria-label",lab)}
  const ly=$("#layout");if(ly){const narrow=!WIDE_NAV.matches;let cur=getLayout();if(narrow&&cur!=="bottom")cur="side";
    ly.innerHTML=`<span class="lay-l">${t("layout_label")}</span><div class="lay-row">${LAYOUTS.map(k=>`<button type="button" class="lay-btn${k===cur?" on":""}" data-layout="${k}" title="${esc(t("layout_"+k))}" aria-label="${esc(t("layout_"+k))}" aria-pressed="${k===cur}">${LAY_ICON[k]}</button>`).join("")}</div>`}
}
const _ic=d=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const NAV_ICON={
  fleet:_ic('<path d="M21 15.5v-1.8l-7.5-4.7V4a1.5 1.5 0 0 0-3 0v5L3 13.7v1.8l7.5-2.3v4.6l-2 1.5V21l3.5-1 3.5 1v-1.7l-2-1.5v-4.6z"/>'),
  bookings:_ic('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  logbook:_ic('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>'),
  catalog:_ic('<path d="M12 3.5 21 19H3z"/><path d="M12 10v4M12 16.8v.2"/>'),
  manual:_ic('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.8v.2"/>'),
  support:_ic('<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>'),
  map:_ic('<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>'),
  roster:_ic('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h5M8 17h3"/><circle cx="17" cy="16" r="3.2"/><path d="M17 14.6V16l1 .8"/>'),
  events:_ic('<circle cx="8" cy="9" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M2.8 19a5.2 5.2 0 0 1 10.4 0M13.5 18.5a4 4 0 0 1 7.7-1"/>'),
  weather:_ic('<path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.5a3.75 3.75 0 0 1 .5 7.47"/><path d="M12 12v5M12 19.5v.2"/>'),
  briefing:`<svg class="ais-nav-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><text x="12" y="21" text-anchor="middle" fill="currentColor" font-family="Arial,sans-serif" font-weight="700" font-size="26">C</text></svg>`,
  admin:_ic('<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>')
};
function paintClock(){const el=$("#clock");if(!el)return;const d=new Date(),p=n=>String(n).padStart(2,"0");
  el.textContent=`LOCAL ${p(d.getHours())}:${p(d.getMinutes())} · UTC ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`}
setInterval(paintClock,15e3);
/* tela larga: frota em tabela com painel de detalhe fixo à direita */
const WIDE=window.matchMedia?matchMedia("(min-width:1100px)"):{matches:false};
let selAc=null;
/* Posição do menu: lateral com texto, topo, ícones à esquerda, à direita ou embaixo */
const LAYOUTS=["side","top","left","right","bottom"];
const WIDE_NAV=matchMedia("(min-width:900px)");
try{WIDE_NAV.addEventListener("change",()=>paintChrome())}catch(e){}
/* miniaturas: uma tela com o menu na posição correspondente */
const _lay=b=>`<svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><rect x=".75" y=".75" width="26.5" height="18.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>${b}</svg>`;
const LAY_ICON={
  side:_lay('<rect x="2" y="2" width="9" height="16" rx="1" fill="currentColor"/><path d="M13.5 6h11M13.5 10h11M13.5 14h7" stroke="currentColor" stroke-width="1.3" opacity=".45"/>'),
  top:_lay('<rect x="2" y="2" width="24" height="4" rx="1" fill="currentColor"/><path d="M4.5 10h19M4.5 14h13" stroke="currentColor" stroke-width="1.3" opacity=".45"/>'),
  left:_lay('<rect x="2" y="2" width="4" height="16" rx="1" fill="currentColor"/><path d="M9 6h15.5M9 10h15.5M9 14h10" stroke="currentColor" stroke-width="1.3" opacity=".45"/>'),
  right:_lay('<rect x="22" y="2" width="4" height="16" rx="1" fill="currentColor"/><path d="M3.5 6h15.5M3.5 10h15.5M3.5 14h10" stroke="currentColor" stroke-width="1.3" opacity=".45"/>'),
  bottom:_lay('<rect x="2" y="14" width="24" height="4" rx="1" fill="currentColor"/><path d="M4.5 5h19M4.5 9h13" stroke="currentColor" stroke-width="1.3" opacity=".45"/>')};
document.addEventListener("click",e=>{const b=e.target.closest(".lay-btn[data-layout]");if(!b)return;e.stopPropagation();setLayout(b.dataset.layout)},true);
function getLayout(){try{const v=localStorage.getItem("vfr-layout");return LAYOUTS.includes(v)?v:"left"}catch(e){return "left"}}
function setLayout(v){try{localStorage.setItem("vfr-layout",v)}catch(e){}
  if(v!=="side")document.documentElement.setAttribute("data-layout",v);else document.documentElement.removeAttribute("data-layout");closeSheet();render()}
function footOpen(on){document.documentElement.classList.toggle("foot-open",on);const b=$("#foot-btn");if(b)b.setAttribute("aria-expanded",String(on))}
document.addEventListener("click",e=>{
  if(e.target.closest("#foot-btn")){footOpen(!document.documentElement.classList.contains("foot-open"));return}
  if(document.documentElement.classList.contains("foot-open")&&!e.target.closest("#side-foot"))footOpen(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.documentElement.classList.contains("foot-open"))footOpen(false)});
const PALETTES=["cockpit","default","sunset","amazon","caribe","bordo","sky","violet","coral"];
/* amostra de cada tema: [menu, destaque, fundo] */
const PAL_SW={cockpit:["#1A1A1A","#F5B700","#F2F2F0"],default:["#13202E","#55B4DE","#E8ECF0"],sunset:["#2B1B3D","#FF8A3D","#FBF3EC"],amazon:["#12372A","#69DB7C","#EEF4EF"],caribe:["#0B3C5D","#3BC9DB","#E9F6F7"],bordo:["#4A0E1F","#E0B356","#F7F1EA"],sky:["#DDE4F5","#3B5BDB","#F1F4FB"],violet:["#241B3F","#B197FC","#F4F1FB"],coral:["#2D1E2F","#FF8787","#FFF4F2"]};
document.addEventListener("click",e=>{const b=e.target.closest(".pal-btn[data-pal]");if(!b)return;e.stopPropagation();setPalette(b.dataset.pal)},true);
function getPalette(){try{const v=localStorage.getItem("vfr-palette");return PALETTES.includes(v)?v:"cockpit"}catch(e){return "cockpit"}}
function setPalette(v){try{localStorage.setItem("vfr-palette",v)}catch(e){}
  if(v==="default")document.documentElement.removeAttribute("data-palette");else document.documentElement.setAttribute("data-palette",v);paintChrome()}
const splitFleet=()=>WIDE.matches&&["side","left","right"].includes(getLayout());
try{WIDE.addEventListener("change",()=>{if(view==="fleet"){closeSheet();render()}})}catch(e){}
async function renderApp(){
  const token=++renderToken;
  const ids=new Set();
  data.reservations.forEach(r=>ids.add(r.pilotId));data.flights.forEach(f=>ids.add(f.pilotId));data.defects.forEach(d=>ids.add(d.reporterId));ids.delete(undefined);ids.delete(null);
  if(token!==renderToken)return;
  if(typeof rosterAckRedirect==="function")rosterAckRedirect();
  paintChrome();
  const v=$("#view"),head=[];
  if(!navigator.onLine)head.push(`<div class="notice">${esc(t("offline_banner"))}</div>`);
  else if(storeError)head.push(`<div class="notice bad">${esc(t("store_error"))}</div>`);
  if(canWrite===false)head.push(`<div class="notice">${esc(t("no_access"))}</div>`);
  const cancelled=myCancelled();
  cancelled.forEach(r=>head.push(`<div class="notice bad alt-notice"><span>${t("cancelled_notice",{reg:`${regTag(acById(r.aircraftId),r.aircraftId)}`,t:fmt(r.start)})}</span>
    <span class="row" style="gap:6px">${r.start>Date.now()?`<button class="btn small primary" data-action="alt" data-id="${esc(r.id)}">${t("alt_btn")}</button>`:""}<button class="btn small" data-action="alt-dismiss" data-id="${esc(r.id)}">${t("alt_dismiss")}</button></span></div>`));
  if(typeof divNotices==="function")head.push(...divNotices());
  if(typeof trkBanner==="function"){const b=trkBanner();if(b)head.unshift(b)}
  const kid=document.activeElement&&["f-q","cat-q"].includes(document.activeElement.id)?document.activeElement.id:null,keep=kid?document.activeElement.selectionStart:null;
  {const d=$(".detail");renderApp.dScroll=d?d.scrollTop:0}
  if(meBlocked)head.unshift(`<div class="notice bad">${esc(t("err_blocked"))}</div>`);
  if(view==="admin"&&!IS_ADMIN())view="fleet";
  v.innerHTML=head.join("")+({fleet:viewFleet,map:viewMap,bookings:viewBookings,briefing:(...x)=>window.viewBriefing?window.viewBriefing(...x):viewFleet(),events:viewEvents,roster:viewRoster,logbook:viewLogbook,catalog:viewCatalog,manual:viewManual,support:viewSupport,admin:viewAdmin,live:viewLive}[view]||viewFleet)();
  decorateSkyVector(v);
  if(typeof decorateSimulatorNames==="function")decorateSimulatorNames(v);
  if(typeof reportGuardRender==="function")reportGuardRender(v);
  /* transição suave ao trocar de menu: o conteúdo novo entra com fade e leve subida, em cascata */
  if(renderApp.lastView!==view){if(renderApp.lastView!==undefined){v.classList.remove("vt");void v.offsetWidth;v.classList.add("vt");const tb=$("#tabs");if(tb)tb.classList.add("vt");clearTimeout(renderApp.vtT);renderApp.vtT=setTimeout(()=>{v.classList.remove("vt");if(tb)tb.classList.remove("vt")},900)}renderApp.lastView=view}
  if(view==="map")initMap();
  hydratePhotos();
  if(view==="support")paintPixQr();
  /* oferece a troca de aeronave uma única vez, logo que o piloto vê o cancelamento */
  /* (avisos de desvio entram no topo) */
  const firstAlt=cancelled.find(r=>r.start>Date.now()&&!altSeen(r.id,"shown"));
  if(firstAlt&&!sheet){altMark(firstAlt.id,"shown");setTimeout(()=>{if(!sheet)sheetAlternatives(firstAlt.id)},300)}
  if(keep!==null){const q=$("#"+kid);if(q){q.focus();q.setSelectionRange(keep,keep)}}
  if(sheet&&sheet.type==="aircraft")paintAircraftSheet(sheet.id);
  if(view==="fleet"){const d=$(".detail");if(d&&renderApp.lastSel===selAc)d.scrollTop=renderApp.dScroll||0;renderApp.lastSel=selAc}
}
function loadingViewText(){return t(({fleet:'loading_fleet',map:'loading_map',roster:'loading_roster',bookings:'loading_bookings'})[view]||'loading')}
function offline(){if(booting||(!loaded.aircraft&&db))return`<div class="empty"><h2>${loadingViewText()}</h2></div>`;return`<div class="empty"><h2>${t("offline_title")}</h2><p>${t("offline_body")}</p></div>`}

function acCard(a){
  const s=statusOf(a.id),fl=data.flights.filter(f=>f.aircraftId===a.id),mins=fl.reduce((x,f)=>x+(f.blockMin||0),0);let line;
  if(s.key==="bad")line=`<span style="color:var(--bad);font-weight:600">${t("back_in",{t:fmt(s.until)})}</span> <span class="muted">· ${t("in_x",{x:rel(s.until)})}</span>`;
  else if(s.key==="warn")line=`<span style="color:var(--warn);font-weight:600">${s.items.length===1?t("mel_1"):t("mel_n",{n:s.items.length})}</span> ${esc(s.items.map(w=>defTitle(w.d)).join(", "))}`;
  else{const nx=data.reservations.filter(r=>r.aircraftId===a.id&&booked(r)&&r.end>Date.now()).sort((x,y)=>x.start-y.start)[0];
    line=nx?`<span class="muted">${t("next_booking")}</span> ${fmt(nx.start)} · ${esc(pilot(nx.pilotId))}`:`<span class="muted">${t("no_upcoming")}</span>`}
  return`<div class="ac s-${s.key}" role="button" tabindex="0" data-action="open-aircraft" data-id="${esc(a.id)}">
    ${planeImg(a)}
    <div class="ac-top">${regTag(a,"")}<span class="ac-top-r"><span class="pill ${s.key}">${stLabel(s.key)}</span>${favBtn(a.id)}</span></div>
    <div class="ac-mid"><div><div class="airline">${esc(a.airline||"")}</div><div class="ac-type">${esc(a.type)} ${posChip(a.id)}</div></div>${alLogo(a.airline)}</div>
    <div class="ac-line">${line}</div>
    <div class="ac-foot"><span class="mono">${block(mins)} h · ${fl.length} ${t("cycles")}</span><span>${t("open_log")}</span></div></div>`;
}
function viewFleet(){
  if(!db||!loaded.fleets||!loaded.aircraft)return offline();
  const add=`<button class="btn primary" data-action="new-aircraft" ${canWrite===false?"disabled":""}>${t("add_aircraft")}</button>`;
  if(!fleet.length)return`<div class="empty"><span class="eyebrow">${t("empty_eyebrow")}</span><h2>${t("empty_title")}</h2><p>${t("empty_body")}</p>${add}</div>`;
  const st={};fleet.forEach(a=>st[a.id]=statusOf(a.id).key);
  const c=k=>fleet.filter(a=>st[a.id]===k).length;
  const q=fQuery.trim().toUpperCase();
  if(!LIVERIES)loadLiveries();
  
  const list=fleet.filter(a=>(!fFav||isFav(a.id))&&(fRegion==="all"||regionOf(a.airline)===fRegion)&&(fAirline==="all"||a.airline===fAirline)&&(fStatus==="all"||st[a.id]===fStatus)&&(!q||a.registration.includes(q)||a.type.toUpperCase().includes(q)||(q.length>=3&&posNow(a.id)===q)))
    .sort((a,b)=>(isFav(b.id)-isFav(a.id))||({bad:0,warn:1,ok:2}[st[a.id]]-{bad:0,warn:1,ok:2}[st[b.id]])||a.registration.localeCompare(b.registration));
  const nFav=fleet.filter(a=>isFav(a.id)).length;
  const shown=list.slice(0,fLimit);
  const al=airlines();
  return`<div class="sec-head"><div><span class="eyebrow">${t("fleet_eyebrow")}</span><h2>${t("fleet_title")}</h2></div>${add}</div>
   <div class="summary"><span><b>${c("ok")}</b>${t("sum_ok")}</span><span><b>${c("warn")}</b>${t("sum_warn")}</span><span><b>${c("bad")}</b>${t("sum_bad")}</span><span><b>${fleet.length}</b>${t("sum_regs")}</span></div>
   <div class="filters">
     <div class="seg" role="group" aria-label="${t("region")}">${["all",...regionsSorted().filter(r=>al.some(x=>regionOf(x)===r))].map(r=>`<button data-action="f-region" data-v="${r}" aria-pressed="${fRegion===r}">${t("reg_"+r)} <span class="seg-n">${r==="all"?fleet.length:fleet.filter(a=>regionOf(a.airline)===r).length}</span></button>`).join("")}</div>
     ${fRegion!=="all"?`<div class="seg seg-sub" role="group" aria-label="${t("airline")}">${["all",...al.filter(x=>regionOf(x)===fRegion)].map(x=>`<button data-action="f-airline" data-v="${esc(x)}" aria-pressed="${fAirline===x}">${x==="all"?t("all_airlines"):alSym(x)+esc(x)}</button>`).join("")}</div>`:""}
     <button class="btn small fav-filter" data-action="f-fav" aria-pressed="${fFav}">${STAR} ${t("fav_filter",{n:nFav})}</button>
     <select id="f-status" aria-label="Status" style="width:auto"><option value="all">${t("status_all")}</option>${["ok","warn","bad"].map(k=>`<option value="${k}" ${fStatus===k?"selected":""}>${stLabel(k)}</option>`).join("")}</select>
     <input id="f-q" type="search" placeholder="${t("search_ph")}" value="${esc(fQuery)}" autocomplete="off">
     <span class="muted" style="font-size:.85rem">${t("showing",{a:shown.length,b:list.length})}</span>
   </div>
   ${fFav?`<div class="notice fav-note"><span>${STAR} ${t("fav_showing",{n:nFav})}</span><button class="btn small" data-action="f-fav">${t("fav_show_all")}</button></div>`:""}
   ${splitFleet()?fleetSplit(list,shown):`${list.length?`<div class="fleet">${shown.map(acCard).join("")}</div>`:`<p class="muted">${t("no_match")}</p>`}
   ${list.length>shown.length?`<button class="btn more" data-action="more">${t("show_more",{n:Math.min(60,list.length-shown.length)})}</button>`:""}`}`;
}
function acRowLine(a,s){
  if(s.key==="bad")return`<span style="color:var(--bad);font-weight:600">${t("back_in",{t:fmt(s.until)})}</span>`;
  if(s.key==="warn")return`<span style="color:var(--warn);font-weight:600">${s.items.length===1?t("mel_1"):t("mel_n",{n:s.items.length})}</span> <span class="muted">${esc(s.items.map(w=>defTitle(w.d)).join(", "))}</span>`;
  const nx=data.reservations.filter(r=>r.aircraftId===a.id&&booked(r)&&r.end>Date.now()).sort((x,y)=>x.start-y.start)[0];
  return nx?`<span class="muted">${t("next_booking")}</span> ${fmt(nx.start)} · ${esc(pilot(nx.pilotId))}`:`<span class="muted">${t("no_upcoming")}</span>`;
}
function fleetSplit(list,shown){
  if(!list.length)return`<p class="muted">${t("no_match")}</p>`;
  if(!selAc||!list.some(a=>a.id===selAc))selAc=list[0].id;
  const rows=shown.map(a=>{const s=statusOf(a.id),mins=data.flights.filter(f=>f.aircraftId===a.id).reduce((x,f)=>x+(f.blockMin||0),0);
    return`<div class="frow s-${s.key}${a.id===selAc?" sel":""}" role="button" tabindex="0" data-action="open-aircraft" data-id="${esc(a.id)}" aria-pressed="${a.id===selAc}">
      ${favBtn(a.id)}<span class="fr-reg"><span class="sym-slot">${alSym(a.airline)}</span><span class="plate al-plate${plLen(a.registration)}"${plateStyle(a.airline)}>${esc(a.registration)}</span></span>
      <span class="fr-type"><b>${esc(a.type)}</b><span class="muted">${esc(a.airline||"")}</span></span>
      <span class="mono fr-pos">${posChip(a.id)}</span>
      <span><span class="pill ${s.key}">${stLabel(s.key)}</span></span>
      <span class="fr-line">${acRowLine(a,s)}</span>
      <span class="mono muted fr-h">${block(mins)} h</span></div>`}).join("");
  return`<div class="fleet-split">
    <div class="ftable panel" role="list">${rows}
      ${list.length>shown.length?`<button class="btn more" data-action="more">${t("show_more",{n:Math.min(60,list.length-shown.length)})}</button>`:""}</div>
    <aside class="detail panel" aria-label="${t("techlog")}">${acDetailHTML(selAc,true)}</aside></div>`;
}

const PROGRAMMING_SECTIONS=new Set(),PROGRAMMING_CALENDARS=new Set();
function bookingPreviousIncomplete(r){
 if(!r?.rosterId)return null;
 const legs=data.reservations.filter(x=>x.rosterId===r.rosterId&&x.pilotId===r.pilotId).sort((a,b)=>a.start-b.start||String(a.id).localeCompare(String(b.id)));
 const index=legs.findIndex(x=>x.id===r.id);if(index<1)return null;
 return legs.slice(0,index).find(x=>!(x.status==='cancelled'&&x.cancelReason==='noshow')&&(x.status!=='completed'||!data.flights.some(f=>f.reservationId===x.id&&f.pilotId===x.pilotId&&f.verified!==false&&f.blockMin>0)))||null;
}
function bookingSequenceMessage(previous){return t('bk_previous_required',{flight:previous.flightNo||previous.dep+' → '+previous.arr})}
function bookingSequenceGate(html,r){const previous=bookingPreviousIncomplete(r);if(!previous)return html;
 // Administrative cancellation remains available even when operational actions are locked.
 let adminCancellation='';if(IS_ADMIN()){const match=html.match(/<div class="bk-cancel-actions">[\s\S]*?<\/div>/);if(match){adminCancellation=match[0];html=html.replace(match[0],'')}}
 const disabledLinks=html.replace(/<a\b/g,'<a aria-disabled="true" tabindex="-1"').replace(/ href="[^"]*"/g,'').replace(/↗/g,'<span class="dispatch-lock" aria-hidden="true">🔒</span>');
 const flight=previous.flightNo||previous.dep+' → '+previous.arr;
 return`<div class="bk-sequence-note bk-sequence-callout" role="status"><span class="bk-sequence-icon" aria-hidden="true">🔒</span><div class="bk-sequence-copy"><strong>${t('bk_actions_locked')}</strong><span>${esc(bookingSequenceMessage(previous))}</span></div>${previous.pilotId===myId&&booked(previous)?`<button type="button" class="btn small primary bk-sequence-jump" data-action="booking-previous-flight" data-id="${esc(r.id)}">${esc(t('bk_go_previous',{flight}))} →</button>`:''}</div><fieldset class="bk-sequence-gate" disabled data-reservation="${esc(r.id)}">${disabledLinks}</fieldset>${adminCancellation?`<div class="bk-admin-cancel">${adminCancellation}</div>`:''}`;
}
document.addEventListener('click',e=>{if(!['bookings','briefing'].includes(view))return;const gate=e.target.closest?.('.bk-sequence-gate');if(!gate)return;const r=data.reservations.find(x=>x.id===gate.dataset.reservation),previous=bookingPreviousIncomplete(r);if(previous){e.preventDefault();e.stopImmediatePropagation()}},true);
document.addEventListener('toggle',e=>{const el=e.target;if(!el.matches?.('details[data-programming-section]')||!el.isConnected)return;const key=myId+':'+el.dataset.programmingSection;if(el.open)PROGRAMMING_SECTIONS.add(key);else PROGRAMMING_SECTIONS.delete(key)},true);
function bookingCanCancelReserve(r){
 if(IS_ADMIN())return false;
 if(!r||r.pilotId!==myId||!r.rosterId||!booked(r)||r.end<=Date.now()||dlaStarted(r)||bookingPreviousIncomplete(r))return false;
 const legs=data.reservations.filter(x=>x.rosterId===r.rosterId&&x.pilotId===myId).sort((a,b)=>a.start-b.start||String(a.id).localeCompare(String(b.id))),index=legs.findIndex(x=>x.id===r.id);
 return index===0||(index>0&&legs.slice(0,index).every(x=>x.status==='cancelled'&&x.cancelReason==='noshow'));
}
function bookingExpiryWarning(r,st=dlaState(r)){
 const remaining=st.deadline-Date.now();
 if(!r.rosterId||!booked(r)||st.started||remaining<=0||remaining>15*6e4)return '';
 const minutes=Math.ceil(remaining/6e4),time=utcHM(st.deadline)+'Z';
 return `<div class="booking-expiry-warning" role="status"><div><strong>⏱ ${t('dla_expiry_title',{n:minutes})}</strong><p>${t(st.can?'dla_expiry_send':'dla_expiry_start',{time})}</p></div>${st.can?`<button type="button" class="btn primary" data-action="dla" data-id="${esc(r.id)}">${t('dla_expiry_button')}</button>`:''}</div>`;
}
function bookingFlightActions(r,a,s,own=true){
    const noItems=!s||s.key==="ok",signed=r.ackAt&&!ackStale(r),go=signed||noItems;
    const dl=own&&r.rosterId?dlaState(r):null;
    const expiry=dl?bookingExpiryWarning(r,dl):'';
    const dlaHtml=dl&&!expiry&&dl.can?`<button class="btn small dla-btn" data-action="dla" data-id="${r.id}" title="${esc(t('dla_btn_t',{t:utcHM(dl.limit)}))}">⏱ ${t('dla_btn')}</button>`:'';
    const mvg=own&&typeof movingNow==="function"?movingNow(r.aircraftId):null;
    const statusHtml=mvg?`<span class="chip warn" title="${esc(t("bk_mv_wait_t"))}">🚚 ${t("bk_mv_wait",{t:fmt(mvg.end)})}</span>`:go?(noItems?`<span class="chip ok-items${blinkOnce(r.id)}" title="${esc(t("no_ack_needed"))}">✓ ${t("no_open_items")}</span>`:`<span class="chip ok-items">✓ ${t("reviewed")}</span>`):'';
    const acts=own?`<div class="bk-acts bk-actions-layout">${expiry}<div class="bk-status-row">${statusHtml}</div><div class="bk-operational-row">${dlaHtml}${mvg&&go?"":go?`${typeof trkCanStart==="function"&&trkCanStart(r)?`<button class="btn primary small" data-action="trk-open" data-id="${r.id}">✈ ${t("trk_start")}</button>`:""}<button class="btn small${typeof trkCanStart==="function"&&trkCanStart(r)?"":" primary"}" data-action="report" data-id="${r.id}">${t("file_report")}</button>`:`<button class="btn primary small blink" data-action="ack" data-id="${r.id}">⚠ ${t("review_log")}</button>`}</div>
      <div class="bk-secondary-row"><div class="bk-planning-actions">${sbLink(r,"small","SimBrief")}${svLink(r,"small")}</div><div class="bk-cancel-actions">${bookingCanCancelReserve(r)?`<button type="button" class="btn small danger bk-cancel-reserve" data-action="cancel-booking" data-reserve-cancel="1" data-id="${esc(r.id)}">${t("bk_cancel_reserve")}</button>`:''}${r.rosterId&&!isAdmin?`<span class="chip neutral bk-lock" title="${esc(t("rs_locked",{t:dfShort(rosterEnd(r.rosterId))+" "+tf.format(rosterEnd(r.rosterId))})+" — "+t("rs_locked_t"))}">🔒 ${dfShort(rosterEnd(r.rosterId))}</span>`:admCancelBtns(r)}</div></div></div>`:`<span class="muted" style="font-size:.85rem">${esc(pilot(r.pilotId))}</span>${isAdmin?`<div class="row" style="margin-top:6px">${admCancelBtns(r)}</div>`:""}`;
    return acts;
}
function viewBookings(){
  if(!db)return offline();
  if(!PROGRAMMING_CALENDARS.has(myId))PROGRAMMING_CALENDARS.add(myId);
  const btn=`<button class="btn primary" data-action="go-roster" ${!fleet.length||canWrite===false?"disabled":""}>${t("rs_gen")}</button>`;
  const timeline=fleet.length?calendarHTML():`<div class="empty"><h3>${t("no_ac_title")}</h3><p>${t("no_ac_body")}</p></div>`;
  const now=Date.now();
  const mine=data.reservations.filter(r=>r.pilotId===myId&&booked(r)&&r.end>now-6*H).sort((a,b)=>a.start-b.start);
  const others=data.reservations.filter(r=>r.pilotId!==myId&&booked(r)&&r.end>now).sort((a,b)=>a.start-b.start);
  const card=(r,own)=>{const a=acById(r.aircraftId);const s=a?statusOf(a.id):null;
    const acts=bookingFlightActions(r,a,s,own);
    if(own)return programmingFlightSummary(r,a,s,acts);
    return`<div class="bk${own?" own":""}"><div class="bk-ac">${planeImg(a,"sm")}${regTag(a,r.aircraftId)}</div>
      <div class="bk-info"><div class="route">${fnoChip(r.flightNo)} ${wxCode(r.dep)} → ${wxCode(r.arr)} ${s&&s.key==="warn"?`<span class="chip warn">MEL</span>`:""}${s&&s.key==="bad"?`<span class="chip bad">AOG</span>`:""}${r.ferry?`<span class="chip neutral">${t("ferry_chip")}</span>`:""}${posConflict(r)?`<button class="chip bad linkish-chip" data-action="div-open" data-id="${esc(r.id)}">${t("div_chip",{loc:esc(posConflict(r))})}</button>`:""}</div>
      <div class="when muted">${r.rosterId?`<span class="nw eobt">EOBT <b>${utcHM(r.start+20*6e4)}Z</b>${r.dlaAt?` · <span class="dla-tag">DLA</span> ${t("dla_was",{t:utcHM(r.eobtOrig)+"Z"})}`:""}</span> · `:""}<span class="nw">${dtf.format(r.start)}\u2060–\u2060${tf.format(r.end)} ${t("t_local")}</span> · <span class="nw">${utcHM(r.start)}\u2060–\u2060${utcHM(r.end)} UTC</span>${a?.airline?` · <span class="nw">${esc(a.airline)}</span>`:""}</div></div>${own?bookingSequenceGate(acts,r):acts}</div>`};
  const mr=myRosterHTML(true);
  return`<section class="programming-screen"><div class="sec-head"><div><span class="eyebrow">${t("bk_eyebrow")}</span><h2>${t("bk_title")}</h2></div></div>
   ${noShowNotices()}
   ${mr.ack}
   <div class="panel programming-own"><div class="sec-head"><h3>${t("your_bk")}</h3><span class="chip neutral">${mine.length}</span></div>${mine.length?programmingFlightPicker(mine,r=>card(r,true)):`<p class="muted" style="margin:0">${t("no_your_bk")}</p>`}</div>
   <div class="programming-secondary-grid">
    <details class="panel programming-secondary" data-programming-section="calendar" ${PROGRAMMING_SECTIONS.has(myId+':calendar')?'open':''}><summary>${t("programming_calendar")}</summary>${timeline}</details>
    <details class="panel programming-secondary" data-programming-section="others" ${PROGRAMMING_SECTIONS.has(myId+':others')?'open':''}><summary>${t("other_pilots")} <span class="chip neutral">${others.length}</span></summary>${others.length?`<div class="bookings">${others.map(r=>card(r,false)).join("")}</div>`:`<p class="muted" style="margin:0">${t("no_other")}</p>`}</details>
   </div>
   </section>`;
}

/* ---------- Calendário mensal de reservas e manutenções ---------- */
let calY=new Date().getFullYear(),calM=new Date().getMonth(),calSel=null;
const dayKey=d=>d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate();
function calEvents(t0,t1){
  const ev=[];
  for(const r of data.reservations){if((r.status!=="booked"&&r.status!=="completed")||r.end<=t0||r.start>=t1)continue;
    ev.push({kind:r.status==="completed"?"done":"res",mine:r.pilotId===myId,s:r.start,e:r.end,ac:r.aircraftId,r})}
  const ids=new Set(data.defects.map(d=>d.aircraftId));
  for(const id of ids)for(const w of windowsFor(id)){if(w.e<=t0||w.s>=t1)continue;ev.push({kind:w.kind,s:w.s,e:w.e,ac:id,w})}
  return ev.sort((a,b)=>a.s-b.s);
}
function calendarHTML(){
  const first=new Date(calY,calM,1),sun=["pt","en","ja","ko"].includes(lang);
  const lead=(first.getDay()-(sun?0:1)+7)%7,gridStart=new Date(calY,calM,1-lead);
  const days=[...Array(42)].map((_,i)=>new Date(gridStart.getFullYear(),gridStart.getMonth(),gridStart.getDate()+i));
  const t0=days[0].getTime(),t1=new Date(days[41].getFullYear(),days[41].getMonth(),days[41].getDate()+1).getTime();
  const ev=calEvents(t0,t1),todayK=dayKey(new Date());
  const wd=new Intl.DateTimeFormat(LOCALE[lang],{weekday:"short"});
  const heads=[...Array(7)].map((_,i)=>wd.format(new Date(2026,2,1+i+(sun?0:1))).replace(".",""));
  const hm2=ms=>new Date(ms).toTimeString().slice(0,5);
  const cell=d=>{const ds=d.getTime(),de=ds+864e5,k=dayKey(d),out=d.getMonth()!==calM;
    const list=ev.filter(x=>x.s<de&&x.e>ds),shown=list.slice(0,2);
    const chip=x=>{const reg=esc(acById(x.ac)?.registration||x.ac);
      if(x.kind==="res"||x.kind==="done")return`<span class="cal-ev ${x.kind}${x.mine?" mine":""}">${x.s>=ds?hm2(x.s)+" ":""}${reg}</span>`;
      return`<span class="cal-ev ${x.kind}">${x.kind==="aog"?"MX":"MEL"} ${reg}</span>`};
    return`<button type="button" class="cal-day${out?" out":""}${k===todayK?" today":""}${calSel===k?" sel":""}" data-action="cal-day" data-k="${k}" aria-label="${esc(new Intl.DateTimeFormat(LOCALE[lang],{dateStyle:"full"}).format(d))}${list.length?` · ${list.length}`:""}">
      <span class="cal-n">${d.getDate()}</span>${shown.map(chip).join("")}${list.length>2?`<span class="cal-more">${t("cal_more",{n:list.length-2})}</span>`:""}${list.length?`<span class="cal-dot">${list.length}</span>`:""}</button>`};
  let detail="";
  if(calSel){const [y,m,dd]=calSel.split("-").map(Number),d=new Date(y,m,dd),ds=d.getTime(),de=ds+864e5;
    const list=ev.filter(x=>x.s<de&&x.e>ds);
    const ttl=new Intl.DateTimeFormat(LOCALE[lang],{dateStyle:"full"}).format(d);
    detail=`<div class="cal-detail"><h3>${esc(ttl.charAt(0).toUpperCase()+ttl.slice(1))}</h3>${list.length?`<ul>${list.map(x=>{const reg=esc(acById(x.ac)?.registration||x.ac);
      if(x.r){const r=x.r;return`<li><span class="cal-ev ${x.kind}${x.mine?" mine":""}">${reg}</span> <b class="mono">${r.start<ds?fmt(r.start):hm2(r.start)} – ${r.end>de?fmt(r.end):hm2(r.end)}</b> · ${fnoChip(r.flightNo)} ${wxCode(r.dep)} → ${wxCode(r.arr)} · ${esc(pilot(r.pilotId))}${x.kind==="done"?` <span class="chip ok">${t("lg_done")}</span>`:""}</li>`}
      return`<li><span class="cal-ev ${x.kind}">${reg}</span> ${x.kind==="aog"?t("lg_aog"):t("lg_mel")}: <b>${esc(defTitle(x.w.d))}</b> · ${fmt(x.s)} – ${fmt(x.e)}</li>`}).join("")}</ul>`:`<p class="muted" style="margin:0">${t("cal_empty")}</p>`}</div>`}
  const yNow=new Date().getFullYear(),years=[];for(let y=Math.min(calY,yNow-2);y<=Math.max(calY,yNow+2);y++)years.push(y);
  const mf=new Intl.DateTimeFormat(LOCALE[lang],{month:"long"});
  return`<div class="panel cal"><div class="cal-head">
    <div class="cal-nav"><button class="btn small" data-action="cal-prev" aria-label="${t("cal_prev")}" title="${t("cal_prev")}">‹</button>
      <select id="cal-m" aria-label="${t("cal_month")}">${[...Array(12)].map((_,i)=>`<option value="${i}" ${i===calM?"selected":""}>${esc(mf.format(new Date(2026,i,1)))}</option>`).join("")}</select>
      <select id="cal-y" aria-label="${t("cal_year")}">${years.map(y=>`<option ${y===calY?"selected":""}>${y}</option>`).join("")}</select>
      <button class="btn small" data-action="cal-next" aria-label="${t("cal_next")}" title="${t("cal_next")}">›</button>
      <button class="btn small" data-action="cal-today">${t("cal_today")}</button></div>
    <div class="legend"><span class="lg-res">${t("lg_res")}</span><span class="lg-mine">${t("lg_mine")}</span><span class="lg-done">${t("lg_done")}</span><span class="lg-aog">${t("lg_aog")}</span><span class="lg-mel">${t("lg_mel")}</span></div></div>
    <div class="cal-grid">${heads.map(h=>`<div class="cal-wd">${esc(h)}</div>`).join("")}${days.map(cell).join("")}</div>
    <p class="hint" style="margin:0">${t("cal_hint")}</p>${detail}</div>`;
}

function defectHTML(d){
  let extra="";
  if(d.outcome==="grounded")extra=`<span class="muted">${t("gt_released",{h:d.repairH,t:fmt(d.createdAt+d.repairH*H)})}</span>`;
  if(d.outcome==="deferred")extra=`<span class="muted">${t("mel_exp",{cat:melLabel(d.deferDays),t:fmt(d.deferredUntil),h:d.repairH})}</span>`;
  const proc=defProc(d);
  return`<div class="defect ${d.outcome}"><div class="row" style="gap:8px"><span class="ata">ATA ${String(d.ata||"--").padStart(2,"0")}</span><strong>${esc(defTitle(d))}</strong><span class="chip ${OUT_KIND[d.outcome]}">${outLabel(d.outcome)}</span><span class="muted" style="font-size:.8rem">${esc(phaseName(d.phase))}</span></div>
    ${d.description?`<div>${esc(d.description)}</div>`:""}${proc?`<div class="proc">↳ ${esc(proc)}</div>`:""}${extra}</div>`;
}
function entryHTML(f,no,showPlate){
  const a=acById(f.aircraftId),ds=data.defects.filter(d=>d.flightId===f.id).sort((x,y)=>x.createdAt-y.createdAt);
  return`<div class="entry"><div><div class="tlno">TL ${String(no).padStart(4,"0")}</div><div class="muted" style="font-size:.8rem">${df.format(f.createdAt)}</div></div>
   <div class="entry-main"><div class="row" style="gap:10px">${showPlate?`${regTag(a,f.aircraftId)}`:""}<span class="mono" style="font-weight:600">${esc(f.dep)} → ${esc(f.arr)}</span>
   <span class="muted" style="font-size:.85rem">${esc(pilot(f.pilotId))} · ${esc(simName(f.simulator))} · ${t("block")} ${block(f.blockMin||0)}${f.landingFpm!=null?` · ${t("trk_landing")} ${f.landingFpm} fpm`:""}</span>${vChip(f)} ${pilotReplayButton(f)}</div>
   ${f.remarks?`<div style="font-size:.9rem">${esc(f.remarks)}</div>`:""}
   ${ds.length?ds.map(defectHTML).join(""):`<div class="muted" style="font-size:.85rem">${t("no_def_entry")}</div>`}</div></div>`;
}
function tlNumbers(){const n={},out={};[...data.flights].sort((a,b)=>a.createdAt-b.createdAt).forEach(f=>{n[f.aircraftId]=(n[f.aircraftId]||0)+1;out[f.id]=n[f.aircraftId]});return out}
/* ---------- Diário de bordo: logbook do piloto, ranking e todos os registros ---------- */
let lbTab="mine",lbPilot=null,lbPeriod="all";
const dateF=ms=>new Intl.DateTimeFormat(LOCALE[lang],{day:"2-digit",month:"2-digit",year:"numeric"}).format(ms);
function periodStart(p){const now=new Date();if(p==="year")return new Date(now.getFullYear(),0,1).getTime();if(p==="30d")return Date.now()-30*864e5;return 0}
/* só voos verificados (rastreados) contam para horas, patente, salário e ranking */
const counts=f=>f.verified!==false;
const vChip=f=>f.verified!==false?(f.trackId?`<span class="chip ok v-chip" title="${esc(t("v_chip_t"))}">✓ ${t("v_chip")}</span>`:""):`<span class="chip warn v-chip" title="${esc(t("nv_chip_t"))}">${t("nv_chip")}</span>`;
function groupHours(fl,keyFn){const m={};for(const f of fl){const k=keyFn(f)||"—";(m[k]=m[k]||{k,min:0,n:0}).min+=f.blockMin||0;m[k].n++}return Object.values(m).sort((a,b)=>b.min-a.min||b.n-a.n)}
function viewLogbook(){
  if(!db)return offline();
  const seg=`<div class="seg" role="tablist">${["mine","pay","ranking","all"].map(k=>`<button data-action="lb-tab" data-v="${k}" aria-pressed="${lbTab===k}">${t("lb_tab_"+k)}</button>`).join("")}</div>`;
  const body=lbTab==="ranking"?lbRanking():lbTab==="all"?lbAll():lbTab==="pay"?lbPay(lbPilot||myId):lbPilotView(lbPilot||myId);
  return`<div class="sec-head"><div><span class="eyebrow">${t("lb_eyebrow")}</span><h2>${t(lbTab==="ranking"?"lb_rank_title":lbTab==="all"?"lb_title":lbTab==="pay"?"pay_h2":"lb_mine_title")}</h2></div>${seg}</div>${body}`;
}
function lbAll(){
  const nos=tlNumbers(),fl=[...data.flights].sort((a,b)=>b.createdAt-a.createdAt);
  return`<div class="panel"><span class="muted">${fl.length===1?t("flights_1"):t("flights_n",{n:fl.length})}</span>${fl.length?`<div class="log">${fl.map(f=>entryHTML(f,nos[f.id],true)).join("")}</div>`:`<p class="muted" style="margin:0">${t("no_flights")}</p>`}</div>`;
}
function aircraftManufacturerIcon(type){
 const brands=[[/\bBOEING\b/i,'boeing.com'],[/\bAIRBUS\b/i,'airbus.com'],[/\bEMBRAER\b/i,'embraer.com'],[/\bATR\b/i,'atr-aircraft.com'],[/\bBOMBARDIER\b/i,'bombardier.com'],[/\bDE HAVILLAND\b|\bDHC[- ]/i,'dehavilland.com'],[/\bCESSNA\b|\bBEECHCRAFT\b/i,'txtav.com'],[/\bPILATUS\b/i,'pilatus-aircraft.com'],[/\bDASSAULT\b/i,'dassault-aviation.com'],[/\bCIRRUS\b/i,'cirrusaircraft.com'],[/\bPIPER\b/i,'piper.com'],[/\bDIAMOND\b/i,'diamondaircraft.com']];
 const domain=brands.find(([pattern])=>pattern.test(String(type||'')))?.[1];
 const vector={'boeing.com':'boeing','airbus.com':'airbus','bombardier.com':'bombardier'}[domain];
 return domain?`<span class="manufacturer-mark${vector==='airbus'?' manufacturer-wordmark':''}"><img class="manufacturer-icon" src="${vector?'img/manufacturers/'+vector+'.svg':'https://www.google.com/s2/favicons?domain='+domain+'&amp;sz=128'}" alt="" width="28" height="28" loading="lazy" onerror="this.parentElement.remove()"></span>`:'';
}
function lbPilotView(pid){
  const every=data.flights.filter(f=>f.pilotId===pid).sort((a,b)=>b.createdAt-a.createdAt),all=every.filter(counts),nos=tlNumbers();
  const sum=fl=>fl.reduce((x,f)=>x+(f.blockMin||0),0);
  const y0=periodStart("year"),d30=periodStart("30d");
  const ac=f=>acById(f.aircraftId);
  const typeKey=f=>{const a=ac(f);const c=icaoType(a&&a.type);return c||(a&&a.type)||""};
  const typeName={};all.forEach(f=>{const k=typeKey(f),a=ac(f);if(k&&!typeName[k])typeName[k]=a?a.type:k});
  const airports=new Set();all.forEach(f=>{airports.add(f.dep);airports.add(f.arr)});
  const other=pid!==myId;
  const tbl=(title,rows,label)=>`<div class="panel"><h3>${title}</h3>${rows.length?`<div class="scroll"><table class="lb-t"><thead><tr><th>${label}</th><th class="num">${t("lb_hours")}</th><th class="num">${t("lb_flights")}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.label}</td><td class="num mono">${block(r.min)}</td><td class="num mono">${r.n}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted" style="margin:0">—</p>`}</div>`;
  const byType=groupHours(all,typeKey).map(r=>({...r,label:`<span class="lb-aircraft-type">${aircraftManufacturerIcon(typeName[r.k])}<span><b class="mono">${esc(r.k)}</b> <span class="muted">${esc(typeName[r.k]&&typeName[r.k]!==r.k?typeName[r.k]:"")}</span></span></span>`}));
  const byAl=groupHours(all,f=>ac(f)?.airline).map(r=>({...r,label:`<span class="lb-airline">${alSym(r.k)}<span>${esc(r.k)}</span></span>`}));
  const bySim=groupHours(all,f=>f.simulator).map(r=>({...r,label:esc(simName(r.k))}));
  const byReg=groupHours(all,f=>f.aircraftId).slice(0,10).map(r=>({...r,label:`${regTag(acById(r.k),r.k)}`}));
  const rows=every.map(f=>{const a=ac(f);return`<tr class="${counts(f)?"":"nv"}"><td class="mono">${dateF(f.createdAt)}</td><td>${regTag(a,f.aircraftId)}</td><td>${esc(a?.type||"")}</td><td class="mono">${fnoChip(fnoOf(f))} ${esc(f.dep)} → ${esc(f.arr)} ${vChip(f)} ${pilotReplayButton(f)}</td><td class="num mono">${block(f.blockMin||0)}</td><td>${esc(simName(f.simulator))}</td><td class="mono muted">TL ${String(nos[f.id]||0).padStart(4,"0")}</td></tr>`}).join("");
  return`${other?`<div class="notice">${t("lb_viewing",{p:esc(pilot(pid))})} <button class="linkish" data-action="lb-me">${t("lb_back_me")}</button></div>`:""}
   <div class="panel"><div class="sec-head"><h3>${esc(names[pid]||pilot(pid)||"")}</h3>${every.length?`<button class="btn small" data-action="lb-csv" data-p="${esc(pid)}">${t("lb_csv")}</button>`:""}</div>
    <div class="stats lb-stats"><span><b>${block(sum(all))}</b>${t("lb_total")}</span><span><b>${all.length}</b>${t("lb_flights")}</span><span><b>${block(sum(all.filter(f=>f.createdAt>=d30)))}</b>${t("lb_30d")}</span><span><b>${block(sum(all.filter(f=>f.createdAt>=y0)))}</b>${t("lb_year")}</span><span><b>${new Set(all.map(f=>f.aircraftId)).size}</b>${t("lb_regs")}</span><span><b>${airports.size}</b>${t("lb_airports")}</span></div></div>
   ${careerHTML(pid)}
   ${every.length?`<div class="lb-grid">${tbl(t("lb_by_type"),byType,t("lb_type"))}${tbl(t("lb_by_airline"),byAl,t("airline"))}${tbl(t("lb_by_sim"),bySim,t("simulator"))}${tbl(t("lb_by_reg"),byReg,t("registration"))}</div>
   <div class="panel"><h3>${t("lb_flights_list")}</h3><div class="scroll"><table class="lb-t"><thead><tr><th>${t("lb_date")}</th><th>${t("registration")}</th><th>${t("lb_type")}</th><th>${t("lb_route")}</th><th class="num">${t("block_time")}</th><th>${t("simulator")}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`
   :`<div class="panel"><p class="muted" style="margin:0">${t(other?"lb_none_other":"lb_none")}</p></div>`}`;
}
function lbRanking(){
  const from=periodStart(lbPeriod),m={};
  for(const f of data.flights){if(f.createdAt<from||!counts(f))continue;const r=m[f.pilotId]=m[f.pilotId]||{p:f.pilotId,min:0,n:0,last:0};r.min+=f.blockMin||0;r.n++;r.last=Math.max(r.last,f.createdAt)}
  const list=Object.values(m).sort((a,b)=>b.min-a.min||b.n-a.n);
  const seg=`<div class="seg">${["all","year","30d"].map(k=>`<button data-action="lb-period" data-v="${k}" aria-pressed="${lbPeriod===k}">${t("lb_p_"+k)}</button>`).join("")}</div>`;
  return`<div class="panel"><div class="sec-head"><span class="muted" style="font-size:.85rem">${t("lb_rank_hint")}</span>${seg}</div>
   ${list.length?`<div class="scroll"><table class="lb-t"><thead><tr><th class="num">#</th><th>${t("lb_pilot")}</th><th class="num">${t("lb_hours")}</th><th class="num">${t("lb_flights")}</th><th>${t("lb_last")}</th></tr></thead><tbody>
   ${list.map((r,i)=>`<tr class="${r.p===myId?"is-me":""}"><td class="num mono">${i+1}</td><td><button class="linkish" data-action="lb-pilot" data-p="${esc(r.p)}">${esc(names[r.p]||pilot(r.p)||"—")}</button>${r.p===myId?` <span class="muted">(${esc(pilot(r.p))})</span>`:""} ${rankChip(r.p)}</td><td class="num mono"><b>${block(r.min)}</b></td><td class="num mono">${r.n}</td><td class="mono">${dateF(r.last)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted" style="margin:0">${t("no_flights")}</p>`}</div>`;
}
const fnoOf=f=>{const r=f.reservationId&&data.reservations.find(x=>x.id===f.reservationId);return r?r.flightNo:""};
function lbCsv(pid){
  const nos=tlNumbers(),q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const rows=data.flights.filter(f=>f.pilotId===pid).sort((a,b)=>a.createdAt-b.createdAt).map(f=>{const a=acById(f.aircraftId);
    return[toLocalInput(f.createdAt).slice(0,10),fnoOf(f),a?.registration||f.aircraftId,a?.type||"",a?.airline||"",f.dep,f.arr,block(f.blockMin||0),((f.blockMin||0)/60).toFixed(2),simName(f.simulator),"TL "+String(nos[f.id]||0).padStart(4,"0"),f.verified!==false?"yes":"no"].map(q).join(",")});
  const csv="\ufeff"+[["date","flight","registration","type","airline","from","to","block (h:mm)","block (h)","simulator","tech log","counts"].map(q).join(","),...rows].join("\r\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`logbook-${(names[pid]||pilot(pid)||"piloto").replace(/[^\w-]+/g,"_")}.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
function catGroups(){const g={};CATALOG.forEach(c=>(g[c.ata]=g[c.ata]||[]).push(c));return g}
function viewCatalog(){
  const shown=new Set(searchCatalog(catQuery,true).map(c=>c.id));const g={};CATALOG.filter(c=>shown.has(c.id)).forEach(c=>(g[c.ata]=g[c.ata]||[]).push(c));
  const rows=Object.keys(g).map(Number).sort((a,b)=>a-b).map(ata=>g[ata].map((c,i)=>`<tr>
     <td class="ata">${i===0?`${String(ata).padStart(2,"0")}<br><span style="font-family:var(--f-body)">${esc(ataName(ata))}</span>`:""}</td>
     <td><strong>${esc(tr(c.t))}</strong></td><td><span class="chip ${OUT_KIND[c.outcome]}">${outLabel(c.outcome)}</span></td>
     <td class="mono">${c.repairH?c.repairH+" h":"—"}</td><td>${c.deferDays?esc(melLabel(c.deferDays)):"—"}</td><td class="proc">${esc(c.p?tr(c.p):"—")}</td></tr>`).join("")).join("");
  return`<div class="sec-head"><div><span class="eyebrow">${t("cat_eyebrow")}</span><h2>${t("cat_title")}</h2></div></div>
   <p class="muted" style="margin:0;max-width:72ch">${t("cat_body")}</p><p class="hint" style="margin:0;max-width:72ch">${t("cat_source")}</p>
   <div class="filters"><input id="cat-q" type="search" placeholder="${t("cat_filter_ph")}" value="${esc(catQuery)}" autocomplete="off"><span class="muted" style="font-size:.85rem">${t("cat_count",{n:shown.size})}</span></div>
   <div class="panel scroll"><table><thead><tr><th>${t("th_ata")}</th><th>${t("th_defect")}</th><th>${t("th_default")}</th><th>${t("th_ground")}</th><th>${t("th_mel")}</th><th>${t("th_proc")}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ---------- Sheets ---------- */
function openSheet(type,html,extra={}){
  sheet={type,...extra};const root=$("#sheet-root");
  root.innerHTML=`<div class="scrim" data-action="scrim"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;root.hidden=false;
  decorateSkyVector(root);
  if(typeof decorateSimulatorNames==="function")decorateSimulatorNames(root);
  const f=root.querySelector("input,select,textarea");if(f)f.focus();
}
function closeSheet(){sheet=null;const r=$("#sheet-root");r.hidden=true;r.innerHTML=""}
const head=(eb,title)=>`<div class="sheet-head"><div><span class="eyebrow">${eb}</span><h2>${title}</h2></div><button class="x" data-action="close" aria-label="${t("close")}">×</button></div>`;

function paintAircraftSheet(id){
  const a=acById(id);if(!a){closeSheet();return}
  const html=acDetailHTML(id,false);
  const root=$("#sheet-root");
  if(root.hidden||!sheet||sheet.type!=="aircraft"||sheet.id!==id)openSheet("aircraft",html,{id});
  else root.querySelector(".sheet").innerHTML=html;
  if(typeof decorateSimulatorNames==="function")decorateSimulatorNames(root);
  hydratePhotos();
}
function acDetailHTML(id,inPanel){
  const a=acById(id);if(!a)return"";
  const s=statusOf(id),now=Date.now(),nos=tlNumbers();
  const fl=data.flights.filter(f=>f.aircraftId===id).sort((x,y)=>y.createdAt-x.createdAt),mins=fl.reduce((x,f)=>x+(f.blockMin||0),0);
  let banner;
  if(s.key==="bad")banner=`<div class="banner bad"><strong>${t("aog_banner",{t:fmt(s.until)})}</strong><span>${t("aog_sub",{x:rel(s.until)})}</span>${s.items.map(w=>`<span>• ${esc(defTitle(w.d))}${w.expiry?" "+t("mel_expired"):""}</span>`).join("")}</div>`;
  else if(s.key==="warn")banner=`<div class="banner warn"><strong>${t("flyable")}</strong>${s.items.map(w=>`<span>• <b>${esc(defTitle(w.d))}</b>, ${esc(melLabel(w.d.deferDays))}, ${t("expires",{t:fmt(w.e)})}${defProc(w.d)?`<br><span class="proc">↳ ${esc(defProc(w.d))}</span>`:""}</span>`).join("")}</div>`;
  else banner=`<div class="banner ok"><strong>${t("serviceable")}</strong><span>${t("no_open")}</span></div>`;
  const upcoming=windowsFor(id).filter(w=>w.kind==="aog"&&w.s>now).sort((x,y)=>x.s-y.s);
  return`${inPanel?`<div class="dp-head"><span class="eyebrow">${t("techlog")}</span>${regTag(a,"",1)}</div>`:head(t("techlog"),`${regTag(a,"",1)}`)}
   ${planeLinked(a,"big")}
   <div class="row" style="justify-content:space-between"><div><div class="airline">${alLogo(a.airline,"sm")} ${esc(a.airline||"")}</div><div class="ac-type">${esc(a.type)}</div></div><span class="pill ${s.key}">${stLabel(s.key)}</span></div>
   ${posLineHTML(id)}${typeof realLineHTML==="function"?realLineHTML((acById(id)||{}).registration):""}${checkLineHTML(id)}${liveryHTML(id)}
   ${banner}
   ${upcoming.length?`<div class="notice">${t("sched_mx")} ${upcoming.map(w=>esc(t("from_to",{title:defTitle(w.d),s:fmt(w.s),e:fmt(w.e)}))).join("; ")}</div>`:""}
   <div class="stats"><span><b>${block(mins)}</b>${t("af_hours")}</span><span><b>${fl.length}</b>${t("cycles")}</span><span><b>${data.defects.filter(d=>d.aircraftId===id).length}</b>${t("defects_rep")}</span></div>
   <div class="row"><button class="btn primary" data-action="go-roster" data-ac="${esc(id)}" ${canWrite===false?"disabled":""}>${t("rs_with_reg",{reg:esc(a.registration)})}</button>${IS_ADMIN()?`<button class="btn" data-action="new-booking" data-ac="${esc(id)}" ${canWrite===false?"disabled":""}>${t("book_reg",{reg:esc(a.registration)})}</button><button class="btn" data-action="ferry" data-ac="${esc(id)}" ${canWrite===false?"disabled":""} title="${esc(t("ferry_btn_t"))}">${t("ferry_btn")}</button>`:""}${favBtn(id,true)}</div>
   <div><h3 style="margin-bottom:6px">${t("log_pages")}</h3>${fl.length?`<div class="log">${fl.map(f=>entryHTML(f,nos[f.id],false)).join("")}</div>`:`<p class="muted" style="margin:0">${t("no_flights_reg")}</p>`}</div>`;
}
function sheetNewAircraft(){
  openSheet("form",`${head(t("fleet"),t("add_aircraft"))}
  <form id="f-ac">
   <div class="grid2"><label>${t("registration")}<input id="ac-reg" class="up" required maxlength="10" placeholder="PR-GOL" autocomplete="off" aria-describedby="ac-dup"></label>
   <label>${t("ac_type")}<input id="ac-type" required maxlength="40" placeholder="Boeing 737-800"></label></div>
   <p id="ac-dup" class="dup-note" role="status" hidden></p>
   <div class="grid2"><label>${t("airline")}<input id="ac-airline" list="airline-list" maxlength="40" placeholder="${t("airline_ph")}"><datalist id="airline-list">${airlines().map(x=>`<option value="${esc(x)}">`).join("")}</datalist></label>
   </div>
   <p class="form-err" id="ac-err" hidden></p>
   <div class="row"><button class="btn primary" type="submit">${t("add_to_fleet")}</button><button class="btn" type="button" data-action="close">${t("cancel")}</button></div>
  </form>`);
}
/* ---------- Troca de aeronave quando uma reserva cai por manutenção ---------- */
/* Famílias com a mesma filosofia de cabine / habilitação comum */
const FAMILY={A338:"a330",B77L:"b777",B733:"b737",B734:"b737",B736:"b737",E135:"erj",E145:"erj",A318:"a320",A319:"a320",A320:"a320",A20N:"a320",A321:"a320",A21N:"a320",
  B737:"b737",B738:"b737",B739:"b737",B38M:"b737",B39M:"b737",
  A332:"a330",A333:"a330",A339:"a330",A343:"a330",A346:"a330",A359:"a350",A35K:"a350",A388:"a380",
  B772:"b777",B77W:"b777",B788:"b787",B789:"b787",B78X:"b787",B744:"b747",B748:"b747",B763:"b767",
  E170:"ejet",E175:"ejet",E190:"ejet",E195:"ejet",E290:"ejet",E295:"ejet",BCS1:"a220",BCS3:"a220",
  CRJ9:"crj",CRJX:"crj",AT46:"atr",AT76:"atr",DH8D:"dh8",DH8C:"dh8",DHC6:"dhc6",C208:"c208",C408:"c408",PC12:"pc12",C172:"c172"};
const altKey=(id,k)=>"vfr-alt-"+k+"-"+id;
function altSeen(id,k){try{return localStorage.getItem(altKey(id,k))==="1"}catch(e){return false}}
function altMark(id,k){try{localStorage.setItem(altKey(id,k),"1")}catch(e){}}
function myCancelled(){
  return data.reservations.filter(r=>r.pilotId===myId&&r.status==="cancelled_maintenance"&&r.end>Date.now()-864e5&&!altSeen(r.id,"dismiss")
    &&!data.reservations.some(x=>x.pilotId===myId&&booked(x)&&x.dep===r.dep&&x.arr===r.arr&&Math.abs(x.start-r.start)<36e5));
}
function altAircraft(r){
  const orig=acById(r.aircraftId),code=icaoType(orig&&orig.type),fam=FAMILY[code];if(!code)return[];
  const out=[];
  for(const a of fleet){if(a.id===r.aircraftId)continue;const c=icaoType(a.type);if(c!==code&&(!fam||FAMILY[c]!==fam))continue;
    if(data.reservations.some(x=>x.aircraftId===a.id&&booked(x)&&x.start<r.end&&x.end>r.start))continue;
    if(aogOverlap(a.id,r.start,r.end))continue;
    const loc=locAt(a.id,r.start);if(loc&&loc!==r.dep)continue;
    const same=c===code;let sc=same?0:1;if(orig&&a.airline===orig.airline)sc-=.5;if(isFav(a.id))sc-=.3;if(statusOf(a.id).key==="warn")sc+=.2;
    out.push({a,same,sc})}
  return out.sort((x,y)=>x.sc-y.sc||x.a.registration.localeCompare(y.a.registration)).slice(0,8);
}
function sheetAlternatives(resId){
  const r=data.reservations.find(x=>x.id===resId);if(!r)return;const orig=acById(r.aircraftId);
  const w=aogOverlap(r.aircraftId,r.start,r.end),list=r.start>Date.now()?altAircraft(r):[];
  const reg=esc(orig?.registration||r.aircraftId);
  const card=({a,same})=>{const st=statusOf(a.id);return`<div class="alt-card">${planeImg(a,"sm")}
    <div style="min-width:0"><div class="row" style="gap:8px">${regTag(a,"")}<span class="chip ${same?"ok":"warn"}">${t(same?"alt_same_type":"alt_same_family")}</span>${st.key==="warn"?`<span class="chip warn">MEL</span>`:""}${isFav(a.id)?`<span title="${t("fav_on")}">★</span>`:""}</div>
    <div class="muted" style="font-size:.85rem">${esc(a.type)} · ${esc(a.airline||"")}</div></div>
    <button class="btn small primary" data-action="alt-book" data-id="${esc(r.id)}" data-ac="${esc(a.id)}">${t("alt_book")}</button></div>`};
  openSheet("form",`${head(t("alt_eb"),t("alt_title"))}
   <div class="banner bad"><strong>${t("alt_intro",{reg,type:esc(orig?.type||""),t:fmt(r.start),dep:esc(r.dep),arr:esc(r.arr)})}</strong>${w?`<span>${esc(defTitle(w.d))} · ${t("alt_until",{t:fmt(releaseAt(r.aircraftId,w.s)||w.e)})}</span>`:""}</div>
   ${r.start<=Date.now()?`<p class="muted">${t("alt_past")}</p>`:list.length?`<p style="margin:0">${t("alt_list")}</p><div class="alt-list">${list.map(card).join("")}</div>`:`<p class="muted" style="margin:0">${t("alt_none")}</p>`}
   <div class="row"><button class="btn" data-action="alt-other" data-id="${esc(r.id)}">${t("alt_other")}</button><button class="btn" type="button" data-action="close">${t("close")}</button></div>`);
}
function sheetBooking(acId,pre){
  const nh=Math.ceil((Date.now()+45*6e4)/6e4)*6e4; /* início padrão: 45 min depois de abrir a tela */const al=airlines();
  const opt=a=>`<option value="${esc(a.id)}" ${a.id===acId?"selected":""}>${esc(a.registration)} · ${esc(a.type)}</option>`;
  const favList=fleet.filter(a=>isFav(a.id));
  const atDep=pre&&pre.dep?aircraftAt(pre.dep,pre.start&&pre.start>Date.now()?pre.start:Date.now()+45*6e4).slice(0,300):[];
  const groups=(atDep.length?`<optgroup label="📍 ${esc(t("bk_at_airport",{icao:pre.dep}))}">${atDep.map(a=>`<option value="${esc(a.id)}" ${a.id===acId?"selected":""}>${esc(a.registration)} · ${esc(a.type)} · ${esc(a.airline||"")}</option>`).join("")}</optgroup>`:"")+(favList.length?`<optgroup label="★ ${esc(t("fav_group"))}">${favList.map(opt).join("")}</optgroup>`:"")+[...al,""].map(x=>{const list=fleet.filter(a=>(a.airline||"")===x&&!isFav(a.id));if(!list.length)return"";
    return`<optgroup label="${esc(x||t("other_airline"))}">${list.map(a=>`<option value="${esc(a.id)}" ${a.id===acId?"selected":""}>${esc(a.registration)} · ${esc(a.type)}</option>`).join("")}</optgroup>`}).join("");
  const bkSel=acId&&acById(acId)?acId:((atDep[0]||favList[0]||fleet[0]||{}).id||"");ACP.bk.open=false;ACP.bk.q="";
  openSheet("form",`${head(t("bk_eyebrow"),t("book_btn"))}
  <form id="f-bk">
   <div class="sb-import"><button class="btn small ext-btn" type="button" data-sb="booking"><img class="btn-ic" src="img/brand/simbrief.png" alt="" width="18" height="18"><span data-sb-label>${t("sb_import")}</span></button><span class="hint">${mySimbrief()?t("sb_import_hint"):t("sb_need_user_short")}</span></div>
   <p class="notice sb-note" id="bk-sb-note" hidden></p>
   <div class="rs-ac rs-al"><span class="lbl">${t("airline")}</span>${alPickHTML("bk",ACP.bk.al||"all")}</div>
   <div class="rs-ac"><span class="lbl">${t("aircraft")}</span><input type="hidden" id="bk-ac" value="${esc(bkSel)}">${acPickerHTML("bk",bkSel)}</div>
   <div id="bk-img"></div>
   <div id="bk-status"></div>
   <div class="grid2"><label>${t("dep")}${apInput("bk-dep","SBGO")}</label><label>${t("arr")}${apInput("bk-arr","SBGR")}</label></div>
   <div id="bk-pos"></div>
   <label class="check"><input type="checkbox" id="bk-ferry" ${pre&&pre.ferry?"checked":""} ${IS_ADMIN()?"":"disabled"}> <span>${t("bk_ferry")} <span class="hint">${t("bk_ferry_hint")}</span></span></label>
   ${pre&&pre.eventId?`<input type="hidden" id="bk-event" value="${esc(pre.eventId)}">`:""}${pre&&pre.replaceId?`<input type="hidden" id="bk-replace" value="${esc(pre.replaceId)}">`:""}${pre&&pre.swapOf?`<input type="hidden" id="bk-swap" value="${esc(pre.swapOf)}">`:""}
   <label class="fno">${t("flight_no")} <span class="hint">${t("optional")}</span><input id="bk-fno" class="up mono" maxlength="8" placeholder="${esc(fnoPlaceholder())}" autocomplete="off" spellcheck="false"></label>
   <div class="grid2"><label>${t("start_local")}<input id="bk-start" type="datetime-local" required value="${toLocalInput(nh)}"><small id="bk-start-utc" class="utc-eq"></small></label>
   <label>${t("duration")}<select id="bk-dur">${[1,1.5,2,3,4,5,6,8,10,12,14].map(h=>`<option value="${h}" ${h===2?"selected":""}>${h} h</option>`).join("")}</select></label></div>
   <div class="wx-chips" id="bk-wx"></div>
   <p class="hint" id="bk-est" style="margin:0"></p>
   <p class="hint" id="bk-quota" style="margin:0"></p>
   <section class="bk-review" aria-labelledby="bk-review-h">
    <h3 id="bk-review-h" style="margin:0">${t("bk_review_h")}</h3>
    <div id="bk-log"></div>
    <label class="check" id="bk-ack-wrap"><input type="checkbox" id="bk-ack"> <span id="bk-ack-txt"></span></label>
   </section>
   <p class="form-err" id="bk-err" hidden></p>
   <p class="hint" id="bk-lock" style="margin:0">${t("bk_sign_first")}</p>
   <div class="row"><button class="btn primary" type="submit" id="bk-submit" disabled>${t("confirm_bk")}</button><button class="btn" type="button" data-action="close">${t("cancel")}</button></div>
  </form>`);
  if(pre){$("#bk-dep").value=pre.dep||"";if(pre.flightNo)$("#bk-fno").value=pre.flightNo;$("#bk-arr").value=pre.arr||"";if(pre.arr)$("#bk-arr").dataset.ev=pre.arr;
    if(pre.start&&pre.start>Date.now())$("#bk-start").value=toLocalInput(pre.start);
    if(pre.durH){const sel=$("#bk-dur");sel.insertAdjacentHTML("afterbegin",`<option value="${pre.durH}" selected>${hm(pre.durH*60)}</option>`);sel.value=String(pre.durH)}
    if(pre.note)$("#bk-status").insertAdjacentHTML("beforebegin",`<div class="notice">${pre.note}</div>`)}
  paintBookingStatus();
}
/* assinatura obrigatória só quando a matrícula tem item aberto (MEL ou manutenção) */
const bkNeedsAck=()=>{const id=$("#bk-ac")&&$("#bk-ac").value;return !!id&&statusOf(id).key!=="ok"};
function paintBookingAck(){const b=$("#bk-submit"),c=$("#bk-ack");if(!b||!c)return;const need=bkNeedsAck();
  $("#bk-ack-wrap").hidden=!need;b.disabled=need&&!c.checked;$("#bk-lock").hidden=!need||c.checked}
function paintBookingLog(){const el=$("#bk-log");if(!el)return;const a=acById($("#bk-ac").value);if(!a)return;
  const key=a.id+":"+statusOf(a.id).key;if(el.dataset.ac===key)return;el.dataset.ac=key;el.innerHTML=logReviewHTML(a);
  $("#bk-ack-txt").textContent=t("ack_text",{reg:a.registration});$("#bk-ack").checked=false;paintBookingAck()}
function paintBookingStatus(){
  const el=$("#bk-status");if(!el)return;paintPosition();paintBookingLog();$("#bk-img").innerHTML=planeImg(acById($("#bk-ac").value),"form");hydratePhotos();paintQuota();paintEstimate();const s=statusOf($("#bk-ac").value);
  el.innerHTML=s.key==="bad"?`<div class="banner bad"><span>${t("bk_in_mx",{t:`<b>${fmt(s.until)}</b>`})}</span></div>`:
    s.key==="warn"?`<div class="banner warn"><span>${esc(t("bk_mel",{list:s.items.map(w=>defTitle(w.d)).join(", ")}))}</span></div>`:"";
}
function logReviewHTML(a){
  const s=statusOf(a.id);
  const recent=data.defects.filter(d=>d.aircraftId===a.id).sort((x,y)=>y.createdAt-x.createdAt).slice(0,5);
  return`${s.key==="warn"?`<div class="banner warn"><strong>${t("mel_sim")}</strong>${s.items.map(w=>`<span>• <b>${esc(defTitle(w.d))}</b> (${t("expires",{t:fmt(w.e)})})${defProc(w.d)?`<br><span class="proc">↳ ${esc(defProc(w.d))}</span>`:""}</span>`).join("")}</div>`:
     s.key==="bad"?`<div class="banner bad"><strong>${t("aog_until",{t:fmt(s.until)})}</strong><span>${t("aog_review")}</span></div>`:
     `<div class="banner ok"><strong>${t("no_items")}</strong><span>${t("svc_sub")}</span></div>`}
   <div><h3 style="margin-bottom:6px">${t("last_reports")}</h3>${recent.length?`<div style="display:grid;gap:8px">${recent.map(d=>defectHTML(d)+`<div class="muted" style="font-size:.78rem;margin:-4px 0 0 4px">${esc(pilot(d.reporterId))} · ${fmt(d.createdAt)} · ${esc(simName(d.simulator))}</div>`).join("")}</div>`:`<p class="muted" style="margin:0">${t("nothing_rep")}</p>`}</div>`;
}
/* reporte novo na aeronave depois da assinatura → precisa revisar de novo */
/* sem nenhum item aberto no livro técnico, a assinatura é dispensada: o app registra o "ciente" sozinho
   (o servidor ainda exige ack_at para rastrear e reportar o voo) */
/* "Nenhum item aberto" pisca só uma vez por reserva (não repete a cada atualização da tela) */
const BLINKED=new Set();
function blinkOnce(id){if(BLINKED.has(id))return"";BLINKED.add(id);return" blink-once"}
function autoAck(id){const r=data.reservations.find(x=>x.id===id);if(!r||r.pilotId!==myId||(r.ackAt&&!ackStale(r)))return;
  if(statusOf(r.aircraftId).key!=="ok")return;r.ackAt=Date.now();
  if(sb)Promise.resolve(sb.from("reservations").update({ack_at:new Date().toISOString()}).eq("id",id)).catch(()=>{})}
const ackStale=r=>!!r.ackAt&&data.defects.some(d=>d.aircraftId===r.aircraftId&&d.createdAt>r.ackAt);
/* ---------- Atraso (DLA) e não comparecimento nos voos de escala ----------
   EOBT = início da reserva + 20 min. Uma DLA até EOBT + 35 min; sem iniciar o voo até EOBT + 45 min, o voo é cancelado. */
const DLA_WIN=35*6e4,NOSHOW=45*6e4,DLA_AHEAD=45*6e4;
function dlaStarted(r){return (typeof TRK!=="undefined"&&TRK.resId===r.id)||(typeof LIVE!=="undefined"&&[...LIVE.values()].some(k=>k.reservation_id===r.id&&k.status!=="abandoned"))}
function dlaState(r){const now=Date.now(),eobt=r.start+20*6e4,started=dlaStarted(r);
  /* aeronave em reposicionamento: o prazo de não comparecimento conta da chegada dela, se for depois da EOBT */
  let mv=0;for(const v of data.moves||[])if(v.aircraftId===r.aircraftId&&v.end<=r.end&&v.end>mv)mv=v.end;const base=Math.max(eobt,mv);
  return{eobt,deadline:base+NOSHOW,limit:eobt+DLA_WIN,started,late:!started&&now>base,can:!r.dlaAt&&!started&&now<=eobt+DLA_WIN&&now>=eobt-DLA_AHEAD+5*6e4}}
/* A propagação termina no primeiro descanso de 8 horas ou mais (pernoite). */
function dlaChain(r){const out=[r];let end=r.end;
  for(const x of data.reservations.filter(x=>r.rosterId&&x.rosterId===r.rosterId&&x.pilotId===r.pilotId&&booked(x)&&x.id!==r.id&&x.start>=r.end).sort((p,q)=>p.start-q.start)){
    if(x.start-end>=8*36e5)break;
    out.push(x);end=x.end;
  }return out}
/* Cada voo é comparado separadamente com reservas externas; pernoites ficam livres. */
function dlaMaxEobt(r){const eobt=r.start+20*6e4,ch=dlaChain(r),ids=new Set(ch.map(x=>x.id));let lim=Date.now()+DLA_AHEAD;
  for(const leg of ch){if(dlaStarted(leg))return eobt;
    for(const x of data.reservations){if(ids.has(x.id)||!booked(x)||x.end<=leg.start)continue;
      if(x.aircraftId!==leg.aircraftId&&x.pilotId!==leg.pilotId)continue;
      lim=Math.min(lim,eobt+Math.max(0,x.start-leg.end))}}
  return lim}
function sheetDla(resId){
  const r=data.reservations.find(x=>x.id===resId);if(!r)return;const a=acById(r.aircraftId)||{registration:r.aircraftId};
  const st=dlaState(r),max=dlaMaxEobt(r),step=5*6e4;
  let first=Math.max(st.eobt+6e4,Date.now()+6e4);first=Math.ceil(first/step)*step;
  const opts=[];for(let x=first;x<=max;x+=step)opts.push(x);
  const chain=dlaChain(r).slice(1);
  const z=ms=>utcHM(ms)+"Z";
  openSheet("form",`${head(t("dla_eyebrow"),`${t("dla_title")} · ${regTag(a,"",1)}`)}
   <div class="banner"><strong>${fnoChip(r.flightNo)} ${wxCode(r.dep)} → ${wxCode(r.arr)}</strong><span>EOBT ${z(st.eobt)} · ${tf.format(st.eobt)} ${t("t_local")}</span></div>
   <p class="muted" style="margin:0">${t("dla_rules",{lim:z(st.limit),dl:"45"})}</p>
   ${chain.length?`<div class="notice" style="margin:0">${t("dla_chain")} ${chain.map(x=>`<b class="nw">${esc(x.flightNo||"")} ${esc(x.dep)}→${esc(x.arr)} ${z(x.start+20*6e4)}</b>`).join(" · ")}</div>`:""}
   ${opts.length?`<form id="f-dla" data-id="${esc(resId)}">
    <label>${t("dla_new")}<select id="dla-eobt">${opts.map(x=>`<option value="${x}">${z(x)} · ${tf.format(x)} ${t("t_local")} (+${hhmmShort(Math.round((x-st.eobt)/6e4))})</option>`).join("")}</select></label>
    <p class="muted" style="margin:0;font-size:.85rem">${t("dla_once")}</p>
    <p class="form-err" hidden></p>
    <div class="row"><button class="btn primary" type="submit">${t("dla_send")}</button><button class="btn" type="button" data-action="close">${t("not_now")}</button></div>
   </form>`:`<div class="notice bad">${t("dla_no_room")}</div>`}`);
}
const hhmmShort=m=>`${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;
async function submitDla(form){
  const id=form.dataset.id,v=Number($("#dla-eobt").value);
  await busy(form,async()=>{const {error}=await sb.rpc("file_dla",{p_reservation:id,p_new_eobt:new Date(v).toISOString()});if(error)throw error;
    await load("reservations");closeSheet();render();toast(t("dla_ok",{t:utcHM(v)+"Z"}))});
}
function noShowNotices(){
  const now=Date.now();
  return data.reservations.filter(r=>r.pilotId===myId&&r.status==="cancelled"&&r.cancelReason==="noshow"&&r.start>now-3*864e5&&!altSeen(r.id,"noshow"))
    .sort((x,y)=>y.start-x.start).map(r=>{const a=acById(r.aircraftId);
      return`<div class="notice bad alt-notice noshow"><span>⛔ ${t("noshow_notice",{fno:esc(r.flightNo||""),route:`${esc(r.dep)} → ${esc(r.arr)}`,reg:regTag(a,r.aircraftId),eobt:utcHM(r.start+20*6e4)+"Z",dl:utcHM(r.start+65*6e4)+"Z"})}</span>
        <button class="btn small" data-action="noshow-ok" data-id="${esc(r.id)}">${t("alt_dismiss")}</button></div>`}).join("");
}
/* com o app aberto: no prazo de cancelamento, pede ao servidor a verificação e atualiza */
let noShowBusy=false;
setInterval(async()=>{if(!sb||!session||noShowBusy)return;const now=Date.now();
  const due=data.reservations.some(r=>{if(r.pilotId!==myId||!booked(r)||!r.rosterId||dlaStarted(r))return false;const d=dlaState(r).deadline;return now>d&&now<d+10*6e4});
  if(!due)return;noShowBusy=true;
  try{await sb.rpc("expire_noshows");await load("reservations");render()}catch(e){}finally{noShowBusy=false}},60e3);
function sheetAck(resId){
  const r=data.reservations.find(x=>x.id===resId);if(!r)return;const a=acById(r.aircraftId);if(!a)return;
  openSheet("form",`${head(t("before_flight"),`${t("techlog")} · ${regTag(a,"",1)}`)}
   ${ackStale(r)?`<div class="notice">${t("log_changed")}</div>`:""}
   ${logReviewHTML(a)}
   <form id="f-ack" data-id="${esc(resId)}">
    <label class="check"><input type="checkbox" id="ack-ok" required> ${esc(t("ack_text",{reg:a.registration}))}</label>
    <div class="row"><button class="btn primary" type="submit">${t("sign")}</button><button class="btn" type="button" data-action="close">${t("not_now")}</button></div>
   </form>`);
}
function defectRow(i){
  return`<fieldset class="df" data-i="${i}"><legend>${t("defect_n",{n:i+1})}</legend>
   <div class="ta"><label>${t("defect")}<input id="df-q-${i}" data-role="q" placeholder="${t("df_search_ph")}" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list"></label>
   <input type="hidden" id="df-cat-${i}" data-role="cat" value=""><div class="ta-list" data-role="list" role="listbox" hidden></div></div>
   <label data-role="ata-wrap" hidden>${t("ata_ch")}<select id="df-ata-${i}" data-role="ata">${Object.keys(ATA).map(k=>`<option value="${k}">${String(k).padStart(2,"0")} · ${esc(ataName(k))}</option>`).join("")}</select></label>
   <label>${t("what_happened")} <span class="hint" data-role="desc-hint">${t("opt_details")}</span><textarea id="df-desc-${i}" data-role="desc" maxlength="600" placeholder="${t("desc_ph")}"></textarea></label>
   <label>${t("phase")}<select id="df-phase-${i}" data-role="phase">${PHASES.map(p=>`<option value="${p[0]}">${esc(tr(p))}</option>`).join("")}</select></label>
   <div hidden><!-- ação, prazo MEL e tempo de reparo: definidos automaticamente pela falha (catálogo ou capítulo ATA) -->
   <select id="df-out-${i}" data-role="out">${["rectified","deferred","grounded"].map(o=>`<option value="${o}">${outLabel(o)}</option>`).join("")}</select>
   <select id="df-defer-${i}" data-role="defer">${[3,10,120].map(d=>`<option value="${d}">${melLabel(d)}</option>`).join("")}</select>
   <span data-role="defer-wrap"></span><span data-role="rep-wrap"></span><span data-role="rep-label"></span>
   <select id="df-rep-${i}" data-role="rep">${REPAIR_OPTS.map(h=>`<option value="${h}">${h} h</option>`).join("")}</select></div>
   <label data-role="proc-wrap">${t("proc_next")}<input id="df-proc-${i}" data-role="proc" maxlength="160" placeholder="${t("proc_ph")}"></label>
   <p class="eta" data-role="eta" hidden></p>
   <button class="btn small danger" type="button" data-action="rm-defect" style="justify-self:start">${t("rm_defect")}</button></fieldset>`;
}
/* Falha fora do catálogo: ação, prazo MEL e tempo de reparo mais comuns entre as falhas do mesmo capítulo ATA */
function ataDefault(ata){
  const items=CATALOG.filter(c=>String(c.ata)===String(ata));if(!items.length)return{outcome:"deferred",deferDays:10,repairH:4};
  const mode=arr=>{const m={};arr.forEach(x=>m[x]=(m[x]||0)+1);return Object.keys(m).sort((a,b)=>m[b]-m[a])[0]};
  const outcome=mode(items.map(c=>c.outcome));const reps=items.map(c=>c.repairH).filter(Boolean).sort((a,b)=>a-b);
  const defs=items.map(c=>c.deferDays).filter(Boolean);
  return{outcome,deferDays:Number(defs.length?mode(defs):10),repairH:reps.length?reps[Math.floor(reps.length/2)]:4};
}
function setNearest(sel,v){v=String(v);if(![...sel.options].some(o=>o.value===v))sel.insertAdjacentHTML("beforeend",`<option value="${esc(v)}">${esc(v)}</option>`);sel.value=v}
function syncDefectRow(fs,fromCatalog){
  const q=r=>fs.querySelector(`[data-role="${r}"]`);const c=CAT_BY_ID[q("cat").value],other=q("cat").value==="other";
  if(c){q("out").value=c.outcome;if(fromCatalog)q("proc").value=c.p?tr(c.p):"";setNearest(q("defer"),c.deferDays||10);setNearest(q("rep"),c.repairH||4)}
  else if(other){const d=ataDefault(q("ata").value);q("out").value=d.outcome;setNearest(q("defer"),d.deferDays);setNearest(q("rep"),d.repairH);if(fromCatalog)q("proc").value=""}
  q("ata-wrap").hidden=!other;q("desc-hint").textContent=other?t("required"):t("opt_details");
  const o=q("out").value;q("proc-wrap").hidden=o!=="deferred";
  const e=q("eta");if(q("cat").value){const x=etaLine(o,Number(q("rep").value),Number(q("defer").value));e.className="eta "+x.k;e.textContent=x.text;e.hidden=false}else e.hidden=true;
  paintReportEta();
}
/* ---------- Simuladores favoritos do piloto (guardados no perfil da conta: user_metadata.sims) ---------- */
const SIM_KEYS=Object.keys(SIMS).filter(k=>k!=="p3d");
const mySims=()=>{const v=session&&session.user&&session.user.user_metadata&&session.user.user_metadata.sims;return Array.isArray(v)?v.filter(k=>SIM_KEYS.includes(k)):[]};
const simChecks=(sel,name)=>`<div class="sim-checks">${SIM_KEYS.map(k=>`<label class="check sim-chk"><input type="checkbox" name="${name}" value="${k}" ${sel.includes(k)?"checked":""}> ${esc(simName(k))}</label>`).join("")}</div>`;
function simOptions(all){const fav=mySims();const keys=all||!fav.length?SIM_KEYS:fav;
  return (keys.length===1?"":`<option value="">${t("choose")}</option>`)+keys.map(k=>`<option value="${k}">${esc(simName(k))}</option>`).join("")+
    (!all&&fav.length&&fav.length<SIM_KEYS.length?`<option value="__all">${t("sim_more")}</option>`:"")}
function sheetMySims(){
  openSheet("form",`${head(t("my_sims_eb"),t("my_sims_title"))}
  <form id="f-sims"><p class="muted" style="margin:0">${t("my_sims_sub")}</p>${simChecks(mySims(),"ms-sim")}
   <label>${t("sb_user_label")} <span class="hint">${t("optional")}</span><input id="ms-sb" maxlength="40" value="${esc(mySimbrief())}" placeholder="${t("sb_user_ph")}" autocomplete="off" spellcheck="false"></label>
   <p class="hint" style="margin:-6px 0 0">${t("sb_user_hint")}</p>
   ${typeof netProfileHTML==='function'?netProfileHTML():''}
   <p class="form-err" id="ms-err" hidden></p>
   <div class="row"><button class="btn primary" type="submit">${t("save")}</button><button class="btn" type="button" data-action="close">${t("cancel")}</button></div></form>`);
}
async function submitMySims(form){
  const sims=[...form.querySelectorAll('input[name="ms-sim"]:checked')].map(i=>i.value);
  if(!sims.length)return err("#ms-err",t("sims_required"));
  const sbu=($("#ms-sb")?$("#ms-sb").value:"").trim();if(sbu&&!/^[A-Za-z0-9_.-]{1,40}$/.test(sbu))return err("#ms-err",t("sb_user_bad"));
  let network={};try{if(typeof netProfileValues==='function')network=netProfileValues()}catch(e){return err('#ms-err',String(e.message))}
  await busy(form,async()=>{const {data:res,error}=await sb.auth.updateUser({data:{sims,simbrief:sbu,...network}});if(error)throw error;if(res&&res.user&&session)session.user=res.user;closeSheet();toast(t("sims_saved"));render()});
}
function sheetReport(resId){
  const r=data.reservations.find(x=>x.id===resId);if(!r)return;const a=acById(r.aircraftId);if(!a)return;
  const review=typeof REPORT_REVIEWS!=="undefined"&&REPORT_REVIEWS.pilot===myId?REPORT_REVIEWS.rows.find(q=>q.reservation_id===resId&&q.pilot_id===myId):null;
  if(review){openSheet("form",`${head(reviewText('title'),esc(a.registration))}<p class="notice">${esc(reviewText(review.status==='pending'?'pending':review.status))}</p><p>${esc(review.decision_reason||review.pilot_reason)}</p><button class="btn" data-action="close">${t('close')}</button>`);return}
  const tk=typeof trkResultFor==="function"?trkResultFor(resId):null,ver=!!(tk&&tk.status==="verified"),ro=ver?" readonly":"";
  const hm=m=>`${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;
  const trkNote=ver?`<div class="notice ok">✓ ${t("rp_verified",{b:block(tk.block_min),arr:esc(tk.actual_arr||r.arr)})}</div>`
    :tk?`<div class="notice bad">${t("rp_rejected")}</div>`
    :`<div class="notice">${t("rp_untracked")}${typeof trkCanStart==="function"&&trkCanStart(r)?` <button class="btn small primary" type="button" data-action="trk-open" data-id="${esc(r.id)}">✈ ${t("trk_start")}</button>`:""}</div>`;
  openSheet("form",`${head(t("after_landing"),`${t("flight_report")} · ${regTag(a,"",1)}`)}
  <form id="f-rep" data-id="${esc(resId)}">
   ${trkNote}<input type="hidden" id="rp-track" value="${esc(tk&&tk.trackId||"")}">
   <div class="grid2"><label>${t("dep")}<input id="rp-dep" class="up" required maxlength="4" value="${esc(r.dep)}"${ro}></label><label>${t("arr")}<input id="rp-arr" class="up" required maxlength="4" value="${esc(ver&&tk.actual_arr||r.arr)}"${ro}></label></div>
   <div class="grid2"><label>${t("simulator")}<select id="rp-sim" required>${simOptions()}</select>${mySims().length?"":`<button class="linkish" type="button" data-action="my-sims" style="font-size:.82rem;margin-top:4px">${t("sims_define")}</button>`}</label>
   <label>${t("block_time")} <span class="hint">h:mm</span><input id="rp-block" required pattern="\\d{1,2}:[0-5]\\d" placeholder="1:45" inputmode="numeric"${ver?` value="${hm(tk.block_min)}" readonly`:""}></label></div>
   <label>${t("remarks")} <span class="hint">${t("optional")}</span><textarea id="rp-rem" maxlength="600" placeholder="${t("remarks_ph")}"></textarea></label>
   ${typeof reportReviewFields==="function"?reportReviewFields(ver):""}
   <div style="display:grid;gap:10px"><div class="sec-head"><h3>${t("tech_reports")}</h3><button class="btn small" type="button" data-action="add-defect">${t("add_defect")}</button></div>
   <p class="hint" style="margin:0">${t("leave_empty")}</p><div id="defects" style="display:grid;gap:12px"></div></div>
   <div id="rp-eta"></div>
   <p class="form-err" id="rp-err" hidden></p>
   <div class="row"><button class="btn primary" type="submit">${!ver&&typeof reviewText==="function"?reviewText('send'):t("file_close")}</button><button class="btn" type="button" data-action="close">${t("cancel")}</button></div>
  </form>`);
}



/* ---------- Screens outside the app: setup and sign-in ---------- */
function render(){
  if(!configured){paintChrome();$("#me").innerHTML="";$("#view").innerHTML=`<div class="empty"><span class="eyebrow">Setup</span><h2>${t("config_title")}</h2><p>${t("config_body")}</p></div>`;return}
  if(booting){paintChrome();return}
  const lp=(!session&&!recovering&&authMode==="landing"&&typeof paintLanding==="function");
  document.body.classList.toggle("is-landing",lp);
  if(lp){paintChrome();paintMe();paintLanding();if(typeof decorateSimulatorNames==="function")decorateSimulatorNames($("#view"));return}
  if(!session||recovering){paintChrome();paintMe();paintAuth();if(typeof decorateSimulatorNames==="function")decorateSimulatorNames($("#view"));return}
  paintMe();return renderApp();
}
function paintMe(){
  const el=$("#me");
  const inst=installPrompt?`<button class="install" data-action="install">${t("install")}</button>`:"";
  if(!session){el.innerHTML=inst;return}
  el.innerHTML=`${inst}<span class="me-name"></span><button data-action="my-sims" title="${t("my_sims_title")}">${t("my_sims_btn")}</button><button data-action="signout">${t("signout")}</button>`;
  el.querySelector(".me-name").textContent=names[myId]||session.user.email;
  if(typeof rankChip==="function")el.querySelector(".me-name").insertAdjacentHTML("afterend",`<span class="me-rank">${rankChip(myId)}</span>`);
}
function paintAuth(){
  if(authMode==="forgot"||authMode==="newpw"){const fg=authMode==="forgot";
    $("#view").innerHTML=`<div class="auth"><form class="auth-card" id="f-auth">
    <div><span class="eyebrow">Virtual Flight Report</span><h2>${fg?t("forgot_title"):t("newpw_title")}</h2></div>
    <p class="muted" style="margin:0">${fg?t("forgot_sub"):t("newpw_sub")}</p>
    ${authMsg?`<div class="notice ${authMsg.ok?"ok":"bad"}">${esc(authMsg.text)}</div>`:""}
    ${fg?`<label>${t("email")}<input id="au-email" type="email" required autocomplete="email"></label>`
        :`<label>${t("newpw_label")} <span class="hint">${t("pw_hint")}</span><input id="au-pw" type="password" required minlength="6" autocomplete="new-password"></label>`}
    <button class="btn primary" type="submit">${fg?t("forgot_send"):t("newpw_save")}</button>
    <button class="linkish" type="button" data-action="auth-back">${t("back_signin")}</button>
  </form></div>`;return}
  const up=authMode==="signup";
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.matchMedia("(display-mode: standalone)").matches&&!navigator.standalone;
  $("#view").innerHTML=`<div class="auth"><form class="auth-card" id="f-auth">
    <div><span class="eyebrow">Virtual Flight Report</span><h2>${up?t("signup_title"):t("signin_title")}</h2></div>
    <p class="muted" style="margin:0">${t("signin_sub")}</p>
    ${authMsg?`<div class="notice ${authMsg.ok?"ok":"bad"}">${esc(authMsg.text)}</div>`:""}
    ${up?`<label>${t("display_name")}<input id="au-name" required maxlength="40" placeholder="${t("display_ph")}" autocomplete="nickname"></label>`:""}
    <label>${t("email")}<input id="au-email" type="email" required autocomplete="email"></label>
    ${up?`<fieldset class="sim-field"><legend>${t("signup_sims")}</legend><span class="hint">${t("signup_sims_hint")}</span>${simChecks([],"au-sim")}<p class="form-err" id="au-sims-err" hidden></p></fieldset>${typeof flSignupHTML==="function"?flSignupHTML():""}`:""}
    <label>${t("password")} ${up?`<span class="hint">${t("pw_hint")}</span>`:""}<input id="au-pw" type="password" required minlength="6" autocomplete="${up?"new-password":"current-password"}"></label>
    <button class="btn primary" type="submit">${up?t("signup"):t("signin")}</button>
    ${up?"":`<button class="linkish" type="button" data-action="auth-forgot">${t("forgot_link")}</button>`}
    <button class="linkish" type="button" data-action="auth-mode">${up?t("to_signin"):t("to_signup")}</button>
    ${ios?`<p class="hint" style="margin:0">${t("ios_install")}</p>`:""}
    <button class="linkish" type="button" data-action="lp-home">${t("lp_home")}</button>
  </form></div>`;
}
async function submitAuth(form){
  const b=form.querySelector('button[type="submit"]');
  if(authMode==="forgot"){const email=$("#au-email").value.trim();b.disabled=true;
    try{const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.vfrNative?"https://flyvfr.com.br/":location.origin+location.pathname});
      if(error)authMsg={ok:false,text:navigator.onLine?t("forgot_err",{m:error.message}):t("err_net")};
      else{authMsg={ok:true,text:t("forgot_sent")};authMode="signin"}}finally{b.disabled=false}
    return render()}
  if(authMode==="newpw"){const pw=$("#au-pw").value;b.disabled=true;
    try{const {error}=await sb.auth.updateUser({password:pw});
      if(error)authMsg={ok:false,text:t("newpw_err",{m:error.message})};
      else{recovering=false;authMode="signin";authMsg=null;render();toast(t("newpw_ok"));if(session)loadEverything();return}}finally{b.disabled=false}
    return render()}
  const email=$("#au-email").value.trim(),pw=$("#au-pw").value;b.disabled=true;authMsg=null;
  try{
    if(authMode==="signup"){
      const name=$("#au-name").value.trim();const sims=[...form.querySelectorAll('input[name="au-sim"]:checked')].map(i=>i.value);
      if(!sims.length){const m=form.querySelector("#au-sims-err");m.textContent=t("sims_required");m.hidden=false;form.querySelector(".sim-field").scrollIntoView&&form.querySelector(".sim-field").scrollIntoView({block:"center"});return}
      const pilot_mode=form.querySelector('input[name="au-mode"]:checked')?.value||null;const me=form.querySelector("#au-mode-err");if(me&&!pilot_mode){me.textContent=typeof ft==="function"?ft("fl_mode_req"):"";me.hidden=false;return}
      const {data:res,error}=await sb.auth.signUp({email,password:pw,options:{data:{display_name:name,sims,pilot_mode},emailRedirectTo:window.vfrNative?"https://flyvfr.com.br/":location.origin+location.pathname}});
      if(error)authMsg={ok:false,text:t("err_signup",{m:error.message})};
      else if(!res.session){authMsg={ok:true,text:t("check_email")};authMode="signin"}
    }else{
      const {error}=await sb.auth.signInWithPassword({email,password:pw});
      if(error)authMsg={ok:false,text:navigator.onLine?t("err_login"):t("err_net")};
    }
  }finally{b.disabled=false}
  render();
}


/* ---------- SimBrief ---------- */
const AIRLINE_ICAO={"GOL":"GLO","LATAM Brasil":"TAM","LATAM":"TAM","Azul":"AZU","TAP Air Portugal":"TAP","Lufthansa":"DLH","Air France":"AFR","KLM":"KLM","British Airways":"BAW","Iberia":"IBE","Ryanair":"RYR","easyJet":"EZY","American Airlines":"AAL","Delta Air Lines":"DAL","United Airlines":"UAL","Southwest Airlines":"SWA","Alaska Airlines":"ASA","JetBlue":"JBU","Air Canada":"ACA","WestJet":"WJA","Aeroméxico":"AMX","Singapore Airlines":"SIA","Cathay Pacific":"CPA","ANA":"ANA","Japan Airlines":"JAL","Korean Air":"KAL","Thai Airways":"THA","Emirates":"UAE","Qatar Airways":"QTR","LATAM Chile":"LAN","LATAM Ecuador":"LNE","Avianca":"AVA","Copa Airlines":"CMP","Aerolíneas Argentinas":"ARG","JetSMART":"JAT","Sky Airline":"SKU","Qantas":"QFA","Jetstar":"JST","Jetstar Japan":"JJP","Virgin Australia":"VOZ","Air New Zealand":"ANZ","Fiji Airways":"FJI","Ethiopian Airlines":"ETH","EgyptAir":"MSR","Royal Air Maroc":"RAM","South African Airways":"SAA","Airlink":"LNK","FlySafair":"SFR","Kenya Airways":"KQA","RwandAir":"RWD","Air Algérie":"DAH","Tunisair":"TAR","TAAG Angola":"DTA","Air Mauritius":"MAU","Air Peace":"APK","Air Tanzania":"ATC","Air Côte d'Ivoire":"VRE","Uganda Airlines":"UGD"};
function icaoType(type){
  const s=String(type||"").toUpperCase();
  if(/^[A-Z][A-Z0-9]{2,3}$/.test(s))return s;
  const R=[[/A318/,"A318"],[/A220-3|BCS3/,"BCS3"],[/A220-1|BCS1/,"BCS1"],[/A319/,"A319"],[/A320-2\d\dN|A320NEO/,"A20N"],[/A320/,"A320"],[/A321-2\d\dN|A321NEO|A321.*NX/,"A21N"],[/A321/,"A321"],
    [/A340-6/,"A346"],[/A340/,"A343"],[/A380/,"A388"],[/747-8/,"B748"],[/747/,"B744"],[/A330-8/,"A338"],[/A330-9/,"A339"],[/A330-3/,"A333"],[/A330-2|A330/,"A332"],[/A350-1/,"A35K"],[/A350/,"A359"],
    [/737 ?MAX ?8|737-8 MAX|B38M/,"B38M"],[/737 ?MAX ?9/,"B39M"],[/737-6/,"B736"],[/737-4/,"B734"],[/737-3/,"B733"],[/737-7/,"B737"],[/737-8|737-800/,"B738"],[/737-9/,"B739"],
    [/767-3/,"B763"],[/777-3/,"B77W"],[/777-2.*LR/,"B77L"],[/777-2/,"B772"],[/787-10/,"B78X"],[/787-9/,"B789"],[/787-8|787/,"B788"],
    [/DASH ?8-?400|DHC-?8-?4|Q400/,"DH8D"],[/DASH ?8-?300|DHC-?8-?3|Q300/,"DH8C"],[/TWIN OTTER|DHC-?6/,"DHC6"],[/ATR ?72/,"AT76"],[/ATR ?42/,"AT46"],[/E195-E2/,"E295"],[/E195/,"E195"],[/E190-E2/,"E290"],[/E190/,"E190"],[/E175/,"E175"],[/E170/,"E170"],[/ERJ-?145/,"E145"],[/ERJ-?140|ERJ-?135/,"E135"],[/FOKKER 50/,"F50"],[/CRJ-?1000/,"CRJX"],[/CRJ-?900/,"CRJ9"],
    [/CARAVAN|CARGOMASTER/,"C208"],[/SKYCOURIER|408/,"C408"],[/PC-?12/,"PC12"],[/172/,"C172"]];
  for(const [re,c] of R)if(re.test(s))return c;
  return "";
}
const MON=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
/* ---------- Número do voo (opcional na reserva) ---------- */
const AIRLINE_IATA={"GOL":"G3","LATAM Brasil":"LA","Azul":"AD","TAP Air Portugal":"TP","Lufthansa":"LH","Air France":"AF","KLM":"KL","British Airways":"BA","Iberia":"IB","Ryanair":"FR","easyJet":"U2",
  "American Airlines":"AA","Delta Air Lines":"DL","United Airlines":"UA","Southwest Airlines":"WN","Alaska Airlines":"AS","JetBlue":"B6","Air Canada":"AC","WestJet":"WS","Aeroméxico":"AM","Singapore Airlines":"SQ","Cathay Pacific":"CX","ANA":"NH","Japan Airlines":"JL","Korean Air":"KE","Thai Airways":"TG","Emirates":"EK","Qatar Airways":"QR","LATAM Chile":"LA","LATAM Ecuador":"XL","Avianca":"AV","Copa Airlines":"CM","Aerolíneas Argentinas":"AR","JetSMART":"JA","Sky Airline":"H2","Qantas":"QF","Jetstar":"JQ","Jetstar Japan":"GK","Virgin Australia":"VA","Air New Zealand":"NZ","Fiji Airways":"FJ","Ethiopian Airlines":"ET","EgyptAir":"MS","Royal Air Maroc":"AT","South African Airways":"SA","Airlink":"4Z","FlySafair":"FA","Kenya Airways":"KQ","RwandAir":"WB","Air Algérie":"AH","Tunisair":"TU","TAAG Angola":"DT","Air Mauritius":"MK","Air Peace":"P4","Air Tanzania":"TC","Air Côte d'Ivoire":"HF","Uganda Airlines":"UR"};
/* logotipo da companhia: carregado de serviços públicos de logos de aviação pelo código IATA; sem logo, mostra o código nas cores da companhia */
const LOGO_SRC=[c=>`https://pics.avs.io/120/40/${c}.png`,c=>`https://images.kiwi.com/airlines/64/${c}.png`];
function alLogo(al,cls){const c=AIRLINE_IATA[al];if(!al)return"";
  const [c1,c2]=(typeof LIVERY!=="undefined"&&LIVERY[al])||["#5B6573","#5B6573"],tag=esc(c||(AIRLINE_ICAO[al]||al).slice(0,3).toUpperCase());
  const badge=`<span class="al-badge" style="background:${c1};border-color:${c2}">${tag}</span>`;
  if(!c)return`<span class="al-logo ${cls||""}" title="${esc(al)}">${badge}</span>`;
  return`<span class="al-logo ${cls||""}" title="${esc(al)}"><img src="${LOGO_SRC[0](c)}" alt="${esc(al)}" data-c="${c}" data-i="0" onerror="alLogoErr(this)" onload="alLogoOk(this)">${badge}</span>`}
function alLogoErr(img){const i=+img.dataset.i+1;if(LOGO_SRC[i]){img.dataset.i=i;img.src=LOGO_SRC[i](img.dataset.c)}else img.parentNode.classList.add("nologo")}
/* serviço devolve imagem vazia/minúscula quando não conhece a companhia: trata como falha */
function alLogoOk(img){if(img.naturalWidth<8)return alLogoErr(img);img.parentNode.classList.add("ok")}
/* símbolo da companhia (só o ícone, fundo transparente) ao lado do nome; se não houver, fica só o nome */
const SYM_SRC=[c=>`https://www.gstatic.com/flights/airline_logos/70px/${c}.png`,c=>`https://images.kiwi.com/airlines/64/${c}.png`];
function alSym(al){const c=AIRLINE_IATA[al];return c?`<img class="al-sym" src="${SYM_SRC[0](c)}" alt="" data-c="${c}" data-i="0" onerror="alSymErr(this)" onload="if(this.naturalWidth<8)alSymErr(this)">`:""}
/* matrícula nas cores da companhia: fundo na cor principal, faixa embaixo na secundária, texto claro ou escuro conforme o contraste */
function plateStyle(al){const L=(typeof LIVERY!=="undefined"&&LIVERY[al]);if(!L)return"";const [c1,c2]=L;
  const h=c1.replace("#",""),r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16),lum=(0.299*r+0.587*g+0.114*b)/255;
  return` style="background:${c1};color:${lum>0.62?"#0B0F17":"#FFFFFF"};box-shadow:inset 0 -3px 0 ${c2}"`}
/* matrículas longas (ex.: HP-1376CMP) ganham fonte menor para não invadir a coluna ao lado */
function plLen(r){const n=String(r||"").length;return n>10?" xlong":n>7?" long":""}
/* matrícula nas cores da companhia com o símbolo da companhia à esquerda (usado em todo o app) */
function regTag(ac,fb,big){const reg=(ac&&ac.registration)||fb||"",al=(ac&&ac.airline)||"";
  return`<span class="reg-tag${big?" big":""}">${AIRLINE_IATA[al]?`<span class="sym-slot">${alSym(al)}</span>`:""}<span class="plate al-plate${big?" big":""}${plLen(reg)}"${plateStyle(al)}>${esc(reg)}</span></span>`}
/* matrícula nas cores da companhia com o símbolo embaixo (mapa) */
function regStack(ac,reg){const al=ac&&ac.airline||"";const rg=reg||ac&&ac.registration||"";return`<span class="reg-stack"><span class="plate al-plate${plLen(rg)}"${plateStyle(al)}>${esc(rg)}</span>${AIRLINE_IATA[al]?`<span class="sym-slot">${alSym(al)}</span>`:""}</span>`}
function alSymErr(img){const i=+img.dataset.i+1;if(SYM_SRC[i]){img.dataset.i=i;img.src=SYM_SRC[i](img.dataset.c)}else img.remove()}
function fnoPlaceholder(){const a=acById($("#bk-ac")?.value);const c=a&&(AIRLINE_IATA[a.airline]||AIRLINE_ICAO[a.airline]);return c?c+" 1234":"G3 1234"}
function normFno(v){return String(v||"").toUpperCase().replace(/[^A-Z0-9 ]/g,"").replace(/\s+/g," ").trim()}
const FNO_RE=/^(?:([A-Z]{3}|[A-Z][0-9]|[0-9][A-Z]|[A-Z]{2}) ?)?([0-9]{1,4}[A-Z]?)$/;
const fnoChip=n=>n?`<span class="fno-chip">${esc(n)}</span>`:"";
function simbriefUrl(r){
  const a=acById(r.aircraftId)||{registration:r.aircraftId,type:"",airline:""};const d=new Date(r.eobt??(r.start+(r.rosterId?20*6e4:0)));
  const p={orig:r.dep,dest:r.arr,reg:a.registration,
    date:String(d.getUTCDate()).padStart(2,"0")+MON[d.getUTCMonth()]+String(d.getUTCFullYear()).slice(2),
    deph:d.getUTCHours(),depm:d.getUTCMinutes(),manualrmk:"Virtual Flight Report"};
  const ty=icaoType(a.type);if(ty)p.type=ty;
  if(r.route)p.route=r.route;
  const al=AIRLINE_ICAO[a.airline];if(al)p.airline=al;
  const fm=FNO_RE.exec(normFno(r.flightNo));if(fm){p.fltnum=fm[2];if(fm[1]&&fm[1].length===3)p.airline=fm[1]}
  return "https://dispatch.simbrief.com/options/custom?"+new URLSearchParams(p).toString();
}
const sbLink=(r,cls,label)=>`<a class="btn ${cls||""} ext-btn dispatch-link" href="${esc(simbriefUrl(r))}" target="_blank" rel="noopener" title="${esc(t('simbrief'))}"><img class="btn-ic" src="img/brand/simbrief.png" alt="" width="18" height="18">${label||'SimBrief'} ↗</a>`;
function sheetConfirmed(r){
  const a=acById(r.aircraftId)||{registration:r.aircraftId,type:""};const d=new Date(r.start);
  const utc=`${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
  openSheet("form",`${head(t("bk_eyebrow"),t("bk_done"))}
   <div class="banner ok"><strong>${regTag(a,"")} ${fnoChip(r.flightNo)} ${wxCode(r.dep)} → ${wxCode(r.arr)}</strong>
     <span>${fmtRange(r.start,r.end)}</span></div>
   <p class="muted" style="margin:0">${t("bk_done_sub")}</p>
   ${icaoType(a.type)?"":`<p class="hint" style="margin:0">${esc(t("sb_type_unknown",{type:a.type}))}</p>`}
   <div class="row">${sbLink(r,"primary")}${svLink(r,"")}<button class="btn" type="button" data-action="close">${t("done")}</button></div>`);
}



/* ---------- Tempo médio de reparo e liberação automática ---------- */
function etaLine(o,h,d){
  const now=Date.now();
  if(o==="grounded")return{k:"bad",text:t("eta_ground",{h,t:fmt(now+h*H)})};
  if(o==="deferred")return{k:"warn",text:t("eta_mel",{h,t:fmt(now+d*864e5)})};
  return{k:"ok",text:t("eta_none")};
}
function paintReportEta(){
  const f=$("#f-rep"),box=$("#rp-eta");if(!f||!box)return;
  const r=data.reservations.find(x=>x.id===f.dataset.id);if(!r){box.innerHTML="";return}
  const now=Date.now(),tmp=[];
  document.querySelectorAll("#defects .df").forEach((fs,i)=>{const q=k=>fs.querySelector(`[data-role="${k}"]`);
    if(q("cat").value&&q("out").value==="grounded")tmp.push({aircraftId:r.aircraftId,outcome:"grounded",repairH:Number(q("rep").value),createdAt:now,id:"tmp"+i})});
  if(!tmp.length){box.innerHTML="";return}
  const until=releaseAt(r.aircraftId,now,[...data.defects,...tmp]);
  box.innerHTML=until?`<div class="banner bad"><span>${esc(t("eta_summary",{reg:acById(r.aircraftId)?.registration||r.aircraftId,t:fmt(until)}))}</span></div>`:"";
}
const taMeta=c=>c.outcome==="grounded"?t("ta_hours",{h:c.repairH}):c.outcome==="deferred"?t("ta_mel",{cat:melLabel(c.deferDays)}):t("ta_zero");

/* ---------- Busca de falhas ao digitar ---------- */
const norm=x=>String(x||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const catHay=c=>c._h||(c._h=norm([...(c.t||[]),c.k||"","ata "+c.ata,"ata"+String(c.ata).padStart(2,"0"),String(c.ata).padStart(2,"0"),...(ATA[c.ata]||[])].join(" ")));
function searchCatalog(q,all){
  const n=norm(q).trim();
  if(!n)return all?CATALOG.slice().sort((a,b)=>a.ata-b.ata):POPULAR.map(id=>CAT_BY_ID[id]).filter(Boolean);
  const toks=n.split(/\s+/),out=[];
  for(const c of CATALOG){if(!toks.every(x=>catHay(c).includes(x)))continue;
    const ti=norm(tr(c.t));let sc=ti.startsWith(n)?0:ti.includes(n)?1:2;if(POPULAR.includes(c.id))sc-=.5;out.push([sc,c])}
  return out.sort((a,b)=>a[0]-b[0]||a[1].ata-b[1].ata).map(x=>x[1]);
}
function paintTa(fs){
  const qi=fs.querySelector('[data-role="q"]'),list=fs.querySelector('[data-role="list"]'),q=qi.value;
  const res=searchCatalog(q).slice(0,8);fs.dataset.ai="-1";
  list.innerHTML=(q.trim()?"":`<div class="ta-head">${t("df_common")}</div>`)+
    res.map(c=>`<button type="button" class="ta-opt" role="option" data-action="ta-pick" data-id="${c.id}"><span class="ata">ATA ${String(c.ata).padStart(2,"0")}</span><span>${esc(tr(c.t))}</span><span class="ta-meta"><span class="chip ${OUT_KIND[c.outcome]}">${outLabel(c.outcome)}</span><small>${esc(taMeta(c))}</small></span></button>`).join("")+
    (q.trim()&&!res.length?`<div class="ta-empty">${t("df_no_results")}</div>`:"")+
    `<button type="button" class="ta-opt other" role="option" data-action="ta-pick" data-id="other">${t("df_other_opt")}</button>`;
  list.hidden=false;qi.setAttribute("aria-expanded","true");
}
function hideTa(fs){const l=fs&&fs.querySelector('[data-role="list"]');if(l&&!l.hidden){l.hidden=true;fs.querySelector('[data-role="q"]').setAttribute("aria-expanded","false")}}
function pickTa(fs,id){
  const qi=fs.querySelector('[data-role="q"]'),cat=fs.querySelector('[data-role="cat"]'),desc=fs.querySelector('[data-role="desc"]');
  if(id==="other"){if(!desc.value.trim()&&qi.value.trim()&&!CAT_BY_ID[cat.value])desc.value=qi.value.trim();cat.value="other";qi.value=t("other_desc")}
  else{cat.value=id;qi.value=tr(CAT_BY_ID[id].t)}
  qi.classList.add("picked");hideTa(fs);syncDefectRow(fs,true);
  if(id==="other")desc.focus();
}
document.addEventListener("input",e=>{
  if(e.target.dataset&&e.target.dataset.role==="q"){const fs=e.target.closest(".df");const cat=fs.querySelector('[data-role="cat"]');
    if(cat.value){cat.value="";e.target.classList.remove("picked");syncDefectRow(fs,false)}paintTa(fs)}
  if(e.target.id==="cat-q"){catQuery=e.target.value;clearTimeout(qTimer);qTimer=setTimeout(render,150)}
});
document.addEventListener("focusin",e=>{if(e.target.dataset&&e.target.dataset.role==="q"){const fs=e.target.closest(".df");if(!fs.querySelector('[data-role="cat"]').value)paintTa(fs)}});
document.addEventListener("keydown",e=>{
  if(!(e.target.dataset&&e.target.dataset.role==="q"))return;
  const fs=e.target.closest(".df"),list=fs.querySelector('[data-role="list"]');
  if(e.key==="Escape"){hideTa(fs);return}
  if(!["ArrowDown","ArrowUp","Enter"].includes(e.key))return;
  if(list.hidden){if(e.key!=="Enter")paintTa(fs);else e.preventDefault();return}
  const opts=[...list.querySelectorAll(".ta-opt")];let ai=Number(fs.dataset.ai||-1);
  if(e.key==="Enter"){e.preventDefault();const o=opts[ai<0?0:ai];if(o)pickTa(fs,o.dataset.id);return}
  e.preventDefault();ai=e.key==="ArrowDown"?Math.min(opts.length-1,ai+1):Math.max(0,ai-1);fs.dataset.ai=String(ai);
  opts.forEach((o,j)=>o.classList.toggle("active",j===ai));if(opts[ai].scrollIntoView)opts[ai].scrollIntoView({block:"nearest"});
});
document.addEventListener("mousedown",e=>{if(!e.target.closest(".ta"))document.querySelectorAll("#defects .df").forEach(hideTa)});


/* ---------- Limite semanal de reservas ---------- */
const WEEK_MAX_AC=5,BRT=3*H;
const weekOf=ms=>Math.floor((Math.floor((ms-BRT)/864e5)+3)/7);            // semana de segunda a domingo, horário de Brasília
const weekStart=w=>(7*w-3)*864e5+BRT;
const wkFmt={format:ms=>new Intl.DateTimeFormat(LOCALE[lang],{day:"2-digit",month:"short",timeZone:"America/Sao_Paulo"}).format(ms)};
function weekUse(ms,acId){
  const w=weekOf(ms),mine=data.reservations.filter(r=>r.pilotId===myId&&(r.status==="booked"||r.status==="completed")&&weekOf(r.start)===w);
  const grp=l=>new Set(l.map(r=>r.rosterId||r.id)).size;  /* a escala inteira conta como uma reserva */
  return{n:grp(mine),m:acId?grp(mine.filter(r=>r.aircraftId===acId)):0,d:wkFmt.format(weekStart(w))};
}
function paintQuota(){
  const el=$("#bk-quota");if(!el)return;const ms=new Date($("#bk-start").value).getTime();const acId=$("#bk-ac").value;
  if(!ms){el.textContent="";return}const u=weekUse(ms,acId);
  el.textContent=t("quota",{d:u.d,reg:acById(acId)?.registration||acId,m:u.m,maxac:WEEK_MAX_AC});
}


/* ---------- Duração máxima da reserva = tempo estimado de voo + 2 h ---------- */
let AIRPORTS=null;
/* ---------- Autopreenchimento de aeroportos (origem e destino) ---------- */
/* airports.json: ICAO → [lat, lon, IATA, nome, cidade, país] (algumas entradas só têm lat/lon) */
const apInput=(id,ph)=>`<div class="ta"><input id="${id}" class="up ap-in" required maxlength="40" placeholder="${ph}" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list"><div class="ta-list ap-list" id="${id}-list" role="listbox" hidden></div></div>`;
function apResolve(v){v=String(v||"").trim().toUpperCase();if(!AIRPORTS||AIRPORTS[v])return v;
  if(/^[A-Z0-9]{3}$/.test(v)){for(const k in AIRPORTS){const r=AIRPORTS[k];if(r[2]===v)return k}}return v}
function apSearch(q){
  const Q=q.trim().toUpperCase(),n=norm(q.trim());if(!n||!AIRPORTS)return[];
  const toks=n.split(/\s+/),out=[];
  for(const k in AIRPORTS){const r=AIRPORTS[k],iata=r[2]||"",name=norm(r[3]),city=norm(r[4]);
    const hay=k.toLowerCase()+" "+iata.toLowerCase()+" "+city+" "+name;
    if(!toks.every(x=>hay.includes(x)))continue;
    let sc=k===Q?0:iata===Q?1:k.startsWith(Q)?2:iata&&iata.startsWith(Q)?3:(city.startsWith(n)||name.startsWith(n))?4:6;
    /* desempate: Brasil, aeroportos com código IATA (voos regulares) e internacionais primeiro */
    if(r[5]==="BR")sc-=.4;if(iata)sc-=.3;if(/international|internacional/.test(name))sc-=.3;if(!r[3])sc+=1;out.push([sc,k])}
  return out.sort((a,b)=>a[0]-b[0]||a[1].localeCompare(b[1])).slice(0,8).map(x=>x[1]);
}
function apPaint(inp){
  const list=document.getElementById(inp.id+"-list");if(!list)return;
  if(!AIRPORTS){loadAirports().then(()=>{if(document.activeElement===inp)apPaint(inp)});return}
  const res=apSearch(inp.value);inp.dataset.ai="-1";
  if(!inp.value.trim()||!res.length||(res.length===1&&res[0]===inp.value.trim().toUpperCase())){apHide(inp);return}
  list.innerHTML=res.map(k=>{const r=AIRPORTS[k];return`<button type="button" class="ta-opt ap-opt" role="option" data-action="ap-pick" data-for="${inp.id}" data-icao="${esc(k)}"><span class="ap-code"><b>${esc(k)}</b>${r[2]?` <span class="muted">${esc(r[2])}</span>`:""}</span><span class="ap-name">${esc(r[3]||k)}${r[4]||r[5]?`<small>${esc([r[4],r[5]].filter(Boolean).join(", "))}</small>`:""}</span></button>`}).join("");
  list.hidden=false;inp.setAttribute("aria-expanded","true");
}
function apHide(inp){const l=inp&&document.getElementById(inp.id+"-list");if(l&&!l.hidden){l.hidden=true;inp.setAttribute("aria-expanded","false")}}
function apPick(inp,icao){inp.value=icao;apHide(inp);inp.dispatchEvent(new Event("input",{bubbles:true}));inp.dataset.picked="1";
  const nx=inp.id==="bk-dep"?$("#bk-arr"):null;if(nx&&!nx.value.trim())nx.focus()}
document.addEventListener("input",e=>{const el=e.target;if(!el.classList||!el.classList.contains("ap-in"))return;
  if(el.dataset.picked==="1"){el.dataset.picked="";return}apPaint(el)});
document.addEventListener("focusin",e=>{const el=e.target;if(el.classList&&el.classList.contains("ap-in")&&el.value.trim())apPaint(el)});
document.addEventListener("focusout",e=>{const el=e.target;if(!el.classList||!el.classList.contains("ap-in"))return;
  setTimeout(()=>{const l=document.getElementById(el.id+"-list");if(l&&l.contains(document.activeElement))return;apHide(el);
    const v=apResolve(el.value);if(v!==el.value.trim().toUpperCase()&&AIRPORTS&&AIRPORTS[v]){el.value=v;el.dataset.picked="1";el.dispatchEvent(new Event("input",{bubbles:true}))}},160)});
document.addEventListener("keydown",e=>{const el=e.target;if(!el.classList||!el.classList.contains("ap-in"))return;
  const list=document.getElementById(el.id+"-list");if(!list||list.hidden)return;const opts=[...list.querySelectorAll(".ap-opt")];let i=Number(el.dataset.ai||-1);
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();i=e.key==="ArrowDown"?Math.min(opts.length-1,i+1):Math.max(0,i-1);el.dataset.ai=i;
    opts.forEach((o,j)=>o.classList.toggle("active",j===i));opts[i]&&opts[i].scrollIntoView&&opts[i].scrollIntoView({block:"nearest"})}
  else if(e.key==="Enter"||e.key==="Tab"){const o=opts[i>=0?i:0];if(o&&(e.key==="Enter"||i>=0||el.value.trim().length>=3)){if(e.key==="Enter")e.preventDefault();apPick(el,o.dataset.icao)}}
  else if(e.key==="Escape"){e.stopImmediatePropagation();apHide(el)}});
document.addEventListener("mousedown",e=>{if(e.target.closest&&e.target.closest(".ap-opt"))e.preventDefault()});
/* base de aeroportos: uma busca por vez; se falhar, tenta de novo na próxima chamada (não guarda base vazia) */
let airportsP=null;
function loadAirports(){if(AIRPORTS&&Object.keys(AIRPORTS).length>1000)return Promise.resolve(AIRPORTS);if(airportsP)return airportsP;
  airportsP=fetch("airports.json?v=2",{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error("airports "+r.status);return r.json()})
    .then(j=>{if(!j||Object.keys(j).length<1000)throw new Error("airports vazio");AIRPORTS=j;airportsP=null;try{paintEstimate()}catch(e){}return j})
    .catch(e=>{console.warn(e);airportsP=null;if(!AIRPORTS)AIRPORTS=null;return AIRPORTS||{}});
  return airportsP}
const CRUISE_KT={A338:470,B77L:490,B733:430,B734:430,B736:440,E135:420,E145:420,F50:250,A319:450,A320:450,A20N:450,A321:450,A21N:450,A332:470,A333:470,A339:470,A359:488,A35K:488,B737:450,B738:453,B739:453,B38M:453,B39M:453,
  DH8D:300,DH8C:270,DHC6:150,A318:450,BCS1:450,BCS3:450,A343:470,A346:480,A388:490,B744:490,B748:490,E170:430,CRJX:450,CRJ9:450,B763:460,B772:483,B77W:490,B788:488,B789:488,B78X:488,AT76:275,AT46:260,E190:445,E195:445,E290:450,E295:450,E175:440,C208:170,C408:180,PC12:270,C172:110};
const hm=min=>{min=Math.round(min);const h=Math.floor(min/60),m=min%60;return h?(m?`${h} h ${String(m).padStart(2,"0")} min`:`${h} h`):`${m} min`};
function gcNm(a,b){const R=3440.065,r=Math.PI/180,dl=(b[0]-a[0])*r,dg=(b[1]-a[1])*r;
  const x=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function bookingEstimate(acId,dep,arr){
  if(!AIRPORTS||!/^[A-Z0-9]{4}$/.test(dep)||!/^[A-Z0-9]{4}$/.test(arr))return null;
  const A=AIRPORTS[dep],B=AIRPORTS[arr];if(!A||!B)return{missing:!A?dep:arr};
  const a=acById(acId),ty=icaoType(a&&a.type),kt=CRUISE_KT[ty]||430,slow=kt<300;
  const nm=gcNm(A,B),flightMin=Math.max(20,(nm*1.07/kt)*60+(slow?18:30));   // rota ~7% maior que a ortodrômica; táxi, subida e descida
  const est=Math.ceil(flightMin/5)*5;
  return{nm:Math.round(nm),type:CRUISE_KT[ty]?ty:t("est_generic"),estMin:est,minMin:est+45,maxMin:est+120};
}
function paintEstimate(){
  const el=$("#bk-est"),sel=$("#bk-dur");if(!el||!sel)return;
  if(!AIRPORTS){loadAirports();}
  const dep=$("#bk-dep").value.trim().toUpperCase(),arr=$("#bk-arr").value.trim().toUpperCase();
  const e=bookingEstimate($("#bk-ac").value,dep,arr);const prev=Number(sel.value)||0;
  let opts;
  if(e&&!e.missing){
    opts=[[e.minMin/60,t("dur_min_opt",{t:hm(e.minMin)})]];for(let m=Math.floor(e.minMin/30)*30+30;m<e.maxMin;m+=30)opts.push([m/60,hm(m)]);opts.push([e.maxMin/60,t("dur_max_opt",{t:hm(e.maxMin)})]);
    el.textContent=t("est_line",{dep,arr,type:e.type,t:hm(e.estMin),nm:e.nm,min:hm(e.minMin),max:hm(e.maxMin)});
  }else{
    opts=[1,1.5,2,3,4,5,6,8,10,12,14].map(h=>[h,hm(h*60)]);if(prev&&!opts.some(o=>Math.abs(o[0]-prev)<1e-6)){opts.push([prev,hm(prev*60)]);opts.sort((x,y)=>x[0]-y[0])}
    el.textContent=e&&e.missing?t("est_unknown_ap",{code:e.missing}):t("est_wait");
  }
  /* duração já escolhida (ou trazida de uma remarcação) dentro da faixa permitida continua valendo */
  if(e&&!e.missing&&prev*60>=e.minMin-1&&prev*60<=e.maxMin+1&&!opts.some(o=>Math.abs(o[0]-prev)<1e-6)){opts.push([prev,hm(prev*60)]);opts.sort((x,y)=>x[0]-y[0])}
  const keep=opts.some(o=>Math.abs(o[0]-prev)<1e-6)?prev:(e&&!e.missing?e.minMin/60:2);
  sel.innerHTML=opts.map(([v,l])=>`<option value="${v}" ${Math.abs(v-keep)<1e-6?"selected":""}>${esc(l)}</option>`).join("");
}
document.addEventListener("input",e=>{if(e.target.id==="bk-dep"||e.target.id==="bk-arr")paintEstimate()});


/* ---------- METAR / TAF ao passar o mouse no código do aeroporto ---------- */
const WX_CACHE={};
const wxLink=c=>`https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(c)}&format=raw&taf=true&hours=1`;
const wxCode=c=>`<span class="wx" data-icao="${esc(c)}" tabindex="0">${esc(c)}</span>`;
async function fetchWx(c){const k=WX_CACHE[c];if(k&&Date.now()-k.at<5*60e3)return k.data;const data=await WX_PROVIDER(c);WX_CACHE[c]={at:Date.now(),data};return data}
let wxEl=null,wxFor=null,wxHideT=null,wxTarget=null;
function fmtTaf(x){return esc(x).replace(/\s+(?=(FM\d{6}|BECMG|TEMPO|PROB\d{2}))/g,"\n  ")}
function wxBody(c,st){
  let body;
  if(st.loading)body=`<p class="muted">${t("wx_loading")}</p>`;
  else if(st.unsupported)body=`<p class="muted">${t("wx_here_only")}</p>`;
  else if(st.error)body=`<p class="muted">${t("wx_error")}</p>`;
  else{const d=st.data,cat={VFR:"ok",MVFR:"neutral",IFR:"warn",LIFR:"bad"}[d.fltCat]||"neutral",dec=wxMode()==="dec"&&typeof wxDecodedHtml==="function";
    const seg=(d.metar||d.taf)&&typeof wxdT==="function"?`<div class="seg wx-seg" role="group">${["raw","dec"].map(k=>`<button type="button" data-wx-mode="${k}" aria-pressed="${(k==="dec")===dec}">${esc(wxdT(k))}</button>`).join("")}</div>`:"";
    body=`<div class="wx-top">${d.fltCat?`<span class="chip ${cat}">${esc(d.fltCat)}</span>`:"<span></span>"}${seg}</div>
      ${dec?wxDecodedHtml(d):`<div class="wx-lab">METAR</div><pre class="wx-raw">${d.metar?esc(d.metar):t("wx_none")}</pre>
      <div class="wx-lab">TAF</div><pre class="wx-raw">${d.taf?fmtTaf(d.taf):t("wx_none")}</pre>`}
      ${d.metarTime?`<p class="muted" style="font-size:.75rem">${t("wx_updated",{t:fmt(new Date(d.metarTime).getTime())})}</p>`:""}`}
  const name=st.data&&st.data.name;
  return`<div class="wx-head"><strong class="mono">${esc(c)}</strong>${name?`<span class="muted" style="font-size:.85rem">${esc(name)}</span>`:""}</div>${body}<a class="wx-link" href="${wxLink(c)}" target="_blank" rel="noopener">aviationweather.gov ↗</a>`;
}
function wxMode(){try{return localStorage.getItem("vfr-wx-mode")==="dec"?"dec":"raw"}catch(e){return "raw"}}
let wxLast=null;
function placeWx(tg){if(!wxEl||!tg.isConnected)return;const r=tg.getBoundingClientRect(),w=Math.min(440,innerWidth-24);wxEl.style.width=w+"px";
  const left=Math.min(Math.max(12,r.left),innerWidth-w-12);let top=r.bottom+8;const h=wxEl.offsetHeight;if(top+h>innerHeight-12&&r.top-h-8>12)top=r.top-h-8;
  wxEl.style.left=left+"px";wxEl.style.top=Math.max(12,top)+"px"}
function showWx(tg,code){
  code=String(code||"").trim().toUpperCase();if(!/^[A-Z0-9]{4}$/.test(code))return;
  clearTimeout(wxHideT);
  if(!wxEl){wxEl=document.createElement("div");wxEl.className="wx-pop";wxEl.setAttribute("role","tooltip");wxEl.hidden=true;document.body.appendChild(wxEl);
    wxEl.addEventListener("mouseenter",()=>clearTimeout(wxHideT));wxEl.addEventListener("mouseleave",hideWxSoon)}
  if(wxFor===code&&!wxEl.hidden&&wxTarget===tg)return;
  wxFor=code;wxTarget=tg;wxEl.innerHTML=wxBody(code,{loading:true});wxEl.hidden=false;placeWx(tg);
  fetchWx(code).then(d=>{if(wxFor!==code)return;wxLast=d?{data:d}:{unsupported:true};wxEl.innerHTML=wxBody(code,wxLast);placeWx(tg)})
    .catch(()=>{if(wxFor!==code)return;wxEl.innerHTML=wxBody(code,{error:true});placeWx(tg)});
}
function hideWxSoon(){clearTimeout(wxHideT);wxHideT=setTimeout(hideWx,250)}
function hideWx(){if(wxEl)wxEl.hidden=true;wxFor=null;wxTarget=null}
function paintWxChips(){const el=$("#bk-wx");if(!el)return;
  const c=[$("#bk-dep").value,$("#bk-arr").value].map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z0-9]{4}$/.test(x));
  el.innerHTML=c.length?`<span>${t("wx_label")}</span>${c.map(wxCode).join("")}`:"";}
document.addEventListener("mouseover",e=>{
  const w=e.target.closest&&e.target.closest(".wx");if(w)return showWx(w,w.dataset.icao);
  if(e.target.id==="bk-dep"||e.target.id==="bk-arr")showWx(e.target,e.target.value);
});
document.addEventListener("mouseout",e=>{if((e.target.closest&&e.target.closest(".wx"))||e.target.id==="bk-dep"||e.target.id==="bk-arr")hideWxSoon()});
document.addEventListener("click",e=>{
  const w=e.target.closest&&e.target.closest(".wx");
  if(w){e.preventDefault();if(wxFor===w.dataset.icao&&wxEl&&!wxEl.hidden)hideWx();else showWx(w,w.dataset.icao);return}
  const mb=e.target.closest&&e.target.closest("[data-wx-mode]");
  if(mb&&wxEl&&wxEl.contains(mb)){e.preventDefault();e.stopPropagation();try{localStorage.setItem("vfr-wx-mode",mb.dataset.wxMode)}catch(x){}
    if(wxLast&&wxFor){const sc=wxEl.scrollTop;wxEl.innerHTML=wxBody(wxFor,wxLast);if(wxTarget)placeWx(wxTarget);wxEl.scrollTop=sc}return}
  if(wxEl&&!wxEl.hidden&&!wxEl.contains(e.target))hideWx();
},true);
document.addEventListener("focusin",e=>{const w=e.target.closest&&e.target.closest(".wx");if(w)showWx(w,w.dataset.icao)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&wxEl&&!wxEl.hidden)hideWx()});
document.addEventListener("input",e=>{if(e.target.id==="bk-dep"||e.target.id==="bk-arr")paintWxChips()});
window.addEventListener("scroll",e=>{if(wxEl&&!wxEl.hidden&&!(e.target instanceof Node&&wxEl.contains(e.target)))hideWx()},true);
const WX_PROVIDER=async c=>{const {data,error}=await sb.functions.invoke("wx",{body:{ids:[c]}});if(error)throw error;return (data&&data[c])||{metar:null,taf:null}};


/* ---------- SkyVector ---------- */
function decorateSkyVector(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode()){const node=walker.currentNode,p=node.parentElement;if(node.nodeValue.includes("SkyVector")&&p&&!p.closest('script,style,textarea,input,.skyvector-brand')&&!p.closest('a.ext-btn'))nodes.push(node)}
  for(const node of nodes){const fragment=document.createDocumentFragment(),parts=node.nodeValue.split("SkyVector");parts.forEach((part,i)=>{if(i){const brand=document.createElement("span");brand.className="skyvector-brand";const icon=document.createElement("img");icon.src="img/brand/skyvector-logo.png";icon.alt="";icon.width=64;icon.height=28;brand.append(icon,document.createTextNode("SkyVector"));fragment.append(brand)}fragment.append(document.createTextNode(part))});node.replaceWith(fragment)}
}
function skyvectorUrl(r){
  const a=acById(r.aircraftId),kt=CRUISE_KT[icaoType(a&&a.type)]||430;
  const lvl=kt>=400?"350":kt>=250?"240":"100";   // nível de cruzeiro típico: jato, turbo-hélice, monomotor
  return "https://skyvector.com/?fpl="+encodeURIComponent(`N${String(kt).padStart(4,"0")}F${lvl} ${r.dep} ${r.route?String(r.route).trim()+" ":""}${r.arr}`);
}
const svLink=(r,cls)=>`<a class="btn ${cls||""} ext-btn dispatch-link" href="${esc(skyvectorUrl(r))}" target="_blank" rel="noopener"><img class="skyvector-logo" src="img/brand/skyvector-logo.png" alt="" width="18" height="18">SkyVector ↗</a>`;


/* ---------- Apoie o projeto: Pix e outros links de doação ---------- */
const money=v=>new Intl.NumberFormat(LOCALE[lang],{style:"currency",currency:"BRL"}).format(Number(v)||0);
const monthName=m=>{const [y,mo]=m.split("-").map(Number);return new Intl.DateTimeFormat(LOCALE[lang],{month:"long",year:"numeric",timeZone:"UTC"}).format(Date.UTC(y,mo-1,1))};
const thisMonth=()=>{const d=new Date(Date.now()-3*H);return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")};
function pixTlv(id,v){return id+String(v.length).padStart(2,"0")+v}
function pixCrc(s){let c=0xFFFF;for(const ch of s){c^=ch.charCodeAt(0)<<8;for(let i=0;i<8;i++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}return c.toString(16).toUpperCase().padStart(4,"0")}
const pixAscii=(s,n)=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9 ]/g,"").toUpperCase().trim().slice(0,n);
function pixPayload(st){
  const key=String(st.pixKey||"").trim();if(!key)return"";
  let p=pixTlv("00","01")+pixTlv("26",pixTlv("00","br.gov.bcb.pix")+pixTlv("01",key))+pixTlv("52","0000")+pixTlv("53","986")+pixTlv("58","BR")+
    pixTlv("59",pixAscii(st.pixHolder,25)||"DOACAO")+pixTlv("60",pixAscii(st.pixCity,15)||"BRASIL")+pixTlv("62",pixTlv("05","***"))+"6304";
  return p+pixCrc(p);
}
let qrLib=null;
function loadQr(){if(window.QRCode)return Promise.resolve();if(qrLib)return qrLib;
  qrLib=new Promise((ok,no)=>{const s=document.createElement("script");s.src="vendor/qrcode.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)});return qrLib}
function paintPixQr(){const el=$("#pix-qr");if(!el)return;const code=el.dataset.code;if(!code)return;
  loadQr().then(()=>{if(!el.isConnected||el.dataset.done===code)return;el.innerHTML="";new QRCode(el,{text:code,width:184,height:184,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});el.dataset.done=code}).catch(()=>{el.textContent=""})}
async function copyText(txt,btn){
  try{await navigator.clipboard.writeText(txt);const o=btn.textContent;btn.textContent=t("sup_copied");setTimeout(()=>{if(btn.isConnected)btn.textContent=o},1800)}
  catch(e){const i=btn.parentElement.querySelector("input,textarea");if(i){i.focus();i.select()}}
}
function viewSupport(){
  const {settings:st,months}=getSupport();const admin=IS_ADMIN();
  const code=pixPayload(st),hasPix=!!code;
  const cur=thisMonth(),sorted=[...months].sort((a,b)=>b.month.localeCompare(a.month)),now=sorted.find(m=>m.month===cur);
  const pct=m=>Number(m.cost)>0?Math.min(999,Math.round(Number(m.raised)/Number(m.cost)*100)):null;
  const bar=m=>{const p=pct(m);return p===null?`<span class="chip ok">${t("sup_free")}</span>`:`<div class="covbar" title="${p}%"><span style="width:${Math.min(100,p)}%"></span></div><span class="mono" style="font-size:.85rem">${t("sup_covered",{p})}</span>`};
  const nowCard=now?(Number(now.cost)>0?`<div class="stats"><span><b>${money(now.cost)}</b>${t("sup_cost")}</span><span><b>${money(now.raised)}</b>${t("sup_raised")}</span><span><b>${pct(now)}%</b>${t("sup_cov_label")}</span></div><div class="covbar big"><span style="width:${Math.min(100,pct(now))}%"></span></div>${now.note?`<p class="muted" style="margin:0">${esc(now.note)}</p>`:""}`
      :`<div class="banner ok"><strong>${t("sup_zero")}</strong>${now.note?`<span>${esc(now.note)}</span>`:""}</div>`)
    :`<p class="muted" style="margin:0">${t("sup_no_month")}</p>`;
  const give=!hasPix&&DONATE.some(d=>goodUrl((st.links||{})[d.k]))?"":hasPix?`
    <div class="panel">
      <h3>${t("sup_give")}</h3>
      <div class="pix">
      <div id="pix-qr" class="pix-qr" data-code="${esc(code)}" aria-label="QR Code Pix"></div>
      <div class="pix-info">
        <div><span class="eyebrow">${t("sup_code")}</span><div class="row"><input id="pix-code" readonly value="${esc(code)}" class="mono"><button class="btn small primary" data-action="copy" data-copy="${esc(code)}">${t("sup_copy")}</button></div></div>
        <p class="hint" style="margin:0">${t("sup_paste_hint")}</p>
      </div></div>
    </div>`:`<div class="notice">${admin?t("sup_setup_admin"):t("sup_no_setup")}</div>`;
  const links=st.links||{},other=DONATE.filter(d=>goodUrl(links[d.k]));
  const otherHtml=other.length?`<div class="panel"><div><h3>${t("sup_other")}</h3><p class="hint" style="margin:4px 0 0">${t("sup_other_hint")}</p></div>
    <div class="don-grid">${other.map(d=>`<a class="don" href="${esc(links[d.k].trim())}" target="_blank" rel="noopener noreferrer"><span class="don-ic" style="background:${d.c};color:${d.ink||"#FFFFFF"}" aria-hidden="true">${d.i}</span><span class="don-tx"><b>${esc(d.n)}</b><span>${t("don_"+d.k)}</span></span><span class="don-go" aria-hidden="true">↗</span></a>`).join("")}</div></div>`:"";
  const hist=sorted.length?`<div class="scroll"><table><thead><tr><th>${t("sup_month")}</th><th>${t("sup_cost")}</th><th>${t("sup_raised")}</th><th>${t("sup_cov_label")}</th>${admin?"<th></th>":""}</tr></thead><tbody>
    ${sorted.slice(0,24).map(m=>`<tr><td>${esc(monthName(m.month))}${m.note?`<div class="muted" style="font-size:.8rem">${esc(m.note)}</div>`:""}</td><td class="mono">${money(m.cost)}</td><td class="mono">${money(m.raised)}</td><td><div class="row" style="gap:8px">${bar(m)}</div></td>${admin?`<td><button class="btn small" data-action="sup-edit" data-m="${esc(m.month)}">${t("sup_edit")}</button></td>`:""}</tr>`).join("")}</tbody></table></div>`:"";
  const adminHtml=admin?`
    <div class="panel"><div><span class="eyebrow">${t("sup_admin_eb")}</span><h3>${t("sup_admin")}</h3><p class="hint" style="margin:4px 0 0">${t("sup_admin_hint")}</p></div>
      <form id="f-sup">
        <div class="grid2"><label>${t("sup_key")}<input id="sp-key" maxlength="77" value="${esc(st.pixKey)}" placeholder="${t("sup_key_ph")}"></label>
        <label>${t("sup_holder")}<input id="sp-holder" maxlength="40" value="${esc(st.pixHolder)}"></label></div>
        <div class="grid2"><label>${t("sup_city")}<input id="sp-city" maxlength="40" value="${esc(st.pixCity)}" placeholder="Goiânia"></label>
        </div>
        <h3 style="margin:6px 0 0">${t("sup_other")}</h3><p class="hint" style="margin:0">${t("sup_links_hint")}</p>
        <div class="grid2">${DONATE.map(d=>`<label>${esc(d.n)}<input class="sp-link" data-k="${d.k}" type="url" inputmode="url" maxlength="300" value="${esc((st.links||{})[d.k]||"")}" placeholder="https://"></label>`).join("")}</div>
        <label>${t("sup_msg")} <span class="hint">${t("optional")}</span><textarea id="sp-msg" maxlength="600">${esc(st.message)}</textarea></label>
        <p class="form-err" id="sp-err" hidden></p>
        <div class="row"><button class="btn primary" type="submit">${t("sup_save")}</button></div>
      </form>
      </div>`:"";
  return`<div class="sec-head"><div><span class="eyebrow">${t("sup_eyebrow")}</span><h2>${t("sup_title")}</h2></div></div>
   <p style="margin:0;max-width:68ch">${st.message?esc(st.message):t("sup_body")}</p>
   <div class="sup-grid">${give}${otherHtml}</div>
   ${adminHtml}`;
}
function supFillMonth(m){const r=getSupport().months.find(x=>x.month===m);$("#sm-month").value=m;$("#sm-cost").value=r?Number(r.cost):0;$("#sm-raised").value=r?Number(r.raised):0;$("#sm-note").value=r?r.note||"":"";$("#f-month").scrollIntoView({block:"center"})}
async function submitSupport(form){
  const links={};for(const i of document.querySelectorAll(".sp-link")){const v=i.value.trim();if(!v)continue;if(!goodUrl(v))return err("#sp-err",t("sup_err_url",{n:DONATE.find(d=>d.k===i.dataset.k).n}));links[i.dataset.k]=v}
  const o={pixKey:$("#sp-key").value.trim(),pixHolder:$("#sp-holder").value.trim(),pixCity:$("#sp-city").value.trim(),links,message:$("#sp-msg").value.trim()};
  if(o.pixKey&&!o.pixHolder)return err("#sp-err",t("sup_err_holder"));
  await busy(form,async()=>{await SUP_SAVE_SETTINGS(o);toast(t("sup_saved"));render()});
}
async function submitMonth(form){
  const m={month:$("#sm-month").value,cost:Math.max(0,Number($("#sm-cost").value)||0),raised:Math.max(0,Number($("#sm-raised").value)||0),note:$("#sm-note").value.trim()};
  if(!/^\d{4}-\d{2}$/.test(m.month))return err("#sm-err",t("sup_err_month"));
  await busy(form,async()=>{await SUP_SAVE_MONTH(m);toast(t("sup_saved"));render()});
}

/* armazenamento da página de apoio: tabelas support_settings e support_months (só administradores alteram) */
let isAdmin=false,SUP={settings:{},months:[]};
const IS_ADMIN=()=>isAdmin;
async function loadSupport(){
  try{const [a,b]=await Promise.all([sb.from("support_settings").select("*").eq("id",1).maybeSingle(),sb.from("support_months").select("*").order("month",{ascending:false}).limit(60)]);
    if(a.error)throw a.error;if(b.error)throw b.error;const r=a.data||{};
    const lk=Object.assign({},r.links&&typeof r.links==="object"?r.links:{});if(r.apoia_url)lk.apoia=r.apoia_url;if(r.kofi_url)lk.kofi=r.kofi_url;
    SUP={settings:{pixKey:r.pix_key||"",pixHolder:r.pix_holder||"",pixCity:r.pix_city||"",links:lk,message:r.message||""},
      months:(b.data||[]).map(m=>({month:String(m.month).slice(0,7),cost:Number(m.cost),raised:Number(m.raised),note:m.note||""}))};
  }catch(e){console.error("support",e)}
}
const getSupport=()=>SUP;
async function SUP_SAVE_SETTINGS(o){const L=o.links||{},rest={};for(const k in L)if(k!=="apoia"&&k!=="kofi"&&L[k])rest[k]=L[k];
  const row={id:1,pix_key:o.pixKey,pix_holder:o.pixHolder,pix_city:o.pixCity,apoia_url:L.apoia||"",kofi_url:L.kofi||"",message:o.message,updated_at:new Date().toISOString(),links:rest};
  let r=await sb.from("support_settings").upsert(row);
  if(r.error&&/links/i.test(r.error.message||"")){delete row.links;r=await sb.from("support_settings").upsert(row);if(!r.error&&Object.keys(rest).length)toast(t("sup_links_sql"))}
  must(r);await loadSupport()}
/* outras formas de doação: o administrador cola o link de cada plataforma */
const DONATE=[{k:"paypal",n:"PayPal",c:"#003087",i:"P"},{k:"mercadopago",n:"Mercado Pago",c:"#00A1E4",i:"M"},{k:"livepix",n:"LivePix",c:"#7B2CF5",i:"L"},
  {k:"bmc",n:"Buy Me a Coffee",c:"#FFDD00",i:"☕",ink:"#000000"}];
const goodUrl=u=>/^https:\/\/[^\s"'<>]+\.[^\s"'<>]+$/i.test(String(u||"").trim());
async function SUP_SAVE_MONTH(m){must(await sb.from("support_months").upsert({month:m.month+"-01",cost:m.cost,raised:m.raised,note:m.note}));await loadSupport()}
async function SUP_DELETE_MONTH(m){must(await sb.from("support_months").delete().eq("month",m+"-01"));await loadSupport()}


/* ---------- Ilustração lateral do modelo da aeronave (desenho próprio, sem fotos) ---------- */
const LIVERY={GOL:["#FF6A13","#FF6A13"],"LATAM Brasil":["#1B0B6E","#E3134F"],LATAM:["#1B0B6E","#E3134F"],Azul:["#0A3C8C","#2E7DD7"],
  "TAP Air Portugal":["#00A859","#E30613"],Lufthansa:["#05164D","#FFAD00"],"Air France":["#002157","#E8112D"],KLM:["#00A1DE","#00A1DE"],"British Airways":["#075AAA","#EB2226"],Iberia:["#D7192D","#FFCC00"],Ryanair:["#073590","#F1C933"],easyJet:["#FF6600","#FF6600"],
  "American Airlines":["#36495A","#C30019"],"Delta Air Lines":["#C8102E","#003268"],"United Airlines":["#002244","#0033A0"],"Southwest Airlines":["#304CB2","#FFBF27"],"Alaska Airlines":["#01426A","#48A9C5"],JetBlue:["#003876","#0033A0"],"Air Canada":["#D22630","#D22630"],WestJet:["#00AAA5","#00AAA5"],"Aeroméxico":["#0B2343","#0B2343"],
  "Singapore Airlines":["#F99F1C","#1D2C6B"],"Cathay Pacific":["#006564","#006564"],ANA:["#13448F","#13448F"],"Japan Airlines":["#CC0000","#CC0000"],"Korean Air":["#00256C","#86C8EC"],"Thai Airways":["#5C2D91","#E3A72F"],Emirates:["#D71921","#B58A3C"],"Qatar Airways":["#5C0632","#5C0632"],
  "LATAM Chile":["#1B0B6E","#E3134F"],"LATAM Ecuador":["#1B0B6E","#E3134F"],Avianca:["#DA291C","#DA291C"],"Copa Airlines":["#0032A0","#C8A44D"],"Aerolíneas Argentinas":["#0A3D7C","#5BB6E5"],JetSMART:["#1B3D8F","#E5243B"],"Sky Airline":["#4B1F7A","#00B5E2"],
  Qantas:["#E40000","#E40000"],Jetstar:["#FF5115","#1A1A1A"],"Jetstar Japan":["#FF5115","#1A1A1A"],"Virgin Australia":["#E10A0A","#5A2D82"],"Air New Zealand":["#000000","#00A6C8"],"Fiji Airways":["#2D2926","#A07F5B"],
  "Ethiopian Airlines":["#078930","#FCDD09"],"EgyptAir":["#00265D","#C5A158"],"Royal Air Maroc":["#C8102E","#006233"],"South African Airways":["#00205B","#E03C31"],"Airlink":["#5B2C83","#E87722"],"FlySafair":["#002D72","#E4002B"],"Kenya Airways":["#C8102E","#1A1A1A"],"RwandAir":["#00A1DE","#FAD201"],"Air Algérie":["#D21034","#006233"],"Tunisair":["#E70013","#E70013"],"TAAG Angola":["#D21034","#1A1A1A"],"Air Mauritius":["#C8102E","#00A1DE"],"Air Peace":["#0033A0","#E4002B"],"Air Tanzania":["#00A3DD","#1EB53A"],"Air Côte d'Ivoire":["#F77F00","#009E60"],"Uganda Airlines":["#FCDC04","#D90000"]};
const PLANE_PAL={body:"var(--plane)",line:"var(--plane-line)",win:"var(--plane-win)",gear:"var(--plane-gear)",prop:"var(--plane-prop)",shadow:"var(--plane-shadow)"};
function planeSpec(type){
  const c=icaoType(type);
  const S={kind:"jet",len:228,h:22,wing:"low",eng:"mid",tt:false,wl:"sharklet",fin:1.25};
  const m={
    DH8D:{kind:"tprop",len:215,h:21,wing:"high",tt:true,fin:1.35},DH8C:{kind:"tprop",len:195,h:21,wing:"high",tt:true,fin:1.35},DHC6:{kind:"twinprop",len:170,h:22,wing:"high",fin:1.2},A318:{len:195},BCS1:{len:200,h:20,eng:"neo",wl:"none"},BCS3:{len:215,h:20,eng:"neo",wl:"none"},A343:{len:272,h:30,eng:"big",wl:"blended"},A346:{len:292,h:30,eng:"big",wl:"blended"},A388:{len:286,h:38,eng:"huge",wl:"fence"},B744:{len:282,h:34,eng:"big",wl:"blended"},B748:{len:298,h:34,eng:"huge",wl:"raked"},E170:{len:185,h:20,eng:"small",wl:"blended"},CRJX:{len:218,h:19,eng:"small",wl:"blended"},CRJ9:{len:210,h:19,eng:"small",wl:"blended"},
    A319:{len:206},A320:{len:220,eng:"small",wl:"fence"},A20N:{len:220,eng:"neo"},A321:{len:240,eng:"small",wl:"fence"},A21N:{len:240,eng:"neo"},
    B737:{len:205,eng:"small",wl:"blended"},B738:{len:228,eng:"small",wl:"blended"},B739:{len:236,eng:"small",wl:"blended"},B38M:{len:230,eng:"neo",wl:"split"},B39M:{len:238,eng:"neo",wl:"split"},
    A332:{len:250,h:30,eng:"big",wl:"blended"},A333:{len:262,h:30,eng:"big",wl:"blended"},A339:{len:262,h:30,eng:"huge",wl:"sharklet"},A359:{len:262,h:31,eng:"huge",wl:"curved"},A35K:{len:272,h:31,eng:"huge",wl:"curved"},
    B763:{len:250,h:28,eng:"big",wl:"blended"},B772:{len:266,h:32,eng:"huge",wl:"none"},B77W:{len:280,h:32,eng:"huge",wl:"raked"},B788:{len:250,h:30,eng:"huge",wl:"raked"},B789:{len:264,h:30,eng:"huge",wl:"raked"},B78X:{len:276,h:30,eng:"huge",wl:"raked"},
    E190:{len:205,h:20,eng:"small",wl:"blended"},E195:{len:215,h:20,eng:"small",wl:"blended"},E290:{len:205,h:20,eng:"neo",wl:"none"},E295:{len:220,h:20,eng:"neo",wl:"none"},E175:{len:195,h:20,eng:"small",wl:"blended"},
    AT76:{kind:"tprop",len:210,h:21,wing:"high",tt:true,fin:1.35},AT46:{kind:"tprop",len:190,h:21,wing:"high",tt:true,fin:1.35},
    C208:{kind:"single",len:170,h:22,wing:"high",fin:1.15},C408:{kind:"twinprop",len:185,h:24,wing:"high",fin:1.2},PC12:{kind:"single",len:178,h:20,wing:"low",tt:true,fin:1.3},C172:{kind:"single",len:150,h:20,wing:"high",fin:1.1},
    A338:{len:250,h:30,eng:"huge",wl:"sharklet"},B77L:{len:266,h:32,eng:"huge",wl:"raked"},B733:{len:200,eng:"small",wl:"none"},B734:{len:210,eng:"small",wl:"none"},B736:{len:192,eng:"small",wl:"blended"},E135:{len:180,h:18,eng:"small",wl:"none"},E145:{len:195,h:18,eng:"small",wl:"none"},F50:{kind:"tprop",len:200,h:21,wing:"high",fin:1.3}
  }[c]||{};
  return Object.assign(S,m);
}
function planeSvg(type,airline,P=PLANE_PAL){
  const s=planeSpec(type),[tail,accent]=LIVERY[airline]||["var(--accent)","var(--accent)"];
  const W=300,L=s.len,h=s.h,nx=(W-L)/2+(s.kind==="jet"?0:6),cy=46,top=cy-h/2,bot=cy+h/2;
  const EG={small:[0.15,0.42],mid:[0.16,0.48],neo:[0.165,0.56],big:[0.17,0.62],huge:[0.18,0.72]}[s.eng]||[0.16,0.5];
  const engBottom=s.kind==="jet"?cy+h*0.42+h*EG[1]*1.05:bot;
  const G=Math.max(bot+h*(s.kind==="jet"?0.5:0.45),engBottom+2)+6.6;
  const tx=nx+L*(s.kind==="jet"?0.78:0.74),ex=nx+L,o=[];
  const prop=s.kind!=="jet";
  // sombra no chão
  o.push(`<ellipse cx="${nx+L*0.48}" cy="${G+1.5}" rx="${L*0.42}" ry="2.2" fill="${P.shadow}"/>`);
  // trem de pouso
  const wheel=(x,y,r=3.3)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${P.gear}"/><circle cx="${x}" cy="${y}" r="${r*0.4}" fill="${P.body}"/>`;
  const leg=(x,y1)=>`<line x1="${x}" y1="${y1}" x2="${x}" y2="${G-3.3}" stroke="${P.gear}" stroke-width="1.8"/>`;
  const noseG=nx+(prop?h*1.0:h*1.25),mainG=nx+L*(s.wing==="high"?0.47:0.5);
  o.push(leg(noseG,bot-1),wheel(noseG,G-3.3));
  o.push(leg(mainG,bot-1),wheel(mainG-3.6,G-3.3),wheel(mainG+3.6,G-3.3));
  if(s.h>=28)o.push(wheel(mainG+10.5,G-3.3));
  // estabilizador horizontal (convencional)
  if(!s.tt)o.push(`<path d="M${ex-L*0.15},${top+h*0.30} L${ex-L*0.02},${top+h*0.18} L${ex+2},${top+h*0.18} L${ex-L*0.06},${top+h*0.36} Z" fill="${P.line}" opacity=".55"/>`);
  // deriva (cauda) com a cor da companhia
  const fH=h*s.fin, fb1=tx+L*0.02, ft1=ex-L*(prop?0.08:0.095), ft2=ex-L*0.012;
  o.push(`<path d="M${fb1},${top+0.5} L${ft1},${top-fH} L${ft2},${top-fH} L${ex},${top+h*0.08} Z" fill="${tail}"/>`);
  if(s.tt)o.push(`<path d="M${ft1-L*0.05},${top-fH+1} L${ft2+4},${top-fH-1.5} L${ft2+4},${top-fH+2} L${ft1-L*0.04},${top-fH+3.5} Z" fill="${tail}"/>`);
  // fuselagem
  const n1=prop?h*0.35:h*0.55, n2=prop?h*0.9:h*1.35;
  o.push(`<path d="M${nx},${cy+h*0.12} C${nx},${cy-h*0.28} ${nx+n1},${top} ${nx+n2},${top} L${tx},${top} L${ex},${top+h*0.06} L${ex},${top+h*0.30} L${tx},${bot} L${nx+n2*0.9},${bot} C${nx+n1*0.6},${bot} ${nx},${cy+h*0.42} ${nx},${cy+h*0.12} Z" fill="${P.body}" stroke="${P.line}" stroke-width="0.9"/>`);
  // faixa inferior (cheatline)
  o.push(`<path d="M${nx+n2*0.8},${bot-h*0.18} L${tx},${bot-h*0.18} L${tx+(ex-tx)*0.5},${top+h*0.62} L${tx+(ex-tx)*0.5},${top+h*0.70} L${tx},${bot-h*0.09} L${nx+n2*0.75},${bot-h*0.09} Z" fill="${accent}" opacity=".9"/>`);
  // janelas
  const wy=cy-h*0.10, step=s.h>=28?5.2:4.6;
  for(let x=nx+n2+8;x<tx-6;x+=step)o.push(`<rect x="${x}" y="${wy-1.4}" width="2.2" height="2.8" rx="1" fill="${P.win}"/>`);
  // portas
  o.push(`<rect x="${nx+n2+1}" y="${cy-h*0.30}" width="4.4" height="${h*0.62}" rx="1.2" fill="none" stroke="${P.line}" stroke-width=".7"/>`);
  if(!prop||s.len>200)o.push(`<rect x="${tx-9}" y="${cy-h*0.30}" width="4.4" height="${h*0.60}" rx="1.2" fill="none" stroke="${P.line}" stroke-width=".7"/>`);
  // para-brisa
  const c1=prop?nx+h*0.30:nx+h*0.55;
  o.push(`<path d="M${c1},${cy-h*0.10} L${c1+h*0.36},${cy-h*0.31} L${c1+h*0.78},${cy-h*0.31} L${c1+h*0.66},${cy-h*0.10} Z" fill="${P.win}"/>`);
  // asa
  if(s.wing==="low"){
    const wx=nx+L*0.36,wl=L*0.24;
    o.push(`<path d="M${wx},${cy+h*0.26} L${wx+wl},${cy+h*0.30} L${wx+wl*0.92},${cy+h*0.40} L${wx+wl*0.05},${cy+h*0.40} Z" fill="${P.line}" opacity=".75"/>`);
    const wt=wx+wl*0.86;
    if(s.wl==="sharklet")o.push(`<path d="M${wt},${cy+h*0.27} C${wt+2},${cy+h*0.05} ${wt+5},${cy-h*0.05} ${wt+9},${cy-h*0.12} L${wt+11},${cy-h*0.10} L${wt+8},${cy+h*0.28} Z" fill="${accent}"/>`);
    if(s.wl==="blended"||s.wl==="split")o.push(`<path d="M${wt},${cy+h*0.27} L${wt+7},${cy-h*0.10} L${wt+10},${cy-h*0.10} L${wt+8},${cy+h*0.28} Z" fill="${accent}"/>`);
    if(s.wl==="split")o.push(`<path d="M${wt+2},${cy+h*0.36} L${wt+6},${cy+h*0.56} L${wt+8},${cy+h*0.55} L${wt+7},${cy+h*0.36} Z" fill="${accent}"/>`);
    if(s.wl==="fence")o.push(`<path d="M${wt+3},${cy+h*0.18} L${wt+8},${cy+h*0.18} L${wt+8},${cy+h*0.42} L${wt+3},${cy+h*0.42} Z" fill="${accent}"/>`);
    if(s.wl==="curved")o.push(`<path d="M${wt},${cy+h*0.27} C${wt+3},${cy-h*0.02} ${wt+7},${cy-h*0.10} ${wt+12},${cy-h*0.14} L${wt+9},${cy+h*0.28} Z" fill="${accent}"/>`);
    if(s.kind==="jet"){
      const el=L*EG[0],eh=h*EG[1],exx=nx+L*0.30,ey=cy+h*0.42+eh*0.55;
      o.push(`<path d="M${exx+el*0.45},${cy+h*0.32} L${exx+el*0.85},${cy+h*0.32} L${exx+el*0.7},${ey-eh*0.3} L${exx+el*0.4},${ey-eh*0.3} Z" fill="${P.line}" opacity=".7"/>`);
      o.push(`<rect x="${exx}" y="${ey-eh/2}" width="${el}" height="${eh}" rx="${eh*0.45}" fill="${accent}"/>`);
      o.push(`<ellipse cx="${exx+1.6}" cy="${ey}" rx="1.8" ry="${eh*0.42}" fill="${P.line}"/>`);
      o.push(`<path d="M${exx+el},${ey-eh*0.30} L${exx+el+L*0.03},${ey-eh*0.12} L${exx+el+L*0.03},${ey+eh*0.12} L${exx+el},${ey+eh*0.30} Z" fill="${P.gear}"/>`);
    }else{ // monomotor asa baixa (PC-12)
    }
  }else{
    const wx=nx+L*(s.kind==="single"?0.30:0.34),wl=L*0.24;
    o.push(`<path d="M${wx},${top-1.5} L${wx+wl},${top-0.8} L${wx+wl*0.95},${top+2.2} L${wx+wl*0.02},${top+2.2} Z" fill="${P.line}" opacity=".8"/>`);
    if(s.kind==="single")o.push(`<line x1="${wx+wl*0.4}" y1="${top+2}" x2="${wx-2}" y2="${bot-2}" stroke="${P.line}" stroke-width="1.3"/>`);
    if(s.kind==="tprop"||s.kind==="twinprop"){
      const ax=nx+L*(s.kind==="tprop"?0.31:0.30),al=L*0.16,ah=h*0.42,ay=top+ah*0.5+1;
      o.push(`<rect x="${ax}" y="${ay-ah/2}" width="${al}" height="${ah}" rx="${ah*0.4}" fill="${accent}"/>`);
      o.push(`<ellipse cx="${ax-1.5}" cy="${ay}" rx="1.4" ry="${h*0.95}" fill="${P.prop}"/><circle cx="${ax-1}" cy="${ay}" r="2.2" fill="${P.gear}"/>`);
      if(s.kind==="tprop")o.push(`<path d="M${nx+L*0.40},${bot-2} L${nx+L*0.58},${bot-2} L${nx+L*0.56},${bot+3.5} L${nx+L*0.42},${bot+3.5} Z" fill="${P.body}" stroke="${P.line}" stroke-width=".8"/>`);
    }
  }
  // hélice no nariz (monomotores)
  if(s.kind==="single"){o.push(`<ellipse cx="${nx-2}" cy="${cy+h*0.08}" rx="1.6" ry="${h*1.05}" fill="${P.prop}"/><path d="M${nx-1},${cy+h*0.08-3} L${nx-6},${cy+h*0.08} L${nx-1},${cy+h*0.08+3} Z" fill="${tail}"/>`)}
  return`<svg viewBox="0 ${top-h*s.fin-6} ${W} ${G+6-(top-h*s.fin-6)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(type)}">${o.join("")}</svg>`;
}
const PLANE_MEMO={};

/* ---------- Foto real da aeronave (Planespotters.net) ---------- */
// Regras do Planespotters: imagem carregada direto do endereço deles, crédito visível ao lado e link para a página da foto.
const PHOTO_MEMO={};
function photoHtml(p,a){return`<a class="ac-photo" href="${esc(p.link)}" target="_blank"><img src="${esc(p.src)}" alt="${esc(a.registration)} · ${esc(a.type)}" loading="lazy"></a><span class="credit">${esc(t("photo_by",{n:p.by||"Planespotters.net"}))}</span>`}
function drawingHtml(a,cls){const k=a.type+"|"+a.airline;return PLANE_MEMO[k]||(PLANE_MEMO[k]=planeSvg(a.type,a.airline))}
const planeImg=(a,cls)=>{if(!a)return"";const p=PHOTO_ENABLED?PHOTO_MEMO[a.registration]:null;
  const link=!PHOTO_ENABLED&&(cls==="big"||cls==="form")?`<a class="photo-link" href="https://www.planespotters.net/search?q=${encodeURIComponent(a.registration)}" target="_blank">${esc(t("photo_link",{reg:a.registration}))}</a>`:"";
  return`<div class="ac-img ${cls||""}" data-reg="${esc(a.registration)}"${p===undefined&&PHOTO_ENABLED?"":` data-ph="1"`}>${p?photoHtml(p,a):drawingHtml(a,cls)}${link}</div>`};
const PHOTO_ENABLED=true;
const PHOTO_TTL=24*3600e3;
function savePhotoCache(){try{const now=Date.now(),o={};for(const k in PHOTO_MEMO)o[k]={at:PHOTO_AT[k]||now,p:PHOTO_MEMO[k]};localStorage.setItem("vfr-photos",JSON.stringify(o))}catch(e){}}
const PHOTO_AT={},PHOTO_Q=[];let photoBusy=0;
(function(){try{const c=JSON.parse(localStorage.getItem("vfr-photos")||"{}");const now=Date.now();for(const k in c)if(now-c[k].at<PHOTO_TTL){PHOTO_MEMO[k]=c[k].p;PHOTO_AT[k]=c[k].at}}catch(e){}})();
function getPhoto(reg){
  if(PHOTO_MEMO[reg]!==undefined)return Promise.resolve(PHOTO_MEMO[reg]);
  return new Promise(res=>{PHOTO_Q.push([reg,res]);pumpPhotos()});
}
function pumpPhotos(){
  while(photoBusy<3&&PHOTO_Q.length){const [reg,res]=PHOTO_Q.shift();
    if(PHOTO_MEMO[reg]!==undefined){res(PHOTO_MEMO[reg]);continue}
    photoBusy++;
    fetch("https://api.planespotters.net/pub/photos/reg/"+encodeURIComponent(reg)).then(r=>r.ok?r.json():null).then(j=>{
      const ph=j&&Array.isArray(j.photos)&&j.photos[0];
      const p=ph?{src:(ph.thumbnail_large||ph.thumbnail||{}).src,link:ph.link,by:ph.photographer||""}:null;
      PHOTO_MEMO[reg]=p&&p.src&&/^https:\/\//.test(p.src)&&/^https:\/\//.test(p.link||"")?p:null;PHOTO_AT[reg]=Date.now();savePhotoCache();res(PHOTO_MEMO[reg]);
    }).catch(()=>res(null)).finally(()=>{photoBusy--;pumpPhotos()});
  }
}
let photoIO=null;
function hydratePhotos(){
  const els=document.querySelectorAll(".ac-img[data-reg]:not([data-ph])");if(!els.length)return;
  const go=el=>{el.dataset.ph="1";const reg=el.dataset.reg;getPhoto(reg).then(p=>{const a=acById(reg);if(p&&a&&el.isConnected)el.innerHTML=photoHtml(p,a)})};
  if(typeof window.IntersectionObserver!=="function"){els.forEach(go);return}
  if(!photoIO)photoIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){photoIO.unobserve(e.target);go(e.target)}}),{rootMargin:"200px"});
  els.forEach(el=>photoIO.observe(el));
}


/* ---------- Manual do piloto (dentro do app) ---------- */
const MANUAL={
pt:{toc:[["m-ciclo","Como funciona"],["m-inicio","Primeiros passos"],["m-escala","Escala"],["m-reservar","Programação"],["m-antes","Antes do voo"],["m-rastreio","Voo rastreado"],["m-reporte","Após o pouso"],["m-frota","Frota"],["m-manut","Manutenção automática"],["m-oper","Operação realista"],["m-mapa","Mapa e detalhes do voo"],["m-brief","Briefing, ADC e NOTAMs"],["m-redes","IVAO e VATSIM"],["m-diario","Diário, salário e catálogo"],["m-apoie","Apoie"],["m-faq","Perguntas frequentes"]],
body:`
<p class="muted manual-updated">Atualizado em 22/10/2026.</p>
<section id="m-ciclo"><h3>Como o Virtual Flight Report funciona</h3>
<p><b>Cada voo deixa sua marca.</b> O Virtual Flight Report é um livro técnico compartilhado: cada aeronave é identificada pela matrícula, e todo piloto que a voa, no MSFS ou no X-Plane, registra o que aconteceu com ela. O próximo piloto encontra a aeronave exatamente como o anterior a deixou.</p>
<div class="cycle"><span class="cy-step">Gerar a escala</span><span class="cy-arrow">→</span><span class="cy-step">Revisar o livro técnico</span><span class="cy-arrow">→</span><span class="cy-step">Voar no simulador</span><span class="cy-arrow">→</span><span class="cy-step strong">Reportar o voo</span></div>
<div class="cycle out"><span class="chip ok">Falha corrigida: segue disponível</span><span class="chip warn">Diferida (MEL): voa com restrição</span><span class="chip bad">No solo: liberada após o reparo</span></div>
<p class="muted">Cada falha já traz a sua consequência: o app decide sozinho, pela falha escolhida, se a aeronave segue disponível, voa com restrição ou fica no solo, e por quanto tempo.</p></section>

<section id="m-inicio"><h3>Primeiros passos</h3>
<p>Você precisa de uma conta de piloto, criada uma única vez, e ela vale em todos os aparelhos.</p>
<ol><li>Abra <b>flyvfr.com.br</b> e toque em <b>Entrar</b>.</li><li>Toque em <b>Piloto novo? Crie uma conta</b>.</li><li>Informe o <b>nome do piloto</b> (nome ou indicativo que os outros vão ver), o <b>e-mail</b>, os <b>simuladores que você usa</b> e uma <b>senha</b> de pelo menos 6 caracteres. Para mudar os simuladores depois, toque em <b>Perfil</b>, ao lado do seu nome.</li><li>Toque em <b>Criar conta</b>. Nas próximas vezes, use <b>Entrar</b>.</li></ol>
<p>Ao entrar, o app abre em <b>Programação</b> se você já tiver uma escala aceita; senão, abre em <b>Escala</b>. No computador, o menu lateral mostra os ícones e se expande ao passar o mouse para exibir os nomes. O menu segue a ordem do dia a dia do piloto: Escala, Sala de briefing (habilitada com escala aceita), Reservas, Frota, Mapa, Eventos, Diário de bordo, Catálogo, Manual e Apoie.</p>
<div class="scroll"><table><thead><tr><th>Aparelho</th><th>Como instalar</th></tr></thead><tbody>
<tr><td>PC (Chrome ou Edge)</td><td><b>Instalar app</b> no topo da página ou no ícone de instalação da barra de endereço</td></tr>
<tr><td>Android</td><td>No Chrome: menu ⋮ → <b>Instalar app</b> (ou o arquivo <b>VirtualFlightReport.apk</b>, se o administrador enviar)</td></tr>
<tr><td>iPhone ou iPad (Safari)</td><td><b>Compartilhar</b> → <b>Adicionar à Tela de Início</b></td></tr></tbody></table></div>
<p>Em <b>Ajustes</b> (no menu) você escolhe o idioma pelas bandeiras (português, inglês, espanhol, francês, alemão, japonês, chinês ou coreano), o tema de cores e a posição do menu. O botão <b>DAY MODE / NIGHT MODE</b> alterna entre página clara e escura. As escolhas ficam salvas no aparelho. As melhorias do app chegam sozinhas no PC e no celular, sem reinstalar. Para sair, toque em <b>Sair</b>, ao lado do seu nome.</p></section>

<section id="m-escala"><h3>Escala de voos</h3>
<p>Escolha uma das duas opções no menu <b>Escala</b>:</p>
<ul><li><b>Voo livre:</b> escolha o aeródromo de origem, a companhia e a aeronave, sem depender de uma saída RPL.</li><li><b>Voos RPL:</b> consulte as saídas entre <b>30 e 90 minutos a partir de agora</b>. O RPL contempla voos domésticos dentro do Brasil e internacionais que saem ou chegam ao Brasil. Ao selecionar um voo, escolha uma aeronave elegível da companhia e do modelo compatível com o RPL.</li><li><b>Sem opção RPL elegível:</b> se não houver voo com aeronave elegível, ou não houver RPL cadastrado para o aeródromo, a escolha de companhia e aeronave fica livre.</li><li><b>Favoritas:</b> as aeronaves favoritadas têm prioridade na seleção de companhia e aeronave, tanto no voo livre quanto no RPL.</li></ul>
<p>Defina a primeira saída, a duração de 1 a 4 dias e a quantidade de voos por dia. Cada trecho começa onde o anterior termina. O gerador considera tempos de solo, jornada e descanso; confira a sequência antes de aceitar.</p>
<p>Você pode gerar novas opções antes do aceite. Ao tocar em <b>Aceitar escala</b>, confirme os voos: <b>a escala aceita não pode ser alterada</b>. O aceite libera o briefing e os botões SimBrief e SkyVector para cada voo.</p>
<p><b>ADS-B é apenas consulta.</b> A seção de aeronaves no solo informa a origem dos dados e a atualização. Ela não altera disponibilidade, escolha da aeronave, posição operacional no app nem escala; a presença de um avião real não determina o voo que será gerado.</p>
<p>Veja os cartões e avisos de cada voo em <b>Programação</b>. Voos concluídos ou cancelados não reabrem a tabela operacional da escala.</p><p><b>Atraso (DLA) e não comparecimento:</b> a EOBT (horário previsto de saída do calço) aparece no cartão do voo em Sua programação. Se for se atrasar, toque em <b>Atraso (DLA)</b> e escolha a nova EOBT: é <b>uma DLA por voo</b>, apresentada até <b>35 min depois da EOBT prevista</b>, com a nova EOBT em <b>no máximo 45 min a partir do momento em que a DLA é apresentada</b>. Os voos seguintes da mesma jornada atrasam o mesmo tempo. A propagação para no pernoite, preservando os horários da jornada seguinte. Se o voo rastreado não for iniciado até <b>45 min depois da EOBT em vigor</b>, o voo é cancelado e o aviso aparece em Reservas. Depois de passada a EOBT, o cartão mostra em vermelho o horário-limite.</p></section>

<section id="m-reservar"><h3>Programação dos voos</h3>
<p>A aba <b>Programação</b> reúne os resumos dos voos e o calendário. Toque em <b>Preparar voo</b> para abrir o voo selecionado na aba <b>Voo</b> da Sala de briefing. Ali ficam o painel completo, a alternativa, o diário de bordo, o atraso (DLA), o rastreamento, o reporte e os botões SimBrief e SkyVector. As ações dos voos seguintes continuam condicionadas à conclusão do voo anterior; o cancelamento automático por não comparecimento também libera a etapa seguinte.</p>
<div class="scroll"><table><thead><tr><th>No cartão</th><th>O que significa</th></tr></thead><tbody>
<tr><td><span class="chip ok">✓ Nenhum item aberto no diário de bordo</span></td><td>Pisca uma vez para avisar. Não há nada a assinar: os botões <b>Voo rastreado</b> e <b>Reportar voo</b> já ficam liberados</td></tr>
<tr><td><span class="chip warn">⚠ Revisar livro técnico</span></td><td>Fica piscando: a aeronave tem item aberto. Toque, veja os itens e assine (veja <b>Antes do voo</b>)</td></tr>
<tr><td><span class="chip ok">✓ Livro técnico revisado</span></td><td>Você já assinou; pode voar</td></tr></tbody></table></div>
<ul><li><b>SimBrief</b> e <b>SkyVector</b>: botões com o ícone de cada site, à direita, abrem o planejamento do respectivo voo. O SimBrief recebe também a identificação da aeronave e a EOBT; o SkyVector recebe a rota e estimativas de cruzeiro.</li><li><b>METAR e TAF:</b> passe o mouse sobre o código do aeroporto (no celular, toque). Toque em <b>Decodificado</b> para ler o boletim em linguagem comum (vento, visibilidade, nuvens, temperatura, pressão e cada período do TAF); <b>Original</b> volta ao texto do boletim. O app lembra a sua escolha.</li></ul>
<p>As reservas dos voos da escala são criadas no aceite. Use os cartões para revisar o livro técnico, acompanhar o rastreio e reportar o voo. Ações administrativas e de eventos dependem das opções liberadas na conta.</p></section>

<section id="m-antes"><h3>Antes do voo</h3>
<p>Antes de voar, confira o botão do livro técnico no cartão do voo:</p>
<ul><li><b>Sem itens abertos</b> (botão verde): não é preciso assinar. Basta tocar em <b>Voo rastreado</b> ou <b>Reportar voo</b>.</li><li><b>Com item aberto</b> (botão amarelo piscando): toque em <b>Revisar livro técnico</b>, leia os itens abertos e os últimos reportes, marque a confirmação e toque em <b>Assinar livro técnico</b>. O botão fica verde, com <b>Livro técnico revisado</b>. Sem essa assinatura, o rastreio e o reporte não são aceitos.</li><li>Se outro piloto reportar um defeito nessa matrícula depois da sua assinatura, o botão amarelo volta a aparecer e é preciso assinar de novo.</li></ul>
<p>Uma falha não passa de um simulador para outro. Por isso, cada item diferido traz um <b>procedimento para a próxima tripulação</b>, que você segue no seu voo. Exemplo: <i>APU não dá partida</i> → peça GPU e ar externo no solo.</p></section>

<section id="m-rastreio"><h3>Voo rastreado</h3>
<p>O <b>rastreamento validado</b> é o caminho normal para registrar o voo e contabilizar horas, patente, salário e ranking. O app lê o simulador, envia a trilha e o servidor confere o resultado. Sem rastreio validado, use a solicitação de análise quando disponível: o administrador decide, sem conclusão do voo ou recompensas antes da aprovação.</p>
<ol><li>No cartão do voo, em <b>Sua programação</b>, toque em <b>✈ Voo rastreado</b> (fica disponível a partir de 1 h antes do horário; se houver item aberto, assine antes o livro técnico).</li>
<li>Com a aeronave parada no portão do aeroporto de partida, toque em <b>Conectar ao simulador</b>.<ul>
<li><b>MSFS 2020/2024:</b> instale o <a href="https://fsuipc.com" target="_blank" rel="noopener">FSUIPC7</a> (a versão gratuita basta) e o <a href="http://fsuipcwebsockets.paulhenty.com/" target="_blank" rel="noopener">FSUIPC WebSocket Server</a> e deixe os dois abertos com o simulador.</li>

<li><b>X-Plane 12</b> (12.1.4 ou mais novo): não precisa instalar nada.</li>
<li><b>X-Plane 11:</b> plugin XPUIPC + FSUIPC WebSocket Server.</li>
<li>Use Chrome ou Edge no mesmo computador do simulador. Se o navegador pedir acesso à rede local, permita.</li></ul></li>
<li>Voe normalmente e deixe a aba aberta. A tela <b>Voo ao vivo</b> mostra fase, altitude, velocidade, razão e distância até o destino; dá para usar outras telas do app enquanto isso.</li>
<li>Depois do pouso, estacione e pare a aeronave. Toque em <b>Encerrar voo</b>: o servidor confere a trilha e mostra o resultado. Em seguida preencha o relatório (falhas e observações); o tempo de calço e o aeroporto de chegada já vêm do rastreio.</li></ol>
<p>O servidor recusa o voo se: ele não começar no solo no aeroporto de partida · não terminar parado num aeroporto · houver aceleração do tempo ou slew · a aeronave saltar de posição (teletransporte ou mudança pelo mapa) · o rastreio ficar mais de 10 min interrompido no ar · a trilha não chegar ao servidor em tempo real · o voo durar menos de 5 min no ar. Pausar pode: o tempo em pausa é descontado. Desvio é aceito: a aeronave fica onde pousou.</p></section>

<section id="m-reporte"><h3>Após o pouso: reportar o voo</h3><p>Com rastreio validado, tempo de calço e chegada vêm dos dados confirmados. Sem essa validação, a solicitação segue para análise; não envie reportes aleatórios ou duplicados. Não há botão para preencher o reporte com o plano do SimBrief. O piloto não pode aprovar o próprio reporte.</p>
<ol><li>Toque em <b>Reportar voo</b>.</li><li>Escolha o <b>simulador</b> (aparecem só os seus; para outro, escolha <b>Outro simulador…</b>) e informe o <b>tempo de calço</b> (h:mm, ex.: <code>1:45</code>).</li><li>Para cada falha, toque em <b>Adicionar falha</b>; se nada aconteceu, não adicione nenhuma.</li><li>Toque em <b>Enviar reporte e encerrar a reserva</b>.</li></ol>
<p>O campo de falha mostra as <b>mais reportadas pelas tripulações</b>. Comece a digitar e a lista filtra: aceita os idiomas disponíveis, ignora acentos e entende siglas como <code>freio</code>, <code>porta</code>, <code>APU</code>, <code>ata 32</code> ou <code>ECAM</code>. Se não estiver no catálogo, escolha <b>Não está na lista: descrever</b>.</p>
<p>O piloto não escolhe a ação nem o tempo: eles vêm da falha escolhida no catálogo. Para falhas fora do catálogo, o app usa o padrão mais comum do capítulo ATA informado.</p><div class="scroll"><table><thead><tr><th>Consequência</th><th>Efeito na aeronave</th></tr></thead><tbody>
<tr><td><span class="chip ok">Corrigida pela tripulação</span></td><td>Nenhum; fica só no histórico</td></tr>
<tr><td><span class="chip warn">Diferida (MEL)</span></td><td>Voa com restrição até o prazo (Cat B 3 dias, Cat C 10 dias, Cat D 120 dias); depois fica no solo pelo tempo de reparo</td></tr>
<tr><td><span class="chip bad">Aeronave no solo</span></td><td>Indisponível pelo tempo médio de reparo, contado a partir do reporte</td></tr></tbody></table></div></section>

<section id="m-frota"><h3>Frota</h3>
<p>A aba <b>Frota</b> mostra um cartão por matrícula, com foto, tipo, companhia e situação. As aeronaves no solo e com restrição aparecem primeiro.</p>
<div class="scroll"><table><thead><tr><th>Situação</th><th>O que significa</th><th>Pode reservar?</th></tr></thead><tbody>
<tr><td><span class="pill ok">Disponível</span></td><td>Nenhum item aberto no livro técnico</td><td>Sim</td></tr>
<tr><td><span class="pill warn">Com restrição</span></td><td>Item diferido (MEL); a aeronave voa seguindo o procedimento indicado</td><td>Sim, simulando a restrição</td></tr>
<tr><td><span class="pill bad">AOG</span></td><td>No solo para manutenção; o cartão mostra quando volta</td><td>Só depois da liberação</td></tr></tbody></table></div>
<ul><li><b>Filtrar:</b> escolha a região (América do Sul e Central — inclui o Brasil —, Europa, América do Norte, Ásia e Oriente Médio, Oceania ou Outras); aparecem então as companhias daquela região. Também dá para filtrar pela situação.</li><li><b>Favoritas:</b> toque na estrela do cartão (ou no livro técnico) para favoritar. As favoritas aparecem primeiro, têm um filtro próprio e ficam no topo da lista ao reservar; valem em todos os seus aparelhos.</li><li><b>Buscar:</b> digite parte da matrícula ou do tipo, como <code>YSF</code> ou <code>737</code>.</li><li><b>Mais aeronaves:</b> toque em <b>Mostrar mais</b> no fim da lista.</li><li><b>Cadastrar:</b> toque em <b>Adicionar aeronave</b> e informe matrícula, tipo, companhia e base opcional.</li></ul>
<p>Toque num cartão para abrir o <b>livro técnico</b> da matrícula: situação, itens abertos e procedimentos, manutenções programadas, horas de célula, ciclos e todas as páginas de voo. As fotos vêm do Planespotters.net, com o nome do fotógrafo; matrículas sem foto mostram uma ilustração do modelo.</p></section>

<section id="m-manut"><h3>Manutenção automática</h3>
<ul><li>Quando o tempo de reparo termina, a aeronave volta a <b>Disponível</b> sozinha.</li><li>O tempo conta em horas reais a partir do reporte; paradas que se emendam somam.</li><li>MEL vencida deixa a aeronave no solo pelo tempo de reparo do item.</li><li>Reservas dentro de uma nova parada são canceladas, com aviso no topo do app; as posteriores continuam valendo. O piloto afetado recebe na hora a lista de aeronaves do <b>mesmo modelo ou da mesma família</b> (ex.: família A320, 737 NG/MAX, E-Jets) livres no mesmo horário; um toque abre a reserva já preenchida com a mesma rota, horário e duração.</li></ul></section>

<section id="m-oper"><h3>Operação realista</h3>
<p><b>Posição da aeronave no app.</b> O histórico dos voos e as reservas do sistema são distintos da posição observada por ADS-B. Consulte os avisos do voo e o livro técnico; dados ADS-B não reposicionam a aeronave nem obrigam um traslado.</p>

<p><b>Desvios.</b> A chegada efetiva deve corresponder ao voo realizado e aos dados de rastreio/reporte. Confira os avisos das reservas afetadas e não confunda um desvio no simulador com uma observação ADS-B.</p>
<p><b>Checks programados.</b> A cada 120 horas de voo ou 100 ciclos a aeronave faz um check A (8 horas no solo); a cada 1.200 horas, um check C (48 horas). O check é criado sozinho quando o voo que completa o limite é fechado, e reservas que caírem nesse período são canceladas com oferta de outra aeronave. O livro técnico mostra quanto falta para o próximo.</p>
<p><b>SimBrief.</b> Em <b>Perfil</b> (ao lado do seu nome), informe seu usuário ou Pilot ID do SimBrief. Depois, "Importar do SimBrief" na reserva traz aeronave, rota, horário, duração e número do voo do seu último plano. No reporte, o tempo de calço é preenchido automaticamente quando o rastreamento é validado.</p>



<p><b>Eventos.</b> Na aba Eventos aparecem os voos em grupo publicados pelo administrador. Toque em "Reservar aeronave para este evento": as aeronaves que estarão no aeroporto de saída aparecem primeiro.</p>
<p><b>Avisos.</b> O sino no topo avisa quando sua reserva está chegando, quando a aeronave reservada recebeu um reporte novo, quando a reserva foi cancelada por manutenção, quando falta fechar um voo, e sobre eventos e conquistas. Em "Avisos neste aparelho" você ativa também as notificações do sistema, que aparecem enquanto o app estiver aberto ou em segundo plano.</p>
<p><b>Carreira.</b> No Diário de bordo você vê sua patente (de Cadete a Comandante Master, pelas horas voadas) e suas conquistas. Patentes são só reconhecimento: qualquer piloto pode voar qualquer aeronave.</p></section>

<section id="m-mapa"><h3>Mapa e informações do voo</h3>
<p>O mapa prioriza a rota do <b>seu voo ativo</b>. Sem voo ativo, usa o último despacho disponível do SimBrief, se o usuário/Pilot ID estiver configurado no Perfil. Isso não altera a escala aceita. A escolha de outro despacho não substitui um voo ativo. Sem navlog detalhado, a ligação entre origem e destino é uma referência direta, não uma rota de navegação validada.</p>
<p>A lateral do mapa contém <b>apenas os voos rastreados</b>. As estatísticas, exploração de aeroportos e saídas RPL não aparecem mais nesse painel. As camadas do canto superior direito permitem escolher mapas de fundo, tráfego, controladores e demais sobreposições. As cartas brasileiras DECEA têm seletor de tipo/folha e opacidade; confira sempre a edição oficial.</p>
<p><b>Passe o mouse e clique na aeronave</b> para abrir o balão de informações (no celular, toque). O cabeçalho destaca o indicativo e, quando a companhia é identificável, mostra seu ícone. A matrícula aparece nas cores da companhia quando há correspondência. Altitude, velocidade sobre o solo (GS), rumo (HDG), posição, fonte e demais dados disponíveis aparecem separados por grupos.</p>
<p>As fontes são distintas: <b>FlyVFR rastreado</b> vem do simulador; <b>IVAO/VATSIM</b> vêm dos feeds das redes; <b>ADS-B</b> é uma observação de aeronave real. Uma posição estimada pelo horário da reserva é identificada como estimativa, não telemetria. O balão tem rolagem quando necessário; campos ausentes não são inventados. ADS-B é apenas consulta e não altera disponibilidade, escolha de aeronave ou escala.</p></section>
<section id="m-brief"><h3>Sala de briefing, ADC e NOTAMs</h3>
<p>Após aceitar a escala, escolha um voo no briefing. Consulte METAR/TAF (original ou decodificado), NOTAMs e informações meteorológicas da rota. Informe a <b>alternativa</b> e sua <b>ETA</b> quando necessário. Sem ETA específica da alternativa, o app considera a ETA do destino e informa essa referência. A alternativa e sua ETA são preferências deste voo no aparelho, sem alterar a reserva.</p>
<p>Na ADC, somente <b>partida, destino e alternativa</b> do voo selecionado entram na avaliação. A partida usa EOBT; destino e alternativa usam suas ETAs. Se um aeródromo exercer mais de um papel, são considerados os horários correspondentes. NOTAMs futuros, vencidos, cancelados ou substituídos não recebem destaque ativo; agendas não interpretadas ficam para conferência.</p>
<p><b>A carta ADC só fica habilitada nas camadas do mapa quando há NOTAM com validade confirmada para aquele voo e dados recentes.</b> Sem aviso aplicável, ou com fonte indisponível/desatualizada, a carta é retirada da visualização e das camadas. Isso não declara o aeródromo livre de restrições. Não há botão separado “Ver carta”. Use o seletor do aeródromo e as camadas do mapa.</p>
<ul><li><b>Fechamento integral de pista:</b> destaque apenas quando o texto, o par de cabeceiras e a geometria verificada permitem a associação.</li><li><b>Coordenadas no texto:</b> aparecem como pontos, inclusive fora da imagem da ADC. Um perímetro explicitamente delimitado, válido e sem ambiguidades pode aparecer como área tracejada; listas de obstáculos não são ligadas automaticamente.</li><li><b>Referências verificadas:</b> marcadores de taxiway ou equipamento identificam uma referência da carta, não necessariamente a posição exata. Barra de parada indisponível não significa taxiway fechada.</li><li><b>Aviso geral:</b> sem posição precisa, os avisos ativos ficam reunidos no marcador identificado como “sem posição precisa”. Ele usa a referência do aeródromo e não representa a área afetada.</li><li><b>Linha Q:</b> centro e raio são referência, não localização exata de uma pista, taxiway ou equipamento. Não são usados como perímetro presumido de restrição.</li></ul>
<p>A ADC georreferenciada depende de uma carta oficial validada para o aeroporto. Sem carta disponível, o app informa a limitação e mantém os avisos no mapa, sem criar alinhamento aproximado. Os catálogos de cartas são referências estáticas desta versão, sem promessa de atualização automática. Consulte sempre os originais oficiais. <b>Uso apenas para simulação.</b></p></section>
<section id="m-redes"><h3>IVAO e VATSIM</h3>
<ol><li>Abra <b>Perfil</b> ao lado do seu nome e informe opcionalmente <b>CID VATSIM</b>, <b>VID IVAO</b> e <b>rede preferida</b>. Os campos têm os ícones das redes. Salve as preferências.</li><li>No briefing, o painel <b>Redes online</b> separa as redes e apresenta indicativos correspondentes à partida, destino e alternativa, frequências e ATIS disponível. Abra a posição para ler o texto completo; use o filtro e Atualizar quando necessário.</li><li>No mapa, use as camadas de controladores por rede e de <b>ID informado encontrado</b>. Controladores no mesmo ponto são agrupados; clique para ver as posições. O marcador do ID informado destaca o indicativo encontrado no feed.</li></ol>
<p>A preferência define a seleção inicial; as camadas do mapa podem ser alteradas separadamente. As informações são <b>atuais</b>, com horário UTC da fonte, e não previsão de controle no horário futuro do voo. Fontes indisponíveis ou antigas ficam como não confirmadas; ausência de correspondência não prova que o piloto está desconectado.</p>
<p>A associação aeroportuária é pelo indicativo: não se presume que uma APP/Centro cubra outro aeródromo. O marcador não representa extensão do setor. <b>CID e VID são informados pelo piloto e não verificam identidade.</b> Não há login nas redes por esse campo; conecte pelo cliente do simulador. A detecção na rede não valida reportes, não concede horas e não substitui o rastreamento exigido pelo app.</p></section>

<section id="m-diario"><h3>Diário de bordo, salário e catálogo</h3>
<p>Em <b>Diário de bordo → Meu logbook</b> ficam as suas horas: total, últimos 30 dias, este ano, horas por tipo de aeronave, companhia e simulador, matrículas mais voadas (nas cores da companhia, com o modelo ao lado) e a lista de voos, com <b>Exportar CSV</b> para planilha. As horas vêm do tempo de calço de cada reporte. Em <b>Salário</b> há uma simulação fictícia de contracheque: pagamento por hora de voo conforme a patente e a categoria da aeronave, mais diárias de pernoite. O valor é definido em dólar e convertido para a moeda escolhida pela <b>cotação do dia de cada voo</b> (coluna Cotação). <b>Ranking de pilotos</b> compara as horas do grupo (total, este ano ou 30 dias); toque num piloto para ver o logbook dele. <b>Todos os registros</b> reúne todos os voos reportados, com número sequencial por aeronave (TL 0001…), rota, piloto, simulador, tempo de calço e falhas. O <b>Catálogo de falhas</b> traz as 123 falhas padrão por capítulo ATA, com ação padrão, tempo médio de reparo, prazo MEL e procedimento.</p></section>

<section id="m-apoie"><h3>Apoie o projeto</h3>
<p>O app é gratuito. Na aba <b>Apoie</b>, doe pelo QR Code Pix, pelo Pix copia e cola ou pelas outras formas listadas (cartão, PayPal e outras), no valor que quiser.</p></section>

<section id="m-faq"><h3>Perguntas frequentes</h3>
<div class="scroll"><table><thead><tr><th>Situação</th><th>O que fazer</th></tr></thead><tbody>
<tr><td>Não consigo entrar</td><td>Confira e-mail e senha. Se esqueceu a senha, toque em <b>Esqueci minha senha</b> na tela de entrada: chega um link no seu e-mail para criar uma nova</td></tr>
<tr><td>A reserva foi recusada</td><td>Leia a mensagem em vermelho: sobreposição, manutenção, duração fora da faixa ou limite semanal da matrícula</td></tr>
<tr><td>A duração que eu queria não aparece</td><td>Só aparecem durações entre o voo + 45 min e o voo + 2 h; confira origem e destino</td></tr>
<tr><td>O botão Reportar voo não aparece</td><td>Há item aberto na aeronave: toque no botão amarelo <b>Revisar livro técnico</b> e assine</td></tr>
<tr><td>Quero cancelar a escala</td><td>Escala aceita não pode ser cancelada; os voos não realizados são liberados sozinhos na data do 🔒</td></tr>
<tr><td>Minha reserva sumiu</td><td>Pode ter sido cancelada por manutenção; há um aviso no topo do app</td></tr>
<tr><td>O METAR não aparece</td><td>Aeroportos pequenos podem não emitir METAR ou TAF; use o link do aviationweather.gov</td></tr>
<tr><td>Uma novidade do app não apareceu</td><td>No PC, aperte <b>Ctrl+Shift+R</b>; no celular, feche e abra o app</td></tr>
<tr><td>Estou sem internet</td><td>O app abre com os últimos dados, só para consulta; reservas e reportes precisam de conexão</td></tr></tbody></table></div></section>`},
en:{toc:[["m-ciclo","How it works"],["m-inicio","Getting started"],["m-escala","Roster"],["m-reservar","Schedule"],["m-antes","Before the flight"],["m-rastreio","Tracked flight"],["m-reporte","After landing"],["m-frota","Fleet"],["m-manut","Automatic maintenance"],["m-oper","Realistic operations"],["m-mapa","Map and flight details"],["m-brief","Briefing, ADC and NOTAMs"],["m-redes","IVAO and VATSIM"],["m-diario","Logbook, pay and catalog"],["m-apoie","Support"],["m-faq","FAQ"]],
body:`
<p class="muted manual-updated">Updated 22 October 2026.</p>
<section id="m-ciclo"><h3>How Virtual Flight Report works</h3>
<p><b>Every flight leaves its mark.</b> Virtual Flight Report is a shared technical log: each aircraft is identified by its registration, and every pilot who flies it, in MSFS or X-Plane, records what happened to it. The next pilot finds the aircraft exactly as the previous one left it.</p>
<div class="cycle"><span class="cy-step">Generate a roster</span><span class="cy-arrow">→</span><span class="cy-step">Review the technical log</span><span class="cy-arrow">→</span><span class="cy-step">Fly in your simulator</span><span class="cy-arrow">→</span><span class="cy-step strong">Report the flight</span></div>
<div class="cycle out"><span class="chip ok">Fixed: stays available</span><span class="chip warn">Deferred (MEL): flies with restriction</span><span class="chip bad">On ground: released after repair</span></div>
<p class="muted">Each defect carries its own consequence: from the defect you pick, the app decides whether the aircraft stays available, flies with a restriction or is grounded, and for how long.</p></section>

<section id="m-inicio"><h3>Getting started</h3>
<p>You need one pilot account, created once; it works on every device.</p>
<ol><li>Open <b>flyvfr.com.br</b> and tap <b>Sign in</b>.</li><li>Tap <b>New pilot? Create an account</b>.</li><li>Enter your <b>pilot name</b> (name or callsign shown to others), <b>email</b>, the <b>simulators you use</b> and a <b>password</b> of at least 6 characters. To change the simulators later, tap <b>Profile</b> next to your name.</li><li>Tap <b>Create account</b>. Next time, use <b>Sign in</b>.</li></ol>
<p>After signing in, the app opens on <b>Schedule</b> if you already have an accepted roster; otherwise it opens on <b>Roster</b>. The menu follows a pilot's day: Roster, Briefing room (enabled with an accepted roster), Bookings, Fleet, Map, Events, Logbook, Catalog, Handbook and Support.</p>
<div class="scroll"><table><thead><tr><th>Device</th><th>How to install</th></tr></thead><tbody>
<tr><td>PC (Chrome or Edge)</td><td><b>Install app</b> at the top of the page, or the install icon in the address bar</td></tr>
<tr><td>Android</td><td>In Chrome: menu ⋮ → <b>Install app</b> (or the <b>VirtualFlightReport.apk</b> file, if your administrator shares it)</td></tr>
<tr><td>iPhone or iPad (Safari)</td><td><b>Share</b> → <b>Add to Home Screen</b></td></tr></tbody></table></div>
<p>In <b>Settings</b> (in the menu) you pick the language by its flag (English, Portuguese, Spanish, French, German, Japanese, Chinese or Korean), the color theme and the menu position. The <b>DAY MODE / NIGHT MODE</b> button switches between a light and a dark page. Your choices are saved on the device. App improvements reach your PC and phone automatically, with no reinstall. To sign out, tap <b>Sign out</b> next to your name.</p></section>

<section id="m-escala"><h3>Flight roster</h3>
<p>The <b>Roster</b> menu offers two modes:</p>
<ul><li><b>Free flight:</b> choose departure, airline and aircraft independently of an RPL departure.</li><li><b>RPL flights:</b> browse departures <b>30–90 minutes from now</b>. RPL covers Brazilian domestic flights and international flights departing from or arriving in Brazil. Select an eligible aircraft of the airline and compatible aircraft model for the selected flight.</li><li><b>No eligible RPL option:</b> airline and aircraft selection remains free if the airport has no RPL entry or no departure with an eligible aircraft.</li><li><b>Favorites:</b> favorite aircraft take priority in airline and aircraft selection in both modes.</li></ul>
<p>Set the first departure, length (1–4 days) and daily flight count. Each leg starts where the previous one ends. The generator considers ground, duty and rest times; review the sequence before accepting.</p>
<p>You can generate new options before accepting. Confirm <b>Accept roster</b> to book the flights: <b>an accepted roster cannot be changed</b>. Acceptance enables the briefing and each flight's SimBrief and SkyVector buttons.</p>
<p><b>ADS-B is reference only.</b> Ground-aircraft information identifies its source and update time. It does not change aircraft availability, selection, operational location in the app or the roster; a real aircraft sighting does not determine the generated flight.</p>
<p>Review flight cards and notices in <b>Schedule</b>. Completed or cancelled flights do not reopen the operational roster table.</p><p><b>Delay (DLA) and no-show:</b> the EOBT (estimated off-block time) is shown on the flight card in Your schedule. If you will be late, tap <b>Delay (DLA)</b> and pick the new EOBT: <b>one DLA per flight</b>, filed up to <b>35 min after the planned EOBT</b>, with the new EOBT <b>no more than 45 min from the moment the DLA is filed</b>. Following flights of the same duty shift by the same amount. Propagation stops at the overnight rest, preserving the next duty’s times. If the tracked flight is not started within <b>45 min of the EOBT in force</b>, the flight is cancelled and a notice appears in Bookings. Once the EOBT has passed, the card shows the deadline in red.</p></section>

<section id="m-reservar"><h3>Your flight schedule</h3>
<p>The <b>Schedule</b> tab starts with <b>Your schedule</b>: one card per flight of yours, with the aircraft photo, the registration in the airline's colors, flight number and route, date and time (local and UTC) and the airline.</p>
<div class="scroll"><table><thead><tr><th>On the card</th><th>What it means</th></tr></thead><tbody>
<tr><td><span class="chip ok">✓ No open items in the logbook</span></td><td>Blinks once as a heads-up. Nothing to sign: <b>Tracked flight</b> and <b>File flight report</b> are already enabled</td></tr>
<tr><td><span class="chip warn">⚠ Review technical log</span></td><td>Keeps blinking: the aircraft has an open item. Tap it, read the items and sign (see <b>Before the flight</b>)</td></tr>
<tr><td><span class="chip ok">✓ Technical log reviewed</span></td><td>You have signed; you're good to fly</td></tr></tbody></table></div>
<ul><li><b>SimBrief</b> and <b>SkyVector</b>: buttons with each site's icon, on the right, open planning for the respective flight. SimBrief also receives aircraft identification and EOBT; SkyVector receives the route and cruise estimates.</li><li><b>METAR and TAF:</b> hover over an airport code (tap it on a phone). Tap <b>Decoded</b> to read the report in plain language (wind, visibility, clouds, temperature, pressure and each TAF period); <b>Original</b> shows the raw text again. The app remembers your choice.</li></ul>
<p>Roster bookings are created on acceptance. Use flight cards to review the technical log, track and report the flight. Administrative and event actions depend on the options available to the account.</p></section>

<section id="m-antes"><h3>Before the flight</h3>
<p>Before flying, check the technical log button on the flight card:</p>
<ul><li><b>No open items</b> (green): no signature needed. Just tap <b>Tracked flight</b> or <b>File flight report</b>.</li><li><b>Open item</b> (blinking yellow): tap <b>Review technical log</b>, read the open items and latest reports, tick the confirmation and tap <b>Sign technical log</b>. The button turns green, showing <b>Technical log reviewed</b>. Without that signature, tracking and the report are not accepted.</li><li>If another pilot reports a defect on that registration after your signature, the yellow button comes back and you need to sign again.</li></ul>
<p>A defect does not carry over between simulators, so each deferred item comes with a <b>procedure for the next crew</b> that you follow on your flight. Example: <i>APU fails to start</i> → request GPU and external air on ground.</p></section>

<section id="m-rastreio"><h3>Tracked flight</h3>
<p><b>Validated tracking</b> is the normal way to record a flight and count hours, rank, pay and ranking. The app reads simulator telemetry and the server checks the track. Without validated tracking, request review when available: an administrator decides, without flight completion or rewards before approval.</p>
<ol><li>On the flight card in <b>Your schedule</b>, tap <b>✈ Tracked flight</b> (available from 1 h before the booked time; if there is an open item, sign the technical log first).</li>
<li>With the aircraft stopped at the departure gate, tap <b>Connect to simulator</b>.<ul>
<li><b>MSFS 2020/2024:</b> install <a href="https://fsuipc.com" target="_blank" rel="noopener">FSUIPC7</a> (the free version is enough) and the <a href="http://fsuipcwebsockets.paulhenty.com/" target="_blank" rel="noopener">FSUIPC WebSocket Server</a>, and keep both open with the sim.</li>

<li><b>X-Plane 12</b> (12.1.4 or newer): nothing to install.</li>
<li><b>X-Plane 11:</b> XPUIPC plugin + FSUIPC WebSocket Server.</li>
<li>Use Chrome or Edge on the same computer as the sim. If the browser asks for local network access, allow it.</li></ul></li>
<li>Fly normally and keep the tab open. The <b>Live flight</b> screen shows phase, altitude, speed, vertical speed and distance to destination; you can use other screens meanwhile.</li>
<li>After landing, park and stop the aircraft. Tap <b>Finish flight</b>: the server checks the track and shows the result. Then fill in the report (defects and remarks); block time and arrival airport come from the track.</li></ol>
<p>The server rejects the flight if it doesn't start on the ground at the departure airport · doesn't end stopped at an airport · uses time acceleration or slew · the aircraft jumps position (teleport or map move) · tracking stops for more than 10 min in the air · the track doesn't reach the server in real time · the flight is under 5 min in the air. Pausing is fine: paused time is removed. Diversions are accepted: the aircraft stays where it landed.</p></section>

<section id="m-reporte"><h3>After landing: report the flight</h3>
<ol><li>Tap <b>File flight report</b>.</li><li>Choose the <b>simulator</b> (only yours are listed; for another, pick <b>Other simulator…</b>) and enter the <b>block time</b> (h:mm, e.g. <code>1:45</code>).</li><li>For each defect, tap <b>Add defect</b>; if nothing happened, add none.</li><li>Tap <b>File report and close the booking</b>.</li></ol>
<p>The defect field shows those <b>most reported by airline crews</b>. Start typing and the list narrows: it understands all five languages, ignores accents and knows terms like <code>brake</code>, <code>door</code>, <code>APU</code>, <code>ata 32</code> or <code>ECAM</code>. If it is not in the catalog, choose <b>Not in the list: describe it</b>.</p>
<p>Pilots don’t pick the action or the time: they come from the defect chosen in the catalog. For defects outside the catalog, the app uses the most common default of the ATA chapter given.</p><div class="scroll"><table><thead><tr><th>Consequence</th><th>Effect on the aircraft</th></tr></thead><tbody>
<tr><td><span class="chip ok">Fixed by crew</span></td><td>None; kept in the history only</td></tr>
<tr><td><span class="chip warn">Deferred (MEL)</span></td><td>Flies with restriction until the deadline (Cat B 3 days, Cat C 10 days, Cat D 120 days); then on ground for the repair time</td></tr>
<tr><td><span class="chip bad">Aircraft on ground</span></td><td>Unavailable for the average repair time, counted from the report</td></tr></tbody></table></div></section>

<section id="m-frota"><h3>Fleet</h3>
<p>The <b>Fleet</b> tab shows one card per registration, with photo, type, airline and status. Aircraft on ground or restricted are listed first.</p>
<div class="scroll"><table><thead><tr><th>Status</th><th>Meaning</th><th>Can I book?</th></tr></thead><tbody>
<tr><td><span class="pill ok">Available</span></td><td>No open items in the technical log</td><td>Yes</td></tr>
<tr><td><span class="pill warn">Restricted</span></td><td>Deferred item (MEL); flies following the stated procedure</td><td>Yes, simulating the restriction</td></tr>
<tr><td><span class="pill bad">AOG</span></td><td>On ground for maintenance; the card shows when it returns</td><td>Only after release</td></tr></tbody></table></div>
<ul><li><b>Filter:</b> pick a region (South & Central America — Brazil included —, Europe, North America, Asia & Middle East, Oceania or Others); its airlines then appear below. You can also filter by status.</li><li><b>Favorites:</b> tap the star on a card (or in the technical log) to favorite it. Favorites come first, have their own filter and sit at the top of the list when booking; they follow you on every device.</li><li><b>Search:</b> type part of the registration or type, such as <code>YSF</code> or <code>737</code>.</li><li><b>More aircraft:</b> tap <b>Show more</b> at the end of the list.</li><li><b>Add an aircraft:</b> tap <b>Add aircraft</b> and enter registration, type, airline and optional base.</li></ul>
<p>Tap a card to open the registration's <b>technical log</b>: status, open items and procedures, scheduled maintenance, airframe hours, cycles and every log page. Photos come from Planespotters.net with the photographer's name; registrations without a photo show an illustration of the model.</p></section>

<section id="m-manut"><h3>Automatic maintenance</h3>
<ul><li>When the repair time ends, the aircraft returns to <b>Available</b> on its own.</li><li>Time runs in real hours from the report; overlapping groundings add up.</li><li>An expired MEL item grounds the aircraft for that item's repair time.</li><li>Bookings inside a new grounding are cancelled, with a notice at the top of the app; later bookings stay. The affected pilot is offered aircraft of the <b>same model or family</b> (e.g. A320 family, 737 NG/MAX, E-Jets) free at the same time; one tap opens a booking pre-filled with the same route, time and duration.</li></ul></section>

<section id="m-oper"><h3>Realistic operations</h3>
<p><b>Aircraft location in the app.</b> Flight history and system bookings are separate from ADS-B observations. Check flight notices and the technical log; ADS-B data does not reposition the aircraft or require a ferry.</p>

<p><b>Diversions.</b> The actual arrival must reflect the flight performed and tracking/report data. Review affected booking notices; do not confuse a simulated diversion with an ADS-B observation.</p>
<p><b>Scheduled checks.</b> Every 120 flight hours or 100 cycles the aircraft gets an A-check (8 hours on the ground); every 1,200 hours, a C-check (48 hours). The check is created automatically when the flight that reaches the limit is closed, and bookings in that period are cancelled with an offer of another aircraft. The tech log shows how much is left.</p>
<p><b>SimBrief.</b> In <b>Profile</b> (next to your name), enter your SimBrief username or Pilot ID. Then "Import from SimBrief" in the booking brings aircraft, route, time, duration and flight number from your latest plan. In the report, block time is filled automatically when tracking is verified.</p>



<p><b>Events.</b> The Events tab lists group flights published by the administrator. Tap "Book an aircraft for this event": aircraft that will be at the departure airport are listed first.</p>
<p><b>Notifications.</b> The bell at the top tells you when your booking is coming up, when your booked aircraft got a new report, when a booking was cancelled for maintenance, when a flight still needs closing, plus events and badges. Under "Notifications on this device" you can turn on system notifications, shown while the app is open or in the background.</p>
<p><b>Career.</b> The Logbook shows your rank (Cadet to Master Captain, by flight hours) and badges. Ranks are recognition only: any pilot can fly any aircraft.</p></section>

<section id="m-mapa"><h3>Map and flight details</h3>
<p>The map prioritizes <b>your active flight</b>. If none is active, it uses the latest available SimBrief dispatch when your username/Pilot ID is set in Profile. This does not change an accepted roster. A different dispatch does not replace an active flight. Without detailed navlog data, the direct departure-to-destination line is a reference, not a validated navigation route.</p>
<p>The sidebar contains <b>tracked flights only</b>, not airport statistics, airport exploration or RPL departures. The top-right layer control provides basemaps, traffic, controllers and overlays. Brazilian DECEA charts offer type/sheet and opacity controls; check the official edition.</p>
<p><b>Hover and click an aircraft</b> (tap on mobile) to open its details. The header highlights the callsign and airline icon when the airline can be identified; registration colors follow the matched airline. Altitude, groundspeed (GS), heading (HDG), position, source and other available information are grouped for readability. Longer popups scroll; missing data is not invented.</p>
<p><b>Tracked FlyVFR</b> data comes from the simulator, <b>IVAO/VATSIM</b> from their network feeds, and <b>ADS-B</b> from real-aircraft observations. Booking-time estimates are explicitly marked as estimates, not telemetry. ADS-B is reference only and does not change aircraft availability, selection or the roster.</p></section>
<section id="m-brief"><h3>Briefing, ADC and NOTAMs</h3>
<p>Select a booked roster flight to see METAR/TAF, NOTAMs and route weather. Set an <b>alternate</b> and its <b>ETA</b> as needed. Without a specific alternate ETA, destination ETA is used and identified. Alternate preferences are saved locally per pilot/flight without changing the booking.</p>
<p>Only the selected flight's <b>departure, destination and alternate</b> are evaluated on the ADC. Departure uses EOBT; destination and alternate use their ETAs. Multiple roles for one airport include the corresponding times. Expired, future, cancelled and superseded notices are not highlighted as active; unsupported schedules require confirmation.</p>
<p><b>The ADC layer is available only with a confirmed active NOTAM for the flight time and recent source data.</b> Otherwise the chart is removed from the map and layers. This does not establish absence of restrictions. There is no separate “View chart” button: use the airport selector and map layers.</p>
<ul><li><b>Full runway closures:</b> matched only with explicit text, the complete threshold pair and verified geometry.</li><li><b>Text coordinates:</b> shown as points, including outside the ADC image. Explicit, unambiguous and valid straight-edged boundaries can become dashed areas; obstacle lists are not joined automatically.</li><li><b>Verified references:</b> taxiway/equipment markers indicate a chart reference, not necessarily the exact equipment location. An unavailable stopbar does not mean a taxiway closure.</li><li><b>General notices:</b> active notices without precise positions are grouped at a clearly labeled airport reference marker, not their restriction footprint.</li><li><b>Q line:</b> its centre/radius is reference information, not an exact runway, taxiway or equipment location and not an inferred restriction perimeter.</li></ul>
<p>Georeferenced ADC coverage depends on a validated official chart. Missing charts are identified; notices remain available without inventing chart alignment. Chart catalogues are static references for this version, not automatically updated. Check official originals. <b>Simulation use only.</b></p></section>
<section id="m-redes"><h3>IVAO and VATSIM</h3>
<ol><li>Open <b>Profile</b> and optionally enter your <b>VATSIM CID</b>, <b>IVAO VID</b> and preferred network. Save your preferences.</li><li>The briefing <b>Online networks</b> panel shows matching departure, destination and alternate callsigns, frequencies and available ATIS. Expand a station for its text, filter by network or refresh.</li><li>Map layers show controllers per network and <b>matching declared IDs</b>. Stations sharing a point are grouped; click to read them. The declared-ID match highlights the observed callsign.</li></ol>
<p>The preference defines initial selection; map layers can be changed independently. Source UTC times describe <b>current status</b>, not future ATC availability. Missing/stale sources are unconfirmed, and no ID match does not prove disconnection. Extended APP/Centre coverage or sector boundaries are not inferred from callsigns or marker positions.</p>
<p><b>IDs are self-declared, not verified identities.</b> These fields do not sign in to the networks: use the simulator's network client. Network detection does not validate flight reports, grant hours or replace required app tracking.</p></section>

<section id="m-diario"><h3>Logbook, pay and defect catalog</h3>
<p><b>Logbook → My logbook</b> shows your hours: total, last 30 days, this year, hours by aircraft type, airline and simulator, most flown registrations (in airline colors, with the model alongside) and the flight list, with <b>Export CSV</b> for spreadsheets. Hours come from the block time of each report. <b>Pay</b> is a fictional payslip: per flight hour by rank and aircraft category, plus layover per diems. Amounts are set in US dollars and converted to the chosen currency at the <b>exchange rate of each flight’s date</b> (Rate column). <b>Pilot ranking</b> compares the group (all time, this year or 30 days); tap a pilot to see their logbook. <b>All entries</b> lists every reported flight with a sequential page per aircraft (TL 0001…), route, pilot, simulator, block time and defects. The <b>Defect catalog</b> holds the 123 standard defects by ATA chapter, with default action, average repair time, MEL limit and procedure.</p></section>

<section id="m-apoie"><h3>Support the project</h3>
<p>The app is free. In the <b>Support</b> tab you can donate by Pix QR code, Pix copy-and-paste code or the other options listed (card, PayPal and more), any amount.</p></section>

<section id="m-faq"><h3>FAQ</h3>
<div class="scroll"><table><thead><tr><th>Situation</th><th>What to do</th></tr></thead><tbody>
<tr><td>I can't sign in</td><td>Check email and password. If you forgot it, tap <b>Forgot your password?</b> on the sign-in screen: you'll get an email link to create a new one</td></tr>
<tr><td>My booking was refused</td><td>Read the red message: overlap, maintenance, duration out of range or the weekly limit for that registration</td></tr>
<tr><td>The duration I want isn't listed</td><td>Only durations from flight + 45 min to flight + 2 h appear; check departure and arrival</td></tr>
<tr><td>No File flight report button</td><td>The aircraft has an open item: tap the yellow <b>Review technical log</b> button and sign</td></tr>
<tr><td>I want to cancel my roster</td><td>An accepted roster can’t be cancelled; flights not flown are released automatically on the 🔒 date</td></tr>
<tr><td>My booking disappeared</td><td>It may have been cancelled for maintenance; see the notice at the top</td></tr>
<tr><td>No METAR shown</td><td>Small airports may not issue METAR or TAF; use the aviationweather.gov link</td></tr>
<tr><td>A new app feature doesn't show</td><td>On a PC press <b>Ctrl+Shift+R</b>; on a phone close and reopen the app</td></tr>
<tr><td>I'm offline</td><td>The app opens with the last data, read-only; bookings and reports need a connection</td></tr></tbody></table></div></section>`}
};
function viewManual(){
  const m=MANUAL[lang]||MANUAL.en;
  const note=MANUAL[lang]?"":`<div class="notice">${t("man_lang_note")}</div>`;
  return`<div class="sec-head"><div><span class="eyebrow">${t("man_eyebrow")}</span><h2>${t("man_title")}</h2></div></div>${note}
   <nav class="man-toc" aria-label="${t("man_toc")}"><button data-action="man-jump" data-to="m-dispatch">${t("man_dispatch_title")}</button>${m.toc.map(([id,l])=>`<button data-action="man-jump" data-to="${id}">${esc(l)}</button>`).join("")}</nav>
   <div class="panel manual"><section id="m-dispatch"><h3>${t("man_dispatch_title")}</h3><p>${t("man_dispatch_confirm")}</p><ul><li>${t("man_dispatch_simbrief")}</li><li>${t("man_dispatch_skyvector")}</li></ul><p class="muted">${t("man_dispatch_note")}</p></section>${m.body}</div>`;
}

/* ---------- Writes ---------- */
function err(id,msg){const e=$(id);e.textContent=msg;e.hidden=!msg}
function dbMessage(e,reg){
  const m=(e&&e.message)||"";
  if(m.startsWith("VFR_REPORT_")&&typeof reviewText==="function")return reviewText(m.includes('ACTIVE')?'active':m.includes('SELF')?'self':m.includes('EARLY')?'early':/PENDING|DUPLICATE|DECIDED/.test(m)?'closed':'input');
  if(e&&e.vfrDup)return t("err_dup",{reg:e.vfrDup});
  if(e&&e.code==="23505")return t("err_dup",{reg});
  if(!navigator.onLine)return t("err_net");
  if(m.startsWith("VFR_MAINTENANCE:"))return t("err_mx_srv",{reg,t:fmt(new Date(m.split(":").slice(1).join(":")).getTime())});
  if(m.startsWith("VFR_PAST"))return t("err_past");
  if(m.startsWith("VFR_POSITION:"))return t("err_pos",{reg,icao:m.split(":")[1]});
  if(m.startsWith("VFR_NEXT_DEP:"))return t("err_next",{icao:m.split(":")[1],t:"—"});
  if(m.startsWith("VFR_BLOCKED"))return t("err_blocked");
  if(m.startsWith("VFR_ROSTER_ONLY"))return t("err_roster_only");
  if(m.startsWith("VFR_ROSTER_BUSY"))return t("rs_err_busy",{reg});
  if(m.startsWith("VFR_ROSTER_LOCKED"))return t("rs_locked_t");
  if(m.startsWith("VFR_PILOT_BUSY"))return t("err_pilot_busy");
  if(m.startsWith("VFR_ROSTER_LIMIT"))return t("rs_err_limit");
  if(m.startsWith("VFR_ROSTER_BAD"))return t("rs_accept_invalid");
  if(m.startsWith("VFR_WEEK"))return t("err_week_srv",{maxac:WEEK_MAX_AC});
  if(m.startsWith("VFR_NO_ACK"))return t("err_no_ack");
  if(m.startsWith("VFR_MOVING:"))return t("err_moving",{reg,t:fmt(new Date(m.split(":").slice(1).join(":")).getTime())});
  for(const k of ["BUSY","BOOKED","AOG","SAME","AP","LIMIT","AC"])if(m.startsWith("VFR_MOVE_"+k))return t("err_move_"+k.toLowerCase(),{reg});
  if(/reposition_aircraft|aircraft_moves/i.test(m))return t("rs_mv_missing");
  if(m.startsWith("VFR_DLA_USED"))return t("dla_e_used");
  if(m.startsWith("VFR_DLA_LATE"))return t("dla_e_late");
  if(m.startsWith("VFR_DLA_TIME"))return t("dla_e_time");
  if(m.startsWith("VFR_DLA_CONFLICT"))return t("dla_e_conflict");
  if(m.startsWith("VFR_DLA_STARTED"))return t("dla_e_started");
  if(/file_dla|Could not find the function/i.test(m))return t("dla_not_installed");
  if(m.startsWith("VFR_TRACK_TIME"))return t("trk_e_time");
  if(m.startsWith("VFR_TRACK_CLOSED"))return t("trk_closed");
  if(m.startsWith("VFR_TRACK"))return t("trk_e_bad");
  if(/function public\.track_|track_start|Could not find the function/.test(m))return t("trk_not_installed");
  if(m.startsWith("VFR_CLOSED")||m.startsWith("VFR_NOT_YOURS"))return t("err_closed");
  if(e&&e.code==="23P01")return t("err_clash_srv",{reg});
  if(e&&(e.code==="42501"||/row-level security/.test(m)))return t("err_perm");
  return t("err_save");
}
async function busy(form,fn,reg){const b=form.querySelector('button[type="submit"]');b.disabled=true;
  try{await fn()}catch(e){console.error(e);const p=form.querySelector(".form-err");if(p){p.textContent=dbMessage(e,reg);p.hidden=false}}finally{b.disabled=false}}
const must=({error})=>{if(error)throw error};

/* matrícula sem hífen/espaço, para achar PR-GUK mesmo se digitarem PRGUK */
const regKey=r=>String(r||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
function findDupLocal(reg){const k=regKey(reg);return k?fleet.find(a=>regKey(a.registration)===k)||null:null}
async function findDupRemote(reg){const k=regKey(reg);if(!k||!sb)return null;
  const {data,error}=await sb.from("aircraft").select("registration,type,airline").ilike("registration",k.split("").join("%"));
  if(error)throw error;return (data||[]).find(a=>regKey(a.registration)===k)||null}
function paintDupNote(){const i=$("#ac-reg"),n=$("#ac-dup"),b=document.querySelector('#f-ac button[type="submit"]');if(!i||!n)return;
  const d=findDupLocal(i.value);n.hidden=!d;if(b)b.disabled=!!d;
  n.innerHTML=d?`${t("err_dup_live",{reg:`<b>${esc(d.registration)}</b>`,type:esc(d.type||""),airline:esc(d.airline||"")})} <button type="button" class="linkish" data-action="open-aircraft" data-id="${esc(d.registration)}">${t("open_log")}</button>`:""}
async function submitAircraft(form){
  const reg=$("#ac-reg").value.trim().toUpperCase(),type=$("#ac-type").value.trim(),airline=$("#ac-airline").value.trim();
  if(!/^[A-Z0-9][A-Z0-9-]{1,9}$/.test(reg))return err("#ac-err",t("err_reg"));
  const dupL=findDupLocal(reg);if(dupL)return err("#ac-err",t("err_dup",{reg:dupL.registration}));
  await busy(form,async()=>{const dupR=await findDupRemote(reg);if(dupR){await load("aircraft");render();throw {vfrDup:dupR.registration}}
    must(await sb.from("aircraft").insert({registration:reg,type,airline,created_by:myId}));
    await load("aircraft");closeSheet();render();toast(t("t_added",{reg}))},reg);
}
/* conflito com as reservas do próprio piloto (em qualquer aeronave): voos que se sobrepõem e o período inteiro
   das escalas dele (do primeiro voo ao último, com os pernoites). skip = reserva sendo trocada; ferry/troca podem
   cair dentro do período da própria escala, mas nunca em cima de outro voo. */
function myClash(s,e,o){o=o||{};const mine=data.reservations.filter(r=>r.pilotId===myId&&booked(r)&&r.id!==o.skip);
  const hit=mine.find(r=>r.start<e&&r.end>s);if(hit)return hit;
  if(o.ferry)return null;const skipR=o.skip&&data.reservations.find(r=>r.id===o.skip)?.rosterId;const spans={};
  for(const r of mine)if(r.rosterId&&r.rosterId!==skipR){const g=spans[r.rosterId]=spans[r.rosterId]||{s:r.start,e:r.end,first:r};if(r.start<g.s){g.s=r.start;g.first=r}if(r.end>g.e)g.e=r.end}
  for(const k in spans){const g=spans[k];if(g.s<e&&g.e>s)return Object.assign({},g.first,{spanS:g.s,spanE:g.e})}
  return null}
const myClashMsg=r=>{const a=acById(r.aircraftId);return r.spanS?t("err_mine_roster",{reg:esc(a?.registration||r.aircraftId),s:fmt(r.spanS),e:fmt(r.spanE)}):t("err_mine",{reg:esc(a?.registration||r.aircraftId),dep:esc(r.dep),arr:esc(r.arr),s:fmt(r.start),e:fmtT(r.end)})};
async function submitBooking(form){
  const acId=$("#bk-ac").value,a=acById(acId),dep=apResolve($("#bk-dep").value),arr=apResolve($("#bk-arr").value),flightNo=normFno($("#bk-fno").value);
  if(flightNo&&!FNO_RE.test(flightNo))return err("#bk-err",t("err_fno"));
  const start=new Date($("#bk-start").value).getTime(),end=start+Number($("#bk-dur").value)*H;
  if(bkNeedsAck()&&!$("#bk-ack").checked)return err("#bk-err",t("bk_sign_first"));
  if(!/^[A-Z0-9]{3,4}$/.test(dep)||!/^[A-Z0-9]{3,4}$/.test(arr))return err("#bk-err",t("err_icao"));
  if(!start||start<Date.now()-30*6e4)return err("#bk-err",t("err_past"));
  const est=bookingEstimate(acId,dep,arr);if(est&&!est.missing&&(end-start)/6e4>est.maxMin+1)return err("#bk-err",t("err_dur_max",{max:hm(est.maxMin)}));
  if(est&&!est.missing&&(end-start)/6e4<est.minMin-1)return err("#bk-err",t("err_dur_min",{min:hm(est.minMin)}));
  const pc=posCheck(acId,dep,arr,start,end);if(pc)return err("#bk-err",pc);
  const mx=aogOverlap(acId,start,end);if(mx)return err("#bk-err",t("err_mx",{reg:a.registration,title:defTitle(mx.d),t:fmt(releaseAt(acId,mx.s)||mx.e)}));
  const clash=data.reservations.find(r=>r.aircraftId===acId&&booked(r)&&r.start<end&&r.end>start);
  if(clash)return err("#bk-err",t("err_clash",{reg:a.registration,p:pilot(clash.pilotId),s:fmt(clash.start),e:fmtT(clash.end)}));
  {const rp=$("#bk-replace")||$("#bk-swap"),mc=myClash(start,end,{skip:rp?rp.value:null,ferry:!!($("#bk-ferry")&&$("#bk-ferry").checked)||!!rp});if(mc)return err("#bk-err",myClashMsg(mc))}
  const wu=weekUse(start,acId);
  if(wu.m>=WEEK_MAX_AC)return err("#bk-err",t("err_week_ac",{reg:a.registration,max:WEEK_MAX_AC,d:wu.d}));
  await busy(form,async()=>{
    const row={aircraft_id:acId,pilot_id:myId,dep,arr,start_at:new Date(start).toISOString(),end_at:new Date(end).toISOString()};if(flightNo)row.flight_no=flightNo;
    if($("#bk-ferry")&&$("#bk-ferry").checked)row.ferry=true;if($("#bk-event"))row.event_id=$("#bk-event").value;
    {const rp=$("#bk-replace")||$("#bk-swap");if(rp)row.replaces=rp.value}
    let ins=await sb.from("reservations").insert(row).select("id").single();
    /* banco sem as colunas novas (12_operacao.sql não rodado): grava sem elas */
    for(const col of ["ferry","event_id","replaces"])if(ins.error&&(col in row)&&new RegExp(col).test(ins.error.message||"")){delete row[col];ins=await sb.from("reservations").insert(row).select("id").single()}
    /* banco ainda sem a coluna flight_no (06_flight_number.sql não rodado): reserva sem o número */
    if(ins.error&&flightNo&&/flight_no/.test(ins.error.message||"")){delete row.flight_no;ins=await sb.from("reservations").insert(row).select("id").single();if(!ins.error)setTimeout(()=>toast(t("fno_not_saved")),3800)}
    must(ins);
    // assinatura do livro técnico feita no formulário da reserva
    const rid=ins.data&&ins.data.id;
    if(rid){try{must(await sb.from("reservations").update({ack_at:new Date().toISOString()}).eq("id",rid))}catch(x){}}
    /* troca de aeronave por desvio: a reserva antiga é cancelada depois que a nova foi gravada */
    const repl=$("#bk-replace");if(rid&&repl){try{must(await sb.from("reservations").update({status:"cancelled"}).eq("id",repl.value))}catch(x){}}
    await load("reservations");view="bookings";render();sheetConfirmed({aircraftId:acId,dep,arr,start,end,flightNo});toast(t("t_booked",{reg:a.registration,t:fmt(start)}))},a.registration);
}
async function submitAck(form){
  await busy(form,async()=>{must(await sb.from("reservations").update({ack_at:new Date().toISOString()}).eq("id",form.dataset.id));
    await load("reservations");closeSheet();render();toast(t("t_signed"))});
}
async function submitReport(form){
  const r=data.reservations.find(x=>x.id===form.dataset.id);if(!r)return;
  const dep=$("#rp-dep").value.trim().toUpperCase(),arr=$("#rp-arr").value.trim().toUpperCase(),sim=$("#rp-sim").value,bt=$("#rp-block").value.trim();
  const trackId=($("#rp-track")&&$("#rp-track").value)||"";
  if(!/^[A-Z0-9]{3,4}$/.test(dep)||!/^[A-Z0-9]{3,4}$/.test(arr))return err("#rp-err",t("err_icao"));
  const m=bt.match(/^(\d{1,2}):([0-5]\d)$/);if(!m)return err("#rp-err",t("err_block"));
  const blockMin=Number(m[1])*60+Number(m[2]);if(!blockMin)return err("#rp-err",t("err_block0"));
  const defects=[];
  for(const fs of document.querySelectorAll("#defects .df")){
    const q=k=>fs.querySelector(`[data-role="${k}"]`),cid=q("cat").value,c=CAT_BY_ID[cid],desc=q("desc").value.trim();
    if(!cid)return err("#rp-err",t("err_choose"));
    if(cid==="other"&&desc.length<5)return err("#rp-err",t("err_other"));
    const outcome=q("out").value;
    let proc=outcome==="grounded"?"":q("proc").value.trim();
    if(c&&c.p&&proc===tr(c.p))proc=c.p[0]; // texto do catálogo em forma canônica, para ser traduzido em qualquer idioma
    defects.push({catalog_id:c?c.id:"",ata:c?c.ata:Number(q("ata").value),title:c?c.t[0]:desc.slice(0,70),description:c?desc:(desc.length>70?desc:""),
      phase:q("phase").value,outcome,repair_h:outcome==="rectified"?null:Math.min(72,Number(c&&c.repairH?c.repairH:q("rep").value)),
      defer_days:outcome==="deferred"?Number(c&&c.deferDays?c.deferDays:q("defer").value):null,ops_procedure:proc});
  }
  const reg=acById(r.aircraftId)?.registration||r.aircraftId;
  await busy(form,async()=>{
    const {data:res,error}=await sb.rpc("file_flight_report",{p_reservation:r.id,p_flight:{dep,arr,simulator:sim,block_min:blockMin,remarks:$("#rp-rem").value.trim(),review_reason:$("#rp-review-reason")?.value.trim()||"",...(trackId?{track_id:trackId}:{})},p_defects:defects});
    if(error)throw error;
    if(res?.review_pending){if(typeof TRK!=="undefined"&&TRK.resId===r.id)trkReset();closeSheet();await loadReportReviews(true);render();toast(reviewText('pending'));return}
    if(typeof TRK!=="undefined"&&TRK.resId===r.id)trkReset();
    await Promise.all(["reservations","flights","defects"].map(load));
    closeSheet();view="logbook";render();
    if(arr!==r.arr&&typeof afterDiversion==="function")afterDiversion(r,arr);
    const g=releaseAt(r.aircraftId,Date.now());const n=res&&res.cancelled||0;
    toast(g?t("t_filed_aog",{reg,t:fmt(g)})+(n?t("t_cancelled",{n}):""):t("t_filed"));
  },reg);
}

/* ---------- Events ---------- */
document.addEventListener("click",async e=>{
  if(e.target.closest("a.ac-photo,a.photo-link"))return;
  const el=e.target.closest("[data-view],[data-action]");if(!el)return;
  if(el.dataset.view){if(el.dataset.view==='roster'&&rosterMenuLocked())return showRosterLocked();view=el.dataset.view;if(view==='bookings')PROGRAMMING_SECTIONS.add(myId+':calendar');closeSheet();render();if(view==="fleet")fleetOpenHomeRegion();else fleetGeoVersion++;return}
  const a=el.dataset.action;
  if(a==="scrim"){if(e.target===el)closeSheet();return}
  if(a==="close")return closeSheet();
  if(a==="auth-forgot"){authMode="forgot";authMsg=null;return render()}
  if(a==="auth-back"){if(recovering){recovering=false;if(session)sb.auth.signOut()}authMode="signin";authMsg=null;return render()}
  if(a==="auth-mode"){authMode=authMode==="signin"?"signup":"signin";authMsg=null;return render()}
  if(a==="signout"){await sb.auth.signOut();return}
  if(a==="install"&&installPrompt){installPrompt.prompt();installPrompt=null;return paintMe()}
  if(a==="open-aircraft"){if(view==="fleet"&&splitFleet()&&el.closest(".ftable")){selAc=el.dataset.id;return render()}return paintAircraftSheet(el.dataset.id)}
  if(a==="new-aircraft")return sheetNewAircraft();
  if(a==="go-roster"||((a==="new-booking"||a==="ferry")&&!IS_ADMIN())){if(rosterMenuLocked())return showRosterLocked();closeSheet();if(el.dataset.ac){RS.ac=el.dataset.ac;{const x=acById(RS.ac);if(x&&typeof ACP!=="undefined")ACP.rs.al=x.airline||"all"}RS.dep=locAt(RS.ac,RS.start||Date.now()+90*6e4)||"";RS.roster=null;RS.err="";if(el.dataset.free==="1"){RS.other=true;RS.pf=null;RS.touched=true;RS.start=rsSoonest();rsSave()}}view="roster";render();window.scrollTo&&window.scrollTo(0,0);return}
  if(a==="new-booking")return sheetBooking(el.dataset.ac);
  if(a==="ferry")return sheetBooking(el.dataset.ac,{ferry:true});
  if(a==="alt")return sheetAlternatives(el.dataset.id);
  if(a==="alt-dismiss"){altMark(el.dataset.id,"dismiss");return render()}
  if(a==="alt-book"||a==="alt-other"){const r=data.reservations.find(x=>x.id===el.dataset.id);if(!r)return;closeSheet();
    const ac=a==="alt-book"?el.dataset.ac:undefined;
    return sheetBooking(ac,{flightNo:r.flightNo,dep:r.dep,arr:r.arr,start:r.start,durH:Math.round((r.end-r.start)/6e4)/60,swapOf:r.id,note:esc(t("alt_rebook_note",{reg:acById(r.aircraftId)?.registration||r.aircraftId}))})}
  if(a==="ack")return sheetAck(el.dataset.id);
  if(a==="dla")return sheetDla(el.dataset.id);
  if(a==="noshow-ok"){altMark(el.dataset.id,"noshow");render();return}
  if(a==="report"){autoAck(el.dataset.id);return sheetReport(el.dataset.id)}
  if(a==="f-airline"){fleetGeoVersion++;fAirline=el.dataset.v;fLimit=60;return render()}
  if(a==="f-region"){fleetGeoVersion++;fRegion=el.dataset.v;fAirline="all";fLimit=60;return render()}
  if(a==="f-fav"){fleetGeoVersion++;fFav=!fFav;fLimit=60;return render()}
  if(a==="lb-tab"){lbTab=el.dataset.v;if(lbTab==="mine")lbPilot=null;return render()}
  if(a==="lb-period"){lbPeriod=el.dataset.v;return render()}
  if(a==="lb-pilot"){lbTab="mine";lbPilot=el.dataset.p;window.scrollTo&&window.scrollTo(0,0);return render()}
  if(a==="lb-me"){lbPilot=null;return render()}
  if(a==="lb-csv")return lbCsv(el.dataset.p);
  if(a==="cal-prev"||a==="cal-next"){const d=new Date(calY,calM+(a==="cal-next"?1:-1),1);calY=d.getFullYear();calM=d.getMonth();calSel=null;return render()}
  if(a==="cal-today"){const d=new Date();calY=d.getFullYear();calM=d.getMonth();calSel=dayKey(d);return render()}
  if(a==="cal-day"){calSel=calSel===el.dataset.k?null:el.dataset.k;const [y,m]=el.dataset.k.split("-").map(Number);if(m!==calM){calY=y;calM=m}render();const dt=document.querySelector(".cal-detail");if(dt&&dt.scrollIntoView)dt.scrollIntoView({block:"nearest",behavior:"smooth"});return}
  if(a==="my-sims")return sheetMySims();
  if(a==="ap-pick"){const inp=document.getElementById(el.dataset.for);if(inp)apPick(inp,el.dataset.icao);return}
  if(a==="fav"){e.stopPropagation();return toggleFav(el.dataset.id)}
  if(a==="more"){fLimit+=60;return render()}
  if(a==="man-jump"){const x=document.getElementById(el.dataset.to);if(x)x.scrollIntoView({behavior:"smooth",block:"start"});return}
  if(a==="copy"){copyText(el.dataset.copy,el);return}
  if(a==="sup-edit"){supFillMonth(el.dataset.m);return}
  if(a==="sup-del"){const m=$("#sm-month").value;if(!m)return;
    if(!el.dataset.armed){el.dataset.armed="1";el.textContent=t("sup_confirm_del");setTimeout(()=>{if(el.isConnected){delete el.dataset.armed;el.textContent=t("sup_delete_month")}},4000);return}
    el.disabled=true;try{await SUP_DELETE_MONTH(m);toast(t("sup_saved"));render()}catch(x){toast(t("err_save"));el.disabled=false}return}
  if(a==="ta-pick"){pickTa(el.closest(".df"),el.dataset.id);return}
  if(a==="add-defect"){const box=$("#defects");box.insertAdjacentHTML("beforeend",defectRow(box.children.length));syncDefectRow(box.lastElementChild,false);box.lastElementChild.querySelector("input").focus();return}
  if(a==="rm-defect"){el.closest(".df").remove();paintReportEta();[...$("#defects").children].forEach((fs,i)=>fs.querySelector("legend").textContent=t("defect_n",{n:i+1}));return}
  if(a==="cancel-roster"){
    if(!el.dataset.armed){el.dataset.armed="1";el.textContent=t("tap_again");setTimeout(()=>{if(el.isConnected){delete el.dataset.armed;el.textContent=t("rs_cancel_all")}},4000);return}
    el.disabled=true;const ids=data.reservations.filter(x=>x.rosterId===el.dataset.id&&booked(x)&&(isAdmin||x.pilotId===myId)).map(x=>x.id);
    const {error}=await sb.from("reservations").update({status:"cancelled"}).in("id",ids);
    if(error){toast(t("t_cancel_fail"));el.disabled=false}else{await load("reservations");render();toast(t("rs_cancelled",{n:ids.length}))}
  }
  if(a==="cancel-booking"){
    if(el.dataset.reserveCancel&&!bookingCanCancelReserve(data.reservations.find(x=>x.id===el.dataset.id)))return;
    if(!el.dataset.armed){el.dataset.armed="1";el.textContent=t("tap_again");setTimeout(()=>{if(el.isConnected){delete el.dataset.armed;el.textContent=t(el.dataset.reserveCancel?"bk_cancel_reserve":"cancel")}},4000);return}
    el.disabled=true;const {error}=await sb.from("reservations").update({status:"cancelled"}).eq("id",el.dataset.id);
    if(error){toast(t("t_cancel_fail"));el.disabled=false}else{await load("reservations");render();toast(t("t_cancel"))}
  }
});
let qTimer;
document.addEventListener("input",e=>{if(e.target.id==="ac-reg")paintDupNote();if(e.target.id==="f-q"){fQuery=e.target.value;fLimit=60;clearTimeout(qTimer);qTimer=setTimeout(render,180)}});
document.addEventListener("change",e=>{
  if(e.target.id==="lang"){lang=e.target.value;LI=LANGS.indexOf(lang);try{localStorage.setItem("vfr-lang",lang)}catch(x){}setFormats();
    if(sheet&&sheet.type!=="aircraft")closeSheet();render();return}
  if(e.target.id==="rp-sim"&&e.target.value==="__all"){e.target.innerHTML=simOptions(true);e.target.value="";e.target.focus();return}
  if(e.target.id==="cal-m"||e.target.id==="cal-y"){calM=Number($("#cal-m").value);calY=Number($("#cal-y").value);calSel=null;return render()}
  if(e.target.id==="palette"){setPalette(e.target.value);return}
  if(e.target.id==="layout"){setLayout(e.target.value);return}
  if(e.target.id==="f-status"){fleetGeoVersion++;fStatus=e.target.value;fLimit=60;render();return}
  if(e.target.id==="bk-ac"||e.target.id==="bk-start")paintBookingStatus();
  if(e.target.id==="bk-start"||e.target.id==="ev-start")utcHint(e.target.id);
  if(e.target.id==="bk-dur")paintPosition();
  if(e.target.id==="bk-ack")paintBookingAck();
  if(e.target.id==="bk-ac"&&$("#bk-fno"))$("#bk-fno").placeholder=fnoPlaceholder();
  const fs=e.target.closest(".df");if(fs)syncDefectRow(fs,e.target.dataset.role==="cat");
});
document.addEventListener("submit",e=>{e.preventDefault();const f=e.target;({"f-auth":submitAuth,"f-sims":submitMySims,"f-sup":submitSupport,"f-month":submitMonth,"f-ac":submitAircraft,"f-bk":submitBooking,"f-ack":submitAck,"f-dla":submitDla,"f-rep":submitReport})[f.id]?.(f)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sheet)closeSheet();
  if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches('[role="button"][data-action]')){e.preventDefault();e.target.click()}});


/* ---------- Boot ---------- */
function setSession(s){
  session=s;{const nid=s?.user?.id||null;if(nid!==myId&&typeof resetAcks==="function")resetAcks()}myId=s?.user?.id||null;canWrite=s?true:null;db=s?sb:null;
  if(s)subscribe();
}
function clearData(){favs=new Set();fFav=false;favStart=false;try{EVENTS=[];BLOCKED=new Map();meBlocked=false;isAdmin=false}catch(e){}for(const k of ["aircraft","reservations","flights","defects"])data[k]=[];loaded.aircraft=false;fleet=[];fleetById={};
  try{localStorage.removeItem("vfr-cache")}catch(e){} if(channel){sb.removeChannel(channel);channel=null}}
(async()=>{
  if(!configured){booting=false;render();return}
  restoreCache();
  const {data:{session:s}}=await sb.auth.getSession();
  setSession(s);booting=false;render();
  if(s)loadEverything();
  sb.auth.onAuthStateChange((ev,s2)=>{
    if(ev==="PASSWORD_RECOVERY"){recovering=true;authMode="newpw";authMsg=null;setSession(s2);render();return}
    const had=!!session;
    if(!s2){if(had)clearData();setSession(null);render();return}
    setSession(s2);if(!had){authMsg=null;loadEverything()}else render();
  });
})();
window.addEventListener("online",()=>{if(session)loadEverything();else render()});
window.addEventListener("offline",()=>render());
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&session)loadEverything()});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;paintMe()});
window.addEventListener("appinstalled",()=>{installPrompt=null;paintMe();paintChrome();toast(t("install_done"))});
/* botão "Instale em seu PC": usa o convite do navegador quando existe; senão mostra o passo a passo */
function isStandalone(){try{return!!window.vfrNative||matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: window-controls-overlay)").matches||navigator.standalone===true}catch(e){return false}}
function sheetInstall(){
  const ua=navigator.userAgent,ios=/iphone|ipad|ipod/i.test(ua),android=/android/i.test(ua),edge=/edg\//i.test(ua),chrome=/chrome|crios/i.test(ua)&&!edge,safari=/safari/i.test(ua)&&!chrome&&!edge,firefox=/firefox|fxios/i.test(ua);
  const order=ios?["ios"]:android?["android"]:edge?["edge","chrome"]:chrome?["chrome","edge"]:safari?["mac","chrome"]:firefox?["firefox","chrome","edge"]:["chrome","edge"];
  openSheet("form",`${head(t("install_eb"),t("install_h"))}<div style="display:grid;gap:14px">
    <p class="muted" style="margin:0">${t("install_why")}</p>
    ${order.map((k,i)=>`<div class="panel inst-step${i?"":" first"}"><h3 style="margin:0 0 6px">${t("install_"+k+"_h")}</h3><ol style="margin:0;padding-left:20px;display:grid;gap:4px">${t("install_"+k).split("|").map(x=>`<li>${x}</li>`).join("")}</ol></div>`).join("")}
    <div class="row"><button class="btn" data-action="close">${t("close")}</button></div></div>`);
}
/* no Windows, o botão baixa o instalador (.exe); nos outros sistemas, instala pelo navegador */
/* app de Windows (Electron): instalador publicado no GitHub Releases — atualize o nome a cada versão */
const EXE_URL="https://github.com/richardsonsouto/flyvfr-desktop/releases/latest/download/VirtualFlightReport-Desktop-Setup-3.0.0.exe";
const isWinPC=()=>/Windows NT/i.test(navigator.userAgent)&&!/Mobile|Phone/i.test(navigator.userAgent);
function downloadExe(){const a=document.createElement("a");a.href=EXE_URL;a.download="VirtualFlightReport-Desktop-Setup.exe";document.body.appendChild(a);a.click();a.remove()}
function sheetInstallExe(){
  openSheet("form",`${head(t("install_eb"),t("install_h"))}<div style="display:grid;gap:14px">
    <div class="notice ok">⬇ ${t("install_exe_started")}</div>
    <div class="panel inst-step first"><h3 style="margin:0 0 6px">${t("install_exe_h")}</h3><ol style="margin:0;padding-left:20px;display:grid;gap:6px">${t("install_exe_steps").split("|").map(x=>`<li>${x}</li>`).join("")}</ol></div>
    <p class="hint" style="margin:0">${t("install_exe_note")}</p>
    <div class="row"><a class="btn" style="text-decoration:none" href="${EXE_URL}" download="VirtualFlightReport-Desktop-Setup.exe">${t("install_exe_again")}</a><button class="btn" type="button" data-action="install-browser">${t("install_or_browser")}</button><button class="btn" data-action="close">${t("close")}</button></div></div>`)}
document.addEventListener("click",async e=>{
  if(e.target.closest('[data-action="install-browser"]')){if(installPrompt){const p=installPrompt;installPrompt=null;closeSheet();try{p.prompt()}catch(x){}return}return sheetInstall()}
  if(!e.target.closest('[data-action="pc-install"]'))return;
  if(isWinPC()){downloadExe();sheetInstallExe();return}
  if(installPrompt){const p=installPrompt;installPrompt=null;try{p.prompt();const r=await p.userChoice;if(r&&r.outcome==="accepted"){paintChrome();return}}catch(x){}paintMe();return}
  sheetInstall()});
if("serviceWorker" in navigator&&location.protocol!=="file:"&&!window.vfrNative)navigator.serviceWorker.register("sw.js").catch(()=>{});
setInterval(()=>{if(session&&!document.hidden&&view!=="map"&&!(document.activeElement&&document.activeElement.id==="f-q"))render()},30000);
render();
