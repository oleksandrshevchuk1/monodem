'use strict';
// The side history is text over the retained Home scene: no opaque drawer slab.
let glassHistory=null,glassHistoryCleanup=null,glassHistoryChanging=false;
// Navigation resets pageScrollY() before paint: retain the actual origin first.
let pendingHomeHistory=null;
const freezeBeforeHistoryOrigin=freezeHome;
freezeHome=function(){return pendingHomeHistory?pendingHomeHistory.surface.cloneNode(true):freezeBeforeHistoryOrigin()};
const navigateBeforeHistoryOrigin=navigate;
navigate=function(page,id){
 if(page==='history'&&historyPresentation==='drawer'&&route.page==='history'&&glassHistory)return;
 if(page!=='history'||route.page!=='home'||glassHistory)return navigateBeforeHistoryOrigin(page,id);
 const surface=historyPresentation==='drawer'?freezePageSurface():freezeBeforeHistoryOrigin();
 pendingHomeHistory={scroll:pageScrollY(),surface};
 try{return navigateBeforeHistoryOrigin(page,id)}finally{pendingHomeHistory=null}
};

function historyGlassImage(){const image=(pendingHomeHistory?.surface||freezePageSurface());image.classList.remove('operations-home-underlay');image.classList.add('glass-history-image');Object.assign(image.style,{position:'absolute',left:'0',top:'0',width:'100%',height:innerHeight+'px',minHeight:'0',overflow:'hidden',zIndex:'0',filter:'blur(28px)',opacity:'0'});const tools=$('.reference-home-tools');if(tools&&tools.getBoundingClientRect().top+pageScrollY()>(pendingHomeHistory?.scroll??pageScrollY())+innerHeight+64)image.querySelector('.reference-home-tools')?.remove();return image}

function ensureGlassHistory(){if(glassHistory)return glassHistory;const app=$('#app'),rect=app.getBoundingClientRect(),host=document.createElement('div'),image=historyGlassImage(),tint=document.createElement('div'),sharp=image.cloneNode(false);sharp.append(image.firstElementChild.cloneNode(false));sharp.classList.add('glass-history-sharp');Object.assign(sharp.style,{filter:'none',opacity:'1'});host.className='glass-history-backdrop';host.inert=true;Object.assign(host.style,{left:rect.left+'px',width:rect.width+'px'});tint.className='glass-history-tint';host.append(sharp,image,tint);mountHomeOpeningSurface(host);const nav=$('#nav');nav.hidden=false;nav.style.zIndex='46';glassHistory={host,image,sharp,tint,nav,progress:0,x:-rect.width,width:rect.width,homeScroll:pendingHomeHistory?.scroll??pageScrollY(),listScroll:0,sheet:null,motions:[]};document.body.classList.add('has-glass-history');
 for(const surface of [image,sharp]){
  const content=surface.querySelector('.transition-screen');
  if(content)content.style.top=-glassHistory.homeScroll+'px';
 }
 setGlassHistoryProgress(glassHistory,0);return glassHistory}
function showLiveHomeBehindHistory(scene,show){
 scene.host.classList.toggle('glass-history-live-home',show);
 scene.sharp.hidden=show;
}
function setGlassHistoryProgress(scene,p){scene.progress=Math.max(0,Math.min(1,p));scene.image.style.opacity=String(scene.progress);scene.tint.style.opacity=String(scene.progress*.86);scene.nav.style.opacity=String(1-scene.progress)}

