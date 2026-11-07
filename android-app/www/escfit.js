/* escfit.js — Layout combinado da Escala: 3 colunas sem rolagem (desktop ≥ 761 px).
   Coluna 1: aeródromo de origem + seleção de voo + lista de saídas RPL (6 h)
   Coluna 2: aeronave + foto + pinturas
   Coluna 3: configuração (duração, voos/dia, gerar)
   Barra de resumo no rodapé que duplica o botão Gerar.
   No verso (escala gerada): abas de dia, cartões compactos, aviso+aceitar na mesma linha.
   Letras um pouco menores (≈ 93 %). Só em telas ≥ 761 px de largura. */
(function(){
 const T={
   liv:["Liveries ({n})","Pinturas ({n})","Libreas ({n})","Livrées ({n})","Lackierungen ({n})","塗装 ({n})","涂装 ({n})","도색 ({n})"],
   rpl_h:["{n} departures in the next 6 h","{n} saídas nas próximas 6 h","{n} salidas en las próximas 6 h","{n} départs dans les 6 h","{n} Abflüge in 6 Std.","{n} 便 (6時間以内)","{n} 班 (6小时内)","{n}편 (6시간)"],
   no_rpl:["No RPL departures","Sem saídas RPL","Sin salidas RPL","Aucun départ RPL","Keine RPL-Abflüge","RPL出発なし","无RPL出发","RPL출발 없음"],
   pv:["Roster preview","Prévia da escala","Vista previa","Aperçu du planning","Vorschau der Flugfolge","スケジュール プレビュー","排班预览","스케줄 미리보기"],
   pv_total:["Est. total","Total estimado","Total estimado","Total estimé","Geschätzt gesamt","推定合計","预计总数","예상 합계"],
   pv_dep:["First departure","1ª saída","1ª salida","1er départ","Erster Abflug","最初の出発","首次出发","첫 출발"],
   pv_mode:["Mode","Modo","Modo","Mode","Modus","モード","模式","모드"],
   pv_free:["Free","Livre","Libre","Libre","Frei","フリー","自由","자유"],
   pv_dest:["destination","destino","destino","destination","Ziel","目的地","目的地","목적지"],
   pv_varies:["varies","varia","varía","variable","variabel","変動","变动","변동"],
   pv_auto:["auto","auto","auto","auto","auto","自動","自动","자동"],
   pv_flights:["flights","voos","vuelos","vols","Flüge","便","班","편"]
 };
 const ft=(k,p)=>{let s=(T[k][LANGS.indexOf(lang)]||T[k][0]);if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
 const EF={day:0,liv:false,key:""};

 /* ── unfit: desfaz tudo, volta ao layout padrão ── */
 function unfit(v){
   v.classList.remove("ef");
   /* verso */
   v.querySelectorAll(".ef-days").forEach(x=>x.remove());
   v.querySelectorAll(".ef-row,.ef-acc,.ef-foot").forEach(w=>{while(w.firstChild)w.before(w.firstChild);w.remove()});
   const out=v.querySelector(".rs-out");
   if(out){out.querySelectorAll(":scope>section.rs-day").forEach(d=>d.hidden=false);
     const l=out.querySelector(".rs-legs.ef-scroll");if(l){l.style.maxHeight="";l.classList.remove("ef-scroll")}}
   /* pinturas */
   v.querySelectorAll(".ef-liv-t").forEach(x=>x.remove());
   const lw=v.querySelector("#rs-liveries");
   const liv=lw&&lw.querySelector(".rs-liv");if(liv){liv.classList.remove("ef-open");liv.removeAttribute("style")}
   EF.liv=false;document.getElementById("ef-liv-pop")?.remove();
   /* remover elementos injetados */
   v.querySelectorAll(".ef-rpl-list,.ef-summary").forEach(x=>x.remove());
   /* devolver elementos movidos */
   const form=v.querySelector("#f-rs"),screen=v.querySelector(".rs-form-screen");
   if(!form||!screen)return;
   /* acf children de volta */
   const acf=v.querySelector("#rs-acf"),lr=v.querySelector(".rs-layout-right");
   if(acf&&lr){
     const photo=lr.querySelector(".rs-acphoto");if(photo)acf.appendChild(photo);
     if(lw&&lw.parentElement!==lr)lr.appendChild(lw);
     const ac2=lr.querySelector(".rs-rpl-aircraft")||lr.querySelector(".rs-ac:not(.rs-al):not(.rs-pf)");
     if(ac2){const pair=acf.querySelector(".rs-rpl-pair")||acf.querySelector(".rs-pf");if(pair)pair.after(ac2);else acf.prepend(ac2)}}
   /* top-moved e mode-field de volta para fora do form */
   const top=form.querySelector(".rs-top-moved");if(top){const mf=form.querySelector(".rs-mode-field");if(mf)screen.prepend(mf);screen.prepend(top)}
   else{const mf=form.querySelector(".rs-mode-field");if(mf)screen.prepend(mf)}
   const intro=form.querySelector(".rs-rpl-intro");if(intro){const mf=screen.querySelector(".rs-mode-field");if(mf)mf.after(intro)}}

 /* ── fit: aplica o layout de 3 colunas ── */
 function fit(){
   const v=document.getElementById("view");if(!v)return;
   const on=typeof view!=="undefined"&&view==="roster";
   if(!on||innerWidth<761){document.getElementById("ef-liv-pop")?.remove();if(v.classList.contains("ef"))unfit(v);return}
   /* dentro da ops view, o alvo é .op-roster, não o #view inteiro */
   const opR=v.querySelector(".op-roster");
   v.classList.add("ef");
   const form=v.querySelector("#f-rs"),screen=v.querySelector(".rs-form-screen");
   if(!form||!screen)return;

   /* ── mover top-moved e mode-field para DENTRO do form ── */
   const top=screen.querySelector(":scope>.rs-top-moved");
   if(top)form.prepend(top);
   const mode=screen.querySelector(":scope>.rs-mode-field");
   if(mode){const after=form.querySelector(".rs-top-moved");if(after)after.after(mode);else form.prepend(mode)}
   const intro=screen.querySelector(":scope>.rs-rpl-intro");
   if(intro){const m=form.querySelector(".rs-mode-field");if(m)m.after(intro)}

   /* ── aviso "Mostrando só os voos da <favorita>" sobe para a linha dos botões ── */
   const fb=v.querySelector("#rs-acf .fa-rpl-bar"),mf=v.querySelector(".rs-mode-field");
   if(fb&&mf){mf.querySelectorAll(".fa-rpl-bar").forEach(x=>x.remove());mf.appendChild(fb)}

   /* ── mover elementos de aeronave do #rs-acf para .rs-layout-right (col 2) ── */
   const acf=v.querySelector("#rs-acf"),lr=v.querySelector(".rs-layout-right");
   if(acf&&lr){
     /* aircraft picker */
     const newAc=acf.querySelector(".rs-rpl-aircraft")||acf.querySelector(":scope>.rs-ac:not(.rs-pf):not(.rs-al)");
     if(newAc){lr.querySelectorAll(".rs-rpl-aircraft,.rs-ac:not(.rs-al):not(.rs-pf)").forEach(old=>{if(old!==newAc)old.remove()});lr.prepend(newAc)}
     /* foto */
     const newPh=acf.querySelector(".rs-acphoto");
     if(newPh){lr.querySelectorAll(".rs-acphoto").forEach(old=>{if(old!==newPh)old.remove()});
       const livSec=lr.querySelector("#rs-liveries");if(livSec)livSec.before(newPh);else lr.appendChild(newPh)}
   }

   /* ── pinturas: botão que abre/fecha a lista ── */
   const lw=v.querySelector("#rs-liveries");
   if(lw&&lr&&lw.parentElement!==lr)lr.appendChild(lw);
   const livEl=lw&&lw.querySelector(".rs-liv");
   if(livEl){const h=livEl.querySelector(".liv>h3");const n=h?((h.textContent.match(/\d+/)||[""])[0]):"";
     let bt=lw.querySelector(":scope>.ef-liv-t");const lab=`🎨 ${esc(ft("liv",{n}))} <span aria-hidden="true">▾</span>`;
     if(!bt){bt=document.createElement("button");bt.type="button";bt.className="ef-liv-t";bt.dataset.action="ef-liv";lw.prepend(bt)}
     if(bt.dataset.l!==lab){bt.dataset.l=lab;bt.innerHTML=lab}
     if(bt.getAttribute("aria-expanded")!==String(EF.liv))bt.setAttribute("aria-expanded",EF.liv);
     livEl.classList.toggle("ef-open",EF.liv)}
   placeLiv();

   /* ── ADS-B e regras lado a lado ── */
   const g=v.querySelector("#rs-ground"),rules=v.querySelector(".rs-form-screen>.rs-rules")||form.querySelector(".rs-rules");
   if(g&&rules&&!v.querySelector(".ef-foot")){const f=document.createElement("div");f.className="ef-foot";g.before(f);f.append(g,rules)}

   /* ── lista RPL (col 1) ── */
   updateRplList(v);

   /* ── barra de resumo (rodapé) ── */
   updateSummary(v,form);

   /* ── verso: um dia por vez ── */
   handleOutput(v);
 }

 /* ── lista de saídas RPL nas próximas 6 h ── */
 function efRplFlights(dep){
   if(!SCHED||!SCHED.idx||!AIRPORTS||!AIRPORTS[dep])return[];
   const names=typeof ICAO_AL==="function"?ICAO_AL():{},inFleet=new Set(fleet.map(a=>a.airline));
   const now=Date.now(),t0=now-5*6e4,t1=now+6*36e5,out=[];
   for(const code in SCHED.idx){if(!(SCHED.idx[code]||{})[dep])continue;
     const al=Object.keys(AIRLINE_ICAO||{}).find(n=>AIRLINE_ICAO[n]===code&&inFleet.has(n))||(inFleet.has(names[code])?names[code]:null);
     if(!al)continue;
     const iata=(typeof AIRLINE_IATA!=="undefined"&&AIRLINE_IATA[al])||code;
     for(const f of realDeps(code,dep,t0,t1))out.push({al,code,iata,f})}
   return out.sort((a,b)=>a.f.std-b.f.std)}

 function rplListHTML(){
   if(typeof RS==="undefined"||RS.roster||!RS.dep)return"";
   const list=efRplFlights(RS.dep);
   if(!list.length)return`<div class="ef-rpl-empty muted">${ft("no_rpl")}</div>`;
   const curKey=pfKey(RS.pf),now=Date.now();
   let html=`<div class="ef-rpl-label lbl">${ft("rpl_h",{n:list.length})}</div><div class="ef-rpl-scroll">`;
   for(const x of list){
     const k=`${x.code}${x.f.fno}@${x.f.std}`;
     const blk=x.f.blk;
     html+=`<button type="button" class="ef-rpl-row${k===curKey?" ef-rpl-sel":""}${x.f.std<now?" ef-rpl-past":""}" data-action="ef-pf" data-k="${esc(k)}" data-al="${esc(x.al)}" data-code="${esc(x.code)}">
       <span class="ef-rpl-code">${alSym(x.al)}${esc(x.iata+" "+x.f.fno)}</span>
       <span class="ef-rpl-route">${esc(RS.dep)} → ${esc(x.f.arr)}</span>
       <span class="ef-rpl-time">${utcHM(x.f.std)}Z · ${hhmm(Math.max(0,blk))}</span>
     </button>`}
   return html+`</div>`}

 function updateRplList(v){
   if(typeof RS==="undefined"||RS.roster)return;
   const ll=v.querySelector(".rs-layout-left");if(!ll)return;
   let el=ll.querySelector(".ef-rpl-list");
   const html=rplListHTML();
   if(!html){if(el)el.remove();return}
   if(!el){el=document.createElement("div");el.className="ef-rpl-list";ll.appendChild(el)}
   const sig=html.length+"|"+(RS.pf?pfKey(RS.pf):"");
   if(el.dataset.sig!==sig){el.dataset.sig=sig;el.innerHTML=html}}

 /* ── prévia da escala (rodapé): rota, modo, 1ª saída, duração, voos/dia e total estimado ── */
 function tt(k,p){return typeof t==="function"?(t(k,p)||""):"";}
 function summaryHTML(){
   if(typeof RS==="undefined"||RS.roster)return"";
   const ac=typeof acById==="function"?acById(RS.ac):null;
   const pf=RS.pf,dep=RS.dep||"—";
   const dest=pf&&pf.f?pf.f.arr:null;
   const days=RS.days||1;
   const dayLbl=days===1?(tt("rs_day1")||"1 dia"):(tt("rs_daysN",{n:days})||days+" dias");
   const legs=RS.legs||0;                               /* 0 = automático */
   const fpdLbl=legs?String(legs):ft("pv_auto");
   const totalTxt=legs?String(days*legs):ft("pv_varies");
   const alName=(ac&&ac.airline)||(typeof ACP!=="undefined"&&ACP.rs&&ACP.rs.al&&ACP.rs.al!=="all"?ACP.rs.al:"—");
   const start=RS.start>0?RS.start:0;
   const depTxt=start?`${esc(typeof fmtT==="function"?fmtT(start):"")} <small class="muted">${esc(utcHM(start))}Z</small>`:"—";
   const cell=(k,v)=>`<span class="ef-pv-c"><i>${esc(k)}</i><b>${v}</b></span>`;
   const route=`<div class="ef-pv-route">${alSym(alName)||""}<b>${esc(dep)}</b><span class="ef-pv-arr">→</span><span class="${dest?"":"muted"}">${esc(dest||ft("pv_dest"))}</span></div>`;
   const cells=`<div class="ef-pv-cells">`
     +cell(ft("pv_mode"),esc(RS.other?ft("pv_free"):tt("rs_rpl")||"RPL"))
     +cell(ft("pv_dep"),depTxt)
     +cell(tt("rs_days")||"Duração",esc(dayLbl))
     +cell(tt("rs_legs")||"Voos/dia",esc(fpdLbl))
     +cell(tt("airline")||"Companhia",ac?`<span class="plate al-plate${plLen(ac.registration)}"${plateStyle(ac.airline)}>${esc(ac.registration)}</span>`:esc(alName))
     +`</div>`;
   const total=`<div class="ef-pv-total"><i>${esc(ft("pv_total"))}</i><b>${esc(totalTxt)} <small>${esc(ft("pv_flights"))}</small></b></div>`;
   const dis=!RS.ac||RS.left===0||RS.left==="missing"||RS.busy;
   const genLbl=RS.roster?(tt("rs_regen")||"Gerar escala"):(tt("rs_gen")||"Gerar escala");
   return`<div class="ef-pv-head"><span class="ef-pv-ttl">${esc(ft("pv"))}</span><span class="ef-pv-live">●</span></div>`
     +route+cells+total
     +`<button class="btn primary ef-sum-btn" type="submit"${dis?" disabled":""}>${esc(genLbl)} →</button>`}

 function updateSummary(v,form){
   if(typeof RS==="undefined"||RS.roster)return;
   let el=form.querySelector(".ef-summary");
   const html=summaryHTML();
   if(!el){el=document.createElement("div");el.className="ef-summary";form.appendChild(el)}
   const sig=html.length+"|"+(RS.ac||"")+(RS.pf?pfKey(RS.pf):"")+"|"+(RS.days||1)+"|"+(RS.legs||0)+"|"+(RS.other?1:0)+"|"+(RS.start||0);
   if(el.dataset.sig!==sig){el.dataset.sig=sig;el.innerHTML=html}}

 /* ── verso: dia a dia com abas ── */
 function handleOutput(v){
   const out=v.querySelector(".rs-out");if(!out)return;
   const days=[...out.querySelectorAll(":scope>section.rs-day")];
   const key=days.length+"|"+(RS.roster&&RS.roster.acId||"")+"|"+(days[0]&&days[0].textContent.length);
   if(key!==EF.key){EF.key=key;EF.day=0}
   let tabs=out.querySelector(".ef-days"),row=out.querySelector(".ef-row");
   if(!row){row=document.createElement("div");row.className="ef-row";days[0]&&days[0].before(row)}
   const tw=out.querySelector(":scope>.notice.rs-twin");if(tw&&row)row.appendChild(tw);
   if(days.length>1){
     if(!tabs){tabs=document.createElement("div");tabs.className="seg ef-days";tabs.setAttribute("role","tablist");row.prepend(tabs)}
     const th=days.map((d,i)=>{const h=d.querySelector("h3");const tx=h?h.firstChild.textContent.trim():"Dia "+(i+1);const n=d.querySelectorAll(".bpc").length;
       return`<button type="button" role="tab" data-action="ef-day" data-i="${i}" aria-pressed="${i===EF.day}">${esc(tx)} <small>${n}✈</small></button>`}).join("");
     if(tabs.dataset.h!==th){tabs.dataset.h=th;tabs.innerHTML=th}
     days.forEach((d,i)=>d.hidden=i!==EF.day)
   }else{tabs&&tabs.remove();days.forEach(d=>d.hidden=false)}
   const acc=out.querySelector(":scope>.rs-accept"),nt=acc&&acc.previousElementSibling;
   if(acc&&nt&&nt.classList.contains("notice")&&!out.querySelector(".ef-acc")){
     const w=document.createElement("div");w.className="ef-acc";nt.before(w);w.append(nt,acc)}}

 function squeeze(){const v=document.getElementById("view");if(!v||!v.classList.contains("ef")||innerWidth<761)return;
   const legs=v.querySelector(".rs-out>section.rs-day:not([hidden]) .rs-legs");if(!legs)return;
   legs.style.maxHeight="";legs.classList.remove("ef-scroll");
   const over=Math.ceil(v.getBoundingClientRect().bottom+14-innerHeight);
   if(over>0){const h=legs.getBoundingClientRect().height;legs.style.maxHeight=Math.max(150,h-over)+"px";legs.classList.add("ef-scroll")}}

 /* ── livery popup ── */
 function placeLiv(){const v=document.getElementById("view"),bt=v&&v.querySelector("#rs-liveries>.ef-liv-t"),src=v&&v.querySelector("#rs-liveries .rs-liv");
   let pop=document.getElementById("ef-liv-pop");if(!EF.liv||!bt||!src||!bt.offsetParent){pop&&pop.remove();return}
   if(!pop){pop=document.createElement("div");pop.id="ef-liv-pop";pop.className="ef-liv-pop";document.body.appendChild(pop)}
   if(pop.dataset.h!==src.innerHTML){pop.dataset.h=src.innerHTML;pop.innerHTML=src.innerHTML}
   const r=bt.getBoundingClientRect(),M=12,w=Math.min(640,innerWidth-2*M),below=innerHeight-r.bottom-M-6,above=r.top-M-6,down=below>=260||below>=above;
   pop.style.width=w+"px";pop.style.left=Math.max(M,Math.min(innerWidth-w-M,r.right-w))+"px";
   if(down){const t=r.bottom+6;pop.style.top=t+"px";pop.style.bottom="auto";pop.style.maxHeight=Math.max(0,Math.min(420,innerHeight-t-M))+"px"}
   else{const b=innerHeight-r.top+6;pop.style.bottom=b+"px";pop.style.top="auto";pop.style.maxHeight=Math.max(0,Math.min(420,innerHeight-b-M))+"px"}}

 /* ── observers ── */
 let raf=0;const kick=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;try{fit();squeeze()}catch(e){console.warn("ef",e)}})};
 new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});
 addEventListener("resize",kick);
 addEventListener("scroll",()=>{if(EF.liv)placeLiv()},true);

 /* monkey-patches */
 if(typeof rsAcfHTML==="function"){const efAcf=rsAcfHTML;rsAcfHTML=function(){if(typeof RS==="undefined"||!RS.roster)return efAcf.apply(this,arguments);const r=RS.roster;RS.roster=null;try{return efAcf.apply(this,arguments)}finally{RS.roster=r}}}
 if(typeof render==="function"){const efRender=render;render=function(){const r=efRender.apply(this,arguments);try{fit()}catch(e){console.warn(e)}return r}}

 /* ── eventos ── */
 document.addEventListener("click",e=>{
   const b=e.target.closest&&e.target.closest('[data-action="ef-liv"],[data-action="ef-day"]');if(!b)return;
   if(b.dataset.action==="ef-liv"){EF.liv=!EF.liv;b.setAttribute("aria-expanded",EF.liv);fit()}
   else{EF.day=+b.dataset.i;fit();squeeze()}});
 document.addEventListener("click",e=>{if(EF.liv&&!(e.target.closest&&e.target.closest("#rs-liveries,#ef-liv-pop"))){EF.liv=false;fit();placeLiv()}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&EF.liv){EF.liv=false;fit()}});

 /* ── clique na lista RPL (janela de 6 h, maior que rsSoonFlights) ── */
 document.addEventListener("click",e=>{
   const b=e.target.closest&&e.target.closest('[data-action="ef-pf"]');if(!b)return;
   if(typeof RS==="undefined")return;
   const dep=RS.dep,k=b.dataset.k,al=b.dataset.al,code=b.dataset.code;
   /* procurar o voo na janela de 6 h */
   const list=efRplFlights(dep);
   const x=list.find(y=>`${y.code}${y.f.fno}@${y.f.std}`===k);if(!x)return;
   const xKey=pfKey({al:x.al,code:x.code,f:x.f});
   RS.pf=pfKey(RS.pf)===xKey?null:{al:x.al,code:x.code,f:x.f};
   RS.touched=true;RS.roster=null;RS.err="";
   if(RS.pf){ACP.rs.al=x.al;RS.start=x.f.std;
     const ok=rsPfAircraft(RS.pf);RS.ac=ok.some(a=>a.id===RS.ac)?RS.ac:(ok.length===1?ok[0].id:"")}
   render();if(RS.pf&&!RS.ac)setTimeout(()=>acPickOpen("rs",true),0)});

 /* ── CSS ── */
 const css=`
@media (min-width:761px){
/* ===== layout 3 colunas ===== */
#view.ef{font-size:.93rem}
#view.ef>.rs-screen-head{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
#view.ef .rs-form-screen{padding:12px 14px;gap:8px}

/* form vira grid de 3 colunas; intermediários viram display:contents */
#view.ef .rs-sidebar-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 280px!important;gap:10px 14px!important}
#view.ef .rs-sidebar-main{display:contents}
#view.ef .rs-main-fields{display:contents!important}

/* col 1: origem, modo, flight picker, lista RPL */
#view.ef .rs-top-moved,
#view.ef .rs-mode-field,
#view.ef .rs-rpl-intro,
#view.ef .rs-layout-left{grid-column:1}
#view.ef .rs-layout-left{display:flex;flex-direction:column;gap:8px;min-height:0;overflow:hidden}

/* col 2: aeronave, foto, pinturas */
#view.ef .rs-layout-right{grid-column:2;grid-row:1/span 20;display:flex!important;flex-direction:column;gap:10px;min-width:0;border:0!important;padding:0!important;background:none!important}

/* col 3: sidebar */
#view.ef .rs-layout-sidebar{grid-column:3;grid-row:1/span 20;align-self:start}

/* ocultar dep-info (redundante com a lista RPL) */
#view.ef #rs-dep-info{display:none}

/* ADS-B + regras: esconder no layout combinado */
#view.ef #rs-ground{display:none}
#view.ef .rs-form-screen>.rs-rules{display:none}

/* footer com ADS-B + rules (quando existir) */
#view.ef .ef-foot{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start;grid-column:1/-1}
#view.ef .ef-foot>*{margin:0}

/* ── prévia da escala (rodapé) ── */
#view.ef .ef-summary{grid-column:1/-1;display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px 16px;padding:10px 16px;background:var(--sunk);border:1px solid var(--line);border-radius:10px}
#view.ef .ef-pv-head{grid-column:1;display:flex;flex-direction:column;gap:2px;padding-right:12px;border-right:1px solid var(--line)}
#view.ef .ef-pv-ttl{font-size:.64rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;white-space:nowrap}
#view.ef .ef-pv-live{color:var(--ok);font-size:.7rem;line-height:1}
#view.ef .ef-pv-route{grid-column:2;display:flex;align-items:center;gap:7px;font-weight:700;font-size:1.05rem;min-width:0}
#view.ef .ef-pv-route .al-sym{width:20px;height:20px;flex:none}
#view.ef .ef-pv-route .ef-pv-arr{color:var(--accent)}
#view.ef .ef-pv-route>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#view.ef .ef-pv-cells{grid-column:1/3;grid-row:2;display:flex;flex-wrap:wrap;gap:6px 18px;align-items:baseline}
#view.ef .ef-pv-c{display:flex;flex-direction:column;gap:1px;min-width:0}
#view.ef .ef-pv-c>i{font-size:.6rem;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);font-weight:600;font-style:normal}
#view.ef .ef-pv-c>b{font-size:.82rem;font-weight:600}
#view.ef .ef-pv-c>b small{color:var(--muted);font-weight:400}
#view.ef .ef-pv-total{grid-column:3;grid-row:1/span 2;align-self:center;display:flex;flex-direction:column;gap:1px;text-align:right;background:var(--plate);color:var(--plate-ink);border-radius:8px;padding:8px 14px}
#view.ef .ef-pv-total>i{font-size:.6rem;letter-spacing:.07em;text-transform:uppercase;opacity:.8;font-weight:600;font-style:normal}
#view.ef .ef-pv-total>b{font-size:1.25rem;font-weight:700;line-height:1.05}
#view.ef .ef-pv-total>b small{font-size:.62rem;opacity:.8;font-weight:500}
#view.ef .ef-sum-btn{grid-column:4;grid-row:1/span 2;align-self:center;min-height:42px;padding:8px 22px;font-weight:700}
@media (max-width:860px){
#view.ef .ef-summary{grid-template-columns:1fr auto}
#view.ef .ef-pv-head{grid-column:1/-1;flex-direction:row;align-items:center;gap:6px;border-right:0;border-bottom:1px solid var(--line);padding:0 0 6px}
#view.ef .ef-pv-route{grid-column:1/-1}
#view.ef .ef-pv-cells{grid-column:1/-1;grid-row:auto}
#view.ef .ef-pv-total{grid-column:1;grid-row:auto;flex-direction:row;align-items:baseline;gap:8px;text-align:left}
#view.ef .ef-sum-btn{grid-column:2;grid-row:auto}
}

/* ── lista RPL ── */
#view.ef .ef-rpl-list{flex:1;min-height:0;display:flex;flex-direction:column;gap:4px}
#view.ef .ef-rpl-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600;margin:4px 0 2px}
#view.ef .ef-rpl-scroll{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:3px;scrollbar-width:thin;padding-right:4px}
#view.ef .ef-rpl-row{all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--sunk);border-radius:6px;font-size:.78rem;transition:background .12s}
#view.ef .ef-rpl-row:hover{background:var(--line)}
#view.ef .ef-rpl-sel{background:color-mix(in srgb,var(--accent) 12%,transparent)!important;outline:1.5px solid var(--accent)}
#view.ef .ef-rpl-past{opacity:.4}
#view.ef .ef-rpl-code{font-weight:600;white-space:nowrap;display:flex;align-items:center;gap:4px}
#view.ef .ef-rpl-code .al-sym{width:16px;height:16px}
#view.ef .ef-rpl-route{white-space:nowrap}
#view.ef .ef-rpl-time{margin-left:auto;font-family:var(--mono,monospace);color:var(--muted);font-size:.72rem;white-space:nowrap}
#view.ef .ef-rpl-empty{font-size:.82rem;padding:10px 0}

/* ── origem ── */
#view.ef .rs-top-moved{padding-bottom:6px;margin-bottom:0;min-width:0;overflow:hidden;max-width:100%}
#view.ef .rs-top-moved .rs-origin-compact{gap:4px 8px;grid-template-columns:minmax(0,auto) minmax(0,1fr)!important;overflow:hidden;max-width:100%}
#view.ef .rs-top-moved .dv-strip{gap:4px 6px;margin-top:2px}
#view.ef .rs-top-moved .dv-sat{display:none!important}
#view.ef .rs-top-moved .dv-origin{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── modo ── */
#view.ef .rs-mode-field{padding-bottom:4px;margin-bottom:0}
#view.ef .rs-mode-field .rs-mode-card{padding:6px 12px}
#view.ef .rs-mode-field:has(.fa-rpl-bar){flex-direction:row;flex-wrap:nowrap;align-items:center}
#view.ef .rs-mode-field:has(.fa-rpl-bar)>small:empty{display:none}
#view.ef .rs-mode-field .fa-rpl-bar{margin:0 0 0 auto;min-width:0;flex:0 1 auto;align-self:center}
#view.ef .fa-rpl-bar{padding:3px 6px 3px 10px;margin:0;gap:8px;font-size:.8rem;min-height:0}
#view.ef .fa-rpl-bar .btn{padding:3px 10px;font-size:.78rem;min-height:0}
#view.ef .fa-rpl-bar img,#view.ef .fa-rpl-bar .al-sym{width:18px;height:18px}

/* ── acf / flight picker (col 1) ── */
#view.ef #rs-acf{min-width:0}
#view.ef .rs-rpl-pair{display:contents}
#view.ef .rs-pf .rs-pf-options{max-height:180px;overflow-y:auto}

/* ── col 2: aeronave ── */
#view.ef .rs-layout-right .rs-rpl-aircraft,
#view.ef .rs-layout-right .rs-ac:not(.rs-pf):not(.rs-al){margin:0}
#view.ef .rs-layout-right .rs-acphoto{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:5px 10px;margin:0;min-height:0}
#view.ef .rs-layout-right .rs-acphoto .ac-img{width:100%;max-width:200px}
#view.ef .rs-layout-right .rs-acphoto .ac-img img{width:100%;height:auto;max-height:180px;object-fit:cover}
#view.ef .rs-layout-right .rs-acphoto .ac-img svg{width:100%}
#view.ef .rs-layout-right .rs-acphoto .ac-img .credit{display:none}
#view.ef .rs-layout-right .rs-acphoto>div:not(#rs-liveries){display:block;font-size:.8rem;line-height:1.35}
#view.ef .rs-layout-right .rs-acphoto>div:not(#rs-liveries)>b{display:block;font-size:.85rem}
#view.ef .rs-layout-right .rs-acphoto>div:not(#rs-liveries)>.muted::after{content:" · "}
#view.ef .rs-layout-right:not(:has(*)){display:none!important}

/* ── pinturas ── */
#view.ef .rs-layout-right>#rs-liveries{margin-top:auto}
#view.ef #rs-liveries{position:relative}
#view.ef #rs-liveries .rs-liv{display:none;padding:0;border:0;margin:0;background:none}
#view.ef #rs-liveries .rs-liv.ef-open{display:none}
.ef-liv-pop{position:fixed;z-index:1500;overflow:auto;background:var(--sheet);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:10px 12px;box-shadow:0 18px 40px -16px rgba(0,0,0,.45);box-sizing:border-box}
.ef-liv-pop .liv{margin:0}.ef-liv-pop .liv>h3{font-size:.95rem;margin:0 0 6px}
.ef-liv-t{all:unset;cursor:pointer;display:inline-flex;gap:6px;align-items:center;font-weight:700;font-size:.9rem;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--sheet)}
.ef-liv-t:hover{border-color:var(--accent)}.ef-liv-t:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ef-liv-t[aria-expanded="true"] span{display:inline-block;transform:rotate(180deg)}

/* ── sidebar ── */
#view.ef .rs-layout-sidebar .rs-actions small{font-size:.68rem}

/* ===== verso (escala gerada) ===== */
#view.ef .rs-out{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;padding:12px 14px}
#view.ef .rs-out>*{grid-column:1/-1}
#view.ef .rs-out>.rf-bar{display:contents}
#view.ef .rs-out>.rf-bar>[data-action="rf-adjust"]{grid-column:1;grid-row:1}
#view.ef .rs-out>.rf-bar>[data-action="rf-again"]{grid-column:3;grid-row:1}
#view.ef .rs-out>.rs-sum{grid-column:2;grid-row:1;margin:0;flex-wrap:wrap}
#view.ef .rs-out>.notice{padding:4px 10px;margin:0;font-size:.8rem}
#view.ef .ef-days{display:flex;gap:6px;flex-wrap:wrap;margin:0}
#view.ef .ef-days small{opacity:.7;margin-left:4px}
#view.ef .rs-day>header{padding:6px 12px}
#view.ef .rs-day .sct{padding-top:2px;padding-bottom:0}
#view.ef .bpc{min-height:0}
#view.ef .bpc-top{display:none}
#view.ef .bpc-city{display:none}
#view.ef .bpc-main{grid-template-columns:auto minmax(0,1fr) auto;padding:6px 16px;gap:2px 18px}
#view.ef .bpc-code{font-size:1.45rem}
#view.ef .bpc-time b{font-size:1.05rem}
#view.ef .bpc-mid{font-size:.72rem;gap:7px}
#view.ef .bpc-ap{flex-direction:row;align-items:baseline;gap:8px;flex-wrap:wrap}
#view.ef .bpc-ap.r{justify-content:flex-end}
#view.ef .bpc-time{gap:4px}
#view.ef .bpc-time small{font-size:.66rem}
#view.ef .bpc-z{font-size:.72rem}
#view.ef .bpc-stub{display:flex;flex-direction:column;justify-content:center;gap:0;padding:4px 12px;width:130px}
#view.ef .bpc-stub .k{display:none}
#view.ef .bpc-stub>b:not(.bpc-fn){font-size:.74rem}
#view.ef .bpc-stub .mx-st{font-size:.66rem}
#view.ef .bpc-fn{font-size:1.1rem}
#view.ef .bpc-route{font-size:.66rem}
#view.ef .rs-legs{gap:8px}
#view.ef .rs-legs.ef-scroll{overflow:auto;overscroll-behavior:contain;padding-right:4px;scrollbar-width:thin}
#view.ef .rs-day>footer{padding:6px 12px}
#view.ef .ef-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#view.ef .ef-row>.notice{flex:1;min-width:220px;margin:0;padding:5px 10px;font-size:.8rem}
#view.ef .rs-legs .sc-solo,#view.ef .rs-legs>.solo,#view.ef .rs-legs>div:not(.bpc){margin:0!important;padding:0!important;font-size:.72rem}
#view.ef .sct-row{height:30px}
#view.ef .sct-seg span{font-size:.72rem}
#view.ef .sct-axis{font-size:.62rem}
#view.ef .ef-acc{display:flex;gap:12px;align-items:center}
#view.ef .ef-acc>.notice{flex:1;margin:0!important;padding:6px 10px;font-size:.8rem;font-size:.76rem;line-height:1.35}
#view.ef .ef-acc>.rs-accept{flex:none;margin:0}

/* telas mais curtas */
@media (max-height:700px){
#view.ef .rs-top-moved{padding:3px 0}
#view.ef .rs-top-moved .dv-sat{height:82px!important;width:128px!important}
#view.ef .rs-form-screen{padding-top:8px;padding-bottom:8px}
#view.ef .rs-layout-sidebar .rs-seg button{min-height:32px;padding:5px 3px}
}
/* sidebar mais estreita em telas menores */
@media (max-width:1099px){
#view.ef .rs-sidebar-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 240px!important}
}
}`;
 const st=document.createElement("style");st.id="ef-css";st.textContent=css;document.head.appendChild(st);
})();
