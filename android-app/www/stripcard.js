/* stripcard.js — Escala: linha do tempo no topo de cada dia e um cartão de embarque por voo
   (substitui o painel "letreiro" das strips; dados, cálculos e ações continuam os mesmos). */
const SC_T={sc_flight:["Flight","Voo","Vuelo","Vol","Flug","便","航班","항공편"],sc_status:["Status","Situação","Estado","Statut","Status","状況","状态","상태"],
 sc_now:["now","agora","ahora","maintenant","jetzt","現在","现在","지금"],sc_ground:["ground","solo","tierra","sol","Boden","地上","地面","지상"]};
const sct=k=>{const r=SC_T[k];return r?(r[LANGS.indexOf(lang)]||r[0]):k};
const SX_CITY_FIX={"Sao Paulo":"São Paulo","Brasilia":"Brasília","Belem":"Belém","Florianopolis":"Florianópolis","Goiania":"Goiânia","Cuiaba":"Cuiabá","Maceio":"Maceió","Sao Luis":"São Luís","Vitoria":"Vitória","Macapa":"Macapá","Joao Pessoa":"João Pessoa","Ribeirao Preto":"Ribeirão Preto","Sao Jose dos Campos":"São José dos Campos","Uberlandia":"Uberlândia","Londrina":"Londrina","Foz do Iguacu":"Foz do Iguaçu","Foz Do Iguacu":"Foz do Iguaçu","Ilheus":"Ilhéus","Petrolina":"Petrolina","Teresina":"Teresina","Aracaju":"Aracaju","Navegantes":"Navegantes","Chapeco":"Chapecó","Maraba":"Marabá","Santarem":"Santarém","Imperatriz":"Imperatriz","Juazeiro do Norte":"Juazeiro do Norte","Montes Claros":"Montes Claros","Sao Jose do Rio Preto":"São José do Rio Preto","Bogota":"Bogotá","Asuncion":"Asunción","Mexico City":"Cidade do México","Lisbon":"Lisboa"};
function sxCity(c){const A=typeof AIRPORTS!=="undefined"&&AIRPORTS&&AIRPORTS[c];if(!A||!A[4])return"";let s=String(A[4]).replace(/\b(De|Do|Da|Dos|Das)\b/g,m=>m.toLowerCase());return SX_CITY_FIX[s]||s}

function scColors(al){const L=typeof LIVERY!=="undefined"&&LIVERY[al];const a=L?L[0]:"#5b6b7c",b=L?(L[1]||L[0]):a;
  /* cor de texto da companhia sempre legível sobre o cartão (claro ou escuro) */
  const dark=typeof isDark==="function"&&isDark();let txt=a;
  if(typeof faContrast==="function"&&typeof faMix==="function"){const bg=dark?"#151F29":"#FFFFFF";let t=0;while(faContrast(txt,bg)<4.5&&t<1){t+=.05;txt=faMix(a,dark?"#ffffff":"#000000",t)}}
  let ink="#fff";if(typeof faContrast==="function")ink=faContrast(a,"#ffffff")>=faContrast(a,"#111111")?"#ffffff":"#111111";
  return{a,b,txt,ink}}
const scHM=ms=>{const d=new Date(ms);return String(d.getUTCHours()).padStart(2,"0")+":"+String(d.getUTCMinutes()).padStart(2,"0")+"Z"};
stripHTML=function(ac,L,k,n){const cs=stripCallsign(ac,L),eet=L.blk||Math.round((L.sta-L.std)/6e4),now=Date.now(),C=scColors(ac.airline);
  const st=L.done?["done","st_done"]:now>=L.std&&now<L.sta?["air","st_air"]:now>=L.std-60*6e4&&now<L.std?["board","st_board"]:["sched","st_sched"];
  const rfl=L.fl?String(L.fl).padStart(3,"0"):stripRFL(ac,L),fn=String(L.flightNo||cs);
  const ap=(c,ms,r)=>`<div class="bpc-ap${r?" r":""}"><span class="bpc-city">${esc(sxCity(c)||"")}</span><span class="wx bpc-code" data-icao="${esc(c)}" tabindex="0">${esc(c)}</span><span class="bpc-time"><b>${tf.format(ms)}</b><small>${t("t_local")}</small><span class="bpc-z">${scHM(ms)}</span></span></div>`;
  return`<div class="bpc${L.ferry?" ferry":""} st-${st[0]}" style="--bpc-a:${C.a};--bpc-b:${C.b};--bpc-t:${C.txt};--bpc-i:${C.ink}">
   <div class="bpc-band"></div>
   <div class="bpc-main">
    <div class="bpc-top">${typeof alSym==="function"?alSym(ac.airline):""}<b class="bpc-al">${esc(ac.airline||"")}</b><span>${esc(ac.type||"")}</span>${regTag(ac,ac.id)}<span class="mono">${esc(cs)} · IFR${L.real&&L.route?" · RPL":""}</span>${L.ferry?`<span class="chip neutral">${t("ferry_chip")}</span>`:""}</div>
    ${ap(L.dep,L.std)}
    <div class="bpc-mid"><span>${L.nm} nm · ${hhmm(eet)} · FL${rfl}</span><i class="bpc-line"><b>✈</b></i>${L.route?`<span class="mono bpc-route" title="${esc(L.route)}">${esc(L.route)}</span>`:"<span></span>"}</div>
    ${ap(L.arr,L.sta,1)}
   </div>
   <div class="bpc-stub"><span class="k">${sct("sc_flight")}</span><b class="bpc-fn">${esc(fn)}</b><span class="k">${t("st_leg")}</span><b>${k}/${n}</b><span class="k">${sct("sc_status")}</span><span class="mx-st ${st[0]}">${t(st[1])}</span></div>
  </div>`};