function cancelGlassMotions(scene){
 if(!scene.motions.length)return;
 const transform=scene.sheet?getComputedStyle(scene.sheet).transform:'none';
 const opacity=Number(getComputedStyle(scene.image).opacity);
 const sheetOpacity=scene.sheet?getComputedStyle(scene.sheet).opacity:'1';
 const tintOpacity=getComputedStyle(scene.tint).opacity;
 const navOpacity=getComputedStyle(scene.nav).opacity;
 scene.motions.splice(0).forEach(motion=>motion.cancel());
 scene.progress=opacity;
 scene.image.style.opacity=String(opacity);
 scene.tint.style.opacity=tintOpacity;
 scene.nav.style.opacity=navOpacity;
 if(scene.sheet){
  scene.x=new DOMMatrixReadOnly(transform).m41;
  scene.sheet.style.transform=transform;
  scene.sheet.style.opacity=sheetOpacity;
 }
}
function createSideHistorySheet(scene,fromLive=false){if(scene.sheet)return scene.sheet;const sheet=document.createElement('div');sheet.className='history-side-sheet history';Object.assign(sheet.style,{left:scene.host.style.left,width:scene.width+'px'});if(fromLive){const page=$('.drawer-operations');if(page){scene.listScroll=pageScrollY();$('#screen').style.minHeight=page.scrollHeight+'px';scene.livePage=page;sheet.append(page);const compact=$('.side-history-compact');if(compact){scene.liveHeader=compact;sheet.append(compact)}page.style.marginTop=-scene.listScroll+'px'}}else{const originalTransactions=state.transactions;try{state.transactions=[...originalTransactions].sort(compareTransactions).slice(0,12);scene.previewMarkup=historyPage();sheet.innerHTML=scene.previewMarkup}finally{state.transactions=originalTransactions}sheet.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'))}document.body.append(sheet);scene.sheet=sheet;return sheet}
function cleanupGlassHistory(scene){if(glassHistory!==scene)return;scene.motions.forEach(a=>a.cancel());scene.sheet?.remove();scene.host.remove();glassHistory=null;document.body.classList.remove('has-glass-history');$('#app').style.opacity='';$('#screen').style.minHeight='';$('#screen').style.visibility='';const nav=$('#nav');nav.hidden=route.page!=='home';nav.style.opacity='';nav.style.zIndex='';nav.style.transform='';nav.style.filter='';delete document.documentElement.dataset.gesture}
function animateGlassHistory(scene,target,done){cancelGlassMotions(scene);const p=scene.progress,tapTransition=(p<.02&&target===1)||(p>.98&&target===0),opts={duration:shouldReduceMotion()?100:tapTransition?280:260,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'},sheet=scene.sheet,transform=sheet?getComputedStyle(sheet).transform:'none';scene.motions=[scene.image.animate([{opacity:getComputedStyle(scene.image).opacity},{opacity:target}],opts),scene.tint.animate([{opacity:getComputedStyle(scene.tint).opacity},{opacity:target*.86}],opts),$('#nav').animate([{opacity:1-p},{opacity:1-target}],opts)];if(sheet)scene.motions.push(sheet.animate(tapTransition?[{transform:target?'translate3d(-18px,0,0)':'translate3d(0,0,0)',opacity:target?0:1},{transform:target?'translate3d(0,0,0)':'translate3d(-18px,0,0)',opacity:target?1:0}]:[{transform,opacity:1},{transform:`translate3d(${target?0:-scene.width}px,0,0)`,opacity:1}],opts));Promise.all(scene.motions.map(a=>a.finished)).then(()=>{if(glassHistory!==scene)return;setGlassHistoryProgress(scene,target);done?.()}).catch(()=>{})}
function finishSideHistoryOpen(scene){if(glassHistory!==scene)return;scene.phase='open';if(scene.livePage&&route.page==='history'){$('#screen').replaceChildren(scene.livePage);scene.livePage.style.marginTop='';if(scene.liveHeader)$('#screen').append(scene.liveHeader);$('#screen').style.minHeight='';pageScrollTo(0,scene.listScroll);scene.livePage=null;scene.liveHeader=null}scene.sheet?.remove();scene.sheet=null;$('#screen').style.visibility='';$('#app').style.opacity='';scene.x=0;setGlassHistoryProgress(scene,1);$('#nav').hidden=true;scene.motions.splice(0).forEach(motion=>motion.cancel());delete document.documentElement.dataset.gesture;fillHistoryInChunks(scene)}
function commitSideHistoryOpen(scene){scene.phase='opening';historyPresentation='drawer';scene.x=scene.sheet?new DOMMatrixReadOnly(getComputedStyle(scene.sheet).transform).m41:-scene.width;glassHistoryChanging=true;skipPageMotion=true;scene.pushedFromHome=true;
 renderWithHomeBackdrop(scene.sharp,()=>navigate('history'));
 history.replaceState({...history.state,fromHomeHistoryDrawer:true},'');
 showLiveHomeBehindHistory(scene,false);glassHistoryChanging=false;$('#app').style.opacity='';$('#screen').style.visibility='hidden';$('#nav').hidden=false;$('#nav').style.opacity=String(1-scene.progress);document.documentElement.dataset.gesture='active';animateGlassHistory(scene,1,()=>finishSideHistoryOpen(scene))}
function closeSideHistory(routeChanged=false){const scene=glassHistory;if(!scene)return false;if(scene.phase==='closing')return true;scene.phase='closing';cancelGlassMotions(scene);if(!scene.sheet)createSideHistorySheet(scene,true);scene.sheet.style.transform=`translate3d(${scene.x||0}px,0,0)`;document.documentElement.dataset.gesture='active';glassHistoryChanging=true;if(routeChanged){skipPageMotion=false;render()}else{skipPageMotion=true;backBeforeHistory()}glassHistoryChanging=false;pageScrollTo({top:scene.homeScroll,behavior:'instant'});
 // Fade the glass over the live Home instead of swapping a second Home image at the end.
 showLiveHomeBehindHistory(scene,true);$('#app').style.opacity='';$('#screen').style.minHeight='';$('#screen').style.visibility='';$('#nav').hidden=false;$('#nav').style.opacity=String(1-scene.progress);animateGlassHistory(scene,0,()=>cleanupGlassHistory(scene));return true}
function bindGlassHistoryGestures(mode){const app=$('#app');let start=null,active=false,scene=null,last=null,frame=0;
 const begin=(x,y,target)=>{if(start||route.page!==mode||swipeLayers||glassHistory?.backPending||['opening','closing'].includes(glassHistory?.phase))return;if(target.closest('input,textarea,select,dialog'))return;const edge=x-app.getBoundingClientRect().left<=28;if(mode==='home'&&!edge&&target.closest('.card-carousel,.card-selector,.home-product-track,.home-market-categories,nav'))return;start={x,y,time:performance.now()};last={x,time:start.time};active=false;scene=null};
 const move=(x,y)=>{if(!start||route.page!==mode)return false;const dx=x-start.x,dy=y-start.y;if(!active&&Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){start=null;return false}if(!active&&swipeLayers){start=null;return false}if(!active&&Math.abs(dx)>24&&Math.abs(dx)>Math.abs(dy)*2){if((mode==='history'&&dx>=0)||(mode==='home'&&dx<=0)){start=null;return false}active=true;scene=mode==='home'?ensureGlassHistory():glassHistory;if(!scene){start=null;return false}cancelGlassMotions(scene);historyPresentation='drawer';if(mode==='home'){historyFavoritesActive=false;historyReferenceFilter={direction:'all',tag:'',start:'',end:''};createSideHistorySheet(scene);showLiveHomeBehindHistory(scene,true);scene.startX=scene.x}else{createSideHistorySheet(scene,true);scene.startX=scene.x;$('#screen').style.visibility='hidden'}document.documentElement.dataset.gesture='active'}if(!active)return false;const distance=mode==='home'?Math.min(scene.width,Math.max(0,dx)):Math.min(scene.width,Math.max(0,-dx));scene.x=mode==='home'?Math.min(0,scene.startX+distance):Math.max(-scene.width,scene.startX-distance);if(!frame)frame=requestAnimationFrame(paintDrag);last={x,time:performance.now()};return true};
 const paintDrag=()=>{frame=0;scene.sheet.style.transform=`translate3d(${scene.x}px,0,0)`;setGlassHistoryProgress(scene,1+scene.x/scene.width)};
 const end=cancelled=>{if(!start)return;const origin=start;start=null;if(!active||!scene)return;active=false;if(frame){cancelAnimationFrame(frame);paintDrag()}const distance=Math.abs(last.x-origin.x),velocity=distance/Math.max(1,last.time-origin.time),commit=!cancelled&&(distance>scene.width*.18||(distance>24&&velocity>.4));const stop=e=>{e.preventDefault();e.stopPropagation()};document.addEventListener('click',stop,true);setTimeout(()=>document.removeEventListener('click',stop,true),0);if(mode==='home'){if(commit)commitSideHistoryOpen(scene);else animateGlassHistory(scene,0,()=>cleanupGlassHistory(scene))}else if(commit)back();else animateGlassHistory(scene,1,()=>finishSideHistoryOpen(scene))};
 const pd=e=>{if(e.pointerType==='mouse'&&e.button===0)begin(e.clientX,e.clientY,e.target)},pm=e=>{if(e.pointerType==='mouse'&&move(e.clientX,e.clientY))e.preventDefault()},pu=e=>{if(e.pointerType==='mouse')end(e.type==='pointercancel')};const ts=e=>{if(e.touches.length===1)begin(e.touches[0].clientX,e.touches[0].clientY,e.target)},tm=e=>{if(e.touches.length===1&&move(e.touches[0].clientX,e.touches[0].clientY))e.preventDefault()},te=e=>end(e.type==='touchcancel');
 app.onpointerdown=app.onpointermove=app.onpointerup=app.onpointercancel=null;app.ontouchstart=app.ontouchmove=app.ontouchend=app.ontouchcancel=null;app.addEventListener('pointerdown',pd);document.addEventListener('pointermove',pm);document.addEventListener('pointerup',pu);document.addEventListener('pointercancel',pu);app.addEventListener('touchstart',ts,{passive:true});document.addEventListener('touchmove',tm,{passive:false});document.addEventListener('touchend',te);document.addEventListener('touchcancel',te);
 return ()=>{cancelAnimationFrame(frame);app.removeEventListener('pointerdown',pd);document.removeEventListener('pointermove',pm);document.removeEventListener('pointerup',pu);document.removeEventListener('pointercancel',pu);app.removeEventListener('touchstart',ts);document.removeEventListener('touchmove',tm);document.removeEventListener('touchend',te);document.removeEventListener('touchcancel',te)}
}
bindHomeAllOperations=function(){homeOperationsCleanup?.();homeOperationsCleanup=bindGlassHistoryGestures('home')};
const backBeforeGlassHistory=back;back=function(){if(route.page==='history'&&historyPresentation==='drawer'&&glassHistory){
 if(glassHistory.pushedFromHome){
  if(!glassHistory.backPending){glassHistory.backPending=true;history.back()}
 }else closeSideHistory();
 return;
}backBeforeGlassHistory()};actions.back=()=>back();
const paintBeforeGlassHistory=paint;paint=function(direction){if(glassHistoryChanging){skipPageMotion=false;render();return}if(route.page==='history'&&historyPresentation==='drawer'&&$('#app').classList.contains('home')){const scene=ensureGlassHistory();scene.phase='opening';historyFavoritesActive=false;createSideHistorySheet(scene);scene.x=-scene.width;scene.sheet.style.transform=`translate3d(${-scene.width}px,0,0)`;glassHistoryChanging=true;scene.pushedFromHome=!!pendingHomeHistory||history.state?.fromHomeHistoryDrawer===true;if(pendingHomeHistory)history.replaceState({...history.state,fromHomeHistoryDrawer:true},'');renderWithHomeBackdrop(scene.sharp);glassHistoryChanging=false;$('#screen').style.visibility='hidden';$('#app').style.opacity='';document.documentElement.dataset.gesture='active';animateGlassHistory(scene,1,()=>finishSideHistoryOpen(scene));return}if(route.page==='home'&&$('#app').classList.contains('history')&&historyPresentation==='drawer'&&glassHistory){closeSideHistory(true);return}paintBeforeGlassHistory(direction)};
const renderBeforeGlassHistory=render;render=function(){glassHistoryCleanup?.();glassHistoryCleanup=null;renderBeforeGlassHistory();if(glassHistory&&!glassHistoryChanging&&!['home','history','detail','file','receipt'].includes(route.page))cleanupGlassHistory(glassHistory);if(route.page==='home'&&glassHistory&&!glassHistoryChanging&&!glassHistory.sheet)cleanupGlassHistory(glassHistory);if(!adminMode&&route.page==='history'&&historyPresentation==='drawer'){unifiedHistoryCleanup?.();historyTouchCleanup?.();const screen=$('#screen');screen.onpointerdown=screen.onpointermove=screen.onpointerup=screen.onpointercancel=null;screen.ontouchstart=screen.ontouchmove=screen.ontouchend=screen.ontouchcancel=null;glassHistoryCleanup=bindGlassHistoryGestures('history');if(glassHistory&&!glassHistoryChanging&&glassHistory.progress>=.99)$('#nav').hidden=true}};

render();
function syncSideHistoryCompact(){if(route.page!=='history'||historyPresentation!=='drawer')return;const header=$('.side-history-compact');if(!header)return;const p=Math.max(0,Math.min(1,(pageScrollY()-65)/40));header.style.opacity=String(p);header.inert=p===0;const title=$('.drawer-operations>h1');if(title)title.style.opacity=String(1-p)}
const renderBeforeCompactSideHistory=render;render=function(){renderBeforeCompactSideHistory();if(route.page==='history'&&historyPresentation==='drawer'&&!$('.side-history-compact')){$('#screen').insertAdjacentHTML('beforeend',`<header class="side-history-compact" inert><h2>Усі операції</h2><button data-action="history-favorites" aria-label="Обрані операції">${icon(historyFavoritesActive?'star-fill':'star')}</button><button data-action="history-search" aria-label="Пошук">${icon('magnifying-glass')}</button></header>`);syncSideHistoryCompact()}};window.addEventListener('scroll',syncSideHistoryCompact,{passive:true});
