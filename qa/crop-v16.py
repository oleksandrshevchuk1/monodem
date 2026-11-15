from PIL import Image
from pathlib import Path
out=Path('dist/assets/reference');frames=Path('qa/reference')
def crop(frame,name,box):
 Image.open(frames/('v16-'+frame+'.png')).crop(box).save(out/(name+'.png'))
for i,(x,y) in enumerate([(73,558),(255,558),(438,558),(219,722),(481,722)]):crop('useful','useful-'+str(i),(x,y,x+43,y+43))
for i,(x,y) in enumerate([(57,252),(189,252),(322,252),(455,252),(57,407),(189,407),(322,407),(455,407)]):crop('market','home-category-'+str(i),(x,y,x+86,y+86))
for i,(x,y) in enumerate([(49,300),(335,300),(49,537),(335,537),(49,774),(335,774)]):crop('abroad','abroad-'+str(i),(x,y,x+62,y+62))
for i,(x,y) in enumerate([(49,332),(49,550),(49,908),(49,1038)]):crop('limits','limit-'+str(i),(x,y,x+62,y+62))
for i,y in enumerate([531,643,753,863,973,1083]):crop('limits-bottom','other-limit-'+str(i),(62,y,99,y+37))
crop('limits','limits-sticker',(75,700,111,736))
crop('profile','profile-personal',(49,690,111,752));crop('profile','profile-settings',(49,800,111,862));crop('profile','profile-business',(49,1043,111,1105))
crop('detail','bank-pumb',(311,162,349,200));crop('detail','invite-mail',(274,542,324,592))
crop('market','home-product-0',(49,629,252,797));crop('market','home-product-1',(270,629,472,797))
print('Reference assets extracted')
