/* freelance.js — Perfil do piloto: piloto de companhia ou freelancer (35_perfil_freelancer.sql).
   * Piloto de companhia: voa só a frota das companhias (escala RPL e escala livre).
   * Freelancer: voa só a frota dos freelancers (as aeronaves que ele e os outros freelancers cadastraram),
     não gera escala e reserva "voo livre": uma ou mais pernas em sequência que ele mesmo monta
     (a primeira sai de onde a aeronave está).
   * Rankings separados. Troca de perfil: uma vez a cada 30 dias, sem voos reservados em aberto. */
const FL={mode:null,changedAt:0,loaded:false,supported:false,rank:null,busy:false,err:""};
const FL_T={
 fl_airline:["Airline pilot","Piloto de companhia","Piloto de aerolínea","Pilote de ligne","Airline-Pilot","エアライン・パイロット","航空公司飞行员","항공사 조종사"],
 fl_free:["Freelancer","Freelancer","Freelancer","Freelance","Freelancer","フリーランス","自由飞行员","프리랜서"],
 fl_airline_d:["Fly the airline fleets with generated rosters (real RPL schedules or free roster).","Voa a frota das companhias com escalas geradas (voos reais RPL ou escala livre).","Vuela la flota de las aerolíneas con escalas generadas (vuelos reales RPL o escala libre).","Volez sur les flottes des compagnies avec des rotations générées (vols réels RPL ou rotation libre).","Fliege die Airline-Flotten mit generierten Umläufen (echte RPL-Flüge oder freier Umlauf).","航空会社の機材を、生成したロスター(実在のRPL便またはフリーロスター)で飛びます。","使用生成的排班(真实 RPL 航班或自由排班)驾驶航空公司机队。","생성된 스케줄(실제 RPL 편 또는 자유 스케줄)로 항공사 기단을 비행합니다."],
 fl_free_d:["Register the aircraft you fly and book free flights — one leg or a whole sequence. The freelancer fleet is shared by all freelancers.","Cadastre a aeronave que você voa e reserve voos livres — uma perna ou uma sequência inteira. A frota dos freelancers é compartilhada entre todos os freelancers.","Registra la aeronave que vuelas y reserva vuelos libres: un tramo o una secuencia entera. La flota de freelancers es compartida por todos los freelancers.","Enregistrez l'avion que vous pilotez et réservez des vols libres : une étape ou toute une séquence. La flotte freelance est partagée entre tous les freelances.","Registriere dein Flugzeug und buche freie Flüge – eine Strecke oder eine ganze Folge. Die Freelancer-Flotte teilen sich alle Freelancer.","自分が飛ばす機体を登録し、フリーフライトを1区間でも連続区間でも予約できます。フリーランスの機材は全フリーランスで共有されます。","登记你驾驶的飞机,预订自由航班——单段或连续多段。自由飞行员机队由所有自由飞行员共享。","직접 비행하는 항공기를 등록하고 자유 비행을 한 구간 또는 연속 구간으로 예약합니다. 프리랜서 기단은 모든 프리랜서가 공유합니다."],
 fl_choose_t:["How will you fly?","Como você vai voar?","¿Cómo vas a volar?","Comment allez-vous voler ?","Wie wirst du fliegen?","どのように飛びますか?","你将如何飞行?","어떻게 비행하시겠어요?"],
 fl_choose_sub:["Choose your pilot profile. You can change it once every 30 days, when you have no booked flights.","Escolha o seu perfil de piloto. Você pode trocar uma vez a cada 30 dias, quando não tiver voos reservados.","Elige tu perfil de piloto. Puedes cambiarlo una vez cada 30 días, cuando no tengas vuelos reservados.","Choisissez votre profil de pilote. Vous pourrez le changer une fois tous les 30 jours, sans vol réservé.","Wähle dein Pilotenprofil. Du kannst es alle 30 Tage einmal ändern, wenn du keine gebuchten Flüge hast.","パイロットのプロフィールを選んでください。予約中の便がなければ30日に1回変更できます。","选择你的飞行员身份。没有已预订航班时,每 30 天可更改一次。","조종사 프로필을 선택하세요. 예약된 비행이 없을 때 30일에 한 번 변경할 수 있습니다."],
 fl_continue:["Continue","Continuar","Continuar","Continuer","Weiter","続ける","继续","계속"],
 fl_mode_req:["Choose a pilot profile.","Escolha um perfil de piloto.","Elige un perfil de piloto.","Choisissez un profil de pilote.","Wähle ein Pilotenprofil.","パイロットのプロフィールを選んでください。","请选择飞行员身份。","조종사 프로필을 선택하세요."],
 fl_profile:["Pilot profile","Perfil do piloto","Perfil del piloto","Profil du pilote","Pilotenprofil","パイロットのプロフィール","飞行员身份","조종사 프로필"],
 fl_change:["Change profile","Trocar perfil","Cambiar perfil","Changer de profil","Profil ändern","プロフィールを変更","更改身份","프로필 변경"],
 fl_change_to:["Switch to {m}","Mudar para {m}","Cambiar a {m}","Passer à {m}","Zu {m} wechseln","{m}に変更","切换为{m}","{m}(으)로 변경"],
 fl_change_rule:["You can change once every 30 days and only with no booked flights. Each profile flies only its own fleet and has its own ranking.","Dá para trocar uma vez a cada 30 dias e só sem voos reservados. Cada perfil voa só a sua frota e tem o seu próprio ranking.","Se puede cambiar una vez cada 30 días y solo sin vuelos reservados. Cada perfil vuela solo su flota y tiene su propio ranking.","Changement possible une fois tous les 30 jours, sans vol réservé. Chaque profil vole uniquement sa flotte et a son propre classement.","Wechsel einmal alle 30 Tage und nur ohne gebuchte Flüge. Jedes Profil fliegt nur seine eigene Flotte und hat ein eigenes Ranking.","変更は30日に1回、予約中の便がない場合のみ可能です。各プロフィールは自分の機材のみを飛び、ランキングも別です。","每 30 天可更改一次,且须无已预订航班。每种身份只驾驶各自的机队,并有各自的排行榜。","30일에 한 번, 예약된 비행이 없을 때만 변경할 수 있습니다. 각 프로필은 자신의 기단만 비행하며 랭킹도 따로입니다."],
 fl_err_recent:["You changed profile recently. Next change from {d}.","Você trocou de perfil recentemente. Próxima troca a partir de {d}.","Cambiaste de perfil recientemente. Próximo cambio a partir del {d}.","Vous avez changé de profil récemment. Prochain changement à partir du {d}.","Du hast dein Profil kürzlich geändert. Nächste Änderung ab {d}.","最近プロフィールを変更しました。次の変更は{d}以降です。","你最近更改过身份。下次可更改时间:{d}。","최근에 프로필을 변경했습니다. 다음 변경은 {d}부터 가능합니다."],
 fl_err_busy:["Cancel or fly your booked flights before changing profile.","Cancele ou voe os seus voos reservados antes de trocar de perfil.","Cancela o vuela tus vuelos reservados antes de cambiar de perfil.","Annulez ou effectuez vos vols réservés avant de changer de profil.","Storniere oder fliege deine gebuchten Flüge, bevor du das Profil änderst.","プロフィールを変更する前に、予約中の便を飛ぶかキャンセルしてください。","更改身份前,请先完成或取消已预订的航班。","프로필을 변경하기 전에 예약된 비행을 완료하거나 취소하세요."],
 fl_changed:["Profile updated: {m}","Perfil atualizado: {m}","Perfil actualizado: {m}","Profil mis à jour : {m}","Profil aktualisiert: {m}","プロフィールを更新しました: {m}","身份已更新:{m}","프로필이 변경되었습니다: {m}"],
 fl_nav:["Free flight","Voo livre","Vuelo libre","Vol libre","Freier Flug","フリーフライト","自由航班","자유 비행"],
 fl_eyebrow:["Freelancer","Freelancer","Freelancer","Freelance","Freelancer","フリーランス","自由飞行员","프리랜서"],
 fl_title:["Book a free flight","Reservar voo livre","Reservar vuelo libre","Réserver un vol libre","Freien Flug buchen","フリーフライトを予約","预订自由航班","자유 비행 예약"],
 fl_intro:["The first leg departs from where the aircraft is; each next leg departs from where the previous one lands. Choose destinations and departure times.","A primeira perna sai de onde a aeronave está; cada perna seguinte sai de onde a anterior pousa. Escolha os destinos e os horários de partida.","El primer tramo sale de donde está la aeronave; cada tramo siguiente sale de donde aterriza el anterior. Elige destinos y horarios de salida.","La première étape part de l'endroit où se trouve l'avion ; chaque étape suivante part de là où la précédente atterrit. Choisissez destinations et heures de départ.","Die erste Strecke startet dort, wo das Flugzeug steht; jede weitere dort, wo die vorige landet. Wähle Ziele und Abflugzeiten.","最初の区間は機体がいる空港から、次の区間は前の区間の到着地から出発します。目的地と出発時刻を選んでください。","第一段从飞机所在机场出发,之后每段从上一段落地机场出发。请选择目的地和起飞时间。","첫 구간은 항공기가 있는 곳에서, 다음 구간은 이전 구간이 착륙한 곳에서 출발합니다. 목적지와 출발 시각을 선택하세요."],
 fl_ac:["Aircraft (freelancer fleet)","Aeronave (frota freelancer)","Aeronave (flota freelancer)","Avion (flotte freelance)","Flugzeug (Freelancer-Flotte)","機体(フリーランス機材)","飞机(自由飞行员机队)","항공기 (프리랜서 기단)"],
 fl_mine:["mine","minha","mía","le mien","meins","自分の機体","我的","내 항공기"],
 fl_by:["by {p}","de {p}","de {p}","de {p}","von {p}","{p}さん登録","{p} 登记","{p} 등록"],
 fl_dep:["Origin","Origem","Origen","Départ","Abflug","出発地","出发地","출발지"],
 fl_dep_any:["No flights yet: choose the origin","Ainda sem voos: escolha a origem","Aún sin vuelos: elige el origen","Pas encore de vol : choisissez le départ","Noch keine Flüge: wähle den Abflugort","まだ飛行記録がありません:出発地を選んでください","尚无飞行记录:请选择出发地","아직 비행 기록 없음: 출발지를 선택하세요"],
 fl_dep_fixed:["where the aircraft will be","onde a aeronave estará","donde estará la aeronave","où sera l'avion","wo das Flugzeug sein wird","機体がいる空港","飞机届时所在机场","항공기가 있을 곳"],
 fl_arr:["Destination","Destino","Destino","Destination","Ziel","目的地","目的地","목적지"],
 fl_std:["Departure (your local time)","Partida (seu horário local)","Salida (tu hora local)","Départ (votre heure locale)","Abflug (deine Ortszeit)","出発(現地時刻)","起飞(你的当地时间)","출발 (현지 시각)"],
 fl_fno:["Flight number","Número do voo","Número de vuelo","Numéro de vol","Flugnummer","便名","航班号","편명"],
 fl_sum:["{nm} NM · block {blk} · arrival {sta}","{nm} NM · calço {blk} · chegada {sta}","{nm} NM · calzo {blk} · llegada {sta}","{nm} NM · bloc {blk} · arrivée {sta}","{nm} NM · Block {blk} · Ankunft {sta}","{nm} NM・ブロック {blk}・到着 {sta}","{nm} 海里 · 轮挡 {blk} · 到达 {sta}","{nm} NM · 블록 {blk} · 도착 {sta}"],
 fl_book:["Book free flight","Reservar voo livre","Reservar vuelo libre","Réserver le vol libre","Freien Flug buchen","フリーフライトを予約","预订自由航班","자유 비행 예약"],
 fl_booked:["Free flight booked","Voo livre reservado","Vuelo libre reservado","Vol libre réservé","Freier Flug gebucht","フリーフライトを予約しました","自由航班已预订","자유 비행이 예약되었습니다"],
 fl_err_ap:["Unknown airport: {icao}","Aeroporto desconhecido: {icao}","Aeropuerto desconocido: {icao}","Aéroport inconnu : {icao}","Unbekannter Flughafen: {icao}","不明な空港: {icao}","未知机场:{icao}","알 수 없는 공항: {icao}"],
 fl_err_same:["Origin and destination must be different.","Origem e destino precisam ser diferentes.","Origen y destino deben ser distintos.","Le départ et la destination doivent être différents.","Abflug und Ziel müssen verschieden sein.","出発地と目的地は別の空港にしてください。","出发地和目的地不能相同。","출발지와 목적지는 달라야 합니다."],
 fl_err_range:["{reg} ({type}) reaches about {r} NM; this leg is {nm} NM.","A {reg} ({type}) alcança cerca de {r} NM; esta perna tem {nm} NM.","La {reg} ({type}) alcanza unas {r} NM; este tramo tiene {nm} NM.","Le {reg} ({type}) a un rayon d'environ {r} NM ; cette étape fait {nm} NM.","{reg} ({type}) schafft etwa {r} NM; diese Strecke hat {nm} NM.","{reg}({type})の航続距離は約{r} NM、この区間は{nm} NMです。","{reg}({type})航程约 {r} 海里;本段 {nm} 海里。","{reg}({type})의 항속 거리는 약 {r} NM이며 이 구간은 {nm} NM입니다."],
 fl_err_time:["Choose a departure at least 30 minutes from now.","Escolha uma partida a pelo menos 30 minutos de agora.","Elige una salida al menos 30 minutos desde ahora.","Choisissez un départ dans au moins 30 minutes.","Wähle einen Abflug mindestens 30 Minuten ab jetzt.","出発は今から30分以上先にしてください。","请选择至少 30 分钟后的起飞时间。","지금부터 최소 30분 이후로 출발을 선택하세요."],
 fl_empty_t:["The freelancer fleet is empty","A frota freelancer está vazia","La flota freelancer está vacía","La flotte freelance est vide","Die Freelancer-Flotte ist leer","フリーランス機材がまだありません","自由飞行员机队为空","프리랜서 기단이 비어 있습니다"],
 fl_empty_b:["Register the aircraft you fly (its real registration) to start booking free flights.","Cadastre a aeronave que você voa (com a matrícula real) para começar a reservar voos livres.","Registra la aeronave que vuelas (con su matrícula real) para empezar a reservar vuelos libres.","Enregistrez l'avion que vous pilotez (avec son immatriculation réelle) pour réserver des vols libres.","Registriere dein Flugzeug (mit echter Kennung), um freie Flüge zu buchen.","飛ばす機体を(実在の登録記号で)登録すると、フリーフライトを予約できます。","登记你驾驶的飞机(使用真实注册号)即可开始预订自由航班。","비행하는 항공기를 (실제 등록 번호로) 등록하면 자유 비행을 예약할 수 있습니다."],
 fl_share_t:["This aircraft joins the shared freelancer fleet","Esta aeronave entra na frota compartilhada dos freelancers","Esta aeronave entra en la flota compartida de freelancers","Cet avion rejoint la flotte freelance partagée","Dieses Flugzeug kommt in die gemeinsame Freelancer-Flotte","この機体は共有のフリーランス機材に加わります","这架飞机将加入共享的自由飞行员机队","이 항공기는 공유 프리랜서 기단에 추가됩니다"],
 fl_share_b:["Other freelancers will be able to book and fly it, and you can fly the aircraft they registered. Its position and tech log are shared: the next flight departs from where the last one landed. Airline pilots do not fly the freelancer fleet.","Outros freelancers poderão reservar e voar esta aeronave, e você poderá voar as aeronaves cadastradas por eles. A posição e o diário técnico são compartilhados: o próximo voo sai de onde o último pousou. Pilotos de companhia não voam a frota freelancer.","Otros freelancers podrán reservar y volar esta aeronave, y tú podrás volar las que ellos registraron. La posición y el registro técnico son compartidos: el próximo vuelo sale de donde aterrizó el último. Los pilotos de aerolínea no vuelan la flota freelancer.","D'autres freelances pourront réserver et piloter cet avion, et vous pourrez piloter ceux qu'ils ont enregistrés. La position et le carnet technique sont partagés : le vol suivant part là où le dernier a atterri. Les pilotes de ligne ne volent pas la flotte freelance.","Andere Freelancer können dieses Flugzeug buchen und fliegen, und du kannst ihre registrierten Flugzeuge fliegen. Position und Tech-Log werden geteilt: Der nächste Flug startet dort, wo der letzte gelandet ist. Airline-Piloten fliegen die Freelancer-Flotte nicht.","他のフリーランスもこの機体を予約して飛ぶことができ、あなたも他の人が登録した機体を飛べます。位置とテックログは共有され、次の便は前の便が着陸した空港から出発します。エアライン・パイロットはフリーランス機材を飛びません。","其他自由飞行员可以预订并驾驶这架飞机,你也可以驾驶他们登记的飞机。位置和技术记录共享:下一班从上一班落地的机场出发。航空公司飞行员不驾驶自由飞行员机队。","다른 프리랜서도 이 항공기를 예약하고 비행할 수 있으며, 당신도 그들이 등록한 항공기를 비행할 수 있습니다. 위치와 기술 일지는 공유되며, 다음 비행은 마지막 비행이 착륙한 곳에서 출발합니다. 항공사 조종사는 프리랜서 기단을 비행하지 않습니다."],
 fl_share_ok:["I understand that other freelancers can fly this aircraft and that I can fly theirs.","Entendi que outros freelancers podem voar esta aeronave e que eu posso voar as deles.","Entiendo que otros freelancers pueden volar esta aeronave y que yo puedo volar las suyas.","Je comprends que d'autres freelances peuvent piloter cet avion et que je peux piloter les leurs.","Ich verstehe, dass andere Freelancer dieses Flugzeug fliegen können und ich ihre fliegen kann.","他のフリーランスがこの機体を飛べること、私も他の人の機体を飛べることを理解しました。","我了解其他自由飞行员可以驾驶这架飞机,我也可以驾驶他们的飞机。","다른 프리랜서가 이 항공기를 비행할 수 있고 나도 그들의 항공기를 비행할 수 있음을 이해했습니다."],
 fl_share_req:["Confirm that you understand the aircraft is shared.","Confirme que entendeu que a aeronave é compartilhada.","Confirma que entiendes que la aeronave es compartida.","Confirmez que vous comprenez que l'avion est partagé.","Bestätige, dass das Flugzeug geteilt wird.","機体が共有されることを確認してください。","请确认你了解该飞机为共享。","항공기가 공유된다는 것을 확인하세요."],
 fl_rank_air:["Airline pilots","Pilotos de companhia","Pilotos de aerolínea","Pilotes de ligne","Airline-Piloten","エアライン・パイロット","航空公司飞行员","항공사 조종사"],
 fl_rank_free:["Freelancers","Freelancers","Freelancers","Freelances","Freelancer","フリーランス","自由飞行员","프리랜서"],
 fl_fleet_free:["Freelancer fleet","Frota freelancer","Flota freelancer","Flotte freelance","Freelancer-Flotte","フリーランス機材","自由飞行员机队","프리랜서 기단"],
 fl_err_fleet_f:["Freelancers fly only the freelancer fleet.","Freelancers voam só a frota freelancer.","Los freelancers vuelan solo la flota freelancer.","Les freelances volent uniquement la flotte freelance.","Freelancer fliegen nur die Freelancer-Flotte.","フリーランスはフリーランス機材のみ飛べます。","自由飞行员只能驾驶自由飞行员机队。","프리랜서는 프리랜서 기단만 비행합니다."],
 fl_err_fleet_a:["This aircraft belongs to the freelancer fleet.","Esta aeronave é da frota freelancer.","Esta aeronave es de la flota freelancer.","Cet avion appartient à la flotte freelance.","Dieses Flugzeug gehört zur Freelancer-Flotte.","この機体はフリーランス機材です。","这架飞机属于自由飞行员机队。","이 항공기는 프리랜서 기단입니다."],
 fl_admin_rule:["As an administrator, you can switch profiles at any time. Each profile flies only its own fleet and has its own ranking.","Como administrador, você pode trocar de perfil a qualquer momento. Cada perfil voa só a sua frota e tem o seu próprio ranking.","Como administrador, puedes cambiar de perfil en cualquier momento. Cada perfil vuela solo su flota y tiene su propio ranking.","En tant qu'administrateur, vous pouvez changer de profil à tout moment. Chaque profil vole uniquement sa flotte et a son propre classement.","Als Administrator kannst du das Profil jederzeit wechseln. Jedes Profil fliegt nur seine eigene Flotte und hat ein eigenes Ranking.","管理者はいつでもプロフィールを変更できます。各プロフィールは自分の機材のみを飛び、ランキングも別です。","管理员可随时更改身份。每种身份只驾驶各自的机队,并有各自的排行榜。","관리자는 언제든지 프로필을 변경할 수 있습니다. 각 프로필은 자신의 기단만 비행하며 랭킹도 따로입니다."],
 fl_leg:["Leg {n}","Perna {n}","Tramo {n}","Étape {n}","Strecke {n}","区間 {n}","第 {n} 段","구간 {n}"],
 fl_add_leg:["Add leg","Adicionar perna","Añadir tramo","Ajouter une étape","Strecke hinzufügen","区間を追加","添加航段","구간 추가"],
 fl_del_leg:["Remove leg","Remover perna","Quitar tramo","Supprimer l'étape","Strecke entfernen","区間を削除","删除航段","구간 삭제"],
 fl_book_n:["Book {n} free flights","Reservar {n} voos livres","Reservar {n} vuelos libres","Réserver {n} vols libres","{n} freie Flüge buchen","フリーフライト{n}便を予約","预订 {n} 个自由航班","자유 비행 {n}편 예약"],
 fl_booked_n:["{n} free flights booked","{n} voos livres reservados","{n} vuelos libres reservados","{n} vols libres réservés","{n} freie Flüge gebucht","フリーフライト{n}便を予約しました","已预订 {n} 个自由航班","자유 비행 {n}편이 예약되었습니다"],
 fl_err_one:["Free flights have a single leg.","O voo livre tem uma única perna.","El vuelo libre tiene un solo tramo.","Le vol libre ne comporte qu'une étape.","Ein freier Flug hat nur eine Strecke.","フリーフライトは1区間のみです。","自由航班只有一段。","자유 비행은 한 구간뿐입니다."]
};
const ft=(k,p)=>{const r=FL_T[k];let s=r?(r[LANGS.indexOf(lang)]||r[0]):k;if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
const flIsFree=()=>FL.mode==="freelancer";
const flModeName=m=>ft(m==="freelancer"?"fl_free":"fl_airline");
const flFleetOf=id=>(fleetById[id]&&fleetById[id].fleet)==="freelancer"?"freelancer":"airline";

/* chamado pelo load("profiles") do app.js */
function flOnProfiles(rows){const me=rows.find(p=>p.id===myId)||{};
  FL.supported="pilot_mode" in me;FL.mode=FL.supported?(me.pilot_mode||null):"airline";
  FL.changedAt=me.mode_changed_at?Date.parse(me.mode_changed_at):0;FL.loaded=true;
  if(typeof rebuildFleet==="function"&&loaded.aircraft)rebuildFleet()}

/* cada perfil enxerga só a sua frota (fleetById continua completo para o diário de bordo e o histórico) */
const flRebuildOrig=rebuildFleet;
rebuildFleet=function(){flRebuildOrig();const free=flIsFree();fleet=fleet.filter(a=>(a.fleet==="freelancer")===free)};

/* ---------- Escolha do perfil (cadastro e usuários antigos) ---------- */
function flModeCards(name,cur){return`<div class="fl-modes">${["airline","freelancer"].map(m=>`<label class="fl-mode"><input type="radio" name="${name}" value="${m}" ${cur===m?"checked":""} required><span><strong>${m==="airline"?"✈":"🛩"} ${ft(m==="airline"?"fl_airline":"fl_free")}</strong><small>${ft(m==="airline"?"fl_airline_d":"fl_free_d")}</small></span></label>`).join("")}</div>`}
function flSignupHTML(){return`<fieldset class="fl-field"><legend>${ft("fl_profile")}</legend><span class="hint">${ft("fl_choose_sub")}</span>${flModeCards("au-mode","")}<p class="form-err" id="au-mode-err" hidden></p></fieldset>`}
function flGateHTML(){return`<div class="auth"><form class="auth-card fl-gate" id="f-flmode">
  <div><span class="eyebrow">Virtual Flight Report</span><h2>${ft("fl_choose_t")}</h2></div>
  <p class="muted" style="margin:0">${ft("fl_choose_sub")}</p>${flModeCards("fl-mode","")}
  <p class="form-err" id="fl-err" ${FL.err?"":"hidden"}>${esc(FL.err)}</p>
  <button class="btn primary" type="submit" ${FL.busy?"disabled":""}>${ft("fl_continue")}</button></form></div>`}
function flErrText(e){const m=(e&&e.message)||"";
  if(/VFR_MODE_RECENT/.test(m)){const d=Date.parse(m.split("VFR_MODE_RECENT:")[1]||"");return ft("fl_err_recent",{d:isFinite(d)?dateF(d):"—"})}
  if(/VFR_MODE_BUSY/.test(m))return ft("fl_err_busy");return dbMessage(e)}
async function flSetMode(m){FL.busy=true;FL.err="";
  try{const {error}=await sb.rpc("set_pilot_mode",{p_mode:m});if(error)throw error;
    FL.mode=m;FL.changedAt=Date.now();rebuildFleet();if(typeof RS!=="undefined"){RS.ac="";RS.roster=null}FLV.ac="";closeSheet();toast(ft("fl_changed",{m:flModeName(m)}));return true}
  catch(e){FL.err=flErrText(e);return false}finally{FL.busy=false;render()}}
document.addEventListener("submit",async e=>{if(e.target.id!=="f-flmode")return;e.preventDefault();e.stopImmediatePropagation();
  const m=e.target.querySelector('input[name="fl-mode"]:checked')?.value;if(!m){FL.err=ft("fl_mode_req");return render()}flSetMode(m)},true);

function flSheetMode(){const other=flIsFree()?"airline":"freelancer",adm=typeof IS_ADMIN==="function"&&IS_ADMIN(),next=FL.changedAt?FL.changedAt+30*864e5:0,wait=!adm&&next>Date.now();
  openSheet("form",`${head(ft("fl_profile"),flModeName(FL.mode))}
   <p class="muted" style="margin:0">${adm?ft("fl_admin_rule"):ft("fl_change_rule")}</p>
   ${wait?`<div class="notice">${ft("fl_err_recent",{d:dateF(next)})}</div>`:""}
   <p class="form-err" id="fl-sheet-err" ${FL.err?"":"hidden"}>${esc(FL.err)}</p>
   <div class="row"><button class="btn primary" data-action="fl-set-mode" data-v="${other}" ${wait||FL.busy?"disabled":""}>${ft("fl_change_to",{m:flModeName(other)})}</button><button class="btn" type="button" data-action="close">${t("cancel")}</button></div>`)}

/* Profile exposes the existing mode switch and its server-enforced rules. */
function flProfileModeHTML(){return `<fieldset class="fl-field fl-profile-mode"><legend>${esc(ft('fl_profile'))}</legend>
 <div class="fl-profile-options">${['airline','freelancer'].map(mode=>`<button type="button" class="btn${FL.mode===mode?' primary':''}" data-action="fl-mode" aria-pressed="${FL.mode===mode}" ${FL.mode===mode||FL.busy?'disabled':''}><span aria-hidden="true">${mode==='airline'?'✈':'🛩'}</span> ${esc(flModeName(mode))}</button>`).join('')}</div>
 <p class="hint">${esc(ft(typeof IS_ADMIN==='function'&&IS_ADMIN()?'fl_admin_rule':'fl_change_rule'))}</p></fieldset>`}
if(typeof sheetMySims==='function'){const flProfileSheet=sheetMySims;sheetMySims=function(){
 flProfileSheet.apply(this,arguments);const form=document.getElementById('f-sims');
 if(form&&FL.supported){const field=document.createElement('div');field.innerHTML=flProfileModeHTML();form.prepend(field.firstElementChild)}
}}
document.addEventListener("click",async e=>{const el=e.target.closest('[data-action^="fl-"]');if(!el)return;const a=el.dataset.action;
  if(a==="fl-mode"){FL.err="";flSheetMode()}
  if(a==="fl-set-mode"){const ok=await flSetMode(el.dataset.v);if(!ok)flSheetMode()}
  if(a==="fl-rank"){FL.rank=el.dataset.v;render()}
  if(a==="fl-new-ac"){sheetNewAircraft()}
  if(a==="fl-book"){e.preventDefault();flBook(el)}});

/* ---------- Voo livre (uma ou mais pernas em sequência) ---------- */
const FL_TURN=45*6e4;  /* accept_roster: cada perna começa (std-20) depois do fim da anterior (sta+25) */
const FLV={ac:"",dep:"",legs:[{arr:"",std:0,fno:""}],err:"",busy:false};
const fl5=ms=>Math.ceil(ms/3e5)*3e5;
function flPlan(){const a=acById(FLV.ac);if(!a)return null;const p=rsProfile(a);
  if(!(FLV.legs[0].std>=rsEarliest()))FLV.legs[0].std=rsSoonest();
  const fixed=locAt(a.id,FLV.legs[0].std)||posNow(a.id)||"";let dep=fixed||apResolve(FLV.dep),prev=null;const legs=[];
  for(const L of FLV.legs){if(prev&&!(L.std>=prev.sta+FL_TURN))L.std=fl5(prev.sta+60*6e4);
    const arr=apResolve(L.arr),ok=!!(AIRPORTS&&AIRPORTS[dep]&&AIRPORTS[arr]&&dep!==arr);const nm=ok?Math.round(rsNm(dep,arr)):0,blk=ok?rsBlock(p,nm):0;
    const g={dep,arr,std:L.std,ok,nm,blk,sta:L.std+(ok?blk:0)*6e4,src:L};legs.push(g);prev=g;dep=arr}
  return{a,p,fixed,legs}}
const flSumTxt=g=>g.ok?ft("fl_sum",{nm:g.nm,blk:block(g.blk),sta:fmt(g.sta)}):"";
function flView(){
  if(rosterMenuLocked())return`<div class="panel"><h3>🔒 ${t('rs_locked_title')}</h3><p>${t('rs_locked_body')}</p><button class="btn" data-view="bookings">${t('nav_bookings')}</button></div>`;
  loadRosterAirports().then(()=>{if(view==="roster"&&!flView.ap){flView.ap=1;render()}});
  const bar=`<div class="fl-bar"><span class="chip neutral">🛩 ${ft("fl_free")}</span><button class="linkish" data-action="fl-mode">${ft("fl_change")}</button></div>`;
  const head0=`<div class="sec-head"><div><span class="eyebrow">${ft("fl_eyebrow")}</span><h2>${ft("fl_title")}</h2></div>${bar}</div>`;
  if(!fleet.length)return`${head0}<div class="panel"><h3>${ft("fl_empty_t")}</h3><p class="muted">${ft("fl_empty_b")}</p><button class="btn primary" data-action="fl-new-ac">${t("add_aircraft")}</button></div>`;
  if(!acById(FLV.ac)||flFleetOf(FLV.ac)!=="freelancer"){const pre=typeof RS!=="undefined"&&RS.ac&&flFleetOf(RS.ac)==="freelancer"?RS.ac:"";FLV.ac=pre||(fleet.find(a=>a.owner===myId)||fleet[0]).id}
  const P=flPlan(),a=P.a;if(FLV.genAc!==a.id){FLV.gen=rsFno(a);FLV.genAc=a.id}FLV.legs.forEach(L=>{if(!L.fno)L.fno=FLV.gen({})});
  const opts=fleet.map(x=>{const pos=posNow(x.id);return`<option value="${esc(x.id)}" ${x.id===FLV.ac?"selected":""}>${esc(x.registration)} · ${esc(x.type)}${pos?" · "+esc(pos):""} — ${esc(x.owner===myId?ft("fl_mine"):ft("fl_by",{p:names[x.owner]||t("a_pilot")}))}</option>`}).join("");
  const n=P.legs.length;
  const legs=P.legs.map((g,i)=>`<fieldset class="fl-leg" data-i="${i}"><legend>${ft("fl_leg",{n:i+1})}${n>1?` <button type="button" class="linkish fl-leg-x" data-action="fl-del-leg" data-i="${i}" aria-label="${esc(ft("fl_del_leg"))}">✕</button>`:""}</legend>
   <div class="grid2"><label>${ft("fl_dep")} ${i===0?`<span class="hint">${P.fixed?ft("fl_dep_fixed"):ft("fl_dep_any")}</span>`:""}<input ${i===0?'id="fl-dep"':""} class="up mono" maxlength="4" value="${esc(i===0?(P.fixed||FLV.dep):g.dep)}" ${i>0||P.fixed?"readonly":""} placeholder="SBGR" autocomplete="off"></label>
   <label>${ft("fl_arr")}<input class="up mono fl-arr" data-i="${i}" maxlength="4" value="${esc(g.src.arr)}" placeholder="SBRJ" autocomplete="off" required></label></div>
   <div class="grid2"><label>${ft("fl_std")}<input class="fl-std" data-i="${i}" type="datetime-local" step="300" value="${toLocalInput(g.std)}" min="${toLocalInput(i===0?rsSoonest():P.legs[i-1].sta+FL_TURN)}" required></label>
   <label>${ft("fl_fno")}<input class="up mono fl-fno" data-i="${i}" maxlength="8" value="${esc(g.src.fno)}"></label></div>
   <p class="fl-sum mono" data-i="${i}">${flSumTxt(g)}</p></fieldset>`).join("");
  return`${head0}
  <p class="muted" style="margin:0 0 10px;max-width:72ch">${ft("fl_intro")}</p>
  <form id="f-fl" class="panel fl-form">
   <label>${ft("fl_ac")}<select id="fl-ac">${opts}</select></label>
   ${legs}
   ${n<24?`<button type="button" class="btn small fl-add" data-action="fl-add-leg">＋ ${ft("fl_add_leg")}</button>`:""}
   <p class="form-err" id="fl-err" ${FLV.err?"":"hidden"}>${esc(FLV.err)}</p>
   <div class="row"><button class="btn primary" type="submit" data-action="fl-book" ${FLV.busy||canWrite===false?"disabled":""}>${n>1?ft("fl_book_n",{n}):ft("fl_book")}</button><button class="btn" type="button" data-action="fl-new-ac">${t("add_aircraft")}</button></div>
  </form>`}
function flRead(){const g=id=>document.getElementById(id);if(!g("fl-ac"))return;
  const ac=g("fl-ac").value;if(ac!==FLV.ac){FLV.ac=ac;FLV.legs.forEach(L=>L.fno="")}
  if(g("fl-dep"))FLV.dep=g("fl-dep").value.trim().toUpperCase();
  document.querySelectorAll("#f-fl .fl-arr").forEach(i=>{const L=FLV.legs[+i.dataset.i];if(L)L.arr=i.value.trim().toUpperCase()});
  document.querySelectorAll("#f-fl .fl-std").forEach(i=>{const L=FLV.legs[+i.dataset.i],v=Date.parse(i.value);if(L&&isFinite(v))L.std=v});
  if(ac===FLV.ac)document.querySelectorAll("#f-fl .fl-fno").forEach(i=>{const L=FLV.legs[+i.dataset.i];if(L&&i.value.trim())L.fno=i.value.trim().toUpperCase()})}
document.addEventListener("change",e=>{if(!e.target.closest("#f-fl"))return;flRead();FLV.err="";
  const i=e.target.dataset.i;if(e.target.id==="fl-ac"||e.target.classList.contains("fl-std")||(e.target.classList.contains("fl-arr")&&+i<FLV.legs.length-1)||e.target.id==="fl-dep"){render();return}
  const P=flPlan(),s=document.querySelector(`#f-fl .fl-sum[data-i="${i}"]`);if(P&&s)s.textContent=flSumTxt(P.legs[+i])});
document.addEventListener("click",e=>{const el=e.target.closest('[data-action="fl-add-leg"],[data-action="fl-del-leg"]');if(!el)return;e.preventDefault();flRead();
  if(el.dataset.action==="fl-add-leg"){const P=flPlan(),last=P.legs[P.legs.length-1];FLV.legs.push({arr:"",std:fl5(last.sta+60*6e4),fno:""})}
  else if(FLV.legs.length>1)FLV.legs.splice(+el.dataset.i,1);
  FLV.err="";render();setTimeout(()=>{const x=document.querySelectorAll("#f-fl .fl-arr");const last=x[x.length-1];if(el.dataset.action==="fl-add-leg"&&last){last.focus();last.scrollIntoView&&last.scrollIntoView({block:"center"})}},30)});
document.addEventListener("submit",e=>{if(e.target.id!=="f-fl")return;e.preventDefault();e.stopImmediatePropagation();flBook(e.target.querySelector('button[type="submit"]'))},true);
function flBookErr(e,reg){const m=(e&&e.message)||"";
  if(/VFR_FLEET_FREELANCER/.test(m))return ft("fl_err_fleet_f");if(/VFR_FLEET_AIRLINE/.test(m))return ft("fl_err_fleet_a");return dbMessage(e,reg)}
async function flBook(btn){if(FLV.busy)return;flRead();if(rosterMenuLocked())return showRosterLocked();
  const P=flPlan();if(!P)return;const fail=m=>{FLV.err=m;render()};
  if(FLV.legs[0].std<rsEarliest())return fail(ft("fl_err_time"));
  const legs=[];
  for(let i=0;i<P.legs.length;i++){const g=P.legs[i],pre=P.legs.length>1?ft("fl_leg",{n:i+1})+": ":"";
    if(!AIRPORTS||!AIRPORTS[g.dep])return fail(pre+ft("fl_err_ap",{icao:g.dep||"—"}));
    if(!AIRPORTS[g.arr])return fail(pre+ft("fl_err_ap",{icao:g.arr||"—"}));
    if(g.dep===g.arr)return fail(pre+ft("fl_err_same"));
    if(g.nm>P.p.range)return fail(pre+ft("fl_err_range",{reg:P.a.registration,type:P.a.type,r:P.p.range,nm:g.nm}));
    const fno=normFno(g.src.fno||(FLV.gen?FLV.gen({}):""));if(fno&&!FNO_RE.test(fno))return fail(pre+t("err_fno"));
    legs.push({dep:g.dep,arr:g.arr,start:new Date(g.std-20*6e4).toISOString(),end:new Date(g.sta+25*6e4).toISOString(),flight_no:fno,ferry:false})}
  FLV.busy=true;FLV.err="";if(btn)btn.disabled=true;let res;
  try{res=await sb.rpc("accept_roster",{p_aircraft:P.a.id,p_legs:legs})}catch(error){res={error}}
  FLV.busy=false;const {data:rid,error}=res||{error:new Error("No response")};
  if(error)return fail(flBookErr(error,P.a.registration));
  FLV.legs=[{arr:"",std:0,fno:""}];await load("reservations");if(rid)myAck(String(rid));view="bookings";render();toast(legs.length>1?ft("fl_booked_n",{n:legs.length}):ft("fl_booked"))}

const flViewRosterOrig=viewRoster;
viewRoster=function(){if(!flIsFree())return flViewRosterOrig.apply(this,arguments);return flView()};

/* ---------- Ranking separado ---------- */
const flRankOrig=lbRanking;
lbRanking=function(){const tab=FL.rank||(flIsFree()?"freelancer":"airline"),all=data.flights;
  const seg=`<div class="seg fl-rank-seg" role="tablist">${[["airline","fl_rank_air"],["freelancer","fl_rank_free"]].map(([k,l])=>`<button data-action="fl-rank" data-v="${k}" aria-pressed="${tab===k}">${ft(l)}</button>`).join("")}</div>`;
  data.flights=all.filter(f=>flFleetOf(f.aircraftId)===tab);
  try{return seg+flRankOrig.apply(this,arguments)}finally{data.flights=all}};

/* ---------- Cadastro de aeronave pelo freelancer ---------- */
const flSheetAcOrig=sheetNewAircraft;
sheetNewAircraft=function(){flSheetAcOrig.apply(this,arguments);if(!flIsFree())return;
  const f=document.getElementById("f-ac"),row=f&&f.querySelector(".row");if(!row)return;
  const box=document.createElement("div");box.className="fl-share";
  box.innerHTML=`<div class="notice"><strong>🛩 ${ft("fl_share_t")}</strong><p style="margin:6px 0 0">${ft("fl_share_b")}</p></div>
   <label class="check fl-share-ok"><input type="checkbox" id="ac-share"> <span>${ft("fl_share_ok")}</span></label>`;
  f.insertBefore(box,f.querySelector("#ac-err"))};
const flSubmitAcOrig=submitAircraft;
submitAircraft=async function(form){if(flIsFree()&&!document.getElementById("ac-share")?.checked)return err("#ac-err",ft("fl_share_req"));
  return flSubmitAcOrig.apply(this,arguments)};

/* ---------- Render: perfil obrigatório + menu "Voo livre" ---------- */
const flRenderOrig=render;
render=function(){flRenderOrig.apply(this,arguments);
  if(!session||recovering||booting||!FL.loaded)return;
  if(FL.supported&&!FL.mode){$("#view").innerHTML=flGateHTML();return}
  if(FL.supported&&view==="roster"&&!flIsFree()&&!document.querySelector("#view .fl-bar")){const v=$("#view"),d=document.createElement("div");d.className="fl-bar fl-bar-top";d.innerHTML=`<span class="chip neutral">✈ ${ft("fl_airline")}</span><button class="linkish" data-action="fl-mode">${ft("fl_change")}</button>`;v.insertBefore(d,v.firstChild)}
  if(flIsFree()){if(view==="roster"){const pt=$("#page-title");if(pt)pt.textContent=ft("fl_nav")}const b=document.querySelector('#tabs [data-view="roster"]');if(b){const s=b.querySelector("span");if(s)s.textContent=ft("fl_nav");if(!b.classList.contains("tab-off"))b.title=ft("fl_nav")}}};
