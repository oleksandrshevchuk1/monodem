import urllib.request,re
for host in ['https://a-bank.com.ua/','https://raiffeisen.ua/','https://www.pumb.ua/']:
 try:
  req=urllib.request.Request(host,headers={'User-Agent':'Mozilla/5.0'})
  data=urllib.request.urlopen(req,timeout=25).read().decode('utf-8','replace')
  print(host, re.findall(r'<link[^>]+(?:icon)[^>]*>',data,re.I)[:8])
 except Exception as e:print(host,str(e))
