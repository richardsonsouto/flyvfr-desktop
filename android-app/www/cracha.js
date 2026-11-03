/* cracha.js — Crachá de tripulante no Logbook: cores e logo da companhia favorita, iniciais, nome, patente com galões,
   ID do piloto, base (aeródromo de onde mais decola), horas e "desde". Tocar abre o crachá grande, com "Baixar imagem".
   O texto sobre a faixa colorida usa branco ou preto conforme o contraste com as DUAS cores da companhia. */
(function(){
 const T={crew:["CREW","TRIPULAÇÃO · CREW","TRIPULACIÓN · CREW","ÉQUIPAGE · CREW","CREW","乗務員 · CREW","机组 · CREW","승무원 · CREW"],
  id:["Crew ID","ID tripulante","ID tripulante","ID équipage","Crew-ID","乗務員ID","机组编号","승무원 ID"],
  base:["Base","Base","Base","Base","Basis","ベース","基地","베이스"],
  hours:["Hours","Horas","Horas","Heures","Stunden","飛行時間","飞行小时","비행시간"],
  since:["Since","Desde","Desde","Depuis","Seit","登録","加入","가입"],
  view:["Crew badge","Ver crachá","Ver credencial","Voir le badge","Ausweis ansehen","乗務員証を見る","查看工牌","승무원증 보기"],
  dl:["Download image","Baixar imagem","Descargar imagen","Télécharger l’image","Bild herunterladen","画像を保存","下载图片","이미지 저장"],
  close:["Close","Fechar","Cerrar","Fermer","Schließen","閉じる","关闭","닫기"]};
 const ct=k=>(T[k][LANGS.indexOf(lang)]||T[k][0]);
 const MON={pt:["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]};
 const C={};
 /* dados do crachá */
 function cbData(pid){
  const fl=data.flights.filter(f=>f.pilotId===pid&&(typeof counts!=="function"||counts(f)));
  const cnt=(arr,fn)=>{const m={};arr.forEach(x=>{const k=fn(x);if(k)m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0]||""};
  let al=pid===myId&&typeof myFavAirline==="function"?myFavAirline():"";
  if(!al||!LIVERY[al])al=cnt(fl,f=>acById(f.aircraftId)?.airline)||al;
  const s=pilotStats(pid),r=rankOf(s.h);
  const name=(names[pid]||(pid===myId&&session?.user?.user_metadata?.name)||"").trim()||pilot(pid);
  let h=0;for(const c of String(pid||""))h=(h*31+c.charCodeAt(0))>>>0;
  const first=fl.length?Math.min(...fl.map(f=>f.createdAt)):(pid===myId&&session?.user?.created_at?Date.parse(session.user.created_at):0);
  const d=first?new Date(first):null;
  const since=d?((MON[lang]||null)?MON[lang][d.getMonth()]+"/"+d.getFullYear():d.toLocaleDateString(lang,{month:"short",year:"numeric"})):"—";
  return{al,r,name,id:"VFR-"+String(h%100000).padStart(5,"0"),base:cnt(fl,f=>f.dep)||"—",hours:block(Math.round(s.h*60)),since};
 }
 /* cores: faixa com as cores da companhia; texto branco ou preto, o que tiver mais contraste com a cor PIOR das duas */
 function cbPal(al){const L=(typeof LIVERY!=="undefined"&&LIVERY[al])||["#1F2A44","#3B4F7A"];let [a,b]=L;b=b||a;
  const w=Math.min(faContrast(a,"#ffffff"),faContrast(b,"#ffffff")),k=Math.min(faContrast(a,"#111111"),faContrast(b,"#111111"));
  let ink=w>=k?"#ffffff":"#111111";
  /* se nenhuma passa de 4,5:1, escurece (ou clareia) a faixa até passar */
  const ok=x=>faContrast(x,ink)>=4.5,fix=c=>{let t=0,x=c;while(!ok(x)&&t<1){t+=.05;x=faMix(c,ink==="#ffffff"?"#000000":"#ffffff",t)}return x};
  return{a:fix(a),b:fix(b),ink}}
 const initials=n=>{const w=String(n).split(/\s+/).filter(x=>x&&/^\p{L}/u.test(x));return((w[0]||"?")[0]+(w.length>1?w[w.length-1][0]:"")).toUpperCase()};
 const bars=id=>{let x="",s=0;for(const c of id+"VFR"){const v=c.charCodeAt(0);for(let i=0;i<4;i++){const on=(v>>i)&1;x+=`<i style="width:${on?2:1}px;margin-right:${((v>>(i+1))&1)+1}px"></i>`;s++}}return x};
 function logo(al,ink){const c=AIRLINE_IATA[al];return c?`<img class="cb-logo" src="${SYM_SRC[0](c)}" alt="${esc(al)}" data-c="${c}" data-i="0" style="filter:brightness(0)${ink==="#ffffff"?" invert(1)":""}" onerror="cbLogoErr(this)" onload="if(this.naturalWidth<8)cbLogoErr(this)">`:`<span class="cb-al">${esc(al||"Virtual Flight Report")}</span>`}
 window.cbLogoErr=img=>{const i=+img.dataset.i+1;if(SYM_SRC[i]){img.dataset.i=i;img.src=SYM_SRC[i](img.dataset.c)}else img.outerHTML=`<span class="cb-al">${esc(img.alt)}</span>`};
 function badge(pid,mini){const D=cbData(pid),P=cbPal(D.al),bg=`linear-gradient(160deg,${P.a},${P.b})`;
  return`<div class="cb${mini?" cb-mini":""}" style="--cb-a:${P.a};--cb-b:${P.b};--cb-ink:${P.ink}"${mini?` role="button" tabindex="0" data-action="cb-open" data-p="${esc(pid)}" title="${esc(ct("view"))}"`:""}>
   <div class="cb-hd" style="background:${bg}"><span class="cb-slot"></span>${logo(D.al,P.ink)}<small>${esc(ct("crew"))}</small></div>
   <div class="cb-ph" style="background:${bg}">${esc(initials(D.name))}</div>
   <div class="cb-nm">${mini?"":`<b>${esc(D.name)}</b>`}<span>${esc(t(D.r.k))}</span></div>
   <div class="cb-rk">${insignia(D.r)}</div>
   ${mini?"":`<dl class="cb-dl"><div><dt>${esc(ct("id"))}</dt><dd class="mono">${D.id}</dd></div><div><dt>${esc(ct("base"))}</dt><dd class="mono">${esc(D.base)}</dd></div><div><dt>${esc(ct("hours"))}</dt><dd class="mono">${esc(D.hours)}</dd></div><div><dt>${esc(ct("since"))}</dt><dd>${esc(D.since)}</dd></div></dl>
   <div class="cb-ft"><span class="cb-bc">${bars(D.id)}</span><small>VIRTUAL FLIGHT<br>REPORT</small></div>`}</div>`}
 window.crewBadge=badge;
 /* no Logbook (Meu logbook e o de outro piloto): crachá pequeno à esquerda do resumo + botão "Ver crachá" */
 function inject(){if(view!=="logbook"||typeof lbTab!=="undefined"&&lbTab!=="mine")return;
  const st=document.querySelector("#view .lb-stats");if(!st)return;const pan=st.closest(".panel");if(!pan||pan.querySelector(".cb-mini"))return;
  const pid=(typeof lbPilot!=="undefined"&&lbPilot)||myId;if(!pid)return;
  const body=document.createElement("div");body.className="cb-main";while(pan.firstChild)body.appendChild(pan.firstChild);
  pan.classList.add("cb-panel");pan.insertAdjacentHTML("afterbegin",badge(pid,true));pan.appendChild(body);
  const hd=body.querySelector(".sec-head");if(hd){let g=hd.querySelector(".cb-acts");if(!g){g=document.createElement("div");g.className="cb-acts";hd.querySelectorAll(":scope>.btn").forEach(b=>g.appendChild(b));hd.appendChild(g)}
   g.insertAdjacentHTML("afterbegin",`<button class="btn small" data-action="cb-open" data-p="${esc(pid)}">🪪 ${esc(ct("view"))}</button>`)}}
 if(typeof render==="function"){const cbRender=render;render=function(){const r=cbRender.apply(this,arguments);try{inject()}catch(e){console.warn(e)}return r}}
 /* crachá grande */
 function open(pid){close();const w=document.createElement("div");w.className="cb-modal";w.innerHTML=`<div class="cb-box" role="dialog" aria-modal="true" aria-label="${esc(ct("view"))}">${badge(pid,false)}
   <div class="cb-btns"><button class="btn small" data-action="cb-close">${esc(ct("close"))}</button><button class="btn small primary" data-action="cb-dl" data-p="${esc(pid)}">⤓ ${esc(ct("dl"))}</button></div></div>`;
  document.body.appendChild(w);C.prev=document.activeElement;w.querySelector('[data-action="cb-dl"]').focus()}
 function close(){document.querySelectorAll(".cb-modal").forEach(x=>x.remove());if(C.prev&&C.prev.focus)try{C.prev.focus()}catch(e){};C.prev=null}
 /* imagem: o crachá desenhado num canvas (2x), para salvar ou compartilhar */
 const img=src=>new Promise(res=>{const i=new Image();i.crossOrigin="anonymous";i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src});
 async function download(pid){const D=cbData(pid),P=cbPal(D.al),S=2,W=540,H=860,cv=document.createElement("canvas");cv.width=W*S;cv.height=H*S;const x=cv.getContext("2d");x.scale(S,S);
  const rr=(X,Y,w,h,r)=>{x.beginPath();x.roundRect(X,Y,w,h,r)};const font=(w,s,m)=>`${w} ${s}px ${m?"ui-monospace,Menlo,Consolas,monospace":"system-ui,-apple-system,'Segoe UI',sans-serif"}`;
  x.fillStyle="#ffffff";rr(0,0,W,H,36);x.fill();x.save();rr(0,0,W,H,36);x.clip();
  const g=x.createLinearGradient(0,0,W*.6,300);g.addColorStop(0,P.a);g.addColorStop(1,P.b);x.fillStyle=g;x.fillRect(0,0,W,250);
  x.fillStyle="rgba(0,0,0,.25)";rr(W/2-54,20,108,18,9);x.fill();
  const c=AIRLINE_IATA[D.al];let lg=null;for(const f of SYM_SRC){if(!c)break;lg=await img(f(c));if(lg&&lg.naturalWidth>8)break;lg=null}
  let drawn=false;if(lg){try{const h=56,w=lg.naturalWidth/lg.naturalHeight*h,o=document.createElement("canvas");o.width=w*S;o.height=h*S;const ox=o.getContext("2d");ox.drawImage(lg,0,0,o.width,o.height);ox.globalCompositeOperation="source-in";ox.fillStyle=P.ink;ox.fillRect(0,0,o.width,o.height);o.toDataURL();x.drawImage(o,W/2-w/2,52,w,h);drawn=true}catch(e){}}
  x.fillStyle=P.ink;x.textAlign="center";if(!drawn){x.font=font(800,30);x.fillText(D.al||"Virtual Flight Report",W/2,94)}
  x.font=font(700,15);x.letterSpacing="4px";x.fillText(ct("crew"),W/2,138);x.letterSpacing="0px";
  x.beginPath();x.arc(W/2,250,92,0,7);x.fillStyle="#fff";x.fill();x.beginPath();x.arc(W/2,250,84,0,7);x.fillStyle=g;x.fill();
  x.fillStyle=P.ink;x.font=font(800,56);x.textBaseline="middle";x.fillText(initials(D.name),W/2,252);x.textBaseline="alphabetic";
  x.fillStyle="#171717";x.font=font(800,34);const words=D.name.split(" "),lines=[];let ln="";for(const w of words){const tr=ln?ln+" "+w:w;if(x.measureText(tr).width>W-70&&ln){lines.push(ln);ln=w}else ln=tr}lines.push(ln);
  let y=390;lines.slice(0,2).forEach(l=>{x.fillText(l,W/2,y);y+=40});x.fillStyle="#5c5c5c";x.font=font(500,22);x.fillText(t(D.r.k),W/2,y+2);y+=24;
  const sv=insignia(D.r).replace(/^[^]*?(<svg)/,"$1").replace(/<\/span>$/,"").replace("<svg ",'<svg xmlns="http://www.w3.org/2000/svg" ');const ins=await img("data:image/svg+xml;charset=utf-8,"+encodeURIComponent(sv));if(ins)x.drawImage(ins,W/2-27,y,54,78);y+=104;
  x.textAlign="left";const cells=[[ct("id"),D.id,1],[ct("base"),D.base,1],[ct("hours"),D.hours,1],[ct("since"),D.since,0]];
  cells.forEach((cl,i)=>{const cx=56+(i%2)*230,cy=y+Math.floor(i/2)*70;x.fillStyle="#6b6b6b";x.font=font(600,13);x.letterSpacing="2px";x.fillText(cl[0].toUpperCase(),cx,cy);x.letterSpacing="0px";x.fillStyle="#171717";x.font=font(700,22,cl[2]);x.fillText(cl[1],cx,cy+28)});
  y=H-104;x.strokeStyle="#dddad2";x.setLineDash([6,5]);x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();x.setLineDash([]);
  let bx=56;x.fillStyle="#171717";for(const ch of D.id+"VFR"){const v=ch.charCodeAt(0);for(let i=0;i<4&&bx<300;i++){const on=(v>>i)&1;x.fillRect(bx,y+26,on?4:2,52);bx+=(on?4:2)+(((v>>(i+1))&1)+1)*2}}
  x.fillStyle="#6b6b6b";x.font=font(600,14);x.letterSpacing="2px";x.textAlign="right";x.fillText("VIRTUAL FLIGHT",W-48,y+48);x.fillText("REPORT",W-48,y+68);x.restore();
  const a=document.createElement("a");a.download=`cracha-${D.id}.png`;a.href=cv.toDataURL("image/png");document.body.appendChild(a);a.click();a.remove()}
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-action^="cb-"]');
  if(!b){if(e.target.classList&&e.target.classList.contains("cb-modal"))close();return}
  const a=b.dataset.action;if(a==="cb-open")open(b.dataset.p);else if(a==="cb-close")close();else if(a==="cb-dl")download(b.dataset.p)});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.querySelector(".cb-modal"))close();
  else if((e.key==="Enter"||e.key===" ")&&e.target.classList&&e.target.classList.contains("cb-mini")){e.preventDefault();open(e.target.dataset.p)}});
})();
