from pathlib import Path
p=Path('dist/app.js');s=p.read_text(encoding='utf-8').replace('<button class="menu-row"','<button type="button" class="menu-row"');p.write_text(s,encoding='utf-8')
for f in ['index.html','admin.html']:
 p=Path('dist')/f;s=p.read_text(encoding='utf-8').replace('?v=6','?v=7');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('mono-mock-v6','mono-mock-v7')
for a in ['app.js','experience.js','style.css','reference.css']:s=s.replace('./'+a+'"','./'+a+'?v=7"')
p.write_text(s,encoding='utf-8')
