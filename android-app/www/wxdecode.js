/* Decodificador de METAR e TAF (texto ICAO → linguagem comum), nos 8 idiomas do app.
   Ordem dos idiomas: en, pt, es, fr, de, ja, zh, ko */
const WXD_T={
 raw:["Original","Original","Original","Brut","Original","原文","原文","원문"],
 dec:["Decoded","Decodificado","Decodificado","Décodé","Entschlüsselt","解読","解读","해독"],
 obs:["Observed","Observação","Observación","Observation","Beobachtung","観測","观测","관측"],
 issued:["Issued","Emitido","Emitido","Émis","Ausgegeben","発表","发布","발표"],
 valid:["Valid","Validade","Validez","Validité","Gültig","有効","有效","유효"],
 wind:["Wind","Vento","Viento","Vent","Wind","風","风","바람"],
 vis:["Visibility","Visibilidade","Visibilidad","Visibilité","Sicht","視程","能见度","시정"],
 wx:["Weather","Tempo presente","Fenómenos","Temps présent","Wetter","天気","天气现象","일기"],
 clouds:["Clouds","Nuvens","Nubes","Nuages","Wolken","雲","云","구름"],
 temp:["Temperature / dew point","Temperatura / ponto de orvalho","Temperatura / punto de rocío","Température / point de rosée","Temperatur / Taupunkt","気温 / 露点","温度 / 露点","기온 / 이슬점"],
 qnh:["Pressure (QNH)","Pressão (QNH)","Presión (QNH)","Pression (QNH)","Luftdruck (QNH)","気圧 (QNH)","气压 (QNH)","기압 (QNH)"],
 rvr:["Runway visual range","Alcance visual na pista","Alcance visual en pista","Portée visuelle de piste","Pistensichtweite","滑走路視距離","跑道视程","활주로 가시거리"],
 trend:["Trend","Tendência","Tendencia","Tendance","Trend","傾向","趋势","경향"],
 recent:["Recent weather","Tempo recente","Fenómeno reciente","Temps récent","Wetter zuvor","直前の天気","近时天气","최근 일기"],
 ws:["Wind shear","Tesoura de vento","Cizalladura","Cisaillement","Windscherung","ウィンドシア","风切变","윈드시어"],
 maxmin:["Max / min temperature","Temperatura máx. / mín.","Temperatura máx. / mín.","Température max. / min.","Höchst- / Tiefsttemperatur","最高 / 最低気温","最高 / 最低温度","최고 / 최저 기온"],
 calm:["Calm","Calmo","Calma","Calme","Windstill","静穏","静风","무풍"],
 varw:["Variable","Variável","Variable","Variable","Umlaufend","不定","不定","가변"],
 from:["from","de","de","du","aus","から","来自","에서"],
 at:["at","a","a","à","mit","","","",],
 gust:["gusts","rajadas","ráfagas","rafales","Böen","最大瞬間","阵风","돌풍"],
 between:["varying between {a}° and {b}°","variando entre {a}° e {b}°","variando entre {a}° y {b}°","variant entre {a}° et {b}°","schwankend zwischen {a}° und {b}°","{a}°〜{b}°で変動","在{a}°至{b}°之间变化","{a}°~{b}° 사이 변동"],
 ten:["10 km or more","10 km ou mais","10 km o más","10 km ou plus","10 km oder mehr","10 km以上","10公里或以上","10 km 이상"],
 cavok:["CAVOK: visibility 10 km or more, no cloud below 5,000 ft or CB/TCU, no significant weather","CAVOK: visibilidade de 10 km ou mais, sem nuvens abaixo de 5.000 ft nem CB/TCU, sem tempo significativo","CAVOK: visibilidad 10 km o más, sin nubes bajo 5.000 ft ni CB/TCU, sin fenómenos significativos","CAVOK : visibilité 10 km ou plus, pas de nuage sous 5 000 ft ni CB/TCU, pas de temps significatif","CAVOK: Sicht 10 km oder mehr, keine Wolken unter 5.000 ft und keine CB/TCU, kein signifikantes Wetter","CAVOK：視程10 km以上、5,000 ft未満の雲・CB/TCUなし、顕著な天気なし","CAVOK：能见度10公里或以上，5000英尺以下无云及CB/TCU，无重要天气","CAVOK: 시정 10 km 이상, 5,000 ft 미만 구름·CB/TCU 없음, 특이 기상 없음"],
 nsc:["No significant cloud","Sem nuvens significativas","Sin nubes significativas","Pas de nuages significatifs","Keine signifikante Bewölkung","顕著な雲なし","无重要云","유의한 구름 없음"],
 skc:["Sky clear","Céu claro","Cielo despejado","Ciel clair","Wolkenlos","快晴","晴空","맑음"],
 ncd:["No cloud detected","Nenhuma nuvem detectada","Sin nubes detectadas","Aucun nuage détecté","Keine Wolken erkannt","雲を検出せず","未探测到云","구름 탐지 안 됨"],
 nsw:["No significant weather","Sem tempo significativo","Sin fenómenos significativos","Pas de temps significatif","Kein signifikantes Wetter","顕著な天気なし","无重要天气","특이 기상 없음"],
 FEW:["Few","Poucas","Escasas","Peu","Gering","少量","少云","조금"],
 SCT:["Scattered","Esparsas","Dispersas","Épars","Aufgelockert","散在","疏云","흩어짐"],
 BKN:["Broken","Nublado","Nuboso","Fragmenté","Durchbrochen","曇り","多云","많음"],
 OVC:["Overcast","Encoberto","Cubierto","Couvert","Bedeckt","全天曇り","阴天","흐림"],
 VV:["Sky obscured, vertical visibility","Céu obscurecido, visibilidade vertical","Cielo oscurecido, visibilidad vertical","Ciel invisible, visibilité verticale","Himmel nicht erkennbar, Vertikalsicht","天空不明、鉛直視程","天空不明，垂直能见度","하늘 불명, 수직시정"],
 CB:["cumulonimbus","cumulonimbus","cumulonimbos","cumulonimbus","Cumulonimbus","積乱雲","积雨云","적란운"],
 TCU:["towering cumulus","cumulus congestus","cúmulos congestus","cumulus bourgeonnants","aufgetürmte Cumulus","雄大積雲","浓积云","탑상적운"],
 nosig:["No significant change expected","Sem mudança significativa prevista","Sin cambios significativos previstos","Pas de changement significatif prévu","Keine wesentliche Änderung erwartet","大きな変化なし","预计无显著变化","큰 변화 없음"],
 base:["Initial forecast","Previsão inicial","Pronóstico inicial","Prévision initiale","Grundvorhersage","基本予報","基本预报","기본 예보"],
 FM:["From {a}","A partir de {a}","Desde {a}","À partir de {a}","Ab {a}","{a}から","{a}起","{a}부터"],
 BECMG:["Becoming, {a} → {b}","Mudança gradual, {a} → {b}","Cambio gradual, {a} → {b}","Devenant, {a} → {b}","Übergehend, {a} → {b}","次第に、{a} → {b}","逐渐转为，{a} → {b}","점차, {a} → {b}"],
 TEMPO:["Temporarily, {a} → {b}","Temporariamente, {a} → {b}","Temporalmente, {a} → {b}","Temporairement, {a} → {b}","Zeitweise, {a} → {b}","一時、{a} → {b}","短时，{a} → {b}","일시적, {a} → {b}"],
 PROB:["{p}% probability, {a} → {b}","Probabilidade de {p}%, {a} → {b}","Probabilidad {p}%, {a} → {b}","Probabilité {p} %, {a} → {b}","Wahrscheinlichkeit {p} %, {a} → {b}","確率{p}%、{a} → {b}","概率{p}%，{a} → {b}","확률 {p}%, {a} → {b}"],
 PROBT:["{p}% probability, temporarily, {a} → {b}","Probabilidade de {p}%, temporariamente, {a} → {b}","Probabilidad {p}%, temporalmente, {a} → {b}","Probabilité {p} %, temporairement, {a} → {b}","Wahrscheinlichkeit {p} %, zeitweise, {a} → {b}","確率{p}%、一時、{a} → {b}","概率{p}%，短时，{a} → {b}","확률 {p}%, 일시적, {a} → {b}"],
 day:["day {d}","dia {d}","día {d}","le {d}","am {d}.","{d}日","{d}日","{d}일"],
 auto:["Automatic station","Estação automática","Estación automática","Station automatique","Automatische Station","自動観測","自动站","자동 관측"],
 cor:["Corrected report","Boletim corrigido","Informe corregido","Message corrigé","Korrigierte Meldung","訂正報","更正报","정정 보고"],
 nodata:["Could not decode this report.","Não foi possível decodificar este boletim.","No se pudo decodificar este informe.","Impossible de décoder ce message.","Meldung konnte nicht entschlüsselt werden.","この報を解読できませんでした。","无法解读此报文。","이 보고를 해독할 수 없습니다."],
 rwy:["runway {r}","pista {r}","pista {r}","piste {r}","Piste {r}","滑走路{r}","跑道{r}","활주로 {r}"],
 allrwy:["all runways","todas as pistas","todas las pistas","toutes les pistes","alle Pisten","全滑走路","所有跑道","모든 활주로"],
 less:["less than","menos de","menos de","moins de","weniger als","未満","小于","미만"],
 more:["more than","mais de","más de","plus de","mehr als","超","大于","초과"],
 notdec:["Not decoded","Não decodificado","No decodificado","Non décodé","Nicht entschlüsselt","未解読","未解读","미해독"],
};
const WXD_WX={ // fenômenos e descritores
 "-":["light","fraca","débil","faible","leicht","弱","小","약"],
 "+":["heavy","forte","fuerte","fort","stark","強","大","강"],
 VC:["in the vicinity","nas proximidades","en las proximidades","au voisinage","in der Umgebung","周辺","附近","부근"],
 MI:["shallow","baixo","bajo","mince","flacher","地","浅","얕은"],BC:["patches of","em bancos","bancos de","bancs de","Schwaden","散在","散片","산재"],PR:["partial","parcial","parcial","partiel","teilweise","部分","部分","부분"],
 DR:["low drifting","flutuante baixo","levantado bajo","chasse basse","fegend","低い地吹","低吹","낮게 날림"],BL:["blowing","soprado","ventisca","chasse haute","treibend","高い地吹","高吹","높게 날림"],
 SH0:["showers","pancadas","chubascos","averses","Schauer","しゅう雨","阵雨","소나기"],
 SH:["showers of","pancadas de","chubascos de","averses de","Schauer","しゅう雨性","阵性","소나기성"],TS:["thunderstorm","trovoada","tormenta","orage","Gewitter","雷電","雷暴","뇌우"],FZ:["freezing","congelante","engelante","se congelant","gefrierender","着氷性","冻","어는"],
 DZ:["drizzle","chuvisco","llovizna","bruine","Niesel","霧雨","毛毛雨","이슬비"],RA:["rain","chuva","lluvia","pluie","Regen","雨","雨","비"],SN:["snow","neve","nieve","neige","Schnee","雪","雪","눈"],
 SG:["snow grains","grãos de neve","cinarra","neige en grains","Schneegriesel","霧雪","米雪","쌀알눈"],IC:["ice crystals","cristais de gelo","cristales de hielo","cristaux de glace","Eiskristalle","細氷","冰晶","세빙"],PL:["ice pellets","granizo miúdo","hielo granulado","granules de glace","Eiskörner","凍雨","冰粒","얼음싸라기"],
 GR:["hail","granizo","granizo","grêle","Hagel","ひょう","冰雹","우박"],GS:["small hail","granizo pequeno","granizo pequeño","grésil","Graupel","あられ","小冰雹","싸락우박"],UP:["unknown precipitation","precipitação desconhecida","precipitación desconocida","précipitation inconnue","unbekannter Niederschlag","不明な降水","未知降水","미확인 강수"],
 BR:["mist","névoa úmida","neblina","brume","feuchter Dunst","もや","轻雾","박무"],FG:["fog","nevoeiro","niebla","brouillard","Nebel","霧","雾","안개"],FU:["smoke","fumaça","humo","fumée","Rauch","煙","烟","연기"],
 VA:["volcanic ash","cinzas vulcânicas","ceniza volcánica","cendres volcaniques","Vulkanasche","火山灰","火山灰","화산재"],DU:["dust","poeira","polvo","poussière","Staub","塵","浮尘","먼지"],SA:["sand","areia","arena","sable","Sand","砂","沙","모래"],
 HZ:["haze","névoa seca","calima","brume sèche","trockener Dunst","煙霧","霾","연무"],PY:["spray","borrifo","rocío","embruns","Gischt","しぶき","飞沫","물보라"],PO:["dust whirls","redemoinhos de poeira","remolinos de polvo","tourbillons de poussière","Staubwirbel","塵旋風","尘卷风","먼지회오리"],
 SQ:["squalls","tempestade de vento","turbonada","grains","Böenwalze","スコール","飑","스콜"],FC:["funnel cloud","nuvem funil","nube embudo","nuage en entonnoir","Trichterwolke","漏斗雲","漏斗云","깔때기 구름"],SS:["sandstorm","tempestade de areia","tempestad de arena","tempête de sable","Sandsturm","砂嵐","沙暴","모래폭풍"],DS:["duststorm","tempestade de poeira","tempestad de polvo","tempête de poussière","Staubsturm","塵嵐","尘暴","먼지폭풍"]
};
function wxdL(){const i=LANGS.indexOf(typeof lang!=="undefined"?lang:"en");return i<0?0:i}
function wxdT(k,v){const a=WXD_T[k];let s=a?(a[wxdL()]??a[0]):k;if(v)for(const x in v)s=s.split("{"+x+"}").join(v[x]);return s}
function wxdW(k){const a=WXD_WX[k];return a?(a[wxdL()]||a[0]):k}
const WXD_ASIAN=()=>["ja","zh","ko"].includes(typeof lang!=="undefined"?lang:"en");
function wxdNum(n){try{return Number(n).toLocaleString(typeof lang!=="undefined"?lang:"en")}catch(e){return String(n)}}
function wxdWeather(tok){
  const m=tok.match(/^(RE)?([+-]|VC)?((?:MI|BC|PR|DR|BL|SH|TS|FZ)*)((?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)*)$/);
  if(!m||(!m[3]&&!m[4])||tok==="RE")return null;
  const desc=(m[3].match(/../g)||[]),ph=(m[4].match(/../g)||[]);
  const rom=["pt","es","fr"].includes(typeof lang!=="undefined"?lang:"en");
  const ds=desc.filter(d=>d!=="TS");let phs=ph.map(wxdW);
  if(!phs.length&&ds.includes("SH")){ds.splice(ds.indexOf("SH"),1);phs=[wxdW("SH0")]}
  const pre=ds.filter(d=>!rom||d==="SH"||d==="BC").map(wxdW),post=rom?ds.filter(d=>d!=="SH"&&d!=="BC").map(wxdW):[];
  const sp=["ja","zh"].includes(typeof lang!=="undefined"?lang:"en")?"":" ";let core=[...pre,...phs,...post].join(sp);
  let s=desc.includes("TS")?wxdW("TS")+(core?" + "+core:""):core;
  const q=[];if(m[2]&&m[2]!=="VC")q.push(wxdW(m[2]));if(m[2]==="VC")q.push(wxdW("VC"));
  if(q.length)s+=" ("+q.join(", ")+")";
  return {recent:!!m[1],text:s};
}
function wxdWind(tok){
  let m=tok.match(/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS|KMH)$/);if(!m)return null;
  const u=m[4]==="KT"?"kt":m[4]==="MPS"?"m/s":"km/h";
  if(m[1]==="000"&&+m[2]===0)return wxdT("calm");
  let s=(m[1]==="VRB"?wxdT("varw"):m[1]+"°")+", "+(+m[2])+" "+u;
  if(m[3])s+=" · "+wxdT("gust")+" "+(+m[3])+" "+u;
  return s;
}
function wxdVis(tok,next){
  if(tok==="9999")return wxdT("ten");
  if(/^\d{4}$/.test(tok))return wxdNum(+tok)+" m";
  let m=tok.match(/^(\d{4})(N|NE|E|SE|S|SW|W|NW|NDV)$/);if(m)return wxdNum(+m[1])+" m ("+m[2]+")";
  m=tok.match(/^([PM])?(\d+)?(?:\s?(\d)\/(\d))?SM$/);
  if(m){let v=(m[2]?+m[2]:0)+(m[3]?m[3]/m[4]:0);let s=(v%1?v.toFixed(2).replace(/0$/,""):v)+" SM";if(m[1]==="P")s=wxdT("more")+" "+s;if(m[1]==="M")s=wxdT("less")+" "+s;return s}
  return null;
}
function wxdCloud(tok){
  let m=tok.match(/^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU|\/\/\/)?$/);
  if(m){const h=m[2]==="///"?"?":wxdNum(+m[2]*100)+" ft";return wxdT(m[1])+" · "+h+(m[3]&&m[3]!=="///"?" ("+wxdT(m[3])+")":"")}
  m=tok.match(/^VV(\d{3}|\/\/\/)$/);if(m)return wxdT("VV")+" "+(m[1]==="///"?"?":wxdNum(+m[1]*100)+" ft");
  if(tok==="NSC")return wxdT("nsc");if(tok==="SKC"||tok==="CLR")return wxdT("skc");if(tok==="NCD")return wxdT("ncd");
  return null;
}
function wxdTemp(x){return x==null||x===""?"?":(x[0]==="M"?-(+x.slice(1)):+x)}
function wxdDH(d,h,mi){return wxdT("day",{d:+d})+" "+String(h).padStart(2,"0")+":"+(mi||"00")+" UTC"}
/* elementos comuns (vento, visibilidade, tempo, nuvens) em uma lista de pares [rótulo, valor] */
function wxdCommon(toks,rows,extra){
  const add=(k,v)=>{const r=rows.find(x=>x[0]===k);if(r)r[1]+="; "+v;else rows.push([k,v])};
  const unknown=[];
  for(let i=0;i<toks.length;i++){const t=toks[i];let v;
    if(/^\d{1}$/.test(t)&&/^\d\/\dSM$/.test(toks[i+1]||"")){v=wxdVis(t+" "+toks[i+1]);i++;if(v){add(wxdT("vis"),v);continue}}
    if((v=wxdWind(t))){add(wxdT("wind"),v);continue}
    let m=t.match(/^(\d{3})V(\d{3})$/);if(m){add(wxdT("wind"),wxdT("between",{a:m[1],b:m[2]}));continue}
    if(t==="CAVOK"){add(wxdT("vis"),wxdT("cavok"));continue}
    if((v=wxdVis(t))){add(wxdT("vis"),v);continue}
    m=t.match(/^R(\d{2}[LCR]?)\/([PM])?(\d{4})(?:V([PM])?(\d{4}))?(FT)?\/?([UDN])?$/);
    if(m){const u=m[6]?" ft":" m";let s=wxdT("rwy",{r:m[1]})+": "+(m[2]==="M"?wxdT("less")+" ":m[2]==="P"?wxdT("more")+" ":"")+wxdNum(+m[3])+u+(m[5]?" – "+wxdNum(+m[5])+u:"");add(wxdT("rvr"),s);continue}
    if(t==="NSW"){add(wxdT("wx"),wxdT("nsw"));continue}
    if((v=wxdCloud(t))){add(wxdT("clouds"),v);continue}
    if((v=wxdWeather(t))){add(v.recent?wxdT("recent"):wxdT("wx"),v.text);continue}
    if(extra&&extra(t,add,toks,i))continue;
    unknown.push(t);
  }
  return unknown;
}
function decodeMetar(raw){
  if(!raw)return null;
  let s=String(raw).replace(/\s+/g," ").trim().replace(/=$/,"");
  s=s.replace(/\sRMK\s.*$/,"");
  let trend="";const tm=s.match(/\s(NOSIG|BECMG\s.*|TEMPO\s.*)$/);if(tm){trend=tm[1];s=s.slice(0,tm.index)}
  const toks=s.split(" ");const rows=[];
  if(/^(METAR|SPECI)$/.test(toks[0]))toks.shift();
  if(/^[A-Z][A-Z0-9]{3}$/.test(toks[0]))toks.shift();
  let m=(toks[0]||"").match(/^(\d{2})(\d{2})(\d{2})Z$/);if(m){rows.push([wxdT("obs"),wxdDH(m[1],m[2],m[3])]);toks.shift()}
  const flags=[];
  const unk=wxdCommon(toks,rows,(t,add)=>{
    if(t==="AUTO"){flags.push(wxdT("auto"));return true}
    if(t==="COR"){flags.push(wxdT("cor"));return true}
    let m=t.match(/^(M?\d{2})\/(M?\d{2})?$/);if(m){add(wxdT("temp"),wxdTemp(m[1])+" °C / "+(m[2]?wxdTemp(m[2])+" °C":"?"));return true}
    m=t.match(/^Q(\d{4})$/);if(m){add(wxdT("qnh"),wxdNum(+m[1])+" hPa");return true}
    m=t.match(/^A(\d{4})$/);if(m){const inh=+m[1]/100;add(wxdT("qnh"),inh.toFixed(2)+" inHg ("+wxdNum(Math.round(inh*33.8639))+" hPa)");return true}
    if(t==="WS"){add(wxdT("ws"),"");return true}
    if(/^(R\d{2}[LCR]?|ALL|RWY|RWYS)$/.test(t)&&rows.some(r=>r[0]===wxdT("ws"))){const r=rows.find(r=>r[0]===wxdT("ws"));r[1]=(r[1]?r[1]+", ":"")+(t==="ALL"?wxdT("allrwy"):t.replace(/^R/,wxdT("rwy",{r:""}).trim()+" "));return true}
    return false});
  const ws=rows.find(r=>r[0]===wxdT("ws"));if(ws&&!ws[1])ws[1]="✓";
  if(trend){let v;if(trend==="NOSIG")v=wxdT("nosig");else{const tk=trend.split(" "),k=tk.shift(),tr=[];
      while(tk[0]&&/^(FM|TL|AT)\d{4}$/.test(tk[0])){const x=tk.shift();tr.push(x.slice(0,2)+" "+x.slice(2,4)+":"+x.slice(4)+" UTC")}
      const rr=[];const u=wxdCommon(tk,rr);v=(k==="TEMPO"?wxdT("TEMPO",{a:"",b:""}):wxdT("BECMG",{a:"",b:""})).replace(/[,，、]?\s*→\s*$/,"").trim()+(tr.length?" ("+tr.join(" ")+")":"")+": "+rr.map(r=>r[0]+" "+r[1]).join("; ")+(u.length?" · "+u.join(" "):"")}
    rows.push([wxdT("trend"),v])}
  if(flags.length)rows.unshift(["",flags.join(" · ")]);
  return {rows,unknown:unk};
}
function decodeTaf(raw){
  if(!raw)return null;
  let s=String(raw).replace(/\s+/g," ").trim().replace(/=$/,"").replace(/\sRMK\s.*$/,"");
  const parts=s.split(/\s(?=FM\d{6}|BECMG\s|TEMPO\s|PROB\d{2}\s)/);
  const head=parts.shift().split(" ");
  const out={rows:[],groups:[],unknown:[]};
  while(head.length&&/^(TAF|AMD|COR)$/.test(head[0]))head.shift();
  if(/^[A-Z][A-Z0-9]{3}$/.test(head[0]))head.shift();
  let m=(head[0]||"").match(/^(\d{2})(\d{2})(\d{2})Z$/);if(m){out.rows.push([wxdT("issued"),wxdDH(m[1],m[2],m[3])]);head.shift()}
  const per=t=>{const m=t.match(/^(\d{2})(\d{2})\/(\d{2})(\d{2})$/);return m?[wxdDH(m[1],m[2]),wxdDH(m[3],m[4])]:null};
  let p=per(head[0]||"");if(p){out.rows.push([wxdT("valid"),p[0]+" → "+p[1]]);head.shift()}
  const tx=(t,add)=>{const m=t.match(/^T([XN])(M?\d{2})\/(\d{2})(\d{2})Z$/);if(!m)return false;add(wxdT("maxmin"),(m[1]==="X"?"↑ ":"↓ ")+wxdTemp(m[2])+" °C ("+wxdDH(m[3],m[4])+")");return true};
  const base=[];out.unknown.push(...wxdCommon(head,base,tx));out.groups.push({title:wxdT("base"),rows:base});
  for(const g of parts){const tk=g.split(" ");let title="";
    let m=tk[0].match(/^FM(\d{2})(\d{2})(\d{2})$/);
    if(m){title=wxdT("FM",{a:wxdDH(m[1],m[2],m[3])});tk.shift()}
    else if(tk[0]==="BECMG"||tk[0]==="TEMPO"){const k=tk.shift();const pp=per(tk[0]||"");if(pp){tk.shift();title=wxdT(k,{a:pp[0],b:pp[1]})}else title=k}
    else if((m=tk[0].match(/^PROB(\d{2})$/))){tk.shift();let k="PROB";if(tk[0]==="TEMPO"){tk.shift();k="PROBT"}const pp=per(tk[0]||"");if(pp)tk.shift();title=wxdT(k,{p:m[1],a:pp?pp[0]:"?",b:pp?pp[1]:"?"})}
    const rows=[];out.unknown.push(...wxdCommon(tk,rows,tx));out.groups.push({title,rows});
  }
  return out;
}
function wxdRows(rows){return rows.length?`<dl class="wxd">${rows.map(([k,v])=>k?`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`:`<dd class="wxd-flag">${esc(v)}</dd>`).join("")}</dl>`:""}
function wxDecodedHtml(d,report=null){
  let h="";
  if(report!=='TAF'){
  const mt=decodeMetar(d.metar);
  h+=`<div class="wx-lab">METAR</div>`+(d.metar?(mt&&mt.rows.length?wxdRows(mt.rows)+(mt.unknown.length?`<p class="muted wxd-unk">${esc(wxdT("notdec"))}: <span class="mono">${esc(mt.unknown.join(" "))}</span></p>`:""):`<p class="muted">${esc(wxdT("nodata"))}</p>`):`<p class="muted">${t("wx_none")}</p>`);
  }
  if(report!=='METAR'){
  const tf=decodeTaf(d.taf);
  h+=`<div class="wx-lab">TAF</div>`;
  if(!d.taf)h+=`<p class="muted">${t("wx_none")}</p>`;
  else if(!tf)h+=`<p class="muted">${esc(wxdT("nodata"))}</p>`;
  else{h+=wxdRows(tf.rows)+tf.groups.filter(g=>g.rows.length||g.title).map(g=>`<div class="wxd-grp"><div class="wxd-gt">${esc(g.title)}</div>${wxdRows(g.rows)}</div>`).join("");
    if(tf.unknown.length)h+=`<p class="muted wxd-unk">${esc(wxdT("notdec"))}: <span class="mono">${esc(tf.unknown.join(" "))}</span></p>`}
  }
  return h;
}
