/* Globo 3D: visualização alternativa ao mapa 2D na tela "Mapa" — imagem real da Terra (mosaico
   NASA Blue Marble, via Wikimedia Commons, domínio público/CC), gira devagar, o piloto arrasta
   para girar manualmente e usa a roda do mouse / pinça para aproximar. Mostra a frota (por
   aeroporto), os voos em andamento (arco sobre a esfera) e os aeroportos onde as aeronaves estão
   agora. Não é navegação: apenas uma visualização decorativa/informativa. Se a imagem real não
   carregar (sem internet, CDN bloqueado), cai para um globo estilizado desenhado localmente. */
const GLOBE_WORDS={
 to3d:['3D globe','Globo 3D','Globo 3D','Globe 3D','3D-Globus','3D地球儀','3D地球','3D 지구본'],
 to2d:['2D map','Mapa 2D','Mapa 2D','Carte 2D','2D-Karte','2Dマップ','2D地图','2D 지도'],
 err:['3D not supported in this browser.','3D não suportado neste navegador.','3D no compatible con este navegador.','3D non pris en charge par ce navigateur.','3D wird von diesem Browser nicht unterstützt.','このブラウザは3D表示に対応していません。','此浏览器不支持3D显示。','이 브라우저는 3D를 지원하지 않습니다.']
};
function globeT(k){return GLOBE_WORDS[k][LANGS.indexOf(lang)]||GLOBE_WORDS[k][0]}
/* Tenta criar o contexto WebGL com várias combinações de opções, relaxando failIfMajorPerformanceCaveat
   (que faz alguns navegadores recusarem o contexto quando só há renderização por software disponível —
   GPU na lista de bloqueio, aceleração de hardware desativada, VM/área de trabalho remota). */
function globeGetContext(canvas){
 const optsList=[{alpha:true,antialias:true,failIfMajorPerformanceCaveat:false},
  {alpha:true,antialias:false,failIfMajorPerformanceCaveat:false},
  {alpha:true,antialias:false,failIfMajorPerformanceCaveat:false,powerPreference:'low-power'}];
 for(const name of['webgl2','webgl','experimental-webgl']){
  for(const o of optsList){
   try{const gl=canvas.getContext(name,o);if(gl)return gl}catch(e){}
  }
 }
 return null}
let threeP=null;
function loadThree(){if(window.THREE)return Promise.resolve();if(threeP)return threeP;
 threeP=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=()=>ok();s.onerror=()=>{threeP=null;no(new Error('three'))};document.head.appendChild(s)});
 return threeP}
/* Mosaico NASA Blue Marble (Reto Stöckli / Robert Simmon, NASA GSFC), a mesma imagem usada no exemplo
   oficial de globo do three.js — servida pelo próprio pacote npm "three" (mesma versão carregada
   acima) via dois CDNs que sempre enviam cabeçalho CORS, então a textura carrega sem o navegador
   recusar por tainted canvas (o Wikimedia Commons, tentado antes, falhava nessa parte e caía sempre
   no globo estilizado de reserva). Tenta o jsDelivr primeiro e o unpkg como segunda opção. */
const GLOBE_TEXTURE_URLS=[
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/textures/planets/earth_atmos_2048.jpg',
 'https://unpkg.com/three@0.128.0/examples/textures/planets/earth_atmos_2048.jpg'
];
function loadGlobeTexture(){
 const loader=new THREE.TextureLoader();loader.crossOrigin='anonymous';
 const tryUrl=i=>new Promise((resolve,reject)=>{
  if(i>=GLOBE_TEXTURE_URLS.length){reject(new Error('earth-texture'));return}
  loader.load(GLOBE_TEXTURE_URLS[i],tex=>{if('encoding' in tex)tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;resolve(tex)},undefined,()=>resolve(tryUrl(i+1)))
 });
 return tryUrl(0)}
