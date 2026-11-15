from pathlib import Path
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8')
s=s.replace("cardArtwork=c=>drawnCard(c).replace(/<div", "cardArtwork=c=>drawnCard(c).replace('<span class=\"card-holder\">','<span class=\"card-printed-number\">'+esc(c.card||'')+'</span><span class=\"card-holder\">').replace(/<div")
s=s.replace('${cardArtwork(c)}</button></div>`).join', '${cardArtwork(c)}</button><button class="card-number-overlay" data-action="copy-visible-card" data-id="${c.id}" aria-label="Скопіювати номер ${esc(c.account)}">${esc(c.card)}</button></div>`).join')
pos=s.index("actions['cycle-card']=")
s=s[:pos]+'''actions['copy-visible-card']=async b=>{const c=allCards().find(c=>c.id===b.dataset.id);if(!c)return;try{await navigator.clipboard.writeText(c.card);toast('Номер картки скопійовано')}catch{toast('Копіювання недоступне у цьому браузері')}};
''' +s[pos:]
p.write_text(s,encoding='utf-8')
p=Path('dist/experience.js');s=p.read_text(encoding='utf-8');a=s.index('function expandTransition(');b=s.index('\nconst baseNavigate=',a)
s=s[:a]+'''function measureCardPose(el){const rect=el.getBoundingClientRect(),slide=el.classList.contains('card-face')?el.closest('.card-slide'):null,anchor=slide?slide.getBoundingClientRect():rect;return {rect,width:el.offsetWidth,center:{x:anchor.x+anchor.width/2,y:anchor.y+anchor.height/2},surface:el.querySelector('.bank-card-front')?getComputedStyle(el.querySelector('.bank-card-front')).background:null,snapshot:typeof captureBankSurface==='function'?captureBankSurface():null}}
function expandTransition(from,to,opening){
 if(!from||!to||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 cardTransition?.finish();
 const destination=to.getBoundingClientRect(),flat=opening?destination:from.rect,width=opening?to.offsetWidth:from.width,height=width/1.586;
 const slide=to.classList.contains('card-face')?to.closest('.card-slide')?.getBoundingClientRect():null;
 const homeCenter=opening?from.center:{x:(slide||destination).x+(slide||destination).width/2,y:(slide||destination).y+(slide||destination).height/2};
 const dx=homeCenter.x-flat.x-width/2,dy=homeCenter.y-flat.y-height/2,ratio=(opening?from.width:to.offsetWidth)/width;
 const node=document.createElement('div');node.className='card-transition';node.innerHTML=cardArtwork(activeCard());
 Object.assign(node.style,{position:'fixed',left:flat.x+'px',top:flat.y+'px',width:width+'px',height:height+'px',zIndex:40,pointerEvents:'none'});
 const backdrop=from.snapshot;if(backdrop){document.body.append(backdrop);backdrop.animate([{opacity:1,offset:0},{opacity:1,offset:.4},{opacity:0,offset:1}],{duration:280,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>backdrop.remove())}
 const front=node.querySelector('.bank-card-front'),destinationFront=to.querySelector('.bank-card-front');
 if(front){const shade=document.createElement('span');shade.className='card-transition-shade';shade.style.background=opening?from.surface:getComputedStyle(destinationFront).background;front.prepend(shade);shade.animate(opening?[{opacity:1},{opacity:0}]:[{opacity:0},{opacity:1}],{duration:280,easing:'ease-out',fill:'forwards'})}
 const brand=node.querySelector('.card-brand');const homeBrand='translate3d('+width*.017+'px,'+(-height*.02)+'px,0) scale(.823529)',flatBrand='translate3d(0px,0px,0px) scale(1)';if(brand){brand.style.transformOrigin='left top';brand.animate(opening?[{transform:homeBrand},{transform:flatBrand}]:[{transform:flatBrand},{transform:homeBrand}],{duration:280,easing:'cubic-bezier(.32,.72,0,1)',fill:'forwards'})}
 node.querySelectorAll('.card-holder,.card-printed-number').forEach(el=>el.animate(opening?[{opacity:0},{opacity:1}]:[{opacity:1},{opacity:0}],{duration:opening?160:180,delay:opening?120:0,easing:'ease-out',fill:'both'}));
 document.body.append(node);to.style.opacity='0';
 if(opening)document.querySelectorAll('.card-settings>.payment-settings,.card-settings>h2,.card-settings>.settings-group,.card-close').forEach(el=>el.animate([{opacity:0},{opacity:1}],{duration:120,delay:160,easing:'ease-out',fill:'backwards'}));
 const home=`translate3d(${dx}px,${dy}px,0px) perspective(900px) rotateX(65deg) scale(${ratio})`,expanded='translate3d(0px,0px,0px) perspective(900px) rotateX(0deg) scale(1)';
 cardTransition=node.animate(opening?[{transform:home},{transform:expanded}]:[{transform:expanded},{transform:home}],{duration:280,easing:'cubic-bezier(.32,.72,0,1)'});
 cardTransition.finished.catch(()=>{}).finally(()=>{node.remove();to.style.opacity=''});
}
''' +s[b:]
s=s.replace("from=el?{rect:el.getBoundingClientRect(),width:el.offsetWidth,snapshot:typeof captureBankSurface==='function'?captureBankSurface():null}:null", "from=el?measureCardPose(el):null")
p.write_text(s,encoding='utf-8')
