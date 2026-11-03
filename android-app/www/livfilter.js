/* livfilter.js — Ao escolher a matrícula que vai voar (Escala livre, Escala RPL e Reserva), só aparecem as matrículas
   que têm pintura para o(s) simulador(es) do piloto (Meus simuladores). Sem simulador marcado, vale qualquer simulador.
   A lista da Frota continua mostrando tudo (lá é consulta, não escolha). Enquanto as pinturas carregam, não filtra. */
(function(){
 const T={note:["Only registrations with a livery for {s}","Só matrículas com pintura para {s}","Solo matrículas con librea para {s}","Seulement les immatriculations avec une livrée pour {s}","Nur Kennzeichen mit Lackierung für {s}","{s} 用の塗装がある登録記号のみ","仅显示有 {s} 涂装的注册号","{s}용 도색이 있는 등록번호만"],
  any:["any simulator","qualquer simulador","cualquier simulador","n’importe quel simulateur","beliebigen Simulator","任意のシミュレーター","任意模拟器","모든 시뮬레이터"],
  change:["change","alterar","cambiar","modifier","ändern","変更","更改","변경"]};
 /* campo de busca do seletor: sem o "(ICAO)" no texto (a busca por código do aeroporto continua funcionando) */
 if(typeof L!=="undefined"&&Array.isArray(L.acp_search))L.acp_search=L.acp_search.map(x=>typeof x==="string"?x.replace(/\s*[（(](?:ICAO|OACI)[)）]/g,""):x);
 /* Frota: botão do cartão da aeronave — "Escalar esta aeronave" (abre a Escala livre com ela selecionada) */
 if(typeof L!=="undefined"){L.loc_choose=["Roster this aircraft","Escalar esta aeronave","Programar esta aeronave","Planifier cet avion","Dieses Flugzeug einplanen","この機体でスケジュール","为此飞机排班","이 기체로 스케줄 짜기"];
  L.loc_choose_t=["Opens the free roster with this aircraft selected.","Abre a Escala livre com esta aeronave selecionada.","Abre la programación libre con esta aeronave seleccionada.","Ouvre le planning libre avec cet avion sélectionné.","Öffnet den freien Dienstplan mit diesem Flugzeug.","この機体を選択した状態で自由スケジュールを開きます。","打开自由排班并选中此飞机。","이 기체를 선택한 상태로 자유 스케줄을 엽니다."]}
 const lt=(k,p)=>{let s=(T[k][LANGS.indexOf(lang)]||T[k][0]);if(p)for(const x in p)s=s.split("{"+x+"}").join(p[x]);return s};
 const ready=()=>{if(typeof LIVERIES==="undefined")return false;if(!LIVERIES){try{loadLiveries()}catch(e){}return false}return true};
 const ok=a=>!!a&&myLivOf(a.id).length>0;
 window.livSimOk=a=>!ready()||ok(a);
 /* troca a frota pela frota filtrada só durante a chamada original */
 function withFleet(fn){return function(){if(!ready())return fn.apply(this,arguments);const save=fleet;fleet=save.filter(ok);try{return fn.apply(this,arguments)}finally{fleet=save}}}
 function note(){if(!ready())return"";const m=typeof mySims==="function"?mySims():[];
  const s=m.length?m.map(k=>(typeof SIMS!=="undefined"&&SIMS[k])||k).join(", "):lt("any");
  return`<p class="acp-livnote">🎨 ${esc(lt("note",{s}))} · <button type="button" class="linkish" data-action="my-sims">${esc(lt("change"))}</button></p>`}
 if(typeof acPickListHTML==="function"){const o=withFleet(acPickListHTML);acPickListHTML=function(){return note()+o.apply(this,arguments)}}
 if(typeof rsPfAircraft==="function"){const o=rsPfAircraft;rsPfAircraft=function(){const r=o.apply(this,arguments);return ready()?r.filter(ok):r}}
 if(typeof rdiList==="function"){const o=rdiList;rdiList=function(dep,all){const l=ready()&&Array.isArray(all)?all.filter(ok):all;return(ready()?note():"")+o.call(this,dep,l)}}
 if(typeof aircraftAt==="function"&&typeof acpTop==="function"){const o=acpTop;acpTop=withFleet(o)}
 /* ao mudar os simuladores, a lista aberta se atualiza */
 document.addEventListener("submit",e=>{if(e.target&&e.target.id==="f-sims")setTimeout(()=>{try{render()}catch(x){}},400)});
})();
