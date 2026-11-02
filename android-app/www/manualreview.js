/* manualreview.js — A análise de reportes sem rastreio validado passa a fazer parte do texto do Manual
   (seção "Após o pouso: reportar o voo"), nos 8 idiomas, em vez de um quadro solto no topo da página. */
(function(){
 if(typeof MANUAL==="undefined")return;
 const R={
 pt:["Reporte sem rastreio validado: análise",[
  "Sem rastreio validado, o reporte vira uma <b>solicitação para um administrador</b>. Até a aprovação, o voo não é concluído e não concede horas nem recompensas: ele aparece como <b>Em análise</b>.",
  "Explique o voo no campo de justificativa (mínimo de 15 caracteres). Com rastreio validado, a justificativa é opcional.",
  "Se houver um rastreio ativo, encerre-o ou abandone-o antes de reportar ou de iniciar outro voo.",
  "Se você for administrador, o seu reporte precisa ser analisado por <b>outro administrador</b>."]],
 en:["Report without validated tracking: review",[
  "Without validated tracking, the report becomes a <b>claim for an administrator</b>. Until it is approved, the flight is not completed and grants no hours or rewards: it shows as <b>Pending review</b>.",
  "Explain the flight in the reason field (at least 15 characters). With validated tracking, the reason is optional.",
  "If a tracking session is active, finish or abandon it before reporting or starting another flight.",
  "If you are an administrator, your report must be reviewed by <b>another administrator</b>."]],
 es:["Reporte sin seguimiento validado: revisión",[
  "Sin seguimiento validado, el reporte se convierte en una <b>solicitud para un administrador</b>. Hasta la aprobación, el vuelo no se completa ni concede horas o recompensas: aparece como <b>Pendiente</b>.",
  "Explica el vuelo en el campo de justificación (mínimo 15 caracteres). Con seguimiento validado, la justificación es opcional.",
  "Si hay un seguimiento activo, finalízalo o abandónalo antes de reportar o de iniciar otro vuelo.",
  "Si eres administrador, tu reporte debe ser revisado por <b>otro administrador</b>."]],
 fr:["Rapport sans suivi validé : examen",[
  "Sans suivi validé, le rapport devient une <b>demande adressée à un administrateur</b>. Avant l’approbation, le vol n’est pas terminé et ne donne ni heures ni récompenses : il apparaît comme <b>En attente</b>.",
  "Expliquez le vol dans le champ de justification (15 caractères minimum). Avec un suivi validé, la justification est facultative.",
  "Si un suivi est actif, terminez-le ou abandonnez-le avant de faire un rapport ou de commencer un autre vol.",
  "Si vous êtes administrateur, votre rapport doit être examiné par <b>un autre administrateur</b>."]],
 de:["Bericht ohne validiertes Tracking: Prüfung",[
  "Ohne validiertes Tracking wird der Bericht zu einer <b>Anfrage an einen Administrator</b>. Bis zur Freigabe ist der Flug nicht abgeschlossen und bringt weder Stunden noch Belohnungen: Er erscheint als <b>In Prüfung</b>.",
  "Erkläre den Flug im Begründungsfeld (mindestens 15 Zeichen). Mit validiertem Tracking ist die Begründung optional.",
  "Ist ein Tracking aktiv, beende oder verwirf es, bevor du einen Bericht abgibst oder einen anderen Flug beginnst.",
  "Bist du Administrator, muss dein Bericht von <b>einem anderen Administrator</b> geprüft werden."]],
 ja:["検証済みトラッキングのない報告：審査",[
  "検証済みのトラッキングがない場合、報告は<b>管理者への申請</b>になります。承認されるまでフライトは完了せず、飛行時間も報酬も付与されません。表示は<b>審査中</b>です。",
  "理由の欄にフライトの説明を入力してください（15文字以上）。トラッキングが検証済みなら理由は任意です。",
  "トラッキングが進行中の場合は、報告や別のフライトを始める前に終了または破棄してください。",
  "管理者の場合、自分の報告は<b>別の管理者</b>が審査します。"]],
 zh:["没有经验证跟踪的报告：审核",[
  "没有经验证的跟踪时，报告会成为<b>提交给管理员的申请</b>。在批准之前，航班不算完成，也不计飞行小时或奖励，显示为<b>审核中</b>。",
  "请在理由栏中说明这次飞行（至少 15 个字符）。跟踪已验证时，理由可不填。",
  "如果有正在进行的跟踪，请先结束或放弃，再提交报告或开始另一次飞行。",
  "如果你是管理员，你的报告必须由<b>另一位管理员</b>审核。"]],
 ko:["검증된 추적이 없는 보고: 검토",[
  "검증된 추적이 없으면 보고는 <b>관리자에게 보내는 요청</b>이 됩니다. 승인 전까지 비행은 완료되지 않으며 비행 시간이나 보상도 주어지지 않고 <b>검토 중</b>으로 표시됩니다.",
  "사유 칸에 비행을 설명하세요(15자 이상). 추적이 검증되었다면 사유는 선택 사항입니다.",
  "진행 중인 추적이 있으면 보고하거나 다른 비행을 시작하기 전에 종료하거나 포기하세요.",
  "관리자라면 본인의 보고는 <b>다른 관리자</b>가 검토해야 합니다."]]};
 for(const k of Object.keys(R)){const M=MANUAL[k];if(!M||!M.body||M.rvUpdated)continue;const [h,items]=R[k];
  const block=`<h4 id="m-reporte-analise">${h}</h4><ul>${items.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  M.body=M.body.replace(/(<section id="m-reporte">[\s\S]*?)(<\/section>)/,(m,a,c)=>a+block+c);M.rvUpdated=true}
})();
/* Manual: o nome SkyVector aparece como texto simples, sem o ícone do site */
if(typeof decorateSkyVector==="function"){const faSv=decorateSkyVector;decorateSkyVector=function(root){if(typeof view!=="undefined"&&view==="manual")return;return faSv.apply(this,arguments)}}
/* Manual: nomes dos simuladores (X-Plane, MSFS…) também como texto simples, sem ícone */
if(typeof decorateSimulatorNames==="function"){const mrSim=decorateSimulatorNames;decorateSimulatorNames=function(root){if(typeof view!=="undefined"&&view==="manual"&&root&&root.id==="view")return;return mrSim.apply(this,arguments)}}
