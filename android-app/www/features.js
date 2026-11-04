/* Virtual Flight Report — recursos de operação: posição, checks, SimBrief, avisos, carreira, mapa, administração e eventos */
"use strict";

/* =====================================================================
   1. Posição: a aeronave fica onde pousou
   ===================================================================== */
/* hubs reais de cada companhia: [ICAO, peso, recebe widebody]. São usados para
   gerar malhas, mas não determinam a posição de uma aeronave sem histórico. */
const HUBS={"GOL":[["SBGR",4,1],["SBSP",2,0],["SBGL",2,0],["SBBR",2,0],["SBCF",1,0],["SBPA",1,0]],"LATAM Brasil":[["SBGR",5,1],["SBSP",2,0],["SBBR",2,0],["SBFZ",1,0],["SBGL",1,0]],"LATAM":[["SBGR",5,1],["SBSP",2,0],["SBBR",2,0],["SBFZ",1,0],["SBGL",1,0]],"Azul":[["SBKP",5,1],["SBCF",3,0],["SBRF",3,0],["SBBE",1,0]],"TAP Air Portugal":[["LPPT",5,1],["LPPR",1,0]],"Lufthansa":[["EDDF",4,1],["EDDM",3,1]],"Air France":[["LFPG",4,1],["LFPO",1,0]],"KLM":[["EHAM",1,1]],"British Airways":[["EGLL",5,1],["EGKK",1,1]],"Iberia":[["LEMD",1,1]],"Ryanair":[["EIDW",2,0],["EGSS",2,0],["LIME",1,0],["LEBL",1,0],["LPPT",1,0],["EBCI",1,0],["LIRF",1,0],["LEMG",1,0],["EPKK",1,0]],"easyJet":[["EGKK",3,0],["EGGW",2,0],["EGGD",1,0],["EGCC",1,0],["LSGG",1,0],["EDDB",1,0],["LIMC",1,0]],"American Airlines":[["KDFW",4,1],["KCLT",3,0],["KMIA",2,1],["KORD",2,1],["KPHL",2,1],["KPHX",2,0],["KJFK",1,1],["KLAX",1,1],["KDCA",1,0]],"Delta Air Lines":[["KATL",5,1],["KMSP",2,1],["KDTW",2,1],["KJFK",2,1],["KSLC",1,1],["KLAX",1,1],["KSEA",1,1],["KBOS",1,0]],"United Airlines":[["KORD",3,1],["KDEN",3,0],["KIAH",2,1],["KEWR",2,1],["KSFO",2,1],["KIAD",1,1],["KLAX",1,1]],"Southwest Airlines":[["KDAL",1,0],["KMDW",1,0],["KBWI",1,0],["KLAS",1,0],["KDEN",1,0],["KPHX",1,0],["KHOU",1,0],["KOAK",1,0],["KATL",1,0],["KMCO",1,0]],"Alaska Airlines":[["KSEA",4,1],["KPDX",1,0],["KSFO",1,0],["KLAX",1,0],["PANC",1,0]],"JetBlue":[["KJFK",3,0],["KBOS",2,0],["KFLL",2,0],["KMCO",1,0]],"Air Canada":[["CYYZ",3,1],["CYUL",2,1],["CYVR",2,1],["CYYC",1,0]],"WestJet":[["CYYC",3,1],["CYYZ",1,0],["CYVR",1,0]],"Aeroméxico":[["MMMX",4,1],["MMMY",1,0],["MMGL",1,0]],"Singapore Airlines":[["WSSS",1,1]],"Cathay Pacific":[["VHHH",1,1]],"ANA":[["RJTT",3,1],["RJAA",2,1],["RJBB",1,0]],"Japan Airlines":[["RJTT",3,1],["RJAA",2,1],["RJBB",1,0]],"Korean Air":[["RKSI",3,1],["RKSS",1,0]],"Thai Airways":[["VTBS",1,1]],"Emirates":[["OMDB",1,1]],"Qatar Airways":[["OTHH",1,1]],"LATAM Chile":[["SCEL",1,1]],"LATAM Ecuador":[["SEQM",1,0],["SEGU",1,0]],"Avianca":[["SKBO",4,1],["SKRG",1,0],["SKCL",1,0],["MSLP",1,0]],"Copa Airlines":[["MPTO",1,1]],"Aerolíneas Argentinas":[["SAEZ",2,1],["SABE",2,0],["SACO",1,0]],"JetSMART":[["SCEL",2,0],["SAEZ",1,0],["SPJC",1,0],["SKBO",1,0]],"Sky Airline":[["SCEL",2,0],["SPJC",1,0]],"Qantas":[["YSSY",3,1],["YMML",2,1],["YBBN",1,1],["YPPH",1,1]],"Jetstar":[["YMML",2,1],["YSSY",1,0],["YBBN",1,0],["YBCG",1,0],["YPPH",1,0]],"Virgin Australia":[["YBBN",2,0],["YSSY",1,0],["YMML",1,0],["YPPH",1,0]],"Air New Zealand":[["NZAA",3,1],["NZCH",1,0],["NZWN",1,0]],"Fiji Airways":[["NFFN",1,1]],"Jetstar Japan":[["RJAA",2,0],["RJBB",1,0]],"Ethiopian Airlines":[["HAAB",1,1]],"EgyptAir":[["HECA",1,1]],"Royal Air Maroc":[["GMMN",5,1],["GMMX",1,0],["GMTT",1,0]],"South African Airways":[["FAOR",3,1],["FACT",1,0]],"Airlink":[["FAOR",3,0],["FACT",1,0]],"FlySafair":[["FAOR",2,0],["FACT",2,0],["FALE",1,0]],"Kenya Airways":[["HKJK",1,1]],"RwandAir":[["HRYR",1,1]],"Air Algérie":[["DAAG",4,1],["DAOO",1,0]],"Tunisair":[["DTTA",1,1]],"TAAG Angola":[["FNBJ",1,1]],"Air Mauritius":[["FIMP",1,1]],"Air Peace":[["DNMM",3,1],["DNAA",1,0]],"Air Tanzania":[["HTDA",1,1]],"Air Côte d'Ivoire":[["DIAP",1,1]],"Uganda Airlines":[["HUEN",1,1]]};
const isWide=type=>/(A ?3[3-8][0-9]|7[4-8]7|Dreamliner)/i.test(String(type||""));
const regHash=reg=>{let h=0;const s=String(reg||"");for(let i=0;i<s.length;i++)h+=s.charCodeAt(i)*(i+1);return h};
function hubFor(a){const list=a&&HUBS[a.airline];if(!list)return null;let pool=isWide(a.type)?list.filter(x=>x[2]):list;if(!pool.length)pool=list;pool=[...pool].sort((x,y)=>y[1]-x[1]||(x[0]<y[0]?-1:1));
  const tot=pool.reduce((x,y)=>x+y[1],0);let k=regHash(a.registration)%tot;for(const [ic,w] of pool){if(k<w)return ic;k-=w}return pool[0][0]}
const HUB=Object.fromEntries(Object.entries(HUBS).map(([k,v])=>[k,v[0][0]]));

/* posição agora de todas as aeronaves (refeita quando chegam dados novos ou muda o minuto) */
let _pos={f:null,r:null,m:0,map:null};
function posMap(){
  const m=Math.floor(Date.now()/6e4);
  if(_pos.map&&_pos.f===data.flights&&_pos.r===data.reservations&&_pos.m===m)return _pos.map;
  const now=Date.now(),map={},tm={};
  for(const f of data.flights){if(f.createdAt>now)continue;if(!(f.aircraftId in tm)||f.createdAt>tm[f.aircraftId]){tm[f.aircraftId]=f.createdAt;map[f.aircraftId]=f.arr}}
  for(const r of data.reservations){if(!booked(r)||r.end>now)continue;if(!(r.aircraftId in tm)||r.end>tm[r.aircraftId]){tm[r.aircraftId]=r.end;map[r.aircraftId]=r.arr}}
  _pos={f:data.flights,r:data.reservations,m,map};return map;
}
/* Sem uma escala/voo anterior, a aeronave não tem posição operacional exibida. */
const posNow=id=>posMap()[id]||null;
/* onde a aeronave estará num instante (voos já feitos + reservas que terminam antes dele) */
function locAt(id,at,exceptId){
  let best=null,bt=-Infinity;
  for(const f of data.flights){if(f.aircraftId!==id||f.createdAt>at)continue;if(f.createdAt>bt){bt=f.createdAt;best=f.arr}}
  for(const r of data.reservations){if(r.aircraftId!==id||!booked(r)||r.id===exceptId||r.end>at)continue;if(r.end>bt){bt=r.end;best=r.arr}}
  return best||null;
}
/* próxima reserva depois de um instante: o voo novo precisa terminar onde ela começa */
/* aeronaves que estarão num aeroporto num instante, livres naquele momento */
function aircraftAt(icao,at){
  const moving=new Set(data.reservations.filter(r=>booked(r)&&r.start<=at&&r.end>Date.now()).map(r=>r.aircraftId));
  const busy=new Set(data.reservations.filter(r=>booked(r)&&r.start<at+2*H&&r.end>at).map(r=>r.aircraftId));
  for(const v of data.moves||[])if(v.end>Date.now())moving.add(v.aircraftId);
  return fleet.filter(a=>!busy.has(a.id)&&(moving.has(a.id)?locAt(a.id,at):posNow(a.id))===icao)}
/* reposicionamento pela companhia (sem piloto): em andamento agora? */
const movingNow=id=>{const now=Date.now();return (data.moves||[]).find(v=>v.aircraftId===id&&v.start<=now&&v.end>now)||null};
async function loadMoves(){if(!sb)return;try{const q=cols=>sb.from("aircraft_moves").select(cols).gt("end_at",new Date(Date.now()-60*864e5).toISOString()).order("end_at",{ascending:true}).limit(5000);
  let {data:d,error}=await q("id,aircraft_id,dep,arr,start_at,end_at,pilot_id,kind");
  if(error)({data:d,error}=await q("id,aircraft_id,dep,arr,start_at,end_at,pilot_id"));   /* 25_posicao_real.sql ainda não rodado */
  if(!error&&Array.isArray(d)){data.moves=d.map(v=>({id:v.id,aircraftId:v.aircraft_id,dep:v.dep,arr:v.arr,start:new Date(v.start_at).getTime(),end:new Date(v.end_at).getTime(),pilotId:v.pilot_id,kind:v.kind||"company"}));_pos.map=null}}catch(e){}}
