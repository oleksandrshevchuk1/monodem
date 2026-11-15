'use strict';
const rasterGlyphs=new Set(['cat-fill','gift-fill','chart-bar-fill','credit-card-fill','receipt-fill','stack-fill','gear','lock-key']);
const fallbackIconBeforeCatalog=icon;
icon=name=>rasterGlyphs.has(name)&&embeddedReferenceImages[name]?`<img class="icon" src="${embeddedReferenceImages[name]}" alt="" aria-hidden="true" draggable="false">`:(embeddedIconMarkup[name]||fallbackIconBeforeCatalog(name));
referenceImage=(name,cls='')=>`<img class="${cls}" src="${embeddedReferenceImages[name]||'assets/reference/'+name+'.png'}" alt="" draggable="false">`;
const cardArtworkBeforeEmbedded=cardArtwork;cardArtwork=function(card){return cardArtworkBeforeEmbedded(card).replace(/src="assets\/reference\/(card-brand|visa)\.png"/g,(_,name)=>'src="'+embeddedReferenceImages[name]+'"')};
function prepareVisibleGlyphs(){document.querySelectorAll('#app img[src^="assets/reference/"],#nav img[src^="assets/reference/"]').forEach(image=>{const name=image.getAttribute('src').split('/').at(-1).replace(/\.png$/,'');if(embeddedReferenceImages[name]){image.src=embeddedReferenceImages[name];image.loading='eager'}});document.querySelectorAll('#app img.icon[src^="assets/icons/"],#nav img.icon[src^="assets/icons/"]').forEach(image=>{const name=image.getAttribute('src').split('/').at(-1).replace(/\.svg$/,'');if(!embeddedIconMarkup[name])return;const template=document.createElement('template');template.innerHTML=embeddedIconMarkup[name];const svg=template.content.firstElementChild;svg.setAttribute('class',image.className);svg.style.cssText=image.style.cssText;image.replaceWith(svg)})}
if(!adminMode){
 // Only the card strip follows a card swipe. Never move or clone the payment blocks.
 prepareSwipe=prepareAccountSwipe;
 moveHomeSwipe=function(distance){const layer=prepareSwipe(),edge=layer.index===0&&distance>0||layer.index===allCards().length&&distance<0;moveAccountSwipe(edge?0:Math.max(-layer.width,Math.min(layer.width,distance)),false)};
 cleanupSwipe=function(){cleanupAccountSwipe();document.querySelectorAll('.account-swipe-preview').forEach(node=>node.remove());document.querySelectorAll('.home-content>.home-actions,.home-content>.operation-panel,.home-content>.home-balance').forEach(node=>node.style.transform='');if(route.page==='home')setCarouselPosition(newCardSelected?allCards().length:allCards().findIndex(card=>card.id===state.activeCard))};
 prepareAccountPreviews=function(){accountPreviewCache.clear()};scheduleAccountPreviews=function(){clearTimeout(previewIdleTask)};
}
function remainingLimitColor(ratio){const value=Math.max(0,Math.min(1,ratio)),hue=value<.5?value*60:30+(value-.5)*180;return `hsl(${hue} 83% 53%)`}
limitRow=function(title,value,max,image){const amount=text=>Number(String(text).replace(/\s/g,'')),ratio=Math.max(0,Math.min(1,amount(value)/Math.max(1,amount(max))));return `<div class="reference-limit-row">${referenceImage(image)}<div><span>${title}</span><p><strong>Залишилось ${value} ₴</strong> / ${max} ₴</p><div class="reference-limit-track" role="progressbar" aria-valuemin="0" aria-valuemax="${amount(max)}" aria-valuenow="${amount(value)}"><i data-limit-ratio="${ratio}" style="transform:scaleX(${ratio});background:${remainingLimitColor(ratio)}"></i></div></div></div>`};
function animateLimitIndicators(){document.querySelectorAll('[data-limit-ratio]').forEach(fill=>{const ratio=Number(fill.dataset.limitRatio),color=remainingLimitColor(ratio);fill.style.background=color;fill.style.boxShadow='none';if(!shouldReduceMotion())fill.animate([{transform:'scaleX(1)',backgroundColor:color},{transform:`scaleX(${ratio})`,backgroundColor:color}],{duration:300,easing:'cubic-bezier(.23,1,.32,1)'})});const progress=document.querySelector('.internet-limit progress');if(progress){const card=activeCard(),settings=state.cardSettings[card.id]||{},maximum=Number(settings.limit??10000),spent=txFor(card.id).filter(tx=>tx.amount<0&&tx.date===today()).reduce((sum,tx)=>sum-tx.amount,0),ratio=settings.online===false||maximum<=0?0:Math.max(0,1-spent/maximum);progress.value=ratio*100;progress.style.setProperty('--limit-color',remainingLimitColor(ratio))}}
const flipBeforeLimitColors=actions['flip-card'];actions['flip-card']=()=>{flipBeforeLimitColors();animateLimitIndicators()};
const renderBeforeMobileStability=render;render=function(){renderBeforeMobileStability();prepareVisibleGlyphs();animateLimitIndicators()};
function updateInstalledViewport(){
 const root=document.documentElement,viewport=window.visualViewport;
 root.style.setProperty('--visible-height',(viewport?.height||innerHeight)+'px');
 root.classList.toggle('keyboard-open',!!viewport&&innerHeight-viewport.height>120);
 root.style.setProperty('--app-height',innerHeight+'px');
 const nav=document.querySelector('#nav'),height=nav.getBoundingClientRect().height;
 if(height>0)root.style.setProperty('--nav-height',height+'px');
}
window.addEventListener('resize',updateInstalledViewport,{passive:true});window.visualViewport?.addEventListener('resize',updateInstalledViewport,{passive:true});window.addEventListener('pageshow',()=>requestAnimationFrame(updateInstalledViewport));document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(updateInstalledViewport));
// Show only the ready entry screen (or ready admin), never a transient loading row.
function releaseStableBoot(){if(loading)return;const entry=document.querySelector('.entry-overlay');if(!adminMode&&entry&&entry.dataset.ready!=='true')return;document.documentElement.classList.remove('booting');bootObserver.disconnect()}
const bootObserver=new MutationObserver(releaseStableBoot);bootObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ready']});document.addEventListener('DOMContentLoaded',()=>setTimeout(releaseStableBoot,0));

document.documentElement.dataset.appVersion='47';
const settingsBeforeBuildLabel=appSettingsPage;appSettingsPage=function(){return settingsBeforeBuildLabel()+'<p class="build-version">Версія 47</p>'};
