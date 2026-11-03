/* rosterbreak.js — Escala (nov/2026): voo perdido encerra a escala e desistência antes do primeiro voo.
   Servidor: expire_noshows cancela as pernas seguintes (cancel_reason 'roster_broken');
   abandon_roster(p_roster) cancela a escala inteira até a EOBT do primeiro voo ('abandoned'). */
(function(){
 const S={
  bk_cancel_reserve:["Give up roster","Desistir da escala","Renunciar a la escala","Abandonner le planning","Dienstplan aufgeben","スケジュールを辞退","放弃排班","스케줄 포기"],
  rb_confirm:["Tap again to give up the whole roster","Toque de novo para desistir da escala inteira","Toca de nuevo para renunciar a toda la escala","Touchez à nouveau pour abandonner tout le planning","Erneut tippen, um den ganzen Dienstplan aufzugeben","もう一度タップするとスケジュール全体を辞退します","再点一次放弃整个排班","한 번 더 누르면 스케줄 전체를 포기합니다"],
  rb_done:["Roster given up. The aircraft is free and you can generate a new roster.","Você desistiu da escala. A aeronave foi liberada e você já pode gerar uma nova escala.","Renunciaste a la escala. La aeronave quedó libre y ya puedes generar una nueva.","Planning abandonné. L’avion est libéré et vous pouvez générer un nouveau planning.","Dienstplan aufgegeben. Das Flugzeug ist frei und Sie können einen neuen Dienstplan erstellen.","スケジュールを辞退しました。機体は解放され、新しいスケジュールを作成できます。","已放弃排班。飞机已释放，你可以生成新的排班。","스케줄을 포기했습니다. 항공기가 해제되었고 새 스케줄을 만들 수 있습니다."],
  rb_fail:["The roster has already started and can no longer be given up.","Não é mais possível desistir: a escala já começou.","Ya no es posible renunciar: la escala ya comenzó.","Impossible d’abandonner : le planning a déjà commencé.","Aufgeben nicht mehr möglich: Der Dienstplan hat bereits begonnen.","スケジュールはすでに始まっているため辞退できません。","排班已开始，无法放弃。","스케줄이 이미 시작되어 포기할 수 없습니다."],
  rb_notice:["Because of that, the roster was closed: the {n} following flight(s) were cancelled and the aircraft released. You can generate a new roster.","Por isso a escala foi encerrada: {n} voo(s) seguinte(s) foram cancelados e a aeronave, liberada. Você já pode gerar uma nova escala.","Por eso la escala se cerró: se cancelaron {n} vuelo(s) siguiente(s) y la aeronave quedó libre. Ya puedes generar una nueva escala.","Le planning a donc été clôturé : {n} vol(s) suivant(s) annulé(s) et l’avion libéré. Vous pouvez générer un nouveau planning.","Deshalb wurde der Dienstplan beendet: {n} folgende(r) Flug/Flüge storniert, das Flugzeug ist frei. Sie können einen neuen Dienstplan erstellen.","そのためスケジュールは終了し、後続の {n} 便が取り消され、機体が解放されました。新しいスケジュールを作成できます。","因此排班已结束：后续 {n} 个航班已取消，飞机已释放。你可以生成新的排班。","이에 따라 스케줄이 종료되어 이후 {n}개 비행이 취소되고 항공기가 해제되었습니다. 새 스케줄을 만들 수 있습니다."],
  rs_accept_lock:["Once accepted, the roster can only be given up before the first flight's EOBT. If a flight isn't started within 45 min of the EOBT, it and all the following flights of the roster are cancelled and the aircraft is released.","Depois de aceita, você só pode desistir da escala antes da EOBT do primeiro voo. Se um voo não for iniciado até 45 min após a EOBT, ele e todos os voos seguintes da escala são cancelados e a aeronave é liberada.","Una vez aceptada, solo puedes renunciar a la escala antes de la EOBT del primer vuelo. Si un vuelo no se inicia dentro de los 45 min posteriores a la EOBT, ese vuelo y todos los siguientes se cancelan y la aeronave queda libre.","Une fois accepté, le planning ne peut être abandonné qu’avant l’EOBT du premier vol. Si un vol ne commence pas dans les 45 min suivant l’EOBT, ce vol et tous les suivants sont annulés et l’avion est libéré.","Nach der Annahme können Sie den Dienstplan nur vor der EOBT des ersten Flugs aufgeben. Wird ein Flug nicht innerhalb von 45 Min. nach der EOBT begonnen, werden er und alle folgenden Flüge storniert und das Flugzeug freigegeben.","承認後にスケジュールを辞退できるのは、最初の便のEOBTまでです。EOBTから45分以内に開始されなかった便があると、その便と以降の全便が取り消され、機体が解放されます。","接受后，只能在首个航班的 EOBT 之前放弃排班。若某航班在 EOBT 后 45 分钟内未开始，该航班及排班中之后的所有航班都会取消，飞机随之释放。","수락 후에는 첫 비행의 EOBT 전까지만 스케줄을 포기할 수 있습니다. EOBT 후 45분 안에 시작하지 않은 비행이 있으면 그 비행과 이후의 모든 비행이 취소되고 항공기가 해제됩니다."]};
 S.rs_locked_t=S.rs_accept_lock;
 if(typeof L!=="undefined")for(const k in S)L[k]=S[k];

 /* "Desistir da escala": só no cartão do primeiro voo, antes da EOBT dele e sem nenhum voo concluído */
 const legsOf=r=>data.reservations.filter(x=>x.rosterId===r.rosterId&&x.pilotId===r.pilotId).sort((a,b)=>a.start-b.start||String(a.id).localeCompare(String(b.id)));
 window.bookingCanCancelReserve=function(r){
  if(typeof IS_ADMIN==="function"&&IS_ADMIN())return false;
  if(!r||r.pilotId!==myId||!r.rosterId||!booked(r))return false;
  const legs=legsOf(r);if(legs.some(x=>x.status==="completed"))return false;
  const first=legs.find(x=>booked(x));if(!first||first.id!==r.id)return false;
  return Date.now()<r.start+20*6e4};
 try{bookingCanCancelReserve=window.bookingCanCancelReserve}catch(e){}
 document.addEventListener("click",async e=>{const el=e.target.closest?.(".bk-cancel-reserve");if(!el)return;e.preventDefault();e.stopImmediatePropagation();
  const r=data.reservations.find(x=>x.id===el.dataset.id);if(!r||!bookingCanCancelReserve(r))return;
  if(!el.dataset.armed){el.dataset.armed="1";el.textContent=t("rb_confirm");setTimeout(()=>{if(el.isConnected){delete el.dataset.armed;el.textContent=t("bk_cancel_reserve")}},5000);return}
  el.disabled=true;const {error}=await sb.rpc("abandon_roster",{p_roster:r.rosterId});
  if(error){toast(/VFR_ROSTER_STARTED/.test(error.message||"")?t("rb_fail"):t("t_cancel_fail"));el.disabled=false;return}
  await load("reservations");render();toast(t("rb_done"))},true);

 /* aviso de não comparecimento: diz que as pernas seguintes caíram junto */
 if(typeof noShowNotices==="function"){
  window.noShowNotices=function(){const now=Date.now();
   return data.reservations.filter(r=>r.pilotId===myId&&r.status==="cancelled"&&r.cancelReason==="noshow"&&r.start>now-3*864e5&&!altSeen(r.id,"noshow"))
    .sort((x,y)=>y.start-x.start).map(r=>{const a=acById(r.aircraftId);
     const n=r.rosterId?data.reservations.filter(x=>x.rosterId===r.rosterId&&x.pilotId===myId&&x.status==="cancelled"&&x.cancelReason==="roster_broken"&&x.start>r.start).length:0;
     return`<div class="notice bad alt-notice noshow"><span>⛔ ${t("noshow_notice",{fno:esc(r.flightNo||""),route:`${esc(r.dep)} → ${esc(r.arr)}`,reg:regTag(a,r.aircraftId),eobt:utcHM(r.start+20*6e4)+"Z",dl:utcHM(r.start+65*6e4)+"Z"})}${n?" "+esc(t("rb_notice",{n})):""}</span>
       <button class="btn small" data-action="noshow-ok" data-id="${esc(r.id)}">${t("alt_dismiss")}</button></div>`}).join("")};
  try{noShowNotices=window.noShowNotices}catch(e){}}

 /* Manual (8 idiomas): regra nova na Escala, pergunta frequente e a frase da Programação */
 if(typeof MANUAL==="undefined")return;
 const M8={
  pt:{q:["Escala aceita não pode ser cancelada; os voos não realizados são liberados sozinhos na data do 🔒","Até a EOBT do primeiro voo, toque em <b>Desistir da escala</b> no cartão do primeiro voo (Programação). Depois disso não dá mais; se um voo não for iniciado no prazo, ele e os seguintes são cancelados sozinhos"],
      p:"<p><b>Voo perdido encerra a escala:</b> se um voo não for iniciado até 45 min após a EOBT, ele e todos os voos seguintes da escala são cancelados, porque a aeronave não chegou ao destino. Os voos já realizados continuam valendo, a aeronave é liberada e você já pode gerar uma nova escala. Antes da EOBT do primeiro voo, você também pode <b>desistir da escala</b> pelo cartão do primeiro voo.</p>",
      s:["o cancelamento automático por não comparecimento também libera a etapa seguinte.","se um voo for cancelado por não comparecimento, os voos seguintes da escala são cancelados junto e a aeronave é liberada."]},
  en:{q:["An accepted roster can’t be cancelled; flights not flown are released automatically on the 🔒 date","Until the first flight's EOBT, tap <b>Give up roster</b> on the first flight's card (Schedule). After that it's no longer possible; if a flight isn't started in time, it and the following ones are cancelled automatically"],
      p:"<p><b>A missed flight closes the roster:</b> if a flight isn't started within 45 min of the EOBT, it and all the following flights of the roster are cancelled, because the aircraft never reached the destination. Flights already flown still count, the aircraft is released and you can generate a new roster right away. Before the first flight's EOBT you can also <b>give up the roster</b> from the first flight's card.</p>"},
  es:{q:["Una escala aceptada no se puede cancelar; los vuelos no realizados se liberan solos en la fecha 🔒","Hasta la EOBT del primer vuelo, toca <b>Renunciar a la escala</b> en la tarjeta del primer vuelo (Programación). Después ya no es posible; si un vuelo no se inicia a tiempo, ese y los siguientes se cancelan solos"],
      p:"<p><b>Un vuelo perdido cierra la escala:</b> si un vuelo no se inicia dentro de los 45 min posteriores a la EOBT, ese vuelo y todos los siguientes de la escala se cancelan, porque la aeronave no llegó al destino. Los vuelos ya realizados siguen contando, la aeronave queda libre y ya puedes generar una nueva escala. Antes de la EOBT del primer vuelo también puedes <b>renunciar a la escala</b> desde la tarjeta del primer vuelo.</p>"},
  fr:{q:["Une rotation acceptée ne peut pas être annulée ; les vols non effectués sont libérés automatiquement à la date 🔒","Jusqu’à l’EOBT du premier vol, touchez <b>Abandonner le planning</b> sur la carte du premier vol (Programme). Ensuite ce n’est plus possible ; si un vol ne commence pas à temps, il est annulé avec les suivants"],
      p:"<p><b>Un vol manqué clôt le planning :</b> si un vol ne commence pas dans les 45 min suivant l’EOBT, ce vol et tous les suivants du planning sont annulés, car l’avion n’est jamais arrivé à destination. Les vols déjà effectués restent comptés, l’avion est libéré et vous pouvez générer un nouveau planning tout de suite. Avant l’EOBT du premier vol, vous pouvez aussi <b>abandonner le planning</b> depuis la carte du premier vol.</p>"},
  de:{q:["Ein angenommener Umlauf kann nicht storniert werden; nicht geflogene Flüge werden am 🔒-Datum automatisch freigegeben","Bis zur EOBT des ersten Flugs tippen Sie auf der Karte des ersten Flugs (Flugplan) auf <b>Dienstplan aufgeben</b>. Danach geht es nicht mehr; wird ein Flug nicht rechtzeitig begonnen, werden er und die folgenden automatisch storniert"],
      p:"<p><b>Ein verpasster Flug beendet den Dienstplan:</b> Wird ein Flug nicht innerhalb von 45 Min. nach der EOBT begonnen, werden er und alle folgenden Flüge des Dienstplans storniert, weil das Flugzeug das Ziel nie erreicht hat. Bereits geflogene Flüge zählen weiter, das Flugzeug wird freigegeben und Sie können sofort einen neuen Dienstplan erstellen. Vor der EOBT des ersten Flugs können Sie den Dienstplan auch über die Karte des ersten Flugs <b>aufgeben</b>.</p>"},
  ja:{q:["承認したロスターはキャンセルできません。飛ばなかった便は 🔒 の日付に自動で解放されます","最初の便のEOBTまでは、スケジュールタブの最初の便のカードで<b>スケジュールを辞退</b>をタップします。それ以降は辞退できず、期限内に開始されなかった便とそれ以降の便は自動で取り消されます"],
      p:"<p><b>便を逃すとスケジュールは終了:</b> EOBTから45分以内に開始されなかった便があると、機体が目的地に着いていないため、その便とスケジュールの以降の全便が取り消されます。実施済みの便はそのまま有効で、機体は解放され、すぐに新しいスケジュールを作成できます。最初の便のEOBTまでは、最初の便のカードから<b>スケジュールを辞退</b>することもできます。</p>"},
  zh:{q:["已接受的排班不能取消;未飞的航班会在 🔒 日期自动释放","在首个航班的 EOBT 之前，在航班计划中首个航班的卡片上点<b>放弃排班</b>。之后无法放弃；若某航班未按时开始，它及之后的航班会自动取消"],
      p:"<p><b>错过航班会结束排班：</b>若某航班在 EOBT 后 45 分钟内未开始，由于飞机未到达目的地，该航班及排班中之后的所有航班都会取消。已完成的航班仍然有效，飞机被释放，你可以立即生成新的排班。在首个航班的 EOBT 之前，也可以从首个航班的卡片<b>放弃排班</b>。</p>"},
  ko:{q:["승인한 스케줄은 취소할 수 없습니다. 비행하지 않은 편은 🔒 날짜에 자동으로 해제됩니다","첫 비행의 EOBT 전까지는 일정 탭의 첫 비행 카드에서 <b>스케줄 포기</b>를 누르세요. 그 이후에는 불가능하며, 제시간에 시작하지 않은 비행과 이후 비행은 자동으로 취소됩니다"],
      p:"<p><b>비행을 놓치면 스케줄이 종료됩니다:</b> EOBT 후 45분 안에 시작하지 않은 비행이 있으면 항공기가 목적지에 도착하지 않았으므로 그 비행과 스케줄의 이후 모든 비행이 취소됩니다. 이미 수행한 비행은 그대로 인정되고, 항공기는 해제되며 바로 새 스케줄을 만들 수 있습니다. 첫 비행의 EOBT 전에는 첫 비행 카드에서 <b>스케줄 포기</b>도 할 수 있습니다.</p>"}};
 for(const k of Object.keys(M8)){const M=MANUAL[k],u=M8[k];if(!M||!M.body||M.rb)continue;let b=M.body;
  b=b.split(u.q[0]).join(u.q[1]);if(u.s)b=b.split(u.s[0]).join(u.s[1]);
  b=b.replace(/(<section id="m-escala">[\s\S]*?)(<\/section>)/,(m,a,c)=>a+u.p+c);
  M.body=b;M.rb=true}
})();
