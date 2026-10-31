/* RainViewer public radar: optional, informational and never for real navigation.
   API terms/documentation checked 2026-10-23: rainviewer.com/api.html. */
const RADAR_WORDS={
 title:['Weather radar','Radar meteorológico','Radar meteorológico','Radar météo','Wetterradar','気象レーダー','天气雷达','기상 레이더'],
 opacity:['Opacity','Opacidade','Opacidad','Opacité','Deckkraft','不透明度','不透明度','불투명도'],
 loading:['Loading radar…','Carregando radar…','Cargando radar…','Chargement du radar…','Radar wird geladen…','レーダー読込中…','正在加载雷达…','레이더 로딩 중…'],
 error:['Radar unavailable. Do not interpret blank areas as no rain.','Radar indisponível. Áreas vazias não significam ausência de chuva.','Radar no disponible. Las áreas vacías no indican ausencia de lluvia.','Radar indisponible. Une zone vide ne signifie pas une absence de pluie.','Radar nicht verfügbar. Leere Flächen bedeuten nicht, dass es nicht regnet.','レーダー利用不可。空白は雨がないことを意味しません。','雷达不可用。空白区域不代表无雨。','레이더 사용 불가. 빈 영역이 비가 없음을 뜻하지 않습니다.'],
 stale:['Outdated radar — hidden','Radar desatualizado — ocultado','Radar desactualizado — oculto','Radar périmé — masqué','Veraltetes Radar — ausgeblendet','古いレーダー画像：非表示','雷达已过期，已隐藏','오래된 레이더 — 숨김'],
 frame:['Composite generated at','Composição gerada em','Composición generada a las','Mosaïque générée à','Mosaik erstellt um','合成画像生成時刻','合成图生成时间','합성 영상 생성 시각'],
 note:['Limited coverage; shaded areas may lack radar. Blank areas do not guarantee no rain. Composite time is not each radar observation time. Simulation only.','Cobertura limitada; áreas sombreadas podem não ter radar. Sem eco não garante ausência de chuva. O horário da composição não é o de cada observação. Apenas simulação.','Cobertura limitada; las zonas sombreadas pueden carecer de radar. Sin eco no garantiza ausencia de lluvia. La hora del mosaico no es la de cada observación. Solo simulación.','Couverture limitée ; les zones ombrées peuvent manquer de radar. Sans écho ne signifie pas sans pluie. L’heure du mosaïque diffère des observations. Simulation uniquement.','Begrenzte Abdeckung; schattierte Bereiche eventuell ohne Radar. Kein Echo garantiert keine Regenfreiheit. Mosaikzeit ist nicht jede Beobachtungszeit. Nur Simulation.','観測範囲は限定的です。影の領域はレーダー範囲外の場合があります。エコーがなくても降雨なしとは限りません。合成時刻は各観測時刻とは異なります。シミュレーション専用。','覆盖有限，阴影区域可能无雷达。无回波不保证无雨。合成时间并非各次观测时间。仅供模拟。','관측 범위가 제한됩니다. 음영 영역은 관측 범위 밖일 수 있습니다. 에코가 없어도 비가 없다는 보장은 없습니다. 합성 시각은 개별 관측 시각과 다릅니다. 시뮬레이션 전용.']
};
function radarT(k){return RADAR_WORDS[k][LANGS.indexOf(lang)]||RADAR_WORDS[k][0]}
function radarFrame(json,now=Date.now()){
 const host=new URL(json.host);if(host.protocol!=='https:'||host.hostname!=='tilecache.rainviewer.com'||host.port)throw Error('radar host');
 const frames=(json.radar?.past||[]).filter(f=>Number.isFinite(f.time)&&f.time*1000<=now+60000&&/^\/v2\/radar\/[a-zA-Z0-9_-]+$/.test(f.path)).sort((a,b)=>b.time-a.time);
 if(!frames.length)throw Error('radar frames');return{host:host.origin,...frames[0],stale:now-frames[0].time*1000>20*60000};
}
function mapRadarInit(m,Lf){
 const group=Lf.layerGroup([],{key:'WEATHER_RADAR'});let active=false,disposed=false,busy=false,timer,frame,tile,mask,at=0,opacity=.65,status='loading';
 const panel=Lf.control({position:'bottomleft'});
 panel.onAdd=()=>{const el=Lf.DomUtil.create('div','map-radar-control');Lf.DomEvent.disableClickPropagation(el);Lf.DomEvent.disableScrollPropagation(el);return el};panel.addTo(m);
 const el=panel.getContainer();
 const paint=()=>{el.hidden=!active;el.innerHTML=`<b>${esc(radarT('title'))}</b><p role="status">${esc(status==='frame'?radarT('frame')+' '+new Date(frame.time*1000).toISOString().slice(11,16)+' UTC':radarT(status))}</p><label>${esc(radarT('opacity'))} <output>${Math.round(opacity*100)}%</output><input type="range" min="10" max="100" value="${Math.round(opacity*100)}" aria-label="${esc(radarT('opacity'))}"></label><small>${esc(radarT('note'))}</small><a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>`};
 el.addEventListener('input',e=>{if(e.target.type!=='range')return;opacity=Number(e.target.value)/100;tile?.setOpacity(opacity);el.querySelector('output').textContent=Math.round(opacity*100)+'%'});
 const clear=()=>{group.clearLayers();tile=null;mask=null};
 const refresh=async()=>{
  if(disposed||!active||busy)return;
  if(frame&&Date.now()-frame.time*1000>20*60000){clear();status='stale';paint()}
  if(at&&Date.now()-at<5*60000)return;busy=true;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch('https://api.rainviewer.com/public/weather-maps.json',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('radar metadata');
   const next=radarFrame(await response.json());if(disposed||!active)return;at=Date.now();
   if(next.stale){clear();frame=next;status='stale';paint();return}
   if(tile&&frame?.path===next.path){status='frame';paint();return}
   clear();frame=next;status='loading';paint();
   const options={maxNativeZoom:7,maxZoom:19,tileSize:256,pane:'weatherRadar',opacity,attribution:'<a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>',updateWhenIdle:true,keepBuffer:1};
   tile=Lf.tileLayer(next.host+next.path+'/256/{z}/{x}/{y}/2/1_1.png',options);const current=tile;
   tile.on('tileerror',()=>{if(tile!==current)return;clear();status='error';paint()});
   tile.on('load',()=>{if(tile!==current)return;status='frame';paint()});tile.addTo(group);
   mask=Lf.tileLayer(next.host+'/v2/coverage/0/256/{z}/{x}/{y}/0/0_0.png',{...options,opacity:.18});mask.addTo(group);
  }catch(error){if(active&&!disposed){clear();status='error';paint()}}
  finally{clearTimeout(timeout);busy=false}
 };
 if(!m.getPane('weatherRadar')){m.createPane('weatherRadar');m.getPane('weatherRadar').style.zIndex=350;m.getPane('weatherRadar').style.pointerEvents='none'}
 mapToolsControl()?.addOverlay(group,esc(radarT('title')));
 m.on('overlayadd',e=>{if(e.layer!==group)return;active=true;at=0;paint();refresh();clearInterval(timer);timer=setInterval(refresh,60000)});
 m.on('overlayremove',e=>{if(e.layer!==group)return;active=false;clearInterval(timer);clear();paint()});
 m.on('unload',()=>{disposed=true;clearInterval(timer)});paint();
 return{group,refresh};
}
