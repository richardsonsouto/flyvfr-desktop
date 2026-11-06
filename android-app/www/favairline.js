/* favairline.js — Companhia favorita do piloto (user_metadata.fav_airline).
   Escolhida no cadastro (piloto de companhia) e alterável no Perfil. */
const FA_T={
 fa_label:["Favorite airline","Companhia favorita","Aerolínea favorita","Compagnie préférée","Lieblings-Airline","お気に入りの航空会社","最喜欢的航空公司","즐겨 찾는 항공사"],
 fa_hint:["Optional. It comes pre-selected in the Roster, Fleet and Map; you can still fly any airline.","Opcional. Ela já vem selecionada na Escala, na Frota e no Mapa; você continua podendo voar por qualquer companhia.","Opcional. Viene preseleccionada en la Escala, la Flota y el Mapa; puedes seguir volando con cualquier aerolínea.","Facultatif. Elle est présélectionnée dans la Rotation, la Flotte et la Carte ; vous pouvez toujours voler pour n’importe quelle compagnie.","Optional. Sie ist in Umlauf, Flotte und Karte vorausgewählt; du kannst weiterhin jede Airline fliegen.","任意。ロスター、フリート、地図で最初から選択されます。どの航空会社でも引き続き飛べます。","可选。在排班、机队和地图中默认选中;你仍可驾驶任何航空公司。","선택 사항. 스케줄, 기단, 지도에서 미리 선택됩니다. 다른 항공사도 계속 비행할 수 있습니다."],
 fa_rpl_only:["Showing only {al} flights","Mostrando só os voos da {al}","Mostrando solo los vuelos de {al}","Seuls les vols {al} sont affichés","Nur Flüge von {al}","{al} の便のみ表示","仅显示 {al} 的航班","{al} 항공편만 표시"],
 fa_rpl_all:["See all airlines","Ver todas as companhias","Ver todas las aerolíneas","Voir toutes les compagnies","Alle Airlines anzeigen","すべての航空会社を表示","查看所有航空公司","모든 항공사 보기"],
 fa_rpl_allon:["Showing all airlines","Mostrando todas as companhias","Mostrando todas las aerolíneas","Toutes les compagnies sont affichées","Alle Airlines","すべての航空会社を表示中","显示所有航空公司","모든 항공사 표시 중"],
 fa_rpl_back:["Only {al}","Só a {al}","Solo {al}","Seulement {al}","Nur {al}","{al} のみ","仅 {al}","{al}만"],
 fa_rpl_none:["No {al} departure from here in this window. {n} flights from other airlines are available.","Nenhuma saída da {al} daqui nesta janela. Há {n} voos de outras companhias.","Ninguna salida de {al} desde aquí en este intervalo. Hay {n} vuelos de otras aerolíneas.","Aucun départ {al} d’ici dans ce créneau. {n} vols d’autres compagnies sont disponibles.","Kein Abflug von {al} hier in diesem Zeitfenster. {n} Flüge anderer Airlines verfügbar.","この時間帯にここから出発する {al} の便はありません。他社の便が {n} 便あります。","此时段没有从这里出发的 {al} 航班。其他航空公司有 {n} 个航班。","이 시간대에 여기서 출발하는 {al} 항공편이 없습니다. 다른 항공사 항공편 {n}편이 있습니다."],
 fa_colors:["Use my favorite airline's colours in the menus","Usar as cores da companhia favorita nos menus","Usar los colores de la aerolínea favorita en los menús","Utiliser les couleurs de la compagnie préférée dans les menus","Farben der Lieblings-Airline in den Menüs verwenden","メニューにお気に入り航空会社の色を使う","菜单使用最喜欢的航空公司的配色","메뉴에 즐겨 찾는 항공사 색상 사용"],
 fa_colors_h:["The side menu, buttons and highlights take on the airline's colours. Light and dark themes keep working.","O menu lateral, os botões e os destaques ganham as cores da companhia. Os temas claro e escuro continuam funcionando.","El menú lateral, los botones y los destacados toman los colores de la aerolínea. Los temas claro y oscuro siguen funcionando.","Le menu latéral, les boutons et les mises en avant prennent les couleurs de la compagnie. Les thèmes clair et sombre restent disponibles.","Seitenmenü, Schaltflächen und Hervorhebungen übernehmen die Farben der Airline. Helles und dunkles Design funktionieren weiter.","サイドメニュー、ボタン、強調表示が航空会社の色になります。ライト／ダークテーマはそのまま使えます。","侧边菜单、按钮和高亮将采用航空公司的配色。浅色和深色主题仍可使用。","사이드 메뉴, 버튼, 강조 표시가 항공사 색상으로 바뀝니다. 밝은/어두운 테마는 그대로 사용할 수 있습니다."],
 fa_none:["No favorite","Sem favorita","Sin favorita","Aucune","Keine","なし","无","없음"]
};
const fat=(k,v)=>{const r=FA_T[k];let x=r?(r[LANGS.indexOf(lang)]||r[0]):k;if(v)for(const n in v)x=x.split("{"+n+"}").join(v[n]);return x};
const myFavColors=()=>!!(session&&session.user&&session.user.user_metadata&&session.user.user_metadata.fav_colors);
const myFavAirline=()=>{const v=session&&session.user&&session.user.user_metadata&&session.user.user_metadata.fav_airline;return typeof v==="string"?v:""};
function faAirlines(){const set=new Set(Object.keys(typeof AIRLINE_ICAO!=="undefined"?AIRLINE_ICAO:{}));
  if(typeof fleet!=="undefined")for(const a of fleet)if(a.airline)set.add(a.airline);set.delete("LATAM");
  const R=typeof regionsSorted==="function"?regionsSorted():[],g={};
  for(const al of set){const r=typeof regionOf==="function"?regionOf(al):"other";(g[r]=g[r]||[]).push(al)}
  return Object.keys(g).sort((a,b)=>R.indexOf(a)-R.indexOf(b)).map(r=>[r,g[r].sort((x,y)=>x.localeCompare(y))])}
