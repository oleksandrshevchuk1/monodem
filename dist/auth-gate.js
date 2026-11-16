'use strict';
// No application scripts or stored profile data load until the server checks the session.
(async()=>{
 const next=/^\/admin/.test(location.pathname)?'admin':'mono';
 const goLogin=()=>{window.showLaunchSplash?.();document.documentElement.classList.add('booting');location.replace('/'+next+'/login.html?next='+next)};
 try{
  const response=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'});
  if(response.status===401||response.status===403){goLogin();return}
  if(!response.ok)throw Error('Не вдалося перевірити доступ. Спробуйте ще раз.');
  const {user}=await response.json();window.cabinetUser=user;
  const selected=sessionStorage.getItem('cabinet-workspace:'+user.id);
  window.cabinetWorkspace=['owner','admin'].includes(user.role)?selected||user.id:user.id;
  if(window.cabinetWorkspace!==user.id){const permitted=await fetch('/api/auth/users',{credentials:'same-origin',cache:'no-store'});if(permitted.status===401){goLogin();return}if(!permitted.ok)throw Error('Не вдалося перевірити доступ до кабінету.');const list=(await permitted.json()).users;if(!list.some(account=>account.id===window.cabinetWorkspace)){window.cabinetWorkspace=user.id;sessionStorage.removeItem('cabinet-workspace:'+user.id)}}
  const prefix='cabinet:'+user.id+':'+window.cabinetWorkspace+':';
  window.cabinetStorage={getItem:key=>localStorage.getItem(prefix+key),setItem:(key,value)=>localStorage.setItem(prefix+key,value),removeItem:key=>localStorage.removeItem(prefix+key)};
  if(user.role==='owner'&&window.cabinetWorkspace===user.id)for(const key of ['demo-entry','demo-pin','demo-face','entry-identity-cache'])if(cabinetStorage.getItem(key)===null&&localStorage.getItem(key)!==null)cabinetStorage.setItem(key,localStorage.getItem(key));
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,options={})=>{
   const url=new URL(typeof input==='string'?input:input.url,location.href);
   if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
   const headers=new Headers(options.headers||(input instanceof Request?input.headers:undefined));
   if(!url.pathname.startsWith('/api/auth/'))headers.set('X-Workspace-Id',window.cabinetWorkspace);
   const result=await nativeFetch(input,{...options,headers,credentials:'same-origin'});
   if(result.status===401){goLogin();throw Error('Сесію завершено. Увійдіть знову.')}
   if(result.status===403){const value=await result.clone().json().catch(()=>({}));if(value.code==='ACCOUNT_INACTIVE'){goLogin();throw Error(value.error)}if(url.pathname==='/api/state'&&window.cabinetWorkspace!==user.id){sessionStorage.removeItem('cabinet-workspace:'+user.id);document.documentElement.classList.add('booting');location.replace('/'+next+'/');throw Error('Доступ до вибраного кабінету змінено.')}}
   return result;
  };
  await Promise.all(JSON.parse(document.getElementById('app-bundle').textContent).map(source=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=source;script.async=false;script.onload=resolve;script.onerror=()=>reject(Error('Не вдалося завантажити застосунок.'));document.body.append(script)})));
  await initializeSharedState();
  setInterval(()=>{if(document.visibilityState==='visible')window.fetch('/api/auth/session',{cache:'no-store'}).catch(()=>{})},60000);
 }catch(error){
  document.documentElement.classList.remove('booting');document.body.replaceChildren();
  const panel=document.createElement('main');panel.className='auth-card';const title=document.createElement('h1');title.textContent='Не вдалося відкрити кабінет';const text=document.createElement('p');text.textContent=error.message;const retry=document.createElement('button');retry.className='primary';retry.textContent='Повторити';retry.onclick=()=>location.reload();panel.append(title,text,retry);document.body.append(panel);
 }
})();
