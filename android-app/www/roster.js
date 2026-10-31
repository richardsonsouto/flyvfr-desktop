/* =========================================================================
   Escala de voos (roster) — gera uma sequência de voos como a escala de uma
   tripulação de companhia aérea e reserva todas as pernas de uma vez.
   Regras inspiradas nas escalas reais (EASA/ANAC, simplificadas):
   - cada voo sai de onde o anterior pousou; o último volta ao aeródromo de partida;
   - apresentação 60 min antes da 1ª saída, liberação 30 min após o último pouso;
   - jornada máxima de 13 h; descanso mínimo de 12 h entre jornadas;
   - tempo de solo entre pernas conforme o tipo de aeronave;
   - malha hub-and-spoke: dos hubs saem as linhas, das bases voltam ao hub;
   - longo curso: uma perna por jornada e pernoite de 24 h ou mais no destino.
   ========================================================================= */
let RS_AP=null,rsApP=null;
function loadRosterAirports(){if(RS_AP&&RS_AP.list.length&&AIRPORTS&&Object.keys(AIRPORTS).length>1000)return Promise.resolve(RS_AP);if(rsApP)return rsApP;
  rsApP=Promise.all([fetch("roster-ap.json?v=1").then(r=>{if(!r.ok)throw new Error("roster-ap "+r.status);return r.json()}),loadAirports()]).then(([j])=>{
    RS_AP={L:new Set(j.L||[]),M:new Set(j.M||[]),list:[...(j.L||[]),...(j.M||[])]};rsApP=null;render();return RS_AP})
    .catch(()=>{rsApP=null;if(!RS_AP)RS_AP={L:new Set(),M:new Set(),list:[]};return RS_AP});return rsApP}

/* perfil operacional por tipo de aeronave */
const RS_RANGE={A318:3100,A319:3700,A320:3300,A20N:3500,A321:3000,A21N:3700,B733:2200,B734:2100,B736:3000,B737:3000,B738:2900,B739:2900,B38M:3500,B39M:3300,
  BCS1:3000,BCS3:3300,E170:2100,E175:2000,E190:2400,E195:2300,E290:2800,E295:2600,E135:1700,E145:1500,CRJ9:1500,CRJX:1600,
  AT76:800,AT46:700,DH8D:1100,DH8C:800,F50:1000,DHC6:700,C208:900,C408:900,PC12:1500,C172:500,
  A332:7200,A333:6300,A338:8000,A339:7200,A359:8100,A35K:8700,A343:7000,A346:7800,A388:8000,B744:7200,B748:7700,
  B763:5900,B772:5200,B77L:8500,B77W:7300,B788:7300,B789:7600,B78X:6300};
const RS_CLASS={
  ga:{min:40,max:350,legs:[3,6],turn:[45,55],fdp:11*60,dom:8},
  tp:{min:80,max:550,legs:[3,6],turn:[45,55],fdp:12*60,dom:6},
  rj:{min:120,max:1200,legs:[3,5],turn:[45,60],fdp:13*60,dom:6},
  nb:{min:180,max:2600,legs:[2,4],turn:[50,75],fdp:13*60,dom:6},
  wb:{min:2500,max:8000,legs:[1,1],turn:[90,120],fdp:16*60,dom:1}};
function rsClassOf(a){const ty=icaoType(a&&a.type);
  if(isWide(a&&a.type))return"wb";
  if(["C172","C208","C408","PC12","DHC6"].includes(ty))return"ga";
  if(["AT76","AT46","DH8D","DH8C","F50"].includes(ty))return"tp";
  if(["E135","E145","E170","E175","E190","E195","E290","E295","CRJ9","CRJX","BCS1"].includes(ty))return"rj";
  return"nb"}
function rsProfile(a){const cls=rsClassOf(a),c=RS_CLASS[cls],ty=icaoType(a&&a.type),rng=RS_RANGE[ty]||(cls==="wb"?6500:cls==="nb"?3000:cls==="rj"?1500:800);
  return{cls,...c,max:Math.min(c.max,Math.round(rng*0.85)),range:Math.round(rng*0.9),kt:CRUISE_KT[ty]||(cls==="wb"?480:cls==="nb"?450:cls==="rj"?440:280)}}
const rsBlock=(p,nm)=>Math.ceil(Math.max(20,(nm*1.07/p.kt)*60+(p.kt<300?18:30))/5)*5;
const rsRand=(a,b)=>a+Math.random()*(b-a);
const rsInt=(a,b)=>Math.floor(rsRand(a,b+1));
const rs5=ms=>Math.round(ms/3e5)*3e5;
const rsNm=(x,y)=>gcNm(AIRPORTS[x],AIRPORTS[y]);
const RS_FDP_LONG=17*60;    // longo curso com tripulação de revezamento
const RS_REST=[12*60,15*60];  // descanso entre jornadas (min)
const RS_REST_LONG=[24*60,30*60];

let RS_WH=null;
function rsWorldHubs(){if(RS_WH)return RS_WH;const s=new Set();for(const k in HUBS)for(const h of HUBS[k])if(AIRPORTS[h[0]])s.add(h[0]);return RS_WH=[...s]}
function rsWeighted(list){let tot=0;for(const x of list)tot+=x.w;let r=Math.random()*tot;for(const x of list){r-=x.w;if(r<=0)return x.k}return list.length?list[list.length-1].k:null}
/* sorteia o próximo destino a partir de cur */
function rsPick(ctx,cur,opt){
  const {p,hubs,country}=ctx;const C=AIRPORTS[cur];if(!C)return null;
  const must=opt.mustReach;            // depois deste voo, precisa conseguir chegar ali (volta à base)
  const minNm=opt.minNm??p.min,maxNm=opt.maxNm??p.max;
  const out=[];
  /* longo curso só entre grandes hubs mundiais (os hubs das companhias do VFR) */
  const pool=p.cls==="wb"?rsWorldHubs():RS_AP.list;
  for(const k of pool){if(k===cur||k===opt.exclude||!AIRPORTS[k])continue;
    const d=gcNm(C,AIRPORTS[k]);if(d<minNm||d>maxNm)continue;
    if(must&&k!==must&&rsNm(k,must)>p.max)continue;
    let w=RS_AP.L.has(k)?3:1;
    if(AIRPORTS[k][5]===country)w*=p.dom;
    if(hubs.includes(k))w*=2.5;
    if(opt.avoid&&opt.avoid.has(k))w*=0.15;
    /* as malhas reais têm mais trechos curtos e médios do que longos */
    if(p.cls!=="wb")w*=Math.exp(-d/(p.max*0.45));
    out.push({k,w})}
  return rsWeighted(out)}

/* uma tentativa de escala; devolve {legs,days} ou {err} */
function rsAttempt(ctx){
  const {p,ac,home,startMs,days,finalTarget}=ctx;const legs=[];let cur=ctx.from,t=startMs;
  const turn=()=>Math.round(rsInt(p.turn[0],p.turn[1])/5)*5*6e4;
  const addLeg=(dep,arr,std,extra)=>{const nm=rsNm(dep,arr),blk=rsBlock(p,nm);const sta=std+blk*6e4;const L={dep,arr,std,sta,nm:Math.round(nm),blk,...extra};legs.push(L);return L};
  /* Não criamos traslado: uma aeronave com posição conhecida sai de onde está. */
  if(cur!==home)return{err:"position",from:cur,to:home};
  const target=finalTarget||home;
  const out=[];let day=1;let reportAt=(legs[0]?legs[0].std:t)-60*6e4;
  if(p.cls==="wb"){
    if(days===1){ /* 1 dia: um voo de longo curso (a aeronave fica no destino) */
      if(finalTarget){if(cur===finalTarget)return{err:"none"};addLeg(cur,finalTarget,t,{day:1});return{legs,free:true}}
      const d=rsPick(ctx,cur,{minNm:Math.min(2500,p.max*0.5),maxNm:p.max});if(!d)return{err:"none"};
      addLeg(cur,d,t,{day:1});return{legs,free:true}
    }else{ /* ida longa no 1º dia, pernoite(s), volta no último */
      const d=rsPick(ctx,cur,{minNm:Math.min(2500,p.max*0.5),maxNm:p.max,mustReach:target});if(!d)return{err:"none"};
      const L=addLeg(cur,d,t,{day:1});
      const rest=Math.max(RS_REST_LONG[0]*6e4,(days-1)*24*36e5-rsInt(0,6)*36e5);
      let std=rs5(L.sta+30*6e4+rest+60*6e4);
      if(d!==target)addLeg(d,target,std,{day:days})}
  }else if(days===1&&ctx.legsPerDay===1){ /* 1 dia, 1 voo: um trecho só (a aeronave fica no destino) */
    const legMax=Math.min(p.max,Math.max(p.min*1.3,(p.fdp-90-(p.kt<300?18:30))*p.kt/60/1.07));
    const d=finalTarget?(cur===finalTarget?null:finalTarget):rsPick(ctx,cur,{maxNm:legMax});if(!d||rsNm(cur,d)>p.range)return{err:"none"};
    addLeg(cur,d,t,{day:1});return{legs,free:true}
  }else{
    for(day=1;day<=days;day++){
      const n=ctx.legsPerDay||rsInt(p.legs[0],p.legs[1]);const last=day===days;
      /* com quantidade fixa de voos, limita a distância de cada trecho para caber na jornada */
      const legMax=ctx.legsPerDay?Math.min(p.max,Math.max(p.min*1.3,((p.fdp-90-(n-1)*p.turn[1])/n-(p.kt<300?18:30))*p.kt/60/1.07)):p.max;
      if(day>1){const prev=legs[legs.length-1];const rel=prev.sta+30*6e4,earliest=rel+RS_REST[0]*6e4;
        /* como nas escalas reais: a nova jornada começa num horário "de dia" (05h30–13h) do dia seguinte, respeitado o descanso mínimo */
        const nd=new Date(rel);nd.setDate(nd.getDate()+1);nd.setHours(5,30,0,0);let rep=rs5(nd.getTime()+rsInt(0,15)*30*6e4);
        if(rep<earliest){rep=rs5(earliest+rsInt(0,6)*15*6e4);const h=new Date(rep).getHours();if(h<5)rep+=(5-h)*36e5}
        t=rep+60*6e4;reportAt=rep}
      else reportAt=(legs.length?legs[0].std:t)-60*6e4;
      const visited=new Set([cur]);
      for(let i=0;i<n;i++){
        const lastLeg=last&&i===n-1;let d;
        if(lastLeg){d=target;if(cur===target)break}
        else{
          const needBack=last?target:null,noTarget=(last&&i===n-2)||(n===1&&day===days-1);
          /* hub-and-spoke: de uma base fora do hub, costuma voltar ao hub */
          const atHub=ctx.hubs.includes(cur)||cur===home;
          if(!atHub&&Math.random()<0.55){const back=[home,...ctx.hubs].filter(h=>h!==cur&&AIRPORTS[h]&&rsNm(cur,h)<=legMax&&rsNm(cur,h)>=Math.min(p.min,60)&&!(noTarget&&h===target)&&(!needBack||h===needBack||rsNm(h,needBack)<=p.max));d=back.length?back[0]:null}
          if(!d)d=rsPick(ctx,cur,{mustReach:needBack,avoid:visited,maxNm:legMax,exclude:noTarget?target:null});
          if(!d)return{err:"none"}}
        if(rsNm(cur,d)>p.range)return{err:"none"};
        const L=addLeg(cur,d,t,{day});visited.add(d);
        /* jornada: apresentação até liberação */
        if(L.sta+30*6e4-reportAt>p.fdp*6e4)return{err:"fdp"};
        t=L.sta+turn();cur=d}
      if(last&&cur!==target)return{err:"none"}}
  }
  /* jornada do longo curso */
  if(p.cls==="wb"){const byDay={};for(const L of legs){(byDay[L.day]=byDay[L.day]||[]).push(L)}
    for(const k in byDay){const ls=byDay[k];if(ls[ls.length-1].sta+30*6e4-(ls[0].std-60*6e4)>RS_FDP_LONG*6e4)return{err:"fdp"}}}
  if(!legs.length)return{err:"none"};
  if(legs[legs.length-1].arr!==target)return{err:"none"};
  return{legs}}

// Reservations include 20 minutes before departure and 25 after arrival.
const RS_RESERVATION_GAP_MIN=45;
function rsReservationSequenceError(legs){
 for(let i=1;i<legs.length;i++){const previous=legs[i-1],next=legs[i];if(previous.arr!==next.dep)return{err:'sequence_route',previous:previous.flightNo||previous.arr,next:next.flightNo||next.dep};const minutes=Math.round((next.std-previous.sta)/6e4);if(next.std-previous.sta<RS_RESERVATION_GAP_MIN*6e4)return{err:'sequence_gap',previous:previous.flightNo||previous.dep+' → '+previous.arr,next:next.flightNo||next.dep+' → '+next.arr,minutes}}
 return null;
}
function rsValidate(ctx,legs){
  const {ac}=ctx;const now=Date.now();
  const sequence=rsReservationSequenceError(legs);if(sequence)return{sequence};
  if(legs[0].std-20*6e4<now)return"past";
  const other=data.reservations.filter(r=>r.aircraftId===ac.id&&booked(r));
  const aog=windowsFor(ac.id).filter(w=>w.kind==="aog");
  const s0=legs[0].std-20*6e4,e0=legs[legs.length-1].sta+25*6e4;
  for(const r of other)if(r.start<e0&&r.end>s0)return{busy:r};   /* nem no meio da escala (pernoites) */
  /* o piloto não pode ter outro voo (em qualquer aeronave) nem outra escala dentro do período desta */
  if(typeof myClash==="function"){const mc=myClash(s0,e0);if(mc)return{mine:mc}}
  for(const L of legs){const s=L.std-20*6e4,e=L.sta+25*6e4;
    for(const w of aog)if(w.s<e&&w.e>s)return{aog:w}}
  return null}

