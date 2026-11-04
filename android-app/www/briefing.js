/* ---------- Sala de briefing: NOTAM e meteorologia dos voos da escala ----------
   Habilitada quando o piloto tem uma escala (aceita ou recém-gerada). Para cada voo: METAR/TAF
   (original ou decodificado) e NOTAM da origem e do destino, destacando os que valem no horário do voo. */
const BRF={sel:null,section:'flight',wx:{},notam:{},nload:{},err:{},showAll:{}};
let brfFlightPickerObserver=null,brfFlightPickerElement=null;
function brfFitFlightPicker(){const el=brfFlightPickerElement;if(!el?.isConnected||!el.getClientRects().length)return;const row=el.querySelector('.brf-flight-inline'),picker=el.querySelector('details');if(!row||!picker)return;const needed=[...row.children].reduce((sum,card)=>sum+card.getBoundingClientRect().width,0)+Math.max(0,row.children.length-1)*8;const dropdown=needed>el.clientWidth+1;el.classList.toggle('is-dropdown',dropdown);row.inert=dropdown;row.setAttribute('aria-hidden',String(dropdown));picker.hidden=!dropdown;if(!dropdown)picker.open=false}
function brfObserveFlightPicker(){const el=document.querySelector('.brf-flight-adaptive');if(el!==brfFlightPickerElement){brfFlightPickerObserver?.disconnect();brfFlightPickerElement=el;if(el){brfFlightPickerObserver=new ResizeObserver(brfFitFlightPicker);brfFlightPickerObserver.observe(el);brfFlightPickerObserver.observe(el.querySelector('.brf-flight-inline'))}}brfFitFlightPicker()}
new MutationObserver(()=>requestAnimationFrame(brfObserveFlightPicker)).observe(document.getElementById('view'),{childList:true});
function openBriefingFlight(key){if(key)BRF.sel=key;BRF.section='flight';view='briefing';closeSheet();render();window.scrollTo(0,0)}
function briefPlaceFlightContext(){
 const workspace=document.querySelector('.brf-workspace'),context=workspace?.querySelector('.brf-flight-context'),content=workspace?.querySelector('.brf-section-content'),layout=workspace?.querySelector('.brf-section-layout');
 if(!context||!content||!layout)return;
 if(workspace.classList.contains('brf-nav-top')){if(context.parentElement!==content)content.prepend(context)}
 else if(context.parentElement!==workspace)workspace.insertBefore(context,layout);
}
function briefNavPosition(){try{return localStorage.getItem('vfr-brief-nav:'+myId)==='top'?'top':'side'}catch(e){return 'side'}}
document.addEventListener('change',e=>{if(e.target.id!=='brf-nav-position')return;const position=e.target.value==='top'?'top':'side';try{localStorage.setItem('vfr-brief-nav:'+myId,position)}catch(e){}document.querySelector('.brf-workspace')?.classList.toggle('brf-nav-top',position==='top');requestAnimationFrame(()=>{briefPlaceFlightContext();brfLayoutSchedule();brfScheduleFit();BRF.map?.invalidateSize();brfObserveFlightPicker()})});
const NOTAM_TTL=15*60e3;
// Briefing-only alternate, scoped to the pilot and accepted leg; never changes a roster.
function briefAlternate(L){const r=typeof data!=='undefined'?data.reservations?.find(r=>r.id===L.key):null;let saved=null;try{saved=localStorage.getItem('vfr-brief-alt:'+myId+':'+L.key)}catch(e){}const dispatched=typeof briefDispatchAlternate==='function'?briefDispatchAlternate(L):null;if(dispatched&&!(typeof baManualOverrides==='function'&&baManualOverrides(L)))return dispatched;return String((saved||dispatched||r?.alternate||r?.alt||r?.altn||L.alt)||(typeof baAutoCode==='function'?baAutoCode(L):'')).toUpperCase().match(/^[A-Z0-9]{4}$/)?.[0]||''}
function briefAirports(L){return [...new Set([L.dep,L.arr,briefAlternate(L)].filter(Boolean))]}
function briefRole(c,L){return c===L.dep?'dep':c===L.arr?'arr':'alt'}
function briefAltEta(L){let saved=0;try{saved=Number(localStorage.getItem('vfr-brief-alt-eta:'+myId+':'+L.key))}catch(e){}return Number.isFinite(saved)&&saved>=L.eobt?saved:(L.altEta||L.eta)}
function briefTime(c,L){return c===L.dep?L.eobt:c===L.arr?L.eta:briefAltEta(L)}
function briefTimes(c,L){return [...new Set([c===L.dep?L.eobt:null,c===L.arr?L.eta:null,c===briefAlternate(L)?briefAltEta(L):null].filter(Number.isFinite))]}
function briefAltText(){return ['Alternate (ICAO) · ETA assumed equal to destination unless specified','Alternativa (ICAO) · horário considerado: ETA do destino','Alternativa (ICAO) · hora: ETA del destino','Dégagement (OACI) · heure : ETA destination','Ausweichplatz (ICAO) · Zeit: Ziel-ETA','代替空港 (ICAO) · 目的地ETAで評価','备降机场 (ICAO) · 使用目的地ETA','교체공항 (ICAO) · 목적지 ETA 기준'][LANGS.indexOf(lang)]||'Alternate (ICAO)'}

/* voos da escala: aceitos (reservas) ou, se não houver, os da escala recém-gerada */
function briefLegs(){
  const now=Date.now();
  const acc=(typeof data!=="undefined"?data.reservations:[]).filter(r=>r.pilotId===myId&&r.rosterId&&booked(r)&&r.end>now)
    .sort((a,b)=>a.start-b.start).map(r=>({key:r.id,dep:r.dep,arr:r.arr,eobt:r.start+20*6e4,eta:r.end-25*6e4,fno:r.flightNo||"",acId:r.aircraftId,ferry:r.ferry,gen:false}));
  return acc;
}
function briefingEnabled(){try{return briefLegs().length>0}catch(e){return false}}

/* ---------- NOTAM: leitura do formato ICAO ---------- */
function notamDate(s){const m=String(s||"").match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);if(!m)return null;return Date.UTC(2000+ +m[1],+m[2]-1,+m[3],+m[4],+m[5])}
function parseNotam(n){
  const raw=n.icao||n.text||"";const flat=raw.replace(/\r/g,"");
  const g=k=>{const m=flat.match(new RegExp("(?:^|\\s)"+k+"\\)\\s*([\\s\\S]*?)(?=\\s[A-G]\\)\\s|$)"));return m?m[1].trim():""};
  const B=g("B"),C=g("C"),E=g("E")||n.text||raw,D=g("D"),F=g("F"),G=g("G");
  const q=((flat.match(/Q\)\s*([\s\S]*?)(?=\s+A\)|\n|$)/)||[])[1]||"").replace(/\s+/g,"");
  const code=(q.split("/")[1]||"").slice(0,5);
  const from=notamDate(B),perm=/PERM/.test(C),est=/EST/.test(C),to=perm?Infinity:notamDate(C);
  const id=(flat.match(/^\(?\s*([A-Z]\d{4}\/\d{2})/)||[])[1]||n.id||"";
  /* posição: Q) …/2326S04628W005 (centro e raio em NM); no texto E), coordenadas de obstáculos, áreas etc. */
  const qp=q.split("/"),qm=(qp[qp.length-1]||"").match(/^(\d{2})(\d{2})([NS])(\d{3})(\d{2})([EW])(\d{3})$/);
  const qValid=qm&&+qm[2]<60&&+qm[5]<60&&(+qm[1]+qm[2]/60)<=90&&(+qm[4]+qm[5]/60)<=180;
  const qll=qValid?[(+qm[1]+qm[2]/60)*(qm[3]==="S"?-1:1),(+qm[4]+qm[5]/60)*(qm[6]==="W"?-1:1)]:null,qr=qValid?+qm[7]:null;
  const lo=qp[5]&&/^\d{3}$/.test(qp[5])?+qp[5]:null,hi=qp[6]&&/^\d{3}$/.test(qp[6])?+qp[6]:null;
  const pts=[];const re=/(?<!\d)(\d{2})(\d{2})(\d{2}(?:[.,]\d+)?)?\s*([NS])\s*[\/,-]?\s*(\d{3})(\d{2})(\d{2}(?:[.,]\d+)?)?\s*([EW])(?![A-Z0-9])/gi;let m,coordInvalid=false;
  while((m=re.exec(E))){if(pts.length>=40){coordInvalid=true;break}const s1=m[3]?parseFloat(m[3].replace(',','.')):0,s2=m[7]?parseFloat(m[7].replace(',','.')):0,la=(+m[1]+m[2]/60+s1/3600)*(m[4].toUpperCase()==='S'?-1:1),lnn=(+m[5]+m[6]/60+s2/3600)*(m[8].toUpperCase()==='W'?-1:1);
    if(+m[2]<60&&+m[6]<60&&s1<60&&s2<60&&Math.abs(la)<=90&&Math.abs(lnn)<=180)pts.push([la,lnn]);else coordInvalid=true}
  return{id,loc:n.loc,from,to,perm,est,code,e:E.replace(/\s+/g," ").trim(),d:D,f:F,g:G,raw,qll,qr,lo,hi,pts,coordInvalid};
}
const NOTAM_KEY=/\b(CLSD|CLOSED|U\/S|UNSERVICEABLE|NOT AVBL|RWY|ILS|LOC|GP|VOR|DME|NDB|PAPI|ALS|TWY|APN|TORA|LDA|WIP|OBST|CRANE|FUEL|FIRE|RFF|SID|STAR|RNAV|RNP|GNSS|GPS)\b/g;
function notamHi(txt){return esc(txt).replace(NOTAM_KEY,'<mark>$1</mark>')}

async function briefLoad(icaos,force){
  const ids=[...new Set(icaos)].filter(c=>/^[A-Z0-9]{4}$/.test(c));
  // METAR/TAF (cache do app, 5 min)
  ids.forEach(c=>{if(force)delete WX_CACHE[c];if(BRF.wx[c]&&!force)return;BRF.wx[c]={loading:true};
    fetchWx(c).then(d=>{BRF.wx[c]=d?{data:d}:{unsupported:true}}).catch(()=>{BRF.wx[c]={error:true}}).finally(()=>{if(view==="briefing")render()})});
  // NOTAM (função "notam", 15 min)
  const now=Date.now(),need=ids.filter(c=>!BRF.nload[c]&&(force||(!BRF.err[c]&&(!BRF.notam[c]||now-BRF.notam[c].at>NOTAM_TTL))));
  if(!need.length||!sb)return;
  need.forEach(c=>BRF.nload[c]=true);
  try{const {data:d,error}=await sb.functions.invoke("notam",{body:{ids:need}});if(error)throw error;
    need.forEach(c=>{const x=d&&d[c];if(x&&Array.isArray(x.notams)){BRF.notam[c]={at:now,list:x.notams.map(parseNotam)};delete BRF.err[c]}else BRF.err[c]="fail"})}
  catch(e){const m=String(e&&e.message||e);need.forEach(c=>BRF.err[c]=/not found|404|Failed to send|FunctionsFetchError|FunctionsHttpError/i.test(m)?"missing":"fail")}
  finally{need.forEach(c=>delete BRF.nload[c]);if(view==="briefing")render()}
}