/* posição atual veio da aeronave real (ADS-B)? devolve o registro da sincronização */
const realSynced=id=>{posMap();return _pos.src&&_pos.src[id]||null};
function nextAfter(id,at,exceptId){return data.reservations.filter(r=>r.aircraftId===id&&booked(r)&&r.id!==exceptId&&r.start>=at).sort((a,b)=>a.start-b.start)[0]||null}
const flyingNow=id=>{const now=Date.now();return data.reservations.find(r=>r.aircraftId===id&&booked(r)&&r.start<=now&&r.end>now)||null};
function posChip(id){const fl=flyingNow(id),mv=movingNow(id);
  if(mv&&!fl)return`<span class="loc fly" title="${esc(t("loc_moving_t",{t:fmtT(mv.end)}))}">🚚 ${esc(mv.dep)}→${esc(mv.arr)}</span>`;
  if(fl)return`<span class="loc fly" title="${esc(t("loc_flying_t"))}">✈ ${esc(fl.dep)}→${esc(fl.arr)}</span>`;
  const p=posNow(id),rs=realSynced(id);if(p&&rs)return`<span class="loc real" title="${esc(t("loc_real_t",{t:fmtT(rs.end)}))}">📡 ${esc(p)}</span>`;
  if(p)return`<span class="loc" title="${esc(t("loc_now_t"))}">📍 ${esc(p)}</span>`;
  const next=nextAfter(id,Date.now());
  if(next){const departure=next.start+(next.rosterId?20*6e4:0);return`<button type="button" class="loc loc-next" data-action="open-aircraft" data-id="${esc(id)}" title="${esc(t("loc_next_t",{t:fmt(departure)}))}"><span>${esc(next.dep)} → ${esc(next.arr)}</span><small>${esc(t("in_x",{x:rel(departure)}))}</small></button>`}
  return`<button type="button" class="loc loc-choose" data-action="go-roster" data-ac="${esc(id)}" data-free="1" title="${esc(t("loc_choose_t"))}" ${canWrite===false?'disabled':''}>✈ ${esc(t("loc_choose"))}</button>`}
function posLineHTML(id){const fl=flyingNow(id),p=posNow(id),rs=!fl&&p?realSynced(id):null;
  if(!fl&&!p)return '';
  return`<div class="pos-line">${fl?`<span>${t("loc_flying",{dep:wxCode(fl.dep),arr:wxCode(fl.arr),t:fmtT(fl.end)})}</span>`:`<span>${t("loc_now",{icao:wxCode(p)})}${rs?` <span class="chip real-sync" title="${esc(t("loc_real_t",{t:fmtT(rs.end)}))}">📡 ${t("loc_real")}</span>`:""}</span>`}</div>`}
/* formulário de reserva: saída presa na posição; chegada presa se já houver a próxima reserva */
function paintPosition(){
  const el=$("#bk-pos");if(!el)return;
  const id=$("#bk-ac").value,start=new Date($("#bk-start").value).getTime(),dep=$("#bk-dep"),arr=$("#bk-arr");
  if(!id||!start){el.innerHTML="";return}
  const end=start+Number($("#bk-dur").value||0)*H,loc=locAt(id,start),nx=nextAfter(id,end);
  const lines=[];let changed=false;
  if(loc){if(dep.value.toUpperCase()!==loc){dep.value=loc;changed=true}dep.readOnly=true;dep.classList.add("locked");
    lines.push(`<span>📍 ${t("bk_pos_dep",{reg:esc(acById(id)?.registration||id),icao:`<b>${esc(loc)}</b>`})}</span>`)}
  else{if(dep.classList.contains("locked")){dep.readOnly=false;dep.classList.remove("locked")}lines.push(`<span class="muted">${t("bk_pos_free")}</span>`)}
  if(nx){if(arr.value.toUpperCase()!==nx.dep){arr.value=nx.dep;changed=true}arr.readOnly=true;arr.classList.add("locked");
    lines.push(`<span>↪ ${t("bk_pos_arr",{icao:`<b>${esc(nx.dep)}</b>`,t:fmt(nx.start)})}</span>`)}
  else if(arr.classList.contains("locked")){arr.readOnly=false;arr.classList.remove("locked");if(arr.dataset.ev)arr.value=arr.dataset.ev}
  el.innerHTML=`<div class="pos-box">${lines.join("")}</div>`;
  if(changed){paintEstimate();if(typeof paintWxChips==="function")paintWxChips()}
}
function posCheck(acId,dep,arr,start,end){
  const loc=locAt(acId,start);if(loc&&loc!==dep)return t("err_pos",{reg:acById(acId)?.registration||acId,icao:loc});
  const nx=nextAfter(acId,end);if(nx&&nx.dep!==arr)return t("err_next",{icao:nx.dep,t:fmt(nx.start)});
  return null;
}

/* =====================================================================
   2. Manutenção programada (checks) — o banco cria o check sozinho ao fechar o voo (12_operacao.sql)
   ===================================================================== */
const CHECKS=[{k:"A",id:"chk-a",h:120,cyc:100,dur:8},{k:"C",id:"chk-c",h:1200,cyc:null,dur:48}];
CAT_BY_ID["chk-a"]={id:"chk-a",ata:5,t:["Scheduled A-check","Check A programado","Check A programado","Visite A programmée","Planmäßiger A-Check"]};
CAT_BY_ID["chk-c"]={id:"chk-c",ata:5,t:["Scheduled C-check","Check C programado","Check C programado","Visite C programmée","Planmäßiger C-Check"]};
const isCheck=d=>d.catalogId==="chk-a"||d.catalogId==="chk-c";
function checkState(id){
  const live=data.defects.filter(d=>d.aircraftId===id&&!d.voidedAt);
  const lastC=Math.max(-Infinity,...live.filter(d=>d.catalogId==="chk-c").map(d=>d.createdAt));
  const lastA=Math.max(lastC,...live.filter(d=>d.catalogId==="chk-a").map(d=>d.createdAt));
  const fl=data.flights.filter(f=>f.aircraftId===id);
  const since=t0=>{let m=0,c=0;for(const f of fl)if(f.createdAt>t0){m+=f.blockMin||0;c++}return{h:m/60,c}};
  const a=since(lastA),c=since(lastC);
  return{A:{leftH:Math.max(0,CHECKS[0].h-a.h),leftC:Math.max(0,CHECKS[0].cyc-a.c),last:isFinite(lastA)?lastA:null},C:{leftH:Math.max(0,CHECKS[1].h-c.h),last:isFinite(lastC)?lastC:null}};
}
function checkLineHTML(id){const s=checkState(id);
  return`<div class="chk-line" title="${esc(t("chk_rule"))}"><span>🔧 ${t("chk_next_a",{h:Math.ceil(s.A.leftH),c:s.A.leftC})}</span><span>${t("chk_next_c",{h:Math.ceil(s.C.leftH).toLocaleString(LOCALE[lang]||undefined)})}</span></div>`}

/* =====================================================================
   3. SimBrief: importar o último plano de voo (OFP) do piloto
   ===================================================================== */
const mySimbrief=()=>String(session?.user?.user_metadata?.simbrief||"").trim();
function simbriefOFPText(value){
 if(typeof value!=='string')return '';
 const strip=text=>text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'').replace(/<br\b[^>]*>/gi,'\n').replace(/<\/(?:div|p|pre|tr|h[1-6])\s*>/gi,'\n').replace(/<\/t[dh]\s*>/gi,'  ').replace(/<[^>]*>/g,'');
 const decoder=document.createElement('textarea');decoder.innerHTML=strip(value);return strip(decoder.value).replace(/\u00a0/g,' ').replace(/\r/g,'').trim();
}
function simbriefOFPPdf(j){
 for(const files of [j?.files,j?.fms_downloads]){
  const link=typeof files?.pdf==='string'?files.pdf:files?.pdf?.link;if(!link)continue;
  try{const url=new URL(link,files.directory||'https://www.simbrief.com/');if(url.protocol==='https:'&&!url.username&&!url.password&&(url.hostname==='simbrief.com'||url.hostname.endsWith('.simbrief.com')))return url.href}catch(e){}
 }return '';
}
function simbriefAlternate(j){const rows=Array.isArray(j?.alternate)?j.alternate:[j?.alternate];return rows.map(a=>String(a?.icao_code||'').trim().toUpperCase()).find(c=>/^[A-Z0-9]{4}$/.test(c)&&!['NONE','ZZZZ'].includes(c))||''}
async function fetchSimbrief(){
  const u=mySimbrief();if(!u)throw new Error("SB_NO_USER");
  const q=/^\d+$/.test(u)?"userid="+u:"username="+encodeURIComponent(u);let j=null;
  try{const r=await fetch("https://www.simbrief.com/api/xml.fetcher.php?json=1&"+q,{cache:"no-store"});j=await r.json()}
  catch(e){const {data:d,error}=await sb.functions.invoke("simbrief",{body:{user:u}});if(error)throw new Error("SB_NET");j=d}
  if(!j||!j.origin){const st=j&&j.fetch&&j.fetch.status;throw new Error("SB_ERR:"+(st||""))}
  const n=v=>Number(v)||0;
  return{dep:String(j.origin.icao_code||"").toUpperCase(),arr:String(j.destination.icao_code||"").toUpperCase(),alternate:simbriefAlternate(j),
    fno:((j.general.icao_airline||"")+(j.general.flight_number||"")).toUpperCase(),reg:String(j.aircraft.reg||"").toUpperCase(),type:j.aircraft.icaocode||"",
    out:n(j.times.sched_out)*1000,blockMin:Math.round(n(j.times.est_block)/60),route:String(j.general.route||""),level:String(j.general.initial_altitude||"").replace(/^FL/i,"").replace(/00$/,""),fuel:n(j.fuel&&j.fuel.plan_ramp),units:(j.params&&j.params.units)||"kgs",
    sid:String(j.general.sid_ident||''),star:String(j.general.star_ident||''),approach:String(j.general.approach||''),departureRunway:String(j.origin.plan_rwy||''),arrivalRunway:String(j.destination.plan_rwy||''),alternateRunway:String((Array.isArray(j.alternate)?j.alternate[0]:j.alternate)?.plan_rwy||''),alternateRoute:String((Array.isArray(j.alternate)?j.alternate[0]:j.alternate)?.route||''),alternateStar:String((Array.isArray(j.alternate)?j.alternate[0]:j.alternate)?.star_ident||''),alternateApproach:String((Array.isArray(j.alternate)?j.alternate[0]:j.alternate)?.approach||''),
    ofpText:simbriefOFPText(j.text?.plan_html||j.text?.plan_text||''),ofpPdf:simbriefOFPPdf(j),generatedAt:Number(j.params?.time_generated)*1000||0,
    dispatchId:String(j.params?.request_id||j.params?.time_generated||""),waypoints:(Array.isArray(j.navlog?.fix)?j.navlog.fix:[]).filter(f=>f.pos_lat!==""&&f.pos_lat!=null&&f.pos_long!==""&&f.pos_long!=null).map(f=>[Number(f.pos_lat),Number(f.pos_long)]).filter(p=>p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180)};
}
function sbErrMsg(e){const m=String(e&&e.message||e);
  if(m==="SB_NO_USER")return t("sb_need_user");if(m.startsWith("SB_ERR:"))return t("sb_err",{m:m.slice(7)||"—"});return t("sb_net")}
