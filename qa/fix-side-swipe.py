from pathlib import Path
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s=s.replace("sideEntrance?.effect?.target===app&&sideEntrance.cancel()", "if(sideEntrance?.effect?.target===app){sideEntrance.cancel();sideEntrance=null}")
s=s.replace("sideEntrance?.finish();start={x,y,id}","if(sideEntrance){sideEntrance.cancel();sideEntrance=null}start={x,y,id}")
p.write_text(s,encoding='utf-8')
