from pathlib import Path
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s=s.replace("name.replace(/ картка$/,''):'З '+name.replace(/^Чорна/,'Чорної').replace(/^Біла/,'Білої')", "name.replace(/ картка$/,'').replace(/^Чорна/,'Чорну').replace(/^Біла/,'Білу'):'З '+name.replace(/^Чорна/,'Чорної').replace(/^Біла/,'Білої').replace(/ картка$/,' картки')")
s=s.replace("const scene=beginEdgeReturn();if(!scene)return backBeforeHistory();skipPageMotion=true;", "const scene=beginEdgeReturn();if(!scene)return backBeforeHistory();delete document.documentElement.dataset.editing;skipPageMotion=true;")
p.write_text(s,encoding='utf-8')