function rsFno(ac){const code=(AIRLINE_IATA[ac.airline]||AIRLINE_ICAO[ac.airline]||"VF").toUpperCase();
  const base=rsInt(5,44)*200;let n=base;
  return L=>{if(L.ferry)return`${code} 9${String(rsInt(100,999))}`;n+=rsInt(1,3);return`${code} ${n}`}}

/* ---------- voos reais (grade da ANAC) ----------
   schedule.json: grade semanal montada do VRA da ANAC (voos regulares de passageiros de/para o Brasil),
   horários em hora de Brasília. Cada voo: [número, origem, destino, minuto da partida, tempo de bloco, dias da semana]
   (dias: bit 0 = segunda … bit 6 = domingo). A escala só usa voos dessa grade — nada é inventado. */
let SCHED=null,schedP=null;
function loadSchedule(){if(SCHED)return Promise.resolve(SCHED);if(schedP)return schedP;
  schedP=fetch("schedule.json?v=2").then(r=>r.ok?r.json():null).then(j=>{SCHED=j||{al:{}};SCHED.idx={};
    for(const al in SCHED.al){const m=SCHED.idx[al]={};for(const f of SCHED.al[al])(m[f[1]]=m[f[1]]||[]).push(f)}return SCHED})
   .catch(()=>{SCHED={al:{},idx:{}};return SCHED});return schedP}
const schedIcao=ac=>{const c=AIRLINE_ICAO[ac.airline];return c&&SCHED&&SCHED.idx[c]?c:null};
const hasRealSched=ac=>!!(ac&&schedIcao(ac));
/* partidas reais de um aeroporto entre dois instantes (ms UTC) */
function realDeps(al,apt,from,to){const list=(SCHED.idx[al]||{})[apt];if(!list)return[];const tz=SCHED.tz||-180,out=[];
  const d0=Math.floor((from+tz*6e4)/864e5)-1,d1=Math.floor((to+tz*6e4)/864e5)+1;
  for(let d=d0;d<=d1;d++){const wd=(new Date(d*864e5).getUTCDay()+6)%7;
    for(const f of list){if(!(f[5]>>wd&1))continue;const std=d*864e5+(f[3]-tz)*6e4;if(std<from||std>to)continue;
      out.push({fno:f[0],dep:f[1],arr:f[2],std,sta:std+f[4]*6e4,blk:f[4],typ:f[6]||"",route:f[7]||"",fl:f[8]||"",spd:f[9]||""})}}
  return out.sort((a,b)=>a.std-b.std)}
const RS_TURN_MIN={ga:45,tp:45,rj:45,nb:45,wb:75};
/* famílias de aeronaves: um voo planejado com A320 pode ser feito com A20N/A321 etc., nunca com outro tipo */
const RS_FAM={B736:"737",B737:"737",B738:"737",B739:"737",B38M:"737",B39M:"737",A318:"320",A319:"320",A320:"320",A20N:"320",A321:"320",A21N:"320",
  E190:"E2",E195:"E2",E290:"E2",E295:"E2",AT43:"ATR",AT45:"ATR",AT46:"ATR",AT72:"ATR",AT75:"ATR",AT76:"ATR",
  A332:"330",A333:"330",A338:"330",A339:"330",B788:"787",B789:"787",B78X:"787",B772:"777",B77W:"777",B77L:"777",B763:"767",B764:"767",
  A359:"350",A35K:"350",C208:"C208"};
/* voo real compatível com a aeronave: com tipo informado (RPL), mesma família; sem tipo (VRA), pelo alcance */
function rsRealOk(p,ac,f){if(f.typ){const a=RS_FAM[icaoType(ac.type)],b=RS_FAM[f.typ];if(!a||!b||a!==b)return false;
    return!!(AIRPORTS[f.dep]&&AIRPORTS[f.arr])&&rsNm(f.dep,f.arr)<=p.range}
  return rsRealFits(p,f.dep,f.arr)}
function rsRealFits(p,dep,arr){if(!AIRPORTS[dep]||!AIRPORTS[arr])return false;const nm=rsNm(dep,arr);if(nm>p.range)return false;
  return p.cls==="wb"?nm>=1500:nm<=p.max}
/* procura uma sequência de voos reais (busca em profundidade com limite) */
function realRoster(ctx,startMs,cur,mustEnd){
  const {p,ac,days,finalTarget,nxStart}=ctx,al=schedIcao(ac),n=ctx.legsPerDay||1,code=(AIRLINE_IATA[ac.airline]||al).toUpperCase();
  const fdp=(p.cls==="wb"?RS_FDP_LONG:p.fdp)*6e4,turn=Math.max(RS_RESERVATION_GAP_MIN,RS_TURN_MIN[p.cls]||RS_RESERVATION_GAP_MIN)*6e4,rest=(p.cls==="wb"?RS_REST_LONG[0]:RS_REST[0])*6e4;
  let budget=25000;const legs=[];
  const cand=(from,to,c,avoid)=>{const xs=realDeps(al,c,from,to).filter(f=>rsRealOk(p,ac,f));
    /* evita voltar a um aeroporto já visitado no mesmo dia (exceto o destino final), sem descartar */
    return xs.sort((a,b)=>(avoid.has(a.arr)-avoid.has(b.arr))||(a.std-b.std)).slice(0,6)};
  function go(c,t,day,k,report,visited){
    if(--budget<0)return false;
    if(day>days)return(!mustEnd||c===mustEnd)&&(!nxStart||legs[legs.length-1].sta+25*6e4<=nxStart);
    let from,to;
    if(k===0){from=t;to=day===1?t+18*36e5:t+24*36e5}else{from=t+turn;to=t+4*36e5}
    let cs=cand(from,to,c,visited);
    /* A primeira perna do voo RPL escolhido é obrigatória; as seguintes usam a grade normal. */
    const si=legs.length,S=ctx.twin&&ctx.twin.seq&&si<ctx.twin.seq.length&&legs.every(L=>L.twin)?ctx.twin.seq[si]:null;
    if(S){const m=realDeps(al,c,S.std-6e4,S.std+6e4).filter(f=>+f.fno===+S.fno&&f.std>=from&&f.std<=to&&(ctx.twin.src==="pf"?rsNm(f.dep,f.arr)<=p.range:rsRealOk(p,ac,f)));
      cs=si===0?m:m.concat(cs.filter(f=>!(+f.fno===+S.fno&&f.std===S.std)))}
    for(const f of cs){
      const rep=k===0?f.std-60*6e4:report;
      if(f.sta+30*6e4-rep>fdp)continue;
      if(nxStart&&f.sta+25*6e4>nxStart)continue;
      const last=day===days&&k===n-1;if(last&&mustEnd&&f.arr!==mustEnd)continue;
      legs.push({dep:f.dep,arr:f.arr,std:f.std,sta:f.sta,nm:Math.round(rsNm(f.dep,f.arr)),blk:f.blk,day,flightNo:`${code} ${f.fno}`,real:true,route:f.route,fl:f.fl,spd:f.spd,typ:f.typ,twin:!!(S&&+f.fno===+S.fno&&f.std===S.std)});
      const nv=new Set(k===n-1?[]:visited);nv.add(f.dep);
      const ok=k===n-1?go(f.arr,f.sta+30*6e4+rest,day+1,0,0,new Set()):go(f.arr,f.sta,day,k+1,rep,nv);
      if(ok)return true;legs.pop()}
    return false}
  return go(cur,startMs,1,0,0,new Set())?legs:null}
function generateRealRoster(ac,dep,startMs,days,legsPerDay,from,nx,twin){
  const p=rsProfile(ac);let legs=[],t=rs5(startMs),cur=from;
  /* Nem a grade RPL nem a escala simulada incluem traslado automático. */
  if(cur!==dep)return{err:"position",from:cur,to:dep};
  const ctx={p,ac,days,legsPerDay:p.cls==="wb"?1:(legsPerDay||1),finalTarget:nx?nx.dep:null,nxStart:nx?nx.start:0,twin:cur===dep?twin||null:null};
  const multi=days>1||ctx.legsPerDay>1;
  /* preferência: voltar à base no fim (como as escalas reais); se não houver, termina onde a malha real levar */
  let r=null;
  if(ctx.finalTarget)r=realRoster(ctx,t,cur,ctx.finalTarget);
  else{if(multi)r=realRoster(ctx,t,cur,dep);if(!r)r=realRoster(ctx,t,cur,null)}
  if(!r)return{err:ctx.finalTarget?"nx_real":"noreal_chain",from:cur};
  return{legs:legs.concat(r),free:!ctx.finalTarget}}

function rsTwinNote(R){const w=R&&R.twinInfo;if(!w)return"";
  return R.twin&&R.twin.src==="pf"?`<div class="notice rs-twin ok">✈ ${t("pf_note",{cs:esc(R.twin.cs),icao:esc(R.dep)})}</div>`:""}

/* gera uma escala válida (até 120 tentativas) */
function generateRoster(acId,dep,startMs,days,legsPerDay=0,twin=null){
  const ac=acById(acId);if(!ac)return{err:"ac"};
  if(!AIRPORTS||!RS_AP||Object.keys(AIRPORTS).length<1000){loadRosterAirports();return{err:"loading"}}
  dep=String(dep||"").replace(/[^A-Z0-9]/gi,"").toUpperCase();
  if(!AIRPORTS[dep])return{err:"ap",code:dep};
  const p=rsProfile(ac);
  /* Sem histórico, a aeronave pode iniciar no voo RPL escolhido. */
  const from=locAt(ac.id,startMs)||dep;
  if(!AIRPORTS[from])return{err:"ap",code:from};
  const hubs=(HUBS[ac.airline]||[]).map(h=>h[0]).filter(k=>AIRPORTS[k]&&(p.cls!=="wb"||RS_AP.L.has(k)||true));
  const mainHub=hubFor(ac)||hubs[0]||dep;const country=(AIRPORTS[mainHub]||AIRPORTS[dep])[5];
  /* reserva seguinte da aeronave: a escala precisa terminar onde ela começa e antes dela */
  const nx=nextAfter(ac.id,startMs);
  /* automático: 1 voo por dia */
  /* só voos reais: companhia sem grade real não gera escala */
  /* sem grade real para esta aeronave (companhia sem voos cadastrados, ou nenhum voo real saindo de onde ela está
     nas próximas 48 h): libera voos fictícios, marcados como simulados */
  const realOk=SCHED&&hasRealSched(ac)&&((twin&&twin.src==="pf")||realDeps(schedIcao(ac),dep,startMs,startMs+48*36e5).some(f=>rsRealOk(p,ac,f)));
  if(realOk){let r=twin?generateRealRoster(ac,dep,Math.min(startMs,twin.seq[0].std),days,legsPerDay,from,nx,twin):null;
   if(r&&r.err){r=null;twin.state="nochain"}                 /* não fecha a escala começando pelo voo real: gera a normal */
   if(!r)r=generateRealRoster(ac,dep,startMs,days,legsPerDay,from,nx);if(r.err)return r;
   const v=rsValidate({ac},r.legs);
   if(v&&v.sequence)return v.sequence;
   if(v==="past")return{err:"past"};if(v&&v.busy)return{err:"busy",r:v.busy};if(v&&v.mine)return{err:"mine",r:v.mine};if(v&&v.aog)return{err:"aog",w:v.aog};
   const fno=rsFno(ac);r.legs.forEach(L=>{if(!L.flightNo)L.flightNo=fno(L)});
   return{acId:ac.id,dep,days,cls:p.cls,legs:r.legs,real:true,src:SCHED.month,createdAt:Date.now(),twin:r.legs.some(L=>L.twin)?{cs:r.legs.filter(L=>L.twin).map(L=>L.flightNo).join(", "),n:r.legs.filter(L=>L.twin).length,src:twin.src,state:"ok"}:null}}
  const ctx={p,ac,home:dep,from,startMs:rs5(startMs),days,hubs,country,finalTarget:nx?nx.dep:null,legsPerDay:p.cls==="wb"?0:(legsPerDay||1)};
  let last=null;
  for(let i=0;i<120;i++){
    const r=rsAttempt(ctx);if(r.err){last=r;if(r.err==="far")return{err:"far",from:r.from,to:dep};continue}
    const v=rsValidate(ctx,r.legs);
    if(v&&v.sequence)return v.sequence;
    if(v==="past")return{err:"past"};
    if(v&&v.busy)return{err:"busy",r:v.busy};
    if(v&&v.mine)return{err:"mine",r:v.mine};
    if(v&&v.aog)return{err:"aog",w:v.aog};
    if(nx&&r.legs[r.legs.length-1].sta+25*6e4>nx.start){last={err:"nx"};continue}
    const fno=rsFno(ac);r.legs.forEach(L=>L.flightNo=fno(L));
    return{acId:ac.id,dep,days,cls:p.cls,legs:r.legs,sim:true,createdAt:Date.now()}}
  if(last&&last.err==="nx")return{err:"nx",r:nx};
  return{err:"none"}}

/* ---------- estado da tela ---------- */
const RS={ac:"",dep:"",start:0,days:1,legs:0,other:true,roster:null,left:null,err:"",busy:false};
try{const s=JSON.parse(localStorage.getItem("vfr-roster")||"null");if(s&&s.legs&&!s.legs.some(L=>L.ferry)&&s.legs[0].std>Date.now())RS.roster=s}catch(e){}
function rsSave(){try{RS.roster?localStorage.setItem("vfr-roster",JSON.stringify(RS.roster)):localStorage.removeItem("vfr-roster")}catch(e){}}
async function rsLoadLeft(){if(!sb||!session)return;const {data:d,error}=await sb.rpc("roster_rolls_left");
  RS.left=error?(/roster_rolls_left|Could not find|does not exist/i.test(error.message||"")?"missing":null):d;if(view==="roster")render()}

/* ---------- ponto de partida ao logar: aeródromo da cidade do piloto (se tiver voos comerciais) ou companhias do país dele ---------- */
const RS_HOME={done:false,als:null,label:"",dep:""};
const alCountry=al=>{const h=HUBS[al]&&HUBS[al][0]&&HUBS[al][0][0];if(h&&AIRPORTS&&AIRPORTS[h])return AIRPORTS[h][5]||"";
  const a=fleet.find(x=>x.airline===al),b=a&&hubFor(a);return b&&AIRPORTS&&AIRPORTS[b]?AIRPORTS[b][5]||"":""};
