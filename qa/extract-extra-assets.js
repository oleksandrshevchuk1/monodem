async page=>{
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:8091/index.html?extract='+Date.now());
for(const [video,frames] of Object.entries({one:{wardrobe:7.58,hats:13.2,shirts:15.1,cars:16.94,photo:18.81,poster:20.68,unlocked:22.55,market:26.29,cashback:31.9},two:{personal:16.06,details:51.17,statement:54.36,platinum:57.55,subscriptions:67.12,history:9.67}})){
await page.evaluate(async video=>{const v=document.createElement('video');v.src=URL.createObjectURL(await(await fetch('/reference-extra-'+video+'.mp4')).blob());v.muted=true;document.body.replaceChildren(v);await new Promise(r=>v.onloadeddata=r)},video);
for(const [name,time] of Object.entries(frames)){await page.evaluate(async time=>{const v=document.querySelector('video');document.querySelector('canvas')?.remove();const ready=new Promise(r=>v.onseeked=r);v.currentTime=time;await ready;const c=document.createElement('canvas');c.width=390;c.height=843;c.getContext('2d').drawImage(v,0,0,390,843);document.body.append(c);v.style.display='none';document.body.style.margin=0},time);await page.locator('canvas').screenshot({path:'qa/reference/detail-'+name+'.png'})}
}return 'Reference frames extracted';
}
