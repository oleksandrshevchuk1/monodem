'use strict';
const recordedCardExpandTransition=expandTransition;
const measureBeforeStableCard=measureCardPose;
measureCardPose=function(el){const pose=measureBeforeStableCard(el);pose.geometry??=stableCardGeometry(el);pose.shadow=getComputedStyle(el).boxShadow;const material=el.querySelector('.card-material');pose.materialOpacity=material?getComputedStyle(material).opacity:'0';return pose};
const renderBeforeStableCard=render;render=function(){renderBeforeStableCard();const existing=$('.stable-card-close');if(route.page!=='card'||adminMode){existing?.remove();return}if(!$('.entry-overlay')){$('#app').inert=false;$('#nav').inert=false}if(!existing){const close=document.createElement('button');close.type='button';close.className='stable-card-close';close.setAttribute('aria-label','Закрити картку');close.innerHTML=icon('x');close.onclick=e=>{e.preventDefault();e.stopPropagation();back()};document.body.append(close)}};
render();

const cardSettingsGlyphs={
 'apple-pay':0,'toggle-block':1,'credit-info':2,'subscriptions':3,
 plastic:4,reissue:5,'card-status':6,'pin-info':7,cards:8,
 'card-details':9,'card-statement':10,'close-card-info':11
};
const cardPageBeforeGlyphs=cardPage;
cardPage=function(){
 const template=document.createElement('template');
 template.innerHTML=cardPageBeforeGlyphs();
 for(const row of template.content.querySelectorAll('.settings-group .menu-row')){
  const index=cardSettingsGlyphs[row.dataset.page||row.dataset.action];
  const oldIcon=row.querySelector(':scope > .icon');
  if(!Number.isInteger(index)||!oldIcon)continue;
  const glyph=document.createElement('span');
  glyph.className='icon settings-glyph';
  glyph.setAttribute('aria-hidden','true');
  glyph.style.setProperty('--glyph-position',`${index/11*100}%`);
  oldIcon.replaceWith(glyph);
 }
 return template.innerHTML;
};

// Retain the original card morph while keeping the recovered layout and close control.
expandTransition=recordedCardExpandTransition;

// Upgrade bundled bank marks without touching uploaded recipient portraits.
const sharpBankMarks={'assets/reference/bank-otp.png':'assets/brands/otp-icon.svg','assets/reference/bank-pumb.png':'assets/brands/pumb-circle.svg','assets/reference/bank-privat.png':'assets/brands/privat-icon.svg','assets/reference/bank-abank.png':'assets/brands/abank-word.svg','assets/reference/bank-sense.png':'assets/brands/sense-icon.svg'};
for(const bank of demoBanks)if(sharpBankMarks[bank.logo])bank.logo=sharpBankMarks[bank.logo];
const renderBeforeSharpMarks=render;render=function(){renderBeforeSharpMarks();document.querySelectorAll('img[src]').forEach(img=>{const source=img.getAttribute('src');if(sharpBankMarks[source])img.src=sharpBankMarks[source]})};render();