async function rsHomeInit(){
  if(RS_HOME.done)return;RS_HOME.done=true;
  try{
    const [pos]=await Promise.all([typeof lpGeoPos==="function"?lpGeoPos():null,AIRPORTS?null:loadAirports(),loadSchedule()]);
    if(!pos||!AIRPORTS||!fleet.length)return;
    const P=[pos.lat,pos.lon],codeOf=AIRLINE_ICAO||{},inFleet=new Set(fleet.map(a=>a.airline).filter(Boolean));
    const flies=(al,ap)=>{const c=codeOf[al];return!!(c&&SCHED&&SCHED.idx&&SCHED.idx[c]&&SCHED.idx[c][ap]&&SCHED.idx[c][ap].length)};
    /* aeroporto da cidade: o mais próximo (até ~35 nm) com voos comerciais de companhias da frota */
    /* na região metropolitana (até ~35 nm), o aeroporto com mais voos dessas companhias */
    const nDep=c=>[...inFleet].reduce((x,al)=>x+(flies(al,c)?SCHED.idx[codeOf[al]][c].length:0),0);
    let city=null,cn=0,country="";
    for(const [c,r] of Object.entries(AIRPORTS)){if(Math.abs(r[0]-P[0])>1.2||Math.abs(r[1]-P[1])>1.6)continue;if(gcNm(P,[r[0],r[1]])>35)continue;
      const n=nDep(c);if(n>cn){cn=n;city=c}}
    let near=null,nd=Infinity;for(const [c,r] of Object.entries(AIRPORTS)){if(Math.abs(r[0]-P[0])>3||Math.abs(r[1]-P[1])>4)continue;const d=gcNm(P,[r[0],r[1]]);if(d<nd&&r[5]){nd=d;near=c}}
    country=near?AIRPORTS[near][5]:"";
    const abc=(x,y)=>x.localeCompare(y,undefined,{sensitivity:"base"});
    let als=[],dep="";
    if(city){als=[...inFleet].filter(al=>flies(al,city)).sort(abc);dep=city;RS_HOME.label="📍 "+t("rs_home_city",{icao:city})}
    if(!als.length&&country){als=[...inFleet].filter(al=>alCountry(al)===country).sort(abc);dep="";RS_HOME.label="🏳 "+t("rs_home_country")}
    if(!als.length)return;
    RS_HOME.als=als;RS_HOME.dep=dep;
    /* só aplica se o piloto ainda não mexeu no formulário */
    /* a companhia é sempre escolhida pelo piloto; aqui só a partida da cidade e a ordem da lista */
    if(RS.depSet||RS.roster||RS.touched)return;
    if(dep){RS.dep=dep;RS.depSet=true}
    if(view==="roster"&&!sheet)render()}catch(e){}}

const RS_LEAD=30*6e4;
const rsEarliest=()=>Date.now()+RS_LEAD;
const rsSoonest=()=>Math.ceil(rsEarliest()/(5*6e4))*5*6e4;
/* Apply once per departure/mode/RPL choice, never on ordinary rerenders.
   A manual aircraft or airline selection remains editable and is not overwritten. */
function rsApplyFavorite(){
 if(RS.roster||RS.busy||!AIRPORTS?.[RS.dep]||!fleet.length)return;
 const key=JSON.stringify([myId,RS.dep,!!RS.other,RS.other?'':pfKey(RS.pf)]);
 if(RS.favoriteContext===key)return;
 RS.favoriteContext=key;
 if(!RS.other&&!RS.pf&&rsSoonFlights(RS.dep).length)return;
 const eligible=RS.pf&&!RS.other?rsPfAircraft(RS.pf):fleet.filter(a=>{
  const at=locAt(a.id,RS.start);return(!at||at===RS.dep)&&!movingNow(a.id)&&statusOf(a.id).key!=='bad'
   &&!data.reservations.some(r=>r.aircraftId===a.id&&booked(r)&&r.end>Date.now());
 });
 const favorite=eligible.find(a=>isFav(a.id));if(!favorite)return;
 RS.ac=favorite.id;ACP.rs.al=favorite.airline||'all';ACP.rs.q='';
}
function rsRplUnavailable(){return !!(SCHED?.idx&&AIRPORTS?.[RS.dep]&&!rsSoonFlights(RS.dep).length)}
function rsRplNone(){return !!(SCHED?.idx&&(!AIRPORTS?.[RS.dep]||rsRplUnavailable()))}
function rsRplButtonDisabled(){return !!(RS.busy||!SCHED?.idx||!AIRPORTS?.[RS.dep]||rsRplUnavailable())}
function rsRplIntroHTML(){return `<aside class="rs-rpl-help-bubble rs-rpl-intro" ${RS.rplInfoAirport===RS.dep&&rsRplNone()?'':'hidden'}><button type="button" class="x" data-action="rs-rpl-info-close" aria-label="${esc(t('close'))}">×</button><h4>${t('rpl_what')}</h4><p>${t('rs_rpl_card')}</p>${rsRplUnavailable()?`<p>${t(rsHasRpl(RS.dep)?'rpl_none_short':'rpl_airport_missing',{icao:esc(RS.dep)})}</p><p>${t('rpl_free')}</p>`:''}</aside>`}
document.addEventListener('click',event=>{const b=event.target.closest('[data-action="rs-rpl-info"],[data-action="rs-rpl-info-close"]');if(!b)return;RS.rplInfoAirport=b.dataset.action==='rs-rpl-info'&&RS.rplInfoAirport!==RS.dep?RS.dep:null;const bubble=document.querySelector('.rs-rpl-intro');if(bubble)bubble.outerHTML=rsRplIntroHTML();document.querySelector('[data-action="rs-rpl-info"]')?.setAttribute('aria-expanded',String(RS.rplInfoAirport===RS.dep))});
function rsDefaults(){
  if(!RS.roster&&rsRplUnavailable()){RS.other=true;RS.pf=null}
  /* companhia primeiro: sem companhia escolhida não há aeronave (a escala salva traz a sua) */
  if(RS.roster){const a=acById(RS.roster.acId);if(a&&RS.ac!==a.id){RS.ac=a.id;ACP.rs.al=a.airline||"all"}}
  else{const eligible=RS.other?[]:rsSoonFlights(RS.dep);const rplList=eligible,rpl=rplList.length>0;
    if(RS.pf&&!rplList.some(x=>pfKey(x)===pfKey(RS.pf)))RS.pf=null;
    if(rpl&&!RS.pf)RS.ac="";                                                             /* com RPL: primeiro o voo */
    else if(RS.pf&&!RS.other){ACP.rs.al=RS.pf.al;if(RS.ac&&!rsPfAircraft(RS.pf).some(a=>a.id===RS.ac))RS.ac=""}
    else if(!RS.other){
      /* Sem posição registrada, a aeronave pode começar aqui. Só descarte uma escolha
         quando ela já tiver uma posição conhecida em outro aeródromo. */
      const at=RS.ac&&locAt(RS.ac,RS.start);if(at&&at!==RS.dep)RS.ac="";
    }
    else if(ACP.rs.al==="all")RS.ac="";else{const a=acById(RS.ac);if(a&&a.airline!==ACP.rs.al)RS.ac=""}}
  /* primeira saída: a partir de 30 min depois de agora */
  if(!RS.start||(!RS.roster&&RS.start<rsEarliest()))RS.start=rsSoonest();
  if(!RS.dep)RS.dep=(RS.ac&&locAt(RS.ac,RS.start))||RS_HOME.dep||"SBGR";
  rsApplyFavorite()}

function rsErrText(r){const reg=esc(acById(RS.ac)?.registration||RS.ac);
  switch(r.err){
    case"sequence_gap":return t("rs_sequence_gap",{previous:r.previous,next:r.next,minutes:r.minutes,min:RS_RESERVATION_GAP_MIN});
    case"sequence_route":return t("rs_sequence_route",{previous:r.previous,next:r.next});
    case"mine":return myClashMsg(r.r);
    case"noreal_al":return t("rs_noreal_al",{al:esc(acById(RS.ac)?.airline||"")});
    case"noreal_chain":return t("rs_noreal_chain",{icao:esc(r.from),reg});
    case"nx_real":return t("rs_nx_real",{reg});
    case"position":return t("rs_shift_loc",{reg,icao:esc(r.from),dep:esc(r.to)});
    case"far":return t("rs_far",{reg,from:esc(r.from),to:esc(r.to)});
    case"ap":return t("rs_unknown_ap",{code:esc(r.code)});
    case"past":return t("err_past");
    case"busy":return t("rs_busy",{reg,t:fmtRange(r.r.start,r.r.end),dep:esc(r.r.dep),arr:esc(r.r.arr)});
    case"aog":return t("rs_aog",{reg,t:fmt(r.w.s)});
    case"nx":return t("rs_nx",{reg,t:fmt(r.r.start),icao:esc(r.r.dep)});
    case"loading":return t("est_wait");
    case"one":return t("rs_one_leg");
    default:return t("rs_fail")}}

/* duração e voos por dia: botões (em vez de menu suspenso); o valor escolhido fica num campo oculto */
const rsSeg=(id,cur,opts,dis)=>`<div class="rs-fld"><span class="lbl">${opts.label}</span><input type="hidden" id="${id}" value="${cur}">
  <div class="seg rs-seg" role="group" aria-label="${esc(opts.label)}">${opts.items.map(([v,l])=>`<button type="button" data-action="rs-seg" data-f="${id}" data-v="${v}" aria-pressed="${v===cur}"${dis?` disabled title="${esc(dis)}"`:""}>${l}</button>`).join("")}</div></div>`;
function rsLegsField(){const a=acById(RS.ac),p=a?rsProfile(a):null;
  if(p&&p.cls==="wb")return rsSeg("rs-legs",0,{label:t("rs_legs"),items:[[0,t("rs_legs_auto",{r:1})]]},t("rs_legs_wb"));
  const max=p?{ga:6,tp:6,rj:5,nb:6}[p.cls]:6;if(RS.legs>max||RS.legs===1)RS.legs=0;
  return rsSeg("rs-legs",RS.legs||0,{label:t("rs_legs"),items:[[0,t("rs_legs_auto",{r:1})],...Array.from({length:max-1},(_,i)=>[i+2,String(i+2)])]})}
function rsDaysField(){return rsSeg("rs-days",RS.days||1,{label:t("rs_days"),items:[1,2,3,4].map(n=>[n,n===1?t("rs_day1"):t("rs_daysN",{n})])})}
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="rs-seg"]');if(!b||b.disabled)return;
  const f=b.dataset.f,v=Number(b.dataset.v)||0,inp=document.getElementById(f);if(inp)inp.value=v;
  if(f==="rs-days")RS.days=v||1;if(f==="rs-legs")RS.legs=v;
  b.parentNode.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)))});
/* ---------- partida primeiro: o que há no aeródromo escolhido ---------- */
const ICAO_AL=()=>{const m={};for(const [n,c] of Object.entries(AIRLINE_ICAO||{}))if(!m[c])m[c]=n;return m};
function rsAirportHeadingHTML(){const dep=RS.dep;return AIRPORTS?.[dep]?`<div class="rs-di-airport"><b>${esc(dep)}</b><span class="muted">${esc(AIRPORTS[dep][3]||'')}</span></div>`:''}
function rsGroundHTML(){return AIRPORTS?.[RS.dep]?adsbGroundHTML(RS.dep):''}
function rsDepInfoHTML(includeHeading=true){
  const dep=RS.dep;if(!/^[A-Z0-9]{4}$/.test(dep||"")||!AIRPORTS||!AIRPORTS[dep])return"";
  const at=Math.max(RS.start||0,Date.now()),here=aircraftAt(dep,at);
  /* companhias com voos reais saindo daqui (grade RPL/ANAC) */
  const names=ICAO_AL(),als=SCHED&&SCHED.idx?Object.keys(SCHED.idx).filter(c=>SCHED.idx[c][dep]&&SCHED.idx[c][dep].length).map(c=>names[c]||c):[];
  const rpl=!RS.other?rsSoonFlights(dep):[];
  const byAl={};here.forEach(a=>{byAl[a.airline||"—"]=(byAl[a.airline||"—"]||0)+1});
  let html=includeHeading?rsAirportHeadingHTML():'';
  if(RS.other)return html;
  if(rpl.length){const n=rpl.length;
    html+=`<div class="rs-di-rpl">`+(RS.roster?"":`<div class="rs-di-row rs-di-count">${t("rpl_mode",{n})}</div>`)+`<div class="rs-di-row muted">${t("rpl_mode_t")}</div>`+(als.length?`<div class="rs-di-airlines">${als.slice(0,6).map(al=>`<span>${alSym(al)}${esc(al)}</span>`).join("")}</div>`:"")+`</div>`;
    return html}
  return html}

/* ---------- escolha da aeronave: pelo aeródromo de partida ----------
   Com aeronaves estacionadas no aeródromo de partida, a escolha é feita no menu do aeródromo (painel ao lado).
   Sem posição registrada, a aeronave pode iniciar no primeiro voo da escala. */
const rsHere=()=>/^[A-Z0-9]{4}$/.test(RS.dep||"")&&AIRPORTS&&AIRPORTS[RS.dep]?aircraftAt(RS.dep,Math.max(RS.start||0,Date.now())):[];
/* ---------- RPL: próximas saídas a partir de 30 minutos ----------
   O piloto escolhe um voo e somente aeronaves livres do modelo/família do RPL. */
// Saídas entre 30 e 90 minutos a partir de agora.
const rsRplWindow=()=>[rsEarliest(),Date.now()+90*6e4];
function rsSoonFlights(dep){
  if(!SCHED||!SCHED.idx||!AIRPORTS||!AIRPORTS[dep])return[];
  const [t0,t1]=rsRplWindow(),names=ICAO_AL(),inFleet=new Set(fleet.map(a=>a.airline)),out=[];
  for(const code in SCHED.idx){if(!(SCHED.idx[code]||{})[dep])continue;
    const al=Object.keys(AIRLINE_ICAO||{}).find(n=>AIRLINE_ICAO[n]===code&&inFleet.has(n))||(inFleet.has(names[code])?names[code]:null);if(!al)continue;
    for(const f of realDeps(code,dep,t0,t1)){if(rsPfAircraft({al,f}).length)out.push({al,code,f})}}
  return out.sort((a,b)=>a.f.std-b.f.std||a.al.localeCompare(b.al))}
