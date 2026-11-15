from pathlib import Path
from PIL import Image
p=Path('dist/assets/reference');p.mkdir(exist_ok=True)
def crop(frame,box,name):Image.open('qa/reference/detail-'+frame+'.png').crop(box).save(p/(name+'.png'))
crop('platinum',(15,100,378,407),'platinum')
crop('market',(16,130,378,255),'market-banner')
for i,box in enumerate([(27,566,160,693),(184,566,317,693)]):crop('market',box,'product-'+str(i))
for i,box in enumerate([(16,275,119,376),(128,275,231,376),(239,275,342,376),(16,383,119,484),(128,383,231,484),(239,383,342,484)]):crop('market',box,'market-category-'+str(i))
for category,frame in [('hats','hats'),('shirts','shirts'),('glasses','cars')]:
    for i,(x,y) in enumerate([(22,538),(152,538),(282,538),(22,650),(152,650),(282,650)]):crop(frame,(x,y,x+91,y+78),category+'-'+str(i))
for i,(x,y) in enumerate([(23,584),(153,584),(283,584),(23,715),(153,715),(283,715)]):crop('wardrobe',(x,y,x+86,y+87),'award-extra-'+str(i))
crop('poster',(16,260,378,625),'character-poster')
crop('cashback',(22,258,64,299),'cashback-medical')
crop('cashback',(22,330,64,371),'cashback-clothes')
crop('cashback',(22,403,64,445),'cashback-food')
