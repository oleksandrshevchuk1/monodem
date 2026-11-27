'use strict';
document.addEventListener('dragstart',e=>{if(e.target.closest('.card-track,.stats-carousel'))e.preventDefault()});
const referenceIcons=new Set(['cat-fill','gift-fill','chart-bar-fill','chat-circle-fill','credit-card-fill','receipt-fill','stack-fill','gear','lock-key']);
const libraryIcon=icon;
icon=n=>n==='chat-circle-fill'?`<svg class="icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M16 3a13 13 0 0 0-10.3 21L3.4 29l7.1-1.5A13 13 0 1 0 16 3Zm-5.8 13.2a1.8 1.8 0 0 1 2.4.7c1.5 2.6 5.3 2.6 6.8 0a1.8 1.8 0 1 1 3.1 1.8c-2.9 5-10.1 5-13 0a1.8 1.8 0 0 1 .7-2.5Z"/></svg>`:referenceIcons.has(n)?`<img class="icon" src="assets/reference/${n}.png" alt="" aria-hidden="true">`:libraryIcon(n);
const libraryUIIcon=uiIcon;
uiIcon=n=>n==='apple-native'?`<img class="icon" src="assets/reference/apple-native.png" alt="" aria-hidden="true">`:libraryUIIcon(n);
const drawnCard=cardArtwork;
cardArtwork=c=>drawnCard(c).replace('<div class="bank-card-front">','<div class="bank-card-front"><span class="card-glint" aria-hidden="true"></span>').replace('<div class="card-back-number">'+esc(c.card)+'</div>','<span class="card-expiry" aria-label="Демонстраційний термін дії">'+esc(state.cardSettings?.[c.id]?.demoExpiry||'11/30')+'</span><div class="card-back-number"><span class="card-demo-cvv" aria-label="Демонстраційний CVV">'+esc(state.cardSettings?.[c.id]?.demoCVV||'000')+'</span></div>').replace('<span class="card-holder">','<span class="card-printed-number">'+'<span class="card-number-full">'+esc(c.card||'')+'</span><span class="card-number-masked">'+esc((c.card||'').replace(/^(\d{4})[\s\d]*?(\d{4})$/,'$1 **** **** $2'))+'</span></span><span class="card-holder">').replace(/<div class="card-brand">[\s\S]*?<\/div>/,'<div class="card-brand"><img src="assets/reference/card-brand.png" width="352" height="78" decoding="sync" alt="monobank · Universal Bank"></div>').replace('<span class="visa">VISA</span>','<span class="visa"><img src="assets/reference/visa.png" width="192" height="63" decoding="sync" alt="Visa"></span>');
let newCardSelected=false,cardSlideAnimation,carouselIndex=0,refreshGesture=null;
appearance=function(){return `<div class="character-cover"><div class="toolbar"><button class="back" data-action="back" aria-label="Назад">${icon('arrow-left')}</button></div><img src="assets/profile-character.png" alt="Повний видимий у відео персонаж у вишиванці"></div><div class="character-actions"><button data-action="avatar-info">${icon('image')}Змінити фото</button><button data-action="download-character">${icon('download-simple')}Завантажити</button></div><div class="page achievement-page"><div class="achievement-trophy">${icon('star-fill')}</div><h2>Відкрито ${Number(state.achievementCount)||0} нагород з ${Number(state.achievementTotal)||123}</h2><div class="achievement-list">${['Знайомство','Еліта','Попутник','','',''].map((n,i)=>`<button data-action="achievement" data-title="${n||'Нагорода'}"><img src="assets/achievement-${i}.png" alt="${n}"><span>${n}</span></button>`).join('')}</div></div>`};
actions['avatar-info']=()=>inform('Фото профілю','Фото профілю змінюється в окремій адмінці проєкту.');
actions['download-character']=async()=>{const response=await fetch('assets/profile-character.png');download(await response.blob(),'demo-character.png')};
const basicHome=home;
const cardWhite=c=>c.color?c.color==='white':c.id==='white';
function selector(){
 const index=newCardSelected?allCards().length:allCards().findIndex(card=>card.id===activeCard().id);
 return `<button class="card-selector${!shouldReduceMotion()&&performance.now()<cardSelectorVisibleUntil?' show-card-indicator':''}" data-action="nav" data-page="cards" aria-label="Усі картки"><span class="selector-label" aria-hidden="true"><svg class="icon" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><path d="m2 5 7.1-3.3a2.3 2.3 0 0 1 3.1 1.1l.6 1.2H7.3A4.3 4.3 0 0 0 3 8.3v2.8L.9 7.8A2 2 0 0 1 2 5Z"/><path fill-rule="evenodd" d="M7.1 5.4h7a2.7 2.7 0 0 1 2.7 2.7v5.1a2.7 2.7 0 0 1-2.7 2.7h-7a2.7 2.7 0 0 1-2.7-2.7V8.1a2.7 2.7 0 0 1 2.7-2.7Zm-.4 3.2c0 .4.3.7.7.7h6.3a.7.7 0 1 0 0-1.4H7.4a.7.7 0 0 0-.7.7Z"/></svg>Усі картки</span><span class="selector-dots" aria-hidden="true" data-index="${index}">${cardIndicatorMarkers(index)}</span></button>`;
}
function cardSlides(){return `<div class="card-stage card-carousel" id="card-swipe"><div class="card-track">${allCards().map(c=>`<div class="card-slide"><button class="card-face" data-action="show-card" data-id="${c.id}" aria-label="Відкрити ${esc(c.account)}">${cardArtwork(c)}</button></div>`).join('')}<div class="card-slide"><button class="card-face new-card-face" data-action="open-card" aria-label="Відкрити нову картку"><span>${icon('plus-circle-fill')}</span></button></div></div></div>`}
function homeActions(){return `<div class="home-actions"><button data-action="transfer"><span class="action-circle">${referenceControlGlyph('transfer')}</span>Переказати<br>на картку</button><button data-action="iban"><span class="action-circle">${referenceControlGlyph('iban')}</span>Платіж<br>за IBAN</button><button data-action="nav" data-page="payments"><span class="action-circle">${referenceControlGlyph('payments')}</span>Інші<br>платежі</button></div>`}
let homeFooter=()=>{
 const html=basicHome();
 return html.slice(html.indexOf('<div class="useful page">'));
};
let homeOperationRows=()=>rows(txFor().slice(0,6));
function homeAccountContent(slotsOnly=false){
 const tools=newCardSelected
  ? `<div class="home-actions new-card-actions"><button class="new-card-cta" data-action="open-card">Відкрити картку</button></div><section class="operation-panel new-card-empty"><h2>Коли відкриєте нову картку,<br>тут буде її виписка <span class="new-card-sticker" aria-hidden="true">🏄‍♂️</span></h2></section>`
  : homeActions()+`<section class="operation-panel"><div class="section-title"><h2>Операції</h2><button class="pill" data-action="nav" data-page="history">Усі ${icon('caret-right')}</button></div>${homeOperationRows()}</section>`;
 return `<div class="home-content ${newCardSelected?'new-card-selected':''}">${newCardSelected?`<div class="open-card-intro"><h2>Відкрити картку</h2><p>Ви можете відкрити додаткові картки<br>в гривні, доларах та євро</p></div>`:`<button class="home-balance" data-action="topup" aria-label="Поповнити картку"><svg class="icon balance-plus-glyph" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15.5" fill="currentColor" opacity=".16"/><circle cx="16" cy="16" r="15.5" fill="none" stroke="currentColor" opacity=".18"/><circle cx="16" cy="16" r="8" fill="currentColor" opacity=".68"/><path d="M16 12.75v6.5m-3.25-3.25h6.5" fill="none" stroke="#263454" stroke-width="2" stroke-linecap="round"/></svg><strong>${displayMoney(balance())} ₴</strong></button>`}${slotsOnly?'<div class="card-stage card-carousel"></div><div class="card-selector"></div>':cardSlides()+selector()}${tools}${slotsOnly?'':homeFooter()}</div>`;
}
home=function(){
 const header=basicHome(true).replace('data-action="nav" data-page="more" aria-label="Профіль"','data-action="profile-sheet" aria-label="Профіль"');
 return header+`<div class="refresh-indicator" aria-hidden="true">${icon('arrows-clockwise')}</div>`+homeAccountContent();
};
cardsPage=function(){return `<div class="cards-overview"><div class="toolbar"><button class="back" data-action="back" aria-label="Закрити">${icon('x')}</button></div><h1>Усі картки</h1><div class="compact-cards">${allCards().map(c=>`<button class="compact-card" ${!newCardSelected&&c.id===activeCard().id?'aria-current="true"':''} data-action="select-card" data-id="${c.id}"><span class="compact-number">** ${esc(c.card.slice(-4))}</span><span class="compact-art">${cardArtwork(c)}</span><span class="compact-name">${esc(c.account)}</span><strong>${displayMoney(cardBalance(c))} ₴</strong></button>`).join('')}</div><button class="open-card-floating" data-action="open-card"><svg class="icon open-card-plus" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="14" fill="currentColor"/><path d="M14 8v12m-6-6h12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>Відкрити картку</button></div>`};
const previousCardPage=cardPage;
cardPage=function(){return previousCardPage().replace(icon('wallet'),'<img class="icon" src="assets/reference/wallet.png" alt="">')};

