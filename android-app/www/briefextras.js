/* Flight-scoped briefing resources; checklist is personal and never changes flight approval. */
function briefMatchedPlan(L){const D=BRIEF_DISPATCH;if(D.owner!==briefDispatchOwner()||D.error)return null;const item=D.plans?.[L.key];return item?.key===briefDispatchKey(L)?item.plan:null}
function briefOFPHTML(L){
 const p=briefMatchedPlan(L);if(!p)return '';
 const pdf=typeof simbriefOFPPdf==='function'?simbriefOFPPdf({files:{pdf:p.ofpPdf}}):'';
 return `<section class="brf-ofp"><div class="sec-head"><h4>${t('brf_ofp_title')}</h4>${pdf?`<a class="btn small" href="${esc(pdf)}" target="_blank" rel="noopener">${t('brf_ofp_pdf')} ↗</a>`:''}</div>${p.ofpText?`<pre class="brf-ofp-text">${esc(p.ofpText)}</pre>`:`<p class="muted">${t(pdf?'brf_ofp_pdf_only':'brf_ofp_unavailable')}</p>`}</section>`;
}
function briefExtraIcon(key){return key==='charts'?NAV_ICON.manual:key==='plan'?NAV_ICON.bookings:key==='aircraft'?NAV_ICON.fleet:_ic('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 8 1 1 2-2m2 1h3m-8 6 1 1 2-2m2 1h3"/>')}
function briefExtraPanel(key,L){
 const a=acById(L.acId),p=briefMatchedPlan(L),row=(label,value)=>`<div><dt>${esc(label)}</dt><dd>${esc(value==null||value===''?'—':String(value))}</dd></div>`;
 if(key==='charts')return briefChartsHTML(L);
 if(key==='plan'){
  const leg=typeof myLegs==='function'?myLegs().find(x=>x.id===L.key):null,r=data.reservations.find(x=>x.id===L.key),route=p?.route||r?.route||leg?.route||'';
  return `<section class="panel brf-extra"><h3>${t('brf_tab_plan')}</h3><p class="notice ${p?'':'warn'}">${t(p?'brf_plan_matched':'brf_plan_missing')}</p><dl class="brf-extra-facts">${row(t('brf_dep'),L.dep)}${row(t('brf_arr'),L.arr)}${row(t('brf_alternate_short'),briefAlternate(L))}${row(t('aircraft'),a?.registration||L.acId)}${row('EOBT',utcHM(L.eobt)+'Z')}${row('ETA',utcHM(L.eta)+'Z')}${row(t('brf_level'),p?.level||leg?.fl?'FL'+String(p?.level||leg.fl).replace(/^FL/i,''):'')}${row(t('brf_fuel'),p?.fuel>0?p.fuel+' '+p.units:'')}</dl><h4>${t('rs_col_route')}</h4><p class="mono brf-extra-route">${esc(route||'—')}</p>${briefOFPHTML(L)}<button type="button" class="btn small" data-action="brf-refresh">↻ ${t('brf_refresh')}</button></section>`;
 }
 if(key==='aircraft')return `<section class="panel brf-extra"><h3>${t('brf_tab_aircraft')}</h3>${a?`<div class="brf-extra-ac"><div>${regTag(a,L.acId)}</div><strong>${esc(a.type||'')}</strong><span class="muted">${esc(a.airline||'')}</span></div>${typeof scAcPhotoBox==='function'?scAcPhotoBox(a):''}${typeof liveryHTML==='function'?`<div class="brf-extra-liv">${liveryHTML(a.id)}</div>`:''}<h4>${t('techlog')}</h4>${logReviewHTML(a)}<p class="hint">${t('brf_equipment_note')}</p><button type="button" class="btn small" data-action="open-aircraft" data-id="${esc(a.id)}">${t('techlog')}</button>`:`<p>${t('brf_extra_missing')}</p>`}</section>`;
 if(key==='checklist'){
  const saved=briefChecklistRead(L),items=['weather','notams','alternate','fuel','charts','aircraft'];
  return `<section class="panel brf-extra"><h3>${t('brf_tab_checklist')}</h3><p class="muted">${t('brf_check_note')}</p><p class="brf-check-progress" aria-live="polite">${items.filter(k=>saved[k]===true).length} / ${items.length}</p><div class="brf-check-items">${items.map(k=>`<label><input type="checkbox" data-brief-check="${k}" data-leg="${esc(L.key)}" ${saved[k]===true?'checked':''}><span>${t('brf_check_'+k)}</span></label>`).join('')}</div></section>`;
 }
 return '';
}
function briefChecklistKey(L){return 'vfr-brief-check:'+myId+':'+L.key}
function briefChecklistContext(L){const p=briefMatchedPlan(L);return JSON.stringify([L.dep,L.arr,L.eobt,L.acId,briefAlternate(L),briefAltEta(L),p?.dispatchId||'',p?.route||'',p?.fuel||0])}
function briefChecklistRead(L){try{const saved=JSON.parse(localStorage.getItem(briefChecklistKey(L))||'null');return saved?.context===briefChecklistContext(L)&&saved?.items&&typeof saved.items==='object'?saved.items:{}}catch(e){return {}}}
document.addEventListener('change',event=>{const input=event.target.closest?.('[data-brief-check]');if(!input)return;const L=briefLegs().find(x=>x.key===input.dataset.leg);if(!L)return;const items=briefChecklistRead(L);items[input.dataset.briefCheck]=!!input.checked;try{localStorage.setItem(briefChecklistKey(L),JSON.stringify({context:briefChecklistContext(L),items}))}catch(e){}const panel=input.closest('.brf-extra'),checks=[...panel.querySelectorAll('[data-brief-check]')];panel.querySelector('.brf-check-progress').textContent=checks.filter(x=>x.checked).length+' / '+checks.length});
