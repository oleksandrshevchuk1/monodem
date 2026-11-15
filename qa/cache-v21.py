from pathlib import Path
for name in ['index.html','admin.html','sw.js']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('v=20','v=21').replace('mono-mock-v20','mono-mock-v21');p.write_text(s,encoding='utf-8')
