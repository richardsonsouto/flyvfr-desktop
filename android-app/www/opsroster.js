// Render the existing roster form inside Operations without duplicating its state.
const OPS_ROSTER_UI={stage:'config',roster:null,leg:0};
function opsRosterText(key){
 const labels={
  config:['Configure','Configurar','Configurar','Configurer','Einrichten','設定','配置','설정'],
  extras:['Extras','Complementos','Complementos','Compléments','Zusatzinfos','追加情報','补充信息','추가 정보'],
  review:['Review','Revisar','Revisar','Vérifier','Prüfen','確認','检查','검토']
 };
 return labels[key][LANGS.indexOf(lang)]||labels[key][0];
}
/* rótulos dos passos guiados (empilhados no celular) */
function opsStepText(i){
 const L=[
  ['Where you depart','De onde você parte','Desde dónde sale',"D'où partez-vous",'Startflughafen','出発地','出发地','출발지'],
  ['How to fly','Como voar','Cómo volar','Comment voler','Flugmodus','飛び方','飞行方式','비행 방식'],
  ['Airline & aircraft','Companhia e aeronave','Compañía y aeronave','Compagnie et avion','Airline & Flugzeug','航空会社と機材','航空公司与机型','항공사·기체'],
  ['When to fly','Quando voar','Cuándo volar','Quand voler','Wann fliegen','いつ飛ぶか','何时飞行','비행 시점']
 ];
 return L[i][LANGS.indexOf(lang)]||L[i][0];
}
function opsRosterPaint(){
 const pane=document.querySelector('.op-roster');
 if(!pane||view!=='roster')return;
 const state=OPS_ROSTER_UI;
 if(state.roster!==RS.roster){state.stage=RS.roster?'review':'config';state.leg=0;state.roster=RS.roster}
 pane.querySelector('.rs-screen-head')?.remove();
 pane.querySelector('.ops-roster-tabs')?.remove();   /* abas Configurar/Complementos/Revisar removidas: segue o estado da escala */
 pane.dataset.stage=state.stage;
 /* ao apresentar a escala, um botão volta ao formulário (mantém o que já foi preenchido) */
 let back=pane.querySelector('.ops-roster-back');
 if(RS.roster){
   if(!back){back=document.createElement('button');back.type='button';back.className='btn small ops-roster-back';back.dataset.opsBack='1';pane.prepend(back)}
   const bt=['New schedule','Nova escala','Nuevo horario','Nouveau planning','Neue Flugfolge','新しいスケジュール','新排班','새 스케줄'][LANGS.indexOf(lang)]||'New schedule';
   back.textContent='← '+bt;
 }else if(back){back.remove()}
 let unavailable=pane.querySelector('.ops-roster-unavailable');
 if(!unavailable){unavailable=document.createElement('div');unavailable.className='notice ops-roster-unavailable';pane.prepend(unavailable)}
 unavailable.hidden=!RS.opsNoRpl||!!RS.roster||state.stage!=='config';
 if(!unavailable.hidden){
  const al=typeof opsRosterAirline==='function'?opsRosterAirline():'';
  const messages=[
   `No eligible RPL flights for ${al} from ${RS.dep} in the next 30–90 minutes.`,
   `Nenhum voo RPL elegível da ${al} partindo de ${RS.dep} nos próximos 30–90 minutos.`,
   `No hay vuelos RPL elegibles de ${al} desde ${RS.dep} en los próximos 30–90 minutos.`,
   `Aucun vol RPL admissible de ${al} au départ de ${RS.dep} dans les 30 à 90 prochaines minutes.`,
   `Keine geeigneten RPL-Flüge von ${al} ab ${RS.dep} in den nächsten 30–90 Minuten.`,
   `${RS.dep}発の${al}の適合するRPL便は今後30～90分にありません。`,
   `未来30–90分钟内没有${al}从${RS.dep}出发的符合条件的RPL航班。`,
   `향후 30~90분 내 ${RS.dep} 출발 ${al}의 적격 RPL 항공편이 없습니다.`];
  const change=['Your favorite airline can be changed in Profile.','A companhia favorita pode ser alterada no Perfil.','Puedes cambiar tu compañía favorita en Perfil.','La compagnie favorite peut être modifiée dans le Profil.','Die bevorzugte Fluggesellschaft kann im Profil geändert werden.','お気に入りの航空会社はプロフィールで変更できます。','可在个人资料中更改偏好的航空公司。','프로필에서 선호 항공사를 변경할 수 있습니다.'][LANGS.indexOf(lang)]||'Change your favorite airline in Profile.';
  unavailable.innerHTML=`<span>${esc(messages[LANGS.indexOf(lang)]||messages[0])}</span> <small>${esc(change)}</small>`;
 }
 const form=pane.querySelector('#f-rs');
 if(form){
   let extra=pane.querySelector('.ops-roster-extras');
   if(!extra){extra=document.createElement('div');extra.className='ops-roster-extras';form.append(extra)}
   for(const selector of ['#rs-liveries','#rs-ground','.rs-rules']){
     const node=pane.querySelector(selector);if(node&&node.parentNode!==extra)extra.append(node);
   }
   for(const details of extra.querySelectorAll('details'))details.open=true;
 }
 const output=pane.querySelector('.rs-out'),cards=output?[...output.querySelectorAll('.bpc')]:[];
 state.leg=Math.max(0,Math.min(state.leg,cards.length-1));
 for(const [index,card] of cards.entries())card.hidden=index!==state.leg;
 for(const day of pane.querySelectorAll('.rs-day')){
   day.hidden=!day.querySelector('.bpc:not([hidden])');
   for(const node of day.querySelectorAll('.rs-turn'))node.hidden=true;
 }
 let pages=pane.querySelector('.ops-roster-pages');
 if(!pages){pages=document.createElement('div');pages.className='ops-roster-pages';pane.append(pages)}
 pages.hidden=state.stage!=='review'||!cards.length;
 pages.innerHTML=cards.length?`<button class="btn small" type="button" data-ops-leg="-1" ${!state.leg?'disabled':''}>‹</button><span>${state.leg+1} / ${cards.length}</span><button class="btn small" type="button" data-ops-leg="1" ${state.leg+1===cards.length?'disabled':''}>›</button>`:'';
 let empty=pane.querySelector('.ops-roster-empty');
 if(!empty){empty=document.createElement('p');empty.className='ops-roster-empty';pane.append(empty)}
 empty.hidden=state.stage!=='review'||!!RS.roster;
 empty.textContent=t('rs_gen');
 /* passos guiados: numera os blocos (os eyebrows só aparecem no celular, via CSS) */
 if(state.stage==='config'&&!RS.roster){
  ['.rs-top-moved','.rs-mode-field','.rs-layout-left','.rs-layout-sidebar'].forEach((sel,i)=>{
   const el=pane.querySelector(sel);if(!el)return;const lab=opsStepText(i);
   if(el.dataset.step!==String(i+1)||el.dataset.eyebrow!==lab){el.dataset.step=String(i+1);el.dataset.eyebrow=lab}
  });
 }
}
document.addEventListener('click',event=>{
 if(event.target.closest('[data-action="rs-other"][data-v="1"]'))RS.opsNoRpl=false;
 if(event.target.closest('[data-ops-back]')&&view==='roster'){RS.roster=null;if(typeof rsSave==='function')rsSave();render();return}
 const button=event.target.closest('[data-ops-leg]');
 if(!button||view!=='roster')return;
 OPS_ROSTER_UI.leg+=Number(button.dataset.opsLeg);
 opsRosterPaint();
});
