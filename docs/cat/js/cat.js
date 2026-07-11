/* ════════════════════════════════════════════════════════
   aigen7ev.cat — 🐱 Playful AI Cat Personas
   ════════════════════════════════════════════════════════ */

(function(){'use strict'

var PURRSONAS = [
  {emoji:'🐱',name:'Curious Kit',desc:'Always exploring new codebases. Asks "why?" until bugs are found.'},
  {emoji:'🦁',name:'Leo the Architect',desc:'Designs elegant, scalable systems with a majestic roar.'},
  {emoji:'🐆',name:'Cheetah Coder',desc:'Blazing fast prototype builder. Speed over perfection.'},
  {emoji:'🐈',name:'Whiskers Debugger',desc:'Finds bugs by instinct. Nine lives of debugging experience.'},
  {emoji:'🐅',name:'Tiger Tester',desc:'Aggressive QA. Breaks things so production doesn\'t.'},
  {emoji:'🐾',name:'Paw Print',desc:'Leaves clean, minimal code wherever it steps.'},
]

var CREATIONS = [
  {icon:'🎨',name:'Generative Purr-t',desc:'AI that creates cat-inspired generative art using quantum random numbers.'},
  {icon:'🐟',name:'Fish Terminal',desc:'A playful CLI theme with fish animations and purring progress bars.'},
  {icon:'🧶',name:'Yarn Workshop',desc:'Creative coding toolkit for building whimsical web experiments.'},
  {icon:'🌙',name:'Night Prowler',desc:'Late-night coding mode with warm, eye-friendly colors and cat paw ASCII art.'},
]

var pawGrid = document.getElementById('pawBg')
if(pawGrid){for(var i=0;i<20;i++){var s=document.createElement('span');s.textContent='🐾';s.style.left=(Math.random()*95)+'%';s.style.animationDuration=(15+Math.random()*25)+'s';s.style.animationDelay=(Math.random()*20)+'s';s.style.fontSize=(3+Math.random()*6)+'rem';pawGrid.appendChild(s)}}

var pg=document.getElementById('purrsonaGrid')
if(pg){for(var i=0;i<PURRSONAS.length;i++){var p=PURRSONAS[i];var c=document.createElement('div');c.className='purrsona-card';c.style.animationDelay=(i*0.08)+'s';c.innerHTML='<div class="purrsona-emoji">'+p.emoji+'</div><div class="purrsona-name">'+p.name+'</div><div class="purrsona-desc">'+p.desc+'</div>';pg.appendChild(c)}}

var cg=document.getElementById('creationGrid')
if(cg){for(var i=0;i<CREATIONS.length;i++){var cr=CREATIONS[i];var cd=document.createElement('div');cd.className='creation-card';cd.style.animationDelay=(i*0.1)+'s';cd.innerHTML='<div class="icon">'+cr.icon+'</div><h3>'+cr.name+'</h3><p>'+cr.desc+'</p>';cg.appendChild(cd)}}

})()
