from pathlib import Path
p=Path('dist/motion.js');s=p.read_text(encoding='utf-8');a=s.index(" const art=node.querySelector('.bank-card');if(!opening&&from.flipped&&!previous)");b=s.index('\n const full=',a);s=s[:a]+''' const art=node.querySelector('.bank-card');if(!opening&&from.flipped&&!previous){
  // Closing never adds an automatic return spin. Blend the faces while flattening.
  art.style.transform='none';const front=art.querySelector('.bank-card-front'),rear=art.querySelector('.bank-card-back');rear.style.transform='none';
  front.animate([{opacity:0},{opacity:1}],{delay:duration*.45,duration:duration*.45,easing:'ease-out',fill:'both'});
  rear.animate([{opacity:1},{opacity:0}],{delay:duration*.45,duration:duration*.45,easing:'ease-out',fill:'both'})
 }'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('README.md');s=p.read_text(encoding='utf-8');s+='''

## Оновлення v20 — стабільні логотипи картки

Логотипам monobank і VISA задано власні розміри й співвідношення сторін, щоб новий DOM-елемент не мав нульової висоти під час декодування. Рухома поверхня залишається до готовності зображень статичної картки та ще двох кадрів браузера. Покриття й відблиск узгоджено на межі передачі. При закритті зворотного боку прибрано автоматичний поворот назад: сторони змінюються згасанням у процесі згортання. Відкриття/закриття трохи сповільнено до 580/500 мс, налаштування з’являються без окремого блюру кожного значка.

`qa/logo-continuity-v20.js` перевіряє обидві картки: ненульову висоту логотипів, готовність декодування, відсутність незалежної анімації та розбіжність положення менш ніж 0,6 CSS-пікселя при передачі поверхні, а також швидке переривання відкриття. Фізичний iPhone не перевірено. Перегляд: http://127.0.0.1:8080/index.html?v=20#home.
''';p.write_text(s,encoding='utf-8')
