/* =========================================================================
   Voo rastreado: o app lê o simulador durante o voo e envia a trilha ao servidor.
   Fontes de dados (rodam no próprio computador do piloto, acessadas pelo navegador):
   - FSUIPC WebSocket Server (ws://localhost:2048/fsuipc/): MSFS 2020/2024 com FSUIPC7,
     Prepar3D com FSUIPC6, X-Plane 11/12 com XPUIPC.
   - X-Plane 12 (12.1.4 ou mais novo): API web própria em localhost:8086, sem instalar nada.
   O servidor confere a trilha (track_finish) e decide se o voo conta.
   ========================================================================= */
const TRK_FSUIPC_URL="ws://localhost:2048/fsuipc/";
const TRK_XP_HTTP="http://localhost:8086/api/v2";
const TRK_XP_WS="ws://localhost:8086/api/v2";
const TRK_KEEP_AIR=5000,TRK_KEEP_GND=10000,TRK_FLUSH=30000;
const TRK={resId:null,trackId:null,source:null,ws:null,status:"idle",err:"",last:null,buf:[],sent:0,lastKeep:0,lastFlush:0,flushing:false,
  everAir:false,airborne:false,landed:false,tdFpm:null,offT:null,stillSince:0,title:"",result:null,finishing:false,lastVs:0,xp:null};
const trkSave=()=>{try{TRK.resId&&TRK.status!=="done"?localStorage.setItem("vfr-track",JSON.stringify({resId:TRK.resId,trackId:TRK.trackId,source:TRK.source,everAir:TRK.everAir,offT:TRK.offT})):localStorage.removeItem("vfr-track")}catch(e){}};
const trkRes=()=>TRK.resId&&data.reservations.find(r=>r.id===TRK.resId);
const trkResults=()=>{try{return JSON.parse(localStorage.getItem("vfr-track-results")||"{}")}catch(e){return{}}};
const trkResultFor=resId=>trkResults()[resId]||null;
function trkStoreResult(resId,res){try{const m=trkResults();m[resId]=res;localStorage.setItem("vfr-track-results",JSON.stringify(m))}catch(e){}}
const trkNm=(a,b,c,d)=>{const R=3440.065,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b);const h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))};
const trkAp=icao=>AIRPORTS&&AIRPORTS[String(icao||"").toUpperCase()];
/* reserva pode ser rastreada: é minha, está reservada, livro técnico assinado e estamos perto do horário */
const trkCanStart=r=>r&&r.pilotId===myId&&r.status==="booked"&&(r.ackAt||statusOf(r.aircraftId).key==="ok")&&Date.now()>=r.start-60*60e3&&Date.now()<=r.end&&!(typeof movingNow==="function"&&movingNow(r.aircraftId));

/* retoma depois de recarregar a página */
(()=>{try{const s=JSON.parse(localStorage.getItem("vfr-track")||"null");if(s&&s.resId){TRK.resId=s.resId;TRK.trackId=s.trackId||null;TRK.source=s.source||null;TRK.everAir=!!s.everAir;TRK.offT=s.offT||null}}catch(e){}})();

/* ---------- Conexão: FSUIPC WebSocket Server ---------- */
const FSUIPC_OFFSETS=[
  {name:"lat",address:0x0560,type:"int",size:8},{name:"lon",address:0x0568,type:"int",size:8},{name:"alt",address:0x0570,type:"int",size:8},
  {name:"gs",address:0x02B4,type:"int",size:4},{name:"gnd",address:0x0366,type:"int",size:2},{name:"vs",address:0x02C8,type:"int",size:4},
  {name:"tdvs",address:0x030C,type:"int",size:4},{name:"hdg",address:0x0580,type:"uint",size:4},{name:"rate",address:0x0C1A,type:"int",size:2},
  {name:"pause",address:0x0264,type:"int",size:2},{name:"slew",address:0x05DC,type:"int",size:2},{name:"title",address:0x3D00,type:"string",size:256}];
