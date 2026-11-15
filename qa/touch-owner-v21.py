from pathlib import Path
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s=s.replace('let operationsHome=null,operationsScene=null,operationsEntrance=null,operationsNavMotion=null;', 'let operationsHome=null,operationsScene=null,operationsEntrance=null,operationsNavMotion=null,historyTouchCleanup=null;')
a=s.index(" screen.onpointerdown=e=>{if(e.pointerType==='mouse')begin(e.clientX,e.clientY,e.target,e.pointerId)}",s.index('bindHistoryDismiss=function()'))
b=s.index('\n};',a)
s=s[:a]+''' screen.onpointerdown=e=>{if(e.pointerType==='mouse')begin(e.clientX,e.clientY,e.target,e.pointerId)};screen.onpointermove=e=>{if(e.pointerType==='mouse'&&move(e.clientX,e.clientY)&&!screen.hasPointerCapture(e.pointerId))screen.setPointerCapture(e.pointerId)};screen.onpointerup=e=>{if(e.pointerType==='mouse')end(false)};screen.onpointercancel=()=>end(true);
 historyTouchCleanup?.();screen.ontouchstart=e=>{if(e.touches.length===1)begin(e.touches[0].clientX,e.touches[0].clientY,e.target)};screen.ontouchmove=screen.ontouchend=screen.ontouchcancel=null;
 const touchMove=e=>{if(e.touches.length===1&&move(e.touches[0].clientX,e.touches[0].clientY))e.preventDefault()},touchEnd=()=>end(false),touchCancel=()=>end(true);
 document.addEventListener('touchmove',touchMove,{passive:false});document.addEventListener('touchend',touchEnd,{passive:true});document.addEventListener('touchcancel',touchCancel,{passive:true});
 historyTouchCleanup=()=>{start=null;document.removeEventListener('touchmove',touchMove);document.removeEventListener('touchend',touchEnd);document.removeEventListener('touchcancel',touchCancel);historyTouchCleanup=null}
''' +s[b:]
s=s.replace("renderBeforeFinalMotion();if(route.page==='home')scheduleAccountPreviews();", "renderBeforeFinalMotion();if(route.page!=='history')historyTouchCleanup?.();if(route.page==='home')scheduleAccountPreviews();")
p.write_text(s,encoding='utf-8')
