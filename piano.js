// A small playable piano, C4 to E5.
// Samples: tonejs-instruments piano (MIT), trimmed. Every third note is sampled, the rest is pitched.
(()=>{
  const keysEl=document.getElementById('keys'), wrap=keysEl.closest('.piano-wrap');
  const FIRST=60, LAST=76;
  const SAMPLES={60:'c4',63:'ds4',66:'fs4',69:'a4',72:'c5',75:'ds5'};
  // physical keys (e.code), so it works on German and English layouts alike
  const CODES=['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK','KeyO','KeyL','KeyP','Semicolon'];
  const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const isBlack=m=>[1,3,6,8,10].includes(m%12);
  const whites=[];for(let m=FIRST;m<=LAST;m++)if(!isBlack(m))whites.push(m);

  const keys={};
  let wi=0;
  for(let m=FIRST;m<=LAST;m++){
    const b=document.createElement('button');
    b.type='button';b.tabIndex=-1;
    b.className=isBlack(m)?'k b':'k w';
    b.setAttribute('aria-label',NAMES[m%12]+(Math.floor(m/12)-1));
    if(isBlack(m))b.style.setProperty('--x',wi);else wi++;
    b.dataset.m=m;keysEl.appendChild(b);keys[m]=b;
  }
  keysEl.style.setProperty('--n',whites.length);
  // the first white key is the one you can tab to; arrows/space play from there
  keys[FIRST].tabIndex=0;

  let ctx,out,bufs={},loading=null;
  function load(){
    if(loading)return loading;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return loading=Promise.resolve();
    ctx=new AC();
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
    out=ctx.createGain();out.gain.value=.8;out.connect(comp);comp.connect(ctx.destination);
    loading=Promise.all(Object.entries(SAMPLES).map(([m,n])=>
      fetch('audio/'+n+'.mp3').then(r=>r.arrayBuffer())
      .then(ab=>new Promise((res,rej)=>ctx.decodeAudioData(ab,res,rej)))
      .then(buf=>{bufs[m]=buf;}).catch(()=>{})
    ));
    return loading;
  }
  // start fetching once the piano is close to the screen
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){load();io.disconnect();}},{rootMargin:'400px 0px'});
    io.observe(wrap);
  }

  const voices={};
  function sound(m,vel){
    let best=null;
    for(const s in bufs)if(best===null||Math.abs(m-s)<Math.abs(m-best))best=+s;
    if(best===null)return;
    const t=ctx.currentTime, src=ctx.createBufferSource(), g=ctx.createGain();
    src.buffer=bufs[best];src.playbackRate.value=Math.pow(2,(m-best)/12);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.004);
    src.connect(g);g.connect(out);src.start(t);
    voices[m]={src,g};
  }
  function damp(m){
    const v=voices[m];if(!v)return;delete voices[m];
    const t=ctx.currentTime;
    v.g.gain.cancelScheduledValues(t);v.g.gain.setValueAtTime(v.g.gain.value,t);
    v.g.gain.setTargetAtTime(0,t,.09);v.src.stop(t+.8);
  }

  const down=new Set();
  function press(m){
    if(down.has(m))return;down.add(m);
    keys[m].classList.add('on');
    if(voices[m])damp(m);
    load();
    if(!ctx){puff(m);return;}
    if(ctx.state==='suspended')ctx.resume();
    const vel=.55+Math.random()*.2, at=performance.now();
    if(Object.keys(bufs).length)sound(m,vel);
    else loading.then(()=>{if(performance.now()-at<350&&down.has(m))sound(m,vel);});
    puff(m);
  }
  function release(m){
    if(!down.has(m))return;down.delete(m);
    keys[m].classList.remove('on');
    if(ctx)damp(m);
  }

  // a small ring that rises from the key and fades
  function puff(m){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const k=keys[m], r=k.getBoundingClientRect(), w=wrap.getBoundingClientRect();
    const p=document.createElement('i');p.className='puff';
    p.style.left=(r.left-w.left+r.width/2)+'px';
    p.style.setProperty('--dx',(Math.random()*16-8)+'px');
    wrap.appendChild(p);
    p.addEventListener('animationend',()=>p.remove());
  }

  // mouse and touch, including sliding across the keys
  const pointers=new Map();
  const keyAt=(x,y)=>{const el=document.elementFromPoint(x,y);return el&&el.classList.contains('k')?+el.dataset.m:null;};
  keysEl.addEventListener('pointerdown',e=>{
    const m=keyAt(e.clientX,e.clientY);if(m===null)return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();
    if(e.target.hasPointerCapture&&e.target.hasPointerCapture(e.pointerId))e.target.releasePointerCapture(e.pointerId);
    pointers.set(e.pointerId,m);press(m);
  });
  addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const prev=pointers.get(e.pointerId), m=keyAt(e.clientX,e.clientY);
    if(m===prev)return;
    if(prev!==null)release(prev);
    pointers.set(e.pointerId,m);
    if(m!==null)press(m);
  });
  const end=e=>{if(!pointers.has(e.pointerId))return;const m=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(m!==null)release(m);};
  addEventListener('pointerup',end);addEventListener('pointercancel',end);
  keysEl.addEventListener('contextmenu',e=>e.preventDefault());

  // computer keyboard, only while the piano is on screen
  let visible=false;
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(wrap);
  const typing=t=>t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  addEventListener('keydown',e=>{
    if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||typing(e.target))return;
    const i=CODES.indexOf(e.code);
    if(i<0||!visible)return;
    e.preventDefault();press(FIRST+i);
  });
  addEventListener('keyup',e=>{const i=CODES.indexOf(e.code);if(i>=0)release(FIRST+i);});
  addEventListener('blur',()=>[...down].forEach(release));

  // keyboard access when tabbed into: arrows move, space/enter plays
  let cur=FIRST;
  keysEl.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      e.preventDefault();e.stopPropagation();
      keys[cur].tabIndex=-1;cur=Math.min(LAST,Math.max(FIRST,cur+(e.key==='ArrowRight'?1:-1)));
      keys[cur].tabIndex=0;keys[cur].focus();
    }else if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();e.stopPropagation();press(+e.target.dataset.m);}
  });
  keysEl.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')release(+e.target.dataset.m);});
})();
