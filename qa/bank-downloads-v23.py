import urllib.request,urllib.parse,io,json
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='link' and 'icon' in a.get('rel',''):self.links.append(a)
def fetch(item):
 name,host=item
 headers={'User-Agent':'Mozilla/5.0','Referer':host}
 try:
  html=urllib.request.urlopen(urllib.request.Request(host,headers=headers),timeout=20).read().decode('utf-8','replace');p=Links();p.feed(html)
  candidates=sorted(p.links,key=lambda a:('apple-touch' in a.get('rel',''), '180' in a.get('sizes',''), 'png' in a.get('href','')),reverse=True)
  for a in candidates+[{'href':'/favicon.ico'}]:
   try:
    url=urllib.parse.urljoin(host,a['href']);data=urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=20).read()
    path=Path('dist/assets/reference/bank-'+name)
    if b'<svg' in data[:600]:path=path.with_suffix('.svg');path.write_bytes(data)
    else:
     im=Image.open(io.BytesIO(data))
     if hasattr(im,'ico'):im=im.ico.getimage(max(im.ico.sizes(),key=lambda s:s[0]))
     path=path.with_suffix('.png');im.convert('RGBA').save(path)
    return {'id':name,'logo':str(path.relative_to('dist')).replace('\\','/'),'source':url}
   except Exception:pass
  return {'id':name,'error':'no icon'}
 except Exception as e:return {'id':name,'error':str(e)}
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(fetch,[('privat','https://privatbank.ua/'),('oschad','https://www.oschadbank.ua/'),('ukrsib','https://ukrsibbank.com/'),('otp','https://www.otpbank.com.ua/')]))
Path('qa/bank-assets-v23.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=False))
