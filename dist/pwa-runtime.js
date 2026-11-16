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

// Funding selection preserves the form and follows the dark reference sheet.
const fundingSheetBeforeReference=actions['transfer-funding'];
actions['transfer-funding']=()=>{
 if(!recipientDraft)return;
 document.activeElement?.blur();fundingSheetBeforeReference();
 const sheet=document.querySelector('#modal');sheet.dataset.sheet='funding';
 const heading=sheet.querySelector('#modal-title');heading.textContent=recipientDraft.title||'Одержувач';heading.tabIndex=-1;
 const portrait=document.createElement('span');portrait.className='recipient-icon mono funding-recipient';portrait.innerHTML=recipientPicture(recipientDraft);heading.prepend(portrait);heading.focus({preventScroll:true});
};
document.querySelector('#modal').addEventListener('close',()=>{if(!document.querySelector('#modal').open)delete document.querySelector('#modal').dataset.sheet;requestAnimationFrame(updateInstalledViewport)});

// Keep the dialog in the top layer until its exit finishes.
const animatedDialog=document.querySelector('#modal'),nativeDialogClose=animatedDialog.close.bind(animatedDialog);
let dialogExit=null;
function finishDialogExit(){const exit=dialogExit;if(!exit)return;dialogExit=null;nativeDialogClose(exit.value);exit.motion.cancel();delete animatedDialog.dataset.closing}
animatedDialog.close=function(value){
 if(!this.open||dialogExit)return;
 if(!['sheet','profile'].includes(this.dataset.kind)||shouldReduceMotion()){nativeDialogClose(value);return}
 const pose=getComputedStyle(this),fromTransform=pose.transform,fromOpacity=pose.opacity;this.getAnimations().forEach(animation=>animation.cancel());this.dataset.closing='true';
 const motion=this.animate([{transform:fromTransform,opacity:fromOpacity},{transform:'translateY(100%)',opacity:0}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)',fill:'both'});
 const exit={motion,value};dialogExit=exit;motion.finished.then(()=>{if(dialogExit===exit)finishDialogExit()}).catch(()=>{});
};
animatedDialog.addEventListener('cancel',event=>{event.preventDefault();animatedDialog.close()});
const modalBeforeAnimatedExit=modal;modal=function(...args){finishDialogExit();modalBeforeAnimatedExit(...args);prepareVisibleGlyphs()};

const backBeforeExitGuard=back;back=function(){if(sideEntrance?.isRouteExit)return;return backBeforeExitGuard()};actions.back=()=>back();
document.documentElement.dataset.runtimeReady='true';updateInstalledViewport();releaseStableBoot();

// Full-height profile sheets start below the viewport, like the supplied recording.
const profileSheetBeforeRestoredMotion=actions['profile-sheet'];
actions['profile-sheet']=()=>{profileSheetBeforeRestoredMotion();const sheet=$('#modal');sheet.getAnimations().forEach(a=>a.cancel());if(!shouldReduceMotion())sheet.animate([{transform:'translate3d(0,100%,0)'},{transform:'translate3d(0,0,0)'}],{duration:320,easing:'cubic-bezier(.32,.72,0,1)'});};

// Secondary pages share the reference's existing side transition; tab changes stay immediate.
for(const name of ['personal','cardDetails','statement','subscriptions','platinum','support'])sidePages.add(name);
// During an unfinished entrance, an edge touch lands on the scroll host, outside
// the translated page. Forward only those events so one gesture can reverse it.
const sideGestureHost=document.querySelector('#pwa-scroll')||document.body;
for(const type of ['touchstart','touchmove','touchend','touchcancel','pointerdown','pointermove','pointerup','pointercancel']){
 sideGestureHost.addEventListener(type,event=>{
  if(!sidePages.has(route.page)||document.querySelector('#modal').open)return;
  const app=document.querySelector('#app');if(app.contains(event.target))return;
  const handler=app['on'+type];if(handler)handler.call(app,event);
 },{passive:false});
}
