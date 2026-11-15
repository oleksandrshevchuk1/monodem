from PIL import Image
from pathlib import Path
dest=Path('dist/assets/reference');dest.mkdir(exist_ok=True)
home=Image.open('D:/Users/User/Downloads/5460622893768187201.jpg').convert('RGB')
card=Image.open('D:/Users/User/Downloads/5460622893768187200.jpg').convert('RGB')
def white_asset(source,box,name):
 im=source.crop(box);out=Image.new('RGBA',im.size)
 out.putdata([(255,255,255, max(0,min(255,round((min(r,g,b)-85)*255/170)))) for r,g,b in im.getdata()])
 bounds=out.getbbox()
 if bounds: out=out.crop(bounds)
 out.save(dest/(name+'.png'))
for name,box in {'cat-fill':(900,181,984,256),'gift-fill':(576,181,636,251),'chart-bar-fill':(1053,181,1120,254),'chat-circle-fill':(202,188,271,258),'credit-card-fill':(189,1457,262,1540),'receipt-fill':(550,1451,620,1549),'stack-fill':(906,1451,981,1549)}.items():white_asset(home,box,name)
for name,box in {'card-brand':(124,413,490,503),'visa':(876,876,1080,951),'gear':(123,1171,190,1238),'apple-native':(126,1593,189,1664),'lock-key':(126,1810,187,1879),'wallet':(124,2034,193,2105)}.items():white_asset(card,box,name)