const previousFlip=actions['flip-card'];
actions['flip-card']=()=>{previousFlip();$('.outside-card-number')?.classList.toggle('visible',cardFlipped)};
function cardPixel(value){
 const scale=window.devicePixelRatio||1;
 return Math.round(value*scale)/scale;
}
function setCarouselPosition(index){
 const track=$('.card-track');
 if(track)track.style.transform=`translate3d(${cardPixel(-index*track.firstElementChild.getBoundingClientRect().width)}px,0,0)`;
}
let slideCardTo;
const homeAccountIntro='.home-balance,.open-card-intro';
actions['select-card']=button=>{
 const card=allCards().find(item=>item.id===button.dataset.id);
 if(!card)return;
 if(route.page==='home'){slideCardTo(allCards().findIndex(item=>item.id===card.id));return}
 newCardSelected=false;
 state.activeCard=card.id;
 navigate('home');
};
actions['copy-visible-card']=async b=>{const c=allCards().find(c=>c.id===b.dataset.id);if(!c)return;try{await navigator.clipboard.writeText(c.card);toast('Номер картки скопійовано')}catch{toast('Копіювання недоступне у цьому браузері')}};
actions['cycle-card']=()=>slideCardTo(carouselIndex+1);
actions['show-card']=b=>{if(newCardSelected||b.dataset.id!==activeCard().id){slideCardTo(allCards().findIndex(c=>c.id===b.dataset.id));return}navigate('card')};
actions['open-card']=()=>navigate('openCard');
actions['profile-sheet']=()=>{modal('',`<div class="profile-sheet">${button('personal-info','Особисті дані та документи','users')}${button('app-settings','Налаштування застосунку','gear')}<div class="panel">${button('personal-info',esc(state.name),'users','Особисті картки')}${button('service','ФОП','wallet','Дізнатися','data-service="ФОП"')}</div></div>`,null);$('#modal').dataset.kind='profile'};
function openCardPage(){return toolbar('Відкрити картку')+`<div class="page opening-page"><div class="opening-visual">${icon('cat-fill')}<h2>Підвищити статус картки</h2><p>Нанесіть її на картку або отримайте доступ<br>до інших переваг у демо-проєкті</p></div><h2>Картки</h2><div class="card-products">${[['black','Чорна картка'],['white','Біла картка']].map(([color,title])=>`<button data-action="create-product-card" data-color="${color}"><span>${cardArtwork({id:color,color,account:title,holder:state.holder,card:'0000 0000 0000 0000'})}</span><strong>${title}</strong><small>У гривні · демо</small></button>`).join('')}</div><p class="info">У цьому проєкті відкриваються демонстраційні гривневі картки з нульовим балансом. Долари та євро показані у відео оригінального застосунку.</p></div>`}
actions['create-product-card']=b=>modal('Відкрити демо-картку',field('Назва','account',b.dataset.color==='white'?'Біла картка':'Чорна картка','text','required maxlength="40"')+'<p class="form-note">Демонстраційна картка · початковий баланс 0 ₴</p>',f=>{const id=uid(),name=f.get('account').trim();if(!name)throw Error('Вкажіть назву');state.extraCards.push({id,account:name,color:b.dataset.color,opening:0,card:'0000 0000 0000 '+String(allCards().length).padStart(4,'0')});state.activeCard=id;newCardSelected=false;route={page:'home'};history.replaceState(route,'','#home')},'Відкрити у демо');
// More uses the same compact service rows and colored symbols as the recording.
const serviceGroups=[
 [['Мобільний зв’язок','eSIM та керування номерами','device-mobile','lavender'],['Заправка на WOG','Не виходячи з авто','car-fill','green'],['Програми лояльності','Картки та бонуси','gift-fill','pink'],['Замовлення готівки','Зняти у касі банку-партнера','wallet','cyan']],
 [['Про Безпеку в mono','Зрозуміло про захист','lock-key','sky'],['monoКЕП','Ваш електронний підпис','pencil-simple','orange']]
];
morePage=function(){return `<div class="more-services"><h1>Ще</h1><section class="service-shortcuts">${[['Запросити друга','gift-fill','pink'],['Служба підтримки','chat-circle-fill','sky'],['Сканер QR-коду','circles-four-fill','red']].map(([title,i,color])=>`<button data-action="${title==='Служба підтримки'?'nav':'service'}" data-page="support" data-service="${title}"><span class="service-symbol ${color}">${icon(i)}</span>${title}</button>`).join('')}</section>${serviceGroups.map(group=>`<section class="service-group">${group.map(([title,sub,i,color])=>`<button class="service-row" data-action="service" data-service="${title}"><span class="service-symbol ${color}">${icon(i)}</span><span>${title}<small>${sub}</small></span></button>`).join('')}</section>`).join('')}<section class="service-group">${button('nav','Регулярні платежі','clock','','data-page="regular"')}${button('nav','Збережені картки','credit-card','','data-page="contacts"')}${button('nav','Квитанції та фото','receipt','','data-page="files"')}${button('nav','Про проєкт','question','','data-page="about"')}</section></div>`};
actions.service=b=>inform(b.dataset.service,'У відео показано вхід до цього сервісу. Зовнішня банківська послуга в демо не підключається.');
function servicePage(){const title=decodeURIComponent(route.id||'Сервіс');return toolbar(title)+`<div class="page service-detail"><div class="service-detail-symbol">${icon(title.includes('Безпеку')?'lock-key':title.includes('Мобільний')?'device-mobile':title.includes('КЕП')?'pencil-simple':'gift-fill')}</div><h1>${esc(title)}</h1><p>${title.includes('Безпеку')?'Нікому не повідомляйте PIN, CVV і коди підтвердження. У демо ці дані не запитуються.':'Це демонстраційний розділ проєкту. Заявки, замовлення та підключення зовнішніх послуг не надсилаються.'}</p>${button('nav','Мої картки','credit-card','','data-page="cards"')}${button('nav','Підтримка','chat-circle-fill','','data-page="support"')}</div>`}
// Statistics are calculated from stored transactions, with independent source and period filters.
let statsKind='expense',statsTab='categories',statsCards=null,statsStart=today().slice(0,7)+'-01',statsEnd=today(),statsController=null,calendarMonth=statsStart,calendarPick='start';
function statsTransactions(kind=statsKind){return state.transactions.filter(t=>(!statsCards||statsCards.includes(t.cardId||'main'))&&t.date>=statsStart&&t.date<=statsEnd&&(kind==='income'?t.amount>0:t.amount<0))}
function statsTotal(kind){return statsTransactions(kind).reduce((n,t)=>n+Math.abs(t.amount),0)}
function periodLabel(){const f=d=>new Date(d+'T12:00:00').toLocaleDateString('uk-UA',{day:'numeric',month:'long'});return f(statsStart)+' – '+f(statsEnd)+' '+statsEnd.slice(0,4)}
function statsGroups(){const groups={};for(const t of statsTransactions()){const key=statsTab==='tags'?(t.tag||'Без тегів'):(t.category||'Інше');groups[key]??={name:key,total:0,count:0,icon:t.icon||'credit-card-fill'};groups[key].total+=Math.abs(t.amount);groups[key].count++}return Object.values(groups).sort((a,b)=>b.total-a.total)}
function statsReferenceCategory(name){
 const positions={grocery:0,other:25,transport:50,topup:75,cash:100};
 return {kind:'reference-category-art',glyph:`<span class="stats-category-art" style="--category-position:${positions[name]}%" aria-hidden="true"></span>`};
}
function statsCategoryArt(group){
 if(statsTab!=='categories')return {kind:'',glyph:icon(group.icon)};
 if(/поповнен|надходжен/i.test(group.name))return statsReferenceCategory(/готів/i.test(group.name)?'cash':'topup');
 if(/переказ/i.test(group.name)){
  if(statsKind==='income')return statsReferenceCategory('topup');
  return {kind:'transfer',glyph:transferSymbol()};
 }
 if(/продукт|супермаркет/i.test(group.name))return statsReferenceCategory('grocery');
 if(/транспорт/i.test(group.name))return statsReferenceCategory('transport');
 if(/^інше$/i.test(group.name))return statsReferenceCategory('other');
 return {kind:'',glyph:icon(group.icon)};
}
function statsGroupRows(){const total=statsTotal(statsKind);return statsGroups().map((g,i)=>{const art=statsCategoryArt(g);return `<button class="stats-category" data-action="stats-category" data-category="${esc(g.name)}"><span class="stats-category-icon tone-${i%4} ${art.kind}">${art.glyph}</span><span><strong>${esc(g.name)}</strong><small>${g.count} транзакцій</small></span><span class="stats-category-amount ${statsKind==='income'?'green':''}">${statsKind==='expense'?'−':''}${displayMoney(g.total)} ₴<small>${total&&g.total&&g.total/total<.01?'&lt; 1':total?Math.round(g.total/total*100):0}%</small></span></button>`}).join('')||empty('Немає операцій','Оберіть інший період або картки.')}
function statsTabs(){return `<div class="stats-tabs"><button data-action="stats-tab" data-tab="categories" class="${statsTab==='categories'?'selected':''}">Категорії</button><button data-action="stats-tab" data-tab="tags" class="${statsTab==='tags'?'selected':''}">Теги</button></div>`}
function summaryCard(kind){const tx=statsTransactions(kind),count=new Set(tx.map(t=>t.category||'Інше')).size,total=statsTotal(kind),income=kind==='income';return `<section class="stats-summary" data-kind="${kind}" data-total="${total}"><span class="summary-arrow ${income?'income':'expense'}">${statsArrow(income)}</span><span class="currency-badge">UAH</span><h2>${income?'Надходження':'Витрати'}</h2><strong>${income?'':'−'}${displayMoney(total)} ₴</strong><div class="summary-count">${icon('receipt')}Усього ви зробили ${tx.length} транзакцій</div><div class="summary-metrics"><button data-action="stats-breakdown" data-tab="categories">${statsMetricIcon(false)}<strong>${count}</strong><span>Категорії</span></button><button data-action="stats-breakdown" data-tab="tags">${statsMetricIcon(true)}<strong>${new Set(tx.filter(t=>t.tag).map(t=>t.tag)).size}</strong><span>Тегів</span></button></div></section>`}
function statsCardThumbnail(card){
 const stacked=!card;
 const white=card&&cardWhite(card);
 const tone=white?'light':'dark';
 return `<svg class="stats-card-thumbnail stats-card-thumbnail--${tone}${stacked?' stats-card-thumbnail--stack':''}" viewBox="0 0 48 36" aria-hidden="true" focusable="false">
  ${stacked?'<rect x="3.5" y="8.5" width="42" height="25" rx="6" fill="#c0c7d6"/><path d="M9 32h30" stroke="#eef1f7" stroke-linecap="round"/>':''}
  <rect class="stats-card-face" x="1.5" y="2.5" width="44" height="29" rx="6" stroke-width="1"/>
  <path class="stats-card-gloss" d="M2 10a7 7 0 0 1 7-7h29l-12 10H2Z"/>
  <path class="stats-card-details" d="M7.5 8h7m3 0h5.5M7.5 25h11" fill="none" stroke-width="1.7" stroke-linecap="round"/>
  <text x="40.5" y="26.5" text-anchor="end" fill="currentColor" font-family="Arial, sans-serif" font-size="6.7" font-style="italic" font-weight="800">VISA</text>
 </svg>`;
}
function statsSourceCopy(card, title){
 return `<span class="stats-source-copy"><strong>${esc(title)}</strong>${card?`<small>${displayMoney(cardBalance(card))} ₴</small>`:''}</span>`;
}
function statsContent(){
 if(!statsTransactions('expense').length&&!statsTransactions('income').length){
  return `<section class="stats-empty">
   <img src="assets/statistics-empty.webp" alt="" width="640" height="640">
   <h2>Немає операцій</h2>
   <p>За вибраний період за цим джерелом не було операцій</p>
  </section>`;
 }
 return `<div class="stats-carousel" id="stats-carousel">${summaryCard('expense')}${summaryCard('income')}</div>
  <div class="stats-dots"><button class="${statsKind==='expense'?'selected':''}" data-action="stats-kind" data-kind="expense" aria-label="Витрати"></button><button class="${statsKind==='income'?'selected':''}" data-action="stats-kind" data-kind="income" aria-label="Надходження"></button></div>
  ${statsTabs()}<div id="stats-group-list">${statsGroupRows()}</div>`;
}
function statsSourceLabel(){
 const card=statsCards?.length===1?allCards().find(c=>c.id===statsCards[0]):null;
 const title=card?.account||(statsCards&&statsCards.length>1?statsCards.length+' картки':'Усі картки');
 return `${statsCardThumbnail(card)}${statsSourceCopy(card,title)}<span class="vertical-dots" aria-hidden="true">⋮</span>`;
}
let statisticsVisit;
const seenStatisticsSummaries=new Set();
analytics=function(){
 if(statisticsVisit!==route){
  statisticsVisit=route;
  seenStatisticsSummaries.clear();
  statsKind='expense';
 }
 return `<div class="stats-page analytics-overview">
  <div class="stats-toolbar"><button data-action="back" aria-label="Назад">${icon('arrow-left')}</button><button data-action="nav" data-page="capital" aria-label="Капітал">${capitalIcon()}</button></div>
  <h1>Статистика</h1><button class="stats-period" data-action="stats-period">${esc(periodLabel())}${icon('calendar')}</button>
  <button class="stats-source" data-action="stats-source" aria-haspopup="dialog">${statsSourceLabel()}</button>
  <div class="stats-content">${statsContent()}</div>
 </div>`;
};
function capitalPage(){const cards=allCards().filter(c=>!statsCards||statsCards.includes(c.id)),total=cards.reduce((n,c)=>n+cardBalance(c),0)+state.jars.reduce((n,j)=>n+j.amount,0)+state.deposits.reduce((n,d)=>n+d.amount,0);return `<div class="capital-page"><div class="stats-toolbar"><button data-action="back" aria-label="Назад">${icon('arrow-left')}</button></div><h1>Капітал</h1><section class="capital-total"><span class="capital-symbol">${icon('wallet')}</span><span class="currency-badge">UAH</span><p>Сума</p><strong>${displayMoney(total)} ₴</strong><div class="capital-note">Ваш капітал складається з ${cards.length+state.jars.length+state.deposits.length} джерел</div></section><div class="capital-sources">${cards.map(c=>`<button data-action="capital-card" data-id="${c.id}"><span class="stats-mini-card">${cardArtwork(c)}</span><small>${esc(c.account)}</small><strong>${displayMoney(cardBalance(c))} ₴</strong></button>`).join('')}${state.jars.map(j=>`<div><span class="capital-symbol">${uiIcon('jar-native')}</span><small>${esc(j.name)}</small><strong>${displayMoney(j.amount)} ₴</strong></div>`).join('')}${state.deposits.map(d=>`<div><span class="capital-symbol">${uiIcon('deposit-native')}</span><small>${esc(d.name)}</small><strong>${displayMoney(d.amount)} ₴</strong></div>`).join('')}</div></div>`}
function statsBreakdownPage(){
 const income=route.id==='income';
 statsKind=income?'income':'expense';
 const title=income?'Надходження':'Витрати';
 return `<div class="stats-page stats-breakdown">
  <header class="stats-toolbar">
   <button data-action="nav" data-page="analytics" aria-label="До статистики">${icon('arrow-left')}</button>
   <h1>${title} ${income?'':'−'}${displayMoney(statsTotal(statsKind))} ₴</h1>
   <button data-action="nav" data-page="capital" aria-label="Капітал">${capitalIcon()}</button>
  </header>
  <p class="stats-period-label">${esc(periodLabel())}</p>
  ${statsTabs()}
  <div id="stats-group-list">${statsGroupRows()}</div>
 </div>`;
}
function statsCategoryPage(){const name=decodeURIComponent(route.id||''),tx=statsTransactions().filter(t=>(statsTab==='tags'?(t.tag||'Без тегів'):(t.category||'Інше'))===name);return `<div class="stats-page stats-category-page"><div class="stats-toolbar"><button data-action="nav" data-page="analytics" aria-label="Назад">${icon('arrow-left')}</button><button data-action="nav" data-page="capital" aria-label="Капітал">${capitalIcon()}</button></div><h1>${esc(name)}</h1><p class="stats-period-label">${esc(periodLabel())}</p><div class="category-transaction-list">${grouped(tx)}</div></div>`}
function bottomSheet(title,html,fn,cta='Показати'){modal(title,html,fn,cta);$('#modal').dataset.kind='sheet'}
actions['stats-source']=()=>{
 const cards=allCards();
 bottomSheet('Джерело',`<div class="source-options stats-source-options">${cards.map(card=>`<label>
  ${statsCardThumbnail(card)}
  ${statsSourceCopy(card,card.account)}
  <input type="checkbox" name="cards" value="${esc(card.id)}" ${!statsCards||statsCards.includes(card.id)?'checked':''}>
 </label>`).join('')}</div>`,()=>{});
 const dialog=$('#modal');
 if(!shouldReduceMotion())animateStatsSource(dialog,false);
};
let statsSourceMotion;
function animateStatsSource(dialog,closing){
 const current=statsSourceMotion?getComputedStyle(dialog).transform:null;
 statsSourceMotion?.cancel();
 const shown='translateY(0)',hidden='translateY(100%)';
 dialog.classList.toggle('stats-source-closing',closing);
 const animation=dialog.animate(
  {transform:[current||(closing?shown:hidden),closing?hidden:shown]},
  {duration:360,easing:getComputedStyle(dialog).getPropertyValue('--ease-drawer').trim()||'ease-out',fill:'both'}
 );
 statsSourceMotion=animation;
 animation.finished.then(()=>{
  if(!closing&&statsSourceMotion===animation){
   statsSourceMotion=null;
   animation.cancel();
  }
 }).catch(()=>{});
 return animation.finished;
}
function closeStatsSource(dialog,afterClose){
 if(dialog.classList.contains('stats-source-closing'))return;
 const finish=()=>{
  HTMLDialogElement.prototype.close.call(dialog);
  statsSourceMotion?.cancel();
  statsSourceMotion=null;
  dialog.classList.remove('stats-source-closing');
  afterClose?.();
 };
 if(shouldReduceMotion()){finish();return}
 animateStatsSource(dialog,true).then(finish,()=>{dialog.classList.remove('stats-source-closing')});
}
const statsSourceDialog=$('#modal');
statsSourceDialog.addEventListener('cancel',event=>{
 if(!statsSourceDialog.querySelector('.stats-source-options'))return;
 event.preventDefault();
 closeStatsSource(statsSourceDialog);
});
statsSourceDialog.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||!statsSourceDialog.querySelector('.stats-source-options'))return;
 event.preventDefault();
 closeStatsSource(statsSourceDialog);
});
statsSourceDialog.addEventListener('click',event=>{
 if(!statsSourceDialog.querySelector('.stats-source-options'))return;
 const rect=statsSourceDialog.getBoundingClientRect();
 const outside=event.target===statsSourceDialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom);
 if(!outside&&!event.target.closest('#close'))return;
 event.stopImmediatePropagation();
 closeStatsSource(statsSourceDialog);
},true);
statsSourceDialog.addEventListener('close',()=>{
 if(statsSourceDialog.open)return;
 statsSourceMotion?.cancel();
 statsSourceMotion=null;
 statsSourceDialog.classList.remove('stats-source-closing');
});
$('#form').addEventListener('submit',event=>{
 const dialog=$('#modal');
 if(!dialog.open||!dialog.querySelector('.stats-source-options'))return;
 event.preventDefault();
 event.stopImmediatePropagation();
 const ids=new FormData(event.currentTarget).getAll('cards');
 if(!ids.length){
  $('#error').textContent='Оберіть хоча б одну картку';
  return;
 }
 closeStatsSource(dialog,()=>{
  const current=statsCards||allCards().map(card=>card.id);
  if(ids.length!==current.length||ids.some(id=>!current.includes(id))){
   statsCards=ids.length===allCards().length?null:ids;
   updateStatsSource();
  }
  $('.analytics-overview .stats-source')?.focus({preventScroll:true});
 });
},true);
function updateStatsSource(){
 const overview=$('.analytics-overview');
 if(!overview)return;
 overview.querySelector('.stats-source').innerHTML=statsSourceLabel();
 const content=overview.querySelector('.stats-content');
 const track=content.querySelector('#stats-carousel');
 const populated=statsTransactions('expense').length||statsTransactions('income').length;
 if(track&&populated){
  const template=document.createElement('template');
  for(const summary of track.children){
   template.innerHTML=summaryCard(summary.dataset.kind);
   const next=template.content.firstElementChild;
   summary.dataset.total=next.dataset.total;
   summary.replaceChildren(...next.childNodes);
  }
  updateStatsGroups();
 }else if(Boolean(track)!==Boolean(populated)){
  content.innerHTML=statsContent();
  initStats();
 }
 fitMonetaryLabels(content);
}
actions['stats-kind']=b=>statsController?.go(b.dataset.kind);
actions['stats-tab']=b=>{statsTab=b.dataset.tab;updateStatsGroups()};
actions['stats-breakdown']=b=>{
 statsTab=b.dataset.tab;
 navigate('statbreakdown',b.closest('.stats-summary').dataset.kind);
};
actions['stats-category']=b=>navigate('statcategory',encodeURIComponent(b.dataset.category));
actions['capital-card']=b=>{statsCards=[b.dataset.id];navigate('analytics')};
const statsGroupMotions = new WeakMap();
function updateStatsGroups(){
 const list=$('#stats-group-list');
 document.querySelectorAll('.stats-tabs button').forEach(b=>b.classList.toggle('selected',b.dataset.tab===statsTab));
 if(!list)return;
 const markup=statsGroupRows();
 const previous=statsGroupMotions.get(list);
 const opacity=previous?Number(getComputedStyle(list).opacity):1;
 previous?.cancel();
 statsGroupMotions.delete(list);
 if(shouldReduceMotion()){
  list.innerHTML=markup;
  return;
 }
 const fadeIn=from=>{
  if(from===1)return;
  const motion=list.animate([{opacity:from},{opacity:1}],{duration:105,easing:'ease-out'});
  statsGroupMotions.set(list,motion);
  motion.finished.then(()=>{
   if(statsGroupMotions.get(list)===motion)statsGroupMotions.delete(list);
  }).catch(()=>{});
 };
 if(markup===list.innerHTML){fadeIn(opacity);return}
 const motion=list.animate([{opacity},{opacity:.25}],{duration:55,easing:'ease-in',fill:'forwards'});
 statsGroupMotions.set(list,motion);
 motion.finished.then(()=>{
  if(!list.isConnected||statsGroupMotions.get(list)!==motion)return;
  list.innerHTML=markup;
  motion.cancel();
  fadeIn(.25);
 }).catch(()=>{});
}
function calendarHTML(){const d=new Date(calendarMonth+'T12:00:00'),year=d.getFullYear(),month=d.getMonth(),days=new Date(year,month+1,0).getDate(),offset=(new Date(year,month,1).getDay()+6)%7;const start=$('#f-start')?.value||statsStart,end=$('#f-end')?.value||statsEnd;return `<div class="calendar-month"><button type="button" data-action="calendar-month" data-step="-1" aria-label="Попередній місяць">${icon('arrow-left')}</button><strong>${esc(d.toLocaleDateString('uk-UA',{month:'long',year:'numeric'}))}</strong><button type="button" data-action="calendar-month" data-step="1" aria-label="Наступний місяць">${icon('arrow-right')}</button></div><div class="calendar-weekdays">${['пн','вт','ср','чт','пт','сб','нд'].map(x=>`<span>${x}</span>`).join('')}</div><div class="calendar-grid">${'<span></span>'.repeat(offset)}${Array.from({length:days},(_,i)=>{const value=year+'-'+String(month+1).padStart(2,'0')+'-'+String(i+1).padStart(2,'0');return `<button type="button" data-action="calendar-day" data-date="${value}" class="${value>=start&&value<=end?'in-range':''} ${value===start?'range-start':''} ${value===end?'range-end':''}">${i+1}</button>`}).join('')}</div>`}
actions['stats-period']=()=>{calendarMonth=statsStart;calendarPick='start';bottomSheet('Період',field('Від','start',statsStart,'date','required')+field('До','end',statsEnd,'date','required')+'<div id="calendar"></div>',f=>{if(f.get('start')>f.get('end'))throw Error('Кінцева дата має бути пізнішою за початкову');statsStart=f.get('start');statsEnd=f.get('end')});$('#calendar').innerHTML=calendarHTML();$('#f-start').onchange=$('#f-end').onchange=()=>$('#calendar').innerHTML=calendarHTML()};
actions['calendar-month']=b=>{const d=new Date(calendarMonth+'T12:00:00');d.setMonth(d.getMonth()+Number(b.dataset.step));calendarMonth=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';$('#calendar').innerHTML=calendarHTML()};
actions['calendar-day']=b=>{const date=b.dataset.date;if(calendarPick==='start'){$('#f-start').value=date;$('#f-end').value=date;calendarPick='end'}else{if(date<$('#f-start').value){$('#f-end').value=$('#f-start').value;$('#f-start').value=date}else $('#f-end').value=date;calendarPick='start'}$('#calendar').innerHTML=calendarHTML()};
const basicModal=modal;
modal=function(...args){delete $('#modal').dataset.kind;basicModal(...args)};
function statsMetricIcon(tag){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${tag?'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m10 7-2 10m8-10-2 10M7 10h11M6 14h11" fill="none" stroke="#616176" stroke-width="1.7"/>':'<path fill="currentColor" fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM7 7h4v4H7Zm6 0h4v4h-4Zm-6 6h4v4H7Zm6 0h4v4h-4Z"/>'}</svg>`}
function statsArrow(income){return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${income?'M18 6 6 18M6 8v10h10':'M6 18 18 6M8 6h10v10'}"/></svg>`}
function capitalIcon(){return `<svg class="icon" viewBox="0 0 28 28" aria-hidden="true" fill="currentColor"><ellipse cx="10" cy="6" rx="6" ry="3"/><path d="M4 9c3 2.4 9 2.4 12 0v4c-3 2.5-9 2.5-12 0Zm0 7c3 2.4 9 2.4 12 0v4c-3 2.5-9 2.5-12 0Z"/><ellipse cx="21" cy="13" rx="5" ry="2.5"/><path d="M16 16c3 2 7 2 10 0v4c-3 2-7 2-10 0Zm0 7c3 2 7 2 10 0v2c-3 2-7 2-10 0Z"/></svg>`}
function animateFirstStatsSummary(summary){
 const kind=summary.dataset.kind;
 if(seenStatisticsSummaries.has(kind))return;
 seenStatisticsSummaries.add(kind);
 const label=summary.querySelector(':scope > strong');
 const total=Number(summary.dataset.total);
 if(!total||shouldReduceMotion())return;
 const start=performance.now();
 const update=now=>{
  if(!label.isConnected)return;
  const progress=Math.max(0,Math.min(1,(now-start)/420));
  const value=total*progress*progress*(3-2*progress);
  label.textContent=(kind==='expense'?'−':'')+displayMoney(value)+' ₴';
  if(progress<1)requestAnimationFrame(update);
 };
 update(start);
}
function initStats(){
 const track=$('#stats-carousel');
 if(!track){statsController=null;return}
 const cards=[...track.querySelectorAll('.stats-summary')];
 const buttons=[...document.querySelectorAll('.stats-dots button')];
 let indicator=-1;
 const position=index=>Math.min(track.scrollWidth-track.clientWidth,cards[index].offsetLeft-cards[0].offsetLeft);
 const nearest=x=>Math.abs(x-position(0))<=Math.abs(x-position(1))?0:1;
 const dots=index=>{
  if(indicator===index)return;
  buttons[indicator]?.classList.remove('selected');
  buttons[index]?.classList.add('selected');
  indicator=index;
 };
 const select=index=>{
  if(!track.isConnected)return;
  dots(index);
  const kind=index?'income':'expense';
  if(kind===statsKind)return;
  statsKind=kind;
  animateFirstStatsSummary(cards[index]);
  updateStatsGroups();
 };
 const go=kind=>{
  const index=kind==='income'?1:0;
  const target=position(index);
  const instant=shouldReduceMotion();
  track.classList.remove('stats-dragging');
  track.scrollTo({left:target,behavior:instant?'instant':'smooth'});
  if(instant||Math.abs(track.scrollLeft-target)<1)select(index);
 };
 const initial=statsKind==='income'?1:0;
 track.scrollLeft=position(initial);
 dots(initial);
 fitMonetaryLabels(track);
 animateFirstStatsSummary(cards[initial]);
 track.tabIndex=0;
 track.setAttribute('aria-label','Доходи та витрати: гортайте ліворуч або праворуч');
 bindHorizontalGesture(track,{
  read:()=>-track.scrollLeft,
  write:x=>{track.scrollLeft=-x},
  cancel:()=>track.classList.add('stats-dragging'),
  settle:(v,cancelled)=>go(nearest(track.scrollLeft-(cancelled?0:v*.12))?'income':'expense'),
  mouseOnly:true
 });
 // Touch and trackpad scrolling use native momentum and snapping.
 track.addEventListener('scroll',()=>{
  const offset=track.scrollLeft;
  const other=1-initial;
  if(Math.abs(offset-position(initial))>=Math.abs(position(other)-position(initial))*.18){
   animateFirstStatsSummary(cards[other]);
  }
  select(nearest(offset));
 },{passive:true});
 track.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();
  go(e.key==='ArrowRight'?'income':'expense');
 });
 statsController={go};
}


