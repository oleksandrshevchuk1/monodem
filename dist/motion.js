'use strict';
// One moving card surface: its lettering never animates independently.
let softCardSession=null;
expandTransition=function(from,to,opening){
 if(!from||!to||shouldReduceMotion())return;
 const previous=softCardSession,oldPose=previous?.node.isConnected?getComputedStyle(previous.node).transform:null;
 const destination=to.getBoundingClientRect(),width=previous?.width||(opening?to.offsetWidth:from.width),height=width/1.586;
 const flat=previous?.flat||(opening?{x:destination.x,y:destination.y}:{x:from.center.x-width/2,y:from.center.y-height/2});
 const slide=to.classList.contains('card-face')?to.closest('.card-slide')?.getBoundingClientRect():null;
 const homeCenter=opening?from.center:{x:(slide||destination).x+(slide||destination).width/2,y:(slide||destination).y+(slide||destination).height/2};
 const ratio=(opening?from.width:to.offsetWidth)/width,dx=homeCenter.x-flat.x-width/2,dy=homeCenter.y-flat.y-height/2;
 const home=`translate3d(${dx}px,${dy}px,0) perspective(900px) rotateX(65deg) scale(${ratio})`;
 const expanded=`translate3d(${destination.x-flat.x}px,${destination.y-flat.y}px,0) perspective(900px) rotateX(0deg) scale(${opening?to.offsetWidth/width:from.scale||1})`;
 const duration=opening?500:460,node=previous?.node||document.createElement('div');
 if(!previous){node.className='card-transition soft-card-surface';node.innerHTML=cardArtwork(activeCard());Object.assign(node.style,{position:'fixed',left:flat.x+'px',top:flat.y+'px',width:width+'px',height:height+'px',zIndex:50,pointerEvents:'none'});document.body.append(node)}
 const session={node,width,flat,target:to,backdrop:from.snapshot};softCardSession=session;document.documentElement.dataset.gesture='active';
 if(previous){previous.target.style.opacity='';previous.motion.cancel();previous.faceMotion?.cancel();previous.backdrop?.remove();previous.settings?.forEach(a=>a.cancel())}
 to.style.opacity='0';
 const art=node.querySelector('.bank-card');
 // The moving surface owns the same face for its whole journey. No face crossfade.
 const rearClosing=!opening&&from.flipped;
 node.classList.toggle('returning-rear',rearClosing);
 art.style.transformStyle='preserve-3d';
 if(rearClosing){
  session.faceMotion=art.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(360deg)'}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 }
 const full=node.querySelector('.card-number-full'),masked=node.querySelector('.card-number-masked');if(full&&masked){full.style.display='inline';masked.style.display='inline';Object.assign(masked.style,{position:'absolute',left:'0',top:'0'});full.animate(opening?[{opacity:0},{opacity:1}]:[{opacity:1},{opacity:0}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});masked.animate(opening?[{opacity:1},{opacity:0}]:[{opacity:0},{opacity:1}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})}
 const homeShadow=opening?from.shadow:getComputedStyle(to.querySelector('.bank-card')).boxShadow;
 const targetShadow=getComputedStyle(to.querySelector('.bank-card')).boxShadow;
 const scaledHomeShadow=homeShadow.replace(/(-?[\d.]+)px/g,(_,n)=>(Number(n)/Math.max(.1,ratio))+'px');
 art.animate(opening?[{boxShadow:scaledHomeShadow},{boxShadow:targetShadow}]:[{boxShadow:from.shadow||'none'},{boxShadow:scaledHomeShadow}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});

 const glint=node.querySelector('.card-glint');if(glint){glint.getAnimations().forEach(a=>a.cancel());const destinationGlint=to.querySelector('.card-glint'),endGlint=destinationGlint?getComputedStyle(destinationGlint):null;glint.animate([{opacity:from.glint?.opacity||.12,transform:from.glint?.transform||'translate3d(0,0,0)'},{opacity:.32,transform:'translate3d(2%,0,0)',offset:.5},{opacity:endGlint?.opacity||.12,transform:endGlint?.transform||'translate3d(0,0,0)'}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'forwards'})}
 const nav=$('#nav');operationsNav(opening?1:0,opening?0:1,duration);session.settings=[nav.getAnimations().at(-1)].filter(Boolean);
 const backdrop=session.backdrop;backdrop?.querySelectorAll('.transition-nav').forEach(el=>el.remove());if(backdrop){document.body.append(backdrop);backdrop.classList.add('soft-card-backdrop');backdrop.querySelectorAll('.card-face,.expanded-card').forEach(card=>card.style.visibility='hidden');backdrop.animate([{opacity:1,filter:'blur(0px)'},{opacity:0,filter:'blur(7px)'}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}).finished.catch(()=>{}).finally(()=>backdrop.remove())}
 // Keep the actual 3D card outside a filtered ancestor: filtering flattens its faces.
 const settings=$('.card-settings');if(settings)for(const child of settings.children){if(child.matches('.expanded-card'))continue;session.settings.push(child.animate([{opacity:0},{opacity:1}],{duration,easing:'cubic-bezier(.32,.72,0,1)'}))}
 const start=oldPose||(opening?home:`translate3d(0,0,0) perspective(900px) rotateX(0deg) scale(${from.scale||1})`),end=opening?expanded:home;
 session.motion=node.animate([{transform:start},{transform:end}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});cardTransition=session.motion;
 session.motion.finished.then(async()=>{
  await Promise.all([...to.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
  if(softCardSession!==session||!to.isConnected)return;
  // Match the surface before handing it back; the logos keep identical geometry.
  const sourceGlint=node.querySelector('.card-glint'),targetGlint=to.querySelector('.card-glint');
  if(sourceGlint&&targetGlint){sourceGlint.getAnimations().forEach(a=>a.cancel());sourceGlint.style.opacity=getComputedStyle(targetGlint).opacity;sourceGlint.style.transform=getComputedStyle(targetGlint).transform}
  // Reveal the live card and remove the moving surface in the same frame.
  requestAnimationFrame(()=>{if(softCardSession!==session)return;to.style.opacity='';node.remove();softCardSession=null;delete document.documentElement.dataset.gesture;restoreOperationsNav()});
 }).catch(()=>{})
};
// The card and its account content follow the same gesture.
const accountPreviewCache=new Map();let previewIdleTask=0;
const prepareAccountSwipe=prepareSwipe,moveAccountSwipe=moveHomeSwipe,cleanupAccountSwipe=cleanupSwipe;
prepareSwipe=function(){
 const layer=prepareAccountSwipe();
 if(layer.pages||shouldReduceMotion())return layer;
 const pane=$('.home-content');
 const slots=[homeAccountIntro,'.home-actions','.operation-panel'];
 layer.pane=pane;
 pane.style.setProperty('--swipe-statement-row',getComputedStyle(pane).gridTemplateRows.split(' ')[4]);
 layer.movingContent=slots.map(selector=>pane.querySelector(selector));
 layer.pages=[];
 for(const index of [layer.index-1,layer.index+1]){
  if(index<0||index>allCards().length)continue;
  const content=accountPreviewCache.get(index)||buildAccountPreview(index);
  accountPreviewCache.delete(index);
  const blocks=slots.map(selector=>content.querySelector(selector));
  for(const block of blocks){
   block.classList.add('account-swipe-preview');
   block.inert=true;
   block.style.translate=`${cardPixel((index-layer.index)*layer.width)}px 0 0`;
  }
  layer.pages.push({blocks,index,content});
 }
 pane.append(...layer.pages.flatMap(page=>page.blocks));
 for(const {blocks} of layer.pages)fitMonetaryLabels(blocks[0]);
 return layer;
};
moveHomeSwipe=function(distance,rubber=true){
 const previous=swipeLayers?.dx;
 moveAccountSwipe(distance,rubber);
 const layer=swipeLayers;
 if(!layer.pages||previous===layer.dx)return;
 const translation=`${cardPixel(layer.dx)}px 0 0`;
 for(const element of layer.movingContent)element.style.translate=translation;
 for(const {blocks,index} of layer.pages){
  const direction=index-layer.index;
  const entering=direction*layer.dx<0;
  const wasEntering=direction*previous<0;
  if(!entering&&!wasEntering)continue;
  const offset=`${cardPixel(direction*layer.width+(entering?layer.dx:0))}px 0 0`;
  for(const block of blocks){
   if(entering!==wasEntering)block.classList.toggle('swipe-preview-visible',entering);
   block.style.translate=offset;
  }
 }
};
cleanupSwipe=function(){
 if(swipeLayers){
  for(const {blocks,index,content} of swipeLayers.pages||[]){
   if(!blocks[0].classList.contains('account-swipe-preview'))continue;
   for(const block of blocks)block.classList.remove('swipe-preview-visible');
   content.append(...blocks);
   accountPreviewCache.set(index,content);
  }
  swipeLayers.movingContent?.forEach(element=>element.style.removeProperty('translate'));
  swipeLayers.pane?.style.removeProperty('--swipe-statement-row');
 }
 cleanupAccountSwipe();
};
// Operations rise over the frozen home surface and dissolve back into it on pull-down.
let operationsHome=null,operationsScene=null,operationsNavMotion=null,historyTouchCleanup=null;
function freezeHome(){
 const snapshot=freezePageSurface();
 snapshot.classList.add('operations-home-underlay');
 snapshot.querySelector('.transition-nav')?.remove();
 return snapshot;
}
function operationsNav(from,to,duration){const nav=$('#nav');operationsNavMotion?.cancel();nav.hidden=false;nav.style.zIndex='46';nav.style.opacity=String(to);if(shouldReduceMotion())return;operationsNavMotion=nav.animate([{opacity:from},{opacity:to}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})}
function restoreOperationsNav(){operationsNavMotion?.cancel();operationsNavMotion=null;const nav=$('#nav');nav.style.opacity='';nav.style.zIndex='';nav.hidden=route.page==='history'||['card','detail','analytics','limits','abroad'].includes(route.page)}
function endOperationsEntrance(){
 const scene=operationsScene;
 if(scene?.phase!=='opening')return;
 operationsScene=null;
 scene.motion.cancel();
 scene.home?.remove();
 $('#app').classList.remove('operations-opening');
 delete document.documentElement.dataset.gesture;
 restoreOperationsNav();
}
function makeOperationsLayer(page){
 const rect=$('#app').getBoundingClientRect();
 const layer=document.createElement('div');
 layer.className='history-gesture-drawer soft-operations-layer history';
 Object.assign(layer.style,{left:rect.left+'px',width:rect.width+'px',height:innerHeight+'px',overflow:'hidden'});
 layer.append(page);
 document.body.append(layer);
 return layer;
}
function captureOperationsExit(page){
 const origin=page.getBoundingClientRect();
 const transform=getComputedStyle(page).transform;
 const offset=transform==='none'?0:new DOMMatrixReadOnly(transform).m42;
 const layer=makeOperationsLayer(page);
 page.style.transform='none';
 page.style.width=origin.width+'px';
 const placed=page.getBoundingClientRect();
 page.style.marginTop=(origin.top-offset-placed.top)+'px';
 page.style.marginLeft=(origin.left-placed.left)+'px';
 return {layer,offset};
}
const paintBeforeOperations=paint;
paint=function(direction){
 if(route.page!=='history'||skipPageMotion||shouldReduceMotion())return paintBeforeOperations(direction);
 pageTransition?.skipTransition();
 pageAnimation?.cancel();
 if(operationsScene?.phase==='closing')operationsScene.finish();
 endOperationsEntrance();
 const app=$('#app');
 const fromHome=app.classList.contains('home');
 const home=fromHome?freezeHome():null;
 if(home)mountHomeOpeningSurface(home);
 const historyItems=orderedHistoryItems();
 renderHistoryStart(historyItems,render);
 const page=$('#screen .all-operations-page');
 if(!page){home?.remove();return}
 app.classList.add('operations-opening');
 document.documentElement.dataset.gesture='active';
 const easing='cubic-bezier(.23,1,.32,1)';
 const backgroundTiming={duration:300,easing,fill:'both'};
 const background=home?.animate([{opacity:1,filter:'blur(0px)'},{opacity:0,filter:'blur(4px)'}],backgroundTiming);
 const homeTravel=home?.querySelector('.home-content')?.animate(
  [{transform:'translate3d(0,0,0)'},{transform:'translate3d(0,-160px,0)'}],backgroundTiming
 );
 operationsNav(1,0,300);
 const motion=page.animate([
  {transform:'translate3d(0,180px,0)',opacity:0,filter:'blur(3px)'},
  {transform:'translate3d(0,0,0)',opacity:1,filter:'blur(0px)'}
 ],{duration:320,easing,fill:'both'});
 const scene={phase:'opening',page,home,motion};
 operationsScene=scene;
 playAfterFirstPaint(...[motion,background,homeTravel,operationsNavMotion].filter(Boolean));
 motion.finished.then(()=>{
  if(operationsScene!==scene)return;
  endOperationsEntrance();
  fillHistoryInChunks(scene,historyItems);
 }).catch(()=>{});
};
const backBeforeSoftOperations=back;
back=function(){
 if(route.page!=='history')return backBeforeSoftOperations();
 const page=$('#screen .all-operations-page');
 const opening=operationsScene?.phase==='opening' ? operationsScene : null;
 const pose=opening&&page ? getComputedStyle(page) : null;
 const transform=pose?.transform;
 const opacity=pose?.opacity ?? 1;
 const filter=pose?.filter ?? 'blur(0px)';
 const homeOpacity=opening?.home ? getComputedStyle(opening.home).opacity : .3;
 const navOpacity=opening ? Number(getComputedStyle($('#nav')).opacity) : 0;
 endOperationsEntrance();
 if(!page||shouldReduceMotion())return backBeforeHistory();

 if(transform)page.style.transform=transform;
 if(page.contains(document.activeElement))document.activeElement.blur();
 const {layer,offset}=captureOperationsExit(page);
 layer.classList.add('operations-dissolving');
 layer.inert=true;
 document.documentElement.dataset.gesture='active';
 skipPageMotion=true;
 backBeforeHistory();

 const duration=340;
 const timing={duration,easing:'cubic-bezier(.23,1,.32,1)',fill:'both'};
 const homeFade=$('#app').animate([{opacity:homeOpacity},{opacity:1}],timing);
 const scene={phase:'closing',layer,motion:null,finish:null};
 operationsScene=scene;
 scene.finish=()=>{
  if(operationsScene!==scene)return;
  operationsScene=null;
  layer.remove();
  homeFade.cancel();
  scene.motion?.cancel();
  delete document.documentElement.dataset.gesture;
  restoreOperationsNav();
 };
 operationsNav(navOpacity,1,duration);
 scene.motion=layer.animate([
  {transform:`translate3d(0,${offset}px,0)`,opacity,filter,'--edge-feather':'0px'},
  {transform:`translate3d(0,${Math.max(180,offset+150)}px,0)`,opacity:0,filter:'blur(8px)','--edge-feather':'300px'}
 ],timing);
 scene.motion.finished.then(scene.finish,scene.finish);
};
actions.back=()=>back();

// Explicit avatar metadata is independent of the bank's logo.
const lookupBeforeAvatar=bankForRecipient;bankForRecipient=function(number){const bank=lookupBeforeAvatar(number),contact=state.contacts.find(c=>normalizedCard(c.card)===normalizedCard(number));return {...bank,bankId:contact?.bankId||bankPreset(bank).id,recipientAvatar:contact?.recipientAvatar||null}};
const pictureBeforeAvatar=recipientPicture;recipientPicture=function(person){if(bankPreset(person).id==='mono'&&person.recipientAvatar)return `<img class="recipient-portrait" src="${esc(person.recipientAvatar)}" alt="">`+bankBadge(person);return pictureBeforeAvatar(person)};
const pickerBeforeAvatar=actions['recipient-bank'];actions['recipient-bank']=()=>{pickerBeforeAvatar();if(recipientDraft&&bankPreset(recipientDraft).id==='mono')$('#fields').insertAdjacentHTML('beforeend',`<div class="recipient-avatar-actions"><button type="button" data-action="recipient-avatar">${icon('image')}Додати аватар одержувача</button>${recipientDraft.recipientAvatar?'<button type="button" data-action="recipient-avatar-remove">Прибрати аватар</button>':''}</div>`)};
actions['recipient-avatar']=()=>{const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.onchange=async()=>{try{const avatar=await imageData(input.files[0]);if(avatar&&recipientDraft){recipientDraft.recipientAvatar=avatar;$('#modal').close();render()}}catch(e){toast(e.message)}};input.click()};actions['recipient-avatar-remove']=()=>{recipientDraft.recipientAvatar=null;$('#modal').close();render()};
const bankEditorBeforeAvatar=addBankAdminPicker;addBankAdminPicker=function(person,collection,id){bankEditorBeforeAvatar(person,collection,id);$('#fields').insertAdjacentHTML('beforeend','<label for="recipient-avatar-file">Аватар одержувача mono · необов’язково</label><input id="recipient-avatar-file" name="recipientAvatarFile" type="file" accept="image/png,image/jpeg,image/webp">'+(person?.recipientAvatar?select('Поточний аватар','keepRecipientAvatar',[[1,'Зберегти'],[0,'Прибрати']],1):''));const save=submit;submit=async f=>{await save(f);const item=id?state[collection].find(x=>x.id===id):state[collection].at(-1);if(item)item.recipientAvatar=await imageData(f.get('recipientAvatarFile'))||(f.get('keepRecipientAvatar')==='0'?null:person?.recipientAvatar||null)}};
const detailBeforeAvatar=detail;detail=function(){const t=currentTx();let html=detailBeforeAvatar();if(t&&bankPreset(t).id==='mono'&&t.recipientAvatar){html=html.replace('<div class="reference-operation-pattern"></div>',`<div class="reference-operation-pattern avatar-operation-background"><img src="${esc(t.recipientAvatar)}" alt=""></div>`);html=html.replace(`<div class="reference-operation-avatar">${transferSymbol()}${bankBadge(t)}</div>`,`<div class="reference-operation-avatar portrait-operation">${recipientPicture(t)}</div>`)}return html.replace(/(<button[^>]*data-action="share-receipt"[^>]*>)([\s\S]*?)(<\/button>)/g,(_,a,b,c)=>a+icon('export')+'Поділитися квитанцією'+c)};
const receiptBeforeSharing=receiptPage;receiptPage=function(){return receiptBeforeSharing().replace('data-action="print">Зберегти квитанцію макета','data-action="share-receipt">Поділитися квитанцією')};
const beforeMotionRender=render;render=function(){if(swipeLayers){cardSlideAnimation?.cancel();cleanupSwipe()}accountPreviewCache.clear();beforeMotionRender()};
render();
// Coordinate page entrances, exits and interrupted gestures.
let sideEntrance=null,sideSnapshot=null,sideHomeSnapshot=null,sideSwipeLayer=null,pendingSideSnapshot=null,sideReturnClickUntil=0;
function suppressSideReturnClick(){sideReturnClickUntil=performance.now()+450}
document.addEventListener('pointerdown',event=>{
  sideReturnClickUntil=0;
 },{capture:true,passive:true});
document.addEventListener('click',event=>{if(event.detail&&performance.now()<sideReturnClickUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
const sidePages = new Set(['limits','abroad','detail']), paintWithOperations = paint;
const quickSidePages = new Set([
 'detail', 'transfer', 'transferAmount', 'transferArchive', 'iban', 'payments', 'limits', 'abroad',
 'notifications', 'cashback', 'appearance', 'analytics'
]);
const sideParentPages = new Map([
 ['capital', 'analytics'], ['statbreakdown', 'analytics'], ['statcategory', 'analytics'],
 ['notificationDetail', 'notifications'], ['photoChoice', 'appearance'], ['poster', 'appearance']
]);
const sideParentSnapshots = new Map();
const mainTabs = ['home', 'credit', 'jars', 'more', 'market'];
const tabFeedback = new WeakMap();
const tabBar = $('#nav');
tabBar.addEventListener('click', event => {
 const tab = event.target.closest('button[data-page],button[data-section]');
 if (!tab || !event.detail || shouldReduceMotion()) return;
 const page = tab.dataset.page || (tab.dataset.section === 'bank' ? 'home' : 'market');
 // Market can replace the bar while the delegated navigation click is handled.
 requestAnimationFrame(() => {
  if (route.page !== page) return;
  const selected = tabBar.querySelector('.tab.active,.market-mini-tabs .selected');
  const glyph = selected?.querySelector('.reference-control-glyph,.icon');
  if (!glyph) return;
  const previous = tabFeedback.get(glyph);
  const pose = previous?.playState === 'running' ? getComputedStyle(glyph).scale : '.84';
  previous?.cancel();
  tabFeedback.set(glyph, glyph.animate(
   [{scale: pose}, {scale: '1'}],
   {duration: 160, easing: slideEase}
  ));
 });
});
const slideEase = 'cubic-bezier(.32,.72,0,1)';
const sideSlideEase = 'cubic-bezier(.25,.1,.25,1)';
const quickSideDuration = 320;
const translateX = x => `translate3d(${x}px,0,0)`;

const navigateBeforeTabReselect = actions.nav;
actions.nav = button => {
 const page = button.dataset.page;
 if (page === sideParentPages.get(route.page) &&
     button.matches('.stats-toolbar > button:first-child, .photo-choice-page .toolbar > .back')) {
  return back();
 }
 if (button.closest('#nav') && mainTabs.includes(page) && route.page === page) {
  pageScrollTo(0, 0);
  return;
 }
 return navigateBeforeTabReselect(button);
};

// Keep the initial pose on screen while the browser prepares the new page's layers.
function playAfterFirstPaint(...motions) {
 for (const motion of motions) {
  motion.pause();
  motion.currentTime = 0;
 }
 requestAnimationFrame(() => requestAnimationFrame(() => {
  for (const motion of motions) if (motion.playState === 'paused') motion.play();
 }));
}

// Both surfaces use the same position in every frame, including the swipe handoff.
function placeSideSurfaces(app, preview, x, width) {
 app.style.transform = translateX(x);
 preview.style.transform = translateX(sideUnderlayOffset(x, width));
}

function sideUnderlayOffset(x, width) {
 const scale = window.devicePixelRatio || 1;
 return Math.round((x - width) * .25 * scale) / scale;
}

let pairedSideMotion = null;
let homeNavigationTap = null;
const homeNavigationControl = '#app.home button[data-action], #nav button[data-page]';
document.addEventListener('pointerdown',event=>{
 const control=event.target.closest(homeNavigationControl);
 homeNavigationTap=event.isPrimary&&event.button===0&&control
  ?{control,id:event.pointerId,x:event.clientX,y:event.clientY,scroll:pageScrollY()}
  :null;
},{capture:true,passive:true});
document.addEventListener('pointermove',event=>{
 const tap=homeNavigationTap;
 if(tap?.id===event.pointerId&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>7)homeNavigationTap=null;
},{capture:true,passive:true});
document.addEventListener('pointercancel',()=>{homeNavigationTap=null},{capture:true,passive:true});
document.addEventListener('mousedown',event=>{
 // Pointer navigation must not scroll the outgoing screen to focus its trigger.
 if(route.page==='home'&&event.button===0&&event.target.closest(homeNavigationControl))event.preventDefault();
},true);
document.addEventListener('click',event=>{
 const tap=homeNavigationTap;
 homeNavigationTap=null;
 if(!tap||!event.detail||!tap.control.contains(event.target)||route.page!=='home')return;
 const drift=pageScrollY()-tap.scroll;
 if (drift) pageScrollTo({top:tap.scroll,behavior:'instant'});
},true);
function canCaptureHomeTransition() {
 return !adminMode && typeof document.startViewTransition === 'function' &&
  $('#app').clientWidth >= document.documentElement.clientWidth - 2;
}

// Capture Home in its actual scroll container, with the viewport and safe-area styles already applied.
function animateCapturedHome(opening, page) {
 const root = document.documentElement;
 const foreground = $('#pwa-scroll') || $('#app');
 const nav = $('#nav');
 const markForeground = visible => {
  foreground.toggleAttribute('data-captured-home-page', visible);
  nav.toggleAttribute('data-captured-home-nav', visible && !nav.hidden);
 };
 const destination = route;
 const duration = quickSidePages.has(page) ? quickSideDuration : pageMotionDuration;
 root.dataset.capturedHome = opening ? 'opening' : 'closing';
 root.style.setProperty('--captured-home-duration', duration + 'ms');
 root.style.setProperty('--captured-home-ease', sideSlideEase);
 root.style.setProperty('--captured-home-width', foreground.getBoundingClientRect().width + 'px');
 if (!opening) markForeground(true);
 const transition = document.startViewTransition(() => {
  if (route !== destination) return;
  if (!opening) markForeground(false);
  render();
  if (opening) markForeground(true);
 });
 const motion = {
  isRouteExit: !opening,
  isHomeCapture: true,
  finish: () => transition.skipTransition(),
  cancel: () => transition.skipTransition(),
  cleanup() {
   markForeground(false);
   delete root.dataset.capturedHome;
   root.style.removeProperty('--captured-home-duration');
   root.style.removeProperty('--captured-home-ease');
   root.style.removeProperty('--captured-home-width');
  }
 };
 sideEntrance = motion;
 root.dataset.routeMotion = 'active';
 transition.ready.catch(() => {});
 const cleanup = () => {
  if (sideEntrance !== motion) return;
  finishSideEntrance();
 };
 transition.finished.then(cleanup, cleanup);
}

function animateSideSurfaces(app, preview, from, to, duration) {
 const width = app.clientWidth;
 const enteringDetail = from === width && to === 0 && !!app.querySelector('.operation-boundary-slot');
 if (enteringDetail && !pageScrollY()) app.classList.add('operation-entry-frame');
 placeSideSurfaces(app, preview, from, width);
 app.classList.add('paired-side-motion');
 const timing = {duration, easing: sideSlideEase, fill: 'both'};
 const foreground = app.animate([{transform: translateX(from)}, {transform: translateX(to)}], timing);
 const background = preview.animate([
  {transform: translateX(sideUnderlayOffset(from, width))},
  {transform: translateX(sideUnderlayOffset(to, width))}
 ], timing);
 if (from === width && to === 0) playAfterFirstPaint(foreground, background);
 const motion = {
  finished: foreground.finished,
  finish() {
   foreground.finish();
   background?.finish();
  },
  cancel() {
   foreground.cancel();
   background?.cancel();
   if (pairedSideMotion !== motion) return;
   pairedSideMotion = null;
   app.style.transform = '';
   preview.style.transform = '';
   app.classList.remove('paired-side-motion','operation-entry-frame');
  }
 };
 pairedSideMotion = motion;
 return motion;
}

function finishSideEntrance() {
 const previous = sideEntrance;
 if (!previous) return;
 sideEntrance = null;
 delete document.documentElement.dataset.routeMotion;
 previous.cancel();
 previous.cleanup?.();
}

function freezePageSurface(preserveArtwork = true) {
 const app = $('#app'), surface = captureBankSurface(preserveArtwork), source = $('#screen');
 const copy = surface.firstElementChild;
 const frame = getComputedStyle(app);
 surface.preserveArtwork = preserveArtwork;
 surface.style.borderLeft = frame.borderLeft;
 surface.style.borderRight = frame.borderRight;
 copy.style.paddingBottom = getComputedStyle(source).paddingBottom;
 surface.classList.remove('bank-surface-transition');
 surface.classList.add('side-page-snapshot');
 surface.classList.remove('paired-side-motion');
 if (surface.classList.contains('home')) {
  const content = source.querySelector('.home-content');
  const frozenContent = copy.querySelector('.home-content');
  if (content && frozenContent) {
   frozenContent.style.gridTemplateRows = getComputedStyle(content).gridTemplateRows;
  }
  surface.homeVisualTop = content ? content.getBoundingClientRect().top - (window.visualViewport?.offsetTop ?? 0) : null;
  // Match the painted Home layout even if the viewport changes during navigation.
  copy.style.top = (source.getBoundingClientRect().top - parseFloat(surface.style.top)) + 'px';
  copy.style.zIndex = getComputedStyle(source).zIndex;
  const header = source.querySelector('.home-top');
  const frozenHeader = copy.querySelector('.home-top');
  if (header && frozenHeader) {
   const style = getComputedStyle(header);
   frozenHeader.style.height = style.height;
   frozenHeader.style.paddingTop = style.paddingTop;
  }
 }
 const scroll = source.querySelector('.operation-content-scroll')?.scrollTop;
 if (scroll) copy.querySelector('.operation-content').style.transform = 'translateY(' + (-scroll) + 'px)';
 const track = source.querySelector('.card-track');
 const frozenTrack = copy.querySelector('.card-track');
 if (track && frozenTrack) {
  frozenTrack.style.transform = getComputedStyle(track).transform;
 }
 const selector = source.querySelector('.card-selector');
 const frozenSelector = copy.querySelector('.card-selector');
 if (selector && frozenSelector) {
  const style = getComputedStyle(selector);
  frozenSelector.classList.add('frozen-card-selector');
  frozenSelector.style.inlineSize = style.inlineSize;
  frozenSelector.style.blockSize = style.blockSize;
  for (const part of ['.selector-label', '.selector-dots']) {
   const livePart = selector.querySelector(part), frozenPart = frozenSelector.querySelector(part);
   if (!livePart || !frozenPart) continue;
   const pose = getComputedStyle(livePart);
   frozenPart.style.opacity = pose.opacity;
   frozenPart.style.filter = pose.filter;
   if (part === '.selector-dots') {
    Array.from(livePart.children).forEach((marker, index) => {
     frozenPart.children[index].style.opacity = getComputedStyle(marker).opacity;
    });
   }
  }
 }
 const nav = surface.querySelector('.transition-nav');
 if (nav) {
  const rect = $('#nav').getBoundingClientRect();
  Object.assign(nav.style, {
   position: 'absolute', left: (rect.left - parseFloat(surface.style.left) - parseFloat(frame.borderLeftWidth)) + 'px',
   top: (rect.top - parseFloat(surface.style.top)) + 'px', bottom: 'auto',
   width: rect.width + 'px', transform: 'none'
  });
 }
 return surface;
}

function mountHomeOpeningSurface(surface) {
 // Keep the outgoing Home under the same compositor as the live scroll surface.
 const parent = $('#pwa-scroll') || document.body;
 parent.append(surface);
}

function trackSideMotion(motion, snapshot, underlay, companion) {
 const app = $('#app');
 sideEntrance = motion;
 document.documentElement.dataset.routeMotion = 'active';
 motion.cleanup = () => {
  motion.cleanup = null;
  if (snapshot) {
   snapshot.remove();
   snapshot.style.transform = '';
  }
  underlay?.remove();
  companion?.cancel();
  if (!sideEntrance || sideEntrance === motion) app.style.zIndex = '';
 };
 motion.finished.catch(() => {}).finally(() => {
  motion.cleanup?.();
  if (sideEntrance === motion) {
   sideEntrance = null;
   delete document.documentElement.dataset.routeMotion;
  }
  motion.cancel();
 });
}

paint = function(direction) {
 if (sideEntrance?.isHomeCapture) finishSideEntrance();
 if(direction==='back'&&route.page==='analytics'&&$('#app').classList.contains('capital'))statisticsVisit=route;
 pageTransition?.skipTransition();
 pageAnimation?.cancel();
 if (skipPageMotion || shouldReduceMotion()) {
  skipPageMotion = false;
  resetSideSwipe();
  finishSideEntrance();
  render();
  return;
 }

 const app = $('#app');
 const fromSide = [...sidePages].find(page => app.classList.contains(page));
 const fromTab = mainTabs.findIndex(page => app.classList.contains(page));
 const toTab = mainTabs.indexOf(route.page);
 if (!adminMode && fromTab >= 0 && toTab >= 0 && fromTab !== toTab) {
  resetSideSwipe();
  finishSideEntrance();
  render();
  // The bar supplies the feedback. Keep the newly selected content fully opaque.
  return;
 }
 if (direction === 'back' && sideEntrance?.adoptBackDestination) {
  sideEntrance.adoptBackDestination();
  return;
 }
 if (direction === 'back' && fromSide && route.page === 'home' && !sideSwipeLayer &&
     !sidePageX(app) && canCaptureHomeTransition()) {
  finishSideEntrance();
  animateCapturedHome(false, fromSide);
  return;
 }
 if (direction === 'back' && fromSide) {
  const source = sideSourceForPage(route.page);
  if (source) {
   startLiveSideExit(source, render);
   return;
  }
 }
 if (direction === 'back' && fromSide) {
  const rect = app.getBoundingClientRect();
  const dx = new DOMMatrixReadOnly(getComputedStyle(app).transform).m41;
  const snapshot = freezePageSurface();
  resetSideSwipe();
  finishSideEntrance();
  const frozen = snapshot.querySelector('.transition-screen');
  frozen.replaceChildren(...$('#screen').childNodes);
  snapshot.style.left = (rect.x - dx) + 'px';
  snapshot.style.zIndex = 45;
  snapshot.classList.add('closing-page-surface');
  document.body.append(snapshot);
  app.style.transform = '';
  render();

  const width = app.clientWidth;
  const duration = quickSidePages.has(fromSide) ? quickSideDuration : pageMotionDuration;
  const options = {duration: Math.max(160, duration * (1 - dx / width)), easing: sideSlideEase, fill: 'both'};
  const exit = snapshot.animate([{transform: translateX(dx)}, {transform: translateX(width)}], options);
  exit.isRouteExit = true;
  const underlay = freezePageSurface();
  underlay.classList.add('side-return-underlay');
  underlay.style.zIndex = '40';
  document.body.append(underlay);
  const companion = underlay.animate([
   {transform: translateX(sideUnderlayOffset(dx, width))},
   {transform: translateX(0)}
  ], options);
  playAfterFirstPaint(exit, companion);
  trackSideMotion(exit, snapshot, underlay, companion);
  return;
 }

 resetSideSwipe();
 if (route.page === 'history') return paintWithOperations(direction);
 if (sidePages.has(route.page)) {
  finishSideEntrance();
  sideSnapshot?.remove();
  sideSnapshot = pendingSideSnapshot || freezePageSurface();
  if (sideSnapshot.classList.contains('home')) sideHomeSnapshot = sideSnapshot;
  for (const parent of sideParentPages.values()) {
   if (sideSnapshot.classList.contains(parent)) sideParentSnapshots.set(parent, sideSnapshot);
  }
  const snapshot = sideSnapshot;
  if (snapshot.classList.contains('home') && canCaptureHomeTransition()) {
   animateCapturedHome(true, route.page);
   return;
  }
  snapshot.style.zIndex = 35;
  if(snapshot.classList.contains('home'))mountHomeOpeningSurface(snapshot);
  else document.body.append(snapshot);
  renderWithHomeBackdrop(snapshot);
  app.style.zIndex = '41';

  const width = app.clientWidth;
  const duration = quickSidePages.has(route.page) ? quickSideDuration : pageMotionDuration;
  const entrance = animateSideSurfaces(app, snapshot, width, 0, duration);
  trackSideMotion(entrance, snapshot);
  return;
 }
 finishSideEntrance();
 render();
 if (route.page === 'card' || route.page === 'home') return;
 const offset = direction === 'back' ? -8 : 8;
 pageAnimation = $('#screen').animate(
  [{transform: translateX(offset)}, {transform: translateX(0)}],
  {duration: 200, easing: slideEase}
 );
};
const navigateBeforeSideViewport = navigate;
navigate = function(page, id) {
 if (page === 'detail' && route.page === page && route.id === id) return;
 if (sidePages.has(page) && page !== route.page) {
  // Capture the outgoing page at its resting position even on consecutive taps.
  resetSideSwipe();
  finishSideEntrance();
  pendingSideSnapshot = freezePageSurface();
 }
 try {
  return navigateBeforeSideViewport(page, id);
 } finally {
  pendingSideSnapshot = null;
 }
};

function sideSourceForPage(page) {
 if (sideSnapshot?.classList.contains(page)) return sideSnapshot;
 return page === 'home' ? sideHomeSnapshot : sideParentSnapshots.get(page);
}

function makeSideReturnLayer(source) {
 const layer = source?.cloneNode(true);
 if (!layer) return null;
 layer.classList.add('side-return-preview');
 layer.sourceSurface = source;
 layer.style.zIndex = '35';
 document.body.append(layer);
 return layer;
}

function sidePageX(app) {
 return new DOMMatrixReadOnly(getComputedStyle(app).transform).m41;
}

function resetSideSwipe() {
 if (!sideSwipeLayer) return;
 sideSwipeLayer.remove();
 sideSwipeLayer = null;
 delete document.documentElement.dataset.routeMotion;
 $('#app').style.zIndex = '';
 $('#app').style.transform = '';
 $('#app').classList.remove('paired-side-motion');
}

function startLiveSideExit(source, commit) {
 const app = $('#app');
 let page = route;
 const width = app.clientWidth;
 const x = sidePageX(app);
 const preview = sideSwipeLayer?.sourceSurface === source ? sideSwipeLayer : makeSideReturnLayer(source);
 if (sideSwipeLayer !== preview) sideSwipeLayer?.remove();
 sideSwipeLayer = null;
 finishSideEntrance();
 app.style.transform = '';
 app.style.zIndex = '41';

 const outgoingPage = [...sidePages].find(name => app.classList.contains(name));
 const duration = quickSidePages.has(outgoingPage) ? quickSideDuration : pageMotionDuration;
 const exit = animateSideSurfaces(app, preview, x, width, Math.max(160, duration * (1 - x / width)));
 exit.isRouteExit = true;
 trackSideMotion(exit, null, preview);
 exit.adoptBackDestination = () => {
  page = route;
  commit = render;
 };
 const cleanup = exit.cleanup;
 exit.cleanup = () => {
  // Commit navigation in the same frame that removes the outgoing page.
  if (sideEntrance === exit && route === page) {
   sideEntrance = null;
   delete document.documentElement.dataset.routeMotion;
   if (performance.now() < sideReturnClickUntil) suppressSideReturnClick();
   commit();
  }
  cleanup();
 };
}

function sideBackDestination() {
 if (route.page === 'detail') return returnRoute.page;
 if (route.page === 'receipt') return 'detail';
 if (route.page === 'file') return fileReturn.page;
 return sideParentPages.get(route.page) || 'home';
}

const backBeforeLiveSideReturn = back;
back = function() {
 if (sideEntrance?.isRouteExit) return;
 const parent = sideParentPages.get(route.page);
 if (parent) {
  routeScrollPositions.set(routeScrollKey(route),pageScrollY());
  route={page:parent};
  history.replaceState(route,'','#'+parent);
  pendingRouteScroll=routeScrollPositions.get(routeScrollKey(route))||0;
  paint('back');
  return;
 }
 const destination = sideBackDestination();
 const source = sideSourceForPage(destination);
 if (destination === 'home' && !sideSwipeLayer && !sidePageX($('#app')) && canCaptureHomeTransition()) {
  return backBeforeLiveSideReturn();
 }
 if (!sidePages.has(route.page) || !source || shouldReduceMotion() || $('#modal').open) {
  return backBeforeLiveSideReturn();
 }
 startLiveSideExit(source, () => {
  skipPageMotion = true;
  backBeforeLiveSideReturn();
 });
};
actions.back = () => back();

function bindSideReturn() {
 const app = $('#app');
 const host = app.parentElement;
 let touchId = null, start = null, origin = 0, x = 0;
 const begin = (clientX, clientY, target) => {
  const left = app.getBoundingClientRect().left - sidePageX(app);
  if (clientX < left || clientX - left > 36 || target.closest('input,textarea,select')) return;
  if (sideEntrance || $('#modal').open) return;
  start = {x: clientX, y: clientY};
 };
 const move = (clientX, clientY) => {
  if (!start) return false;
  const dx = clientX - start.x, dy = clientY - start.y;
  if (!sideSwipeLayer && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
   start = null;
   return false;
  }
  if (!sideSwipeLayer) {
   if (dx <= 10 || dx <= Math.abs(dy) * 1.65) return false;
   const destination = sideBackDestination();
   const source = sideSourceForPage(destination);
   if (!source) return false;
   origin = sidePageX(app);
   finishSideEntrance();
   sideSwipeLayer = makeSideReturnLayer(source);
   app.style.zIndex = '41';
   document.documentElement.dataset.routeMotion = 'active';
  }
  x = Math.min(app.clientWidth, Math.max(0, origin + dx));
  placeSideSurfaces(app, sideSwipeLayer, x, app.clientWidth);
  app.classList.add('paired-side-motion');
  return true;
 };
 const end = cancelled => {
  touchId = null;
  start = null;
  if (!sideSwipeLayer) return;
  suppressSideReturnClick();
  if (!cancelled && x > app.clientWidth * .23) {
   back();
   if (sideSwipeLayer) resetSideSwipe();
   return;
  }
  const layer = sideSwipeLayer;
  sideSwipeLayer = null;
  app.style.transform = '';
  const settle = animateSideSurfaces(app, layer, x, 0, 220);
  trackSideMotion(settle, null, layer);
 };

 // Track the same touch after the translated page moves away from the finger.
 const touchStart = event => {
  if (event.touches.length !== 1) return;
  const touch = event.changedTouches[0];
  begin(touch.clientX, touch.clientY, event.target);
  if (start) touchId = touch.identifier;
 };
 const touchMove = event => {
  if (touchId === null) return;
  const touch = [...event.changedTouches].find(point => point.identifier === touchId);
  if (touch && move(touch.clientX, touch.clientY) && event.cancelable) event.preventDefault();
 };
 const touchEnd = event => {
  if (touchId !== null && (event.type === 'touchcancel' ||
      [...event.changedTouches].some(point => point.identifier === touchId))) end(event.type === 'touchcancel');
 };
 host.addEventListener('touchstart', touchStart, {passive:true});
 document.addEventListener('touchmove', touchMove, {passive:false});
 document.addEventListener('touchend', touchEnd);
 document.addEventListener('touchcancel', touchEnd);
 unbindSideReturn = () => {
  host.removeEventListener('touchstart', touchStart);
  document.removeEventListener('touchmove', touchMove);
  document.removeEventListener('touchend', touchEnd);
  document.removeEventListener('touchcancel', touchEnd);
 };
 app.onpointerdown = e => {
  if (e.pointerType === 'mouse' && e.button === 0) begin(e.clientX, e.clientY, e.target);
 };
 app.onpointermove = e => {
  if (e.pointerType === 'mouse' && move(e.clientX, e.clientY) && app.contains(e.target)) app.setPointerCapture(e.pointerId);
 };
 app.onpointerup = e => { if (e.pointerType === 'mouse') end(false); };
 app.onpointercancel = e => { if (e.pointerType === 'mouse') end(true); };
}
let unbindSideReturn = null;
// Either horizontal direction on the operations panel opens the left-hand history.
bindOperationsGesture=function(){const panel=$('.operation-panel');if(!panel)return;let start=null,drawer=null,dx=0,dragging=false;panel.addEventListener('pointerdown',e=>{if(e.button!==0||e.clientX-$('#app').getBoundingClientRect().left<=28)return;start={x:e.clientX,y:e.clientY};dx=0});panel.addEventListener('pointermove',e=>{if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(!dragging&&Math.abs(y)>10&&Math.abs(y)>Math.abs(x)){start=null;return}if(!dragging&&Math.abs(x)>10&&Math.abs(x)>Math.abs(y)*1.3){dragging=true;historyPresentation='drawer';operationsHome=freezeHome();drawer=historyDrawer();drawer.classList.add('soft-operations-layer');panel.setPointerCapture(e.pointerId)}if(!dragging)return;dx=Math.min(drawer.offsetWidth,Math.abs(x));drawer.style.transform=`translate3d(${dx-drawer.offsetWidth}px,0,0)`;$('#app').style.filter=`blur(${dx/drawer.offsetWidth*6}px)`});const end=e=>{if(!start)return;start=null;if(!dragging)return;dragging=false;const node=drawer,w=node.offsetWidth,open=e.type!=='pointercancel'&&dx>w*.23,stop=e=>{e.preventDefault();e.stopPropagation()};document.addEventListener('click',stop,true);setTimeout(()=>document.removeEventListener('click',stop,true),0);if(panel.hasPointerCapture(e.pointerId))panel.releasePointerCapture(e.pointerId);const finish=()=>{node.remove();$('#app').style.filter='';if(open){skipPageMotion=true;navigate('history')}};if(shouldReduceMotion())finish();else node.animate([{transform:`translate3d(${dx-w}px,0,0)`},{transform:`translate3d(${open?0:-w}px,0,0)`}],{duration:320,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}).finished.catch(()=>{}).finally(finish)};panel.addEventListener('pointerup',end);panel.addEventListener('pointercancel',end)};
const detailBeforeIncoming=detail;
detail=function(){const t=currentTx();if(!t||t.amount<=0)return detailBeforeIncoming();const photo=t.recipientAvatar||t.logo||null,date=new Date(t.date+'T12:00:00').toLocaleDateString('uk-UA',{day:'numeric',month:'long',year:'numeric'}).replace(' р.','');return toolbar('',`<button class="right" data-action="favorite" aria-label="Закріпити операцію">${icon(t.favorite?'star-fill':'star')}</button>`)+`<div class="reference-operation incoming-operation"><div class="reference-operation-pattern ${photo?'avatar-operation-background':''}">${photo?`<img src="${esc(photo)}" alt="">`:''}</div><section class="reference-operation-head"><div class="reference-operation-avatar incoming-avatar">${photo?`<img src="${esc(photo)}" alt="">`:referenceImage('incoming-symbol')}</div><h1>${esc(t.title)}</h1><div class="reference-category"><span></span><button type="button">Поповнення картки</button><span></span></div><p>${esc(date)}, ${esc(t.time||'12:00')}</p><strong class="reference-operation-amount">${displayMoney(t.amount)} ₴</strong>${!photo?`<div class="incoming-reply-row"><button data-action="incoming-reply">${referenceImage('incoming-reply')}Відповісти</button><button data-action="incoming-reaction" aria-label="Реакція">${referenceImage('incoming-smile')}</button></div>`:''}</section><div class="reference-operation-body"><section class="reference-operation-edit"><button data-action="reference-edit-note">${icon('receipt-fill')}<span>${esc(t.note||'Опис та #теги')}</span></button><button data-action="reference-upload">${icon('upload-simple')}<span>Завантажити файл</span></button></section><div class="reference-balance">${icon('wallet')}<span><small>Залишок</small>${displayMoney(operationBalance(t))} ₴</span></div></div><section class="incoming-menu">${!photo?button('repeat','Відповісти платежем','arrow-left')+button('incoming-block','Блокування користувачів','lock-key'):''}${button('support-tx','Поставити запитання','question')}</section></div>`};
actions['incoming-reply']=()=>{const t=currentTx();modal('Відповісти',field('Повідомлення','reply','','text','required maxlength="300"'),f=>{t.demoReply=f.get('reply')},'Зберегти')};actions['incoming-reaction']=()=>inform('Реакція','Демонстраційна реакція на поповнення.');actions['incoming-block']=()=>inform('Блокування користувачів','У локальному демо користувачі не підключені до банківської мережі.');
creditPage=function(){return `<div class="reference-credit"><section>${referenceImage('credit-heart')}<div><h1>На жаль, не можемо надати вам ліміт зараз</h1><p>Але ви можете вплинути на це, розповівши про себе</p><button data-action="credit-demo-information">Надати інформацію</button></div></section></div>`};actions['credit-demo-information']=()=>inform('Надати інформацію','Особисті дані демо-профілю змінюються в окремій адмінці. Реальна кредитна заявка не надсилається.');
const historyBeforeTools=historyPage;historyPage=function(){return historyBeforeTools().replace(icon('arrow-left'),icon(historyPresentation==='card'?'x':'arrow-left')).replace('<button data-action="history-search"',`<button data-action="history-favorites" aria-label="Обрані операції">${icon('star')}</button><button data-action="history-search"`)};actions['history-favorites']=()=>{const list=$('#tx-list');if(!list)return;const active=list.dataset.favorites==='true';list.dataset.favorites=String(!active);list.innerHTML=grouped(txFor().filter(t=>active||t.favorite))};
const renderBeforeQuietNavigation=render;render=function(){unbindSideReturn?.();renderBeforeQuietNavigation();const app=$('#app');if(sidePages.has(route.page)&&!adminMode)bindSideReturn();else{app.onpointerdown=app.onpointermove=app.onpointerup=app.onpointercancel=null;app.ontouchstart=app.ontouchmove=app.ontouchend=app.ontouchcancel=null}};
render();

const stableIconMarkup={"arrow-left": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 128a8 8 0 0 1-8 8H59.31l58.35 58.34a8 8 0 0 1-11.32 11.32l-72-72a8 8 0 0 1 0-11.32l72-72a8 8 0 0 1 11.32 11.32L59.31 120H216a8 8 0 0 1 8 8\"/></svg>", "arrow-right": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"m221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32\"/></svg>", "arrow-square-in": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M128 136v64a8 8 0 0 1-16 0v-44.68l-66.34 66.34a8 8 0 0 1-11.32-11.32L100.68 144H56a8 8 0 0 1 0-16h64a8 8 0 0 1 8 8m80-104H80a16 16 0 0 0-16 16v48a8 8 0 0 0 16 0V48h128v128h-48a8 8 0 0 0 0 16h48a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16\"/></svg>", "arrow-square-out": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 104a8 8 0 0 1-16 0V59.32l-66.33 66.34a8 8 0 0 1-11.32-11.32L196.68 48H152a8 8 0 0 1 0-16h64a8 8 0 0 1 8 8Zm-40 24a8 8 0 0 0-8 8v72H48V80h72a8 8 0 0 0 0-16H48a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-72a8 8 0 0 0-8-8\"/></svg>", "arrows-clockwise": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 48v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h28.69l-14.63-14.63a79.56 79.56 0 0 0-56.13-23.43h-.45a79.52 79.52 0 0 0-55.89 22.77a8 8 0 0 1-11.18-11.44a96 96 0 0 1 135 .79L208 76.69V48a8 8 0 0 1 16 0m-37.59 135.29a80 80 0 0 1-112.47-.66L59.31 168H88a8 8 0 0 0 0-16H40a8 8 0 0 0-8 8v48a8 8 0 0 0 16 0v-28.69l14.63 14.63A95.43 95.43 0 0 0 130 222.06h.53a95.36 95.36 0 0 0 67.07-27.33a8 8 0 0 0-11.18-11.44Z\"/></svg>", "bag-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 64h-40a48 48 0 0 0-96 0H40a16 16 0 0 0-16 16v120a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16M96 104a8 8 0 0 1-16 0V88a8 8 0 0 1 16 0Zm32-72a32 32 0 0 1 32 32H96a32 32 0 0 1 32-32m48 72a8 8 0 0 1-16 0V88a8 8 0 0 1 16 0Z\"/></svg>", "calendar": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M208 32h-24v-8a8 8 0 0 0-16 0v8H88v-8a8 8 0 0 0-16 0v8H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M72 48v8a8 8 0 0 0 16 0v-8h80v8a8 8 0 0 0 16 0v-8h24v32H48V48Zm136 160H48V96h160zm-96-88v64a8 8 0 0 1-16 0v-51.06l-4.42 2.22a8 8 0 0 1-7.16-14.32l16-8A8 8 0 0 1 112 120m59.16 30.45L152 176h16a8 8 0 0 1 0 16h-32a8 8 0 0 1-6.4-12.8l28.78-38.37a8 8 0 1 0-13.31-8.83a8 8 0 1 1-13.85-8A24 24 0 0 1 176 136a23.76 23.76 0 0 1-4.84 14.45\"/></svg>", "car-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M240 104h-10.8l-27.78-62.5A16 16 0 0 0 186.8 32H69.2a16 16 0 0 0-14.62 9.5L26.8 104H16a8 8 0 0 0 0 16h8v80a16 16 0 0 0 16 16h24a16 16 0 0 0 16-16v-8h96v8a16 16 0 0 0 16 16h24a16 16 0 0 0 16-16v-80h8a8 8 0 0 0 0-16M80 152H56a8 8 0 0 1 0-16h24a8 8 0 0 1 0 16m120 0h-24a8 8 0 0 1 0-16h24a8 8 0 0 1 0 16M44.31 104L69.2 48h117.6l24.89 56Z\"/></svg>", "caret-right": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32\"/></svg>", "cat-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M222.83 33.54a16 16 0 0 0-18.14 3.15c-.14.14-.26.27-.38.41L187.05 57A111.28 111.28 0 0 0 69 57L51.69 37.1c-.12-.14-.24-.27-.38-.41a16 16 0 0 0-18.14-3.15A16.4 16.4 0 0 0 24 48.46V136c0 49 40.06 89.63 91.56 95.32a4 4 0 0 0 4.44-4v-32l-13.42-13.43a8.22 8.22 0 0 1-.41-11.37a8 8 0 0 1 11.49-.18L128 180.68l10.34-10.35a8 8 0 0 1 11.49.18a8.22 8.22 0 0 1-.41 11.37L136 195.31v32a4 4 0 0 0 4.44 4C191.94 225.62 232 185 232 136V48.46a16.4 16.4 0 0 0-9.17-14.92M84 152a12 12 0 1 1 12-12a12 12 0 0 1-12 12m20-64a8 8 0 1 1-16 0V69a8 8 0 0 1 16 0Zm32 0a8 8 0 1 1-16 0V64a8 8 0 0 1 16 0Zm16 0V69a8 8 0 0 1 16 0v19a8 8 0 1 1-16 0m20 64a12 12 0 1 1 12-12a12 12 0 0 1-12 12\"/></svg>", "chart-bar-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M232 208a8 8 0 0 1-8 8H32a8 8 0 0 1 0-16h8v-64a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8v64h16V88a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v112h16V40a8 8 0 0 1 8-8h40a8 8 0 0 1 8 8v160h8a8 8 0 0 1 8 8\"/></svg>", "chart-pie-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 16a88 88 0 0 1 71.87 37.27L128 118.76Zm0 176a88 88 0 0 1-71.87-37.27l151.76-87.61A88 88 0 0 1 128 216\"/></svg>", "chart-pie": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m71.87 53.27L136 114.14V40.37a88 88 0 0 1 63.87 36.9M120 40.37v83l-71.89 41.5A88 88 0 0 1 120 40.37M128 216a88 88 0 0 1-71.87-37.27l151.76-87.61A88 88 0 0 1 128 216\"/></svg>", "chat-circle-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M232 128a104 104 0 0 1-152.88 91.82l-34.05 11.35a16 16 0 0 1-20.24-20.24l11.35-34.05A104 104 0 1 1 232 128\"/></svg>", "check": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"m229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69L218.34 66.34a8 8 0 0 1 11.32 11.32\"/></svg>", "circles-four-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M120 80a40 40 0 1 1-40-40a40 40 0 0 1 40 40m56 40a40 40 0 1 0-40-40a40 40 0 0 0 40 40m-96 16a40 40 0 1 0 40 40a40 40 0 0 0-40-40m96 0a40 40 0 1 0 40 40a40 40 0 0 0-40-40\"/></svg>", "clock": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m64-88a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8V72a8 8 0 0 1 16 0v48h48a8 8 0 0 1 8 8\"/></svg>", "coffee-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M208 80H32a8 8 0 0 0-8 8v48a96.3 96.3 0 0 0 32.54 72H32a8 8 0 0 0 0 16h176a8 8 0 0 0 0-16h-24.54a96.6 96.6 0 0 0 27-40.09A40 40 0 0 0 248 128v-8a40 40 0 0 0-40-40m24 48a24 24 0 0 1-17.2 23a96 96 0 0 0 1.2-15V97.38A24 24 0 0 1 232 120ZM112 56V24a8 8 0 0 1 16 0v32a8 8 0 0 1-16 0m32 0V24a8 8 0 0 1 16 0v32a8 8 0 0 1-16 0m-64 0V24a8 8 0 0 1 16 0v32a8 8 0 0 1-16 0\"/></svg>", "copy": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 32H88a8 8 0 0 0-8 8v40H40a8 8 0 0 0-8 8v128a8 8 0 0 0 8 8h128a8 8 0 0 0 8-8v-40h40a8 8 0 0 0 8-8V40a8 8 0 0 0-8-8m-56 176H48V96h112Zm48-48h-32V88a8 8 0 0 0-8-8H96V48h112Z\"/></svg>", "credit-card-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 48H32a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16m-88 128h-16a8 8 0 0 1 0-16h16a8 8 0 0 1 0 16m64 0h-32a8 8 0 0 1 0-16h32a8 8 0 0 1 0 16M32 88V64h192v24Z\"/></svg>", "credit-card": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 48H32a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16m0 16v24H32V64Zm0 128H32v-88h192zm-16-24a8 8 0 0 1-8 8h-32a8 8 0 0 1 0-16h32a8 8 0 0 1 8 8m-64 0a8 8 0 0 1-8 8h-16a8 8 0 0 1 0-16h16a8 8 0 0 1 8 8\"/></svg>", "device-mobile": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M176 16H80a24 24 0 0 0-24 24v176a24 24 0 0 0 24 24h96a24 24 0 0 0 24-24V40a24 24 0 0 0-24-24M72 64h112v128H72Zm8-32h96a8 8 0 0 1 8 8v8H72v-8a8 8 0 0 1 8-8m96 192H80a8 8 0 0 1-8-8v-8h112v8a8 8 0 0 1-8 8\"/></svg>", "download-simple": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 144v64a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8v-64a8 8 0 0 1 16 0v56h160v-56a8 8 0 0 1 16 0m-101.66 5.66a8 8 0 0 0 11.32 0l40-40a8 8 0 0 0-11.32-11.32L136 124.69V32a8 8 0 0 0-16 0v92.69L93.66 98.34a8 8 0 0 0-11.32 11.32Z\"/></svg>", "export": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 112v96a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16v-96a16 16 0 0 1 16-16h24a8 8 0 0 1 0 16H56v96h144v-96h-24a8 8 0 0 1 0-16h24a16 16 0 0 1 16 16M93.66 69.66L120 43.31V136a8 8 0 0 0 16 0V43.31l26.34 26.35a8 8 0 0 0 11.32-11.32l-40-40a8 8 0 0 0-11.32 0l-40 40a8 8 0 0 0 11.32 11.32\"/></svg>", "file-pdf": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 152a8 8 0 0 1-8 8h-24v16h16a8 8 0 0 1 0 16h-16v16a8 8 0 0 1-16 0v-56a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8M92 172a28 28 0 0 1-28 28h-8v8a8 8 0 0 1-16 0v-56a8 8 0 0 1 8-8h16a28 28 0 0 1 28 28m-16 0a12 12 0 0 0-12-12h-8v24h8a12 12 0 0 0 12-12m88 8a36 36 0 0 1-36 36h-16a8 8 0 0 1-8-8v-56a8 8 0 0 1 8-8h16a36 36 0 0 1 36 36m-16 0a20 20 0 0 0-20-20h-8v40h8a20 20 0 0 0 20-20M40 112V40a16 16 0 0 1 16-16h96a8 8 0 0 1 5.66 2.34l56 56A8 8 0 0 1 216 88v24a8 8 0 0 1-16 0V96h-48a8 8 0 0 1-8-8V40H56v72a8 8 0 0 1-16 0m120-32h28.69L160 51.31Z\"/></svg>", "gear": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M128 80a48 48 0 1 0 48 48a48.05 48.05 0 0 0-48-48m0 80a32 32 0 1 1 32-32a32 32 0 0 1-32 32m88-29.84q.06-2.16 0-4.32l14.92-18.64a8 8 0 0 0 1.48-7.06a107.2 107.2 0 0 0-10.88-26.25a8 8 0 0 0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186 40.54a8 8 0 0 0-3.94-6a107.7 107.7 0 0 0-26.25-10.87a8 8 0 0 0-7.06 1.49L130.16 40h-4.32L107.2 25.11a8 8 0 0 0-7.06-1.48a107.6 107.6 0 0 0-26.25 10.88a8 8 0 0 0-3.93 6l-2.64 23.76q-1.56 1.49-3 3L40.54 70a8 8 0 0 0-6 3.94a107.7 107.7 0 0 0-10.87 26.25a8 8 0 0 0 1.49 7.06L40 125.84v4.32L25.11 148.8a8 8 0 0 0-1.48 7.06a107.2 107.2 0 0 0 10.88 26.25a8 8 0 0 0 6 3.93l23.72 2.64q1.49 1.56 3 3L70 215.46a8 8 0 0 0 3.94 6a107.7 107.7 0 0 0 26.25 10.87a8 8 0 0 0 7.06-1.49L125.84 216q2.16.06 4.32 0l18.64 14.92a8 8 0 0 0 7.06 1.48a107.2 107.2 0 0 0 26.25-10.88a8 8 0 0 0 3.93-6l2.64-23.72q1.56-1.48 3-3l23.78-2.8a8 8 0 0 0 6-3.94a107.7 107.7 0 0 0 10.87-26.25a8 8 0 0 0-1.49-7.06Zm-16.1-6.5a74 74 0 0 1 0 8.68a8 8 0 0 0 1.74 5.48l14.19 17.73a91.6 91.6 0 0 1-6.23 15l-22.6 2.56a8 8 0 0 0-5.1 2.64a74 74 0 0 1-6.14 6.14a8 8 0 0 0-2.64 5.1l-2.51 22.58a91.3 91.3 0 0 1-15 6.23l-17.74-14.19a8 8 0 0 0-5-1.75h-.48a74 74 0 0 1-8.68 0a8 8 0 0 0-5.48 1.74l-17.78 14.2a91.6 91.6 0 0 1-15-6.23L82.89 187a8 8 0 0 0-2.64-5.1a74 74 0 0 1-6.14-6.14a8 8 0 0 0-5.1-2.64l-22.58-2.52a91.3 91.3 0 0 1-6.23-15l14.19-17.74a8 8 0 0 0 1.74-5.48a74 74 0 0 1 0-8.68a8 8 0 0 0-1.74-5.48L40.2 100.45a91.6 91.6 0 0 1 6.23-15L69 82.89a8 8 0 0 0 5.1-2.64a74 74 0 0 1 6.14-6.14A8 8 0 0 0 82.89 69l2.51-22.57a91.3 91.3 0 0 1 15-6.23l17.74 14.19a8 8 0 0 0 5.48 1.74a74 74 0 0 1 8.68 0a8 8 0 0 0 5.48-1.74l17.77-14.19a91.6 91.6 0 0 1 15 6.23L173.11 69a8 8 0 0 0 2.64 5.1a74 74 0 0 1 6.14 6.14a8 8 0 0 0 5.1 2.64l22.58 2.51a91.3 91.3 0 0 1 6.23 15l-14.19 17.74a8 8 0 0 0-1.74 5.53Z\"/></svg>", "gift-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 72h-35.08c.39-.33.79-.65 1.17-1A29.53 29.53 0 0 0 192 49.57A32.62 32.62 0 0 0 158.44 16A29.53 29.53 0 0 0 137 25.91a55 55 0 0 0-9 14.48a55 55 0 0 0-9-14.48A29.53 29.53 0 0 0 97.56 16A32.62 32.62 0 0 0 64 49.57A29.53 29.53 0 0 0 73.91 71c.38.33.78.65 1.17 1H40a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16v64a16 16 0 0 0 16 16h60a4 4 0 0 0 4-4v-92H40V88h80v32h16V88h80v32h-80v92a4 4 0 0 0 4 4h60a16 16 0 0 0 16-16v-64a16 16 0 0 0 16-16V88a16 16 0 0 0-16-16M84.51 59a13.7 13.7 0 0 1-4.5-10a16.62 16.62 0 0 1 16.58-17h.49a13.7 13.7 0 0 1 10 4.5c8.39 9.48 11.35 25.2 12.39 34.92C109.71 70.39 94 67.43 84.51 59m87 0c-9.49 8.4-25.24 11.36-35 12.4C137.7 60.89 141 45.5 149 36.51a13.7 13.7 0 0 1 10-4.5h.49A16.62 16.62 0 0 1 176 49.08a13.7 13.7 0 0 1-4.51 9.92Z\"/></svg>", "image": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16m0 16v102.75l-26.07-26.06a16 16 0 0 0-22.63 0l-20 20l-44-44a16 16 0 0 0-22.62 0L40 149.37V56ZM40 172l52-52l80 80H40Zm176 28h-21.37l-36-36l20-20L216 181.38zm-72-100a12 12 0 1 1 12 12a12 12 0 0 1-12-12\"/></svg>", "link": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M240 88.23a54.43 54.43 0 0 1-16 37L189.25 160a54.27 54.27 0 0 1-38.63 16h-.05A54.63 54.63 0 0 1 96 119.84a8 8 0 0 1 16 .45A38.62 38.62 0 0 0 150.58 160a38.4 38.4 0 0 0 27.31-11.31l34.75-34.75a38.63 38.63 0 0 0-54.63-54.63l-11 11A8 8 0 0 1 135.7 59l11-11a54.65 54.65 0 0 1 77.3 0a54.86 54.86 0 0 1 16 40.23m-131 97.43l-11 11A38.4 38.4 0 0 1 70.6 208a38.63 38.63 0 0 1-27.29-65.94L78 107.31a38.63 38.63 0 0 1 66 28.4a8 8 0 0 0 16 .45A54.86 54.86 0 0 0 144 96a54.65 54.65 0 0 0-77.27 0L32 130.75A54.62 54.62 0 0 0 70.56 224a54.28 54.28 0 0 0 38.64-16l11-11a8 8 0 0 0-11.2-11.34\"/></svg>", "lock-key": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M128 112a28 28 0 0 0-8 54.83V184a8 8 0 0 0 16 0v-17.17a28 28 0 0 0-8-54.83m0 40a12 12 0 1 1 12-12a12 12 0 0 1-12 12m80-72h-32V56a48 48 0 0 0-96 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16M96 56a32 32 0 0 1 64 0v24H96Zm112 152H48V96h160z\"/></svg>", "magnifying-glass": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"m229.66 218.34l-50.07-50.06a88.11 88.11 0 1 0-11.31 11.31l50.06 50.07a8 8 0 0 0 11.32-11.32M40 112a72 72 0 1 1 72 72a72.08 72.08 0 0 1-72-72\"/></svg>", "pencil-simple": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"m227.31 73.37l-44.68-44.69a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63M92.69 208H48v-44.69l88-88L180.69 120ZM192 108.68L147.31 64l24-24L216 84.68Z\"/></svg>", "plus-circle-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M128 24a104 104 0 1 0 104 104A104.13 104.13 0 0 0 128 24m40 112h-32v32a8 8 0 0 1-16 0v-32H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v32h32a8 8 0 0 1 0 16\"/></svg>", "plus": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8\"/></svg>", "push-pin-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"m235.33 104l-53.47 53.65c4.56 12.67 6.45 33.89-13.19 60A15.93 15.93 0 0 1 157 224h-1.13a16 16 0 0 1-11.32-4.69L96.29 171l-42.63 42.66a8 8 0 0 1-11.32-11.32L85 159.71l-48.3-48.3A16 16 0 0 1 38 87.63c25.42-20.51 49.75-16.48 60.4-13.14L152 20.7a16 16 0 0 1 22.63 0l60.69 60.68a16 16 0 0 1 .01 22.62\"/></svg>", "push-pin": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"m235.32 81.37l-60.69-60.68a16 16 0 0 0-22.63 0l-53.63 53.8c-10.66-3.34-35-7.37-60.4 13.14a16 16 0 0 0-1.29 23.78L85 159.71l-42.66 42.63a8 8 0 0 0 11.32 11.32L96.29 171l48.29 48.29A16 16 0 0 0 155.9 224h1.13a15.93 15.93 0 0 0 11.64-6.33c19.64-26.1 17.75-47.32 13.19-60L235.33 104a16 16 0 0 0-.01-22.63M224 92.69l-57.27 57.46a8 8 0 0 0-1.49 9.22c9.46 18.93-1.8 38.59-9.34 48.62L48 100.08c12.08-9.74 23.64-12.31 32.48-12.31A40.1 40.1 0 0 1 96.81 91a8 8 0 0 0 9.25-1.51L163.32 32L224 92.68Z\"/></svg>", "question": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M140 180a12 12 0 1 1-12-12a12 12 0 0 1 12 12M128 72c-22.06 0-40 16.15-40 36v4a8 8 0 0 0 16 0v-4c0-11 10.77-20 24-20s24 9 24 20s-10.77 20-24 20a8 8 0 0 0-8 8v8a8 8 0 0 0 16 0v-.72c18.24-3.35 32-17.9 32-35.28c0-19.85-17.94-36-40-36m104 56A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88\"/></svg>", "receipt-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 40H40a16 16 0 0 0-16 16v152a8 8 0 0 0 11.58 7.15L64 200.94l28.42 14.21a8 8 0 0 0 7.16 0L128 200.94l28.42 14.21a8 8 0 0 0 7.16 0L192 200.94l28.42 14.21A8 8 0 0 0 232 208V56a16 16 0 0 0-16-16m-40 104H80a8 8 0 0 1 0-16h96a8 8 0 0 1 0 16m0-32H80a8 8 0 0 1 0-16h96a8 8 0 0 1 0 16\"/></svg>", "receipt": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M72 104a8 8 0 0 1 8-8h96a8 8 0 0 1 0 16H80a8 8 0 0 1-8-8m8 40h96a8 8 0 0 0 0-16H80a8 8 0 0 0 0 16m152-88v152a8 8 0 0 1-11.58 7.15L192 200.94l-28.42 14.21a8 8 0 0 1-7.16 0L128 200.94l-28.42 14.21a8 8 0 0 1-7.16 0L64 200.94l-28.42 14.21A8 8 0 0 1 24 208V56a16 16 0 0 1 16-16h176a16 16 0 0 1 16 16m-16 0H40v139.06l20.42-10.22a8 8 0 0 1 7.16 0L96 199.06l28.42-14.22a8 8 0 0 1 7.16 0L160 199.06l28.42-14.22a8 8 0 0 1 7.16 0L216 195.06Z\"/></svg>", "share-network": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M176 160a39.9 39.9 0 0 0-28.62 12.09l-46.1-29.63a39.8 39.8 0 0 0 0-28.92l46.1-29.63a40 40 0 1 0-8.66-13.45l-46.1 29.63a40 40 0 1 0 0 55.82l46.1 29.63A40 40 0 1 0 176 160m0-128a24 24 0 1 1-24 24a24 24 0 0 1 24-24M64 152a24 24 0 1 1 24-24a24 24 0 0 1-24 24m112 72a24 24 0 1 1 24-24a24 24 0 0 1-24 24\"/></svg>", "shopping-bag-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16m-88 96a48.05 48.05 0 0 1-48-48a8 8 0 0 1 16 0a32 32 0 0 0 64 0a8 8 0 0 1 16 0a48.05 48.05 0 0 1-48 48\"/></svg>", "stack-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><g fill=\"#eeeeee\"><path d=\"m220 169.09l-92 53.65l-92-53.65a8 8 0 0 0-8 13.82l96 56a8 8 0 0 0 8.06 0l96-56a8 8 0 1 0-8.06-13.82\"/><path d=\"m220 121.09l-92 53.65l-92-53.65a8 8 0 0 0-8 13.82l96 56a8 8 0 0 0 8.06 0l96-56a8 8 0 1 0-8.06-13.82\"/><path d=\"m28 86.91l96 56a8 8 0 0 0 8.06 0l96-56a8 8 0 0 0 0-13.82l-96-56a8 8 0 0 0-8.06 0l-96 56a8 8 0 0 0 0 13.82\"/></g></svg>", "stack": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M230.91 172a8 8 0 0 1-2.91 10.91l-96 56a8 8 0 0 1-8.06 0l-96-56A8 8 0 0 1 36 169.09l92 53.65l92-53.65a8 8 0 0 1 10.91 2.91M220 121.09l-92 53.65l-92-53.65a8 8 0 0 0-8 13.82l96 56a8 8 0 0 0 8.06 0l96-56a8 8 0 1 0-8.06-13.82M24 80a8 8 0 0 1 4-6.91l96-56a8 8 0 0 1 8.06 0l96 56a8 8 0 0 1 0 13.82l-96 56a8 8 0 0 1-8.06 0l-96-56A8 8 0 0 1 24 80m23.88 0L128 126.74L208.12 80L128 33.26Z\"/></svg>", "star-fill": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"m234.29 114.85l-45 38.83L203 211.75a16.4 16.4 0 0 1-24.5 17.82L128 198.49l-50.53 31.08A16.4 16.4 0 0 1 53 211.75l13.76-58.07l-45-38.83A16.46 16.46 0 0 1 31.08 86l59-4.76l22.76-55.08a16.36 16.36 0 0 1 30.27 0l22.75 55.08l59 4.76a16.46 16.46 0 0 1 9.37 28.86Z\"/></svg>", "star": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M239.18 97.26A16.38 16.38 0 0 0 224.92 86l-59-4.76l-22.78-55.09a16.36 16.36 0 0 0-30.27 0L90.11 81.23L31.08 86a16.46 16.46 0 0 0-9.37 28.86l45 38.83L53 211.75a16.38 16.38 0 0 0 24.5 17.82l50.5-31.08l50.53 31.08A16.4 16.4 0 0 0 203 211.75l-13.76-58.07l45-38.83a16.43 16.43 0 0 0 4.94-17.59m-15.34 5.47l-48.7 42a8 8 0 0 0-2.56 7.91l14.88 62.8a.37.37 0 0 1-.17.48c-.18.14-.23.11-.38 0l-54.72-33.65a8 8 0 0 0-8.38 0l-54.72 33.67c-.15.09-.19.12-.38 0a.37.37 0 0 1-.17-.48l14.88-62.8a8 8 0 0 0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16a8 8 0 0 0 6.72-4.94l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153 91.86a8 8 0 0 0 6.75 4.92l63.92 5.16c.15 0 .24 0 .33.29s0 .4-.16.5\"/></svg>", "trash": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 48h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a8 8 0 0 0 0 16h8v144a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V64h8a8 8 0 0 0 0-16M96 40a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm96 168H64V64h128Zm-80-104v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0m48 0v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0\"/></svg>", "upload-simple": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M224 144v64a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8v-64a8 8 0 0 1 16 0v56h160v-56a8 8 0 0 1 16 0M93.66 77.66L120 51.31V144a8 8 0 0 0 16 0V51.31l26.34 26.35a8 8 0 0 0 11.32-11.32l-40-40a8 8 0 0 0-11.32 0l-40 40a8 8 0 0 0 11.32 11.32\"/></svg>", "users": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M117.25 157.92a60 60 0 1 0-66.5 0a95.83 95.83 0 0 0-47.22 37.71a8 8 0 1 0 13.4 8.74a80 80 0 0 1 134.14 0a8 8 0 0 0 13.4-8.74a95.83 95.83 0 0 0-47.22-37.71M40 108a44 44 0 1 1 44 44a44.05 44.05 0 0 1-44-44m210.14 98.7a8 8 0 0 1-11.07-2.33A79.83 79.83 0 0 0 172 168a8 8 0 0 1 0-16a44 44 0 1 0-16.34-84.87a8 8 0 1 1-5.94-14.85a60 60 0 0 1 55.53 105.64a95.83 95.83 0 0 1 47.22 37.71a8 8 0 0 1-2.33 11.07\"/></svg>", "wallet": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M216 64H56a8 8 0 0 1 0-16h136a8 8 0 0 0 0-16H56a24 24 0 0 0-24 24v128a24 24 0 0 0 24 24h160a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16m0 128H56a8 8 0 0 1-8-8V78.63A23.8 23.8 0 0 0 56 80h160Zm-48-60a12 12 0 1 1 12 12a12 12 0 0 1-12-12\"/></svg>", "x": "<svg class=\"icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><path fill=\"#eeeeee\" d=\"M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z\"/></svg>"};
const referenceIconRenderer=icon;icon=n=>referenceIcons.has(n)?referenceIconRenderer(n):(stableIconMarkup[n]||referenceIconRenderer(n));
const decodedIconImages=[];for(const name of [...referenceIcons,"card-brand","visa","apple-native"]){const image=new Image();image.src="assets/reference/"+name+".png";image.decode().catch(()=>{});decodedIconImages.push(image)}
render();
// Prepare the light account previews before a pointer starts moving.

function buildAccountPreview(index){
 const cards=allCards(),selected=state.activeCard,wasNew=newCardSelected;
 try{
  newCardSelected=index===cards.length;
  if(!newCardSelected)state.activeCard=cards[index].id;
  // Keep the preview in the live document's realm so image decoding starts offscreen.
  const staging=document.createElement('div');
  staging.innerHTML=homeAccountContent(true);
  const content=staging.firstElementChild;
  prepareVisibleGlyphs(content);
  for(const image of content.querySelectorAll('img')){
   image.loading='eager';
   image.decoding='async';
   image.decode().catch(()=>{});
  }
  return content;
 }finally{
  state.activeCard=selected;
  newCardSelected=wasNew;
 }
}
function prepareAccountPreviews(){
 if(route.page!=='home'||loading)return;
 const cards=allCards(),index=newCardSelected?cards.length:cards.findIndex(card=>card.id===state.activeCard);
 for(const i of [index-1,index+1])if(i>=0&&i<=cards.length&&!accountPreviewCache.has(i))accountPreviewCache.set(i,buildAccountPreview(i));
}
function scheduleAccountPreviews(){
 clearTimeout(previewIdleTask);
 previewIdleTask=setTimeout(()=>{if(!swipeLayers)prepareAccountPreviews()},40);
}
// Favorite filtering is a visible toggle, not an invisible list mutation.
let historyFavoritesActive=false;
const historyBeforeFavoriteState=historyPage;historyPage=function(){const html=historyBeforeFavoriteState();return html.replace('data-action="history-favorites"',`aria-pressed="${historyFavoritesActive}" class="${historyFavoritesActive?'is-favorite':''}" data-action="history-favorites"`).replace(`${icon('star')}</button><button data-action="history-search"`,`${icon(historyFavoritesActive?'star-fill':'star')}</button><button data-action="history-search"`)};
actions['history-favorites']=b=>{historyFavoritesActive=!historyFavoritesActive;const button=b||$('[data-action="history-favorites"]');button?.classList.toggle('is-favorite',historyFavoritesActive);button?.setAttribute('aria-pressed',String(historyFavoritesActive));if(button)button.innerHTML=icon(historyFavoritesActive?'star-fill':'star');const list=$('#tx-list');if(list)list.innerHTML=grouped(txFor().filter(t=>!historyFavoritesActive||t.favorite))};
// All personal-information rows share one grid and unadorned icon column.
personalPage=function(){const rows=[['Як до вас звертатися?',state.name,'chat-circle-fill'],['Телефон',state.phone||'Не вказано','device-mobile'],['Ваша ел. пошта',state.email||'Не вказано','receipt'],['','Документи','receipt-fill'],['','Персональні дані','users']];return toolbar('')+`<div class="page personal-page"><h1>Особисті дані та документи</h1><button class="personal-photo" data-action="avatar-info"><span class="avatar">${state.avatar?`<img src="${esc(state.avatar)}" alt="">`:icon('cat-fill')}</span><strong>Поставити нове фото</strong></button><section class="native-group personal-aligned-rows">${rows.map(([label,value,symbol])=>`<button class="personal-row" data-action="personal-admin-info"><span class="personal-symbol">${icon(symbol)}</span><span class="personal-value">${label?`<small>${label}</small>`:''}${esc(value)}</span></button>`).join('')}</section></div>`};surfaces.personal=personalPage;
const renderBeforeFinalMotion=render;render=function(){renderBeforeFinalMotion();if(route.page==='home')scheduleAccountPreviews();if(route.page!=='history')historyTouchCleanup?.();if(route.page==='history'&&historyFavoritesActive){const list=$('#tx-list');if(list)list.innerHTML=grouped(txFor().filter(t=>t.favorite))}if(route.page==='detail'){const button=$('[data-action="favorite"]');button?.classList.toggle('is-favorite',!!currentTx()?.favorite);button?.setAttribute('aria-pressed',String(!!currentTx()?.favorite))}};
render();

for (const page of ['analytics', 'capital', 'statbreakdown', 'statcategory']) sidePages.add(page);
// Display the existing Home elements beneath the opening page and reuse them on return.
let retainedHome=null;
let openingHomeBackdrop=null;
let homeBackdropViewportAnchor=null;
function alignHomeBackdropToViewport(){
 const anchor=homeBackdropViewportAnchor;
 if(!anchor)return;
 if(!anchor.surface.isConnected||!anchor.content.isConnected)return;
 // Match the position of the real Home content, including scroll-root and viewport changes.
 const paintedTop=anchor.content.getBoundingClientRect().top-(window.visualViewport?.offsetTop??0);
 const delta=anchor.visualTop-paintedTop;
 if(Math.abs(delta)<.03)return;
 anchor.top+=delta;
 anchor.surface.style.top=anchor.top+'px';
}
window.visualViewport?.addEventListener('scroll',alignHomeBackdropToViewport,{passive:true});
window.visualViewport?.addEventListener('resize',alignHomeBackdropToViewport,{passive:true});
function renderWithHomeBackdrop(backdrop, update = render) {
 const previous = openingHomeBackdrop;
 openingHomeBackdrop = backdrop?.classList.contains('home') ? backdrop : null;
 try { return update(); }
 finally { openingHomeBackdrop = previous; }
}
const renderBeforeHomeRetention=render;
render=function(){
 const app=$('#app'),screen=$('#screen');
 if (route.page === 'home') {
  sideHomeSnapshot = null;
  sideParentSnapshots.clear();
 }
 if(route.page==='home'&&homeBackdropViewportAnchor){
  const {surface,startTop}=homeBackdropViewportAnchor;
  surface.style.top=startTop;
  homeBackdropViewportAnchor=null;
 }
 const homeContent=screen.querySelector('.home-content');
 if(!adminMode&&route.page!=='home'&&app.classList.contains('home')&&homeContent&&!swipeLayers){
  const nodes=[...screen.childNodes];
  const backdrop=openingHomeBackdrop;
  if(backdrop){
   const surface=backdrop.closest('.glass-history-backdrop')||backdrop;
   const visualTop=backdrop.homeVisualTop??homeContent.getBoundingClientRect().top-(window.visualViewport?.offsetTop??0);
   const anchor={surface,content:homeContent,visualTop,startTop:surface.style.top,top:parseFloat(surface.style.top)||0};
   homeBackdropViewportAnchor=anchor;
   requestAnimationFrame(()=>{
    if(homeBackdropViewportAnchor!==anchor)return;
    alignHomeBackdropToViewport();
    requestAnimationFrame(()=>{if(homeBackdropViewportAnchor===anchor)alignHomeBackdropToViewport()});
   });
  }
  const destination=backdrop?.firstElementChild || document.createDocumentFragment();
  const liveSelector=homeContent.querySelector('.card-selector');
  const frozenSelector=destination.querySelector('.frozen-card-selector');
  let restoreSelector;
  if(liveSelector&&frozenSelector){
   const parts=[liveSelector,...liveSelector.querySelectorAll('.selector-label,.selector-dots,.selector-dots > *')];
   const frozen=[frozenSelector,...frozenSelector.querySelectorAll('.selector-label,.selector-dots,.selector-dots > *')];
   const styles=parts.map(part=>part.getAttribute('style'));
   parts.forEach((part,index)=>{
    const saved=frozen[index]?.style;
    if(!saved)return;
    for(const property of ['inlineSize','blockSize','opacity','filter']){
     if(saved[property])part.style[property]=saved[property];
    }
   });
   liveSelector.classList.add('frozen-card-selector');
   restoreSelector=()=>{
    liveSelector.classList.remove('frozen-card-selector');
    parts.forEach((part,index)=>{
     if(styles[index]===null)part.removeAttribute('style');
     else part.setAttribute('style',styles[index]);
    });
   };
  }
  const frozenRows = destination.querySelector('.home-content')?.style.gridTemplateRows;
  const liveRows = homeContent.style.gridTemplateRows;
  if (frozenRows) homeContent.style.gridTemplateRows = frozenRows;
  destination.replaceChildren(...nodes);
  if(backdrop?.preserveArtwork===false){
   const card=[...destination.querySelectorAll('.card-face')].find(face=>face.dataset.id===state.activeCard);
   card?.classList.add('opening-card-source');
  }
  retainedHome={nodes,restoreSelector,homeContent,liveRows,revision:serverRevision,card:state.activeCard,newCard:newCardSelected};
 }
 const restore=!adminMode&&route.page==='home'&&retainedHome&&retainedHome.revision===serverRevision&&retainedHome.card===state.activeCard&&retainedHome.newCard===newCardSelected;
 if(!restore){
  if(route.page==='home')retainedHome=null;
  renderBeforeHomeRetention();
  alignHomeBackdropToViewport();
  return;
 }
 const scroll=pendingRouteScroll??pageScrollY();
 // Restore the scroll only once the retained Home rows are back in the document.
 pendingRouteScroll=null;
 renderBeforeHomeRetention();
 screen.replaceChildren(...retainedHome.nodes);
 retainedHome.homeContent.style.gridTemplateRows = retainedHome.liveRows;
 retainedHome.restoreSelector?.();
 screen.querySelector('.opening-card-source')?.classList.remove('opening-card-source');
 retainedHome=null;
 pageScrollTo({top:scroll,behavior:'instant'});
 scheduleAccountPreviews();
};
render();
// The edge history is a separate all-accounts screen, not the selected-card statement.
function operationDateHeading(date){const d=new Date(date+'T12:00:00'),todayDate=new Date(today()+'T12:00:00'),yesterday=new Date(todayDate);yesterday.setDate(yesterday.getDate()-1);return date===today()?'Сьогодні':d.toDateString()===yesterday.toDateString()?'Вчора':d.toLocaleDateString('uk-UA',{day:'numeric',month:'long',...(d.getFullYear()===todayDate.getFullYear()?{}:{year:'numeric'})})}
function operationHistoryRows(items,allAccounts=false){const sorted=[...items].sort(compareTransactions),template=document.createElement('template');template.innerHTML=rows(sorted);const byId=new Map([...template.content.querySelectorAll('.transaction')].map(row=>[row.dataset.id,row]));let previous='';return sorted.map(tx=>{let heading='';if(previous!==tx.date){previous=tx.date;heading=`<h3 class="date-heading">${esc(operationDateHeading(tx.date))}</h3>`}const row=byId.get(String(tx.id));if(!row)return '';if(allAccounts){const card=allCards().find(card=>card.id===(tx.cardId||'main'))||mainCard(),name=card.account,description=tx.amount>0?'На мою '+name.replace(/ картка$/,'').replace(/^Чорна/,'чорну').replace(/^Біла/,'білу'):'З '+name.replace(/^Чорна/,'Чорної').replace(/^Біла/,'Білої').replace(/ картка$/,' картки');const content=row.querySelector('.tx-content');let sub=content.querySelector('small');if(!sub){sub=document.createElement('small');content.append(sub)}sub.textContent=description}return heading+row.outerHTML}).join('')||empty('Операцій не знайдено','Спробуйте інший запит.')}

const historyStartSize=12;
let historyStartItems=null;
function orderedHistoryItems(){
 const items=historyPresentation==='drawer'?state.transactions:txFor();
 return items.filter(tx=>!historyFavoritesActive||tx.favorite).sort(compareTransactions);
}
function renderHistoryStart(items,paint){
 historyStartItems=items.slice(0,historyStartSize);
 try{return paint()}finally{historyStartItems=null}
}
historyPage=function(){const all=historyPresentation==='drawer',items=historyStartItems??(all?state.transactions:txFor()).filter(t=>!historyFavoritesActive||t.favorite);return `<div class="all-operations-page ${all?'drawer-operations':'card-operations'}"><div class="all-operations-top">${all?referenceImage('history-stack','history-stack'): `<button data-action="back" aria-label="Назад">${icon('x')}</button><span class="stats-mini-card">${cardArtwork(activeCard())}</span>`}<button class="${historyFavoritesActive?'is-favorite':''}" aria-pressed="${historyFavoritesActive}" data-action="history-favorites" aria-label="Обрані операції">${icon(historyFavoritesActive?'star-fill':'star')}</button><button data-action="history-search" aria-label="Пошук">${icon('magnifying-glass')}</button></div>${all?'<h1>Усі операції</h1>':`<div class="history-card-identity"><strong>${displayMoney(balance())} ₴</strong></div>`}<div class="search history-search" hidden>${icon('magnifying-glass')}<input id="search" placeholder="Пошук операцій" aria-label="Пошук операцій"></div><div id="tx-list">${operationHistoryRows(items,all)}</div></div>`};
function updateOperationHistory(){const all=historyPresentation==='drawer',query=($('#search')?.value||'').toLowerCase(),items=(all?state.transactions:txFor()).filter(t=>(!historyFavoritesActive||t.favorite)&&(t.title+' '+(t.note||'')).toLowerCase().includes(query));if($('#tx-list'))$('#tx-list').innerHTML=operationHistoryRows(items,all)}
actions['history-favorites']=button=>{historyFavoritesActive=!historyFavoritesActive;button=button||$('[data-action=history-favorites]');button?.classList.toggle('is-favorite',historyFavoritesActive);button?.setAttribute('aria-pressed',String(historyFavoritesActive));if(button)button.innerHTML=icon(historyFavoritesActive?'star-fill':'star');updateOperationHistory()};
let edgeReturnScene=null;
function beginEdgeReturn(){if(edgeReturnScene)return edgeReturnScene;const page=$('.drawer-operations');if(!page)return null;const layer=makeOperationsLayer(page);layer.classList.add('history-edge-layer');page.style.marginTop=-pageScrollY()+'px';const home=operationsHome?.cloneNode(true);if(home){document.body.append(home);home.style.opacity='1';home.style.filter='blur(6px)'}edgeReturnScene={page,layer,home,x:0};document.documentElement.dataset.gesture='active';return edgeReturnScene}
function moveEdgeReturn(x){const scene=beginEdgeReturn();if(!scene)return;scene.x=Math.min(0,x);scene.layer.style.transform=`translate3d(${scene.x}px,0,0)`;if(scene.home)scene.home.style.filter=`blur(${6*Math.max(0,1+scene.x/scene.layer.offsetWidth)}px)`}
const backBeforeEdgeReturn=back;back=function(){if(route.page!=='history'||historyPresentation!=='drawer')return backBeforeEdgeReturn();const scene=beginEdgeReturn();if(!scene)return backBeforeHistory();delete document.documentElement.dataset.editing;skipPageMotion=true;backBeforeHistory();operationsNav(Math.min(1,Math.abs(scene.x)/$('#app').clientWidth),1,300);$('#nav').style.zIndex='39';const done=()=>{scene.layer.remove();scene.home?.remove();edgeReturnScene=null;delete document.documentElement.dataset.gesture;restoreOperationsNav()};if(shouldReduceMotion()){done();return}scene.layer.animate([{transform:`translate3d(${scene.x}px,0,0)`},{transform:`translate3d(${-$('#app').clientWidth}px,0,0)`}],{duration:320,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}).finished.then(done).catch(done);scene.home?.animate([{filter:getComputedStyle(scene.home).filter,opacity:1},{filter:'blur(0px)',opacity:1}],{duration:320,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})};actions.back=()=>back();
function bindDrawerHorizontalReturn(){const screen=$('#screen');let start=null,active=false;screen.onpointerdown=e=>{if(e.button===0&&!e.target.closest('input')){start={x:e.clientX,y:e.clientY,id:e.pointerId};active=false}};screen.onpointermove=e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!active&&Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)){start=null;return}if(!active&&dx<-9&&-dx>Math.abs(dy)*1.3){active=true;screen.setPointerCapture(e.pointerId)}if(active)moveEdgeReturn(dx)};const end=e=>{if(!start)return;start=null;if(!active)return;active=false;const scene=edgeReturnScene;if(!scene)return;const stop=e=>{e.preventDefault();e.stopPropagation()};document.addEventListener('click',stop,true);setTimeout(()=>document.removeEventListener('click',stop,true),0);if(e.type!=='pointercancel'&&scene.x<-35){back();return}scene.layer.animate([{transform:`translate3d(${scene.x}px,0,0)`},{transform:'translate3d(0,0,0)'}],{duration:220,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}).finished.then(()=>{screen.append(scene.page);scene.page.style.marginTop='';scene.layer.remove();scene.home?.remove();edgeReturnScene=null;delete document.documentElement.dataset.gesture})};screen.onpointerup=end;screen.onpointercancel=end;screen.ontouchstart=screen.ontouchmove=screen.ontouchend=screen.ontouchcancel=null;historyTouchCleanup?.()}
function bindLeftEdgeHistory(){const app=$('#app');let start=null,layer=null,dx=0;app.onpointerdown=e=>{if(e.button!==0||e.clientX-app.getBoundingClientRect().left>28)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};dx=0};app.onpointermove=e=>{if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(!layer&&Math.abs(y)>9&&Math.abs(y)>Math.abs(x)){start=null;return}if(!layer&&x>9&&x>Math.abs(y)*1.3){historyPresentation='drawer';operationsHome=freezeHome();layer=historyDrawer();layer.classList.add('soft-operations-layer','history-edge-layer');app.setPointerCapture(e.pointerId);document.documentElement.dataset.gesture='active'}if(!layer)return;dx=Math.min(app.clientWidth,Math.max(0,x));layer.style.transform=`translate3d(${dx-app.clientWidth}px,0,0)`;app.style.filter=`blur(${dx/app.clientWidth*5}px)`};const end=e=>{if(!start)return;start=null;if(!layer)return;const node=layer;layer=null;const open=e.type!=='pointercancel'&&dx>35,stop=e=>{e.preventDefault();e.stopPropagation()};document.addEventListener('click',stop,true);setTimeout(()=>document.removeEventListener('click',stop,true),0);const done=()=>{node.remove();app.style.filter='';delete document.documentElement.dataset.gesture;if(open){skipPageMotion=true;navigate('history')}};if(shouldReduceMotion()){done();return}node.animate([{transform:`translate3d(${dx-app.clientWidth}px,0,0)`},{transform:`translate3d(${open?0:-app.clientWidth}px,0,0)`}],{duration:300,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}).finished.then(done).catch(done)};app.onpointerup=end;app.onpointercancel=end}
// Explicit bank and portrait identity are shared by list rows, amount entry and details.
demoBanks.splice(demoBanks.length-1,0,{id:'abank',name:'А-Банк',bankType:'other',logo:'assets/reference/bank-abank.png'},{id:'raif',name:'Райффайзен Банк',bankType:'other',logo:'assets/reference/bank-raif.png'});
const badgeBeforeMonoCleanup=bankBadge;bankBadge=person=>bankPreset(person).id==='mono'?'':badgeBeforeMonoCleanup(person);
const rowsBeforePortraits=rows;rows=function(items){const html=rowsBeforePortraits(items);if(!items.some(t=>bankPreset(t).id==='mono'&&t.recipientAvatar))return html;const template=document.createElement('template');template.innerHTML=html;for(const t of items){if(bankPreset(t).id!=='mono'||!t.recipientAvatar)continue;const row=[...template.content.querySelectorAll('[data-id]')].find(el=>el.dataset.id===t.id),avatar=row?.querySelector('.transaction-icon');if(avatar){avatar.className='transaction-icon recipient-photo';avatar.innerHTML=`<img src="${esc(t.recipientAvatar)}" alt="">`}}return template.innerHTML};
const renderBeforeEdgeScreen=render;render=function(){renderBeforeEdgeScreen();if(adminMode)return;if(route.page==='home')bindLeftEdgeHistory();if(route.page==='history'){if(historyPresentation==='drawer')bindDrawerHorizontalReturn();if($('#search'))$('#search').oninput=updateOperationHistory;updateOperationHistory()}};
render();
let ibanQuery='',ibanTab='contacts';
function paymentHeader(title,kind,search=''){return `<header class="payment-reference-header ${kind}"><div class="payment-reference-top"><button data-action="back" aria-label="Назад">${icon('arrow-left')}</button></div><h1>${title}</h1>${search}</header>`}
function ibanContactsHTML(){const list=(ibanTab==='companies'?(state.companies||[]):state.contacts).filter(c=>(c.name+' '+(c.iban||'')).toLowerCase().includes(ibanQuery.toLowerCase()));return list.map(c=>`<button class="iban-contact" data-action="iban-contact" data-id="${esc(c.id)}"><span class="iban-person">${c.recipientAvatar?`<img src="${esc(c.recipientAvatar)}" alt="">`:icon('receipt-fill')}</span><span>${esc(c.name)}</span>${icon('star')}</button>`).join('')||'<p class="info">Збережених контактів немає. Введіть IBAN у полі зверху.</p>'}
function ibanReferencePage(){return `<div>${paymentHeader('Платіж за IBAN','iban',`<form id="iban-reference-search"><input id="iban-reference-query" value="${esc(ibanQuery)}" placeholder="Введіть IBAN, ім’я або назву компанії" aria-label="IBAN, ім’я або назва компанії"><button type="submit" aria-label="Продовжити">${icon('circles-four-fill')}</button></form>`)}<div class="payment-reference-content"><section class="iban-reference-panel"><div class="iban-reference-tabs"><button data-action="iban-reference-tab" data-tab="contacts" class="${ibanTab==='contacts'?'selected':''}">Контакти</button><button data-action="iban-reference-tab" data-tab="companies" class="${ibanTab==='companies'?'selected':''}">Компанії</button></div><div id="iban-reference-contacts">${ibanContactsHTML()}</div></section></div></div>`}
function paymentsReferencePage(){const entry=(name,sub,i,action,extra='')=>`<button class="payment-reference-entry" data-action="${action}" ${extra}>${referenceImage('payment-method-'+i)}<span>${name}${sub?`<small>${sub}</small>`:''}</span></button>`;return `<div>${paymentHeader('Інші платежі','other')}<div class="payment-reference-content"><section>${entry('Заплановані платежі','',0,'nav','data-page="regular"')}</section><section>${entry('Комунальні платежі','Додайте послуги за адресою',1,'payment-utilities')}${entry('Поповнення мобільного','',2,'mobile')}${entry('Штрафи ПДР','',3,'payment-traffic')}${entry('Благодійність','',4,'payment-charity')}</section><section>${entry('Платіж SWIFT','Без комісії за кордон',5,'payment-swift')}</section></div></div>`}
surfaces.iban=ibanReferencePage;surfaces.payments=paymentsReferencePage;payments=paymentsReferencePage;actions.iban=()=>{ibanQuery='';navigate('iban')};
actions['iban-reference-tab']=b=>{ibanTab=b.dataset.tab;render()};actions['iban-contact']=b=>{const c=(ibanTab==='companies'?(state.companies||[]):state.contacts).find(c=>c.id===b.dataset.id);if(!c)return;if(!c.iban){$('#iban-reference-query').focus();toast('Додайте IBAN контакту або введіть його зверху');return}legacyTransfer('iban',{title:c.name,recipient:c.iban})};
actions['payment-utilities']=()=>inform('Комунальні платежі','Послуги за адресою в локальному демо не підключені.');actions['payment-traffic']=()=>inform('Штрафи ПДР','Пошук реальних штрафів у локальному демо не виконується.');actions['payment-charity']=()=>inform('Благодійність','Демонстраційний екран. Реальні пожертви не надсилаються.');actions['payment-swift']=()=>inform('Платіж SWIFT','Міжнародні перекази в локальному демо не виконуються.');
for(const page of ['iban','payments','transfer','transferAmount'])sidePages.add(page);
const renderBeforePaymentReferences=render;render=function(){renderBeforePaymentReferences();if(route.page!=='iban'||adminMode)return;const input=$('#iban-reference-query'),form=$('#iban-reference-search');input.oninput=()=>{ibanQuery=input.value;$('#iban-reference-contacts').innerHTML=ibanContactsHTML()};form.onsubmit=e=>{e.preventDefault();const value=ibanQuery.replace(/\s/g,'').toUpperCase();if(!/^UA\d{27}$/.test(value)){toast('Введіть IBAN: UA та 27 цифр');input.focus();return}legacyTransfer('iban',{recipient:value})}};
render();
const contactBeforeIbanField=actions['admin-contact'];actions['admin-contact']=b=>{contactBeforeIbanField(b);if(!adminMode)return;const c=state.contacts.find(c=>c.id===b.dataset.id);$('#fields').insertAdjacentHTML('beforeend',field('IBAN контакту · необов’язково','iban',c?.iban||'','text','maxlength="34"'));const save=submit;submit=async f=>{const value=String(f.get('iban')||'').replace(/\s/g,'').toUpperCase();if(value&&!/^UA\d{27}$/.test(value))throw Error('IBAN: UA та 27 цифр');await save(f);const item=b.dataset.id?state.contacts.find(c=>c.id===b.dataset.id):state.contacts.at(-1);if(item)item.iban=value}};
function monoPortrait(person){if(bankPreset(person).id!=='mono')return null;return person.recipientAvatar||(person.logo&&!demoBanks.some(b=>b.logo&&b.logo===person.logo)?person.logo:null)}
const pictureBeforeLegacyPortrait=recipientPicture;recipientPicture=function(person){const avatar=monoPortrait(person);return avatar?`<img class="recipient-portrait" src="${esc(avatar)}" alt="">`:pictureBeforeLegacyPortrait(person)};
const rowsBeforeLegacyPortrait=rows;rows=function(items){const normalized=items.map(t=>{const avatar=monoPortrait(t);return avatar&&!t.recipientAvatar?{...t,recipientAvatar:avatar}:t});return rowsBeforeLegacyPortrait(normalized)};
const detailBeforeLegacyPortrait=detail;detail=function(){const t=currentTx(),avatar=t&&monoPortrait(t),previous=t?.recipientAvatar;if(t&&avatar&&!previous){t.recipientAvatar=avatar;try{return detailBeforeLegacyPortrait()}finally{t.recipientAvatar=previous}}return detailBeforeLegacyPortrait()};
const removeAvatarBeforeLegacy=actions['recipient-avatar-remove'];actions['recipient-avatar-remove']=()=>{if(recipientDraft&&bankPreset(recipientDraft).id==='mono')recipientDraft.logo=null;removeAvatarBeforeLegacy()};
transferContacts=function(query){const q=query.toLowerCase().replace(/\s/g,'');return state.contacts.filter(c=>(c.name+' '+normalizedCard(c.card)).toLowerCase().replace(/\s/g,'').includes(q)).map(c=>`<button class="transfer-contact" data-action="transfer-contact" data-id="${esc(c.id)}"><span class="recipient-icon mono">${recipientPicture({...c,recipientAvatar:monoPortrait(c)})}</span><span>${esc(c.name)}</span>${icon('star')}</button>`).join('')||'<p class="info">Збережених контактів немає. Введіть 16 цифр картки зверху.</p>'};
render();
const bankEditorBeforeAvatarRemoval=addBankAdminPicker;addBankAdminPicker=function(person,collection,id){bankEditorBeforeAvatarRemoval(person,collection,id);const save=submit;submit=async f=>{await save(f);const item=id?state[collection].find(x=>x.id===id):state[collection].at(-1);if(item&&f.get('keepRecipientAvatar')==='0'&&bankPreset(item).id==='mono')item.logo=null}};

const bankPresetBeforeAliases=bankPreset;bankPreset=function(person){if(!person?.bankId){const name=String(person?.bankName||'').toLowerCase();const id=/райф|raif/.test(name)?'raif':/а[- ]?банк|abank|àбанк/.test(name)?'abank':/пум|pumb/.test(name)?'pumb':/сенс|sense/.test(name)?'sense':/моно|mono/.test(name)?'mono':null;if(id)return demoBanks.find(b=>b.id===id)}return bankPresetBeforeAliases(person)};
function scanCornersIcon(){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3M8 8h3v3H8zm8 0v3m-8 5h3m5-2v3h-2"/></svg>'}
const ibanBeforeScanHeader=ibanReferencePage;ibanReferencePage=function(){return ibanBeforeScanHeader().replace(icon('circles-four-fill'),scanCornersIcon()).replace('<form id="iban-reference-search"','<div class="iban-reference-search-row"><form id="iban-reference-search"').replace('</form>','</form><button class="iban-upload-source" data-action="iban-upload-info" aria-label="Реквізити з файлу">'+icon('upload-simple')+'</button></div>')};surfaces.iban=ibanReferencePage;actions['iban-upload-info']=()=>inform('Реквізити з файлу','Автоматичне розпізнавання реквізитів не підключене. Введіть IBAN у полі пошуку.');
for(const page of ['notifications','cashback','appearance','receipt','file','photoChoice','poster'])sidePages.add(page);
const referenceImageBeforeDecode=referenceImage;referenceImage=function(name,cls=''){return referenceImageBeforeDecode(name,cls).replace('<img ','<img decoding="sync" ')};
const receiptPageBeforeLoading=receiptPage;receiptPage=function(){const html=receiptPageBeforeLoading();return html.replace('<div class="receipt-page">','<div class="receipt-document-stage"><div class="receipt-page">').replace('<div class="receipt-bottom">','</div><div class="receipt-bottom">')};
render();

demoBanks.splice(demoBanks.length-1,0,...[{"id": "privat", "name": "ПриватБанк", "bankType": "other", "logo": "assets/reference/bank-privat.png"}, {"id": "ukrsib", "name": "UKRSIBBANK", "bankType": "other", "logo": "assets/reference/bank-ukrsib.png"}, {"id": "otp", "name": "OTP Банк", "bankType": "other", "logo": "assets/reference/bank-otp.png"}]);

const bankPresetBeforeExpandedNames=bankPreset;bankPreset=function(person){if(!person?.bankId){const value=String(person?.bankName||'').toLowerCase(),id=/приват|privat/.test(value)?'privat':/укрсиб|ukrsib/.test(value)?'ukrsib':/отп|otp/.test(value)?'otp':null;if(id)return demoBanks.find(b=>b.id===id)||bankPresetBeforeExpandedNames(person)}return bankPresetBeforeExpandedNames(person)};
actions['notification-info']=button=>{const message=state.notificationsList?.find(n=>n.id===button?.dataset.id);inform(message?.title||'Повідомлення',message?esc(message.text):'Повідомлення демонстраційного проєкту.')};
for(const name of ['invite-mail','bank-pumb','bank-sense','bank-abank','bank-raif','bank-privat','bank-ukrsib','bank-otp']){const img=new Image();img.src='assets/reference/'+name+'.png';img.decode().catch(()=>{});decodedIconImages.push(img)}
// Portrait is a sibling above the rounded panel, so panel clipping cannot cut it.
const detailBeforeFloatingPortrait=detail;detail=function(){let html=detailBeforeFloatingPortrait();const portrait=html.match(/<div class="reference-operation-avatar portrait-operation">[\s\S]*?<\/div>/);if(portrait){html=html.replace(portrait[0],'');html=html.replace('<section class="reference-operation-head">',portrait[0]+'<section class="reference-operation-head">')}return html};
render();
surfaces.notificationDetail=function(){const n=state.notificationsList?.find(n=>n.id===route.id);return toolbar('')+`<article class="page notification-detail"><span class="service-symbol ${esc(n?.color||'orange')}">${icon(n?.icon||'gift-fill')}</span><h1>${esc(n?.title||'Повідомлення')}</h1><p>${esc(n?.text||'Повідомлення не знайдено.')}</p></article>`};sidePages.add('notificationDetail');
actions['notification-info']=button=>{const n=state.notificationsList?.find(n=>n.id===button?.dataset.id);if(n){navigate('notificationDetail',n.id);return}inform('Повідомлення','Повідомлення демонстраційного проєкту.')};

// Uploaded receipts share the same document shell and navigation as generated receipts.
const filePageBeforeReceiptShell=filePage;
filePage=function(){
 if(adminMode)return filePageBeforeReceiptShell();
 const file=state.files.find(f=>f.id===route.id);
 if(!file)return toolbar('Квитанція')+empty('Файл не знайдено','');
 fileURL=URL.createObjectURL(file.blob);
 const preview=file.type.startsWith('image/')
  ?`<img class="uploaded-receipt-image" src="${fileURL}" alt="${esc(file.name)}">`
  :`<iframe class="uploaded-receipt-pdf" title="Квитанція PDF" src="${fileURL}"></iframe>`;
 return toolbar('Квитанція')+`<div class="receipt-document-stage uploaded-receipt-stage"><div class="receipt-page uploaded-receipt-page"><div class="file-view">${preview}<div class="file-watermark"><span>МАКЕТ · НЕ БАНК<br>ЗАВАНТАЖЕНИЙ ФАЙЛ</span></div></div></div><div class="receipt-bottom"><button class="primary" data-action="save-uploaded-receipt">Зберегти квитанцію</button></div>`;
};
actions['save-uploaded-receipt']=()=>{
 const file=state.files.find(f=>f.id===route.id);
 if(file)download(file.blob,file.name);
};