/* linha do tempo do dia: apresentação, voos, solo e liberação numa régua de horário local */
function scTimeline(ls,ac){if(!ls||!ls.length)return"";const C=scColors(ac&&ac.airline);
  const rep=ls[0].std-60*6e4,rel=ls[ls.length-1].sta+30*6e4,t0=rep-15*6e4,t1=rel+15*6e4,pc=ms=>((ms-t0)/(t1-t0)*100).toFixed(2);
  const seg=(cls,a,b,txt,title)=>`<div class="sct-seg ${cls}" style="left:${pc(a)}%;width:${(pc(b)-pc(a)).toFixed(2)}%" title="${esc(title||txt)}"><span>${txt}</span></div>`;
  let h=seg("rep",rep,ls[0].std,`${t("rs_report")} ${tf.format(rep)}`);
  ls.forEach((L,i)=>{const fn=String(L.flightNo||"");h+=seg("fly",L.std,L.sta,`<b>${esc(fn)}</b> ${esc(L.dep)}→${esc(L.arr)} <em>${tf.format(L.std)}–${tf.format(L.sta)}</em>`,`${fn} ${L.dep}→${L.arr} ${tf.format(L.std)}–${tf.format(L.sta)}`);
    if(ls[i+1])h+=seg("gnd",L.sta,ls[i+1].std,`${sct("sc_ground")} ${hhmm(Math.round((ls[i+1].std-L.sta)/6e4))}`)});
  h+=seg("rel",ls[ls.length-1].sta,rel,`${t("rs_release")} ${tf.format(rel)}`);
  let ticks="";const step=(t1-t0)>10*36e5?2*36e5:36e5;const s=new Date(t0);s.setMinutes(0,0,0);for(let x=s.getTime()+36e5;x<t1;x+=36e5){if((x-s.getTime())%step)continue;ticks+=`<span class="sct-tick" style="left:${pc(x)}%">${tf.format(x)}</span>`}
  const now=Date.now(),nowM=now>t0&&now<t1?`<i class="sct-now" style="left:${pc(now)}%"><span>${sct("sc_now")}</span></i>`:"";
  return`<div class="sct" style="--bpc-a:${C.a};--bpc-i:${C.ink}"><div class="sct-row">${h}${nowM}</div><div class="sct-axis">${ticks}</div></div>`}
/* escala gerada: a linha do tempo entra no topo de cada dia */
if(typeof rosterHTML==="function"){const scRoster=rosterHTML;rosterHTML=function(R){let html=scRoster.apply(this,arguments);if(!R||!R.legs)return html;const ac=acById(R.acId);
  const byDay={};for(const L of R.legs)(byDay[L.day]=byDay[L.day]||[]).push(L);const keys=Object.keys(byDay).map(Number).sort((a,b)=>a-b);let i=0;
  return html.replace(/<div class="rs-legs strip-bay">/g,m=>{const ls=byDay[keys[i++]];return (ls?scTimeline(ls,ac):"")+m})}}
/* Programação (quadro): idem para cada jornada */
if(typeof myProgrammeViews==="function"){const scProg=myProgrammeViews;myProgrammeViews=function(duties){let html=scProg.apply(this,arguments);if(!duties)return html;let i=0;
  return html.replace(/(<section class="my-programme-day"><div class="rs-day-h">[\s\S]*?<\/div>)/g,m=>{const d=duties[i++];const ac=d&&d.legs&&d.legs.find(L=>L.ac);return m+(d&&ac?scTimeline(d.legs,ac.ac):"")})}}

