from pathlib import Path
p=Path('qa/refresh-durable-v14.js');s=p.read_text();s=s.replace("await page.request.post(url+'api/state',{data:{revision:saved.revision,state:test}});", "const posted=await page.request.post(url+'api/state',{data:{revision:saved.revision,state:test}});check(posted.ok(),'Fixture POST '+posted.status());")
s=s.replace("'Known recipient not found'", "'Known recipient not found: '+await page.evaluate(()=>JSON.stringify({contacts:state.contacts,label:document.querySelector('.recipient-result-label')?.textContent,loading}))")
p.write_text(s)
