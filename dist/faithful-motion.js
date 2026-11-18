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
 const corners=cardPlaneCorners(matrix,width,height);
 const xs=corners.map(([x])=>x),ys=corners.map(([,y])=>y),x=Math.min(...xs),y=Math.min(...ys);
 return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};
}

// Screen-space corners traced from the supplied 30 fps recording, in face order.
const rearFlightFrames=[
 [0,[[12,87],[287,87],[287,260],[12,260]]],
 [33,[[10,130],[259,75],[291,244],[42,291]]],
 [67,[[29,169],[215,70],[276,218],[83,311]]],
 [100,[[70,205],[158,75],[242,213],[137,325]]],
 [133,[[113,104],[191,197],[194,326],[126,245]]],
 [165,[[65,121],[211,310],[207,313],[61,124]]],
 [167,[[61,124],[65,121],[211,310],[207,313]]],
 [200,[[42,152],[171,235],[247,317],[80,211]]],
 [233,[[34,182],[210,246],[267,312],[63,247]]],
 [267,[[35,206],[223,242],[275,305],[35,268]]],
 [300,[[44,226],[230,242],[272,301],[21,282]]],
 [333,[[51,239],[246,241],[275,296],[23,294]]],
 [367,[[55,240],[248,240],[276,297],[22,297]]]
];
const rearFlightTurn=167;

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

function playRearFlight(plane,art,motion,source,destination,width,height,localMatrix,landing){
 const referenceStart=rearFlightFrames[0][1];
 const [landingTime,referenceEnd]=rearFlightFrames.at(-1);
 const scale=(source[1][0]-source[0][0])/(referenceStart[1][0]-referenceStart[0][0]);
 const center=(corners,axis)=>corners.reduce((sum,point)=>sum+point[axis],0)/4;
 const fit=(corners,reference)=>[0,1].map(axis=>center(corners,axis)-center(reference,axis)*scale);
 const startOffset=fit(source,referenceStart),endOffset=fit(destination,referenceEnd);
 const frames=rearFlightFrames.map(([time,quad])=>{
  if(time===0)return [time,source];
  if(time===landingTime)return [time,destination];
  const progress=time/landingTime;
  return [time,quad.map(point=>point.map((value,axis)=>value*scale+startOffset[axis]+(endOffset[axis]-startOffset[axis])*progress))];
 });
 const front=art.querySelector('.bank-card-front'),back=art.querySelector('.bank-card-back');
 back.style.transform='none';
 let frame;
 const render=()=>{
  const time=motion.currentTime??0;
  const rear=time<rearFlightTurn;
  front.style.opacity=rear?'0':'1';back.style.opacity=rear?'1':'0';
  if(time>=landingTime){plane.style.transform=landing;return}
  const next=frames.findIndex(([offset])=>offset>time);
  const [start,from]=frames[next-1],[end,to]=frames[next];
  // Swap corner order at the thin edge without interpolating through a crossed quad.
  const progress=end===rearFlightTurn?0:(time-start)/(end-start);
  const quad=from.map((point,i)=>point.map((value,axis)=>value+(to[i][axis]-value)*progress));
  plane.style.transform=localMatrix(projectCardCorners(quad,width,height));
  frame=requestAnimationFrame(render);
 };
 render();
 return ()=>cancelAnimationFrame(frame);
}

