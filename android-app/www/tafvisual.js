/* Forecast groups keep prevailing conditions separate from temporary overlays. */
const TAF_VISUAL_SELECTION=new Map();
function tafVisualGroups(raw){
 if(!raw||/\b(?:NIL|CNL)\b/.test(raw))return[];
 const text=String(raw).replace(/\s+/g,' ').trim().replace(/=$/,'').split(/\sRMK\s/)[0],tokens=text.split(' ');
 while(/^(TAF|AMD|COR)$/.test(tokens[0]||''))tokens.shift();
 const code=tokens.shift();if(!/^[A-Z][A-Z0-9]{3}$/.test(code||''))return[];
 if(/^\d{6}Z$/.test(tokens[0]||''))tokens.shift();
 const validity=tokens.shift();if(!/^\d{4}\/\d{4}$/.test(validity||''))return[];
 const extremes=tokens.map(token=>{const m=token.match(/^T([XN])(M?\d{2})\/(\d{2})(\d{2})Z$/);return m?{token,kind:m[1]==='X'?'max':'min',value:wxdTemp(m[2]),day:m[3],hour:m[4]}:null}).filter(Boolean);
 const offset=text.split(' ').length-tokens.length;
 const blocks=[{kind:'base',period:validity,tokens:[],indices:[]}];
 for(let i=0;i<tokens.length;i++){
  const token=tokens[i];if(/^(BECMG|TEMPO|PROB\d{2}|FM\d{6})$/.test(token)){
   let kind=token;if(/^PROB/.test(kind)&&tokens[i+1]==='TEMPO')kind+=' '+tokens[++i];
   const period=/^FM/.test(kind)?kind.slice(2):/^\d{4}\/\d{4}$/.test(tokens[i+1]||'')?tokens[++i]:'';
   blocks.push({kind,period,tokens:[],indices:[]});
  }else{blocks.at(-1).tokens.push(token);blocks.at(-1).indices.push(offset+i)}
 }
 const common=['wind','visibility','weather','cloud'];let prevailing={},prevailingSources={};const result=[];
 const time=p=>`${p.slice(0,2)} · ${p.slice(2,4)}${p.length===6?':'+p.slice(4):''}Z`;
 for(const block of blocks){
  const parsed=metarVisualData(`METAR ${code} 010000Z ${block.tokens.join(' ')}`),changes=Object.fromEntries(parsed.items.filter(item=>common.includes(item.key)&&item.tokens.length).map(item=>[item.key,[...item.tokens]]));
  if(block.tokens.includes('CAVOK')){changes.weather=['NSW'];changes.cloud=['NSC']}
  const state=/^FM/.test(block.kind)?{}:{...prevailing};Object.assign(state,changes);
  const sources=/^FM/.test(block.kind)?{}:{...prevailingSources};
  for(const key of Object.keys(changes))sources[key]=block.indices.filter((idx,i)=>changes[key].includes(block.tokens[i])||(block.tokens[i]==='CAVOK'&&['weather','cloud'].includes(key)));
  if(block.kind==='base'||block.kind==='BECMG'||/^FM/.test(block.kind))prevailingSources=sources;
  if(block.kind==='base'||block.kind==='BECMG'||/^FM/.test(block.kind))prevailing=state;
  const observation=metarVisualData(`METAR ${code} 010000Z ${common.flatMap(key=>state[key]||[]).join(' ')}`);
  const span=block.period.split('/'),a=time(span[0]||''),b=span[1]?time(span[1]):'';
  let title=block.kind==='base'?`${wxdT('base')} · ${a}`:/^FM/.test(block.kind)?`FM · ${a}`:`${block.kind} · ${a}${b?' → '+b:''}`;
  const items=observation.items.filter(item=>common.includes(item.key));
  if(block.kind==='base'&&extremes.length)items.push({key:'temperature',label:t('taf_temperatures'),tokens:extremes.map(x=>x.token),extremes,value:extremes.map(x=>`${t('taf_'+x.kind)} ${x.value} °C · ${x.day}/${x.hour}Z`).join('; ')});
  for(const item of items)item.sourceIndices=item.key==='temperature'?text.split(' ').flatMap((token,i)=>extremes.some(x=>x.token===token)?[i]:[]):sources[item.key]||[];
  result.push({...observation,code,kind:block.kind,period:block.period,title,raw:[block.kind==='base'?'':block.kind,block.kind==='base'?'':block.period,block.tokens.join(' ')].filter(Boolean).join(' '),items});
 }
 return result;
}
function tafVisualCards(group,coded=false){
 const runway=metarVisualRunway(group.code);
 return `<div class="mv-grid tv-grid${group.items.some(item=>item.key==='temperature')?' tv-has-temperature':''}">${group.items.filter(item=>item.key!=='weather'||item.tokens.some(token=>token!=='NSW')).map(item=>`<button type="button" class="mv-item mv-${item.key}${item.tokens.length?'':' mv-missing'}" data-action="taf-visual-item" data-metar-key="${item.key}" aria-pressed="false" ${item.tokens.length?'':'disabled'}><span class="mv-art" aria-hidden="true">${metarVisualArt(item,group.windDirection,group.windVariation,runway)}</span><span class="mv-caption">${esc(item.label)}</span><strong${item.extremes?' class="tv-temperatures"':''}>${coded?esc(item.tokens.join(' ')):item.extremes?item.extremes.map(x=>`<span class="tv-temp-${x.kind}">${x.kind==='max'?'↑':'↓'} ${esc(t('taf_'+x.kind))} ${esc(x.value)} °C · ${x.day}/${x.hour}Z</span>`).join(''):esc(item.value)}</strong>${coded?'':metarVisualUnitHint(item)}</button>`).join('')}</div>`;
}
function tafVisualPeriodHTML(group){
 const [start='',end='']=group.period.split('/'),clock=v=>v.slice(2,4)+(v.length===6?':'+v.slice(4):'')+'Z';
 const days=end?Number(end.slice(0,2))-Number(start.slice(0,2)):0;
 const hours=end?(days<0?24:days*24)+Number(end.slice(2,4))-Number(start.slice(2,4)):null;
 return `<span class="tv-period-kind">${esc(group.kind==='base'?wxdT('base'):group.kind.startsWith('FM')?'FM':group.kind)}</span><strong class="tv-period-range">${esc(clock(start))}${end?` <i aria-hidden="true">→</i> ${esc(clock(end))}`:''}</strong><small class="tv-period-meta">${esc(start.slice(0,2))}${end&&start.slice(0,2)!==end.slice(0,2)?' → '+esc(end.slice(0,2)):''}${hours!=null?' · '+hours+' h':''}</small>`;
}
function tafVisualHTML(raw,coded=false){
 const groups=tafVisualGroups(raw);if(!groups.length)return'';
 const key=String(raw),index=Math.min(TAF_VISUAL_SELECTION.get(key)||0,groups.length-1),group=groups[index];
 return `<div class="taf-visual" data-coded="${coded}" data-taf-source="${esc(key)}"><nav class="tv-periods" aria-label="TAF">${groups.map((g,i)=>`<button type="button" class="btn" data-action="taf-visual-period" data-index="${i}" aria-pressed="${i===index}">${tafVisualPeriodHTML(g)}</button>`).join('')}</nav><select class="tv-period-select" aria-label="TAF">${groups.map((g,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(g.title)}</option>`).join('')}</select><div class="tv-cards">${tafVisualCards(group,coded)}</div><div class="tv-note" role="status">${esc(tafVisualNote(group))}</div></div>`;
}
function tafVisualNote(group){return group.kind==='BECMG'?t('taf_visual_becoming'):/TEMPO|PROB/.test(group.kind)?t('taf_visual_temporary'):''}
function tafVisualRawHTML(raw){let index=0;return String(raw||'').replace(/\s+(?=(FM\d{6}|BECMG|TEMPO|PROB\d{2}))/g,'\n  ').replace(/\S+/g,token=>`<span data-taf-token="${index++}">${esc(token)}</span>`)}
function tafVisualHighlight(widget,key){
 const index=Number(widget.querySelector('[data-action="taf-visual-period"][aria-pressed="true"]')?.dataset.index||0),group=tafVisualGroups(widget.dataset.tafSource)[index],indices=group?.items.find(item=>item.key===key)?.sourceIndices||[];
 widget.closest('[data-weather-report="TAF"]')?.querySelectorAll('[data-taf-token]').forEach(token=>token.classList.toggle('mv-highlight',indices.includes(Number(token.dataset.tafToken))));
}
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-action^="taf-visual-"]');if(!button||button.disabled)return;
 const widget=button.closest('.taf-visual');if(!widget)return;
 if(button.dataset.action==='taf-visual-period'){
  const groups=tafVisualGroups(widget.dataset.tafSource),index=Number(button.dataset.index),group=groups[index];if(!group)return;
  TAF_VISUAL_SELECTION.set(widget.dataset.tafSource,index);if(TAF_VISUAL_SELECTION.size>50)TAF_VISUAL_SELECTION.delete(TAF_VISUAL_SELECTION.keys().next().value);
  widget.querySelectorAll('[data-action="taf-visual-period"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const select=widget.querySelector('.tv-period-select');if(select)select.value=String(index);
  widget.querySelector('.tv-cards').innerHTML=tafVisualCards(group,widget.dataset.coded==='true');widget.querySelector('.tv-note').textContent=tafVisualNote(group);
  const selected=widget.dataset.selectedKey;if(selected&&group.items.some(item=>item.key===selected)){widget.querySelectorAll('.mv-item').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.metarKey===selected)));tafVisualHighlight(widget,selected)}else{delete widget.dataset.selectedKey;tafVisualHighlight(widget,'')}
 }else{widget.dataset.selectedKey=button.dataset.metarKey;widget.querySelectorAll('.mv-item').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));tafVisualHighlight(widget,button.dataset.metarKey);if(!metarVisualToggleUnits(button))metarVisualAnimate(button)}
});

document.addEventListener('change',event=>{
 const select=event.target.closest?.('.tv-period-select');if(!select)return;
 select.closest('.taf-visual')?.querySelector(`[data-action="taf-visual-period"][data-index="${Number(select.value)}"]`)?.click();
});
