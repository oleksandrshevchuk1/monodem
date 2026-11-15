from pathlib import Path
p=Path('dist/surfaces.js');s=p.read_text(encoding='utf-8').replace('<button class="notification-row" data-action="notification-info"><span class="service-symbol orange">${icon(\'gift-fill\')}</span>', '<button class="notification-row" data-action="notification-info" data-id="${esc(n.id)}"><span class="service-symbol ${esc(n.color||\'orange\')}">${icon(n.icon||\'gift-fill\')}</span>');p.write_text(s,encoding='utf-8')
for name in ['index.html','admin.html']:
 p=Path('dist')/name;s=p.read_text(encoding='utf-8').replace('</head>','<link rel="preload" as="image" href="assets/reference/invite-mail.png"></head>');p.write_text(s,encoding='utf-8')
