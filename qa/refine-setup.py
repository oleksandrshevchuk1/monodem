from pathlib import Path
for f in ['index.html','admin.html']:
 p=Path('dist')/f;s=p.read_text(encoding='utf-8').replace('?v=9','?v=10').replace('<link rel="stylesheet" href="reference.css?v=10">','<link rel="stylesheet" href="reference.css?v=10"><link rel="stylesheet" href="refinement.css?v=10">').replace('<script src="experience.js?v=10"></script>','<script src="experience.js?v=10"></script><script src="refinement.js?v=10"></script>');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('mono-mock-v9','mono-mock-v10').replace('?v=9','?v=10').replace('const ASSETS=[','const ASSETS=["./refinement.css?v=10", "./refinement.js?v=10",')
s=s.replace('if(e.request.method!=="GET"||', 'if(new URL(e.request.url).pathname.startsWith("/api/"))return;if(e.request.method!=="GET"||')
p.write_text(s,encoding='utf-8')
