from pathlib import Path
p=Path('dist/app.js');s=p.read_text(encoding='utf-8').replace('Promise.resolve(fn(b)).catch','Promise.resolve().then(()=>fn(b)).catch');p.write_text(s,encoding='utf-8')
