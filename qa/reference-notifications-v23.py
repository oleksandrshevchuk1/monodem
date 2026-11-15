import json,urllib.request
base='http://127.0.0.1:8080/'
def get():return json.loads(urllib.request.urlopen(base+'api/state').read())
record=get();state=record['state'];before={k:v for k,v in state.items() if k!='notificationsList'}
examples=[dict(id='reference-message-rewards',title='Таємні Бокси та нагороди',text='А в нас ігри, кеш та нагороди. Залітай — ще до 20 листопада.',icon='star-fill',color='orange',read=True),dict(id='reference-message-security',title='Платіж відхилено з метою безпеки',text='Будь ласка, зверніть увагу.',icon='lock-key',color='lavender',read=True),dict(id='reference-message-delivery',title='Безкоштовна доставка',text='Перше замовлення в Базарі.',icon='gift-fill',color='green',read=True)]
messages=state.setdefault('notificationsList',[])
added=[n for n in examples if not any(x.get('id')==n['id'] or x.get('title')==n['title'] for x in messages)]
if added:
 state['notificationsList']=added+messages
 data=json.dumps({'revision':record['revision'],'state':state},ensure_ascii=False).encode('utf-8')
 urllib.request.urlopen(urllib.request.Request(base+'api/state',data=data,headers={'Content-Type':'application/json'})).read()
after=get()['state'];assert before=={k:v for k,v in after.items() if k!='notificationsList'}
print('Added reference notifications:',len(added),'; all other state fields unchanged')
