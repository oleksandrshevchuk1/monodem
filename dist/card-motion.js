'use strict';

const cardTurnEase = 'ease';

function animateCardFaces(art,start,end,perspective,timing){
 // Keep the painted faces on the same perspective axis and exchange them edge-on.
  const crossing=(90-start)/(end-start);
  return ['front','back'].map((side,index)=>{
   const face=art.querySelector('.bank-card-'+side);
   const pose=angle=>{
    const yaw=index?Math.max(90,angle)-180:Math.min(90,angle);
    return `perspective(${perspective}px) rotateY(${yaw}deg)`;
   };
   const opacity=angle=>Math.max(0,Math.min(1,(index?angle-90:90-angle)));
   const frames=[{offset:0,transform:pose(start),opacity:opacity(start)}];
   const edge=index?91:89;
   const nearEdge=(edge-start)/(end-start);
   if(nearEdge>0&&nearEdge<crossing)frames.push({offset:nearEdge,transform:pose(edge),opacity:1});
   if(crossing>0&&crossing<1)frames.push({offset:crossing,transform:pose(90),opacity:0});
   if(nearEdge>crossing&&nearEdge>0&&nearEdge<1)frames.push({offset:nearEdge,transform:pose(edge),opacity:1});
   frames.push({offset:1,transform:pose(end),opacity:opacity(end)});
   return face.animate(frames,timing);
  });
}

// Keep the front artwork together on one painted surface.
(() => {
 const prepare=art=>{
  const front=art?.querySelector('.bank-card-front');
  if(!front||front.querySelector(':scope>.card-face-ink'))return;
  const ink=document.createElement('span');ink.className='card-face-ink';
  for(const child of [...front.children])if(!child.matches('.card-material,.card-glint'))ink.append(child);
  for(const mark of ink.querySelectorAll('.card-brand,.visa')){
   const image=mark.querySelector('img');
   if(!image)continue;
   mark.style.backgroundImage=`url("${image.src}")`;
   mark.setAttribute('role','img');
   mark.setAttribute('aria-label',image.alt);
   image.remove();
  }
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
  const angle=side=>{
   const transform=getComputedStyle(art.querySelector('.bank-card-'+side)).transform;
   const cosine=transform==='none'?1:new DOMMatrixReadOnly(transform).m11;
   return Math.acos(Math.max(0,Math.min(1,cosine)))*180/Math.PI;
  };
  const front=angle('front');
  return front<89.999?front:180-angle('back');
 }
 const flip=actions['flip-card'];
 actions['flip-card']=()=>{
  const card=$('#app .expanded-card');
  if(!card)return;
  const art=card.querySelector('.bank-card');
  const start=cardAngle(art),wasFlipped=cardFlipped;
  flip();
  if(cardFlipped===wasFlipped)return;

  card._flipMotion?.forEach(motion=>motion.cancel());
  card.classList.remove('flipping');
  if(shouldReduceMotion())return;
  const end=cardFlipped?180:0;
  const duration=600*Math.abs(end-start)/180;
  if(duration<1)return;
  const timing={duration,easing:cardTurnEase,fill:'both'};
  const faces=animateCardFaces(art,start,end,1000,timing);
  const previousShadow=card.querySelector('.card-motion-shadow');
  const shadow=document.createElement('span');
  shadow.className='card-motion-shadow';
  shadow.style.boxShadow=previousShadow?.style.boxShadow||getComputedStyle(card).boxShadow;
  previousShadow?.remove();
  card.prepend(shadow);
  card.classList.add('flipping');
  // Keep the shadow fully hidden during the turn, then restore it as the face settles.
  const shade=shadow.animate([{offset:0,opacity:0},{offset:.88,opacity:0},{offset:1,opacity:1}],{...timing,easing:'linear'});
  const startTime=document.timeline.currentTime;
  if(startTime!==null)for(const motion of [shade,...faces])motion.startTime=startTime;
  card._flipMotion=faces;
  const cleanup=()=>{
   shade.cancel();
   shadow.remove();
   for(const motion of faces)motion.cancel();
   if(card._flipMotion!==faces)return;
   card._flipMotion=null;
   card.classList.remove('flipping');
  };
  faces[0].finished.then(cleanup,cleanup);
 };
 document.querySelectorAll('.bank-card').forEach(prepare);
})();

// The outgoing DOM still shows which face was visible, including on browser back.
const paintBeforeRearCardClose=paint;
paint=function(direction){
 if(route.page==='home'&&$('#app.card .expanded-card.flipped')){
  preciseCardScene?.dispose();
  skipPageMotion=true;
 }
 return paintBeforeRearCardClose(direction);
};
