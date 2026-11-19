'use strict';

// Vector outlines redrawn against RPReplay_Final1794740354.mp4 at 3.58s.
const transferActionPaths={
 split:'<path d="M7 5v9a11 11 0 0 0 22 0V5M3 9l4-4 4 4m14 0 4-4 4 4M18 25v10"/>',
 repeat:'<path d="M22 6a14 14 0 1 0 10 14M16 1l6 5-6 6"/>',
 'save-contact':'<path d="M18.6 23H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h21a2 2 0 0 1 2 2v12.25M3 9h25M3 14h25"/><circle cx="26" cy="26" r="8"/><path d="M26 21v10m-5-5h10"/>',
 receipt:'<path d="M7 2h16l8 8v24H7ZM23 2v9h8M12 8h6m-6 9h14m-14 6h14m-14 6h14"/>',
 regular:'<circle cx="18" cy="18" r="14"/><path d="M18 10v10l6 4"/>',
 installments:'<path d="M16 5a14 14 0 1 0 15 15H16ZM20 2v14h14A14 14 0 0 0 20 2Z"/>',
 'support-tx':'<path d="M10 10a8 8 0 0 1 16 0c0 5-8 7-8 13v2"/><circle cx="18" cy="32" r="1.35" fill="currentColor" stroke="none"/>'
};
const transferActionGlyph=name=>'<svg class="icon transfer-action-glyph" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+transferActionPaths[name]+'</svg>';