function trkFsuipc(){
  return new Promise((ok,fail)=>{let ws,done=false;
    try{ws=new WebSocket(TRK_FSUIPC_URL,"fsuipc")}catch(e){return fail(e)}
    const to=setTimeout(()=>{if(!done){done=true;try{ws.close()}catch(e){}fail(new Error("timeout"))}},4000);
    ws.onopen=()=>{ws.send(JSON.stringify({command:"offsets.declare",name:"vfr",offsets:FSUIPC_OFFSETS}));ws.send(JSON.stringify({command:"offsets.read",name:"vfr",interval:1000}))};
    ws.onerror=()=>{if(!done){done=true;clearTimeout(to);fail(new Error("ws"))}};
    ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
      if(m.success===false&&!done){done=true;clearTimeout(to);fail(new Error(m.errorMessage||"fsuipc"));return}
      if(m.command!=="offsets.read"||!m.data)return;
      const d=m.data;if(!done){done=true;clearTimeout(to);ok(ws)}
      trkSample({lat:d.lat*90/(10001750*65536*65536),lon:d.lon*360/(65536*65536*65536*65536),altFt:d.alt/4294967296*3.28084,gsKt:d.gs/65536*1.943844,
        vsFpm:d.vs/256*196.8504,tdFpm:d.tdvs/256*196.8504,hdg:(d.hdg*360/4294967296)%360,ground:d.gnd===1,rate:(d.rate||256)/256,paused:!!d.pause,slew:!!d.slew,title:String(d.title||"").trim()})};
    ws.onclose=()=>{if(TRK.ws===ws&&TRK.status==="connected"){TRK.status="lost";paintLive()}};
  })}

/* ---------- Conexão: X-Plane 12 (API web) ---------- */
const XP_REFS=["sim/flightmodel/position/latitude","sim/flightmodel/position/longitude","sim/flightmodel/position/elevation","sim/flightmodel/position/groundspeed",
  "sim/flightmodel/failures/onground_any","sim/flightmodel/position/vh_ind_fpm","sim/flightmodel/position/psi","sim/time/sim_speed","sim/time/ground_speed",
  "sim/time/paused","sim/aircraft/view/acf_ICAO"];
async function trkXplane(){
  const q=XP_REFS.map(n=>"filter%5Bname%5D="+encodeURIComponent(n)).join("&");
  const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),4000);
  let j;try{const r=await fetch(`${TRK_XP_HTTP}/datarefs?${q}`,{signal:ctl.signal});if(!r.ok)throw new Error("http "+r.status);j=await r.json()}finally{clearTimeout(tm)}
  const byId={},ids={};for(const d of j.data||[]){byId[d.id]=d.name;ids[d.name]=d.id}
  if(!ids["sim/flightmodel/position/latitude"])throw new Error("datarefs");
  return new Promise((ok,fail)=>{let done=false;const ws=new WebSocket(TRK_XP_WS);const vals={};
    const to=setTimeout(()=>{if(!done){done=true;try{ws.close()}catch(e){}fail(new Error("timeout"))}},4000);
    ws.onopen=()=>ws.send(JSON.stringify({req_id:1,type:"dataref_subscribe_values",params:{datarefs:Object.values(ids).map(id=>({id}))}}));
    ws.onerror=()=>{if(!done){done=true;clearTimeout(to);fail(new Error("ws"))}};
    ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
      if(m.type==="result"&&m.success===false&&!done){done=true;clearTimeout(to);fail(new Error(m.error_message||"xplane"));return}
      if(m.type!=="dataref_update_values"||!m.data)return;
      for(const id in m.data)vals[byId[id]]=m.data[id];
      if(!done){done=true;clearTimeout(to);ok(ws)}
      const V=n=>{const v=vals[n];return Array.isArray(v)?v[0]:Number(v)||0};
      if(V("sim/flightmodel/failures/onground_any")!==1)TRK.lastVs=V("sim/flightmodel/position/vh_ind_fpm");   // razão de descida até o toque (10 Hz)
      const now=Date.now();if(TRK.xp&&now-TRK.xp<900)return;TRK.xp=now;   // 10 Hz → 1 Hz
      let icao=vals["sim/aircraft/view/acf_ICAO"]||"";if(typeof icao==="string"){try{icao=atob(icao)}catch(e){}}else if(Array.isArray(icao))icao=String.fromCharCode(...icao);
      const vs=V("sim/flightmodel/position/vh_ind_fpm"),ground=V("sim/flightmodel/failures/onground_any")===1;
      trkSample({lat:V("sim/flightmodel/position/latitude"),lon:V("sim/flightmodel/position/longitude"),altFt:V("sim/flightmodel/position/elevation")*3.28084,
        gsKt:V("sim/flightmodel/position/groundspeed")*1.943844,vsFpm:vs,tdFpm:ground&&TRK.airborne?TRK.lastVs:null,hdg:V("sim/flightmodel/position/psi"),ground,
        rate:Math.max(V("sim/time/sim_speed")||1,V("sim/time/ground_speed")||1),paused:!!V("sim/time/paused"),slew:false,title:String(icao).replace(/\0/g,"").trim()})};
    ws.onclose=()=>{if(TRK.ws===ws&&TRK.status==="connected"){TRK.status="lost";paintLive()}};
  })}

