'use strict';

// Page transitions are one named surface; card transitions keep their own geometry.

let pageTransition=null,pageAnimation=null;
paint=function(direction){
 pageTransition?.skipTransition();pageAnimation?.cancel();
 if(skipPageMotion){skipPageMotion=false;render();return}
 if(shouldReduceMotion()||['home','card'].includes(route.page)){render();return}
 document.documentElement.dataset.pageDirection=direction==='back'?'back':'forward';
 if(document.startViewTransition){const destination=route;pageTransition=document.startViewTransition(()=>{if(route===destination)render()});pageTransition.ready.catch(()=>{});pageTransition.updateCallbackDone.catch(()=>{});pageTransition.finished.catch(()=>{});return}
 render();pageAnimation=$('#screen').animate([{opacity:.65,transform:`translate3d(${direction==='back'?-12:12}px,0,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)'})
};

function launchRefreshRocket(panel){const spinner=$('.refresh-indicator');spinner?.classList.add('refreshing');if(panel&&!shouldReduceMotion()){const rect=panel.getBoundingClientRect(),lane=document.createElement('div');lane.className='refresh-rocket-lane';Object.assign(lane.style,{left:rect.x+rect.width/2-24+'px',top:rect.top-58+'px'});lane.innerHTML='<img src="assets/reference/refresh-rocket.png" alt="">';document.body.append(lane);lane.firstChild.animate([{transform:'translate3d(0,76px,0)',opacity:0},{transform:'translate3d(0,20px,0)',opacity:1,offset:.35},{transform:'translate3d(0,-50px,0)',opacity:0}],{duration:650,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>lane.remove())}Promise.all([loadSharedState().catch(()=>{}),new Promise(r=>setTimeout(r,600))]).finally(()=>{spinner?.classList.remove('refreshing');if(spinner){spinner.style.opacity='';spinner.style.transform=''}})}

bindRefresh=function(){const app=$('#app');if(app.dataset.refreshV14)return;app.dataset.refreshV14='1';let start=null,pull=0,panel=null,active=false;

const begin=(x,y,target)=>{panel=target.closest('.operation-panel');if(route.page!=='home'||!panel||pageScrollY()>0)return;start={x,y};pull=0;active=false};

const move=(x,y)=>{if(!start||route.page!=='home')return false;const dx=x-start.x,dy=y-start.y;if(!active&&(dy<0||Math.abs(dx)>Math.abs(dy)*.8)){if(Math.abs(dx)>10||dy<-10)start=null;return false}pull=Math.min(110,Math.max(0,dy*.4));active=pull>5;panel.style.transform=`translate3d(0,${pull}px,0)`;const spinner=$('.refresh-indicator');if(spinner){spinner.style.opacity=String(Math.min(1,pull/50));spinner.style.transform=`translateX(-50%) rotate(${pull*4}deg)`}return active};

const end=()=>{if(!start)return;start=null;const refresh=active&&pull>=55,el=panel;el.style.transform='';if(active&&!shouldReduceMotion())el.animate([{transform:`translate3d(0,${pull}px,0)`},{transform:'translate3d(0,0,0)'}],{duration:280,easing:'cubic-bezier(.23,1,.32,1)'});active=false;if(refresh)launchRefreshRocket(el);else{const spinner=$('.refresh-indicator');if(spinner){spinner.style.opacity='';spinner.style.transform=''}}};

app.addEventListener('touchstart',e=>{if(e.touches.length===1)begin(e.touches[0].clientX,e.touches[0].clientY,e.target)},{passive:true});app.addEventListener('touchmove',e=>{if(e.touches.length===1&&move(e.touches[0].clientX,e.touches[0].clientY))e.preventDefault()},{passive:false});app.addEventListener('touchend',end,{passive:true});app.addEventListener('touchcancel',end,{passive:true});app.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&!e.target.closest('button,input'))begin(e.clientX,e.clientY,e.target)});app.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')move(e.clientX,e.clientY)});app.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')end()});app.addEventListener('pointercancel',end);

};

let historyPresentation='card',skipPageMotion=false;

function historyDrawer(){const app=$('#app'),rect=app.getBoundingClientRect(),drawer=document.createElement('div');drawer.className='history-gesture-drawer';drawer.innerHTML=historyPage();drawer.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));drawer.inert=true;Object.assign(drawer.style,{left:rect.left+'px',width:rect.width+'px'});document.body.append(drawer);return drawer}

function bindOperationsGesture(){const panel=$('.operation-panel');if(!panel)return;let start=null,drawer=null,dx=0,dragging=false;

panel.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY};dx=0;dragging=false});

panel.addEventListener('pointermove',e=>{if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(!dragging&&Math.abs(y)>12&&Math.abs(y)>Math.abs(x)){start=null;return}if(!dragging&&Math.abs(x)>12&&Math.abs(x)>Math.abs(y)*1.4){dragging=true;historyPresentation='drawer';drawer=historyDrawer();panel.setPointerCapture(e.pointerId)}if(!dragging)return;dx=Math.min(drawer.offsetWidth,Math.abs(x));drawer.style.transform=`translate3d(${dx-drawer.offsetWidth}px,0,0)`;$('#app').style.filter=`blur(${dx/drawer.offsetWidth*7}px)`;e.stopPropagation()});

const end=e=>{if(!start)return;start=null;if(!dragging)return;if(panel.hasPointerCapture(e.pointerId))panel.releasePointerCapture(e.pointerId);panel.addEventListener('click',e=>{e.stopPropagation();e.preventDefault()},{once:true,capture:true});const open=e.type!=='pointercancel'&&dx>drawer.offsetWidth*.23,width=drawer.offsetWidth,node=drawer;dragging=false;const finish=()=>{node.remove();$('#app').style.filter='';if(open){skipPageMotion=true;navigate('history')}};if(shouldReduceMotion())finish();else{node.animate([{transform:`translate3d(${dx-width}px,0,0)`},{transform:`translate3d(${open?0:-width}px,0,0)`}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)',fill:'forwards'}).finished.catch(()=>{}).finally(finish);$('#app').animate([{filter:`blur(${dx/width*7}px)`},{filter:open?'blur(7px)':'blur(0px)'}],{duration:240}).finished.catch(()=>{})}};

panel.addEventListener('pointerup',end);panel.addEventListener('pointercancel',end)

}

function bindCardCollapse(){const card=$('.expanded-card'),settings=$('.card-settings');if(!card)return;const update=()=>{if(route.page!=='card'||!card.isConnected){window.removeEventListener('scroll',update);return}const y=pageScrollY(),p=Math.min(1,Math.max(0,y/220)),scale=1-(1-64/card.offsetWidth)*p;card.style.transform=`translate3d(0,${y-61*p}px,0) scale(${scale})`;settings.classList.toggle('compact-card-view',p>.85)};window.addEventListener('scroll',update,{passive:true});update()}

const slowFlip=actions['flip-card'];actions['flip-card']=()=>{if(pageScrollY()>30){pageScrollTo({top:0,behavior:shouldReduceMotion()?'instant':'smooth'});return}slowFlip();const panel=$('.payment-settings');if(!panel)return;const s=state.cardSettings[activeCard().id]||{};panel.classList.toggle('internet-limit',cardFlipped);panel.innerHTML=cardFlipped?icon('lock-key')+`<span>Ліміт інтернет-оплати<progress max="100" value="${s.online===false?0:100}"></progress><small>${s.online===false?'Інтернет-оплати вимкнені':'Ліміт інтернет-оплати '+displayMoney(s.limit??10000)+' ₴'}</small></span>`:icon('gear')+'<span>Налаштування оплат<small>Додаткові перевірки</small></span>';if(!shouldReduceMotion())panel.animate([{opacity:.3},{opacity:1}],{duration:240,easing:'ease-out'})};

const legacyTransfer=transfer;

let recipientDraft=null,recipientQuery='';

const normalizedCard=value=>String(value||'').replace(/[\s-]/g,'');

function bankForRecipient(number){const card=normalizedCard(number),own=allCards().find(c=>normalizedCard(c.card)===card),contact=state.contacts.find(c=>normalizedCard(c.card)===card);if(own)return {bankType:'mono',bankName:'monobank',logo:null};if(contact)return {bankType:contact.bankType||'other',bankName:contact.bankName||'',logo:contact.logo||null};const prefix=[...(state.bankDirectory||[])].sort((a,b)=>b.prefix.length-a.prefix.length).find(b=>card.startsWith(b.prefix));return prefix?{bankType:prefix.bankType,bankName:prefix.name,logo:prefix.logo||null}:{bankType:'other',bankName:'Інший банк',logo:null}}

transfer=function(type='card',prefill={}){if(type!=='card')return legacyTransfer(type,prefill);blocked();recipientDraft=prefill.recipient?{...bankForRecipient(prefill.recipient),...prefill,amount:prefill.amount?Math.abs(Number(prefill.amount)):''}:null;navigate(recipientDraft?'transferAmount':'transfer')};

function transferSymbol(){return `<svg class="icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5h19v17M5 9h19v18H5zM9 14l5 4-5 4m5-4H8"/></svg>`}

function recipientPicture(person){if(person.logo)return `<img src="${esc(person.logo)}" alt="">`;return person.bankType==='mono'?transferSymbol():icon('credit-card')}

function cardNumberError(value){const n=normalizedCard(value);if(!/^\d{16}$/.test(n))return 'Номер картки має містити рівно 16 цифр';if(/^(\d)\1{15}$/.test(n))return 'Перевірте номер картки';let sum=0;for(let i=0;i<16;i++){let d=Number(n[i]);if(i%2===0){d*=2;if(d>9)d-=9}sum+=d}return sum%10?'Перевірте цифри номера картки':''}

function recipientForNumber(value){const number=normalizedCard(value),own=allCards().find(c=>normalizedCard(c.card)===number),contact=state.contacts.find(c=>normalizedCard(c.card)===number);return {recipient:number.match(/.{1,4}/g)?.join(' ')||'',title:own?.account||contact?.name||'',...bankForRecipient(number),...(own?{ownCardId:own.id}:{})}}

function recipientSearchResult(query){const n=normalizedCard(query),numeric=/^[\d\s-]+$/.test(query);if(!query.trim()||!numeric)return '';const error=cardNumberError(n);if(error)return `<p class="recipient-validation" role="status">${n.length<16?'Введіть ще '+(16-n.length)+' цифр':esc(error)}</p>`;const r=recipientForNumber(n),known=!!r.title;return `<div class="recipient-result"><p class="recipient-result-label">${known?'Знайдено':'Номер картки перевірено'}</p><button type="button" class="native-group transfer-contact" data-action="recipient-found"><span class="recipient-icon ${r.bankType==='mono'?'mono':'other'}">${recipientPicture(r)}</span><span>${esc(r.title||(r.bankType==='mono'?'На картку':r.bankName))}<small>${esc(r.recipient)}</small></span>${icon('caret-right')}</button>${known?'':'<p class="recipient-disclaimer">Формат і контрольну суму перевірено. Власника та існування картки демо не перевіряє.</p>'}</div>`}

function transferPage(){return `<div class="transfer-page"><header class="transfer-gradient"><div class="transfer-top"><button data-action="back" aria-label="Назад">${icon('arrow-left')}</button><button data-action="nav" data-page="transferArchive" aria-label="Архів">${icon('clock')}</button></div><h1>Переказ на картку</h1><form id="recipient-search" novalidate><input id="recipient-query" name="recipient" value="${esc(recipientQuery)}" placeholder="Введіть ім’я, номер картки або телефон" aria-label="Введіть ім’я, номер картки або телефон" aria-describedby="recipient-result" autocomplete="off" maxlength="40" enterkeyhint="search"><button type="button" data-action="reference-qr" aria-label="Сканувати QR-код">${icon('qr-code')}</button></form></header><div class="page transfer-options"><div id="recipient-result" aria-live="polite">${recipientSearchResult(recipientQuery)}</div><div id="transfer-suggestions" ${/^[\d\s-]+$/.test(recipientQuery)?'hidden':''}><section class="native-group transfer-group">${button('group-expenses','Групові витрати','users')}</section><div class="transfer-own">${allCards().filter(c=>c.id!==activeCard().id).map(c=>`<button class="native-group transfer-contact" data-action="transfer-own-card" data-id="${c.id}"><span class="recipient-icon own">m</span><span>На мою ${esc(c.account.replace(/ картка$/,'').replace(/Біла/i,'білу').replace(/Чорна/i,'чорну'))}</span></button>`).join('')}</div><section class="native-group transfer-contact-panel"><h2>Контакти</h2><div id="transfer-contact-list">${transferContacts(recipientQuery)}</div></section></div></div></div>`}

function transferContacts(query){const list=state.contacts.filter(c=>(c.name+' '+normalizedCard(c.card)).toLowerCase().includes(query.toLowerCase().replace(/\s/g,''))||c.name.toLowerCase().includes(query.toLowerCase()));return list.map(c=>`<button class="transfer-contact" data-action="transfer-contact" data-id="${c.id}"><span class="recipient-icon ${c.bankType==='mono'?'mono':'other'}">${c.logo?`<img src="${esc(c.logo)}" alt="">`:icon('users')}${c.bankType==='mono'?'<b>m</b>':''}</span><span>${esc(c.name)}</span>${icon('star')}</button>`).join('')||'<p class="info">Збережених контактів немає. Введіть 16 цифр картки зверху.</p>'}

function transferFundingCard(){return allCards().find(c=>c.id===recipientDraft?.fromCardId)||activeCard()}

function transferAmountPage(){const r=recipientDraft;if(!r)return transferPage();const c=transferFundingCard();return `<div class="transfer-page amount-entry-page"><header class="amount-entry-header"><button data-action="nav" data-page="transfer" aria-label="Назад">${icon('arrow-left')}</button><div class="amount-recipient"><span class="recipient-icon ${r.bankType==='mono'?'mono':'other'}">${recipientPicture(r)}</span><div>${r.title?`<strong>${esc(r.title)}</strong>`:'<label class="sr-only" for="recipient-title">Ім’я одержувача</label><input form="transfer-amount-form" id="recipient-title" name="title" placeholder="Ім’я одержувача" required maxlength="80" aria-label="Ім’я одержувача">'}<small>${icon('credit-card')} На ${esc(r.ownCardId?allCards().find(c=>c.id===r.ownCardId)?.account||'картку':'картку')}<span class="recipient-card-hint"> · ${esc(r.recipient.slice(-4))}</span></small></div></div></header><form id="transfer-amount-form" class="amount-entry-form">${r.title?`<input type="hidden" name="title" value="${esc(r.title)}">`:''}<div class="amount-center"><button type="button" class="amount-funding-pill" data-action="transfer-funding">${icon('credit-card')} ${displayMoney(cardBalance(c))} ₴ ${icon('caret-right')}</button><div class="amount-value"><label class="sr-only" for="transfer-sum">Сума, гривні</label><input id="transfer-sum" name="amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(r.amount||'')}" maxlength="13" required aria-label="Сума, гривні"><span>₴</span></div></div><footer class="amount-entry-footer"><div class="amount-comment">${icon('chat-circle-fill')}<input name="note" placeholder="Коментар…" maxlength="300" value="${esc(r.note||'')}" aria-label="Коментар"></div><p id="transfer-error" role="alert"></p><button class="primary" type="submit" disabled>Надіслати</button><p class="form-note">Демо · реальні кошти не переказуються</p></footer></form></div>`}

actions['transfer-funding']=()=>{modal('Виберіть картку для оплати',allCards().filter(c=>c.id!==recipientDraft?.ownCardId).map(c=>`<button type="button" class="funding-option" data-action="choose-transfer-funding" data-id="${c.id}"><span class="stats-mini-card">${cardArtwork(c)}</span><span>${esc(c.account)}<small>${displayMoney(cardBalance(c))} ₴</small></span>${c.id===transferFundingCard().id?'<span class="funding-check">✓</span>':''}</button>`).join(''),null);$('#modal').dataset.kind='sheet'};

actions['choose-transfer-funding']=b=>{recipientDraft.fromCardId=b.dataset.id;$('#modal').close();render()};

actions['group-expenses']=()=>inform('Групові витрати','Розділити витрату можна з деталей демонстраційної операції.');

actions['transfer-contact']=b=>{const c=state.contacts.find(c=>c.id===b.dataset.id);if(!c||cardNumberError(c.card)){toast('Перевірте номер картки контакту в адмінці');return}recipientDraft={recipient:c.card,title:c.name,...bankForRecipient(c.card)};navigate('transferAmount')};

actions['transfer-own-card']=b=>{const c=allCards().find(c=>c.id===b.dataset.id);if(!c||cardNumberError(c.card)){toast('Перевірте номер картки в адмінці');return}recipientDraft={recipient:c.card,title:c.account,bankType:'mono',bankName:'monobank',ownCardId:c.id};navigate('transferAmount')};

actions['recipient-found']=()=>{if(cardNumberError(recipientQuery))return;const r=recipientForNumber(recipientQuery);if(r.ownCardId===activeCard().id){toast('Оберіть іншу картку одержувача');return}recipientDraft=r;navigate('transferAmount')};

function bindTransfer(){const search=$('#recipient-search');if(search){const input=$('#recipient-query');input.oninput=()=>{document.documentElement.dataset.editing='true';const raw=input.value;if(/^[\d\s-]+$/.test(raw)){const digits=normalizedCard(raw);input.value=digits.match(/.{1,4}/g)?.join(' ')||''}recipientQuery=input.value;const numeric=/^[\d\s-]+$/.test(recipientQuery);$('#recipient-result').innerHTML=recipientSearchResult(recipientQuery);input.setAttribute('aria-invalid',String(numeric&&normalizedCard(recipientQuery).length>=16&&!!cardNumberError(recipientQuery)));$('#transfer-suggestions').hidden=numeric;$('#transfer-contact-list').innerHTML=transferContacts(recipientQuery)};search.onsubmit=e=>{e.preventDefault();const error=cardNumberError(input.value);if(error){$('#recipient-result').innerHTML=`<p class="recipient-validation error" role="alert">${esc(error)}</p>`;input.setAttribute('aria-invalid','true');return}$('#recipient-result').innerHTML=recipientSearchResult(input.value);$('[data-action="recipient-found"]')?.focus()}}

const form=$('#transfer-amount-form');if(!form)return;const updateAmount=()=>{const input=form.elements.amount,n=Number(input.value.replace(',','.'));input.style.width=Math.max(1,input.value.length||1)+'ch';form.querySelector('[type=submit]').disabled=!(Number.isFinite(n)&&n>0&&n<=999999999)};updateAmount();form.oninput=()=>{document.documentElement.dataset.editing='true';const f=new FormData(form);Object.assign(recipientDraft,{title:f.get('title'),amount:f.get('amount'),note:f.get('note')});updateAmount();$('#transfer-error').textContent=''};let saving=false;form.onsubmit=async e=>{e.preventDefault();if(saving)return;const data=new FormData(form),old=structuredClone(state),r=recipientDraft,button=form.querySelector('[type="submit"]');try{if(!r)throw Error('Оберіть одержувача');const error=cardNumberError(r.recipient);if(error)throw Error(error);if(r.ownCardId===transferFundingCard().id)throw Error('Оберіть іншу картку одержувача');const n=positive(String(data.get('amount')).replace(',','.')),title=String(data.get('title')||$('#recipient-title')?.value||'').trim();if(!title)throw Error('Укажіть ім’я');saving=true;button.disabled=true;button.textContent='Зберігаємо…';state.activeCard=transferFundingCard().id;debit(n,title,data.get('note'),'Переказ на картку');const t=state.transactions.at(-1);Object.assign(t,{recipient:r.recipient,bankType:r.bankType,bankName:r.bankName,bankId:r.bankId||null,recipientAvatar:r.recipientAvatar||null,logo:r.logo||null});if(r.ownCardId)state.transactions.push({id:uid(),createdAt:Date.now(),title:'З '+activeCard().account,amount:n,cardId:r.ownCardId,category:'Перекази',bankType:'mono',date:today(),time:t.time});await persist();recipientQuery='';recipientDraft=null;navigate('detail',t.id)}catch(err){state=old;if(err.conflict)await loadSharedState(true);if($('#transfer-error'))$('#transfer-error').textContent=err.message;saving=false;button.disabled=false;button.textContent='Надіслати'}}}



// Transaction header depends on explicit demo-bank metadata, never an invented BIN lookup.

const plainDetail=detail;

function operationBank(t){if(t.bankType)return t.bankType;if(t.bankId||t.bankName)return t.bankId==='mono'?'mono':'other';return /Переказ/i.test(t.category||'')?'other':'merchant'}

detail=function(){const t=currentTx();if(!t)return plainDetail();const bank=operationBank(t),html=plainDetail(),start=html.indexOf('<div class="detail-top">'),end=html.indexOf('<div class="chart-panel">');if(start<0||end<0)return html;const hero=`<section class="operation-hero ${bank==='mono'?'mono-operation':bank==='other'?'other-bank-operation':'merchant-operation'}"><div class="operation-art"><span class="operation-avatar ${bank==='other'?'small-bank':''}">${t.logo?`<img src="${esc(t.logo)}" alt="">`:bank==='mono'?transferSymbol():icon(bank==='merchant'?'shopping-bag-fill':'credit-card')}</span></div><div class="operation-identity"><h1>${esc(t.title)}</h1><strong class="${t.amount>0?'green':''}">${t.amount>0?'+':'−'}${displayMoney(Math.abs(t.amount))} ₴</strong><p>${esc(t.date)} · ${esc(t.time||'12:00')}${bank==='other'?' · '+esc(t.bankName||'Інший банк'):''}</p></div></section>`;return html.slice(0,start)+hero+`<div class="operation-body">`+html.slice(end)+'</div>'};

const showHistory=historyPage;

historyPage=function(){return `<div class="all-operations-page ${historyPresentation==='drawer'?'drawer-operations':'card-operations'}"><div class="all-operations-top"><button data-action="back" aria-label="Назад">${icon('arrow-left')}</button><span class="stats-mini-card">${cardArtwork(activeCard())}</span><button data-action="history-search" aria-label="Пошук">${icon('magnifying-glass')}</button></div>${historyPresentation==='card'?`<div class="history-card-identity"><strong>${displayMoney(balance())} ₴</strong></div>`:'<h1>Усі операції</h1>'}<div class="search history-search" hidden>${icon('magnifying-glass')}<input id="search" placeholder="Пошук операцій" aria-label="Пошук операцій"></div><div id="tx-list">${grouped(txFor())}</div></div>`};

actions['history-search']=()=>{const search=$('.history-search');search.hidden=!search.hidden;if(!search.hidden)$('#search').focus()};

const priorInteractionsRender=render;

render=function(){document.documentElement.dataset.motion=motionMode();if(loading){priorInteractionsRender();return}if(!adminMode&&['transfer','transferAmount','appSettings'].includes(route.page)){defaults();$('#app').className=route.page;$('#nav').hidden=true;$('#screen').innerHTML=route.page==='appSettings'?appSettingsPage():route.page==='transfer'?transferPage():transferAmountPage();bindTransfer()}else priorInteractionsRender();if(!adminMode&&route.page==='home')bindOperationsGesture();if(!adminMode&&route.page==='card')bindCardCollapse();if(!adminMode&&route.page==='history')bindHistoryDismiss();if(!adminMode&&route.page==='detail'){const t=currentTx();$('#app').classList.toggle('is-mono-operation',!!t&&operationBank(t)==='mono');$('#app').classList.toggle('is-other-bank-operation',!!t&&operationBank(t)==='other')}if(route.page==='history')$('#nav').hidden=true};



actions.avatar=()=>avatar();

actions['avatar-info']=()=>avatar();

actions['app-settings']=()=>navigate('appSettings');

function appSettingsPage(){const motion=motionMode();return toolbar('')+`<div class="page native-settings"><h1>Налаштування застосунку</h1><section class="native-group">${button('motion-settings','Анімації','stack-fill',motion==='full'?'Повні анімації':motion==='reduced'?'Зменшено рух':'Як у системі')}${button('haptic-settings','Тактильний відгук','device-mobile',state.haptics?'Увімкнено':'Вимкнено')}${button('avatar','Фото профілю','image')}${button('theme-settings','Тема застосунку','cat-fill','Темна')}${button('language-settings','Мова','users','Українська')}</section><section class="native-group">${button('nav','Про застосунок','question','','data-page="about"')}</section></div>`}

actions['motion-settings']=()=>modal('Анімації',select('Режим руху','motion',[['full','Повні анімації'],['system','Як у системі'],['reduced','Зменшити рух']],motionMode())+'<p class="form-note">Системне зменшення руху завжди враховується.</p>',f=>{state.motionPreference=f.get('motion');document.documentElement.dataset.motion=state.motionPreference});

actions['haptic-settings']=()=>change(()=>{state.haptics=!state.haptics;if(state.haptics&&navigator.vibrate)navigator.vibrate(12)});

actions['theme-settings']=()=>inform('Тема застосунку','Темна тема та градієнти карток відтворюють надані відео.');

actions['language-settings']=()=>inform('Мова застосунку','Українська');

const priorTxEditor=txForm;

txForm=function(id){priorTxEditor(id);const t=state.transactions.find(x=>x.id===id)||{};$('#fields').insertAdjacentHTML('beforeend',select('Банк / вигляд операції','bankType',[['mono','monobank'],['other','Інший банк'],['merchant','Покупка / торгова точка']],t.bankType||(/Переказ/i.test(t.category||'Переказ')?'other':'merchant'))+field('Назва банку','bankName',t.bankName||'','text','maxlength="80"'));const save=submit;submit=async f=>{await save(f);const tx=id?state.transactions.find(x=>x.id===id):state.transactions.at(-1);Object.assign(tx,{bankType:f.get('bankType'),bankName:f.get('bankName').trim()})}};

const priorContactEditor=actions['admin-contact'];

actions['admin-contact']=b=>{if(!adminMode)return;priorContactEditor(b);const c=state.contacts.find(x=>x.id===b.dataset.id)||{};$('#fields').insertAdjacentHTML('beforeend',select('Банк','bankType',[['mono','monobank'],['other','Інший банк']],c.bankType||'other')+field('Назва банку','bankName',c.bankName||'','text','maxlength="80"'));const save=submit;submit=async f=>{await save(f);const contact=b.dataset.id?state.contacts.find(x=>x.id===b.dataset.id):state.contacts.at(-1);Object.assign(contact,{bankType:f.get('bankType'),bankName:f.get('bankName').trim()})}};

const priorDefaults=defaults;

defaults=function(){priorDefaults();if(!Array.isArray(state.bankDirectory))state.bankDirectory=[]};

const previousBankAdmin=adminPage;

adminPage=function(){let html=previousBankAdmin();if(adminTab==='contacts'){const rows=state.bankDirectory.map(b=>adminRow(esc(b.name),esc(b.prefix)+' · '+(b.bankType==='mono'?'monobank':'Інший банк'),adminButton('admin-bank-rule','Змінити',b.id,'pencil-simple')+adminButton('admin-bank-rule-delete','Видалити',b.id,'trash'))).join('');const extra=`<div class="admin-section-title"><h2>Банки одержувачів</h2>${adminButton('admin-bank-rule','Додати правило')}</div><p class="info">Локальні правила демо: префікс картки визначає оформлення переказу. Номери не надсилаються до зовнішніх сервісів.</p>${rows}`;const at=html.lastIndexOf('</section>');html=html.slice(0,at)+extra+html.slice(at)}return html};

actions['admin-bank-rule']=b=>{if(!adminMode)return;adminSimpleForm('bankDirectory',b.dataset.id,'Банк одержувача',v=>field('Назва банку','name',v.name||'','text','required maxlength="80"')+field('Початок номера · 4–8 цифр','prefix',v.prefix||'','text','required minlength="4" maxlength="8" inputmode="numeric"')+select('Оформлення','bankType',[['mono','monobank'],['other','Інший банк']],v.bankType||'mono'),f=>{if(!/^\d{4,8}$/.test(f.get('prefix')))throw Error('Уведіть від 4 до 8 цифр');return {name:f.get('name').trim(),prefix:f.get('prefix'),bankType:f.get('bankType')}})};

actions['admin-bank-rule-delete']=b=>{if(adminMode)removeItem('bankDirectory',b.dataset.id,'Видалити правило?')};

const navBeforeHistory=actions.nav;actions.nav=b=>{if(b.dataset.page==='history')historyPresentation='card';return navBeforeHistory(b)};

const backBeforeHistory=back;
back=function(){
 if(route.page!=='history'||shouldReduceMotion())return backBeforeHistory();
 const source=$('.all-operations-page'),pose=source?getComputedStyle(source).transform:'none',node=historyDrawer();
 // Preserve the displayed list, search and scroll position throughout dismissal.
 if(source){node.replaceChildren(source.cloneNode(true));node.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));node.firstElementChild.style.transform='none';node.firstElementChild.style.marginTop=-pageScrollY()+'px'}
 const offset=pose==='none'?0:new DOMMatrixReadOnly(pose).m42;
 node.style.transform=`translate3d(0,${offset}px,0)`;skipPageMotion=true;backBeforeHistory();
 node.animate([{transform:`translate3d(0,${offset}px,0)`},{transform:'translate3d(0,100%,0)'}],{duration:280,easing:'cubic-bezier(.32,.72,0,1)'}).finished.catch(()=>{}).finally(()=>node.remove());
};actions.back=()=>back();
function bindHistoryDismiss(){
 const screen=$('#screen');let start=null,pull=0,returnMotion=null,axis=null;
 const begin=(x,y)=>{if(route.page!=='history'||pageScrollY()>0)return;const page=$('.all-operations-page'),pose=page?getComputedStyle(page).transform:'none';const base=pose==='none'?0:new DOMMatrixReadOnly(pose).m42;if(page)page.style.transform=`translate3d(0,${base}px,0)`;returnMotion?.cancel();start={x,y,base};pull=base;axis=null};
 const move=(x,y)=>{if(!start||route.page!=='history')return false;const dy=y-start.y,dx=x-start.x;if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>7)axis=dy>0&&dy>Math.abs(dx)*1.2?'vertical':'other';if(axis!=='vertical')return false;pull=Math.max(0,start.base+dy*.65);const page=$('.all-operations-page');if(page)page.style.transform=`translate3d(0,${pull}px,0)`;return true};
 const end=(cancelled=false)=>{if(!start)return;start=null;const page=$('.all-operations-page');if(!cancelled&&pull>65){back()}else if(page){if(shouldReduceMotion())page.style.transform='';else{const from=pull;page.style.transform='';returnMotion=page.animate([{transform:`translate3d(0,${from}px,0)`},{transform:'translate3d(0,0,0)'}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)'})}}pull=0;axis=null};
 screen.onpointerdown=e=>{if(e.pointerType==='mouse'&&!e.target.closest('input,button'))begin(e.clientX,e.clientY)};screen.onpointermove=e=>{if(e.pointerType==='mouse')move(e.clientX,e.clientY)};screen.onpointerup=e=>{if(e.pointerType==='mouse')end()};screen.onpointercancel=()=>end(true);
 screen.ontouchstart=e=>{if(e.touches.length===1&&!e.target.closest('input,button'))begin(e.touches[0].clientX,e.touches[0].clientY)};screen.ontouchmove=e=>{if(e.touches.length===1&&move(e.touches[0].clientX,e.touches[0].clientY))e.preventDefault()};screen.ontouchend=()=>end();screen.ontouchcancel=()=>end(true)
}

const adminCardBeforeDetails=cardAdmin;

cardAdmin=function(id){adminCardBeforeDetails(id);const settings=state.cardSettings[id]||{};$('#fields').insertAdjacentHTML('beforeend',field('Термін дії демо-картки · ММ/РР','demoExpiry',settings.demoExpiry||'11/30','text','required maxlength="5" inputmode="numeric" placeholder="11/30"')+field('Демонстраційний CVV · 3 цифри','demoCVV',settings.demoCVV||'000','text','required minlength="3" maxlength="3" inputmode="numeric"')+'<p class="form-note">Використовуйте вигадані реквізити для демонстрації.</p>');const save=submit;submit=async f=>{const expiry=f.get('demoExpiry').trim(),cvv=f.get('demoCVV').trim();if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry))throw Error('Термін дії: ММ/РР, місяць від 01 до 12');if(!/^\d{3}$/.test(cvv))throw Error('Демо-CVV має містити 3 цифри');await save(f);const cardId=id||state.extraCards.at(-1).id;state.cardSettings[cardId]={...state.cardSettings[cardId],demoExpiry:expiry,demoCVV:cvv}}};



render();

