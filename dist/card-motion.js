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
 render=function(){renderBeforeInk();document.querySelectorAll('.bank-card').forEach(prepare)};
 const selectFaces=(art,backFirst,timing)=>['front','back'].map(side=>{
  const initial=(side==='back')===backFirst?'visible':'hidden',final=initial==='visible'?'hidden':'visible';
  return art.querySelector('.bank-card-'+side).animate([{offset:0,visibility:initial,easing:'steps(1,end)'},{offset:.5,visibility:final},{offset:1,visibility:final}],{...timing,fill:'both'});
 });
 const originalTransition=expandTransition;
 expandTransition=function(from,to,opening){
  prepare(to?.querySelector('.bank-card'));originalTransition(from,to,opening);
  if(preciseCardScene?.body&&to){const surface=getComputedStyle(to);preciseCardScene.body.style.perspective=surface.perspective;preciseCardScene.body.style.perspectiveOrigin=surface.perspectiveOrigin}
  if(!opening&&from.flipped&&preciseCardScene){const scene=preciseCardScene,timing=scene.motion.effect.getTiming();const faces=selectFaces(scene.node.querySelector('.bank-card'),true,{duration:timing.duration,easing:timing.easing});scene.motion.ready.then(()=>faces.forEach(a=>a.startTime=scene.motion.startTime)).catch(()=>{});scene.motion.finished.then(()=>faces.forEach(a=>a.cancel()),()=>faces.forEach(a=>a.cancel()))}
 };
 const originalFlip=actions['flip-card'];
 actions['flip-card']=()=>{
  const card=$('.expanded-card'),shadow=card&&getComputedStyle(card).boxShadow,backFirst=cardFlipped;
  card?._inkFaces?.forEach(a=>a.cancel());originalFlip();
  // Keep the full original rotation, without its unrelated shadow brightness pulse.
  if(card){card._shadowMotion?.cancel();card._shadowMotion=null;if(shadow)card.style.boxShadow=shadow;if(cardFlipped!==backFirst&&card._flipMotion){const motion=card._flipMotion,timing=motion.effect.getTiming(),faces=selectFaces(card.querySelector('.bank-card'),backFirst,{duration:timing.duration,easing:timing.easing});card._inkFaces=faces;motion.ready.then(()=>faces.forEach(a=>a.startTime=motion.startTime)).catch(()=>{});motion.finished.then(()=>faces.forEach(a=>a.cancel()),()=>faces.forEach(a=>a.cancel()))}}
 };
 document.querySelectorAll('.bank-card').forEach(prepare);
})();