function briefWxBox(c,compact=false){
  const st=BRF.wx[c]||{loading:true};
  if(st.loading)return`<p class="muted">${t("wx_loading")}</p>`;
  if(st.unsupported)return`<p class="muted">${t("wx_here_only")}</p>`;
  if(st.error)return`<p class="muted">${t("wx_error")}</p>`;
  const d=st.data,dec=wxMode()==="dec"&&typeof wxDecodedHtml==="function",cat={VFR:"ok",MVFR:"neutral",IFR:"warn",LIFR:"bad"}[d.fltCat]||"neutral";
  if(compact&&!BRF.printing){const kind=BRF.wxReport==='TAF'?'TAF':'METAR';return `<div class="wx-top brf-weather-mode"><span class="wx-lab">${kind}</span><div class="seg wx-seg">${['raw','dec'].map(k=>`<button type="button" data-action="brf-wxmode" data-v="${k}" aria-pressed="${(k==='dec')===dec}">${esc(wxdT(k))}</button>`).join('')}</div></div><div class="brf-wx-both brf-wx-coded"><section class="brf-wx-report-content${dec?' is-decoded':''}" data-weather-report="${kind}">${dec?'':`<pre class="wx-raw">${kind==='TAF'?(d.taf?tafVisualRawHTML(d.taf):t('wx_none')):(d.metar?metarVisualRawHTML(d.metar):t('wx_none'))}</pre>`}${kind==='METAR'?metarVisualHTML(d.metar,!dec):tafVisualHTML(d.taf,!dec)}</section></div>`;}


  return`<div class="wx-top">${d.fltCat?`<span class="chip ${cat}">${esc(d.fltCat)}</span>`:"<span></span>"}<div class="seg wx-seg">${["raw","dec"].map(k=>`<button type="button" data-action="brf-wxmode" data-v="${k}" aria-pressed="${(k==="dec")===dec}">${esc(wxdT(k))}</button>`).join("")}</div></div>
    ${BRF.printing?`<div class="wx-lab">METAR</div><pre class="wx-raw">${d.metar?esc(d.metar):t("wx_none")}</pre><div class="wx-lab">TAF</div><pre class="wx-raw">${d.taf?fmtTaf(d.taf):t("wx_none")}</pre>${typeof wxDecodedHtml==="function"?`<div class="brf-dec">${wxDecodedHtml(d)}</div>`:""}`:dec?wxDecodedHtml(d):`<div class="wx-lab">METAR</div><pre class="wx-raw">${d.metar?esc(d.metar):t("wx_none")}</pre><div class="wx-lab">TAF</div><pre class="wx-raw">${d.taf?fmtTaf(d.taf):t("wx_none")}</pre>`}
    ${d.metarTime?`<p class="muted" style="font-size:.75rem;margin:0">${t("wx_updated",{t:fmt(new Date(d.metarTime).getTime())})}</p>`:""}`;
}
function briefWeatherPanel(L){
 const roles=[{key:'dep',code:L.dep,label:t('brf_dep')},{key:'route',code:'',label:t('brf_wx_route')},{key:'arr',code:L.arr,label:t('brf_arr')},{key:'alt',code:briefAlternate(L),label:briefAltText().split(' · ')[0]}];
 const selected=roles.find(r=>r.key===BRF.wxRole)||roles[0];
 const tabs=`<div class="brf-weather-tabs brf-weather-stations" role="group" aria-label="${esc(t('brf_met'))}">${roles.map(r=>`<div class="brf-weather-station"><button type="button" class="btn" data-action="brf-wx-airport" data-v="${r.key}" aria-pressed="${r.key===selected.key}"><strong>${esc(r.code||r.label)}</strong><small>${esc(r.key==='route'?'':r.label)}</small></button><div class="brf-station-options">${(r.key==='route'?['SIGMET','AIRMET','GAMET']:['METAR','TAF']).map(kind=>`<button type="button" class="btn small" data-action="brf-wx-select" data-role="${r.key}" data-kind="${kind}" aria-pressed="${r.key===selected.key&&(r.key==='route'?(BRF.wxHazard||'SIGMET'):(BRF.wxReport||'METAR'))===kind}">${kind}</button>`).join('')}</div></div>`).join('')}</div>`;
 if(selected.key==='route')return `<section class="brf-weather-compact">${tabs}${sigSection(L,BRF.wxHazard||'SIGMET',false)}</section>`;
 if(!selected.code)return `<section class="panel brf-weather-compact">${tabs}<p class="notice warn">${t('brf_alt_required_compact')}</p></section>`;
 const c=selected.code,name=AIRPORTS?.[c]?.[3]||'',at=selected.key==='dep'?L.eobt:briefTime(c,L);
 return `<section class="panel brf-weather-compact brf-weather-dashboard">${tabs}<header class="brf-weather-heading"><h3><span class="mono">${esc(c)}</span> <span class="muted">${esc(name)}</span></h3><span class="muted mono">${selected.key==='dep'?'EOBT':'ETA'} ${utcHM(at)}Z · ${tf.format(at)} ${t('t_local')}</span></header>${briefWxBox(c,true)}<div class="brf-weather-sources">${/^S[BDNSW]/.test(c)?`<a href="https://aisweb.decea.mil.br/?i=aerodromos&codigo=${encodeURIComponent(c)}" target="_blank" rel="noopener">AISWEB ${esc(c)} ↗</a>`:''}<a href="https://aviationweather.gov/data/metar/?ids=${encodeURIComponent(c)}&taf=1" target="_blank" rel="noopener">aviationweather.gov ↗</a></div></section>`;
}
function notamWin(L,role){return role==="dep"?[L.eobt-36e5,L.eobt+36e5]:[L.eta-36e5,L.eta+2*36e5]}
function notamHits(c,L,role){const N=BRF.notam[c];if(!N)return[];return typeof adcEvaluate==='function'?adcEvaluateAtTimes(N.list,briefTimes(c,L),[],true).filter(r=>adcNoticeTime(r.n,r.at)==='active').map(r=>r.n):[]}
const notamGeo=n=>!!((n.pts&&n.pts.length)||n.qll||n.apll);
const BRF_NOTAM_SELECTION=new Map();
function briefNotamCardInfo(n){
 const text=String(n.e||n.raw||'').toUpperCase(),element=text.match(/\b(?:TWY|RWY)\s+[A-Z0-9]+(?:\/[A-Z0-9]+)?/),closed=/\bCLSD\b/.test(text),work=/\bWIP\b/.test(text);
 const type=/\b(?:APRON|STAND|PRKG)\b/.test(text)?'apron':/\b(?:OBST|OBSTACLE|CRANE)\b/.test(text)?'obstacle':/\b(?:LGT|LIGHT|PAPI|ALS)\b/.test(text)?'lights':/\b(?:ILS|VOR|DME|NDB)\b/.test(text)?'navaid':/\b(?:FREQ|COM|RDO)\b/.test(text)?'communication':/\bTWY\b/.test(text)?'taxiway':/\bRWY\b/.test(text)?'runway':/\b(?:SLOT|COORDINATED)\b/.test(text)?'slot':/\b(?:ATS|HR SER)\b/.test(text)?'service':'other';
 const icons={taxiway:'<path d="M4 20 9 4h6l5 16M8 10h8M6 16h12"/>',runway:'<path d="M6 3h12v18H6zM12 5v3m0 3v3m0 3v2"/>',slot:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M12 14v3l2 1"/>',lights:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 4H9z"/>',navaid:'<path d="M12 8v13m-4 0h8M7 5a7 7 0 0 0 0 10m10-10a7 7 0 0 1 0 10"/><circle cx="12" cy="8" r="2"/>',other:'<path d="m12 3 10 18H2L12 3ZM12 9v5m0 3v1"/>'};
 Object.assign(icons,{apron:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',obstacle:'<path d="M6 21V3h14M6 7h14M16 7v7m-2 0h4M3 21h8"/>',communication:'<path d="M12 9v12m-4 0h8M6 5a8 8 0 0 0 0 12m12-12a8 8 0 0 1 0 12"/><circle cx="12" cy="8" r="2"/>',service:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'});
 return{type,icon:_ic(icons[type]||icons.other),label:element?element[0]:t('ntc_'+type),summary:closed?t(work?'ntc_closed_work':'ntc_closed'):t('ntc_'+type),closed};
}
function briefNotamCapacity(){const width=document.querySelector('.brf-notam-content')?.clientWidth||innerWidth;return width>=900?6:width>=600?4:2}
const BRF_NOTAM_FILTER=new Map(),BRF_NOTAM_PAGE=new Map();
function briefNotamCardsHTML(c,role,list,item){
 const order=['taxiway','runway','apron','obstacle','lights','navaid','communication','slot','service','other'],key=c+'|'+role;
 list=[...list].sort((a,b)=>Number(b.hit)-Number(a.hit)||order.indexOf(briefNotamCardInfo(a).type)-order.indexOf(briefNotamCardInfo(b).type));
 const categories=order.filter(type=>list.some(n=>briefNotamCardInfo(n).type===type));let category=BRF_NOTAM_FILTER.get(key)||'all';if(category!=='all'&&!categories.includes(category))category='all';
 const filtered=list.filter(n=>category==='all'||briefNotamCardInfo(n).type===category),capacity=briefNotamCapacity(),pages=Math.ceil(filtered.length/capacity),page=Math.max(0,Math.min(BRF_NOTAM_PAGE.get(key)||0,pages-1));
 const filters=`<div class="ntc-categories" role="group" aria-label="NOTAM">${['all',...categories].map(type=>`<button type="button" class="btn small" data-action="brf-notam-category" data-key="${esc(key)}" data-category="${type}" aria-pressed="${category===type}">${esc(t('ntc_'+type))} · ${type==='all'?list.length:list.filter(n=>briefNotamCardInfo(n).type===type).length}</button>`).join('')}</div>`;
 const cards=filtered.slice(page*capacity,(page+1)*capacity).map(n=>{const info=briefNotamCardInfo(n);return `<article class="ntc-flip${n.hit?' ntc-flight-valid':''}" data-category="${info.type}" data-id="${esc(n.id)}"><div class="ntc-flip-inner"><button type="button" class="ntc-card ntc-flip-front${info.closed?' ntc-closed':''}" data-action="brf-notam-flip" aria-expanded="false"><span class="ntc-art" aria-hidden="true">${info.icon}</span><span class="ntc-label">${esc(info.label)}</span>${n.hit?`<span class="chip warn ntc-flight-badge">${t('brf_n_hit')}</span>`:''}<strong>${esc(info.summary)}</strong><span class="mono ntc-id">${esc(n.id)}</span><small>${esc(t('ntc_flip_read'))} ↻</small></button><div class="ntc-flip-back" inert><header><b class="mono">${esc(n.id)}</b><button type="button" class="btn small" data-action="brf-notam-flip">↶ ${esc(t('ntc_flip_back'))}</button></header><ul class="ntm-list ntc-flip-message">${item(n)}</ul><button type="button" class="btn small" data-action="brf-notam-full">${esc(t('brf_fit_read'))}</button></div></div></article>`}).join('');
 return `<div class="ntc-picker ntc-flip-picker" data-capacity="${capacity}" data-notam-key="${esc(key)}">${filters}<div class="ntc-grid">${cards}</div>${pages>1?`<div class="ntc-pages">${Array.from({length:pages},(_,p)=>`<button type="button" class="btn small" data-action="brf-notam-page" data-key="${esc(key)}" data-page="${p}" aria-pressed="${page===p}">${p+1}</button>`).join('')}</div>`:''}</div>`;
}

{let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>{const picker=[...document.querySelectorAll('.ntc-picker')].find(el=>el.getClientRects().length);if(picker&&Number(picker.dataset.capacity)!==briefNotamCapacity())render()},180)})}
function briefNotamBox(c,L,role){
  if(BRF.err[c]==="missing")return`<div class="notice">${t("brf_n_missing")}</div>`;
  if(BRF.err[c])return`<div class="notice bad">${t("brf_n_fail")}</div>`;
  const N=BRF.notam[c];if(!N)return`<p class="muted">${t("brf_n_loading")}</p>`;
  /* janela que importa: na origem, da EOBT − 1 h até 1 h depois; no destino, da ETA − 1 h até ETA + 2 h */
  const w0=role==="dep"?L.eobt-36e5:L.eta-36e5,w1=role==="dep"?L.eobt+36e5:L.eta+2*36e5;
  const activeIds=new Set(notamHits(c,L,role).map(n=>n.id));
  const list=N.list.map(n=>({...n,hit:activeIds.has(n.id),fut:n.from!=null&&n.from>w1}))
    .filter(n=>!(n.to!=null&&n.to<Date.now()))
    .sort((a,b)=>(b.hit-a.hit)||((a.from||0)-(b.from||0)));
  const hits=list.filter(n=>n.hit),rest=list.filter(n=>!n.hit),all=BRF.showAll[c+role]||BRF.printing;
  if(!list.length)return`<p class="muted">${t("brf_n_none")}</p>`;
  const z=ms=>ms==null?"—":ms===Infinity?"PERM":`${new Date(ms).toISOString().slice(8,10)}/${new Date(ms).toISOString().slice(5,7)} ${utcHM(ms)}Z`;
  const item=n=>`<li class="ntm${n.hit?" hit":""}"><div class="ntm-h"><b class="mono">${esc(n.id)}</b>${n.code?`<span class="chip neutral mono">${esc(n.code)}</span>`:""}${n.hit?`<span class="chip warn">${t("brf_n_hit")}</span>`:n.fut?`<span class="chip neutral">${t("brf_n_future")}</span>`:""}${n.hit?`<button type="button" class="btn small ntm-pin" data-action="brf-pin" data-k="${esc(c+"|"+n.id)}" title="${esc(t("brf_m_show"))}">📍</button>`:""}<span class="muted mono ntm-v">${z(n.from)} → ${z(n.to)}${n.est?" EST":""}</span></div>
    ${typeof notamTextModesHTML==='function'?notamTextModesHTML(n):`<p class="ntm-e">${notamHi(n.e)}</p>`}${n.d?`<p class="muted ntm-x">D) ${esc(n.d)}</p>`:""}${n.f||n.g?`<p class="muted ntm-x">${n.f?`F) ${esc(n.f)} `:""}${n.g?`G) ${esc(n.g)}`:""}</p>`:""}</li>`;
  return`<p class="muted ntm-sum">${t("brf_n_sum",{n:list.length,h:hits.length})}</p>
    ${BRF.printing?`<ul class="ntm-list">${list.map(item).join('')}</ul>`:briefNotamCardsHTML(c,role,list,item)}`;
}

