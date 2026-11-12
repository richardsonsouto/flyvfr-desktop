// Render the existing roster form inside Operations without duplicating its state.
const OPS_ROSTER_UI={stage:'config',roster:null,leg:0,step:1,pilot:null,moving:false,rplPageKey:'',rplSelected:'',rplContext:''};
function opsRosterText(key){
 const labels={
  back:['Back','Voltar','Volver','Retour','Zurück','戻る','返回','뒤로'],
  next:['Continue','Continuar','Continuar','Continuer','Weiter','続ける','继续','계속'],
  step:['Step','Etapa','Etapa','Étape','Schritt','ステップ','步骤','단계'],
  invalid:['Select a valid departure aerodrome.','Selecione um aeródromo de partida válido.','Selecciona un aeródromo de salida válido.','Sélectionnez un aérodrome de départ valide.','Wählen Sie einen gültigen Startflugplatz.','有効な出発飛行場を選んでください。','请选择有效的出发机场。','유효한 출발 비행장을 선택하세요.']
 };
 return labels[key][LANGS.indexOf(lang)]||labels[key][0];
}
function opsStepText(i){
 const L=[
  ['Departure aerodrome','Aeródromo de partida','Aeródromo de salida','Aérodrome de départ','Startflugplatz','出発飛行場','出发机场','출발 비행장'],
  ['How to fly','Como voar','Cómo volar','Comment voler','Flugmodus','飛び方','飞行方式','비행 방식'],
  ['Airline & aircraft','Companhia e aeronave','Compañía y aeronave','Compagnie et avion','Airline & Flugzeug','航空会社と機材','航空公司与机型','항공사·기체'],
  ['When to fly','Quando voar','Cuándo volar','Quand voler','Wann fliegen','いつ飛ぶか','何时飞行','비행 시점']
 ];
 return L[i][LANGS.indexOf(lang)]||L[i][0];
}
function opsRosterRplPages(pane, direction=0){
 const step=pane.querySelector('[data-ops-step="3"]:not([hidden])');
 const list=step?.querySelector('.rs-pf .pf-list');
 if(!list||!list.getClientRects().length)return;
 const cards=[...list.children],pager=list.previousElementSibling.querySelector('.rs-pf-pages');
 const screen=step.closest('.rs-form-screen');
 const style=getComputedStyle(list);
 const cols=style.gridTemplateColumns.split(' ').length;
 // Measure natural card height before pagination, including wrapped fields.
 list.style.gridAutoRows='auto';
 cards.forEach(card=>{card.hidden=false});
 const rowHeight=Math.max(1,...cards.map(card=>card.getBoundingClientRect().height)),gap=parseFloat(style.rowGap);
 list.style.gridAutoRows=rowHeight+'px';
 const listBox=list.getBoundingClientRect();
 const screenStyle=getComputedStyle(screen);
 const screenGap=parseFloat(screenStyle.rowGap);
 const footer=screen.querySelector('.ops-step-nav');
 const error=screen.querySelector('.ops-step-error');
 // Reserve room for the aircraft picker, the wizard controls and any error below the list.
 const start=listBox.top-pane.getBoundingClientRect().top+pane.scrollTop;
 const tail=step.getBoundingClientRect().bottom-listBox.bottom;
 const bottom=parseFloat(getComputedStyle(pane).paddingBottom)+parseFloat(screenStyle.paddingBottom);
 const controls=footer.offsetHeight+screenGap+(error.hidden?0:error.offsetHeight+screenGap);
 const available=pane.clientHeight-start-bottom;
 const withControls=available-tail-controls;
 // On short screens, keep a page of flights visible and let the rest of the step scroll.
 const room=withControls>=rowHeight?withControls:available;
 const size=cols*Math.max(1,Math.floor((room+gap)/(rowHeight+gap)));
 const state=OPS_ROSTER_UI,selected=pfKey(RS.pf);
 const anchor=cards.findIndex(card=>card.dataset.k===state.rplPageKey);
 const selectedIndex=cards.findIndex(card=>card.dataset.k===selected);
 const index=selected&&selected!==state.rplSelected?selectedIndex:anchor;
 const pages=Math.ceil(cards.length/size);
 const page=Math.max(0,Math.min(pages-1,Math.floor(Math.max(0,index)/size)+direction));
 const first=page*size;
 const pageAnchor=selectedIndex>=first&&selectedIndex<first+size?selectedIndex:first;
 state.rplPageKey=cards[pageAnchor].dataset.k;
 state.rplSelected=selected;
 cards.forEach((card,i)=>{card.hidden=i<first||i>=first+size});
 pager.hidden=pages===1;
 const previous=pager.querySelector('[data-rpl-page="-1"]'),next=pager.querySelector('[data-rpl-page="1"]');
 previous.disabled=page===0;
 next.disabled=page+1===pages;
 const status=pager.querySelector('[role="status"]'),label=`${page+1} / ${pages}`;
 if(status.textContent!==label)status.textContent=label;
 if(direction){pane.scrollTop=0;cards[first].focus({preventScroll:true})}
}
let opsRplPane;
const opsRplResize=new ResizeObserver(entries=>{
 for(const {target} of entries)if(target.isConnected&&view==='roster')opsRosterRplPages(target);
});
const OPS_STEP_MOTION={step:0,started:0,pilot:null,animations:[]};
const opsStepReduced=matchMedia('(prefers-reduced-motion: reduce)');
function opsRosterStepMotion(pane){
 const m=OPS_STEP_MOTION,step=OPS_ROSTER_UI.step;
 const changed=m.step!==step||m.pilot!==myId;
 if(changed){m.from=m.pilot===myId?m.step:0;m.step=step;m.pilot=myId;m.started=performance.now()}
 m.animations.forEach(a=>a.cancel());m.animations=[];
 const screen=pane.querySelector('.rs-form-screen'),stage=screen?.querySelector('[data-ops-step]:not([hidden])');
 if(!stage)return;
 let rail=screen.querySelector('.ops-step-rail');
 if(!rail){rail=document.createElement('div');rail.className='ops-step-rail';rail.setAttribute('aria-hidden','true');rail.innerHTML='<span></span>';screen.querySelector('.ops-step-header').append(rail)}
 const progress=screen.querySelector('progress'),percent=progress.position*100;
 const fill=rail.firstElementChild;fill.style.width=percent+'%';
 const elapsed=performance.now()-m.started;
 if(opsStepReduced.matches||elapsed>=700)return;
 const direction=step>=m.from?1:-1;
 const play=(el,frames,delay=0,duration=440)=>{if(!el||elapsed>=delay+duration)return;const a=el.animate(frames,{duration,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});a.currentTime=elapsed;m.animations.push(a)};
 play(stage,[{opacity:0,transform:'translateX('+direction*18+'px)'},{opacity:1,transform:'translateX(0)'}]);
 play(screen.querySelector('.ops-step-header h3'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],40,380);
 play(fill,[{width:(m.from*25)+'%'},{width:percent+'%'}],0,560);
 const elements=[...stage.querySelectorAll('.rs-mode-card,.rs-fld,.rs-pf-head,.pf-i:not([hidden]),.acp,.rs-settings,.rs-actions,.rs-secondary')]
    .filter(el=>el.getClientRects().length&&!el.parentElement.closest('.rs-fld,.rs-secondary'));
 elements.slice(0,14).forEach((el,i)=>play(el,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],70+Math.min(i,6)*28,420));
 play(screen.querySelector('.ops-step-nav'),[{opacity:.45,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],100,350);
}
opsStepReduced.addEventListener('change',()=>{if(opsStepReduced.matches){OPS_STEP_MOTION.animations.forEach(a=>a.cancel());OPS_STEP_MOTION.animations=[]}});
function opsRosterSteps(pane){
 const screen=pane.querySelector('.rs-form-screen');
 const form=screen?.querySelector('#f-rs');
 if(!form)return;
 const state=OPS_ROSTER_UI;
 const canContinue=!!RS.ac&&(RS.other||!!RS.pf);
 if(state.step===4&&!canContinue&&!RS.busy&&!RS.roster)state.step=3;
 const stages=['.rs-top-fields','.rs-mode-field','.rs-sidebar-main','.rs-layout-sidebar'].map(sel=>screen.querySelector(sel));
 if(!screen.querySelector('.ops-step-header')){
  const [origin,mode,aircraft,timing]=stages;
  if(origin.parentElement!==screen){origin.classList.add('rs-top-moved');mode.before(origin)}
  aircraft.append(aircraft.querySelector('#rs-liveries'));
  timing.append(screen.querySelector('.rs-rules'));
  screen.insertAdjacentHTML('afterbegin',`<div class="ops-step-header"><p class="eyebrow"></p><h3 tabindex="-1"></h3><progress max="4" aria-label="${esc(t('nav_roster'))}"></progress></div>`);
  screen.insertAdjacentHTML('beforeend',`<div class="ops-step-nav"><button class="btn" type="button" data-ops-step-back>← ${esc(opsRosterText('back'))}</button><button class="btn primary" type="button" data-ops-step-next>${esc(opsRosterText('next'))} →</button></div><p class="form-err ops-step-error" role="alert" hidden></p>`);
 }
 stages.forEach((stage,i)=>{stage.dataset.opsStep=String(i+1);stage.hidden=i+1!==state.step});
 screen.querySelector('.ops-step-header p').textContent=`${opsRosterText('step')} ${state.step} / 4`;
 screen.querySelector('.ops-step-header h3').textContent=opsStepText(state.step-1);
 const progress=screen.querySelector('progress');
 progress.value=state.step;
 screen.querySelector('[data-ops-step-back]').hidden=state.step===1;
 screen.querySelector('[data-ops-step-back]').disabled=RS.busy;
 const next=screen.querySelector('[data-ops-step-next]');
 next.hidden=state.step===4;
 next.disabled=state.step===3&&!canContinue;
 const error=screen.querySelector('.ops-step-error');
 if(state.step===3){error.innerHTML=RS.err||'';error.hidden=!RS.err}
 else error.hidden=true;
 opsRosterRplPages(pane);
 if(state.step===1)scDepVisual();
 opsRosterStepMotion(pane);
}
async function opsRosterAdvance(step){
 const state=OPS_ROSTER_UI;
 if(view!=='roster'||state.stage!=='config'||state.moving||RS.busy||state.step===step)return;
 const current=document.querySelector('.op-roster [data-ops-step]:not([hidden])');
 if(!current)return;
 state.moving=true;
 try{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){
   const direction=step>state.step?1:-1;
   const exit=current.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX('+(-direction*12)+'px)'}],{duration:110,easing:'ease-in',fill:'forwards'});
   await exit.finished.catch(()=>{});
   exit.cancel();
  }
  const pane=document.querySelector('.op-roster');
  if(view!=='roster'||state.stage!=='config'||!pane)return;
  state.step=step;
  opsRosterSteps(pane);

  pane.scrollTop=0;
  pane.querySelector('.ops-step-header h3')?.focus({preventScroll:true});
 }finally{state.moving=false}
}
function opsRosterConfirmAirport(input){
 const code=apResolve(input.value);
 if(!AIRPORTS?.[code]){
  const error=input.closest('.rs-form-screen').querySelector('.ops-step-error');
  error.textContent=opsRosterText('invalid');error.hidden=false;input.focus();return;
 }
 input.value=code;
 apHide(input);
 opsRosterPaint();
 opsRosterAdvance(2);
}
function opsRosterPaint(){
 const pane=document.querySelector('.op-roster');
 if(!pane||view!=='roster')return;
 const state=OPS_ROSTER_UI;
 if(pane!==opsRplPane){opsRplResize.disconnect();opsRplResize.observe(pane);opsRplPane=pane}
 const rplContext=JSON.stringify([RS.dep,rsRplFavorite()]);
 if(state.pilot!==myId||state.rplContext!==rplContext||RS.rplEntry||RS.roster){
  state.rplPageKey='';state.rplSelected='';state.rplContext=rplContext;
 }
 if(state.pilot!==myId||state.roster!==RS.roster){state.stage=RS.roster?'review':'config';state.leg=0;state.step=1;state.roster=RS.roster;state.pilot=myId}
 if(RS.rplEntry){state.step=1;RS.rplEntry=false}
 pane.querySelector('.rs-screen-head')?.remove();
 pane.querySelector('.ops-roster-tabs')?.remove();   /* abas Configurar/Complementos/Revisar removidas: segue o estado da escala */
 pane.dataset.stage=state.stage;
 /* ao apresentar a escala, um botão volta ao formulário (mantem o que já foi preenchido) */
 let back=pane.querySelector('.ops-roster-back');
 if(RS.roster){
   if(!back){back=document.createElement('button');back.type='button';back.className='btn small ops-roster-back';back.dataset.opsBack='1';pane.prepend(back)}
   const bt=['New schedule','Nova escala','Nuevo horario','Nouveau planning','Neue Flugfolge','新しいスケジュール','新排班','새 스케줄'][LANGS.indexOf(lang)]||'New schedule';
   back.textContent='← '+bt;
 }else if(back){back.remove()}
 if(state.stage==='config')opsRosterSteps(pane);
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
}
document.addEventListener('click',event=>{
 const rplPage=event.target.closest('[data-rpl-page]');
 if(rplPage&&view==='roster'){
  opsRosterRplPages(rplPage.closest('.op-roster'),Number(rplPage.dataset.rplPage));
  return;
 }
 if(event.target.closest('[data-ops-back]')&&view==='roster'){RS.roster=null;if(typeof rsSave==='function')rsSave();render();return}
 const state=OPS_ROSTER_UI;
 if(view==='roster'&&state.stage==='config'&&event.target.closest('.op-roster')){
  const mode=event.target.closest('[data-ops-step="2"] .rs-mode-card[data-action="rs-other"]:enabled');
  if(state.step===2&&mode&&RS.other===(mode.dataset.v==='1')){opsRosterAdvance(3);return}
  if(event.target.closest('[data-ops-step-back]'))opsRosterAdvance(state.step-1);
  if(event.target.closest('[data-ops-step-next]')){
   if(state.step===1)opsRosterConfirmAirport(document.getElementById('rs-dep'));
   else if(state.step===2)opsRosterAdvance(3);
   else if(state.step===3&&RS.ac&&(RS.other||RS.pf))opsRosterAdvance(4);
  }

 }
 const button=event.target.closest('[data-ops-leg]');
 if(!button||view!=='roster')return;
 OPS_ROSTER_UI.leg+=Number(button.dataset.opsLeg);
 opsRosterPaint();
});
document.addEventListener('input',event=>{
 const input=event.target;
 if(input.id!=='rs-dep'||OPS_ROSTER_UI.step!==1||!input.closest('.op-roster'))return;
 input.closest('.rs-form-screen').querySelector('.ops-step-error').hidden=true;

});
document.addEventListener('keydown',event=>{
 if(event.key!=='Enter'||event.defaultPrevented||event.isComposing||event.target.id!=='rs-dep'||!event.target.closest('.op-roster'))return;
 event.preventDefault();

});
