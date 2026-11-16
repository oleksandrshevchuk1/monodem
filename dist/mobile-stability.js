'use strict';
const readyCharacterImages=['character-cutout-v49','character-background-v49'].map(name=>{const img=new Image();img.src='assets/reference/'+name+'.png';return img});
const rasterGlyphs=new Set(['cat-fill','gift-fill','chart-bar-fill','credit-card-fill','receipt-fill','stack-fill','gear','lock-key']);
const fallbackIconBeforeCatalog=icon;
icon=name=>embeddedIconMarkup[name]||fallbackIconBeforeCatalog(name);
referenceImage=(name,cls='')=>`<img class="${cls}" src="${embeddedReferenceImages[name]||'assets/reference/'+name+'.png'}" alt="" draggable="false">`;
const cardArtworkBeforeEmbedded=cardArtwork;cardArtwork=function(card){return cardArtworkBeforeEmbedded(card).replace(/src="assets\/reference\/(card-brand|visa)\.png"/g,(_,name)=>'src="'+embeddedReferenceImages[name]+'"')};
function prepareVisibleGlyphs(){document.querySelectorAll('#app img[src],#nav img[src],#modal img[src]').forEach(img=>{const source=img.getAttribute('src');if(embeddedAssetImages[source]){img.src=embeddedAssetImages[source];img.loading='eager';img.decoding='sync'}});document.querySelectorAll('#app img[src^="assets/reference/"],#nav img[src^="assets/reference/"]').forEach(image=>{const name=image.getAttribute('src').split('/').at(-1).replace(/\.png$/,'');if(embeddedReferenceImages[name]){image.src=embeddedReferenceImages[name];image.loading='eager'}});document.querySelectorAll('#app img.icon[src^="assets/icons/"],#nav img.icon[src^="assets/icons/"]').forEach(image=>{const name=image.getAttribute('src').split('/').at(-1).replace(/\.svg$/,'');if(!embeddedIconMarkup[name])return;const template=document.createElement('template');template.innerHTML=embeddedIconMarkup[name];const svg=template.content.firstElementChild;svg.setAttribute('class',image.className);svg.style.cssText=image.style.cssText;image.replaceWith(svg)})}
// Preserve the complete account-page swipe from the recorded interaction.
function remainingLimitColor(ratio){const value=Math.max(0,Math.min(1,ratio)),hue=value<.5?value*60:30+(value-.5)*180;return `hsl(${hue} 83% 53%)`}
limitRow=function(title,value,max,image){const amount=text=>Number(String(text).replace(/\s/g,'')),ratio=Math.max(0,Math.min(1,amount(value)/Math.max(1,amount(max))));return `<div class="reference-limit-row">${referenceImage(image)}<div><span>${title}</span><p><strong>Залишилось ${value} ₴</strong> / ${max} ₴</p><div class="reference-limit-track" role="progressbar" aria-valuemin="0" aria-valuemax="${amount(max)}" aria-valuenow="${amount(value)}"><i data-limit-ratio="${ratio}" style="transform:scaleX(${ratio});background:${remainingLimitColor(ratio)}"></i></div></div></div>`};
function animateLimitIndicators(){document.querySelectorAll('[data-limit-ratio]').forEach(fill=>{const ratio=Number(fill.dataset.limitRatio),color=remainingLimitColor(ratio);fill.style.background=color;fill.style.boxShadow='none';if(!shouldReduceMotion())fill.animate([{transform:'scaleX(1)',backgroundColor:color},{transform:`scaleX(${ratio})`,backgroundColor:color}],{duration:300,easing:'cubic-bezier(.23,1,.32,1)'})});const progress=document.querySelector('.internet-limit progress');if(progress){const card=activeCard(),settings=state.cardSettings[card.id]||{},maximum=Number(settings.limit??10000),spent=internetSpentSinceReset(card.id,settings),ratio=settings.online===false||maximum<=0?0:Math.max(0,1-spent/maximum);progress.value=ratio*100;progress.style.setProperty('--limit-color',remainingLimitColor(ratio))}}
const flipBeforeLimitColors=actions['flip-card'];actions['flip-card']=()=>{flipBeforeLimitColors();animateLimitIndicators()};
const renderBeforeMobileStability=render;render=function(){renderBeforeMobileStability();prepareVisibleGlyphs();animateLimitIndicators()};
let restingViewportHeight=innerHeight;
function updateInstalledViewport(){
 const root=document.documentElement,viewport=window.visualViewport;
 root.style.setProperty('--visible-height',(viewport?.height||innerHeight)+'px');
 const editing=document.activeElement?.matches('input,textarea,[contenteditable=true]');
 if(!editing)restingViewportHeight=innerHeight;else restingViewportHeight=Math.max(restingViewportHeight,innerHeight);
 const keyboard=!!editing&&restingViewportHeight-(viewport?.height||innerHeight)>120;
 root.classList.toggle('keyboard-open',keyboard);
 root.style.setProperty('--app-height',(keyboard?restingViewportHeight:innerHeight)+'px');
 if(route.page==='transferAmount'&&!document.querySelector('#modal')?.open){
  const host=document.querySelector('.pwa-scroll');if(host?.scrollTop)host.scrollTop=0;if(window.scrollY)window.scrollTo(0,0);
 }
 const nav=document.querySelector('#nav'),height=nav.getBoundingClientRect().height;
 if(height>0)root.style.setProperty('--nav-height',height+'px');
}
window.addEventListener('resize',updateInstalledViewport,{passive:true});window.visualViewport?.addEventListener('resize',updateInstalledViewport,{passive:true});window.addEventListener('pageshow',()=>requestAnimationFrame(updateInstalledViewport));document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(updateInstalledViewport));
// Show only the ready entry screen (or ready admin), never a transient loading row.
let stableGlyphsReady=false;Promise.all([...readyReferenceImages,...readyAssetImages,...readyCharacterImages].map(img=>img.decode().catch(()=>{}))).then(()=>{stableGlyphsReady=true;releaseStableBoot()});
let stableBootReleasePending=false;
function releaseStableBoot(){
 if(loading||!stableGlyphsReady||stableBootReleasePending||document.documentElement.dataset.runtimeReady!=='true'||!document.documentElement.classList.contains('booting'))return;
 const entry=document.querySelector('.entry-overlay');if(!adminMode&&entry&&entry.dataset.ready!=='true')return;
 const images=[...document.querySelectorAll('#app img,#nav img,.entry-overlay img')].filter(image=>{const r=image.getBoundingClientRect();return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight});
 stableBootReleasePending=true;Promise.all(images.map(image=>image.decode().catch(()=>{}))).then(()=>{stableBootReleasePending=false;if(loading)return;document.documentElement.classList.remove('booting');bootObserver.disconnect();window.dismissLaunchSplash?.()});
}
const bootObserver=new MutationObserver(releaseStableBoot);bootObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ready']});document.addEventListener('DOMContentLoaded',()=>setTimeout(releaseStableBoot,0));

