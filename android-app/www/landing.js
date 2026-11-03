/* =========================================================================
   Página inicial (visitante sem login): apresentação em estilo marketing.
   Os botões levam ao formulário de entrar / criar conta.
   ========================================================================= */
const LP_PLANE=`<g class="lp-plane">
  <path d="M11,-22 L128,42 L128,54 L11,20Z M-11,-22 L-128,42 L-128,54 L-11,20Z" fill="url(#lpWing)"/>
  <rect x="41" y="-12" width="14" height="34" rx="6" fill="#C9D3DE"/><rect x="-55" y="-12" width="14" height="34" rx="6" fill="#C9D3DE"/>
  <path d="M9,86 L54,110 L54,119 L9,108Z M-9,86 L-54,110 L-54,119 L-9,108Z" fill="url(#lpWing)"/>
  <path d="M0,-124 C8,-120 11,-102 11,-82 L11,96 C11,111 6,123 0,130 C-6,123 -11,111 -11,96 L-11,-82 C-11,-102 -8,-120 0,-124Z" fill="url(#lpBody)"/>
  <path d="M-5,-104 Q0,-110 5,-104 L5,-99 L-5,-99Z" fill="#1A2638"/>
  <path d="M0,-70 L0,104" stroke="var(--lp-acc)" stroke-width="3" stroke-linecap="round" opacity=".9"/>
</g>`;
const LP_PX=1090,LP_PY=235,LP_ROT=40;
function lpPlaneGroup(shadow=true){return`<g class="lp-fly"><g transform="translate(${LP_PX} ${LP_PY}) rotate(${LP_ROT})">
    <path class="lp-trail" d="M41,22 L41,520 M-41,22 L-41,520" stroke="url(#lpTrail)" stroke-width="7" filter="url(#lpGlow)"/>
    <path class="lp-trail2" d="M48,22 L48,560 M-48,22 L-48,560" stroke="url(#lpTrail)" stroke-width="3"/>
  </g>
  ${shadow?`<g transform="translate(${LP_PX+45} ${LP_PY+55}) rotate(${LP_ROT}) scale(1.05)" opacity=".45" filter="url(#lpShadow)"><path d="M0,-124 L128,48 L0,130 L-128,48Z" fill="#000"/></g>`:""}
  <g transform="translate(${LP_PX} ${LP_PY}) rotate(${LP_ROT}) scale(1.05)">${LP_PLANE}</g></g>`}
