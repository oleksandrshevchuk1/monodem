import cv2
from PIL import Image,ImageDraw
c=cv2.VideoCapture(r'D:\Users\User\Downloads\RPReplay_Final1794694906.mp4')
dur=c.get(cv2.CAP_PROP_FRAME_COUNT)/c.get(cv2.CAP_PROP_FPS)
print(dur)
out=Image.new('RGB',(1170,900)); d=ImageDraw.Draw(out)
for i in range(12):
 t=i*dur/12
 c.set(cv2.CAP_PROP_POS_MSEC,t*1000)
 ok,f=c.read()
 if ok:
  im=Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB)); im.thumbnail((195,420)); x=(i%6)*195; y=(i//6)*450; out.paste(im,(x,y+22)); d.text((x+5,y+3),str(round(t,2)),fill='white')
out.save('qa/reference/transfer-latest-sheet.jpg')
