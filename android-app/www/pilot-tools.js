/* Flight-specific pilot tools. Details share one viewport-bounded dialog. */
const pilotLabels={brief:"O que mudou?",save:"Salvar para o voo",saved:"Briefing salvo",passport:"Passaporte do piloto",replay:"Rever voo"};
function pilotToolsButton(action,id=""){
 return '<button type="button" class="btn small" data-pilot-tool="'+action+'" data-id="'+esc(id)+'">'+pilotLabels[action]+'</button>';
}
function pilotReplayButton(f){return f.trackId&&f.pilotId===myId?pilotToolsButton("replay",f.id):""}
(()=>{
 const dialog=document.createElement("dialog");
 dialog.className="pilot-tools-dialog";
 document.body.append(dialog);
 const style=document.createElement("style");
 style.textContent='.pilot-tools-dialog{box-sizing:border-box;width:min(720px,95vw);max-height:88dvh;overflow:hidden;padding:14px;color:var(--ink);background:var(--sheet);border:1px solid var(--line);border-radius:12px}.pilot-tools-dialog[open]{display:flex;flex-direction:column;gap:8px}.pilot-tools-dialog::backdrop{background:#0008}.pilot-tools-dialog header,.pilot-tool-actions{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.pilot-tools-dialog header{justify-content:space-between}.pilot-tools-dialog h3,.pilot-tools-dialog p{margin:0}.pilot-tool-body{min-height:0;overflow:auto;overscroll-behavior:contain}.pilot-tool-body pre{white-space:pre-wrap;overflow-wrap:anywhere}.pilot-tool-map{height:min(36dvh,300px);min-height:110px}.pilot-tool-body input[type=range]{width:100%}';
 document.head.append(style);
 let map,urls=[];
 function cleanup(){map?.remove();map=null;urls.forEach(URL.revokeObjectURL);urls=[]}
 dialog.addEventListener("close",cleanup);
 function panel(title){cleanup();dialog.innerHTML='<header><h3>'+esc(title)+'</h3><button type="button" class="btn small">Fechar</button></header><section class="pilot-tool-body"></section>';dialog.querySelector('header button').onclick=()=>dialog.close();if(!dialog.open)dialog.showModal();return dialog.lastElementChild}
 function active(id){return briefLegs().find(l=>l.key===id)}
 function snapshot(l){
  const values={};
  for(const code of briefAirports(l)){
   const w=BRF.wx[code]?.data;
   if(w?.metar)values[code+' METAR']=w.metar;
   if(w?.taf)values[code+' TAF']=w.taf;
   if(BRF.notam[code]&&!BRF.err[code])values[code+' NOTAM']=notamHits(code,l).map(n=>n.raw).sort().join('\n\n')||'Nenhum aviso aplicável';
  }
  const p=briefMatchedPlan(l);
  if(p)values['Despacho SimBrief']=p.ofpText||[p.route,p.alternate].filter(Boolean).join(' · ');
  return values;
 }
 const baselineKey=l=>'vfr-revisao:'+myId+':'+l.key;
 function previous(l){try{return JSON.parse(localStorage.getItem(baselineKey(l)))||{}}catch{return {}}}
 async function refreshBrief(l){
  await briefDispatchSync();const codes=briefAirports(l);await Promise.all([briefLoad(codes),...codes.map(async code=>{const weather=await fetchWx(code);if(weather)BRF.wx[code]={data:weather}})]);
 }
 async function changes(l){
  const body=panel(l.fno+' · '+l.dep+' → '+l.arr);body.textContent='Consultando o briefing…';
  await refreshBrief(l);
  if(!body.isConnected)return;
  const now=snapshot(l),old=previous(l),changed=Object.keys(now).filter(k=>Object.hasOwn(old,k)&&old[k]!==now[k]);
  body.innerHTML='<div class="pilot-tool-actions">'+pilotToolsButton('save',l.key)+pilotToolsButton('saved')+'</div><p>'+(!Object.keys(old).length?'Primeira consulta. Os dados disponíveis serão a referência da próxima comparação.':changed.length?changed.length+' atualizações desde sua consulta.':'Sem mudanças nos dados disponíveis.')+'</p>'+changed.map(k=>'<details><summary>'+esc(k)+'</summary><small>Consulta anterior</small><pre>'+esc(old[k])+'</pre><small>Atual</small><pre>'+esc(now[k])+'</pre></details>').join('');
  localStorage.setItem(baselineKey(l),JSON.stringify({...old,...now}));
 }
 function storage(){return new Promise((ok,no)=>{const r=indexedDB.open('vfr-pilot-packs',1);r.onupgradeneeded=()=>r.result.createObjectStore('packs');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
 async function packStore(owner,value){const db=await storage();try{return await new Promise((ok,no)=>{const tx=db.transaction('packs',value?'readwrite':'readonly'),s=tx.objectStore('packs'),r=value?s.put(value,owner):s.get(owner);tx.oncomplete=()=>ok(r.result);tx.onabort=()=>no(tx.error);tx.onerror=()=>no(tx.error)})}finally{db.close()}}
 async function save(l){
  const owner=myId,body=panel('Salvar para o voo');body.textContent='Reunindo os dados e as cartas selecionadas…';
  await refreshBrief(l);const codes=briefAirports(l);await Promise.all(codes.map(c=>bcLoad(c)));
  const pack={title:l.fno+' · '+l.dep+' → '+l.arr,time:Date.now(),values:snapshot(l),files:[],missing:[]};
  for(const c of codes){for(const kind of ['METAR','TAF','NOTAM'])if(!(c+' '+kind in pack.values))pack.missing.push(c+' '+kind);if(!BRIEF_CHARTS.catalogues.get(c)?.charts)pack.missing.push('Catálogo '+c)}
  if(!pack.values['Despacho SimBrief'])pack.missing.push('Despacho SimBrief');
  for(const chart of bcSelected(l)){try{pack.files.push({title:bcFilename(chart),blob:new Blob([await bcBytes(chart)],{type:'application/pdf'})})}catch{pack.missing.push(chart.name)}}
  await packStore(owner,pack);if(body.isConnected&&owner===myId)await saved();
 }
 async function saved(){const body=panel('Briefing salvo'),pack=await packStore(myId);if(!body.isConnected)return;if(!pack){body.textContent='Nenhum briefing salvo neste dispositivo.';return}
  body.innerHTML='<strong>'+esc(pack.title)+'</strong><p>Cópia de '+esc(new Date(pack.time).toLocaleString())+'</p>'+Object.entries(pack.values).map(([k,v])=>'<details><summary>'+esc(k)+'</summary><pre>'+esc(v)+'</pre></details>').join('');
  for(const f of pack.files){const a=document.createElement('a');a.href=URL.createObjectURL(f.blob);urls.push(a.href);a.download=f.title;a.className='btn small';a.textContent=f.title;body.append(a)}
  if(pack.missing.length){const p=document.createElement('p');p.textContent='Indisponível nesta cópia: '+pack.missing.join(', ');body.append(p)}
 }
 async function makeMap(body){await loadLeaflet();if(!body.isConnected)return;const el=document.createElement('div');el.className='pilot-tool-map';body.prepend(el);map=window.L.map(el);window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);return map}
 async function replay(id){
  const f=data.flights.find(f=>f.id===id&&f.pilotId===myId);if(!f?.trackId)return;
  const body=panel('Rever voo · '+f.dep+' → '+f.arr);body.textContent='Carregando trajetória…';const points=[];
  while(body.isConnected){const {data:rows,error}=await sb.from('track_points').select('t,lat,lon,alt_ft,gs_kt').eq('track_id',f.trackId).order('t').range(points.length,points.length+499);if(error)throw error;points.push(...rows);if(rows.length<500)break}
  if(!body.isConnected)return;if(!points.length){body.textContent='Sem posições registradas para este voo.';return}
  body.innerHTML='<input type="range" aria-label="Instante do voo" min="0" max="'+(points.length-1)+'" value="0"><output></output>';const m=await makeMap(body);if(!m)return;
  const line=window.L.polyline(points.map(p=>[p.lat,p.lon])).addTo(m);m.fitBounds(line.getBounds(),{padding:[16,16],maxZoom:13});const marker=window.L.circleMarker(line.getLatLngs()[0]).addTo(m),slider=body.querySelector('input');
  function show(){const p=points[+slider.value];marker.setLatLng([p.lat,p.lon]);body.querySelector('output').textContent=new Date(p.t).toISOString().slice(11,19)+'Z · '+p.alt_ft+' ft · '+p.gs_kt+' kt'}slider.oninput=show;show();
 }
 async function passport(){
  const body=panel('Passaporte do piloto'),visits=new Map();
  for(const f of data.flights.filter(f=>f.pilotId===myId&&counts(f)&&f.arr).sort((a,b)=>a.createdAt-b.createdAt)){if(!visits.has(f.arr))visits.set(f.arr,[]);visits.get(f.arr).push(f)}
  if(!visits.size){body.textContent='Seu primeiro pouso registrado aparecerá aqui.';return}
  await loadAirports();if(!body.isConnected)return;const select=document.createElement('select'),info=document.createElement('div');select.setAttribute('aria-label','Aeródromo visitado');body.append(select,info);
  for(const code of visits.keys())select.add(new Option(code,code));
  function show(){const rows=visits.get(select.value);info.innerHTML='<p>Primeira visita · '+esc(dateF(rows[0].createdAt))+'</p>'+rows.map(f=>'<p>'+esc(dateF(f.createdAt)+' · '+f.dep+' → '+f.arr+' · '+(acById(f.aircraftId)?.registration||f.aircraftId))+'</p>').join('')}select.onchange=show;show();
  const m=await makeMap(body);if(!m)return;const coords=[];for(const code of visits.keys()){const a=AIRPORTS?.[code];if(!a)continue;const ll=a.slice(0,2);coords.push(ll);window.L.circleMarker(ll).bindTooltip(code).addTo(m).on('click',()=>{select.value=code;show()})}if(coords.length)m.fitBounds(coords,{maxZoom:8,padding:[18,18]});else m.setView([0,0],2)
 }
 document.addEventListener('click',async e=>{const b=e.target.closest('[data-pilot-tool]');if(!b||!myId)return;try{const k=b.dataset.pilotTool,l=active(b.dataset.id);if(k==='brief'&&l)await changes(l);if(k==='save'&&l)await save(l);if(k==='saved')await saved();if(k==='passport')await passport();if(k==='replay')await replay(b.dataset.id)}catch{if(dialog.open){const p=document.createElement('p');p.textContent='Não foi possível concluir. Verifique a conexão ou o espaço disponível e tente novamente.';dialog.lastElementChild.append(p)}}});
 const beforeProfile=sheetMySims;sheetMySims=function(){const r=beforeProfile.apply(this,arguments);document.querySelector('#f-sims')?.insertAdjacentHTML('afterbegin',pilotToolsButton('passport'));return r};
 const beforeRender=render;render=function(){const r=beforeRender.apply(this,arguments);if(view==='home'&&myId){const head=document.querySelector('.hm-top'),leg=briefLegs()[0];if(head&&!head.querySelector('[data-pilot-tool]'))head.insertAdjacentHTML('beforeend',(leg?pilotToolsButton('brief',leg.key):'')+pilotToolsButton('saved'))}return r};
})();
