'use strict';
// Enhance both the login form and password forms mounted later in dialogs.
(() => {
 const style=document.createElement('style');
 style.textContent='.secret-control{display:flex;align-items:stretch;gap:8px;min-width:0}.secret-control>input{flex:1;min-width:0;width:0}.secret-control>button{flex:none;align-self:stretch;min-height:44px;margin-top:8px;padding:8px 10px;border:1px solid #55555d;border-radius:10px;background:#29292c;color:#eee;font:inherit;font-size:13px;cursor:pointer}.secret-control>button:focus-visible{outline:2px solid #a8bfff;outline-offset:2px}';
 document.head.append(style);
 let sequence=0;
 function enhance(){
  document.querySelectorAll('input[type="password"]:not([data-secret-control])').forEach(input=>{
   input.dataset.secretControl='true';
   if(!input.id)input.id='secret-field-'+(++sequence);
   const wrapper=document.createElement('span'),toggle=document.createElement('button');
   wrapper.className='secret-control';toggle.type='button';toggle.textContent='Показати';
   toggle.setAttribute('aria-controls',input.id);toggle.setAttribute('aria-pressed','false');
   const subject=input.name==='setupKey'?'ключ':'пароль';
   toggle.setAttribute('aria-label','Показати '+subject);
   input.before(wrapper);wrapper.append(input,toggle);
   toggle.addEventListener('click',()=>{
    const visible=input.type==='password';input.type=visible?'text':'password';
    toggle.textContent=visible?'Сховати':'Показати';
    toggle.setAttribute('aria-pressed',String(visible));
    toggle.setAttribute('aria-label',(visible?'Сховати ':'Показати ')+subject);
   });
   input.form?.addEventListener('reset',()=>{
    input.type='password';toggle.textContent='Показати';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label','Показати '+subject);
   });
  });
 }
 enhance();new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
})();
