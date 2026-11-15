from pathlib import Path
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8').replace('for(const i of [index-1,index+1])','for(const i of [index-1,index,index+1,index+2])');s+='\nsidePages.add("analytics");\n';p.write_text(s,encoding='utf-8')
