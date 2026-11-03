/* Teste visual do Virtual Flight Report — roda todas as telas principais em vários tamanhos, temas e idiomas e
   procura: erro de JavaScript, rolagem para o lado, tela da Escala que não cabe na altura (≥ 761 px), lista aberta
   saindo da tela, rótulos do satélite sobrepostos e botões com texto cortado.
   Uso:  node tests/visual/run.cjs <pasta do site> [pasta de saída]
   Sai com código 1 se encontrar algum problema (os avisos não reprovam). Dados de teste: Supabase falso, relógio fixo. */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(process.argv[2]||'android-app/www'),OUT=path.resolve(process.argv[3]||'test-results/visual');fs.mkdirSync(OUT,{recursive:true});
const TYPES={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s)});
const MOCK=`window.__ins=[];window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{},updateUser:async(o)=>({data:{user:{id:"u1",email:"a@b",user_metadata:o.data}},error:null})},
 functions:{invoke:async()=>({data:null,error:{message:"x"}})},
 from:(tb)=>{const q={eq(){return q},gte(){return q},lte(){return q},gt(){return q},lt(){return q},in(){return q},neq(){return q},is(){return q},not(){return q},or(){return q},filter(){return q},contains(){return q},overlaps(){return q},order(){return q},range(){return Promise.resolve({data:null,error:{message:"mock"}})},limit(){return Promise.resolve({data:[],error:null})},maybeSingle(){return Promise.resolve({data:null,error:null})},single(){return Promise.resolve({data:{id:"new"},error:null})},ilike(){return Promise.resolve({data:[],error:null})},select(){return q},then(r){r({data:[],error:null})}};
   return{select:()=>q,insert:(o)=>{__ins.push([tb,'ins',o]);return{select:()=>({single:async()=>({data:{id:"r-new"},error:null})}),then(r){r({error:null})}}},update:(o)=>{__ins.push([tb,'upd',o]);return q},delete:()=>{__ins.push([tb,'del']);return q},upsert:async()=>({error:null})}},
 rpc:async(n)=>({data:n==='roster_rolls_left'||n==='roster_roll'?-1:{cancelled:0},error:null}),channel:()=>({on(){return this},subscribe(){return this}}),removeChannel(){}})}`;

