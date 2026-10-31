/* A single shared selection for the flight panel and its operational actions. */
const PROGRAMMING_SELECTIONS=new Map(),PROGRAMMING_PAGE_SIZE=5;
function programmingSelected(mine){
  const saved=PROGRAMMING_SELECTIONS.get(myId);
  const selected=mine.find(r=>r.id===saved)||mine.find(r=>r.end>Date.now()&&!bookingPreviousIncomplete(r))||mine.find(r=>r.end>Date.now())||mine[0];
  if(selected)PROGRAMMING_SELECTIONS.set(myId,selected.id);return selected;
}
function programmingFlightPicker(mine,card){
  const selected=programmingSelected(mine);if(mine.length===1)return `<div class="programming-selected">${card(selected)}</div>`;const page=Math.floor(mine.indexOf(selected)/PROGRAMMING_PAGE_SIZE),pages=Math.ceil(mine.length/PROGRAMMING_PAGE_SIZE);
  const buttons=mine.slice(page*PROGRAMMING_PAGE_SIZE,(page+1)*PROGRAMMING_PAGE_SIZE).map(r=>{
    const previous=bookingPreviousIncomplete(r),locked=!!previous,std=r.start+(r.rosterId?20*6e4:0),sta=r.end-(r.rosterId?25*6e4:0),a=acById(r.aircraftId);
    return `<button type="button" class="programming-flight-choice${locked?' is-sequence-locked':''}" data-action="programming-select-flight" data-id="${esc(r.id)}" aria-pressed="${r.id===selected.id}"><span class="programming-choice-top"><strong>${alSym(a?.airline||'')}${esc(r.flightNo||'—')}</strong><span class="mono programming-choice-route">${esc(r.dep)} → ${esc(r.arr)}</span></span><span class="programming-choice-bottom"><small>${esc(cap1(dtfDay(std)))}</small><small class="mono">${utcHM(std)}Z · ${hhmm(Math.round((sta-std)/6e4))}</small></span>${locked?`<span class="programming-choice-lock" role="img" aria-label="${esc(bookingSequenceMessage(previous))}" title="${esc(bookingSequenceMessage(previous))}">${_ic('<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>')}</span>`:''}</button>`;
  }).join('');
  return `<div class="programming-master"><nav class="programming-flight-list" aria-label="${esc(t('programming_choose_flight'))}">${buttons}${pages>1?`<div class="programming-flight-pages"><button type="button" class="btn small" data-action="programming-select-page" data-id="${esc(mine[(page-1)*PROGRAMMING_PAGE_SIZE]?.id||'')}" ${page===0?'disabled':''} aria-label="${esc(t('programming_previous_flights'))}">‹</button><span class="muted">${page+1} / ${pages}</span><button type="button" class="btn small" data-action="programming-select-page" data-id="${esc(mine[(page+1)*PROGRAMMING_PAGE_SIZE]?.id||'')}" ${page===pages-1?'disabled':''} aria-label="${esc(t('programming_next_flights'))}">›</button></div>`:''}</nav><div class="programming-selected" aria-live="polite">${card(selected)}</div></div>`;
}
function programmingFlightDetail(r,a,status,acts){
  const legs=myLegs(),L=legs.find(leg=>leg.id===r.id)||{dep:r.dep,arr:r.arr,std:r.start,sta:r.end,blk:Math.round((r.end-r.start)/6e4),nm:0};
  const duty=myDuties(legs.filter(leg=>!leg.done)).find(d=>d.legs.some(leg=>leg.id===r.id));
  const route=r.route||L.route||'',fl=L.fl||(a?stripRFL(a,L):'');
  if(view==='briefing')return briefingFlightPanel(r,a,status,acts,L,duty,route,fl);
  return `<article class="programming-unified-flight"><header class="programming-flight-heading"><div><small class="muted">${esc(cap1(dtfDay(L.std)))}</small><h3>${alSym(a?.airline||'')}${esc(a?.airline||'')}</h3></div>${r.ferry?`<span class="chip neutral">${t('ferry_chip')}</span>`:''}${status&&status.key!=='ok'?`<span class="chip ${status.key==='bad'?'bad':'warn'}">${status.key==='bad'?'AOG':'MEL'}</span>`:''}</header><div class="programming-flight-route"><div><div class="programming-flight-airport">${wxCode(L.dep)}</div><b class="mono">${utcHM(L.std)}Z</b><small>${tf.format(L.std)} ${t('t_local')}</small></div><div class="programming-flight-middle"><span aria-hidden="true">✈</span><small>${L.nm?L.nm+' nm · ':''}${hhmm(L.blk)}${fl?' · FL'+esc(fl):''}</small>${route?`<small class="programming-route-text mono">${esc(route)}</small>`:''}</div><div class="programming-flight-arrival"><div class="programming-flight-airport">${wxCode(L.arr)}</div><b class="mono">${utcHM(L.sta)}Z</b><small>${tf.format(L.sta)} ${t('t_local')}</small></div></div><div class="programming-flight-body"><div class="programming-flight-aircraft">${a?`${regTag(a,r.aircraftId)} <span>${esc(a.airline||'')} · ${esc(a.type||'')}</span>`:esc(r.aircraftId||'')}</div>${duty?`<p class="programming-flight-duty muted">${cap1(t('rs_report'))} ${zT(duty.ci)} · ${cap1(t('rs_release'))} ${zT(duty.co)} · ${t('my_duty')} ${hhmm(duty.duty)}</p>`:''}${posConflict(r)?`<button class="chip bad linkish-chip" data-action="div-open" data-id="${esc(r.id)}">${t('div_chip',{loc:esc(posConflict(r))})}</button>`:''}${bookingSequenceGate(acts,r)}</div></article>`;
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action="programming-select-flight"],[data-action="programming-select-page"]');
  if(!button||button.disabled||view!=='bookings')return;
  const reservation=data.reservations.find(r=>r.id===button.dataset.id&&r.pilotId===myId&&booked(r)&&r.end>Date.now()-6*H);
  if(!reservation)return;PROGRAMMING_SELECTIONS.set(myId,reservation.id);render();
});

