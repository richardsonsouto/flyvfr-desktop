/* home.js — "Início": a tela central do piloto (primeira tela depois do login).
   • Próximo voo: faixa nas cores da companhia, contagem regressiva até a EOBT, rota com cidades e horários,
     situação (meteorologia de origem e destino, aeronave com/sem pane), botões de briefing, rastreamento e SimBrief,
     e as próximas pernas da escala. Sem voo marcado: convite para montar uma escala.
   • Seu progresso: patente, 3 conquistas mais próximas, horas e voos do mês e posição no ranking do mês.
   • Último voo: rota, matrícula, calço, pouso medido e situação do rastreio.
   • Avisos (os mesmos do sino), eventos e voos em andamento da companhia favorita.
   • No celular, uma barra fixa embaixo com Início, Escala, Briefing, Diário de bordo e Mapa. */
(function(){
 if(typeof viewFleet!=="function"||typeof renderApp!=="function")return;
 const T={
  nav:["Home","Início","Inicio","Accueil","Start","ホーム","首页","홈"],
  morning:["Good morning","Bom dia","Buenos días","Bonjour","Guten Morgen","おはようございます","早上好","좋은 아침입니다"],
  afternoon:["Good afternoon","Boa tarde","Buenas tardes","Bon après-midi","Guten Tag","こんにちは","下午好","안녕하세요"],
  evening:["Good evening","Boa noite","Buenas noches","Bonsoir","Guten Abend","こんばんは","晚上好","좋은 저녁입니다"],
  next:["Next flight","Próximo voo","Próximo vuelo","Prochain vol","Nächster Flug","次のフライト","下一航班","다음 비행"],
  legs:["{n}-leg roster","Escala de {n} pernas","Programación de {n} tramos","Rotation de {n} étapes","{n}-Leg-Umlauf","{n} レグのスケジュール","{n} 段航班排班","{n}구간 스케줄"],
  legs1:["1-leg roster","Escala de 1 perna","Programación de 1 tramo","Rotation d’une étape","1-Leg-Umlauf","1 レグのスケジュール","1 段航班排班","1구간 스케줄"],
  single:["Single flight","Voo avulso","Vuelo suelto","Vol isolé","Einzelflug","単発フライト","单次航班","단일 비행"],
  toEobt:["until EOBT {t}","até a EOBT {t}","hasta la EOBT {t}","avant l’EOBT {t}","bis EOBT {t}","EOBT {t} まで","距 EOBT {t}","EOBT {t}까지"],
  late:["late · EOBT {t}","atrasado · EOBT {t}","atrasado · EOBT {t}","en retard · EOBT {t}","verspätet · EOBT {t}","遅延 · EOBT {t}","已延误 · EOBT {t}","지연 · EOBT {t}"],
  block:["{t} block","{t} de calço","{t} de calzos","{t} cale à cale","{t} Blockzeit","ブロック {t}","轮挡 {t}","블록 {t}"],
  blockK:["Planned block","Calço previsto","Calzos previstos","Bloc prévu","Geplante Blockzeit","予定ブロック","计划轮挡","예정 블록"],
  typeK:["Aircraft","Aeronave","Aeronave","Avion","Flugzeug","機体","飞机","기체"],
  leftK:["Legs left","Pernas restantes","Tramos restantes","Étapes restantes","Verbleibende Legs","残りレグ","剩余航段","남은 구간"],
  simK:["Simulator","Simulador","Simulador","Simulateur","Simulator","シミュレーター","模拟器","시뮬레이터"],
  acOk:["Aircraft with no faults","Aeronave sem pane","Aeronave sin fallas","Avion sans panne","Flugzeug ohne Mängel","機体に不具合なし","飞机无故障","기체 결함 없음"],
  acWarn:["Aircraft with MEL item","Aeronave com item MEL","Aeronave con ítem MEL","Avion avec item MEL","Flugzeug mit MEL-Eintrag","MEL 項目あり","飞机有 MEL 项目","MEL 항목 있음"],
  acBad:["Aircraft grounded (AOG)","Aeronave parada (AOG)","Aeronave en tierra (AOG)","Avion immobilisé (AOG)","Flugzeug AOG","機体 AOG","飞机停场 (AOG)","기체 운항 불가 (AOG)"],
  brief:["Open briefing","Abrir briefing","Abrir briefing","Ouvrir le briefing","Briefing öffnen","ブリーフィングを開く","打开简报","브리핑 열기"],
  track:["Start tracking","Iniciar rastreamento","Iniciar seguimiento","Démarrer le suivi","Tracking starten","追跡を開始","开始跟踪","추적 시작"],
  today:["Your roster","Sua escala","Tu programación","Votre rotation","Ihr Umlauf","スケジュール","您的排班","내 스케줄"],
  nowLeg:["next","próximo","próximo","suivant","nächster","次","下一个","다음"],
  none:["No flight booked","Nenhum voo marcado","Ningún vuelo reservado","Aucun vol réservé","Kein Flug gebucht","予約されたフライトはありません","没有已预订的航班","예약된 비행 없음"],
  noneP:["Build an RPL roster with real airline flights, or pick any aircraft for a free roster.","Monte uma escala RPL com voos reais da companhia, ou escolha qualquer aeronave numa escala livre.","Arma una programación RPL con vuelos reales, o elige cualquier aeronave en una programación libre.","Créez une rotation RPL avec de vrais vols, ou choisissez un avion pour une rotation libre.","Erstellen Sie einen RPL-Umlauf mit echten Flügen oder wählen Sie ein Flugzeug für einen freien Umlauf.","実在便で RPL スケジュールを作るか、自由スケジュールで機体を選びましょう。","用真实航班生成 RPL 排班，或在自由排班中选择任意飞机。","실제 항공편으로 RPL 스케줄을 만들거나 자유 스케줄에서 기체를 고르세요."],
  noneFree:["Choose an aircraft from the freelancer fleet and build your free roster.","Escolha uma aeronave da frota freelancer e monte sua escala livre.","Elige una aeronave de la flota freelancer y crea tu programación libre.","Choisissez un avion de la flotte freelance et créez votre rotation libre.","Wählen Sie ein Flugzeug der Freelancer-Flotte und erstellen Sie Ihren freien Umlauf.","フリーランス機材から機体を選び、自由スケジュールを作成しましょう。","选择自由飞行员机队中的飞机，创建自由排班。","프리랜서 기단에서 항공기를 선택해 자유 스케줄을 만드세요."],
  mkFree:["Build free roster","Montar escala livre","Crear programación libre","Créer une rotation libre","Freien Umlauf erstellen","自由スケジュール作成","创建自由排班","자유 스케줄 만들기"],
  mkRpl:["Build RPL roster","Montar escala RPL","Armar programación RPL","Créer une rotation RPL","RPL-Umlauf erstellen","RPL スケジュール作成","生成 RPL 排班","RPL 스케줄 만들기"],
  fleet:["See the fleet","Ver a frota","Ver la flota","Voir la flotte","Flotte ansehen","機材を見る","查看机队","기단 보기"],
  prog:["Your progress","Seu progresso","Tu progreso","Votre progression","Ihr Fortschritt","あなたの進捗","您的进度","내 진행 상황"],
  nextIn:["{r} in","{r} em","{r} en","{r} dans","{r} in","{r} まで","距 {r}","{r}까지"],
  top:["Highest rank reached","Patente máxima alcançada","Rango máximo alcanzado","Grade maximal atteint","Höchster Rang erreicht","最高階級に到達","已达最高军衔","최고 계급 달성"],
  mH:["Hours this month","Horas no mês","Horas en el mes","Heures ce mois","Stunden im Monat","今月の時間","本月小时","이번 달 시간"],
  mN:["Flights this month","Voos no mês","Vuelos en el mes","Vols ce mois","Flüge im Monat","今月の便数","本月航班","이번 달 비행"],
  mR:["Month ranking","Ranking do mês","Ranking del mes","Classement du mois","Monatsrang","今月の順位","本月排名","이번 달 순위"],
  last:["Last flight","Último voo","Último vuelo","Dernier vol","Letzter Flug","前回のフライト","上一航班","지난 비행"],
  noLast:["Your first flight will show up here.","Seu primeiro voo vai aparecer aqui.","Tu primer vuelo aparecerá aquí.","Votre premier vol apparaîtra ici.","Ihr erster Flug erscheint hier.","最初のフライトがここに表示されます。","您的第一个航班会显示在这里。","첫 비행이 여기에 표시됩니다."],
  land:["Landing","Pouso","Aterrizaje","Atterrissage","Landung","着陸","着陆","착륙"],
  trk:["Tracking","Rastreio","Rastreo","Suivi","Tracking","追跡","跟踪","추적"],
  ver:["verified","verificado","verificado","vérifié","verifiziert","確認済み","已验证","확인됨"],
  nver:["not counted","não conta","no cuenta","non compté","zählt nicht","算入なし","不计入","미인정"],
  nofpm:["not measured","sem medição","sin medición","non mesuré","nicht gemessen","未計測","未测量","미측정"],
  alerts:["Alerts","Avisos","Avisos","Alertes","Hinweise","お知らせ","提醒","알림"],
  noAlerts:["Nothing pending. Good flights!","Nada pendente. Bons voos!","Nada pendiente. ¡Buenos vuelos!","Rien en attente. Bons vols !","Nichts offen. Guten Flug!","保留中の項目はありません。良いフライトを！","没有待办事项。飞行愉快！","대기 중인 항목이 없습니다. 좋은 비행 되세요!"],
  aog:["{n} {al} aircraft grounded by a fault","{n} aeronave(s) da {al} parada(s) por pane","{n} aeronave(s) de {al} en tierra por falla","{n} avion(s) {al} immobilisé(s) par une panne","{n} {al}-Flugzeug(e) wegen Mangel am Boden","{al} の {n} 機が不具合で運航停止","{al} 有 {n} 架飞机因故障停场","{al} 기체 {n}대가 결함으로 운항 불가"],
  events:["Events","Eventos","Eventos","Événements","Events","イベント","活动","이벤트"],
  noEv:["No events scheduled.","Nenhum evento marcado.","No hay eventos programados.","Aucun événement prévu.","Keine Events geplant.","予定されたイベントはありません。","暂无活动。","예정된 이벤트가 없습니다."],
  pilots:["{n} pilots","{n} pilotos","{n} pilotos","{n} pilotes","{n} Piloten","{n} 人","{n} 名飞行员","{n}명"],
  air:["Flying now","Agora no ar","Ahora en el aire","En vol maintenant","Jetzt in der Luft","現在飛行中","正在飞行","지금 비행 중"],
  airN:["{n} flight(s) in progress at {al}","{n} voo(s) em andamento na {al}","{n} vuelo(s) en curso en {al}","{n} vol(s) en cours chez {al}","{n} Flug/Flüge bei {al} unterwegs","{al} で {n} 便が運航中","{al} 有 {n} 个航班进行中","{al}에서 {n}편 운항 중"],
  airAll:["{n} flight(s) in progress","{n} voo(s) em andamento","{n} vuelo(s) en curso","{n} vol(s) en cours","{n} Flug/Flüge unterwegs","{n} 便が運航中","{n} 个航班进行中","{n}편 운항 중"],
  airNone:["Nobody flying right now.","Ninguém voando agora.","Nadie volando ahora.","Personne en vol en ce moment.","Gerade fliegt niemand.","現在飛行中のパイロットはいません。","目前没有人在飞行。","지금 비행 중인 사람이 없습니다."],
  see:["see","ver","ver","voir","ansehen","見る","查看","보기"],
  all:["see all","ver todos","ver todos","tout voir","alle","すべて","全部","전체"]};
 const ht=(k,p)=>{let s=(T[k][LANGS.indexOf(lang)]||T[k][0]);if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
 if(typeof L!=="undefined")L.nav_home=T.nav;
 if(typeof NAV_ICON!=="undefined"&&typeof _ic==="function")NAV_ICON.home=_ic('<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h5v-5.5h3V20h5V9.5"/>');
 const M=6e4,nf=(v,d)=>{try{return Number(v).toLocaleString(lang,{maximumFractionDigits:d==null?1:d})}catch(e){return String(v)}};
 const hm=ms=>{const m=Math.max(0,Math.round(ms/M));return`${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`};
 const city=c=>{try{const a=typeof AIRPORTS!=="undefined"&&AIRPORTS&&AIRPORTS[c];return a&&(a[4]||a[3])||""}catch(e){return""}};
 const utc=ms=>{const d=new Date(ms);return`${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}Z`};
 const eobtOf=r=>r.start+(r.rosterId?20*M:0),etaOf=r=>r.end-(r.rosterId?25*M:0);
 /* voos ainda por fazer (mesma regra do lembrete: até 45 min depois da EOBT) */
 function upcoming(){if(!myId)return[];const now=Date.now();
  return data.reservations.filter(r=>r.pilotId===myId&&booked(r)&&!data.flights.some(f=>f.reservationId===r.id)&&eobtOf(r)+45*M>now).sort((a,b)=>a.start-b.start)}
 /* cores da companhia com texto legível (branco ou preto, o que tiver mais contraste com a pior das duas cores) */
 function pal(al){const Lv=(typeof LIVERY!=="undefined"&&LIVERY[al])||["#13202E","#2C4A6B"];let [a,b]=Lv;b=b||a;
  if(typeof faContrast!=="function")return{a,b,ink:"#fff"};
  const w=Math.min(faContrast(a,"#ffffff"),faContrast(b,"#ffffff")),k=Math.min(faContrast(a,"#111111"),faContrast(b,"#111111")),ink=w>=k?"#ffffff":"#111111";
  const fix=c=>{let x=c,s=0;while(faContrast(x,ink)<4.5&&s<1){s+=.05;x=faMix(c,ink==="#ffffff"?"#000000":"#ffffff",s)}return x};return{a:fix(a),b:fix(b),ink}}
 /* meteorologia de origem e destino: busca uma vez e redesenha */
 const WXP=new Set();
 function wxChip(c){const k=typeof WX_CACHE!=="undefined"&&WX_CACHE[c],d=k&&k.data;
  if(!d){if(!WXP.has(c)&&typeof fetchWx==="function"&&navigator.onLine){WXP.add(c);fetchWx(c).then(()=>{if(view==="home")render()}).catch(()=>{})}return""}
  const cat=d.fltCat||"",cls={VFR:"ok",MVFR:"neutral",IFR:"warn",LIFR:"bad"}[cat]||"neutral",w=typeof dvWind==="function"?dvWind(d.metar):null;
  if(!cat&&!w)return"";return`<span class="hm-chip ${cls}">${esc(c)}${cat?" "+esc(cat):""}${w?` · ${w.dir==null?"VRB":String(w.dir).padStart(3,"0")}/${String(w.spd).padStart(2,"0")}kt`:""}</span>`}
 function nextCard(){const up=upcoming(),r=up[0],free=typeof flIsFree==="function"&&flIsFree();
  if(!r)return`<section class="hm-card hm-next hm-empty"><div class="hm-ein"><span class="hm-big" aria-hidden="true">✈</span><h3>${esc(ht("none"))}</h3><p class="muted">${esc(ht(free?"noneFree":"noneP"))}</p>
   <div class="hm-acts"><button type="button" class="btn primary" data-view="roster">${esc(ht(free?"mkFree":"mkRpl"))}</button><button type="button" class="btn" data-view="fleet">${esc(ht("fleet"))}</button></div></div></section>`;
  const a=acById(r.aircraftId)||{registration:r.aircraftId,type:"",airline:""},al=a.airline||"",P=pal(al),now=Date.now(),eobt=eobtOf(r),eta=etaOf(r);
  const same=r.rosterId?up.filter(x=>x.rosterId===r.rosterId):[r],nLegs=r.rosterId?data.reservations.filter(x=>x.rosterId===r.rosterId&&x.pilotId===myId).length:0,legsTxt=r.rosterId?(nLegs===1?ht("legs1"):ht("legs",{n:nLegs})):ht("single");
  const late=eobt<now,cd=late?"−"+hm(now-eobt):(eobt-now>=48*36e5?Math.floor((eobt-now)/864e5)+" d":hm(eobt-now));
  const st=statusOf(r.aircraftId).key,stc=st==="bad"?["bad","acBad"]:st==="warn"?["warn","acWarn"]:["ok","acOk"];
  const fno=(r.flightNo||"").trim(),code=icaoType(a.type)||a.type||"",sims=typeof mySims==="function"?mySims():[];
  const canTrk=typeof trkCanStart==="function"&&trkCanStart(r),canBrief=typeof briefingEnabled==="function"&&briefingEnabled();
  const sbUrl=typeof simbriefUrl==="function"?simbriefUrl(r):"";
  return`<section class="hm-card hm-next"><div class="hm-band" style="background:linear-gradient(120deg,${P.a},${P.b});color:${P.ink}">
    <span class="hm-al">${typeof alSym==="function"&&alSym(al)||esc((al||"VFR").slice(0,2).toUpperCase())}</span>
    <div class="hm-bt"><span class="hm-k">${esc(ht("next"))}${al?" · "+esc(al):""}</span><b>${fno?esc(fno)+" · ":""}${esc(legsTxt)}</b></div>
    <div class="hm-cd"><b class="mono">${esc(cd)}</b><small>${esc(ht(late?"late":"toEobt",{t:utc(eobt)}))}</small></div></div>
   <div class="hm-route"><div class="hm-ap"><b class="mono">${esc(r.dep)}</b><small>${esc(city(r.dep))}</small><span class="mono">EOBT ${utc(eobt)}</span></div>
    <div class="hm-mid"><span>${esc(ht("block",{t:hm(eta-eobt)}))}</span><i aria-hidden="true"></i><span>${regTag(a,r.aircraftId)}</span></div>
    <div class="hm-ap r"><b class="mono">${esc(r.arr)}</b><small>${esc(city(r.arr))}</small><span class="mono">ETA ${utc(eta)}</span></div></div>
   <div class="hm-chips">${wxChip(r.dep)}${wxChip(r.arr)}<span class="hm-chip ${stc[0]}">${esc(ht(stc[1]))}</span></div>
   <div class="hm-facts"><div><small>${esc(ht("blockK"))}</small><b class="mono">${hm(eta-eobt)}</b></div><div><small>${esc(ht("typeK"))}</small><b class="mono">${esc(code||"—")}</b></div>
    <div><small>${esc(ht("leftK"))}</small><b class="mono">${same.length}</b></div><div><small>${esc(ht("simK"))}</small><b data-simulator-text-only>${esc(sims.length?simName(sims[0]):"—")}</b></div></div>
   <div class="hm-acts">${canBrief?`<button type="button" class="btn primary" data-view="briefing">${esc(ht("brief"))}</button>`:""}
    ${canTrk?`<button type="button" class="btn${canBrief?"":" primary"}" data-action="trk-open" data-id="${esc(r.id)}">✈ ${esc(ht("track"))}</button>`:""}
    ${sbUrl?`<a class="btn" href="${esc(sbUrl)}" target="_blank" rel="noopener">SimBrief ↗</a>`:""}</div>
   ${same.length>1||up.length>1?`<div class="hm-legs"><div class="hm-lk">${esc(ht("today"))}</div>${(r.rosterId?same:up).slice(0,5).map((x,i)=>`<div class="hm-leg${i?"":" cur"}"><span class="hm-dot"></span><b class="mono">${utc(eobtOf(x))}</b><span class="mono">${esc(x.dep)} → ${esc(x.arr)}</span><span class="mono muted">${esc((x.flightNo||"").trim())}</span><span class="muted">${i?hm(etaOf(x)-eobtOf(x)):esc(ht("nowLeg"))}</span></div>`).join("")}</div>`:""}</section>`}
 function progCard(){const s=pilotStats(myId),r=rankOf(s.h),pct=r.next?Math.max(0,Math.min(100,(s.h-r.h)/(r.next.h-r.h)*100)):100;
  const near=BADGES.filter(b=>!b.ok(s)).map(b=>{const g={first:[s.n,1],f10:[s.n,10],f50:[s.n,50],f100:[s.n,100],h100:[s.h,100],long:[s.longest/60,8],types5:[s.types,5],airlines5:[s.airlines,5],world:[s.regions,4],ap20:[s.airports,20],ferry:[s.ferry,1],event:[s.ev,1],mech:[s.reports,5]}[b.k];return g&&g[0]>0?{k:b.k,p:Math.min(1,g[0]/g[1]),txt:`${nf(Math.min(g[0],g[1]),b.k==="h100"||b.k==="long"?1:0)} / ${g[1]}`}:null}).filter(Boolean).sort((a,b)=>b.p-a.p).slice(0,3);
  const m0=new Date();m0.setDate(1);m0.setHours(0,0,0,0);const from=m0.getTime(),tot={};
  for(const f of data.flights)if(f.createdAt>=from&&counts(f))tot[f.pilotId]=(tot[f.pilotId]||0)+(f.blockMin||0);
  const mine=data.flights.filter(f=>f.pilotId===myId&&f.createdAt>=from&&counts(f)),pos=tot[myId]?Object.values(tot).filter(v=>v>tot[myId]).length+1:null;
  return`<section class="hm-card"><div class="hm-h"><h3>${esc(ht("prog"))}</h3><button type="button" class="linkish" data-view="logbook">${esc(t("nav_logbook"))} ›</button></div>
   <div class="hm-rank">${insignia(r)}<div><b>${esc(t(r.k))}</b>${r.next?`<div class="hm-row"><span>${esc(ht("nextIn",{r:t(r.next.k)}))}</span><span class="mono">${nf(Math.max(.1,r.next.h-s.h))} h</span></div><div class="hm-bar"><i style="width:${pct.toFixed(1)}%"></i></div>`:`<div class="hm-row"><span>${esc(ht("top"))}</span></div>`}</div></div>
   ${near.length?`<div class="hm-near">${near.map(x=>`<div><b>${esc(t("bd_"+x.k))}</b><span class="mono">${esc(x.txt)}</span><div class="hm-bar"><i style="width:${(x.p*100).toFixed(1)}%"></i></div></div>`).join("")}</div>`:""}
   <div class="hm-mo"><div><small>${esc(ht("mH"))}</small><b class="mono">${block(mine.reduce((x,f)=>x+(f.blockMin||0),0))}</b></div><div><small>${esc(ht("mN"))}</small><b class="mono">${mine.length}</b></div><div><small>${esc(ht("mR"))}</small><b class="mono">${pos?pos+"º":"—"}</b></div></div></section>`}
 function lastCard(){const f=data.flights.filter(x=>x.pilotId===myId).sort((a,b)=>b.createdAt-a.createdAt)[0];
  const head=`<div class="hm-h"><h3>${esc(ht("last"))}</h3>${f?`<button type="button" class="linkish" data-action="open-aircraft" data-id="${esc(f.aircraftId)}">${esc(t("open_log"))} ›</button>`:""}</div>`;
  if(!f)return`<section class="hm-card">${head}<p class="muted">${esc(ht("noLast"))}</p></section>`;
  const a=acById(f.aircraftId),ok=counts(f),fpm=Number.isFinite(f.landingFpm)&&f.landingFpm>0?Math.round(f.landingFpm):null;
  return`<section class="hm-card hm-last">${head}<div class="hm-lr"><b class="mono">${esc(f.dep)} → ${esc(f.arr)}</b>${regTag(a,f.aircraftId)}</div>
   <p class="muted hm-ls">${dateF(f.createdAt)}${a?` · ${esc(a.type||"")}${a.airline?" · "+esc(a.airline):""}`:""}</p>
   <div class="hm-facts three"><div><small>${esc(t("block_time"))}</small><b class="mono">${block(f.blockMin||0)}</b></div>
    <div><small>${esc(ht("land"))}</small><b class="mono${fpm!=null&&fpm<=200?" ok":""}">${fpm!=null?(fpm<=100?"🧈 ":"")+fpm+" fpm":esc(ht("nofpm"))}</b></div>
    <div><small>${esc(ht("trk"))}</small><b class="${ok?"ok":"warn"}">${esc(ht(ok?"ver":"nver"))}</b></div></div></section>`}
 function alertsCard(){const items=[];
  try{if(typeof notifItems==="function")for(const n of notifItems().filter(n=>n.k!=="ach").slice(0,3)){
   const act=n.act==="aircraft"?`data-action="open-aircraft" data-id="${esc(n.ac)}"`:`data-view="${n.act==="events"?"events":n.act==="logbook"?"logbook":"bookings"}"`;
   items.push(`<div class="hm-av ${n.k==="cx"||n.k==="def"?"bad":n.k==="open"||n.k==="soon"?"warn":""}"><span>${esc(n.text)}</span><button type="button" class="linkish" ${act}>${esc(ht("see"))}</button></div>`)}}catch(e){}
  try{const fav=typeof myFavAirline==="function"?myFavAirline():"";if(fav){const n=fleet.filter(a=>a.airline===fav&&statusOf(a.id).key==="bad").length;
   if(n)items.push(`<div class="hm-av bad"><span>⛔ ${esc(ht("aog",{n,al:fav}))}</span><button type="button" class="linkish" data-view="fleet">${esc(ht("see"))}</button></div>`)}}catch(e){}
  return`<section class="hm-card"><div class="hm-h"><h3>${esc(ht("alerts"))}</h3></div>${items.length?items.join(""):`<p class="muted">${esc(ht("noAlerts"))}</p>`}</section>`}
 function eventsCard(){const now=Date.now(),ev=(typeof EVENTS!=="undefined"?EVENTS:[]).filter(e=>e.start>now-3*36e5).sort((a,b)=>a.start-b.start).slice(0,2);
  return`<section class="hm-card"><div class="hm-h"><h3>${esc(ht("events"))}</h3><button type="button" class="linkish" data-view="events">${esc(ht("all"))} ›</button></div>
   ${ev.length?ev.map(e=>{const n=new Set(data.reservations.filter(r=>r.eventId===e.id&&(booked(r)||r.status==="completed")).map(r=>r.pilotId)).size;
    return`<div class="hm-av"><span><b>${esc(e.title)}</b><br><small class="muted">${esc(fmt(e.start))}${e.dep?` · ${esc(e.dep)}${e.arr?" → "+esc(e.arr):""}`:""} · ${esc(ht("pilots",{n}))}</small></span><button type="button" class="linkish" data-view="events">${esc(ht("see"))}</button></div>`}).join("")
    :`<p class="muted">${esc(ht("noEv"))}</p>`}</section>`}
 function airCard(){const now=Date.now(),fav=typeof myFavAirline==="function"?myFavAirline():"";
  const trk=new Set((typeof liveTracks==="function"?liveTracks():[]).map(k=>k.reservation_id)),live=data.reservations.filter(r=>trk.has(r.id)&&!data.flights.some(f=>f.reservationId===r.id)),mine=fav?live.filter(r=>(acById(r.aircraftId)||{}).airline===fav):live;
  const show=(mine.length?mine:live).slice(0,3),txt=mine.length&&fav?ht("airN",{n:mine.length,al:fav}):live.length?ht("airAll",{n:live.length}):"";
  return`<section class="hm-card"><div class="hm-h"><h3>${esc(ht("air"))}</h3><button type="button" class="linkish" data-view="map">${esc(t("nav_map"))} ›</button></div>
   ${txt?`<div class="hm-av"><span><b>🟢 ${esc(txt)}</b><br><small class="muted">${show.map(r=>`${esc((acById(r.aircraftId)||{}).registration||"")} ${esc(r.dep)}→${esc(r.arr)}`).join(" · ")}</small></span><button type="button" class="linkish" data-view="map">${esc(ht("see"))}</button></div>`
    :`<p class="muted">${esc(ht("airNone"))}</p>`}</section>`}
 function viewHome(){const h=new Date().getHours(),g=ht(h<5||h>=18?"evening":h<12?"morning":"afternoon"),name=(names[myId]||"").trim().split(/\s+/)[0]||"";
  if(typeof AIRPORTS!=="undefined"&&!AIRPORTS&&typeof loadAirports==="function"&&!viewHome.ap){viewHome.ap=1;loadAirports().then(()=>{if(view==="home")render()}).catch(()=>{})}
  let d="";try{d=new Date().toLocaleDateString(lang,{weekday:"long",day:"numeric",month:"long"})}catch(e){}
  return`<div class="hm"><div class="hm-top"><h2>${esc(g)}${name?", "+esc(name):""}</h2><span class="muted">${esc(d)}</span></div>
   <div class="hm-g">${nextCard()}<div class="hm-col">${progCard()}${lastCard()}</div></div>
   <div class="hm-g3">${alertsCard()}${eventsCard()}${airCard()}</div></div>`}
 window.viewHome=viewHome;
 /* "home" entra no lugar da Frota só quando a tela pedida é o Início */
 const vf=viewFleet;viewFleet=function(){if(view==="home")return viewHome();return vf.apply(this,arguments)};
 /* aba no menu (primeira) */
 if(typeof paintChrome==="function"){const pc=paintChrome;paintChrome=function(){const r=pc.apply(this,arguments);try{const tb=document.getElementById("tabs");
   if(tb&&session&&!recovering&&!tb.querySelector('[data-view="home"]'))tb.insertAdjacentHTML("afterbegin",`<button class="tab" data-view="home" title="${esc(ht("nav"))}" aria-current="${view==="home"?"page":"false"}">${NAV_ICON.home||""}<span>${esc(ht("nav"))}</span></button>`);
   if(view==="home"){tb&&tb.querySelectorAll('.tab[data-view]').forEach(b=>b.setAttribute("aria-current",b.dataset.view==="home"?"page":"false"));const pt=document.getElementById("page-title");if(pt)pt.textContent=ht("nav")}}catch(e){}return r}}
 /* primeira tela depois do login */
 if(typeof rsHomeInit==="function"){const ri=rsHomeInit;rsHomeInit=function(){const r=ri.apply(this,arguments);try{view="home"}catch(e){}return r}}
 /* barra de baixo no celular */
 const BB=["home","roster","briefing","logbook","map"];
 function paintBar(){let bar=document.getElementById("hm-bar");const on=!!(session&&!recovering&&!document.body.classList.contains("is-landing")&&document.documentElement.dataset.layout!=="bottom");
  if(!on){if(bar)bar.remove();document.body.classList.remove("hm-has-bar");return}
  if(!bar){bar=document.createElement("nav");bar.id="hm-bar";bar.className="hm-tabbar";bar.setAttribute("aria-label","Menu");document.body.appendChild(bar)}
  document.body.classList.add("hm-has-bar");
  bar.innerHTML=BB.map(v=>{const off=v==="briefing"&&!(typeof briefingEnabled==="function"&&briefingEnabled());return`<button type="button" data-view="${v}" class="${v===view?"on":""}${off?" off":""}" aria-current="${v===view?"page":"false"}">${(NAV_ICON[v]||"")}<span>${esc(v==="home"?ht("nav"):t("nav_"+v))}</span></button>`}).join("")}
 if(typeof render==="function"){const rr=render;render=function(){const r=rr.apply(this,arguments);try{paintBar()}catch(e){}return r}}
 const css=`.hm{display:grid;gap:16px}.hm-top{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}.hm-top h2{margin:0;font:700 2rem var(--f-display)}
.hm-g{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:16px;align-items:start}.hm-col{display:grid;gap:16px}
.hm-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.hm-card{background:var(--sheet);border:1px solid var(--line);border-radius:12px;padding:16px 18px;min-width:0}
.hm-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:10px}.hm-h h3{margin:0;font:700 1.25rem var(--f-display)}.hm-h .linkish{font-size:.8rem;white-space:nowrap}
.hm-next{padding:0;overflow:hidden}
.hm-band{display:flex;align-items:center;gap:14px;padding:16px 20px}
.hm-al{width:44px;height:44px;border-radius:10px;background:#fff;display:grid;place-items:center;flex:none;font:700 .9rem var(--f-mono);color:#13202E;overflow:hidden}.hm-al img{max-width:34px;max-height:34px}
.hm-bt{min-width:0}.hm-k{display:block;font:600 .78rem var(--f-display);letter-spacing:.14em;text-transform:uppercase;opacity:.85}.hm-bt b{font:700 1.4rem var(--f-display);display:block;line-height:1.1}
.hm-cd{margin-left:auto;text-align:right}.hm-cd b{font-size:2rem;line-height:1;display:block}.hm-cd small{font-size:.74rem;opacity:.9}
.hm-route{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:18px 20px 6px}
.hm-ap b{font-size:2.2rem;line-height:1;display:block}.hm-ap small{color:var(--muted);font-size:.86rem;display:block}.hm-ap span{font-weight:600;font-size:.86rem;display:block;margin-top:6px}.hm-ap.r{text-align:right}
.hm-mid{display:grid;justify-items:center;gap:6px;color:var(--muted);font-size:.8rem;text-align:center}.hm-mid i{width:min(180px,22vw);height:2px;background:var(--line);position:relative}.hm-mid i:after{content:"✈";position:absolute;left:50%;top:-10px;transform:translateX(-50%);color:#0B6A93;font-style:normal;font-size:15px}
.hm-chips{display:flex;gap:6px;flex-wrap:wrap;padding:6px 20px 0}
.hm-chip{font:600 .72rem var(--f-mono);padding:3px 9px;border-radius:12px;background:var(--sunk);color:var(--muted)}.hm-chip.ok{background:var(--ok-bg);color:var(--ok)}.hm-chip.warn{background:var(--warn-bg);color:var(--warn)}.hm-chip.bad{background:var(--bad-bg);color:var(--bad)}
.hm-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:12px 20px}.hm-facts.three{grid-template-columns:repeat(3,minmax(0,1fr));padding:8px 0 0}
.hm-facts>div{background:var(--sunk);border-radius:8px;padding:8px 10px;min-width:0}.hm-facts small{display:block;font-size:.64rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hm-facts b{font-size:.98rem}
.hm-facts b.ok{color:var(--ok)}.hm-facts b.warn{color:var(--warn)}
.hm-acts{display:flex;gap:8px;flex-wrap:wrap;padding:6px 20px 18px}
.hm-legs{border-top:1px solid var(--line);padding:10px 20px 16px}.hm-lk{font-size:.66rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.hm-leg{display:grid;grid-template-columns:14px 64px minmax(0,1fr) 80px 60px;gap:10px;align-items:center;font-size:.86rem;padding:4px 0}
.hm-dot{width:10px;height:10px;border-radius:50%;border:2px solid #0B6A93}.hm-leg.cur .hm-dot{background:#0B6A93}
.hm-empty{padding:28px 24px}.hm-ein{display:grid;justify-items:start;gap:6px}.hm-ein h3{margin:0;font:700 1.5rem var(--f-display)}.hm-ein p{margin:0 0 6px}.hm-big{font-size:2rem}.hm-empty .hm-acts{padding:6px 0 0}
.hm-rank{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center}.hm-rank .insignia svg{width:38px;height:auto}.hm-rank b{font:700 1.3rem var(--f-display)}
.hm-row{display:flex;justify-content:space-between;gap:8px;font-size:.8rem;color:var(--muted)}
.hm-bar{height:7px;border-radius:5px;background:var(--sunk);overflow:hidden;margin-top:5px}.hm-bar i{display:block;height:100%;border-radius:5px;background:#0B6A93}
.hm-near{display:grid;gap:8px;margin-top:12px}.hm-near>div{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:10px;font-size:.84rem}.hm-near .hm-bar{grid-column:1/-1;height:5px;margin-top:3px}.hm-near span{font-size:.74rem;color:var(--muted)}
.hm-mo{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.hm-mo>div{background:var(--sunk);border-radius:8px;padding:8px 10px}.hm-mo small{display:block;font-size:.7rem;color:var(--muted)}.hm-mo b{font-size:1.05rem}
.hm-lr{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.hm-lr b{font-size:1.1rem}.hm-ls{margin:4px 0 0;font-size:.82rem}
.hm-av{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 11px;border-radius:8px;background:var(--sunk);font-size:.86rem;margin-bottom:8px}.hm-av.bad{background:var(--bad-bg)}.hm-av.warn{background:var(--warn-bg)}.hm-av .linkish{font-size:.8rem;font-weight:600}
.hm-card>p.muted{margin:4px 0;font-size:.86rem}
:root[data-theme="dark"] .hm-bar i,:root[data-theme="dark"] .hm-leg.cur .hm-dot{background:#4FB3DE}:root[data-theme="dark"] .hm-dot{border-color:#4FB3DE}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .hm-bar i,:root:not([data-theme="light"]) .hm-leg.cur .hm-dot{background:#4FB3DE}:root:not([data-theme="light"]) .hm-dot{border-color:#4FB3DE}}
.hm-tabbar{display:none}
@media (max-width:1100px){.hm-g{grid-template-columns:1fr}.hm-g3{grid-template-columns:1fr}}
@media (max-width:899px){body.hm-has-bar .hm-tabbar{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;z-index:60;background:#13202E;padding:6px 4px calc(6px + env(safe-area-inset-bottom));box-shadow:0 -2px 10px rgba(0,0,0,.2)}
 .hm-tabbar button{background:none;border:0;color:#AEBBC8;display:grid;justify-items:center;gap:2px;font-size:.66rem;padding:4px 0;cursor:pointer}.hm-tabbar button svg{width:22px;height:22px}.hm-tabbar button.on{color:#F5B800}.hm-tabbar button.off{opacity:.45}
 body.hm-has-bar{padding-bottom:calc(64px + env(safe-area-inset-bottom))}body.hm-has-bar .toast{bottom:calc(76px + env(safe-area-inset-bottom))}}
@media (max-width:640px){.hm-top h2{font-size:1.6rem}.hm-band{padding:14px 16px;gap:10px}.hm-bt b{font-size:1.15rem}.hm-cd b{font-size:1.5rem}.hm-route{padding:14px 16px 4px;gap:8px}.hm-ap b{font-size:1.6rem}.hm-mid .plate{font-size:.8rem}
 .hm-facts{grid-template-columns:repeat(2,minmax(0,1fr));padding:10px 16px}.hm-chips,.hm-acts{padding-left:16px;padding-right:16px}.hm-acts .btn{flex:1 1 auto;justify-content:center;text-align:center}.hm-legs{padding:10px 16px 14px}.hm-leg{grid-template-columns:12px 56px minmax(0,1fr) 64px}.hm-leg>span:last-child{display:none}}`;
 const st=document.createElement("style");st.id="home-css";st.textContent=css;document.head.appendChild(st);
})();