function briefNotamPanel(L){
 const roles=[{key:'dep',code:L.dep,label:t('brf_dep')},{key:'arr',code:L.arr,label:t('brf_arr')},{key:'alt',code:briefAlternate(L),label:briefAltText().split(' · ')[0]}],selected=roles.find(r=>r.key===BRF.notamRole)||roles[0];
 const tabs=`<div class="brf-weather-tabs brf-notam-airport-tabs" role="group" aria-label="NOTAMs">${roles.map(r=>`<button type="button" class="btn" data-action="brf-notam-airport" data-v="${r.key}" aria-pressed="${r.key===selected.key}"><strong>${esc(r.code||r.label)}</strong><small>${esc(r.label)}</small></button>`).join('')}</div>`;
 if(!selected.code)return `<section class="panel brf-weather-compact brf-notam-compact">${tabs}<p class="notice warn">${t('brf_alt_required_compact')}</p></section>`;
 const c=selected.code,name=AIRPORTS?.[c]?.[3]||'',at=selected.key==='dep'?L.eobt:briefTime(c,L);
 return `<section class="panel brf-weather-compact brf-notam-compact">${tabs}<header class="brf-weather-heading"><h3><span class="mono">${esc(c)}</span> <span class="muted">${esc(name)}</span></h3><span class="muted mono">${selected.key==='dep'?'EOBT':'ETA'} ${utcHM(at)}Z · ${tf.format(at)} ${t('t_local')}</span></header><div class="brf-notam-content">${briefNotamBox(c,L,selected.key)}</div><div class="brf-weather-sources">${/^S[BDNSW]/.test(c)?`<a href="https://aisweb.decea.mil.br/?i=aerodromos&codigo=${encodeURIComponent(c)}" target="_blank" rel="noopener">AISWEB ${esc(c)} ↗</a>`:''}<a href="https://aviationweather.gov/data/metar/?ids=${encodeURIComponent(c)}&taf=1" target="_blank" rel="noopener">aviationweather.gov ↗</a></div></section>`;
}
function briefFlightAlternateHTML(L){if(typeof baHTML==='function')return baHTML(L);return `<div class="brf-flight-alternate"><div class="brf-right-controls"><div class="brf-alternate-fields"><label>${esc(briefAltText().split(' · ')[0])}<input id="brf-alternate" data-leg="${esc(L.key)}" maxlength="4" placeholder="ICAO" value="${esc(briefAlternate(L))}" aria-label="${esc(briefAltText())}" aria-invalid="${!briefAlternate(L)}" ${!briefAlternate(L)?'aria-describedby="brf-alt-notice"':''}></label>${briefAlternate(L)?`<label>ETA · ${esc(briefAlternate(L))} (${t('t_local')})<input id="brf-alternate-eta" data-leg="${esc(L.key)}" type="datetime-local" value="${toLocalInput(briefAltEta(L))}"></label>`:''}</div>${typeof briefDispatchNotice==='function'?briefDispatchNotice(L):''}</div>
   </div>`}
