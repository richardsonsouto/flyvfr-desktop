// Self-contained illustrative volume. Never derive echo heights from the 2D radar.
function mapRadar3DInit(map, Lf) {
  const words = {
    demo: ['Illustrative simulation','Simulação ilustrativa','Simulación ilustrativa','Simulation illustrative','Beispielsimulation','シミュレーション','模拟示例','모의 시뮬레이션'],
    surface: ['Surface','Superfície','Superficie','Surface','Boden','地表','地面','지표'],
    level: ['Reference altitude','Altitude de referência','Altitud de referencia','Altitude de référence','Referenzhöhe','基準高度','参考高度','기준 고도'],
    rotate: ['Rotate','Girar','Girar','Pivoter','Drehen','回転','旋转','회전'],
    strength: ['Weak → Strong','Fraco → Forte','Débil → Fuerte','Faible → Fort','Schwach → Stark','弱 → 強','弱 → 强','약 → 강'],
    back: ['Back to map','Voltar ao mapa','Volver al mapa','Retour à la carte','Zurück zur Karte','地図に戻る','返回地图','지도로 돌아가기']
  };
  const tr = key => words[key][LANGS.indexOf(lang)] || words[key][0];
  const layer = Lf.layerGroup([], {key:'RADAR_3D_DEMO'});
  mapToolsControl()?.addOverlay(layer, 'Radar 3D · ' + tr('demo'));
  let panel, observer, angle = 0, level = -1, previousFocus;

  let route = [], endpoints = [];
  async function loadRoute(target) {
    const status = target.querySelector('footer span');
    const owner = mapDispatchOwner();
    try {
      status.textContent = mapDispatchText('source') + '…';
      const plan = await fetchSimbrief();
      if (panel !== target || owner !== mapDispatchOwner()) return;
      const active = mapActiveReservation();
      if (active && !briefDispatchMatches(plan,{dep:active.dep,arr:active.arr,eobt:active.start,fno:active.flightNo,acId:active.aircraftId})) {
        status.textContent = mapDispatchText('source') + ' ≠ ' + active.dep + ' → ' + active.arr;
        return;
      }
      const dep = apLL(plan.dep), arr = apLL(plan.arr);
      if (!dep || !arr) throw Error('SB_ERR: ICAO');
      const fixes = [dep,...plan.waypoints,arr];
      let lon = dep[1];
      const factor = Math.cos((dep[0]+arr[0])*Math.PI/360);
      const xy = fixes.map(([lat,next])=>{
        lon += ((next-lon+540)%360)-180;
        return [lon*factor,-lat];
      });
      const xs=xy.map(p=>p[0]), ys=xy.map(p=>p[1]);
      const left=Math.min(...xs), right=Math.max(...xs), top=Math.min(...ys), bottom=Math.max(...ys);
      const scale=Math.min(650/Math.max(right-left,.001),300/Math.max(bottom-top,.001));
      route=xy.map(([x,y])=>[(x-(left+right)/2)*scale,(y-(top+bottom)/2)*scale,0]);
      endpoints=[plan.dep,plan.arr];
      status.textContent=plan.dep+' → '+plan.arr+' · SimBrief'+(plan.waypoints.length?'':' · '+mapDispatchText('direct'));
      target.querySelector('canvas').setAttribute('aria-label',status.textContent);
      paint();
    } catch(error) {
      if(panel===target) status.textContent=mySimbrief()?sbErrMsg(error):mapDispatchText('missing');
    }
  }
  function close() {
    observer?.disconnect();
    if (panel?.contains(document.activeElement) && previousFocus?.isConnected) previousFocus.focus();
    panel?.remove();
    panel = null; route=[]; endpoints=[];
  }
  function paint() {
    const canvas = panel.querySelector('canvas');
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    const scale = Math.min(w / 920, h / 590);
    const rad = angle * Math.PI / 180;
    const depth = (x,y) => x*Math.sin(rad) + y*Math.cos(rad);
    const project = ([x,y,z]) => [
      w/2 + scale*(x*Math.cos(rad)-y*Math.sin(rad)),
      h*.62 + scale*(depth(x,y)*.44-z)
    ];
    function path(points, color, fill = false) {
      ctx.beginPath();
      points.map(project).forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      if (fill) { ctx.closePath(); ctx.fillStyle=color; ctx.fill(); }
      else { ctx.strokeStyle=color; ctx.stroke(); }
    }
    path([[-380,-170,0],[380,-170,0],[380,170,0],[-380,170,0]],'#193c49',true);

    for(let x=-350;x<=350;x+=50) path([[x,-170,0],[x,170,0]],'#48636a');
    for(let y=-150;y<=150;y+=50) path([[-380,y,0],[380,y,0]],'#48636a');
    ctx.lineWidth=3; ctx.setLineDash([7,5]);
    if(!route.length)return;
    path(route,'#80e5ff');
    ctx.setLineDash([]); ctx.lineWidth=1;
    const cells=[];
    for(let x=-160;x<=185;x+=14) for(let y=-100;y<=100;y+=14) {
      const intensity=Math.exp(-((x+63)**2/5200+(y+3)**2/1200))
        + .74*Math.exp(-((x-77)**2/2800+(y+48)**2/1250));
      const count=Math.round(intensity*13);
      if(count) cells.push({x,y,count});
    }
    cells.sort((a,b)=>depth(a.x,a.y)-depth(b.x,b.y));
    for(const {x,y,count} of cells) for(let k=0;k<count;k++) {
      const z=k*12, top=z+12, intensity=(count-k*.45)/13;
      if(level>=0 && Math.floor(level*.48/12)!==k)continue;
      const color=intensity>.77?'#fa7867':intensity>.52?'#ffbe56':intensity>.32?'#91d773':'#48bba9';
      const dx=Math.cos(rad)>=0?14:0, dy=Math.sin(rad)>=0?14:0;
      path([[x,y+dx,z],[x+14,y+dx,z],[x+14,y+dx,top],[x,y+dx,top]],color,true);
      path([[x+dy,y,z],[x+dy,y+14,z],[x+dy,y+14,top],[x+dy,y,top]],color,true);
      path([[x,y,top],[x+14,y,top],[x+14,y+14,top],[x,y+14,top]],color,true);
    }
    ctx.setLineDash([5,5]); ctx.lineWidth=1.5;
    const z=level*.48;
    if(level>=0)path([[-360,-155,z],[360,-155,z],[360,155,z],[-360,155,z],[-360,-155,z]],'#9deaff');
    ctx.setLineDash([]);
    ctx.font='bold 13px sans-serif';
    for(const [point,label] of [[route[0],endpoints[0]],[route[route.length-1],endpoints[1]]]) {
      const [x,y]=project(point);
      ctx.fillStyle='#91ecff'; ctx.beginPath(); ctx.arc(x,y,4,0,2*Math.PI); ctx.fill();
      ctx.fillStyle='white';ctx.fillText(label,x-18,y+19);
    }
  }
  function open() {
    if(panel) return;
    previousFocus=document.activeElement;
    panel=document.createElement('section');
    panel.className='radar-volume-panel';
    panel.setAttribute('aria-label','Radar 3D · '+tr('demo'));
    panel.innerHTML='<header><strong>Radar 3D</strong><b>'+tr('demo')+'</b><button type="button" data-exit>'+tr('back')+'</button></header>'
      +'<div class="radar-volume-levels"><span>'+tr('level')+'</span>'
      +[-1,0,100,200,300].map(n=>'<button type="button" data-fl="'+n+'" aria-pressed="'+(level===n)+'">'+(n<0?'3D':n?'FL'+n:tr('surface'))+'</button>').join('')+'</div>'
      +'<canvas role="img" aria-label="Radar 3D"></canvas><footer><span role="status"></span><span><i></i> '+tr('strength')+'</span><label>'+tr('rotate')+' <input type="range" min="-180" max="180" value="'+angle+'"></label></footer>';
    map.getContainer().append(panel);
    Lf.DomEvent.disableClickPropagation(panel);
    Lf.DomEvent.disableScrollPropagation(panel);
    panel.querySelector('[data-exit]').onclick=()=>map.removeLayer(layer);
    panel.querySelectorAll('[data-fl]').forEach(button=>button.onclick=()=>{
      level=Number(button.dataset.fl);
      panel.querySelectorAll('[data-fl]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      paint();
    });
    panel.querySelector('input').oninput=e=>{angle=Number(e.target.value);paint()};
    const canvas=panel.querySelector('canvas'), slider=panel.querySelector('input');
    let drag;
    canvas.onpointerdown=e=>{
      if(e.pointerType!=='mouse'||e.button!==1)return;
      e.preventDefault();drag={id:e.pointerId,x:e.clientX,start:angle};
      canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';
    };
    canvas.onpointermove=e=>{
      if(!drag||drag.id!==e.pointerId)return;
      if(!(e.buttons&4)){finish(e);return}
      angle=((drag.start+(e.clientX-drag.x)*.55+180)%360+360)%360-180;
      slider.value=angle;paint();
    };
    function finish(e){
      if(!drag||drag.id!==e.pointerId)return;
      drag=null;canvas.style.cursor='';
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    }
    canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=finish;
    canvas.onmousedown=canvas.onauxclick=e=>{if(e.button===1)e.preventDefault()};
    loadRoute(panel);
    panel.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape')map.removeLayer(layer)};
    observer=new ResizeObserver(paint);
    observer.observe(panel.querySelector('canvas'));
    panel.querySelector('[data-exit]').focus();
    paint();
  }
  layer.on('add',open);
  layer.on('remove',close);
  map.on('unload',close);
}
