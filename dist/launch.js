'use strict';
// The launch layer has its final viewport size before any app code loads.
(()=>{
 let exit=null,generation=0,visibleSince=window.launchStartedAt||performance.now();
 const source=document.querySelector('#launch-splash').innerHTML;
 window.showLaunchSplash=()=>{
  generation++;exit?.cancel();exit=null;let layer=document.querySelector('#launch-splash');
  if(!layer){layer=document.createElement('div');layer.id='launch-splash';layer.setAttribute('role','status');layer.setAttribute('aria-label','Завантаження');layer.innerHTML=source;document.body.append(layer)}
  layer.style.opacity='1';visibleSince=performance.now();return layer;
 };
 window.dismissLaunchSplash=async()=>{
  const layer=document.querySelector('#launch-splash'),run=generation;if(!layer||exit)return;
  await document.fonts.ready;await new Promise(resolve=>setTimeout(resolve,Math.max(0,600-(performance.now()-visibleSince))));
  // Give the ready screen a paint under the splash before fading the cover.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  if(!layer.isConnected||exit||run!==generation)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animation=layer.animate([{opacity:1},{opacity:0}],{duration:reduce?120:280,easing:'cubic-bezier(.23,1,.32,1)',fill:'both'});exit=animation;
  animation.finished.then(()=>{if(exit!==animation)return;layer.remove();exit=null}).catch(()=>{});
 };
})();