/* ---------- Conexão: SimConnect direto (só no app de Windows — MSFS 2020/2024, sem FSUIPC) ---------- */
function trkSimconnect(){
  const N=window.vfrNative&&window.vfrNative.simconnect;if(!N)return Promise.reject(new Error("na"));
  return new Promise((ok,fail)=>{let done=false,off1=null,off2=null;
    const obj={close(){try{off1&&off1();off2&&off2()}catch(e){}N.stop()}};
    const to=setTimeout(()=>{if(!done){done=true;obj.close();fail(new Error("timeout"))}},8000);
    off1=N.onData(d=>{if(!done){done=true;clearTimeout(to);ok(obj)}
      trkSample({lat:d.lat,lon:d.lon,altFt:d.alt,gsKt:d.gs,vsFpm:d.vs,tdFpm:d.td?Math.abs(d.td)*60:null,hdg:((d.hdg%360)+360)%360,ground:!!d.gnd,
        rate:d.rate||1,paused:!!d.pause,slew:!!d.slew,title:String(d.title||"").trim()})});
    off2=N.onClosed(()=>{if(!done){done=true;clearTimeout(to);fail(new Error("closed"))}else if(TRK.ws===obj&&TRK.status==="connected"){TRK.status="lost";paintLive()}});
    N.start().then(r=>{if(r&&r.error&&!done){done=true;clearTimeout(to);obj.close();fail(new Error(r.error))}}).catch(e=>{if(!done){done=true;clearTimeout(to);fail(e)}});
  })}

async function trkConnect(source){
  const reservation=trkRes(),previous=reservation&&typeof bookingPreviousIncomplete==='function'?bookingPreviousIncomplete(reservation):null;
  if(previous)return toast(bookingSequenceMessage(previous));
  if(!reservation||!TRK.trackId&&!trkCanStart(reservation))return toast(t('trk_not_yet'));
  if(TRK.ws){try{TRK.ws.close()}catch(e){}TRK.ws=null}
  TRK.status="connecting";TRK.err="";paintLive();
  const nat=!!(window.vfrNative&&window.vfrNative.simconnect);TRK.nativeMSFS=nat&&(source==="auto"||source==="simconnect"||!source);
  const tries=source==="xplane"?["xplane"]:source==="fsuipc"?["fsuipc"]:source==="simconnect"?["simconnect"]:nat?["simconnect","fsuipc","xplane"]:["fsuipc","xplane"];
  for(const s of tries){
    TRK.source=s;
    try{TRK.ws=await(s==="xplane"?trkXplane():s==="simconnect"?trkSimconnect():trkFsuipc());TRK.status="connected";trkSave();paintLive();return}
    catch(e){TRK.err=s}
  }
  TRK.status="error";paintLive();
}

