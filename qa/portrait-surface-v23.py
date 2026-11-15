from pathlib import Path
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s=s.replace("const full=node.querySelector('.card-number-full'),masked=node.querySelector('.card-number-masked');if(full&&masked){full.style.display='inline';masked.style.display='none'}", """const full=node.querySelector('.card-number-full'),masked=node.querySelector('.card-number-masked');if(full&&masked){full.style.display='inline';masked.style.display='inline';Object.assign(masked.style,{position:'absolute',left:'0',top:'0'});full.animate(opening?[{opacity:0},{opacity:1}]:[{opacity:1},{opacity:0}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});masked.animate(opening?[{opacity:1},{opacity:0}]:[{opacity:0},{opacity:1}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'})}
 const homeShadow=getComputedStyle(opening?from.snapshot?.querySelector('.card-face .bank-card')||to.querySelector('.bank-card'):to.querySelector('.bank-card')).boxShadow;
 const targetShadow=getComputedStyle(to.querySelector('.bank-card')).boxShadow;
 const scaledHomeShadow=homeShadow.replace(/(-?[\\d.]+)px/g,(_,n)=>(Number(n)/Math.max(.1,ratio))+'px');
 art.animate(opening?[{boxShadow:scaledHomeShadow},{boxShadow:targetShadow}]:[{boxShadow:from.shadow||'none'},{boxShadow:scaledHomeShadow}],{duration,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'});
""")
# The source shadow is already measured before navigation; detached snapshots have no computed style.
s=s.replace("const homeShadow=getComputedStyle(opening?from.snapshot?.querySelector('.card-face .bank-card')||to.querySelector('.bank-card'):to.querySelector('.bank-card')).boxShadow;", "const homeShadow=opening?from.shadow:getComputedStyle(to.querySelector('.bank-card')).boxShadow;")
p.write_text(s,encoding='utf-8')
p=Path('dist/motion.css');s=p.read_text(encoding='utf-8');s+='\n.soft-card-surface .card-printed-number,.card-face .card-printed-number,.expanded-card .card-printed-number{font-size:19px;letter-spacing:1.2px;top:43%;line-height:26px}.soft-card-surface .bank-card{box-shadow:0 14px 30px #02071138}\n';s=s.replace('transition:none!important;box-shadow:0 14px 30px #02071138','transition:none!important;box-shadow:0 14px 30px #02071138');p.write_text(s,encoding='utf-8')
for name in ['index.html','admin.html','sw.js']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('v=22','v=23').replace('mono-mock-v22','mono-mock-v23');p.write_text(s,encoding='utf-8')
