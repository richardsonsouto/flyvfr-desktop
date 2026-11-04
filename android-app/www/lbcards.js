/* lbcards.js — Diário de bordo (logbook do piloto), parte de baixo:
   • quatro resumos lado a lado (tipo, companhia, simulador, matrícula), cada um com as 3 maiores e "ver todos";
   • voos em cartões: faixa azul quando conta, âmbar quando não conta (com o motivo escrito), rota com as cidades,
     matrícula + tipo, calço, pouso medido, simulador e botão para o Diário técnico da aeronave;
   • busca na lista e "mostrar mais" de 30 em 30.
   Troca só o final de lbPilotView (app.js); o cabeçalho, os números e a patente continuam iguais. */
(function(){
 if(typeof lbPilotView!=="function")return;
 const T={
  type:["By type","Por tipo","Por tipo","Par type","Nach Typ","機種別","按机型","기종별"],
  airline:["By airline","Por companhia","Por aerolínea","Par compagnie","Nach Airline","航空会社別","按航空公司","항공사별"],
  sim:["By simulator","Por simulador","Por simulador","Par simulateur","Nach Simulator","シミュレーター別","按模拟器","시뮬레이터별"],
  reg:["Registrations","Matrículas","Matrículas","Immatriculations","Kennzeichen","登録記号","注册号","등록번호"],
  all:["see all","ver todos","ver todos","tout voir","alle","すべて表示","查看全部","모두 보기"],
  less:["see less","ver menos","ver menos","voir moins","weniger","閉じる","收起","접기"],
  flights:["Flights","Voos","Vuelos","Vols","Flüge","フライト","航班","비행"],
  count:["{n} flights · {c} count toward hours","{n} voos · {c} contam nas horas","{n} vuelos · {c} cuentan para horas","{n} vols · {c} comptent dans les heures","{n} Flüge · {c} zählen für Stunden","{n} 便 · 時間に算入 {c}","{n} 个航班 · {c} 个计入时长","{n}편 · 시간 인정 {c}편"],
  search:["Search route, registration, flight…","Buscar rota, matrícula, voo…","Buscar ruta, matrícula, vuelo…","Chercher route, immatriculation, vol…","Route, Kennzeichen, Flug suchen…","ルート・登録記号・便名で検索…","搜索航线、注册号、航班…","노선·등록번호·편명 검색…"],
  blk:["Block","Calço","Calzos","Cales","Block","ブロック","轮挡","블록"],
  ac:["Aircraft","Aeronave","Aeronave","Avion","Flugzeug","機体","飞机","기체"],
  land:["Landing","Pouso","Aterrizaje","Atterrissage","Landung","着陸","着陆","착륙"],
  status:["Status","Situação","Estado","Statut","Status","状態","状态","상태"],
  nc:["Doesn't count · no tracking","Não conta · sem rastreio","No cuenta · sin rastreo","Ne compte pas · sans suivi","Zählt nicht · ohne Tracking","算入なし · 追跡なし","不计入 · 无跟踪","미인정 · 추적 없음"],
  nofpm:["not measured","sem medição","sin medición","non mesuré","nicht gemessen","未計測","未测量","미측정"],
  more:["Show {n} more","Mostrar mais {n}","Mostrar {n} más","Afficher {n} de plus","{n} weitere zeigen","さらに {n} 件","再显示 {n} 个","{n}개 더 보기"],
  none:["No flight matches the search.","Nenhum voo encontrado na busca.","Ningún vuelo coincide.","Aucun vol ne correspond.","Kein Flug gefunden.","該当するフライトはありません。","没有匹配的航班。","검색 결과가 없습니다."],
  c_butter:["Butter","Manteiga","Mantequilla","Beurre","Butterweich","バター","黄油","버터"],c_soft:["Smooth","Suave","Suave","Doux","Sanft","スムーズ","平稳","부드러움"],
  c_norm:["Normal","Normal","Normal","Normal","Normal","普通","正常","보통"],c_firm:["Firm","Firme","Firme","Ferme","Fest","やや強め","偏硬","단단함"],c_hard:["Hard","Duro","Duro","Dur","Hart","ハード","重着陆","거침"]};
 const ct=(k,p)=>{let s=(T[k][LANGS.indexOf(lang)]||T[k][0]);if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
 const ST={open:{},q:"",shown:30,pid:null};
 const city=c=>{try{const a=AIRPORTS&&AIRPORTS[c];return a&&(a[4]||a[3])||""}catch(e){return""}};
 let apAsk=false;
 const land=v=>{const c=v<=100?["c_butter","ok","🧈 "]:v<=200?["c_soft","ok",""]:v<=350?["c_norm","neutral",""]:v<=500?["c_firm","warn",""]:["c_hard","bad",""];
  return`<span class="lbc-chip ${c[1]}">${c[2]}${v} fpm · ${esc(ct(c[0]))}</span>`};
 function groups(all,key){const m={};for(const f of all){const k=key(f);if(!k)continue;(m[k]=m[k]||{k,min:0,n:0}).min+=f.blockMin||0;m[k].n++}return Object.values(m).sort((a,b)=>b.min-a.min||b.n-a.n)}
 function sumCard(id,title,list,label){const open=!!ST.open[id],max=list.length?Math.max(1,list[0].min):1,rows=open?list:list.slice(0,3);
  return`<div class="lbc-sum"><div class="lbc-sh"><h4>${esc(title)}</h4>${list.length>3?`<button type="button" class="linkish" data-action="lbc-more" data-k="${id}">${esc(ct(open?"less":"all"))} ${open?"‹":"›"}</button>`:""}</div>
   ${rows.length?rows.map(r=>`<div class="lbc-r"><div class="lbc-l">${label(r.k)}</div><span class="lbc-h mono">${block(r.min)}</span><div class="lbc-bar"><i style="width:${Math.max(3,r.min/max*100).toFixed(1)}%"></i></div><span class="lbc-n mono">${r.n}</span></div>`).join("")
    :`<p class="muted lbc-empty">—</p>`}</div>`}
 function card(f,nos){const a=acById(f.aircraftId),ok=counts(f),code=a?(icaoType(a.type)||a.type||""):"",fno=fnoOf(f);
  const q=[f.dep,f.arr,city(f.dep),city(f.arr),a&&a.registration,a&&a.type,code,a&&a.airline,fno].filter(Boolean).join(" ").toLowerCase();
  const cd=city(f.dep),ca=city(f.arr);
  return`<div class="lbc-f${ok?"":" nv"}" data-q="${esc(q)}"><span class="lbc-st" aria-hidden="true"></span>
   <div class="lbc-rt"><div class="lbc-route">${fno?`<span class="fno-chip">${esc(fno)}</span>`:""}<b class="mono">${esc(f.dep)} → ${esc(f.arr)}</b></div>
    <small>${dateF(f.createdAt)}${cd||ca?` · ${esc(cd||f.dep)} → ${esc(ca||f.arr)}`:""}</small></div>
   <div class="lbc-kv"><small>${esc(ct("ac"))}</small><span class="lbc-ac">${regTag(a,f.aircraftId)}<span class="muted mono">${esc(code)}</span></span></div>
   <div class="lbc-kv"><small>${esc(ct("blk"))}</small><b class="mono">${block(f.blockMin||0)}</b></div>
   <div class="lbc-kv"><small>${esc(ok?ct("land"):ct("status"))}</small>${ok?(Number.isFinite(f.landingFpm)&&f.landingFpm>0?land(Math.round(f.landingFpm)):`<span class="lbc-chip neutral">${esc(ct("nofpm"))}</span>`)
     :`<span class="lbc-chip warn" title="${esc(t("nv_chip_t"))}">${esc(ct("nc"))}</span>`}</div>
   <div class="lbc-kv lbc-sim"><small>${esc(t("simulator"))}</small><span>${esc(simName(f.simulator))}</span></div>
   <button type="button" class="btn small lbc-tl" data-action="open-aircraft" data-id="${esc(f.aircraftId)}" title="${esc(t("open_log"))}">TL ${String(nos[f.id]||0).padStart(4,"0")} ›</button>
   ${ok?"":`<p class="lbc-why">⚠ ${esc(t("nv_chip_t"))}</p>`}</div>`}
 function bottom(pid){
  const every=data.flights.filter(f=>f.pilotId===pid).sort((a,b)=>b.createdAt-a.createdAt),all=every.filter(counts),nos=tlNumbers();
  if(!every.length)return null;
  if(typeof AIRPORTS!=="undefined"&&!AIRPORTS&&!apAsk&&typeof loadAirports==="function"){apAsk=true;loadAirports().then(()=>{try{if(view==="logbook")render()}catch(e){}}).catch(()=>{})}
  if(ST.pid!==pid){ST.pid=pid;ST.q="";ST.shown=30;ST.open={}}
  const ac=f=>acById(f.aircraftId),typeKey=f=>{const a=ac(f);return(a&&(icaoType(a.type)||a.type))||""},typeName={};
  all.forEach(f=>{const k=typeKey(f),a=ac(f);if(k&&!typeName[k])typeName[k]=a?a.type:k});
  const sums=`<div class="lbc-sums">
   ${sumCard("type",ct("type"),groups(all,typeKey),k=>`${typeof aircraftManufacturerIcon==="function"?aircraftManufacturerIcon(typeName[k]):""}<span class="lbc-tx"><b class="mono">${esc(k)}</b> <span class="muted">${esc(typeName[k]&&typeName[k]!==k?typeName[k]:"")}</span></span>`)}
   ${sumCard("airline",ct("airline"),groups(all,f=>ac(f)?.airline),k=>`${alSym(k)}<span class="lbc-tx">${esc(k)}</span>`)}
   ${sumCard("sim",ct("sim"),groups(all,f=>f.simulator),k=>`<span class="lbc-tx">${esc(simName(k))}</span>`)}
   ${sumCard("reg",ct("reg"),groups(all,f=>f.aircraftId),k=>regTag(acById(k),k))}</div>`;
  const list=every.slice(0,ST.shown);
  return`${sums}<div class="panel lbc-panel"><div class="sec-head"><h3>${esc(ct("flights"))}</h3><span class="muted lbc-cnt">${esc(ct("count",{n:every.length,c:all.length}))}</span>
    <input type="search" class="lbc-q" placeholder="${esc(ct("search"))}" value="${esc(ST.q)}" aria-label="${esc(ct("search"))}"></div>
   <div class="lbc-list">${list.map(f=>card(f,nos)).join("")}</div><p class="muted lbc-none" hidden>${esc(ct("none"))}</p>
   ${every.length>ST.shown?`<button type="button" class="btn lbc-moreb" data-action="lbc-show">${esc(ct("more",{n:Math.min(30,every.length-ST.shown)}))}</button>`:""}</div>`}
 function applyQ(){const box=document.querySelector(".lbc-list");if(!box)return;const q=ST.q.trim().toLowerCase();let n=0;
  box.querySelectorAll(".lbc-f").forEach(c=>{const ok=!q||c.dataset.q.includes(q);c.hidden=!ok;if(ok)n++});
  const no=document.querySelector(".lbc-none");if(no)no.hidden=n>0}
 const orig=lbPilotView;
 lbPilotView=function(pid){const h=orig.apply(this,arguments);try{const i=h.indexOf('<div class="lb-grid">');if(i<0)return h;const b=bottom(pid);return b?h.slice(0,i)+b:h}catch(e){console.warn(e);return h}};
 if(typeof render==="function"){const r0=render;render=function(){const r=r0.apply(this,arguments);try{if(ST.q)applyQ()}catch(e){}return r}}
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action="lbc-more"],[data-action="lbc-show"]');if(!b)return;
  if(b.dataset.action==="lbc-more")ST.open[b.dataset.k]=!ST.open[b.dataset.k];else{ST.shown+=30;if(ST.q)ST.shown=1e9}render()});
 document.addEventListener("input",e=>{if(!e.target.classList||!e.target.classList.contains("lbc-q"))return;ST.q=e.target.value;
  /* com busca, todos os voos entram na lista (a busca não fica limitada aos 30 primeiros) */
  if(ST.q&&ST.shown<1e9&&document.querySelector(".lbc-moreb")){ST.shown=1e9;const pos=e.target.selectionStart;render();const i=document.querySelector(".lbc-q");if(i){i.focus();try{i.setSelectionRange(pos,pos)}catch(x){}}}
  applyQ()});
 const css=`.lbc-sums{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
.lbc-sum{background:var(--sheet);border:1px solid var(--line);border-radius:10px;padding:14px 16px;min-width:0}
.lbc-sh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px}.lbc-sh h4{font:700 1.15rem var(--f-display);margin:0}.lbc-sh .linkish{font-size:.78rem;white-space:nowrap}
.lbc-r{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"l h" "b n";column-gap:10px;row-gap:3px;align-items:center;padding:6px 0}
.lbc-r+.lbc-r{border-top:1px solid var(--line)}
.lbc-l{grid-area:l;display:flex;align-items:center;gap:8px;min-width:0;font-size:.86rem}.lbc-l img{max-height:22px;width:auto}
.lbc-tx{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lbc-h{grid-area:h;font-weight:600;font-size:.9rem}
.lbc-bar{grid-area:b;height:6px;border-radius:4px;background:var(--sunk);overflow:hidden}.lbc-bar i{display:block;height:100%;border-radius:4px;background:#0B6A93}
.lbc-n{grid-area:n;font-size:.74rem;color:var(--muted);text-align:right}.lbc-empty{margin:4px 0}
.lbc-panel .sec-head{gap:12px;flex-wrap:wrap}.lbc-cnt{font-size:.86rem;flex:1;min-width:160px}
.lbc-q{width:min(280px,100%);padding:7px 12px;border:1px solid var(--line);border-radius:8px;background:var(--sheet);color:var(--ink);font:inherit;font-size:.88rem}
.lbc-list{display:grid;gap:10px;margin-top:6px}
.lbc-f{position:relative;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1.1fr) 104px minmax(0,1fr) minmax(0,1fr) auto;gap:6px 18px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:12px 16px 12px 20px;overflow:hidden;background:var(--sheet)}
.lbc-st{position:absolute;left:0;top:0;bottom:0;width:4px;background:#0B6A93}.lbc-f.nv .lbc-st{background:#D9A93A}
.lbc-route{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.lbc-route b{font-size:1.05rem}.lbc-rt small{display:block;color:var(--muted);font-size:.8rem;margin-top:2px}
.lbc-kv{min-width:0}.lbc-kv>small{display:block;font-size:.66rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lbc-kv>b{font-size:1rem}.lbc-ac{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.lbc-ac .muted{font-size:.8rem}
.lbc-sim span{font-size:.84rem;display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}.lbc-sim img{max-height:18px;width:auto}
.lbc-chip{display:inline-block;font:600 .74rem var(--f-mono);padding:3px 9px;border-radius:12px;white-space:nowrap}
.lbc-chip.ok{background:var(--ok-bg);color:var(--ok)}.lbc-chip.warn{background:var(--warn-bg);color:var(--warn)}.lbc-chip.bad{background:var(--bad-bg);color:var(--bad)}.lbc-chip.neutral{background:var(--sunk);color:var(--muted)}
.lbc-tl{font-family:var(--f-mono);white-space:nowrap}
.lbc-why{grid-column:1/-1;margin:0;font-size:.78rem;color:var(--warn)}
.lbc-f.nv .lbc-route b,.lbc-f.nv .lbc-kv>b{color:var(--muted)}
.lbc-moreb{margin:12px auto 0;display:block}
:root[data-theme="dark"] .lbc-bar i,:root[data-theme="dark"] .lbc-st{background:#4FB3DE}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .lbc-bar i,:root:not([data-theme="light"]) .lbc-st{background:#4FB3DE}}
:root[data-theme="dark"] .lbc-f.nv .lbc-st{background:#D9A93A}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .lbc-f.nv .lbc-st{background:#D9A93A}}
@media (max-width:1100px){.lbc-sums{grid-template-columns:repeat(2,minmax(0,1fr))}.lbc-f{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) 96px minmax(0,1fr) auto}.lbc-sim{display:none}}
@media (max-width:640px){.lbc-sums{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:86%;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px}.lbc-sum{scroll-snap-align:start}.lbc-f{grid-template-columns:minmax(0,1fr) auto;gap:10px 12px;padding:12px 14px 12px 18px}.lbc-rt{grid-column:1/-1}.lbc-tl{grid-column:2;grid-row:1}.lbc-rt{grid-column:1;grid-row:1}.lbc-q{width:100%}}`;
 const st=document.createElement("style");st.id="lbcards-css";st.textContent=css;document.head.appendChild(st);
})();
