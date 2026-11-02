/* Menu Mapa: só as camadas que interessam, agrupadas em Meu voo, Tráfego e Meteorologia.
   Saem da lista: o que já tem menu próprio (favoritas, histórico, eventos, RPL), o que já está no briefing
   (alcance, alternativos, NOTAM) e as cartas (continuam no seletor abaixo do mapa).
   Controladores VATSIM/IVAO e limites de FIR acompanham a camada da própria rede; o seu ID online é sempre destacado.
   O mapa do briefing não muda. */
const MS_WORDS={
 mine:['My flight','Meu voo','Mi vuelo','Mon vol','Mein Flug','自分の便','我的航班','내 비행'],
 traffic:['Traffic','Tráfego','Tráfico','Trafic','Verkehr','交通','交通','교통'],
 weather:['Weather','Meteorologia','Meteorología','Météo','Wetter','気象','气象','기상']
};
function msT(k){const a=MS_WORDS[k];return a[LANGS.indexOf(lang)]||a[0]}
const MS_DROP_TOOLS=['favorites','history','events','rpl','range','alternates','notam','airspace'];
function msIsMap(ctl){return view==='map'&&typeof MAPV!=='undefined'&&!!ctl&&ctl===MAPV.control}
function msKey(layer){return layer&&layer.options&&layer.options.key||''}
function msIsChart(layer){const s=typeof MAP_CHARTS!=='undefined'?MAP_CHARTS:null;return !!s&&(layer===s.layer||layer===s.usGroup)}
function msDrop(layer){const k=msKey(layer);if(/^NET_/.test(k))return true;if(k.startsWith('tools-')&&MS_DROP_TOOLS.includes(k.slice(6)))return true;return msIsChart(layer)}
function msRank(layer){const k=msKey(layer);return {'tools-roster':0,'tools-live':1,VATSIM:2,IVAO:3,ADSB:4,'tools-weather':5,'tools-hazards':7}[k]??6}
function msGroup(rank){return rank===0?'mine':rank<=4?'traffic':'weather'}
function msPatch(){
 const Lf=window.L;if(!Lf||!Lf.Control||!Lf.Control.Layers||Lf.Control.Layers.prototype._msPatched)return;
 const P=Lf.Control.Layers.prototype,add=P.addOverlay,upd=P._update;P._msPatched=true;
 P.addOverlay=function(layer,name){
  if(msIsMap(this)){if(msDrop(layer))return this;this.options.sortLayers=true;this.options.sortFunction=(a,b)=>msRank(a)-msRank(b)}
  return add.call(this,layer,name)};
 P._update=function(){const r=upd.apply(this,arguments);
  try{if(msIsMap(this)&&this._overlaysList){let last='';
   for(const label of [...this._overlaysList.children]){const input=label.querySelector('input');if(!input)continue;
    const obj=this._layers.find(o=>Lf.Util.stamp(o.layer)===input.layerId);if(!obj)continue;const g=msGroup(msRank(obj.layer));
    if(g!==last){const h=document.createElement('div');h.className='ms-group';h.textContent=msT(g);label.before(h);last=g}}}}catch(e){}
  return r}}
msPatch();
if(typeof loadLeaflet==='function'){const msLoad=loadLeaflet;loadLeaflet=function(){const p=msLoad.apply(this,arguments);return Promise.resolve(p).then(v=>{msPatch();return v})}}
/* No menu Mapa, as camadas retiradas ficam desligadas (não desenham nada escondido) */
if(typeof mapToolsRestore==='function'){const msRestore=mapToolsRestore;mapToolsRestore=function(){const r=msRestore.apply(this,arguments);
 if(view==='map'&&typeof MAP_TOOLS!=='undefined')for(const k of MS_DROP_TOOLS)MAP_TOOLS.on[k]=false;return r}}
/* Controladores e FIR seguem a camada da rede; o seu ID online fica sempre visível */
function msSync(m){
 if(view!=='map'||typeof MAPV==='undefined'||MAPV.map!==m||!MAPV.tfc)return;
 const entry=typeof NET!=='undefined'&&NET.maps?NET.maps.find(e=>e.m===m):null;
 for(const net of ['VATSIM','IVAO']){const on=m.hasLayer(MAPV.tfc[net]),lay=entry&&entry.layers[net];if(lay){if(on&&!m.hasLayer(lay))lay.addTo(m);else if(!on&&m.hasLayer(lay))m.removeLayer(lay)}}
 if(entry&&entry.layers.mine&&!m.hasLayer(entry.layers.mine))entry.layers.mine.addTo(m);
 const S=typeof MAP_TOOLS!=='undefined'?MAP_TOOLS:null,as=S&&S.layers&&S.layers.airspace;
 if(as){const on=m.hasLayer(MAPV.tfc.VATSIM);S.on.airspace=on;if(on){if(!m.hasLayer(as))as.addTo(m);if(typeof mapDrawAirspace==='function')mapDrawAirspace(m,window.L)}else if(m.hasLayer(as))m.removeLayer(as)}}
if(typeof netMapInit==='function'){const msNet=netMapInit;netMapInit=function(m,Lf,control){const r=msNet.apply(this,arguments);
 try{if(msIsMap(control)&&!m._msHooked){m._msHooked=true;try{const sv=JSON.parse(localStorage.getItem('vfr-map-ov')||'{}');if(!('ADSB' in sv)&&MAPV.tfc&&m.hasLayer(MAPV.tfc.ADSB))m.removeLayer(MAPV.tfc.ADSB)}catch(x){}m.on('overlayadd overlayremove',e=>{if(MAPV.tfc&&(e.layer===MAPV.tfc.VATSIM||e.layer===MAPV.tfc.IVAO))msSync(m)});control._update()}
  msSync(m);setTimeout(()=>msSync(m),800);setTimeout(()=>msSync(m),2500)}catch(e){}
 return r}}
