from pathlib import Path
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8');a=s.index('finishCardSelection=async function(index)');b=s.index('\nfunction physicalSettle',a)
s=s[:a]+'''finishCardSelection=async function(index){const old=state.activeCard,wasNew=newCardSelected;newCardSelected=index===allCards().length;cardDotsVisible=true;carouselIndex=index;if(!newCardSelected)state.activeCard=allCards()[index].id;const rebuild=wasNew!==newCardSelected;if(route.page==='home'){if(rebuild){cleanupSwipe();render()}else{refreshSelectedCard();cleanupSwipe()}}else cleanupSwipe();try{await persist()}catch(e){state.activeCard=old;newCardSelected=wasNew;cleanupSwipe();if(e.conflict)await loadSharedState(true);render();toast(e.message)}clearTimeout(finishCardSelection.timer);finishCardSelection.timer=setTimeout(()=>{cardDotsVisible=false;$('.card-selector')?.classList.remove('show-dots')},2400)};
''' +s[b:]
s=s.replace("'use strict';", "'use strict';\ndocument.addEventListener('dragstart',e=>{if(e.target.closest('.card-track,.stats-carousel'))e.preventDefault()});",1)
p.write_text(s,encoding='utf-8')
for f in ['index.html','admin.html']:
 p=Path('dist')/f;s=p.read_text(encoding='utf-8').replace('?v=11','?v=12');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('mono-mock-v11','mono-mock-v12').replace('?v=11','?v=12');p.write_text(s,encoding='utf-8')