expandTransition=function(from,to,opening){
 if(!from||!to)return;
 let materialStart=from.materialOpacity,reflectionStart=from.glint;
 const previous=preciseCardScene,geometry=stableCardGeometry(to),reduce=shouldReduceMotion();
 const startAngle=opening||previous?0:from.flipAngle??(from.flipped?180:0);
 const returningFromBack=startAngle>=90;
 const interruptedFront=startAngle>.1&&!returningFromBack&&!reduce;
 const rear=returningFromBack&&!reduce;
 const tracedRear=rear&&startAngle>=179;
 const reduceRear=returningFromBack&&reduce;
 const duration=reduce?100:tracedRear?425:rear?380:460;

 const source=from.geometry,width=geometry.width,height=geometry.height,base={x:geometry.layout.x,y:geometry.layout.y,width,height};
 const origin=geometry.origin,originMatrix=new DOMMatrix().translate(origin[0],origin[1]);
 let sourceLayout=source.layout,startRelative=new DOMMatrix().translate(source.origin[0],source.origin[1]).multiply(new DOMMatrix(source.raw)).translate(-source.origin[0],-source.origin[1]).scale(source.width/width,source.height/height);
 const endRelative=originMatrix.multiply(new DOMMatrix(geometry.raw)).translate(-origin[0],-origin[1]);
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
 for(const [el,a,b] of [[full,opening?0:1,opening?1:0],[masked,opening?1:0,opening?0:1],[node.querySelector('.card-holder'),opening?0:1,opening?1:0]])if(el){el.style.display='block';if(el===masked)Object.assign(el.style,{position:'absolute',left:'0',top:'0'});el.animate([{opacity:a},{opacity:b}],{duration,fill:'both'})}
 // Interpolate one rigid 3D plane. Independent width/height corrections stretch the artwork.
 const localMatrix=matrix=>new DOMMatrix().translate(-origin[0],-origin[1]).multiply(matrix).translate(origin[0],origin[1]).toString();
 // Let the compositor interpolate the two exact poses as one continuous 3D transform.
 const planeFrames=[{transform:localMatrix(startRelative)},{transform:localMatrix(endRelative)}];
 const landingEase='cubic-bezier(.32,.72,0,1)';
 const frames=[{transform:new DOMMatrix().translate(sourceLayout.x-base.x,sourceLayout.y-base.y).toString()},{transform:new DOMMatrix().toString()}];
 node.style.transform=frames[reduceRear?1:0].transform;plane.style.transform=planeFrames[reduceRear?1:0].transform;
 const targetArtStyle=getComputedStyle(to.querySelector('.bank-card')),targetRadius=targetArtStyle.borderTopLeftRadius;
 // Keep shadows and corner masks on static layers during the transform.
 art.style.borderRadius=targetRadius;
 plane.style.borderRadius=targetRadius;
 const targetShadow=getComputedStyle(to).boxShadow;
 if(!rear)body.style.boxShadow=targetShadow;
 const material=art.querySelector('.card-material'),targetMaterial=to.querySelector('.card-material');
 if(material&&targetMaterial)material.animate([{opacity:materialStart??getComputedStyle(targetMaterial).opacity},{opacity:getComputedStyle(targetMaterial).opacity}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 const reflection=art.querySelector('.card-glint'),targetReflection=to.querySelector('.card-glint');
 if(reflection&&targetReflection&&reflectionStart){const targetStyle=getComputedStyle(targetReflection);reflection.animate([reflectionStart,{opacity:targetStyle.opacity,transform:targetStyle.transform}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})}
 node.classList.toggle('returning-rear',rear);
 const rearTracks=[];
 if(rear){
  if(!tracedRear){
   const perspective=(from.cardPerspective||1000)*width/source.width;
   rearTracks.push(...animateCardFaces(art,startAngle,0,perspective,{duration,easing:'cubic-bezier(.28,.25,.28,1)',fill:'both'}));
   // Pitch into the diagonal edge before revealing the already tilted front.
   const rearWeight=(startAngle-90)/90;
   const poses=[
    [0,0,0,'ease-out'],
    [.16,-24,-8,'ease-in-out'],
    [.31,-36,9,'ease-in-out'],
    [.43,15,11,'ease-out'],
    [.60,8,9,'ease-out'],
    [.82,0,0,'linear'],
    [1,0,0,'linear']
   ];
   rearTracks.push(body.animate(poses.map(([offset,roll,pitch,easing])=>({
    offset,easing,transform:`rotateZ(${roll*rearWeight}deg) rotateX(${pitch*rearWeight}deg)`
   })),{duration,fill:'both'}));
  }
  const shadow=document.createElement('span');
  shadow.className='card-motion-shadow';
  shadow.style.boxShadow=targetShadow;
  plane.prepend(shadow);
  // Use elapsed time so the flight easing cannot reveal the landing shadow early.
  rearTracks.push(shadow.animate([
   {opacity:0},{offset:tracedRear?rearFlightFrames.at(-1)[0]/duration:.86,opacity:0,easing:'ease-out'},{opacity:1}
  ],{duration,fill:'both'}));
 }else if(interruptedFront){
  plane.style.perspective=`${(from.cardPerspective||1000)*width/source.width}px`;
  body.animate([{transform:`rotateY(${startAngle}deg)`},{transform:'rotateY(0deg)'}],{duration,easing:landingEase,fill:'both'});
 }
 const snapshot=from.snapshot;
 if(snapshot){
  snapshot.querySelectorAll('.expanded-card,.card-header-mini,.transition-nav').forEach(el=>el.style.setProperty('opacity','0','important'));
  snapshot.style.zIndex='37';snapshot.style.maxHeight=Math.max(0,innerHeight-parseFloat(snapshot.style.top))+'px';document.body.append(snapshot);
  const fade=snapshot.animate([{opacity:1},{opacity:0}],{duration:rear?duration*.64:duration,easing:landingEase,fill:'both'});
  fade.finished.catch(()=>{});
  if(rear)rearTracks.push(fade);
 }
 const targetVisibility=to.style.visibility;to.style.visibility='hidden';document.documentElement.dataset.gesture='active';operationsNav(opening?1:0,opening?0:1,duration);
 const scene={node,plane,body,base,origin,target:to,targetVisibility,backdrop:snapshot,sourceRect,destinationRect:destination};preciseCardScene=scene;
 scene.dispose=()=>{if(scene.disposed)return;scene.disposed=true;scene.stopRearFlight?.();to.style.visibility=targetVisibility;const tracks=[...node.getAnimations({subtree:true}),...(snapshot?.getAnimations()||[])];node.remove();snapshot?.remove();for(const track of tracks)track.cancel();if(preciseCardScene===scene){preciseCardScene=null;if(!swipeLayers)delete document.documentElement.dataset.gesture;restoreOperationsNav()}};
 const planeMotion=reduceRear||tracedRear?null:plane.animate(planeFrames,{duration,easing:landingEase,fill:'both'});scene.planeMotion=planeMotion;
 const motionFrames=tracedRear?[frames[1],frames[1]]:reduce?[{opacity:0},{opacity:1}]:frames;
 const motion=node.animate(motionFrames,{duration,easing:landingEase,fill:'both'});scene.motion=motion;cardTransition=motion;
 if(tracedRear){
  const startInBase=new DOMMatrix().translate(sourceLayout.x-base.x,sourceLayout.y-base.y).multiply(startRelative);
  scene.stopRearFlight=playRearFlight(plane,art,motion,cardPlaneCorners(startInBase,width,height),cardPlaneCorners(endRelative,width,height),width,height,localMatrix,planeFrames[1].transform);
 }
 if(rear&&document.timeline.currentTime!==null){
  for(const track of [motion,planeMotion,...rearTracks])if(track)track.startTime=document.timeline.currentTime;
 }
 // Collect after the caller adds its face/ink tracks; never discard a still-moving layer.
 Promise.resolve().then(()=>Promise.allSettled([...node.getAnimations({subtree:true}),...(snapshot?.getAnimations()||[])].filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished))).then(()=>requestAnimationFrame(()=>scene.dispose()));
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
cardPage=function(){const c=activeCard(),settings=state.cardSettings[c.id]||{};return `<div class="toolbar card-close"><button class="back" data-action="back" aria-label="Закрити">${icon('x')}</button></div><div class="page card-settings"><button class="expanded-card ${cardFlipped?'flipped':''}" data-action="flip-card" aria-label="Перевернути картку">${cardArtwork(c)}</button><button class="payment-settings" data-action="payment-settings"><img class="icon" src="assets/reference/gear.png" alt=""><span>Налаштування оплат<small>Додаткові перевірки</small></span></button><h2>${esc(c.account)}</h2><section class="settings-group">${button('apple-pay','Налаштування Apple Pay','gear','Обрати скін картки — у нас їх багато').replace(icon('gear'),uiIcon('apple-native'))}${button('toggle-block',settings.blocked?'Розблокувати картку':'Заблокувати картку','lock-key','Ви завжди зможете її розблокувати')}${button('credit-info','Змінити кредитний ліміт','wallet',`Поточний ліміт ${displayMoney(state.creditLimit)} ₴`)}</section><section class="settings-group">${button('nav','Підписки та сервіси','arrows-clockwise','Керування списаннями з картки','data-page="subscriptions"').replace(icon('arrows-clockwise'),'<svg class="icon subscription-mark" viewBox="0 0 28 28" aria-hidden="true"><text x="2" y="22">@</text></svg>')}</section><section class="settings-group">${button('plastic','Випустити пластикову картку','credit-card-fill')}${button('reissue','Перевипустити картку','arrow-square-in')}${button('card-status','Підвищити статус картки','star')}${button('pin-info','Налаштування ПІН-коду','magnifying-glass')}${button('nav','Додаткові картки','credit-card','Картки mono та АТБ','data-page="cards"')}${button('card-details','Реквізити картки','receipt','Для поповнення за IBAN')}${button('card-statement','Надіслати виписку за карткою','receipt-fill')}</section></div>`};
actions['card-status']=()=>navigate('platinum');actions['card-statement']=()=>navigate('statement');
const renderBeforeMainOperations=render;render=function(){homeOperationsCleanup?.();renderBeforeMainOperations();if(!adminMode&&route.page==='home')bindHomeAllOperations()};
render();
