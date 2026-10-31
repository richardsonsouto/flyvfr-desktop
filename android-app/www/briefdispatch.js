/* Alternate import is briefing-only. Never modifies a reservation or accepted roster. */
const BRIEF_DISPATCH={owner:'',at:0,busy:false,sequence:0,alternates:{},plans:{},error:false};
function briefDispatchOwner(){return myId+'|'+mySimbrief()}
function briefDispatchKey(L){return JSON.stringify([L.key,L.dep,L.arr,L.eobt,L.fno||''])}
function briefDispatchFlightNumber(value,airline){let v=String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(typeof AIRLINE_IATA!=='undefined'&&typeof AIRLINE_ICAO!=='undefined'){const preferred=AIRLINE_IATA[airline];if(preferred&&v.startsWith(preferred)&&/^\d/.test(v.slice(preferred.length))&&AIRLINE_ICAO[airline])return AIRLINE_ICAO[airline]+v.slice(preferred.length);for(const [name,code] of Object.entries(AIRLINE_IATA)){if(v.startsWith(code)&&/^\d/.test(v.slice(code.length))&&AIRLINE_ICAO[name])return AIRLINE_ICAO[name]+v.slice(code.length)}}return v}
function briefDispatchMatches(p,L){
 if(p.dep!==L.dep||p.arr!==L.arr||!Number.isFinite(p.out)||p.out<=0||Math.abs(p.out-L.eobt)>6*3600000)return false;
 const a=acById(L.acId),reg=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(p.fno&&L.fno&&briefDispatchFlightNumber(p.fno,a?.airline)!==briefDispatchFlightNumber(L.fno,a?.airline))return false;
 return !(p.reg&&a?.registration&&reg(p.reg)!==reg(a.registration));
}
function briefDispatchAlternate(L){const D=BRIEF_DISPATCH;if(D.owner!==briefDispatchOwner())return null;const a=D.alternates[L.key];return a?.key===briefDispatchKey(L)?a.code:null}
function briefDispatchNotice(L){
 const D=BRIEF_DISPATCH,alt=briefAlternate(L),sameOwner=D.owner===briefDispatchOwner();
 if(!alt)return `<p class="notice warn brf-alt-notice" id="brf-alt-notice" role="status">${esc(t(sameOwner&&D.busy?'sb_loading':'brf_alt_required_compact'))}</p>`;
 if(sameOwner&&D.error)return `<p class="notice warn brf-alt-notice" role="status">${esc(t('brf_alt_sync_error'))}</p>`;
 let saved=null;try{saved=localStorage.getItem('vfr-brief-alt:'+myId+':'+L.key)}catch(e){}
 return saved===null&&briefDispatchAlternate(L)===alt?`<p class="hint brf-alt-notice">${esc(t('brf_alt_from_simbrief'))}</p>`:'';
}
async function briefDispatchSync(force=false){
 if(view!=='briefing')return;const D=BRIEF_DISPATCH,owner=briefDispatchOwner();
 if(D.owner!==owner){D.owner=owner;D.at=0;D.busy=false;D.error=false;D.alternates={};D.plans={};D.sequence++}
 if(D.busy||!force&&D.at&&Date.now()-D.at<60000)return;
 if(!mySimbrief()){D.alternates={};D.plans={};D.at=Date.now();return}
 const initial=!D.at,before=JSON.stringify([D.alternates,D.plans,D.error]),seq=++D.sequence;D.busy=true;D.error=false;
 try{const plan=await fetchSimbrief();if(seq!==D.sequence||owner!==briefDispatchOwner())return;
  D.plans={};D.alternates={};
  const matches=briefLegs().filter(L=>briefDispatchMatches(plan,L)).sort((a,b)=>Math.abs(a.eobt-plan.out)-Math.abs(b.eobt-plan.out));
  const L=matches[0];if(L&&(!matches[1]||Math.abs(L.eobt-plan.out)<Math.abs(matches[1].eobt-plan.out))){
   D.plans[L.key]={key:briefDispatchKey(L),plan};
   const code=String(plan.alternate||'').toUpperCase();
   if(/^[A-Z0-9]{4}$/.test(code)&&AIRPORTS?.[code]&&code!==L.dep&&code!==L.arr)D.alternates[L.key]={key:briefDispatchKey(L),code};
   else delete D.alternates[L.key];
  }
 }catch(e){if(seq===D.sequence&&owner===briefDispatchOwner())D.error=true}
 finally{if(seq===D.sequence&&owner===briefDispatchOwner()){D.busy=false;D.at=Date.now();if(view==='briefing'&&(initial||before!==JSON.stringify([D.alternates,D.plans,D.error])))render()}}
}
setInterval(()=>{if(view==='briefing'&&!document.hidden)briefDispatchSync()},60000);
function briefDispatchOnReturn(){if(view==='briefing'&&!document.hidden&&Date.now()-BRIEF_DISPATCH.at>5000)briefDispatchSync(true)}
document.addEventListener?.('visibilitychange',briefDispatchOnReturn);
if(typeof window!=='undefined')window.addEventListener('focus',briefDispatchOnReturn);
