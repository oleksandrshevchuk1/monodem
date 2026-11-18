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
 const measure=measureCardPose;
 measureCardPose=function(el){const pose=measure(el),number=el.querySelector('.card-printed-number');pose.printedOpacity=number?getComputedStyle(number).opacity:'1';if(el.matches('.expanded-card')){
   const art=el.querySelector('.bank-card');
   pose.flipAngle=cardAngle(art);
   pose.cardPerspective=parseFloat(getComputedStyle(el).perspective);
  }return pose};
 const originalTransition=expandTransition;
 expandTransition=function(from,to,opening){
  if(!from||!to)return;
  const printedStart=preciseCardScene?.node?.querySelector('.card-printed-number');
  const printedOpacity=printedStart?getComputedStyle(printedStart).opacity:from.printedOpacity;
  prepare(to?.querySelector('.bank-card'));originalTransition(from,to,opening);
  const current=preciseCardScene;
  if(current&&!opening){current.carouselTrack=$('.card-track');current.carouselStartX=new DOMMatrixReadOnly(current.carouselTrack?getComputedStyle(current.carouselTrack).transform:undefined).m41}
  if(current&&to){
   const timing=current.motion.effect.getTiming(),number=current.node.querySelector('.card-printed-number'),targetNumber=to.querySelector('.card-printed-number');
   if(number&&targetNumber)number.animate([{opacity:printedOpacity??'1'},{opacity:getComputedStyle(targetNumber).opacity}],{duration:timing.duration,easing:timing.easing,fill:'both'});
   // The name was not visible on the starting rear face and is absent on the home card.
   if(!opening&&from.flipAngle>90)current.node.querySelector('.card-holder')?.style.setProperty('display','none','important');
  }

 };
 // A closing card remains part of the carousel until its final handoff.
 const moveSwipe=moveHomeSwipe;
 moveHomeSwipe=function(...args){const result=moveSwipe(...args),scene=preciseCardScene;if(scene?.carouselTrack?.isConnected){scene.swipeOffsetX=new DOMMatrixReadOnly(scene.carouselTrack.style.transform||undefined).m41-scene.carouselStartX;scene.node.style.translate=`${scene.swipeOffsetX}px 0px`}return result};
 const cleanupStrip=cleanupSwipe;cleanupSwipe=function(...args){const result=cleanupStrip(...args);if(preciseCardScene)document.documentElement.dataset.gesture='active';return result};
 function cardAngle(art){
  const transform=getComputedStyle(art).transform;
  if(transform==='none')return 0;
  return Math.acos(Math.max(-1,Math.min(1,new DOMMatrixReadOnly(transform).m11)))*180/Math.PI;
 }
 const flip=actions['flip-card'];
 actions['flip-card']=()=>{
  const card=$('#app .expanded-card');
  if(!card)return;
  const art=card.querySelector('.bank-card');
  const start=cardAngle(art),wasFlipped=cardFlipped;
  flip();
  if(cardFlipped===wasFlipped)return;

  card._flipMotion?.cancel();
  card.classList.remove('flipping');
  if(shouldReduceMotion())return;
  const end=cardFlipped?180:0;
  const duration=500*Math.abs(end-start)/180;
  if(duration<1)return;
  const timing={duration,easing:getComputedStyle(document.documentElement).getPropertyValue('--ease-in-out').trim(),fill:'both'};
  const turn=art.animate([{transform:`rotateY(${start}deg)`},{transform:`rotateY(${end}deg)`}],timing);
  const crossing=(90-start)/(end-start);
  const previousShadow=card.querySelector('.card-motion-shadow');
  const shadow=document.createElement('span');
  shadow.className='card-motion-shadow';
  shadow.style.boxShadow=previousShadow?.style.boxShadow||getComputedStyle(card).boxShadow;
  previousShadow?.remove();
  card.prepend(shadow);
  card.classList.add('flipping');
  // Keep the shadow fully hidden during the turn, then restore it as the face settles.
  const shade=shadow.animate([{offset:0,opacity:0},{offset:.88,opacity:0},{offset:1,opacity:1}],{...timing,easing:'linear'});
  const faces=['front','back'].map(side=>{
   const face=art.querySelector('.bank-card-'+side);
   const opacity=angle=>(angle>90)===(side==='back')?1:0;
   const final=opacity(end),initial=crossing<=0?final:opacity(start);
   const frames=[{offset:0,opacity:initial,easing:'steps(1,end)'}];
   if(crossing>0&&crossing<1)frames.push({offset:crossing,opacity:final});
   frames.push({offset:1,opacity:final});
   return face.animate(frames,timing);
  });
  const startTime=document.timeline.currentTime;
  if(startTime!==null)for(const motion of [turn,shade,...faces])motion.startTime=startTime;
  card._flipMotion=turn;
  const cleanup=()=>{
   shade.cancel();
   shadow.remove();
   for(const motion of faces)motion.cancel();
   if(card._flipMotion!==turn)return;
   card._flipMotion=null;
   card.classList.remove('flipping');
   turn.cancel();
  };
  turn.finished.then(cleanup,cleanup);
 };
 document.querySelectorAll('.bank-card').forEach(prepare);
})();
