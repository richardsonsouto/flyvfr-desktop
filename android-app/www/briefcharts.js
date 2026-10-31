/* Official South American chart catalogues, flight-scoped recommendations and local PDF tools. */
const BRIEF_CHARTS={catalogues:new Map(),pending:new Set(),states:new Map(),bytes:new Map(),merge:null};
const BRIEF_CHART_VIEW={request:0,doc:null,page:1,zoom:.25,rotation:0,task:null};
function bcState(L){const key=JSON.stringify([myId,L.key,L.dep,L.arr,briefAlternate(L),briefMatchedPlan(L)?.dispatchId||'',briefMatchedPlan(L)?.route||'']);for(const [storedKey,value] of BRIEF_CHARTS.states)if(storedKey!==key)value.partial=null;if(!BRIEF_CHARTS.states.has(key)){if(BRIEF_CHARTS.states.size>=30)BRIEF_CHARTS.states.delete(BRIEF_CHARTS.states.keys().next().value);BRIEF_CHARTS.states.set(key,{key,airport:L.dep,manual:new Map(),busy:false,status:'',partial:null})}return BRIEF_CHARTS.states.get(key)}
const bcSupported=code=>/^(?:SB|SD|SN|SS|SW|SI|SA|SC|SK|SP|SL|SE|SG|SU|SV|SY|SM|SO)[A-Z0-9]{2}$/.test(code);
const bcCurrent=()=>briefLegs().find(L=>L.key===BRF.sel);
async function bcRequest(body){return sb.functions.invoke('charts',{body})}
const bcId=c=>c.icao+'|'+c.id;
const bcNormalize=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const bcRunways=s=>[...String(s||'').toUpperCase().matchAll(/\b(?:RWY\s*)?(\d{2}[LRC]?)\b/g)].map(m=>m[1]);
function bcWind(code){const d=BRF.wx[code]?.data,at=Date.parse(d?.metarTime||'');if(!Number.isFinite(at)||Date.now()-at>90*60000||Date.now()<at-60000)return null;const m=String(d.metar||'').match(/\b(\d{3})(\d{2,3})(?:G\d{2,3})?(KT|MPS)\b/);return m?{direction:Number(m[1]),speed:Number(m[2])*(m[3]==='MPS'?1.944:1),text:m[0]}:null}
function bcTafWind(taf,time){
 const text=String(taf||'').toUpperCase(),ref=new Date(time),date=(day,hour,minute=0)=>{const candidates=[-1,0,1].map(m=>Date.UTC(ref.getUTCFullYear(),ref.getUTCMonth()+m,day,hour,minute));return candidates.sort((a,b)=>Math.abs(a-time)-Math.abs(b-time))[0]};
 const valid=text.match(/\b(\d{2})(\d{2})\/(\d{2})(\d{2})\b/);if(!valid)return null;const start=date(+valid[1],+valid[2]),end=date(+valid[3],+valid[4]);if(time<start||time>=end)return null;
 const parts=text.split(/\s+(?=(?:FM\d{6}|BECMG|(?:PROB\d{2}\s+)?TEMPO|PROB\d{2})\b)/);let wind=null,uncertain=false;
 for(let i=0;i<parts.length;i++){const part=parts[i],fm=part.match(/^FM(\d{2})(\d{2})(\d{2})/),range=part.match(/^(?:BECMG|(?:PROB\d{2}\s+)?TEMPO|PROB\d{2})\s+(\d{2})(\d{2})\/(\d{2})(\d{2})/),m=part.match(/\b(\d{3}|VRB)(\d{2,3})(?:G\d{2,3})?(KT|MPS)\b/);if(!m)continue;
 const next=m[1]==='VRB'?null:{direction:+m[1],speed:+m[2]*(m[3]==='MPS'?1.944:1),text:m[0]};
 if(i===0)wind=next;else if(fm&&time>=date(+fm[1],+fm[2],+fm[3])){wind=next;uncertain=false}else if(range){const from=date(+range[1],+range[2]),to=date(+range[3],+range[4]);if(part.startsWith('BECMG')&&time>=to){wind=next;uncertain=false}else if(time>=from&&time<to)uncertain=true}
 }
 return !uncertain&&wind?{...wind,forecast:true}:null;
}
function bcWeatherWind(L,code){const time=typeof briefTime==='function'?Math.max(Date.now(),briefTime(code,L)):Date.now(),d=BRF.wx[code]?.data;if(time-Date.now()>30*60000)return bcTafWind(d?.taf,time);return bcWind(code)}
function bcRecommendations(L,code,charts){
 const p=briefMatchedPlan(L),role=briefRole(code,L),r=data.reservations.find(r=>r.id===L.key),route=role==='alt'?(p?.alternateRoute||''):(p?.route||r?.route||''),planned=bcRunways(String(role==='dep'?p?.departureRunway:role==='arr'?p?.arrivalRunway:p?.alternateRunway).replace(/^RWY\s*/i,''))[0]||'',procedure=role==='dep'?p?.sid:role==='arr'?p?.star:p?.alternateStar,approach=role==='arr'?p?.approach:role==='alt'?p?.alternateApproach:'',wind=bcWeatherWind(L,code);
 const notices=typeof notamHits==='function'?notamHits(code,L,role):[],closed=new Set();for(const n of notices)for(const m of String(n.e||'').matchAll(/\bRWY\s+(\d{2}[LRC]?(?:\s*\/\s*\d{2}[LRC]?)?)\s+(?:CLSD|CLOSED)\b/gi))bcRunways(m[1]).forEach(x=>closed.add(x));
 const chartRunways=c=>{const name=String(c.name||'').replace(/[_-]/g,' '),tail=name.match(/\bRWY\s*(.*)/i)?.[1];return bcRunways(tail||(['IAC','VAC'].includes(c.type)?name:''))},available=[...new Set(charts.flatMap(chartRunways))].filter(r=>!closed.has(r)),head=r=>wind?Math.cos((Number(r.slice(0,2))*10-wind.direction)*Math.PI/180)*wind.speed:0;
 let runway=planned,weatherChoice=false;if(wind&&wind.speed>=5){const sorted=available.sort((a,b)=>head(b)-head(a)),best=sorted[0];if(best&&head(best)>0&&(!planned||closed.has(planned)||head(planned)<-5)){const similar=sorted.filter(r=>head(best)-head(r)<1);runway=similar.includes(planned)?planned:best;weatherChoice=true}}
 const wanted=role==='dep'?'SID':'STAR',tokens=route.toUpperCase().split(/\s+/).filter(x=>/^[A-Z]{3,6}\d?[A-Z]?$/.test(x)&&!['DCT','SID','STAR','RNAV',L.dep,L.arr].includes(x)),fix=role==='dep'?tokens[0]:tokens.at(-1);
 const rows=charts.map(c=>{const name=bcNormalize(c.name),rwys=chartRunways(c),blocked=rwys.length>0&&rwys.every(r=>closed.has(r)),runwayMatch=!!runway&&rwys.includes(runway);let reason='bc_confirm',selected=false,score=0;
  if(['ADC','PDC'].includes(c.type)){reason='bc_reference';selected=true;score=100}
  if(c.type===wanted&&procedure&&name.replace(/RWY/g,'').includes(bcNormalize(procedure).replace(/RWY/g,''))&&(!runway||!rwys.length||runwayMatch)){reason='bc_dispatch';selected=true;score=90}
  else if(c.type===wanted&&fix&&name.includes(bcNormalize(fix))&&(!runway||!rwys.length||runwayMatch)){reason='bc_route';score=65}
  if(c.type==='IAC'&&role!=='dep'&&(!runway||runwayMatch)){const exact=approach&&name.replace(/RWY/g,'').includes(bcNormalize(approach).replace(/RWY/g,''));if(exact){reason='bc_dispatch';selected=true;score=95}else if(runwayMatch){reason=weatherChoice?'bc_weather_pick':'bc_runway_pick';score=75}}
  if(runwayMatch)score+=10;if(wind&&rwys.length&&Math.max(...rwys.map(head))>0)score+=3;
  if(blocked){selected=false;reason='bc_notam';score=-20}if(c.restricted){selected=false;reason='bc_restricted';score=-30}
  return {...c,selected,reason,score,blocked};
 });
 const routes=rows.filter(c=>c.reason==='bc_route'&&!c.blocked&&!c.restricted&&(!runway||!chartRunways(c).length||chartRunways(c).includes(runway)));if(routes.length===1)routes[0].selected=true;
 // A runway alone cannot identify an approach when several procedures serve it.
 const approaches=rows.filter(c=>c.type==='IAC'&&!c.blocked&&!c.restricted);
 const exactApproaches=approaches.filter(c=>c.selected);
 if(exactApproaches.length>1)exactApproaches.forEach(c=>{c.selected=false;c.reason='bc_confirm'});
 if(role!=='dep'&&!approach&&runway){const matching=approaches.filter(c=>chartRunways(c).includes(runway));if(matching.length===1)matching[0].selected=true}
 for(const type of ['SID','STAR']){const exact=rows.filter(c=>c.type===type&&c.selected);if(exact.length>1)exact.forEach(c=>{c.selected=false;c.reason='bc_confirm'})}
 // Offer one reviewable option when the dispatch does not uniquely identify the chart.
 for(const type of role==='dep'?['SID']:['STAR','IAC']){
  if(rows.some(c=>c.type===type&&c.selected))continue;
  const candidates=rows.filter(c=>{
   if(c.type!==type||c.blocked||c.restricted)return false;
   const runways=chartRunways(c),matchesRunway=!!runway&&runways.includes(runway),matchesRoute=type!=='IAC'&&!!fix&&bcNormalize(c.name).includes(bcNormalize(fix));
   if(runway&&runways.length&&!matchesRunway)return false;
   return type==='IAC'?matchesRunway:matchesRoute||matchesRunway;
  });
  const ranked=candidates.filter(c=>{
   if(type!=='IAC')return true;
   const name=bcNormalize(c.name),rwys=chartRunways(c);
   return !notices.some(n=>{const text=String(n.e||'').toUpperCase();if(!/\b(?:U\/S|UNSERVICEABLE|UNAVBL)\b/.test(text))return false;const affected=bcRunways(text.match(/\bRWY\s+([^;.]*)/)?.[1]||'');if(affected.length&&!rwys.some(r=>affected.includes(r)))return false;return /ILS|LOC/.test(name)&&/\b(?:ILS|LOC)\b/.test(text)||/RNAV|RNP/.test(name)&&/\b(?:GNSS|GPS)\b/.test(text)});
  }).sort((a,b)=>{
   const rank=c=>c.score+(type==='IAC'&&/\bILS\b/i.test(c.name)?4:0)+(type!=='IAC'&&fix&&bcNormalize(c.name).includes(bcNormalize(fix))?20:0);
   return rank(b)-rank(a)||a.name.localeCompare(b.name);
  });
  if(ranked.length){ranked[0].selected=true;ranked[0].reason=type==='IAC'?'bc_suggest_approach':fix&&bcNormalize(ranked[0].name).includes(bcNormalize(fix))?'bc_suggest_route':'bc_suggest_runway';ranked[0].suggested=true;}
 }
 return rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}