document.documentElement.dataset.appVersion='60';
const settingsBeforeBuildLabel=appSettingsPage;appSettingsPage=function(){return settingsBeforeBuildLabel()+'<p class="build-version">Версія 60</p>'};

// Sense has its own full-size identity; transfer badges belong to other banks.
const recipientBeforeFullSense=recipientPicture;recipientPicture=function(person){const bank=bankPreset(person);return bank.id==='sense'?`<img class="sense-full-logo" src="${bank.logo}" alt="Sense Bank" draggable="false">`:recipientBeforeFullSense(person)};
const detailBeforeFullSense=detail;detail=function(){const html=detailBeforeFullSense(),tx=currentTx();if(!tx||bankPreset(tx).id!=='sense')return html;const template=document.createElement('template');template.innerHTML=html;const avatar=template.content.querySelector('.reference-operation-avatar');if(avatar){avatar.classList.add('sense-bank-icon');avatar.innerHTML=recipientPicture(tx)}return template.innerHTML};

function internetSpentSinceReset(cardId,settings){const previous=new Set(settings.limitBaselineIds||[]);return txFor(cardId).filter(tx=>tx.amount<0&&tx.date===today()&&!previous.has(tx.id)&&(tx.paymentChannel==='online'||tx.online===true||operationBank(tx)==='merchant')&&(!settings.limitResetAt||Number(tx.createdAt||new Date(tx.date+'T'+(tx.time||'00:00')).getTime())>=settings.limitResetAt)).reduce((total,tx)=>total-tx.amount,0)}

