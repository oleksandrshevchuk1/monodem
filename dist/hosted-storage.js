'use strict';
const browserStorageMode=!['localhost','127.0.0.1','[::1]'].includes(location.hostname)||new URLSearchParams(location.search).has('browser-storage');
if(browserStorageMode){
 const originalSharedLoad=loadSharedState,originalSharedPersist=persist;
 const nativeFetch=window.fetch.bind(window);
 let hostedSyncMode='checking',nextStorageCheck=0,localMigration=null,migrationOffered=false;
 const hostedReadFile=readFile;readFile=async function(file){if(file?.type==='application/pdf'&&file.size>4*1024*1024)throw Error('Для Vercel виберіть PDF розміром до 4 МБ.');return hostedReadFile(file)};
 const browserDatabase=new Promise((resolve,reject)=>{const request=indexedDB.open('mono-hosted-state',1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
 async function browserRecord(mode,update){const database=await browserDatabase;return new Promise((resolve,reject)=>{const transaction=database.transaction('records',mode),store=transaction.objectStore('records'),request=store.get('state');let result;request.onsuccess=()=>{try{result=update?update(request.result):request.result;if(update)store.put(result,'state')}catch(error){reject(error);transaction.abort()}};transaction.oncomplete=()=>resolve(result);transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error||Error('Storage aborted'))})}
 function syncNotice(){if(!adminMode)return;let notice=document.querySelector('#hosted-sync-notice');if(!notice){notice=document.createElement('p');notice.id='hosted-sync-notice';Object.assign(notice.style,{margin:'12px 16px',padding:'12px',fontSize:'14px',color:'#ddd',background:'#292929',borderRadius:'12px'});document.querySelector('#app').prepend(notice)}notice.textContent=hostedSyncMode==='shared'?'Синхронізацію підключено · зміни з’являються на всіх пристроях.':hostedSyncMode==='checking'?'Перевіряємо синхронізацію…':'Дані лише в цьому браузері. Для синхронізації підключіть Upstash Redis у Vercel → Storage та повторно задеплойте проєкт.'}
 const renderBeforeHostedSync=render;render=function(){renderBeforeHostedSync();syncNotice()};
 loadSharedState=async function(force=false){
  if(sharedLoading||sharedSaving||(!force&&(document.querySelector('#modal').open||document.documentElement.dataset.gesture==='active'||document.documentElement.dataset.routeMotion==='active'||document.documentElement.dataset.editing==='true')))return;
  sharedLoading=true;
  try{
   let record=null;
   if(hostedSyncMode!=='local'||Date.now()>=nextStorageCheck){
    const response=await nativeFetch('/api/state'+(hostedSyncMode==='shared'&&!force&&serverRevision?'?revision='+serverRevision:''),{cache:'no-store'});
    const value=await response.json();
    if(response.status===503&&value.code==='STORAGE_NOT_CONFIGURED'){hostedSyncMode='local';nextStorageCheck=Date.now()+30000}
    else {if(!response.ok)throw Error(value.error||'Не вдалося синхронізувати дані');hostedSyncMode='shared';record=value}
   }
   if(hostedSyncMode==='local')record=await browserRecord('readonly');
   if(record&&!record.unchanged&&(force||record.revision!==serverRevision||hostedSyncMode==='shared')){
    if(hostedSyncMode==='shared'&&adminMode&&!migrationOffered&&record.revision===1){const local=await browserRecord('readonly');if(local?.state&&(local.state.name!=='Демо-користувач'||local.state.transactions?.length||local.state.files?.length))localMigration=local}
    const next=await hydrateState(record.state);
    if(!sharedSaving&&(force||(!document.querySelector('#modal').open&&document.documentElement.dataset.gesture!=='active'&&document.documentElement.dataset.routeMotion!=='active'))){state=next;serverRevision=record.revision;if(!loading)render()}
   }
   document.documentElement.dataset.storage=hostedSyncMode==='shared'?'saved':'local';syncNotice();
   if(localMigration&&!migrationOffered){migrationOffered=true;setTimeout(()=>{if(document.querySelector('#modal').open)return;modal('Перенести дані з цієї адмінки?', '<p>Спільне сховище порожнє. Перенести сюди ваші збережені дані, щоб вони з’явились на телефоні?</p>',async()=>{state=await hydrateState(localMigration.state)},'Перенести')},500)}
  }catch(error){document.documentElement.dataset.storage='offline';throw error}finally{sharedLoading=false}
 };
 persist=async function(){
  if(hostedSyncMode==='shared')return originalSharedPersist();
  if(hostedSyncMode==='checking')throw Error('Зачекайте завершення перевірки синхронізації.');
  sharedSaving=true;try{const value=await serializeState(),expected=serverRevision;const record=await browserRecord('readwrite',current=>{if(current&&current.revision!==expected){const error=Error('Дані змінились в іншій вкладці. Оновіть сторінку.');error.conflict=true;throw error}return {revision:(current?.revision||0)+1,state:value}});serverRevision=record.revision;document.documentElement.dataset.storage='local'}finally{sharedSaving=false}
 };
 window.fetch=async function(input,options){const url=new URL(typeof input==='string'?input:input.url,location.href);if(url.origin===location.origin&&url.pathname==='/api/statement.xlsx'&&(!options?.method||options.method==='GET')){const value=await serializeState();value.files=[];value.avatar=null;return nativeFetch('/api/statement.xlsx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:value,query:Object.fromEntries(url.searchParams)})})}return nativeFetch(input,options)};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadSharedState().catch(()=>{})});
}