function bcAll(L){return briefAirports(L).flatMap(code=>bcRecommendations(L,code,BRIEF_CHARTS.catalogues.get(code)?.charts||[]))}
function bcSelected(L){const state=bcState(L);return bcAll(L).filter(c=>!c.blocked&&!c.restricted&&(state.manual.has(bcId(c))?state.manual.get(bcId(c)):c.selected))}
async function bcLoad(code,force=false){
 if(!bcSupported(code)||BRIEF_CHARTS.pending.has(code))return;const old=BRIEF_CHARTS.catalogues.get(code);if(!force&&old&&(old.error||Date.now()-old.checkedAt<15*60000))return;
 BRIEF_CHARTS.pending.add(code);
 try{const {data,error}=await bcRequest({icao:code});if(error||!Array.isArray(data?.charts))throw Error('CATALOGUE');BRIEF_CHARTS.catalogues.set(code,data)}catch(e){BRIEF_CHARTS.catalogues.set(code,{error:true,charts:[],checkedAt:Date.now()})}finally{BRIEF_CHARTS.pending.delete(code);bcPaint()}
}
function bcPaint(){if(view!=='briefing')return;const L=bcCurrent(),panel=document.querySelector('[data-brf-section="charts"]');if(L&&panel)panel.innerHTML=briefChartsHTML(L)}
function bcTypeIcon(type){const paths={ADC:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/>',PDC:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',SID:'<path d="M3 21h18M4 16l5-1 6-7 3 1-3 5 5-1 2 2-13 4-5-3Z"/>',STAR:'<path d="M3 21h18M3 7l4 1 5 6 7 2 2 3-14-3-4-9Z"/>',IAC:'<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',VAC:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',AOC:'<path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3v1"/>'};return _ic(paths[type]||paths.ADC)}
function bcRoleLabel(code,L){return t('brf_'+(briefRole(code,L)==='dep'?'dep':briefRole(code,L)==='arr'?'arr':'alternate_short'))}
function bcChartRow(c,L,selected,top=false){const S=bcState(L),checked=selected.some(s=>bcId(s)===bcId(c));return `<div class="bc-chart ${top?'bc-picked-chart':''}" data-type="${esc(c.type||'')}"><input type="checkbox" data-bc-select="${esc(bcId(c))}" aria-label="${esc(c.icao+' '+c.name)}" ${checked?'checked':''} ${S.busy?'disabled':''}>${top?`<span class="bc-type-icon" aria-hidden="true">${bcTypeIcon(c.type)}</span>`:''}<div><a class="bc-name" href="${esc(c.url)}" target="_blank" rel="noopener" data-action="bc-preview" data-id="${esc(bcId(c))}">${top?esc(c.icao+' · '+c.type)+' · ':''}${esc(c.name)}</a><small class="${c.blocked||c.restricted?'bc-warning':''}">${top?esc(bcRoleLabel(c.icao,L))+' · ':''}${t(c.reason)}</small></div><button type="button" class="btn small" data-action="bc-save" data-id="${esc(bcId(c))}" ${S.busy?'disabled':''}>PDF ↓</button></div>`}
function briefChartsHTML(L){
 const S=bcState(L),airports=briefAirports(L);if(!airports.includes(S.airport))S.airport=L.dep;
 for(const code of airports)if(bcSupported(code)&&!BRIEF_CHARTS.catalogues.has(code))queueMicrotask(()=>bcLoad(code));
 const code=S.airport,C=BRIEF_CHARTS.catalogues.get(code),charts=bcRecommendations(L,code,C?.charts||[]),selected=bcSelected(L),picked=selected.filter(c=>c.icao===code),pickedIds=new Set(picked.map(bcId)),others=charts.filter(c=>!pickedIds.has(bcId(c))),order=['ADC','PDC','SID','STAR','IAC','AOC','VAC','ATCSMAC','ARC','VFR'],types=order.filter(type=>others.some(c=>c.type===type));
 const otherView=S.list==='others';if(!types.includes(S.type))S.type=types[0]||'';
 const active=otherView?others.filter(c=>c.type===S.type):picked.sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type)||a.name.localeCompare(b.name));
 const typeMenu=otherView?types.map(type=>`<button type="button" class="btn bc-type-tab" data-action="bc-type" data-type="${type}" aria-pressed="${S.type===type}"><span aria-hidden="true">${bcTypeIcon(type)}</span><b>${type}</b><small>${others.filter(c=>c.type===type).length}</small></button>`).join(''):'';
 const role=briefRole(code,L),expected=role==='dep'?['SID']:['STAR','IAC'],missing=expected.filter(type=>charts.some(c=>c.type===type)&&!picked.some(c=>c.type===type));
 const unavailable=!bcSupported(code)?`<p>${t('brf_chart_missing')}</p>`:C?.error?`<p class="notice warn">${t('bc_load_error')}</p>`:C?.mode==='external'||C?.mode==='unavailable'?`<div class="notice"><p>${t(C.mode==='external'?'bc_external_only':'bc_source_unavailable')}</p><a class="btn" href="${esc(C.source)}" target="_blank" rel="noopener">${esc(C.provider||'AIP')} ↗</a></div>`:!C?`<p aria-live="polite">${t('loading_charts')}</p>`:'';
 return `<section class="panel brf-extra bc-panel"><div class="sec-head"><h3>${t('brf_tab_charts')}</h3><div class="bc-header-actions"><a class="btn bc-navigraph-link" href="https://charts.navigraph.com/" target="_blank" rel="noopener noreferrer"><img src="img/navigraph.png" alt="" width="24" height="24"><span>${t('bc_open_navigraph')} ↗</span></a><button type="button" class="btn primary" data-action="bc-merge" ${S.busy||!selected.length||airports.some(c=>BRIEF_CHARTS.pending.has(c))?'disabled':''}>${t(S.busy?'bc_preparing':'bc_merge')} (${selected.length})</button></div></div>
 <nav class="bc-airports" aria-label="${t('brf_tab_charts')}">${airports.map(ap=>`<button type="button" class="btn" data-action="bc-airport" data-code="${ap}" aria-pressed="${ap===code}"><b>${bcRoleLabel(ap,L)} · ${ap}</b><small>${selected.filter(c=>c.icao===ap).length} ${t('bc_selected_short')}</small></button>`).join('')}</nav>
 <nav class="bc-list-menu" aria-label="${t('brf_tab_charts')}"><button type="button" class="btn" data-action="bc-list" data-list="selected" aria-pressed="${!otherView}">${t('bc_flight_selected')} (${picked.length})</button><button type="button" class="btn" data-action="bc-list" data-list="others" aria-pressed="${otherView}">${t('bc_other_charts')} (${others.length})</button></nav>
 ${typeMenu?`<nav class="bc-type-menu" aria-label="${t('bc_chart_type')}">${typeMenu}</nav>`:''}
 ${!otherView&&missing.length&&!unavailable?`<p class="bc-selection-pending notice warn">${t('bc_selection_pending',{types:missing.join(', ')})}</p>`:''}
 ${unavailable||`<section class="bc-type-content" data-type="${otherView?S.type:'selected'}" aria-label="${esc(code)}">${active.length?active.map(c=>bcChartRow(c,L,selected,true)).join(''):`<p>${t('bc_none')}</p>`}</section>`}
 <div class="bc-catalogue-footer"><span class="bc-count" aria-live="polite">${selected.length} ${t('bc_selected')}</span><button type="button" class="btn small" data-action="bc-refresh" ${S.busy?'disabled':''}>↻ ${t('brf_refresh')}</button></div><div class="bc-status" role="status">${esc(S.status||'')}</div>
 ${S.partial?`<button type="button" class="btn" data-action="bc-partial">${t('bc_continue_partial')} (${S.partial.good.length})</button>`:''}
 <details class="bc-guidance"><summary>${t('bc_criteria')}</summary><p>${t('bc_selection_rule')}</p><p>${t('bc_live_note')}</p></details>
 ${C?.source?`<a href="${esc(C.source)}" target="_blank" rel="noopener">${t('brf_official_charts')} ↗</a>`:''}
 ${C&&!C.error?`<p class="hint">${esc(C.provider||'AISWEB / DECEA')} · ${t('bc_checked')} ${esc(new Date(C.checkedAt).toLocaleString(LOCALE[lang]))}</p>`:''}</section>`;
}