/* ícone da companhia: logo oficial; se não carregar, um selo com o código IATA nas cores da companhia */
function faSym(al){const c=(typeof AIRLINE_IATA!=="undefined"&&AIRLINE_IATA[al])||String(al).replace(/[^A-Za-z]/g,"").slice(0,2).toUpperCase();
  const L=typeof LIVERY!=="undefined"&&LIVERY[al],bg=L?L[0]:"#5b6b7c",fg=L&&typeof plateStyle==="function"&&/#0B0F17/.test(plateStyle(al))?"#0B0F17":"#fff";
  return`<span class="fa-sym" style="--fa-bg:${bg};--fa-fg:${fg}"><b>${esc(c)}</b>${typeof alSym==="function"?alSym(al):""}</span>`}
function faFieldHTML(id,cur){
  return`<div class="fa-field" id="${id}-wrap"><span class="fa-label">${fat("fa_label")} <span class="hint">${t("optional")}</span></span>
   <input type="hidden" id="${id}" value="${esc(cur||"")}">
   <div class="alpick fa-pick" data-fa="${id}"><button type="button" class="alpick-btn fa-btn" data-action="fa-open" data-fa="${id}" aria-haspopup="listbox" aria-expanded="false">${faBtnInner(cur)}<span class="alpick-caret" aria-hidden="true">▾</span></button>
   <div class="alpick-pop fa-pop" hidden><input type="search" class="alpick-q fa-q" data-fa="${id}" placeholder="${esc(t("alp_search"))}" autocomplete="off" spellcheck="false"><div class="alpick-list fa-list" role="listbox"></div></div></div>
   <span class="hint">${fat("fa_hint")}</span>
   <label class="fa-colors"><input type="checkbox" id="${id}-colors" ${(id==="ms-fav"?myFavColors():false)?"checked":""}><span><b>${esc(fat("fa_colors"))}</b><small class="hint">${esc(fat("fa_colors_h"))}</small></span></label></div>`}
