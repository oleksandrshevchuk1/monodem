from pathlib import Path
p=Path('dist/experience.js');s=p.read_text(encoding='utf-8')
s=s.replace("+field('Кешбек, ₴','cashback',state.cashback", "+field('Телефон','phone',state.phone||'','tel','maxlength=\"30\"')+field('Електронна пошта','email',state.email||'','email','maxlength=\"100\"')+field('Демо-IBAN','iban',state.iban||'','text','maxlength=\"34\"')+field('Демо-ІПН/ЄДРПОУ','taxId',state.taxId||'','text','maxlength=\"20\"')+field('Усього нараховано кешбеку, ₴','cashbackEarned',state.cashbackEarned??state.cashback,'number','min=\"0\" max=\"999999999\" step=\"0.01\"')+field('Кешбек, ₴','cashback',state.cashback")
s=s.replace("cashback:Number(f.get('cashback')),creditLimit", "phone:f.get('phone'),email:f.get('email'),iban:f.get('iban'),taxId:f.get('taxId'),cashbackEarned:Number(f.get('cashbackEarned')),cashback:Number(f.get('cashback')),creditLimit")
s=s.replace("screen.querySelector('.expanded-card')?.remove()", "screen.querySelector('.expanded-card')?.remove()")
p.write_text(s,encoding='utf-8')
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8').replace("screen.querySelector('.expanded-card')?.remove();", "const expanded=screen.querySelector('.expanded-card');if(expanded)expanded.style.visibility='hidden';");p.write_text(s,encoding='utf-8')
for name in ['index.html','admin.html']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('?v=10','?v=11').replace('<link rel=\"stylesheet\" href=\"refinement.css?v=11\">','<link rel=\"stylesheet\" href=\"refinement.css?v=11\"><link rel=\"stylesheet\" href=\"surfaces.css?v=11\">').replace('<script src=\"refinement.js?v=11\"></script>','<script src=\"refinement.js?v=11\"></script><script src=\"surfaces.js?v=11\"></script>');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('mono-mock-v10','mono-mock-v11').replace('?v=10','?v=11').replace('const ASSETS=[','const ASSETS=["./surfaces.js?v=11", "./surfaces.css?v=11",');p.write_text(s,encoding='utf-8')