const VIEWPORTS=[[1280,600],[1366,657],[1920,960],[390,800]],THEMES=['light','dark'],LANGS_T=['pt','en'];
const PNG1='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
async function open(b,w,h,theme,lg,port){const p=await b.newPage({viewport:{width:w,height:h},serviceWorkers:'block'});await p.clock.install({time:new Date('2026-10-25T17:12:00Z')});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(t=>{try{localStorage.setItem('vfr-theme',t)}catch(e){}},theme);
  await p.route(/supabase-js/,r=>r.fulfill({contentType:'application/javascript',body:MOCK}));
  await p.route(/fonts\.g|planespotters|basemaps|kiwi|avs\.io|google\.com|gstatic|arcgisonline|aviationweather|redemet|faa\.gov|youtube/,r=>{const u=r.request().url();return /gstatic|arcgisonline/.test(u)?r.fulfill({contentType:'image/png',body:Buffer.from(PNG1,'base64')}):r.abort()});
  if(process.env.LEAFLET_DIR)await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/leaflet/,r=>{const u=r.request().url();r.fulfill({path:path.join(process.env.LEAFLET_DIR,u.endsWith('.css')?'leaflet.css':'leaflet.js')})});
  await p.goto(`http://localhost:${port}/`);await p.waitForTimeout(700);
  await p.evaluate(()=>{const H=36e5,now=Date.now();setFormats&&setFormats();myId="u1";session={user:{id:"u1",email:"a@b",user_metadata:{sims:["msfs2024"],simbrief:"richpilot"}}};db=true;canWrite=true;loaded.fleets=true;loaded.aircraft=true;isAdmin=false;
    names.u1="Capt. Daniel Reis";names.u2="Marina Costa";names.u3="John Weber";
    const ac=[["PR-XMA","Boeing 737 MAX 8","GOL",""],["PR-XMB","Boeing 737 MAX 8","GOL",""],["PR-AXH","Airbus A320neo","Azul",""],["CS-TUB","Airbus A330-941","TAP Air Portugal",""],["D-AIXA","Airbus A350-941","Lufthansa",""],["N801AN","Boeing 787-8","American Airlines",""],["VH-ZNA","Boeing 787-9","Qantas",""],["PR-GUK","Boeing 737 MAX 8","GOL",""]];
    data.aircraft=ac.map(([r,t,a,b])=>({id:r,registration:r,type:t,airline:a,base:b}));rebuildFleet();
    const R=(id,acid,p,dep,arr,s,e,st,extra)=>Object.assign({id,aircraftId:acid,pilotId:p,dep,arr,route:"",flightNo:"",start:now+s*H,end:now+e*H,status:st||"booked",ackAt:null,flightId:null,ferry:false,eventId:null},extra||{});
    data.reservations=[R("r1","PR-XMA","u2","SBGR","SBRJ",-1,1),R("r2","CS-TUB","u3","LPPT","SBGR",-4,5),R("r3","PR-XMB","u1","SBGR","SBPA",1.5,3.5),R("r4","PR-AXH","u1","SBKP","SBCF",20,22,"booked",{eventId:"e1"}),R("r0","PR-GUK","u1","SBGR","SBRJ",-30,-28,"completed")];
    data.flights=[{id:"f1",aircraftId:"PR-GUK",reservationId:"r0",pilotId:"u1",dep:"SBGR",arr:"SBRJ",simulator:"msfs2024",blockMin:75,remarks:"",createdAt:now-27*H},
      ...Array.from({length:12},(_,i)=>({id:"g"+i,aircraftId:["PR-AXH","D-AIXA","N801AN","VH-ZNA"][i%4],reservationId:null,pilotId:"u1",dep:["SBKP","EDDF","KDFW","YSSY"][i%4],arr:["SBSV","KJFK","EGLL","KLAX"][i%4],simulator:"msfs2024",blockMin:[90,520,480,840][i%4],remarks:"",createdAt:now-(100-i)*H}))];
    data.defects=[{id:"d1",aircraftId:"PR-XMB",reporterId:"u2",catalogId:"",ata:21,title:"Pack 2 inoperante",description:"",phase:"cruise",simulator:"msfs2024",outcome:"deferred",repairH:2,deferDays:3,deferredUntil:now+2*864e5,opsProcedure:"Máx FL250",createdAt:now-2*H,voidedAt:null},
      {id:"d2",aircraftId:"D-AIXA",reporterId:"u3",catalogId:"chk-a",ata:5,title:"Check A programado",description:"",phase:"ground",simulator:"msfs2024",outcome:"grounded",repairH:8,createdAt:now-1*H,voidedAt:null}];
    EVENTS=[{id:"e1",title:"Ponte aérea Campinas–Confins",desc:"Saída em grupo às 20h. Use frequência 122.8.",dep:"SBKP",arr:"SBCF",start:now+20*H,createdBy:"u9",createdAt:now-H}];
    view="fleet";render()});

  await p.evaluate(lg=>{lang=lg;LI=LANGS.indexOf(lg);try{setFormats()}catch(e){}session.user.user_metadata.sims=["msfs2024"];session.user.user_metadata.fav_airline="GOL";
    window.__mine=data.reservations.filter(r=>r.pilotId===myId);render()},lg);await p.waitForTimeout(250);return {p,errs}}
/* verificações feitas dentro da página */
const CHECK=(o)=>{try{document.getAnimations().forEach(a=>{try{a.finish()}catch(e){}})}catch(e){}const r={};const W=innerWidth,H=innerHeight;r.hscroll=document.documentElement.scrollWidth>W+1;if(r.hscroll){const d=e=>(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')||e.tagName.toLowerCase();r.wide=[...document.body.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();let a=e.parentElement,sc=false;while(a&&a!==document.body){const ox=getComputedStyle(a).overflowX;if(ox!=='visible'){sc=true;break}a=a.parentElement}return !sc&&b.width>0&&b.right>W+1&&![...e.children].some(c=>c.getBoundingClientRect().right>W+1)}).slice(0,3).map(e=>{const ch=[];let a=e;while(a&&a!==document.body&&ch.length<6){ch.unshift(d(a));a=a.parentElement}return ch.join('>')+' ('+Math.round(e.getBoundingClientRect().right)+'px'+(e.textContent?' "'+e.textContent.trim().slice(0,30)+'"':'')+')'}).join(' | ')}
  if(o.fit&&W>=761){const v=document.querySelector('#view');r.overHeight=v?Math.round(v.getBoundingClientRect().bottom-H):0}
  r.offscreen=[...document.querySelectorAll('.fv-tp-pop:not([hidden]),#ef-liv-pop,.dv-modal .dv-mbox,.cb-modal .cb-box')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&(b.left<-1||b.right>W+1||(o.vfit&&(b.top<-1||b.bottom>H+1)))}).map(e=>e.className);
  const th=[...document.querySelectorAll('.dv-sat .dv-th rect')].map(x=>x.getBoundingClientRect());let ov=0;for(let i=0;i<th.length;i++)for(let j=i+1;j<th.length;j++){const A=th[i],B=th[j];if(A.left<B.right-1&&B.left<A.right-1&&A.top<B.bottom-1&&B.top<A.bottom-1)ov++}r.labelOverlap=ov;
  r.clipped=[...document.querySelectorAll('#view .btn,#view .seg button,.fv-tp-btn,.loc-choose,.rs-mode-card')].filter(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).textOverflow!=='ellipsis').map(e=>e.textContent.trim().slice(0,40));return r};
