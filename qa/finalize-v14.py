from pathlib import Path
p=Path('dist/interactions.js');s=p.read_text(encoding='utf-8')
s=s.replace("const slowFlip=actions['flip-card'];actions['flip-card']=()=>{if(window.scrollY>30){window.scrollTo({top:0,behavior:shouldReduceMotion()?'instant':'smooth'});return}slowFlip()};", """const slowFlip=actions['flip-card'];actions['flip-card']=()=>{if(window.scrollY>30){window.scrollTo({top:0,behavior:shouldReduceMotion()?'instant':'smooth'});return}slowFlip();const panel=$('.payment-settings');if(!panel)return;const s=state.cardSettings[activeCard().id]||{};panel.classList.toggle('internet-limit',cardFlipped);panel.innerHTML=cardFlipped?icon('lock-key')+`<span>Ліміт оплат за день<progress max=\"100\" value=\"${s.online===false?0:100}\"></progress><small>${s.online===false?'Інтернет-оплати вимкнені':'Денний ліміт '+displayMoney(s.limit??10000)+' ₴'}</small></span>`:icon('gear')+'<span>Налаштування оплат<small>Додаткові перевірки</small></span>';if(!shouldReduceMotion())panel.animate([{opacity:.3},{opacity:1}],{duration:240,easing:'ease-out'})};""")
s=s.replace("screen.onpointerdown=e=>{if(!e.target.closest('input'))", "screen.onpointerdown=e=>{if(route.page!=='history')return;if(!e.target.closest('input'))")
s=s.replace("screen.onpointerup=e=>{if(!start)return;", "screen.onpointerup=e=>{if(!start||route.page!=='history')return;")
p.write_text(s,encoding='utf-8')
for name in ['index.html','admin.html','sw.js']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('v=13','v=14').replace('mono-mock-v13','mono-mock-v14');p.write_text(s,encoding='utf-8')
