from pathlib import Path
import json
for name in ['index.html','admin.html']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('v=16','v=17');s=s.replace('</head>','<link rel="stylesheet" href="recording.css?v=17"></head>').replace('</body>','<script src="recording.js?v=17"></script></body>');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('v16','v17').replace('v=16','v=17');s=s.replace('const ASSETS=[','const ASSETS=["./recording.js?v=17","./recording.css?v=17",'+','.join(json.dumps('./'+str(f.relative_to('dist')).replace('\\','/')) for f in Path('dist/assets/reference').glob('*.png'))+',');p.write_text(s,encoding='utf-8')
