from pathlib import Path
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8')
a=s.index('function bindHorizontalGesture(');b=s.index('\nbindCardSwipe=',a)
s=s[:a]+'''function bindHorizontalGesture(element,{read,write,settle,cancel}){
 let start=null,dragging=false,vertical=false,samples=[],frame=0,pending=0;
 const stopClick=e=>{e.preventDefault();e.stopPropagation()};
 const flush=()=>{cancelAnimationFrame(frame);frame=0;if(start&&dragging)write(pending)};
 element.addEventListener('pointerdown',e=>{if(e.button!==0||start)return;if(element.classList.contains('home-content')&&e.target.closest('.operation-panel'))return;cancel();start={x:e.clientX,y:e.clientY,base:read(),id:e.pointerId};dragging=false;vertical=false;samples=[{x:e.clientX,time:performance.now()}]});
 element.addEventListener('pointermove',e=>{if(!start||e.pointerId!==start.id||vertical)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!dragging&&Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){vertical=true;return}if(!dragging&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.3){dragging=true;element.setPointerCapture(e.pointerId)}if(!dragging)return;const time=performance.now();samples.push({x:e.clientX,time});samples=samples.filter(p=>time-p.time<100);pending=start.base+dx;if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(start&&dragging)write(pending)})});
 const end=e=>{if(!start||e.pointerId!==start.id)return;flush();const moved=dragging,first=samples[0],last=samples.at(-1),v=e.type==='pointercancel'?0:last&&first&&performance.now()-last.time<80&&last.time>first.time?(last.x-first.x)/(last.time-first.time)*1000:0;start=null;dragging=false;vertical=false;if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);if(moved){element.addEventListener('click',stopClick,{once:true,capture:true});settle(v)}};
 element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);element.addEventListener('lostpointercapture',e=>{if(start)end(e)})
}'''+s[b:]
s=s.replace("t<.8&&(Math.abs(position-target)>.25||Math.abs(speed)>6)","t<1.2&&(Math.abs(position-target)>.05||Math.abs(speed)>.5)")
p.write_text(s,encoding='utf-8')
p=Path('dist/interactions.js');s=p.read_text(encoding='utf-8');a=s.index('paint=function()');b=s.index('\n\nfunction launchRefreshRocket',a)
s=s[:a]+'''let pageTransition=null,pageAnimation=null;
paint=function(direction){
 pageTransition?.skipTransition();pageAnimation?.cancel();
 if(skipPageMotion){skipPageMotion=false;render();return}
 if(shouldReduceMotion()||['home','card'].includes(route.page)){render();return}
 document.documentElement.dataset.pageDirection=direction==='back'?'back':'forward';
 if(document.startViewTransition){const destination=route;pageTransition=document.startViewTransition(()=>{if(route===destination)render()});pageTransition.finished.catch(()=>{});return}
 render();pageAnimation=$('#screen').animate([{opacity:.65,transform:`translate3d(${direction==='back'?-12:12}px,0,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)'})
};'''+s[b:]
a=s.index('const backBeforeHistory=back;');b=s.index('\nconst adminCardBeforeDetails',a)
s=s[:a]+'''const backBeforeHistory=back;
back=function(){
 if(route.page!=='history'||shouldReduceMotion())return backBeforeHistory();
 const source=$('.all-operations-page'),pose=source?getComputedStyle(source).transform:'none',node=historyDrawer();
 // Preserve the displayed list, search and scroll position throughout dismissal.
 if(source){node.replaceChildren(source.cloneNode(true));node.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));node.firstElementChild.style.transform='none';node.firstElementChild.style.marginTop=-window.scrollY+'px'}
 const offset=pose==='none'?0:new DOMMatrixReadOnly(pose).m42;
 node.style.transform=`translate3d(0,${offset}px,0)`;skipPageMotion=true;backBeforeHistory();
 node.animate([{transform:`translate3d(0,${offset}px,0)`},{transform:'translate3d(0,100%,0)'}],{duration:280,easing:'cubic-bezier(.32,.72,0,1)'}).finished.catch(()=>{}).finally(()=>node.remove());
};actions.back=()=>back();
function bindHistoryDismiss(){
 const screen=$('#screen');let start=null,pull=0,returnMotion=null,axis=null;
 const begin=(x,y)=>{if(route.page!=='history'||window.scrollY>0)return;const page=$('.all-operations-page'),pose=page?getComputedStyle(page).transform:'none';const base=pose==='none'?0:new DOMMatrixReadOnly(pose).m42;if(page)page.style.transform=`translate3d(0,${base}px,0)`;returnMotion?.cancel();start={x,y,base};pull=base;axis=null};
 const move=(x,y)=>{if(!start||route.page!=='history')return false;const dy=y-start.y,dx=x-start.x;if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>7)axis=dy>0&&dy>Math.abs(dx)*1.2?'vertical':'other';if(axis!=='vertical')return false;pull=Math.max(0,start.base+dy*.65);const page=$('.all-operations-page');if(page)page.style.transform=`translate3d(0,${pull}px,0)`;return true};
 const end=(cancelled=false)=>{if(!start)return;start=null;const page=$('.all-operations-page');if(!cancelled&&pull>65){back()}else if(page){if(shouldReduceMotion())page.style.transform='';else{const from=pull;page.style.transform='';returnMotion=page.animate([{transform:`translate3d(0,${from}px,0)`},{transform:'translate3d(0,0,0)'}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)'})}}pull=0;axis=null};
 screen.onpointerdown=e=>{if(e.pointerType==='mouse'&&!e.target.closest('input,button'))begin(e.clientX,e.clientY)};screen.onpointermove=e=>{if(e.pointerType==='mouse')move(e.clientX,e.clientY)};screen.onpointerup=e=>{if(e.pointerType==='mouse')end()};screen.onpointercancel=()=>end(true);
 screen.ontouchstart=e=>{if(e.touches.length===1&&!e.target.closest('input,button'))begin(e.touches[0].clientX,e.touches[0].clientY)};screen.ontouchmove=e=>{if(e.touches.length===1&&move(e.touches[0].clientX,e.touches[0].clientY))e.preventDefault()};screen.ontouchend=()=>end();screen.ontouchcancel=()=>end(true)
}
''' +s[b:]
s=s.replace("<span>${esc(activeCard().account)}</span><strong>${esc(activeCard().card)}</strong>","<strong>${displayMoney(balance())} ₴</strong>")
p.write_text(s,encoding='utf-8')
p=Path('dist/experience.js');s=p.read_text(encoding='utf-8');s=s.replace("number.animate(opening?[{fontSize:homeFont+'px'},{fontSize:fullFont+'px'}]:[{fontSize:fullFont+'px'},{fontSize:homeFont+'px'}]", "number.style.transformOrigin='left center';number.animate(opening?[{transform:`scale(${homeFont/fullFont})`},{transform:'scale(1)'}]:[{transform:'scale(1)'},{transform:`scale(${homeFont/fullFont})`}]")
p.write_text(s,encoding='utf-8')
p=Path('dist/interactions.css');s=p.read_text(encoding='utf-8');s+='''
/* Direction and touch continuity: the tab bar stays on its own stable surface. */
html[data-page-direction="back"]::view-transition-new(app-page){animation-name:app-page-back-in}
html[data-page-direction="back"]::view-transition-old(app-page){animation:app-page-back-out 240ms var(--ease-out) both}
@keyframes app-page-back-in{from{opacity:.65;transform:translate3d(-8%,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}
@keyframes app-page-back-out{from{opacity:1;transform:translate3d(0,0,0)}to{opacity:0;transform:translate3d(12%,0,0)}}
.all-operations-page{overflow-anchor:none}.history-card-identity{min-height:38px;display:flex;justify-content:center;align-items:center}.history-card-identity strong{font-size:16px;font-weight:550;letter-spacing:-.2px;font-variant-numeric:tabular-nums}
.bank-card-front,.bank-card-back{-webkit-backface-visibility:hidden;backface-visibility:hidden}
.card-transition .card-printed-number{will-change:transform}.card-carousel{overflow-anchor:none}
@media(prefers-reduced-motion:reduce){html:not([data-motion="full"])::view-transition-group(*),html:not([data-motion="full"])::view-transition-old(*),html:not([data-motion="full"])::view-transition-new(*){animation:none!important}}
html[data-motion="reduced"]::view-transition-group(*),html[data-motion="reduced"]::view-transition-old(*),html[data-motion="reduced"]::view-transition-new(*){animation:none!important}
''';p.write_text(s,encoding='utf-8')
for name in ['index.html','admin.html','sw.js']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('v15','v16').replace('v=15','v=16')
 if name=='index.html':s=s.replace('<title>', '<link rel="preload" href="assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="assets/fonts/inter-cyrillic.woff2" as="font" type="font/woff2" crossorigin><title>')
 p.write_text(s,encoding='utf-8')