/* Escala: foto real da aeronave escolhida (Planespotters), abaixo do voo e da aeronave */
const SC_PH={sc_photo:["Real photo of {reg}","Foto real da {reg}","Foto real de {reg}","Photo réelle de {reg}","Echtes Foto von {reg}","{reg} の実機写真","{reg} 的真实照片","{reg} 실제 사진"],
 sc_photo_more:["More photos on Planespotters ↗","Mais fotos no Planespotters ↗","Más fotos en Planespotters ↗","Plus de photos sur Planespotters ↗","Weitere Fotos auf Planespotters ↗","Planespotters でさらに写真 ↗","在 Planespotters 查看更多照片 ↗","Planespotters에서 사진 더 보기 ↗"]};
const scp=(k,v)=>{const r=SC_PH[k];let x=r?(r[LANGS.indexOf(lang)]||r[0]):k;if(v)for(const n in v)x=x.split("{"+n+"}").join(v[n]);return x};
function scAcPhotoBox(a){if(!a)return"";return`<div class="rs-acphoto">${planeImg(a,"sm")}<div><b>${esc(scp("sc_photo",{reg:a.registration}))}</b><span class="muted">${esc(a.type)} · ${esc(a.airline||"")}</span><a href="https://www.planespotters.net/search?q=${encodeURIComponent(a.registration)}" target="_blank" rel="noopener">${esc(scp("sc_photo_more"))}</a></div></div>`}
function scPhotoHTML(){if(typeof RS==="undefined"||RS.roster||!RS.ac)return"";return scAcPhotoBox(acById(RS.ac))}
if(typeof rsAcfHTML==="function"){const scAcf=rsAcfHTML;rsAcfHTML=function(){return scAcf.apply(this,arguments)+scPhotoHTML()}}
if(typeof rsRepaintDep==="function"){const scRep=rsRepaintDep;rsRepaintDep=function(){const r=scRep.apply(this,arguments);if(typeof hydratePhotos==="function")hydratePhotos();return r}}

/* Escala: aeródromo de partida inteligente
   1) sem escala gerada: parte de onde terminou o último voo do piloto (senão, regra atual: cidade de acesso / SBGR);
   2) companhia escolhida que não opera na partida: se a partida foi preenchida pelo app, muda para o aeródromo mais usado
      pela companhia (com aviso); se o piloto digitou a partida, mantém e só sugere esse aeródromo com um botão. */
const SD_T={sd_moved:["Departure changed to {icao}, the airport {al} uses most. {al} does not operate at {from}.","Partida alterada para {icao}, o aeródromo mais usado pela {al}. A {al} não opera em {from}.","Salida cambiada a {icao}, el aeródromo más usado por {al}. {al} no opera en {from}.","Départ changé pour {icao}, l’aéroport le plus utilisé par {al}. {al} n’opère pas à {from}.","Abflug auf {icao} geändert, den von {al} am meisten genutzten Flughafen. {al} fliegt nicht ab {from}.","出発地を {al} が最も多く使う {icao} に変更しました。{al} は {from} で運航していません。","出发地已改为 {al} 最常用的 {icao}。{al} 不在 {from} 运营。","출발지를 {al}이(가) 가장 많이 쓰는 {icao}(으)로 바꿨습니다. {al}은(는) {from}에서 운항하지 않습니다."],
 sd_suggest:["{al} does not operate at {from}. The airport it uses most is {icao}.","A {al} não opera em {from}. O aeródromo mais usado por ela é {icao}.","{al} no opera en {from}. El aeródromo que más usa es {icao}.","{al} n’opère pas à {from}. Son aéroport le plus utilisé est {icao}.","{al} fliegt nicht ab {from}. Ihr meistgenutzter Flughafen ist {icao}.","{al} は {from} で運航していません。最も多く使う空港は {icao} です。","{al} 不在 {from} 运营。其最常用的机场是 {icao}。","{al}은(는) {from}에서 운항하지 않습니다. 가장 많이 쓰는 공항은 {icao}입니다."],
 sd_use:["Use {icao}","Usar {icao}","Usar {icao}","Utiliser {icao}","{icao} verwenden","{icao} を使う","使用 {icao}","{icao} 사용"],
 sd_last:["Departure from {icao}, where your last flight ended.","Partida de {icao}, onde terminou o seu último voo.","Salida desde {icao}, donde terminó tu último vuelo.","Départ de {icao}, où s’est terminé votre dernier vol.","Abflug ab {icao}, wo dein letzter Flug endete.","前回のフライトの到着地 {icao} から出発します。","从您上次航班的到达地 {icao} 出发。","마지막 비행이 끝난 {icao}에서 출발합니다."]};
