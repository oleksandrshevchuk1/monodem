from pathlib import Path
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8').replace("if(element.classList.contains('home-content')&&e.target.closest('.operation-panel'))return;", "if(element.classList.contains('home-content')&&(e.target.closest('.operation-panel')||e.clientX-element.getBoundingClientRect().left<=28))return;");p.write_text(s,encoding='utf-8')
for name in ['index.html','admin.html','sw.js']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('v=21','v=22').replace('mono-mock-v21','mono-mock-v22');
 if name=='sw.js':s=s.replace('const ASSETS=[','const ASSETS=["./assets/reference/bank-abank.png","./assets/reference/bank-raif.png","./assets/reference/history-stack.png",')
 p.write_text(s,encoding='utf-8')
