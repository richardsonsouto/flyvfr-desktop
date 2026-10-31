/* Static map image: same OSM base and declared weather polygon as the briefing. */
const RWX_CAPTURE_CACHE=new Map();
function routeWeatherCaptureHTML(message,leg){
 const coords=(message.coords||[]).filter(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=85&&Math.abs(p[1])<=180);
 if(coords.length<3)return `<figure class="rwx-capture"><p class="muted">${esc(t('rwx_map_noarea'))}</p></figure>`;
 const route=[leg.dep,leg.arr].map(c=>typeof apLLb==='function'?apLLb(c):null).filter(Boolean),payload={coords,route,label:[message.kind,message.fir,message.hazard].filter(Boolean).join(' · ')};
 return `<figure class="rwx-capture" data-capture="${esc(JSON.stringify(payload))}"><div class="rwx-capture-image" role="status">${esc(t('rwx_map_loading'))}</div><figcaption><span>${esc(t('rwx_map_area'))}</span><button type="button" class="btn small" data-action="brf-route-capture-expand" aria-expanded="false">${esc(t('rwx_map_enlarge'))} ↗</button></figcaption><small>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></small></figure>`;
}
async function routeWeatherCaptureImage(payload){
 const width=700,height=400,size=256,merc=p=>{const lat=p[0]*Math.PI/180;return[(p[1]+180)/360,(1-Math.log(Math.tan(lat)+1/Math.cos(lat))/Math.PI)/2]},points=payload.coords.map(merc),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const zoom=Math.max(2,Math.min(11,Math.floor(Math.log2(Math.min((width-64)/(size*Math.max(maxX-minX,.0001)),(height-64)/(size*Math.max(maxY-minY,.0001))))))),world=size*2**zoom,cx=(minX+maxX)/2*world,cy=(minY+maxY)/2*world,left=cx-width/2,top=cy-height/2,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas');
 const tiles=[];for(let x=Math.floor(left/size);x<=Math.floor((left+width)/size);x++)for(let y=Math.floor(top/size);y<=Math.floor((top+height)/size);y++)tiles.push(new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';const timeout=setTimeout(()=>{image.src='';reject(Error('tile timeout'))},12000);image.onload=()=>{clearTimeout(timeout);ctx.drawImage(image,x*size-left,y*size-top,size,size);resolve()};image.onerror=()=>{clearTimeout(timeout);reject(Error('tile'))};image.src=`https://tile.openstreetmap.org/${zoom}/${((x%2**zoom)+2**zoom)%2**zoom}/${y}.png`}));await Promise.all(tiles);
 ctx.beginPath();points.forEach((p,i)=>{const x=p[0]*world-left,y=p[1]*world-top;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fillStyle='rgba(242,167,35,.25)';ctx.fill();ctx.strokeStyle='#c97413';ctx.lineWidth=2;ctx.stroke();
 if(payload.route.length===2){ctx.beginPath();payload.route.map(merc).forEach((p,i)=>{const x=p[0]*world-left,y=p[1]*world-top;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle='#087da2';ctx.lineWidth=3;ctx.stroke()}
 ctx.font='13px sans-serif';const label=payload.label,box=Math.min(width-20,ctx.measureText(label).width+16);ctx.fillStyle='rgba(255,255,255,.95)';ctx.fillRect(10,10,box,27);ctx.fillStyle='#17202a';ctx.fillText(label,18,28);return canvas.toDataURL('image/png');
}
async function routeWeatherCaptureInit(){
 for(const figure of document.querySelectorAll('.rwx-capture[data-capture]:not([data-started])')){
  figure.dataset.started='true';const key=figure.dataset.capture,host=figure.querySelector('.rwx-capture-image');try{let promise=RWX_CAPTURE_CACHE.get(key);if(!promise){promise=routeWeatherCaptureImage(JSON.parse(key));RWX_CAPTURE_CACHE.set(key,promise);if(RWX_CAPTURE_CACHE.size>12)RWX_CAPTURE_CACHE.delete(RWX_CAPTURE_CACHE.keys().next().value)}const url=await promise;if(!figure.isConnected)continue;const image=document.createElement('img');image.src=url;image.alt=t('rwx_map_area');host.replaceChildren(image)}catch{RWX_CAPTURE_CACHE.delete(key);if(figure.isConnected)host.textContent=t('rwx_map_failed')}
 }
}
document.addEventListener('click',event=>{const b=event.target.closest?.('[data-action="brf-route-capture-expand"]');if(!b)return;const detail=b.closest('.rwx-detail'),expanded=detail.classList.toggle('rwx-expanded');b.setAttribute('aria-expanded',String(expanded));b.textContent=t(expanded?'rwx_map_reduce':'rwx_map_enlarge')+(expanded?' ↙':' ↗')});
