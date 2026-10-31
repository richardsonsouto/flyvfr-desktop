/* Interactive METAR summary. Only the observation is used, never RMK or trends. */
function metarVisualData(raw){
 const tokens=String(raw||'').match(/\S+/g)||[],groups={wind:[],visibility:[],weather:[],cloud:[],temperature:[],pressure:[]};
 let start=0;while(/^(METAR|SPECI)$/.test(tokens[start]||''))start++;
 if(/^[A-Z][A-Z0-9]{3}$/.test(tokens[start]||''))start++;
 const observationIndex=start;if(/^\d{6}Z$/.test(tokens[start]||''))start++;
 const mapping={};if(start>observationIndex)mapping[observationIndex]='time';let windDirection=null,windVariation=null;
 const add=(key,i)=>{groups[key].push(tokens[i]);mapping[i]=key};
 for(let i=start;i<tokens.length;i++){
  const token=tokens[i];if(/^(RMK|NOSIG|BECMG|TEMPO)$/.test(token))break;
  if(wxdWind(token)){add('wind',i);const m=token.match(/^(\d{3})(\d{2,3})/);if(m&&+m[2]>0)windDirection=+m[1];continue}
  if(/^\d{3}V\d{3}$/.test(token)){add('wind',i);const [from,to]=token.split('V').map(Number);if(from<=360&&to<=360)windVariation={from:from%360,sweep:(to-from+360)%360};continue}
  if(/^\d$/.test(token)&&/^\d\/\dSM$/.test(tokens[i+1]||'')){add('visibility',i);add('visibility',++i);continue}
  if(token==='CAVOK'||wxdVis(token)){add('visibility',i);continue}
  if(wxdCloud(token)){add('cloud',i);continue}
  const weather=wxdWeather(token);if(weather&&!weather.recent||token==='NSW'){add('weather',i);continue}
  if(/^(M?\d{2})\/(M?\d{2})?$/.test(token)){add('temperature',i);continue}
  if(/^[QA]\d{4}$/.test(token)){add('pressure',i);continue}
 }
 const decoded=decodeMetar(raw),labels={wind:wxdT('wind'),visibility:wxdT('vis'),weather:wxdT('wx'),cloud:wxdT('clouds'),temperature:wxdT('temp'),pressure:wxdT('qnh')};
 const items=Object.keys(groups).map(key=>({key,label:labels[key],tokens:groups[key],value:decoded?.rows.find(r=>r[0]===labels[key])?.[1]||t('metar_not_reported')}));
 return{tokens,mapping,windDirection,windVariation,items};
}
function metarVisualRawHTML(raw){const parsed=metarVisualData(raw);let i=0;return String(raw||'').replace(/\S+/g,token=>{const key=parsed.mapping[i++];return key?`<span data-metar-token="${key}">${esc(token)}</span>`:esc(token)})}
function metarVisualRunway(code){
 const r=typeof MAP_TOOLS!=='undefined'?MAP_TOOLS.runways?.runways?.[code]:null;
 const ends=String(r?.ident||'').toUpperCase().split('/');
 if(ends.length!==2||!ends.every(x=>/^(0[1-9]|[12]\d|3[0-6])[LRC]?$/.test(x)))return null;
 return{ends,heading:Number(ends[0].slice(0,2))*10};
}
function metarVisualFavored(runway,direction,variation=null){
 if(!runway||direction==null)return -1;
 const side=angle=>{const value=Math.cos((angle-runway.heading)*Math.PI/180);return Math.abs(value)<.05?-1:value>0?0:1};
 const preferred=side(direction);if(preferred<0)return -1;
 // The reported main direction selects the threshold; variation stays in the wind value.
 return preferred;
}
function metarVisualArt(item,direction,variation=null,runway=null){
 const icon=paths=>_ic(paths);
 if(item.key==='wind'&&runway){
  const favored=metarVisualFavored(runway,direction,variation);
  const r=`<span class="mv-runway" style="transform:rotate(${runway.heading}deg)"><span class="mv-rwy-end mv-rwy-high${favored===1?' mv-rwy-favored':''}">${esc(runway.ends[1])}</span><span class="mv-rwy-end mv-rwy-low${favored===0?' mv-rwy-favored':''}">${esc(runway.ends[0])}</span></span>`;
  return `<span class="mv-compass mv-with-runway"><span class="mv-n">N</span><span class="mv-s">S</span><span class="mv-e">E</span><span class="mv-w">W</span>${r}${direction!=null?`<span class="mv-wind-flow" style="transform:rotate(${direction}deg)"><b class="mv-flow-arrow"></b></span>`:''}</span>`;
 }
 if(item.key==='wind')return direction!=null?`<span class="mv-compass">${variation?.sweep?`<span class="mv-variation" style="--mv-range-start:${variation.from}deg;--mv-range-sweep:${variation.sweep}deg"></span>`:''}<span class="mv-n">N</span><span class="mv-s">S</span><span class="mv-e">E</span><span class="mv-w">W</span><b class="mv-needle" style="transform:rotate(${direction}deg)"></b><span class="mv-compass-hub"></span></span>`:icon('<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h5a2 2 0 1 1-2 2"/>');
 if(item.key==='visibility')return icon('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>');
 if(item.key==='cloud'){
  const layers=(item.tokens||[]).map(token=>token.match(/^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU)?$/)).filter(Boolean).sort((a,b)=>(b[2]==='///'?-1:Number(b[2]))-(a[2]==='///'?-1:Number(a[2])));
  if(layers.length)return `<span class="mv-cloud-floors">${layers.map(layer=>`<span class="mv-cloud-floor" data-cover="${layer[1]}"><span class="mv-floor-puff"></span><span class="mv-floor-alt">${layer[2]==='///'?'?':esc(new Intl.NumberFormat(lang).format(Number(layer[2])*100))} ft</span></span>`).join('')}</span>`;
  const vv=(item.tokens||[]).find(token=>/^VV/.test(token));return vv?`<span class="mv-cloud-vertical mono">${esc(wxdCloud(vv))}</span>`:icon('<path d="M3 12h4m3 0h4m3 0h4"/>');
 }
 if(item.key==='weather'){
  if(item.tokens.some(x=>/RA|DZ/.test(x)))return `<span class="mv-cloud-shape"></span><span class="mv-drops"></span>`;
  if(item.tokens.some(x=>/TS/.test(x)))return icon('<path d="M5 16a5 5 0 0 1 1-10 6 6 0 0 1 11 1 4 4 0 1 1 1 8M13 10l-4 7h5l-3 5"/>');
  if(item.tokens.some(x=>/SN|SG|IC/.test(x)))return icon('<path d="M12 2v20M3 7l18 10M3 17 21 7M8 4l4 4 4-4M8 20l4-4 4 4"/>');
  return icon('<path d="M3 8h18M5 12h14M3 16h18"/>');
 }
 if(item.key==='temperature'){
  const token=(item.tokens||[]).find(x=>/^(M?\d{2})\//.test(x)),value=item.extremes?.find(x=>x.kind==='max')?.value??item.extremes?.[0]?.value??(token?wxdTemp(token.split('/')[0]):null);
  const low=Math.min(-20,Math.floor((value??0)/10)*10-10),high=Math.max(50,Math.ceil((value??0)/10)*10+10),level=value==null?0:(value-low)/(high-low);
  return `<span class="mv-temp-scale"><span class="mv-temp-tick mv-temp-high">${high}°</span><span class="mv-temp-tick mv-temp-low">${low}°</span><span class="mv-temp-track"><span class="mv-temp-fill" data-level="${level}" style="transform:scaleY(${level})"></span></span><span class="mv-temp-graduations"></span><span class="mv-temp-value" style="bottom:clamp(0px,${level*48-6}px,36px)">${value==null?'—':esc(value)+'°'}</span></span>`;
 }
 if(item.key==='pressure'){
  const token=(item.tokens||[]).find(x=>/^[QA]\d{4}$/.test(x)),value=token?(token[0]==='Q'?token.slice(1):(Number(token.slice(1))/100).toFixed(2)):'—',unit=token?(token[0]==='Q'?'hPa':'inHg'):'';
  return `<span class="mv-altimeter"><span class="mv-alt-label">QNH</span><span class="mv-alt-window">${esc(value)}</span><span class="mv-alt-unit">${unit}</span><span class="mv-alt-knob"></span></span>`;
 }
 return icon('<path d="M3 18a10 10 0 1 1 18 0M12 12l5-5M6 9l1 1M12 4v2M18 9l-1 1"/><circle cx="12" cy="12" r="2"/>');
}
function metarVisualHTML(raw,coded=false){
 if(!raw)return'';const data=metarVisualData(raw);
 const timeData=metarVisualTimeData(raw),timeCard=timeData&&!coded?metarVisualTimeHTML(timeData):'';
 const code=String(raw).match(/^(?:(?:METAR|SPECI)\s+)?([A-Z][A-Z0-9]{3})\s/)?.[1]||'',runway=metarVisualRunway(code);
 if(!runway&&typeof mapLoadRunways==='function')mapLoadRunways().then(()=>{document.querySelectorAll('.metar-visual[data-metar-airport]').forEach(widget=>{const r=metarVisualRunway(widget.dataset.metarAirport),art=widget.querySelector('.mv-wind .mv-art'),variation=widget.dataset.windVariation?JSON.parse(widget.dataset.windVariation):null;if(r&&art&&!art.querySelector('.mv-with-runway')){art.innerHTML=metarVisualArt({key:'wind'},widget.dataset.windDirection===''?null:Number(widget.dataset.windDirection),variation,r);const button=art.closest('.mv-wind');if(button?.dataset.windWasAnimated==='true'&&button.getClientRects().length)metarVisualAnimate(button)}})});
 return `<div class="metar-visual" data-metar-airport="${esc(code)}" data-wind-direction="${data.windDirection??''}" data-wind-variation="${esc(JSON.stringify(data.windVariation))}"><div class="mv-grid${timeCard?' mv-has-time':''}" style="--mv-count:${data.items.filter(item=>item.key!=='weather'||item.tokens.some(token=>token!=='NSW')).length+(timeCard?1:0)}" role="group" aria-label="METAR">${timeCard}${data.items.filter(item=>item.key!=='weather'||item.tokens.some(token=>token!=='NSW')).map(item=>`<button type="button" class="mv-item mv-${item.key}${item.tokens.length?'':' mv-missing'}" data-action="metar-visual-item" data-metar-key="${item.key}" aria-pressed="false" ${item.tokens.length?'':'disabled'}><span class="mv-art" aria-hidden="true">${metarVisualArt(item,data.windDirection,data.windVariation,runway)}</span><span class="mv-caption">${esc(item.label)}</span><strong>${esc(coded?item.tokens.join(' '):item.value)}</strong>${coded?'':metarVisualUnitHint(item)}</button>`).join('')}</div></div>`;
}
const METAR_PRESSURE_FRAMES=new WeakMap();
const METAR_UNIT_ORIGINAL=new WeakMap();
function metarVisualUnitHint(item){return ['temperature','pressure'].includes(item.key)&&item.tokens.length?`<small class="mv-unit-hint">${esc(t('wx_touch_unit',{unit:item.key==='temperature'?'°F':item.tokens.some(x=>/^A\d{4}$/.test(x))?'hPa':'inHg'}))} ↻</small>`:''}
function metarVisualToggleUnits(button){
  const kind=button.dataset.metarKey;if(!['temperature','pressure'].includes(kind))return false;
  if(button.dataset.unitBusy==='true')return true;
  if(!METAR_UNIT_ORIGINAL.has(button))METAR_UNIT_ORIGINAL.set(button,button.innerHTML);
  cancelAnimationFrame(METAR_PRESSURE_FRAMES.get(button));button.getAnimations({subtree:true}).forEach(a=>a.cancel());
  const alternate=button.dataset.unitAlternate!=='true',holder=document.createElement('div');holder.innerHTML=METAR_UNIT_ORIGINAL.get(button);
  const strong=holder.querySelector('strong');
  if(kind==='temperature'&&alternate){
   const coded=strong.textContent.trim().match(/^(M?\d{2})\/(M?\d{2})?$/);
   if(coded){strong.textContent=coded.slice(1).filter(Boolean).map(v=>((Number(v.replace('M','-'))*9/5)+32).toFixed(1)).join(' / ')+' °F'}
   else strong.innerHTML=strong.innerHTML.replace(/T([XN])(M?\d{2})\/(\d{4}Z)/g,(_,kind,v,time)=>'T'+kind+(Number(v.replace('M','-'))*9/5+32).toFixed(1)+' °F / '+time).replace(/(-?\d+(?:[.,]\d+)?) °C/g,(_,v)=>(Number(v.replace(',','.'))*9/5+32).toFixed(1)+' °F');
   holder.querySelectorAll('.mv-temp-tick,.mv-temp-value').forEach(el=>{const n=Number(el.textContent.replace('°','').replace('−','-'));if(Number.isFinite(n))el.textContent=(n*9/5+32).toFixed(el.classList.contains('mv-temp-value')?1:0)+'°'});
  }
  if(kind==='pressure'&&alternate){const display=holder.querySelector('.mv-alt-window'),unit=holder.querySelector('.mv-alt-unit'),isHg=unit.textContent==='inHg',v=Number(display.dataset.pressureTarget??display.textContent),converted=isHg?v*33.8638866667:v/33.8638866667;unit.textContent=isHg?'hPa':'inHg';display.textContent=isHg?Math.round(converted):converted.toFixed(2);delete display.dataset.pressureTarget;strong.textContent=display.textContent+' '+unit.textContent;}
  const swap=()=>{button.innerHTML=holder.innerHTML;button.dataset.unitAlternate=String(alternate)};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){swap();return true}
  button.dataset.unitBusy='true';
  (async()=>{let animation;try{
   animation=button.animate([{transform:'perspective(900px) rotateY(0deg)'},{transform:'perspective(900px) rotateY(90deg)'}],{duration:650,easing:'ease-in',fill:'forwards'});
   await animation.finished;if(!button.isConnected)return;swap();animation.cancel();
   animation=button.animate([{transform:'perspective(900px) rotateY(-90deg)'},{transform:'perspective(900px) rotateY(0deg)'}],{duration:650,easing:'ease-out'});await animation.finished;
  }catch(error){if(button.isConnected)swap()}finally{animation?.cancel();delete button.dataset.unitBusy}})();return true;
 }
