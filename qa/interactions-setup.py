from pathlib import Path
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8');a=s.index('function bindRefresh(){');b=s.index('\nconst experienceRender=',a);s=s[:a]+'function bindRefresh(){}\n'+s[b:];p.write_text(s,encoding='utf-8')
p=Path('dist/app.js');s=p.read_text(encoding='utf-8').replace("function navigate(page,id){\n", "function navigate(page,id){\n delete document.documentElement.dataset.editing;\n")
s=s.replace("document.documentElement.dataset.gesture==='active'", "document.documentElement.dataset.gesture==='active'||document.documentElement.dataset.editing==='true'")
p.write_text(s,encoding='utf-8')
for f in ['index.html','admin.html']:
 p=Path('dist')/f;s=p.read_text(encoding='utf-8').replace('?v=12','?v=13').replace('<link rel=\"stylesheet\" href=\"surfaces.css?v=13\">','<link rel=\"stylesheet\" href=\"surfaces.css?v=13\"><link rel=\"stylesheet\" href=\"interactions.css?v=13\">').replace('<script src=\"surfaces.js?v=13\"></script>','<script src=\"surfaces.js?v=13\"></script><script src=\"interactions.js?v=13\"></script>');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('mono-mock-v12','mono-mock-v13').replace('?v=12','?v=13').replace('const ASSETS=[','const ASSETS=["./interactions.js?v=13", "./interactions.css?v=13", "./assets/reference/refresh-rocket.png", "./assets/reference/refresh-smoke.png", "./assets/reference/mono-operation-pattern.png",');p.write_text(s,encoding='utf-8')
