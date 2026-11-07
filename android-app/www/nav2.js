/* nav2.js — Navegação:
   • menu lateral agrupado pelas fases do voo (Planejar · Voar · Registrar · Comunidade · Ajuda), com atalho de Ranking;
   • busca rápida (Ctrl+K / ⌘K ou o botão "Buscar"): aeronaves, voos, aeroportos, pilotos, telas e ações;
   • no celular, barra de baixo com o botão redondo "Voar", que faz a coisa certa na hora certa:
     sem voo → Escala; antes do voo → Briefing; a partir da hora de iniciar → rastreamento; em voo → rastreamento ao vivo;
     depois do pouso → reporte. Substitui a barra simples do Início. */
(function(){
 if(typeof paintChrome!=="function"||typeof render!=="function")return;
 const T={
  plan:["Plan","Planejar","Planificar","Planifier","Planen","計画","计划","계획"],
  fly:["Fly","Voar","Volar","Voler","Fliegen","飛ぶ","飞行","비행"],
  log:["Record","Registrar","Registrar","Consigner","Erfassen","記録","记录","기록"],
  comm:["Community","Comunidade","Comunidad","Communauté","Community","コミュニティ","社区","커뮤니티"],
  help:["Help","Ajuda","Ayuda","Aide","Hilfe","ヘルプ","帮助","도움말"],
  rank:["Ranking","Ranking","Ranking","Classement","Rangliste","ランキング","排行榜","순위"],
  search:["Search","Buscar","Buscar","Rechercher","Suchen","検索","搜索","검색"],
  ph:["Registration, airport, pilot, flight or screen…","Matrícula, aeroporto, piloto, voo ou tela…","Matrícula, aeropuerto, piloto, vuelo o pantalla…","Immatriculation, aéroport, pilote, vol ou écran…","Kennzeichen, Flughafen, Pilot, Flug oder Seite…","登録記号・空港・パイロット・便・画面…","注册号、机场、飞行员、航班或页面…","등록번호, 공항, 조종사, 편명 또는 화면…"],
  g_ac:["Aircraft","Aeronaves","Aeronaves","Avions","Flugzeuge","機体","飞机","기체"],
  g_fl:["Your flights","Seus voos","Tus vuelos","Vos vols","Ihre Flüge","あなたの便","您的航班","내 비행"],
  g_ap:["Airports","Aeroportos","Aeropuertos","Aéroports","Flughäfen","空港","机场","공항"],
  g_pi:["Pilots","Pilotos","Pilotos","Pilotes","Piloten","パイロット","飞行员","조종사"],
  g_sc:["Screens and actions","Telas e ações","Pantallas y acciones","Écrans et actions","Seiten und Aktionen","画面と操作","页面和操作","화면 및 작업"],
  none:["Nothing found.","Nada encontrado.","No se encontró nada.","Aucun résultat.","Nichts gefunden.","見つかりませんでした。","没有找到。","결과가 없습니다."],
  k_nav:["navigate","navegar","navegar","naviguer","navigieren","移動","导航","이동"],k_open:["open","abrir","abrir","ouvrir","öffnen","開く","打开","열기"],k_close:["close","fechar","cerrar","fermer","schließen","閉じる","关闭","닫기"],
  dark:["Switch light/dark theme","Trocar tema claro/escuro","Cambiar tema claro/oscuro","Changer de thème clair/sombre","Hell/Dunkel wechseln","ライト/ダーク切替","切换浅色/深色","라이트/다크 전환"],
  inFleet:["see aircraft here","ver aeronaves aqui","ver aeronaves aquí","voir les avions ici","Flugzeuge hier","ここの機体","查看此处飞机","여기 있는 기체"],
  f_none:["Roster","Escala","Programación","Planning","Umlauf","スケジュール","排班","스케줄"],
  f_pre:["Briefing","Briefing","Briefing","Briefing","Briefing","ブリーフィング","简报","브리핑"],
  f_go:["Start","Iniciar","Iniciar","Démarrer","Starten","開始","开始","시작"],
  f_air:["In flight","Em voo","En vuelo","En vol","Im Flug","飛行中","飞行中","비행 중"],
  f_post:["Report","Reportar","Reportar","Rapport","Bericht","報告","报告","보고"],
  fly_t:["Fly","Voar","Volar","Voler","Fliegen","飛ぶ","飞行","비행"]};
 const nt=k=>(T[k][LANGS.indexOf(lang)]||T[k][0]);
 const M=6e4;
 const IC=d=>typeof _ic==="function"?_ic(d):"";
 const ICON={rank:IC('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>'),
  search:IC('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>'),
  cloud:IC('<path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.5a3.75 3.75 0 0 1 .5 7.47z"/>'),
  play:IC('<path d="M8 5.5v13l10-6.5z"/>'),
  plane:IC('<path d="M21 15.5v-1.8l-7.5-4.7V4a1.5 1.5 0 0 0-3 0v5L3 13.7v1.8l7.5-2.3v4.6l-2 1.5V21l3.5-1 3.5 1v-1.7l-2-1.5v-4.6z"/>'),
  report:IC('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4v2h6V4M9 13l2 2 4-4"/>'),
  cal:IC('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4"/>')};
 /* ---------- 1. menu por fases ---------- */
 const GROUPS=[["plan",["roster","bookings","fleet"]],["fly",["briefing","map","ops"]],["log",["logbook","reviews","catalog"]],["comm",["@rank","events"]],["help",["manual","support","admin"]]];
 function navGroups(){const tabs=document.getElementById("tabs");if(!tabs||!session||recovering)return;
  tabs.querySelectorAll(".tab-sep,.nv-gh,.nv-rank,.nv-search").forEach(x=>x.remove());
  const all=[...tabs.querySelectorAll(":scope>.tab[data-view]")],by=v=>all.find(b=>b.dataset.view===v),used=new Set(),frag=document.createDocumentFragment();
  const add=b=>{if(b&&!used.has(b)){used.add(b);frag.append(b)}};
  const sb=document.createElement("button");sb.type="button";sb.className="tab nv-search";sb.dataset.action="nv-search";sb.title=nt("search")+" (Ctrl+K)";
  sb.innerHTML=`${ICON.search}<span>${esc(nt("search"))}</span><kbd>Ctrl K</kbd>`;frag.append(sb);
  add(by("home"));
  GROUPS.forEach(([g,vs])=>{const items=[];vs.forEach(v=>{if(v==="@rank"){if(by("logbook"))items.push("@rank")}else if(by(v))items.push(by(v))});
   if(g==="help")all.forEach(b=>{if(!used.has(b)&&!GROUPS.some(x=>x[1].includes(b.dataset.view))&&b.dataset.view!=="home")items.push(b)});
   if(!items.length)return;
   const sep=document.createElement("span");sep.className="tab-sep nv-sep";sep.setAttribute("aria-hidden","true");frag.append(sep);
   const h=document.createElement("div");h.className="nv-gh";h.textContent=nt(g);h.setAttribute("aria-hidden","true");frag.append(h);
   items.forEach(b=>{if(b==="@rank"){const r=document.createElement("button");r.type="button";r.className="tab nv-rank";r.dataset.action="nv-rank";r.title=nt("rank");
     const on=view==="logbook"&&typeof lbTab!=="undefined"&&lbTab==="ranking";r.setAttribute("aria-current",on?"page":"false");r.innerHTML=`${ICON.rank}<span>${esc(nt("rank"))}</span>`;frag.append(r);
     if(on){const lb=by("logbook");if(lb)lb.setAttribute("aria-current","false")}}else add(b)})});
  tabs.prepend(frag)}
 const pc=paintChrome;paintChrome=function(){const r=pc.apply(this,arguments);try{navGroups()}catch(e){console.warn(e)}return r};
 /* ---------- 2. busca rápida ---------- */
 const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
 const PAL={open:false,q:"",items:[],sel:0};
 function screens(){const tabs=[...document.querySelectorAll("#tabs .tab")];const out=tabs.map(b=>({k:"sc",label:(b.querySelector("span")||b).textContent.trim(),
   run:b.dataset.view?{view:b.dataset.view}:b.dataset.action==="nv-rank"?{rank:1}:null})).filter(x=>x.run&&x.label);
  out.push({k:"sc",label:nt("dark"),run:{theme:1}});return out}
 function results(q){const n=norm(q).trim(),out=[];const pushG=(g,arr)=>{if(arr.length)out.push({g,arr})};
  const sc=screens().filter(x=>!n||norm(x.label).includes(n)).slice(0,n?6:8);
  if(!n){pushG("g_sc",sc);return out}
  const ac=(typeof fleet!=="undefined"?fleet:[]).filter(a=>norm(a.registration).replace(/-/g,"").includes(n.replace(/-/g,""))||norm(a.type).includes(n)||(n.length>=3&&norm(a.airline).includes(n))).slice(0,6)
   .map(a=>{const st=typeof statusOf==="function"?statusOf(a.id).key:"";return{k:"ac",label:a.registration,sub:[a.type,a.airline].filter(Boolean).join(" · "),tag:st==="bad"?"AOG":st==="warn"?"MEL":"",run:{action:"open-aircraft",id:a.id}}});
  pushG("g_ac",ac);
  const fl=(data.reservations||[]).filter(r=>r.pilotId===myId&&(typeof booked!=="function"||booked(r))&&r.end>Date.now()-6*36e5)
   .filter(r=>norm(`${r.flightNo||""} ${r.dep} ${r.arr} ${(acById(r.aircraftId)||{}).registration||""}`).includes(n)).sort((a,b)=>a.start-b.start).slice(0,4)
   .map(r=>({k:"fl",label:`${(r.flightNo||"").trim()?r.flightNo.trim()+" · ":""}${r.dep} → ${r.arr}`,sub:`${typeof fmt==="function"?fmt(r.start):""} · ${(acById(r.aircraftId)||{}).registration||""}`,run:{view:"bookings"}}));
  pushG("g_fl",fl);
  if(typeof AIRPORTS!=="undefined"){if(!AIRPORTS){if(typeof loadAirports==="function"&&!PAL.apAsk){PAL.apAsk=1;loadAirports().then(()=>{if(PAL.open)paint()}).catch(()=>{})}}
   else if(n.length>=2){const up=n.toUpperCase(),ap=[];for(const c in AIRPORTS){const a=AIRPORTS[c];if(c.startsWith(up)||(n.length>=3&&norm(a&&(a[4]||a[3])).includes(n))){ap.push({k:"ap",label:c,sub:[a&&a[3],a&&a[4]].filter(Boolean).join(" · "),tag:nt("inFleet"),run:{airport:c}});if(ap.length>=5)break}}
    ap.sort((x,y)=>(y.label.startsWith(up))-(x.label.startsWith(up)));pushG("g_ap",ap)}}
  const pi=Object.entries(typeof names!=="undefined"?names:{}).filter(([id,nm])=>nm&&norm(nm).includes(n)).slice(0,4).map(([id,nm])=>({k:"pi",label:nm,run:{pilot:id}}));
  pushG("g_pi",pi);pushG("g_sc",sc);return out}
 function run(r){close();if(!r)return;
  if(r.view){view=r.view;return render()}
  if(r.rank){view="logbook";lbTab="ranking";return render()}
  if(r.theme){const b=document.getElementById("theme");if(b)b.click();return}
  if(r.pilot){view="logbook";lbTab="mine";lbPilot=r.pilot===myId?null:r.pilot;return render()}
  if(r.airport){try{fQuery=r.airport;fLimit=60}catch(e){}view="fleet";return render()}
  if(r.action){const b=document.createElement("button");b.type="button";b.hidden=true;b.dataset.action=r.action;if(r.id)b.dataset.id=r.id;document.body.appendChild(b);b.click();b.remove()}}
 function paint(){const box=document.getElementById("nv-pal");if(!box)return;const groups=results(PAL.q);PAL.items=groups.flatMap(g=>g.arr);if(PAL.sel>=PAL.items.length)PAL.sel=0;
  let i=0;const list=box.querySelector(".nv-list");
  list.innerHTML=groups.length?groups.map(g=>`<div class="nv-g">${esc(nt(g.g))}</div>`+g.arr.map(x=>{const k=i++;
   return`<button type="button" class="nv-it${k===PAL.sel?" sel":""}" data-i="${k}" role="option" aria-selected="${k===PAL.sel}"><span class="nv-l${x.k==="ac"||x.k==="ap"?" mono":""}">${esc(x.label)}</span>${x.sub?`<span class="nv-s">${esc(x.sub)}</span>`:""}${x.tag?`<span class="nv-t${x.tag==="AOG"?" bad":x.tag==="MEL"?" warn":""}">${esc(x.tag)}</span>`:""}</button>`}).join("")).join("")
   :`<p class="nv-none">${esc(nt("none"))}</p>`;
  const s=list.querySelector(".nv-it.sel");if(s&&s.scrollIntoView)s.scrollIntoView({block:"nearest"})}
 function open(){if(!session||recovering)return;let box=document.getElementById("nv-pal");
  if(!box){box=document.createElement("div");box.id="nv-pal";box.className="nv-pal";box.innerHTML=`<div class="nv-card" role="dialog" aria-modal="true" aria-label="${esc(nt("search"))}">
    <div class="nv-in">${ICON.search}<input type="search" placeholder="${esc(nt("ph"))}" autocomplete="off" spellcheck="false" aria-label="${esc(nt("search"))}"><kbd>Esc</kbd></div>
    <div class="nv-list" role="listbox"></div><div class="nv-ft"><span><kbd>↑↓</kbd>${esc(nt("k_nav"))}</span><span><kbd>↵</kbd>${esc(nt("k_open"))}</span><span><kbd>Esc</kbd>${esc(nt("k_close"))}</span></div></div>`;
   document.body.appendChild(box);
   box.addEventListener("mousedown",e=>{if(e.target===box)close()});
   box.querySelector("input").addEventListener("input",e=>{PAL.q=e.target.value;PAL.sel=0;paint()});
   box.querySelector(".nv-list").addEventListener("click",e=>{const b=e.target.closest(".nv-it");if(b)run(PAL.items[+b.dataset.i].run)})}
  PAL.open=true;PAL.q="";PAL.sel=0;box.hidden=false;const inp=box.querySelector("input");inp.value="";paint();setTimeout(()=>inp.focus(),0)}
 function close(){PAL.open=false;const box=document.getElementById("nv-pal");if(box)box.hidden=true}
 document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&(e.key==="k"||e.key==="K")){if(!session||recovering)return;e.preventDefault();PAL.open?close():open();return}
  if(!PAL.open)return;
  if(e.key==="Escape"){e.preventDefault();close()}
  else if(e.key==="ArrowDown"){e.preventDefault();if(PAL.items.length){PAL.sel=(PAL.sel+1)%PAL.items.length;paint()}}
  else if(e.key==="ArrowUp"){e.preventDefault();if(PAL.items.length){PAL.sel=(PAL.sel-1+PAL.items.length)%PAL.items.length;paint()}}
  else if(e.key==="Enter"){e.preventDefault();const it=PAL.items[PAL.sel];if(it)run(it.run)}});
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action="nv-search"],[data-action="nv-rank"],[data-action="nv-fab"]');if(!b)return;
  const a=b.dataset.action;if(a==="nv-search")return open();if(a==="nv-rank"){view="logbook";lbTab="ranking";return render()}
  if(a==="nv-fab"){const s=fabState();return run(s.run)}});
 /* ---------- 3. botão "Voar" no celular ---------- */
 const eobtOf=r=>r.start+(r.rosterId?20*M:0);
 function fabState(){const now=Date.now();
  try{if(typeof TRK!=="undefined"&&TRK.resId){const r=data.reservations.find(x=>x.id===TRK.resId);
    if(r&&(!r.status||r.status==="booked")&&!data.flights.some(f=>f.reservationId===r.id)){
     if(TRK.result&&!TRK.finishing&&TRK.landed)return{k:"post",ic:ICON.report,run:{action:"report",id:r.id}};
     return{k:"air",ic:ICON.plane,run:{action:"trk-open",id:r.id}}}}}catch(e){}
  const mine=(data.reservations||[]).filter(r=>r.pilotId===myId&&(typeof booked!=="function"||booked(r))&&!data.flights.some(f=>f.reservationId===r.id)).sort((a,b)=>a.start-b.start);
  const due=mine.find(r=>r.end<now);if(due)return{k:"post",ic:ICON.report,run:{action:"report",id:due.id}};
  const next=mine.find(r=>eobtOf(r)+45*M>now);
  if(!next)return{k:"none",ic:ICON.cal,run:{view:"roster"}};
  if(typeof trkCanStart==="function"&&trkCanStart(next))return{k:"go",ic:ICON.play,run:{action:"trk-open",id:next.id}};
  return{k:"pre",ic:ICON.cloud,run:typeof briefingEnabled==="function"&&briefingEnabled()?{view:"briefing"}:{view:"bookings"}}}
 /* barra de baixo: todos os itens do menu numa faixa que desliza para o lado (na ordem das fases);
    o botão "Voar" fica fixo no meio, um pouco acima da faixa, para não cobrir nenhum item */
 function barItems(){const tabs=[...document.querySelectorAll("#tabs>.tab")].filter(b=>b.dataset.view||b.dataset.action==="nv-rank"||b.dataset.action==="nv-search");
  if(!tabs.length)return["home","roster","logbook","map"].map(v=>({view:v,label:v==="home"?t("nav_home"):t("nav_"+v),ic:NAV_ICON[v]||"",on:v===view}));
  return tabs.map(b=>{const svg=b.querySelector("svg"),sps=b.querySelectorAll(":scope>span"),sp=sps[sps.length-1];return{view:b.dataset.view||"",action:b.dataset.action||"",label:(sp?sp.textContent:b.title||"").trim(),ic:svg?svg.outerHTML:"",
   on:b.getAttribute("aria-current")==="page",lock:b.classList.contains("tab-off")}})}
 function paintBar(){let bar=document.getElementById("nv-bar");const on=!!(session&&!recovering&&!document.body.classList.contains("is-landing"));
  if(!on){if(bar)bar.remove();document.body.classList.remove("nv-has-bar");return}
  if(!bar){bar=document.createElement("nav");bar.id="nv-bar";bar.className="nv-bar";bar.setAttribute("aria-label","Menu");bar.innerHTML='<div class="nv-strip"></div><button type="button" class="nv-fab" data-action="nv-fab"></button>';document.body.appendChild(bar);
   bar.querySelector(".nv-strip").addEventListener("scroll",e=>{PALBAR.x=e.target.scrollLeft;edge(e.target)},{passive:true})}
  document.body.classList.add("nv-has-bar");const s=fabState(),strip=bar.querySelector(".nv-strip"),items=barItems();
  strip.innerHTML=items.map(x=>`<button type="button" ${x.view?`data-view="${esc(x.view)}"`:`data-action="${esc(x.action)}"`} class="${x.on?"on":""}${x.lock?" off":""}" aria-current="${x.on?"page":"false"}">${x.ic}<span>${esc(x.label)}</span></button>`).join("");
  const f=bar.querySelector(".nv-fab");f.className=`nv-fab nv-${s.k}`;f.setAttribute("aria-label",`${nt("fly_t")}: ${nt("f_"+s.k)}`);f.innerHTML=`${s.ic}<span>${esc(nt("f_"+s.k))}</span>${s.k==="air"?'<i class="nv-ring" aria-hidden="true"></i>':""}`;
  if(PALBAR.v!==view){PALBAR.v=view;const a=strip.querySelector("button.on");if(a){const r=a.offsetLeft-(strip.clientWidth-a.offsetWidth)/2;strip.scrollLeft=Math.max(0,r)}else strip.scrollLeft=PALBAR.x}else strip.scrollLeft=PALBAR.x;
  PALBAR.x=strip.scrollLeft;edge(strip)}
 const PALBAR={x:0,v:null};
 function edge(el){const b=el.parentElement;if(!b)return;b.classList.toggle("nv-more-r",el.scrollLeft+el.clientWidth<el.scrollWidth-4);b.classList.toggle("nv-more-l",el.scrollLeft>4)}
 const rr=render;render=function(){const r=rr.apply(this,arguments);try{paintBar()}catch(e){console.warn(e)}return r};
 setInterval(()=>{try{if(document.getElementById("nv-bar"))paintBar()}catch(e){}},30000);
 const css=`.nv-gh{display:none}
.nv-search kbd{display:none}
@media (min-width:900px){
 :root:not([data-layout]) .nv-gh,:root:is([data-layout="left"],[data-layout="right"]):has(.side:is(:hover,:focus-within)) .nv-gh{display:block;margin:12px 14px 3px;font:700 .68rem var(--f-display);letter-spacing:.16em;text-transform:uppercase;color:var(--side-acc,#F5B800);white-space:nowrap}
 :root:not([data-layout]) .nv-sep,:root:is([data-layout="left"],[data-layout="right"]):has(.side:is(:hover,:focus-within)) .nv-sep{display:none}
 :root:not([data-layout]) .nv-search,:root:is([data-layout="left"],[data-layout="right"]):has(.side:is(:hover,:focus-within)) .nv-search{border:1px solid var(--side-line);margin-bottom:6px}
 :root:not([data-layout]) .nv-search kbd,:root:is([data-layout="left"],[data-layout="right"]):has(.side:is(:hover,:focus-within)) .nv-search kbd{display:inline-block;margin-left:auto;font:600 .64rem var(--f-mono);border:1px solid var(--side-line);border-radius:4px;padding:1px 5px;opacity:.75}}
.nv-pal{position:fixed;inset:0;z-index:2000;background:rgba(8,14,22,.5);display:grid;justify-items:center;align-items:start;padding:min(12vh,90px) 12px 12px}
.nv-pal[hidden]{display:none}
.nv-card{width:min(640px,100%);max-height:min(560px,80vh);display:flex;flex-direction:column;background:var(--sheet);color:var(--ink);border:1px solid var(--line);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden}
.nv-in{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}.nv-in svg{width:20px;height:20px;flex:none;color:var(--muted)}
.nv-in input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--ink);font:inherit;font-size:1.05rem;padding:4px 0}
.nv-in kbd,.nv-ft kbd{font:600 .66rem var(--f-mono);border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:var(--muted)}
.nv-list{overflow:auto;padding:6px 8px}
.nv-g{margin:8px 8px 4px;font-size:.66rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.nv-it{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:8px 10px;color:var(--ink);font:inherit;font-size:.9rem;cursor:pointer}
.nv-it.sel,.nv-it:hover{background:var(--sunk)}.nv-it.sel{box-shadow:inset 3px 0 0 #0B6A93}
.nv-l{font-weight:600;white-space:nowrap}.nv-s{color:var(--muted);font-size:.8rem;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.nv-t{margin-left:auto;font:600 .68rem var(--f-mono);padding:2px 7px;border-radius:10px;background:var(--sunk);color:var(--muted);white-space:nowrap}.nv-t.bad{background:var(--bad-bg);color:var(--bad)}.nv-t.warn{background:var(--warn-bg);color:var(--warn)}
.nv-none{margin:14px 10px;color:var(--muted)}
.nv-ft{display:flex;gap:14px;padding:8px 14px;border-top:1px solid var(--line);font-size:.74rem;color:var(--muted)}.nv-ft kbd{margin-right:4px}
@media (max-width:640px){.nv-ft{display:none}.nv-pal{padding-top:12px}}
.nv-bar{display:none}
@media (max-width:899px){.hm-tabbar{display:none!important}body.hm-has-bar{padding-bottom:0}
 body.nv-has-bar{padding-bottom:calc(150px + env(safe-area-inset-bottom))}body.nv-has-bar .toast{bottom:calc(150px + env(safe-area-inset-bottom))}
 body.nv-has-bar .nv-bar{display:block;position:fixed;left:0;right:0;bottom:0;z-index:60;background:#13202E;padding:0 0 env(safe-area-inset-bottom);box-shadow:0 -2px 10px rgba(0,0,0,.2)}
 .nv-strip{display:flex;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:6px 4px;overscroll-behavior-x:contain}.nv-strip::-webkit-scrollbar{display:none}
 .nv-strip>button{flex:0 0 auto;min-width:72px;max-width:96px;scroll-snap-align:start;background:none;border:0;color:#AEBBC8;display:grid;justify-items:center;gap:2px;font-size:.66rem;line-height:1.15;padding:4px 4px;cursor:pointer;text-align:center}
 .nv-strip>button svg{width:22px;height:22px}.nv-strip>button.on{color:#F5B800}.nv-strip>button.off{opacity:.45}.nv-strip>button span{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .nv-bar:after,.nv-bar:before{content:"";position:absolute;top:0;bottom:env(safe-area-inset-bottom);width:28px;pointer-events:none;opacity:0;transition:opacity .2s}
 .nv-bar:after{right:0;background:linear-gradient(90deg,rgba(19,32,46,0),#13202E 80%)}.nv-bar:before{left:0;z-index:1;background:linear-gradient(270deg,rgba(19,32,46,0),#13202E 80%)}
 .nv-bar.nv-more-r:after,.nv-bar.nv-more-l:before{opacity:1}
 .nv-fab{position:absolute!important;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%);width:64px;height:64px;border-radius:50%!important;border:3px solid #13202E!important;display:grid!important;place-items:center;align-content:center;gap:1px!important;font-weight:700;font-size:.62rem!important;line-height:1.05;padding:0!important;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer}
 .nv-fab svg{width:22px;height:22px}
 .nv-fab.nv-none{background:#E6EBF0;color:#13202E}.nv-fab.nv-pre{background:#F5B800;color:#13202E}.nv-fab.nv-go{background:#0B6A93;color:#fff}.nv-fab.nv-air{background:#1C7448;color:#fff}.nv-fab.nv-post{background:#5B3FB8;color:#fff}
 .nv-ring{position:absolute;inset:-7px;border-radius:50%;border:3px solid #1C7448;animation:nvPulse 1.6s ease-out infinite}
 @keyframes nvPulse{0%{transform:scale(.9);opacity:.8}100%{transform:scale(1.18);opacity:0}}
 @media (prefers-reduced-motion:reduce){.nv-ring{animation:none;opacity:.5}}}`;
 const st=document.createElement("style");st.id="nav2-css";st.textContent=css;document.head.appendChild(st);
})();
