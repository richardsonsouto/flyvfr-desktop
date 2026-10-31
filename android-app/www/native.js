/* native.js — ajustes do app Android (Capacitor). O app roda com os arquivos dentro do APK;
   os dados continuam vindo do Supabase pela internet. */
(function(){
  /* sem página inicial de divulgação: o app abre direto no login (ou no app, se já logado) */
  try{if(typeof authMode!=="undefined"&&authMode==="landing")authMode="signin"}catch(e){}
  document.addEventListener("click",e=>{const h=e.target.closest&&e.target.closest('[data-action="lp-home"]');if(h){e.preventDefault();e.stopImmediatePropagation()}},true);
  /* links externos (flightsim.to, SimBrief, SkyVector, cartas…) abrem no navegador do celular */
  const ext=u=>{try{const x=new URL(u,location.href);return /^https?:$/.test(x.protocol)&&x.host!==location.host}catch(e){return false}};
  document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("a[href]");if(!a||a.hasAttribute("download"))return;const href=a.getAttribute("href");if(!ext(href))return;e.preventDefault();e.stopPropagation();location.href=new URL(href,location.href).href},true);
  const open0=window.open;window.open=function(u){if(u&&ext(u)){location.href=new URL(u,location.href).href;return null}return open0.apply(window,arguments)};
})();
