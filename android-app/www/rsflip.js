/* rsflip.js — Escala: ao gerar, o quadro do formulário vira como um cartão e mostra no "verso" a escala gerada.
   No verso: "Ajustar escala" vira de volta para o formulário; "Gerar outra" gera de novo (e vira outra vez).
   Sem animação para quem pede "reduzir movimento". */
(function(){
 const T={adjust:["Adjust roster","Ajustar escala","Ajustar escala","Ajuster le planning","Dienstplan anpassen","スケジュールを調整","调整排班","스케줄 조정"],
  again:["Generate another","Gerar outra","Generar otra","En générer un autre","Neu erstellen","別の案を作成","重新生成","다시 생성"],
  view:["View generated roster","Ver escala gerada","Ver escala generada","Voir le planning généré","Erstellten Dienstplan ansehen","作成したスケジュールを見る","查看生成的排班","생성된 스케줄 보기"]};
 const ft=k=>(T[k][LANGS.indexOf(lang)]||T[k][0]);
 const RF={side:"back",busy:false};
 const reduce=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 function els(){return{front:document.querySelector("#view>.rs-form-screen"),back:document.querySelector("#view>.rs-out")}}
 function paintSides(){const {front,back}=els();if(!front||!back)return;
  const showBack=RF.side==="back";front.classList.toggle("rf-hidden",showBack);back.classList.toggle("rf-hidden",!showBack);
  if(!back.querySelector(".rf-bar")){back.insertAdjacentHTML("afterbegin",`<div class="rf-bar"><button type="button" class="btn small" data-action="rf-adjust">↶ ${esc(ft("adjust"))}</button><button type="button" class="btn small primary" data-action="rf-again">↻ ${esc(ft("again"))}</button></div>`)}
  const side=front.querySelector(".rs-layout-sidebar .rs-actions");
  if(side&&!front.querySelector(".rf-view")){side.insertAdjacentHTML("beforeend",`<button type="button" class="btn small rf-view" data-action="rf-view">${esc(ft("view"))} ↷</button>`)}}
 /* vira: o lado que sai gira até 90°, troca, o que entra gira de -90° até 0 */
 function flip(to,done){const {front,back}=els();if(!front||!back){RF.side=to;paintSides();done&&done();return}
  const out=to==="back"?front:back,inn=to==="back"?back:front;
  if(reduce()||RF.busy){RF.side=to;paintSides();done&&done();return}
  RF.busy=true;const host=document.getElementById("view");host&&host.classList.add("rf-flipping");out.classList.remove("rf-hidden");inn.classList.add("rf-hidden");
  const top=out.getBoundingClientRect().top+scrollY-90;if(scrollY>top)scrollTo({top,behavior:"smooth"});
  const a=out.animate([{transform:"perspective(1600px) rotateY(0deg)",filter:"brightness(1)"},{transform:"perspective(1600px) rotateY(90deg)",filter:"brightness(.85)"}],{duration:300,easing:"cubic-bezier(.5,0,.9,.5)",fill:"forwards"});
  a.onfinish=()=>{a.cancel();RF.side=to;paintSides();
   const b=inn.animate([{transform:"perspective(1600px) rotateY(-90deg)",filter:"brightness(.85)"},{transform:"perspective(1600px) rotateY(0deg)",filter:"brightness(1)"}],{duration:380,easing:"cubic-bezier(.15,.6,.3,1)"});
   b.onfinish=()=>{RF.busy=false;host&&host.classList.remove("rf-flipping");if(scrollX)scrollTo(0,scrollY);done&&done()}}}
 window.rsFlipBusy=()=>RF.busy;
 /* a animação dos cartões (painel de partidas) espera o cartão terminar de virar */
 if(typeof flapAnimate==="function"){const rfFlap=flapAnimate;flapAnimate=function(){if(RF.busy||RF.pendingFlap){setTimeout(flapAnimate,80);return}return rfFlap.apply(this,arguments)}}
 if(typeof render==="function"){const rfRender=render;render=function(){
   const justMade=typeof RS!=="undefined"&&RS.flapAnim&&RS.roster&&view==="roster";
   const r=rfRender.apply(this,arguments);
   try{if(view!=="roster"||typeof RS==="undefined"||!RS.roster){RF.side="back";return r}
    if(justMade&&!RF.busy){RF.side="front";paintSides();RF.pendingFlap=true;flip("back",()=>{RF.pendingFlap=false})}
    else paintSides()}catch(e){}
   return r}}
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action^="rf-"]');if(!b)return;const a=b.dataset.action;
  if(a==="rf-adjust")flip("front");
  else if(a==="rf-view")flip("back");
  else if(a==="rf-again"){const f=document.getElementById("f-rs");if(f){if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event("submit",{cancelable:true,bubbles:true}))}}});
})();