/* ---------- Amostras ---------- */
function trkSample(s){
  if(!isFinite(s.lat)||!isFinite(s.lon)||(Math.abs(s.lat)<1e-6&&Math.abs(s.lon)<1e-6))return;
  const now=Date.now(),prev=TRK.last;
  TRK.last={...s,at:now};if(s.title)TRK.title=s.title;
  let event=false,td=null;
  if(prev&&!prev.ground&&s.ground){TRK.landed=true;event=true;td=s.tdFpm!=null&&s.tdFpm!==0?s.tdFpm:TRK.lastVs;TRK.tdFpm=Math.round(Math.abs(td))}
  if(prev&&prev.ground&&!s.ground)event=true;
  if(!s.ground)TRK.lastVs=s.vsFpm;
  if(!s.ground){TRK.airborne=true;if(!TRK.everAir){TRK.everAir=true;trkSave()}TRK.landed=false}else TRK.airborne=false;
  if(TRK.offT==null&&s.gsKt>=3&&!s.paused){TRK.offT=now;trkSave()}
  TRK.stillSince=s.ground&&s.gsKt<1?(TRK.stillSince||now):0;
  if(!TRK.trackId&&!TRK.starting){trkBegin();}
  const gap=s.ground&&s.gsKt<3?TRK_KEEP_GND:TRK_KEEP_AIR;
  if(event||now-TRK.lastKeep>=gap){TRK.lastKeep=now;
    TRK.buf.push({t:now,lat:+s.lat.toFixed(5),lon:+s.lon.toFixed(5),alt:Math.round(s.altFt),gs:Math.round(s.gsKt),vs:Math.round(td!=null?-Math.abs(td):s.vsFpm),hdg:Math.round(s.hdg),g:!!s.ground,r:+(s.rate||1).toFixed(2),p:!!s.paused,s:!!s.slew})}
  if(now-TRK.lastFlush>=TRK_FLUSH)trkFlush();
  paintLive();
}
async function trkBegin(){
  const r=trkRes();if(!r)return;const previous=typeof bookingPreviousIncomplete==='function'?bookingPreviousIncomplete(r):null;if(previous){TRK.status='error';TRK.err=bookingSequenceMessage(previous);paintLive();return}TRK.starting=true;
  try{const {data:id,error}=await sb.rpc("track_start",{p_reservation:r.id,p_source:TRK.source||"fsuipc",p_title:TRK.title||""});if(error)throw error;TRK.trackId=id;trkSave()}
  catch(e){console.error(e);TRK.err=dbMessage(e);TRK.status="error";if(TRK.ws){try{TRK.ws.close()}catch(x){}TRK.ws=null}}
  finally{TRK.starting=false;paintLive()}
}
async function trkFlush(force){
  if(!TRK.trackId||TRK.flushing||!TRK.buf.length)return;
  const wait=8500-(Date.now()-TRK.lastFlush);if(wait>0){if(!force)return;await new Promise(r=>setTimeout(r,wait))}
  TRK.flushing=true;const batch=TRK.buf.slice(0,600);
  try{const {error}=await sb.rpc("track_push",{p_track:TRK.trackId,p_points:batch,p_title:TRK.title||null});
    TRK.lastFlush=Date.now();
    if(error){if(/VFR_TRACK_CLOSED|VFR_NOT_YOURS/.test(error.message||"")){TRK.status="error";TRK.err=t("trk_closed")}throw error}
    TRK.buf.splice(0,batch.length);TRK.sent+=batch.length}
  catch(e){console.warn("track_push",e)}
  finally{TRK.flushing=false}
}
const trkParked=()=>TRK.everAir&&TRK.last&&TRK.last.ground&&TRK.stillSince&&Date.now()-TRK.stillSince>=5000;
async function trkFinish(){
  if(!TRK.trackId||TRK.finishing)return;TRK.finishing=true;paintLive();
  try{
    while(TRK.buf.length){const n=TRK.buf.length;await trkFlush(true);if(TRK.buf.length>=n)break}
    const {data:res,error}=await sb.rpc("track_finish",{p_track:TRK.trackId});if(error)throw error;
    TRK.result={...res,trackId:TRK.trackId,source:TRK.source};trkStoreResult(TRK.resId,TRK.result);
    if(TRK.ws){try{TRK.ws.close()}catch(e){}TRK.ws=null}
    TRK.status="done";trkSave();
  }catch(e){console.error(e);TRK.err=dbMessage(e)}
  finally{TRK.finishing=false;render()}
}
async function trkAbandon(){
  if(TRK.trackId){try{await sb.rpc("track_abandon",{p_track:TRK.trackId})}catch(e){}}
  trkReset();view="bookings";render();
}
function trkReset(){if(TRK.ws){try{TRK.ws.close()}catch(e){}}
  Object.assign(TRK,{resId:null,trackId:null,source:null,ws:null,status:"idle",err:"",last:null,buf:[],sent:0,lastKeep:0,lastFlush:0,everAir:false,airborne:false,landed:false,tdFpm:null,offT:null,stillSince:0,title:"",result:null,lastVs:0});trkSave()}
