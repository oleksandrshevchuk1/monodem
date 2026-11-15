from pathlib import Path
p=Path('qa/inspect-recording.js');s=p.read_text(encoding='utf-8');s=s.replace("await page.screenshot(","await page.waitForTimeout(450);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});await page.screenshot(");p.write_text(s,encoding='utf-8')
