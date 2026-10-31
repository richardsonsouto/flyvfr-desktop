/* Public FAA AIS chart services. Direct tiles only; no imagery is bundled/offline. */
const US_CHARTS={usVfr:'VFR_Sectional',usTerminal:'VFR_Terminal',usLow:'IFR_AreaLow',usHigh:'IFR_High'};
const US_CHART_BASE='https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services/';
const US_CHART_WORDS={
 title:['Aeronautical charts','Cartas aeronáuticas','Cartas aeronáuticas','Cartes aéronautiques','Luftfahrtkarten','航空図','航空图','항공 차트'],
 usVfr:['USA · VFR Sectional','EUA · VFR Sectional','EE. UU. · VFR Sectional','États-Unis · VFR Sectional','USA · VFR Sectional','米国 · VFR Sectional','美国 · VFR Sectional','미국 · VFR Sectional'],
 usTerminal:['USA · VFR Terminal','EUA · VFR Terminal','EE. UU. · VFR Terminal','États-Unis · VFR Terminal','USA · VFR Terminal','米国 · VFR Terminal','美国 · VFR Terminal','미국 · VFR Terminal'],
 usLow:['USA · IFR low / area','EUA · IFR baixa / área','EE. UU. · IFR baja / área','États-Unis · IFR basse / région','USA · IFR unterer Luftraum / Gebiet','米国 · 低高度IFR／エリア','美国 · 低空IFR／区域','미국 · 저고도 IFR / 지역'],
 usHigh:['USA · IFR high','EUA · IFR alta','EE. UU. · IFR alta','États-Unis · IFR haute','USA · IFR oberer Luftraum','米国 · 高高度IFR','美国 · 高空IFR','미국 · 고고도 IFR'],
 source:['FAA / AIS official source. Coverage varies by chart. Check the edition and validity on the original. Simulation only; validity not verified.','Fonte oficial FAA / AIS. A cobertura varia por carta. Confira a edição e a vigência no original. Apenas simulação; vigência não verificada.','Fuente oficial FAA / AIS. La cobertura varía por carta. Comprueba edición y vigencia en el original. Solo simulación; vigencia no verificada.','Source officielle FAA / AIS. Couverture variable. Vérifiez édition et validité sur l’original. Simulation uniquement ; validité non vérifiée.','Offizielle Quelle FAA / AIS. Abdeckung je Karte unterschiedlich. Ausgabe und Gültigkeit im Original prüfen. Nur Simulation; Gültigkeit ungeprüft.','公式情報源 FAA / AIS。範囲は航空図により異なります。原図の版と有効期間を確認してください。シミュレーション専用。有効期間未確認。','官方来源 FAA / AIS。覆盖范围因图而异。请核对原图版本和有效期。仅供模拟；有效期未经确认。','공식 출처 FAA / AIS. 차트마다 범위가 다릅니다. 원본의 판본과 유효기간을 확인하세요. 시뮬레이션 전용, 유효기간 미확인.'],
 loading:['Loading FAA charts…','Carregando cartas FAA…','Cargando cartas FAA…','Chargement des cartes FAA…','FAA-Karten werden geladen…','FAA航空図読込中…','正在加载FAA航图…','FAA 차트 불러오는 중…'],
 error:['FAA charts unavailable. Try reloading or open FAA.','Cartas FAA indisponíveis. Recarregue ou abra a FAA.','Cartas FAA no disponibles. Recarga o abre FAA.','Cartes FAA indisponibles. Rechargez ou ouvrez FAA.','FAA-Karten nicht verfügbar. Neu laden oder FAA öffnen.','FAA航空図利用不可。再読込またはFAAを開いてください。','FAA航图不可用。请重载或打开FAA。','FAA 차트 사용 불가. 새로고침하거나 FAA를 여세요.']
};
function usChartT(k){return US_CHART_WORDS[k]?.[LANGS.indexOf(lang)]||US_CHART_WORDS[k]?.[0]||k}
function usChartMode(){return Object.hasOwn(US_CHARTS,MAP_CHARTS.mode)}
function usChartSource(){const out=document.getElementById('map-chart-source');if(!out)return;out.innerHTML=usChartMode()?`${esc(usChartT('source'))} <a href="https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/" target="_blank" rel="noopener">FAA ↗</a>`:`${esc(chartT('source'))} <a href="https://geoaisweb.decea.mil.br/" target="_blank" rel="noopener">GeoAISWEB ↗</a>`}
function usChartInit(m,Lf){const s=MAP_CHARTS;s.usGroup=Lf.layerGroup([],{key:'FAA_CHARTS'});s.usLayer=null;s.usRequest=0;
 mapToolsControl()?.addOverlay(s.usGroup,'FAA · '+esc(usChartT('title')));
 m.on('overlayadd',e=>{if(e.layer!==s.usGroup||s.usInternal)return;if(!usChartMode()){s.mode='usVfr';s.sheet='auto';const select=document.getElementById('map-chart-type');if(select)select.value=s.mode;mapChartsSheets();mapChartsSave()}usChartActivate(m,Lf,false)});
 m.on('overlayremove',e=>{if(e.layer!==s.usGroup||s.usInternal)return;++s.usRequest;s.usGroup.clearLayers();s.usLayer=null;if(usChartMode()){s.mode='none';s.visible=false;const select=document.getElementById('map-chart-type');if(select)select.value='none';mapChartsSheets();mapChartsSave();mapChartsStatus()}});
}
function usChartHide(m){const s=MAP_CHARTS;++s.usRequest;s.usInternal=true;if(s.usGroup){s.usGroup.clearLayers();if(m.hasLayer(s.usGroup))m.removeLayer(s.usGroup)}s.usInternal=false;s.usLayer=null}
async function usChartActivate(m,Lf,fit){const s=MAP_CHARTS,mode=s.mode,service=US_CHARTS[mode],sequence=++s.usRequest;
 s.internal=true;if(m.hasLayer(s.layer))m.removeLayer(s.layer);s.internal=false;s.visible=true;usChartSource();
 if(fit&&!m.getBounds().intersects(Lf.latLngBounds([[18,-180],[73,-60]])))m.fitBounds([[24,-125],[50,-66]],{padding:[20,20],maxZoom:5});
 s.usGroup.clearLayers();s.usLayer=null;s.usInternal=true;s.usGroup.addTo(m);s.usInternal=false;
 const status=document.getElementById('map-chart-status');if(status)status.textContent=usChartT('loading');
 try{const response=await fetch(US_CHART_BASE+service+'/MapServer?f=json',{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('FAA service');const metadata=await response.json();
  if(metadata.error||!metadata.tileInfo||metadata.tileInfo.rows!==256||![3857,102100].includes(metadata.tileInfo.spatialReference?.latestWkid||metadata.tileInfo.spatialReference?.wkid))throw Error('FAA tiles');
  if(s.map!==m||s.mode!==mode||s.usRequest!==sequence)return;
  const layer=Lf.tileLayer(US_CHART_BASE+service+'/MapServer/tile/{z}/{y}/{x}',{pane:'brazilCharts',opacity:s.opacity,minNativeZoom:metadata.minLOD||0,maxNativeZoom:metadata.maxLOD||12,maxZoom:19,noWrap:true,updateWhenIdle:true,keepBuffer:1,attribution:'<a href="https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/" target="_blank" rel="noopener">FAA / AIS</a>'});s.usLayer=layer;
  let failed=false;layer.on('tileerror',()=>{if(s.usLayer!==layer)return;failed=true;if(status)status.textContent=usChartT('error')});layer.on('load',()=>{if(s.usLayer===layer&&status)status.textContent=failed?usChartT('error'):''});layer.addTo(s.usGroup);
 }catch(error){if(s.map===m&&s.usRequest===sequence&&status)status.textContent=usChartT('error')}
}
