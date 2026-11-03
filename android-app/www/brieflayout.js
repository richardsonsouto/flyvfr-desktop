/* Viewport-aware briefing layout. Nodes stay in place: delegated actions and selections survive paging. */
const BRF_LAYOUT_PAGES=new WeakMap();
let brfLayoutFrame=0,brfLayoutBusy=false;
function brfLayoutSchedule(){if(brfLayoutBusy)return;cancelAnimationFrame(brfLayoutFrame);brfLayoutFrame=requestAnimationFrame(brfLayoutFit)}
/* Sem paginação: tudo o que o submenu mostra fica numa única página (o quadro rola por dentro quando precisa).
   brfLayoutPager e brfLayoutReadMore continuam existindo porque outras partes os chamam, mas só garantem que tudo apareça. */
function brfLayoutPager(host,items){
 if(!host)return;host.querySelector(':scope>.brf-fit-pages')?.remove();BRF_LAYOUT_PAGES.delete(host);
 (items||[]).forEach(el=>el.classList.remove('brf-fit-hidden'));
}
function brfLayoutReadMore(){}
function brfLayoutFit(){
 if(view!=='briefing'||BRF.printing)return;
 const workspace=document.querySelector('.brf-workspace'),panel=workspace?.querySelector('.brf-subpanel:not([hidden])');if(!panel)return;
 brfLayoutBusy=true;
 try{
  workspace.classList.add('brf-viewport');briefPlaceFlightContext();
  panel.querySelectorAll('.brf-fit-hidden').forEach(el=>el.classList.remove('brf-fit-hidden'));
  const viewport=window.visualViewport?.height||innerHeight,top=workspace.getBoundingClientRect().top;
  workspace.style.setProperty('--brf-available',Math.max(220,Math.floor(viewport-top-28))+'px');
  const picker=workspace.querySelector('.brf-flight-below-nav'),pickerHeight=picker?.getClientRects().length?picker.getBoundingClientRect().height+10:0;
  const context=workspace.querySelector('.brf-section-content>.brf-flight-context'),contextHeight=context?.getClientRects().length?context.getBoundingClientRect().height:0;
  const height=Math.max(140,workspace.querySelector('.brf-section-content').clientHeight-pickerHeight-contextHeight),width=panel.clientWidth;
  if(panel.querySelector('.brf-weather-dashboard')){
   const dashboard=panel.querySelector('.brf-weather-dashboard');dashboard.style.height=height+'px';
   const grid=dashboard.querySelector('.mv-grid');if(grid){dashboard.classList.toggle('brf-taf-dashboard',!!grid.closest('.taf-visual'));grid.style.removeProperty('--wx-columns');grid.style.removeProperty('--wx-rows');grid.style.removeProperty('--wx-art-scale')}
   return;
  }
  if(panel.querySelector('.rwx-dashboard')){
   const dashboard=panel.querySelector('.rwx-dashboard'),top=dashboard.getBoundingClientRect().top;
   dashboard.style.height=Math.max(180,Math.floor(viewport-top-40))+'px';
   const sidebar=dashboard.querySelector('.rwx-sidebar'),grid=dashboard.querySelector('.rwx-grid');
   if(grid){const items=[...grid.children].filter(el=>!el.classList.contains('brf-fit-pages'));brfLayoutPager(grid,items,Math.max(1,Math.min(3,Math.floor((sidebar.clientHeight-50)/240))))}
   return;
  }
  if(panel.querySelector('.ntc-flip-picker')){
   const host=panel.querySelector('.brf-notam-compact');host.classList.add('ntc-dashboard');host.style.height=height+'px';
   const grid=host.querySelector('.ntc-grid'),columns=width<600?1:width<900?2:3;grid.style.setProperty('--ntc-columns',columns);grid.style.setProperty('--ntc-rows',Math.ceil(grid.children.length/columns));
   return;
  }
  for(const pages of panel.querySelectorAll('.ntc-pages')){
   if(pages.dataset.fitSelect)continue;const buttons=[...pages.querySelectorAll('button')];if(buttons.length<4)continue;
   pages.dataset.fitSelect='1';const select=document.createElement('select');select.setAttribute('aria-label',t('brf_fit_page',{n:'',total:buttons.length}));
   buttons.forEach((button,i)=>{const option=new Option(t('brf_fit_page',{n:i+1,total:buttons.length}),String(i));option.selected=button.getAttribute('aria-pressed')==='true';select.add(option);button.hidden=true});
   select.addEventListener('change',()=>buttons[Number(select.value)]?.click());pages.append(select);
  }
  panel.querySelectorAll('.wx-raw,.brf-ofp-text,.notam-mode-original,.ntm-e,.rwx-decoded pre,.bc-guidance p.mono').forEach(brfLayoutReadMore);
  for(const detail of (false?panel.querySelectorAll('.ntc-detail,.rwx-detail'):[])){
   if(detail.dataset.fitDetail)continue;detail.dataset.fitDetail='1';detail.classList.add('brf-fit-detail-original');
   const button=document.createElement('button');button.type='button';button.className='btn small brf-fit-read';button.textContent=t('brf_fit_read');
   button.addEventListener('click',()=>openSheet('form',head(t('brf_title'),t('brf_fit_read'))+'<div class="brf-fit-reading">'+detail.outerHTML.replace('brf-fit-detail-original','')+'</div>'));detail.after(button);
  }
  for(const grid of panel.querySelectorAll('.ntc-grid,.rwx-grid,.mv-grid,.tv-grid')){
   const items=[...grid.children].filter(el=>!el.classList.contains('brf-fit-pages'));if(!items.length)continue;
   const columns=Math.max(1,getComputedStyle(grid).gridTemplateColumns.split(' ').length),row=items[0].getBoundingClientRect().height||100;
   const maxRows=grid.matches('.mv-grid,.tv-grid')?1:Math.max(1,Math.min(2,Math.floor((height-180)/(row+8))));
   brfLayoutPager(grid,items,columns*maxRows);
  }
  for(const host of panel.querySelectorAll('.brf-tracking .trk-tiles'))brfLayoutPager(host,[...host.querySelectorAll(':scope>div:not(.brf-fit-pages)')],width<600?2:6);
  for(const host of panel.querySelectorAll('.brf-check-items'))brfLayoutPager(host,[...host.querySelectorAll(':scope>label')],width<600?2:6);
  for(const host of panel.querySelectorAll('.bc-type-content')){
   const items=[...host.querySelectorAll(':scope>.bc-chart')];brfLayoutPager(host,items,Math.max(1,Math.min(width>800?4:2,Math.floor((height-225)/65))));
  }
  for(const host of panel.querySelectorAll('#net-brief-content')){
   const items=[...host.querySelectorAll(':scope>.net-brief-card')];brfLayoutPager(host,items,width>800&&height>360?4:2);
  }
  // If METAR and TAF do not fit together, page the two complete reports rather than clipping either.
  for(const host of panel.querySelectorAll('.brf-wx-both')){
   const items=[...host.querySelectorAll(':scope>.brf-wx-report-content')];items.forEach(el=>el.classList.remove('brf-fit-hidden'));
   const total=items.reduce((n,el)=>n+el.getBoundingClientRect().height+8,0);
   brfLayoutPager(host,items,total>height-140?1:Math.max(1,items.length));
  }
  // Last-level paging for entire semantic blocks (summary, route, aircraft, actions, OFP...).
  const host=panel.querySelector(':scope>.panel,:scope>.brf-weather-compact,:scope>.briefing-flight-panel');
  if(host&&!host.classList.contains('brf-mapp')&&!(BRF.section==='flight'&&width>=900)){
   const children=[...host.children].filter(el=>!el.classList.contains('brf-fit-pages'));
   const fixed=children.filter(el=>el.matches(width<600?'h3,.brf-tracking-help':'h3,.brf-tracking-help,.sec-head,.brf-weather-tabs,.brf-weather-heading,.bc-airports,.bc-list-menu,.bc-type-menu,.bc-catalogue-footer,.bc-status,.brf-weather-sources'));
   // Voo rastreado: a ajuda "Como conectar" fica sempre na mesma página; quando aberta, usa o espaço que sobra (com rolagem interna se faltar).
   const help=fixed.find(el=>el.matches('.brf-tracking-help'));if(help){help.style.maxHeight='';help.style.overflow='';const used=children.filter(el=>el!==help).reduce((n,el)=>n+el.getBoundingClientRect().height+6,0);if(help.querySelector('details[open]')){help.style.maxHeight=Math.max(120,height-used-48)+'px';help.style.overflow='auto'}}
   const items=children.filter(el=>!fixed.includes(el));items.forEach(el=>el.classList.remove('brf-fit-hidden'));
   const fixedHeight=fixed.reduce((n,el)=>n+el.getBoundingClientRect().height+6,0);
   const total=items.reduce((n,el)=>n+el.getBoundingClientRect().height+6,0);
   const room=Math.max(90,height-fixedHeight-48);
   if(total>room&&items.length>1){
    // Size a page conservatively; every original block remains reachable with the pager.
    let sum=0,group=[];const groups=[];for(const el of items){const h=Math.max(el.scrollHeight,el.getBoundingClientRect().height)+6;if(sum+h>room&&group.length){groups.push(group);group=[];sum=0}group.push(el);sum+=h}if(group.length)groups.push(group);
    brfLayoutPager(host,items,groups);
   }else if(BRF_LAYOUT_PAGES.has(host))brfLayoutPager(host,items,Math.max(1,items.length));
  }
  if(BRF.section==='map'){const map=document.getElementById('brf-map');if(map){const shell=map.closest('.brf-mapp'),rest=shell.getBoundingClientRect().height-map.getBoundingClientRect().height;map.style.height=Math.max(100,height-rest-8)+'px';BRF.map?.invalidateSize({pan:false,animate:false})}}
 }finally{brfLayoutBusy=false}
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-fit-step]');if(button){const state=BRF_LAYOUT_PAGES.get(button.parentElement.parentElement);if(state){state.page=Math.max(0,Math.min(state.pages-1,state.page+Number(button.dataset.fitStep)));brfLayoutPager(button.parentElement.parentElement,state.items,state.capacity)}return}
 if(e.target.closest?.('[data-action^="brf-"],[data-action^="bc-"],[data-action^="net-"],[data-action^="taf-"],summary'))setTimeout(brfLayoutSchedule,0);
});
window.addEventListener('resize',brfLayoutSchedule);window.visualViewport?.addEventListener('resize',brfLayoutSchedule);
new MutationObserver(records=>{if(!brfLayoutBusy&&records.some(r=>r.type==='childList'&&!r.target.closest?.('.brf-fit-pages,.mv-item')))brfLayoutSchedule()}).observe(document.getElementById('view'),{childList:true,subtree:true});
window.addEventListener('beforeprint',()=>{document.querySelector('.brf-workspace')?.classList.remove('brf-viewport');document.querySelectorAll('.brf-fit-hidden').forEach(el=>el.classList.remove('brf-fit-hidden'))});
window.addEventListener('afterprint',brfLayoutSchedule);
/* Checklist do briefing removido: quem tinha a seção salva volta para Voo */
if(typeof render==="function"){const blRender=render;render=function(){if(typeof BRF!=="undefined"&&BRF.section==="checklist")BRF.section="flight";return blRender.apply(this,arguments)}}

