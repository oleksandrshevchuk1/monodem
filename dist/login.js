'use strict';
(async()=>{
 const form=document.querySelector('#login-form'),error=document.querySelector('#auth-error'),button=form.querySelector('button');
 const next=new URLSearchParams(location.search).get('next')==='admin'||location.pathname.startsWith('/admin/')?'/admin/':'/mono/';let setup=false;if(next==='/admin/'){document.querySelector('#login-manifest').href='/admin-manifest.json';document.querySelector('meta[name=apple-mobile-web-app-title]').content='Адмінка'}
 try{const response=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'});const value=await response.json();
  if(response.ok){location.replace(next);return}
  if(response.status!==401&&response.status!==403)throw Error(value.error||'Не вдалося перевірити доступ.');
  setup=value.setupRequired===true;
  if(setup){document.querySelector('#heading').textContent='Створення головного кабінету';document.querySelector('#intro').textContent='Введіть одноразовий ключ власника та задайте свій логін і пароль.';document.querySelector('#setup-key-row').hidden=false;form.elements.setupKey.required=true;form.elements.password.minLength=12;form.elements.password.autocomplete='new-password';button.textContent='Створити головний кабінет';document.querySelector('#footnote').textContent='Одноразовий ключ зберігається у приватному файлі OWNER-SETUP-KEY.txt.'}
 window.dismissLaunchSplash?.();
 }catch(err){error.textContent=err.message;button.disabled=true;window.dismissLaunchSplash?.();return}
 form.onsubmit=async event=>{event.preventDefault();document.activeElement?.blur();window.showLaunchSplash?.();error.textContent='';button.disabled=true;const label=button.textContent;button.textContent='Перевіряємо…';
  try{const payload=Object.fromEntries(new FormData(form));if(setup)payload.setupKey=String(payload.setupKey||'').replace(/\s+/g,'');const response=await fetch('/api/auth/'+(setup?'setup':'login'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)});const value=await response.json();if(!response.ok)throw Error(value.error||'Не вдалося увійти.');form.reset();location.replace(setup&&!location.pathname.startsWith('/mono/')?'/admin/':next)}catch(err){error.textContent=err.message;button.disabled=false;button.textContent=label;window.dismissLaunchSplash?.()}
 };
})();