const BRF_SECTION_ICONS={flight:'<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.2a2.8 2.8 0 0 0 0 5.6V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.2a2.8 2.8 0 0 0 0-5.6Z"/><path d="M15.5 5v2.5m0 3v3m0 3V19"/><path d="M6.5 12h5m-2-2 2 2-2 2"/>',tracking:'<path d="M3.5 20.5c1.8-3.6 4.7-4.4 7-6.3s3-5.4 6.2-7" stroke-dasharray="1.6 2.6"/><path d="M21 3.5 15 5.6l3.4 3.4Z" fill="currentColor"/><circle cx="3.5" cy="20.5" r="1.3" fill="currentColor"/>',wx:'<path d="M8 2.5v1.6M3.4 4.4l1.1 1.1M1.5 9h1.6M12.6 4.4l-1.1 1.1"/><path d="M5.2 11.6A3.5 3.5 0 1 1 11.6 7"/><path d="M17.5 20.5H9a4 4 0 1 1 1-7.9 5.2 5.2 0 0 1 9.8 2A3 3 0 0 1 17.5 20.5Z"/>',notam:'<path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12Z"/><path d="M14 2.5v5h5"/><path d="M12 10.5v4.5m0 2.6v.1"/>',net:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="13.5" width="4" height="6.5" rx="1.6"/><rect x="17" y="13.5" width="4" height="6.5" rx="1.6"/><path d="M19 20c0 1.3-1.3 2-3 2h-3"/>',charts:'<path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12Z"/><path d="M14 2.5v5h5"/><path d="M8.5 18.5 15 11"/><path d="m8 13 2.5 1-1 2.5" /><circle cx="15" cy="11" r="1.2" fill="currentColor"/>',plan:'<circle cx="5.5" cy="18.5" r="2"/><path d="M18.5 3.5 21 6l-2.5 2.5L16 6Z"/><path d="M7.5 18.5h7.5a3.2 3.2 0 0 0 0-6.4H9a3.2 3.2 0 0 1 0-6.4h6"/>',checklist:'<rect x="5" y="4" width="14" height="17.5" rx="2"/><path d="M9 4V2.5h6V4"/><path d="m8.3 10.3 1.3 1.3 2.4-2.4m2 1.1h2.5m-8.2 4.9 1.3 1.3 2.4-2.4m2 1.1h2.5"/>'};
function briefSectionIcon(key){if(BRF_SECTION_ICONS[key])return _ic(BRF_SECTION_ICONS[key]);if(key==='aircraft')return briefExtraIcon(key);return NAV_ICON.map}
function briefPlanningLinks(L){
 const reservation=data.reservations.find(r=>r.id===L.key),target=reservation||{aircraftId:L.acId,dep:L.dep,arr:L.arr,eobt:L.eobt};
 const previous=reservation?bookingPreviousIncomplete(reservation):null;
 let html=sbLink(target,'','SimBrief')+svLink(target,'');
 if(previous)html=html.replace(/<a\b/g,'<a aria-disabled="true" tabindex="-1"').replace(/ href="[^"]*"/g,'').replace(/↗/g,'<span class="dispatch-lock" aria-hidden="true">🔒</span>');
 return `<div class="brf-planning-prominent${previous?' is-locked':''}" role="group" aria-label="${esc(t('brf_tab_plan'))}"${previous?` title="${esc(bookingSequenceMessage(previous))}"`:''}>${html}</div>`;
}
function briefTrackingActivate(L){
 const r=data.reservations.find(r=>r.id===L?.key);
 if(!r||bookingPreviousIncomplete(r)||!trkCanStart(r)&&TRK.resId!==r.id)return false;
 if(TRK.resId&&TRK.resId!==r.id&&['connected','connecting','lost'].includes(TRK.status))return false;
 if(TRK.resId!==r.id){trkReset();TRK.resId=r.id;trkSave()}
 return true;
}
function briefTrackingPanel(L){
 const r=data.reservations.find(r=>r.id===L.key),previous=r?bookingPreviousIncomplete(r):null;
 let body;
 if(!r)body=`<p class="notice">${t('trk_pick')}</p>`;
 else if(previous)body=bookingSequenceGate(`<button type="button" class="btn primary" data-action="trk-open" data-id="${esc(r.id)}">${t('trk_start')}</button>`,r);
 else if(TRK.resId===r.id)body=`<div class="trk" id="brf-track-box" data-reservation="${esc(r.id)}">${liveInner()}</div>`;
 else if(TRK.resId&&['connected','connecting','lost'].includes(TRK.status))body=`<p class="notice warn">${t('trk_other')}</p><button type="button" class="btn" data-action="trk-open" data-id="${esc(TRK.resId)}">${t('trk_back')}</button>`;
 else body=`<p class="muted">${t(trkCanStart(r)?'trk_conn_none':'trk_not_yet')}</p>${trkCanStart(r)?`<button type="button" class="btn primary" data-action="trk-open" data-id="${esc(r.id)}">${t('trk_start')}</button>`:''}`;
 return `<section class="panel brf-tracking"><header class="brf-tracking-head"><h3>${t('brf_tab_tracking')}</h3><span class="muted mono">${esc(L.fno||'—')} · ${esc(L.dep)} → ${esc(L.arr)}</span></header>${body}<div class="brf-tracking-help">${trkHelpHTML().replace(' open>','>')}</div></section>`;
}
function viewBriefing(){
  const legs=briefLegs();
  if(!legs.length)return`
    <div class="empty"><h3>🔒 ${t("brf_locked")}</h3><p>${t("brf_locked_b")}</p><button class="btn primary" data-view="roster">${t("rs_gen")}</button></div>`;
  if(!legs.some(L=>L.key===BRF.sel))BRF.sel=legs[0].key;
  const L=legs.find(x=>x.key===BRF.sel),a=acById(L.acId)||{registration:L.acId,type:"",airline:""};
  if(typeof baEnsure==='function')queueMicrotask(()=>baEnsure(L));
  if(typeof briefDispatchSync==='function')briefDispatchSync();
  briefLoad(briefAirports(L));
  const z=ms=>utcHM(ms)+"Z",ap=c=>(AIRPORTS&&AIRPORTS[c]&&AIRPORTS[c][3])||"";
  if(!AIRPORTS&&typeof loadAirports==="function")loadAirports().then(()=>{if(view==="briefing")render()});
  const flightCard=(x,aircraft,full=false)=>`<small class="brf-card-date">${esc(cap1(dtfDay(x.eobt)))}${full?` · ${tf.format(x.eobt)} ${t('t_local')}`:''}</small><strong class="brf-card-flight">${alSym(aircraft.airline||'')}${esc(x.fno||'—')}</strong><span class="mono brf-card-route">${esc(x.dep)} → ${esc(x.arr)}${x.ferry?` <span class="chip neutral">${t('ferry_chip')}</span>`:''}</span>${full?`<div class="brf-card-meta brf-card-aircraft"><span class="plate al-plate${plLen(aircraft.registration||x.acId)}"${plateStyle(aircraft.airline||'')}>${esc(aircraft.registration||x.acId)}</span><span>${esc(aircraft.airline||'')} · ${esc(aircraft.type||'')}</span></div><div class="brf-card-timetable"><span>EOBT <b>${z(x.eobt)}</b></span><span>ETA <b>${z(x.eta)}</b></span><span>${t('brf_flight_duration')} <b>${hhmm(Math.max(0,Math.round((x.eta-x.eobt)/60000)))}</b></span></div>`:`<small class="mono brf-card-block">${z(x.eobt)} · ${hhmm(Math.max(0,Math.round((x.eta-x.eobt)/60000)))}</small>`}`;
  const tabs=legs.map(x=>{const aircraft=acById(x.acId)||{registration:x.acId};return `<button type="button" class="brf-flight-option" data-action="brf-leg" data-k="${esc(x.key)}" aria-pressed="${x.key===L.key}">${flightCard(x,aircraft)}</button>`}).join('');
  const br=c=>/^S[BDNSW]/.test(c)?`<a class="btn small" href="https://aisweb.decea.mil.br/?i=aerodromos&codigo=${encodeURIComponent(c)}" target="_blank" rel="noopener">AISWEB ${esc(c)} ↗</a>`:"";
  const col=(c,role,kind)=>`<section class="panel brf-ap"><header class="brf-aph"><span class="eyebrow">${role==='alt'?esc(briefAltText().split(' · ')[0]):t(role==="dep"?"brf_dep":"brf_arr")}</span><h3><span class="mono">${esc(c)}</span> <span class="muted">${esc(ap(c))}</span></h3>
      <span class="muted mono">${role==="dep"?`EOBT ${z(L.eobt)} · ${tf.format(L.eobt)} ${t("t_local")}`:`ETA ${z(briefTime(c,L))} · ${tf.format(briefTime(c,L))} ${t("t_local")}`}</span></header>
    ${kind==='wx'?`<h4 class="brf-h4">☁ ${t("brf_met")}</h4><div class="brf-wx">${briefWxBox(c)}</div>`:''}
    ${kind==='notam'?`<h4 class="brf-h4">⚠ NOTAM ${BRF.nload[c]?`<span class="muted" style="font-weight:400">· ${t("brf_n_loading")}</span>`:""}</h4>${briefNotamBox(c,L,role)}`:''}
    <div class="row" style="gap:6px;flex-wrap:wrap">${br(c)}<a class="btn small" href="https://aviationweather.gov/data/metar/?ids=${encodeURIComponent(c)}&taf=1" target="_blank" rel="noopener">aviationweather.gov ↗</a></div></section>`;
  return`<div class="brf-workspace${briefNavPosition()==='top'?' brf-nav-top':''}${!BRF.printing&&BRF.section==='wx'?' brf-weather-workspace':''}${!BRF.printing&&BRF.section==='flight'?' brf-flight-workspace':''}"><div class="sec-head brf-toolbar">
     <div class="row brf-tools" style="gap:8px"><label class="brf-nav-position">${t('brf_nav_position')}<select id="brf-nav-position"><option value="side" ${briefNavPosition()==='side'?'selected':''}>${t('brf_nav_side')}</option><option value="top" ${briefNavPosition()==='top'?'selected':''}>${t('brf_nav_top')}</option></select></label><button class="btn" data-action="brf-refresh">↻ ${t("brf_refresh")}</button><button class="btn primary" data-action="brf-print">🖨 ${t("brf_print")}</button></div></div>
   ${BRF.printing?`<div class="brf-print-head"><div><b>${t("brf_eyebrow")}</b> · ${esc(L.fno||"")} ${esc(L.dep)} → ${esc(L.arr)} · ${esc(a.registration||L.acId)} ${esc(a.type||"")}</div><div class="mono">${t("brf_p_pilot")}: ${esc((typeof names!=="undefined"&&names[myId])||"")} · ${t("brf_p_issued")}: ${new Date().toISOString().slice(0,16).replace("T"," ")}Z</div></div>`:""}
   ${legs[0].gen?`<p class="notice" style="margin:0 0 12px">${t("brf_gen_note")}</p>`:""}
   <div class="brf-flight-context">${alSym(a.airline||'')}<strong>${esc(L.fno||'—')}</strong><span class="mono">${esc(L.dep)} → ${esc(L.arr)}</span><span class="muted mono">${z(L.eobt)}</span></div>
<div class="brf-section-layout"><nav class="brf-subnav" aria-label="${t('brf_title')}">${['flight','wx','notam','plan','charts','map','aircraft','net','tracking'].map(k=>`<button type="button" class="btn" data-action="brf-section" data-section="${k}" aria-label="${esc(t('brf_tab_'+k))}" aria-pressed="${(BRF.section||'map')===k}">${briefSectionIcon(k)}<span class="brf-subnav-name">${t('brf_tab_'+k)}</span><span class="brf-subnav-tip" aria-hidden="true">${t('brf_tab_'+k)}</span></button>`).join('')}</nav><div class="brf-section-content"><div class="brf-flight-toolbar-select brf-flight-below-nav"><span id="brf-flight-picker-label">${t('brf_flight_select')}</span>${(()=>{const row=x=>{const ac=acById(x.acId)||{};return `${alSym(ac.airline||'')}<strong class="brf-inline-number">${esc(x.fno||'—')}</strong><span class="mono brf-inline-route">${esc(x.dep)} → ${esc(x.arr)}</span><span class="muted brf-inline-date">${esc(dtfDay(x.eobt))}</span><span class="mono brf-inline-time">${z(x.eobt)}</span>`};return legs.length>1?`<details class="brf-inline-picker"><summary class="brf-inline-selection" aria-labelledby="brf-flight-picker-label"><span class="brf-inline-data">${row(L)}</span><span class="brf-inline-chevron" aria-hidden="true">⌄</span></summary><div class="brf-inline-options">${legs.map(x=>`<button type="button" class="brf-inline-selection" data-action="brf-leg" data-k="${esc(x.key)}" aria-pressed="${x.key===L.key}"><span class="brf-inline-data">${row(x)}</span></button>`).join('')}</div></details>`:`<div class="brf-inline-selection brf-inline-single" aria-labelledby="brf-flight-picker-label"><span class="brf-inline-data">${row(L)}</span></div>`})()}${briefPlanningLinks(L)}</div>

   <div class="brf-subpanel" data-brf-section="flight" ${!BRF.printing&&(BRF.section||'map')!=='flight'?'hidden':''}>
   ${(()=>{const r=data.reservations.find(r=>r.id===L.key),status=statusOf(L.acId);const acts=bookingFlightActions(r,a,status).replace(/<button[^>]*data-action="trk-open"[^>]*>[\s\S]*?<\/button>/g,'').replace(/<div class="bk-planning-actions">[\s\S]*?<\/div>/,'');return programmingFlightDetail(r,a,status,acts)})()}
   </div>
   <div class="brf-subpanel" data-brf-section="map" ${!BRF.printing&&(BRF.section||'map')!=='map'?'hidden':''}>${mapPanel(L)}</div>
   <div class="brf-subpanel" data-brf-section="net" ${!BRF.printing&&(BRF.section||'map')!=='net'?'hidden':''}>${typeof netPanelHTML==='function'?netPanelHTML(L):''}</div>
   <div class="brf-subpanel" data-brf-section="tracking" ${!BRF.printing&&BRF.section!=='tracking'?'hidden':''}>${briefTrackingPanel(L)}</div>
   ${['wx','notam'].map(kind=>`<div class="brf-subpanel" data-brf-section="${kind}" ${!BRF.printing&&(BRF.section||'map')!==kind?'hidden':''}>${!BRF.printing?(kind==='wx'?briefWeatherPanel(L):briefNotamPanel(L)):`<div class="brf-grid">${col(L.dep,'dep',kind)}${col(L.arr,'arr',kind)}${briefAlternate(L)?col(briefAlternate(L),'alt',kind):''}</div>${kind==='wx'?sigSection(L):''}`}</div>`).join('')}
   ${['charts','plan','aircraft'].map(key=>`<div class="brf-subpanel" data-brf-section="${key}" ${!BRF.printing&&(BRF.section||'map')!==key?'hidden':''}>${briefExtraPanel(key,L)}</div>`).join('')}
   </div></div>
   <p class="muted" style="font-size:.8rem">${t("brf_src")}</p>
   ${BRF.printing?`<div class="brf-sign"><span>${t("brf_p_sign")}</span><span class="ln"></span><span class="mono">${t("brf_p_date")}</span><span class="ln short"></span></div>`:""}</div>`;
}

document.addEventListener('change',e=>{if(e.target.id==='brf-flight-select'){BRF.sel=e.target.value;queueMicrotask(render);return}if(e.target.id==='brf-alternate-eta'){const L=briefLegs().find(l=>l.key===e.target.dataset.leg),ms=new Date(e.target.value).getTime();if(!L||!Number.isFinite(ms)||ms<L.eobt){e.target.setCustomValidity('ETA inválida');e.target.reportValidity();return}e.target.setCustomValidity('');try{localStorage.setItem('vfr-brief-alt-eta:'+myId+':'+L.key,String(ms))}catch(x){}queueMicrotask(render);return}if(e.target.id!=='brf-alternate')return;const code=e.target.value.trim().toUpperCase();if(code&&(!/^[A-Z0-9]{4}$/.test(code)||!AIRPORTS?.[code])){e.target.setCustomValidity('ICAO inválido');e.target.reportValidity();return}e.target.setCustomValidity('');const L=briefLegs().find(l=>l.key===e.target.dataset.leg);if(L&&typeof baSaveManual==='function')baSaveManual(L,code);else try{localStorage.setItem('vfr-brief-alt:'+myId+':'+e.target.dataset.leg,code)}catch(x){}queueMicrotask(render)});
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest('[data-action^="brf-"]');if(!b)return;
  const a=b.dataset.action;
  if(a==='brf-map-retry'){brfMap();return}
  if(a==='brf-section'){BRF.section=b.dataset.section;if(BRF.section==='tracking'){briefTrackingActivate(briefLegs().find(L=>L.key===BRF.sel));render();return}document.querySelector('.brf-workspace')?.classList.toggle('brf-weather-workspace',BRF.section==='wx');document.querySelector('.brf-workspace')?.classList.toggle('brf-flight-workspace',BRF.section==='flight');if(BRF.section==='wx')metarVisualRequestWind();document.querySelectorAll('[data-brf-section]').forEach(p=>p.hidden=p.dataset.brfSection!==BRF.section);document.querySelectorAll('[data-action="brf-section"]').forEach(p=>p.setAttribute('aria-pressed',String(p.dataset.section===BRF.section)));if(BRF.section==='map')setTimeout(brfMap,0);else if(BRF.section==='flight')requestAnimationFrame(brfObserveFlightPicker);return}
  if(a==='brf-pin'){BRF.section='map';document.querySelectorAll('[data-brf-section]').forEach(p=>p.hidden=p.dataset.brfSection!=='map');document.querySelectorAll('[data-action="brf-section"]').forEach(p=>p.setAttribute('aria-pressed',String(p.dataset.section==='map')));BRF.map?.invalidateSize()}

  if(a==="brf-leg"){BRF.sel=b.dataset.k;if(BRF.section==='tracking')briefTrackingActivate(briefLegs().find(L=>L.key===BRF.sel));render();return}
  if(a==="brf-print"){brfPrint();return}
  if(a==="brf-pin"&&typeof adcSurfaceNotice==='function'&&b.dataset.k){const [code,id]=b.dataset.k.split('|'),n=BRF.notam[code]?.list.find(n=>n.id===id);if(adcAirports(BRF.mapLeg).includes(code)&&n){if(ADC_SURFACE.code!==code)adcSurfaceInit(BRF.map,window.L,BRF.mapLeg,ADC_SURFACE.control,code).then(()=>adcSurfaceFocus(id));else adcSurfaceFocus(id);document.querySelector('.brf-surface')?.scrollIntoView({behavior:'smooth',block:'center'});return}}
  if(a==="brf-pin"){BRF.pin=b.dataset.k;const el=document.getElementById("brf-map");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});
    const g=BRF.map&&BRF.mapLayers&&BRF.mapLayers[BRF.pin];if(g){BRF.map.fitBounds(g.getBounds().pad(.6),{maxZoom:12});g.openPopup();BRF.pin=null}return}
  if(a==="brf-all"){const k=b.dataset.k;BRF.showAll[k]=!BRF.showAll[k];render();return}
  if(a==="brf-wxmode"){try{localStorage.setItem("vfr-wx-mode",b.dataset.v)}catch(x){}render();return}
  if(a==='brf-wx-select'){if(!['dep','arr','alt','route'].includes(b.dataset.role))return;BRF.wxRole=b.dataset.role;if(b.dataset.role==='route'){if(!['SIGMET','AIRMET','GAMET'].includes(b.dataset.kind))return;BRF.wxHazard=b.dataset.kind}else{if(!['METAR','TAF'].includes(b.dataset.kind))return;BRF.wxReport=b.dataset.kind}metarVisualRequestWind();render();return}
  if(a==='brf-wx-airport'){if(!['dep','arr','alt','route'].includes(b.dataset.v))return;BRF.wxRole=b.dataset.v;metarVisualRequestWind();render();return}
  if(a==='brf-notam-category'){BRF_NOTAM_FILTER.set(b.dataset.key,b.dataset.category);BRF_NOTAM_PAGE.set(b.dataset.key,0);render();return}
  if(a==='brf-notam-page'){BRF_NOTAM_PAGE.set(b.dataset.key,Number(b.dataset.page)||0);render();return}
  if(a==='brf-notam-flip'){const card=b.closest('.ntc-flip'),flipped=card.classList.toggle('is-flipped');card.querySelector('.ntc-flip-front').setAttribute('aria-expanded',String(flipped));card.querySelector('.ntc-flip-front').inert=flipped;card.querySelector('.ntc-flip-back').inert=!flipped;(flipped?card.querySelector('.ntc-flip-back button'):card.querySelector('.ntc-flip-front')).focus({preventScroll:true});return}
  if(a==='brf-notam-full'){const content=b.closest('.ntc-flip-back').querySelector('.ntc-flip-message');openSheet('form',head(t('brf_title'),'NOTAM')+'<div class="brf-fit-reading">'+content.outerHTML+'</div>');return}
  if(a==='brf-notam-card'){BRF_NOTAM_SELECTION.set(b.dataset.key,b.dataset.id);if(BRF_NOTAM_SELECTION.size>50)BRF_NOTAM_SELECTION.delete(BRF_NOTAM_SELECTION.keys().next().value);render();return}
  if(a==='brf-notam-airport'){if(!['dep','arr','alt'].includes(b.dataset.v))return;BRF.notamRole=b.dataset.v;render();return}
  if(a==='brf-route-page'){BRF_ROUTE_SELECTION.set(b.dataset.key,Number(b.dataset.index));render();return}
  if(a==='brf-route-message'){const key=b.dataset.key,index=Number(b.dataset.index);let card=b.closest('.rwx-flip');const flipped=!card.classList.contains('is-flipped');if(BRF_ROUTE_SELECTION.get(key)!==index){BRF_ROUTE_SELECTION.set(key,index);render();card=[...document.querySelectorAll('.rwx-flip')].find(el=>Number(el.dataset.routeIndex)===index)}if(!card)return;card.classList.toggle('is-flipped',flipped);const front=card.querySelector('.rwx-flip-front'),back=card.querySelector('.rwx-flip-back');front.setAttribute('aria-expanded',String(flipped));front.inert=flipped;back.inert=!flipped;(flipped?back:front).focus({preventScroll:true});return}
  if(a==='brf-route-mode'){const box=b.closest('.rwx-detail'),decoded=b.dataset.mode==='decoded';box.querySelectorAll('[data-action="brf-route-mode"]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));box.querySelector('.sgm-raw').hidden=decoded;box.querySelector('.rwx-decoded').hidden=!decoded;return}
  if(a==='brf-wx-hazard'){if(!['SIGMET','AIRMET','GAMET'].includes(b.dataset.v))return;BRF.wxHazard=b.dataset.v;render();return}
  if(a==="brf-refresh"){if(typeof briefDispatchSync==='function')briefDispatchSync(true);const L=briefLegs().find(x=>x.key===BRF.sel);if(L){BRF.wx={};briefLoad(briefAirports(L),true);BRF.sig=null;briefLoadSig(true)}render();toast(t("brf_refreshing"));return}
});

