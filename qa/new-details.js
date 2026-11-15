async page=>{
await page.setViewportSize({width:1170,height:1740});await page.goto('http://127.0.0.1:8080/index.html?frames='+Date.now());
for(const [name,times] of Object.entries({motion:[15.7,16.4,17.1,18.3,19.1,22],cards:[27.5,29,30.5,32,33.5,35],pages:[37,46.5,49.8,51,53,55.5]})){
await page.evaluate(async times=>{const v=document.createElement('video');v.src=URL.createObjectURL(await(await fetch('/reference-new.mp4')).blob());v.muted=true;document.body.replaceChildren(v);await new Promise(r=>v.onloadeddata=r);const c=document.createElement('canvas');c.width=1170;c.height=1740;const x=c.getContext('2d');x.fillStyle='#ddd';x.fillRect(0,0,c.width,c.height);for(let i=0;i<times.length;i++){const ready=new Promise(r=>v.onseeked=r);v.currentTime=times[i];await ready;const left=i%3*390,top=Math.floor(i/3)*870;x.drawImage(v,left,top+24,390,843);x.fillStyle='#111';x.font='18px Arial';x.fillText(times[i]+'s',left,top+19)}document.body.replaceChildren(c);document.body.style.margin='0'},times);
await page.screenshot({path:'qa/reference/new-'+name+'.png'});
}
}