/* fontes da meteorologia/NOTAM: em vez de uma linha solta no fim da sala (que ficava por cima do painel),
   viram uma nota no fim dos painéis Meteorologia e NOTAM, onde esses dados aparecem. Na impressão continuam no rodapé. */
function brfSrcFill(){if(typeof BRF!=="undefined"&&BRF.printing)return;const v=document.getElementById("view");if(!v||!v.dataset.brfSrc)return;const txt=v.dataset.brfSrc;
  ["wx","notam"].forEach(k=>{const sp=v.querySelector(`.brf-subpanel[data-brf-section="${k}"]`),box=sp&&(sp.querySelector(":scope>section.panel")||sp);if(box&&!sp.querySelector(".brf-src"))box.insertAdjacentHTML("beforeend",`<p class="brf-src">ⓘ ${esc(txt)}</p>`)})}
function brfSrcPlace(){if(typeof view==="undefined"||view!=="briefing"||(typeof BRF!=="undefined"&&BRF.printing))return;
  const v=document.getElementById("view");if(!v)return;const txt=t("brf_src");
  const loose=[...v.querySelectorAll("p.muted")].find(p=>!p.classList.contains("brf-src")&&p.textContent===txt);if(!loose)return;loose.remove();v.dataset.brfSrc=txt;
  ["wx","notam"].forEach(k=>{const sp=v.querySelector(`.brf-subpanel[data-brf-section="${k}"]`),box=sp&&(sp.querySelector(":scope>section.panel")||sp);if(box&&!sp.querySelector(".brf-src"))box.insertAdjacentHTML("beforeend",`<p class="brf-src">ⓘ ${esc(txt)}</p>`)})}
{let bsRaf=0;new MutationObserver(()=>{if(bsRaf||typeof view==="undefined"||view!=="briefing")return;bsRaf=requestAnimationFrame(()=>{bsRaf=0;try{brfSrcFill()}catch(e){}})}).observe(document.documentElement,{childList:true,subtree:true})}
if(typeof render==="function"){const bsRender=render;render=function(){const r=bsRender.apply(this,arguments);try{brfSrcPlace()}catch(e){}return r}}