async function importSimbriefBooking(btn){
  btn.disabled=true;const label=btn.querySelector('[data-sb-label]')||btn,old=label.textContent;label.textContent=t("sb_loading");
  try{const p=await fetchSimbrief(),notes=[];
    const ac=fleet.find(a=>regKey(a.registration)===regKey(p.reg));
    if(ac){$("#bk-ac").value=ac.id;$("#bk-ac").dispatchEvent(new Event("change",{bubbles:true}))}else if(p.reg)notes.push(t("sb_reg_missing",{reg:p.reg}));
    if(p.out>Date.now())$("#bk-start").value=toLocalInput(p.out);
    const dep=$("#bk-dep"),arr=$("#bk-arr");
    if(!dep.readOnly)dep.value=p.dep;else if(dep.value!==p.dep)notes.push(t("sb_dep_diff",{dep:p.dep,loc:dep.value}));
    if(!arr.readOnly)arr.value=p.arr;else if(arr.value!==p.arr)notes.push(t("sb_arr_diff",{arr:p.arr,need:arr.value}));
    if(p.fno&&FNO_RE.test(normFno(p.fno))&&$("#bk-fno"))$("#bk-fno").value=normFno(p.fno);
    paintBookingStatus();paintEstimate();
    if(p.blockMin){const sel=$("#bk-dur"),want=p.blockMin/60;const o=[...sel.options].map(x=>Number(x.value)).filter(v=>v>=want-1e-6).sort((a,b)=>a-b)[0];if(o)sel.value=String(o);paintPosition()}
    if(typeof paintWxChips==="function")paintWxChips();
    const el=$("#bk-sb-note");if(el){el.hidden=false;el.innerHTML=`<b>${t("sb_ok",{dep:esc(p.dep),arr:esc(p.arr)})}</b>${notes.map(x=>`<br>• ${esc(x)}`).join("")}`}
  }catch(e){const el=$("#bk-sb-note");if(el){el.hidden=false;el.textContent=sbErrMsg(e)}}
  finally{btn.disabled=false;label.textContent=old}
}
async function importSimbriefReport(btn){
  btn.disabled=true;const old=btn.textContent;btn.textContent=t("sb_loading");const el=$("#rp-sb-note");
  try{const p=await fetchSimbrief();
    if(p.blockMin)$("#rp-block").value=`${Math.floor(p.blockMin/60)}:${String(p.blockMin%60).padStart(2,"0")}`;
    const rem=$("#rp-rem"),add=[p.route?t("sb_rem_route",{r:p.route}):"",p.fuel?t("sb_rem_fuel",{f:p.fuel.toLocaleString(LOCALE[lang]||undefined),u:p.units==="lbs"?"lb":"kg"}):""].filter(Boolean).join(" · ");
    if(add&&!rem.value.includes(p.route))rem.value=(rem.value?rem.value+"\n":"")+add.slice(0,600-rem.value.length-1);
    if(el){el.hidden=false;el.textContent=t("sb_rep_ok",{dep:p.dep,arr:p.arr})+(p.dep!==$("#rp-dep").value||p.arr!==$("#rp-arr").value?" "+t("sb_rep_diff"):"")}
  }catch(e){if(el){el.hidden=false;el.textContent=sbErrMsg(e)}}
  finally{btn.disabled=false;btn.textContent=old}
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-sb]");if(!b)return;e.preventDefault();
  if(b.dataset.sb==="booking")importSimbriefBooking(b);else if(b.dataset.sb==="report")importSimbriefReport(b)});

/* =====================================================================
   5. Carreira do piloto — só reconhecimento: nenhuma aeronave exige patente ou horas
   ===================================================================== */
const RANKS=[{h:0,k:"r_cadet",bars:0,wing:1},{h:5,k:"r_so",bars:2},{h:25,k:"r_fo",bars:3},{h:75,k:"r_sfo",bars:3,star:1},{h:150,k:"r_cpt",bars:4},{h:300,k:"r_scpt",bars:4,star:1},{h:600,k:"r_mcpt",bars:4,star:1,wing:1}];
function pilotStats(pid){
  const fl=data.flights.filter(f=>f.pilotId===pid&&f.verified!==false),res=r=>r&&data.reservations.find(x=>x.id===r);
  const min=fl.reduce((x,f)=>x+(f.blockMin||0),0),types=new Set(),als=new Set(),regs=new Set(),aps=new Set();let longest=0,ferry=0,ev=0;
  for(const f of fl){const a=acById(f.aircraftId);if(a){types.add(icaoType(a.type)||a.type);if(a.airline){als.add(a.airline);regs.add(regionOf(a.airline))}}
    aps.add(f.dep);aps.add(f.arr);longest=Math.max(longest,f.blockMin||0);const r=res(f.reservationId);if(r&&r.ferry)ferry++;if(r&&r.eventId)ev++}
  regs.delete("other");
  return{h:min/60,n:fl.length,types:types.size,airlines:als.size,regions:regs.size,airports:aps.size,longest,ferry,ev,reports:data.defects.filter(d=>d.reporterId===pid&&!isCheck(d)).length};
}
function rankOf(h){let r=RANKS[0];for(const x of RANKS)if(h>=x.h)r=x;const i=RANKS.indexOf(r);return{...r,next:RANKS[i+1]||null}}
const BADGES=[
  {k:"first",ok:s=>s.n>=1},{k:"f10",ok:s=>s.n>=10},{k:"f50",ok:s=>s.n>=50},{k:"f100",ok:s=>s.n>=100},
  {k:"h100",ok:s=>s.h>=100},{k:"long",ok:s=>s.longest>=480},{k:"types5",ok:s=>s.types>=5},{k:"airlines5",ok:s=>s.airlines>=5},
  {k:"world",ok:s=>s.regions>=4},{k:"ap20",ok:s=>s.airports>=20},{k:"ferry",ok:s=>s.ferry>=1},{k:"event",ok:s=>s.ev>=1},{k:"mech",ok:s=>s.reports>=5}];
const BADGE_ICON={first:"🛫",f10:"🔟",f50:"🎖️",f100:"🏆",h100:"⏱️",long:"🌙",types5:"🛩️",airlines5:"🏷️",world:"🌎",ap20:"🗺️",ferry:"🚚",event:"🤝",mech:"🔧"};
/* platina de ombro (dragona): listras douradas como nas companhias aéreas; estrela nas patentes sênior; asas no Cadete e no Comandante Master */
function insignia(r){
  const G="#E3B341",bars=Array.from({length:r.bars},(_,i)=>`<rect x="6.5" y="${44-i*5.2}" width="23" height="3" rx=".6" fill="${G}"/>`).join("");
  const star=r.star?`<path fill="${G}" d="M18 ${r.wing?16.5:21}l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z"/>`:"";
  const wy=r.bars?24:30,wing=r.wing?`<g fill="${G}"><circle cx="18" cy="${wy}" r="2.2"/><path d="M15.6 ${wy-1.2}c-3-.4-6.2-1.4-8.6-3 1.4 2.3 4.4 3.8 8.6 4.6zM20.4 ${wy-1.2}c3-.4 6.2-1.4 8.6-3-1.4 2.3-4.4 3.8-8.6 4.6zM15.6 ${wy+.4}c-2.4 0-4.6-.4-6.6-1.4 1.2 1.6 3.6 2.5 6.6 2.7zM20.4 ${wy+.4}c2.4 0 4.6-.4 6.6-1.4-1.2 1.6-3.6 2.5-6.6 2.7z"/></g>`:"";
  return`<span class="insignia" aria-hidden="true"><svg viewBox="0 0 36 52" width="36" height="52"><path d="M4 50V12.5Q4 9.5 6.6 8.2L16.2 3.1q1.8-.9 3.6 0l9.6 5.1Q32 9.5 32 12.5V50z" fill="#16202B" stroke="${G}" stroke-width="1.2"/><circle cx="18" cy="9.5" r="2.4" fill="${G}"/>${star}${wing}${bars}</svg></span>`}
function rankChip(pid){const r=rankOf(pilotStats(pid).h);return`<span class="rank-chip" title="${esc(t(r.k))}">${insignia(r)}${esc(t(r.k))}</span>`}
function careerHTML(pid){
  const s=pilotStats(pid),r=rankOf(s.h),earned=BADGES.filter(b=>b.ok(s));
  const pct=r.next?Math.min(100,Math.round((s.h-r.h)/(r.next.h-r.h)*100)):100;
  return`<div class="panel career"><div class="career-top">${insignia(r)}<div><span class="eyebrow">${t("car_rank")}</span><h3 style="margin:0">${esc(t(r.k))}</h3></div>
    <div class="career-next">${r.next?`<span class="muted">${t("car_next",{r:esc(t(r.next.k)),h:Math.ceil(r.next.h-s.h)})}</span><div class="covbar"><span style="width:${pct}%"></span></div>`:`<span class="muted">${t("car_top")}</span>`}</div></div>
    <p class="hint" style="margin:0">${t("car_note")}</p>
    <div class="rank-ladder">${RANKS.map(x=>`<div class="rl${x.k===r.k?" cur":s.h>=x.h?" done":""}" title="${esc(t(x.k))}">${insignia(x)}<b>${esc(t(x.k))}</b><small>${x.h} h</small></div>`).join("")}</div>
    <div><h3 style="margin:4px 0 8px">${t("car_badges",{a:earned.length,b:BADGES.length})}</h3><div class="badges">${BADGES.map(b=>{const on=b.ok(s);return`<div class="badge${on?" on":""}" title="${esc(t("bd_"+b.k+"_d"))}"><span class="b-ic">${BADGE_ICON[b.k]}</span><span><b>${esc(t("bd_"+b.k))}</b><small>${esc(t("bd_"+b.k+"_d"))}</small></span></div>`}).join("")}</div></div></div>`;
}

/* =====================================================================
   4. Avisos ao piloto: central no app + notificações do sistema (com o app aberto ou em segundo plano)
   ===================================================================== */
