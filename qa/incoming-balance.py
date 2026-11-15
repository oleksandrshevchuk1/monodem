from pathlib import Path
from PIL import Image
im=Image.open('qa/reference/v16-incoming.png');im.crop((249,101,349,201)).save('dist/assets/reference/incoming-symbol.png')
p=Path('dist/recording.js');s=p.read_text(encoding='utf-8');s=s.replace("function homeReferenceTools()", "function operationBalance(t){const id=t.cardId||'main',card=allCards().find(c=>c.id===id)||mainCard();return card.opening+state.transactions.filter(x=>(x.cardId||'main')===id&&compareTransactions(x,t)>=0).reduce((sum,x)=>sum+x.amount,0)}\nfunction homeReferenceTools()")
s=s.replace("${displayMoney(balance())} ₴</span>","${displayMoney(operationBalance(t))} ₴</span>");p.write_text(s,encoding='utf-8')
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s=s.replace("${displayMoney(balance())} ₴</span>","${displayMoney(operationBalance(t))} ₴</span>");s=s.replace("`:icon('arrow-square-in')}</div><h1>","`:referenceImage('incoming-symbol')}</div><h1>");p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('const ASSETS=[','const ASSETS=["./assets/reference/incoming-symbol.png",');p.write_text(s,encoding='utf-8')
