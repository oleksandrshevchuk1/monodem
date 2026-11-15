from pathlib import Path
p=Path('server.py');s=p.read_text(encoding='utf-8').replace("'version':10","'version':11");p.write_text(s,encoding='utf-8')
p=Path('dist/surfaces.js');s=p.read_text(encoding='utf-8').replace("language:form.get('language')", "language:form.get('language')")
s=s.replace("end:form.get('end')});try", "end:form.get('end'),language:form.get('language')});try")
p.write_text(s,encoding='utf-8')