function trkOpen(resId){
  const reservation=data.reservations.find(r=>r.id===resId);if(!reservation)return;
  const previous=typeof bookingPreviousIncomplete==='function'?bookingPreviousIncomplete(reservation):null;
  if(previous){toast(bookingSequenceMessage(previous));return}
  if(TRK.resId!==resId&&!trkCanStart(reservation))return toast(t('trk_not_yet'));
  if(TRK.resId&&TRK.resId!==resId&&["connected","connecting","lost"].includes(TRK.status))return toast(t("trk_other"));
  if(TRK.resId!==resId){trkReset();TRK.resId=resId;trkSave()}
  if(!AIRPORTS)loadAirports().then(()=>paintLive());
  if(reservation.rosterId&&typeof BRF!=='undefined'){BRF.sel=resId;BRF.section='tracking';view='briefing'}else view="live";
  closeSheet();render();
}

/* ---------- Tela "Voo ao vivo" ---------- */
const trkPhase=()=>{const s=TRK.last;if(!s)return"—";
  if(s.paused)return t("trk_ph_paused");
  if(s.ground){if(TRK.everAir)return s.gsKt<1?t("trk_ph_parked"):s.gsKt>40?t("trk_ph_landing"):t("trk_ph_taxi_in");return s.gsKt<1?t("trk_ph_pre"):s.gsKt>40?t("trk_ph_takeoff"):t("trk_ph_taxi_out")}
  if(s.vsFpm>400)return t("trk_ph_climb");if(s.vsFpm<-400)return t("trk_ph_descent");return t("trk_ph_cruise")};
function trkWarnings(){const s=TRK.last,r=trkRes(),out=[];if(!s)return out;
  if(s.rate>1.05)out.push(["bad",t("trk_w_accel",{x:s.rate.toFixed(0)})]);
  if(s.slew)out.push(["bad",t("trk_w_slew")]);
  if(s.paused)out.push(["warn",t("trk_w_paused")]);
  const ap=r&&trkAp(r.dep);if(ap&&!TRK.everAir&&s.ground&&trkNm(s.lat,s.lon,ap[0],ap[1])>3)out.push(["bad",t("trk_w_dep",{icao:r.dep})]);
  if(TRK.status==="lost")out.push(["bad",t("trk_w_lost")]);
  return out}