/* "Baixar para Windows": em computadores (não em celular/tablet) e fora do app já instalado */
const lpDlOk=()=>!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)&&!(typeof isStandalone==="function"&&isStandalone());
document.addEventListener("click",e=>{if(!e.target.closest('[data-action="dl-win"]'))return;if(typeof downloadExe==="function"){downloadExe();sheetInstallExe()}});
/* ícones próprios (genéricos) para a faixa "Compatível com" — não reproduzem logotipos das marcas */
const LP_SHOW={en:[
 {img:"fleet",k:"Shared fleet",h:["A real fleet,","shared with everyone."],p:"Every aircraft has a real registration, position, technical status and a direct link to its livery. You book and fly the same aircraft as the other pilots.",li:["Real registrations in each airline's colours.","Live position and status of every aircraft.","Livery links on flightsim.to and x-plane.org."]},
 {img:"roster",note:1,k:"Automatic roster",h:["Your roster,","just like a crew member's."],p:"Generate pairings with real airline flights*, including report time, rest, layovers and release, within duty-time limits.",li:["Real* airline flights, times and routes.","Flight strips with callsign, squawk and level.","Accept the roster and book every leg in one tap."]},
 {img:"techlog",k:"Tech log",h:["No departure","without the tech log."],p:"Before each flight you review the aircraft's open items. Afterwards you report defects and follow maintenance, just like a real tech log.",li:["MEL items with deadline and operational procedure.","Defect reporting by ATA chapter.","Aircraft on ground (AOG) until maintenance releases it."]},
 {img:"map",k:"Fleet map",h:["See the fleet","flying right now."],p:"Follow where every aircraft is and where it's heading. Tracked flights show the real position sent by the simulator.",li:["Live position, altitude and speed.","Airports with aircraft and maintenance alerts.","Times in LOCAL and UTC."]},
 {img:"events",k:"Group events",h:["Take off","with the community."],p:"Schedule group flights with an agreed time, route and frequency, and see who has already confirmed.",li:["Create events with origin, destination and time.","See confirmed pilots and booked aircraft.","Reminder before the event starts."]},
 {img:"pay",k:"Career and pay",h:["Every hour flown","counts toward your career."],p:"Rank up with your flight hours and follow a simulated payslip in the currency of your choice.",li:["Ranks that rise with the hours you fly.","Monthly payslip with hours, per diems and layovers.","Community pilot ranking."]}],
es:[
 {img:"fleet",k:"Flota compartida",h:["Una flota real,","compartida con todos."],p:"Cada aeronave tiene matrícula real, posición, estado técnico y enlace directo a su librea. Reservas y vuelas la misma aeronave que los demás pilotos.",li:["Matrículas reales con los colores de cada aerolínea.","Posición y estado de cada aeronave al instante.","Enlace a la librea en flightsim.to y x-plane.org."]},
 {img:"roster",note:1,k:"Programación automática",h:["Tu programación,","como la de un tripulante."],p:"Genera secuencias con vuelos reales* de las aerolíneas, con presentación, descanso, pernoctas y liberación, respetando los límites de jornada.",li:["Vuelos, horarios y rutas reales* de las aerolíneas.","Fichas de vuelo con indicativo, squawk y nivel.","Acepta la programación y reserva todos los tramos con un toque."]},
 {img:"techlog",k:"Libro técnico",h:["Ningún despegue","sin el libro técnico."],p:"Antes de cada vuelo revisas los ítems abiertos de la aeronave. Después, reportas defectos y sigues el mantenimiento, como en un libro técnico real.",li:["Ítems MEL con plazo y procedimiento operacional.","Registro de defectos por capítulo ATA.","Aeronave en tierra (AOG) hasta que mantenimiento la libere."]},
 {img:"map",k:"Mapa de la flota",h:["Mira la flota","volando ahora."],p:"Sigue dónde está cada aeronave y hacia dónde va. Los vuelos rastreados aparecen en la posición real enviada por el simulador.",li:["Posición en vivo, altitud y velocidad.","Aeropuertos con aeronaves y alertas de mantenimiento.","Horarios en LOCAL y UTC."]},
 {img:"events",k:"Eventos en grupo",h:["Despega","junto a la comunidad."],p:"Organiza vuelos grupales con horario, ruta y frecuencia acordados, y mira quién ya confirmó.",li:["Crea eventos con origen, destino y horario.","Mira los pilotos confirmados y las aeronaves reservadas.","Aviso antes del horario del evento."]},
 {img:"pay",k:"Carrera y salario",h:["Cada hora volada","cuenta en tu carrera."],p:"Sube de rango con tus horas de vuelo y sigue una nómina simulada en la moneda que prefieras.",li:["Rangos que suben con las horas voladas.","Nómina mensual con horas, viáticos y pernoctas.","Ranking de pilotos de la comunidad."]}],
fr:[
 {img:"fleet",k:"Flotte partagée",h:["Une vraie flotte,","partagée avec tous."],p:"Chaque avion a une immatriculation réelle, une position, un état technique et un lien direct vers sa livrée. Vous réservez et pilotez le même avion que les autres pilotes.",li:["Immatriculations réelles aux couleurs de chaque compagnie.","Position et état de chaque avion en temps réel.","Lien vers la livrée sur flightsim.to et x-plane.org."]},
 {img:"roster",note:1,k:"Planning automatique",h:["Votre planning,","comme celui d'un équipage."],p:"Générez des rotations avec de vrais vols* des compagnies, avec présentation, repos, découchers et fin de service, dans les limites de temps de service.",li:["Vols, horaires et routes réels* des compagnies.","Strips de vol avec indicatif, squawk et niveau.","Acceptez le planning et réservez toutes les étapes en un geste."]},
 {img:"techlog",k:"Compte rendu matériel",h:["Aucun décollage","sans le CRM."],p:"Avant chaque vol, vous vérifiez les items ouverts de l'avion. Ensuite, vous signalez les pannes et suivez la maintenance, comme dans un vrai compte rendu matériel.",li:["Items MEL avec échéance et procédure opérationnelle.","Signalement des pannes par chapitre ATA.","Avion au sol (AOG) jusqu'à la remise en service."]},
 {img:"map",k:"Carte de la flotte",h:["Voyez la flotte","voler en ce moment."],p:"Suivez où se trouve chaque avion et où il va. Les vols suivis apparaissent à la position réelle envoyée par le simulateur.",li:["Position en direct, altitude et vitesse.","Aéroports avec avions et alertes de maintenance.","Horaires en LOCAL et UTC."]},
 {img:"events",k:"Événements de groupe",h:["Décollez","avec la communauté."],p:"Organisez des vols de groupe avec horaire, route et fréquence convenus, et voyez qui a déjà confirmé.",li:["Créez des événements avec départ, arrivée et horaire.","Voyez les pilotes confirmés et les avions réservés.","Rappel avant le début de l'événement."]},
 {img:"pay",k:"Carrière et salaire",h:["Chaque heure de vol","compte pour votre carrière."],p:"Montez en grade avec vos heures de vol et suivez une fiche de paie simulée dans la devise de votre choix.",li:["Grades qui évoluent avec les heures de vol.","Fiche de paie mensuelle : heures, indemnités et découchers.","Classement des pilotes de la communauté."]}],
de:[
 {img:"fleet",k:"Gemeinsame Flotte",h:["Eine echte Flotte,","geteilt mit allen."],p:"Jedes Flugzeug hat ein echtes Kennzeichen, eine Position, einen technischen Status und einen direkten Link zur Lackierung. Sie buchen und fliegen dasselbe Flugzeug wie die anderen Piloten.",li:["Echte Kennzeichen in den Farben jeder Airline.","Position und Status jedes Flugzeugs in Echtzeit.","Link zur Lackierung auf flightsim.to und x-plane.org."]},
 {img:"roster",note:1,k:"Automatischer Dienstplan",h:["Ihr Dienstplan,","wie bei einer echten Crew."],p:"Erstellen Sie Umläufe mit echten Airline-Flügen*, inklusive Meldezeit, Ruhezeit, Übernachtungen und Dienstende, innerhalb der Dienstzeitgrenzen.",li:["Echte Flüge*, Zeiten und Routen der Airlines.","Flugstreifen mit Rufzeichen, Squawk und Flugfläche.","Dienstplan annehmen und alle Legs mit einem Tipp buchen."]},
 {img:"techlog",k:"Technisches Bordbuch",h:["Kein Start","ohne Techlog."],p:"Vor jedem Flug prüfen Sie die offenen Punkte des Flugzeugs. Danach melden Sie Mängel und verfolgen die Wartung, wie in einem echten Bordbuch.",li:["MEL-Punkte mit Frist und Betriebsverfahren.","Mängelmeldung nach ATA-Kapitel.","Flugzeug am Boden (AOG) bis zur Freigabe durch die Wartung."]},
 {img:"map",k:"Flottenkarte",h:["Sehen Sie die Flotte","jetzt in der Luft."],p:"Verfolgen Sie, wo jedes Flugzeug ist und wohin es fliegt. Getrackte Flüge erscheinen an der echten Position aus dem Simulator.",li:["Live-Position, Höhe und Geschwindigkeit.","Flughäfen mit Flugzeugen und Wartungshinweisen.","Zeiten in LOCAL und UTC."]},
 {img:"events",k:"Gruppen-Events",h:["Heben Sie ab","mit der Community."],p:"Planen Sie Gruppenflüge mit vereinbarter Zeit, Route und Frequenz und sehen Sie, wer schon zugesagt hat.",li:["Events mit Abflug, Ziel und Uhrzeit erstellen.","Bestätigte Piloten und gebuchte Flugzeuge sehen.","Erinnerung vor Beginn des Events."]},
 {img:"pay",k:"Karriere und Gehalt",h:["Jede Flugstunde","zählt für Ihre Karriere."],p:"Steigen Sie mit Ihren Flugstunden im Rang auf und verfolgen Sie eine simulierte Gehaltsabrechnung in Ihrer Wunschwährung.",li:["Ränge, die mit den Flugstunden steigen.","Monatliche Abrechnung mit Stunden, Spesen und Übernachtungen.","Pilotenranking der Community."]}],
ja:[
 {img:"fleet",k:"共有フリート",h:["本物のフリートを、","みんなで共有。"],p:"各機体には実在の登録記号、現在位置、整備状況、塗装への直接リンクがあります。ほかのパイロットと同じ機体を予約して飛べます。",li:["各航空会社のカラーで表示される実在の登録記号。","全機体の位置と状態をリアルタイムで表示。","flightsim.to と x-plane.org の塗装へのリンク。"]},
 {img:"roster",note:1,k:"自動ロスター",h:["あなたのロスターを、","乗員と同じように。"],p:"実際の航空会社の便*でパターンを作成。出頭、休養、ステイ、解放まで、勤務時間の制限を守って組み立てます。",li:["航空会社の実在便*・時刻・ルート。","コールサイン、スコーク、高度入りのフライトストリップ。","ロスターを承認して全区間をワンタップで予約。"]},
 {img:"techlog",k:"テクニカルログ",h:["テクニカルログなしに","離陸はしない。"],p:"飛行前に機体の未解決項目を確認。飛行後は不具合を報告し、整備の状況を追跡します。本物の航空日誌と同じです。",li:["期限と運用手順付きの MEL 項目。","ATA チャプター別の不具合記録。","整備が完了するまで機体は AOG。"]},
 {img:"map",k:"フリートマップ",h:["いま飛んでいる","フリートを見よう。"],p:"各機体がどこにいて、どこへ向かうかを追跡。トラッキング中の便は、シミュレーターから送られた実際の位置に表示されます。",li:["ライブの位置、高度、速度。","機体と整備アラートのある空港。","LOCAL と UTC の時刻表示。"]},
 {img:"events",k:"グループイベント",h:["コミュニティと","一緒に離陸。"],p:"時刻、ルート、周波数を決めてグループフライトを企画し、参加を確定したパイロットを確認できます。",li:["出発地・目的地・時刻でイベントを作成。","参加パイロットと予約済み機体を確認。","イベント開始前にお知らせ。"]},
 {img:"pay",k:"キャリアと給与",h:["飛んだ1時間が、","キャリアになる。"],p:"飛行時間で昇格し、好きな通貨でシミュレーションの給与明細を確認できます。",li:["飛行時間に応じて上がる階級。","時間、日当、ステイを含む月次明細。","コミュニティのパイロットランキング。"]}],
zh:[
 {img:"fleet",k:"共享机队",h:["真实的机队，","与所有人共享。"],p:"每架飞机都有真实注册号、位置、技术状态和涂装直达链接。你可以和其他飞行员预订并驾驶同一架飞机。",li:["真实注册号，采用各航空公司配色。","实时显示每架飞机的位置和状态。","flightsim.to 和 x-plane.org 涂装链接。"]},
 {img:"roster",note:1,k:"自动排班",h:["你的排班，","和机组人员一样。"],p:"用航空公司的真实航班*生成任务，包含签到、休息、过夜和签退，并遵守执勤时间限制。",li:["航空公司的真实航班*、时刻和航路。","带呼号、应答机代码和高度层的进程单。","接受排班，一键预订所有航段。"]},
 {img:"techlog",k:"技术记录本",h:["没有技术记录本，","就不起飞。"],p:"每次飞行前查看飞机的未关闭项目。飞行后报告故障并跟踪维修，就像真正的技术记录本。",li:["带期限和运行程序的 MEL 项目。","按 ATA 章节记录故障。","维修放行前飞机停场（AOG）。"]},
 {img:"map",k:"机队地图",h:["看看机队","此刻正在飞行。"],p:"跟踪每架飞机的位置和去向。被跟踪的航班显示模拟器发送的真实位置。",li:["实时位置、高度和速度。","显示有飞机和维修提醒的机场。","LOCAL 和 UTC 时间。"]},
 {img:"events",k:"集体活动",h:["与社区","一起起飞。"],p:"安排集体飞行，约定时间、航路和频率，并查看谁已确认参加。",li:["创建包含起点、终点和时间的活动。","查看已确认的飞行员和已预订的飞机。","活动开始前提醒。"]},
 {img:"pay",k:"职业与薪资",h:["每一个飞行小时，","都计入你的职业生涯。"],p:"凭飞行小时晋升，并以你选择的货币查看模拟工资单。",li:["随飞行小时提升的职级。","包含小时、补贴和过夜的月度工资单。","社区飞行员排行榜。"]}],
ko:[
 {img:"fleet",k:"공유 기단",h:["진짜 기단을,","모두와 함께."],p:"모든 항공기에 실제 등록부호, 위치, 정비 상태, 도장 바로가기 링크가 있습니다. 다른 조종사와 같은 항공기를 예약하고 비행하세요.",li:["항공사 색상으로 표시되는 실제 등록부호.","모든 항공기의 위치와 상태를 실시간으로.","flightsim.to와 x-plane.org 도장 링크."]},
 {img:"roster",note:1,k:"자동 스케줄",h:["당신의 스케줄을,","승무원처럼."],p:"항공사의 실제 편*으로 패턴을 생성합니다. 출근, 휴식, 체류, 퇴근까지 근무시간 제한을 지킵니다.",li:["항공사의 실제 편*, 시각, 경로.","호출부호, 스쿼크, 고도가 담긴 비행 스트립.","스케줄을 수락하고 모든 구간을 한 번에 예약."]},
 {img:"techlog",k:"기술일지",h:["기술일지 없이는","이륙도 없다."],p:"비행 전에 항공기의 미해결 항목을 확인하고, 비행 후에는 결함을 보고하고 정비를 추적합니다. 실제 기술일지처럼요.",li:["기한과 운항 절차가 있는 MEL 항목.","ATA 챕터별 결함 기록.","정비가 해제할 때까지 항공기 AOG."]},
 {img:"map",k:"기단 지도",h:["지금 비행 중인","기단을 보세요."],p:"각 항공기가 어디에 있고 어디로 가는지 확인하세요. 추적 중인 비행은 시뮬레이터가 보낸 실제 위치에 표시됩니다.",li:["실시간 위치, 고도, 속도.","항공기와 정비 알림이 있는 공항.","LOCAL 및 UTC 시각."]},
 {img:"events",k:"그룹 이벤트",h:["커뮤니티와","함께 이륙하세요."],p:"시간, 경로, 주파수를 정해 그룹 비행을 잡고, 누가 참가를 확정했는지 확인하세요.",li:["출발지, 도착지, 시간으로 이벤트 생성.","확정된 조종사와 예약된 항공기 확인.","이벤트 시작 전 알림."]},
 {img:"pay",k:"경력과 급여",h:["비행한 한 시간이","경력이 됩니다."],p:"비행시간으로 진급하고, 원하는 통화로 모의 급여명세서를 확인하세요.",li:["비행시간에 따라 오르는 계급.","시간, 일비, 체류가 포함된 월간 명세서.","커뮤니티 조종사 순위."]}],

pt:[
 {img:"fleet",k:"Frota compartilhada",h:["Uma frota real,","dividida com todos."],p:"Cada aeronave tem matrícula de verdade, posição, situação técnica e link direto para a pintura. Você reserva e voa a mesma aeronave que os outros pilotos.",li:["Matrículas reais nas cores de cada companhia.","Posição e situação de cada aeronave na hora.","Link para a pintura no flightsim.to e no x-plane.org."]},
 {img:"roster",note:1,k:"Escala automática",h:["Sua escala,","como a de um tripulante."],p:"Gere sequências com voos reais* das companhias, com apresentação, descanso, pernoites e liberação, respeitando os limites de jornada.",li:["Voos, horários e rotas reais* das companhias.","Strips de voo com callsign, squawk e nível.","Aceite a escala e reserve todas as pernas com um toque."]},
 {img:"techlog",k:"Diário técnico",h:["Nenhuma decolagem","sem o livro técnico."],p:"Antes de cada voo você revisa os itens abertos da aeronave. Depois, reporta defeitos e acompanha a manutenção, como num livro de bordo de verdade.",li:["Itens MEL com prazo e procedimento operacional.","Registro de defeitos por capítulo ATA.","Aeronave no solo (AOG) até a manutenção liberar."]},
 {img:"map",k:"Mapa da frota",h:["Veja a frota","voando agora."],p:"Acompanhe onde cada aeronave está e para onde vai. Os voos rastreados aparecem na posição real enviada pelo simulador.",li:["Posição ao vivo, altitude e velocidade.","Aeroportos com aeronaves e alertas de manutenção.","Horários em LOCAL e UTC."]},
 {img:"events",k:"Eventos em grupo",h:["Decole junto","com a comunidade."],p:"Marque voos coletivos com horário, rota e frequência combinados, e veja quem já confirmou presença.",li:["Crie eventos com origem, destino e horário.","Veja os pilotos confirmados e as aeronaves reservadas.","Aviso antes do horário do evento."]},
 {img:"pay",k:"Carreira e salário",h:["Cada hora voada","conta na sua carreira."],p:"Suba de patente com as horas voadas e acompanhe um contracheque simulado, na moeda que você quiser.",li:["Patentes que sobem com as horas voadas.","Contracheque mensal com horas, diárias e pernoites.","Ranking de pilotos da comunidade."]}]};
function lpShow(){return LP_SHOW[lang]||LP_SHOW.en}
/* prints do app na página inicial: versão noturna quando o site está em NIGHT MODE */
const lpDk=()=>(typeof isDark==="function"&&isDark())?"-d":"";
function lpThemeImgs(){const s=lpDk();document.querySelectorAll("img[data-dk]").forEach(i=>{const u=i.dataset.dk+s+".webp";if(!i.getAttribute("src").endsWith(u))i.src=u})}
function lpCompatIcon(k){const st='fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  if(k==="msfs")return`<svg viewBox="0 0 32 32" ${st}><path d="M3 18l9-3 7-9c1-1.3 3-1 3.2.6.1.7-.1 1.3-.5 1.8L17 15l9 2.5c1 .3 1.4 1.5.7 2.3l-.7.7-11-1-5 4 .5 3-1.5 1-2-4-4-2 1-1.5 3 .5"/></svg>`;
  if(k==="xp")return`<svg viewBox="0 0 32 32" ${st}><path d="M4 25h24"/><path d="M8 25l5-11 4 6 3-4 5 9"/><circle cx="22" cy="8" r="2.5"/></svg>`;
  return`<svg viewBox="0 0 32 32" ${st}><rect x="7" y="4" width="18" height="24" rx="2.5"/><path d="M12 4v3h8V4M11 13h10M11 18h10M11 23h6"/></svg>`}