async function bcBytes(c){
 const key=bcId(c),old=BRIEF_CHARTS.bytes.get(key);if(old&&Date.now()-old.at<5*60000)return old.bytes.slice();
 const {data,error}=await bcRequest({icao:c.icao,id:c.id});if(error||!(data instanceof Blob))throw Error('PDF');const bytes=new Uint8Array(await data.arrayBuffer());if(bytes.length>16*1024*1024||!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw Error('PDF');
 while(BRIEF_CHARTS.bytes.size&&[...BRIEF_CHARTS.bytes.values()].reduce((n,v)=>n+v.bytes.length,0)+bytes.length>48*1024*1024)BRIEF_CHARTS.bytes.delete(BRIEF_CHARTS.bytes.keys().next().value);
 BRIEF_CHARTS.bytes.set(key,{at:Date.now(),bytes});return bytes.slice();
}
function bcDownload(bytes,name){const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function bcFilename(c){return (c.icao+'-'+c.type+'-'+c.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9_-]/gi,'-').slice(0,150)+'.pdf'}
let bcPdfLibPromise;
async function bcPdfLib(){if(window.PDFLib)return window.PDFLib;if(!bcPdfLibPromise)bcPdfLibPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='vendor/pdf-lib.min.js';script.onload=()=>resolve(window.PDFLib);script.onerror=()=>{bcPdfLibPromise=null;reject(Error('LIBRARY'))};document.head.append(script)});return bcPdfLibPromise}
async function bcBuildMerged(L,good){
 const {PDFDocument,StandardFonts}=await bcPdfLib(),out=await PDFDocument.create(),font=await out.embedFont(StandardFonts.Helvetica),ascii=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,' ');
 const cover=out.addPage([595,842]);cover.drawText('Virtual Flight Report - '+L.dep+' / '+L.arr,{x:35,y:800,size:15,font});cover.drawText('Charts / Cartas - '+new Date().toISOString().slice(0,10),{x:35,y:777,size:10,font});cover.drawText(ascii([...new Set(good.map(item=>BRIEF_CHARTS.catalogues.get(item.chart.icao)?.provider||'AISWEB / DECEA'))].join(' / ')).slice(0,100),{x:35,y:757,size:9,font});
 let y=730,pageNumber=2;for(const item of good){cover.drawText(ascii(item.chart.icao+' '+item.chart.type+' - '+item.chart.name).slice(0,90)+'  [p.'+pageNumber+']',{x:35,y,size:8,font});y-=15;const pages=await out.copyPages(item.doc,item.doc.getPageIndices());pages.forEach(p=>out.addPage(p));pageNumber+=pages.length}
 out.setTitle('VFR '+L.dep+'-'+L.arr+' charts');out.setProducer('Virtual Flight Report');return out.save();
}
async function bcMerge(L,partial=false){
 const S=bcState(L),owner=myId,key=S.key;S.busy=true;S.status=t('bc_preparing');bcPaint();
 const current=()=>view==='briefing'&&myId===owner&&bcCurrent()?.key===L.key&&bcState(bcCurrent()).key===key;
 try{
  let good=[],failed=[];if(partial&&S.partial){good=S.partial.good;failed=S.partial.failed}else{
   const airports=briefAirports(L),types=['ADC','PDC','SID','STAR','IAC','VAC','AOC','ATCSMAC','ARC','VFR'],selected=bcSelected(L).sort((a,b)=>airports.indexOf(a.icao)-airports.indexOf(b.icao)||types.indexOf(a.type)-types.indexOf(b.type)||a.name.localeCompare(b.name));if(selected.length>40)throw Error('LIMIT');const {PDFDocument}=await bcPdfLib();let size=0;
   for(const c of selected){if(!current())return;try{const bytes=await bcBytes(c);size+=bytes.length;if(size>80*1024*1024)throw Error('LIMIT');const doc=await PDFDocument.load(bytes,{ignoreEncryption:false});good.push({chart:c,doc})}catch(e){if(e.message==='LIMIT')throw e;failed.push(c.name)}}
  }
  if(!current())return;if(!good.length)throw Error('PDF');
  if(failed.length&&!partial){S.partial={good,failed};S.status=t('bc_failed')+': '+failed.join('; ');return}
  const bytes=await bcBuildMerged(L,good);if(!current())return;bcDownload(bytes,'VFR-'+L.dep+'-'+L.arr+'-cartas.pdf');S.partial=null;S.status=t('bc_ready');
 }catch(e){S.status=t(e.message==='LIMIT'?'bc_limit':'bc_pdf_error')}finally{S.busy=false;if(current())bcPaint()}
}
function bcViewerClose(){const V=BRIEF_CHART_VIEW,task=V.task,doc=V.doc;V.request++;V.doc=null;V.task=null;V.anchor=null;V.chart=null;V.leg=null;V.notamHits=[];try{task?.cancel()}catch(e){}try{doc?.destroy()?.catch(()=>{})}catch(e){}}

