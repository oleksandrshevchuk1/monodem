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
function cardPlaneBounds(matrix,width,height){
 const corners=[[0,0],[width,0],[0,height],[width,height]].map(([x,y])=>{const w=matrix.m14*x+matrix.m24*y+matrix.m44;return {x:(matrix.m11*x+matrix.m21*y+matrix.m41)/w,y:(matrix.m12*x+matrix.m22*y+matrix.m42)/w}});
 const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};
}
function paintedCardCorners(face){
 const markers=[[0,0],[100,0],[100,100],[0,100]].map(([left,top])=>{
  const marker=document.createElement('span');
  marker.style.cssText=`position:absolute;left:${left}%;top:${top}%;width:0;height:0;visibility:hidden;pointer-events:none`;
  face.append(marker);
  return marker;
 });
 const corners=markers.map(marker=>{
  const {x,y}=marker.getBoundingClientRect();
  return [x,y];
 });
 markers.forEach(marker=>marker.remove());
 return corners;
}
function projectCardCorners(corners,{x,y,width,height}){
 const [[ax,ay],[bx,by],[cx,cy],[dx,dy]]=corners.map(([left,top])=>[left-x,top-y]);
 const bxToC=bx-cx,dxToC=dx-cx,byToC=by-cy,dyToC=dy-cy;
 const skewX=ax-bx+cx-dx,skewY=ay-by+cy-dy;
 const divisor=bxToC*dyToC-dxToC*byToC;
 const horizontal=(skewX*dyToC-dxToC*skewY)/divisor;
 const vertical=(bxToC*skewY-skewX*byToC)/divisor;
 return `matrix3d(${[(bx-ax+horizontal*bx)/width,(by-ay+horizontal*by)/width,0,horizontal/width,(dx-ax+vertical*dx)/height,(dy-ay+vertical*dy)/height,0,vertical/height,0,0,1,0,ax,ay,0,1].join(',')})`;
}
function rearCloseProjection(sourceCorners,targetCorners,base,sourceWidth,duration){
 // Corner positions from distinct video frames, on a 195px-wide reference frame.
 const rearEdge=[[57,114],[37,90],[131,188],[151,212]];
 const frontEdge=[[37,90],[61,111],[155,209],[131,188]];
 const poses=[
  [0,sourceCorners,-180],
  [33,[[12,94],[159,48],[188,152],[41,200]],-180],
  [83,[[34,125],[121,48],[172,141],[77,211]],-180],
  [117,[[60,145],[84,54],[146,135],[109,216]],-180],
  [150,[[82,136],[53,70],[120,144],[137,215]],-180],
  [183,rearEdge,-180],
  [196,rearEdge,-180],
  [196,frontEdge,0],
  [217,[[24,112],[124,158],[169,206],[50,146]],0],
  [233,[[21,128],[145,168],[174,203],[29,166]],0],
  [283,[[24,143],[151,159],[184,200],[19,181]],0],
  [317,[[31,154],[158,159],[182,197],[18,193]],0],
  [383,[[37,155],[160,155],[181,194],[17,194]],0],
  [duration,targetCorners,0]
 ];
 const center=corners=>corners.reduce(([x,y],[left,top])=>[x+left/4,y+top/4],[0,0]);
 const [startX,startY]=center(sourceCorners),[endX,endY]=center(targetCorners);
 const scale=sourceWidth/180;
 const screenCorners=([time,corners])=>{
  if(time===0||time===duration)return corners;
  const offset=time/duration;
  return corners.map(([x,y])=>[
   startX+(endX-startX)*offset+(x-98)*scale,
   startY+(y-115)*scale+(endY-startY-60*scale)*offset
  ]);
 };
 const keyframe=(time,corners,yaw)=>({
  offset:time/duration,transform:projectCardCorners(corners,base),
  '--card-yaw':`${yaw}deg`,easing:'steps(1,end)'
 });
 const frames=[];
 for(let i=1;i<poses.length;i++){
  const previous=poses[i-1],next=poses[i],elapsed=next[0]-previous[0];
  if(!elapsed)continue;
  const start=screenCorners(previous),end=screenCorners(next);
  // Interpolate screen corners before projection. Matrix decomposition bends the edge.
  const steps=Math.ceil(elapsed/(1000/120));
  for(let step=0;step<steps;step++){
   const fraction=step/steps;
   const corners=start.map(([x,y],index)=>[x+(end[index][0]-x)*fraction,y+(end[index][1]-y)*fraction]);
   frames.push(keyframe(previous[0]+elapsed*fraction,corners,previous[2]));
  }
 }
 frames.push(keyframe(duration,targetCorners,0));
 return frames;
}
expandTransition=function(from,to,opening){
 if(!from||!to)return;
 let sourceShadow=from.shadow,shadowWidth=from.geometry.width,materialStart=from.materialOpacity,faceShadowStart=from.faceShadow;
 const previous=preciseCardScene,geometry=stableCardGeometry(to),reduce=shouldReduceMotion(),duration=reduce?100:460;
 const returnAngle=(!opening&&!previous&&!reduce)?(from.returnAngle||0):0;
 const rear=returnAngle < -90 && returnAngle > -270;
 const projectedRear=rear&&from.rearCorners;
 const returnEnd=returnAngle < -90?-360:0;
 const travelEasing=returnAngle?'cubic-bezier(.35,.5,.45,1)':'cubic-bezier(.32,.72,0,1)';
 const source=from.geometry,width=geometry.width,height=geometry.height,base={x:geometry.layout.x,y:geometry.layout.y,width,height};
 const origin=geometry.origin,originMatrix=new DOMMatrix().translate(origin[0],origin[1]);
 let sourceLayout=source.layout,startRelative=new DOMMatrix().translate(source.origin[0],source.origin[1]).multiply(new DOMMatrix(source.raw)).translate(-source.origin[0],-source.origin[1]).scale(source.width/width,source.height/height);
 const endRelative=originMatrix.multiply(new DOMMatrix(geometry.raw)).translate(-origin[0],-origin[1]);
 if(previous){faceShadowStart=getComputedStyle(previous.node.querySelector('.bank-card-front')).boxShadow;const oldMaterial=previous.node.querySelector('.card-material');if(oldMaterial)materialStart=getComputedStyle(oldMaterial).opacity;const oldBodyStyle=getComputedStyle(previous.body);sourceShadow=oldBodyStyle.boxShadow;shadowWidth=previous.base.width;const oldOrigin=previous.origin;sourceLayout=previous.base;startRelative=new DOMMatrix().translate(previous.swipeOffsetX||0,0).multiply(new DOMMatrixReadOnly(getComputedStyle(previous.node).transform)).translate(oldOrigin[0],oldOrigin[1]).multiply(new DOMMatrixReadOnly(getComputedStyle(previous.plane).transform)).rotate(parseFloat(oldBodyStyle.rotate)||0).multiply(new DOMMatrixReadOnly(oldBodyStyle.transform)).translate(-oldOrigin[0],-oldOrigin[1]).scale(previous.base.width/width,previous.base.height/height);previous.dispose()}
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
 const frames=[{transform:new DOMMatrix().translate(sourceLayout.x-base.x,sourceLayout.y-base.y).toString()},{transform:new DOMMatrix().toString()}];
 node.style.transform=frames[reduce?1:0].transform;plane.style.transform=planeFrames[reduce?1:0].transform;
 const targetArtStyle=getComputedStyle(to.querySelector('.bank-card')),targetRadius=targetArtStyle.borderTopLeftRadius;
 // Keep the same projected corner size when replacing the live card with the moving plane.
 art.style.borderRadius=targetRadius;
 if(!projectedRear)art.animate([{borderRadius:((from.cornerRadius||parseFloat(targetRadius))*width/source.width)+'px'},{borderRadius:targetRadius}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 plane.style.borderRadius=targetRadius;
 if(!projectedRear)plane.animate([{borderRadius:((from.cornerRadius||parseFloat(targetRadius))*width/source.width)+'px'},{borderRadius:targetRadius}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 const targetShadow=to.matches('.expanded-card')?getComputedStyle(to.querySelector('.bank-card'),'::before').boxShadow:getComputedStyle(to).boxShadow;
 const shadowStart=(sourceShadow||targetShadow).replace(/(-?(?:\d*\.)?\d+)px/g,(_,value)=>(Number(value)*width/shadowWidth)+'px');
 if(projectedRear){
  const shadows=[
   [shadowStart,[{opacity:1},{offset:.14,opacity:0},{opacity:0}]],
   [targetShadow,[{opacity:0},{offset:.73,opacity:0},{opacity:1}]]
  ];
  for(const [shadow,keyframes] of shadows){
   const layer=document.createElement('span');
   layer.className='projected-card-shadow';
   layer.style.boxShadow=shadow;
   body.prepend(layer);
   layer.animate(keyframes,{duration,fill:'both'});
  }
 }else body.animate([{boxShadow:shadowStart},{boxShadow:targetShadow}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 const front=art.querySelector('.bank-card-front'),targetFront=to.querySelector('.bank-card-front');
 if(front&&targetFront){const targetShadow=getComputedStyle(targetFront).boxShadow;front.style.boxShadow=targetShadow;front.animate([{boxShadow:faceShadowStart||'none'},{boxShadow:targetShadow}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})}
 const material=art.querySelector('.card-material'),targetMaterial=to.querySelector('.card-material');
 if(material&&targetMaterial)material.animate([{opacity:materialStart??getComputedStyle(targetMaterial).opacity},{opacity:getComputedStyle(targetMaterial).opacity}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 const reflection=art.querySelector('.card-glint'),targetReflection=to.querySelector('.card-glint');
 if(reflection&&targetReflection&&from.glint){const targetStyle=getComputedStyle(targetReflection);reflection.animate([from.glint,{opacity:targetStyle.opacity,transform:targetStyle.transform}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})}
 node.classList.toggle('returning-rear',rear);
 let projectionFrames;
 if(projectedRear){
  node.classList.add('projected-rear-close');
  plane.style.transformOrigin='0 0';
  projectionFrames=rearCloseProjection(from.rearCorners,paintedCardCorners(targetFront),base,source.width,duration);
  plane.style.transform=projectionFrames[0].transform;
  plane.style.setProperty('--card-yaw','-180deg');
  node.style.transform='none';
 }
 // Follow the diagonal turn in the recording as the card descends into the carousel.
 let rotation=null;
 if(returnAngle&&!projectedRear){
  const perspective=parseFloat(from.returnPerspective)||1000;
  body.classList.add('turning-card-body');
  body.style.setProperty('--card-turn-perspective',`${perspective*width/source.width}px`);
  // The fixed scene and the carousel round their projected coordinates independently.
  body.style.setProperty('--card-yaw',`${returnEnd}deg`);
  node.style.transform=frames[1].transform;
  plane.style.transform=planeFrames[1].transform;
  const movingRect=front.getBoundingClientRect(),targetRect=targetFront.getBoundingClientRect();
  frames[1].transform=new DOMMatrix().translate(targetRect.x-movingRect.x,targetRect.y-movingRect.y).toString();
  node.style.transform=frames[0].transform;
  plane.style.transform=planeFrames[0].transform;
  body.style.removeProperty('--card-yaw');
  rotation=body.animate([{'--card-yaw':`${returnAngle}deg`},{'--card-yaw':`${returnEnd}deg`}],{duration,easing:travelEasing,fill:'both'});
 }
 if(rear&&!projectedRear){
  const roll=Math.min(1,(Math.min(-returnAngle,360+returnAngle)-90)/45);
  body.animate([
   {rotate:'0deg',easing:'cubic-bezier(.23,1,.32,1)'},
   {offset:.16,rotate:`${-50*roll}deg`},
   {offset:.35,rotate:`${-45*roll}deg`},
   {offset:.63,rotate:`${-13*roll}deg`,easing:'ease-out'},
   {rotate:'0deg'}
  ],{duration,fill:'both'});
 }
 const snapshot=from.snapshot;if(snapshot){snapshot.querySelectorAll('.card-face,.expanded-card,.card-header-mini,.transition-nav').forEach(el=>el.style.visibility='hidden');snapshot.style.zIndex='37';document.body.append(snapshot);snapshot.animate([{opacity:1},{opacity:0}],{duration,easing:travelEasing,fill:'both'}).finished.catch(()=>{})}
 const targetVisibility=to.style.visibility;to.style.visibility='hidden';document.documentElement.dataset.gesture='active';operationsNav(opening?1:0,opening?0:1,duration);
 const settings=$('.card-settings');if(opening&&settings)for(const child of settings.children)if(!child.matches('.expanded-card'))child.animate([{opacity:0,transform:'translate3d(0,12px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration,easing:'cubic-bezier(.32,.72,0,1)'});
 const scene={node,plane,body,base,origin:projectedRear?[0,0]:origin,target:to,targetVisibility,backdrop:snapshot,sourceRect,destinationRect:destination,rotation};preciseCardScene=scene;
 scene.dispose=()=>{if(scene.disposed)return;scene.disposed=true;to.style.visibility=targetVisibility;const tracks=[...node.getAnimations({subtree:true}),...(snapshot?.getAnimations()||[])];node.remove();snapshot?.remove();for(const track of tracks)track.cancel();if(preciseCardScene===scene){preciseCardScene=null;if(!swipeLayers)delete document.documentElement.dataset.gesture;restoreOperationsNav()}};
 const planeMotion=reduce?null:plane.animate(projectionFrames||planeFrames,{duration,easing:projectedRear?'linear':travelEasing,fill:'both'});scene.planeMotion=planeMotion;
 const motion=projectedRear?planeMotion:node.animate(reduce?[{opacity:0},{opacity:1}]:frames,{duration,easing:travelEasing,fill:'both'});scene.motion=motion;cardTransition=motion;
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