/* ---------- Termos de Uso e Política de Privacidade (português e inglês; demais idiomas mostram o inglês) ---------- */
const LP_LEGAL_DATE="02/11/2026";
const LP_LEGAL={
 terms:{
  pt:{t:"Termos de Uso",b:[
   ["1. O serviço","O Virtual Flight Report é uma plataforma gratuita de simulação de voo: uma companhia aérea virtual para uso com simuladores de computador (Microsoft Flight Simulator, X-Plane e outros). Todo o conteúdo — reservas, escalas, voos, salários, patentes e diário técnico — é fictício e serve apenas para entretenimento e prática de simulação."],
   ["2. Sem uso real","Nenhuma informação do site deve ser usada para navegação aérea real. Rotas, horários, planos de voo e dados meteorológicos exibidos são referências para simulação e podem estar desatualizados ou incompletos."],
   ["3. Sem vínculo com marcas","O projeto é independente e não tem vínculo com companhias aéreas, fabricantes de aeronaves, desenvolvedores de simuladores ou órgãos de aviação. Nomes, matrículas, pinturas e marcas citados pertencem aos seus respectivos donos e aparecem apenas para identificação."],
   ["4. Conta","Para usar o aplicativo é preciso criar uma conta com e-mail válido. Você é responsável pela sua senha e por tudo o que for feito com a sua conta. Use um nome de exibição respeitoso; nomes ofensivos podem ser alterados ou removidos."],
   ["5. Regras de uso","Ao reservar aeronaves e aceitar escalas, você concorda com as regras do aplicativo, entre elas: só voos rastreados e verificados contam para horas, patente, salário e ranking; é proibido burlar o rastreio (aceleração de tempo, teletransporte, envio de dados falsos etc.); o piloto só pode desistir de uma escala aceita antes do horário do primeiro voo, e um voo não iniciado no prazo cancela também os voos seguintes da escala; há limites de reservas por semana. As regras podem ser ajustadas para manter o equilíbrio entre os pilotos."],
   ["6. Suspensão","Contas que burlarem as regras, prejudicarem outros pilotos ou tentarem comprometer o funcionamento do site podem ter voos invalidados, ser bloqueadas ou excluídas pela administração."],
   ["7. Doações","O uso é gratuito. Contribuições na página Apoie são voluntárias, servem para cobrir custos do projeto e não dão direito a vantagens no aplicativo nem a reembolso."],
   ["8. Disponibilidade","O serviço é oferecido no estado em que se encontra, sem garantia de funcionamento contínuo. Dados podem ser perdidos por falhas técnicas; mantenha cópia (por exemplo, exportando seu logbook) do que considerar importante."],
   ["9. Alterações","Estes termos podem mudar. Mudanças relevantes serão avisadas no aplicativo, e o uso continuado após o aviso significa concordância com a nova versão."],
   ["10. Lei aplicável","Estes termos são regidos pelas leis da República Federativa do Brasil."]]},
  en:{t:"Terms of Use",b:[
   ["1. The service","Virtual Flight Report is a free flight-simulation platform: a virtual airline for use with computer simulators (Microsoft Flight Simulator, X-Plane and others). All content — bookings, rosters, flights, salaries, ranks and tech log — is fictional and intended only for entertainment and simulation practice."],
   ["2. Not for real-world use","No information on this site may be used for real-world air navigation. Routes, times, flight plans and weather shown are simulation references and may be outdated or incomplete."],
   ["3. No affiliation","The project is independent and not affiliated with any airline, aircraft manufacturer, simulator developer or aviation authority. Names, registrations, liveries and trademarks belong to their respective owners and are shown for identification only."],
   ["4. Account","You need an account with a valid e-mail to use the app. You are responsible for your password and everything done with your account. Use a respectful display name; offensive names may be changed or removed."],
   ["5. Rules","By booking aircraft and accepting rosters you agree to the app rules, including: only tracked and verified flights count towards hours, rank, salary and ranking; cheating the tracking (time acceleration, teleporting, fake data, etc.) is forbidden; an accepted roster can only be given up before its first flight, and a flight not started in time also cancels the following flights of the roster; weekly booking limits apply. Rules may be adjusted to keep things fair among pilots."],
   ["6. Suspension","Accounts that break the rules, harm other pilots or try to compromise the site may have flights invalidated, be blocked or deleted by the administrators."],
   ["7. Donations","Use is free. Contributions on the Support page are voluntary, help cover project costs and give no advantage in the app nor right to a refund."],
   ["8. Availability","The service is provided as is, without guarantee of uninterrupted operation. Data may be lost due to technical failures; keep a copy (e.g., by exporting your logbook) of anything you consider important."],
   ["9. Changes","These terms may change. Relevant changes will be announced in the app, and continued use after the notice means you accept the new version."],
   ["10. Governing law","These terms are governed by the laws of the Federative Republic of Brazil."]]}},
 privacy:{
  pt:{t:"Política de Privacidade",b:[
   ["1. Quem trata os dados","O Virtual Flight Report é o responsável pelos dados pessoais tratados no aplicativo, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018 – LGPD)."],
   ["2. Dados coletados","Conta: e-mail, nome de exibição e senha (guardada de forma criptografada pelo provedor de autenticação). Uso do aplicativo: reservas, escalas, voos reportados, defeitos lançados no diário técnico, favoritos e preferências (simuladores, usuário do SimBrief, idioma e tema). Rastreio de voo: durante um voo rastreado, posição, altitude, velocidade e eventos enviados pelo simulador. Dados técnicos: registros básicos de acesso mantidos pelos provedores de hospedagem."],
   ["3. Para que usamos","Para criar e manter sua conta, mostrar a frota compartilhada, reservas e escalas, verificar voos, calcular horas, patente, salário e ranking, prevenir fraudes e manter o serviço funcionando. Não vendemos nem alugamos dados pessoais e não usamos os dados para publicidade."],
   ["4. O que fica visível para outros pilotos","Seu nome de exibição, suas reservas, voos, patente, posição no ranking e, durante um voo rastreado, a posição da aeronave no mapa ao vivo. Seu e-mail não é exibido."],
   ["5. Serviços de terceiros","Hospedagem do banco de dados e autenticação (Supabase) e do site (Cloudflare). Ao abrir certas telas, seu navegador carrega conteúdo diretamente de terceiros, que podem registrar seu endereço IP: fotos de aeronaves (Planespotters.net), logotipos de companhias aéreas, mapas, meteorologia, cotação de moedas e links para SimBrief e SkyVector. Na página inicial, o endereço IP é consultado em um serviço de geolocalização (GeoJS ou ipwho.is) apenas para sugerir o aeroporto mais próximo no cartão de embarque de exemplo e, na Escala, o aeródromo da sua cidade e as companhias do seu país; a localização aproximada fica só no seu navegador por 24 horas e não é enviada ao nosso banco de dados."],
   ["6. Armazenamento no aparelho","O aplicativo guarda no navegador preferências e dados temporários (idioma, tema, layout, escala gerada, cache de fotos e da grade de voos) para funcionar mais rápido e offline. Não usamos cookies de rastreamento ou de publicidade."],
   ["7. Por quanto tempo","Os dados ficam guardados enquanto a conta existir. Ao excluir a conta, os dados pessoais são apagados ou anonimizados, exceto o que for necessário manter por obrigação legal ou para preservar a integridade do histórico compartilhado (por exemplo, o diário técnico das aeronaves)."],
   ["8. Seus direitos","Você pode pedir confirmação do tratamento, acesso, correção, anonimização, portabilidade ou exclusão dos seus dados, além de informações sobre o compartilhamento, pelo contato indicado no rodapé do site."],
   ["9. Segurança","Os dados são protegidos por conexão criptografada (HTTPS) e por regras de acesso no banco de dados que limitam o que cada usuário pode ler e alterar. Nenhum sistema é totalmente imune a falhas; incidentes relevantes serão comunicados."],
   ["10. Alterações","Esta política pode ser atualizada. A data da última atualização aparece no topo."]]},
  en:{t:"Privacy Policy",b:[
   ["1. Controller","Virtual Flight Report is the controller of the personal data processed in the app, under Brazil’s General Data Protection Law (Law 13,709/2018 – LGPD)."],
   ["2. Data we collect","Account: e-mail, display name and password (stored encrypted by the authentication provider). App use: bookings, rosters, reported flights, tech-log defects, favourites and preferences (simulators, SimBrief username, language and theme). Flight tracking: during a tracked flight, position, altitude, speed and events sent by the simulator. Technical data: basic access logs kept by the hosting providers."],
   ["3. Why we use it","To create and keep your account, show the shared fleet, bookings and rosters, verify flights, compute hours, rank, salary and ranking, prevent cheating and keep the service running. We do not sell or rent personal data and do not use it for advertising."],
   ["4. What other pilots see","Your display name, bookings, flights, rank, ranking position and, during a tracked flight, the aircraft position on the live map. Your e-mail is never shown."],
   ["5. Third-party services","Database and authentication hosting (Supabase) and site hosting (Cloudflare). On some screens your browser loads content directly from third parties, which may log your IP address: aircraft photos (Planespotters.net), airline logos, maps, weather, exchange rates and links to SimBrief and SkyVector. On the home page, your IP address is looked up in a geolocation service (GeoJS or ipwho.is) only to suggest the nearest airport on the sample boarding pass and, in the Roster, your city’s airport and your country’s airlines; the approximate location stays in your browser for 24 hours and is not sent to our database."],
   ["6. Storage on your device","The app stores preferences and temporary data in your browser (language, theme, layout, generated roster, photo and schedule cache) to work faster and offline. We use no tracking or advertising cookies."],
   ["7. Retention","Data is kept while the account exists. When the account is deleted, personal data is erased or anonymised, except what must be kept by law or to preserve the integrity of shared history (such as aircraft tech logs)."],
   ["8. Your rights","You may request confirmation of processing, access, correction, anonymisation, portability or deletion of your data, and information about sharing, through the contact shown in the site footer."],
   ["9. Security","Data is protected by encrypted connections (HTTPS) and database access rules that limit what each user can read and change. No system is fully immune to failures; relevant incidents will be reported."],
   ["10. Changes","This policy may be updated. The date of the last update is shown at the top."]]}}};
function lpLegal(kind){const L=LP_LEGAL[kind],d=L[lang==="pt"?"pt":"en"],old=document.querySelector(".lp-modal");if(old)old.remove();
  const m=document.createElement("div");m.className="lp-modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label",d.t);
  m.innerHTML=`<div class="lp-modal-box"><button class="lp-modal-x" data-action="lp-legal-close" aria-label="${esc(t("close"))}">×</button><h2>${esc(d.t)}</h2><p class="lp-modal-date">${t("lp_legal_upd",{d:LP_LEGAL_DATE})}</p>${d.b.map(([h,p])=>`<h3>${esc(h)}</h3><p>${esc(p)}</p>`).join("")}</div>`;
  document.body.appendChild(m);document.body.style.overflow="hidden";m.querySelector(".lp-modal-x").focus()}