// Bank identities remain opaque and sharp at every size.
const bankDetailSvg=source=>'data:image/svg+xml;base64,'+btoa(source);
const privatMark='<path fill="#69ad4d" d="M0 0h100v100H51c0-28-23-51-51-51V29c38 0 69 30 72 51h8V21H21v8H0Z"/><path fill="#080808" d="M0 62h38v38H0Z"/>';
const bankDetailArt={
 sense:bankDetailSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#3218ff"/><text x="50" y="74" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="76">S</text></svg>'),
 privat:bankDetailSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${privatMark}</svg>`),
 privatBadge:bankDetailSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#dff4d6"/><g transform="translate(24 24) scale(.52)">${privatMark}</g></svg>`),
 otpBadge:bankDetailSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#79c934"/><path fill="white" d="M50 18a32 32 0 1 0 32 32H70a20 20 0 1 1-20-20Z"/><circle cx="50" cy="50" r="14" fill="white"/><circle cx="70" cy="32" r="8" fill="white"/></svg>')
};
for(const source of Object.values(bankDetailArt)){const img=new Image();img.src=source;readyAssetImages.push(img);img.decode().catch(()=>{})}
const bankPresetBeforeReferenceDetail=bankPreset;
bankPreset=function(person){const bank=bankPresetBeforeReferenceDetail(person);return bankDetailArt[bank.id]?{...bank,logo:bankDetailArt[bank.id]}:bank};
const badgeBeforeReferenceDetail=bankBadge;
bankBadge=function(person){const bank=bankPreset(person),source=bank.id==='privat'?bankDetailArt.privatBadge:bank.id==='otp'?bankDetailArt.otpBadge:null;return source?`<img class="bank-badge bank-mark bank-mark-${bank.id}" src="${source}" alt="${esc(bank.name)}" decoding="sync" draggable="false">`:badgeBeforeReferenceDetail(person)};
const bankNoteGlyph='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="3" fill="currentColor"/><path d="M10 8h4m-4 5h3" stroke="#252525" stroke-width="2.5" stroke-linecap="round"/></svg>';
const bankUploadGlyph='<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 2h8v5a3 3 0 0 0 3 3h3v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm10 0 4 6h-3a1 1 0 0 1-1-1Z"/><path d="m9 15 3-3 3 3m-3-3v7" fill="none" stroke="#252525" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const bankWalletGlyph='<svg class="icon bank-balance-glyph" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="14" fill="#000"/><rect x="6" y="7" width="16" height="14" rx="4" fill="white"/><path d="M22 11h-5a3 3 0 0 0 0 6h5" fill="#000"/><circle cx="18" cy="14" r="1.2" fill="white"/></svg>';
const bankQuestionGlyph=transferActionGlyph('support-tx');
const bankReplyPaymentGlyph='<svg class="icon transfer-action-glyph" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 30h17a10 10 0 0 0 0-20H8m7-7-7 7 7 7"/></svg>';
const bankBlockUserGlyph='<svg class="icon transfer-action-glyph" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="18" r="14.5"/><path d="m7.75 28.25 20.5-20.5"/></svg>';
const detailBeforeBankReferenceScreens=detail;
detail=function(){
 const tx=currentTx(),html=detailBeforeBankReferenceScreens();
 if(!tx||!['mono','other'].includes(operationBank(tx)))return html;
 const bank=bankPreset(tx),template=document.createElement('template');template.innerHTML=html;
 const screen=template.content.querySelector('.reference-operation');if(!screen)return html;
 screen.classList.add('bank-reference-detail');screen.dataset.bank=bank.id;screen.dataset.direction=tx.amount>0?'income':'expense';
 const pattern=screen.querySelector('.reference-operation-pattern'),avatar=screen.querySelector('.reference-operation-avatar');
 if(tx.amount>0&&bank.id!=='mono'&&bank.logo){
  screen.classList.add('external-bank-incoming');if(pattern){pattern.replaceChildren();pattern.classList.remove('avatar-operation-background');pattern.removeAttribute('data-original-pattern');pattern.classList.add('bank-image-background');pattern.innerHTML=`<img src="${bank.logo}" alt="" decoding="sync" draggable="false">`}
  if(avatar){avatar.className='reference-operation-avatar incoming-avatar full-bank-avatar';avatar.innerHTML=`<img src="${bank.logo}" alt="${esc(bank.name)}" decoding="sync" draggable="false">`}
 }else if(tx.amount<0&&bank.id!=='sense'){
  if(pattern){pattern.replaceChildren();pattern.classList.remove('avatar-operation-background')}
  if(avatar){avatar.className='reference-operation-avatar outgoing-bank-avatar';avatar.innerHTML=transferSymbol()+bankBadge(tx)}
 }
 if(tx.amount>0&&bank.id==='mono'&&pattern){const source=tx.recipientAvatar||tx.logo||'assets/launch/mark.svg';pattern.classList.add('bank-image-background');pattern.removeAttribute('data-original-pattern');pattern.innerHTML=`<img src="${esc(source)}" alt="" decoding="sync">`}
 // Incoming actions depend on the sending bank, never on whether a photo exists.
 if(tx.amount>0){
  const menu=screen.querySelector('.incoming-menu');
  if(bank.id!=='mono'){
   screen.querySelectorAll('.incoming-reply-row').forEach(node=>node.remove());
   if(menu)menu.innerHTML=button('support-tx','Поставити запитання','question');
  }else{
   if(menu)menu.innerHTML=button('repeat','Відповісти платежем','arrow-left')+button('incoming-block','Блокування користувачів','lock-key')+button('support-tx','Поставити запитання','question');
   const head=screen.querySelector('.reference-operation-head');
   if(head&&!head.querySelector('.incoming-reply-row'))head.insertAdjacentHTML('beforeend',`<div class="incoming-reply-row"><button data-action="incoming-reply">${referenceImage('incoming-reply')}Відповісти</button><button data-action="incoming-reaction" aria-label="Реакція">${referenceImage('incoming-smile')}</button></div>`);
  }
  menu?.querySelectorAll('.chevron').forEach(node=>node.remove());
  menu?.querySelector('[data-action=repeat]>.icon')?.replaceWith(document.createRange().createContextualFragment(bankReplyPaymentGlyph));
  menu?.querySelector('[data-action=incoming-block]>.icon')?.replaceWith(document.createRange().createContextualFragment(bankBlockUserGlyph));
 }
 const amount=screen.querySelector('.reference-operation-amount');if(amount){const parts=displayMoney(Math.abs(tx.amount)).split('.');amount.innerHTML=`<span class="operation-major">${tx.amount<0?'−':''}${parts[0]}</span><span class="operation-minor">.${parts[1]} ₴</span>`}
 const note=screen.querySelector('.reference-operation-edit [data-action=reference-edit-note]');if(note)note.querySelector('.icon')?.replaceWith(document.createRange().createContextualFragment(bankNoteGlyph));
 const upload=screen.querySelector('[data-action=reference-upload]');if(upload)upload.querySelector('.icon')?.replaceWith(document.createRange().createContextualFragment(bankUploadGlyph));
 screen.querySelector('.reference-balance>.icon')?.replaceWith(document.createRange().createContextualFragment(bankWalletGlyph));
 screen.querySelector('.incoming-menu [data-action=support-tx]>.icon')?.replaceWith(document.createRange().createContextualFragment(bankQuestionGlyph));
 if(tx.amount<0)screen.querySelectorAll('.detail-menu>.menu-row>.chevron').forEach(el=>el.remove());
 if(tx.amount<0)for(const [action] of Object.entries(transferActionPaths))screen.querySelector('.detail-menu [data-action="'+action+'"]>.icon')?.replaceWith(document.createRange().createContextualFragment(transferActionGlyph(action)));
 return template.innerHTML;
};

