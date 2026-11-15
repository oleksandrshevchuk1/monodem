from pathlib import Path
p=Path('dist/app.js');s=p.read_text(encoding='utf-8').replace("if(sharedLoading||sharedSaving||(!force&&$('#modal').open))return", "if(sharedLoading||sharedSaving||(!force&&($('#modal').open||document.documentElement.dataset.gesture==='active')))return");p.write_text(s,encoding='utf-8')
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8').replace("'gear','lock-key','wallet'", "'gear','lock-key'")
s=s.replace("return previousCardPage().replace('</button><button class=\"payment-settings\"'", "return previousCardPage().replace(icon('wallet'),'<img class=\"icon\" src=\"assets/reference/wallet.png\" alt=\"\">').replace('</button><button class=\"payment-settings\"'")
p.write_text(s,encoding='utf-8')