/* Aeronaves sem histórico podem iniciar no RPL. Quando já há posição registrada,
   somente as que estão no aeroporto de partida ficam disponíveis. Sem modelo no RPL,
   não é seguro oferecer nenhuma aeronave como compatível. */
function rsPfAircraft(pf){if(!pf||!pf.f||!pf.f.typ||!RS_FAM[pf.f.typ])return[];const now=Date.now(),nm=rsNm(pf.f.dep,pf.f.arr);
  return fleet.filter(a=>{const at=locAt(a.id,pf.f.std),p=rsProfile(a);return a.airline===pf.al&&(!at||at===pf.f.dep)&&rsRealOk(p,a,pf.f)&&nm<=p.range&&!movingNow(a.id)&&statusOf(a.id).key!=="bad"
    &&!data.reservations.some(r=>r.aircraftId===a.id&&booked(r)&&r.end>now)})}
/* Aeródromo coberto pelo RPL: só os registros que trazem modelo RPL contam aqui.
   As linhas sem tipo vêm da grade complementar da ANAC e não podem definir compatibilidade. */
const rsHasRpl=dep=>!!(SCHED&&SCHED.idx&&dep&&Object.keys(SCHED.idx).some(c=>(SCHED.idx[c][dep]||[]).some(f=>f[6]&&RS_FAM[f[6]])));
const rsRplMode=()=>!RS.other&&rsSoonFlights(RS.dep).length>0;
const pfKey=x=>x?`${x.code}${x.f.fno}@${x.f.std}`:"";
function rsPfCard(x){const block=Number.isFinite(x.f.blk)?x.f.blk:Number.isFinite(x.f.sta)?Math.round((x.f.sta-x.f.std)/60000):null;return `<span class="rs-pf-card-body"><small class="rs-pf-date">${esc(cap1(dtfDay(x.f.std)))}</small><strong class="rs-pf-flight">${alSym(x.al)}${esc((AIRLINE_IATA[x.al]||x.code)+' '+x.f.fno)}</strong><span class="mono rs-pf-route">${esc(x.f.dep||RS.dep)} → ${esc(x.f.arr)}</span><small class="mono rs-pf-block">${utcHM(x.f.std)}Z · ${block===null?'—':hhmm(Math.max(0,block))}</small></span>`}
function rsPfHTML(list){
  const [t0,t1]=rsRplWindow(),cur=pfKey(RS.pf);
  if(list.length===1&&RS.pf&&pfKey(list[0])===cur)return `<div class="rs-ac rs-pf"><span class="lbl">${RS.pf?t("rs_starting_flight"):t("pf_h",{icao:esc(RS.dep),a:fmtT(t0),b:fmtT(t1)})}</span><div class="rs-pf-single">${rsPfCard(RS.pf)}</div><small class="hint">${t("pf_hint")}</small></div>`;
  return`<div class="rs-ac rs-pf"><span class="lbl">${RS.pf?t("rs_starting_flight"):t("pf_h",{icao:esc(RS.dep),a:fmtT(t0),b:fmtT(t1)})}</span>
    <details class="rs-pf-options rs-secondary"><summary class="${RS.pf?'rs-pf-selected':''}">${RS.pf?rsPfCard(RS.pf):t('rs_choose_flight')}<span class="rs-pf-caret" aria-hidden="true">⌄</span></summary><div class="pf-list">${list.map(x=>`<button type="button" class="pf-i${pfKey(x)===cur?" on":""}" data-action="rs-pf" data-k="${esc(pfKey(x))}">${rsPfCard(x)}</button>`).join("")}</div></details>
    <small class="hint">${t("pf_hint")}</small></div>`}

function rsLiveriesHTML(){return RS.ac&&typeof liveryHTML==='function'?`<section class="rs-liv" data-aircraft="${esc(RS.ac)}">${liveryHTML(RS.ac,true)||`<p class="muted">${t('loading')}</p>`}</section>`:''}
function rsAcfHTML(){
  /* Aeródromo com RPL: o voo selecionado limita a lista ao modelo compatível da companhia. */
  const rpl=RS.roster||RS.other?[]:rsSoonFlights(RS.dep);
  if(RS.roster)return '';
  if(!RS.other){const list=rpl;
    if(RS.pf&&!list.some(x=>pfKey(x)===pfKey(RS.pf)))RS.pf=null;
    if(list.length)return RS.pf?`<div class="rs-rpl-pair">${rsPfHTML(list)}<div class="rs-ac rs-rpl-aircraft"><span class="lbl">${t("aircraft")} · ${esc(RS.pf.al)}</span>${acPickerHTML("rs")}</div></div>`:rsPfHTML(list);
  }
  return`<div class="rs-ac rs-al"><span class="lbl">${t("airline")}</span>${alPickHTML("rs",ACP.rs.al||"all")}</div>
    <div class="rs-ac"><span class="lbl">${t("aircraft")}</span>${ACP.rs.al==="all"?`<div class="acp-need">✈ ${t("rs_need_al")}</div>`:acPickerHTML("rs")}</div>`}
function rsRepaintDep(){rsDefaults();const summary=document.getElementById("rs-sidebar-summary");if(summary)summary.innerHTML=rsSidebarSummaryHTML();const i=document.getElementById("rs-dep-info");if(i)i.innerHTML=rsDepInfoHTML(false);const a=document.getElementById("rs-acf");if(a)a.innerHTML=rsAcfHTML();
  document.querySelectorAll('[data-action="rs-other"]').forEach(b=>{b.setAttribute('aria-pressed',String(RS.other===(b.dataset.v==='1')&&!(b.dataset.v==='0'&&rsRplButtonDisabled())));b.disabled=b.dataset.v==='0'?rsRplButtonDisabled():!!RS.busy;b.closest('.rs-rpl-option')?.classList.toggle('rs-rpl-disabled',b.disabled)});const infoBtn=document.querySelector('[data-action="rs-rpl-info"]');if(infoBtn){infoBtn.hidden=!rsRplNone();if(infoBtn.hidden&&RS.rplInfoAirport)RS.rplInfoAirport=null}const intro=document.querySelector('.rs-rpl-intro');if(intro)intro.outerHTML=rsRplIntroHTML();const description=document.querySelector('.rs-mode-field>small');if(description)description.textContent=RS.other?t('rs_free_card'):'';
  const origin=document.getElementById('rs-origin-info');if(origin)origin.innerHTML=rsAirportHeadingHTML();const ground=document.getElementById('rs-ground');if(ground)ground.innerHTML=rsGroundHTML();
  const liveries=document.getElementById('rs-liveries');if(liveries)liveries.innerHTML=rsLiveriesHTML();
  const b=document.querySelector('#f-rs button[type=submit]');if(b&&!RS.busy)b.disabled=!RS.ac||RS.left===0||RS.left==="missing"}

/* ---------- aeronaves da frota no aeródromo ---------- */
const RDI={open:false,q:""};
function rdiHTML(dep,all){
  const here=all,sel=here.find(a=>a.id===RS.ac);
  return`<div class="rdi${RDI.open?" open":""}"><button type="button" class="rdi-btn" data-action="rdi-open" aria-haspopup="listbox" aria-expanded="${RDI.open}">
      <span class="rdi-n">${t("rs_di_here",{n:here.length}).replace(/:\s*$/,"")}</span>
      ${sel?`<span class="rdi-sel">${regTag(sel,"")}<small>${esc(icaoType(sel.type)||sel.type)}</small></span>`:`<span class="muted rdi-pick">${t("rdi_pick")}</span>`}
      <span class="alpick-caret" aria-hidden="true">▾</span></button>
    <div class="rdi-pop" ${RDI.open?"":"hidden"}><input type="search" class="rdi-q" placeholder="${esc(t("acp_search"))}" value="${esc(RDI.q)}" autocomplete="off" spellcheck="false">
      <div class="rdi-list" role="listbox">${RDI.open?rdiList(dep,all):""}</div></div></div>
    ${RS.other?"":`<div class="rs-di-row"><button type="button" class="btn small rdi-other" data-action="rs-other" data-v="1">✈ ${t("rs_other_btn")}</button><span class="muted rdi-other-h">${t("rs_other_hint")}</span></div>`}`}
function rdiList(dep,all){
  const here=all;
  const Q=(RDI.q||"").trim().toUpperCase(),K=Q.replace(/[-\s]/g,"");
  const l=here.filter(a=>!Q||a.registration.replace(/[-\s]/g,"").includes(K)||String(a.type).toUpperCase().includes(Q)||String(a.airline||"").toUpperCase().includes(Q)||(icaoType(a.type)||"").includes(Q));
  if(!l.length)return`<p class="muted acp-empty">${t("acp_none")}</p>`;
  const g={};l.forEach(a=>(g[a.airline||"—"]=g[a.airline||"—"]||[]).push(a));
  return Object.keys(g).sort((x,y)=>g[y].length-g[x].length||x.localeCompare(y)).map(al=>`<div class="acp-g rdi-g">${alSym(al)||""}<span>${esc(al)}</span><small>${g[al].length}</small></div>`
    +g[al].sort((x,y)=>x.registration.localeCompare(y.registration)).map(a=>`<button type="button" class="acp-i rdi-i${a.id===RS.ac?" sel":""}" data-action="rs-ac-go" data-id="${esc(a.id)}" role="option">
      ${regTag(a,"")}<span class="acp-tx"><b>${esc(a.type)}</b><small>${esc(a.airline||"")}</small></span></button>`).join("")).join("")}

/* ---------- ADS-B: painel de observação do aeródromo, sem efeito na escala ---------- */
const ADSB_GROUND={},ADSB_GROUND_OPEN=new Set();
document.addEventListener('toggle',e=>{const el=e.target;if(!el.matches?.('details[data-adsb-ground]')||!el.isConnected)return;if(el.open)ADSB_GROUND_OPEN.add(el.dataset.adsbGround);else ADSB_GROUND_OPEN.delete(el.dataset.adsbGround)},true);
function adsbGroundHTML(dep){const c=ADSB_GROUND[dep];setTimeout(()=>adsbGroundFetch(dep),30);
  let body="";
  if(!c||c.busy||!c.at)body=`<p class="muted adsb-ground-st">📡 ${t("real_loading")}</p>`;
  else if(c.err)body=`<p class="muted adsb-ground-st">📡 ${t(c.err==="missing"?"real_missing":"real_fail")}</p>`;
  else{const list=c.list||[],show=list.slice(0,40),more=list.length-show.length;
    body=`<div class="adsb-ground-meta">${t("adsb_ground_updated",{n:list.length,t:fmtT(c.at)})}</div>`+(show.length?`<div class="adsb-ground-list">${show.map(a=>{const id=a.reg||a.cs||a.hex||"—",extra=[a.cs&&a.cs!==a.reg?a.cs:"",a.type||""].filter(Boolean).map(esc).join(" · ");return`<span class="adsb-ground-item">${regTag({registration:id,airline:a.airline||""},id)}${extra?`<small>${extra}</small>`:""}</span>`}).join("")}</div>${more?`<div class="adsb-ground-more">${t("adsb_ground_more",{n:more})}</div>`:""}`:`<p class="muted adsb-ground-st">${t("adsb_ground_empty",{icao:esc(dep)})}</p>`)}
  return`<details class="adsb-ground" data-adsb-ground="${esc(dep)}" ${ADSB_GROUND_OPEN.has(dep)?'open':''}><summary class="adsb-ground-head"><b>📡 ${t("adsb_ground_h")}</b><span class="adsb-ground-count">${c?.at&&!c.err&&!c.busy?t('rs_di_ac',{n:(c.list||[]).length}):''}</span></summary><div aria-live="polite"><p class="muted adsb-ground-note">${t("adsb_ground_info")}</p>${body}</div></details>`}
function adsbGroundPatch(dep){const el=document.querySelector(`[data-adsb-ground="${dep}"]`);if(el)el.outerHTML=adsbGroundHTML(dep)}
async function adsbGroundFetch(dep,force){
  const A=AIRPORTS&&AIRPORTS[dep];if(!A)return;const c=ADSB_GROUND[dep]||(ADSB_GROUND[dep]={at:0,list:[]});
  if(c.busy||(!force&&Date.now()-c.at<60e3))return;c.busy=true;
  try{if(!sb)throw new Error("missing");const {data:d,error}=await sb.functions.invoke("adsb",{body:{lat:A[0],lon:A[1],dist:5}});
    if(error)c.err=/not found|404|Failed to send|FunctionsFetchError|FunctionsHttpError/i.test(String(error.message||error))?"missing":"fail";
    else{const own=new Map(fleet.map(a=>[String(a.registration||"").toUpperCase(),a.airline||""])),names=ICAO_AL();c.err=null;c.list=(d&&d.aircraft||[]).filter(a=>a&&(a.ground||(a.gs<30&&a.alt<300))&&Number(a.seen||0)<=300&&isFinite(a.lat)&&isFinite(a.lon)&&gcNm([a.lat,a.lon],A)<=3).map(a=>{const reg=String(a.reg||"").toUpperCase(),cs=String(a.cs||"").toUpperCase().replace(/\s/g,""),code=(/^([A-Z]{3})/.exec(cs)||[])[1]||"";return{reg,cs,hex:a.hex||"",type:a.type||"",airline:own.get(reg)||names[code]||""}}).sort((a,b)=>String(a.reg||a.cs||a.hex).localeCompare(String(b.reg||b.cs||b.hex)))}}
  catch(e){c.err="missing"}finally{c.busy=false;c.at=Date.now()}
  if(view==="roster"&&RS.dep===dep)adsbGroundPatch(dep)}
