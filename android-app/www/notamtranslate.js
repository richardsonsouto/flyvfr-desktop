/* On-demand translation: retain the original NOTAM and never send pilot data. */
const NOTAM_TRANSLATIONS=new Map();
function notamTextModesHTML(n){return `<div class="notam-text-modes" data-source="${esc(n.e||n.raw||'')}" data-language="${esc(lang==='zh'?'zh-CN':lang)}"><div class="seg" role="group" aria-label="NOTAM"><button type="button" data-action="notam-text-mode" data-mode="original" aria-pressed="true">${esc(t('notam_mode_original'))}</button><button type="button" data-action="notam-text-mode" data-mode="translated" aria-pressed="false">${esc(t('notam_translated'))}</button></div><p class="ntm-e notam-mode-original">${notamHi(n.e||n.raw||'')}</p><div class="notam-mode-translated" aria-live="polite" hidden></div></div>`}

document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-action="notam-text-mode"]');if(!button)return;
 event.preventDefault();const box=button.closest('.notam-text-modes'),original=box.querySelector('.notam-mode-original'),output=box.querySelector('.notam-mode-translated'),translated=button.dataset.mode==='translated';
 box.querySelectorAll('[data-action="notam-text-mode"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 original.hidden=translated;output.hidden=!translated;if(!translated||output.dataset.loaded==='true'||output.dataset.loading==='true')return;
 output.dataset.loading='true';output.textContent=t('notam_translating');
 try{const result=await notamTranslate(box.dataset.source,box.dataset.language);output.textContent=result+'\n\n'+t('notam_translation_note');output.dataset.loaded='true'}
 catch(error){output.textContent=t('notam_translation_error')}
 finally{delete output.dataset.loading}
});
function notamReadableEnglish(text){
  const words={RWY:'runway',TWY:'taxiway',CLSD:'closed',CLSDD:'closed','U/S':'unserviceable',WIP:'work in progress',AD:'aerodrome',APRON:'apron',OBST:'obstacle',OBSTL:'obstacle',LGT:'lighting',LGTS:'lights',AVBL:'available',UNAVBL:'unavailable',BTN:'between',EXC:'except',ACFT:'aircraft',TKOF:'takeoff',LDG:'landing',TFC:'traffic',THR:'threshold',DISPL:'displaced',DLY:'daily',HJ:'daytime',HN:'nighttime',SR:'sunrise',SS:'sunset',SFC:'surface',GND:'ground',AMSL:'above mean sea level',AGL:'above ground level',PSN:'position',ELEV:'elevation',HGT:'height',RVR:'runway visual range',VIS:'visibility',TEMPO:'temporary',MAINT:'maintenance',CONST:'construction',DUE:'due',PPR:'prior permission required',PN:'prior notice',OPR:'operating',HR:'hours',HRV:'hours of service',STOPBAR:'stop bar',REIL:'runway end identifier lights',RCLL:'runway centreline lights',REDL:'runway edge lights',RTZL:'runway touchdown zone lights'};
  return String(text).replace(/\b[A-Z][A-Z/]*\b/g,word=>words[word]||word);
}
function notamTranslationChunks(text){
  const encoder=new TextEncoder(),chunks=[];let chunk='';
  for(const word of text.split(/\s+/).filter(Boolean)){
    if(encoder.encode(word).length>480){if(chunk){chunks.push(chunk);chunk=''}let part='';for(const ch of word){if(encoder.encode(part+ch).length>480){chunks.push(part);part=''}part+=ch}if(part)chunks.push(part);continue}
    const next=chunk?chunk+' '+word:word;if(encoder.encode(next).length>480){chunks.push(chunk);chunk=word}else chunk=next;
  }
  if(chunk)chunks.push(chunk);return chunks;
}
async function notamTranslate(text,target){
  const readable=notamReadableEnglish(text);if(target==='en')return readable;
  const key=JSON.stringify([target,readable]);if(NOTAM_TRANSLATIONS.has(key))return NOTAM_TRANSLATIONS.get(key);
  const request=(async()=>{const parts=[];for(const chunk of notamTranslationChunks(readable)){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{const response=await fetch('https://api.mymemory.translated.net/get?'+new URLSearchParams({q:chunk,langpair:'en|'+target}),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw Error('Translation unavailable');const result=await response.json();
      if(Number(result.responseStatus)!==200||result.quotaFinished||typeof result.responseData?.translatedText!=='string'||!result.responseData.translatedText.trim())throw Error('Translation unavailable');
      parts.push(result.responseData.translatedText);
    }finally{clearTimeout(timer)}
  }return parts.join(' ')})();
  NOTAM_TRANSLATIONS.set(key,request);try{const translated=await request;if(NOTAM_TRANSLATIONS.size>100)NOTAM_TRANSLATIONS.delete(NOTAM_TRANSLATIONS.keys().next().value);return translated}catch(error){NOTAM_TRANSLATIONS.delete(key);throw error}
}
function notamTranslationHTML(n){return `<div class="notam-translation" data-source="${esc(n.e||n.raw||'')}" data-language="${esc(lang==='zh'?'zh-CN':lang)}"><button class="btn small" type="button" data-action="notam-translate" aria-expanded="false">${esc(t('notam_translate'))}</button><div class="notam-translation-result" aria-live="polite" hidden></div></div>`}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action="notam-translate"]');if(!button)return;event.preventDefault();event.stopPropagation();
  const box=button.closest('.notam-translation'),output=box.querySelector('.notam-translation-result');
  if(button.getAttribute('aria-expanded')==='true'){output.hidden=true;button.setAttribute('aria-expanded','false');button.textContent=t('notam_translate');return}
  output.hidden=false;button.setAttribute('aria-expanded','true');button.disabled=true;output.textContent=t('notam_translating');
  try{const translated=await notamTranslate(box.dataset.source,box.dataset.language);output.textContent=translated+'\n\n'+t('notam_translation_note');button.textContent=t('notam_original')}
  catch(error){output.textContent=t('notam_translation_error');button.setAttribute('aria-expanded','false');button.textContent=t('notam_translate')}
  finally{button.disabled=false}
});
