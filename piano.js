// A small playable piano: 17 keys, C to E, shiftable by octave.
// Samples: tonejs-instruments piano (MIT), trimmed. One sample every major third, the notes in between are pitched.
(()=>{
  const keysEl=document.getElementById('keys'), wrap=keysEl.closest('.piano-wrap');
  const octEl=document.getElementById('octave'), pedalEl=document.getElementById('pedal');
  const COUNT=17, BASE=60;                    // C4 is the first key at octave 0
  const MIN_OCT=-2, MAX_OCT=2;
  const SAMPLES={};                           // midi -> file
  for(let o=2;o<=7;o++)[['c',0],['e',4],['gs',8]].forEach(([n,s])=>{const m=12*(o+1)+s;if(m<=100)SAMPLES[m]=n+o;});
  // physical keys (e.code), so it works on German and English layouts alike
  const CODES=['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK','KeyO','KeyL','KeyP','Semicolon'];
  const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const isBlack=i=>[1,3,6,8,10].includes(i%12);

  let oct=0;
  const keys=[];
  let wi=0;
  for(let i=0;i<COUNT;i++){
    const b=document.createElement('button');
    b.type='button';b.tabIndex=i?-1:0;
    b.className=isBlack(i)?'k b':'k w';
    if(isBlack(i))b.style.setProperty('--x',wi);else wi++;
    b.dataset.i=i;keysEl.appendChild(b);keys.push(b);
  }
  keysEl.style.setProperty('--n',wi);
  function label(){
    keys.forEach((b,i)=>{const m=BASE+oct*12+i;b.setAttribute('aria-label',NAMES[m%12]+(Math.floor(m/12)-1));});
    if(octEl)octEl.textContent='C'+(4+oct);
  }
  label();

  // ---------- audio ----------
  let ctx,out;const bufs={},pending={};
  function init(){
    if(ctx)return true;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    ctx=new AC();
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
    out=ctx.createGain();out.gain.value=.8;out.connect(comp);comp.connect(ctx.destination);
    return true;
  }
  const nearest=m=>{let best=null;for(const s in SAMPLES)if(best===null||Math.abs(m-s)<Math.abs(m-best))best=+s;return best;};
  function fetchSample(s){
    if(bufs[s]||pending[s])return pending[s]||Promise.resolve();
    return pending[s]=fetch('audio/'+SAMPLES[s]+'.mp3').then(r=>r.arrayBuffer())
      .then(ab=>new Promise((res,rej)=>ctx.decodeAudioData(ab,res,rej)))
      .then(b=>{bufs[s]=b;}).catch(()=>{delete pending[s];});
  }
  // load what the current octave needs, plus the neighbours, so switching is instant
  function preload(){
    if(!init())return Promise.resolve();
    const need=new Set();
    for(let o=Math.max(MIN_OCT,oct-1);o<=Math.min(MAX_OCT,oct+1);o++)
      for(let i=0;i<COUNT;i++)need.add(nearest(BASE+o*12+i));
    const cur=[];for(let i=0;i<COUNT;i++)cur.push(fetchSample(nearest(BASE+oct*12+i)));
    need.forEach(fetchSample);
    return Promise.all(cur);
  }
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){preload();io.disconnect();}},{rootMargin:'400px 0px'});
    io.observe(wrap);
  }

  const voices={};                            // midi -> {src,g}
  function sound(m,vel){
    const s=nearest(m);if(!bufs[s])return;
    if(voices[m])stopVoice(m,.03);
    const t=ctx.currentTime, src=ctx.createBufferSource(), g=ctx.createGain();
    src.buffer=bufs[s];src.playbackRate.value=Math.pow(2,(m-s)/12);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.004);
    src.connect(g);g.connect(out);src.start(t);
    voices[m]={src,g};
    src.onended=()=>{if(voices[m]&&voices[m].src===src)delete voices[m];};
  }
  function stopVoice(m,tc){
    const v=voices[m];if(!v)return;delete voices[m];
    const t=ctx.currentTime;
    v.g.gain.cancelScheduledValues(t);v.g.gain.setValueAtTime(v.g.gain.value,t);
    v.g.gain.setTargetAtTime(0,t,tc);v.src.stop(t+tc*8);
  }

  // ---------- keys, pedal, octave ----------
  const held=new Map();                       // key index -> midi it started
  let sustain=false;const sustained=new Set();
  let lastUse=0;
  function press(i){
    if(held.has(i))return;
    const m=BASE+oct*12+i;held.set(i,m);lastUse=performance.now();
    keys[i].classList.add('on');
    sustained.delete(m);
    if(!init()){puff(i);return;}
    if(ctx.state==='suspended')ctx.resume();
    const vel=.55+Math.random()*.2, at=performance.now();
    if(bufs[nearest(m)])sound(m,vel);
    else preload().then(()=>{if(performance.now()-at<350&&held.get(i)===m)sound(m,vel);});
    puff(i);
  }
  function release(i){
    if(!held.has(i))return;
    const m=held.get(i);held.delete(i);
    keys[i].classList.remove('on');
    if(!ctx)return;
    if(sustain)sustained.add(m);else stopVoice(m,.09);
  }
  function setSustain(on){
    if(sustain===on)return;sustain=on;lastUse=performance.now();
    if(pedalEl)pedalEl.classList.toggle('on',on);
    if(!on&&ctx){sustained.forEach(m=>{if(![...held.values()].includes(m))stopVoice(m,.18);});sustained.clear();}
  }
  function shift(d){
    const n=Math.max(MIN_OCT,Math.min(MAX_OCT,oct+d));if(n===oct)return;
    [...held.keys()].forEach(release);
    oct=n;lastUse=performance.now();label();preload();
    if(octEl){octEl.classList.remove('bump');void octEl.offsetWidth;octEl.classList.add('bump');}
  }

  // a small ring that rises from the key and fades
  function puff(i){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const r=keys[i].getBoundingClientRect(), w=wrap.getBoundingClientRect();
    const p=document.createElement('i');p.className='puff';
    p.style.left=(r.left-w.left+r.width/2)+'px';
    p.style.setProperty('--dx',(Math.random()*16-8)+'px');
    wrap.appendChild(p);
    p.addEventListener('animationend',()=>p.remove());
  }

  // mouse and touch, including sliding across the keys
  const pointers=new Map();
  const keyAt=(x,y)=>{const el=document.elementFromPoint(x,y);return el&&el.classList.contains('k')?+el.dataset.i:null;};
  keysEl.addEventListener('pointerdown',e=>{
    const i=keyAt(e.clientX,e.clientY);if(i===null)return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();
    if(e.target.hasPointerCapture&&e.target.hasPointerCapture(e.pointerId))e.target.releasePointerCapture(e.pointerId);
    pointers.set(e.pointerId,i);press(i);
  });
  addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const prev=pointers.get(e.pointerId), i=keyAt(e.clientX,e.clientY);
    if(i===prev)return;
    if(prev!==null)release(prev);
    pointers.set(e.pointerId,i);
    if(i!==null)press(i);
  });
  const end=e=>{if(!pointers.has(e.pointerId))return;const i=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(i!==null)release(i);};
  addEventListener('pointerup',end);addEventListener('pointercancel',end);
  keysEl.addEventListener('contextmenu',e=>e.preventDefault());

  // computer keyboard: letters play while the piano is on screen.
  // Space (sustain) and the arrows (octave) only take over once you've been playing,
  // so they don't steal normal page scrolling.
  let visible=false;
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(wrap);
  const typing=t=>t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const engaged=()=>visible&&(performance.now()-lastUse<8000||wrap.contains(document.activeElement));
  addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||typing(e.target))return;
    if(e.code==='Space'&&engaged()){e.preventDefault();if(!e.repeat)setSustain(true);return;}
    if((e.code==='ArrowUp'||e.code==='ArrowDown')&&engaged()){e.preventDefault();if(!e.repeat)shift(e.code==='ArrowUp'?1:-1);return;}
    const i=CODES.indexOf(e.code);
    if(i<0||!visible||e.repeat)return;
    e.preventDefault();press(i);
  });
  addEventListener('keyup',e=>{
    if(e.code==='Space'){if(sustain){e.preventDefault();setSustain(false);}return;}
    const i=CODES.indexOf(e.code);if(i>=0)release(i);
  });
  addEventListener('blur',()=>{[...held.keys()].forEach(release);setSustain(false);});

  // tabbing into the piano: left/right move between keys, Enter plays
  let cur=0;
  keysEl.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      e.preventDefault();e.stopPropagation();
      keys[cur].tabIndex=-1;cur=Math.min(COUNT-1,Math.max(0,cur+(e.key==='ArrowRight'?1:-1)));
      keys[cur].tabIndex=0;keys[cur].focus();
    }else if(e.key==='Enter'&&!e.repeat){e.preventDefault();e.stopPropagation();press(+e.target.dataset.i);}
  });
  keysEl.addEventListener('keyup',e=>{if(e.key==='Enter')release(+e.target.dataset.i);});
  keysEl.addEventListener('click',e=>{if(e.detail===0)e.preventDefault();});

  // on-screen pedal: hold it
  if(pedalEl){
    pedalEl.addEventListener('pointerdown',e=>{e.preventDefault();pedalEl.setPointerCapture?.(e.pointerId);setSustain(true);});
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>pedalEl.addEventListener(t,()=>setSustain(false)));
    pedalEl.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();setSustain(true);}});
    pedalEl.addEventListener('keyup',e=>{if(e.key==='Enter')setSustain(false);});
  }
  // octave buttons
  document.querySelectorAll('[data-oct]').forEach(b=>b.addEventListener('click',()=>shift(+b.dataset.oct)));
})();