function lpLegalClose(){const m=document.querySelector(".lp-modal");if(m){m.remove();document.body.style.overflow=""}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-action]");
  if(e.target.classList&&e.target.classList.contains("lp-modal")){lpLegalClose();return}
  if(!b)return;const a=b.dataset.action;
  if(a==="lp-legal"){e.preventDefault();lpLegal(b.dataset.k);return}
  if(a==="lp-legal-close"){lpLegalClose();return}
  if(a==="lp-jump"){e.preventDefault();const el=document.getElementById(b.dataset.k);if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")lpLegalClose()});

function lpArt(){
  const stars=[[80,60],[210,140],[330,40],[460,110],[610,70],[720,160],[860,50],[980,120],[1120,80],[1260,150],[1380,60],[150,300],[520,260],[1040,300],[1320,330],[900,420],[260,520],[1180,540],[700,600],[60,650]]
    .map(([x,y],i)=>`<circle class="lp-star" style="animation-delay:${(i*0.37)%4}s" cx="${x}" cy="${y}" r="${i%3?1.2:1.8}" fill="#fff" opacity="${i%2?.35:.6}"/>`).join("");
  const ap=[["SBGR",640,730],["SBSV",1250,110],["KJFK",1400,55],["EGLL",1400,420]];
  return`<svg class="lp-art" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="lpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070B14"/><stop offset=".55" stop-color="#0E1A2E"/><stop offset="1" stop-color="#1B2A44"/></linearGradient>
    <radialGradient id="lpSun" cx=".78" cy=".98" r=".6"><stop offset="0" stop-color="var(--lp-acc)" stop-opacity=".55"/><stop offset=".35" stop-color="var(--lp-acc)" stop-opacity=".16"/><stop offset="1" stop-color="var(--lp-acc)" stop-opacity="0"/></radialGradient>
    <linearGradient id="lpBody" x1="-1" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9C4D0"/><stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C2CCD8"/></linearGradient>
    <linearGradient id="lpWing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9EEF3"/><stop offset="1" stop-color="#9FAEBF"/></linearGradient>
    <linearGradient id="lpTrail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="lpRoute" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="var(--lp-acc)" stop-opacity=".1"/><stop offset=".6" stop-color="var(--lp-acc)"/><stop offset="1" stop-color="var(--lp-acc)" stop-opacity=".25"/></linearGradient>
    <pattern id="lpGrid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#fff" stroke-opacity=".05"/></pattern>
    <filter id="lpGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="lpShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <rect width="1440" height="760" fill="url(#lpSky)"/>
  <rect width="1440" height="760" fill="url(#lpGrid)"/>
  <rect width="1440" height="760" fill="url(#lpSun)"/>
  ${stars}
  <g fill="none" stroke-linecap="round">
    <path id="lpR1" class="lp-march" d="M640 730 C720 560 860 480 960 380 S1180 180 1250 110" stroke="url(#lpRoute)" stroke-width="2.5" stroke-dasharray="2 10"/>
    <path class="lp-march" d="M1250 110 Q1330 70 1400 55" stroke="var(--lp-acc)" stroke-opacity=".35" stroke-width="2" stroke-dasharray="2 10"/>
    <path id="lpR2" class="lp-march" d="M1250 110 Q1350 260 1400 420" stroke="#fff" stroke-opacity=".14" stroke-width="1.5" stroke-dasharray="2 10"/>
  </g>
  <g class="lp-mover"><circle r="9" fill="var(--lp-acc)" opacity=".35" filter="url(#lpGlow)"/><path d="M0,-9 L2,-3 L9,1 L9,3 L2,1 L1.5,6 L4,8 L4,9 L0,8 L-4,9 L-4,8 L-1.5,6 L-2,1 L-9,3 L-9,1 L-2,-3Z" fill="#fff" transform="rotate(90)"/>
    <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#lpR1"/></animateMotion></g>
  ${ap.map(([c,x,y])=>`<g transform="translate(${x} ${y})"><circle class="lp-pulse" r="10" fill="none" stroke="var(--lp-acc)"/><circle r="16" fill="var(--lp-acc)" opacity=".18" filter="url(#lpGlow)"/><circle r="5" fill="var(--lp-acc)"/><circle r="11" fill="none" stroke="var(--lp-acc)" stroke-opacity=".45"/><text x="16" y="-12" class="lp-icao">${c}</text></g>`).join("")}
${lpPlaneGroup()}
</svg>`}
function lpFeatIcon(k){const I={
  liv:'<path d="M4 20l6-6m0 0 3-8 7-2-2 7-8 3m0 0-3 3"/><circle cx="17" cy="7" r="1"/>',
  roster:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3M8 17h6"/>',
  log:'<path d="M6 3.5h10l3 3V20a.5.5 0 0 1-.5.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M8 11l2.5 2.5L16 8"/>',
  map:'<path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
  ev:'<circle cx="8" cy="9" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5M13.5 15c2.6-.6 5.3.5 6.5 4"/>',
  pay:'<path d="M12 3v18M16.5 7.5c-.6-1.5-2.4-2.5-4.5-2.5-2.5 0-4.5 1.3-4.5 3.3 0 4.7 9.5 2.2 9.5 7 0 2-2 3.2-4.8 3.2-2.4 0-4.3-1-5-2.8"/>'};
  return`<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`}
/* cartão de embarque no estilo dos reais: canhoto destacável, código de barras e QR */
function lpBars(n,seed){let x=0,o="",r=seed;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647};
  for(let i=0;i<n;i++){const w=1+Math.floor(rnd()*3);if(i%2===0)o+=`<rect x="${x}" width="${w}" height="40"/>`;x+=w}return{w:x,o}}
function lpQR(seed){let r=seed,o="";const rnd=()=>{r=(r*48271)%2147483647;return r/2147483647};
  const fin=(x,y)=>`<path d="M${x} ${y}h7v7h-7zM${x+1} ${y+1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x+2}" y="${y+2}" width="3" height="3"/>`;
  for(let y=0;y<25;y++)for(let x=0;x<25;x++){if((x<8&&y<8)||(x>16&&y<8)||(x<8&&y>16))continue;if(rnd()>.52)o+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
  return`<svg class="bp-qr" viewBox="-1 -1 27 27" aria-hidden="true"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/>${fin(0,0)}${fin(18,0)}${fin(0,18)}${o}</svg>`}
/* cartão de embarque interativo: o visitante troca origem e destino */
let LP_OD={o:{iata:"GRU",icao:"SBGR",city:"São Paulo",lat:-23.436,lon:-46.473},d:{iata:"SSA",icao:"SBSV",city:"Salvador",lat:-12.909,lon:-38.323}};
const LP_OD_TX={pt:["Toque em um aeroporto para mudar a rota","Cidade, aeroporto ou código","Inverter rota","Nenhum aeroporto encontrado","de voo"],
 en:["Tap an airport to change the route","City, airport or code","Swap route","No airport found","flight"],
 es:["Toca un aeropuerto para cambiar la ruta","Ciudad, aeropuerto o código","Invertir ruta","Ningún aeropuerto encontrado","de vuelo"],
 fr:["Touchez un aéroport pour changer la route","Ville, aéroport ou code","Inverser la route","Aucun aéroport trouvé","de vol"],
 de:["Tippen Sie auf einen Flughafen, um die Route zu ändern","Stadt, Flughafen oder Code","Route tauschen","Kein Flughafen gefunden","Flugzeit"],
 ja:["空港をタップしてルートを変更","都市・空港・コード","ルートを入れ替え","空港が見つかりません","飛行"],
 zh:["点击机场即可更改航线","城市、机场或代码","交换航线","未找到机场","飞行"],
 ko:["공항을 눌러 노선을 바꿔 보세요","도시, 공항 또는 코드","노선 바꾸기","공항을 찾을 수 없습니다","비행"]};
const lpOdT=i=>(LP_OD_TX[lang]||LP_OD_TX.en)[i];
function lpOdDist(){const R=3440.065,r=x=>x*Math.PI/180,{o,d}=LP_OD,dl=r(d.lat-o.lat),dn=r(d.lon-o.lon);
  const a=Math.sin(dl/2)**2+Math.cos(r(o.lat))*Math.cos(r(d.lat))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(a)))}
function lpOdInfo(){const nm=lpOdDist(),min=nm<1?0:Math.round(nm/(nm>1500?480:440)*60+22),h=Math.floor(min/60),m=min%60;
  return`${Math.round(nm).toLocaleString(LOCALE[lang])} NM · ${h?h+" h "+String(m).padStart(2,"0"):m+" min"}`}
const lpOdCode=a=>a.iata||a.icao;
/* nomes de cidades em português/espanhol/francês/alemão → nome usado na base (inglês) */
const LP_CITY={"lisboa":"lisbon","lisbonne":"lisbon","lissabon":"lisbon","nova york":"new york","nova iorque":"new york","nueva york":"new york","londres":"london","roma":"rome","madri":"madrid","munique":"munich","munchen":"munich","genebra":"geneva","geneve":"geneva","genf":"geneva","cidade do mexico":"mexico city","ciudad de mexico":"mexico city","pequim":"beijing","pekin":"beijing","toquio":"tokyo","tokio":"tokyo","moscou":"moscow","moscu":"moscow","moskau":"moscow","cidade do cabo":"cape town","joanesburgo":"johannesburg","milao":"milan","milano":"milan","bruxelas":"brussels","bruselas":"brussels","bruxelles":"brussels","zurique":"zurich","viena":"vienna","wien":"vienna","atenas":"athens","athen":"athens","varsovia":"warsaw","praga":"prague","prag":"prague","copenhague":"copenhagen","estocolmo":"stockholm","dublim":"dublin","edimburgo":"edinburgh","filadelfia":"philadelphia","nova orleans":"new orleans","cingapura":"singapore","singapur":"singapore","seul":"seoul","xangai":"shanghai","istambul":"istanbul","estambul":"istanbul","el cairo":"cairo","le caire":"cairo","kairo":"cairo","nova deli":"delhi","nueva delhi":"delhi","bombaim":"mumbai","sydnei":"sydney","florenca":"florence","veneza":"venice","napoles":"naples","sevilha":"seville","barcelona":"barcelona","colonia":"cologne","koln":"cologne","basileia":"basel","amsterda":"amsterdam","haia":"the hague","cidade do panama":"panama city","ciudad de panama":"panama city","havana":"havana","la habana":"havana","assuncao":"asuncion","bogota":"bogota","montevideu":"montevideo","nova jersey":"newark"};
function lpOdSearch(q){const n=norm(q.trim());const al=LP_CITY[n];const a=apSearch(q);if(!al)return a;const b=apSearch(al);return [...b,...a.filter(x=>!b.includes(x))]}
function lpOdSide(k){const a=LP_OD[k];return`<button type="button" class="bp-ap${k==="d"?" r":""}" data-action="lp-od" data-side="${k}" aria-label="${esc(lpOdT(1))}: ${esc(a.city)} (${esc(a.icao)})"><b>${esc(lpOdCode(a))}</b><span>${esc(a.city)}</span><em>${esc(a.icao)}</em></button>`}
function lpOdPaint(flip){const bp=document.querySelector(".bpass");if(!bp)return;
  const od=bp.querySelector(".bp-od");if(!od)return;
  od.querySelectorAll(".bp-ap").forEach(el=>{const k=el.dataset.side;el.outerHTML=lpOdSide(k)});
  if(flip)od.querySelectorAll(flip==="both"?".bp-ap":`.bp-ap[data-side="${flip}"]`).forEach(el=>{el.classList.add("flip");setTimeout(()=>el.classList.remove("flip"),600)});
  const di=bp.querySelector(".bp-dist");if(di)di.textContent=lpOdInfo();
  const st=bp.querySelector(".bp-stub-route");if(st)st.textContent=lpOdCode(LP_OD.o)+" → "+lpOdCode(LP_OD.d);
  const bs=bp.querySelector(".bp-bars");if(bs){const b=lpCode128(`VF${LP_PASS.num} ${lpOdCode(LP_OD.o)}${lpOdCode(LP_OD.d)}`);bs.setAttribute("viewBox",`0 0 ${b.w} 40`);bs.innerHTML=b.o}
  lpQrPaint()}