function liveInner(){
  const r=trkRes(),s=TRK.last;
  if(TRK.status==="done"&&TRK.result)return trkResultHTML(TRK.result,r);
  const conn=TRK.status==="connected"?`<span class="chip ok">● ${t("trk_conn_ok",{s:t(TRK.source==="xplane"?"trk_src_xp":TRK.source==="simconnect"?"trk_src_sc":"trk_src_fsuipc")})}</span>`
    :TRK.status==="connecting"?`<span class="chip warn">${t("trk_connecting")}</span>`:TRK.status==="lost"?`<span class="chip bad">${t("trk_lost")}</span>`
    :TRK.status==="error"?`<span class="chip bad">${t("trk_conn_fail")}</span>`:`<span class="chip">${t("trk_conn_none")}</span>`;
  const arrAp=r&&trkAp(r.arr),dist=s&&arrAp?Math.round(trkNm(s.lat,s.lon,arrAp[0],arrAp[1])):null;
  const blk=TRK.offT?block(Math.round((Date.now()-TRK.offT)/60000)):"—";
  const tiles=[[t("trk_alt"),s?`${Math.round(s.altFt).toLocaleString(LOCALE[lang])} ft`:"—"],[t("trk_gs"),s?`${Math.round(s.gsKt)} kt`:"—"],[t("trk_vs"),s?`${Math.round(s.vsFpm)} fpm`:"—"],
    [t("trk_hdg"),s?`${String(Math.round(s.hdg)%360).padStart(3,"0")}°`:"—"],[t("trk_dist",{icao:r?r.arr:""}),dist!=null?`${dist} nm`:"—"],[t("trk_block"),blk]];
  const warns=trkWarnings().map(([k,m])=>`<div class="notice ${k}">${esc(m)}</div>`).join("");
  const parked=trkParked();
  return`<div class="trk-top"><div>${conn}${TRK.title?` <span class="muted trk-title">${esc(TRK.title)}</span>`:""}</div>
    <div class="row" style="gap:8px">${TRK.status==="connected"?"":`<button class="btn small primary" data-action="trk-conn" data-s="auto">${t("trk_connect")}</button>${window.vfrNative&&window.vfrNative.simconnect?`<button class="btn small trk-simulator-choice" data-simulator-text-only data-action="trk-conn" data-s="simconnect" title="MSFS (SimConnect)" aria-label="MSFS (SimConnect)">MSFS (SimConnect)</button>`:""}<button class="btn small trk-simulator-choice" data-simulator-text-only data-action="trk-conn" data-s="fsuipc" title="MSFS / X-Plane 11 · FSUIPC" aria-label="MSFS / X-Plane 11 · FSUIPC">MSFS / X-Plane 11</button><button class="btn small trk-simulator-choice" data-simulator-text-only data-action="trk-conn" data-s="xplane" title="X-Plane 12" aria-label="X-Plane 12">X-Plane 12</button>`}</div></div>
   ${TRK.status==="error"&&TRK.err&&TRK.err.length>10?`<div class="notice bad" data-simulator-text-only>${esc(TRK.err)}</div>`:TRK.status==="error"?`<div class="notice bad" data-simulator-text-only>${t(TRK.nativeMSFS?"trk_fail_native":"trk_fail_help")}</div>`:""}
   ${warns}
   <div class="trk-phase"><span class="eyebrow">${t("trk_phase")}</span><b>${esc(trkPhase())}</b>${TRK.tdFpm!=null?`<span class="trk-td">${t("trk_touchdown",{v:TRK.tdFpm})}</span>`:""}</div>
   <div class="trk-tiles">${tiles.map(([k,v])=>`<div><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div>
   <div class="trk-foot"><span class="muted">${t("trk_sent",{n:TRK.sent,b:TRK.buf.length})}</span>
    <div class="row" style="gap:8px"><button class="btn primary" data-action="trk-finish" ${parked&&!TRK.finishing&&TRK.trackId?"":"disabled"}>${TRK.finishing?t("trk_checking"):t("trk_finish")}</button>
    <button class="btn" data-action="trk-abandon">${t("trk_abandon")}</button></div></div>
   ${parked?"":`<p class="hint" style="margin:0">${t(TRK.everAir?"trk_finish_hint2":"trk_finish_hint")}</p>`}`;
}
function trkResultHTML(res,r){
  const ok=res.status==="verified";
  const reasons=(res.reasons||[]).map(k=>`<li>${esc(t("trk_r_"+k))}</li>`).join("");
  const warns=(res.warnings||[]).filter(k=>k!=="dep_unknown").map(k=>`<li>${esc(t("trk_wn_"+k,{icao:res.actual_arr||""}))}</li>`).join("");
  return`<div class="trk-result ${ok?"ok":"bad"}"><div class="trk-badge">${ok?"✓":"✕"}</div><div><h3>${t(ok?"trk_ok_h":"trk_bad_h")}</h3><p class="muted" style="margin:4px 0 0">${t(ok?"trk_ok_p":"trk_bad_p")}</p></div></div>
   <div class="trk-tiles">${[[t("block_time"),res.block_min?block(res.block_min):"—"],[t("trk_air"),res.air_min!=null?block(res.air_min):"—"],[t("arr"),res.actual_arr||"—"],
     [t("trk_dist_flown"),res.distance_nm!=null?`${res.distance_nm} nm`:"—"],[t("trk_landing"),res.landing_fpm!=null?`${res.landing_fpm} fpm`:"—"]].map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(String(v))}</b></div>`).join("")}</div>
   ${reasons?`<div class="notice bad"><b>${t("trk_reasons")}</b><ul>${reasons}</ul></div>`:""}${warns?`<div class="notice"><ul>${warns}</ul></div>`:""}
   ${r&&r.status==="booked"?`<div class="row"><button class="btn primary" data-action="report" data-id="${esc(r.id)}">${t("trk_to_report")}</button></div>`:""}`;
}
function viewLive(){
  if(!db)return offline();
  const r=trkRes();
  if(!r){const mine=data.reservations.filter(x=>x.pilotId===myId&&x.status==="booked").sort((a,b)=>a.start-b.start);
    return`<div class="sec-head"><div><span class="eyebrow">${t("trk_eyebrow")}</span><h2>${t("trk_title")}</h2></div></div>
     <div class="panel"><p class="muted" style="margin:0">${t("trk_pick")}</p>${mine.length?`<div class="trk-pick">${mine.map(x=>`<div class="row" style="justify-content:space-between;gap:10px"><span>${fnoChip(x.flightNo)} <b class="mono">${esc(x.dep)} → ${esc(x.arr)}</b> <span class="muted">${fmt(x.start)}</span></span>${trkCanStart(x)?`<button class="btn small primary" data-action="trk-open" data-id="${esc(x.id)}">${t("trk_start")}</button>`:`<span class="muted" style="font-size:.82rem">${x.ackAt?t("trk_not_yet"):t("n_sign")}</span>`}</div>`).join("")}</div>`:""}</div>${trkHelpHTML()}`}
  const a=acById(r.aircraftId);
  return`<div class="sec-head"><div><span class="eyebrow">${t("trk_eyebrow")}</span><h2>${fnoChip(r.flightNo)} ${esc(r.dep)} → ${esc(r.arr)}</h2>
     <p class="muted" style="margin:4px 0 0">${regTag(a,r.aircraftId)} ${esc(a?.type||"")} · ${fmtRange(r.start,r.end)}</p></div></div>
   <div class="panel trk" id="live-box">${liveInner()}</div>
   ${TRK.status==="done"?"":`<div class="notice">${t("trk_keep_open")}</div>`}
   ${trkHelpHTML()}`;
}
function trkHelpHTML(){
  return`<details class="panel trk-help"${TRK.status==="connected"||TRK.status==="done"?"":" open"}><summary><b>${t("trk_help_h")}</b></summary>
   <ol>${["trk_help_msfs","trk_help_xp12","trk_help_xp11","trk_help_perm"].map(k=>{const xp=k==='trk_help_xp12'||k==='trk_help_xp11';return `<li${xp?' data-simulator-text-only':''}>${xp?'<img class="simulator-icon" src="img/sim/xplane.svg" alt="" width="25" height="25" decoding="async"> ':''}${t(k==="trk_help_msfs"&&window.vfrNative?.simconnect?"trk_help_msfs_native":k)}</li>`}).join("")}</ol>
   <h4>${t("trk_rules_h")}</h4><ul>${["trk_rule_1","trk_rule_2","trk_rule_3","trk_rule_4","trk_rule_5"].map(k=>`<li>${t(k)}</li>`).join("")}</ul></details>`}
