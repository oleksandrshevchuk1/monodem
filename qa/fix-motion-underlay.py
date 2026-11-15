from pathlib import Path
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');s=s.replace("const snapshot=captureBankSurface();snapshot.className='operations-home-underlay';", "const snapshot=captureBankSurface(),source=$('#screen'),copy=source.cloneNode(true);copy.removeAttribute('id');copy.classList.add('transition-screen');copy.style.paddingBottom=getComputedStyle(source).paddingBottom;copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));snapshot.firstElementChild.replaceWith(copy);snapshot.className='operations-home-underlay home';")
p.write_text(s,encoding='utf-8')