function briefingFlightPanel(r,a,status,acts,L,duty,route,fl){
 const briefLeg=briefLegs().find(x=>x.key===r.id);
 const tiles=(text,cls='')=>`<span class="bfp-tiles ${cls}">${esc(text)}</span>`;
 const airport=(code,time,arrival)=>`<div class="bfp-airport${arrival?' bfp-arrival':''}"><div class="bfp-label">${t(arrival?'brf_arr':'brf_dep')}</div>${tiles(code)}${tiles(utcHM(time)+'Z','bfp-clock')}<div class="bfp-local">${tf.format(time)} ${t('t_local')}</div></div>`;
 return `<article class="programming-unified-flight briefing-flight-panel" data-flight="${esc(r.id)}"><header class="bfp-heading"><div><h3>${alSym(a?.airline||'')}${esc(r.flightNo||'—')}</h3><div class="muted">${esc(cap1(dtfDay(L.std)))}</div></div><div class="bfp-status">${t('programming_scheduled')}${r.ferry?` · ${t('ferry_chip')}`:''}${status&&status.key!=='ok'?` · ${status.key==='bad'?'AOG':'MEL'}`:''}</div></header><div class="bfp-board bfp-pass"><div class="bfp-pass-main"><div class="bfp-trip">${airport(L.dep,L.std,false)}<div class="bfp-middle"><div class="bfp-route-track"><span class="bfp-route-trace" aria-hidden="true"></span><button type="button" class="bfp-plane bfp-route-play" data-action="bfp-route-replay" aria-label="${esc(t('bfp_route_replay'))}" title="${esc(t('bfp_route_replay'))}">✈</button></div><div class="bfp-metrics">${L.nm?L.nm+' nm · ':''}${hhmm(L.blk)}${fl?' · FL'+esc(fl):''}</div></div>${airport(L.arr,L.sta,true)}</div>${route?`<div class="bfp-route"><span>${esc(route)}</span></div>`:''}</div><aside class="bfp-pass-stub"><small>${t('bfp_pass_flight')}</small><strong>${esc(r.flightNo||'—')}</strong><span class="plate al-plate${plLen(a?.registration||r.aircraftId)}"${plateStyle(a?.airline||'')}>${esc(a?.registration||r.aircraftId)}</span><div class="bfp-pass-barcode" aria-hidden="true"></div></aside></div><div class="bfp-aircraft">${a?`${planeImg(a,'sm')}<div class="bfp-aircraft-meta"><span>${esc(a.airline||'')} · ${esc(a.type||'')}</span>${duty?`<div class="bfp-duty">${cap1(t('rs_report'))} ${zT(duty.ci)} · ${cap1(t('rs_release'))} ${zT(duty.co)} · ${t('my_duty')} ${hhmm(duty.duty)}</div>`:''}</div>`:esc(r.aircraftId||'')}${briefLeg?briefFlightAlternateHTML(briefLeg):''}</div><div class="programming-flight-body">${posConflict(r)?`<button class="chip bad linkish-chip" data-action="div-open" data-id="${esc(r.id)}">${t('div_chip',{loc:esc(posConflict(r))})}</button>`:''}${bookingSequenceGate(acts,r)}</div></article>`;
}
function programmingFlightSummary(r,a,status,acts){
 if(!r.rosterId||r.end<=Date.now())return programmingFlightDetail(r,a,status,acts);
 const previous=bookingPreviousIncomplete(r);
 return `<article class="programming-summary">${a?`<div class="programming-summary-aircraft">${planeImg(a,"sm")}<span class="plate al-plate${plLen(a.registration||r.aircraftId)}"${plateStyle(a.airline||"")}>${esc(a.registration||r.aircraftId)}</span></div>`:""}<div class="programming-summary-info"><small class="muted">${esc(cap1(dtfDay(r.start+20*6e4)))}</small><h3>${alSym(a?.airline||'')}${esc(r.flightNo||'—')} · <span class="mono">${esc(r.dep)} → ${esc(r.arr)}</span></h3><p class="muted">${utcHM(r.start+20*6e4)}Z · ${hhmm(Math.round((r.end-r.start-45*6e4)/6e4))} · ${t('programming_scheduled')}${previous?' · 🔒':''}</p></div><button type="button" class="btn primary" data-action="programming-prepare" data-id="${esc(r.id)}">${t('programming_prepare')} →</button>${bookingExpiryWarning(r)}${IS_ADMIN()?`<div class="programming-summary-admin">${admCancelBtns(r)}</div>`:''}</article>`;
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action="programming-prepare"]');if(!button)return;
 const r=data.reservations.find(x=>x.id===button.dataset.id&&x.pilotId===myId&&x.rosterId&&booked(x)&&x.end>Date.now());if(!r)return;
 PROGRAMMING_SELECTIONS.set(myId,r.id);openBriefingFlight(r.id);
});

