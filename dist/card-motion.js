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
 const readAngle=art=>{
  const angle=parseFloat(getComputedStyle(art).getPropertyValue('--card-yaw'))%360;
  return angle>0?angle-360:angle;
 };
 const measure=measureCardPose;
 measureCardPose=function(el){
  const pose=measure(el),number=el.querySelector('.card-printed-number');
  pose.printedOpacity=number?getComputedStyle(number).opacity:'1';
  if(el.matches('.expanded-card')){
   const art=el.querySelector('.bank-card');
   pose.returnAngle=readAngle(art);
   pose.returnPerspective=getComputedStyle(el).perspective;
   pose.shadow=getComputedStyle(art,'::before').boxShadow;
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
   if(!opening&&current.node.classList.contains('returning-rear'))current.node.querySelector('.card-holder')?.style.setProperty('display','none','important');
  }
  if(preciseCardScene?.body&&to){const surface=getComputedStyle(to);preciseCardScene.body.style.perspective=surface.perspective;preciseCardScene.body.style.perspectiveOrigin=surface.perspectiveOrigin}

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
  if(cardFlipped===wasFlipped)return;
  const previous=card._flipMotion;
  if(shouldReduceMotion()){previous?.cancel();return}

  const settled=cardFlipped?-180:0;
  const end=start<settled?settled-360:settled;
  const timing={duration:Math.min(640,Math.max(160,640*Math.abs(end-start)/180)),easing:'cubic-bezier(.4,0,.4,1)'};
  const rotation=art.animate([{'--card-yaw':`${start}deg`},{'--card-yaw':`${end}deg`}],{...timing,fill:'both'});
  card._flipMotion=rotation;
  previous?.cancel();
  const finish=()=>{
   if(card._flipMotion!==rotation)return;
   card._flipMotion=null;
   rotation.cancel();
  };
  rotation.finished.then(finish,finish);
 };
 document.querySelectorAll('.bank-card').forEach(prepare);
})();