const faBtnInner=cur=>cur?`${faSym(cur)}<span>${esc(cur)}</span>`:`<span class="alpick-all">✈</span><span class="muted">${esc(fat("fa_none"))}</span>`;
function faList(id,q){const cur=(document.getElementById(id)||{}).value||"",Q=(typeof norm==="function"?norm(q||""):String(q||"").toLowerCase()).trim();
  const opt=al=>`<button type="button" class="alpick-o fa-o" role="option" data-action="fa-pick" data-fa="${id}" data-v="${esc(al)}" aria-selected="${al===cur}">${al?faSym(al):`<span class="alpick-all">✈</span>`}<span>${esc(al||fat("fa_none"))}</span></button>`;
  const groups=faAirlines().map(([r,list])=>[r,list.filter(al=>!Q||(typeof norm==="function"?norm(al):al.toLowerCase()).includes(Q))]).filter(([,l])=>l.length);
  return(Q?"":opt(""))+groups.map(([r,list])=>`<div class="fa-grp">${esc(t("reg_"+r))}</div>${list.map(opt).join("")}`).join("")}
function faClose(){document.querySelectorAll(".fa-pop").forEach(p=>{p.hidden=true;const b=p.parentElement.querySelector(".fa-btn");if(b)b.setAttribute("aria-expanded","false")})}
document.addEventListener("click",e=>{const o=e.target.closest('[data-action="fa-open"]');
  if(o){e.preventDefault();const box=o.closest(".fa-pick"),pop=box.querySelector(".fa-pop"),open=pop.hidden;faClose();if(open){pop.hidden=false;o.setAttribute("aria-expanded","true");pop.querySelector(".fa-list").innerHTML=faList(o.dataset.fa,"");const q=pop.querySelector(".fa-q");q.value="";q.focus()}return}
  const p=e.target.closest('[data-action="fa-pick"]');
  if(p){e.preventDefault();const id=p.dataset.fa,inp=document.getElementById(id);if(inp){inp.value=p.dataset.v;const box=document.querySelector(`.fa-pick[data-fa="${id}"] .fa-btn`);if(box)box.innerHTML=faBtnInner(p.dataset.v)+'<span class="alpick-caret" aria-hidden="true">▾</span>'}faClose();return}
  if(!e.target.closest(".fa-pick"))faClose()});
document.addEventListener("input",e=>{if(!e.target.classList||!e.target.classList.contains("fa-q"))return;const l=e.target.parentElement.querySelector(".fa-list");if(l)l.innerHTML=faList(e.target.dataset.fa,e.target.value)});
document.addEventListener("load",e=>{const i=e.target;if(i&&i.tagName==="IMG"&&i.classList.contains("al-sym")&&i.parentElement&&i.parentElement.classList.contains("fa-sym")&&i.naturalWidth)i.parentElement.classList.add("ok")},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.querySelector(".fa-pop:not([hidden])"))faClose()});
document.addEventListener("change",e=>{if(e.target.name==="au-mode"){const w=document.getElementById("au-fav-wrap");if(w)w.hidden=e.target.value==="freelancer"}});

/* cadastro: depois da escolha do perfil */
if(typeof flSignupHTML==="function"){const faSignupOrig=flSignupHTML;flSignupHTML=function(){return faSignupOrig.apply(this,arguments)+faFieldHTML("au-fav","")}}
/* Perfil: junto dos simuladores */
if(typeof sheetMySims==="function"){const faSheetOrig=sheetMySims;sheetMySims=function(){faSheetOrig.apply(this,arguments);
  const f=document.getElementById("f-sims"),err=f&&f.querySelector("#ms-err");if(!err||typeof FL!=="undefined"&&FL.mode==="freelancer")return;
  const d=document.createElement("div");d.innerHTML=faFieldHTML("ms-fav",myFavAirline());f.insertBefore(d.firstElementChild,err)}}

