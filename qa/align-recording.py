from pathlib import Path
from PIL import Image
im=Image.open('qa/reference/v16-useful.png')
for i,x in enumerate([104,278,452]):im.crop((x,563,x+44,607)).save('dist/assets/reference/useful-'+str(i)+'.png')
for i,x in [(3,148),(4,412)]:im.crop((x,722,x+44,766)).save('dist/assets/reference/useful-'+str(i)+'.png')
im.crop((80,243,115,279)).save('dist/assets/reference/home-limit.png');im.crop((316,243,352,279)).save('dist/assets/reference/home-abroad.png')
p=Path('dist/recording.js');s=p.read_text(encoding='utf-8').replace("referenceImage('abroad-0')}<span>Ліміти", "referenceImage('home-limit')}<span>Ліміти").replace("referenceImage('abroad-2')}<span>Тим", "referenceImage('home-abroad')}<span>Тим");p.write_text(s,encoding='utf-8')
p=Path('dist/recording.css');s=p.read_text(encoding='utf-8');s+='''
/* Final reference alignment: plain body weights, exact icon crops and profile inset. */
.reference-profile button{font-weight:400}.reference-profile small{font-weight:400}.abroad-reference-grid>button{font-weight:400}.home-guide-strip>button{font-weight:500}.useful-small-grid>button,.useful-wide-grid>button{font-weight:500}.home-market-categories button{font-weight:500}.reference-limit-row span{font-weight:400}.reference-limit-row strong{font-weight:600}.reference-limit-row p{font-weight:400}.reference-operation-head>h1{font-weight:400}.reference-invite>span{font-weight:400}.reference-invite>small{font-weight:400}.reference-balance{font-weight:400}.reference-profile button>span{font-weight:400}
#modal[data-kind=profile]{padding-bottom:max(92px,env(safe-area-inset-bottom))}.reference-limits .reference-page>h1{margin-top:12px}.reference-limit-row{margin-bottom:20px}.reference-limit-group>h2{margin-bottom:22px}.limit-note{margin-top:-6px}.home-guide-strip img{border-radius:0;width:27px;height:27px}.home-market-categories button{font-weight:500}
''';p.write_text(s,encoding='utf-8')
p=Path('qa/continuity-v16.js');s=p.read_text(encoding='utf-8').replace("await page.waitForSelector('.home-content');", "await page.waitForSelector('.home-content');await page.evaluate(()=>{state.activeCard='main';newCardSelected=false;render()});",1);p.write_text(s,encoding='utf-8')