function bindRefresh(){}

const experienceRender=render;
render=function(){if(!adminMode&&['capital','statcategory','statbreakdown','openCard','service'].includes(route.page)){defaults();$('#app').className=route.page;$('#nav').hidden=true;$('#screen').innerHTML=({capital:capitalPage,statcategory:statsCategoryPage,statbreakdown:statsBreakdownPage,openCard:openCardPage,service:servicePage})[route.page]()}else{experienceRender();if(!adminMode){if(['cards','analytics'].includes(route.page))$('#nav').hidden=true;if(route.page==='home'){bindRefresh();$('#app').classList.toggle('new-card-theme',newCardSelected);$('#app').classList.toggle('white-active',!newCardSelected&&cardWhite(activeCard()))}if(route.page==='analytics')initStats();if(route.page==='card'){let p;$('.expanded-card')?.addEventListener('pointerdown',e=>p={x:e.clientX,y:e.clientY});$('.expanded-card')?.addEventListener('pointerup',e=>{if(p&&Math.abs(e.clientX-p.x)>40&&Math.abs(e.clientY-p.y)<50){actions['flip-card']();e.currentTarget.addEventListener('click',e=>{e.stopPropagation();e.preventDefault()},{once:true,capture:true})}p=null})}}}};
// The carousel and indicator share the same drag position.
let swipeLayers=null,cardSelectorTimer,cardSelectorVisibleUntil=0;
const cardSelectorFades=new WeakMap();
function fadeCardSelector(selector,showDots){
 if(!selector)return;
 const parts=[selector.querySelector('.selector-label'),selector.querySelector('.selector-dots')];
 if(parts.some(part=>!part))return;
 const previous=cardSelectorFades.get(selector)||[];
 const from=parts.map(part=>Number(getComputedStyle(part).opacity));
 previous.forEach(animation=>animation.cancel());
 selector.classList.toggle('show-card-indicator',showDots);
 if(shouldReduceMotion())return;
 const dots=showDots||selector.parentElement?.classList.contains('new-card-selected');
 const target=[dots?0:1,dots?1:0];
 const animations=parts.map((part,index)=>part.animate(
  {opacity:[from[index],target[index]]},
  {duration:360,easing:'ease-in-out',fill:'both'}
 ));
 cardSelectorFades.set(selector,animations);
 Promise.all(animations.map(animation=>animation.finished)).then(()=>{
  if(cardSelectorFades.get(selector)!==animations)return;
  cardSelectorFades.delete(selector);
  animations.forEach(animation=>animation.cancel());
 }).catch(()=>{});
}
function prepareSwipe(){if(swipeLayers)return swipeLayers;const app=$('#app'),track=$('.card-track'),cards=allCards(),index=newCardSelected?cards.length:Math.max(0,cards.findIndex(c=>c.id===state.activeCard)),background=document.createElement('div');background.className='swipe-gradient';app.prepend(background);
 const selector=$('.card-selector');
 clearTimeout(cardSelectorTimer);
 if(!shouldReduceMotion()&&selector){
  cardSelectorVisibleUntil=Infinity;
  fadeCardSelector(selector,true);
 }
 swipeLayers={track,cards,selector,indicator:selector?.querySelector('.selector-dots'),width:track.getBoundingClientRect().width,slideWidth:track.firstElementChild.getBoundingClientRect().width,index,background,dx:0,theme:null};
 document.documentElement.dataset.gesture='active';app.classList.add('card-gesture-active');return swipeLayers}
