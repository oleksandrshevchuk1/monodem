from pathlib import Path
p=Path('dist/app.js');s=p.read_text(encoding='utf-8');s=s.replace("account:state.account,card:state.card,opening:state.opening}","account:state.account,card:state.card,opening:state.opening,holder:state.mainHolder||state.holder,color:state.mainColor||'black'}");s=s.replace('<option value="${v}"','<option value="${esc(v)}"').replace('${l}</option>','${esc(l)}</option>');p.write_text(s,encoding='utf-8')
for f in ['index.html','admin.html']:
 p=Path('dist')/f;s=p.read_text(encoding='utf-8').replace('<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="reference.css">');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('mono-mock-v5','mono-mock-v6').replace('const ASSETS=[','const ASSETS=["./admin.html", "./reference.css", "./experience.js",');p.write_text(s,encoding='utf-8')
