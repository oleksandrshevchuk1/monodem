async page=>{
await page.setViewportSize({width:1200,height:2000});await page.goto('http://127.0.0.1:8080/index.html?ref='+Date.now());const metadata={};
for(const name of ['one','two']){
metadata[name]=await page.evaluate(async name=>{const v=document.createElement('video');v.src=URL.createObjectURL(await(await fetch('/reference-extra-'+name+'.mp4')).blob());v.muted=true;document.body.replaceChildren(v);await new Promise(r=>v.onloadeddata=r);const meta={duration:v.duration,width:v.videoWidth,height:v.videoHeight};const c=document.createElement('canvas');c.width=1200;c.height=2000;const ctx=c.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,c.width,c.height);for(let i=0;i<24;i++){const time=.1+i*(v.duration-.2)/24,ready=new Promise(r=>v.onseeked=r);v.currentTime=time;await ready;const x=i%6*200,y=Math.floor(i/6)*500;ctx.drawImage(v,x,y+22,196,424);ctx.fillStyle='#111';ctx.font='16px Arial';ctx.fillText(time.toFixed(2)+'s',x,y+17)}document.body.replaceChildren(c);document.body.style.margin='0';return meta},name);await page.screenshot({path:'qa/reference/extra-'+name+'.png'});
}return metadata;
}
