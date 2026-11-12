/* Home entrance: replay on opening Home, preserve elapsed motion on data refresh. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=false,pending=false,started=0,animations=[];
 const duration=1650;
 function cancel(){animations.forEach(a=>a.cancel());animations=[]}
 document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-view="home"]'))pending=true;
  if(event.target.closest?.('[data-action="signout"]')){active=false;cancel()}
 },true);
 window.homeMotionPaint=function(){
  const root=document.querySelector('#view .hm');
  const entering=!active||pending;
  cancel();
  if(view!=='home'||!root){active=false;return}
  active=true;pending=false;
  if(entering)started=performance.now();
  const elapsed=performance.now()-started;
  if(reduced.matches||elapsed>=duration)return;
  root.style.setProperty('--hm-motion-elapsed',`-${elapsed}ms`);
  root.classList.add('hm-motion');
  const play=(el,frames,delay,length=480)=>{
   if(!el||elapsed>=delay+length)return;
   const a=el.animate(frames,{duration:length,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
   a.currentTime=elapsed;animations.push(a);
  };
  const enter=[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}];
  ['.hm-g>.hm-next','.hm-col>.hm-card:nth-child(1)','.hm-col>.hm-card:nth-child(2)',
   '.hm-g3>.hm-card:nth-child(1)','.hm-g3>.hm-card:nth-child(2)','.hm-g3>.hm-card:nth-child(3)']
   .forEach((selector,i)=>play(root.querySelector(selector),enter,[0,100,180,240,300,360][i]));
  play(root.querySelector('.hm-cd'),[{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],300,550);
  play(root.querySelector('.hm-al'),[{transform:'scale(.94)'},{transform:'scale(1)'}],80,600);
  play(root.querySelector('.hm-g3>.hm-card:first-child .hm-av.warn'),[
   {boxShadow:'0 0 0 0 transparent'},
   {boxShadow:'0 0 0 3px color-mix(in srgb, var(--warn) 35%, transparent)'},
   {boxShadow:'0 0 0 0 transparent'}],700,950);
 };
 reduced.addEventListener('change',()=>{
  if(reduced.matches){cancel();document.querySelector('#view .hm')?.classList.remove('hm-motion')}
 });
 const style=document.createElement('style');style.id='home-motion-css';
 style.textContent=`
 .hm .hm-mid i:before{content:"";position:absolute;left:0;top:0;width:50%;height:100%;background:var(--accent);transform-origin:left}
 .hm-motion .hm-mid i:before{animation:hm-route-draw 850ms cubic-bezier(.22,1,.36,1) both;animation-delay:calc(200ms + var(--hm-motion-elapsed,0ms))}
 .hm-motion .hm-mid i:after{animation:hm-plane-enter 1050ms cubic-bezier(.22,1,.36,1) both;animation-delay:calc(180ms + var(--hm-motion-elapsed,0ms))}
 @keyframes hm-route-draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
 @keyframes hm-plane-enter{0%{left:0;opacity:0}15%{opacity:1}100%{left:50%;opacity:1}}
 @media(prefers-reduced-motion:reduce){.hm-motion .hm-mid i:before{display:none}.hm-motion .hm-mid i:after{animation:none}}
 `;
 document.head.appendChild(style);
})();
