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
/* Escala: o aeródromo de partida (e o aviso de partida) fica no topo, acima de Escala livre e Escala RPL */
function scMoveDep(){if(typeof view==="undefined"||view!=="roster")return;const top=document.querySelector("#f-rs .rs-top-fields"),mode=document.querySelector(".rs-mode-field");
  /* Escala RPL é a prioridade: vem antes da Escala livre */
  const ms=mode&&mode.querySelector(".rs-modes"),rpl=ms&&ms.querySelector(":scope>.rs-rpl-option");if(rpl&&ms.firstElementChild!==rpl)ms.prepend(rpl);
  if(!top||!mode)return;top.classList.add("rs-top-moved");mode.before(top);const n=mode.parentElement.querySelector(".sd-note");if(n){n.classList.add("rs-top-note");top.append(n)}}
/* piloto de companhia: ao abrir o menu Escala, começa sempre na Escala RPL (se não houver RPL na partida, o app volta sozinho para a livre).
   Não mexe se já há escala gerada, se veio de "voar esta aeronave" (escala livre) ou se o piloto é freelancer. */
const RPLF={want:true};
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest('[data-view="roster"],[data-action="go-roster"]');if(!el)return;
  RPLF.want=!(el.dataset.free==="1"||el.dataset.ac)},true);
function rplFirst(){if(!RPLF.want||typeof view==="undefined"||view!=="roster")return;RPLF.want=false;
  if(typeof RS==="undefined"||RS.roster||RS.busy||!RS.other)return;if(typeof FL!=="undefined"&&FL.mode==="freelancer")return;
  RS.other=false;RS.pf=null;RS.ac="";RS.err="";if(typeof rsSoonest==="function")RS.start=rsSoonest()}
if(typeof render==="function"){const rplRender=render;render=function(){try{rplFirst()}catch(e){}return rplRender.apply(this,arguments)}}
if(typeof render==="function"){const scDepRender=render;render=function(){const r=scDepRender.apply(this,arguments);try{scMoveDep()}catch(e){}return r}}
/* Escala: o aeródromo de partida ganha imagem de satélite (com vento e cabeceira favorecida por cima)
   e uma faixa com cidade, tempo (VFR/IFR), pista, vento e saídas RPL das próximas 6 h */
const DV_T={zoom:["Tap to enlarge","Toque para ampliar","Toque para ampliar","Touchez pour agrandir","Zum Vergrößern tippen","タップで拡大","点击放大","탭하여 확대"],close:["Close","Fechar","Cerrar","Fermer","Schließen","閉じる","关闭","닫기"],rwy:["Runway","Pista","Pista","Piste","Piste","滑走路","跑道","활주로"],wind:["Wind","Vento","Viento","Vent","Wind","風","风","바람"],
 fav:["favours","favorece","favorece","favorise","begünstigt","有利:","有利于","유리:"],head:["headwind","proa","de frente","de face","Gegenwind","向かい風","顶风","정풍"],
 calm:["calm","calmo","calma","calme","Windstille","静穏","静风","무풍"],vrb:["variable","variável","variable","variable","umlaufend","不定","不定","가변"],
 rpl:["{n} RPL departures in the next 6 h","{n} saídas RPL nas próximas 6 h","{n} salidas RPL en las próximas 6 h","{n} départs RPL dans les 6 prochaines heures","{n} RPL-Abflüge in den nächsten 6 Std.","今後6時間のRPL出発 {n} 便","未来 6 小时 RPL 离港 {n} 班","향후 6시간 RPL 출발 {n}편"]};
