from PIL import Image
from pathlib import Path
for frame,name,box in [('useful','currency-us',(74,440,123,489)),('useful','currency-eu',(311,440,360,489)),('market','market-owl',(440,194,469,228)),('market','market-eyes',(242,573,272,600)),('abroad','abroad-globe',(367,196,407,237)),('market','installment-paw',(211,967,236,995))]:
 Image.open('qa/reference/v16-'+frame+'.png').crop(box).save('dist/assets/reference/'+name+'.png')