/* gravar: no cadastro (metadados do signUp) e no Perfil (junto das redes online) */
(function(){
  /* o cliente do Supabase pode ser criado depois deste arquivo: o cadastro é interceptado no envio do formulário */
  const faWrapSignUp=()=>{if(typeof sb==="undefined"||!sb||!sb.auth||!sb.auth.signUp||sb.auth.signUp._fa)return;const su=sb.auth.signUp.bind(sb.auth);
    const w=function(args){try{const el=document.getElementById("au-fav"),free=document.querySelector('input[name="au-mode"]:checked')?.value==="freelancer";
      if(el&&el.value&&!free){args=args||{};args.options=args.options||{};const ck=document.getElementById("au-fav-colors");args.options.data=Object.assign({},args.options.data,{fav_airline:el.value,fav_colors:!!(ck&&ck.checked)})}}catch(e){}
      return su(args)};w._fa=true;sb.auth.signUp=w};
  faWrapSignUp();document.addEventListener("submit",e=>{if(e.target&&e.target.id==="f-auth")faWrapSignUp()},true);
  if(typeof netProfileValues==="function"){const nv=netProfileValues;
    netProfileValues=function(){const o=nv.apply(this,arguments)||{};const el=document.getElementById("ms-fav");if(el){o.fav_airline=el.value;const ck=document.getElementById("ms-fav-colors");if(ck)o.fav_colors=!!ck.checked;FA.applied=""}return o}}
})();

/* usar: a favorita já vem selecionada na Escala, na Frota e no Mapa (uma vez por sessão; o piloto pode trocar) */
const FA={applied:""};
function faApply(){const fav=myFavAirline();if(!fav||!session||FA.applied===myId+"|"+fav)return;
  if(typeof FL!=="undefined"&&FL.mode==="freelancer")return;
  if(typeof loaded==="undefined"||!loaded.aircraft||typeof fleet==="undefined"||!fleet.some(a=>a.airline===fav))return;
  FA.applied=myId+"|"+fav;
  if(typeof ACP!=="undefined"&&ACP.rs&&ACP.rs.al==="all")ACP.rs.al=fav;
  if(typeof fAirline!=="undefined"&&fAirline==="all"){if(typeof regionOf==="function")fRegion=regionOf(fav);fAirline=fav;if(typeof fleetGeoVersion!=="undefined")fleetGeoVersion++}
  if(typeof MAPV!=="undefined"&&MAPV.airline==="all")MAPV.airline=fav}
/* Escala livre: ao entrar nela (vindo da Escala RPL, por qualquer caminho) a Escala zera a companhia;
   a favorita volta a vir selecionada. Detecta a troca de modo a cada render, sem depender do clique. */
function faFreeApply(){if(typeof RS==="undefined")return;const was=FA.lastOther;FA.lastOther=!!RS.other;
  if(!RS.other||was===true)return;const fav=myFavAirline();
  if(!fav||typeof FL!=="undefined"&&FL.mode==="freelancer"||RS.ac||typeof ACP==="undefined"||!ACP.rs||ACP.rs.al!=="all")return;
  if(typeof fleet!=="undefined"&&fleet.some(a=>a.airline===fav))ACP.rs.al=fav}
if(typeof render==="function"){const faRender=render;render=function(){faApply();faFreeApply();faWatchChoice();faTheme();return faRender.apply(this,arguments)}}

/* voos RPL da Escala: só os da favorita, com "Ver todas as companhias" (o filtro não mexe no mapa nem na regra do modo RPL) */
FA.rplAll=false;
const faRplFav=()=>{const fav=myFavAirline();if(!fav||FA.rplAll||typeof FL!=="undefined"&&FL.mode==="freelancer")return"";return typeof fleet!=="undefined"&&fleet.some(a=>a.airline===fav)?fav:""};
function faRplBar(fav,on,total){if(!myFavAirline()||typeof FL!=="undefined"&&FL.mode==="freelancer")return"";const al=esc(myFavAirline());
  return`<div class="fa-rpl-bar">${faSym(myFavAirline())}<span>${on?fat("fa_rpl_only",{al}):fat("fa_rpl_allon")}</span><button type="button" class="btn small" data-action="fa-rpl-all">${on?fat("fa_rpl_all"):fat("fa_rpl_back",{al})}</button></div>`}
if(typeof rsPfHTML==="function"){const faPf=rsPfHTML;rsPfHTML=function(list){const fav=faRplFav();
  if(typeof opsRosterAirline==="function"&&opsRosterAirline())return faPf.call(this,list);
  if(!fav)return(FA.rplAll&&myFavAirline()?faRplBar("",false):"")+faPf.call(this,list);
  const mine=list.filter(x=>x.al===fav);
  if(!mine.length)return faRplBar(fav,true)+`<div class="fa-rpl-none"><p>${fat("fa_rpl_none",{al:esc(fav),n:list.length})}</p></div>`;
  return faRplBar(fav,true)+faPf.call(this,RS.pf&&!mine.some(x=>pfKey(x)===pfKey(RS.pf))?[RS.pf,...mine]:mine)}}
