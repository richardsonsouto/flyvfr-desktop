/* =========================================================================
   Salário simulado — pago por hora de voo, como nas companhias aéreas:
   - valor da hora conforme a patente do piloto no momento do voo
     e a categoria da aeronave (turbo-hélice ganha menos que widebody);
   - diária de pernoite por noite fora da base nas escalas voadas.
   Valores em dólares, de referência, apenas para simulação.
   ========================================================================= */
const PAY_RANK={r_cadet:35,r_so:55,r_fo:80,r_sfo:105,r_cpt:160,r_scpt:210,r_mcpt:260};   // US$/h em narrowbody
const PAY_CAT={ga:0.55,tp:0.75,rj:0.9,nb:1,wb:1.3};
const PAY_DIEM={dom:85,intl:120};   // US$ por noite fora da base
const PAY_CATS=["ga","tp","rj","nb","wb"];
let payMonth=null;   // "AAAA-MM"
/* moeda de recebimento: valores definidos em US$ e convertidos pela cotação do dia */
const PAY_CURS=["USD","EUR","BRL","GBP","JPY","CNY","CAD","AUD","CHF","MXN","ARS","CLP","COP","PEN","INR","KRW","ZAR","SEK","NZD"];
const FX_FALLBACK={USD:1,EUR:0.87,BRL:5.5,GBP:0.74,JPY:146,CNY:7.2,CAD:1.37,AUD:1.53,CHF:0.8,MXN:18.8,ARS:1250,CLP:940,COP:4000,PEN:3.6,INR:86,KRW:1380,ZAR:17.8,SEK:9.6,NZD:1.68};
let payCur="USD";try{const c=localStorage.getItem("vfr-cur");if(PAY_CURS.includes(c))payCur=c}catch(e){}
let FX=null;   // {rates, at (ms), live}
try{const c=JSON.parse(localStorage.getItem("vfr-fx")||"null");if(c&&c.rates&&c.at)FX=c}catch(e){}
let fxLoading=false;
function loadFx(){
  if(fxLoading||(FX&&FX.live&&Date.now()-FX.fetched<6*36e5))return;
  fxLoading=true;
  fetch("https://open.er-api.com/v6/latest/USD").then(r=>r.json()).then(j=>{
    if(j&&j.result==="success"&&j.rates){FX={rates:j.rates,at:(j.time_last_update_unix||Date.now()/1e3)*1e3,fetched:Date.now(),live:true};
      try{localStorage.setItem("vfr-fx",JSON.stringify(FX))}catch(e){}
      if(view==="logbook"&&lbTab==="pay")render()}
  }).catch(()=>{}).finally(()=>{fxLoading=false})}
/* cotação histórica: cada voo é convertido pela cotação do dia em que foi realizado
   (taxa de referência do Banco Central Europeu via frankfurter.dev; fim de semana/feriado usa o último dia útil) */
const FXH_CURS=["EUR","BRL","GBP","JPY","CNY","CAD","AUD","CHF","MXN","INR","KRW","ZAR","SEK","NZD"];
let FXH={};try{FXH=JSON.parse(localStorage.getItem("vfr-fxh")||"{}")||{}}catch(e){FXH={}}
const fxhLoading={};
const dKey=ms=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(ms);
function loadFxHist(cur,fromMs){
  if(!FXH_CURS.includes(cur)||fxhLoading[cur])return;
  const h=FXH[cur],from=dKey(fromMs-7*864e5);
  const fresh=h&&h.from<=from&&Date.now()-(h.fetched||0)<6*36e5;if(fresh)return;
  fxhLoading[cur]=true;
  fetch(`https://api.frankfurter.dev/v1/${from}..?base=USD&symbols=${cur}`).then(r=>r.json()).then(j=>{
    if(!j||!j.rates)return;const days={};for(const d in j.rates)if(j.rates[d][cur])days[d]=j.rates[d][cur];
    FXH[cur]={from,fetched:Date.now(),days,keys:Object.keys(days).sort()};
    try{localStorage.setItem("vfr-fxh",JSON.stringify(FXH))}catch(e){}
    if(view==="logbook"&&lbTab==="pay")render()}).catch(()=>{}).finally(()=>{fxhLoading[cur]=false})}
