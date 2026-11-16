"use strict";
// Demo-only codes: no payment credentials or provider integration.
(()=>{
 const period=1200000;
 const before=cardArtwork;
 cardArtwork=function(c){return before(c).replace('class="bank-card ','data-demo-card="'+esc(c.id)+'" class="bank-card ').replace('<div class="card-back-number">','<div class="card-back-number"><span class="cvv-countdown"><span class="cvv-minutes"></span><small>хв</small></span>')};
 function update(){const now=Date.now(),slot=Math.floor(now/period),left=period-now%period;
 document.querySelectorAll('.bank-card[data-demo-card]').forEach(el=>{const c=allCards().find(c=>c.id===el.dataset.demoCard);if(!c)return;let hash=0;for(const ch of c.id+String(state.cardSettings?.[c.id]?.demoCVV||'791'))hash=(31*hash+ch.charCodeAt(0))>>>0;
 const code=String((hash+slot*137)%1000).padStart(3,'0'),cvv=el.querySelector('.card-demo-cvv'),ring=el.querySelector('.cvv-countdown');if(cvv&&cvv.textContent!==code)cvv.textContent=code;
 if(ring){const minutes=String(Math.ceil(left/60000)),label=ring.querySelector('.cvv-minutes');if(label.textContent!==minutes)label.textContent=minutes;ring.style.setProperty('--remaining',left/period);ring.setAttribute('aria-label','До оновлення демонстраційного CVV: '+minutes+' хв');}})}
 const oldRender=render;render=function(){oldRender();update()};setInterval(update,1000);document.addEventListener('visibilitychange',update);window.addEventListener('pageshow',update);render();
})();