for(const page of ['transfer','transferAmount','transferArchive'])sidePages.add(page);
surfaces.transferArchive=function(){const transfers=txFor().filter(tx=>tx.amount<0&&['mono','other'].includes(operationBank(tx)));return toolbar('Архів')+`<div class="page transfer-archive">${rows(transfers)}</div>`};
// Generate wardrobe markup with the already decoded sources, before insertion.
const wardrobeBeforeReadyImages=wardrobeItems;wardrobeItems=function(){return wardrobeBeforeReadyImages().replace(/src="([^"]+)"/g,(match,src)=>embeddedAssetImages[src]?`src="${embeddedAssetImages[src]}" decoding="sync"`:match)};
const bankBadgeBeforeReadyImages=bankBadge;bankBadge=function(person){return bankBadgeBeforeReadyImages(person).replace(/src="([^"]+)"/g,(match,src)=>embeddedAssetImages[src]?`src="${embeddedAssetImages[src]}" decoding="sync"`:match)};
const bankPresetBeforeDecodedArtwork=bankPreset;bankPreset=function(person){const bank=bankPresetBeforeDecodedArtwork(person);return embeddedAssetImages[bank.logo]?{...bank,logo:embeddedAssetImages[bank.logo]}:bank};

// A bounded ease-out avoids waiting for a spring's invisible settling tail.
function settleCardStrip(read,write,target,complete){const start=performance.now(),from=read();let frame=0,stopped=false;const tick=now=>{if(stopped)return;const p=Math.min(1,(now-start)/220);write(from+(target-from)*(1-Math.pow(1-p,3)));if(p<1)frame=requestAnimationFrame(tick);else complete()};frame=requestAnimationFrame(tick);return {cancel(){stopped=true;cancelAnimationFrame(frame)},finish(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);write(target);complete()}}}


function readyTransactionRow(tx,description=null){const incoming=tx.amount>0,bank=bankPreset(tx),portrait=monoPortrait(tx);let className='transaction-icon',art='';if(portrait){className+=' recipient-photo';art=`<img src="${esc(portrait)}" alt="" decoding="sync">`}else if(bank.id==='sense'){className+=' sense-bank-icon';art=`<img src="${bank.logo}" alt="Sense Bank" decoding="sync">`}else if(incoming&&bank.id!=='mono'&&bank.logo){className+=' incoming-bank-icon';art=`<img src="${bank.logo}" alt="${esc(bank.name)}" decoding="sync">`}else if(incoming){className+=' income';art=tx.logo?`<img class="merchant-logo" src="${esc(embeddedAssetImages[tx.logo]||tx.logo)}" alt="" decoding="sync">`:referenceImage('incoming-symbol')}else if(['mono','other'].includes(operationBank(tx))||tx.bankId||tx.bankName){className+=' bank-transfer-icon';art=transferSymbol()+bankBadge(tx)}else{const coffee=tx.category==='Кафе та ресторани';className+=coffee?' coffee':' shop';art=tx.logo?`<img class="merchant-logo" src="${esc(embeddedAssetImages[tx.logo]||tx.logo)}" alt="" decoding="sync">`:icon(tx.icon||(coffee?'coffee-fill':'credit-card-fill'))}return `<button class="transaction" data-action="tx" data-id="${esc(tx.id)}"><span class="${className}">${art}</span><span class="tx-content"><strong>${esc(tx.title)}</strong>${description!==null?`<small>${esc(description)}</small>`:route.page!=='home'?`<small>${esc(tx.note||tx.category||'Переказ')}</small>`:''}</span><span class="tx-amount ${incoming?'green':''}">${incoming?'+':'−'}${displayMoney(Math.abs(tx.amount))} ₴</span></button>`}
rows=function(items){return items.map(tx=>readyTransactionRow(tx)).join('')||empty('Поки немає операцій','Тут з’явиться історія демонстраційних платежів.')};
operationHistoryRows=function(items,allAccounts=false){let previous='';return [...items].sort(compareTransactions).map(tx=>{let heading='';if(previous!==tx.date){previous=tx.date;heading=`<h3 class="date-heading">${esc(operationDateHeading(tx.date))}</h3>`}let description=null;if(allAccounts){const card=allCards().find(card=>card.id===(tx.cardId||'main'))||mainCard(),name=card.account;description=tx.amount>0?'На мою '+name.replace(/ картка$/,'').replace(/^Чорна/,'чорну').replace(/^Біла/,'білу'):'З '+name.replace(/^Чорна/,'Чорної').replace(/^Біла/,'Білої').replace(/ картка$/,' картки')}return heading+readyTransactionRow(tx,description)}).join('')||empty('Операцій не знайдено','Спробуйте інший запит.')};
const historyRowsBeforeMemo=operationHistoryRows;
let historyRowsSource=null;const historyRowsCache=new Map();
operationHistoryRows=function(items,allAccounts=false){if(historyRowsSource!==state.transactions){historyRowsSource=state.transactions;historyRowsCache.clear()}const key=String(allAccounts)+'|'+state.activeCard+'|'+items.map(tx=>[tx.id,tx.amount,tx.title,tx.note,tx.date,tx.time,tx.cardId,tx.bankId,tx.bankName,tx.favorite,tx.recipientAvatar?.length,tx.logo?.length].join(':')).join('|');if(historyRowsCache.has(key))return historyRowsCache.get(key);const html=historyRowsBeforeMemo(items,allAccounts);if(historyRowsCache.size>=8)historyRowsCache.clear();historyRowsCache.set(key,html);return html};
const updateHistoryBeforeStableMarkup=updateOperationHistory;
updateOperationHistory=function(){if(route.page==='history'&&glassHistoryChanging&&glassHistory?.sheet)return;if(glassHistory?.historyFilling){glassHistory.historyFilling=false;glassHistory.historyFillToken=null}const list=document.querySelector('#tx-list');const key=String(historyFavoritesActive)+'|'+JSON.stringify(historyReferenceFilter)+'|'+(document.querySelector('#search')?.value||'')+'|'+state.activeCard+'|'+historyPresentation+'|'+state.transactions.map(tx=>[tx.id,tx.amount,tx.title,tx.note,tx.favorite,tx.date,tx.cardId].join(':')).join('|');if(list?._historyKey===key)return;if(list&&list._historyKey===undefined&&!historyFavoritesActive&&historyReferenceFilter.direction==="all"&&!historyReferenceFilter.tag&&!historyReferenceFilter.start&&!historyReferenceFilter.end&&!document.querySelector("#search")?.value){list._historyKey=key;return}updateHistoryBeforeStableMarkup();if(list)list._historyKey=key};

