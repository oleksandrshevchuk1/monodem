'use strict';
let refreshGestureCleanup=null,refreshFlight=null;
function refreshHaptic(){try{if(typeof navigator.vibrate==='function')navigator.vibrate(12)}catch{}}
launchRefreshRocket=function(panel,origin){
 if(refreshFlight)return;
 const rect=origin||panel.getBoundingClientRect();let flight=null,motion=null;
 if(!shouldReduceMotion()&&rect.top>0){flight=document.createElement('div');flight.className='refresh-rocket-flight';flight.setAttribute('aria-hidden','true');Object.assign(flight.style,{left:rect.left+rect.width/2-24+'px',height:rect.top+'px'});flight.innerHTML='<img src="assets/reference/refresh-rocket.png" alt="">';document.body.append(flight);motion=flight.firstElementChild.animate([{transform:`translate3d(0,${rect.top+8}px,0)`},{transform:'translate3d(0,-76px,0)'}],{duration:650,easing:'cubic-bezier(.32,0,.67,0)',fill:'both'});motion.finished.catch(()=>{}).finally(()=>flight.remove())}
 refreshHaptic();const session={flight,motion};refreshFlight=session;const spinner=document.querySelector('.refresh-indicator');spinner?.classList.add('refreshing');
 Promise.allSettled([loadSharedState(),motion?.finished||Promise.resolve()]).finally(()=>{if(refreshFlight!==session)return;flight?.remove();spinner?.classList.remove('refreshing');if(spinner){spinner.style.opacity='';spinner.style.transform=''}refreshFlight=null})
};
bindRefresh=function(){
 refreshGestureCleanup?.();if(adminMode||route.page!=='home')return;const app=document.querySelector('#app');let start=null,panel=null,pull=0,active=false,armed=false;
 const begin=(x,y,target)=>{if(route.page!=='home'||pageScrollY()>1||refreshFlight||document.querySelector('.entry-overlay'))return;panel=target.closest('.operation-panel');if(!panel)return;start={x,y};pull=0;active=false;armed=false};
 const move=(x,y)=>{if(!start||route.page!=='home')return false;const dx=x-start.x,dy=y-start.y;if(!active&&(dy<-8||Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy))){start=null;return false}if(!active&&dy>12&&dy>Math.abs(dx)*1.4)active=true;if(!active)return false;pull=Math.min(90,Math.max(0,dy*.42));const spinner=document.querySelector('.refresh-indicator');if(spinner)spinner.style.opacity=String(Math.min(1,pull/60));const next=pull>=60;if(next&&!armed)refreshHaptic();armed=next;return true};
 const end=cancelled=>{if(!start)return;start=null;const moved=active,fire=active&&armed&&!cancelled,element=panel;active=false;const distance=pull;pull=0;element.style.transform='';const rect=element.getBoundingClientRect();if(fire)launchRefreshRocket(element,rect);if(moved){const stop=event=>{event.preventDefault();event.stopPropagation()};document.addEventListener('click',stop,true);setTimeout(()=>document.removeEventListener('click',stop,true),0)}};
 const ts=e=>{if(e.touches.length===1)begin(e.touches[0].clientX,e.touches[0].clientY,e.target)},tm=e=>{if(e.touches.length===1&&move(e.touches[0].clientX,e.touches[0].clientY))e.preventDefault()},te=e=>end(e.type==='touchcancel');
 const pd=e=>{if(e.pointerType==='mouse'&&e.button===0)begin(e.clientX,e.clientY,e.target)},pm=e=>{if(e.pointerType==='mouse'&&move(e.clientX,e.clientY))e.preventDefault()},pu=e=>{if(e.pointerType==='mouse')end(e.type==='pointercancel')};
 app.addEventListener('touchstart',ts,{passive:true});app.addEventListener('touchmove',tm,{passive:false});document.addEventListener('touchend',te);document.addEventListener('touchcancel',te);app.addEventListener('pointerdown',pd);document.addEventListener('pointermove',pm);document.addEventListener('pointerup',pu);document.addEventListener('pointercancel',pu);
 refreshGestureCleanup=()=>{if(panel)panel.style.transform='';start=null;app.removeEventListener('touchstart',ts);app.removeEventListener('touchmove',tm);document.removeEventListener('touchend',te);document.removeEventListener('touchcancel',te);app.removeEventListener('pointerdown',pd);document.removeEventListener('pointermove',pm);document.removeEventListener('pointerup',pu);document.removeEventListener('pointercancel',pu);refreshGestureCleanup=null}
};
const renderBeforeRefreshLifecycle=render;render=function(){refreshGestureCleanup?.();renderBeforeRefreshLifecycle()};
if(!adminMode&&route.page==='home')bindRefresh();