/* contagem "X voos RPL" do aeródromo segue o mesmo filtro */
if(typeof rsDepInfoHTML==="function"){const faDi=rsDepInfoHTML;rsDepInfoHTML=function(){const fav=faRplFav();if(!fav)return faDi.apply(this,arguments);
  const orig=rsSoonFlights;rsSoonFlights=d=>{const l=orig(d),m=l.filter(x=>x.al===fav);return m.length?m:l};try{return faDi.apply(this,arguments)}finally{rsSoonFlights=orig}}}
document.addEventListener("click",e=>{if(!e.target.closest('[data-action="fa-rpl-all"]'))return;e.preventDefault();FA.rplAll=!FA.rplAll;if(typeof rsRepaintDep==="function"&&document.getElementById("rs-acf"))rsRepaintDep();else render()});

/* cores da companhia favorita nos menus (opcional): variáveis de cor aplicadas no :root, respeitando o tema claro/escuro */
const FA_VARS=["--accent","--accent-ink","--on-accent","--accent-soft","--side","--side-ink","--side-muted","--side-hi","--side-line","--side-title","--side-acc"];
const faHex=h=>{h=String(h||"").replace("#","");if(h.length===3)h=h.split("").map(c=>c+c).join("");const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255]};
const faToHex=c=>"#"+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
const faMix=(a,b,t)=>{const x=faHex(a),y=faHex(b);return faToHex(x.map((v,i)=>v*(1-t)+y[i]*t))};
const faLum=h=>{const c=faHex(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const faContrast=(a,b)=>{const x=faLum(a),y=faLum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
function faPalette(al,dark){const L=typeof LIVERY!=="undefined"&&LIVERY[al];if(!L)return null;let p=L[0],q=L[1]||L[0];
  if(faLum(p)>.75&&faLum(q)<faLum(p))[p,q]=[q,p];                       /* cor principal muito clara: usa a outra */
  /* fundos de página possíveis (todas as paletas) para garantir contraste em qualquer combinação */
  const BG=dark?["#151F29","#1B1B1A","#111A23","#0E161E","#111111"]:["#FFFFFF","#FBFCFD","#F2F2F0","#E8ECF0","#F1F4F7"];
  const minC=(c,list)=>Math.min(...list.map(x=>faContrast(c,x)));
  const push=(c,toward,ok)=>{let t=0,x=c;while(!ok(x)&&t<1){t+=.04;x=faMix(c,toward,t)}return x};
  /* destaque: visível como texto, borda e ícone sobre qualquer fundo (≥ 3:1) */
  const acc=push(p,dark?"#ffffff":"#000000",x=>minC(x,BG)>=3);
  /* texto sobre o destaque: o que tiver mais contraste (sempre ≥ 4,5:1) */
  const ink=faContrast(acc,"#ffffff")>=faContrast(acc,"#111111")?"#ffffff":"#111111";
  /* fundo suave: o texto normal e o próprio destaque continuam legíveis sobre ele */
  const soft=push(dark?faMix(acc,"#151F29",.72):faMix(acc,"#ffffff",.84),dark?"#0b0f14":"#ffffff",x=>faContrast(x,dark?"#E3E9EF":"#1A1A1A")>=7&&faContrast(acc,x)>=2.6&&faContrast(x,dark?"#A3A39B":"#666660")>=4.6&&faContrast(x,dark?"#93A3B3":"#5A6A7B")>=4.6);
  /* menu lateral escuro na cor da companhia */
  const D="#0b0f14",SI="#E6EAF0";const side=push(faMix(p,D,.78),D,x=>faContrast(SI,x)>=8);
  const hi=push(faMix(p,D,.6),D,x=>faContrast(SI,x)>=6),line=faMix(p,D,.68);
  const sa=push(q===p?faMix(p,"#ffffff",.3):q,"#ffffff",x=>faContrast(x,side)>=4.5&&faContrast(x,hi)>=4.5);
  const sm=push(faMix(SI,side,.42),SI,x=>faContrast(x,side)>=4.5);
  return{"--accent":acc,"--accent-ink":ink,"--on-accent":ink,"--accent-soft":soft,"--side":side,"--side-ink":SI,"--side-muted":sm,"--side-hi":hi,"--side-line":line,"--side-title":"#ffffff","--side-acc":sa}}
FA.themeKey="";
/* cores do app (todos os menus e submenus) = a companhia com que o piloto vai voar.
   Sempre que ele escolhe uma companhia ou aeronave para voar (Escala livre ou RPL, Frota › Escolher voo,
   aeronaves no aeródromo, Mapa › saída RPL, reserva), essa escolha passa a valer para o site inteiro e fica salva
   (continua depois de recarregar a página) até ele escolher outra. Sem escolha salva: a escala aceita em andamento; senão, a favorita. */
const faFlyKey=()=>"vfr-fly-al:"+(typeof myId!=="undefined"?myId:"");
function faGetFly(){let v=FA.fly||"";try{v=localStorage.getItem(faFlyKey())||v}catch(e){}return v}
function faSetFly(al){if(!al||al==="all"||typeof LIVERY==="undefined"||!LIVERY[al])return;FA.fly=al;try{localStorage.setItem(faFlyKey(),al)}catch(e){}FA.themeKey="";try{faTheme()}catch(e){}}
const faAcAl=id=>{const a=id&&typeof acById==="function"?acById(id):null;return a&&a.airline||""};
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-action]");if(!el)return;const a=el.dataset.action,d=el.dataset;
  if(!["alpick-pick","acp-pick","rs-pf","go-roster","rs-ac-go","rdi-al","map-rpl","rs-dep-go"].includes(a))return;
  setTimeout(()=>{let al="";
    if(a==="alpick-pick"){if(d.k==="rs"||d.k==="bk")al=d.v}
    else if(a==="acp-pick")al=faAcAl(d.id);
    else if(a==="go-roster"||a==="rs-ac-go")al=faAcAl(d.ac||d.id);
    else if(a==="rdi-al")al=d.v;
    else if(a==="rs-pf"||a==="map-rpl")al=faAcAl(RS.ac)||(RS.pf&&RS.pf.al)||"";
    if(al)faSetFly(al)},0)});