const NK=k=>"vfr-"+k+"-"+(myId||"");
const nGet=k=>{try{return new Set(JSON.parse(localStorage.getItem(NK(k))||"[]"))}catch(e){return new Set()}};
const nSet=(k,set)=>{try{localStorage.setItem(NK(k),JSON.stringify([...set].slice(-400)))}catch(e){}};
function notifItems(){
  if(!myId)return[];const now=Date.now(),out=[],mine=data.reservations.filter(r=>r.pilotId===myId);
  const reg=id=>acById(id)?.registration||id;
  for(const r of mine){
    if(booked(r)&&r.start>now&&r.start-now<=3*H)out.push({id:"soon:"+r.id,at:r.start-3*H,k:"soon",text:t("n_soon",{reg:reg(r.aircraftId),dep:r.dep,arr:r.arr,x:rel(r.start)})+(statusOf(r.aircraftId).key!=="ok"&&(!r.ackAt||ackStale(r))?" "+t("n_sign"):""),act:"bookings"});
    if(posConflict(r))out.push({id:"div:"+r.id+":"+posConflict(r),at:now-2,k:"cx",text:t("n_div",{reg:reg(r.aircraftId),loc:posConflict(r),dep:r.dep,t:fmt(r.start)}),act:"div",rid:r.id});
    if(booked(r)&&r.end<now)out.push({id:"open:"+r.id,at:r.end,k:"open",text:t("n_open",{reg:reg(r.aircraftId),dep:r.dep,arr:r.arr}),act:"bookings"});
    if(r.status==="cancelled_maintenance"&&r.start>now-12*H)out.push({id:"cx:"+r.id,at:r.start-1,k:"cx",text:t("n_cx",{reg:reg(r.aircraftId),t:fmt(r.start)}),act:"alt",rid:r.id});
    if(booked(r)&&r.end>now)for(const d of data.defects)if(d.aircraftId===r.aircraftId&&!d.voidedAt&&d.reporterId!==myId&&d.createdAt>(r.ackAt||0)&&d.createdAt>now-7*864e5)
      out.push({id:"def:"+d.id+":"+r.id,at:d.createdAt,k:"def",text:t("n_def",{reg:reg(r.aircraftId),title:defTitle(d),t:fmt(r.start)}),act:"aircraft",ac:r.aircraftId});
  }
  for(const e of (typeof EVENTS!=="undefined"?EVENTS:[])){
    if(e.start>now&&e.createdAt>now-7*864e5&&e.createdBy!==myId)out.push({id:"evnew:"+e.id,at:e.createdAt,k:"ev",text:t("n_ev_new",{title:e.title,t:fmt(e.start)}),act:"events"});
    if(e.start>now&&e.start-now<=24*H&&mine.some(r=>r.eventId===e.id&&booked(r)))out.push({id:"evsoon:"+e.id,at:e.start-24*H,k:"ev",text:t("n_ev_soon",{title:e.title,x:rel(e.start)}),act:"events"});
  }
  const s=pilotStats(myId),seenB=nGet("badges0");
  for(const b of BADGES)if(b.ok(s))out.push({id:"ach:"+b.k,at:now-1,k:"ach",text:t("n_ach",{b:t("bd_"+b.k)}),act:"logbook",quiet:!seenB.has("init")});
  return out.sort((a,b)=>b.at-a.at);
}
function paintBell(){
  const b=$("#bell");if(!b)return;if(!session){b.hidden=true;return}b.hidden=false;
  /* conquistas que o piloto já tinha antes desta versão não viram aviso */
  const s0=nGet("badges0");if(!s0.has("init")){const seen=nGet("seen");notifItems().forEach(n=>{if(n.k==="ach")seen.add(n.id)});nSet("seen",seen);s0.add("init");nSet("badges0",s0)}
  const seen=nGet("seen"),items=notifItems(),n=items.filter(i=>!seen.has(i.id)).length;
  b.querySelector(".bell-n").textContent=n>9?"9+":String(n);b.querySelector(".bell-n").hidden=!n;b.setAttribute("aria-label",t("n_title")+(n?` (${n})`:""));
  pushSystem(items,seen);
}
function sheetNotifs(){
  const seen=nGet("seen"),items=notifItems().filter(i=>!(i.k==="ach"&&seen.has(i.id)));
  const perm=("Notification" in window)?Notification.permission:"unsupported";
  openSheet("form",`${head(t("n_eb"),t("n_title"))}
   ${items.length?`<div class="notif-list">${items.map(i=>`<button type="button" class="notif${seen.has(i.id)?"":" new"}" data-action="notif-go" data-go="${i.act}" data-rid="${esc(i.rid||"")}" data-ac="${esc(i.ac||"")}"><span class="n-ic n-${i.k}" aria-hidden="true"></span><span>${esc(i.text)}</span></button>`).join("")}</div>`:`<p class="muted" style="margin:0">${t("n_none")}</p>`}
   <div class="panel" style="padding:12px"><b>${t("n_sys_h")}</b><span class="hint">${t("n_sys_hint")}</span>
    ${perm==="granted"?`<span class="chip ok">${t("n_sys_on")}</span>`:perm==="denied"?`<span class="hint">${t("n_sys_denied")}</span>`:perm==="unsupported"?`<span class="hint">${t("n_sys_unsup")}</span>`:`<button class="btn small" type="button" data-action="notif-perm">${t("n_sys_btn")}</button>`}</div>
   <div class="row"><button class="btn" type="button" data-action="close">${t("close")}</button></div>`);
  items.forEach(i=>seen.add(i.id));nSet("seen",seen);paintBell();
}
async function pushSystem(items,seen){
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  const sent=nGet("sent");let changed=false;
  for(const i of items){if(seen.has(i.id)||sent.has(i.id)||i.quiet)continue;sent.add(i.id);changed=true;
    try{const reg=await navigator.serviceWorker?.getRegistration();const opt={body:i.text,icon:"icons/icon-192.png",badge:"icons/icon-192.png",tag:i.id};
      if(reg&&reg.showNotification)reg.showNotification("Virtual Flight Report",opt);else new Notification("Virtual Flight Report",opt)}catch(e){}}
  if(changed)nSet("sent",sent);
}
document.addEventListener("click",async e=>{const el=e.target.closest("[data-action]");if(!el)return;const a=el.dataset.action;
  if(a==="bell")return sheetNotifs();
  if(a==="notif-perm"){try{await Notification.requestPermission()}catch(x){}closeSheet();sheetNotifs();return}
  if(a==="notif-go"){const g=el.dataset.go;closeSheet();
    if(g==="alt"&&el.dataset.rid)return sheetAlternatives(el.dataset.rid);
    if(g==="div"&&el.dataset.rid)return sheetDiversion(el.dataset.rid);
    if(g==="aircraft"&&el.dataset.ac)return paintAircraftSheet(el.dataset.ac);
    view=g==="logbook"?"logbook":g==="events"?"events":"bookings";if(g==="logbook")lbTab="mine";render()}
});
setInterval(()=>{if(session)paintBell()},60e3);

/* =====================================================================
   6. Mapa da frota (Leaflet + mapa da CARTO/OpenStreetMap)
   ===================================================================== */
let leafletP=null,MAPV={map:null,center:null,zoom:null,airline:"all"};
function loadLeaflet(){if(window.L)return Promise.resolve();if(leafletP)return leafletP;
  leafletP=new Promise((ok,no)=>{const css=document.createElement("link");css.rel="stylesheet";css.href="vendor/leaflet/leaflet.css";document.head.appendChild(css);
    const s=document.createElement("script");s.src="vendor/leaflet/leaflet.js";s.onload=()=>ok();s.onerror=()=>{leafletP=null;no(new Error("leaflet"))};document.head.appendChild(s)});
  return leafletP}
const apLL=c=>{const r=AIRPORTS&&AIRPORTS[c];return r?[r[0],r[1]]:null};
function gcPoint(a,b,f){const R=Math.PI/180,la1=a[0]*R,lo1=a[1]*R,la2=b[0]*R,lo2=b[1]*R;
  const d=2*Math.asin(Math.sqrt(Math.sin((la2-la1)/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin((lo2-lo1)/2)**2));if(!d)return a;
  const A=Math.sin((1-f)*d)/Math.sin(d),B=Math.sin(f*d)/Math.sin(d),x=A*Math.cos(la1)*Math.cos(lo1)+B*Math.cos(la2)*Math.cos(lo2),y=A*Math.cos(la1)*Math.sin(lo1)+B*Math.cos(la2)*Math.sin(lo2),z=A*Math.sin(la1)+B*Math.sin(la2);
  return[Math.atan2(z,Math.sqrt(x*x+y*y))/R,Math.atan2(y,x)/R]}
function bearing(a,b){const R=Math.PI/180,y=Math.sin((b[1]-a[1])*R)*Math.cos(b[0]*R),x=Math.cos(a[0]*R)*Math.sin(b[0]*R)-Math.sin(a[0]*R)*Math.cos(b[0]*R)*Math.cos((b[1]-a[1])*R);return(Math.atan2(y,x)/R+360)%360}
function mapData(){
  const live=typeof liveAcIds==="function"?liveAcIds():new Set();
  const now=Date.now(),flying=data.reservations.filter(r=>booked(r)&&r.start<=now&&r.end>now&&acById(r.aircraftId)&&!live.has(r.aircraftId)),fly=new Set([...flying.map(r=>r.aircraftId),...live]);
  const al=MAPV.airline,groups={};
  for(const a of fleet){if(al!=="all"&&a.airline!==al)continue;if(fly.has(a.id))continue;const p=posNow(a.id);if(!p)continue;(groups[p]=groups[p]||[]).push(a)}
  return{groups,flying:flying.filter(r=>al==="all"||acById(r.aircraftId).airline===al)};
}
function viewMap(){
  if(!db||!loaded.aircraft)return offline();
  return`<section class="map-screen"><div class="sec-head map-screen-toolbar"><h2>${t("map_title")}</h2><span class="map-chart-summary" id="map-chart-summary">${esc(typeof usChartT==='function'?(US_CHARTS[MAP_CHARTS.mode]?usChartT(MAP_CHARTS.mode):chartT(MAP_CHARTS.mode)):'')}</span>${alPickHTML("map",MAPV.airline)}<button type="button" class="btn map-charts-toggle" data-action="map-charts-toggle" aria-controls="map-charts-panel" aria-expanded="false">${NAV_ICON.manual}<span>${t('map_charts_button')}</span></button></div>
   ${typeof mapToolsHTML==="function"?mapToolsHTML():""}${typeof mapChartsHTML==="function"?mapChartsHTML():""}
   <div class="map-wrap"><div id="fleet-map" class="fleet-map" role="region" aria-label="${t("map_title")}"><div class="map-loading">${t("map_loading")}</div></div>
    <details class="panel map-side"><summary>${t("map_live_h")}</summary><div id="map-live">${typeof liveListHTML==="function"?liveListHTML():""}</div></details>
    <p class="hint" id="net-map-status" aria-live="polite"></p></div></section>`;
}
async function initMap(){
  const el=$("#fleet-map");if(!el)return;
  try{await Promise.all([loadLeaflet(),loadAirports()])}catch(e){el.innerHTML=`<div class="map-loading">${t("map_err")}</div>`;return}
  if(!el.isConnected)return;el.innerHTML="";
  if(MAPV.map){MAPV.center=MAPV.map.getCenter();MAPV.zoom=MAPV.map.getZoom();MAPV.map.remove()}
  const Lf=window.L;const m=Lf.map(el,{worldCopyJump:true,minZoom:2,zoomControl:true}).setView(MAPV.center||[-8,-20],MAPV.zoom||3);MAPV.map=m;
  /* mapas de fundo (OpenStreetMap, satélite, relevo) e tráfego VATSIM/IVAO, iguais aos da sala de briefing */
  m.setMaxZoom(19);
  if(typeof brfBaseLayers==="function"){
    const base=brfBaseLayers(Lf),bk=(()=>{try{return localStorage.getItem("vfr-map-base")}catch(e){return null}})();(base[bk]||base[t("brf_m_osm")]).addTo(m);
    MAPV.tfc={VATSIM:Lf.layerGroup([],{key:"VATSIM"}),IVAO:Lf.layerGroup([],{key:"IVAO"}),ADSB:Lf.layerGroup([],{key:"ADSB"})};
    const ov={[`<span class="tfc-k vat"></span> VATSIM`]:MAPV.tfc.VATSIM,[`<span class="tfc-k ivao"></span> IVAO`]:MAPV.tfc.IVAO,[`<span class="tfc-k real"></span> ${t("real_layer")}`]:MAPV.tfc.ADSB};
    let saved={};try{saved=JSON.parse(localStorage.getItem("vfr-map-ov")||"{}")}catch(e){}
    for(const lay of Object.values(ov))if(saved[lay.options.key]!==false)lay.addTo(m);
    MAPV.control=Lf.control.layers(base,ov,{collapsed:true,position:"topright"}).addTo(m);
    m.on("baselayerchange",e=>{try{localStorage.setItem("vfr-map-base",e.name)}catch(x){}});
    const sv=(e,on)=>{try{const s=JSON.parse(localStorage.getItem("vfr-map-ov")||"{}");s[e.layer.options.key]=on;localStorage.setItem("vfr-map-ov",JSON.stringify(s))}catch(x){}mapTraffic(true)};
    m.on("overlayadd",e=>sv(e,true));m.on("overlayremove",e=>sv(e,false));m.on("moveend",()=>mapTraffic());
    setTimeout(()=>mapTraffic(true),300)}
  else Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,className:"vfr-tl-map",attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m);
  const {groups,flying}=mapData(),css=getComputedStyle(document.documentElement),acc=css.getPropertyValue("--accent").trim()||"#0B6A93",bad=css.getPropertyValue("--bad").trim()||"#B42318",warn=css.getPropertyValue("--warn").trim()||"#8F5400";
  for(const [icao,list] of Object.entries(groups)){const ll=apLL(icao);if(!ll)continue;
    const nb=list.filter(a=>statusOf(a.id).key==="bad").length,nw=list.filter(a=>statusOf(a.id).key==="warn").length;
    const r=Math.min(24,5+Math.sqrt(list.length)*2.2);
    const mk=Lf.circleMarker(ll,{radius:r,color:nb?bad:nw?warn:acc,weight:nb||nw?3:1.5,fillColor:acc,fillOpacity:.55}).addTo(m);
    
    const name=(AIRPORTS[icao]||[])[3]||"";
    mk.bindTooltip(`<b>${esc(icao)}</b> ${esc(name)}<br>${t(list.length===1?"map_ac_1":"map_ac_n",{n:list.length})}${nb?` · <span style="color:${bad}">${nb} AOG</span>`:""}${nw?` · ${nw} MEL`:""}`);
    mk.bindPopup(()=>{const sorted=[...list].sort((a,b)=>a.registration.localeCompare(b.registration));
      return`<div class="map-pop"><b>${esc(icao)}</b> <span class="muted">${esc(name)}</span><div class="map-pop-l">${sorted.slice(0,60).map(a=>{const k=statusOf(a.id).key;return`<button type="button" data-ac="${esc(a.id)}">${regStack(a)}<span>${esc(icaoType(a.type)||a.type)} · ${esc(a.airline||"")}</span>${k!=="ok"?`<span class="pill ${k}">${stLabel(k)}</span>`:""}</button>`}).join("")}${sorted.length>60?`<span class="muted">+${sorted.length-60}</span>`:""}</div></div>`},{maxWidth:320});
    mapAirportWxBind(mk,icao);
  }
  const now=Date.now();
  for(const r of flying){const a=apLL(r.dep),b=apLL(r.arr);if(!a||!b)continue;const f=Math.min(1,Math.max(0,(now-r.start)/(r.end-r.start)));
    const pts=Array.from({length:41},(_,i)=>gcPoint(a,b,i/40)),p=gcPoint(a,b,f),q=gcPoint(a,b,Math.min(1,f+.01)),ac=acById(r.aircraftId);
    Lf.polyline(pts,{color:acc,weight:2,dashArray:"5 6",opacity:.8}).addTo(m);
    const icon=Lf.divIcon({className:"map-plane",html:`<svg viewBox="0 0 24 24" width="26" height="26" style="transform:rotate(${bearing(p,q)}deg)"><path fill="${acc}" stroke="#fff" stroke-width=".8" d="M12 2c.8 0 1.3.7 1.3 1.6v5.6l7.7 4.6v2l-7.7-2.3v4.6l2 1.5V21l-3.3-1-3.3 1v-1.4l2-1.5v-4.6L3 15.8v-2l7.7-4.6V3.6C10.7 2.7 11.2 2 12 2z"/></svg>`,iconSize:[26,26],iconAnchor:[13,13]});
    const mk=Lf.marker(p,{icon,title:ac.registration}).addTo(m);mk._vfr=r.id;
    mk.bindTooltip(`<b>${esc(ac.registration)}</b> ${esc(icaoType(ac.type)||ac.type)}<br>${esc(r.dep)} → ${esc(r.arr)}${r.flightNo?" · "+esc(r.flightNo):""}<br>${esc(pilot(r.pilotId))} · ${t("map_eta",{t:fmtT(r.end)})}`);
    if(typeof flightInfoBind==='function')flightInfoBind(mk,{source:'FlyVFR',callsign:r.flightNo,registration:ac.registration,type:ac.type,pilot:pilot(r.pilotId),dep:r.dep,arr:r.arr,aircraftId:r.aircraftId,lat:p[0],lon:p[1],estimated:true});
  }
  if(!MAPV.center){const pts=[...Object.keys(groups).map(apLL),...flying.flatMap(r=>[apLL(r.dep),apLL(r.arr)])].filter(Boolean);if(pts.length>1)m.fitBounds(pts,{padding:[30,30],maxZoom:6});else if(pts.length)m.setView(pts[0],5)}
  if(typeof drawLive==="function"){liveLayer=null;liveTrail=null;liveSel=null;drawLive(m);liveDrawn=[...liveAcIds()].sort().join()}
  m.on("popupopen",ev=>{const c=ev.popup.getElement();c&&c.addEventListener("click",x=>{const b=x.target.closest("[data-ac]");if(b){m.closePopup();paintAircraftSheet(b.dataset.ac)}})});
  if(typeof mapToolsInit==="function")await mapToolsInit(m,Lf);
  if(typeof mapRadarInit==="function"&&el.isConnected&&MAPV.map===m)mapRadarInit(m,Lf);
  if(typeof mapChartsInit==="function"&&el.isConnected&&MAPV.map===m)await mapChartsInit(m,Lf);
  if(typeof netMapInit==='function'&&el.isConnected&&MAPV.map===m&&MAPV.control)netMapInit(m,Lf,MAPV.control);
  setTimeout(()=>m.invalidateSize(),60);
}
document.addEventListener("change",e=>{if(e.target.id==="map-al"){MAPV.airline=e.target.value;render()}});
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="map-go"]');if(!b||!MAPV.map)return;
  const r=data.reservations.find(x=>x.id===b.dataset.r);if(!r)return;const a=apLL(r.dep),c=apLL(r.arr);if(!a||!c)return;
  const f=Math.min(1,Math.max(0,(Date.now()-r.start)/(r.end-r.start)));MAPV.map.setView(gcPoint(a,c,f),6)});