const dvT=(k,p)=>{let s=(DV_T[k]||[])[LANGS.indexOf(lang)]||(DV_T[k]||[])[0]||k;if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
const DV={wx:{},rw:false};
function dvWind(metar){const m=/\b(\d{3}|VRB)(\d{2,3})(?:G\d{2,3})?(KT|MPS)\b/.exec(metar||"");if(!m)return null;let s=+m[2];if(m[3]==="MPS")s=Math.round(s*1.944);return{dir:m[1]==="VRB"?null:+m[1],spd:s}}
function dvFav(ident,w){if(!ident||!w||w.dir==null||!w.spd)return null;const [a,b]=String(ident).split("/");const h=parseInt(a,10);if(!(h>=1&&h<=36)||!b)return null;
  const c=Math.round(w.spd*Math.cos((w.dir-h*10)*Math.PI/180));return{end:c>=0?a:b,kt:Math.abs(c)}}
function dvRplCount(icao){try{if(!SCHED||!SCHED.idx||typeof realDeps!=="function")return 0;const t0=Date.now(),t1=t0+6*36e5;let n=0;
  for(const code in SCHED.idx){if((SCHED.idx[code]||{})[icao])n+=realDeps(code,icao,t0,t1).length}return n}catch(e){return 0}}
/* satélite do aeródromo: enquadra TODAS as pistas (cabeceiras do OurAirports em rwyends.json) com zoom fracionado;
   cabeceiras rotuladas, a favorecida pelo vento em verde; sem dados de pista, centra no ponto do aeródromo */
const dvW=(lat,lon)=>{const r=lat*Math.PI/180;return[(lon+180)/360*256,(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*256]};
function dvEnds(icao){if(DV.ends)return DV.ends[icao]||null;if(!DV.endsP)DV.endsP=fetch("rwyends.json?v=569").then(r=>r.ok?r.json():null).then(j=>{DV.ends=(j&&j.ends)||{};try{scDepVisual()}catch(e){}}).catch(()=>{DV.ends={}});return null}
function dvSat(icao,ap,rw,W,H,fav){W=W||156;H=H||104;const ends=dvEnds(icao)||[],pts=[];ends.forEach(e=>{pts.push(dvW(e[1],e[2]),dvW(e[4],e[5]))});
  let zf;const c=[0,0];
  if(pts.length){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    c[0]=(x0+x1)/2;c[1]=(y0+y1)/2;const dx=Math.max(x1-x0,1e-6),dy=Math.max(y1-y0,1e-6);
    zf=Math.min(Math.log2(W*.74/dx),Math.log2(H*.62/dy),16.5);c[1]+=6/(2**zf)}   /* desce um pouco: espaço para o chip embaixo */
  else{const p=dvW(ap[0],ap[1]);c[0]=p[0];c[1]=p[1];zf=rw&&rw.m>=3000?13:14}
  zf=Math.max(10,zf);const z=Math.min(18,Math.ceil(zf)),s=2**(zf-z),n=2**z,cx=c[0]*n,cy=c[1]*n;
  const hw=W/2/s+2,hh=H/2/s+2,tx0=Math.floor((cx-hw)/256),tx1=Math.floor((cx+hw)/256),ty0=Math.max(0,Math.floor((cy-hh)/256)),ty1=Math.min(n-1,Math.floor((cy+hh)/256));let imgs="";
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++)imgs+=`<img alt="" decoding="async" style="left:${(tx*256-cx).toFixed(1)}px;top:${(ty*256-cy).toFixed(1)}px" src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${ty}/${((tx%n)+n)%n}">`;
  let svg="";if(ends.length){const P=(la,lo)=>{const w=dvW(la,lo);return[(w[0]*n-cx)*s+W/2,(w[1]*n-cy)*s+H/2]};const big=W>300,lb=[];
    ends.forEach(e=>{const A=P(e[1],e[2]),B=P(e[4],e[5]),L=Math.hypot(B[0]-A[0],B[1]-A[1])||1,ux=(B[0]-A[0])/L,uy=(B[1]-A[1])/L,o=big?16:11;
      svg+=`<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" class="dv-rl"/>`;
      lb.push({id:e[0],x:A[0]-ux*o,y:A[1]-uy*o},{id:e[3],x:B[0]+ux*o,y:B[1]+uy*o})});
    /* pistas paralelas próximas: as cabeceiras que se sobrepõem viram um rótulo só, com o número (ex.: 02L e 02R → 02) */
    /* rótulos que se encostam: mesma cabeceira (02L/02R) vira um só com o número; cabeceiras diferentes, o segundo desce/sobe */
    const cwL=big?8.8:6.8,pdL=big?12:8,hL=big?18:14,wOf=l=>l.id.length*cwL+pdL,hit=(A,B)=>Math.abs(A.x-B.x)<(wOf(A)+wOf(B))/2+3&&Math.abs(A.y-B.y)<hL+3;
    const keep=l=>big||!fav||parseInt(l.id,10)===parseInt(fav.end,10);for(let k=lb.length-1;k>=0;k--)if(!keep(lb[k]))lb.splice(k,1);
    const clampL=l=>{const w=wOf(l)/2+2;l.x=Math.max(w,Math.min(W-w,l.x));l.y=Math.max(hL/2+2,Math.min(H-hL/2-2,l.y));if(!big&&l.x>W-50&&l.y<46)l.y=48};lb.forEach(clampL);
    for(let pass=0;pass<3;pass++)for(let i=0;i<lb.length;i++)for(let j=i+1;j<lb.length;j++){const A=lb[i],B=lb[j];if(!A||!B||!hit(A,B))continue;
      if(parseInt(A.id,10)===parseInt(B.id,10)){lb[i]={id:String(parseInt(A.id,10)).padStart(2,"0"),x:(A.x+B.x)/2,y:(A.y+B.y)/2};lb[j]=null}
      else{B.y+=(B.y>=A.y&&B.y+hL+4<H?1:-1)*(hL+4);clampL(B)}}
    /* no quadro pequeno só a cabeceira favorecida pelo vento (as outras ficam no ampliado) */
    const favN=fav?parseInt(fav.end,10):NaN;lb.filter(Boolean).filter(l=>big||parseInt(l.id,10)===favN).forEach(({id,x,y})=>{const f=parseInt(id,10)===favN,cw=big?8.8:6.8,pd=big?12:8;
      x=Math.max(id.length*cw/2+pd/2+2,Math.min(W-id.length*cw/2-pd/2-2,x));y=Math.max(big?11:9,Math.min(H-(big?11:9),y));if(!big&&x>W-50&&y<46)y=48;
      svg+=`<g class="dv-th${f?" fav":""}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect x="${(-(id.length*cw+pd)/2).toFixed(1)}" y="${big?-9:-7}" width="${(id.length*cw+pd).toFixed(1)}" height="${big?18:14}" rx="4"/><text y="${big?4.5:3.5}">${esc(id)}</text></g>`});
    svg=`<svg class="dv-ov" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${svg}</svg>`}
  return`<div class="dv-tiles" style="transform:translate(${W/2}px,${H/2}px) scale(${s.toFixed(4)})">${imgs}</div>${svg||'<span class="dv-pin" aria-hidden="true"></span>'}<span class="dv-att">Esri</span>`}
function scDepVisual(){if(typeof view==="undefined"||view!=="roster")return;const top=document.querySelector(".rs-top-moved"),comp=top&&top.querySelector(".rs-origin-compact");if(!comp)return;
  const icao=(RS.dep||"").toUpperCase(),ap=typeof AIRPORTS!=="undefined"&&AIRPORTS&&AIRPORTS[icao];
  let sat=comp.querySelector(".dv-sat"),strip=top.querySelector(".dv-strip");
  if(!ap){sat&&sat.remove();strip&&strip.remove();return}
  const rw=(typeof MAP_TOOLS!=="undefined"&&MAP_TOOLS.runways&&MAP_TOOLS.runways.runways||{})[icao]||null;
  const wx=(typeof WX_CACHE!=="undefined"&&WX_CACHE[icao]&&WX_CACHE[icao].data)||null,w=wx&&dvWind(wx.metar),fav=dvFav(rw&&rw.ident,w);
  const key=icao+"|"+(rw?rw.ident:"")+"|"+(wx?wx.metar:"");
  if(!sat){sat=document.createElement("div");sat.className="dv-sat";comp.insertBefore(sat,comp.querySelector(".rs-dep-info")||null)}
  const sk=icao+"|"+(DV.ends?1:0)+"|"+(fav?fav.end:"");if(sat.dataset.icao!==sk){sat.dataset.icao=sk;const cs=getComputedStyle(sat);sat.innerHTML=dvSat(icao,ap,rw,parseFloat(cs.width),parseFloat(cs.height),fav);sat.dataset.zoom=icao;sat.title=dvT("zoom");sat.hidden=false;sat.querySelectorAll("img").forEach(im=>im.addEventListener("error",()=>{sat.hidden=true},{once:true}))}
  sat.querySelectorAll(".dv-wind,.dv-rchip").forEach(e=>e.remove());
  if(w&&w.dir!=null&&w.spd){const r=(w.dir+90)*Math.PI/180,x1=13-Math.cos(r)*9,y1=13-Math.sin(r)*9,x2=13+Math.cos(r)*9,y2=13+Math.sin(r)*9;
    sat.insertAdjacentHTML("beforeend",`<span class="dv-wind" title="${esc(dvT("wind")+" "+String(w.dir).padStart(3,"0")+"° "+w.spd+" kt")}"><svg viewBox="0 0 26 26"><defs><marker id="dvh" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 6 3 0 6Z" fill="#7fc4ff"/></marker></defs><path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#7fc4ff" stroke-width="2.4" marker-end="url(#dvh)"/></svg></span>`)}
  if(fav)sat.insertAdjacentHTML("beforeend",`<span class="dv-rchip">RWY <i>${esc(fav.end)}</i> · ${esc(dvT("head"))} ${fav.kt} kt</span>`);
  if(!strip){strip=document.createElement("div");strip.className="dv-strip";comp.after(strip)}
  if(strip.dataset.key!==key){strip.dataset.key=key;const pills=[];
    pills.push(`<span class="dv-pill">📍 ${esc(ap[4]||ap[3]||icao)}${ap[5]?` · ${esc(ap[5])}`:""}</span>`);
    if(wx&&wx.fltCat)pills.push(`<span class="dv-pill dv-cat ${esc(wx.fltCat)}">${esc(wx.fltCat)}</span>`);
    if(rw)pills.push(`<span class="dv-pill">🛬 ${esc(dvT("rwy"))} <b>${esc(rw.ident)}</b> · ${Number(rw.m).toLocaleString(LOCALE[lang]||"pt-BR")} m</span>`);
    if(w)pills.push(`<span class="dv-pill">🧭 ${esc(dvT("wind"))} <b>${w.spd?(w.dir==null?dvT("vrb"):String(w.dir).padStart(3,"0")+"°")+" "+w.spd+" kt":dvT("calm")}</b>${fav?` · ${esc(dvT("fav"))} <b>${esc(fav.end)}</b>`:""}</span>`);
    const n=dvRplCount(icao);if(n)pills.push(`<span class="dv-pill">📋 ${esc(dvT("rpl",{n}))}</span>`);
    strip.innerHTML=pills.join("")}
  if(!rw&&!DV.rw&&typeof mapLoadRunways==="function"){DV.rw=true;mapLoadRunways().then(()=>scDepVisual()).catch(()=>{})}
  if(!wx&&!DV.wx[icao]&&typeof fetchWx==="function"){DV.wx[icao]=1;fetchWx(icao).then(()=>scDepVisual()).catch(()=>{})}}
/* satélite ampliado: toque no quadro abre o aeródromo inteiro em tamanho grande, com as cabeceiras e o vento */
function dvBig(){const icao=(RS.dep||"").toUpperCase(),ap=AIRPORTS&&AIRPORTS[icao];if(!ap)return;document.querySelectorAll(".dv-modal").forEach(x=>x.remove());
  const rw=(typeof MAP_TOOLS!=="undefined"&&MAP_TOOLS.runways&&MAP_TOOLS.runways.runways||{})[icao]||null,wx=(typeof WX_CACHE!=="undefined"&&WX_CACHE[icao]&&WX_CACHE[icao].data)||null,w=wx&&dvWind(wx.metar),fav=dvFav(rw&&rw.ident,w);
  const W=Math.min(720,innerWidth-32),H=Math.round(Math.min(W*.66,innerHeight-140)),m=document.createElement("div");m.className="dv-modal";
  m.innerHTML=`<div class="dv-mbox" role="dialog" aria-modal="true" aria-label="${esc(icao)}"><div class="dv-mhd"><b>${esc(icao)}</b><span>${esc(ap[3]||"")}${ap[4]?` · ${esc(ap[4])}`:""}</span><button type="button" class="btn small" data-action="dv-close">${esc(dvT("close"))}</button></div><div class="dv-sat dv-big" style="width:${W}px;height:${H}px">${dvSat(icao,ap,rw,W,H,fav)}</div></div>`;
  const big=m.querySelector(".dv-big");const ws=document.querySelector(".rs-top-moved .dv-sat .dv-wind"),rc=document.querySelector(".rs-top-moved .dv-sat .dv-rchip");if(ws)big.appendChild(ws.cloneNode(true));if(rc)big.appendChild(rc.cloneNode(true));
  document.body.appendChild(m);m.querySelector('[data-action="dv-close"]').focus()}
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;if(t.closest('[data-action="dv-close"]')||t.classList.contains("dv-modal")){document.querySelectorAll(".dv-modal").forEach(x=>x.remove());return}
  const s=t.closest(".rs-top-moved .dv-sat");if(s){e.preventDefault();dvBig()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".dv-modal").forEach(x=>x.remove())});
if(typeof render==="function"){const dvRender=render;render=function(){const r=dvRender.apply(this,arguments);try{scDepVisual()}catch(e){}return r}}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="rs-dep")setTimeout(()=>{try{scDepVisual()}catch(x){}},80)});
document.addEventListener("change",e=>{if(e.target&&e.target.id==="rs-dep")setTimeout(()=>{try{scDepVisual()}catch(x){}},80)});