function bcViewerControls(){const V=BRIEF_CHART_VIEW,percent=Math.round(V.zoom*100),select=document.getElementById('bc-zoom-select'),range=document.getElementById('bc-zoom-range');if(select){select.querySelector('[data-custom]')?.remove();if(![...select.options].some(o=>Number(o.value)===percent)){const o=document.createElement('option');o.value=percent;o.textContent=percent+'%';o.dataset.custom='1';select.append(o)}select.value=percent}if(range)range.value=percent;const label=document.getElementById('bc-zoom-value');if(label)label.textContent=percent+'%';document.querySelectorAll('[data-action="bc-zoom"]').forEach(b=>b.disabled=b.dataset.step==='-1'?percent<=25:percent>=400)}
function bcViewerZoom(percent,anchor=null){const V=BRIEF_CHART_VIEW;V.zoom=Math.max(.25,Math.min(4,Number(percent)/100||.25));V.anchor=anchor;const wrap=document.querySelector('.bc-canvas-wrap');if(wrap&&!anchor){wrap.scrollTop=0;wrap.scrollLeft=0}bcViewerControls();return bcViewerDraw()}
async function bcViewerDraw(){
 const V=BRIEF_CHART_VIEW,canvas=document.getElementById('bc-canvas');if(!V.doc||!canvas)return;const request=++V.request;try{V.task?.cancel()}catch(e){}try{await V.task?.promise}catch(e){}
 try{const page=await V.doc.getPage(V.page);if(request!==V.request||!canvas.isConnected)return;const wrap=canvas.parentElement,width=Math.max(100,wrap.clientWidth-24),height=Math.max(100,wrap.clientHeight-24),rotation=((page.rotate||0)+(V.rotation||0))%360,base=page.getViewport({scale:1,rotation}),fit=Math.min(width/base.width,height/base.height);V.fit=fit;V.widthScale=width/base.width;const viewport=page.getViewport({scale:fit*V.zoom/.25,rotation}),ratio=Math.min(2,window.devicePixelRatio||1,8192/viewport.width,8192/viewport.height,Math.sqrt(16000000/(viewport.width*viewport.height)));canvas.width=Math.max(1,Math.round(viewport.width*ratio));canvas.height=Math.max(1,Math.round(viewport.height*ratio));canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';if(V.anchor){const anchor=V.anchor;V.anchor=null;const rect=canvas.getBoundingClientRect();wrap.scrollLeft+=rect.left+anchor.x*viewport.width-anchor.clientX;wrap.scrollTop+=rect.top+anchor.y*viewport.height-anchor.clientY}V.task=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]});await V.task.promise;if(request!==V.request)return;document.getElementById('bc-page').textContent=V.page+' / '+V.doc.numPages;document.querySelectorAll('[data-action="bc-page"]').forEach(b=>b.disabled=b.dataset.step==='-1'?V.page===1:V.page===V.doc.numPages);bcViewerControls();const angle=document.getElementById('bc-rotation');if(angle)angle.textContent=V.rotation+'°';document.getElementById('bc-view-status').textContent='';if(typeof cnDraw==='function')await cnDraw(page,viewport,canvas,V,request);}catch(e){if(e.name!=='RenderingCancelledException'&&canvas.isConnected)document.getElementById('bc-view-status').textContent=t('bc_pdf_error')}
}
async function bcPreview(c){
 bcViewerClose();const V=BRIEF_CHART_VIEW,request=V.request;V.page=1;V.zoom=.25;V.rotation=0;V.chart=c;V.leg=bcCurrent();openSheet('chart-viewer',`${head(c.icao+' · '+c.type,esc(c.name))}<div class="bc-viewer"><div class="bc-view-toolbar"><button type="button" class="btn small" data-action="bc-page" data-step="-1" disabled>‹</button><span id="bc-page"></span><button type="button" class="btn small" data-action="bc-page" data-step="1" disabled>›</button><button type="button" class="btn small" data-action="bc-zoom" data-step="-1" aria-label="${esc(t('bc_zoom_out'))}">−</button><select id="bc-zoom-select" aria-label="${esc(t('bc_zoom_level'))}">${[25,50,75,100,150,200,300,400].map(n=>`<option value="${n}">${n}%</option>`).join('')}</select><button type="button" class="btn small" data-action="bc-zoom" data-step="1" aria-label="${esc(t('bc_zoom_in'))}">+</button><button type="button" class="btn small" data-action="bc-rotate" data-step="-90" aria-label="${esc(t('bc_rotate_left'))}" title="${esc(t('bc_rotate_left'))}">↶ 90°</button><output id="bc-rotation" aria-live="polite" aria-label="${esc(t('bc_rotation'))}">0°</output><button type="button" class="btn small" data-action="bc-rotate" data-step="90" aria-label="${esc(t('bc_rotate_right'))}" title="${esc(t('bc_rotate_right'))}">↷ 90°</button><button type="button" class="btn small" data-action="bc-fit">${t('bc_fit_page')}</button><button type="button" class="btn small" data-action="bc-width">${t('bc_fit_width')}</button><button type="button" class="btn small" data-action="bc-save" data-id="${esc(bcId(c))}">PDF ↓</button><a href="${esc(c.url)}" target="_blank" rel="noopener">${t('brf_official_charts')} ↗</a></div><label class="bc-zoom-slider"><span>25%</span><input id="bc-zoom-range" type="range" min="25" max="400" step="25" value="25" aria-label="${esc(t('bc_zoom_level'))}"><output id="bc-zoom-value" aria-live="polite">25%</output><span>400%</span></label><p id="bc-view-status" role="status">${t('loading_charts')}</p><div id="bc-notam-info" aria-live="polite"></div><div class="bc-canvas-wrap"><canvas id="bc-canvas"></canvas></div></div>`);
 try{const [bytes,pdfjs]=await Promise.all([bcBytes(c),import('./vendor/pdfjs/pdf.mjs')]);if(request!==V.request||sheet?.type!=='chart-viewer')return;pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.mjs',location.href).href;const doc=await pdfjs.getDocument({data:bytes,isEvalSupported:false}).promise;if(request!==V.request||sheet?.type!=='chart-viewer'){doc.destroy();return}V.doc=doc;await bcViewerDraw()}catch(e){const status=document.getElementById('bc-view-status');if(status)status.textContent=t('bc_pdf_error')}
}
document.addEventListener('change',e=>{const input=e.target.closest?.('[data-bc-select]');if(!input)return;const L=bcCurrent();if(!L)return;const S=bcState(L);if(S.busy)return;S.manual.set(input.dataset.bcSelect,input.checked);S.partial=null;S.status='';bcPaint();const replacement=[...document.querySelectorAll('[data-bc-select]')].find(el=>el.dataset.bcSelect===input.dataset.bcSelect);replacement?.focus()});
document.addEventListener('click',async e=>{
 const b=e.target.closest?.('[data-action^="bc-"]');if(!b||b.disabled)return;const action=b.dataset.action;if(action==='bc-preview'&&(e.ctrlKey||e.metaKey))return;e.preventDefault();
 const L=bcCurrent();if(!L)return;const S=bcState(L);
 if(action==='bc-airport'){S.airport=b.dataset.code;bcPaint();return}
 if(action==='bc-list'){S.list=b.dataset.list==='others'?'others':'selected';bcPaint();return}
 if(action==='bc-type'){S.type=b.dataset.type;bcPaint();return}
 if(action==='bc-refresh'){S.partial=null;S.status='';await Promise.all(briefAirports(L).map(code=>bcLoad(code,true)));return}
 if(action==='bc-merge'||action==='bc-partial')return bcMerge(L,action==='bc-partial');
 if(action==='bc-page'&&BRIEF_CHART_VIEW.doc){BRIEF_CHART_VIEW.page=Math.max(1,Math.min(BRIEF_CHART_VIEW.doc.numPages,BRIEF_CHART_VIEW.page+Number(b.dataset.step)));return bcViewerDraw()}
 if(action==='bc-zoom')return bcViewerZoom(Math.round(BRIEF_CHART_VIEW.zoom*100)+Number(b.dataset.step)*25);
 if(action==='bc-rotate'&&BRIEF_CHART_VIEW.doc){const V=BRIEF_CHART_VIEW;V.rotation=((V.rotation||0)+Number(b.dataset.step)+360)%360;V.anchor=null;const wrap=document.querySelector('.bc-canvas-wrap');if(wrap){wrap.scrollLeft=0;wrap.scrollTop=0}return bcViewerDraw()}
 if(action==='bc-fit')return bcViewerZoom(25);
 if(action==='bc-width')return bcViewerZoom(Math.round(25*(BRIEF_CHART_VIEW.widthScale||1)/(BRIEF_CHART_VIEW.fit||1)));
 const c=bcAll(L).find(c=>bcId(c)===b.dataset.id);if(!c)return;if(action==='bc-preview')return bcPreview(c);
 if(action==='bc-save'){b.disabled=true;try{bcDownload(await bcBytes(c),bcFilename(c))}catch(e){S.status=t('bc_pdf_error');bcPaint();const status=document.getElementById('bc-view-status');if(status)status.textContent=S.status}finally{if(b.isConnected)b.disabled=false}}
});
new MutationObserver(()=>{if(BRIEF_CHART_VIEW.doc&&!document.getElementById('bc-canvas'))bcViewerClose()}).observe(document.getElementById('sheet-root'),{childList:true,subtree:true});
document.addEventListener('click',e=>{if(!document.getElementById('bc-canvas'))return;const close=e.target.closest?.('[data-action="close"]'),scrim=e.target.closest?.('[data-action="scrim"]');if(close||scrim===e.target){bcViewerClose();closeSheet()}},true);

/* Re-evaluate chart suggestions while the app is open, including during a tracked flight. */
const BC_LIVE={busy:false,at:0,owner:''};
async function bcLiveRefresh(force=false){
 if(document.hidden||typeof myId==='undefined'||!myId||BC_LIVE.busy)return;const L=bcCurrent()||briefLegs()[0];if(!L||bcState(L).busy)return;const owner=myId;if(!force&&BC_LIVE.owner===owner&&Date.now()-BC_LIVE.at<5*60000)return;BC_LIVE.busy=true;
 try{await Promise.all(briefAirports(L).map(async code=>{try{const d=await fetchWx(code);if(myId===owner&&d)BRF.wx[code]={data:d}}catch(e){}await bcLoad(code)}));if(myId!==owner)return;if(view==='briefing'){await briefLoad(briefAirports(L),false);bcPaint()}const S=bcState(L);if(!S.busy)S.partial=null;BC_LIVE.at=Date.now();BC_LIVE.owner=owner}finally{BC_LIVE.busy=false}
}
setInterval(()=>bcLiveRefresh(),60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)bcLiveRefresh()});
window.addEventListener('focus',()=>bcLiveRefresh());

