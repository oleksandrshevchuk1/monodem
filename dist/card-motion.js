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
 const selectFaces=(art,backFirst,timing)=>['front','back'].map(side=>{
  const initial=(side==='back')===backFirst?'visible':'hidden',final=initial==='visible'?'hidden':'visible';
  const face=art.querySelector('.bank-card-'+side),token={};
  face._inkCullBase??={back:face.style.backfaceVisibility,webkit:face.style.webkitBackfaceVisibility};face._inkCullToken=token;
  face.style.backfaceVisibility=face.style.webkitBackfaceVisibility='visible';
  const motion=face.animate([{offset:0,visibility:initial,easing:'steps(1,end)'},{offset:.5,visibility:final},{offset:1,visibility:final}],{...timing,fill:'both'});
  const restore=()=>{if(face._inkCullToken!==token)return;face.style.backfaceVisibility=face._inkCullBase.back;face.style.webkitBackfaceVisibility=face._inkCullBase.webkit;delete face._inkCullBase;delete face._inkCullToken};
  motion.finished.then(restore,restore);return motion;
 });
 const measure=measureCardPose;
 measureCardPose=function(el){const pose=measure(el),number=el.querySelector('.card-printed-number');pose.printedOpacity=number?getComputedStyle(number).opacity:'1';if(pose.flipped)pose.cardPerspective=parseFloat(getComputedStyle(el).perspective);return pose};
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
   if(!opening&&from.flipped)current.node.querySelector('.card-holder')?.style.setProperty('display','none','important');
  }
  if(preciseCardScene?.body&&to){const surface=getComputedStyle(to);preciseCardScene.body.style.perspective=surface.perspective;preciseCardScene.body.style.perspectiveOrigin=surface.perspectiveOrigin}
 };
 // A closing card remains part of the carousel until its final handoff.
 const moveSwipe=moveHomeSwipe;
 moveHomeSwipe=function(...args){const result=moveSwipe(...args),scene=preciseCardScene;if(scene?.carouselTrack?.isConnected){scene.swipeOffsetX=new DOMMatrixReadOnly(scene.carouselTrack.style.transform||undefined).m41-scene.carouselStartX;scene.node.style.translate=`${scene.swipeOffsetX}px 0px`}return result};
 const cleanupStrip=cleanupSwipe;cleanupSwipe=function(...args){const result=cleanupStrip(...args);if(preciseCardScene)document.documentElement.dataset.gesture='active';return result};
 const originalFlip=actions['flip-card'];
 actions['flip-card']=()=>{
  const card=$('.expanded-card'),shadow=card&&getComputedStyle(card).boxShadow,backFirst=cardFlipped;
  card?._inkFaces?.forEach(a=>a.cancel());originalFlip();
  // Keep the full original rotation, without its unrelated shadow brightness pulse.
  if(card){card._shadowMotion?.cancel();card._shadowMotion=null;if(shadow)card.style.boxShadow=shadow;if(cardFlipped!==backFirst&&card._flipMotion){const motion=card._flipMotion,timing=motion.effect.getTiming(),faces=selectFaces(card.querySelector('.bank-card'),backFirst,{duration:timing.duration,easing:timing.easing});card._inkFaces=faces;motion.ready.then(()=>faces.forEach(a=>a.startTime=motion.startTime)).catch(()=>{});motion.finished.then(()=>faces.forEach(a=>a.cancel()),()=>faces.forEach(a=>a.cancel()))}}
 };
 document.querySelectorAll('.bank-card').forEach(prepare);
})();
