async page=>{
 const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 const admin=await context.newPage(),client=await context.newPage(),errors=[];
 for(const p of [admin,client])p.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:8091/',stamp=Date.now();
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 const save=async p=>{await p.locator('#form > .primary').click();await p.waitForFunction(()=>!document.querySelector('#modal').open)};
 const tab=async id=>admin.locator(`[data-action="admin-tab"][data-tab="${id}"]`).click();
 try{
 const record=await(await admin.request.get(url+'api/state')).json();const sample=await(await admin.request.get(url+'api/example')).json();await admin.request.post(url+'api/state',{data:{revision:record.revision,state:sample}});
 await admin.goto(url+'admin.html?qa='+stamp);await admin.waitForFunction(()=>document.querySelector('.admin-metrics'));
 await client.setViewportSize({width:393,height:852});await client.goto(url+'index.html?qa='+stamp);await client.waitForFunction(()=>document.querySelector('.home-balance'));
 check(await client.locator('[data-action="edit-profile"]').count()===0,'Client exposes data editor');
 await tab('cards');await admin.locator('[data-action="admin-card"][data-id="main"]').click();await admin.locator('#f-balance').fill('1000');await save(admin);
 await client.waitForFunction(()=>document.querySelector('.home-balance strong').textContent.includes('1 000.00'));
 await tab('profile');await admin.locator('[data-action="admin-profile"]').click();await admin.locator('#f-name').fill('QA демо');await admin.locator('#f-holder').fill('DEMO TEST');await admin.locator('#f-cashback').fill('2');await save(admin);
 await client.waitForFunction(()=>document.querySelector('.cashback').textContent.includes('2.00'));
 await tab('transactions');await admin.locator('[data-action="admin-new-tx"]').click();await admin.locator('#f-title').fill('QA надходження');await admin.locator('#f-kind').selectOption('1');await admin.locator('#f-amount').fill('250');await admin.locator('#tx-logo').setInputFiles('D:/mono-mock/dist/icon.png');await save(admin);
 await client.waitForFunction(()=>document.querySelector('.home-balance strong').textContent.includes('1 250.00'));
 const txrow=admin.locator('.admin-row').filter({hasText:'QA надходження'});await txrow.locator('[data-action="admin-tx-file"]').click();await admin.locator('#f-name').fill('QA квитанція');await admin.locator('#upload').setInputFiles('D:/mono-mock/dist/icon.png');await save(admin);
 await client.getByRole('button',{name:/QA надходження/}).click();await client.locator('[data-action="receipt"]').first().click();await client.waitForFunction(()=>document.querySelector('.file-view img')?.complete);check(await client.locator('.file-watermark').count()===1,'Missing attachment sample label');
 await client.goto(url+'index.html?qa='+stamp+'#home');await client.waitForFunction(()=>document.querySelector('.home-balance'));
 await client.locator('[data-action="transfer"]').click();await client.locator('#f-recipient').fill('0000000000000001');await client.locator('#f-title').fill('QA витрата');await client.locator('#f-amount').fill('2000');await client.locator('#form > .primary').click();check((await client.locator('#error').innerText()).includes('Недостатньо'),'Insufficient funds validation missing');await client.locator('#f-amount').fill('50');await save(client);
 check((await client.locator('.home-balance').innerText()).includes('1 200.00'),'Transfer balance wrong');
 await client.getByRole('button',{name:'Накопичення',exact:true}).click();await client.getByRole('button',{name:/Відкрити Банку/}).click();await client.locator('#f-name').fill('QA Банка');await client.locator('#f-target').fill('500');await save(client);
 await client.locator('[data-action="jar-view"]').click();await client.locator('[data-action="jar-topup"]').click();await client.locator('#f-amount').fill('2000');await client.locator('#form > .primary').click();check((await client.locator('#error').innerText()).includes('Недостатньо'),'Jar validation missing');await client.locator('#f-amount').fill('100');await save(client);
 check((await client.locator('.saving-item').innerText()).includes('100.00'),'Jar balance wrong after retry');
 await client.getByRole('button',{name:'Картки',exact:true}).click();check((await client.locator('.home-balance').innerText()).includes('1 100.00'),'Jar did not debit card');
 await client.getByRole('button',{name:'Відкрити Чорна картка',exact:true}).click();await client.waitForTimeout(300);await client.locator('[data-action="flip-card"]').click();check(await client.locator('.expanded-card.flipped').count()===1,'Card flip failed');await client.locator('[data-action="toggle-block"]').click();await client.getByRole('button',{name:'Закрити',exact:true}).click();await client.locator('[data-action="transfer"]').click();check(await client.locator('#modal[open]').count()===0,'Blocked card allowed transfer');
 await client.getByRole('button',{name:'Відкрити Чорна картка',exact:true}).click();await client.locator('[data-action="toggle-block"]').click();await client.getByRole('button',{name:'Закрити',exact:true}).click();
 await tab('savings');await admin.locator('[data-action="admin-jar"][data-id]').click();await admin.locator('#f-amount').fill('300');await save(admin);await admin.locator('[data-action="admin-deposit"]').click();await admin.locator('#f-amount').fill('500');await save(admin);
 await client.getByRole('button',{name:'Накопичення',exact:true}).click();await client.waitForFunction(()=>document.querySelectorAll('.saving-item').length===2);
 await tab('contacts');await admin.locator('[data-action="admin-contact"]').click();await admin.locator('#f-name').fill('QA контакт');await admin.locator('#f-card').fill('0000000000000012');await save(admin);await admin.locator('[data-action="admin-regular"]').click();await admin.locator('#f-title').fill('QA шаблон');await admin.locator('#f-amount').fill('15');await save(admin);
 await admin.reload();await admin.waitForFunction(()=>document.querySelector('.admin-content'));check((await admin.locator('body').innerText()).includes('QA контакт'),'Saved data missing after reload');
 await tab('overview');await admin.screenshot({path:'qa/admin-after.png'});await admin.setViewportSize({width:393,height:852});await admin.screenshot({path:'qa/admin-mobile.png'});check(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile admin overflows');
 await client.setViewportSize({width:320,height:740});check(await client.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile client overflows');
 check(errors.length===0,'Browser errors: '+errors.join('; '));
 return {passed:true,checks:['Separate admin/client','Cross-tab balance and cashback sync','Transaction and logo upload','Receipt upload and attachment viewer','Transfer balance and insufficient funds retry','Jar conservation and failed-submit retry','Card flip and blocking','Admin savings/deposit/contact/template CRUD','Persistence after reload','393px admin and 320px client overflow','No browser errors']};
 }finally{await context.close()}
}

