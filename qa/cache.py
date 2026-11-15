from pathlib import Path
for f in ['index.html','admin.html']:
 p=Path('dist')/f;s=p.read_text(encoding='utf-8')
 for asset in ['style.css','reference.css','app.js','experience.js']: s=s.replace('"'+asset+'"','"'+asset+'?v=6"')
 p.write_text(s,encoding='utf-8')
