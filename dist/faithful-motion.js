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

// Corners traced from the 30 fps rear-close reference, in clockwise order.
const rearClosePoses=[
 [0,   [[10,33],[232,33],[232,172],[10,172]]],
 [33,  [[9,69],[207,23],[236,153],[37,200]]],
 [67,  [[15,87],[183,20],[226,147],[56,209]]],
 [100, [[58,128],[128,23],[197,129],[109,222]]],
 [133, [[81,38],[155,123],[155,229],[90,152]]],
 [167, [[52,61],[167,204],[171,210],[54,66]]],
 [200, [[34,87],[143,147],[199,219],[74,144]]],
 [233, [[25,110],[163,160],[215,215],[43,165]]],
 [267, [[31,130],[186,158],[219,208],[27,191]]],
 [300, [[41,145],[198,161],[222,205],[19,197]]],
 [333, [[45,155],[204,155],[225,202],[18,202]]],
 [367, [[46,155],[205,155],[226,202],[20,202]]]
];
const rearCloseEdgeTime=167;
function cardQuadTransform(quad,width,height){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=quad;
 const dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2;
 const dx=x0-x1+x2-x3,dy=y0-y1+y2-y3;
 const determinant=dx1*dy2-dx2*dy1;
 const g=(dx*dy2-dx2*dy)/determinant,h=(dx1*dy-dx*dy1)/determinant;
 return new DOMMatrix([
  (x1-x0+g*x1)/width,(y1-y0+g*y1)/width,0,g/width,
  (x3-x0+h*x3)/height,(y3-y0+h*y3)/height,0,h/height,
  0,0,1,0,x0,y0,0,1
 ]).toString();
}
function animateRearClose(body,art,source,destination,landingMatrix,width,height){
 const start=rearClosePoses[0][1];
 const [lastTime,end]=rearClosePoses[rearClosePoses.length-1];
 const scale=[(source[1][0]-source[0][0])/222,(source[3][1]-source[0][1])/139];
 const center=(quad,axis)=>quad.reduce((total,point)=>total+point[axis],0)/4;
 const landingCorrection=scale.map((factor,axis)=>center(destination,axis)-center(source,axis)-(center(end,axis)-center(start,axis))*factor);
 const fit=([time,quad])=>time===lastTime?destination:quad.map(corner=>corner.map((value,axis)=>
  center(source,axis)+(value-center(start,axis))*scale[axis]+landingCorrection[axis]*time/lastTime
 ));
 const poses=rearClosePoses.map(pose=>[pose[0],fit(pose)]);
 const front=art.querySelector('.bank-card-front'),back=art.querySelector('.bank-card-back');
 const landing=landingMatrix.toString();
 body.style.transformOrigin='0 0';
 body.style.transform=cardQuadTransform(source,width,height);
 back.style.transform='none';
 front.style.opacity='0';
 back.style.opacity='1';

 // Apply the projection and face together on each rendered frame, including iOS WebKit.
 let frame,previousTime,elapsed=0,segment=0,resolve;
 const finished=new Promise(done=>{resolve=done});
 const cancel=()=>{cancelAnimationFrame(frame);resolve()};
 const advance=time=>{
  if(previousTime!==undefined)elapsed+=Math.min(time-previousTime,50);
  previousTime=time;
  if(elapsed>=lastTime){
   body.style.transform=landing;
   frame=requestAnimationFrame(resolve);
   return;
  }
  if(elapsed>=rearCloseEdgeTime&&back.style.opacity==='1'){
   back.style.opacity='0';
   front.style.opacity='1';
  }
  while(elapsed>=poses[segment+1][0])segment++;
  const [startTime,from]=poses[segment], [endTime,to]=poses[segment+1];
  const progress=(elapsed-startTime)/(endTime-startTime);
  const quad=from.map((point,corner)=>point.map((value,axis)=>value+(to[corner][axis]-value)*progress));
  body.style.transform=cardQuadTransform(quad,width,height);
  frame=requestAnimationFrame(advance);
 };
 frame=requestAnimationFrame(advance);
 return {finished,cancel};
}