let briefingFlapIdentity='';
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action="booking-previous-flight"]');if(!button)return;
 const reservation=data.reservations.find(r=>r.id===button.dataset.id&&r.pilotId===myId),previous=bookingPreviousIncomplete(reservation);
 if(!previous||previous.pilotId!==myId||!booked(previous)||!briefLegs().some(l=>l.key===previous.id))return;
 PROGRAMMING_SELECTIONS.set(myId,previous.id);openBriefingFlight(previous.id);
});
document.addEventListener('click',event=>{
 if(!event.target.closest('[data-action="brf-leg"],[data-action="programming-select-flight"],[data-action="programming-select-page"],[data-action="programming-prepare"]'))return;
 requestAnimationFrame(()=>{document.querySelectorAll('.bk-sequence-note').forEach(note=>{if(!note.getClientRects().length)return;note.classList.remove('sequence-notice-flash');void note.offsetWidth;note.classList.add('sequence-notice-flash');note.addEventListener('animationend',()=>note.classList.remove('sequence-notice-flash'),{once:true})})});
});

const BFP_ROUTE_PLAYED=new Set(),BFP_ROUTE_MOTION=new WeakMap();
function bfpRouteAnimate(panel){if(!panel?.isConnected||!panel.getClientRects().length)return;for(const a of BFP_ROUTE_MOTION.get(panel)||[])a.cancel();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const animations=[],animate=(el,frames,options)=>{if(el)animations.push(el.animate(frames,options))},trace=panel.querySelector('.bfp-route-trace'),plane=panel.querySelector('.bfp-plane'),color=plane?getComputedStyle(plane).color:'#e5a800';
 animate(trace,[{transform:'scaleX(0)',opacity:1},{transform:'scaleX(1)',opacity:1,offset:.8},{transform:'scaleX(1)',opacity:0}],{duration:2400,easing:'ease-in-out'});
 animate(panel.querySelector('.bfp-route>span'),[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:1800,delay:150,easing:'steps(28,end)'});
 [panel.querySelector('.bfp-airport>.bfp-tiles'),panel.querySelector('.bfp-arrival>.bfp-tiles')].forEach((el,i)=>animate(el,[{transform:'scale(1)'},{transform:'scale(1.05)',color,offset:.5},{transform:'scale(1)'}],{duration:600,delay:i?1600:0,easing:'ease-in-out'}));BFP_ROUTE_MOTION.set(panel,animations)}