/* a cada minuto, enquanto a tela de Escala estiver aberta */
setInterval(()=>{if(view==="roster"&&RS.dep&&document.getElementById("rs-dep-info")&&!document.hidden)adsbGroundFetch(RS.dep)},60e3);
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="rdi-open"]');const box=document.querySelector(".rdi");
  if(b){RDI.open=!RDI.open;box.classList.toggle("open",RDI.open);b.setAttribute("aria-expanded",RDI.open);const pop=box.querySelector(".rdi-pop");pop.hidden=!RDI.open;
    if(RDI.open){const here=aircraftAt(RS.dep,Math.max(RS.start||0,Date.now()));pop.querySelector(".rdi-list").innerHTML=rdiList(RS.dep,here);const q=pop.querySelector(".rdi-q");setTimeout(()=>q.focus(),0);
      const s=pop.querySelector(".rdi-i.sel");s&&s.scrollIntoView&&s.scrollIntoView({block:"nearest"})}return}
  if(RDI.open&&box&&!box.contains(e.target)){RDI.open=false;box.classList.remove("open");box.querySelector(".rdi-pop").hidden=true}
  if(e.target.closest(".rdi-i")){RDI.open=false;RDI.q=""}
  const ra=e.target.closest('[data-action="rdi-al"]');if(ra){RDI.open=false;RDI.q="";ACP.rs.al=ra.dataset.v;RS.touched=true;RS.ac="";RS.roster=null;render();setTimeout(()=>acPickOpen("rs",true),0)}});
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="rs-pf"]');if(!b)return;
  const x=rsSoonFlights(RS.dep).find(y=>pfKey(y)===b.dataset.k);if(!x)return;
  RS.pf=pfKey(RS.pf)===pfKey(x)?null:x;RS.touched=true;RS.roster=null;RS.err="";
  if(RS.pf){ACP.rs.al=x.al;RS.start=x.f.std;const ok=rsPfAircraft(x);RS.ac=ok.some(a=>a.id===RS.ac)?RS.ac:(ok.length===1?ok[0].id:"")}
  render();if(RS.pf&&!RS.ac)setTimeout(()=>acPickOpen("rs",true),0)});
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="rs-other"]');if(!b)return;
  if(b.dataset.v==='0'&&rsRplButtonDisabled())return;
  if(RS.busy||RS.other===(b.dataset.v==="1"))return;
  RS.other=b.dataset.v==="1";RS.touched=true;RS.roster=null;RS.pf=null;RS.ac="";RS.err="";RS.start=rsSoonest();rsSave();
  if(RS.other){const a=acById(RS.ac);ACP.rs.al=a?a.airline||"all":"all"}else{const here=rsHere();if(!here.some(a=>a.id===RS.ac))RS.ac=""}
  render()});
document.addEventListener("input",e=>{if(!e.target.classList||!e.target.classList.contains("rdi-q"))return;RDI.q=e.target.value;
  const l=e.target.parentElement.querySelector(".rdi-list");if(l)l.innerHTML=rdiList(RS.dep,aircraftAt(RS.dep,Math.max(RS.start||0,Date.now())))});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&RDI.open){const box=document.querySelector(".rdi");RDI.open=false;if(box){box.classList.remove("open");box.querySelector(".rdi-pop").hidden=true}}});

function rsSidebarSummaryHTML(){const a=acById(RS.ac),f=!RS.other?RS.pf?.f:null;return `<div class="muted rs-sidebar-summary">${esc(RS.dep||'—')}${f?' → '+esc(f.arr):''}${f?`<br>${esc((AIRLINE_IATA[RS.pf.al]||RS.pf.code)+' '+f.fno)} · ${utcHM(f.std)}Z`:''}${a?`<br>${esc(a.registration)} · ${esc(a.type)}`:''}</div>`}
function viewRoster(){
  if(rosterMenuLocked())return `<div class="panel"><h3>🔒 ${t('rs_locked_title')}</h3><p>${t('rs_locked_body')}</p><button class="btn" data-view="bookings">${t('nav_bookings')}</button></div>`;
  loadRosterAirports();if(!SCHED)loadSchedule().then(()=>{if(view==="roster")render()});if(RS.left===null&&session)rsLoadLeft();rsDefaults();
  const pos=RS.ac?locAt(RS.ac,RS.start):"";
  const left=RS.left==="missing"?null:RS.left;
  const leftTxt=RS.left==="missing"?`<span class="chip bad">${t("rs_not_installed")}</span>`:left==null?"":left<0?`<span class="chip ok">${t("rs_unlimited")}</span>`:`<span class="chip ${left>0?"neutral":"bad"}">${t("rs_left",{n:left})}</span>`;
  return`
  <div class="sec-head rs-screen-head"><div><span class="eyebrow">${t("rs_eyebrow")}</span><h2>${t("rs_title")}</h2></div>${leftTxt}</div>
  <div class="panel rs-form rs-form-screen">
   <div class="rs-fld rs-mode-field"><div class="rs-modes" role="group" aria-label="${esc(t("rs_mode"))}">
    <button type="button" class="rs-mode-card" data-action="rs-other" data-v="1" aria-pressed="${!!RS.other}" ${RS.busy?"disabled":""}><strong><span aria-hidden="true">✈</span> ${t("rs_free")}</strong></button>
    <div class="rs-rpl-option ${rsRplButtonDisabled()?'rs-rpl-disabled':''}"><button type="button" class="rs-mode-card" data-action="rs-other" data-v="0" aria-pressed="${!RS.other&&!rsRplButtonDisabled()}" ${rsRplButtonDisabled()?'disabled':''}><strong><span aria-hidden="true">▤</span> ${t("rs_rpl")}</strong></button><button type="button" class="rs-rpl-info" data-action="rs-rpl-info" aria-label="${esc(t('rpl_what'))}" ${rsRplNone()?'':'hidden'} aria-expanded="${RS.rplInfoAirport===RS.dep}">ⓘ</button></div></div><small class="muted">${RS.other?t('rs_free_card'):''}</small></div>${rsRplIntroHTML()}
   <form id="f-rs" class="rs-grid rs-balanced-grid rs-sidebar-grid"><div class="rs-sidebar-main">
    <div class="rs-top-fields"><div class="rs-origin-compact">
     <label class="rs-dep-f">${t("rs_dep")}${apInput("rs-dep",RS.dep||pos||"SBGR")}</label>
     <div id="rs-origin-info">${rsAirportHeadingHTML()}</div>
    </div>

    </div>
    <div class="rs-main-fields"><div class="rs-layout-left"><div class="rs-dep-info" id="rs-dep-info">${rsDepInfoHTML(false)}</div><div class="rs-acf" id="rs-acf">${rsAcfHTML()}</div></div>
     <div class="rs-layout-right"><div id="rs-liveries">${rsLiveriesHTML()}</div></div></div>
    <div id="rs-ground" class="rs-ground">${rsGroundHTML()}</div></div>
    <aside class="rs-layout-sidebar"><h3>${t('nav_roster')}</h3>${RS.other?`<label>${t("rs_start")}<input id="rs-start" type="datetime-local" required min="${toLocalInput(rsEarliest())}" value="${toLocalInput(RS.start)}"><small id="rs-start-utc" class="utc-eq"></small><small class="hint" title="${esc(t('rs_start_hint'))}">${t("rs_departure_minimum")}</small></label>`:""}<div class="rs-settings">${rsDaysField()}${rsLegsField()}</div><div id="rs-sidebar-summary">${rsSidebarSummaryHTML()}</div>
    <div class="rs-actions"><div><b>${t("rs_unlimited")}</b><small class="muted">${t("rs_confirmation_short")}</small><p class="form-err" ${RS.err?"":"hidden"}>${RS.err}</p></div>
     <button class="btn primary" type="submit" ${RS.busy||left===0||RS.left==="missing"||!RS.ac?"disabled":""}>${RS.roster?t("rs_regen"):t("rs_gen")}</button></div>
    </aside></form>
   <details class="rs-secondary rs-rules"><summary>${t("rs_rules_short")}</summary><p class="muted">${t("quota_rule",{maxac:WEEK_MAX_AC})}</p><p class="muted">${t("rs_intro")}</p><p class="hint">${t("rs_quota_note")}</p></details>
  </div>
  ${RS.roster?rosterHTML(RS.roster):""}
  `}

/* =========================================================================
   Minha escala — como nos aplicativos de tripulação (e-crew, CrewLink…):
   aviso de escala nova/alterada com aceite, calendário do mês e programação
   dia a dia com apresentação (C/I), voos, liberação (C/O) e pernoites (PNT).
   ========================================================================= */
RS.calM=RS.calM||0;RS.calDay=RS.calDay||null;
/* voos do piloto (reservas ativas e concluídas) em formato de perna; nas pernas de escala, a reserva
   vai de 20 min antes da saída a 25 min depois da chegada */
function myLegs(){if(!myId)return[];return data.reservations.filter(r=>r.pilotId===myId&&(booked(r)||r.status==="completed"))
  .map(r=>{const rs=!!r.rosterId,std=rs?r.start+20*6e4:r.start,sta=rs?r.end-25*6e4:r.end,ac=acById(r.aircraftId);
    const L={id:r.id,rosterId:r.rosterId,ac,acId:r.aircraftId,dep:r.dep,arr:r.arr,std,sta,blk:Math.round((sta-std)/6e4),flightNo:r.flightNo,ferry:r.ferry,done:r.status==="completed",
      nm:AIRPORTS&&AIRPORTS[r.dep]&&AIRPORTS[r.arr]?Math.round(rsNm(r.dep,r.arr)):0};
    /* rota, nível e velocidade do plano de voo real (RPL), quando o voo está na grade */
    if(SCHED&&ac&&r.flightNo){const al=schedIcao(ac),n=String(r.flightNo).replace(/^\S+\s*/,"");const f=al&&((SCHED.idx[al]||{})[r.dep]||[]).find(x=>x[0]===n&&x[2]===r.arr);
      if(f){L.route=f[7]||"";L.fl=f[8]||"";L.spd=f[9]||"";L.real=true}}
    return L}).sort((a,b)=>a.std-b.std)}
const myDayKey=ms=>ymd(ms);
/* jornadas: pernas do mesmo dia local; C/I 60 min antes da 1ª saída, C/O 30 min após o último pouso */
function myDuties(legs){const by={};for(const L of legs)(by[myDayKey(L.std)]=by[myDayKey(L.std)]||[]).push(L);
  return Object.keys(by).sort().map(k=>{const ls=by[k];const ci=ls[0].std-60*6e4,co=ls[ls.length-1].sta+30*6e4;
    return{k,legs:ls,ci,co,duty:Math.round((co-ci)/6e4),blk:ls.reduce((x,L)=>x+L.blk,0),roster:ls[0].rosterId}})}
/* aceite: assinatura da escala (pernas, horários, aeronave, situação); se mudar, pede aceite de novo */
const ACK_KEY="vfr-roster-ack";
/* o aceite fica no Supabase (tabela roster_acks, 20_aceite_escala.sql) e vale em todos os aparelhos;
   sem a tabela, cai para o armazenamento do navegador */
let ACKS=null,acksP=null,acksDb=true;
function localAcks(){try{return JSON.parse(localStorage.getItem(ACK_KEY)||"{}")}catch(e){return{}}}
function loadAcks(){if(ACKS||acksP||!sb||!myId)return acksP;
  acksP=Promise.resolve(sb.from("roster_acks").select("roster_id,sig")).then(({data:rows,error}={})=>{
    if(error){acksDb=false;ACKS=localAcks()}else{ACKS={...localAcks()};for(const r of rows||[])ACKS[r.roster_id]=r.sig}
    render()}).catch(()=>{acksDb=false;ACKS=localAcks();render()});return acksP}
function ackStore(){return ACKS||localAcks()}
function resetAcks(){ACKS=null;acksP=null;acksDb=true}
function rosterSig(rid){return data.reservations.filter(r=>r.rosterId===rid&&r.pilotId===myId).map(r=>`${r.id}|${r.aircraftId}|${r.start}|${r.end}|${r.status}|${r.dep}|${r.arr}`).sort().join(";")}
function myAck(rid){const sig=rosterSig(rid);ACKS=ACKS||localAcks();ACKS[rid]=sig;
  try{const l=localAcks();l[rid]=sig;localStorage.setItem(ACK_KEY,JSON.stringify(l))}catch(e){}
  if(acksDb&&sb&&myId)Promise.resolve(sb.from("roster_acks").upsert({pilot_id:myId,roster_id:rid,sig,acked_at:new Date().toISOString()},{onConflict:"pilot_id,roster_id"}))
    .then(r=>{const e=r&&r.error;if(e&&/roster_acks|does not exist|schema cache/i.test(e.message||""))acksDb=false}).catch(()=>{})}
function pendingAcks(){const st=ackStore(),now=Date.now(),ids=[...new Set(data.reservations.filter(r=>r.pilotId===myId&&r.rosterId&&booked(r)&&r.end>now).map(r=>r.rosterId))];
  return ids.filter(id=>st[id]!==rosterSig(id)).map(id=>({id,changed:id in st,legs:data.reservations.filter(r=>r.rosterId===id&&booked(r)).sort((a,b)=>a.start-b.start)}))}
