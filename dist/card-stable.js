'use strict';
const recordedCardExpandTransition=expandTransition;
// Restore the stable card layout and remove the experimental pinned-card behavior.
bindCardCollapse=function(){naturalCardScrollCleanup?.();const card=$('.expanded-card');if(card)card.style.transform='';$('.card-settings')?.classList.remove('compact-card-view')};
measureCardPose=function(el){const pose=measureBeforeHeaderThumbnail(el);pose.geometry=stableCardGeometry(el);pose.shadow=getComputedStyle(el).boxShadow;pose.cornerRadius=parseFloat(getComputedStyle(el.querySelector(".bank-card")).borderTopLeftRadius);return pose};
const renderBeforeStableCard=render;render=function(){renderBeforeStableCard();const existing=$('.stable-card-close');if(route.page!=='card'||adminMode){existing?.remove();return}if(!$('.entry-overlay')){$('#app').inert=false;$('#nav').inert=false}if(!existing){const close=document.createElement('button');close.type='button';close.className='stable-card-close';close.setAttribute('aria-label','Закрити картку');close.innerHTML=icon('x');close.onclick=e=>{e.preventDefault();e.stopPropagation();back()};document.body.append(close)}};
render();

// Retain the original card morph while keeping the recovered layout and close control.
expandTransition=recordedCardExpandTransition;

// Upgrade bundled bank marks without touching uploaded recipient portraits.
const sharpBankMarks={'assets/reference/bank-otp.png':'assets/brands/otp-icon.svg','assets/reference/bank-pumb.png':'assets/brands/pumb-circle.svg','assets/reference/bank-privat.png':'assets/brands/privat-icon.svg','assets/reference/bank-abank.png':'assets/brands/abank-word.svg','assets/reference/bank-sense.png':'assets/brands/sense-icon.svg'};
for(const bank of demoBanks)if(sharpBankMarks[bank.logo])bank.logo=sharpBankMarks[bank.logo];
const renderBeforeSharpMarks=render;render=function(){renderBeforeSharpMarks();document.querySelectorAll('img[src]').forEach(img=>{const source=img.getAttribute('src');if(sharpBankMarks[source])img.src=sharpBankMarks[source]})};render();

const flipBeforeSettledFaces=actions['flip-card'];
actions['flip-card']=()=>{
 const card=$('.expanded-card');if(!card)return;
 const art=card.querySelector('.bank-card'),start=getComputedStyle(art).transform,token={};
 card._faceToken=token;card._flipMotion?.cancel();art.style.transition='none';card.classList.add('flipping');
 flipBeforeSettledFaces();
 const end=getComputedStyle(art).transform;
 const motion=art.animate([{transform:start},{transform:end}],{duration:shouldReduceMotion()?1:500,easing:getComputedStyle(document.documentElement).getPropertyValue('--ease-in-out').trim()||'ease-in-out',fill:'both'});
 card._flipMotion=motion;
 motion.finished.then(()=>{if(card._faceToken!==token)return;motion.cancel();art.style.transition='';card._flipMotion=null;card.classList.remove('flipping')}).catch(()=>{});
};
