from PIL import Image
from collections import deque
from pathlib import Path
p=Path('dist/assets/reference')
frame=Image.open('qa/reference/rocket-frame.png').convert('RGBA')
def cut_background(box,name):
    image=frame.crop(box);pixels=image.load();w,h=image.size;queue=deque();seen=set()
    for x in range(w):queue.extend([(x,0),(x,h-1)])
    for y in range(h):queue.extend([(0,y),(w-1,y)])
    while queue:
        x,y=queue.popleft()
        if (x,y) in seen or not(0<=x<w and 0<=y<h):continue
        seen.add((x,y));r,g,b,a=pixels[x,y]
        if b>=r+7 and b>=g+5 and max(r,g,b)<170:
            pixels[x,y]=(0,0,0,0)
            queue.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
    image.save(p/(name+'.png'))
cut_background((169,263,225,343),'refresh-rocket')
cut_background((172,524,219,559),'refresh-smoke')
sheet=Image.open('qa/reference/transfer-sequence.png').convert('RGB')
tile=sheet.crop((390+90,894+33,390+154,894+97))
green=min(g for r,g,b in tile.getdata())
alpha=Image.new('RGBA',tile.size)
alpha.putdata([(255,255,255,max(0,min(95,int((g-green)*2.4)))) for r,g,b in tile.getdata()])
alpha.save(p/'mono-operation-pattern.png')