function firstCardIndicator(index){
 return Math.max(0,Math.min(index-2,allCards().length-4));
}
function cardIndicatorMarkers(index){
 const total=allCards().length;
 const first=firstCardIndicator(index);
 const last=Math.min(total,first+4);
 return Array.from({length:last-first+1},(_,offset)=>{
  const position=first+offset;
  const current=position===index?' class="selected"':'';
  if(position!==last)return `<i${current}></i>`;
  return `<i class="indicator-end${position===total?' indicator-add':''}${position===index?' selected':''}"><span class="indicator-plus" aria-hidden="true"></span></i>`;
 }).join('');
}
function updateCardIndicator(indicator,index){
 if(!indicator||indicator.dataset.index===String(index))return;
 const first=firstCardIndicator(index);
 indicator.lastElementChild?.classList.toggle('indicator-add',first+indicator.children.length-1===allCards().length);
 const next=indicator.children[index-first];
 const current=indicator.querySelector('.selected');
 if(next!==current){
  current?.classList.remove('selected');
  next?.classList.add('selected');
 }
 indicator.dataset.index=index;
}
function moveHomeSwipe(distance,rubber=true){
 const layer=prepareSwipe();
 const {index,width,cards,track,slideWidth,indicator,background}=layer;
 const edge=(index===0&&distance>0)||(index===cards.length&&distance<0);
 const dx=rubber?Math.max(-width,Math.min(width,edge?distance*.2:distance)):distance;
 const position=index-dx/width;
 layer.dx=dx;
 updateCardIndicator(indicator,Math.max(0,Math.min(cards.length,Math.round(position))));
 track.style.transform=`translate3d(${cardPixel(-position*slideWidth)}px,0,0)`;
 if(edge||dx===0){background.style.opacity='0';return}
 const next=index+(dx<0?1:-1);
 if(layer.theme!==next){
  background.style.background=next===cards.length?'var(--home-new-gradient)':cardWhite(cards[next])?'var(--home-white-gradient)':'var(--home-black-gradient)';
  layer.theme=next;
 }
 background.style.opacity=Math.min(1,Math.abs(dx)/width);
}
function cleanupSwipe(){
 if(!swipeLayers)return;
 const {indicator,selector,background}=swipeLayers;
 updateCardIndicator(indicator,carouselIndex);
 background.remove();
 $('#app').classList.remove('card-gesture-active');
 clearTimeout(cardSelectorTimer);
 if(selector?.classList.contains('show-card-indicator')){
  const delay=shouldReduceMotion()?0:1500;
  cardSelectorVisibleUntil=performance.now()+delay;
  cardSelectorTimer=setTimeout(()=>{
   cardSelectorVisibleUntil=0;
   const live=$('#app .card-selector');
   if(selector!==live)selector.classList.remove('show-card-indicator');
   fadeCardSelector(live,false);
  },delay);
 }
 delete document.documentElement.dataset.gesture;
 swipeLayers=null;
}
function refreshSelectedCard(){
 const app=$('#app');
 app.classList.toggle('white-active',!newCardSelected&&cardWhite(activeCard()));
 app.classList.toggle('new-card-theme',newCardSelected);

}
function finishCardSelection(index){
 const cards=allCards();
 newCardSelected=index===cards.length;
 carouselIndex=index;
 if(!newCardSelected)state.activeCard=cards[index].id;
 const pane=$('.home-content');
 if(route.page==='home'&&pane){
  const incoming=swipeLayers?.pages?.find(page=>page.index===index)?.blocks;
  if(incoming){
   // The destination is already painted in these rows. Only remove the outgoing blocks.
   swipeLayers.movingContent.forEach(block=>block.remove());
   for(const block of incoming){
    block.style.removeProperty('translate');
    block.classList.remove('account-swipe-preview');
    block.inert=false;
   }
  }else{
   const preview=accountPreviewCache.get(index)||buildAccountPreview(index);
   for(const selector of ['.operation-panel','.home-actions',homeAccountIntro]){
    pane.querySelector(selector).replaceWith(preview.querySelector(selector));
   }
   fitMonetaryLabels(pane);
  }
  accountPreviewCache.delete(index);
  pane.classList.toggle('new-card-selected',newCardSelected);
  refreshSelectedCard();
  if(!incoming)setCarouselPosition(index);
  cleanupSwipe();
  scheduleAccountPreviews();
 }else cleanupSwipe();
}

