const jobs=[
  ["2024 — heute","Softwareentwickler","Allegro Packets","Ich arbeite hier an der Weboberfläche. Seit Oktober 2025 als Softwareentwickler fest im Team."],
  ["2019 — 2024","Entwicklung, PMO & Vertrieb","ccc software gmbh","Angefangen als Werkstudent, dann Junior-Entwickler mit Angular und .NET. Später hab ich mich um Projektplanung gekümmert, Software bei Kunden vorgestellt und im MES-Consulting mitgeholfen."],
  ["2018 — 2019","Werkstudent Softwareentwicklung","ORSOFT GmbH","Mein erster Job neben dem Studium. Python-Doku automatisiert, einen SQLite-Adapter gebaut und C++-Tests geschrieben."],
  ["2017 — 2025","Studium","HTWK Leipzig","Bachelor in Medieninformatik, danach Master in Informatik."]
];
const ul=document.getElementById('jobs');
jobs.forEach(([y,r,c,d],i)=>{
  const li=document.createElement('li');li.className='job rv';li.dataset.open='false';
  li.innerHTML=`<button type="button" aria-expanded="false"><span class="yr">${y}</span><span class="ro">${r}</span><span class="co">${c}</span></button><div class="det"><div><p>${d}</p></div></div>`;
  li.querySelector('button').onclick=e=>{const o=li.dataset.open!=='true';li.dataset.open=o;e.currentTarget.setAttribute('aria-expanded',o);};
  ul.appendChild(li);
});

// Sternburst
const NS='http://www.w3.org/2000/svg', burst=document.getElementById('burst');
for(let i=0;i<16;i++){
  const a=i/16*Math.PI*2, L=i%2?120:180, s=i%4===0?2:1.2;
  const l=document.createElementNS(NS,'line');
  l.setAttribute('x1',Math.cos(a)*34);l.setAttribute('y1',Math.sin(a)*34);
  l.setAttribute('x2',Math.cos(a)*L);l.setAttribute('y2',Math.sin(a)*L);
  l.setAttribute('stroke','currentColor');l.setAttribute('stroke-width',s);l.setAttribute('stroke-linecap','round');burst.appendChild(l);
  if(i%2===0){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',Math.cos(a)*(L+10));c.setAttribute('cy',Math.sin(a)*(L+10));c.setAttribute('r',i%4===0?6:3.5);c.setAttribute('fill','currentColor');burst.appendChild(c);}
}
const core=document.createElementNS(NS,'circle');core.setAttribute('r',16);core.setAttribute('fill','none');core.setAttribute('stroke','currentColor');core.setAttribute('stroke-width',1.5);burst.appendChild(core);
const g=document.createElementNS(NS,'g');burst.querySelectorAll('*').forEach(n=>g.appendChild(n));burst.appendChild(g);

// Schallplatte
const vinyl=document.getElementById('vinyl');
vinyl.innerHTML='<circle r="98" fill="#121212" stroke="var(--line)" stroke-width="1.5"/>'+
  Array.from({length:14},(_,i)=>`<circle r="${40+i*4.2}" fill="none" stroke="#fff" stroke-opacity="${i%3?.07:.16}" stroke-width=".8"/>`).join('')+
  '<path d="M-70 -60 A92 92 0 0 1 10 -91" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="6" stroke-linecap="round"/>'+
  '<g id="label"><circle r="32" fill="var(--rust)"/><path d="M-32 0a32 32 0 0 1 64 0z" fill="var(--accent)"/><text y="-11" text-anchor="middle" font-family="Instrument Serif,Georgia,serif" font-size="11" fill="#121212">Felix</text><text y="20" text-anchor="middle" font-family="Geist,sans-serif" font-size="6" letter-spacing="1" fill="#121212">SEITE A · 33⅓</text></g><circle r="2.5" fill="#121212"/>';

// Bewegung: Zeit + Scrollen
const arcs=document.getElementById('arcs'), prog=document.getElementById('progress');
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(t){
  const y=scrollY, max=document.documentElement.scrollHeight-innerHeight;
  prog.style.transform=`scaleX(${max>0?y/max:0})`;
  if(!still){
    g.setAttribute('transform',`rotate(${t*0.004+y*0.06})`);
    arcs.style.transform=`translateY(${Math.max(0,60-y*0.06)}px)`;
    vinyl.style.transform=`rotate(${t*0.02+y*0.25}deg)`;
    requestAnimationFrame(frame);
  }
}
requestAnimationFrame(frame);
if(still)addEventListener('scroll',()=>requestAnimationFrame(frame),{passive:true});

// Beim Scrollen einblenden (nur was beim Laden unterhalb des Bildschirms liegt)
if('IntersectionObserver' in window && !still){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach((el,i)=>{
    if(el.getBoundingClientRect().top>innerHeight){el.classList.add('pre');el.style.transitionDelay=(i%4)*70+'ms';io.observe(el);}
  });
}

const root=document.documentElement, tb=document.getElementById('theme');
const isLight=()=>root.dataset.theme?root.dataset.theme==='light':matchMedia('(prefers-color-scheme: light)').matches;
const lab=()=>tb.textContent=isLight()?'Dunkel':'Hell';
try{const s=localStorage.getItem('theme');if(s)root.dataset.theme=s;}catch(e){}
lab();
tb.onclick=()=>{root.dataset.theme=isLight()?'dark':'light';lab();try{localStorage.setItem('theme',root.dataset.theme);}catch(e){}};

const cb=document.getElementById('copy');
cb.onclick=()=>{
  const m=document.getElementById('mail');
  navigator.clipboard.writeText(m.textContent).then(()=>{cb.textContent='Kopiert';setTimeout(()=>cb.textContent='Adresse kopieren',1800);})
  .catch(()=>{const r=document.createRange();r.selectNodeContents(m);const s=getSelection();s.removeAllRanges();s.addRange(r);cb.textContent='Markiert';});
};
