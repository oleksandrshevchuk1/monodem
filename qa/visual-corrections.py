from pathlib import Path
from PIL import Image
Image.open('qa/reference/detail-wardrobe.png').crop((153,584,239,671)).save('dist/assets/achievement-4.png')
p=Path('dist/experience.js');s=p.read_text(encoding='utf-8').replace("from.snapshot.animate([{opacity:1},{opacity:0}],{duration:280,easing:'ease-out'})", "from.snapshot.animate([{opacity:1,offset:0},{opacity:1,offset:.45},{opacity:0,offset:1}],{duration:280,easing:'ease-out'})")
s=s.replace("document.body.append(node);to.style.opacity='0';", "document.body.append(node);to.style.opacity='0';if(opening){document.querySelectorAll('.card-settings>.payment-settings,.card-settings>h2,.card-settings>.settings-group,.card-close').forEach(el=>el.animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:120,delay:160,easing:'cubic-bezier(.23,1,.32,1)',fill:'backwards'}))}")
p.write_text(s,encoding='utf-8')
