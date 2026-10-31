/* =========================================================================
   ADS-B: consulta a posição de aeronaves reais e o tráfego em torno de um ponto.
   Os dados são apenas informativos: nenhuma consulta altera a posição ou a disponibilidade
   de aeronaves da frota. Dados: função "adsb" (adsb.lol / airplanes.live).
   ========================================================================= */
const REAL={regs:{},last:{},pend:new Set(),busy:false,err:null};
const REAL_TTL=90e3;
function realLastLabel(){return ['Last known location · ADS-B','Último local conhecido · ADS-B','Última ubicación conocida · ADS-B','Dernière position connue · ADS-B','Letzte bekannte Position · ADS-B','最終確認位置 · ADS-B','最后已知位置 · ADS-B','마지막 확인 위치 · ADS-B'][LANGS.indexOf(lang)]||'Last known location · ADS-B'}
function realLastLocationHTML(reg){if(!reg)return '';reg=String(reg).toUpperCase();REAL.pend.add(reg);setTimeout(realFetch,50);return `<div class="muted" data-real-last="${esc(reg)}">${realLastLocationInner(reg)}</div>`}
function realLastLocationInner(reg){const current=REAL.regs[reg];if(current?.data&&Number.isFinite(current.data.lat)&&Number.isFinite(current.data.lon)&&Math.abs(current.data.lat)<=90&&Math.abs(current.data.lon)<=180){const seen=Number(current.data.seen);REAL.last[reg]={data:current.data,at:current.at-(Number.isFinite(seen)&&seen>=0?seen*1000:0)}}const last=REAL.last[reg],label=esc(realLastLabel());if(!last)return `${label}: ${esc(t(!current?'real_loading':current.err==='missing'?'real_missing':current.err?'real_fail':'real_none'))}`;
 const a=last.data,ap=nearestAp(a.lat,a.lon,a.ground?5:40),coordinates=`${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}`,when=new Date(last.at).toISOString().slice(0,19).replace('T',' ')+' UTC';return `${label}: ${esc(coordinates)}${ap?` · ${esc(ap.icao)} (~${ap.nm.toFixed(1)} NM)`:''} · ${esc(when)}`}
/* aeroporto mais próximo de um ponto (até maxNm) */
function nearestAp(lat,lon,maxNm=8){if(!AIRPORTS)return null;let best=null,bd=Infinity;const dLat=maxNm/60+.05;
  for(const [c,r] of Object.entries(AIRPORTS)){if(Math.abs(r[0]-lat)>dLat||Math.abs(r[1]-lon)>dLat/Math.max(.2,Math.cos(lat*Math.PI/180)))continue;
    const d=gcNm([lat,lon],[r[0],r[1]]);if(d<bd){bd=d;best=c}}
  return best&&bd<=maxNm?{icao:best,nm:bd}:null}
/* linha "aeronave real agora" (preenchida quando a consulta volta) */
function realLineHTML(reg){if(!reg)return"";REAL.pend.add(String(reg).toUpperCase());setTimeout(realFetch,50);
  return`<div class="real-line" data-real-reg="${esc(String(reg).toUpperCase())}">${realLineInner(String(reg).toUpperCase())}</div>`}
function realLineInner(reg){
  const c=REAL.regs[reg];
  if(!c)return`<span class="real-tag">🛰 ${t("real_tag")}</span><span class="muted">${t("real_loading")}</span>`;
  if(c.err)return`<span class="real-tag">🛰 ${t("real_tag")}</span><span class="muted">${t(c.err==="missing"?"real_missing":"real_fail")}</span>`;
  const a=c.data;
  if(!a)return`<span class="real-tag">🛰 ${t("real_tag")}</span><span class="muted">${t("real_none")}</span>`;
  const ap=nearestAp(a.lat,a.lon,a.ground?5:40),ago=a.seen>90?` · ${t("real_seen",{t:Math.round(a.seen/60)+" min"})}`:"";
  const txt=a.ground?t("real_ground",{ap:ap?ap.icao:`${a.lat.toFixed(3)}, ${a.lon.toFixed(3)}`}):t("real_air",{cs:a.cs||"—",fl:"FL"+String(Math.round(a.alt/100)).padStart(3,"0"),gs:Math.round(a.gs),near:ap?ap.icao:"—"});
  return`<span class="real-tag">🛰 ${t("real_tag")}</span><span>${esc(txt)}${ago}</span><button type="button" class="btn small real-go" data-action="real-go" data-lat="${a.lat}" data-lon="${a.lon}" data-reg="${esc(reg)}">${t("real_map")}</button>`}