/* =====================================================================
   8. Eventos e voos em grupo
   ===================================================================== */
let EVENTS=[],eventsOk=true,evEdit=null;
async function loadEvents(){if(!sb)return;const {data:rows,error}=await sb.from("events").select("*").order("start_at");
  if(error){eventsOk=false;EVENTS=[];return}eventsOk=true;
  EVENTS=rows.map(r=>({id:r.id,title:r.title,desc:r.description||"",dep:r.dep||"",arr:r.arr||"",start:ms(r.start_at),createdBy:r.created_by,createdAt:ms(r.created_at)}))}
function viewEvents(){
  if(!db)return offline();
  const now=Date.now(),up=EVENTS.filter(e=>e.start>now-6*H).sort((a,b)=>a.start-b.start),past=EVENTS.filter(e=>e.start<=now-6*H).sort((a,b)=>b.start-a.start).slice(0,6);
  const card=e=>{const res=data.reservations.filter(r=>r.eventId===e.id&&(booked(r)||r.status==="completed")),mine=res.find(r=>r.pilotId===myId);
    return`<article class="panel ev-card" data-map-event-id="${esc(e.id)}"><div class="sec-head"><div><span class="eyebrow">${fmt(e.start)} · ${t("in_x",{x:e.start>now?rel(e.start):"—"})}</span><h3 style="margin:2px 0 0">${esc(e.title)}</h3></div>
      ${IS_ADMIN()?`<div class="row" style="gap:6px"><button class="btn small" data-action="ev-edit" data-id="${esc(e.id)}">${t("edit")}</button><button class="btn small danger" data-action="ev-del" data-id="${esc(e.id)}">${t("delete")}</button></div>`:""}</div>
      ${e.dep||e.arr?`<div class="mono ev-route">${e.dep?wxCode(e.dep):"—"} → ${e.arr?wxCode(e.arr):"—"}</div>`:""}
      ${e.desc?`<p style="margin:0;white-space:pre-line">${esc(e.desc)}</p>`:""}
      <div><b>${t(res.length===1?"ev_pilots_1":"ev_pilots_n",{n:res.length})}</b>${res.length?`<div class="ev-people">${res.map(r=>`<span class="ev-p">${regTag(acById(r.aircraftId),r.aircraftId)} ${esc(pilot(r.pilotId))}${r.flightNo?` <span class="mono muted">${esc(r.flightNo)}</span>`:""}</span>`).join("")}</div>`:""}</div>
      ${e.start>now?(mine?`<div class="banner ok"><span>${t("ev_you_in",{reg:esc(acById(mine.aircraftId)?.registration||"")})}</span></div>`:`<div class="row"><button class="btn primary" data-action="ev-book" data-id="${esc(e.id)}" ${canWrite===false?"disabled":""}>${t("ev_book")}</button></div>`):""}
    </article>`};
  const form=IS_ADMIN()?`<details class="panel" ${evEdit?"open":""}><summary><b>${t(evEdit?"ev_edit_h":"ev_new_h")}</b></summary>
    <form id="f-ev" style="display:grid;gap:12px;margin-top:12px">
     <label>${t("ev_title_l")}<input id="ev-title" required maxlength="80" value="${esc(evEdit?.title||"")}" placeholder="${t("ev_title_ph")}"></label>
     <div class="grid2"><label>${t("dep")} <span class="hint">${t("optional")}</span>${apInput("ev-dep","SBSP")}</label><label>${t("arr")} <span class="hint">${t("optional")}</span>${apInput("ev-arr","SBRJ")}</label></div>
     <label>${t("start_local")}<input id="ev-start" type="datetime-local" required value="${evEdit?toLocalInput(evEdit.start):""}"><small id="ev-start-utc" class="utc-eq"></small></label>
     <label>${t("ev_desc_l")} <span class="hint">${t("optional")}</span><textarea id="ev-desc" maxlength="600">${esc(evEdit?.desc||"")}</textarea></label>
     <p class="form-err" id="ev-err" hidden></p>
     <div class="row"><button class="btn primary" type="submit">${t(evEdit?"save":"ev_create")}</button>${evEdit?`<button class="btn" type="button" data-action="ev-cancel">${t("cancel")}</button>`:""}</div>
    </form></details>`:"";
  return`<div class="sec-head"><div><span class="eyebrow">${t("ev_eb")}</span><h2>${t("ev_title")}</h2></div></div>
   ${eventsOk?"":`<div class="notice">${t("ev_need_sql")}</div>`}
   ${form}
   ${up.length?`<div class="ev-grid">${up.map(card).join("")}</div>`:`<div class="panel"><p class="muted" style="margin:0">${t(IS_ADMIN()?"ev_none_admin":"ev_none")}</p></div>`}
   ${past.length?`<h3 style="margin:8px 0 0">${t("ev_past")}</h3><div class="ev-grid past">${past.map(card).join("")}</div>`:""}`;
}
async function submitEvent(form){
  const title=$("#ev-title").value.trim(),dep=apResolve($("#ev-dep").value),arr=apResolve($("#ev-arr").value),start=new Date($("#ev-start").value).getTime(),desc=$("#ev-desc").value.trim();
  if(!title)return err("#ev-err",t("ev_err_title"));if(!start)return err("#ev-err",t("err_past"));
  if((dep&&!/^[A-Z0-9]{3,4}$/.test(dep))||(arr&&!/^[A-Z0-9]{3,4}$/.test(arr)))return err("#ev-err",t("err_icao"));
  await busy(form,async()=>{const row={title,description:desc,dep,arr,start_at:new Date(start).toISOString()};
    must(evEdit?await sb.from("events").update(row).eq("id",evEdit.id):await sb.from("events").insert(row));
    evEdit=null;await loadEvents();render();toast(t("ev_saved"))});
}
document.addEventListener("submit",e=>{if(e.target.id==="f-ev"){e.preventDefault();submitEvent(e.target)}});
document.addEventListener("click",async e=>{const el=e.target.closest("[data-action]");if(!el)return;const a=el.dataset.action;
  if(a==="ev-book"){const ev=EVENTS.find(x=>x.id===el.dataset.id);if(!ev)return;
    sheetBooking(null,{dep:ev.dep,arr:ev.arr,start:ev.start,eventId:ev.id,note:esc(t("ev_bk_note",{title:ev.title}))});return}
  if(a==="ev-edit"){evEdit=EVENTS.find(x=>x.id===el.dataset.id)||null;render();setTimeout(()=>{if(evEdit){$("#ev-dep").value=evEdit.dep;$("#ev-arr").value=evEdit.arr;$("#f-ev").scrollIntoView({block:"center"})}},30);return}
  if(a==="ev-cancel"){evEdit=null;render();return}
  if(a==="ev-del"){if(el.dataset.sure!=="1"){el.dataset.sure="1";el.textContent=t("confirm_q");setTimeout(()=>{if(el.isConnected){el.dataset.sure="";el.textContent=t("delete")}},4000);return}
    const r=await sb.from("events").delete().eq("id",el.dataset.id);if(r.error){toast(t("err_save"));return}await loadEvents();render();toast(t("ev_deleted"))}
});