function bfpRouteAnimateOnce(panel){const key=myId+'|'+panel.dataset.flight;if(BFP_ROUTE_PLAYED.has(key))return;BFP_ROUTE_PLAYED.add(key);while(BFP_ROUTE_PLAYED.size>100)BFP_ROUTE_PLAYED.delete(BFP_ROUTE_PLAYED.keys().next().value);requestAnimationFrame(()=>bfpRouteAnimate(panel))}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-action="bfp-route-replay"]');if(b)bfpRouteAnimate(b.closest('.briefing-flight-panel'))});

function briefingFlapAnimate(force=false){
 const panel=document.querySelector('[data-brf-section="flight"]:not([hidden]) .briefing-flight-panel');
 if(!panel){briefingFlapIdentity='';return}
 if(panel.querySelector('.bfp-pass')){if(force===true)BFP_ROUTE_PLAYED.delete(myId+'|'+panel.dataset.flight);bfpRouteAnimateOnce(panel);return}
 const identity=panel.dataset.flight+'|'+[...panel.querySelectorAll('.bfp-tiles')].map(el=>el.textContent).join('|');
 if(identity===briefingFlapIdentity)return;briefingFlapIdentity=identity;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 panel.querySelectorAll('.bfp-tiles>span').forEach((tile,i)=>{const final=tile.textContent;if(!/[A-Z0-9]/.test(final))return;const pool=/[0-9]/.test(final)?'0123456789':'ABCDEFGHIJKLMNOPQRSTUVWXYZ';let step=0;
 setTimeout(function tick(){if(!tile.isConnected)return;tile.classList.remove('bfp-flip');void tile.offsetWidth;tile.classList.add('bfp-flip');if(++step>=10){tile.textContent=final;setTimeout(()=>tile.classList.remove('bfp-flip'),120);return}tile.textContent=pool[(i+step*3)%pool.length];setTimeout(tick,55)},i*30)
 });
}
new MutationObserver(briefingFlapAnimate).observe(document.getElementById('view'),{childList:true,subtree:false});
document.addEventListener('click',e=>{const b=e.target.closest('[data-action="brf-section"],[data-action="brf-pin"]');if(b)setTimeout(()=>briefingFlapAnimate(b.dataset.section==='flight'),0)});
