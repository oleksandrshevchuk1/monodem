from pathlib import Path
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s=s.replace('const duration=opening?540:460','const duration=opening?580:500')
a=s.index(" if(opening)session.settings=");b=s.index('\n const start=oldPose',a)
s=s[:a]+" if(opening)session.settings=[...document.querySelectorAll('.card-settings>.payment-settings,.card-settings>h2,.card-settings>.settings-group,.card-close')].map(el=>el.animate([{opacity:.7},{opacity:1}],{duration:360,easing:'cubic-bezier(.32,.72,0,1)',fill:'backwards'}));"+s[b:]
s=s.replace("session.motion.finished.catch(()=>{}).then(()=>{if(softCardSession!==session)return;to.style.opacity='';node.remove();softCardSession=null})", """session.motion.finished.then(async()=>{
  await Promise.all([...to.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
  if(softCardSession!==session||!to.isConnected)return;
  // Match the surface before handing it back; the logos keep identical geometry.
  const sourceGlint=node.querySelector('.card-glint'),targetGlint=to.querySelector('.card-glint');
  if(sourceGlint&&targetGlint){sourceGlint.getAnimations().forEach(a=>a.cancel());sourceGlint.style.opacity=getComputedStyle(targetGlint).opacity;sourceGlint.style.transform=getComputedStyle(targetGlint).transform}
  to.style.opacity='';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(softCardSession!==session)return;node.remove();softCardSession=null}));
 }).catch(()=>{})""")
p.write_text(s,encoding='utf-8')
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8').replace('<img src="assets/reference/card-brand.png" alt="monobank · Universal Bank">','<img src="assets/reference/card-brand.png" width="352" height="78" decoding="sync" alt="monobank · Universal Bank">').replace('<img src="assets/reference/visa.png" alt="Visa">','<img src="assets/reference/visa.png" width="192" height="63" decoding="sync" alt="Visa">');p.write_text(s,encoding='utf-8')
p=Path('dist/motion.css');s=p.read_text(encoding='utf-8');s+='''
/* Stable intrinsic dimensions prevent an image decode from moving either logo. */
.card-brand{aspect-ratio:352/78}.visa{aspect-ratio:192/63}.card-brand>img,.visa>img{width:100%;height:100%;aspect-ratio:inherit;object-fit:contain;display:block}.card-face .bank-card-front,.soft-card-surface .bank-card-front,.expanded-card .bank-card-front{background:linear-gradient(165deg,#282828,#1b1b1b 56%,#0e0e0e)}.card-face .is-white .bank-card-front,.soft-card-surface .is-white .bank-card-front,.expanded-card .is-white .bank-card-front{background:linear-gradient(#a7abc4,#e8e8ee)}.soft-card-surface,.card-face,.expanded-card{backface-visibility:hidden;-webkit-backface-visibility:hidden}.soft-card-surface .card-brand,.soft-card-surface .visa{animation:none!important;transition:none!important}.soft-card-backdrop{max-height:100dvh}.soft-card-surface .bank-card-front,.card-face .bank-card-front,.expanded-card .bank-card-front{contain:paint}
''';p.write_text(s,encoding='utf-8')
for name in ['index.html','admin.html','sw.js']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('v=19','v=20').replace('mono-mock-v19','mono-mock-v20');p.write_text(s,encoding='utf-8')
