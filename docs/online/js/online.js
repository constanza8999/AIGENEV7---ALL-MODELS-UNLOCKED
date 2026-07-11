/* ════════════════════════════════════════════════════════
   aigen7ev.online — 🌐 Your AI Universe Portal
   ════════════════════════════════════════════════════════ */

(function(){'use strict'

var PORTALS = [
  {icon:'🤖',name:'AIGENEV7',tld:'.ai',desc:'Free AI coding agent. Unlimited, uncensored, all models.',url:'https://aigen7ev.ai',cls:'ai'},
  {icon:'🛒',name:'Store',tld:'.store',desc:'Subscriptions, agent packs, merch, and consulting.',url:'https://aigen7ev.store',cls:'store'},
  {icon:'🐱',name:'Cat',tld:'.cat',desc:'Playful creative AI with cat-themed personas.',url:'https://aigen7ev.cat',cls:'cat'},
  {icon:'👨‍💻',name:'Me',tld:'.me',desc:'Personal portfolio of the creator, CONSTANZA.',url:'https://aigen7ev.me',cls:'me'},
]

var FEATURES = [
  {icon:'🔥',name:'Unlimited Usage',desc:'No token caps, rate limits, or session restrictions on any domain.'},
  {icon:'🚫',name:'Uncensored AI',desc:'No content filters or safety classifiers. Pure unfiltered AI.'},
  {icon:'🌐',name:'41 Models',desc:'Claude, GPT, DeepSeek, Gemini, Grok, Kimi, MiMo, and more.'},
  {icon:'🔒',name:'Your Data Stays',desc:'Local agent runs on your machine. Nothing leaves without permission.'},
  {icon:'⚡',name:'Zero Config',desc:'No subscriptions, credit cards, or accounts needed. Just run.'},
  {icon:'🔓',name:'MIT Licensed',desc:'Fully open source. Fork, modify, self-host, and deploy freely.'},
  {icon:'🛠️',name:'Full Agent',desc:'Edits files, runs commands, searches code, browses the web.'},
  {icon:'🎨',name:'Creative Playground',desc:'Quantum circuits, generative art, experimental AI features.'},
]

var NETWORK = [
  {name:'aigen7ev.ai',dot:'var(--accent)',desc:'Main AI Agent'},
  {name:'aigen7ev.store',dot:'var(--green)',desc:'E-Commerce Store'},
  {name:'aigen7ev.cat',dot:'var(--orange)',desc:'Creative Playground'},
  {name:'aigen7ev.me',dot:'var(--cyan)',desc:'Personal Portfolio'},
  {name:'aigen7ev.online',dot:'var(--pink)',desc:'Central Portal'},
  {name:'github.com/constanza8999',dot:'#fff',desc:'Source Code'},
]

// Generate stars
var starsEl=document.getElementById('stars')
if(starsEl){for(var i=0;i<120;i++){var s=document.createElement('div');s.className='star';s.style.left=(Math.random()*98+1)+'%';s.style.top=(Math.random()*98+1)+'%';s.style.setProperty('--dur',(2+Math.random()*4)+'s');s.style.animationDelay=(Math.random()*3)+'s';s.style.width=s.style.height=(1+Math.random()*2)+'px';starsEl.appendChild(s)}}

// Portal cards
var pg=document.getElementById('portalGrid')
if(pg){for(var i=0;i<PORTALS.length;i++){var p=PORTALS[i];var a=document.createElement('a');a.href=p.url;a.target='_blank';a.className='portal-card '+p.cls;a.style.animationDelay=(i*0.1)+'s';a.innerHTML='<div class="icon">'+p.icon+'</div><div class="name">'+p.name+'</div><div class="tld">'+p.tld+'</div><div class="desc">'+p.desc+'</div>';pg.appendChild(a)}}

// Features grid
var fg=document.getElementById('featuresGrid')
if(fg){for(var i=0;i<FEATURES.length;i++){var f=FEATURES[i];var c=document.createElement('div');c.className='feature-card';c.style.animationDelay=(i*0.06)+'s';c.innerHTML='<div class="icon">'+f.icon+'</div><h3>'+f.name+'</h3><p>'+f.desc+'</p>';fg.appendChild(c)}}

// Network map
var mg=document.getElementById('mapGrid')
if(mg){for(var i=0;i<NETWORK.length;i++){var n=NETWORK[i];var d=document.createElement('a');d.href='https://'+n.name;d.target='_blank';d.className='map-node';d.innerHTML='<div class="dot" style="background:'+n.dot+';box-shadow:0 0 6px '+n.dot+'"></div><div class="node-label">'+n.name+'</div><div style="font-size:0.62rem;color:var(--text-muted);margin-top:0.15rem">'+n.desc+'</div>';mg.appendChild(d)}}

})()