const historyBeforeViewportPreview=historyPage;
historyPage=function(){if(route.page!=='history'||historyPresentation!=='drawer'||!glassHistoryChanging||!glassHistory?.sheet)return historyBeforeViewportPreview();const full=state.transactions;try{state.transactions=[...full].sort(compareTransactions).slice(0,12);return historyBeforeViewportPreview()}finally{state.transactions=full}};
function fillHistoryInChunks(scene){const list=document.querySelector('#tx-list');if(!list||historyFavoritesActive)return;const items=[...state.transactions].sort(compareTransactions);if(items.length<=12)return;let offset=12;const token={};scene.historyFillToken=token;scene.historyFilling=true;const append=()=>{if(scene.historyFillToken!==token||glassHistory!==scene||route.page!=='history'||!list.isConnected)return;const batch=items.slice(offset,offset+12);let html=operationHistoryRows(batch,true);if(offset&&items[offset-1]?.date===batch[0]?.date)html=html.replace(/^<h3 class="date-heading">[\s\S]*?<\/h3>/,'');list.insertAdjacentHTML('beforeend',html);offset+=batch.length;if(offset<items.length)requestAnimationFrame(append);else{scene.historyFilling=false;scene.historyFillToken=null}};requestAnimationFrame(append)}

const renderBeforeScrollAndWardrobe=render;render=function(){renderBeforeScrollAndWardrobe();if(pendingRouteScroll!==null){const scroll=pendingRouteScroll;pendingRouteScroll=null;pageScrollTo({top:scroll,behavior:'instant'})}if(route.page==='appearance'){const existing=document.querySelector('.character-reference-cover>img'),ready=readyCharacterImages[0];if(existing&&ready.complete&&ready.naturalWidth){ready.alt='Кіт у вишиванці';ready.className='wardrobe-character';ready.decoding='sync';existing.replaceWith(ready)}}};
// The large decoded wardrobe artwork appears at full opacity, without a page clone.
sidePages.add('appearance');

// Amount entry owns its viewport; focusing a field must not scroll the whole PWA.
document.addEventListener('focusin',e=>{if(e.target.closest('.amount-entry-page'))requestAnimationFrame(updateInstalledViewport)});document.addEventListener('focusout',()=>requestAnimationFrame(updateInstalledViewport));window.visualViewport?.addEventListener('scroll',()=>{if(route.page==='transferAmount')updateInstalledViewport()},{passive:true});
