'use strict';

const cardTurnEase = 'ease';

function animateCardFaces(art,start,end,perspective,timing){
 // Keep the painted faces on the same perspective axis and exchange them edge-on.
  const crossing=(90-start)/(end-start);
  return ['front','back'].flatMap((side,index)=>{
   const face=art.querySelector('.bank-card-'+side);
   const pose=angle=>{
    const yaw=index?Math.max(90,angle)-180:Math.min(90,angle);
    return `perspective(${perspective}px) rotateY(${yaw}deg)`;
   };
   const turnsThroughEdge=crossing>0&&crossing<1;
   const endOpacity=Number(index?end>90:end<90);
   const poses=[{transform:pose(start)}];
   const visibility=[];
   if(turnsThroughEdge){
    poses.push({offset:crossing,transform:pose(90)});
    visibility.push({opacity:1-endOpacity,easing:'steps(1, end)'},{offset:crossing,opacity:endOpacity});
   }else{
    visibility.push({opacity:endOpacity});
   }
   poses.push({transform:pose(end)});
   visibility.push({opacity:endOpacity});
   return [face.animate(poses,timing),face.animate(visibility,timing)];
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
   const {face,angle}=visibleCardFace(art);
   pose.flipAngle=angle;
   pose.rearVisible=face.classList.contains('bank-card-back');
   if(el.classList.contains('flipping'))pose.faceCorners=paintedFaceCorners(face);
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
   const timing=current.timing,number=current.node.querySelector('.card-printed-number'),targetNumber=to.querySelector('.card-printed-number');
   if(number&&targetNumber){
    const opacity=getComputedStyle(targetNumber).opacity;
    if(current.rear)number.style.opacity=opacity;
    else number.animate([{opacity:printedOpacity??'1'},{opacity}],timing);
   }
   // The name was not visible on the starting rear face and is absent on the home card.
   if(!opening&&from.flipAngle>90)current.node.querySelector('.card-holder')?.style.setProperty('display','none','important');
  }

 };
 // A closing card remains part of the carousel until its final handoff.
 const moveSwipe=moveHomeSwipe;
 moveHomeSwipe=function(...args){const result=moveSwipe(...args),scene=preciseCardScene;if(scene?.carouselTrack?.isConnected){scene.swipeOffsetX=new DOMMatrixReadOnly(scene.carouselTrack.style.transform||undefined).m41-scene.carouselStartX;scene.node.style.translate=`${scene.swipeOffsetX}px 0px`}return result};
 const cleanupStrip=cleanupSwipe;cleanupSwipe=function(...args){const result=cleanupStrip(...args);if(preciseCardScene)document.documentElement.dataset.gesture='active';return result};
 function visibleCardFace(art){
  const back=art.querySelector('.bank-card-back');
  const rear=Number(getComputedStyle(back).opacity)>0;
  const face=rear?back:art.querySelector('.bank-card-front');
  const transform=getComputedStyle(face).transform;
  const cosine=transform==='none'?1:new DOMMatrixReadOnly(transform).m11;
  const yaw=Math.acos(Math.max(0,Math.min(1,cosine)))*180/Math.PI;
  return {face,angle:rear?180-yaw:yaw};
 }
 function paintedFaceCorners(face){
  // Read the projected corners from layout so the handoff follows the browser's painted face.
  const points=[[0,0],[100,0],[100,100],[0,100]].map(([x,y])=>{
   const point=document.createElement('span');
   Object.assign(point.style,{position:'absolute',left:x+'%',top:y+'%',width:'0',height:'0',visibility:'hidden'});
   return point;
  });
  face.append(...points);
  const corners=points.map(point=>{const {x,y}=point.getBoundingClientRect();return [x,y]});
  points.forEach(point=>point.remove());
  return corners;
 }
 const flip=actions['flip-card'];
 actions['flip-card']=()=>{
  const card=$('#app .expanded-card');
  if(!card||preciseCardScene?.target===card)return;
  const art=card.querySelector('.bank-card');
  const start=visibleCardFace(art).angle,wasFlipped=cardFlipped;
  flip();
  if(cardFlipped===wasFlipped)return;

  card._stopFlip?.();
  if(shouldReduceMotion())return;
  const end=cardFlipped?180:0;
  const duration=600*Math.abs(end-start)/180;
  if(duration<1)return;
  const timing={duration,easing:cardTurnEase,fill:'both'};
  const faces=animateCardFaces(art,start,end,1000,timing);
  const shadow=document.createElement('span');
  shadow.className='card-motion-shadow';
  shadow.style.boxShadow=getComputedStyle(card).boxShadow;
  card.prepend(shadow);
  card.classList.add('flipping');
  // Keep the shadow fully hidden during the turn, then restore it as the face settles.
  const shade=shadow.animate([{offset:0,opacity:0},{offset:.88,opacity:0},{offset:1,opacity:1}],{...timing,easing:'linear'});
  const startTime=document.timeline.currentTime;
  if(startTime!==null)for(const motion of [shade,...faces])motion.startTime=startTime;
  const cleanup=()=>{
   if(card._stopFlip!==cleanup)return;
   card._stopFlip=null;
   shade.cancel();
   shadow.remove();
   for(const motion of faces)motion.cancel();
   card.classList.remove('flipping');
  };
  card._stopFlip=cleanup;
  faces[0].finished.then(cleanup,cleanup);
 };
 document.querySelectorAll('.bank-card').forEach(prepare);
})();

// Capture the visible face before Home replaces the card settings.
const paintBeforeRearCardClose=paint;
paint=function(direction){
 const card=route.page==='home'?$('#app.card .expanded-card'):null;
 const pose=card?measureCardPose(card):null;
 card?._stopFlip?.();
 if(pose)skipPageMotion=true;
 const result=paintBeforeRearCardClose(direction);
 if(pose)expandTransition(pose,$('.card-face[data-id="'+state.activeCard+'"]')||$('.card-face'),false);
 return result;
};
