// Hanging pothos: grows as you scroll, swings when you tap the pot, leaves move when you brush past.
(()=>{
  const svg=document.getElementById('plant');if(!svg)return;
  const NS='http://www.w3.org/2000/svg';
  const el=(n,a,p)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e;};
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rig=el('g',{});              // everything that swings
  const cords=el('g',{fill:'none',stroke:'var(--muted)','stroke-width':1.3,'stroke-linecap':'round'},rig);
  el('circle',{cx:0,cy:6,r:4.5,fill:'none',stroke:'var(--muted)','stroke-width':1.5},rig);
  el('path',{d:'M0 10.5V46'},cords);
  // macramé: the cord splits, gets knotted once more, then holds the pot
  [[-1,-30],[0,0],[1,30]].forEach(([s,x])=>{
    el('path',{d:`M0 46 Q${x*.35} 80 ${x*.72} 100 L${x} 128`},cords);
    el('circle',{cx:x*.72,cy:100,r:2.4,fill:'var(--muted)',stroke:'none'},rig);
  });
  el('rect',{x:-4,y:40,width:8,height:12,rx:4,fill:'var(--accent)'},rig);

  // vines first so the pot overlaps their start
  const vines=[
    {x:-24,d:'M-24 128 C-44 170 -18 230 -36 290 S-30 370 -40 405',col:'var(--olive)'},
    {x:4,  d:'M4 130 C0 175 22 220 10 270 S2 330 14 350',col:'var(--leaf)'},
    {x:28, d:'M28 128 C50 160 36 205 48 240',col:'var(--olive)'}
  ];
  const vg=el('g',{},rig), lg=el('g',{},rig);
  const leaves=[];
  vines.forEach((v,vi)=>{
    const p=el('path',{d:v.d,fill:'none',stroke:'var(--stem)','stroke-width':1.6,'stroke-linecap':'round'},vg);
    v.len=p.getTotalLength();v.p=p;
    p.style.strokeDasharray=v.len;
    let side=vi%2?1:-1;
    for(let at=10;at<v.len-4;at+=25+((at*7)%7)){
      const a=p.getPointAtLength(at), b=p.getPointAtLength(Math.min(v.len,at+1));
      const tan=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI-90;
      const g=el('g',{},lg), inner=el('g',{},g);
      const size=.55+.35*Math.min(1,at/80)*(1-at/v.len*.4);
      el('path',{d:'M0 0C-3 4-12 4-13 13C-14 22-5 27 0 33C5 27 14 22 13 13C12 4 3 4 0 0Z',fill:(at/25|0)%3===1?'var(--leaf)':v.col},inner);
      el('path',{d:'M0 3V29',stroke:'var(--bg)','stroke-opacity':.35,'stroke-width':.9,fill:'none'},inner);
      leaves.push({v,at,x:a.x,y:a.y,base:tan+side*48,size,g,inner,ang:0,vel:0});
      side=-side;
    }
  });
  // terracotta pot with a painted band
  const pot=el('g',{class:'pot'},rig);
  el('path',{d:'M-38 132H38L30 168Q28 174 21 174H-21Q-28 174-30 168Z',fill:'var(--rust)'},pot);
  el('path',{d:'M-35.5 146H35.5L34 153H-34Z',fill:'var(--accent)',opacity:.85},pot);
  el('rect',{x:-41,y:124,width:82,height:10,rx:2.5,fill:'var(--rust)'},pot);
  el('rect',{x:-41,y:131,width:82,height:3,fill:'#000',opacity:.18},pot);
  [-18,0,18].forEach(x=>el('circle',{cx:x,cy:162,r:1.6,fill:'var(--bg)',opacity:.5},pot));
  el('rect',{x:-44,y:120,width:88,height:58,fill:'transparent'},pot); // bigger tap target

  // growth: follows how far you've scrolled past the plant, never shrinks
  let grown=still?1:.12;
  function updateGrowth(){
    const r=svg.getBoundingClientRect();
    const g=(innerHeight-r.top)/(innerHeight*.55+r.height*.6);
    if(g>grown)grown=Math.min(1,g);
  }
  function drawGrowth(){
    vines.forEach(v=>{v.shown=v.len*Math.max(0,Math.min(1,grown*1.15-(v.x===4?.05:v.x>0?.12:0)));v.p.style.strokeDashoffset=v.len-v.shown;});
    leaves.forEach(l=>{l.s=Math.max(0,Math.min(1,(l.v.shown-l.at+2)/16))*l.size;});
  }

  // swing (pendulum around the hook) and leaf springs
  let th=0,w=0,lastY=scrollY;
  pot.addEventListener('pointerdown',e=>{e.preventDefault();const r=svg.getBoundingClientRect();w+=(e.clientX<r.left+r.width/2?-1:1)*.035+(Math.random()-.5)*.01;wake();});
  let px=null,py=null;
  addEventListener('pointermove',e=>{
    if(!visible||still)return;
    const m=svg.getScreenCTM();if(!m)return;
    const inv=m.inverse(), x=e.clientX*inv.a+e.clientY*inv.c+inv.e, y=e.clientX*inv.b+e.clientY*inv.d+inv.f;
    if(px!==null){
      const dx=x-px;
      leaves.forEach(l=>{const d=Math.hypot(l.x-x,l.y+14-y);if(d<34&&l.s>.2)l.vel+=dx*(1-d/34)*.9;});
      if(Math.abs(dx)>0&&Math.hypot(x,y-150)<60)w+=dx*.00025;
    }
    px=x;py=y;wake();
  },{passive:true});

  let visible=false,running=false;
  function wake(){if(!running&&visible&&!still){running=true;requestAnimationFrame(step);}}
  function step(){
    const dy=scrollY-lastY;lastY=scrollY;
    w+=Math.max(-30,Math.min(30,dy))*.00002;
    w+=-th*.0016-w*.014; th+=w;
    if(Math.abs(th)>.3){th=Math.sign(th)*.3;w*=-.3;}
    updateGrowth();drawGrowth();
    let energy=Math.abs(w)+Math.abs(th)+Math.abs(dy);
    rig.setAttribute('transform',`rotate(${th*57.3} 0 6)`);
    leaves.forEach(l=>{
      l.vel+=-l.ang*.05-l.vel*.08 - w*6; l.ang=Math.max(-40,Math.min(40,l.ang+l.vel));
      energy+=Math.abs(l.vel)*.01+Math.abs(l.ang)*.002;
      l.g.setAttribute('transform',`translate(${l.x} ${l.y}) rotate(${l.base+l.ang})`);
      l.inner.setAttribute('transform',`scale(${l.s.toFixed(3)})`);
    });
    if(energy>.0005&&visible){requestAnimationFrame(step);}else running=false;
  }
  // first paint
  updateGrowth();drawGrowth();
  leaves.forEach(l=>{l.g.setAttribute('transform',`translate(${l.x} ${l.y}) rotate(${l.base})`);l.inner.setAttribute('transform',`scale(${l.s})`);});
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible){w+=.004;wake();}}).observe(svg);
  addEventListener('scroll',wake,{passive:true});
})();
