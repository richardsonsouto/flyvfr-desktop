/* brieflayers.js — O mapa da Sala de briefing recebe as mesmas camadas do menu Mapa:
   ferramentas do mapa (escala, favoritas, histórico, eventos, RPL, meteorologia, alcance, alternativas, espaço aéreo),
   radar meteorológico e cartas DECEA / FAA. NOTAM e SIGMET continuam os próprios do briefing (sem duplicar). */
async function brfExtraLayers(m,Lf,ctl){
  if(!m||BRF.map!==m||m._vfrExtra)return;m._vfrExtra=true;BRF.mapControl=ctl;
  try{
    if(typeof mapToolsInit==="function"&&typeof mapToolsRestore==="function"){
      mapToolsRestore();const S=MAP_TOOLS,L=BRF.mapLeg;
      if(L&&S.briefLeg!==L.key){S.briefLeg=L.key;S.dep=L.dep;S.arr=L.arr;S.ac=L.acId;S.selected=L.dep}
      /* primeira vez no briefing: camadas extras começam desligadas para não poluir a rota (depois fica a escolha do piloto) */
      let saved=null;try{saved=JSON.parse(localStorage.getItem("vfr-map-tools-briefing")||"null")}catch(e){}
      if(!saved||saved.pilot!==myId)for(const k of ["roster","favorites","history","events","rpl","weather","range","alternates","airspace"])S.on[k]=false;
      S.on.hazards=false;S.on.notam=false;              /* o briefing já desenha SIGMET/AIRMET e tem a camada NOTAM própria */
      await mapToolsInit(m,Lf);
      if(BRF.map!==m)return;
      for(const k of ["hazards","notam"])if(S.layers[k]){ctl.removeLayer(S.layers[k]);if(m.hasLayer(S.layers[k]))m.removeLayer(S.layers[k])}
    }
    if(typeof mapRadarInit==="function"&&BRF.map===m)mapRadarInit(m,Lf);
    if(typeof mapChartsInit==="function"&&BRF.map===m)await mapChartsInit(m,Lf);
  }catch(e){console.warn("brfExtraLayers",e)}
}