const ROSTER_ACK_REDIRECTS=new Map();
function rosterAckRedirect(){
 if(!myId)return false;
 if(!ACKS){loadAcks();return false}
 const pending=pendingAcks().find(p=>p.changed&&ROSTER_ACK_REDIRECTS.get(myId+'|'+p.id)!==rosterSig(p.id));
 if(!pending)return false;
 ROSTER_ACK_REDIRECTS.set(myId+'|'+pending.id,rosterSig(pending.id));
 view='bookings';closeSheet();window.scrollTo(0,0);return true;
}
const zT=ms=>`${zHM(ms)} <span class="dim">(${tf.format(ms)})</span>`;
const dShort=ms=>new Intl.DateTimeFormat(LOCALE[lang],{weekday:"short",day:"2-digit"}).format(ms).replace(".","").toUpperCase();
function rsAcceptedDispatchHTML(confirmed){
  return `<div class="rs-dispatch"><div class="rs-dispatch-close"><button class="x" type="button" data-action="close" aria-label="${esc(t('close'))}">×</button></div>${confirmed.map(r=>{
    const aircraft=acById(r.aircraftId);
    return `<section class="panel rs-dispatch-flight"><div class="rs-dispatch-heading"><strong class="rs-dispatch-number">${alSym(aircraft?.airline||'')}<span>${esc(r.flightNo||'—')}</span></strong><strong class="mono rs-dispatch-route">${wxCode(r.dep)} → ${wxCode(r.arr)}</strong></div><p class="mono rs-dispatch-time">EOBT <b>${utcHM(r.start+20*6e4)}Z</b> · ${dfShort(r.start+20*6e4)}</p><div class="row">${sbLink(r,'primary','SimBrief')}${svLink(r,'')}</div></section>`;
  }).join('')}<button class="btn rs-dispatch-done" type="button" data-action="close">${t('done')}</button></div>`;
}
function myProgrammeMode(){try{return localStorage.getItem('vfr-programme-view:'+myId)==='board'?'board':'table'}catch(e){return 'table'}}
function myProgrammeStrip(L,k,n){
  const route=data.reservations.find(r=>r.id===L.id)?.route||L.route||'',params={aircraftId:L.acId,dep:L.dep,arr:L.arr,flightNo:L.flightNo,eobt:L.std,route};
  return stripHTML(L.ac,L,k,n)+`<div class="row my-programme-links">${sbLink(params,'small','SimBrief')}${svLink(params,'small')}</div>`;
}
function myProgrammeViews(duties,table){
  if(view!=='roster')return `<h3>${t('my_prog')}</h3>${table}`;
  const mode=myProgrammeMode(),board=duties.map((d,i)=>`<section class="my-programme-day"><div class="rs-day-h"><b>${t('rs_day',{n:i+1})} · ${esc(cap1(dtfDay(d.legs[0].std)))}</b><span>${cap1(t('rs_report'))} ${zT(d.ci)} · ${t('my_duty')} ${hhmm(d.duty)}</span></div>${d.legs.map((L,k)=>L.ac?myProgrammeStrip(L,k+1,d.legs.length):`<p>${esc(L.flightNo||'')} · ${esc(L.dep)} → ${esc(L.arr)} · ${zT(L.std)} → ${zT(L.sta)}</p>`).join('')}<p class="my-programme-release">${cap1(t('rs_release'))} ${zT(d.co)} · ${t('my_blk')} ${hhmm(d.blk)}</p></section>`).join('');
  return `<div class="my-programme-header"><h3>${t('my_prog')}</h3><div class="seg" role="group" aria-label="${esc(t('my_prog_view'))}">${['table','board'].map(v=>`<button type="button" data-action="my-prog-view" data-v="${v}" aria-pressed="${mode===v}">${t('my_prog_'+v)}</button>`).join('')}</div></div><div data-programme-view="table" ${mode==='table'?'':'hidden'}>${table}</div><div data-programme-view="board" ${mode==='board'?'':'hidden'}>${board}</div>`;
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-action="my-prog-view"]');if(!button)return;const mode=button.dataset.v;if(!['table','board'].includes(mode))return;try{localStorage.setItem('vfr-programme-view:'+myId,mode)}catch(e){}const panel=button.closest('.my-prog');if(!panel)return;panel.querySelectorAll('[data-programme-view]').forEach(el=>el.hidden=el.dataset.programmeView!==mode);panel.querySelectorAll('[data-action="my-prog-view"]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.v===mode)))});
function myRosterHTML(ackOnly=false){
  const legs=myLegs();if(!legs.length)return{ack:"",prog:"",cal:""};
  const now=Date.now(),duties=myDuties(legs),byK={};for(const d of duties)byK[d.k]=d;
  /* dias de pernoite: entre duas jornadas da mesma escala */
  const pnt={};for(let i=0;i<duties.length-1;i++){const a=duties[i],b=duties[i+1];if(a.roster&&a.roster===b.roster){let d=new Date(a.co);d.setHours(12,0,0,0);d.setDate(d.getDate()+1);
    while(myDayKey(d.getTime())<b.k){pnt[myDayKey(d.getTime())]=a.legs[a.legs.length-1].arr;d.setDate(d.getDate()+1)}}}
  /* aviso de aceite */
  loadAcks();const pend=ACKS?pendingAcks():[];
  const ack=pend.map(p=>{const a=acById(p.legs[0]?.aircraftId);const s=p.legs[0],e=p.legs[p.legs.length-1];
    return`<div class="ack-bar"><span class="ack-ic" aria-hidden="true">📋</span><div><b>${t(p.changed?"my_ack_changed":"my_ack_new",{reg:esc(a?.registration||""),d:esc(dfShort(s.start+20*6e4)+(myDayKey(s.start+20*6e4)!==myDayKey(e.end-25*6e4)?"–"+dfShort(e.end-25*6e4):""))})}</b><br><span>${t("my_ack_hint")}</span></div>
      <button class="btn primary" data-action="my-ack" data-id="${esc(p.id)}">${t("my_ack_btn")}</button></div>`}).join("");
  if(ackOnly)return{ack,prog:'',cal:''};
  /* calendário */
  const base=new Date();base.setDate(1);base.setHours(12,0,0,0);base.setMonth(base.getMonth()+RS.calM);
  const y=base.getFullYear(),m=base.getMonth(),first=new Date(y,m,1,12),startW=(first.getDay()+6)%7,dim=new Date(y,m+1,0).getDate();
  const wk=[...Array(7)].map((_,i)=>new Intl.DateTimeFormat(LOCALE[lang],{weekday:"short"}).format(new Date(2026,0,5+i)).replace(".",""));
  const today=myDayKey(now);let cells="";
  for(let i=0;i<startW;i++)cells+=`<div class="cd x"></div>`;
  for(let d=1;d<=dim;d++){const k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,du=byK[k];
    const dn=du&&du.legs.every(L=>L.done),cls=du?(dn?"fly done":"fly"):pnt[k]?"ly":"off",sel=RS.calDay===k?" sel":"",tod=k===today?" today":"";
    const io=c=>(AIRPORTS&&AIRPORTS[c]&&AIRPORTS[c][2])||c,sub=du?du.legs.map((L,i)=>(i?"":io(L.dep))+"–"+io(L.arr)).join(""):pnt[k]?io(pnt[k]):"";
    cells+=`<button type="button" class="cd ${cls}${sel}${tod}" data-action="my-day" data-k="${k}" ${du||pnt[k]?"":"tabindex=\"-1\""}><span class="n">${d}</span>${du?`<span class="c">${dn?"✓ "+t("my_c_done"):t("my_c_fly")}</span>`:pnt[k]?`<span class="c">${t("my_c_pnt")}</span>`:""}${sub?`<span class="r">${esc(sub)}</span>`:""}</button>`}
  const monthName=new Intl.DateTimeFormat(LOCALE[lang],{month:"long",year:"numeric"}).format(first);
  /* strips do dia clicado */
  let dayStrips="";const sd=RS.calDay&&byK[RS.calDay];
  if(sd)dayStrips=`<div class="my-day-strips"><h4>${esc(cap1(dtfDay(sd.legs[0].std)))}</h4><div class="strip-bay">${sd.legs.map((L,i)=>(i?`<div class="rs-turn">${t("rs_turn",{t:hm(Math.round((L.std-sd.legs[i-1].sta)/6e4)),icao:esc(L.dep)})}</div>`:"")+(L.ac?stripHTML(L.ac,L,i+1,sd.legs.length):"")).join("")}</div></div>`;
  /* Programação operacional: somente pernas ainda ativas. O calendário mantém o histórico. */
  const up=myDuties(legs.filter(L=>!L.done)).filter(d=>d.co>=now-6*36e5);let rows="",tot={n:0,blk:0,duty:0,pnt:0,rest:Infinity};
  up.forEach((d,i)=>{const a=d.legs[0].ac;
    rows+=`<tr class="dh" id="myd-${d.k}"><td class="day">${esc(dShort(d.legs[0].std))}</td><td><span class="code ci">C/I</span></td><td colspan="5" class="mono">${cap1(t("rs_report"))} ${zT(d.ci)} · ${esc(d.legs[0].dep)}${a?` · ${esc(a.registration)} ${esc(icaoType(a.type)||"")}`:""}</td></tr>`;
    for(const L of d.legs){rows+=`<tr><td></td><td><span class="code${L.ferry?" fe":""}">${L.ferry?t("my_c_fer"):t("my_c_fly")}</span></td><td class="mono">${esc(L.flightNo||"—")}</td><td class="mono">${wxCode(L.dep)} → ${wxCode(L.arr)}</td><td class="mono">${zT(L.std)}</td><td class="mono">${zT(L.sta)}</td><td class="mono">${hhmm(L.blk)}${!L.done?`<div class="row">${sbLink({aircraftId:L.acId,dep:L.dep,arr:L.arr,flightNo:L.flightNo,eobt:L.std,route:data.reservations.find(r=>r.id===L.id)?.route||""},"small","SimBrief")}${svLink({aircraftId:L.acId,dep:L.dep,arr:L.arr,route:data.reservations.find(r=>r.id===L.id)?.route||""},"small")}</div>`:""}</td></tr>`;tot.n++}
    rows+=`<tr><td></td><td><span class="code co">C/O</span></td><td colspan="5" class="mono">${cap1(t("rs_release"))} ${zT(d.co)} · ${t("my_duty")} ${hhmm(d.duty)} · ${t("my_blk")} ${hhmm(d.blk)}</td></tr>`;
    tot.blk+=d.blk;tot.duty+=d.duty;
    const nx=up[i+1];if(nx&&nx.roster&&nx.roster===d.roster){const rest=Math.round((nx.ci-d.co)/6e4);tot.pnt++;tot.rest=Math.min(tot.rest,rest);
      rows+=`<tr class="pr"><td></td><td><span class="code ht">PNT</span></td><td colspan="5">🏨 ${t("my_pnt",{icao:wxCode(d.legs[d.legs.length-1].arr),t:hhmm(rest)})}</td></tr>`}});
  const prog=up.length?`<div class="panel my-prog">${myProgrammeViews(up,`<p class="muted" style="margin:0 0 10px;font-size:.86rem">${t("my_prog_hint")}</p>
    <div class="scroll"><table class="my-t"><thead><tr><th>${t("my_day")}</th><th>${t("my_act")}</th><th>${t("rs_col_flt")}</th><th>${t("rs_col_route")}</th><th>${t("rs_col_dep")}</th><th>${t("rs_col_arr")}</th><th>${t("my_blk")}</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
    <div class="my-tot"><span>${t("my_t_flights")} <b>${tot.n}</b></span><span>${t("my_blk")} <b>${hhmm(tot.blk)}</b></span><span>${t("my_duty")} <b>${hhmm(tot.duty)}</b></span><span>${t("my_t_pnt")} <b>${tot.pnt}</b></span>${tot.pnt?`<span>${t("my_t_rest")} <b>${hhmm(tot.rest)}</b></span>`:""}</div></div>`:"";
  return{ack,prog,cal:`<div class="panel my-cal"><div class="my-cal-h"><h3>${t("my_title")} · ${esc(cap1(monthName))}</h3><span class="row" style="gap:6px"><button class="btn small" data-action="my-m" data-v="-1" aria-label="‹">‹</button><button class="btn small" data-action="my-m" data-v="0">${t("my_today")}</button><button class="btn small" data-action="my-m" data-v="1" aria-label="›">›</button></span></div>
    <p class="muted" style="margin:0 0 10px;font-size:.86rem">${t("my_cal_hint")}</p>
    <div class="cal7">${wk.map(w=>`<div class="ch">${esc(w)}</div>`).join("")}${cells}</div>
    <div class="cal-leg"><span><i class="k-fly"></i>${t("my_c_fly")} · ${t("my_leg_fly")}</span><span><i class="k-done"></i>${t("my_c_done")} · ${t("my_leg_done")}</span><span><i class="k-pnt"></i>${t("my_c_pnt")} · ${t("my_leg_pnt")}</span><span><i class="k-off"></i>${t("my_leg_off")}</span><span><i class="k-today"></i>${t("my_today")}</span></div>
    ${dayStrips}</div>`}}
const cap1=x=>String(x).charAt(0).toUpperCase()+String(x).slice(1);
const hhmm=min=>{min=Math.max(0,Math.round(min));return`${Math.floor(min/60)}:${String(min%60).padStart(2,"0")}`};
const dfShort=ms=>new Intl.DateTimeFormat(LOCALE[lang],{day:"2-digit",month:"short"}).format(ms).replace(".","");
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="my-ack"],[data-action="my-day"],[data-action="my-m"]');if(!b)return;
  const a=b.dataset.action;
  if(a==="my-ack"){myAck(b.dataset.id);const leg=briefLegs().find(L=>data.reservations.find(r=>r.id===L.key)?.rosterId===b.dataset.id);openBriefingFlight(leg?.key);toast(t("my_ack_done"));return}
  if(a==="my-m"){const v=Number(b.dataset.v);RS.calM=v===0?0:RS.calM+v;RS.calDay=null;render();return}
  if(a==="my-day"){const k=b.dataset.k;RS.calDay=RS.calDay===k?null:k;render();
    setTimeout(()=>{const r=document.querySelector(".my-day-strips");r&&r.scrollIntoView&&r.scrollIntoView({behavior:"smooth",block:"nearest"})},40)}});

/* ---------- faixa de progresso de voo (flight strip), como as usadas no controle de tráfego aéreo ---------- */
const zHM=ms=>{const d=new Date(ms);return String(d.getUTCHours()).padStart(2,"0")+String(d.getUTCMinutes()).padStart(2,"0")+"Z"};
function stripCallsign(ac,L){const icao=(AIRLINE_ICAO[ac.airline]||AIRLINE_IATA[ac.airline]||"VFR").toUpperCase();const n=String(L.flightNo||"").replace(/^\S+\s*/,"")||"001";return icao+n}
function stripWake(ac){const ty=icaoType(ac.type),c=rsClassOf(ac);return ty==="A388"?"J":c==="wb"?"H":c==="ga"?"L":"M"}
function stripSquawk(cs,ms){let h=0;for(const ch of cs+ms)h=(h*31+ch.charCodeAt(0))>>>0;let s;
  do{s=[0,0,0,0].map((_,i)=>((h>>>(i*3))&7)).join("");h=(h*1103515245+12345)>>>0}while(/^(7[567]00|2000|1200|0000)$/.test(s)||s[0]==="0");return s}
/* nível de cruzeiro planejado: pela distância e pela regra semicircular (rumo leste = níveis ímpares, oeste = pares) */
function stripRFL(ac,L){const A=AIRPORTS&&AIRPORTS[L.dep],B=AIRPORTS&&AIRPORTS[L.arr],c=rsClassOf(ac),nm=L.nm||0;
  let fl=nm<70?80:nm<120?120:nm<200?190:nm<350?280:nm<700?350:370;fl=Math.min(fl,c==="ga"?120:c==="tp"?250:c==="wb"?390:390);
  if(A&&B){const r=x=>x*Math.PI/180,y=Math.sin(r(B[1]-A[1]))*Math.cos(r(B[0])),x=Math.cos(r(A[0]))*Math.sin(r(B[0]))-Math.sin(r(A[0]))*Math.cos(r(B[0]))*Math.cos(r(B[1]-A[1]));
    const brg=(Math.atan2(y,x)*180/Math.PI+360)%360,east=brg<180;if(((fl/10)%2===1)!==east)fl=fl>=370?fl-10:fl+10}
  return String(fl).padStart(3,"0")}
function stripHTML(ac,L,k,n){const cs=stripCallsign(ac,L),eet=L.blk||Math.round((L.sta-L.std)/6e4),now=Date.now();
  const fl=(s,c)=>`<span class="flap${c?" "+c:""}">${[...String(s)].map(ch=>`<span>${ch===" "?"&nbsp;":esc(ch)}</span>`).join("")}</span>`;
  const ap=c=>`<span class="wx" data-icao="${esc(c)}" tabindex="0">${fl(c,"xl w")}</span>`;
  const hz=ms=>{const d=new Date(ms);return String(d.getUTCHours()).padStart(2,"0")+":"+String(d.getUTCMinutes()).padStart(2,"0")+"Z"};
  const st=L.done?["done","st_done"]:now>=L.std&&now<L.sta?["air","st_air"]:now>=L.std-60*6e4&&now<L.std?["board","st_board"]:["sched","st_sched"];
  const rfl=L.fl?String(L.fl).padStart(3,"0"):stripRFL(ac,L),fn=String(L.flightNo||cs).replace(/\s+/g,"");
  return`<div class="mx-card${L.ferry?" ferry":""}">
    <div class="mx-ac">${planeImg(ac,"sm")}${regTag(ac,ac.id)}</div>
    <div class="mx-mid"><div class="mx-ap">${ap(L.dep)}${fl(hz(L.std))}<small>${tf.format(L.std)} ${t("t_local")}</small></div>
      <div class="mx-bar"><i>✈</i><em>${L.nm} nm · ${hhmm(eet)} · FL${rfl}</em></div>
      <div class="mx-ap r">${ap(L.arr)}${fl(hz(L.sta))}<small>${tf.format(L.sta)} ${t("t_local")}</small></div></div>
    <div class="mx-side">${fl(fn)}<small>${L.ferry?`<span class="chip neutral">${t("ferry_chip")}</span> `:""}${esc(ac.airline||"")} · ${esc(ac.type||"")}</small>
      <span class="mx-st ${st[0]}">${t(st[1])}</span><span class="mx-leg">${t("st_leg")} ${k}/${n}</span>
      <span class="mx-codes">${esc(cs)} · IFR${L.real&&L.route?" · RPL":""}</span>
      ${L.route?`<span class="mx-codes mx-route" title="${esc(L.route)}">${esc(L.route)}</span>`:""}</div></div>`}
/* efeito de painel de aeroporto (split-flap): as plaquinhas giram e param no código e no horário.
   Roda uma única vez, logo depois que a escala é gerada. */
const FLAP_L="ABCDEFGHIJKLMNOPQRSTUVWXYZ",FLAP_D="0123456789";
function flapAnimate(){
  if(!RS.flapAnim)return;RS.flapAnim=false;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const cards=[...document.querySelectorAll(".rs-out .mx-card")];if(!cards.length)return;
  let n=0;
  cards.forEach((card,ci)=>{
    card.querySelectorAll(".mx-ap .flap>span,.mx-side>.flap>span").forEach((sp,i)=>{
      const fin=sp.textContent;if(!/[A-Z0-9]/.test(fin))return;
      const pool=/[0-9]/.test(fin)?FLAP_D:FLAP_L,start=ci*260+i*45+(n++%3)*10,steps=10+Math.floor(Math.random()*8);
      let k=0;sp.textContent=pool[Math.floor(Math.random()*pool.length)];
      setTimeout(function tick(){
        if(!sp.isConnected)return;
        sp.classList.remove("flip");void sp.offsetWidth;sp.classList.add("flip");
        if(++k>=steps){sp.textContent=fin;setTimeout(()=>sp.classList.remove("flip"),120);return}
        sp.textContent=pool[(pool.indexOf(sp.textContent)+1+Math.floor(Math.random()*3))%pool.length];
        setTimeout(tick,55)},start)})})
}
function rsTime(ms){return`<span class="rs-t"><b>${tf.format(ms)}</b><small>${t("t_local")}</small></span><span class="rs-t utc"><b>${utcHM(ms)}</b><small>UTC</small></span>`}
function rosterHTML(R){
  const ac=acById(R.acId);if(!ac)return"";
  const byDay={};for(const L of R.legs)(byDay[L.day]=byDay[L.day]||[]).push(L);
  const blockTot=R.legs.reduce((s,L)=>s+L.blk,0);
  const daysTxt=R.days===1?t("rs_day1"):t("rs_daysN",{n:R.days});
  const expired=R.legs[0].std-20*6e4<Date.now();
  let html=`<div class="panel rs-out"><div class="rs-sum">${alSym(ac.airline)}<span class="plate al-plate${plLen(ac.registration)}"${plateStyle(ac.airline)}>${esc(ac.registration)}</span><span><b>${esc(ac.type)}</b> · ${esc(ac.airline||"")}</span>
    <span class="chip neutral">${t(R.legs.length===1?"rs_totals1":"rs_totals",{legs:R.legs.length,block:hm(blockTot),days:daysTxt})}</span>${R.real?`<span class="chip ok" title="${esc(t("rs_real_t"))}">✓ ${R.legs.some(L=>L.route)?t("rs_real_rpl"):t("rs_real",{m:esc((R.src||"").split("-").reverse().join("/"))})}</span>`:R.sim?`<span class="chip warn" title="${esc(t("rs_sim_t"))}">${t("rs_sim")}</span>`:""}</div>${RS.shiftErr?`<div class="notice bad">${RS.shiftErr}</div>`:""}${rsTwinNote(R)}`;
  const keys=Object.keys(byDay).map(Number).sort((a,b)=>a-b);
  keys.forEach((d,di)=>{const ls=byDay[d];const rep=ls[0].std-60*6e4,rel=ls[ls.length-1].sta+30*6e4,duty=Math.round((rel-rep)/6e4);
    const pick="";
    html+=`<section class="rs-day"><header><h3>${t("rs_day",{n:d})} <span class="muted">· ${esc(dtfDay(ls[0].std))}</span></h3>${pick}
      <span class="rs-meta">${t("rs_report")} ${rsTime(rep)}</span><span class="rs-meta">${t("rs_duty",{t:hm(duty)})}</span></header>
      <div class="rs-legs strip-bay">`;
    ls.forEach((L,i)=>{
      if(i>0)html+=`<div class="rs-turn">${t("rs_turn",{t:hm(Math.round((L.std-ls[i-1].sta)/6e4)),icao:esc(L.dep)})}</div>`;
      html+=stripHTML(ac,L,i+1,ls.length)});
    html+=`</div><footer>`;
    const nextDay=keys[di+1]?byDay[keys[di+1]]:null;
    if(nextDay){const rest=Math.round((nextDay[0].std-60*6e4-rel)/6e4);html+=`🛏 ${t("rs_layover",{icao:wxCode(ls[ls.length-1].arr),t:hm(rest)})}`}
    else html+=`🏁 ${t("rs_end",{icao:wxCode(ls[ls.length-1].arr)})} · ${t("rs_release")} ${rsTime(rel)}`;
    html+=`</footer></section>`});
  html+=`${expired?"":`<p class="notice" style="margin:0 0 10px">🔒 ${t("rs_accept_lock")}</p>`}<div class="rs-accept">${expired?`<p class="notice bad" style="margin:0">${t("rs_expired")}</p>`:`<button class="btn primary" type="button" data-action="rs-accept" ${RS.busy?"disabled":""}>${RS.acceptArmedUntil>Date.now()?t("rs_accept_confirm"):t("rs_accept",{n:R.legs.length})}</button>`}
    <button type="button" class="btn" data-action="rs-discard">${t("rs_discard")}</button></div><p class="form-err rs-accept-error" role="alert" ${RS.err?'':'hidden'}>${esc(RS.err||'')}</p></div>`;
  return html}
const dtfDay=ms=>new Intl.DateTimeFormat(LOCALE[lang],{weekday:"long",day:"2-digit",month:"short"}).format(ms);
const ymd=ms=>{const d=new Date(ms);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
/* troca a data do primeiro voo: a escala inteira anda junto, mantendo os horários locais e os descansos */
const shiftDays=(ms,n)=>{const d=new Date(ms);d.setDate(d.getDate()+n);return d.getTime()};
function rsShift(newYmd){
  const R=RS.roster;if(!R)return;const ac=acById(R.acId);if(!ac)return;
  const [y,m,dd]=newYmd.split("-").map(Number);const o=new Date(R.legs[0].std);
  const n=Math.round((new Date(y,m-1,dd)-new Date(o.getFullYear(),o.getMonth(),o.getDate()))/864e5);if(!n)return;
  const legs=R.legs.map(L=>({...L,std:shiftDays(L.std,n),sta:shiftDays(L.sta,n)}));
  const reg=esc(ac.registration);let err="";
  const v=rsValidate({ac},legs);
  if(v==="past")err=t("err_past");
  else if(v&&v.busy)err=t("rs_busy",{reg,t:fmtRange(v.busy.start,v.busy.end),dep:esc(v.busy.dep),arr:esc(v.busy.arr)});
  else if(v&&v.mine)err=myClashMsg(v.mine);
  else if(v&&v.aog)err=t("rs_aog",{reg,t:fmt(v.aog.s)});
  else{const at=locAt(ac.id,legs[0].std-20*6e4);if(at&&at!==legs[0].dep)err=t("rs_shift_loc",{reg,icao:esc(at),dep:esc(legs[0].dep)});
    const nx=nextAfter(ac.id,legs[0].std-20*6e4),last=legs[legs.length-1];
    if(!err&&nx&&(last.sta+25*6e4>nx.start||nx.dep!==last.arr))err=t("rs_nx",{reg,t:fmt(nx.start),icao:esc(nx.dep)})}
  if(err){RS.shiftErr=err;render();return}
  R.legs=legs;RS.start=shiftDays(RS.start,n);RS.shiftErr="";rsSave();render()}
document.addEventListener("change",e=>{if(e.target.id==="rs-day1"&&e.target.value){RS.pickDate=false;rsShift(e.target.value)}});
/* o destaque piscante some quando o piloto mexe na data */
document.addEventListener("focusin",e=>{if(e.target.id==="rs-day1"&&RS.pickDate){RS.pickDate=false;const l=e.target.closest(".rs-date");if(l)l.classList.remove("blink")}});


/* ---------- seletor de aeronave (busca, favoritas primeiro) — usado na Escala (rs) e na Reserva (bk) ---------- */
const ACP={rs:{open:false,q:"",al:"all"},bk:{open:false,q:"",al:"all"}};
const acpSel=k=>k==="rs"?RS.ac:($("#bk-ac")?.value||"");
/* grupo extra no topo: na reserva, as aeronaves que estarão no aeroporto de origem */
function acpTop(k){if(k==="rs"){const dep=RS.dep;if(!/^[A-Z0-9]{4}$/.test(dep||""))return null;const list=aircraftAt(dep,Math.max(RS.start||0,Date.now()));return list.length?{label:"📍 "+t("bk_at_airport",{icao:dep}),list}:null}
  if(k!=="bk")return null;const dep=apResolve($("#bk-dep")?.value||"");if(!/^[A-Z0-9]{4}$/.test(dep))return null;
  const ms=new Date($("#bk-start")?.value||"").getTime();const at=isNaN(ms)||ms<Date.now()?Date.now()+45*6e4:ms;
  const list=aircraftAt(dep,at);return list.length?{label:"📍 "+t("bk_at_airport",{icao:dep}),list}:null}
function acRowMini(k,a,sel){const st=statusOf(a.id),p=posNow(a.id);
  return`<button type="button" class="acp-i${sel?" sel":""}" data-action="acp-pick" data-k="${k}" data-id="${esc(a.id)}" role="option" aria-selected="${sel}">
    <span class="acp-star" aria-hidden="true">${isFav(a.id)?"★":""}</span>${k==="rs"?`<span class="plate al-plate${plLen(a.registration)}"${plateStyle(a.airline)}>${esc(a.registration)}</span>`:regTag(a,"")}
    <span class="acp-tx"><b>${esc(a.type)}</b><small>${esc(a.airline||"")}</small></span>
    ${p?`<span class="loc">📍 ${esc(p)}</span>`:""}${st.key!=="ok"?`<span class="pill ${st.key}">${stLabel(st.key)}</span>`:""}</button>`}
function acPickListHTML(k){const q=ACP[k].q||"",Q=q.trim().toUpperCase(),K=Q.replace(/[-\s]/g,""),cur=acpSel(k);
  const pfOk=k==="rs"&&RS.pf&&!RS.other?new Set(rsPfAircraft(RS.pf).map(a=>a.id)):null;
  /* Sem traslado, o seletor não oferece aeronave cuja posição conhecida seja outro aeródromo. */
  const canStart=a=>{if(k!=="rs"||RS.pf)return true;const at=locAt(a.id,RS.start);return!at||at===RS.dep};
  const al=ACP[k].al||"all",m=a=>(!pfOk||pfOk.has(a.id))&&canStart(a)&&(al==="all"||a.airline===al)&&(!Q||a.registration.replace(/[-\s]/g,"").includes(K)||String(a.type).toUpperCase().includes(Q)||String(a.airline||"").toUpperCase().includes(Q)||(icaoType(a.type)||"").includes(Q)||(Q.length===4&&posNow(a.id)===Q));
  // Para um voo RPL escolhido, destaque primeiro as aeronaves favoritas compatíveis.
  // A seção de aeronaves que já estão no aeródromo continua sendo usada nos demais fluxos.
  const top=k==="rs"?null:acpTop(k),seen=new Set();let html="";
  if(top){const l=top.list.filter(m).slice(0,40);l.forEach(a=>seen.add(a.id));if(l.length)html+=`<div class="acp-g">${esc(top.label)}</div>${l.map(a=>acRowMini(k,a,a.id===cur)).join("")}`}
  const fav=fleet.filter(a=>isFav(a.id)&&!seen.has(a.id)&&m(a));fav.forEach(a=>seen.add(a.id));
  if(fav.length)html+=`<div class="acp-g">★ ${esc(t("fav_group"))}</div>${fav.map(a=>acRowMini(k,a,a.id===cur)).join("")}`;
  const lim=Q?80:40,rest=fleet.filter(a=>!seen.has(a.id)&&m(a));
  if(rest.length)html+=`<div class="acp-g">${Q?t("acp_results"):t("acp_all")}</div>${rest.slice(0,lim).map(a=>acRowMini(k,a,a.id===cur)).join("")}`;
  if(rest.length>lim)html+=`<p class="muted acp-more">${t("acp_more",{n:rest.length-lim})}</p>`;
  return html||`<p class="muted acp-empty">${t("acp_none")}</p>`}
/* posição da aeronave: código ICAO e, embaixo, o nome do aeroporto (até duas linhas) */
function acpLocHTML(p){const r=AIRPORTS&&AIRPORTS[p],nm=r?(r[3]||""):"";
  return`<span class="acp-loc"${nm?` title="${esc(nm+(r[4]?" · "+r[4]:""))}"`:""}><span class="loc">📍 ${esc(p)}</span>${nm?`<small>${esc(nm)}</small>`:""}</span>`}
function acPickerHTML(k="rs",selId){const a=acById(selId||acpSel(k)),p=a?posNow(a.id):"",S=ACP[k];
  return`<div class="acp${S.open?" open":""}" data-k="${k}"><button type="button" class="acp-btn" data-action="acp-open" data-k="${k}" aria-haspopup="listbox" aria-expanded="${!!S.open}">
     ${a?`<span class="acp-star" aria-hidden="true">${isFav(a.id)?"★":""}</span>${k==="rs"?"":alSym(a.airline)}<span class="plate al-plate${plLen(a.registration)}"${plateStyle(a.airline)}>${esc(a.registration)}</span><span class="acp-tx"><b>${esc(a.type)}</b><small>${esc(a.airline||"")}</small></span>${p?acpLocHTML(p):""}`:`<span class="muted">${t("acp_pick")}</span>`}<span class="acp-caret" aria-hidden="true">▾</span></button>
   <div class="acp-pop" ${S.open?"":"hidden"}><input id="${k}-acq" class="acp-q" data-k="${k}" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(t("acp_search"))}" value="${esc(S.q||"")}">
     <div class="acp-list" id="${k}-acl" role="listbox">${S.open?acPickListHTML(k):""}</div></div></div>`}
function acPickOpen(k,on){ACP[k].open=on;const box=document.querySelector(`.acp[data-k="${k}"]`);if(!box)return;box.classList.toggle("open",on);
  box.querySelector(".acp-pop").hidden=!on;box.querySelector(".acp-btn").setAttribute("aria-expanded",on);
  if(on){$(`#${k}-acl`).innerHTML=acPickListHTML(k);const i=$(`#${k}-acq`);i&&i.focus();const s=box.querySelector(".acp-i.sel");s&&s.scrollIntoView&&s.scrollIntoView({block:"nearest"})}}
