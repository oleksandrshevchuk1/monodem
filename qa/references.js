async page => {
for(const name of ['one','two']){
await page.goto('http://127.0.0.1:8080/');
await page.evaluate(async name=>{const blob=await(await fetch('/reference-'+name+'.mp4')).blob();const v=document.createElement('video');v.src=URL.createObjectURL(blob);v.muted=true;document.body.replaceChildren(v);await new Promise(r=>v.addEventListener('loadeddata',r,{once:true}));const duration=v.duration;const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1000;const ctx=canvas.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,1200,1000);for(let i=0;i<12;i++){const time=.1+i*duration/12;const seeked=new Promise(r=>v.addEventListener('seeked',r,{once:true}));v.currentTime=time;await seeked;const x=i%6*200,y=Math.floor(i/6)*500;ctx.drawImage(v,x,y+20,196,424);ctx.fillStyle='#111';ctx.font='16px Arial';ctx.fillText(v.currentTime.toFixed(1)+'s',x,y+16)}document.body.replaceChildren(canvas);document.body.style.margin='0';},name);
await page.screenshot({path:'qa/reference/'+name+'-sheet.png'});
}
}