/* escolhas feitas por outros caminhos também contam: voo RPL escolhido (lista, mapa ou seleção automática),
   escala gerada e escala aceita */
FA.seen={pf:"",roster:""};
function faWatchChoice(){if(typeof RS==="undefined")return;try{
  const pf=RS.pf&&!RS.other?(RS.pf.al+"|"+(typeof pfKey==="function"?pfKey(RS.pf):"")):"";if(pf&&pf!==FA.seen.pf){FA.seen.pf=pf;faSetFly(faAcAl(RS.ac)||RS.pf.al)}else if(!pf)FA.seen.pf="";
  const ro=RS.roster?String(RS.roster.acId)+"|"+(RS.roster.legs&&RS.roster.legs[0]&&RS.roster.legs[0].std):"";if(ro&&ro!==FA.seen.roster){FA.seen.roster=ro;faSetFly(faAcAl(RS.roster.acId))}else if(!ro)FA.seen.roster=""}catch(e){}}
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest('[data-action="rs-accept"]');if(el&&RS.roster)faSetFly(faAcAl(RS.roster.acId))},true);
document.addEventListener("change",e=>{if(e.target&&e.target.id==="bk-ac"){const al=faAcAl(e.target.value);if(al)faSetFly(al)}});
// Menu colors follow the Profile preference, independently of flights and aircraft.
function faThemeAirline(){return myFavAirline()}
function faTheme(){const r=document.documentElement,fav=faThemeAirline(),on=!!(session&&myFavColors()&&myFavAirline()&&fav),dark=typeof isDark==="function"?isDark():false;
  const key=on?fav+"|"+dark:"";if(key===FA.themeKey)return;FA.themeKey=key;
  const P=on?faPalette(fav,dark):null;if(!P){FA_VARS.forEach(v=>r.style.removeProperty(v));r.removeAttribute("data-fav-colors");return}
  for(const v of FA_VARS)r.style.setProperty(v,P[v]);r.setAttribute("data-fav-colors",fav)}
