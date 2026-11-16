'use strict';
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
const bankQuestionGlyph='<svg class="icon" viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M5 7a7 7 0 1 1 11 5c-3 2-4 3-4 7"/><circle cx="12" cy="25" r=".8" fill="currentColor" stroke="none"/></svg>';
const bankReplyPaymentGlyph='<svg class="icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 6-7 7 7 7M4 13h12a8 8 0 0 1 8 8"/></svg>';
const bankBlockUserGlyph='<svg class="icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M3 24v-3a9 9 0 0 1 14-7"/><circle cx="21" cy="21" r="5"/><path d="m17.5 24.5 7-7"/></svg>';
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
 return template.innerHTML;
};