function lpOdClose(){const s=document.querySelector(".bp-sug");if(s)s.remove();document.querySelectorAll(".bp-ap.edit").forEach(b=>b.classList.remove("edit"))}
function lpOdOpen(btn){lpOdClose();const bp=btn.closest(".bpass"),k=btn.dataset.side;btn.classList.add("edit");
  const box=document.createElement("div");box.className="bp-sug"+(k==="d"?" r":"");
  box.innerHTML=`<input type="text" autocomplete="off" spellcheck="false" maxlength="40" placeholder="${esc(lpOdT(1))}" aria-label="${esc(lpOdT(1))}"><div class="bp-sug-l" role="listbox"></div>`;
  bp.appendChild(box);box.style.bottom=(bp.offsetHeight-btn.offsetTop+6)+"px";
  if(k==="d")box.style.right=(bp.offsetWidth-btn.offsetLeft-btn.offsetWidth)+"px";else box.style.left=btn.offsetLeft+"px";
  const inp=box.querySelector("input"),list=box.querySelector(".bp-sug-l");inp.focus();
  const paint=()=>{if(!AIRPORTS){list.innerHTML=`<span class="bp-sug-m">…</span>`;loadAirports().then(paint);return}
    const q=inp.value.trim();if(!q){list.innerHTML="";return}
    const res=lpOdSearch(q).filter(x=>AIRPORTS[x]).slice(0,6);
    list.innerHTML=res.length?res.map((x,i)=>{const r=AIRPORTS[x];return`<button type="button" class="bp-sug-o${i?"":" on"}" data-icao="${esc(x)}"><b>${esc(r[2]||x)}</b><span>${esc(r[4]||r[3]||"")}<small>${esc(r[3]||"")} · ${esc(x)}</small></span></button>`}).join(""):`<span class="bp-sug-m">${esc(lpOdT(3))}</span>`};
  loadAirports().then(paint);
  inp.addEventListener("input",paint);
  inp.addEventListener("keydown",e=>{const opts=[...list.querySelectorAll(".bp-sug-o")],i=opts.findIndex(o=>o.classList.contains("on"));
    if(e.key==="Escape"){e.stopPropagation();lpOdClose();btn.focus()}
    else if(e.key==="Enter"){e.preventDefault();if(opts[Math.max(0,i)])lpOdPick(k,opts[Math.max(0,i)].dataset.icao)}
    else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!opts.length)return;const n=(i+(e.key==="ArrowDown"?1:-1)+opts.length)%opts.length;opts.forEach((o,j)=>o.classList.toggle("on",j===n))}});
  list.addEventListener("pointerdown",e=>{const o=e.target.closest(".bp-sug-o");if(o){e.preventDefault();lpOdPick(k,o.dataset.icao)}});
  inp.addEventListener("blur",()=>setTimeout(()=>{if(!box.contains(document.activeElement))lpOdClose()},150))}
function lpOdPick(k,icao){const r=AIRPORTS&&AIRPORTS[icao];if(!r)return;LP_OD.touched=true;
  const a={iata:r[2]||"",icao,city:(r[4]||r[3]||icao),lat:r[0],lon:r[1]},other=k==="o"?"d":"o";
  if(LP_OD[other].icao===icao){LP_OD[other]=LP_OD[k];LP_OD[k]=a;lpOdClose();lpOdPaint("both");return}
  LP_OD[k]=a;lpOdClose();lpOdPaint(k)}
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="lp-od"]');if(b){e.preventDefault();lpOdOpen(b);return}
  const sw=e.target.closest('[data-action="lp-swap"]');if(sw){lpOdClose();LP_OD.touched=true;const x=LP_OD.o;LP_OD.o=LP_OD.d;LP_OD.d=x;sw.classList.remove("spin");void sw.offsetWidth;sw.classList.add("spin");lpOdPaint("both");return}
  if(!e.target.closest(".bp-sug"))lpOdClose()});
/* dados do cartão sorteados a cada acesso; embarque = horário do acesso + 45 min */
const LP_PASS=(()=>{
  /* cartão compartilhado pelo QR Code: ?bp=numero.ORIG.DEST.embarque(base36, minutos).portão.assento.grupo */
  try{const q=new URLSearchParams(location.search).get("bp");const p=q&&q.split(".");
    if(p&&p.length===7&&/^\d{3,4}$/.test(p[0])&&/^[A-Z0-9]{4}$/.test(p[1])&&/^[A-Z0-9]{4}$/.test(p[2])){
      const num=+p[0],row=parseInt(p[5])||1;
      return{at:new Date(parseInt(p[3],36)*6e4),num,flt:"VF "+num,gate:p[4].slice(0,4),seat:p[5].slice(0,4),zone:p[6].slice(0,1),seed:num*7919+row,shared:{o:p[1],d:p[2]}}}}catch(e){}
  const R=n=>Math.floor(Math.random()*n),at=new Date(Date.now()+45*6e4),seats="ABCDEF";
  const row=1+R(32),num=100+R(8900);
  return{at,num,flt:"VF "+num,gate:"ABCDEF"[R(6)]+(1+R(30)),seat:row+seats[R(6)],zone:String(row<=4?1:2+R(4)),seed:num*7919+row}})();