const sdt=(k,v)=>{const r=SD_T[k];let x=r?(r[LANGS.indexOf(lang)]||r[0]):k;if(v)for(const n in v)x=x.split("{"+n+"}").join(v[n]);return x};
const SD={manual:false,lastFor:"",note:null};
/* o piloto escolheu a partida (digitou ou tocou num aeródromo): a partida passa a ser dele */
document.addEventListener("change",e=>{if(e.target&&e.target.id==="rs-dep"){SD.manual=true;SD.note=null}},true);
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest('[data-action="rs-dep-go"]')){SD.manual=true;SD.note=null}},true);
function sdLastArr(){if(typeof data==="undefined"||!data.flights)return"";let best=null;for(const f of data.flights)if(f.pilotId===myId&&(!best||f.createdAt>best.createdAt))best=f;
  return best&&best.arr&&AIRPORTS&&AIRPORTS[best.arr]?best.arr:""}
function sdServes(al,ap){if(!al||al==="all"||!ap)return true;const c=(AIRLINE_ICAO||{})[al];
  if(c&&SCHED&&SCHED.idx&&SCHED.idx[c]&&(SCHED.idx[c][ap]||[]).length)return true;
  const at=Math.max(RS.start||0,Date.now());return fleet.some(a=>a.airline===al&&locAt(a.id,at)===ap)}
function sdHub(al){/* principal base da companhia (lista de bases do app); sem ela, o aeródromo com mais voos na malha */
  if(typeof HUBS!=="undefined"&&HUBS[al]&&HUBS[al].length){const h=[...HUBS[al]].sort((x,y)=>(y[1]||0)-(x[1]||0))[0][0];if(AIRPORTS&&AIRPORTS[h])return h}
  const c=(AIRLINE_ICAO||{})[al];let best="",n=0;
  if(c&&SCHED&&SCHED.idx&&SCHED.idx[c])for(const [ap,list] of Object.entries(SCHED.idx[c]))if(AIRPORTS&&AIRPORTS[ap]&&list.length>n){n=list.length;best=ap}
  if(!best){const a=fleet.find(x=>x.airline===al);best=(a&&typeof hubFor==="function"&&hubFor(a))||""}
  return best}
/* 1) último voo: aplicado uma vez por piloto, quando não há escala gerada e a partida não foi escolhida por ele */
function sdApplyLast(){if(typeof view==="undefined"||view!=="roster"||!session||RS.roster||SD.manual||SD.lastFor===myId)return;
  if(!SD.flightsLoaded&&!(data.flights&&data.flights.length))return;const arr=sdLastArr();SD.lastFor=myId;if(!arr||arr===RS.dep)return;
  RS.dep=arr;RS.depSet=true;RS.pf=null;if(RS.ac&&locAt(RS.ac,Math.max(RS.start||0,Date.now()))&&locAt(RS.ac,Math.max(RS.start||0,Date.now()))!==arr)RS.ac="";SD.note={kind:"last",icao:arr}}
if(typeof load==="function"){const sdLoad=load;load=async function(tb){const r=await sdLoad.apply(this,arguments);if(tb==="flights"){SD.flightsLoaded=true;if(typeof view!=="undefined"&&view==="roster")render()}return r}}
if(typeof render==="function"){const sdRender=render;render=function(){try{sdApplyLast()}catch(e){}return sdRender.apply(this,arguments)}}
/* 2) companhia escolhida na Escala livre */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action="alpick-pick"][data-k="rs"]');if(!b)return;
  const al=b.dataset.v,from=RS.dep;if(!al||al==="all"||!AIRPORTS||!AIRPORTS[from]||sdServes(al,from)){SD.note=null;return}
  const hub=sdHub(al);if(!hub||hub===from){SD.note=null;return}
  if(SD.manual){SD.note={kind:"suggest",al,from,icao:hub};render();return}
  RS.dep=hub;RS.depSet=true;RS.pf=null;SD.note={kind:"moved",al,from,icao:hub};render()});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action="sd-use"]');if(!b)return;e.preventDefault();
  RS.dep=b.dataset.v;RS.depSet=true;RS.pf=null;SD.note=null;render()});