function globeFallbackTexture(){
 const w=1600,h=800,cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');
 ctx.fillStyle='#0d3f63';ctx.fillRect(0,0,w,h);
 const xy=(lon,lat)=>[(lon+180)/360*w,(90-lat)/180*h];
 ctx.fillStyle='#2f6b45';
 const blob=(lon,lat,rx,ry,rot=0)=>{const [x,y]=xy(lon,lat);ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2);ctx.fill();
  if(x-rx<0)ctx.save(),ctx.translate(w,0),ctx.beginPath(),ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2),ctx.fill(),ctx.restore();
  if(x+rx>w)ctx.save(),ctx.translate(-w,0),ctx.beginPath(),ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2),ctx.fill(),ctx.restore()};
 blob(-105,48,165,105); blob(-95,18,70,55); blob(-58,-16,78,150); blob(-70,58,55,45);
 blob(18,52,95,60); blob(20,2,105,165); blob(95,52,235,110); blob(115,15,80,55);
 blob(133,-25,75,45); blob(0,-82,w/2.1,55,0);
 ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=1;
 for(let lon=-180;lon<=180;lon+=30){const [x]=xy(lon,0);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
 for(let lat=-60;lat<=60;lat+=30){const [,y]=xy(0,lat);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.strokeStyle='rgba(255,255,255,.3)';const [,eqY]=xy(0,0);ctx.beginPath();ctx.moveTo(0,eqY);ctx.lineTo(w,eqY);ctx.stroke();
 const tex=new THREE.CanvasTexture(cv);return tex}
const MAP_GLOBE={renderer:null,scene:null,camera:null,group:null,raf:null,container:null,autoSpin:true,dist:255,rot:{y:.4,x:-.15}};
function globeLL(lat,lon,r){const la=lat*Math.PI/180,lo=lon*Math.PI/180;return new THREE.Vector3(r*Math.cos(la)*Math.cos(lo),r*Math.sin(la),-r*Math.cos(la)*Math.sin(lo))}
function globeArc(group,a,b,color){
 const n=36,pts=[];for(let i=0;i<=n;i++){const f=i/n,[lat,lon]=gcPoint(a,b,f),bulge=16*Math.sin(f*Math.PI);pts.push(globeLL(lat,lon,101+bulge))}
 const curve=new THREE.CatmullRomCurve3(pts),geo=new THREE.TubeGeometry(curve,48,.55,6,false);
 group.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color})))}
function globeDot(group,lat,lon,color,size=1.5){
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(size,12,12),new THREE.MeshBasicMaterial({color}));mesh.position.copy(globeLL(lat,lon,101));group.add(mesh);return mesh}
function globeMarkers(group){
 if(typeof mapData!=='function')return;const {groups,flying}=mapData();
 for(const icao of Object.keys(groups)){const ll=apLL(icao);if(!ll)continue;globeDot(group,ll[0],ll[1],0xffb400,1.3+Math.min(2,Math.sqrt(groups[icao].length)*.4))}
 for(const r of flying){const a=apLL(r.dep),b=apLL(r.arr);if(!a||!b)continue;globeArc(group,a,b,0x4fc3f7);
  const f=Math.min(1,Math.max(0,(Date.now()-r.start)/(r.end-r.start))),[lat,lon]=gcPoint(a,b,f);globeDot(group,lat,lon,0xffffff,1.9)}
}
/* Brilho atmosférico (Fresnel) na borda do globo, como num render realista — truque clássico do three.js. */
function globeAtmosphere(radius){
 const material=new THREE.ShaderMaterial({
  uniforms:{},
  vertexShader:`varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec3 vNormal;void main(){float intensity=pow(0.68-dot(vNormal,vec3(0.0,0.0,1.0)),3.2);gl_FragColor=vec4(0.42,0.68,1.0,1.0)*intensity;}`,
  blending:THREE.AdditiveBlending,side:THREE.BackSide,transparent:true,depthWrite:false});
 return new THREE.Mesh(new THREE.SphereGeometry(radius,48,48),material)}
function globeBind(container){
 const G=MAP_GLOBE;let down=false,lx=0,ly=0,moved=false;
 G._pd=e=>{down=true;moved=false;G.autoSpin=false;lx=e.clientX;ly=e.clientY};
 G._pm=e=>{if(!down||!G.group)return;const dx=e.clientX-lx,dy=e.clientY-ly;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;lx=e.clientX;ly=e.clientY;
  G.rot.y+=dx*0.006;G.rot.x=Math.max(-1.3,Math.min(1.3,G.rot.x+dy*0.006));G.group.rotation.y=G.rot.y;G.group.rotation.x=G.rot.x};
 G._pu=()=>{down=false;setTimeout(()=>{if(!moved)G.autoSpin=true},2500)};
 G._wh=e=>{e.preventDefault();G.dist=Math.max(130,Math.min(420,G.dist+e.deltaY*0.2));if(G.camera){G.camera.position.setLength(G.dist)}};
 container.addEventListener('pointerdown',G._pd);container.addEventListener('pointermove',G._pm);
 container.addEventListener('pointerup',G._pu);container.addEventListener('pointerleave',G._pu);
 container.addEventListener('wheel',G._wh,{passive:false})}