function metarVisualAnimatePressure(button){
 const display=button.querySelector('.mv-alt-window'),knob=button.querySelector('.mv-alt-knob');if(!display)return;
 cancelAnimationFrame(METAR_PRESSURE_FRAMES.get(button));
 const final=display.dataset.pressureTarget??display.textContent;display.dataset.pressureTarget=final;
 const target=Number(final),inHg=button.querySelector('.mv-alt-unit')?.textContent==='inHg';
 knob?.getAnimations().forEach(animation=>animation.cancel());
 if(!Number.isFinite(target)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){display.textContent=final;return}
 const baseline=inHg?29.92:1013,duration=4000,start=performance.now(),format=value=>inHg?value.toFixed(2):String(Math.round(value));
 display.textContent=format(baseline);
 knob?.animate([{transform:'rotate(0deg)'},{transform:`rotate(${target<baseline?-100:100}deg)`}],{duration,easing:'ease-out',iterations:1});
 function tick(now){if(!button.isConnected){display.textContent=final;METAR_PRESSURE_FRAMES.delete(button);return}const progress=Math.min(1,(now-start)/duration);display.textContent=progress===1?final:format(baseline+(target-baseline)*(1-(1-progress)**2));if(progress<1)METAR_PRESSURE_FRAMES.set(button,requestAnimationFrame(tick));else METAR_PRESSURE_FRAMES.delete(button)}
 METAR_PRESSURE_FRAMES.set(button,requestAnimationFrame(tick));
}
function metarVisualAnimate(button){
 if(button.dataset.metarKey==='time'){metarVisualAnimateTime(button);return}
 if(button.dataset.metarKey==='pressure'){metarVisualAnimatePressure(button);return}
 if(button.dataset.metarKey==='temperature'){
  const column=button.querySelector('.mv-temp-fill');if(!column)return;
  column.getAnimations().forEach(animation=>animation.cancel());
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  column.animate([{transform:'scaleY(0)'},{transform:`scaleY(${column.dataset.level})`}],{duration:4000,easing:'ease-in-out',fill:'forwards',iterations:1});return;
 }
 if(button.dataset.metarKey==='cloud'&&button.querySelector('.mv-cloud-floors')){
  const layers=button.querySelectorAll('.mv-floor-puff');layers.forEach(layer=>layer.getAnimations().forEach(animation=>animation.cancel()));
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  layers.forEach((layer,i)=>layer.animate([{transform:'translateX(0)'},{transform:'translateX(4px)',offset:.5},{transform:'translateX(0)'}],{duration:1100,delay:i*120,easing:'ease-in-out',iterations:1}));return;
 }
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const art=button.querySelector('.mv-art');if(!art)return;
 art.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
 const kind=button.dataset.metarKey;if(kind==='wind')button.dataset.windWasAnimated='true';let target,frames;
 if(kind==='wind'&&art.querySelector('.mv-flow-arrow')){
  target=art.querySelector('.mv-flow-arrow');frames=[{transform:'translateY(-3px)',opacity:.35},{transform:'translateY(0)',opacity:1,offset:.5},{transform:'translateY(3px)',opacity:.4,offset:.85},{transform:'translateY(0)',opacity:1}];
 }else if(kind==='wind'&&art.querySelector('.mv-needle')){
  target=art.querySelector('.mv-needle');const direction=parseFloat(target.style.transform.match(/rotate\(([-\d.]+)/)?.[1]);if(!Number.isFinite(direction))return;
  frames=[{transform:`rotate(${direction-35}deg)`},{transform:`rotate(${direction+6}deg)`,offset:.75},{transform:`rotate(${direction}deg)`}];
 }else if(kind==='weather'&&art.querySelector('.mv-drops')){
  target=art.querySelector('.mv-drops');frames=[{transform:'translateY(-6px) rotate(20deg)',opacity:0},{transform:'translateY(0) rotate(20deg)',opacity:1,offset:.45},{transform:'translateY(6px) rotate(20deg)',opacity:0,offset:.8},{transform:'translateY(0) rotate(20deg)',opacity:1}];
 }else if(kind==='pressure'&&art.querySelector('.mv-alt-knob')){
  target=art.querySelector('.mv-alt-knob');frames=[{transform:'rotate(0)'},{transform:'rotate(45deg)',offset:.5},{transform:'rotate(0)'}];
 }else if(kind==='cloud'){
  target=art.querySelector('.mv-cloud-shape');frames=[{transform:'translateX(0)'},{transform:'translateX(7px)',offset:.5},{transform:'translateX(0)'}];
 }else{
  target=art.querySelector('svg');frames=kind==='visibility'?[{transform:'scaleY(1)'},{transform:'scaleY(.12)',offset:.4},{transform:'scaleY(1)'}]:kind==='temperature'?[{transform:'translateY(0)'},{transform:'translateY(-5px)',offset:.5},{transform:'translateY(0)'}]:[{transform:'rotate(0)'},{transform:'rotate(-12deg)',offset:.35},{transform:'rotate(8deg)',offset:.7},{transform:'rotate(0)'}];
 }
 if(target?.animate)target.animate(frames,{duration:kind==='wind'?850:650,easing:'ease-in-out',iterations:1});
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action="metar-visual-item"]');if(!button||button.disabled)return;
 const widget=button.closest('.metar-visual'),report=widget.closest('[data-weather-report="METAR"]');if(!report)return;
 widget.querySelectorAll('.mv-item').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 report.querySelectorAll('[data-metar-token]').forEach(token=>token.classList.toggle('mv-highlight',token.dataset.metarToken===button.dataset.metarKey));
 if(!metarVisualToggleUnits(button))metarVisualAnimate(button);
});
let metarVisualWindRequested=false;
function metarVisualRequestWind(){metarVisualWindRequested=true;requestAnimationFrame(metarVisualShowWind)}
function metarVisualShowWind(){
 if(!metarVisualWindRequested)return;
 const button=[...document.querySelectorAll('[data-brf-section="wx"] .metar-visual .mv-wind')].find(b=>b.getClientRects().length&&!b.disabled);
 if(!button)return;metarVisualWindRequested=false;metarVisualAnimate(button);
}
const metarVisualView=document.getElementById('view');
if(metarVisualView)new MutationObserver(()=>{if(metarVisualWindRequested)requestAnimationFrame(metarVisualShowWind)}).observe(metarVisualView,{childList:true,subtree:true});
/* The hourly reference is not a forecast validity limit. SPECI may supersede it. */
const METAR_TIME_FRAMES=new WeakMap();
function metarVisualTimeData(raw,now=Date.now()){const m=String(raw||'').match(/^(?:(METAR|SPECI)\s+)?(?:COR\s+)?([A-Z][A-Z0-9]{3})\s+(?:COR\s+)?(\d{2})(\d{2})(\d{2})Z\b/);if(!m||+m[3]<1||+m[3]>31||+m[4]>23||+m[5]>59)return null;const ref=new Date(now),dates=[-1,0,1].map(offset=>new Date(Date.UTC(ref.getUTCFullYear(),ref.getUTCMonth()+offset,+m[3],+m[4],+m[5]))).filter(d=>d.getUTCDate()===+m[3]),known=typeof BRF!=='undefined'?Date.parse(BRF.wx?.[m[2]]?.data?.metarTime||''):NaN;let observed=dates.sort((a,b)=>Math.abs(a-now)-Math.abs(b-now))[0]?.getTime();if(Number.isFinite(known)){const d=new Date(known);if(d.getUTCDate()===+m[3]&&d.getUTCHours()===+m[4]&&d.getUTCMinutes()===+m[5])observed=known}if(!Number.isFinite(observed))return null;return {observed,next:observed+3600000,hourly:m[1]!=='SPECI'&&+m[5]===0}}
function metarTimeUTC(ms){const d=new Date(ms);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')+'Z'}
function metarVisualTimeHTML(d){const hour=new Date(d.observed).getUTCHours()%12*30+new Date(d.observed).getUTCMinutes()*.5,minute=new Date(d.observed).getUTCMinutes()*6,local=typeof tf!=='undefined'?tf.format(d.observed):new Intl.DateTimeFormat(lang,{hour:'2-digit',minute:'2-digit',hour12:false}).format(d.observed),range=metarTimeUTC(d.observed)+' → '+metarTimeUTC(d.next),reference=t(d.hourly?'wx_time_next':'wx_time_reference');return `<button type="button" class="mv-item mv-time" data-action="metar-visual-item" data-metar-key="time" data-observed="${d.observed}" aria-pressed="false" aria-label="${esc(t('wx_time')+' · '+metarTimeUTC(d.observed)+' · '+reference+' '+metarTimeUTC(d.next)+' · '+t('wx_time_play'))}"><span class="mv-art" aria-hidden="true"><span class="mv-time-ring" style="--mv-time-progress:0deg;--mv-time-hour:${hour}deg;--mv-time-minute:${minute}deg"><span class="mv-time-face"><i class="mv-time-hour"></i><i class="mv-time-minute"></i><i class="mv-time-pin"></i></span></span></span><span class="mv-caption">${esc(t('wx_time'))}</span><strong class="mv-time-value"><b class="mv-time-digital">${metarTimeUTC(d.observed)}</b><small>${range}</small><small class="mv-time-note">${esc(local+' '+t('t_local'))}</small></strong></button>`}
function metarVisualAnimateTime(button){cancelAnimationFrame(METAR_TIME_FRAMES.get(button));const observed=Number(button.dataset.observed);if(!Number.isFinite(observed))return;const ring=button.querySelector('.mv-time-ring'),digital=button.querySelector('.mv-time-digital'),caption=button.querySelector('.mv-caption'),note=button.querySelector('.mv-time-note');if(!ring||!digital||!caption||!note)return;caption.textContent=t('wx_time');button.classList.remove('mv-time-update');function paint(p){const current=observed+p*3600000,date=new Date(current),hours=(date.getUTCHours()%12)*30+date.getUTCMinutes()*.5+date.getUTCSeconds()/120,minutes=date.getUTCMinutes()*6+date.getUTCSeconds()*.1;ring.style.setProperty('--mv-time-progress',p*360+'deg');ring.style.setProperty('--mv-time-hour',hours+'deg');ring.style.setProperty('--mv-time-minute',minutes+'deg');digital.textContent=metarTimeUTC(current);if(p>=1){button.classList.add('mv-time-update');note.textContent=t('wx_time_update')}else note.textContent=t('wx_time_elapsed',{n:Math.floor(p*60)})}if(matchMedia('(prefers-reduced-motion: reduce)').matches){paint(1);return}const start=performance.now();paint(0);function tick(now){if(!button.isConnected)return;const p=Math.min(1,(now-start)/4000);paint(p);if(p<1)METAR_TIME_FRAMES.set(button,requestAnimationFrame(tick))}METAR_TIME_FRAMES.set(button,requestAnimationFrame(tick))}