function sdNoteHTML(){const N=SD.note;if(!N||RS.roster)return"";if(N.kind!=="suggest"&&RS.dep!==N.icao){SD.note=null;return""}
  if(N.kind==="last")return`<div class="fa-rpl-bar sd-note"><span aria-hidden="true">📍</span><span>${esc(sdt("sd_last",{icao:N.icao}))}</span></div>`;
  if(N.kind==="moved")return`<div class="fa-rpl-bar sd-note">${alSym(N.al)}<span>${esc(sdt("sd_moved",{icao:N.icao,al:N.al,from:N.from}))}</span></div>`;
  if(RS.dep!==N.from||ACP.rs.al!==N.al){SD.note=null;return""}
  return`<div class="fa-rpl-bar sd-note">${alSym(N.al)}<span>${esc(sdt("sd_suggest",{icao:N.icao,al:N.al,from:N.from}))}</span><button type="button" class="btn small" data-action="sd-use" data-v="${esc(N.icao)}">${esc(sdt("sd_use",{icao:N.icao}))}</button></div>`}
if(typeof rsAcfHTML==="function"){const sdAcf=rsAcfHTML;rsAcfHTML=function(){return sdNoteHTML()+sdAcf.apply(this,arguments)}}
/* Animação ao gerar a escala (painel de partidas + rota desenhada): para cada voo, o cartão entra, a origem e o horário
   giram no painel, a barra do voo na linha do tempo enche e o avião voa até o destino; ao chegar, o destino, o horário
   de chegada e o número do voo giram e param. Só ao gerar; desligada com "reduzir movimento". */
const SC_ANIM={L:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",D:"0123456789",step:1500};
function scFlapEl(el,delay){if(!el)return;const fin=el.textContent;if(!fin.trim())return;
  el.classList.add("sc-flap");el.innerHTML=[...fin].map(c=>`<span>${esc(c)}</span>`).join("");
  const chs=[...el.children];let left=chs.length;
  chs.forEach((ch,ci)=>{const f=ch.textContent;if(!/[A-Z0-9]/.test(f)){if(!--left)done();return}const pool=/[0-9]/.test(f)?SC_ANIM.D:SC_ANIM.L;
    let k=0;const steps=7+Math.floor(Math.random()*7);ch.textContent=pool[Math.floor(Math.random()*pool.length)];
    setTimeout(function tick(){if(!ch.isConnected)return;ch.classList.remove("f");void ch.offsetWidth;ch.classList.add("f");
      if(++k>=steps){ch.textContent=f;if(!--left)setTimeout(done,120);return}ch.textContent=pool[Math.floor(Math.random()*pool.length)];setTimeout(tick,55)},delay+ci*35)});
  function done(){if(el.isConnected){el.textContent=fin;el.classList.remove("sc-flap")}}}
function scPlane(card,delay,dur){const b=card.querySelector(".bpc-line b"),line=card.querySelector(".bpc-line");if(!b||!line)return;
  b.style.left="0%";line.style.setProperty("--sc-draw","0%");line.classList.add("sc-draw");
  setTimeout(()=>{const t0=performance.now();(function f(now){if(!b.isConnected)return;const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);
    b.style.left=(e*100)+"%";line.style.setProperty("--sc-draw",(e*100)+"%");if(p<1)requestAnimationFrame(f);else setTimeout(()=>{b.style.left="";line.classList.remove("sc-draw")},250)})(t0)},delay)}
function flapAnimate(){
  if(typeof RS==="undefined"||!RS.flapAnim)return;RS.flapAnim=false;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const out=document.querySelector(".rs-out");if(!out)return;
  const cards=[...out.querySelectorAll(".bpc")],flys=[...out.querySelectorAll(".sct-seg.fly")];if(!cards.length)return;
  cards.forEach((card,i)=>{const t0=i*SC_ANIM.step;
    card.classList.add("sc-hide");const dest=card.querySelector(".bpc-ap.r");if(dest)dest.classList.add("sc-hide");
    const fly=flys[i];if(fly){fly.classList.add("sc-fill");fly.style.animationDelay=(t0+250)+"ms"}
    setTimeout(()=>{card.classList.remove("sc-hide");card.classList.add("sc-in");
      const org=card.querySelector(".bpc-ap:not(.r)");scFlapEl(org&&org.querySelector(".bpc-code"),80);scFlapEl(org&&org.querySelector(".bpc-time b"),140)},t0);
    scPlane(card,t0+300,900);
    setTimeout(()=>{if(dest){dest.classList.remove("sc-hide");dest.classList.add("sc-in");scFlapEl(dest.querySelector(".bpc-code"),0);scFlapEl(dest.querySelector(".bpc-time b"),60)}
      scFlapEl(card.querySelector(".bpc-fn"),40)},t0+1200)})}
