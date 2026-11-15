async page => {
await page.goto('http://127.0.0.1:8080');
const results=[];
for(const name of ['g']){
results.push(await page.evaluate(async name=>{const v=document.createElement('video');v.src=URL.createObjectURL(await(await fetch('/ref-'+name+'.mp4')).blob());v.muted=true;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;document.body.replaceChildren(v)});const meta={name,duration:v.duration,width:v.videoWidth,height:v.videoHeight};const c=document.createElement('canvas');c.width=1200;c.height=1800;const x=c.getContext('2d');x.fillStyle='#ddd';x.fillRect(0,0,1200,1800);for(let i=0;i<24;i++){const t=.05+i*(v.duration-.1)/24;await new Promise(r=>{v.onseeked=r;v.currentTime=t});await new Promise(r=>setTimeout(r,100));const a=i%6*200,b=Math.floor(i/6)*450;x.drawImage(v,a,b+20,196,426);x.fillStyle='#111';x.font='15px Arial';x.fillText(t.toFixed(2)+'s',a,b+16)}document.body.replaceChildren(c);document.body.style.margin=0;return meta},name));
await page.setViewportSize({width:1200,height:1800});await page.screenshot({path:'qa/reference/current-'+name+'.png'});
}return results;
}



