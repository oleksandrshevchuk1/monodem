from pathlib import Path
p=Path('dist/app.js');s=p.read_text(encoding='utf-8');s=s.replace("today=()=>new Date().toISOString().slice(0,10)", "today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}")
s=s.replace(".sort((a,b)=>(b.date+(b.time||'')).localeCompare(a.date+(a.time||'')))", ".sort(compareTransactions)")
pos=s.index('const mainCard=');s=s[:pos]+'''function compareTransactions(a,b){return ((b.date||'')+'T'+(b.time||'00:00')).localeCompare((a.date||'')+'T'+(a.time||'00:00'))||Number(b.createdAt||0)-Number(a.createdAt||0)||state.transactions.indexOf(b)-state.transactions.indexOf(a)}
function shouldReduceMotion(){const mode=state.motionPreference||'full';return mode==='reduced'||(mode==='system'&&matchMedia('(prefers-reduced-motion: reduce)').matches)}
''' +s[pos:]
s=s.replace("function grouped(tx){let date='';", "function grouped(tx){tx=[...tx].sort(compareTransactions);let date='';")
p.write_text(s,encoding='utf-8')
p=Path('dist/experience.js');s=p.read_text(encoding='utf-8').replace(".sort((a,b)=>(b.date+(b.time||'')).localeCompare(a.date+(a.time||'')))", ".sort(compareTransactions)")
s=s.replace("t.time||'12:00','time'", "t.time||new Date().toTimeString().slice(0,5),'time'")
s=s.replace("id:old?.id||uid(),title,cardId", "id:old?.id||uid(),createdAt:old?(old.createdAt||0):Date.now(),title,cardId")
s=s.replace("state.transactions.push({id:uid(),title,amount:-amount", "state.transactions.push({id:uid(),createdAt:Date.now(),title,amount:-amount")
p.write_text(s,encoding='utf-8')
p=Path('dist/interactions.js');s=p.read_text(encoding='utf-8');s=s.replace("render=function(){if(!adminMode&&", "render=function(){document.documentElement.dataset.motion=state.motionPreference||'full';if(loading){priorInteractionsRender();return}if(!adminMode&&")
s=s.replace("$('#recipient-query').oninput=e=>$('#transfer-contact-list').innerHTML=transferContacts(e.target.value)", "$('#recipient-query').oninput=e=>{document.documentElement.dataset.editing='true';$('#transfer-contact-list').innerHTML=transferContacts(e.target.value)}")
s=s.replace("const form=$('#transfer-amount-form');if(form)form.onsubmit=", "const form=$('#transfer-amount-form');if(form)form.oninput=()=>{document.documentElement.dataset.editing='true';const f=new FormData(form);Object.assign(recipientDraft,{title:f.get('title'),amount:f.get('amount'),note:f.get('note')})};if(form)form.onsubmit=")
p.write_text(s,encoding='utf-8')
# One explicit preference governs JS and CSS. Full motion is requested by the user;
# System and Reduced remain available in client settings.
for name in ['app.js','experience.js','refinement.js','surfaces.js','interactions.js']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8')
 if name=='app.js':
  marker='function shouldReduceMotion()';a=s.index(marker);b=s.index('\n',a);helper=s[a:b];s=s[:a]+s[b:]
 else: helper=None
 s=s.replace("window.matchMedia?.('(prefers-reduced-motion: reduce)').matches", 'shouldReduceMotion()').replace("matchMedia('(prefers-reduced-motion: reduce)').matches", 'shouldReduceMotion()')
 if helper:pos=s.index('function compareTransactions');s=s[:pos]+helper+'\n'+s[pos:]
 p.write_text(s,encoding='utf-8')
for name in ['style.css','reference.css']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8');s=s.replace('@media(prefers-reduced-motion:reduce){*{', '@media(prefers-reduced-motion:reduce){html:not([data-motion="full"]) *{').replace('@media(prefers-reduced-motion:reduce){*,*::before,*::after{','@media(prefers-reduced-motion:reduce){html:not([data-motion="full"]) *,html:not([data-motion="full"]) *::before,html:not([data-motion="full"]) *::after{');p.write_text(s,encoding='utf-8')
p=Path('dist/refinement.css');s=p.read_text(encoding='utf-8').replace('@media(prefers-reduced-motion:reduce){.card-track{', '@media(prefers-reduced-motion:reduce){html:not([data-motion="full"]) .card-track{').replace('.refreshing .refresh-indicator{animation:none!important}', 'html:not([data-motion="full"]) .refreshing .refresh-indicator{animation:none!important}').replace('.stats-carousel{scroll-behavior:auto!important}', 'html:not([data-motion="full"]) .stats-carousel{scroll-behavior:auto!important}');p.write_text(s,encoding='utf-8')
p=Path('dist/interactions.css');s=p.read_text(encoding='utf-8').replace('@media(prefers-reduced-motion:reduce){::view-transition-old(app-page),::view-transition-new(app-page)', '@media(prefers-reduced-motion:reduce){html:not([data-motion="full"])::view-transition-old(app-page),html:not([data-motion="full"])::view-transition-new(app-page)');p.write_text(s,encoding='utf-8')