function acPickRefresh(k){const box=document.querySelector(`.acp[data-k="${k}"]`);if(box)box.outerHTML=acPickerHTML(k)}
document.addEventListener("input",e=>{if(e.target.classList&&e.target.classList.contains("acp-q")){const k=e.target.dataset.k;ACP[k].q=e.target.value;$(`#${k}-acl`).innerHTML=acPickListHTML(k)}});
document.addEventListener("keydown",e=>{if(!e.target.classList||!e.target.classList.contains("acp-q"))return;const k=e.target.dataset.k;const items=[...document.querySelectorAll(`#${k}-acl .acp-i`)];let i=items.indexOf(document.querySelector(`#${k}-acl .acp-i.kb`));
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();items[i]&&items[i].classList.remove("kb");i=e.key==="ArrowDown"?Math.min(items.length-1,i+1):Math.max(0,i-1);const it=items[i];if(it){it.classList.add("kb");it.scrollIntoView({block:"nearest"})}}
  else if(e.key==="Enter"){e.preventDefault();const it=items[i>=0?i:0];it&&it.click()}
  else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();acPickOpen(k,false);document.querySelector(`.acp[data-k="${k}"] .acp-btn`)?.focus()}},true);
document.addEventListener("click",e=>{for(const k in ACP){if(!ACP[k].open)continue;const box=document.querySelector(`.acp[data-k="${k}"]`);if(!box){ACP[k].open=false;continue}if(!box.contains(e.target))acPickOpen(k,false)}});
document.addEventListener("click",async e=>{const b=e.target.closest('[data-action="rs-dep-go"],[data-action="rs-ac-go"]');if(!b)return;
  if(b.dataset.action==="rs-ac-go"){RS.other=false;const a=acById(b.dataset.id);if(a)ACP.rs.al=a.airline||"all";RS.ac=b.dataset.id;RS.touched=true;RS.err="";RS.roster=null;render();return}
  if(b.dataset.action==="rs-dep-go"){RS.dep=b.dataset.v;RS.depSet=true;RS.other=false;RS.pf=null;RS.roster=null;render();return}});