/* =====================================================================
   7. Painel do administrador
   ===================================================================== */
let BLOCKED=new Map(),admTab="aircraft",admQ="",admAc=null,meBlocked=false;
async function loadBlocked(){if(!sb||!myId)return;const {data:rows,error}=await sb.from("blocked_users").select("*");
  if(error){BLOCKED=new Map();meBlocked=false;return}BLOCKED=new Map(rows.map(r=>[r.user_id,r]));meBlocked=BLOCKED.has(myId)}
function viewAdmin(){
  if(!IS_ADMIN())return`<div class="panel"><p class="muted" style="margin:0">${t("adm_only")}</p></div>`;
  const seg=`<div class="seg">${["aircraft","reports","pilots"].map(k=>`<button data-action="adm-tab" data-v="${k}" aria-pressed="${admTab===k}">${t("adm_tab_"+k)}</button>`).join("")}</div>`;
  return`<div class="sec-head"><div><span class="eyebrow">${t("adm_eb")}</span><h2>${t("adm_title")}</h2></div>${seg}</div>
   <p class="hint" style="margin:0">${t("adm_hint")}</p>${admTab==="reports"?admReports():admTab==="pilots"?admPilots():admAircraft()}`;
}
function admAircraft(){
  const q=regKey(admQ),list=q?fleet.filter(a=>regKey(a.registration).includes(q)).slice(0,30):[];const a=admAc&&acById(admAc);
  return`<div class="panel"><label>${t("adm_find")}<input id="adm-q" class="up" value="${esc(admQ)}" placeholder="PR-XMA" autocomplete="off"></label>
    ${q?(list.length?`<div class="adm-list">${list.map(x=>`<button type="button" class="adm-row${x.id===admAc?" sel":""}" data-action="adm-pick" data-id="${esc(x.id)}">${regTag(x,"")}<span>${esc(x.type)} · ${esc(x.airline||"")}</span>${posChip(x.id)}</button>`).join("")}</div>`:`<p class="muted" style="margin:0">${t("no_match")}</p>`):""}</div>
   ${a?`<form class="panel" id="f-adm-ac" data-id="${esc(a.id)}"><h3 style="margin:0">${regTag(a,"",1)}</h3>
     <div class="grid2"><label>${t("ac_type")}<input id="aa-type" required maxlength="40" value="${esc(a.type)}"></label><label>${t("airline")}<input id="aa-airline" maxlength="40" value="${esc(a.airline||"")}" list="airline-list2"><datalist id="airline-list2">${airlines().map(x=>`<option value="${esc(x)}">`).join("")}</datalist></label></div>
     <p class="form-err" id="aa-err" hidden></p>
     <div class="row"><button class="btn primary" type="submit">${t("save")}</button><button class="btn danger" type="button" data-action="adm-del-ac" data-id="${esc(a.id)}">${t("adm_del_ac")}</button></div>
     <p class="hint" style="margin:0">${t("adm_del_warn")}</p></form>`:""}`;
}
function admReports(){
  const list=[...data.defects].sort((a,b)=>b.createdAt-a.createdAt).slice(0,80);
  return`<div class="panel">${list.length?`<div class="adm-list">${list.map(d=>`<div class="adm-rep${d.voidedAt?" void":""}"><div style="min-width:0"><div class="row" style="gap:8px">${regTag(acById(d.aircraftId),d.aircraftId)}<b>${esc(defTitle(d))}</b><span class="chip ${d.outcome==="grounded"?"bad":d.outcome==="deferred"?"warn":"ok"}">${t("out_"+d.outcome)}</span>${d.voidedAt?`<span class="chip neutral">${t("adm_voided")}</span>`:""}</div>
      <div class="muted" style="font-size:.82rem">${esc(pilot(d.reporterId))} · ${fmt(d.createdAt)}${d.description?" · "+esc(d.description):""}</div></div>
      <button class="btn small${d.voidedAt?"":" danger"}" data-action="${d.voidedAt?"adm-unvoid":"adm-void"}" data-id="${esc(d.id)}">${t(d.voidedAt?"adm_restore":"adm_void")}</button></div>`).join("")}</div>`:`<p class="muted" style="margin:0">${t("nothing_rep")}</p>`}</div>`;
}
function admPilots(){
  const ids=new Set(Object.keys(names));data.flights.forEach(f=>ids.add(f.pilotId));
  const rows=[...ids].filter(Boolean).map(id=>({id,n:data.flights.filter(f=>f.pilotId===id).length,min:data.flights.filter(f=>f.pilotId===id&&f.verified!==false).reduce((x,f)=>x+(f.blockMin||0),0)})).sort((a,b)=>(names[a.id]||"").localeCompare(names[b.id]||""));
  return`<div class="panel"><div class="scroll"><table class="lb-t"><thead><tr><th>${t("lb_pilot")}</th><th class="num">${t("lb_flights")}</th><th class="num">${t("lb_hours")}</th><th></th></tr></thead><tbody>
   ${rows.map(r=>{const b=BLOCKED.get(r.id);return`<tr><td>${esc(names[r.id]||"—")} ${r.id===myId?`<span class="muted">(${t("you")})</span>`:""}${b?` <span class="chip bad">${t("adm_blocked")}</span>`:""}</td><td class="num mono">${r.n}</td><td class="num mono">${block(r.min)}</td>
    <td>${r.id===myId?"":`<button class="btn small${b?"":" danger"}" data-action="${b?"adm-unblock":"adm-block"}" data-id="${esc(r.id)}">${t(b?"adm_unblock":"adm_block")}</button>`}</td></tr>`}).join("")}</tbody></table></div>
   <p class="hint" style="margin:0">${t("adm_block_hint")}</p></div>`;
}
async function admRun(fn,okMsg){try{const r=await fn();if(r&&r.error)throw r.error;toast(okMsg)}catch(e){console.error(e);toast(/permission|row-level|42501/i.test(String(e.message||e.code))?t("adm_need_sql"):t("err_save"))}}
const confirmTwice=el=>{if(el.dataset.sure==="1")return true;el.dataset.sure="1";const o=el.textContent;el.textContent=t("confirm_q");setTimeout(()=>{if(el.isConnected){el.dataset.sure="";el.textContent=o}},4000);return false};
let admT=null;
document.addEventListener("input",e=>{if(e.target.id==="adm-q"){admQ=e.target.value;clearTimeout(admT);admT=setTimeout(()=>{const q0=$("#adm-q"),pos=q0?q0.selectionStart:0;render();const q=$("#adm-q");if(q){q.focus();q.setSelectionRange(pos,pos)}},250)}});
document.addEventListener("submit",async e=>{if(e.target.id!=="f-adm-ac")return;e.preventDefault();const f=e.target,id=f.dataset.id;
  const type=$("#aa-type").value.trim(),airline=$("#aa-airline").value.trim();
  if(!type)return err("#aa-err",t("err_save"));
  await busy(f,async()=>{must(await sb.from("aircraft").update({type,airline}).eq("registration",id).select("registration").single());await load("aircraft");render();toast(t("adm_saved"))})});
document.addEventListener("click",async e=>{const el=e.target.closest("[data-action]");if(!el)return;const a=el.dataset.action,id=el.dataset.id;
  if(a==="adm-tab"){admTab=el.dataset.v;return render()}
  if(a==="adm-pick"){admAc=id;return render()}
  if(a==="adm-del-ac"){if(!confirmTwice(el))return;await admRun(()=>sb.from("aircraft").delete().eq("registration",id).select("registration").single(),t("adm_deleted"));admAc=null;await Promise.all(["aircraft","reservations","flights","defects"].map(load));return render()}
  if(a==="adm-void"||a==="adm-unvoid"){if(a==="adm-void"&&!confirmTwice(el))return;
    await admRun(()=>sb.from("defects").update(a==="adm-void"?{voided_at:new Date().toISOString(),voided_by:myId}:{voided_at:null,voided_by:null}).eq("id",id).select("id").single(),t(a==="adm-void"?"adm_void_ok":"adm_restore_ok"));await load("defects");return render()}
  if(a==="adm-block"||a==="adm-unblock"){if(a==="adm-block"&&!confirmTwice(el))return;
    await admRun(()=>a==="adm-block"?sb.from("blocked_users").insert({user_id:id}):sb.from("blocked_users").delete().eq("user_id",id),t(a==="adm-block"?"adm_block_ok":"adm_unblock_ok"));await loadBlocked();return render()}
});


/* =====================================================================
   Desvios: a aeronave pousou em outro aeroporto e uma reserva futura deixou de bater com a posição
   ===================================================================== */
function posConflict(r){if(!booked(r)||r.start<=Date.now())return null;const loc=locAt(r.aircraftId,r.start,r.id);return loc&&loc!==r.dep?loc:null}
const myConflicts=()=>data.reservations.filter(r=>r.pilotId===myId&&posConflict(r));
function divNotices(){return myConflicts().map(r=>`<div class="notice alt-notice"><span>${t("div_notice",{reg:`${regTag(acById(r.aircraftId),r.aircraftId)}`,loc:esc(posConflict(r)),dep:esc(r.dep),t:fmt(r.start)})}</span>
  <span class="row" style="gap:6px"><button class="btn small primary" data-action="div-open" data-id="${esc(r.id)}">${t("div_solve")}</button></span></div>`)}
