from pathlib import Path
p=Path('dist/app.js');s=p.read_text(encoding='utf-8').replace("if(!record.unchanged){state=await hydrateState(record.state);serverRevision=record.revision;if(!loading)render()}","if(!record.unchanged&&!sharedSaving&&(force||!$('#modal').open)){const next=await hydrateState(record.state);if(!sharedSaving&&(force||!$('#modal').open)){state=next;serverRevision=record.revision;if(!loading)render()}}")
p.write_text(s,encoding='utf-8')
