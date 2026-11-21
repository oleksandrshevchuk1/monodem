'use strict';
// A card morph starts and ends at the painted rectangles, not at carousel layout boxes.
const measureBeforePaintedBounds=measureCardPose;measureCardPose=function(el){const pose=measureBeforePaintedBounds(el),r=el.getBoundingClientRect();pose.center={x:r.x+r.width/2,y:r.y+r.height/2};return pose};
let preciseCardScene=null;
function stableCardGeometry(el){
 const style=getComputedStyle(el),transform=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform),origin=style.transformOrigin.split(' ').map(parseFloat);
 const saved=el.style.getPropertyValue('transform'),priority=el.style.getPropertyPriority('transform');
 el.style.setProperty('transform','none','important');const layout=el.getBoundingClientRect();
 if(saved)el.style.setProperty('transform',saved,priority);else el.style.removeProperty('transform');
 const matrix=new DOMMatrix().translate(layout.x,layout.y).translate(origin[0],origin[1]).multiply(transform).translate(-origin[0],-origin[1]);
 return {matrix:Array.from(matrix.toFloat64Array()),raw:Array.from(transform.toFloat64Array()),origin,layout:{x:layout.x,y:layout.y},width:layout.width,height:layout.height};
}
function cardPlaneCorners(matrix,width,height){
 return [[0,0],[width,0],[width,height],[0,height]].map(([x,y])=>{
  const w=matrix.m14*x+matrix.m24*y+matrix.m44;
  return [(matrix.m11*x+matrix.m21*y+matrix.m41)/w,(matrix.m12*x+matrix.m22*y+matrix.m42)/w];
 });
}
function cardPlaneBounds(matrix,width,height){
 return cardPlaneBoundsFromCorners(cardPlaneCorners(matrix,width,height));
}
function cardPlaneBoundsFromCorners(corners){
 const xs=corners.map(([x])=>x),ys=corners.map(([,y])=>y),x=Math.min(...xs),y=Math.min(...ys);
 return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};
}

function projectCardCorners(quad,width,height){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=quad;
 const dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2;
 const dx=x0-x1+x2-x3,dy=y0-y1+y2-y3;
 const determinant=dx1*dy2-dx2*dy1;
 const g=(dx*dy2-dx2*dy)/determinant,h=(dx1*dy-dx*dy1)/determinant;
 return new DOMMatrix([
  (x1-x0+g*x1)/width,(y1-y0+g*y1)/width,0,g/width,
  (x3-x0+h*x3)/height,(y3-y0+h*y3)/height,0,h/height,
  0,0,1,0,x0,y0,0,1
 ]);
}

function animateRearCard(scene,art,shadow,start,end,camera,pitch,angle){
 const {plane,timing}=scene;
 const edge=1-Math.sqrt(90/angle);
 const offsets=[0,.125,.25,.375,.5,.625,.75,.875,1];
 if(edge>0&&!offsets.includes(edge))offsets.push(edge);
 offsets.sort((a,b)=>a-b);
 const mix=(a,b,t)=>a+(b-a)*t;
 const poses=offsets.map((offset,i)=>{
  const remaining=1-offset;
  const travel=1-remaining*remaining;
  const yaw=angle*remaining*remaining;
  const bank=-180*offset*remaining*remaining*(1-2.8*offset)*angle/180;
  const tilt=offset*offset*(3-2*offset)*pitch;
  const sx=mix(start.m11,1,travel),sy=mix(start.m22,1,travel);
  const next=offsets[i+1],slope=2-offset-next;
  const easing=next===undefined?'linear':`cubic-bezier(0.333333,${2*remaining/(3*slope)},0.666667,${1-2*(1-next)/(3*slope)})`;
  return {offset,easing,transform:`translate3d(${mix(start.m41,end.m41,travel)}px,${mix(start.m42,end.m42,travel)}px,0)
   perspective(${camera}px) scale3d(${sx},${sy},${sx})
   rotateZ(${bank}deg) rotateX(${tilt}rad) rotateY(${yaw}deg)`};
 });
 // Keep the exact landing pose underneath the compositor animation.
 plane.style.transform=end.toString();
 const motion=plane.animate(poses,timing);
 const faces=[];
 for(const [side,opacity] of [['front',1],['back',0]]){
  const face=art.querySelector('.bank-card-'+side);
  face.style.opacity=String(opacity);
  if(edge>0){
   // Use compositor-interpolated opacity during the narrow edge, without a stepped effect.
   const halfWindow=1/timing.duration;
   faces.push(face.animate([
    {opacity:1-opacity},{offset:Math.max(0,edge-halfWindow),opacity:1-opacity},
    {offset:edge+halfWindow,opacity},{opacity}
   ],timing));
  }
 }
 motion.ready.then(()=>{
  if(scene.disposed||motion.startTime===null)return;
  for(const face of faces)if(face.startTime!==motion.startTime)face.startTime=motion.startTime;
 }).catch(()=>{});
 shadow.style.opacity='1';
 shadow.animate([{opacity:0},{offset:Math.max(0,edge),opacity:0,easing:'ease-out'},{opacity:1}],timing);
 return motion;
}

