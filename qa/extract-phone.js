async page=>{
 await page.goto('http://127.0.0.1:8091');
 await page.evaluate(async()=>{const v=document.createElement('video');v.src='/reference-phone.mp4';v.muted=true;document.body.replaceChildren(v);await new Promise(r=>v.onloadeddata=r)});
 return await page.evaluate(async()=>{const v=document.querySelector('video'),c=document.createElement('canvas');c.width=1170;c.height=900;const ctx=c.getContext('2d');ctx.fillRect(0,0,1170,900);for(let i=0;i<12;i++){const t=i*v.duration/12;const ready=new Promise(r=>v.onseeked=r);v.currentTime=Math.max(.01,t);await ready;await new Promise(r=>setTimeout(r,160));const x=i%6*195,y=Math.floor(i/6)*450;ctx.drawImage(v,x,y+22,195,422);ctx.fillStyle='white';ctx.fillText(t.toFixed(2),x+5,y+15)}document.body.replaceChildren(c);return v.duration});
}