slideCardTo=function(index){if(document.body.classList.contains('has-glass-history'))return;const l=prepareSwipe();index=Math.max(0,Math.min(allCards().length,index));const target=(l.index-index)*l.width;cardSlideAnimation?.cancel();const done=()=>index===l.index?cleanupSwipe():finishCardSelection(index);if(shouldReduceMotion()){moveHomeSwipe(target,false);done();return}cardSlideAnimation=settleCardStrip(()=>l.dx,x=>moveHomeSwipe(x,false),target,done)};
function bindHorizontalGesture(element,{read,write,settle,cancel,mouseOnly=false}){
 let start=null,dragging=false,vertical=false,samples=[],frame=0,pending=0;
 const stopClick=e=>{e.preventDefault();e.stopPropagation()};
 const flush=()=>{cancelAnimationFrame(frame);frame=0;if(start&&dragging)write(pending)};
 if(element.classList.contains('card-carousel'))bindCardTouchAxis(element);
 element.addEventListener('pointerdown',e=>{if(e.button!==0||start||(mouseOnly&&e.pointerType!=='mouse'))return;if(element.classList.contains('card-carousel')&&(e.clientX-$('#app').getBoundingClientRect().left<=28||document.body.classList.contains('has-glass-history')))return;if(element.classList.contains('home-content')&&(e.target.closest('.operation-panel')||e.clientX-element.getBoundingClientRect().left<=28))return;start={x:e.clientX,y:e.clientY,base:read(),id:e.pointerId};dragging=false;vertical=false;samples=[{x:e.clientX,time:performance.now()}]});
 element.addEventListener('pointermove',e=>{if(!start||e.pointerId!==start.id||vertical)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!dragging&&Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){vertical=true;return}if(!dragging&&Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.6){cancel();start.base=read()-(element.matches('.card-carousel, .stats-carousel')?Math.sign(dx)*14:0);dragging=true;element.setPointerCapture(e.pointerId)}if(!dragging)return;const time=performance.now();samples.push({x:e.clientX,time});samples=samples.filter(p=>time-p.time<100);pending=start.base+dx;if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(start&&dragging)write(pending)})});
 const end=e=>{if(!start||e.pointerId!==start.id)return;flush();const moved=dragging,first=samples[0],last=samples.at(-1),v=e.type==='pointercancel'?0:last&&first&&performance.now()-last.time<80&&last.time>first.time?(last.x-first.x)/(last.time-first.time)*1000:0;start=null;dragging=false;vertical=false;if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);if(moved){element.addEventListener('click',stopClick,{once:true,capture:true});setTimeout(()=>element.removeEventListener('click',stopClick,true),0);settle(v,e.type==='pointercancel'||e.type==='lostpointercapture')}};
 element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);element.addEventListener('lostpointercapture',e=>{if(start&&e.target===element&&!element.hasPointerCapture(e.pointerId))end(e)})
 return ()=>dragging;
}
function bindCardTouchAxis(element){
 // Claim horizontal touch movement before the scroll host can move vertically.
 // A vertical gesture or a gesture at the screen edge keeps its native behavior.
 let touchAxis=null;
 element.addEventListener('touchstart',event=>{
  const touch=event.touches[0];
  touchAxis=event.touches.length===1&&touch.clientX-$('#app').getBoundingClientRect().left>28
   &&!document.body.classList.contains('has-glass-history')
   ? {x:touch.clientX,y:touch.clientY,locked:false} : null;
 },{passive:true});
 element.addEventListener('touchmove',event=>{
  if(!touchAxis||event.touches.length!==1)return;
  const {clientX,clientY}=event.touches[0];
  const x=Math.abs(clientX-touchAxis.x),y=Math.abs(clientY-touchAxis.y);
  if(!touchAxis.locked&&y>=6&&y>=x){touchAxis=null;return}
  if(x>=6&&x>y*1.6)touchAxis.locked=true;
  if(touchAxis.locked&&event.cancelable)event.preventDefault();
 },{passive:false});
}
bindCardSwipe=function(){
 const pane=$('.card-carousel');if(!pane)return;
 carouselIndex=newCardSelected?allCards().length:allCards().findIndex(c=>c.id===activeCard().id);
 setCarouselPosition(carouselIndex);
 let wheelTimer=0,wheelFrame=0,wheelDelta=0;
 const cancelWheel=()=>{
  clearTimeout(wheelTimer);
  cancelAnimationFrame(wheelFrame);
  wheelFrame=0;
  wheelDelta=0;
 };
 const isDragging=bindHorizontalGesture(pane,{
  read:()=>swipeLayers?.dx||0,
  write:x=>moveHomeSwipe(x),
  cancel:()=>{cancelWheel();cardSlideAnimation?.cancel()},
  settle:(velocity,cancelled)=>{
   const layer=prepareSwipe(),projected=layer.dx+velocity*.12;
   slideCardTo(layer.index+(!cancelled&&Math.abs(projected)>layer.width*.25?(projected<0?1:-1):0));
  }
 });
 pane.addEventListener('wheel',event=>{
  if(document.body.classList.contains('has-glass-history')||Math.abs(event.deltaX)<=Math.abs(event.deltaY)||event.target.closest('.operation-panel,.home-product-track'))return;
  event.preventDefault();
  if(isDragging())return;
  cardSlideAnimation?.cancel();
  const layer=prepareSwipe();
  const flush=()=>{
   cancelAnimationFrame(wheelFrame);
   wheelFrame=0;
   if(swipeLayers===layer&&wheelDelta)moveHomeSwipe(layer.dx-wheelDelta);
   wheelDelta=0;
  };
  wheelDelta+=event.deltaX;
  if(!wheelFrame)wheelFrame=requestAnimationFrame(flush);
  clearTimeout(wheelTimer);
  wheelTimer=setTimeout(()=>{
   flush();
   if(swipeLayers===layer)slideCardTo(layer.index+(Math.abs(layer.dx)>layer.width*.2?(layer.dx<0?1:-1):0));
  },85);
 },{passive:false});
};

