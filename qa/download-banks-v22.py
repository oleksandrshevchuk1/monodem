import urllib.request
from PIL import Image
from pathlib import Path
for name,url in [('abank','https://a-bank.com.ua/favicon.ico'),('raif','https://raiffeisen.ua/img/favicon.ico')]:
 path=Path('dist/assets/reference/bank-'+name+'.ico')
 urllib.request.urlretrieve(url,path)
 im=Image.open(path)
 if hasattr(im,'ico'):im=im.ico.getimage(max(im.ico.sizes(),key=lambda s:s[0]))
 im.convert('RGBA').save(path.with_suffix('.png'));path.unlink()
 print(name,im.size)
