'use strict';
const recordedCardExpandTransition=expandTransition;
// Restore the stable card layout and remove the experimental pinned-card behavior.
bindCardCollapse=function(){naturalCardScrollCleanup?.();const card=$('.expanded-card');if(card)card.style.transform='';$('.card-settings')?.classList.remove('compact-card-view')};
measureCardPose=measureBeforeHeaderThumbnail;
expandTransition=function(from,to){if(preciseCardScene){preciseCardScene.motion.cancel();preciseCardScene.target.style.opacity='';preciseCardScene.node.remove();preciseCardScene.backdrop?.remove();preciseCardScene.header?.remove();preciseCardScene=null}if(softCardSession){softCardSession.motion.cancel();softCardSession.target.style.opacity='';softCardSession.node.remove();softCardSession=null}from?.snapshot?.remove();if(to)to.style.opacity='';document.querySelectorAll('.card-return-header,.soft-card-surface').forEach(el=>el.remove());delete document.documentElement.dataset.gesture;$('#screen').style.visibility='';restoreOperationsNav();if(!shouldReduceMotion())$('#screen').animate([{opacity:.8},{opacity:1}],{duration:160,easing:'cubic-bezier(.23,1,.32,1)'})};
const renderBeforeStableCard=render;render=function(){renderBeforeStableCard();const existing=$('.stable-card-close');if(route.page!=='card'||adminMode){existing?.remove();return}if(!$('.entry-overlay')){$('#app').inert=false;$('#nav').inert=false}if(!existing){const close=document.createElement('button');close.type='button';close.className='stable-card-close';close.setAttribute('aria-label','Закрити картку');close.innerHTML=icon('x');close.onclick=e=>{e.preventDefault();e.stopPropagation();back()};document.body.append(close)}};
render();

// Retain the original card morph while keeping the recovered layout and close control.
expandTransition=recordedCardExpandTransition;

// Upgrade bundled bank marks without touching uploaded recipient portraits.
const sharpBankMarks={'assets/reference/bank-pumb.png':'assets/brands/pumb-circle.svg','assets/reference/bank-privat.png':'assets/brands/privat-icon.png','assets/reference/bank-abank.png':'assets/brands/abank-word.svg','assets/reference/bank-sense.png':'assets/brands/sense-icon.png'};
for(const bank of demoBanks)if(sharpBankMarks[bank.logo])bank.logo=sharpBankMarks[bank.logo];
const renderBeforeSharpMarks=render;render=function(){renderBeforeSharpMarks();document.querySelectorAll('img[src]').forEach(img=>{const source=img.getAttribute('src');if(sharpBankMarks[source])img.src=sharpBankMarks[source]})};render();
