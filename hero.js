// Hero ornaments: a pendant lamp whose pull cord switches light/dark, and a Calder-style mobile whose shapes link to the sections.
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
  const glow=el('path',{class:'glow',d:'M76 160 L124 160 L230 470 L-30 470 Z',fill:'url(#lampglow)'},body);
  el('line',{x1:100,y1:0,x2:100,y2:146,stroke:'var(--muted)','stroke-width':1.2},lamp);lamp.appendChild(body);
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

  // ---------- Mobile ----------
  // Arms balance like a real mobile: the heavy shape sits on the short end.
  const mob=document.getElementById('hero-mobile');
  const links=[
    {href:'#about',label:'About',col:'var(--rust)',shape:'circle',r:17},
    {href:'#work',label:'Work',col:'var(--accent)',shape:'half',r:15},
    {href:'#offline',label:'Outside work',col:'var(--olive)',shape:'leaf',r:12},
    {href:'#contact',label:'Contact',col:'var(--ink)',shape:'circle',r:7}
  ];
  const arms=[];
  const wire={stroke:'var(--muted)','stroke-width':1.1,fill:'none','stroke-linecap':'round'};
  function shape(p,s,y){
    const a=el('a',{href:s.href,'aria-label':s.label},p);
    let sh;
    if(s.shape==='circle')sh=el('circle',{class:'shape',cx:0,cy:y+s.r,r:s.r,fill:s.col},a);
    else if(s.shape==='half')sh=el('path',{class:'shape',d:`M${-s.r*1.2} ${y} A${s.r*1.2} ${s.r*1.2} 0 0 0 ${s.r*1.2} ${y} Z`,fill:s.col},a);
    else sh=el('path',{class:'shape',d:`M0 ${y} C${s.r} ${y+s.r*.6} ${s.r} ${y+s.r*1.8} 0 ${y+s.r*2.6} C${-s.r} ${y+s.r*1.8} ${-s.r} ${y+s.r*.6} 0 ${y}Z`,fill:s.col},a);
    el('circle',{cx:0,cy:y+s.r,r:Math.max(s.r+4,22),fill:'transparent'},a);
    el('text',{x:0,y:y+(s.shape==='half'?s.r*1.2:s.r*(s.shape==='leaf'?2.6:2))+14,'text-anchor':'middle'},a).textContent=s.label;
    return a;
  }
  // arm: pivot hangs `drop` below parent point; left/right lengths; children hang from the ends
  function arm(p,drop,L,R,left,right,depth){
    el('line',{x1:0,y1:0,x2:0,y2:drop,...wire},p);
    const piv=el('g',{transform:`translate(0 ${drop})`},p);
    const bar=el('g',{},piv);
    el('path',{d:`M${-L} 0 Q0 -5 ${R} 0`,...wire},bar);
    el('circle',{cx:0,cy:0,r:1.8,fill:'var(--muted)'},bar);
    const a={bar,L,R,tilt:0,tv:0,yaw:0,yv:0,depth,ends:[]};
    [[-L,left],[R,right]].forEach(([x,child])=>{
      const end=el('g',{transform:`translate(${x} 0)`},bar);
      const hang=el('g',{},end);a.ends.push(hang);
      if(child.label){el('line',{x1:0,y1:0,x2:0,y2:child.drop,...wire},hang);shape(hang,child,child.drop);}
      else arm(hang,child.drop,child.L,child.R,child.left,child.right,depth+1);
    });
    arms.push(a);
  }
  const top=el('g',{transform:'translate(150 0)'},mob);
  arm(top,120,104,40,
    {...links[0],drop:30},
    {drop:26,L:46,R:26,
      left:{...links[1],drop:26},
      right:{drop:20,L:26,R:18,left:{...links[2],drop:18},right:{...links[3],drop:22}}},0);

  // nudge the mobile when the cursor moves through it
  let px=null;
  addEventListener('pointermove',e=>{
    if(still||!heroVisible)return;
    const r=mob.getBoundingClientRect();
    const inside=e.clientX>r.left-20&&e.clientX<r.right+20&&e.clientY>r.top&&e.clientY<r.bottom+20;
    if(px!==null&&inside){const dx=e.clientX-px;arms.forEach((a,i)=>{a.yv+=dx*.0009/(1+i*.3);a.tv+=dx*.006;});wake();}
    const lr=lampSvg.getBoundingClientRect();
    if(px!==null&&e.clientX>lr.left&&e.clientX<lr.right&&e.clientY>lr.top+lr.height*.4&&e.clientY<lr.top+lr.height*.7){lw+=(e.clientX-px)*.00012;wake();}
    px=e.clientX;
  },{passive:true});
  mob.addEventListener('click',()=>{arms.forEach(a=>a.yv+=(Math.random()-.5)*.08);wake();});

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
    // mobile: each arm tilts a little and turns around its wire
    arms.forEach(a=>{
      a.tv+=-a.tilt*.04-a.tv*.06; a.tilt=Math.max(-14,Math.min(14,a.tilt+a.tv));
      a.yv+=-Math.sin(a.yaw)*.0025-a.yv*.012; a.yaw+=a.yv;
      e+=Math.abs(a.tv)*.02+Math.abs(a.yv)*5+Math.abs(a.tilt)*.01+Math.abs(Math.sin(a.yaw))*.5;
      const c=Math.cos(a.yaw);
      a.bar.setAttribute('transform',`rotate(${a.tilt}) scale(${c.toFixed(3)} 1)`);
      // children hang straight down from the tilted arm
      a.ends.forEach(h=>h.setAttribute('transform',`rotate(${-a.tilt})`));
    });
    if(e>.002)requestAnimationFrame(step);else running=false;
  }
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{heroVisible=es[0].isIntersecting;}).observe(deco);

  // ---------- Variant (preview only: #lamp, #mobile, #both) ----------
  const V=['lamp','mobile','both'];
  function pick(){
    const h=location.hash.slice(1);
    if(V.includes(h))deco.dataset.variant=h;
    document.querySelectorAll('.variant-switch a').forEach(a=>a.setAttribute('aria-current',a.getAttribute('href')==='#'+deco.dataset.variant));
  }
  pick();addEventListener('hashchange',pick);

  // one small settle on load, then everything rests
  if(!still){lw=.006;arms.forEach((a,i)=>{a.yv=.05*(i%2?-1:1);a.tv=.4;});wake();}
})();