// Give touch and pointer users the same full-row feedback, cancelling it when they scroll.
(()=>{let press=null;const clear=()=>{press?.row.classList.remove('is-pressed');press=null};
 document.addEventListener('pointerdown',e=>{clear();const row=e.target.closest?.('.reference-operation-body .menu-row');if(row&&e.isPrimary){press={row,x:e.clientX,y:e.clientY};row.classList.add('is-pressed')}},{capture:true,passive:true});
 document.addEventListener('pointermove',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>10)clear()},{passive:true});
 for(const event of ['pointerup','pointercancel'])document.addEventListener(event,clear,true);window.addEventListener('blur',clear);
})();

// The patterned strip and the round bank mark share one sticky boundary.
const renderBeforeOperationBoundary = render;
render = function() {
 renderBeforeOperationBoundary();
 if (adminMode || route.page !== 'detail') return;

 const operation = $('#screen .reference-operation');
 const toolbar = $('#screen > .toolbar');
 const head = operation?.querySelector('.reference-operation-head');
 const avatar = head?.querySelector('.reference-operation-avatar');
 const pattern = operation?.querySelector('.reference-operation-pattern');
 if (!toolbar || !avatar || !pattern) return;

 const headerStyle = getComputedStyle(head);
 const boundary = head.getBoundingClientRect().top - operation.getBoundingClientRect().top;
 const avatarTop = avatar.getBoundingClientRect().top - operation.getBoundingClientRect().top;
 const height = Math.max(boundary, avatarTop + avatar.offsetHeight) + 2;
 const backdrop = document.createElement('div');
 backdrop.className = 'operation-boundary-pattern';
 backdrop.setAttribute('aria-hidden', 'true');
 backdrop.append(pattern.cloneNode(true));

 toolbar.style.setProperty('--operation-boundary', boundary + 'px');
 const slot = document.createElement('div');
 slot.className = 'operation-boundary-slot';
 slot.style.height = getComputedStyle(operation).paddingTop;
 toolbar.style.setProperty('--operation-toolbar-height', height + 'px');
 toolbar.style.setProperty('--operation-avatar-top', avatarTop + 'px');
 toolbar.style.setProperty('--operation-cap-color', headerStyle.backgroundColor);
 toolbar.style.setProperty('--operation-cap-radius', headerStyle.borderTopLeftRadius);
 toolbar.classList.add('operation-boundary-toolbar');
 toolbar.prepend(backdrop);
 toolbar.append(avatar);
 operation.classList.add('has-operation-boundary');
 slot.append(toolbar);
 operation.prepend(slot);
};