document.addEventListener("click",e=>{const el=e.target.closest('[data-action="acp-open"],[data-action="acp-pick"]');if(!el)return;const k=el.dataset.k;
  if(el.dataset.action==="acp-open"){acPickOpen(k,!ACP[k].open);return}
  const id=el.dataset.id;ACP[k].open=false;ACP[k].q="";
  if(k==="rs"){RS.ac=id;RS.touched=true;if(!RS.depSet)RS.dep=locAt(RS.ac,RS.start)||RS.dep;RS.err="";render();return}
  const h=$("#bk-ac");if(h){h.value=id;acPickRefresh(k);h.dispatchEvent(new Event("change",{bubbles:true}))}});
/* a reserva muda de aeronave por outros caminhos (SimBrief, troca): mantém o botão em dia */
document.addEventListener("change",e=>{if(e.target.id==="bk-ac")acPickRefresh("bk")});

/* ---------- eventos ---------- */
document.addEventListener("change",e=>{const id=e.target.id;
  if(id==="rs-ac"){RS.ac=e.target.value;RS.dep=locAt(RS.ac,RS.start)||RS.dep;RS.err="";render()}
  if(id==="rs-days")RS.days=Number(e.target.value)||1;
  if(id==="rs-legs")RS.legs=Number(e.target.value)||0;
  if(id==="rs-start"){const ms=new Date(e.target.value).getTime();if(!isNaN(ms)){RS.start=ms;if(!RS.dep)RS.dep=locAt(RS.ac,ms)||"";if(RS.pf&&!rsSoonFlights(RS.dep).some(x=>pfKey(x)===pfKey(RS.pf)))RS.pf=null;rsRepaintDep()}}});
document.addEventListener("input",e=>{if(e.target.id==="rs-dep"){const v=apResolve(e.target.value);RS.dep=v;RS.touched=true;
    if(v&&AIRPORTS&&AIRPORTS[v]){RS.depSet=true;RS.pf=null;rsRepaintDep()}}
  if(e.target.id==="rs-start")utcHint("rs-start")});
try{new MutationObserver(()=>{const h=document.getElementById("rs-start-utc");if(h&&!h.textContent)utcHint("rs-start");
  const d=document.getElementById("rs-dep");if(d&&!d.value&&RS.dep&&!d.dataset.init){d.dataset.init="1";d.value=RS.dep}}).observe(document.body,{childList:true,subtree:true})}catch(e){}
document.addEventListener("submit",async e=>{if(e.target.id!=="f-rs")return;e.preventDefault();
  if(rosterMenuLocked()){showRosterLocked();return}
  const form=e.target;RS.dep=apResolve($("#rs-dep").value)||RS.dep;RS.days=Number($("#rs-days").value)||1;
  const ms=RS.other?new Date($("#rs-start")?.value||"").getTime():RS.pf?.f.std;if(Number.isFinite(ms))RS.start=ms;
  if(RS.start<rsEarliest())RS.start=rsSoonest();   /* nunca menos de 30 min a partir de agora */
  await loadRosterAirports();await loadSchedule();
  if(!RS.ac){RS.err=t(rsHere().length?"rdi_need":ACP.rs.al==="all"?"rs_need_al":"rs_need_ac",{icao:RS.dep});render();return}
  RS.legs=Number($("#rs-legs")?.value)||0;
  const pfOn=!!(RS.pf&&!RS.other);
  if(pfOn&&!rsSoonFlights(RS.dep).some(x=>pfKey(x)===pfKey(RS.pf))){RS.pf=null;RS.ac="";RS.err=t("pf_window");render();return}
  /* ADS-B é apenas observação: somente o voo RPL escolhido pode prender a primeira perna. */
  const twin=pfOn?{state:"try",src:"pf",cs:(AIRLINE_IATA[RS.pf.al]||RS.pf.code)+" "+RS.pf.f.fno,seq:[{fno:RS.pf.f.fno,std:RS.pf.f.std,dep:RS.pf.f.dep,arr:RS.pf.f.arr}]}:null;
  const r=generateRoster(RS.ac,RS.dep,RS.start,RS.days,RS.legs,twin&&twin.state==="try"?twin:null);
  if(pfOn&&!r.err&&!(r.legs[0]&&r.legs[0].twin)){RS.err=t("pf_nofit");render();return}
  if(!r.err&&twin){r.twinInfo={state:twin.state,cs:twin.cs||"",ap:twin.ap||"",std:twin.std||0,arr:twin.arr||""}}
  if(r.err){RS.err=rsErrText(r);render();return}
  RS.busy=true;render();
  const {data:left,error}=await sb.rpc("roster_roll");RS.busy=false;
  if(error){const m=error.message||"";RS.err=/ROSTER_LIMIT/.test(m)?t("rs_err_limit"):/roster_roll|Could not find|does not exist/i.test(m)?t("rs_not_installed"):dbMessage(error);if(/ROSTER_LIMIT/.test(m))RS.left=0;render();return}
  RS.left=left;RS.err="";RS.shiftErr="";RS.pickDate=false;RS.roster=r;RS.acceptArmedUntil=0;RS.flapAnim=true;rsSave();render();setTimeout(flapAnimate,30);
  setTimeout(()=>{const o=document.querySelector(".rs-out");o&&o.scrollIntoView&&o.scrollIntoView({behavior:"smooth",block:"start"})},60)});
document.addEventListener("click",async e=>{const el=e.target.closest('[data-action^="rs-"]');if(!el)return;const a=el.dataset.action;
  if(a==="rs-discard"){RS.shiftErr="";RS.roster=null;rsSave();render()}
  if(a==="rs-accept"&&RS.roster){
    e.preventDefault();if(RS.busy)return;if(rosterMenuLocked())return showRosterLocked();
    if(!(RS.acceptArmedUntil>Date.now())){RS.acceptArmedUntil=Date.now()+10000;el.textContent=t('rs_accept_confirm');setTimeout(()=>{if(RS.acceptArmedUntil<=Date.now()){RS.acceptArmedUntil=0;const button=document.querySelector('[data-action="rs-accept"]');if(button&&RS.roster&&!RS.busy)button.textContent=t('rs_accept',{n:RS.roster.legs.length})}},10050);return}
    RS.acceptArmedUntil=0;
    const R=RS.roster,reg=acById(R.acId)?.registration||R.acId;
    const sequence=rsReservationSequenceError(R.legs);if(sequence){RS.err=rsErrText(sequence);render();document.querySelector(".rs-accept-error")?.scrollIntoView({block:"center",behavior:"smooth"});return}
    const legs=R.legs.map(L=>({dep:L.dep,arr:L.arr,start:new Date(L.std-20*6e4).toISOString(),end:new Date(L.sta+25*6e4).toISOString(),flight_no:L.flightNo,ferry:!!L.ferry}));
    RS.busy=true;RS.err='';el.disabled=true;el.setAttribute('aria-busy','true');let result;
    try{result=await sb.rpc('accept_roster',{p_aircraft:R.acId,p_legs:legs})}catch(error){result={error}}
    RS.busy=false;const {data:rid,error}=result||{error:new Error('No response')};
    if(error){RS.err=/accept_roster|Could not find/i.test(error.message||'')?t('rs_not_installed'):dbMessage(error,reg);render();document.querySelector('.rs-accept-error')?.scrollIntoView({block:'center',behavior:'smooth'});return}
    RS.roster=null;rsSave();await load("reservations");if(rid)myAck(String(rid));RS.calM=0;RS.calDay=null;view='bookings';closeSheet();render();
    setTimeout(()=>{const o=document.querySelector(".my-prog")||document.querySelector(".my-roster");o&&o.scrollIntoView&&o.scrollIntoView({behavior:"smooth",block:"start"})},60);
    toast(t("rs_accepted",{n:legs.length}));

  }});
