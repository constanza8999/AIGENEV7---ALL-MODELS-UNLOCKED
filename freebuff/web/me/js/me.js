/* ════════════════════════════════════════════════════════
   aigen7ev.me — Personal Portfolio of CONSTANZA
   ════════════════════════════════════════════════════════ */

(function(){'use strict'

var SKILLS = [
  {emoji:'⚛️',name:'React/Next.js'},{emoji:'🐍',name:'Python'},{emoji:'💧',name:'TypeScript'},
  {emoji:'📦',name:'Node.js'},{emoji:'🧠',name:'AI/ML'},{emoji:'🔧',name:'DevOps'},
  {emoji:'📊',name:'Data'},{emoji:'🐳',name:'Docker'},{emoji:'🗄️',name:'SQL/NoSQL'},
  {emoji:'☁️',name:'Cloud'},{emoji:'🔐',name:'Security'},{emoji:'⚛️',name:'Quantum'},
  {emoji:'🎨',name:'UI/UX'},{emoji:'📝',name:'Technical Writing'},{emoji:'🛠️',name:'Developer Tooling'},
]

var PROJECTS = [
  {icon:'🤖',name:'AIGENEV7',desc:'Free, uncensored AI coding agent. 10 providers, 41 models, unlimited tokens. Open source.',tags:['AI','Open Source','CLI','Web']},
  {icon:'🛒',name:'aigen7ev.store',desc:'AI developer store for subscriptions, agent packs, digital downloads, and merch.',tags:['E-Commerce','Stripe','Products']},
  {icon:'⚛️',name:'Quantum Lab',desc:'Browser-based quantum circuit simulator. Zero API calls, unlimited qubits.',tags:['Quantum','Simulator','Web']},
  {icon:'🐱',name:'aigen7ev.cat',desc:'Playful creative AI showcase with cat-themed agent personas.',tags:['Creative','Playful','Brand']},
  {icon:'🧩',name:'Agent Gallery',desc:'Community-shared AI personas. Browse, download, and import custom agents.',tags:['Marketplace','Community','CLI']},
  {icon:'🌐',name:'aigen7ev.online',desc:'Central portal hub connecting all AIGENEV7 properties and domains.',tags:['Portal','Hub','Network']},
]

var TIMELINE = [
  {date:'2026 Q3',title:'AIGENEV7 v7 Launch',desc:'Complete rewrite with 10 AI providers, 41 models, and unlimited uncensored inference.'},
  {date:'2026 Q2',title:'Domain Expansion',desc:'Launched aigen7ev.ai, .store, .cat, .me, and .online — the full AIGENEV7 ecosystem.'},
  {date:'2026 Q1',title:'Quantum Lab',desc:'Built a browser-based quantum circuit simulator with zero API dependencies.'},
  {date:'2025 Q4',title:'Agent System',desc:'Created the custom agent system with export/import, gallery, and CLI commands.'},
  {date:'2025 Q3',title:'Open Source Release',desc:'Released AIGENEV7 as MIT open source. Community contributions began.'},
  {date:'2025 Q1',title:'First Prototype',desc:'Initial concept: a multi-provider AI coding agent with no censorship.'},
]

var sg=document.getElementById('skillsGrid')
if(sg){for(var i=0;i<SKILLS.length;i++){var s=document.createElement('span');s.className='skill';s.textContent=SKILLS[i].emoji+' '+SKILLS[i].name;sg.appendChild(s)}}

var pg=document.getElementById('projectGrid')
if(pg){for(var i=0;i<PROJECTS.length;i++){var p=PROJECTS[i];var c=document.createElement('div');c.className='project-card';c.style.animationDelay=(i*0.07)+'s';var tags='';for(var t=0;t<p.tags.length;t++){tags+='<span>'+p.tags[t]+'</span>'}c.innerHTML='<div class="project-icon">'+p.icon+'</div><div class="project-name">'+p.name+'</div><div class="project-desc">'+p.desc+'</div><div class="project-tags">'+tags+'</div>';pg.appendChild(c)}}

var tg=document.getElementById('timelineGrid')
if(tg){for(var i=0;i<TIMELINE.length;i++){var tl=TIMELINE[i];var d=document.createElement('div');d.className='timeline-item';d.style.animation='fadeInUp 0.5s ease-out '+(i*0.12)+'s both';d.innerHTML='<div class="timeline-date">'+tl.date+'</div><div class="timeline-title">'+tl.title+'</div><div class="timeline-desc">'+tl.desc+'</div>';tg.appendChild(d)}}

})()
