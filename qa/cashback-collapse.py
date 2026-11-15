from pathlib import Path
p=Path('dist/surfaces.js');s=p.read_text(encoding='utf-8').replace("marketTab='home';","marketTab='home',cashbackExpanded=false;")
s=s.replace('<header class="cashback-gradient">','<header class="cashback-gradient ${cashbackExpanded?\'expanded\':\'\'}">')
s=s.replace('<strong>${displayMoney(state.cashback)} ₴</strong><button data-action="cashback-info"','<button class="cashback-balance-toggle" data-action="cashback-expand" aria-label="Розгорнути баланс кешбеку">${displayMoney(state.cashback)} ₴</button><button data-action="cashback-info"')
s=s.replace("actions['cashback-tab']=", "actions['cashback-expand']=()=>{cashbackExpanded=!cashbackExpanded;$('.cashback-gradient')?.classList.toggle('expanded',cashbackExpanded)};\nactions['cashback-tab']=")
p.write_text(s,encoding='utf-8')