function captureBankSurface(preserveArtwork=false){
 const app=$('#app'),rect=app.getBoundingClientRect(),surface=document.createElement('div');
 surface.className='bank-surface-transition demo-transition-surface '+app.className;
 Object.assign(surface.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:app.offsetHeight+'px',background:getComputedStyle(app).background,zIndex:37,pointerEvents:'none',overflow:'hidden'});
 const source=$('#screen'),screen=source.cloneNode(true),style=getComputedStyle(source);
 screen.removeAttribute('id');
 screen.classList.add('transition-screen');
 for(const property of ['display','paddingTop','paddingRight','paddingBottom','paddingLeft','minHeight','boxSizing']){
  screen.style[property]=style[property];
 }
 screen.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
 if(!preserveArtwork){
  const expanded=screen.querySelector('.expanded-card');
  if(expanded)expanded.style.visibility='hidden';
  const selected=screen.querySelector('.card-face[data-id="'+state.activeCard+'"]');
  if(selected)selected.style.visibility='hidden';
 }
 surface.append(screen);
 const nav=$('#nav');
 if(!nav.hidden){
  const navigation=nav.cloneNode(true);
  navigation.removeAttribute('id');
  navigation.classList.add('transition-nav');
  surface.append(navigation);
 }
 surface.inert=true;
 return surface;
}

function fitMonetaryLabels(root=$('#screen')){
 const sizes=[['.home-balance strong',46,26],['.stats-summary>strong',46,24],['.capital-total>strong',38,22],['.compact-card>strong',21,12]];
 for(const [selector,max,min] of sizes){
  for(const el of root.querySelectorAll(selector)){
   el.style.fontSize=max+'px';
   const available=el.clientWidth;
   if(available&&el.scrollWidth>available)el.style.fontSize=Math.max(min,Math.floor(max*available/el.scrollWidth))+'px';
  }
 }
}
const beforeAmountRender=render;
render=function(){beforeAmountRender();fitMonetaryLabels()};
document.fonts.ready.then(()=>fitMonetaryLabels());

render();