new MutationObserver(()=>{FA.themeKey="";faTheme()}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{FA.themeKey="";faTheme()})}catch(e){}

/* contraste das cores das companhias: matrícula e selo da companhia usam texto claro ou escuro conforme o que for legível */
const faInkOn=bg=>{try{const w=faContrast(bg,"#ffffff"),d=faContrast(bg,"#0B0F17");return w>=4.5||w>=d?"#FFFFFF":"#0B0F17"}catch(e){return"#FFFFFF"}};
if(typeof plateStyle==="function"){const faPlate=plateStyle;plateStyle=function(al){const L=typeof LIVERY!=="undefined"&&LIVERY[al];const s=faPlate.apply(this,arguments);if(!L||!s)return s;return s.replace(/color:#[0-9A-Fa-f]{6}/,"color:"+faInkOn(L[0]))}}
if(typeof alLogo==="function"){const faLogo=alLogo;alLogo=function(al){const s=faLogo.apply(this,arguments);const L=(typeof LIVERY!=="undefined"&&LIVERY[al])||["#5B6573"];return s.replace(/(<span class="al-badge" style="background:[^;"]+)/,"$1;color:"+faInkOn(L[0]))}}
if(typeof rsRepaintDep==="function"){const faRep=rsRepaintDep;rsRepaintDep=function(){const r=faRep.apply(this,arguments);try{faTheme()}catch(e){}return r}}

/* Ajustes: mostra a versão do app em uso (ajuda a conferir se a publicação mais recente já chegou ao navegador) */
async function faShowVersion(){try{const host=document.getElementById("palette");if(!host)return;let el=document.getElementById("app-ver");
  if(!el){el=document.createElement("div");el.id="app-ver";el.className="hint app-ver";host.after(el)}
  let v="";if(window.caches&&caches.keys){const k=(await caches.keys()).filter(x=>/^vfr-v\d+$/.test(x)).sort((a,b)=>+b.slice(5)-+a.slice(5));v=k[0]||""}
  if(!v){const n=[...document.querySelectorAll("script[src*='?v='],link[href*='?v=']")].map(e=>+((e.getAttribute("src")||e.getAttribute("href")).match(/[?&]v=(\d+)/)||[])[1]||0);const m=Math.max(0,...n);if(m)v="vfr-v"+m}
  if(window.vfrNative&&typeof window.vfrNative.version==="function"){try{const dv=await window.vfrNative.version();if(dv)v=(v?v.replace("vfr-v","")+" · ":"")+"Windows "+dv}catch(e){}}
  el.textContent=(LANGS.indexOf(lang)===1?"Versão do app: ":"App version: ")+(v?v.replace("vfr-v",""):"—")+(window.vfrNative&&window.vfrNative.platform==="android"?" · Android":"")}catch(e){}}
setTimeout(faShowVersion,1500);document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#foot-btn"))setTimeout(faShowVersion,50)});

/* Frota: ao abrir o menu, já vem filtrada pela companhia favorita do piloto (região dela + a companhia).
   O piloto pode trocar o filtro; ao sair e voltar para a Frota, a favorita volta a vir selecionada. */
if(typeof fleetOpenHomeRegion==="function"){const faFleetHome=fleetOpenHomeRegion;fleetOpenHomeRegion=function(){
  const fav=myFavAirline();
  if(fav&&typeof fleet!=="undefined"&&fleet.some(a=>a.airline===fav)&&typeof view!=="undefined"&&view==="fleet"){
    if(typeof fleetGeoVersion!=="undefined")fleetGeoVersion++;
    fRegion=typeof regionOf==="function"?regionOf(fav):"all";fAirline=fav;fStatus="all";fQuery="";fLimit=60;fFav=false;
    try{if(typeof selAc!=="undefined"&&selAc){const a=acById(selAc);if(!a||a.airline!==fav)selAc=(fleet.find(x=>x.airline===fav&&isFav(x.id))||{}).id||selAc}}catch(e){}
    render();return Promise.resolve()}
  return faFleetHome.apply(this,arguments)}}
