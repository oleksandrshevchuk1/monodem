'use strict';
// Screens and assets measured from RPReplay_Final1794735286; data remains local.
let referenceImage=(name,cls='')=>`<img class="${cls}" src="assets/reference/${name}.png" alt="" draggable="false">`;
const demoBanks=[{id:'mono',name:'monobank',bankType:'mono',logo:null},{id:'pumb',name:'ПУМБ',bankType:'other',logo:'assets/reference/bank-pumb.png'},{id:'sense',name:'Sense Bank',bankType:'other',logo:'assets/reference/bank-sense.png'},{id:'other',name:'Інший банк',bankType:'other',logo:null}];
// BIN data adapted from ramoona/banks-db (CC BY 4.0).
// https://github.com/ramoona/banks-db/tree/main/banks/ua
// Snapshot 2026-11-19. Names and local artwork mappings adapted here.
const automaticBankBins = [{"id":"mono","prefixes":[444111,537541],"name":"monobank"},{"id":"privat","prefixes":[410653,414949,414960,414962,414963,423396,424600,432575,434158,440509,440535,440588,458122,462708,473118,473121,475538,476339,516798,516874,516875,516933,521153,521857,530217,532957,536354,544457,545709,552324,558335,558424],"name":"ПриватБанк"},{"id":"pumb","prefixes":[404170,406660,412717,419316,428337,431437,482415,510117,510536,512647,516059,516750,518778,518985,520173,521327,521514,521762,521832,523778,524729,524814,525410,525493,526858,530186,530359,533686,533731,537003,538814,539715,540892,540953,541271,542171,542521,544044,544187,545219,547650,548343,548919,549385,550250,552154,552611,553045,553053,557104,558262,558381,558591,670604,670832,676622,676652,676700,677210,677567,677701],"name":"ПУМБ (Перший Український Міжнародний Банк)"},{"id":"sense","prefixes":[410247,422605,423719,536364,543259,544904,547994],"name":"Sense Bank"},{"id":"credit-agricole","prefixes":[411948,512439,519745,520662,525822],"name":"Креді Агріколь Банк (Україна)"},{"id":"kredobank","prefixes":[438253],"name":"Кредобанк"},{"id":"oschadbank","prefixes":[515662,545265,555952,557744],"name":"Ощадбанк"},{"id":"otp","prefixes":[406760,406788,411749,416955,436323,471362,528534,533194,546886,547266],"name":"OTP Bank"},{"id":"pravex","prefixes":[404764,405247,409089,409388,409625,409881,461278,536444,541701,544142,552670,676274],"name":"ПРАВЕКС-БАНК"},{"id":"procredit","prefixes":[417679,433424],"name":"ПроКредит Банк (Украина)"},{"id":"raif","prefixes":[413062,414953,418844,423843,462775,512070,512557,512572,516913,518808,529919,532457,535160,536502,542465,543155,543759,545253,548658,548968,552657,557723,557881],"name":"Райффайзен Банк Аваль"},{"id":"ukreximbank","prefixes":[403520,406337,423297,427705,440272,478766,510140,515855,516882,518720,522473,522766,522872,523473,524876,527598,528953,529801,530004,530094,536270,539897,540381,540682,541740,541940,542031,543205,544510,547390,547734,547762,548390,548766,550617,552247,552571,552624,552735,553465,554966,557833,558311,558797,676895,676965,677046,677279,677325,677613],"name":"Укрэксимбанк"},{"id":"ukrgasbank","prefixes":[401800,403471,510449,512100,512743,516854,517725,517818,518654,521833,522654,522797,522967,524872,525672,525792,527412,528812,531007,531725,532343,539845,540305,540617,540637,543438,547313,547914,548883,549146,549582,549824,549896,553391,557110,670651,670669,670877,671103,677237,677490],"name":"УКРГАЗБАНК"},{"id":"ukrsib","prefixes":[407361,407368,417232,427830,434343,516930,529578,533037,535129],"name":"УКРСИББАНК"}];
for(const bank of automaticBankBins){
 if(!demoBanks.some(item=>item.id===bank.id)){
  demoBanks.splice(demoBanks.length-1,0,{
   id:bank.id,name:bank.name,bankType:bank.id==='mono'?'mono':'other',
   logo:['privat','sense','pumb','raif','ukrsib'].includes(bank.id)?'assets/reference/bank-'+bank.id+'.png':null
  });
 }
}
const lookupBeforeAutomaticBins=bankForRecipient;
bankForRecipient=function(number){
 const card=normalizedCard(number);
 const override=window.cabinetStorage?.getItem('recipient-bank:'+card);
 const selected=demoBanks.find(bank=>bank.id===override);
 if(selected)return {bankId:selected.id,bankName:selected.name,bankType:selected.bankType,logo:selected.logo};
 const existing=lookupBeforeAutomaticBins(number);
 if(existing.bankType==='mono'||existing.bankName&&existing.bankName!=='Інший банк')return existing;
 const match=automaticBankBins.find(bank=>bank.prefixes.some(prefix=>card.startsWith(String(prefix))));
 const bank=match&&demoBanks.find(item=>item.id===match.id);
 return bank?{bankId:bank.id,bankName:bank.name,bankType:bank.bankType,logo:bank.logo}:existing;
};
function bankPreset(person){return demoBanks.find(b=>b.id===person?.bankId)||demoBanks.find(b=>b.id!=='other'&&(person?.bankName||'').toLowerCase().includes(b.name.toLowerCase()))||(person?.bankType==='mono'?demoBanks[0]:demoBanks[3])}
function bankBadge(person){const bank=bankPreset(person);return bank.id==='mono'?'<b class="bank-badge mono-badge">m</b>':bank.logo?`<img class="bank-badge bank-mark bank-mark-${bank.id}" src="${bank.logo}" alt="${esc(bank.name)}" draggable="false">`:`<span class="bank-badge generic-bank">${icon('wallet')}</span>`}
const previousRecipientPicture=recipientPicture;
recipientPicture=function(person){return transferSymbol()+bankBadge(person)};
function bankChoices(selected){return demoBanks.map(b=>`<button type="button" class="bank-choice" data-action="choose-recipient-bank" data-id="${b.id}"><span class="recipient-icon mono">${recipientPicture({bankId:b.id,bankType:b.bankType,bankName:b.name})}</span><span>${esc(b.name)}</span>${selected===b.id?icon('check'):''}</button>`).join('')}
actions['recipient-bank']=()=>{if(!recipientDraft)return;modal('Банк одержувача',bankChoices(bankPreset(recipientDraft).id),null);$('#modal').dataset.kind='bank-picker'};
actions['choose-recipient-bank']=b=>{const bank=demoBanks.find(x=>x.id===b.dataset.id);if(!bank||!recipientDraft)return;Object.assign(recipientDraft,{bankId:bank.id,bankName:bank.name,bankType:bank.bankType,logo:bank.logo});try{window.cabinetStorage?.setItem('recipient-bank:'+normalizedCard(recipientDraft.recipient),bank.id)}catch{}$('#modal').close();render()};
const beforeBankAmount=transferAmountPage;
transferAmountPage=function(){return beforeBankAmount().replace('<span class="recipient-icon ', '<button type="button" data-action="recipient-bank" aria-label="Вибрати банк одержувача" class="recipient-icon ').replace('</span><div>', '</button><div>')};
function addBankAdminPicker(person,collection,id){
 const current=bankPreset(person);$('#fields').insertAdjacentHTML('beforeend',select('Банк · назва та значок','bankPreset',demoBanks.map(b=>[b.id,b.name]),current.id));
 const preview=document.createElement('div');preview.className='admin-bank-preview';$('#fields').append(preview);
 const update=()=>{const b=demoBanks.find(x=>x.id===$('#f-bankPreset')?.value)||demoBanks.find(x=>x.id===$('[name=bankPreset]').value);preview.innerHTML=`<span class="recipient-icon mono">${recipientPicture({bankId:b.id,bankName:b.name,bankType:b.bankType})}</span><span>${esc(b.name)}</span>`};update();$('[name=bankPreset]').onchange=update;
 const save=submit;submit=async f=>{await save(f);const bank=demoBanks.find(b=>b.id===f.get('bankPreset')),item=id?state[collection].find(x=>x.id===id):state[collection].at(-1);if(!item||!bank)return;Object.assign(item,{bankId:bank.id,bankType:bank.bankType,bankName:bank.id==='other'?(f.get('bankName')||bank.name):bank.name});if(bank.logo)item.logo=bank.logo;else if(person?.logo===demoBanks.find(b=>b.id===person?.bankId)?.logo)item.logo=null}
}
const beforeBankContact=actions['admin-contact'];actions['admin-contact']=b=>{beforeBankContact(b);if(adminMode)addBankAdminPicker(state.contacts.find(c=>c.id===b.dataset.id),'contacts',b.dataset.id)};
const beforeBankTx=txForm;txForm=function(id){beforeBankTx(id);if(adminMode)addBankAdminPicker(state.transactions.find(t=>t.id===id),'transactions',id)};
const beforeReferenceRows=rows;
rows=function(items){const template=document.createElement('template');template.innerHTML=beforeReferenceRows(items);const rowById=new Map([...template.content.querySelectorAll('.transaction')].map(node=>[node.dataset.id,node]));for(const t of items){const row=rowById.get(String(t.id)),avatar=row?.querySelector('.transaction-icon');if(!avatar)continue;const bank=bankPreset(t);if(bank.id==='sense'){avatar.className='transaction-icon sense-bank-icon';avatar.innerHTML=`<img src="${bank.logo}" alt="Sense Bank" draggable="false">`}else if(t.amount>0){if(bank.id!=='mono'&&bank.logo){avatar.className='transaction-icon incoming-bank-icon';avatar.innerHTML=`<img src="${bank.logo}" alt="${esc(bank.name)}" draggable="false">`}else if(!t.logo){avatar.className='transaction-icon income';avatar.innerHTML=topUpSymbol()}}else if(['mono','other'].includes(operationBank(t))||t.bankId||t.bankName){avatar.className='transaction-icon bank-transfer-icon';avatar.innerHTML=transferSymbol()+bankBadge(t)}}return template.innerHTML};
function operationBalance(t){const id=t.cardId||'main',card=allCards().find(c=>c.id===id)||mainCard();return card.opening+state.transactions.filter(x=>(x.cardId||'main')===id&&compareTransactions(x,t)>=0).reduce((sum,x)=>sum+x.amount,0)}
function homeToolImage(name,cls){
 return referenceImage(name,cls).replace('<img ','<img loading="eager" decoding="async" ');
}
function homeReferenceTools(){return `<div class="reference-home-tools"><div class="home-guide-strip"><button data-action="nav" data-page="limits">${homeToolImage('home-limit')}<span>Ліміти та<br>обмеження</span></button><button data-action="nav" data-page="abroad">${homeToolImage('home-abroad')}<span>Тим, хто за<br>кордоном</span></button></div><section class="home-useful"><h2>Корисне</h2><button class="exchange-rates" data-action="reference-rates"><span>${homeToolImage('currency-us')}<span><small>Долар США</small><strong>45.43 / 45.83</strong></span></span><span>${homeToolImage('currency-eu')}<span><small>Євро</small><strong>50.25 / 50.95</strong></span></span></button><div class="useful-small-grid">${[['Служба<br>підтримки','nav','support'],['Поширені<br>запитання','reference-faq',''],['Сканер<br>QR-коду','reference-qr','']].map(([label,action,page],i)=>`<button data-action="${action}" data-page="${page}">${homeToolImage('useful-'+i)}<span>${label}</span></button>`).join('')}</div><div class="useful-wide-grid"><button data-action="nav" data-page="statement">${homeToolImage('useful-3')}<span>Виписки та довідки</span></button><button data-action="reference-terms">${homeToolImage('useful-4')}<span>Умови та тарифи</span></button></div></section>${homeReferenceMarket()}</div>`}
const marketPreviewColors=['silver','blue','burgundy','black'];
const marketPreviewLabels=['Сріблястий','Блакитний','Бордовий','Чорний'];
const viewedMarketProducts=[
 {storage:'2 ТБ',price:'157 999',installment:'15 800',color:'silver'},
 {storage:'1 ТБ',price:'117 999',installment:'11 800',color:'silver'},
 {storage:'1 ТБ',price:'117 999',installment:'11 800',color:'blue'},
 {storage:'256 ГБ',price:'77 499',installment:'7 750',color:'blue'}
];
let marketPreviewOrder=viewedMarketProducts.map((_,index)=>index);
function marketProductPreview(product,index){
 const colorOrder=product.color==='blue'?[1,2,0,3]:[0,1,2,3];
 const title=`Смартфон Apple iPhone 18 Pro ${product.storage}`;
 const selected=product.selectedColor||product.color;
 return `<article class="home-product" data-market-preview="${index}">
  <button class="home-product-offer" data-action="market-preview-offer" data-title="${title}">
   <span class="product-photo">${homeToolImage('home-product-'+selected)}</span>
   <span class="product-title">Смартфон Apple<br>iPhone 18 Pro ${product.storage}</span>
  </button>
  <div class="product-colors" role="group" aria-label="Колір товару">
   ${colorOrder.map(i=>{
    const color=marketPreviewColors[i];
    const label=marketPreviewLabels[i];
    return i<2
     ?`<button data-action="market-preview-color" data-color="${color}" aria-label="${label}" aria-pressed="${color===selected}"></button>`
     :`<span data-color="${color}" aria-label="${label}"></span>`;
   }).join('')}
  </div>
  <strong>${product.price} ₴</strong>
  <button class="product-installment" data-action="market-preview-offer" data-title="${title}"><span><b>${product.installment} ₴</b><br>× 10 платежів</span>${homeToolImage('installment-paw')}</button>
 </article>`;
}
function homeReferenceMarket(){
 const names=['Смартфони та<br>гаджети','Побутова<br>техніка','Електро-<br>живлення','Одяг та взуття',"Ноутбуки та<br>комп’ютери",'ТВ, Аудіо та<br>Фото','Шини та<br>автотовари','Всі категорії'];
 return `<section class="home-market">
  <h2>В маркеті від 10 платежів на все ${homeToolImage('market-owl','inline-sticker')}</h2>
  <div class="home-market-categories">${names.map((name,i)=>`<button data-action="market-category" data-category="${name.replaceAll('<br>',' ')}"><span class="market-category-tile" style="--market-tile-x:${i%4/3*100}%;--market-tile-y:${i<4?0:100}%" aria-hidden="true"></span><span>${name}</span></button>`).join('')}</div>
  <h2>Ви переглядали ${homeToolImage('market-eyes','inline-sticker')}</h2>
  <div class="home-product-track">${marketPreviewOrder.map(index=>marketProductPreview(viewedMarketProducts[index],index)).join('')}</div>
 </section>`;
}
actions['market-preview-offer']=button=>{
 const index=Number(button.closest('[data-market-preview]')?.dataset.marketPreview);
 if(viewedMarketProducts[index])marketPreviewOrder=[index,...marketPreviewOrder.filter(item=>item!==index)];
 actions.offer(button);
};
actions['market-preview-color']=button=>{
 const preview=button.closest('[data-market-preview]');
 const color=button.dataset.color;
 const product=viewedMarketProducts[Number(preview?.dataset.marketPreview)];
 if(!product||!['silver','blue'].includes(color))return;
 product.selectedColor=color;
 preview.querySelector('.product-photo img').src='assets/reference/home-product-'+color+'.png';
 preview.querySelectorAll('.product-colors button').forEach(option=>{
  option.setAttribute('aria-pressed',String(option===button));
 });
};
homeFooter=homeReferenceTools;
homeOperationRows=()=>rows(txFor().slice(0,3));
actions['reference-rates']=()=>inform('Курс валют','45.43 / 45.83 USD · 50.25 / 50.95 EUR<br><br>Демонстраційні значення з відео, не поточний курс обміну.');
actions['reference-faq']=()=>inform('Поширені запитання','Демонстраційні платежі, картки та історія зберігаються локально. Особисті дані та банківські сервіси змінюються в адмінці.');
actions['reference-qr']=()=>inform('Сканер QR-коду','Сканування платіжних QR-кодів у локальному демо не підключено.');
actions['reference-terms']=()=>inform('Умови та тарифи','Це локальний макет. Блоки й числові значення відтворено з відео; банківські послуги та тарифи не застосовуються.');
function limitRow(title,value,max,image){return `<div class="reference-limit-row">${referenceImage(image)}<div><span>${title}</span><p><strong>Залишилось ${value} ₴</strong> / ${max} ₴</p><div class="reference-limit-track"><i style="transform:scaleX(${Math.min(1,Number(value.replaceAll(' ',''))/Number(max.replaceAll(' ','')))})"></i></div></div></div>`}
function isForeignTransfer(tx){return tx.transferScope==='foreign'||tx.limitType==='foreign'||tx.foreign===true}
function foreignTransfersUsed(){return state.transactions.filter(tx=>tx.amount<0&&String(tx.date||'').startsWith(today().slice(0,7))&&['mono','other'].includes(operationBank(tx))&&isForeignTransfer(tx)).reduce((sum,tx)=>sum-tx.amount,0)}
function monthlyTransfersUsed(){return state.transactions.filter(tx=>tx.amount<0&&String(tx.date||'').startsWith(today().slice(0,7))&&['mono','other'].includes(operationBank(tx))&&!isForeignTransfer(tx)).reduce((sum,tx)=>sum-tx.amount,0)}
function limitsPage(){const monthly=Number(state.demoMonthlyLimit??100000),label=monthly.toLocaleString('uk-UA').replaceAll('\u00a0',' '),used=monthlyTransfersUsed(),left=Math.max(0,monthly-used).toLocaleString('uk-UA'),foreignLeft=Math.max(0,Math.min(100000,monthly)-foreignTransfersUsed()).toLocaleString('uk-UA');return `<div class="reference-limits"><header class="reference-sticky-header"><button data-action="back" aria-label="Назад">${icon('arrow-left')}</button><span>Ліміти на місяць</span></header><main class="reference-page"><h1>Ліміти на місяць</h1><section class="reference-limit-group"><h2>Перекази</h2>${limitRow('На картки та IBAN',left,label,'limit-0')}<button class="increase-limit" data-action="reference-increase-limit">Збільшити суму на місяць</button>${limitRow('З валютної картки за кордон',foreignLeft,'100 000','limit-1')}<div class="limit-note">${referenceImage('limits-sticker')}<p>Ліміт переказів за кордон зменшується разом зі зменшенням ліміту на картки та IBAN</p></div></section><section class="reference-limit-group"><h2>Купівля валюти</h2>${limitRow('На депозит','200 000','200 000','limit-2')}${limitRow('На валютні картки','200 000','200 000','limit-3')}</section><section class="reference-limit-group"><h2>За кордоном</h2>${limitRow('У магазинах та інтернеті','100 000','100 000','limit-1')}${limitRow('На придбання нерухомості','500 000','500 000','limit-1')}${limitRow('SWIFT за оплату товарів та послуг','200 000','200 000','limit-1')}</section><section class="reference-limit-group other-limits"><h2>Інші ліміти</h2>${['Кредитні кошти','Власні кошти у гривні','Кошти у валюті','SWIFT перекази','Поповнення карток','Інші обмеження'].map((title,i)=>`<details><summary>${referenceImage('other-limit-'+i)}<span>${title}</span>${icon('caret-right')}</summary><p>Демонстраційні обмеження. Банківські операції не виконуються.</p></details>`).join('')}</section><button class="reference-legal" data-action="reference-terms">Оновлені <b>Умови і Правила</b> та <b>Тарифи</b></button></main></div>`}
actions['reference-increase-limit']=()=>{const used=monthlyTransfersUsed(),total=Number(state.demoMonthlyLimit??100000);modal('Збільшити суму на місяць',field('Ліміт на місяць, ₴','monthly',total,'number','required min="0" max="999999999" step="0.01"')+`<p class="form-note">Використано ${displayMoney(used)} ₴. Використана сума віднімається від установленого ліміту.</p>`,f=>{const value=Number(f.get('monthly'));if(!Number.isFinite(value)||value<0||value>999999999)throw Error('Введіть ліміт від 0 до 999 999 999 ₴');state.demoMonthlyLimit=Math.round(value*100)/100})};
function abroadPage(){return `<div class="reference-abroad">${toolbar('')}<main class="reference-page"><h1>Як користуватися картками<br>mono за кордоном ${referenceImage('abroad-globe','inline-sticker')}</h1><div class="abroad-reference-grid">${['Ліміти витрат у магазинах та інтернеті','Поповнення валютних карток','Зняття готівки','Мобільний зв’язок','Зелена картка для авто','Переваги преміальних карток'].map((title,i)=>`<button data-action="${i===0?'nav':'abroad-topic'}" data-page="limits" data-title="${title}">${referenceImage('abroad-'+i)}<span>${title}</span></button>`).join('')}</div></main></div>`}
actions['abroad-topic']=b=>inform(b.dataset.title,'Цей розділ відтворено з відео. Банківська послуга в локальному демо не підключається.');
surfaces.limits=limitsPage;surfaces.abroad=abroadPage;
actions['profile-sheet']=()=>{modal('',`<div class="reference-profile"><section><button data-action="personal-info">${referenceImage('profile-personal')}<span>Особисті дані та документи</span></button><button data-action="app-settings">${referenceImage('profile-settings')}<span>Налаштування застосунку</span></button></section><section><button data-action="personal-info"><span class="reference-avatar">${state.avatar?`<img src="${esc(state.avatar)}" alt="">`:icon('users')}</span><span>${esc(state.name)}<small>Особисті картки</small></span><b class="profile-selected">${icon('check')}</b></button><button data-action="service" data-service="ФОП">${referenceImage('profile-business')}<span>ФОП</span><b class="profile-business-more">Детальніше</b></button></section></div>`,null);$('#modal').dataset.kind='profile'};
const beforeReferenceDetail=detail;
detail=function(){const t=currentTx();if(!t||!['mono','other'].includes(operationBank(t)))return beforeReferenceDetail();const legacy=plainDetail(),chartStart=legacy.indexOf('<div class="chart-panel">'),afterChart=legacy.indexOf('<section class="receipt-link">');const date=new Date(t.date+'T12:00:00').toLocaleDateString('uk-UA',{day:'numeric',month:'long',year:'numeric'}).replace(' р.','');return toolbar('',`<button class="right" data-action="favorite" aria-label="Закріпити операцію">${icon(t.favorite?'star-fill':'star')}</button>`)+`<div class="reference-operation"><div class="reference-operation-pattern"></div><section class="reference-operation-head"><div class="reference-operation-avatar">${transferSymbol()}${bankBadge(t)}</div><h1>${esc(t.title)}</h1><div class="reference-category"><span></span><button data-action="reference-edit-note">Переказ на картку ${icon('pencil-simple')}</button><span></span></div><p>${esc(date)}, ${esc(t.time||'12:00')}</p><strong class="reference-operation-amount ${t.amount>0?'green':''}">${t.amount>0?'+':'−'}${displayMoney(Math.abs(t.amount))} ₴</strong></section><div class="reference-operation-body">${operationBank(t)==='other'&&t.amount<0?`<button class="reference-invite" data-action="reference-invite">${referenceImage('invite-mail')}<span>Запросити отримувача до monobank</span><small>Та отримати <b>100₴</b> на рахунок кешбеку</small></button>`:''}<section class="reference-operation-edit"><button data-action="reference-edit-note">${icon('receipt-fill')}<span>${esc(t.note||'Опис та #теги')}</span></button><button data-action="reference-upload">${icon('upload-simple')}<span>Завантажити файл</span></button></section><div class="reference-balance">${icon('wallet')}<span><small>Залишок</small>${displayMoney(operationBalance(t))} ₴</span></div><div class="reference-chart-heading"><span></span><p>Витратили ${displayMoney(Math.abs(t.amount))} ₴ за півроку</p><span></span></div>${chartStart>=0?legacy.slice(chartStart,afterChart):''}${afterChart>=0?legacy.slice(afterChart):''}</div></div>`};
actions['reference-edit-note']=()=>{const t=currentTx();modal('Опис та #теги',field('Опис','note',t.note||'','text','maxlength="300"')+field('Тег','tag',t.tag||'','text','maxlength="40"'),f=>{t.note=f.get('note');t.tag=f.get('tag')})};
actions['reference-upload']=()=>inform('Завантажити файл','Вкладення до операції можна додати в адмінці: Операції → Квитанція.');
actions['reference-invite']=()=>inform('Запросити отримувача до monobank','Демонстраційний екран із відео. Запрошення не надсилається, бонус не нараховується.');
const beforeReferenceRender=render;render=function(){beforeReferenceRender();if(!adminMode&&route.page==='limits'){const update=()=>{if(route.page!=='limits'){window.removeEventListener('scroll',update);return}$('.reference-sticky-header')?.classList.toggle('scrolled',pageScrollY()>65)};window.addEventListener('scroll',update,{passive:true});update()}};
render();
