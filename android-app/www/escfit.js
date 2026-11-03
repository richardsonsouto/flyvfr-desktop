/* escfit.js — Menu Escala sem rolagem: a tela cabe na altura da janela.
   Frente (formulário): cabeçalho enxuto, foto da aeronave compacta, pinturas recolhidas num botão, ADS-B e regras na mesma linha.
   Verso (escala gerada): barra + resumo numa linha, um dia por vez (abas Dia 1, Dia 2…), cartões de embarque mais baixos,
   aviso e botões de aceitar na mesma linha. Letras um pouco menores (≈ 93%). Só em telas ≥ 761 px de largura. */
(function(){
 const T={liv:["Liveries ({n})","Pinturas ({n})","Libreas ({n})","Livrées ({n})","Lackierungen ({n})","塗装 ({n})","涂装 ({n})","도색 ({n})"]};
 const ft=(k,p)=>{let s=(T[k][LANGS.indexOf(lang)]||T[k][0]);if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
 const EF={day:0,liv:false,key:""};
 function unfit(v){v.classList.remove("ef");v.querySelectorAll(".ef-days").forEach(x=>x.remove());v.querySelectorAll(".ef-row,.ef-acc,.ef-foot").forEach(w=>{while(w.firstChild)w.before(w.firstChild);w.remove()});v.querySelectorAll(".ef-liv-t").forEach(x=>x.remove());const lw=v.querySelector("#rs-liveries"),rr=v.querySelector(".rs-layout-right");if(lw&&rr&&lw.parentElement!==rr)rr.appendChild(lw);
  const liv=v.querySelector("#rs-liveries .rs-liv");if(liv){liv.classList.remove("ef-open");liv.removeAttribute("style")}EF.liv=false;
  const out=v.querySelector(".rs-out");if(out){out.querySelectorAll(":scope>section.rs-day").forEach(d=>d.hidden=false);const l=out.querySelector(".rs-legs.ef-scroll");if(l){l.style.maxHeight="";l.classList.remove("ef-scroll")}}}
 function fit(){const v=document.getElementById("view");if(!v)return;const on=typeof view!=="undefined"&&view==="roster";
  if(!on||innerWidth<761){if(v.classList.contains("ef"))unfit(v);return}v.classList.add("ef");
  /* pinturas: o título vira um botão que abre/fecha a lista */
  const lw=v.querySelector("#rs-liveries"),ph=v.querySelector(".rs-acphoto");if(lw&&ph&&lw.parentElement!==ph)ph.appendChild(lw);
  const liv=v.querySelector("#rs-liveries .rs-liv");if(liv){const h=liv.querySelector(".liv>h3");const n=h?((h.textContent.match(/\d+/)||[""])[0]):"";
   let bt=lw.querySelector(":scope>.ef-liv-t");const lab=`🎨 ${esc(ft("liv",{n}))} <span aria-hidden="true">▾</span>`;
   if(!bt){bt=document.createElement("button");bt.type="button";bt.className="ef-liv-t";bt.dataset.action="ef-liv";lw.prepend(bt)}
   if(bt.dataset.l!==lab){bt.dataset.l=lab;bt.innerHTML=lab}if(bt.getAttribute("aria-expanded")!==String(EF.liv))bt.setAttribute("aria-expanded",EF.liv);
   liv.classList.toggle("ef-open",EF.liv);if(EF.liv)placeLiv()}
  /* ADS-B e regras lado a lado */
  const g=v.querySelector("#rs-ground"),rules=v.querySelector(".rs-form-screen>.rs-rules");
  if(g&&rules&&!v.querySelector(".ef-foot")){const f=document.createElement("div");f.className="ef-foot";g.before(f);f.append(g,rules)}
  /* verso: um dia por vez */
  const out=v.querySelector(".rs-out");if(out){const days=[...out.querySelectorAll(":scope>section.rs-day")];const key=days.length+"|"+(RS.roster&&RS.roster.acId||"")+"|"+(days[0]&&days[0].textContent.length);
   if(key!==EF.key){EF.key=key;EF.day=0}
   let tabs=out.querySelector(".ef-days");
   let row=out.querySelector(".ef-row");if(!row){row=document.createElement("div");row.className="ef-row";days[0]&&days[0].before(row)}
   const tw=out.querySelector(":scope>.notice.rs-twin");if(tw&&row)row.appendChild(tw);
   if(days.length>1){if(!tabs){tabs=document.createElement("div");tabs.className="seg ef-days";tabs.setAttribute("role","tablist");row.prepend(tabs)}
    const th=days.map((d,i)=>{const h=d.querySelector("h3");const tx=h?h.firstChild.textContent.trim():"Dia "+(i+1);const n=d.querySelectorAll(".bpc").length;return`<button type="button" role="tab" data-action="ef-day" data-i="${i}" aria-pressed="${i===EF.day}">${esc(tx)} <small>${n}✈</small></button>`}).join("");if(tabs.dataset.h!==th){tabs.dataset.h=th;tabs.innerHTML=th}
    days.forEach((d,i)=>d.hidden=i!==EF.day)}
   else{tabs&&tabs.remove();days.forEach(d=>d.hidden=false)}
   /* aviso + aceitar na mesma linha */
   const acc=out.querySelector(":scope>.rs-accept"),nt=acc&&acc.previousElementSibling;if(acc&&nt&&nt.classList.contains("notice")&&!out.querySelector(".ef-acc")){const w=document.createElement("div");w.className="ef-acc";nt.before(w);w.append(nt,acc)}}}
 /* se ainda faltar altura, a lista de voos do dia (verso) rola por dentro em vez da página */
 function squeeze(){const v=document.getElementById("view");if(!v||!v.classList.contains("ef")||innerWidth<761)return;
  const legs=v.querySelector(".rs-out>section.rs-day:not([hidden]) .rs-legs");if(!legs)return;legs.style.maxHeight="";legs.classList.remove("ef-scroll");
  const over=Math.ceil(v.getBoundingClientRect().bottom+14-innerHeight);if(over>0){const h=legs.getBoundingClientRect().height;legs.style.maxHeight=Math.max(150,h-over)+"px";legs.classList.add("ef-scroll")}}
 let raf=0;const kick=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;try{fit();squeeze()}catch(e){}})};
 new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});addEventListener("resize",kick);
 /* frente após gerar ("Ajustar escala"): companhia, aeronave e foto continuam no formulário para o piloto ajustar */
 if(typeof rsAcfHTML==="function"){const efAcf=rsAcfHTML;rsAcfHTML=function(){if(typeof RS==="undefined"||!RS.roster)return efAcf.apply(this,arguments);const r=RS.roster;RS.roster=null;try{return efAcf.apply(this,arguments)}finally{RS.roster=r}}}
 /* lista de pinturas: abre junto do botão, para cima ou para baixo conforme o espaço, sempre inteira dentro da janela */
 function placeLiv(){const v=document.getElementById("view"),bt=v&&v.querySelector("#rs-liveries>.ef-liv-t"),pop=v&&v.querySelector("#rs-liveries .rs-liv.ef-open");if(!bt||!pop)return;
  const r=bt.getBoundingClientRect(),M=12,w=Math.min(640,innerWidth-2*M),below=innerHeight-r.bottom-M-6,above=r.top-M-6,down=below>=260||below>=above;
  pop.style.width=w+"px";pop.style.left=Math.max(M,Math.min(innerWidth-w-M,r.right-w))+"px";
  if(down){pop.style.top=(r.bottom+6)+"px";pop.style.bottom="auto";pop.style.maxHeight=Math.max(120,Math.min(420,below))+"px"}
  else{pop.style.bottom=(innerHeight-r.top+6)+"px";pop.style.top="auto";pop.style.maxHeight=Math.max(120,Math.min(420,above))+"px"}}
 addEventListener("scroll",()=>{if(EF.liv)placeLiv()},true);
 if(typeof render==="function"){const efRender=render;render=function(){const r=efRender.apply(this,arguments);try{fit()}catch(e){console.warn(e)}return r}}
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action="ef-liv"],[data-action="ef-day"]');if(!b)return;
  if(b.dataset.action==="ef-liv"){EF.liv=!EF.liv;b.setAttribute("aria-expanded",EF.liv);fit()}else{EF.day=+b.dataset.i;fit();squeeze()}});
 document.addEventListener("click",e=>{if(EF.liv&&!(e.target.closest&&e.target.closest("#rs-liveries"))){EF.liv=false;fit()}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&EF.liv){EF.liv=false;fit()}});
 const css=`
@media (min-width:761px){
#view.ef{font-size:.93rem}
@media (max-height:700px){#view.ef>.rs-screen-head{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}#view.ef .rs-top-moved{padding-bottom:6px;margin-bottom:6px}#view.ef .rs-form-screen .dv-strip{gap:4px 6px}#view.ef .dv-pill{padding:2px 8px;font-size:.76rem}}
#view.ef>.rs-screen-head{margin-bottom:8px}#view.ef>.rs-screen-head .eyebrow{display:none}#view.ef>.rs-screen-head h2{font-size:1.3rem;margin:0}
#view.ef .rs-form-screen,#view.ef .rs-out{padding:12px 14px;gap:8px}
#view.ef .rs-form-screen .dv-strip{margin-top:6px}
#view.ef .rs-form-screen .rs-modes .rs-mode-card{padding:6px 12px}
#view.ef .rs-acphoto{min-height:0;padding:5px 10px;margin:4px 0 0}#view.ef .rs-acphoto .ac-img{width:84px}#view.ef .rs-acphoto .ac-img img{width:84px;height:47px}#view.ef .rs-acphoto .ac-img svg{width:84px}#view.ef .rs-acphoto .ac-img .credit{display:none}
#view.ef .rs-acphoto>div:not(#rs-liveries){display:block;font-size:.8rem;line-height:1.35}#view.ef .rs-acphoto>div:not(#rs-liveries)>b{display:block;font-size:.85rem}#view.ef .rs-acphoto>div:not(#rs-liveries)>.muted::after{content:" · "}
#view.ef .rs-acphoto>#rs-liveries{flex:none}
#view.ef .rs-layout-right:not(:has(*)){display:none}
#view.ef .rs-top-moved{padding-bottom:8px;margin-bottom:8px}#view.ef .rs-mode-field{padding-bottom:4px;margin-bottom:4px}
#view.ef .rs-sidebar-main,#view.ef .rs-main-fields{gap:6px}
#view.ef .rs-main-fields{gap:8px}
#view.ef .rs-acphoto{position:relative;display:flex;align-items:center;gap:12px}
#view.ef .rs-acphoto>#rs-liveries{margin-left:auto}#view.ef #rs-liveries{position:relative}
#view.ef #rs-liveries .rs-liv{display:none;padding:0;border:0;margin:0;background:none}
#view.ef #rs-liveries .rs-liv.ef-open{display:block;position:fixed;z-index:1500;overflow:auto;background:var(--sheet);border:1px solid var(--line);border-radius:12px;padding:10px 12px;box-shadow:0 18px 40px -16px rgba(0,0,0,.45)}
#view.ef #rs-liveries .rs-liv .liv{margin:0}#view.ef #rs-liveries .rs-liv .liv>h3{font-size:.95rem;margin:0 0 6px!important}
.ef-liv-t{all:unset;cursor:pointer;display:inline-flex;gap:6px;align-items:center;font-weight:700;font-size:.9rem;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--sheet)}
.ef-liv-t:hover{border-color:var(--accent)}.ef-liv-t:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ef-liv-t[aria-expanded="true"] span{display:inline-block;transform:rotate(180deg)}
#view.ef .ef-foot{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start;grid-column:1/-1}
#view.ef .ef-foot>*{margin:0}#view.ef .ef-foot .rs-rules summary{padding:6px 0}
#view.ef .rs-out{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center}
#view.ef .rs-out>*{grid-column:1/-1}#view.ef .rs-out>.rf-bar{display:contents}
#view.ef .rs-out>.rf-bar>[data-action="rf-adjust"]{grid-column:1;grid-row:1}#view.ef .rs-out>.rf-bar>[data-action="rf-again"]{grid-column:3;grid-row:1}
#view.ef .rs-out>.rs-sum{grid-column:2;grid-row:1;margin:0;flex-wrap:wrap}
#view.ef .rs-out>.notice{padding:4px 10px;margin:0;font-size:.8rem}
#view.ef .ef-days{display:flex;gap:6px;flex-wrap:wrap;margin:0}#view.ef .ef-days small{opacity:.7;margin-left:4px}
#view.ef .rs-day>header{padding:6px 12px}#view.ef .rs-day .sct{padding-top:2px;padding-bottom:0}
#view.ef .bpc{min-height:0}#view.ef .bpc-city{display:none}#view.ef .bpc-top{font-size:.74rem}#view.ef .bpc-mid{font-size:.72rem}#view.ef .bpc-stub .k{font-size:.62rem}#view.ef .bpc-stub{font-size:.78rem;width:150px}#view.ef .bpc-main{padding:6px 16px;gap:2px 18px}#view.ef .bpc-code{font-size:1.45rem}#view.ef .bpc-time b{font-size:1.05rem}
#view.ef .bpc-stub{padding:6px 14px}#view.ef .bpc-fn{font-size:1.1rem}#view.ef .bpc-mid{gap:6px}
#view.ef .rs-legs{gap:8px}#view.ef .rs-legs.ef-scroll{overflow:auto;overscroll-behavior:contain;padding-right:4px;scrollbar-width:thin}#view.ef .rs-day>footer{padding:6px 12px}
#view.ef .ef-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}#view.ef .ef-row>.notice{flex:1;min-width:220px;margin:0;padding:5px 10px;font-size:.8rem}
#view.ef .bpc-top{display:none}#view.ef .bpc-main{grid-template-columns:auto minmax(0,1fr) auto;padding:6px 16px}
#view.ef .bpc-ap{flex-direction:row;align-items:baseline;gap:8px;flex-wrap:wrap}#view.ef .bpc-ap.r{justify-content:flex-end}
#view.ef .bpc-time{gap:4px}#view.ef .bpc-time small{font-size:.66rem}#view.ef .bpc-z{font-size:.72rem}
#view.ef .bpc-stub{display:flex;flex-direction:column;justify-content:center;gap:0;padding:4px 12px;width:130px}#view.ef .bpc-stub .k{display:none}#view.ef .bpc-stub>b:not(.bpc-fn){font-size:.74rem}#view.ef .bpc-stub .mx-st{font-size:.66rem}
#view.ef .bpc-mid{gap:7px}#view.ef .bpc-route{font-size:.66rem}
#view.ef .rs-legs .sc-solo,#view.ef .rs-legs>.solo,#view.ef .rs-legs>div:not(.bpc){margin:0!important;padding:0!important;font-size:.72rem}
#view.ef .sct-row{height:30px}#view.ef .sct-seg span{font-size:.72rem}#view.ef .sct-axis{font-size:.62rem}
#view.ef .ef-acc>.notice{font-size:.76rem;line-height:1.35}
#view.ef .ef-acc{display:flex;gap:12px;align-items:center}#view.ef .ef-acc>.notice{flex:1;margin:0!important;padding:6px 10px;font-size:.8rem}#view.ef .ef-acc>.rs-accept{flex:none;margin:0}
}`;
 const st=document.createElement("style");st.id="ef-css";st.textContent=css;document.head.appendChild(st);
})();
