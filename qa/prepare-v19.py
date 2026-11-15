from pathlib import Path
from PIL import Image
im=Image.open('qa/reference/v16-credit.png');im.crop((62,210,160,308)).save('dist/assets/reference/credit-heart.png')
im=Image.open('qa/reference/v16-incoming.png');im.crop((181,507,206,535)).save('dist/assets/reference/incoming-reply.png');im.crop((498,509,525,537)).save('dist/assets/reference/incoming-smile.png')
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s=s.replace("pane.append(preview);l.pages.push({node:preview,index})", "pane.append(preview);const anchor=pane.querySelector(':scope>.home-balance,:scope>.open-card-intro'),next=content.querySelector('.home-balance,.open-card-intro');if(anchor&&next)preview.style.top=(anchor.getBoundingClientRect().top-next.getBoundingClientRect().top)+'px';l.pages.push({node:preview,index})")
p.write_text(s,encoding='utf-8')
