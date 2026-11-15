async page=>{
await page.setViewportSize({width:393,height:852});await page.goto('http://127.0.0.1:8080/index.html?v=7');await page.waitForFunction(()=>document.querySelector('.home-balance'));await page.screenshot({path:'qa/home-after.png'});
await page.getByRole('button',{name:'Відкрити Чорна картка',exact:true}).click();await page.waitForTimeout(300);await page.screenshot({path:'qa/card-after.png'});
await page.getByRole('button',{name:'Перевернути картку'}).click();await page.waitForTimeout(300);await page.screenshot({path:'qa/card-back.png'});
await page.goto('http://127.0.0.1:8080/index.html?v=7#jars');await page.waitForFunction(()=>document.querySelector('.savings-launch'));await page.screenshot({path:'qa/savings-after.png'});
await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:8080/admin.html?v=7');await page.waitForFunction(()=>document.querySelector('.admin-content'));await page.screenshot({path:'qa/admin-after.png'});
return await page.locator('body').innerText();
}


