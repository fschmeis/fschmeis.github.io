const jobs=[
  ["2024 — now","Software Developer","Allegro Packets","I work on the web interface of our product. Since October 2025 as a full-time developer on the team."],
  ["2019 — 2024","Development, PMO & Sales","ccc software gmbh","I started as a student developer and became a junior developer working with Angular and .NET. Later I also took care of project planning, presented our software to customers and helped out with MES consulting."],
  ["2018 — 2019","Student Developer","ORSOFT GmbH","My first job alongside university. I automated Python API docs, built a SQLite adapter and wrote C++ tests."],
  ["2017 — 2025","Studies","HTWK Leipzig","Bachelor’s in media informatics, then a Master’s in computer science."]
];
const ul=document.getElementById('jobs');
jobs.forEach(([y,r,c,d],i)=>{
  const li=document.createElement('li');li.className='job rv';li.dataset.open='false';
  li.innerHTML=`<button type="button" aria-expanded="false"><span class="yr">${y}</span><span class="ro">${r}</span><span class="co">${c}</span></button><div class="det"><div><p>${d}</p></div></div>`;
  li.querySelector('button').onclick=e=>{const o=li.dataset.open!=='true';li.dataset.open=o;e.currentTarget.setAttribute('aria-expanded',o);};
  ul.appendChild(li);
});

// Motion: time + scroll
const prog=document.getElementById('progress');
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(){
  const y=scrollY, max=document.documentElement.scrollHeight-innerHeight;
  prog.style.transform=`scaleX(${max>0?y/max:0})`;
}
frame();
addEventListener('scroll',()=>requestAnimationFrame(frame),{passive:true});
addEventListener('resize',frame);

// Fade in on scroll (only what starts below the fold)
if('IntersectionObserver' in window && !still){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach((el,i)=>{
    if(el.getBoundingClientRect().top>innerHeight){el.classList.add('pre');el.style.transitionDelay=(i%4)*70+'ms';io.observe(el);}
  });
}

const root=document.documentElement, tb=document.getElementById('theme');
const isLight=()=>root.dataset.theme?root.dataset.theme==='light':matchMedia('(prefers-color-scheme: light)').matches;
const lab=()=>tb.textContent=isLight()?'Dark':'Light';
try{const s=localStorage.getItem('theme');if(s)root.dataset.theme=s;}catch(e){}
lab();
tb.onclick=()=>{root.dataset.theme=isLight()?'dark':'light';lab();try{localStorage.setItem('theme',root.dataset.theme);}catch(e){}};

const cb=document.getElementById('copy');
cb.onclick=()=>{
  const m=document.getElementById('mail');
  navigator.clipboard.writeText(m.textContent).then(()=>{cb.textContent='Copied';setTimeout(()=>cb.textContent='Copy address',1800);})
  .catch(()=>{const r=document.createRange();r.selectNodeContents(m);const s=getSelection();s.removeAllRanges();s.addRange(r);cb.textContent='Selected';});
};