document.addEventListener('change',e=>{if(e.target.id==='bc-zoom-select')bcViewerZoom(e.target.value)});
let bcZoomFrame=0;
document.addEventListener('input',e=>{if(e.target.id!=='bc-zoom-range')return;const value=e.target.value;cancelAnimationFrame(bcZoomFrame);bcZoomFrame=requestAnimationFrame(()=>bcViewerZoom(value))});
let bcDrag=null;
document.addEventListener('pointerdown',e=>{const wrap=e.target.closest?.('.bc-canvas-wrap');if(!wrap||e.button!==0||!BRIEF_CHART_VIEW.doc)return;bcDrag={wrap,x:e.clientX,y:e.clientY,left:wrap.scrollLeft,top:wrap.scrollTop};wrap.setPointerCapture(e.pointerId)});
document.addEventListener('pointermove',e=>{if(bcDrag){bcDrag.wrap.scrollLeft=bcDrag.left+bcDrag.x-e.clientX;bcDrag.wrap.scrollTop=bcDrag.top+bcDrag.y-e.clientY}});
document.addEventListener('pointerup',()=>bcDrag=null);document.addEventListener('pointercancel',()=>bcDrag=null);
let bcResizeFrame=0;window.addEventListener('resize',()=>{if(!BRIEF_CHART_VIEW.doc)return;cancelAnimationFrame(bcResizeFrame);bcResizeFrame=requestAnimationFrame(()=>bcViewerDraw())});

// Scope wheel zoom to the PDF viewport and preserve the chart point below the pointer.
document.addEventListener('wheel',e=>{
 const wrap=e.target.closest?.('.bc-canvas-wrap'),V=BRIEF_CHART_VIEW,canvas=document.getElementById('bc-canvas');if(!wrap||!canvas||!V.doc||!e.deltaY)return;e.preventDefault();const next=Math.max(25,Math.min(400,Math.round(V.zoom*100)+(e.deltaY<0?25:-25)));if(next===Math.round(V.zoom*100))return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;bcViewerZoom(next,{x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height)),clientX:e.clientX,clientY:e.clientY});
},{passive:false});
