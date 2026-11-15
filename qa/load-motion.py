from pathlib import Path
p=Path('dist/interactions.js');s=p.read_text(encoding='utf-8').replace('bankId:r.bankId||null,logo:r.logo||null','bankId:r.bankId||null,recipientAvatar:r.recipientAvatar||null,logo:r.logo||null');p.write_text(s,encoding='utf-8')
p=Path('dist/recording.js');s=p.read_text(encoding='utf-8').replace("operationBank(t)==='other'?`<button class=\"reference-invite\"", "operationBank(t)==='other'&&t.amount<0?`<button class=\"reference-invite\"");p.write_text(s,encoding='utf-8')
for name in ['index.html','admin.html']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('v=17','v=18').replace('</head>','<link rel="stylesheet" href="motion.css?v=18"></head>').replace('</body>','<script src="motion.js?v=18"></script></body>');p.write_text(s,encoding='utf-8')
p=Path('dist/sw.js');s=p.read_text(encoding='utf-8').replace('v17','v18').replace('v=17','v=18').replace('const ASSETS=[','const ASSETS=["./motion.js?v=18","./motion.css?v=18",');p.write_text(s,encoding='utf-8')
