async page=>{
 const browser=page.context().browser(),ctx=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block'}),other=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block'}),p=await ctx.newPage(),q=await other.newPage(),errors=[];
 const url='http://127.0.0.1:8091/',checks=[];
 for(const x of [p,q])x.on('pageerror',e=>errors.push(e.message));
 const assert=(value,message)=>{if(!value)throw Error(message);checks.push(message)};
 const ready=async()=>{await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});};
 const save=async()=>{await p.locator('#form > .primary').click();await p.waitForFunction(()=>!document.querySelector('#modal').open)};
 try{
 const initial=await(await p.request.get(url+'api/state')).json();
 const state={...initial.state,activeCard:'main',extraCards:[{id:'white',account:'Біла картка',card:'0000 0000 0000 8061',color:'white',opening:0}],cardSettings:{}};
 await p.request.post(url+'api/state',{data:{revision:initial.revision,state}});
 await p.goto(url+'index.html?test='+Date.now());await p.waitForFunction(()=>document.querySelector('.card-track'));
 const drag=async()=>{await p.mouse.move(275,350);await p.mouse.down();await p.mouse.move(65,350,{steps:10});await p.mouse.up();await p.waitForTimeout(350)};
 await drag();await p.waitForFunction(()=>document.querySelector('#app').classList.contains('white-active'));assert((await p.locator('.home-balance').innerText()).includes('0.00'),'Carousel changes the active card and balance');
 await drag();await p.waitForFunction(()=>document.querySelector('.open-card-intro'));assert(await p.locator('.new-card-empty').count()===1,'Carousel includes the new-card page');
 await p.locator('.new-card-cta').click();await p.locator('[data-action="create-product-card"][data-color="black"]').click();await p.locator('#f-account').fill('QA нова картка');await save();await p.waitForFunction(()=>document.querySelector('.home-balance'));assert((await(await p.request.get(url+'api/state')).json()).state.extraCards.length===2,'New card persists on the server');
 await p.getByRole('button',{name:'Усі картки',exact:true}).click();await ready();assert(await p.locator('.compact-card').count()===3,'All cards are rendered as compact tiles');assert(/\*\* \d{4}/.test(await p.locator('.compact-number').first().innerText()),'Card suffix is outside the miniature');
 await p.locator('[data-action="select-card"][data-id="main"]').click();await p.getByRole('button',{name:'Відкрити Чорна картка',exact:true}).click();await p.waitForTimeout(300);assert(await p.locator('.expanded-card').count()===1,'Card expansion completes without a stranded overlay');
 const box=await p.locator('.expanded-card').boundingBox();await p.mouse.move(box.x+box.width*.8,box.y+box.height*.5);await p.mouse.down();await p.mouse.move(box.x+box.width*.2,box.y+box.height*.5,{steps:10});await p.mouse.up();await p.waitForTimeout(300);assert(await p.locator('.expanded-card.flipped').count()===1,'Horizontal gesture flips the expanded card');assert(await p.locator('.outside-card-number.visible').count()===1,'Card number disclosure follows the flip');
 await p.getByRole('button',{name:'Закрити',exact:true}).click();await p.goto(url+'index.html?test='+Date.now()+'#analytics');await p.waitForFunction(()=>document.querySelector('.stats-carousel'));await ready();
 await p.locator('[data-action="stats-kind"][data-kind="income"]').click();await p.waitForTimeout(400);assert(await p.locator('.stats-dots [data-kind="income"].selected').count()===1,'Statistics swipes between expenses and income');
 await p.locator('[data-action="stats-kind"][data-kind="expense"]').click();await p.waitForTimeout(300);await p.locator('[data-action="stats-source"]').click();await p.locator('.source-options input').nth(1).uncheck();await p.locator('.source-options input').nth(2).uncheck();await save();assert((await p.locator('.stats-source').innerText()).includes('1 картки'),'Statistics filters its source cards');
 await p.locator('[data-action="stats-period"]').click();await p.locator('#f-start').fill('2026-11-01');await p.locator('#f-end').fill('2026-11-14');await save();assert((await p.locator('.stats-period').innerText()).includes('листопада'),'Period selector keeps the selected dates');
 await p.getByRole('button',{name:'Капітал',exact:true}).click();assert(await p.locator('.capital-total').count()===1,'Capital page opens from statistics');
 await p.goto(url+'index.html?test='+Date.now()+'#analytics');await p.waitForFunction(()=>document.querySelector('.stats-category'));await p.locator('.stats-category').first().click();assert(await p.locator('.stats-category-page').count()===1,'Category opens its actual transactions');
 await q.goto('http://localhost:8091/index.html?independent='+Date.now());await q.waitForFunction(()=>document.querySelector('.home-balance'));const first=await(await p.request.get(url+'api/state')).json();
 await p.request.post(url+'api/state',{data:{revision:first.revision,state:{...first.state,cashback:19.27}}});await q.waitForFunction(()=>document.querySelector('.cashback').innerText.includes('19.27'));assert(true,'Independent browser context through localhost shares the same data');
 const conflict=await p.request.post(url+'api/state',{data:{revision:first.revision,state:{...first.state,cashback:99999}}});assert(conflict.status()===409,'Stale windows cannot silently overwrite newer progress');assert((await(await p.request.get(url+'api/state')).json()).state.cashback===19.27,'Rejected stale save leaves current data intact');
 const production=await(await p.request.get('http://127.0.0.1:8080/api/state')).json();assert(Number.isInteger(production.revision),'Production state remains accessible without changing user data');
 assert(errors.length===0,'No JavaScript errors in the tested flows');return {passed:true,checks};
 }finally{await ctx.close();await other.close()}
}

