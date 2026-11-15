from pathlib import Path
p=Path('qa/transfer-card-v14.js');s=p.read_text();s=s.replace("await page.locator('.card-face').first().click()", "await page.locator('.card-face').nth(await page.evaluate(()=>allCards().findIndex(c=>c.id===state.activeCard))).click()");p.write_text(s)
