'use strict';
// Screens measured against the supplied 1170px screenshots and recordings.
const noticeAsset=n=>`<img src="assets/reference/notice-${n}.png" alt="" decoding="sync">`;
function referenceNotices(){const list=state.notificationsList||[];if(list.length&&!(list.length<=3&&list.every(n=>String(n.id).startsWith('reference-message'))))return list;return [{id:'ref-rewards',title:'Таємні Бокси за нагороди',text:'А в них iPhone, картка Platinum чи промокоди — це до 30 листопада.',kind:'trophy',read:true},...Array.from({length:7},(_,i)=>i===2?{id:'ref-delivery',title:'Безкоштовна доставка',text:'Першого замовлення з Базару',kind:'delivery',read:true}:{id:'ref-security-'+i,title:'Платіж відхилено з метою безпеки',text:'Будь ласка, зверніть увагу',kind:'bell',read:true})]}
let notificationQuery='';
function referenceNotificationRows(){const query=notificationQuery.trim().toLocaleLowerCase('uk');return referenceNotices().filter(n=>(n.title+' '+n.text).toLocaleLowerCase('uk').includes(query)).map(n=>`<button class="notification-row ${n.read!==false?'is-read':''}" data-action="notification-info" data-id="${esc(n.id)}"><span class="notification-reference-icon">${n.kind?noticeAsset(n.kind):`<span class="service-symbol ${esc(n.color||'orange')}">${icon(n.icon||'gift-fill')}</span>`}</span><span><strong>${esc(n.title)}</strong><small>${esc(n.text)}</small></span></button>`).join('')||'<p class="notification-empty">Повідомлень не знайдено</p>'}
notificationsPage=function(){return toolbar('',`<button class="right" data-action="notification-search" aria-label="Пошук повідомлень">${icon('magnifying-glass')}</button>`)+`<div class="page notification-page notification-reference"><h1>Повідомлення</h1><div class="notification-search-field" hidden><input type="search" aria-label="Пошук повідомлень" placeholder="Пошук"></div><div class="notification-shortcuts"><button data-action="notice-terms"><span>${noticeAsset('terms')}</span>Умови та<br>правила</button><button data-action="notice-cashback"><span>${noticeAsset('cashback')}</span>Оновлення<br>кешбеку</button></div><h2>Всі прочитані</h2><div id="notification-list">${referenceNotificationRows()}</div></div>`};surfaces.notifications=notificationsPage;
actions['notification-search']=()=>{const field=$('.notification-search-field');field.hidden=!field.hidden;if(!field.hidden){const input=field.querySelector('input');input.value=notificationQuery;input.oninput=()=>{notificationQuery=input.value;$('#notification-list').innerHTML=referenceNotificationRows()};input.focus()}};
actions['notice-terms']=()=>inform('Умови та правила','Демонстраційний інтерфейс за наданими записами. Банківські послуги не надаються.');actions['notice-cashback']=()=>navigate('cashback');
const notificationBeforeReference=actions['notification-info'];actions['notification-info']=b=>{const n=referenceNotices().find(n=>n.id===b.dataset.id);if(!n)return notificationBeforeReference(b);navigate('notificationDetail',n.id)};
surfaces.notificationDetail=function(){const n=referenceNotices().find(n=>n.id===route.id);return toolbar('')+`<article class="page notification-detail"><span class="notification-reference-icon">${n?.kind?noticeAsset(n.kind):icon(n?.icon||'gift-fill')}</span><h1>${esc(n?.title||'Повідомлення')}</h1><p>${esc(n?.text||'Повідомлення не знайдено.')}</p></article>`};
creditPage=function(){return `<div class="credit-reference"><h1>Кредити</h1><section><img src="assets/reference/credit-heart.png" alt=""><div><h2>На жаль, не можемо надати вам ліміт зараз</h2><p>Але ви можете вплинути на це, розповівши про себе</p><button data-action="credit-demo-information">Надати інформацію</button></div></section></div>`};
function serviceReference(name,sub,image,action='service',extra=''){return `<button class="service-reference-row" data-action="${action}" data-service="${esc(name)}" ${extra}><img src="assets/reference/service-${image}.png" alt=""><span>${name}<small>${sub}</small></span></button>`}
morePage=function(){return `<div class="more-reference"><h1>Ще</h1><section class="more-reference-shortcuts">${[['Запросити<br>друга','invite','service'],['Служба<br>підтримки','support','nav'],['Сканер<br>QR-коду','scan','service']].map(([name,img,action])=>`<button data-action="${action}" data-page="support" data-service="${name.replace('<br>',' ')}"><img src="assets/reference/service-${img}.png" alt=""><span>${name}</span></button>`).join('')}</section><section class="more-reference-group">${serviceReference('Мобільний зв’язок','eSIM та керування номерами','phone')}${serviceReference('Заправка на WOG','Не виходячи з авто','fuel')}${serviceReference('Програми лояльності','Накопичення бонусів','loyalty')}${serviceReference('Замовлення готівки','Зняття у касі банку-партнера','cash')}</section><section class="more-reference-group">${serviceReference('Про безпеку в mono','Запобігання шахрайству','security')}${serviceReference('monoКЕП','Ваш електронний підпис','signature')}</section></div>`};
const appearanceBeforeSourceQuality=appearance;appearance=function(){return appearanceBeforeSourceQuality().replace('class="character-cover"','class="character-cover character-reference-cover"').replace('src="assets/profile-character.png"','src="assets/reference/character-cutout-v49.png"')};
const photoBeforeSourceQuality=photoChoicePage;photoChoicePage=function(poster=false){return photoBeforeSourceQuality(poster).replace('assets/reference/character-poster.png','assets/reference/character-poster-hq.png')};
// Native-style entry layout from the recorded four-dot keypad screen.
let nativePin='',nativePinReset=null;
const faceMarkup='<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M24 6H12a6 6 0 0 0-6 6v12m50-18h12a6 6 0 0 1 6 6v12M6 56v12a6 6 0 0 0 6 6h12m32 0h12a6 6 0 0 0 6-6V56M25 28v8m30-8v8M40 28v18h-6m-7 8q13 12 26 0"/></svg>';
function unlockNativeEntry(){clearTimeout(entryScanTimer);clearTimeout(nativePinReset);entryScanTimer=null;document.querySelector('.entry-overlay')?.remove();$('#app').inert=false;$('#nav').inert=false;nativePin=''}
function updateNativeDots(error=false){document.querySelectorAll('.native-pin-dots i').forEach((el,i)=>{el.classList.toggle('filled',i<nativePin.length);el.classList.toggle('wrong',error)});const text=$('.native-pin-instruction');if(text){text.textContent=error?'Невірний ПІН-код':'Уведіть ПІН-код';text.classList.toggle('wrong',error)}}
function pressNativePin(value){if(!document.querySelector('.entry-native')||cabinetStorage.getItem('demo-face')==='1')return;if(value==='delete')nativePin=nativePin.slice(0,-1);else if(/^\d$/.test(value)&&nativePin.length<4)nativePin+=value;updateNativeDots();if(nativePin.length===4){if(nativePin===cabinetStorage.getItem('demo-pin'))unlockNativeEntry();else{updateNativeDots(true);clearTimeout(nativePinReset);nativePinReset=setTimeout(()=>{nativePin='';updateNativeDots()},500)}}}
showEntry=function(){if(adminMode)return;if($('#modal')?.open)$('#modal').close();let layer=$('.entry-overlay');const face=cabinetStorage.getItem('demo-face')==='1';if(layer&&!layer.classList.contains('entry-native'))layer.remove(),layer=null;if(!layer){nativePin='';layer=document.createElement('div');layer.className='entry-overlay entry-native';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label',face?'Face ID · демонстрація':'Вхід за ПІН-кодом');const firstName=String(state.name||'').trim().split(' ')[0];layer.innerHTML=`<div class="native-entry-identity"><span class="native-entry-avatar">${state.avatar?`<img src="${esc(state.avatar)}" alt="Фото профілю">`:icon('cat-fill')}</span><h1>З поверненням${firstName?', '+esc(firstName):''}!</h1>${face?'':`<p class="native-pin-instruction" aria-live="polite">Уведіть ПІН-код</p><div class="native-pin-dots" aria-label="Чотири цифри ПІН-коду"><i></i><i></i><i></i><i></i></div>`}</div>${face?`<div class="native-face-dialog" aria-live="polite"><div class="native-face-orb"><svg viewBox="0 0 80 80" fill="none" stroke="#50c4ff" stroke-width="1.6"><circle cx="40" cy="40" r="29"/><ellipse cx="40" cy="40" rx="15" ry="29"/><ellipse cx="40" cy="40" rx="29" ry="13"/><ellipse cx="40" cy="40" rx="23" ry="28" transform="rotate(45 40 40)"/></svg></div><span>Face ID</span></div>`:`<div class="native-entry-keypad">${['1','2','3','4','5','6','7','8','9','face','0','delete'].map(value=>`<button type="button" class="native-key ${/\d/.test(value)?'number-key':''}" data-pin-key="${value}" aria-label="${value==='delete'?'Видалити цифру':value==='face'?'Face ID':value}">${value==='face'?faceMarkup:value==='delete'?'<svg viewBox="0 0 32 24" aria-hidden="true"><path d="M10 3H28v18H10L2 12Z" fill="currentColor"/><path d="m16 8 8 8m0-8-8 8" stroke="#222" stroke-width="1.5"/></svg>':value}</button>`).join('')}</div><button class="native-forgot-pin">Забули ПІН-код?</button>`}`;document.body.append(layer);$('#app').inert=true;$('#nav').inert=true;layer.querySelectorAll('[data-pin-key]').forEach(button=>button.onclick=()=>{const value=button.dataset.pinKey;if(value==='face')inform('Face ID','Спосіб входу змінюється у налаштуваннях застосунку. Це демонстраційний екран.');else pressNativePin(value)});layer.querySelector('.native-forgot-pin')?.addEventListener('click',()=>inform('Забули ПІН-код?','Це демонстраційний ПІН-код, заданий вами в налаштуваннях цього пристрою. Дані та спосіб входу не пов’язані з банком.'))}
 if(face&&document.visibilityState==='visible'&&!entryScanTimer){$('.native-face-dialog')?.classList.remove('recognized');entryScanTimer=setTimeout(()=>{const dialog=$('.native-face-dialog');dialog?.classList.add('recognized');entryScanTimer=setTimeout(unlockNativeEntry,180)},900)}
};
document.addEventListener('keydown',e=>{if(!$('.entry-native')||$('#modal').open)return;if(/^\d$/.test(e.key)||e.key==='Backspace'){e.preventDefault();pressNativePin(e.key==='Backspace'?'delete':e.key)}});
clearTimeout(entryScanTimer);entryScanTimer=null;const replacingEntry=!!$('.entry-overlay');if(replacingEntry){$('.entry-overlay').remove();showEntry()}actions['lock-demo']=()=>showEntry();
// Keep the overview and its backdrop at their final sizes throughout the fade.
let allCardsScene=null;
function clearAllCardsScene(scene){
 if(!scene)return;
 scene.backdrop.remove();
 scene.exit?.remove();
 scene.motion?.cancel();
 scene.exitMotion?.cancel();
 scene.backdropMotion?.cancel();
 if(allCardsScene===scene)allCardsScene=null;
}
const paintBeforeCardsOverview=paint;
paint=function(direction){
 const app=$('#app'),screen=$('#screen'),leaving=app.classList.contains('cards');
 if(adminMode)return paintBeforeCardsOverview(direction);
 const timing={duration:shouldReduceMotion()?100:220,easing:'ease-out',fill:'both'};
 if(route.page==='cards'&&!leaving){
  clearAllCardsScene(allCardsScene);
  const backdrop=freezePageSurface();
  backdrop.className='all-cards-backdrop home';
  Object.assign(backdrop.style,{zIndex:'35',maxHeight:innerHeight+'px',opacity:'.65',filter:'blur(14px)'});
  document.body.append(backdrop);
  render();
  app.classList.add('overview-visible');
  const scene={backdrop,motion:screen.animate([{opacity:0},{opacity:1}],timing)};
  allCardsScene=scene;
  scene.motion.finished.then(()=>scene.motion.cancel(),()=>{});
  return;
 }
 if(leaving&&route.page!=='cards'&&allCardsScene){
  const scene=allCardsScene,opacity=getComputedStyle(screen).opacity;
  const exit=freezePageSurface();
  exit.className='all-cards-exit cards';
  Object.assign(exit.style,{zIndex:'43',maxHeight:innerHeight+'px'});
  scene.motion?.cancel();
  document.body.append(exit);
  render();
  scene.exit=exit;
  scene.exitMotion=exit.animate([{opacity},{opacity:0}],timing);
  scene.backdropMotion=scene.backdrop.animate([{opacity:.65},{opacity:0}],timing);
  scene.exitMotion.finished.then(()=>clearAllCardsScene(scene),()=>{});
  return;
 }
 return paintBeforeCardsOverview(direction);
};
// Card details keep the recorded grouping and the user's current card data.
const cardBeforeReferenceGrouping=cardPage;cardPage=function(){let html=cardBeforeReferenceGrouping();html=html.replace('data-page="regular"','data-page="subscriptions"').replace('Керування списаннями з картки','Керування списаннями з картки');return html};
// History search exposes the controls shown in the latest recording.
const historySearchBeforeReference=actions['history-search'];actions['history-search']=()=>{const search=$('.history-search');if(!search)return;search.hidden=!search.hidden;$('.all-operations-page')?.classList.toggle('history-searching',!search.hidden);if(!search.hidden){const input=search.querySelector('input');input?.focus();if(!search.querySelector('.history-search-close'))search.insertAdjacentHTML('beforeend',`<button class="history-search-close" data-action="history-search" aria-label="Закрити пошук">${icon('x')}</button>`)}else{const input=search.querySelector('input');if(input)input.value='';updateOperationHistory()}};
const renderBeforeNativeReference=render;render=function(){renderBeforeNativeReference();if(!adminMode&&route.page==='history'&&historyFavoritesActive&&!$('.transaction')){const list=$('#tx-list');if(list)list.innerHTML=referenceEmptyFavorites()}if($('.entry-native')&&!$('.native-entry-avatar img')&&state.avatar){$('.native-entry-avatar').innerHTML=`<img src="${esc(state.avatar)}" alt="Фото профілю">`;const title=$('.native-entry-identity h1');if(title)title.textContent='З поверненням, '+String(state.name).split(' ')[0]+'!'}};
render();
function referenceEmptyFavorites(){return '<div class="reference-favorites-empty"><img src="assets/reference/favorites-cat-hq.png" alt="Кіт із зіркою"><h2>Обраних транзакцій немає</h2><p>Тут будуть відображатися обрані транзакції</p></div>'}
let historyReferenceFilter={direction:'all',tag:'',start:'',end:''};
updateOperationHistory=function(){const all=historyPresentation==='drawer',query=($('#search')?.value||'').toLowerCase(),f=historyReferenceFilter,items=(all?state.transactions:txFor()).filter(t=>(!historyFavoritesActive||t.favorite)&&(t.title+' '+(t.note||'')).toLowerCase().includes(query)&&(f.direction==='all'||(f.direction==='income'?t.amount>0:t.amount<0))&&(!f.tag||String(t.tag||'').toLowerCase().includes(f.tag.toLowerCase()))&&(!f.start||t.date>=f.start)&&(!f.end||t.date<=f.end));const list=$('#tx-list');if(list)list.innerHTML=historyFavoritesActive&&!items.length?referenceEmptyFavorites():operationHistoryRows(items,all)};
const searchBeforeFilterButtons=actions['history-search'];actions['history-search']=()=>{searchBeforeFilterButtons();const search=$('.history-search');if(!search||search.hidden||search.querySelector('.history-filter-tools'))return;search.querySelector(':scope>.icon')?.remove();search.insertAdjacentHTML('afterbegin',`<div class="history-filter-tools"><button data-action="history-filter-options" aria-label="Фільтри">${icon('chart-bar-fill')}</button><button data-action="history-filter-tags" aria-label="Теги">#</button><button data-action="history-filter-period" aria-label="Період">${icon('calendar')}</button></div>`)};
actions['history-filter-options']=()=>modal('Фільтри операцій',select('Тип операції','direction',[['all','Усі операції'],['income','Надходження'],['expense','Витрати']],historyReferenceFilter.direction),f=>{historyReferenceFilter.direction=f.get('direction')});
actions['history-filter-tags']=()=>modal('Теги',field('Тег','tag',historyReferenceFilter.tag,'text','maxlength="40"'),f=>{historyReferenceFilter.tag=String(f.get('tag')||'').trim()});
actions['history-filter-period']=()=>modal('Період',field('Від','start',historyReferenceFilter.start,'date')+field('До','end',historyReferenceFilter.end,'date'),f=>{const start=String(f.get('start')||''),end=String(f.get('end')||'');if(start&&end&&start>end)throw Error('Дата початку має бути раніше дати завершення');Object.assign(historyReferenceFilter,{start,end})});
const favoritesBeforeContentMotion=actions['history-favorites'];actions['history-favorites']=button=>{favoritesBeforeContentMotion(button);const list=$('#tx-list');if(list&&!shouldReduceMotion())list.animate([{opacity:.55,transform:'translate3d(12px,0,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'})};
const cardBeforeNativeIcons=cardPage;cardPage=function(){const template=document.createElement('template');template.innerHTML=cardBeforeNativeIcons();const payment=template.content.querySelector('.payment-settings>.icon');if(payment)payment.outerHTML='<img class="icon" src="assets/reference/gear.png" alt="">';const block=template.content.querySelector('[data-action=toggle-block]>.icon');if(block)block.outerHTML='<img class="icon" src="assets/reference/lock-key.png" alt="">';const subscription=template.content.querySelector('[data-page=subscriptions]>.icon');if(subscription)subscription.outerHTML='<svg class="icon subscription-mark" viewBox="0 0 28 28" aria-hidden="true"><text x="2" y="22">@</text></svg>';return template.innerHTML};