/* cotação válida na data (último dia útil até a data); sem histórico, usa a de hoje */
function fxOn(c,ms){if(c==="USD")return 1;const h=FXH[c];if(!h||!h.keys||!h.keys.length)return fxRate(c);
  const k=dKey(ms),ks=h.keys;if(k<ks[0])return fxRate(c);
  let lo=0,hi=ks.length-1,best=-1;while(lo<=hi){const m=(lo+hi)>>1;if(ks[m]<=k){best=m;lo=m+1}else hi=m-1}
  return best>=0?h.days[ks[best]]:fxRate(c)}
const fxHasHist=c=>c==="USD"||!!(FXH[c]&&FXH[c].keys&&FXH[c].keys.length);
const usdAt=(v,ms)=>moneyIn(v*fxOn(payCur,ms),payCur);
const fxRate=c=>c==="USD"?1:((FX&&FX.rates&&FX.rates[c])||FX_FALLBACK[c]||1);
const curName=c=>{try{return new Intl.DisplayNames([LOCALE[lang]],{type:"currency"}).of(c)}catch(e){return c}};
const moneyIn=(v,c)=>new Intl.NumberFormat(LOCALE[lang],{style:"currency",currency:c}).format(v);
const usd=v=>moneyIn(v*fxRate(payCur),payCur);
const payRate=(rk,cat)=>Math.round((PAY_RANK[rk]||PAY_RANK.r_cadet)*(PAY_CAT[cat]||1));
const monthKey=ms=>{const d=new Date(ms);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`};
const payMonthName=k=>{const s=monthName(k);return s.charAt(0).toUpperCase()+s.slice(1)};
const monthShift=(k,n)=>{const [y,m]=k.split("-").map(Number);return monthKey(new Date(y,m-1+n,1).getTime())};

/* todos os lançamentos do piloto: um por voo e um por pernoite */
function payEntries(pid){
  const fl=data.flights.filter(f=>f.pilotId===pid&&f.verified!==false).sort((a,b)=>a.createdAt-b.createdAt);
  let cum=0;const items=[];
  for(const f of fl){const a=acById(f.aircraftId);const rk=rankOf(cum/60).k;const cat=a?rsClassOf(a):"nb";const rate=payRate(rk,cat);const h=(f.blockMin||0)/60;
    items.push({kind:"flight",at:f.createdAt,f,a,rk,cat,rate,h,v:Math.round(rate*h*100)/100});cum+=f.blockMin||0}
  /* pernoites: pernas consecutivas da mesma escala, ambas voadas, com descanso longe da base */
  const resOf=f=>f.reservationId&&data.reservations.find(r=>r.id===f.reservationId);
  const byRoster={};for(const f of fl){const r=resOf(f);if(r&&r.rosterId)(byRoster[r.rosterId]=byRoster[r.rosterId]||[]).push({f,r})}
  for(const id in byRoster){const legs=byRoster[id].sort((x,y)=>x.r.start-y.r.start);
    const allLegs=data.reservations.filter(r=>r.rosterId===id).sort((x,y)=>x.start-y.start);const home=(allLegs[0]||legs[0].r).dep;
    for(let i=0;i+1<legs.length;i++){const p=legs[i].r,n=legs[i+1].r;const gap=n.start-p.end;
      if(gap<8*36e5||p.arr===home||n.dep!==p.arr)continue;
      const nights=Math.max(1,Math.round(gap/864e5));
      const intl=AIRPORTS&&AIRPORTS[p.arr]&&AIRPORTS[home]&&AIRPORTS[p.arr][5]!==AIRPORTS[home][5];
      const per=intl?PAY_DIEM.intl:PAY_DIEM.dom;
      items.push({kind:"diem",at:p.end,icao:p.arr,nights,intl:!!intl,per,v:per*nights})}}
  return items.sort((a,b)=>a.at-b.at)}

function lbPay(pid){
  if(!AIRPORTS)loadAirports();
  loadFx();
  const items=payEntries(pid);
  if(payCur!=="USD"&&items.length)loadFxHist(payCur,items[0].at);
  const cv=x=>x.v*fxOn(payCur,x.at);   /* valor do lançamento na moeda escolhida, pela cotação da data */
  if(!payMonth)payMonth=monthKey(Date.now());
  const inM=items.filter(x=>monthKey(x.at)===payMonth);
  const fl=inM.filter(x=>x.kind==="flight"),dm=inM.filter(x=>x.kind==="diem");
  const sum=l=>l.reduce((s,x)=>s+cv(x),0),money=v=>moneyIn(v,payCur);
  const hrs=fl.reduce((s,x)=>s+x.h,0),pay=sum(fl),diem=sum(dm),nights=dm.reduce((s,x)=>s+x.nights,0);
  const y=payMonth.slice(0,4),yearTot=sum(items.filter(x=>monthKey(x.at).startsWith(y))),allTot=sum(items);
  const curRank=rankOf(data.flights.filter(f=>f.pilotId===pid&&f.verified!==false).reduce((s,f)=>s+(f.blockMin||0),0)/60);
  const other=pid!==myId;
  const nav=`<div class="pay-nav"><button class="btn small" data-action="pay-m" data-n="-1" aria-label="${esc(t("pay_prev"))}">‹</button><b>${esc(payMonthName(payMonth))}</b><button class="btn small" data-action="pay-m" data-n="1" aria-label="${esc(t("pay_next"))}" ${payMonth>=monthKey(Date.now())?"disabled":""}>›</button></div>`;
  const live=FX&&FX.live&&FX.rates&&FX.rates[payCur];
  const curSel=`<label class="pay-cur"><span>${t("pay_currency")}</span><select id="pay-cur">${PAY_CURS.map(c=>`<option value="${c}"${c===payCur?" selected":""}>${c} — ${esc(curName(c))}</option>`).join("")}</select></label>`;
  const hist=FXH_CURS.includes(payCur);
  const fxLine=payCur==="USD"?"":`<p class="hint pay-fx">${hist?t("pay_fx_hist",{v:esc(moneyIn(fxRate(payCur),payCur))}):t("pay_fx_nohist",{v:esc(moneyIn(fxRate(payCur),payCur))})}${!live?" "+t("pay_fx_approx",{v:esc(moneyIn(fxRate(payCur),payCur))}):""}</p>`;
  const tiles=`<div class="pay-tiles">
    <div><span>${t("pay_hours")}</span><b>${block(Math.round(hrs*60))}</b></div>
    <div><span>${t("pay_flying")}</span><b>${money(pay)}</b></div>
    <div><span>${t("pay_diems",{n:nights})}</span><b>${money(diem)}</b></div>
    <div class="tot"><span>${t("pay_total")}</span><b>${money(pay+diem)}</b></div></div>`;
  const fxCell=x=>payCur==="USD"?"":`<td class="num mono muted">${esc(moneyIn(fxOn(payCur,x.at),payCur))}</td>`;
  const rows=fl.slice().reverse().map(x=>{const a=x.a;return`<tr><td class="mono">${dateF(x.at)}</td><td class="mono">${fnoChip(fnoOf(x.f))} ${esc(x.f.dep)} → ${esc(x.f.arr)}</td>
    <td><span class="pay-ac">${regTag(a,x.f.aircraftId)}<span class="pay-ac-t">${esc(a?.type||"")}<small>${esc(t("pay_cat_"+x.cat))}</small></span></span></td>
    <td class="num mono">${block(x.f.blockMin||0)}</td><td>${esc(t(x.rk))}</td><td class="num mono">${usdAt(x.rate,x.at)}</td>${fxCell(x)}<td class="num mono"><b>${money(cv(x))}</b></td></tr>`}).join("");
  const drows=dm.slice().reverse().map(x=>`<tr><td class="mono">${dateF(x.at)}</td><td>${wxCode(x.icao)} <span class="muted">${t(x.intl?"pay_intl":"pay_dom")}</span></td><td class="num mono">${x.nights}</td><td class="num mono">${usdAt(x.per,x.at)}</td>${fxCell(x)}<td class="num mono"><b>${money(cv(x))}</b></td></tr>`).join("");
  const rateTbl=`<div class="scroll"><table class="lb-t pay-rates"><thead><tr><th>${t("pay_rank")}</th>${PAY_CATS.map(c=>`<th class="num">${t("pay_cat_"+c)}</th>`).join("")}</tr></thead><tbody>
    ${RANKS.map(r=>`<tr${r.k===curRank.k?' class="is-me"':""}><td>${esc(t(r.k))} <span class="muted">(${r.h} h+)</span></td>${PAY_CATS.map(c=>`<td class="num mono">${usd(payRate(r.k,c))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="hint" style="margin:8px 0 0">${t("pay_diem_rule",{d:usd(PAY_DIEM.dom),i:usd(PAY_DIEM.intl)})}</p>`;
  return`${other?`<div class="notice">${t("lb_viewing",{p:esc(pilot(pid))})} <button class="linkish" data-action="lb-me">${t("lb_back_me")}</button></div>`:""}
  <div class="panel pay">
    <div class="pay-head"><div><span class="eyebrow">${t("pay_eyebrow")}</span><h3 style="margin:2px 0 0">${t("pay_title")}</h3><p class="muted" style="margin:4px 0 0;font-size:.85rem">${t("pay_now",{r:esc(t(curRank.k))})}</p></div><div class="pay-ctl">${curSel}${nav}</div></div>
    ${fxLine}
    ${tiles}
    <div class="pay-sub"><span>${t("pay_year",{y})} <b class="mono">${money(yearTot)}</b></span><span>${t("pay_all")} <b class="mono">${money(allTot)}</b></span></div>
    <h3>${t("pay_flights")}</h3>
    ${fl.length?`<div class="scroll"><table class="lb-t"><thead><tr><th>${t("pay_date")}</th><th>${t("rs_col_route")}</th><th>${t("aircraft")}</th><th class="num">${t("lb_hours")}</th><th>${t("pay_rank")}</th><th class="num">${t("pay_rate")}</th>${payCur==="USD"?"":`<th class="num">${t("pay_col_fx")}</th>`}<th class="num">${t("pay_value")}</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<p class="muted" style="margin:0">${t("pay_none")}</p>`}
    ${dm.length?`<h3>${t("pay_diem_h")}</h3><div class="scroll"><table class="lb-t"><thead><tr><th>${t("pay_date")}</th><th>${t("pay_where")}</th><th class="num">${t("pay_nights")}</th><th class="num">${t("pay_per")}</th>${payCur==="USD"?"":`<th class="num">${t("pay_col_fx")}</th>`}<th class="num">${t("pay_value")}</th></tr></thead><tbody>${drows}</tbody></table></div>`:""}
    <details class="pay-tbl"><summary>${t("pay_table")}</summary>${rateTbl}</details>
    <p class="hint" style="margin:0">${t("pay_disclaimer")}</p>
  </div>`}
document.addEventListener("click",e=>{const el=e.target.closest('[data-action="pay-m"]');if(!el)return;payMonth=monthShift(payMonth||monthKey(Date.now()),Number(el.dataset.n));render()});
document.addEventListener("change",e=>{if(e.target.id!=="pay-cur")return;payCur=e.target.value;try{localStorage.setItem("vfr-cur",payCur)}catch(x){}render()});
