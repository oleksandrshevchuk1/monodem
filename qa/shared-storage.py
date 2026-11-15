from pathlib import Path
import json
p=Path('dist/app.js');s=p.read_text(encoding='utf-8');a=s.index('let state=');b=s.index('\nconst adminMode',a)
# Keep the old bundled sample available only as an explicit admin action.
example={'name':'Демо-користувач','holder':'DEMO USER','card':'0000 0000 0000 0000','account':'Чорна картка','opening':12000,'cashback':261.35,'avatar':None,'transactions':[{'id':'sample-income','title':'Поповнення картки','amount':2500,'date':'2026-11-14','time':'12:40','note':'Приклад надходження','category':'Перекази','cardId':'main'},{'id':'sample-shop','title':'Інтернет-магазин','amount':-1800,'date':'2026-11-14','time':'11:15','note':'Покупки','category':'Покупки','cardId':'main'},{'id':'sample-coffee','title':'Кав’ярня','amount':-219.5,'date':'2026-11-14','time':'09:30','note':'Кава та сніданок','category':'Кафе та ресторани','cardId':'main'}],'files':[],'extraCards':[{'id':'white','account':'Біла картка','color':'white','card':'0000 0000 0000 0001','opening':0}],'activeCard':'main','jars':[],'deposits':[],'categories':[],'contacts':[],'messages':[],'regular':[],'creditLimit':0,'notifications':3,'cardSettings':{}}
Path('data').mkdir(exist_ok=True);Path('data/example.json').write_text(json.dumps(example,ensure_ascii=False,indent=2),encoding='utf-8')
empty={**example,'opening':0,'cashback':0,'transactions':[],'extraCards':[],'notifications':0}
s=s[:a]+'let state='+json.dumps(empty,ensure_ascii=False,separators=(',',':'))+';'+s[b:]
s=s.replace('const icon=n=>','let icon=n=>')
a=s.index("const request=indexedDB.open(");b=s.index('async function change(fn)',a)
s=s[:a]+'''let serverRevision=0,sharedLoading=false,sharedSaving=false;
const blobCache=new WeakMap();
async function serializeState(){const files=await Promise.all(state.files.map(async f=>{if(typeof f.blob==='string')return f;let data=blobCache.get(f.blob);if(!data){data=new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Не вдалося прочитати вкладення'));r.readAsDataURL(f.blob)});blobCache.set(f.blob,data)}return {...f,blob:await data}}));return {...state,files}}
async function hydrateState(value){const files=await Promise.all((value.files||[]).map(async f=>{if(typeof f.blob!=='string')return f;const blob=await(await fetch(f.blob)).blob();blobCache.set(blob,Promise.resolve(f.blob));return {...f,blob}}));return {...value,files}}
async function loadSharedState(force=false){if(sharedLoading||sharedSaving||(!force&&$('#modal').open))return;sharedLoading=true;try{const r=await fetch('/api/state'+(!force&&serverRevision?'?revision='+serverRevision:''),{cache:'no-store'});if(!r.ok)throw Error('Локальний сервер недоступний. Запустіть python server.py');const record=await r.json();if(!record.unchanged){state=await hydrateState(record.state);serverRevision=record.revision;if(!loading)render()}document.documentElement.dataset.storage='saved'}catch(e){document.documentElement.dataset.storage='offline';throw e}finally{sharedLoading=false}}
async function persist(){sharedSaving=true;document.documentElement.dataset.storage='saving';try{const r=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:serverRevision,state:await serializeState()})});const result=await r.json();if(!r.ok){const e=Error(result.error||'Не вдалося зберегти дані');e.conflict=r.status===409;throw e}serverRevision=result.revision;document.documentElement.dataset.storage='saved'}catch(e){document.documentElement.dataset.storage='offline';throw e}finally{sharedSaving=false}}
async function initializeSharedState(){try{await loadSharedState(true)}catch(e){toast(e.message)}loading=false;render()}
window.addEventListener('focus',()=>loadSharedState().catch(()=>{}));
setInterval(()=>{if(document.visibilityState==='visible')loadSharedState().catch(()=>{})},1500);
window.addEventListener('DOMContentLoaded',initializeSharedState);
''' + s[b:]
s=s.replace("state=old;toast(e.message)","state=old;if(e.conflict)await loadSharedState(true);toast(e.message)")
s=s.replace("state=old;$('#error').textContent=err.message", "state=old;if(err.conflict)await loadSharedState(true);$('#error').textContent=err.message")
p.write_text(s,encoding='utf-8')
p=Path('dist/experience.js');s=p.read_text(encoding='utf-8');a=s.index('async function reloadData()');b=s.index("channel?.addEventListener",a);s=s[:a]+"async function reloadData(){await loadSharedState()}\n"+s[b:];s=s.replace("const uiIcon=n=>", "let uiIcon=n=>");s=s.replace("?$('.card-face'):null", "?$('.card-face[data-id=\"'+state.activeCard+'\"]')||$('.card-face'):null");s=s.replace("expandTransition(from,$('.card-face'),false)","expandTransition(from,$('.card-face[data-id=\"'+state.activeCard+'\"]')||$('.card-face'),false)")
s=s.replace('Зміни з’являються у відкритому демо автоматично.','Зміни зберігаються на сервері проєкту та з’являються у відкритих вікнах автоматично.')
s=s.replace('Локальна адмінка без авторизації. Дані спільні для демо й адмінки лише в одному браузері та на тій самій адресі. Для публічного багатокористувацького доступу потрібні сервер і авторизація.','Дані збережені у файлі data/state.json на комп’ютері. Демо й адмінка в різних браузерах та через localhost/127.0.0.1 читають одне сховище. Адмінка локальна, без авторизації.')
s=s.replace("${adminButton('restore','Імпорт копії','','upload-simple')}","${adminButton('restore','Імпорт копії','','upload-simple')}${adminButton('admin-example','Завантажити приклад','','receipt')}")
s=s.replace("const adminOnly=[", "actions['admin-example']=()=>modal('Завантажити приклад?', '<p class=\"info\">Замінити поточні дані збереженим демонстраційним прикладом? Приклад не завантажується автоматично. Спочатку можна експортувати поточні дані.</p>',async()=>{state=await(await fetch('/api/example',{cache:'no-store'})).json()},'Завантажити приклад');\nconst adminOnly=[")
p.write_text(s,encoding='utf-8')
