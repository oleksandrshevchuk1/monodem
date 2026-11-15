async page=>{
await page.setViewportSize({width:1200,height:2000});
await page.goto('http://127.0.0.1:8080/index.html?reference='+Date.now());
const meta=await page.evaluate(async()=>{
const v=document.createElement('video');v.src=URL.createObjectURL(await(await fetch('/reference-new.mp4')).blob());v.muted=true;document.body.replaceChildren(v);await new Promise(r=>v.onloadeddata=r);
const metadata={duration:v.duration,width:v.videoWidth,height:v.videoHeight};
const c=document.createElement('canvas');c.width=1200;c.height=2000;const ctx=c.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,c.width,c.height);
for(let i=0;i<24;i++){const t=.1+i*(v.duration-.2)/24,p=new Promise(r=>v.onseeked=r);v.currentTime=t;await p;const x=i%6*200,y=Math.floor(i/6)*500;ctx.drawImage(v,x,y+22,196,424);ctx.fillStyle='#111';ctx.font='16px Arial';ctx.fillText(t.toFixed(2)+'s',x,y+17)}
document.body.replaceChildren(c);document.body.style.margin='0';return metadata;
});
await page.screenshot({path:'qa/reference/new-sheet.png'});return meta;
}