/* endereço gravado no QR Code: abre o site com este mesmo cartão e o convite para criar a conta */
function lpPassUrl(){const P=LP_PASS;return`https://flyvfr.com.br/?bp=${P.num}.${LP_OD.o.icao}.${LP_OD.d.icao}.${Math.round(P.at.getTime()/6e4).toString(36)}.${P.gate}.${P.seat}.${P.zone}`}
/* QR Code de verdade (biblioteca qrcode-generator); enquanto carrega, fica o desenho */
let qrLibP=null;
function lpQrLib(){if(window.qrcode)return Promise.resolve();if(qrLibP)return qrLibP;
  qrLibP=new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";s.onload=()=>ok();s.onerror=()=>{qrLibP=null;no()};document.head.appendChild(s)});return qrLibP}
function lpQrPaint(){const box=document.querySelector(".bpass .bp-qr-wrap");if(!box)return;
  lpQrLib().then(()=>{const url=lpPassUrl();if(box.dataset.url===url)return;
    const q=qrcode(0,"M");q.addData(url);q.make();const n=q.getModuleCount();let d="";
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c} ${r}h1v1h-1z`;
    box.innerHTML=`<a href="${esc(url)}" target="_blank" rel="noopener" title="${esc(t("lp_bp_qr"))}"><svg class="bp-qr real" viewBox="-2 -2 ${n+4} ${n+4}" role="img" aria-label="${esc(t("lp_bp_qr"))}"><rect x="-2" y="-2" width="${n+4}" height="${n+4}" fill="#fff"/><path d="${d}"/></svg></a>`;box.dataset.url=url}).catch(()=>{})}
/* código de barras Code 128 (conjunto B) com voo e rota — pode ser lido por leitores e câmeras */
const C128=["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];
function lpCode128(txt){const codes=[104];for(const ch of txt){const v=ch.charCodeAt(0)-32;codes.push(v>=0&&v<95?v:0)}
  let sum=104;for(let i=1;i<codes.length;i++)sum+=codes[i]*i;codes.push(sum%103,106);
  let x=10,o="";for(const c of codes){const p=C128[c];for(let i=0;i<p.length;i++){const w=+p[i];if(i%2===0)o+=`<rect x="${x}" width="${w}" height="40"/>`;x+=w}}
  return{w:x+10,o}}
function lpPass(){
  const P=LP_PASS,d=P.at,day=String(d.getDate()).padStart(2,"0"),mon=new Intl.DateTimeFormat(LOCALE[lang],{month:"short"}).format(d).replace(".","").toUpperCase().slice(0,3);
  const hm=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  const bars=lpCode128(`VF${P.num} ${lpOdCode(LP_OD.o)}${lpOdCode(LP_OD.d)}`);
  const F=(k,v,c="")=>`<div class="bp-f ${c}"><span>${t(k)}</span><b>${v}</b></div>`;
  return`<div class="bpass" role="group" aria-label="${esc(t("lp_card_bp"))}">
    <div class="bp-main">
      <div class="bp-head"><span class="bp-air"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M21 15.5v-1.8l-7.5-4.7V4a1.5 1.5 0 0 0-3 0v5L3 13.7v1.8l7.5-2.3v4.6l-2 1.5V21l3.5-1 3.5 1v-1.7l-2-1.5v-4.6z"/></svg>VIRTUAL FLIGHT</span><span class="bp-title">${t("lp_card_bp")}<i>BOARDING PASS</i></span></div>
      <div class="bp-body">
        <div class="bp-name"><span>${t("lp_bp_name")}</span><b>${t("lp_bp_pax")}</b></div>
        <div class="bp-od">
          ${lpOdSide("o")}
          <button type="button" class="bp-mid" data-action="lp-swap" title="${esc(lpOdT(2))}" aria-label="${esc(lpOdT(2))}"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M21 15.5v-1.8l-7.5-4.7V4a1.5 1.5 0 0 0-3 0v5L3 13.7v1.8l7.5-2.3v4.6l-2 1.5V21l3.5-1 3.5 1v-1.7l-2-1.5v-4.6z"/></svg><small class="bp-dist">${lpOdInfo()}</small></button>
          ${lpOdSide("d")}
        </div>
        <div class="bp-grid">${F("lp_card_flt",P.flt)}${F("lp_bp_date",day+" "+mon)}${F("lp_bp_board",hm)}${F("lp_bp_gate",P.gate,"hi")}${F("lp_bp_seat",P.seat)}${F("lp_bp_zone",P.zone)}</div>
        <div class="bp-foot"><svg class="bp-bars" viewBox="0 0 ${bars.w} 40" preserveAspectRatio="none" role="img" aria-label="VF${P.num}">${bars.o}</svg><span class="bp-closes">${t("lp_bp_closes")}</span></div>
      </div>
      <span class="bp-sheen" aria-hidden="true"></span>
    </div>
    <div class="bp-stub">
      <div class="bp-head"><span class="bp-air sm">VF</span><span class="bp-title sm">${t("lp_bp_stub")}</span></div>
      <div class="bp-stub-body">
        ${F("lp_card_flt",P.flt)}
        <div class="bp-f"><span class="bp-stub-route">${esc(lpOdCode(LP_OD.o)+" → "+lpOdCode(LP_OD.d))}</span><b>${day} ${mon}</b></div>
        ${F("lp_bp_seat",P.seat)}
        <div class="bp-qr-wrap">${lpQR(P.seed)}</div>
      </div>
    </div>
  </div>`}
function lpAnimate(){
  const root=document.querySelector(".lp");if(!root)return;
  const still=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  const els=root.querySelectorAll(".sh-row,.lp-feat,.lp-steps li,.lp-sec h2,.lp-final .lp-in>*");
  els.forEach((el,i)=>{el.classList.add("lp-rv");el.style.transitionDelay=(el.matches(".lp-feat,.lp-steps li")?(i%3)*90:0)+"ms"});
  const nums=root.querySelectorAll(".lp-stats b[data-n]");
  const count=el=>{const n=Number(el.dataset.n),suf=el.dataset.s||"",t0=performance.now(),D=1400;
    const fmt=v=>new Intl.NumberFormat(LOCALE[lang]).format(v)+suf;
    if(still){el.textContent=fmt(n);return}
    const step=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);el.textContent=fmt(Math.round(n*e));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)};
  if(still||!("IntersectionObserver" in window)){els.forEach(e=>e.classList.add("in"));nums.forEach(count);return}
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)return;const el=en.target;io.unobserve(el);
    if(el.matches("b[data-n]"))count(el);else el.classList.add("in")}),{threshold:.15});
  els.forEach(e=>io.observe(e));nums.forEach(e=>io.observe(e));
  setTimeout(()=>nums.forEach(el=>{if(el.textContent.startsWith("0")&&el.getBoundingClientRect().top<innerHeight){io.unobserve(el);count(el)}}),3000);
  /* cartão de embarque: inclina com o mouse */
  const bp=root.querySelector(".bpass");
  if(bp&&matchMedia("(hover:hover) and (min-width:901px)").matches){
    bp.addEventListener("pointermove",e=>{if(bp.querySelector(".bp-sug"))return;const r=bp.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      bp.style.setProperty("--rx",(-y*8).toFixed(2)+"deg");bp.style.setProperty("--ry",(x*10).toFixed(2)+"deg")});
    bp.addEventListener("pointerleave",()=>{bp.style.removeProperty("--rx");bp.style.removeProperty("--ry")})}
  lpGeoInit();
}
/* cartão de embarque personalizado: origem = aeroporto mais próximo de quem visita (localização aproximada pelo IP,
   sem pedir permissão) e destino = rota mais voada a partir dele (malha real RPL/ANAC). Se o visitante estiver
   a mais de 500 km de um aeroporto da malha, ou se a consulta falhar, fica a rota padrão. */
let lpGeoDone=false;
async function lpGeoPos(){
  try{const c=JSON.parse(localStorage.getItem("vfr-geo")||"null");if(c&&Date.now()-c.at<864e5)return c}catch(e){}
  const tm=(p,ms)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error("timeout")),ms))]);
  const srcs=[["https://get.geojs.io/v1/ip/geo.json",j=>({lat:+j.latitude,lon:+j.longitude})],["https://ipwho.is/",j=>({lat:+j.latitude,lon:+j.longitude})]];
  for(const [u,f] of srcs){try{const j=await tm(fetch(u,{cache:"no-store"}).then(r=>r.json()),3500);const p=f(j);
    if(isFinite(p.lat)&&isFinite(p.lon)&&(p.lat||p.lon)){p.at=Date.now();try{localStorage.setItem("vfr-geo",JSON.stringify(p))}catch(e){}return p}}catch(e){}}
  return null}
async function lpGeoInit(){
  if(lpGeoDone)return;lpGeoDone=true;lpQrPaint();
  if(LP_PASS.shared){LP_OD.touched=true;try{await loadAirports();const mk=c=>{const r=AIRPORTS&&AIRPORTS[c];return r?{iata:r[2]||"",icao:c,city:r[4]||r[3]||c,lat:r[0],lon:r[1]}:null};
    const o=mk(LP_PASS.shared.o),d=mk(LP_PASS.shared.d);if(o&&d){LP_OD.o=o;LP_OD.d=d;lpOdPaint("both")}}catch(e){}
    lpSharedBanner();return}
  try{const [pos,od]=await Promise.all([lpGeoPos(),fetch("od-top.json?v=1").then(r=>r.ok?r.json():null).catch(()=>null)]);
    if(!pos||!od||LP_OD.touched)return;
    const R=6371,r=x=>x*Math.PI/180,dist=(a,b,c,d)=>{const h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
    let best=null,bd=Infinity;for(const dep of Object.keys(od.top)){const a=od.a[dep];if(!a)continue;const k=dist(pos.lat,pos.lon,a[0],a[1]);if(k<bd){bd=k;best=dep}}
    if(!best||bd>500)return;
    const mk=c=>{const a=od.a[c];return{iata:a[2]||"",icao:c,city:a[3]||c,lat:a[0],lon:a[1]}};
    const dest=od.top[best];if(!od.a[dest]||dest===best)return;
    LP_OD.o=mk(best);LP_OD.d=mk(dest);lpOdPaint("both")}catch(e){}
}
function paintLanding(){
  const [h1a,h1b]=t("lp_h1").split("|");
  const feats=["liv","roster","log","map","ev","pay"];
  const now=new Date();
  const sel=`<span class="lp-lang" role="group" aria-label="Language">${(typeof LANGS!=="undefined"?LANGS:["en","pt","es","fr","de","ja","zh","ko"]).map(k=>`<button type="button" class="lp-flag${k===lang?" on":""}" data-lpl="${k}" title="${typeof LANG_NAME!=="undefined"?LANG_NAME[k]:k}" aria-label="${typeof LANG_NAME!=="undefined"?LANG_NAME[k]:k}" aria-pressed="${k===lang}"><svg viewBox="0 0 60 40" aria-hidden="true">${typeof FLAG_SVG!=="undefined"?FLAG_SVG[k]:""}</svg></button>`).join("")}</span>`;
  $("#view").innerHTML=`<div class="lp">
  <header class="lp-bar"><div class="lp-in">
    <span class="lp-brand"><img class="lp-brand-ic" src="icons/icon-192.png" alt="" width="40" height="40">Virtual Flight Report</span>
    <span class="lp-bar-r">${sel}<button type="button" class="theme-btn lp-theme" data-theme-btn></button><button class="lp-link" data-action="lp-go" data-m="signin">${t("lp_nav_signin")}</button><button class="lp-btn sm" data-action="lp-go" data-m="signup">${t("lp_nav_signup")}</button></span>
  </div></header>
  <section class="lp-hero">
    ${lpArt()}
    <div class="lp-in lp-hero-in">
      <div class="lp-copy">
        <span class="lp-kicker">${t("lp_kicker")}</span>
        <h1>${esc(h1a)}${h1b?`<em>${esc(h1b)}</em>`:""}</h1>
        <p>${t("lp_sub")}</p>
        <div class="lp-ctas"><button class="lp-btn" data-action="lp-go" data-m="signup">${t("lp_cta")} <span aria-hidden="true">→</span></button><button class="lp-btn ghost" data-action="lp-go" data-m="signin">${t("lp_cta2")}</button>${lpDlOk()?`<button class="lp-btn win" data-action="dl-win"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 19h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>${t("lp_dl_win")}</button>`:""}</div>
      </div>
      <div class="lp-cards">
        <svg class="lp-mart" aria-hidden="true" viewBox="${LP_PX-210} ${LP_PY-170} 420 340">${lpPlaneGroup(false)}</svg>
        ${lpPass()}
        <p class="bp-hint">${esc(lpOdT(0))}</p>
        <div class="lp-card ok" aria-hidden="true"><span class="lp-dot"></span><div><b>PR-XMA</b><span>${t("lp_card_ok")}</span></div></div>
      </div>
    </div>
  </section>
  <section class="lp-stats"><div class="lp-in">
    ${[[5800,"+","lp_s1"],[3200,"+","lp_s2"],[19,"","lp_s3"],[100,"%","lp_s5"]].map(([v,u,k])=>`<div><b data-n="${v}" data-s="${u}">0${u}</b><span>${t(k)}</span></div>`).join("")}
  </div></section>
  <section class="lp-compat" id="lp-compat"><div class="lp-in">
    <span class="lp-compat-k">${t("lp_compat_k")}</span>
    <div class="lp-compat-grid">${[
      ["msfs","Microsoft Flight Simulator","msfs.png","2020 · 2024",t("lp_compat_track")],
      ["xp","X-Plane","xplane.svg","11 · 12",t("lp_compat_track")],
      ["sb","SimBrief","simbrief.png","",t("lp_compat_ofp")]].map(([k,name,img,ver,sub])=>`<div class="cp-card cp-${k}"><span class="cp-logo"><img src="img/sim/${img}" alt="${name}" decoding="async"></span></div>`).join("")}</div>
    <p class="lp-compat-note">${t("lp_compat_note")}</p>
  </div></section>
  <section class="lp-video" id="lp-video"><div class="lp-in">
    <span class="lp-kicker">${t("lp_vid_k")}</span><h2>${t("lp_vid_h")}</h2>
    <div class="lp-vid-frame" data-yt="b0VdfnJbcr0"><img class="lp-vid" src="video/vfr-promo-en.jpg" alt="" width="1920" height="1080" loading="lazy" decoding="async"><button type="button" class="lp-vid-play" data-action="lp-vid-play" aria-label="${esc(t("lp_vid_play"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></button></div>
    <p class="lp-vid-note">${t("lp_vid_note")} · <a class="lp-vid-yt" href="https://www.youtube.com/watch?v=b0VdfnJbcr0" target="_blank" rel="noopener" style="color:var(--lp-acc,#f5c518);font-weight:600;text-decoration:none">▶ ${esc(lpYtWatch())}</a></p>
  </div></section>
  <section class="lp-sec lp-show" id="lp-feat"><div class="lp-in">
    <div class="sh-top"><span class="lp-kicker dark">${t("lp_feat_k")}</span><h2>${t("lp_feat_h")}</h2></div>
    ${lpShow().map((f,i)=>`<article class="sh-row${i%2?" rev":""}">
      <figure class="sh-media"><div class="sh-frame"><img src="img/feat/${LANGS.includes(lang)?lang:"en"}/${f.img}${lpDk()}.webp" data-dk="img/feat/${LANGS.includes(lang)?lang:"en"}/${f.img}" alt="${esc(f.k)}" width="1440" height="900" decoding="async"></div></figure>
      <div class="sh-txt"><span class="sh-k">${esc(f.k)}</span><h3 class="sh-h">${esc(f.h[0])}${/^(ja|zh)$/.test(lang)?"":" "}<em>${esc(f.h[1])}</em></h3><p class="sh-p">${esc(f.p)}</p>
        <ul class="sh-list">${f.li.map(x=>`<li><span class="sh-ck" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span>${esc(x)}</li>`).join("")}</ul>${f.note?`<p class="lp-note">${esc(t("lp_real_note"))}</p>`:""}</div>
    </article>`).join("")}
  </div></section>
  <section class="lp-sec alt" id="lp-how"><div class="lp-in">
    <span class="lp-kicker dark">${t("lp_how_k")}</span>
    <h2>${t("lp_how_h")}</h2>
    <ol class="lp-steps">${[1,2,3].map(i=>`<li><span class="lp-num">0${i}</span><h3>${t("lp_st"+i)}</h3><p>${t("lp_st"+i+"_d")}</p><figure class="lp-step-shot"><img src="img/steps/${LANGS.includes(lang)?lang:"en"}/s${i}${lpDk()}.webp" data-dk="img/steps/${LANGS.includes(lang)?lang:"en"}/s${i}" alt="${esc(t("lp_st"+i))}" width="960" height="600" decoding="async" loading="lazy"></figure></li>`).join("")}</ol>
  </div></section>
  <section class="lp-sec lp-faq-sec" id="lp-faq"><div class="lp-in">
    <span class="lp-kicker dark">${t("lp_faq_k")}</span>
    <h2>${t("lp_faq_h")}</h2>
    <div class="lp-faq">${[1,2,3,4,5,6,7,8].map(i=>`<details class="lp-q"${i===1?" open":""}><summary>${t("lp_q"+i)}<span class="lp-q-ic" aria-hidden="true"></span></summary><p>${t("lp_a"+i)}</p></details>`).join("")}</div>
  </div></section>
  <section class="lp-final"><div class="lp-in">
    <div><h2>${t("lp_fin_h")}</h2><p>${t("lp_fin_p")}</p><p class="lp-note">${esc(t("lp_real_note"))}</p></div>
    <button class="lp-btn" data-action="lp-go" data-m="signup">${t("lp_cta")} <span aria-hidden="true">→</span></button>
  </div></section>
  <footer class="lp-foot">
    <div class="lp-in lp-foot-cols">
      <div class="lp-foot-brandcol"><div class="lp-foot-brand"><img class="lp-foot-ic" src="icons/icon-192.png" alt="" width="112" height="112"><span class="lp-foot-name">VIRTUAL FLIGHT<br>REPORT</span></div><p class="lp-foot-about">${t("lp_foot_about")}</p><p class="lp-note">${esc(t("lp_real_note"))}</p></div>
      <nav aria-label="Virtual Flight Report"><h4>Virtual Flight Report</h4>
        <a href="#lp-how" data-action="lp-jump" data-k="lp-how">${t("lp_fl_how")}</a>
        <a href="#lp-feat" data-action="lp-jump" data-k="lp-feat">${t("lp_fl_fleet")}</a>
        <a href="#lp-feat" data-action="lp-jump" data-k="lp-feat">${t("lp_fl_roster")}</a>
        <a href="#lp-feat" data-action="lp-jump" data-k="lp-feat">${t("lp_fl_brief")}</a>
        <a href="#lp-compat" data-action="lp-jump" data-k="lp-compat">${t("lp_fl_track")}</a>
        <a href="#lp-feat" data-action="lp-jump" data-k="lp-feat">${t("lp_fl_career")}</a>
        ${lpDlOk()?`<a href="#" data-action="dl-win">${t("lp_dl_win")}</a>`:""}</nav>
      <nav aria-label="${esc(t("lp_fl_support"))}"><h4>${t("lp_fl_support")}</h4>
        <a href="#lp-faq" data-action="lp-jump" data-k="lp-faq">${t("lp_faq_h")}</a>
        <a href="#" data-action="lp-legal" data-k="terms">${t("lp_fl_terms")}</a>
        <a href="#" data-action="lp-legal" data-k="privacy">${t("lp_fl_privacy")}</a>
        <a href="mailto:contato@flyvfr.com.br" class="lp-mail">contato@flyvfr.com.br</a></nav>
    </div>
    <div class="lp-in lp-foot-bar"><span>© ${now.getFullYear()} Virtual Flight Report</span><span>${t("lp_foot")}</span></div></footer>
</div>`;
  lpAnimate();if(typeof paintThemeBtn==="function")paintThemeBtn()}
document.addEventListener("click",e=>{const el=e.target.closest('[data-action="lp-go"],[data-action="lp-home"]');if(!el)return;
  authMode=el.dataset.action==="lp-home"?"landing":el.dataset.m;authMsg=null;render();window.scrollTo(0,0)});
document.addEventListener("click",e=>{const b=e.target.closest("[data-lpl]");if(!b||b.dataset.lpl===lang)return;const s=$("#lang");if(s){s.value=b.dataset.lpl;s.dispatchEvent(new Event("change",{bubbles:true}))}});

/* quem chegou pelo QR Code de um cartão: aviso no topo com o convite para criar a conta */
function lpSharedBanner(){const bp=document.querySelector(".bpass");if(!bp||document.querySelector(".lp-shared"))return;
  const P=LP_PASS,hm=String(P.at.getHours()).padStart(2,"0")+":"+String(P.at.getMinutes()).padStart(2,"0");
  const el=document.createElement("div");el.className="lp-shared";
  el.innerHTML=`<span>🎫 ${esc(t("lp_bp_shared",{f:P.flt,r:lpOdCode(LP_OD.o)+" → "+lpOdCode(LP_OD.d),t:hm}))}</span><button class="lp-btn sm" data-action="lp-go" data-m="signup">${t("lp_nav_signup")}</button>`;
  bp.parentElement.insertBefore(el,bp);setTimeout(()=>bp.scrollIntoView({behavior:"smooth",block:"center"}),300)}
function lpYtWatch(){return({en:"Watch on YouTube",pt:"Assistir no YouTube",es:"Ver en YouTube",fr:"Regarder sur YouTube",de:"Auf YouTube ansehen",ja:"YouTubeで見る",zh:"在 YouTube 上观看",ko:"YouTube에서 보기"})[lang]||"Watch on YouTube"}
document.addEventListener("click",e=>{const b=e.target.closest('[data-action="lp-vid-play"]');if(!b)return;const f=b.closest(".lp-vid-frame"),id=f&&f.dataset.yt;if(!id)return;if(!/^https?:$/.test(location.protocol)){window.open("https://www.youtube.com/watch?v="+id,"_blank","noopener");return}const fr=document.createElement("iframe");fr.className="lp-vid";fr.src="https://www.youtube.com/embed/"+id+"?autoplay=1&rel=0&playsinline=1&hl="+encodeURIComponent(lang||"en");fr.title="Virtual Flight Report";fr.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";fr.allowFullscreen=true;fr.referrerPolicy="strict-origin-when-cross-origin";fr.style.border="0";f.querySelector("img.lp-vid")?.replaceWith(fr);b.hidden=true});
/* ---------- Atualização da página inicial (nov/2026): companhia favorita, cartões de embarque,
   Sala de briefing e mapa com tráfego online. Ordem dos recursos = jornada do piloto. ---------- */
(()=>{const U={
 en:{fleet:"Your favourite airline colours the whole app.",roster:"Boarding-pass cards and a timeline for each day.",mapP:"Follow where every aircraft is and where it's heading. Tracked flights show the real position sent by the simulator, alongside VATSIM and IVAO traffic.",map1:"VATSIM, IVAO and real (ADS-B) traffic.",map2:"Weather radar and SIGMET areas.",
  b:{img:"briefing",k:"Briefing room",h:["Everything dispatch gives you,","in the crew's order."],p:"Weather, NOTAMs, flight plan, charts and online ATC for your flight, laid out in the same order a real crew checks them.",li:["Decoded METAR and TAF, plus radar and SIGMET.","Only the NOTAMs valid at your flight time.","Charts, flight plan and VATSIM/IVAO controllers online."]}},
 pt:{fleet:"Sua companhia favorita dá as cores ao app inteiro.",roster:"Cartões de embarque e linha do tempo de cada dia.",mapP:"Acompanhe onde cada aeronave está e para onde vai. Os voos rastreados aparecem na posição real enviada pelo simulador, junto com o tráfego VATSIM e IVAO.",map1:"Tráfego VATSIM, IVAO e real (ADS-B).",map2:"Radar meteorológico e áreas SIGMET.",
  b:{img:"briefing",k:"Sala de briefing",h:["Tudo o que o despacho entrega,","na ordem da tripulação."],p:"Meteorologia, NOTAM, plano de voo, cartas e controle online do seu voo, na mesma ordem de conferência de uma tripulação real.",li:["METAR e TAF decodificados, com radar e SIGMET.","Só os NOTAM que valem no horário do seu voo.","Cartas, plano de voo e controladores VATSIM/IVAO online."]}},
 es:{fleet:"Tu aerolínea favorita le da sus colores a toda la app.",roster:"Tarjetas de embarque y línea de tiempo de cada día.",mapP:"Sigue dónde está cada aeronave y hacia dónde va. Los vuelos rastreados aparecen en la posición real enviada por el simulador, junto al tráfico de VATSIM e IVAO.",map1:"Tráfico VATSIM, IVAO y real (ADS-B).",map2:"Radar meteorológico y áreas SIGMET.",
  b:{img:"briefing",k:"Sala de briefing",h:["Todo lo que entrega el despacho,","en el orden de la tripulación."],p:"Meteorología, NOTAM, plan de vuelo, cartas y control en línea de tu vuelo, en el mismo orden en que los revisa una tripulación real.",li:["METAR y TAF decodificados, con radar y SIGMET.","Solo los NOTAM vigentes a la hora de tu vuelo.","Cartas, plan de vuelo y controladores VATSIM/IVAO en línea."]}},
 fr:{fleet:"Votre compagnie favorite donne ses couleurs à toute l’app.",roster:"Cartes d’embarquement et frise de chaque journée.",mapP:"Suivez où se trouve chaque avion et où il va. Les vols suivis apparaissent à la position réelle envoyée par le simulateur, avec le trafic VATSIM et IVAO.",map1:"Trafic VATSIM, IVAO et réel (ADS-B).",map2:"Radar météo et zones SIGMET.",
  b:{img:"briefing",k:"Salle de briefing",h:["Tout ce que fournit le dispatch,","dans l’ordre de l’équipage."],p:"Météo, NOTAM, plan de vol, cartes et contrôle en ligne de votre vol, dans l’ordre de vérification d’un vrai équipage.",li:["METAR et TAF décodés, avec radar et SIGMET.","Uniquement les NOTAM valables à l’heure du vol.","Cartes, plan de vol et contrôleurs VATSIM/IVAO en ligne."]}},
 de:{fleet:"Ihre Lieblingsairline färbt die ganze App.",roster:"Bordkarten und eine Zeitleiste für jeden Tag.",mapP:"Verfolgen Sie, wo jedes Flugzeug ist und wohin es fliegt. Getrackte Flüge erscheinen an der echten Position aus dem Simulator, zusammen mit VATSIM- und IVAO-Verkehr.",map1:"VATSIM-, IVAO- und echter Verkehr (ADS-B).",map2:"Wetterradar und SIGMET-Gebiete.",
  b:{img:"briefing",k:"Briefingraum",h:["Alles, was der Dispatch liefert,","in der Reihenfolge der Crew."],p:"Wetter, NOTAMs, Flugplan, Karten und Online-Lotsen für Ihren Flug – in derselben Reihenfolge, in der eine echte Crew sie prüft.",li:["Entschlüsselte METAR und TAF, mit Radar und SIGMET.","Nur die NOTAMs, die zur Flugzeit gelten.","Karten, Flugplan und VATSIM/IVAO-Lotsen online."]}},
 ja:{fleet:"お気に入りの航空会社の色がアプリ全体に。",roster:"毎日の搭乗券カードとタイムライン。",mapP:"各機の現在地と行き先を確認できます。追跡中のフライトは、シミュレーターから送られた実際の位置にVATSIM・IVAOの交通と一緒に表示されます。",map1:"VATSIM・IVAO・実機（ADS-B）の交通。",map2:"気象レーダーとSIGMET区域。",
  b:{img:"briefing",k:"ブリーフィングルーム",h:["ディスパッチの情報をすべて、","乗員の確認順で。"],p:"気象、NOTAM、飛行計画、チャート、オンライン管制を、実際の乗員が確認するのと同じ順番で表示します。",li:["解読済みのMETARとTAF、レーダーとSIGMET。","飛行時刻に有効なNOTAMだけ。","チャート、飛行計画、VATSIM/IVAOのオンライン管制。"]}},
 zh:{fleet:"最喜欢的航空公司配色应用到整个应用。",roster:"每天的登机牌卡片和时间线。",mapP:"随时查看每架飞机的位置和去向。被追踪的航班显示模拟器发送的真实位置，并同时显示 VATSIM 和 IVAO 交通。",map1:"VATSIM、IVAO 和真实（ADS-B）交通。",map2:"气象雷达和 SIGMET 区域。",
  b:{img:"briefing",k:"简报室",h:["签派提供的一切，","按机组的顺序。"],p:"气象、NOTAM、飞行计划、航图和在线管制，按真实机组的检查顺序排列。",li:["解码后的 METAR 和 TAF，以及雷达和 SIGMET。","只显示飞行时段内有效的 NOTAM。","航图、飞行计划和 VATSIM/IVAO 在线管制员。"]}},
 ko:{fleet:"즐겨찾는 항공사 색상이 앱 전체에 적용됩니다.",roster:"하루별 탑승권 카드와 타임라인.",mapP:"각 항공기의 위치와 목적지를 확인하세요. 추적 중인 비행은 시뮬레이터가 보낸 실제 위치에 VATSIM·IVAO 교통과 함께 표시됩니다.",map1:"VATSIM, IVAO 및 실제(ADS-B) 교통.",map2:"기상 레이더와 SIGMET 구역.",
  b:{img:"briefing",k:"브리핑 룸",h:["디스패치가 주는 모든 것,","승무원의 순서대로."],p:"기상, NOTAM, 비행 계획, 차트, 온라인 관제를 실제 승무원이 확인하는 순서대로 보여줍니다.",li:["해독된 METAR와 TAF, 레이더와 SIGMET.","비행 시간에 유효한 NOTAM만.","차트, 비행 계획, VATSIM/IVAO 온라인 관제사."]}}};
 const ORDER=["fleet","roster","briefing","techlog","map","events","pay"];
 for(const lg of Object.keys(U)){const u=U[lg];if(!LP_SHOW[lg])continue;const by={};for(const f of LP_SHOW[lg])by[f.img]=f;
  if(by.fleet)by.fleet.li[1]=u.fleet;if(by.roster)by.roster.li[1]=u.roster;if(by.map){by.map.p=u.mapP;by.map.li[1]=u.map1;by.map.li[2]=u.map2}
  by.briefing=u.b;LP_SHOW[lg]=ORDER.map(k=>by[k]).filter(Boolean)}
 const S={
  lp_sub:["Book aircraft with real registrations and liveries, build airline-style rosters, brief every flight like a real crew and grow your career — from Cadet to Master Captain.","Reserve aeronaves com matrícula e pintura reais, gere escalas como as das companhias aéreas, prepare cada voo na sala de briefing e construa sua carreira — de Cadete a Comandante Master.","Reserva aeronaves con matrícula y librea reales, genera programaciones como las de las aerolíneas, prepara cada vuelo en la sala de briefing y construye tu carrera — de Cadete a Comandante Máster.","Réservez des avions aux immatriculations et livrées réelles, générez des rotations comme en compagnie, préparez chaque vol en salle de briefing et bâtissez votre carrière — de Cadet à Commandant émérite.","Buchen Sie Flugzeuge mit echten Kennzeichen und Bemalungen, erstellen Sie Dienstpläne wie bei Airlines, bereiten Sie jeden Flug im Briefingraum vor und bauen Sie Ihre Karriere aus — vom Kadetten zum Master-Kapitän.","実在の登録記号と塗装の機体を予約し、航空会社のようなスケジュールを作成。ブリーフィングルームで各フライトを準備し、訓練生からマスター機長までキャリアを積み上げましょう。","预订真实注册号和涂装的飞机，生成航空公司式的排班，在简报室准备每次飞行，从学员一路成长为资深机长。","실제 등록부호와 도장의 항공기를 예약하고, 항공사 같은 스케줄을 만들고, 브리핑 룸에서 모든 비행을 준비하며 생도부터 마스터 기장까지 경력을 쌓으세요."],
  lp_st1:["Pick your airline","Escolha sua companhia","Elige tu aerolínea","Choisissez votre compagnie","Airline wählen","航空会社を選ぶ","选择航空公司","항공사 선택"],
  lp_st1_d:["Set your favourite airline: the app takes on its colours and the roster shows its flights.","Defina a companhia favorita: o app ganha as cores dela e a escala já mostra os voos dela.","Define tu aerolínea favorita: la app adopta sus colores y la programación muestra sus vuelos.","Définissez votre compagnie favorite : l’app prend ses couleurs et le planning affiche ses vols.","Legen Sie Ihre Lieblingsairline fest: Die App übernimmt ihre Farben und der Dienstplan zeigt ihre Flüge.","お気に入りの航空会社を設定すると、アプリがその色になり、スケジュールにその便が表示されます。","设置最喜欢的航空公司：应用采用其配色，排班显示其航班。","즐겨찾는 항공사를 설정하면 앱이 그 색상으로 바뀌고 스케줄에 해당 항공편이 표시됩니다."],
  lp_st3:["Brief and fly","Faça o briefing e voe","Briefing y a volar","Briefing et décollage","Briefing und los","ブリーフィングして飛ぶ","简报后起飞","브리핑 후 비행"],
  lp_st3_d:["Check weather, NOTAMs and charts in the briefing room, then fly with live tracking. Your hours count towards your next rank.","Confira tempo, NOTAM e cartas na sala de briefing e voe com rastreio ao vivo. As horas contam para a sua próxima patente.","Revisa meteorología, NOTAM y cartas en la sala de briefing y vuela con rastreo en vivo. Las horas cuentan para tu próximo rango.","Vérifiez météo, NOTAM et cartes en salle de briefing, puis volez avec le suivi en direct. Vos heures comptent pour votre prochain grade.","Prüfen Sie Wetter, NOTAMs und Karten im Briefingraum und fliegen Sie mit Live-Tracking. Ihre Stunden zählen für den nächsten Rang.","ブリーフィングルームで気象・NOTAM・チャートを確認し、ライブ追跡で飛行。飛行時間は次の階級に加算されます。","在简报室查看气象、NOTAM 和航图，然后开启实时追踪飞行。飞行小时计入下一个等级。","브리핑 룸에서 기상, NOTAM, 차트를 확인하고 실시간 추적으로 비행하세요. 비행 시간은 다음 계급에 반영됩니다."],
  lp_a1:["A virtual airline for flight simulators: you book aircraft with real registrations, generate airline-style rosters, prepare each flight in the briefing room and build your career.","Uma companhia aérea virtual para simuladores de voo: você reserva aeronaves com matrícula real, gera escalas como as das companhias, prepara cada voo na sala de briefing e constrói sua carreira.","Una aerolínea virtual para simuladores de vuelo: reservas aeronaves con matrícula real, generas programaciones como las de las aerolíneas, preparas cada vuelo en la sala de briefing y construyes tu carrera.","Une compagnie aérienne virtuelle pour simulateurs de vol : vous réservez des avions aux immatriculations réelles, générez des rotations comme les compagnies, préparez chaque vol en salle de briefing et bâtissez votre carrière.","Eine virtuelle Airline für Flugsimulatoren: Sie buchen Flugzeuge mit echten Kennzeichen, erstellen Dienstpläne wie bei Airlines, bereiten jeden Flug im Briefingraum vor und bauen Ihre Karriere auf.","フライトシミュレーター向けのバーチャル航空会社です。実在の登録記号の機体を予約し、航空会社のようなスケジュールを作成し、ブリーフィングルームで各フライトを準備してキャリアを積み上げます。","面向飞行模拟器的虚拟航空公司：预订真实注册号的飞机，生成航空公司式的排班，在简报室准备每次飞行，并发展你的职业生涯。","비행 시뮬레이터용 가상 항공사입니다. 실제 등록부호의 항공기를 예약하고, 항공사 같은 스케줄을 만들고, 브리핑 룸에서 모든 비행을 준비하며 경력을 쌓습니다."],
  lp_foot_about:["A virtual airline for flight simulators: real fleet, rosters built from real flights*, a full briefing room, live tracking and a whole career, free of charge.","Uma companhia aérea virtual para simuladores de voo: frota real, escalas com voos reais*, sala de briefing completa, rastreio ao vivo e uma carreira inteira, de graça.","Una aerolínea virtual para simuladores de vuelo: flota real, programaciones con vuelos reales*, sala de briefing completa, rastreo en vivo y una carrera entera, gratis.","Une compagnie virtuelle pour simulateurs de vol : flotte réelle, plannings de vols réels*, salle de briefing complète, suivi en direct et carrière complète, gratuitement.","Eine virtuelle Airline für Flugsimulatoren: echte Flotte, Dienstpläne aus echten Flügen*, kompletter Briefingraum, Live-Tracking und eine ganze Karriere – kostenlos.","フライトシミュレーター向けのバーチャル航空会社：実在の機材、実在便*のスケジュール、充実したブリーフィングルーム、ライブ追跡、キャリアのすべてを無料で。","面向飞行模拟器的虚拟航空公司：真实机队、真实航班*排班、完整的简报室、实时追踪和完整的职业生涯，全部免费。","비행 시뮬레이터용 가상 항공사: 실제 기단, 실제 항공편* 스케줄, 완전한 브리핑 룸, 실시간 추적, 경력 전체를 무료로."],
  lp_fl_brief:["Briefing room","Sala de briefing","Sala de briefing","Salle de briefing","Briefingraum","ブリーフィングルーム","简报室","브리핑 룸"]};
 for(const k in S)L[k]=S[k]})();

/* página inicial (nov/2026, parte 2): Frota com filtro de pintura, Escala RPL primeiro e satélite, lembrete antes do voo,
   crachá e ranking de pousos — nos 8 idiomas */
(function(){if(typeof LP_SHOW==="undefined")return;
 const U={
  pt:{fleet:"Na hora de escalar, só as matrículas com pintura para o seu simulador.",roster:"Escala RPL primeiro, com satélite da partida e a pista favorecida pelo vento.",brief:"Lembrete 1 h e 15 min antes da saída.",pay:"Crachá de tripulante e ranking de horas e de pousos."},
  en:{fleet:"When rostering, only registrations with a livery for your simulator.",roster:"RPL roster first, with departure satellite view and the wind-favoured runway.",brief:"Reminder 1 h and 15 min before departure.",pay:"Crew badge and rankings for hours and landings."},
  es:{fleet:"Al programar, solo las matrículas con librea para tu simulador.",roster:"Programación RPL primero, con satélite de la salida y la pista favorecida por el viento.",brief:"Recordatorio 1 h y 15 min antes de la salida.",pay:"Credencial de tripulante y ranking de horas y de aterrizajes."},
  fr:{fleet:"Au moment de planifier, seules les immatriculations avec une livrée pour votre simulateur.",roster:"Planning RPL d’abord, avec vue satellite du départ et la piste favorisée par le vent.",brief:"Rappel 1 h et 15 min avant le départ.",pay:"Badge d’équipage et classements des heures et des atterrissages."},
  de:{fleet:"Beim Einplanen nur Kennzeichen mit Lackierung für Ihren Simulator.",roster:"RPL-Dienstplan zuerst, mit Satellitenbild des Abflugs und windgünstiger Piste.",brief:"Erinnerung 1 Std. und 15 Min. vor dem Abflug.",pay:"Crew-Ausweis und Ranglisten für Stunden und Landungen."},
  ja:{fleet:"スケジュール作成時は、あなたのシミュレーター用の塗装がある機体だけを表示。",roster:"RPLスケジュールを優先。出発地の衛星画像と風に有利な滑走路も表示。",brief:"出発の1時間前と15分前にリマインダー。",pay:"乗務員証と、飛行時間・着陸のランキング。"},
  zh:{fleet:"排班时只显示有你所用模拟器涂装的注册号。",roster:"RPL排班优先，附出发机场卫星图和顺风有利的跑道。",brief:"起飞前1小时和15分钟提醒。",pay:"机组工牌，以及飞行小时和着陆排行。"},
  ko:{fleet:"스케줄을 짤 때 내 시뮬레이터용 도색이 있는 등록부호만 표시.",roster:"RPL 스케줄 우선, 출발 공항 위성 사진과 바람에 유리한 활주로 표시.",brief:"출발 1시간 전과 15분 전 알림.",pay:"승무원증, 그리고 비행시간·착륙 순위."}};
 for(const lg of Object.keys(U)){const L=LP_SHOW[lg];if(!L)continue;const u=U[lg],by={};L.forEach(f=>by[f.img]=f);
  if(by.fleet&&by.fleet.li)by.fleet.li[2]=u.fleet;if(by.roster&&by.roster.li)by.roster.li[1]=u.roster;
  if(by.briefing&&by.briefing.li&&!by.briefing.li.includes(u.brief))by.briefing.li.push(u.brief);if(by.pay&&by.pay.li)by.pay.li[2]=u.pay}
})();
