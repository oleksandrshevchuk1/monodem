async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8091/index.html?motion=24&qa='+Date.now()+'#home');
 await page.waitForFunction(()=>!loading&&!sharedLoading);
 await page.setViewportSize({width:393,height:852});
 await page.evaluate(()=>navigate('card'));
 const opening=await page.evaluate(()=>({hidden:[...softCardSession.backdrop.querySelectorAll('.card-face')].every(c=>c.style.visibility==='hidden'),screenFilters:document.querySelector('#screen').getAnimations().some(a=>a.effect.getKeyframes().some(k=>k.filter&&k.filter!=='none'))}));
 if(!opening.hidden||opening.screenFilters)throw Error('Duplicate or filtered card');
 await page.waitForTimeout(600);
 await page.locator('.expanded-card').click();await page.waitForTimeout(650);
 const flip=await page.locator('.expanded-card .bank-card').evaluate(el=>({transform:getComputedStyle(el).transform,filter:getComputedStyle(el).filter,screenFilter:getComputedStyle(document.querySelector('#screen')).filter}));
 if(flip.filter!=='none'||flip.screenFilter!=='none')throw Error('Blurred card');
 await page.screenshot({path:'qa/v24-card-back.png'});
 await page.locator('.card-close [data-action=back]').click();await page.waitForTimeout(600);
 if(await page.locator('.soft-card-surface').count())throw Error('Stuck rear card');
 await page.locator('.operation-panel [data-page=history]').click();await page.waitForTimeout(450);
 await page.mouse.move(180,250);await page.mouse.down();await page.mouse.move(180,295,{steps:5});
 const edge=await page.locator('.operations-dissolving').evaluate(el=>({mask:getComputedStyle(el).maskImage,filter:getComputedStyle(el).filter,feather:el.style.getPropertyValue('--edge-feather')}));
 if(!edge.mask.includes('gradient')||parseFloat(edge.feather)<=0)throw Error('Hard history edge');
 await page.mouse.up();await page.waitForTimeout(500);
 if(await page.evaluate(()=>route.page)!=='home')throw Error('History failed to dismiss');
 if(errors.length)throw Error(JSON.stringify(errors));
 return {opening,flip,edge,errors};
}
