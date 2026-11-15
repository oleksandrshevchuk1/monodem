'use strict';
// <base href='/'> resolves assets, but hash-only History URLs must stay inside
// the installed app's /mono/ or /admin/ scope.
for(const method of ['pushState','replaceState']){const original=history[method].bind(history);history[method]=function(data,title,url){if(typeof url==='string'&&url.startsWith('#'))url=location.pathname+location.search+url;return original(data,title,url)}}

// Installed iOS apps use a single viewport-sized scrolling surface. The bottom
// navigation stays outside it, so compositing cannot pin it inside page content.
if(matchMedia('(display-mode: standalone)').matches||navigator.standalone){const host=document.createElement('div');host.id='pwa-scroll';host.className='pwa-scroll';const app=document.querySelector('#app');app.before(host);host.append(app);document.documentElement.classList.add('installed-scroll');host.addEventListener('scroll',()=>window.dispatchEvent(new Event('scroll')),{passive:true})}

// Register once, check for fresh code on resume, and never reload a form automatically.
let pwaRegistration=null,lastWorkerCheck=0,pwaWasBackgrounded=false;
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(registration=>{pwaRegistration=registration;return registration.update()}).catch(()=>{})}
function checkInstalledUpdate(){if(pwaRegistration&&Date.now()-lastWorkerCheck>60000){lastWorkerCheck=Date.now();pwaRegistration.update().catch(()=>{})}}
const activePwaPointers=new Map();
document.addEventListener('pointerdown',event=>activePwaPointers.set(event.pointerId,{target:event.target,type:event.pointerType}),{passive:true});
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,event=>activePwaPointers.delete(event.pointerId),{passive:true});
function settleInterruptedPwa(){
 for(const [pointerId,pointer]of activePwaPointers){if(pointer.target.isConnected)pointer.target.dispatchEvent(new PointerEvent('pointercancel',{pointerId,pointerType:pointer.type,bubbles:true}))}activePwaPointers.clear();
 document.dispatchEvent(new Event('touchcancel',{bubbles:true}));
 if(typeof cardSlideAnimation!=='undefined')cardSlideAnimation?.cancel();if(typeof swipeLayers!=='undefined'&&swipeLayers)cleanupSwipe();
 if(typeof glassHistory!=='undefined'&&glassHistory){const scene=glassHistory;scene.motions.forEach(motion=>motion.cancel());if(route.page==='home')cleanupGlassHistory(scene);else if(route.page==='history'){setGlassHistoryProgress(scene,1);finishSideHistoryOpen(scene)}}
 if(typeof preciseCardScene!=='undefined'&&preciseCardScene)preciseCardScene.motion.finish();
 if(typeof sideEntrance!=='undefined'&&sideEntrance){try{sideEntrance.finish()}catch{}}
}
function restorePwaControls(){
 checkInstalledUpdate();if(!pwaWasBackgrounded)return;pwaWasBackgrounded=false;settleInterruptedPwa();
 requestAnimationFrame(()=>{if(!document.querySelector('.entry-overlay')){document.querySelector('#app').inert=false;document.querySelector('#nav').inert=false}
  if(!adminMode&&route.page==='home'&&!glassHistory&&!preciseCardScene){const app=document.querySelector('#app'),nav=document.querySelector('#nav');app.style.opacity='';app.style.filter='';app.style.transform='';nav.hidden=false;nav.style.opacity='';nav.style.filter='';nav.style.transform='';document.querySelectorAll('body>.bank-surface-transition,body>.side-page-snapshot,body>.soft-card-backdrop,body>.card-return-header,body>.history-gesture-drawer').forEach(node=>node.remove());delete document.documentElement.dataset.gesture}
 });
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){pwaWasBackgrounded=true;settleInterruptedPwa()}else restorePwaControls()});
window.addEventListener('pageshow',event=>{if(event.persisted)pwaWasBackgrounded=true;restorePwaControls()});

// Keep nonessential home imagery out of the first decode/network burst.
if(!adminMode){const homeBeforeLazyMedia=home;home=function(){const template=document.createElement('template');template.innerHTML=homeBeforeLazyMedia();template.content.querySelectorAll('.home-product img').forEach(image=>{image.loading='lazy';image.decoding='async'});return template.innerHTML}}

// Explicit user preference: keep the reference layout at 1x, including pinch gestures.
for(const event of ['gesturestart','gesturechange'])document.addEventListener(event,e=>e.preventDefault(),{passive:false});
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});

// Changing the funding card updates only the balance pill, preserving the amount
// field, comment and keyboard/caret state instead of remounting the whole page.
if(!adminMode)actions['choose-transfer-funding']=button=>{if(!recipientDraft)return;recipientDraft.fromCardId=button.dataset.id;document.querySelector('#modal').close();const pill=document.querySelector('.amount-funding-pill');if(pill)pill.innerHTML=icon('credit-card')+' '+displayMoney(cardBalance(transferFundingCard()))+' ₴ '+icon('caret-right')};
