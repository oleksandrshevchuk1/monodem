from PIL import Image
im=Image.open('dist/assets/reference/chat-circle-fill.png').convert('RGBA'); bg=Image.new('RGBA',(240,240),'#15234c'); im.thumbnail((180,180)); bg.alpha_composite(im,((240-im.width)//2,(240-im.height)//2));bg.convert('RGB').save('qa/chat-icon-check.png')
