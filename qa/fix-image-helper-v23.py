from pathlib import Path
p=Path('dist/recording.js');s=p.read_text(encoding='utf-8').replace('const referenceImage=','let referenceImage=',1);p.write_text(s,encoding='utf-8')