/* janela para um traslado antes da reserva: depois da reserva anterior e pelo menos 45 min a partir de agora */
function ferryWindow(r,loc){
  const prev=data.reservations.filter(x=>x.aircraftId===r.aircraftId&&booked(x)&&x.id!==r.id&&x.end<=r.start).sort((a,b)=>b.end-a.end)[0];
  const from=Math.ceil(Math.max(Date.now()+45*6e4,prev?prev.end:0,releaseAt(r.aircraftId,Date.now())||0)/6e4)*6e4;
  const est=bookingEstimate(r.aircraftId,loc,r.dep),min=est&&!est.missing?est.minMin:60;
  return{from,min,fits:from+min*6e4<=r.start}
}
async function sheetDiversion(resId){
  const r=data.reservations.find(x=>x.id===resId);if(!r)return;await loadAirports();
  const loc=posConflict(r),a=acById(r.aircraftId);if(!loc){toast(t("div_solved"));return}
  const fw=ferryWindow(r,loc),list=altAircraft(r);
  const card=({a:x,same})=>`<div class="alt-card">${planeImg(x,"sm")}<div style="min-width:0"><div class="row" style="gap:8px">${regTag(x,"")}<span class="chip ${same?"ok":"warn"}">${t(same?"alt_same_type":"alt_same_family")}</span></div><div class="muted" style="font-size:.85rem">${esc(x.type)} · ${esc(x.airline||"")}</div></div>
    <button class="btn small primary" data-action="div-alt" data-id="${esc(r.id)}" data-ac="${esc(x.id)}">${t("alt_book")}</button></div>`;
  openSheet("form",`${head(t("div_eb"),t("div_title"))}
   <div class="banner warn"><strong>${t("div_intro",{reg:esc(a?.registration||r.aircraftId),loc:esc(loc),dep:esc(r.dep),arr:esc(r.arr),t:fmt(r.start)})}</strong></div>
   <div class="panel" style="padding:14px"><h3 style="margin:0">1. ${t("div_opt_ferry")}</h3>
    ${fw.fits?`<p style="margin:0">${t("div_ferry_txt",{loc:esc(loc),dep:esc(r.dep),t:fmt(fw.from),d:hm(fw.min)})}</p><div class="row"><button class="btn primary" data-action="div-ferry" data-id="${esc(r.id)}">${t("div_ferry_btn",{loc:esc(loc),dep:esc(r.dep)})}</button></div>`
      :`<p class="muted" style="margin:0">${t("div_ferry_no",{loc:esc(loc),dep:esc(r.dep)})}</p>`}</div>
   <div class="panel" style="padding:14px"><h3 style="margin:0">2. ${t("div_opt_alt",{dep:esc(r.dep)})}</h3>
    ${list.length?`<div class="alt-list">${list.map(card).join("")}</div>`:`<p class="muted" style="margin:0">${t("div_alt_none",{dep:esc(r.dep)})}</p>`}</div>
   <p class="hint" style="margin:0">${t("div_wait")}</p>
   <div class="row"><button class="btn" type="button" data-action="close">${t("close")}</button></div>`);
}
/* quem desviou: avisa quantas reservas foram afetadas e oferece levar a aeronave de volta */
function afterDiversion(r,arr){
  const hit=data.reservations.filter(x=>x.aircraftId===r.aircraftId&&posConflict(x)),a=acById(r.aircraftId),nx=hit.sort((x,y)=>x.start-y.start)[0];
  openSheet("form",`${head(t("div_eb"),t("div_you_title"))}
   <div class="banner ${hit.length?"warn":"ok"}"><strong>${t("div_you_intro",{reg:esc(a?.registration||r.aircraftId),arr:esc(arr),plan:esc(r.arr)})}</strong>
    <span>${hit.length?t(hit.length===1?"div_you_hit_1":"div_you_hit_n",{n:hit.length}):t("div_you_none")}</span></div>
   ${hit.length?`<p style="margin:0">${t("div_you_offer",{arr:esc(arr),dep:esc(nx.dep)})}</p>`:""}
   <div class="row">${hit.length?`<button class="btn primary" data-action="div-back" data-ac="${esc(r.aircraftId)}" data-dep="${esc(arr)}" data-arr="${esc(nx.dep)}">${t("div_ferry_btn",{loc:esc(arr),dep:esc(nx.dep)})}</button>`:""}<button class="btn" type="button" data-action="close">${t("close")}</button></div>`);
}
document.addEventListener("click",e=>{const el=e.target.closest("[data-action]");if(!el)return;const a=el.dataset.action;
  if(a==="div-open"){closeSheet();sheetDiversion(el.dataset.id);return}
  if(a==="div-ferry"){const r=data.reservations.find(x=>x.id===el.dataset.id);if(!r)return;const loc=posConflict(r),fw=ferryWindow(r,loc);closeSheet();
    sheetBooking(r.aircraftId,{ferry:true,dep:loc,arr:r.dep,start:fw.from,durH:Math.ceil(fw.min/30)/2,note:esc(t("div_ferry_note",{t:fmt(r.start)}))});return}
  if(a==="div-alt"){const r=data.reservations.find(x=>x.id===el.dataset.id);if(!r)return;closeSheet();
    sheetBooking(el.dataset.ac,{flightNo:r.flightNo,dep:r.dep,arr:r.arr,start:r.start,durH:Math.round((r.end-r.start)/6e4)/60,replaceId:r.id,note:esc(t("div_alt_note",{reg:acById(r.aircraftId)?.registration||r.aircraftId}))});return}
  if(a==="div-back"){closeSheet();sheetBooking(el.dataset.ac,{ferry:true,dep:el.dataset.dep,arr:el.dataset.arr});return}
});

/* =====================================================================
   Pinturas para simulador (flightsim.to): liveries.json traz, por matrícula, as pinturas que citam a matrícula exata
   ===================================================================== */
let LIVERIES=null,livP=null;
let fLiv=(()=>{try{return localStorage.getItem("vfr-fliv")!=="0"}catch(e){return true}})();
function loadLiveries(){if(LIVERIES)return Promise.resolve(LIVERIES);if(livP)return livP;
  livP=fetch("liveries.json?v=3").then(r=>r.ok?r.json():{}).then(j=>{LIVERIES=j.regs||{};LIV_S=j.sims||[];LIV_B=j.bases||[];LIVERIES_AT=j.at||null;render();return LIVERIES}).catch(()=>{LIVERIES={};return LIVERIES});return livP}
let LIV_S=[],LIV_B=[];
let LIVERIES_AT=null;
const livOf=id=>{const a=acById(id);return LIVERIES&&a?(LIVERIES[a.registration]||[]):[]};
const hasLivery=id=>livOf(id).length>0;
const SIMLBL={MSFS2020:"MSFS 2020",MSFS2024:"MSFS 2024","MSFS2020/24":"MSFS 2020/24",XP12:"X-Plane 12",XP11:"X-Plane 11",XP:"X-Plane"};
function livHref(id,e){const reg=((acById(id)||{}).registration||"").toLowerCase();return e[3]===1?`https://forums.x-plane.org/files/file/${e[0]}-${encodeURIComponent(reg)}/`:`https://flightsim.to/addon/${e[0]}/${encodeURIComponent(reg)}`}
const SIM_OK={msfs2020:["MSFS2020","MSFS2020/24"],msfs2024:["MSFS2024","MSFS2020/24","MSFS2020"],xp11:["XP11","XP"],xp12:["XP12","XP"]};
/* só as pinturas dos simuladores que o piloto marcou no cadastro (sem simulador marcado: mostra todas) */
function myLivOf(id){const L=livOf(id),m=typeof mySims==="function"?mySims():[];if(!m.length)return L;
  const ok=new Set(m.flatMap(k=>SIM_OK[k]||[]));return L.filter(x=>ok.has(LIV_S[x[1]]))}
function bestLivery(id){const L=myLivOf(id);if(!L.length)return null;const m=typeof mySims==="function"?mySims():[];
  const rank=x=>{let r=9;for(const k of m){const i=(SIM_OK[k]||[]).indexOf(LIV_S[x[1]]);if(i>=0&&i<r)r=i}return r};   // pintura feita para o simulador primeiro
  const e=[...L].sort((a,b)=>rank(a)-rank(b))[0];const sim=LIV_S[e[1]]||"";return{href:livHref(id,e),sim:SIMLBL[sim]||sim||(e[3]===1?"X-Plane":"MSFS"),n:L.length}}
function planeLinked(a,cls){const img=planeImg(a,cls);if(!a||!LIVERIES)return img;const b=bestLivery(a.id);if(!b)return img;
  return`<a class="pic-liv" href="${b.href}" target="_blank" rel="noopener" title="${esc(t("liv_open_t",{s:b.sim}))}">${img}</a>`}
function liverySourceHTML(xp){return`<span class="livery-source" data-simulator-text-only><img class="livery-site-icon${xp?' livery-org-logo':''}" src="img/brand/${xp?'x-plane-org.jpg':'flightsim-to.png'}" alt="" width="${xp?76:20}" height="20">${xp?'x-plane.org':'flightsim.to'}</span>`}
function liveryHTML(id,compact=false){
  if(!LIVERIES){loadLiveries();return""}
  const L=myLivOf(id),all=livOf(id).length,m=typeof mySims==="function"?mySims():[];
  const forLine=m.length?`<p class="hint" style="margin:0 0 6px">${t("liv_for",{s:esc(m.map(k=>SIMS[k]||t("sim_other")).join(", "))})} · <button class="linkish" type="button" data-action="my-sims">${t("liv_change")}</button></p>`:"";
  return`<div class="liv"><h3 style="margin:0 0 6px">${t("liv_h",{n:L.length})}</h3>${forLine}
   ${L.length?`<div class="liv-list">${L.map(([lid,si,bi,src])=>{const sim=LIV_S[si]||"",base=LIV_B[bi]||"",xp=src===1;const href=livHref(id,[lid,si,bi,src]);return`<a class="liv-i" href="${href}" target="_blank" rel="noopener"><span class="chip neutral">${esc(SIMLBL[sim]||sim||(xp?"X-Plane":"MSFS"))}</span><span><b>${esc(base||(xp?"X-Plane":"Livery"))}</b><small>${liverySourceHTML(xp)} #${lid}</small></span><span aria-hidden="true">↗</span></a>`}).join("")}</div>`
     :`<p class="muted" style="margin:0">${t(all&&m.length?"liv_none_mine":"liv_none")}</p>`}
   ${compact&&!L.length?'':`<p class="hint" data-simulator-text-only style="margin:6px 0 0">${t(compact?'rs_livery_download_hint':'liv_src')}</p>`}</div>`;
}
document.addEventListener("click",e=>{const el=e.target.closest('[data-action="f-liv"]');if(!el)return;fLiv=!fLiv;try{localStorage.setItem("vfr-fliv",fLiv?"1":"0")}catch(x){}fLimit=60;render()});