expandTransition=function(from,to,opening){
 if(!from||!to)return;
 let materialStart=from.materialOpacity,reflectionStart=from.glint;
 const previous=preciseCardScene,geometry=stableCardGeometry(to),reduce=shouldReduceMotion();
 const startAngle=opening||previous?0:from.flipAngle??(from.flipped?180:0);
 const returningFromBack=!opening&&!previous&&(from.rearVisible??startAngle>=90);
 const interruptedFront=startAngle>.1&&!returningFromBack&&!reduce;
 const rear=returningFromBack&&!reduce;
 const reduceRear=returningFromBack&&reduce;
 const duration=reduce?100:420;

 const source=from.geometry,width=geometry.width,height=geometry.height,base={x:geometry.layout.x,y:geometry.layout.y,width,height};
 const origin=geometry.origin,originMatrix=new DOMMatrix().translate(origin[0],origin[1]);
 let sourceLayout=source.layout,startRelative=new DOMMatrix().translate(source.origin[0],source.origin[1]).multiply(new DOMMatrix(source.raw)).translate(-source.origin[0],-source.origin[1]).scale(source.width/width,source.height/height);
 const endRelative=originMatrix.multiply(new DOMMatrix(geometry.raw)).translate(-origin[0],-origin[1]);
 let paintedFace=from.faceCorners;
 if(paintedFace){
  const {x,y,width:faceWidth,height:faceHeight}=cardPlaneBoundsFromCorners(paintedFace);
  // A face sampled exactly edge-on still needs a non-singular projection.
  if(faceWidth<.1)paintedFace=[[x,y],[x+.1,y],[x+.1,y+faceHeight],[x,y+faceHeight]];
 }
 if(interruptedFront&&paintedFace){
  startRelative=projectCardCorners(paintedFace.map(([x,y])=>[x-sourceLayout.x,y-sourceLayout.y]),width,height);
 }
 if(previous){
  const oldMaterial=previous.node.querySelector('.card-material');
  if(oldMaterial)materialStart=getComputedStyle(oldMaterial).opacity;
  const oldReflection=previous.node.querySelector('.card-glint');
  if(oldReflection){
   const style=getComputedStyle(oldReflection);
   reflectionStart={opacity:style.opacity,transform:style.transform};
  }
  const [oldX,oldY]=previous.origin;
  const oldPlane=new DOMMatrixReadOnly(getComputedStyle(previous.plane).transform);
  const oldBody=new DOMMatrixReadOnly(getComputedStyle(previous.body).transform);
  const aroundOrigin=matrix=>new DOMMatrix().translate(oldX,oldY).multiply(matrix).translate(-oldX,-oldY);
  sourceLayout=previous.base;
  startRelative=new DOMMatrix().translate(previous.swipeOffsetX||0,0)
   .multiply(new DOMMatrixReadOnly(getComputedStyle(previous.node).transform))
   .multiply(aroundOrigin(oldPlane))
   .multiply(aroundOrigin(oldBody))
   .scale(previous.base.width/width,previous.base.height/height);
  previous.dispose();
 }
 const sourceRect=cardPlaneBounds(new DOMMatrix().translate(sourceLayout.x,sourceLayout.y).multiply(startRelative),width,height),destination=cardPlaneBounds(new DOMMatrix().translate(base.x,base.y).multiply(endRelative),width,height);
 const node=document.createElement('div');node.className='card-transition soft-card-surface precise-card-surface';
 const plane=document.createElement('div');plane.className='travelling-card-plane';Object.assign(plane.style,{width:'100%',height:'100%',transformStyle:'preserve-3d',transformOrigin:origin[0]+'px '+origin[1]+'px'});
 const art=to.querySelector('.bank-card').cloneNode(true),body=document.createElement('div');body.className='travelling-card-body';Object.assign(body.style,{width:'100%',height:'100%',position:'relative',borderRadius:'inherit',transformStyle:'preserve-3d',transformOrigin:origin[0]+'px '+origin[1]+'px'});body.append(art);plane.append(body);node.append(plane);
 Object.assign(node.style,{position:'fixed',left:base.x+'px',top:base.y+'px',width:width+'px',height:height+'px',zIndex:'48',pointerEvents:'none',transformOrigin:'0 0'});document.body.append(node);
 const full=node.querySelector('.card-number-full'),masked=node.querySelector('.card-number-masked');
 if(!rear)for(const [el,a,b] of [[full,opening?0:1,opening?1:0],[masked,opening?1:0,opening?0:1],[node.querySelector('.card-holder'),opening?0:1,opening?1:0]])if(el){el.style.display='block';if(el===masked)Object.assign(el.style,{position:'absolute',left:'0',top:'0'});el.animate([{opacity:a},{opacity:b}],{duration,fill:'both'})}
 // Interpolate one rigid 3D plane. Independent width/height corrections stretch the artwork.
 const localMatrix=matrix=>new DOMMatrix().translate(-origin[0],-origin[1]).multiply(matrix).translate(origin[0],origin[1]);
 // Let the compositor interpolate the two exact poses as one continuous 3D transform.
 const startPlane=localMatrix(startRelative),endPlane=localMatrix(endRelative);
 const rearStart=new DOMMatrix().translate(sourceLayout.x-base.x,sourceLayout.y-base.y).multiply(startPlane);
 const raw=new DOMMatrix(geometry.raw);
 const camera=raw.m24?-raw.m23/raw.m24:900;
 const pitch=Math.atan2(raw.m23,raw.m22-raw.m42*raw.m24);
 const planeFrames=[{transform:startPlane.toString()},{transform:endPlane.toString()}];
 const landingEase=rear?'linear':'cubic-bezier(.32,.72,0,1)';
 const frames=[{transform:new DOMMatrix().translate(sourceLayout.x-base.x,sourceLayout.y-base.y).toString()},{transform:new DOMMatrix().toString()}];
 node.style.transform=frames[reduceRear||rear?1:0].transform;
 plane.style.transform=rear?endPlane.toString():planeFrames[reduceRear?1:0].transform;
 const targetArtStyle=getComputedStyle(to.querySelector('.bank-card')),targetRadius=targetArtStyle.borderTopLeftRadius;
 // Keep shadows and corner masks on static layers during the transform.
 art.style.borderRadius=targetRadius;
 plane.style.borderRadius=targetRadius;
 const targetShadow=getComputedStyle(to).boxShadow;
 if(!rear)body.style.boxShadow=targetShadow;
 const front=art.querySelector('.bank-card-front');
 const targetFront=to.querySelector('.bank-card-front');
 const paint=getComputedStyle(targetFront);
 Object.assign(front.style,{
  background:paint.background,
  filter:paint.filter,
  boxShadow:paint.boxShadow
 });
 const material=art.querySelector('.card-material'),targetMaterial=to.querySelector('.card-material');
 if(material&&targetMaterial){
  const opacity=getComputedStyle(targetMaterial).opacity;
  if(rear)material.style.opacity=opacity;
  else material.animate([{opacity:materialStart??opacity},{opacity}],{duration,easing:landingEase,fill:'both'});
 }
 const reflection=art.querySelector('.card-glint'),targetReflection=to.querySelector('.card-glint');
 if(reflection&&targetReflection){
  const targetStyle=getComputedStyle(targetReflection),end={opacity:targetStyle.opacity,transform:targetStyle.transform};
  if(rear)Object.assign(reflection.style,end);
  else if(reflectionStart){
   const hidden={...end,opacity:0};
   const poses=opening
    ? [reflectionStart,{...hidden,offset:.28},hidden]
    : [{...reflectionStart,opacity:0},{...hidden,offset:.72},end];
   reflection.animate(poses,{duration,easing:landingEase,fill:'both'});
  }
 }
 node.classList.toggle('returning-rear',rear);
 let shadow;
 if(rear){
  shadow=document.createElement('span');
  shadow.className='card-motion-shadow';
  shadow.style.boxShadow=targetShadow;
  art.prepend(shadow);
 }
 const snapshot=from.snapshot;
 if(snapshot){
  snapshot.querySelectorAll('.expanded-card,.card-header-mini,.transition-nav').forEach(el=>el.style.setProperty('opacity','0','important'));
  snapshot.style.zIndex='37';snapshot.style.maxHeight=Math.max(0,innerHeight-parseFloat(snapshot.style.top))+'px';document.body.append(snapshot);
  const fade=snapshot.animate([{opacity:1},{opacity:0}],{duration,easing:landingEase,fill:'both'});
  fade.finished.catch(()=>{});
 }
 const targetVisibility=to.style.visibility;to.style.visibility='hidden';document.documentElement.dataset.gesture='active';
 if(rear)restoreOperationsNav();else operationsNav(opening?1:0,opening?0:1,duration);
 const scene={node,plane,body,base,origin,rear,target:to,targetVisibility,backdrop:snapshot,sourceRect,destinationRect:destination,timing:{duration,easing:landingEase,fill:'both'}};preciseCardScene=scene;
 scene.dispose=()=>{if(scene.disposed)return;scene.disposed=true;to.style.visibility=targetVisibility;const tracks=[...node.getAnimations({subtree:true}),...(snapshot?.getAnimations()||[])];node.remove();snapshot?.remove();for(const track of tracks)track.cancel();if(preciseCardScene===scene){preciseCardScene=null;if(!swipeLayers)delete document.documentElement.dataset.gesture;restoreOperationsNav()}};
 const planeMotion=rear?animateRearCard(scene,art,shadow,rearStart,endPlane,camera,pitch,startAngle):
  reduceRear?null:plane.animate(planeFrames,scene.timing);scene.planeMotion=planeMotion;
 const motionFrames=reduce?[{opacity:0},{opacity:1}]:frames;
 const motion=rear?planeMotion:node.animate(motionFrames,scene.timing);scene.motion=motion;cardTransition=motion;
 // Collect after the caller adds its face/ink tracks; never discard a still-moving layer.
 Promise.resolve().then(()=>{
  const tracks=[...node.getAnimations({subtree:true}),...(snapshot?.getAnimations()||[])];
  return Promise.allSettled(tracks.filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished));
 }).then(()=>requestAnimationFrame(()=>scene.dispose()));
};
// The card carousel owns only its own strip. The rest of Home opens all operations.
bindOperationsGesture=function(){};
let homeOperationsCleanup=null;
function bindHomeAllOperations(){homeOperationsCleanup?.();const app=$('#app');let start=null,axis=false,drawer=null,dx=0,last=null,side=-1;
 const begin=(x,y,target)=>{if(route.page!=='home'||target.closest('.card-carousel,.card-selector,.home-product-track,.home-market-categories,nav,input,textarea,select')||x-app.getBoundingClientRect().left<=28)return;start={x,y,time:performance.now()};last={x,time:start.time};axis=false;dx=0};
 const move=(x,y)=>{if(!start||route.page!=='home')return false;const horizontal=x-start.x,vertical=y-start.y;if(!axis&&Math.abs(vertical)>9&&Math.abs(vertical)>Math.abs(horizontal)){start=null;return false}if(!axis&&Math.abs(horizontal)>9&&Math.abs(horizontal)>Math.abs(vertical)*1.2){axis=true;side=horizontal<0?-1:1;historyPresentation='drawer';historyFavoritesActive=false;historyReferenceFilter={direction:'all',tag:'',start:'',end:''};operationsHome=freezeHome();drawer=historyDrawer();drawer.classList.add('soft-operations-layer','main-operations-drawer');document.documentElement.dataset.gesture='active'}if(!axis)return false;dx=side<0?Math.max(-app.clientWidth,Math.min(0,horizontal)):Math.min(app.clientWidth,Math.max(0,horizontal));const width=drawer.offsetWidth;drawer.style.transform=`translate3d(${side<0?width+dx:dx-width}px,0,0)`;app.style.filter=`blur(${Math.min(1,Math.abs(dx)/width)*6}px)`;last={x,time:performance.now()};return true};
 const end=cancelled=>{if(!start)return;const origin=start;start=null;if(!axis||!drawer)return;axis=false;const node=drawer,width=node.offsetWidth,direction=side,velocity=Math.abs((last.x-origin.x)/Math.max(1,last.time-origin.time)),open=!cancelled&&(Math.abs(dx)>width*.2||(Math.abs(dx)>28&&velocity>.4));drawer=null;const stop=e=>{e.preventDefault();e.stopPropagation()};document.addEventListener('click',stop,true);setTimeout(()=>document.removeEventListener('click',stop,true),0);const finish=()=>{if(open){skipPageMotion=true;navigate('history')}node.remove();app.style.filter='';delete document.documentElement.dataset.gesture};if(shouldReduceMotion()){finish();return}node.animate([{transform:getComputedStyle(node).transform},{transform:`translate3d(${open?0:direction<0?width:-width}px,0,0)`}],{duration:240,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}).finished.then(finish).catch(finish)};
 const pd=e=>{if(e.pointerType==='mouse'&&e.button===0)begin(e.clientX,e.clientY,e.target)},pm=e=>{if(e.pointerType==='mouse'&&move(e.clientX,e.clientY))e.preventDefault()},pu=e=>{if(e.pointerType==='mouse')end(e.type==='pointercancel')};const ts=e=>{if(e.touches.length===1)begin(e.touches[0].clientX,e.touches[0].clientY,e.target)},tm=e=>{if(e.touches.length===1&&move(e.touches[0].clientX,e.touches[0].clientY))e.preventDefault()},te=e=>end(e.type==='touchcancel');
 app.addEventListener('pointerdown',pd);document.addEventListener('pointermove',pm);document.addEventListener('pointerup',pu);document.addEventListener('pointercancel',pu);app.addEventListener('touchstart',ts,{passive:true});document.addEventListener('touchmove',tm,{passive:false});document.addEventListener('touchend',te);document.addEventListener('touchcancel',te);
 homeOperationsCleanup=()=>{app.removeEventListener('pointerdown',pd);document.removeEventListener('pointermove',pm);document.removeEventListener('pointerup',pu);document.removeEventListener('pointercancel',pu);app.removeEventListener('touchstart',ts);document.removeEventListener('touchmove',tm);document.removeEventListener('touchend',te);document.removeEventListener('touchcancel',te);homeOperationsCleanup=null};
}
const detailBeforeOriginalPatterns=detail;detail=function(){const t=currentTx(),template=document.createElement('template');template.innerHTML=detailBeforeOriginalPatterns();if(!t)return template.innerHTML;template.content.querySelectorAll('.operation-pattern-glyphs').forEach(el=>el.remove());const pattern=template.content.querySelector('.reference-operation-pattern');if(pattern)pattern.dataset.originalPattern=t.amount>0?'income':'expense';if(t.amount>0){template.content.querySelectorAll('.receipt-link,[data-action=share-receipt],[data-action=receipt]').forEach(el=>el.remove());const generic=template.content.querySelector('.incoming-avatar img[src$="incoming-symbol.png"]');if(generic)generic.src='assets/reference/incoming-generic-reference.png'}return template.innerHTML};
cardPage=function(){const c=activeCard(),white=cardWhite(c),settings=state.cardSettings[c.id]||{};return `<div class="toolbar card-close"><button class="back" data-action="back" aria-label="Закрити">${icon('x')}</button></div><div class="page card-settings"><button class="expanded-card ${cardFlipped?'flipped':''}" data-action="flip-card" aria-label="Перевернути картку">${cardArtwork(c)}</button><button class="payment-settings" data-action="payment-settings"><img class="icon" src="assets/reference/gear.png" alt=""><span>Налаштування оплат<small>Додаткові перевірки</small></span></button><h2>${esc(c.account)}</h2><section class="settings-group">${button('apple-pay','Налаштування Apple Pay','gear','Обрати скін картки — у нас їх багато').replace(icon('gear'),uiIcon('apple-native'))}${button('toggle-block',settings.blocked?'Розблокувати картку':'Заблокувати картку','lock-key','Ви завжди зможете її розблокувати')}${white?'':button('credit-info','Змінити кредитний ліміт','wallet',`Поточний ліміт ${state.creditLimit===0?'0':displayMoney(state.creditLimit)} ₴`)}</section><section class="settings-group">${button('nav','Підписки та сервіси','arrows-clockwise','Керування списаннями з картки','data-page="subscriptions"').replace(icon('arrows-clockwise'),'<svg class="icon subscription-mark" viewBox="0 0 28 28" aria-hidden="true"><text x="2" y="22">@</text></svg>')}</section><section class="settings-group">${button('plastic','Випустити пластикову картку','credit-card-fill')}${button('reissue','Перевипустити картку','arrow-square-in')}${white?'':button('card-status','Підвищити статус картки','star')}${button('pin-info','Налаштування ПІН-коду','magnifying-glass')}${white?'':button('nav','Додаткові картки','credit-card','Картки mono та АТБ','data-page="cards"')}</section><section class="settings-group">${button('card-details','Реквізити картки','receipt','Для поповнення за IBAN')}${button('card-statement','Надіслати виписку за карткою','receipt-fill')}</section>${white?`<section class="settings-group">${button('close-card-info','Закрити картку','x')}</section>`:''}</div>`};
actions['card-status']=()=>navigate('platinum');actions['card-statement']=()=>navigate('statement');
const renderBeforeMainOperations=render;render=function(){homeOperationsCleanup?.();renderBeforeMainOperations();if(!adminMode&&route.page==='home')bindHomeAllOperations()};
render();