async function realFetch(){
  if(REAL.busy||!sb)return;const now=Date.now();
  const regs=[...REAL.pend].filter(r=>!REAL.regs[r]||now-REAL.regs[r].at>REAL_TTL).slice(0,10);REAL.pend.clear();if(!regs.length)return;
  REAL.busy=true;
  try{const {data:d,error}=await sb.functions.invoke("adsb",{body:{regs}});
    if(error){const miss=/not found|404|Failed to send|FunctionsFetchError|FunctionsHttpError/i.test(String(error.message||error));regs.forEach(r=>REAL.regs[r]={at:now,err:miss?"missing":"fail"})}
    else regs.forEach(r=>REAL.regs[r]={at:now,data:(d&&d.regs&&d.regs[r])||null})}
  catch(e){regs.forEach(r=>REAL.regs[r]={at:now,err:"fail"})}
  finally{REAL.busy=false}
  if(!AIRPORTS&&typeof loadAirports==="function")await loadAirports();
  document.querySelectorAll("[data-real-reg]").forEach(el=>{const r=el.dataset.realReg;if(REAL.regs[r])el.innerHTML=realLineInner(r)});
  document.querySelectorAll('[data-real-last]').forEach(el=>{el.innerHTML=realLastLocationInner(el.dataset.realLast)});
  if(REAL.pend.size)setTimeout(realFetch,200)}
/* "ver no mapa": abre o Mapa centrado na aeronave real, com a camada de tráfego real ligada */
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="real-go"]');if(!b)return;
  try{const s=JSON.parse(localStorage.getItem("vfr-map-ov")||"{}");s.ADSB=true;localStorage.setItem("vfr-map-ov",JSON.stringify(s))}catch(x){}
  if(typeof closeSheet==="function")closeSheet();MAPV.center=[+b.dataset.lat,+b.dataset.lon];MAPV.zoom=12;MAPV.airline="all";MAPV.focusReg=b.dataset.reg;view="map";render()});

/* ---------- tráfego real numa área do mapa ---------- */
const REALAREA={at:0,key:"",list:[],busy:false};
async function realArea(m){
  if(!m||!sb||m.getZoom()<7)return[];
  const c=m.getCenter(),b=m.getBounds(),r=Math.min(250,Math.max(10,gcNm([c.lat,c.lng],[b.getNorth(),b.getEast()])*1.05));
  const key=`${c.lat.toFixed(1)}:${c.lng.toFixed(1)}:${Math.round(r/10)}`,now=Date.now();
  if(REALAREA.key===key&&now-REALAREA.at<20e3)return REALAREA.list;
  if(REALAREA.busy)return REALAREA.list;REALAREA.busy=true;
  try{const {data:d,error}=await sb.functions.invoke("adsb",{body:{lat:c.lat,lon:c.lng,dist:Math.round(r)}});
    if(!error){REALAREA.list=((d&&d.aircraft)||[]).map(a=>({net:"REAL",cs:a.cs||a.reg||a.hex,reg:a.reg,type:a.type,lat:a.lat,lon:a.lon,alt:a.alt,gs:a.gs,hdg:a.hdg,ground:a.ground}));REALAREA.key=key;REALAREA.at=now;REALAREA.err=null}
    else REALAREA.err=/not found|404|Failed to send|FunctionsFetchError|FunctionsHttpError/i.test(String(error.message||error))?"missing":"fail"}
  catch(e){}finally{REALAREA.busy=false}
  return REALAREA.list}
/* dica do avião real: matrícula, voo, tipo, nível e se é da frota do app */
function realTip(p){const inFleet=p.reg&&fleet.some(a=>a.registration.toUpperCase()===p.reg);
  return`<b>${esc(p.reg||p.cs)}</b> <span class="tfc-net real">REAL · ADS-B</span>${inFleet?` <span class="tfc-net">★ ${esc(t("real_fleet"))}</span>`:""}<br>${esc(p.cs&&p.cs!==p.reg?p.cs+" · ":"")}${esc(p.type||"")}<br>${p.ground?esc(t("brf_m_gnd")):`FL${String(Math.round((p.alt||0)/100)).padStart(3,"0")}`} · ${Math.round(p.gs||0)} kt`}

