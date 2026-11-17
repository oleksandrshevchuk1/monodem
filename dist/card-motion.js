'use strict';

// Move the live button. Its artwork and shadow never hand off to a second card.
(() => {
 let active=null;
 const quad=el=>{
  const points=[];
  for(const [left,top] of [[0,0],[100,0],[100,100],[0,100]]){
   const marker=document.createElement('span');
   marker.style.cssText=`position:absolute;left:${left}%;top:${top}%;width:0;height:0;transform:none;pointer-events:none;visibility:hidden`;
   el.append(marker);const rect=marker.getBoundingClientRect();points.push({x:rect.x,y:rect.y});marker.remove();
  }
  return points;
 };
 const angle=art=>{const flip=art._cardFlip;if(!flip)return cardFlipped?180:0;const p=flip.motion.effect.getComputedTiming().progress??1;return flip.from+(flip.to-flip.from)*p};
 const measure=measureCardPose;
 measureCardPose=function(el){
  const pose=measure(el),art=el.querySelector('.bank-card');
  pose.art=art;pose.quad=quad(el);pose.faceQuad=quad(art.querySelector('.bank-card-front'));pose.angle=el.classList.contains('expanded-card')?angle(art):0;
  pose.ink={};
  for(const [key,selector] of [['full','.card-number-full'],['masked','.card-number-masked'],['holder','.card-holder']]){
   const ink=el.querySelector(selector),style=ink&&getComputedStyle(ink);pose.ink[key]=style&&style.display!=='none'?Number(style.opacity):0;
  }
  return pose;
 };
 // Map the painted corners, including the existing native perspective.
 function matrix(points,width,height,base){
  const [p0,p1,p2,p3]=points.map(p=>({x:p.x-base.x,y:p.y-base.y}));
  const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
  const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
  const denominator=dx1*dy2-dx2*dy1;
  const g=Math.abs(denominator)>1e-9?(dx3*dy2-dx2*dy3)/denominator:0;
  const h=Math.abs(denominator)>1e-9?(dx1*dy3-dx3*dy1)/denominator:0;
  return `matrix3d(${[(p1.x-p0.x+g*p1.x)/width,(p1.y-p0.y+g*p1.y)/width,0,g/width,(p3.x-p0.x+h*p3.x)/height,(p3.y-p0.y+h*p3.y)/height,0,h/height,0,0,1,0,p0.x,p0.y,0,1].join(',')})`;
 }
 // Keep the established 3D return from the reverse side.
 const reverseTransition=function(from,to,opening){
 if(!from||!to)return;
 let sourceShadow=from.shadow,shadowWidth=from.geometry.width,materialStart=from.materialOpacity,faceShadowStart=from.faceShadow;
 const previous=preciseCardScene,geometry=stableCardGeometry(to),reduce=shouldReduceMotion(),duration=reduce?100:460;
 const source=from.geometry,width=geometry.width,height=geometry.height,base={x:geometry.layout.x,y:geometry.layout.y,width,height};
 const origin=geometry.origin,originMatrix=new DOMMatrix().translate(origin[0],origin[1]);
 let sourceLayout=source.layout,startRelative=new DOMMatrix().translate(source.origin[0],source.origin[1]).multiply(new DOMMatrix(source.raw)).translate(-source.origin[0],-source.origin[1]).scale(source.width/width,source.height/height);
 const endRelative=originMatrix.multiply(new DOMMatrix(geometry.raw)).translate(-origin[0],-origin[1]);
 if(previous){faceShadowStart=getComputedStyle(previous.node.querySelector('.bank-card-front')).boxShadow;const oldMaterial=previous.node.querySelector('.card-material');if(oldMaterial)materialStart=getComputedStyle(oldMaterial).opacity;sourceShadow=getComputedStyle(previous.body).boxShadow;shadowWidth=previous.base.width;const oldOrigin=previous.origin;sourceLayout=previous.base;startRelative=new DOMMatrixReadOnly(getComputedStyle(previous.node).transform).translate(oldOrigin[0],oldOrigin[1]).multiply(new DOMMatrixReadOnly(getComputedStyle(previous.plane).transform)).multiply(new DOMMatrixReadOnly(getComputedStyle(previous.body).transform)).translate(-oldOrigin[0],-oldOrigin[1]).scale(previous.base.width/width,previous.base.height/height);previous.motion.cancel();previous.planeMotion.cancel();previous.target.style.opacity='';previous.node.remove();previous.backdrop?.remove()}
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
 node.style.transform=frames[0].transform;plane.style.transform=planeFrames[0].transform;
 const targetArtStyle=getComputedStyle(to.querySelector('.bank-card')),targetRadius=targetArtStyle.borderTopLeftRadius;
 // Keep the same projected corner size when replacing the live card with the moving plane.
 art.style.borderRadius=targetRadius;
 art.animate([{borderRadius:((from.cornerRadius||parseFloat(targetRadius))*width/source.width)+'px'},{borderRadius:targetRadius}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 plane.style.borderRadius=targetRadius;
 plane.animate([{borderRadius:((from.cornerRadius||parseFloat(targetRadius))*width/source.width)+'px'},{borderRadius:targetRadius}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 const shadowStart=(sourceShadow||getComputedStyle(to).boxShadow).replace(/(-?(?:\d*\.)?\d+)px/g,(_,value)=>(Number(value)*width/shadowWidth)+'px');
 body.animate([{boxShadow:shadowStart},{boxShadow:getComputedStyle(to).boxShadow}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 const front=art.querySelector('.bank-card-front'),targetFront=to.querySelector('.bank-card-front');
 if(front&&targetFront){const targetShadow=getComputedStyle(targetFront).boxShadow;front.style.boxShadow=targetShadow;front.animate([{boxShadow:faceShadowStart||'none'},{boxShadow:targetShadow}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})}
 const material=art.querySelector('.card-material'),targetMaterial=to.querySelector('.card-material');
 if(material&&targetMaterial)material.animate([{opacity:materialStart??getComputedStyle(targetMaterial).opacity},{opacity:getComputedStyle(targetMaterial).opacity}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 const reflection=art.querySelector('.card-glint'),targetReflection=to.querySelector('.card-glint');
 if(reflection&&targetReflection&&from.glint){const targetStyle=getComputedStyle(targetReflection);reflection.animate([from.glint,{opacity:targetStyle.opacity,transform:targetStyle.transform}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})}
 const rear=!opening&&from.flipped&&!previous;node.classList.toggle('returning-rear',rear);
 if(rear)body.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(360deg)'}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
 const snapshot=from.snapshot;if(snapshot){snapshot.querySelectorAll('.card-face,.expanded-card,.card-header-mini,.transition-nav').forEach(el=>el.style.visibility='hidden');snapshot.style.zIndex='37';document.body.append(snapshot);snapshot.animate([{opacity:1},{opacity:0}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}).finished.catch(()=>{})}
 to.style.opacity='0';document.documentElement.dataset.gesture='active';operationsNav(opening?1:0,opening?0:1,duration);
 const settings=$('.card-settings');if(opening&&settings)for(const child of settings.children)if(!child.matches('.expanded-card'))child.animate([{opacity:0,transform:'translate3d(0,12px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration,easing:'cubic-bezier(.32,.72,0,1)'});
 const scene={node,plane,body,base,origin,target:to,backdrop:snapshot,sourceRect,destinationRect:destination};preciseCardScene=scene;
 const planeMotion=plane.animate(planeFrames,{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});scene.planeMotion=planeMotion;
 const motion=node.animate(reduce?[{opacity:0},{opacity:1}]:frames,{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});scene.motion=motion;cardTransition=motion;
 motion.finished.then(()=>{if(preciseCardScene!==scene)return;to.style.opacity='';node.remove();snapshot?.remove();preciseCardScene=null;delete document.documentElement.dataset.gesture;restoreOperationsNav()}).catch(()=>{});
};

 expandTransition=function(from,to,opening){
  if(!from?.quad||!to)return;
  if((!opening&&from.flipped)||(!active&&preciseCardScene))return reverseTransition(from,to,opening);
  active?.cancel();
  // Keep the already decoded artwork, including both faces, across navigation.
  // The retained home button receives only a placeholder; it never becomes visible.
  const sourceArt=from.art;
  if(sourceArt&&sourceArt!==to.querySelector('.bank-card')){
   sourceArt._cardFlip?.motion.cancel();sourceArt._cardFlip=null;
   sourceArt.parentElement?.replaceChild(sourceArt.cloneNode(true),sourceArt);
   to.replaceChildren(sourceArt);
  }
  const reduce=shouldReduceMotion(),duration=reduce?100:500;
  const easing=getComputedStyle(document.documentElement).getPropertyValue('--ease-drawer').trim();
  const sourceQuad=Math.abs(from.angle)>.01?from.quad:from.faceQuad;
  const destination=quad(to.querySelector('.bank-card-front')),targetStyle=getComputedStyle(to),shadow=targetStyle.boxShadow;
  const animations=[],restores=[];
  const set=(el,name,value,priority='')=>{const old=el.style.getPropertyValue(name),oldPriority=el.style.getPropertyPriority(name);restores.push(()=>old?el.style.setProperty(name,old,oldPriority):el.style.removeProperty(name));el.style.setProperty(name,value,priority)};
  const animate=(el,frames)=>{const motion=el.animate(frames,{duration,easing,fill:'both'});animations.push(motion);return motion};
  set(to,'transition','none','important');set(to,'transform','none');set(to,'transform-origin','0 0','important');
  const base=to.getBoundingClientRect(),width=base.width,height=base.height;
  const art=to.querySelector('.bank-card'),material=art.querySelector('.card-material');
  set(art.querySelector('.bank-card-front'),'transform','translateZ(0)');
  const number=art.querySelector('.card-printed-number');
  if(number)set(number,'width',getComputedStyle(number).width);
  for(const [key,selector,end] of [['full','.card-number-full',opening?1:0],['masked','.card-number-masked',opening?0:1],['holder','.card-holder',opening?1:0]]){
   const ink=art.querySelector(selector);if(!ink)continue;
   set(ink,'display','block');if(key==='masked'){set(ink,'position','absolute');set(ink,'left','0');set(ink,'top','0')}
   animate(ink,[{opacity:from.ink[key]},{opacity:end}]);
  }
  if(material)animate(material,[{opacity:from.materialOpacity},{opacity:getComputedStyle(material).opacity}]);
  const initialShadow=from.shadow.replace(/(-?(?:\d*\.)?\d+)px/g,(_,n)=>Number(n)*width/from.geometry.width+'px');
  const radius=getComputedStyle(to).borderRadius,artRadius=getComputedStyle(art).borderRadius;
  const initialRadius=from.cornerRadius*width/from.geometry.width+'px';
  animate(to,[{boxShadow:initialShadow,borderRadius:initialRadius},{boxShadow:shadow,borderRadius:radius}]);
  animate(art,[{borderRadius:initialRadius},{borderRadius:artRadius}]);
  if(!opening&&Math.abs(from.angle)>.01){
   for(const face of art.querySelectorAll('.bank-card-front,.bank-card-back'))set(face,'visibility','visible');
   set(art,'transition','none');
   animate(art,[{transform:`rotateY(${from.angle}deg)`},{transform:`rotateY(${from.angle>90?360:0}deg)`}]);
  }
  const screen=$('#screen'),snapshot=from.snapshot;
  set(screen,'position','relative');set(screen,'z-index','1');
  if(snapshot){snapshot.querySelectorAll('.card-face,.expanded-card,.card-header-mini,.transition-nav').forEach(el=>el.style.visibility='hidden');snapshot.style.zIndex='0';$('#app').append(snapshot);animate(snapshot,[{opacity:1},{opacity:0}])}
  for(let branch=to;branch&&branch!==screen;branch=branch.parentElement){
   for(const sibling of branch.parentElement?.children||[])if(sibling!==branch){const opacity=getComputedStyle(sibling).opacity;if(Number(opacity)>0)animate(sibling,[{opacity:0},{opacity}])}
  }
  set(to,'pointer-events','none');
  const count=reduce?2:61;
  const keyframes=Array.from({length:count},(_,i)=>{const p=reduce?1:i/(count-1);const points=sourceQuad.map((point,j)=>({x:point.x+(destination[j].x-point.x)*p,y:point.y+(destination[j].y-point.y)*p}));return {offset:i/(count-1),transform:matrix(points,width,height,base)}});
  // Each sampled plane is composited by the browser, independent of JavaScript frames.
  const clock=animate(to,keyframes);
  const scene={target:to,node:to,motion:clock,animations,sourceQuad,destinationQuad:destination,base,cancel(){for(const motion of animations)motion.cancel();for(const restore of restores.splice(0).reverse())restore();snapshot?.remove()}};
  active=scene;preciseCardScene=scene;cardTransition=clock;
  const startedAt=document.timeline.currentTime;for(const motion of animations)motion.startTime=startedAt;
  document.documentElement.dataset.gesture='active';operationsNav(opening?1:0,opening?0:1,duration);
  clock.finished.then(()=>{if(active!==scene)return;scene.cancel();active=null;preciseCardScene=null;delete document.documentElement.dataset.gesture;restoreOperationsNav()}).catch(()=>{});
 };

 // One continuous face rotation; the physical shadow stays present throughout.
 actions['flip-card']=()=>{
  const card=$('.expanded-card');if(!card||active)return;
  const art=card.querySelector('.bank-card'),start=angle(art),wasFlipped=cardFlipped;
  card._flipMotion?.cancel();card._shadowMotion?.cancel();art.style.transition='none';card.classList.add('flipping');
  flipBeforeSettledFaces();
  if(wasFlipped===cardFlipped){art.style.transition='';card.classList.remove('flipping');return}
  const end=cardFlipped?180:0;
  const motion=art.animate([{transform:`rotateY(${start}deg)`},{transform:`rotateY(${end}deg)`}],{duration:shouldReduceMotion()?100:500,easing:getComputedStyle(document.documentElement).getPropertyValue('--ease-in-out').trim(),fill:'both'});
  art._cardFlip={from:start,to:end,motion};card._flipMotion=motion;
  motion.finished.then(()=>{if(card._flipMotion!==motion)return;motion.cancel();art._cardFlip=null;card._flipMotion=null;art.style.transition='';card.classList.remove('flipping')}).catch(()=>{});
 };
})();