/* tráfego VATSIM/IVAO no menu Mapa (função "traffic" do servidor; os voos FlyVFR já aparecem pelo mapa ao vivo) */
let mapTfcBusy=false,mapTfcAt=0;
async function mapTraffic(force){
  const m=MAPV.map;if(!m||!MAPV.tfc||view!=="map")return;
  const on=["VATSIM","IVAO"].filter(n=>m.hasLayer(MAPV.tfc[n]));if(MAPV.focusReg&&Date.now()-(MAPV.focusAt||(MAPV.focusAt=Date.now()))>6e4){MAPV.focusReg=null;MAPV.focusAt=0}
  const draw=()=>{if(!MAPV.tfc)return;const Lf=window.L,bb=m.getBounds().pad(.2),z=m.getZoom();for(const n of ["VATSIM","IVAO","ADSB"])MAPV.tfc[n].clearLayers();
    const alSel=MAPV.airline&&MAPV.airline!=="all";
    if(z<4&&!alSel)return;
    /* filtro de companhia: indicativo começando pelo código ICAO dela (ex.: GLO1234, TAM3054) */
    const al=MAPV.airline&&MAPV.airline!=="all"?MAPV.airline:null,code=al?String(AIRLINE_ICAO[al]||"").toUpperCase():"",re=code?new RegExp("^"+code+"\\d"):null;
    for(const p of [...(MAPV.tfcData||[]),...(z>=7?MAPV.realData||[]:[])]){const g=MAPV.tfc[p.net==="REAL"?"ADSB":p.net];if(!g||!m.hasLayer(g)||!bb.contains([p.lat,p.lon]))continue;
      if(al&&!(re&&re.test(String(p.cs||"").toUpperCase())))continue;
      const mk=Lf.marker([p.lat,p.lon],{icon:tfcIcon(Lf,p,p.net==="VATSIM"?"vat":p.net==="IVAO"?"ivao":"real",z),zIndexOffset:p.reg&&p.reg===MAPV.focusReg?1500:0}).bindTooltip(p.net==="REAL"&&typeof realTip==="function"?realTip(p):tfcTip(p)).addTo(g);
      if(typeof flightInfoBind==='function')flightInfoBind(mk,flightInfoTraffic(p));
      if(p.reg&&p.reg===MAPV.focusReg)setTimeout(()=>mk.openTooltip(),50)}};
  const alSel=MAPV.airline&&MAPV.airline!=="all",pre=alSel?String(AIRLINE_ICAO[MAPV.airline]||"").toUpperCase():"";
  draw();
  /* tráfego real (ADS-B): só com o mapa aproximado */
  if(m.hasLayer(MAPV.tfc.ADSB)&&m.getZoom()>=7&&typeof realArea==="function"){realArea(m).then(l=>{MAPV.realData=l;draw()})}
  if(!on.length||(m.getZoom()<4&&!alSel)||(alSel&&!pre))return;
  const now=Date.now();if(!force&&now-mapTfcAt<15e3)return;if(mapTfcBusy)return;mapTfcBusy=true;mapTfcAt=now;
  try{const bb=m.getBounds().pad(.3);const {data:d,error}=await sb.functions.invoke("traffic",{body:{bbox:m.getZoom()<4?[-90,-180,90,180]:[bb.getSouth(),bb.getWest(),bb.getNorth(),bb.getEast()],nets:on,...(pre?{prefix:pre}:{})}});
    if(!error)MAPV.tfcData=(d&&d.pilots)||[];else if(/not found|404|Failed to send|FunctionsFetchError|FunctionsHttpError/i.test(String(error.message||error)))toast(t("brf_m_tfc_missing"))}catch(e){}finally{mapTfcBusy=false}
  draw()}
setInterval(()=>{if(view==="map"&&MAPV.map&&!document.hidden)mapTraffic()},20e3);

/* ---------- seletor de companhia com o ícone de cada uma (substitui o menu suspenso comum) ---------- */
const ALP={};
function alPickHTML(k,cur){const all=cur==="all"||!cur,n=fleet.filter(a=>!all&&a.airline===cur).length;
  return`<div class="alpick" data-k="${k}"><button type="button" class="alpick-btn" data-action="alpick-open" data-k="${k}" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(t("airline"))}">
    ${all?`<span class="alpick-all">✈</span><span${k==="rs"?' class="muted"':""}>${t(k==="rs"?"al_choose":"all_airlines")}</span>`:`${alSym(cur)}<span>${esc(cur)}</span>`}<span class="alpick-caret" aria-hidden="true">▾</span></button>
    <div class="alpick-pop" hidden><input type="search" class="alpick-q" data-k="${k}" placeholder="${esc(t("alp_search"))}" autocomplete="off" spellcheck="false"><div class="alpick-list" role="listbox"></div></div></div>`}
function alPickList(k,q){const cnt={};fleet.forEach(a=>{if(a.airline)cnt[a.airline]=(cnt[a.airline]||0)+1});
  const Q=norm(q||"").trim();let list=airlines().filter(x=>!Q||norm(x).includes(Q));const cur=k==="map"?MAPV.airline:k==="brief-map"?(BRF.mapAirline||"all"):(typeof ACP!=="undefined"&&ACP[k]?ACP[k].al||"all":"");
  /* Na escala, companhias com aeronaves favoritas precedem os demais grupos. */
  const favAls=k==="rs"?new Set(fleet.filter(a=>isFav(a.id)).map(a=>a.airline)):new Set();
  const favorites=list.filter(x=>favAls.has(x));list=list.filter(x=>!favAls.has(x));
  const pri=k==="rs"&&typeof RS!=="undefined"&&!RS.other&&!Q&&typeof RS_HOME!=="undefined"&&RS_HOME.als?RS_HOME.als.filter(x=>list.includes(x)):[];
  const opt=x=>`<button type="button" class="alpick-o${cur===x?" on":""}" data-action="alpick-pick" data-k="${k}" data-v="${esc(x)}" role="option">${alSym(x)||'<span class="alpick-all">·</span>'}<span>${esc(x)}</span><small>${cnt[x]||0}</small></button>`;
  const favoriteGroup=favorites.length?`<div class="acp-g">★ ${esc(t("fav_group"))}</div>${favorites.map(opt).join("")}`:"";
  if(pri.length){list=list.filter(x=>!pri.includes(x));return favoriteGroup+`<div class="acp-g">${esc(RS_HOME.label)}</div>${pri.map(opt).join("")}<div class="acp-g">${esc(t("all_airlines"))}</div>`
    +(k==="rs"?"":`<button type="button" class="alpick-o${cur==="all"?" on":""}" data-action="alpick-pick" data-k="${k}" data-v="all" role="option"><span class="alpick-all">✈</span><span>${t("all_airlines")}</span><small>${fleet.length}</small></button>`)+list.map(opt).join("")}
  return favoriteGroup+(favorites.length&&list.length?`<div class="acp-g">${esc(t("all_airlines"))}</div>`:"")+(Q||k==="rs"?"":`<button type="button" class="alpick-o${cur==="all"?" on":""}" data-action="alpick-pick" data-k="${k}" data-v="all" role="option"><span class="alpick-all">✈</span><span>${t("all_airlines")}</span><small>${fleet.length}</small></button>`)
    +list.map(x=>`<button type="button" class="alpick-o${cur===x?" on":""}" data-action="alpick-pick" data-k="${k}" data-v="${esc(x)}" role="option">${alSym(x)||'<span class="alpick-all">·</span>'}<span>${esc(x)}</span><small>${cnt[x]||0}</small></button>`).join("")
    +(list.length||favorites.length?"":`<p class="muted" style="margin:6px 8px">${t("acp_none")}</p>`)}
function alPickClose(){document.querySelectorAll(".alpick .alpick-pop").forEach(p=>{p.hidden=true;const b=p.parentElement.querySelector(".alpick-btn");if(b)b.setAttribute("aria-expanded","false")})}
document.addEventListener("click",e=>{
  const b=e.target.closest('[data-action="alpick-open"],[data-action="alpick-pick"]');
  if(!b){if(!e.target.closest(".alpick"))alPickClose();return}
  const k=b.dataset.k,box=b.closest(".alpick");
  if(b.dataset.action==="alpick-open"){const pop=box.querySelector(".alpick-pop"),open=pop.hidden;alPickClose();if(!open)return;
    pop.hidden=false;b.setAttribute("aria-expanded","true");const q=pop.querySelector(".alpick-q");q.value="";pop.querySelector(".alpick-list").innerHTML=alPickList(k,"");
    const on=pop.querySelector(".alpick-o.on");if(on)on.scrollIntoView({block:"nearest"});setTimeout(()=>q.focus(),0);return}
  const v=b.dataset.v;alPickClose();if(k==="map"){MAPV.airline=v;MAPV.tfcData=[];mapTfcAt=0;render();setTimeout(()=>mapTraffic(true),400)}
  else if(k==="brief-map"){BRF.mapAirline=v;render();setTimeout(()=>brfTraffic(true),400)}
  else if(k==="rs"&&typeof ACP!=="undefined"){ACP.rs.al=v;RS.touched=true;ACP.rs.q="";const a=acById(RS.ac);if(!a||a.airline!==v)RS.ac="";RS.roster=null;render();setTimeout(()=>acPickOpen("rs",true),0)}
  else if(typeof ACP!=="undefined"&&ACP[k]){ACP[k].al=v;box.outerHTML=alPickHTML(k,v);   /* escala/reserva: filtra o seletor de aeronave e já o abre */
    ACP[k].q="";const cur=acById(acpSel(k));if(v!=="all"&&cur&&cur.airline!==v){acPickRefresh(k)}setTimeout(()=>acPickOpen(k,true),0)}});
document.addEventListener("input",e=>{if(!e.target.classList||!e.target.classList.contains("alpick-q"))return;const l=e.target.parentElement.querySelector(".alpick-list");if(l)l.innerHTML=alPickList(e.target.dataset.k,e.target.value)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.querySelector(".alpick-pop:not([hidden])"))alPickClose();
  if(e.key==="Enter"&&e.target.classList&&e.target.classList.contains("alpick-q")){e.preventDefault();const o=e.target.parentElement.querySelector(".alpick-o");if(o)o.click()}});

/* Full-width map workspace. Chart controls and tracked flights never resize the map. */
let mapScreenFrame=0;
function mapScreenFit(){const screen=document.querySelector('.map-screen');if(!screen||view!=='map')return;const height=Math.max(240,Math.floor((visualViewport?.height||innerHeight)-screen.getBoundingClientRect().top-12));screen.style.height=height+'px';const map=document.getElementById('fleet-map');const size=map?.clientWidth+'x'+map?.clientHeight;if(MAPV.map?.getContainer()===map&&screen.dataset.mapFitSize!==size){screen.dataset.mapFitSize=size;MAPV.map.invalidateSize({pan:false,animate:false})}}
function mapScreenSchedule(){cancelAnimationFrame(mapScreenFrame);mapScreenFrame=requestAnimationFrame(mapScreenFit)}
function mapChartsPanelSet(open,focus=false){const panel=document.getElementById('map-charts-panel'),button=document.querySelector('[data-action="map-charts-toggle"]');if(!panel||!button)return;panel.hidden=!open;button.setAttribute('aria-expanded',String(open));if(focus){if(open)panel.querySelector('select')?.focus();else button.focus()}}
document.addEventListener('click',event=>{const target=event.target;if(target.closest?.('[data-action="map-charts-toggle"]')){mapChartsPanelSet(document.getElementById('map-charts-panel')?.hidden,true);return}if(target.closest?.('[data-action="map-charts-close"]')){mapChartsPanelSet(false,true);return}if(!target.closest?.('#map-charts-panel'))mapChartsPanelSet(false)});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.getElementById('map-charts-panel')?.hidden)mapChartsPanelSet(false,true)});
document.addEventListener('change',event=>{if(event.target.id==='map-chart-type'){const summary=document.getElementById('map-chart-summary');if(summary)summary.textContent=event.target.selectedOptions[0]?.textContent||''}});
window.addEventListener('resize',mapScreenSchedule);window.visualViewport?.addEventListener('resize',mapScreenSchedule);
new MutationObserver(records=>{if(records.some(record=>record.type==='childList'&&![...record.addedNodes].every(node=>node.nodeType===3)))mapScreenSchedule()}).observe(document.getElementById('view'),{childList:true,subtree:true});