/* ---------- SIGMET, AIRMET e GAMET (função "sigwx") ---------- */
const SIG_TTL=10*60e3;
const BR_FIR={SBAZ:"Amazônica",SBBS:"Brasília",SBCW:"Curitiba",SBRE:"Recife",SBAO:"Atlântico"};
const HZ_COLOR={TS:"#D92D20",CB:"#D92D20",TC:"#D92D20",TURB:"#F79009",MTW:"#F79009",ICE:"#2E90FA",VA:"#9E77ED",ASH:"#9E77ED",DS:"#B54708",SS:"#B54708",RDOACT:"#12B76A","IFR":"#667085","MT OBSC":"#667085"};
const hzKey=h=>{h=String(h||"").toUpperCase();for(const k of Object.keys(HZ_COLOR))if(h.includes(k))return k;return""};
async function briefLoadSig(force){
  if(BRF.sigBusy||!sb)return;if(!force&&BRF.sig&&(Date.now()-BRF.sig.at<SIG_TTL||BRF.sig.err))return;
  BRF.sigBusy=true;
  try{const {data:d,error}=await sb.functions.invoke("sigwx",{body:{}});if(error)throw error;
    BRF.sig={at:Date.now(),items:Array.isArray(d&&d.items)?d.items:[],redemet:!!(d&&d.redemet)}}
  catch(e){const m=String(e&&e.message||e);BRF.sig={at:Date.now(),items:[],err:/not found|404|Failed to send|FunctionsFetchError|FunctionsHttpError/i.test(m)?"missing":"fail"}}
  finally{BRF.sigBusy=false;if(view==="briefing")render()}
}
/* geometria simples: pontos ao longo da rota (ortodrômica) e teste de ponto no polígono */
const R_NM=3440.065,rad=x=>x*Math.PI/180,deg=x=>x*180/Math.PI;
function gcDist(a,b){const dl=rad(b[0]-a[0]),dn=rad(b[1]-a[1]),h=Math.sin(dl/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dn/2)**2;return 2*R_NM*Math.asin(Math.min(1,Math.sqrt(h)))}
function gcPoints(a,b,stepNm=20){const d=gcDist(a,b),n=Math.max(1,Math.ceil(d/stepNm)),out=[];
  const [f1,l1,f2,l2]=[rad(a[0]),rad(a[1]),rad(b[0]),rad(b[1])],D=d/R_NM;
  for(let i=0;i<=n;i++){const f=i/n;if(D<1e-9){out.push(a);continue}
    const A=Math.sin((1-f)*D)/Math.sin(D),B=Math.sin(f*D)/Math.sin(D);
    const x=A*Math.cos(f1)*Math.cos(l1)+B*Math.cos(f2)*Math.cos(l2),y=A*Math.cos(f1)*Math.sin(l1)+B*Math.cos(f2)*Math.sin(l2),z=A*Math.sin(f1)+B*Math.sin(f2);
    out.push([deg(Math.atan2(z,Math.sqrt(x*x+y*y))),deg(Math.atan2(y,x))])}
  return out}
