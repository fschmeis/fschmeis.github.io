// Hero ornament: a pendant lamp whose pull cord switches light/dark.
(()=>{
  const NS='http://www.w3.org/2000/svg';
  const el=(n,a,p)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;};
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const deco=document.getElementById('deco'), root=document.documentElement;
  const dark=()=>root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;

  // ---------- Lamp ----------
  const lampSvg=document.getElementById('hero-lamp');
  const defs=el('defs',{},lampSvg);
  const rg=el('radialGradient',{id:'lampglow',cx:'50%',cy:'0%',r:'100%'},defs);
  el('stop',{offset:'0','stop-color':'#f3d9a4','stop-opacity':.32},rg);
  el('stop',{offset:'.55','stop-color':'#f3d9a4','stop-opacity':.07},rg);
  el('stop',{offset:'1','stop-color':'#f3d9a4','stop-opacity':0},rg);
  const lamp=el('g',{},lampSvg), body=el('g',{transform:'translate(0 34)'});
  const cg=el('linearGradient',{id:'lampcord',gradientUnits:'userSpaceOnUse',x1:0,y1:0,x2:0,y2:70},defs);
  el('stop',{offset:'0','stop-color':'var(--muted)','stop-opacity':0},cg);
  el('stop',{offset:'1','stop-color':'var(--muted)','stop-opacity':1},cg);
  const blur=el('filter',{id:'lampsoft',x:'-60%',y:'-20%',width:'220%',height:'150%'},defs);
  el('feGaussianBlur',{stdDeviation:14},blur);
  const halo=el('radialGradient',{id:'lamphalo'},defs);
  el('stop',{offset:'0','stop-color':'#f3d9a4','stop-opacity':.22},halo);
  el('stop',{offset:'1','stop-color':'#f3d9a4','stop-opacity':0},halo);
  const glow=el('g',{class:'glow'},body);
  el('path',{d:'M80 158 L120 158 L215 440 L-15 440 Z',fill:'url(#lampglow)',filter:'url(#lampsoft)'},glow);
  el('ellipse',{cx:100,cy:162,rx:70,ry:46,fill:'url(#lamphalo)'},glow);
  el('path',{d:'M100 0V146',stroke:'url(#lampcord)','stroke-width':1.2,fill:'none'},lamp);lamp.appendChild(body);
  el('rect',{x:95,y:108,width:10,height:9,rx:1.5,fill:'var(--muted)'},body);
  // dome shade, slightly flared at the rim
  el('path',{d:'M100 115 C80 115 70 128 66 146 C64 152 60 156 54 158 L146 158 C140 156 136 152 134 146 C130 128 120 115 100 115 Z',fill:'var(--accent)'},body);
  el('path',{d:'M54 158 L146 158',stroke:'var(--ink)','stroke-opacity':.25,'stroke-width':1.2},body);
  const bulb=el('path',{d:'M90 158 A10 10 0 0 0 110 158 Z',fill:'var(--line)'},body);
  // pull cord
  const cord=el('line',{x1:128,y1:150,x2:128,y2:196,stroke:'var(--muted)','stroke-width':1},body);
  const bead=el('circle',{cx:128,cy:199,r:3.6,fill:'var(--muted)'},body);
  const hit=el('circle',{class:'hit',cx:128,cy:196,r:16,fill:'transparent'},body);
  const t=el('title',{},hit);
  function paintLamp(){
    const on=dark();
    glow.style.opacity=on?1:0;
    bulb.setAttribute('fill',on?'#f6e3b8':'var(--line)');
    t.textContent=on?'Pull for the light theme':'Pull for the dark theme';
  }
  paintLamp();
  new MutationObserver(paintLamp).observe(root,{attributes:true,attributeFilter:['data-theme']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',paintLamp);

  let lth=0,lw=0, pull=0, pullV=0, dragging=null;
  const tb=document.getElementById('theme');
  const toggle=()=>{tb.click();lw+=(Math.random()<.5?-1:1)*.012;wake();};
  hit.addEventListener('pointerdown',e=>{e.preventDefault();dragging={y:e.clientY,max:0};hit.setPointerCapture?.(e.pointerId);});
  hit.addEventListener('pointermove',e=>{if(!dragging)return;const scale=200/lampSvg.getBoundingClientRect().width;pull=Math.max(0,Math.min(28,(e.clientY-dragging.y)*scale));dragging.max=Math.max(dragging.max,pull);wake();});
  const endPull=()=>{if(!dragging)return;const d=dragging;dragging=null;if(d.max<4){pull=14;}toggle();wake();};
  hit.addEventListener('pointerup',endPull);hit.addEventListener('pointercancel',()=>{dragging=null;wake();});

  // brushing past the shade nudges it
  let px=null;
  addEventListener('pointermove',e=>{
    if(still||!heroVisible)return;
    const lr=lampSvg.getBoundingClientRect();
    if(px!==null&&e.clientX>lr.left&&e.clientX<lr.right&&e.clientY>lr.top+lr.height*.4&&e.clientY<lr.top+lr.height*.75){lw+=(e.clientX-px)*.00012;wake();}
    px=e.clientX;
  },{passive:true});

  // ---------- Physics loop (runs only while something moves) ----------
  let running=false, heroVisible=true;
  function wake(){if(!running&&!still){running=true;requestAnimationFrame(step);}}
  function step(){
    let e=0;
    // lamp: pendulum
    lw+=-lth*.0018-lw*.02; lth+=lw; e+=Math.abs(lth)+Math.abs(lw)*10;
    lamp.setAttribute('transform',`rotate(${lth*57.3} 100 0)`);
    // pull cord spring
    if(!dragging){pullV+=-pull*.18-pullV*.25;pull+=pullV;}
    e+=Math.abs(pull)*.01+Math.abs(pullV)*.01;
    cord.setAttribute('y2',196+pull);bead.setAttribute('cy',199+pull);hit.setAttribute('cy',196+pull);
    if(e>.002)requestAnimationFrame(step);else running=false;
  }
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{heroVisible=es[0].isIntersecting;}).observe(deco);

  // one small settle on load, then everything rests
  if(!still){lw=.006;wake();}
})();
