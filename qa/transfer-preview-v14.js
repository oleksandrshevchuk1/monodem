async page=>{
 await page.setViewportSize({width:393,height:852});await page.goto('http://127.0.0.1:8091/index.html?transfer14#transfer');await page.waitForSelector('#recipient-query');
 await page.locator('#recipient-query').fill('4111111111111111');await page.screenshot({path:'qa/transfer-found-v14.png'});
 await page.locator('[data-action="recipient-found"]').click();await page.waitForTimeout(400);await page.screenshot({path:'qa/transfer-amount-v14.png'});
 return await page.evaluate(()=>({page:route.page,overflow:document.documentElement.scrollWidth>innerWidth,errors:document.querySelector('#transfer-error')?.textContent}));
}
