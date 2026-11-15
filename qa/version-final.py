from pathlib import Path
for f in ['index.html','admin.html']:
 p=Path('dist')/f;s=p.read_text(encoding='utf-8').replace('?v=8','?v=9');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('mono-mock-v8','mono-mock-v9').replace('?v=8','?v=9').replace('const ASSETS=[','const ASSETS=["./assets/profile-character.png", "./assets/achievement-0.png", "./assets/achievement-1.png", "./assets/achievement-2.png",');p.write_text(s,encoding='utf-8')