let trkPaintT=0;
function paintLive(){const embedded=view==='briefing'&&typeof BRF!=='undefined'&&BRF.section==='tracking'&&BRF.sel===TRK.resId;if(view!=="live"&&!embedded)return;const now=Date.now();if(now-trkPaintT<400)return;trkPaintT=now;const b=$(embedded?"#brf-track-box":"#live-box");if(b){b.innerHTML=liveInner();if(embedded&&typeof brfLayoutSchedule==='function')brfLayoutSchedule();if(typeof decorateSimulatorNames==="function")decorateSimulatorNames(b)}}
/* aviso no topo das outras telas enquanto o voo está sendo rastreado */
function trkBanner(){if(!TRK.resId||view==="live"||view==='briefing'&&typeof BRF!=='undefined'&&BRF.section==='tracking'&&BRF.sel===TRK.resId)return"";const r=trkRes();if(!r||r.status!=="booked")return"";
  return`<div class="notice trk-banner"><span>✈ ${t(TRK.status==="connected"?"trk_banner_on":"trk_banner_off",{r:`${r.dep} → ${r.arr}`})}</span><button class="btn small primary" data-action="trk-open" data-id="${esc(r.id)}">${t("trk_back")}</button></div>`}
document.addEventListener("click",e=>{const el=e.target.closest("[data-action^='trk-']");if(!el)return;const a=el.dataset.action;
  if(a==="trk-open"){if(typeof autoAck==="function")autoAck(el.dataset.id);return trkOpen(el.dataset.id)}
  if(a==="trk-conn")return trkConnect(el.dataset.s);
  if(a==="trk-finish")return trkFinish();
  if(a==="trk-abandon"){if(el.dataset.c!=="1"){el.dataset.c="1";el.textContent=t("tap_again");setTimeout(()=>{if(el.isConnected){el.dataset.c="";el.textContent=t("trk_abandon")}},3000);return}return trkAbandon()}
});
/* a cada 15 s, mesmo sem novidades do simulador, tenta enviar o que ficou na fila */
setInterval(()=>{if(TRK.trackId&&TRK.buf.length&&Date.now()-TRK.lastFlush>=TRK_FLUSH)trkFlush();if(view==="live"||view==='briefing'&&typeof BRF!=='undefined'&&BRF.section==='tracking')paintLive()},15000);
window.addEventListener("beforeunload",e=>{if(TRK.status==="connected"&&TRK.everAir&&!TRK.result){e.preventDefault();e.returnValue=""}});
