/* remind.js — Lembrete antes do voo.
   • No app/site: faixa no topo de todas as telas a partir de 1 h antes da EOBT (fica âmbar nos últimos 15 min e vermelha
     depois da EOBT, até o limite de 45 min em que o voo e os seguintes são cancelados).
   • Notificação do sistema 1 h e 15 min antes da EOBT:
     - Android (app): agendada no próprio aparelho (plugin LocalNotifications) — chega mesmo com o app fechado;
     - Windows (app) e site: enquanto o app/aba estiver aberto (mesmo minimizado).
   O piloto ativa uma vez em "Ativar lembretes" (o sistema pede permissão). Tocar na notificação abre a Sala de briefing. */
(function(){
 const T={
  soon:["Your flight {f} {r} departs at {t} (in {m} min).","Seu voo {f} {r} sai às {t} (em {m} min).","Tu vuelo {f} {r} sale a las {t} (en {m} min).","Votre vol {f} {r} part à {t} (dans {m} min).","Ihr Flug {f} {r} startet um {t} (in {m} Min.).","{f} {r} は {t} に出発します（あと {m} 分）。","您的航班 {f} {r} 将于 {t} 起飞（{m} 分钟后）。","{f} {r} 항공편이 {t}에 출발합니다({m}분 후)."],
  late:["Your flight {f} {r} was due at {t}. Start it by {d} or it and the following flights will be cancelled.","Seu voo {f} {r} deveria ter saído às {t}. Inicie até {d} ou ele e os voos seguintes serão cancelados.","Tu vuelo {f} {r} debía salir a las {t}. Inícialo antes de {d} o él y los siguientes se cancelarán.","Votre vol {f} {r} devait partir à {t}. Démarrez-le avant {d}, sinon lui et les suivants seront annulés.","Ihr Flug {f} {r} war für {t} geplant. Starten Sie bis {d}, sonst werden er und die folgenden storniert.","{f} {r} は {t} 出発予定でした。{d} までに開始しないと、この便と以降の便がキャンセルされます。","您的航班 {f} {r} 原定 {t} 起飞。请在 {d} 前开始，否则该航班及后续航班将被取消。","{f} {r} 항공편은 {t} 출발 예정이었습니다. {d}까지 시작하지 않으면 이 항공편과 이후 항공편이 취소됩니다."],
  brief:["Open briefing","Abrir briefing","Abrir briefing","Ouvrir le briefing","Briefing öffnen","ブリーフィングを開く","打开简报","브리핑 열기"],
  enable:["🔔 Turn on reminders","🔔 Ativar lembretes","🔔 Activar recordatorios","🔔 Activer les rappels","🔔 Erinnerungen aktivieren","🔔 リマインダーを有効化","🔔 开启提醒","🔔 알림 켜기"],
  on:["🔔 Reminders on","🔔 Lembretes ativados","🔔 Recordatorios activados","🔔 Rappels activés","🔔 Erinnerungen aktiv","🔔 リマインダー有効","🔔 提醒已开启","🔔 알림 켜짐"],
  denied:["Notifications are blocked in your browser/system settings.","As notificações estão bloqueadas nas configurações do navegador/sistema.","Las notificaciones están bloqueadas en la configuración del navegador/sistema.","Les notifications sont bloquées dans les réglages du navigateur/système.","Benachrichtigungen sind in den Browser-/Systemeinstellungen blockiert.","ブラウザ/システムの設定で通知がブロックされています。","通知已在浏览器/系统设置中被阻止。","브라우저/시스템 설정에서 알림이 차단되어 있습니다."],
  n60:["Flight in 1 hour","Voo em 1 hora","Vuelo en 1 hora","Vol dans 1 heure","Flug in 1 Stunde","1時間後にフライト","1 小时后起飞","1시간 후 비행"],
  n15:["Flight in 15 minutes","Voo em 15 minutos","Vuelo en 15 minutos","Vol dans 15 minutes","Flug in 15 Minuten","15分後にフライト","15 分钟后起飞","15분 후 비행"],
  nbody:["{f} {r} · EOBT {t}. Briefing is ready.","{f} {r} · EOBT {t}. O briefing está pronto.","{f} {r} · EOBT {t}. El briefing está listo.","{f} {r} · EOBT {t}. Le briefing est prêt.","{f} {r} · EOBT {t}. Das Briefing ist bereit.","{f} {r} · EOBT {t}。ブリーフィングの準備ができています。","{f} {r} · EOBT {t}。简报已就绪。","{f} {r} · EOBT {t}. 브리핑이 준비되었습니다."]};
 const rt=(k,p)=>{let s=(T[k][LANGS.indexOf(lang)]||T[k][0]);if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
 const M=6e4,ON_KEY=()=>"vfr-rem-on:"+(typeof myId!=="undefined"?myId:"");
 const LN=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.LocalNotifications||null;
 const isOn=()=>{try{return localStorage.getItem(ON_KEY())==="1"}catch(e){return false}};
 const setOn=v=>{try{localStorage.setItem(ON_KEY(),v?"1":"0")}catch(e){}};
 /* voos do piloto ainda por fazer: EOBT = início da reserva + 20 min nas escalas (mesma regra da Sala de briefing) */
 function legs(){if(typeof data==="undefined"||!myId)return[];const now=Date.now();
  return data.reservations.filter(r=>r.pilotId===myId&&booked(r)&&!data.flights.some(f=>f.reservationId===r.id))
   .map(r=>({id:r.id,eobt:r.start+(r.rosterId?20*M:0),f:(r.flightNo||"").trim()||((acById(r.aircraftId)||{}).registration||""),r:`${r.dep} → ${r.arr}`}))
   .filter(l=>l.eobt+45*M>now).sort((a,b)=>a.eobt-b.eobt)}
 const hm=ms=>typeof tf!=="undefined"?tf.format(ms):new Date(ms).toLocaleTimeString();
 function banner(){const L=legs()[0];if(!L)return"";const now=Date.now(),m=Math.round((L.eobt-now)/M);if(m>60)return"";
  const late=m<0,cls=late?"bad":m<=15?"warn":"info";
  const txt=late?rt("late",{f:L.f,r:L.r,t:hm(L.eobt),d:hm(L.eobt+45*M)}):rt("soon",{f:L.f,r:L.r,t:hm(L.eobt),m:Math.max(1,m)});
  const sup=supported(),on=isOn()&&granted();
  const bell=!sup?"":on?`<span class="rem-on">${esc(rt("on"))}</span>`:`<button type="button" class="btn small" data-action="rem-enable">${esc(rt("enable"))}</button>`;
  return`<div class="notice rem-notice ${cls}" data-rem="${esc(L.id)}"><span class="rem-ic" aria-hidden="true">${late?"⏰":"✈"}</span><span class="rem-tx">${esc(txt)}</span><span class="rem-acts">${bell}<button type="button" class="btn small primary" data-view="briefing">${esc(rt("brief"))}</button></span></div>`}
 /* entra junto com os outros avisos do topo, em todas as telas */
 if(typeof divNotices==="function"){const o=divNotices;divNotices=function(){const a=o.apply(this,arguments)||[];try{const b=banner();if(b)a.unshift(b)}catch(e){}return a}}
 setInterval(()=>{try{const cur=document.querySelector("#view>.rem-notice"),b=banner();
   if(cur){if(b)cur.outerHTML=b;else cur.remove()}else if(b&&typeof render==="function")render();sync()}catch(e){}},30000);
 /* ---------- notificações do sistema ---------- */
 function supported(){return !!LN()||("Notification" in window)}
 function granted(){if(LN())return true;return("Notification" in window)&&Notification.permission==="granted"}
 async function enable(){try{
   if(LN()){const p=await LN().requestPermissions();if(p&&p.display==="granted"){setOn(true);await sync(true)}else{setOn(false);typeof toast==="function"&&toast(rt("denied"))}}
   else if("Notification" in window){const p=await Notification.requestPermission();if(p==="granted"){setOn(true);sync(true)}else{setOn(false);typeof toast==="function"&&toast(rt("denied"))}}
  }catch(e){console.warn(e)}try{render()}catch(e){}}
 const items=()=>{const out=[];for(const L of legs())for(const k of[60,15]){const at=L.eobt-k*M;if(at>Date.now()+5000)out.push({key:L.id+":"+k,at,title:rt(k===60?"n60":"n15"),body:rt("nbody",{f:L.f,r:L.r,t:hm(L.eobt)})})}return out};
 const nid=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)%2000000000+1};
 const WT={};let lastSig="";
 async function sync(force){if(!isOn()||!granted())return;const its=items(),sig=its.map(i=>i.key+"@"+i.at).join("|");if(!force&&sig===lastSig)return;lastSig=sig;
  const ln=LN();
  if(ln){try{const pend=await ln.getPending();const want=new Set(its.map(i=>nid(i.key)));const old=(pend&&pend.notifications||[]).filter(n=>n.extra&&n.extra.vfr&&!want.has(n.id)).map(n=>({id:n.id}));if(old.length)await ln.cancel({notifications:old});
    if(its.length)await ln.schedule({notifications:its.map(i=>({id:nid(i.key),title:i.title,body:i.body,schedule:{at:new Date(i.at),allowWhileIdle:true},extra:{vfr:1,view:"briefing"}}))})}catch(e){console.warn(e)}return}
  /* site/Windows: temporizadores enquanto a página estiver aberta (cada aviso só uma vez, mesmo recarregando) */
  for(const k in WT){clearTimeout(WT[k]);delete WT[k]}
  for(const i of its){const d=i.at-Date.now();if(d>24*36e5)continue;const sent="vfr-rem-sent:"+i.key;
   WT[i.key]=setTimeout(()=>{try{if(localStorage.getItem(sent))return;localStorage.setItem(sent,"1")}catch(e){}
    try{const n=new Notification(i.title,{body:i.body,icon:"icons/icon-192.png",tag:i.key});n.onclick=()=>{try{window.focus();view="briefing";render()}catch(e){}n.close()}}catch(e){}},d)}}
 if(LN()){try{LN().addListener("localNotificationActionPerformed",()=>{try{view="briefing";render()}catch(e){}})}catch(e){}}
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action="rem-enable"]');if(b)enable()});
 if(typeof render==="function"){const rmRender=render;render=function(){const r=rmRender.apply(this,arguments);try{sync()}catch(e){}return r}}
 window.vfrRemind={legs,banner,items};
})();
