from pathlib import Path
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8')
s=s.replace("const screen=$('#screen').cloneNode(true);", "const source=$('#screen'),screen=source.cloneNode(true);screen.removeAttribute('id');screen.classList.add('transition-screen');screen.style.paddingBottom=getComputedStyle(source).paddingBottom;screen.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));")
s=s.replace("if(!$('#nav').hidden)surface.append($('#nav').cloneNode(true));", "if(!$('#nav').hidden){const navigation=$('#nav').cloneNode(true);navigation.removeAttribute('id');navigation.classList.add('transition-nav');surface.append(navigation)}")
p.write_text(s,encoding='utf-8')