function globeLoop(){const G=MAP_GLOBE;if(!G.renderer||!G.group)return;
 if(!G.container?.isConnected){mapGlobeDestroy();return}
 if(G.autoSpin){G.rot.y+=0.0018;G.group.rotation.y=G.rot.y}
 G.renderer.render(G.scene,G.camera);G.raf=requestAnimationFrame(globeLoop)}
function mapGlobeDestroy(){const G=MAP_GLOBE;if(G.raf)cancelAnimationFrame(G.raf);
 if(G.container){for(const [ev,fn] of [['pointerdown',G._pd],['pointermove',G._pm],['pointerup',G._pu],['pointerleave',G._pu],['wheel',G._wh]])if(fn)G.container.removeEventListener(ev,fn)}
 G.ro?.disconnect();if(G.renderer){try{G.renderer.dispose()}catch(e){}try{G.renderer.domElement?.remove()}catch(e){}}
 Object.assign(G,{renderer:null,scene:null,camera:null,group:null,raf:null,container:null,ro:null})}
async function mapGlobeInit(container){
 try{await loadThree()}catch(e){container.innerHTML=`<p class="hint" style="padding:16px">${esc(globeT('err'))}</p>`;return}
 if(!container.isConnected)return;mapGlobeDestroy();const G=MAP_GLOBE;
 const w=container.clientWidth||300,h=container.clientHeight||300;
 /* Alguns navegadores (aceleração de hardware desativada, GPU na lista de bloqueio, VM/área de
    trabalho remota) recusam criar o contexto WebGL com as opções padrão porque ficariam renderizando
    por software. failIfMajorPerformanceCaveat:false permite seguir mesmo assim (mais lento, mas
    funciona) em vez de falhar direto. */
 const canvas=document.createElement('canvas'),gl=globeGetContext(canvas);
 let renderer;
 try{renderer=gl?new THREE.WebGLRenderer({canvas,context:gl,antialias:true,alpha:true}):new THREE.WebGLRenderer({antialias:true,alpha:true})}
 catch(e){container.innerHTML=`<p class="hint" style="padding:16px">${esc(globeT('err'))}</p>`;return}
 if('outputEncoding' in renderer)renderer.outputEncoding=THREE.sRGBEncoding;
 renderer.setSize(w,h);renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 container.innerHTML='';container.appendChild(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(45,w/h,.1,1000);camera.position.set(0,0,G.dist);
 scene.add(new THREE.AmbientLight(0xffffff,.72));
 const sun=new THREE.DirectionalLight(0xffffff,.95);sun.position.set(220,160,220);scene.add(sun);
 const fill=new THREE.DirectionalLight(0xbcd6ff,.22);fill.position.set(-200,-80,-160);scene.add(fill);
 const group=new THREE.Group();group.rotation.y=G.rot.y;group.rotation.x=G.rot.x;scene.add(group);
 let tex;try{tex=await loadGlobeTexture()}catch(e){tex=globeFallbackTexture()}
 if(!container.isConnected)return; /* a tela pode ter mudado enquanto a textura carregava */
 const earth=new THREE.Mesh(new THREE.SphereGeometry(100,96,96),new THREE.MeshPhongMaterial({map:tex,shininess:11,specular:0x1b2c3d}));
 group.add(earth);
 group.add(globeAtmosphere(103));
 globeMarkers(group);
 G.renderer=renderer;G.scene=scene;G.camera=camera;G.group=group;G.container=container;
 globeBind(container);
 const ro=new ResizeObserver(()=>{if(!G.renderer||!G.container?.isConnected)return;const cw=G.container.clientWidth||1,ch=G.container.clientHeight||1;G.renderer.setSize(cw,ch);G.camera.aspect=cw/ch;G.camera.updateProjectionMatrix()});
 ro.observe(container);G.ro=ro;
 globeLoop();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action="map-globe-toggle"]');if(!b||view!=='map')return;
 MAPV.view3d=!MAPV.view3d;render()});