function inPoly(p,poly){let ins=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [yi,xi]=poly[i],[yj,xj]=poly[j];
  if(((yi>p[0])!==(yj>p[0]))&&(p[1]<(xj-xi)*(p[0]-yi)/((yj-yi)||1e-12)+xi))ins=!ins}return ins}
function nearRoute(poly,pts,buf=40){if(poly.length<3)return false;
  if(pts.some(p=>inPoly(p,poly)))return true;
  for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],seg=gcPoints(a,b,25);
    for(const q of seg)for(const p of pts)if(Math.abs(q[0]-p[0])<2&&gcDist(q,p)<=buf)return true}
  return false}
const apLLb=c=>AIRPORTS&&AIRPORTS[c]?[AIRPORTS[c][0],AIRPORTS[c][1]]:null;
function sigForLeg(L){
  const S=BRF.sig;if(!S||S.err)return null;
  const A=apLLb(L.dep),B=apLLb(L.arr);if(!A||!B)return{route:[],sig:[],air:[],gam:[]};
  const pts=gcPoints(A,B),w0=L.eobt-36e5,w1=L.eta+36e5,now=Date.now();
  const timeOk=m=>(m.from==null||m.from<=w1)&&(m.to==null||m.to>=Math.max(w0,now-6e4));
  const poly=S.items.filter(m=>m.coords&&m.coords.length>=3&&timeOk(m)&&nearRoute(m.coords,pts));
  const br=/^S[BDNSW]/.test(L.dep)||/^S[BDNSW]/.test(L.arr);
  const brText=S.items.filter(m=>m.src==="redemet"&&br&&timeOk(m));
  return{route:pts,sig:poly.filter(m=>m.kind==="SIGMET"),air:[...poly.filter(m=>m.kind==="AIRMET"),...brText.filter(m=>m.kind==="AIRMET")],gam:brText.filter(m=>m.kind==="GAMET")};
}
function sigItem(m){
  const z=ms=>ms==null?"—":`${new Date(ms).toISOString().slice(8,10)}/${new Date(ms).toISOString().slice(5,7)} ${utcHM(ms)}Z`;
  const hk=hzKey(m.hazard),fl=v=>v==null||v===""?"":(Number(v)>=1000?"FL"+String(Math.round(Number(v)/100)).padStart(3,"0"):"FL"+String(v).padStart(3,"0"));
  const lv=m.base!=null||m.top!=null?`${fl(m.base)||"SFC"}–${fl(m.top)||"?"}`:"";
  const fir=m.fir+(m.firName?` · ${m.firName}`:BR_FIR[m.fir]?` · ${BR_FIR[m.fir]}`:"");
  return`<li class="sgm"><div class="ntm-h"><span class="chip neutral mono">${esc(m.kind)}</span><b class="mono">${esc(fir)}</b>${m.hazard?`<span class="chip hz" style="--hz:${HZ_COLOR[hk]||"#667085"}">${esc((m.qual?m.qual+" ":"")+m.hazard)}${hk&&t("brf_hz_"+hk)!=="brf_hz_"+hk?` · ${esc(t("brf_hz_"+hk))}`:""}</span>`:""}${lv?`<span class="mono muted">${esc(lv)}</span>`:""}<span class="muted mono ntm-v">${z(m.from)} → ${z(m.to)}</span></div>
    <pre class="wx-raw sgm-raw">${esc(m.raw)}</pre></li>`}
const BRF_ROUTE_SELECTION=new Map();
function routeWeatherInfo(m){
 const key=hzKey(m.hazard),label=key&&t('brf_hz_'+key)!=='brf_hz_'+key?t('brf_hz_'+key):m.hazard||m.kind;
 const fl=v=>v==null||v===''?'':Number(v)>=1000?'FL'+String(Math.round(Number(v)/100)).padStart(3,'0'):'FL'+String(v).padStart(3,'0');
 const levels=m.base!=null||m.top!=null?`${fl(m.base)||'SFC'} → ${fl(m.top)||'?'}`:'—';
 const z=ms=>ms==null?'—':`${new Date(ms).toISOString().slice(8,10)}/${new Date(ms).toISOString().slice(5,7)} ${utcHM(ms)}Z`;
 const raw=String(m.raw||''),move=raw.match(/\bMOV\s+([A-Z]{1,3})\s+(\d+)KT\b/),condition=/\bFCST\b/.test(raw)?'FCST':/\bOBS\b/.test(raw)?'OBS':'—',trend=raw.match(/\b(NC|INTSF|WKN)\b/)?.[1]||'—';
 const icon=_ic(/TURB|MTW/.test(key)?'<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h5"/>':/ICE/.test(key)?'<path d="M12 2v20M3 7l18 10M3 17 21 7M8 4l4 4 4-4"/>':/TS|CB/.test(key)?'<path d="M5 15a5 5 0 1 1 1-10 6 6 0 0 1 11 2 4 4 0 1 1 1 8M13 10l-4 7h5l-3 5"/>':'<path d="m12 3 10 18H2L12 3ZM12 9v5m0 3v1"/>');
 return{label:(m.qual?m.qual+' · ':'')+label,levels,valid:z(m.from)+' → '+z(m.to),region:[m.fir,m.firName||BR_FIR[m.fir]].filter(Boolean).join(' · '),condition,move:move?move[1]+' · '+move[2]+' kt':'—',trend,icon};
}
function routeWeatherCards(list,L,kind){
 const key=(L.key||L.dep+'-'+L.arr)+'|'+kind,index=Math.min(BRF_ROUTE_SELECTION.get(key)||0,list.length-1),selected=list[index],info=routeWeatherInfo(selected),capacity=briefNotamCapacity(),page=Math.floor(index/capacity);
 const cards=list.slice(page*capacity,(page+1)*capacity).map((m,k)=>{const d=routeWeatherInfo(m),i=page*capacity+k;return `<div class="rwx-flip" data-route-index="${i}"><div class="rwx-flip-inner"><button type="button" class="rwx-card rwx-flip-front" data-action="brf-route-message" data-key="${esc(key)}" data-index="${i}" aria-expanded="false" aria-pressed="${i===index}"><span class="rwx-art" aria-hidden="true">${d.icon}</span><strong>${esc(d.label)}</strong><span class="rwx-region">${esc(d.region||m.kind)}</span><span class="mono">${esc(d.levels)}</span><small>${esc(d.valid)}</small><small class="rwx-flip-hint">${esc(t('rwx_flip_hint'))}</small></button><button type="button" class="rwx-card rwx-flip-back" data-action="brf-route-message" data-key="${esc(key)}" data-index="${i}" aria-label="${esc(t('rwx_flip_back'))}" inert><strong>${esc(m.kind+' · '+(m.fir||''))}</strong><span class="rwx-flip-raw">${esc(m.raw||'—')}</span></button></div></div>`}).join('');

 if(typeof routeWeatherCaptureInit==='function')setTimeout(routeWeatherCaptureInit,0);
 return `<div class="rwx-picker rwx-dashboard"><div class="rwx-sidebar"><div class="rwx-grid">${cards}</div>${list.length>capacity?`<div class="ntc-pages">${Array.from({length:Math.ceil(list.length/capacity)},(_,p)=>`<button type="button" class="btn small" data-action="brf-route-page" data-key="${esc(key)}" data-index="${p*capacity}" aria-pressed="${page===p}">${p+1}</button>`).join('')}</div>`:''}</div>${typeof routeWeatherCaptureHTML==='function'?routeWeatherCaptureHTML(selected,L):''}</div>`;

}
function notamTranslationLink(n){
  return notamTranslationHTML(n);
}
function briefMapNotams(L){
  return briefAirports(L).flatMap(code=>{
    const cache=BRF.notam[code];
    if(!cache||BRF.err[code]||Date.now()-cache.at>=NOTAM_TTL)return [];
    return adcEvaluateAtTimes(cache.list,briefTimes(code,L),[],true)
      .filter(row=>adcNoticeTime(row.n,row.at)==='active').map(row=>({...row,code}));
  });
}
function briefDrawNotams(L,Lf,m,control,saved){
  const layer=Lf.featureGroup();layer.options.key='BRIEF_NOTAMS';
  BRF.operationalNotams=layer;BRF.mapLayers={};
  const rows=briefMapNotams(L);
  for(const code of briefAirports(L)){
    const unlocated=[],byId=new Map();
    for(const row of rows.filter(row=>row.code===code)){
      const n=row.n,geometry=adcTextCoordinates(n);
      if(!geometry){unlocated.push(row);continue}
      const group=Lf.geoJSON(geometry,{
        style:{color:'#dc2626',weight:3,fillOpacity:.18},
        pointToLayer:(f,ll)=>Lf.circleMarker(ll,{radius:7,color:f.properties.approximate?'#b26a00':'#fff',weight:2,fillColor:f.properties.approximate?'#f5a623':'#dc2626',fillOpacity:1,dashArray:f.properties.approximate?'3 3':null})
      }).addTo(layer);
      group.bindTooltip(`${esc(code)} · ${esc(n.id)}`);
      group.bindPopup(`<b>${esc(code)} · ${esc(n.id)}</b><p>${esc(adcCoordinateDescription(geometry))}</p><p>${esc(n.e)}</p><pre class="wx-raw">${esc(n.raw||n.e)}</pre>${notamTranslationLink(n)}`,{maxWidth:460});
      byId.set(n.id,group);
    }
    adcGeneralNotices(unlocated,{code,restrictions:layer,byId},Lf);
    for(const [id,group] of byId)BRF.mapLayers[code+'|'+id]=group;
  }
  control.addOverlay(layer,'NOTAM');
  if(saved.BRIEF_NOTAMS!==false)layer.addTo(m);
}
function mapPanel(L){
  BRF.mapLeg=L;if(!BRF.sig||BRF.sig.err)BRF.mapItems=[];
  BRF.mapNotams=briefMapNotams(L);
  const nN=BRF.mapNotams.length;
  return`<section class="panel brf-mapp"><header class="brf-aph"><span class="eyebrow">${t("brf_m_eyebrow")}</span><h3>${t("brf_m_title")}</h3><span class="muted" style="font-size:.85rem">${t("brf_m_hint",{n:nN})}</span></header>
    <div id="brf-map" class="brf-map"></div>
    ${typeof adcSurfaceHTML==='function'&&adcEligible(L)?`<details class="brf-adc-details"><summary>${t('brf_adc_details')}</summary>${adcSurfaceHTML(L)}</details>`:''}
    <details class="brf-map-help"><summary>${t("brf_map_help")}</summary><p class="muted brf-map-hint">${t("brf_m_hint",{n:nN})}</p><div class="brf-legend"><span><i class="lg-route"></i>${t("brf_m_route")}</span><span><i class="lg-ntm"></i>${t("brf_m_area")}</span><span><i class="lg-obs"></i>${t("brf_m_point")}</span><span><i class="lg-sig"></i>SIGMET</span><span><i class="lg-air"></i>AIRMET</span><span><i class="tfc-k fly"></i>FlyVFR</span><span><i class="tfc-k vat"></i>${netBrandText("VATSIM")}</span><span><i class="tfc-k ivao"></i>${netBrandText("IVAO")}</span><span id="brf-tfc-st" class="brf-tfc-st"></span></div></details></section>`}
function sigSection(L,selectedKind=null,showTabs=true){
  briefLoadSig();
  const S=BRF.sig;let body;
  if(!S)body=`<p class="muted">${t("brf_s_loading")}</p>`;
  else if(S.err==="missing")body=`<div class="notice">${t("brf_s_missing")}</div>`;
  else if(S.err)body=`<div class="notice bad">${t("brf_s_fail")}</div>`;
  else{const r=sigForLeg(L);const br=/^S[BDNSW]/.test(L.dep)||/^S[BDNSW]/.test(L.arr);
    const grp=(title,list,empty)=>selectedKind&&selectedKind!==title?'':`<h4 class="brf-h4">${title} <span class="muted" style="font-weight:400">· ${list.length}</span></h4>${list.length?(BRF.printing?`<ul class="ntm-list">${list.map(sigItem).join('')}</ul>`:routeWeatherCards(list,L,title)):`<p class="muted" style="margin:0">${empty}</p>`}`;
    body=`${grp("SIGMET",r.sig,t("brf_s_none_sig"))}
      ${grp("AIRMET",r.air,t("brf_s_none_air"))}
      ${br?grp("GAMET",r.gam,S.redemet?t("brf_s_none_gam"):t("brf_s_nokey")):""}
      ${br&&!S.redemet&&typeof IS_ADMIN==="function"&&IS_ADMIN()?`<p class="notice" style="margin:0">${t("brf_s_admin_key")}</p>`:""}`;
    BRF.mapItems=[...r.sig,...r.air.filter(m=>m.coords&&m.coords.length>=3)]}
  setTimeout(brfMap,0);
  return`<section class="panel brf-sig"><header class="brf-aph"><span class="eyebrow">${t("brf_s_eyebrow")}</span><h3>${t("brf_s_title")}</h3><span class="muted" style="font-size:.85rem">${t("brf_s_hint")}</span></header>${selectedKind&&showTabs?`<div class="seg brf-wx-report-tabs">${['SIGMET','AIRMET','GAMET'].map(k=>`<button type="button" data-action="brf-wx-hazard" data-v="${k}" aria-pressed="${selectedKind===k}">${k}</button>`).join('')}</div>`:''}${body}</section>`}
let brfMapRequest=0;
function brfMapFailure(el){if(!el.isConnected)return;if(BRF.map?.getContainer()===el){try{BRF.map.remove()}catch(e){}BRF.map=null}el.innerHTML=`<div class="map-loading" role="status"><p>${t('map_err')}</p><button type="button" class="btn small" data-action="brf-map-retry">↻ ${t('brf_refresh')}</button></div>`}
async function brfMap(){
  const el=document.getElementById("brf-map");if(!el||!BRF.mapLeg||!el.getClientRects().length&&!BRF.printing)return;brfFitMap();
  const request=++brfMapRequest,leg=BRF.mapLeg,owner=myId;
  const current=()=>request===brfMapRequest&&el.isConnected&&document.getElementById('brf-map')===el&&BRF.mapLeg===leg&&myId===owner;
  if(!el._leaflet_id)el.innerHTML=`<div class="map-loading" role="status">${t('loading_map')}</div>`;
  try{await Promise.all([loadLeaflet(),loadAirports()])}catch(e){if(current())brfMapFailure(el);return}
  if(!current())return;
  try{
  if(BRF.map){try{BRF.map.remove()}catch(e){}BRF.map=null}
  const Lf=window.L,L=BRF.mapLeg,A=apLLb(L.dep),B=apLLb(L.arr);if(!A||!B){brfMapFailure(el);return}el.replaceChildren();
  const m=Lf.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:true,maxZoom:19});BRF.map=m;
  /* mapas de fundo: o escolhido fica salvo no aparelho */
  const base=brfBaseLayers(Lf),bk=(()=>{try{return localStorage.getItem("vfr-brf-base")}catch(e){return null}})();
  (base[bk]||base[t("brf_m_osm")]).addTo(m);
  const ov=brfOverlays(Lf);let saved={};try{saved=JSON.parse(localStorage.getItem("vfr-brf-ov")||"{}")}catch(e){}
  for(const [k,lay] of Object.entries(ov))if(saved[lay.options.key]!==false)lay.addTo(m);
  const layerControl=Lf.control.layers(base,ov,{collapsed:true,position:"topright"}).addTo(m);
  m.on("baselayerchange",e=>{try{localStorage.setItem("vfr-brf-base",e.name)}catch(x){}});
  const ovSave=(e,on)=>{try{const s=JSON.parse(localStorage.getItem("vfr-brf-ov")||"{}");s[e.layer.options.key]=on;localStorage.setItem("vfr-brf-ov",JSON.stringify(s))}catch(x){}brfTraffic(true)};
  m.on("overlayadd",e=>ovSave(e,true));m.on("overlayremove",e=>ovSave(e,false));
  /* botões para aproximar a origem e o destino (pistas, taxiways e pátio) */
  const Z=Lf.control({position:"topleft"});Z.onAdd=()=>{const d=Lf.DomUtil.create("div","leaflet-bar brf-zoomap");
    d.innerHTML=briefAirports(L).map(c=>`<a href="#" role="button" data-ap="${esc(c)}" title="${esc(t("brf_m_zoomap",{icao:c}))}">${esc(c)}</a>`).join("")+`<a href="#" role="button" data-ap="" title="${esc(t("brf_m_route"))}">⤢</a>`;
    Lf.DomEvent.disableClickPropagation(d);d.addEventListener("click",e=>{const a=e.target.closest("a");if(!a)return;e.preventDefault();
      if(a.dataset.ap){const ll=apLLb(a.dataset.ap);if(ll)m.setView(ll,15)}else m.fitBounds(BRF.mapFit,{maxZoom:8})});return d};Z.addTo(m);
  const route=gcPoints(A,B,30);const acc=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#F6C445";
  const bounds=Lf.latLngBounds(route);
  for(const s of BRF.mapItems){const c=HZ_COLOR[hzKey(s.hazard)]||"#667085";
    const pg=Lf.polygon(s.coords,{color:c,weight:2,fillColor:c,fillOpacity:.18,dashArray:s.kind==="AIRMET"?"6 4":null}).addTo(m);
    pg.bindTooltip(`${s.kind} ${s.fir} · ${(s.qual?s.qual+" ":"")+s.hazard}`,{sticky:true});bounds.extend(pg.getBounds())}
  Lf.polyline(route,{color:acc,weight:3,dashArray:"8 6"}).addTo(m);
  for(const [c,ll] of briefAirports(L).map(c=>[c,apLLb(c)]).filter(x=>x[1])){bounds.extend(ll);Lf.circleMarker(ll,{radius:6,color:"#fff",weight:2,fillColor:acc,fillOpacity:1}).addTo(m).bindTooltip(c,{permanent:true,direction:"top",className:"brf-tip"});}
  briefDrawNotams(L,Lf,m,layerControl,saved);
  BRF.mapFit=bounds.pad(.15);
  /* mantém a área que o piloto estava olhando quando a tela se atualiza */
  if(BRF.mapView&&BRF.mapView.leg===L.key&&!BRF.printing)m.setView(BRF.mapView.c,BRF.mapView.z);else m.fitBounds(BRF.mapFit,{maxZoom:8});
  m.on("moveend",()=>{BRF.mapView={leg:L.key,c:m.getCenter(),z:m.getZoom()};brfTraffic()});
  brfTraffic(true);
  if(BRF.pin){const g=BRF.mapLayers[BRF.pin];BRF.pin=null;if(g){m.fitBounds(g.getBounds().pad(.6),{maxZoom:12});g.openPopup()}}
  if(typeof adcSurfaceInit==='function')await adcSurfaceInit(m,Lf,L,layerControl);
  if(typeof netMapInit==='function'&&BRF.map===m&&m.getContainer().isConnected)netMapInit(m,Lf,layerControl);
  if(typeof brfExtraLayers==='function'&&BRF.map===m&&m.getContainer().isConnected)await brfExtraLayers(m,Lf,layerControl);
  }catch(e){if(current())brfMapFailure(el)}
}

/* impressão: versão completa (todos os NOTAMs, METAR/TAF original e decodificado), sem menus e botões */
function brfPrint(){
  if(BRF.printing)return;BRF.printing=true;document.documentElement.classList.add("brf-printing");render();
  const done=()=>{if(!BRF.printing)return;BRF.printing=false;document.documentElement.classList.remove("brf-printing");render()};
  window.addEventListener("afterprint",done,{once:true});
  /* o mapa é montado já no tamanho da folha (180 mm), para não sair cortado; espera os mapas carregarem */
  const go=()=>{window.print();setTimeout(done,1500)};
  setTimeout(()=>{try{if(BRF.map){BRF.map.invalidateSize();const L=BRF.mapLeg;if(L)brfMap()}}catch(e){}setTimeout(go,1800)},600);
}

/* ---------- mapas de fundo e tráfego (FlyVFR, VATSIM e IVAO) ---------- */
function brfBaseLayers(Lf){
  const dk="vfr-tl-map";/* o tema escuro é aplicado pelo CSS (troca na hora, sem recriar o mapa) */
  return{
    [t("brf_m_osm")]:Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,className:dk,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}),
    [t("brf_m_sat")]:Lf.layerGroup([Lf.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,className:"vfr-tl-sat",attribution:"Imagery &copy; Esri, Maxar, Earthstar Geographics"}),
      Lf.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",{maxZoom:19})]),
    [t("brf_m_topo")]:Lf.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",{maxZoom:17,subdomains:"abc",className:dk,attribution:'&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'})}}
function brfOverlays(Lf){
  BRF.tfc={FLYVFR:Lf.layerGroup([],{key:"FLYVFR"}),VATSIM:Lf.layerGroup([],{key:"VATSIM"}),IVAO:Lf.layerGroup([],{key:"IVAO"}),ADSB:Lf.layerGroup([],{key:"ADSB"})};
  return{[`<span class="tfc-k fly"></span> ${t("brf_m_fly")}`]:BRF.tfc.FLYVFR,[`<span class="tfc-k vat"></span> VATSIM`]:BRF.tfc.VATSIM,[`<span class="tfc-k ivao"></span> IVAO`]:BRF.tfc.IVAO,[`<span class="tfc-k real"></span> ${t("real_layer")}`]:BRF.tfc.ADSB}}
const TFC_PLANE='<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2c.8 0 1.4.7 1.4 1.6V9l7.6 4.4v2l-7.6-2.2v4.6l2.2 1.6V21L12 20l-3.6 1v-1.6l2.2-1.6v-4.6L3 15.4v-2L10.6 9V3.6C10.6 2.7 11.2 2 12 2z"/></svg>';
function tfcIcon(Lf,p,cls,zz){const z=zz!=null?zz:BRF.map?BRF.map.getZoom():8,s=z>=14?(p.ground?26:30):z>=11?(p.ground?18:22):(p.ground?14:20);return Lf.divIcon({className:"tfc "+cls+(p.ground?" gnd":""),html:`<div style="transform:rotate(${Math.round(p.hdg||0)}deg)">${TFC_PLANE}</div>`,iconSize:[s,s],iconAnchor:[s/2,s/2]})}
function tfcTip(p){return`<b>${esc(p.cs)}</b> <span class="tfc-net">${esc(p.net)}</span><br>${esc(p.type||"")}${p.dep||p.arr?` · ${esc(p.dep||"?")} → ${esc(p.arr||"?")}`:""}<br>${p.ground?esc(t("brf_m_gnd")):`FL${String(Math.round((p.alt||0)/100)).padStart(3,"0")}`} · ${Math.round(p.gs||0)} kt`}
let tfcBusy=false,tfcAt=0,tfcAgain=false;
/* desenha o tráfego guardado nas camadas do mapa atual (o mapa é refeito quando a tela se atualiza) */
function brfTrafficDraw(){
  const m=BRF.map;if(!m||!BRF.tfc)return;const Lf=window.L,bb=m.getBounds().pad(.2);
  for(const k of Object.keys(BRF.tfc))BRF.tfc[k].clearLayers();
  for(const p of BRF.tfcData||[]){const g=BRF.tfc[p.net==="FlyVFR"?"FLYVFR":p.net==="REAL"?"ADSB":p.net];if(!g||!bb.contains([p.lat,p.lon]))continue;
    const marker=Lf.marker([p.lat,p.lon],{icon:tfcIcon(Lf,p,p.net==="VATSIM"?"vat":p.net==="IVAO"?"ivao":p.net==="REAL"?"real":"fly"),zIndexOffset:p.net==="FlyVFR"?900:0}).bindTooltip(p.net==="REAL"&&typeof realTip==="function"?realTip(p):tfcTip(p)).addTo(g);if(typeof flightInfoBind==='function')flightInfoBind(marker,flightInfoTraffic(p))}
  const st=document.getElementById("brf-tfc-st");
  if(st)st.textContent=BRF.tfcErr==="missing"?t("brf_m_tfc_missing"):m.getZoom()<5?t("brf_m_tfc_zoom"):BRF.tfcTime?t("brf_m_tfc_upd",{t:new Date(BRF.tfcTime).toTimeString().slice(0,5)}):""}
async function brfTraffic(force){
  const m=BRF.map;if(!m||!BRF.tfc||view!=="briefing"||BRF.printing)return;
  brfTrafficDraw();
  const now=Date.now();if(!force&&now-tfcAt<15e3)return;if(tfcBusy){tfcAgain=true;return}tfcBusy=true;tfcAt=now;
  const bb=m.getBounds().pad(.3),bbox=[bb.getSouth(),bb.getWest(),bb.getNorth(),bb.getEast()],out=[];
  try{
    /* FlyVFR: voos rastreados ao vivo */
    try{if(typeof loadLiveTracks==="function"&&typeof LIVE!=="undefined"){if(!LIVE.size)await loadLiveTracks();
      for(const k of liveTracks()){const a=acById(k.aircraft_id)||{};out.push({net:"FlyVFR",cs:a.registration||k.aircraft_id,type:a.type||"",lat:k.last_lat,lon:k.last_lon,alt:k.last_alt||0,gs:k.last_gs||0,hdg:k.last_hdg||0,ground:!!k.last_ground})}}}catch(e){}
    /* VATSIM e IVAO: pela função "traffic" do servidor */
    if(sb&&BRF.map&&BRF.map.getZoom()>=5){const {data:d,error}=await sb.functions.invoke("traffic",{body:{bbox,nets:["VATSIM","IVAO"]}});
      if(error)BRF.tfcErr=/not found|404|Failed to send|FunctionsFetchError|FunctionsHttpError/i.test(String(error.message||error))?"missing":"fail";
      else{BRF.tfcErr=null;out.push(...((d&&d.pilots)||[]))}}
    /* tráfego real (ADS-B) com o mapa aproximado */
    if(typeof realArea==="function"&&BRF.map&&BRF.map.hasLayer(BRF.tfc.ADSB))out.push(...await realArea(BRF.map));
    BRF.tfcData=out;BRF.tfcTime=Date.now();
  }catch(e){}finally{tfcBusy=false}
  brfTrafficDraw();
  if(tfcAgain){tfcAgain=false;brfTraffic(true)}
}
setInterval(()=>{if(view==="briefing"&&BRF.map&&!document.hidden)brfTraffic()},20e3);

/* Fit the map below the actual header, including wrapped controls and mobile viewports. */
let brfFitFrame=0,brfFitElement=null,brfFitObserver=null;
function brfFitMap(){
 const el=document.getElementById('brf-map');if(!el||!el.isConnected||!el.getClientRects().length||BRF.printing||view!=='briefing')return;const panel=el.closest('.brf-mapp');if(!panel)return;const viewport=window.visualViewport?.height||window.innerHeight;let rect=el.getBoundingClientRect(),end=panel.getBoundingClientRect(),footer=Math.max(0,end.bottom-rect.bottom);const editing=/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName||'');
 if(window.innerWidth<750&&viewport-rect.top-footer<180&&!el.dataset.fitPositioned&&!editing){el.dataset.fitPositioned='1';el.style.height=Math.max(240,viewport-160)+'px';panel.scrollIntoView({block:'start',behavior:'instant'});rect=el.getBoundingClientRect();end=panel.getBoundingClientRect();footer=Math.max(0,end.bottom-rect.bottom)}
 const height=Math.max(80,Math.floor(viewport-rect.top-footer-12));if(Math.abs(el.clientHeight-height)>1){el.style.height=height+'px';if(BRF.map?.getContainer()===el)BRF.map.invalidateSize({pan:false,animate:false})}
}
function brfScheduleFit(){cancelAnimationFrame(brfFitFrame);brfFitFrame=requestAnimationFrame(brfFitMap)}
function brfObserveFit(){const el=document.getElementById('brf-map');if(el===brfFitElement)return;brfFitElement=el;brfFitObserver?.disconnect();if(!el)return;brfFitObserver=new ResizeObserver(brfScheduleFit);const workspace=el.closest('.brf-workspace');[workspace?.querySelector('.brf-top-block'),workspace?.querySelector('.brf-flight-context'),workspace?.querySelector('.sec-head'),workspace?.querySelector('.brf-subnav')].filter(Boolean).forEach(e=>brfFitObserver.observe(e));brfScheduleFit();setTimeout(()=>{if(el.isConnected&&el.getClientRects().length)brfMap()},0)}
new MutationObserver(brfObserveFit).observe(document.getElementById('view'),{childList:true,subtree:true});
window.addEventListener('resize',brfScheduleFit);window.visualViewport?.addEventListener('resize',brfScheduleFit);
document.addEventListener('toggle',e=>{if(e.target.closest?.('.brf-mapp'))brfScheduleFit()},true);
document.addEventListener('click',e=>{if(e.target.closest?.('[data-action="brf-section"],[data-action="brf-pin"]'))brfScheduleFit()});

// Close the flight picker without changing the selected flight.
document.addEventListener('click',e=>{document.querySelectorAll('.brf-inline-picker[open]').forEach(el=>{if(!el.contains(e.target))el.open=false})});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;document.querySelectorAll('.brf-inline-picker[open]').forEach(el=>{el.open=false;el.querySelector('summary')?.focus()})});