expandTransition=function(from,to,opening){
 if(!from||!to)return;
 let materialStart=from.materialOpacity,reflectionStart=from.glint;
 const previous=preciseCardScene,geometry=stableCardGeometry(to),reduce=shouldReduceMotion(),duration=reduce?100:460;
 const startAngle=opening||previous?0:from.flipAngle??(from.flipped?180:0);
 const returningFromBack=startAngle>=90;
 const interruptedFront=startAngle>.1&&!returningFromBack&&!reduce;
 const rear=returningFromBack&&!reduce;
 const reduceRear=returningFromBack&&reduce;
 const trackedRear=rear&&startAngle>179;
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
   .multiply(previous.trackedRear?oldBody:aroundOrigin(oldBody))
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
 // Start pitching into the carousel as the front comes through the edge.
 const pitchStart=.24,landingEase='cubic-bezier(.32,.72,0,1)';
 if(rear)planeFrames.splice(1,0,{offset:pitchStart,transform:planeFrames[0].transform,easing:landingEase});
 let frames=[{transform:new DOMMatrix().translate(sourceLayout.x-base.x,sourceLayout.y-base.y).toString()},{transform:new DOMMatrix().toString()}];
 if(rear&&!trackedRear){
  const drop=(destination.y+destination.height/2-sourceRect.y-sourceRect.height/2)*.55;
  // Cancel the carousel layout's centering translation as its pitch comes in.
  frames[0].easing='cubic-bezier(.35,.5,.45,1)';
  frames.splice(1,0,{offset:pitchStart,transform:new DOMMatrix().translate(sourceLayout.x-base.x,sourceLayout.y-base.y+drop).toString(),easing:landingEase});
 }
 if(trackedRear){
  frames=[{transform:'none'},{transform:'none'}];
  planeFrames.splice(0,planeFrames.length,...frames);
 }
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
 let rearPlayback;
 if(rear){
  if(trackedRear){
   const start=new DOMMatrix().translate(sourceLayout.x-base.x,sourceLayout.y-base.y).multiply(startRelative);
   rearPlayback=animateRearClose(body,art,cardPlaneCorners(start,width,height),cardPlaneCorners(endRelative,width,height),endRelative,width,height);
  }else{
   const perspective=(from.cardPerspective||1000)*width/source.width;
   const turnDuration=300*startAngle/180;
   const faces=animateCardFaces(art,startAngle,0,perspective,{duration:turnDuration,easing:cardTurnEase,fill:'both'});
   // Bank into the turn, then unwind as the front settles into the carousel.
   const bank=body.animate([
    {transform:'rotateZ(0deg)'},
    {offset:.10,transform:'rotateZ(-16deg)'},
    {offset:.20,transform:'rotateZ(-25deg)'},
    {offset:.32,transform:'rotateZ(29deg)'},
    {offset:.52,transform:'rotateZ(16deg)'},
    {transform:'rotateZ(0deg)'}
   ],{duration,easing:'linear',fill:'both'});
   const startTime=document.timeline.currentTime;
   if(startTime!==null)for(const track of [bank,...faces])track.startTime=startTime;
  }
  const shadow=document.createElement('span');
  shadow.className='card-motion-shadow';
  shadow.style.boxShadow=targetShadow;
  if(trackedRear)body.prepend(shadow);else plane.prepend(shadow);
  shadow.animate([{opacity:0},{offset:.67,opacity:0},{opacity:1}],{duration:460,easing:'linear',fill:'both'});
 }else if(interruptedFront){
  plane.style.perspective=`${(from.cardPerspective||1000)*width/source.width}px`;
  body.animate([{transform:`rotateY(${startAngle}deg)`},{transform:'rotateY(0deg)'}],{duration,easing:landingEase,fill:'both'});
 }
 const snapshot=from.snapshot;if(snapshot){snapshot.querySelectorAll('.expanded-card,.card-header-mini,.transition-nav').forEach(el=>el.style.visibility='hidden');snapshot.style.zIndex='37';snapshot.style.maxHeight=Math.max(0,innerHeight-parseFloat(snapshot.style.top))+'px';document.body.append(snapshot);snapshot.animate([{opacity:1},{opacity:0}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}).finished.catch(()=>{})}
 const targetVisibility=to.style.visibility;to.style.visibility='hidden';document.documentElement.dataset.gesture='active';operationsNav(opening?1:0,opening?0:1,duration);
 const scene={node,plane,body,base,origin,target:to,targetVisibility,trackedRear,backdrop:snapshot,sourceRect,destinationRect:destination};preciseCardScene=scene;
 scene.dispose=()=>{if(scene.disposed)return;scene.disposed=true;rearPlayback?.cancel();to.style.visibility=targetVisibility;const tracks=[...node.getAnimations({subtree:true}),...(snapshot?.getAnimations()||[])];node.remove();snapshot?.remove();for(const track of tracks)track.cancel();if(preciseCardScene===scene){preciseCardScene=null;if(!swipeLayers)delete document.documentElement.dataset.gesture;restoreOperationsNav()}};
 const planeMotion=reduceRear?null:plane.animate(planeFrames,{duration,easing:rear?'linear':landingEase,fill:'both'});scene.planeMotion=planeMotion;
 const motion=node.animate(reduce?[{opacity:0},{opacity:1}]:frames,{duration,easing:rear?'linear':landingEase,fill:'both'});scene.motion=motion;cardTransition=motion;
 // Collect after the caller adds its face/ink tracks; never discard a still-moving layer.
 Promise.resolve().then(()=>Promise.allSettled([rearPlayback?.finished,...[...node.getAnimations({subtree:true}),...(snapshot?.getAnimations()||[])].filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished)])).then(()=>requestAnimationFrame(()=>scene.dispose()));
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
