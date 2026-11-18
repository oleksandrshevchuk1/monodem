'use strict';

// Preserve the original motion; isolate only the printed ink from the material layer.
(() => {
 const prepare=art=>{
  const front=art?.querySelector('.bank-card-front');
  if(!front||front.querySelector(':scope>.card-face-ink'))return;
  const ink=document.createElement('span');ink.className='card-face-ink';
  for(const child of [...front.children])if(!child.matches('.card-material,.card-glint'))ink.append(child);
  front.append(ink);
 };
 const artwork=cardArtwork;
 cardArtwork=function(card){const template=document.createElement('template');template.innerHTML=artwork(card);prepare(template.content.querySelector('.bank-card'));return template.innerHTML};
 const renderBeforeInk=render;
 render=function(){renderBeforeInk();document.querySelectorAll('.bank-card').forEach(prepare);const scene=preciseCardScene;queueMicrotask(()=>{if(scene===preciseCardScene&&!scene?.target.isConnected)scene?.dispose()})};
 const selectFaces=(art,backFirst,timing,switchAt)=>['front','back'].map(side=>{
  const initial=(side==='back')===backFirst?'visible':'hidden',final=initial==='visible'?'hidden':'visible';
  const face=art.querySelector('.bank-card-'+side);
  const frames=switchAt===null
   ?[{visibility:initial},{visibility:initial}]
   :[{offset:0,visibility:initial,easing:'steps(1,end)'},{offset:switchAt,visibility:final},{offset:1,visibility:final}];
  return face.animate(frames,{...timing,fill:'both'});
 });
 const readAngle=art=>{
  const matrix=new DOMMatrixReadOnly(getComputedStyle(art).transform);
  return Math.min(180,Math.abs(Math.atan2(matrix.m13,matrix.m11)*180/Math.PI));
 };
 const measure=measureCardPose;
 measureCardPose=function(el){
  const pose=measure(el),number=el.querySelector('.card-printed-number');
  pose.printedOpacity=number?getComputedStyle(number).opacity:'1';
  if(el.matches('.expanded-card')){
   pose.returnAngle=readAngle(el.querySelector('.bank-card'));
   pose.returnPerspective=getComputedStyle(el).perspective;
  }
  return pose;
 };
 const originalTransition=expandTransition;
 expandTransition=function(from,to,opening){
  if(!from||!to)return;
  const printedStart=preciseCardScene?.node?.querySelector('.card-printed-number');
  const printedOpacity=printedStart?getComputedStyle(printedStart).opacity:from.printedOpacity;
  prepare(to?.querySelector('.bank-card'));originalTransition(from,to,opening);
  const current=preciseCardScene;
  if(current&&!opening){current.carouselTrack=$('.card-track');current.carouselStartX=new DOMMatrixReadOnly(current.carouselTrack?getComputedStyle(current.carouselTrack).transform:undefined).m41}
  if(current&&to){
   for(const motion of current.body.getAnimations())if(motion.effect.getKeyframes().some(frame=>'boxShadow' in frame))motion.effect.updateTiming({easing:'linear'});
   const timing=current.motion.effect.getTiming(),number=current.node.querySelector('.card-printed-number'),targetNumber=to.querySelector('.card-printed-number');
   if(number&&targetNumber)number.animate([{opacity:printedOpacity??'1'},{opacity:getComputedStyle(targetNumber).opacity}],{duration:timing.duration,easing:timing.easing,fill:'both'});
   // The name was not visible on the starting rear face and is absent on the home card.
   if(!opening&&from.returnAngle>90)current.node.querySelector('.card-holder')?.style.setProperty('display','none','important');
  }
  if(preciseCardScene?.body&&to){const surface=getComputedStyle(to);preciseCardScene.body.style.perspective=surface.perspective;preciseCardScene.body.style.perspectiveOrigin=surface.perspectiveOrigin}
  if(current?.faceSwitch){
   const {rotation}=current,timing=rotation.effect.getTiming();
   selectFaces(current.node.querySelector('.bank-card'),true,timing,current.faceSwitch);
  }
 };
 // A closing card remains part of the carousel until its final handoff.
 const moveSwipe=moveHomeSwipe;
 moveHomeSwipe=function(...args){const result=moveSwipe(...args),scene=preciseCardScene;if(scene?.carouselTrack?.isConnected){scene.swipeOffsetX=new DOMMatrixReadOnly(scene.carouselTrack.style.transform||undefined).m41-scene.carouselStartX;scene.node.style.translate=`${scene.swipeOffsetX}px 0px`}return result};
 const cleanupStrip=cleanupSwipe;cleanupSwipe=function(...args){const result=cleanupStrip(...args);if(preciseCardScene)document.documentElement.dataset.gesture='active';return result};
 const originalFlip=actions['flip-card'];
 actions['flip-card']=()=>{
  const card=$('.expanded-card');if(!card)return;
  const art=card.querySelector('.bank-card'),start=readAngle(art),wasFlipped=cardFlipped;
  originalFlip();
  if(cardFlipped===wasFlipped||shouldReduceMotion())return;

  const end=cardFlipped?180:0,backFirst=start>90;
  const switchAt=backFirst===cardFlipped?null:(90-start)/(end-start);
  const timing={duration:Math.max(160,640*Math.abs(end-start)/180),easing:'cubic-bezier(.4,0,.4,1)'};
  const previous=card._flipMotion,previousFaces=card._inkFaces;
  card.classList.add('flipping');
  const rotation=art.animate([{transform:`rotateY(${start}deg)`},{transform:`rotateY(${end}deg)`}],{...timing,fill:'both'});
  const faces=selectFaces(art,backFirst,timing,switchAt);
  card._flipMotion=rotation;
  card._inkFaces=faces;
  previous?.cancel();
  previousFaces?.forEach(face=>face.cancel());
  const finish=()=>{
   if(card._flipMotion!==rotation)return;
   card._flipMotion=null;
   card._inkFaces=null;
   card.classList.remove('flipping');
   faces.forEach(face=>face.cancel());
   rotation.cancel();
  };
  rotation.finished.then(finish,finish);
 };
 document.querySelectorAll('.bank-card').forEach(prepare);
})();
