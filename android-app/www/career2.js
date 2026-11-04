/* career2.js — Patente e conquistas (Diário de bordo), versão "cartão + medalhas":
   • cartão escuro com a patente atual, quanto falta para a próxima e a escada de todas as patentes;
   • "Quase lá": as 3 conquistas que estão mais perto de sair;
   • quadro de medalhas: cada uma com ícone próprio (SVG) e um anel que vai fechando com o progresso;
     as conquistadas ficam douradas e mostram a data em que saíram.
   Substitui careerHTML (features.js). As regras das conquistas continuam as mesmas (BADGES). */
(function(){
 if(typeof careerHTML!=="function"||typeof BADGES==="undefined")return;
 const T={
  rank:["Rank","Patente","Rango","Grade","Rang","階級","军衔","계급"],
  near:["Almost there","Quase lá","Casi lo logras","Presque","Fast geschafft","もう少し","即将达成","거의 다 왔어요"],
  title:["Badges","Conquistas","Logros","Badges","Abzeichen","実績","成就","업적"],
  of:["{a} of {b}","{a} de {b}","{a} de {b}","{a} sur {b}","{a} von {b}","{a} / {b}","{a} / {b}","{a} / {b}"],
  nextIn:["{r} in","{r} em","{r} en","{r} dans","{r} in","{r} まで","距 {r}","{r}까지"],
  nofpm:["no landing measured","sem pouso medido","sin aterrizaje medido","aucun atterrissage mesuré","keine Landung gemessen","計測なし","尚无测量","측정 없음"],
  best:["best {v} fpm","melhor {v} fpm","mejor {v} fpm","meilleur {v} fpm","beste {v} fpm","ベスト {v} fpm","最佳 {v} fpm","최고 {v} fpm"],
  won:["Earned","Conquistada","Obtenido","Obtenu","Erreicht","獲得","已获得","획득"]};
 const ct=(k,p)=>{let s=(T[k][LANGS.indexOf(lang)]||T[k][0]);if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
 const nf=(v,d)=>{try{return Number(v).toLocaleString(lang,{maximumFractionDigits:d==null?1:d})}catch(e){return String(Math.round(v*10)/10)}};
 /* ícones de traço (mesma família visual, herdam a cor) */
 const P={first:'<path d="M2 16l20-6-20-6 4 6-4 6zM6 10h8"/>',f10:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9v6M12 10a2 2 0 014 0v4a2 2 0 01-4 0z"/>',
  f50:'<circle cx="12" cy="15" r="5"/><path d="M8 3l4 7 4-7M12 13v4"/>',f100:'<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4a3 3 0 004 4M16 6h4a3 3 0 01-4 4M12 13v4M8 20h8"/>',
  h100:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M10 2h4"/>',long:'<path d="M20 14A8 8 0 1110 4a6 6 0 0010 10z"/>',types5:'<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  airlines5:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 12h18"/>',world:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  ap20:'<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',ferry:'<path d="M3 17h18M5 17l2-6h10l2 6M9 11V7h6v4M7 21h10"/>',
  event:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20a6 6 0 0112 0M10 20a6 6 0 0112 0"/>',mech:'<path d="M14 7a4 4 0 105 5l-8 8-4-4 8-8"/>',
  butter:'<path d="M4 20l8-8M20 4c-6 0-12 4-12 12h4c4 0 8-6 8-12z"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'};
 const icon=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]||P.star}</svg>`;
 /* progresso de cada conquista: [atual, meta, texto] */
 const H=v=>nf(v)+" h";
 const GOAL={first:s=>[s.n,1],f10:s=>[s.n,10],f50:s=>[s.n,50],f100:s=>[s.n,100],h100:s=>[s.h,100,`${H(s.h)} / 100 h`],long:s=>[s.longest/60,8,`${H(s.longest/60)} / 8 h`],
  types5:s=>[s.types,5],airlines5:s=>[s.airlines,5],world:s=>[s.regions,4],ap20:s=>[s.airports,20],ferry:s=>[s.ferry,1],event:s=>[s.ev,1],mech:s=>[s.reports,5],
  butter:s=>s.bestFpm==null?[0,1,ct("nofpm")]:[Math.min(1,100/s.bestFpm),1,ct("best",{v:s.bestFpm})]};
 function prog(k,s){const g=(GOAL[k]||(()=>[0,1]))(s);const cur=Math.max(0,g[0]||0),goal=g[1]||1;return{p:Math.min(1,cur/goal),txt:g[2]||`${nf(Math.min(cur,goal),0)} / ${goal}`}}
 /* data em que cada conquista saiu: refaz as estatísticas voo a voo (só conta voos; falhas técnicas ficam sem data) */
 function earnedAt(pid,b){try{const fl=data.flights.filter(f=>f.pilotId===pid).sort((a,c)=>a.createdAt-c.createdAt);if(!fl.length)return 0;
   const save=data.flights;let lo=1,hi=fl.length,at=0;
   try{data.flights=fl;if(!b.ok(pilotStats(pid)))return 0;
    while(lo<=hi){const mid=(lo+hi)>>1;data.flights=fl.slice(0,mid);if(b.ok(pilotStats(pid))){at=fl[mid-1].createdAt;hi=mid-1}else lo=mid+1}}
   finally{data.flights=save}return at}catch(e){return 0}}
 const C=2*Math.PI*35;
 const ring=(p,won)=>`<svg class="cr-ring" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="35" class="cr-track"/>${p>0?`<circle cx="38" cy="38" r="35" class="cr-val${won?" won":""}" stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}"/>`:""}</svg>`;
 careerHTML=function(pid){
  const s=pilotStats(pid),r=rankOf(s.h),list=BADGES.map(b=>{const ok=!!b.ok(s),g=prog(b.k,s);return{b,k:b.k,ok,p:ok?1:g.p,txt:g.txt}});
  const earned=list.filter(x=>x.ok).length,pct=r.next?Math.max(0,Math.min(100,(s.h-r.h)/(r.next.h-r.h)*100)):100;
  const near=list.filter(x=>!x.ok&&x.p>0).sort((a,c)=>c.p-a.p).slice(0,3);
  const name=k=>esc(t("bd_"+k)),desc=k=>esc(t("bd_"+k+"_d"));
  const med=x=>{const at=x.ok?earnedAt(pid,x.b):0;
   return`<div class="cr-med${x.ok?" won":""}" title="${desc(x.k)}"><div class="cr-ic">${ring(x.p,x.ok)}<span>${icon(x.k)}</span></div><b>${name(x.k)}</b><small>${desc(x.k)}</small>
    <span class="cr-f mono">${x.ok?`✓ ${at?dateF(at):esc(ct("won"))}`:esc(x.txt)}</span></div>`};
  const ladder=RANKS.slice().reverse().map(x=>`<div class="${x.k===r.k?"on":s.h>=x.h?"done":""}"><span>${esc(t(x.k))}</span><span class="mono">${x.h} h</span></div>`).join("");
  return`<div class="panel career cr2"><div class="cr-wrap">
   <div class="cr-side"><div class="cr-card">${insignia(r)}<span class="cr-k">${esc(ct("rank"))}</span><div class="cr-n">${esc(t(r.k))}</div>
     ${r.next?`<div class="cr-row"><span>${esc(ct("nextIn",{r:t(r.next.k)}))}</span><span class="mono">${H(Math.max(.1,r.next.h-s.h))}</span></div><div class="cr-bar"><i style="width:${pct.toFixed(1)}%"></i></div>`
      :`<div class="cr-row"><span>${esc(t("car_top"))}</span></div>`}
     <div class="cr-ladder">${ladder}</div></div>
    <p class="hint">${t("car_note")}</p></div>
   <div class="cr-main">${near.length?`<h3>${esc(ct("near"))}</h3><div class="cr-near">${near.map(x=>`<div class="cr-nc"><span class="cr-nic">${icon(x.k)}</span><div><b>${name(x.k)}</b><small>${desc(x.k)}</small>
      <div class="cr-p"><div class="cr-bar"><i style="width:${(x.p*100).toFixed(1)}%"></i></div><span class="mono">${esc(x.txt)}</span></div></div></div>`).join("")}</div>`:""}
    <h3>${esc(ct("title"))} <small>${esc(ct("of",{a:earned,b:list.length}))}</small></h3>
    <div class="cr-meds">${list.map(med).join("")}</div></div></div></div>`};
 const css=`.cr2{--gold:#C9A227;--gold-soft:#FBF4DC;--crp:#0B6A93}
:root[data-theme="dark"] .cr2{--gold:#E2BC4A;--gold-soft:#2B2614;--crp:#4FB3DE}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .cr2{--gold:#E2BC4A;--gold-soft:#2B2614;--crp:#4FB3DE}}
.cr-wrap{display:grid;grid-template-columns:300px minmax(0,1fr);gap:24px;align-items:start}
.cr-card{background:#13202E;color:#F4F7FA;border-radius:12px;padding:18px 18px 12px;position:relative;border:1px solid #2C3B4B}
.cr-card .insignia{position:absolute;right:18px;top:16px}.cr-card .insignia svg{width:44px;height:auto}
.cr-k{font:700 .78rem var(--f-display);letter-spacing:.16em;text-transform:uppercase;color:#E2BC4A}
.cr-n{font:700 1.8rem/1.05 var(--f-display);margin:2px 64px 12px 0}
.cr-row{display:flex;justify-content:space-between;gap:8px;font-size:.82rem;color:#B8C4D0}.cr-row .mono{color:#fff}
.cr-bar{height:8px;border-radius:6px;background:var(--line);overflow:hidden;margin-top:6px}.cr-bar i{display:block;height:100%;border-radius:6px;background:var(--crp)}
.cr-card .cr-bar{background:#2C3B4B}.cr-card .cr-bar i{background:#E2BC4A}
.cr-ladder{margin-top:14px;border-top:1px solid #2C3B4B;padding-top:8px}
.cr-ladder div{display:flex;justify-content:space-between;font-size:.8rem;padding:4px 0;color:#8697A8}.cr-ladder div.done{color:#C6D1DC}
.cr-ladder div.on{color:#fff;font-weight:600}.cr-ladder div.on span:first-child:before{content:"▶ ";color:#E2BC4A}
.cr-side .hint{margin:10px 2px 0;font-size:.78rem}
.cr-main h3{display:flex;align-items:baseline;gap:10px;margin:0 0 10px}.cr-main h3 small{font:500 .85rem var(--f-body);color:var(--muted)}
.cr-near{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:20px}
.cr-nc{display:grid;grid-template-columns:40px minmax(0,1fr);gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--sheet)}
.cr-nic{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--sunk);color:var(--muted)}.cr-nic svg{width:22px;height:22px}
.cr-nc b{display:block;font-size:.9rem}.cr-nc small{display:block;color:var(--muted);font-size:.76rem}
.cr-p{display:flex;align-items:center;gap:8px}.cr-p .cr-bar{flex:1;margin:4px 0 0;height:6px}.cr-p span{font-size:.72rem;color:var(--muted);white-space:nowrap;margin-top:4px}
.cr-meds{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:16px 10px}
.cr-med{text-align:center;min-width:0}
.cr-ic{width:72px;height:72px;margin:0 auto 6px;position:relative}
.cr-ring{position:absolute;inset:0;transform:rotate(-90deg)}.cr-ring circle{fill:none;stroke-width:4}.cr-track{stroke:var(--line)}
.cr-val{stroke:var(--crp);stroke-linecap:round}.cr-val.won{stroke:var(--gold)}
.cr-ic>span{position:absolute;inset:8px;border-radius:50%;display:grid;place-items:center;background:var(--sunk);color:var(--muted)}.cr-ic>span svg{width:26px;height:26px}
.cr-med b{display:block;font-size:.84rem;line-height:1.2}.cr-med small{display:block;font-size:.72rem;color:var(--muted);line-height:1.25;margin-top:2px}
.cr-f{display:block;font-size:.72rem;color:var(--crp);margin-top:3px}
.cr-med.won .cr-ic>span{background:linear-gradient(145deg,#F2D675,#C9A227);color:#13202E;box-shadow:0 0 0 3px var(--gold-soft),0 2px 8px rgba(201,162,39,.4)}
.cr-med.won .cr-f{color:var(--ok)}
@media (max-width:900px){.cr-wrap{grid-template-columns:1fr}.cr-near{grid-template-columns:1fr}}
@media (max-width:480px){.cr-meds{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 6px}.cr-ic{width:60px;height:60px}.cr-ic>span{inset:7px}.cr-ic>span svg{width:22px;height:22px}}
@media print{.cr-card{background:#fff;color:#000}}`;
 const st=document.createElement("style");st.id="career2-css";st.textContent=css;document.head.appendChild(st);
})();