const S=ms=>new Promise(r=>setTimeout(r,ms));
const STATES=[
 ['fleet',async p=>{await p.evaluate(()=>{view="fleet";render()})},{}],
 ['fleet-type-open',async p=>{await p.evaluate(()=>{view="fleet";render()});await p.click('.tp-type .fv-tp-btn').catch(()=>{})},{vfit:0}],
 ['roster-rpl',async p=>{await p.evaluate(async()=>{data.reservations=data.reservations.filter(r=>r.pilotId!==myId);RPLF.want=false;RS.roster=null;RS.dep="SBRJ";RS.other=false;RS.pf=null;view="roster";render();await new Promise(r=>setTimeout(r,900));document.querySelector('[data-action="rs-pf"]')?.click()})},{fit:1}],
 ['roster-free',async p=>{await p.evaluate(async()=>{RPLF.want=false;RS.roster=null;RS.dep="SBRJ";RS.other=true;ACP.rs.al="GOL";RS.ac="PR-GUK";view="roster";render();await new Promise(r=>setTimeout(r,900))})},{fit:1}],
 ['roster-liveries',async p=>{await p.evaluate(()=>{[...document.querySelectorAll('.ef-liv-t')].find(x=>x.offsetParent)?.click()})},{fit:1,vfit:1}],
 ['roster-back',async p=>{await p.evaluate(async()=>{document.body.click();document.getElementById('f-rs')?.requestSubmit();await new Promise(r=>setTimeout(r,4500))})},{fit:1}],
 ['roster-adjust',async p=>{await p.evaluate(async()=>{document.querySelector('[data-action="rf-adjust"]')?.click();await new Promise(r=>setTimeout(r,1200))})},{fit:1}],
 ['logbook',async p=>{await p.evaluate(()=>{view="logbook";lbTab="mine";render()})},{}],
 ['badge',async p=>{await p.evaluate(()=>{document.querySelector('[data-action="cb-open"]')?.click()})},{vfit:0}],
 ['ranking',async p=>{await p.evaluate(()=>{document.querySelector('.cb-modal')?.remove();view="logbook";lbTab="ranking";render()})},{}],
 ['briefing',async p=>{await p.evaluate(()=>{RS.roster=null;data.reservations=data.reservations.filter(r=>r.pilotId!==myId).concat(window.__mine.map(r=>r.id==="r3"?Object.assign(r,{rosterId:"ro1",flightNo:"G3 1234"}):r));view="briefing";render();BRF.section="wx";render()})},{}],
 ['briefing-aircraft',async p=>{await p.evaluate(()=>{BRF.section="aircraft";render()})},{}]];
(async()=>{await new Promise(r=>srv.listen(0,r));const port=srv.address().port;const b=await chromium.launch();const fails=[],warns=[];let n=0;
 for(const [w,h] of VIEWPORTS)for(const theme of THEMES)for(const lg of LANGS_T){if(lg!=='pt'&&theme==='dark')continue;
  const {p,errs}=await open(b,w,h,theme,lg,port);
  for(const [name,act,o] of STATES){try{await act(p);await S(500);const r=await p.evaluate(CHECK,o);n++;const tag=`${name} ${w}x${h} ${theme} ${lg}`;
    if(r.hscroll)fails.push(tag+': rolagem para o lado'+(r.wide?' — '+r.wide:''));if(r.overHeight>0)fails.push(tag+`: Escala passa ${r.overHeight}px da altura da janela`);
    if(r.offscreen.length)fails.push(tag+': lista/janela fora da tela ('+r.offscreen.join(', ')+')');if(r.labelOverlap)fails.push(tag+`: ${r.labelOverlap} rótulo(s) do satélite sobrepostos`);
    if(r.clipped.length)warns.push(tag+': texto cortado em botão: '+r.clipped.join(' | '));
    await p.screenshot({path:path.join(OUT,`${name}_${w}x${h}_${theme}_${lg}.png`)})}catch(e){fails.push(`${name} ${w}x${h} ${theme} ${lg}: falhou ao abrir (${e.message.split('\n')[0]})`)}}
  for(const e of new Set(errs))fails.push(`${w}x${h} ${theme} ${lg}: erro de JavaScript: ${e}`);await p.close()}
 await b.close();srv.close();
 const rep={checked:n,fails,warns};fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(rep,null,1));
 console.log(`Teste visual: ${n} telas verificadas · ${fails.length} problema(s) · ${warns.length} aviso(s)`);fails.forEach(f=>console.log('✗ '+f));warns.slice(0,40).forEach(f=>console.log('! '+f));
 process.exit(fails.length?1:0)})();
