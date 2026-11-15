from pathlib import Path
import json
p=Path('dist/motion.css');s=p.read_text(encoding='utf-8').replace('clip-path:inset(0 round 20px 20px 0 0)','clip-path:none');p.write_text(s,encoding='utf-8')
items=json.loads(Path('qa/bank-assets-v23.json').read_text(encoding='utf-8'));names={'privat':'ПриватБанк','oschad':'Ощадбанк','ukrsib':'UKRSIBBANK','otp':'OTP Банк'}
new=[{'id':v['id'],'name':names[v['id']],'bankType':'other','logo':v['logo']} for v in items if 'logo' in v]
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s+='\ndemoBanks.splice(demoBanks.length-1,0,...'+json.dumps(new,ensure_ascii=False)+');\n';s+='''
const bankPresetBeforeExpandedNames=bankPreset;bankPreset=function(person){if(!person?.bankId){const value=String(person?.bankName||'').toLowerCase(),id=/приват|privat/.test(value)?'privat':/укрсиб|ukrsib/.test(value)?'ukrsib':/отп|otp/.test(value)?'otp':null;if(id)return demoBanks.find(b=>b.id===id)||bankPresetBeforeExpandedNames(person)}return bankPresetBeforeExpandedNames(person)};
actions['notification-info']=button=>{const message=state.notificationsList?.find(n=>n.id===button?.dataset.id);inform(message?.title||'Повідомлення',message?esc(message.text):'Повідомлення демонстраційного проєкту.')};
for(const name of ['invite-mail','bank-pumb','bank-sense','bank-abank','bank-raif','bank-privat','bank-ukrsib','bank-otp']){const img=new Image();img.src='assets/reference/'+name+'.png';img.decode().catch(()=>{});decodedIconImages.push(img)}
''';p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8');s=s.replace('const ASSETS=[','const ASSETS=['+','.join(json.dumps('./'+v['logo']) for v in new)+',');p.write_text(s,encoding='utf-8')
