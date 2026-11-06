/* Social sign-in: provider credentials stay in Supabase, never in the app. */
(function(){
 const state={checked:false,pending:false,busy:false,external:{}};
 const text={
 continue:['Continue with {name}','Continuar com {name}','Continuar con {name}','Continuer avec {name}','Mit {name} fortfahren','{name}で続行','使用{name}继续','{name}(으)로 계속'],
 or:['or use your email','ou use seu e-mail','o usa tu correo','ou utilisez votre e-mail','oder E-Mail verwenden','またはメールで','或使用电子邮箱','또는 이메일 사용'],
 soon:['Social sign-in will be available soon. You can use email and password.','O acesso com essas contas estará disponível em breve. Você pode usar e-mail e senha.','El acceso social estará disponible pronto. Puedes usar correo y contraseña.','La connexion sociale sera bientôt disponible. Utilisez e-mail et mot de passe.','Die Anmeldung mit diesen Konten ist bald verfügbar. E-Mail und Passwort bleiben verfügbar.','ソーシャルログインは近日公開です。メールとパスワードをご利用ください。','第三方账号登录即将开放。可使用邮箱和密码。','소셜 로그인은 곧 제공됩니다. 이메일과 비밀번호를 사용하세요.'],
 unavailable:['Unable to check social sign-in. Please use email and password or try again later.','Não foi possível verificar o acesso com essas contas. Use e-mail e senha ou tente novamente depois.','No se pudo verificar el acceso social. Usa correo y contraseña o inténtalo más tarde.','Impossible de vérifier la connexion sociale. Utilisez e-mail et mot de passe ou réessayez.','Die Anmeldung konnte nicht geprüft werden. E-Mail und Passwort verwenden oder später versuchen.','ログインを確認できません。メールとパスワードをご利用ください。','无法检查第三方登录。请使用邮箱和密码或稍后重试。','소셜 로그인을 확인할 수 없습니다. 이메일과 비밀번호를 사용하세요.'],
 error:['Sign-in was not completed. Please try again.','O acesso não foi concluído. Tente novamente.','No se completó el acceso. Inténtalo de nuevo.','Connexion non terminée. Réessayez.','Anmeldung nicht abgeschlossen. Bitte erneut versuchen.','ログインが完了しませんでした。再試行してください。','登录未完成，请重试。','로그인이 완료되지 않았습니다. 다시 시도하세요.'],
 native:['Use email and password in this version of the installed app.','Nesta versão do aplicativo instalado, use e-mail e senha.','En esta versión de la aplicación instalada, usa correo y contraseña.','Dans cette version installée, utilisez e-mail et mot de passe.','In dieser App-Version bitte E-Mail und Passwort verwenden.','このアプリ版ではメールとパスワードをご利用ください。','此安装版请使用邮箱和密码。','이 설치 버전에서는 이메일과 비밀번호를 사용하세요.']};
 const st=(key,name)=>(text[key][LANGS.indexOf(lang)]||text[key][0]).replace('{name}',name||'');
 const native=()=>!!window.vfrNative||!/^https?:$/.test(location.protocol);
 const google='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84v-2.6H3.05a10 10 0 0 0 0 9.04Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.48l3.35 2.6A5.98 5.98 0 0 1 12 5.96Z"/></svg>';
 const microsoft='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f25022" d="M2 2h9v9H2z"/><path fill="#7fba00" d="M13 2h9v9h-9z"/><path fill="#00a4ef" d="M2 13h9v9H2z"/><path fill="#ffb900" d="M13 13h9v9h-9z"/></svg>';
 function paint(){const form=document.getElementById('f-auth');if(!form||!['signup','signin'].includes(authMode))return;
 let host=form.querySelector('.social-auth');if(!host){host=document.createElement('div');host.className='social-auth';const notice=form.querySelector('.notice');(notice||form.querySelector('p')).after(host)}
 host.innerHTML=`<div class="social-buttons">${[['google','Google',google],['azure','Microsoft',microsoft]].map(([id,name,icon])=>`<button type="button" class="btn social-button" data-social-provider="${id}" ${native()||!state.checked||!state.external[id]||state.busy?'disabled':''}>${icon}<span>${esc(st('continue',name))}</span></button>`).join('')}</div><p class="hint social-status" role="status">${esc(native()?st('native'):state.checked&&!state.external.google&&!state.external.azure?st(state.failed?'unavailable':'soon'):'')}</p><div class="social-divider"><span>${esc(st('or'))}</span></div>`;
 if(!state.checked&&!state.pending&&!native())refresh();
 }
 async function refresh(){if(state.pending)return;state.pending=true;state.failed=false;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{if(!CFG.supabaseUrl||!CFG.supabaseAnonKey)throw Error('config');const response=await fetch(CFG.supabaseUrl+'/auth/v1/settings',{headers:{apikey:CFG.supabaseAnonKey},signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('settings');const settings=await response.json();state.external={google:settings.external?.google===true,azure:settings.external?.azure===true}}
 catch{state.failed=true;state.external={}}
 finally{clearTimeout(timer);state.checked=true;state.pending=false;paint()}
 }
 async function start(provider){if(!['google','azure'].includes(provider)||state.busy||native()||!state.external[provider])return;state.busy=true;authMsg=null;paint();
 try{const options={redirectTo:location.origin+location.pathname};if(provider==='azure')options.scopes='email';else options.scopes='openid email profile';const {error}=await sb.auth.signInWithOAuth({provider,options});if(error)throw error}
 catch{authMsg={ok:false,text:st('error')};paintAuth()}
 finally{state.busy=false;paint()}
 }
 const authPaint=paintAuth;paintAuth=function(){authPaint.apply(this,arguments);paint()};
 document.addEventListener('click',event=>{const b=event.target.closest('[data-social-provider]');if(b){event.preventDefault();if(!b.disabled)start(b.dataset.socialProvider)}});
 // OAuth errors arrive in the URL; never inject provider-supplied messages into the UI.
 try{const q=new URLSearchParams(location.search),h=new URLSearchParams(location.hash.slice(1));if(q.has('error')||h.has('error')){authMode='signin';authMsg={ok:false,text:st('error')};for(const key of ['error','error_code','error_description'])q.delete(key);history.replaceState(null,'',location.pathname+(q.size?'?'+q:'')+(h.has('error')?'':location.hash))}}catch{}
 const baseRender=render;render=function(){const result=baseRender.apply(this,arguments);const provider=session?.user?.app_metadata?.provider;
 if(['google','azure'].includes(provider)&&!recovering&&!booting&&typeof FL!=='undefined'&&FL.loaded&&FL.mode&&typeof mySims==='function'&&!mySims().length&&!document.getElementById('f-sims')&&!document.querySelector('#sheet-root:not([hidden])'))sheetMySims();return result};
 window.socialAuthRefresh=refresh;
})();
