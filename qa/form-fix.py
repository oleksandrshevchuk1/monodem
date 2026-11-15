from pathlib import Path
p=Path('dist/app.js');s=p.read_text(encoding='utf-8').replace('#form .primary','#form > .primary');p.write_text(s,encoding='utf-8')
p=Path('dist/reference.css');s=p.read_text(encoding='utf-8');s+='\n.primary{background:#d92d42}.notification-count{background:#d92d42}.prototype-label{background:#10133399;border-radius:4px;padding:0 3px}\n';p.write_text(s,encoding='utf-8')
for f in ['index.html','admin.html']:
 p=Path('dist')/f;s=p.read_text(encoding='utf-8').replace('?v=7','?v=8');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('mono-mock-v7','mono-mock-v8').replace('?v=7','?v=8');p.write_text(s,encoding='utf-8')
